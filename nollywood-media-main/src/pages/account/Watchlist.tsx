import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabase';
import { ContentCard } from '../../components/ContentCard';

interface WatchlistItem {
  id: string;
  film_id: string;
  created_at: string;
  film: {
    id: string;
    title: string;
    poster_url: string;
    logline: string;
    genre: string;
    release_year: number;
    runtime_min: number;
    rating: string;
    studio_label: string;
    views: number;
  };
}

export function Watchlist() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [watchlist, setWatchlist] = useState<WatchlistItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadWatchlist();
  }, [user]);

  const loadWatchlist = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('user_watchlist')
        .select(`
          *,
          film:films(*)
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setWatchlist(data || []);
    } catch (error) {
      console.error('Error loading watchlist:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePlayClick = (filmId: string) => {
    navigate(`/watch/${filmId}`);
  };

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="text-gray-600">Loading watchlist...</div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">My Watchlist</h1>
        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
          {watchlist.length} {watchlist.length === 1 ? 'video' : 'videos'}
        </p>
      </div>

      {watchlist.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-4 gap-y-8">
          {watchlist.map((item) => (
            <ContentCard
              key={item.id}
              content={{
                ...item.film,
                genres: [item.film.genre],
                poster_url: item.film.poster_url || '/placeholder.jpg'
              }}
              type="movie"
              onPlayClick={() => handlePlayClick(item.film.id)}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-20 bg-gray-50 rounded-lg border border-gray-200">
          <p className="text-gray-600">Your watchlist is empty</p>
          <p className="text-sm text-gray-500 mt-2">Add videos to watch them later</p>
        </div>
      )}
    </div>
  );
}
