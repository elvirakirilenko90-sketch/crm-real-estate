// lun.js: превращает ЖК с ЛУН (site-api ?a=stats → lun, ?a=lun&slug) в карточки сайта.
// Описание пишем своими словами из характеристик (текст ЛУН не копируем), на UA/RU/EN.
// Экспорт: window.LUN = { item(x) → объект как в content.json, detail(c, d) → дополняет адрес, фото, описание, характеристики }.
(function () {
  // Районы Одессы на трёх языках; остальные населённые пункты: RU как есть, EN транслитом
  const DIST = { 'Приморський': ['Приморський р-н', 'Приморский р-н', 'Prymorskyi district'], 'Хаджибейський': ['Хаджибейський р-н', 'Хаджибейский р-н', 'Khadzhybeiskyi district'],
    'Київський': ['Київський р-н', 'Киевский р-н', 'Kyivskyi district'], 'Пересипський': ['Пересипський р-н', 'Пересыпский р-н', 'Peresypskyi district'] };
  const TR = { а: 'a', б: 'b', в: 'v', г: 'h', ґ: 'g', д: 'd', е: 'e', є: 'ie', ж: 'zh', з: 'z', и: 'y', і: 'i', ї: 'i', й: 'i', к: 'k', л: 'l', м: 'm', н: 'n', о: 'o', п: 'p', р: 'r', с: 's', т: 't', у: 'u', ф: 'f', х: 'kh', ц: 'ts', ч: 'ch', ш: 'sh', щ: 'shch', ь: '', ю: 'iu', я: 'ia', "'": '', 'ʼ': '' };
  const tr = (s) => s.replace(/[А-ЯҐЄІЇа-яґєії'ʼ]/g, (ch) => { const lo = ch.toLowerCase(); const r = TR[lo] ?? ch; return ch !== lo ? r.charAt(0).toUpperCase() + r.slice(1) : r; });
  const dist = (d) => (DIST[d] || [d, d, tr(d || '')]);
  // Подписи характеристик
  const KEYS = [['Клас', 'Класс', 'Class'], ['Будинків', 'Домов', 'Buildings'], ['Секцій', 'Секций', 'Sections'], ['Поверховість', 'Этажность', 'Floors'], ['Технологія будівництва', 'Технология', 'Construction'],
    ['Стіни', 'Стены', 'Walls'], ['Утеплення', 'Утепление', 'Insulation'], ['Тип опалення', 'Отопление', 'Heating'], ['Висота стелі', 'Высота потолков', 'Ceiling height'], ['Кількість квартир', 'Квартир', 'Apartments'],
    ['Ремонт', 'Ремонт', 'Finishing'], ['Територія', 'Территория', 'Territory'], ['Паркінг', 'Паркинг', 'Parking'], ['Резервне живлення', 'Резервное питание', 'Backup power'], ['Укриття', 'Укрытие', 'Shelter']];
  // Значения характеристик: UA → [RU, EN]
  const V = { 'бізнес': ['бизнес', 'business'], 'економ': ['эконом', 'economy'], 'комфорт': ['комфорт', 'comfort'], 'преміум': ['премиум', 'premium'], 'еліт': ['элит', 'elite'],
    'монолітно-каркасна': ['монолитно-каркасная', 'monolithic frame'], 'цегляна': ['кирпичная', 'brick'], 'газоблок (газобетон)': ['газоблок', 'aerated concrete'], 'залізобетон': ['железобетон', 'reinforced concrete'],
    'керамзитоблок (керамзитобетон)': ['керамзитоблок', 'expanded clay block'], 'керамоблок': ['керамоблок', 'ceramic block'], 'цегла': ['кирпич', 'brick'], 'базальтова вата (базальтова плита)': ['базальтовая вата', 'basalt wool'],
    'мінеральна вата': ['минеральная вата', 'mineral wool'], 'пінополістирол (пінопласт)': ['пенополистирол', 'polystyrene foam'], 'без утеплення': ['без утепления', 'none'], 'автономне (в будинку)': ['автономное (в доме)', 'building boiler'],
    'індивідуальне (в квартирі)': ['индивидуальное (в квартире)', 'individual boiler'], 'централізоване': ['центральное', 'central'], 'без ремонту': ['без ремонта', 'shell condition'], 'з ремонтом': ['с ремонтом', 'finished'],
    'з чорновим ремонтом': ['с черновым ремонтом', 'rough finish'], 'під ремонт': ['под ремонт', 'ready for finishing'], 'закрита для авто': ['закрыта для авто', 'car-free'], 'закрита для авто та сторонніх': ['закрыта для авто и посторонних', 'closed to cars and outsiders'],
    'гостьовий': ['гостевой', 'guest'], 'підземний': ['подземный', 'underground'], 'наземний критий': ['наземный крытый', 'covered'], 'гаражні бокси': ['гаражные боксы', 'garages'], 'генератор (всі будинки)': ['генератор (все дома)', 'generator (all buildings)'],
    'генератор (деякі будинки)': ['генератор (часть домов)', 'generator (some buildings)'], 'сонячні панелі': ['солнечные панели', 'solar panels'], 'інвертори': ['инверторы', 'inverters'], 'відсутнє': ['нет', 'none'], 'підвал': ['подвал', 'basement'],
    'підземний паркінг': ['подземный паркинг', 'underground car park'], 'спеціалізоване': ['специальное', 'dedicated shelter'] };
  const val = (k, v, li) => { v = String(v || '').replace(/\s*\(від підлоги до стелі\)/, '').replace(/^(\d+)\s*\(.*\)$/, '$1');
    if (k === 'Висота стелі') v = v.replace(/\./g, li === 2 ? '.' : ',');
    if (!li) return v;
    return v.split(/,\s*(?![^(]*\))/).map((p) => { const m = p.match(/^(.*?)\s*\((\d+) паркомісць\)$/); const base = m ? m[1] : p; const t = V[base.trim()] ? V[base.trim()][li - 1] : base;
      return m ? `${t} (${m[2]} ${li === 1 ? 'мест' : 'spaces'})` : t; }).join(', '); };
  const plural = (n, a, b, c) => { n = Math.abs(n) % 100; const d = n % 10; return n > 10 && n < 20 ? c : d === 1 ? a : d > 1 && d < 5 ? b : c; };
  const K = (x) => (x ? x.charAt(0).toUpperCase() + x.slice(1) : '');

  function texts(c, x, d) {
    const p = (d && d.props) || {}; const kl = x.klass || p['Клас'] || ''; const dev = (d && d.developer) || x.dev || '';
    const [du, dr, de] = dist(x.district); const h = Number(p['Будинків']) || 0, fl = p['Поверховість'] || '';
    const tech = p['Технологія будівництва'] || '', has = (k, s) => String(p[k] || '').includes(s);
    const ceil = parseFloat(String(p['Висота стелі'] || '').replace(',', '.')) || 0;
    const f = { closed: has('Територія', 'сторонніх') || has('Територія', 'закрита'), upark: has('Паркінг', 'підземний'), gen: has('Резервне живлення', 'генератор'), solar: has('Резервне живлення', 'сонячні'),
      shelter: p['Укриття'] && !has('Укриття', 'відсутнє'), fin: has('Ремонт', 'з ремонтом'), inst: x.inst };
    const featU = [f.closed && 'закрите подвір’я', f.upark && 'підземний паркінг', f.gen && 'генератор', f.solar && 'сонячні панелі', f.shelter && 'укриття'].filter(Boolean);
    const featR = [f.closed && 'закрытый двор', f.upark && 'подземный паркинг', f.gen && 'генератор', f.solar && 'солнечные панели', f.shelter && 'укрытие'].filter(Boolean);
    const featE = [f.closed && 'a closed courtyard', f.upark && 'underground parking', f.gen && 'a backup generator', f.solar && 'solar panels', f.shelter && 'a shelter'].filter(Boolean);
    const techU = { 'монолітно-каркасна': 'монолітно-каркасною', 'цегляна': 'цегляною' }[tech.split(',')[0].trim()];
    const techR = { 'монолітно-каркасна': 'монолитно-каркасной', 'цегляна': 'кирпичной' }[tech.split(',')[0].trim()];
    const techE = { 'монолітно-каркасна': 'monolithic frame', 'цегляна': 'brick' }[tech.split(',')[0].trim()];
    const uk = [`${c.name}: ${x.kind === 'cottage' ? 'котеджне містечко' : x.kind === 'town' ? 'таунхауси' : 'новобудова'}${kl ? ' ' + kl + '-класу' : ''}${dev ? ` від забудовника ${dev}` : ''}, ${du}.`,
      h ? `У проєкті ${h} ${plural(h, 'будинок', 'будинки', 'будинків')}${fl ? `, поверховість ${fl}` : ''}${techU ? `, зведення за ${techU} технологією` : ''}.` : '',
      featU.length ? `Для мешканців: ${featU.join(', ')}.` : '', ceil >= 2.8 ? `Високі стелі ${String(ceil).replace('.', ',')} м додають квартирам простору й світла.` : '',
      f.inst ? `Забудовник продає ${x.kind ? 'будинки' : 'квартири'} з розстрочкою до ${f.inst} місяців.` : '',
      'Залиште заявку, і ми надішлемо презентацію з актуальними планами, цінами та прорахунком платежів саме під ваш бюджет.'].filter(Boolean).join(' ');
    const ru = [`${c.name}: ${x.kind === 'cottage' ? 'коттеджный городок' : x.kind === 'town' ? 'таунхаусы' : 'новостройка'}${kl ? ' ' + val('Клас', kl, 1) + '-класса' : ''}${dev ? ` от застройщика ${dev}` : ''}, ${dr}.`,
      h ? `В проекте ${h} ${plural(h, 'дом', 'дома', 'домов')}${fl ? `, этажность ${fl}` : ''}${techR ? `, строительство по ${techR} технологии` : ''}.` : '',
      featR.length ? `Для жителей: ${featR.join(', ')}.` : '', ceil >= 2.8 ? `Высокие потолки ${String(ceil).replace('.', ',')} м добавляют квартирам простора и света.` : '',
      f.inst ? `Застройщик продаёт ${x.kind ? 'дома' : 'квартиры'} в рассрочку до ${f.inst} месяцев.` : '',
      'Оставьте заявку, и мы пришлём презентацию с актуальными планировками, ценами и расчётом платежей под ваш бюджет.'].filter(Boolean).join(' ');
    const en = [`${c.name} is a ${kl ? val('Клас', kl, 2) + '-class ' : ''}${x.kind === 'cottage' ? 'cottage community' : x.kind === 'town' ? 'townhouse community' : 'new development'}${dev ? ` by ${dev}` : ''} in ${de}, Odesa.`,
      h ? `The project has ${h} building${h > 1 ? 's' : ''}${fl ? ` of ${fl} floors` : ''}${techE ? `, ${techE} construction` : ''}.` : '',
      featE.length ? `Residents get ${featE.join(', ')}.` : '', ceil >= 2.8 ? `High ${ceil} m ceilings make the flats feel bright and spacious.` : '',
      f.inst ? `The developer offers instalments of up to ${f.inst} months.` : '',
      'Leave a request and we will send a presentation with current floor plans, prices and a payment plan tailored to your budget.'].filter(Boolean).join(' ');
    const plus = {
      uk: [f.inst && `Розстрочка від забудовника до ${f.inst} місяців`, f.gen && 'Генератор: світло й ліфти під час відключень', f.upark && 'Підземний паркінг', f.closed && 'Закрита територія без авто', f.shelter && 'Укриття в комплексі', ceil >= 2.8 && `Стелі ${String(ceil).replace('.', ',')} м`, f.fin && 'Є квартири з ремонтом'].filter(Boolean),
      ru: [f.inst && `Рассрочка от застройщика до ${f.inst} месяцев`, f.gen && 'Генератор: свет и лифты при отключениях', f.upark && 'Подземный паркинг', f.closed && 'Закрытая территория без машин', f.shelter && 'Укрытие в комплексе', ceil >= 2.8 && `Потолки ${String(ceil).replace('.', ',')} м`, f.fin && 'Есть квартиры с ремонтом'].filter(Boolean),
      en: [f.inst && `Developer instalments up to ${f.inst} months`, f.gen && 'Generator keeps lights and lifts on during outages', f.upark && 'Underground parking', f.closed && 'Car-free closed courtyard', f.shelter && 'On-site shelter', ceil >= 2.8 && `${ceil} m ceilings`, f.fin && 'Finished flats available'].filter(Boolean) };
    const specs = (li) => [...(dev ? [[['Забудовник', 'Застройщик', 'Developer'][li], dev]] : []), ...KEYS.filter(([k]) => p[k]).map((k) => [k[li], val(k[0], p[k[0]], li)])];
    const kls = [kl ? `${K(kl)}-клас` : 'Новобудова', kl ? `${K(val('Клас', kl, 1))}-класс` : 'Новостройка', kl ? `${K(val('Клас', kl, 2))} class` : 'New build'];
    return { uk: { klass: kls[0] + (dev ? ' · ' + dev : ''), district: du, about: uk, plus: plus.uk, specs: specs(0) },
      ru: { klass: kls[1] + (dev ? ' · ' + dev : ''), district: dr, about: ru, plus: plus.ru, specs: specs(1) },
      en: { klass: kls[2] + (dev ? ' · ' + dev : ''), district: de, about: en, plus: plus.en, specs: specs(2) } };
  }
  function item(x, i) {
    const c = { slug: x.slug, nb: 'lun:' + x.slug, name: x.name.replace(/^ЖК\s+/i, 'ЖК '), address: dist(x.district)[0], sort: 1000 + i, lun: x, photo: x.photo, photos: x.photo ? [x.photo] : [] };
    c.i18n = texts(c, x, null); return c;
  }
  function detail(c, d) {
    if (!d) return; c.det = d; if (d.photos && d.photos.length) { c.photos = d.photos; c.photo = d.photos[0]; }
    if (d.address) c.address = d.address; c.i18n = texts(c, c.lun, d);
  }
  window.LUN = { item, detail };
})();
