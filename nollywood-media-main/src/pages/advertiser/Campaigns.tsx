import { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabase';
import { Megaphone, Edit, Trash2, Plus } from 'lucide-react';
import { Link } from 'react-router-dom';

interface Campaign {
    id: string;
    name: string;
    status: string;
    budget_total: number;
    budget_remaining: number;
    pricing_model: string;
    price_per_unit: number;
    created_at: string;
}

export function AdvertiserCampaigns() {
    const { user } = useAuth();
    const [campaigns, setCampaigns] = useState<Campaign[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (user) {
            loadCampaigns();
        }
    }, [user]);

    const loadCampaigns = async () => {
        try {
            const { data, error } = await supabase
                .from('ad_campaigns')
                .select('*')
                .eq('advertiser_id', user?.id)
                .order('created_at', { ascending: false });

            if (error) throw error;
            setCampaigns(data || []);
        } catch (error) {
            console.error('Error loading campaigns:', error);
        } finally {
            setLoading(false);
        }
    };

    const deleteCampaign = async (id: string) => {
        if (!confirm('Are you sure you want to delete this campaign? All ad units and logs will also be removed.')) return;
        try {
            const { error } = await supabase.from('ad_campaigns').delete().eq('id', id);
            if (error) throw error;
            setCampaigns(prev => prev.filter(c => c.id !== id));
        } catch (error) {
            alert('Failed to delete campaign');
        }
    };

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
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">My Campaigns</h1>
                    <p className="text-gray-600 dark:text-gray-400">Manage and optimize your ad placements</p>
                </div>
                <Link
                    to="/advertiser/campaigns/new"
                    className="flex items-center gap-2 px-6 py-3 bg-red-600 hover:bg-red-700 text-white rounded-xl font-semibold transition-all shadow-lg shadow-red-600/20"
                >
                    <Plus className="w-5 h-5" />
                    New Campaign
                </Link>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-gray-50 dark:bg-gray-900/50 border-b border-gray-100 dark:border-gray-700">
                            <tr>
                                <th className="px-6 py-4 text-left text-xs font-bold text-gray-400 uppercase tracking-widest">Campaign</th>
                                <th className="px-6 py-4 text-left text-xs font-bold text-gray-400 uppercase tracking-widest">Status</th>
                                <th className="px-6 py-4 text-right text-xs font-bold text-gray-400 uppercase tracking-widest">Budget</th>
                                <th className="px-6 py-4 text-right text-xs font-bold text-gray-400 uppercase tracking-widest">Pricing</th>
                                <th className="px-6 py-4 text-right text-xs font-bold text-gray-400 uppercase tracking-widest">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                            {campaigns.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-20 text-center">
                                        <Megaphone className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                                        <p className="text-gray-500">No campaigns found. Start by creating your first one!</p>
                                    </td>
                                </tr>
                            ) : (
                                campaigns.map((c) => (
                                    <tr key={c.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="font-bold text-gray-900 dark:text-white">{c.name}</div>
                                            <div className="text-xs text-gray-500 mt-0.5">Created {new Date(c.created_at).toLocaleDateString()}</div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`inline-flex px-3 py-1 rounded-full text-xs font-bold ${c.status === 'active' ? 'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-500' :
                                                c.status === 'pending_approval' ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-500' :
                                                    c.status === 'paused' ? 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300' :
                                                        'bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-500'
                                                }`}>
                                                {c.status.replace('_', ' ').toUpperCase()}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="font-bold text-gray-900 dark:text-white">${c.budget_remaining.toFixed(2)}</div>
                                            <div className="text-xs text-gray-500">of ${c.budget_total.toFixed(2)}</div>
                                        </td>
                                        <td className="px-6 py-4 text-right text-sm">
                                            <div className="font-medium">{c.pricing_model}</div>
                                            <div className="text-xs text-gray-500">${c.price_per_unit.toFixed(2)} per {c.pricing_model === 'CPM' ? '1k' : 'click'}</div>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <button className="p-2 text-gray-400 hover:text-red-600 transition-colors">
                                                    <Edit className="w-4 h-4" />
                                                </button>
                                                <button
                                                    onClick={() => deleteCampaign(c.id)}
                                                    className="p-2 text-gray-400 hover:text-red-600 transition-colors"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
