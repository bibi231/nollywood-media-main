import type { VercelRequest, VercelResponse } from '@vercel/node';
import { query } from './_lib/db.js';
import { getUserFromRequest, corsHeaders } from './_lib/auth.js';

/**
 * Generic query endpoint — replaces PostgREST/Supabase .from() calls
 * 
 * POST /api/query
 * Body: { table, operation, columns, filters, data, order, limit, offset, upsertConflict, single }
 * 
 * Deployment Trigger: Final API Fix 2
 */

// Tables the frontend is allowed to query
const ALLOWED_TABLES = [
    'films', 'film_comments', 'film_likes', 'comment_likes', 'content_ratings',
    'user_profiles', 'user_roles', 'user_content_uploads', 'user_uploads',
    'watch_history', 'watchlists', 'user_follows', 'creator_profiles',
    'user_preferences', 'notifications', 'playback_events', 'trending_content',
    'content_reports', 'playlists', 'playlist_items', 'watch_progress', 'users',
];

// Tables that require authentication
const AUTH_REQUIRED_TABLES = [
    'user_content_uploads', 'user_uploads', 'watch_history', 'watchlists',
    'user_follows', 'user_preferences', 'notifications', 'playlists',
    'playlist_items', 'watch_progress', 'content_reports',
];

// Public-read tables
const PUBLIC_READ_TABLES = [
    'films', 'film_comments', 'film_likes', 'comment_likes', 'content_ratings',
    'user_profiles', 'creator_profiles', 'trending_content', 'playback_events',
];

interface QueryFilter {
    column: string;
    op: string; // eq, neq, in, gt, lt, gte, lte, like, ilike, is, contains
    value: any;
}

interface QueryRequest {
    table: string;
    operation: 'select' | 'insert' | 'update' | 'delete' | 'upsert';
    columns?: string;
    filters?: QueryFilter[];
    data?: Record<string, any> | Record<string, any>[];
    order?: { column: string; ascending?: boolean }[];
    limit?: number;
    offset?: number;
    upsertConflict?: string;
    single?: boolean;
    count?: 'exact' | null;
    head?: boolean;
}

function sanitizeIdentifier(name: string): string {
    // Only allow alphanumeric, underscore — prevents SQL injection in identifiers
    if (!name) return '';
    return String(name).replace(/[^a-zA-Z0-9_]/g, '');
}

function buildWhereClause(filters: QueryFilter[], startParam: number = 1): { clause: string; params: any[] } {
    if (!filters || filters.length === 0) return { clause: '', params: [] };

    const conditions: string[] = [];
    const params: any[] = [];
    let paramIdx = startParam;

    for (const f of filters) {
        const col = sanitizeIdentifier(f.column);
        switch (f.op) {
            case 'eq':
                conditions.push(`${col} = $${paramIdx}`);
                params.push(f.value);
                paramIdx++;
                break;
            case 'neq':
                conditions.push(`${col} != $${paramIdx}`);
                params.push(f.value);
                paramIdx++;
                break;
            case 'gt':
                conditions.push(`${col} > $${paramIdx}`);
                params.push(f.value);
                paramIdx++;
                break;
            case 'gte':
                conditions.push(`${col} >= $${paramIdx}`);
                params.push(f.value);
                paramIdx++;
                break;
            case 'lt':
                conditions.push(`${col} < $${paramIdx}`);
                params.push(f.value);
                paramIdx++;
                break;
            case 'lte':
                conditions.push(`${col} <= $${paramIdx}`);
                params.push(f.value);
                paramIdx++;
                break;
            case 'like':
                conditions.push(`${col} LIKE $${paramIdx}`);
                params.push(f.value);
                paramIdx++;
                break;
            case 'ilike':
                conditions.push(`${col} ILIKE $${paramIdx}`);
                params.push(f.value);
                paramIdx++;
                break;
            case 'in':
                if (Array.isArray(f.value)) {
                    const placeholders = f.value.map(() => `$${paramIdx++}`);
                    conditions.push(`${col} IN (${placeholders.join(', ')})`);
                    params.push(...f.value);
                }
                break;
            case 'is':
                if (f.value === null) {
                    conditions.push(`${col} IS NULL`);
                } else {
                    conditions.push(`${col} IS $${paramIdx}`);
                    params.push(f.value);
                    paramIdx++;
                }
                break;
            case 'contains':
                conditions.push(`${col} @> $${paramIdx}`);
                params.push(f.value);
                paramIdx++;
                break;
            default:
                conditions.push(`${col} = $${paramIdx}`);
                params.push(f.value);
                paramIdx++;
        }
    }

    return { clause: conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '', params };
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
    Object.entries(corsHeaders()).forEach(([k, v]) => res.setHeader(k, v));
    if (req.method === 'OPTIONS') return res.status(200).end();
    if (req.method !== 'POST') return res.status(405).json({ data: null, error: { message: 'Method not allowed' } });

    try {
        let body: QueryRequest = req.body;
        if (typeof body === 'string') {
            try { body = JSON.parse(body); } catch { /* ignore */ }
        }

        const { table, operation, columns, filters, data, order, limit, offset, upsertConflict, single, count, head } = body || {};

        if (!table) {
            return res.status(400).json({ data: null, error: { message: 'Missing table name' } });
        }

        const safeTable = sanitizeIdentifier(table).trim();
        const isAllowed = ALLOWED_TABLES.some(t => t.trim() === safeTable);

        console.log('DEBUG_QUERY_V3:', { table, safeTable, isAllowed, op: operation });

        if (!isAllowed && safeTable !== 'films') {
            return res.status(400).json({
                data: null,
                error: { message: `Table '${table}' is not allowed (sanitized: '${safeTable}')` }
            });
        }

        // Validate auth
        const user = getUserFromRequest(req);
        const authRequired = AUTH_REQUIRED_TABLES.includes(safeTable) && !PUBLIC_READ_TABLES.includes(safeTable);

        if (authRequired && !user && operation !== 'select') {
            return res.status(401).json({ data: null, error: { message: 'Authentication required' } });
        }

        // Write operations require auth (except public tables)
        if (['insert', 'update', 'delete', 'upsert'].includes(operation) && !user) {
            return res.status(401).json({ data: null, error: { message: 'Authentication required for write operations' } });
        }

        switch (operation) {
            case 'select': {
                const selectCols = columns || '*';

                // Handle count queries
                if (count === 'exact' && head) {
                    const { clause, params } = buildWhereClause(filters || []);
                    const countSql = `SELECT COUNT(*) as count FROM ${safeTable} ${clause}`;
                    const result = await query(countSql, params);
                    return res.status(200).json({ data: null, count: parseInt(result[0]?.count || '0'), error: null });
                }

                // Handle simple column references (strip complex Supabase join syntax)
                let safeCols = '*';
                if (selectCols && selectCols !== '*') {
                    // Strip Supabase join syntax like "user_profile:user_profiles!fk(col1, col2)"
                    if (selectCols.includes('!') || selectCols.includes(':')) {
                        safeCols = '*'; // Fall back to * for complex selects — we'll join in code
                    } else {
                        safeCols = selectCols.split(',').map(c => sanitizeIdentifier(c.trim())).join(', ');
                    }
                }

                const { clause, params } = buildWhereClause(filters || []);

                let sql = `SELECT ${safeCols} FROM ${safeTable} ${clause}`;

                if (order && order.length > 0) {
                    const orderClauses = order.map(o =>
                        `${sanitizeIdentifier(o.column)} ${o.ascending === false ? 'DESC' : 'ASC'}`
                    );
                    sql += ` ORDER BY ${orderClauses.join(', ')}`;
                }

                if (limit) sql += ` LIMIT ${parseInt(String(limit))}`;
                if (offset) sql += ` OFFSET ${parseInt(String(offset))}`;

                const result = await query(sql, params);

                if (single) {
                    return res.status(200).json({ data: result[0] || null, error: null });
                }

                return res.status(200).json({ data: result, error: null });
            }

            case 'insert': {
                if (!data) return res.status(400).json({ data: null, error: { message: 'No data to insert' } });

                const records = Array.isArray(data) ? data : [data];
                if (records.length === 0) return res.status(200).json({ data: [], error: null });

                const cols = Object.keys(records[0]).map(sanitizeIdentifier);
                const allResults: any[] = [];

                for (const record of records) {
                    const values = cols.map((_, i) => `$${i + 1}`);
                    const sql = `INSERT INTO ${safeTable} (${cols.join(', ')}) VALUES (${values.join(', ')}) RETURNING *`;
                    const params = cols.map(c => record[c]);
                    const result = await query(sql, params);
                    allResults.push(...result);
                }

                return res.status(200).json({
                    data: Array.isArray(data) ? allResults : allResults[0] || null,
                    error: null,
                });
            }

            case 'update': {
                if (!data) return res.status(400).json({ data: null, error: { message: 'No data to update' } });

                const setCols = Object.keys(data).map(sanitizeIdentifier);
                const setClause = setCols.map((c, i) => `${c} = $${i + 1}`).join(', ');
                const setParams = setCols.map(c => (data as any)[c]);

                const { clause, params: whereParams } = buildWhereClause(filters || [], setCols.length + 1);

                const sql = `UPDATE ${safeTable} SET ${setClause} ${clause} RETURNING *`;
                const result = await query(sql, [...setParams, ...whereParams]);

                return res.status(200).json({ data: result, error: null });
            }

            case 'delete': {
                const { clause, params } = buildWhereClause(filters || []);
                if (!clause) {
                    return res.status(400).json({ data: null, error: { message: 'DELETE without filters is not allowed' } });
                }

                const sql = `DELETE FROM ${safeTable} ${clause} RETURNING *`;
                const result = await query(sql, params);

                return res.status(200).json({ data: result, error: null });
            }

            case 'upsert': {
                if (!data) return res.status(400).json({ data: null, error: { message: 'No data to upsert' } });

                const record = Array.isArray(data) ? data[0] : data;
                const cols = Object.keys(record).map(sanitizeIdentifier);
                const values = cols.map((_, i) => `$${i + 1}`);
                const conflict = upsertConflict ? upsertConflict.split(',').map(sanitizeIdentifier).join(', ') : cols[0];
                const updateSet = cols.filter(c => !conflict.includes(c)).map(c => `${c} = EXCLUDED.${c}`).join(', ');

                let sql = `INSERT INTO ${safeTable} (${cols.join(', ')}) VALUES (${values.join(', ')})`;
                sql += ` ON CONFLICT (${conflict})`;
                if (updateSet) {
                    sql += ` DO UPDATE SET ${updateSet}`;
                } else {
                    sql += ` DO NOTHING`;
                }
                sql += ` RETURNING *`;

                const params = cols.map(c => record[c]);
                const result = await query(sql, params);

                return res.status(200).json({ data: result[0] || null, error: null });
            }

            default:
                return res.status(400).json({ data: null, error: { message: `Unknown operation: ${operation}` } });
        }
    } catch (err: any) {
        console.error('Query error:', err);
        return res.status(500).json({ data: null, error: { message: err.message || 'Internal server error' } });
    }
}
