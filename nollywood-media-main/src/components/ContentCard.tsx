import { Clock, Eye, Play } from 'lucide-react';
import { Movie, TVShow } from '../types';
import { WatchlistButton } from './WatchlistButton';
import { LazyImage } from './LazyImage';

interface ContentCardProps {
  content: Movie | TVShow;
  type: 'movie' | 'tv_show';
  onPlayClick: () => void;
}

export function ContentCard({ content, type, onPlayClick }: ContentCardProps) {
  return (
    <div className="group cursor-pointer" onClick={onPlayClick}>
      <div className="relative aspect-video bg-gray-200 rounded-xl overflow-hidden mb-3 shadow-sm hover:shadow-md transition-all duration-300">
        <LazyImage
          src={content.poster_url}
          alt={content.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
        />

        <div className="absolute bottom-1 right-1 bg-black/80 text-white text-xs px-1.5 py-0.5 rounded">
          {content.runtime_min}m
        </div>

        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
          <div className="bg-red-600 p-3 rounded-full transform scale-0 group-hover:scale-100 transition-transform duration-300">
            <Play className="w-6 h-6 text-white fill-white" />
          </div>
        </div>

        <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-all duration-300 transform scale-75 group-hover:scale-100">
          <WatchlistButton filmId={content.id} size="sm" />
        </div>

        <div className="absolute top-2 left-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          <span className="px-2 py-1 bg-black/80 text-white text-xs rounded font-medium">
            {content.rating}
          </span>
        </div>
      </div>

      <div className="flex gap-3">
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-gray-900 line-clamp-2 mb-1 text-sm group-hover:text-red-600 transition-colors">
            {content.title}
          </h3>
          <p className="text-xs text-gray-600 mb-1">{content.studio_label}</p>
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <div className="flex items-center gap-1">
              <Eye className="w-3 h-3" />
              <span>{(content as any).views?.toLocaleString() || '0'}</span>
            </div>
            <span>•</span>
            <span>{content.release_year}</span>
            {content.genres && content.genres.length > 0 && (
              <>
                <span>•</span>
                <span>{content.genres[0]}</span>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
