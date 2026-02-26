import type { VercelRequest, VercelResponse } from '@vercel/node';
import { query } from './_lib/db.js';
import { getUserFromRequest, corsHeaders } from './_lib/auth.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
    Object.entries(corsHeaders()).forEach(([k, v]) => res.setHeader(k, v));
    if (req.method === 'OPTIONS') return res.status(200).end();
    if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

    try {
        const user = getUserFromRequest(req);
        const userId = req.query.userId as string || user?.userId;
        const limit = parseInt(req.query.limit as string) || 20;
        const type = req.query.type as string || 'mixed'; // mixed, trending, similar

        let films: any[] = [];

        if (type === 'trending') {
            films = await getTrendingContent(limit);
        } else if (type === 'similar') {
            const filmId = req.query.filmId as string;
            films = await getSimilarContent(filmId, limit);
        } else if (type === 'continue') {
            films = await getContinueWatching(userId, limit);
        } else if (type === 'popular') {
            films = await query('SELECT * FROM films WHERE status = \'published\' ORDER BY views DESC LIMIT $1', [limit]);
        } else if (type === 'new') {
            films = await query('SELECT * FROM films WHERE status = \'published\' ORDER BY created_at DESC LIMIT $1', [limit]);
        } else if (type === 'genre') {
            const genre = req.query.genre as string;
            films = await query('SELECT * FROM films WHERE status = \'published\' AND genre = $1 ORDER BY views DESC LIMIT $2', [genre, limit]);
        } else {
            films = await getHybridRecommendations(userId, limit);
        }

        return res.status(200).json({ data: films, error: null });
    } catch (err: any) {
        console.error('Recommendation API Error:', err);
        return res.status(500).json({ error: err.message || 'Internal server error' });
    }
}

/**
 * HYBRID RAG ALGORITHM
 * Score = (Engagement * 0.4) + (Recency * 0.3) + (RegionalBoost * 0.3)
 */
async function getHybridRecommendations(userId: string | undefined, limit: number) {
    // 1. Get base published films
    const baseFilms = await query(
        'SELECT *, views as popularity FROM films WHERE status = \'published\' LIMIT 100'
    );

    // 2. Identify user regions (for boost)
    let userRegion = 'Nigeria';
    if (userId) {
        const prefs = await query('SELECT preferred_regions FROM user_preferences WHERE user_id = $1', [userId]);
        if (prefs[0]?.preferred_regions?.length) {
            userRegion = prefs[0].preferred_regions[0];
        }
    }

    const currentYear = new Date().getFullYear();

    // 3. Rank and Score
    const scoredFilms = baseFilms.map((film: any) => {
        let score = 0;

        // Engagement (Views / MaxViews)
        const engagementScore = Math.min(film.views / 5000, 1) * 40;
        score += engagementScore;

        // Recency (Newer items get up to 30 points)
        const ageYears = Math.max(0, currentYear - film.release_year);
        const recencyScore = Math.max(0, 30 - (ageYears * 5));
        score += recencyScore;

        // Regional Boost (30 points)
        if (film.setting_region === userRegion) {
            score += 30;
        }

        return { ...film, hybrid_score: score };
    });

    return scoredFilms
        .sort((a: any, b: any) => b.hybrid_score - a.hybrid_score)
        .slice(0, limit);
}

async function getTrendingContent(limit: number) {
    // Trending = Most views in the last 7 days (or weighted)
    return await query(
        'SELECT f.*, COUNT(pe.id) as recent_engagement ' +
        'FROM films f ' +
        'LEFT JOIN playback_events pe ON f.id = pe.film_id ' +
        'WHERE f.status = \'published\' AND (pe.created_at >= NOW() - INTERVAL \'7 days\' OR pe.id IS NULL) ' +
        'GROUP BY f.id ' +
        'ORDER BY recent_engagement DESC, f.views DESC ' +
        'LIMIT $1',
        [limit]
    );
}

async function getSimilarContent(filmId: string, limit: number) {
    if (!filmId) return [];

    const source = await query('SELECT genre, director FROM films WHERE id = $1', [filmId]);
    if (!source[0]) return [];

    return await query(
        'SELECT * FROM films ' +
        'WHERE id != $1 AND status = \'published\' AND genre = $2 ' +
        'ORDER BY views DESC LIMIT $3',
        [filmId, source[0].genre, limit]
    );
}

async function getContinueWatching(userId: string | undefined, limit: number) {
    if (!userId) return [];

    return await query(
        'SELECT f.*, wp.progress_seconds, wp.total_seconds ' +
        'FROM films f ' +
        'JOIN watch_progress wp ON f.id = wp.film_id ' +
        'WHERE wp.user_id = $1 AND wp.progress_seconds < wp.total_seconds ' +
        'ORDER BY wp.updated_at DESC LIMIT $2',
        [userId, limit]
    );
}
