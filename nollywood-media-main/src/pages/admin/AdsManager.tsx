import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { Megaphone, CheckCircle, XCircle, DollarSign, TrendingUp, Filter, Search } from 'lucide-react';

interface GlobalStats {
    totalRevenue: number;
    activeCampaigns: number;
    pendingCampaigns: number;
    totalImpressions: number;
}

export function AdminAdsManager() {
    const [campaigns, setCampaigns] = useState<any[]>([]);
    const [stats, setStats] = useState<GlobalStats>({
        totalRevenue: 0,
        activeCampaigns: 0,
        pendingCampaigns: 0,
        totalImpressions: 0
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadAllAdsData();
    }, []);

    const loadAllAdsData = async () => {
        try {
            // 1. Fetch all campaigns
            const { data: allCampaigns } = await supabase
                .from('ad_campaigns')
                .select(`
          *,
          advertiser_profiles (
            name,
            email
          )
        `)
                .order('created_at', { ascending: false });

            setCampaigns(allCampaigns || []);

            // 2. Calculate summary stats
            const activeCount = allCampaigns?.filter((c: any) => c.status === 'active').length || 0;
            const pendingCount = allCampaigns?.filter((c: any) => c.status === 'pending_approval').length || 0;
            const totalRev = allCampaigns?.reduce((sum: number, c: any) => sum + (c.budget_total - c.budget_remaining), 0) || 0;

            // 3. Get total impressions
            const { count: impressionCount } = await supabase
                .from('ad_logs')
                .select('*', { count: 'exact', head: true })
                .eq('event_type', 'impression');

            setStats({
                totalRevenue: totalRev,
                activeCampaigns: activeCount,
                pendingCampaigns: pendingCount,
                totalImpressions: impressionCount || 0
            });
        } catch (error) {
            console.error('Error loading admin ads data:', error);
        } finally {
            setLoading(false);
        }
    };

    const updateStatus = async (id: string, status: string) => {
        try {
            const { error } = await supabase
                .from('ad_campaigns')
                .update({ status })
                .eq('id', id);

            if (error) throw error;
            loadAllAdsData();
        } catch (error) {
            alert('Failed to update status');
        }
    };

    if (loading) return <div className="p-8 text-center">Loading Ad Management...</div>;

    return (
        <div className="p-8">
            <div className="mb-8">
                <h1 className="text-3xl font-bold flex items-center gap-3">
                    <Megaphone className="text-red-600" />
                    Native Ads Marketplace Admin
                </h1>
                <p className="text-gray-600 dark:text-gray-400">Control platform-wide ad distribution and revenue</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700">
                    <div className="flex items-center gap-4 mb-2">
                        <DollarSign className="text-green-600" />
                        <h4 className="text-sm font-bold text-gray-500 uppercase">Platform Revenue</h4>
                    </div>
                    <p className="text-2xl font-bold font-mono">${stats.totalRevenue.toFixed(2)}</p>
                </div>
                <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700">
                    <div className="flex items-center gap-4 mb-2">
                        <TrendingUp className="text-blue-600" />
                        <h4 className="text-sm font-bold text-gray-500 uppercase">Total Impressions</h4>
                    </div>
                    <p className="text-2xl font-bold font-mono">{stats.totalImpressions.toLocaleString()}</p>
                </div>
                <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700">
                    <div className="flex items-center gap-4 mb-2">
                        <CheckCircle className="text-emerald-600" />
                        <h4 className="text-sm font-bold text-gray-500 uppercase">Active Campaigns</h4>
                    </div>
                    <p className="text-2xl font-bold font-mono">{stats.activeCampaigns}</p>
                </div>
                <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700">
                    <div className="flex items-center gap-4 mb-2">
                        <XCircle className="text-yellow-600" />
                        <h4 className="text-sm font-bold text-gray-500 uppercase">Pending Approval</h4>
                    </div>
                    <p className="text-2xl font-bold font-mono text-yellow-600">{stats.pendingCampaigns}</p>
                </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
                <div className="p-4 bg-gray-50 dark:bg-gray-900 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center">
                    <div className="flex items-center gap-4">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                            <input type="text" placeholder="Search campaigns..." className="pl-10 pr-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm" />
                        </div>
                        <button className="flex items-center gap-2 px-4 py-2 text-sm font-bold text-gray-600 border rounded-lg">
                            <Filter className="w-4 h-4" />
                            Filter
                        </button>
                    </div>
                    <p className="text-xs text-gray-500">Showing {campaigns.length} campaigns</p>
                </div>

                <table className="w-full">
                    <thead className="bg-gray-50 dark:bg-gray-900/50">
                        <tr>
                            <th className="px-6 py-4 text-left text-xs font-bold text-gray-400 uppercase tracking-widest">Campaign & Advertiser</th>
                            <th className="px-6 py-4 text-left text-xs font-bold text-gray-400 uppercase tracking-widest">Status</th>
                            <th className="px-6 py-4 text-right text-xs font-bold text-gray-400 uppercase tracking-widest">Budget Remaining</th>
                            <th className="px-6 py-4 text-right text-xs font-bold text-gray-400 uppercase tracking-widest">Pricing</th>
                            <th className="px-6 py-4 text-right text-xs font-bold text-gray-400 uppercase tracking-widest">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                        {campaigns.map(c => (
                            <tr key={c.id} className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                                <td className="px-6 py-4">
                                    <div className="font-bold">{c.name}</div>
                                    <div className="text-xs text-gray-500">by {c.advertiser_profiles?.name || 'Unknown'} ({c.advertiser_profiles?.email || 'N/A'})</div>
                                </td>
                                <td className="px-6 py-4">
                                    <span className={`inline-flex px-2 py-1 rounded-md text-[10px] font-bold ${c.status === 'active' ? 'bg-green-100 text-green-700' :
                                        c.status === 'pending_approval' ? 'bg-yellow-100 text-yellow-700 animate-pulse' :
                                            'bg-gray-100 text-gray-600'
                                        }`}>
                                        {c.status.replace('_', ' ').toUpperCase()}
                                    </span>
                                </td>
                                <td className="px-6 py-4 text-right">
                                    <div className="font-bold">${c.budget_remaining.toFixed(2)}</div>
                                    <div className="text-[10px] text-gray-400">of ${c.budget_total.toFixed(2)}</div>
                                </td>
                                <td className="px-6 py-4 text-right">
                                    <div className="font-medium">{c.pricing_model}</div>
                                    <div className="text-[10px] text-gray-400">${c.price_per_unit} per unit</div>
                                </td>
                                <td className="px-6 py-4 text-right">
                                    <div className="flex items-center justify-end gap-2">
                                        {c.status === 'pending_approval' && (
                                            <button
                                                onClick={() => updateStatus(c.id, 'active')}
                                                className="px-3 py-1 bg-green-600 text-white text-[10px] font-bold rounded-lg hover:bg-green-700"
                                            >
                                                Approve
                                            </button>
                                        )}
                                        {c.status === 'active' ? (
                                            <button
                                                onClick={() => updateStatus(c.id, 'paused')}
                                                className="px-3 py-1 bg-yellow-600 text-white text-[10px] font-bold rounded-lg hover:bg-yellow-700"
                                            >
                                                Pause
                                            </button>
                                        ) : c.status !== 'pending_approval' && (
                                            <button
                                                onClick={() => updateStatus(c.id, 'active')}
                                                className="px-3 py-1 bg-gray-600 text-white text-[10px] font-bold rounded-lg hover:bg-gray-700"
                                            >
                                                Resume
                                            </button>
                                        )}
                                        <button className="p-2 text-gray-400 hover:text-red-600">
                                            <XCircle className="w-4 h-4" />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
