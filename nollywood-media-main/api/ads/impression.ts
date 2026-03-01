import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getUserFromRequest, setCorsHeaders } from '../_lib/auth';
import { checkRateLimit, getClientIp } from '../_lib/rateLimit';
import { query } from '../_lib/db';

/**
 * Ad Impression & Click Logging — Phase 5
 * 
 * Logs ad impressions and clicks for analytics + fraud detection
 * Throttles per-IP to prevent impression inflation
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
    setCorsHeaders(req, res);
    if (req.method === 'OPTIONS') return res.status(200).end();
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

    // Aggressive rate limiting: 30 impressions per minute per IP
    const clientIp = getClientIp(req);
    const rl = checkRateLimit(`ad-impression:${clientIp}`, { limit: 30, windowSeconds: 60 });
    if (!rl.allowed) {
        // Silently drop — don't tell scrapers they're rate limited
        return res.status(200).json({ logged: false });
    }

    try {
        const { type, slotId, filmId, placement, duration } = req.body;

        if (!type || !['impression', 'click', 'complete'].includes(type)) {
            return res.status(400).json({ error: 'Invalid event type' });
        }

        // Get user if authenticated (anonymous impressions are valid)
        const user = getUserFromRequest(req);
        const userId = user?.userId || null;

        // ═══ FRAUD DETECTION SIGNALS ═══
        const userAgent = req.headers['user-agent'] || '';
        const referer = req.headers['referer'] || '';
        const isBot = /bot|crawl|spider|scrape|headless/i.test(userAgent);
        const isSuspicious = !referer || isBot;

        // Log the impression
        await query(
            `INSERT INTO ad_impressions (
                event_type, slot_id, film_id, placement, 
                user_id, ip_hash, user_agent_hash, 
                is_suspicious, duration_ms, created_at
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW())`,
            [
                type,
                slotId || null,
                filmId || null,
                placement || 'unknown',
                userId,
                // Hash IP for privacy — never store raw IPs
                require('crypto').createHash('sha256').update(clientIp).digest('hex').substring(0, 16),
                require('crypto').createHash('sha256').update(userAgent).digest('hex').substring(0, 16),
                isSuspicious,
                duration || null,
            ]
        );

        return res.status(200).json({ logged: true });
    } catch (err: any) {
        // Fail silently — ad logging should never break the user experience
        console.error('[Ads] Impression logging error:', err.message);
        return res.status(200).json({ logged: false });
    }
}
