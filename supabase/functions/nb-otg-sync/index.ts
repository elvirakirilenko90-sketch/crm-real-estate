// ЖК «Одеські Традиції на Глушко» (nb_sources.id = 13). v1 (23.11.2026).
// Наличие и цены — самый свежий «Шахматка…xlsx» из папки Диска (веб-приложение Apps Script, crm_private_settings.ots_shah_webapp, ?f=otg).
//   Под строкой «номер» у каждой квартиры: цена м² (400–5000), сумма (>10 000) и отметки:
//   «З» (без «П»/«100%») → рассрочка по meta.plan (ПВ 50%, 19 міс., 16% річних на залишок — ануїтет);
//   «П» или «100%» → только 100% оплата: в CRM есть, но note = «100% оплата (без розстрочки)» — рассрочку не считаем.
//   Цвет ячеек цены: красный → продана, жёлтый → бронь, иначе — в продаже.
// Планы — с сайта застройщика katalog.estate/otg: план квартиры (flats/…png) + план этажа floor-view-<hash>.png (1247×1082)
//   с контуром квартиры (путь переводится в абсолютные M/L/Z) → presentations/nb/13/, meta.unit_plans.by_key[key] = {img,d,box,w,h,layout}.
// Доступ: x-cron-secret. Тело: {source_id: 13, dry?: true, plans_limit?: 8}.
import { createClient } from "jsr:@supabase/supabase-js@2";
import * as XLSX from "npm:xlsx@0.18.5";
const db = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, { auth: { persistSession: false } });
const json = (b: unknown, s = 200) => new Response(JSON.stringify(b), { status: s, headers: { "Content-Type": "application/json" } });
const UA = { "User-Agent": "Mozilla/5.0 (compatible; CRMBot/1.0)" };
const SITE = "https://katalog.estate"; const PRJ = "otg";
const num = (v: unknown) => { const n = parseFloat(String(v ?? "").replace(/\s/g, "").replace(",", ".")); return Number.isFinite(n) ? n : null; };
const fill = (c: any) => { const f = c?.s?.fgColor; return f?.rgb ? String(f.rgb).slice(-6).toUpperCase() : null; };
const FULL_NOTE = "100% оплата (без розстрочки)";

type U = { key: string; sec: string; no: string; no_full: string; floor: number | null; pm2: number | null; total: number | null; st: "free" | "sold" | "reserved"; pay: "install" | "full"; col: number };

function parse(buf: Uint8Array): U[] {
  const wb = XLSX.read(buf, { type: "array", cellStyles: true, cellFormula: false });
  const ws = wb.Sheets[wb.SheetNames[0]]; const rg = XLSX.utils.decode_range(ws["!ref"]);
  const at = (r: number, c: number) => ws[XLSX.utils.encode_cell({ r, c })]; const val = (r: number, c: number) => at(r, c)?.v;
  const labs: [number, number][] = [];
  for (let r = rg.s.r; r <= rg.e.r; r++) for (let c = rg.s.c; c <= rg.e.c; c++) if (String(val(r, c) ?? "").trim() === "номер") labs.push([r, c]);
  const lc = [...new Set(labs.map((x) => x[1]))].sort((a, b) => a - b);
  const out: U[] = []; const seen = new Set<string>();
  for (const [r, c] of labs) {
    const nx = lc.filter((x) => x > c); const end = nx.length ? nx[0] - 2 : rg.e.c; const sec = String(lc.indexOf(c) + 1);
    const nextR = labs.filter(([rr, cc]) => cc === c && rr > r).map(([rr]) => rr).sort((a, b) => a - b)[0] ?? r + 7;
    const stop = Math.min(nextR, r + 7);
    for (let col = c + 1; col <= end; col++) {
      const noRaw = val(r, col); if (noRaw == null || noRaw === "") continue;
      const nos = String(noRaw).split(/[^\d]+/).filter(Boolean); if (!nos.length) continue;
      let pm2: number | null = null, total: number | null = null; const marks: string[] = []; const fls: (string | null)[] = [];
      for (let k = r + 1; k < stop; k++) {
        const v = val(k, col); if (v == null || v === "") continue; const n = num(v);
        if (n != null && n >= 400 && n <= 5000 && pm2 == null) { pm2 = n; fls.push(fill(at(k, col))); }
        else if (n != null && n > 10000 && total == null) { total = Math.round(n); fls.push(fill(at(k, col))); }
        else if (n == null) marks.push(String(v).trim());
      }
      if (!fls.length) fls.push(fill(at(r + 1, col)), fill(at(r + 2, col)));
      const st = fls.includes("FF0000") ? "sold" : fls.includes("FFFF00") ? "reserved" : "free";
      const mk = marks.join(" ").toUpperCase();
      const pay = mk.includes("З") && !mk.includes("П") && !mk.includes("100") ? "install" : "full";
      // «488/2/147» — часть разделённой квартиры: свой номер «488/2», ключ «otg|3|488-2»
      const no = nos.length >= 3 ? `${nos[0]}/${nos[1]}` : nos[0];
      const key = `${PRJ}|${sec}|${no.replace("/", "-")}`; if (seen.has(key)) continue; seen.add(key);
      out.push({ key, sec, no, no_full: String(noRaw).replace(/\s+/g, ""), floor: num(val(r, c - 1)), pm2, total, st, pay, col });
    }
  }
  return out;
}

// Рассрочка: варианты meta.plan.variants ({first_pct, months, annual_rate}) — ануїтет на остаток.
function calcOf(base: number, plan: any) {
  const R = Math.round;
  const alts = (plan.variants || []).map((v: any) => {
    const price = base * (1 + (Number(v.markup_pct) || 0) / 100); const first = price * Number(v.first_pct) / 100; const rest = price - first;
    const n = Number(v.months) || 0, i = (Number(v.annual_rate) || 0) / 1200;
    const monthly = n ? (i ? rest * i / (1 - Math.pow(1 + i, -n)) : rest / n) : null;
    return { first_pct: v.first_pct, months: n, annual_rate: v.annual_rate || 0, price: R(price), first: R(first), rest: R(rest), monthly: monthly == null ? null : R(monthly), total: monthly == null ? R(price) : R(first + monthly * n), overpay: monthly == null ? 0 : R(first + monthly * n - price) };
  });
  const d = alts[Math.min(Number(plan.default_idx) || 0, Math.max(0, alts.length - 1))] || {};
  return { ...d, alts, base: R(base), full_price: R(base), variants: alts.length };
}

// SVG-путь сайта (M/L/H/V/Z, абсолютные и относительные) → абсолютный «M x y L x y … Z»
function absPath(d: string) {
  const t = d.match(/[a-zA-Z]|-?\d*\.?\d+(?:e-?\d+)?/g) || []; let i = 0, cmd = "", x = 0, y = 0, sx = 0, sy = 0; const out: string[] = []; const pts: number[][] = [];
  const nx = () => Number(t[i++]);
  while (i < t.length) {
    if (/[a-zA-Z]/.test(t[i])) cmd = t[i++];
    const rel = cmd === cmd.toLowerCase(); const C = cmd.toUpperCase();
    if (C === "Z") { out.push("Z"); x = sx; y = sy; continue; }
    if (C === "M" || C === "L" || C === "T") { const a = nx(), b = nx(); x = rel ? x + a : a; y = rel ? y + b : b; if (C === "M") { sx = x; sy = y; out.push(`M ${x.toFixed(1)} ${y.toFixed(1)}`); cmd = rel ? "l" : "L"; } else out.push(`L ${x.toFixed(1)} ${y.toFixed(1)}`); }
    else if (C === "H") { const a = nx(); x = rel ? x + a : a; out.push(`L ${x.toFixed(1)} ${y.toFixed(1)}`); }
    else if (C === "V") { const b = nx(); y = rel ? y + b : b; out.push(`L ${x.toFixed(1)} ${y.toFixed(1)}`); }
    else { const n = C === "C" ? 6 : C === "S" || C === "Q" ? 4 : C === "A" ? 7 : 2; const a = Array.from({ length: n }, nx); const ex = a[n - 2], ey = a[n - 1]; x = rel ? x + ex : ex; y = rel ? y + ey : ey; out.push(`L ${x.toFixed(1)} ${y.toFixed(1)}`); }
    pts.push([x, y]);
  }
  const xs = pts.map((p) => p[0]), ys = pts.map((p) => p[1]);
  const box = xs.length ? [Math.min(...xs), Math.min(...ys), Math.max(...xs) - Math.min(...xs), Math.max(...ys) - Math.min(...ys)].map((v) => Math.round(v * 10) / 10) : null;
  return { d: out.join(" "), box };
}

async function siteList() {
  const site = new Map<string, { flat_id: number; status: string; area: number | null; rooms: number | null }>();
  for (let p = 1; p <= 40; p++) {
    const r = await fetch(`${SITE}/${PRJ}/1/filter?page=${p}`, { headers: { "X-Requested-With": "XMLHttpRequest", ...UA } }).catch(() => null);
    if (!r?.ok) break; const j = await r.json().catch(() => null); const html = String(j?.table || ""); if (!html) break;
    const parts = html.split(`href="/${PRJ}/flat/`).slice(1); if (!parts.length) break;
    for (const e of parts) {
      const fid = Number((e.match(/^(\d+)/) || [])[1]);
      const cells = [...e.split("href=")[0].matchAll(/<div class="graphic__table-item[^"]*">([^<]*)<\/div>/g)].map((m) => m[1].trim());
      if (cells.length < 7) continue;
      site.set(`${PRJ}|${cells[1]}|${cells[3]}`, { flat_id: fid, status: cells[6], rooms: num(cells[4]), area: num(cells[5]) });
    }
    if (parts.length < 25) break;
  }
  return site;
}

// копия картинки сайта в хранилище CRM (путь без кириллицы/пробелов)
async function copyImg(url: string, path: string) {
  const r = await fetch(encodeURI(url), { headers: UA }); if (!r.ok) throw new Error(`картинка ${r.status}`);
  const up = await db.storage.from("presentations").upload(path, new Uint8Array(await r.arrayBuffer()), { contentType: r.headers.get("content-type") || "image/png", upsert: true });
  if (up.error) throw new Error(up.error.message);
  return db.storage.from("presentations").getPublicUrl(path).data.publicUrl;
}
async function planOf(id: number, flatId: number, no: string, floorCache: Map<string, string>) {
  const h = await fetch(`${SITE}/${PRJ}/flat/${flatId}`, { headers: UA }).then((r) => r.text());
  const planUrl = (h.match(/https:\/\/cdn\.katalog\.estate\/flats\/[^"?]+\.(?:png|jpe?g)/i) || [])[0];
  const hash = (h.match(/flat-on-the-section-([0-9a-f]+)\.png/i) || [])[1];
  const pm = h.match(new RegExp(`data-room-number="№ ${no}"[^>]*\\sd="([^"]+)"`)) || h.match(new RegExp(`\\sd="([^"]+)"[^>]*data-room-number="№ ${no}"`));
  const vb = (h.match(/viewBox="0 0\s+(\d+)\s+(\d+)"/) || []);
  if (!planUrl || !hash || !pm) return null;
  const p = absPath(pm[1]); if (!p.box) return null;
  let floor = floorCache.get(hash);
  if (!floor) { floor = await copyImg(`https://cdn.katalog.estate/floors/floor-view-${hash}.png`, `nb/${id}/otg-floor-${hash}.png`); floorCache.set(hash, floor); }
  const layout = await copyImg(planUrl, `nb/${id}/otg-plan-${flatId}.png`);
  return { img: floor, d: p.d, box: p.box, w: Number(vb[1]) || 1247, h: Number(vb[2]) || 1082, layout, site_flat: flatId };
}

Deno.serve(async (req) => {
  const sec = (await db.from("crm_private_settings").select("value").eq("key", "feed_sync_secret").maybeSingle()).data?.value;
  if (!sec || req.headers.get("x-cron-secret") !== sec) return json({ error: "forbidden" }, 403);
  const b = await req.json().catch(() => ({})); const id = Number(b.source_id) || 13; const dry = !!b.dry;
  const { data: src } = await db.from("nb_sources").select("*").eq("id", id).maybeSingle(); if (!src) return json({ ok: false, error: "нет ЖК" });
  const meta = src.meta || {}; const plan = meta.plan || {}; const now = new Date().toISOString();
  const fail = async (error: string) => { if (!dry) await db.from("nb_sources").update({ meta: { ...meta, sync_error: { at: now, error } } }).eq("id", id); return json({ ok: false, error }); };

  // 1. шахматка
  let units: U[] = []; let file: any = {};
  try {
    const wa = (await db.from("crm_private_settings").select("value").eq("key", "ots_shah_webapp").maybeSingle()).data?.value;
    const r = await fetch(`${wa}?f=${PRJ}`, { redirect: "follow" }); const j = await r.json().catch(() => null);
    if (!j?.ok || !j.b64) throw new Error(`веб-приложение шахматок: ${j?.error || r.status}`);
    units = parse(Uint8Array.from(atob(j.b64), (ch) => ch.charCodeAt(0))); file = { id: j.id, name: j.name, modified: j.modified };
  } catch (e) { return await fail((e as Error).message); }
  if (units.length < 300) return await fail(`в шахматке распознано только ${units.length} квартир — ничего не меняли`);

  // 2. сайт: id квартир, площадь, комнаты
  const site = await siteList().catch(() => new Map());
  const { data: old } = await db.from("nb_units").select("id,unit_key,status,availability,total_price,price_m2,area,note,calc,price_history").eq("nb_source_id", id);
  const by = new Map((old || []).map((o: any) => [o.unit_key, o]));
  let added = 0, sold = 0, back = 0, changed = 0; const ch: any[] = [];
  for (const u of units) {
    const o: any = by.get(u.key); const s = site.get(u.key); const free = u.st === "free";
    const avail = free ? "available" : u.st === "reserved" ? "reserved" : "sold";
    const area = Number(o?.area) || s?.area || (u.total && u.pm2 ? Math.round(u.total / u.pm2 * 100) / 100 : null);
    const total = u.total ?? (u.pm2 && area ? Math.round(u.pm2 * area) : null);
    const pm2 = u.pm2 ?? (total && area ? Math.round(total / area) : null);
    const note = u.pay === "full" ? FULL_NOTE : u.st === "reserved" ? "Бронь" : null;
    const calc = total ? (u.pay === "install" ? calcOf(total, plan) : { base: total, full_price: total, price: total, full_only: true }) : null;
    if (!o) {
      if (u.st === "sold") continue;
      added++; ch.push({ add: u.key, pay: u.pay });
      if (!dry) await db.from("nb_units").insert({ agency_id: src.agency_id, nb_source_id: id, unit_key: u.key, unit_no: u.no, complex_name: src.title, section: u.sec, floor: u.floor, rooms: s?.rooms ?? null,
        area, price_m2: pm2, total_price: total, currency: "USD", property_type: "apartment", status: free ? "free" : "sold", availability: avail, note,
        calc, first_payment_pct: calc?.first_pct ?? null, first_payment_amount: calc?.first ?? null, installment_months: calc?.months ?? null, monthly_payment: calc?.monthly ?? null, has_price_increase: false,
        source: "Диск (шахматка)", source_url: s ? `${SITE}/${PRJ}/flat/${s.flat_id}` : null, sheet_file: file.name, district: meta.district || "Киевский", first_seen_at: now, last_seen_at: now, updated_at: now });
      continue;
    }
    const upd: any = { last_seen_at: now };
    if (o.status === "free" && !free) { sold++; Object.assign(upd, { status: "sold", availability: avail, sold_at: now }); }
    else if (o.status !== "free" && free) { back++; Object.assign(upd, { status: "free", availability: "available", sold_at: null }); }
    else if (o.availability !== avail) upd.availability = avail;
    if ((o.note || null) !== note) upd.note = note;
    const priceCh = total != null && Number(o.total_price) !== total;
    if (priceCh) { changed++; Object.assign(upd, { total_price: total, price_m2: pm2, price_history: [...(o.price_history || []), { at: now, from: Number(o.total_price), to: total }].slice(-20) }); }
    if (free && calc && (priceCh || !o.calc || upd.note !== undefined || o.status !== "free" || b.recalc)) Object.assign(upd, { calc, first_payment_pct: calc.first_pct ?? null, first_payment_amount: calc.first ?? null, installment_months: calc.months ?? null, monthly_payment: calc.monthly ?? null });
    if (Object.keys(upd).length > 1) { upd.updated_at = now; ch.push({ key: u.key, ...Object.fromEntries(Object.entries(upd).filter(([k]) => ["status", "availability", "total_price", "note"].includes(k))) }); }
    if (!dry) await db.from("nb_units").update(upd).eq("id", o.id);
  }

  // 3. планы для свободных квартир без плана (не больше plans_limit за запуск)
  const { data: m0 } = await db.from("nb_sources").select("meta").eq("id", id).maybeSingle();
  const bk = { ...(m0?.meta?.unit_plans?.by_key || {}) }; const floorCache = new Map<string, string>(); let plans = 0; const planErr: Record<string, string> = {};
  for (const [k, v] of Object.entries(bk)) { const hh = String((v as any)?.img || "").match(/otg-floor-([0-9a-f]+)\.png/); if (hh) floorCache.set(hh[1], (v as any).img); }
  const need = units.filter((u) => u.st !== "sold" && !bk[u.key] && site.get(u.key)).slice(0, Number(b.plans_limit) || 8);
  if (!dry) for (const u of need) { try { const p = await planOf(id, site.get(u.key)!.flat_id, u.no, floorCache); if (p) { bk[u.key] = p; plans++; } else planErr[u.key] = "нет плана на сайте"; } catch (e) { planErr[u.key] = (e as Error).message; } }
  // 3б. квартир нет на сайте застройщика → план того же стояка (та же колонка шахматки, та же секция)
  let riser = 0;
  for (const u of units) {
    if (u.st === "sold" || bk[u.key]) continue;
    const sib = units.filter((x) => x.sec === u.sec && x.col === u.col && x.key !== u.key && bk[x.key] && !(bk[x.key] as any).riser_of)
      .sort((a, b) => Math.abs((a.floor ?? 0) - (u.floor ?? 0)) - Math.abs((b.floor ?? 0) - (u.floor ?? 0)))[0];
    if (sib) { bk[u.key] = { ...(bk[sib.key] as any), riser_of: sib.key }; riser++; continue; }
    if (dry || riser > 12) continue;
    const ss = units.filter((x) => x.sec === u.sec && x.col === u.col && site.get(x.key))
      .sort((a, b) => Math.abs((a.floor ?? 0) - (u.floor ?? 0)) - Math.abs((b.floor ?? 0) - (u.floor ?? 0)))[0];
    if (!ss) { planErr[u.key] = "нет на сайте и нет стояка"; continue; }
    try { const p = await planOf(id, site.get(ss.key)!.flat_id, ss.no, floorCache); if (p) { bk[u.key] = { ...p, riser_of: ss.key }; riser++; } } catch (e) { planErr[u.key] = (e as Error).message; }
  }
  const sync = { at: now, riser, ok: true, file: file.name, file_modified: file.modified || null, units: units.length, free: units.filter((u) => u.st === "free").length,
    install: units.filter((u) => u.st === "free" && u.pay === "install").length, full_only: units.filter((u) => u.st === "free" && u.pay === "full").length,
    reserved: units.filter((u) => u.st === "reserved").length, added, sold, back, changed, plans, plans_left: units.filter((u) => u.st !== "sold" && !bk[u.key] && site.get(u.key)).length };
  if (!dry) {
    const { data: f } = await db.from("nb_sources").select("meta").eq("id", id).maybeSingle(); const { sync_error: _e, ...m } = f?.meta || {};
    await db.from("nb_sources").update({ meta: { ...m, sync, status_source: "sheet", price_files: [{ id: file.id, name: file.name }], unit_plans: { ...(m.unit_plans || {}), by_key: bk } } }).eq("id", id);
  }
  return json({ ...sync, dry, planErr, changes: ch.slice(0, 80) });
});
