// Публичная подборка объектов для клиента: открывается по ссылке /?sel=<токен>, без входа в CRM.
// Данные приходят только из серверной функции selection-public (разрешённые поля подборки).
import React, { useEffect, useRef, useState } from "react";
import { SUPABASE_URL, SUPABASE_KEY } from "./supabaseClient";

const API = `${SUPABASE_URL}/functions/v1/selection-public`;
const call = (body) => fetch(API, { method: "POST", headers: { "content-type": "application/json", apikey: SUPABASE_KEY }, body: JSON.stringify(body) }).then(r => r.json());
const money = (v, c = "USD") => v == null ? "" : `${c === "UAH" ? "₴" : c === "EUR" ? "€" : "$"}${Math.round(Number(v)).toLocaleString("uk-UA")}`;
const C = { bg: "#0f0f11", card: "#18181b", line: "#2a2a2e", ink: "#f5f5f4", muted: "#a8a29e", accent: "#f5c518" };

function Item({ x, token, onSeen }) {
  const ref = useRef(null); const [state, setState] = useState(""); const [note, setNote] = useState(""); const [sent, setSent] = useState(false); const [photo, setPhoto] = useState(0);
  useEffect(() => { const el = ref.current; if (!el || !("IntersectionObserver" in window)) return; const o = new IntersectionObserver(es => { if (es.some(e => e.isIntersecting)) { onSeen(x.id); o.disconnect(); } }, { threshold: .5 }); o.observe(el); return () => o.disconnect(); }, [x.id]);
  const react = async (kind) => { setState(kind); await call({ t: token, action: kind, item_id: x.id, comment: note || null }); setSent(true); };
  const photos = (x.photos || []).filter(Boolean);
  const specs = [["Площа", x.area && `${x.area} м²`], ["Кімнати", x.rooms], ["Поверх", x.floor && `${x.floor}${x.total_floors ? ` / ${x.total_floors}` : ""}`], ["Тип", x.property_type], ["ЖК", x.complex_name], ["Стан", x.condition]].filter(s => s[1]);
  return <article ref={ref} style={{ background: C.card, border: `1px solid ${C.line}`, borderRadius: 18, overflow: "hidden", marginBottom: 18 }}>
    {photos.length > 0 && <div style={{ position: "relative", background: "#000" }}>
      <img src={photos[photo]} alt="" loading="lazy" style={{ width: "100%", aspectRatio: "4/3", objectFit: "cover", display: "block" }} />
      {photos.length > 1 && <div style={{ position: "absolute", bottom: 8, left: 0, right: 0, display: "flex", justifyContent: "center", gap: 6 }}>
        {photos.slice(0, 12).map((_, i) => <button key={i} onClick={() => setPhoto(i)} aria-label={`фото ${i + 1}`} style={{ width: 9, height: 9, borderRadius: 9, border: 0, background: i === photo ? C.accent : "rgba(255,255,255,.55)" }} />)}</div>}
    </div>}
    <div style={{ padding: 16 }}>
      <h2 style={{ margin: "0 0 6px", fontSize: 20 }}>{x.title || "Об'єкт"}</h2>
      <div style={{ color: C.muted, fontSize: 14 }}>📍 {[x.city, x.district, x.address].filter(Boolean).join(", ")}</div>
      <div style={{ fontSize: 26, fontWeight: 800, color: C.accent, margin: "10px 0" }}>{money(x.price, x.currency)}</div>
      {specs.length > 0 && <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(120px,1fr))", gap: 8, margin: "8px 0" }}>
        {specs.map(([k, v]) => <div key={k} style={{ border: `1px solid ${C.line}`, borderRadius: 12, padding: "8px 10px" }}><div style={{ color: C.muted, fontSize: 12 }}>{k}</div><b>{v}</b></div>)}</div>}
      {x.comment && <p style={{ background: "rgba(245,197,24,.1)", borderLeft: `3px solid ${C.accent}`, padding: "8px 12px", borderRadius: 8 }}>💬 {x.comment}</p>}
      {Array.isArray(x.advantages) && x.advantages.length > 0 && <ul>{x.advantages.map((a, i) => <li key={i}>{a}</li>)}</ul>}
      {x.description && <p style={{ whiteSpace: "pre-line", color: "#d6d3d1", lineHeight: 1.5 }}>{x.description}</p>}
      {x.link && <a href={x.link} target="_blank" rel="noreferrer" style={{ color: C.accent }}>Переглянути оголошення ↗</a>}
      <div style={{ marginTop: 12 }}>
        {sent ? <p style={{ color: C.accent, fontWeight: 700 }}>{state === "interested" ? "Дякуємо! Менеджер зв'яжеться з вами." : "Дякуємо за відгук."}</p> : <>
          <textarea value={note} onChange={e => setNote(e.target.value)} placeholder="Коментар (необов'язково)" style={{ width: "100%", boxSizing: "border-box", background: "#111", color: C.ink, border: `1px solid ${C.line}`, borderRadius: 10, padding: 10, minHeight: 44 }} />
          <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
            <button onClick={() => react("interested")} style={{ flex: 1, padding: "12px", borderRadius: 12, border: 0, background: C.accent, color: "#111", fontWeight: 800 }}>👍 Цікавить</button>
            <button onClick={() => react("not_suitable")} style={{ flex: 1, padding: "12px", borderRadius: 12, border: `1px solid ${C.line}`, background: "transparent", color: C.ink, fontWeight: 700 }}>Не підходить</button>
          </div></>}
      </div>
    </div>
  </article>;
}

export default function PublicSelection({ token }) {
  const [data, setData] = useState(null); const [err, setErr] = useState(""); const seen = useRef(new Set());
  useEffect(() => { call({ t: token }).then(r => r.ok ? setData(r) : setErr(r.error || "Підбірку не знайдено")).catch(() => setErr("Не вдалося завантажити підбірку")); }, [token]);
  const onSeen = (id) => { if (seen.current.has(id)) return; seen.current.add(id); call({ t: token, action: "view_item", item_id: id }); };
  const wrap = { minHeight: "100vh", background: C.bg, color: C.ink, fontFamily: "Inter, system-ui, -apple-system, Segoe UI, Roboto, sans-serif" };
  if (err) return <div style={{ ...wrap, display: "grid", placeItems: "center", padding: 24, textAlign: "center" }}><div><h1 style={{ fontSize: 22 }}>🔒 {err}</h1><p style={{ color: C.muted }}>Зверніться до вашого менеджера за новим посиланням.</p></div></div>;
  if (!data) return <div style={{ ...wrap, display: "grid", placeItems: "center" }}>⏳</div>;
  const s = data.selection, m = s.manager || {};
  return <div style={wrap}>
    <div style={{ maxWidth: 760, margin: "0 auto", padding: "20px 16px 40px" }}>
      <header style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 14 }}>
        {s.agency?.logo_url && <img src={s.agency.logo_url} alt="" style={{ height: 44, maxWidth: 140, objectFit: "contain" }} />}
        <b style={{ fontSize: 16 }}>{s.agency?.name || ""}</b>
      </header>
      <h1 style={{ fontSize: 26, margin: "0 0 4px" }}>{s.title}</h1>
      <div style={{ color: C.muted, marginBottom: 14 }}>{s.client_name ? `Для: ${s.client_name} · ` : ""}{new Date(s.date).toLocaleDateString("uk-UA", { day: "2-digit", month: "long", year: "numeric" })} · {data.items.length} об'єкт(ів)</div>
      {s.comment && <p style={{ background: C.card, border: `1px solid ${C.line}`, borderRadius: 14, padding: 14, whiteSpace: "pre-line" }}>{s.comment}</p>}
      {s.pdf_url && <a href={s.pdf_url} target="_blank" rel="noreferrer" style={{ display: "inline-block", margin: "0 0 14px", color: C.accent, fontWeight: 700 }}>⬇ Завантажити PDF</a>}
      {data.items.map(x => <Item key={x.id} x={x} token={token} onSeen={onSeen} />)}
      <footer style={{ background: C.card, border: `1px solid ${C.line}`, borderRadius: 18, padding: 16, marginTop: 10 }}>
        <div style={{ color: C.muted, fontSize: 13 }}>Ваш менеджер</div>
        <b style={{ fontSize: 18 }}>{m.name || ""}</b>
        <div style={{ display: "flex", gap: 8, marginTop: 10, flexWrap: "wrap" }}>
          {m.phone && <a href={`tel:${m.phone}`} style={{ padding: "10px 14px", borderRadius: 12, background: C.accent, color: "#111", fontWeight: 800, textDecoration: "none" }}>📞 Зателефонувати</a>}
          {m.phone && <a href={`viber://chat?number=${encodeURIComponent(String(m.phone).replace(/[^\d+]/g, ""))}`} style={{ padding: "10px 14px", borderRadius: 12, border: `1px solid ${C.line}`, color: C.ink, textDecoration: "none" }}>Viber</a>}
          {m.email && <a href={`mailto:${m.email}`} style={{ padding: "10px 14px", borderRadius: 12, border: `1px solid ${C.line}`, color: C.ink, textDecoration: "none" }}>Email</a>}
        </div>
      </footer>
    </div>
  </div>;
}
