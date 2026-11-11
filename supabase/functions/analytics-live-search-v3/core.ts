// analytics-live-search v3 core: v1 + все города Украины по каждой площадке, аренда, зарубежные площадки.
// Подключается из index.ts по закреплённому коммиту; авторизация — в index.ts.
import { UA_SLUGS, UA_UK } from "./ua_slugs.ts";
import { REM_LUN_CITIES } from "./cities_rem_lun.ts";
import { foreignSearch } from "./foreign.ts";

const CORS={"Access-Control-Allow-Origin":"*","Access-Control-Allow-Headers":"authorization,apikey,content-type,x-client-info","content-type":"application/json; charset=utf-8"};
const HEADERS={"User-Agent":"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36","Accept":"text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8","Accept-Language":"uk-UA,uk;q=0.9,ru;q=0.8,en;q=0.7"};
// Площадки ограничивают частоту запросов (DIM.RIA 429, RIELTOR.UA 403/429): повторяем с паузой.
const sleep=(ms:number)=>new Promise(r=>setTimeout(r,ms));
async function politeFetch(url:string,tries=3){let last:Response|null=null;for(let i=0;i<tries;i++){try{const r=await fetch(url,{headers:HEADERS,redirect:"follow"});if(![403,429,502,503].includes(r.status))return r;last=r;try{await r.body?.cancel()}catch{}}catch{last=null}await sleep(900*(i+1)+Math.random()*400)}return last||new Response("",{status:0})}
// Комнаты из заголовка/описания, если площадка не дала поле (часто у OLX)
const roomsFromText=(t:string)=>{const s=String(t||"").toLowerCase();const d=s.match(/(?<!\d[\s.,]?)(\d)\s*[-‐–]?\s*(?:х|x)?\s*[-‐–]?\s*(?:кімн|комн|к\.?\s*кв|к(?![а-яіїєґa-z])|кім(?![а-яіїєґ])|ком(?![а-яіїєґ])|спальн)/i)?.[1];if(d)return Number(d);if(/студі|студи|smart|смарт|однокімн|однокомн|1-?но\s*кім|однушк|гостинк/.test(s))return 1;if(/двокімн|двухкомн|двухкімн|двушк|двох\s*кім|євродвушк|евродвушк/.test(s))return 2;if(/трикімн|трехкомн|трьохкімн|трешк|трьох\s*кім|євротрешк|евротрешк/.test(s))return 3;if(/чотирикімн|четырехкомн|четырёхкомн/.test(s))return 4;return 0};
// Город карточки → ключ (Київ/Киев/Kyiv → kiev)
const cityKeyUa=(v:string)=>{const k=String(v||"").toLowerCase().replace(/[’'`ʼ]/g,"").trim();return latin(UA_UK[k]||k)};
const IMAGE_HOST_SUFFIXES=["olxcdn.com","ria.com","riastatic.com","rieltor.ua","rieltor.com","rem.ua","lunstatic.net"];
const LISTING_HOST_SUFFIXES=["olx.ua","dom.ria.com","rieltor.ua","rem.ua","lun.ua"];
const clean=(s="")=>String(s).replace(/<script[\s\S]*?<\/script>/gi," ").replace(/<style[\s\S]*?<\/style>/gi," ").replace(/<br\s*\/?>/gi,"\n").replace(/<[^>]+>/g," ").replace(/&nbsp;|&#160;/gi," ").replace(/&amp;/gi,"&").replace(/&quot;/gi,'"').replace(/&#0*39;|&apos;/gi,"'").replace(/\s+/g," ").trim();
const num=(v:any)=>{let s=String(v??"").replace(/[\s\u00a0]/g,"").replace(/[^0-9.,]/g,"");if(s.includes(",")&&s.includes("."))s=s.lastIndexOf(",")>s.lastIndexOf(".")?s.replace(/\./g,"").replace(",","."):s.replace(/,/g,"");else if((s.match(/[.,]/g)||[]).length>1)s=s.replace(/[.,]/g,"");else s=s.replace(",",".");return Number(s)||0};
const abs=(v:string,base:string)=>{try{const u=new URL(v,base);return u.origin+u.pathname}catch{return v}};
const listingUrlInUsd=(v:string,source:string)=>{try{const u=new URL(v);const s=String(source||"").toUpperCase();if(s==="OLX"||s.includes("DIM.RIA"))u.searchParams.set("currency","USD");return u.toString()}catch{return v}};
const pageUrl=(url:string,page:number)=>page<=1?url:`${url}${url.includes("?")?"&":"?"}page=${page}`;
const districtCanon=(v="")=>/ки[еї]в/i.test(v)?"Киевский":/примор/i.test(v)?"Приморский":/хаджиб|малинов/i.test(v)?"Хаджибейский":/пересип|пересып|суворов/i.test(v)?"Пересыпский":v;
const latin=(value="")=>{const one:any={а:"a",б:"b",в:"v",г:"g",ґ:"g",д:"d",е:"e",ё:"e",є:"e",ж:"zh",з:"z",и:"i",і:"i",ї:"i",й:"i",к:"k",л:"l",м:"m",н:"n",о:"o",п:"p",р:"r",с:"s",т:"t",у:"u",ф:"f",х:"h",ц:"c",ч:"ch",ш:"sh",щ:"sh",ы:"y",ь:"",ъ:"",э:"e",ю:"yu",я:"ya"};return String(value||"").toLowerCase().split("").map(ch=>one[ch]??ch).join("").replace(/[^a-z0-9]+/g,"")};
const normalizeComplexNumbers=(value="")=>{const units:Record<string,number>={один:1,одна:1,первая:1,первый:1,перша:1,перший:1,два:2,две:2,дві:2,вторая:2,второй:2,друга:2,другий:2,три:3,третья:3,третий:3,третя:3,третій:3,четыре:4,чотири:4,четвертая:4,четвертый:4,четверта:4,четвертий:4,пять:5,пятая:5,пятый:5,пята:5,пятий:5,шесть:6,шість:6,шестая:6,шестой:6,шоста:6,шостий:6,семь:7,сім:7,седьмая:7,седьмой:7,сьома:7,сьомий:7,восемь:8,вісім:8,восьмая:8,восьмой:8,восьма:8,восьмий:8,девять:9,девятая:9,девятый:9,девята:9,девятий:9};const direct:Record<string,number>={...units,десять:10,десятая:10,десятый:10,десята:10,десятий:10,одиннадцать:11,одинадцять:11,одиннадцатая:11,одинадцята:11,двенадцать:12,дванадцять:12,двенадцатая:12,дванадцята:12,тринадцать:13,тринадцять:13,тринадцатая:13,тринадцята:13,четырнадцать:14,чотирнадцять:14,четырнадцатая:14,чотирнадцята:14,пятнадцать:15,пятнадцять:15,пятнадцатая:15,пятнадцята:15,шестнадцать:16,шістнадцять:16,шестнадцатая:16,шістнадцята:16,семнадцать:17,сімнадцять:17,семнадцатая:17,сімнадцята:17,восемнадцать:18,вісімнадцять:18,восемнадцатая:18,вісімнадцята:18,девятнадцать:19,девятнадцять:19,девятнадцатая:19,девятнадцята:19,двадцать:20,двадцять:20,двадцатая:20,двадцята:20,тридцать:30,тридцять:30,тридцатая:30,тридцята:30,сорок:40,сороковая:40,сорокова:40,пятьдесят:50,пятдесят:50,пятидесятая:50,пятдесята:50,шестьдесят:60,шістдесят:60,шестидесятая:60,шістдесята:60};Object.assign(direct,{семидесятая:70,сімдесята:70,восьмидесятая:80,вісімдесята:80,девяностая:90,девяноста:90});const tens:Record<string,number>={двадцать:20,двадцять:20,тридцать:30,тридцять:30,сорок:40,пятьдесят:50,пятдесят:50,шестьдесят:60,шістдесят:60,семьдесят:70,сімдесят:70,восемьдесят:80,вісімдесят:80,девяносто:90};const tokens=String(value||"").toLowerCase().replace(/[’']/g,"").split(/([^а-яіїєґ]+)/i);for(let i=0;i<tokens.length;i+=2){const one=tokens[i],separator=tokens[i+1]||"",two=tokens[i+2];if(tens[one]&&/^\s+$/.test(separator)&&units[two]){tokens[i]=String(tens[one]+units[two]);tokens[i+1]="";tokens[i+2]=""}else if(direct[one])tokens[i]=String(direct[one])}return tokens.join("")};
const complexCanon=(value="")=>latin(normalizeComplexNumbers(String(value||"")).replace(/\b(?:жк|жил(?:ой|ого)?\s+комплекс|житлов(?:ий|ого)?\s+комплекс|residential\s+complex)\b/gi," "));
const pearlComplexNumber=(value="")=>{const raw=String(value||"").toLowerCase().replace(/[’']/g,"").replace(/(^|\s)жк(?=\s|$)/g," ");if(!/(?:жемчуж|перлин|pearl)/.test(raw))return 0;const numeric=raw.match(/\b(\d{1,2})\s*(?:-?[аяй]|ша|га|тя|та)?\s*(?:жемчуж|перлин|pearl)/i);if(numeric)return Number(numeric[1]);const phrase=raw.match(/(?:^|\s)([а-яіїєґ]+(?:\s+[а-яіїєґ]+)?)\s+(?:жемчуж|перлин)/i)?.[1]||"";const units:Record<string,number>={первая:1,перша:1,вторая:2,друга:2,третья:3,третя:3,четвертая:4,четверта:4,пятая:5,пята:5,шестая:6,шоста:6,седьмая:7,сьома:7,восьмая:8,восьма:8,девятая:9,девята:9};const direct:Record<string,number>={...units,десятая:10,десята:10,одиннадцатая:11,одинадцята:11,двенадцатая:12,дванадцята:12,тринадцатая:13,тринадцята:13,четырнадцатая:14,чотирнадцята:14,пятнадцатая:15,пятнадцята:15,шестнадцатая:16,шістнадцята:16,семнадцатая:17,сімнадцята:17,восемнадцатая:18,вісімнадцята:18,девятнадцатая:19,девятнадцята:19,двадцатая:20,двадцята:20,тридцатая:30,тридцята:30,сороковая:40,сорокова:40,пятидесятая:50,пятдесята:50,шестидесятая:60,шістдесята:60};Object.assign(direct,{семидесятая:70,сімдесята:70,восьмидесятая:80,вісімдесята:80,девяностая:90,девяноста:90});const tens:Record<string,number>={двадцать:20,двадцять:20,тридцать:30,тридцять:30,сорок:40,пятьдесят:50,пятдесят:50,шестьдесят:60,шістдесят:60,семьдесят:70,сімдесят:70,восемьдесят:80,вісімдесят:80,девяносто:90};const tokens=phrase.split(/\s+/).filter(Boolean);if(tokens.length===1)return direct[tokens[0]]||0;if(tokens.length===2&&tens[tokens[0]]&&units[tokens[1]])return tens[tokens[0]]+units[tokens[1]];return 0};
const editDistance=(a:string,b:string)=>{const row=Array.from({length:b.length+1},(_,i)=>i);for(let i=1;i<=a.length;i++){let prev=row[0];row[0]=i;for(let j=1;j<=b.length;j++){const old=row[j];row[j]=Math.min(row[j]+1,row[j-1]+1,prev+(a[i-1]===b[j-1]?0:1));prev=old}}return row[b.length]};
const complexMatches=(value="",wanted="")=>{const pa=pearlComplexNumber(value),pb=pearlComplexNumber(wanted);if(pa&&pb)return pa===pb;const a=complexCanon(value),b=complexCanon(wanted);if(!a||!b)return false;if(a===b||a.includes(b)||b.includes(a))return true;const an=(a.match(/\d+/g)||[]).join("|"),bn=(b.match(/\d+/g)||[]).join("|");if(bn&&an!==bn)return false;return Math.max(a.length,b.length)>=6&&editDistance(a,b)<=Math.max(1,Math.floor(Math.max(a.length,b.length)*.16))};
const areaFromCard=(text:string,html="")=>{const probes=[html.match(/["'](?:totalArea|total_area|areaTotal|area_total)["']\s*:\s*["']?(\d{1,4}(?:[.,]\d{1,2})?)/i)?.[1],text.match(/(?:Загальна площа|Общая площадь|Площа|Площадь)\s*:?\s*(\d{1,4}(?:[.,]\d{1,2})?)\s*(?:м²|м2|кв\.?\s*м)/i)?.[1],text.match(/(\d{1,4}(?:[.,]\d{1,2})?)\s*\/\s*\d{1,4}(?:[.,]\d{1,2})?\s*\/\s*\d{1,4}(?:[.,]\d{1,2})?\s*(?:м²|м2|кв\.?\s*м)/i)?.[1],text.match(/(\d{1,4}(?:[.,]\d{1,2})?)\s*(?:м²|м2|кв\.?\s*м)/i)?.[1]];for(const value of probes){const n=num(value);if(n>=5&&n<=3000)return n}return 0};
const complexFromText=(text:string)=>{const direct=text.match(/(?:ЖК|Назва ЖК|Название ЖК)\s*:?\s*[«"']?([^,;|«»"'()]{2,90})/i)?.[1],quoted=text.match(/(?:житлов(?:ий|ого)\s+комплекс(?:у|і|а)?|жил(?:ой|ого)\s+комплекс(?:а|е|ом)?)\s+[«"']([^»"']{2,60})[»"']/i)?.[1];let name=clean(direct||quoted||"").replace(/\s+\d+(?:[.,]\d+)?\s*(?:кімнат|комнат|м²|м2|поверх|этаж)[\s\S]*$/i,"").replace(/\s+(?:в|у)\s+(?:Одес[а-яіїє]*|Ки[еї]в[а-яіїє]*)[\s\S]*$/i,"").replace(/\s+(?:продаж|прода|квартир|апартамент)\b[\s\S]*$/i,"").trim();if(/^(?:від|от)\s+забудовник|^(?:у|в)\s+(?:продаж|або)\b/i.test(name)||name.split(/\s+/).length>7)return"";return name};
const floorFromText=(text:string)=>{const pair=text.match(/(\d{1,3})\s*(?:этаж|поверх)\s*(?:из|з)\s*(\d{1,3})/i)||text.match(/(?:этаж|поверх)\s*:?\s*(\d{1,3})\s*\/\s*(\d{1,3})/i);const single=pair?null:text.match(/(?:этаж|поверх(?!ов))\s*:?\s*(\d{1,3})/i);return{floor:num(pair?.[1]||single?.[1]||0),total:num(pair?.[2]||0)}};
// Дата публикации/обновления из карточки площадки (раньше ставилась дата проверки — «всё новое»)
const UA_MONTHS:[RegExp,number][]=[[/^(січ|янв)/,0],[/^(лют|фев)/,1],[/^(бер|мар)/,2],[/^(кві|апр)/,3],[/^(тра|ма[йя])/,4],[/^(чер|июн)/,5],[/^(лип|июл)/,6],[/^(сер|авг)/,7],[/^(вер|сен)/,8],[/^(жов|окт)/,9],[/^(лис|ноя)/,10],[/^(гру|дек)/,11]];
function listingDateFrom(raw:string):string|null{
  const t=String(raw||"").replace(/\s+/g," ");const now=new Date();
  const mk=(y:number,m:number,d:number,h=12,mi=0)=>{let dt=new Date(Date.UTC(y,m,d,h-2,mi));if(dt.getTime()>now.getTime()+36*3600000)dt=new Date(Date.UTC(y-1,m,d,h-2,mi));return isNaN(dt.getTime())?null:dt.toISOString()};
  const rel=(days:number)=>new Date(now.getTime()-days*86400000).toISOString();
  // 1) «Опубліковано 3 авг.», «Оголошення створене 26 сер. 2025», «Оновлено 5 листопада»
  let m=t.match(/(?:Опубліковано|Опубликовано|Додано|Добавлено|створене|создано|Оновлено|Обновлено|Оновлений|Обновлен)\s*:?\s*(\d{1,2})\s+([а-яіїєё]{3,})\.?(?:\s+(\d{4}))?/i);
  const fromDM=(d:string,mon:string,y?:string)=>{const k=mon.toLowerCase();const mm=UA_MONTHS.find(([re])=>re.test(k));return mm?mk(y?Number(y):now.getFullYear(),mm[1],Number(d)):null};
  if(m){const r=fromDM(m[1],m[2],m[3]);if(r)return r}
  m=t.match(/(?:Опубліковано|Опубликовано|Оновлено|Обновлено|Оновлений|Обновлен|Додано|Добавлено)\s*:?\s*(\d{2})[./-](\d{2})[./-](\d{4})/i)||t.match(/\b(\d{2})\/(\d{2})\/(20\d{2})\s+\d{2}:\d{2}\b/);
  if(m)return mk(Number(m[3]),Number(m[2])-1,Number(m[1]));
  // 2) OLX: « - 17 жовтня 2026 р.» / « - Сьогодні о 10:47»
  m=t.match(/\s-\s(\d{1,2})\s+([а-яіїєё]{3,})\s+(\d{4})\s*р/i);if(m){const r=fromDM(m[1],m[2],m[3]);if(r)return r}
  if(/\s-\s(?:Сьогодні|Сегодня)\s+(?:о|в)\s+\d/i.test(t))return rel(0);
  if(/(?:Оновлено|Обновлено|Оновлений|Обновлен)?\s*(?:сьогодні|сегодня)\s+\d{1,2}:\d{2}/i.test(t))return rel(0);
  // 3) «3 дні тому», «1 тиж. тому», «2 міс. тому», «5 год. тому»
  m=t.match(/(\d{1,3})\s*(хв|мин|год|час|дн|день|дні|дня|днів|тиж|нед|міс|мес)[а-яіїє.]*\s+(?:тому|назад)/i);
  if(m){const n=Number(m[1]),u=m[2].toLowerCase();const days=/хв|мин|год|час/.test(u)?0:/тиж|нед/.test(u)?n*7:/міс|мес/.test(u)?n*30:n;return rel(days)}
  // 4) RIELTOR.UA: «… рік побудови сьогодні», «… поверх 8 з 16 вчора»
  m=t.match(/(?:побудови|постройки|з\s+\d{1,3}|из\s+\d{1,3}|м²)\s+(сьогодні|вчора|сегодня|вчера)(?![а-яіїє])/i);
  if(m)return rel(/вчора|вчера/i.test(m[1])?1:0);
  return null;
}
const conditionTag=(text:string)=>/після\s+будівель|после\s+строител|без\s+ремонт|потребує\s+ремонт|требует\s+ремонт|чернов|чорнов|від\s+забудовник|от\s+застройщик|під\s+чистову|под\s+чистовую/i.test(text)?"Без ремонта":/(?:дизайнер|авторськ|авторск|євроремонт|евроремонт|капитальн|капітальн|косметичн|сучасн(?:ий|а|е)\s+ремонт|современн(?:ый|ая|ое)\s+ремонт|ремонт\s+(?:виконан|сделан)|після\s+ремонту|после\s+ремонта|з\s+ремонтом|с\s+ремонтом|готов[а-яіїє]*\s+(?:до\s+прожив|к\s+прожив)|заходь\s+і\s+живи|заезжай\s+и\s+живи|укомплектован[а-яіїє]*\s+(?:мебл|техн)|мебл[а-яіїє]*\s+та\s+техн|мебел[а-яіїє]*\s+и\s+техн)/i.test(text)?"С ремонтом":"Не указано";
const landAreaFromText=(text:string)=>num(text.match(/(\d{1,4}(?:[.,]\d{1,2})?)\s*(?:сот(?:ок|ки|ка)?|сот\.)/i)?.[1]||0);
const yearFromText=(text:string)=>num(text.match(/["']?(?:construction_year|building_year|year_built)["']?\s*[:=]\s*["']?((?:18|19|20)\d{2})/i)?.[1]||text.match(/(?:год|рік)\s*(?:постройки|будівництва|здачі|сдачи)?\s*[:—-]?\s*((?:18|19|20)\d{2})/i)?.[1]||text.match(/(?:побудов[а-яіїє]*|построен|збудован|сдан|здан)\D{0,20}((?:18|19|20)\d{2})/i)?.[1]||text.match(/((?:18|19|20)\d{2})\s*(?:рік|год)\s*(?:побудови|постройки)/i)?.[1]||0);
const verifiedFromText=(text:string)=>/перевірен|проверен|verified/i.test(text);
const programTags=(text:string)=>{const t=text.toLowerCase(),a=[] as string[];if(/єосел|еосел/.test(t))a.push("єОселя");if(/євіднов|евіднов|житлов(?:ий|ой) сертифікат|сертификат на жиль/.test(t))a.push("єВідновлення / сертификат");for(const n of [280,719,1176])if(new RegExp(`(?:постанова|постановление)[^0-9]{0,20}${n}`).test(t))a.push(`Постановление №${n}`);return a};

type Filters={country?:string;region?:string;city?:string;district?:string;property_type?:string;deal_type?:string;rooms?:string|number;price_from?:number;price_to?:number;area_from?:number;area_to?:number;complex?:string;complex_source_url?:string;condition?:string;floor_from?:number;floor_to?:number;land_area_from?:number;land_area_to?:number;construction_year_from?:number;construction_year_to?:number;verified_only?:boolean;programs?:string[];page?:number;pages?:number;sources?:string[];_uahPerUsd?:number;_complex_year?:number};
type Item={external_id:string;source_name:string;source_url:string;title:string;description:string;country:string;region:string;city:string;district:string;property_type:string;deal_type:string;rooms:number|null;price:number;area:number;currency:string;complex_name:string;main_photo_url:string;photo_urls:string[];published_at:string|null;raw_data:any};

async function proxyPresentationImage(value:string){
  let url:URL;
  try{url=new URL(String(value||""))}catch{return new Response(JSON.stringify({error:"invalid image url"}),{status:400,headers:CORS})}
  const host=url.hostname.toLowerCase();
  if(url.protocol!=="https:"||!IMAGE_HOST_SUFFIXES.some(s=>host===s||host.endsWith(`.${s}`)))return new Response(JSON.stringify({error:"image host is not allowed"}),{status:403,headers:CORS});
  const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),20000);
  try{
    const referer=host.includes("rieltor")?"https://rieltor.ua/":host.includes("riastatic")||host.includes("ria.com")?"https://dom.ria.com/":host.includes("olxcdn")?"https://www.olx.ua/":undefined;
    const imageHeaders={...HEADERS,Accept:"image/avif,image/webp,image/apng,image/*,*/*;q=.8",...(referer?{Referer:referer}:{})};
    const response=await fetch(url,{headers:imageHeaders,redirect:"follow",signal:controller.signal});
    if(!response.ok)return new Response(JSON.stringify({error:`image upstream ${response.status}`}),{status:502,headers:CORS});
    const type=(response.headers.get("content-type")||"").split(";")[0].trim().toLowerCase();
    if(!type.startsWith("image/"))return new Response(JSON.stringify({error:"upstream is not an image"}),{status:415,headers:CORS});
    const bytes=await response.arrayBuffer();
    if(bytes.byteLength>12*1024*1024)return new Response(JSON.stringify({error:"image is too large"}),{status:413,headers:CORS});
    return new Response(bytes,{headers:{"Access-Control-Allow-Origin":"*","Content-Type":type,"Cache-Control":"public, max-age=3600"}});
  }catch(e){return new Response(JSON.stringify({error:e instanceof Error?e.message:String(e)}),{status:502,headers:CORS})}
  finally{clearTimeout(timer)}
}

const decodeHtml=(value="")=>String(value)
  .replace(/&quot;|&#34;/gi,'"').replace(/&#39;|&apos;/gi,"'")
  .replace(/&amp;/gi,"&").replace(/&lt;/gi,"<").replace(/&gt;/gi,">")
  .replace(/&nbsp;|&#160;/gi," ").trim();

async function presentationDetail(value:string){
  let url:URL;
  try{url=new URL(String(value||""))}catch{return new Response(JSON.stringify({error:"invalid listing url"}),{status:400,headers:CORS})}
  const host=url.hostname.toLowerCase();
  if(url.protocol!=="https:"||!LISTING_HOST_SUFFIXES.some(s=>host===s||host.endsWith(`.${s}`)))return new Response(JSON.stringify({error:"listing host is not allowed"}),{status:403,headers:CORS});
  const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),18000);
  try{
    const fetchCandidates=[url];
    if(host==="m.olx.ua"){
      const desktop=new URL(url.toString());desktop.hostname="www.olx.ua";desktop.searchParams.set("currency","USD");fetchCandidates.push(desktop);
    }
    let response:Response|null=null;
    for(const candidate of fetchCandidates){for(let tryNo=0;tryNo<3&&!response;tryNo++){try{const attempt=await fetch(candidate,{headers:{...HEADERS,"Sec-Fetch-Dest":"document","Sec-Fetch-Mode":"navigate","Upgrade-Insecure-Requests":"1"},redirect:"follow",signal:controller.signal});if(attempt.ok){response=attempt;url=new URL(attempt.url);break}if(![403,429,503].includes(attempt.status))break;await sleep(900*(tryNo+1))}catch{break}}if(response)break}
    if(!response)return new Response(JSON.stringify({error:"listing upstream unavailable"}),{status:502,headers:CORS});
    if(!response.ok)return new Response(JSON.stringify({error:`listing upstream ${response.status}`}),{status:502,headers:CORS});
    const html=await response.text();
    const pageText=clean(html);
    const meta=(key:string)=>decodeHtml(
      html.match(new RegExp(`<meta[^>]+(?:property|name)=["']${key}["'][^>]+content=["']([^"']+)["']`,`i`))?.[1]||
      html.match(new RegExp(`<meta[^>]+content=["']([^"']+)["'][^>]+(?:property|name)=["']${key}["']`,`i`))?.[1]||""
    );
    const candidates:string[]=[];
    for(const key of ["og:image","og:image:secure_url","twitter:image"]){const v=meta(key);if(v)candidates.push(v)}
    for(const match of html.matchAll(/<meta[^>]+(?:property|name)=["']og:image(?::secure_url)?["'][^>]+content=["']([^"']+)["']/gi))candidates.push(decodeHtml(match[1]));
    for(const match of html.matchAll(/(?:src|data-src|data-lazy-src|data-original)=["']([^"']+)["']/gi))candidates.push(decodeHtml(match[1]));
    for(const match of html.matchAll(/(?:srcset|data-srcset)=["']([^"']+)["']/gi))for(const entry of decodeHtml(match[1]).split(","))candidates.push(entry.trim().split(/\s+/)[0]);
    for(const match of html.matchAll(/["'](?:image|imageUrl|photo|photoUrl|fullUrl|large|url|link)["']\s*:\s*["'](https?:\\?\/\\?\/[^"']+)["']/gi))candidates.push(decodeHtml(match[1].replace(/\\u002F/gi,"/").replace(/\\\//g,"/")));
    for(const match of html.matchAll(/https?:\\?\/\\?\/[^"'\\\s<>]*olxcdn\.com[^"'\\\s<>]*/gi))candidates.push(decodeHtml(match[0].replace(/\\u002F/gi,"/").replace(/\\u0026/gi,"&").replace(/\\\//g,"/")));
    for(const block of html.matchAll(/<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)){
      try{const json=JSON.parse(block[1]);const stack=[json];while(stack.length){const node=stack.pop();if(Array.isArray(node)){stack.push(...node);continue}if(!node||typeof node!=="object")continue;for(const [key,val] of Object.entries(node)){if(/^(image|images|photo|photos|contentUrl|thumbnailUrl)$/i.test(key)){for(const entry of (Array.isArray(val)?val:[val]))if(typeof entry==="string")candidates.push(entry);else if(entry&&typeof entry==="object")stack.push(entry)}else if(val&&typeof val==="object")stack.push(val)}}}catch{/* malformed source JSON-LD */}
    }
    const riaGalleryCandidates:string[]=[];
    if(host.endsWith("dom.ria.com")){
      for(const tagMatch of html.matchAll(/<img\b[^>]*\balt=["'][^"']*(?:фото|photo)\s*\d+[^"']*["'][^>]*>/gi)){
        const tag=tagMatch[0];
        for(const attr of tag.matchAll(/(?:src|data-src|data-lazy-src|data-original)=["']([^"']+)["']/gi))riaGalleryCandidates.push(decodeHtml(attr[1]));
        for(const attr of tag.matchAll(/(?:srcset|data-srcset)=["']([^"']+)["']/gi)){
          for(const entry of decodeHtml(attr[1]).split(","))riaGalleryCandidates.push(entry.trim().split(/\s+/)[0]);
        }
      }
    }
    const olxGalleryCandidates:string[]=[];
    if(host.endsWith("olx.ua")){
      for(const tagMatch of html.matchAll(/<img\b[^>]*\balt=["'][^"']+["'][^>]*>/gi)){
        const tag=tagMatch[0];
        if(!/olxcdn\.com/i.test(tag)||/avatar|profile|location|map|logo/i.test(tag))continue;
        for(const attr of tag.matchAll(/(?:src|data-src|data-lazy-src|data-original)=["']([^"']+)["']/gi))olxGalleryCandidates.push(decodeHtml(attr[1]));
        for(const attr of tag.matchAll(/(?:srcset|data-srcset)=["']([^"']+)["']/gi)){
          for(const entry of decodeHtml(attr[1]).split(","))olxGalleryCandidates.push(entry.trim().split(/\s+/)[0]);
        }
      }
    }
    const imagePool=riaGalleryCandidates.length?riaGalleryCandidates:olxGalleryCandidates.length?olxGalleryCandidates:candidates;
    const photoIdentity=(value:string)=>{
      try{
        const u=new URL(value);
        const filePart=u.pathname.includes("/files/")?u.pathname.split("/files/")[1]?.split("/")[0]:"";
        if(filePart)return "olx:"+filePart;
        const ria=u.pathname.match(/(?:realty__|\/)(\d{7,})(?:[-_.]|$)/i)?.[1];
        if(ria)return "ria:"+ria;
        return (u.hostname+u.pathname).toLowerCase().replace(/;s=\d+x\d+$/i,"").replace(/[-_]\d+x\d+(?:x\d+)?(?=\.[a-z0-9]+$)/i,"");
      }catch{return value}
    };
    const seenImages=new Set<string>();
    const images=imagePool.map(v=>{try{return new URL(v,url).toString()}catch{return ""}}).filter(v=>{
      if(!/^https:\/\//i.test(v))return false;
      try{
        const h=new URL(v).hostname.toLowerCase(),key=photoIdentity(v);
        if(seenImages.has(key))return false;
        const allowed=IMAGE_HOST_SUFFIXES.some(s=>h===s||h.endsWith("."+s))&&!/logo|avatar|sprite|icon|placeholder/i.test(v);
        if(allowed)seenImages.add(key);
        return allowed;
      }catch{return false}
    }).slice(0,40);
    const rawTitle=meta("og:title")||clean(html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1]||"");
    const title=host.endsWith("olx.ua")?rawTitle.replace(/:\s*[\d\s.,]+\s*(?:грн\.?|\$|USD|EUR)[\s\S]*$/i,"").replace(/\s+-\s+(?:Продаж|Продажа|Оренда|Аренда)[\s\S]*$/i,"").trim():rawTitle;
    const sellerDescription=pageText.match(/(?:Опис від продавця|Описание от продавца)\s+([\s\S]{20,5000}?)(?=\s+(?:Повний опис|Полное описание|Характеристика будівлі|Характеристика здания|Оголошення неактуальне|Объявление неактуально))/i)?.[1]||"";
    const descriptionBlock=pageText.match(/(?:Опис|Описание)\s+([\s\S]{60,5000}?)(?=\s+ID:\s*\d+|\s+Поскаржитися|\s+Пожаловаться|\s+Зв['’]язатися|\s+Связаться)/i)?.[1]||"";
    const description=sellerDescription||descriptionBlock||meta("og:description")||meta("description")||"";
    const valueAfter=(labels:string)=>clean(pageText.match(new RegExp(`(?:${labels})\\s*:?\\s*([^|]{1,180}?)(?=\\s+(?:Приватна особа|Частное лицо|Вид об['’]єкта|Вид объекта|Без комісії|Без комиссии|Можливість обміну|Возможность обмена|Тип будинку|Тип дома|Назва ЖК|Название ЖК|Поверх|Этаж|Поверховість|Этажность|Загальна площа|Общая площадь|Тип угоди|Тип сделки|Площа кухні|Площадь кухни|Тип стін|Тип стен|Клас житла|Класс жилья|Кількість кімнат|Количество комнат|Планування|Планировка|Санвузол|Санузел|Ремонт|Інфраструктура|Инфраструктура|Опис|Описание)|$)`,`i`))?.[1]||"");
    const floorPair=host.endsWith("dom.ria.com")?(pageText.match(/(\d{1,3})\s+(?:поверх|этаж)\s+(?:з|из)\s+(\d{1,3})/i)||pageText.match(/(?:Поверх(?!ов)|Этаж(?!н))\s*:?\s*(\d{1,3})\s*(?:з|из)\s*(\d{1,3})/i)):null;
    const floorInDescription=host.endsWith("dom.ria.com")?description.match(/(?:на|розташован[а-яіїє]*)\s+(\d{1,3})\s+(?:поверс|этаж)/i):null;
    const explicitFloor=pageText.match(/(?:Поверх(?!ов)|Этаж(?!н))\s*:?\s*(\d{1,3})(?=\s|$)/i);
    const floor=floorPair?num(floorPair[1]):floorInDescription?num(floorInDescription[1]):explicitFloor?num(explicitFloor[1]):0;
    const totalFloors=floorPair?num(floorPair[2]):num(pageText.match(/(?:Поверховість|Этажность)\s*:?\s*(\d{1,3})/i)?.[1]||"");
    const riaArea=host.endsWith("dom.ria.com")?pageText.match(/(?:Загальна площа|Общая площадь)\s*:?\s*(\d{1,4}(?:[.,]\d{1,2})?)\s*(?:м²|м2)/i):null;
    const riaRooms=host.endsWith("dom.ria.com")?pageText.match(/(?:Кількість кімнат|Количество комнат)\s*:?\s*(\d{1,2})/i):null;
    const area=riaArea?num(riaArea[1]):num(valueAfter("Загальна площа|Общая площадь"));
    const rooms=riaRooms?num(riaRooms[1]):num(valueAfter("Кількість кімнат|Количество комнат"));
    const details={floor:floor||null,total_floors:totalFloors||null,area:area||null,rooms:rooms||null,
      complex_name:valueAfter("Назва ЖК|Название ЖК"),property_type:valueAfter("Вид об['’]єкта|Вид объекта"),
      deal_type:valueAfter("Тип угоди|Тип сделки"),kitchen_area:num(valueAfter("Площа кухні|Площадь кухни"))||null,
      wall_type:valueAfter("Тип стін|Тип стен"),condition:valueAfter("Ремонт"),layout:valueAfter("Планування|Планировка")};
    const cleanDetailText=(value:string)=>clean(value)
      .replace(/(?:^|[\s·|,;()])(?:ID|Код\s+(?:объекта|об'єкта))\s*[:#№-]?\s*[A-Za-zА-Яа-яІіЇїЄє0-9_-]*\d[A-Za-zА-Яа-яІіЇїЄє0-9_-]*/giu," ")
      .replace(/\bhttps?:\/\/[^\s<>"']+/gi," ")
      .replace(/\bwww\.[^\s<>"']+/gi," ")
      .replace(/\s+/g," ").trim();
    // REM / RIELTOR.UA / ЛУН: точные поля, полный опис и только фото этого объявления
    let outTitle=title,outDescription=description,outImages=images,outDetails:any=details;
    const pick=(re:RegExp)=>clean(pageText.match(re)?.[1]||"");
    const isRem=host.endsWith("rem.ua"),isRieltor=host.endsWith("rieltor.ua"),isLun=host.endsWith("lun.ua");
    if(isRem||isRieltor||isLun){
      const fd:any={...details};
      if(isRem){
        outTitle=rawTitle.replace(/\s*\|\s*REM\.ua.*$/i,"").trim();
        outDescription=pick(/Поділитися\s+([\s\S]{30,6000}?)\s+(?:Додаткова інформація|Характеристики\s+Покази)/i)||pick(/Поделиться\s+([\s\S]{30,6000}?)\s+(?:Дополнительная информация|Характеристики)/i)||description.replace(/^[\d\s]+\$\s+R\d+\s+/,"");
        fd.rooms=num(pick(/(?:Кімнат|Комнат):\s*(\d{1,2})/i))||null;fd.area=num(pick(/(?:Загальна площа|Общая площадь):\s*(\d{1,4}(?:[.,]\d+)?)/i))||null;
        fd.kitchen_area=num(pick(/(?:Площа кухні|Площадь кухни):\s*(\d{1,3}(?:[.,]\d+)?)/i))||null;fd.floor=num(pick(/(?:Поверх|Этаж):\s*(\d{1,3})/i))||fd.floor;fd.total_floors=num(pick(/(?:Поверховість|Этажность):\s*(\d{1,3})/i))||fd.total_floors;
        fd.condition=pick(/(?:Стан|Состояние):\s*([^:]{2,40}?)\s+(?:Матеріал|Материал|Вікна|Окна|Опалення|Отопление)/i);fd.wall_type=pick(/(?:Матеріал|Материал):\s*([^:]{2,40}?)\s+(?:Вікна|Окна|Опалення|Отопление)/i);fd.layout="";
        const objId=html.match(/apartments_\d+_(\d+)|images\/apartments\/(\d+)/i);const id=objId?.[1]||objId?.[2]||"";
        const own=[...html.matchAll(/https?:\/\/storage\.rem\.ua\/rem-storage\/uploads\/objects\/[^"'\s<>]+\.(?:jpe?g|png|webp)/gi)].map(m=>m[0]).filter(u=>!id||u.includes(id));
        if(own.length)outImages=[...new Set(own)].slice(0,40);
      }else{
        // RIELTOR.UA и ЛУН используют одно хранилище фото (lunstatic): берём крупнейший вариант каждого снимка, без аватаров и видео
        const best=new Map<string,{u:string,w:number}>();
        for(const m of html.matchAll(/https?:\/\/market-images\.lunstatic\.net\/lun-ua\/(?:t\.[\d.]+\/)?(\d+|origin)\/?(\d+)?\/?images\/offers\/([A-Za-z0-9]+)\.(jpe?g|png)(?![.\w])/gi)){const w=m[1]==="origin"?9999:Number(m[1]||0),k=m[3];const prev=best.get(k);if(!prev||w>prev.w)best.set(k,{u:m[0],w})}
        const own=[...best.values()].filter(x=>x.w>=400).map(x=>x.u);
        if(own.length)outImages=own.slice(0,40);
        if(isRieltor){
          outTitle=rawTitle.replace(/\s+-\s+Оголошення\s*№?\s*\d+[\s\S]*$/i,"").replace(/\s+-\s+Объявление\s*№?\s*\d+[\s\S]*$/i,"").replace(/^(?:Продаж|Оренда|Продажа|Аренда)\s+[^:]{2,40}:\s*/i,"").trim();
          outDescription=pick(/(?:^|\s)Опис\s+([\s\S]{30,6000}?)(?=\s+(?:Комунікації|Планування|Записатись на перегляд|Показати телефон|Історія зміни ціни|Рекомендувати))/i)||pick(/(?:^|\s)Описание\s+([\s\S]{30,6000}?)(?=\s+(?:Коммуникации|Планировка|Показать телефон|История изменения цены))/i)||description;
          fd.rooms=num(pick(/(?:Кількість кімнат|Количество комнат):\s*(\d{1,2})/i))||null;fd.area=num(pick(/(?:Загальна площа|Общая площадь):\s*(\d{1,4}(?:[.,]\d+)?)/i))||null;
          fd.floor=num(pick(/(?:Поверх|Этаж):\s*(\d{1,3})/i))||fd.floor;fd.total_floors=num(pick(/(?:Поверховість|Этажность):\s*(\d{1,3})/i))||fd.total_floors;
          fd.condition=pick(/(?:Загальний стан квартири|Загальний стан|Общее состояние квартиры|Общее состояние):\s*([^:]{2,40}?)\s+(?:Тип кухні|Тип кухни|Кількість|Количество|Висота|Высота)/i);fd.wall_type=pick(/(?:Технологія будівництва|Технология строительства):\s*([^:]{2,40}?)\s+(?:Рік|Год|Інфраструктура|Инфраструктура)/i);fd.layout="";
        }else{
          outTitle=rawTitle.replace(/\s+—\s+ЛУН.*$/i,"").replace(/,\s*[\d\s]+\s*(?:\$|грн|€)\s*$/i,"").trim();
          outDescription=pick(/(?:^|\s)Опис\s+([\s\S]{30,6000}?)(?=\s+(?:В квартирі є|У квартирі є|В будинку є|Фототур|Історія зміни ціни|Місцезнаходження|Розміщено))/i)||pick(/(?:^|\s)Описание\s+([\s\S]{30,6000}?)(?=\s+(?:В квартире есть|Фототур|История изменения цены|Местоположение))/i)||description;
          const areas=pageText.match(/(\d{1,4}(?:[.,]\d+)?)\s*(?:\/\s*[\d.,]+\s*){0,2}м²/);fd.area=areas?num(areas[1]):null;
          fd.rooms=num(pick(/(\d{1,2})\s+(?:кімнат|комнат)/i))||num(outTitle.match(/(\d)-кімнатн|(\d)-комнатн/i)?.slice(1).find(Boolean)||"")||null;
          const fl=pageText.match(/поверх\s+(\d{1,3})\s+з\s+(\d{1,3})|этаж\s+(\d{1,3})\s+из\s+(\d{1,3})/i);if(fl){fd.floor=num(fl[1]||fl[3]);fd.total_floors=num(fl[2]||fl[4]);}
          fd.condition=/з ремонтом|с ремонтом/i.test(pageText.slice(0,4000))?"З ремонтом":"";fd.layout="";
        }
      }
      outDetails=fd;
    }
    return new Response(JSON.stringify({success:true,url:url.toString(),title:cleanDetailText(outTitle),description:cleanDetailText(outDescription),images:outImages,details:outDetails}),{headers:CORS});
  }catch(e){return new Response(JSON.stringify({error:e instanceof Error?e.message:String(e)}),{status:502,headers:CORS})}
  finally{clearTimeout(timer)}
}

function passes(x:Item,f:Filters){const roomsPlus=/\+/.test(String(f.rooms||"")),room=parseInt(String(f.rooms||0))||0,text=`${x.title||""} ${x.description||""} ${JSON.stringify(x.raw_data||{})}`,floor=num(x.raw_data?.floor)||floorFromText(text).floor,land=num(x.raw_data?.land_area)||landAreaFromText(text),year=num(x.raw_data?.construction_year)||yearFromText(text),condition=(["С ремонтом","Без ремонта"].includes(String(x.raw_data?.condition||""))?String(x.raw_data?.condition):conditionTag(text));return(!f.district||f.district==="Все"||districtCanon(x.district)===districtCanon(f.district))&&(!room||(roomsPlus?Number(x.rooms||0)>=room:Number(x.rooms||0)===room))&&(!f.price_from||x.price>=Number(f.price_from))&&(!f.price_to||x.price<=Number(f.price_to))&&(!f.area_from||x.area>=Number(f.area_from))&&(!f.area_to||x.area<=Number(f.area_to))&&(!f.complex||f.complex==="Все"||complexMatches(`${x.complex_name} ${x.title} ${x.description}`,f.complex))&&(!f.condition||f.condition==="Все"||condition===f.condition)&&(!f.floor_from||floor>=Number(f.floor_from))&&(!f.floor_to||floor>0&&floor<=Number(f.floor_to))&&(!f.land_area_from||land>=Number(f.land_area_from))&&(!f.land_area_to||land>0&&land<=Number(f.land_area_to))&&(!f.construction_year_from||year>=Number(f.construction_year_from))&&(!f.construction_year_to||year>0&&year<=Number(f.construction_year_to))&&(!f.verified_only||verifiedFromText(text))&&(!(f.programs||[]).length||(f.programs||[]).some(p=>programTags(text).includes(p)));}

function countFrom(html:string,source:string){
  if(source==="ЛУН"){const m=html.match(/>\s*(\d[\d\s\u00a0]{0,9})\s*(?:квартир[аи]?|будин(?:ок|ки|ків)|ділян(?:ка|ки|ок))\s*</i);if(m)return num(m[1]);}
  const t=clean(html);
  // DIM.RIA prints the exact catalog total in the filter button, for example
  // "Показати 8 885 оголошень". Prefer this explicit value over the number of
  // cards parsed from the current page.
  if(source==="DIM.RIA Украина"){
    // Current DIM.RIA SSR pages keep the catalog total in the embedded state.
    const stateTotal=html.match(/["']realtyCountCatalog["']\s*:\s*(\d+)/i)||html.match(/["']offerCount["']\s*:\s*(\d+)/i);
    if(stateTotal){const value=num(stateTotal[1]);if(value>0)return value}
    const exact=t.match(/Показати\s+([\d\s\u00a0]+)\s+оголошень/iu)||t.match(/Показать\s+([\d\s\u00a0]+)\s+объявлен/iu);
    if(exact){const value=num(exact[1]);if(value>0)return value}
  }
  // RIELTOR.UA: заголовок выдачи «63 оголошення» / «4 471 оголошення» (2–4 → «оголошення», не только «оголошень»)
  if(source==="RIELTOR.UA"){const m=t.match(/(?<![\d\s\u00a0])\s*(\d{1,3}(?:[\s\u00a0]\d{3})*|\d+)\s+оголошен(?:ня|ь)(?![а-яіїєґ])/iu);if(m){const value=num(m[1]);if(value>0)return value}}
  const patterns=source==="OLX"?[/Ми знайшли(?:\s+понад)?\s+([\d\s\u00a0]+)/iu,/Найдено(?:\s+более)?\s+([\d\s\u00a0]+)/iu]:[/Знайдено\s+([\d\s\u00a0]+)\s+(?:пропози|оголош)/iu,/([\d\s\u00a0]+)\s+(?:пропозицій|оголошень|объявлений|об'єктів|объектов|обʼєктів)/iu];
  for(const r of patterns){const m=t.match(r);if(m){const value=num(m[1]);if(value>0)return value}}
  return null;
}

const citySlug=(v="")=>{const k=v.trim().toLowerCase(),m:any={"одеса":"odessa","одесса":"odessa","київ":"kiev","киев":"kiev","харків":"kharkov","харьков":"kharkov","дніпро":"dnepr","днепр":"dnepr","львів":"lvov","львов":"lvov","запоріжжя":"zaporozhe","запорожье":"zaporozhe","вінниця":"vinnitsa","винница":"vinnitsa","миколаїв":"nikolaev","николаев":"nikolaev","полтава":"poltava","черкаси":"cherkassy","черкассы":"cherkassy","чернігів":"chernigov","чернигов":"chernigov","суми":"sumy","житомир":"zhitomir","рівне":"rovno","ровно":"rovno","луцьк":"lutsk","луцк":"lutsk","ужгород":"uzhgorod","чернівці":"chernovtsy","черновцы":"chernovtsy","івано-франківськ":"ivano-frankovsk","ивано-франковск":"ivano-frankovsk","хмельницький":"khmelnitskiy","хмельницкий":"khmelnitskiy","тернопіль":"ternopol","тернополь":"ternopol","кропивницький":"kropivnitskiy","кропивницкий":"kropivnitskiy","херсон":"kherson","лиманка":"myzykevycha-ovydyopol","таїрове":"myzykevycha-ovydyopol","таирово":"myzykevycha-ovydyopol"};return m[k]||""};
const cityKey=(v="")=>String(v||"").trim().toLowerCase().replace(/[ʼ’'`]/g,"").replace(/ё/g,"е");
const portalSlug=(portal:"olx"|"dim"|"rieltor",v="")=>{const k=cityKey(v);const rec=(UA_SLUGS as any)[k]||(UA_SLUGS as any)[(UA_UK as any)[k]||""];return rec&&portal in rec?String(rec[portal]||""):undefined};
let UAH_PER_USD=0,UAH_AT=0;
async function loadUah(){if(UAH_PER_USD&&Date.now()-UAH_AT<6*3600000)return;try{const r=await fetch("https://bank.gov.ua/NBUStatService/v1/statdirectory/exchange?valcode=USD&json");const j=await r.json();const v=Number(j?.[0]?.rate||0);if(v>0){UAH_PER_USD=v;UAH_AT=Date.now()}}catch{}}
const uahToUsd=(v:number)=>v>0&&UAH_PER_USD>0?Math.round(v/UAH_PER_USD):0;
const isRent=(f:Filters)=>/аренд|оренд|rent/i.test(String(f.deal_type||""));
const geo=(f:Filters)=>({country:f.country||"Украина",region:f.region||"",city:f.city&&!/^(все|усі)$/i.test(f.city)?f.city:"",district:districtCanon(f.district||"")});
const selectedPropertyType=(f:Filters)=>String(f.property_type||"Квартира").trim();
const propertyGroup=(f:Filters)=>{const v=selectedPropertyType(f).toLowerCase();if(/участ|земел|ділян/.test(v))return"land";if(/коммер|комерц/.test(v))return"commercial";if(/комнат|кімнат/.test(v))return"room";if(/гараж|парком/.test(v))return"garage";if(/дом|будинок|таунхаус|дуплекс|коттедж|котедж/.test(v))return"house";if(/другое|інше|other/.test(v))return"other";return"apartment"};
const propertyLabel=(f:Filters)=>{const v=selectedPropertyType(f);return !v||v==="Все"?"Квартира":v};
function olxUrl(f:Filters){const original=geo(f),g={...original,city:String((f as any)._requested_city||original.city||""),district:districtCanon(String((f as any)._requested_district||original.district||""))},slug=portalSlug("olx",g.city)??citySlug(g.city),group=propertyGroup(f),category:any=(isRent(f)?{apartment:"kvartiry/dolgosrochnaya-arenda-kvartir",house:"doma/arenda-domov",land:"zemlya/arenda-zemli",commercial:"kommercheskaya-nedvizhimost/arenda-kommercheskoy-nedvizhimosti",room:"komnaty/dolgosrochnaya-arenda-komnat",garage:"garazhi-parkovki/arenda-garazhey-parkovok",other:""}:{apartment:"kvartiry/prodazha-kvartir",house:"doma/prodazha-domov",land:"zemlya/prodazha-zemli",commercial:"kommercheskaya-nedvizhimost/prodazha-kommercheskoy-nedvizhimosti",room:"komnaty/prodazha-komnat",garage:"garazhi-parkovki/prodazha-garazhey-parkovok",other:""})[group]||(isRent(f)?"kvartiry/dolgosrochnaya-arenda-kvartir":"kvartiry/prodazha-kvartir"),complexQuery=group==="apartment"?String(f.complex||"").replace(/(?:^|\s)ЖК(?=\s|$)/gi," ").trim():"",subtypeQuery=group==="house"&&/^(Таунхаус|Дуплекс|Коттедж)$/i.test(selectedPropertyType(f))?selectedPropertyType(f):"",query=complexQuery||subtypeQuery,searchPath=query?`q-${encodeURIComponent(query)}/`:"",root=`https://www.olx.ua/uk/nedvizhimost/${category?category+"/":""}`,u=new URL(slug?`${root}${slug}/${searchPath}`:`${root}${searchPath}`);const ids:any={"Киевский":85,"Приморский":89,"Хаджибейский":87,"Пересыпский":91};u.searchParams.set("currency","USD");if(slug==="odessa"&&ids[g.district])u.searchParams.set("search[district_id]",String(ids[g.district]));if(f.price_from)u.searchParams.set("search[filter_float_price:from]",String(f.price_from));if(f.price_to)u.searchParams.set("search[filter_float_price:to]",String(f.price_to));const roomEnum:any={"1":"odnokomnatnye","2":"dvuhkomnatnye","3":"trehkomnatnye","4":"chetyrehkomnatnye"};if(group==="apartment"&&roomEnum[String(f.rooms||"").replace("+","")])u.searchParams.set("search[filter_enum_number_of_rooms_string][0]",roomEnum[String(f.rooms).replace("+","")]);if(f.area_from)u.searchParams.set("search[filter_float_total_area:from]",String(f.area_from));if(f.area_to)u.searchParams.set("search[filter_float_total_area:to]",String(f.area_to));if(group==="apartment"&&f.floor_from)u.searchParams.set("search[filter_float_floor:from]",String(f.floor_from));if(group==="apartment"&&f.floor_to)u.searchParams.set("search[filter_float_floor:to]",String(f.floor_to));return u.toString()}
function domUrl(f:Filters){const g=geo(f),slug=portalSlug("dim",g.city)??citySlug(g.city),group=propertyGroup(f),section:any=(isRent(f)?{apartment:"arenda-kvartir",house:"arenda-domov",land:"arenda-uchastkov",commercial:"arenda-kom-nedvizhimosti",room:"arenda-komnat",garage:"arenda-garazhei",other:"arenda-kvartir"}:{apartment:"prodazha-kvartir",house:"prodazha-domov",land:"prodazha-uchastkov",commercial:"prodazha-kom-nedvizhimosti",room:"prodazha-komnat",garage:"prodazha-garazhei",other:"prodazha-nedvizhimosti"})[group]||(isRent(f)?"arenda-kvartir":"prodazha-kvartir"),paths:any={"Киевский":"kyevskyi","Приморский":"prymorskyi","Хаджибейский":"malynovskyi","Пересыпский":"suvorovskyi"};if(slug==="odessa"&&paths[g.district])return `https://dom.ria.com/uk/${section}/odessa-rayon-${paths[g.district]}/`;return slug?`https://dom.ria.com/uk/${section}/${slug}/`:`https://dom.ria.com/uk/${section}/`;}
const resolvedDomCache=new Map<string,{url:string;at:number}>();
async function resolvedDomUrl(f:Filters){const fallback=domUrl(f);if(propertyGroup(f)!=="apartment"||isRent(f))return fallback;const raw=String(f.complex_source_url||""),cached=resolvedDomCache.get(raw);if(cached&&Date.now()-cached.at<900000)return cached.url;try{const source=new URL(raw);if(source.protocol!=="https:"||source.hostname!=="dom.ria.com"||!source.pathname.includes("/novostroyka-"))return fallback;const response=await fetch(source.toString(),{headers:HEADERS,redirect:"follow"});if(!response.ok)return fallback;const html=await response.text(),escaped=html.replace(/&amp;/g,"&"),id=source.pathname.match(/-(\d+)\/?$/)?.[1]||"";const links=[...escaped.matchAll(/href=["']([^"']*\/uk\/prodazha-kvartir\/[^"']*-zhk-[^"']+-\d+\/?)["']/gi)].map(m=>m[1]);const exact=links.find(link=>!!id&&new RegExp(`-${id}\\/?(?:[?#]|$)`).test(link))||links[0];if(exact){const url=new URL(exact,source.origin).toString();resolvedDomCache.set(raw,{url,at:Date.now()});return url}const slugMatch=source.pathname.match(/\/novostroyka-zhk-(.+)-(\d+)\/?$/i);if(!slugMatch)return fallback;const complexSlug=slugMatch[1].replace(/perlyna/gi,"zhemchuzhyna"),complexId=slugMatch[2],g=geo(f),mapped=citySlug(g.city);const prefixes=[mapped,/одес|одеськ/i.test(String(g.region||""))?"myzykevycha-ovydyopol":"",/одес|одеськ/i.test(String(g.region||""))?"odessa":""].filter(Boolean);const candidates=[...new Set(prefixes)].map(prefix=>`https://dom.ria.com/uk/prodazha-kvartir/${prefix}-zhk-${complexSlug}-${complexId}/`);const checked=await Promise.all(candidates.map(async url=>{try{const r=await fetch(url,{headers:HEADERS,redirect:"follow"});const text=r.ok?await r.text():"";return r.ok&&new RegExp(`-${complexId}\\/?(?:[?#]|$)`).test(r.url)&&Number(countFrom(text,"DIM.RIA Украина")||0)>0?r.url:""}catch{return""}}));const found=checked.find(Boolean)||fallback;if(found!==fallback)resolvedDomCache.set(raw,{url:found,at:Date.now()});return found}catch{return fallback}};
const rieltorCitySlug=(v="")=>{const key=String(v||"").trim().toLowerCase();if(/^(лиманка|таїрове|таирово)$/.test(key))return"limanka";return citySlug(v)};
function rieltorUrl(f:Filters){const g=geo(f),slug=portalSlug("rieltor",g.city)??rieltorCitySlug(g.city),group=propertyGroup(f),section:any=(isRent(f)?{apartment:"flats-rent",house:"houses-rent",land:"areas-rent",commercial:"commercials-rent",room:"rooms-rent",garage:"flats-rent",other:"flats-rent"}:{apartment:"flats-sale",house:"houses-sale",land:"areas-sale",commercial:"commercials-sale",room:"rooms-sale",garage:"flats-sale",other:"flats-sale"})[group]||(isRent(f)?"flats-rent":"flats-sale"),paths:any={"Киевский":"%D0%9A%D0%B8%D1%97%D0%B2%D1%81%D1%8C%D0%BA%D0%B8%D0%B9-d24","Приморский":"%D0%9F%D1%80%D0%B8%D0%BC%D0%BE%D1%80%D1%81%D1%8C%D0%BA%D0%B8%D0%B9-d23","Хаджибейский":"%D0%A5%D0%B0%D0%B4%D0%B6%D0%B8%D0%B1%D0%B5%D0%B9%D1%81%D1%8C%D0%BA%D0%B8%D0%B9-d27","Пересыпский":"%D0%9F%D0%B5%D1%80%D0%B5%D1%81%D0%B8%D0%BF%D1%81%D1%8C%D0%BA%D0%B8%D0%B9-d30"};if(group==="apartment"&&slug==="odessa"&&paths[g.district])return `https://rieltor.ua/odessa/${section}/${paths[g.district]}/`;return slug?`https://rieltor.ua/${slug}/${section}/`:`https://rieltor.ua/${section}/`;}
const resolvedRieltorComplexCache=new Map<string,{url:string;at:number}>();
// ЖК на RIELTOR.UA по собственному алфавитному каталогу площадки (/novostroyki/<буква>/):
// там у каждого ЖК номер (-nID). Проверяем кандидатов в нужном городе и берём тот, где есть объявления.
const rieltorIndexCache=new Map<string,{list:{name:string,id:string}[],at:number}>();
async function rieltorIndexLetter(slug:string,letter:string){
  const key=`${slug}|${letter}`,c=rieltorIndexCache.get(key);if(c&&Date.now()-c.at<6*3600000)return c.list;
  const base=`https://rieltor.ua/${slug}/novostroyki/${letter==="a-z"?"a-z":encodeURIComponent(letter)}/`;
  const list:{name:string,id:string}[]=[];const seen=new Set<string>();
  const grab=(html:string)=>{for(const m of html.matchAll(/href=["'](?:https:\/\/rieltor\.ua)?(?:\/[a-z0-9-]+)?\/flats-sale\/([^"'\/]+)-n(\d+)\/?["']/gi)){if(seen.has(m[2]))continue;seen.add(m[2]);let name=m[1];try{name=decodeURIComponent(name.replace(/\+/g," "))}catch{}list.push({name,id:m[2]})}};
  const r=await politeFetch(base);if(!r.ok)return list;const html=await r.text();grab(html);
  const last=Math.min(8,Math.max(1,...[...html.matchAll(/[?&]page=(\d+)/g)].map(m=>Number(m[1]))));
  for(let p=2;p<=last;p++){await sleep(300);const rp=await politeFetch(`${base}?per-page=40&page=${p}`);if(rp.ok)grab(await rp.text())}
  rieltorIndexCache.set(key,{list,at:Date.now()});return list;
}
async function rieltorComplexFromIndex(f:Filters){
  const g=geo(f),slug=portalSlug("rieltor",g.city)??rieltorCitySlug(g.city);if(!slug)return"";
  const raw=String(f.complex||"").replace(/(?:^|\s)(?:ЖК|жк|Жк)(?=\s|$)/g," ").replace(/[«»"“”]/g,"").trim();if(!raw)return"";
  const first=(raw.match(/[A-Za-zА-ЯЁЄІЇҐа-яёєіїґ0-9]/)?.[0]||"").toUpperCase();if(!first)return"";
  const alt:any={"Э":["Е"],"Ы":["И"],"Ё":["Е"],"Е":["Є"],"И":["І"],"І":["И"],"Г":["Ґ"]};
  const letters=/[0-9]/.test(first)?["0-9"]:/[A-Z]/.test(first)?["a-z"]:[first,...(alt[first]||[])];
  const wanted=complexCanon(raw);let cands:{name:string,id:string,score:number}[]=[];
  for(const L of letters){for(const x of await rieltorIndexLetter(slug,L)){const c=complexCanon(x.name);const score=c===wanted?3:complexMatches(x.name,raw)?((c.includes(wanted)||wanted.includes(c))?2:1):0;if(score)cands.push({...x,score})}}
  // название в CRM кириллицей, а на площадке латиницей (Кадорр Сити → KADORR City) — смотрим и латинский раздел
  if(!cands.length&&!letters.includes("a-z")){for(const x of await rieltorIndexLetter(slug,"a-z")){if(complexMatches(x.name,raw))cands.push({...x,score:1})}}
  if(!cands.length)return"";
  cands.sort((a,b)=>b.score-a.score);cands=cands.filter(c=>c.score===cands[0].score).slice(0,5);
  const urlOf=(c:{name:string,id:string})=>`https://rieltor.ua/${slug}/flats-sale/${encodeURIComponent(c.name).replace(/%20/g,"+")}-n${c.id}/`;
  if(cands.length===1)return urlOf(cands[0]);
  let best="",bestCount=0;
  for(const c of cands){const url=urlOf(c);await sleep(400);const r=await politeFetch(url);if(!r.ok)continue;const html=await r.text();const n=Number(countFrom(html,"RIELTOR.UA")||0)||[...new Set([...html.matchAll(/flats-sale\/view\/(\d+)/g)].map(m=>m[1]))].length;if(n>bestCount){best=url;bestCount=n}}
  return best;
}
async function resolvedRieltorComplexUrl(f:Filters){
  const fallback=rieltorUrl(f);
  if(propertyGroup(f)!=="apartment"||isRent(f)||!f.complex||f.complex==="Все")return fallback;
  if(complexMatches(f.complex,"Акварель 3")&&/одес|odes/i.test(String(geo(f).city||"")))return "https://rieltor.ua/odessa/flats-sale/%D0%90%D0%BA%D0%B2%D0%B0%D1%80%D0%B5%D0%BB%D1%8C-3-n18807/";
  const key=`${latin(geo(f).city)}|${complexCanon(f.complex)}`,cached=resolvedRieltorComplexCache.get(key);
  if(cached&&Date.now()-cached.at<900000)return cached.url;
  try{const viaIndex=await rieltorComplexFromIndex(f);if(viaIndex){resolvedRieltorComplexCache.set(key,{url:viaIndex,at:Date.now()});return viaIndex}}catch{/* дальше — прежний способ */}
  try{
    // Resolve the exact RIELTOR ЖК catalog from a real RIELTOR card already
    // grouped under the requested ЖК by LUN. This avoids searching only the
    // first city pages, where many complexes never appear.
    try{
      const lunResponse=await fetch(lunUrl(f),{headers:HEADERS,redirect:"follow"});
      if(lunResponse.ok){
        const lunHtml=await lunResponse.text();
        const lunRieltorUrls=[...lunHtml.matchAll(/\\\"id\\\":(\\d+),\\\"groupId\\\":\\\"[^\\\"]*\\\",\\\"urlRaw\\\":\\\"([^\\\"]+)/g)].map(m=>decodeHtml(m[2]).replace(/\\\\\//g,"/")).filter(v=>/^https:\/\/rieltor\.ua\//i.test(v));
        const rieltorCard=lunRieltorUrls[0]||"";
        if(rieltorCard){
          const detail=await fetch(rieltorCard,{headers:HEADERS,redirect:"follow"});
          if(detail.ok){
            const detailHtml=await detail.text();
            const chip=detailHtml.match(/<a[^>]*data-analytics-event=["']card-click-newhouse_chip["'][^>]*href=["']([^"']+-n\d+\/?)[^"']*["']/i)?.[1]||
              detailHtml.match(/<a[^>]*href=["']([^"']+-n\d+\/?)[^"']*["'][^>]*data-analytics-event=["']card-click-newhouse_chip["']/i)?.[1];
            if(chip){
              const exact=new URL(chip,"https://rieltor.ua").toString();
              resolvedRieltorComplexCache.set(key,{url:exact,at:Date.now()});
              return exact;
            }
          }
        }
      }
    }catch{/* fall back to city discovery */}
    // Fallback: find one matching live card in the city pages, then read its chip.
    const discovery=await Promise.all(Array.from({length:3},async(_,i)=>{
      const url=pageUrl(fallback,i+1);
      try{const response=await fetch(url,{headers:HEADERS,redirect:"follow"});return response.ok?await response.text():""}catch{return""}
    }));
    const probeFilters={...f,condition:"",floor_from:undefined,floor_to:undefined,construction_year_from:undefined,construction_year_to:undefined,verified_only:false,programs:[]};
    const hit=discovery.flatMap(html=>html?parseGeneric(html,"RIELTOR.UA","https://rieltor.ua",probeFilters):[])[0];
    if(!hit?.source_url)return fallback;
    const detail=await fetch(hit.source_url,{headers:HEADERS,redirect:"follow"});
    if(!detail.ok)return fallback;
    const html=await detail.text();
    const chip=html.match(/<a[^>]*data-analytics-event=["']card-click-newhouse_chip["'][^>]*href=["']([^"']+-n\d+\/?)[^"']*["']/i)?.[1]||
      html.match(/<a[^>]*href=["']([^"']+-n\d+\/?)[^"']*["'][^>]*data-analytics-event=["']card-click-newhouse_chip["']/i)?.[1];
    if(!chip)return fallback;
    const exact=new URL(chip,"https://rieltor.ua").toString();
    resolvedRieltorComplexCache.set(key,{url:exact,at:Date.now()});
    return exact;
  }catch{return fallback}
}

function parseOlx(html:string,f:Filters){
  const original=geo(f),g={...original,city:String((f as any)._requested_city||original.city||""),district:districtCanon(String((f as any)._requested_district||original.district||""))},nativeComplexSearch=!!f.complex&&f.complex!=="Все",olxNativeRooms=propertyGroup(f)==="apartment"&&/^[1-4]\+?$/.test(String(f.rooms||"")),nativeFilters={...f,complex:nativeComplexSearch?"":f.complex,city:g.city,district:g.district,price_from:undefined,price_to:undefined,area_from:undefined,area_to:undefined,rooms:olxNativeRooms?"":f.rooms},marks=[...html.matchAll(/data-cy=["']l-card["']/gi)].map(m=>m.index||0),out:Item[]=[];
  for(let i=0;i<marks.length;i++){
    const seg=html.slice(marks[i],i+1<marks.length?marks[i+1]:marks[i]+15000);
    const href=seg.match(/href=["']([^"']*\/d\/(?:uk\/)?obyavlenie\/[^"']+)["']/i)?.[1];
    if(!href)continue;
    const text=clean(seg),url=abs(href,"https://www.olx.ua");
    const locationText=clean(seg.match(/data-testid=["']location-date["'][^>]*>([\s\S]*?)<\//i)?.[1]||"");
    const actualCity=locationText.split(",")[0].split(" - ")[0].trim();
    const actualDistrict=districtCanon(locationText.match(/(Київський|Киевский|Приморський|Приморский|Хаджибейський|Хаджибейский|Малиновський|Малиновский|Пересипський|Пересыпский|Суворівський|Суворовский)/i)?.[1]||"");
    const wantedCity=cityKeyUa(g.city),cardCity=cityKeyUa(actualCity);
    const allowedCities=wantedCity==="odessa"||wantedCity==="odesa"?["odessa","odesa"]:wantedCity==="myzykevychaovydyopol"||wantedCity==="limanka"||wantedCity==="tairove"?["limanka","tairove","tairovo"]:wantedCity?[wantedCity]:[];
    if(wantedCity&&(!cardCity||!allowedCities.some(city=>cardCity===city||cardCity.includes(city)||city.includes(cardCity))))continue;
    if(g.district&&(!actualDistrict||actualDistrict!==districtCanon(g.district)))continue;
    const title=clean(seg.match(/data-cy=["']ad-card-title["'][^>]*>([\s\S]*?)<\//i)?.[1]||seg.match(/<h\d[^>]*>([\s\S]*?)<\/h\d>/i)?.[1]||"OLX");
    const pm=text.match(/(\d{1,3}(?:[\s\u00a0.]\d{3})+(?:[,.]\d{1,2})?|\d+(?:[,.]\d{1,2})?)\s*(\$|USD|грн|₴)/i);
    const currencyToken=String(pm?.[2]||"").toUpperCase();
    // Strict source-price mode: the request itself asks OLX for USD. Never
    // convert a UAH card and never relabel it as USD; accept only the USD value
    // printed by OLX in this exact result card.
    if(!pm||!/^(\$|USD)$/.test(currencyToken))continue;
    const price=num(pm[1]);
    if(!Number.isFinite(price)||price<=0)continue;
    const area=areaFromCard(text,seg);
    const rooms=num(title.match(/(\d+)\s*[- ]?(?:кімн|комн)/i)?.[1]);
    const cardDistrict=clean(locationText.split(" - ")[0].split(",")[1]||"");const district=actualDistrict||districtCanon(text.match(/(Київський|Киевский|Приморський|Приморский|Хаджибейський|Хаджибейский|Малиновський|Малиновский|Пересипський|Пересыпский|Суворівський|Суворовский)/i)?.[1]||"");
    const imgs=[...seg.matchAll(/(?:src|data-src)=["']([^"']+)["']/gi)].map(m=>m[1]).filter(x=>/apollo\.olxcdn\.com/i.test(x));
    const x:Item={external_id:url.match(/ID([\w]+)/)?.[1]||url,source_name:"OLX",source_url:listingUrlInUsd(url,"OLX"),title,description:text.slice(0,1800),country:g.country,region:g.region,city:actualCity||g.city,district:district||cardDistrict,property_type:propertyLabel(f),deal_type:isRent(f)?"Аренда":"Продажа",rooms:rooms||roomsFromText(title)||roomsFromText(text.slice(0,400))||null,price,area,currency:"USD",complex_name:complexFromText(text),main_photo_url:imgs[0]||"",photo_urls:[...new Set(imgs)].slice(0,8),published_at:listingDateFrom(clean(seg)),raw_data:{live:true,programs:programTags(text),source_price:price,source_currency:"USD",source_price_text:`${pm[1]} ${pm[2]}`,converted:false}};
    if(passes(x,nativeFilters))out.push(x);
  }
  return out;
}

function parseOlxJsonLd(html:string,f:Filters){const out:Item[]=[],g=geo(f),pageText=clean(html);for(const block of html.matchAll(/<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)){try{const json=JSON.parse(block[1]),offers=Array.isArray(json?.offers?.offers)?json.offers.offers:[];for(const offer of offers){const title=clean(offer?.name||"");if(!title||String(offer?.priceCurrency||"").toUpperCase()!=="USD")continue;if(f.complex&&f.complex!=="Все"&&!complexMatches(title,f.complex))continue;const price=num(offer?.price),url=String(offer?.url||"");if(!price||!url)continue;const at=pageText.toLowerCase().indexOf(title.toLowerCase()),snippet=at>=0?pageText.slice(at,at+900):title,area=areaFromCard(snippet),rooms=num(title.match(/(\d+)\s*[- ]?(?:кімн|комн)/i)?.[1]),images=(Array.isArray(offer?.image)?offer.image:[offer?.image]).filter(Boolean).map((v:string)=>abs(v,"https://www.olx.ua"));const x:Item={external_id:url.match(/ID([\w]+)/)?.[1]||url,source_name:"OLX",source_url:listingUrlInUsd(url,"OLX"),title,description:snippet,country:g.country,region:g.region,city:g.city||clean(offer?.areaServed?.name||""),district:g.district||(g.city?clean(offer?.areaServed?.name||""):""),property_type:propertyLabel(f),deal_type:isRent(f)?"Аренда":"Продажа",rooms:rooms||roomsFromText(title)||roomsFromText(snippet.slice(0,400))||null,price,area,currency:"USD",complex_name:String(f.complex||complexFromText(snippet)||""),main_photo_url:images[0]||"",photo_urls:[...new Set(images)].slice(0,8),published_at:listingDateFrom(snippet),raw_data:{live:true,source_price:price,source_currency:"USD",price_kind:"total_object",converted:false}};if((!f.price_from||price>=Number(f.price_from))&&(!f.price_to||price<=Number(f.price_to))&&(!f.area_from||area>=Number(f.area_from))&&(!f.area_to||area<=Number(f.area_to)))out.push(x)}}catch{/* ignore unrelated or malformed JSON-LD */}}return out}

function parseDom(html:string,f:Filters){
  // One segment per realty card. Never search around a listing link: that can
  // leak the neighbouring card or DIM.RIA's "$ за м²" value into total price.
  const starts=[...html.matchAll(/<section[^>]*class=["'][^"']*\brealty-item\b[^"']*["'][^>]*>/gi)].map(m=>m.index||0);
  const out:Item[]=[],seen=new Set<string>();
  for(let i=0;i<starts.length;i++){
    const seg=html.slice(starts[i],i+1<starts.length?starts[i+1]:starts[i]+30000);
    const href=seg.match(/href=["']([^"']*\/realty-[^"']+\.html)["']/i)?.[1];
    if(!href)continue;
    const url=abs(href,"https://dom.ria.com");
    if(seen.has(url))continue;
    seen.add(url);
    // DIM.RIA's authoritative TOTAL object price is the size22 <b>. The nearby
    // <span> is explicitly a per-square-metre price and is never assigned to price.
    const totalMatch=seg.match(/<b[^>]*class=["'][^"']*\bsize22\b[^"']*["'][^>]*>\s*([\d\s\u00a0.,]+)\s*\$\s*<\/b>/i);
    // Аренда на DIM.RIA показывается в гривне: переводим в $ по курсу НБУ
    const uahMatch=totalMatch?null:seg.match(/<b[^>]*class=["'][^"']*\bsize22\b[^"']*["'][^>]*>\s*([\d\s\u00a0.,]+)\s*грн\s*<\/b>/i);
    const price=totalMatch?num(totalMatch[1]):uahToUsd(num(uahMatch?.[1]));
    if(!price)continue;
    const perM2Match=seg.match(/<span[^>]*>\s*([\d\s\u00a0.,]+)\s*\$\s*(?:за|\/)\s*м(?:²|2)/i);
    const pricePerM2=num(perM2Match?.[1]);
    const text=clean(seg),area=areaFromCard(text,seg),rooms=num(text.match(/(\d+)\s*(?:кімнат|комнат)/i)?.[1]);
    const title=clean(seg.match(/<(?:h2|h3)[^>]*>([\s\S]*?)<\/(?:h2|h3)>/i)?.[1]||seg.match(/href=["'][^"']*\/realty-[^"']+["'][^>]*title=["']([^"']+)["']/i)?.[1]||"DIM.RIA");
    const imgs=[...seg.matchAll(/(?:src|data-src|content)=["']([^"']+)["']/gi)].map(x=>abs(x[1],"https://dom.ria.com")).filter(x=>/jpg|jpeg|webp|png/i.test(x)&&!/logo|avatar|placeholder/i.test(x));
    const detectedDistrict=districtCanon(text.match(/(Київський|Киевский|Приморський|Приморский|Хаджибейський|Хаджибейский|Малиновський|Малиновский|Пересипський|Пересыпский|Суворівський|Суворовский)\s*(?:район)?/i)?.[1]||"");
    const district=detectedDistrict,g=geo(f);
    const listingCity=/\\bЛиманка\\b/i.test(text)?"Лиманка":/\\bОдес[аи]\\b/i.test(text)?"Одеса":g.city||"";const x:Item={external_id:url.match(/-(\d+)\.html/)?.[1]||url,source_name:"DIM.RIA Украина",source_url:listingUrlInUsd(url,"DIM.RIA Украина"),title,description:text.slice(0,1800),country:"Украина",region:g.region||"",city:listingCity,district,property_type:propertyLabel(f),deal_type:"Продажа",rooms:rooms||null,price,area,currency:"USD",complex_name:complexFromText(text),main_photo_url:imgs[0]||"",photo_urls:[...new Set(imgs)].slice(0,8),published_at:listingDateFrom(clean(seg)),raw_data:{live:true,programs:programTags(text),source_price:price,source_currency:"USD",price_kind:"total_object",price_per_m2:pricePerM2||null,floor:floorFromText(text).floor,total_floors:floorFromText(text).total,construction_year:Number(f._complex_year||yearFromText(text)||0),condition:conditionTag(text),verified:verifiedFromText(text),converted:false}};
    if(passes(x,f))out.push(x)
  }
  return out;
}

const lunCitySlug=(value="")=>{const c=String(value||"").toLowerCase();if(/одес|odes/.test(c))return"odesa";if(/ки[еї]в|kyiv|kiev/.test(c))return"kyiv";if(/льв[іо]в|lviv/.test(c))return"lviv";if(/дн[іе]пр|dnipr/.test(c))return"dnipro";return latin(c)||"odesa"};
const lunComplexSlug=(value="")=>normalizeComplexNumbers(String(value||"")).replace(/^\s*(?:жк\s+|жил(?:ой|ого)?\s+комплекс\s+|житлов(?:ий|ого)?\s+комплекс\s+)/i," ").split(/[^a-zа-яіїєґ0-9]+/i).map(part=>latin(part)).filter(Boolean).join("-");
// Город → адрес ЛУН (регион/flats или регион/flats-город); "" = на ЛУН нет такого города
const lunCityPath=(cityName="")=>{const k=String(cityName||"").trim().toLowerCase();const rec:any=(REM_LUN_CITIES as any)[k]||Object.values(REM_LUN_CITIES).find((x:any)=>String(x.uk).toLowerCase()===k)||(REM_LUN_CITIES as any)[String((UA_UK as any)[k]||"")];if(rec)return String(rec.lun||"");if(!k)return"odesa/flats";return""};
const lunUrl=(f:Filters)=>{const group=propertyGroup(f);const kind=group==="apartment"?"flats":group==="house"?"houses":group==="land"?"land":"";if(!kind)return"";const path=lunCityPath(f.city||"Одесса");if(!path)return"";const [city,cityPart]=path.split("/");const rent=isRent(f);if(rent&&kind==="land")return"";const townSuffix=cityPart.replace(/^flats/,"");const slug=kind==="flats"&&!rent&&f.complex&&f.complex!=="Все"?lunComplexSlug(f.complex):`${kind}${townSuffix}`;const lunDistricts:any={"Киевский":"kyivskyi","Приморский":"prymorskyi","Хаджибейский":"khadzhybeiskyi","Пересыпский":"peresypskyi"};const g=geo(f),dSlug=kind==="flats"&&slug==="flats"&&city==="odesa"&&!townSuffix?lunDistricts[g.district]:"";const u=new URL(`https://lun.ua/${rent?"rent":"sale"}/${city}/${slug}${dSlug?`-${dSlug}-district`:""}`);
  // родные фильтры ЛУН: комнаты и цена в $ (счётчик «N квартир» на странице учитывает их)
  const r=parseInt(String(f.rooms||""))||0;if(kind==="flats"&&r>=1&&r<=3&&/^[1-3]$/.test(String(f.rooms)))u.searchParams.set("roomCount",String(r));
  if(f.price_from||f.price_to){if(f.price_from)u.searchParams.set("priceMin",String(f.price_from));if(f.price_to)u.searchParams.set("priceMax",String(f.price_to));u.searchParams.set("currency","USD");}
  return u.toString()};

function parseLun(html:string,f:Filters){
  const exactUrls=new Map([...html.matchAll(/\\\"id\\\":(\d+),\\\"groupId\\\":\\\"[^\\\"]*\\\",\\\"urlRaw\\\":\\\"([^\\\"]+)/g)].map(m=>[String(m[1]),decodeHtml(m[2]).replace(/\\\\\//g,"/")]));
  // скрытые данные карточек ЛУН: комнаты, площадь, этаж, год, дата появления (в тексте карточки их нет)
  const lunMeta=new Map<string,any>();
  for(const m of html.matchAll(/\\"id\\":(\d+),\\"groupId\\"/g)){
    const s=html.slice(m.index||0,(m.index||0)+2500),v=(k:string)=>s.match(new RegExp('\\\\"'+k+'\\\\":\\\\?"?([\\d.T:-]+)'))?.[1]||"";
    if(!lunMeta.has(m[1]))lunMeta.set(m[1],{rooms:num(v("roomCount")),area:num(v("areaTotal")),floor:num(v("floor")),floors:num(v("floorCount")),year:num(v("builtYear")),inserted:v("insertTime"),price:num(v("price")),currency:(s.match(/\\"currency\\":\\"([a-z]+)/)?.[1]||"").toLowerCase()});
  }
  const starts=[...html.matchAll(/<div class=["']RealtiesLayout[^"']*__resultsItem["']/gi)].map(m=>m.index||0),out:Item[]=[],g=geo(f);
  for(let i=0;i<starts.length;i++){
    const seg=html.slice(starts[i],i+1<starts.length?starts[i+1]:starts[i]+50000),text=clean(seg);
    const pageId=seg.match(/data-event-options=["'][^"']*page_id:(\d+)/i)?.[1]||"";
    const externalUrl=(seg.match(/https:\\?\/\\?\/(?:rieltor\.ua|dom\.ria\.com|www\.olx\.ua|olx\.ua|rem\.ua)\\?\/[^"'<>\\\s]+/i)?.[0]||"").replace(/\\\//g,"/");
    const exactUrl=String(exactUrls.get(pageId)||"");
    const sourceRawUrl=exactUrl||externalUrl;
    if(!pageId||!sourceRawUrl)continue;
    const upstreamUrl=listingUrlInUsd(sourceRawUrl,/olx\.ua/i.test(sourceRawUrl)?"OLX":/dom\.ria\.com/i.test(sourceRawUrl)?"DIM.RIA Украина":"");
    const rawUrl=`https://lun.ua/realty/${pageId}`;
    const priceMatch=text.match(/\$\s*([\d\s\u00a0.,]+)\s*(тис\.?|млн)?/i);
    let price=num(priceMatch?.[1]||0);if(/тис/i.test(priceMatch?.[2]||""))price*=1000;else if(/млн/i.test(priceMatch?.[2]||""))price*=1000000;const metaP=lunMeta.get(pageId)||{};
    // цена из данных карточки ЛУН: в аренде она в гривнах — пересчёт по курсу НБУ
    if(Number(metaP.price)>0)price=metaP.currency==="uah"?uahToUsd(Number(metaP.price)):metaP.currency==="eur"?price||0:Number(metaP.price);
    const title=clean(seg.match(/<h3[^>]*RealtyCard[^>]*__title[^>]*>([\s\S]*?)<\/h3>/i)?.[1]||seg.match(/<h3[^>]*>([\s\S]*?)<\/h3>/i)?.[1]||"ЛУН");
    const floorPair=text.match(/поверх\s*(\d{1,3})\s*з\s*(\d{1,3})/i),meta=lunMeta.get(pageId)||{},rooms=num(text.match(/(\d+)\s*кімнат/i)?.[1])||meta.rooms||0,area=meta.area||areaFromCard(text,seg);
    const complex=clean(text.match(/ЖК\s+([^\n]{2,80}?)(?=(?:Молдаванка|Приморськ|Київськ|Хаджибейськ|Пересипськ|Одеса|Скопіювати))/i)?.[1]||"");
    const imgs=[...seg.matchAll(/(?:src|data-src|content)=["']([^"']*lunstatic\.net[^"']+)["']/gi)].map(m=>decodeHtml(m[1]).replace(/\\\//g,"/")).filter(v=>/^https:\/\//i.test(v)&&!/avatar|logo/i.test(v));
    const x:Item={external_id:pageId||rawUrl.match(/(\d{5,})(?:\/?(?:[?#]|$))/)?.[1]||rawUrl,source_name:"ЛУН",source_url:rawUrl,title,description:text.slice(0,3500),country:g.country,region:g.region,city:g.city||"Одесса",district:districtCanon(text.match(/(Київський|Киевский|Приморський|Приморский|Хаджибейський|Хаджибейский|Пересипський|Пересыпский)/i)?.[1]||g.district),property_type:propertyLabel(f),deal_type:isRent(f)?"Аренда":"Продажа",rooms:rooms||null,price,area,currency:"USD",complex_name:String(f.complex||complex),main_photo_url:imgs[0]||"",photo_urls:[...new Set(imgs)].slice(0,8),published_at:listingDateFrom(clean(seg))||(meta.inserted?String(meta.inserted).slice(0,10):null),raw_data:{live:true,upstream_source_url:upstreamUrl,source_price:price,source_currency:String(metaP.currency||"usd").toUpperCase(),price_kind:"total_object",floor:num(floorPair?.[1])||meta.floor||0,total_floors:num(floorPair?.[2])||meta.floors||0,construction_year:yearFromText(text)||meta.year||0,condition:conditionTag(text),converted:false}};
    if(price>0&&passes(x,{...f,complex:""}))out.push(x);
  }
  return out;
}

function parseRem(html:string,f:Filters){
  const marks=[...html.matchAll(/<div class=["']object-item\s+object-map-marker["']/gi)].map(m=>m.index||0),out:Item[]=[],g=geo(f);
  for(let i=0;i<marks.length;i++){
    const seg=html.slice(marks[i],i+1<marks.length?marks[i+1]:marks[i]+35000);
    const link=seg.match(/href\s*=\s*["']?(https?:\/\/rem\.ua\/(?:ua\/)?(?:prodazha|arenda)-[^\s"'<>]*?-db(\d+))/i);
    if(!link)continue;
    const url=abs(link[1],"https://rem.ua"),id=link[2],text=clean(seg);
    const title=clean(seg.match(/class=["']object-address["'][^>]*>([\s\S]*?)<\//i)?.[1]||"REM");
    const description=clean(seg.match(/class=["']object-card-description["'][^>]*>([\s\S]*?)<\//i)?.[1]||"");
    const pm=seg.match(/class=["']object-price["'][^>]*>\s*([\d\s\u00a0.,]+)\s*(\$|UAH|грн|€|EUR)/i);const priceRaw=num(pm?.[1]);const priceCur=/UAH|грн/i.test(pm?.[2]||"")?"UAH":/€|EUR/i.test(pm?.[2]||"")?"EUR":"USD";
    // аренда на REM часто в гривнах — пересчёт в $ по курсу НБУ
    const price=priceCur==="UAH"?uahToUsd(priceRaw):priceCur==="EUR"?0:priceRaw;
    const location=clean(seg.match(/class=["']object-city-region["'][^>]*>([\s\S]*?)<\//i)?.[1]||"");
    const area=num(location.match(/(\d+(?:[.,]\d+)?)\s*кв\.\s*м/i)?.[1]||text.match(/(?:Кімнат|Комнат)\s*\d+\s+(\d+(?:[.,]\d+)?)/i)?.[1]);
    const rooms=num(location.match(/(\d+)\s*[- ]?(?:комн|кімн)/i)?.[1]||text.match(/(?:Кімнат|Комнат)\s*(\d+)/i)?.[1]);
    const floorPair=text.match(/(?:поверх|этаж)\s*(\d{1,3})\s*(?:з|из)\s*(\d{1,3})/i);
    const district=districtCanon(location.match(/(Київський|Киевский|Приморський|Приморский|Хаджибейський|Хаджибейский|Малиновський|Малиновский|Пересипський|Пересыпский|Суворівський|Суворовский)/i)?.[1]||g.district);
    const imgs=[...seg.matchAll(/(?:src|data-src)=["']([^"']+)["']/gi)].map(m=>abs(m[1],"https://rem.ua")).filter(x=>/storage\.rem\.ua.+\.(?:jpe?g|webp|png)(?:\?|$)/i.test(x));
    const fullText=`${title} ${location} ${description}`;
    const x:Item={external_id:id,source_name:"REM",source_url:url,title,description:fullText,country:g.country,region:g.region,city:g.city||(/Одес/i.test(location)?"Одесса":""),district,property_type:propertyLabel(f),deal_type:isRent(f)?"Аренда":"Продажа",rooms:rooms||null,price,area,currency:"USD",complex_name:complexFromText(fullText),main_photo_url:imgs[0]||"",photo_urls:[...new Set(imgs)].slice(0,8),published_at:listingDateFrom(clean(seg)),raw_data:{live:true,programs:programTags(text),source_price:price,source_currency:"USD",price_kind:"total_object",floor:num(floorPair?.[1]),total_floors:num(floorPair?.[2]),construction_year:Number(f._complex_year||yearFromText(text)||0),condition:conditionTag(text),verified:verifiedFromText(text),converted:false}};
    if(price>0&&passes(x,f))out.push(x);
  }
  return out;
}

function parseGeneric(html:string,source:string,base:string,f:Filters){
  const re=source==="RIELTOR.UA"
    ? /href=["']([^"']*(?:flats|houses|areas|commercials|rooms)-(?:sale|rent)\/view\/(\d+)\/?[^"']*)["']/gi
    : /href=(?:["']?)(https?:\/\/rem\.ua\/(?:ua\/)?prodazha-[^\s"'<>]*?-db(\d+)[^\s"'<>]*)(?:["']|\s|>)/gi;
  const matches=[...html.matchAll(re)],out:Item[]=[],g=geo(f);
  const groups=[] as {m:RegExpMatchArray,at:number,next:number}[];
  for(let i=0;i<matches.length;){const m=matches[i],id=m[2],at=m.index||0;let j=i+1;while(j<matches.length&&matches[j][2]===id)j++;groups.push({m,at,next:j<matches.length?(matches[j].index||at+16000):at+16000});i=j}
  for(const {m,at,next} of groups){
    let url=abs(m[1],base),id=m[2]||url;
    // Start at the listing link itself and stop before the next listing. This prevents
    // a neighbouring card's price, room count or district from leaking into this one.
    let seg=html.slice(at,Math.min(next,at+18000));
    if(source==="REM"){const cardStart=html.lastIndexOf('<div class="object-item',at);if(cardStart>=0){const cardEnd=html.indexOf('<div class="object-item',cardStart+24);seg=html.slice(cardStart,cardEnd>cardStart?cardEnd:cardStart+30000)}}
    if(source==="RIELTOR.UA"){
      // RIELTOR puts its authoritative USD price in the catalog-card wrapper
      // and in catalog-card-price-title. The listing URL can occur before that
      // block, so parse the entire card instead of free text after the link.
      const cardStart=html.lastIndexOf('<div class="catalog-card ',at);
      if(cardStart>=0){const cardEnd=html.indexOf('<div class="catalog-card ',cardStart+25);seg=html.slice(cardStart,cardEnd>cardStart?cardEnd:cardStart+30000)}
      const canonical=seg.match(/href=["']([^"']*(?:flats|houses|areas|commercials|rooms)-(?:sale|rent)\/view\/(\d+)\/?[^"']*)["']/i);
      if(canonical){url=abs(canonical[1],base);id=canonical[2]||id}
    }
    const text=clean(seg);
    const title=clean((source==="RIELTOR.UA"?seg.match(/class=["']catalog-card-address["'][^>]*>([\s\S]*?)<\//i)?.[1]:source==="REM"?seg.match(/class=["']object-address["'][^>]*>([\s\S]*?)<\//i)?.[1]:"")||seg.match(/<a[^>]*href=["'][^"']*(?:(?:flats|houses|areas|commercials|rooms)-(?:sale|rent)\/view\/\d+|prodazha-[^"']*?-db\d+)[^"']*["'][^>]*>([\s\S]*?)<\/a>/i)?.[1]||seg.match(/<(?:h2|h3)[^>]*>([\s\S]*?)<\/(?:h2|h3)>/i)?.[1]||source);
    // Do not absorb the gallery photo counter that RIELTOR places immediately
    // before the price (for example: "10 69 500 $").
    const sourcePriceMatch=source==="RIELTOR.UA"
      ? (seg.match(/class=["']catalog-card-price-title["'][^>]*>\s*([\d\s\u00a0.,]+)\s*\$\s*<\/strong>/i)||seg.match(/data-label=["']\s*([\d\s\u00a0.,]+)\s*\$\s*["']/i)||((m:any)=>m?[m[0],String(uahToUsd(num(m[1])))]:null)(seg.match(/data-label=["']\s*([\d\s\u00a0.,]+)\s*грн\s*["']/i)))
      : source==="REM"?seg.match(/class=["']object-price["'][^>]*>\s*([\d\s\u00a0.,]+)\s*\$/i):text.match(/(?:^|\D)(\d{2,3}(?:[\s\u00a0]\d{3})+|\d{4,6})(?:[.,]\d+)?\s*\$/);
    const price=num(sourcePriceMatch?.[1]);
    const pricePerM2=source==="RIELTOR.UA"?num(seg.match(/class=["']catalog-card-price-details["'][^>]*>\s*([\d\s\u00a0.,]+)\s*\$\s*\/\s*м(?:²|2)/i)?.[1]):0;
    const area=areaFromCard(text,seg);
    const rooms=num(text.match(/(\d+)\s*[- ]?(?:кімн|комн)/i)?.[1]);
    const district=districtCanon(text.match(/(Київський|Киевский|Приморський|Приморский|Хаджибейський|Хаджибейский|Малиновський|Малиновский|Пересипський|Пересыпский|Суворівський|Суворовский)/i)?.[1]||g.district);
    const imgs=[...seg.matchAll(/(?:src|data-src|content)=["']([^"']+)["']/gi)].map(z=>abs(z[1],base)).filter(z=>/\.(?:jpe?g|webp|png)(?:\?|$)/i.test(z)&&!/logo|avatar|placeholder/i.test(z));
    const x:Item={external_id:String(id),source_name:source,source_url:url,title,description:text.slice(0,2400),country:g.country,region:g.region,city:g.city,district,property_type:propertyLabel(f),deal_type:"Продажа",rooms:rooms||null,price,area,currency:"USD",complex_name:complexFromText(text),main_photo_url:imgs[0]||"",photo_urls:[...new Set(imgs)].slice(0,8),published_at:listingDateFrom(clean(seg)),raw_data:{live:true,programs:programTags(text),source_price:price,source_currency:"USD",price_kind:"total_object",price_per_m2:pricePerM2||null,converted:false}};
    if(x.price&&passes(x,f))out.push(x)
  }
  return out;
}

function parseExactRieltorPage(html:string,f:Filters){
  // ниже «Вас також можуть зацікавити оголошення поруч» — чужие объявления, не из этого ЖК
  const cut=html.search(/data-listing-add-title|можуть зацікавити оголошення поруч|могут заинтересовать объявления рядом/i);if(cut>0)html=html.slice(0,cut);
  const starts=[...html.matchAll(/<div class=["']catalog-card\s/gi)].map(m=>m.index||0);
  const out:Item[]=[];
  for(let i=0;i<starts.length;i++){
    const seg=html.slice(starts[i],i+1<starts.length?starts[i+1]:starts[i]+35000);
    const parsed=parseGeneric(seg,"RIELTOR.UA","https://rieltor.ua",{...f,complex:""});
    if(parsed.length){out.push(...parsed);continue}
    // Fallback for a valid card whose repeated auxiliary links confuse the
    // generic grouping parser. Exact ЖК catalog membership is authoritative.
    const href=seg.match(/href=["']([^"']*(?:flats|houses|areas|commercials|rooms)-(?:sale|rent)\/view\/(\d+)\/?[^"']*)["']/i);
    const price=num(seg.match(/class=["']catalog-card-price-title["'][^>]*>\s*([\d\s\u00a0.,]+)\s*\$/i)?.[1]||seg.match(/data-label=["']\s*([\d\s\u00a0.,]+)\s*\$\s*["']/i)?.[1]||0);
    if(!href||!price)continue;
    const text=clean(seg),g=geo(f),url=abs(href[1],"https://rieltor.ua");
    const title=clean(seg.match(/class=["']catalog-card-address["'][^>]*>([\s\S]*?)<\//i)?.[1]||"RIELTOR.UA");
    const imgs=[...seg.matchAll(/(?:src|data-src)=["']([^"']+)["']/gi)].map(m=>abs(m[1],"https://rieltor.ua")).filter(v=>/\.(?:jpe?g|webp|png)(?:\?|$)/i.test(v)&&!/logo|avatar|placeholder/i.test(v));
    const item:Item={external_id:href[2],source_name:"RIELTOR.UA",source_url:url,title,description:text.slice(0,2400),country:g.country,region:g.region,city:g.city,district:districtCanon(text.match(/(Київський|Киевский|Приморський|Приморский|Хаджибейський|Хаджибейский|Малиновський|Малиновский|Пересипський|Пересыпский|Суворівський|Суворовский)/i)?.[1]||g.district),property_type:propertyLabel(f),deal_type:"Продажа",rooms:num(text.match(/(\d+)\s*[- ]?(?:кімн|комн)/i)?.[1])||null,price,area:areaFromCard(text,seg),currency:"USD",complex_name:String(f.complex||""),main_photo_url:imgs[0]||"",photo_urls:[...new Set(imgs)].slice(0,8),published_at:listingDateFrom(clean(seg)),raw_data:{live:true,source_price:price,source_currency:"USD",price_kind:"total_object",converted:false}};
    if(passes(item,{...f,complex:""}))out.push(item);
  }
  return out;
}

// ===== DIM.RIA через собственный поиск площадки (тот же, что на сайте dom.ria.com) =====
// Фильтры передаются площадке как есть, поэтому количество совпадает с сайтом один в один.
const dimQueryCache=new Map<string,{q:string,at:number}>();
async function dimBaseQuery(pageUrl:string):Promise<string>{
  const c=dimQueryCache.get(pageUrl);if(c&&Date.now()-c.at<1800000)return c.q;
  const r=await politeFetch(pageUrl);if(!r.ok)return "";
  const html=await r.text();
  const q=(html.match(/queryStrNewDesign\\?"\s*:\s*\\?"([^"\\]+)/)?.[1]||"").replace(/\\u0026/g,"&");
  if(q)dimQueryCache.set(pageUrl,{q,at:Date.now()});
  return q;
}
const dimPhoto=(file:string)=>file?`https://cdn.riastatic.com/photos/${String(file).replace(/\.(jpe?g|png|webp)$/i,"")}xl.webp`:"";
function dimPeriodParams(f:any,u:URLSearchParams){
  const p=String(f.period||"");
  if(p==="per_day"||p==="per_allday")u.set("period",p);
  if(f.date_from&&/^\d{4}-\d{2}-\d{2}$/.test(String(f.date_from)))u.set("date_from",String(f.date_from));
  if(f.date_to&&/^\d{4}-\d{2}-\d{2}$/.test(String(f.date_to)))u.set("date_to",String(f.date_to));
}
async function dimApiSearch(f:Filters,pageUrl:string){
  const base=await dimBaseQuery(pageUrl);
  if(!base)return null;
  const PER=50,requestedPage=Math.max(1,Number(f.page||1));
  const u=new URLSearchParams(base.replace(/^&/,""));
  u.set("addMoreRealty","false");u.set("excludeSold","1");u.set("wo_dupl","1");
  u.set("page",String(requestedPage-1));u.set("limit",String(PER));
  const rooms=String(f.rooms||"");if(/^\d/.test(rooms)){const n=parseInt(rooms);u.set("characteristic[209][from]",String(n));if(!/\+/.test(rooms))u.set("characteristic[209][to]",String(n));}
  if(f.price_from||f.price_to){if(f.price_from)u.set("characteristic[234][from]",String(f.price_from));if(f.price_to)u.set("characteristic[234][to]",String(f.price_to));u.set("characteristic[242]","239");}
  if(f.area_from)u.set("characteristic[214][from]",String(f.area_from));if(f.area_to)u.set("characteristic[214][to]",String(f.area_to));
  if(f.floor_from)u.set("characteristic[227][from]",String(f.floor_from));if(f.floor_to)u.set("characteristic[227][to]",String(f.floor_to));
  dimPeriodParams(f,u);
  const searchUrl=`https://dom.ria.com/node/searchEngine/v2/?${u.toString()}`;
  const sr=await politeFetch(searchUrl);if(!sr.ok)return null;
  let data:any;try{data=await sr.json()}catch{return null}
  const ids:number[]=(data?.items||[]).map((x:any)=>Number(x)).filter(Boolean);
  const count=Number(data?.count||0);
  const details:any[]=[];
  for(let i=0;i<ids.length;i+=6){
    const chunk=ids.slice(i,i+6);
    const got=await Promise.all(chunk.map(async id=>{try{const r=await politeFetch(`https://dom.ria.com/realty/data/${id}?lang_id=4`,2);return r.ok?await r.json():null}catch{return null}}));
    details.push(...got.filter(Boolean));
  }
  const g=geo(f),rent=isRent(f);
  const items:Item[]=details.map((d:any)=>{
    const url=`https://dom.ria.com/uk/${d.beautiful_url||`realty-${d.realty_id}.html`}`;
    const usd=num(d?.priceArr?.["1"]||0)||(Number(d.currency_type_id)===1?num(d.price):0);
    const photos=Object.values(d.photos||{}).sort((a:any,b:any)=>(b.is_main?1:0)-(a.is_main?1:0)||Number(a.ordering||0)-Number(b.ordering||0)).map((p:any)=>dimPhoto(p.file)).filter(Boolean);
    const tags=(d.tag_uk||[]).map((t:any)=>String(t.tag_synonym||"")).join(" ");
    const condition=/без ремонт/i.test(tags)?"Без ремонта":/ремонт|євроремонт|дизайнер/i.test(tags)?"С ремонтом":"";
    const desc=String(d.description_uk||d.description||"");
    const addr=[d.street_name_uk||d.street_name,d.building_number_str].filter(Boolean).join(", ");
    const title=[addr,d.district_name_uk||d.district_name,d.city_name_uk||d.city_name].filter(Boolean).join(" · ")||`DIM.RIA ${d.realty_id}`;
    return {external_id:String(d.realty_id),source_name:"DIM.RIA Украина",source_url:listingUrlInUsd(url,"DIM.RIA Украина"),title,description:desc.slice(0,1800),
      country:"Украина",region:g.region||String(d.state_name_uk||""),city:String(d.city_name_uk||d.city_name||g.city||""),district:districtCanon(String(d.district_name_uk||d.district_name||"")),
      property_type:propertyLabel(f),deal_type:rent?"Аренда":"Продажа",rooms:Number(d.rooms_count||0)||null,price:usd,area:Number(d.total_square_meters||0),currency:"USD",
      complex_name:String(d.user_newbuild_name_uk||d.user_newbuild_name||""),main_photo_url:photos[0]||dimPhoto(d.main_photo),photo_urls:photos.slice(0,12),
      published_at:d.publishing_date?new Date(String(d.publishing_date).replace(" ","T")+"+02:00").toISOString():null,
      raw_data:{live:true,api:"dimria",source_price:usd,source_currency:"USD",price_kind:"total_object",converted:false,floor:Number(d.floor||0),total_floors:Number(d.floors_count||0),
        condition,verified:!!(d.agencyVerified||d.realtorVerified),construction_year:0,publishing_date_info:d.publishing_date_info||"",kitchen_area:Number(d.kitchen_square_meters||0),living_area:Number(d.living_square_meters||0)}} as Item;
  }).filter((x:Item)=>x.price>0);
  return {count,items,searchUrl,PER};
}


// REM: фильтры сайта rem.ua (комнаты — в адресе, цена/площадь/этаж/ЖК — параметрами формы поиска)
// Город → адрес REM (rem.ua/ua/prodazha-kvartir-<город>); "" = на REM нет такого города
const remCitySlug=(cityName="")=>{const k=String(cityName||"").trim().toLowerCase();if(!k)return"odessa";const rec:any=(REM_LUN_CITIES as any)[k]||Object.values(REM_LUN_CITIES).find((x:any)=>String(x.uk).toLowerCase()===k)||(REM_LUN_CITIES as any)[String((UA_UK as any)[k]||"")];return rec?String(rec.rem||""):""};
function remUrl(f:Filters){
  const group=propertyGroup(f);const rent=isRent(f);const city=remCitySlug(geo(f).city);if(!city)return "";
  const deal=rent?"arenda":"prodazha";
  if(group==="house")return remParams(`https://rem.ua/ua/${deal}-domov-${city}`,f,false);
  if(group==="land")return rent?"":remParams(`https://rem.ua/ua/prodazha-zemli-${city}`,f,false);
  if(group!=="apartment")return "";
  const r=parseInt(String(f.rooms||""))||0;const slug=({1:"odnokomnatnye",2:"dvuhkomnatnye",3:"trehkomnatnye",4:"chetyrehkomnatnye"} as any)[Math.min(r,4)]||"";
  return remParams(`https://rem.ua/ua/${deal}-kvartir-${slug?slug+"-":""}${city}`,f,true);
}
function remParams(base:string,f:Filters,apartment:boolean){
  const u=new URL(base);
  if(f.price_from||f.price_to){if(f.price_from)u.searchParams.set("priceMin",String(f.price_from));if(f.price_to)u.searchParams.set("priceMax",String(f.price_to));u.searchParams.set("currency","usd");}
  if(f.area_from)u.searchParams.set("areaTotalMin",String(f.area_from));if(f.area_to)u.searchParams.set("areaTotalMax",String(f.area_to));
  if(apartment&&f.floor_from)u.searchParams.set("floorMin",String(f.floor_from));if(apartment&&f.floor_to)u.searchParams.set("floorMax",String(f.floor_to));
  const cx=String(f.complex||"").replace(/(?:^|\s)(?:ЖК|жк)(?=\s|$)/g," ").trim();if(apartment&&cx&&cx!=="Все")u.searchParams.set("textQuery",`ЖК ${cx}`);
  // район: REM ищет его через строку поиска (без ЖК — иначе поиск идёт по ЖК)
  else if(/-odessa$/.test(u.pathname)){const d=({"Киевский":"Київський","Приморский":"Приморський","Хаджибейский":"Хаджибейський","Пересыпский":"Пересипський"} as any)[geo(f).district];if(d)u.searchParams.set("textQuery",d);}
  return u.toString();
}
// RIELTOR.UA: фильтры сайта — комнаты в адресе (/2-rooms/), цена — price_min/price_max (в $)
function rieltorNative(url:string,f:Filters){
  if(!url)return url;
  try{
    const u=new URL(url);
    const r=parseInt(String(f.rooms||""))||0;
    // комнаты — сегмент адреса (1-room, 2-rooms…); вместе с районом/ЖК в адресе площадка его не принимает
    // допускаем: /город/раздел/, /раздел/ (Киев) и /город/раздел/Район-dNN/ — площадка принимает /Район-dNN/1-room/
    const simplePath=/^\/(?:[a-z-]+\/)?[a-z]+-(?:sale|rent)\/(?:[^/]+-d\d+\/?)?$/.test(u.pathname);
    if(r>0&&propertyGroup(f)==="apartment"&&simplePath)u.pathname=u.pathname.replace(/\/?$/,"/")+(r===1?"1-room/":`${Math.min(r,4)}-rooms/`);
    // цена: currency=2 — доллары (1 — гривна по умолчанию)
    if(f.price_from||f.price_to){if(f.price_from)u.searchParams.set("price_min",String(f.price_from));if(f.price_to)u.searchParams.set("price_max",String(f.price_to));u.searchParams.set("currency","2");}
    return u.toString();
  }catch{return url}
}
async function one(source:string,f:Filters){
  // Город, которого нет на площадке: не подменяем его общей выдачей по Украине
  {const wantCity=String(geo(f).city||"").trim();const portal:any={"OLX":"olx","DIM.RIA Украина":"dim","RIELTOR.UA":"rieltor"}[source];
   if(wantCity&&portal){const s=portalSlug(portal,wantCity)??(portal==="rieltor"?rieltorCitySlug(wantCity):citySlug(wantCity));if(!s)return{source,ok:true,total:0,count_is_exact:true,page:Number(f.page||1),page_item_count:0,total_pages:1,has_more:false,unsupported_city:true,error:`На ${source} нет отдельной выдачи по городу «${wantCity}»`,items:[]}}
   if(source==="REM"&&wantCity&&!remCitySlug(wantCity))return{source,ok:true,total:0,count_is_exact:true,page:Number(f.page||1),page_item_count:0,total_pages:1,has_more:false,unsupported_city:true,error:`На REM нет отдельной выдачи по городу «${wantCity}»`,items:[]};
   if((source==="ЛУН"||source==="LUN")&&wantCity&&!lunCityPath(wantCity))return{source:"ЛУН",ok:true,total:0,count_is_exact:true,page:Number(f.page||1),page_item_count:0,total_pages:1,has_more:false,unsupported_city:true,error:`На ЛУН нет отдельной выдачи по городу «${wantCity}»`,items:[]};}
  if(propertyGroup(f)!=="apartment")f={...f,complex:"",complex_source_url:""};
  const requestedPage=Math.max(1,Number(f.page||1));
  let base="";
  if(source==="DIM.RIA Украина"){
    const pageUrl=await resolvedDomUrl(f);
    const api=await dimApiSearch(f,pageUrl).catch(()=>null);
    if(api){
      const finalF={...f,rooms:undefined,price_from:undefined,price_to:undefined,area_from:undefined,area_to:undefined,floor_from:undefined,floor_to:undefined,district:"",complex:""} as any;
      const items=api.items.filter(item=>passes(item,finalF)).map(item=>({...item,floor:Number(item.raw_data?.floor||0)||null,total_floors:Number(item.raw_data?.total_floors||0)||null,date_known:!!item.published_at,last_seen_at:new Date().toISOString()}));
      const extra=!!f.condition||!!f.land_area_from||!!f.land_area_to||!!f.construction_year_from||!!f.construction_year_to||!!f.verified_only||!!(f.programs||[]).length;
      const totalPages=Math.max(1,Math.ceil(api.count/api.PER));
      return{source,ok:true,status:200,url:pageUrl,search_url:api.searchUrl,page:requestedPage,pages_loaded:1,total:extra?items.length:api.count,count_is_exact:!extra,page_item_count:items.length,total_pages:totalPages,has_more:requestedPage<totalPages,items};
    }
  }
  if(source==="OLX")base=olxUrl(f);else if(source==="DIM.RIA Украина")base=await resolvedDomUrl(f);else if(source==="RIELTOR.UA")base=rieltorNative(await resolvedRieltorComplexUrl(f),f);else if(source==="REM"){base=remUrl(f);}else if(source==="ЛУН"||source==="LUN"){source="ЛУН";base=lunUrl(f);}else return{source,ok:false,error:"unsupported source",items:[]};if(!base)return{source,ok:true,total:0,count_is_exact:true,page:requestedPage,page_item_count:0,total_pages:1,has_more:false,items:[]};
  // DIM.RIA: one CRM page is a block of five native DIM.RIA pages (up to about
  // 100 listings). The frontend sends pages:1, but DIM.RIA must still return a
  // full page comparable to the other sources.
  const exactComplexCatalog=source==="DIM.RIA Украина"&&/-zhk-[^/?#]+-\d+\/?(?:[?#]|$)/i.test(base);
  const exactRieltorCatalog=source==="RIELTOR.UA"&&/-n\d+\/?(?:[?#]|$)/i.test(base);
  let pageCount=source==="DIM.RIA Украина"?(exactComplexCatalog?8:5):exactRieltorCatalog?3:f.complex&&!["OLX","REM","ЛУН"].includes(source)?8:Math.max(1,Math.min(8,Number((f as any).pages||5)));
  const fetchPage=async(page:number)=>{const url=pageUrl(base,page);try{const r=await politeFetch(url);if(!r.ok)return{page,url,status:r.status,html:""};return{page,url,status:r.status,html:await r.text()}}catch{return{page,url,status:0,html:""}}};
  let firstProbe:any=null;
  if(requestedPage===1&&(exactComplexCatalog||exactRieltorCatalog)){
    firstProbe=await fetchPage(1);
    if(firstProbe.status>=200&&firstProbe.status<300&&firstProbe.html){
      const nativeTotal=Number(countFrom(firstProbe.html,source)||0);
      const perNativePage=source==="DIM.RIA Украина"?20:20;
      const totalNeeded=nativeTotal>0?Math.ceil(nativeTotal/perNativePage):0;
      const linkedPages=[...firstProbe.html.matchAll(/[?&](?:page|p)=(\\d+)/gi)].map(m=>Number(m[1])).filter(n=>n>0&&n<200);
      const linkedNeeded=linkedPages.length?Math.max(...linkedPages):0;
      pageCount=Math.max(pageCount,Math.min(60,Math.max(totalNeeded,linkedNeeded)));
    }
  }
  const firstPage=(requestedPage-1)*pageCount+1;
  let pages:any[]=[];
  if(exactComplexCatalog){
    // DIM.RIA throttles a burst of 6-8 simultaneous catalog requests and used
    // to drop the last page. Small batches reliably include the final partial page.
    for(let offset=0;offset<pageCount;offset+=3){
      const size=Math.min(3,pageCount-offset);
      pages.push(...await Promise.all(Array.from({length:size},(_,i)=>{const page=firstPage+offset+i;return page===1&&firstProbe?firstProbe:fetchPage(page)})));
    }
  }else{const conc=source==="OLX"?3:exactRieltorCatalog?1:2;for(let offset=0;offset<pageCount;offset+=conc){const size=Math.min(conc,pageCount-offset);pages.push(...await Promise.all(Array.from({length:size},(_,i)=>{const page=firstPage+offset+i;return page===1&&firstProbe?firstProbe:fetchPage(page)})));if(offset+conc<pageCount&&source!=="OLX")await sleep(exactRieltorCatalog?500:250)}}
  // страницы, которые площадка не отдала с первого раза (429/403), запрашиваем ещё раз по одной
  for(let i=0;i<pages.length;i++){const x=pages[i];if(x&&x.status>=200&&x.status<300&&x.html)continue;if(!x?.page||![0,403,429,500,502,503].includes(Number(x.status)))continue;for(let t=0;t<3;t++){await sleep(1500*(t+1));pages[i]=await fetchPage(x.page);if(pages[i].status>=200&&pages[i].status<300&&pages[i].html)break}}
  const successful=pages.filter(x=>x.status>=200&&x.status<300&&x.html);
  if(!successful.length){const st=pages[0]?.status||0;return{source,ok:false,status:st,url:pages[0]?.url||base,error:st===403||st===429?`${source} сейчас закрыл доступ для автоматического поиска (защита сайта). Откройте этот же поиск на сайте по ссылке — CRM повторит запрос при следующем обновлении.`:`${source} не ответил (код ${st||"нет связи"}). Откройте поиск на сайте по ссылке.`,items:[]}}
  const scanFilters={...f,condition:"",floor_from:undefined,floor_to:undefined,construction_year_from:undefined,construction_year_to:undefined,verified_only:false,programs:[]};
  const parseFilters=(exactComplexCatalog||exactRieltorCatalog)?{...scanFilters,complex:""}:scanFilters;
  let parsed=successful.flatMap(p=>source==="OLX"?parseOlx(p.html,{...scanFilters,complex:""}):source==="DIM.RIA Украина"?parseDom(p.html,parseFilters):source==="REM"?parseRem(p.html,{...scanFilters,complex:"",price_from:undefined,price_to:undefined,area_from:undefined,area_to:undefined,rooms:/^[1-4]$/.test(String(f.rooms||""))?"":f.rooms}):source==="ЛУН"?parseLun(p.html,{...parseFilters,complex:"",price_from:undefined,price_to:undefined,rooms:/^[1-3]$/.test(String(f.rooms||""))?"":f.rooms}):exactRieltorCatalog?parseExactRieltorPage(p.html,parseFilters):parseGeneric(p.html,source,"https://rieltor.ua",parseFilters));
  if(source==="OLX"&&!parsed.length)parsed=successful.flatMap(p=>parseOlxJsonLd(p.html,scanFilters));
  if(source==="OLX"&&!parsed.length&&f.complex){try{const globalUrl=olxUrl({...f,city:""}),response=await fetch(globalUrl,{headers:HEADERS,redirect:"follow"});if(response.ok){const html=await response.text(),selected=latin(geo(f).city),allowed=selected==="odessa"?["odessa","odesa"]:selected==="myzykevychaovydyopol"||selected==="limanka"||selected==="tairove"?["limanka","tairove","tairovo","odessa","odesa"]:[selected];parsed=parseOlxJsonLd(html,scanFilters).filter(item=>{const actual=latin(item.city||"");return !selected||allowed.some(city=>actual===city||actual.includes(city)||city.includes(actual))})}}catch{/* scoped OLX result remains authoritative */}}
  const selectedSubtype=selectedPropertyType(f);
  if(/^(Таунхаус|Дуплекс|Коттедж)$/i.test(selectedSubtype)){
    const subtypePattern=/^Таунхаус$/i.test(selectedSubtype)?/таунхаус|townhouse/i:/^Дуплекс$/i.test(selectedSubtype)?/дуплекс|duplex/i:/коттедж|котедж|cottage/i;
    parsed=parsed.filter(item=>subtypePattern.test(`${item.title||""} ${item.description||""}`));
  }else if(/^Дом$/i.test(selectedSubtype)){
    parsed=parsed.filter(item=>!/таунхаус|townhouse|дуплекс|duplex|коттедж|котедж|cottage/i.test(`${item.title||""} ${item.description||""}`));
  }
  parsed=parsed.map(item=>({...item,raw_data:{...(item.raw_data||{}),construction_year:Number(item.raw_data?.construction_year||f._complex_year||0),floor:Number(item.raw_data?.floor||floorFromText(`${item.title||""} ${item.description||""}`).floor||0),total_floors:Number(item.raw_data?.total_floors||floorFromText(`${item.title||""} ${item.description||""}`).total||0)}}));
  if(source!=="OLX"&&source!=="REM"&&(f.floor_from||f.floor_to)){
    // Keep the existing DIM.RIA limit unchanged. For REM, RIELTOR and LUN,
    // enrich every card missing a floor so an individual-source filter cannot drop valid items.
    const floorDetailLimit=["REM","RIELTOR.UA","ЛУН"].includes(source)?parsed.length:12;
    const missing=parsed.map((item,index)=>({item,index})).filter(({item})=>Number(item.raw_data?.floor||0)<=0).slice(0,floorDetailLimit);
    for(let offset=0;offset<missing.length;offset+=4){
      const batch=missing.slice(offset,offset+4);
      const enriched=await Promise.all(batch.map(async({item,index})=>{try{const response=await presentationDetail(item.source_url);if(!response.ok)return{index,item};const data:any=await response.json();return{index,item:{...item,raw_data:{...(item.raw_data||{}),floor:Number(data?.details?.floor||0),total_floors:Number(data?.details?.total_floors||0)}}}}catch{return{index,item}}}));
      for(const result of enriched)parsed[result.index]=result.item;
    }
  }
  const olxRoomsNative=source==="OLX"&&propertyGroup(f)==="apartment"&&/^[1-4]\+?$/.test(String(f.rooms||""));
  // комнаты на OLX отфильтрованы самой площадкой — берём значение фильтра, а не догадку по тексту
  parsed=parsed.map(item=>olxRoomsNative&&!/\+/.test(String(f.rooms))?{...item,rooms:parseInt(String(f.rooms))}:Number(item.rooms||0)>0?item:{...item,rooms:roomsFromText(item.title||"")||roomsFromText(String(item.description||"").slice(0,400))||(olxRoomsNative?parseInt(String(f.rooms)):null)});
  const finalFilters=source==="OLX"?{...f,complex:"",price_from:undefined,price_to:undefined,area_from:undefined,area_to:undefined,rooms:olxRoomsNative?"":f.rooms,city:String((f as any)._requested_city||f.city||""),district:String((f as any)._requested_district||f.district||""),floor_from:undefined,floor_to:undefined}:source==="REM"?{...f,complex:"",price_from:undefined,price_to:undefined,area_from:undefined,area_to:undefined,floor_from:undefined,floor_to:undefined,rooms:/^[1-4]$/.test(String(f.rooms||""))?"":f.rooms}:source==="ЛУН"?{...f,complex:"",price_from:undefined,price_to:undefined,rooms:/^[1-3]$/.test(String(f.rooms||""))?"":f.rooms}:(exactRieltorCatalog?{...f,complex:""}:f);
  parsed=parsed.filter(item=>passes(item,finalFilters));
  // Період подачі — как на DIM.RIA: за сьогодні / за добу / дата від–до (без даты объявление не проходит)
  const pf:any=f;const periodActive=pf.period==="per_day"||pf.period==="per_allday"||!!pf.date_from||!!pf.date_to;
  if(periodActive){
    const now=Date.now(),kyiv=new Date(now+2*3600000);const todayStart=Date.UTC(kyiv.getUTCFullYear(),kyiv.getUTCMonth(),kyiv.getUTCDate())-2*3600000;
    const from=pf.period==="per_day"?todayStart:pf.period==="per_allday"?now-86400000:pf.date_from?new Date(pf.date_from+"T00:00:00+02:00").getTime():0;
    const to=pf.date_to?new Date(pf.date_to+"T23:59:59+02:00").getTime():now+86400000;
    parsed=parsed.filter(item=>{const t=item.published_at?new Date(item.published_at).getTime():NaN;return Number.isFinite(t)&&t>=from&&t<=to});
  }
  // В аренде иногда попадаются объявления о продаже (цена в сотни тысяч $) — это не аренда
  if(isRent(f))parsed=parsed.filter(item=>!(Number(item.price||0)>20000));
  if(exactComplexCatalog&&f.complex){const matching=parsed.filter(item=>complexMatches(`${item.complex_name||""} ${item.title||""} ${item.description||""}`,f.complex||""));if(matching.length)parsed=matching;}
  const checkedAt=new Date().toISOString(),seen=new Set<string>();
  let items=parsed.filter(item=>{const key=`${item.source_name}|${item.external_id||item.source_url}`;if(seen.has(key))return false;seen.add(key);return true}).map(item=>({...item,floor:Number(item.raw_data?.floor||0)||null,total_floors:Number(item.raw_data?.total_floors||0)||null,construction_year:Number(item.raw_data?.construction_year||0)||null,complex_name:f.complex&&f.complex!=="Все"?String(f.complex):item.complex_name,published_at:item.published_at||null,date_known:!!item.published_at,last_seen_at:checkedAt}));
  const first=successful[0];
  // Totals usually live only on page 1. Fetch that small metadata page when
  // the user is browsing later pages, otherwise the UI falsely hides sources.
  let totalHtml=first.html;
  if(firstPage>1){
    try{const r=await fetch(pageUrl(base,1),{headers:HEADERS,redirect:"follow"});if(r.ok)totalHtml=await r.text()}catch{/* page cards remain usable */}
  }
  const nativeTotal=countFrom(totalHtml,source);
  const propertySubtypeActive=/^(Таунхаус|Дуплекс|Коттедж)$/i.test(selectedPropertyType(f));
  const postParseFilterActive=periodActive||propertySubtypeActive||!!f.condition||!!f.area_from||!!f.area_to||!!f.floor_from||!!f.floor_to||!!f.land_area_from||!!f.land_area_to||!!f.construction_year_from||!!f.construction_year_to||!!f.verified_only||!!(f.programs||[]).length||!!f.rooms||!!f.price_from||!!f.price_to;
  const exactDimComplex=source==="DIM.RIA Украина"&&exactComplexCatalog;
  // OLX exposes the total for its exact search URL; DIM.RIA exposes the total
  // for its exact ЖК catalog. Use those native totals when no additional
  // card-level filter is active. REM and RIELTOR do not provide a reliable
  // ЖК total, so for them the loaded count remains explicitly approximate.
  const nativeCountIsExact=!f.complex&&!postParseFilterActive&&Number(nativeTotal)>0;
  // Under content filters the only trustworthy number is the number of unique
  // cards that actually passed every filter and is returned to the CRM.
  // Advertising-site headline counters may include promoted, inaccessible or
  // merely keyword-related listings, so never present them as filtered cards.
  const olxAllNative=source==="OLX"&&!periodActive&&!propertySubtypeActive&&!f.condition&&!f.land_area_from&&!f.land_area_to&&!f.construction_year_from&&!f.construction_year_to&&!f.verified_only&&!(f.programs||[]).length&&(!f.rooms||/^[1-3]$/.test(String(f.rooms)))&&Number(nativeTotal)>0;
  const remAllNative=source==="REM"&&!periodActive&&!propertySubtypeActive&&!f.condition&&!f.land_area_from&&!f.land_area_to&&!f.construction_year_from&&!f.construction_year_to&&!f.verified_only&&!(f.programs||[]).length&&(!f.district||/textQuery=/.test(base))&&(!f.rooms||/^[1-3]$/.test(String(f.rooms)))&&Number(nativeTotal)>0;
  const rieltorAllNative=source==="RIELTOR.UA"&&!f.complex&&!periodActive&&!propertySubtypeActive&&!f.condition&&!f.land_area_from&&!f.land_area_to&&!f.area_from&&!f.area_to&&!f.floor_from&&!f.floor_to&&!f.construction_year_from&&!f.construction_year_to&&!f.verified_only&&!(f.programs||[]).length&&(!f.district||/-d\d+\/?/.test(base))&&(!f.rooms||/^[1-3]$/.test(String(f.rooms)))&&Number(nativeTotal)>0;
  const lunAllNative=source==="ЛУН"&&!exactComplexCatalog&&!periodActive&&!propertySubtypeActive&&!f.condition&&!f.land_area_from&&!f.land_area_to&&!f.area_from&&!f.area_to&&!f.floor_from&&!f.floor_to&&!f.construction_year_from&&!f.construction_year_to&&!f.verified_only&&!(f.programs||[]).length&&(!f.district||/-district/.test(base))&&(!f.rooms||/^[1-3]$/.test(String(f.rooms)))&&Number(nativeTotal)>0;
  // каталог ЖК на RIELTOR.UA без дополнительных фильтров: счётчик площадки («63 оголошення») — точный
  const rieltorComplexNative=exactRieltorCatalog&&!postParseFilterActive&&Number(nativeTotal)>0&&Number(nativeTotal)<5000;
  const total=rieltorComplexNative?Math.max(Number(nativeTotal),items.length):(olxAllNative||remAllNative||rieltorAllNative||lunAllNative)?Number(nativeTotal):(f.complex||postParseFilterActive)?items.length:(nativeCountIsExact?Number(nativeTotal):items.length);
  const countExact=olxAllNative||remAllNative||rieltorAllNative||lunAllNative||!postParseFilterActive||!!f.complex;
  // OLX на последней странице дописывает «інші результати, пов'язані з пошуком» — это уже не выдача по фильтру
  if(olxAllNative&&pageCount===1){const left=Number(nativeTotal)-(requestedPage-1)*40;if(left>0&&left<items.length)items=items.slice(0,left)}
  // OLX показывает «понад 1 000» — точное число выше 1000 площадка не сообщает
  const countCapped=source==="OLX"&&olxAllNative&&Number(nativeTotal)>=1000;
  const pageItemCount=items.length;
  // ЛУН не сообщает общее число объявлений: страница полная — значит, есть следующая
  const lunOpenEnded=source==="ЛУН"&&!lunAllNative&&!(Number(nativeTotal)>0)&&!exactComplexCatalog&&!f.complex&&pageItemCount>=20;
  const cardsPerNativePage=source==="DIM.RIA Украина"?20:source==="REM"?25:source==="OLX"?40:source==="ЛУН"?24:Math.max(1,Math.ceil(pageItemCount/Math.max(1,successful.length)));
  const nativePages=Number(nativeTotal)>0?Math.max(1,Math.ceil(Number(nativeTotal)/(cardsPerNativePage*pageCount))):null;
  const totalPages=f.complex&&source!=="REM"&&!(source==="OLX"&&olxAllNative)&&!(source==="ЛУН"&&lunAllNative)?1:postParseFilterActive?(nativePages||1):(Number(total)>0?Math.max(1,Math.ceil(Number(total)/(cardsPerNativePage*pageCount))):null);
  const debug=(f as any).debug?{pages:successful.map(x=>x.page),item_text:items[0]?.description||"",raw_card_markers:(successful[0]?.html.match(/data-cy=["']l-card["']/gi)||[]).length,raw_listing_links:(successful[0]?.html.match(/\/d\/(?:uk\/)?obyavlenie\//gi)||[]).length,raw_text:clean(successful[0]?.html||"").slice(0,5000),raw_html_sample:(()=>{const h=successful[0]?.html||"";const at=source==="RIELTOR.UA"?Math.max(h.indexOf("115 000"),h.indexOf("catalog-card"),h.indexOf("flats-sale/")):source==="REM"?((h.toLowerCase().indexOf("complex")>=0)?h.toLowerCase().indexOf("complex"):Math.max(h.indexOf("-db"),h.indexOf("object-param"))):h.indexOf("/d/uk/obyavlenie/");return at>=0?h.slice(Math.max(0,at-2000),at+8000):""})()}:undefined;
  return{source,ok:true,status:first.status,url:first.url,page:requestedPage,pages_loaded:successful.length,total,count_is_exact:lunOpenEnded||countCapped?false:countExact,count_capped:countCapped,page_item_count:pageItemCount,total_pages:lunOpenEnded?requestedPage+1:totalPages,has_more:lunOpenEnded?true:(totalPages?requestedPage<totalPages:pageItemCount>0),items,debug};
}

let complexDirectoryCache:{at:number;items:any[]}|null=null;
const geoComparable=(value:any,kind:"country"|"region"|"city")=>{
  const raw=String(value||"").trim();if(!raw||/^(все|усі|all)$/i.test(raw))return"";
  if(kind==="city"){const known=citySlug(raw);if(known)return known.replace(/[^a-z0-9]/g,"")}
  let key=latin(raw);
  if(kind==="country"&&/^(ukraina|ukrayina|ukraine)$/.test(key))return"ukraine";
  if(kind==="region")key=key.replace(/(?:skaya|ska|skaia)?oblast$/,"").replace(/region$/,"");
  return key;
};
const geoEquivalent=(actual:any,wanted:any,kind:"country"|"region"|"city")=>{
  const b=geoComparable(wanted,kind);if(!b)return true;
  const a=geoComparable(actual,kind);if(!a)return false;
  if(a===b||a.includes(b)||b.includes(a))return true;
  const longest=Math.max(a.length,b.length);return longest>=4&&editDistance(a,b)<=Math.max(1,Math.floor(longest*.2));
};

async function hydrateComplexFilter(f:Filters,req:Request){
  if(!f.complex||f.complex==="Все")return;
  try{
    if(!complexDirectoryCache||Date.now()-complexDirectoryCache.at>600000){
      const base=Deno.env.get("SUPABASE_URL")||"",anon=Deno.env.get("SUPABASE_ANON_KEY")||"",service=Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")||anon,auth=`Bearer ${service}`;if(!base||!service)return;
      const url=new URL("/rest/v1/analytics_residential_complexes",base);url.searchParams.set("select","official_name,source_url,country,region,city,district,address,completion_year");url.searchParams.set("is_active","eq.true");url.searchParams.set("limit","10000");
      const response=await fetch(url,{headers:{apikey:service,authorization:auth}});if(!response.ok)return;const items=await response.json();complexDirectoryCache={at:Date.now(),items:Array.isArray(items)?items:[]};
    }
    const candidates=complexDirectoryCache.items.filter(item=>complexMatches(item?.official_name||"",f.complex||""));if(!candidates.length)return;
    const requestedCountry=String(f.country||""),requestedRegion=String(f.region||""),requestedCity=String(f.city||""),requestedDistrict=districtCanon(String(f.district||""));
    const sourceUrl=String(f.complex_source_url||"");
    const exactName=complexCanon(String(f.complex||""));
    // The selected directory URL is the strongest ЖК identity. A catalogue can
    // belong to a suburb on DIM.RIA while the CRM user selected the nearby city.
    // Do not discard that exact ЖК because the two city labels differ.
    const exactUrlHit=sourceUrl?candidates.find(item=>String(item.source_url||"")===sourceUrl):null;
    const geoScoped=candidates.filter(item=>
      geoEquivalent(item?.country,requestedCountry,"country")&&
      geoEquivalent(item?.region,requestedRegion,"region")&&
      geoEquivalent(item?.city,requestedCity,"city")&&
      (!requestedDistrict||!item?.district||districtCanon(String(item.district))===requestedDistrict)
    );
    // If the directory city is blank or incorrectly parsed, accept a unique
    // exact-name ЖК inside the selected country/region, but never cross regions.
    const regionalExact=candidates.filter(item=>
      complexCanon(String(item.official_name||""))===exactName&&
      geoEquivalent(item?.country,requestedCountry,"country")&&
      geoEquivalent(item?.region,requestedRegion,"region")
    );
    const scoped=exactUrlHit?[exactUrlHit]:(geoScoped.length?geoScoped:(regionalExact.length===1?regionalExact:[]));
    if(!scoped.length)return;
    const score=(item:any)=>
      (String(item.source_url||"")===sourceUrl?128:0)+
      (complexCanon(String(item.official_name||""))===exactName?64:0)+
      (geoComparable(item.city,"city")===geoComparable(requestedCity,"city")?32:0)+
      (geoComparable(item.region,"region")===geoComparable(requestedRegion,"region")?16:0);
    const hit=[...scoped].sort((a,b)=>score(b)-score(a))[0];if(!hit)return;
    f.complex_source_url=String(hit.source_url||f.complex_source_url||"");
    (f as any)._complex_official_name=String(hit.official_name||f.complex||"");
    if(!requestedCity||/^(все|усі|all)$/i.test(requestedCity))f.city=String(hit.city||f.city||"");
    if(!requestedRegion||/^(все|усі|all)$/i.test(requestedRegion))f.region=String(hit.region||f.region||"");
    if(!requestedCountry||/^(все|усі|all)$/i.test(requestedCountry))f.country=String(hit.country||f.country||"Украина");
    f._complex_year=Number(hit.completion_year||0)||undefined;
    if(!f._complex_year&&(f.construction_year_from||f.construction_year_to)&&/^https:\/\/dom\.ria\.com\//i.test(String(hit.source_url||""))){try{const response=await fetch(String(hit.source_url),{headers:HEADERS,redirect:"follow"});if(response.ok){const pageText=clean(await response.text()),years=[...pageText.matchAll(/(?:Дата\s+здачі|Дата\s+сдачи|Введено(?:\s+в\s+експлуатацію)?|Введен[а-я]*)[^0-9]{0,40}(?:[1-4]\s*кв\.?\s*)?((?:19|20)\d{2})/giu)].map(m=>Number(m[1])).filter(y=>y>=1900&&y<=2100);if(years.length){const from=Number(f.construction_year_from||0),to=Number(f.construction_year_to||9999),inside=years.filter(y=>y>=from&&y<=to);f._complex_year=inside[0]||(!f.construction_year_to?Math.max(...years):!f.construction_year_from?Math.min(...years):0)||undefined}}}catch{/* listing-level year remains available */}}
    if(!requestedDistrict&&hit.district)f.district=String(hit.district);
  }catch{/* keep original filters */}
}

export async function handler(req:Request):Promise<Response>{
  if(req.method==="OPTIONS")return new Response("ok",{headers:CORS});
  try{
    const body:any=await req.json().catch(()=>({}));
    if(body?.action==="presentation_image")return proxyPresentationImage(body.url);
    if(body?.action==="presentation_detail")return presentationDetail(body.url);
    // Курс НБУ для пересчёта гривны/евро в доллары в Аналитике
    if(body?.action==="rates"){try{const r=await fetch("https://bank.gov.ua/NBUStatService/v1/statdirectory/exchange?json");const j=await r.json();const pick=(c:string)=>Number((j||[]).find((x:any)=>x?.cc===c)?.rate||0);return new Response(JSON.stringify({success:true,source:"НБУ",date:(j||[])[0]?.exchangedate||"",UAH_PER_USD:pick("USD"),UAH_PER_EUR:pick("EUR")}),{headers:CORS})}catch(e){return new Response(JSON.stringify({success:false,error:String(e)}),{headers:CORS})}}
    const f:Filters=body;
    if(String(f.country||"").trim()&&!/^(украина|україна|ukraine|все)$/i.test(String(f.country).trim()))return foreignSearch(f);
    (f as any)._requested_city=String(body?.city||"");(f as any)._requested_district=String(body?.district||"");
    if(propertyGroup(f)==="apartment")await hydrateComplexFilter(f,req);
    if(propertyGroup(f)==="apartment"&&f.complex&&f.complex!=="Все"){const exactUrl=await resolvedDomUrl(f);if(/\/myzykevycha-ovydyopol-zhk-/i.test(exactUrl))f.city="Лиманка";else if(/\/odessa-zhk-/i.test(exactUrl))f.city="Одеса";}
    const rawSources=Array.isArray((f as any).sources)&&(f as any).sources.length
      ?(f as any).sources
      :typeof (f as any).sources==="string"&&(f as any).sources.trim()
        ?[(f as any).sources]
        :Array.isArray((f as any).source)&&(f as any).source.length
          ?(f as any).source
          :typeof (f as any).source==="string"&&(f as any).source.trim()
            ?[(f as any).source]
            :["OLX","DIM.RIA Украина","REM","RIELTOR.UA","ЛУН"];
    const normalizeSource=(value:unknown)=>{const v=String(value||"").trim();if(/^(?:LUN|ЛУН)$/i.test(v))return"ЛУН";if(/^REM(?:\.UA)?$/i.test(v))return"REM";if(/^RIELTOR(?:\.UA)?$/i.test(v))return"RIELTOR.UA";if(/^(?:DIM|DOM)\.RIA(?: Украина)?$/i.test(v))return"DIM.RIA Украина";return v};
    const requestedSources=[...new Set(rawSources.map(normalizeSource))];
    const sources=requestedSources.filter(x=>["OLX","DIM.RIA Украина","REM","RIELTOR.UA","ЛУН"].includes(x));
    if(isRent(f))await loadUah();
    const results=(await Promise.all(sources.map(s=>one(s,f)))).map((r:any)=>isRent(f)?{...r,items:(r.items||[]).map((i:any)=>({...i,deal_type:"Аренда"}))}:r);
    // No exchange-rate conversion is performed. Every returned price is the
    // USD amount printed by the advertising source itself.
    return new Response(JSON.stringify({success:true,live:true,persisted:false,currency:"USD",price_mode:"source_usd_only",results}),{headers:CORS});
  }catch(e){
    return new Response(JSON.stringify({success:false,error:e instanceof Error?e.message:String(e)}),{status:500,headers:CORS});
  }
}
