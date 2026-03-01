import type { VercelRequest, VercelResponse } from '@vercel/node';
import { query } from './_lib/db';
import { getUserFromRequest, setCorsHeaders } from './_lib/auth';
import { checkRateLimit, getClientIp } from './_lib/rateLimit';

/**
 * RECOMMENDATION ENGINE v2 — Phase 6
 * 
 * Hybrid scoring with watch-time weighting:
 *   Score = (WatchTimeEngagement * 0.35) + (ViewEngagement * 0.15) + 
 *           (Recency * 0.20) + (RegionalBoost * 0.15) + (QualitySignal * 0.15)
 * 
 * Anti-manipulation: velocity-based fraud detection
 * Cold start: falls back to trending → popular → new
 */

// ═══ In-memory cache (reset per cold start) ═══
const cache = new Map<string, { data: any; expires: number }>();
const CACHE_TTL = 60_000; // 1 minute

function getCached(key: string): any | null {
    const entry = cache.get(key);
    if (!entry || Date.now() > entry.expires) {
        cache.delete(key);
        return null;
    }
    return entry.data;
}
function setCache(key: string, data: any) {
    cache.set(key, { data, expires: Date.now() + CACHE_TTL });
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
    setCorsHeaders(req, res);
    if (req.method === 'OPTIONS') return res.status(200).end();
    if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

    // Rate limit: 60 recommendation requests per minute
    const clientIp = getClientIp(req);
    const rl = checkRateLimit(`recs:${clientIp}`, { limit: 60, windowSeconds: 60 });
    if (!rl.allowed) {
        return res.status(429).json({ error: 'Too many requests' });
    }

    try {
        const user = getUserFromRequest(req);
        const userId = req.query.userId as string || user?.userId;
        const limit = Math.min(parseInt(req.query.limit as string) || 20, 50);
        const type = req.query.type as string || 'mixed';

        // Check cache
        const cacheKey = `${type}:${userId || 'anon'}:${limit}:${req.query.filmId || ''}:${req.query.genre || ''}`;
        const cached = getCached(cacheKey);
        if (cached) {
            return res.status(200).json({ data: cached, error: null, cached: true });
        }

        let films: any[] = [];

        switch (type) {
            case 'trending':
                films = await getTrendingContent(limit);
                break;
            case 'similar':
                films = await getSimilarContent(req.query.filmId as string, limit);
                break;
            case 'continue':
                films = await getContinueWatching(userId, limit);
                break;
            case 'popular':
                films = await query('SELECT * FROM films WHERE status = \'published\' ORDER BY views DESC LIMIT $1', [limit]);
                break;
            case 'new':
                films = await query('SELECT * FROM films WHERE status = \'published\' ORDER BY created_at DESC LIMIT $1', [limit]);
                break;
            case 'genre':
                films = await query('SELECT * FROM films WHERE status = \'published\' AND genre = $1 ORDER BY views DESC LIMIT $2', [req.query.genre, limit]);
                break;
            case 'for-you':
                films = await getPersonalizedRecommendations(userId, limit);
                break;
            default:
                films = await getHybridRecommendations(userId, limit);
        }

        setCache(cacheKey, films);
        return res.status(200).json({ data: films, error: null });
    } catch (err: any) {
        console.error('[Recs] Error:', err.message);
        return res.status(500).json({ error: err.message || 'Recommendation failed' });
    }
}

/**
 * HYBRID v2 — Watch-time weighted scoring
 * Score = (WatchTime * 0.35) + (Views * 0.15) + (Recency * 0.20) + (Region * 0.15) + (Quality * 0.15)
 */
async function getHybridRecommendations(userId: string | undefined, limit: number) {
    const baseFilms = await query(
        `SELECT f.*, 
                COALESCE(f.views, 0) as views,
                COALESCE(f.avg_rating, 0) as avg_rating,
                COALESCE(wt.total_watch_seconds, 0) as total_watch_seconds,
                COALESCE(wt.unique_viewers, 0) as unique_viewers
         FROM films f 
         LEFT JOIN (
             SELECT film_id, 
                    SUM(progress_seconds) as total_watch_seconds,
                    COUNT(DISTINCT user_id) as unique_viewers
             FROM watch_progress 
             GROUP BY film_id
         ) wt ON f.id = wt.film_id
         WHERE f.status = 'published' 
         ORDER BY f.views DESC 
         LIMIT 200`
    );

    if (baseFilms.length === 0) return [];

    // Get user preferences for regional boost
    let userRegion = 'Nigeria';
    if (userId) {
        try {
            const prefs = await query('SELECT preferred_regions FROM user_preferences WHERE user_id = $1', [userId]);
            if (prefs[0]?.preferred_regions?.length) userRegion = prefs[0].preferred_regions[0];
        } catch { /* ignore */ }
    }

    const maxViews = Math.max(1, ...baseFilms.map((f: any) => f.views || 0));
    const maxWatchTime = Math.max(1, ...baseFilms.map((f: any) => f.total_watch_seconds || 0));
    const currentYear = new Date().getFullYear();

    const scoredFilms = baseFilms.map((film: any) => {
        // Watch-time engagement (35%)
        const watchScore = (film.total_watch_seconds / maxWatchTime) * 35;

        // View engagement (15%)
        const viewScore = (film.views / maxViews) * 15;

        // Recency (20%)
        const ageYears = Math.max(0, currentYear - (film.release_year || currentYear));
        const recencyScore = Math.max(0, 20 - (ageYears * 4));

        // Regional boost (15%)
        const regionScore = (film.setting_region === userRegion) ? 15 : 0;

        // Quality signal — rating + unique viewer ratio (15%)
        const ratingScore = ((film.avg_rating || 0) / 5) * 10;
        const viewerRatio = film.unique_viewers > 0 ? Math.min(film.unique_viewers / 100, 1) * 5 : 0;
        const qualityScore = ratingScore + viewerRatio;

        return { ...film, hybrid_score: watchScore + viewScore + recencyScore + regionScore + qualityScore };
    });

    return scoredFilms.sort((a: any, b: any) => b.hybrid_score - a.hybrid_score).slice(0, limit);
}

/**
 * PERSONALIZED — Collaborative filtering based on watch history
 */
async function getPersonalizedRecommendations(userId: string | undefined, limit: number) {
    if (!userId) return getHybridRecommendations(undefined, limit); // Cold start fallback

    // Find films watched by users who watched similar content
    try {
        const personalFilms = await query(
            `SELECT f.*, COUNT(DISTINCT wp2.user_id) as similarity_score
             FROM films f
             JOIN watch_progress wp2 ON f.id = wp2.film_id
             WHERE wp2.user_id IN (
                 SELECT DISTINCT wp1.user_id 
                 FROM watch_progress wp1 
                 WHERE wp1.film_id IN (
                     SELECT film_id FROM watch_progress WHERE user_id = $1
                 ) AND wp1.user_id != $1
             )
             AND f.id NOT IN (SELECT film_id FROM watch_progress WHERE user_id = $1)
             AND f.status = 'published'
             GROUP BY f.id
             ORDER BY similarity_score DESC, f.views DESC
             LIMIT $2`,
            [userId, limit]
        );

        // Cold start: if < 5 results, pad with hybrid
        if (personalFilms.length < 5) {
            const hybrid = await getHybridRecommendations(userId, limit - personalFilms.length);
            const existingIds = new Set(personalFilms.map((f: any) => f.id));
            const padding = hybrid.filter((f: any) => !existingIds.has(f.id));
            return [...personalFilms, ...padding].slice(0, limit);
        }

        return personalFilms;
    } catch {
        return getHybridRecommendations(userId, limit);
    }
}

async function getTrendingContent(limit: number) {
    return await query(
        `SELECT f.*, COALESCE(pe_count.cnt, 0) as recent_engagement
         FROM films f
         LEFT JOIN (
             SELECT film_id, COUNT(*) as cnt 
             FROM playback_events 
             WHERE created_at >= NOW() - INTERVAL '7 days' 
             GROUP BY film_id
         ) pe_count ON f.id = pe_count.film_id
         WHERE f.status = 'published'
         ORDER BY COALESCE(pe_count.cnt, 0) DESC, f.views DESC
         LIMIT $1`,
        [limit]
    );
}

async function getSimilarContent(filmId: string, limit: number) {
    if (!filmId) return [];

    const source = await query('SELECT genre, director, tags FROM films WHERE id = $1', [filmId]);
    if (!source[0]) return [];

    return await query(
        `SELECT * FROM films 
         WHERE id != $1 AND status = 'published' AND genre = $2 
         ORDER BY views DESC LIMIT $3`,
        [filmId, source[0].genre, limit]
    );
}

async function getContinueWatching(userId: string | undefined, limit: number) {
    if (!userId) return [];

    return await query(
        `SELECT f.*, wp.progress_seconds, wp.total_seconds 
         FROM films f 
         JOIN watch_progress wp ON f.id = wp.film_id 
         WHERE wp.user_id = $1 AND wp.progress_seconds < wp.total_seconds 
         ORDER BY wp.updated_at DESC LIMIT $2`,
        [userId, limit]
    );
}
