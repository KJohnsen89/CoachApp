# Opdatering til version 3 — sådan gør du

Version 3 tilføjer:
- **Spillere:** redigér spillere (skift kategori/positioner), og flere positioner pr. spiller (fx både målmand og forsvar). Positioner vælges fra en fast liste (Målmand, Forsvar, Midtbane, Angreb) med mulighed for at tilføje egne.
- **Træning:** "Jeg deltager / Jeg kommer ikke"-knap på hver træning, så I kan se hvem der kommer. Mulighed for at oprette en træning som **serie** (samme ugedag hver uge i X uger).
- **Forum:** billeder og links på både diskussioner og svar.
- **Opslag:** billeder og links.

## Trin 1: Opdatér databasen i Supabase (gør dette FØRST)

1. Log ind på **supabase.com** → dit projekt → **SQL Editor** → **New query**
2. Kopiér HELE indholdet af **`supabase_migration_3.sql`** ind og klik **Run**
3. Dine eksisterende data røres ikke. (Har en spiller allerede en enkelt position, flyttes den automatisk over i den nye "flere positioner"-liste.)

## Trin 2: Upload de nye/ændrede filer til GitHub

**Ny fil:**
- `src/components/MediaFields.jsx`
- `supabase_migration_3.sql`

**Ændrede filer (erstattes):**
- `src/pages/Home.jsx`
- `src/pages/Teams.jsx`
- `src/pages/Trainings.jsx`
- `src/pages/TrainingDetail.jsx`
- `src/pages/Forum.jsx`
- `src/pages/Thread.jsx`

Nemmeste måde: gå til dit repository → **Add file → Upload files** → træk hele den udpakkede `traener-app`-mappes indhold ind → skriv "Version 3" → **Commit changes**.

⚠️ Husk at trykke den grønne **Commit changes**-knap til sidst — ellers gemmes uploadet ikke (det var den, der drillede sidst).

## Trin 3: Vent på Vercel

Vercel bygger automatisk den nye version (1-2 min). Genindlæs derefter din app med et hard refresh:
- Safari: **Cmd + Option + R**
- Chrome: **Cmd + Shift + R**

## Test-tjekliste

- [ ] Redigér en spiller (blyant-ikonet ✎) → skift kategori og tilføj en ekstra position → gem
- [ ] Opret en spiller med både "Målmand" og "Forsvar"
- [ ] Tilføj en egen position (skriv i feltet + Tilføj)
- [ ] Opret en træning → sæt flueben i "Gentag som serie" → vælg en mandag som startdato → 4 stk → se at der oprettes 4 mandage
- [ ] Klik ind på en træning → tryk "Jeg deltager" → dit navn dukker op under "Kommer"
- [ ] Skriv et opslag med et billede og et link
- [ ] Opret en forum-diskussion med et billede → åbn den → svar med et billede

## Om notifikationer

E-mail-notifikationerne (fra version 2) dækker automatisk også de nye ting, når du har sat dem op via `NOTIFIKATIONER_GUIDE.md`. Der skal ikke ændres noget der.
