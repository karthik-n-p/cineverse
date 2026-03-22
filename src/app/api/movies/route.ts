import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";
import {
  discoverMovies,
  fetchGenres,
  fetchLanguages,
  fetchCountries,
  type TMDBMovie,
  type MovieFilters,
} from "@/lib/tmdb";
import type { DeveloperRecord } from "@/lib/github";

// ─── Movie → DeveloperRecord Adapter ─────────────────────────
// Maps TMDB movie data to the DeveloperRecord shape so the existing
// generateCityLayout() function works without any changes.

function movieToDeveloperRecord(movie: TMDBMovie, index: number, genreMap: Map<number, string>): DeveloperRecord {
  // Map movie attributes to developer record fields:
  // popularity → contributions (drives height)
  // vote_count → total_stars (drives height, secondary)
  // vote_average → lit percentage (via contributions + active days)
  // genre → primary_language → district
  const primaryGenre = movie.genre_ids[0];
  const genreName = primaryGenre ? (genreMap.get(primaryGenre) ?? "Other") : "Other";

  return {
    id: movie.id,
    github_login: String(movie.id), // Use movie ID as unique identifier
    github_id: movie.id,
    name: movie.title,
    avatar_url: movie.poster_path
      ? `https://image.tmdb.org/t/p/w185${movie.poster_path}`
      : null,
    bio: movie.overview?.slice(0, 200) || null,
    contributions: Math.round(movie.popularity * 10), // Scale popularity for height
    public_repos: Math.max(1, Math.round(movie.vote_count / 50)), // Controls width
    total_stars: movie.vote_count, // Secondary height factor
    primary_language: genreName, // Used for district assignment
    top_repos: [],
    rank: index + 1,
    fetched_at: new Date().toISOString(),
    created_at: movie.release_date || new Date().toISOString(),
    claimed: false,
    fetch_priority: 0,
    claimed_at: null,
    district: undefined,
    owned_items: [],
    custom_color: null,
    billboard_images: [],
    // V2 fields for more nuanced building dimensions
    contributions_total: Math.round(movie.popularity * 15),
    contribution_years: [],
    total_prs: Math.round(movie.vote_average * 100), // Reviews influence height via PRs
    total_reviews: movie.vote_count,
    total_issues: 0,
    repos_contributed_to: Math.max(1, movie.genre_ids.length * 10), // More genres = more depth
    followers: movie.vote_count,
    following: 0,
    organizations_count: movie.genre_ids.length,
    account_created_at: movie.release_date || null,
    current_streak: Math.round(movie.vote_average * 10), // Higher rating = more streak
    longest_streak: Math.round(movie.vote_average * 15),
    active_days_last_year: Math.round(movie.vote_average * 30), // Rating drives lit percentage
    language_diversity: movie.genre_ids.length,
    // XP fields
    xp_total: Math.round(movie.popularity * 5),
    xp_level: Math.min(25, Math.max(1, Math.round(movie.vote_average * 2.5))),
    xp_github: 0,
    // Game fields (not used for movies but must exist)
    achievements: [],
    kudos_count: 0,
    visit_count: 0,
    loadout: null,
    app_streak: 0,
    raid_xp: 0,
    active_raid_tag: null,
    active_drop: null,
    rabbit_completed: false,
  };
}

// ─── GET /api/movies (Supabase Cached Version) ──────────────────

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const genre = searchParams.get("genre");
  const language = searchParams.get("language");
  const country = searchParams.get("country");
  const sortBy = searchParams.get("sort_by");
  const metaOnly = searchParams.get("meta"); 

  try {
    // If meta-only request, return filter options from TMDB
    if (metaOnly === "1") {
      const [genres, languages, countries] = await Promise.all([
        fetchGenres(),
        fetchLanguages(),
        fetchCountries(),
      ]);
      return NextResponse.json(
        { genres, languages, countries },
        { headers: { "Cache-Control": "public, s-maxage=86400, stale-while-revalidate=172800" } }
      );
    }

    // Fetch genres for mapping (required by movieToDeveloperRecord)
    const genres = await fetchGenres();
    const genreMap = new Map(genres.map((g) => [g.id, g.name]));

    const sb = getSupabaseAdmin();
    
    // Start building Query
    let query = sb.from("movies").select("*");

    // Apply Sorting
    if (sortBy === "vote_average.desc") {
      query = query.order("vote_average", { ascending: false });
    } else if (sortBy === "release_date.desc") {
      query = query.order("release_date", { ascending: false });
    } else {
      query = query.order("popularity", { ascending: false });
    }
    
    // Apply Filters
    if (language) {
      query = query.eq("original_language", language);
    }
    if (genre) {
      query = query.contains("genre_ids", `[${parseInt(genre, 10)}]`);
    }
    
    // Target scaling up to thousands of movies for the 3D visualizer
    query = query.limit(3000);

    const { data: allMovies, error } = await query;

    if (error) {
       console.error("Supabase query error:", error);
       throw error;
    }

    // Convert to DeveloperRecord format
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const developers = (allMovies || []).map((movie: any, i: number) => movieToDeveloperRecord(movie as any, i, genreMap));

    // Build stats
    const stats = {
      total_developers: (allMovies || []).length,
      total_contributions: (allMovies || []).reduce((sum: number, m: any) => sum + Math.round(m.popularity * 10), 0),
    };

    // Also return raw movie data keyed by ID for the profile card
    const movieIndex: Record<number, any> = {};
    for (const movie of (allMovies || [])) {
      movieIndex[movie.id] = movie;
    }

    return NextResponse.json(
      { developers, stats, genres, movieIndex },
      {
        headers: {
          "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600",
        },
      }
    );
  } catch (error) {
    console.error("Movies API error:", error);
    return NextResponse.json(
      { error: "Failed to fetch movies" },
      { status: 500 }
    );
  }
}
