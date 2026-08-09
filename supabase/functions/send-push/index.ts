// Supabase Edge Function: send-push
// Kaldes af Database Webhooks når der oprettes nye opslag, træninger eller forum-indhold,
// og sender rigtige push-notifikationer (til hjemmeskærm-installerede telefoner) —
// helt uden e-mail, domæne eller ekstern tjeneste.

import { createClient } from "npm:@supabase/supabase-js@2";
import webpush from "npm:web-push@3";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const VAPID_PUBLIC_KEY = Deno.env.get("VAPID_PUBLIC_KEY")!;
const VAPID_PRIVATE_KEY = Deno.env.get("VAPID_PRIVATE_KEY")!;
const VAPID_SUBJECT = Deno.env.get("VAPID_SUBJECT") ?? "mailto:admin@example.com";
const APP_URL = Deno.env.get("APP_URL") ?? "";

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);
webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);

async function sendToSubscriptions(subs: any[], title: string, body: string, url: string) {
  const payloadStr = JSON.stringify({ title, body, url });
  let sent = 0;
  await Promise.all(
    subs.map(async (s) => {
      try {
        await webpush.sendNotification(
          { endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } },
          payloadStr
        );
        sent++;
      } catch (e) {
        const statusCode = e?.statusCode;
        if (statusCode === 410 || statusCode === 404) {
          // Abonnementet er udløbet/ugyldigt — ryd op i tabellen
          await supabase.from("push_subscriptions").delete().eq("endpoint", s.endpoint);
        } else {
          console.error("Push fejlede for", s.endpoint, e);
        }
      }
    })
  );
  return sent;
}

Deno.serve(async (req) => {
  try {
    const payload = await req.json();

    // Manuel test-notifikation fra "Send test-notifikation"-knappen
    if (payload.test === true && payload.user_id) {
      const { data: subs, error } = await supabase
        .from("push_subscriptions")
        .select("*")
        .eq("user_id", payload.user_id);
      if (error) throw error;
      if (!subs || subs.length === 0) {
        return new Response("Ingen abonnementer fundet for denne bruger", { status: 200 });
      }
      const sent = await sendToSubscriptions(
        subs,
        "Trænerportalen",
        "Sådan! Push-notifikationer virker 🎉",
        APP_URL || "/"
      );
      return new Response(`Test sendt til ${sent} abonnement(er)`, { status: 200 });
    }

    // Normalt flow: udløst af en Database Webhook ved INSERT
    const table: string = payload.table;
    const record = payload.record;

    let title = "Trænerportalen";
    let body = "";
    let url = APP_URL;
    let authorId: string | null = null;

    if (table === "posts") {
      title = `Nyt opslag fra ${record.author_name}`;
      body = (record.body || "").slice(0, 140);
      url = `${APP_URL}/`;
      authorId = record.author_id;
    } else if (table === "trainings") {
      title = `Ny træning: ${record.team_name}`;
      body = record.theme || `Træning den ${record.date}`;
      url = `${APP_URL}/traeninger/${record.id}`;
      authorId = record.created_by;
    } else if (table === "forum_threads") {
      title = `Ny diskussion: ${record.title}`;
      body = (record.body || "").slice(0, 140);
      url = `${APP_URL}/forum/${record.id}`;
      authorId = record.author_id;
    } else if (table === "forum_replies") {
      title = `Nyt svar fra ${record.author_name}`;
      body = (record.body || "").slice(0, 140);
      url = `${APP_URL}/forum/${record.thread_id}`;
      authorId = record.author_id;
    } else {
      return new Response("Ukendt tabel", { status: 200 });
    }

    let query = supabase.from("push_subscriptions").select("*");
    if (authorId) query = query.neq("user_id", authorId);
    const { data: subs, error } = await query;
    if (error) throw error;
    if (!subs || subs.length === 0) {
      return new Response("Ingen modtagere", { status: 200 });
    }

    const sent = await sendToSubscriptions(subs, title, body, url);
    return new Response(`Sendt til ${sent} modtager(e)`, { status: 200 });
  } catch (e) {
    console.error(e);
    return new Response("Fejl: " + (e as Error).message, { status: 500 });
  }
});
