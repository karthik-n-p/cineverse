// ─── TMDB API Client ─────────────────────────────────────────
// Fetches movie data from The Movie Database (TMDB) API v3

// ─── Types ───────────────────────────────────────────────────

export interface TMDBMovie {
  id: number;
  title: string;
  original_title: string;
  overview: string;
  poster_path: string | null;
  backdrop_path: string | null;
  release_date: string;
  popularity: number;
  vote_average: number;
  vote_count: number;
  genre_ids: number[];
  original_language: string;
  adult: boolean;
}

export interface TMDBMovieDetails extends TMDBMovie {
  budget: number;
  revenue: number;
  runtime: number | null;
  tagline: string | null;
  genres: TMDBGenre[];
  production_countries: { iso_3166_1: string; name: string }[];
  production_companies: { id: number; name: string; logo_path: string | null }[];
  spoken_languages: { iso_639_1: string; english_name: string }[];
  credits?: {
    cast: { id: number; name: string; character: string; profile_path: string | null; order: number }[];
    crew: { id: number; name: string; job: string; department: string; profile_path: string | null }[];
  };
}

export interface TMDBGenre {
  id: number;
  name: string;
}

export interface TMDBLanguage {
  iso_639_1: string;
  english_name: string;
  name: string;
}

export interface TMDBCountry {
  iso_3166_1: string;
  english_name: string;
  native_name: string;
}

export interface MovieFilters {
  genre?: number;
  language?: string;
  country?: string;
  sort_by?: string;
  page?: number;
  year?: number;
}

// ─── Constants ───────────────────────────────────────────────

const TMDB_BASE = "https://api.tmdb.org/3";
export const TMDB_IMAGE_BASE = "https://image.tmdb.org/t/p";

export function posterUrl(path: string | null, size: "w92" | "w154" | "w185" | "w342" | "w500" | "w780" | "original" = "w342"): string {
  if (!path) return "/placeholder-poster.png";
  return `${TMDB_IMAGE_BASE}/${size}${path}`;
}

export function backdropUrl(path: string | null, size: "w300" | "w780" | "w1280" | "original" = "w780"): string {
  if (!path) return "";
  return `${TMDB_IMAGE_BASE}/${size}${path}`;
}

// ─── API Helpers ─────────────────────────────────────────────

function getToken(): string {
  const token = process.env.TMDB_BEARER_TOKEN;
  if (!token) throw new Error("TMDB_BEARER_TOKEN not set in environment");
  return token;
}

async function tmdbFetch<T>(endpoint: string, params: Record<string, string> = {}): Promise<T> {
  const url = new URL(`${TMDB_BASE}${endpoint}`);
  for (const [key, value] of Object.entries(params)) {
    if (value) url.searchParams.set(key, value);
  }

  const res = await fetch(url.toString(), {
    headers: {
      Authorization: `Bearer ${getToken()}`,
      Accept: "application/json",
    },
    next: { revalidate: 3600 }, // Cache for 1 hour
  });

  if (!res.ok) {
    throw new Error(`TMDB API error: ${res.status} ${res.statusText}`);
  }

  return res.json() as Promise<T>;
}

// ─── API Functions ───────────────────────────────────────────

export async function discoverMovies(filters: MovieFilters = {}): Promise<{
  results: TMDBMovie[];
  total_pages: number;
  total_results: number;
  page: number;
}> {
  const params: Record<string, string> = {
    sort_by: filters.sort_by || "popularity.desc",
    page: String(filters.page || 1),
    "vote_count.gte": "50", // Minimum votes for quality
    include_adult: "false",
  };

  if (filters.genre) params.with_genres = String(filters.genre);
  if (filters.language) params.with_original_language = filters.language;
  if (filters.country) params.with_origin_country = filters.country;
  if (filters.year) params.primary_release_year = String(filters.year);

  return tmdbFetch("/discover/movie", params);
}

export async function fetchMovieDetails(movieId: number): Promise<TMDBMovieDetails> {
  return tmdbFetch(`/movie/${movieId}`, {
    append_to_response: "credits",
  });
}

export async function fetchGenres(): Promise<TMDBGenre[]> {
  const data = await tmdbFetch<{ genres: TMDBGenre[] }>("/genre/movie/list", {
    language: "en",
  });
  return data.genres;
}

export async function fetchLanguages(): Promise<TMDBLanguage[]> {
  const data = await tmdbFetch<TMDBLanguage[]>("/configuration/languages");
  // Sort by English name, prioritize major languages
  const major = new Set(["en", "hi", "es", "fr", "de", "ja", "ko", "zh", "pt", "it", "ru", "ar", "ta", "te", "ml", "bn"]);
  return data
    .filter((l) => l.english_name && l.iso_639_1)
    .sort((a, b) => {
      const aM = major.has(a.iso_639_1) ? 0 : 1;
      const bM = major.has(b.iso_639_1) ? 0 : 1;
      if (aM !== bM) return aM - bM;
      return a.english_name.localeCompare(b.english_name);
    });
}

export async function fetchCountries(): Promise<TMDBCountry[]> {
  const data = await tmdbFetch<TMDBCountry[]>("/configuration/countries", {
    language: "en",
  });
  const major = new Set(["US", "IN", "GB", "FR", "DE", "JP", "KR", "CN", "BR", "IT", "ES", "RU", "CA", "AU", "MX"]);
  return data
    .filter((c) => c.english_name && c.iso_3166_1)
    .sort((a, b) => {
      const aM = major.has(a.iso_3166_1) ? 0 : 1;
      const bM = major.has(b.iso_3166_1) ? 0 : 1;
      if (aM !== bM) return aM - bM;
      return a.english_name.localeCompare(b.english_name);
    });
}

export async function searchMovies(query: string, page = 1): Promise<{
  results: TMDBMovie[];
  total_pages: number;
  total_results: number;
}> {
  return tmdbFetch("/search/movie", {
    query,
    page: String(page),
    include_adult: "false",
  });
}

// ─── Genre → District Mapping ────────────────────────────────

export const GENRE_DISTRICT_MAP: Record<number, string> = {
  28: "action",       // Action
  12: "action",       // Adventure
  16: "animation",    // Animation
  35: "comedy",       // Comedy
  80: "thriller",     // Crime
  99: "documentary",  // Documentary
  18: "drama",        // Drama
  10751: "comedy",    // Family
  14: "scifi",        // Fantasy
  36: "drama",        // History
  27: "horror",       // Horror
  10402: "drama",     // Music
  9648: "thriller",   // Mystery
  10749: "romance",   // Romance
  878: "scifi",       // Science Fiction
  10770: "drama",     // TV Movie
  53: "thriller",     // Thriller
  10752: "action",    // War
  37: "action",       // Western
};

export const MOVIE_DISTRICT_NAMES: Record<string, string> = {
  downtown: "Hall of Fame",
  action: "Action District",
  comedy: "Comedy Lane",
  drama: "Drama Avenue",
  horror: "Horror Alley",
  scifi: "Sci-Fi Quarter",
  romance: "Romance Boulevard",
  thriller: "Thriller Row",
  animation: "Animation Park",
  documentary: "Documentary Square",
  other: "Indie Corner",
};

export const MOVIE_DISTRICT_COLORS: Record<string, string> = {
  downtown: "#ffd700",
  action: "#ef4444",
  comedy: "#fbbf24",
  drama: "#3b82f6",
  horror: "#7c3aed",
  scifi: "#06b6d4",
  romance: "#ec4899",
  thriller: "#64748b",
  animation: "#22c55e",
  documentary: "#f97316",
  other: "#a855f7",
};

export function inferMovieDistrict(genreIds: number[]): string {
  if (!genreIds || genreIds.length === 0) return "other";
  // Use the first genre as primary
  return GENRE_DISTRICT_MAP[genreIds[0]] ?? "other";
}
