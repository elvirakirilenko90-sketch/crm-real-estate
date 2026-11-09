// Зарубежные рекламные площадки для «Аналитики».
// Площадки, которые отдают страницу поиска серверу, разбираются универсально (JSON-LD / __NEXT_DATA__).
// Площадки с защитой от роботов (Cloudflare, DataDome и т.п.) не обходим: показываем статус и ссылку на поиск.
// Цены приводятся к USD по официальному курсу НБУ (пометка converted=true и исходная валюта сохраняются).
import { extractListings, GItem } from "./generic.ts";

const CORS = { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Headers": "authorization,apikey,content-type,x-client-info", "content-type": "application/json; charset=utf-8" };
const H = { "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0 Safari/537.36", "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8", "Accept-Language": "en-US,en;q=0.9" };

// Город из каталога CRM → английское имя / slug
const CITY_EN: Record<string, string> = {
  "Тбилиси": "tbilisi", "Батуми": "batumi", "Кобулети": "kobuleti", "Гонио": "gonio", "Квариати": "kvariati", "Кутаиси": "kutaisi", "Рустави": "rustavi", "Бакуриани": "bakuriani", "Боржоми": "borjomi", "Гудаури": "gudauri", "Мцхета": "mtskheta",
  "Дубай": "dubai", "Абу-Даби": "abu-dhabi", "Аль-Айн": "al-ain", "Шарджа": "sharjah", "Аджман": "ajman", "Рас-эль-Хайма": "ras-al-khaimah",
  "Мадрид": "madrid", "Барселона": "barcelona", "Валенсия": "valencia", "Аликанте": "alicante", "Малага": "malaga", "Марбелья": "marbella", "Севилья": "sevilla", "Пальма-де-Майорка": "palma", "Ибица": "ibiza", "Лас-Пальмас": "las-palmas", "Санта-Крус-де-Тенерифе": "santa-cruz-de-tenerife",
  "Лиссабон": "lisboa", "Кашкайш": "cascais", "Порту": "porto", "Фару": "faro", "Албуфейра": "albufeira", "Лагуш": "lagos",
  "Рим": "roma", "Милан": "milano", "Флоренция": "firenze", "Турин": "torino", "Венеция": "venezia", "Неаполь": "napoli", "Палермо": "palermo",
  "Берлин": "berlin", "Мюнхен": "muenchen", "Гамбург": "hamburg", "Франкфурт-на-Майне": "frankfurt-am-main", "Дюссельдорф": "duesseldorf", "Кёльн": "koeln",
  "Париж": "paris", "Ницца": "nice", "Канны": "cannes", "Марсель": "marseille", "Лион": "lyon", "Бордо": "bordeaux",
  "Лондон": "London", "Манчестер": "Manchester", "Бирмингем": "Birmingham", "Ливерпуль": "Liverpool", "Эдинбург": "Edinburgh", "Глазго": "Glasgow", "Кардифф": "Cardiff",
  "Варшава": "warszawa", "Краков": "krakow", "Гданьск": "gdansk", "Вроцлав": "wroclaw", "Познань": "poznan",
  "Амстердам": "amsterdam", "Роттердам": "rotterdam", "Гаага": "den-haag", "Утрехт": "utrecht",
  "Афины": "athens", "Салоники": "thessaloniki", "Ираклион": "heraklion", "Ханья": "chania",
  "Лимасол": "limassol", "Пафос": "paphos", "Ларнака": "larnaca", "Никосия": "nicosia",
  "Стамбул": "istanbul", "Анталья": "antalya", "Аланья": "alanya", "Бодрум": "bodrum", "Фетхие": "fethiye", "Измир": "izmir",
  "Бангкок": "bangkok", "Пхукет": "phuket", "Паттайя": "chon-buri/pattaya", "Чиангмай": "chiang-mai", "Самуи": "surat-thani/koh-samui",
  "Денпасар": "denpasar", "Чангу": "badung", "Семиньяк": "badung", "Убуд": "gianyar", "Санур": "denpasar", "Нуса-Дуа": "badung", "Улувату": "badung", "Джакарта": "jakarta",
  "Сингапур": "singapore", "Куала-Лумпур": "kuala-lumpur", "Джорджтаун": "penang", "Джохор-Бару": "johor-bahru",
  "Нью-Йорк": "new-york", "Майами": "miami", "Орландо": "orlando", "Лос-Анджелес": "los-angeles", "Сан-Диего": "san-diego", "Сан-Франциско": "san-francisco", "Остин": "austin", "Даллас": "dallas", "Хьюстон": "houston",
  "Торонто": "toronto", "Оттава": "ottawa", "Ванкувер": "vancouver", "Монреаль": "montreal",
  "Сидней": "sydney", "Мельбурн": "melbourne", "Брисбен": "brisbane", "Голд-Кост": "gold-coast", "Перт": "perth",
};
const OTODOM_PATH: Record<string, string> = { warszawa: "mazowieckie/warszawa/warszawa/warszawa", krakow: "malopolskie/krakow/krakow/krakow", gdansk: "pomorskie/gdansk/gdansk/gdansk", wroclaw: "dolnoslaskie/wroclaw/wroclaw/wroclaw", poznan: "wielkopolskie/poznan/poznan/poznan" };
const BALI = /^(badung|gianyar|denpasar|bali)$/;

type F = any;
const rent = (f: F) => /аренд|оренд|rent/i.test(String(f.deal_type || ""));
const cityOf = (f: F) => { const c = String(f.city || "").trim(); return c && !/^(все|усі|all)$/i.test(c) ? c : ""; };
const enCity = (f: F) => CITY_EN[cityOf(f)] || "";
type Adapter = { name: string; country: string; blocked?: boolean; url: (f: F) => string; note?: string; idUrl?: (id: string) => string };

// Порталы. blocked: площадка закрыта для автоматического чтения (проверено 10.11.2026).
const ADAPTERS: Adapter[] = [
  { name: "MyHome.ge", country: "Грузия", idUrl: (id) => `https://www.myhome.ge/en/pr/${id}/`, url: f => `https://www.myhome.ge/en/s/${rent(f) ? "Apartment-for-rent" : "Apartment-for-sale"}-${(enCity(f) || "georgia").replace(/^./, c => c.toUpperCase())}?deal_types=${rent(f) ? 2 : 1}&real_estate_types=1` },
  { name: "SS.ge", country: "Грузия", blocked: true, url: f => `https://home.ss.ge/en/real-estate/l/Flat/${rent(f) ? "For-Rent" : "For-Sale"}` },
  { name: "Korter.ge", country: "Грузия", url: f => `https://korter.ge/en/apartments-for-sale-${enCity(f) || "tbilisi"}`, note: "только новостройки, продажа" },
  { name: "Property Finder", country: "ОАЭ", url: f => `https://www.propertyfinder.ae/en/${rent(f) ? "rent" : "buy"}/${enCity(f) || "uae"}/properties-for-${rent(f) ? "rent" : "sale"}.html` },
  { name: "Bayut", country: "ОАЭ", blocked: true, url: f => `https://www.bayut.com/${rent(f) ? "to-rent" : "for-sale"}/property/${enCity(f) || "uae"}/` },
  { name: "Dubizzle", country: "ОАЭ", blocked: true, url: f => `https://${enCity(f) || "dubai"}.dubizzle.com/en/property-for-${rent(f) ? "rent" : "sale"}/residential/` },
  { name: "idealista", country: "Испания", blocked: true, url: f => `https://www.idealista.com/${rent(f) ? "alquiler" : "venta"}-viviendas/${enCity(f) ? `${enCity(f)}-${enCity(f)}/` : ""}` },
  { name: "Fotocasa", country: "Испания", blocked: true, url: f => `https://www.fotocasa.es/es/${rent(f) ? "alquiler" : "comprar"}/viviendas/${enCity(f) || "espana"}/todas-las-zonas/l` },
  { name: "idealista", country: "Португалия", blocked: true, url: f => `https://www.idealista.pt/${rent(f) ? "arrendar" : "comprar"}-casas/${enCity(f) ? enCity(f) + "/" : ""}` },
  { name: "Imovirtual", country: "Португалия", url: f => `https://www.imovirtual.com/pt/resultados/${rent(f) ? "arrendar" : "comprar"}/apartamento/${enCity(f) || "todo-o-pais"}` },
  { name: "Immobiliare.it", country: "Италия", blocked: true, url: f => `https://www.immobiliare.it/${rent(f) ? "affitto" : "vendita"}-case/${enCity(f) ? enCity(f) + "/" : ""}` },
  { name: "idealista", country: "Италия", blocked: true, url: f => `https://www.idealista.it/${rent(f) ? "affitto" : "vendita"}-case/${enCity(f) ? `${enCity(f)}-${enCity(f)}/` : ""}` },
  { name: "ImmoScout24", country: "Германия", blocked: true, url: f => `https://www.immobilienscout24.de/Suche/de/${enCity(f) ? `${enCity(f)}/${enCity(f)}/` : ""}wohnung-${rent(f) ? "mieten" : "kaufen"}` },
  { name: "Immowelt", country: "Германия", url: f => `https://www.immowelt.de/suche/${enCity(f) || "deutschland"}/wohnungen/${rent(f) ? "mieten" : "kaufen"}` },
  { name: "SeLoger", country: "Франция", blocked: true, url: f => `https://www.seloger.com/immobilier/${rent(f) ? "locations" : "achat"}/` },
  { name: "Rightmove", country: "Великобритания", url: f => `https://www.rightmove.co.uk/property-${rent(f) ? "to-rent" : "for-sale"}/${enCity(f) || "London"}.html` },
  { name: "Zoopla", country: "Великобритания", blocked: true, url: f => `https://www.zoopla.co.uk/${rent(f) ? "to-rent" : "for-sale"}/property/${String(enCity(f) || "london").toLowerCase()}/` },
  { name: "Otodom", country: "Польша", url: f => `https://www.otodom.pl/pl/wyniki/${rent(f) ? "wynajem" : "sprzedaz"}/mieszkanie/${OTODOM_PATH[enCity(f)] || "cala-polska"}` },
  { name: "OLX Nieruchomości", country: "Польша", url: f => `https://www.olx.pl/nieruchomosci/mieszkania/${rent(f) ? "wynajem" : "sprzedaz"}/${enCity(f) ? enCity(f) + "/" : ""}` },
  { name: "Sreality.cz", country: "Чехия", blocked: true, url: f => `https://www.sreality.cz/hledani/${rent(f) ? "pronajem" : "prodej"}/byty` },
  { name: "willhaben Immobilien", country: "Австрия", url: f => rent(f) ? "https://www.willhaben.at/iad/immobilien/mietwohnungen/mietwohnung-angebote" : "https://www.willhaben.at/iad/immobilien/eigentumswohnung/eigentumswohnung-angebote" },
  { name: "Hemnet", country: "Швеция", blocked: true, url: () => "https://www.hemnet.se/bostader" },
  { name: "Daft.ie", country: "Ирландия", blocked: true, url: f => `https://www.daft.ie/property-${rent(f) ? "for-rent" : "for-sale"}/ireland` },
  { name: "Immoweb", country: "Бельгия", url: f => `https://www.immoweb.be/en/search/apartment/${rent(f) ? "for-rent" : "for-sale"}?countries=BE` },
  { name: "Homegate", country: "Швейцария", blocked: true, url: f => `https://www.homegate.ch/${rent(f) ? "rent" : "buy"}/real-estate/country-switzerland/matching-list` },
  { name: "Property Finder", country: "ОАЭ", blocked: false, url: f => `https://www.propertyfinder.ae/en/${rent(f) ? "rent" : "buy"}/${enCity(f) || "uae"}/properties-for-${rent(f) ? "rent" : "sale"}.html` },
  { name: "Funda", country: "Нидерланды", blocked: true, url: f => `https://www.funda.nl/zoeken/${rent(f) ? "huur" : "koop"}?selected_area=%5B%22${enCity(f) || "nl"}%22%5D` },
  { name: "Spitogatos", country: "Греция", blocked: true, url: f => `https://www.spitogatos.gr/en/for_${rent(f) ? "rent" : "sale"}-homes/${enCity(f) || "greece"}` },
  { name: "Bazaraki", country: "Кипр", blocked: true, url: f => `https://www.bazaraki.com/real-estate-${rent(f) ? "to-rent" : "for-sale"}/` },
  { name: "sahibinden", country: "Турция", blocked: true, url: f => `https://www.sahibinden.com/${rent(f) ? "kiralik" : "satilik"}-daire/${enCity(f) || ""}` },
  { name: "FazWaz", country: "Таиланд", url: f => `https://www.fazwaz.com/property-for-${rent(f) ? "rent" : "sale"}/thailand${enCity(f) ? "/" + enCity(f) : ""}` },
  { name: "DDproperty", country: "Таиланд", blocked: true, url: f => `https://www.ddproperty.com/en/property-for-${rent(f) ? "rent" : "sale"}?freetext=${encodeURIComponent(cityOf(f) || "Thailand")}` },
  { name: "Rumah123", country: "Индонезия / Бали", url: f => `https://www.rumah123.com/${rent(f) ? "sewa" : "jual"}/${enCity(f) && !BALI.test(enCity(f)) ? enCity(f) : enCity(f) || "bali"}/rumah/` },
  { name: "Rumah.com", country: "Индонезия / Бали", blocked: true, url: f => `https://www.rumah.com/properti-${rent(f) ? "disewa" : "dijual"}?freetext=${encodeURIComponent(cityOf(f) || "Bali")}` },
  { name: "PropertyGuru", country: "Сингапур", blocked: true, url: f => `https://www.propertyguru.com.sg/property-for-${rent(f) ? "rent" : "sale"}` },
  { name: "99.co", country: "Сингапур", blocked: true, url: f => `https://www.99.co/singapore/${rent(f) ? "rent" : "sale"}` },
  { name: "PropertyGuru", country: "Малайзия", blocked: true, url: f => `https://www.propertyguru.com.my/property-for-${rent(f) ? "rent" : "sale"}?freetext=${encodeURIComponent(cityOf(f) || "Malaysia")}` },
  { name: "Zillow", country: "США", blocked: true, url: f => `https://www.zillow.com/${enCity(f) || "homes"}/${rent(f) ? "rentals/" : ""}` },
  { name: "Realtor.com", country: "США", blocked: true, url: () => "https://www.realtor.com/realestateandhomes-search" },
  { name: "Redfin", country: "США", blocked: true, url: () => "https://www.redfin.com/" },
  { name: "REALTOR.ca", country: "Канада", blocked: true, url: () => "https://www.realtor.ca/map" },
  { name: "realestate.com.au", country: "Австралия", blocked: true, url: f => `https://www.realestate.com.au/${rent(f) ? "rent" : "buy"}/` },
  { name: "Domain", country: "Австралия", blocked: true, url: f => `https://www.domain.com.au/${rent(f) ? "rent" : "sale"}/` },
];

// Курсы НБУ (грн за 1 единицу валюты), кэш на 6 часов
let rates: { at: number; map: Record<string, number> } | null = null;
async function nbuRates(): Promise<Record<string, number>> {
  if (rates && Date.now() - rates.at < 6 * 3600000) return rates.map;
  try {
    const r = await fetch("https://bank.gov.ua/NBUStatService/v1/statdirectory/exchange?json");
    const arr = await r.json(); const map: Record<string, number> = { UAH: 1 };
    for (const x of arr || []) if (x?.cc && x?.rate) map[String(x.cc).toUpperCase()] = Number(x.rate);
    if (!map.AED && map.USD) map.AED = map.USD / 3.6725; // дирхам привязан к доллару: 3.6725 AED = 1 USD
    rates = { at: Date.now(), map }; return map;
  } catch { return rates?.map || {}; }
}
const COUNTRY_CUR: Record<string, string> = { "Грузия": "GEL", "ОАЭ": "AED", "Испания": "EUR", "Португалия": "EUR", "Италия": "EUR", "Германия": "EUR", "Франция": "EUR", "Великобритания": "GBP", "Польша": "PLN", "Нидерланды": "EUR", "Греция": "EUR", "Кипр": "EUR", "Турция": "TRY", "Таиланд": "THB", "Индонезия / Бали": "IDR", "Сингапур": "SGD", "Малайзия": "MYR", "США": "USD", "Канада": "CAD", "Австралия": "AUD", "Чехия": "CZK", "Австрия": "EUR", "Швеция": "SEK", "Ирландия": "EUR", "Бельгия": "EUR", "Швейцария": "CHF" };

// ЖК / проект по ключевым словам названия (на зарубежных площадках нет отдельного фильтра)
function complexFromTitle(t: string): string {
  const s = String(t || "");
  const m = s.match(/\b(?:ЖК|ЖК\s+)\s*[«"']?([^,;|«»"']{2,60})/i) || s.match(/\b(?:at|in)\s+([A-Z][\w'’.-]*(?:\s+[A-Z0-9][\w'’.-]*){0,4}\s+(?:Residences?|Tower|Towers|Park|Village|Gardens?|Heights|Hills|Bay|Plaza|Square|Estates?|Condominium|Condo|Living|Resort|Apartments|Suites))\b/) || s.match(/\b([A-Z][\w'’.-]*(?:\s+[A-Z0-9][\w'’.-]*){0,3}\s+(?:Residences?|Tower|Towers|Village|Gardens|Heights|Hills|Plaza|Condominium|Condo|Resort|Suites))\b/);
  return m ? m[1].trim() : "";
}

async function runAdapter(a: Adapter, f: F) {
  const url = a.url(f);
  const city = cityOf(f);
  if (city && !enCity(f) && !/willhaben|Immoweb/.test(a.name)) return { source: a.name, ok: true, total: 0, items: [], url, unsupported_city: true, error: `Город «${city}» для ${a.name} не настроен` };
  if (a.blocked) return { source: a.name, ok: false, blocked: true, total: 0, items: [], url, error: `${a.name} закрывает поиск для автоматического чтения — откройте поиск по ссылке` };
  const ctl = new AbortController(); const timer = setTimeout(() => ctl.abort(), 25000);
  try {
    const r = await fetch(url, { headers: H, redirect: "follow", signal: ctl.signal });
    const html = await r.text();
    if (!r.ok || /Just a moment|cf-chl|captcha-delivery|px-captcha|Access Denied/i.test(html.slice(0, 20000)) && html.length < 50000) return { source: a.name, ok: false, blocked: true, status: r.status, total: 0, items: [], url, error: `${a.name} не отдал страницу (${r.status}) — откройте поиск по ссылке` };
    const map = await nbuRates();
    const defCur = COUNTRY_CUR[a.country] || "";
    let list: GItem[] = extractListings(html, r.url || url, 200);
    if (a.idUrl) list = list.map((g) => (!g.url || g.url === g.id || /^\d+$/.test(g.id) && !/\/pr\//.test(g.url)) && g.id ? { ...g, url: a.idUrl!(g.id) } : g);
    const items = list.map((g) => {
      const cur = g.currency || defCur;
      const usd = cur === "USD" ? g.price : (map[cur] && map.USD ? g.price * map[cur] / map.USD : 0);
      const complex = a.name === "Korter.ge" ? g.title : complexFromTitle(`${g.title} ${g.address}`);
      return {
        external_id: g.id || g.url, source_name: a.name, source_url: g.url, title: g.title, description: g.address || g.title,
        country: a.country, region: String(f.region || ""), city: g.city || city || "", district: "", property_type: String(f.property_type || "Квартира"),
        deal_type: rent(f) ? "Аренда" : "Продажа", rooms: g.rooms || null, price: Math.round(usd), area: g.area || 0, currency: "USD", complex_name: complex,
        main_photo_url: g.image, photo_urls: g.image ? [g.image] : [], published_at: null,
        raw_data: { live: true, source_price: g.price, source_currency: cur, converted: cur !== "USD", rate_source: cur !== "USD" ? "НБУ" : null },
      };
    }).filter((x) => {
      if (!(x.price > 0) || !x.source_url) return false;
      // Отсекаем саму страницу поиска (агрегатная разметка «Properties for sale in …»)
      const clean = (u: string) => u.split("#")[0].split("?")[0].replace(/\/$/, "");
      return clean(x.source_url) !== clean(url) && clean(x.source_url) !== clean(r.url || "");
    });
    const room = Number(String(f.rooms || "").replace(/\D/g, "")) || 0, roomsPlus = /\+/.test(String(f.rooms || ""));
    const want = String(f.complex || "").trim().toLowerCase();
    const filtered = items.filter((x) =>
      (!f.price_from || x.price >= Number(f.price_from)) && (!f.price_to || x.price <= Number(f.price_to)) &&
      (!f.area_from || x.area >= Number(f.area_from)) && (!f.area_to || (x.area > 0 && x.area <= Number(f.area_to))) &&
      (!room || (roomsPlus ? Number(x.rooms || 0) >= room : Number(x.rooms || 0) === room)) &&
      (!want || want === "все" || `${x.complex_name} ${x.title} ${x.description}`.toLowerCase().includes(want.replace(/^жк\s+/, ""))));
    const now = new Date().toISOString();
    return { source: a.name, ok: true, status: r.status, url, total: filtered.length, count_is_exact: true, page: 1, page_item_count: filtered.length, total_pages: 1, has_more: false, note: a.note || "", items: filtered.map((x) => ({ ...x, last_seen_at: now, published_at: now })) };
  } catch (e) {
    return { source: a.name, ok: false, total: 0, items: [], url, error: `${a.name}: ${e instanceof Error ? e.message : String(e)}` };
  } finally { clearTimeout(timer); }
}

export async function foreignSearch(f: F): Promise<Response> {
  const country = String(f.country || "").trim();
  const wanted: string[] = (Array.isArray(f.sources) ? f.sources : []).map((s: any) => String(s).toLowerCase());
  const seen = new Set<string>();
  const list = ADAPTERS.filter((a) => a.country === country).filter((a) => { const k = a.name.toLowerCase(); if (seen.has(k)) return false; seen.add(k); return true; })
    .filter((a) => !wanted.length || wanted.some((w) => w === a.name.toLowerCase() || a.name.toLowerCase().includes(w) || w.includes(a.name.toLowerCase())));
  if (!list.length) return new Response(JSON.stringify({ success: true, live: true, persisted: false, currency: "USD", results: [], message: `Для страны «${country}» площадки не настроены` }), { headers: CORS });
  const results = await Promise.all(list.map((a) => runAdapter(a, f)));
  return new Response(JSON.stringify({ success: true, live: true, persisted: false, currency: "USD", price_mode: "converted_by_nbu", results }), { headers: CORS });
}
