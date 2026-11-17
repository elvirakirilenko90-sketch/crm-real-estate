// Служебная страница: обработка поквартирных планировок по разовому ключу задания (без входа в CRM).
// /?nbplans=<id ЖК>&job=<ключ>[&dry=1] — dry: только показать результат, ничего не сохранять.
import React, { useEffect, useState } from "react";
import { processUnitPlans } from "./nbUnitPlans.js";

const FN = `${import.meta.env.VITE_SUPABASE_URL || "https://stvinrjyfuskqddcxzjv.supabase.co"}/functions/v1/nb-unit-plans`;

export default function NbPlansJob({ sourceId, job, dry }) {
  const [log, setLog] = useState([]); const [prev, setPrev] = useState([]); const [state, setState] = useState("…");
  useEffect(() => {
    const call = async (action, body, { raw } = {}) => {
      if (dry && action === "save") { setPrev(p => [...p, { name: body.info.name, info: body.info, src: "data:image/png;base64," + body.png }]); return { ok: true, item: body.info }; }
      const r = await fetch(FN, { method: "POST", headers: { "Content-Type": "application/json", "x-job-token": job }, body: JSON.stringify({ ...body, action }) });
      return raw ? r : r.json();
    };
    processUnitPlans({ sourceId: Number(sourceId), call, onProgress: (p) => setState(p.done ? "готово" : `${p.i + 1} / ${p.total}: ${p.name}`) })
      .then(r => { setLog(r.failed.map(f => `⚠ ${f.name}: ${f.error}`)); setState(`готово: ${r.done.length} из ${r.pending}`); window.__nbplans = r; })
      .catch(e => setState("ошибка: " + e.message));
  }, []);
  return <div style={{ padding: 16, fontFamily: "sans-serif" }}>
    <h3 id="nbstate">{state}</h3>
    {log.map((l, i) => <div key={i}>{l}</div>)}
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(220px,1fr))", gap: 10 }}>
      {prev.map((p, i) => <figure key={i} style={{ margin: 0, border: "1px solid #ddd", padding: 6 }}><img src={p.src} style={{ width: "100%" }} /><figcaption style={{ fontSize: 11 }}>{p.name} · S {p.info.area} · к {p.info.rooms} · эт {p.info.floor} · ст {p.info.stoyak} · № {p.info.no} · секц {p.info.section} · {JSON.stringify(p.info.floors)}</figcaption></figure>)}
    </div>
  </div>;
}
