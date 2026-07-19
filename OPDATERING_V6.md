# Opdatering til version 6 — sådan gør du

Forudsætter at **version 5 allerede er sat op** (godkendelsessystemet). Har du ikke kørt migration 5 og gjort dig selv til admin endnu, gør det først.

**Hvad er nyt:**
- **Admin kan slette alt** — opslag, træninger, forum-diskussioner og -svar, uanset hvem der oprettede dem
- **Vælg notifikation pr. opslag** — når du opretter et opslag, en træning eller en forum-diskussion, kan du fravælge at den udløser e-mails (uafhængigt af modtagernes egne indstillinger)
- **Ny fane "Referater"** — tilføj og læs referater fra trænermøder
- **Ny fane "Regler"** — jeres aftaler og filosofi, samlet ét sted. Kun admin kan tilføje/redigere/slette; alle kan læse
- Jeg har forudfyldt begge nye faner med indholdet fra det referat, du lige uploadede (valgfrit at bruge — se trin 3)

## Trin 1: Kør migrationen i Supabase

1. **supabase.com** → dit projekt → **SQL Editor** → **New query**
2. Kopiér HELE indholdet af **`supabase_migration_6.sql`** ind og klik **Run**

## Trin 2: Upload filerne til GitHub

**Nye filer:**
- `src/pages/Referater.jsx`
- `src/pages/Rules.jsx`
- `supabase_migration_6.sql`
- `supabase_seed_moedeindhold.sql` (valgfri, se trin 3)

**Ændrede filer:**
- `src/App.jsx`
- `src/pages/Home.jsx`
- `src/pages/Trainings.jsx`
- `src/pages/TrainingDetail.jsx`
- `src/pages/Forum.jsx`
- `src/pages/Thread.jsx`
- `src/styles.css`
- `supabase/functions/send-notification/index.ts` (kun relevant hvis du har sat e-mail-notifikationer op — se trin 4)

Upload til GitHub som vanligt → commit direkte til main → vent på Vercel → hard refresh.

## Trin 3 (valgfrit): Forudfyld Referater og Regler med jeres seneste møde

Jeg har omsat referatet, du uploadede, til 7 regel-punkter (Træning, Trænere, Stævner & hold, Møder, Kultur) og ét fuldt referat, klar til at blive indsat automatisk:

1. Åbn `supabase_seed_moedeindhold.sql`
2. Erstat **begge** forekomster af `'din-email@example.dk'` med din egen login-mail
3. Kør scriptet i SQL Editor

Vil du hellere gøre det manuelt via appen, kan du også bare selv gå ind på **Regler** og **Referater** og indtaste dem — de er allerede skrevet klar nedenfor, hvis du vil kopiere direkte:

**Regler (titel · kategori · tekst):**
1. *Fælles ramme til træning* · Træning · Better Coaching-appen med 4 stationer. Maks. 10 spillere pr. gruppe, maks. 4 grupper. Over 40 spillere → fordeles ud.
2. *Vagtplan og tilmelding* · Træning · Vagtplan pr. træning. Kampe tilmeldes/afmeldes via Kampklar.
3. *Trænernes forpligtelser* · Trænere · Min. én fast træningsdag/uge, følg aftaler, bak op om fælles beslutninger.
4. *Stævner: Kris-metoden* · Stævner & hold · Alle tilmeldte spiller. Dynamisk holdsammensætning efter fremmøde. Ingen faste hold.
5. *Truppemøder og rotation* · Stævner & hold · 4 truppemøder/år.
6. *Faste mødedatoer* · Møder · Trænermøder sidste tirsdag før ferier; årgangsmøde sidste torsdag før sommer/jul.
7. *Vi er én trænergruppe* · Kultur · Ikke A/B/C-trænere — én gruppe. Sig mening bredt, ikke i krogene.

**Referat:** hele teksten fra din PDF, omskrevet og struktureret — ligger allerede i `supabase_seed_moedeindhold.sql`, klar til at kopiere ind i "Nyt referat", hvis du ikke vil køre SQL'en.

## Trin 4 (kun hvis du har sat e-mail-notifikationer op): Genudrul Edge Function'en

Har du fulgt `NOTIFIKATIONER_GUIDE.md` og har en kørende Edge Function, skal den opdateres, så den respekterer det nye "send ikke notifikation"-flueben:

```bash
cd sti/til/traener-app
supabase functions deploy send-notification --no-verify-jwt
```

Har du ikke sat notifikationer op endnu, kan du roligt springe dette trin over.

## Test-tjekliste

- [ ] Log ind som en ikke-admin-bruger → opret et opslag → tjek at der IKKE er en slet-knap på andres opslag
- [ ] Log ind som admin → tjek at du NU kan slette andres opslag, træninger og forum-indhold
- [ ] Opret et opslag med fluebenet "Send e-mail-notifikation" slået FRA → tjek (hvis du har e-mail sat op) at der ikke kommer nogen mail
- [ ] Gå til **Referater** → opret ét → klik for at folde det ud/ind
- [ ] Gå til **Regler** → som admin: tilføj/redigér/slet en regel → som ikke-admin: bekræft at der ikke er redigeringsknapper
