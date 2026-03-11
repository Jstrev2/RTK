-- Supabase schema for saved items
create table if not exists saved_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users not null,
  item_type text not null,
  item_id text not null,
  label text,
  metadata jsonb,
  created_at timestamptz default now()
);

create unique index if not exists saved_items_unique
  on saved_items (user_id, item_type, item_id);

alter table saved_items enable row level security;

drop policy if exists "Saved items are user-owned" on saved_items;

create policy "Saved items are user-owned"
  on saved_items for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Catalog items tracked from external sources
create table if not exists catalog_items (
  id uuid primary key default gen_random_uuid(),
  item_type text not null,
  item_key text not null,
  name text not null,
  brand text,
  category text,
  release_year text,
  image_url text,
  image_source text,
  image_updated_at timestamptz,
  aliases text[] default '{}',
  source_data jsonb,
  mention_count int default 0,
  mention_score numeric default 0,
  last_seen timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create unique index if not exists catalog_items_unique
  on catalog_items (item_type, item_key);

-- Mentions by source (aggregated per run)
create table if not exists catalog_mentions (
  id uuid primary key default gen_random_uuid(),
  item_type text not null,
  item_key text not null,
  source text not null,
  mention_count int default 0,
  mention_score numeric default 0,
  last_seen timestamptz,
  last_title text,
  last_url text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create unique index if not exists catalog_mentions_unique
  on catalog_mentions (item_type, item_key, source);

alter table catalog_items enable row level security;
alter table catalog_mentions enable row level security;

drop policy if exists "Catalog items are public" on catalog_items;

create policy "Catalog items are public"
  on catalog_items for select
  using (true);

drop policy if exists "Catalog mentions are public" on catalog_mentions;

create policy "Catalog mentions are public"
  on catalog_mentions for select
  using (true);

alter table catalog_items add column if not exists image_url text;
alter table catalog_items add column if not exists image_source text;
alter table catalog_items add column if not exists image_updated_at timestamptz;

-- Music songs and votes
create table if not exists music_songs (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  artist text not null,
  bpm int,
  genre text[] default '{}',
  energy text,
  workout text[] default '{}',
  submitted_by uuid references auth.users,
  submitted_date date default current_date,
  upvotes int default 0,
  downvotes int default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists song_votes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users not null,
  song_id uuid references music_songs on delete cascade not null,
  vote smallint not null,
  created_at timestamptz default now()
);

create unique index if not exists song_votes_unique
  on song_votes (user_id, song_id);

alter table music_songs enable row level security;
alter table song_votes enable row level security;

drop policy if exists "Music songs are public" on music_songs;

create policy "Music songs are public"
  on music_songs for select
  using (true);

drop policy if exists "Music songs insert by owner" on music_songs;

create policy "Music songs insert by owner"
  on music_songs for insert
  with check (auth.uid() = submitted_by);

drop policy if exists "Music songs update for votes" on music_songs;

create policy "Music songs update for votes"
  on music_songs for update
  using (auth.uid() is not null)
  with check (auth.uid() is not null);

drop policy if exists "Song votes are user-owned" on song_votes;

create policy "Song votes are user-owned"
  on song_votes for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Optional metadata for bulk imports
alter table music_songs add column if not exists item_key text;
alter table music_songs add column if not exists spotify_id text;
alter table music_songs add column if not exists source text;

create unique index if not exists music_songs_item_key
  on music_songs (item_key);

create unique index if not exists music_songs_spotify_id
  on music_songs (spotify_id);

-- Fueling logs
create table if not exists fueling_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users not null,
  run_date date not null,
  run_type text not null,
  distance text,
  duration text,
  rating int,
  notes text,
  created_at timestamptz default now()
);

alter table fueling_logs enable row level security;

drop policy if exists "Fueling logs are user-owned" on fueling_logs;

create policy "Fueling logs are user-owned"
  on fueling_logs for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Fueling gels catalog (public reference data)
create table if not exists fuel_gels (
  id uuid primary key default gen_random_uuid(),
  item_key text not null,
  brand text not null,
  name text not null,
  carbs_g numeric,
  caffeine_mg numeric,
  sodium_mg numeric,
  calories numeric,
  flavors text[] default '{}',
  notes text,
  image_url text,
  image_source text,
  product_url text,
  is_active boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create unique index if not exists fuel_gels_unique
  on fuel_gels (item_key);

alter table fuel_gels enable row level security;

drop policy if exists "Fuel gels are public" on fuel_gels;

create policy "Fuel gels are public"
  on fuel_gels for select
  using (true);

-- Training logs
create table if not exists training_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users not null,
  workout_date date not null,
  workout_type text not null,
  distance text,
  time text,
  effort int,
  notes text,
  created_at timestamptz default now()
);

alter table training_logs enable row level security;

drop policy if exists "Training logs are user-owned" on training_logs;

create policy "Training logs are user-owned"
  on training_logs for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Shoe catalog (canonical list + imagery)
create table if not exists shoe_models (
  id uuid primary key default gen_random_uuid(),
  item_key text not null,
  name text not null,
  brand text not null,
  price numeric,
  usage_types text[] default '{}',
  foot_strike text[] default '{}',
  cadence text[] default '{}',
  toe_box text,
  cushion text,
  stability text,
  surfaces text[] default '{}',
  weight_range text,
  stack numeric,
  drop numeric,
  weight_mens numeric,
  weight_womens numeric,
  description text,
  pros text[] default '{}',
  cons text[] default '{}',
  popularity int default 0,
  release_date date,
  release_year int,
  image_url text,
  image_path text,
  image_source text,
  product_url text,
  retailer_url text,
  is_active boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create unique index if not exists shoe_models_unique
  on shoe_models (item_key);

alter table shoe_models enable row level security;

drop policy if exists "Shoe models are public" on shoe_models;

create policy "Shoe models are public"
  on shoe_models for select
  using (true);

-- Attire catalog (full specs + imagery)
create table if not exists attire_items (
  id uuid primary key default gen_random_uuid(),
  item_key text not null,
  name text not null,
  brand text not null,
  category text not null,
  gender text not null,
  price numeric,
  personas text[] default '{}',
  weather text[] default '{}',
  features text[] default '{}',
  image_url text,
  image_path text,
  image_source text,
  product_url text,
  retailer_url text,
  is_active boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create unique index if not exists attire_items_unique
  on attire_items (item_key);

alter table attire_items enable row level security;

drop policy if exists "Attire items are public" on attire_items;

create policy "Attire items are public"
  on attire_items for select
  using (true);

-- Shoe candidates discovered from Reddit (not yet in catalog)
create table if not exists shoe_candidates (
  id uuid primary key default gen_random_uuid(),
  item_key text not null,
  name text not null,
  brand text,
  mention_count int default 1,
  mention_score numeric default 0,
  first_seen timestamptz default now(),
  last_seen timestamptz default now(),
  last_title text,
  last_url text,
  status text default 'pending',
  created_at timestamptz default now()
);

create unique index if not exists shoe_candidates_unique
  on shoe_candidates (item_key);

alter table shoe_candidates enable row level security;

drop policy if exists "Shoe candidates are public" on shoe_candidates;

create policy "Shoe candidates are public"
  on shoe_candidates for select
  using (true);

-- Storage bucket for shoe imagery
insert into storage.buckets (id, name, public)
values ('shoe-images', 'shoe-images', true)
on conflict (id) do update
  set name = excluded.name,
      public = excluded.public;

alter table storage.objects enable row level security;

drop policy if exists "Public read for shoe images" on storage.objects;

create policy "Public read for shoe images"
  on storage.objects for select
  using (bucket_id = 'shoe-images');
