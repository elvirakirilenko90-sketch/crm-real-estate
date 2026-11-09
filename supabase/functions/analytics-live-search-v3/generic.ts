// Универсальный разбор объявлений из встроенных данных страницы (JSON-LD, __NEXT_DATA__, JSON-скрипты).
// Ищет объекты, похожие на объявление: есть цена + ссылка/id + название/адрес. Работает для большинства
// современных порталов недвижимости (Next.js, schema.org), без отдельного парсера под каждый сайт.
export type GItem = { title: string; url: string; price: number; currency: string; area: number; rooms: number; city: string; address: string; image: string; id: string; raw?: any };

const PRICE_K = /^(price|prices|pricevalue|price_value|amount|totalprice|total_price|saleprice|sale_price|askingprice|asking_price|listprice|list_price|displayprice|pricetotal|priceamount|offerprice|cost|value)$/i;
const URL_K = /^(url|href|link|permalink|canonical|canonicalurl|detailurl|detail_url|shareurl|share_url|seourl|seo_url|slug|path|uri|adurl|propertyurl|listingurl|weburl)$/i;
const TITLE_K = /^(title|name|headline|heading|displaytitle|caption|summary|propertytitle|adtitle)$/i;
const ADDR_K = /^(address|displayaddress|display_address|streetaddress|location|locationname|addresslocality|fulladdress|full_address|subtitle)$/i;
const AREA_K = /^(area|size|sqm|surface|livingarea|living_area|floorarea|floor_area|floorsize|areainm2|area_m2|m2|squaremeters|square_meters|usablearea|totalarea|total_area|builtarea|livingspace|sqft|floorspace)$/i;
const ROOMS_K = /^(rooms|room|roomsnumber|rooms_number|numberofrooms|numberofroomstotal|bedrooms|bedroom|beds|bed|bedroomscount|roomcount|room_count|numberofbedrooms)$/i;
const CUR_K = /^(currency|pricecurrency|currencycode|currency_code|currencysymbol)$/i;
const IMG_K = /^(image|images|photo|photos|thumbnail|mainimage|main_image|coverimage|picture|pictures|media|src|imageurl|image_url|thumbnailurl)$/i;
const CITY_K = /^(city|town|locality|addresslocality|municipality|cityname|city_name)$/i;
const ID_K = /^(id|listingid|listing_id|adid|ad_id|propertyid|property_id|externalid|uuid|identifier)$/i;

const num = (v: any): number => {
  if (v == null) return 0;
  if (typeof v === "number") return Number.isFinite(v) ? v : 0;
  if (typeof v === "object") return num(v.value ?? v.amount ?? v.price ?? v.total ?? v.min ?? v.from ?? v.raw ?? v.number ?? 0);
  const s = String(v).replace(/ | /g, " ");
  const m = s.match(/\d[\d\s.,']*/); if (!m) return 0;
  let n = m[0].replace(/[\s']/g, "");
  if (/\d[.,]\d{3}([.,]\d{3})*$/.test(n) && !/[.,]\d{1,2}$/.test(n)) n = n.replace(/[.,]/g, "");
  else if (n.includes(",") && n.includes(".")) n = n.lastIndexOf(",") > n.lastIndexOf(".") ? n.replace(/\./g, "").replace(",", ".") : n.replace(/,/g, "");
  else n = n.replace(",", ".");
  const x = Number(n); return Number.isFinite(x) ? x : 0;
};
const str = (v: any): string => typeof v === "string" ? v.trim() : typeof v === "number" ? String(v) : (v && typeof v === "object" ? str(v.text ?? v.name ?? v.value ?? v.label ?? v.title ?? v.url ?? v.href ?? v.displayName ?? "") : "");
const curOf = (v: any, text = ""): string => {
  const s = `${str(v)} ${text}`.toUpperCase();
  for (const [re, c] of [[/\bUSD\b|\$/, "USD"], [/\bEUR\b|€/, "EUR"], [/\bGBP\b|£/, "GBP"], [/\bPLN\b|ZŁ/, "PLN"], [/\bAED\b/, "AED"], [/\bGEL\b|₾/, "GEL"], [/\bTHB\b|฿/, "THB"], [/\bIDR\b|\bRP\b/, "IDR"], [/\bTRY\b|₺|\bTL\b/, "TRY"], [/\bCZK\b|KČ/, "CZK"], [/\bCHF\b/, "CHF"], [/\bSEK\b/, "SEK"], [/\bSGD\b/, "SGD"], [/\bMYR\b|\bRM\b/, "MYR"], [/\bCAD\b/, "CAD"], [/\bAUD\b/, "AUD"], [/\bUAH\b|ГРН|₴/, "UAH"]] as [RegExp, string][]) if (re.test(s)) return c;
  return "";
};

function pick(o: any, re: RegExp, depth = 0): any {
  if (!o || typeof o !== "object" || depth > 2) return undefined;
  for (const [k, v] of Object.entries(o)) if (re.test(k) && v != null && v !== "") return v;
  for (const v of Object.values(o)) if (v && typeof v === "object" && !Array.isArray(v)) { const r = pick(v, re, depth + 1); if (r !== undefined) return r; }
  return undefined;
}
function firstImage(v: any): string {
  if (!v) return "";
  if (typeof v === "string") return /^https?:\/\/|^\/\//.test(v) ? v.replace(/^\/\//, "https://") : "";
  if (Array.isArray(v)) { for (const x of v) { const s = firstImage(x); if (s) return s; } return ""; }
  if (typeof v === "object") return firstImage(v.url ?? v.src ?? v.href ?? v.large ?? v.medium ?? v.small ?? v.uri ?? v.contentUrl ?? v.thumbnail);
  return "";
}

export function jsonRoots(html: string): any[] {
  const roots: any[] = [];
  for (const m of html.matchAll(/<script[^>]+type=["']application\/(?:ld\+)?json["'][^>]*>([\s\S]*?)<\/script>/gi)) { try { roots.push(JSON.parse(m[1].trim())); } catch { /* skip */ } }
  const nd = html.match(/<script[^>]+id=["']__NEXT_DATA__["'][^>]*>([\s\S]*?)<\/script>/i); if (nd) { try { roots.push(JSON.parse(nd[1])); } catch { /* skip */ } }
  for (const m of html.matchAll(/window\.(?:__INITIAL_STATE__|__PRELOADED_STATE__|__APOLLO_STATE__|__NUXT__|__data)\s*=\s*(\{[\s\S]*?\});?\s*<\/script>/g)) { try { roots.push(JSON.parse(m[1])); } catch { /* skip */ } }
  return roots;
}

export function extractListings(html: string, base: string, limit = 300): GItem[] {
  const roots = jsonRoots(html);
  const found: { o: any; item: GItem }[] = [];
  const seenObj = new Set<any>();
  const walk = (o: any, depth: number) => {
    if (!o || typeof o !== "object" || depth > 18 || seenObj.has(o) || found.length > limit * 3) return;
    seenObj.add(o);
    if (Array.isArray(o)) { for (const x of o.slice(0, 400)) walk(x, depth + 1); return; }
    const keys = Object.keys(o);
    const hasPrice = keys.some(k => PRICE_K.test(k)) || (o.offers && typeof o.offers === "object");
    if (hasPrice) {
      const offer = o.offers && typeof o.offers === "object" ? (Array.isArray(o.offers) ? o.offers[0] : o.offers) : null;
      const priceRaw = offer ? (offer.price ?? offer.lowPrice ?? offer.priceSpecification?.price) : pick(o, PRICE_K);
      const price = num(priceRaw);
      const urlRaw = str(o.url ?? o.href ?? o.link ?? offer?.url ?? pick(o, URL_K));
      const title = str(o.name ?? o.title ?? o.headline ?? pick(o, TITLE_K));
      const address = str(pick(o, ADDR_K));
      const idv = str(pick(o, ID_K));
      if (price > 0 && (urlRaw || idv) && (title || address)) {
        let url = "";
        try { url = urlRaw ? new URL(urlRaw, base).toString() : ""; } catch { url = ""; }
        const currency = curOf(offer?.priceCurrency ?? pick(o, CUR_K), typeof priceRaw === "string" ? priceRaw : "");
        const area = num(pick(o, AREA_K) ?? o.floorSize);
        const rooms = num(pick(o, ROOMS_K) ?? o.numberOfRooms);
        found.push({ o, item: { title: title || address, url, price, currency, area: area > 5 && area < 100000 ? area : 0, rooms: rooms > 0 && rooms < 30 ? Math.round(rooms) : 0, city: str(pick(o, CITY_K)), address, image: firstImage(o.image ?? o.photo ?? pick(o, IMG_K)), id: idv || url } });
      }
    }
    for (const k of keys) { const v = o[k]; if (v && typeof v === "object") walk(v, depth + 1); }
  };
  roots.forEach(r => walk(r, 0));
  // Убираем «обёртки», внутри которых есть другие объявления (списки, агрегаты)
  const leafs = found.filter(f => !found.some(g => g !== f && g.o !== f.o && contains(f.o, g.o)));
  const seen = new Set<string>(); const out: GItem[] = [];
  for (const { item } of leafs) { const k = item.url || item.id; if (!k || seen.has(k)) continue; seen.add(k); out.push(item); if (out.length >= limit) break; }
  return out;
}
function contains(a: any, b: any, depth = 0): boolean {
  if (!a || typeof a !== "object" || depth > 6) return false;
  for (const v of Object.values(a)) { if (v === b) return true; if (v && typeof v === "object" && contains(v, b, depth + 1)) return true; }
  return false;
}
