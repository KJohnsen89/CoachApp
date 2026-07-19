# Opdatering til version 4 — sådan gør du

Version 4 tilføjer:
- **Spiller:** "Egen position"-feltet er fjernet. I stedet er der et **Side**-valg — Venstre / Midt / Højre / Ikke aktuelt — som default står på "Ikke aktuelt".
- **Træning:** en **"Redigér"**-knap på detaljesiden. Redigerer du en træning, der er del af en serie, kan du vælge om ændringen kun skal gælde den ene dato, eller **hele serien** på én gang.

## Trin 1: Opdatér databasen i Supabase (gør dette FØRST)

1. **supabase.com** → dit projekt → **SQL Editor** → **New query**
2. Kopiér HELE indholdet af **`supabase_migration_4.sql`** ind og klik **Run**
3. Dine eksisterende spillere får automatisk "Ikke aktuelt" som side — intet forsvinder

## Trin 2: Upload de ændrede filer til GitHub

**Ændrede filer (erstattes):**
- `src/pages/Teams.jsx`
- `src/pages/TrainingDetail.jsx`
- `src/styles.css`

**Ny fil:**
- `supabase_migration_4.sql`

Gå til dit repository → **Add file → Upload files** → træk hele den udpakkede `traener-app`-mappes indhold ind → skriv "Version 4" → **Commit changes** (husk den grønne knap til sidst — commit direkte til main, som du har gjort hidtil).

## Trin 3: Vent på Vercel, og hard-refresh

Vercel bygger automatisk (1-2 min). Genindlæs derefter med **Cmd+Shift+R** (Chrome) eller **Cmd+Option+R** (Safari).

## Godt at vide: hvem kan redigere en træning?

"Redigér"-knappen vises kun for den træner, der oprettede træningen — ligesom "Slet" allerede fungerede. Vil du i stedet have, at **alle** trænere kan redigere hinandens træninger (ligesom med hold og spillere), så sig til — det er en lille ændring i databasens rettigheder.

## Test-tjekliste

- [ ] Redigér en spiller → vælg "Højre" under Side → gem → chippen "Højre" vises nu på spilleren
- [ ] Opret en ny spiller → tjek at Side som udgangspunkt står på "Ikke aktuelt" (og ingen chip vises, når du gemmer)
- [ ] Opret en trænings**serie** (4 mandage) → gå ind på én af dem → tryk **Redigér** → ret temaet → vælg **"Gem for hele serien"** → tjek at alle 4 træninger nu har det nye tema
- [ ] Redigér én enkelt træning i samme serie → vælg **"Gem kun denne dato"** → tjek at kun den ene ændrede sig
- [ ] Redigér en almindelig (ikke-serie) træning → bekræft at der kun er én "Gem ændringer"-knap
