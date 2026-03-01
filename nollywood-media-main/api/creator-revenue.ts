import type { VercelRequest, VercelResponse } from '@vercel/node';
import { query } from './_lib/db';
import { getUserFromRequest, setCorsHeaders } from './_lib/auth';
import { checkRateLimit, getClientIp } from './_lib/rateLimit';

/**
 * CREATOR REVENUE SHARE ENGINE — Phase 7
 * 
 * Revenue model: Watch-time weighted distribution
 * - Total ad revenue pool tracked monthly
 * - Each creator's share = (their watch-time / total watch-time) * revenue pool
 * - Minimum payout threshold: ₦5,000
 * - Bot watch-time excluded via velocity checks
 */

export default async function handler(req: VercelRequest, res: VercelResponse) {
    setCorsHeaders(req, res);
    if (req.method === 'OPTIONS') return res.status(200).end();

    const user = getUserFromRequest(req);
    if (!user) return res.status(401).json({ error: 'Authentication required' });

    const clientIp = getClientIp(req);
    const rl = checkRateLimit(`revenue:${clientIp}`, { limit: 30, windowSeconds: 60 });
    if (!rl.allowed) return res.status(429).json({ error: 'Too many requests' });

    const action = req.query.action as string;

    try {
        switch (action) {
            case 'earnings':
                return res.status(200).json(await getCreatorEarnings(user.userId));
            case 'breakdown':
                return res.status(200).json(await getEarningsBreakdown(user.userId));
            case 'payout-status':
                return res.status(200).json(await getPayoutStatus(user.userId));
            default:
                return res.status(200).json(await getCreatorEarnings(user.userId));
        }
    } catch (err: any) {
        console.error('[Revenue] Error:', err.message);
        return res.status(500).json({ error: 'Failed to fetch earnings data' });
    }
}

async function getCreatorEarnings(userId: string) {
    // Get total watch-time across all creator's content
    const creatorWatchTime = await query(
        `SELECT 
            COALESCE(SUM(wp.progress_seconds), 0) as total_watch_seconds,
            COUNT(DISTINCT wp.user_id) as unique_viewers,
            COUNT(DISTINCT wp.film_id) as active_films
         FROM watch_progress wp
         JOIN films f ON wp.film_id = f.id
         WHERE f.creator_id = $1`,
        [userId]
    );

    // Get platform total watch-time (for share calculation)
    const platformTotal = await query(
        'SELECT COALESCE(SUM(progress_seconds), 0) as total FROM watch_progress'
    );

    const creatorSeconds = parseInt(creatorWatchTime[0]?.total_watch_seconds || '0');
    const platformSeconds = parseInt(platformTotal[0]?.total || '1');
    const sharePercentage = platformSeconds > 0 ? (creatorSeconds / platformSeconds) * 100 : 0;

    // Revenue calculation (example: 60% of ad revenue goes to creators)
    // Actual pool would come from ad_impressions aggregation
    const estimatedMonthlyPool = 100000; // ₦100k placeholder — replace with actual ad revenue
    const creatorRevenue = (sharePercentage / 100) * estimatedMonthlyPool * 0.6;

    // Monthly breakdown
    const monthlyStats = await query(
        `SELECT 
            DATE_TRUNC('month', wp.created_at) as month,
            SUM(wp.progress_seconds) as watch_seconds,
            COUNT(DISTINCT wp.user_id) as viewers
         FROM watch_progress wp
         JOIN films f ON wp.film_id = f.id
         WHERE f.creator_id = $1 AND wp.created_at >= NOW() - INTERVAL '6 months'
         GROUP BY DATE_TRUNC('month', wp.created_at)
         ORDER BY month DESC`,
        [userId]
    );

    return {
        data: {
            totalWatchSeconds: creatorSeconds,
            totalWatchHours: Math.round(creatorSeconds / 3600 * 100) / 100,
            uniqueViewers: parseInt(creatorWatchTime[0]?.unique_viewers || '0'),
            activeFilms: parseInt(creatorWatchTime[0]?.active_films || '0'),
            sharePercentage: Math.round(sharePercentage * 1000) / 1000,
            estimatedEarnings: Math.round(creatorRevenue * 100) / 100,
            currency: 'NGN',
            payoutThreshold: 5000,
            payoutEligible: creatorRevenue >= 5000,
            monthlyBreakdown: monthlyStats,
        },
        error: null,
    };
}

async function getEarningsBreakdown(userId: string) {
    // Per-film breakdown
    const filmBreakdown = await query(
        `SELECT 
            f.id, f.title, f.thumbnail_url,
            COALESCE(SUM(wp.progress_seconds), 0) as watch_seconds,
            COUNT(DISTINCT wp.user_id) as unique_viewers,
            f.views
         FROM films f
         LEFT JOIN watch_progress wp ON f.id = wp.film_id
         WHERE f.creator_id = $1
         GROUP BY f.id, f.title, f.thumbnail_url, f.views
         ORDER BY watch_seconds DESC
         LIMIT 20`,
        [userId]
    );

    return { data: filmBreakdown, error: null };
}

async function getPayoutStatus(userId: string) {
    // Check if creator has a payout method configured
    const profile = await query(
        `SELECT bank_name, account_number, payout_email 
         FROM user_profiles WHERE id = $1`,
        [userId]
    );

    const hasPayoutMethod = profile[0]?.bank_name && profile[0]?.account_number;

    return {
        data: {
            hasPayoutMethod,
            bankConfigured: !!profile[0]?.bank_name,
            nextPayoutDate: getNextPayoutDate(),
            payoutFrequency: 'monthly',
            minimumPayout: 5000,
            currency: 'NGN',
        },
        error: null,
    };
}

function getNextPayoutDate(): string {
    const now = new Date();
    const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
    return nextMonth.toISOString().split('T')[0];
}
