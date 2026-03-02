import { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { DollarSign, TrendingUp, Calendar, Download, CreditCard, PieChart, Info, ArrowUpRight } from 'lucide-react';

export function StudioEarn() {
  const { user } = useAuth();
  const [earnings, setEarnings] = useState<any>({
    balance_total: 0,
    balance_pending: 0,
    revenue_ads: 0,
    revenue_subscriptions: 0,
    revenue_tips: 0,
    monetization: {
      status: 'none',
      watchTimeSec: 0,
      subscriberCount: 0
    }
  });
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (user) {
      loadEarnings();
    }
  }, [user]);

  const loadEarnings = async () => {
    try {
      const res = await fetch(`/api/creator/earnings?userId=${user?.id}`);
      const result = await res.json();
      if (result.data) {
        setEarnings(result.data);
      }
    } catch (err) {
      console.error('Failed to load earnings:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleApply = async () => {
    setSubmitting(true);
    try {
      const res = await fetch('/api/creator/monetization-apply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user?.id })
      });
      if (res.ok) {
        alert('Application submitted! Subject to discretionary review.');
        loadEarnings();
      }
    } catch (err) {
      console.error('Application failed:', err);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600"></div>
      </div>
    );
  }

  const isApproved = earnings.monetization.status === 'approved';
  const subProgress = Math.min((earnings.monetization.subscriberCount / 1000) * 100, 100);
  const hourProgress = Math.min((earnings.monetization.watchTimeSec / 14400000) * 100, 100);
  const isEligible = subProgress >= 100 && hourProgress >= 100;

  if (!isApproved) {
    return (
      <div className="space-y-8 animate-in fade-in duration-500 max-w-4xl mx-auto">
        <div className="bg-slate-900/40 border border-white/5 rounded-[2rem] p-12 text-center relative overflow-hidden">
          <div className="absolute top-0 right-0 p-12 opacity-5 pointer-events-none">
            <TrendingUp className="w-64 h-64 text-red-600" />
          </div>

          <div className="mb-6 inline-flex items-center gap-2 px-4 py-1.5 bg-red-600/10 border border-red-600/20 rounded-full text-red-500 text-[10px] font-black uppercase tracking-[0.2em]">
            Partner Program
          </div>

          <h1 className="text-5xl font-black text-white mb-4 tracking-tighter">Monetization <span className="text-red-600">Milestones</span></h1>
          <p className="text-slate-400 text-lg max-w-lg mx-auto mb-12">Track your progress toward joining the platform's prestige revenue network.</p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
            <div className="bg-black/40 border border-white/5 p-8 rounded-3xl relative transition-all hover:border-slate-800 group">
              <div className="flex justify-between items-end mb-4">
                <div className="text-left">
                  <div className="text-3xl font-black text-white">{earnings.monetization.subscriberCount.toLocaleString()}</div>
                  <div className="text-[10px] font-black uppercase tracking-widest text-slate-500">Subscribers</div>
                </div>
                <div className="text-slate-500 font-black text-xs">/ 1,000</div>
              </div>
              <div className="h-2 bg-slate-900 rounded-full overflow-hidden">
                <div className="h-full bg-red-600 shadow-[0_0_10px_rgba(220,38,38,0.5)] transition-all duration-1000" style={{ width: `${subProgress}%` }} />
              </div>
              <div className="absolute -inset-2 bg-red-600/5 opacity-0 group-hover:opacity-100 blur-xl transition-opacity pointer-events-none" />
            </div>

            <div className="bg-black/40 border border-white/5 p-8 rounded-3xl relative transition-all hover:border-slate-800 group">
              <div className="flex justify-between items-end mb-4">
                <div className="text-left">
                  <div className="text-3xl font-black text-white">{Math.floor(earnings.monetization.watchTimeSec / 3600).toLocaleString()}</div>
                  <div className="text-[10px] font-black uppercase tracking-widest text-slate-500">Watch Hours</div>
                </div>
                <div className="text-slate-500 font-black text-xs">/ 4,000</div>
              </div>
              <div className="h-2 bg-slate-900 rounded-full overflow-hidden">
                <div className="h-full bg-red-600 shadow-[0_0_10px_rgba(220,38,38,0.5)] transition-all duration-1000" style={{ width: `${hourProgress}%` }} />
              </div>
              <div className="absolute -inset-2 bg-red-600/5 opacity-0 group-hover:opacity-100 blur-xl transition-opacity pointer-events-none" />
            </div>
          </div>

          {earnings.monetization.status === 'pending' ? (
            <div className="py-6 bg-white/5 rounded-2xl border border-white/10 text-slate-300 font-bold">
              Review in progress... Expect a decision within 48 hours.
            </div>
          ) : (
            <div className="space-y-4">
              <button
                onClick={handleApply}
                disabled={!isEligible || submitting}
                className="px-12 py-5 bg-red-600 hover:bg-red-700 disabled:bg-slate-800 disabled:opacity-50 text-white rounded-2xl font-black text-lg transition-all shadow-[0_10px_30px_rgba(220,38,38,0.2)] hover:shadow-[0_15px_40px_rgba(220,38,38,0.4)]"
              >
                {submitting ? 'Acquiring...' : 'Apply for Monetization'}
              </button>
              <p className="text-[10px] text-slate-500 font-black uppercase tracking-[0.3em] mt-6 max-w-xs mx-auto leading-relaxed">
                Approval is granted at the platform's <span className="text-red-500 italic">sole discretion</span> based on content quality.
              </p>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 className="text-4xl font-black text-white mb-2">Creator Hub: <span className="text-red-600">Earnings</span></h1>
          <p className="text-slate-400">Track, manage, and withdraw your platform revenue.</p>
        </div>
        <button className="px-8 py-3 bg-red-600 hover:bg-red-700 text-white rounded-xl font-bold shadow-lg shadow-red-600/20 transition-all flex items-center gap-2 group">
          <Download className="w-5 h-5 group-hover:translate-y-0.5 transition-transform" />
          Request Payout
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: 'Platform Balance', value: earnings.balance_total, icon: <DollarSign className="text-green-500" />, color: 'green' },
          { label: 'Pending Clearance', value: earnings.balance_pending, icon: <TrendingUp className="text-blue-500" />, delta: '+0%' },
          { label: 'Ad Revenue', value: earnings.revenue_ads, icon: <Calendar className="text-purple-500" /> },
          { label: 'Subscriber Share', value: earnings.revenue_subscriptions, icon: <Info className="text-yellow-500" /> },
        ].map((stat, i) => (
          <div key={i} className="bg-slate-900/40 border border-white/5 rounded-3xl p-6 hover:border-slate-700 transition-colors">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-black/40 rounded-xl">{stat.icon}</div>
              {stat.delta && <span className="text-xs font-black text-green-500 bg-green-500/10 px-2 py-1 rounded-md">{stat.delta}</span>}
            </div>
            <div className="text-3xl font-black text-white mb-1">
              ${stat.value.toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </div>
            <div className="text-sm font-bold text-slate-500 uppercase tracking-widest">{stat.label}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-slate-900/40 border border-white/5 rounded-3xl p-8">
            <h2 className="text-xl font-black mb-8 flex items-center gap-3">
              <PieChart className="text-red-600 w-6 h-6" />
              Revenue Sources
            </h2>
            <div className="space-y-6">
              {[
                { source: 'Ad Revenue (Native)', amount: earnings.revenue_ads, percentage: earnings.balance_total > 0 ? (earnings.revenue_ads / earnings.balance_total) * 100 : 0 },
                { source: 'Subscription Share', amount: earnings.revenue_subscriptions, percentage: earnings.balance_total > 0 ? (earnings.revenue_subscriptions / earnings.balance_total) * 100 : 0 },
                { source: 'Tips & Donations', amount: earnings.revenue_tips, percentage: earnings.balance_total > 0 ? (earnings.revenue_tips / earnings.balance_total) * 100 : 0 },
              ].map((src, i) => (
                <div key={i} className="space-y-2">
                  <div className="flex justify-between text-sm font-bold">
                    <span className="text-slate-300">{src.source}</span>
                    <span className="text-white">${src.amount.toFixed(2)}</span>
                  </div>
                  <div className="h-2 bg-black/40 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-red-600 to-red-400 rounded-full"
                      style={{ width: `${src.percentage}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-slate-900/40 border border-white/5 rounded-3xl overflow-hidden">
            <div className="p-8 border-b border-white/5 flex justify-between items-center">
              <h2 className="text-xl font-black">Recent Transactions</h2>
              <button className="text-xs font-black text-red-600 uppercase tracking-widest hover:text-red-500 transition-colors">View All Archive</button>
            </div>
            <div className="divide-y divide-white/5">
              {[1, 2, 3].map((_, i) => (
                <div key={i} className="p-6 flex items-center justify-between hover:bg-white/5 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-green-500/10 rounded-xl flex items-center justify-center">
                      <ArrowUpRight className="w-5 h-5 text-green-500" />
                    </div>
                    <div>
                      <div className="font-bold">Ad Revenue Share</div>
                      <div className="text-xs text-slate-500">March {12 - i}, 2024 • Video: "Epic Nollywood Quest"</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-black text-white">+$42.50</div>
                    <div className="text-[10px] text-slate-500 uppercase font-bold">Cleared</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-8">
          <div className="bg-gradient-to-br from-red-600 to-red-800 rounded-3xl p-8 shadow-2xl relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:scale-110 transition-transform">
              <CreditCard className="w-32 h-32" />
            </div>
            <h3 className="text-xl font-black text-white mb-2 relative">Payout Method</h3>
            <p className="text-red-100 text-sm mb-6 relative">Receive your funds directly via bank transfer or PayPal.</p>
            <div className="space-y-3 relative">
              <div className="p-4 bg-white/10 rounded-2xl border border-white/10 flex items-center justify-between group/row hover:bg-white/20 transition-colors cursor-pointer">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center text-red-600 font-black text-xs">BT</div>
                  <span className="text-xs font-bold text-white">Direct Bank (NGN)</span>
                </div>
                <div className="w-2 h-2 bg-green-400 rounded-full shadow-[0_0_8px_rgba(74,222,128,0.5)]" />
              </div>
              <button className="w-full py-3 bg-white text-red-600 rounded-xl font-black text-xs uppercase tracking-widest hover:bg-slate-100 transition-colors">Manage Accounts</button>
            </div>
          </div>

          <div className="bg-slate-900/40 border border-white/5 rounded-3xl p-8">
            <h3 className="text-lg font-black mb-4 flex items-center gap-2">
              <Info className="w-5 h-5 text-slate-500" />
              Tax Information
            </h3>
            <p className="text-slate-400 text-xs leading-relaxed mb-6">
              Ensure your tax documents are up to date to avoid payout delays. 15% platform fee applies to all revenue.
            </p>
            <button className="text-xs font-black text-slate-300 hover:text-white transition-colors underline underline-offset-4">Download 2023 Earnings Report (PDF)</button>
          </div>
        </div>
      </div>
    </div>
  );
}
