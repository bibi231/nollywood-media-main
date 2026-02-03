/**
 * ANALYTICS & INSIGHTS ENGINE
 * Tracking metrics for understanding user behavior and platform performance
 */

import { supabase } from './supabase';

export interface UserInsights {
  userId: string;
  totalFilmsWatched: number;
  totalWatchTimeHours: number;
  averageFilmDuration: number;
  favoriteGenres: string[];
  favoriteDirectors: string[];
  completionRate: number;
  engagementScore: number;
  preferredWatchingTime: string; // 'morning', 'afternoon', 'evening', 'night'
  lastActiveDate: string;
}

export interface FilmAnalytics {
  filmId: string;
  title: string;
  totalViews: number;
  completionRate: number;
  avgRating: number;
  totalComments: number;
  totalLikes: number;
  addedToWatchlistCount: number;
  trafficSources: { [source: string]: number };
  deviceDistribution: { [device: string]: number };
}

/**
 * Get user viewing insights
 */
export async function getUserInsights(userId: string): Promise<UserInsights | null> {
  try {
    // Get watch history
    const { data: watchProgress } = await supabase
      .from('watch_progress')
      .select(`
        progress_seconds,
        completed,
        film:films(*)
      `)
      .eq('user_id', userId);

    if (!watchProgress?.length) {
      return null;
    }

    // Calculate metrics
    const filmsWatched = watchProgress.filter(w => w.completed).length;
    const totalWatchSeconds = watchProgress.reduce((sum, w) => sum + w.progress_seconds, 0);
    const totalWatchHours = totalWatchSeconds / 3600;

    // Get genre and director preferences
    const genreMap = new Map<string, number>();
    const directorMap = new Map<string, number>();

    watchProgress.forEach(w => {
      if (w.film?.genre) {
        w.film.genre.forEach(g => {
          genreMap.set(g, (genreMap.get(g) || 0) + 1);
        });
      }
      if (w.film?.director) {
        directorMap.set(w.film.director, (directorMap.get(w.film.director) || 0) + 1);
      }
    });

    const favoriteGenres = Array.from(genreMap.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(e => e[0]);

    const favoriteDirectors = Array.from(directorMap.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(e => e[0]);

    // Get engagement score
    const { data: comments } = await supabase
      .from('film_comments')
      .select('id')
      .eq('user_id', userId);

    const { data: ratings } = await supabase
      .from('film_comments')
      .select('rating')
      .eq('user_id', userId)
      .not('rating', 'is', null);

    const engagementScore = 
      (filmsWatched * 10) +
      (comments?.length || 0) * 15 +
      (ratings?.length || 0) * 20;

    // Determine preferred watching time (would need timestamp analysis in real implementation)
    const preferredWatchingTime = 'evening';

    // Get last active date
    const { data: lastActivity } = await supabase
      .from('watch_progress')
      .select('last_watched')
      .eq('user_id', userId)
      .order('last_watched', { ascending: false })
      .limit(1)
      .maybeSingle();

    return {
      userId,
      totalFilmsWatched: filmsWatched,
      totalWatchTimeHours: parseFloat(totalWatchHours.toFixed(1)),
      averageFilmDuration: filmsWatched > 0 ? Math.round(totalWatchSeconds / filmsWatched / 60) : 0,
      favoriteGenres,
      favoriteDirectors,
      completionRate: parseFloat(((filmsWatched / watchProgress.length) * 100).toFixed(1)),
      engagementScore: Math.round(engagementScore),
      preferredWatchingTime,
      lastActiveDate: lastActivity?.last_watched || new Date().toISOString()
    };
  } catch (error) {
    console.error('Error getting user insights:', error);
    return null;
  }
}

/**
 * Get film analytics
 */
export async function getFilmAnalytics(filmId: string): Promise<FilmAnalytics | null> {
  try {
    const { data: film } = await supabase
      .from('films')
      .select('title')
      .eq('id', filmId)
      .maybeSingle();

    if (!film) return null;

    // Get playback events (views)
    const { data: events } = await supabase
      .from('playback_events')
      .select('event_type')
      .eq('film_id', filmId);

    const totalViews = events?.filter(e => e.event_type === 'play').length || 0;
    const completions = events?.filter(e => e.event_type === 'complete').length || 0;
    const completionRate = totalViews > 0 ? (completions / totalViews) * 100 : 0;

    // Get ratings and comments
    const { data: comments } = await supabase
      .from('film_comments')
      .select(`
        id,
        rating,
        likes_count
      `)
      .eq('film_id', filmId);

    const ratings = comments?.filter(c => c.rating)?.map(c => c.rating) || [];
    const avgRating = ratings.length > 0
      ? parseFloat((ratings.reduce((a, b) => a + b) / ratings.length).toFixed(1))
      : 0;

    const totalLikes = comments?.reduce((sum, c) => sum + c.likes_count, 0) || 0;

    // Get watchlist count
    const { data: watchlistItems } = await supabase
      .from('user_watchlist')
      .select('id')
      .eq('film_id', filmId);

    return {
      filmId,
      title: film.title,
      totalViews,
      completionRate: parseFloat(completionRate.toFixed(1)),
      avgRating,
      totalComments: comments?.length || 0,
      totalLikes,
      addedToWatchlistCount: watchlistItems?.length || 0,
      trafficSources: {}, // Would need to track source in playback events
      deviceDistribution: {} // Would need to track device in playback events
    };
  } catch (error) {
    console.error('Error getting film analytics:', error);
    return null;
  }
}

/**
 * Get platform overview analytics
 */
export async function getPlatformAnalytics() {
  try {
    const [
      filmsCountRes,
      usersCountRes,
      commentsCountRes,
      eventsCountRes,
      watchlistCountRes
    ] = await Promise.all([
      supabase.from('films').select('count(*)', { count: 'exact', head: true }),
      supabase.from('user_profiles').select('count(*)', { count: 'exact', head: true }),
      supabase.from('film_comments').select('count(*)', { count: 'exact', head: true }),
      supabase.from('playback_events').select('count(*)', { count: 'exact', head: true }),
      supabase.from('user_watchlist').select('count(*)', { count: 'exact', head: true })
    ]);

    const topFilms = await getTopFilms(5);
    const activeUsers = await getActiveUsers(7); // Last 7 days

    return {
      totalFilms: filmsCountRes.count || 0,
      totalUsers: usersCountRes.count || 0,
      totalEngagements: (commentsCountRes.count || 0) + (watchlistCountRes.count || 0),
      totalPlaybacks: eventsCountRes.count || 0,
      topFilms,
      activeUsersLast7Days: activeUsers,
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    console.error('Error getting platform analytics:', error);
    return null;
  }
}

/**
 * Get top films by views/engagement
 */
export async function getTopFilms(limit = 10) {
  try {
    const { data: events } = await supabase
      .from('playback_events')
      .select('film_id, event_type');

    const filmViews = new Map<string, { plays: number; completes: number }>();

    events?.forEach(e => {
      const current = filmViews.get(e.film_id) || { plays: 0, completes: 0 };
      if (e.event_type === 'play') current.plays++;
      if (e.event_type === 'complete') current.completes++;
      filmViews.set(e.film_id, current);
    });

    const topFilmIds = Array.from(filmViews.entries())
      .sort((a, b) => b[1].plays - a[1].plays)
      .slice(0, limit)
      .map(e => e[0]);

    if (topFilmIds.length === 0) return [];

    const { data: films } = await supabase
      .from('films')
      .select('id, title, poster_url')
      .in('id', topFilmIds);

    return films || [];
  } catch (error) {
    console.error('Error getting top films:', error);
    return [];
  }
}

/**
 * Get active users count
 */
export async function getActiveUsers(daysBack = 7) {
  try {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - daysBack);

    const { data: events } = await supabase
      .from('playback_events')
      .select('user_id')
      .gte('created_at', startDate.toISOString());

    const uniqueUsers = new Set(events?.map(e => e.user_id).filter(Boolean));
    return uniqueUsers.size;
  } catch (error) {
    console.error('Error getting active users:', error);
    return 0;
  }
}

/**
 * Track user cohort behavior (for A/B testing)
 */
export async function analyzeCohort(cohortName: string, userIds: string[]) {
  try {
    const { data: watchProgress } = await supabase
      .from('watch_progress')
      .select('completed, progress_percentage')
      .in('user_id', userIds);

    const completed = watchProgress?.filter(w => w.completed).length || 0;
    const avgProgress = watchProgress && watchProgress.length > 0
      ? watchProgress.reduce((sum, w) => sum + w.progress_percentage, 0) / watchProgress.length
      : 0;

    return {
      cohortName,
      userCount: userIds.length,
      completionRate: parseFloat(((completed / userIds.length) * 100).toFixed(1)),
      avgProgressPercentage: parseFloat(avgProgress.toFixed(1))
    };
  } catch (error) {
    console.error('Error analyzing cohort:', error);
    return null;
  }
}

/**
 * Predict user churn risk
 */
export async function predictChurnRisk(userId: string): Promise<'high' | 'medium' | 'low'> {
  try {
    const insights = await getUserInsights(userId);
    if (!insights) return 'high'; // New users have higher risk

    // Factors: low engagement, hasn't watched in 30+ days, low completion rate
    const lastActiveDate = new Date(insights.lastActiveDate);
    const daysSinceActive = Math.floor(
      (new Date().getTime() - lastActiveDate.getTime()) / (1000 * 60 * 60 * 24)
    );

    let riskScore = 0;

    // Engagement factor (40 points max)
    if (insights.engagementScore < 50) riskScore += 40;
    else if (insights.engagementScore < 100) riskScore += 20;

    // Activity recency (40 points max)
    if (daysSinceActive > 30) riskScore += 40;
    else if (daysSinceActive > 14) riskScore += 20;

    // Completion rate (20 points max)
    if (insights.completionRate < 30) riskScore += 20;
    else if (insights.completionRate < 50) riskScore += 10;

    if (riskScore >= 60) return 'high';
    if (riskScore >= 30) return 'medium';
    return 'low';
  } catch (error) {
    console.error('Error predicting churn:', error);
    return 'medium';
  }
}
