// Публичная подборка для клиента по секретной ссылке (без входа в CRM).
// Отдаёт ТОЛЬКО поля подборки, разрешённые для клиента: никаких данных CRM, других клиентов,
// внутренних комментариев, владельцев и комиссий. Доступ — по уникальному токену, проверка на сервере.
const CORS = { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Headers": "content-type,apikey,authorization,x-client-info", "Access-Control-Allow-Methods": "GET,POST,OPTIONS" };
const URL_ = Deno.env.get("SUPABASE_URL")!, KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const json = (b: unknown, s = 200) => new Response(JSON.stringify(b), { status: s, headers: { ...CORS, "content-type": "application/json; charset=utf-8" } });
const rest = (path: string, init: RequestInit = {}) => fetch(`${URL_}/rest/v1/${path}`, { ...init, headers: { apikey: KEY, authorization: `Bearer ${KEY}`, "content-type": "application/json", ...(init.headers || {}) } });

async function selectionByToken(token: string) {
  if (!/^[a-f0-9]{48}$/.test(token)) return null;
  const r = await rest(`client_selections?token=eq.${token}&select=id,title,status,expires_at,show_client_name,client_display_name,general_comment,manager_name,manager_phone,manager_email,agency_name,logo_url,pdf_url,published_at,created_at,open_count,first_opened_at`);
  const rows = r.ok ? await r.json() : [];
  const s = rows[0];
  if (!s || s.status !== "published") return null;
  if (s.expires_at && new Date(s.expires_at).getTime() < Date.now()) return { expired: true };
  return s;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });
  try {
    const body: any = req.method === "POST" ? await req.json().catch(() => ({})) : {};
    const token = String(body.t || new URL(req.url).searchParams.get("t") || "").trim().toLowerCase();
    const s: any = await selectionByToken(token);
    if (!s) return json({ ok: false, error: "Подборка не найдена или ссылка отключена" }, 404);
    if (s.expired) return json({ ok: false, error: "Срок действия ссылки истёк" }, 410);
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

    // открытие: статистика + данные подборки
    await rest("client_selection_events", { method: "POST", body: JSON.stringify({ selection_id: s.id, kind: "open", visitor }) });
    await rest(`client_selections?id=eq.${s.id}`, { method: "PATCH", body: JSON.stringify({ open_count: Number(s.open_count || 0) + 1, last_opened_at: new Date().toISOString(), first_opened_at: s.first_opened_at || new Date().toISOString() }) });
    const it = await rest(`client_selection_items?selection_id=eq.${s.id}&select=id,position,public_data,manager_comment,price_status&order=position.asc`);
    const items = (it.ok ? await it.json() : []).filter((x: any) => x.price_status !== "unavailable")
      .map((x: any) => ({ id: x.id, position: x.position, comment: x.manager_comment || "", ...x.public_data }));
    return json({ ok: true, selection: {
      title: s.title, client_name: s.show_client_name ? s.client_display_name : null, date: s.published_at || s.created_at,
      comment: s.general_comment || "", manager: { name: s.manager_name, phone: s.manager_phone, email: s.manager_email },
      agency: { name: s.agency_name, logo_url: s.logo_url }, pdf_url: s.pdf_url || null }, items });
  } catch (e) {
    return json({ ok: false, error: "Ошибка сервера" }, 500);
  }
});
