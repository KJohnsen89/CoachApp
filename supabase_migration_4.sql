-- ============================================================
-- Trænerportalen — Migration 4
-- Spiller-side (venstre/midt/højre/ikke aktuelt)
-- Kør hele dette script i Supabase: SQL Editor → New query → Run
-- ============================================================

alter table players add column if not exists side text not null default 'ikke_aktuelt';

alter table players drop constraint if exists players_side_check;
alter table players add constraint players_side_check
  check (side in ('ikke_aktuelt', 'venstre', 'midt', 'hojre'));

-- Bemærk: ingen ændringer er nødvendige for at kunne redigere træninger/serier —
-- det bruger de tabeller og rettigheder, der allerede findes.
