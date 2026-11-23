// lead-inbox v2 (23.11.2026) — входящие из соцсетей → «Нераспределённые лиды» → лид менеджеру.
// Кто шлёт: Make (Instagram / Facebook / TikTok, несколько аккаунтов) и telegram-private (личка и комментарии каналов).
// Приём: заголовок x-inbox-key (или ?key=) = crm_private_settings.lead_inbox_key.
//   Тело: { platform, account, kind: "dm"|"comment", external_id, from_id?, nick?, name?, phone?, text, post_url?, at? } или массив.
// Правила приёма:
//  • берём, если есть телефон ИЛИ ник; весь текст клиента сохраняется (блок «Запрос (площадка · где · когда): текст»);
//  • повтор того же сообщения (external_id) не обрабатывается; свои ответы и только-эмодзи — пропуск; всё — в журнал lead_inbox;
//  • клиент уже отдан менеджеру (маркер [inbox:…] в заметке лида) → сообщение дописывается в его карточку;
//  • клиент ждёт в «Нераспределённых» (тот же ник или телефон) → дописывается туда же;
//  • иначе — новая строка в inbox_leads (status new); если телефон уже есть у клиента CRM — помечается existing_lead_id;
//  • у аккаунта задан менеджер (lead_inbox_accounts.manager_email) → лид сразу ему, минуя «Нераспределённые».
// Действия администратора (вход в CRM, директор / тех. отдел): { action: "assign", id, manager_email } | { action: "reject", id }.
//   assign создаёт лид «Новый Лид» на менеджера со всем текстом клиента; карточки существующих клиентов не меняются
//   (новый лид связывается с ними через lead_duplicates, status added).
import { createClient } from "jsr:@supabase/supabase-js@2";
const URL_ = Deno.env.get("SUPABASE_URL")!;
const db = createClient(URL_, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, { auth: { persistSession: false } });
const CORS = { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-inbox-key", "Access-Control-Allow-Methods": "POST, OPTIONS" };
const json = (b: unknown, s = 200) => new Response(JSON.stringify(b), { status: s, headers: { ...CORS, "Content-Type": "application/json" } });
const AG = 1;
const PL: Record<string, { label: string; src: string }> = {
  instagram: { label: "Инстаграм", src: "Инстаграм рабочий" },
  facebook: { label: "Фейсбук", src: "Фейсбук рабочий" },
  tiktok: { label: "Тик-Ток", src: "Тик-Ток рабочий" },
  telegram: { label: "Телеграм", src: "Телеграмм-канал рабочий" },
};

// телефон из текста: +380…, 380…, 0XX…, а также иностранный +XX… (10–13 цифр)
function phoneOf(t: string) {
  const m = t.match(/(?:\+?\d[\d\s\-()]{8,17}\d)/g) || [];
  for (const raw of m) {
    let d = raw.replace(/\D/g, "");
    if (d.length === 10 && d.startsWith("0")) d = "38" + d;
    if (d.length === 12 && d.startsWith("380")) return `+380 ${d.slice(3, 5)} ${d.slice(5, 8)} ${d.slice(8, 10)} ${d.slice(10)}`;
    if (d.length >= 11 && d.length <= 13 && raw.trim().startsWith("+")) return "+" + d;
  }
  return null;
}
const last9 = (p?: string | null) => String(p || "").replace(/\D/g, "").slice(-9);
const when = (iso?: string) => new Date(iso || Date.now()).toLocaleString("uk-UA", { timeZone: "Europe/Kiev", day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" });
const esc = (s: string) => s.replace(/[_%]/g, "\\$&");

// Отдать обращение менеджеру: новый лид со всем текстом клиента
async function assign(id: number, email: string, by: string) {
  const { data: r } = await db.from("inbox_leads").select("*").eq("id", id).eq("agency_id", AG).maybeSingle();
  if (!r) return { ok: false, error: "Обращение не найдено" };
  if (r.status !== "new") return { ok: false, error: r.status === "assigned" ? "Уже отдано менеджеру" : "Обращение отклонено" };
  const { data: u } = await db.from("users").select("id,full_name,email").eq("agency_id", AG).eq("email", email).maybeSingle();
  if (!u) return { ok: false, error: "Менеджер не найден" };
  const notes = `Ответственный менеджер: ${u.full_name || u.email}\n${r.messages}\n${r.nick ? `Ник: @${r.nick}\n` : ""}${r.who_key}`;
  const { data: nl, error } = await db.from("leads").insert({ agency_id: AG, name: r.name || (r.nick ? `@${r.nick}` : "Без имени"), phone: r.phone, source: r.source, stage: "Новый Лид", notes,
    manager_id: u.id, manager_name: u.full_name || null, manager_email: u.email, created_at: new Date().toISOString() }).select("id").maybeSingle();
  if (error || !nl) return { ok: false, error: error?.message || "Лид не создан" };
  if (r.existing_lead_id) await db.from("lead_duplicates").insert({ agency_id: AG, lead_id: nl.id, duplicate_of: r.existing_lead_id, status: "added", uploaded_by: "Входящие соцсети", decided_by: by, decided_at: new Date().toISOString() });
  await db.from("inbox_leads").update({ status: "assigned", lead_id: nl.id, assigned_to: u.email, assigned_by: by, decided_at: new Date().toISOString() }).eq("id", id);
  return { ok: true, lead_id: nl.id, manager: u.full_name || u.email };
}

async function handle(m: any, accs: Map<string, any>) {
  const platform = String(m.platform || "").toLowerCase(); const P = PL[platform]; if (!P) return { result: "skipped", why: "площадка" };
  const account = String(m.account || "").trim().replace(/^@/, "");
  const nick = String(m.nick || "").trim().replace(/^@/, ""); const text = String(m.text || "").trim();
  const ext = String(m.external_id || `${platform}:${m.from_id || nick}:${m.at || ""}:${text.slice(0, 40)}`);
  const ins = await db.from("lead_inbox").insert({ agency_id: AG, platform, account, kind: m.kind || "dm", external_id: ext, from_id: m.from_id ? String(m.from_id) : null, nick: nick || null, name: m.name || null, text, post_url: m.post_url || null, payload: m }).select("id").maybeSingle();
  if (ins.error) return { result: "repeat" }; // уже обрабатывали (уникальный external_id)
  const fin = async (r: any) => { await db.from("lead_inbox").update({ lead_id: r.lead_id ?? null, result: r.result, phone: r.phone ?? null }).eq("id", ins.data!.id); return r; };

  if (nick && account && nick.toLowerCase() === account.toLowerCase()) return fin({ result: "skipped", why: "свой ответ" });
  if (!/[\p{L}\d]/u.test(text)) return fin({ result: "skipped", why: "пусто/эмодзи" });
  const phone = phoneOf(text) || (m.phone ? phoneOf(String(m.phone)) : null);
  const who = nick || (m.from_id ? `id${m.from_id}` : "");
  if (!phone && !who) return fin({ result: "skipped", why: "нет телефона и ника" });

  // аккаунт → источник и (необязательно) менеджер; новый аккаунт добавляется сам
  const ak = `${platform}|${account.toLowerCase()}`; let acc = accs.get(ak);
  if (!acc) { acc = (await db.from("lead_inbox_accounts").upsert({ agency_id: AG, platform, account: account || "-", source: P.src }, { onConflict: "agency_id,platform,account" }).select("*").maybeSingle()).data || { source: P.src }; accs.set(ak, acc); }

  const marker = `[inbox:${platform}:${who.toLowerCase()}]`;
  const where = m.kind === "comment" ? `комментарий${m.post_url ? ` под постом ${m.post_url}` : " под постом"}` : "личные сообщения";
  const block = `Запрос (${P.label}${account ? ` @${account}` : ""} · ${where} · ${when(m.at)}):\n${text}`;

  // 1) уже отдан менеджеру → дописываем в карточку
  let lead: any = who ? (await db.from("leads").select("id,notes,phone").eq("agency_id", AG).ilike("notes", `%${esc(marker)}%`).order("id", { ascending: false }).limit(1).maybeSingle()).data : null;
  let byPhone: any = null;
  if (phone) byPhone = (await db.rpc("lead_find_by_phone", { p_agency: AG, p_last9: last9(phone) })).data?.[0] || null;
  if (!lead && byPhone && String(byPhone.notes || "").includes("[inbox:")) lead = byPhone;
  if (lead) {
    const notes = `${lead.notes}\n\n${block}${String(lead.notes).includes(marker) ? "" : `\n${nick ? `Ник: @${nick}\n` : ""}${marker}`}`;
    await db.from("leads").update({ notes, ...(phone && !lead.phone ? { phone } : {}), updated_at: new Date().toISOString() }).eq("id", lead.id);
    return fin({ result: "appended", lead_id: lead.id, phone });
  }
  // 2) ждёт в «Нераспределённых» → дописываем туда
  let open: any = (await db.from("inbox_leads").select("*").eq("agency_id", AG).eq("status", "new").eq("who_key", marker).limit(1).maybeSingle()).data;
  if (!open && phone) open = ((await db.from("inbox_leads").select("*").eq("agency_id", AG).eq("status", "new").not("phone", "is", null).order("id", { ascending: false }).limit(200)).data || []).find((x: any) => last9(x.phone) === last9(phone)) || null;
  if (open) {
    await db.from("inbox_leads").update({ messages: `${open.messages}\n\n${block}`, msg_count: (open.msg_count || 1) + 1, last_at: new Date().toISOString(), ...(phone && !open.phone ? { phone } : {}),
      ...(!open.existing_lead_id && byPhone ? { existing_lead_id: byPhone.id } : {}), ...(!open.name && m.name ? { name: m.name } : {}) }).eq("id", open.id);
    return fin({ result: "inbox_appended", phone });
  }
  // 3) новое обращение
  const { data: row } = await db.from("inbox_leads").insert({ agency_id: AG, platform, account, source: acc.source, who_key: marker, nick: nick || null, name: String(m.name || "").trim() || null, phone,
    messages: block, existing_lead_id: byPhone?.id ?? null }).select("id").maybeSingle();
  if (acc.manager_email && row) { const a = await assign(row.id, acc.manager_email, "авто: аккаунт " + (account || platform)); if (a.ok) return fin({ result: "created", lead_id: a.lead_id, phone }); }
  return fin({ result: "inbox_new", phone });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });
  const b = await req.json().catch(() => null); if (!b) return json({ error: "нужен JSON" }, 400);

  // администратор из CRM: отдать / отклонить
  if (b.action === "assign" || b.action === "reject") {
    const auth = req.headers.get("Authorization") || "";
    const user = createClient(URL_, Deno.env.get("SUPABASE_ANON_KEY")!, { global: { headers: { Authorization: auth } }, auth: { persistSession: false } });
    const [{ data: isTech }, { data: isDir }, { data: me }] = await Promise.all([user.rpc("crm_is_tech"), user.rpc("crm_is_director"), user.rpc("crm_my_email")]);
    if (!me || (!isTech && !isDir)) return json({ ok: false, error: "Только для директора и тех. отдела" }, 403);
    if (b.action === "assign") return json(await assign(Number(b.id), String(b.manager_email || ""), String(me)));
    const { error } = await db.from("inbox_leads").update({ status: "rejected", assigned_by: String(me), decided_at: new Date().toISOString() }).eq("id", Number(b.id)).eq("status", "new");
    return json({ ok: !error, error: error?.message });
  }

  const key = (await db.from("crm_private_settings").select("value").eq("key", "lead_inbox_key").maybeSingle()).data?.value;
  const got = req.headers.get("x-inbox-key") || new URL(req.url).searchParams.get("key");
  if (!key || got !== key) return json({ error: "forbidden" }, 403);
  const list = Array.isArray(b) ? b : Array.isArray(b.items) ? b.items : [b];
  const accs = new Map(((await db.from("lead_inbox_accounts").select("*").eq("agency_id", AG)).data || []).map((a: any) => [`${a.platform}|${String(a.account).toLowerCase()}`, a]));
  const out = []; for (const m of list.slice(0, 100)) out.push(await handle(m, accs).catch((e) => ({ result: "error", why: (e as Error).message })));
  return json({ ok: true, results: out });
});
