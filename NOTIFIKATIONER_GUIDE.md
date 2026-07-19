# E-mail-notifikationer — opsætningsguide

Afkrydsningsfelterne under **Indstillinger** i appen virker med det samme (efter du har kørt `supabase_migration_2.sql`). Men selve **afsendelsen af e-mails** kræver en lille server-funktion i Supabase. Denne guide sætter den op — det tager ca. 15-20 minutter og er helt gratis.

**Kort fortalt:** Når nogen opretter et opslag, en træning eller et forum-indlæg, kalder Supabase automatisk en lille funktion, som sender e-mails via tjenesten Resend til de trænere, der har sagt ja tak.

---

## Trin 1: Opret en gratis Resend-konto (e-mail-tjenesten)

1. Gå til **resend.com** og opret en gratis konto (gratis: 100 mails/dag — rigeligt)
2. Gå til **API Keys** → klik **Create API Key** → giv den et navn → kopiér nøglen (starter med `re_...`)
   - ⚠️ Gem den et sikkert sted — den vises kun én gang

**Om afsenderadressen:** Uden eget domæne kan Resend kun sende fra `onboarding@resend.dev`, og som udgangspunkt kun til din egen e-mail. For at sende til alle trænerne skal du enten:
- **A) Verificere et domæne** du ejer (f.eks. dit Johnsen Freelance-domæne) under **Domains** i Resend — så kan du sende fra f.eks. `portal@ditdomæne.dk` til alle, ELLER
- **B)** Invitere trænerne som "Audience/teammedlemmer" — mere besværligt. Anbefaling: brug et domæne, hvis du har et.

## Trin 2: Installer Supabase CLI og deploy funktionen

På din Mac, åbn Terminal:

```bash
# Installer Supabase CLI (kræver Homebrew — har du ikke det, så sig til)
brew install supabase/tap/supabase

# Log ind (åbner browseren)
supabase login

# Gå til projektmappen (der hvor supabase/-mappen ligger)
cd sti/til/traener-app

# Kobl til dit Supabase-projekt (find project-ref i Supabase URL'en: https://XXXX.supabase.co)
supabase link --project-ref DIT-PROJECT-REF

# Deploy funktionen
supabase functions deploy send-notification --no-verify-jwt
```

## Trin 3: Sæt hemmelighederne (secrets)

Stadig i Terminal:

```bash
supabase secrets set RESEND_API_KEY=re_din_nøgle_her
supabase secrets set APP_URL=https://din-app.vercel.app
supabase secrets set FROM_EMAIL=portal@ditdomæne.dk
```

(Har du ikke eget domæne endnu, så brug `FROM_EMAIL=onboarding@resend.dev` til test.)

## Trin 4: Opret Database Webhooks (det der "trigger" mailsene)

I Supabase-dashboardet:

1. Gå til **Database → Webhooks** (evt. under "Integrations")
2. Klik **Create a new hook** og udfyld:
   - **Name:** `notify-posts`
   - **Table:** `posts`
   - **Events:** kun **Insert**
   - **Type:** Supabase Edge Function → vælg `send-notification`
3. Gentag for tabellerne `trainings`, `forum_threads` og `forum_replies` (fx `notify-trainings`, `notify-forum-threads`, `notify-forum-replies`)

## Trin 5: Test

1. Gå ind i appen → **Indstillinger** → slå fx "Nye opslag" til → Gem
2. Bed en anden træner (eller opret en testbruger med en anden e-mail) om at skrive et opslag
3. Tjek din indbakke 📬
   - Bemærk: du får ikke mail om indhold, du selv har oprettet — det er med vilje

## Fejlfinding

- **Ingen mail?** Gå til **Edge Functions → send-notification → Logs** i Supabase og se, om funktionen blev kaldt, og om der er fejl
- **"You can only send to your own email"** — Resend-begrænsningen uden verificeret domæne (se Trin 1)
- Tjek spam-mappen første gang
