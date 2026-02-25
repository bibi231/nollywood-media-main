import type { VercelRequest, VercelResponse } from '@vercel/node';
import { query } from '../_lib/db.js';
import { corsHeaders } from '../_lib/auth.js';

const PAYSTACK_SECRET = process.env.PAYSTACK_SECRET_KEY;

export default async function handler(req: VercelRequest, res: VercelResponse) {
    Object.entries(corsHeaders()).forEach(([k, v]) => res.setHeader(k, v));
    if (req.method === 'OPTIONS') return res.status(200).end();
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

    try {
        const { planId, email, userId } = req.body;

        if (!email || !planId) {
            return res.status(400).json({ error: 'Email and planId are required' });
        }

        if (!PAYSTACK_SECRET) {
            return res.status(500).json({ error: 'Paystack secret key not configured' });
        }

        // 1. Get plan details
        const plans = await query('SELECT * FROM subscription_plans WHERE id = $1', [planId]);
        if (plans.length === 0) {
            return res.status(404).json({ error: 'Plan not found' });
        }
        const plan = plans[0];

        // 2. Initialize transaction with Paystack
        // Amount is in kobo (NGN * 100)
        const amount = Math.round(plan.price * 1500 * 100); // Assuming 1500 NGN per USD for demonstration

        const response = await fetch('https://api.paystack.co/transaction/initialize', {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${PAYSTACK_SECRET}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                email,
                amount,
                callback_url: `${process.env.VITE_APP_URL || 'http://localhost:5173'}/account/subscription?status=verifying`,
                metadata: {
                    userId,
                    planId,
                    planCode: plan.code
                }
            }),
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || 'Paystack initialization failed');
        }

        return res.status(200).json({
            data: {
                authorization_url: data.data.authorization_url,
                reference: data.data.reference,
                access_code: data.data.access_code
            },
            error: null
        });

    } catch (err: any) {
        console.error('Paystack init error:', err);
        return res.status(500).json({ error: err.message || 'Internal server error' });
    }
}
