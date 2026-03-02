import { type VercelRequest, type VercelResponse } from '@vercel/node';
import { query } from '../_lib/db.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { userId } = req.body;

    if (!userId) {
        return res.status(400).json({ error: 'Missing userId' });
    }

    try {
        // 1. Check eligibility again on backend
        const profileRows = await query(
            'SELECT monetization_status, watch_time_sec, subscriber_count FROM user_profiles WHERE id = $1',
            [userId]
        );
        const profile = profileRows[0];

        if (!profile) return res.status(404).json({ error: 'Profile not found' });

        if (profile.monetization_status !== 'none' && profile.monetization_status !== 'rejected') {
            return res.status(400).json({ error: 'Application already in progress or approved' });
        }

        const isEligible = profile.subscriber_count >= 1000 && profile.watch_time_sec >= 14400000;
        if (!isEligible) {
            return res.status(400).json({ error: 'Not eligible yet' });
        }

        // 2. Create application record
        await query(
            'INSERT INTO monetization_applications (user_id, status) VALUES ($1, $2)',
            [userId, 'pending']
        );

        // 3. Update profile status
        await query(
            'UPDATE user_profiles SET monetization_status = $1 WHERE id = $2',
            ['pending', userId]
        );

        return res.status(200).json({ message: 'Application submitted successfully' });
    } catch (error: any) {
        console.error('Error applying for monetization:', error);
        return res.status(500).json({ error: error.message });
    }
}
