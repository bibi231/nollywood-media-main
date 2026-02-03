import { useState, useEffect } from 'react';
import { Star } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';

interface StarRatingProps {
  filmId: string;
  readonly?: boolean;
  size?: 'sm' | 'md' | 'lg';
  showCount?: boolean;
}

export function StarRating({ filmId, readonly = false, size = 'md', showCount = true }: StarRatingProps) {
  const { user } = useAuth();
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [userRating, setUserRating] = useState(0);
  const [averageRating, setAverageRating] = useState(0);
  const [ratingCount, setRatingCount] = useState(0);
  const [loading, setLoading] = useState(false);

  const sizes = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6'
  };

  useEffect(() => {
    loadRatings();
  }, [filmId, user]);

  const loadRatings = async () => {
    try {
      const { data: ratingsData, error: ratingsError } = await supabase
        .from('film_ratings')
        .select('average_rating, total_ratings')
        .eq('film_id', filmId)
        .maybeSingle();

      if (ratingsError && ratingsError.code !== 'PGRST116') throw ratingsError;

      if (ratingsData) {
        setAverageRating(ratingsData.average_rating || 0);
        setRatingCount(ratingsData.total_ratings || 0);
      }

      if (user) {
        const { data: commentData } = await supabase
          .from('film_comments')
          .select('rating')
          .eq('film_id', filmId)
          .eq('user_id', user.id)
          .maybeSingle();

        if (commentData?.rating) {
          setUserRating(commentData.rating);
          setRating(commentData.rating);
        }
      }
    } catch (error) {
      console.error('Error loading ratings:', error);
    }
  };

  const handleRate = async (stars: number) => {
    if (readonly || !user || loading) return;

    setLoading(true);
    try {
      // Update the film_comments table with rating
      const { data: existingComment } = await supabase
        .from('film_comments')
        .select('id')
        .eq('film_id', filmId)
        .eq('user_id', user.id)
        .maybeSingle();

      if (existingComment) {
        await supabase
          .from('film_comments')
          .update({ rating: stars })
          .eq('id', existingComment.id);
      } else {
        await supabase.from('film_comments').insert({
          film_id: filmId,
          user_id: user.id,
          content: '',
          rating: stars,
        });
      }

      setUserRating(stars);
      setRating(stars);
      await loadRatings();
    } catch (error) {
      console.error('Error saving rating:', error);
    } finally {
      setLoading(false);
    }
  };

  const displayRating = readonly ? averageRating : (hoverRating || rating);

  return (
    <div className="flex items-center gap-2">
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            onClick={() => !readonly && handleRate(star)}
            onMouseEnter={() => !readonly && setHoverRating(star)}
            onMouseLeave={() => !readonly && setHoverRating(0)}
            disabled={readonly || loading}
            className={`${readonly ? 'cursor-default' : 'cursor-pointer hover:scale-110'} transition-transform ${sizes[size]}`}
          >
            <Star
              className={`${
                star <= displayRating
                  ? 'fill-yellow-400 text-yellow-400'
                  : 'fill-none text-gray-300 dark:text-gray-600'
              } ${sizes[size]}`}
            />
          </button>
        ))}
      </div>

      {showCount && (
        <div className="text-sm text-gray-600 dark:text-gray-400">
          {readonly ? (
            <>
              <span className="font-medium">{averageRating.toFixed(1)}</span>
              {ratingCount > 0 && <span> ({ratingCount.toLocaleString()})</span>}
            </>
          ) : userRating > 0 ? (
            <span>Your rating: {userRating}</span>
          ) : (
            <span>Rate this</span>
          )}
        </div>
      )}
    </div>
  );
}
