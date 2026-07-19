# Trænerportalen

En fælles hjemmeside for trænere: opslag, træningsplaner med øvelser, holdoversigt og forum.

Bygget med React (Vite) + Supabase. Kan hostes gratis på Vercel.

---

## Sådan får du den online (trin for trin)

### Trin 1: Opret Supabase-projektet (database + login)

1. Gå til **supabase.com** og opret en gratis konto
2. Klik **New project** → giv det et navn (f.eks. "traenerportalen"), vælg en adgangskode til databasen og region **EU (Frankfurt)** (tættest på Danmark)
3. Vent 1-2 minutter på at projektet er klar
4. Gå til **SQL Editor** i venstremenuen → klik **New query**
5. Åbn filen `supabase_setup.sql` fra dette projekt, kopiér HELE indholdet ind, og klik **Run**
   - Du skulle gerne se "Success. No rows returned"
6. Gå til **Authentication → Sign In / Providers** og tjek at **Email** er slået til
   - **Tip:** Slå "Confirm email" FRA (under Email-provideren), så dine medtrænere ikke skal bekræfte deres e-mail først. Det gør det nemmere for alle.
7. Gå til **Project Settings → API** og notér to ting:
   - **Project URL** (f.eks. `https://abcdefgh.supabase.co`)
   - **anon / public key** (en lang tekststreng)

### Trin 2: Læg koden på GitHub

1. Opret en gratis konto på **github.com** (hvis du ikke har en)
2. Klik **New repository** → navn f.eks. `traenerportalen` → vælg **Private** → Create
3. Upload alle filerne fra dette projekt:
   - Nemmest: klik "uploading an existing file" og træk alle filer/mapper ind
   - Eller med git: `git init`, `git add .`, `git commit -m "første version"`, `git push`

### Trin 3: Deploy på Vercel (selve hjemmesiden)

1. Gå til **vercel.com** og log ind med din GitHub-konto (gratis)
2. Klik **Add New → Project** og vælg dit `traenerportalen`-repository
3. Vercel genkender automatisk at det er et Vite-projekt — lad indstillingerne stå
4. **VIGTIGT:** Under **Environment Variables**, tilføj de to nøgler fra Supabase:
   | Name | Value |
   |---|---|
   | `VITE_SUPABASE_URL` | din Project URL |
   | `VITE_SUPABASE_ANON_KEY` | din anon key |
5. Klik **Deploy** og vent 1-2 minutter
6. Færdig! Du får en URL som `traenerportalen.vercel.app` 🎉

### Trin 4: Inviter dine medtrænere

Send dem bare linket. De klikker "Ny træner? Opret en konto", skriver navn, e-mail og adgangskode — og er i gang.

---

## Test lokalt på din egen computer (valgfrit)

```bash
npm install
cp .env.example .env   # og indsæt dine Supabase-nøgler i .env
npm run dev
```

Åbn derefter http://localhost:5173

---

## Funktioner

- **Opslag** — hurtige beskeder til alle trænere
- **Træninger** — planlæg træninger med dato, tid, sted, tema og en liste af øvelser (navn, minutter, beskrivelse). Skift mellem kommende og afholdte.
- **Hold** — oversigt over hold, årgange og trænere
- **Forum** — opret diskussioner og svar på hinandens indlæg
- **Login** — kun trænere med konto kan se indholdet

## Sikkerhed

- Alle data ligger i din egen Supabase-database (EU)
- Kun indloggede brugere kan læse og skrive
- Man kan kun slette sine egne opslag, træninger og svar (hold kan alle rydde op i)
- `anon key` er sikker at have i frontend-koden — adgangskontrollen ligger i databasens Row Level Security

## Gratis-grænser (rigeligt til en trænergruppe)

- **Supabase gratis:** 500 MB database, 50.000 aktive brugere/md.
- **Vercel gratis:** ubegrænsede små projekter, 100 GB trafik/md.

Bemærk: Supabase sætter gratis-projekter på pause efter ca. 1 uges total inaktivitet — de vågner igen med et klik i dashboardet. Med aktiv brug sker det ikke.
