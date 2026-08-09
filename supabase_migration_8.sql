-- ============================================================
-- Trænerportalen — Migration 8
-- Push-notifikationer (til hjemmeskærm-appen, uden domæne/e-mail)
-- Forudsætter at migration 5 ER KØRT (bruger is_approved())
-- Kør hele dette script i Supabase: SQL Editor → New query → Run
-- ============================================================

create table if not exists push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  endpoint text not null unique,
  p256dh text not null,
  auth text not null,
  created_at timestamptz not null default now()
);

alter table push_subscriptions enable row level security;

drop policy if exists "read own subscriptions" on push_subscriptions;
drop policy if exists "insert own subscription" on push_subscriptions;
drop policy if exists "update own subscription" on push_subscriptions;
drop policy if exists "delete own subscription" on push_subscriptions;

create policy "read own subscriptions" on push_subscriptions for select to authenticated using (auth.uid() = user_id);
create policy "insert own subscription" on push_subscriptions for insert to authenticated with check (is_approved() and auth.uid() = user_id);
create policy "update own subscription" on push_subscriptions for update to authenticated using (auth.uid() = user_id);
create policy "delete own subscription" on push_subscriptions for delete to authenticated using (auth.uid() = user_id);
