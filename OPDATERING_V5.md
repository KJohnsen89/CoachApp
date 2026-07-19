# Opdatering til version 5 — sådan gør du

Dette er den største opdatering endnu, så følg trinene i rækkefølge — særligt trin 2, som er nemt at glemme.

**Hvad er nyt:**
- **Godkendelse af nye brugere:** Nye der opretter sig, skal godkendes af dig, før de kan bruge appen
- **Administration-side:** Godkend/afvis nye trænere, og fjern adgang for andre
- **Skift adgangskode** under Indstillinger
- **"Set af"** på opslag og forum-diskussioner
- **Ny fane "Spillere"** — samlet, søgbar oversigt over alle spillere med al deres data

## Trin 1: Kør migrationen i Supabase

1. **supabase.com** → dit projekt → **SQL Editor** → **New query**
2. Kopiér HELE indholdet af **`supabase_migration_5.sql`** ind og klik **Run**
3. Alle dine nuværende trænere (dig selv, Lars, Brian osv. — alle der allerede har en konto) bliver automatisk godkendt. Ingen bliver låst ude.

## Trin 2: ⚠️ Gør dig selv til administrator — SPRING IKKE OVER

Uden dette trin kan ingen godkende nye trænere, og "Admin"-fanen vises ikke for nogen.

1. Stadig i **SQL Editor**, åbn et **nyt** query-vindue
2. Indsæt denne linje, men **erstat e-mailen med din egen login-mail**:

```sql
update profiles set is_admin = true
  where user_id = (select id from auth.users where email = 'din-email@example.dk');
```

3. Klik **Run**
4. Tjek at det virkede: kør `select * from profiles where is_admin = true;` — der skal stå din egen række

## Trin 3: Upload de nye/ændrede filer til GitHub

**Nye filer:**
- `src/pages/Admin.jsx`
- `src/pages/AllPlayers.jsx`
- `supabase_migration_5.sql`

**Ændrede filer:**
- `src/App.jsx`
- `src/pages/Login.jsx`
- `src/pages/Settings.jsx`
- `src/pages/Home.jsx`
- `src/pages/Thread.jsx`
- `src/styles.css`

Gå til dit repository → **Add file → Upload files** → træk hele den udpakkede `traener-app`-mappes indhold ind → skriv "Version 5" → **Commit changes** (commit direkte til main, som du plejer).

## Trin 4: Vent på Vercel, og hard-refresh

Genindlæs derefter med **Cmd+Shift+R** (Chrome) eller **Cmd+Option+R** (Safari).

## Sådan sletter du en person (dit spørgsmål)

To niveauer:
- **Fjern adgang** (hurtigt, reversibelt): Gå til **Admin**-fanen i appen → find personen under "Godkendte trænere" → **Fjern adgang**. De kan ikke længere se eller bruge noget i appen, men kontoen består (du kan "Genopret adgang" senere).
- **Slet kontoen helt** (permanent, frigør e-mailen): Det skal ske direkte i Supabase — **Authentication → Users** → find personen → **Delete user**. Dette kan bevidst ikke gøres fra selve appen, da det ville kræve at lægge en hemmelig nøgle ind i koden, som alle kan se i browseren.

## Husker appen login? (dit spørgsmål)

Ja — når man er logget ind i en browser eller på telefonen, gemmes login'et automatisk. Man skal ikke skrive adgangskode igen, før man selv trykker "Log ud".

## Test-tjekliste

- [ ] Log ind som dig selv → tjek at "Admin" nu vises i menuen
- [ ] Opret en test-konto med en anden e-mail (fx din egen +test@) → bekræft at du ser "Afventer godkendelse"-skærmen i stedet for appen
- [ ] Log ind som dig selv igen → gå til **Admin** → godkend test-kontoen
- [ ] Log ind som test-kontoen → bekræft at du nu kan se appen
- [ ] Skriv et opslag → genindlæs siden → tjek at "Set af" viser dit navn (fra en anden konto der har set det)
- [ ] Gå til **Indstillinger** → skift adgangskode → log ud og ind igen med den nye kode
- [ ] Gå til den nye fane **Spillere** → søg og filtrér på kategori
