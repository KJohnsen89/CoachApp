-- ============================================================
-- Trænerportalen — Migration 7
-- Fjerner e-mail-notifikationsfunktionen helt (tabel og kolonner)
-- Kør hele dette script i Supabase: SQL Editor → New query → Run
-- ============================================================

drop table if exists notification_settings;

alter table posts drop column if exists notify;
alter table trainings drop column if exists notify;
alter table forum_threads drop column if exists notify;
