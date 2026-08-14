# Opdatering til version 12 — Forum fjernet, kommentarer på Opslag i stedet

**Vigtigt:** dette dropper forum-tabellerne permanent — er der diskussioner i forummet, I gerne vil beholde, så gem/kopiér indholdet, før du kører migrationen.

**Hvad er nyt:**
- Forum-fanen er væk
- Opslag kan nu kommenteres, Facebook-agtigt: feedet viser den seneste kommentar under hvert opslag, og et klik på opslaget åbner det med alle kommentarer og et kommentarfelt
- Push-notifikationer sendes nu ved nye kommentarer i stedet for forum-svar

## Trin 1: Kør migrationen i Supabase

SQL Editor → New query → kør hele `supabase_migration_11.sql`. Den opretter kommentar-tabellen og sletter forum-tabellerne (tråde, svar, "set af"-tabellen for tråde).

## Trin 2: Upload de ændrede filer til GitHub

**Nye filer:**
- `src/pages/PostDetail.jsx`
- `supabase_migration_11.sql`

**Ændrede filer:**
- `src/App.jsx`
- `src/pages/Home.jsx`
- `src/styles.css`
- `supabase/functions/send-push/index.ts`

**Fjernet fra projektet** (kan slettes fra GitHub, men gør ingen skade at lade ligge):
- `src/pages/Forum.jsx`
- `src/pages/Thread.jsx`

Upload som vanligt → commit direkte til main → vent på Vercel → hard refresh.

## Trin 3: Genudrul Edge Function'en (Terminal)

```bash
cd sti/til/traener-app
supabase functions deploy send-push --no-verify-jwt
```

## Trin 4: Opdatér Database Webhooks

I Supabase → Integrations → Database Webhooks:
- **Tilføj ny:** Name `push-post-comments`, Table `post_comments`, Event Insert, Type Edge Function → send-push
- **Fjern** (valgfrit oprydning) de to gamle: `push-forum-threads` og `push-forum-replies` — de holder op med at virke af sig selv, da tabellerne bag dem er slettet, men kan stadig stå synlige på listen

## Test

- [ ] Bekræft at "Forum" ikke længere vises i menuen
- [ ] Skriv et opslag → åbn det (klik på det) → skriv en kommentar
- [ ] Genindlæs forsiden → tjek at kommentaren nu vises som forhåndsvisning under opslaget
- [ ] Tjek push-notifikation ved ny kommentar (fra en anden godkendt bruger)
