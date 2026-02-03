import { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabase';
import { MessageSquare, ThumbsUp, Flag, Trash2, Check, X } from 'lucide-react';

interface Comment {
  id: string;
  content: string;
  created_at: string;
  film_id: string;
  user_id: string;
  likes_count: number;
  user_profile: {
    display_name: string;
  } | null;
  film: {
    title: string;
  } | null;
}

export function StudioComments() {
  const { user } = useAuth();
  const [comments, setComments] = useState<Comment[]>([]);
  const [filter, setFilter] = useState<'all' | 'recent'>('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadComments();
    }
  }, [user, filter]);

  const loadComments = async () => {
    if (!user) return;

    try {
      const { data: uploads } = await supabase
        .from('user_uploads')
        .select('id')
        .eq('user_id', user.id)
        .eq('status', 'approved');

      if (!uploads || uploads.length === 0) {
        setComments([]);
        setLoading(false);
        return;
      }

      const filmIds = uploads.map(u => u.id);

      let query = supabase
        .from('film_comments')
        .select(`
          *,
          user_profile:user_profiles!film_comments_user_id_fkey(display_name)
        `)
        .in('film_id', filmIds)
        .order('created_at', { ascending: false });

      if (filter === 'recent') {
        const threeDaysAgo = new Date();
        threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
        query = query.gte('created_at', threeDaysAgo.toISOString());
      }

      const { data, error } = await query;
      if (error) throw error;

      const uploadsMap = uploads.reduce((acc, u) => {
        acc[u.id] = u.title;
        return acc;
      }, {} as Record<string, string>);

      const commentsWithFilm = (data || []).map(c => ({
        ...c,
        likes_count: 0,
        film: { title: uploadsMap[c.film_id] || 'Video' }
      }));

      setComments(commentsWithFilm);
    } catch (error) {
      console.error('Error loading comments:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (commentId: string) => {
    if (!confirm('Are you sure you want to delete this comment?')) return;

    try {
      const { error } = await supabase
        .from('film_comments')
        .delete()
        .eq('id', commentId);

      if (error) throw error;

      setComments(prev => prev.filter(c => c.id !== commentId));
    } catch (error) {
      console.error('Error deleting comment:', error);
      alert('Failed to delete comment');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-gray-600 dark:text-gray-400">Loading comments...</div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            Comments
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Manage comments on your content
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setFilter('all')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              filter === 'all'
                ? 'bg-red-600 text-white'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
            }`}
          >
            All
          </button>
          <button
            onClick={() => setFilter('recent')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              filter === 'recent'
                ? 'bg-red-600 text-white'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
            }`}
          >
            Recent
          </button>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center">
            <div className="text-3xl font-bold text-gray-900 dark:text-white mb-1">
              {comments.length}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Total Comments</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-green-600 mb-1">
              {comments.filter(c => new Date(c.created_at) > new Date(Date.now() - 24*60*60*1000)).length}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Last 24 Hours</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-blue-600 mb-1">
              {comments.reduce((sum, c) => sum + c.likes_count, 0)}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Total Likes</div>
          </div>
        </div>
      </div>

      {comments.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-12 text-center">
          <MessageSquare className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            No comments yet
          </h3>
          <p className="text-gray-600 dark:text-gray-400">
            Comments from viewers will appear here
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {comments.map((comment) => (
            <div key={comment.id} className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-full bg-gray-300 dark:bg-gray-600 flex items-center justify-center text-gray-700 dark:text-gray-300 font-semibold">
                    {comment.user_profile?.display_name?.charAt(0).toUpperCase() || 'U'}
                  </div>
                  <div>
                    <div className="font-medium text-gray-900 dark:text-white">
                      {comment.user_profile?.display_name || 'Anonymous'}
                    </div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                      {new Date(comment.created_at).toLocaleString()}
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => handleDelete(comment.id)}
                  className="p-2 text-gray-400 hover:text-red-600 transition-colors"
                  title="Delete comment"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>

              <p className="text-gray-700 dark:text-gray-300 mb-3">
                {comment.content}
              </p>

              <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
                <span className="flex items-center gap-1">
                  <ThumbsUp className="h-4 w-4" />
                  {comment.likes_count || 0} likes
                </span>
                {comment.film && (
                  <span className="text-gray-400">on "{comment.film.title}"</span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
