import { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabase';
import { Eye, Clock, Users, TrendingUp, ThumbsUp, MessageSquare, Play } from 'lucide-react';
import { Link } from 'react-router-dom';

interface Stats {
  totalViews: number;
  watchTime: number;
  subscribers: number;
  totalContent: number;
  avgRating: number;
  totalComments: number;
  recentViews: number;
}

interface RecentUpload {
  id: string;
  title: string;
  views: number;
  created_at: string;
  status: string;
}

export function StudioDashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState<Stats>({
    totalViews: 0,
    watchTime: 0,
    subscribers: 0,
    totalContent: 0,
    avgRating: 0,
    totalComments: 0,
    recentViews: 0,
  });
  const [recentUploads, setRecentUploads] = useState<RecentUpload[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadStats();
      loadRecentUploads();
    }
  }, [user]);

  const loadStats = async () => {
    if (!user) return;

    try {
      const [uploadsResult, profileResult, playbackResult] = await Promise.all([
        supabase
          .from('user_uploads')
          .select('view_count, like_count')
          .eq('user_id', user.id)
          .eq('status', 'approved'),
        supabase
          .from('creator_profiles')
          .select('follower_count')
          .eq('user_id', user.id)
          .maybeSingle(),
        supabase
          .from('playback_events')
          .select('duration_watched')
          .eq('user_id', user.id),
      ]);

      const totalViews = uploadsResult.data?.reduce((sum, u) => sum + (u.view_count || 0), 0) || 0;
      const watchTimeMinutes = playbackResult.data?.reduce((sum, p) => sum + (p.duration_watched || 0), 0) || 0;

      const twoDaysAgo = new Date();
      twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);

      const { data: recentViewsData } = await supabase
        .from('playback_events')
        .select('id', { count: 'exact' })
        .eq('user_id', user.id)
        .gte('created_at', twoDaysAgo.toISOString());

      setStats({
        totalViews,
        watchTime: Math.round(watchTimeMinutes / 60),
        subscribers: profileResult.data?.follower_count || 0,
        totalContent: uploadsResult.data?.length || 0,
        avgRating: 0,
        totalComments: 0,
        recentViews: recentViewsData?.length || 0,
      });
    } catch (error) {
      console.error('Error loading stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadRecentUploads = async () => {
    if (!user) return;

    try {
      const { data } = await supabase
        .from('user_uploads')
        .select('id, title, view_count, created_at, status')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(5);

      setRecentUploads(data || []);
    } catch (error) {
      console.error('Error loading recent uploads:', error);
    }
  };

  const statCards = [
    { icon: Eye, label: 'Total Views', value: stats.totalViews.toLocaleString(), color: 'bg-blue-500' },
    { icon: Clock, label: 'Watch Time (hrs)', value: stats.watchTime.toLocaleString(), color: 'bg-green-500' },
    { icon: Users, label: 'Subscribers', value: stats.subscribers.toLocaleString(), color: 'bg-purple-500' },
    { icon: Play, label: 'Content', value: stats.totalContent.toLocaleString(), color: 'bg-orange-500' },
    { icon: TrendingUp, label: 'Views (48h)', value: stats.recentViews.toLocaleString(), color: 'bg-red-500' },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-gray-600 dark:text-gray-400">Loading your studio...</div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          Channel Dashboard
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Track your content performance and grow your audience
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
        {statCards.map((card) => (
          <div key={card.label} className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-3">
              <div className={`p-3 rounded-lg ${card.color}`}>
                <card.icon className="h-6 w-6 text-white" />
              </div>
            </div>
            <div className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
              {card.value}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">{card.label}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Recent Uploads
            </h2>
          </div>
          <div className="p-6">
            {recentUploads.length === 0 ? (
              <p className="text-gray-500 dark:text-gray-400 text-center py-8">
                No uploads yet. Start creating content!
              </p>
            ) : (
              <div className="space-y-4">
                {recentUploads.map((upload) => (
                  <div key={upload.id} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium text-gray-900 dark:text-white truncate">
                        {upload.title}
                      </h3>
                      <div className="flex items-center gap-4 mt-1 text-sm text-gray-500 dark:text-gray-400">
                        <span className="flex items-center gap-1">
                          <Eye className="h-3 w-3" />
                          {upload.views || 0} views
                        </span>
                        <span>{new Date(upload.created_at).toLocaleDateString()}</span>
                      </div>
                    </div>
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      upload.status === 'approved' ? 'bg-green-100 text-green-800' :
                      upload.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {upload.status}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Quick Actions
            </h2>
          </div>
          <div className="p-6 space-y-3">
            <Link
              to="/account/upload"
              className="block w-full px-4 py-3 bg-red-600 hover:bg-red-700 text-white text-center rounded-lg font-medium transition-colors"
            >
              Upload New Content
            </Link>
            <Link
              to="/studio/analytics"
              className="block w-full px-4 py-3 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-900 dark:text-white text-center rounded-lg font-medium transition-colors"
            >
              View Detailed Analytics
            </Link>
            <Link
              to="/studio/subscribers"
              className="block w-full px-4 py-3 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-900 dark:text-white text-center rounded-lg font-medium transition-colors"
            >
              Manage Subscribers
            </Link>
            <Link
              to="/account/my-uploads"
              className="block w-full px-4 py-3 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-900 dark:text-white text-center rounded-lg font-medium transition-colors"
            >
              View All Content
            </Link>
          </div>
        </div>
      </div>

      <div className="mt-6 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-6">
        <div className="flex items-start gap-4">
          <TrendingUp className="h-6 w-6 text-blue-600 dark:text-blue-400 flex-shrink-0" />
          <div>
            <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-1">
              Grow Your Channel
            </h3>
            <p className="text-sm text-blue-800 dark:text-blue-200 mb-3">
              Keep uploading quality content, engage with your subscribers, and watch your channel grow!
            </p>
            <ul className="text-sm text-blue-700 dark:text-blue-300 space-y-1">
              <li>• Upload consistently to keep subscribers engaged</li>
              <li>• Respond to comments to build community</li>
              <li>• Share your content on social media</li>
              <li>• Collaborate with other creators</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
