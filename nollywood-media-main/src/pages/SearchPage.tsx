import { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { ContentCard } from "../components/ContentCard";
import { BackButton } from "../components/BackButton";
import { AdSpace } from "../components/AdSpace";
import { Film } from "../lib/catalog";
import { SEO } from '../components/SEO';
import { Filter } from "lucide-react";

import { useCatalog } from "../context/CatalogProvider";

export default function SearchPage() {
  const [searchParams] = useSearchParams();
  const query = searchParams.get("q") || "";
  const [films, setFilms] = useState<Film[]>([]);
  const navigate = useNavigate();
  const { filmCatalog } = useCatalog();

  const [filterYear, setFilterYear] = useState<string>('');
  const [filterRating, setFilterRating] = useState<string>('');
  const [filterDuration, setFilterDuration] = useState<string>('');
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    if (filmCatalog) {
      const searchLower = query.toLowerCase();
      let filtered = filmCatalog;

      // 1. Keyword search (if present)
      if (query) {
        filtered = filtered.filter(
          (film) =>
            film.title?.toLowerCase().includes(searchLower) ||
            film.logline?.toLowerCase().includes(searchLower) ||
            film.genre?.toLowerCase().includes(searchLower) ||
            film.director?.toLowerCase().includes(searchLower) ||
            film.cast_members?.toLowerCase().includes(searchLower) ||
            film.tags?.toLowerCase().includes(searchLower) ||
            film.studio_label?.toLowerCase().includes(searchLower)
        );
      }

      // 2. Year filter
      if (filterYear) {
        filtered = filtered.filter(f => f.release_year?.toString() === filterYear);
      }

      // 3. Rating filter
      if (filterRating) {
        filtered = filtered.filter(f => f.rating === filterRating);
      }

      // 4. Duration filter
      if (filterDuration) {
        filtered = filtered.filter(f => {
          const m = f.runtime_min || 0;
          if (filterDuration === 'short') return m < 30;
          if (filterDuration === 'medium') return m >= 30 && m <= 90;
          if (filterDuration === 'long') return m > 90;
          return true;
        });
      }

      setFilms(filtered);
    }
  }, [filmCatalog, query, filterYear, filterRating, filterDuration]);

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
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg text-gray-700 dark:text-gray-300 font-medium transition-colors"
          >
            <Filter className="w-4 h-4" /> Filters
          </button>
        </div>

        {showFilters && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 mb-6 bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-gray-200 dark:border-gray-800">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 flex items-center gap-2">Release Year</label>
              <select
                value={filterYear}
                onChange={(e) => setFilterYear(e.target.value)}
                className="w-full bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg px-3 py-2 text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-red-500"
              >
                <option value="">All Years</option>
                <option value="2024">2024</option>
                <option value="2023">2023</option>
                <option value="2022">2022</option>
                <option value="2021">2021</option>
                <option value="2020">2020</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 flex items-center gap-2">Rating</label>
              <select
                value={filterRating}
                onChange={(e) => setFilterRating(e.target.value)}
                className="w-full bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg px-3 py-2 text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-red-500"
              >
                <option value="">All Ratings</option>
                <option value="G">G</option>
                <option value="PG">PG</option>
                <option value="PG-13">PG-13</option>
                <option value="R">R</option>
                <option value="NC-17">NC-17</option>
                <option value="NR">NR</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 flex items-center gap-2">Duration</label>
              <select
                value={filterDuration}
                onChange={(e) => setFilterDuration(e.target.value)}
                className="w-full bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg px-3 py-2 text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-red-500"
              >
                <option value="">Any Length</option>
                <option value="short">Short (&lt; 30 min)</option>
                <option value="medium">Medium (30 - 90 min)</option>
                <option value="long">Long (&gt; 90 min)</option>
              </select>
            </div>
          </div>
        )}

        <div className="mb-6">
          <AdSpace variant="leaderboard" />
        </div>

        {films.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-x-4 gap-y-8">
            {films.map((film) => (
              <ContentCard
                key={film.id}
                content={{
                  ...(film as any),
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
