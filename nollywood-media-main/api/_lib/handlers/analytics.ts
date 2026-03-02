import type { VercelRequest, VercelResponse } from '@vercel/node';
import { query } from '../db.js';
import { getUserFromRequest } from '../auth.js';

export async function log(req: VercelRequest, res: VercelResponse) {
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
    const { contentId, contentType, eventType, value, metadata } = req.body;
    const user = getUserFromRequest(req);
    const userId = user?.userId;

    try {
        await query(
            'INSERT INTO engagement_metrics (user_id, content_id, content_type, event_type, value, metadata) VALUES ($1, $2, $3, $4, $5, $6)',
            [userId, contentId, contentType, eventType, value || 0, metadata || {}]
        );

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
    } catch (err) {
        console.error('Logging error:', err);
        return res.status(500).json({ error: 'Failed to log engagement' });
    }
}

export async function recommendations(req: VercelRequest, res: VercelResponse) {
    if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });
    const { limit = 10 } = req.query;
    const user = getUserFromRequest(req);
    const userId = user?.userId;

    try {
        let results;
        if (userId) {
            results = await query(`
                WITH personalized AS (
                    SELECT content_id, content_type, score * 2 as boost FROM recommendation_scores WHERE user_id = $1
                ),
                trending AS (
                    SELECT id as content_id, 'film' as content_type, calculate_trending_velocity(id, 'film') as velocity FROM films
                )
                SELECT f.*, COALESCE(p.boost, 0) + COALESCE(t.velocity, 0) as total_rank
                FROM films f
                LEFT JOIN personalized p ON f.id = p.content_id
                LEFT JOIN trending t ON f.id = t.content_id
                ORDER BY total_rank DESC LIMIT $2
            `, [userId, limit]);
        } else {
            results = await query(`
                SELECT f.*, calculate_trending_velocity(f.id, 'film') as velocity FROM films f ORDER BY velocity DESC LIMIT $1
            `, [limit]);
        }
        return res.status(200).json(results);
    } catch (err) {
        console.error('Recommendation error:', err);
        return res.status(500).json({ error: 'Failed to fetch recommendations' });
    }
}

export async function counts(req: VercelRequest, res: VercelResponse) {
    try {
        const [filmsRes, usersRes, creatorsRes, viewsRes] = await Promise.all([
            query('SELECT count(*) FROM films'),
            query('SELECT count(*) FROM user_profiles'),
            query('SELECT count(*) FROM creator_profiles'),
            query('SELECT sum(views) FROM films')
        ]);
        return res.status(200).json({
            totalFilms: parseInt(filmsRes[0].count) || 0,
            totalUsers: parseInt(usersRes[0].count) || 0,
            totalCreators: parseInt(creatorsRes[0].count) || 0,
            totalViews: parseInt(viewsRes[0].sum) || 0,
            totalCountries: 15
        });
    } catch (err) {
        console.error('Analytics error:', err);
        return res.status(500).json({ error: 'Failed to fetch analytics' });
    }
}
