import { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabase';
import { Users, TrendingUp, Calendar, Mail } from 'lucide-react';

interface Subscriber {
  id: string;
  follower_id: string;
  created_at: string;
  follower: {
    email: string;
    display_name: string;
    avatar_url: string | null;
  };
}

export function StudioSubscribers() {
  const { user } = useAuth();
  const [subscribers, setSubscribers] = useState<Subscriber[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    total: 0,
    thisMonth: 0,
    thisWeek: 0,
  });

  useEffect(() => {
    if (user) {
      loadSubscribers();
    }
  }, [user]);

  const loadSubscribers = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('user_follows')
        .select(`
          *,
          follower:user_profiles!user_follows_follower_id_fkey(display_name, avatar_url)
        `)
        .eq('following_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const subs = (data || []).map(s => ({
        ...s,
        follower: {
          email: s.follower_id,
          display_name: s.follower?.display_name || 'User',
          avatar_url: s.follower?.avatar_url || null,
        }
      }));

      setSubscribers(subs);

      const now = new Date();
      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

      setStats({
        total: subs.length,
        thisWeek: subs.filter(s => new Date(s.created_at) > weekAgo).length,
        thisMonth: subs.filter(s => new Date(s.created_at) > monthAgo).length,
      });
    } catch (error) {
      console.error('Error loading subscribers:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-gray-600 dark:text-gray-400">Loading subscribers...</div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          Subscribers
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Manage and engage with your subscriber community
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-3">
            <Users className="h-8 w-8 text-purple-600" />
          </div>
          <div className="text-3xl font-bold text-gray-900 dark:text-white mb-1">
            {stats.total.toLocaleString()}
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">Total Subscribers</div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-3">
            <Calendar className="h-8 w-8 text-green-600" />
            <span className="text-sm text-green-600 dark:text-green-400 flex items-center gap-1">
              <TrendingUp className="h-4 w-4" />
              New
            </span>
          </div>
          <div className="text-3xl font-bold text-gray-900 dark:text-white mb-1">
            {stats.thisMonth.toLocaleString()}
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">This Month</div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-3">
            <Calendar className="h-8 w-8 text-blue-600" />
            <span className="text-sm text-blue-600 dark:text-blue-400 flex items-center gap-1">
              <TrendingUp className="h-4 w-4" />
              Recent
            </span>
          </div>
          <div className="text-3xl font-bold text-gray-900 dark:text-white mb-1">
            {stats.thisWeek.toLocaleString()}
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">This Week</div>
        </div>
      </div>

      {subscribers.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-12 text-center">
          <Users className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            No subscribers yet
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            Keep uploading great content and people will start subscribing!
          </p>
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Subscriber List
            </h2>
          </div>
          <div className="divide-y divide-gray-200 dark:divide-gray-700">
            {subscribers.map((subscriber) => (
              <div key={subscriber.id} className="p-6 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-red-600 flex items-center justify-center text-white font-semibold text-lg">
                      {subscriber.follower.display_name?.charAt(0).toUpperCase() || 'U'}
                    </div>
                    <div>
                      <div className="font-medium text-gray-900 dark:text-white">
                        {subscriber.follower.display_name || 'Anonymous User'}
                      </div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        Subscribed {new Date(subscriber.created_at).toLocaleDateString('en-US', {
                          month: 'long',
                          day: 'numeric',
                          year: 'numeric'
                        })}
                      </div>
                    </div>
                  </div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">
                    {Math.floor((Date.now() - new Date(subscriber.created_at).getTime()) / (1000 * 60 * 60 * 24))} days ago
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="mt-6 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-6">
        <div className="flex items-start gap-4">
          <Mail className="h-6 w-6 text-blue-600 dark:text-blue-400 flex-shrink-0" />
          <div>
            <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-1">
              Engage Your Subscribers
            </h3>
            <p className="text-sm text-blue-800 dark:text-blue-200 mb-3">
              Keep your subscribers engaged with regular content and updates
            </p>
            <ul className="text-sm text-blue-700 dark:text-blue-300 space-y-1">
              <li>• Upload content consistently</li>
              <li>• Respond to comments from subscribers</li>
              <li>• Create content based on subscriber feedback</li>
              <li>• Announce new uploads to keep them informed</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
