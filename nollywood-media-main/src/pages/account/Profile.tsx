import { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabase';
import { Camera, Save, Mail, MapPin, Phone, Calendar, Globe, MessageSquare, Heart } from 'lucide-react';

interface UserProfile {
  display_name: string;
  avatar_url: string;
  bio: string;
  favorite_genres: string[];
  social_links: {
    twitter?: string;
    instagram?: string;
    facebook?: string;
  };
}

interface UserStats {
  watchlistCount: number;
  historyCount: number;
  commentsCount: number;
  likesGiven: number;
}

export function Profile() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [stats, setStats] = useState<UserStats>({
    watchlistCount: 0,
    historyCount: 0,
    commentsCount: 0,
    likesGiven: 0,
  });
  const [profile, setProfile] = useState<UserProfile>({
    display_name: '',
    avatar_url: '',
    bio: '',
    favorite_genres: [],
    social_links: {},
  });

  const genres = ['Action', 'Comedy', 'Drama', 'Romance', 'Thriller', 'Horror', 'Sci-Fi', 'Fantasy', 'Documentary', 'Anime'];

  useEffect(() => {
    loadProfile();
    loadStats();
  }, [user]);

  const loadProfile = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', user.id)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') throw error;

      if (data) {
        setProfile({
          display_name: data.display_name || '',
          avatar_url: data.avatar_url || '',
          bio: data.bio || '',
          favorite_genres: data.favorite_genres || [],
          social_links: data.social_links || {},
        });
      }
    } catch (error) {
      console.error('Error loading profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    if (!user) return;

    try {
      const [watchlistRes, historyRes, commentsRes, likesRes] = await Promise.all([
        supabase.from('user_watchlist').select('id', { count: 'exact', head: true }).eq('user_id', user.id),
        supabase.from('user_watch_history').select('id', { count: 'exact', head: true }).eq('user_id', user.id),
        supabase.from('film_comments').select('id', { count: 'exact', head: true }).eq('user_id', user.id),
        supabase.from('comment_likes').select('id', { count: 'exact', head: true }).eq('user_id', user.id),
      ]);

      setStats({
        watchlistCount: watchlistRes.count || 0,
        historyCount: historyRes.count || 0,
        commentsCount: commentsRes.count || 0,
        likesGiven: likesRes.count || 0,
      });
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setSaving(true);
    try {
      const { error } = await supabase
        .from('user_profiles')
        .upsert({
          id: user.id,
          ...profile,
          updated_at: new Date().toISOString(),
        });

      if (error) throw error;
      alert('Profile updated successfully!');
    } catch (error: any) {
      console.error('Error saving profile:', error);
      alert('Failed to save profile: ' + error.message);
    } finally {
      setSaving(false);
    }
  };

  const toggleGenre = (genre: string) => {
    setProfile({
      ...profile,
      favorite_genres: profile.favorite_genres.includes(genre)
        ? profile.favorite_genres.filter(g => g !== genre)
        : [...profile.favorite_genres, genre]
    });
  };

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="text-gray-600">Loading profile...</div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl">
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">My Profile</h1>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Manage your account information and preferences</p>
        </div>

        <div className="p-6">
          <div className="grid md:grid-cols-4 gap-4 mb-8">
            <div className="bg-gradient-to-br from-red-50 to-orange-50 rounded-lg p-4 border border-red-100">
              <div className="flex flex-col">
                <div className="flex items-center justify-between mb-2">
                  <MessageSquare className="w-5 h-5 text-red-600" />
                  <p className="text-2xl font-bold text-red-600">{stats.watchlistCount}</p>
                </div>
                <p className="text-xs text-gray-600">Watchlist</p>
              </div>
            </div>

            <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-lg p-4 border border-blue-100">
              <div className="flex flex-col">
                <div className="flex items-center justify-between mb-2">
                  <Globe className="w-5 h-5 text-blue-600" />
                  <p className="text-2xl font-bold text-blue-600">{stats.historyCount}</p>
                </div>
                <p className="text-xs text-gray-600">Videos Watched</p>
              </div>
            </div>

            <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-lg p-4 border border-green-100">
              <div className="flex flex-col">
                <div className="flex items-center justify-between mb-2">
                  <MessageSquare className="w-5 h-5 text-green-600" />
                  <p className="text-2xl font-bold text-green-600">{stats.commentsCount}</p>
                </div>
                <p className="text-xs text-gray-600">Comments</p>
              </div>
            </div>

            <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-lg p-4 border border-purple-100">
              <div className="flex flex-col">
                <div className="flex items-center justify-between mb-2">
                  <Heart className="w-5 h-5 text-purple-600" />
                  <p className="text-2xl font-bold text-purple-600">{stats.likesGiven}</p>
                </div>
                <p className="text-xs text-gray-600">Likes Given</p>
              </div>
            </div>
          </div>

          <form onSubmit={handleSave} className="space-y-6">
            <div className="flex items-start gap-6">
              <div className="relative group">
                <div className="w-32 h-32 rounded-full overflow-hidden bg-gray-200 border-4 border-white shadow-lg">
                  {profile.avatar_url ? (
                    <img src={profile.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-red-600 text-white text-4xl font-bold">
                      {profile.display_name.charAt(0).toUpperCase() || user?.email?.charAt(0).toUpperCase()}
                    </div>
                  )}
                </div>
                <button
                  type="button"
                  className="absolute bottom-0 right-0 p-2 bg-red-600 text-white rounded-full shadow-lg hover:bg-red-700 transition-colors"
                >
                  <Camera className="w-4 h-4" />
                </button>
              </div>

              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 mb-2">Display Name</label>
                <input
                  type="text"
                  value={profile.display_name}
                  onChange={(e) => setProfile({ ...profile, display_name: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent text-gray-900"
                  placeholder="Your display name"
                />

                <div className="mt-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                  <div className="flex items-center gap-2 px-4 py-2 bg-gray-50 border border-gray-300 rounded-lg text-gray-600">
                    <Mail className="w-4 h-4" />
                    <span>{user?.email}</span>
                  </div>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Bio</label>
              <textarea
                value={profile.bio}
                onChange={(e) => setProfile({ ...profile, bio: e.target.value })}
                rows={4}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent resize-none text-gray-900"
                placeholder="Tell us about yourself..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">Favorite Genres</label>
              <div className="flex flex-wrap gap-2">
                {genres.map((genre) => (
                  <button
                    key={genre}
                    type="button"
                    onClick={() => toggleGenre(genre)}
                    className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${profile.favorite_genres.includes(genre)
                      ? 'bg-red-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                  >
                    {genre}
                  </button>
                ))}
              </div>
            </div>

            <div className="pt-6 border-t border-gray-200">
              <button
                type="submit"
                disabled={saving}
                className="flex items-center gap-2 px-6 py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Save className="w-5 h-5" />
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
