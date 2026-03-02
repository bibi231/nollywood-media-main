import type { VercelRequest, VercelResponse } from '@vercel/node';
import { query } from '../db.js';

export async function view(req: VercelRequest, res: VercelResponse) {
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
    const { filmId } = req.body;
    if (!filmId) return res.status(400).json({ error: 'Film ID is required' });

    try {
        await query('UPDATE films SET views = COALESCE(views, 0) + 1 WHERE id = $1', [filmId]);
        return res.status(200).json({ success: true });
    } catch (err: any) {
        console.error('View increment error:', err);
        return res.status(500).json({ error: 'Failed to increment views' });
    }
}
