/**
 * AUDIT LOGGING — Phase 11 Zero-Trust Security
 * 
 * Logs all security-sensitive actions to the database.
 * Tracks: admin actions, auth events, data mutations, API key usage
 */

import type { VercelRequest } from '@vercel/node';
import { query } from './db';
import { getClientIp } from './rateLimit';

export type AuditAction =
    | 'auth.login'
    | 'auth.login_failed'
    | 'auth.signup'
    | 'auth.logout'
    | 'auth.password_reset'
    | 'admin.content_approve'
    | 'admin.content_reject'
    | 'admin.content_delete'
    | 'admin.user_ban'
    | 'admin.user_unban'
    | 'admin.settings_update'
    | 'content.upload'
    | 'content.delete'
    | 'content.update'
    | 'ai.generate'
    | 'payment.subscription_change'
    | 'payment.webhook_received'
    | 'security.rate_limit_hit'
    | 'security.invalid_token'
    | 'security.suspicious_activity';

interface AuditLogEntry {
    action: AuditAction;
    userId?: string;
    targetId?: string;
    targetType?: string;
    metadata?: Record<string, any>;
    req?: VercelRequest;
}

/**
 * Log a security-sensitive action to the audit trail.
 * Fails silently — audit logging should never break user operations.
 */
export async function auditLog(entry: AuditLogEntry): Promise<void> {
    try {
        const ip = entry.req ? getClientIp(entry.req) : 'unknown';
        const userAgent = entry.req?.headers['user-agent'] || 'unknown';

        await query(
            `INSERT INTO audit_logs (
                action, user_id, target_id, target_type,
                ip_address, user_agent, metadata, created_at
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())`,
            [
                entry.action,
                entry.userId || null,
                entry.targetId || null,
                entry.targetType || null,
                ip,
                userAgent.substring(0, 255),
                entry.metadata ? JSON.stringify(entry.metadata) : null,
            ]
        );
    } catch (err) {
        console.error('[Audit] Failed to log:', entry.action, err);
        // Never throw — audit failures must not crash the operation
    }
}

/**
 * Query audit logs for admin dashboard.
 */
export async function getAuditLogs(opts: {
    userId?: string;
    action?: AuditAction;
    limit?: number;
    offset?: number;
}) {
    const conditions: string[] = [];
    const params: any[] = [];
    let paramIndex = 1;

    if (opts.userId) {
        conditions.push(`user_id = $${paramIndex++}`);
        params.push(opts.userId);
    }
    if (opts.action) {
        conditions.push(`action = $${paramIndex++}`);
        params.push(opts.action);
    }

    const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
    const limit = Math.min(opts.limit || 50, 200);
    const offset = opts.offset || 0;

    params.push(limit, offset);

    return await query(
        `SELECT * FROM audit_logs ${where} 
         ORDER BY created_at DESC 
         LIMIT $${paramIndex++} OFFSET $${paramIndex}`,
        params
    );
}
