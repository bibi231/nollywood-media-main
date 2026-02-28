import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { FilmRow } from '../components/FilmRow';
import { Film, Home, Clapperboard, Sparkles, Zap, Heart, Ghost, Music as MusicIcon, Compass } from 'lucide-react';
import { motion } from 'framer-motion';

export default function Explore() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [recommendations, setRecommendations] = useState<{
    forYou: any[];
    popular: any[];
    newReleases: any[];
    trending: any[];
  }>({
    forYou: [],
    popular: [],
    newReleases: [],
    trending: [],
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadExploreData();
  }, [user]);

  const loadExploreData = async () => {
    setLoading(true);
    try {
      const apiBase = import.meta.env.VITE_API_BASE || '';

      const fetchFeed = async (type: string) => {
        const params = new URLSearchParams({ type });
        if (user?.id) params.append('userId', user.id);
        const res = await fetch(`${apiBase}/api/recommendations?${params.toString()}`);
        return (await res.json()).data || [];
      };

      const [forYou, popular, newReleases, trending] = await Promise.all([
        fetchFeed('mixed'),
        fetchFeed('popular'),
        fetchFeed('new'),
        fetchFeed('trending')
      ]);

      setRecommendations({
        forYou,
        popular,
        newReleases,
        trending
      });
    } catch (error) {
      console.error('Error loading explore data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-white">Loading personalized recommendations...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="pt-20 pb-10">
        <div className="px-4 sm:px-6 lg:px-8 mb-8">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-3xl font-bold">Explore</h1>
            <Link
              to="/"
              className="flex items-center gap-2 px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded-lg transition-colors"
            >
              <Home className="h-4 w-4" />
              <span className="hidden sm:inline">Back to Home</span>
            </Link>
          </div>
          <p className="text-gray-400">
            {user ? 'Personalized recommendations just for you' : 'Discover amazing content'}
          </p>
        </div>

        {/* 3D Neon Genre Grid */}
        <div className="px-4 sm:px-6 lg:px-8 mb-16">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {[
              { id: 'action', label: 'Action', icon: Zap, color: 'from-orange-500 to-red-600', shadow: 'shadow-orange-500/20' },
              { id: 'drama', label: 'Drama', icon: Clapperboard, color: 'from-purple-500 to-indigo-600', shadow: 'shadow-purple-500/20' },
              { id: 'comedy', label: 'Comedy', icon: Sparkles, color: 'from-amber-400 to-yellow-600', shadow: 'shadow-amber-500/20' },
              { id: 'romance', label: 'Romance', icon: Heart, color: 'from-pink-500 to-rose-600', shadow: 'shadow-pink-500/20' },
              { id: 'horror', label: 'Horror', icon: Ghost, color: 'from-emerald-500 to-teal-700', shadow: 'shadow-emerald-500/20' },
              { id: 'music', label: 'Music', icon: MusicIcon, color: 'from-blue-500 to-cyan-600', shadow: 'shadow-blue-500/20' },
            ].map((genre, i) => {
              const Icon = genre.icon;
              return (
                <motion.div
                  key={genre.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1 }}
                  whileHover={{ y: -5, scale: 1.02 }}
                  onClick={() => navigate(genre.id === 'music' ? '/content/music' : `/genre/${genre.id}`)}
                  className={`relative overflow-hidden rounded-2xl cursor-pointer group bg-gradient-to-br ${genre.color} p-[1px] ${genre.shadow} hover:shadow-xl transition-all duration-300`}
                >
                  <div className="absolute inset-0 bg-white/20 dark:bg-black/20 group-hover:bg-transparent transition-colors z-10" />
                  <div className="relative h-24 lg:h-32 bg-gray-900 rounded-[15px] flex flex-col items-center justify-center gap-2 overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                    <Icon className="h-8 w-8 text-white z-20" />
                    <span className="font-bold text-white z-20 tracking-wide">{genre.label}</span>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>

        {recommendations.forYou.length > 0 && (
          <FilmRow
            title={user ? "Recommended For You" : "Featured Content"}
            films={recommendations.forYou}
          />
        )}

        {recommendations.trending.length > 0 && (
          <FilmRow
            title="Trending This Week"
            films={recommendations.trending}
          />
        )}

        {recommendations.popular.length > 0 && (
          <FilmRow
            title="Popular on NaijaMation"
            films={recommendations.popular}
          />
        )}

        {recommendations.newReleases.length > 0 && (
          <FilmRow
            title="New Releases"
            films={recommendations.newReleases}
          />
        )}

        {!loading && Object.values(recommendations).every(arr => arr.length === 0) && (
          <div className="flex flex-col items-center justify-center py-20">
            <Film className="h-16 w-16 text-gray-600 mb-4" />
            <p className="text-gray-400 text-lg">No recommendations available yet</p>
          </div>
        )}
      </div>
    </div>
  );
}
