import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabase';
import { useNavigate } from 'react-router-dom';
import { ListPlus, Play, Trash2, Plus, X, Film } from 'lucide-react';

interface Playlist {
    id: string;
    name: string;
    description: string;
    is_public: boolean;
    created_at: string;
    item_count: number;
}

interface PlaylistItem {
    id: string;
    film_id: string;
    title: string;
    poster_url: string;
    duration: string;
    position: number;
}

export function Playlists() {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [playlists, setPlaylists] = useState<Playlist[]>([]);
    const [loading, setLoading] = useState(true);
    const [showCreate, setShowCreate] = useState(false);
    const [newName, setNewName] = useState('');
    const [newDesc, setNewDesc] = useState('');
    const [newIsPublic, setNewIsPublic] = useState(true);
    const [selectedPlaylist, setSelectedPlaylist] = useState<string | null>(null);
    const [playlistItems, setPlaylistItems] = useState<PlaylistItem[]>([]);
    const [itemsLoading, setItemsLoading] = useState(false);

    useEffect(() => {
        if (user) loadPlaylists();
    }, [user]);

    const loadPlaylists = async () => {
        if (!user) return;
        try {
            const { data, error } = await supabase
                .from('playlists')
                .select('*, playlist_films(count)')
                .eq('user_id', user.id)
                .order('created_at', { ascending: false });

            if (error) throw error;

            setPlaylists(
                (data || []).map((p: any) => ({
                    ...p,
                    item_count: p.playlist_films?.[0]?.count || 0,
                }))
            );
        } catch (err) {
            console.error('Error loading playlists:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleCreate = async () => {
        if (!user || !newName.trim()) return;
        try {
            const { error } = await supabase.from('playlists').insert({
                user_id: user.id,
                name: newName.trim(),
                description: newDesc.trim(),
                is_public: newIsPublic,
            });
            if (error) throw error;
            setNewName('');
            setNewDesc('');
            setShowCreate(false);
            loadPlaylists();
        } catch (err) {
            console.error('Error creating playlist:', err);
        }
    };

    const handleDelete = async (playlistId: string) => {
        if (!confirm('Delete this playlist?')) return;
        try {
            await supabase.from('playlists').delete().eq('id', playlistId).eq('user_id', user?.id);
            setPlaylists(prev => prev.filter(p => p.id !== playlistId));
            if (selectedPlaylist === playlistId) setSelectedPlaylist(null);
        } catch (err) {
            console.error('Error deleting playlist:', err);
        }
    };

    const loadPlaylistItems = useCallback(async (playlistId: string) => {
        setItemsLoading(true);
        try {
            const { data, error } = await supabase
                .from('playlist_films')
                .select('id, film_id, position, films(title, poster_url, duration)')
                .eq('playlist_id', playlistId)
                .order('position', { ascending: true });

            if (error) throw error;

            setPlaylistItems(
                (data || []).map((item: any) => ({
                    id: item.id,
                    film_id: item.film_id,
                    title: item.films?.title || 'Unknown',
                    poster_url: item.films?.poster_url || '',
                    duration: item.films?.duration || '',
                    position: item.position,
                }))
            );
        } catch (err) {
            console.error('Error loading playlist items:', err);
        } finally {
            setItemsLoading(false);
        }
    }, []);

    useEffect(() => {
        if (selectedPlaylist) loadPlaylistItems(selectedPlaylist);
    }, [selectedPlaylist, loadPlaylistItems]);

    const handleRemoveItem = async (itemId: string) => {
        try {
            await supabase.from('playlist_films').delete().eq('id', itemId);
            setPlaylistItems(prev => prev.filter(i => i.id !== itemId));
        } catch (err) {
            console.error('Error removing item:', err);
        }
    };

    if (loading) {
        return <div className="flex items-center justify-center py-12 text-gray-600 dark:text-gray-400">Loading playlists...</div>;
    }

    return (
        <div>
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">My Playlists</h1>
                    <p className="text-gray-600 dark:text-gray-400 text-sm">Organise your favourite content into collections</p>
                </div>
                <button
                    onClick={() => setShowCreate(!showCreate)}
                    className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-medium rounded-lg transition-colors"
                >
                    <Plus className="h-4 w-4" />
                    New Playlist
                </button>
            </div>

            {/* Create form */}
            {showCreate && (
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 mb-6 border border-gray-200 dark:border-gray-700">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Create Playlist</h3>
                    <div className="space-y-4">
                        <input
                            type="text"
                            value={newName}
                            onChange={(e) => setNewName(e.target.value)}
                            placeholder="Playlist name"
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white text-sm"
                        />
                        <textarea
                            value={newDesc}
                            onChange={(e) => setNewDesc(e.target.value)}
                            placeholder="Description (optional)"
                            rows={2}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white text-sm resize-none"
                        />
                        <div className="flex items-center justify-between">
                            <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                                <input
                                    type="checkbox"
                                    checked={newIsPublic}
                                    onChange={(e) => setNewIsPublic(e.target.checked)}
                                    className="rounded"
                                />
                                Public playlist
                            </label>
                            <div className="flex gap-2">
                                <button onClick={() => setShowCreate(false)} className="px-4 py-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900">
                                    Cancel
                                </button>
                                <button
                                    onClick={handleCreate}
                                    disabled={!newName.trim()}
                                    className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-medium rounded-lg disabled:opacity-50"
                                >
                                    Create
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Playlist list */}
                <div className="lg:col-span-1 space-y-3">
                    {playlists.length === 0 ? (
                        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-8 text-center">
                            <ListPlus className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                            <h3 className="font-semibold text-gray-900 dark:text-white mb-1">No playlists yet</h3>
                            <p className="text-sm text-gray-600 dark:text-gray-400">Create your first playlist to organise content</p>
                        </div>
                    ) : (
                        playlists.map((playlist) => (
                            <div
                                key={playlist.id}
                                onClick={() => setSelectedPlaylist(playlist.id)}
                                className={`bg-white dark:bg-gray-800 rounded-lg shadow p-4 cursor-pointer transition-all border-2 ${selectedPlaylist === playlist.id
                                    ? 'border-red-600 shadow-md'
                                    : 'border-transparent hover:border-gray-300 dark:hover:border-gray-600'
                                    }`}
                            >
                                <div className="flex items-start justify-between">
                                    <div className="min-w-0 flex-1">
                                        <h3 className="font-semibold text-gray-900 dark:text-white truncate">{playlist.name}</h3>
                                        {playlist.description && (
                                            <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-1 mt-0.5">{playlist.description}</p>
                                        )}
                                        <div className="flex items-center gap-3 mt-2 text-xs text-gray-500 dark:text-gray-400">
                                            <span>{playlist.item_count} items</span>
                                            <span>{playlist.is_public ? '🌍 Public' : '🔒 Private'}</span>
                                        </div>
                                    </div>
                                    <button
                                        onClick={(e) => { e.stopPropagation(); handleDelete(playlist.id); }}
                                        className="text-gray-400 hover:text-red-600 transition-colors p-1"
                                        title="Delete playlist"
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </button>
                                </div>
                            </div>
                        ))
                    )}
                </div>

                {/* Playlist items */}
                <div className="lg:col-span-2">
                    {selectedPlaylist ? (
                        <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
                            <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
                                <h3 className="font-semibold text-gray-900 dark:text-white">
                                    {playlists.find(p => p.id === selectedPlaylist)?.name}
                                </h3>
                                <button
                                    onClick={() => {
                                        if (playlistItems.length > 0) {
                                            navigate(`/watch/${playlistItems[0].film_id}`);
                                        }
                                    }}
                                    disabled={playlistItems.length === 0}
                                    className="flex items-center gap-2 px-4 py-1.5 bg-red-600 hover:bg-red-700 text-white text-sm font-medium rounded-lg disabled:opacity-50"
                                >
                                    <Play className="h-4 w-4" />
                                    Play All
                                </button>
                            </div>

                            {itemsLoading ? (
                                <div className="p-8 text-center text-gray-500 dark:text-gray-400">Loading items...</div>
                            ) : playlistItems.length === 0 ? (
                                <div className="p-12 text-center">
                                    <Film className="h-10 w-10 text-gray-400 mx-auto mb-3" />
                                    <p className="text-gray-600 dark:text-gray-400 text-sm">This playlist is empty</p>
                                    <p className="text-gray-500 dark:text-gray-500 text-xs mt-1">Add videos from the watch page</p>
                                </div>
                            ) : (
                                <div className="divide-y divide-gray-100 dark:divide-gray-700">
                                    {playlistItems.map((item, idx) => (
                                        <div key={item.id} className="flex items-center gap-3 p-3 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors group">
                                            <span className="text-xs text-gray-400 w-5 text-center">{idx + 1}</span>
                                            <div
                                                className="w-24 h-14 bg-gray-200 dark:bg-gray-700 rounded overflow-hidden flex-shrink-0 cursor-pointer"
                                                onClick={() => navigate(`/watch/${item.film_id}`)}
                                            >
                                                {item.poster_url && (
                                                    <img src={item.poster_url} alt={item.title} className="w-full h-full object-cover" />
                                                )}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p
                                                    className="text-sm font-medium text-gray-900 dark:text-white truncate cursor-pointer hover:text-red-600"
                                                    onClick={() => navigate(`/watch/${item.film_id}`)}
                                                >
                                                    {item.title}
                                                </p>
                                                {item.duration && (
                                                    <p className="text-xs text-gray-500 dark:text-gray-400">{item.duration}</p>
                                                )}
                                            </div>
                                            <button
                                                onClick={() => handleRemoveItem(item.id)}
                                                className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-600 transition-all p-1"
                                                title="Remove from playlist"
                                            >
                                                <X className="h-4 w-4" />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-12 text-center">
                            <ListPlus className="h-10 w-10 text-gray-400 mx-auto mb-3" />
                            <p className="text-gray-600 dark:text-gray-400">Select a playlist to view its contents</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
