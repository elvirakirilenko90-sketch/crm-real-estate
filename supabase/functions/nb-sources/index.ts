// Новобудови: подключённые ссылки по разделам (Квартиры / Дома-таунхаусы / Земля) и просмотр их содержимого.
// Ссылку на источник видит только администратор. Менеджеры видят название источника и материалы:
// папки и файлы Google Drive (с превью), посты Telegram-каналов.
//
// Действия (body.action):
//   list {category?}               — источники агентства (для менеджеров без ссылок)
//   browse {source_id, folder_id?} — содержимое источника / вложенной папки Google Drive
//   preview {kind, url}            — проверка ссылки перед подключением (только администратор)
//   sheet {source_id, file_id, gsheet} — таблица-прайс (Google Таблица или Excel/CSV из папки) для расчётов по формулам
import { createClient } from "jsr:@supabase/supabase-js@2";
import * as XLSX from "npm:xlsx@0.18.5";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
const UA = { "User-Agent": "Mozilla/5.0 (compatible; CRMBot/1.0)", "Accept-Language": "uk,ru;q=0.9,en;q=0.8" };
const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { ...CORS, "Content-Type": "application/json" } });
const db = createClient(SUPABASE_URL, SERVICE_KEY, { auth: { persistSession: false } });

function decodeHtml(s: string) {
  return s.replace(/&nbsp;/g, " ").replace(/&quot;/g, '"').replace(/&#39;|&#039;/g, "'").replace(/&lt;/g, "<").replace(/&gt;/g, ">")
    .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(+n)).replace(/&#x([0-9a-f]+);/gi, (_, n) => String.fromCodePoint(parseInt(n, 16))).replace(/&amp;/g, "&");
}
const htmlToText = (h: string) => decodeHtml(h.replace(/<br\s*\/?>/gi, "\n").replace(/<[^>]+>/g, "")).replace(/\n{3,}/g, "\n\n").trim();

// ---------- ссылки ----------
function driveFolderId(url: string) {
  const s = String(url || "");
  const m = s.match(/folders\/([A-Za-z0-9_-]{10,})/) || s.match(/[?&]id=([A-Za-z0-9_-]{10,})/);
  return m ? m[1] : null;
}
function telegramHandle(url: string) {
  const s = String(url || "").trim();
  if (/(?:t\.me|telegram\.me)\/(?:\+|joinchat\/)/i.test(s)) return null;
  const m = s.match(/(?:t\.me\/(?:s\/)?|telegram\.me\/|^@)([A-Za-z0-9_]{4,})/i);
  return m && !/^(joinchat|addlist|c)$/i.test(m[1]) ? m[1] : null;
}

// ---------- Google Drive: содержимое папки «Все, у кого есть ссылка» ----------
function fileType(name: string, href: string) {
  if (/docs\.google\.com\/document\//.test(href)) return "doc";
  if (/docs\.google\.com\/spreadsheets\//.test(href)) return "sheet";
  if (/docs\.google\.com\/presentation\//.test(href)) return "slides";
  if (/\.(jpe?g|png|webp|gif|heic|heif|bmp)$/i.test(name)) return "image";
  if (/\.(mp4|mov|avi|mkv|webm|m4v)$/i.test(name)) return "video";
  if (/\.pdf$/i.test(name)) return "pdf";
  if (/\.(xlsx?|csv|ods)$/i.test(name)) return "sheet";
  if (/\.(docx?|odt|rtf|txt)$/i.test(name)) return "doc";
  if (/\.(pptx?|odp|key)$/i.test(name)) return "slides";
  return "file";
}
async function driveFolder(folderId: string) {
  const r = await fetch(`https://drive.google.com/embeddedfolderview?id=${folderId}`, { headers: UA, redirect: "follow" });
  const html = await r.text();
  if (!r.ok || /accounts\.google\.com\/(ServiceLogin|v3\/signin)/.test(r.url + html.slice(0, 3000))) {
    throw new Error("Папка закрыта. В Google Drive откройте доступ «Все, у кого есть ссылка» (просмотр).");
  }
  const title = decodeHtml((html.match(/<title>([\s\S]*?)<\/title>/) || [])[1] || "").replace(/\s*[-–]\s*Google Drive\s*$/i, "").trim();
  const folders: { id: string; name: string }[] = [];
  const files: { id: string; name: string; type: string; thumb: string | null; open: string; modified: string | null }[] = [];
  for (const block of html.split(/<div class="flip-entry"/).slice(1)) {
    const id = (block.match(/id="entry-([A-Za-z0-9_-]+)"/) || [])[1];
    const href = decodeHtml((block.match(/<a href="([^"]+)"/) || [])[1] || "");
    const name = decodeHtml(((block.match(/<div class="flip-entry-title">([\s\S]*?)<\/div>/) || [])[1] || "").replace(/<[^>]+>/g, "")).trim();
    const modified = htmlToText((block.match(/<div class="flip-entry-last-modified"><div>([\s\S]*?)<\/div>/) || [])[1] || "") || null;
    if (!id || !name) continue;
    if (/\/folders\//.test(href)) { folders.push({ id, name }); continue; }
    const type = fileType(name, href);
    const thumb = ["image", "pdf", "video", "doc", "sheet", "slides"].includes(type) ? `https://drive.google.com/thumbnail?id=${id}&sz=w640` : null;
    files.push({ id, name, type, thumb, open: href || `https://drive.google.com/file/d/${id}/view`, modified });
  }
  return { title, folders, files };
}

// ---------- Telegram: последние посты публичного канала ----------
async function telegramPosts(handle: string) {
  const r = await fetch(`https://t.me/s/${handle}`, { headers: UA, redirect: "follow" });
  const html = await r.text();
  if (!r.ok || !/tgme_widget_message_wrap/.test(html)) throw new Error("Канал не найден или закрыт. Для закрытого канала выберите «Закрытый Telegram-канал».");
  const title = decodeHtml((html.match(/<meta property="og:title" content="([^"]*)"/) || [])[1] || handle);
  const posts: { id: string; text: string; date: string | null; images: string[] }[] = [];
  for (const block of html.split(/<div class="tgme_widget_message_wrap/).slice(1)) {
    const id = (block.match(/data-post="[^"/]+\/(\d+)"/) || [])[1];
    if (!id || /service_message/.test(block.slice(0, 400))) continue;
    const text = htmlToText((block.match(/<div class="tgme_widget_message_text[^"]*"[^>]*>([\s\S]*?)<\/div>/) || [])[1] || "")
      .replace(new RegExp(`(?:https?:\\/\\/)?(?:t|telegram)\\.me\\/(?:s\\/)?${handle}\\S*`, "gi"), "").replace(new RegExp(`@${handle}\\b`, "gi"), "").trim();
    const images = [...block.matchAll(/(?:tgme_widget_message_photo_wrap|tgme_widget_message_video_thumb)[^"]*"[^>]*?background-image:url\('([^']+)'\)/g)].map((m) => m[1]).slice(0, 20);
    const date = (block.match(/<time[^>]+datetime="([^"]+)"/) || [])[1] || null;
    if (!text && !images.length) continue;
    posts.push({ id, text, date, images });
  }
  return { title, posts: posts.reverse().slice(0, 30) }; // новые сверху
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });
  let body: any = {};
  try { body = await req.json(); } catch { body = {}; }
  const auth = req.headers.get("Authorization") || "";
  if (!auth.startsWith("Bearer ")) return json({ error: "Нужен вход в CRM" }, 401);
  const user = createClient(SUPABASE_URL, ANON_KEY, { global: { headers: { Authorization: auth } }, auth: { persistSession: false } });
  const [{ data: isTech }, { data: isDirector }, { data: agencyId }] = await Promise.all([user.rpc("crm_is_tech"), user.rpc("crm_is_director"), user.rpc("crm_agency_id")]);
  if (!agencyId && !isTech) return json({ error: "Нет доступа" }, 403);
  const isAdmin = !!(isTech || isDirector);
  const action = String(body.action || "list");

  try {
    if (action === "list") {
      let q = db.from("nb_sources").select("id,agency_id,category,kind,title,url,meta,active,sort,last_checked_at,last_error,created_at").order("sort").order("created_at");
      if (!isTech || agencyId) q = q.eq("agency_id", agencyId);
      if (body.category) q = q.eq("category", body.category);
      const { data, error } = await q;
      if (error) throw new Error(error.message);
      const rows = (data || []).filter((s: any) => isAdmin || s.active).map((s: any) => {
        // менеджерам ссылку на источник не отдаём (кроме обычной ссылки на сайт — её надо открыть)
        if (!isAdmin && s.kind !== "link") { const { url: _u, ...rest } = s; return rest; }
        return s;
      });
      return json({ ok: true, admin: isAdmin, sources: rows });
    }

    if (action === "browse") {
      const { data: src } = await db.from("nb_sources").select("*").eq("id", Number(body.source_id)).maybeSingle();
      if (!src || (!isTech && src.agency_id !== agencyId)) return json({ ok: false, error: "Источник не найден" });
      try {
        let res: any;
        if (src.kind === "gdrive") res = { type: "gdrive", ...(await driveFolder(String(body.folder_id || src.handle))) };
        else if (src.kind === "telegram") res = { type: "telegram", ...(await telegramPosts(src.handle)) };
        else if (src.kind === "tg_private") res = { type: "tg_private" };
        else res = { type: "link", url: src.url };
        await db.from("nb_sources").update({ last_checked_at: new Date().toISOString(), last_error: null }).eq("id", src.id);
        return json({ ok: true, ...res });
      } catch (e) {
        await db.from("nb_sources").update({ last_checked_at: new Date().toISOString(), last_error: (e as Error).message }).eq("id", src.id);
        return json({ ok: false, error: (e as Error).message });
      }
    }

    if (action === "sheet") {
      // Прайс-таблица: читаем как Excel (все листы), отдаём строки — колонки и формулы применяет CRM по настройке агентства
      const { data: src } = await db.from("nb_sources").select("id,agency_id,kind").eq("id", Number(body.source_id)).maybeSingle();
      if (!src || (!isTech && src.agency_id !== agencyId)) return json({ ok: false, error: "Источник не найден" });
      const fid = String(body.file_id || "");
      if (!/^[A-Za-z0-9_-]{10,}$/.test(fid)) return json({ ok: false, error: "Неверный файл" });
      const url = body.gsheet ? `https://docs.google.com/spreadsheets/d/${fid}/export?format=xlsx` : `https://drive.google.com/uc?export=download&id=${fid}`;
      const r = await fetch(url, { headers: UA, redirect: "follow" });
      const type = r.headers.get("content-type") || "";
      if (!r.ok || type.includes("text/html")) return json({ ok: false, error: "Таблица недоступна. Откройте доступ «Все, у кого есть ссылка»." });
      const buf = new Uint8Array(await r.arrayBuffer());
      if (buf.byteLength > 15 * 1024 * 1024) return json({ ok: false, error: "Файл больше 15 МБ" });
      const wb = XLSX.read(buf, { type: "array", cellDates: false });
      const sheets = wb.SheetNames.slice(0, 15).map((name: string) => {
        const rows: any[][] = XLSX.utils.sheet_to_json(wb.Sheets[name], { header: 1, raw: false, defval: "", blankrows: false });
        return { name, rows: rows.slice(0, 3000).map((row) => row.slice(0, 40).map((c) => String(c ?? "").trim())) };
      }).filter((sh: any) => sh.rows.length);
      return json({ ok: true, sheets });
    }

    if (action === "preview") {
      if (!isAdmin) return json({ ok: false, error: "Только для администратора" }, 403);
      const kind = String(body.kind || ""); const url = String(body.url || "").trim();
      if (kind === "gdrive") {
        const id = driveFolderId(url);
        if (!id) return json({ ok: false, error: "Не похоже на ссылку на папку. Пример: https://drive.google.com/drive/folders/…" });
        const f = await driveFolder(id);
        return json({ ok: true, handle: id, title: f.title, count: f.folders.length + f.files.length, summary: `${f.folders.length} папок, ${f.files.length} файлов` });
      }
      if (kind === "telegram") {
        if (/(?:t\.me|telegram\.me)\/(?:\+|joinchat\/)/i.test(url)) return json({ ok: false, private: true, error: "Это ссылка-приглашение в закрытый канал — выберите «Закрытый Telegram-канал»." });
        const h = telegramHandle(url);
        if (!h) return json({ ok: false, error: "Не похоже на ссылку на канал. Пример: https://t.me/имя_канала" });
        const t = await telegramPosts(h);
        return json({ ok: true, handle: h, title: t.title, count: t.posts.length, summary: `${t.posts.length} последних постов` });
      }
      if (kind === "link") {
        if (!/^https?:\/\/\S+\.\S+/i.test(url)) return json({ ok: false, error: "Ссылка должна начинаться с https://" });
        let host = url; try { host = new URL(url).hostname.replace(/^www\./, ""); } catch { /* */ }
        return json({ ok: true, handle: host, title: host, count: 1, summary: host });
      }
      return json({ ok: false, error: "Неизвестный тип источника" });
    }

    return json({ error: "Неизвестное действие" }, 400);
  } catch (e) {
    return json({ ok: false, error: (e as Error).message || String(e) });
  }
});
