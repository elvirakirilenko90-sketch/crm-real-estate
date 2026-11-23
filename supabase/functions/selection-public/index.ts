// Публичная подборка для клиента по секретной ссылке (без входа в CRM).
// Ответ собирается из БЕЛОГО СПИСКА полей: никаких ссылок/названий площадок, ID объявлений, внутренних комментариев,
// владельцев, комиссий, истории цен и технических данных. Фото с чужих сайтов отдаются через эту же функцию (?img=),
// поэтому в HTML клиента нет адресов рекламных площадок. Доступ — по уникальному токену, проверка на сервере.
// v7 (19.11.2026): планировки квартир новостроек подставляются здесь по номеру квартиры из шахматки (см. nbPlans) —
// независимо от того, что сохранил браузер при создании подборки; исправленный план записывается обратно в подборку (для PDF).
// v8 (19.11.2026): Удобний — код «ПК-поверх-стояк» (2-17-6) → план поверху + контур квартири (meta.unit_plans.pk_plans).
// v9 (19.11.2026): планы по ключу квартиры (meta.unit_plans.by_key, Одеські Традиції): план квартиры + план этажа с контуром;
//     альтернатива «50% ежемесячного платежа» (row.half) для строк оплаты — из nb_units.calc.alts.
// v11 (23.11.2026): by_key → flat_plan с hq (отдельный чёткий план квартиры для вкладки «Квартира»); combo — только запасной вариант.
// v10 (19.11.2026): если для квартиры есть готовая картинка by_key.combo (nb-plan-compose: сверху план квартиры в хорошем
//     качестве, ниже план этажа с выделенной квартирой) — показываем только её (как «Планування»), без вырезанного куска плана этажа.
const CORS = { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Headers": "content-type,apikey,authorization,x-client-info", "Access-Control-Allow-Methods": "GET,POST,OPTIONS" };
const URL_ = Deno.env.get("SUPABASE_URL")!, KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const SELF = `${URL_}/functions/v1/selection-public`;
const json = (b: unknown, s = 200) => new Response(JSON.stringify(b), { status: s, headers: { ...CORS, "content-type": "application/json; charset=utf-8" } });
const rest = (path: string, init: RequestInit = {}) => fetch(`${URL_}/rest/v1/${path}`, { ...init, headers: { apikey: KEY, authorization: `Bearer ${KEY}`, "content-type": "application/json", ...(init.headers || {}) } });

// текст для клиента: без ссылок, названий площадок и телефонов из объявлений
const SRC = /(?<![\p{L}\d])(olx(\.ua)?|dim\.?ria(\.com)?|dom\.?ria(\.com)?|rieltor(\.ua)?|rem\.ua|lun\.ua|lun|flatfy|ria\.com|ріелтор(\.юа)?|дім\.?ріа|дом\.?риа)(?![\p{L}\d])/giu;
const LUN_UA = /(?<![\p{L}\d])ЛУН(?![\p{L}\d])/gu;
const clean = (t: unknown, max = 4000): string | null => {
  const s = String(t ?? "").replace(/(https?:\/\/|www\.)\S+/gi, "").replace(SRC, "").replace(LUN_UA, "")
    .replace(/(\+?38)?[\s(-]*0\d{2}[\s)-]*\d{3}[\s-]*\d{2}[\s-]*\d{2}/g, "").replace(/[ \t]{2,}/g, " ").replace(/\s+([.,;:!?])/g, "$1").replace(/([.,;:])[.,;:]+/g, "$1").replace(/[ ,;:]+$/g, "").trim();
  return s ? s.slice(0, max) : null;
};
const num = (v: unknown) => { const n = Number(String(v ?? "").replace(/[^\d.]/g, "")); return Number.isFinite(n) && n > 0 ? n : null; };
const own = (u: string) => u.startsWith(`${URL_}/storage/`);

async function selectionByToken(token: string) {
  if (!/^[a-f0-9]{48}$/.test(token)) return null;
  const r = await rest(`client_selections?token=eq.${token}&select=id,title,status,expires_at,show_client_name,client_display_name,general_comment,manager_name,manager_phone,manager_photo,manager_position,manager_telegram,manager_viber,manager_whatsapp,agency_name,logo_url,pdf_url,published_at,created_at,open_count,first_opened_at`);
  const rows = r.ok ? await r.json() : [];
  const s = rows[0];
  if (!s || s.status !== "published") return null;
  if (s.expires_at && new Date(s.expires_at).getTime() < Date.now()) return { expired: true };
  return s;
}

// Новобудови: таблица оплаты (только варианты, выбранные менеджером) — только числа
const n0 = (v: unknown) => { if (v == null || v === "") return null; const n = Number(v); return Number.isFinite(n) ? n : null; };
function halfOf(h: any) {
  if (!h || typeof h !== "object") return null;
  const o = { monthly: n0(h.monthly), months: n0(h.months), after_principal: n0(h.after_principal), after_months: n0(h.after_months), after_rate: n0(h.after_rate), after_monthly: n0(h.after_monthly), overpay: n0(h.overpay), total: n0(h.total) };
  return o.monthly != null && o.after_monthly != null ? o : null;
}
function payOf(p: any) {
  if (!p || typeof p !== "object") return null;
  const rows = (Array.isArray(p.rows) ? p.rows : []).slice(0, 6).map((r: any) => {
    const row: Record<string, unknown> = { pct: n0(r?.pct), first: n0(r?.first), disc: n0(r?.disc), disc_pct: n0(r?.disc_pct), months: n0(r?.months), monthly: n0(r?.monthly), total: n0(r?.total), rate: n0(r?.rate),
      until: /^\d{4}-\d{2}(-\d{2})?$/.test(String(r?.until || "")) ? r.until : null };
    const h = halfOf(r?.half); if (h) row.half = h;
    return row;
  });
  const out = { full: n0(p.full), full_disc: n0(p.full_disc), rows };
  return out.full != null || rows.length ? out : null;
}
// Планировка квартиры: план этажа (только из хранилища CRM) + контур квартиры
function flatPlanOf(p: any) {
  if (!p || typeof p !== "object" || !own(String(p.img || "")) || !/^[MLCZmlcz0-9 .,\-]{10,20000}$/.test(String(p.d || ""))) return null;
  const box = (Array.isArray(p.box) ? p.box : []).map(Number); if (box.length !== 4 || box.some((x: number) => !Number.isFinite(x))) return null;
  return { img: p.img, d: p.d, box, w: n0(p.w) || 0, h: n0(p.h) || 0, ...(p.hq && own(String(p.hq)) ? { hq: p.hq } : {}) };
}

// ---- Планировки новостроек по номеру квартиры (исправление при открытии ссылки) ----
// 0) По ключу квартиры (meta.unit_plans.by_key): готовая картинка combo (план квартиры + план этажа) — если есть;
//    иначе план квартиры (layout) + план этажа с контуром (flat_plan).
// 1) Гефест (meta.unit_plans.floor_plans, функция nb-gefest-floors): «18.10» / «6IX4» → этаж 18, кв. 10 →
//    оригинал плана этажа + контур квартиры (вкладки «Квартира» и «Розташування на поверсі», как Одеса Сіті).
// 2) Поквартирные файлы по номерам (meta.unit_plans.exact, Акварель-7): шахматка + номер + этаж → свой план; чужой план не показывается.
// 3) Удобний (meta.unit_plans.pk_plans): «2-17-6» = ПК 2, этаж 17, стояк 6 → план этажа ПК + контур квартиры стояка.
const reOk = (s: string) => { try { return new RegExp(s); } catch { return null; } };
function planFor(u: any, meta: any): { flat_plan?: any; layout?: string | null } | null {
  const up = meta?.unit_plans || {}; const no = String(u.unit_no || "").trim();
  const bk = up.by_key && typeof up.by_key === "object" ? up.by_key[String(u.unit_key || "")] : null;
  // вкладки «Квартира» (чёткий план hq) / «Розташування на поверсі» (план этажа с контуром), как у Одеса Сіті
  if (bk?.img && bk?.d && Array.isArray(bk.box)) return { flat_plan: { img: bk.img, d: bk.d, box: bk.box, w: bk.w, h: bk.h, ...(bk.layout ? { hq: bk.layout } : {}) }, layout: null };
  if (bk?.combo && own(String(bk.combo))) return { layout: bk.combo };
  const pf = no.match(/^(\d)-(\d{1,3})-(\d{1,3})$/);
  if (pf && Array.isArray(up.pk_plans)) {
    const fl = Number(pf[2]);
    const fr = up.pk_plans.find((x: any) => String(x?.pk) === pf[1] && Array.isArray(x.floors) && x.floors.includes(fl));
    const f = fr?.flats?.[String(Number(pf[3]))];
    if (fr?.img && f?.d && Array.isArray(f.box)) return { flat_plan: { img: String(fr.img).replace("{floor}", String(fl)), d: f.d, box: f.box, w: fr.w, h: fr.h } };
    return null;
  }
  const k = no.match(/^(\d+)(?:\.|[IVXLC]+)(\d+)$/);
  if (k && up.floor_plans) {
    const fp = up.floor_plans[k[1]]; const f = fp?.flats?.[k[2]];
    if (fp?.img && f?.d && Array.isArray(f.box)) return { flat_plan: { img: fp.img, d: f.d, box: f.box, w: fp.w, h: fp.h } };
  }
  const ex = (Array.isArray(up.exact) ? up.exact : []).filter((x: any) => x?.img && Array.isArray(x.nos) && x.sheet && reOk(x.sheet)?.test(String(u.unit_key || "")));
  if (ex.length) {
    if (!/^\d+$/.test(no)) return { layout: null };
    const fl = u.floor == null ? null : Number(u.floor);
    const hit = ex.find((x: any) => x.nos.includes(Number(no)) && (!Array.isArray(x.floors) || fl == null || x.floors.includes(fl)));
    return { layout: hit ? hit.img : null };
  }
  return null;
}
// альтернатива «50% ежемесячного платежа» к строке оплаты с тем же ПВ (nb_units.calc.alts[].half)
function withHalf(pay: any, calc: any) {
  const alts = Array.isArray(calc?.alts) ? calc.alts : []; if (!pay || !Array.isArray(pay.rows) || !alts.length) return pay;
  let changed = false;
  const rows = pay.rows.map((r: any) => { const a = alts.find((x: any) => Number(x?.first_pct) === Number(r?.pct)); if (!a?.half || r?.half) return r; changed = true; return { ...r, half: a.half }; });
  return changed ? { ...pay, rows } : pay;
}
async function fixNbPlans(rows: any[]) {
  const ids = [...new Set(rows.map((x) => Number((String(x.dedupe_key || "").match(/^nb:(\d+):/) || [])[1])).filter(Boolean))];
  if (!ids.length) return rows;
  const ur = await rest(`nb_units?id=in.(${ids.join(",")})&select=id,nb_source_id,unit_no,unit_key,floor,calc`); const units = ur.ok ? await ur.json() : [];
  const sids = [...new Set(units.map((u: any) => u.nb_source_id).filter(Boolean))];
  const sr = sids.length ? await rest(`nb_sources?id=in.(${sids.join(",")})&select=id,unit_plans:meta->unit_plans`) : null; const srcs = sr?.ok ? await sr.json() : [];
  const U = new Map(units.map((u: any) => [u.id, u])), S = new Map(srcs.map((s: any) => [s.id, { unit_plans: s.unit_plans }]));
  for (const x of rows) {
    const u: any = U.get(Number((String(x.dedupe_key || "").match(/^nb:(\d+):/) || [])[1])); if (!u) continue;
    const d = { ...(x.public_data || {}) };
    const p = planFor(u, S.get(u.nb_source_id));
    if (p) {
      if (p.flat_plan) { d.flat_plan = p.flat_plan; if (p.layout) d.layout = p.layout; else delete d.layout; }
      else { delete d.flat_plan; if (p.layout) d.layout = p.layout; else delete d.layout; }
    }
    if (d.payment) d.payment = withHalf(d.payment, u.calc);
    if (JSON.stringify(d) === JSON.stringify(x.public_data || {})) continue;
    x.public_data = d;
    // в подборку тоже: PDF строится из этих строк
    await rest(`client_selection_items?id=eq.${x.id}`, { method: "PATCH", body: JSON.stringify({ public_data: d }) }).catch(() => null);
  }
  return rows;
}

// безопасная карточка объекта — только разрешённые поля
function publicItem(x: any, token: string) {
  const d = x.public_data || {};
  const pic = (u: string, i: number, kind = "p") => !/^https:\/\//.test(u) ? null : own(u) ? u : `${SELF}?t=${token}&img=${x.id}.${kind}${i}`;
  const photos = (Array.isArray(d.photos) ? d.photos : []).map((u: string, i: number) => pic(String(u), i)).filter(Boolean).slice(0, 20);
  const out: Record<string, unknown> = {
    id: x.id, position: x.position, title: clean(d.title, 300), price: num(d.price), currency: ["USD", "UAH", "EUR"].includes(d.currency) ? d.currency : "USD",
    city: d.city || null, district: d.district || null, address: clean(d.address, 300), complex_name: clean(d.complex_name, 200),
    property_type: d.property_type || null, deal_type: d.deal_type || null, rooms: num(d.rooms), area: num(d.area), floor: num(d.floor), total_floors: num(d.total_floors),
    condition: clean(d.condition, 200), description: clean(d.description), comment: clean(x.manager_comment, 1000),
    advantages: (Array.isArray(d.advantages) ? d.advantages : []).map((a: unknown) => clean(a, 300)).filter(Boolean).slice(0, 12),
    layout: d.layout ? pic(String(d.layout), 0, "l") : null, photos,
    payment: payOf(d.payment), flat_plan: flatPlanOf(d.flat_plan),
  };
  for (const k of Object.keys(out)) if (out[k] === null || (Array.isArray(out[k]) && !(out[k] as unknown[]).length && k !== "photos")) delete out[k];
  return out;
}

// контакты — только назначенного менеджера (снимок в подборке), пустые поля не передаются.
// Почта менеджера клиенту НЕ показывается (решение 18.11.2026): только имя, должность, телефон, мессенджеры, фото.
function managerOf(s: any) {
  const m: Record<string, string> = {};
  const set = (k: string, v: unknown) => { const t = String(v ?? "").trim(); if (t) m[k] = t; };
  set("name", s.manager_name); set("position", s.manager_position); set("phone", s.manager_phone);
  set("telegram", s.manager_telegram); set("viber", s.manager_viber); set("whatsapp", s.manager_whatsapp);
  if (/^https:\/\//.test(s.manager_photo || "")) m.photo = s.manager_photo;
  return m;
}

async function proxyImage(s: any, token: string, spec: string) {
  const mm = /^(\d+)\.([pl])(\d{1,2})$/.exec(spec); if (!mm) return new Response("bad", { status: 400, headers: CORS });
  const r = await rest(`client_selection_items?id=eq.${mm[1]}&selection_id=eq.${s.id}&select=public_data`);
  const row = (r.ok ? await r.json() : [])[0]; if (!row) return new Response("not found", { status: 404, headers: CORS });
  const d = row.public_data || {}; const src = mm[2] === "l" ? d.layout : (d.photos || [])[Number(mm[3])];
  if (!/^https:\/\//.test(String(src || ""))) return new Response("not found", { status: 404, headers: CORS });
  const img = await fetch(String(src), { headers: { "user-agent": "Mozilla/5.0 (compatible; CRM-Selection/1.0)", accept: "image/avif,image/webp,image/*" } }).catch(() => null);
  const type = img?.headers.get("content-type") || "";
  if (!img || !img.ok || !/^image\//.test(type)) return new Response("unavailable", { status: 404, headers: CORS });
  // без исходных заголовков: в ответе нет адреса площадки
  return new Response(img.body, { headers: { ...CORS, "content-type": type, "cache-control": "public, max-age=86400" } });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });
  try {
    const q = new URL(req.url).searchParams;
    const body: any = req.method === "POST" ? await req.json().catch(() => ({})) : {};
    const token = String(body.t || q.get("t") || "").trim().toLowerCase();
    const s: any = await selectionByToken(token);
    if (!s) return json({ ok: false, error: "Подборка не найдена или ссылка отключена" }, 404);
    if (s.expired) return json({ ok: false, error: "Срок действия ссылки истёк" }, 410);
    if (q.get("img")) return await proxyImage(s, token, String(q.get("img")));
    const visitor = (req.headers.get("x-forwarded-for") || "").split(",")[0].trim().replace(/\.\d+$/, ".x");

    if (body.action && body.action !== "open") {
      const kind = String(body.action);
      if (!["view_item", "interested", "not_suitable", "comment"].includes(kind)) return json({ ok: false, error: "bad action" }, 400);
      // защита от засорения: не больше 300 событий в сутки на подборку
      const since = new Date(Date.now() - 86400000).toISOString();
      const cnt = await rest(`client_selection_events?selection_id=eq.${s.id}&created_at=gte.${since}&select=id`, { headers: { Prefer: "count=exact", Range: "0-0" } });
      const total = Number((cnt.headers.get("content-range") || "*/0").split("/")[1] || 0);
      if (total > 300) return json({ ok: true, throttled: true });
      const itemId = Number(body.item_id) || null;
      if (itemId) { const chk = await rest(`client_selection_items?id=eq.${itemId}&selection_id=eq.${s.id}&select=id`); const rows = chk.ok ? await chk.json() : []; if (!rows.length) return json({ ok: false, error: "bad item" }, 400); }
      await rest("client_selection_events", { method: "POST", body: JSON.stringify({ selection_id: s.id, item_id: itemId, kind, comment: kind === "comment" || kind === "not_suitable" || kind === "interested" ? String(body.comment || "").slice(0, 1000) || null : null, visitor }) });
      return json({ ok: true });
    }

    // открытие: статистика + безопасные данные подборки
    await rest("client_selection_events", { method: "POST", body: JSON.stringify({ selection_id: s.id, kind: "open", visitor }) });
    await rest(`client_selections?id=eq.${s.id}`, { method: "PATCH", body: JSON.stringify({ open_count: Number(s.open_count || 0) + 1, last_opened_at: new Date().toISOString(), first_opened_at: s.first_opened_at || new Date().toISOString() }) });
    const it = await rest(`client_selection_items?selection_id=eq.${s.id}&select=id,position,public_data,manager_comment,price_status,dedupe_key&order=position.asc`);
    let rows = it.ok ? await it.json() : [];
    try { rows = await fixNbPlans(rows); } catch { /* план не исправился — показываем как сохранено */ }
    const items = rows.filter((x: any) => x.price_status !== "unavailable").map((x: any) => publicItem(x, token));
    return json({ ok: true, selection: {
      title: clean(s.title, 200) || "Підбірка", client_name: s.show_client_name ? s.client_display_name : null, date: s.published_at || s.created_at,
      comment: clean(s.general_comment, 2000) || "", manager: managerOf(s),
      agency: { name: s.agency_name || null, logo_url: /^https:\/\//.test(s.logo_url || "") ? s.logo_url : null }, pdf_url: s.pdf_url && own(s.pdf_url) ? s.pdf_url : null }, items });
  } catch (_e) {
    return json({ ok: false, error: "Ошибка сервера" }, 500);
  }
});
