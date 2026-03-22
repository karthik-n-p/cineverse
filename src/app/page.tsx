"use client";

import { useState, useCallback, useEffect, useRef, useMemo, Suspense } from "react";
import { Search, X, Star, Calendar, Eye, TrendingUp, Film, ChevronRight } from "lucide-react";
import dynamic from "next/dynamic";
import {
  generateCityLayout,
  DISTRICT_NAMES,
  DISTRICT_COLORS,
  type CityBuilding,
  type CityPlaza,
  type CityDecoration,
  type CityRiver,
  type CityBridge,
  type DistrictZone,
  type DeveloperRecord,
} from "@/lib/github";
import { posterUrl } from "@/lib/tmdb";
import type { TMDBGenre, TMDBLanguage, TMDBCountry } from "@/lib/tmdb";
import LoadingScreen, { type LoadingStage } from "@/components/LoadingScreen";
import MovieFilters, { type MovieFiltersState, type FilterOption } from "@/components/MovieFilters";

const CityCanvas = dynamic(() => import("@/components/CityCanvas"), {
  ssr: false,
});

// ─── Theme Definitions (UI level) ────────────────────────────

const THEMES = [
  { name: "Midnight", accent: "#6090e0", shadow: "#203870" },
  { name: "Sunset", accent: "#c8e64a", shadow: "#5a7a00" },
  { name: "Neon", accent: "#e040c0", shadow: "#600860" },
  { name: "Emerald", accent: "#f0c060", shadow: "#806020" },
];

// ─── Genre Emoji Map ─────────────────────────────────────────

const GENRE_EMOJI: Record<number, string> = {
  28: "💥", 12: "🗺️", 16: "🎨", 35: "😂", 80: "🔫", 99: "📹",
  18: "🎭", 10751: "👨‍👩‍👧‍👦", 14: "🧙", 36: "📜", 27: "👻",
  10402: "🎵", 9648: "🔍", 10749: "💕", 878: "🚀", 10770: "📺",
  53: "😱", 10752: "⚔️", 37: "🤠",
};

// ─── Movie Info Interface ────────────────────────────────────

interface MovieInfo {
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
}

// ─── Star Rating Component ───────────────────────────────────

function StarRating({ rating, size = 12 }: { rating: number; size?: number }) {
  const stars = Math.round(rating / 2);
  return (
    <span className="inline-flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <Star
          key={i}
          size={size}
          fill={i <= stars ? "#ffd700" : "transparent"}
          color={i <= stars ? "#ffd700" : "#555"}
        />
      ))}
      <span className="ml-1 text-cream" style={{ fontSize: size - 1 }}>
        {rating.toFixed(1)}
      </span>
    </span>
  );
}

// ─── Movie Leaderboard ───────────────────────────────────────

const LEADERBOARD_CATEGORIES = [
  { label: "Popular", key: "popularity" as const },
  { label: "Top Rated", key: "vote_average" as const },
  { label: "Most Voted", key: "vote_count" as const },
] as const;

function MiniLeaderboard({
  movies,
  genres,
  accent,
  onSelect,
}: {
  movies: MovieInfo[];
  genres: TMDBGenre[];
  accent: string;
  onSelect: (movieId: number) => void;
}) {
  const [catIndex, setCatIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCatIndex((i) => (i + 1) % LEADERBOARD_CATEGORIES.length);
    }, 10000);
    return () => clearInterval(timer);
  }, []);

  const cat = LEADERBOARD_CATEGORIES[catIndex];
  const sorted = [...movies]
    .sort((a, b) => (b[cat.key] as number) - (a[cat.key] as number))
    .slice(0, 5);

  const genreMap = new Map(genres.map((g) => [g.id, g.name]));

  return (
    <div className="hidden w-56 sm:block">
      <div className="mb-2 flex items-center justify-between">
        <button
          onClick={() =>
            setCatIndex((i) => (i + 1) % LEADERBOARD_CATEGORIES.length)
          }
          className="text-[10px] text-muted transition-colors hover:text-cream normal-case"
          style={{ color: accent }}
        >
          🏆 {cat.label}
        </button>
      </div>
      <div className="border-2 border-border bg-bg-raised/80 backdrop-blur-sm">
        {sorted.map((m, i) => (
          <button
            key={m.id}
            onClick={() => onSelect(m.id)}
            className="flex items-center justify-between px-3 py-1.5 transition-colors hover:bg-bg-card w-full text-left"
          >
            <span className="flex items-center gap-2 overflow-hidden">
              <span
                className="text-[10px] shrink-0"
                style={{
                  color:
                    i === 0
                      ? "#ffd700"
                      : i === 1
                        ? "#c0c0c0"
                        : i === 2
                          ? "#cd7f32"
                          : accent,
                }}
              >
                #{i + 1}
              </span>
              <span className="text-[9px] shrink-0">
                {GENRE_EMOJI[m.genre_ids[0]] ?? "🎬"}
              </span>
              <span className="truncate text-[10px] text-cream normal-case">
                {m.title}
              </span>
            </span>
            <span className="ml-2 shrink-0 text-[10px] text-muted">
              {cat.key === "vote_average"
                ? m.vote_average.toFixed(1)
                : cat.key === "popularity"
                  ? Math.round(m.popularity).toLocaleString()
                  : m.vote_count.toLocaleString()}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}

// ─── Movie Profile Card ──────────────────────────────────────

function MovieCard({
  movie,
  genres,
  accent,
  onClose,
}: {
  movie: MovieInfo;
  genres: TMDBGenre[];
  accent: string;
  onClose: () => void;
}) {
  const genreMap = new Map(genres.map((g) => [g.id, g.name]));
  const movieGenres = movie.genre_ids.map((id) => genreMap.get(id)).filter(Boolean);
  const year = movie.release_date?.slice(0, 4) || "N/A";

  return (
    <div className="fixed inset-x-0 bottom-0 sm:bottom-auto sm:top-0 sm:right-0 sm:left-auto sm:w-[400px] z-30 animate-[slide-up_0.3s_ease-out] sm:animate-[fade-in_0.2s_ease-out]">
      <div className="border-2 border-border bg-bg-raised/95 backdrop-blur-md shadow-2xl max-h-[70vh] sm:max-h-[90vh] overflow-y-auto sm:m-4">
        {/* Backdrop Header */}
        {movie.backdrop_path && (
          <div className="relative h-32 sm:h-40 overflow-hidden">
            <img
              src={`https://image.tmdb.org/t/p/w780${movie.backdrop_path}`}
              alt=""
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-bg-raised via-transparent to-transparent" />
          </div>
        )}

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-2 right-2 p-1.5 bg-bg-raised/80 backdrop-blur-sm border border-border text-muted hover:text-cream transition-colors z-10"
        >
          <X size={14} />
        </button>

        <div className="p-4">
          <div className="flex gap-3">
            {/* Poster */}
            {movie.poster_path && (
              <div className="shrink-0 w-20 sm:w-24 -mt-10 relative z-10">
                <img
                  src={posterUrl(movie.poster_path, "w185")}
                  alt={movie.title}
                  className="w-full border-2 border-border shadow-lg"
                />
              </div>
            )}

            {/* Title Area */}
            <div className="flex-1 min-w-0">
              <h2 className="text-[14px] sm:text-[16px] text-cream font-bold leading-tight normal-case">
                {movie.title}
              </h2>
              {movie.original_title !== movie.title && (
                <p className="text-[10px] text-muted normal-case mt-0.5 italic">
                  {movie.original_title}
                </p>
              )}
              <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                <StarRating rating={movie.vote_average} size={10} />
                <span className="text-[10px] text-muted flex items-center gap-0.5">
                  <Calendar size={9} />
                  {year}
                </span>
              </div>
            </div>
          </div>

          {/* Genre Tags */}
          <div className="flex flex-wrap gap-1 mt-3">
            {movieGenres.map((g) => (
              <span
                key={g}
                className="px-2 py-0.5 text-[9px] border"
                style={{
                  borderColor: accent + "40",
                  color: accent,
                  backgroundColor: accent + "10",
                }}
              >
                {g}
              </span>
            ))}
          </div>

          {/* Stats Row */}
          <div className="flex items-center gap-4 mt-3 pb-3 border-b border-border">
            <div className="text-center">
              <div className="text-[13px] text-cream font-bold">
                {movie.vote_average.toFixed(1)}
              </div>
              <div className="text-[8px] text-muted uppercase tracking-wider">
                Rating
              </div>
            </div>
            <div className="text-center">
              <div className="text-[13px] text-cream font-bold">
                {movie.vote_count.toLocaleString()}
              </div>
              <div className="text-[8px] text-muted uppercase tracking-wider">
                Votes
              </div>
            </div>
            <div className="text-center">
              <div className="text-[13px] text-cream font-bold">
                {Math.round(movie.popularity).toLocaleString()}
              </div>
              <div className="text-[8px] text-muted uppercase tracking-wider">
                Popularity
              </div>
            </div>
            <div className="text-center">
              <div className="text-[13px] text-cream font-bold uppercase">
                {movie.original_language}
              </div>
              <div className="text-[8px] text-muted uppercase tracking-wider">
                Language
              </div>
            </div>
          </div>

          {/* Overview */}
          {movie.overview && (
            <div className="mt-3">
              <h3
                className="text-[9px] font-semibold tracking-widest uppercase mb-1"
                style={{ color: accent }}
              >
                Overview
              </h3>
              <p className="text-[11px] text-warm normal-case leading-relaxed">
                {movie.overview}
              </p>
            </div>
          )}

          {/* TMDB Link */}
          <a
            href={`https://www.themoviedb.org/movie/${movie.id}`}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-3 flex items-center gap-1 text-[10px] transition-colors hover:text-cream normal-case"
            style={{ color: accent }}
          >
            View on TMDB <ChevronRight size={10} />
          </a>
        </div>
      </div>
    </div>
  );
}

// ─── Search Component ────────────────────────────────────────

function MovieSearch({
  movies,
  accent,
  onSelect,
}: {
  movies: MovieInfo[];
  accent: string;
  onSelect: (movieId: number) => void;
}) {
  const [query, setQuery] = useState("");
  const [focused, setFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const results = useMemo(() => {
    if (!query.trim()) return [];
    const q = query.toLowerCase();
    return movies
      .filter((m) => m.title.toLowerCase().includes(q))
      .slice(0, 8);
  }, [query, movies]);

  return (
    <div className="relative">
      <div
        className="flex items-center gap-2 border-2 px-3 py-1.5 bg-bg-raised/60 backdrop-blur-sm transition-colors"
        style={{ borderColor: focused ? accent + "60" : "rgba(255,255,255,0.12)" }}
      >
        <Search size={12} className="text-muted shrink-0" />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setTimeout(() => setFocused(false), 200)}
          placeholder="Search movies..."
          className="flex-1 bg-transparent text-[11px] text-cream placeholder:text-muted outline-none normal-case w-24 sm:w-40"
        />
        {query && (
          <button
            onClick={() => setQuery("")}
            className="text-muted hover:text-cream"
          >
            <X size={10} />
          </button>
        )}
      </div>

      {/* Results dropdown */}
      {focused && results.length > 0 && (
        <div className="absolute z-50 mt-1 w-full sm:w-72 border-2 border-border bg-bg-raised/95 backdrop-blur-md max-h-[250px] overflow-y-auto shadow-lg">
          {results.map((m) => (
            <button
              key={m.id}
              onMouseDown={() => {
                onSelect(m.id);
                setQuery("");
              }}
              className="flex items-center gap-2 w-full text-left px-3 py-2 hover:bg-bg-card transition-colors"
            >
              {m.poster_path ? (
                <img
                  src={posterUrl(m.poster_path, "w92")}
                  alt=""
                  className="w-8 h-12 object-cover shrink-0 border border-border"
                />
              ) : (
                <div className="w-8 h-12 bg-bg-card shrink-0 flex items-center justify-center border border-border">
                  <Film size={12} className="text-muted" />
                </div>
              )}
              <div className="min-w-0 flex-1">
                <div className="text-[11px] text-cream truncate normal-case">
                  {m.title}
                </div>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-[9px] text-muted">
                    {m.release_date?.slice(0, 4)}
                  </span>
                  <span className="text-[9px] text-muted flex items-center gap-0.5">
                    <Star size={8} fill="#ffd700" color="#ffd700" />
                    {m.vote_average.toFixed(1)}
                  </span>
                </div>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Main Content ────────────────────────────────────────────

function HomeContent() {
  // City state
  const [buildings, setBuildings] = useState<CityBuilding[]>([]);
  const [plazas, setPlazas] = useState<CityPlaza[]>([]);
  const [decorations, setDecorations] = useState<CityDecoration[]>([]);
  const [river, setRiver] = useState<CityRiver | null>(null);
  const [bridges, setBridges] = useState<CityBridge[]>([]);
  const [districtZones, setDistrictZones] = useState<DistrictZone[]>([]);

  // Movie data
  const [movieIndex, setMovieIndex] = useState<Record<number, MovieInfo>>({});
  const [genres, setGenres] = useState<TMDBGenre[]>([]);
  const [languages, setLanguages] = useState<TMDBLanguage[]>([]);
  const [countries, setCountries] = useState<TMDBCountry[]>([]);
  const [stats, setStats] = useState({ total_developers: 0, total_contributions: 0 });

  // UI State
  const [loadStage, setLoadStage] = useState<LoadingStage>("init");
  const [loadProgress, setLoadProgress] = useState(0);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [themeIndex, setThemeIndex] = useState(0);
  const [selectedBuilding, setSelectedBuilding] = useState<CityBuilding | null>(null);
  const [focusedBuilding, setFocusedBuilding] = useState<string | null>(null);
  const [isMobile, setIsMobile] = useState(false);
  const [introMode, setIntroMode] = useState(false);
  const [flyMode, setFlyMode] = useState(false);
  const [filters, setFilters] = useState<MovieFiltersState>({
    genre: "",
    language: "",
    country: "",
    sort_by: "popularity.desc",
  });
  const [isFiltering, setIsFiltering] = useState(false);

  const theme = THEMES[themeIndex];
  const didInit = useRef(false);

  // ─── Load saved theme ─────────────────────────────────────
  useEffect(() => {
    if (typeof window === "undefined") return;
    const saved = localStorage.getItem("filmcity_theme");
    if (saved !== null) {
      const n = parseInt(saved, 10);
      if (n >= 0 && n <= 3) setThemeIndex(n);
    }
  }, []);

  // ─── Detect mobile ────────────────────────────────────────
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 640 || "ontouchstart" in window);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  // ─── Cycle theme ──────────────────────────────────────────
  const cycleTheme = useCallback(() => {
    setThemeIndex((i) => {
      const next = (i + 1) % THEMES.length;
      localStorage.setItem("filmcity_theme", String(next));
      return next;
    });
  }, []);

  // ─── Fetch filter metadata ────────────────────────────────
  useEffect(() => {
    fetch("/api/movies?meta=1")
      .then((r) => r.json())
      .then((data) => {
        if (data.genres) setGenres(data.genres);
        if (data.languages) setLanguages(data.languages);
        if (data.countries) setCountries(data.countries);
      })
      .catch(() => {});
  }, []);

  // ─── Fetch movies (initial + on filter change) ────────────
  const fetchMovies = useCallback(async (f: MovieFiltersState) => {
    try {
      setIsFiltering(true);
      const params = new URLSearchParams();
      if (f.genre) params.set("genre", f.genre);
      if (f.language) params.set("language", f.language);
      if (f.country) params.set("country", f.country);
      if (f.sort_by) params.set("sort_by", f.sort_by);
      params.set("pages", "25");

      const res = await fetch(`/api/movies?${params.toString()}`);
      if (!res.ok) throw new Error("Failed to fetch movies");
      const data = await res.json();

      const devs = data.developers as DeveloperRecord[];
      if (devs.length > 0) {
        const layout = generateCityLayout(devs);
        setBuildings(layout.buildings);
        setPlazas(layout.plazas);
        setDecorations(layout.decorations);
        setRiver(layout.river);
        setBridges(layout.bridges);
        setDistrictZones(layout.districtZones);
      }

      setMovieIndex(data.movieIndex ?? {});
      if (data.genres) setGenres(data.genres);
      setStats(data.stats ?? { total_developers: 0, total_contributions: 0 });
    } catch (err) {
      console.error("Failed to fetch movies:", err);
      setLoadError("Failed to load movies. Check your TMDB API key.");
    } finally {
      setIsFiltering(false);
    }
  }, []);

  // ─── Initial load ─────────────────────────────────────────
  useEffect(() => {
    if (didInit.current) return;
    didInit.current = true;

    const init = async () => {
      setLoadStage("fetching");
      setLoadProgress(20);

      try {
        await fetchMovies(filters);
        setLoadProgress(80);
        setLoadStage("rendering");

        // Small delay for loading screen effect
        await new Promise((r) => setTimeout(r, 500));
        setLoadProgress(100);
        setLoadStage("ready");

        // Start intro after a brief loading screen display
        setIntroMode(true);
        setTimeout(() => setIntroMode(false), 14000);
      } catch {
        setLoadError("Failed to load movies. Please refresh.");
        setLoadStage("error");
      }
    };

    init();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ─── On filter change ─────────────────────────────────────
  const handleFilterChange = useCallback(
    (newFilters: MovieFiltersState) => {
      setFilters(newFilters);
      fetchMovies(newFilters);
    },
    [fetchMovies]
  );

  // ─── Building click → Movie selection ─────────────────────
  const handleBuildingClick = useCallback(
    (building: CityBuilding) => {
      if (introMode) return;
      setSelectedBuilding(building);
      setFocusedBuilding(building.login);
    },
    [introMode]
  );

  // ─── Close movie card ─────────────────────────────────────
  const handleCloseCard = useCallback(() => {
    setSelectedBuilding(null);
    setFocusedBuilding(null);
  }, []);

  // ─── Select movie from search/leaderboard ─────────────────
  const handleSelectMovie = useCallback(
    (movieId: number) => {
      const building = buildings.find((b) => b.login === String(movieId));
      if (building) {
        setSelectedBuilding(building);
        setFocusedBuilding(building.login);
      }
    },
    [buildings]
  );

  // ─── Get movie info for selected building ─────────────────
  const selectedMovie = useMemo(() => {
    if (!selectedBuilding) return null;
    const id = parseInt(selectedBuilding.login, 10);
    return movieIndex[id] ?? null;
  }, [selectedBuilding, movieIndex]);

  // ─── Movies list for search/leaderboard ───────────────────
  const moviesList = useMemo(() => Object.values(movieIndex), [movieIndex]);

  // ─── Filter options ───────────────────────────────────────
  const genreOptions: FilterOption[] = useMemo(
    () => genres.map((g) => ({ value: String(g.id), label: g.name })),
    [genres]
  );
  const langOptions: FilterOption[] = useMemo(
    () =>
      languages
        .filter((l) => l.english_name)
        .map((l) => ({ value: l.iso_639_1, label: l.english_name })),
    [languages]
  );
  const countryOptions: FilterOption[] = useMemo(
    () =>
      countries
        .filter((c) => c.english_name)
        .map((c) => ({ value: c.iso_3166_1, label: c.english_name })),
    [countries]
  );

  // ─── Loading Screen ───────────────────────────────────────
  if (loadStage !== "done") {
    return (
      <LoadingScreen
        stage={loadStage}
        progress={loadProgress}
        error={loadError}
        accentColor={theme.accent}
        onRetry={() => {
          setLoadStage("init");
          setLoadError(null);
          didInit.current = false;
        }}
        onFadeComplete={() => setLoadStage("done")}
      />
    );
  }

  return (
    <div className="relative min-h-screen overflow-hidden">
      {/* 3D City */}
      <CityCanvas
        buildings={buildings}
        plazas={plazas}
        decorations={decorations}
        river={river}
        bridges={bridges}
        flyMode={flyMode}
        onExitFly={() => setFlyMode(false)}
        themeIndex={themeIndex}
        focusedBuilding={focusedBuilding}
        onBuildingClick={handleBuildingClick}
        introMode={introMode}
        onIntroEnd={() => setIntroMode(false)}
        holdRise={loadStage !== "done"}
        isMobile={isMobile}
      />

      {/* Top HUD */}
      <header className="fixed top-0 left-0 right-0 z-20 pointer-events-none">
        <div className="flex items-start justify-between gap-2 p-3 sm:p-4">
          {/* Left: Logo + Stats */}
          <div className="pointer-events-auto">
            <div className="flex items-center gap-2">
              <Film size={16} style={{ color: theme.accent }} />
              <h1 className="text-[13px] sm:text-[15px] font-bold tracking-widest uppercase">
                <span style={{ color: theme.accent }}>FILM</span>
                <span className="text-cream">CITY</span>
              </h1>
            </div>
            <p className="text-[9px] text-muted mt-0.5 normal-case">
              {stats.total_developers.toLocaleString()} movies •{" "}
              {isFiltering ? (
                <span className="blink-dot inline-block h-1.5 w-1.5 mr-1" style={{ backgroundColor: theme.accent }} />
              ) : null}
              {isFiltering ? "Loading..." : "Explore the world of cinema"}
            </p>
          </div>

          {/* Right: Search + Theme */}
          <div className="flex items-center gap-2 pointer-events-auto">
            <MovieSearch
              movies={moviesList}
              accent={theme.accent}
              onSelect={handleSelectMovie}
            />

            {/* Theme Toggle */}
            <button
              onClick={cycleTheme}
              className="shrink-0 w-7 h-7 border-2 border-border flex items-center justify-center transition-colors hover:border-border-light"
              title={`Theme: ${theme.name}`}
            >
              <span
                className="w-3 h-3"
                style={{ backgroundColor: theme.accent }}
              />
            </button>
          </div>
        </div>
      </header>

      {/* Left: Desktop Filter Panel */}
      {!isMobile && (
        <div className="fixed top-16 left-4 z-20 w-56 max-h-[calc(100vh-120px)] overflow-y-auto no-scrollbar pointer-events-auto">
          <MovieFilters
            genres={genreOptions}
            languages={langOptions}
            countries={countryOptions}
            filters={filters}
            onFilterChange={handleFilterChange}
            accentColor={theme.accent}
            isMobile={false}
          />
        </div>
      )}

      {/* Right: Leaderboard */}
      <div className="fixed top-16 right-4 z-20 pointer-events-auto">
        <MiniLeaderboard
          movies={moviesList}
          genres={genres}
          accent={theme.accent}
          onSelect={handleSelectMovie}
        />
      </div>

      {/* Bottom: District Tags */}
      <div className="fixed bottom-4 left-4 z-10 hidden sm:flex flex-wrap gap-1 max-w-[250px] pointer-events-auto">
        {districtZones
          .filter((d) => d.population > 0)
          .sort((a, b) => b.population - a.population)
          .slice(0, 8)
          .map((d) => (
            <span
              key={d.id}
              className="px-2 py-0.5 text-[8px] border border-border bg-bg-raised/60 backdrop-blur-sm"
              style={{ color: DISTRICT_COLORS[d.id] ?? "#888" }}
            >
              {DISTRICT_NAMES[d.id] ?? d.id} ({d.population})
            </span>
          ))}
      </div>

      {/* Mobile Filter Button */}
      {isMobile && (
        <MovieFilters
          genres={genreOptions}
          languages={langOptions}
          countries={countryOptions}
          filters={filters}
          onFilterChange={handleFilterChange}
          accentColor={theme.accent}
          isMobile={true}
        />
      )}

      {/* Movie Card (when a building is clicked) */}
      {selectedMovie && (
        <MovieCard
          movie={selectedMovie}
          genres={genres}
          accent={theme.accent}
          onClose={handleCloseCard}
        />
      )}

      {/* Fly Mode Toggle (desktop only) */}
      {!isMobile && !introMode && (
        <button
          onClick={() => setFlyMode(!flyMode)}
          className="fixed bottom-4 right-4 sm:right-auto sm:left-[270px] z-20 px-3 py-1.5 text-[10px] border-2 border-border bg-bg-raised/80 backdrop-blur-sm transition-colors hover:border-border-light pointer-events-auto"
          style={{
            color: flyMode ? theme.accent : "rgba(255,255,255,0.6)",
            borderColor: flyMode ? theme.accent + "40" : undefined,
          }}
        >
          {flyMode ? "✈ Exit Fly" : "✈ Fly Mode"}
        </button>
      )}
    </div>
  );
}

// ─── Wrapper with Suspense ───────────────────────────────────

export default function Home() {
  return (
    <Suspense fallback={null}>
      <HomeContent />
    </Suspense>
  );
}
