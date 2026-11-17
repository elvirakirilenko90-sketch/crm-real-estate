// Новобудови: планировки отдельных квартир с сайта застройщика (пример — odesa-city.com, блок «Планування»).
//
// На сайте для каждого дома есть картинка поэтажного плана и SVG-контуры квартир (path.room-area).
// Клик по квартире на сайте показывает этот же план, обрезанный по контуру квартиры.
// Мы делаем так же: копируем план этажа в хранилище CRM, сохраняем контуры квартир и сопоставляем каждый контур
// с квартирами из шахматки по площади (площадь контура в пикселях × масштаб дома ≈ площадь в м²).
// Результат — nb_sources.meta.site_plans: {url, at, houses:[{house, img, w, h, flats:[{i, d, box, px, area}]}]}.
// Клиентская часть (презентация, PDF) вырезает квартиру из плана сама — по контуру d и рамке box.
//
// Вызов: x-cron-secret (как nb-sync) или вход администратора. Тело: {source_id, url?}
import { createClient } from "jsr:@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-cron-secret",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
const UA = { "User-Agent": "Mozilla/5.0 (compatible; CRMBot/1.0)", "Accept-Language": "uk,ru;q=0.9" };
const json = (b: unknown, s = 200) => new Response(JSON.stringify(b), { status: s, headers: { ...CORS, "Content-Type": "application/json" } });
const db = createClient(SUPABASE_URL, SERVICE_KEY, { auth: { persistSession: false } });

type Flat = { i: number; d: string; box: number[]; px: number; area?: number | null; units?: string[] };
type House = { house: string; tab: number; src: string; img?: string; w: number; h: number; flats: Flat[]; scale?: number | null };

// Точки контура: M x y, далее у каждого сегмента C берём конечную точку (контуры на сайте — ломаные)
function points(d: string): number[][] {
  const out: number[][] = [];
  for (const seg of d.split(/(?=[MLCZmlcz])/)) {
    const nums = (seg.match(/-?\d+(?:\.\d+)?/g) || []).map(Number);
    if (nums.length >= 2) out.push([nums[nums.length - 2], nums[nums.length - 1]]);
  }
  return out;
}
function measure(d: string) {
  const p = points(d); if (p.length < 3) return null;
  let a = 0, x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9;
  for (let k = 0; k < p.length; k++) {
    const [x, y] = p[k], [xn, yn] = p[(k + 1) % p.length];
    a += x * yn - xn * y; x0 = Math.min(x0, x); y0 = Math.min(y0, y); x1 = Math.max(x1, x); y1 = Math.max(y1, y);
  }
  return { px: Math.abs(a) / 2, box: [Math.round(x0), Math.round(y0), Math.round(x1 - x0), Math.round(y1 - y0)] };
}

// Разбор страницы: вкладки «Tab N» → «Будинок N», в каждой — картинка плана, W/H и контуры квартир
function parse(html: string): House[] {
  const starts = [...html.matchAll(/<div[^>]*data-w-tab="Tab (\d+)"[^>]*>/g)].map((m) => ({ n: Number(m[1]), at: m.index! }));
  const houses: House[] = [];
  starts.forEach((s, k) => {
    const part = html.slice(s.at, k + 1 < starts.length ? starts[k + 1].at : s.at + 200000);
    const src = (part.match(/const src = "([^"]+)"/) || [])[1]; if (!src) return;
    const W = Number((part.match(/const W = (\d+)/) || [])[1]) || 0, H = Number((part.match(/const H = (\d+)/) || [])[1]) || 0;
    const house = (part.replace(/<[^>]+>/g, " ").match(/Будинок\s*(\d+)/) || [])[1] || String(s.n);
    const seen = new Set<string>(); const flats: Flat[] = [];
    for (const m of part.matchAll(/<path[^>]*class="room-area"[^>]*?data-index="(\d+)"[^>]*?\sd="([^"]+)"/g)) {
      const d = m[2].replace(/\s+/g, " ").trim(); if (seen.has(d)) continue; seen.add(d);
      const g = measure(d); if (!g || g.px < 1000) continue;
      flats.push({ i: flats.length, d, box: g.box, px: Math.round(g.px) });
    }
    if (flats.length) houses.push({ house, tab: s.n, src, w: W, h: H, flats });
  });
  return houses;
}

// Второй тип сайтов (пример — akvarel10.com, блок «Оберіть свою квартиру»): карточки квартир с отдельной картинкой планировки.
// «Квартира 6.8.5» — секция 6, этаж 8, 5-я на этаже; «Секція 1 · №10» — секция 1, планировка №10.
type Card = { no: string; section: string; pos: number | null; area: number | null; rooms: number | null; src: string; img?: string };
function parseCards(html: string): Card[] {
  const out: Card[] = []; const seen = new Set<string>();
  for (const part of html.split(/class="apt-card"[\s>]/).slice(1)) {
    const chunk = part.slice(0, 6000);
    const name = ((chunk.match(/apt-card__name">([^<]+)</) || [])[1] || "").replace(/&nbsp;|&#160;/g, " ").trim();
    const src = (chunk.match(/data-lazy-src="(https:[^"]+)"/) || chunk.match(/<img[^>]+src="(https:[^"]+\.(?:png|jpe?g|webp))"/i) || [])[1];
    if (!name || !src || seen.has(src)) continue; seen.add(src);
    const area = Number(((chunk.match(/apt-card__area">\s*([\d.,]+)/) || [])[1] || "").replace(",", ".")) || null;
    const rooms = Number((chunk.match(/data-rooms="(\d+)"/) || [])[1]) || null;
    let m = name.match(/(\d+)\.(\d+)\.(\d+)/);
    if (m) { out.push({ no: `${m[1]}.${m[2]}.${m[3]}`, section: m[1], pos: Number(m[3]), area, rooms, src }); continue; }
    m = name.match(/Секц\S*\s*(\d+)\D+?(\d+)/i);
    if (m) out.push({ no: "", section: m[1], pos: Number(m[2]), area, rooms, src });
  }
  return out;
}
async function copyAny(srcId: number, key: string, url: string) {
  const r = await fetch(url, { headers: UA }); const type = r.headers.get("content-type") || "";
  if (!r.ok || !type.startsWith("image/")) return null;
  const ext = type.includes("png") ? "png" : type.includes("webp") ? "webp" : "jpg";
  const path = `nb/${srcId}/site-flat-${key.replace(/[^\w.-]+/g, "_")}.${ext}`;
  const up = await fetch(`${SUPABASE_URL}/storage/v1/object/presentations/${path}`, { method: "POST", headers: { Authorization: `Bearer ${SERVICE_KEY}`, "Content-Type": type, "x-upsert": "true", "cache-control": "604800" }, body: new Uint8Array(await r.arrayBuffer()) });
  return up.ok ? `${SUPABASE_URL}/storage/v1/object/public/presentations/${path}?v=${Date.now()}` : null;
}

// Масштаб дома: м² на пиксель. Подбираем так, чтобы контуры лучше всего совпали с площадями квартир этого дома.
function fitScale(px: number[], areas: number[]) {
  if (!px.length || !areas.length) return null;
  const A = [...areas].sort((a, b) => a - b), P = [...px].sort((a, b) => a - b);
  const err = (k: number) => P.reduce((s, p) => { const v = p * k; let best = 1e9; for (const a of A) best = Math.min(best, Math.abs(a - v) / a); return s + best; }, 0);
  // стартовые значения — отношения медиан и крайних значений
  const seeds = [A[A.length >> 1] / P[P.length >> 1], A[0] / P[0], A[A.length - 1] / P[P.length - 1]];
  let best = seeds[0], be = err(best);
  for (const s0 of seeds) for (let f = 0.7; f <= 1.3; f += 0.005) { const k = s0 * f, e = err(k); if (e < be) { be = e; best = k; } }
  return { k: best, err: be / P.length };
}

async function copyImage(srcId: number, house: string, url: string) {
  const r = await fetch(url, { headers: UA }); const type = r.headers.get("content-type") || "";
  if (!r.ok || !type.startsWith("image/")) throw new Error(`план дома ${house} не скачался`);
  const ext = type.includes("png") ? "png" : type.includes("webp") ? "webp" : "jpg";
  const path = `nb/${srcId}/site-plan-${house}.${ext}`;
  const up = await fetch(`${SUPABASE_URL}/storage/v1/object/presentations/${path}`, { method: "POST", headers: { Authorization: `Bearer ${SERVICE_KEY}`, "Content-Type": type, "x-upsert": "true", "cache-control": "604800" }, body: new Uint8Array(await r.arrayBuffer()) });
  if (!up.ok) throw new Error(`план дома ${house} не сохранился`);
  return `${SUPABASE_URL}/storage/v1/object/public/presentations/${path}?v=${Date.now()}`;
}

async function run(src: any, url: string, dry: boolean) {
  const html = await (await fetch(url, { headers: UA })).text();
  const houses = parse(html);
  const cards = houses.length ? [] : parseCards(html);
  if (!houses.length && !cards.length) throw new Error("На странице не нашли планировок квартир (ни плана этажа с контурами, ни карточек квартир с картинкой)");
  if (cards.length) {
    if (!dry) {
      for (let i = 0; i < cards.length; i += 6) await Promise.all(cards.slice(i, i + 6).map(async (c) => { c.img = (await copyAny(src.id, c.no || `${c.section}-${c.pos}`, c.src)) || undefined; }));
      const ok = cards.filter((c) => c.img).map(({ src: _s, ...c }) => c);
      const { data: fresh } = await db.from("nb_sources").select("meta").eq("id", src.id).maybeSingle();
      await db.from("nb_sources").update({ meta: { ...(fresh?.meta || {}), site_plans: { url, at: new Date().toISOString(), houses: [], cards: ok } } }).eq("id", src.id);
    }
    const bySec: Record<string, number> = {}; for (const c of cards) bySec[c.section] = (bySec[c.section] || 0) + 1;
    return Object.entries(bySec).map(([house, n]) => ({ house, flats: n, kind: "cards" }));
  }
  // квартиры ЖК: площади по домам
  const { data: units } = await db.from("nb_units").select("unit_no,section,area").eq("nb_source_id", src.id).limit(5000);
  const byHouse = new Map<string, number[]>();
  for (const u of units || []) {
    const h = String(u.section || (String(u.unit_no || "").match(/^(\d+)[./]/) || [])[1] || "").trim(); const a = Number(u.area);
    if (!h || !a) continue; if (!byHouse.has(h)) byHouse.set(h, []); byHouse.get(h)!.push(a);
  }
  for (const h of houses) {
    const areas = [...new Set(byHouse.get(h.house) || [])];
    const fit = fitScale(h.flats.map((f) => f.px), areas);
    h.scale = fit ? Number(fit.k.toPrecision(6)) : null;
    for (const f of h.flats) f.area = fit ? Math.round(f.px * fit.k * 10) / 10 : null;
    (h as any).fit_err = fit ? Math.round(fit.err * 1000) / 10 : null; // средняя ошибка, %
  }
  if (!dry) {
    const cache = new Map<string, string>();
    for (const h of houses) { if (!cache.has(h.src)) cache.set(h.src, await copyImage(src.id, h.house, h.src)); h.img = cache.get(h.src); }
    const out = { url, at: new Date().toISOString(), houses: houses.map(({ src: _s, ...h }) => h) };
    const { data: fresh } = await db.from("nb_sources").select("meta").eq("id", src.id).maybeSingle();
    await db.from("nb_sources").update({ meta: { ...(fresh?.meta || {}), site_plans: out } }).eq("id", src.id);
  }
  return houses.map((h) => ({ house: h.house, tab: h.tab, flats: h.flats.length, scale: h.scale, fit_err: (h as any).fit_err,
    px: h.flats.map((f) => f.px), area: h.flats.map((f) => f.area), unit_areas: [...new Set(byHouse.get(h.house) || [])].sort((a, b) => a - b) }));
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });
  let body: any = {}; try { body = await req.json(); } catch { body = {}; }
  const id = Number(body.source_id);
  try {
    const cron = req.headers.get("x-cron-secret");
    let src: any = null;
    if (cron) {
      const { data: s } = await db.from("crm_private_settings").select("value").eq("key", "feed_sync_secret").maybeSingle();
      if (!s?.value || s.value !== cron) return json({ error: "forbidden" }, 403);
      ({ data: src } = await db.from("nb_sources").select("*").eq("id", id).maybeSingle());
    } else {
      const auth = req.headers.get("Authorization") || "";
      if (!auth.startsWith("Bearer ")) return json({ error: "Нужен вход в CRM" }, 401);
      const user = createClient(SUPABASE_URL, ANON_KEY, { global: { headers: { Authorization: auth } }, auth: { persistSession: false } });
      const [{ data: isTech }, { data: isDirector }, { data: agencyId }] = await Promise.all([user.rpc("crm_is_tech"), user.rpc("crm_is_director"), user.rpc("crm_agency_id")]);
      if (!isTech && !isDirector) return json({ ok: false, error: "Только для администратора" }, 403);
      const { data } = await db.from("nb_sources").select("*").eq("id", id).maybeSingle();
      src = data && (isTech || data.agency_id === agencyId) ? data : null;
    }
    if (!src) return json({ ok: false, error: "ЖК не найден" });
    const url = String(body.url || src.meta?.site_plans?.url || "").trim();
    if (!/^https:\/\/[^\s]+$/.test(url)) return json({ ok: false, error: "Укажите ссылку на страницу планировок (https://…)" });
    const houses = await run(src, url.replace(/[?#].*$/, ""), !!body.dry);
    return json({ ok: true, houses });
  } catch (e) { return json({ ok: false, error: (e as Error).message }); }
});
