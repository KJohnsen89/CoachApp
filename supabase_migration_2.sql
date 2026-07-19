-- ============================================================
-- Trænerportalen — Migration 2: Spillere, billeder, links,
-- notifikationsindstillinger og storage
-- Kør hele dette script i Supabase: SQL Editor → New query → Run
-- ============================================================

-- 1) Nye kolonner på trainings: billeder og links
alter table trainings add column if not exists images jsonb not null default '[]';
alter table trainings add column if not exists links jsonb not null default '[]';

-- 2) Spillere
create table if not exists players (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  category text not null check (category in ('A','B','C')),
  position text,
  team_id uuid references teams(id) on delete set null,
  movement text check (movement in ('op','ned')),
  created_by uuid not null references auth.users(id),
  created_at timestamptz not null default now()
);

alter table players enable row level security;

drop policy if exists "read players" on players;
drop policy if exists "insert players" on players;
drop policy if exists "update players" on players;
drop policy if exists "delete players" on players;

create policy "read players" on players for select to authenticated using (true);
create policy "insert players" on players for insert to authenticated with check (auth.uid() = created_by);
-- Alle trænere må flytte/rette/slette spillere, så holdene kan holdes ajour
create policy "update players" on players for update to authenticated using (true);
create policy "delete players" on players for delete to authenticated using (true);

-- 3) Notifikationsindstillinger pr. træner
create table if not exists notification_settings (
  user_id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  display_name text,
  notify_posts boolean not null default false,
  notify_trainings boolean not null default false,
  notify_forum boolean not null default false,
  updated_at timestamptz not null default now()
);

alter table notification_settings enable row level security;

drop policy if exists "read own settings" on notification_settings;
drop policy if exists "upsert own settings" on notification_settings;
drop policy if exists "update own settings" on notification_settings;

create policy "read own settings" on notification_settings for select to authenticated using (auth.uid() = user_id);
create policy "upsert own settings" on notification_settings for insert to authenticated with check (auth.uid() = user_id);
create policy "update own settings" on notification_settings for update to authenticated using (auth.uid() = user_id);

-- 4) Storage-bucket til træningsbilleder
insert into storage.buckets (id, name, public)
values ('traeningsbilleder', 'traeningsbilleder', true)
on conflict (id) do nothing;

drop policy if exists "read training images" on storage.objects;
drop policy if exists "upload training images" on storage.objects;
drop policy if exists "delete training images" on storage.objects;

create policy "read training images" on storage.objects
  for select using (bucket_id = 'traeningsbilleder');

create policy "upload training images" on storage.objects
  for insert to authenticated with check (bucket_id = 'traeningsbilleder');

create policy "delete training images" on storage.objects
  for delete to authenticated using (bucket_id = 'traeningsbilleder');
