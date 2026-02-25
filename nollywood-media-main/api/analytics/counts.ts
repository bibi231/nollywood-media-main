import type { VercelRequest, VercelResponse } from '@vercel/node';
import { query } from '../_lib/db.js';
import { corsHeaders } from '../_lib/auth.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
    Object.entries(corsHeaders()).forEach(([k, v]) => res.setHeader(k, v));
    if (req.method === 'OPTIONS') return res.status(200).end();

    try {
        const [
            filmsRes,
            usersRes,
            creatorsRes,
            viewsRes
        ] = await Promise.all([
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
            totalCountries: 15 // Static for now as per design or can be counted if schema supports
        });
    } catch (err: any) {
        console.error('Analytics error:', err);
        return res.status(500).json({ error: 'Failed to fetch analytics' });
    }
}
