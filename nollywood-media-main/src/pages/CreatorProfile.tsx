import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import { useCatalog } from '../context/CatalogProvider';
import { BackButton } from '../components/BackButton';
import { UserPlus, UserCheck, Users, Film as FilmIcon, Calendar, CheckCircle } from 'lucide-react';
import { CommunityPosts } from '../components/CommunityPosts';
import { SEO } from '../components/SEO';

interface CreatorProfile {
    id: string;
    user_id: string;
    channel_name: string;
    channel_description: string;
    channel_avatar: string;
    subscriber_count: number;
    verification_status: string;
    created_at: string;
}

export default function CreatorProfile() {
    const { id } = useParams<{ id: string }>();
    const { user } = useAuth();
    const { filmCatalog } = useCatalog();
    const navigate = useNavigate();

    const [creator, setCreator] = useState<CreatorProfile | null>(null);
    const [isFollowing, setIsFollowing] = useState(false);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'videos' | 'community'>('videos');

    useEffect(() => {
        if (id) loadCreator();
    }, [id, user]);

    const loadCreator = async () => {
        if (!id) return;
        try {
            let data = null;
            // Only query DB if ID looks like a UUID
            if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)) {
                const { data: dbData, error } = await supabase
                    .from('creator_profiles')
                    .select('*')
                    .eq('user_id', id)
                    .maybeSingle();
                if (!error && dbData) data = dbData;
            }

            if (!data) {
                // Determine mock profile from text slug if DB fails or it's a mocked string
                const decodedName = decodeURIComponent(id);
                data = {
                    user_id: id,
                    channel_name: decodedName,
                    channel_description: `Official channel for ${decodedName}.`,
                    channel_avatar: '',
                    subscriber_count: Math.floor(Math.random() * 50000) + 1000,
                    verification_status: 'verified',
                    created_at: new Date().toISOString()
                };
            }

            setCreator(data);

            // Check follow status (only if valid UUID)
            if (user && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(data.user_id)) {
                const { data: followData } = await supabase
                    .from('user_follows')
                    .select('id')
                    .eq('follower_id', user.id)
                    .eq('following_id', data.user_id)
                    .maybeSingle();
                setIsFollowing(!!followData);
            }
        } catch (err) {
            console.error('Error loading creator:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleFollowToggle = async () => {
        if (!user || !creator) {
            alert('Please sign in to follow creators');
            return;
        }

        try {
            if (isFollowing) {
                await supabase
                    .from('user_follows')
                    .delete()
                    .eq('follower_id', user.id)
                    .eq('following_id', creator.user_id);
            } else {
                await supabase.from('user_follows').insert({
                    follower_id: user.id,
                    following_id: creator.user_id,
                });
            }
            setIsFollowing(!isFollowing);
        } catch (err) {
            console.error('Error toggling follow:', err);
        }
    };

    // Filter films by this creator's studio label or user_id
    const creatorFilms = filmCatalog.filter(
        (f) => f.studio_label?.toLowerCase() === creator?.channel_name?.toLowerCase()
    );

    if (loading) {
        return (
            <div className="bg-white dark:bg-gray-900 min-h-screen pt-14 lg:pl-60 flex items-center justify-center">
                <div className="text-gray-600 dark:text-gray-400">Loading profile...</div>
            </div>
        );
    }

    if (!creator) {
        return (
            <div className="bg-white dark:bg-gray-900 min-h-screen pt-14 lg:pl-60 flex items-center justify-center">
                <div className="text-center">
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Creator Not Found</h2>
                    <p className="text-gray-600 dark:text-gray-400 mb-4">This creator profile doesn't exist.</p>
                    <button onClick={() => navigate(-1)} className="px-4 py-2 bg-red-600 text-white rounded-lg">
                        Go Back
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-black min-h-screen pt-14 lg:pl-60 text-white">
            <div className="relative border-b border-gray-800">
                {/* Header Banner */}
                <div className="h-48 bg-gradient-to-br from-red-600 via-red-800 to-gray-900">
                    {creator.channel_avatar && (
                        <img src={creator.channel_avatar} alt="" className="w-full h-full object-cover opacity-30" />
                    )}
                </div>

                {/* Profile Info Overlay */}
                <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black/80 to-transparent">
                    <div className="flex items-end gap-4">
                        <div className="w-20 h-20 rounded-full bg-gray-300 dark:bg-gray-700 border-4 border-white overflow-hidden flex-shrink-0">
                            {creator.channel_avatar ? (
                                <img src={creator.channel_avatar} alt={creator.channel_name} className="w-full h-full object-cover" />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center text-2xl font-bold text-gray-500">
                                    {creator.channel_name?.[0]}
                                </div>
                            )}
                        </div>
                        <div className="flex-1 min-w-0">
                            <h1 className="text-2xl font-bold text-white flex items-center gap-2">
                                {creator.channel_name}
                                {creator.verification_status === 'verified' && (
                                    <CheckCircle className="h-5 w-5 text-blue-400 fill-blue-400" />
                                )}
                            </h1>
                            <div className="flex items-center gap-4 mt-1 text-sm text-gray-300">
                                <span className="flex items-center gap-1">
                                    <Users className="h-4 w-4" />
                                    {creator.subscriber_count?.toLocaleString() || 0} subscribers
                                </span>
                                <span className="flex items-center gap-1">
                                    <FilmIcon className="h-4 w-4" />
                                    {creatorFilms.length} videos
                                </span>
                                <span className="flex items-center gap-1">
                                    <Calendar className="h-4 w-4" />
                                    Joined {new Date(creator.created_at).getFullYear()}
                                </span>
                            </div>
                        </div>
                        <button
                            onClick={handleFollowToggle}
                            className={`flex-shrink-0 flex items-center gap-2 px-6 py-2.5 rounded-lg font-semibold transition-all ${isFollowing
                                ? 'bg-white/20 backdrop-blur text-white hover:bg-white/30'
                                : 'bg-red-600 hover:bg-red-700 text-white'
                                }`}
                        >
                            {isFollowing ? <UserCheck className="h-5 w-5" /> : <UserPlus className="h-5 w-5" />}
                            {isFollowing ? 'Following' : 'Follow'}
                        </button>
                    </div>
                </div>
            </div>

            <div className="p-6">
                {/* About */}
                {creator.channel_description && (
                    <div className="bg-gray-900 border border-gray-800 rounded-lg p-4 mb-8">
                        <h2 className="text-sm font-semibold text-white mb-2">About</h2>
                        <p className="text-sm text-gray-400">{creator.channel_description}</p>
                    </div>
                )}

                {/* Tabs */}
                <div className="flex items-center gap-6 border-b border-gray-800 mb-6">
                    <button
                        onClick={() => setActiveTab('videos')}
                        className={`pb-3 text-sm font-semibold transition-colors border-b-2 ${activeTab === 'videos' ? 'border-red-600 text-red-600' : 'border-transparent text-gray-500 hover:text-white'}`}
                    >
                        Videos ({creatorFilms.length})
                    </button>
                    <button
                        onClick={() => setActiveTab('community')}
                        className={`pb-3 text-sm font-semibold transition-colors border-b-2 ${activeTab === 'community' ? 'border-red-600 text-red-600' : 'border-transparent text-gray-500 hover:text-white'}`}
                    >
                        Community
                    </button>
                </div>

                {/* Content */}
                {activeTab === 'videos' ? (
                    <div className="mb-8">
                        {creatorFilms.length > 0 ? (
                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                                {creatorFilms.map((film) => (
                                    <div key={film.id} className="cursor-pointer group" onClick={() => navigate(`/watch/${film.id}`)}>
                                        <div className="aspect-video bg-gray-800 rounded-lg overflow-hidden mb-2 relative">
                                            <img
                                                src={film.poster_url || '/placeholder.jpg'}
                                                alt={film.title}
                                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                            />
                                        </div>
                                        <h3 className="font-semibold text-sm text-white line-clamp-2 group-hover:text-red-500 transition-colors">{film.title}</h3>
                                        <div className="flex items-center gap-2 text-xs text-gray-400 mt-1">
                                            <span>{film.views?.toLocaleString() || 0} views</span>
                                            <span>•</span>
                                            <span>{film.release_year}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-12 bg-gray-900 border border-gray-800 rounded-lg">
                                <FilmIcon className="h-12 w-12 text-gray-600 mx-auto mb-3" />
                                <p className="text-gray-400">No videos uploaded yet</p>
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="mb-8">
                        <CommunityPosts creatorId={creator.user_id} isOwner={user?.id === creator.user_id} />
                    </div>
                )}
            </div>
        </div>
    );
}
