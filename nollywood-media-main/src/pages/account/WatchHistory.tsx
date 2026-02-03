import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Clock, Play, Trash2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabase';

interface WatchHistoryItem {
  id: string;
  film_id: string;
  progress_seconds: number;
  duration_seconds: number;
  completed: boolean;
  last_watched: string;
  film: {
    id: string;
    title: string;
    poster_url: string;
    genre: string;
    runtime_min: number;
  };
}

export function WatchHistory() {
  const { user } = useAuth();
  const [history, setHistory] = useState<WatchHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadHistory();
  }, [user]);

  const loadHistory = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('watch_progress')
        .select(`
          *,
          film:films(id, title, poster_url, genre, runtime_min)
        `)
        .eq('user_id', user.id)
        .order('last_watched', { ascending: false });

      if (error) throw error;
      setHistory(data || []);
    } catch (error) {
      console.error('Error loading watch history:', error);
    } finally {
      setLoading(false);
    }
  };

  const removeFromHistory = async (id: string) => {
    if (!confirm('Remove this item from your watch history?')) return;

    try {
      const { error } = await supabase
        .from('watch_progress')
        .delete()
        .eq('id', id);

      if (error) throw error;
      setHistory(history.filter((item) => item.id !== id));
    } catch (error) {
      console.error('Error removing from history:', error);
      alert('Failed to remove item');
    }
  };

  const formatProgress = (seconds: number, duration: number) => {
    const percentage = Math.round((seconds / duration) * 100);
    return `${percentage}%`;
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="text-center">
          <div className="mb-4 h-12 w-12 animate-spin rounded-full border-4 border-slate-700 border-t-red-600 mx-auto"></div>
          <p className="text-slate-400">Loading watch history...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-white">Watch History</h1>
        <p className="mt-2 text-slate-400">
          {history.length} {history.length === 1 ? 'video' : 'videos'} watched
        </p>
      </div>

      {history.length === 0 ? (
        <div className="rounded-lg border-2 border-dashed border-slate-800 bg-slate-900 p-12 text-center">
          <Clock className="mx-auto h-12 w-12 text-slate-600" />
          <h3 className="mt-4 text-lg font-semibold text-slate-400">No watch history yet</h3>
          <p className="mt-2 text-sm text-slate-500">
            Start watching content to build your history
          </p>
          <Link
            to="/"
            className="mt-6 inline-block rounded-lg bg-red-600 px-6 py-2 font-semibold text-white hover:bg-red-700 transition-colors"
          >
            Browse Content
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {history.map((item) => (
            <div
              key={item.id}
              className="group flex gap-4 rounded-lg border border-slate-800 bg-slate-900 p-4 transition-all hover:border-slate-700"
            >
              <Link
                to={`/watch/${item.film.id}`}
                className="relative flex-shrink-0 overflow-hidden rounded-lg"
              >
                <div className="h-24 w-40 bg-gradient-to-br from-slate-800 to-slate-900">
                  {item.film.poster_url ? (
                    <img
                      src={item.film.poster_url}
                      alt={item.film.title}
                      className="h-full w-full object-cover transition-transform group-hover:scale-105"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center text-xs text-slate-500">
                      {item.film.title}
                    </div>
                  )}
                </div>
                <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 transition-opacity group-hover:opacity-100">
                  <Play className="h-8 w-8 text-white" />
                </div>
              </Link>

              <div className="flex flex-1 flex-col justify-between">
                <div>
                  <Link
                    to={`/watch/${item.film.id}`}
                    className="font-semibold text-white hover:text-red-600 transition-colors"
                  >
                    {item.film.title}
                  </Link>
                  <div className="mt-1 flex items-center gap-3 text-sm text-slate-400">
                    <span>{item.film.genre}</span>
                    <span>•</span>
                    <span>{item.film.runtime_min} min</span>
                    <span>•</span>
                    <span>
                      {new Date(item.last_watched).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                      })}
                    </span>
                  </div>
                </div>

                <div>
                  {item.completed ? (
                    <span className="inline-flex items-center gap-1 text-sm text-green-400">
                      <span className="h-2 w-2 rounded-full bg-green-400"></span>
                      Completed
                    </span>
                  ) : (
                    <div className="space-y-1">
                      <div className="flex items-center justify-between text-xs text-slate-400">
                        <span>
                          {formatTime(item.progress_seconds)} / {formatTime(item.duration_seconds)}
                        </span>
                        <span>{formatProgress(item.progress_seconds, item.duration_seconds)}</span>
                      </div>
                      <div className="h-1 overflow-hidden rounded-full bg-slate-800">
                        <div
                          className="h-full bg-red-600"
                          style={{
                            width: formatProgress(item.progress_seconds, item.duration_seconds),
                          }}
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <button
                onClick={() => removeFromHistory(item.id)}
                className="flex-shrink-0 rounded-lg p-2 text-slate-400 hover:bg-slate-800 hover:text-red-400 transition-colors"
                aria-label="Remove from history"
              >
                <Trash2 className="h-5 w-5" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
