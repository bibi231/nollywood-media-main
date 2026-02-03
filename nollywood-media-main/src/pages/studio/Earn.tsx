import { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabase';
import { DollarSign, TrendingUp, Calendar, Download, CreditCard } from 'lucide-react';

export function StudioEarn() {
  const { user } = useAuth();
  const [earnings, setEarnings] = useState({
    total: 0,
    thisMonth: 0,
    lastMonth: 0,
    pending: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadEarnings();
    }
  }, [user]);

  const loadEarnings = async () => {
    if (!user) return;

    try {
      setEarnings({
        total: 0,
        thisMonth: 0,
        lastMonth: 0,
        pending: 0,
      });
    } catch (error) {
      console.error('Error loading earnings:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-gray-600 dark:text-gray-400">Loading earnings...</div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          Earnings
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Track your revenue and monetization
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-3">
            <DollarSign className="h-8 w-8 text-green-600" />
          </div>
          <div className="text-3xl font-bold text-gray-900 dark:text-white mb-1">
            ${earnings.total.toLocaleString()}
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">Total Earnings</div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-3">
            <Calendar className="h-8 w-8 text-blue-600" />
            <span className="text-sm text-green-600 dark:text-green-400 flex items-center gap-1">
              <TrendingUp className="h-4 w-4" />
              +0%
            </span>
          </div>
          <div className="text-3xl font-bold text-gray-900 dark:text-white mb-1">
            ${earnings.thisMonth.toLocaleString()}
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">This Month</div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-3">
            <Calendar className="h-8 w-8 text-purple-600" />
          </div>
          <div className="text-3xl font-bold text-gray-900 dark:text-white mb-1">
            ${earnings.lastMonth.toLocaleString()}
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">Last Month</div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-3">
            <DollarSign className="h-8 w-8 text-yellow-600" />
          </div>
          <div className="text-3xl font-bold text-gray-900 dark:text-white mb-1">
            ${earnings.pending.toLocaleString()}
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">Pending</div>
        </div>
      </div>

      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-6 mb-8">
        <div className="flex items-start gap-4">
          <DollarSign className="h-6 w-6 text-blue-600 dark:text-blue-400 flex-shrink-0" />
          <div className="flex-1">
            <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-1">
              Monetization Coming Soon
            </h3>
            <p className="text-sm text-blue-800 dark:text-blue-200 mb-3">
              We're building out our creator monetization program. Soon you'll be able to earn from:
            </p>
            <ul className="text-sm text-blue-700 dark:text-blue-300 space-y-1">
              <li>• Ad revenue sharing</li>
              <li>• Subscriber-only content</li>
              <li>• Donations and tips</li>
              <li>• Sponsored content</li>
              <li>• Merchandise sales</li>
            </ul>
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            Revenue Breakdown
          </h2>
        </div>
        <div className="p-6">
          <div className="text-center py-12">
            <CreditCard className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              No earnings yet
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Keep creating great content! Monetization features are coming soon.
            </p>
          </div>
        </div>
      </div>

      <div className="mt-6 bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <h3 className="font-semibold text-gray-900 dark:text-white mb-4">
          Payout Methods
        </h3>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
          Add your payment information to receive earnings once monetization is enabled.
        </p>
        <div className="space-y-3">
          <div className="flex items-center gap-3 p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
            <CreditCard className="h-5 w-5 text-gray-400" />
            <div className="flex-1">
              <div className="font-medium text-gray-900 dark:text-white">Bank Transfer</div>
              <div className="text-sm text-gray-500 dark:text-gray-400">Not configured</div>
            </div>
            <button className="px-4 py-2 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg font-medium transition-colors">
              Add
            </button>
          </div>
          <div className="flex items-center gap-3 p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
            <CreditCard className="h-5 w-5 text-gray-400" />
            <div className="flex-1">
              <div className="font-medium text-gray-900 dark:text-white">PayPal</div>
              <div className="text-sm text-gray-500 dark:text-gray-400">Not configured</div>
            </div>
            <button className="px-4 py-2 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg font-medium transition-colors">
              Add
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
