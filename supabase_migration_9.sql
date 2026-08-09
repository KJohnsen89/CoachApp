-- ============================================================
-- Trænerportalen — Migration 9
-- Øvelsesbank: genbrugelige træningsøvelser med kategorier
-- Kør hele dette script i Supabase: SQL Editor → New query → Run
-- ============================================================

create table if not exists exercise_categories (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now()
);

create table if not exists exercise_bank (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  category_id uuid references exercise_categories(id) on delete set null,
  minutes integer,
  description text default '',
  created_by uuid not null references auth.users(id),
  created_by_name text not null,
  created_at timestamptz not null default now()
);

alter table exercise_categories enable row level security;
alter table exercise_bank enable row level security;

-- Kategorier og øvelser er fælles klub-ressourcer — alle godkendte trænere
-- må oprette/rette/slette, ligesom med hold og spillere.

drop policy if exists "read categories" on exercise_categories;
drop policy if exists "insert categories" on exercise_categories;
drop policy if exists "delete categories" on exercise_categories;
create policy "read categories" on exercise_categories for select to authenticated using (is_approved());
create policy "insert categories" on exercise_categories for insert to authenticated with check (is_approved());
create policy "delete categories" on exercise_categories for delete to authenticated using (is_approved());

drop policy if exists "read bank exercises" on exercise_bank;
drop policy if exists "insert bank exercises" on exercise_bank;
drop policy if exists "update bank exercises" on exercise_bank;
drop policy if exists "delete bank exercises" on exercise_bank;
create policy "read bank exercises" on exercise_bank for select to authenticated using (is_approved());
create policy "insert bank exercises" on exercise_bank for insert to authenticated with check (is_approved() and auth.uid() = created_by);
create policy "update bank exercises" on exercise_bank for update to authenticated using (is_approved());
create policy "delete bank exercises" on exercise_bank for delete to authenticated using (is_approved());

-- Forudfyld 5 standardkategorier
insert into exercise_categories (name) values
  ('Interval'),
  ('Pasning'),
  ('Presspil'),
  ('Opvarming'),
  ('Skud')
on conflict (name) do nothing;
