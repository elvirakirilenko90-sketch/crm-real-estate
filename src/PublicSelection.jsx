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

function Item({ x, token, onSeen, index, total, onNav }) {
  const ref = useRef(null); const [state, setState] = useState(""); const [note, setNote] = useState(""); const [sent, setSent] = useState(false);
  useEffect(() => { const el = ref.current; if (!el || !("IntersectionObserver" in window)) return; const o = new IntersectionObserver(es => { if (es.some(e => e.isIntersecting)) { onSeen(x.id); o.disconnect(); } }, { threshold: .4 }); o.observe(el); return () => o.disconnect(); }, [x.id]);
  const react = async (kind) => { setState(kind); await call({ t: token, action: kind, item_id: x.id, comment: note || null }); setSent(true); };
  const specs = [["Тип", x.property_type], ["Угода", x.deal_type], ["Кімнати", x.rooms], ["Площа", x.area && `${x.area} м²`], ["Поверх", x.floor && `${x.floor}${x.total_floors ? ` / ${x.total_floors}` : ""}`], ["Стан", x.condition], ["ЖК", x.complex_name]].filter(s => s[1]);
  return <div ref={ref} id={`obj-${index}`} style={{ scrollMarginTop: 12 }}>
    <ListingCard photos={x.photos || []}
      badges={<span className="badge" style={{ background: "rgba(255,255,255,.92)", color: "#111827" }}>Об'єкт {index + 1} / {total}</span>}
      title={x.title || "Об'єкт нерухомості"} location={[x.city, x.district, x.complex_name, x.address].filter(Boolean).join(" · ") || null}
      price={money(x.price, x.currency)} priceSub={x.price && x.area >= 10 ? <small className="muted" style={{ display: "block", fontSize: 12, fontWeight: 600 }}>{money(x.price / x.area, x.currency)} / м²</small> : null}
      chips={[x.rooms && `${x.rooms} кімн.`, x.area && `${x.area} м²`, x.floor && `${x.floor} поверх`, x.deal_type]}>
      {specs.length > 0 && <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(130px,1fr))", gap: 8, marginBottom: 12 }}>
        {specs.map(([k, v]) => <div key={k} style={{ background: "var(--soft, #f4f4f5)", borderRadius: 14, padding: "9px 12px" }}><div className="muted" style={{ fontSize: 12 }}>{k}</div><b>{v}</b></div>)}</div>}
      {x.comment && <div style={{ margin: "0 0 12px", padding: "10px 12px", borderRadius: 14, background: "#fef3c7", color: "#78350f", borderLeft: "4px solid #d4a017" }}>💬 <b>Коментар менеджера:</b> {x.comment}</div>}
      {Array.isArray(x.advantages) && x.advantages.length > 0 && <div style={{ marginBottom: 12 }}><b>Переваги</b>{x.advantages.map((a, i) => <div key={i} style={{ margin: "6px 0" }}>✓ {a}</div>)}</div>}
      {x.description && <div style={{ marginBottom: 12 }}><b>Опис</b><p style={{ whiteSpace: "pre-line", lineHeight: 1.55, margin: "6px 0 0" }}>{x.description}</p></div>}
      {x.layout && <div style={{ marginBottom: 12 }}><b>Планування</b><img src={x.layout} alt="Планування" loading="lazy" style={{ width: "100%", borderRadius: 14, marginTop: 6 }} /></div>}
      {sent ? <p style={{ fontWeight: 800, color: "#047857" }}>{state === "interested" ? "Дякуємо! Менеджер зв'яжеться з вами." : "Дякуємо за відгук."}</p> : <>
        <textarea className="input" value={note} onChange={e => setNote(e.target.value)} placeholder="Коментар (необов'язково)" style={{ width: "100%", boxSizing: "border-box", minHeight: 44 }} />
        <div className="grid2" style={{ marginTop: 10 }}>
          <button className="btn primary" style={{ minHeight: 46 }} onClick={() => react("interested")}>👍 Цікавить</button>
          <button className="btn soft" style={{ minHeight: 46 }} onClick={() => react("not_suitable")}>Не підходить</button>
        </div></>}
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
  return <section className="card" style={{ borderRadius: 24, padding: 20, marginTop: 18, border: "2px solid #d4a017" }}>
    <h2 style={{ margin: "0 0 12px", fontSize: 22 }}>Зв'язатися з менеджером</h2>
    <div style={{ display: "flex", gap: 14, alignItems: "center", marginBottom: 14 }}>
      {m.photo ? <img src={m.photo} alt="" style={{ width: 72, height: 72, borderRadius: 36, objectFit: "cover" }} /> : <div style={{ width: 72, height: 72, borderRadius: 36, background: "#fef3c7", display: "grid", placeItems: "center", fontSize: 30 }}>👤</div>}
      <div>{m.name && <b style={{ fontSize: 19, display: "block" }}>{m.name}</b>}{m.position && <span className="muted">{m.position}</span>}{m.phone && <div style={{ fontWeight: 800, marginTop: 2 }}>{m.phone}</div>}</div>
    </div>
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(140px,1fr))", gap: 8 }}>
      {btns.map(([t, href, main]) => <a key={t} className={`btn ${main ? "primary" : "soft"}`} style={{ minHeight: 46 }} href={href} target={href.startsWith("http") ? "_blank" : undefined} rel="noreferrer">{t}</a>)}
    </div>
  </section>;
}

export default function PublicSelection({ token }) {
  const [data, setData] = useState(null); const [err, setErr] = useState(""); const seen = useRef(new Set());
  useEffect(() => { call({ t: token }).then(r => r.ok ? setData(r) : setErr(r.error || "Підбірку не знайдено")).catch(() => setErr("Не вдалося завантажити підбірку")); }, [token]);
  const onSeen = (id) => { if (seen.current.has(id)) return; seen.current.add(id); call({ t: token, action: "view_item", item_id: id }); };
  const nav = i => document.getElementById(`obj-${i}`)?.scrollIntoView({ behavior: "smooth", block: "start" });
  const wrap = { minHeight: "100vh", background: "var(--bg, #f5f5f4)", color: "#111827" };
  if (err) return <div style={{ ...wrap, display: "grid", placeItems: "center", padding: 24, textAlign: "center" }}><div><h1 style={{ fontSize: 22 }}>🔒 {err}</h1><p className="muted">Зверніться до вашого менеджера за новим посиланням.</p></div></div>;
  if (!data) return <div style={{ ...wrap, display: "grid", placeItems: "center" }}>⏳</div>;
  const s = data.selection, items = data.items || [];
  return <div className="pubSel" style={wrap}>
    <style>{`.pubSel .chip{display:inline-flex;align-items:center;background:#f4f4f5;color:#111827;border:1px solid #e4e4e7;border-radius:999px;padding:7px 12px;font-weight:800;font-size:13px;cursor:pointer}.pubSel .chips{display:flex;gap:8px;flex-wrap:wrap}.pubSel .card{background:#fff;border:1px solid #e4e4e7;box-shadow:0 10px 30px rgba(0,0,0,.06)}`}</style>
    <div style={{ maxWidth: 820, margin: "0 auto", padding: "18px 16px 40px", boxSizing: "border-box" }}>
      <header style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 14 }}>
        {s.agency?.logo_url && <img src={s.agency.logo_url} alt="" style={{ height: 44, maxWidth: 140, objectFit: "contain" }} />}
        <b style={{ fontSize: 16 }}>{s.agency?.name || ""}</b>
      </header>
      <section className="card" style={{ borderRadius: 24, padding: 20, marginBottom: 16 }}>
        <h1 style={{ fontSize: 26, margin: "0 0 6px" }}>{s.title}</h1>
        <div className="muted" style={{ fontSize: 14 }}>{s.client_name ? `Для: ${s.client_name} · ` : ""}{new Date(s.date).toLocaleDateString("uk-UA", { day: "2-digit", month: "long", year: "numeric" })} · {items.length} об'єкт(ів)</div>
        {s.comment && <p style={{ whiteSpace: "pre-line", margin: "12px 0 0" }}>{s.comment}</p>}
        {items.length > 1 && <div className="chips" style={{ marginTop: 12, flexWrap: "wrap" }}>{items.map((x, i) => <button key={x.id} className="chip" onClick={() => nav(i)}>{i + 1}. {x.price ? money(x.price, x.currency) : (x.title || "Об'єкт").slice(0, 18)}</button>)}</div>}
        {s.pdf_url && <a className="btn soft" style={{ marginTop: 12, display: "inline-flex" }} href={s.pdf_url} target="_blank" rel="noreferrer">⬇ Завантажити PDF</a>}
      </section>
      <div style={{ display: "grid", gap: 18 }}>{items.map((x, i) => <Item key={x.id} x={x} index={i} total={items.length} onNav={nav} token={token} onSeen={onSeen} />)}</div>
      <ManagerContact m={s.manager || {}} />
    </div>
  </div>;
}
