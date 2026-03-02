import type { VercelRequest, VercelResponse } from '@vercel/node';
import { query } from '../_lib/db.js';
import { setCorsHeaders, getUserFromRequest } from '../_lib/auth.js';
import { checkRateLimit, getClientIp } from '../_lib/rateLimit.js';

/**
 * AD LOGGING ENDPOINT
 * 
 * Logs impressions and clicks, and updates budgets.
 * 
 * POST /api/ads/log
 * Body: { ad_unit_id, event_type: 'impression'|'click', campaign_id }
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
    setCorsHeaders(req, res);
    if (req.method === 'OPTIONS') return res.status(200).end();
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

    // Rate limit: 200 logs per minute per IP (liberal to handle many impressions)
    const clientIp = getClientIp(req);
    const rl = checkRateLimit(`ads:log:${clientIp}`, { limit: 200, windowSeconds: 60 });
    if (!rl.allowed) {
        return res.status(429).json({ error: 'Too many logs' });
    }

    try {
        const { ad_unit_id, event_type, campaign_id, creator_id } = req.body;
        const user = getUserFromRequest(req);

        if (!ad_unit_id || !event_type || !campaign_id) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        // 1. FRAUD DETECTION: Click Spam Protection
        if (event_type === 'click') {
            const lastClick = await query(`
                SELECT created_at FROM ad_logs 
                WHERE ip_address = $1 AND ad_unit_id = $2 AND event_type = 'click'
                ORDER BY created_at DESC LIMIT 1
            `, [clientIp, ad_unit_id]);

            if (lastClick.length > 0) {
                const diff = (Date.now() - new Date(lastClick[0].created_at).getTime()) / 1000;
                if (diff < 10) { // Reject if clicked again in < 10 seconds
                    return res.status(200).json({ success: false, message: 'Fraud protection triggered' });
                }
            }
        }

        // 2. Log the event
        await query(`
            INSERT INTO ad_logs (ad_unit_id, user_id, creator_id, event_type, ip_address, user_agent)
            VALUES ($1, $2, $3, $4, $5, $6)
        `, [
            ad_unit_id,
            user?.userId || null,
            creator_id || null,
            event_type,
            clientIp,
            req.headers['user-agent'] || 'unknown'
        ]);

        // 3. Budget decrement logic
        const campaignRows = await query(`SELECT pricing_model, price_per_unit FROM ad_campaigns WHERE id = $1`, [campaign_id]);

        if (campaignRows.length > 0) {
            const { pricing_model, price_per_unit } = campaignRows[0];
            let cost = 0;

            if (pricing_model === 'CPC' && event_type === 'click') {
                cost = price_per_unit;
            } else if (pricing_model === 'CPM' && event_type === 'impression') {
                cost = price_per_unit / 1000;
            }

            if (cost > 0) {
                // Update total and daily budgets
                await query(`
                    UPDATE ad_campaigns 
                    SET budget_remaining = GREATEST(0, budget_remaining - $1),
                        daily_spend = daily_spend + $1
                    WHERE id = $2
                `, [cost, campaign_id]);

                // 4. CREATOR REVENUE SHARE: 70/30 split
                if (creator_id) {
                    const creatorCut = cost * 0.7;
                    await query(`
                        INSERT INTO creator_earnings (creator_id, balance_total, revenue_ads)
                        VALUES ($1, $2, $2)
                        ON CONFLICT (creator_id) 
                        DO UPDATE SET 
                            balance_total = creator_earnings.balance_total + EXCLUDED.balance_total,
                            revenue_ads = creator_earnings.revenue_ads + EXCLUDED.revenue_ads,
                            updated_at = NOW()
                    `, [creator_id, creatorCut]);
                }
            }
        }

        return res.status(200).json({ success: true });

    } catch (err: any) {
        console.error('Ad logging error:', err);
        return res.status(500).json({ error: 'Internal server error' });
    }
}
