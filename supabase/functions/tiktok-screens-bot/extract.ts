// Разбор скриншота переписки TikTok: из строк OCR (с координатами) оставляем только нужное —
// имя клиента, его логин, его сообщения (там телефон / Telegram-ник). Всё остальное — служебное и выбрасывается:
// статус-бар, «CapCut», карточка профиля (читачі / дописи / «Стежить за вами» / «Переглянути профіль»),
// даты и «Переглянуто», наши ответы (пузыри справа), строка ввода и всё под ней, кнопки, значки.
export type Line = { t: string; c?: number; x0?: number; x1?: number; y0?: number; y1?: number };

// служебные строки целиком (кнопки, статусы) — короткие строки, совпадающие полностью
const SYS_LINE = /^(переглянуто|просмотрено|seen|відредаговано|изменено|edited|виклик|звонок|позвонить|call|вайбер|viber|telegram|whatsapp|номер телефону|номер телефона|phone number|прийняти|принять|accept|видалити|удалить|delete|поскаржитися|пожаловаться|report|заблокувати|заблокировать|block|відповісти|ответить|reply|надіслати|отправить|send|активн.*|в мережі|в сети|online|active now|переглянути профіль|посмотреть профиль|view profile|стежити|подписаться|follow|стежить за вами|подписан(а)? на вас|follows you|друзі|друзья|friends|lte|4g|5g|wi-?fi)$/i;
// служебные фрагменты в любом месте строки
const SYS_ANY = /(читач|подписчик|followers|дописів|публікаці|публикаци|\bposts\b|стежить за вами|подписан(а)? на вас|follows you|переглянути профіль|посмотреть профиль|view profile|напишіть повідомлення|напишите сообщение|send a message|message\.\.\.|повідомлення у whatsapp|сообщение в whatsapp|збережені відповіді|сохран[её]нные ответы|поділитися публікаці|поделиться публикаци|запит на (переписку|повідомлення)|запрос на переписку|message request|хоче надіслати вам|хочет отправить вам|wants to send you|capcut|переглянути \d+ відпов|посмотреть \d+ ответ|view \d+ repl)/i;
// дата/время в чате: «Сьогодні 23:17», «26 квіт. 2025 18:36», «Вчора», «12:05»
const DATE_LINE = /^((сьогодні|сегодня|вчора|вчера|today|yesterday)\b.*|\d{1,2}[:.]\d{2}(\s.*)?|\d{1,2} ?(січ|лют|бер|квіт|трав|черв|лип|серп|вер|жовт|лист|груд|янв|фев|мар|апр|ма[йя]|июн|июл|авг|сен|окт|ноя|дек|jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)\S*\.? ?(\d{4})?( \d{1,2}[:.]\d{2})?|(пн|вт|ср|чт|пт|сб|нд|вс)\b.*\d{1,2}[:.]\d{2})$/i;
const INPUT = /(напишіть повідомлення|напишите сообщение|send a message|message\.\.\.|^повідомлення\.\.\.|^сообщение\.\.\.)/i;
const NOT_NAME = /^(capcut|tiktok|instagram|safari|привіт|привет|вітаю|здравствуйте|добрий|добрый|доброго|доброе|hello|hi|повідомлення|сообщения|переглянути|стежить)(?!\p{L})/iu;
const LOGIN = /^@?([a-z0-9][a-z0-9._]{2,23})$/;

// убрать значки и мусор OCR по краям и внутри строки
export function tidy(s: string) {
  return s.replace(/[©®™|•·›‹«»<>~^*=#№§¢€£¥☺☻♡♥❤✓✔︎]+/g, " ").replace(/\s{2,}/g, " ")
    .replace(/^[^\p{L}\d+@(]+/u, "").replace(/[^\p{L}\d?!.)]+$/u, "").trim();
}
// строка в основном из букв/цифр (а не из обрывков значков)
const meaningful = (s: string) => { const n = (s.match(/[\p{L}\d]/gu) || []).length; return n >= 2 && n / s.replace(/\s/g, "").length >= 0.6; };
const isSys = (s: string) => SYS_LINE.test(s) || SYS_ANY.test(s) || DATE_LINE.test(s);
const nameOk = (s: string) => /^[\p{L}][\p{L}'’.\- ]{1,30}$/u.test(s) && s.split(" ").length <= 3 && s.split(" ").every((w) => w.replace(/[.'’-]/g, "").length >= 2) && !NOT_NAME.test(s);
const loginOf = (s: string) => { const m = tidy(s).toLowerCase().match(LOGIN); return m && /[a-z]/.test(m[1]) && !/^(pride|capcut)/.test(m[1]) ? m[1] : ""; };

export function extract(raw: Line[]) {
  // 1) чистим строки; статус-бар и пустое — прочь
  let L = raw.map((l) => ({ ...l, t: tidy(String(l.t || "")) })).filter((l) => l.t && meaningful(l.t))
    .filter((l) => !(/^\d{1,2}[:.]\d{2}\b/.test(l.t) && !/[а-яіїєґ]{3}/i.test(l.t) && (l.y0 ?? 1) < 0.08));
  // 2) строка ввода «Напишіть повідомлення…» и всё под ней (клавиатура, повтор переписки) — прочь
  const cut = L.findIndex((l) => INPUT.test(l.t));
  if (cut > 0) L = L.slice(0, cut);
  const hasPos = L.some((l) => typeof l.x0 === "number");

  // 3) имя и логин: из карточки профиля (имя / логин / «N читачів»), иначе из шапки чата
  let name = "", login = "", start = 0;
  const k = L.findIndex((l) => /(читач|подписчик|followers)/i.test(l.t));
  if (k >= 0) {
    for (let i = k - 1; i >= Math.max(0, k - 3); i--) {
      if (!login && loginOf(L[i].t)) { login = loginOf(L[i].t); continue; }
      if (!name && nameOk(L[i].t) && !loginOf(L[i].t)) { name = L[i].t; break; }
    }
    start = k + 1;
  }
  const head = L.slice(0, k >= 0 ? Math.max(0, k - 2) : Math.min(L.length, 3)).filter((l) => !hasPos || (l.y0 ?? 0) < 0.2);
  if (!name) for (const l of head) {
    const cap = l.t.match(/^([A-ZА-ЯІЇЄҐ][\p{L}'’-]{1,20}(?: [A-ZА-ЯІЇЄҐ][\p{L}'’-]{1,20})?)(?![\p{L}\d])/u)?.[1];
    if (cap && !NOT_NAME.test(cap) && !isSys(l.t)) { name = cap; break; }
  }
  if (!login) for (const l of head) { const lg = loginOf(l.t); if (lg) { login = lg; break; } }
  if (k < 0 && hasPos) start = L.findIndex((l) => (l.y0 ?? 0) >= 0.12 && !head.includes(l)); // после шапки
  if (start < 0) start = 0;

  // 4) сообщения: только пузыри клиента (слева); наши ответы (справа) и служебное по центру — прочь
  const body = L.slice(start).filter((l) => !isSys(l.t) && !(login && loginOf(l.t) === login) && !(name && l.t === name));
  const side = (l: Line) => !hasPos || typeof l.x0 !== "number" ? "client" : l.x0 < 0.26 ? "client" : (l.x1 ?? 0) > 0.7 ? "ours" : "center";
  const client = body.filter((l) => side(l) === "client");
  // строки одного пузыря склеиваем в абзац
  const paras: string[] = []; let prev: Line | null = null;
  for (const l of client) {
    const lh = (l.y1 ?? 0) - (l.y0 ?? 0);
    const same = prev && hasPos && (l.y0 ?? 0) - (prev.y1 ?? 0) < lh * 0.9;
    if (same) paras[paras.length - 1] += " " + l.t; else paras.push(l.t);
    prev = l;
  }
  const seen = new Set<string>();
  const msgs = paras.filter((p) => { const key = p.toLowerCase().replace(/[^\p{L}\d]/gu, ""); if (!key || seen.has(key)) return false; seen.add(key); return true; });
  // текст, где искать телефон: сначала сообщения клиента, потом всё, кроме наших ответов
  const notOurs = body.filter((l) => side(l) !== "ours").map((l) => l.t).join("\n");
  return { name, login, messages: msgs, searchText: msgs.join("\n"), fallbackText: notOurs };
}
