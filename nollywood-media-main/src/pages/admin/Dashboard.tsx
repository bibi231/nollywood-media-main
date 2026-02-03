import { useEffect, useState } from 'react';
import { Film, Users, Eye, TrendingUp, Upload, CheckCircle, Clock, DollarSign, PlayCircle, Star, MessageSquare, Home } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { Link } from 'react-router-dom';

interface Stats {
  totalFilms: number;
  totalUsers: number;
  totalViews: number;
  recentFilms: number;
  pendingUploads: number;
  approvedUploads: number;
  totalUploads: number;
  totalPlaybackEvents: number;
  totalRatings: number;
  averageRating: number;
  totalComments: number;
  activeSubscriptions: number;
}

interface RecentActivity {
  type: string;
  title: string;
  timestamp: string;
  user?: string;
}

interface TopContent {
  id: string;
  title: string;
  views: number;
  rating: number;
}

export function AdminDashboard() {
  const [stats, setStats] = useState<Stats>({
    totalFilms: 0,
    totalUsers: 0,
    totalViews: 0,
    recentFilms: 0,
    pendingUploads: 0,
    approvedUploads: 0,
    totalUploads: 0,
    totalPlaybackEvents: 0,
    totalRatings: 0,
    averageRating: 0,
    totalComments: 0,
    activeSubscriptions: 0,
  });
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);
  const [topContent, setTopContent] = useState<TopContent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
    loadRecentActivity();
    loadTopContent();
  }, []);

  const loadStats = async () => {
    try {
      const [
        filmsResult,
        usersResult,
        uploadsResult,
        playbackResult,
        ratingsResult,
        commentsResult,
        subscriptionsResult,
      ] = await Promise.all([
        supabase.from('films').select('id, views, created_at', { count: 'exact' }),
        supabase.from('user_roles').select('id', { count: 'exact' }),
        supabase.from('user_uploads').select('id, status, created_at', { count: 'exact' }),
        supabase.from('playback_events').select('id', { count: 'exact' }),
        supabase.from('ratings').select('stars', { count: 'exact' }),
        supabase.from('film_comments').select('id', { count: 'exact' }),
        supabase.from('subscriptions').select('id').eq('status', 'active'),
      ]);

      const totalViews = filmsResult.data?.reduce((sum, film) => sum + (film.views || 0), 0) || 0;
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      const recentFilms = filmsResult.data?.filter(
        (film) => new Date(film.created_at) > thirtyDaysAgo
      ).length || 0;

      const pendingUploads = uploadsResult.data?.filter(u => u.status === 'pending').length || 0;
      const approvedUploads = uploadsResult.data?.filter(u => u.status === 'approved').length || 0;

      const avgRating = ratingsResult.data?.length
        ? ratingsResult.data.reduce((sum, r) => sum + r.stars, 0) / ratingsResult.data.length
        : 0;

      setStats({
        totalFilms: filmsResult.count || 0,
        totalUsers: usersResult.count || 0,
        totalViews,
        recentFilms,
        pendingUploads,
        approvedUploads,
        totalUploads: uploadsResult.count || 0,
        totalPlaybackEvents: playbackResult.count || 0,
        totalRatings: ratingsResult.count || 0,
        averageRating: avgRating,
        totalComments: commentsResult.count || 0,
        activeSubscriptions: subscriptionsResult.data?.length || 0,
      });
    } catch (error) {
      console.error('Error loading stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadRecentActivity = async () => {
    try {
      const { data: uploads } = await supabase
        .from('user_uploads')
        .select('title, created_at, status')
        .order('created_at', { ascending: false })
        .limit(5);

      const activities: RecentActivity[] = uploads?.map(u => ({
        type: u.status === 'approved' ? 'upload_approved' : 'upload_submitted',
        title: u.title,
        timestamp: u.created_at,
      })) || [];

      setRecentActivity(activities);
    } catch (error) {
      console.error('Error loading activity:', error);
    }
  };

  const loadTopContent = async () => {
    try {
      const { data: films } = await supabase
        .from('films')
        .select('id, title, views')
        .order('views', { ascending: false })
        .limit(5);

      if (!films) {
        setTopContent([]);
        return;
      }

      // Get average ratings for these films
      const filmsWithRatings = await Promise.all(
        films.map(async (film) => {
          const { data: ratings } = await supabase
            .from('ratings')
            .select('stars')
            .eq('film_id', film.id);

          const avgRating = ratings && ratings.length > 0
            ? ratings.reduce((sum, r) => sum + r.stars, 0) / ratings.length
            : 0;

          return {
            ...film,
            rating: avgRating,
          };
        })
      );

      setTopContent(filmsWithRatings || []);
    } catch (error) {
      console.error('Error loading top content:', error);
    }
  };

  const statCards = [
    { icon: Film, label: 'Total Films', value: stats.totalFilms, color: 'bg-blue-500' },
    { icon: Users, label: 'Total Users', value: stats.totalUsers, color: 'bg-green-500' },
    { icon: Eye, label: 'Total Views', value: stats.totalViews.toLocaleString(), color: 'bg-purple-500' },
    { icon: TrendingUp, label: 'Recent Films (30d)', value: stats.recentFilms, color: 'bg-orange-500' },
    { icon: Upload, label: 'Pending Uploads', value: stats.pendingUploads, color: 'bg-yellow-500', link: '/admin/user-uploads' },
    { icon: CheckCircle, label: 'Approved Uploads', value: stats.approvedUploads, color: 'bg-green-500' },
    { icon: PlayCircle, label: 'Playback Events', value: stats.totalPlaybackEvents.toLocaleString(), color: 'bg-red-500' },
    { icon: Star, label: 'Average Rating', value: stats.averageRating.toFixed(1), color: 'bg-yellow-500' },
    { icon: MessageSquare, label: 'Total Comments', value: stats.totalComments, color: 'bg-indigo-500' },
    { icon: DollarSign, label: 'Active Subscriptions', value: stats.activeSubscriptions, color: 'bg-emerald-500' },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-gray-600">Loading dashboard...</div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Dashboard</h1>
          <p className="text-gray-600">Overview of your platform's performance</p>
        </div>
        <Link
          to="/"
          className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors"
        >
          <Home className="h-4 w-4" />
          Back to Home
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 mb-8">
        {statCards.map((card) => (
          <div key={card.label} className="bg-white rounded-lg shadow p-6 hover:shadow-md transition-shadow">
            {card.link ? (
              <Link to={card.link} className="block">
                <div className="flex items-center justify-between mb-3">
                  <div className={`p-3 rounded-lg ${card.color}`}>
                    <card.icon className="h-6 w-6 text-white" />
                  </div>
                  <span className="text-xs text-gray-500">View</span>
                </div>
                <div className="text-2xl font-bold text-gray-900 mb-1">{card.value}</div>
                <div className="text-sm text-gray-600">{card.label}</div>
              </Link>
            ) : (
              <>
                <div className="flex items-center justify-between mb-3">
                  <div className={`p-3 rounded-lg ${card.color}`}>
                    <card.icon className="h-6 w-6 text-white" />
                  </div>
                </div>
                <div className="text-2xl font-bold text-gray-900 mb-1">{card.value}</div>
                <div className="text-sm text-gray-600">{card.label}</div>
              </>
            )}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h2>
          {recentActivity.length === 0 ? (
            <p className="text-gray-500 text-sm">No recent activity</p>
          ) : (
            <div className="space-y-3">
              {recentActivity.map((activity, idx) => (
                <div key={idx} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                  <div className={`p-2 rounded ${
                    activity.type === 'upload_approved' ? 'bg-green-100' : 'bg-blue-100'
                  }`}>
                    {activity.type === 'upload_approved' ? (
                      <CheckCircle className="h-4 w-4 text-green-600" />
                    ) : (
                      <Upload className="h-4 w-4 text-blue-600" />
                    )}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">{activity.title}</p>
                    <p className="text-xs text-gray-500">
                      {new Date(activity.timestamp).toLocaleString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Top Content</h2>
          {topContent.length === 0 ? (
            <p className="text-gray-500 text-sm">No content yet</p>
          ) : (
            <div className="space-y-3">
              {topContent.map((content, idx) => (
                <div key={content.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <div className="flex-shrink-0 w-8 h-8 bg-red-600 rounded-full flex items-center justify-center text-white font-bold">
                    {idx + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{content.title}</p>
                    <div className="flex items-center gap-3 text-xs text-gray-500">
                      <span className="flex items-center gap-1">
                        <Eye className="h-3 w-3" />
                        {content.views?.toLocaleString() || 0}
                      </span>
                      <span className="flex items-center gap-1">
                        <Star className="h-3 w-3" />
                        {typeof content.rating === 'number' ? content.rating.toFixed(1) : 'N/A'}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
