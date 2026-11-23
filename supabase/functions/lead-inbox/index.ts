// lead-inbox v1 (23.11.2026) — входящие из соцсетей → лиды CRM.
// Кто шлёт: Make (Instagram / Facebook / TikTok, несколько аккаунтов) и telegram-private (личка и комментарии канала).
// Доступ: заголовок x-inbox-key (или ?key=) = crm_private_settings.lead_inbox_key.
// Тело: { platform, account, kind: "dm"|"comment", external_id, from_id?, nick?, name?, text, post_url?, at? } или массив таких.
// Правила:
//  • лид создаётся, если есть телефон ИЛИ ник; весь текст сообщения клиента — в «запрос» (notes);
//  • повтор того же сообщения (external_id) не обрабатывается дважды;
//  • тот же клиент (телефон или ник) уже пришёл из входящих → сообщение дописывается в его карточку, телефон — если не было;
//  • клиент уже есть в CRM с другого канала → карточка НЕ меняется, сообщение уходит администратору в «Дубли на проверку»;
//  • свои ответы аккаунта, пустые и только-эмодзи сообщения пропускаются. Всё пишется в журнал lead_inbox.
import { createClient } from "jsr:@supabase/supabase-js@2";
const db = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, { auth: { persistSession: false } });
const json = (b: unknown, s = 200) => new Response(JSON.stringify(b), { status: s, headers: { "Content-Type": "application/json" } });
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
const when = (iso?: string) => new Date(iso || Date.now()).toLocaleString("uk-UA", { timeZone: "Europe/Kiev", day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" });

async function handle(m: any, accs: Map<string, any>, owner: any) {
  const platform = String(m.platform || "").toLowerCase(); const P = PL[platform]; if (!P) return { result: "skipped", why: "площадка" };
  const account = String(m.account || "").trim().replace(/^@/, "");
  const nick = String(m.nick || "").trim().replace(/^@/, ""); const text = String(m.text || "").trim();
  const ext = String(m.external_id || `${platform}:${m.from_id || nick}:${m.at || ""}:${text.slice(0, 40)}`);
  const log = { agency_id: AG, platform, account, kind: m.kind || "dm", external_id: ext, from_id: m.from_id ? String(m.from_id) : null, nick: nick || null, name: m.name || null, text, post_url: m.post_url || null, payload: m };
  const ins = await db.from("lead_inbox").insert(log).select("id").maybeSingle();
  if (ins.error) return { result: "repeat" }; // уже обрабатывали (уникальный external_id)
  const fin = async (r: any) => { await db.from("lead_inbox").update({ lead_id: r.lead_id ?? null, result: r.result, phone: r.phone ?? null }).eq("id", ins.data!.id); return r; };

  if (nick && account && nick.toLowerCase() === account.toLowerCase()) return fin({ result: "skipped", why: "свой ответ" });
  if (!/[\p{L}\d]/u.test(text)) return fin({ result: "skipped", why: "пусто/эмодзи" });
  const phone = phoneOf(text) || (m.phone ? phoneOf(String(m.phone)) : null);
  const who = nick || (m.from_id ? `id${m.from_id}` : "");
  if (!phone && !who) return fin({ result: "skipped", why: "нет телефона и ника" });

  // аккаунт → источник и ответственный (новый аккаунт добавляется сам, с источником «… рабочий»)
  const ak = `${platform}|${account.toLowerCase()}`; let acc = accs.get(ak);
  if (!acc) { acc = (await db.from("lead_inbox_accounts").upsert({ agency_id: AG, platform, account: account || "-", source: P.src }, { onConflict: "agency_id,platform,account" }).select("*").maybeSingle()).data || { source: P.src }; accs.set(ak, acc); }
  let mgr = owner;
  if (acc.manager_email) { const u = (await db.from("users").select("id,full_name,email").eq("email", acc.manager_email).maybeSingle()).data; if (u) mgr = u; }

  const marker = `[inbox:${platform}:${who.toLowerCase()}]`;
  const where = m.kind === "comment" ? `комментарий${m.post_url ? ` под постом ${m.post_url}` : " под постом"}` : "личные сообщения";
  const head = `${P.label}${account ? ` @${account}` : ""} · ${where} · ${when(m.at)}`;
  const block = `Запрос (${head}):\n${text}`;

  // ищем клиента: по телефону, затем по нику из входящих
  let lead: any = null;
  if (phone) lead = (await db.rpc("lead_find_by_phone", { p_agency: AG, p_last9: phone.replace(/\D/g, "").slice(-9) })).data?.[0] || null;
  if (!lead && who) lead = (await db.from("leads").select("id,notes,phone,stage,manager_email").eq("agency_id", AG).ilike("notes", `%${marker.replace(/[_%]/g, "\\$&")}%`).order("id", { ascending: false }).limit(1).maybeSingle()).data;

  if (lead && String(lead.notes || "").includes("[inbox:")) {
    const notes = `${lead.notes}\n\n${block}${String(lead.notes).includes(marker) ? "" : `\n${nick ? `Ник: @${nick}\n` : ""}${marker}`}`;
    await db.from("leads").update({ notes, ...(phone && !lead.phone ? { phone } : {}), updated_at: new Date().toISOString() }).eq("id", lead.id);
    return fin({ result: "appended", lead_id: lead.id, phone });
  }
  if (lead) {
    // клиент уже в CRM — карточку не трогаем, администратор решает в «Дубли на проверку»
    const prev = (await db.from("lead_duplicates").select("id,payload").eq("duplicate_of", lead.id).eq("status", "pending").order("id", { ascending: false }).limit(1).maybeSingle()).data;
    if (prev) await db.from("lead_duplicates").update({ payload: { ...prev.payload, notes: `${prev.payload?.notes || ""}\n\n${block}` } }).eq("id", prev.id);
    else await db.from("lead_duplicates").insert({ agency_id: AG, duplicate_of: lead.id, status: "pending", uploaded_by: "Входящие соцсети", payload: { name: m.name || (nick ? `@${nick}` : "Без имени"), phone, source: acc.source, notes: `${block}\n${nick ? `Ник: @${nick}\n` : ""}${marker}`, manager_email: mgr?.email, manager_name: mgr?.full_name, stage: null } });
    return fin({ result: "existing_client", lead_id: lead.id, phone });
  }
  const notes = `Ответственный менеджер: ${mgr?.full_name || mgr?.email || "—"}\n${block}\n${nick ? `Ник: @${nick}\n` : ""}${marker}`;
  const { data: nl, error } = await db.from("leads").insert({ agency_id: AG, name: String(m.name || "").trim() || (nick ? `@${nick}` : "Без имени"), phone, source: acc.source, stage: "Новый Лид", notes,
    manager_id: mgr?.id ?? null, manager_name: mgr?.full_name || null, manager_email: mgr?.email || null, created_at: new Date().toISOString() }).select("id").maybeSingle();
  if (error) return fin({ result: "error", why: error.message });
  return fin({ result: "created", lead_id: nl?.id, phone });
}

Deno.serve(async (req) => {
  const key = (await db.from("crm_private_settings").select("value").eq("key", "lead_inbox_key").maybeSingle()).data?.value;
  const got = req.headers.get("x-inbox-key") || new URL(req.url).searchParams.get("key");
  if (!key || got !== key) return json({ error: "forbidden" }, 403);
  const b = await req.json().catch(() => null); if (!b) return json({ error: "нужен JSON" }, 400);
  const list = Array.isArray(b) ? b : Array.isArray(b.items) ? b.items : [b];
  const accs = new Map(((await db.from("lead_inbox_accounts").select("*").eq("agency_id", AG)).data || []).map((a: any) => [`${a.platform}|${String(a.account).toLowerCase()}`, a]));
  const defMail = (await db.from("crm_private_settings").select("value").eq("key", "lead_inbox_default_manager").maybeSingle()).data?.value;
  const owner = (await db.from("users").select("id,full_name,email").eq("agency_id", AG).eq(defMail ? "email" : "role", defMail || "Администратор тех отдел").limit(1).maybeSingle()).data;
  const out = []; for (const m of list.slice(0, 100)) out.push(await handle(m, accs, owner).catch((e) => ({ result: "error", why: (e as Error).message })));
  return json({ ok: true, results: out });
});
