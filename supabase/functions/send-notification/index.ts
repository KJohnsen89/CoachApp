// Supabase Edge Function: send-notification
// Kaldes af Database Webhooks når der oprettes nye opslag, træninger eller forum-indhold.
// Sender e-mails via Resend (resend.com) til trænere, der har slået notifikationer til.

import { createClient } from "npm:@supabase/supabase-js@2";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY")!;
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const APP_URL = Deno.env.get("APP_URL") ?? ""; // f.eks. https://traenerportalen.vercel.app
const FROM_EMAIL = Deno.env.get("FROM_EMAIL") ?? "onboarding@resend.dev";

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

Deno.serve(async (req) => {
  try {
    const payload = await req.json();
    const table: string = payload.table;
    const record = payload.record;

    if (record.notify === false) {
      return new Response("Notifikation fravalgt for dette indlæg", { status: 200 });
    }

    let flagColumn = "";
    let subject = "";
    let body = "";
    let link = APP_URL;

    if (table === "posts") {
      flagColumn = "notify_posts";
      subject = `Nyt opslag fra ${record.author_name}`;
      body = record.body?.slice(0, 300) ?? "";
      link = `${APP_URL}/`;
    } else if (table === "trainings") {
      flagColumn = "notify_trainings";
      subject = `Ny træning: ${record.team_name} den ${record.date}`;
      body = record.theme || "Se detaljerne på Trænerportalen.";
      link = `${APP_URL}/traeninger/${record.id}`;
    } else if (table === "forum_threads") {
      flagColumn = "notify_forum";
      subject = `Ny diskussion: ${record.title}`;
      body = record.body?.slice(0, 300) ?? "";
      link = `${APP_URL}/forum/${record.id}`;
    } else if (table === "forum_replies") {
      flagColumn = "notify_forum";
      subject = `Nyt svar fra ${record.author_name} i forummet`;
      body = record.body?.slice(0, 300) ?? "";
      link = `${APP_URL}/forum/${record.thread_id}`;
    } else {
      return new Response("Ukendt tabel", { status: 200 });
    }

    // Hent modtagere: alle med flaget slået til — undtagen den, der selv oprettede indholdet
    const authorId = record.author_id ?? record.created_by ?? null;
    let query = supabase
      .from("notification_settings")
      .select("email, display_name, user_id")
      .eq(flagColumn, true);
    if (authorId) query = query.neq("user_id", authorId);

    const { data: recipients, error } = await query;
    if (error) throw error;
    if (!recipients || recipients.length === 0) {
      return new Response("Ingen modtagere", { status: 200 });
    }

    const html = `
      <div style="font-family: sans-serif; max-width: 560px;">
        <h2 style="color:#1e6b3c;">${subject}</h2>
        <p style="white-space: pre-wrap;">${body}</p>
        <p><a href="${link}" style="background:#1e6b3c;color:#fff;padding:10px 18px;border-radius:8px;text-decoration:none;">Åbn Trænerportalen</a></p>
        <p style="color:#888;font-size:12px;">Du får denne mail, fordi du har slået notifikationer til under Indstillinger på Trænerportalen.</p>
      </div>`;

    // Send via Resend (én mail pr. modtager, bcc-frit og simpelt)
    for (const r of recipients) {
      await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${RESEND_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: `Trænerportalen <${FROM_EMAIL}>`,
          to: [r.email],
          subject,
          html,
        }),
      });
    }

    return new Response(`Sendt til ${recipients.length} modtager(e)`, { status: 200 });
  } catch (e) {
    console.error(e);
    return new Response("Fejl: " + (e as Error).message, { status: 500 });
  }
});
