// tiktok-screens-bot v4 (28.11.2026; v4: со скриншота — только имя, логин и сообщения клиента, служебное выбрасывается (extract.ts); дата по умолчанию — сегодня; v3: дата лида задним числом — в подписи «12.10» / «12.10.2025», в тексте «дата 12.10.2025») — Telegram-бот: менеджер присылает скриншот переписки / комментария TikTok
// (или текст) → бесплатное распознавание (Vercel /api/ocr, Tesseract) → если есть телефон или Telegram-@ник →
// лид в lead-inbox (platform "tiktok") → «Нераспределённые лиды». Без платного ИИ.
// Секреты: TIKTOK_BOT_TOKEN — Supabase → Edge Functions → Secrets (ставит владелец, в код и БД не попадает).
// crm_private_settings: tg_leads_webhook_secret — сверка заголовка X-Telegram-Bot-Api-Secret-Token;
//                       tg_leads_setup_key — разовый ключ для ?a=setup (удаляется после установки вебхука).
// Доступ: только сотрудники из users (поле telegram = @ник отправителя).
import { createClient } from "jsr:@supabase/supabase-js@2";
import { extract, type Line } from "./extract.ts";
const URL_ = Deno.env.get("SUPABASE_URL")!;
const db = createClient(URL_, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, { auth: { persistSession: false } });
const TOKEN = Deno.env.get("TIKTOK_BOT_TOKEN") || "";
const OCR_URL = "https://crm-real-estate-qcco.vercel.app/api/ocr";
const AG = 1;
const setting = async (k: string) => (await db.from("crm_private_settings").select("value").eq("key", k).maybeSingle()).data?.value || "";
const tg = (method: string, body: unknown) => fetch(`https://api.telegram.org/bot${TOKEN}/${method}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) }).then((r) => r.json()).catch(() => null);
const say = (chat: number, text: string, reply?: number) => tg("sendMessage", { chat_id: chat, text, parse_mode: "HTML", disable_web_page_preview: true, ...(reply ? { reply_parameters: { message_id: reply, allow_sending_without_reply: true } } : {}) });
const esc = (s: string) => s.replace(/[&<>]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" }[c]!));

// --- тот же фильтр, что в meta-webhook v4 ---
function phones(t: string) {
  const out: string[] = [];
  for (const raw of t.match(/(?:\+?\d[\d\s\-().]{8,17}\d)/g) || []) {
    let d = raw.replace(/\D/g, "");
    if (d.length === 10 && d.startsWith("0")) d = "38" + d;
    if (d.length === 12 && d.startsWith("380")) out.push("+" + d);
    else if (d.length >= 11 && d.length <= 13 && raw.trim().startsWith("+")) out.push("+" + d);
  }
  return [...new Set(out)];
}
function tgNick(t: string) {
  const re = /(^|[^\w.@])@([A-Za-z][A-Za-z0-9_]{4,31})(?![\w.@])/g; let m: RegExpExecArray | null;
  while ((m = re.exec(t))) return m[2];
  return null;
}
// OCR путает: O→0 в номерах, «l»→1 и т.п. Чиним только внутри похожих на номер кусков.
const fixOcr = (t: string) => t.replace(/(?<![\p{L}])[+\dOoОо][\dOoОоlI|\s\-().]{8,20}\d/gu, (s) => s.replace(/[OoОо]/g, "0").replace(/[lI|]/g, "1"));
// служебные строки скриншота (время, батарея, «Повідомлення», «Надіслати»…) — убираем из текста заявки
const JUNK = /^(\d{1,2}[:.]\d{2}.*|lte|4g|5g|wi-?fi|\d{1,3}%|повідомлення|сообщение|message|надіслати|отправить|send|активн.*|online|в мережі|в сети)$/i;
const clean = (t: string) => t.split("\n").map((s) => s.trim()).filter((s) => s.length > 1 && !JUNK.test(s)).join("\n").slice(0, 1500);

// дата лида задним числом. В подписи к скриншоту — просто «12.10» или «12.10.2025»; в обычном тексте — «дата 12.10.2025»
// (без слова «дата» цифры в тексте клиента не трогаем). Год не указан → текущий (если получилось будущее — прошлый).
const DATE_RE = /(?:^|[^\d.])(\d{1,2})[./](\d{1,2})(?:[./](\d{4}|\d{2}))?(?![\d.])/;
function pickDate(s: string, needWord: boolean): { date: string | null; rest: string } {
  const re = needWord ? new RegExp("дата[:\\s]*" + DATE_RE.source.replace("(?:^|[^\\d.])", ""), "i") : DATE_RE;
  const m = s.match(re); if (!m) return { date: null, rest: s };
  const today = new Date().toLocaleDateString("sv-SE", { timeZone: "Europe/Kiev" });
  const d = +m[1], mo = +m[2]; let y = m[3] ? +m[3] : +today.slice(0, 4); if (y < 100) y += 2000;
  if (d < 1 || d > 31 || mo < 1 || mo > 12) return { date: null, rest: s };
  let iso = `${y}-${String(mo).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
  if (!m[3] && iso > today) iso = `${y - 1}${iso.slice(4)}`;
  if (isNaN(Date.parse(iso)) || iso > today || iso < "2015-01-01") return { date: null, rest: s };
  return { date: iso, rest: s.replace(m[0], " ").trim() };
}
const ua = (iso: string) => iso.split("-").reverse().join(".");

async function ocr(fileId: string) {
  const f: any = await tg("getFile", { file_id: fileId });
  const path = f?.result?.file_path; if (!path) throw new Error("Telegram не отдал файл");
  const buf = new Uint8Array(await (await fetch(`https://api.telegram.org/file/bot${TOKEN}/${path}`)).arrayBuffer());
  let b = ""; for (let i = 0; i < buf.length; i += 0x8000) b += String.fromCharCode(...buf.subarray(i, i + 0x8000));
  const r = await fetch(OCR_URL, { method: "POST", headers: { "Content-Type": "application/json", "x-ocr-client": "pride-crm" }, body: JSON.stringify({ image: btoa(b) }) });
  const j: any = await r.json().catch(() => ({}));
  if (!j.ok) throw new Error(j.error || `OCR ${r.status}`);
  return { text: String(j.text || ""), lines: (Array.isArray(j.lines) ? j.lines : []) as Line[] };
}

Deno.serve(async (req) => {
  const u = new URL(req.url);
  // разовая установка вебхука: ?a=setup&key=<tg_leads_setup_key>
  if (req.method === "GET" && u.searchParams.get("a") === "setup") {
    const key = await setting("tg_leads_setup_key");
    if (!key || u.searchParams.get("key") !== key) return new Response("forbidden", { status: 403 });
    if (!TOKEN) return new Response("Нет секрета TIKTOK_BOT_TOKEN", { status: 400 });
    const secret = await setting("tg_leads_webhook_secret");
    const r = await tg("setWebhook", { url: `${URL_}/functions/v1/tiktok-screens-bot`, secret_token: secret, allowed_updates: ["message"], drop_pending_updates: true });
    const me: any = await tg("getMe", {});
    await tg("setMyCommands", { commands: [{ command: "start", description: "Як користуватися" }] });
    if (r?.ok) await db.from("crm_private_settings").delete().eq("key", "tg_leads_setup_key");
    return new Response(JSON.stringify({ webhook: r, bot: me?.result?.username }), { headers: { "Content-Type": "application/json" } });
  }
  if (req.method !== "POST") return new Response("ok");
  if (req.headers.get("x-telegram-bot-api-secret-token") !== await setting("tg_leads_webhook_secret")) return new Response("forbidden", { status: 403 });
  const up = await req.json().catch(() => ({}));
  const msg = up.message; if (!msg || msg.chat?.type !== "private") return new Response("ok");
  const chat = msg.chat.id, mid = msg.message_id;
  const uname = String(msg.from?.username || "").toLowerCase();

  // только сотрудники агентства
  const staff = ((await db.from("users").select("email,full_name,telegram").eq("agency_id", AG)).data || [])
    .find((x: any) => uname && String(x.telegram || "").trim().replace(/^https?:\/\/t\.me\//i, "").replace(/^@/, "").toLowerCase() === uname);
  if (!staff) { await say(chat, "Цей бот — для співробітників Pride. Додайте свій Telegram-нік у профіль CRM і напишіть ще раз.", mid); return new Response("ok"); }

  if (msg.text?.startsWith("/start")) {
    await say(chat, "Надішліть сюди <b>скриншот</b> переписки або коментаря з TikTok (можна кілька) — я знайду номер телефону чи Telegram-@нік і створю лід у CRM («Нераспределённые лиды», джерело «Тик-Ток»).\n\nБез номера чи @ніка лід не створюю. Можна надіслати й просто текст.\nУ підписі до скриншоту можна вказати акаунт TikTok, напр. <code>@pride_tt</code>.\n\n📅 <b>Старий лід?</b> Напишіть дату в підписі до скриншоту: <code>12.10</code> або <code>12.10.2025</code> (у тексті — <code>дата 12.10.2025</code>). Без дати — сьогоднішня.");
    return new Response("ok");
  }

  const photo = msg.photo?.length ? msg.photo[msg.photo.length - 1].file_id : (msg.document?.mime_type?.startsWith("image/") ? msg.document.file_id : null);
  // дату вырезаем из подписи/текста, чтобы её цифры не склеились с номером телефона
  const dt = pickDate(String(msg.text || msg.caption || ""), !photo);
  // @аккаунт TikTok из подписи — наш, а не ник клиента: из текста убираем
  const extraText = photo ? dt.rest.replace(/@[\w.]{3,40}/g, " ").trim() : dt.rest;
  let ex: ReturnType<typeof extract> | null = null, raw = "";
  if (photo) {
    try { const o = await ocr(photo); raw = o.text; if (o.lines.length) ex = extract(o.lines); }
    catch (e) { await say(chat, `⚠️ Не вдалося прочитати скриншот (${esc((e as Error).message)}). Спробуйте ще раз або надішліть текстом.`, mid); return new Response("ok"); }
  }
  // где искать телефон / Telegram-ник: сообщения клиента → всё, кроме наших ответов → (старый OCR) весь текст
  const msgText = ex ? fixOcr(ex.searchText) : "";
  const tries = ex ? [msgText + "\n" + extraText, fixOcr(ex.fallbackText) + "\n" + extraText] : [fixOcr(raw + "\n" + extraText)];
  let ph: string[] = [], nick: string | null = null;
  for (const t of tries) { ph = phones(t); nick = tgNick(t); if (ph.length || nick) break; }
  // текст заявки: только сообщения клиента (+ то, что дописали в подписи)
  const body = ex ? [msgText, extraText].filter(Boolean).join("\n").slice(0, 1500) : clean(fixOcr(raw + "\n" + extraText));
  if (!ph.length && !nick) {
    const seen = body.slice(0, 700);
    await say(chat, "Номера телефону чи Telegram-@ніка не знайшов — лід не створено." + (seen ? `\n\nЩо я прочитав:\n<code>${esc(seen)}</code>\n\nМожна надіслати скриншот ще раз із номером у підписі.` : ""), mid);
    return new Response("ok");
  }

  const caption = String(msg.caption || "").match(/@([\w.]{3,40})/)?.[1] || "";
  // имя — как подписан клиент в TikTok; нет имени (точка, эмодзи) — его логин; нет и логина — «Клієнт TikTok»
  const login = ex?.login || "";
  const nameLine = ex?.name || (login ? "@" + login : "Клієнт TikTok");
  // дата лида: из подписи, иначе сегодня (Киев)
  const today = new Date().toLocaleDateString("sv-SE", { timeZone: "Europe/Kiev" });
  const leadDate = dt.date || today;
  const item = { platform: "tiktok", account: caption || "TikTok (скриншот)", kind: "dm", external_id: `tgshot:${chat}:${mid}`,
    from_id: ph[0] ? ph[0].replace(/\D/g, "").slice(-9) : null, nick: login || (ph.length ? "" : nick), name: nameLine, phone: ph[0] || null,
    text: `${body}${nick && login ? `\nTelegram: @${nick}` : ""}\n— надіслав: ${staff.full_name || staff.email} (скриншот з TikTok)`,
    at: dt.date ? `${dt.date}T12:00:00+02:00` : new Date((msg.date || Date.now() / 1000) * 1000).toISOString(), lead_date: leadDate };
  const r = await fetch(`${URL_}/functions/v1/lead-inbox`, { method: "POST", headers: { "Content-Type": "application/json", "x-inbox-key": await setting("lead_inbox_key") }, body: JSON.stringify(item) }).then((x) => x.json()).catch(() => null);
  const res = r?.results?.[0] || {};
  const who = (nameLine ? nameLine + ", " : "") + (ph[0] || "@" + nick);
  const msgs: Record<string, string> = {
    inbox_new: `✅ Лід створено: <b>${esc(who)}</b>\nДжерело: Тик-Ток → «Нераспределённые лиды».`,
    inbox_appended: `➕ Цей клієнт уже чекає в «Нераспределённых» — дописав повідомлення до нього (<b>${esc(who)}</b>).`,
    appended: `➕ Клієнт <b>${esc(who)}</b> уже є в CRM — дописав повідомлення в його картку.`,
    created: `✅ Лід створено і відразу призначено менеджеру: <b>${esc(who)}</b>.`,
    repeat: "Цей скриншот уже оброблено.",
  };
  await say(chat, (msgs[res.result] || `⚠️ CRM відповіла: ${esc(res.result || "помилка")} ${esc(res.why || "")}`) + `\n📅 Дата ліда: ${ua(leadDate)}` + (body ? `\n💬 ${esc(body.split("\n").slice(0, 3).join(" / ").slice(0, 220))}` : "") + (ph.length > 1 ? `\nІнші номери на скриншоті: ${esc(ph.slice(1).join(", "))}` : ""), mid);
  return new Response("ok");
});
