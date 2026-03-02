import type { VercelRequest, VercelResponse } from '@vercel/node';
import { query } from '../_lib/db.js';
import { setCorsHeaders } from '../_lib/auth.js';
import { checkRateLimit, getClientIp, RATE_LIMITS } from '../_lib/rateLimit.js';

/**
 * AD SERVING ENDPOINT
 * 
 * Logic:
 * 1. Fetch active campaigns with remaining budget.
 * 2. Join with ad units.
 * 3. Filter by targeting (optional for MVP).
 * 4. Pick one ad (weighted randomization or budget priority).
 * 
 * GET /api/ads/serve?type=banner|video_preroll
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
    setCorsHeaders(req, res);
    if (req.method === 'OPTIONS') return res.status(200).end();

    // Rate limit: 60 ad requests per minute per IP
    const clientIp = getClientIp(req);
    const rl = checkRateLimit(`ads:serve:${clientIp}`, { limit: 60, windowSeconds: 60 });
    if (!rl.allowed) {
        return res.status(429).json({ error: 'Too many ad requests' });
    }

    try {
        const { type, category, country, device } = req.query;
        const adType = (type as string) || 'banner';

        // 1. Fetch eligible ad units
        // We join campaigns and units, checking status and budget
        const eligibleAds = await query(`
            SELECT 
                au.id as ad_unit_id,
                au.content_url,
                au.destination_url,
                au.alt_text,
                ac.id as campaign_id,
                ac.priority_weight,
                ac.pricing_model,
                ac.price_per_unit,
                ac.daily_budget,
                ac.daily_spend,
                ac.last_pacing_reset,
                at.geo_countries,
                at.device_types,
                at.categories
            FROM ad_units au
            JOIN ad_campaigns ac ON au.campaign_id = ac.id
            LEFT JOIN ad_targeting at ON ac.id = at.campaign_id
            WHERE ac.status = 'active'
              AND ac.budget_remaining > 0
              AND au.type = $1
              AND (ac.start_date IS NULL OR ac.start_date <= NOW())
              AND (ac.end_date IS NULL OR ac.end_date >= NOW())
        `, [adType]);

        if (!eligibleAds || eligibleAds.length === 0) {
            return res.status(200).json({ data: null, message: 'No eligible ads found' });
        }

        // 2. DAILY BUDGET RESET & PACING FILTER
        const now = new Date();
        const pacedAds = eligibleAds.filter((ad: any) => {
            // Check if reset is needed (if last reset was before today)
            const lastReset = new Date(ad.last_pacing_reset);
            const needsReset = lastReset.toDateString() !== now.toDateString();

            if (needsReset) {
                // Async reset (fire and forget for this request to save time)
                query(`UPDATE ad_campaigns SET daily_spend = 0, last_pacing_reset = NOW() WHERE id = $1`, [ad.campaign_id]);
                return true; // Assume budget is available after reset
            }

            // Pacing: Skip if daily budget is exhausted
            if (ad.daily_budget > 0 && ad.daily_spend >= ad.daily_budget) {
                return false;
            }
            return true;
        });

        if (pacedAds.length === 0) {
            return res.status(200).json({ data: null, message: 'Daily budgets exhausted' });
        }

        // 3. Client-side targeting filter
        let filteredAds = pacedAds;

        if (country) {
            filteredAds = filteredAds.filter((ad: any) =>
                !ad.geo_countries || ad.geo_countries.length === 0 || ad.geo_countries.includes(country)
            );
        }

        if (category) {
            filteredAds = filteredAds.filter((ad: any) =>
                !ad.categories || ad.categories.length === 0 || ad.categories.includes(category)
            );
        }

        if (filteredAds.length === 0) {
            // Fallback to non-targeted paced ads
            filteredAds = pacedAds.filter((ad: any) =>
                (!ad.geo_countries || ad.geo_countries.length === 0) &&
                (!ad.categories || ad.categories.length === 0)
            );
        }

        // 3. Selection weighted by priority_weight
        // If no weights, pick random
        const totalWeight = filteredAds.reduce((sum: number, ad: any) => sum + (ad.priority_weight || 1), 0);
        let random = Math.random() * totalWeight;
        let selectedAd = filteredAds[0];

        for (const ad of filteredAds) {
            random -= (ad.priority_weight || 1);
            if (random <= 0) {
                selectedAd = ad;
                break;
            }
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

    } catch (err: any) {
        console.error('Ad serving error:', err);
        return res.status(500).json({ error: 'Internal server error' });
    }
}
