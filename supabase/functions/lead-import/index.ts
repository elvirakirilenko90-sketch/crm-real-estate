// lead-import v8 — загрузка лидов списком, из таблицы Excel (колонки настроены менеджером) и из скриншотов переписки.
// v8: preview принимает rows — готовые строки из таблицы (имя, телефон, источник, этап, дата, ответственный, заметка);
//     для таких строк этап из таблицы сохраняется (keep_stage), иначе — как раньше «Новый Лид».
// POST { mode: "preview" | "commit" | "decide", text?, images?, ai_text?, manager_email?, source?, leads?, id?, action? }
// Кто вызывает — определяется по токену входа: агентство и права берутся из таблицы users.
//  preview: разбирает список/скриншоты → лиды с пометками. Ничего не пишет. Дубли показываются только администратору.
//  commit:  добавляет новых клиентов этапом «Новый Лид» на выбранных менеджеров. Существующие карточки НЕ меняет.
//           Дубль: администратор может всё равно добавить его новым лидом (связь пишется в lead_duplicates);
//           дубль от менеджера не сохраняется, а уходит администратору на решение (lead_duplicates, status=pending).
//  decide:  администратор по дублю на проверке: approve (отдать в работу менеджеру) или reject.
const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization,apikey,content-type,x-client-info",
  "content-type": "application/json; charset=utf-8",
};
const URL_ = Deno.env.get("SUPABASE_URL")!;
const SERVICE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const ANON = Deno.env.get("SUPABASE_ANON_KEY") || "";
const AI_KEY = Deno.env.get("ANTHROPIC_API_KEY") || "";
const AI_MODEL = Deno.env.get("LEAD_AI_MODEL") || "claude-sonnet-5-5";
const TECH = "Администратор тех отдел";
const DIRECTOR = "Администратор директор";
const MAX_IMAGES = 10;

type Lead = {
  name: string; phone: string; source: string; notes: string;
  next_contact_at: string | null; warnings: string[]; duplicate_of?: number | null;
  stage?: string; lead_date?: string | null; manager_email?: string; manager_name?: string; _noYear?: boolean;
};
const NO_YEAR = /^(\d{1,2}[.\/-]\d{1,2}|\d{1,2}\s+[а-яіїє]{3,}\.?)$/i;
// Дата без года («01.11») берёт год у ближайшей строки списка, где год указан
function fillYears(rows: any[]) {
  const now = new Date();
  rows.forEach((r, i) => {
    if (!r || !r._noYear || !r.lead_date) return;
    let ref: any = null;
    for (let k = 1; k < rows.length && !ref; k++) for (const j of [i - k, i + k]) {
      const x = rows[j]; if (!ref && x && x.lead_date && !x._noYear) ref = x;
    }
    if (ref) {
      let y = +ref.lead_date.slice(0, 4);
      const md = r.lead_date.slice(4);
      if (new Date(`${y}${md}T00:00:00`) > now) y -= 1;
      const old = r.lead_date; r.lead_date = `${y}${md}`;
      r.notes = r.notes.replace(`Дата лида: ${fmtDate(old)}`, `Дата лида: ${fmtDate(r.lead_date)}`);
    }
  });
  rows.forEach((r) => { if (r) delete r._noYear; });
}
type Staff = { id: number; full_name: string; email: string; role: string; agency_id: number | null };

const STAGES = ["Новый Лид","Первый контакт","В работе","Назначена встреча","Проведена встреча","Думает","Задаток","Сделка","Отказ","Отложили"];
// Этап по словам в конце строки (первое совпадение по порядку важности)
const STAGE_RULES: [RegExp, string][] = [
  [/отказ|відмов|не\s*актуал|неактуал|слил|не\s*интерес|у других|у інших|передумал|не будет|не буде/i, "Отказ"],
  [/сделк|угод|продал|купил|закрыл|оформил|нотариус/i, "Сделка"],
  [/задат|завдат|аванс|бронь|забронир/i, "Задаток"],
  [/проведен[а-яёіїєґ]* встреч|был[аи]? на показ|показ (был|провел)|посмотрел[аи]?/i, "Проведена встреча"],
  [/встреч|показ|назначил/i, "Назначена встреча"],
  [/думает|дума[ею]т|подума|розмірков/i, "Думает"],
  [/отлож|відклад|позже|после праздник|весной|летом|осенью|зимой/i, "Отложили"],
  [/в работе|у роботі|подбира|подбор/i, "В работе"],
  [/созвон|поговорил|на связи|первый контакт/i, "Первый контакт"],
];
const MONTHS: Record<string, number> = { янв: 1, січ: 1, фев: 2, лют: 2, мар: 3, бер: 3, апр: 4, кві: 4, мая: 5, май: 5, тра: 5, июн: 6, чер: 6, июл: 7, лип: 7, авг: 8, сер: 8, сен: 9, вер: 9, окт: 10, жов: 10, ноя: 11, лис: 11, дек: 12, гру: 12 };

// «12.05», «12.05.26», «12/05/2026», «12 мая», «12 травня 2026» → YYYY-MM-DD (без года — ближайшая прошедшая дата)
function parseDate(s: string): string | null {
  const t = s.trim().toLowerCase();
  let d = 0, m = 0, y = 0;
  let x = t.match(/^(\d{1,2})[.\/-](\d{1,2})(?:[.\/-](\d{2,4}))?\s*(?:г\.?|р\.?)?$/);
  if (x) { d = +x[1]; m = +x[2]; y = x[3] ? +x[3] : 0; }
  else if ((x = t.match(/^(\d{1,2})\s+([а-яіїє]{3,})\.?(?:\s+(\d{2,4}))?\s*(?:г\.?|р\.?)?$/))) {
    const key = Object.keys(MONTHS).find((k) => x![2].startsWith(k));
    if (!key) return null;
    d = +x[1]; m = MONTHS[key]; y = x[3] ? +x[3] : 0;
  } else return null;
  if (d < 1 || d > 31 || m < 1 || m > 12) return null;
  const now = new Date();
  if (y && y < 100) y += 2000;
  if (!y) { y = now.getFullYear(); if (new Date(y, m - 1, d) > now) y -= 1; }
  return `${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
}

// Риэлтор по фамилии или имени (с учётом окончаний: «Русакова» → «Русаков»)
function findStaff(part: string, staff: Staff[]): Staff | null {
  const words = part.toLowerCase().replace(/[^a-zа-яёіїєґ'’\s-]/gi, " ").split(/\s+/).filter((w) => w.length >= 3);
  if (!words.length || words.length > 3) return null;
  let best: Staff | null = null, score = 0;
  for (const s of staff) {
    const names = String(s.full_name || "").toLowerCase().split(/\s+/).filter((w) => w.length >= 3);
    for (const w of words) for (const n of names) {
      const stem = Math.min(n.length, w.length, 5);
      const sc = w === n ? 3 : (n.slice(0, stem) === w.slice(0, stem) && stem >= 4 ? 2 : 0);
      if (sc > score) { score = sc; best = s; }
    }
  }
  return score >= 2 ? best : null;
}

const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: CORS });

async function rest(path: string, init: RequestInit = {}) {
  const r = await fetch(`${URL_}/rest/v1/${path}`, {
    ...init,
    headers: { apikey: SERVICE, authorization: `Bearer ${SERVICE}`, "content-type": "application/json", ...(init.headers || {}) },
  });
  if (!r.ok) throw new Error(`База: ${r.status} ${(await r.text()).slice(0, 300)}`);
  return r.status === 204 ? null : r.json();
}

// Пользователь CRM по токену входа
async function caller(req: Request) {
  const auth = req.headers.get("authorization") || "";
  const r = await fetch(`${URL_}/auth/v1/user`, { headers: { authorization: auth, apikey: ANON || SERVICE } });
  if (!r.ok) throw new Error("Нужно войти в CRM");
  const u = await r.json();
  const email = String(u?.email || "").toLowerCase();
  const rows = await rest(`users?select=id,full_name,email,role,agency_id,access,status&email=ilike.${encodeURIComponent(email)}`);
  const me = (rows || []).find((x: any) => String(x.email || "").toLowerCase() === email);
  if (!me || me.access === false || (me.status && me.status !== "active")) throw new Error("Доступ к CRM закрыт");
  return me;
}

// Телефон → +380XXXXXXXXX (Украина), другие страны — цифры с «+»
const normPhone = (raw: string) => {
  let d = String(raw || "").replace(/\D/g, "");
  if (!d) return "";
  if (d.length === 10 && d.startsWith("0")) d = "38" + d;
  if (d.length === 9) d = "380" + d;
  return "+" + d;
};
const isExcelBroken = (s: string) => /\d[,.]\d+E\+?\d+/i.test(s);
const looksPhone = (s: string) =>
  !isExcelBroken(s) && String(s).replace(/\D/g, "").length >= 9 && /^[\d\s+()\-.]+$/.test(String(s).trim());
// Ник в Telegram вместо телефона: @username или t.me/username
const NICK_RE = /^(?:(?:тг|tg|телеграм+|telegram)\s*:?\s*)?(?:@|https?:\/\/t\.me\/|t\.me\/)([A-Za-z0-9_]{4,32})$/i;
const nickOf = (s: string) => { const m = String(s || "").trim().match(NICK_RE); return m ? "@" + m[1] : ""; };
// Телефон или ник — то, что пишется в поле «Телефон»
const normContact = (v: string) => nickOf(v) || normPhone(v);
const contactKey = (v: string) => (nickOf(v) ? nickOf(v).toLowerCase() : normPhone(v));
// Порядковый номер в начале строки («1.», «12)», «3 -», «4 ») перед телефоном или ником
const ORDINAL = /^\s*\d{1,4}\s*(?:[.)\-–—:]\s*|\s+)(?=[+@0(]|38|3[,.]8|t\.me|тг|tg)/i;
// «10. Михаил 0970…» — номер с точкой/скобкой перед именем
const ORDINAL_NAME = /^\s*\d{1,4}\s*[.)]\s*(?=[A-Za-zА-Яа-яЁёІіЇїЄєҐґ])/;
const stripOrdinal = (line: string) => line.replace(/^\s*[•●▪*·]+\s*/, "").replace(ORDINAL, "").replace(ORDINAL_NAME, "");
// Подзаголовок-источник над списком: «Тик-ток», «Инста:», «Телеграмм»
const SOURCE_HEADERS: [RegExp, string][] = [
  [/^(тик-?ток|tik-?tok|тт)$/i, "Тик-Ток рабочий"],
  [/^(инст[a-zа-яёіїєґ]*|інст[a-zа-яёіїєґ]*|insta[a-zа-яёіїєґ]*)$/i, "Инстаграм рабочий"],
  [/^(телегр[a-zа-яёіїєґ]*|telegram|тг|tg)(\s*-?\s*канал)?$/i, "Телеграмм-канал рабочий"],
  [/^(фейсбук|facebook|фб|fb)$/i, "Фейсбук рабочий"],
  [/^(олх|olx)$/i, "ОЛХ"],
  [/^рекоменд[a-zа-яёіїєґ]*$/i, "Рекомендации"],
  [/^повторн[a-zа-яёіїєґ]*( клиент[a-zа-яёіїєґ]*)?$/i, "Повторный клиент"],
];
const sourceHeader = (line: string) => {
  const t = line.trim().replace(/[:：.\-–—]+$/, "").trim();
  if (!t || /\d/.test(t) || t.split(/\s+/).length > 3) return "";
  for (const [re, src] of SOURCE_HEADERS) if (re.test(t)) return src;
  return "";
};
const PHONE_IN_TEXT = /(?:\+?\d{1,3}[\s\-]?)?\(?0?\d{2,3}\)?[\s\-]?\d{3}[\s\-]?\d{2}[\s\-]?\d{2}/;

const SPLIT = /\t|;|\s\|\s|,(?!\d)/;
const NAME_RE = /^[A-Za-zА-Яа-яЁёІіЇїЄєҐґ'’\-\s.]{2,40}$/;
// Короткая ячейка с названием площадки — это источник
const SOURCE_RE = /^(тик-?ток|tik-?tok|инста|інста|insta|телегр|telegr|фейсбук|facebook|fb\b|viber|вайбер|whats|olx|олх|дом\.?риа|dim\.?ria|dom\.?ria|лун|lun|rieltor|сайт|site|рекоменд|повторн|звонок|дзвінок|реклам|google|гугл|youtube|ютуб|авито|лид|лід|эля|еля)/i;
const HEADER = {
  name: /имя|ім['’]я|фио|піб|name|клиент|клієнт/i,
  phone: /телеф|phone|номер|тел\b/i,
  source: /источ|джерел|source|канал|откуда|звідки/i,
  notes: /замет|нотат|коммент|комент|note|запрос|запит|описан|опис/i,
};

// Формат заметок: «телефон - имя - запрос - дата - риэлтор - что угодно» (дата и риэлтор могут меняться местами)
const NOTE_SPLIT = /\s+[-–—]+\s+|\s*\|\s*|;|\t/;
const fmtDate = (iso: string) => iso.split("-").reverse().join(".");

function parseNotesLine(line: string, staff: Staff[]): Lead | null {
  const clean = stripOrdinal(line);
  const parts = clean.split(NOTE_SPLIT).map((p) => p.trim()).filter(Boolean);
  // отдельная часть «1» / «12.» в начале — тоже порядковый номер
  if (parts.length && /^\d{1,4}[.)]?$/.test(parts[0])) parts.shift();
  if (parts.length < 3) return null;
  const warnings: string[] = [];
  const used = new Set<number>();
  let phone = "";
  parts.forEach((p, i) => {
    if (phone || used.has(i)) return;
    if (isExcelBroken(p)) { warnings.push(`Номер испорчен Excel («${p}») — введите вручную`); used.add(i); return; }
    if (looksPhone(p)) { phone = normPhone(p); used.add(i); }
  });
  // нет телефона — берём ник Telegram
  if (!phone) parts.forEach((p, i) => { if (!phone && !used.has(i) && nickOf(p)) { phone = nickOf(p); used.add(i); } });
  if (!phone && !warnings.length) return null; // не похоже на строку из заметок
  let leadDate: string | null = null, noYear = false;
  parts.forEach((p, i) => { if (!used.has(i) && !leadDate) { const d = parseDate(p); if (d) { leadDate = d; noYear = NO_YEAR.test(p.trim()); used.add(i); } } });
  // имя — первая свободная короткая часть из букв
  let name = "", nameIdx = -1;
  parts.forEach((p, i) => { if (nameIdx < 0 && !used.has(i) && NAME_RE.test(p) && p.split(/\s+/).length <= 3) { name = p; nameIdx = i; used.add(i); } });
  // риэлтор — среди частей после имени
  let realtor: Staff | null = null, realtorRaw = "";
  parts.forEach((p, i) => {
    if (realtor || used.has(i) || i < nameIdx) return;
    const s = findStaff(p, staff);
    if (s) { realtor = s; realtorRaw = p; used.add(i); }
  });
  const free = parts.filter((_, i) => !used.has(i));
  const request = free.shift() || "";
  // одно слово с заглавной буквы, не найденное среди сотрудников, — скорее всего фамилия риэлтора
  if (!realtor) {
    const gi = free.findIndex((p) => /^[А-ЯЁІЇЄҐA-Z][а-яёіїєґa-z'’-]+$/.test(p));
    if (gi >= 0) {
      realtorRaw = free.splice(gi, 1)[0];
      warnings.push(`Риэлтор «${realtorRaw}» не найден среди сотрудников — выберите вручную`);
    }
  }
  const extra = free.join(" · ");
  let stage = "Новый Лид";
  for (const [re, st] of STAGE_RULES) if (re.test(extra)) { stage = st; break; }
  const notes = [
    request && `Запрос: ${request}`,
    leadDate && `Дата лида: ${fmtDate(leadDate)}`,
    realtorRaw && `Риэлтор (из заметок): ${realtorRaw}`,
    extra && `Информация: ${extra}`,
  ].filter(Boolean).join("\n");
  if (!name) warnings.push("Не найдено имя");
  return {
    name, phone, source: "", notes, next_contact_at: null, warnings, stage, lead_date: leadDate, _noYear: noYear,
    manager_email: (realtor as Staff | null)?.email || "", manager_name: (realtor as Staff | null)?.full_name || "",
  };
}

function parseText(text: string, staff: Staff[] = []): Lead[] {
  const out: Lead[] = [];
  const raw = String(text || "").split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  // подзаголовок «Тик-ток» / «Инста» / «Телеграмм» задаёт источник для строк под ним
  const lines: string[] = [], lineSource: string[] = [];
  let current = "";
  for (const l of raw) {
    const h = sourceHeader(l);
    if (h) { current = h; continue; }
    lines.push(l); lineSource.push(current);
  }
  const withSource = (r: Lead, i: number) => { if (lineSource[i] && !r.source) r.source = lineSource[i]; return r; };
  // Списки из заметок разбираем отдельным правилом
  const notesRows = lines.map((l) => parseNotesLine(l, staff));
  if (lines.length && notesRows.filter(Boolean).length >= Math.max(1, Math.ceil(lines.length * 0.6))) {
    lines.forEach((l, i) => {
      const r = notesRows[i] || parseText(l, [])[0];
      if (r) out.push(withSource(r, i));
    });
    fillYears(out);
    return out;
  }
  // Заголовок таблицы → порядок столбцов
  let cols: (keyof typeof HEADER | null)[] | null = null;
  if (lines.length && !/\d{6,}/.test(lines[0]) && (HEADER.name.test(lines[0]) || HEADER.phone.test(lines[0]))) {
    lineSource.shift();
    cols = lines.shift()!.split(SPLIT).map((h) => {
      for (const k of Object.keys(HEADER) as (keyof typeof HEADER)[]) if (HEADER[k].test(h)) return k;
      return null;
    });
  }
  lines.forEach((rawLine, li) => {
    const line = stripOrdinal(rawLine);
    const cells = line.split(SPLIT).map((c) => c.trim());
    const warnings: string[] = [];
    let phone = "", name = "", source = "";
    const rest: string[] = [];
    cells.forEach((c, i) => {
      if (!c) return;
      const col = cols ? cols[i] : null;
      if (isExcelBroken(c)) { warnings.push(`Номер испорчен Excel («${c}») — введите вручную`); return; }
      if (col === "phone" && !phone && looksPhone(c)) { phone = normPhone(c); return; }
      if (col === "name" && !name) { name = c; return; }
      if (col === "source" && !source) { source = c; return; }
      if (col === "notes") { rest.push(c); return; }
      if (!phone && looksPhone(c)) { phone = normPhone(c); return; }
      if (!phone && nickOf(c)) { phone = nickOf(c); return; }
      if (!source && c.length <= 30 && SOURCE_RE.test(c)) { source = c; return; }
      if (!name && NAME_RE.test(c)) { name = c; return; }
      rest.push(c);
    });
    // строка сплошным текстом: «Михаил 0970989397 ищет 2к»
    if (!phone && !warnings.length) {
      const m = line.match(PHONE_IN_TEXT);
      if (m) {
        phone = normPhone(m[0]);
        const before = line.slice(0, m.index).replace(/[,;:\-–—]+\s*$/, "").trim();
        const after = line.slice((m.index || 0) + m[0].length).replace(/^[,;:\-–—\s]+/, "").trim();
        if (!name && before && NAME_RE.test(before)) { name = before; rest.length = 0; if (after) rest.push(after); }
      }
    }
    if (!phone && !warnings.length) warnings.push("Не найден телефон");
    if (!name) warnings.push("Не найдено имя");
    out.push(withSource({ name, phone, source, notes: rest.join(" · "), next_contact_at: null, warnings }, li));
  });
  return out;
}

const AI_PROMPT = `Это переписка агента недвижимости с клиентом (Telegram, Viber, WhatsApp, Instagram и т.п.).
Верни ТОЛЬКО JSON-массив клиентов (обычно один), без пояснений:
[{"name":"","phone":"","username":"","messenger":"","request":"что ищет: тип, комнаты, район или ЖК, бюджет","budget_usd":null,"rooms":null,"district":"","complex":"","deal_type":"Купить|Продать|Снять|Сдать","next_step":"о чём договорились","next_contact_at":"YYYY-MM-DDTHH:MM или null","summary":"2–3 предложения на русском"}]
Правила: телефон бери только если он виден. Ничего не выдумывай — если данных нет, пустая строка или null.
Имя клиента — это собеседник агента, а не сам агент. Сегодня ${new Date().toISOString().slice(0, 10)}.`;

async function askAI(content: unknown[]): Promise<Lead[]> {
  if (!AI_KEY) throw new Error("Распознавание скриншотов ещё не включено: нужен ключ ИИ (ANTHROPIC_API_KEY в настройках функций Supabase).");
  const r = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: { "x-api-key": AI_KEY, "anthropic-version": "2023-06-01", "content-type": "application/json" },
    body: JSON.stringify({ model: AI_MODEL, max_tokens: 2000, messages: [{ role: "user", content }] }),
  });
  if (!r.ok) throw new Error(`ИИ не ответил (${r.status}). Попробуйте ещё раз.`);
  const j = await r.json();
  const txt = (j.content || []).map((c: any) => c.text || "").join("");
  let arr: any[] = [];
  try { arr = JSON.parse(txt.slice(txt.indexOf("["), txt.lastIndexOf("]") + 1) || "[]"); } catch { arr = []; }
  return arr.map((c: any) => {
    const notes = [
      c.summary,
      c.request && `Запрос: ${c.request}`,
      c.deal_type && `Тип сделки: ${c.deal_type}`,
      c.budget_usd && `Бюджет: $${c.budget_usd}`,
      c.rooms && `Комнат: ${c.rooms}`,
      c.district && `Район: ${c.district}`,
      c.complex && `ЖК: ${c.complex}`,
      c.next_step && `Договорились: ${c.next_step}`,
      c.username && `Ник: ${c.username}`,
    ].filter(Boolean).join("\n");
    const warnings: string[] = [];
    const phone = (c.phone && !isExcelBroken(String(c.phone)) ? normPhone(String(c.phone)) : "") || nickOf(c.username ? (String(c.username).startsWith("@") ? c.username : "@" + c.username) : "");
    if (!phone) warnings.push("Телефона в переписке нет — добавьте вручную");
    const next = c.next_contact_at && !isNaN(Date.parse(c.next_contact_at)) ? new Date(c.next_contact_at).toISOString() : null;
    return { name: String(c.name || "").trim(), phone, source: String(c.messenger || "").trim(), notes, next_contact_at: next, warnings };
  });
}

type Known = { id: number; name: string; manager_name: string; manager_email: string; stage: string; created_at: string };
// Телефоны и ники, уже существующие в агентстве (номер мог оказаться и в name/source из-за старого импорта)
async function knownPhones(agencyId: number | null): Promise<Map<string, Known>> {
  const filter = agencyId ? `&agency_id=eq.${agencyId}` : "";
  const rows = await rest(`leads?select=id,name,phone,source,stage,manager_name,manager_email,created_at&order=id.asc&limit=100000${filter}`);
  const m = new Map<string, Known>();
  for (const row of rows || []) for (const v of [row.phone, row.source, row.name]) {
    const s = String(v || "");
    const k = looksPhone(s) || nickOf(s) ? contactKey(s) : "";
    // запоминаем самую первую карточку с этим номером
    if (k && !m.has(k)) m.set(k, { id: row.id, name: row.name || "", manager_name: row.manager_name || "", manager_email: row.manager_email || "", stage: row.stage || "", created_at: row.created_at || "" });
  }
  return m;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });
  try {
    const me = await caller(req);
    const b: any = await req.json();
    const isTech = me.role === TECH;
    const isDirector = me.role === DIRECTOR;

    // Ответственный: менеджер — всегда сам; директор — любой сотрудник своего агентства; тех. админ — любой
    let owner = me;
    if ((isTech || isDirector) && b.manager_email && String(b.manager_email).toLowerCase() !== String(me.email).toLowerCase()) {
      const rows = await rest(`users?select=id,full_name,email,role,agency_id,access,status&email=ilike.${encodeURIComponent(String(b.manager_email))}`);
      const target = (rows || []).find((x: any) => String(x.email || "").toLowerCase() === String(b.manager_email).toLowerCase());
      if (!target || target.access === false) throw new Error("Выбранный менеджер не найден или без доступа");
      if (!isTech && String(target.agency_id) !== String(me.agency_id)) throw new Error("Можно назначать только сотрудников своего агентства");
      owner = target;
    }
    const agencyId = owner.agency_id ?? me.agency_id ?? null;
    const known = await knownPhones(agencyId);
    const defaultSource = String(b.source || "").trim();
    const staff: Staff[] = (await rest(`users?select=id,full_name,email,role,agency_id,access&access=not.is.false${agencyId ? `&agency_id=eq.${agencyId}` : ""}`)) || [];
    // ответственный по строке: менеджер — всегда сам; директор/тех. админ — любой сотрудник агентства
    const rowOwner = (email: string) => {
      if (!(isTech || isDirector) || !email) return owner;
      return staff.find((s) => String(s.email).toLowerCase() === String(email).toLowerCase()) || owner;
    };
    const leadDateIso = (v: any) => {
      if (!v || isNaN(Date.parse(v))) return null;
      const d = new Date(v);
      return d > new Date() ? null : d.toISOString();
    };

    const isAdmin = isTech || isDirector;
    const leadRow = (x: any, phone: string, name: string) => {
      const who = rowOwner(String(x.manager_email || ""));
      const managerName = who.full_name || who.email;
      const createdAt = leadDateIso(x.lead_date);
      return {
        agency_id: agencyId,
        name: name || "Без имени",
        phone: phone || null,
        source: String(x.source || defaultSource || "").trim() || null,
        // этап из таблицы (цвет/колонка «Этап») — только для строк из Excel; иначе «Новый Лид», менеджер обновит после звонка
        stage: x.keep_stage && STAGES.includes(String(x.stage || "")) ? String(x.stage) : "Новый Лид",
        notes: `Ответственный менеджер: ${managerName}\n${String(x.notes || "").trim()}`.trim(),
        manager_name: managerName,
        manager_email: who.email,
        manager_id: who.id,
        next_contact_at: x.next_contact_at && !isNaN(Date.parse(x.next_contact_at)) ? new Date(x.next_contact_at).toISOString() : null,
        created_at: createdAt || new Date().toISOString(),
      };
    };

    // Администратор решает по дублю, который загрузил менеджер
    if (b.mode === "decide") {
      if (!isAdmin) throw new Error("Решение по дублям принимает администратор");
      const [d] = (await rest(`lead_duplicates?select=*&id=eq.${Number(b.id)}`)) || [];
      if (!d || d.status !== "pending") throw new Error("Дубль уже обработан");
      if (!isTech && String(d.agency_id) !== String(me.agency_id)) throw new Error("Доступ к CRM закрыт");
      const now = new Date().toISOString();
      if (b.action === "approve") {
        const p = d.payload || {};
        const [ins] = await rest("leads", { method: "POST", headers: { prefer: "return=representation" }, body: JSON.stringify(leadRow({ ...p, manager_email: b.manager_email || p.manager_email }, p.phone || "", p.name || "")) });
        await rest(`lead_duplicates?id=eq.${d.id}`, { method: "PATCH", body: JSON.stringify({ status: "added", lead_id: ins.id, decided_by: me.email, decided_at: now }) });
        return json({ success: true, lead_id: ins.id });
      }
      await rest(`lead_duplicates?id=eq.${d.id}`, { method: "PATCH", body: JSON.stringify({ status: "rejected", decided_by: me.email, decided_at: now }) });
      return json({ success: true });
    }

    if (b.mode === "commit") {
      const seen = new Set<string>();
      const input: any[] = Array.isArray(b.leads) ? b.leads.slice(0, 1000) : [];
      const rows: any[] = [];
      let dupAdded = 0, pending = 0;
      for (const x of input) {
        const name = String(x.name || "").trim();
        const phone = x.phone && !isExcelBroken(String(x.phone)) ? normContact(String(x.phone)) : "";
        const key = phone ? contactKey(phone) : "";
        if (!name && !phone) continue;
        if (key && seen.has(key)) continue;
        if (key) seen.add(key);
        const orig = key ? known.get(key) : undefined;
        if (orig) {
          // существующую карточку не трогаем
          if (isAdmin) {
            if (!x.allow_duplicate) continue;
            const [ins] = await rest("leads", { method: "POST", headers: { prefer: "return=representation" }, body: JSON.stringify(leadRow(x, phone, name)) });
            await rest("lead_duplicates", { method: "POST", body: JSON.stringify({ agency_id: agencyId, lead_id: ins.id, duplicate_of: orig.id, status: "added", uploaded_by: me.email, decided_by: me.email, decided_at: new Date().toISOString() }) });
            dupAdded++;
          } else {
            const payload = { name, phone, source: String(x.source || defaultSource || "").trim(), notes: String(x.notes || "").trim(), lead_date: x.lead_date || null, manager_email: me.email, manager_name: me.full_name, stage: x.stage || null, keep_stage: !!x.keep_stage, next_contact_at: x.next_contact_at || null };
            await rest("lead_duplicates", { method: "POST", body: JSON.stringify({ agency_id: agencyId, duplicate_of: orig.id, status: "pending", uploaded_by: me.email, payload }) });
            pending++;
          }
          continue;
        }
        rows.push(leadRow(x, phone, name));
      }
      let inserted = 0;
      if (rows.length) {
        const ins = await rest("leads", { method: "POST", headers: { prefer: "return=representation" }, body: JSON.stringify(rows) });
        inserted = ins.length;
      }
      return json({ success: true, inserted, duplicates_added: dupAdded, pending, skipped: input.length - inserted - dupAdded - pending });
    }

    // preview
    let leads: Lead[] = [];
    const fromTable = Array.isArray(b.rows);
    if (fromTable) {
      for (const r of b.rows.slice(0, 1000)) {
        const warnings: string[] = [];
        const rawPhone = String(r.phone || "").trim();
        let phone = "";
        if (rawPhone) {
          if (isExcelBroken(rawPhone)) warnings.push(`Номер испорчен Excel («${rawPhone}») — введите вручную`);
          else if (nickOf(rawPhone)) phone = nickOf(rawPhone);
          else if (String(rawPhone).replace(/\D/g, "").length >= 9) phone = normPhone(rawPhone);
          else warnings.push(`Телефон не распознан («${rawPhone}»)`);
        } else warnings.push("Не найден телефон");
        const name = String(r.name || "").trim();
        if (!name) warnings.push("Не найдено имя");
        let leadDate: string | null = null;
        const ld = String(r.lead_date || "").trim();
        if (/^\d{4}-\d{2}-\d{2}/.test(ld)) leadDate = ld.slice(0, 10); else if (ld) leadDate = parseDate(ld);
        let stage = STAGES.includes(String(r.stage || "")) ? String(r.stage) : "";
        if (!stage && r.stage_text) for (const [re, st] of STAGE_RULES) if (re.test(String(r.stage_text))) { stage = st; break; }
        let manager_email = "", manager_name = "";
        if (r.manager && (isTech || isDirector)) { const s = findStaff(String(r.manager), staff); if (s) { manager_email = s.email; manager_name = s.full_name; } else warnings.push(`Ответственный «${r.manager}» не найден среди сотрудников`); }
        const next = r.next_contact_at && !isNaN(Date.parse(r.next_contact_at)) ? new Date(r.next_contact_at).toISOString() : null;
        leads.push({ name, phone, source: String(r.source || "").trim(), notes: String(r.notes || "").trim(), next_contact_at: next, warnings,
          stage: stage || "Новый Лид", lead_date: leadDate, manager_email, manager_name, ...(r.row ? { row: r.row } : {}) } as Lead);
      }
    }
    if (b.text && !b.ai_text) leads = leads.concat(parseText(b.text, staff));
    if (b.text && b.ai_text) leads = leads.concat(await askAI([{ type: "text", text: `${AI_PROMPT}\n\nПереписка:\n${String(b.text).slice(0, 20000)}` }]));
    const images = Array.isArray(b.images) ? b.images.slice(0, MAX_IMAGES) : [];
    if (images.length) {
      const content: unknown[] = images.map((im: any) => ({
        type: "image",
        source: { type: "base64", media_type: im.mime || "image/jpeg", data: String(im.base64 || "").replace(/^data:[^,]+,/, "") },
      }));
      content.push({ type: "text", text: AI_PROMPT + (images.length > 1 ? "\nСкриншоты могут быть частями одной переписки." : "") });
      leads = leads.concat(await askAI(content));
    }
    const batch = new Set<string>();
    for (const l of leads) {
      if (!l.source && defaultSource) l.source = defaultSource;
      const k = l.phone ? contactKey(l.phone) : "";
      const orig = k ? known.get(k) : undefined;
      // о дублях знает только администратор: менеджер видит обычную строку
      if (orig && (isTech || isDirector)) {
        l.duplicate_of = orig.id;
        (l as any).duplicate = orig;
        l.warnings.push(`Дубль: клиент №${orig.id} уже есть у менеджера ${orig.manager_name || "—"}`);
      } else if (k && batch.has(k)) l.warnings.push("Повтор в этом списке");
      if (k) batch.add(k);
      if (!l.manager_email) { l.manager_email = owner.email; l.manager_name = owner.full_name; }
      if (!fromTable) l.stage = "Новый Лид";
    }
    return json({
      success: true,
      count: leads.length,
      new_count: leads.filter((l) => !l.duplicate_of).length,
      owner: { name: owner.full_name, email: owner.email },
      staff: (isTech || isDirector) ? staff.map((x) => ({ name: x.full_name, email: x.email })) : [],
      stages: STAGES,
      ai_enabled: !!AI_KEY,
      leads,
    });
  } catch (e) {
    return json({ success: false, error: e instanceof Error ? e.message : String(e) }, 400);
  }
});
