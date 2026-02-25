import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import { useNavigate, Link } from 'react-router-dom';
import { Play, Clock, X, Home } from 'lucide-react';

interface WatchProgress {
  id: string;
  film_id: string;
  progress_seconds: number;
  total_seconds: number;
  updated_at: string;
  completed: boolean;
  film: {
    id: string;
    title: string;
    poster_url: string;
    logline: string;
    genre: string;
    release_year: number;
    runtime_min: number;
  };
}

export default function ContinueWatching() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [inProgress, setInProgress] = useState<WatchProgress[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadInProgressVideos();
    }
  }, [user]);

  const loadInProgressVideos = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('watch_progress')
        .select(`
          *,
          film:films(*)
        `)
        .eq('user_id', user.id)
        .eq('completed', false)
        .gt('progress_seconds', 30)
        .order('updated_at', { ascending: false })
        .limit(50);

      if (error) throw error;

      setInProgress((data || []).filter((p: WatchProgress) => p.film));
    } catch (error) {
      console.error('Error loading watch progress:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRemove = async (progressId: string) => {
    try {
      const { error } = await supabase
        .from('watch_progress')
        .delete()
        .eq('id', progressId);

      if (error) throw error;

      setInProgress(prev => prev.filter(p => p.id !== progressId));
    } catch (error) {
      console.error('Error removing from continue watching:', error);
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

  const getProgressPercentage = (progress: number, duration: number) => {
    if (duration === 0) return 0;
    return Math.min(Math.round((progress / duration) * 100), 100);
  };

  const getTimeRemaining = (progress: number, duration: number) => {
    const remaining = duration - progress;
    return formatTime(remaining);
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <Clock className="h-16 w-16 text-gray-600 mx-auto mb-4" />
          <p className="text-gray-400 text-lg mb-4">Sign in to continue watching</p>
          <button
            onClick={() => navigate('/')}
            className="px-6 py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg font-semibold transition-colors"
          >
            Go to Home
          </button>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-white">Loading your videos...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="pt-20 pb-10 px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-3xl font-bold">Continue Watching</h1>
            <Link
              to="/"
              className="flex items-center gap-2 px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded-lg transition-colors"
            >
              <Home className="h-4 w-4" />
              <span className="hidden sm:inline">Back to Home</span>
            </Link>
          </div>
          <p className="text-gray-400">Pick up right where you left off</p>
        </div>

        {inProgress.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20">
            <Clock className="h-16 w-16 text-gray-600 mb-4" />
            <p className="text-gray-400 text-lg mb-2">No videos in progress</p>
            <p className="text-gray-500 text-sm mb-6">
              Start watching something and it'll appear here
            </p>
            <button
              onClick={() => navigate('/')}
              className="px-6 py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg font-semibold transition-colors"
            >
              Browse Content
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-6">
            {inProgress.map((progress) => {
              const percentage = getProgressPercentage(progress.progress_seconds, progress.total_seconds);
              const timeRemaining = getTimeRemaining(progress.progress_seconds, progress.total_seconds);

              return (
                <div key={progress.id} className="group relative flex flex-col">
                  <div
                    className="relative rounded-lg overflow-hidden bg-gray-900 cursor-pointer aspect-video"
                    onClick={() => navigate(`/watch/${progress.film_id}`)}
                  >
                    <img
                      src={progress.film.poster_url || 'https://via.placeholder.com/400x225?text=No+Image'}
                      alt={progress.film.title}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                    />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <div className="bg-red-600 rounded-full p-2 sm:p-3 transform translate-y-4 group-hover:translate-y-0 transition-transform">
                        <Play className="h-6 w-6 sm:h-8 sm:h-8 text-white fill-current" />
                      </div>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRemove(progress.id);
                      }}
                      className="absolute top-2 right-2 p-1.5 bg-black/60 hover:bg-red-600 rounded-full sm:opacity-0 group-hover:opacity-100 transition-all border border-white/10"
                    >
                      <X className="h-3.5 w-3.5 text-white" />
                    </button>

                    <div className="absolute bottom-0 left-0 right-0 h-1 bg-gray-800">
                      <div
                        className="h-full bg-red-600"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>

                  <div className="mt-2.5 space-y-0.5">
                    <h3 className="font-medium text-white text-sm sm:text-base truncate group-hover:text-red-500 transition-colors">
                      {progress.film.title}
                    </h3>
                    <div className="flex items-center justify-between text-[10px] sm:text-xs text-gray-400">
                      <span>{percentage}% watched</span>
                      <span>{timeRemaining} left</span>
                    </div>
                    <p className="hidden sm:block text-[10px] text-gray-500">
                      Last watched {new Date(progress.updated_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {inProgress.length > 0 && (
          <div className="mt-8 bg-gray-900 rounded-lg p-6 border border-gray-800">
            <h3 className="font-semibold mb-2">About Continue Watching</h3>
            <p className="text-sm text-gray-400">
              Videos you've started watching will appear here so you can easily pick up where you left off.
              The progress bar shows how much you've watched. Click the X to remove a video from this list.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
