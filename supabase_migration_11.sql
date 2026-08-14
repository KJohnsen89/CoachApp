-- ============================================================
-- Trænerportalen — Migration 11
-- Forum fjernes; kommentarer tilføjes til opslag i stedet
-- Kør hele dette script i Supabase: SQL Editor → New query → Run
-- ============================================================

-- 1) Kommentarer til opslag (Facebook-agtigt: sidste kommentar vises i feedet,
--    klik ind for at se alle)
create table if not exists post_comments (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references posts(id) on delete cascade,
  body text not null,
  author_id uuid not null references auth.users(id),
  author_name text not null,
  created_at timestamptz not null default now()
);

alter table post_comments enable row level security;

drop policy if exists "read post comments" on post_comments;
drop policy if exists "insert post comments" on post_comments;
drop policy if exists "delete post comments" on post_comments;
create policy "read post comments" on post_comments for select to authenticated using (is_approved());
create policy "insert post comments" on post_comments for insert to authenticated with check (is_approved() and auth.uid() = author_id);
create policy "delete post comments" on post_comments for delete to authenticated using (is_approved() and (auth.uid() = author_id or is_admin_user()));

-- 2) Fjern forum helt (tråde, svar og "set af"-tabellen for tråde)
drop table if exists thread_views cascade;
drop table if exists forum_replies cascade;
drop table if exists forum_threads cascade;
