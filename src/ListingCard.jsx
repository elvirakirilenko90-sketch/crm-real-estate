// Общая карточка объекта — одна разметка для «Аналитики», автоподбора и клиентской презентации,
// чтобы разделы не разошлись визуально после следующих обновлений.
// Фото сверху (240px, на телефоне 200px) с переключением, заголовок + локация слева, крупная цена справа,
// характеристики «чипами», ниже — произвольный блок (кнопки, соответствие запросу и т.п.).
import React, { useState } from "react";

export function ListingPhoto({ photos = [], height = 240, badges = null, empty = "🏠", alt = "" }) {
  const list = photos.filter(Boolean);
  const [i, setI] = useState(0);
  const cur = list[Math.min(i, Math.max(0, list.length - 1))];
  const go = (d, e) => { e.stopPropagation(); setI(x => (x + d + list.length) % list.length); };
  const arrow = { position: "absolute", top: "50%", transform: "translateY(-50%)", width: 36, height: 36, borderRadius: 18, border: 0, background: "rgba(0,0,0,.45)", color: "#fff", fontSize: 20, lineHeight: "36px", cursor: "pointer" };
  return <div className="listingPhoto" style={{ height, background: "var(--soft, #f4f4f5)", position: "relative", overflow: "hidden" }}>
    {cur ? <img src={cur} alt={alt} loading="lazy" decoding="async" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
      : <div style={{ height: "100%", display: "grid", placeItems: "center", fontSize: 54 }}>{empty}</div>}
    {badges && <div style={{ position: "absolute", left: 14, top: 14, right: 14, display: "flex", gap: 8, flexWrap: "wrap" }}>{badges}</div>}
    {list.length > 1 && <>
      <button type="button" aria-label="‹" onClick={e => go(-1, e)} style={{ ...arrow, left: 10 }}>‹</button>
      <button type="button" aria-label="›" onClick={e => go(1, e)} style={{ ...arrow, right: 10 }}>›</button>
      <span style={{ position: "absolute", right: 12, bottom: 10, background: "rgba(0,0,0,.55)", color: "#fff", borderRadius: 999, padding: "3px 9px", fontSize: 12, fontWeight: 800 }}>{Math.min(i, list.length - 1) + 1} / {list.length}</span>
    </>}
  </div>;
}

/**
 * band      — цвет верхней полосы статуса (необязательно)
 * frame     — цвет рамки карточки (необязательно)
 * badges    — значки поверх фото
 * afterHead — блок сразу под заголовком (дубли, разница с бюджетом и т.п.)
 */
export default function ListingCard({ photos = [], photoHeight = 240, badges, title, location, price, priceSub, chips = [], afterHead, children, band, frame, dim = false, style, className = "" }) {
  return <article className={`card listingCard ${className}`.trim()} style={{ padding: 0, overflow: "hidden", borderRadius: 24, opacity: dim ? .72 : 1,
    ...(frame ? { border: `2px solid ${frame}` } : {}), ...style }}>
    {band && <div style={{ height: 6, background: band }} />}
    <ListingPhoto photos={photos} height={photoHeight} badges={badges} />
    <div className="listingBody" style={{ padding: 20 }}>
      <div className="row" style={{ alignItems: "flex-start", gap: 12 }}>
        <section style={{ minWidth: 0 }}><h3 style={{ margin: "0 0 7px", fontSize: 21, overflowWrap: "anywhere" }}>{title}</h3>{location && <p className="muted" style={{ margin: 0 }}>📍 {location}</p>}</section>
        {price != null && <b style={{ fontSize: 24, whiteSpace: "nowrap", textAlign: "right" }}>{price}{priceSub}</b>}
      </div>
      {afterHead}
      {chips.filter(Boolean).length > 0 && <div className="chips" style={{ margin: "14px 0" }}>{chips.filter(Boolean).map((c, i) => <span key={i} className="chip">{c}</span>)}</div>}
      {children}
    </div>
  </article>;
}
