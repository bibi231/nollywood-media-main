import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Search, Filter, SlidersHorizontal } from "lucide-react";
import { Film } from "../lib/catalog";
import { useCatalog } from "../context/CatalogProvider";
import { tokenizeCSVish } from "../lib/catalog";
import { ContentCard } from "./ContentCard";

export default function Catalog() {
  const { films, loading } = useCatalog();
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [filterGenre, setFilterGenre] = useState<string>("all");
  const [filterRegion, setFilterRegion] = useState<string>("all");
  const [filterLanguage, setFilterLanguage] = useState<string>("all");
  const [filterRating, setFilterRating] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("newest");
  const [showFilters, setShowFilters] = useState(false);

  const genres = useMemo(() => {
    const g = new Set<string>();
    films.forEach((f) => g.add(f.genre));
    return ["all", ...Array.from(g).sort()];
  }, [films]);

  const regions = useMemo(() => {
    const r = new Set<string>();
    films.forEach((f) => r.add(f.setting_region));
    return ["all", ...Array.from(r).sort()];
  }, [films]);

  const languages = useMemo(() => {
    const l = new Set<string>();
    films.forEach((f) => {
      tokenizeCSVish(f.languages_audio).forEach((lang) => l.add(lang));
    });
    return ["all", ...Array.from(l).sort()];
  }, [films]);

  const ratings = useMemo(() => {
    const r = new Set<string>();
    films.forEach((f) => r.add(f.rating));
    return ["all", ...Array.from(r).sort()];
  }, [films]);

  const filtered = useMemo(() => {
    let result = films.filter((f) => {
      const matchSearch = search
        ? f.title.toLowerCase().includes(search.toLowerCase()) ||
          f.logline.toLowerCase().includes(search.toLowerCase()) ||
          f.tags?.toLowerCase().includes(search.toLowerCase())
        : true;
      const matchGenre = filterGenre === "all" || f.genre === filterGenre;
      const matchRegion = filterRegion === "all" || f.setting_region === filterRegion;
      const matchLanguage =
        filterLanguage === "all" || f.languages_audio.includes(filterLanguage);
      const matchRating = filterRating === "all" || f.rating === filterRating;
      return matchSearch && matchGenre && matchRegion && matchLanguage && matchRating;
    });

    if (sortBy === "newest") {
      result.sort((a, b) => b.release_year - a.release_year);
    } else if (sortBy === "alpha") {
      result.sort((a, b) => a.title.localeCompare(b.title));
    } else if (sortBy === "runtime") {
      result.sort((a, b) => b.runtime_min - a.runtime_min);
    }

    return result;
  }, [films, search, filterGenre, filterRegion, filterLanguage, filterRating, sortBy]);

  const handlePlayClick = (film: Film) => {
    navigate(`/watch/${film.id}`);
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-white pt-14 pl-60">
        <div className="text-lg text-gray-600">Loading catalog...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white pt-14 pl-60">
      <div className="px-6 py-6">
        <div className="mb-6">
          <h1 className="text-2xl font-semibold text-gray-900 mb-4">Browse Catalog</h1>

          <div className="flex items-center gap-3 mb-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search titles..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full rounded-lg border border-gray-300 bg-white py-2 pl-10 pr-4 text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:outline-none"
              />
            </div>

            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-sm font-medium text-gray-700"
            >
              <SlidersHorizontal className="w-4 h-4" />
              Filters
            </button>

            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 bg-white focus:border-blue-500 focus:outline-none"
            >
              <option value="newest">Newest</option>
              <option value="alpha">A–Z</option>
              <option value="runtime">Longest</option>
            </select>
          </div>

          {showFilters && (
            <div className="bg-gray-50 rounded-lg p-4 mb-4 border border-gray-200">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Genre</label>
                  <select
                    value={filterGenre}
                    onChange={(e) => setFilterGenre(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 bg-white focus:border-blue-500 focus:outline-none"
                  >
                    {genres.map((g) => (
                      <option key={g} value={g}>
                        {g === "all" ? "All Genres" : g}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Region</label>
                  <select
                    value={filterRegion}
                    onChange={(e) => setFilterRegion(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 bg-white focus:border-blue-500 focus:outline-none"
                  >
                    {regions.map((r) => (
                      <option key={r} value={r}>
                        {r === "all" ? "All Regions" : r}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Language</label>
                  <select
                    value={filterLanguage}
                    onChange={(e) => setFilterLanguage(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 bg-white focus:border-blue-500 focus:outline-none"
                  >
                    {languages.map((l) => (
                      <option key={l} value={l}>
                        {l === "all" ? "All Languages" : l}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Rating</label>
                  <select
                    value={filterRating}
                    onChange={(e) => setFilterRating(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 bg-white focus:border-blue-500 focus:outline-none"
                  >
                    {ratings.map((r) => (
                      <option key={r} value={r}>
                        {r === "all" ? "All Ratings" : r}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          )}

          <div className="text-sm text-gray-600">
            {filtered.length} {filtered.length === 1 ? 'result' : 'results'}
          </div>
        </div>

        {filtered.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-x-4 gap-y-8">
            {filtered.map((film) => (
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
            <p className="text-gray-600">No films match your filters</p>
            <p className="text-sm text-gray-500 mt-2">Try adjusting your search or filters</p>
          </div>
        )}
      </div>
    </div>
  );
}
