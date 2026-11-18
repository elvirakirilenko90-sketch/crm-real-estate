// Публичная подборка объектов для клиента: открывается по ссылке /?sel=<токен>, без входа в CRM.
// Вид — клиентская версия раздела «Аналитика»: та же карточка объекта (ListingCard), шрифты и стили CRM,
// без внутренних инструментов. Данные — только из безопасного ответа функции selection-public
// (в нём нет ссылок и названий площадок; фото чужих сайтов идут через нашу функцию).
import React, { useEffect, useRef, useState } from "react";
import { SUPABASE_URL, SUPABASE_KEY } from "./supabaseClient";
import ListingCard from "./ListingCard.jsx";

const API = `${SUPABASE_URL}/functions/v1/selection-public`;
const call = (body) => fetch(API, { method: "POST", headers: { "content-type": "application/json", apikey: SUPABASE_KEY }, body: JSON.stringify(body) }).then(r => r.json());
const money = (v, c = "USD") => v == null ? "" : `${c === "UAH" ? "₴" : c === "EUR" ? "€" : "$"}${Math.round(Number(v)).toLocaleString("uk-UA")}`;
const digits = p => String(p || "").replace(/[^\d+]/g, "");

// ===== Новобудови: таблица оплаты и планировка квартиры =====
const Y = { head: "#F5C518", ink: "#1a1405", row: "#FFF7D1", row2: "#FFFBEA", line: "#EED37A", deep: "#7A5A00" };
const usd = v => v == null ? "—" : `$${Math.round(Number(v)).toLocaleString("uk-UA")}`;
const termOf = r => r.until ? `до ${r.until.slice(5, 7)}.${r.until.slice(0, 4)}` : r.months ? `${r.months} міс.` : "—";
const varName = r => [r.pct ? `ПВ ${r.pct}%` : null, r.months || r.until ? termOf(r) : null, r.rate ? `${r.rate}% річних` : null].filter(Boolean).join(" · ") || "Розстрочка";

export function PaymentTable({ p }) {
  const rows = (p?.rows || []).filter(Boolean);
  if (!rows.length && p?.full == null) return null;
  const cell = { padding: "12px 14px", borderBottom: `1px solid ${Y.line}`, fontVariantNumeric: "tabular-nums" };
  const big = { fontSize: rows.length >= 3 ? 19 : rows.length === 2 ? 18 : 22, fontWeight: 900, color: Y.ink, lineHeight: 1.15, whiteSpace: "nowrap" };
  const small = { display: "block", fontSize: 12, fontWeight: 700, color: Y.deep, marginTop: 2 };
  const params = [
    ["Перший внесок", r => <><span style={big}>{usd(r.first)}</span>{r.pct ? <span style={small}>{r.pct}% від вартості</span> : null}
      {r.disc ? <span style={{ ...small, color: "#0F7B3F" }}>знижка {r.disc_pct ? `${r.disc_pct}% ` : ""}−{usd(r.disc)}</span> : null}</>],
    ["Щомісячний платіж", r => r.monthly != null ? <><span style={big}>{usd(r.monthly)}</span><span style={small}>× {r.months} міс.</span></> : <span style={big}>—</span>],
    ["Термін розстрочки", r => <span style={{ ...big, fontSize: Math.min(big.fontSize, 18), whiteSpace: "normal" }}>{termOf(r)}</span>],
    ["Загальна вартість", r => <span style={big}>{usd(r.total)}</span>],
  ];
  return <section className="payBox" style={{ margin: "4px 0 16px" }}>
    <div style={{ display: "flex", alignItems: "center", gap: 10, margin: "0 0 10px" }}>
      <span style={{ width: 34, height: 34, borderRadius: 12, background: Y.head, display: "grid", placeItems: "center", fontSize: 18 }}>💳</span>
      <b style={{ fontSize: 19 }}>{rows.length > 1 ? "Варіанти оплати" : rows.length ? "Умови оплати" : "Оплата"}</b>
    </div>
    {rows.length > 0 && <div style={{ borderRadius: 18, overflow: "hidden", border: `1.5px solid ${Y.line}`, boxShadow: "0 8px 24px rgba(212,160,23,.18)" }}>
      {rows.length <= 2 ? <table style={{ width: "100%", borderCollapse: "collapse", background: Y.row, tableLayout: "fixed" }}>
        {rows.length > 1 && <thead><tr style={{ background: Y.head }}>
          <th style={{ ...cell, width: "34%", borderBottom: 0 }} />
          {rows.map((r, i) => <th key={i} style={{ ...cell, borderBottom: 0, textAlign: "left", color: Y.ink }}>
            <span style={{ display: "block", fontSize: 11, fontWeight: 900, letterSpacing: 1, opacity: .7 }}>ВАРІАНТ {i + 1}</span>
            <span style={{ fontSize: 14, fontWeight: 900 }}>{varName(r)}</span></th>)}
        </tr></thead>}
        <tbody>{params.map(([label, f], k) => <tr key={label} style={{ background: k % 2 ? Y.row2 : Y.row }}>
          <td style={{ ...cell, fontSize: 13, fontWeight: 800, color: Y.deep, ...(rows.length === 1 ? { width: "46%" } : {}) }}>{label}</td>
          {rows.map((r, i) => <td key={i} style={{ ...cell, borderLeft: `1px solid ${Y.line}` }}>{f(r)}</td>)}
        </tr>)}</tbody>
      </table>
      // 3 и больше вариантов — карточкой на каждый вариант, чтобы цифры не теснились на телефоне
      : rows.map((r, i) => <div key={i} style={{ background: i % 2 ? Y.row2 : Y.row, borderTop: i ? `2px solid ${Y.line}` : 0 }}>
        <div style={{ background: Y.head, padding: "9px 14px", display: "flex", gap: 10, alignItems: "baseline", color: Y.ink }}>
          <span style={{ fontSize: 11, fontWeight: 900, letterSpacing: 1, opacity: .7 }}>ВАРІАНТ {i + 1}</span><b style={{ fontSize: 15 }}>{varName(r)}</b></div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr" }}>
          {params.filter(([label]) => label !== "Термін розстрочки").map(([label, f], k) => <div key={label} style={{ padding: "10px 14px", borderTop: k > 1 ? `1px solid ${Y.line}` : 0, borderLeft: k % 2 ? `1px solid ${Y.line}` : 0 }}>
            <span style={{ display: "block", fontSize: 11, fontWeight: 800, color: Y.deep, marginBottom: 2 }}>{label}</span>{f(r)}</div>)}
        </div></div>)}
    </div>}
    {p.full != null && <div style={{ marginTop: 10, display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10, padding: "14px 16px", borderRadius: 16, background: "#111", color: "#fff" }}>
      <span style={{ fontWeight: 800 }}>Повна оплата 100%{p.full_disc ? <span style={{ display: "block", color: Y.head, fontSize: 12 }}>знижка {p.full_disc}%</span> : null}</span>
      <b style={{ fontSize: 22, color: Y.head, fontVariantNumeric: "tabular-nums" }}>{usd(p.full)}</b></div>}
  </section>;
}

// Квартира, вырезанная из плана этажа по контуру (как на сайте застройщика), и та же квартира на плане этажа
export function FlatPlan({ p }) {
  const [view, setView] = useState("flat");
  if (!p?.img || !p.d || !Array.isArray(p.box)) return null;
  const W = p.w || 3819, H = p.h || 3819, [bx, by, bw, bh] = p.box, pad = Math.max(bw, bh) * .06;
  const id = "fp" + Math.abs([...p.d].reduce((a, c) => (a * 31 + c.charCodeAt(0)) | 0, 7)).toString(36);
  const tab = on => ({ flex: 1, border: 0, borderRadius: 999, padding: "9px 10px", fontWeight: 900, fontSize: 13, cursor: "pointer", background: on ? "#111" : "transparent", color: on ? "#fff" : "#3f3f46" });
  return <section style={{ margin: "4px 0 16px" }}>
    <div style={{ display: "flex", alignItems: "center", gap: 10, margin: "0 0 10px" }}>
      <span style={{ width: 34, height: 34, borderRadius: 12, background: "#111", color: Y.head, display: "grid", placeItems: "center", fontSize: 17 }}>📐</span>
      <b style={{ fontSize: 19, flex: 1 }}>Планування квартири</b>
    </div>
    <div style={{ display: "flex", gap: 4, padding: 4, borderRadius: 999, background: "#f4f4f5", marginBottom: 10 }}>
      <button type="button" style={tab(view === "flat")} onClick={() => setView("flat")}>Квартира</button>
      <button type="button" style={tab(view === "floor")} onClick={() => setView("floor")}>Розташування на поверсі</button>
    </div>
    <div style={{ borderRadius: 20, background: "#fff", border: "1px solid #e4e4e7", padding: 10, boxShadow: "0 10px 30px rgba(0,0,0,.06)" }}>
      {view === "flat"
        ? <svg viewBox={`${bx - pad} ${by - pad} ${bw + pad * 2} ${bh + pad * 2}`} style={{ width: "100%", height: "auto", maxHeight: "70vh", display: "block" }} role="img" aria-label="Планування квартири">
            <defs><clipPath id={id}><path d={p.d} /></clipPath></defs>
            <image href={p.img} x="0" y="0" width={W} height={H} clipPath={`url(#${id})`} preserveAspectRatio="none" />
            <path d={p.d} fill="none" stroke={Y.head} strokeWidth={Math.max(bw, bh) * .012} strokeLinejoin="round" />
          </svg>
        : <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", height: "auto", display: "block" }} role="img" aria-label="Квартира на плані поверху">
            <image href={p.img} x="0" y="0" width={W} height={H} preserveAspectRatio="none" />
            <path d={p.d} fill="rgba(245,197,24,.38)" stroke={Y.head} strokeWidth={W * .006} strokeLinejoin="round" />
          </svg>}
    </div>
  </section>;
}

function Item({ x, token, onSeen, index, total, onNav }) {
  const ref = useRef(null); const [state, setState] = useState(""); const [note, setNote] = useState(""); const [sent, setSent] = useState(false);
  useEffect(() => { const el = ref.current; if (!el || !("IntersectionObserver" in window)) return; const o = new IntersectionObserver(es => { if (es.some(e => e.isIntersecting)) { onSeen(x.id); o.disconnect(); } }, { threshold: .4 }); o.observe(el); return () => o.disconnect(); }, [x.id]);
  const react = async (kind) => { setState(kind); await call({ t: token, action: kind, item_id: x.id, comment: note || null }); setSent(true); };
  const specs = [["Тип", x.property_type], ["Угода", x.deal_type], ["Кімнати", x.rooms], ["Площа", x.area && `${x.area} м²`], ["Поверх", x.floor && `${x.floor}${x.total_floors ? ` / ${x.total_floors}` : ""}`], ["Стан", x.condition], ["ЖК", x.complex_name]].filter(s => s[1]);
  const perM2 = x.price && x.area >= 10 ? money(x.price / x.area, x.currency) : null;
  return <div ref={ref} id={`obj-${index}`} style={{ scrollMarginTop: 12 }}>
    <ListingCard photos={x.photos || []} photoHeight={300} className="psCard"
      badges={<span className="psBadge">Об'єкт {index + 1} / {total}</span>}
      title={x.title || "Об'єкт нерухомості"} location={[x.city, x.district, x.complex_name, x.address].filter(Boolean).join(" · ") || null}
      price={null}
      chips={[x.rooms && `${x.rooms} кімн.`, x.area && `${x.area} м²`, x.floor && `${x.floor} поверх`, x.deal_type]}>
      {x.price ? <div className="psPrice"><div><small>Вартість</small><b>{money(x.price, x.currency)}</b></div>{perM2 && <span>{perM2} / м²</span>}</div> : null}
      {specs.length > 0 && <div className="psSpecs">{specs.map(([k, v]) => <div key={k}><small>{k}</small><b>{v}</b></div>)}</div>}
      {x.comment && <div className="psNote">💬 <b>Коментар менеджера:</b> {x.comment}</div>}
      {x.payment && <PaymentTable p={x.payment} />}
      {x.flat_plan && <FlatPlan p={x.flat_plan} />}
      {Array.isArray(x.advantages) && x.advantages.length > 0 && <div className="psAdv">{x.advantages.map((a, i) => <span key={i}>✓ {a}</span>)}</div>}
      {x.description && <div style={{ marginBottom: 14 }}><h4 className="psH">Опис</h4><p style={{ whiteSpace: "pre-line", lineHeight: 1.6, margin: "6px 0 0", color: "#27272a" }}>{x.description}</p></div>}
      {x.layout && <div style={{ marginBottom: 14 }}><h4 className="psH">Планування</h4><img src={x.layout} alt="Планування" loading="lazy" style={{ width: "100%", borderRadius: 18, marginTop: 6, background: "#fff", border: "1px solid #e4e4e7" }} /></div>}
      <div className="psReact">
      {sent ? <p style={{ fontWeight: 800, color: "#047857", margin: 0 }}>{state === "interested" ? "Дякуємо! Менеджер зв'яжеться з вами." : "Дякуємо за відгук."}</p> : <>
        <textarea className="input" value={note} onChange={e => setNote(e.target.value)} placeholder="Коментар (необов'язково)" style={{ width: "100%", boxSizing: "border-box", minHeight: 44 }} />
        <div className="grid2" style={{ marginTop: 10 }}>
          <button className="btn psGold" style={{ minHeight: 48 }} onClick={() => react("interested")}>👍 Цікавить</button>
          <button className="btn soft" style={{ minHeight: 48 }} onClick={() => react("not_suitable")}>Не підходить</button>
        </div></>}
      </div>
      {total > 1 && <div className="grid2" style={{ marginTop: 10 }}>
        <button className="btn soft" disabled={index === 0} onClick={() => onNav(index - 1)}>‹ Попередній</button>
        <button className="btn soft" disabled={index === total - 1} onClick={() => onNav(index + 1)}>Наступний ›</button>
      </div>}
    </ListingCard>
  </div>;
}

// «Зв'язатися з менеджером» — только заполненные контакты назначенного менеджера
function ManagerContact({ m }) {
  const btns = [
    m.phone && ["📞 Зателефонувати", `tel:${digits(m.phone)}`, true],
    m.telegram && ["Telegram", /^\+?\d[\d\s()-]{6,}$/.test(m.telegram) ? `https://t.me/${digits(m.telegram)}` : `https://t.me/${String(m.telegram).replace(/^@|^https?:\/\/t\.me\//, "")}`],
    m.viber && ["Viber", `viber://chat?number=${encodeURIComponent(digits(m.viber))}`],
    m.whatsapp && ["WhatsApp", `https://wa.me/${digits(m.whatsapp).replace(/^\+/, "")}`],
    m.email && ["✉ Email", `mailto:${m.email}`],
  ].filter(Boolean);
  if (!m.name && !btns.length) return null;
  return <section className="psContact">
    <small className="psEyebrow">Ваш персональний менеджер</small>
    <h2>Зв'язатися з менеджером</h2>
    <div style={{ display: "flex", gap: 14, alignItems: "center", margin: "6px 0 16px" }}>
      {m.photo ? <img src={m.photo} alt="" style={{ width: 76, height: 76, borderRadius: 38, objectFit: "cover", border: "3px solid #F5C518" }} /> : <div style={{ width: 76, height: 76, borderRadius: 38, background: "#F5C518", display: "grid", placeItems: "center", fontSize: 30 }}>👤</div>}
      <div>{m.name && <b style={{ fontSize: 20, display: "block" }}>{m.name}</b>}{m.position && <span style={{ color: "#c9c4ba", fontSize: 13 }}>{m.position}</span>}{m.phone && <div style={{ fontWeight: 800, marginTop: 2, color: "#F5C518" }}>{m.phone}</div>}</div>
    </div>
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(140px,1fr))", gap: 8 }}>
      {btns.map(([t, href, main]) => <a key={t} className={`btn ${main ? "psGold" : "psGhost"}`} style={{ minHeight: 48 }} href={href} target={href.startsWith("http") ? "_blank" : undefined} rel="noreferrer">{t}</a>)}
    </div>
  </section>;
}

export default function PublicSelection({ token }) {
  const [data, setData] = useState(null); const [err, setErr] = useState(""); const seen = useRef(new Set());
  useEffect(() => { call({ t: token }).then(r => r.ok ? setData(r) : setErr(r.error || "Підбірку не знайдено")).catch(() => setErr("Не вдалося завантажити підбірку")); }, [token]);
  const onSeen = (id) => { if (seen.current.has(id)) return; seen.current.add(id); call({ t: token, action: "view_item", item_id: id }); };
  const nav = i => document.getElementById(`obj-${i}`)?.scrollIntoView({ behavior: "smooth", block: "start" });
  const wrap = { minHeight: "100vh", background: "#F6F4EF", color: "#141414", fontFamily: 'Manrope, "Segoe UI", Roboto, Arial, sans-serif' };
  if (err) return <div style={{ ...wrap, display: "grid", placeItems: "center", padding: 24, textAlign: "center" }}><div><h1 style={{ fontSize: 22 }}>🔒 {err}</h1><p className="muted">Зверніться до вашого менеджера за новим посиланням.</p></div></div>;
  if (!data) return <div style={{ ...wrap, display: "grid", placeItems: "center" }}><div className="psSpin" /></div>;
  const s = data.selection, items = data.items || [];
  const hero = (items.find(x => (x.photos || []).length)?.photos || [])[0];
  return <div className="pubSel" style={wrap}>
    <style>{PS_CSS}</style>
    <header className="psHero" style={hero ? { backgroundImage: `linear-gradient(180deg,rgba(14,14,16,.55) 0%,rgba(14,14,16,.82) 55%,#0E0E10 100%),url("${hero}")` } : undefined}>
      <div className="psWrap">
        <div style={{ display: "flex", alignItems: "center", gap: 12, minHeight: 44 }}>
          {s.agency?.logo_url && <img src={s.agency.logo_url} alt="" style={{ height: 44, maxWidth: 150, objectFit: "contain", background: "rgba(255,255,255,.94)", borderRadius: 12, padding: "4px 8px" }} />}
          {s.agency?.name && <b style={{ fontSize: 13, letterSpacing: 2.4, textTransform: "uppercase", color: "#e7e2d8" }}>{s.agency.name}</b>}
        </div>
        <div className="psLine" />
        <small className="psEyebrow">Персональна добірка нерухомості</small>
        <h1>{s.title}</h1>
        <div style={{ color: "#c9c4ba", fontSize: 14, fontWeight: 600 }}>{s.client_name ? <>Підготовлено для <b style={{ color: "#fff" }}>{s.client_name}</b> · </> : ""}{new Date(s.date).toLocaleDateString("uk-UA", { day: "2-digit", month: "long", year: "numeric" })} · {items.length} об'єкт(ів)</div>
        {s.comment && <p className="psComment">{s.comment}</p>}
        {items.length > 1 && <div className="psNav">{items.map((x, i) => <button key={x.id} onClick={() => nav(i)}><span>{i + 1}</span>{x.price ? money(x.price, x.currency) : (x.title || "Об'єкт").slice(0, 18)}</button>)}</div>}
        {s.pdf_url && <a className="btn psGold" style={{ marginTop: 14, display: "inline-flex", minHeight: 44 }} href={s.pdf_url} target="_blank" rel="noreferrer">⬇ Завантажити PDF</a>}
      </div>
    </header>
    <main className="psWrap" style={{ paddingTop: 18, paddingBottom: 40 }}>
      <div style={{ display: "grid", gap: 22 }}>{items.map((x, i) => <Item key={x.id} x={x} index={i} total={items.length} onNav={nav} token={token} onSeen={onSeen} />)}</div>
      <ManagerContact m={s.manager || {}} />
      {s.agency?.name && <p style={{ textAlign: "center", color: "#8a857c", fontSize: 12, marginTop: 22, letterSpacing: 1.6, textTransform: "uppercase" }}>{s.agency.name}</p>}
    </main>
  </div>;
}

// Оформление клиентской презентации: тёплая бумага, тёмная обложка, золото, Playfair для заголовков
const PS_CSS = `
.pubSel *{box-sizing:border-box}
.pubSel .psWrap{max-width:860px;margin:0 auto;padding-left:16px;padding-right:16px}
.pubSel .psHero{background:#0E0E10;background-size:cover;background-position:center;color:#fff;padding:22px 0 30px;border-bottom:4px solid #F5C518}
.pubSel .psHero h1{font-family:"Playfair Display",Georgia,serif;font-weight:700;font-size:clamp(28px,6vw,44px);line-height:1.12;margin:6px 0 10px;color:#fff}
.pubSel .psLine{width:72px;height:4px;background:#F5C518;border-radius:4px;margin:26px 0 14px}
.pubSel .psEyebrow{display:block;font-size:11px;font-weight:800;letter-spacing:2.6px;text-transform:uppercase;color:#F5C518}
.pubSel .psComment{white-space:pre-line;margin:14px 0 0;padding:12px 14px;border-left:3px solid #F5C518;background:rgba(255,255,255,.07);border-radius:0 14px 14px 0;color:#eee;line-height:1.55}
.pubSel .psNav{display:flex;gap:8px;overflow-x:auto;margin-top:16px;padding-bottom:4px;scrollbar-width:none}
.pubSel .psNav button{flex:0 0 auto;display:inline-flex;align-items:center;gap:8px;border:1px solid rgba(255,255,255,.22);background:rgba(255,255,255,.08);color:#fff;border-radius:999px;padding:7px 14px 7px 7px;font-weight:800;font-size:13px;cursor:pointer;font-variant-numeric:tabular-nums}
.pubSel .psNav button span{width:24px;height:24px;border-radius:12px;background:#F5C518;color:#111;display:grid;place-items:center;font-size:12px}
.pubSel .card{background:#fff;border:1px solid #ebe7de;box-shadow:0 18px 40px rgba(20,20,20,.08)}
.pubSel .psCard{border-radius:28px!important}
.pubSel .psCard h3{font-family:"Playfair Display",Georgia,serif;font-size:24px!important;line-height:1.2}
.pubSel .psBadge{display:inline-flex;background:#0E0E10;color:#F5C518;border-radius:999px;padding:7px 12px;font-size:12px;font-weight:900;letter-spacing:.6px}
.pubSel .chip{display:inline-flex;align-items:center;background:#F4F1EA;color:#141414;border:1px solid #E6E0D3;border-radius:999px;padding:7px 12px;font-weight:800;font-size:13px}
.pubSel .chips{display:flex;gap:8px;flex-wrap:wrap}
.pubSel .psPrice{display:flex;justify-content:space-between;align-items:flex-end;gap:10px;background:#0E0E10;color:#fff;border-radius:20px;padding:16px 18px;margin:0 0 14px}
.pubSel .psPrice small{display:block;font-size:11px;font-weight:800;letter-spacing:2px;text-transform:uppercase;color:#F5C518}
.pubSel .psPrice b{font-size:30px;font-weight:900;font-variant-numeric:tabular-nums;line-height:1.15}
.pubSel .psPrice span{color:#c9c4ba;font-weight:700;font-size:13px;white-space:nowrap}
.pubSel .psSpecs{display:grid;grid-template-columns:repeat(auto-fit,minmax(130px,1fr));gap:8px;margin-bottom:14px}
.pubSel .psSpecs div{background:#F6F4EF;border-radius:16px;padding:10px 12px}
.pubSel .psSpecs small{display:block;font-size:11px;font-weight:800;letter-spacing:1px;text-transform:uppercase;color:#8a857c}
.pubSel .psSpecs b{font-size:15px}
.pubSel .psNote{margin:0 0 14px;padding:12px 14px;border-radius:16px;background:#FFF7D1;color:#5c4300;border-left:4px solid #F5C518;line-height:1.5}
.pubSel .psAdv{display:flex;flex-wrap:wrap;gap:8px;margin:0 0 14px}
.pubSel .psAdv span{background:#111;color:#fff;border-radius:999px;padding:8px 13px;font-size:13px;font-weight:800}
.pubSel .psH{margin:0;font-family:"Playfair Display",Georgia,serif;font-size:19px}
.pubSel .psReact{margin-top:6px;padding-top:14px;border-top:1px solid #ebe7de}
.pubSel .btn.psGold{background:#F5C518;color:#111;border:0}
.pubSel .btn.psGhost{background:rgba(255,255,255,.1);color:#fff;border:1px solid rgba(255,255,255,.25)}
.pubSel .psContact{margin-top:24px;border-radius:28px;padding:22px;background:#0E0E10;color:#fff;border-bottom:4px solid #F5C518}
.pubSel .psContact h2{font-family:"Playfair Display",Georgia,serif;font-size:26px;margin:6px 0 4px}
.pubSel .psSpin{width:38px;height:38px;border-radius:50%;border:4px solid #e6e0d3;border-top-color:#F5C518;animation:psSpin 1s linear infinite}
@keyframes psSpin{to{transform:rotate(360deg)}}
@media (max-width:520px){.pubSel .psPrice b{font-size:26px}.pubSel .payBox table td,.pubSel .payBox table th{padding:10px 9px!important}}
`;
