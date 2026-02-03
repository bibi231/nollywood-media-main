/**
 * ADMIN MODERATION PORTAL
 * Review flagged content, handle user reports, manage compliance
 * ADMIN & MODERATOR ACCESS ONLY
 */

import { useState, useEffect } from 'react';
import { AlertTriangle, CheckCircle, XCircle, MessageSquare, Eye, Flag, Search } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import { useNavigate } from 'react-router-dom';

type ModerationStatus = 'pending' | 'approved' | 'rejected';

interface ModerationItem {
  id: string;
  type: 'upload' | 'comment' | 'report';
  title: string;
  content: string;
  creator: string;
  status: ModerationStatus;
  created_at: string;
  reason?: string;
}

export default function ModerationPortal() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState<ModerationItem[]>([]);
  const [selectedItem, setSelectedItem] = useState<ModerationItem | null>(null);
  const [filter, setFilter] = useState<ModerationStatus>('pending');
  const [searchTerm, setSearchTerm] = useState('');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    // Verify moderator/admin access
    const checkAccess = async () => {
      if (!user) {
        navigate('/admin/login');
        return;
      }

      const { data: role } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .maybeSingle();

      if (!role || (role.role !== 'admin' && role.role !== 'moderator')) {
        navigate('/');
        return;
      }

      loadModerationQueue();
    };

    checkAccess();
  }, [user, filter]);

  async function loadModerationQueue() {
    try {
      // Load pending uploads
      const { data: uploads } = await supabase
        .from('user_content_uploads')
        .select(`
          id,
          title,
          description,
          status,
          created_at,
          user:user_profiles(display_name)
        `)
        .eq('status', filter)
        .order('created_at', { ascending: false });

      // Load flagged comments
      const { data: comments } = await supabase
        .from('film_comments')
        .select(`
          id,
          content,
          created_at,
          user:user_profiles(display_name),
          film:films(title)
        `)
        .is('deleted_at', null)
        .order('created_at', { ascending: false })
        .limit(50);

      // Combine and format
      const formatted: ModerationItem[] = [
        ...(uploads?.map(u => ({
          id: u.id,
          type: 'upload' as const,
          title: u.title,
          content: u.description || 'No description provided',
          creator: u.user?.display_name || 'Unknown',
          status: u.status as ModerationStatus,
          created_at: u.created_at,
        })) || []),
        ...(comments?.map(c => ({
          id: c.id,
          type: 'comment' as const,
          title: `Comment on "${c.film?.title}"`,
          content: c.content,
          creator: c.user?.display_name || 'Unknown',
          status: 'pending' as const,
          created_at: c.created_at,
        })) || []),
      ]
        .filter(item => searchTerm === '' || item.title.toLowerCase().includes(searchTerm.toLowerCase()))
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

      setItems(formatted);
      if (formatted.length > 0) setSelectedItem(formatted[0]);
      setLoading(false);
    } catch (error) {
      console.error('Error loading moderation queue:', error);
      setLoading(false);
    }
  }

  async function handleAction(itemId: string, approve: boolean) {
    if (!selectedItem) return;

    try {
      if (selectedItem.type === 'upload') {
        await supabase
          .from('user_content_uploads')
          .update({
            status: approve ? 'approved' : 'rejected',
            rejection_reason: approve ? null : notes || 'Rejected by moderator',
          })
          .eq('id', itemId);

        // Create notification for creator
        await supabase.from('notifications').insert({
          user_id: selectedItem.creator,
          type: approve ? 'new_upload' : 'mention',
          title: approve ? 'Your upload was approved!' : 'Your upload was rejected',
          message: approve
            ? 'Your content is now live on the platform'
            : `Rejection reason: ${notes || 'Content violates community guidelines'}`,
          read: false,
        });
      } else if (selectedItem.type === 'comment') {
        if (!approve) {
          await supabase
            .from('film_comments')
            .update({ deleted_at: new Date().toISOString() })
            .eq('id', itemId);
        }
      }

      // Refresh queue
      setItems(items.filter(i => i.id !== itemId));
      setSelectedItem(null);
      setNotes('');
      setAction('');
    } catch (error) {
      console.error('Error updating moderation:', error);
    }
  }

  if (loading) {
    return (
      <div className="bg-gray-50 min-h-screen flex items-center justify-center">
        <div className="text-center">
          <AlertTriangle className="w-12 h-12 text-yellow-600 mx-auto animate-spin" />
          <p className="mt-4 text-gray-600">Loading moderation queue...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 min-h-screen p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Moderation Portal</h1>
          <p className="text-gray-600 mt-2">Review flagged content, user uploads, and community violations</p>
        </div>

        {/* Status Filter */}
        <div className="flex gap-4 mb-8">
          {(['pending', 'approved', 'rejected'] as const).map(status => (
            <button
              key={status}
              onClick={() => setFilter(status)}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                filter === status
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-gray-600 hover:bg-gray-100'
              }`}
            >
              {status.charAt(0).toUpperCase() + status.slice(1)}
              {status === 'pending' && ` (${items.filter(i => i.status === 'pending').length})`}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="mb-8 flex gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search by title or creator..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Queue List */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <div className="bg-gray-100 px-6 py-4 border-b border-gray-200">
                <h2 className="font-semibold text-gray-900">Queue ({items.length})</h2>
              </div>
              <div className="max-h-[600px] overflow-y-auto">
                {items.length === 0 ? (
                  <div className="p-6 text-center text-gray-600">
                    <CheckCircle className="w-12 h-12 mx-auto mb-2 text-green-600" />
                    <p>All caught up! No {filter} items.</p>
                  </div>
                ) : (
                  items.map(item => (
                    <div
                      key={item.id}
                      onClick={() => setSelectedItem(item)}
                      className={`p-4 border-b border-gray-100 cursor-pointer transition-colors ${
                        selectedItem?.id === item.id
                          ? 'bg-blue-50 border-l-4 border-l-blue-600'
                          : 'hover:bg-gray-50'
                      }`}
                    >
                      <div className="flex items-start gap-2">
                        {item.type === 'upload' && <Flag className="w-4 h-4 text-orange-600 mt-1 flex-shrink-0" />}
                        {item.type === 'comment' && <MessageSquare className="w-4 h-4 text-blue-600 mt-1 flex-shrink-0" />}
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm text-gray-900 truncate">{item.title}</p>
                          <p className="text-xs text-gray-600 mt-1">{item.creator}</p>
                          <p className="text-xs text-gray-500 mt-1">
                            {new Date(item.created_at).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Detail View */}
          <div className="lg:col-span-2">
            {selectedItem ? (
              <div className="bg-white rounded-lg shadow overflow-hidden">
                {/* Item Details */}
                <div className="p-6 border-b border-gray-200">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="text-xl font-bold text-gray-900">{selectedItem.title}</h3>
                      <p className="text-sm text-gray-600 mt-1">
                        By <span className="font-medium">{selectedItem.creator}</span> •{' '}
                        {new Date(selectedItem.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                      selectedItem.status === 'pending'
                        ? 'bg-yellow-100 text-yellow-800'
                        : selectedItem.status === 'approved'
                        ? 'bg-green-100 text-green-800'
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {selectedItem.status.charAt(0).toUpperCase() + selectedItem.status.slice(1)}
                    </span>
                  </div>

                  <div className="bg-gray-50 p-4 rounded-lg">
                    <p className="text-gray-700 whitespace-pre-wrap">{selectedItem.content}</p>
                  </div>
                </div>

                {/* Moderation Actions */}
                {selectedItem.status === 'pending' && (
                  <div className="p-6 bg-gray-50 border-t border-gray-200">
                    <div className="mb-4">
                      <label className="block text-sm font-medium text-gray-900 mb-2">
                        Rejection Reason (if applicable)
                      </label>
                      <textarea
                        value={notes}
                        onChange={e => setNotes(e.target.value)}
                        placeholder="Explain why this content is being rejected..."
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        rows={3}
                      />
                    </div>

                    <div className="flex gap-3">
                      <button
                        onClick={() => handleAction(selectedItem.id, true)}
                        className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium"
                      >
                        <CheckCircle className="w-4 h-4" />
                        Approve
                      </button>
                      <button
                        onClick={() => handleAction(selectedItem.id, false)}
                        className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium"
                      >
                        <XCircle className="w-4 h-4" />
                        Reject
                      </button>
                    </div>
                  </div>
                )}

                {/* View Full Content (for uploads) */}
                {selectedItem.type === 'upload' && (
                  <div className="p-6 border-t border-gray-200 bg-gray-50">
                    <button className="flex items-center gap-2 text-blue-600 hover:text-blue-700 font-medium">
                      <Eye className="w-4 h-4" />
                      View Full Upload
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="bg-white rounded-lg shadow p-6 text-center">
                <MessageSquare className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                <p className="text-gray-600">Select an item from the queue to review</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
