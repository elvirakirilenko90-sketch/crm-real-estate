// Новобудови: поквартирные планировки с Google Диска застройщика (пример — Акварель-10).
//
// Где ищем: папки, в названии которых есть «поквартир» (Поквартирні планування / Поквартирные планы…),
// внутри папки ЖК на Диске (автоматически — новые секции и очереди подхватываются сами), плюс папки,
// которые администратор указал вручную (meta.unit_plans.folders: [{id, section}]).
// Секция берётся из пути («Секція 1», «5 секция»), из имени файла («А10_С2_Стояк 3.pdf») или из настройки папки.
//
// Что делает функция (картинку из PDF она не рисует — у функций мало процессорного времени):
//   scan {source_id}          — список новых/изменённых файлов планировок (pending) и уже готовых
//   file {source_id, file_id} — отдаёт файл с Диска (только из найденных папок)
//   save {source_id, file_id, png(base64), info} — сохраняет вырезанную планировку в хранилище CRM
// Вырезает чертёж из PDF и убирает текст браузер администратора (pdf.js) — см. src/nbUnitPlans.js.
// Результат — nb_sources.meta.unit_plans.items: [{file_id, name, section, stoyak, no, floor, area, rooms, img, modified}].
//
// Доступ: администратор CRM (JWT), x-cron-secret или разовый ключ задания meta.unit_plans.job {token, until}.
import { createClient } from "jsr:@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-cron-secret, x-job-token",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
const UA = { "User-Agent": "Mozilla/5.0 (compatible; CRMBot/1.0)", "Accept-Language": "uk,ru;q=0.9" };
const json = (b: unknown, s = 200) => new Response(JSON.stringify(b), { status: s, headers: { ...CORS, "Content-Type": "application/json" } });
const db = createClient(SUPABASE_URL, SERVICE_KEY, { auth: { persistSession: false } });

const decode = (s: string) => s.replace(/&nbsp;/g, " ").replace(/&quot;/g, '"').replace(/&#39;|&#039;/g, "'").replace(/&lt;/g, "<").replace(/&gt;/g, ">")
  .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(+n)).replace(/&#x([0-9a-f]+);/gi, (_, n) => String.fromCodePoint(parseInt(n, 16))).replace(/&amp;/g, "&");

// Содержимое публичной папки Диска («Все, у кого есть ссылка»)
async function driveFolder(id: string) {
  const r = await fetch(`https://drive.google.com/embeddedfolderview?id=${id}`, { headers: UA, redirect: "follow" });
  const html = await r.text();
  if (!r.ok || /accounts\.google\.com\/(ServiceLogin|v3\/signin)/.test(r.url + html.slice(0, 3000))) throw new Error(`Папка ${id} закрыта — откройте доступ «Все, у кого есть ссылка»`);
  const folders: { id: string; name: string }[] = [], files: { id: string; name: string; modified: string | null }[] = [];
  for (const block of html.split(/<div class="flip-entry"/).slice(1)) {
    const fid = (block.match(/id="entry-([A-Za-z0-9_-]+)"/) || [])[1];
    const href = decode((block.match(/<a href="([^"]+)"/) || [])[1] || "");
    const name = decode(((block.match(/<div class="flip-entry-title">([\s\S]*?)<\/div>/) || [])[1] || "").replace(/<[^>]+>/g, "")).trim();
    const modified = decode(((block.match(/<div class="flip-entry-last-modified"><div>([\s\S]*?)<\/div>/) || [])[1] || "").replace(/<[^>]+>/g, "")).trim() || null;
    if (!fid || !name) continue;
    if (/\/folders\//.test(href)) folders.push({ id: fid, name }); else files.push({ id: fid, name, modified });
  }
  return { folders, files };
}

const secOf = (s: string) => (s.match(/секц\S*\s*№?\s*(\d+)/i) || s.match(/(\d+)\s*-?\s*(?:а|я|ая)?\s*секц/i) || s.match(/(?:^|[_\s-])[СC](\d+)(?=[_\s-])/) || [])[1] || null;
const isPlanFolder = (name: string) => /поквартир/i.test(name);
const isPlanFile = (name: string) => /\.(pdf|jpe?g|png|webp)$/i.test(name);

type Root = { id: string; section: string | null; path: string[] };
async function findRoots(src: any): Promise<{ roots: Root[]; errors: string[] }> {
  const errors: string[] = []; const roots: Root[] = [];
  for (const f of (src.meta?.unit_plans?.folders || [])) if (f?.id) roots.push({ id: f.id, section: f.section ? String(f.section) : null, path: [f.name || ""] });
  // автопоиск внутри папки ЖК: до 5 уровней, не больше 150 папок
  let level: { id: string; path: string[] }[] = src.handle ? [{ id: src.handle, path: [] }] : []; let budget = 150;
  for (let d = 0; d < 5 && level.length && budget > 0; d++) {
    const next: { id: string; path: string[] }[] = [];
    for (let i = 0; i < level.length && budget > 0; i += 6) {
      const batch = level.slice(i, i + 6); budget -= batch.length;
      const res = await Promise.all(batch.map((x) => driveFolder(x.id).then((r) => ({ x, r })).catch((e) => { errors.push((e as Error).message); return null; })));
      for (const it of res) {
        if (!it) continue;
        for (const sub of it.r.folders) {
          const path = [...it.x.path, sub.name];
          if (isPlanFolder(sub.name)) { if (!roots.some((r) => r.id === sub.id)) roots.push({ id: sub.id, section: secOf(path.join(" / ")), path }); }
          else next.push({ id: sub.id, path });
        }
      }
    }
    level = next;
  }
  return { roots, errors };
}

async function listPlanFiles(roots: Root[]) {
  const out: { id: string; name: string; modified: string | null; section: string | null; rooms: number | null; path: string }[] = []; const errors: string[] = [];
  for (const root of roots) {
    let level = [{ id: root.id, path: root.path }];
    for (let d = 0; d < 3 && level.length; d++) {
      const next: typeof level = [];
      for (const x of level) {
        try {
          const r = await driveFolder(x.id);
          for (const f of r.files) if (isPlanFile(f.name)) {
            const p = [...x.path, f.name].join(" / ");
            const roomsM = x.path.join(" ").match(/(\d)\s*-?\s*(?:к\b|кімн|комн)/i);
            out.push({ id: f.id, name: f.name, modified: f.modified, section: secOf(f.name) || root.section || secOf(x.path.join(" / ")), rooms: roomsM ? Number(roomsM[1]) : null, path: p });
          }
          for (const s of r.folders) next.push({ id: s.id, path: [...x.path, s.name] });
        } catch (e) { errors.push((e as Error).message); }
      }
      level = next;
    }
  }
  return { files: out, errors };
}

async function auth(req: Request, sourceId: number) {
  const { data: src } = await db.from("nb_sources").select("*").eq("id", sourceId).maybeSingle();
  if (!src) return { error: "ЖК не найден" };
  const cron = req.headers.get("x-cron-secret"), job = req.headers.get("x-job-token");
  if (cron) {
    const { data: s } = await db.from("crm_private_settings").select("value").eq("key", "feed_sync_secret").maybeSingle();
    return s?.value && s.value === cron ? { src } : { error: "forbidden" };
  }
  if (job) {
    const j = src.meta?.unit_plans?.job;
    return j?.token && j.token === job && Date.parse(j.until) > Date.now() ? { src } : { error: "Ключ задания недействителен" };
  }
  const a = req.headers.get("Authorization") || "";
  if (!a.startsWith("Bearer ")) return { error: "Нужен вход в CRM" };
  const user = createClient(SUPABASE_URL, ANON_KEY, { global: { headers: { Authorization: a } }, auth: { persistSession: false } });
  const [{ data: isTech }, { data: isDirector }, { data: agencyId }] = await Promise.all([user.rpc("crm_is_tech"), user.rpc("crm_is_director"), user.rpc("crm_agency_id")]);
  if (!isTech && !isDirector) return { error: "Только для администратора" };
  if (!isTech && src.agency_id !== agencyId) return { error: "ЖК не найден" };
  return { src };
}

async function patchPlans(id: number, fn: (up: any) => any) {
  const { data: fresh } = await db.from("nb_sources").select("meta").eq("id", id).maybeSingle();
  const meta = fresh?.meta || {}; const up = fn({ ...(meta.unit_plans || {}) });
  await db.from("nb_sources").update({ meta: { ...meta, unit_plans: up } }).eq("id", id);
  return up;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });
  let body: any = {}; try { body = await req.json(); } catch { body = {}; }
  try {
    const a: any = await auth(req, Number(body.source_id));
    if (a.error) return json({ ok: false, error: a.error }, a.error === "forbidden" ? 403 : 200);
    const src = a.src; const action = String(body.action || "scan");

    if (action === "scan") {
      const { roots, errors } = await findRoots(src);
      const { files, errors: e2 } = await listPlanFiles(roots);
      const items: any[] = src.meta?.unit_plans?.items || [];
      const done = new Map(items.map((x: any) => [x.file_id, x]));
      const pending = files.filter((f) => { const d = done.get(f.id); return !d || (f.modified && d.modified !== f.modified) || body.force; });
      // кэш найденных файлов — только их можно скачать через action=file
      const partial = errors.length > 0 || e2.length > 0;
      await patchPlans(src.id, (up) => ({ ...up, known: partial ? [...new Set([...(up.known || []), ...files.map((f) => f.id)])] : files.map((f) => f.id), roots: roots.map((r) => ({ id: r.id, section: r.section, path: r.path.join(" / ") })), scanned_at: new Date().toISOString(),
        // удалённые с Диска планировки убираем из списка — только если Диск прочитался без ошибок
        items: partial ? (up.items || []) : (up.items || []).filter((x: any) => files.some((f) => f.id === x.file_id)) }));
      // площади квартир по секциям — чтобы распознанное с картинки число сверить с шахматкой
      const { data: us } = await db.from("nb_units").select("unit_no,section,area").eq("nb_source_id", src.id).limit(5000);
      const areas: Record<string, number[]> = {};
      for (const u of us || []) { const sec = String(u.section || (String(u.unit_no || "").match(/^(\d+)\./) || [])[1] || ""); const a = Number(u.area); if (sec && a) (areas[sec] ||= []).includes(a) || areas[sec].push(a); }
      return json({ ok: true, roots: roots.length, files: files.length, pending, areas, errors: [...errors, ...e2].slice(0, 5) });
    }

    if (action === "file") {
      const fid = String(body.file_id || "");
      if (!/^[A-Za-z0-9_-]{10,}$/.test(fid) || !(src.meta?.unit_plans?.known || []).includes(fid)) return json({ ok: false, error: "Файл не из папок планировок" });
      const r = await fetch(`https://drive.google.com/uc?export=download&id=${fid}`, { headers: UA, redirect: "follow" });
      const type = r.headers.get("content-type") || "";
      if (!r.ok || type.includes("text/html")) return json({ ok: false, error: "Файл недоступен" });
      return new Response(r.body, { headers: { ...CORS, "Content-Type": type || "application/octet-stream", "Cache-Control": "no-store" } });
    }

    if (action === "save") {
      const fid = String(body.file_id || "");
      if (!(src.meta?.unit_plans?.known || []).includes(fid)) return json({ ok: false, error: "Файл не из папок планировок" });
      const bin = Uint8Array.from(atob(String(body.png || "")), (c) => c.charCodeAt(0));
      if (bin.length < 1000 || bin.length > 8 * 1024 * 1024) return json({ ok: false, error: "Пустая или слишком большая картинка" });
      const path = `nb/${src.id}/unit-plan-${fid}.png`;
      const up = await fetch(`${SUPABASE_URL}/storage/v1/object/presentations/${path}`, { method: "POST", headers: { Authorization: `Bearer ${SERVICE_KEY}`, "Content-Type": "image/png", "x-upsert": "true", "cache-control": "604800" }, body: bin });
      if (!up.ok) return json({ ok: false, error: "Не удалось сохранить картинку" });
      const i = body.info || {}; const num = (v: unknown) => { const n = Number(String(v ?? "").replace(",", ".")); return Number.isFinite(n) && n > 0 ? n : null; };
      const item = { file_id: fid, name: String(i.name || "").slice(0, 200), section: i.section ? String(i.section).slice(0, 10) : null, stoyak: num(i.stoyak), no: num(i.no), floor: num(i.floor),
        area: num(i.area), rooms: i.rooms === 0 ? 0 : num(i.rooms), modified: i.modified || null,
        floors: Array.isArray(i.floors) ? i.floors.map(Number).filter((n: number) => Number.isInteger(n) && n > 0 && n < 60).slice(0, 40) : null, img: `${SUPABASE_URL}/storage/v1/object/public/presentations/${path}?v=${Date.now()}` };
      // площадь, исправленную администратором вручную, не перезаписываем
      const prev = (src.meta?.unit_plans?.items || []).find((x: any) => x.file_id === fid);
      if (prev?.area_manual) Object.assign(item, { area: prev.area, area_manual: true });
      const res = await patchPlans(src.id, (u) => ({ ...u, items: [...(u.items || []).filter((x: any) => x.file_id !== fid), item], updated_at: new Date().toISOString() }));
      return json({ ok: true, item, total: res.items.length });
    }
    return json({ ok: false, error: "Неизвестное действие" }, 400);
  } catch (e) { return json({ ok: false, error: (e as Error).message }); }
});
