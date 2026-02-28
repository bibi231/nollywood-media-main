import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ContentCard } from "../components/ContentCard";
import { BackButton } from "../components/BackButton";
import { useCatalog } from "../context/CatalogProvider";
import { Film } from "../lib/catalog";
import { Film as FilmIcon } from "lucide-react";
import { SEO } from "../components/SEO";

// Define accent colors for standard genres
const GENRE_COLORS: Record<string, string> = {
  Action: "from-orange-500 to-red-600 shadow-orange-500/50",
  Drama: "from-purple-500 to-indigo-600 shadow-purple-500/50",
  Comedy: "from-amber-400 to-yellow-600 shadow-amber-500/50",
  Romance: "from-pink-500 to-rose-600 shadow-pink-500/50",
  Horror: "from-emerald-500 to-teal-700 shadow-emerald-500/50",
  Music: "from-blue-500 to-cyan-600 shadow-blue-500/50",
};

export default function GenrePage() {
  const { genre } = useParams<{ genre: string }>();
  const [films, setFilms] = useState<Film[]>([]);
  const navigate = useNavigate();
  const { filmCatalog } = useCatalog();

  const formattedGenre = genre ? genre.charAt(0).toUpperCase() + genre.slice(1) : "Unknown";
  const heroColorClass = GENRE_COLORS[formattedGenre] || "from-gray-600 to-gray-900 shadow-gray-500/50";

  useEffect(() => {
    if (filmCatalog && genre) {
      const filtered = filmCatalog.filter(
        (film) => film.genre.toLowerCase() === genre.toLowerCase()
      );
      setFilms(filtered);
    }
  }, [filmCatalog, genre]);

  const handlePlayClick = (film: Film) => {
    navigate(`/watch/${film.id}`);
  };

  const featuredFilm = films[0];

  return (
    <div className="bg-white dark:bg-[#0a0a0a] min-h-screen pt-14 lg:pl-60">
      <SEO title={`${formattedGenre} Movies & Shows`} description={`Browse all ${formattedGenre} content on NaijaMation.`} />

      {/* Dynamic Cinematic Hero */}
      <div className="relative h-[40vh] min-h-[300px] w-full overflow-hidden bg-gray-900">
        {featuredFilm && (
          <img
            src={featuredFilm.poster_url || '/placeholder.jpg'}
            className="absolute inset-0 w-full h-full object-cover opacity-30"
          />
        )}
        <div className={`absolute inset-0 bg-gradient-to-t from-[#0a0a0a] via-[#0a0a0a]/80 to-transparent`} />
        <div className={`absolute inset-0 bg-gradient-to-r ${heroColorClass.split(' ')[0]} ${heroColorClass.split(' ')[1]} opacity-20`} />

        <div className="absolute inset-0 flex flex-col justify-end p-8 lg:p-12 max-w-7xl mx-auto">
          <div className="mb-6">
            <BackButton fallback="/catalog" label="Back" />
          </div>
          <div className="flex items-center gap-4">
            <div className={`p-4 rounded-2xl bg-gradient-to-br ${heroColorClass} bg-opacity-20 backdrop-blur-md border border-white/10`}>
              <FilmIcon className="h-8 w-8 text-white" />
            </div>
            <div>
              <h1 className="text-4xl lg:text-5xl font-black text-white tracking-tight drop-shadow-md">
                {formattedGenre}
              </h1>
              <p className="text-gray-300 mt-2 font-medium">
                {films.length} {films.length === 1 ? 'title' : 'titles'} available
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {films.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-x-4 gap-y-8">
            {films.map((film) => (
              <ContentCard
                key={film.id}
                content={{
                  ...film,
                  genres: [film.genre],
                  poster_url: film.poster_url || '/placeholder.jpg'
                } as any}
                type="movie"
                onPlayClick={() => handlePlayClick(film)}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-20 bg-gray-50 dark:bg-gray-800/30 rounded-2xl border border-gray-200 dark:border-gray-800">
            <FilmIcon className="h-16 w-16 text-gray-400 mx-auto mb-4 opacity-50" />
            <p className="text-gray-900 dark:text-gray-300 text-lg font-medium">No {formattedGenre} films available right now</p>
            <p className="text-gray-500 mt-2">Check back later for new releases.</p>
          </div>
        )}
      </div>
    </div>
  );
}
