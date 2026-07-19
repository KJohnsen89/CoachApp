-- ============================================================
-- Trænerportalen — Migration 3
-- Flere positioner pr. spiller, deltagelse på træninger,
-- billeder/links på opslag og forum
-- Kør hele dette script i Supabase: SQL Editor → New query → Run
-- ============================================================

-- 1) Spillere: skift fra én 'position' (text) til flere 'positions' (jsonb-liste)
alter table players add column if not exists positions jsonb not null default '[]';

-- Flyt eksisterende enkelt-position over i den nye liste (hvis der er data)
update players
  set positions = to_jsonb(array[position])
  where position is not null and position <> '' and positions = '[]';

-- (Vi beholder den gamle 'position'-kolonne for en sikkerheds skyld — den bruges bare ikke længere)

-- 2) Deltagelse på træninger ("Jeg deltager")
create table if not exists training_attendance (
  training_id uuid not null references trainings(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  user_name text not null,
  status text not null check (status in ('kommer','kommer_ikke')),
  updated_at timestamptz not null default now(),
  primary key (training_id, user_id)
);

alter table training_attendance enable row level security;

drop policy if exists "read attendance" on training_attendance;
drop policy if exists "insert own attendance" on training_attendance;
drop policy if exists "update own attendance" on training_attendance;
drop policy if exists "delete own attendance" on training_attendance;

create policy "read attendance" on training_attendance for select to authenticated using (true);
create policy "insert own attendance" on training_attendance for insert to authenticated with check (auth.uid() = user_id);
create policy "update own attendance" on training_attendance for update to authenticated using (auth.uid() = user_id);
create policy "delete own attendance" on training_attendance for delete to authenticated using (auth.uid() = user_id);

-- 3) Serie-id på træninger (så gentagne træninger hænger sammen)
alter table trainings add column if not exists series_id uuid;

-- 4) Billeder og links på opslag
alter table posts add column if not exists images jsonb not null default '[]';
alter table posts add column if not exists links jsonb not null default '[]';

-- 5) Billeder og links på forum-diskussioner og -svar
alter table forum_threads add column if not exists images jsonb not null default '[]';
alter table forum_threads add column if not exists links jsonb not null default '[]';
alter table forum_replies add column if not exists images jsonb not null default '[]';
alter table forum_replies add column if not exists links jsonb not null default '[]';

-- 6) Genbrug billed-bucket til alle billeder (opslag, forum, træning)
--    Bucket'en 'traeningsbilleder' findes allerede fra migration 2.
--    Den bruges nu til alle billeder i appen.
