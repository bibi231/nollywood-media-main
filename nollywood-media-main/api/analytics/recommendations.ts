import type { VercelRequest, VercelResponse } from '@vercel/node';
import { query } from '../_lib/db.js';
import { getUserFromRequest, corsHeaders } from '../_lib/auth.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
    Object.entries(corsHeaders()).forEach(([k, v]) => res.setHeader(k, v));
    if (req.method === 'OPTIONS') return res.status(200).end();
    if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

    const { limit = 10 } = req.query;
    const user = getUserFromRequest(req);
    const userId = user?.userId;

    try {
        let results;

        if (userId) {
            // Hybrid: Personalized scores + Global trending
            results = await query(`
                WITH personalized AS (
                    SELECT content_id, content_type, score * 2 as boost
                    FROM recommendation_scores
                    WHERE user_id = $1
                ),
                trending AS (
                    SELECT id as content_id, 'film' as content_type, calculate_trending_velocity(id, 'film') as velocity
                    FROM films
                )
                SELECT f.*, COALESCE(p.boost, 0) + COALESCE(t.velocity, 0) as total_rank
                FROM films f
                LEFT JOIN personalized p ON f.id = p.content_id
                LEFT JOIN trending t ON f.id = t.content_id
                ORDER BY total_rank DESC
                LIMIT $2
            `, [userId, limit]);
        } else {
            // Global trending only for guests
            results = await query(`
                SELECT f.*, calculate_trending_velocity(f.id, 'film') as velocity
                FROM films f
                ORDER BY velocity DESC
                LIMIT $1
            `, [limit]);
        }

        return res.status(200).json(results);
    } catch (err: any) {
        console.error('Recommendation error:', err);
        return res.status(500).json({ error: 'Failed to fetch recommendations' });
    }
}
