// Новобудови: актуальное наличие для менеджера — без ожидания еженедельного обновления.
// Вызывается, когда менеджер открывает ЖК и перед созданием презентации.
// Экономно: не чаще раза в 10 минут на ЖК; скачивается только файл шахматки (обычно 50–300 КБ),
// и если его отпечаток не изменился — больше ничего не делается. Если изменился — запускается
// полное обновление nb-sync (площади, цены, статусы «продано/бронь» по цвету — только из шахматки).
import { createClient } from "jsr:@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
const CORS = { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type", "Access-Control-Allow-Methods": "POST, OPTIONS" };
const UA = { "User-Agent": "Mozilla/5.0 (compatible; CRMBot/1.0)" };
const json = (b: unknown, s = 200) => new Response(JSON.stringify(b), { status: s, headers: { ...CORS, "Content-Type": "application/json" } });
const db = createClient(SUPABASE_URL, SERVICE_KEY, { auth: { persistSession: false } });
const decode = (s: string) => s.replace(/&quot;/g, '"').replace(/&#39;|&#039;/g, "'").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&amp;/g, "&");

// те же правила поиска шахматки, что и в nb-sync
async function driveFolder(id: string) {
  const html = await (await fetch(`https://drive.google.com/embeddedfolderview?id=${id}`, { headers: UA })).text();
  const folders: { id: string; name: string }[] = [], files: { id: string; name: string; gsheet: boolean }[] = [];
  for (const b of html.split(/<div class="flip-entry"/).slice(1)) {
    const fid = (b.match(/id="entry-([A-Za-z0-9_-]+)"/) || [])[1]; const href = decode((b.match(/<a href="([^"]+)"/) || [])[1] || "");
    const name = decode(((b.match(/<div class="flip-entry-title">([\s\S]*?)<\/div>/) || [])[1] || "").replace(/<[^>]+>/g, "")).trim();
    if (!fid || !name) continue;
    if (/\/folders\//.test(href)) folders.push({ id: fid, name });
    else if (/docs\.google\.com\/spreadsheets/.test(href) || /\.(xlsx?|csv|ods)["'\s]*$/i.test(name)) files.push({ id: fid, name, gsheet: /docs\.google\.com\/spreadsheets/.test(href) });
  }
  return { folders, files };
}
function score(name: string) {
  const n = name.toLowerCase(); if (/довер|догов|заяв|анкет|акт\b|рахун|счет/.test(n)) return -1;
  if (/паркін|паркин|parking|комор|кладов/.test(n)) return 0; if (/калькул|расчет|розрах/.test(n)) return 1;
  return (/шахм|шахів/.test(n) ? 6 : 0) + (/прайс|price|наличи|наявн/.test(n) ? 5 : 0) + (/^буд(инок)?\.?\s*\d|^будинок|^дом\s*\d|секц/.test(n) ? 4 : 0)
    + (/список|квартир|сво?бодн|вільн/.test(n) ? 3 : 0) + (/акці|акци/.test(n) ? -2 : 0);
}
async function priceFiles(src: any) {
  const pinned = (Array.isArray(src.meta?.price_files) ? src.meta.price_files : []).map((x: any) => {
    const s = String(x.id || x); const id = (s.match(/(?:\/d\/|[?&]id=)([A-Za-z0-9_-]{20,})/) || [])[1] || (/^[A-Za-z0-9_-]{20,}$/.test(s) ? s : null);
    return id ? { id, gsheet: !!x.gsheet || /spreadsheets/.test(s) } : null; }).filter(Boolean);
  if (pinned.length) return pinned.slice(0, 8);
  const found: any[] = []; let level = [src.handle]; let budget = 25;
  for (let d = 0; d < 3 && level.length && budget > 0; d++) {
    const next: string[] = [];
    for (const id of level.slice(0, budget)) { budget--;
      try { const f = await driveFolder(id); f.files.forEach((x) => found.push({ ...x, s: score(x.name) }));
        f.folders.filter((x) => !/фото|відео|видео|рендер|візуал|визуал|план(ув|ир)|презент|документ|хід|ход/i.test(x.name)).forEach((x) => next.push(x.id)); } catch { /* */ } }
    level = next;
  }
  const ok = found.filter((x) => x.s >= 0).sort((a, b) => b.s - a.s); const strong = ok.filter((x) => x.s >= 4);
  return (strong.length ? strong.slice(0, 8) : ok.slice(0, 2)).map((x) => ({ id: x.id, gsheet: x.gsheet }));
}
async function fingerprint(files: { id: string; gsheet: boolean }[]) {
  const parts: Uint8Array[] = [];
  for (const f of files) {
    const url = f.gsheet ? `https://docs.google.com/spreadsheets/d/${f.id}/export?format=xlsx` : `https://drive.google.com/uc?export=download&id=${f.id}`;
    const r = await fetch(url, { headers: UA }); if (!r.ok) throw new Error("Файл шахматки недоступен");
    parts.push(new Uint8Array(await r.arrayBuffer()));
  }
  const all = new Uint8Array(parts.reduce((n, b) => n + b.length, 0)); let o = 0; for (const b of parts) { all.set(b, o); o += b.length; }
  // для Google Таблиц экспорт может каждый раз отличаться — тогда просто обновляемся полностью (не чаще раза в 10 минут)
  return { hash: Array.from(new Uint8Array(await crypto.subtle.digest("SHA-1", all))).map((x) => x.toString(16).padStart(2, "0")).join("").slice(0, 16), bytes: all.length };
}
const setFresh = (id: number, val: unknown) => db.rpc("nb_fresh_set", { p_id: id, p_val: val });

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });
  const auth = req.headers.get("Authorization") || ""; if (!auth.startsWith("Bearer ")) return json({ error: "Нужен вход в CRM" }, 401);
  const user = createClient(SUPABASE_URL, ANON_KEY, { global: { headers: { Authorization: auth } }, auth: { persistSession: false } });
  const [{ data: isTech }, { data: agencyId }] = await Promise.all([user.rpc("crm_is_tech"), user.rpc("crm_agency_id")]);
  if (!isTech && !agencyId) return json({ error: "Нужен вход в CRM" }, 401);
  let body: any = {}; try { body = await req.json(); } catch { /* */ }
  const { data: src } = await db.from("nb_sources").select("id,agency_id,kind,handle,meta").eq("id", Number(body.source_id)).maybeSingle();
  if (!src || (!isTech && src.agency_id !== agencyId)) return json({ ok: false, error: "ЖК не найден" });
  if (src.kind !== "gdrive" || src.meta?.price_mode === "upload") return json({ ok: true, skipped: "file" });
  const f = src.meta?.fresh || {}; const now = Date.now();
  if (now - (Date.parse(f.checked || 0) || 0) < 10 * 60e3) return json({ ok: true, skipped: "recent", checked: f.checked });
  const checked = new Date(now).toISOString();
  await setFresh(src.id, { ...f, checked }); // сразу — чтобы несколько менеджеров не скачивали одновременно
  try {
    // список файлов шахматки ищем раз в сутки, в остальное время — только скачиваем известные
    const files = f.files?.length && now - (Date.parse(f.files_at || 0) || 0) < 864e5 ? f.files : await priceFiles(src);
    const files_at = files === f.files ? f.files_at : checked;
    if (!files.length) return json({ ok: true, skipped: "no-file" });
    const { hash, bytes } = await fingerprint(files);
    if (hash === f.hash) { await setFresh(src.id, { ...f, checked, files, files_at }); return json({ ok: true, changed: false, bytes }); }
    const { data: s } = await db.from("crm_private_settings").select("value").eq("key", "feed_sync_secret").maybeSingle();
    const r = await fetch(`${SUPABASE_URL}/functions/v1/nb-sync`, { method: "POST", headers: { "Content-Type": "application/json", "x-cron-secret": s?.value || "" }, body: JSON.stringify({ source_id: src.id }) });
    const sync = await r.json().catch(() => ({}));
    await setFresh(src.id, { checked, files, files_at, hash: sync?.ok && !sync?.error ? hash : null });
    return json({ ok: true, changed: true, bytes, sync: { free: sync?.free, sold: sync?.sold, changed: sync?.changed, error: sync?.error || null } });
  } catch (e) { return json({ ok: false, error: (e as Error).message }); }
});
