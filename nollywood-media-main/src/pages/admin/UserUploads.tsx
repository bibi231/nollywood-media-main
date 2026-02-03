import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { CheckCircle, XCircle, AlertTriangle, Eye, Play, Calendar } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

interface Upload {
  id: string;
  title: string;
  description: string;
  logline: string;
  genre: string;
  tags: string[];
  runtime_min: number | null;
  video_url: string | null;
  poster_url: string | null;
  thumbnail_url: string | null;
  status: string;
  ai_verification_status: string;
  ai_confidence_score: number | null;
  creator_confirmation: boolean;
  created_at: string;
  user_id: string;
  view_count: number;
  moderation_notes: string | null;
  rejection_reason: string | null;
}

export function UserUploads() {
  const { user } = useAuth();
  const [uploads, setUploads] = useState<Upload[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('pending');
  const [selectedUpload, setSelectedUpload] = useState<Upload | null>(null);
  const [moderationNotes, setModerationNotes] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    loadUploads();
  }, [filter]);

  const loadUploads = async () => {
    try {
      let query = supabase
        .from('user_uploads')
        .select('*')
        .order('created_at', { ascending: false });

      if (filter !== 'all') {
        query = query.eq('status', filter);
      }

      const { data, error } = await query;
      if (error) throw error;

      setUploads(data || []);
    } catch (error) {
      console.error('Error loading uploads:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleModerate = async (uploadId: string, action: 'approve' | 'reject' | 'flag') => {
    if (!user) return;

    if (action === 'reject' && !rejectionReason.trim()) {
      alert('Please provide a rejection reason');
      return;
    }

    if (action === 'approve' && !confirm('Are you sure you want to approve this upload? It will be published to the platform.')) {
      return;
    }

    setProcessing(true);

    try {
      const updates: any = {
        status: action === 'approve' ? 'approved' : action === 'reject' ? 'rejected' : 'flagged',
        moderated_by: user.id,
        moderated_at: new Date().toISOString(),
        moderation_notes: moderationNotes || null,
      };

      if (action === 'reject') {
        updates.rejection_reason = rejectionReason;
      }

      const { error } = await supabase
        .from('user_uploads')
        .update(updates)
        .eq('id', uploadId);

      if (error) throw error;

      if (action === 'approve') {
        const upload = uploads.find(u => u.id === uploadId);
        if (upload) {
          const { error: filmError } = await supabase.from('films').insert({
            id: upload.id,
            title: upload.title,
            logline: upload.logline || upload.description,
            synopsis: upload.description,
            genre: upload.genre,
            poster_url: upload.poster_url || '',
            video_url: upload.video_url || '',
            release_year: new Date().getFullYear(),
            runtime_min: upload.runtime_min || 0,
            country: 'Nigeria',
            studio_label: 'User Generated',
            tags: upload.tags,
            status: 'published'
          });

          if (filmError) console.error('Error publishing to films:', filmError);

          await supabase
            .from('user_uploads')
            .update({
              published_film_id: upload.id,
              published_at: new Date().toISOString()
            })
            .eq('id', uploadId);
        }
      }

      await supabase.from('notifications').insert({
        user_id: uploads.find(u => u.id === uploadId)?.user_id,
        type: action === 'approve' ? 'upload_approved' : action === 'reject' ? 'upload_rejected' : 'upload_flagged',
        title: action === 'approve' ? 'Content Approved!' : action === 'reject' ? 'Content Rejected' : 'Content Flagged',
        message: action === 'approve'
          ? 'Your uploaded content has been approved and is now live!'
          : action === 'reject'
          ? `Your content was rejected: ${rejectionReason}`
          : 'Your content has been flagged for review'
      });

      loadUploads();
      setSelectedUpload(null);
      setModerationNotes('');
      setRejectionReason('');
    } catch (error) {
      console.error('Error moderating upload:', error);
      alert('Failed to moderate upload');
    } finally {
      setProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-gray-600">Loading uploads...</div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">User Upload Moderation</h1>
        <p className="text-gray-600">Review and moderate user-submitted content</p>
      </div>

      <div className="mb-6 flex gap-2">
        {['pending', 'approved', 'rejected', 'flagged', 'all'].map(status => (
          <button
            key={status}
            onClick={() => setFilter(status)}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              filter === status
                ? 'bg-red-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {status.charAt(0).toUpperCase() + status.slice(1)}
          </button>
        ))}
      </div>

      <div className="grid gap-4">
        {uploads.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-12 text-center">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              No uploads found
            </h3>
            <p className="text-gray-600">
              No uploads match the selected filter
            </p>
          </div>
        ) : (
          uploads.map(upload => (
            <div key={upload.id} className="bg-white rounded-lg shadow p-6">
              <div className="flex gap-6">
                <div className="flex-shrink-0">
                  {upload.poster_url ? (
                    <img
                      src={upload.poster_url}
                      alt={upload.title}
                      className="w-48 h-28 object-cover rounded"
                    />
                  ) : (
                    <div className="w-48 h-28 bg-gray-200 rounded flex items-center justify-center">
                      <Play className="h-12 w-12 text-gray-400" />
                    </div>
                  )}
                </div>

                <div className="flex-1">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="text-xl font-semibold text-gray-900 mb-1">
                        {upload.title}
                      </h3>
                      <div className="flex items-center gap-3 text-sm text-gray-600">
                        <span className="px-2 py-1 bg-gray-100 rounded">{upload.genre}</span>
                        <div className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {new Date(upload.created_at).toLocaleDateString()}
                        </div>
                        <div className="flex items-center gap-1">
                          <Eye className="h-3 w-3" />
                          {upload.view_count} views
                        </div>
                        {upload.ai_confidence_score && (
                          <span className="text-blue-600 font-medium">
                            AI Score: {upload.ai_confidence_score.toFixed(1)}%
                          </span>
                        )}
                      </div>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                      upload.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                      upload.status === 'approved' ? 'bg-green-100 text-green-800' :
                      upload.status === 'rejected' ? 'bg-red-100 text-red-800' :
                      'bg-orange-100 text-orange-800'
                    }`}>
                      {upload.status}
                    </span>
                  </div>

                  <p className="text-sm text-gray-700 mb-2 font-medium">{upload.logline}</p>
                  <p className="text-sm text-gray-600 mb-3 line-clamp-2">{upload.description}</p>

                  {upload.tags && upload.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-3">
                      {upload.tags.map(tag => (
                        <span key={tag} className="px-2 py-0.5 bg-blue-50 text-blue-700 text-xs rounded">
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}

                  {!upload.creator_confirmation && (
                    <div className="mb-3 p-2 bg-red-50 border border-red-200 rounded flex items-center gap-2 text-sm text-red-700">
                      <AlertTriangle className="h-4 w-4" />
                      Creator did not confirm AI-generated content
                    </div>
                  )}

                  {upload.status === 'pending' ? (
                    <div className="space-y-3">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Moderation Notes
                        </label>
                        <textarea
                          value={selectedUpload?.id === upload.id ? moderationNotes : ''}
                          onChange={(e) => {
                            setSelectedUpload(upload);
                            setModerationNotes(e.target.value);
                          }}
                          rows={2}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                          placeholder="Optional notes..."
                        />
                      </div>

                      {selectedUpload?.id === upload.id && (
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Rejection Reason (if rejecting)
                          </label>
                          <textarea
                            value={rejectionReason}
                            onChange={(e) => setRejectionReason(e.target.value)}
                            rows={2}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                            placeholder="Explain why this content is being rejected..."
                          />
                        </div>
                      )}

                      <div className="flex gap-2">
                        <button
                          onClick={() => handleModerate(upload.id, 'approve')}
                          disabled={processing}
                          className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg disabled:opacity-50"
                        >
                          <CheckCircle className="h-4 w-4" />
                          Approve & Publish
                        </button>
                        <button
                          onClick={() => {
                            setSelectedUpload(upload);
                          }}
                          className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg"
                        >
                          <XCircle className="h-4 w-4" />
                          Reject
                        </button>
                        {selectedUpload?.id === upload.id && (
                          <button
                            onClick={() => handleModerate(upload.id, 'reject')}
                            disabled={processing}
                            className="px-4 py-2 bg-red-700 hover:bg-red-800 text-white rounded-lg disabled:opacity-50"
                          >
                            Confirm Reject
                          </button>
                        )}
                        <button
                          onClick={() => handleModerate(upload.id, 'flag')}
                          disabled={processing}
                          className="flex items-center gap-2 px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg disabled:opacity-50"
                        >
                          <AlertTriangle className="h-4 w-4" />
                          Flag for Review
                        </button>
                        {upload.video_url && (
                          <a
                            href={upload.video_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-2 px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg"
                          >
                            <Play className="h-4 w-4" />
                            Preview Video
                          </a>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="text-sm text-gray-600">
                      {upload.moderation_notes && (
                        <p className="mb-1"><strong>Notes:</strong> {upload.moderation_notes}</p>
                      )}
                      {upload.rejection_reason && (
                        <p className="text-red-600"><strong>Rejection:</strong> {upload.rejection_reason}</p>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
