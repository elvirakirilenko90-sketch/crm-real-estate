// Публичная подборка для клиента по секретной ссылке (без входа в CRM).
// Ответ собирается из БЕЛОГО СПИСКА полей: никаких ссылок/названий площадок, ID объявлений, внутренних комментариев,
// владельцев, комиссий, истории цен и технических данных. Фото с чужих сайтов отдаются через эту же функцию (?img=),
// поэтому в HTML клиента нет адресов рекламных площадок. Доступ — по уникальному токену, проверка на сервере.
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
  const r = await rest(`client_selections?token=eq.${token}&select=id,title,status,expires_at,show_client_name,client_display_name,general_comment,manager_name,manager_phone,manager_email,manager_photo,manager_position,manager_telegram,manager_viber,manager_whatsapp,agency_name,logo_url,pdf_url,published_at,created_at,open_count,first_opened_at`);
  const rows = r.ok ? await r.json() : [];
  const s = rows[0];
  if (!s || s.status !== "published") return null;
  if (s.expires_at && new Date(s.expires_at).getTime() < Date.now()) return { expired: true };
  return s;
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
  };
  for (const k of Object.keys(out)) if (out[k] === null || (Array.isArray(out[k]) && !(out[k] as unknown[]).length && k !== "photos")) delete out[k];
  return out;
}

// контакты — только назначенного менеджера (снимок в подборке), пустые поля не передаются
function managerOf(s: any) {
  const m: Record<string, string> = {};
  const set = (k: string, v: unknown) => { const t = String(v ?? "").trim(); if (t) m[k] = t; };
  set("name", s.manager_name); set("position", s.manager_position); set("phone", s.manager_phone); set("email", s.manager_email);
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
    const it = await rest(`client_selection_items?selection_id=eq.${s.id}&select=id,position,public_data,manager_comment,price_status&order=position.asc`);
    const items = (it.ok ? await it.json() : []).filter((x: any) => x.price_status !== "unavailable").map((x: any) => publicItem(x, token));
    return json({ ok: true, selection: {
      title: clean(s.title, 200) || "Підбірка", client_name: s.show_client_name ? s.client_display_name : null, date: s.published_at || s.created_at,
      comment: clean(s.general_comment, 2000) || "", manager: managerOf(s),
      agency: { name: s.agency_name || null, logo_url: /^https:\/\//.test(s.logo_url || "") ? s.logo_url : null }, pdf_url: s.pdf_url && own(s.pdf_url) ? s.pdf_url : null }, items });
  } catch (_e) {
    return json({ ok: false, error: "Ошибка сервера" }, 500);
  }
});
