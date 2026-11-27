// /api/ocr — бесплатное распознавание текста со скриншота (Tesseract, без внешних ИИ-сервисов).
// Вызывает Supabase-функция tiktok-screens-bot: POST { image: "<base64 jpeg/png>" } → { ok, text, ms }.
// Языки: украинский + русский + английский. Модели качаются один раз в /tmp тёплого инстанса.
import { createWorker } from "tesseract.js";

let workerP = null;
const getWorker = () => (workerP ||= createWorker(["ukr", "rus", "eng"], 1, { cachePath: "/tmp/tess", logger: () => {} }));

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
    const { data } = await worker.recognize(Buffer.from(b64, "base64"));
    return res.status(200).json({ ok: true, text: data.text || "", ms: Date.now() - t0 });
  } catch (e) {
    workerP = null; // при сбое пересоздать воркер в следующий раз
    return res.status(500).json({ ok: false, error: String(e && e.message || e) });
  }
}
