import { useState } from 'react';
import { Play, Info, X } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Movie } from '../types';
import { WatchlistButton } from './WatchlistButton';

interface HeroProps {
  movie: Movie;
  onPlayClick: () => void;
  onMoreInfoClick?: () => void;
}

export function Hero({ movie, onPlayClick, onMoreInfoClick }: HeroProps) {
  const [showModal, setShowModal] = useState(false);
  return (
    <div className="relative h-screen">
      <div className="absolute inset-0">
        <img
          src={movie.backdrop_url}
          alt={movie.title}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/50 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-transparent to-transparent" />
      </div>

      <div className="relative container mx-auto px-4 h-full flex items-center">
        <div className="max-w-2xl space-y-6">
          <div className="flex items-center space-x-3">
            <span className="px-3 py-1 bg-red-600 text-white text-sm font-semibold rounded">
              Featured
            </span>
            <div className="flex items-center space-x-2 text-slate-300">
              {movie.genres.slice(0, 3).map((genre, index) => (
                <span key={genre}>
                  <Link to={`/genre/${encodeURIComponent(genre)}`} className="hover:text-white hover:underline transition-colors">
                    {genre}
                  </Link>
                  {index < Math.min(movie.genres.length, 3) - 1 && (
                    <span className="mx-2">•</span>
                  )}
                </span>
              ))}
            </div>
          </div>

          <h1 className="text-6xl font-bold text-white leading-tight">
            {movie.title}
          </h1>

          <div className="flex items-center space-x-4 text-slate-300">
            <div className="flex items-center space-x-1">
              <span className="text-yellow-400 text-lg">★</span>
              <span className="font-semibold text-white">{movie.rating}</span>
            </div>
            <span>•</span>
            <span>{movie.release_year}</span>
            <span>•</span>
            <span>{movie.duration} min</span>
          </div>

          <p className="text-lg text-slate-300 leading-relaxed max-w-xl">
            {movie.description}
          </p>

          <div className="flex items-center space-x-4">
            <button
              onClick={onPlayClick}
              className="flex items-center space-x-2 px-8 py-3 bg-white text-slate-950 rounded-lg font-semibold hover:bg-slate-200 transition-colors"
            >
              <Play className="w-5 h-5 fill-current" />
              <span>Play Now</span>
            </button>

            <button
              onClick={() => setShowModal(true)}
              className="flex items-center space-x-2 px-8 py-3 bg-slate-800/80 text-white rounded-lg font-semibold hover:bg-slate-700 transition-colors backdrop-blur-sm"
            >
              <Info className="w-5 h-5" />
              <span>More Info</span>
            </button>

            <WatchlistButton filmId={movie.id} size="lg" />
          </div>
        </div>
      </div>

      {showModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
          onClick={() => setShowModal(false)}
        >
          <div
            className="relative bg-slate-900 rounded-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setShowModal(false)}
              className="absolute top-4 right-4 p-2 bg-slate-800 hover:bg-slate-700 rounded-full transition-colors z-10"
            >
              <X className="w-6 h-6 text-white" />
            </button>

            <div className="relative h-64 sm:h-80">
              <img
                src={movie.backdrop_url}
                alt={movie.title}
                className="w-full h-full object-cover rounded-t-xl"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-900 to-transparent" />
            </div>

            <div className="p-6 sm:p-8 -mt-20 relative">
              <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
                {movie.title}
              </h2>

              <div className="flex flex-wrap items-center gap-3 mb-6 text-slate-300">
                <div className="flex items-center space-x-1">
                  <span className="text-yellow-400 text-lg">★</span>
                  <span className="font-semibold text-white">{movie.rating}</span>
                </div>
                <span>•</span>
                <span>{movie.release_year}</span>
                <span>•</span>
                <span>{movie.duration} min</span>
              </div>

              <div className="flex flex-wrap gap-2 mb-6">
                {movie.genres.map((genre) => (
                  <span
                    key={genre}
                    className="px-3 py-1 bg-slate-800 text-slate-300 text-sm rounded-full"
                  >
                    {genre}
                  </span>
                ))}
              </div>

              <div className="mb-6">
                <h3 className="text-lg font-semibold text-white mb-3">Description</h3>
                <p className="text-slate-300 leading-relaxed whitespace-pre-line">
                  {movie.description}
                </p>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowModal(false);
                    onPlayClick();
                  }}
                  className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg font-semibold transition-colors"
                >
                  <Play className="w-5 h-5 fill-white" />
                  Watch Now
                </button>
                <button
                  onClick={() => setShowModal(false)}
                  className="px-6 py-3 bg-slate-800 hover:bg-slate-700 text-white rounded-lg font-semibold transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
