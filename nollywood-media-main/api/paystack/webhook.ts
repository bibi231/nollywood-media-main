import type { VercelRequest, VercelResponse } from '@vercel/node';
import crypto from 'crypto';
import { query } from '../_lib/db';

/**
 * Paystack Webhook Handler — Phase 5 Monetization
 * 
 * Handles subscription events:
 * - charge.success → activate/renew subscription
 * - subscription.create → new subscription
 * - subscription.disable → cancel subscription
 * - invoice.payment_failed → flag payment failure
 * 
 * All events verified via HMAC-SHA512 signature
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
    // Only accept POST
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    // ═══ SIGNATURE VERIFICATION ═══
    const paystackSecret = process.env.PAYSTACK_SECRET_KEY;
    if (!paystackSecret) {
        console.error('[Paystack] PAYSTACK_SECRET_KEY not configured');
        return res.status(500).json({ error: 'Webhook not configured' });
    }

    const signature = req.headers['x-paystack-signature'] as string;
    if (!signature) {
        console.warn('[Paystack] Missing signature header');
        return res.status(400).json({ error: 'Missing signature' });
    }

    // Verify HMAC-SHA512 signature
    const rawBody = typeof req.body === 'string' ? req.body : JSON.stringify(req.body);
    const hash = crypto.createHmac('sha512', paystackSecret).update(rawBody).digest('hex');

    if (hash !== signature) {
        console.error('[Paystack] Invalid signature — possible tampering');
        return res.status(401).json({ error: 'Invalid signature' });
    }

    // ═══ EVENT PROCESSING ═══
    try {
        const event = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
        const eventType = event.event;
        const data = event.data;

        console.log(`[Paystack] Received event: ${eventType}`);

        switch (eventType) {
            case 'charge.success': {
                const email = data.customer?.email;
                const amount = data.amount / 100; // Paystack sends in kobo
                const reference = data.reference;
                const plan = data.plan?.plan_code || data.metadata?.plan || 'basic';

                if (!email) break;

                // Determine subscription tier from amount or plan code
                let tier = 'basic';
                if (amount >= 5000 || plan.includes('premium')) tier = 'premium';
                else if (amount >= 2000 || plan.includes('basic')) tier = 'basic';

                // Update user subscription status
                await query(
                    `UPDATE user_profiles 
                     SET subscription_status = $1, 
                         subscription_updated_at = NOW()
                     WHERE id = (SELECT id FROM users WHERE email = $2)`,
                    [tier, email.toLowerCase()]
                );

                // Log the transaction
                await query(
                    `INSERT INTO subscription_transactions (user_email, amount, reference, plan, status, created_at) 
                     VALUES ($1, $2, $3, $4, 'success', NOW())
                     ON CONFLICT (reference) DO NOTHING`,
                    [email, amount, reference, tier]
                );

                console.log(`[Paystack] ✅ Subscription activated: ${email} → ${tier} (₦${amount})`);
                break;
            }

            case 'subscription.create': {
                const email = data.customer?.email;
                const planCode = data.plan?.plan_code;
                console.log(`[Paystack] Subscription created for ${email}: ${planCode}`);
                break;
            }

            case 'subscription.disable': {
                const email = data.customer?.email;
                if (email) {
                    await query(
                        `UPDATE user_profiles 
                         SET subscription_status = 'free', 
                             subscription_updated_at = NOW()
                         WHERE id = (SELECT id FROM users WHERE email = $1)`,
                        [email.toLowerCase()]
                    );
                    console.log(`[Paystack] ⚠️ Subscription cancelled: ${email}`);
                }
                break;
            }

            case 'invoice.payment_failed': {
                const email = data.customer?.email;
                console.warn(`[Paystack] ❌ Payment failed for ${email}`);
                // Don't immediately downgrade — give grace period
                break;
            }

            default:
                console.log(`[Paystack] Unhandled event: ${eventType}`);
        }

        // Always return 200 to acknowledge receipt
        return res.status(200).json({ received: true });

    } catch (err: any) {
        console.error('[Paystack] Webhook processing error:', err);
        // Still return 200 to prevent Paystack retries on our processing errors
        return res.status(200).json({ received: true, error: 'Processing error logged' });
    }
}
