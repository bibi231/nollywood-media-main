import type { VercelRequest, VercelResponse } from '@vercel/node';
import { query } from '../_lib/db.js';
import { getUserFromRequest, corsHeaders } from '../_lib/auth.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
    Object.entries(corsHeaders()).forEach(([k, v]) => res.setHeader(k, v));
    if (req.method === 'OPTIONS') return res.status(200).end();
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

    const { contentId, contentType, eventType, value, metadata } = req.body;
    const user = getUserFromRequest(req);
    const userId = user?.userId;

    try {
        await query(
            'INSERT INTO engagement_metrics (user_id, content_id, content_type, event_type, value, metadata) VALUES ($1, $2, $3, $4, $5, $6)',
            [userId, contentId, contentType, eventType, value || 0, metadata || {}]
        );

        // Update recommendation score for this user/content pair
        if (userId) {
            let increment = 0;
            switch (eventType) {
                case 'view': increment = 1; break;
                case 'watch_time': increment = value * 0.01; break; // 1 point per 100s
                case 'like': increment = 10; break;
                case 'share': increment = 15; break;
                case 'complete': increment = 20; break;
            }

            await query(
                `INSERT INTO recommendation_scores (user_id, content_id, content_type, score)
                 VALUES ($1, $2, $3, $4)
                 ON CONFLICT (user_id, content_id, content_type)
                 DO UPDATE SET score = recommendation_scores.score + $4, last_updated = NOW()`,
                [userId, contentId, contentType, increment]
            );
        }

        return res.status(200).json({ success: true });
    } catch (err: any) {
        console.error('Logging error:', err);
        return res.status(500).json({ error: 'Failed to log engagement' });
    }
}
