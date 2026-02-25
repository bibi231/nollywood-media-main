import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabase';
import { useNavigate } from 'react-router-dom';
import { Upload, Clock, CheckCircle, XCircle, AlertCircle, Eye, Trash2, Sparkles } from 'lucide-react';

interface UserUpload {
  id: string;
  title: string;
  description: string;
  category: string;
  status: string;
  moderation_status: string;
  visibility: string;
  created_at: string;
  moderation_notes: string | null;
  rejection_reason: string | null;
  views: number;
  likes: number;
  thumbnail_url: string | null;
  video_url: string | null;
  source?: string;
}

export function MyUploads() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [uploads, setUploads] = useState<UserUpload[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>('all');

  useEffect(() => {
    if (user) {
      loadUploads();
    }
  }, [user, filter]);

  const loadUploads = async () => {
    if (!user) return;

    try {
      let query = supabase
        .from('user_content_uploads')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (filter !== 'all') {
        query = query.eq('moderation_status', filter);
      }

      const { data, error } = await query;

      if (error) throw error;

      console.log('Loaded uploads:', data);
      setUploads(data || []);
    } catch (error) {
      console.error('Error loading uploads:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (uploadId: string) => {
    if (!confirm('Are you sure you want to delete this upload?')) return;

    try {
      const { error } = await supabase
        .from('user_content_uploads')
        .delete()
        .eq('id', uploadId)
        .eq('user_id', user?.id);

      if (error) throw error;

      setUploads(prev => prev.filter(u => u.id !== uploadId));
    } catch (error) {
      console.error('Error deleting upload:', error);
      alert('Failed to delete upload');
    }
  };

  const getStatusBadge = (status: string) => {
    const badges = {
      pending: {
        icon: Clock,
        text: 'Pending Review',
        className: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
      },
      approved: {
        icon: CheckCircle,
        text: 'Approved',
        className: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
      },
      rejected: {
        icon: XCircle,
        text: 'Rejected',
        className: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
      },
      flagged: {
        icon: AlertCircle,
        text: 'Flagged',
        className: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200'
      }
    };

    const badge = badges[status as keyof typeof badges] || badges.pending;
    const Icon = badge.icon;

    return (
      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${badge.className}`}>
        <Icon className="h-3 w-3" />
        {badge.text}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-gray-600 dark:text-gray-400">Loading your uploads...</div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            My Uploads
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Manage your submitted content
          </p>
        </div>
        <button
          onClick={() => navigate('/account/upload')}
          className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-medium rounded-lg transition-colors flex items-center gap-2"
        >
          <Upload className="h-4 w-4" />
          New Upload
        </button>
        <button
          onClick={() => { navigate('/account/upload'); setTimeout(() => document.querySelector<HTMLButtonElement>('[data-tab="ai"]')?.click(), 100); }}
          className="px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-medium rounded-lg transition-colors flex items-center gap-2"
        >
          <Sparkles className="h-4 w-4" />
          AI Generate
        </button>
      </div>

      <div className="mb-6 flex gap-2">
        {['all', 'pending', 'approved', 'rejected'].map(status => (
          <button
            key={status}
            onClick={() => setFilter(status)}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${filter === status
                ? 'bg-red-600 text-white'
                : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
              }`}
          >
            {status.charAt(0).toUpperCase() + status.slice(1)}
          </button>
        ))}
      </div>

      {uploads.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-12 text-center">
          <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            No uploads yet
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            Start sharing your AI-generated content with the community
          </p>
          <button
            onClick={() => navigate('/account/upload')}
            className="px-6 py-2 bg-red-600 hover:bg-red-700 text-white font-medium rounded-lg transition-colors"
          >
            Upload Content
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {uploads.map(upload => (
            <div
              key={upload.id}
              className="bg-white dark:bg-gray-800 rounded-lg shadow hover:shadow-md transition-shadow p-4"
            >
              <div className="flex gap-4">
                <div className="flex-shrink-0">
                  {upload.thumbnail_url ? (
                    <img
                      src={upload.thumbnail_url}
                      alt={upload.title}
                      className="w-32 h-20 object-cover rounded"
                    />
                  ) : (
                    <div className="w-32 h-20 bg-gray-200 dark:bg-gray-700 rounded flex items-center justify-center">
                      <Upload className="h-8 w-8 text-gray-400" />
                    </div>
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
                        {upload.title}
                      </h3>
                      <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                        <span className="px-2 py-0.5 bg-gray-100 dark:bg-gray-700 rounded">
                          {upload.category}
                        </span>
                        {upload.source === 'ai' && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded text-xs font-medium">
                            <Sparkles className="h-3 w-3" />
                            AI Generated
                          </span>
                        )}
                        <span>•</span>
                        <span>{new Date(upload.created_at).toLocaleDateString()}</span>
                        <span>•</span>
                        <div className="flex items-center gap-1">
                          <Eye className="h-3 w-3" />
                          <span>{upload.views || 0} views</span>
                        </div>
                      </div>
                    </div>
                    {getStatusBadge(upload.moderation_status)}
                  </div>

                  <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2 mb-3">
                    {upload.description}
                  </p>

                  {upload.rejection_reason && (
                    <div className="mb-3 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                      <p className="text-sm font-medium text-red-900 dark:text-red-100 mb-1">
                        Rejection Reason:
                      </p>
                      <p className="text-sm text-red-700 dark:text-red-300">
                        {upload.rejection_reason}
                      </p>
                    </div>
                  )}

                  {upload.moderation_notes && (
                    <div className="mb-3 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                      <p className="text-sm font-medium text-blue-900 dark:text-blue-100 mb-1">
                        Moderator Notes:
                      </p>
                      <p className="text-sm text-blue-700 dark:text-blue-300">
                        {upload.moderation_notes}
                      </p>
                    </div>
                  )}

                  <div className="flex items-center gap-2">
                    {upload.status === 'pending' && (
                      <button
                        onClick={() => navigate(`/account/upload/${upload.id}`)}
                        className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
                      >
                        Edit
                      </button>
                    )}
                    <button
                      onClick={() => handleDelete(upload.id)}
                      className="flex items-center gap-1 text-sm text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300"
                    >
                      <Trash2 className="h-3 w-3" />
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
