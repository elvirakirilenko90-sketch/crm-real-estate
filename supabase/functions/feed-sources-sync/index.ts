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
const MAX_FILE_BYTES = 50 * 1024 * 1024; // видео до 50 МБ
const MAX_FILES_PER_POST = 20;           // альбом Telegram — до 10 файлов, с запасом
const MERGE_WINDOW_SEC = 180;            // текст и фото, отправленные подряд отдельными сообщениями, — один пост
const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-cron-secret",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
const UA = { "User-Agent": "Mozilla/5.0 (compatible; CRMFeedBot/1.0)", "Accept-Language": "uk,ru;q=0.9,en;q=0.8" };
const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { ...CORS, "Content-Type": "application/json" } });

type Item = { external_id: string; ids?: string[]; text: string; files: { url: string; kind: "Фото" | "Видео" | "Файл"; name: string }[]; date?: string };

// Служебные сообщения (вступил/вышел/удалён, сменили фото канала, закрепили…) в ленту не попадают
const SERVICE_TEXT = /(joined|left|was removed|removed|added|pinned|changed the (group|channel) (photo|name)|channel photo|group photo|приєдна|вступи|покину|вийш|видали|додав|закріпи|змінив (фото|назву)|присоедин|вступил|покинул|вышел|удалил|добавил|закрепил|изменил (фото|название))/i;

// Подряд идущие «только текст» + «только фото/видео» (или наоборот) в пределах 3 минут — один пост
function mergeAdjacent(items: Item[]): Item[] {
  const out: Item[] = [];
  for (const it of items) {
    const prev = out[out.length - 1];
    const close = prev && prev.date && it.date && Math.abs(Date.parse(it.date) - Date.parse(prev.date)) <= MERGE_WINDOW_SEC * 1000;
    const complementary = prev && ((!prev.files.length && it.files.length && !it.text) || (prev.files.length && !prev.text && it.text && !it.files.length) || (prev.files.length && !it.text && it.files.length && !prev.text));
    if (close && complementary && prev.files.length + it.files.length <= MAX_FILES_PER_POST) {
      prev.text = [prev.text, it.text].filter(Boolean).join("\n\n");
      prev.files = prev.files.concat(it.files);
      prev.ids = (prev.ids || [prev.external_id]).concat(it.ids || [it.external_id]);
    } else out.push({ ...it, ids: it.ids || [it.external_id] });
  }
  return out;
}

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
    const head = block.slice(0, 400);
    if (/service_message/.test(head)) continue; // вступил/вышел/удалён и прочие служебные
    const textHtml = (block.match(/<div class="tgme_widget_message_text[^"]*"[^>]*>([\s\S]*?)<\/div>/) || [])[1] || "";
    const date = (block.match(/<time[^>]+datetime="([^"]+)"/) || [])[1];
    // Фото и видео в том порядке, в котором они в посте
    const files: Item["files"] = [];
    const re = /<a class="tgme_widget_message_photo_wrap[^"]*"[^>]*?background-image:url\('([^']+)'\)|<a class="tgme_widget_message_video_player[\s\S]*?<\/a>/g;
    let m: RegExpExecArray | null; let i = 0;
    while ((m = re.exec(block)) && files.length < MAX_FILES_PER_POST) {
      if (m[1]) { files.push({ url: m[1], kind: "Фото", name: `tg-${id}-${i++}.jpg` }); continue; }
      const v = m[0];
      const src = (v.match(/<video[^>]+src="([^"]+)"/) || [])[1];
      const thumb = (v.match(/tgme_widget_message_video_thumb"[^>]*?background-image:url\('([^']+)'\)/) || [])[1];
      if (src) files.push({ url: src.startsWith("//") ? "https:" + src : src, kind: "Видео", name: `tg-${id}-${i++}.mp4` });
      else if (thumb) files.push({ url: thumb, kind: "Фото", name: `tg-${id}-${i++}-videocover.jpg` }); // большое видео: Telegram отдаёт только обложку
    }
    const text = stripSource(htmlToText(textHtml), handle);
    if (!text && !files.length) continue;
    if (!files.length && text.length < 140 && SERVICE_TEXT.test(text) && !/[0-9]{2,}/.test(text)) continue;
    out.push({ external_id: id, ids: [id], text, date, files });
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
  if (buf.byteLength > MAX_FILE_BYTES) throw new Error("файл больше 50 МБ");
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
    const { data: seenRows } = await db.from("feed_source_items").select("external_id,news_id").eq("source_id", src.id);
    const seen = new Set((seenRows || []).map((r: any) => String(r.external_id)));
    const newsOf = new Map((seenRows || []).filter((r: any) => r.news_id).map((r: any) => [String(r.external_id), r.news_id]));

    // Дозагрузка: у уже опубликованных постов добавляем недостающие фото/видео альбома (раньше бралось максимум 4)
    for (const it of items) {
      const newsId = newsOf.get(String(it.external_id));
      if (!newsId || it.files.length < 2) continue;
      const { count } = await db.from("news_media").select("id", { count: "exact", head: true }).eq("news_id", newsId);
      const have = count || 0;
      if (have >= it.files.length) continue;
      const add: { media_type: string; media_url: string; file_name: string }[] = [];
      for (let i = have; i < it.files.length; i++) {
        try { add.push({ media_type: it.files[i].kind, media_url: await copyToStorage(db, src.id, it.external_id, it.files[i], i), file_name: it.files[i].name }); }
        catch (e) { errors.push(`${it.external_id}: ${(e as Error).message}`); }
      }
      if (add.length) await db.from("news_media").insert(add.map((m) => ({ ...m, news_id: newsId, link_url: null })));
    }

    let fresh = mergeAdjacent(items).filter((it) => !(it.ids || [it.external_id]).some((x) => seen.has(String(x))));
    if (!src.last_synced_at && fresh.length > FIRST_SYNC_POSTS) {
      // Первое подключение: публикуем только последние посты, остальное помечаем как просмотренное
      const skip = fresh.slice(0, fresh.length - FIRST_SYNC_POSTS).flatMap((it) => it.ids || [it.external_id]);
      if (skip.length) await db.from("feed_source_items").upsert(skip.map((x) => ({ source_id: src.id, external_id: x })), { onConflict: "source_id,external_id", ignoreDuplicates: true });
      fresh = fresh.slice(-FIRST_SYNC_POSTS);
    }
    for (const it of fresh.slice(-MAX_POSTS_PER_RUN)) {
      const media: { media_type: string; media_url: string; file_name: string }[] = [];
      for (let i = 0; i < it.files.length; i++) {
        try { media.push({ media_type: it.files[i].kind, media_url: await copyToStorage(db, src.id, it.external_id, it.files[i], i), file_name: it.files[i].name }); }
        catch (e) { errors.push(`${it.external_id}: ${(e as Error).message}`); }
      }
      if (!it.text && !media.length) { await db.from("feed_source_items").upsert((it.ids || [it.external_id]).map((x) => ({ source_id: src.id, external_id: x })), { onConflict: "source_id,external_id", ignoreDuplicates: true }); continue; }
      const { data: news, error } = await db.from("news").insert({
        agency_id: src.agency_id, title: (it.text || src.title).slice(0, 80), content: it.text || "",
        likes_count: 0, comments_count: 0, created_at: it.date || new Date().toISOString(),
        source_id: src.id, source_name: src.title,
      }).select("id").single();
      if (error) { errors.push(error.message); continue; }
      if (media.length) await db.from("news_media").insert(media.map((m) => ({ ...m, news_id: news.id, link_url: null })));
      await db.from("feed_source_items").upsert((it.ids || [it.external_id]).map((x) => ({ source_id: src.id, external_id: x, news_id: news.id })), { onConflict: "source_id,external_id" });
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
    const items = mergeAdjacent(await loadItems(kind, handle));
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
