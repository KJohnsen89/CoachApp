# Opdatering til version 9 + 10 (samlet)

Du har ikke sat push-notifikationer op endnu, så denne guide samler **begge** opdateringer i én omgang: push-notifikationer (ingen domæne nødvendigt) og den nye øvelsesbank. De er uafhængige af hinanden — du kan sagtens gøre Del A og Del B i hver sin omgang, hvis du hellere vil dele det op.

---

## Del A: Push-notifikationer

**Dine VAPID-nøgler er allerede genereret — brug dem direkte:**

```
VAPID_PUBLIC_KEY=BHOKDXlMMCOsZFYgF7o72U12ytEcTnARty0v9z68tGE1Y_llTXKT7r5ZIx0_ZAeW8HMtPUMShOxDV39gaKuOAGM
VAPID_PRIVATE_KEY=Itme-gzDLbYS9Zgn1bmWN9WwvHymuTw3xdNgUXqD0Is
```

⚠️ Den private nøgle er hemmelig — må kun ligge i Supabase's secrets (trin A4), aldrig i GitHub eller Vercel.

**A1. Kør migrationen i Supabase**
SQL Editor → New query → kør hele `supabase_migration_8.sql`.

**A2. Tilføj den offentlige nøgle i Vercel**
Settings → Environments → Production → tilføj:
- Name: `VITE_VAPID_PUBLIC_KEY`
- Value: `BHOKDXlMMCOsZFYgF7o72U12ytEcTnARty0v9z68tGE1Y_llTXKT7r5ZIx0_ZAeW8HMtPUMShOxDV39gaKuOAGM`

Gå til Deployments → seneste → ⋯ → **Redeploy** (kan vente til efter du har uploadet koden i trin B/nedenfor, så du kun redeployer én gang).

**A3. Installer Supabase CLI og deploy funktionen** (Terminal på din Mac)
```bash
brew install supabase/tap/supabase
supabase login
cd sti/til/traener-app
supabase link --project-ref DIT-PROJECT-REF
supabase functions deploy send-push --no-verify-jwt
```

**A4. Sæt hemmelighederne**
```bash
supabase secrets set VAPID_PUBLIC_KEY=BHOKDXlMMCOsZFYgF7o72U12ytEcTnARty0v9z68tGE1Y_llTXKT7r5ZIx0_ZAeW8HMtPUMShOxDV39gaKuOAGM
supabase secrets set VAPID_PRIVATE_KEY=Itme-gzDLbYS9Zgn1bmWN9WwvHymuTw3xdNgUXqD0Is
supabase secrets set VAPID_SUBJECT=mailto:din-email@example.dk
supabase secrets set APP_URL=https://din-app.vercel.app
```

**A5. Opret Database Webhooks**
Database → Webhooks → Create a new hook, gentaget for hver tabel:

| Name | Table | Events | Type |
|---|---|---|---|
| `push-posts` | `posts` | Insert | Edge Function → send-push |
| `push-trainings` | `trainings` | Insert | Edge Function → send-push |
| `push-forum-threads` | `forum_threads` | Insert | Edge Function → send-push |
| `push-forum-replies` | `forum_replies` | Insert | Edge Function → send-push |

**A6. Test**
Åbn appen **fra hjemmeskærm-ikonet** → Indstillinger → "Slå til" → giv tilladelse → "Send test-notifikation".

---

## Del B: Øvelsesbank

Ingen CLI nødvendig — kun database + kode.

**B1. Kør migrationen i Supabase**
SQL Editor → New query → kør hele `supabase_migration_9.sql`. Den opretter banken og forudfylder 5 kategorier: Interval, Pasning, Presspil, Opvarming, Skud.

**B2. Sådan virker det**
- Ny fane **"Øvelsesbank"** — se, opret, redigér og slet øvelser og kategorier, filtrér på kategori
- Når du opretter/redigerer en træning: en dropdown **"Tilføj fra øvelsesbanken"** indsætter en gemt øvelse direkte
- På hver øvelse-linje: et 💾-ikon gemmer netop den øvelse i banken, med valgfri kategori
- Alle godkendte trænere kan oprette/redigere/slette i banken og kategorierne — det er fælles, ligesom hold og spillere

---

## Upload alt til GitHub (dækker begge dele)

**Nye filer:**
- `public/sw.js`
- `supabase/functions/send-push/index.ts`
- `supabase_migration_8.sql`
- `supabase_migration_9.sql`
- `src/components/ExerciseEditor.jsx`
- `src/pages/ExerciseBank.jsx`

**Ændrede filer:**
- `src/main.jsx`
- `src/pages/Settings.jsx`
- `src/pages/Trainings.jsx`
- `src/pages/TrainingDetail.jsx`
- `src/App.jsx`
- `src/styles.css`
- `.env.example`

Upload alt på én gang → commit direkte til main → vent på Vercel → hard refresh.

## Samlet tjekliste

- [ ] Kør `supabase_migration_8.sql`
- [ ] Kør `supabase_migration_9.sql`
- [ ] Upload alle filer til GitHub
- [ ] Tilføj `VITE_VAPID_PUBLIC_KEY` i Vercel → Redeploy
- [ ] Gennemfør CLI-trinene (A3–A5) for push
- [ ] Test push-notifikation
- [ ] Gå til **Øvelsesbank** → tjek de 5 kategorier er der → opret en test-øvelse
- [ ] Opret en træning → tjek "Tilføj fra øvelsesbanken" og 💾-knappen virker
