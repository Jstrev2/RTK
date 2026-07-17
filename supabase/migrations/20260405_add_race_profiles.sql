create table if not exists public.race_profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users (id) on delete cascade,
  goal_race text,
  race_date date,
  target_time text,
  goal_notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.race_profiles enable row level security;

create policy "Users can view their own race profile"
on public.race_profiles
for select
using (auth.uid() = user_id);

create policy "Users can insert their own race profile"
on public.race_profiles
for insert
with check (auth.uid() = user_id);

create policy "Users can update their own race profile"
on public.race_profiles
for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "Users can delete their own race profile"
on public.race_profiles
for delete
using (auth.uid() = user_id);

create or replace function public.set_race_profiles_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

DROP TRIGGER IF EXISTS set_race_profiles_updated_at ON public.race_profiles;

create trigger set_race_profiles_updated_at
before update on public.race_profiles
for each row
execute function public.set_race_profiles_updated_at();
