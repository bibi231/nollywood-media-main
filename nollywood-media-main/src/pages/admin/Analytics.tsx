import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { Users, Clock, Activity, AlertCircle, Smartphone, Tv, Monitor, Tablet } from 'lucide-react';

interface AnalyticsData {
  dau: number;
  total_watch_time_minutes: number;
  avg_bitrate_mbps: number;
  error_rate_percent: number;
  plays_count: number;
  completions_count: number;
}

interface DeviceData {
  device_type: string;
  user_count: number;
  watch_time_minutes: number;
}

interface FilmAnalytics {
  film_id: string;
  title: string;
  views: number;
  completions: number;
}

interface ChartDataPoint {
  date: string;
  plays: number;
  completions: number;
}

export function AdminAnalytics() {
  const [todayStats, setTodayStats] = useState<AnalyticsData | null>(null);
  const [devices, setDevices] = useState<DeviceData[]>([]);
  const [topFilms, setTopFilms] = useState<FilmAnalytics[]>([]);
  const [chartData, setChartData] = useState<ChartDataPoint[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAnalytics();
  }, []);

  async function loadAnalytics() {
    try {
      const today = new Date().toISOString().split('T')[0];

      const { data: todayData } = await supabase
        .from('analytics_daily')
        .select('*')
        .eq('date', today)
        .maybeSingle();

      if (todayData) {
        setTodayStats(todayData);
      }

      const { data: deviceData } = await supabase
        .from('device_analytics')
        .select('*')
        .eq('date', today)
        .order('user_count', { ascending: false });

      if (deviceData) {
        setDevices(deviceData);
      }

      const { data: filmData } = await supabase
        .from('film_analytics')
        .select('film_id, views, completions, films(title)')
        .eq('date', today)
        .order('views', { ascending: false })
        .limit(5);

      if (filmData) {
        const films = filmData.map(f => ({
          film_id: f.film_id,
          title: (f.films as any)?.title || f.film_id,
          views: f.views,
          completions: f.completions
        }));
        setTopFilms(films);
      }

      const { data: weekData } = await supabase
        .from('analytics_daily')
        .select('date, plays_count, completions_count')
        .gte('date', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0])
        .order('date', { ascending: true });

      if (weekData) {
        setChartData(weekData.map(d => ({
          date: new Date(d.date).toLocaleDateString('en-US', { weekday: 'short' }),
          plays: d.plays_count,
          completions: d.completions_count
        })));
      }

    } catch (error) {
      console.error('Error loading analytics:', error);
    } finally {
      setLoading(false);
    }
  }

  const deviceIcons = {
    mobile: Smartphone,
    tv: Tv,
    desktop: Monitor,
    tablet: Tablet
  };

  if (loading) {
    return (
      <div className="p-8">
        <div className="flex items-center justify-center h-96">
          <div className="text-slate-400">Loading analytics...</div>
        </div>
      </div>
    );
  }

  const maxPlays = Math.max(...chartData.map(d => d.plays), 1);
  const maxCompletions = Math.max(...chartData.map(d => d.completions), 1);

  return (
    <div className="p-8 bg-slate-950 min-h-screen">
      <div className="mb-8">
        <nav className="text-sm text-slate-400 mb-2">
          Admin / <span className="text-white">Analytics</span>
        </nav>
        <h1 className="text-3xl font-bold text-white">Analytics Dashboard</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 hover:border-slate-700 transition-colors">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-blue-500/10 rounded-lg">
              <Users className="w-6 h-6 text-blue-400" />
            </div>
          </div>
          <div className="text-3xl font-bold text-white mb-1">
            {todayStats?.dau?.toLocaleString() || '0'}
          </div>
          <div className="text-sm text-slate-400">Daily Active Users</div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 hover:border-slate-700 transition-colors">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-green-500/10 rounded-lg">
              <Clock className="w-6 h-6 text-green-400" />
            </div>
          </div>
          <div className="text-3xl font-bold text-white mb-1">
            {((todayStats?.total_watch_time_minutes || 0) / 60).toFixed(1)}h
          </div>
          <div className="text-sm text-slate-400">Total Watch Time</div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 hover:border-slate-700 transition-colors">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-amber-500/10 rounded-lg">
              <Activity className="w-6 h-6 text-amber-400" />
            </div>
          </div>
          <div className="text-3xl font-bold text-white mb-1">
            {todayStats?.avg_bitrate_mbps?.toFixed(1) || '0'} Mbps
          </div>
          <div className="text-sm text-slate-400">Avg. Bitrate</div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 hover:border-slate-700 transition-colors">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-red-500/10 rounded-lg">
              <AlertCircle className="w-6 h-6 text-red-400" />
            </div>
          </div>
          <div className="text-3xl font-bold text-white mb-1">
            {todayStats?.error_rate_percent?.toFixed(1) || '0'}%
          </div>
          <div className="text-sm text-slate-400">Error Rate</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-xl p-6">
          <h2 className="text-xl font-semibold text-white mb-6">Plays vs. Completions</h2>
          <div className="h-80 flex items-end justify-between gap-4">
            {chartData.map((point, i) => {
              const playsHeight = (point.plays / maxPlays) * 100;
              const completionsHeight = (point.completions / maxCompletions) * 100;

              return (
                <div key={i} className="flex-1 flex flex-col items-center">
                  <div className="w-full h-64 flex items-end justify-center gap-1 mb-3">
                    <div
                      className="w-1/2 bg-blue-500 rounded-t hover:bg-blue-400 transition-colors relative group"
                      style={{ height: `${playsHeight}%` }}
                    >
                      <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-slate-800 px-2 py-1 rounded text-xs text-white opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                        {point.plays.toLocaleString()} plays
                      </div>
                    </div>
                    <div
                      className="w-1/2 bg-green-500 rounded-t hover:bg-green-400 transition-colors relative group"
                      style={{ height: `${completionsHeight}%` }}
                    >
                      <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-slate-800 px-2 py-1 rounded text-xs text-white opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                        {point.completions.toLocaleString()} completions
                      </div>
                    </div>
                  </div>
                  <div className="text-xs text-slate-400">{point.date}</div>
                </div>
              );
            })}
          </div>
          <div className="flex items-center justify-center gap-6 mt-6">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-blue-500 rounded"></div>
              <span className="text-sm text-slate-400">Plays</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-green-500 rounded"></div>
              <span className="text-sm text-slate-400">Completions</span>
            </div>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
          <h2 className="text-xl font-semibold text-white mb-6">Top Devices</h2>
          <div className="space-y-4">
            {devices.map((device, i) => {
              const Icon = deviceIcons[device.device_type as keyof typeof deviceIcons] || Monitor;
              const total = devices.reduce((acc, d) => acc + d.user_count, 0);
              const percentage = (device.user_count / total * 100).toFixed(0);

              return (
                <div key={i}>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-3">
                      <Icon className="w-5 h-5 text-slate-400" />
                      <span className="text-white capitalize">{device.device_type}</span>
                    </div>
                    <span className="text-slate-400">{percentage}%</span>
                  </div>
                  <div className="w-full bg-slate-800 rounded-full h-2">
                    <div
                      className="bg-gradient-to-r from-blue-500 to-cyan-500 h-2 rounded-full transition-all"
                      style={{ width: `${percentage}%` }}
                    ></div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
          <h2 className="text-xl font-semibold text-white mb-6">Top Titles (24h)</h2>
          <div className="space-y-4">
            {topFilms.map((film, i) => (
              <div key={film.film_id} className="flex items-center gap-4 p-4 bg-slate-800/50 rounded-lg hover:bg-slate-800 transition-colors">
                <div className="flex-shrink-0 w-8 h-8 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-lg flex items-center justify-center font-bold text-white">
                  {i + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-white truncate">{film.title}</div>
                  <div className="text-sm text-slate-400">{film.views.toLocaleString()} views</div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-medium text-green-400">
                    {((film.completions / film.views) * 100).toFixed(0)}%
                  </div>
                  <div className="text-xs text-slate-400">completion</div>
                </div>
              </div>
            ))}
            {topFilms.length === 0 && (
              <div className="text-center py-8 text-slate-400">
                No data available
              </div>
            )}
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
          <h2 className="text-xl font-semibold text-white mb-6">QoE Metrics</h2>
          <div className="space-y-6">
            <div>
              <div className="flex justify-between mb-2">
                <span className="text-slate-300">Avg. Startup Time</span>
                <span className="text-white font-medium">1.2s</span>
              </div>
              <div className="w-full bg-slate-800 rounded-full h-2">
                <div className="bg-green-500 h-2 rounded-full" style={{ width: '75%' }}></div>
              </div>
            </div>

            <div>
              <div className="flex justify-between mb-2">
                <span className="text-slate-300">Buffer Ratio</span>
                <span className="text-white font-medium">0.3%</span>
              </div>
              <div className="w-full bg-slate-800 rounded-full h-2">
                <div className="bg-blue-500 h-2 rounded-full" style={{ width: '5%' }}></div>
              </div>
            </div>

            <div>
              <div className="flex justify-between mb-2">
                <span className="text-slate-300">Video Quality Score</span>
                <span className="text-white font-medium">94/100</span>
              </div>
              <div className="w-full bg-slate-800 rounded-full h-2">
                <div className="bg-green-500 h-2 rounded-full" style={{ width: '94%' }}></div>
              </div>
            </div>

            <div>
              <div className="flex justify-between mb-2">
                <span className="text-slate-300">Avg. Bitrate</span>
                <span className="text-white font-medium">{todayStats?.avg_bitrate_mbps?.toFixed(1) || '0'} Mbps</span>
              </div>
              <div className="w-full bg-slate-800 rounded-full h-2">
                <div className="bg-cyan-500 h-2 rounded-full" style={{ width: '85%' }}></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
