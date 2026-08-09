# Opdatering til version 8 — appen kan nu tilføjes til hjemmeskærmen

Ingen database-ændringer denne gang — kun nye filer og en lille tilføjelse i `index.html`.

**Hvad er nyt:**
- Et app-ikon i jeres grønne bane-tema (samme cirkel-mærke som i toppen af appen)
- En "manifest"-fil, der fortæller telefonen at siden kan installeres som en app
- iOS/Safari-specifikke tags, så det ser rigtigt ud på iPhone

## Trin 1: Upload filerne til GitHub

**Nye filer:**
- `public/manifest.json`
- `public/favicon.png`
- `public/icons/icon-192.png`
- `public/icons/icon-512.png`
- `public/icons/icon-512-maskable.png`
- `public/icons/apple-touch-icon.png`

**Ændret fil:**
- `index.html`

Upload som vanligt til GitHub → commit direkte til main → vent på Vercel (ingen Supabase-trin denne gang).

## Trin 2: Sådan "installerer" du og de andre trænere appen

**På iPhone (Safari — skal være Safari, virker ikke i Chrome på iOS):**
1. Åbn portalens link i Safari
2. Tryk på **Del-ikonet** (firkant med pil op) nederst
3. Scroll ned og tryk **"Føj til hjemmeskærm"**
4. Tryk **"Tilføj"** øverst til højre

**På Android (Chrome):**
1. Åbn portalens link i Chrome
2. Tryk på de **tre prikker** øverst til højre
3. Tryk **"Installer app"** eller **"Føj til startskærm"**

Herefter ligger Trænerportalen som et rigtigt ikon på hjemmeskærmen, åbner uden browser-bjælke, og ser ud og opfører sig som enhver anden app — bare uden App Store, årsafgift eller godkendelsesproces.

## Test

- [ ] Åbn linket på din egen iPhone i Safari → tilføj til hjemmeskærm → tjek at ikonet ser korrekt ud (grønt med hvidt cirkel-mærke)
- [ ] Åbn appen fra ikonet → tjek at den åbner uden adresselinje/browser-udseende
- [ ] Send de to installations-vejledninger ovenfor til dine trænerkolleger (fx sammen med guiden du allerede har delt)
