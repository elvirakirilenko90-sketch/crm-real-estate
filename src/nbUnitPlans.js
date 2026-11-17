// Новобудови: поквартирные планировки с Google Диска → чистая картинка планировки для презентации.
//
// Функция nb-unit-plans находит на Диске папки «Поквартирні планування» (новые секции/очереди — автоматически)
// и отдаёт список новых файлов. Здесь, в браузере администратора, каждый файл превращается в картинку:
//   • PDF (лист застройщика с шапкой, логотипом, экспликацией, контактами): рисуем страницу (pdf.js),
//     находим чертёж квартиры — самую большую «плотную» область без текста, — вырезаем его,
//     убираем серые плашки и салатовые элементы макета. Площадь, комнаты, этаж, № квартиры берём из текста PDF.
//   • Картинка (JPG/PNG): вырезаем чертёж, табличку «2K / тип / 31,56 / 63,50» закрашиваем.
//     Площадь — из имени файла («61,17.jpg») или распознаём с таблички (tesseract.js).
// Готовая картинка сохраняется в хранилище CRM (без ссылок на Диск застройщика).

const PDFJS = "https://cdn.jsdelivr.net/npm/pdfjs-dist@4.10.38/build/pdf.min.mjs";
const PDFJS_WORKER = "https://cdn.jsdelivr.net/npm/pdfjs-dist@4.10.38/build/pdf.worker.min.mjs";
const TESSERACT = "https://cdn.jsdelivr.net/npm/tesseract.js@5.1.1/dist/tesseract.esm.min.js";

let pdfjsP = null, ocrP = null;
const loadPdfjs = () => pdfjsP ||= import(/* @vite-ignore */ PDFJS).then(m => { m.GlobalWorkerOptions.workerSrc = PDFJS_WORKER; return m; });
const loadOcr = () => ocrP ||= import(/* @vite-ignore */ TESSERACT).then(async m => {
  const T = m.default || m; const w = await T.createWorker("eng");
  await w.setParameters({tessedit_char_whitelist:"0123456789,.KkКк"}); return w;
});

const num = (s) => { const n = Number(String(s || "").replace(",", ".")); return Number.isFinite(n) ? n : null; };
const roomsOf = (s) => /студ/i.test(s) ? 0 : (Number((String(s).match(/(\d)\s*-?\s*(?:к(?![а-яіїєґ])|кімн|комн)/i) || [])[1]) || null);
const areaInName = (s) => { const m = String(s).match(/(?:^|[^\d])(\d{2,3})[,.](\d{1,2})(?!\d)/); return m && Number(m[1]) >= 15 ? Number(`${m[1]}.${m[2]}`) : null; };
// «2-6» → [2..6], «2,3,6» → [2,3,6], «…консольной 9» → [9]
function floorsInName(name){
  const s = String(name).replace(/\.[a-z]+$/i, "");
  if(areaInName(s)) return null;
  const r = s.match(/(?:^|\s)(\d{1,2})\s*-\s*(\d{1,2})(?:\s|$)/); if(r){ const a = +r[1], b = +r[2]; if(a <= b && b <= 40) return Array.from({length:b - a + 1}, (_, i) => a + i); }
  const l = s.match(/(?:^|\s)(\d{1,2}(?:\s*,\s*\d{1,2})+)(?:\s|$)/); if(l) return l[1].split(",").map(Number).filter(n => n <= 40);
  const one = s.match(/\s(\d{1,2})$/); return one && +one[1] <= 40 ? [+one[1]] : null;
}

// ---------- обработка картинки ----------
const canvasOf = (w, h) => { const c = document.createElement("canvas"); c.width = w; c.height = h; return c; };
// Рамка чертежа: «плотные» пиксели (стены, заливка комнат) без тонких линий и текста; самая крупная связная область.
function planBox(src, {textRects = [], pdf = false} = {}){
  const W = src.width, H = src.height, k = Math.max(1, Math.max(W, H) / 700), w = Math.round(W / k), h = Math.round(H / k);
  const c = canvasOf(w, h), x = c.getContext("2d", {willReadFrequently:true}); x.drawImage(src, 0, 0, w, h);
  const d = x.getImageData(0, 0, w, h).data; let m = new Uint8Array(w * h);
  for(let i = 0; i < w * h; i++){
    const r = d[i * 4], g = d[i * 4 + 1], b = d[i * 4 + 2], mx = Math.max(r, g, b), mn = Math.min(r, g, b);
    const lime = g > 180 && r > 120 && b < 170 && g - b > 60;
    m[i] = !lime && (mx < 150 || (mx - mn > 35 && mx < 252)) ? 1 : 0;
  }
  for(const t of textRects){ const x0 = Math.max(0, Math.floor(t.x / k)), y0 = Math.max(0, Math.floor(t.y / k)), x1 = Math.min(w, Math.ceil((t.x + t.w) / k)), y1 = Math.min(h, Math.ceil((t.y + t.h) / k));
    for(let yy = y0; yy < y1; yy++) m.fill(0, yy * w + x0, yy * w + x1); }
  // эрозия (grow=false): точка остаётся, если все 8 соседей «плотные»; наращивание (grow=true): если плотный хоть один
  const morph = (a, grow) => { const o = new Uint8Array(w * h);
    for(let yy = 0; yy < h; yy++) for(let xx = 0; xx < w; xx++){
      let any = 0, all = 1;
      for(let dy = -1; dy <= 1; dy++){ const Y = yy + dy; for(let dx = -1; dx <= 1; dx++){ const X = xx + dx;
        const p = X < 0 || Y < 0 || X >= w || Y >= h ? 0 : a[Y * w + X]; if(p) any = 1; else all = 0; } }
      o[yy * w + xx] = grow ? any : all; }
    return o; };
  m = morph(morph(m, false), true);                 // убираем тонкие линии и буквы
  for(let i = 0; i < 3; i++) m = morph(m, true);    // склеиваем стены и комнаты в одну область
  const lab = new Int32Array(w * h); let best = null, id = 0; const st = [];
  for(let s = 0; s < w * h; s++){ if(!m[s] || lab[s]) continue; id++; let x0 = w, y0 = h, x1 = 0, y1 = 0, n = 0; st.push(s); lab[s] = id;
    while(st.length){ const p = st.pop(), px = p % w, py = (p / w) | 0; n++; if(px < x0) x0 = px; if(px > x1) x1 = px; if(py < y0) y0 = py; if(py > y1) y1 = py;
      for(const q of [p - 1, p + 1, p - w, p + w]){ if(q < 0 || q >= w * h || lab[q] || !m[q]) continue; if((q === p - 1 && px === 0) || (q === p + 1 && px === w - 1)) continue; lab[q] = id; st.push(q); } }
    if(pdf && (y0 < 0.15 * h || x0 > 0.55 * w || (y1 - y0) < 0.15 * h)) continue;
    const area = (x1 - x0) * (y1 - y0); if(!best || area > best.area) best = {area, x0, y0, x1, y1}; }
  if(!best) return null;
  return {x0:best.x0 * k, y0:best.y0 * k, x1:(best.x1 + 1) * k, y1:(best.y1 + 1) * k};
}
// Вырезаем рамку, закрашиваем серые плашки макета, салатовые элементы и заданные прямоугольники (табличка с площадью)
function cropClean(src, box, {erase = []} = {}){
  const W = src.width, H = src.height, pad = Math.round(0.015 * Math.max(W, H));
  const x0 = Math.max(0, Math.floor(box.x0 - pad)), y0 = Math.max(0, Math.floor(box.y0 - pad)), x1 = Math.min(W, Math.ceil(box.x1 + pad)), y1 = Math.min(H, Math.ceil(box.y1 + pad));
  const w = x1 - x0, h = y1 - y0, c = canvasOf(w, h), x = c.getContext("2d", {willReadFrequently:true});
  x.fillStyle = "#fff"; x.fillRect(0, 0, w, h); x.drawImage(src, x0, y0, w, h, 0, 0, w, h);
  x.fillStyle = "#fff"; for(const r of erase) x.fillRect(r.x - x0, r.y - y0, r.w, r.h);
  const img = x.getImageData(0, 0, w, h), d = img.data;
  // серые плашки (237,239,235) — закрашиваем их прямоугольник целиком вместе с текстом
  const panel = new Uint8Array(w * h);
  for(let i = 0; i < w * h; i++) panel[i] = Math.abs(d[i * 4] - 237) + Math.abs(d[i * 4 + 1] - 239) + Math.abs(d[i * 4 + 2] - 235) < 10 ? 1 : 0;
  const seen = new Uint8Array(w * h), rects = [];
  for(let s = 0; s < w * h; s += 7){ if(!panel[s] || seen[s]) continue; let n = 0, a = w, b = h, cc = 0, dd = 0; const st = [s]; seen[s] = 1;
    while(st.length){ const p = st.pop(), px = p % w, py = (p / w) | 0; n++; if(px < a) a = px; if(px > cc) cc = px; if(py < b) b = py; if(py > dd) dd = py;
      for(const q of [p - 1, p + 1, p - w, p + w]) if(q >= 0 && q < w * h && !seen[q] && panel[q]){ seen[q] = 1; st.push(q); } }
    if(n > 0.004 * w * h) rects.push([a, b, cc, dd]); }
  for(const [a, b, cc, dd] of rects) for(let yy = b; yy <= dd; yy++) for(let xx = a; xx <= cc; xx++){ const i = (yy * w + xx) * 4; d[i] = d[i + 1] = d[i + 2] = 255; }
  for(let yy = 0; yy < h; yy++) for(let xx = 0; xx < w; xx++){ const i = (yy * w + xx) * 4, r = d[i], g = d[i + 1], b = d[i + 2];
    if(g > 180 && r > 120 && b < 170 && g - b > 60) for(let dy = -2; dy <= 2; dy++) for(let dx = -2; dx <= 2; dx++){ const X = xx + dx, Y = yy + dy; if(X >= 0 && Y >= 0 && X < w && Y < h){ const j = (Y * w + X) * 4; d[j] = d[j + 1] = d[j + 2] = 255; } } }
  x.putImageData(img, 0, 0);
  // не больше 1600 px по длинной стороне
  const s = Math.min(1, 1600 / Math.max(w, h)); if(s >= 1) return c;
  const o = canvasOf(Math.round(w * s), Math.round(h * s)); const ox = o.getContext("2d"); ox.imageSmoothingQuality = "high"; ox.drawImage(c, 0, 0, o.width, o.height); return o;
}

async function fromPdf(buf){
  const pdfjs = await loadPdfjs();
  const doc = await pdfjs.getDocument({data:buf}).promise, page = await doc.getPage(1);
  const vp = page.getViewport({scale:200 / 72}); const c = canvasOf(Math.round(vp.width), Math.round(vp.height));
  const ctx = c.getContext("2d"); ctx.fillStyle = "#fff"; ctx.fillRect(0, 0, c.width, c.height);
  await page.render({canvasContext:ctx, viewport:vp}).promise;
  const tc = await page.getTextContent(); const text = tc.items.map(i => i.str).join(" ").replace(/\s+/g, " ");
  const textRects = tc.items.filter(i => i.str && i.str.trim()).map(i => { const t = pdfjs.Util.transform(vp.transform, i.transform), fh = Math.hypot(t[2], t[3]); return {x:t[4] - 2, y:t[5] - fh - 2, w:i.width * vp.scale + 4, h:fh * 1.35 + 4}; });
  const box = planBox(c, {textRects, pdf:true}); if(!box) throw new Error("не нашли чертёж на листе");
  const info = {
    area: num((text.match(/Загальна\s+площа,?\s*м\s*2?\s*(\d{2,3}[,.]\d{1,2})/i) || text.match(/Общая\s+площадь,?\s*м\s*2?\s*(\d{2,3}[,.]\d{1,2})/i) || text.match(/(\d{2,3}[,.]\d{2})\s*м\s*2/) || [])[1]),
    rooms: /студ/i.test(text) ? 0 : num((text.match(/(\d)\s*-\s*(?:кімнатн|комнатн)/i) || [])[1]),
    floor: num((text.match(/(\d{1,2})\s*(?:поверх|этаж)/i) || [])[1]),
    no: num((text.match(/К\s*№\s*(\d+)/) || text.match(/(?:кв\.?|квартира)\s*№\s*(\d+)/i) || [])[1]),
  };
  return {canvas:cropClean(c, box), info};
}

async function fromImage(blob, name){
  const bmp = await createImageBitmap(blob); const c = canvasOf(bmp.width, bmp.height); c.getContext("2d").drawImage(bmp, 0, 0);
  const box = planBox(c); if(!box) throw new Error("не нашли чертёж на картинке");
  let area = areaInName(name), erase = [];
  // табличка «2K / тип / жилая / общая»: распознаём числа, самое большое — общая площадь; табличку закрашиваем
  try{
    const ocr = await loadOcr(); const {data} = await ocr.recognize(c);
    const nums = (data.words || []).map(wd => ({v:num((wd.text.match(/^(\d{2,3}[,.]\d{2})$/) || [])[1]), b:wd.bbox})).filter(x => x.v && x.v >= 15 && x.v <= 300);
    const top = nums.sort((a, b) => b.v - a.v)[0];
    if(top){ if(!area) area = top.v; const bw = top.b.x1 - top.b.x0, bh = top.b.y1 - top.b.y0;
      erase.push({x:top.b.x0 - bw * 1.1, y:top.b.y0 - bh * 2.4, w:bw * 2.3, h:bh * 3.6}); }
  }catch(e){ /* без распознавания — площадь только из имени файла */ }
  return {canvas:cropClean(c, box, {erase}), info:{area}};
}

// Обработать новые файлы ЖК. call(action, body, {raw}) — запрос к nb-unit-plans (с входом администратора или ключом задания).
export async function processUnitPlans({sourceId, call, onProgress = () => {}, limit = 60}){
  const scan = await call("scan", {source_id:sourceId});
  if(!scan?.ok) throw new Error(scan?.error || "не удалось проверить Диск");
  const list = (scan.pending || []).slice(0, limit); const done = [], failed = [];
  for(let i = 0; i < list.length; i++){
    const f = list[i]; onProgress({i, total:list.length, name:f.name});
    try{
      const res = await call("file", {source_id:sourceId, file_id:f.id}, {raw:true});
      if(!res.ok) throw new Error("файл не скачался");
      const blob = await res.blob(); if(/json/.test(blob.type)) throw new Error((await blob.text()).slice(0, 120));
      const isPdf = /pdf/i.test(blob.type) || /\.pdf$/i.test(f.name);
      const {canvas, info} = isPdf ? await fromPdf(await blob.arrayBuffer()) : await fromImage(blob, f.name);
      const png = canvas.toDataURL("image/png").split(",")[1];
      const meta = {name:f.name, section:f.section, modified:f.modified, stoyak:num((f.name.match(/стояк\s*(\d+)/i) || [])[1]),
        rooms:info.rooms ?? roomsOf(f.path) ?? roomsOf(f.name), area:info.area ?? areaInName(f.name), floor:info.floor, no:info.no, floors:floorsInName(f.name)};
      const s = await call("save", {source_id:sourceId, file_id:f.id, png, info:meta});
      if(!s?.ok) throw new Error(s?.error || "не сохранилось");
      done.push(s.item);
    }catch(e){ failed.push({name:f.name, error:e.message}); }
  }
  onProgress({i:list.length, total:list.length, done:true});
  return {done, failed, pending:(scan.pending || []).length};
}
