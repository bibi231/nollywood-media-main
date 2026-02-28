import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { SEO } from "../components/SEO";
import { ContentCard } from "../components/ContentCard";
import { BackButton } from "../components/BackButton";
import { useCatalog } from "../context/CatalogProvider";
import { Film } from "../lib/catalog";

const contentTypeLabels: Record<string, string> = {
  film: "Movies",
  series: "TV Series",
  anime: "Anime",
  music: "Music & Concerts",
  audio: "Audio Tracks",
  documentary: "Documentaries",
};

const formatTitle = (text: string) => {
  if (!text) return "";
  return text.charAt(0).toUpperCase() + text.slice(1);
};

export default function ContentTypePage() {
  const { type } = useParams<{ type: string }>();
  const [films, setFilms] = useState<Film[]>([]);
  const navigate = useNavigate();
  const { filmCatalog } = useCatalog();

  const label = type ? contentTypeLabels[type] || type : "Content";

  useEffect(() => {
    if (filmCatalog && type) {
      let filtered: Film[] = [];
      if (type === 'series') {
        filtered = filmCatalog.filter((film) =>
          film.tags?.toLowerCase().includes('series') ||
          film.tags?.toLowerCase().includes('anthology') ||
          film.tags?.toLowerCase().includes('crime')
        );
      } else if (type === 'anime') {
        filtered = filmCatalog.filter((film) =>
          film.tags?.toLowerCase().includes('anime')
        );
      } else if (type === 'music') {
        filtered = filmCatalog.filter((film) =>
          film.tags?.toLowerCase().includes('music') ||
          film.tags?.toLowerCase().includes('concert') ||
          film.tags?.toLowerCase().includes('afrobeat') ||
          film.genre?.toLowerCase().includes('music')
        );
      } else if (type === 'audio') {
        filtered = filmCatalog.filter((film) =>
          film.tags?.toLowerCase().includes('audio') ||
          film.tags?.toLowerCase().includes('podcast') ||
          film.genre?.toLowerCase().includes('audio')
        );
      } else {
        filtered = filmCatalog;
      }
      setFilms(filtered);
    }
  }, [filmCatalog, type]);

  const handlePlayClick = (film: Film) => {
    navigate(`/watch/${film.id}`);
  };

  return (
    <div className="bg-white dark:bg-gray-900 min-h-screen pt-14 lg:pl-60">
      <SEO title={`${formatTitle(type || '')} Content`} description={`Browse all ${formatTitle(type || '')} content on NaijaMation.`} />

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-3">
          <BackButton fallback="/catalog" label="Back to Catalog" />
        </div>
        <h1 className="text-2xl font-semibold text-gray-900 dark:text-white mb-2">{label}</h1>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
          {films.length} {films.length === 1 ? 'video' : 'videos'}
        </p>

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
          <div className="text-center py-20">
            <p className="text-gray-600 dark:text-gray-400">No {label.toLowerCase()} available</p>
          </div>
        )}
      </div>
    </div>
  );
}
