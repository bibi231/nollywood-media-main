import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Play, Trash2, Clock } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';

interface WatchedFilm {
  id: string;
  film_id: string;
  progress_seconds: number;
  progress_percentage: number;
  last_watched: string;
  film: {
    id: string;
    title: string;
    poster_url: string;
    runtime_min: number;
    studio_label: string;
  };
}

export default function History() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [history, setHistory] = useState<WatchedFilm[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadHistory();
    }
  }, [user]);

  const loadHistory = async () => {
    try {
      const { data: historyData, error } = await supabase
        .from('watch_progress')
        .select(`*`)
        .eq('user_id', user?.id)
        .order('last_watched', { ascending: false });

      if (error) throw error;

      if (!historyData || historyData.length === 0) {
        setHistory([]);
        return;
      }

      // Proxy workarounds: fetch films manually
      const filmIds = historyData.map((item: any) => item.film_id);
      const { data: filmsData, error: filmsError } = await supabase
        .from('films')
        .select('id, title, poster_url, runtime_min, studio_label')
        .in('id', filmIds);

      if (filmsError) throw filmsError;

      const fullHistory = historyData.map((item: any) => ({
        ...item,
        film: filmsData?.find((f: any) => f.id === item.film_id) || null
      })).filter((item: any) => item.film !== null);

      setHistory(fullHistory as WatchedFilm[]);
    } catch (error) {
      console.error('Error loading history:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteFromHistory = async (filmId: string) => {
    try {
      const { error } = await supabase
        .from('watch_progress')
        .delete()
        .eq('user_id', user?.id)
        .eq('film_id', filmId);

      if (error) throw error;
      setHistory(history.filter(h => h.film_id !== filmId));
    } catch (error) {
      console.error('Error deleting from history:', error);
    }
  };

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return `Today at ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Yesterday';
    }
    return date.toLocaleDateString();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-gray-600">Loading history...</div>
      </div>
    );
  }

  if (history.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <Clock className="w-12 h-12 text-gray-400 mb-4" />
        <h3 className="text-lg font-semibold text-gray-900 mb-2">No Watch History</h3>
        <p className="text-gray-600 mb-4">Films you watch will appear here</p>
        <button
          onClick={() => navigate('/explore')}
          className="px-6 py-2 bg-red-600 text-white rounded-full font-medium hover:bg-red-700 transition-colors"
        >
          Explore Films
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Watch History</h2>

      <div className="grid gap-4">
        {history.map((item) => (
          <div
            key={item.id}
            className="flex gap-4 p-4 bg-white rounded-lg border border-gray-200 hover:shadow-lg transition-shadow group"
          >
            <div className="relative flex-shrink-0 w-48 aspect-video bg-gray-200 rounded-lg overflow-hidden">
              <img
                src={item.film.poster_url}
                alt={item.film.title}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <button
                  onClick={() => navigate(`/watch/${item.film.id}`)}
                  className="bg-red-600 p-3 rounded-full hover:bg-red-700 transition-colors"
                >
                  <Play className="w-6 h-6 text-white fill-white" />
                </button>
              </div>

              {item.progress_percentage < 100 && (
                <div className="absolute bottom-0 left-0 right-0 h-1 bg-gray-300">
                  <div
                    className="h-full bg-red-600"
                    style={{ width: `${item.progress_percentage}%` }}
                  />
                </div>
              )}
            </div>

            <div className="flex-1 flex flex-col justify-between py-2">
              <div>
                <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2 cursor-pointer hover:text-red-600" onClick={() => navigate(`/watch/${item.film.id}`)}>
                  {item.film.title}
                </h3>
                <p className="text-sm text-gray-600 mb-2">{item.film.studio_label}</p>
              </div>

              <div className="flex items-center justify-between text-sm">
                <div className="flex gap-4 text-gray-600">
                  <span>Watched {formatDate(item.last_watched)}</span>
                  {item.progress_percentage < 100 && (
                    <span className="text-gray-500">
                      {formatTime(item.progress_seconds)} of {item.film.runtime_min}m
                    </span>
                  )}
                  {item.progress_percentage === 100 && (
                    <span className="text-green-600 font-medium">Completed</span>
                  )}
                </div>

                <button
                  onClick={() => handleDeleteFromHistory(item.film.id)}
                  className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
