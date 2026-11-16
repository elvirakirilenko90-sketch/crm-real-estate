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
// Визуализации и планировки из папки ЖК копируются в хранилище CRM — для презентаций без названия ЖК.
//
// Действия: sync {source_id} · upload {source_id, name, b64} · recalc {source_id} · media {source_id}
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

// ---------- цвета ячеек: статус по легенде шахматки («Свободно / Бронь / Аванс / Продано») ----------
// Многие застройщики отмечают бронь и продажу заливкой ячейки. Ищем на листе легенду, запоминаем цвет каждого статуса,
// затем у каждой квартиры смотрим цвет её номера / цены. Если легенды нет — статус определяется по тексту и цене, как раньше.
type St = (r: number, c: number) => "free" | "busy" | null;
const LEG_FREE = /^(свободн|вільн|в\s*продаж|в\s*наявн|наявн|доступн|продается|продається)/i;
const LEG_BUSY = /^(бронь|броня|заброн|резерв|аванс|продан|продаж$|продажа$|100\s*%|инвест|інвест|не\s*прода|оформл|договор|догов|внесено)/i;
function fillOf(cell: any): string | null {
  const s = cell?.s; if (!s) return null;
  const f = s.fgColor || s.bgColor; if (!f) return null;
  if (s.patternType && s.patternType === "none") return null;
  // цвета темы 0/1 без оттенка — это обычный белый фон и чёрный, не статус
  if (!f.rgb && f.theme != null && Number(f.theme) <= 1 && !f.tint) return null;
  const key = f.rgb ? String(f.rgb).slice(-6).toUpperCase() : f.theme != null ? `T${f.theme}:${Math.round((f.tint || 0) * 100)}` : null;
  return key && key !== "FFFFFF" && key !== "000000" ? key : null;
}
function colorTools(ws: any): { st: St; legend: Record<string, string> } {
  const ref = ws?.["!ref"]; if (!ref) return { st: () => null, legend: {} };
  const rg = XLSX.utils.decode_range(ref);
  const at = (r: number, c: number) => { const R = r + rg.s.r, C = c + rg.s.c; return ws["!data"]?.[R]?.[C] ?? (Array.isArray(ws) ? ws[R]?.[C] : undefined) ?? ws[XLSX.utils.encode_cell({ r: R, c: C })]; };
  const votes: Record<string, { free: number; busy: number }> = {};
  const H = Math.min(rg.e.r - rg.s.r + 1, 1500), W = Math.min(rg.e.c - rg.s.c + 1, 60);
  for (let r = 0; r < H; r++) for (let c = 0; c < W; c++) {
    const cell = at(r, c); const t = String(cell?.w ?? cell?.v ?? "").trim(); if (!t || t.length > 30) continue;
    const kind = LEG_FREE.test(t) ? "free" : LEG_BUSY.test(t) ? "busy" : null; if (!kind) continue;
    // цвет у самой подписи или у соседней ячейки-образца
    const col = fillOf(cell) || fillOf(at(r, c - 1)) || fillOf(at(r, c + 1)); if (!col) continue;
    (votes[col] ||= { free: 0, busy: 0 })[kind]++;
  }
  const legend: Record<string, string> = {};
  for (const [k, v] of Object.entries(votes)) { if (v.free > v.busy * 2) legend[k] = "free"; else if (v.busy > v.free * 2) legend[k] = "busy"; }
  const st: St = (r, c) => { if (!Object.keys(legend).length) return null; const col = fillOf(at(r, c)); return col && legend[col] ? legend[col] as any : null; };
  return { st, legend };
}
// Итоговый статус квартиры: цвет по легенде главнее текста; свободной считаем только квартиру с ценой
const decide = (textFree: boolean, hasPrice: boolean, colors: ("free" | "busy" | null)[]) => {
  const c = colors.find((x) => x); if (c === "busy") return false; if (c === "free") return hasPrice; return textFree;
};

// ---------- формат 1: шахматка ----------
const L_NO = /^(№\s*(квартир|кв|прим)|номер\s*(квартир|кв)|№$)/i;
const L_AREA = /^(площ|s\s*,?\s*м|метраж)/i;
const L_PM2 = /(цена|ціна|вартість|стоим).*(м2|м²|кв\.?\s*м|1\s*м)|^\$\s*\/\s*м/i;
const L_TOTAL = /(общая|загальна|итог|повна|полная|заг\.)|^(стоим|вартість|цена|ціна)\.?$/i;
const L_NOTE = /^(примеч|примітк|прим\.|тип|комнат|кімнат)/i;
const L_ROW = /^(этаж|поверх|стояк|секц|свободно|бронь|резерв|аванс|продан|продаж)/i;
function parseChess(rows: string[][], st: St = () => null): Unit[] & { textMarked?: number } {
  const out: Unit[] & { textMarked?: number } = []; const seen = new Set<string>(); let textMarked = 0;
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
        // статус текстом прямо в ячейке цены («Продана», «РЕЗЕРВ») — застройщик ведёт статусы текстом
        const tTxt = at.total != null ? cell(at.total, c) : "", pTxt = at.pm2 != null ? cell(at.pm2, c) : "";
        if ((tTxt && num(tTxt) == null && BUSY.test(tTxt)) || (pTxt && num(pTxt) == null && BUSY.test(pTxt))) textMarked++;
        if ((total == null || total < 1000) && area && pm2) total = Math.round(area * pm2);
        const note = at.note != null ? cell(at.note, c) || null : null;
        if (area == null && total == null && pm2 == null && !note) continue;
        const sec = section || (no.match(/^(\d+)[.\-]/) || [])[1] || null;
        const fl = floor ?? (no.match(/(\d+)\.(\d+)\.(\d+)$/) ? Number(no.match(/(\d+)\.(\d+)\.(\d+)$/)![2]) : null);
        const key = `${sec || ""}|${no}`;
        if (seen.has(key)) continue; seen.add(key);
        const free = decide(!!(total || pm2) && !BUSY.test(note || ""), !!(total || pm2), [st(r, c), at.total != null ? st(at.total, c) : null, at.pm2 != null ? st(at.pm2, c) : null, at.area != null ? st(at.area, c) : null]);
        out.push({ key, no, section: sec, floor: fl, rooms: roomsOf(note || ""), area, pm2, total, note, type: typeOf(note || no), free });
      }
    }
  }
  out.textMarked = textMarked;
  return out;
}

// ---------- формат 3: шахматка без подписей (номер вида «2-1/6/1», ниже площадь, статус, цена, цена м²) ----------
const CODE = /^\d+(?:-\d+)?\/\d+\/\d+$/;
function parseCodes(rows: string[][], st: St = () => null): Unit[] {
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
      out.push({ key, no, section: sec, floor: Number(fl), rooms: null, area, pm2, total: total || null, note: status || null, type: "apartment", free: decide(!!(total && total >= 5000) && !BUSY.test(status), !!(total && total >= 5000), [st(r, c), st(r + 1, c), st(r + 3, c)]) });
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
function parseTable(rows: string[][], st: St = () => null): Unit[] {
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
  for (let ri = h + 1; ri < rows.length; ri++) {
    const r = rows[ri];
    const g = (k: string) => idx[k] >= 0 ? String(r[idx[k]] ?? "").trim() : "";
    const area = num(g("area")), pm2 = num(g("pm2")); let total = num(g("total"));
    if ((total == null || total < 1000) && area && pm2) total = Math.round(area * pm2);
    if (!area && !total) continue;
    if (total != null && total < 3000 && !area) continue; // не цена квартиры
    const no = g("no") || ""; const status = g("status"); const note = g("note") || null;
    const key = `${g("section")}|${no || `${g("floor")}-${area}`}`;
    if (seen.has(key)) continue; seen.add(key);
    out.push({ key, no: no || "—", section: g("section") || null, floor: int(g("floor")), rooms: int(g("rooms")) ?? roomsOf(no + " " + (note || "")), area, pm2, total, note,
      type: typeOf(`${no} ${note || ""}`), free: decide(!!total && !BUSY.test(status), !!total, [idx.no >= 0 ? st(ri, idx.no) : null, idx.total >= 0 ? st(ri, idx.total) : null, idx.area >= 0 ? st(ri, idx.area) : null, st(ri, 0)]) });
  }
  return out;
}

// Читаем экономно: у функции 2 секунды процессора — без формул, стилей и с ограничением строк
const readWb = (buf: Uint8Array, styles = false) => XLSX.read(buf, { type: "array", dense: true, cellDates: false, cellFormula: false, cellHTML: false, cellNF: false, cellStyles: styles, sheetRows: 1500 });
function sheetRows(wb: any, name: string): string[][] {
  return (XLSX.utils.sheet_to_json(wb.Sheets[name], { header: 1, raw: false, defval: "", blankrows: true }) as unknown[][])
    .slice(0, 1500).map((row) => row.slice(0, 60).map((c) => String(c ?? "").trim()));
}
// Чтение заливки дорогое: на один вызов функции ~1,2 с процессора на стили, дальше файлы читаются без цветов (по тексту)
let styleBudget = 1200;
function parseWorkbook(buf: Uint8Array, info?: any[]): Unit[] {
  // стили (заливка) нужны для статуса по цвету; если файл с ними не читается — читаем без них
  const t0 = performance.now(); const useStyles = styleBudget > 0;
  let wb: any; try { wb = readWb(buf, useStyles); } catch { wb = readWb(buf, false); }
  if (useStyles) styleBudget -= performance.now() - t0;
  const all: Unit[] = []; const seen = new Set<string>();
  for (const name of wb.SheetNames.slice(0, 15)) {
    const rows = sheetRows(wb, name);
    let tools: { st: St; legend: Record<string, string> } = { st: () => null, legend: {} };
    try { tools = colorTools(wb.Sheets[name]); } catch { /* без цветов */ }
    // если статусы написаны текстом в ячейках квартир — верим тексту, цвета на этом листе не используем
    let chess = parseChess(rows, tools.st); let byText = false;
    if ((chess.textMarked || 0) >= 3) { chess = parseChess(rows); byText = true; }
    const best = [chess, parseCodes(rows, tools.st), parseTable(rows, tools.st)].sort((x, y) => y.length - x.length)[0];
    info?.push({ sheet: name, styles: useStyles, byText, legend: tools.legend, units: best.length, free: best.filter((u) => u.free).length });
    for (const u of best) { if (!seen.has(u.key)) { seen.add(u.key); all.push(u); } }
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
  const folders: { id: string; name: string }[] = []; const files: { id: string; name: string; gsheet: boolean }[] = []; const other: { id: string; name: string }[] = [];
  for (const block of html.split(/<div class="flip-entry"/).slice(1)) {
    const fid = (block.match(/id="entry-([A-Za-z0-9_-]+)"/) || [])[1];
    const href = decode((block.match(/<a href="([^"]+)"/) || [])[1] || "");
    const name = decode(((block.match(/<div class="flip-entry-title">([\s\S]*?)<\/div>/) || [])[1] || "").replace(/<[^>]+>/g, "")).trim();
    if (!fid || !name) continue;
    if (/\/folders\//.test(href)) folders.push({ id: fid, name });
    else if (/docs\.google\.com\/spreadsheets/.test(href) || /\.(xlsx?|csv|ods)["'\s]*$/i.test(name)) files.push({ id: fid, name, gsheet: /docs\.google\.com\/spreadsheets/.test(href) });
    else other.push({ id: fid, name });
  }
  return { folders, files, other };
}

// ---------- материалы для презентации: визуализации и планировки ----------
// Берём картинки из папок ЖК: «Візуалізації / Фото / Рендери» и файлы со словом «план».
// Копируем в хранилище CRM (presentations/nb/<ЖК>/…), чтобы в презентации не было ссылок на Диск застройщика.
const IMG = /\.(jpe?g|png|webp)$/i, PDF = /\.pdf$/i;
const isLayout = (n: string, path: string) => /план(ув|ир)|layout|планы/i.test(n + " " + path) && !/генплан|план\s*забуд|ситуац/i.test(n);
const houseOf = (s: string) => (s.match(/(?:буд(?:инок)?|дом|секц\w*|корпус)\.?\s*№?\s*(\d+)/i) || [])[1] || null;
async function collectMedia(src: any) {
  const old = src.meta?.media || {}; const known = new Map<string, any>([...(old.renders || []), ...(old.layouts || [])].map((x: any) => [x.id, x]));
  const renders: any[] = [], layouts: any[] = [];
  let level: { id: string; path: string }[] = [{ id: src.handle, path: "" }]; let budget = 30;
  for (let d = 0; d < 4 && level.length && budget > 0; d++) {
    const next: { id: string; path: string }[] = [];
    for (const f of level.slice(0, budget)) {
      budget--;
      let r: any; try { r = await driveFolder(f.id); } catch { continue; }
      for (const x of r.other) {
        if (!IMG.test(x.name) && !PDF.test(x.name)) continue;
        if (isLayout(x.name, f.path)) layouts.push({ id: x.id, name: x.name, house: houseOf(x.name) || houseOf(f.path), pdf: PDF.test(x.name) });
        else if (IMG.test(x.name) && (/фото|photo|візуал|визуал|рендер|render|генплан/i.test(f.path + " " + x.name) || d === 0)) renders.push({ id: x.id, name: x.name });
      }
      r.folders.filter((x: any) => !/паркін|паркин|документ|договор|догов|хід|ход\s*буд/i.test(x.name) && !/^\s*(відео|видео|video)\s*$/i.test(x.name)).forEach((x: any) => next.push({ id: x.id, path: `${f.path} / ${x.name}` }));
    }
    level = next;
  }
  // копируем новые картинки (превью Google 1600px) в хранилище; уже скопированные не трогаем
  const copy = async (x: any) => {
    const k = known.get(x.id); if (k?.url) return { ...x, url: k.url, off: k.off, house: k.house_manual ? k.house : x.house, house_manual: k.house_manual };
    try {
      const r = await fetch(`https://drive.google.com/thumbnail?id=${x.id}&sz=w1600`, { headers: UA, redirect: "follow" });
      const type = r.headers.get("content-type") || "";
      if (!r.ok || !type.startsWith("image/")) return null;
      const buf = new Uint8Array(await r.arrayBuffer());
      const path = `nb/${src.id}/${x.id}.${type.includes("png") ? "png" : "jpg"}`;
      const up = await fetch(`${SUPABASE_URL}/storage/v1/object/presentations/${path}`, { method: "POST", headers: { Authorization: `Bearer ${SERVICE_KEY}`, "Content-Type": type, "x-upsert": "true", "cache-control": "31536000" }, body: buf });
      if (!up.ok) return null;
      return { ...x, url: `${SUPABASE_URL}/storage/v1/object/public/presentations/${path}` };
    } catch { return null; }
  };
  const R = (await Promise.all(renders.slice(0, 14).map(copy))).filter(Boolean);
  const L = (await Promise.all(layouts.slice(0, 24).map(copy))).filter(Boolean);
  return { renders: R, layouts: L, at: new Date().toISOString() };
}
const SKIP = /довер|догов|заяв|анкет|акт\b|рахун|счет/i;
function score(name: string) {
  const n = name.toLowerCase(); if (SKIP.test(n)) return -1;
  if (/паркін|паркин|parking|комор|кладов/.test(n)) return 0;
  if (/калькул|расчет|розрах/.test(n)) return 1; // калькулятор — не шахматка, даже если в названии «секция»
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
const fileTag = (n: string) => String(n || "").toLowerCase().replace(/\.(xlsx?|csv|ods)["'\s]*$/, "").replace(/\d{1,2}[.\-]\d{1,2}[.\-]\d{2,4}/g, "")
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
      const row: any = { agency_id: src.agency_id, nb_source_id: src.id, unit_key: u.key, unit_no: u.no, complex_name: src.title, section: u.section, floor: u.floor, rooms: u.rooms,
        area: u.area, price_m2: u.pm2, total_price: u.total, currency: "USD", property_type: u.type, note: u.note, status: u.free ? "free" : "sold",
        calc: c, price_history: hist, first_payment_pct: c?.first_pct ?? null, first_payment_amount: c?.first ?? null,
        installment_months: c?.months ?? null, monthly_payment: c?.monthly ?? null, has_price_increase: hasMarkup(plan),
        last_seen_at: now, sheet_file: fileName, source: trigger === "upload" ? "Файл" : "Google Drive", source_url: src.url || null, district: src.meta?.district || null, updated_at: now };
      if (u.free) row.sold_at = null; else if (o?.status !== "sold") row.sold_at = now;
      return row;
    });
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
  // визуализации и планировки для презентаций (не мешаем основному обновлению, если не получилось)
  let media = src.meta?.media;
  if (src.kind === "gdrive") { try { media = await collectMedia(src); } catch { /* оставляем прежние */ } }
  const { data: fresh } = await db.from("nb_sources").select("meta").eq("id", src.id).maybeSingle(); // условия могли поменять, пока шло обновление
  await db.from("nb_sources").update({ meta: { ...(fresh?.meta || src.meta || {}), sync, ...(media ? { media } : {}), ...(src.meta?.price_mode ? { price_mode: src.meta.price_mode } : {}) } }).eq("id", src.id);
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
    const pick = pinned.length ? files.slice(0, 8) : strong.length ? strong.slice(0, 8) : files.slice(0, 2);
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
  styleBudget = 1200;
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
    if (body.colors && body.source_id) { // проверка: статусы по цвету легенды, по каждому файлу и листу
      const src = (srcs || []).find((x: any) => x.id === Number(body.source_id)); if (!src) return json({ ok: false });
      const files = (await findPriceFiles(src.handle)).filter((f) => f.s >= 4).slice(0, 6); const out: any[] = [];
      for (const f of files) { const info: any[] = []; try { const u = parseWorkbook(await download(f), info); out.push({ file: f.name, units: u.length, free: u.filter((x) => x.free).length, sheets: info }); } catch (e) { out.push({ file: f.name, error: (e as Error).message }); } }
      return json({ ok: true, out });
    }
    if (body.media && body.source_id) { // только собрать визуализации и планировки
      const src = (srcs || []).find((x: any) => x.id === Number(body.source_id)); if (!src) return json({ ok: false });
      const media = await collectMedia(src);
      const { data: fresh } = await db.from("nb_sources").select("meta").eq("id", src.id).maybeSingle();
      await db.from("nb_sources").update({ meta: { ...(fresh?.meta || {}), media } }).eq("id", src.id);
      return json({ ok: true, renders: media.renders.length, layouts: media.layouts.map((x: any) => `${x.house || "?"} ${x.name}`) });
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
    if (action === "media") {
      const src = await own(Number(body.source_id)); if (!src) return json({ ok: false, error: "ЖК не найден" });
      if (src.kind !== "gdrive") return json({ ok: false, error: "Материалы собираются из папки Google Drive" });
      const media = await collectMedia(src);
      const { data: fresh } = await db.from("nb_sources").select("meta").eq("id", src.id).maybeSingle();
      await db.from("nb_sources").update({ meta: { ...(fresh?.meta || {}), media } }).eq("id", src.id);
      return json({ ok: true, media });
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
