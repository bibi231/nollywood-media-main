import type { VercelRequest, VercelResponse } from '@vercel/node';
import { query } from '../_lib/db.js';
import crypto from 'crypto';

const PAYSTACK_SECRET = process.env.PAYSTACK_SECRET_KEY;

export default async function handler(req: VercelRequest, res: VercelResponse) {
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

    try {
        if (!PAYSTACK_SECRET) {
            console.error('Paystack secret key not configured for webhook.');
            return res.status(500).json({ error: 'Configuration Error' });
        }

        // Note: For Vercel Serverless, req.body is already parsed. 
        // We stringify it back out to verify the hash. Order of keys might affect exact hash,
        // but typically Vercel preserves key order for JSON parsing.
        const hash = crypto.createHmac('sha512', PAYSTACK_SECRET).update(JSON.stringify(req.body)).digest('hex');

        if (hash !== req.headers['x-paystack-signature']) {
            console.error('Invalid webhook signature from Paystack');
            return res.status(401).json({ error: 'Invalid signature' });
        }

        const event = req.body;
        console.log(`[Webhook] Received Paystack event: ${event.event}`);

        const metadata = event.data?.metadata || {};

        if (event.event === 'charge.success') {
            const { userId, planId, planCode, type } = metadata;

            // Handle Subscription creation/renewal
            if (userId && planId && planCode && type !== 'tip') {
                await query(
                    'UPDATE user_profiles SET subscription_status = $1, updated_at = now() WHERE id = $2',
                    [planCode.toLowerCase(), userId]
                );

                await query(
                    'INSERT INTO subscriptions (user_id, plan_id, status, current_period_end, updated_at) ' +
                    'VALUES ($1, $2, $3, now() + interval \'30 days\', now()) ' +
                    'ON CONFLICT (user_id) DO UPDATE SET ' +
                    'plan_id = EXCLUDED.plan_id, status = EXCLUDED.status, ' +
                    'current_period_end = EXCLUDED.current_period_end, updated_at = EXCLUDED.updated_at',
                    [userId, planId, 'active']
                );
                console.log(`[Webhook] Updated subscription for User=${userId} to Plan=${planCode}`);
            }
        }

        if (event.event === 'subscription.disable' || event.event === 'subscription.not_renew') {
            const email = event.data?.customer?.email;
            if (email) {
                const users = await query('SELECT id FROM user_profiles WHERE email = $1', [email]);
                if (users.length > 0) {
                    const userId = users[0].id;
                    await query('UPDATE user_profiles SET subscription_status = $1, updated_at = now() WHERE id = $2', ['free', userId]);
                    await query('UPDATE subscriptions SET status = $1, updated_at = now() WHERE user_id = $2', ['canceled', userId]);
                    console.log(`[Webhook] User=${userId} subscription disabled/canceled.`);
                }
            }
        }

        return res.status(200).send('OK');
    } catch (err: any) {
        console.error('Webhook error:', err);
        // Important: Still return 200 so Paystack stops retrying
        return res.status(200).send('Ignored Error');
    }
}
