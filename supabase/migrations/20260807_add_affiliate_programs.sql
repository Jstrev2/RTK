-- Partner/affiliate outreach tracker, managed through /internal/partners.
-- RLS is enabled with no policies on purpose: only the service role (used by
-- /api/admin/partners after an admin-email check) can read or write.

create table if not exists affiliate_programs (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  network text,
  category text not null default 'shoes',
  status text not null default 'researching',
  commission text,
  cookie_window text,
  signup_url text,
  contact text,
  env_var text,
  notes text,
  priority int not null default 100,
  applied_at date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table affiliate_programs enable row level security;
