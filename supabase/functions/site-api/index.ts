// site-api v3 (26.11.2026) — публичный API сайта pride-agency.com.ua.
// GET  ?a=stats  → по каждому ЖК (nb_source_id): цена за м² от–до, площадь от–до, комнаты, рассрочка (свободные квартиры) + координаты.
//                  Только безопасные поля: без цен квартир, контактов, комиссий.
// GET  ?a=stats также отдаёт lun: краткий список ЖК Одессы с ЛУН (site_lun_complexes), без дублей наших ЖК.
// GET  ?a=lun&slug=… → подробности ЖК с ЛУН: адрес, характеристики, фото.
// POST {a:"event", event, slug, page, device, lang, ref, utm, sid} → site_events (view|phone|telegram|form_open|form_submit).
// POST {a:"lead", name, phone, slug, complex, page, lang, website(honeypot)} → lead-inbox (platform site) → «Нераспределённые лиды».
// POST {a:"geocode"} + x-cron-secret → координаты ЖК по адресам из /site/content.json (Nominatim) → site_complexes.
import { createClient } from "jsr:@supabase/supabase-js@2";
const URL_ = Deno.env.get("SUPABASE_URL")!;
const db = createClient(URL_, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, { auth: { persistSession: false } });
const CORS = { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Headers": "content-type, x-cron-secret", "Access-Control-Allow-Methods": "GET, POST, OPTIONS" };
const json = (b: unknown, s = 200, extra: Record<string, string> = {}) => new Response(JSON.stringify(b), { status: s, headers: { ...CORS, "Content-Type": "application/json", ...extra } });
const setting = async (k: string) => (await db.from("crm_private_settings").select("value").eq("key", k).maybeSingle()).data?.value || "";
const EVENTS = new Set(["view", "phone", "telegram", "form_open", "form_submit"]);
const cut = (v: unknown, n = 120) => (v == null ? null : String(v).slice(0, n));
const SITE = "https://pride-agency.com.ua";

async function stats() {
  const { data: units } = await db.from("nb_units").select("nb_source_id,price_m2,area,rooms,installment_months").eq("status", "free").not("nb_source_id", "is", null).limit(20000);
  const by: Record<string, any> = {};
  for (const u of units || []) {
    const k = String(u.nb_source_id); const s = by[k] ||= { m2: [], area: [], rooms: new Set<number>(), inst: 0, free: 0 };
    s.free++;
    const m = Number(u.price_m2); if (m > 100) s.m2.push(m);
    const a = Number(u.area); if (a > 5) s.area.push(a);
    if (u.rooms != null) s.rooms.add(Number(u.rooms));
    if (Number(u.installment_months) > s.inst) s.inst = Number(u.installment_months);
  }
  const out: Record<string, any> = {};
  for (const [k, s] of Object.entries(by)) {
    out[k] = { m2_min: s.m2.length ? Math.min(...s.m2) : null, m2_max: s.m2.length ? Math.max(...s.m2) : null,
      area_min: s.area.length ? Math.floor(Math.min(...s.area)) : null, area_max: s.area.length ? Math.ceil(Math.max(...s.area)) : null,
      rooms: [...s.rooms].sort((a, b) => a - b), inst: s.inst || null, has: s.free > 0 };
  }
  const { data: geo } = await db.from("site_complexes").select("slug,lat,lng,visible");
  return { stats: out, geo: Object.fromEntries((geo || []).map((g: any) => [g.slug, { lat: g.lat, lng: g.lng, visible: g.visible }])), lun: await lunList() };
}

// ЖК с ЛУН, которые уже есть у нас (данные берём из CRM, с ЛУН не дублируем)
const OURS = new Set(["lymanka-tairovski-sady", "odesa-city", "platinum-city", "fontanka-akvarel-10", "akvarel-7", "udobnyi", "starosinna-sq-1a", "odeski-tradytsii-na-hlushko", "ellada"]);
// Тип квартиры с ЛУН → число комнат (0 = студия)
const ROOM: Record<string, number> = { "Студії": 0, "Смарт-квартири": 0, "1-кімнатні": 1, "2-кімнатні": 2, "3-кімнатні": 3, "4-кімнатні": 4, "5-кімнатні": 5, "Багатокімнатні": 4, "Пентхауси": 4, "Дворівневі": 3 };
async function lunList() {
  const { data } = await db.from("site_lun_complexes").select("slug,name,district,developer,status,lat,lng,rate,rows,inst_months,props,photos").eq("visible", true).limit(1000);
  const res = [];
  for (const c of data || []) {
    const rows = (c.rows || []) as any[]; const rate = Number(c.rate) || 0;
    // продано / продаж не ведётся → не показываем; без цен на ЛУН → показываем «за запитом»
    if (OURS.has(c.slug) || /продано|не ведеться/i.test(c.status || "")) continue;
    const p = rate ? rows.flatMap((r) => [r.p1, r.p2]).filter((x) => x > 1000) : [], a = rows.flatMap((r) => [r.a1, r.a2]).filter((x) => x > 5);
    res.push({ slug: c.slug, name: c.name, district: c.district, dev: c.developer, klass: c.props?.["Клас"] || "", lat: c.lat, lng: c.lng,
      m2_min: p.length ? Math.round(Math.min(...p) / rate) : null, m2_max: p.length ? Math.round(Math.max(...p) / rate) : null,
      area_min: a.length ? Math.floor(Math.min(...a)) : null, area_max: a.length ? Math.ceil(Math.max(...a)) : null,
      rooms: [...new Set(rows.map((r) => ROOM[r.k]).filter((x) => x != null))].sort((x, y) => x - y), inst: c.inst_months || null, photo: (c.photos || [])[0] || null });
  }
  return res;
}
async function lunOne(slug: string) {
  const { data } = await db.from("site_lun_complexes").select("slug,address,props,photos,developer,status").eq("slug", slug).eq("visible", true).maybeSingle();
  return data || null;
}

async function geocode() {
  const list = await fetch(`${SITE}/site/content.json`).then((r) => r.json()).catch(async () => await fetch("https://crm-real-estate-qcco.vercel.app/site/content.json").then((r) => r.json()));
  const res = [];
  for (const c of list) {
    const ex = (await db.from("site_complexes").select("lat").eq("slug", c.slug).maybeSingle()).data;
    let lat = ex?.lat ?? null, lng: number | null = null;
    if (lat == null) {
      const q = encodeURIComponent(c.address + ", Україна");
      const r = await fetch(`https://nominatim.openstreetmap.org/search?format=json&limit=1&countrycodes=ua&q=${q}`, { headers: { "User-Agent": "pride-agency.com.ua site (contact via t.me/Pride_RealEstate)" } }).then((x) => x.json()).catch(() => []);
      if (r[0]) { lat = Number(r[0].lat); lng = Number(r[0].lon); }
      await new Promise((ok) => setTimeout(ok, 1100)); // правила Nominatim: не чаще 1 запроса в секунду
    }
    const row: any = { slug: c.slug, name: c.name, nb_source_id: c.nb, address: c.address, sort: c.sort, updated_at: new Date().toISOString() };
    if (lng != null) { row.lat = lat; row.lng = lng; }
    await db.from("site_complexes").upsert(row, { onConflict: "slug" });
    res.push({ slug: c.slug, lat, lng });
  }
  return res;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });
  const u = new URL(req.url);
  if (req.method === "GET" && u.searchParams.get("a") === "stats") return json(await stats(), 200, { "Cache-Control": "public, max-age=600" });
  if (req.method === "GET" && u.searchParams.get("a") === "lun") return json(await lunOne(String(u.searchParams.get("slug") || "")), 200, { "Cache-Control": "public, max-age=3600" });
  const b = await req.json().catch(() => null);
  if (!b) return json({ error: "bad request" }, 400);

  if (b.a === "event") {
    if (!EVENTS.has(String(b.event))) return json({ ok: false }, 400);
    await db.from("site_events").insert({ event: b.event, complex_slug: cut(b.slug, 60), page: cut(b.page, 200), device: cut(b.device, 20), lang: cut(b.lang, 5), ref: cut(b.ref, 200), utm: cut(b.utm, 200), sid: cut(b.sid, 40) });
    return json({ ok: true });
  }

  if (b.a === "lead") {
    if (b.website) return json({ ok: true }); // honeypot: бот
    const digits = String(b.phone || "").replace(/\D/g, "");
    if (digits.length < 9 || digits.length > 13) return json({ ok: false, error: "phone" }, 400);
    const name = String(b.name || "").trim().slice(0, 80);
    const complex = String(b.complex || "").trim().slice(0, 80);
    const text = `Заявка з сайту: ${complex ? (/^ЖК/i.test(complex) ? complex : `ЖК ${complex}`) : "загальна"}. Хоче отримати презентацію та прорахунки.\nІм'я: ${name || "—"}\nТелефон: ${b.phone}${b.note ? `\nКоментар: ${String(b.note).slice(0, 500)}` : ""}`;
    const r = await fetch(`${URL_}/functions/v1/lead-inbox`, { method: "POST", headers: { "Content-Type": "application/json", "x-inbox-key": await setting("lead_inbox_key") },
      body: JSON.stringify({ platform: "site", account: "pride-agency.com.ua", kind: "form", external_id: `site:${digits}:${Date.now()}`, from_id: digits.slice(-9), name, phone: String(b.phone), text, post_url: cut(b.page, 200), at: new Date().toISOString() }) })
      .then((x) => x.json()).catch(() => null);
    await db.from("site_events").insert({ event: "form_submit", complex_slug: cut(b.slug, 60), page: cut(b.page, 200), device: cut(b.device, 20), lang: cut(b.lang, 5), sid: cut(b.sid, 40) });
    return json({ ok: !!r?.ok });
  }

  if (b.a === "geocode") {
    if (req.headers.get("x-cron-secret") !== await setting("feed_sync_secret")) return json({ error: "forbidden" }, 403);
    return json({ ok: true, res: await geocode() });
  }
  return json({ error: "unknown" }, 400);
});
