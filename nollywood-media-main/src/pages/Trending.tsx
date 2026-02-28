import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { SEO } from '../components/SEO';
import { supabase } from '../lib/supabase';
import { FilmRow } from '../components/FilmRow';
import { TrendingUp, Flame, Clock, Eye, Home } from 'lucide-react';

interface Film {
  id: string;
  title: string;
  poster_url: string;
  logline: string;
  genre: string;
  release_year: number;
  rating: string;
  views?: number;
}

interface TrendingFilm extends Film {
  trend_score?: number;
  views_24h?: number;
  views_7d?: number;
}

export default function Trending() {
  const [trending, setTrending] = useState<{
    now: TrendingFilm[];
    today: TrendingFilm[];
    thisWeek: TrendingFilm[];
    allTime: Film[];
  }>({
    now: [],
    today: [],
    thisWeek: [],
    allTime: [],
  });
  const [loading, setLoading] = useState(true);
  const [selectedTab, setSelectedTab] = useState<'now' | 'today' | 'week' | 'alltime'>('now');

  useEffect(() => {
    loadTrendingContent();
  }, []);

  const loadTrendingContent = async () => {
    try {
      await calculateTrendingScores();

      const [trendingNow, trendingToday, trendingWeek, allTimePopular] = await Promise.all([
        getTrendingNow(),
        getTrendingToday(),
        getTrendingThisWeek(),
        getAllTimePopular(),
      ]);

      setTrending({
        now: trendingNow,
        today: trendingToday,
        thisWeek: trendingWeek,
        allTime: allTimePopular,
      });
    } catch (error) {
      console.error('Error loading trending:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateTrendingScores = async () => {
    try {
      await supabase.rpc('calculate_trending_scores');
    } catch (error) {
      console.log('Trending calculation in progress or not available');
    }
  };

  const getTrendingNow = async () => {
    const { data } = await supabase
      .from('trending_content')
      .select(`
  *,
  film: films(*)
      `)
      .order('trend_score', { ascending: false })
      .limit(20);

    return (data || []).map(t => ({
      ...t.film,
      trend_score: t.trend_score,
      views_24h: t.views_24h,
      views_7d: t.views_7d,
    }));
  };

  const getTrendingToday = async () => {
    const oneDayAgo = new Date();
    oneDayAgo.setDate(oneDayAgo.getDate() - 1);

    const { data: recentViews } = await supabase
      .from('playback_events')
      .select('film_id')
      .gte('created_at', oneDayAgo.toISOString());

    if (!recentViews || recentViews.length === 0) {
      return [];
    }

    const filmCounts = recentViews.reduce((acc, view) => {
      acc[view.film_id] = (acc[view.film_id] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const topFilmIds = Object.entries(filmCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 20)
      .map(([id]) => id);

    const { data: films } = await supabase
      .from('films')
      .select('*')
      .in('id', topFilmIds);

    return (films || []).map(film => ({
      ...film,
      views_24h: filmCounts[film.id],
    }));
  };

  const getTrendingThisWeek = async () => {
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

    const { data: recentViews } = await supabase
      .from('playback_events')
      .select('film_id')
      .gte('created_at', oneWeekAgo.toISOString());

    if (!recentViews || recentViews.length === 0) {
      return [];
    }

    const filmCounts = recentViews.reduce((acc, view) => {
      acc[view.film_id] = (acc[view.film_id] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const topFilmIds = Object.entries(filmCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 20)
      .map(([id]) => id);

    const { data: films } = await supabase
      .from('films')
      .select('*')
      .in('id', topFilmIds);

    return (films || []).map(film => ({
      ...film,
      views_7d: filmCounts[film.id],
    }));
  };

  const getAllTimePopular = async () => {
    const { data } = await supabase
      .from('films')
      .select('*')
      .order('views', { ascending: false })
      .limit(20);

    return data || [];
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-white">Loading trending content...</div>
      </div>
    );
  }

  const tabs = [
    { id: 'now', label: 'Trending Now', icon: Flame },
    { id: 'today', label: 'Today', icon: Clock },
    { id: 'week', label: 'This Week', icon: TrendingUp },
    { id: 'alltime', label: 'All Time', icon: Eye },
  ] as const;

  const getCurrentContent = () => {
    switch (selectedTab) {
      case 'now':
        return trending.now;
      case 'today':
        return trending.today;
      case 'week':
        return trending.thisWeek;
      case 'alltime':
        return trending.allTime;
    }
  };

  return (
    <div className="bg-white dark:bg-gray-900 min-h-screen pt-14 lg:pl-60">
      <SEO title="Trending Now" description="Discover the most popular Nollywood films and series trending right now." />

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="px-4 sm:px-6 lg:px-8 mb-8">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <Flame className="h-8 w-8 text-red-600" />
              <h1 className="text-3xl font-bold">Trending</h1>
            </div>
            <Link
              to="/"
              className="flex items-center gap-2 px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded-lg transition-colors"
            >
              <Home className="h-4 w-4" />
              <span className="hidden sm:inline">Back to Home</span>
            </Link>
          </div>
          <p className="text-gray-400">What's hot right now on NaijaMation</p>
        </div>

        <div className="px-4 sm:px-6 lg:px-8 mb-8">
          <div className="flex gap-2 overflow-x-auto pb-2">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setSelectedTab(tab.id)}
                  className={`flex items-center gap-2 px-6 py-3 rounded-lg font-medium whitespace-nowrap transition-colors ${selectedTab === tab.id
                      ? 'bg-red-600 text-white'
                      : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                    }`}
                >
                  <Icon className="h-5 w-5" />
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>

        <div className="px-4 sm:px-6 lg:px-8">
          {selectedTab === 'now' && trending.now.length > 0 && (
            <FilmRow
              title="Trending Right Now"
              films={trending.now}
              showRank
            />
          )}

          {selectedTab === 'today' && trending.today.length > 0 && (
            <FilmRow
              title="Trending Today"
              films={trending.today}
              showRank
            />
          )}

          {selectedTab === 'week' && trending.thisWeek.length > 0 && (
            <FilmRow
              title="Trending This Week"
              films={trending.thisWeek}
              showRank
            />
          )}

          {selectedTab === 'alltime' && trending.allTime.length > 0 && (
            <FilmRow
              title="Most Popular of All Time"
              films={trending.allTime}
              showRank
            />
          )}

          {getCurrentContent().length === 0 && (
            <div className="flex flex-col items-center justify-center py-20">
              <Flame className="h-16 w-16 text-gray-600 mb-4" />
              <p className="text-gray-400 text-lg">No trending content available</p>
              <p className="text-gray-500 text-sm mt-2">Check back soon!</p>
            </div>
          )}
        </div>

        <div className="px-4 sm:px-6 lg:px-8 mt-12">
          <div className="bg-gray-900 rounded-lg p-8 border border-gray-800">
            <h3 className="text-xl font-bold mb-4">How Trending Works</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm text-gray-400">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Flame className="h-5 w-5 text-red-600" />
                  <span className="font-semibold text-white">Trending Now</span>
                </div>
                <p>Content with the highest engagement in the last few hours</p>
              </div>
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Clock className="h-5 w-5 text-blue-600" />
                  <span className="font-semibold text-white">Today</span>
                </div>
                <p>Most watched content in the past 24 hours</p>
              </div>
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <TrendingUp className="h-5 w-5 text-green-600" />
                  <span className="font-semibold text-white">This Week</span>
                </div>
                <p>Top performing content over the last 7 days</p>
              </div>
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Eye className="h-5 w-5 text-purple-600" />
                  <span className="font-semibold text-white">All Time</span>
                </div>
                <p>The most viewed content on our platform ever</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
