-- ============================================================
-- Trænerportalen — Migration 5
-- Godkendelse af nye brugere (admin), "set af" på opslag/forum
-- Kør hele dette script i Supabase: SQL Editor → New query → Run
-- ============================================================

-- 1) Profiler: status (afventer/godkendt/afvist) og admin-rettighed
create table if not exists profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  display_name text,
  status text not null default 'pending' check (status in ('pending','approved','rejected')),
  is_admin boolean not null default false,
  created_at timestamptz not null default now()
);

alter table profiles enable row level security;

-- 2) Hjælpefunktioner (bruges i adgangsregler nedenfor).
--    security definer betyder at funktionen selv må læse 'profiles',
--    så vi undgår at reglerne "bider sig selv i halen".
create or replace function is_admin_user()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select coalesce((select is_admin from profiles where user_id = auth.uid()), false);
$$;

create or replace function is_approved()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select coalesce((select status = 'approved' from profiles where user_id = auth.uid()), false);
$$;

-- 3) Adgangsregler for profiles
drop policy if exists "read own profile" on profiles;
drop policy if exists "admin read all profiles" on profiles;
drop policy if exists "admin update profiles" on profiles;

create policy "read own profile" on profiles for select to authenticated using (auth.uid() = user_id);
create policy "admin read all profiles" on profiles for select to authenticated using (is_admin_user());
create policy "admin update profiles" on profiles for update to authenticated using (is_admin_user());

-- Bemærk: der findes bevidst INGEN "insert"-regel for almindelige brugere.
-- Den eneste måde en profil-række oprettes på, er via trigger'en nedenfor —
-- det forhindrer at nogen selv kan sætte sig op som godkendt/admin.

-- 4) Automatisk profil når en ny bruger opretter sig (starter som 'pending')
create or replace function handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (user_id, email, display_name, status, is_admin)
  values (new.id, new.email, new.raw_user_meta_data->>'display_name', 'pending', false)
  on conflict (user_id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();

-- 5) Godkend automatisk alle EKSISTERENDE brugere (dem der allerede bruger appen i dag),
--    så ingen bliver låst ude af denne opdatering.
insert into profiles (user_id, email, display_name, status, is_admin)
select id, email, raw_user_meta_data->>'display_name', 'approved', false
from auth.users
on conflict (user_id) do nothing;

-- 6) Opdatér adgangsregler, så kun godkendte brugere kan læse/skrive appens data

-- posts
drop policy if exists "read posts" on posts;
drop policy if exists "insert posts" on posts;
drop policy if exists "delete own posts" on posts;
create policy "read posts" on posts for select to authenticated using (is_approved());
create policy "insert posts" on posts for insert to authenticated with check (is_approved() and auth.uid() = author_id);
create policy "delete own posts" on posts for delete to authenticated using (is_approved() and auth.uid() = author_id);

-- teams
drop policy if exists "read teams" on teams;
drop policy if exists "insert teams" on teams;
drop policy if exists "update teams" on teams;
drop policy if exists "delete teams" on teams;
create policy "read teams" on teams for select to authenticated using (is_approved());
create policy "insert teams" on teams for insert to authenticated with check (is_approved() and auth.uid() = created_by);
create policy "update teams" on teams for update to authenticated using (is_approved());
create policy "delete teams" on teams for delete to authenticated using (is_approved());

-- players
drop policy if exists "read players" on players;
drop policy if exists "insert players" on players;
drop policy if exists "update players" on players;
drop policy if exists "delete players" on players;
create policy "read players" on players for select to authenticated using (is_approved());
create policy "insert players" on players for insert to authenticated with check (is_approved() and auth.uid() = created_by);
create policy "update players" on players for update to authenticated using (is_approved());
create policy "delete players" on players for delete to authenticated using (is_approved());

-- trainings
drop policy if exists "read trainings" on trainings;
drop policy if exists "insert trainings" on trainings;
drop policy if exists "update own trainings" on trainings;
drop policy if exists "delete own trainings" on trainings;
create policy "read trainings" on trainings for select to authenticated using (is_approved());
create policy "insert trainings" on trainings for insert to authenticated with check (is_approved() and auth.uid() = created_by);
create policy "update own trainings" on trainings for update to authenticated using (is_approved() and auth.uid() = created_by);
create policy "delete own trainings" on trainings for delete to authenticated using (is_approved() and auth.uid() = created_by);

-- forum_threads
drop policy if exists "read threads" on forum_threads;
drop policy if exists "insert threads" on forum_threads;
drop policy if exists "delete own threads" on forum_threads;
create policy "read threads" on forum_threads for select to authenticated using (is_approved());
create policy "insert threads" on forum_threads for insert to authenticated with check (is_approved() and auth.uid() = author_id);
create policy "delete own threads" on forum_threads for delete to authenticated using (is_approved() and auth.uid() = author_id);

-- forum_replies
drop policy if exists "read replies" on forum_replies;
drop policy if exists "insert replies" on forum_replies;
drop policy if exists "delete own replies" on forum_replies;
create policy "read replies" on forum_replies for select to authenticated using (is_approved());
create policy "insert replies" on forum_replies for insert to authenticated with check (is_approved() and auth.uid() = author_id);
create policy "delete own replies" on forum_replies for delete to authenticated using (is_approved() and auth.uid() = author_id);

-- training_attendance
drop policy if exists "read attendance" on training_attendance;
drop policy if exists "insert own attendance" on training_attendance;
drop policy if exists "update own attendance" on training_attendance;
drop policy if exists "delete own attendance" on training_attendance;
create policy "read attendance" on training_attendance for select to authenticated using (is_approved());
create policy "insert own attendance" on training_attendance for insert to authenticated with check (is_approved() and auth.uid() = user_id);
create policy "update own attendance" on training_attendance for update to authenticated using (is_approved() and auth.uid() = user_id);
create policy "delete own attendance" on training_attendance for delete to authenticated using (is_approved() and auth.uid() = user_id);

-- storage: kun godkendte må uploade/slette billeder (læsning forbliver åben, da bucket'en er offentlig)
drop policy if exists "upload training images" on storage.objects;
drop policy if exists "delete training images" on storage.objects;
create policy "upload training images" on storage.objects for insert to authenticated with check (bucket_id = 'traeningsbilleder' and is_approved());
create policy "delete training images" on storage.objects for delete to authenticated using (bucket_id = 'traeningsbilleder' and is_approved());

-- 7) "Set af" på opslag
create table if not exists post_views (
  post_id uuid not null references posts(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  user_name text not null,
  viewed_at timestamptz not null default now(),
  primary key (post_id, user_id)
);
alter table post_views enable row level security;
drop policy if exists "read post views" on post_views;
drop policy if exists "insert own post view" on post_views;
drop policy if exists "update own post view" on post_views;
create policy "read post views" on post_views for select to authenticated using (is_approved());
create policy "insert own post view" on post_views for insert to authenticated with check (is_approved() and auth.uid() = user_id);
create policy "update own post view" on post_views for update to authenticated using (is_approved() and auth.uid() = user_id);

-- 8) "Set af" på forum-diskussioner
create table if not exists thread_views (
  thread_id uuid not null references forum_threads(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  user_name text not null,
  viewed_at timestamptz not null default now(),
  primary key (thread_id, user_id)
);
alter table thread_views enable row level security;
drop policy if exists "read thread views" on thread_views;
drop policy if exists "insert own thread view" on thread_views;
drop policy if exists "update own thread view" on thread_views;
create policy "read thread views" on thread_views for select to authenticated using (is_approved());
create policy "insert own thread view" on thread_views for insert to authenticated with check (is_approved() and auth.uid() = user_id);
create policy "update own thread view" on thread_views for update to authenticated using (is_approved() and auth.uid() = user_id);

-- ============================================================
-- ⚠️ SIDSTE SKRIDT — SPRING IKKE OVER:
-- Kør denne linje for sig selv, med DIN egen login-mail, for at
-- gøre dig selv til administrator. Uden dette kan ingen godkende
-- nye trænere.
--
-- update profiles set is_admin = true
--   where user_id = (select id from auth.users where email = 'din-email@example.dk');
-- ============================================================
