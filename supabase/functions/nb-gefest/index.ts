// Новобудови Гефест (Еллада-6, Еллада-7, Платон …): наличие и цены из таблицы «Prices.Gefest», планировки — с сайта gefest.ua.
//
// Таблица застройщика открыта только аккаунту агентства (не «по ссылке»), поэтому её присылает Google Apps Script
// из Google-аккаунта агентства (раз в час): POST {action:"import", sheets:{"Еллада-6":[[…]], …}} с заголовком x-import-token.
// Действия:
//   import  — строки листов → nb_units (ключ «gefest|<ID>»). Ничего не удаляем: исчезнувшие/проданные получают статус sold.
//   plans   — обход сайта ЖК (meta.gefest.site): этажи → свободные квартиры → картинка планировки → хранилище CRM → meta.unit_plans.
// Настройка ЖК (nb_sources.meta.gefest): {sheet:"Еллада-6", site:"https://gefest.ua/objects/ellada/turnid-30", free:["бронь"]}
//   free — какие статусы в таблице означают «в продаже» (у Гефеста на разных листах по-разному: «Бронь», «Продается», пусто).
import { createClient } from "jsr:@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const CORS = { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-import-token, x-cron-secret", "Access-Control-Allow-Methods": "POST, OPTIONS" };
const json = (b: unknown, s = 200) => new Response(JSON.stringify(b), { status: s, headers: { ...CORS, "Content-Type": "application/json" } });
const db = createClient(SUPABASE_URL, SERVICE_KEY, { auth: { persistSession: false } });
const UA = { "User-Agent": "Mozilla/5.0 (compatible; CRMBot/1.0)" };
const setting = async (k: string) => (await db.from("crm_private_settings").select("value").eq("key", k).maybeSingle()).data?.value || "";

const num = (v: unknown) => { if (typeof v === "number") return Number.isFinite(v) ? v : null; const n = parseFloat(String(v ?? "").replace(/\s/g, "").replace(",", ".")); return Number.isFinite(n) ? n : null; };
const roomsOf = (t: string) => /студ/i.test(t) ? 0 : /одноком|1-?к/i.test(t) ? 1 : /двухком|двоком|2-?к/i.test(t) ? 2 : /трехком|трьохком|3-?к/i.test(t) ? 3 : /4-?к|четыр|чотир/i.test(t) ? 4 : null;
const typeOf = (t: string) => /офис|офіс|нежил|нежитл|комерц|коммерц|паркінг|паркинг|комор|кладов/i.test(t) ? "commercial" : "apartment";

// Строки листа → квартиры. Колонки ищем по заголовку: ID, Section/Секция, Floor, ap's #/№, S m², Type, View, цена 100% (+total), Status.
function parseSheet(rows: unknown[][], free: string[]) {
  const h = rows.findIndex((r) => String(r?.[0] ?? "").trim() === "ID");
  if (h < 0) return [];
  const head = rows[h].map((x) => String(x ?? "").trim());
  const col = (re: RegExp) => head.findIndex((x) => re.test(x));
  const cSec = col(/^(section|секция|секція)$/i), cFloor = col(/^floor$/i), cNo = col(/^(ap'?s\s*#|№)$/i), cS = col(/^s,?\s*m/i), cType = col(/^type$/i), cView = col(/^view$/i), cSt = col(/^status$/i);
  const c100 = head.findIndex((x) => /^100\s*%$/.test(x) || x === "1"), cTot = c100 + 1;
  const out: any[] = [];
  for (const r of rows.slice(h + 1)) {
    const id = String(r?.[0] ?? "").trim(); const area = num(r?.[cS]);
    if (!id || !area || area <= 0) continue;
    const st = String(r?.[cSt] ?? "").trim(); const type = String(r?.[cType] ?? "").trim();
    const pm2 = num(r?.[c100]); const total = num(r?.[cTot]) || (pm2 ? area * pm2 : null);
    out.push({ key: `gefest|${id}`, no: id, section: String(r?.[cSec] ?? "").trim() || null, floor: num(r?.[cFloor]), apno: num(r?.[cNo]), area, rooms: roomsOf(type),
      type: typeOf(type), pm2, total: total ? Math.round(total) : null, note: [type, String(r?.[cView] ?? "").trim()].filter(Boolean).join(" · ") || null,
      status: st, free: free.includes(st.toLowerCase()) && !!pm2 });
  }
  return out;
}

async function importSheet(src: any, rows: unknown[][]) {
  const g = src.meta?.gefest || {}; const units = parseSheet(rows, (g.free || [""]).map((x: string) => String(x).toLowerCase()));
  if (units.length < 3) return { id: src.id, error: "лист не распознан" };
  const now = new Date().toISOString();
  const { data: old } = await db.from("nb_units").select("id,unit_key,status,total_price,price_history").eq("nb_source_id", src.id);
  const by = new Map((old || []).map((o: any) => [o.unit_key, o]));
  let nNew = 0, nSold = 0, nChanged = 0;
  const rowsOut = units.map((u) => {
    const o: any = by.get(u.key); let hist = o?.price_history || [];
    if (o && u.total != null && o.total_price != null && Number(o.total_price) !== u.total) { hist = [...hist, { at: now, from: Number(o.total_price), to: u.total }].slice(-20); nChanged++; }
    if (!o && u.free) nNew++; if (o && o.status === "free" && !u.free) nSold++;
    return { agency_id: src.agency_id, nb_source_id: src.id, unit_key: u.key, unit_no: u.no, complex_name: src.title, section: u.section, floor: u.floor, rooms: u.rooms,
      area: u.area, price_m2: u.pm2, total_price: u.total, currency: "USD", property_type: u.type, note: u.note, status: u.free ? "free" : "sold", price_history: hist,
      last_seen_at: now, sheet_file: `Prices.Gefest · ${g.sheet}`, source: "Google Drive", source_url: src.url || null, district: src.meta?.district || null, updated_at: now,
      ...(u.free ? { sold_at: null } : o?.status !== "sold" ? { sold_at: now } : {}) };
  });
  for (let i = 0; i < rowsOut.length; i += 300) { const { error } = await db.from("nb_units").upsert(rowsOut.slice(i, i + 300), { onConflict: "nb_source_id,unit_key" }); if (error) throw new Error(error.message); }
  const keys = new Set(units.map((u) => u.key));
  const gone = (old || []).filter((o: any) => !keys.has(o.unit_key) && o.status === "free").map((o: any) => o.id);
  if (gone.length) { nSold += gone.length; await db.from("nb_units").update({ status: "sold", sold_at: now, updated_at: now }).in("id", gone); }
  const free = units.filter((u) => u.free).length;
  const sync = { at: now, ok: true, file: `Prices.Gefest · ${g.sheet}`, free, new: nNew, sold: nSold, changed: nChanged, error: null, trigger: "gefest" };
  const { data: fresh } = await db.from("nb_sources").select("meta").eq("id", src.id).maybeSingle();
  await db.from("nb_sources").update({ meta: { ...(fresh?.meta || {}), sync } }).eq("id", src.id);
  await db.from("nb_sync_log").insert({ agency_id: src.agency_id, source_id: src.id, trigger: "gefest", file_name: sync.file, ok: true, units_free: free, units_new: nNew, units_sold: nSold, price_changed: nChanged });
  return { id: src.id, title: src.title, free, new: nNew, sold: nSold, changed: nChanged };
}

// ---------- планировки с сайта ----------
const get = async (u: string) => { const r = await fetch(u, { headers: UA }); if (!r.ok) throw new Error(`${r.status} ${u}`); return await r.text(); };
const uniq = (a: string[]) => [...new Set(a)];
async function crawlPlans(src: any, budget = 30) {
  const g = src.meta?.gefest || {}; if (!g.site) return { id: src.id, error: "нет ссылки на сайт" };
  const base = g.site.replace(/\/$/, "");
  const known: any[] = Array.isArray(src.meta?.unit_plans?.items) ? src.meta.unit_plans.items : [];
  const seen = new Set(known.map((x) => x.flat_id));
  const turn = await get(base);
  const floors = uniq([...turn.matchAll(/data-href=['"](https:\/\/gefest\.ua\/[^'"]*\/floorid-\d+)['"]/g)].map((m) => m[1]));
  const flats: string[] = [];
  for (const f of floors) { if (flats.length > 400) break; try { const h = await get(f); flats.push(...[...h.matchAll(/['"](https:\/\/gefest\.ua\/[^'"]*\/floorid-\d+\/flatid-\d+)['"]/g)].map((m) => m[1])); } catch { /* этаж не открылся */ } }
  const todo = uniq(flats).filter((u) => !seen.has((u.match(/flatid-(\d+)/) || [])[1]));
  const added: any[] = [];
  for (const u of todo.slice(0, budget)) {
    try {
      const h = await get(u); const fid = (u.match(/flatid-(\d+)/) || [])[1];
      const title = ((h.match(/<title>([^<]+)<\/title>/i) || [])[1] || "").replace(/\s+/g, " ");
      const no = num((title.match(/(?:Квартира|Офіс|Офис|Апартаменти|Апартамент|Приміщення)[^\d]{0,3}(\d+)/i) || [])[1]);
      const floor = num((title.match(/Поверх\s*-?\s*(\d+)/i) || [])[1]);
      const sec = (title.match(/секці[яи]\s*-?\s*([IVXLC\d]+)/i) || [])[1] || null;
      const imgs = [...h.matchAll(/['"](\/(?:cache_image\/)?storage\/photos\/shares\/flats\/[^'"\s]+?\.(?:png|jpe?g|webp))['"]/gi)].map((m) => m[1]).filter((x) => !/\.webp$/i.test(x));
      const best = imgs.sort((a, b) => (Number((b.match(/_(\d+)_\d+fit/) || [])[1]) || 0) - (Number((a.match(/_(\d+)_\d+fit/) || [])[1]) || 0))[0];
      if (!best || no == null || floor == null) continue;
      const r = await fetch("https://gefest.ua" + best, { headers: UA }); const type = r.headers.get("content-type") || "image/png";
      if (!r.ok || !type.startsWith("image/")) continue;
      const path = `nb/${src.id}/gefest-${floor}-${no}-${fid}.${type.includes("jpeg") ? "jpg" : "png"}`;
      const up = await fetch(`${SUPABASE_URL}/storage/v1/object/presentations/${path}`, { method: "POST", headers: { Authorization: `Bearer ${SERVICE_KEY}`, "Content-Type": type, "x-upsert": "true", "cache-control": "31536000" }, body: new Uint8Array(await r.arrayBuffer()) });
      if (!up.ok) continue;
      added.push({ flat_id: fid, key: `${floor}-${no}`, floor, no, section: sec, img: `${SUPABASE_URL}/storage/v1/object/public/presentations/${path}`, name: title.split("|")[0].trim() });
    } catch { /* одна квартира не открылась — остальные дальше */ }
  }
  const { data: fresh } = await db.from("nb_sources").select("meta").eq("id", src.id).maybeSingle();
  const items = [...known, ...added];
  await db.from("nb_sources").update({ meta: { ...(fresh?.meta || {}), unit_plans: { ...(fresh?.meta?.unit_plans || {}), source: "gefest-site", items, at: new Date().toISOString() } } }).eq("id", src.id);
  return { id: src.id, title: src.title, floors: floors.length, flats: uniq(flats).length, added: added.length, left: Math.max(0, todo.length - budget), total: items.length };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });
  let body: any = {}; try { body = await req.json(); } catch { /* */ }
  const tok = req.headers.get("x-import-token"), cron = req.headers.get("x-cron-secret");
  const okImport = tok && tok === await setting("gefest_import_token");
  const okCron = cron && cron === await setting("feed_sync_secret");
  if (!okImport && !okCron) return json({ error: "forbidden" }, 403);
  const { data: srcs } = await db.from("nb_sources").select("*").eq("active", true);
  const gef = (srcs || []).filter((s: any) => s.meta?.gefest);
  try {
    if (body.action === "import") {
      const sheets = body.sheets || {}; const out = [];
      for (const s of gef) { const rows = sheets[s.meta.gefest.sheet]; if (Array.isArray(rows)) out.push(await importSheet(s, rows)); }
      return json({ ok: true, results: out });
    }
    if (body.action === "plans") {
      const list = body.source_id ? gef.filter((s: any) => s.id === Number(body.source_id)) : gef;
      const out = []; for (const s of list) out.push(await crawlPlans(s, Number(body.budget) || 25));
      return json({ ok: true, results: out });
    }
    return json({ ok: false, error: "action: import | plans" }, 400);
  } catch (e) { return json({ ok: false, error: (e as Error).message }); }
});
