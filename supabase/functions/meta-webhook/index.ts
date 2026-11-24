// meta-webhook v2 (25.11.2026) — личные сообщения Instagram Direct и Facebook Messenger → lead-inbox → «Нераспределённые лиды».
// Подключение в кабинете Meta (developers.facebook.com → приложение → Webhooks):
//   Callback URL = https://<проект>.supabase.co/functions/v1/meta-webhook
//   Verify token = crm_private_settings.meta_verify_token
//   Подписка: Instagram → messages; Page → messages.
// GET  — проверка Meta (hub.mode=subscribe, hub.verify_token, hub.challenge).
// POST — события: entry[].messaging[] и entry[].changes[] (messages / comments). Свои исходящие (is_echo) и пустые пропускаются.
//   Если задан crm_private_settings.meta_app_secret — проверяется подпись X-Hub-Signature-256.
//   Если задан crm_private_settings.meta_page_token — подтягиваются ник / имя отправителя (необязательно).
import { createClient } from "jsr:@supabase/supabase-js@2";
const db = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, { auth: { persistSession: false } });
const setting = async (k: string) => (await db.from("crm_private_settings").select("value").eq("key", k).maybeSingle()).data?.value || "";

async function validSig(raw: string, sig: string | null, secret: string) {
  if (!secret) return true; if (!sig?.startsWith("sha256=")) return false;
  const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const mac = new Uint8Array(await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(raw)));
  return sig.slice(7) === [...mac].map((b) => b.toString(16).padStart(2, "0")).join("");
}
async function profile(id: string, ig: boolean, token: string) {
  if (!token) return {};
  const host = ig ? "graph.instagram.com" : "graph.facebook.com";
  const r = await fetch(`https://${host}/v21.0/${id}?fields=${ig ? "username,name" : "first_name,last_name"}&access_token=${encodeURIComponent(token)}`).catch(() => null);
  const j: any = r?.ok ? await r.json().catch(() => ({})) : {};
  return { nick: j.username || "", name: j.name || [j.first_name, j.last_name].filter(Boolean).join(" ") };
}

Deno.serve(async (req) => {
  const u = new URL(req.url);
  if (req.method === "GET") {
    const ok = u.searchParams.get("hub.mode") === "subscribe" && u.searchParams.get("hub.verify_token") === await setting("meta_verify_token");
    return new Response(ok ? (u.searchParams.get("hub.challenge") || "") : "forbidden", { status: ok ? 200 : 403 });
  }
  const raw = await req.text();
  if (!await validSig(raw, req.headers.get("x-hub-signature-256"), await setting("meta_app_secret"))) return new Response("bad signature", { status: 403 });
  const body = JSON.parse(raw || "{}"); const ig = body.object === "instagram";
  const token = await setting(ig ? "meta_ig_token" : "meta_page_token");
  const names: Record<string, string> = JSON.parse((await setting("meta_account_names")) || "{}"); // id аккаунта → ник для «Запроса»
  const items: any[] = [];
  const entries = (body.entry || []).filter((e: any) => String(e.id) !== "0"); // тест-кнопка Meta шлёт id "0" — в лиды не пускаем
  for (const e of entries) {
    // Комментарии (field "comments"): value = {id, text, from:{id,username}, media:{id}}
    for (const c of e.changes || []) {
      const v = c.value || {}; if (c.field !== "comments" || !v.text) continue;
      const from = v.from || {}; if (!from.id || String(from.id) === String(e.id)) continue;
      items.push({ platform: ig ? "instagram" : "facebook", account: names[String(e.id)] || String(e.id), kind: "comment", external_id: `meta:c:${v.id}`,
        from_id: String(from.id), nick: from.username || "", name: "", text: v.text, post_url: v.media?.id ? `media ${v.media.id}` : null, at: new Date().toISOString() });
    }
  }
  // Директ: новый формат приходит в entry.changes[field=messages].value, старый — в entry.messaging[]
  for (const e of entries) for (const m of [...(e.messaging || []), ...(e.changes || []).filter((c: any) => c.field === "messages").map((c: any) => c.value || {})]) {
    const msg = m.message; if (!msg || msg.is_echo || msg.is_deleted) continue;
    const sender = String(m.sender?.id || ""); if (!sender || sender === String(e.id)) continue;
    const text = msg.text || (msg.attachments?.length ? `[вложение: ${msg.attachments.map((a: any) => a.type).join(", ")}]` : "");
    if (!text) continue;
    const p: any = await profile(sender, ig, token);
    items.push({ platform: ig ? "instagram" : "facebook", account: names[String(e.id)] || String(e.id), kind: "dm", external_id: `meta:${msg.mid || `${sender}:${m.timestamp}`}`,
      from_id: sender, nick: p.nick || "", name: p.name || "", text, at: new Date(Number(m.timestamp) || Date.now()).toISOString(),
      profile_url: p.nick ? null : `${ig ? "Instagram" : "Facebook"} ID ${sender} (написать из Direct/Messenger)` });
  }
  await db.from("meta_webhook_log").insert({ object: body.object || null, count: items.length, payload: body }).then(() => null, () => null);
  if (items.length) {
    await fetch(`${Deno.env.get("SUPABASE_URL")}/functions/v1/lead-inbox`, { method: "POST", headers: { "Content-Type": "application/json", "x-inbox-key": await setting("lead_inbox_key") }, body: JSON.stringify(items) }).catch(() => null);
  }
  return new Response("EVENT_RECEIVED"); // Meta ждёт 200 быстро
});
