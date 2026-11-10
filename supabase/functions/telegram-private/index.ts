// Закрытые Telegram-каналы для ленты агентства.
// CRM читает каналы от имени рабочего Telegram-аккаунта агентства (вход: телефон → код из Telegram → пароль, если включён).
// Сессия хранится только на сервере (таблица telegram_accounts без доступа из CRM).
// В ленте у поста — только название, которое задал администратор; ссылки на канал из текста убираются.
//
// Действия (body.action), вызывает администратор агентства из CRM:
//   status | set_api (только тех. администратор) | send_code | sign_in | logout | resolve | sync
// По расписанию (заголовок x-cron-secret): sync всех закрытых источников всех агентств.
import { createClient } from "jsr:@supabase/supabase-js@2";
import { TelegramClient, Api } from "npm:telegram@2.26.22";
import { StringSession } from "npm:telegram@2.26.22/sessions/index.js";
import bigInt from "npm:big-integer@1.6.52";
import QRCode from "npm:qrcode@1.5.4";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
const BUCKET = "news-media";
const FIRST_SYNC_POSTS = 3;
const MAX_POSTS_PER_RUN = 10;
const MAX_FILE_BYTES = 50 * 1024 * 1024; // видео до 50 МБ
const MAX_FILES_PER_POST = 20;
const MERGE_WINDOW_SEC = 180;
const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-cron-secret",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { ...CORS, "Content-Type": "application/json" } });
const db = createClient(SUPABASE_URL, SERVICE_KEY, { auth: { persistSession: false } });

// Понятные сообщения вместо кодов ошибок Telegram
function humanError(e: unknown) {
  const m = String((e as any)?.errorMessage || (e as Error)?.message || e);
  const map: Record<string, string> = {
    PHONE_NUMBER_INVALID: "Неверный номер телефона. Формат: +380XXXXXXXXX",
    PHONE_NUMBER_BANNED: "Этот номер заблокирован в Telegram",
    PHONE_CODE_INVALID: "Неверный код. Проверьте код в Telegram и введите ещё раз",
    PHONE_CODE_EXPIRED: "Код устарел. Нажмите «Получить код» ещё раз",
    PASSWORD_HASH_INVALID: "Неверный пароль двухэтапной проверки",
    SESSION_PASSWORD_NEEDED: "Нужен пароль двухэтапной проверки",
    API_ID_INVALID: "Неверный ключ приложения Telegram (api_id / api_hash)",
    INVITE_HASH_EXPIRED: "Ссылка-приглашение устарела или отозвана. Попросите новую ссылку",
    INVITE_HASH_INVALID: "Ссылка-приглашение недействительна",
    INVITE_REQUEST_SENT: "Канал принимает участников по заявке. Заявка отправлена — после одобрения нажмите «Проверить» ещё раз",
    CHANNELS_TOO_MUCH: "Аккаунт состоит в слишком большом числе каналов",
    USER_ALREADY_PARTICIPANT: "Аккаунт уже в канале",
    AUTH_KEY_UNREGISTERED: "Вход в Telegram сброшен. Подключите аккаунт заново",
    SESSION_REVOKED: "Вход в Telegram завершён на телефоне. Подключите аккаунт заново",
    FLOOD_WAIT: "Telegram просит подождать. Попробуйте через несколько минут",
    SEND_CODE_UNAVAILABLE: "Другие способы отправки кода закончились. Подождите несколько минут и нажмите «Другой номер» → «Получить код»",
    PHONE_CODE_HASH_EMPTY: "Код устарел. Нажмите «Другой номер» и запросите код снова",
  };
  const key = Object.keys(map).find((k) => m.includes(k));
  return key ? map[key] : m.slice(0, 200);
}

async function setting(key: string) {
  const { data } = await db.from("crm_private_settings").select("value").eq("key", key).maybeSingle();
  return data?.value || "";
}
async function apiCreds() {
  const id = Number(await setting("tg_api_id")); const hash = await setting("tg_api_hash");
  if (!id || !hash) throw new Error("Ключ приложения Telegram ещё не задан. Его вводит тех. администратор в «Ещё → Источники ленты».");
  return { apiId: id, apiHash: hash };
}
async function makeClient(session: string) {
  const { apiId, apiHash } = await apiCreds();
  const client = new TelegramClient(new StringSession(session || ""), apiId, apiHash, { connectionRetries: 2, timeout: 20 });
  client.setLogLevel("none");
  await client.connect();
  return { client, apiId, apiHash };
}
const close = async (c?: TelegramClient) => { try { await c?.disconnect(); await c?.destroy(); } catch { /* */ } };

// ---------- ссылки на каналы ----------
function inviteHash(link: string) {
  const m = String(link || "").trim().match(/(?:t\.me|telegram\.me)\/(?:\+|joinchat\/)([A-Za-z0-9_-]{8,})/i) || String(link).trim().match(/^\+([A-Za-z0-9_-]{8,})$/);
  return m ? m[1] : null;
}
function publicName(link: string) {
  const m = String(link || "").trim().match(/(?:t\.me|telegram\.me)\/(?:s\/)?([A-Za-z][A-Za-z0-9_]{3,})(?:[/?#]|$)/i) || String(link).trim().match(/^@([A-Za-z][A-Za-z0-9_]{3,})$/);
  return m && !/^(joinchat|addlist|c)$/i.test(m[1]) ? m[1] : null;
}
function stripLinks(text: string, meta: any) {
  let t = String(text || "");
  if (meta?.invite) t = t.replace(new RegExp(`(?:https?:\\/\\/)?(?:t|telegram)\\.me\\/(?:\\+|joinchat\\/)${meta.invite.replace(/[-]/g, "\\-")}\\S*`, "gi"), "");
  if (meta?.username) t = t.replace(new RegExp(`(?:https?:\\/\\/)?(?:t|telegram)\\.me\\/(?:s\\/)?${meta.username}\\S*`, "gi"), "").replace(new RegExp(`@${meta.username}\\b`, "gi"), "");
  if (meta?.channel_id) t = t.replace(new RegExp(`(?:https?:\\/\\/)?(?:t|telegram)\\.me\\/c\\/${meta.channel_id}\\S*`, "gi"), "");
  return t.split("\n").map((l) => l.trimEnd()).filter((l, i, a) => !(l.trim() === "" && (a[i - 1] ?? "").trim() === "")).join("\n").trim();
}
const peerOf = (meta: any) => new Api.InputPeerChannel({ channelId: bigInt(String(meta.channel_id)), accessHash: bigInt(String(meta.access_hash)) });

// Найти канал по ссылке; при необходимости вступить по приглашению
async function resolveChannel(client: TelegramClient, link: string) {
  const hash = inviteHash(link);
  let chat: any = null;
  if (hash) {
    const inv: any = await client.invoke(new Api.messages.CheckChatInvite({ hash }));
    if (inv.className === "ChatInviteAlready" || inv.className === "ChatInvitePeek") chat = inv.chat;
    else {
      const upd: any = await client.invoke(new Api.messages.ImportChatInvite({ hash }));
      chat = (upd.chats || [])[0];
    }
  } else {
    const name = publicName(link);
    if (!name) throw new Error("Не похоже на ссылку на канал. Пример: https://t.me/+AbCdEf… или https://t.me/имя_канала");
    chat = await client.getEntity(name);
  }
  if (!chat || chat.className !== "Channel") throw new Error("По ссылке не канал (или аккаунт не видит его)");
  return { title: chat.title, meta: { channel_id: String(chat.id), access_hash: String(chat.accessHash), invite: hash || null, username: chat.username || null } };
}

// Последние сообщения канала: альбомы склеиваются в один пост
async function channelPosts(client: TelegramClient, meta: any, limit = 30) {
  const msgs: any[] = await client.getMessages(peerOf(meta), { limit });
  const groups = new Map<string, any[]>();
  for (const m of msgs) {
    if (!m || m.className !== "Message") continue;
    const key = m.groupedId ? "g" + String(m.groupedId) : String(m.id);
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(m);
  }
  const posts = [...groups.entries()].map(([key, list]) => {
    list.sort((a, b) => a.id - b.id);
    const text = stripLinks(list.map((m) => m.message || "").filter(Boolean).join("\n\n"), meta);
    return { external_id: key, text, date: new Date(list[0].date * 1000).toISOString(), msgs: list, mediaCount: list.filter((m) => m.media && (m.media.className === "MessageMediaPhoto" || m.media.className === "MessageMediaDocument")).length };
  }).filter((p) => p.text || p.mediaCount);
  posts.sort((a, b) => a.msgs[0].id - b.msgs[0].id); // от старых к новым
  // Текст и альбом, отправленные подряд отдельными сообщениями (до 3 минут), — один пост
  const merged: any[] = [];
  for (const p of posts) {
    const prev = merged[merged.length - 1];
    const close = prev && Math.abs(Date.parse(p.date) - Date.parse(prev.date)) <= MERGE_WINDOW_SEC * 1000;
    const compl = prev && ((!prev.mediaCount && p.mediaCount && !p.text) || (prev.mediaCount && !prev.text && p.text && !p.mediaCount) || (prev.mediaCount && !prev.text && p.mediaCount && !p.text));
    if (close && compl && prev.mediaCount + p.mediaCount <= MAX_FILES_PER_POST) {
      prev.text = [prev.text, p.text].filter(Boolean).join("\n\n");
      prev.msgs = prev.msgs.concat(p.msgs); prev.mediaCount += p.mediaCount; prev.ids.push(...p.ids);
    } else merged.push({ ...p, ids: [p.external_id] });
  }
  return merged;
}

async function uploadBuffer(sourceId: number, extId: string, idx: number, buf: Uint8Array, ext: string, type: string) {
  const path = `feed/${sourceId}/${extId}-${idx}.${ext}`;
  const up = await db.storage.from(BUCKET).upload(path, buf, { contentType: type, upsert: true });
  if (up.error) throw new Error(up.error.message);
  return db.storage.from(BUCKET).getPublicUrl(path).data.publicUrl;
}
async function mediaOf(client: TelegramClient, sourceId: number, post: any) {
  const out: { media_type: string; media_url: string; file_name: string }[] = [];
  let i = 0;
  for (const m of post.msgs) {
    if (out.length >= MAX_FILES_PER_POST || !m.media) continue;
    try {
      if (m.media.className === "MessageMediaPhoto") {
        const buf = await client.downloadMedia(m, {}) as Uint8Array;
        if (buf?.length) out.push({ media_type: "Фото", media_url: await uploadBuffer(sourceId, post.external_id, i++, new Uint8Array(buf), "jpg", "image/jpeg"), file_name: `tg-${m.id}.jpg` });
      } else if (m.media.className === "MessageMediaDocument") {
        const doc = m.media.document; const size = Number(doc?.size || 0); const mime = String(doc?.mimeType || "");
        const nameAttr = (doc?.attributes || []).find((a: any) => a.className === "DocumentAttributeFilename");
        if (mime.startsWith("video/") && size && size <= MAX_FILE_BYTES) {
          const buf = await client.downloadMedia(m, {}) as Uint8Array;
          if (buf?.length) out.push({ media_type: "Видео", media_url: await uploadBuffer(sourceId, post.external_id, i++, new Uint8Array(buf), "mp4", mime), file_name: `tg-${m.id}.mp4` });
        } else if (mime.startsWith("video/")) {
          // видео больше 50 МБ — обложка с отметкой ▶
          const thumb = await client.downloadMedia(m, { thumb: (doc.thumbs || []).length - 1 }) as Uint8Array;
          if (thumb?.length) out.push({ media_type: "Фото", media_url: await uploadBuffer(sourceId, post.external_id, i++, new Uint8Array(thumb), "jpg", "image/jpeg"), file_name: `tg-${m.id}-videocover.jpg` });
        } else if (size && size <= MAX_FILE_BYTES) {
          const buf = await client.downloadMedia(m, {}) as Uint8Array;
          const fname = nameAttr?.fileName || `file-${m.id}`;
          const ext = (fname.match(/\.([A-Za-z0-9]{2,5})$/) || [])[1]?.toLowerCase() || "bin";
          const kind = mime.startsWith("image/") ? "Фото" : "Файл";
          if (buf?.length) out.push({ media_type: kind, media_url: await uploadBuffer(sourceId, post.external_id, i++, new Uint8Array(buf), ext, mime || "application/octet-stream"), file_name: fname });
        }
      }
    } catch { /* одно вложение не скачалось — пост всё равно публикуем */ }
  }
  return out;
}

async function syncSource(client: TelegramClient, src: any) {
  let added = 0;
  try {
    const posts = await channelPosts(client, src.meta);
    const { data: seenRows } = await db.from("feed_source_items").select("external_id").eq("source_id", src.id);
    const seen = new Set((seenRows || []).map((r: any) => String(r.external_id)));
    let fresh = posts.filter((p) => !p.ids.some((x: string) => seen.has(String(x))));
    if (!src.last_synced_at && fresh.length > FIRST_SYNC_POSTS) {
      const skip = fresh.slice(0, fresh.length - FIRST_SYNC_POSTS).flatMap((p) => p.ids);
      await db.from("feed_source_items").upsert(skip.map((x: string) => ({ source_id: src.id, external_id: x })), { onConflict: "source_id,external_id", ignoreDuplicates: true });
      fresh = fresh.slice(-FIRST_SYNC_POSTS);
    }
    for (const p of fresh.slice(-MAX_POSTS_PER_RUN)) {
      const media = await mediaOf(client, src.id, p);
      if (!p.text && !media.length) { await db.from("feed_source_items").upsert(p.ids.map((x: string) => ({ source_id: src.id, external_id: x })), { onConflict: "source_id,external_id", ignoreDuplicates: true }); continue; }
      const { data: news, error } = await db.from("news").insert({
        agency_id: src.agency_id, title: (p.text || src.title).slice(0, 80), content: p.text || "", likes_count: 0, comments_count: 0,
        created_at: p.date, source_id: src.id, source_name: src.title,
      }).select("id").single();
      if (error) throw new Error(error.message);
      if (media.length) await db.from("news_media").insert(media.map((m) => ({ ...m, news_id: news.id, link_url: null })));
      await db.from("feed_source_items").upsert(p.ids.map((x: string) => ({ source_id: src.id, external_id: x, news_id: news.id })), { onConflict: "source_id,external_id" });
      added++;
    }
    await db.from("feed_sources").update({ last_synced_at: new Date().toISOString(), last_added: added, last_error: null }).eq("id", src.id);
    return { id: src.id, title: src.title, added, error: null };
  } catch (e) {
    const msg = humanError(e);
    await db.from("feed_sources").update({ last_synced_at: new Date().toISOString(), last_added: 0, last_error: msg }).eq("id", src.id);
    return { id: src.id, title: src.title, added: 0, error: msg };
  }
}

// Синхронизация всех закрытых источников одного агентства (одно подключение к Telegram)
async function syncAgency(agencyId: number, sourceId?: number) {
  const { data: acc } = await db.from("telegram_accounts").select("*").eq("agency_id", agencyId).maybeSingle();
  let q = db.from("feed_sources").select("*").eq("agency_id", agencyId).eq("kind", "tg_private");
  q = sourceId ? q.eq("id", sourceId) : q.eq("active", true);
  const { data: sources } = await q;
  if (!sources?.length) return [];
  if (!acc?.session || acc.status !== "connected") {
    for (const s of sources) await db.from("feed_sources").update({ last_synced_at: new Date().toISOString(), last_error: "Telegram-аккаунт агентства не подключён" }).eq("id", s.id);
    return sources.map((s: any) => ({ id: s.id, title: s.title, added: 0, error: "Telegram-аккаунт агентства не подключён" }));
  }
  let client: TelegramClient | undefined;
  try {
    ({ client } = await makeClient(acc.session));
    const results = [];
    for (const s of sources) results.push(await syncSource(client, s));
    return results;
  } catch (e) {
    const msg = humanError(e);
    if (/сброшен|завершён/.test(msg)) await db.from("telegram_accounts").update({ status: "new", session: null, updated_at: new Date().toISOString() }).eq("agency_id", agencyId);
    return sources.map((s: any) => ({ id: s.id, title: s.title, added: 0, error: msg }));
  } finally { await close(client); }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });
  let body: any = {};
  try { body = await req.json(); } catch { body = {}; }

  // По расписанию — все агентства
  const cronSecret = req.headers.get("x-cron-secret");
  if (cronSecret) {
    if (cronSecret !== await setting("feed_sync_secret")) return json({ error: "forbidden" }, 403);
    if (body.action === "diag") {
      // Служебная проверка ключа приложения (без входа в аккаунт): подключение + запрос кода на заведомо несуществующий номер
      const out: Record<string, unknown> = {};
      let c: TelegramClient | undefined;
      try {
        const r = await makeClient(""); c = r.client; out.connect = "ok";
        try { await c.invoke(new Api.help.GetNearestDc()); out.call = "ok"; } catch (e) { out.call = String((e as any)?.errorMessage || e); }
        try { await c.sendCode({ apiId: r.apiId, apiHash: r.apiHash }, "+999000000000"); out.send_code = "ok?"; } catch (e) { out.send_code = String((e as any)?.errorMessage || (e as Error)?.message || e).slice(0, 300); }
        try { const t: any = await c.invoke(new Api.auth.ExportLoginToken({ apiId: r.apiId, apiHash: r.apiHash, exceptIds: [] })); out.qr = t.className; } catch (e) { out.qr = String((e as any)?.errorMessage || e).slice(0, 200); }
      } catch (e) { out.error = String((e as Error)?.message || e).slice(0, 300); } finally { await close(c); }
      return json(out);
    }
    const { data: rows } = await db.from("feed_sources").select("agency_id").eq("kind", "tg_private").eq("active", true);
    const agencies = [...new Set((rows || []).map((r: any) => r.agency_id))];
    const results = [];
    for (const a of agencies) results.push(...await syncAgency(a));
    return json({ ok: true, results });
  }

  // Администратор агентства из CRM
  const auth = req.headers.get("Authorization") || "";
  if (!auth.startsWith("Bearer ")) return json({ error: "Нужен вход в CRM" }, 401);
  const user = createClient(SUPABASE_URL, ANON_KEY, { global: { headers: { Authorization: auth } }, auth: { persistSession: false } });
  const [{ data: isTech }, { data: isDirector }, { data: agencyId }, { data: me }] = await Promise.all([
    user.rpc("crm_is_tech"), user.rpc("crm_is_director"), user.rpc("crm_agency_id"), user.rpc("crm_my_email"),
  ]);
  if (!isTech && !isDirector) return json({ error: "Только для администратора" }, 403);
  if (!agencyId) return json({ error: "Не определено агентство пользователя" }, 400);
  const action = String(body.action || "status");

  try {
    if (action === "status") {
      const configured = !!(await setting("tg_api_id")) && !!(await setting("tg_api_hash"));
      const { data: acc } = await db.from("telegram_accounts").select("status,phone,tg_name,updated_at").eq("agency_id", agencyId).maybeSingle();
      const phone = acc?.phone ? acc.phone.replace(/^(\+?\d{5})\d+(\d{2})$/, "$1•••••$2") : null;
      return json({ ok: true, configured, can_configure: !!isTech, status: acc?.status || "new", phone, name: acc?.tg_name || null });
    }

    if (action === "set_api") {
      if (!isTech) return json({ error: "Ключ приложения задаёт только тех. администратор" }, 403);
      const id = String(body.api_id || "").trim(), hash = String(body.api_hash || "").trim();
      if (!/^\d{4,12}$/.test(id) || !/^[a-f0-9]{32}$/i.test(hash)) return json({ ok: false, error: "api_id — это число, api_hash — 32 символа (буквы a–f и цифры)" });
      await db.from("crm_private_settings").upsert([{ key: "tg_api_id", value: id }, { key: "tg_api_hash", value: hash }]);
      return json({ ok: true });
    }

    if (action === "send_code" || action === "resend") {
      let phone = String(body.phone || "").replace(/[^\d+]/g, "");
      if (/^0\d{9}$/.test(phone)) phone = "+38" + phone;           // 0671234567 → +380671234567
      if (/^380\d{9}$/.test(phone)) phone = "+" + phone;
      let acc: any = null;
      if (action === "resend") {
        ({ data: acc } = await db.from("telegram_accounts").select("*").eq("agency_id", agencyId).maybeSingle());
        if (!acc?.temp_session || !acc?.phone_code_hash) return json({ ok: false, error: "Сначала нажмите «Получить код»" });
        phone = acc.phone;
      } else if (!/^\+\d{10,15}$/.test(phone)) return json({ ok: false, error: "Введите номер в формате +380XXXXXXXXX" });
      const { client, apiId, apiHash } = await makeClient(action === "resend" ? acc.temp_session : "");
      try {
        const res: any = action === "resend"
          ? await client.invoke(new Api.auth.ResendCode({ phoneNumber: phone, phoneCodeHash: acc.phone_code_hash }))
          : await client.invoke(new Api.auth.SendCode({ phoneNumber: phone, apiId, apiHash, settings: new Api.CodeSettings({}) }));
        if (res.className === "auth.SentCodeSuccess") return json({ ok: false, error: "Telegram сразу авторизовал вход — нажмите «Другой номер» и попробуйте ещё раз" });
        const t = String(res.type?.className || "");
        const where =
          t.includes("App") ? "в приложение Telegram — чат «Telegram» с синей галочкой (на телефоне или компьютере, где открыт этот номер)" :
          t.includes("SetUpEmailRequired") ? "никуда: Telegram требует сначала добавить почту для входа. Откройте Telegram → Настройки → Конфиденциальность → Почта для входа, добавьте почту и запросите код снова" :
          t.includes("Email") ? `на почту для входа${res.type?.emailPattern ? " (" + res.type.emailPattern + ")" : ""}` :
          t.includes("FragmentSms") ? "через Fragment (номер куплен на Fragment) — код в приложении Fragment" :
          t.includes("Sms") || t.includes("FirebaseSms") ? "по СМС на этот номер" :
          t.includes("Call") || t.includes("FlashCall") || t.includes("MissedCall") ? "звонком на этот номер — код это последние цифры номера звонящего / продиктует робот" :
          "способом " + t;
        const next = String(res.nextType?.className || "");
        await db.from("telegram_accounts").upsert({ agency_id: agencyId, phone, status: "code_sent", temp_session: (client.session as any).save(), phone_code_hash: res.phoneCodeHash, connected_by_email: me || null, updated_at: new Date().toISOString() });
        console.log("telegram-private sent code", t, "next", next);
        return json({ ok: true, type: t, where, can_resend: !!next, timeout: res.timeout || null });
      } finally { await close(client); }
    }

    // Вход по QR-коду / подтверждению в приложении Telegram (без кода из СМС/чата)
    if (action === "qr_start" || action === "qr_check") {
      const { data: acc } = await db.from("telegram_accounts").select("*").eq("agency_id", agencyId).maybeSingle();
      const session = action === "qr_check" && acc?.status === "qr_wait" ? (acc.temp_session || "") : "";
      if (action === "qr_check" && !session) return json({ ok: false, error: "Нажмите «Войти по QR-коду» ещё раз" });
      const { client, apiId, apiHash } = await makeClient(session);
      try {
        let r: any;
        try {
          r = await client.invoke(new Api.auth.ExportLoginToken({ apiId, apiHash, exceptIds: [] }));
          if (r.className === "auth.LoginTokenMigrateTo") {
            await (client as any)._switchDC(r.dcId);
            r = await client.invoke(new Api.auth.ImportLoginToken({ token: r.token }));
          }
        } catch (e) {
          if (String((e as any)?.errorMessage || e).includes("SESSION_PASSWORD_NEEDED")) {
            await db.from("telegram_accounts").upsert({ agency_id: agencyId, status: "password_needed", temp_session: (client.session as any).save(), connected_by_email: me || null, updated_at: new Date().toISOString() });
            return json({ ok: false, need_password: true, error: "Вход подтверждён. У аккаунта включена двухэтапная проверка — введите пароль" });
          }
          throw e;
        }
        if (r.className === "auth.LoginTokenSuccess") {
          const me2: any = await client.getMe();
          const name = [me2?.firstName, me2?.lastName].filter(Boolean).join(" ") || me2?.username || "Telegram";
          await db.from("telegram_accounts").upsert({ agency_id: agencyId, status: "connected", session: (client.session as any).save(), temp_session: null, phone_code_hash: null, phone: me2?.phone ? "+" + me2.phone : null, tg_name: name, connected_by_email: me || null, updated_at: new Date().toISOString() });
          return json({ ok: true, connected: true, name });
        }
        const bytes = new Uint8Array(r.token);
        let bin = ""; for (const b of bytes) bin += String.fromCharCode(b);
        const url = "tg://login?token=" + btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
        const svg = await QRCode.toString(url, { type: "svg", margin: 1, width: 240, color: { dark: "#000000", light: "#ffffff" } });
        await db.from("telegram_accounts").upsert({ agency_id: agencyId, status: "qr_wait", temp_session: (client.session as any).save(), connected_by_email: me || null, updated_at: new Date().toISOString() });
        return json({ ok: true, waiting: true, url, svg, expires: r.expires || null });
      } finally { await close(client); }
    }

    if (action === "sign_in") {
      const { data: acc } = await db.from("telegram_accounts").select("*").eq("agency_id", agencyId).maybeSingle();
      if (!acc?.temp_session) return json({ ok: false, error: "Сначала нажмите «Получить код»" });
      const { client, apiId, apiHash } = await makeClient(acc.temp_session);
      try {
        let needPwd = acc.status === "password_needed";
        if (!needPwd) {
          try {
            await client.invoke(new Api.auth.SignIn({ phoneNumber: acc.phone, phoneCodeHash: acc.phone_code_hash, phoneCode: String(body.code || "").replace(/\D/g, "") }));
          } catch (e) {
            if (!String((e as any)?.errorMessage || e).includes("SESSION_PASSWORD_NEEDED")) throw e;
            needPwd = true;
            if (!body.password) {
              await db.from("telegram_accounts").update({ status: "password_needed", temp_session: (client.session as any).save(), updated_at: new Date().toISOString() }).eq("agency_id", agencyId);
              return json({ ok: false, need_password: true, error: "У аккаунта включена двухэтапная проверка — введите пароль" });
            }
          }
        }
        if (needPwd) {
          if (!body.password) return json({ ok: false, need_password: true, error: "Введите пароль двухэтапной проверки" });
          await client.signInWithPassword({ apiId, apiHash }, { password: async () => String(body.password), onError: async (e: Error) => { throw e; } });
        }
        const me2: any = await client.getMe();
        const name = [me2?.firstName, me2?.lastName].filter(Boolean).join(" ") || me2?.username || "Telegram";
        await db.from("telegram_accounts").update({ status: "connected", session: (client.session as any).save(), temp_session: null, phone_code_hash: null, tg_name: name, updated_at: new Date().toISOString() }).eq("agency_id", agencyId);
        return json({ ok: true, name });
      } finally { await close(client); }
    }

    if (action === "logout") {
      const { data: acc } = await db.from("telegram_accounts").select("session").eq("agency_id", agencyId).maybeSingle();
      if (acc?.session) { let c: TelegramClient | undefined; try { ({ client: c } = await makeClient(acc.session)); await c.invoke(new Api.auth.LogOut()); } catch { /* */ } finally { await close(c); } }
      await db.from("telegram_accounts").delete().eq("agency_id", agencyId);
      return json({ ok: true });
    }

    if (action === "resolve") {
      const { data: acc } = await db.from("telegram_accounts").select("session,status").eq("agency_id", agencyId).maybeSingle();
      if (!acc?.session || acc.status !== "connected") return json({ ok: false, error: "Сначала подключите Telegram-аккаунт агентства" });
      const { client } = await makeClient(acc.session);
      try {
        const ch = await resolveChannel(client, String(body.link || ""));
        const posts = await channelPosts(client, ch.meta, 20);
        return json({ ok: true, title: ch.title, handle: ch.meta.channel_id, meta: ch.meta, count: posts.length,
          sample: posts.slice(-3).reverse().map((p) => ({ text: p.text.slice(0, 160), files: p.mediaCount })) });
      } finally { await close(client); }
    }

    if (action === "sync") {
      return json({ ok: true, results: await syncAgency(agencyId, body.source_id ? Number(body.source_id) : undefined) });
    }

    return json({ error: "Неизвестное действие" }, 400);
  } catch (e) {
    console.error("telegram-private", action, String((e as any)?.errorMessage || (e as Error)?.message || e), (e as Error)?.stack?.slice(0, 600));
    return json({ ok: false, error: humanError(e) });
  }
});
