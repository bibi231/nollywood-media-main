import { useNavigate } from 'react-router-dom';
import { Play } from 'lucide-react';

interface Film {
  id: string;
  title: string;
  poster_url?: string;
  logline?: string;
  genre?: string;
  release_year?: number;
  rating?: string;
}

interface FilmRowProps {
  title: string;
  films: Film[];
  showRank?: boolean;
}

export function FilmRow({ title, films, showRank = false }: FilmRowProps) {
  const navigate = useNavigate();

  if (films.length === 0) return null;

  return (
    <div className="mb-8 px-4 sm:px-6 lg:px-8">
      <h2 className="mb-4 text-2xl font-bold text-white">{title}</h2>
      <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-thin scrollbar-track-slate-900 scrollbar-thumb-slate-700">
        {films.map((film, index) => (
          <div
            key={film.id}
            className="relative flex-shrink-0 w-48 group cursor-pointer"
            onClick={() => navigate(`/watch/${film.id}`)}
          >
            {showRank && (
              <div className="absolute top-0 left-0 z-10 w-12 h-12 flex items-center justify-center">
                <span className="text-6xl font-bold text-white drop-shadow-[0_2px_8px_rgba(0,0,0,0.8)]">
                  {index + 1}
                </span>
              </div>
            )}

            <div className="relative aspect-[2/3] overflow-hidden rounded-lg bg-gray-800">
              {film.poster_url ? (
                <img
                  src={film.poster_url}
                  alt={film.title}
                  className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-110"
                />
              ) : (
                <div className="h-full w-full flex items-center justify-center bg-gray-700">
                  <span className="text-gray-500">No Image</span>
                </div>
              )}

              <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <Play className="h-16 w-16 text-white" />
              </div>
            </div>

            <div className="mt-2">
              <h3 className="text-sm font-semibold text-white truncate group-hover:text-red-600 transition-colors">
                {film.title}
              </h3>
              {film.genre && film.release_year && (
                <p className="text-xs text-gray-400 mt-1">
                  {film.genre} • {film.release_year}
                </p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
