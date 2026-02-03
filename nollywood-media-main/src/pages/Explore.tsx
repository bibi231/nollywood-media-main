import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import { FilmRow } from '../components/FilmRow';
import { Film, Home } from 'lucide-react';

interface Film {
  id: string;
  title: string;
  poster_url: string;
  logline: string;
  genre: string;
  release_year: number;
  rating: string;
}

export default function Explore() {
  const { user } = useAuth();
  const [recommendations, setRecommendations] = useState<{
    forYou: Film[];
    basedOnHistory: Film[];
    similarUsers: Film[];
    popularInGenre: Film[];
    newReleases: Film[];
  }>({
    forYou: [],
    basedOnHistory: [],
    similarUsers: [],
    popularInGenre: [],
    newReleases: [],
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadRecommendations();
  }, [user]);

  const loadRecommendations = async () => {
    try {
      if (!user) {
        await loadPublicRecommendations();
      } else {
        await loadPersonalizedRecommendations();
      }
    } catch (error) {
      console.error('Error loading recommendations:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadPublicRecommendations = async () => {
    const { data: popularFilms } = await supabase
      .from('films')
      .select('*')
      .order('views', { ascending: false })
      .limit(20);

    const { data: newFilms } = await supabase
      .from('films')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(20);

    setRecommendations({
      forYou: popularFilms || [],
      basedOnHistory: [],
      similarUsers: [],
      popularInGenre: popularFilms?.slice(0, 10) || [],
      newReleases: newFilms || [],
    });
  };

  const loadPersonalizedRecommendations = async () => {
    if (!user) return;

    const { data: watchHistory } = await supabase
      .from('watch_history')
      .select('film_id')
      .eq('user_id', user.id)
      .order('watched_at', { ascending: false })
      .limit(10);

    const watchedIds = watchHistory?.map(w => w.film_id) || [];

    const { data: preferences } = await supabase
      .from('user_preferences')
      .select('favorite_genres, watched_genres')
      .eq('user_id', user.id)
      .maybeSingle();

    const userGenres = [
      ...(preferences?.favorite_genres || []),
      ...(preferences?.watched_genres || [])
    ].filter((v, i, a) => a.indexOf(v) === i);

    const [forYou, basedOnHistory, similarUsers, popularInGenre, newReleases] = await Promise.all([
      getForYouRecommendations(watchedIds, userGenres),
      getBasedOnHistoryRecommendations(watchedIds),
      getSimilarUsersRecommendations(watchedIds),
      getPopularInGenreRecommendations(userGenres, watchedIds),
      getNewReleases(watchedIds),
    ]);

    setRecommendations({
      forYou,
      basedOnHistory,
      similarUsers,
      popularInGenre,
      newReleases,
    });
  };

  const getForYouRecommendations = async (watchedIds: string[], genres: string[]) => {
    let query = supabase
      .from('films')
      .select('*')
      .not('id', 'in', `(${watchedIds.join(',')})`)
      .limit(20);

    if (genres.length > 0) {
      query = query.in('genre', genres);
    }

    const { data } = await query.order('views', { ascending: false });
    return data || [];
  };

  const getBasedOnHistoryRecommendations = async (watchedIds: string[]) => {
    if (watchedIds.length === 0) return [];

    const { data: watchedFilms } = await supabase
      .from('films')
      .select('genre, director, cast')
      .in('id', watchedIds);

    if (!watchedFilms || watchedFilms.length === 0) return [];

    const genres = watchedFilms.map(f => f.genre).filter(Boolean);
    const directors = watchedFilms.map(f => f.director).filter(Boolean);

    const { data } = await supabase
      .from('films')
      .select('*')
      .not('id', 'in', `(${watchedIds.join(',')})`)
      .or(`genre.in.(${genres.join(',')}),director.in.(${directors.join(',')})`)
      .limit(20);

    return data || [];
  };

  const getSimilarUsersRecommendations = async (watchedIds: string[]) => {
    if (watchedIds.length === 0 || !user) return [];

    const { data: similarUsers } = await supabase
      .from('watch_history')
      .select('user_id, film_id')
      .in('film_id', watchedIds)
      .neq('user_id', user.id)
      .limit(100);

    if (!similarUsers || similarUsers.length === 0) return [];

    const userIds = [...new Set(similarUsers.map(s => s.user_id))].slice(0, 10);

    const { data: theirWatches } = await supabase
      .from('watch_history')
      .select('film_id')
      .in('user_id', userIds)
      .not('film_id', 'in', `(${watchedIds.join(',')})`)
      .limit(50);

    if (!theirWatches || theirWatches.length === 0) return [];

    const filmIds = [...new Set(theirWatches.map(w => w.film_id))].slice(0, 20);

    const { data } = await supabase
      .from('films')
      .select('*')
      .in('id', filmIds);

    return data || [];
  };

  const getPopularInGenreRecommendations = async (genres: string[], watchedIds: string[]) => {
    if (genres.length === 0) {
      const { data } = await supabase
        .from('films')
        .select('*')
        .not('id', 'in', `(${watchedIds.join(',')})`)
        .order('views', { ascending: false })
        .limit(20);
      return data || [];
    }

    const { data } = await supabase
      .from('films')
      .select('*')
      .in('genre', genres)
      .not('id', 'in', `(${watchedIds.join(',')})`)
      .order('views', { ascending: false })
      .limit(20);

    return data || [];
  };

  const getNewReleases = async (watchedIds: string[]) => {
    const { data } = await supabase
      .from('films')
      .select('*')
      .not('id', 'in', `(${watchedIds.join(',')})`)
      .order('created_at', { ascending: false })
      .limit(20);

    return data || [];
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-white">Loading personalized recommendations...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="pt-20 pb-10">
        <div className="px-4 sm:px-6 lg:px-8 mb-8">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-3xl font-bold">Explore</h1>
            <Link
              to="/"
              className="flex items-center gap-2 px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded-lg transition-colors"
            >
              <Home className="h-4 w-4" />
              <span className="hidden sm:inline">Back to Home</span>
            </Link>
          </div>
          <p className="text-gray-400">
            {user ? 'Personalized recommendations just for you' : 'Discover amazing content'}
          </p>
        </div>

        {recommendations.forYou.length > 0 && (
          <FilmRow
            title={user ? "Recommended For You" : "Popular Now"}
            films={recommendations.forYou}
          />
        )}

        {recommendations.basedOnHistory.length > 0 && (
          <FilmRow
            title="Because You Watched"
            films={recommendations.basedOnHistory}
          />
        )}

        {recommendations.similarUsers.length > 0 && (
          <FilmRow
            title="Viewers Like You Also Enjoyed"
            films={recommendations.similarUsers}
          />
        )}

        {recommendations.popularInGenre.length > 0 && (
          <FilmRow
            title={user ? "Popular in Your Favorite Genres" : "Most Popular"}
            films={recommendations.popularInGenre}
          />
        )}

        {recommendations.newReleases.length > 0 && (
          <FilmRow
            title="New Releases"
            films={recommendations.newReleases}
          />
        )}

        {!loading && Object.values(recommendations).every(arr => arr.length === 0) && (
          <div className="flex flex-col items-center justify-center py-20">
            <Film className="h-16 w-16 text-gray-600 mb-4" />
            <p className="text-gray-400 text-lg">No recommendations available yet</p>
            <p className="text-gray-500 text-sm mt-2">
              {user ? 'Start watching content to get personalized recommendations' : 'Sign in to get personalized recommendations'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
