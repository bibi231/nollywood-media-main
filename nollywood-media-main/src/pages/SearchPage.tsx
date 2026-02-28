import { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { ContentCard } from "../components/ContentCard";
import { BackButton } from "../components/BackButton";
import { AdSpace } from "../components/AdSpace";
import { supabase } from '../lib/supabase';
import { Film } from "../lib/catalog";
import { SEO } from '../components/SEO';

import { useCatalog } from "../context/CatalogProvider";

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
          film.director?.toLowerCase().includes(searchLower) ||
          film.cast_members?.toLowerCase().includes(searchLower) ||
          film.tags?.toLowerCase().includes(searchLower) ||
          film.studio_label?.toLowerCase().includes(searchLower)
      );
      setFilms(filtered);
    }
  }, [filmCatalog, query]);
  const handlePlayClick = (film: Film) => {
    navigate(`/watch/${film.id}`);
  };

  return (
    <div className="bg-white dark:bg-gray-900 min-h-screen pt-14 lg:pl-60">
      <SEO title={`Search Results for "${query}"`} description="Search for films and series on NaijaMation." />

      <div className="px-6 py-6">
        <div className="mb-3">
          <BackButton fallback="/catalog" label="Back to Catalog" />
        </div>
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-xl font-semibold text-gray-900 dark:text-white">
              Search results for "{query}"
            </h1>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              {films.length} {films.length === 1 ? 'result' : 'results'}
            </p>
          </div>
        </div>

        <div className="mb-6">
          <AdSpace variant="leaderboard" />
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
            <p className="text-gray-600 dark:text-gray-400">No results found for "{query}"</p>
            <p className="text-sm text-gray-500 mt-2">Try different keywords</p>
          </div>
        )}
      </div>
    </div>
  );
}
