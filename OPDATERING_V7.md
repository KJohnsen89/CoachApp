# Opdatering til version 7 — fjerner e-mail-notifikationer

Denne opdatering fjerner alt omkring e-mail-notifikationer, som du bad om. Ingen af de andre funktioner er rørt.

**Fjernet:**
- Fluebenet "Send e-mail-notifikation" ved oprettelse af opslag, træninger og forum-diskussioner
- Sektionen "E-mail-notifikationer" under Indstillinger (kun "Skift adgangskode" er tilbage der nu)
- Den ubrugte Edge Function-mappe og notifikations-guiden
- Database-tabellen og -kolonnerne, der understøttede det

## Trin 1: Kør oprydnings-migrationen i Supabase

1. **supabase.com** → dit projekt → **SQL Editor** → **New query**
2. Kopiér HELE indholdet af **`supabase_migration_7.sql`** ind og klik **Run**

## Trin 2: Upload de ændrede filer til GitHub

**Ændrede filer:**
- `src/pages/Home.jsx`
- `src/pages/Trainings.jsx`
- `src/pages/Forum.jsx`
- `src/pages/Settings.jsx`

**Fjernet fra projektet** (kan roligt slettes fra dit GitHub-repository, men gør ingen skade at lade ligge, hvis du ikke gider rydde op der også):
- `supabase/functions/send-notification/` (hele mappen)
- `NOTIFIKATIONER_GUIDE.md`

Upload de ændrede filer som vanligt → commit direkte til main → vent på Vercel → hard refresh.

## Test

- [ ] Gå til **Indstillinger** → bekræft at kun "Skift adgangskode" vises
- [ ] Opret et opslag/en træning/en forum-diskussion → bekræft at der ikke længere er et notifikations-flueben
