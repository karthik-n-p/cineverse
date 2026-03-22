import fs from 'fs';
import path from 'path';
import { createClient } from '@supabase/supabase-js';

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

// ml: Malayalam, ta: Tamil, te: Telugu, hi: Hindi, kn: Kannada, bn: Bengali
const INDIAN_LANGUAGES = ['ml', 'ta', 'te', 'hi', 'kn', 'bn'];

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

async function syncIndianMovies() {
  console.log(`Starting deep sync for Indian Languages...`);
  
  for (const lang of INDIAN_LANGUAGES) {
    console.log(`\n--- Syncing Language: ${lang.toUpperCase()} ---`);
    let insertedForLang = 0;
    
    // Fetch 150 pages (~3000 movies) per language (extra for ml and others)
    for (let page = 1; page <= 150; page++) {
      try {
        const { results } = await tmdbFetch('/discover/movie', {
          sort_by: "popularity.desc",
          page: String(page),
          "vote_count.gte": "10", // Lowered threshold for regional movies as they might have fewer global votes on TMDB
          include_adult: "false",
          with_original_language: lang
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
          original_language: m.original_language || lang,
          updated_at: new Date().toISOString()
        }));
        
        const { error } = await supabase.from('movies').upsert(moviesData, {
          onConflict: "id",
          ignoreDuplicates: false,
        });
        
        if (error) {
          console.error(`Error inserting ${lang} page ${page}:`, error);
          continue;
        }
        
        insertedForLang += moviesData.length;
        process.stdout.write(`\rLanguage ${lang.toUpperCase()}: Page ${page}/150 synced (${insertedForLang} movies total)... `);
        
        await new Promise(r => setTimeout(r, 60));
      } catch (e) {
        console.error(`Failed on ${lang} page ${page}:`, e.message);
      }
    }
    console.log(`\nCompleted language ${lang.toUpperCase()}.`);
  }
  console.log("\nALL INDIAN MOVIES SYNCED!");
}

syncIndianMovies().catch(console.error);
