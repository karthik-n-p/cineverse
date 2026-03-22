-- ============================================================
-- Git City — Movies Table
-- ============================================================

create table if not exists movies (
  id bigint primary key,
  title text not null,
  original_title text not null,
  overview text,
  poster_path text,
  backdrop_path text,
  release_date text,
  popularity real not null,
  vote_average real not null,
  vote_count int not null,
  genre_ids jsonb not null default '[]'::jsonb,
  original_language text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Indexes for efficient querying by the API filters (City visualization relies heavily on ordering)
create index if not exists idx_movies_popularity on movies (popularity desc);
create index if not exists idx_movies_vote_average on movies (vote_average desc);
create index if not exists idx_movies_vote_count on movies (vote_count desc);
create index if not exists idx_movies_genres on movies using gin (genre_ids);
create index if not exists idx_movies_release_date on movies (release_date);

alter table movies enable row level security;

create policy "Public read movies"
  on movies for select
  using (true);
