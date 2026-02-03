import { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabase';
import { TrendingUp, Eye, Clock, Users, ThumbsUp, MessageSquare, Play, Download } from 'lucide-react';

interface AnalyticsData {
  date: string;
  views: number;
  watchTime: number;
  subscribers: number;
}

interface TopVideo {
  id: string;
  title: string;
  views: number;
  watchTime: number;
  likes: number;
  comments: number;
}

export function StudioAnalytics() {
  const { user } = useAuth();
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d' | 'all'>('30d');
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData[]>([]);
  const [topVideos, setTopVideos] = useState<TopVideo[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadAnalytics();
    }
  }, [user, timeRange]);

  const loadAnalytics = async () => {
    if (!user) return;

    try {
      setLoading(true);

      const daysBack = timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : timeRange === '90d' ? 90 : 365;
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - daysBack);

      const { data: uploads } = await supabase
        .from('user_uploads')
        .select('id, title, view_count, like_count, created_at')
        .eq('user_id', user.id)
        .eq('status', 'approved')
        .gte('created_at', startDate.toISOString());

      const mockAnalytics: AnalyticsData[] = [];
      for (let i = daysBack; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        mockAnalytics.push({
          date: date.toISOString().split('T')[0],
          views: Math.floor(Math.random() * 100),
          watchTime: Math.floor(Math.random() * 500),
          subscribers: Math.floor(Math.random() * 10),
        });
      }

      setAnalyticsData(mockAnalytics);

      const topVids: TopVideo[] = (uploads || []).map(u => ({
        id: u.id,
        title: u.title,
        views: u.view_count || 0,
        watchTime: Math.floor(Math.random() * 1000),
        likes: u.like_count || 0,
        comments: Math.floor(Math.random() * 50),
      })).sort((a, b) => b.views - a.views).slice(0, 10);

      setTopVideos(topVids);
    } catch (error) {
      console.error('Error loading analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const totalViews = analyticsData.reduce((sum, d) => sum + d.views, 0);
  const totalWatchTime = analyticsData.reduce((sum, d) => sum + d.watchTime, 0);
  const totalSubscribers = analyticsData[analyticsData.length - 1]?.subscribers || 0;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-gray-600 dark:text-gray-400">Loading analytics...</div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            Channel Analytics
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Detailed insights into your channel performance
          </p>
        </div>
        <div className="flex gap-2">
          {(['7d', '30d', '90d', 'all'] as const).map((range) => (
            <button
              key={range}
              onClick={() => setTimeRange(range)}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                timeRange === range
                  ? 'bg-red-600 text-white'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              {range === '7d' ? '7 Days' : range === '30d' ? '30 Days' : range === '90d' ? '90 Days' : 'All Time'}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-3">
            <Eye className="h-8 w-8 text-blue-600" />
            <span className="text-sm text-green-600 dark:text-green-400 flex items-center gap-1">
              <TrendingUp className="h-4 w-4" />
              +12%
            </span>
          </div>
          <div className="text-3xl font-bold text-gray-900 dark:text-white mb-1">
            {totalViews.toLocaleString()}
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">Total Views</div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-3">
            <Clock className="h-8 w-8 text-green-600" />
            <span className="text-sm text-green-600 dark:text-green-400 flex items-center gap-1">
              <TrendingUp className="h-4 w-4" />
              +8%
            </span>
          </div>
          <div className="text-3xl font-bold text-gray-900 dark:text-white mb-1">
            {Math.round(totalWatchTime / 60).toLocaleString()}
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">Watch Hours</div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-3">
            <Users className="h-8 w-8 text-purple-600" />
            <span className="text-sm text-green-600 dark:text-green-400 flex items-center gap-1">
              <TrendingUp className="h-4 w-4" />
              +15%
            </span>
          </div>
          <div className="text-3xl font-bold text-gray-900 dark:text-white mb-1">
            {totalSubscribers.toLocaleString()}
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">Subscribers</div>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 mb-8">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Views Over Time
        </h2>
        <div className="h-64 flex items-end justify-between gap-1">
          {analyticsData.map((data, idx) => {
            const maxViews = Math.max(...analyticsData.map(d => d.views));
            const height = (data.views / maxViews) * 100;
            return (
              <div key={idx} className="flex-1 flex flex-col items-center group">
                <div className="relative w-full">
                  <div
                    className="w-full bg-red-600 hover:bg-red-700 transition-all rounded-t"
                    style={{ height: `${height * 2}px` }}
                  >
                    <div className="opacity-0 group-hover:opacity-100 absolute -top-8 left-1/2 transform -translate-x-1/2 bg-gray-900 text-white text-xs px-2 py-1 rounded whitespace-nowrap">
                      {data.views} views
                    </div>
                  </div>
                </div>
                {idx % Math.ceil(analyticsData.length / 7) === 0 && (
                  <span className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                    {new Date(data.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            Top Performing Content
          </h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Video
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Views
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Watch Time
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Likes
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Comments
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {topVideos.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-gray-500 dark:text-gray-400">
                    No content yet. Upload videos to see analytics!
                  </td>
                </tr>
              ) : (
                topVideos.map((video, idx) => (
                  <tr key={video.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex-shrink-0 w-8 h-8 bg-red-600 rounded-full flex items-center justify-center text-white font-bold text-sm">
                          {idx + 1}
                        </div>
                        <div className="font-medium text-gray-900 dark:text-white">{video.title}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right text-gray-900 dark:text-white">
                      {video.views.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 text-right text-gray-900 dark:text-white">
                      {Math.round(video.watchTime / 60)}h
                    </td>
                    <td className="px-6 py-4 text-right text-gray-900 dark:text-white">
                      {video.likes.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 text-right text-gray-900 dark:text-white">
                      {video.comments.toLocaleString()}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="mt-6 flex justify-end">
        <button className="flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg transition-colors">
          <Download className="h-4 w-4" />
          Export Data
        </button>
      </div>
    </div>
  );
}
