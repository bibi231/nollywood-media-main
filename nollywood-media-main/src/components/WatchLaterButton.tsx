import { useState, useEffect } from 'react';
import { Plus, Check } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';

interface WatchLaterButtonProps {
    filmId: string;
    size?: 'sm' | 'md' | 'lg';
    className?: string;
}

export function WatchLaterButton({ filmId, size = 'md', className = '' }: WatchLaterButtonProps) {
    const { user } = useAuth();
    const [isInWatchLater, setIsInWatchLater] = useState(false);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        checkWatchLaterStatus();
    }, [user, filmId]);

    const checkWatchLaterStatus = async () => {
        if (!user) {
            setIsInWatchLater(false);
            return;
        }

        try {
            const { data } = await supabase
                .from('watch_later')
                .select('id')
                .eq('user_id', user.id)
                .eq('film_id', filmId)
                .maybeSingle();

            setIsInWatchLater(!!data);
        } catch (error) {
            console.error('Error checking watch later:', error);
        }
    };

    const toggleWatchLater = async (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();

        if (!user) {
            alert('Please sign in to add films to your Watch Later queue');
            return;
        }

        setLoading(true);

        try {
            if (isInWatchLater) {
                const { error } = await supabase
                    .from('watch_later')
                    .delete()
                    .eq('user_id', user.id)
                    .eq('film_id', filmId);

                if (error) throw error;
                setIsInWatchLater(false);
            } else {
                const { error } = await supabase
                    .from('watch_later')
                    .insert({
                        user_id: user.id,
                        film_id: filmId,
                    });

                if (error) throw error;
                setIsInWatchLater(true);
            }
        } catch (error: any) {
            console.error('Error toggling watch later:', error);
            alert('Failed to update Watch Later queue');
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
            onClick={toggleWatchLater}
            disabled={loading}
            className={`rounded-full bg-black/60 backdrop-blur-sm transition-all hover:bg-black/80 hover:scale-110 disabled:opacity-50 ${buttonSizes[size]} ${className}`}
            title={isInWatchLater ? 'Remove from Watch Later' : 'Add to Watch Later'}
            aria-label={isInWatchLater ? 'Remove from Watch Later' : 'Add to Watch Later'}
        >
            {isInWatchLater ? (
                <Check className={`${sizeClasses[size]} transition-all text-green-500`} />
            ) : (
                <Plus className={`${sizeClasses[size]} transition-all text-white`} />
            )}
        </button>
    );
}
