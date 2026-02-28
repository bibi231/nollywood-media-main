import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { Heart, MessageCircle, MoreVertical, Image as ImageIcon } from 'lucide-react';

interface CommunityPostsProps {
    creatorId: string;
    isOwner?: boolean;
}

interface Post {
    id: string;
    content: string;
    image_urls: string[];
    likes_count: number;
    comments_count: number;
    created_at: string;
    user_has_liked?: boolean;
    creator: {
        channel_name: string;
        channel_avatar: string;
    };
}

export function CommunityPosts({ creatorId, isOwner }: CommunityPostsProps) {
    const { user } = useAuth();
    const [posts, setPosts] = useState<Post[]>([]);
    const [loading, setLoading] = useState(true);

    // Posting State
    const [newPostContent, setNewPostContent] = useState('');
    const [creating, setCreating] = useState(false);

    useEffect(() => {
        loadPosts();
    }, [creatorId, user]);

    const loadPosts = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('creator_posts')
                .select(`
          id, content, image_urls, likes_count, comments_count, created_at,
          creator:users(id)
        `)
                .eq('creator_id', creatorId)
                .order('created_at', { ascending: false });

            if (error) throw error;

            // Note: creator_posts joins to users. Because we want channel_name, we also need to fetch creator_profiles.
            // For simplicity, we fetch the profile once.
            const { data: profileData } = await supabase
                .from('creator_profiles')
                .select('channel_name, channel_avatar')
                .eq('user_id', creatorId)
                .single();

            let formattedPosts = (data || []).map((p: any) => ({
                ...p,
                creator: profileData || { channel_name: 'Creator', channel_avatar: '' },
                user_has_liked: false
            }));

            // Check likes if logged in
            if (user && formattedPosts.length > 0) {
                const { data: likes } = await supabase
                    .from('creator_post_likes')
                    .select('post_id')
                    .eq('user_id', user.id)
                    .in('post_id', formattedPosts.map(p => p.id));

                const likedIds = new Set(likes?.map(l => l.post_id) || []);
                formattedPosts = formattedPosts.map(p => ({
                    ...p,
                    user_has_liked: likedIds.has(p.id)
                }));
            }

            setPosts(formattedPosts);
        } catch (e) {
            console.error('Error loading posts:', e);
        } finally {
            setLoading(false);
        }
    };

    const handlePost = async () => {
        if (!newPostContent.trim() || !user) return;
        setCreating(true);
        try {
            const { error } = await supabase
                .from('creator_posts')
                .insert({
                    creator_id: user.id,
                    content: newPostContent.trim(),
                    image_urls: []
                });

            if (error) throw error;
            setNewPostContent('');
            loadPosts();
        } catch (e) {
            console.error('Error creating post', e);
        } finally {
            setCreating(false);
        }
    };

    const toggleLike = async (postId: string, isLiked: boolean) => {
        if (!user) return;

        // Optimistic UI
        setPosts(prev => prev.map(p => {
            if (p.id === postId) {
                return {
                    ...p,
                    user_has_liked: !isLiked,
                    likes_count: isLiked ? Math.max(0, p.likes_count - 1) : p.likes_count + 1
                };
            }
            return p;
        }));

        try {
            if (isLiked) {
                await supabase
                    .from('creator_post_likes')
                    .delete()
                    .eq('post_id', postId)
                    .eq('user_id', user.id);
            } else {
                await supabase
                    .from('creator_post_likes')
                    .insert({ post_id: postId, user_id: user.id });
            }
        } catch (e) {
            console.error('Error toggling like:', e);
            loadPosts(); // Revert
        }
    };

    const formatDate = (dateStr: string) => {
        const date = new Date(dateStr);
        const now = new Date();
        const diffHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

        if (diffHours < 24) {
            if (diffHours < 1) return `${Math.floor(diffHours * 60)} minutes ago`;
            return `${Math.floor(diffHours)} hours ago`;
        }
        return date.toLocaleDateString();
    };

    if (loading) {
        return <div className="py-8 text-center text-gray-400">Loading community posts...</div>;
    }

    return (
        <div className="max-w-3xl mx-auto space-y-6">
            {isOwner && (
                <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-100 dark:border-gray-800">
                    <textarea
                        value={newPostContent}
                        onChange={e => setNewPostContent(e.target.value)}
                        placeholder="Post an update to your fans..."
                        className="w-full bg-transparent border-b border-gray-200 dark:border-gray-700 pb-2 text-gray-900 dark:text-white placeholder-gray-500 outline-none resize-none min-h-[80px]"
                    />
                    <div className="flex items-center justify-between mt-3">
                        <button className="p-2 text-gray-500 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-full transition-colors">
                            <ImageIcon className="w-5 h-5" />
                        </button>
                        <button
                            onClick={handlePost}
                            disabled={!newPostContent.trim() || creating}
                            className="px-4 py-2 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white rounded-full font-medium text-sm transition-colors"
                        >
                            Post
                        </button>
                    </div>
                </div>
            )}

            {posts.length === 0 ? (
                <div className="text-center py-12 bg-gray-50 dark:bg-gray-800 rounded-xl">
                    <MessageCircle className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                    <p className="text-gray-600 dark:text-gray-400">No community posts yet.</p>
                </div>
            ) : (
                posts.map(post => (
                    <div key={post.id} className="bg-white dark:bg-gray-800 rounded-xl p-5 shadow-sm border border-gray-100 dark:border-gray-800">
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-red-100 dark:bg-red-900 overflow-hidden flex-shrink-0">
                                    {post.creator?.channel_avatar ? (
                                        <img src={post.creator.channel_avatar} alt={post.creator.channel_name} className="w-full h-full object-cover" />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-red-600 dark:text-red-400 font-bold">
                                            {post.creator?.channel_name?.[0] || 'C'}
                                        </div>
                                    )}
                                </div>
                                <div>
                                    <h4 className="font-semibold text-gray-900 dark:text-white text-sm">{post.creator?.channel_name}</h4>
                                    <p className="text-xs text-gray-500 dark:text-gray-400">{formatDate(post.created_at)}</p>
                                </div>
                            </div>
                            <button className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 rounded-full">
                                <MoreVertical className="w-4 h-4" />
                            </button>
                        </div>

                        <p className="text-gray-800 dark:text-gray-200 text-sm whitespace-pre-wrap mb-4">
                            {post.content}
                        </p>

                        {post.image_urls && post.image_urls.length > 0 && (
                            <div className="rounded-xl overflow-hidden mb-4 border border-gray-200 dark:border-gray-700">
                                <img src={post.image_urls[0]} alt="Post attachment" className="w-full h-auto max-h-[400px] object-cover" />
                            </div>
                        )}

                        <div className="flex items-center gap-6 pt-3 border-t border-gray-100 dark:border-gray-700">
                            <button
                                onClick={() => toggleLike(post.id, post.user_has_liked || false)}
                                className={`flex items-center gap-2 text-sm font-medium transition-colors ${post.user_has_liked ? 'text-red-600' : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'}`}
                            >
                                <Heart className={`w-5 h-5 ${post.user_has_liked ? 'fill-red-600' : ''}`} />
                                {post.likes_count > 0 && post.likes_count}
                            </button>

                            <button className="flex items-center gap-2 text-sm font-medium text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors">
                                <MessageCircle className="w-5 h-5" />
                                {post.comments_count > 0 && post.comments_count}
                            </button>
                        </div>
                    </div>
                ))
            )}
        </div>
    );
}
