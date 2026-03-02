import { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabase';
import { TrendingUp, MousePointer2, Eye, DollarSign, Plus } from 'lucide-react';
import { Link } from 'react-router-dom';

interface AdStats {
    totalImpressions: number;
    totalClicks: number;
    totalSpend: number;
    activeCampaigns: number;
    ctr: number;
}

export function AdvertiserDashboard() {
    const { user } = useAuth();
    const [stats, setStats] = useState<AdStats>({
        totalImpressions: 0,
        totalClicks: 0,
        totalSpend: 0,
        activeCampaigns: 0,
        ctr: 0,
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (user) {
            loadStats();
        }
    }, [user]);

    const loadStats = async () => {
        try {
            // 1. Fetch campaigns
            const { data: campaigns } = await supabase
                .from('ad_campaigns')
                .select('id, budget_total, budget_remaining, status')
                .eq('advertiser_id', user?.id);

            const activeCount = campaigns?.filter((c: any) => c.status === 'active').length || 0;
            const totalSpend = campaigns?.reduce((sum: number, c: any) => sum + (c.budget_total - (c.budget_remaining || 0)), 0) || 0;

            // 2. Fetch logs summary (In a real app, this would be a specialized analytics table)
            // For now, we'll simulate based on logs if they are small, or just show zeroes
            const { data: logs } = await supabase
                .from('ad_logs')
                .select('event_type')
                .in('ad_unit_id', (campaigns || []).map((c: any) => c.id)); // Note: This mapping is simplified

            const impressions = logs?.filter((l: any) => l.event_type === 'impression').length || 0;
            const clicks = logs?.filter((l: any) => l.event_type === 'click').length || 0;

            setStats({
                totalImpressions: impressions,
                totalClicks: clicks,
                totalSpend,
                activeCampaigns: activeCount,
                ctr: impressions > 0 ? (clicks / impressions) * 100 : 0,
            });
        } catch (error) {
            console.error('Error loading advertiser stats:', error);
        } finally {
            setLoading(false);
        }
    };

    const statCards = [
        { icon: Eye, label: 'Impressions', value: stats.totalImpressions.toLocaleString(), color: 'text-blue-600' },
        { icon: MousePointer2, label: 'Total Clicks', value: stats.totalClicks.toLocaleString(), color: 'text-green-600' },
        { icon: TrendingUp, label: 'Avg. CTR', value: `${stats.ctr.toFixed(2)}%`, color: 'text-purple-600' },
        { icon: DollarSign, label: 'Total Spend', value: `$${stats.totalSpend.toFixed(2)}`, color: 'text-orange-600' },
    ];

    if (loading) {
        return (
            <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600"></div>
            </div>
        );
    }

    return (
        <div>
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Advertiser Dashboard</h1>
                    <p className="text-gray-600 dark:text-gray-400">Track your campaign ROI and audience reach</p>
                </div>
                <Link
                    to="/advertiser/campaigns/new"
                    className="flex items-center gap-2 px-6 py-3 bg-red-600 hover:bg-red-700 text-white rounded-xl font-semibold transition-all shadow-lg shadow-red-600/20"
                >
                    <Plus className="w-5 h-5" />
                    New Campaign
                </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                {statCards.map((card) => (
                    <div key={card.label} className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
                        <div className="flex items-center justify-between mb-4">
                            <div className={`p-3 rounded-xl bg-gray-50 dark:bg-gray-700 ${card.color}`}>
                                <card.icon className="h-6 w-6" />
                            </div>
                            <span className="text-xs font-medium text-green-600 bg-green-50 dark:bg-green-900/20 px-2 py-1 rounded-full">+0%</span>
                        </div>
                        <div className="text-3xl font-bold text-gray-900 dark:text-white mb-1">{card.value}</div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">{card.label}</div>
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-6 text-center text-gray-500 py-20 font-mono text-sm">
                    [ Performance Chart Placeholder ]
                </div>

                <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-6">Active Campaigns ({stats.activeCampaigns})</h3>
                    <div className="space-y-4">
                        {stats.activeCampaigns === 0 ? (
                            <p className="text-center text-gray-500 py-8">No active campaigns. Create one to start reaching users!</p>
                        ) : (
                            <div className="text-gray-400 text-sm text-center py-8 italic">Loading active campaigns...</div>
                        )}

                        <Link
                            to="/advertiser/campaigns"
                            className="block w-full text-center py-3 text-sm font-semibold text-red-600 bg-red-50 dark:bg-red-900/10 rounded-xl hover:bg-red-100 transition-colors"
                        >
                            View All Campaigns
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}
