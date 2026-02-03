/**
 * RECOMMENDATION ENGINE
 * Algorithms for understanding user behavior and recommending videos
 */

import { supabase } from './supabase';

export interface RecommendationAlgorithm {
  name: string;
  score: number;
  films: any[];
  reason: string;
}

/**
 * 1. COLLABORATIVE FILTERING
 * Users who watched X also watched Y
 */
export async function getCollaborativeRecommendations(userId: string, limit = 10) {
  try {
    // Get films user has watched
    const { data: watchedFilms } = await supabase
      .from('watch_progress')
      .select('film_id')
      .eq('user_id', userId);

    if (!watchedFilms?.length) return [];

    const watchedFilmIds = watchedFilms.map(w => w.film_id);

    // Find other users who watched same films
    const { data: similarUsers } = await supabase
      .from('watch_progress')
      .select('user_id')
      .in('film_id', watchedFilmIds)
      .neq('user_id', userId);

    if (!similarUsers?.length) return [];

    const similarUserIds = [...new Set(similarUsers.map(u => u.user_id))];

    // Get films watched by similar users but not by current user
    const { data: recommendedFilms } = await supabase
      .from('watch_progress')
      .select(`
        film_id,
        film:films(*)
      `)
      .in('user_id', similarUserIds)
      .not('film_id', 'in', `(${watchedFilmIds.join(',')})`)
      .limit(limit);

    return recommendedFilms || [];
  } catch (error) {
    console.error('Collaborative filtering error:', error);
    return [];
  }
}

/**
 * 2. CONTENT-BASED FILTERING
 * Similar films based on genre, director, cast
 */
export async function getContentBasedRecommendations(filmId: string, userId?: string, limit = 10) {
  try {
    // Get the film details
    const { data: sourceFilm } = await supabase
      .from('films')
      .select('*')
      .eq('id', filmId)
      .maybeSingle();

    if (!sourceFilm) return [];

    // Find films with similar genres, director, or cast
    const { data: similarFilms } = await supabase
      .from('films')
      .select('*')
      .neq('id', filmId)
      .eq('status', 'published')
      .limit(limit * 2); // Get extra to filter

    if (!similarFilms) return [];

    // Score films based on similarity
    const scoredFilms = similarFilms
      .map(film => {
        let score = 0;

        // Genre match (40 points)
        const genreMatch = sourceFilm.genre?.some(g => 
          film.genre?.includes(g)
        );
        if (genreMatch) score += 40;

        // Director match (30 points)
        if (sourceFilm.director === film.director) score += 30;

        // Cast match (20 points)
        const castOverlap = sourceFilm.cast_members?.some(c => 
          film.cast_members?.includes(c)
        );
        if (castOverlap) score += 20;

        // Studio match (10 points)
        if (sourceFilm.studio_label === film.studio_label) score += 10;

        return { ...film, similarityScore: score };
      })
      .filter(f => f.similarityScore > 0)
      .sort((a, b) => b.similarityScore - a.similarityScore)
      .slice(0, limit);

    // Exclude from user's watchlist if userId provided
    if (userId) {
      const { data: watchlist } = await supabase
        .from('user_watchlist')
        .select('film_id')
        .eq('user_id', userId);

      const watchlistIds = watchlist?.map(w => w.film_id) || [];
      return scoredFilms.filter(f => !watchlistIds.includes(f.id));
    }

    return scoredFilms;
  } catch (error) {
    console.error('Content-based filtering error:', error);
    return [];
  }
}

/**
 * 3. PERSONALIZED RECOMMENDATIONS
 * Based on user's watch history, ratings, and genre preferences
 */
export async function getPersonalizedRecommendations(userId: string, limit = 10) {
  try {
    // Get user's watch history with ratings
    const { data: watchHistory } = await supabase
      .from('watch_progress')
      .select(`
        film_id,
        completed,
        film:films(*)
      `)
      .eq('user_id', userId)
      .eq('completed', true);

    if (!watchHistory?.length) return [];

    // Get user's top-rated genres
    const { data: userRatings } = await supabase
      .from('film_comments')
      .select(`
        rating,
        film:films(genre)
      `)
      .eq('user_id', userId)
      .gte('rating', 4);

    // Extract preferred genres
    const preferredGenres = new Map<string, number>();
    userRatings?.forEach(r => {
      r.film?.genre?.forEach(g => {
        preferredGenres.set(g, (preferredGenres.get(g) || 0) + 1);
      });
    });

    const topGenres = Array.from(preferredGenres.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(e => e[0]);

    // Get unwatched films in preferred genres
    const watchedIds = watchHistory.map(w => w.film_id);

    const { data: recommendations } = await supabase
      .from('films')
      .select('*')
      .not('id', 'in', `(${watchedIds.join(',')})`)
      .eq('status', 'published')
      .limit(limit * 2);

    // Score by genre preference
    const scored = (recommendations || [])
      .map(film => {
        let score = 0;
        film.genre?.forEach(g => {
          const genreRank = topGenres.indexOf(g);
          if (genreRank !== -1) {
            score += (topGenres.length - genreRank) * 30;
          }
        });
        return { ...film, personalizationScore: score };
      })
      .filter(f => f.personalizationScore > 0)
      .sort((a, b) => b.personalizationScore - a.personalizationScore)
      .slice(0, limit);

    return scored;
  } catch (error) {
    console.error('Personalized recommendations error:', error);
    return [];
  }
}

/**
 * 4. TRENDING & POPULARITY
 * Based on views, ratings, and recent engagement
 */
export async function getTrendingRecommendations(timeframeDays = 7, limit = 10) {
  try {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - timeframeDays);

    // Get playback events in timeframe
    const { data: events } = await supabase
      .from('playback_events')
      .select('film_id')
      .gte('created_at', startDate.toISOString());

    // Count views per film
    const filmCounts = new Map<string, number>();
    events?.forEach(e => {
      filmCounts.set(e.film_id, (filmCounts.get(e.film_id) || 0) + 1);
    });

    const topFilmIds = Array.from(filmCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, limit)
      .map(e => e[0]);

    if (topFilmIds.length === 0) return [];

    // Get full film data with ratings
    const { data: films } = await supabase
      .from('films')
      .select(`
        *,
        film_ratings:film_ratings(average_rating, total_ratings)
      `)
      .in('id', topFilmIds)
      .eq('status', 'published');

    return films || [];
  } catch (error) {
    console.error('Trending recommendations error:', error);
    return [];
  }
}

/**
 * 5. HYBRID RECOMMENDATIONS
 * Combines multiple algorithms for best results
 */
export async function getHybridRecommendations(userId: string, limit = 10) {
  try {
    const [
      collaborative,
      personalized,
      trending
    ] = await Promise.all([
      getCollaborativeRecommendations(userId, limit),
      getPersonalizedRecommendations(userId, limit),
      getTrendingRecommendations(7, limit)
    ]);

    // Combine and deduplicate
    const filmMap = new Map();
    let algorithmWeight = { collaborative: 0.4, personalized: 0.4, trending: 0.2 };

    // Add collaborative results
    collaborative.forEach((film: any, idx) => {
      const id = film.film_id || film.id;
      filmMap.set(id, {
        ...(film.film || film),
        hybridScore: (algorithmWeight.collaborative * (1 - idx / limit)) * 100
      });
    });

    // Add personalized results
    personalized.forEach((film: any, idx) => {
      const id = film.id;
      if (filmMap.has(id)) {
        const existing = filmMap.get(id);
        existing.hybridScore += (algorithmWeight.personalized * (1 - idx / limit)) * 100;
      } else {
        filmMap.set(id, {
          ...film,
          hybridScore: (algorithmWeight.personalized * (1 - idx / limit)) * 100
        });
      }
    });

    // Add trending results
    trending.forEach((film: any, idx) => {
      const id = film.id;
      if (filmMap.has(id)) {
        const existing = filmMap.get(id);
        existing.hybridScore += (algorithmWeight.trending * (1 - idx / limit)) * 100;
      } else {
        filmMap.set(id, {
          ...film,
          hybridScore: (algorithmWeight.trending * (1 - idx / limit)) * 100
        });
      }
    });

    // Sort by hybrid score and return top results
    return Array.from(filmMap.values())
      .sort((a, b) => b.hybridScore - a.hybridScore)
      .slice(0, limit);
  } catch (error) {
    console.error('Hybrid recommendations error:', error);
    return [];
  }
}

/**
 * 6. CONTINUATION (Continue Watching)
 * Get unwatched films from series/franchises user is watching
 */
export async function getContinueWatchingRecommendations(userId: string, limit = 10) {
  try {
    const { data: inProgress } = await supabase
      .from('watch_progress')
      .select(`
        film_id,
        progress_percentage,
        film:films(*)
      `)
      .eq('user_id', userId)
      .lt('progress_percentage', 100)
      .order('last_watched', { ascending: false })
      .limit(limit);

    return inProgress || [];
  } catch (error) {
    console.error('Continue watching error:', error);
    return [];
  }
}

/**
 * 7. TRACK USER BEHAVIOR
 * Log viewing events for recommendation algorithm
 */
export async function trackPlaybackEvent(
  userId: string | null,
  filmId: string,
  eventType: 'play' | 'pause' | 'resume' | 'seek' | 'complete',
  timeSeconds: number,
  sessionId: string
) {
  try {
    const { error } = await supabase.from('playback_events').insert({
      user_id: userId,
      film_id: filmId,
      event_type: eventType,
      timestamp_seconds: timeSeconds,
      session_id: sessionId
    });

    if (error) throw error;
  } catch (error) {
    console.error('Error tracking playback:', error);
  }
}

/**
 * 8. USER SIMILARITY SCORE
 * Calculate how similar two users are based on viewing patterns
 */
export async function calculateUserSimilarity(userId1: string, userId2: string): Promise<number> {
  try {
    // Get films watched by both users
    const { data: user1Films } = await supabase
      .from('watch_progress')
      .select('film_id')
      .eq('user_id', userId1);

    const { data: user2Films } = await supabase
      .from('watch_progress')
      .select('film_id')
      .eq('user_id', userId2);

    const set1 = new Set(user1Films?.map(f => f.film_id) || []);
    const set2 = new Set(user2Films?.map(f => f.film_id) || []);

    if (set1.size === 0 || set2.size === 0) return 0;

    // Jaccard similarity: intersection / union
    const intersection = new Set([...set1].filter(x => set2.has(x)));
    const union = new Set([...set1, ...set2]);

    return intersection.size / union.size;
  } catch (error) {
    console.error('Error calculating similarity:', error);
    return 0;
  }
}

/**
 * 9. ENGAGEMENT SCORE
 * Calculate how engaged a user is based on watching behavior
 */
export async function calculateUserEngagementScore(userId: string): Promise<number> {
  try {
    const { data: watchProgress } = await supabase
      .from('watch_progress')
      .select('completed')
      .eq('user_id', userId);

    const { data: comments } = await supabase
      .from('film_comments')
      .select('id')
      .eq('user_id', userId);

    const { data: ratings } = await supabase
      .from('film_comments')
      .select('rating')
      .eq('user_id', userId)
      .not('rating', 'is', null);

    const { data: watchlist } = await supabase
      .from('user_watchlist')
      .select('id')
      .eq('user_id', userId);

    // Engagement score components
    const completionRate = watchProgress ? 
      (watchProgress.filter(w => w.completed).length / watchProgress.length) * 30 : 0;
    const commentScore = (comments?.length || 0) * 10;
    const ratingScore = (ratings?.length || 0) * 15;
    const watchlistScore = (watchlist?.length || 0) * 5;

    return completionRate + commentScore + ratingScore + watchlistScore;
  } catch (error) {
    console.error('Error calculating engagement:', error);
    return 0;
  }
}

/**
 * 10. COLD START SOLUTION
 * For new users without watch history
 */
export async function getColdStartRecommendations(limit = 10) {
  try {
    // Get trending + highly rated films for new users
    const { data: films } = await supabase
      .from('films')
      .select(`
        *,
        film_ratings:film_ratings(average_rating, total_ratings)
      `)
      .eq('status', 'published')
      .order('release_year', { ascending: false })
      .limit(limit * 2);

    if (!films) return [];

    // Score by rating and recency
    const scored = films
      .map(film => ({
        ...film,
        coldStartScore: (
          (film.film_ratings?.[0]?.average_rating || 0) * 50 +
          (new Date().getFullYear() - film.release_year) * 5
        )
      }))
      .sort((a, b) => b.coldStartScore - a.coldStartScore)
      .slice(0, limit);

    return scored;
  } catch (error) {
    console.error('Cold start recommendations error:', error);
    return [];
  }
}
