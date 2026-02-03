import { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { ContentCard } from "../components/ContentCard";
import { useCatalog } from "../context/CatalogProvider";
import { Film } from "../lib/catalog";
import { Filter } from "lucide-react";

export default function SearchPage() {
  const [searchParams] = useSearchParams();
  const query = searchParams.get("q") || "";
  const [films, setFilms] = useState<Film[]>([]);
  const navigate = useNavigate();
  const { filmCatalog } = useCatalog();

  useEffect(() => {
    if (filmCatalog && query) {
      const searchLower = query.toLowerCase();
      const filtered = filmCatalog.filter(
        (film) =>
          film.title.toLowerCase().includes(searchLower) ||
          film.logline.toLowerCase().includes(searchLower) ||
          film.genre.toLowerCase().includes(searchLower) ||
          film.director?.toLowerCase().includes(searchLower)
      );
      setFilms(filtered);
    }
  }, [filmCatalog, query]);

  const handlePlayClick = (film: Film) => {
    navigate(`/watch/${film.id}`);
  };

  return (
    <div className="bg-white min-h-screen pt-14 pl-60">
      <div className="px-6 py-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-xl font-semibold text-gray-900">
              Search results for "{query}"
            </h1>
            <p className="text-sm text-gray-600 mt-1">
              {films.length} {films.length === 1 ? 'result' : 'results'}
            </p>
          </div>
          <button className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-sm font-medium text-gray-700">
            <Filter className="w-4 h-4" />
            Filters
          </button>
        </div>

        {films.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-x-4 gap-y-8">
            {films.map((film) => (
              <ContentCard
                key={film.id}
                content={{
                  ...film,
                  genres: [film.genre],
                  poster_url: film.poster_url || '/placeholder.jpg'
                }}
                type="movie"
                onPlayClick={() => handlePlayClick(film)}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-20">
            <p className="text-gray-600">No results found for "{query}"</p>
            <p className="text-sm text-gray-500 mt-2">Try different keywords</p>
          </div>
        )}
      </div>
    </div>
  );
}
