import React, { createContext, useContext, useEffect, useState } from "react";
import { Film, FilterSpec, SortKey, filterFilms } from "../lib/catalog";
import { supabase } from "../lib/supabase";
import { MOCK_FILMS } from "../lib/mockData";

interface CatalogContextValue {
  films: Film[];
  filmCatalog: Film[];
  loading: boolean;
  error: Error | null;
  filter: (where: FilterSpec, sort?: SortKey) => Film[];
  refreshFilms: () => Promise<void>;
}

const CatalogContext = createContext<CatalogContextValue | null>(null);

export function CatalogProvider({ children }: { children: React.ReactNode }) {
  const [films, setFilms] = useState<Film[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const loadFilms = async () => {
    try {
      setLoading(true);
      const { data, error: dbError } = await supabase
        .from('films')
        .select('*')
        .in('status', ['published', 'unlisted'])
        .order('created_at', { ascending: false });

      if (dbError) throw dbError;

      if (!data || data.length === 0) {
        console.warn('⚠️ No films found in database, using mock data fallback.');
        setFilms(MOCK_FILMS);
      } else {
        const filmsData: Film[] = data.map(film => ({
          id: film.id,
          title: film.title,
          poster_url: film.poster_url || '',
          thumbnail_url: film.thumbnail_url || film.poster_url || '',
          video_url: film.video_url || '',
          logline: film.logline,
          synopsis: film.synopsis || film.logline,
          genre: film.genre,
          release_year: film.release_year,
          runtime_min: film.runtime_min,
          rating: film.rating,
          setting_region: film.setting_region,
          languages_audio: film.languages_audio,
          languages_subtitles: film.languages_subtitles,
          cast_members: film.cast_members,
          director: film.director,
          studio_label: film.studio_label,
          tags: film.tags,
          views: film.views || 0,
          created_at: film.created_at,
        }));
        setFilms(filmsData);
      }
      setLoading(false);
    } catch (err: any) {
      console.error('Error loading films, using mock data fallback:', err);
      setFilms(MOCK_FILMS);
      setError(null); // Clear error as we have fallback data
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFilms();

    // Poll for changes every 30 seconds (replaces Supabase realtime)
    const interval = setInterval(() => {
      loadFilms();
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  const filter = (where: FilterSpec, sort?: SortKey): Film[] => {
    return filterFilms(films, where, sort);
  };

  return (
    <CatalogContext.Provider value={{ films, filmCatalog: films, loading, error, filter, refreshFilms: loadFilms }}>
      {children}
    </CatalogContext.Provider>
  );
}

export function useCatalog(): CatalogContextValue {
  const context = useContext(CatalogContext);
  if (!context) {
    throw new Error("useCatalog must be used within CatalogProvider");
  }
  return context;
}
