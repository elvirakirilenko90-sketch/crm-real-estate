// /api/ocr — бесплатное распознавание текста со скриншота (Tesseract, без внешних ИИ-сервисов).
// Вызывает Supabase-функция tiktok-screens-bot: POST { image: "<base64 jpeg/png>" } → { ok, text, lines, ms }.
// Языки: украинский + русский + английский. Модели качаются один раз в /tmp тёплого инстанса.
// v2: предобработка (sharp) — увеличение ×2, ч/б, контраст — и два прохода: обычный и «только светлый текст».
// Tesseract плохо читает светлый текст на тёмном/цветном фоне (тёмная тема TikTok, цветные «пузыри»),
// второй проход это закрывает.
// v3: кроме текста отдаём строки с координатами (lines: t, x0, x1, y0, y1 — доли ширины/высоты, c — уверенность).
// По ним бот отличает сообщения клиента (пузыри слева) от наших ответов (справа) и служебных строк (по центру).
import { createWorker } from "tesseract.js";

let workerP = null;
const getWorker = () => (workerP ||= createWorker(["ukr", "rus", "eng"], 1, { cachePath: "/tmp/tess", logger: () => {} }));

let sharpP = null; // sharp грузим лениво; если не загрузится — работаем без предобработки
const getSharp = () => (sharpP ||= import("sharp").then((m) => m.default).catch(() => null));

async function variants(buf) {
  const sharp = await getSharp();
  if (!sharp) return { imgs: [buf], w: 0, h: 0 };
  const meta = await sharp(buf).metadata();
  const w = Math.min(2400, Math.round((meta.width || 1000) * 2));
  const h = Math.round((meta.height || 1000) * (w / (meta.width || 1000)));
  const base = () => sharp(buf).resize({ width: w }).grayscale().normalize();
  // 1) как есть (тёмный текст на светлом); 2) только светлый текст (белое на тёмном/цветном «пузыре») → чёрным по белому
  return { imgs: [await base().png().toBuffer(), await sharp(buf).resize({ width: w }).grayscale().threshold(185).negate().png().toBuffer()], w, h };
}

const key = (s) => s.replace(/\s+/g, "").toLowerCase();
// строки из ответа Tesseract (blocks → paragraphs → lines)
const linesOf = (d) => (d.lines && d.lines.length ? d.lines : (d.blocks || []).flatMap((b) => (b.paragraphs || []).flatMap((p) => p.lines || [])))
  .map((l) => ({ t: String(l.text || "").trim(), c: l.confidence || 0, b: l.bbox || {} })).filter((l) => l.t);
const vOverlap = (a, b) => Math.max(0, Math.min(a.b.y1, b.b.y1) - Math.max(a.b.y0, b.b.y0)) / Math.max(1, Math.min(a.b.y1 - a.b.y0, b.b.y1 - b.b.y0));
const hOverlap = (a, b) => Math.min(a.b.x1, b.b.x1) - Math.max(a.b.x0, b.b.x0) > 0;

export const config = { maxDuration: 60 };

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ ok: false, error: "POST only" });
  if (req.headers["x-ocr-client"] !== "pride-crm") return res.status(403).json({ ok: false, error: "forbidden" });
  const b64 = String((req.body && req.body.image) || "").replace(/^data:[^,]+,/, "");
  if (!b64) return res.status(400).json({ ok: false, error: "no image" });
  if (b64.length > 8_000_000) return res.status(413).json({ ok: false, error: "image too large" });
  const t0 = Date.now();
  try {
    const worker = await getWorker();
    const { imgs, w, h } = await variants(Buffer.from(b64, "base64"));
    const runs = [];
    for (const img of imgs) runs.push((await worker.recognize(img, {}, { text: true, blocks: true })).data);
    runs.sort((a, b) => (b.confidence || 0) - (a.confidence || 0));
    // текст — как в v2 (совместимость)
    let text = runs[0].text || "";
    const seen = new Set(text.split("\n").map(key));
    const all = key(text);
    const extra = runs.slice(1).flatMap((r) => (r.text || "").split("\n"))
      .filter((s) => key(s).length > 2 && !seen.has(key(s)) && !all.includes(key(s)));
    if (extra.length) text += "\n" + extra.join("\n");
    // строки с координатами: из обоих проходов, одна и та же строка — с большей уверенностью
    const merged = [];
    for (const l of runs.flatMap(linesOf)) {
      const i = merged.findIndex((m) => vOverlap(m, l) > 0.5 && hOverlap(m, l));
      if (i < 0) merged.push(l); else if (l.c > merged[i].c) merged[i] = l;
    }
    const W = w || Math.max(1, ...merged.map((l) => l.b.x1 || 0)), H = h || Math.max(1, ...merged.map((l) => l.b.y1 || 0));
    const r3 = (v) => Math.round(v * 1000) / 1000;
    const lines = merged.sort((a, b) => a.b.y0 - b.b.y0)
      .map((l) => ({ t: l.t, c: Math.round(l.c), x0: r3(l.b.x0 / W), x1: r3(l.b.x1 / W), y0: r3(l.b.y0 / H), y1: r3(l.b.y1 / H) }));
    return res.status(200).json({ ok: true, text, lines, ms: Date.now() - t0, passes: runs.length });
  } catch (e) {
    workerP = null; // при сбое пересоздать воркер в следующий раз
    return res.status(500).json({ ok: false, error: String(e && e.message || e) });
  }
}
