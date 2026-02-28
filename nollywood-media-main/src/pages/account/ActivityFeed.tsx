import { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import { Link } from "react-router-dom";
import { Activity, Heart, MessageCircle, PlayCircle } from "lucide-react";

interface ActivityEvent {
    id: string;
    user_id: string;
    action_type: string;
    target_id: string;
    target_type: string;
    metadata: any;
    created_at: string;
}

export default function ActivityFeed() {
    const { user } = useAuth();
    const [activities, setActivities] = useState<ActivityEvent[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchActivity() {
            if (!user) {
                setLoading(false);
                return;
            }
            try {
                // 1. Fetch who the user follows
                const followsRes = await fetch('/api/query', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        table: 'user_follows',
                        operation: 'select',
                        filters: [{ column: 'follower_id', op: 'eq', value: user.id }]
                    })
                });

                if (!followsRes.ok) throw new Error('Failed to fetch follows');
                const followsData = await followsRes.json();
                const followingIds = followsData.data?.map((f: any) => f.following_id) || [];

                if (followingIds.length === 0) {
                    setActivities([]);
                    setLoading(false);
                    return;
                }

                // 2. Fetch recent user_activity for these creators
                const activityRes = await fetch('/api/query', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        table: 'user_activity',
                        operation: 'select',
                        filters: [{ column: 'user_id', op: 'in', value: followingIds }],
                        order: [{ column: 'created_at', ascending: false }],
                        limit: 30
                    })
                });

                if (activityRes.ok) {
                    const activityData = await activityRes.json();
                    setActivities(activityData.data || []);
                }
            } catch (error) {
                console.error("Error fetching activity:", error);
            } finally {
                setLoading(false);
            }
        }
        fetchActivity();
    }, [user]);

    const renderActionIcon = (type: string) => {
        switch (type) {
            case 'liked_film': return <Heart className="w-5 h-5 text-red-500 fill-red-500" />;
            case 'commented_on': return <MessageCircle className="w-5 h-5 text-blue-500" />;
            case 'uploaded_video': return <PlayCircle className="w-5 h-5 text-green-500" />;
            default: return <Activity className="w-5 h-5 text-gray-400" />;
        }
    };

    if (loading) {
        return (
            <div className="bg-white dark:bg-gray-900 min-h-screen pt-14 lg:pl-60 flex items-center justify-center">
                <div className="text-gray-500">Loading activity feed...</div>
            </div>
        );
    }

    if (!user) {
        return (
            <div className="bg-white dark:bg-gray-900 min-h-screen pt-14 lg:pl-60 flex items-center justify-center">
                <div className="text-center">
                    <Activity className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                    <h2 className="text-xl font-bold dark:text-white">Sign in required</h2>
                    <p className="text-gray-500 mt-2">Sign in to see activity from channels you follow.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-gray-50 dark:bg-gray-900 min-h-screen pt-14 lg:pl-60">
            <div className="max-w-4xl mx-auto p-6">
                <div className="flex items-center gap-3 mb-8">
                    <Activity className="w-8 h-8 text-red-600" />
                    <h1 className="text-3xl font-bold dark:text-white">Activity Feed</h1>
                </div>

                {activities.length === 0 ? (
                    <div className="text-center py-20 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
                        <Activity className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-gray-900 dark:text-white">No recent activity</h3>
                        <p className="text-gray-500 dark:text-gray-400 mt-1">
                            Creators you follow haven't posted any updates recently.
                        </p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {activities.map((activity) => (
                            <div key={activity.id} className="bg-white dark:bg-gray-800 p-5 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm hover:shadow transition-shadow">
                                <div className="flex gap-4">
                                    <div className="flex-shrink-0 mt-1">
                                        {renderActionIcon(activity.action_type)}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-gray-900 dark:text-gray-100">
                                            <Link to={`/creator/${activity.user_id}`} className="font-semibold hover:text-red-500 transition-colors">
                                                {activity.metadata?.channel_name || 'A creator'}
                                            </Link>
                                            {' '}
                                            {activity.action_type === 'liked_film' && 'liked a video'}
                                            {activity.action_type === 'commented_on' && 'commented on a video'}
                                            {activity.action_type === 'uploaded_video' && 'uploaded a new video'}
                                            {activity.action_type === 'added_playlist' && 'added a video to a playlist'}
                                        </p>

                                        {activity.metadata?.video_title && (
                                            <Link to={`/watch/${activity.target_id}`} className="block mt-2">
                                                <div className="bg-gray-50 dark:bg-gray-900 p-3 rounded-lg border border-gray-100 dark:border-gray-800 hover:border-red-500/50 transition-colors">
                                                    <span className="font-medium dark:text-white line-clamp-1">{activity.metadata.video_title}</span>
                                                    {activity.metadata?.comment_text && (
                                                        <span className="text-sm text-gray-500 dark:text-gray-400 mt-1 block line-clamp-2">"{activity.metadata.comment_text}"</span>
                                                    )}
                                                </div>
                                            </Link>
                                        )}

                                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-3 flex items-center gap-1">
                                            {new Date(activity.created_at).toLocaleDateString()} at {new Date(activity.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
