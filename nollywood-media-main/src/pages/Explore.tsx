import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { FilmRow } from '../components/FilmRow';
import { Film, Home } from 'lucide-react';

export default function Explore() {
  const { user } = useAuth();
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
