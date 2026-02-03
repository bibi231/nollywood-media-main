import { useEffect, useRef, useState } from 'react';
import {
  Play, Pause, Volume2, VolumeX, Maximize, Minimize,
  Settings, SkipForward, Rewind, PictureInPicture
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';

interface EnhancedVideoPlayerProps {
  src: string;
  poster?: string;
  filmId: string;
  onTimeUpdate?: (position: number, duration: number) => void;
  onComplete?: () => void;
}

export function EnhancedVideoPlayer({
  src,
  poster,
  filmId,
  onTimeUpdate,
  onComplete
}: EnhancedVideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const { user } = useAuth();

  const [playing, setPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [muted, setMuted] = useState(false);
  const [fullscreen, setFullscreen] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [showSettings, setShowSettings] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [quality, setQuality] = useState('auto');
  const [buffered, setBuffered] = useState(0);
  const [sessionId] = useState(() => crypto.randomUUID());

  const controlsTimeoutRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    loadSavedPosition();
  }, [filmId, user]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleTimeUpdate = () => {
      const time = video.currentTime;
      const dur = video.duration || 0;
      setCurrentTime(time);
      setDuration(dur);

      if (dur > 0) {
        setBuffered((video.buffered.length > 0 ? video.buffered.end(video.buffered.length - 1) : 0) / dur * 100);
      }

      if (user && time > 0 && time % 5 < 0.5) {
        saveProgress(time, dur);
      }

      if (onTimeUpdate) {
        onTimeUpdate(time, dur);
      }
    };

    const handleEnded = () => {
      setPlaying(false);
      if (user) {
        trackEvent('complete', video.currentTime);
      }
      if (onComplete) {
        onComplete();
      }
    };

    const handlePlay = () => {
      setPlaying(true);
      if (user && video.currentTime < 1) {
        trackEvent('play', 0);
      }
    };

    const handlePause = () => {
      setPlaying(false);
      if (user) {
        trackEvent('pause', video.currentTime);
      }
    };

    video.addEventListener('timeupdate', handleTimeUpdate);
    video.addEventListener('ended', handleEnded);
    video.addEventListener('play', handlePlay);
    video.addEventListener('pause', handlePause);

    return () => {
      video.removeEventListener('timeupdate', handleTimeUpdate);
      video.removeEventListener('ended', handleEnded);
      video.removeEventListener('play', handlePlay);
      video.removeEventListener('pause', handlePause);
    };
  }, [user, filmId, onTimeUpdate, onComplete]);

  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (!videoRef.current) return;

      switch (e.key) {
        case ' ':
        case 'k':
          e.preventDefault();
          togglePlay();
          break;
        case 'ArrowLeft':
          e.preventDefault();
          skip(-10);
          break;
        case 'ArrowRight':
          e.preventDefault();
          skip(10);
          break;
        case 'ArrowUp':
          e.preventDefault();
          changeVolume(0.1);
          break;
        case 'ArrowDown':
          e.preventDefault();
          changeVolume(-0.1);
          break;
        case 'f':
          e.preventDefault();
          toggleFullscreen();
          break;
        case 'm':
          e.preventDefault();
          toggleMute();
          break;
      }
    };

    document.addEventListener('keydown', handleKeyPress);
    return () => document.removeEventListener('keydown', handleKeyPress);
  }, []);

  const loadSavedPosition = async () => {
    if (!user || !filmId) return;

    try {
      const { data } = await supabase
        .from('watch_history')
        .select('position_sec')
        .eq('user_id', user.id)
        .eq('film_id', filmId)
        .maybeSingle();

      if (data && data.position_sec > 5 && videoRef.current) {
        videoRef.current.currentTime = data.position_sec;
      }
    } catch (error) {
      console.error('Error loading position:', error);
    }
  };

  const saveProgress = async (position: number, duration: number) => {
    if (!user || !filmId) return;

    try {
      await supabase
        .from('watch_history')
        .upsert({
          user_id: user.id,
          film_id: filmId,
          position_sec: Math.floor(position),
          duration_sec: Math.floor(duration),
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'user_id,film_id'
        });
    } catch (error) {
      console.error('Error saving progress:', error);
    }
  };

  const trackEvent = async (eventType: string, position: number) => {
    if (!user || !filmId) return;

    try {
      await supabase.from('playback_events').insert({
        user_id: user.id,
        film_id: filmId,
        session_id: sessionId,
        event_type: eventType,
        position_sec: Math.floor(position),
        duration_sec: Math.floor(duration),
        quality,
        device_type: /Mobile|Android|iPhone/i.test(navigator.userAgent) ? 'mobile' : 'desktop',
        browser: navigator.userAgent.split(' ').pop() || 'unknown',
        meta: { playback_rate: playbackRate }
      });
    } catch (error) {
      console.error('Error tracking event:', error);
    }
  };

  const togglePlay = () => {
    if (!videoRef.current) return;
    if (playing) {
      videoRef.current.pause();
    } else {
      videoRef.current.play();
    }
  };

  const skip = (seconds: number) => {
    if (!videoRef.current) return;
    videoRef.current.currentTime += seconds;
  };

  const changeVolume = (delta: number) => {
    if (!videoRef.current) return;
    const newVolume = Math.max(0, Math.min(1, volume + delta));
    setVolume(newVolume);
    videoRef.current.volume = newVolume;
    if (newVolume > 0) setMuted(false);
  };

  const toggleMute = () => {
    if (!videoRef.current) return;
    videoRef.current.muted = !muted;
    setMuted(!muted);
  };

  const toggleFullscreen = () => {
    if (!containerRef.current) return;

    if (!fullscreen) {
      if (containerRef.current.requestFullscreen) {
        containerRef.current.requestFullscreen();
      }
      setFullscreen(true);
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      }
      setFullscreen(false);
    }
  };

  const enterPiP = async () => {
    if (!videoRef.current || !document.pictureInPictureEnabled) return;
    try {
      await videoRef.current.requestPictureInPicture();
    } catch (error) {
      console.error('PiP error:', error);
    }
  };

  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!videoRef.current) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const pos = (e.clientX - rect.left) / rect.width;
    videoRef.current.currentTime = pos * duration;
  };

  const handleMouseMove = () => {
    setShowControls(true);
    if (controlsTimeoutRef.current) {
      clearTimeout(controlsTimeoutRef.current);
    }
    controlsTimeoutRef.current = setTimeout(() => {
      if (playing) setShowControls(false);
    }, 3000);
  };

  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);
    if (h > 0) {
      return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    }
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const speeds = [0.5, 0.75, 1, 1.25, 1.5, 2];

  return (
    <div
      ref={containerRef}
      className="relative w-full h-full bg-black group"
      onMouseMove={handleMouseMove}
      onMouseLeave={() => playing && setShowControls(false)}
    >
      <video
        ref={videoRef}
        src={src}
        poster={poster}
        className="w-full h-full"
        onClick={togglePlay}
      />

      <div
        className={`absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-transparent transition-opacity duration-300 ${
          showControls || !playing ? 'opacity-100' : 'opacity-0'
        }`}
      >
        <div className="absolute bottom-0 left-0 right-0 p-4 space-y-2">
          <div
            className="h-1 bg-gray-600 rounded-full cursor-pointer group relative"
            onClick={handleSeek}
          >
            <div
              className="h-full bg-gray-400 rounded-full absolute"
              style={{ width: `${buffered}%` }}
            />
            <div
              className="h-full bg-red-600 rounded-full absolute"
              style={{ width: `${(currentTime / duration) * 100}%` }}
            />
            <div
              className="absolute w-3 h-3 bg-red-600 rounded-full -top-1 transform -translate-x-1/2"
              style={{ left: `${(currentTime / duration) * 100}%` }}
            />
          </div>

          <div className="flex items-center justify-between text-white">
            <div className="flex items-center gap-2">
              <button onClick={togglePlay} className="p-2 hover:bg-white/20 rounded">
                {playing ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
              </button>

              <button onClick={() => skip(-10)} className="p-2 hover:bg-white/20 rounded">
                <Rewind className="w-4 h-4" />
              </button>

              <button onClick={() => skip(10)} className="p-2 hover:bg-white/20 rounded">
                <SkipForward className="w-4 h-4" />
              </button>

              <div className="flex items-center gap-2 group/volume">
                <button onClick={toggleMute} className="p-2 hover:bg-white/20 rounded">
                  {muted || volume === 0 ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                </button>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.1"
                  value={volume}
                  onChange={(e) => {
                    const val = parseFloat(e.target.value);
                    setVolume(val);
                    if (videoRef.current) videoRef.current.volume = val;
                    if (val > 0) setMuted(false);
                  }}
                  className="w-0 group-hover/volume:w-20 transition-all"
                />
              </div>

              <span className="text-sm">
                {formatTime(currentTime)} / {formatTime(duration)}
              </span>
            </div>

            <div className="flex items-center gap-2 relative">
              <button
                onClick={() => setShowSettings(!showSettings)}
                className="p-2 hover:bg-white/20 rounded"
              >
                <Settings className="w-4 h-4" />
              </button>

              {showSettings && (
                <div className="absolute bottom-12 right-0 bg-gray-900 rounded-lg shadow-xl p-2 space-y-1 min-w-[150px]">
                  <div className="text-xs font-semibold text-gray-400 px-2 py-1">Playback Speed</div>
                  {speeds.map((speed) => (
                    <button
                      key={speed}
                      onClick={() => {
                        setPlaybackRate(speed);
                        if (videoRef.current) videoRef.current.playbackRate = speed;
                        setShowSettings(false);
                      }}
                      className={`w-full text-left px-2 py-1 rounded hover:bg-gray-800 text-sm ${
                        playbackRate === speed ? 'text-red-500' : 'text-white'
                      }`}
                    >
                      {speed}x {speed === 1 && '(Normal)'}
                    </button>
                  ))}
                </div>
              )}

              {document.pictureInPictureEnabled && (
                <button onClick={enterPiP} className="p-2 hover:bg-white/20 rounded">
                  <PictureInPicture className="w-4 h-4" />
                </button>
              )}

              <button onClick={toggleFullscreen} className="p-2 hover:bg-white/20 rounded">
                {fullscreen ? <Minimize className="w-4 h-4" /> : <Maximize className="w-4 h-4" />}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
