import { useState, useEffect } from 'react';
import { Users, UserPlus, UserCheck } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase';

interface Creator {
  id: string;
  user_id: string;
  channel_name: string;
  channel_description: string;
  channel_avatar: string;
  subscriber_count: number;
  verification_status: string;
  is_followed: boolean;
}

export default function CreatorDiscover() {
  const { user } = useAuth();
  const [creators, setCreators] = useState<Creator[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadCreators();
  }, [user]);

  const loadCreators = async () => {
    try {
      const { data, error } = await supabase
        .from('creator_profiles')
        .select('*')
        .limit(12);

      if (error) throw error;

      let followedCreatorIds = new Set<string>();
      if (user && data && data.length > 0) {
        const creatorIds = data.map(c => c.user_id).filter(Boolean);
        if (creatorIds.length > 0) {
          const { data: followData } = await supabase
            .from('user_follows')
            .select('following_id')
            .eq('follower_id', user.id)
            .in('following_id', creatorIds);

          if (followData) {
            followedCreatorIds = new Set(followData.map(f => f.following_id));
          }
        }
      }

      const creatorsWithFollow = (data || []).map((creator) => ({
        ...creator,
        is_followed: followedCreatorIds.has(creator.user_id),
      }));

      setCreators(creatorsWithFollow);
    } catch (error) {
      console.error('Error loading creators:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleFollow = async (creatorUserId: string, isFollowed: boolean) => {
    if (!user) {
      alert('Please sign in to follow creators');
      return;
    }

    try {
      if (isFollowed) {
        await supabase
          .from('user_follows')
          .delete()
          .eq('follower_id', user.id)
          .eq('following_id', creatorUserId);
      } else {
        await supabase.from('user_follows').insert({
          follower_id: user.id,
          following_id: creatorUserId,
        });
      }

      setCreators(creators.map(c =>
        c.user_id === creatorUserId
          ? { ...c, is_followed: !isFollowed }
          : c
      ));
    } catch (error) {
      console.error('Error toggling follow:', error);
    }
  };

  if (loading) {
    return <div className="text-center py-12">Loading creators...</div>;
  }

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex items-center gap-3 mb-8">
        <Users className="w-6 h-6 text-red-600" />
        <h2 className="text-2xl font-bold text-gray-900">Popular Creators</h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {creators.map((creator) => (
          <div
            key={creator.id}
            className="bg-white rounded-lg border border-gray-200 overflow-hidden hover:shadow-lg transition-shadow"
          >
            <div className="aspect-video bg-gradient-to-br from-red-600 to-red-800 relative overflow-hidden">
              {creator.channel_avatar && (
                <img
                  src={creator.channel_avatar}
                  alt={creator.channel_name}
                  className="w-full h-full object-cover"
                />
              )}
              {creator.verification_status === 'verified' && (
                <div className="absolute top-3 right-3 px-2 py-1 bg-blue-600 text-white text-xs rounded-full font-medium">
                  ✓ Verified
                </div>
              )}
            </div>

            <div className="p-4">
              <h3 className="font-bold text-gray-900 text-lg mb-2">
                {creator.channel_name}
              </h3>
              {creator.channel_description && (
                <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                  {creator.channel_description}
                </p>
              )}

              <div className="flex items-center gap-2 text-sm text-gray-600 mb-4">
                <Users className="w-4 h-4" />
                <span>{creator.subscriber_count.toLocaleString()} subscribers</span>
              </div>

              <button
                onClick={() => handleToggleFollow(creator.user_id, creator.is_followed)}
                className={`w-full px-4 py-2.5 rounded-lg font-medium transition-colors flex items-center justify-center gap-2 ${creator.is_followed
                    ? 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    : 'bg-red-600 text-white hover:bg-red-700'
                  }`}
              >
                {creator.is_followed ? (
                  <>
                    <UserCheck className="w-4 h-4" />
                    Following
                  </>
                ) : (
                  <>
                    <UserPlus className="w-4 h-4" />
                    Follow
                  </>
                )}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
