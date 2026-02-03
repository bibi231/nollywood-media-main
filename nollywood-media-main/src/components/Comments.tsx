import { useState, useEffect } from 'react';
import { ThumbsUp, Trash2, Edit2, MessageCircle } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase';

interface Comment {
  id: string;
  content: string;
  rating: number | null;
  likes_count: number;
  created_at: string;
  user_has_liked: boolean;
  user_profile: {
    display_name: string;
    avatar_url: string;
  } | null;
}

interface CommentsProps {
  filmId: string;
  filmTitle: string;
}

export function Comments({ filmId, filmTitle }: CommentsProps) {
  const { user } = useAuth();
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [commentSort, setCommentSort] = useState<'newest' | 'popular'>('newest');

  useEffect(() => {
    loadComments();
  }, [filmId]);

  const loadComments = async () => {
    setLoading(true);
    try {
      const { data: commentsData, error } = await supabase
        .from('film_comments')
        .select(`
          *,
          user_profile:user_profiles!film_comments_user_id_fkey(display_name, avatar_url)
        `)
        .eq('film_id', filmId)
        .is('deleted_at', null)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const commentsWithLikes = await Promise.all(
        (commentsData || []).map(async (comment) => {
          const { count } = await supabase
            .from('comment_likes')
            .select('*', { count: 'exact', head: true })
            .eq('comment_id', comment.id);

          let userHasLiked = false;
          if (user) {
            const { data: likeData } = await supabase
              .from('comment_likes')
              .select('id')
              .eq('comment_id', comment.id)
              .eq('user_id', user.id)
              .maybeSingle();
            userHasLiked = !!likeData;
          }

          return {
            ...comment,
            likes_count: count || 0,
            user_has_liked: userHasLiked,
          };
        })
      );

      setComments(commentsWithLikes);
    } catch (error) {
      console.error('Error loading comments:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      alert('Please sign in to comment');
      return;
    }
    if (!commentText.trim()) return;

    setSubmitting(true);
    try {
      const { error } = await supabase.from('film_comments').insert({
        film_id: filmId,
        user_id: user.id,
        content: commentText.trim(),
      });

      if (error) throw error;
      setCommentText('');
      await loadComments();
    } catch (error) {
      console.error('Error submitting comment:', error);
      alert('Failed to post comment');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    try {
      const { error } = await supabase
        .from('film_comments')
        .update({ deleted_at: new Date() })
        .eq('id', commentId);

      if (error) throw error;
      setComments(comments.filter(c => c.id !== commentId));
    } catch (error) {
      console.error('Error deleting comment:', error);
    }
  };

  const handleEditComment = async (commentId: string) => {
    if (!editText.trim()) return;

    try {
      const { error } = await supabase
        .from('film_comments')
        .update({ content: editText.trim() })
        .eq('id', commentId);

      if (error) throw error;
      setEditingId(null);
      setEditText('');
      await loadComments();
    } catch (error) {
      console.error('Error editing comment:', error);
    }
  };

  const handleLikeComment = async (commentId: string, userHasLiked: boolean) => {
    if (!user) {
      alert('Please sign in to like comments');
      return;
    }

    try {
      if (userHasLiked) {
        await supabase
          .from('comment_likes')
          .delete()
          .eq('comment_id', commentId)
          .eq('user_id', user.id);
      } else {
        await supabase.from('comment_likes').insert({
          comment_id: commentId,
          user_id: user.id,
        });
      }
      await loadComments();
    } catch (error) {
      console.error('Error liking comment:', error);
    }
  };

  const sortedComments = [...comments].sort((a, b) => {
    if (commentSort === 'popular') {
      return b.likes_count - a.likes_count;
    }
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  });

  if (loading) {
    return <div className="text-center py-8">Loading comments...</div>;
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <div className="flex items-center gap-2 mb-6">
        <MessageCircle className="w-5 h-5 text-gray-700" />
        <h3 className="text-xl font-bold text-gray-900">
          Comments ({comments.length})
        </h3>
      </div>

      {user && (
        <form onSubmit={handleSubmitComment} className="flex gap-4 mb-8 pb-8 border-b">
          <div className="w-10 h-10 rounded-full bg-red-600 flex items-center justify-center text-white font-semibold flex-shrink-0">
            {user.email?.charAt(0).toUpperCase()}
          </div>
          <div className="flex-1">
            <textarea
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              placeholder="Share your thoughts about this film..."
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-600 resize-none"
            />
            <div className="flex justify-end gap-2 mt-3">
              <button
                type="button"
                onClick={() => setCommentText('')}
                className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting || !commentText.trim()}
                className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
              >
                Post Comment
              </button>
            </div>
          </div>
        </form>
      )}

      {comments.length > 0 && (
        <div className="mb-4 flex gap-2">
          <button
            onClick={() => setCommentSort('newest')}
            className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${
              commentSort === 'newest'
                ? 'bg-gray-900 text-white'
                : 'bg-gray-100 hover:bg-gray-200'
            }`}
          >
            Newest
          </button>
          <button
            onClick={() => setCommentSort('popular')}
            className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${
              commentSort === 'popular'
                ? 'bg-gray-900 text-white'
                : 'bg-gray-100 hover:bg-gray-200'
            }`}
          >
            Most Liked
          </button>
        </div>
      )}

      <div className="space-y-4">
        {sortedComments.length === 0 ? (
          <p className="text-center text-gray-600 py-8">Be the first to comment!</p>
        ) : (
          sortedComments.map((comment) => (
            <div key={comment.id} className="flex gap-4 pb-4 border-b last:border-b-0">
              <div className="w-10 h-10 rounded-full bg-gray-300 flex-shrink-0"></div>
              <div className="flex-1">
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <h4 className="font-semibold text-gray-900">
                      {comment.user_profile?.display_name || 'User'}
                    </h4>
                    <p className="text-xs text-gray-500">
                      {new Date(comment.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  {user?.id === comment.user_profile?.display_name && (
                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          setEditingId(comment.id);
                          setEditText(comment.content);
                        }}
                        className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded transition-colors"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteComment(comment.id)}
                        className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>

                {editingId === comment.id ? (
                  <div className="space-y-2">
                    <textarea
                      value={editText}
                      onChange={(e) => setEditText(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-600 resize-none"
                      rows={2}
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          setEditingId(null);
                          setEditText('');
                        }}
                        className="px-3 py-1 text-sm text-gray-600 hover:bg-gray-100 rounded transition-colors"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={() => handleEditComment(comment.id)}
                        className="px-3 py-1 text-sm bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
                      >
                        Save
                      </button>
                    </div>
                  </div>
                ) : (
                  <p className="text-gray-900 mb-2">{comment.content}</p>
                )}

                <button
                  onClick={() => handleLikeComment(comment.id, comment.user_has_liked)}
                  className={`flex items-center gap-1.5 text-sm transition-colors ${
                    comment.user_has_liked
                      ? 'text-red-600'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  <ThumbsUp className={`w-4 h-4 ${comment.user_has_liked ? 'fill-current' : ''}`} />
                  <span>{comment.likes_count || 0}</span>
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
