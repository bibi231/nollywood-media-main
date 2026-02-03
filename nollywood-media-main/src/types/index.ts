export interface Movie {
  id: string;
  title: string;
  description: string;
  poster_url: string;
  backdrop_url: string;
  trailer_url?: string;
  video_url: string;
  release_year: number;
  duration: number;
  rating: number;
  genres: string[];
  cast: string[];
  director: string;
  views: number;
  created_at: string;
  updated_at: string;
}

export interface TVShow {
  id: string;
  title: string;
  description: string;
  poster_url: string;
  backdrop_url: string;
  trailer_url?: string;
  release_year: number;
  rating: number;
  genres: string[];
  cast: string[];
  seasons: number;
  status: 'ongoing' | 'completed';
  views: number;
  created_at: string;
  updated_at: string;
}

export interface Episode {
  id: string;
  show_id: string;
  season: number;
  episode_number: number;
  title: string;
  description: string;
  thumbnail_url: string;
  video_url: string;
  duration: number;
  air_date: string;
  created_at: string;
}

export type ContentType = 'movie' | 'tv_show' | 'episode';
