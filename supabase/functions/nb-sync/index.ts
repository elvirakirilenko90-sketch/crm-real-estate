// Новобудови: еженедельное обновление наличия квартир и расчёт рассрочки по условиям каждого ЖК.
//
// Откуда берём квартиры (по ссылке nb_sources):
//   • Google Drive — CRM сама находит в папке ЖК файл-прайс / шахматку (или файл, который указал администратор);
//   • загруженный файл (action "upload") — Excel / CSV, который администратор прислал с телефона.
// Форматы: обычная таблица (строка = квартира) и «шахматка» (блоки «№ квартиры / Площадь / Цена 1 кв.м / Общая стоим.»).
// Квартира без цены в шахматке считается проданной / в брони (застройщики так её и «закрывают»).
//
// Условия рассрочки ЖК — nb_sources.meta.plan:
//   variants[] — варианты: first_pct (ПВ %), months (срок) или until («до даты» — срок пересчитывается сам),
//                markup_m2 (удорожание $/м²), markup_pct (удорожание %), annual_rate (% годовых на остаток)
//   default_idx — вариант по умолчанию; first_disc_from / first_disc_pct — «при ПВ от X% скидка Y% на сумму ПВ»
//   full_disc_pct — скидка при 100% оплате; note — как считать (текст для менеджеров)
// Ничего не удаляем: квартира, которой больше нет в прайсе, получает статус «sold» и дату.
//
// Действия: sync {source_id} · upload {source_id, name, b64} · recalc {source_id}
// По расписанию: заголовок x-cron-secret, за вызов — один ЖК (дольше всех не обновлявшийся).
import { createClient } from "jsr:@supabase/supabase-js@2";
import * as XLSX from "npm:xlsx@0.18.5";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-cron-secret",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
const UA = { "User-Agent": "Mozilla/5.0 (compatible; CRMBot/1.0)", "Accept-Language": "uk,ru;q=0.9,en;q=0.8" };
const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { ...CORS, "Content-Type": "application/json" } });
const db = createClient(SUPABASE_URL, SERVICE_KEY, { auth: { persistSession: false } });

// ---------- числа ----------
function num(v: unknown): number | null {
  if (typeof v === "number") return Number.isFinite(v) ? v : null;
  const s = String(v ?? "").replace(/\u00a0/g, " ").replace(/[^\d.,\-\s]/g, "").trim().replace(/\s+/g, "");
  if (!s || s === "-") return null;
  let n = s;
  if (s.includes(",") && s.includes(".")) n = s.lastIndexOf(",") > s.lastIndexOf(".") ? s.replace(/\./g, "").replace(",", ".") : s.replace(/,/g, "");
  else if (s.includes(",")) n = /,\d{1,2}$/.test(s) && (s.match(/,/g) || []).length === 1 ? s.replace(",", ".") : s.replace(/,/g, "");
  else if (s.includes(".")) n = (s.match(/\./g) || []).length > 1 ? s.replace(/\./g, "") : s;
  const x = parseFloat(n);
  return Number.isFinite(x) ? x : null;
}
const int = (v: unknown) => { const n = num(v); return n == null ? null : Math.round(n); };

// ---------- квартира ----------
type Unit = { key: string; no: string; section: string | null; floor: number | null; rooms: number | null; area: number | null; pm2: number | null; total: number | null; note: string | null; type: string; free: boolean };
function roomsOf(t: string): number | null {
  const s = t.toLowerCase();
  if (/студ/.test(s)) return 0;
  // «2к квартира», «1ком», «3х к», «1-но к», «2-х кімн.» (\b в JS не работает с кириллицей — границы пишем явно)
  const m = s.match(/(?:^|[^\d])([1-6])\s*-?\s*(?:х|х\.|но|ти|ох|ух)?\s*(?:к(?![а-яіїє]{4})|ком|кім|кк)/) || s.match(/^([1-6])$/);
  return m ? Number(m[1]) : null;
}
const typeOf = (t: string) => /коммерц|комерц|нежил|нежитл|офис|офіс|паркинг|паркінг|кладов|комор/i.test(t) ? "commercial" : "apartment";
const BUSY = /продан|sold|брон|резерв|reserved|аванс|зайнят|занят|инвест|інвест|не\s*прода/i;

// ---------- формат 1: шахматка ----------
const L_NO = /^(№\s*(квартир|кв|прим)|номер\s*(квартир|кв)|№$)/i;
const L_AREA = /^(площ|s\s*,?\s*м|метраж)/i;
const L_PM2 = /(цена|ціна|вартість|стоим).*(м2|м²|кв\.?\s*м|1\s*м)|^\$\s*\/\s*м/i;
const L_TOTAL = /(общая|загальна|итог|повна|полная)|^(стоим|вартість|цена|ціна)\.?$/i;
const L_NOTE = /^(примеч|примітк|тип|комнат|кімнат)/i;
const L_ROW = /^(этаж|поверх|стояк|секц|свободно|бронь|резерв|аванс|продан|продаж)/i;
function parseChess(rows: string[][]): Unit[] {
  const out: Unit[] = []; const seen = new Set<string>();
  const cell = (r: number, c: number) => String(rows[r]?.[c] ?? "").trim();
  for (let r = 0; r < rows.length; r++) {
    for (let lc = 0; lc < (rows[r] || []).length; lc++) {
      if (!L_NO.test(cell(r, lc))) continue;
      // строки блока ниже в той же колонке
      const at: Record<string, number> = {};
      for (let k = r + 1; k <= r + 7 && k < rows.length; k++) {
        const t = cell(k, lc);
        if (L_NO.test(t)) break;
        if (L_AREA.test(t) && at.area == null) at.area = k;
        else if (L_PM2.test(t) && at.pm2 == null) at.pm2 = k;
        else if (L_TOTAL.test(t) && at.total == null) at.total = k;
        else if (L_NOTE.test(t) && at.note == null) at.note = k;
      }
      if (at.area == null && at.total == null && at.pm2 == null) continue;
      // этаж — слева от подписи в этой строке
      let floor: number | null = null;
      for (let c = lc - 1; c >= Math.max(0, lc - 3) && floor == null; c--) { const m = cell(r, c).match(/(этаж|поверх)\s*(-?\d+)/i); if (m) floor = Number(m[2]); }
      // секция — ближайшая надпись выше
      let section: string | null = null;
      for (let k = r; k >= Math.max(0, r - 90) && !section; k--) {
        for (let c = Math.max(0, lc - 3); c <= lc + 14 && !section; c++) {
          const m = cell(k, c).match(/(?:секц\w*|секція|section|будинок|дом|буд\.?)\s*№?\s*(\d+)|(\d+)\s*секц/i);
          if (m) section = m[1] || m[2];
        }
      }
      for (let c = lc + 1; c < (rows[r] || []).length; c++) {
        const no = cell(r, c);
        if (!no) continue;
        if (L_NO.test(no) || L_ROW.test(no) || /продан/i.test(no)) { if (/этаж|поверх/i.test(no)) break; continue; }
        const area = at.area != null ? num(cell(at.area, c)) : null;
        const pm2 = at.pm2 != null ? num(cell(at.pm2, c)) : null;
        let total = at.total != null ? num(cell(at.total, c)) : null;
        if ((total == null || total < 1000) && area && pm2) total = Math.round(area * pm2);
        const note = at.note != null ? cell(at.note, c) || null : null;
        if (area == null && total == null && pm2 == null && !note) continue;
        const sec = section || (no.match(/^(\d+)[.\-]/) || [])[1] || null;
        const fl = floor ?? (no.match(/(\d+)\.(\d+)\.(\d+)$/) ? Number(no.match(/(\d+)\.(\d+)\.(\d+)$/)![2]) : null);
        const key = `${sec || ""}|${no}`;
        if (seen.has(key)) continue; seen.add(key);
        const free = !!(total || pm2) && !BUSY.test(note || "");
        out.push({ key, no, section: sec, floor: fl, rooms: roomsOf(note || ""), area, pm2, total, note, type: typeOf(note || no), free });
      }
    }
  }
  return out;
}

// ---------- формат 3: шахматка без подписей (номер вида «2-1/6/1», ниже площадь, статус, цена, цена м²) ----------
const CODE = /^\d+(?:-\d+)?\/\d+\/\d+$/;
function parseCodes(rows: string[][]): Unit[] {
  const out: Unit[] = []; const seen = new Set<string>();
  const cell = (r: number, c: number) => String(rows[r]?.[c] ?? "").trim();
  for (let r = 0; r < rows.length; r++) {
    const row = rows[r] || [];
    if (row.filter((x) => CODE.test(String(x).trim())).length < 2) continue;
    for (let c = 0; c < row.length; c++) {
      const no = cell(r, c); if (!CODE.test(no)) continue;
      const [sec, fl] = no.split("/");
      let area: number | null = null, total: number | null = null, pm2: number | null = null, status = "";
      for (let k = r + 1; k <= r + 5 && k < rows.length; k++) {
        const t = cell(k, c); if (CODE.test(t)) break; if (!t) continue;
        const n = num(t);
        if (n == null || /[a-zа-яіїє]{3}/i.test(t)) { if (!status) status = t; continue; }
        if (area == null && n > 10 && n < 600 && /[.,]\d/.test(t)) area = n;
        else if (n >= 5000) total = total ?? n;
        else if (n >= 200 && n < 5000) pm2 = pm2 ?? n;
        else if (area == null && n > 10 && n < 600) area = n;
      }
      if (total == null && area && pm2) total = Math.round(area * pm2);
      const key = `${sec}|${no}`; if (seen.has(key)) continue; seen.add(key);
      out.push({ key, no, section: sec, floor: Number(fl), rooms: null, area, pm2, total: total || null, note: status || null, type: "apartment", free: !!(total && total >= 5000) && !BUSY.test(status) });
    }
  }
  return out;
}

// ---------- формат 2: обычная таблица ----------
const G: Record<string, RegExp> = {
  no: /^(№|номер|n|no\.?|кв\.?|квартира|unit|лот|актив|об'?єкт|объект)\b|№/i,
  rooms: /комнат|кімнат|rooms?\b|к-сть/i,
  area: /площ|м2|м²|sq|area|метраж/i,
  floor: /этаж|поверх|floor/i,
  section: /секц|корпус|будин|дом\b|section|block|черг|очеред/i,
  pm2: /(цена|ціна|стоим|вартість|price).*(м2|м²|кв\.?\s*м|m2)|за\s*м|\$\s*\/\s*м/i,
  total: /(общ|загальн|итог|повн|полн|total|сумма)|^(цена|ціна|стоимость|вартість|price)\b(?!.*(м2|м²|за))/i,
  status: /статус|status|налич|наявн|бронь|продан/i,
  note: /примеч|примітк|тип|комментар|коментар/i,
};
function parseTable(rows: string[][]): Unit[] {
  let h = 0, best = -1;
  rows.slice(0, 20).forEach((r, i) => { const s = r.filter((c) => Object.values(G).some((g) => g.test(c))).length; if (s > best) { best = s; h = i; } });
  if (best < 2) return [];
  const head = rows[h] || []; const idx: Record<string, number> = {}; const used = new Set<number>();
  for (const k of ["pm2", "total", "area", "rooms", "floor", "section", "status", "note", "no"]) {
    const j = head.findIndex((c, i) => !used.has(i) && G[k].test(String(c).trim()));
    idx[k] = j; if (j >= 0) used.add(j);
  }
  if (idx.area < 0 && idx.total < 0) return [];
  const out: Unit[] = []; const seen = new Set<string>();
  for (const r of rows.slice(h + 1)) {
    const g = (k: string) => idx[k] >= 0 ? String(r[idx[k]] ?? "").trim() : "";
    const area = num(g("area")), pm2 = num(g("pm2")); let total = num(g("total"));
    if ((total == null || total < 1000) && area && pm2) total = Math.round(area * pm2);
    if (!area && !total) continue;
    if (total != null && total < 3000 && !area) continue; // не цена квартиры
    const no = g("no") || ""; const status = g("status"); const note = g("note") || null;
    const key = `${g("section")}|${no || `${g("floor")}-${area}`}`;
    if (seen.has(key)) continue; seen.add(key);
    out.push({ key, no: no || "—", section: g("section") || null, floor: int(g("floor")), rooms: int(g("rooms")) ?? roomsOf(no + " " + (note || "")), area, pm2, total, note,
      type: typeOf(`${no} ${note || ""}`), free: !!total && !BUSY.test(status) });
  }
  return out;
}

// Читаем экономно: у функции 2 секунды процессора — без формул, стилей и с ограничением строк
const readWb = (buf: Uint8Array) => XLSX.read(buf, { type: "array", dense: true, cellDates: false, cellFormula: false, cellHTML: false, cellNF: false, cellStyles: false, sheetRows: 1500 });
function sheetRows(wb: any, name: string): string[][] {
  return (XLSX.utils.sheet_to_json(wb.Sheets[name], { header: 1, raw: false, defval: "", blankrows: true }) as unknown[][])
    .slice(0, 1500).map((row) => row.slice(0, 60).map((c) => String(c ?? "").trim()));
}
function parseWorkbook(buf: Uint8Array): Unit[] {
  const wb = readWb(buf);
  const all: Unit[] = []; const seen = new Set<string>();
  for (const name of wb.SheetNames.slice(0, 15)) {
    const rows = sheetRows(wb, name);
    const best = [parseChess(rows), parseCodes(rows), parseTable(rows)].sort((x, y) => y.length - x.length)[0];
    for (const u of best) { const k = `${u.key}`; if (!seen.has(k)) { seen.add(k); all.push(u); } }
  }
  return all;
}

// ---------- расчёт рассрочки ----------
// Условия ЖК: список вариантов (ПВ / срок / удорожание / % годовых) + общие скидки. Вариант по умолчанию — default_idx.
type Variant = { first_pct?: number; months?: number; until?: string; markup_m2?: number; markup_pct?: number; annual_rate?: number };
type Plan = { variants?: Variant[]; default_idx?: number; first_disc_from?: number; first_disc_pct?: number; full_disc_pct?: number; note?: string } & Variant;
const variantsOf = (p: Plan): Variant[] => Array.isArray(p.variants) && p.variants.length ? p.variants : (p.first_pct != null || p.months || p.until ? [p] : []);
function monthsUntil(d: string | undefined, now = new Date()): number | null {
  if (!d) return null; const t = new Date(d); if (isNaN(+t)) return null;
  const m = (t.getFullYear() - now.getFullYear()) * 12 + (t.getMonth() - now.getMonth());
  return Math.max(1, m);
}
function calc(u: Unit, p: Plan) {
  const base = u.total ?? (u.area && u.pm2 ? u.area * u.pm2 : null);
  if (base == null) return null;
  const vs = variantsOf(p); const v: Variant = vs[Math.min(Number(p.default_idx) || 0, Math.max(0, vs.length - 1))] || {};
  const price = base + (u.area || 0) * (Number(v.markup_m2) || 0) + base * (Number(v.markup_pct) || 0) / 100;
  const pct = Number(v.first_pct) || 0;
  const months = monthsUntil(v.until) ?? (Number(v.months) || 0);
  const first = price * pct / 100;
  const disc = p.first_disc_pct && pct >= (Number(p.first_disc_from) || 0) ? first * Number(p.first_disc_pct) / 100 : 0;
  const rest = price - first;
  const r = (Number(v.annual_rate) || 0) / 1200;
  const monthly = months > 0 && rest > 0 ? (r > 0 ? rest * r / (1 - Math.pow(1 + r, -months)) : rest / months) : null;
  const R = (x: number | null) => x == null ? null : Math.round(x);
  return { base: R(base), price: R(price), first_pct: pct, first: R(first - disc), first_disc: R(disc), rest: R(rest), months: months || null, monthly: R(monthly),
    full_price: R(base * (1 - (Number(p.full_disc_pct) || 0) / 100)), variants: vs.length };
}
const hasMarkup = (p: Plan) => variantsOf(p).some((v) => v.markup_m2 || v.markup_pct || v.annual_rate);

// ---------- Google Drive ----------
const decode = (s: string) => s.replace(/&quot;/g, '"').replace(/&#39;|&#039;/g, "'").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&amp;/g, "&");
async function driveFolder(id: string) {
  const r = await fetch(`https://drive.google.com/embeddedfolderview?id=${id}`, { headers: UA, redirect: "follow" });
  const html = await r.text();
  if (!r.ok || /accounts\.google\.com\/(ServiceLogin|v3\/signin)/.test(r.url + html.slice(0, 3000))) throw new Error("Папка закрыта — нужен доступ «Все, у кого есть ссылка».");
  const folders: { id: string; name: string }[] = []; const files: { id: string; name: string; gsheet: boolean }[] = [];
  for (const block of html.split(/<div class="flip-entry"/).slice(1)) {
    const fid = (block.match(/id="entry-([A-Za-z0-9_-]+)"/) || [])[1];
    const href = decode((block.match(/<a href="([^"]+)"/) || [])[1] || "");
    const name = decode(((block.match(/<div class="flip-entry-title">([\s\S]*?)<\/div>/) || [])[1] || "").replace(/<[^>]+>/g, "")).trim();
    if (!fid || !name) continue;
    if (/\/folders\//.test(href)) folders.push({ id: fid, name });
    else if (/docs\.google\.com\/spreadsheets/.test(href) || /\.(xlsx?|csv|ods)$/i.test(name)) files.push({ id: fid, name, gsheet: /docs\.google\.com\/spreadsheets/.test(href) });
  }
  return { folders, files };
}
const SKIP = /довер|догов|заяв|анкет|акт\b|рахун|счет/i;
function score(name: string) {
  const n = name.toLowerCase(); if (SKIP.test(n)) return -1;
  if (/паркін|паркин|parking|комор|кладов/.test(n)) return 0;
  return (/шахм|шахів/.test(n) ? 6 : 0) + (/прайс|price|наличи|наявн/.test(n) ? 5 : 0) + (/^буд(инок)?\.?\s*\d|^будинок|^дом\s*\d|секц/.test(n) ? 4 : 0)
    + (/список|квартир|сво?бодн|вільн/.test(n) ? 3 : 0) + (/калькул|расчет|розрах/.test(n) ? 1 : 0) + (/акці|акци/.test(n) ? -2 : 0);
}
async function findPriceFiles(rootId: string) {
  const found: { id: string; name: string; gsheet: boolean; s: number }[] = [];
  let level = [rootId]; let budget = 25;
  for (let d = 0; d < 3 && level.length && budget > 0; d++) {
    const next: string[] = [];
    for (const id of level.slice(0, budget)) {
      budget--;
      try { const f = await driveFolder(id); f.files.forEach((x) => found.push({ ...x, s: score(x.name) })); f.folders.filter((x) => !/фото|відео|видео|рендер|візуал|визуал|план(ув|ир)|презент|документ|хід|ход/i.test(x.name)).forEach((x) => next.push(x.id)); } catch { /* пропускаем */ }
    }
    level = next;
  }
  return found.filter((x) => x.s >= 0).sort((a, b) => b.s - a.s);
}
async function download(f: { id: string; gsheet: boolean }) {
  const url = f.gsheet ? `https://docs.google.com/spreadsheets/d/${f.id}/export?format=xlsx` : `https://drive.google.com/uc?export=download&id=${f.id}`;
  const r = await fetch(url, { headers: UA, redirect: "follow" });
  if (!r.ok || (r.headers.get("content-type") || "").includes("text/html")) throw new Error("Файл недоступен — нужен доступ «Все, у кого есть ссылка».");
  return new Uint8Array(await r.arrayBuffer());
}
// Метка файла без дат и «копия»: «Шахматка А10 (23.04.26).xlsx» → «шахматкаа10»
const fileTag = (n: string) => String(n || "").toLowerCase().replace(/\.(xlsx?|csv|ods)$/, "").replace(/\d{1,2}[.\-]\d{1,2}[.\-]\d{2,4}/g, "")
  .replace(/копия|копія|copy|\(\d+\)|\bот\b|\bвід\b/g, "").replace(/[^a-zа-яіїєґ0-9]+/g, "").slice(0, 40) || "f";
const fileIdOf = (s: string) => (String(s || "").match(/(?:\/d\/|[?&]id=)([A-Za-z0-9_-]{20,})/) || [])[1] || (/^[A-Za-z0-9_-]{20,}$/.test(s) ? s : null);

// ---------- сохранение ----------
async function store(src: any, units: Unit[] | null, fileName: string | null, trigger: string, email: string | null, err: string | null) {
  const plan: Plan = src.meta?.plan || {};
  const now = new Date().toISOString();
  const { data: old } = await db.from("nb_units").select("id,unit_key,total_price,status,price_history,area,price_m2,unit_no,section,floor,rooms,note,property_type").eq("nb_source_id", src.id);
  const oldBy = new Map((old || []).map((o: any) => [o.unit_key, o]));
  let nNew = 0, nSold = 0, nChanged = 0;
  if (units) {
    const rows = units.map((u) => {
      const o: any = oldBy.get(u.key);
      const c = u.free ? calc(u, plan) : null;
      let hist = o?.price_history || [];
      if (o && u.total != null && o.total_price != null && Number(o.total_price) !== u.total) { hist = [...hist, { at: now, from: Number(o.total_price), to: u.total }].slice(-20); nChanged++; }
      if (!o && u.free) nNew++;
      if (o && o.status === "free" && !u.free) nSold++;
      return { agency_id: src.agency_id, nb_source_id: src.id, unit_key: u.key, unit_no: u.no, complex_name: src.title, section: u.section, floor: u.floor, rooms: u.rooms,
        area: u.area, price_m2: u.pm2, total_price: u.total, currency: "USD", property_type: u.type, note: u.note, status: u.free ? "free" : "sold",
        sold_at: u.free ? null : (o?.status === "sold" ? undefined : now), calc: c, price_history: hist, first_payment_pct: c?.first_pct ?? null, first_payment_amount: c?.first ?? null,
        installment_months: c?.months ?? null, monthly_payment: c?.monthly ?? null, has_price_increase: hasMarkup(plan),
        last_seen_at: now, sheet_file: fileName, source: trigger === "upload" ? "Файл" : "Google Drive", source_url: src.url || null, district: src.meta?.district || null, updated_at: now };
    }).map((r) => { if (r.sold_at === undefined) delete (r as any).sold_at; return r; });
    for (let i = 0; i < rows.length; i += 300) {
      const { error } = await db.from("nb_units").upsert(rows.slice(i, i + 300), { onConflict: "nb_source_id,unit_key" });
      if (error) throw new Error(error.message);
    }
    // исчезли из прайса — помечаем проданными, не удаляем
    const keys = new Set(units.map((u) => u.key));
    const gone = (old || []).filter((o: any) => !keys.has(o.unit_key) && o.status === "free").map((o: any) => o.id);
    if (gone.length) { nSold += gone.length; await db.from("nb_units").update({ status: "sold", sold_at: now, calc: null, updated_at: now }).in("id", gone); }
  }
  const free = units ? units.filter((u) => u.free).length : null;
  const sync = { at: now, ok: !err, file: fileName, free, new: nNew, sold: nSold, changed: nChanged, error: err, trigger };
  await db.from("nb_sources").update({ meta: { ...(src.meta || {}), sync } }).eq("id", src.id);
  await db.from("nb_sync_log").insert({ agency_id: src.agency_id, source_id: src.id, trigger, file_name: fileName, ok: !err, units_free: free, units_new: nNew, units_sold: nSold, price_changed: nChanged, error: err, created_by_email: email });
  return sync;
}

// Пересчёт без скачивания (новые условия рассрочки, или срок «до даты» сократился)
async function recalc(src: any) {
  const plan: Plan = src.meta?.plan || {};
  const { data } = await db.from("nb_units").select("id,area,price_m2,total_price,unit_key,unit_no").eq("nb_source_id", src.id).eq("status", "free");
  for (const o of data || []) {
    const c = calc({ key: o.unit_key, no: o.unit_no, section: null, floor: null, rooms: null, area: o.area == null ? null : Number(o.area), pm2: o.price_m2 == null ? null : Number(o.price_m2), total: o.total_price == null ? null : Number(o.total_price), note: null, type: "", free: true }, plan);
    await db.from("nb_units").update({ calc: c, first_payment_pct: c?.first_pct ?? null, first_payment_amount: c?.first ?? null, installment_months: c?.months ?? null, monthly_payment: c?.monthly ?? null,
      has_price_increase: hasMarkup(plan) }).eq("id", o.id);
  }
  return (data || []).length;
}

async function syncSource(src: any, trigger: string, email: string | null) {
  if (src.meta?.price_mode === "upload") { const n = await recalc(src); return { recalculated: n, note: "Прайс загружается файлом — пересчитали рассрочку" }; }
  if (src.kind !== "gdrive") return store(src, null, null, trigger, email, "Автообновление работает для папок Google Drive. Для сайта загрузите прайс файлом.");
  try {
    const pinned = (Array.isArray(src.meta?.price_files) ? src.meta.price_files : []).map((x: any) => ({ id: fileIdOf(x.id || x), name: x.name || "Прайс", gsheet: !!x.gsheet || /spreadsheets/.test(String(x.id || x)), s: 99 })).filter((x: any) => x.id);
    const files = pinned.length ? pinned : await findPriceFiles(src.handle);
    if (!files.length) return store(src, null, null, trigger, email, "В папке не найдено таблиц с прайсом / шахматкой. Укажите файл в «Условия и прайс».");
    // Шахматки бывают разбиты на файлы (по секциям / домам) — берём все сильные файлы и объединяем
    const strong = files.filter((f: any) => f.s >= 4);
    const pick = pinned.length ? files.slice(0, 6) : strong.length ? strong.slice(0, 6) : files.slice(0, 2);
    const seenName = new Set<string>(); let lastErr = ""; const all: Unit[] = []; const used: string[] = [];
    for (const f of pick) {
      const tag = fileTag(f.name); if (seenName.has(tag)) continue; seenName.add(tag);
      try {
        const units = parseWorkbook(await download(f));
        if (units.length >= 3) { units.forEach((u) => all.push({ ...u, key: `${tag}|${u.key}` })); used.push(f.name); if (!strong.length && !pinned.length) break; }
        else lastErr = `В файле «${f.name}» не нашли квартир`;
      } catch (e) { lastErr = `${f.name}: ${(e as Error).message}`; }
    }
    if (all.length) return store(src, all, used.join(", "), trigger, email, null);
    return store(src, null, null, trigger, email, lastErr || "Не удалось прочитать прайс");
  } catch (e) { return store(src, null, null, trigger, email, (e as Error).message); }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });
  let body: any = {}; try { body = await req.json(); } catch { body = {}; }
  const action = String(body.action || "sync");

  // По расписанию: за один вызов — один ЖК (лимит процессора). Расписание в понедельник утром вызывает функцию
  // несколько раз подряд, каждый раз берётся ЖК, который дольше всех не обновлялся.
  const cron = req.headers.get("x-cron-secret");
  if (cron) {
    const { data: s } = await db.from("crm_private_settings").select("value").eq("key", "feed_sync_secret").maybeSingle();
    if (!s?.value || s.value !== cron) return json({ error: "forbidden" }, 403);
    const { data: srcs } = await db.from("nb_sources").select("*").eq("active", true).eq("category", "apartments");
    if (body.probe && body.source_id) { // проверка формата файла (для настройки)
      const src = (srcs || []).find((x: any) => x.id === Number(body.source_id)); if (!src) return json({ ok: false });
      const files = await findPriceFiles(src.handle); const f = body.file_id ? { id: body.file_id, name: "?", gsheet: !!body.gsheet } : files[0];
      if (!f) return json({ ok: false, files });
      const wb = readWb(await download(f));
      return json({ ok: true, files: files.map((x) => `${x.s} ${x.name} ${x.id}`), file: f.name, sheets: wb.SheetNames.slice(0, 15).map((n: string) => ({ n, rows: sheetRows(wb, n).slice(Number(body.from) || 0, (Number(body.from) || 0) + (Number(body.count) || 40)).map((r) => r.slice(0, 26).join(" ¦ ")) })).slice(0, Number(body.sheets) || 2) });
    }
    const week = Date.now() - 6 * 864e5;
    const due = (srcs || []).filter((x: any) => body.source_id ? x.id === Number(body.source_id) : !(x.meta?.sync?.at && Date.parse(x.meta.sync.at) > week))
      .sort((a: any, b: any) => (Date.parse(a.meta?.sync?.at || 0) || 0) - (Date.parse(b.meta?.sync?.at || 0) || 0));
    if (!due.length) return json({ ok: true, done: true });
    const src = due[0];
    try { return json({ ok: true, id: src.id, left: due.length - 1, ...(await syncSource(src, "cron", null)) }); }
    catch (e) { return json({ ok: false, id: src.id, error: (e as Error).message }); }
  }

  const auth = req.headers.get("Authorization") || "";
  if (!auth.startsWith("Bearer ")) return json({ error: "Нужен вход в CRM" }, 401);
  const user = createClient(SUPABASE_URL, ANON_KEY, { global: { headers: { Authorization: auth } }, auth: { persistSession: false } });
  const [{ data: isTech }, { data: isDirector }, { data: agencyId }, { data: u }] = await Promise.all([user.rpc("crm_is_tech"), user.rpc("crm_is_director"), user.rpc("crm_agency_id"), user.auth.getUser()]);
  if (!isTech && !isDirector) return json({ ok: false, error: "Только для администратора" }, 403);
  const email = u?.user?.email || null;
  const own = async (id: number) => { const { data } = await db.from("nb_sources").select("*").eq("id", id).maybeSingle(); return data && (isTech || data.agency_id === agencyId) ? data : null; };

  try {
    if (action === "upload") {
      const src = await own(Number(body.source_id)); if (!src) return json({ ok: false, error: "ЖК не найден" });
      const b64 = String(body.b64 || ""); if (!b64 || b64.length > 20_000_000) return json({ ok: false, error: "Файл пустой или больше 15 МБ" });
      const buf = Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));
      const units = parseWorkbook(buf).map((u) => ({ ...u, key: `${fileTag(String(body.name || "файл"))}|${u.key}` }));
      if (!units.length) return json({ ok: false, error: "В файле не нашли квартир. Нужны колонки «№ / Площадь / Цена» или шахматка." });
      src.meta = { ...(src.meta || {}), price_mode: body.keep_drive ? src.meta?.price_mode : "upload" };
      const sync = await store(src, units, String(body.name || "Файл"), "upload", email, null);
      return json({ ok: true, sync });
    }
    if (action === "recalc") {
      const src = await own(Number(body.source_id)); if (!src) return json({ ok: false, error: "ЖК не найден" });
      return json({ ok: true, count: await recalc(src) });
    }
    if (action === "sync") {
      const src = await own(Number(body.source_id)); if (!src) return json({ ok: false, error: "ЖК не найден" });
      return json({ ok: true, sync: await syncSource(src, "manual", email) });
    }
    return json({ ok: false, error: "Неизвестное действие" }, 400);
  } catch (e) { return json({ ok: false, error: (e as Error).message }); }
});
