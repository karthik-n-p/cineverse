import fs from 'fs';
import path from 'path';
import { createClient } from '@supabase/supabase-js';

// Simple parser for .env.local
const envFile = fs.readFileSync(path.resolve('.env.local'), 'utf-8');
const env = {};
envFile.split('\n').forEach(line => {
  const match = line.match(/^([^#\s][^=]+)=(.*)$/);
  if (match) {
    env[match[1].trim()] = match[2].trim();
  }
});

const TMDB_TOKEN = env['TMDB_BEARER_TOKEN'];
const SUPABASE_URL = env['NEXT_PUBLIC_SUPABASE_URL'];
const SUPABASE_KEY = env['SUPABASE_SERVICE_ROLE_KEY'];

if (!TMDB_TOKEN || !SUPABASE_URL || !SUPABASE_KEY) {
  console.error("Missing credentials in .env.local");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const GENRES = [
  28, 12, 16, 35, 80, 99, 18, 10751, 14, 36, 27, 10402, 9648, 10749, 878, 10770, 53, 10752, 37
];

async function tmdbFetch(endpoint, params = {}) {
  const url = new URL(`https://api.tmdb.org/3${endpoint}`);
  for (const [key, value] of Object.entries(params)) {
    if (value) url.searchParams.set(key, value);
  }
  const res = await fetch(url.toString(), {
    headers: { Authorization: `Bearer ${TMDB_TOKEN}`, Accept: "application/json" }
  });
  if (!res.ok) throw new Error(`TMDB error: ${res.statusText}`);
  return res.json();
}

async function syncAll() {
  console.log(`Starting deep sync for ${GENRES.length} genres (100 pages = 2000 movies each)`);
  
  for (const genreId of GENRES) {
    console.log(`\n--- Syncing Genre ${genreId} ---`);
    let insertedForGenre = 0;
    
    for (let page = 1; page <= 100; page++) {
      try {
        const { results } = await tmdbFetch('/discover/movie', {
          sort_by: "popularity.desc",
          page: String(page),
          "vote_count.gte": "50",
          include_adult: "false",
          with_genres: String(genreId)
        });
        
        if (!results || results.length === 0) break;
        
        const moviesData = results.map(m => ({
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
        
        const { error } = await supabase.from('movies').upsert(moviesData, {
          onConflict: "id",
          ignoreDuplicates: false,
        });
        
        if (error) {
          console.error(`Error inserting genre ${genreId} page ${page}:`, error);
          continue;
        }
        
        insertedForGenre += moviesData.length;
        process.stdout.write(`\rGenre ${genreId}: Page ${page}/100 synced (${insertedForGenre} movies total)... `);
        
        // Respect TMDB rate limits (max 50 req/sec)
        await new Promise(r => setTimeout(r, 60));
      } catch (e) {
        console.error(`Failed on genre ${genreId} page ${page}:`, e.message);
      }
    }
    console.log(`\nCompleted genre ${genreId}.`);
  }
  console.log("\nALL GENRES DEEP SYNCED!");
}

syncAll().catch(console.error);
