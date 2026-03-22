import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";
import { discoverMovies } from "@/lib/tmdb";

// NOTE: This route should ideally be protected by a secret or admin auth in a production environment.
// For the purpose of running it manually, we are keeping it open or you can run it from localhost.

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const startPage = parseInt(searchParams.get("start") || "1", 10);
  const endPage = parseInt(searchParams.get("end") || "10", 10); 
  
  if (endPage - startPage > 50) {
    return NextResponse.json(
      { error: "Please sync at most 50 pages at a time to avoid vercel timeouts." },
      { status: 400 }
    );
  }

  try {
    const sb = getSupabaseAdmin();
    let totalInserted = 0;

    for (let p = startPage; p <= endPage; p++) {
      console.log(`[Sync] Fetching TMDB page ${p}...`);
      const { results } = await discoverMovies({ page: p });
      
      if (!results || results.length === 0) {
        console.log(`[Sync] No results found on page ${p}, stopping.`);
        break;
      }

      // Map TMDB response to our Supabase schema
      const moviesData = results.map((m) => ({
        id: m.id,
        title: m.title,
        original_title: m.original_title,
        overview: m.overview || null,
        poster_path: m.poster_path || null,
        backdrop_path: m.backdrop_path || null,
        release_date: m.release_date || null,
        popularity: m.popularity || 0,
        vote_average: m.vote_average || 0,
        vote_count: m.vote_count || 0,
        genre_ids: m.genre_ids || [],
        original_language: m.original_language || "en",
        updated_at: new Date().toISOString()
      }));

      const { error } = await sb.from("movies").upsert(moviesData, {
        onConflict: "id",
        ignoreDuplicates: false,
      });

      if (error) {
        console.error(`[Sync] Error inserting page ${p}:`, error);
        throw error;
      }
      totalInserted += moviesData.length;
      
      // Artificial delay to prevent TMDB rate limits
      await new Promise(r => setTimeout(r, 250));
    }

    return NextResponse.json({
      success: true,
      message: `Successfully synced ${totalInserted} movies from pages ${startPage} to ${endPage}.`
    });
  } catch (error) {
    console.error("Sync error:", error);
    return NextResponse.json(
      { success: false, error: String(error) },
      { status: 500 }
    );
  }
}
