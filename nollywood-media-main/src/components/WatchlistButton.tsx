import { useState, useEffect } from 'react';
import { Bookmark } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';

interface WatchlistButtonProps {
  filmId: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function WatchlistButton({ filmId, size = 'md', className = '' }: WatchlistButtonProps) {
  const { user } = useAuth();
  const [isInWatchlist, setIsInWatchlist] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    checkWatchlistStatus();
  }, [user, filmId]);

  const checkWatchlistStatus = async () => {
    if (!user) {
      setIsInWatchlist(false);
      return;
    }

    try {
      const { data } = await supabase
        .from('user_watchlist')
        .select('id')
        .eq('user_id', user.id)
        .eq('film_id', filmId)
        .maybeSingle();

      setIsInWatchlist(!!data);
    } catch (error) {
      console.error('Error checking watchlist:', error);
    }
  };

  const toggleWatchlist = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!user) {
      alert('Please sign in to add films to your watchlist');
      return;
    }

    setLoading(true);

    try {
      if (isInWatchlist) {
        const { error } = await supabase
          .from('user_watchlist')
          .delete()
          .eq('user_id', user.id)
          .eq('film_id', filmId);

        if (error) throw error;
        setIsInWatchlist(false);
      } else {
        const { error } = await supabase
          .from('user_watchlist')
          .insert({
            user_id: user.id,
            film_id: filmId,
          });

        if (error) throw error;
        setIsInWatchlist(true);
      }
    } catch (error: any) {
      console.error('Error toggling watchlist:', error);
      alert('Failed to update watchlist');
    } finally {
      setLoading(false);
    }
  };

  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-5 w-5',
    lg: 'h-6 w-6',
  };

  const buttonSizes = {
    sm: 'p-1.5',
    md: 'p-2',
    lg: 'p-2.5',
  };

  return (
    <button
      onClick={toggleWatchlist}
      disabled={loading}
      className={`rounded-full bg-black/60 backdrop-blur-sm transition-all hover:bg-black/80 hover:scale-110 disabled:opacity-50 ${buttonSizes[size]} ${className}`}
      title={isInWatchlist ? 'Remove from watchlist' : 'Add to watchlist'}
      aria-label={isInWatchlist ? 'Remove from watchlist' : 'Add to watchlist'}
    >
      <Bookmark
        className={`${sizeClasses[size]} transition-all ${
          isInWatchlist ? 'fill-red-600 text-red-600' : 'text-white'
        }`}
      />
    </button>
  );
}
