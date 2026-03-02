import { useState, useEffect } from 'react';
import {
    Shield,
    Flag,
    Users,
    MessageSquare,
    AlertTriangle,
    CheckCircle,
    XCircle,
    BarChart3,
    Clock,
    Search,
    Loader2
} from 'lucide-react';
import { motion } from 'framer-motion';

export function ModeratorDashboard() {
    const [stats, setStats] = useState({
        pendingReports: 0,
        pendingApplications: 0,
        activeModerators: 12,
        resolvedToday: 45
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadStats();
    }, []);

    const loadStats = async () => {
        // In a real app, these would be real counts from DB
        setStats({
            pendingReports: 18,
            pendingApplications: 5,
            activeModerators: 12,
            resolvedToday: 45
        });
        setLoading(false);
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <Loader2 className="w-12 h-12 text-red-600 animate-spin" />
            </div>
        );
    }

    return (
        <div className="p-8 space-y-8 animate-in fade-in duration-500">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-black text-white flex items-center gap-3">
                        <Shield className="text-red-600 w-8 h-8" />
                        Moderator <span className="text-red-600">Command</span>
                    </h1>
                    <p className="text-slate-400 mt-1 text-sm font-medium">Platform safety and integrity oversight.</p>
                </div>
                <div className="flex gap-4">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                        <input
                            type="text"
                            placeholder="Search users or content..."
                            className="pl-10 pr-4 py-2 bg-slate-900 border border-white/5 rounded-xl text-sm focus:border-red-600 outline-none transition-all w-64"
                        />
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {[
                    { label: 'Pending Reports', value: stats.pendingReports, icon: <Flag className="text-amber-500" />, color: 'amber' },
                    { label: 'Partner Apps', value: stats.pendingApplications, icon: <Users className="text-blue-500" />, color: 'blue' },
                    { label: 'Resolved (24h)', value: stats.resolvedToday, icon: <CheckCircle className="text-green-500" />, color: 'green' },
                    { label: 'System Health', value: 'Optimal', icon: <BarChart3 className="text-purple-500" />, color: 'purple' },
                ].map((stat, i) => (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.1 }}
                        key={i}
                        className="bg-slate-900/40 border border-white/5 rounded-3xl p-6 hover:border-slate-800 transition-all border-b-4"
                        style={{ borderBottomColor: `var(--${stat.color}-500)` }}
                    >
                        <div className="p-3 bg-black/40 rounded-xl w-fit mb-4">{stat.icon}</div>
                        <div className="text-3xl font-black text-white mb-1">{stat.value}</div>
                        <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{stat.label}</div>
                    </motion.div>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-6">
                    <div className="bg-slate-900/40 border border-white/5 rounded-3xl overflow-hidden">
                        <div className="p-6 border-b border-white/5 flex justify-between items-center">
                            <h2 className="text-lg font-black flex items-center gap-2">
                                <Clock className="w-5 h-5 text-red-600" />
                                Urgent Action Queue
                            </h2>
                            <button className="text-[10px] font-black text-slate-400 uppercase tracking-widest hover:text-white transition-colors">View All</button>
                        </div>
                        <div className="divide-y divide-white/5">
                            {[
                                { type: 'Report', target: 'Comment: "This movie is..."', user: 'user_823', reason: 'Spam', time: '2m ago' },
                                { type: 'Application', target: 'Monetization App', user: 'creator_pro', reason: 'Review required', time: '15m ago' },
                                { type: 'Report', target: 'Film: "Lost in Lagos"', user: 'mod_bot', reason: 'Copyright flag', time: '1h ago' },
                            ].map((item, i) => (
                                <div key={i} className="p-6 flex items-center justify-between hover:bg-white/5 transition-colors group">
                                    <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 bg-slate-800 rounded-xl flex items-center justify-center">
                                            {item.type === 'Report' ? <Flag className="w-5 h-5 text-amber-500" /> : <Users className="text-blue-500 w-5 h-5" />}
                                        </div>
                                        <div>
                                            <div className="font-bold text-sm text-white group-hover:text-red-500 transition-colors">{item.target}</div>
                                            <div className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">{item.reason} • {item.user}</div>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <span className="text-[10px] font-bold text-slate-600">{item.time}</span>
                                        <button className="px-4 py-1.5 bg-red-600/10 hover:bg-red-600 border border-red-600/20 text-red-500 hover:text-white text-[10px] font-black rounded-lg transition-all uppercase tracking-widest">
                                            Review
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="space-y-6">
                    <div className="bg-slate-900/40 border border-white/5 rounded-3xl p-6">
                        <h2 className="text-lg font-black mb-6 flex items-center gap-2">
                            <Shield className="w-5 h-5 text-slate-500" />
                            Quick Actions
                        </h2>
                        <div className="space-y-3">
                            {[
                                { label: 'Shadowban User', icon: <AlertTriangle className="w-4 h-4" />, color: 'orange' },
                                { label: 'Flag for Admin', icon: <Clock className="w-4 h-4" />, color: 'slate' },
                                { label: 'Issue Warning', icon: <MessageSquare className="w-4 h-4" />, color: 'blue' },
                                { label: 'Clear Report Cache', icon: <XCircle className="w-4 h-4" />, color: 'red' },
                            ].map((action, i) => (
                                <button
                                    key={i}
                                    className="w-full flex items-center gap-3 p-4 bg-slate-800/50 hover:bg-slate-800 border border-white/5 rounded-2xl text-[10px] font-black uppercase tracking-widest text-slate-300 hover:text-white transition-all"
                                >
                                    <span className={`text-${action.color}-500`}>{action.icon}</span>
                                    {action.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="bg-gradient-to-br from-indigo-900/40 to-slate-900/40 border border-white/5 rounded-3xl p-6">
                        <h2 className="text-lg font-black mb-2 flex items-center gap-2">
                            <MessageSquare className="w-5 h-5 text-indigo-400" />
                            Mod Notes
                        </h2>
                        <p className="text-slate-400 text-[10px] font-medium leading-relaxed mb-4">
                            Remember to prioritize "Hate Speech" reports. Discretionary monetization reviews should check for 100% original content.
                        </p>
                        <div className="flex -space-x-2">
                            {[1, 2, 3].map(i => (
                                <div key={i} className="w-6 h-6 rounded-full border-2 border-slate-900 bg-slate-700" />
                            ))}
                            <div className="text-[10px] font-black text-slate-500 flex items-center ml-4 uppercase tracking-widest">+5 Online</div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
