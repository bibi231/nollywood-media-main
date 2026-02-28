import { Link } from 'react-router-dom';
import { Eye, Play, Star } from 'lucide-react';
import { Movie, TVShow } from '../types';
import { WatchlistButton } from './WatchlistButton';
import { LazyImage } from './LazyImage';

interface ContentCardProps {
  content: Movie | TVShow;
  type: 'movie' | 'tv_show';
  onPlayClick: () => void;
}

export function ContentCard({ content, onPlayClick }: ContentCardProps) {
  const views = (content as any).views || 0;
  const formattedViews = views >= 1000 ? `${(views / 1000).toFixed(1)}k` : views.toString();

  return (
    <div className="group cursor-pointer" onClick={onPlayClick}>
      {/* Thumbnail */}
      <div className="relative aspect-video bg-gray-800 rounded-xl overflow-hidden mb-3 ring-1 ring-white/5 hover:ring-red-500/30 transition-all duration-300 hover-lift">
        <LazyImage
          src={content.poster_url}
          alt={content.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
        />

        {/* Duration badge */}
        <div className="absolute bottom-2 right-2 bg-black/80 backdrop-blur-sm text-white text-[11px] font-medium px-1.5 py-0.5 rounded-md">
          {(content as any).runtime_min}m
        </div>

        {/* Hover overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          {/* Play button */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="bg-red-600 p-3.5 rounded-full transform scale-0 group-hover:scale-100 transition-transform duration-300 shadow-lg shadow-red-600/30">
              <Play className="w-6 h-6 text-white fill-white" />
            </div>
          </div>

          {/* Bottom info on hover */}
          <div className="absolute bottom-0 left-0 right-0 p-3">
            <div className="flex items-center gap-2 text-[11px] text-gray-300">
              {content.genres && content.genres.length > 0 && (
                <>
                  {content.genres.slice(0, 2).map((g) => (
                    <span key={g} className="px-1.5 py-0.5 bg-white/10 rounded text-[10px]">{g}</span>
                  ))}
                </>
              )}
            </div>
          </div>
        </div>

        {/* Watchlist button */}
        <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-all duration-300 transform scale-75 group-hover:scale-100">
          <WatchlistButton filmId={content.id} size="sm" />
        </div>

        {/* Rating badge */}
        <div className="absolute top-2 left-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          <span className="flex items-center gap-1 px-2 py-1 bg-black/70 backdrop-blur-sm text-white text-[11px] rounded-md font-semibold">
            <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
            {content.rating}
          </span>
        </div>
      </div>

      {/* Info */}
      <div className="px-0.5">
        <h3 className="font-semibold text-gray-100 dark:text-gray-100 line-clamp-2 mb-1 text-sm group-hover:text-red-400 transition-colors duration-200">
          {content.title}
        </h3>
        <p className="text-xs text-gray-500 mb-1.5 truncate">
          <Link
            to={`/creator/${(content as any).user_id || (content as any).studio_label}`}
            onClick={(e) => e.stopPropagation()}
            className="hover:text-red-400 hover:underline transition-colors"
          >
            {(content as any).studio_label}
          </Link>
        </p>
        <div className="flex items-center gap-2 text-[11px] text-gray-500">
          <div className="flex items-center gap-1">
            <Eye className="w-3 h-3" />
            <span>{formattedViews}</span>
          </div>
          <span className="text-gray-700">·</span>
          <span>{content.release_year}</span>
          {content.genres && content.genres.length > 0 && (
            <>
              <span className="text-gray-700">·</span>
              <span className="text-gray-400">{content.genres[0]}</span>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
