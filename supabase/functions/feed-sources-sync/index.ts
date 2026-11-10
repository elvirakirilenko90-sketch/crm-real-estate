// Импорт новостей в ленту агентства из подключённых источников: публичные Telegram-каналы и папки Google Drive.
// У поста в ленте показывается только название источника, которое задал администратор. Ссылки на источник
// в пост не попадают: упоминания канала вырезаются из текста, фото и файлы копируются в наше хранилище.
//
// Запуск:
//  • по расписанию (pg_cron) с заголовком x-cron-secret — все активные источники всех агентств;
//  • администратором из CRM (его JWT) — источники его агентства, или один source_id;
//  • {preview:{kind,url}} — проверка ссылки без публикации (при добавлении источника).
import { createClient } from "jsr:@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
const BUCKET = "news-media";
const FIRST_SYNC_POSTS = 3;     // при первом подключении — только последние посты, без всей истории канала
const MAX_POSTS_PER_RUN = 10;
const MAX_FILE_BYTES = 20 * 1024 * 1024;
const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-cron-secret",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
const UA = { "User-Agent": "Mozilla/5.0 (compatible; CRMFeedBot/1.0)", "Accept-Language": "uk,ru;q=0.9,en;q=0.8" };
const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { ...CORS, "Content-Type": "application/json" } });

type Item = { external_id: string; text: string; files: { url: string; kind: "Фото" | "Файл"; name: string }[]; date?: string };

// ---------- разбор ссылок ----------
function telegramHandle(url: string) {
  const s = String(url || "").trim();
  const m = s.match(/(?:t\.me\/(?:s\/)?|telegram\.me\/|^@)([A-Za-z0-9_]{4,})/i) || s.match(/^([A-Za-z0-9_]{4,})$/);
  return m && !/^(joinchat|addlist|c)$/i.test(m[1]) ? m[1] : null;
}
function driveFolderId(url: string) {
  const s = String(url || "");
  const m = s.match(/folders\/([A-Za-z0-9_-]{10,})/) || s.match(/[?&]id=([A-Za-z0-9_-]{10,})/);
  return m ? m[1] : null;
}

// ---------- текст ----------
function decodeHtml(s: string) {
  return s.replace(/&nbsp;/g, " ").replace(/&quot;/g, '"').replace(/&#39;|&#039;/g, "'").replace(/&lt;/g, "<").replace(/&gt;/g, ">")
    .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(+n)).replace(/&#x([0-9a-f]+);/gi, (_, n) => String.fromCodePoint(parseInt(n, 16))).replace(/&amp;/g, "&");
}
function htmlToText(h: string) {
  return decodeHtml(h.replace(/<br\s*\/?>/gi, "\n").replace(/<\/(p|div)>/gi, "\n").replace(/<[^>]+>/g, "")).replace(/[ \t]+\n/g, "\n").replace(/\n{3,}/g, "\n\n").trim();
}
// Убираем из текста ссылки и упоминания исходного канала — менеджеры их не видят
function stripSource(text: string, handle: string) {
  const h = handle.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return text
    .replace(new RegExp(`(?:https?:\\/\\/)?(?:www\\.)?(?:t|telegram)\\.me\\/(?:s\\/)?${h}\\S*`, "gi"), "")
    .replace(new RegExp(`@${h}\\b`, "gi"), "")
    .split("\n").map((l) => l.trimEnd())
    .filter((l, i, a) => !(l.trim() === "" && (a[i - 1] ?? "").trim() === ""))
    .join("\n").replace(/\n+$/g, "").trim();
}

// ---------- Telegram (веб-версия публичного канала t.me/s/имя) ----------
async function telegramItems(handle: string): Promise<Item[]> {
  const r = await fetch(`https://t.me/s/${handle}`, { headers: UA, redirect: "follow" });
  if (!r.ok) throw new Error(`Telegram не ответил (${r.status})`);
  const html = await r.text();
  if (!/tgme_widget_message_wrap/.test(html)) throw new Error("Канал не найден или закрыт. Для закрытого канала выберите «Закрытый Telegram-канал».");
  const out: Item[] = [];
  for (const block of html.split(/<div class="tgme_widget_message_wrap/).slice(1)) {
    const id = (block.match(/data-post="[^"/]+\/(\d+)"/) || [])[1];
    if (!id) continue;
    const textHtml = (block.match(/<div class="tgme_widget_message_text[^"]*"[^>]*>([\s\S]*?)<\/div>/) || [])[1] || "";
    const photos = [...block.matchAll(/tgme_widget_message_photo_wrap[^"]*"[^>]*?background-image:url\('([^']+)'\)/g)].map((m) => m[1]);
    const videoThumb = (block.match(/tgme_widget_message_video_thumb"[^>]*?background-image:url\('([^']+)'\)/) || [])[1];
    const date = (block.match(/<time[^>]+datetime="([^"]+)"/) || [])[1];
    const images = photos.length ? photos : videoThumb ? [videoThumb] : [];
    const text = stripSource(htmlToText(textHtml), handle);
    if (!text && !images.length) continue; // служебные сообщения канала
    out.push({ external_id: id, text, date, files: images.slice(0, 4).map((u, i) => ({ url: u, kind: "Фото" as const, name: `tg-${id}-${i}.jpg` })) });
  }
  return out; // страница идёт от старых к новым
}

// ---------- Google Drive (папка с доступом «Все, у кого есть ссылка») ----------
const IMG_EXT = /\.(jpe?g|png|webp|gif|heic|heif|bmp)$/i;
async function driveItems(folderId: string): Promise<Item[]> {
  const r = await fetch(`https://drive.google.com/embeddedfolderview?id=${folderId}`, { headers: UA, redirect: "follow" });
  const html = await r.text();
  if (!r.ok || /accounts\.google\.com\/(ServiceLogin|v3\/signin)/.test(r.url + html.slice(0, 3000))) {
    throw new Error("Папка закрыта. В Google Drive откройте доступ «Все, у кого есть ссылка» (просмотр).");
  }
  const out: Item[] = [];
  for (const block of html.split(/<div class="flip-entry"/).slice(1)) {
    const id = (block.match(/id="entry-([A-Za-z0-9_-]+)"/) || [])[1];
    const href = decodeHtml((block.match(/<a href="([^"]+)"/) || [])[1] || "");
    const name = decodeHtml(((block.match(/<div class="flip-entry-title">([\s\S]*?)<\/div>/) || [])[1] || "").replace(/<[^>]+>/g, "")).trim();
    if (!id || !name || /\/folders\//.test(href)) continue; // вложенные папки пропускаем
    const title = name.replace(/\.[A-Za-z0-9]{2,5}$/, "");
    let file: Item["files"][number] | null = null;
    if (IMG_EXT.test(name)) file = { url: `https://drive.google.com/thumbnail?id=${id}&sz=w2000`, kind: "Фото", name: `${id}.jpg` };
    else if (/docs\.google\.com\/document\//.test(href)) file = { url: `https://docs.google.com/document/d/${id}/export?format=pdf`, kind: "Файл", name: `${title}.pdf` };
    else if (/docs\.google\.com\/spreadsheets\//.test(href)) file = { url: `https://docs.google.com/spreadsheets/d/${id}/export?format=pdf`, kind: "Файл", name: `${title}.pdf` };
    else if (/docs\.google\.com\/presentation\//.test(href)) file = { url: `https://docs.google.com/presentation/d/${id}/export/pdf`, kind: "Файл", name: `${title}.pdf` };
    else file = { url: `https://drive.google.com/uc?export=download&id=${id}`, kind: "Файл", name };
    out.push({ external_id: id, text: title, files: [file] });
  }
  return out.reverse(); // в списке папки сначала новые — переворачиваем: от старых к новым
}

// ---------- копирование файла в наше хранилище ----------
async function copyToStorage(db: ReturnType<typeof createClient>, sourceId: number, extId: string, f: Item["files"][number], idx: number) {
  const r = await fetch(f.url, { headers: UA, redirect: "follow" });
  if (!r.ok) throw new Error(`файл не скачался (${r.status})`);
  const type = r.headers.get("content-type") || "";
  if (type.includes("text/html")) throw new Error("файл недоступен для скачивания (закрыт или слишком большой)");
  const buf = new Uint8Array(await r.arrayBuffer());
  if (buf.byteLength > MAX_FILE_BYTES) throw new Error("файл больше 20 МБ");
  const ext = (f.name.match(/\.([A-Za-z0-9]{2,5})$/) || [])[1]?.toLowerCase() || (type.includes("png") ? "png" : type.includes("pdf") ? "pdf" : "jpg");
  const path = `feed/${sourceId}/${extId}-${idx}.${ext}`;
  const up = await db.storage.from(BUCKET).upload(path, buf, { contentType: type || undefined, upsert: true });
  if (up.error) throw new Error(up.error.message);
  return db.storage.from(BUCKET).getPublicUrl(path).data.publicUrl;
}

async function loadItems(kind: string, handle: string) {
  return kind === "telegram" ? await telegramItems(handle) : await driveItems(handle);
}

// ---------- синхронизация одного источника ----------
async function syncSource(db: ReturnType<typeof createClient>, src: any) {
  let added = 0;
  const errors: string[] = [];
  try {
    const items = await loadItems(src.kind, src.handle);
    const { data: seenRows } = await db.from("feed_source_items").select("external_id").eq("source_id", src.id);
    const seen = new Set((seenRows || []).map((r: any) => String(r.external_id)));
    let fresh = items.filter((it) => !seen.has(String(it.external_id)));
    if (!src.last_synced_at && fresh.length > FIRST_SYNC_POSTS) {
      // Первое подключение: публикуем только последние посты, остальное помечаем как просмотренное
      const skip = fresh.slice(0, fresh.length - FIRST_SYNC_POSTS);
      if (skip.length) await db.from("feed_source_items").upsert(skip.map((it) => ({ source_id: src.id, external_id: it.external_id })), { onConflict: "source_id,external_id", ignoreDuplicates: true });
      fresh = fresh.slice(-FIRST_SYNC_POSTS);
    }
    for (const it of fresh.slice(-MAX_POSTS_PER_RUN)) {
      const media: { media_type: string; media_url: string; file_name: string }[] = [];
      for (let i = 0; i < it.files.length; i++) {
        try { media.push({ media_type: it.files[i].kind, media_url: await copyToStorage(db, src.id, it.external_id, it.files[i], i), file_name: it.files[i].name }); }
        catch (e) { errors.push(`${it.external_id}: ${(e as Error).message}`); }
      }
      if (!it.text && !media.length) { await db.from("feed_source_items").upsert({ source_id: src.id, external_id: it.external_id }, { onConflict: "source_id,external_id", ignoreDuplicates: true }); continue; }
      const { data: news, error } = await db.from("news").insert({
        agency_id: src.agency_id, title: (it.text || src.title).slice(0, 80), content: it.text || "",
        likes_count: 0, comments_count: 0, created_at: it.date || new Date().toISOString(),
        source_id: src.id, source_name: src.title,
      }).select("id").single();
      if (error) { errors.push(error.message); continue; }
      if (media.length) await db.from("news_media").insert(media.map((m) => ({ ...m, news_id: news.id, link_url: null })));
      await db.from("feed_source_items").upsert({ source_id: src.id, external_id: it.external_id, news_id: news.id }, { onConflict: "source_id,external_id" });
      added++;
    }
    await db.from("feed_sources").update({ last_synced_at: new Date().toISOString(), last_added: added, last_error: errors.length ? errors.slice(0, 3).join("; ") : null }).eq("id", src.id);
  } catch (e) {
    const msg = (e as Error).message || String(e);
    await db.from("feed_sources").update({ last_synced_at: new Date().toISOString(), last_added: 0, last_error: msg }).eq("id", src.id);
    return { id: src.id, title: src.title, added: 0, error: msg };
  }
  return { id: src.id, title: src.title, added, error: errors.length ? errors.slice(0, 3).join("; ") : null };
}

// Проверка ссылки без публикации: сколько постов видно и как они выглядят
async function previewSource(p: any) {
  const kind = p?.kind === "gdrive" ? "gdrive" : "telegram";
  if (kind === "telegram" && /(?:t\.me|telegram\.me)\/(?:\+|joinchat\/)/i.test(String(p?.url || ""))) return { ok: false, private: true, error: "Это ссылка-приглашение в закрытый канал. Выберите вариант «Закрытый Telegram-канал» — его CRM читает через Telegram-аккаунт агентства." };
  const handle = kind === "telegram" ? telegramHandle(p?.url) : driveFolderId(p?.url);
  if (!handle) return { ok: false, error: kind === "telegram" ? "Не похоже на ссылку на канал. Пример: https://t.me/имя_канала" : "Не похоже на ссылку на папку. Пример: https://drive.google.com/drive/folders/…" };
  try {
    const items = await loadItems(kind, handle);
    return { ok: true, handle, count: items.length, sample: items.slice(-3).reverse().map((i) => ({ text: i.text.slice(0, 160), files: i.files.length, date: i.date || null })) };
  } catch (e) { return { ok: false, handle, error: (e as Error).message }; }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });
  const db = createClient(SUPABASE_URL, SERVICE_KEY, { auth: { persistSession: false } });
  let body: any = {};
  try { body = await req.json(); } catch { body = {}; }

  // 1) Запуск по расписанию
  const cronSecret = req.headers.get("x-cron-secret");
  if (cronSecret) {
    const { data: s } = await db.from("crm_private_settings").select("value").eq("key", "feed_sync_secret").single();
    if (!s || s.value !== cronSecret) return json({ error: "forbidden" }, 403);
    if (body.preview) return json(await previewSource(body.preview));
    const { data: sources } = await db.from("feed_sources").select("*").eq("active", true).in("kind", ["telegram", "gdrive"]);
    const results = [];
    for (const src of sources || []) results.push(await syncSource(db, src));
    return json({ ok: true, results });
  }

  // 2) Запуск администратором из CRM
  const auth = req.headers.get("Authorization") || "";
  if (!auth.startsWith("Bearer ")) return json({ error: "Нужен вход в CRM" }, 401);
  const user = createClient(SUPABASE_URL, ANON_KEY, { global: { headers: { Authorization: auth } }, auth: { persistSession: false } });
  const [{ data: isTech }, { data: isDirector }] = await Promise.all([user.rpc("crm_is_tech"), user.rpc("crm_is_director")]);
  if (!isTech && !isDirector) return json({ error: "Только для администратора" }, 403);

  if (body.preview) return json(await previewSource(body.preview));

  // RLS сам ограничит источники агентством администратора
  // закрытые каналы (tg_private) обновляет функция telegram-private
  let q = user.from("feed_sources").select("*").eq("active", true).in("kind", ["telegram", "gdrive"]);
  if (body.source_id) q = user.from("feed_sources").select("*").eq("id", body.source_id).in("kind", ["telegram", "gdrive"]);
  const { data: sources, error } = await q;
  if (error) return json({ error: error.message }, 400);
  const results = [];
  for (const src of sources || []) results.push(await syncSource(db, src));
  return json({ ok: true, results });
});
