import type { VercelRequest, VercelResponse } from '@vercel/node';
import { query } from '../db.js';
import { getUserFromRequest } from '../auth.js';
import { checkRateLimit, getClientIp } from '../rateLimit.js';

export async function serve(req: VercelRequest, res: VercelResponse) {
    // Rate limit: 60 ad requests per minute per IP
    const clientIp = getClientIp(req);
    const rl = checkRateLimit(`ads:serve:${clientIp}`, { limit: 60, windowSeconds: 60 });
    if (!rl.allowed) return res.status(429).json({ error: 'Too many ad requests' });

    try {
        const { type, category, country } = req.query;
        const adType = (type as string) || 'banner';

        const eligibleAds = await query(`
            SELECT 
                au.id as ad_unit_id, au.content_url, au.destination_url, au.alt_text,
                ac.id as campaign_id, ac.priority_weight, ac.pricing_model, ac.price_per_unit,
                ac.daily_budget, ac.daily_spend, ac.last_pacing_reset,
                at.geo_countries, at.device_types, at.categories
            FROM ad_units au
            JOIN ad_campaigns ac ON au.campaign_id = ac.id
            LEFT JOIN ad_targeting at ON ac.id = at.campaign_id
            WHERE ac.status = 'active' AND ac.budget_remaining > 0 AND au.type = $1
              AND (ac.start_date IS NULL OR ac.start_date <= NOW())
              AND (ac.end_date IS NULL OR ac.end_date >= NOW())
        `, [adType]);

        if (!eligibleAds || eligibleAds.length === 0) return res.status(200).json({ data: null, message: 'No eligible ads found' });

        const now = new Date();
        const pacedAds = eligibleAds.filter((ad: any) => {
            const lastReset = new Date(ad.last_pacing_reset);
            if (lastReset.toDateString() !== now.toDateString()) {
                query(`UPDATE ad_campaigns SET daily_spend = 0, last_pacing_reset = NOW() WHERE id = $1`, [ad.campaign_id]);
                return true;
            }
            return !(ad.daily_budget > 0 && ad.daily_spend >= ad.daily_budget);
        });

        if (pacedAds.length === 0) return res.status(200).json({ data: null, message: 'Daily budgets exhausted' });

        let filteredAds = pacedAds;
        if (country) filteredAds = filteredAds.filter((ad: any) => !ad.geo_countries?.length || ad.geo_countries.includes(country));
        if (category) filteredAds = filteredAds.filter((ad: any) => !ad.categories?.length || ad.categories.includes(category));
        if (filteredAds.length === 0) filteredAds = pacedAds.filter((ad: any) => !ad.geo_countries?.length && !ad.categories?.length);

        const totalWeight = filteredAds.reduce((sum: number, ad: any) => sum + (ad.priority_weight || 1), 0);
        let random = Math.random() * totalWeight;
        let selectedAd = filteredAds[0];

        for (const ad of filteredAds) {
            random -= (ad.priority_weight || 1);
            if (random <= 0) { selectedAd = ad; break; }
        }

        return res.status(200).json({
            data: {
                id: selectedAd.ad_unit_id,
                campaign_id: selectedAd.campaign_id,
                content_url: selectedAd.content_url,
                destination_url: selectedAd.destination_url,
                alt_text: selectedAd.alt_text,
                type: adType
            }
        });
    } catch (err) {
        console.error('Ad serving error:', err);
        return res.status(500).json({ error: 'Internal server error' });
    }
}

export async function log(req: VercelRequest, res: VercelResponse) {
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
    const clientIp = getClientIp(req);
    const rl = checkRateLimit(`ads:log:${clientIp}`, { limit: 200, windowSeconds: 60 });
    if (!rl.allowed) return res.status(429).json({ error: 'Too many logs' });

    try {
        const { ad_unit_id, event_type, campaign_id, creator_id } = req.body;
        const user = getUserFromRequest(req);
        if (!ad_unit_id || !event_type || !campaign_id) return res.status(400).json({ error: 'Missing required fields' });

        if (event_type === 'click') {
            const lastClick = await query(`
                SELECT created_at FROM ad_logs WHERE ip_address = $1 AND ad_unit_id = $2 AND event_type = 'click'
                ORDER BY created_at DESC LIMIT 1
            `, [clientIp, ad_unit_id]);
            if (lastClick.length > 0 && (Date.now() - new Date(lastClick[0].created_at).getTime()) / 1000 < 10) {
                return res.status(200).json({ success: false, message: 'Fraud protection triggered' });
            }
        }

        await query(`
            INSERT INTO ad_logs (ad_unit_id, user_id, creator_id, event_type, ip_address, user_agent)
            VALUES ($1, $2, $3, $4, $5, $6)
        `, [ad_unit_id, user?.userId || null, creator_id || null, event_type, clientIp, req.headers['user-agent'] || 'unknown']);

        const campaignRows = await query(`SELECT pricing_model, price_per_unit FROM ad_campaigns WHERE id = $1`, [campaign_id]);
        if (campaignRows.length > 0) {
            const { pricing_model, price_per_unit } = campaignRows[0];
            let cost = 0;
            if (pricing_model === 'CPC' && event_type === 'click') cost = price_per_unit;
            else if (pricing_model === 'CPM' && event_type === 'impression') cost = price_per_unit / 1000;

            if (cost > 0) {
                await query(`UPDATE ad_campaigns SET budget_remaining = GREATEST(0, budget_remaining - $1), daily_spend = daily_spend + $1 WHERE id = $2`, [cost, campaign_id]);
                if (creator_id) {
                    const creatorCut = cost * 0.7;
                    await query(`
                        INSERT INTO creator_earnings (creator_id, balance_total, revenue_ads) VALUES ($1, $2, $2)
                        ON CONFLICT (creator_id) DO UPDATE SET balance_total = creator_earnings.balance_total + EXCLUDED.balance_total,
                        revenue_ads = creator_earnings.revenue_ads + EXCLUDED.revenue_ads, updated_at = NOW()
                    `, [creator_id, creatorCut]);
                }
            }
        }
        return res.status(200).json({ success: true });
    } catch (err) {
        console.error('Ad logging error:', err);
        return res.status(500).json({ error: 'Internal server error' });
    }
}
