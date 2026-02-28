/**
 * ADMIN CMS DASHBOARD
 * Main analytics and moderation portal for admins only
 */

import { useState, useEffect } from 'react';
import { BarChart3, TrendingUp, Users, Video, MessageSquare, AlertTriangle, Settings } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import { useNavigate } from 'react-router-dom';

export default function AdminDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalUsers: 0,
    activeToday: 0,
    totalFilms: 0,
    totalPlaybacks: 0,
    totalComments: 0,
    flaggedContent: 0,
    newUsersThisWeek: 0,
    revenue: 0
  });

  const [recentActivity, setRecentActivity] = useState<any[]>([]);
  const [flaggedItems, setFlaggedItems] = useState<any[]>([]);

  useEffect(() => {
    // Verify admin access
    const checkAdmin = async () => {
      if (!user) {
        navigate('/admin/login');
        return;
      }

      const { data: role } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .maybeSingle();

      if (!role || role.role !== 'admin') {
        navigate('/');
        return;
      }

      loadDashboardData();
    };

    checkAdmin();
  }, [user]);

  async function loadDashboardData() {
    try {
      // Get platform stats
      const [
        usersRes,
        filmsRes,
        eventsRes,
        commentsRes,
        uploadsRes
      ] = await Promise.all([
        supabase.from('user_profiles').select('count(*)', { count: 'exact', head: true }),
        supabase.from('films').select('count(*)', { count: 'exact', head: true }),
        supabase.from('playback_events').select('count(*)', { count: 'exact', head: true }),
        supabase.from('film_comments').select('count(*)', { count: 'exact', head: true }),
        supabase.from('user_content_uploads').select('count(*)', { count: 'exact', head: true })
      ]);

      // Get active users today
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const { data: activeEventsToday } = await supabase
        .from('playback_events')
        .select('user_id')
        .gte('created_at', today.toISOString());
      const activeUsersToday = new Set(activeEventsToday?.map(e => e.user_id) || []).size;

      // Get new users this week
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      const { data: newUsers } = await supabase
        .from('user_profiles')
        .select('id')
        .gte('created_at', weekAgo.toISOString());

      // Get flagged content (pending moderation)
      const { data: flagged } = await supabase
        .from('user_content_uploads')
        .select('*')
        .eq('status', 'pending')
        .limit(10);

      // Get recent activity
      const { data: recentEvents } = await supabase
        .from('playback_events')
        .select(`
          id,
          created_at,
          event_type,
          user:user_profiles(display_name),
          film:films(title)
        `)
        .order('created_at', { ascending: false })
        .limit(20);

      setStats({
        totalUsers: usersRes.count || 0,
        activeToday: activeUsersToday,
        totalFilms: filmsRes.count || 0,
        totalPlaybacks: eventsRes.count || 0,
        totalComments: commentsRes.count || 0,
        flaggedContent: uploadsRes.count || 0,
        newUsersThisWeek: newUsers?.length || 0,
        revenue: 0 // TODO: Calculate from subscriptions
      });

      setRecentActivity(recentEvents || []);
      setFlaggedItems(flagged || []);
      setLoading(false);
    } catch (error) {
      console.error('Error loading dashboard:', error);
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="bg-gray-50 min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin">
            <BarChart3 className="w-12 h-12 text-blue-600" />
          </div>
          <p className="mt-4 text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 min-h-screen p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Admin CMS Dashboard</h1>
          <p className="text-gray-600 mt-2">Platform analytics, moderation, and management</p>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">Total Users</p>
                <p className="text-3xl font-bold text-gray-900">{stats.totalUsers.toLocaleString()}</p>
                <p className="text-green-600 text-xs mt-2">+{stats.newUsersThisWeek} this week</p>
              </div>
              <Users className="w-10 h-10 text-blue-600 opacity-20" />
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">Active Today</p>
                <p className="text-3xl font-bold text-gray-900">{stats.activeToday.toLocaleString()}</p>
                <p className="text-blue-600 text-xs mt-2">{((stats.activeToday / stats.totalUsers) * 100).toFixed(1)}% engagement</p>
              </div>
              <TrendingUp className="w-10 h-10 text-green-600 opacity-20" />
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">Total Films</p>
                <p className="text-3xl font-bold text-gray-900">{stats.totalFilms.toLocaleString()}</p>
                <p className="text-purple-600 text-xs mt-2">{stats.totalPlaybacks.toLocaleString()} plays</p>
              </div>
              <Video className="w-10 h-10 text-purple-600 opacity-20" />
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">Flagged Content</p>
                <p className="text-3xl font-bold text-red-600">{stats.flaggedContent}</p>
                <p className="text-red-600 text-xs mt-2">Needs moderation</p>
              </div>
              <AlertTriangle className="w-10 h-10 text-red-600 opacity-20" />
            </div>
          </div>
        </div>

        {/* Navigation Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div
            onClick={() => navigate('/admin/cms/analytics')}
            className="bg-white p-6 rounded-lg shadow cursor-pointer hover:shadow-lg transition-shadow"
          >
            <BarChart3 className="w-8 h-8 text-blue-600 mb-4" />
            <h3 className="text-lg font-semibold text-gray-900">Analytics</h3>
            <p className="text-gray-600 text-sm mt-2">User behavior, film performance, platform metrics</p>
          </div>

          <div
            onClick={() => navigate('/admin/cms/moderation')}
            className="bg-white p-6 rounded-lg shadow cursor-pointer hover:shadow-lg transition-shadow"
          >
            <AlertTriangle className="w-8 h-8 text-red-600 mb-4" />
            <h3 className="text-lg font-semibold text-gray-900">Moderation</h3>
            <p className="text-gray-600 text-sm mt-2">Review flagged content, user uploads, compliance</p>
          </div>

          <div
            onClick={() => navigate('/admin/cms/users')}
            className="bg-white p-6 rounded-lg shadow cursor-pointer hover:shadow-lg transition-shadow"
          >
            <Users className="w-8 h-8 text-green-600 mb-4" />
            <h3 className="text-lg font-semibold text-gray-900">User Management</h3>
            <p className="text-gray-600 text-sm mt-2">View users, manage roles, handle disputes</p>
          </div>

          <div
            onClick={() => navigate('/admin/cms/films')}
            className="bg-white p-6 rounded-lg shadow cursor-pointer hover:shadow-lg transition-shadow"
          >
            <Video className="w-8 h-8 text-purple-600 mb-4" />
            <h3 className="text-lg font-semibold text-gray-900">Content Library</h3>
            <p className="text-gray-600 text-sm mt-2">Manage films, upload new content, quality control</p>
          </div>

          <div
            onClick={() => navigate('/admin/cms/settings')}
            className="bg-white p-6 rounded-lg shadow cursor-pointer hover:shadow-lg transition-shadow"
          >
            <Settings className="w-8 h-8 text-gray-600 mb-4" />
            <h3 className="text-lg font-semibold text-gray-900">Settings</h3>
            <p className="text-gray-600 text-sm mt-2">Platform configuration, email templates</p>
          </div>

          <div
            onClick={() => navigate('/admin/cms/compliance')}
            className="bg-white p-6 rounded-lg shadow cursor-pointer hover:shadow-lg transition-shadow"
          >
            <MessageSquare className="w-8 h-8 text-orange-600 mb-4" />
            <h3 className="text-lg font-semibold text-gray-900">Compliance</h3>
            <p className="text-gray-600 text-sm mt-2">GDPR, terms, policies, audit logs</p>
          </div>
        </div>

        {/* Flagged Content Section */}
        {flaggedItems.length > 0 && (
          <div className="bg-white p-6 rounded-lg shadow mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">⚠️ Pending Moderation</h2>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left px-4 py-2 text-sm font-medium text-gray-600">Upload</th>
                    <th className="text-left px-4 py-2 text-sm font-medium text-gray-600">Creator</th>
                    <th className="text-left px-4 py-2 text-sm font-medium text-gray-600">Date</th>
                    <th className="text-left px-4 py-2 text-sm font-medium text-gray-600">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {flaggedItems.map(item => (
                    <tr key={item.id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm text-gray-900">{item.title}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">Creator ID: {item.user_id}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {new Date(item.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3">
                        <button
                          onClick={() => navigate(`/admin/cms/moderation/${item.id}`)}
                          className="text-blue-600 hover:text-blue-700 font-medium text-sm"
                        >
                          Review
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Recent Activity */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Recent Activity</h2>
          <div className="space-y-3">
            {recentActivity.slice(0, 10).map(activity => (
              <div key={activity.id} className="flex items-center justify-between py-3 border-b border-gray-100 last:border-0">
                <div>
                  <p className="text-sm text-gray-900">
                    <span className="font-medium">{activity.user?.display_name || 'Anonymous'}</span>
                    {' '}
                    <span className="text-gray-600">
                      {activity.event_type === 'play' && 'started playing'}
                      {activity.event_type === 'pause' && 'paused'}
                      {activity.event_type === 'complete' && 'finished watching'}
                      {' '}
                    </span>
                    <span className="font-medium text-purple-600">{activity.film?.title || 'Unknown Film'}</span>
                  </p>
                </div>
                <span className="text-xs text-gray-500">
                  {new Date(activity.created_at).toLocaleTimeString()}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
