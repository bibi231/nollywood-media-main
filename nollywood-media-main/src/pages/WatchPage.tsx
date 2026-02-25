import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { ThumbsUp, ThumbsDown, Share2, Flag, Eye, Play, Maximize, Check, X } from "lucide-react";
import { supabase } from "../lib/supabase";
import { useAuth } from "../context/AuthContext";
import { EnhancedVideoPlayer } from "../components/EnhancedVideoPlayer";
import { ContentCard } from "../components/ContentCard";
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
  studio_label: string;
  views: number;
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
  const { user } = useAuth();
  const navigate = useNavigate();
  const [film, setFilm] = useState<Film | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [relatedFilms, setRelatedFilms] = useState<Film[]>([]);
  const [loading, setLoading] = useState(true);
  const [commentText, setCommentText] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [showFullDescription, setShowFullDescription] = useState(false);
  const [theaterMode, setTheaterMode] = useState(false);
  const [commentSort, setCommentSort] = useState<'newest' | 'popular'>('newest');
  const [userLiked, setUserLiked] = useState(false);
  const [userDisliked, setUserDisliked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const [dislikeCount, setDislikeCount] = useState(0);
  const [averageRating, setAverageRating] = useState<number | null>(null);
  const [totalRatings, setTotalRatings] = useState(0);
  const [shareToast, setShareToast] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportSubmitted, setReportSubmitted] = useState(false);

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

  useEffect(() => {
    if (id) {
      loadFilmAndComments();
      loadRelatedFilms();
      loadRatings();
      loadLikeStatus();
    }
  }, [id, user]);

  const loadRatings = async () => {
    try {
      const { data, error } = await supabase
        .from('content_ratings')
        .select('rating')
        .eq('film_id', id);

      if (!error && data && data.length > 0) {
        const sum = data.reduce((acc, r) => acc + r.rating, 0);
        setAverageRating(sum / data.length);
        setTotalRatings(data.length);
      }
    } catch (error) {
      console.error('Error loading ratings:', error);
    }
  };

  const loadLikeStatus = async () => {
    if (!user) return;

    try {
      const { data } = await supabase
        .from('film_likes')
        .select('like_type')
        .eq('film_id', id)
        .eq('user_id', user.id)
        .maybeSingle();

      if (data) {
        setUserLiked(data.like_type === 'like');
        setUserDisliked(data.like_type === 'dislike');
      }
    } catch (error) {
      console.error('Error loading like status:', error);
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
    try {
      const { data: commentsData, error } = await supabase
        .from("film_comments")
        .select(`
          *,
          user_profile:user_profiles!film_comments_user_id_fkey(display_name, avatar_url)
        `)
        .eq("film_id", id)
        .order("created_at", { ascending: false })
        .limit(20);

      if (error) throw error;
      setComments([]); // In mock mode, we just start with no comments
    } catch (error) {
      console.error("Error loading comments:", error);
      setComments([]);
    }
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

  const handleLike = async (type: 'like' | 'dislike') => {
    if (!user) {
      alert('Please sign in to rate this content');
      return;
    }

    try {
      const isCurrentlyLiked = type === 'like' ? userLiked : userDisliked;

      if (isCurrentlyLiked) {
        await supabase
          .from('film_likes')
          .delete()
          .eq('film_id', id)
          .eq('user_id', user.id);

        setUserLiked(false);
        setUserDisliked(false);
      } else {
        await supabase
          .from('film_likes')
          .upsert({
            film_id: id,
            user_id: user.id,
            like_type: type,
          }, { onConflict: 'film_id,user_id' });

        setUserLiked(type === 'like');
        setUserDisliked(type === 'dislike');
      }
    } catch (error) {
      console.error('Error updating like:', error);
    }
  };

  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      alert("Please sign in to comment");
      return;
    }
    if (!commentText.trim()) return;

    setSubmitting(true);
    try {
      const { error } = await supabase.from("film_comments").insert({
        film_id: id,
        user_id: user.id,
        content: commentText.trim(),
      });

      if (error) throw error;

      setCommentText("");
      await loadComments();
    } catch (error: any) {
      console.error("Error submitting comment:", error);
      alert("Failed to post comment");
    } finally {
      setSubmitting(false);
    }
  };

  const handleLikeComment = async (commentId: string) => {
    if (!user) {
      alert("Please sign in to like comments");
      return;
    }

    try {
      const comment = comments.find((c) => c.id === commentId);
      if (!comment) return;

      if (comment.user_has_liked) {
        await supabase
          .from("comment_likes")
          .delete()
          .eq("comment_id", commentId)
          .eq("user_id", user.id);
      } else {
        await supabase.from("comment_likes").insert({
          comment_id: commentId,
          user_id: user.id,
        });
      }

      await loadComments();
    } catch (error) {
      console.error("Error liking comment:", error);
    }
  };

  if (loading || !film) {
    return (
      <div className="bg-white min-h-screen pt-14 flex items-center justify-center">
        <div className="text-gray-600">Loading...</div>
      </div>
    );
  }

  const sortedComments = [...comments].sort((a, b) => {
    if (commentSort === 'popular') {
      return b.likes_count - a.likes_count;
    }
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  });

  return (
    <div className={`bg-white dark:bg-gray-900 min-h-screen pt-14 ${!theaterMode ? 'lg:pl-60' : ''}`}>
      <SEO title={film.title} description={film.synopsis || film.logline || `Watch ${film.title} on NaijaMation`} ogImage={film.poster_url} ogType="video.movie" />
      <div className={`flex gap-6 ${theaterMode ? 'max-w-full' : ''}`}>
        <div className={`flex-1 px-4 sm:px-6 py-6 ${theaterMode ? 'max-w-full' : 'max-w-6xl'}`}>
          <div className="mb-3">
            <BackButton fallback="/" label="Back" />
          </div>
          <div className={`bg-black rounded-xl overflow-hidden mb-4 relative ${theaterMode ? 'h-screen' : 'aspect-video'}`}>
            {film.video_url ? (
              <EnhancedVideoPlayer
                src={film.video_url}
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
                onClick={() => handleLike('like')}
                className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all ${userLiked
                  ? 'bg-blue-600 text-white hover:bg-blue-700'
                  : 'bg-gray-100 dark:bg-gray-800 hover:bg-blue-50 dark:hover:bg-blue-900/20 text-gray-900 dark:text-white hover:text-blue-600'
                  }`}
              >
                <ThumbsUp className={`w-5 h-5 ${userLiked ? 'fill-current' : ''}`} />
                <span>Like</span>
              </button>
              <button
                onClick={() => handleLike('dislike')}
                className={`flex items-center gap-2 px-3 py-2 rounded-full text-sm font-medium transition-all ${userDisliked
                  ? 'bg-red-600 text-white hover:bg-red-700'
                  : 'bg-gray-100 dark:bg-gray-800 hover:bg-red-50 dark:hover:bg-red-900/20 text-gray-900 dark:text-white hover:text-red-600'
                  }`}
              >
                <ThumbsDown className={`w-5 h-5 ${userDisliked ? 'fill-current' : ''}`} />
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
            <div className="flex flex-wrap gap-3 mb-2 text-sm">
              <span className="font-semibold text-gray-900 dark:text-white">{film.studio_label}</span>
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
                <h4 className="text-sm font-semibold text-gray-900 line-clamp-2 mb-1">
                  {relatedFilm.title}
                </h4>
                <p className="text-xs text-gray-600">{relatedFilm.studio_label}</p>
                <div className="flex items-center gap-1 text-xs text-gray-600 mt-1">
                  <Eye className="w-3 h-3" />
                  <span>{relatedFilm.views?.toLocaleString() || '0'} views</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Report Modal */}
      {showReportModal && (
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
      )}
    </div>
  );
}

