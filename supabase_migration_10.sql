-- ============================================================
-- Trænerportalen — Migration 10
-- Billeder og links flyttes fra hele træningen til den enkelte øvelse
-- Kør hele dette script i Supabase: SQL Editor → New query → Run
-- ============================================================

-- Øvelser i banken skal også kunne have billeder og links,
-- så de følger med når man genbruger dem.
alter table exercise_bank add column if not exists images jsonb not null default '[]';
alter table exercise_bank add column if not exists links jsonb not null default '[]';

-- Bemærk: selve træningernes øvelser ligger som en JSON-liste i kolonnen
-- trainings.exercises, så der skal ikke ændres noget i databasestrukturen
-- for dem — hver øvelse får bare "images" og "links" med i sit JSON-objekt.
--
-- trainings.images og trainings.links (hele-træningen-niveau) røres ikke —
-- gamle træninger med billeder/links dér beholder dem og vises stadig,
-- men nye billeder/links tilføjes fremover pr. øvelse i stedet.
