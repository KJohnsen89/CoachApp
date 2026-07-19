-- ============================================================
-- Trænerportalen — Supabase database-opsætning
-- Kør hele dette script i Supabase: SQL Editor → New query → Run
-- ============================================================

-- Opslag (forsiden)
create table posts (
  id uuid primary key default gen_random_uuid(),
  body text not null,
  author_name text not null,
  author_id uuid not null references auth.users(id),
  created_at timestamptz not null default now()
);

-- Hold
create table teams (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  age_group text,
  trainers text,
  notes text,
  created_by uuid not null references auth.users(id),
  created_at timestamptz not null default now()
);

-- Træninger med øvelser (øvelser gemmes som JSON-liste)
create table trainings (
  id uuid primary key default gen_random_uuid(),
  team_name text not null,
  date date not null,
  time time,
  place text,
  theme text,
  exercises jsonb not null default '[]',
  created_by uuid not null references auth.users(id),
  created_by_name text not null,
  created_at timestamptz not null default now()
);

-- Forum: diskussioner
create table forum_threads (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  body text,
  author_name text not null,
  author_id uuid not null references auth.users(id),
  created_at timestamptz not null default now()
);

-- Forum: svar
create table forum_replies (
  id uuid primary key default gen_random_uuid(),
  thread_id uuid not null references forum_threads(id) on delete cascade,
  body text not null,
  author_name text not null,
  author_id uuid not null references auth.users(id),
  created_at timestamptz not null default now()
);

-- ============================================================
-- Sikkerhed (Row Level Security)
-- Alle indloggede trænere kan læse alt og oprette indhold.
-- Man kan kun slette/rette sit eget indhold.
-- ============================================================

alter table posts enable row level security;
alter table teams enable row level security;
alter table trainings enable row level security;
alter table forum_threads enable row level security;
alter table forum_replies enable row level security;

-- posts
create policy "read posts" on posts for select to authenticated using (true);
create policy "insert posts" on posts for insert to authenticated with check (auth.uid() = author_id);
create policy "delete own posts" on posts for delete to authenticated using (auth.uid() = author_id);

-- teams (alle må slette hold, så oversigten kan holdes ren)
create policy "read teams" on teams for select to authenticated using (true);
create policy "insert teams" on teams for insert to authenticated with check (auth.uid() = created_by);
create policy "update teams" on teams for update to authenticated using (true);
create policy "delete teams" on teams for delete to authenticated using (true);

-- trainings
create policy "read trainings" on trainings for select to authenticated using (true);
create policy "insert trainings" on trainings for insert to authenticated with check (auth.uid() = created_by);
create policy "update own trainings" on trainings for update to authenticated using (auth.uid() = created_by);
create policy "delete own trainings" on trainings for delete to authenticated using (auth.uid() = created_by);

-- forum_threads
create policy "read threads" on forum_threads for select to authenticated using (true);
create policy "insert threads" on forum_threads for insert to authenticated with check (auth.uid() = author_id);
create policy "delete own threads" on forum_threads for delete to authenticated using (auth.uid() = author_id);

-- forum_replies
create policy "read replies" on forum_replies for select to authenticated using (true);
create policy "insert replies" on forum_replies for insert to authenticated with check (auth.uid() = author_id);
create policy "delete own replies" on forum_replies for delete to authenticated using (auth.uid() = author_id);
