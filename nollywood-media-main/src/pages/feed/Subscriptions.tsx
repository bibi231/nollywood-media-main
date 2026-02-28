import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useCatalog } from "../../context/CatalogProvider";
import { useAuth } from "../../context/AuthContext";
import { PlaySquare, Film as FilmIcon } from "lucide-react";

export default function Subscriptions() {
    const { filmCatalog } = useCatalog();
    const { user } = useAuth();
    const navigate = useNavigate();
    const [followingIds, setFollowingIds] = useState<string[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchSubscriptions() {
            if (!user) {
                setLoading(false);
                return;
            }
            try {
                // Using the standard RPC proxy logic for Next-Auth sessions
                const response = await fetch('/api/query', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        table: 'user_follows',
                        operation: 'select',
                        filters: [{ column: 'follower_id', op: 'eq', value: user.id }]
                    })
                });

                if (response.ok) {
                    const { data } = await response.json();
                    if (data) {
                        setFollowingIds(data.map((f: any) => f.following_id));
                    }
                }
            } catch (error) {
                console.error("Error fetching subscriptions:", error);
            } finally {
                setLoading(false);
            }
        }
        fetchSubscriptions();
    }, [user]);

    const subscriptionFilms = useMemo(() => {
        if (!filmCatalog || followingIds.length === 0) return [];
        return filmCatalog
            .filter((film: any) => followingIds.includes(film.creator_id || film.user_id))
            .sort((a: any, b: any) => new Date(b.created_at || '').getTime() - new Date(a.created_at || '').getTime());
    }, [filmCatalog, followingIds]);

    if (loading) {
        return (
            <div className="bg-white dark:bg-gray-900 min-h-screen pt-14 lg:pl-60 flex items-center justify-center">
                <div className="text-gray-600 dark:text-gray-400 text-lg">Loading subscriptions...</div>
            </div>
        );
    }

    if (!user) {
        return (
            <div className="bg-white dark:bg-gray-900 min-h-screen pt-14 lg:pl-60 flex flex-col items-center justify-center">
                <PlaySquare className="w-16 h-16 text-gray-400 mb-4" />
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">Don't miss new videos</h2>
                <p className="text-gray-600 dark:text-gray-400 mb-6">
                    Sign in to see updates from your favorite NaijaMation channels
                </p>
                <button
                    onClick={() => navigate('/login')}
                    className="px-6 py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors"
                >
                    Sign in
                </button>
            </div>
        );
    }

    return (
        <div className="bg-white dark:bg-gray-900 min-h-screen pt-14 lg:pl-60 text-gray-900 dark:text-white">
            <div className="max-w-[2000px] mx-auto p-6 lg:p-8">
                <div className="flex items-center gap-3 mb-8">
                    <PlaySquare className="w-8 h-8 text-red-600" />
                    <h1 className="text-3xl font-bold">Subscriptions</h1>
                </div>

                {subscriptionFilms.length === 0 ? (
                    <div className="text-center max-w-md mx-auto mt-20">
                        <FilmIcon className="w-16 h-16 text-gray-300 dark:text-gray-700 mx-auto mb-4" />
                        <h2 className="text-xl font-bold mb-2">Your feed is empty</h2>
                        <p className="text-gray-500 mb-6">
                            Follow creators to see their newest videos here.
                        </p>
                        <button
                            onClick={() => navigate('/creator-discover')}
                            className="px-6 py-2.5 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg font-medium transition-colors"
                        >
                            Find Creators
                        </button>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6">
                        {subscriptionFilms.map((film) => (
                            <div key={film.id} className="cursor-pointer group flex flex-col" onClick={() => navigate(`/watch/${film.id}`)}>
                                <div className="relative aspect-video bg-gray-200 dark:bg-gray-800 rounded-xl overflow-hidden mb-3">
                                    <img
                                        src={film.poster_url || '/placeholder.jpg'}
                                        alt={film.title}
                                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                    />
                                    {film.runtime_min && (
                                        <div className="absolute bottom-2 right-2 bg-black/80 text-white text-xs px-1.5 py-0.5 rounded font-medium">
                                            {film.runtime_min} min
                                        </div>
                                    )}
                                </div>
                                <div className="flex gap-3 px-1">
                                    <h3 className="font-semibold text-sm line-clamp-2 group-hover:text-red-500 transition-colors flex-1">
                                        {film.title}
                                    </h3>
                                </div>
                                <div className="mt-1 px-1">
                                    <p className="text-xs text-gray-500 dark:text-gray-400">
                                        {film.views?.toLocaleString() || 0} views • {new Date(film.created_at || '').toLocaleDateString()}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
