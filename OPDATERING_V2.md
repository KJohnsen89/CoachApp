# Opdatering til version 2 — sådan gør du

Version 2 tilføjer: klikbare træninger med detaljeside, billeder og links på træninger, 24-timers tid, "Kopiér til ny træning", spillere med kategori (A/B/C) og position, træk-og-slip mellem hold, op-/nedrykker-markeringer (max 2 af hver pr. hold), slet hold, og e-mail-notifikationsindstillinger.

## Trin 1: Opdatér databasen i Supabase (VIGTIGT — gør dette først)

1. Log ind på **supabase.com** → dit projekt
2. Gå til **SQL Editor** → **New query**
3. Kopiér HELE indholdet af filen **`supabase_migration_2.sql`** ind og klik **Run**
   - Den opretter spiller-tabellen, notifikationsindstillinger, billed-lageret og tilføjer billeder/links til træninger
   - Dine eksisterende data (opslag, hold, træninger, forum) røres ikke

## Trin 2: Upload de nye filer til GitHub

Disse filer er **nye**:
- `src/pages/TrainingDetail.jsx`
- `src/pages/Settings.jsx`

Disse filer er **ændrede** (skal erstattes):
- `src/App.jsx`
- `src/pages/Trainings.jsx`
- `src/pages/Teams.jsx`
- `src/styles.css`

Nemmeste måde i browseren:
1. Gå til dit repository på GitHub
2. Klik **Add file → Upload files**
3. Træk hele den udpakkede projektmappes indhold ind igen (GitHub overskriver de eksisterende filer og tilføjer de nye)
4. Skriv "Version 2" i commit-beskeden → **Commit changes**

## Trin 3: Vent på Vercel

Vercel opdager selv ændringen på GitHub og bygger en ny version automatisk (1-2 min). Du behøver ikke gøre noget — genindlæs bare din app-URL bagefter.

## Trin 4 (valgfrit, senere): E-mail-afsendelse

Afkrydsningsfelterne under **Indstillinger** (tandhjulet ⚙︎ øverst) virker nu, men der sendes først rigtige e-mails, når du følger **`NOTIFIKATIONER_GUIDE.md`**. Det kan sagtens vente — resten af appen er uafhængig af det.

## Hurtig test-tjekliste

- [ ] Opret en træning med tid (fx 18:00), et link og et billede
- [ ] Klik på træningen i listen → detaljesiden åbner med billede og link
- [ ] Klik "Kopiér til ny" → formularen er forudfyldt, vælg ny dato → gem
- [ ] Opret en spiller (kategori + position) → træk ham hen på et hold
- [ ] Markér ⬆ oprykker på 2 spillere → prøv en 3. → du får en advarsel
- [ ] Flyt en spiller til et andet hold via "Flyt til…"
- [ ] Slet et testhold → spillerne lander under "Uden hold"
- [ ] Gå til Indstillinger (⚙︎) → slå notifikationer til → Gem
