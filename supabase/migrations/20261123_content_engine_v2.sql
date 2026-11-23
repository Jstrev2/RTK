-- Content engine v2 (November 23, 2026): richer songs, user-added songs,
-- product types and images for fuel. Safe to run more than once.

alter table music_songs add column if not exists isrc text;
alter table music_songs add column if not exists deezer_id bigint;
alter table music_songs add column if not exists image_url text;
alter table music_songs add column if not exists preview_url text;
alter table music_songs add column if not exists album text;
alter table music_songs add column if not exists duration_ms integer;
alter table music_songs add column if not exists popularity integer;
alter table music_songs add column if not exists bpm_source text;
alter table music_songs add column if not exists bpm_checked_at timestamptz;
alter table music_songs add column if not exists added_by uuid references auth.users on delete set null;

create unique index if not exists music_songs_isrc_unique on music_songs (isrc) where isrc is not null;
create index if not exists music_songs_bpm_idx on music_songs (bpm);
create index if not exists music_songs_popularity_idx on music_songs (popularity desc nulls last);

alter table fuel_gels add column if not exists product_type text;
alter table fuel_gels add column if not exists serving_size text;
alter table fuel_gels add column if not exists price_usd numeric;
alter table fuel_gels add column if not exists release_note text;

alter table shoe_models add column if not exists image_alt text;

-- Songs a runner adds to their own playlists (the song itself lives in music_songs).
create table if not exists user_songs (
  user_id uuid references auth.users on delete cascade not null,
  song_id uuid references music_songs (id) on delete cascade not null,
  created_at timestamptz default now(),
  primary key (user_id, song_id)
);
alter table user_songs enable row level security;
drop policy if exists "User songs are user-owned" on user_songs;
create policy "User songs are user-owned" on user_songs for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

notify pgrst, 'reload schema';
