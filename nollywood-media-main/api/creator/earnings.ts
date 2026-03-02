import { type VercelRequest, type VercelResponse } from '@vercel/node';
import { query } from '../_lib/db.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { userId } = req.query;

    if (!userId) {
        return res.status(400).json({ error: 'Missing userId' });
    }

    try {
        // 1. Get creator earnings summary
        const earningsRows = await query(
            'SELECT * FROM creator_earnings WHERE creator_id = $1',
            [userId]
        );

        // 2. Get monetization stats from user_profiles
        const profileRows = await query(
            'SELECT monetization_status, watch_time_sec, subscriber_count FROM user_profiles WHERE id = $1',
            [userId]
        );

        const profile = profileRows[0];
        let earnings = earningsRows[0];

        // 3. If no earnings record exists yet, create one
        if (!earnings) {
            const newEarnings = await query(
                'INSERT INTO creator_earnings (creator_id) VALUES ($1) RETURNING *',
                [userId]
            );
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
