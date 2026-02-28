import { useState, useEffect, useRef } from 'react';
import { ListPlus, Check, Plus, X } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';

interface AddToPlaylistPopoverProps {
    filmId: string;
}

interface Playlist {
    id: string;
    name: string;
}

export function AddToPlaylistPopover({ filmId }: AddToPlaylistPopoverProps) {
    const { user } = useAuth();
    const [isOpen, setIsOpen] = useState(false);
    const [playlists, setPlaylists] = useState<Playlist[]>([]);
    const [activePlaylists, setActivePlaylists] = useState<Set<string>>(new Set());
    const [loading, setLoading] = useState(false);
    const [showCreate, setShowCreate] = useState(false);
    const [newName, setNewName] = useState('');
    const popoverRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (isOpen && user) {
            loadPlaylists();
        }
    }, [isOpen, user]);

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (popoverRef.current && !popoverRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        }
        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [isOpen]);

    const loadPlaylists = async () => {
        setLoading(true);
        try {
            const { data: allPlaylists } = await supabase
                .from('playlists')
                .select('id, name')
                .eq('user_id', user!.id)
                .order('created_at', { ascending: false });

            if (allPlaylists) setPlaylists(allPlaylists);

            const { data: memberships } = await supabase
                .from('playlist_items')
                .select('playlist_id')
                .eq('film_id', filmId);

            const activeSet = new Set<string>();
            memberships?.forEach((m: any) => activeSet.add(m.playlist_id));
            setActivePlaylists(activeSet);
        } catch (error) {
            console.error('Error loading playlists:', error);
        } finally {
            setLoading(false);
        }
    };

    const togglePlaylist = async (playlistId: string) => {
        try {
            const isCurrentlyIn = activePlaylists.has(playlistId);

            if (isCurrentlyIn) {
                const nextSet = new Set(activePlaylists);
                nextSet.delete(playlistId);
                setActivePlaylists(nextSet);

                await supabase
                    .from('playlist_items')
                    .delete()
                    .eq('playlist_id', playlistId)
                    .eq('film_id', filmId);
            } else {
                const nextSet = new Set(activePlaylists);
                nextSet.add(playlistId);
                setActivePlaylists(nextSet);

                const { data: existing } = await supabase
                    .from('playlist_items')
                    .select('position')
                    .eq('playlist_id', playlistId)
                    .order('position', { ascending: false })
                    .limit(1);

                const nextPos = existing?.[0]?.position ? existing[0].position + 1 : 0;

                await supabase
                    .from('playlist_items')
                    .insert({
                        playlist_id: playlistId,
                        film_id: filmId,
                        position: nextPos
                    });
            }
        } catch (e) {
            console.error('Error updating playlist:', e);
            loadPlaylists();
        }
    };

    const handleCreate = async () => {
        if (!newName.trim()) return;
        try {
            const { data, error } = await supabase
                .from('playlists')
                .insert({
                    user_id: user!.id,
                    name: newName.trim(),
                    is_public: true
                })
                .select()
                .single();

            if (error) throw error;

            if (data) {
                await togglePlaylist(data.id);
                setNewName('');
                setShowCreate(false);
                loadPlaylists();
            }
        } catch (e) {
            console.error('Error creating playlist:', e);
        }
    };

    if (!user) return null;

    return (
        <div className="relative" ref={popoverRef}>
            <button
                onClick={(e) => {
                    e.stopPropagation();
                    setIsOpen(!isOpen);
                }}
                className={`p-2 rounded-full transition-colors ${isOpen ? 'bg-white/20' : 'hover:bg-white/20'}`}
                title="Save to Playlist"
            >
                <ListPlus className="w-4 h-4 text-white" />
            </button>

            {isOpen && (
                <div
                    className="absolute bottom-12 right-0 w-64 bg-black/95 backdrop-blur-md rounded-xl border border-white/10 shadow-2xl p-3 z-50 flex flex-col max-h-[300px]"
                    onClick={e => e.stopPropagation()}
                >
                    <div className="flex items-center justify-between mb-2">
                        <h3 className="text-white text-sm font-semibold">Save to Playlist</h3>
                        <button onClick={() => setIsOpen(false)} className="text-gray-400 hover:text-white transition-colors">
                            <X className="w-4 h-4" />
                        </button>
                    </div>

                    <div className="overflow-y-auto flex-1 mb-2 space-y-1 scrollbar-hide min-h-[50px]">
                        {loading && playlists.length === 0 ? (
                            <div className="text-gray-400 text-xs text-center py-4">Loading...</div>
                        ) : playlists.length === 0 ? (
                            <div className="text-gray-400 text-xs text-center py-4">No playlists yet</div>
                        ) : (
                            playlists.map(p => (
                                <button
                                    key={p.id}
                                    onClick={() => togglePlaylist(p.id)}
                                    className="w-full flex items-center justify-between px-2 py-2 hover:bg-white/10 rounded-lg text-left transition-colors group"
                                >
                                    <span className="text-gray-200 text-xs truncate pr-2">{p.name}</span>
                                    {activePlaylists.has(p.id) ? (
                                        <Check className="w-4 h-4 text-red-500 shrink-0" />
                                    ) : (
                                        <div className="w-4 h-4 border border-gray-500 rounded-sm shrink-0 group-hover:border-red-500 transition-colors" />
                                    )}
                                </button>
                            ))
                        )}
                    </div>

                    <div className="pt-2 border-t border-white/10">
                        {showCreate ? (
                            <div className="space-y-2">
                                <input
                                    type="text"
                                    value={newName}
                                    onChange={e => setNewName(e.target.value)}
                                    placeholder="Playlist name"
                                    onKeyDown={e => e.key === 'Enter' && handleCreate()}
                                    autoFocus
                                    className="w-full bg-white/10 border border-white/20 rounded-md px-2 py-1.5 text-xs text-white placeholder-gray-400 outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500 transition-all font-sans"
                                />
                                <div className="flex gap-2 justify-end">
                                    <button onClick={() => setShowCreate(false)} className="text-gray-400 text-xs hover:text-white transition-colors">Cancel</button>
                                    <button onClick={handleCreate} disabled={!newName.trim()} className="text-red-500 text-xs font-semibold hover:text-red-400 disabled:opacity-50 transition-colors">Create</button>
                                </div>
                            </div>
                        ) : (
                            <button
                                onClick={() => setShowCreate(true)}
                                className="w-full flex items-center gap-2 text-xs text-red-400 hover:text-red-300 py-1.5 px-2 font-medium transition-colors"
                            >
                                <Plus className="w-3.5 h-3.5" />
                                Create new playlist
                            </button>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
