// /api/ocr — бесплатное распознавание текста со скриншота (Tesseract, без внешних ИИ-сервисов).
// Вызывает Supabase-функция tiktok-screens-bot: POST { image: "<base64 jpeg/png>" } → { ok, text, ms }.
// Языки: украинский + русский + английский. Модели качаются один раз в /tmp тёплого инстанса.
// v2: предобработка (sharp) — увеличение ×2, ч/б, контраст — и два прохода: обычный и инвертированный.
// Tesseract плохо читает светлый текст на тёмном/цветном фоне (тёмная тема TikTok, цветные «пузыри»),
// инвертированный проход это закрывает. Основной текст — проход с большей уверенностью; из второго
// добавляются строки с цифрами/@, которых нет в основном (чтобы не потерять номер).
import { createWorker } from "tesseract.js";

let workerP = null;
const getWorker = () => (workerP ||= createWorker(["ukr", "rus", "eng"], 1, { cachePath: "/tmp/tess", logger: () => {} }));

let sharpP = null; // sharp грузим лениво; если не загрузится — работаем без предобработки
const getSharp = () => (sharpP ||= import("sharp").then((m) => m.default).catch(() => null));

async function variants(buf) {
  const sharp = await getSharp();
  if (!sharp) return [buf];
  const meta = await sharp(buf).metadata();
  const w = Math.min(2400, Math.round((meta.width || 1000) * 2));
  const base = () => sharp(buf).resize({ width: w }).grayscale().normalize();
  return [await base().png().toBuffer(), await base().negate().png().toBuffer()];
}

const key = (s) => s.replace(/\s+/g, "").toLowerCase();

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
    const imgs = await variants(Buffer.from(b64, "base64"));
    const runs = [];
    for (const img of imgs) runs.push((await worker.recognize(img)).data);
    runs.sort((a, b) => (b.confidence || 0) - (a.confidence || 0));
    let text = runs[0].text || "";
    const seen = new Set(text.split("\n").map(key));
    const extra = runs.slice(1).flatMap((r) => (r.text || "").split("\n"))
      .filter((s) => /\d{3}|@\w/.test(s) && !seen.has(key(s)));
    if (extra.length) text += "\n" + extra.join("\n");
    return res.status(200).json({ ok: true, text, ms: Date.now() - t0, passes: runs.length });
  } catch (e) {
    workerP = null; // при сбое пересоздать воркер в следующий раз
    return res.status(500).json({ ok: false, error: String(e && e.message || e) });
  }
}
