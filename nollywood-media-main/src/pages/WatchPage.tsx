import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { Share2, Flag, Eye, Play, Maximize, Check, X, Heart, ThumbsDown, CheckCircle, Crown, Gift } from "lucide-react";
import { supabase } from "../lib/supabase";
import { useAuth } from "../context/AuthContext";
import { EnhancedVideoPlayer } from "../components/EnhancedVideoPlayer";
import { WatchlistButton } from "../components/WatchlistButton";
import { AdSpace } from "../components/AdSpace";
import { StarRating } from "../components/StarRating";
import { Comments } from "../components/Comments";
import { BackButton } from "../components/BackButton";
import { SEO } from "../components/SEO";

import { MOCK_FILMS } from "../lib/mockData";

interface Film {
  id: string;
  title: string;
  poster_url: string;
  logline: string;
  synopsis: string;
  genre: string;
  release_year: number;
  runtime_min: number;
  rating: string;
  director: string;
  cast_members: string;
  video_url: string;
  hls_url?: string;
  studio_label: string;
  views: number;
  status?: string;
  scheduled_for?: string;
  is_members_only?: boolean;
}

interface Comment {
  id: string;
  content: string;
  rating: number | null;
  created_at: string;
  user_id: string;
  user_profile: {
    display_name: string;
    avatar_url: string;
  } | null;
  likes_count: number;
  user_has_liked: boolean;
}

export default function WatchPage() {
  const { id } = useParams<{ id: string }>();
  const { user, tier } = useAuth();
  const navigate = useNavigate();
  const [film, setFilm] = useState<Film | null>(null);
  const [creatorProfile, setCreatorProfile] = useState<any>(null);
  const [relatedFilms, setRelatedFilms] = useState<Film[]>([]);
  const [loading, setLoading] = useState(true);
  const [showFullDescription, setShowFullDescription] = useState(false);
  const [theaterMode, setTheaterMode] = useState(false);
  const [averageRating, setAverageRating] = useState<number | null>(null);
  const [totalRatings, setTotalRatings] = useState(0);
  const [shareToast, setShareToast] = useState(false);
  const [isLiked, setIsLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(0);
  const [isDisliked, setIsDisliked] = useState(false);
  const [dislikesCount, setDislikesCount] = useState(0);
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportSubmitted, setReportSubmitted] = useState(false);
  const [showTipModal, setShowTipModal] = useState(false);
  const [tipAmount, setTipAmount] = useState(500);
  const [isTipping, setIsTipping] = useState(false);
  const [tipSuccessToast, setTipSuccessToast] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('tip') === 'success') {
      setTipSuccessToast(true);
      setTimeout(() => setTipSuccessToast(false), 5000);
      const url = new URL(window.location.href);
      url.searchParams.delete('tip');
      window.history.replaceState({}, '', url.toString());
    }
  }, []);

  const handleShareClick = async () => {
    const url = window.location.href;
    try {
      await navigator.clipboard.writeText(url);
      setShareToast(true);
      setTimeout(() => setShareToast(false), 2500);
    } catch {
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = url;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      setShareToast(true);
      setTimeout(() => setShareToast(false), 2500);
    }
  };

  const handleReport = (reason: string) => {
    console.log('Report submitted:', { filmId: id, reason });
    setReportSubmitted(true);
    setTimeout(() => {
      setShowReportModal(false);
      setReportSubmitted(false);
    }, 2000);
  };

  const handleTip = async () => {
    if (!user) {
      alert("Please log in to send a tip.");
      return;
    }
    setIsTipping(true);
    try {
      const response = await fetch('/api/paystack/initialize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'tip',
          email: user.email,
          userId: user.id,
          amount: tipAmount,
          creatorId: creatorProfile?.user_id || (film as any)?.user_id || film?.id,
          filmId: id
        })
      });
      const result = await response.json();
      if (result.error) throw new Error(result.error);
      window.location.href = result.data.authorization_url;
    } catch (e: any) {
      alert("Failed to initialize tip: " + e.message);
      setIsTipping(false);
    }
  };

  useEffect(() => {
    if (id) {
      loadFilmAndComments();
      loadRelatedFilms();
      loadRatings();
      loadLikeStatus();
      loadDislikeStatus();
    }
  }, [id, user]);

  const loadCreatorDetails = async (userId: string) => {
    try {
      if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(userId)) return;
      const { data } = await supabase
        .from('creator_profiles')
        .select('verification_status')
        .eq('user_id', userId)
        .maybeSingle();
      if (data) setCreatorProfile(data);
    } catch (e) { }
  };

  const loadRatings = async () => {
    try {
      const { data, error } = await supabase
        .from('content_ratings')
        .select('rating')
        .eq('film_id', id);

      if (!error && data && data.length > 0) {
        const sum = data.reduce((acc: number, r: { rating: number }) => acc + r.rating, 0);
        setAverageRating(sum / data.length);
        setTotalRatings(data.length);
      }
    } catch (error) {
      console.error('Error loading ratings:', error);
    }
  };

  const loadLikeStatus = async () => {
    try {
      // Get total count
      const { count } = await supabase
        .from('film_likes')
        .select('*', { count: 'exact', head: true })
        .eq('film_id', id);

      setLikesCount(count || 0);

      if (!user) return;

      const { data } = await supabase
        .from('film_likes')
        .select('id')
        .eq('film_id', id)
        .eq('user_id', user.id)
        .maybeSingle();

      setIsLiked(!!data);
    } catch (error) {
      console.error('Error loading like status:', error);
    }
  };

  const loadDislikeStatus = async () => {
    try {
      const { count } = await supabase
        .from('film_dislikes')
        .select('*', { count: 'exact', head: true })
        .eq('film_id', id);

      setDislikesCount(count || 0);

      if (!user) return;

      const { data } = await supabase
        .from('film_dislikes')
        .select('id')
        .eq('film_id', id)
        .eq('user_id', user.id)
        .maybeSingle();

      setIsDisliked(!!data);
    } catch (error) {
      console.error('Error loading dislike status:', error);
    }
  };

  const handleToggleLike = async () => {
    if (!user) {
      alert('Please log in to like videos');
      return;
    }

    try {
      if (isLiked) {
        // Optimistic UI
        setIsLiked(false);
        setLikesCount(prev => Math.max(0, prev - 1));

        await supabase
          .from('film_likes')
          .delete()
          .eq('film_id', id)
          .eq('user_id', user.id);
      } else {
        // Optimistic UI
        setIsLiked(true);
        setLikesCount(prev => prev + 1);

        if (isDisliked) {
          setIsDisliked(false);
          setDislikesCount(prev => Math.max(0, prev - 1));
          await supabase.from('film_dislikes').delete().eq('film_id', id).eq('user_id', user.id);
        }

        await supabase
          .from('film_likes')
          .insert({ film_id: id, user_id: user.id });
      }
    } catch (error) {
      console.error('Error toggling like:', error);
      // Revert on error
      loadLikeStatus();
    }
  };

  const handleToggleDislike = async () => {
    if (!user) {
      alert('Please log in to dislike videos');
      return;
    }

    try {
      if (isDisliked) {
        setIsDisliked(false);
        setDislikesCount(prev => Math.max(0, prev - 1));

        await supabase
          .from('film_dislikes')
          .delete()
          .eq('film_id', id)
          .eq('user_id', user.id);
      } else {
        setIsDisliked(true);
        setDislikesCount(prev => prev + 1);

        if (isLiked) {
          setIsLiked(false);
          setLikesCount(prev => Math.max(0, prev - 1));
          await supabase.from('film_likes').delete().eq('film_id', id).eq('user_id', user.id);
        }

        await supabase
          .from('film_dislikes')
          .insert({ film_id: id, user_id: user.id });
      }
    } catch (error) {
      console.error('Error toggling dislike:', error);
      loadDislikeStatus();
    }
  };

  const loadFilmAndComments = async () => {
    try {
      setLoading(true);
      const { data: filmData, error: filmError } = await supabase
        .from("films")
        .select("*")
        .eq("id", id)
        .maybeSingle();

      if (filmError) throw filmError;

      if (!filmData) {
        // Fallback to mock data
        const mockFilm = MOCK_FILMS.find(f => f.id === id);
        if (mockFilm) {
          setFilm(mockFilm as unknown as Film);
        }
      } else {
        setFilm(filmData);
        if ((filmData as any).user_id) {
          loadCreatorDetails((filmData as any).user_id);
        }
        // Increment views
        fetch('/api/films/view', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ filmId: id })
        }).catch(err => console.error('Failed to increment views:', err));
      }

      await loadComments();
    } catch (error) {
      console.error("Error loading film, checking mock data:", error);
      const mockFilm = MOCK_FILMS.find(f => f.id === id);
      if (mockFilm) {
        setFilm(mockFilm as unknown as Film);
      }
    } finally {
      setLoading(false);
    }
  };

  const loadComments = async () => {
    // Commented out as Comments component handles its own loading
  };

  const loadRelatedFilms = async () => {
    try {
      const { data, error } = await supabase
        .from("films")
        .select("*")
        .neq("id", id)
        .limit(10);

      if (error || !data || data.length === 0) {
        setRelatedFilms(MOCK_FILMS.filter(f => f.id !== id) as unknown as Film[]);
      } else {
        setRelatedFilms(data || []);
      }
    } catch (error) {
      console.error("Error loading related films, using mock data:", error);
      setRelatedFilms(MOCK_FILMS.filter(f => f.id !== id) as unknown as Film[]);
    }
  };

  if (loading || !film) {
    return (
      <div className="bg-white min-h-screen pt-14 flex items-center justify-center">
        <div className="text-gray-600">Loading...</div>
      </div>
    );
  }

  return (
    <div className={`bg-white dark:bg-gray-900 min-h-screen pt-14 ${!theaterMode ? 'lg:pl-60' : ''}`}>
      <SEO title={film.title} description={film.synopsis || film.logline || `Watch ${film.title} on NaijaMation`} ogImage={film.poster_url} ogType="video.movie" />
      <div className={`flex gap-6 ${theaterMode ? 'max-w-full' : ''}`}>
        <div className={`flex-1 px-4 sm:px-6 py-6 ${theaterMode ? 'max-w-full' : 'max-w-6xl'}`}>
          <div className="mb-3">
            <BackButton fallback="/" label="Back" />
          </div>
          <div className={`bg-black rounded-xl overflow-hidden mb-4 relative ${theaterMode ? 'h-screen' : 'aspect-video'}`}>
            {film.status === 'scheduled' && film.scheduled_for && new Date(film.scheduled_for) > new Date() ? (
              <div className="w-full h-full relative">
                <img src={film.poster_url} alt={film.title} className="w-full h-full object-cover opacity-30" />
                <div className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center text-white">
                  <div className="bg-red-900/40 p-6 rounded-full border border-red-500/30 mb-6 backdrop-blur-md animate-pulse">
                    <Play className="w-16 h-16 text-red-500 fill-red-500 opacity-50" />
                  </div>
                  <h3 className="text-3xl font-bold mb-4 tracking-tight">Premieres Shortly</h3>
                  <div className="text-2xl font-mono bg-black/50 px-6 py-3 rounded-lg border border-white/10 shadow-xl shadow-red-900/20">
                    {new Date(film.scheduled_for).toLocaleString(undefined, {
                      weekday: 'long',
                      month: 'long',
                      day: 'numeric',
                      hour: 'numeric',
                      minute: '2-digit'
                    })}
                  </div>
                  <p className="text-gray-400 mt-6 text-sm font-medium">Hang out in the comments below until the premiere starts.</p>
                </div>
              </div>
            ) : film.is_members_only && tier === 'free' ? (
              <div className="w-full h-full relative">
                <img src={film.poster_url} alt={film.title} className="w-full h-full object-cover opacity-30" />
                <div className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center text-white text-center p-6">
                  <div className="bg-yellow-500/20 p-4 rounded-full border border-yellow-500/30 mb-4 backdrop-blur-md">
                    <Crown className="w-12 h-12 text-yellow-500" />
                  </div>
                  <h3 className="text-2xl font-bold mb-2">Members Only Content</h3>
                  <p className="text-gray-300 max-w-md mb-6">This video is exclusive to NaijaMation subscribers. Upgrade your account to unlock premium ad-free viewing and exclusive content.</p>
                  <Link to="/account/subscription" className="px-6 py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg font-semibold transition-colors shadow-lg shadow-red-600/30">
                    Upgrade to Premium
                  </Link>
                </div>
              </div>
            ) : film.video_url || film.hls_url ? (
              <EnhancedVideoPlayer
                src={film.video_url}
                hlsSrc={film.hls_url}
                poster={film.poster_url}
                filmId={film.id}
              />
            ) : (
              <div className="w-full h-full relative">
                <img
                  src={film.poster_url}
                  alt={film.title}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center text-white">
                  <div className="bg-red-600 p-4 rounded-full mb-4">
                    <Play className="w-12 h-12 fill-white" />
                  </div>
                  <h3 className="text-xl font-semibold mb-2">Video Coming Soon</h3>
                  <p className="text-gray-300 text-sm">This content will be available shortly</p>
                </div>
              </div>
            )}
          </div>

          <div className="flex items-center justify-between mb-2">
            <h1 className="text-xl font-semibold text-gray-900 dark:text-white">{film.title}</h1>
            <button
              onClick={() => setTheaterMode(!theaterMode)}
              className="flex items-center gap-2 px-3 py-1.5 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg text-sm font-medium transition-colors text-gray-900 dark:text-white"
              title={theaterMode ? "Exit Theater Mode" : "Theater Mode"}
            >
              <Maximize className="w-4 h-4" />
              {!theaterMode && <span className="hidden sm:inline">Theater</span>}
            </button>
          </div>

          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3 text-sm text-gray-600 dark:text-gray-400">
              <div className="flex items-center gap-1">
                <Eye className="w-4 h-4" />
                <span>{film.views?.toLocaleString() || '0'} views</span>
              </div>
              <span>â€¢</span>
              {averageRating && (
                <>
                  <div className="flex items-center gap-1">
                    <span className="text-yellow-500">â˜…</span>
                    <span className="font-semibold">{averageRating.toFixed(1)}</span>
                    <span className="text-gray-400">({totalRatings})</span>
                  </div>
                  <span>â€¢</span>
                </>
              )}
              <span>{film.release_year}</span>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleToggleLike}
                className={`flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-800 rounded-full text-sm font-medium transition-all ${isLiked ? 'bg-red-50 text-red-600 dark:bg-red-900/20' : 'hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-900 dark:text-white'}`}
                title={isLiked ? "Unlike" : "Like"}
              >
                <Heart className={`w-5 h-5 ${isLiked ? 'fill-red-600' : ''}`} />
                <span className="hidden sm:inline">{likesCount > 0 ? likesCount : 'Like'}</span>
              </button>
              <button
                onClick={handleToggleDislike}
                className={`flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-800 rounded-full text-sm font-medium transition-all ${isDisliked ? 'bg-blue-50 text-blue-600 dark:bg-blue-900/20' : 'hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-900 dark:text-white'}`}
                title={isDisliked ? "Remove Dislike" : "Dislike"}
              >
                <ThumbsDown className={`w-5 h-5 ${isDisliked ? 'fill-blue-600 text-blue-600' : ''}`} />
                <span className="hidden sm:inline">{dislikesCount > 0 ? dislikesCount : 'Dislike'}</span>
              </button>
              <button
                onClick={() => setShowTipModal(true)}
                className="flex items-center gap-2 px-4 py-2 bg-yellow-500/10 hover:bg-yellow-500/20 text-yellow-600 dark:text-yellow-500 rounded-full text-sm font-medium transition-all"
                title="Super Thanks"
              >
                <Gift className="w-5 h-5" />
                <span className="hidden sm:inline">Tip</span>
              </button>
              <button
                onClick={handleShareClick}
                className="flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-800 hover:bg-green-50 dark:hover:bg-green-900/20 hover:text-green-600 rounded-full text-sm font-medium transition-all text-gray-900 dark:text-white"
              >
                {shareToast ? <Check className="w-5 h-5 text-green-600" /> : <Share2 className="w-5 h-5" />}
                <span className="hidden sm:inline">{shareToast ? 'Copied!' : 'Share'}</span>
              </button>
              <button
                onClick={() => setShowReportModal(true)}
                className="flex items-center gap-2 px-3 py-2 bg-gray-100 dark:bg-gray-800 hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-600 rounded-full text-sm font-medium transition-all text-gray-900 dark:text-white"
                title="Report"
              >
                <Flag className="w-5 h-5" />
              </button>
              <WatchlistButton filmId={film.id} size="md" />
            </div>
          </div>

          <div className="bg-gray-100 dark:bg-gray-800 rounded-xl p-4 mb-6">
            <div className="flex flex-wrap items-center gap-3 mb-2 text-sm">
              <Link
                to={`/creator/${(film as any).user_id || film.studio_label}`}
                className="font-semibold text-gray-900 dark:text-white hover:text-red-500 hover:underline transition-colors flex items-center gap-1"
              >
                {film.studio_label}
                {creatorProfile?.verification_status === 'verified' && (
                  <CheckCircle className="h-4 w-4 text-blue-500 fill-blue-500/20" />
                )}
              </Link>
              {film.genre && (
                <Link to={`/genre/${encodeURIComponent(film.genre)}`} className="px-2 py-0.5 bg-red-100 dark:bg-red-900/30 text-red-600 rounded-full hover:bg-red-200 dark:hover:bg-red-900/50 transition-colors">
                  {film.genre}
                </Link>
              )}
              {film.release_year && <span className="text-gray-500 dark:text-gray-400">{film.release_year}</span>}
              {film.runtime_min && <span className="text-gray-500 dark:text-gray-400">{film.runtime_min} min</span>}
            </div>
            <p className={`text-sm text-gray-900 dark:text-gray-300 ${!showFullDescription ? 'line-clamp-2' : ''}`}>
              {film.synopsis || film.logline}
            </p>
            {showFullDescription && (
              <div className="mt-3 space-y-2 text-sm">
                {film.director && (
                  <div>
                    <span className="font-semibold text-gray-900 dark:text-white">Director: </span>
                    <Link to={`/search?q=${encodeURIComponent(film.director)}`} className="text-blue-600 dark:text-blue-400 hover:underline">{film.director}</Link>
                  </div>
                )}
                {film.cast_members && (
                  <div>
                    <span className="font-semibold text-gray-900 dark:text-white">Cast: </span>
                    {film.cast_members.split(',').map((name, i) => (
                      <span key={i}>
                        <Link to={`/search?q=${encodeURIComponent(name.trim())}`} className="text-blue-600 dark:text-blue-400 hover:underline">{name.trim()}</Link>
                        {i < film.cast_members.split(',').length - 1 && ', '}
                      </span>
                    ))}
                  </div>
                )}
                {film.rating && (
                  <div>
                    <span className="font-semibold text-gray-900 dark:text-white">Rating: </span>
                    <span className="text-gray-700 dark:text-gray-300">{film.rating}</span>
                  </div>
                )}
              </div>
            )}
            <button
              onClick={() => setShowFullDescription(!showFullDescription)}
              className="text-sm font-semibold text-gray-900 dark:text-white mt-2"
            >
              {showFullDescription ? 'Show less' : 'Show more'}
            </button>
          </div>

          <div className="my-4">
            <AdSpace variant="leaderboard" />
          </div>

          <div className="mb-6">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-2">Rate this content</h3>
            <StarRating filmId={film.id} size="lg" />
          </div>


          <Comments filmId={film.id} filmTitle={film.title} />
        </div>
      </div>

      <div className="hidden lg:block w-96 px-4 py-6">
        <div className="mb-6">
          <AdSpace variant="rectangle" />
        </div>

        <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">Related</h3>
        <div className="space-y-3">
          {relatedFilms.slice(0, 8).map((relatedFilm) => (
            <div key={relatedFilm.id} className="flex gap-2 cursor-pointer" onClick={() => navigate(`/watch/${relatedFilm.id}`)}>
              <div className="w-40 aspect-video bg-gray-200 rounded-lg overflow-hidden flex-shrink-0">
                <img
                  src={relatedFilm.poster_url || '/placeholder.jpg'}
                  alt={relatedFilm.title}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="text-sm font-semibold text-gray-900 line-clamp-2 mb-1 group-hover:text-red-500 transition-colors">
                  {relatedFilm.title}
                </h4>
                <p className="text-xs text-gray-600">
                  <Link
                    to={`/creator/${(relatedFilm as any).user_id || relatedFilm.studio_label}`}
                    onClick={(e) => e.stopPropagation()}
                    className="hover:text-red-500 hover:underline transition-colors"
                  >
                    {relatedFilm.studio_label}
                  </Link>
                </p>
                <div className="flex items-center gap-1 text-xs text-gray-600 mt-1">
                  <Eye className="w-3 h-3" />
                  <span>{relatedFilm.views?.toLocaleString() || '0'} views</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>

    {
    showTipModal && (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
        <div className="bg-white dark:bg-gray-900 rounded-2xl w-full max-w-md p-6 border border-gray-200 dark:border-gray-800 shadow-2xl relative">
          <button onClick={() => setShowTipModal(false)} className="absolute top-4 right-4 p-2 text-gray-400 hover:text-white bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full transition-colors">
            <X className="w-5 h-5" />
          </button>
          <div className="flex flex-col items-center mb-6">
            <div className="bg-yellow-500/20 p-4 rounded-full mb-4">
              <Gift className="w-10 h-10 text-yellow-500" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white text-center">Support {film?.studio_label}</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 text-center mt-2">Your tip goes directly to the creator to help them make more incredible Nollywood content.</p>
          </div>
          <div className="grid grid-cols-3 gap-3 mb-6">
            {[500, 1000, 2500, 5000, 10000].map(amt => (
              <button
                key={amt}
                onClick={() => setTipAmount(amt)}
                className={`py-3 rounded-xl font-bold text-sm transition-all border ${tipAmount === amt ? 'bg-yellow-500 text-black border-yellow-500' : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-700 hover:bg-gray-200 dark:hover:bg-gray-700'}`}
              >
                ₦{amt.toLocaleString()}
              </button>
            ))}
            <div className="col-span-3 mt-2 relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold">₦</span>
              <input
                type="number"
                value={tipAmount}
                onChange={e => setTipAmount(Number(e.target.value))}
                className="w-full bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-xl py-3 pl-10 pr-4 text-gray-900 dark:text-white focus:ring-2 focus:ring-yellow-500 outline-none font-bold"
              />
            </div>
          </div>
          <button
            onClick={handleTip}
            disabled={isTipping || tipAmount < 100}
            className="w-full flex items-center justify-center gap-2 py-4 rounded-xl bg-gradient-to-r from-yellow-400 to-yellow-600 text-black font-bold text-lg hover:from-yellow-500 hover:to-yellow-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-yellow-500/20"
          >
            {isTipping ? 'Connecting to Paystack...' : `Send ₦${tipAmount.toLocaleString()}`}
          </button>
        </div>
      </div>
    )
  }

  {
    tipSuccessToast && (
      <div className="fixed bottom-4 left-1/2 -translate-x-1/2 bg-yellow-500 text-black px-6 py-3 rounded-full font-bold shadow-2xl flex items-center gap-2 animate-bounce z-50">
        <Gift className="w-5 h-5" />
        Thank you for supporting {film?.studio_label}!
      </div>
    )
  }

  {/* Report Modal */ }
  {
    showReportModal && (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={() => setShowReportModal(false)}>
        <div className="bg-white dark:bg-gray-800 rounded-xl w-full max-w-md shadow-2xl" onClick={(e) => e.stopPropagation()}>
          <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Report Content</h2>
            <button onClick={() => setShowReportModal(false)} className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors">
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>
          {reportSubmitted ? (
            <div className="p-8 text-center">
              <Check className="w-12 h-12 text-green-500 mx-auto mb-3" />
              <p className="text-gray-900 dark:text-white font-semibold">Report Submitted</p>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Thank you. We'll review this content.</p>
            </div>
          ) : (
            <div className="p-4 space-y-2">
              {['Inappropriate content', 'Copyright infringement', 'Spam or misleading', 'Harmful or dangerous', 'Other'].map((reason) => (
                <button
                  key={reason}
                  onClick={() => handleReport(reason)}
                  className="w-full text-left px-4 py-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 text-sm transition-colors"
                >
                  {reason}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    )
  }
  </div >
  );
}
