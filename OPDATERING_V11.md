# Opdatering til version 11 — billeder og links pr. øvelse

Billeder og links flytter fra "hele træningen" ned til den enkelte øvelse, som du bad om. Gamle træninger med billeder/links på hele-træningen-niveau mister ikke data — de vises stadig, men nye tilføjes fremover pr. øvelse.

**Hvad er nyt:**
- Hver øvelse (i en træning, og i selve øvelsesbanken) har nu sit eget 📎-ikon, hvor du kan tilføje billeder og links specifikt til den øvelse
- Vælger du en øvelse fra banken ind i en træning, følger dens billeder/links automatisk med
- Gemmer du en øvelse i banken (💾), følger dens billeder/links også med
- Den gamle "Links & billeder"-sektion for hele træningen er fjernet fra opret/redigér — men vises stadig i visningen, hvis en ældre træning har data der

## Trin 1: Kør migrationen i Supabase

SQL Editor → New query → kør hele `supabase_migration_10.sql` (tilføjer billede/link-kolonner til øvelsesbanken — ingen ændring nødvendig for selve træningerne, da øvelser i forvejen ligger som en fleksibel liste).

## Trin 2: Upload de ændrede filer til GitHub

**Ændrede filer:**
- `src/components/ExerciseEditor.jsx`
- `src/pages/Trainings.jsx`
- `src/pages/TrainingDetail.jsx`
- `src/pages/ExerciseBank.jsx`
- `src/styles.css`

**Ny fil:**
- `supabase_migration_10.sql`

Upload som vanligt → commit direkte til main → vent på Vercel → hard refresh (ingen Terminal/CLI nødvendig denne gang).

## Test

- [ ] Opret en træning → tilføj en øvelse → klik 📎 → tilføj et billede og et link til netop den øvelse
- [ ] Gem øvelsen i banken (💾) → tjek at billedet/linket er der, når du senere vælger den fra "Tilføj fra øvelsesbanken"
- [ ] Åbn en gammel træning (fra før denne opdatering) → tjek at dens oprindelige billeder/links stadig vises
- [ ] Gå til Øvelsesbank → opret en ny øvelse direkte der med et billede → tjek den dukker op korrekt
