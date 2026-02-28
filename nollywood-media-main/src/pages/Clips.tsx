import { useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { Heart, MessageCircle, Share2, Play, Volume2, VolumeX, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { SEO } from "../components/SEO";

interface ShortFilm {
    id: string;
    title: string;
    logline: string;
    video_url: string;
    poster_url: string;
    studio_label: string;
    views: number;
}

export default function Clips() {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [shorts, setShorts] = useState<ShortFilm[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeIndex, setActiveIndex] = useState(0);
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        loadShorts();
    }, []);

    const loadShorts = async () => {
        setLoading(true);
        try {
            // Prioritize films marked as shorts or vertical aspect, fallback to random standard films
            let { data } = await supabase
                .from('films')
                .select('*')
                .eq('is_short', true)
                .order('created_at', { ascending: false })
                .limit(10);

            // Demo fallback: If no actual shorts exist, just pull random 10 videos
            if (!data || data.length === 0) {
                const fallback = await supabase
                    .from('films')
                    .select('*')
                    .limit(10);
                data = fallback.data;
            }

            setShorts(data || []);
        } catch (e) {
            console.error('Error loading shorts', e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const handleScroll = () => {
            if (!containerRef.current) return;

            const container = containerRef.current;
            const scrollPosition = container.scrollTop;
            const windowHeight = window.innerHeight - 64; // Adjust for header

            const newIndex = Math.round(scrollPosition / windowHeight);
            if (newIndex !== activeIndex && newIndex >= 0 && newIndex < shorts.length) {
                setActiveIndex(newIndex);
            }
        };

        const container = containerRef.current;
        if (container) {
            container.addEventListener('scroll', handleScroll);
            return () => container.removeEventListener('scroll', handleScroll);
        }
    }, [activeIndex, shorts.length]);

    if (loading) {
        return (
            <div className="h-[calc(100vh-64px)] w-full flex items-center justify-center bg-black pt-16">
                <div className="text-white">Loading Shorts...</div>
            </div>
        );
    }

    return (
        <div className="bg-black w-full h-screen overflow-hidden flex justify-center relative">
            <SEO title="Clips" description="Discover and watch short, scrollable clips on NaijaMation." />
            {/* Back Button */}
            <button
                onClick={() => navigate(-1)}
                className="absolute top-6 left-6 z-50 p-3 bg-black/40 backdrop-blur-md rounded-full text-white hover:bg-black/60 transition-colors"
                title="Go Back"
            >
                <ArrowLeft className="w-6 h-6" />
            </button>
            <div
                ref={containerRef}
                className="h-full w-full max-w-md snap-y snap-mandatory overflow-y-scroll scrollbar-hide"
            >
                {shorts.map((short, index) => (
                    <ShortPlayer
                        key={short.id}
                        short={short}
                        isActive={index === activeIndex}
                        user={user}
                        onAvatarClick={() => navigate(`/creator/${encodeURIComponent(short.studio_label)}`)}
                    />
                ))}
            </div>
        </div>
    );
}

function ShortPlayer({ short, isActive, onAvatarClick }: { short: ShortFilm, isActive: boolean, user?: any, onAvatarClick: () => void }) {
    const videoRef = useRef<HTMLVideoElement>(null);
    const [playing, setPlaying] = useState(false);
    const [muted, setMuted] = useState(true);
    const [liked, setLiked] = useState(false);
    const [likeCount, setLikeCount] = useState(0);

    useEffect(() => {
        if (isActive) {
            videoRef.current?.play().catch(() => { });
            setPlaying(true);
        } else {
            videoRef.current?.pause();
            if (videoRef.current) videoRef.current.currentTime = 0;
            setPlaying(false);
        }
    }, [isActive]);

    const togglePlay = () => {
        if (playing) {
            videoRef.current?.pause();
        } else {
            videoRef.current?.play();
        }
        setPlaying(!playing);
    };

    return (
        <div className="h-[calc(100vh-64px)] w-full snap-start relative bg-black flex items-center justify-center group border-b border-gray-900">
            {/* Video Element */}
            <video
                ref={videoRef}
                src={short.video_url}
                poster={short.poster_url}
                className="h-full w-full object-cover"
                loop
                muted={muted}
                playsInline
                onClick={togglePlay}
            />

            {/* Play/Pause Overlay animation */}
            {!playing && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none bg-black/20">
                    <div className="p-4 bg-black/50 rounded-full">
                        <Play className="w-12 h-12 text-white fill-white" />
                    </div>
                </div>
            )}

            {/* Mute Toggle */}
            <button
                onClick={(e) => { e.stopPropagation(); setMuted(!muted); }}
                className="absolute top-4 right-4 p-2 bg-black/40 rounded-full text-white backdrop-blur-sm"
            >
                {muted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
            </button>

            {/* Overlay - Bottom Gradient for text readability */}
            <div className="absolute bottom-0 left-0 right-0 h-1/2 bg-gradient-to-t from-black/80 via-black/40 to-transparent pointer-events-none" />

            {/* Info Block (Bottom Left) */}
            <div className="absolute bottom-4 left-4 right-16 z-10 text-white">
                <h3
                    className="text-md font-bold mb-1 cursor-pointer hover:underline inline-flex items-center gap-2"
                    onClick={(e) => { e.stopPropagation(); onAvatarClick(); }}
                >
                    <div className="w-8 h-8 rounded-full bg-red-600 flex items-center justify-center text-xs text-white">
                        {short.studio_label[0]}
                    </div>
                    @{short.studio_label.replace(/\s+/g, '')}
                </h3>
                <p className="text-sm font-semibold mb-1 truncate">{short.title}</p>
                <p className="text-xs text-gray-300 line-clamp-2">{short.logline}</p>
            </div>

            {/* Actions Block (Bottom Right) */}
            <div className="absolute bottom-4 right-2 z-10 flex flex-col items-center gap-4">
                <div className="flex flex-col items-center gap-1 group/btn">
                    <button
                        onClick={(e) => { e.stopPropagation(); setLiked(!liked); setLikeCount(prev => liked ? prev - 1 : prev + 1); }}
                        className={`p-3 bg-black/50 rounded-full backdrop-blur-md transition-transform active:scale-90 ${liked ? 'bg-red-600/20' : ''}`}
                    >
                        <Heart className={`w-6 h-6 ${liked ? 'fill-red-600 text-red-600' : 'text-white group-hover/btn:text-red-400'}`} />
                    </button>
                    <span className="text-white text-xs font-semibold">{likeCount > 0 ? likeCount : 'Like'}</span>
                </div>

                <div className="flex flex-col items-center gap-1 group/btn">
                    <button className="p-3 bg-black/50 rounded-full backdrop-blur-md transition-transform active:scale-90">
                        <MessageCircle className="w-6 h-6 text-white group-hover/btn:text-blue-400" />
                    </button>
                    <span className="text-white text-xs font-semibold">12</span>
                </div>

                <div className="flex flex-col items-center gap-1 group/btn">
                    <button className="p-3 bg-black/50 rounded-full backdrop-blur-md transition-transform active:scale-90">
                        <Share2 className="w-6 h-6 text-white group-hover/btn:text-green-400" />
                    </button>
                    <span className="text-white text-xs font-semibold">Share</span>
                </div>
            </div>
        </div>
    );
}
