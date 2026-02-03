export interface Film {
  id: string;
  title: string;
  poster_url?: string;
  thumbnail_url?: string;
  video_url?: string;
  logline: string;
  synopsis?: string;
  genre: string;
  release_year: number;
  runtime_min: number;
  rating: string;
  setting_region: string;
  languages_audio: string;
  languages_subtitles: string;
  cast_members?: string;
  director?: string;
  studio_label: string;
  tags?: string;
  views?: number;
  created_at?: string;
  poster_prompt?: string;
  thumbnail_prompt?: string;
  trailer_prompt?: string;
  content_type?: string;
  availability_note?: string;
  licensing_note?: string;
}

export type SortKey = "newest" | "az" | "runtime";

export interface FilterSpec {
  q?: string;
  genre?: string;
  region?: string;
  language?: string;
  rating?: string;
  tagsIncludesAny?: string[];
  tagsIncludesAll?: string[];
  yearEq?: number;
  yearGte?: number;
  yearLte?: number;
}

export function tokenizeCSVish(str?: string): string[] {
  if (!str) return [];
  return str
    .split(/[,;\/]/)
    .map((s) => s.trim())
    .filter(Boolean);
}

export function matchesQuery(f: Film, q: string): boolean {
  if (!q) return true;
  const query = q.toLowerCase();
  const searchable = [
    f.title,
    f.genre,
    f.logline,
    f.synopsis,
    f.setting_region,
    f.cast,
    f.director,
    f.tags,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
  return searchable.includes(query);
}

export function filterFilms(
  films: Film[],
  where: FilterSpec,
  sort?: SortKey
): Film[] {
  let result = films.filter((f) => {
    if (where.q && !matchesQuery(f, where.q)) return false;

    if (where.genre && f.genre !== where.genre) return false;

    if (where.region && f.setting_region !== where.region) return false;

    if (where.language) {
      const audioTokens = tokenizeCSVish(f.languages_audio);
      if (!audioTokens.some((t) => t.toLowerCase() === where.language!.toLowerCase())) {
        return false;
      }
    }

    if (where.rating && f.rating !== where.rating) return false;

    if (where.tagsIncludesAny && where.tagsIncludesAny.length > 0) {
      const filmTags = tokenizeCSVish(f.tags).map((t) => t.toLowerCase());
      const anyMatch = where.tagsIncludesAny.some((tag) =>
        filmTags.includes(tag.toLowerCase())
      );
      if (!anyMatch) return false;
    }

    if (where.tagsIncludesAll && where.tagsIncludesAll.length > 0) {
      const filmTags = tokenizeCSVish(f.tags).map((t) => t.toLowerCase());
      const allMatch = where.tagsIncludesAll.every((tag) =>
        filmTags.includes(tag.toLowerCase())
      );
      if (!allMatch) return false;
    }

    if (where.yearEq !== undefined && f.release_year !== where.yearEq) return false;

    if (where.yearGte !== undefined && f.release_year < where.yearGte) return false;

    if (where.yearLte !== undefined && f.release_year > where.yearLte) return false;

    return true;
  });

  if (sort === "newest") {
    result.sort((a, b) => b.release_year - a.release_year);
  } else if (sort === "az") {
    result.sort((a, b) => a.title.localeCompare(b.title));
  } else if (sort === "runtime") {
    result.sort((a, b) => b.runtime_min - a.runtime_min);
  }

  return result;
}
