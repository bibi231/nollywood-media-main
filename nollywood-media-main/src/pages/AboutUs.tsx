import { Link } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { Film, Users, Globe, Heart, Home } from 'lucide-react';

export default function AboutUs() {
  const [stats, setStats] = useState({
    totalFilms: 0,
    totalUsers: 0,
    totalCreators: 0,
    totalViews: 0,
    totalCountries: 15
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await fetch('/api/analytics/counts');
        if (response.ok) {
          const data = await response.json();
          setStats(data);
        }
      } catch (err) {
        console.error('Failed to fetch stats:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  const formatNumber = (num: number) => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M+';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K+';
    return num.toString();
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex justify-end mb-6">
          <Link
            to="/"
            className="flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg transition-colors"
          >
            <Home className="h-4 w-4" />
            Back to Home
          </Link>
        </div>

        <div className="text-center mb-16">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
            About NaijaMation
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-400 max-w-3xl mx-auto">
            Your premier destination for African animation, films, and original content
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-16">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 text-center">
            <div className="w-16 h-16 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <Film className="h-8 w-8 text-red-600" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              {loading ? '...' : formatNumber(stats.totalFilms)}
            </h3>
            <p className="text-gray-600 dark:text-gray-400">Videos & Films</p>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 text-center">
            <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <Users className="h-8 w-8 text-blue-600" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              {loading ? '...' : formatNumber(stats.totalUsers)}
            </h3>
            <p className="text-gray-600 dark:text-gray-400">Active Users</p>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 text-center">
            <div className="w-16 h-16 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <Globe className="h-8 w-8 text-green-600" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              {loading ? '...' : stats.totalCountries + '+'}
            </h3>
            <p className="text-gray-600 dark:text-gray-400">Countries</p>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 text-center">
            <div className="w-16 h-16 bg-purple-100 dark:bg-purple-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <Heart className="h-8 w-8 text-purple-600" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              {loading ? '...' : formatNumber(stats.totalCreators)}
            </h3>
            <p className="text-gray-600 dark:text-gray-400">Creators</p>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8 mb-12">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">Our Story</h2>
          <div className="prose dark:prose-invert max-w-none">
            <p className="text-gray-700 dark:text-gray-300 mb-4">
              NaijaMation was founded with a simple yet powerful vision: to create a platform that celebrates and showcases African creativity, storytelling, and culture through animation and film.
            </p>
            <p className="text-gray-700 dark:text-gray-300 mb-4">
              We recognized that African creators needed a dedicated space to share their work, connect with audiences, and build sustainable careers in the entertainment industry. What started as a small community has grown into a thriving ecosystem of creators, viewers, and supporters from around the world.
            </p>
            <p className="text-gray-700 dark:text-gray-300 mb-4">
              Today, NaijaMation serves as a bridge between African creators and global audiences, offering original content, classic films, and emerging voices in animation and cinema. We're committed to supporting creators through monetization opportunities, educational resources, and a platform that values quality storytelling.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">Our Mission</h3>
            <p className="text-gray-600 dark:text-gray-400">
              To empower African creators and bring their stories to the world through innovative streaming technology and community support.
            </p>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">Our Vision</h3>
            <p className="text-gray-600 dark:text-gray-400">
              To become the leading platform for African content globally, celebrating diversity and fostering creative excellence.
            </p>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">Our Values</h3>
            <p className="text-gray-600 dark:text-gray-400">
              Creativity, authenticity, community, excellence, and empowerment drive everything we do.
            </p>
          </div>
        </div>

        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-8 text-center">
          <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            Join Our Community
          </h3>
          <p className="text-gray-700 dark:text-gray-300 mb-6">
            Whether you're a creator, viewer, or supporter, there's a place for you on NaijaMation
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link
              to="/signup"
              className="px-6 py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg font-semibold transition-colors"
            >
              Get Started
            </Link>
            <Link
              to="/careers"
              className="px-6 py-3 bg-white dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-900 dark:text-white border border-gray-300 dark:border-gray-600 rounded-lg font-semibold transition-colors"
            >
              Join Our Team
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
