import { type VercelRequest, type VercelResponse } from '@vercel/node';
import { query } from '../db.js';

export async function earnings(req: VercelRequest, res: VercelResponse) {
    if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });
    const { userId } = req.query;
    if (!userId) return res.status(400).json({ error: 'Missing userId' });

    try {
        const earningsRows = await query('SELECT * FROM creator_earnings WHERE creator_id = $1', [userId]);
        const profileRows = await query('SELECT monetization_status, watch_time_sec, subscriber_count FROM user_profiles WHERE id = $1', [userId]);
        const profile = profileRows[0];
        let earnings = earningsRows[0];
        if (!earnings) {
            const newEarnings = await query('INSERT INTO creator_earnings (creator_id) VALUES ($1) RETURNING *', [userId]);
            earnings = newEarnings[0];
        }
        return res.status(200).json({
            data: {
                ...earnings,
                monetization: {
                    status: profile?.monetization_status || 'none',
                    watchTimeSec: profile?.watch_time_sec || 0,
                    subscriberCount: profile?.subscriber_count || 0
                }
            }
        });
    } catch (error: any) {
        console.error('Error fetching creator earnings:', error);
        return res.status(500).json({ error: error.message });
    }
}

export async function monetizationApply(req: VercelRequest, res: VercelResponse) {
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
    const { userId } = req.body;
    if (!userId) return res.status(400).json({ error: 'Missing userId' });

    try {
        const profileRows = await query('SELECT monetization_status, watch_time_sec, subscriber_count FROM user_profiles WHERE id = $1', [userId]);
        const profile = profileRows[0];
        if (!profile) return res.status(404).json({ error: 'Profile not found' });
        if (profile.monetization_status !== 'none' && profile.monetization_status !== 'rejected') return res.status(400).json({ error: 'Application already in progress or approved' });
        if (profile.subscriber_count < 1000 || profile.watch_time_sec < 14400000) return res.status(400).json({ error: 'Not eligible yet' });

        await query('INSERT INTO monetization_applications (user_id, status) VALUES ($1, $2)', [userId, 'pending']);
        await query('UPDATE user_profiles SET monetization_status = $1 WHERE id = $2', ['pending', userId]);
        return res.status(200).json({ message: 'Application submitted successfully' });
    } catch (error: any) {
        console.error('Error applying for monetization:', error);
        return res.status(500).json({ error: error.message });
    }
}
