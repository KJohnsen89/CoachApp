-- ============================================================
-- Trænerportalen — Migration 6
-- Admin kan slette andres indhold, valgfri notifikation pr. indlæg,
-- referater og klub-regler/filosofi
-- Forudsætter at migration 5 ER KØRT (bruger is_approved()/is_admin_user())
-- Kør hele dette script i Supabase: SQL Editor → New query → Run
-- ============================================================

-- 1) Valgfri e-mail-notifikation pr. indlæg (i stedet for kun globale indstillinger)
alter table posts add column if not exists notify boolean not null default true;
alter table trainings add column if not exists notify boolean not null default true;
alter table forum_threads add column if not exists notify boolean not null default true;

-- 2) Admin kan slette andres indhold (tidligere kun opretteren selv)
drop policy if exists "delete own posts" on posts;
create policy "delete own posts" on posts for delete to authenticated using (is_approved() and (auth.uid() = author_id or is_admin_user()));

drop policy if exists "delete own trainings" on trainings;
create policy "delete own trainings" on trainings for delete to authenticated using (is_approved() and (auth.uid() = created_by or is_admin_user()));

drop policy if exists "delete own threads" on forum_threads;
create policy "delete own threads" on forum_threads for delete to authenticated using (is_approved() and (auth.uid() = author_id or is_admin_user()));

drop policy if exists "delete own replies" on forum_replies;
create policy "delete own replies" on forum_replies for delete to authenticated using (is_approved() and (auth.uid() = author_id or is_admin_user()));

-- 3) Referater fra trænermøder
create table if not exists referater (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  meeting_date date,
  body text not null default '',
  images jsonb not null default '[]',
  links jsonb not null default '[]',
  created_by uuid not null references auth.users(id),
  created_by_name text not null,
  created_at timestamptz not null default now()
);
alter table referater enable row level security;
drop policy if exists "read referater" on referater;
drop policy if exists "insert referater" on referater;
drop policy if exists "update referater" on referater;
drop policy if exists "delete referater" on referater;
create policy "read referater" on referater for select to authenticated using (is_approved());
create policy "insert referater" on referater for insert to authenticated with check (is_approved() and auth.uid() = created_by);
create policy "update referater" on referater for update to authenticated using (is_approved() and (auth.uid() = created_by or is_admin_user()));
create policy "delete referater" on referater for delete to authenticated using (is_approved() and (auth.uid() = created_by or is_admin_user()));

-- 4) Klub-regler og filosofi (kun admin må oprette/rette/slette — alle godkendte kan læse)
create table if not exists club_rules (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  category text,
  body text not null default '',
  created_by uuid not null references auth.users(id),
  updated_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);
alter table club_rules enable row level security;
drop policy if exists "read club rules" on club_rules;
drop policy if exists "admin insert club rules" on club_rules;
drop policy if exists "admin update club rules" on club_rules;
drop policy if exists "admin delete club rules" on club_rules;
create policy "read club rules" on club_rules for select to authenticated using (is_approved());
create policy "admin insert club rules" on club_rules for insert to authenticated with check (is_approved() and is_admin_user());
create policy "admin update club rules" on club_rules for update to authenticated using (is_approved() and is_admin_user());
create policy "admin delete club rules" on club_rules for delete to authenticated using (is_approved() and is_admin_user());
