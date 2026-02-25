import type { VercelRequest, VercelResponse } from '@vercel/node';
import { query } from '../_lib/db.js';
import { corsHeaders } from '../_lib/auth.js';

const PAYSTACK_SECRET = process.env.PAYSTACK_SECRET_KEY;

export default async function handler(req: VercelRequest, res: VercelResponse) {
    Object.entries(corsHeaders()).forEach(([k, v]) => res.setHeader(k, v));
    if (req.method === 'OPTIONS') return res.status(200).end();
    if (req.method !== 'GET' && req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

    try {
        const reference = req.query.reference || req.body.reference;

        if (!reference) {
            return res.status(400).json({ error: 'Reference is required' });
        }

        if (!PAYSTACK_SECRET) {
            return res.status(500).json({ error: 'Paystack secret key not configured' });
        }

        const response = await fetch(`https://api.paystack.co/transaction/verify/${reference}`, {
            headers: { Authorization: `Bearer ${PAYSTACK_SECRET}` },
        });

        const data = await response.json();

        if (!response.ok || data.data.status !== 'success') {
            return res.status(400).json({ error: data.message || 'Transaction verification failed' });
        }

        const { userId, planId, planCode } = data.data.metadata;

        // 1. Update user profile
        await query(
            'UPDATE user_profiles SET subscription_status = $1, updated_at = now() WHERE id = $2',
            [planCode.toLowerCase(), userId]
        );

        // 2. Insert or Update subscription record
        await query(
            'INSERT INTO subscriptions (user_id, plan_id, status, current_period_end, updated_at) ' +
            'VALUES ($1, $2, $3, now() + interval \'30 days\', now()) ' +
            'ON CONFLICT (user_id) DO UPDATE SET ' +
            'plan_id = EXCLUDED.plan_id, status = EXCLUDED.status, ' +
            'current_period_end = EXCLUDED.current_period_end, updated_at = EXCLUDED.updated_at',
            [userId, planId, 'active']
        );

        return res.status(200).json({
            data: {
                status: 'success',
                message: 'Subscription updated'
            },
            error: null
        });

    } catch (err: any) {
        console.error('Paystack verify error:', err);
        return res.status(500).json({ error: err.message || 'Internal server error' });
    }
}
