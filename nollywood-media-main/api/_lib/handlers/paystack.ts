import type { VercelRequest, VercelResponse } from '@vercel/node';
import { query } from '../db.js';
import { getUserFromRequest } from '../auth.js';

const PAYSTACK_SECRET = process.env.PAYSTACK_SECRET_KEY;

export async function initialize(req: VercelRequest, res: VercelResponse) {
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
    try {
        const { planId, email, userId, type = 'subscription', amount: tipAmount, creatorId, filmId } = req.body;
        const user = getUserFromRequest(req);
        if (!user || userId !== user.userId) return res.status(403).json({ error: 'Unauthorized: Metadata mismatch' });

        if (type === 'tip') {
            const amountKobo = Math.round(tipAmount * 100);
            const response = await fetch('https://api.paystack.co/transaction/initialize', {
                method: 'POST',
                headers: { Authorization: `Bearer ${PAYSTACK_SECRET}`, 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    email, amount: amountKobo,
                    callback_url: `${process.env.VITE_APP_URL || 'http://localhost:5173'}/watch/${filmId}?tip=success`,
                    metadata: { type: 'tip', userId, creatorId, amount: tipAmount }
                }),
            });
            const data = await response.json();
            if (!response.ok) throw new Error(data.message || 'Paystack fail');
            return res.status(200).json({ data: data.data });
        }

        const plans = await query('SELECT * FROM subscription_plans WHERE id = $1', [planId]);
        if (plans.length === 0) return res.status(404).json({ error: 'Plan not found' });
        const plan = plans[0];
        const amount = Math.round(plan.price * 1500 * 100);

        const response = await fetch('https://api.paystack.co/transaction/initialize', {
            method: 'POST',
            headers: { Authorization: `Bearer ${PAYSTACK_SECRET}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({
                email, amount,
                callback_url: `${process.env.VITE_APP_URL || 'http://localhost:5173'}/account/subscription?status=verifying`,
                metadata: { userId, planId, planCode: plan.code }
            }),
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.message || 'Paystack fail');
        return res.status(200).json({ data: data.data });
    } catch (err: any) {
        return res.status(500).json({ error: err.message });
    }
}

export async function verify(req: VercelRequest, res: VercelResponse) {
    const reference = req.query.reference || req.body.reference;
    if (!reference) return res.status(400).json({ error: 'Reference is required' });

    try {
        const response = await fetch(`https://api.paystack.co/transaction/verify/${reference}`, {
            headers: { Authorization: `Bearer ${PAYSTACK_SECRET}` },
        });
        const data = await response.json();
        if (!response.ok || data.data.status !== 'success') return res.status(400).json({ error: data.message || 'Verification failed' });

        const { userId, planId, planCode, type, creatorId, amount } = data.data.metadata || {};

        if (type === 'tip') {
            await query('INSERT INTO user_tips (user_id, creator_id, amount, status) VALUES ($1, $2, $3, $4)', [userId, creatorId, amount, 'success']);
            return res.status(200).json({ data: { status: 'success' } });
        }

        await query('UPDATE user_profiles SET subscription_status = $1, updated_at = now() WHERE id = $2', [planCode.toLowerCase(), userId]);
        await query('INSERT INTO subscriptions (user_id, plan_id, status, current_period_end) VALUES ($1, $2, $3, now() + interval \'30 days\') ON CONFLICT (user_id) DO UPDATE SET plan_id = EXCLUDED.plan_id, status = EXCLUDED.status, current_period_end = EXCLUDED.current_period_end', [userId, planId, 'active']);
        return res.status(200).json({ data: { status: 'success' } });
    } catch (err: any) {
        return res.status(500).json({ error: err.message });
    }
}
