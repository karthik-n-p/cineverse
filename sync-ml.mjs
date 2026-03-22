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

const delay = ms => new Promise(r => setTimeout(r, ms));

async function tmdbFetch(endpoint, params = {}, retries = 3) {
  const url = new URL(`https://api.tmdb.org/3${endpoint}`);
  for (const [key, value] of Object.entries(params)) {
    if (value) url.searchParams.set(key, value);
  }
  
  for (let i = 0; i < retries; i++) {
    const res = await fetch(url.toString(), {
      headers: { Authorization: `Bearer ${TMDB_TOKEN}`, Accept: "application/json" }
    });
    if (res.ok) return res.json();
    if (res.status === 429) {
      console.log(`\nRate limited. Waiting 2 seconds...`);
      await delay(2000);
      continue;
    }
    throw new Error(`TMDB error: ${res.status} ${res.statusText}`);
  }
  throw new Error("Max retries exceeded");
}

async function syncMalayalam() {
  console.log(`Starting ROBUST sync for Malayalam (ml)...`);
  let inserted = 0;
  
  for (let page = 1; page <= 150; page++) {
    try {
      const data = await tmdbFetch('/discover/movie', {
        sort_by: "popularity.desc",
        page: String(page),
        "vote_count.gte": "10",
        include_adult: "false",
        with_original_language: "ml"
      });
      
      const results = data.results || [];
      if (results.length === 0) {
        console.log(`\nNo more results found at page ${page}.`);
        break;
      }
      
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
        original_language: m.original_language || "ml",
        updated_at: new Date().toISOString()
      }));
      
      const { error } = await supabase.from('movies').upsert(moviesData, {
        onConflict: "id",
        ignoreDuplicates: false,
      });
      
      if (error) {
        console.error(`\nDB Error page ${page}:`, error.message);
        continue;
      }
      
      inserted += moviesData.length;
      process.stdout.write(`\rPage ${page}/150 synced (${inserted} Malayalam movies total)... `);
      
      await delay(150); // Be gentle with TMDB
    } catch (e) {
      console.error(`\nFailed on page ${page}:`, e.message);
    }
  }
  console.log(`\nSuccessfully synced ${inserted} Malayalam movies!`);
}

syncMalayalam().catch(e => {
  console.error(e);
  process.exit(1);
});
