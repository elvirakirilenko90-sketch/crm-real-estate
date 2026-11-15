// lead-import v13 — загрузка лидов списком, из таблицы Excel (колонки настроены менеджером) и из скриншотов переписки.
// v13: имя — только «Имя Фамилия» (без ников, латинских дублей, отчества, приписок); источник не дублируется в заметку.
// v12: «Руководство» / «Керівництво» (с Тик-ток или без) — источник «Тик-Ток рабочий».
// v11: любая дата в строке (дд.мм.гггг) — дата лида; «олх» в любом написании где угодно — источник ОЛХ;
//      «Руководство тик-ток» — Тик-Ток рабочий; источники приводятся к списку CRM; имя с большой буквы из описания.
// v10: имя в описании находится и с маленькой буквы («тикток, светлана 2к»).
// v9: «Источник клиентов» больше не принимается за колонку «Имя»; имя ищется в описании, если колонки имени нет.
// v8: preview принимает rows — готовые строки из таблицы (имя, телефон, источник, этап, дата, ответственный, заметка);
//     для таких строк этап из таблицы сохраняется (keep_stage), иначе — как раньше «Новый Лид».
// POST { mode: "preview" | "commit" | "decide", text?, images?, ai_text?, manager_email?, source?, leads?, id?, action? }
// Кто вызывает — определяется по токену входа: агентство и права берутся из таблицы users.
//  preview: разбирает список/скриншоты → лиды с пометками. Ничего не пишет. Дубли показываются только администратору.
//  commit:  добавляет новых клиентов этапом «Новый Лид» на выбранных менеджеров. Существующие карточки НЕ меняет.
//           Дубль: администратор может всё равно добавить его новым лидом (связь пишется в lead_duplicates);
//           дубль от менеджера не сохраняется, а уходит администратору на решение (lead_duplicates, status=pending).
//  decide:  администратор по дублю на проверке: approve (отдать в работу менеджеру) или reject.
const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization,apikey,content-type,x-client-info",
  "content-type": "application/json; charset=utf-8",
};
const URL_ = Deno.env.get("SUPABASE_URL")!;
const SERVICE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const ANON = Deno.env.get("SUPABASE_ANON_KEY") || "";
const AI_KEY = Deno.env.get("ANTHROPIC_API_KEY") || "";
const AI_MODEL = Deno.env.get("LEAD_AI_MODEL") || "claude-sonnet-5-5";
const TECH = "Администратор тех отдел";
const DIRECTOR = "Администратор директор";
const MAX_IMAGES = 10;

type Lead = {
  name: string; phone: string; source: string; notes: string;
  next_contact_at: string | null; warnings: string[]; duplicate_of?: number | null;
  stage?: string; lead_date?: string | null; manager_email?: string; manager_name?: string; _noYear?: boolean;
};
const NO_YEAR = /^(\d{1,2}[.\/-]\d{1,2}|\d{1,2}\s+[а-яіїє]{3,}\.?)$/i;
// Дата без года («01.11») берёт год у ближайшей строки списка, где год указан
function fillYears(rows: any[]) {
  const now = new Date();
  rows.forEach((r, i) => {
    if (!r || !r._noYear || !r.lead_date) return;
    let ref: any = null;
    for (let k = 1; k < rows.length && !ref; k++) for (const j of [i - k, i + k]) {
      const x = rows[j]; if (!ref && x && x.lead_date && !x._noYear) ref = x;
    }
    if (ref) {
      let y = +ref.lead_date.slice(0, 4);
      const md = r.lead_date.slice(4);
      if (new Date(`${y}${md}T00:00:00`) > now) y -= 1;
      const old = r.lead_date; r.lead_date = `${y}${md}`;
      r.notes = r.notes.replace(`Дата лида: ${fmtDate(old)}`, `Дата лида: ${fmtDate(r.lead_date)}`);
    }
  });
  rows.forEach((r) => { if (r) delete r._noYear; });
}
type Staff = { id: number; full_name: string; email: string; role: string; agency_id: number | null };

const STAGES = ["Новый Лид","Первый контакт","В работе","Назначена встреча","Проведена встреча","Думает","Задаток","Сделка","Отказ","Отложили"];
// Этап по словам в конце строки (первое совпадение по порядку важности)
const STAGE_RULES: [RegExp, string][] = [
  [/отказ|відмов|не\s*актуал|неактуал|слил|не\s*интерес|у других|у інших|передумал|не будет|не буде/i, "Отказ"],
  [/сделк|угод|продал|купил|закрыл|оформил|нотариус/i, "Сделка"],
  [/задат|завдат|аванс|бронь|забронир/i, "Задаток"],
  [/проведен[а-яёіїєґ]* встреч|был[аи]? на показ|показ (был|провел)|посмотрел[аи]?/i, "Проведена встреча"],
  [/встреч|показ|назначил/i, "Назначена встреча"],
  [/думает|дума[ею]т|подума|розмірков/i, "Думает"],
  [/отлож|відклад|позже|после праздник|весной|летом|осенью|зимой/i, "Отложили"],
  [/в работе|у роботі|подбира|подбор/i, "В работе"],
  [/созвон|поговорил|на связи|первый контакт/i, "Первый контакт"],
];
const MONTHS: Record<string, number> = { янв: 1, січ: 1, фев: 2, лют: 2, мар: 3, бер: 3, апр: 4, кві: 4, мая: 5, май: 5, тра: 5, июн: 6, чер: 6, июл: 7, лип: 7, авг: 8, сер: 8, сен: 9, вер: 9, окт: 10, жов: 10, ноя: 11, лис: 11, дек: 12, гру: 12 };

// «12.05», «12.05.26», «12/05/2026», «12 мая», «12 травня 2026» → YYYY-MM-DD (без года — ближайшая прошедшая дата)
function parseDate(s: string): string | null {
  const t = s.trim().toLowerCase();
  let d = 0, m = 0, y = 0;
  let x = t.match(/^(\d{1,2})[.\/-](\d{1,2})(?:[.\/-](\d{2,4}))?\s*(?:г\.?|р\.?)?$/);
  if (x) { d = +x[1]; m = +x[2]; y = x[3] ? +x[3] : 0; }
  else if ((x = t.match(/^(\d{1,2})\s+([а-яіїє]{3,})\.?(?:\s+(\d{2,4}))?\s*(?:г\.?|р\.?)?$/))) {
    const key = Object.keys(MONTHS).find((k) => x![2].startsWith(k));
    if (!key) return null;
    d = +x[1]; m = MONTHS[key]; y = x[3] ? +x[3] : 0;
  } else return null;
  if (d < 1 || d > 31 || m < 1 || m > 12) return null;
  const now = new Date();
  if (y && y < 100) y += 2000;
  if (!y) { y = now.getFullYear(); if (new Date(y, m - 1, d) > now) y -= 1; }
  return `${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
}

// Риэлтор по фамилии или имени (с учётом окончаний: «Русакова» → «Русаков»)
function findStaff(part: string, staff: Staff[]): Staff | null {
  const words = part.toLowerCase().replace(/[^a-zа-яёіїєґ'’\s-]/gi, " ").split(/\s+/).filter((w) => w.length >= 3);
  if (!words.length || words.length > 3) return null;
  let best: Staff | null = null, score = 0;
  for (const s of staff) {
    const names = String(s.full_name || "").toLowerCase().split(/\s+/).filter((w) => w.length >= 3);
    for (const w of words) for (const n of names) {
      const stem = Math.min(n.length, w.length, 5);
      const sc = w === n ? 3 : (n.slice(0, stem) === w.slice(0, stem) && stem >= 4 ? 2 : 0);
      if (sc > score) { score = sc; best = s; }
    }
  }
  return score >= 2 ? best : null;
}

const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: CORS });

async function rest(path: string, init: RequestInit = {}) {
  const r = await fetch(`${URL_}/rest/v1/${path}`, {
    ...init,
    headers: { apikey: SERVICE, authorization: `Bearer ${SERVICE}`, "content-type": "application/json", ...(init.headers || {}) },
  });
  if (!r.ok) throw new Error(`База: ${r.status} ${(await r.text()).slice(0, 300)}`);
  return r.status === 204 ? null : r.json();
}

// Пользователь CRM по токену входа
async function caller(req: Request) {
  const auth = req.headers.get("authorization") || "";
  const r = await fetch(`${URL_}/auth/v1/user`, { headers: { authorization: auth, apikey: ANON || SERVICE } });
  if (!r.ok) throw new Error("Нужно войти в CRM");
  const u = await r.json();
  const email = String(u?.email || "").toLowerCase();
  const rows = await rest(`users?select=id,full_name,email,role,agency_id,access,status&email=ilike.${encodeURIComponent(email)}`);
  const me = (rows || []).find((x: any) => String(x.email || "").toLowerCase() === email);
  if (!me || me.access === false || (me.status && me.status !== "active")) throw new Error("Доступ к CRM закрыт");
  return me;
}

// Телефон → +380XXXXXXXXX (Украина), другие страны — цифры с «+»
const normPhone = (raw: string) => {
  let d = String(raw || "").replace(/\D/g, "");
  if (!d) return "";
  if (d.length === 10 && d.startsWith("0")) d = "38" + d;
  if (d.length === 9) d = "380" + d;
  return "+" + d;
};
const isExcelBroken = (s: string) => /\d[,.]\d+E\+?\d+/i.test(s);
const looksPhone = (s: string) =>
  !isExcelBroken(s) && String(s).replace(/\D/g, "").length >= 9 && /^[\d\s+()\-.]+$/.test(String(s).trim());
// Ник в Telegram вместо телефона: @username или t.me/username
const NICK_RE = /^(?:(?:тг|tg|телеграм+|telegram)\s*:?\s*)?(?:@|https?:\/\/t\.me\/|t\.me\/)([A-Za-z0-9_]{4,32})$/i;
const nickOf = (s: string) => { const m = String(s || "").trim().match(NICK_RE); return m ? "@" + m[1] : ""; };
// Телефон или ник — то, что пишется в поле «Телефон»
const normContact = (v: string) => nickOf(v) || normPhone(v);
const contactKey = (v: string) => (nickOf(v) ? nickOf(v).toLowerCase() : normPhone(v));
// Порядковый номер в начале строки («1.», «12)», «3 -», «4 ») перед телефоном или ником
const ORDINAL = /^\s*\d{1,4}\s*(?:[.)\-–—:]\s*|\s+)(?=[+@0(]|38|3[,.]8|t\.me|тг|tg)/i;
// «10. Михаил 0970…» — номер с точкой/скобкой перед именем
const ORDINAL_NAME = /^\s*\d{1,4}\s*[.)]\s*(?=[A-Za-zА-Яа-яЁёІіЇїЄєҐґ])/;
const stripOrdinal = (line: string) => line.replace(/^\s*[•●▪*·]+\s*/, "").replace(ORDINAL, "").replace(ORDINAL_NAME, "");
// Подзаголовок-источник над списком: «Тик-ток», «Инста:», «Телеграмм»
const SOURCE_HEADERS: [RegExp, string][] = [
  [/^(тик-?ток|tik-?tok|тт)$/i, "Тик-Ток рабочий"],
  [/^(инст[a-zа-яёіїєґ]*|інст[a-zа-яёіїєґ]*|insta[a-zа-яёіїєґ]*)$/i, "Инстаграм рабочий"],
  [/^(телегр[a-zа-яёіїєґ]*|telegram|тг|tg)(\s*-?\s*канал)?$/i, "Телеграмм-канал рабочий"],
  [/^(фейсбук|facebook|фб|fb)$/i, "Фейсбук рабочий"],
  [/^(олх|olx)$/i, "ОЛХ"],
  [/^рекоменд[a-zа-яёіїєґ]*$/i, "Рекомендации"],
  [/^повторн[a-zа-яёіїєґ]*( клиент[a-zа-яёіїєґ]*)?$/i, "Повторный клиент"],
];
const sourceHeader = (line: string) => {
  const t = line.trim().replace(/[:：.\-–—]+$/, "").trim();
  if (!t || /\d/.test(t) || t.split(/\s+/).length > 3) return "";
  for (const [re, src] of SOURCE_HEADERS) if (re.test(t)) return src;
  return "";
};
const PHONE_IN_TEXT = /(?:\+?\d{1,3}[\s\-]?)?\(?0?\d{2,3}\)?[\s\-]?\d{3}[\s\-]?\d{2}[\s\-]?\d{2}/;

// ОЛХ в любом написании: олх, ОЛХ, Олх, olx, OLX, о.л.х, олкс
const LI_OLX = /(?:^|[^а-яёіїєґa-z])[оo]\.?\s?[лl]\.?\s?[хx]|олкс|olks/i;
// Любая дата цифрами в тексте: 12.11.2026, 12.11.26, 12/11/2026
function liDateInText(text: string): string | null {
  const m = String(text || "").match(/(?:^|[^\d])(\d{1,2})[./-](\d{1,2})[./-](\d{4}|\d{2})(?!\d)/); if (!m) return null;
  const d = +m[1], mo = +m[2]; let y = +m[3]; if (y < 100) y += 2000;
  if (d < 1 || d > 31 || mo < 1 || mo > 12 || y < 2000 || y > 2100) return null;
  return `${y}-${String(mo).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
}
// Источник → значение из списка CRM («Звонок с Олх» → ОЛХ, «Руководство тик-ток» → Тик-Ток рабочий)
const CRM_SOURCES = ["Повторный клиент","Рекомендации","ОЛХ","Лид руководство","Инстаграм личный","Тик-Ток личный","Фейсбук личный","Тик-Ток рабочий","Инстаграм рабочий","Фейсбук рабочий","Телеграмм-канал рабочий","Рекомендации клиентов"];
function crmSource(text: string): string {
  const t = String(text || "").toLowerCase().replace(/ё/g, "е").replace(/\s+/g, " ").trim(); if (!t) return "";
  if (LI_OLX.test(t)) return "ОЛХ";
  if (/руковод|керівн|^рук\.?$/.test(t)) return "Тик-Ток рабочий"; // «Руководство», «Руководство Тик-ток», «Керівництво»
  const exact = CRM_SOURCES.find((x) => x.toLowerCase() === t); if (exact) return exact;
  const personal = /личн|особ|мой|мій/.test(t);
  if (/тик|tik/.test(t)) return personal ? "Тик-Ток личный" : "Тик-Ток рабочий";
  if (/инст|інст|insta/.test(t)) return personal ? "Инстаграм личный" : "Инстаграм рабочий";
  if (/фейс|face/.test(t)) return personal ? "Фейсбук личный" : "Фейсбук рабочий";
  if (/телег|telegr/.test(t)) return "Телеграмм-канал рабочий";
  if (/повтор/.test(t)) return "Повторный клиент";
  if (/рекоменд/.test(t)) return /клиент|клієнт/.test(t) ? "Рекомендации клиентов" : "Рекомендации";
  return "";
}
const SPLIT = /\t|;|\s\|\s|,(?!\d)/;
// Копия из Excel/Google Таблиц — колонки через табуляцию: запятые внутри описания колонку не делят
const splitCells = (line: string) => line.includes("\t") ? line.split("\t") : line.split(SPLIT);
const NAME_RE = /^[A-Za-zА-Яа-яЁёІіЇїЄєҐґ'’\-\s.]{2,40}$/;
// Короткая ячейка с названием площадки — это источник
const SOURCE_RE = /^(тик-?ток|tik-?tok|инста|інста|insta|телегр|telegr|фейсбук|facebook|fb\b|viber|вайбер|whats|olx|олх|дом\.?риа|dim\.?ria|dom\.?ria|лун|lun|rieltor|сайт|site|рекоменд|повторн|звонок|дзвінок|реклам|google|гугл|youtube|ютуб|авито|лид|лід|эля|еля|руковод|керівн)/i;
// Порядок проверки важен: «Источник клиентов», «Телефон клиента», «Описание клиента» — не имя, хотя есть слово «клиент».
const HEADER = {
  source: /источ|джерел|source|канал|откуда|звідки|тип лида|тип ліда|тип клиент|тип клієнт|площадк/i,
  phone: /телеф|phone|номер|(?:^|[^а-яёіїєґ])тел(?:[^а-яёіїєґ]|$)/i,
  notes: /замет|нотат|коммент|комент|note|запрос|запит|описан|опис|примеч|приміт|решени|рішенн/i,
  name: /имя|ім['’]я|фио|піб|name|клиент|клієнт/i,
};

// Имя клиента в описании: «зовут Оля», «Олег, ищет 2к», «Сергей Власов 067…», «… клиентка Ирина …».
// Не берём площадки и сотрудников: «Эля лиды», «Тикток Владимирович», «от Эльвиры».
const LI_FIRST_NAMES = new Set(("александр олександр саша алекс алексей олексій леша лёша андрей андрій андрюша антон артем артём артур богдан борис вадим валентин валерий валерій василий василь вася виктор віктор витя виталий віталій влад владислав владимир володимир вова володя вячеслав слава геннадий геннадій гена георгий георгій гоша глеб гліб григорий григорій гриша давид данил даниил данило денис дмитрий дмитро дима евгений євген женя егор єгор иван іван ваня игорь ігор илья ілля кирилл кирило константин костянтин костя леонид леонід лёня максим макс марк матвей матвій михаил михайло миша назар никита микита николай микола коля олег павел павло паша петр пётр петро петя роман рома руслан сергей сергій сережа серёжа семен семён станислав стас степан тарас тимур тимофей тимофій федор фёдор федір филипп пилип юрий юрій юра ярослав ян эдуард едуард эрик ерік арсен арсений арсеній аркадий аркадій вениамин ростислав святослав всеволод захар лев марат рустам эмиль анатолий анатолій толя эльдар геннадий остап любомир мирослав зиновий тимофей кирил кіріл кирило данило даниил гавриил марьян мар'ян марян орест богдан ілько ілля жорж эрнест альберт рафаэль ринат тагир армен ашот гоги давид нодар заур вугар сабина "
  + "александра олександра алена альона алёна алина аліна алиса аліса алла анастасия анастасія настя анна ганна аня анжела анжелика антонина валентина валерия валерія варвара вера віра вероника вероніка виктория вікторія вика віка галина галя дарья дарина дарія даша диана діана ева єва евгения євгенія екатерина катерина катя елена олена лена елизавета єлизавета лиза зоя инна інна ирина ірина ира іра карина кристина ксения ксенія ксюша лариса лилия лілія люба любовь любов людмила люда маргарита рита марина мария марія маша милана мілана надежда надія надя наталья наталия наталія наташа нина ніна оксана ольга оля полина поліна раиса светлана світлана света софия софія соня тамара татьяна тетяна таня ульяна уляна юлия юлія юля яна снежана сніжана жанна эвелина евеліна элина еліна сусанна регина регіна лидия лідія майя злата олеся леся мирослава ярослава богдана владислава василиса василина христина кира кіра нелли неля дина лана ангелина ангеліна стефания стефанія виолетта віолетта эмилия емілія алёна жана мила роза эмма лиана ліана натали наталі натали натэлла марьяна мар'яна мар'яна марʼяна аріна арина ярина зоряна соломія мирослава таисия таїсія фаина фаїна эльмира ельміра эльза лейла камила камилла амина диляра алсу гульнара"
  + " alex alexander anna maria olga irina elena natalia sergey andrey dmitry ivan oleg").split(/\s+/).filter(Boolean));
// Слова, с которых описание начинается, но это не имя
const LI_NOT_NAME = /^(ищ|шука|хоч|хот|нужн|нуж|потріб|купи|прода|сня|зня|сда|зда|квартир|дом|будин|участ|ділян|жк|клиент|клієнт|покуп|бюдж|цен|ціна|район|звон|дзвон|перезв|передзв|нет$|не$|ні$|да$|так$|был|бул|прос|интерес|цікав|рассм|розгл|смотр|дивит|отправ|відправ|скину|сдела|зроби|договор|домов|для$|от$|від$|по$|на$|без$|срочн|термін|инвест|інвест|семь|сім|пара$|муж|чолов|жена|дружин|олх|olx|тик|tik|инст|інст|insta|фейс|face|теле|вайб|viber|whats|комн|кімн|однуш|двуш|трешк|трёшк|студи|новостр|новобуд|вторич|вторин|аренд|оренд|продаж|покупк|рассроч|розстроч|ипот|іпот|налич|готівк|сегодн|сьогодн|завтр|вчера|вчора|эля$|еля$|лид|лід|повтор|рекоменд|думает|думают|отказ|відмов|задат|показ|встреч|зустр|сделк|угод|нов|в работе|е-?осел|є-?осел|э-?осел|одес|київ|киев|ірпін|ирпен|львов|львів|днепр|дніпр|харьк|харків|приморск|центр|заграниц|за кордон|уехал|молча|номер|телеф|тел$|запрос|запит|комент|коммент|примеч|опис|дата|источ|джерел|этап|етап|статус|менедж|риэлт|ріелт|агент|владимирович|керівн|руковод|таунх|мистер|містер|пан$|пані$|господин)/i;
// Имена, которые с маленькой буквы — обычные слова («вера», «роман», «слава»): их берём только с заглавной
const LI_AMBIG = /^(вера|віра|надежда|надія|любовь|любов|люба|слава|роман|лев|марк|мила|роза|макс|лана|дина|ян|яна|лиза|рита|ира|іра|ева|єва|алла|майя|злата|кира|кіра|нина|ніна|оля|стас|гена|влад|ганна|лена|настя|даша)$/i;
// ЖК, районы, города и прочие слова с большой буквы, которые не имя
const LI_PLACES = /^(атмосфер|омег|акварел|кадор|гефест|элад|еллад|эллад|кимолос|таиров|аркади|фонтан|дмитриевск|чимбер|тредс|жемчуж|перл|пороховой|черемушк|котовск|поселок|селище|молдаван|приморск|киевск|суворовск|малиновск|хаджибей|люстдорф|черноморск|чорноморськ|затока|авангард|лиманк|усатов|совиньон|крыжанов|фонтанк|александровк|таирово|бугаевк|слобод|пересып|центр|аркадия|дерибас|гагарин|сегедск|ковалевск|генуэзск|литературн|французск|армейск|розов|радужн|альтаир|альтаїр|итал|італ|америк|европ|польш|молдов|израил|герман|канад|киев|киев|одесс|одес|харьк|днепр|львов|ирпен|буча|кадор|е-?оселя|є-?оселя|эоселя|еоселя|єоселя|ипотек|рассрочк|whatsapp|viber|telegram|instagram)/i;
// частые слова в начале фразы — не имя
const LI_COMMON = /^(еще|ещё|уже|только|все|всё|вся|весь|сейчас|пока|тоже|также|очень|хорошо|плохо|ок|окей|мама|папа|сын|дочь|дочка|брат|сестра|подруга|друг|муж|жена|сама|сам|она|он|они|мы|вы|я|ее|её|его|их|это|этот|эта|эти|тот|та|те|там|тут|здесь|когда|если|как|что|где|чем|или|но|и|а|просто|сразу|надо|нужно|можно|нельзя|будет|будут|есть|нет|да|хочу|хочет|хотят|ждет|ждёт|ждем|ждём|жду|молчит|молчание|молчанка|занят|занята|заняты|позже|потом|завтра|сегодня|вчера|утром|вечером|летом|зимой|весной|осенью|после|перед|через|около|почти|вообще|снова|опять|давно|недавно|скоро|вроде|наверное|может|возможно|кажется|говорит|сказал|сказала|написал|написала|ответил|ответила|клиентка|клиент|покупатель|продавец|собственник|хозяин|хозяйка|инвестор|военный|пенсионер|студент|семья|пара|дети|ребенок|ребёнок|квартира|дом|участок|студия|однушка|двушка|трешка|трёшка|ремонт|бюджет|взнос|первый|второй|третий|ипотека|рассрочка|наличные|кэш|деньги|доллары|гривны|цена|торг|срочно|сдача|сдан|сданный|новострой|вторичка|море|вид|этаж|балкон|парковка|школа|сад|центр|район|город|область|украина|одесса|киев|днепр|львов|харьков|понедельник|вторник|среда|четверг|пятница|суббота|воскресенье|январь|февраль|март|апрель|май|июнь|июль|август|сентябрь|октябрь|ноябрь|декабрь)$/i;
// окончания глаголов, прилагательных и существительных, которыми имена почти не заканчиваются
const LI_WORD_END = /(ть|ться|ла|ли|ло|ет|ёт|ит|ут|ют|ат|ят|ал|ял|ил|ел|ый|ий|ой|ое|ые|ая|яя|ое|ом|ем|ам|ям|ях|ах|ми|ов|ск|цк|ия|шка|чка|ние|ция|сть|ство)$/;
const LI_W = "[A-Za-zА-ЯЁІЇЄҐа-яёіїєґ'’-]";
const liCap = (w: string) => w ? w.charAt(0).toUpperCase() + w.slice(1).toLowerCase() : "";
const liIsName = (w: string) => LI_FIRST_NAMES.has(String(w || "").toLowerCase().replace(/[’']/g, "'"));
// фамилия или отчество после имени: «Власов», «Шевченко», «Владимирович»
const LI_SURNAME = /^[А-ЯЁІЇЄҐA-Z][а-яёіїєґa-z'’-]*(ов|ев|ёв|ин|ын|ко|ук|юк|чук|як|ий|ой|ая|ова|ева|ина|ына|ська|цька|ський|цький|енко|ович|евич|овна|евна|івна|ївна|ич)$/;
function liNameFromText(text: string, exclude: string[] = [], loose = false): string {
  const t = String(text || "").replace(/\s+/g, " ").trim(); if(!t) return "";
  const skip = new Set(exclude.map(x => String(x || "").toLowerCase()));
  const words = [...t.matchAll(new RegExp(`${LI_W}+`, "g"))].map((m) => ({ w: m[0], i: m.index as number }));
  const ok = (k: number) => { const x = words[k]; if(!x) return false; const lw = x.w.toLowerCase();
    if(lw === "эля" || lw === "еля") return false;                                                         // «Эля лиды» — источник
    const prev = (words[k - 1]?.w || "").toLowerCase(), next = (words[k + 1]?.w || "").toLowerCase();
    if(/^(от|від|у|менеджер|риэлтор|риелтор|ріелтор|агент|риэлтора|менеджера)$/.test(prev)) return false; // «от Эльвиры»
    if(skip.has(lw) && /^(лид|лиды|лід|ліди|ліда|лида)$/.test(next)) return false;                         // «Марина лиды» — сотрудник
    return true; };
  const withSurname = (k: number) => { const nx = words[k + 1]; const between = nx ? t.slice(words[k].i + words[k].w.length, nx.i) : "";
    return liCap(words[k].w) + (nx && /^\s+$/.test(between) && LI_SURNAME.test(nx.w) && !LI_NOT_NAME.test(nx.w) && !liIsName(nx.w) && /[а-яё]/i.test(nx.w) ? " " + nx.w : ""); };
  // 1) «зовут Оля», «имя: Олег», «клиентка Ирина»
  const mk = t.match(new RegExp(`(?:зовут|звати|имя|ім['’]я|клиент(?:ка)?|клієнт(?:ка)?|покупатель(?:ница)?|покупець)\\s*[:\\-–—]?\\s*(${LI_W}{2,20})`, "i"));
  if(mk && (liIsName(mk[1]) || /^[А-ЯЁІЇЄҐA-Z]/.test(mk[1])) && !LI_NOT_NAME.test(mk[1])){ const k = words.findIndex((x) => x.i === ((mk.index as number) + mk[0].length - mk[1].length)); if(k >= 0 && ok(k)) return withSurname(k); }
  // 2) первое известное имя с заглавной буквы (или в самом начале описания)
  for(const latin of [false, true]) for(let k = 0; k < words.length; k++){ const w = words[k].w;
    if(/[a-z]/i.test(w) !== latin) continue;
    if(liIsName(w) && (/^[А-ЯЁІЇЄҐA-Z]/.test(w) || k === 0 || !LI_AMBIG.test(w)) && ok(k)) return withSurname(k); }
  // 3) «Ярема 067…», «Ярема - +380…» — слово с заглавной в начале, сразу за ним телефон
  const lead = t.match(new RegExp(`^(${LI_W}{2,20})(?:\\s+(${LI_W}{2,20}))?\\s*[,:;—–-]?\\s*\\+?\\(?\\d{3}`));
  if(lead && /^[А-ЯЁІЇЄҐA-Z]/.test(lead[1]) && !LI_NOT_NAME.test(lead[1]) && ok(0)) return withSurname(0);
  // 4) свободный режим (описание без колонки «Имя»): первое слово с большой буквы, похожее на имя.
  //    Не берём: ЖК, города и районы, площадки, слова после «в/на/из/ЖК», глаголы и прилагательные по окончанию, СЛОВА КАПСОМ.
  if(loose) for(let k = 0; k < words.length; k++){ const w = words[k].w; const prev = (words[k - 1]?.w || "").toLowerCase();
    if(!/^[А-ЯЁІЇЄҐ][а-яёіїєґ'’-]{1,14}$/.test(w) || LI_NOT_NAME.test(w) || LI_PLACES.test(w) || LI_COMMON.test(w)) continue;
    if(/^(в|во|на|из|із|с|со|з|у|до|по|под|під|за|к|ко|о|об|про|возле|біля|жк|в\s*жк|район|ул|вул|улица|вулиця)$/.test(prev)) continue;
    if(LI_WORD_END.test(w.toLowerCase())) continue;
    if(ok(k)) return withSurname(k); }
  return "";
}


// ИМЯ КЛИЕНТА = «Имя Фамилия». Только имя и, если есть, фамилия.
// Отбрасываем: ники (cocker_truffle, Barbie), латинские дубли (Daria Дарія), отчество (Вʼячеславівна), приписки («СК База», «ТХ», «кв»),
// повтор имени («Витя Віктор ВЛАДИМИР» → Витя). КАПС исправляем: «Берц НАТАЛІЯ» → «Наталія Берц».
const LI_PATRONYMIC_END = /(ович|евич|йович|івна|ївна|овна|евна|ична|інічна|ічна|ійович|ьович)$/i;
// отчество — только если начало слова совпадает с мужским именем («Ігорович», «Василівна»); «Минкович» — фамилия
const LI_PATRONYMIC = { test: (w: string) => { const lw = String(w || "").toLowerCase().replace(/['’ʼ]/g, ""); if(!LI_PATRONYMIC_END.test(lw)) return false;
  for(const n of LI_FIRST_NAMES){ const nn = n.replace(/['’ʼ]/g, ""); if(nn.length >= 4 && lw.startsWith(nn.slice(0, Math.max(4, nn.length - 2)))) return true; } return false; } };
// окончания фамилий — для слова перед именем («Плиндіна Олена»)
const LI_SURNAME_END = /(ов|ев|ёв|єв|ин|ін|їн|ын|ко|ук|юк|чук|як|ий|ой|ая|ова|ева|єва|ина|іна|їна|ына|ська|цька|ський|цький|енко|ович|евич|ич|ак|ик|ер|ман|берг|ян|дзе|швили|ець|ц)$/i;
// ласкательные формы — это не фамилия («Женечка Евгения»)
const LI_DIMINUTIVE = /(ечка|очка|ичка|енька|онька|уля|юля|уся|юша|ушка|юшка|енок|онок)$/i;
// латинские буквы-двойники внутри кириллического слова («Дeнuс» → «Денис»)
const LI_LOOKALIKE: Record<string, string> = {a:"а",e:"е",o:"о",p:"р",c:"с",x:"х",y:"у",k:"к",m:"м",t:"т",h:"н",b:"в",i:"і",u:"и",A:"А",E:"Е",O:"О",P:"Р",C:"С",X:"Х",Y:"У",K:"К",M:"М",T:"Т",H:"Н",B:"В",I:"І"};
const liFixMixed = (w: string) => /[а-яёіїєґ]/i.test(w) && /[a-z]/i.test(w) ? w.replace(/[a-zA-Z]/g, (ch: string) => LI_LOOKALIKE[ch] || ch) : w;
function liCleanName(raw: string): string {
  const src = String(raw || "").replace(/[ʼ’`]/g, "'").trim(); if(!src) return "";
  const words = src.split(/[\s,;.·|/\\()]+/).filter(Boolean).map(liFixMixed);
  const isCyr = (w: string) => /^[А-ЯЁІЇЄҐа-яёіїєґ][А-ЯЁІЇЄҐа-яёіїєґ'-]+$/.test(w);
  const isSurname = (w: string) => isCyr(w) && w.length >= 3 && /^[А-ЯЁІЇЄҐ]/.test(w) && !liIsName(w) && !LI_PATRONYMIC.test(w)
    && !LI_NOT_NAME.test(w) && !LI_PLACES.test(w) && !LI_COMMON.test(w) && !LI_DIMINUTIVE.test(w) && !(w.length <= 3 && w === w.toUpperCase());
  const cap = (w: string) => w.split("-").map(p => p.charAt(0).toUpperCase() + p.slice(1).toLowerCase()).join("-");
  // 1) первое имя из словаря, кириллица раньше латиницы
  let k = words.findIndex(w => isCyr(w) && liIsName(w));
  if(k < 0) k = words.findIndex(w => liIsName(w));
  if(k >= 0){
    let sur = "";
    let j = k + 1; if(words[j] && LI_PATRONYMIC.test(words[j])) j++;          // «Олена Петрівна Шевченко» → Шевченко
    if(words[j] && isSurname(words[j])) sur = words[j];
    else if(words[k - 1] && isSurname(words[k - 1]) && LI_SURNAME_END.test(words[k - 1])) sur = words[k - 1];     // «Плиндіна Олена» → Олена Плиндіна
    return cap(words[k]) + (sur ? " " + cap(sur) : "");
  }
  // 2) имени из словаря нет — первые одно-два кириллических слова с большой буквы («Берц», «Михальчан»)
  const cyr = words.filter(w => isCyr(w) && /^[А-ЯЁІЇЄҐ]/.test(w) && !LI_PATRONYMIC.test(w) && !LI_NOT_NAME.test(w) && !LI_PLACES.test(w) && !LI_COMMON.test(w) && !(w.length <= 3 && w === w.toUpperCase()));
  if(cyr.length) return cyr.slice(0, 2).map(cap).join(" ");
  // 3) только латиница (Anna, Barbie) — оставляем как есть, кроме ников с _ и цифрами
  const lat = words.filter(w => /^[A-Za-z][a-z'-]+$/.test(w));
  return lat.length ? cap(lat[0]) : "";
}

// Формат заметок: «телефон - имя - запрос - дата - риэлтор - что угодно» (дата и риэлтор могут меняться местами)
const NOTE_SPLIT = /\s+[-–—]+\s+|\s*\|\s*|;|\t/;
const fmtDate = (iso: string) => iso.split("-").reverse().join(".");

function parseNotesLine(line: string, staff: Staff[]): Lead | null {
  const clean = stripOrdinal(line);
  const parts = clean.split(NOTE_SPLIT).map((p) => p.trim()).filter(Boolean);
  // отдельная часть «1» / «12.» в начале — тоже порядковый номер
  if (parts.length && /^\d{1,4}[.)]?$/.test(parts[0])) parts.shift();
  if (parts.length < 3) return null;
  const warnings: string[] = [];
  const used = new Set<number>();
  let phone = "";
  parts.forEach((p, i) => {
    if (phone || used.has(i)) return;
    if (isExcelBroken(p)) { warnings.push(`Номер испорчен Excel («${p}») — введите вручную`); used.add(i); return; }
    if (looksPhone(p)) { phone = normPhone(p); used.add(i); }
  });
  // нет телефона — берём ник Telegram
  if (!phone) parts.forEach((p, i) => { if (!phone && !used.has(i) && nickOf(p)) { phone = nickOf(p); used.add(i); } });
  if (!phone && !warnings.length) return null; // не похоже на строку из заметок
  let leadDate: string | null = null, noYear = false;
  parts.forEach((p, i) => { if (!used.has(i) && !leadDate) { const d = parseDate(p); if (d) { leadDate = d; noYear = NO_YEAR.test(p.trim()); used.add(i); } } });
  // имя — первая свободная короткая часть из букв; площадка («Тикток Владимирович», «ОЛХ Адриана», «Эля лиды») — это источник
  const staffFirst = staff.map((x) => String(x.full_name || "").toLowerCase().split(/\s+/)[0]).filter(Boolean);
  let name = "", nameIdx = -1, source = "";
  parts.forEach((p, i) => {
    if (nameIdx >= 0 || used.has(i) || !NAME_RE.test(p) || p.split(/\s+/).length > 3) return;
    if (SOURCE_RE.test(p) && !liNameFromText(p, staffFirst)) { if (!source) { source = p; used.add(i); } return; }
    name = p; nameIdx = i; used.add(i);
  });
  // риэлтор — среди частей после имени
  let realtor: Staff | null = null, realtorRaw = "";
  parts.forEach((p, i) => {
    if (realtor || used.has(i) || i < nameIdx) return;
    const s = findStaff(p, staff);
    if (s) { realtor = s; realtorRaw = p; used.add(i); }
  });
  const free = parts.filter((_, i) => !used.has(i));
  // имени нет отдельной ячейкой — ищем в описании: «Олег, ищет 2к», «зовут Оля»
  if (!name) { name = liNameFromText(free.join(" · "), staffFirst) || liNameFromText(free.join(" · "), staffFirst, true); if (name) nameIdx = 0; }
  const request = free.shift() || "";
  // одно слово с заглавной буквы, не найденное среди сотрудников, — скорее всего фамилия риэлтора
  if (!realtor) {
    const gi = free.findIndex((p) => /^[А-ЯЁІЇЄҐA-Z][а-яёіїєґa-z'’-]+$/.test(p));
    if (gi >= 0) {
      realtorRaw = free.splice(gi, 1)[0];
      warnings.push(`Риэлтор «${realtorRaw}» не найден среди сотрудников — выберите вручную`);
    }
  }
  const extra = free.join(" · ");
  let stage = "Новый Лид";
  for (const [re, st] of STAGE_RULES) if (re.test(extra)) { stage = st; break; }
  const notes = [
    request && `Запрос: ${request}`,
    leadDate && `Дата лида: ${fmtDate(leadDate)}`,
    realtorRaw && `Риэлтор (из заметок): ${realtorRaw}`,
    extra && `Информация: ${extra}`,
  ].filter(Boolean).join("\n");
  if (!name) warnings.push("Не найдено имя");
  return {
    name, phone, source, notes, next_contact_at: null, warnings, stage, lead_date: leadDate, _noYear: noYear,
    manager_email: (realtor as Staff | null)?.email || "", manager_name: (realtor as Staff | null)?.full_name || "",
  };
}

function parseText(text: string, staff: Staff[] = []): Lead[] {
  const out: Lead[] = [];
  const staffFirst = staff.map((x) => String(x.full_name || "").toLowerCase().split(/\s+/)[0]).filter(Boolean);
  const raw = String(text || "").split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  // подзаголовок «Тик-ток» / «Инста» / «Телеграмм» задаёт источник для строк под ним
  const lines: string[] = [], lineSource: string[] = [];
  let current = "";
  for (const l of raw) {
    const h = sourceHeader(l);
    if (h) { current = h; continue; }
    lines.push(l); lineSource.push(current);
  }
  const withSource = (r: Lead, i: number) => { if (lineSource[i] && !r.source) r.source = lineSource[i]; return r; };
  // Есть строка заголовков («Дата | Источник клиентов | Имя | Телефон») — разбираем по колонкам, а не как заметки
  const hasHeader = lines.length > 0 && !/\d{6,}/.test(lines[0]) && (HEADER.name.test(lines[0]) || HEADER.phone.test(lines[0])) && splitCells(lines[0]).length >= 2;
  // Списки из заметок разбираем отдельным правилом
  const notesRows = lines.map((l) => hasHeader ? null : parseNotesLine(l, staff));
  if (!hasHeader && lines.length && notesRows.filter(Boolean).length >= Math.max(1, Math.ceil(lines.length * 0.6))) {
    lines.forEach((l, i) => {
      const r = notesRows[i] || parseText(l, [])[0];
      if (r) out.push(withSource(r, i));
    });
    fillYears(out);
    return out;
  }
  // Заголовок таблицы → порядок столбцов
  let cols: (keyof typeof HEADER | null)[] | null = null;
  if (hasHeader) {
    lineSource.shift();
    const taken = new Set<string>();
    cols = splitCells(lines.shift()!).map((h) => {
      for (const k of Object.keys(HEADER) as (keyof typeof HEADER)[]) if (HEADER[k].test(h)) {
        if (k !== "notes" && taken.has(k)) return "notes"; // вторая колонка «Имя»/«Источник» — в заметку
        taken.add(k); return k;
      }
      return null;
    });
  }
  lines.forEach((rawLine, li) => {
    const line = stripOrdinal(rawLine);
    const cells = splitCells(line).map((c) => c.trim());
    const warnings: string[] = [];
    let phone = "", name = "", source = "";
    let leadDate: string | null = null;
    const rest: string[] = [];
    cells.forEach((c, i) => {
      if (!c) return;
      if (!leadDate) { const d = liDateInText(c); if (d) { leadDate = d; if (/^\s*\d{1,2}[./-]\d{1,2}[./-]\d{2,4}\s*$/.test(c)) return; } }
      const col = cols ? cols[i] : null;
      if (isExcelBroken(c)) { warnings.push(`Номер испорчен Excel («${c}») — введите вручную`); return; }
      if (col === "phone" && !phone && looksPhone(c)) { phone = normPhone(c); return; }
      if (col === "name" && !name) { name = c; return; }
      if (col === "source" && !source) { source = c; return; }
      if (col === "notes") { rest.push(c); return; }
      if (!phone && looksPhone(c)) { phone = normPhone(c); return; }
      if (!phone && nickOf(c)) { phone = nickOf(c); return; }
      if (!source && c.length <= 30 && SOURCE_RE.test(c)) { source = c; return; }
      if (!name && NAME_RE.test(c)) { name = c; return; }
      rest.push(c);
    });
    // строка сплошным текстом: «Михаил 0970989397 ищет 2к»
    if (!phone && !warnings.length) {
      const m = line.match(PHONE_IN_TEXT);
      if (m) {
        phone = normPhone(m[0]);
        const before = line.slice(0, m.index).replace(/[,;:\-–—]+\s*$/, "").trim();
        const after = line.slice((m.index || 0) + m[0].length).replace(/^[,;:\-–—\s]+/, "").trim();
        if (!name && before && NAME_RE.test(before)) { name = before; rest.length = 0; if (after) rest.push(after); }
      }
    }
    // в колонке «Имя» оказался источник («Тикток Владимирович», «Эля лиды») — переносим в источник
    if (name && !source && SOURCE_RE.test(name) && !liNameFromText(name, staffFirst)) { source = name; name = ""; }
    // имени нет — ищем в описании: «Олег, ищет 2к», «зовут Оля», «клиентка Ирина»
    if (!name) name = liNameFromText(rest.join(" · "), staffFirst) || liNameFromText(rest.join(" · "), staffFirst, true);
    if (!phone && !warnings.length) warnings.push("Не найден телефон");
    if (!name) warnings.push("Не найдено имя");
    out.push(withSource({ name, phone, source, notes: rest.join(" · "), next_contact_at: null, warnings, lead_date: leadDate }, li));
  });
  return out;
}

const AI_PROMPT = `Это переписка агента недвижимости с клиентом (Telegram, Viber, WhatsApp, Instagram и т.п.).
Верни ТОЛЬКО JSON-массив клиентов (обычно один), без пояснений:
[{"name":"","phone":"","username":"","messenger":"","request":"что ищет: тип, комнаты, район или ЖК, бюджет","budget_usd":null,"rooms":null,"district":"","complex":"","deal_type":"Купить|Продать|Снять|Сдать","next_step":"о чём договорились","next_contact_at":"YYYY-MM-DDTHH:MM или null","summary":"2–3 предложения на русском"}]
Правила: телефон бери только если он виден. Ничего не выдумывай — если данных нет, пустая строка или null.
Имя клиента — это собеседник агента, а не сам агент. Сегодня ${new Date().toISOString().slice(0, 10)}.`;

async function askAI(content: unknown[]): Promise<Lead[]> {
  if (!AI_KEY) throw new Error("Распознавание скриншотов ещё не включено: нужен ключ ИИ (ANTHROPIC_API_KEY в настройках функций Supabase).");
  const r = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: { "x-api-key": AI_KEY, "anthropic-version": "2023-06-01", "content-type": "application/json" },
    body: JSON.stringify({ model: AI_MODEL, max_tokens: 2000, messages: [{ role: "user", content }] }),
  });
  if (!r.ok) throw new Error(`ИИ не ответил (${r.status}). Попробуйте ещё раз.`);
  const j = await r.json();
  const txt = (j.content || []).map((c: any) => c.text || "").join("");
  let arr: any[] = [];
  try { arr = JSON.parse(txt.slice(txt.indexOf("["), txt.lastIndexOf("]") + 1) || "[]"); } catch { arr = []; }
  return arr.map((c: any) => {
    const notes = [
      c.summary,
      c.request && `Запрос: ${c.request}`,
      c.deal_type && `Тип сделки: ${c.deal_type}`,
      c.budget_usd && `Бюджет: $${c.budget_usd}`,
      c.rooms && `Комнат: ${c.rooms}`,
      c.district && `Район: ${c.district}`,
      c.complex && `ЖК: ${c.complex}`,
      c.next_step && `Договорились: ${c.next_step}`,
      c.username && `Ник: ${c.username}`,
    ].filter(Boolean).join("\n");
    const warnings: string[] = [];
    const phone = (c.phone && !isExcelBroken(String(c.phone)) ? normPhone(String(c.phone)) : "") || nickOf(c.username ? (String(c.username).startsWith("@") ? c.username : "@" + c.username) : "");
    if (!phone) warnings.push("Телефона в переписке нет — добавьте вручную");
    const next = c.next_contact_at && !isNaN(Date.parse(c.next_contact_at)) ? new Date(c.next_contact_at).toISOString() : null;
    return { name: String(c.name || "").trim(), phone, source: String(c.messenger || "").trim(), notes, next_contact_at: next, warnings };
  });
}

type Known = { id: number; name: string; manager_name: string; manager_email: string; stage: string; created_at: string };
// Телефоны и ники, уже существующие в агентстве (номер мог оказаться и в name/source из-за старого импорта)
async function knownPhones(agencyId: number | null): Promise<Map<string, Known>> {
  const filter = agencyId ? `&agency_id=eq.${agencyId}` : "";
  const rows = await rest(`leads?select=id,name,phone,source,stage,manager_name,manager_email,created_at&order=id.asc&limit=100000${filter}`);
  const m = new Map<string, Known>();
  for (const row of rows || []) for (const v of [row.phone, row.source, row.name]) {
    const s = String(v || "");
    const k = looksPhone(s) || nickOf(s) ? contactKey(s) : "";
    // запоминаем самую первую карточку с этим номером
    if (k && !m.has(k)) m.set(k, { id: row.id, name: row.name || "", manager_name: row.manager_name || "", manager_email: row.manager_email || "", stage: row.stage || "", created_at: row.created_at || "" });
  }
  return m;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });
  try {
    const me = await caller(req);
    const b: any = await req.json();
    const isTech = me.role === TECH;
    const isDirector = me.role === DIRECTOR;

    // Ответственный: менеджер — всегда сам; директор — любой сотрудник своего агентства; тех. админ — любой
    let owner = me;
    if ((isTech || isDirector) && b.manager_email && String(b.manager_email).toLowerCase() !== String(me.email).toLowerCase()) {
      const rows = await rest(`users?select=id,full_name,email,role,agency_id,access,status&email=ilike.${encodeURIComponent(String(b.manager_email))}`);
      const target = (rows || []).find((x: any) => String(x.email || "").toLowerCase() === String(b.manager_email).toLowerCase());
      if (!target || target.access === false) throw new Error("Выбранный менеджер не найден или без доступа");
      if (!isTech && String(target.agency_id) !== String(me.agency_id)) throw new Error("Можно назначать только сотрудников своего агентства");
      owner = target;
    }
    const agencyId = owner.agency_id ?? me.agency_id ?? null;
    const known = await knownPhones(agencyId);
    const defaultSource = String(b.source || "").trim();
    const staff: Staff[] = (await rest(`users?select=id,full_name,email,role,agency_id,access&access=not.is.false${agencyId ? `&agency_id=eq.${agencyId}` : ""}`)) || [];
    // ответственный по строке: менеджер — всегда сам; директор/тех. админ — любой сотрудник агентства
    const rowOwner = (email: string) => {
      if (!(isTech || isDirector) || !email) return owner;
      return staff.find((s) => String(s.email).toLowerCase() === String(email).toLowerCase()) || owner;
    };
    const leadDateIso = (v: any) => {
      if (!v || isNaN(Date.parse(v))) return null;
      const d = new Date(v);
      return d > new Date() ? null : d.toISOString();
    };

    const isAdmin = isTech || isDirector;
    const leadRow = (x: any, phone: string, name: string) => {
      const who = rowOwner(String(x.manager_email || ""));
      const managerName = who.full_name || who.email;
      const createdAt = leadDateIso(x.lead_date);
      return {
        agency_id: agencyId,
        name: name || "Без имени",
        phone: phone || null,
        source: String(x.source || defaultSource || "").trim() || null,
        // этап из таблицы (цвет/колонка «Этап») — только для строк из Excel; иначе «Новый Лид», менеджер обновит после звонка
        stage: x.keep_stage && STAGES.includes(String(x.stage || "")) ? String(x.stage) : "Новый Лид",
        notes: `Ответственный менеджер: ${managerName}\n${String(x.notes || "").trim()}`.trim(),
        manager_name: managerName,
        manager_email: who.email,
        manager_id: who.id,
        next_contact_at: x.next_contact_at && !isNaN(Date.parse(x.next_contact_at)) ? new Date(x.next_contact_at).toISOString() : null,
        created_at: createdAt || new Date().toISOString(),
      };
    };

    // Администратор решает по дублю, который загрузил менеджер
    if (b.mode === "decide") {
      if (!isAdmin) throw new Error("Решение по дублям принимает администратор");
      const [d] = (await rest(`lead_duplicates?select=*&id=eq.${Number(b.id)}`)) || [];
      if (!d || d.status !== "pending") throw new Error("Дубль уже обработан");
      if (!isTech && String(d.agency_id) !== String(me.agency_id)) throw new Error("Доступ к CRM закрыт");
      const now = new Date().toISOString();
      if (b.action === "approve") {
        const p = d.payload || {};
        const [ins] = await rest("leads", { method: "POST", headers: { prefer: "return=representation" }, body: JSON.stringify(leadRow({ ...p, manager_email: b.manager_email || p.manager_email }, p.phone || "", p.name || "")) });
        await rest(`lead_duplicates?id=eq.${d.id}`, { method: "PATCH", body: JSON.stringify({ status: "added", lead_id: ins.id, decided_by: me.email, decided_at: now }) });
        return json({ success: true, lead_id: ins.id });
      }
      await rest(`lead_duplicates?id=eq.${d.id}`, { method: "PATCH", body: JSON.stringify({ status: "rejected", decided_by: me.email, decided_at: now }) });
      return json({ success: true });
    }

    if (b.mode === "commit") {
      const seen = new Set<string>();
      const input: any[] = Array.isArray(b.leads) ? b.leads.slice(0, 1000) : [];
      const rows: any[] = [];
      let dupAdded = 0, pending = 0;
      for (const x of input) {
        const name = String(x.name || "").trim();
        const phone = x.phone && !isExcelBroken(String(x.phone)) ? normContact(String(x.phone)) : "";
        const key = phone ? contactKey(phone) : "";
        if (!name && !phone) continue;
        if (key && seen.has(key)) continue;
        if (key) seen.add(key);
        const orig = key ? known.get(key) : undefined;
        if (orig) {
          // существующую карточку не трогаем
          if (isAdmin) {
            if (!x.allow_duplicate) continue;
            const [ins] = await rest("leads", { method: "POST", headers: { prefer: "return=representation" }, body: JSON.stringify(leadRow(x, phone, name)) });
            await rest("lead_duplicates", { method: "POST", body: JSON.stringify({ agency_id: agencyId, lead_id: ins.id, duplicate_of: orig.id, status: "added", uploaded_by: me.email, decided_by: me.email, decided_at: new Date().toISOString() }) });
            dupAdded++;
          } else {
            const payload = { name, phone, source: String(x.source || defaultSource || "").trim(), notes: String(x.notes || "").trim(), lead_date: x.lead_date || null, manager_email: me.email, manager_name: me.full_name, stage: x.stage || null, keep_stage: !!x.keep_stage, next_contact_at: x.next_contact_at || null };
            await rest("lead_duplicates", { method: "POST", body: JSON.stringify({ agency_id: agencyId, duplicate_of: orig.id, status: "pending", uploaded_by: me.email, payload }) });
            pending++;
          }
          continue;
        }
        rows.push(leadRow(x, phone, name));
      }
      let inserted = 0;
      if (rows.length) {
        const ins = await rest("leads", { method: "POST", headers: { prefer: "return=representation" }, body: JSON.stringify(rows) });
        inserted = ins.length;
      }
      return json({ success: true, inserted, duplicates_added: dupAdded, pending, skipped: input.length - inserted - dupAdded - pending });
    }

    // preview
    let leads: Lead[] = [];
    const fromTable = Array.isArray(b.rows);
    if (fromTable) {
      for (const r of b.rows.slice(0, 1000)) {
        const warnings: string[] = [];
        const rawPhone = String(r.phone || "").trim();
        let phone = "";
        if (rawPhone) {
          if (isExcelBroken(rawPhone)) warnings.push(`Номер испорчен Excel («${rawPhone}») — введите вручную`);
          else if (nickOf(rawPhone)) phone = nickOf(rawPhone);
          else if (String(rawPhone).replace(/\D/g, "").length >= 9) phone = normPhone(rawPhone);
          else warnings.push(`Телефон не распознан («${rawPhone}»)`);
        } else warnings.push("Не найден телефон");
        const name = String(r.name || "").trim() || liNameFromText(String(r.notes || "").replace(/^[^:\n]{1,40}:\s*/gm, ""), staff.map((x) => String(x.full_name || "").toLowerCase().split(/\s+/)[0]));
        if (!name) warnings.push("Не найдено имя");
        let leadDate: string | null = null;
        const ld = String(r.lead_date || "").trim();
        if (/^\d{4}-\d{2}-\d{2}/.test(ld)) leadDate = ld.slice(0, 10); else if (ld) leadDate = parseDate(ld);
        if (!leadDate) leadDate = liDateInText(String(r.notes || "")) || liDateInText(String(r.name || ""));
        let stage = STAGES.includes(String(r.stage || "")) ? String(r.stage) : "";
        if (!stage && r.stage_text) for (const [re, st] of STAGE_RULES) if (re.test(String(r.stage_text))) { stage = st; break; }
        let manager_email = "", manager_name = "";
        if (r.manager && (isTech || isDirector)) { const s = findStaff(String(r.manager), staff); if (s) { manager_email = s.email; manager_name = s.full_name; } else warnings.push(`Ответственный «${r.manager}» не найден среди сотрудников`); }
        const next = r.next_contact_at && !isNaN(Date.parse(r.next_contact_at)) ? new Date(r.next_contact_at).toISOString() : null;
        leads.push({ name, phone, source: String(r.source || "").trim(), notes: String(r.notes || "").trim(), next_contact_at: next, warnings,
          stage: stage || "Новый Лид", lead_date: leadDate, manager_email, manager_name, ...(r.row ? { row: r.row } : {}) } as Lead);
      }
    }
    if (b.text && !b.ai_text) leads = leads.concat(parseText(b.text, staff));
    if (b.text && b.ai_text) leads = leads.concat(await askAI([{ type: "text", text: `${AI_PROMPT}\n\nПереписка:\n${String(b.text).slice(0, 20000)}` }]));
    const images = Array.isArray(b.images) ? b.images.slice(0, MAX_IMAGES) : [];
    if (images.length) {
      const content: unknown[] = images.map((im: any) => ({
        type: "image",
        source: { type: "base64", media_type: im.mime || "image/jpeg", data: String(im.base64 || "").replace(/^data:[^,]+,/, "") },
      }));
      content.push({ type: "text", text: AI_PROMPT + (images.length > 1 ? "\nСкриншоты могут быть частями одной переписки." : "") });
      leads = leads.concat(await askAI(content));
    }
    const batch = new Set<string>();
    for (const l of leads) {
      if (!l.source && defaultSource) l.source = defaultSource;
      const mapped = crmSource(l.source);
      // источник — только в поле «Источник», в заметку/историю не дублируем
      if (mapped) l.source = mapped;
      if (l.source !== "ОЛХ" && LI_OLX.test(`${l.notes} ${l.name}`.toLowerCase())) l.source = "ОЛХ";
      // имя — только «Имя Фамилия»
      if (l.name) { const n = liCleanName(l.name); l.name = n; if (!n) { const d = liNameFromText(l.notes) || liNameFromText(l.notes, [], true); l.name = d ? (liCleanName(d) || d) : ""; } l.warnings = l.warnings.filter((w) => w !== "Не найдено имя"); if (!l.name) l.warnings.push("Не найдено имя"); }
      const k = l.phone ? contactKey(l.phone) : "";
      const orig = k ? known.get(k) : undefined;
      // о дублях знает только администратор: менеджер видит обычную строку
      if (orig && (isTech || isDirector)) {
        l.duplicate_of = orig.id;
        (l as any).duplicate = orig;
        l.warnings.push(`Дубль: клиент №${orig.id} уже есть у менеджера ${orig.manager_name || "—"}`);
      } else if (k && batch.has(k)) l.warnings.push("Повтор в этом списке");
      if (k) batch.add(k);
      if (!l.manager_email) { l.manager_email = owner.email; l.manager_name = owner.full_name; }
      if (!fromTable) l.stage = "Новый Лид";
    }
    return json({
      success: true,
      count: leads.length,
      new_count: leads.filter((l) => !l.duplicate_of).length,
      owner: { name: owner.full_name, email: owner.email },
      staff: (isTech || isDirector) ? staff.map((x) => ({ name: x.full_name, email: x.email })) : [],
      stages: STAGES,
      ai_enabled: !!AI_KEY,
      leads,
    });
  } catch (e) {
    return json({ success: false, error: e instanceof Error ? e.message : String(e) }, 400);
  }
});
