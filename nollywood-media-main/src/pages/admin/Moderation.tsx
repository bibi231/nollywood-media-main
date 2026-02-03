import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { Flag, CheckCircle, AlertTriangle, XCircle, Ban, Shield, Clock, BarChart3 } from 'lucide-react';

interface CommentReport {
  id: string;
  comment_id: string;
  reason: string;
  status: string;
  created_at: string;
  film_comments: {
    content: string;
    user_id: string;
    film_id: string;
  };
  reported_by_user: {
    email: string;
  };
}

export function AdminModeration() {
  const [reports, setReports] = useState<CommentReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>('pending');

  useEffect(() => {
    loadReports();
  }, [filter]);

  async function loadReports() {
    setLoading(true);
    const query = supabase
      .from('comment_reports')
      .select(`
        *,
        film_comments (
          content,
          user_id,
          film_id
        )
      `)
      .order('created_at', { ascending: false });

    if (filter !== 'all') {
      query.eq('status', filter);
    }

    const { data } = await query;

    if (data) {
      setReports(data as any);
    }
    setLoading(false);
  }

  async function updateReportStatus(reportId: string, status: string) {
    await supabase
      .from('comment_reports')
      .update({
        status,
        resolved_at: new Date().toISOString()
      })
      .eq('id', reportId);

    loadReports();
  }

  const reasonLabels = {
    hate: { label: 'Hate Speech', color: 'bg-red-500/20 text-red-400' },
    spam: { label: 'Spam', color: 'bg-amber-500/20 text-amber-400' },
    harassment: { label: 'Harassment', color: 'bg-orange-500/20 text-orange-400' },
    other: { label: 'Other', color: 'bg-slate-500/20 text-slate-400' }
  };

  const flagData = [
    { reason: 'Spam', count: 12, percent: 45 },
    { reason: 'Hate Speech', count: 8, percent: 30 },
    { reason: 'Harassment', count: 5, percent: 19 },
    { reason: 'Other', count: 2, percent: 6 }
  ];

  return (
    <div className="p-8 bg-slate-950 min-h-screen">
      <div className="mb-8">
        <nav className="text-sm text-slate-400 mb-2">
          Admin / <span className="text-white">Moderation</span>
        </nav>
        <h1 className="text-3xl font-bold text-white">Moderation Center</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 mb-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-white">Comments Queue</h2>
              <div className="flex gap-2">
                {['pending', 'reviewed', 'all'].map((f) => (
                  <button
                    key={f}
                    onClick={() => setFilter(f)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      filter === f
                        ? 'bg-blue-600 text-white'
                        : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                    }`}
                  >
                    {f.charAt(0).toUpperCase() + f.slice(1)}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-4">
              {loading ? (
                <div className="text-center py-12 text-slate-400">Loading reports...</div>
              ) : reports.length === 0 ? (
                <div className="text-center py-12 text-slate-400">
                  <Flag className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>No reports found</p>
                </div>
              ) : (
                reports.map((report) => {
                  const reasonStyle = reasonLabels[report.reason as keyof typeof reasonLabels];

                  return (
                    <div
                      key={report.id}
                      className="bg-slate-800/50 rounded-lg p-4 hover:bg-slate-800 transition-colors"
                    >
                      <div className="flex items-start gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="text-white font-medium">
                              {report.film_comments?.user_id?.substring(0, 8) || 'Unknown'}
                            </span>
                            <span
                              className={`px-2 py-0.5 rounded text-xs font-medium ${reasonStyle.color}`}
                            >
                              {reasonStyle.label}
                            </span>
                          </div>

                          <p className="text-slate-300 mb-3 line-clamp-2">
                            {report.film_comments?.content || 'Comment not found'}
                          </p>

                          <div className="flex gap-2">
                            {report.status === 'pending' && (
                              <>
                                <button
                                  onClick={() => updateReportStatus(report.id, 'approved')}
                                  className="px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white text-sm rounded-lg font-medium transition-colors flex items-center gap-1.5"
                                >
                                  <CheckCircle className="w-4 h-4" />
                                  Approve
                                </button>
                                <button
                                  onClick={() => updateReportStatus(report.id, 'reviewed')}
                                  className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white text-sm rounded-lg font-medium transition-colors flex items-center gap-1.5"
                                >
                                  <AlertTriangle className="w-4 h-4" />
                                  Review
                                </button>
                                <button
                                  onClick={() => updateReportStatus(report.id, 'removed')}
                                  className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white text-sm rounded-lg font-medium transition-colors flex items-center gap-1.5"
                                >
                                  <XCircle className="w-4 h-4" />
                                  Remove
                                </button>
                              </>
                            )}
                            {report.status !== 'pending' && (
                              <span className="px-3 py-1.5 bg-slate-700 text-slate-300 text-sm rounded-lg capitalize">
                                {report.status}
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="text-right text-xs text-slate-400">
                          {new Date(report.created_at).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
            <h2 className="text-xl font-semibold text-white mb-6">Policy Actions</h2>

            <div className="space-y-3">
              <button className="w-full p-3 bg-red-600/10 hover:bg-red-600/20 border border-red-600/20 hover:border-red-600/30 rounded-lg text-red-400 font-medium transition-colors flex items-center gap-3">
                <Ban className="w-5 h-5" />
                Block User
              </button>

              <button className="w-full p-3 bg-orange-600/10 hover:bg-orange-600/20 border border-orange-600/20 hover:border-orange-600/30 rounded-lg text-orange-400 font-medium transition-colors flex items-center gap-3">
                <Shield className="w-5 h-5" />
                Shadowban
              </button>

              <button className="w-full p-3 bg-amber-600/10 hover:bg-amber-600/20 border border-amber-600/20 hover:border-amber-600/30 rounded-lg text-amber-400 font-medium transition-colors flex items-center gap-3">
                <Clock className="w-5 h-5" />
                Mute 24h
              </button>

              <button className="w-full p-3 bg-slate-700 hover:bg-slate-600 rounded-lg text-slate-300 font-medium transition-colors flex items-center gap-3">
                <AlertTriangle className="w-5 h-5" />
                IP Report
              </button>

              <button className="w-full p-3 bg-slate-700 hover:bg-slate-600 rounded-lg text-slate-300 font-medium transition-colors flex items-center gap-3">
                <Flag className="w-5 h-5" />
                Escalate to Legal
              </button>
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
            <h2 className="text-xl font-semibold text-white mb-6 flex items-center gap-2">
              <BarChart3 className="w-5 h-5" />
              Content Flags (24h)
            </h2>

            <div className="space-y-4">
              {flagData.map((item, i) => (
                <div key={i}>
                  <div className="flex justify-between mb-2">
                    <span className="text-slate-300">{item.reason}</span>
                    <span className="text-white font-medium">{item.count}</span>
                  </div>
                  <div className="w-full bg-slate-800 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full ${
                        i === 0
                          ? 'bg-amber-500'
                          : i === 1
                          ? 'bg-red-500'
                          : i === 2
                          ? 'bg-orange-500'
                          : 'bg-slate-500'
                      }`}
                      style={{ width: `${item.percent}%` }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
