// Сайт pride-agency.com.ua: главная, каталог (список / карта), страница ЖК, форма заявки, учёт нажатий.
// Данные: /site/content.json (тексты UA/RU/EN) + site-api ?a=stats (цены за м², площади, комнаты, рассрочка из CRM).
(function () {
  const API = 'https://stvinrjyfuskqddcxzjv.supabase.co/functions/v1/site-api';
  const TG = 'https://t.me/Pride_RealEstate';
  const T = {
    uk: { tag: 'нерухомість · Одеса', nav_all: 'Усі новобудови', nav_map: 'На карті', nav_svc: 'Послуги', nav_cont: 'Контакти',
      kick: 'Агентство нерухомості в Одесі', h1: 'Ваша квартира в новобудові Одеси з розстрочкою до 5 років',
      lead: 'Підбираємо квартири в найкращих ЖК Одеси та домовляємося з забудовником про вигідні умови. Ціни й наявність оновлюємо щодня, а для покупця наші послуги безкоштовні.',
      see: 'Дивитись новобудови', budget: 'Підібрати під мій бюджет', qs: 'Швидкий пошук', rooms: 'Кімнат', studio: 'Студія', district: 'Район', all_d: 'Усі райони',
      m2max: 'Ціна за м² до, $', inst_only: 'Тільки з розстрочкою', show: 'Показати новобудови',
      st1: 'житлових комплексів', st2: 'ціна за метр', st3: 'площа квартир', st4: 'розстрочка від забудовника',
      pop: 'Популярні новобудови', allc: 'Усі новобудови →', p_m2: 'Ціна за м²', p_area: 'Площа', p_rooms: 'Кімнат', p_inst: 'Розстрочка',
      cta: 'Отримати презентацію та прорахунки', cta_s: 'Отримати презентацію та прорахунки →',
      svc: 'Чим допомагаємо',
      s1h: 'Новобудови з розстрочкою', s1: 'Порівняємо умови всіх забудовників і розрахуємо внесок та щомісячний платіж саме під ваш бюджет.',
      s2h: 'Купівля вторинного житла', s2: 'Знайдемо квартиру, ретельно перевіримо документи та супроводимо угоду до отримання ключів.',
      s3h: 'Продаж вашої квартири', s3: 'Оцінимо, прорекламуємо й покажемо покупцям. Ви отримуєте гроші, а всю роботу ми беремо на себе.',
      s4h: 'Оренда', s4: 'Довгострокова оренда в Одесі: надійні орендарі для власників і перевірені квартири для орендарів.',
      lh: 'Отримайте 3–5 найкращих варіантів під ваш бюджет', lp: 'Залиште номер, і менеджер надішле в Telegram підбірку з плануваннями, цінами та розрахунком розстрочки. Або напишіть нам самі:',
      get: 'Отримати підбірку', f_city: 'Одеса, Україна', f_fop: 'ФОП Кириленко Ельвіра Георгіївна', f_cont: 'Контакти', f_soc: 'Соцмережі', f_docs: 'Документи', f_priv: 'Політика конфіденційності', f_del: 'Видалення даних',
      m_call: 'Дзвінок', m_req: 'Заявка', cat_h: 'Новобудови Одеси з розстрочкою від забудовника', cat_s: 'Ціни й наявність оновлюємо щодня, напряму від забудовників',
      list: 'Усі новобудови', map: 'На карті', search: 'Назва ЖК, забудовник або район', filters: 'Фільтри', found: 'Знайдено', zk: 'ЖК', inst_from: 'Розстрочка від, міс.', any: 'будь-яка', reset: 'Скинути',
      nothing: 'Нічого не знайдено. Змініть фільтри або напишіть нам, і ми підберемо варіант.', home: 'Головна', why: 'Чому варто розглянути', about: 'Про комплекс', specs: 'Характеристики',
      spec_note: 'Планування, точні ціни й графік платежів ви отримаєте в презентації.', write_tg: 'Написати в Telegram', call: 'Подзвонити: 067 109 52 22',
      m_title: 'Презентація та прорахунки', m_sub: 'Надішлемо в Telegram планування, актуальні ціни та розрахунок розстрочки. Це безкоштовно й ні до чого не зобов’язує.',
      fl_name: "Ім'я", fl_phone: 'Телефон', send: 'Отримати', sending: 'Надсилаємо…', thanks: 'Дякуємо! Менеджер зв’яжеться з вами найближчим часом.', err_phone: 'Вкажіть, будь ласка, номер телефону', err: 'Не вдалося надіслати. Напишіть нам у Telegram, і ми відповімо одразу.',
      m_note: 'Натискаючи кнопку, ви погоджуєтесь з політикою конфіденційності.', by_req: 'за запитом', upto: 'до', mo: 'міс.', rm: 'кімн.', studios: 'студії', from: 'від', general: 'Підбір квартири' },
    ru: { tag: 'недвижимость · Одесса', nav_all: 'Все новостройки', nav_map: 'На карте', nav_svc: 'Услуги', nav_cont: 'Контакты',
      kick: 'Агентство недвижимости в Одессе', h1: 'Ваша квартира в новостройке Одессы с рассрочкой до 5 лет',
      lead: 'Подбираем квартиры в лучших ЖК Одессы и договариваемся с застройщиком о выгодных условиях. Цены и наличие обновляем ежедневно, а для покупателя наши услуги бесплатны.',
      see: 'Смотреть новостройки', budget: 'Подобрать под мой бюджет', qs: 'Быстрый поиск', rooms: 'Комнат', studio: 'Студия', district: 'Район', all_d: 'Все районы',
      m2max: 'Цена за м² до, $', inst_only: 'Только с рассрочкой', show: 'Показать новостройки',
      st1: 'жилых комплексов', st2: 'цена за метр', st3: 'площадь квартир', st4: 'рассрочка от застройщика',
      pop: 'Популярные новостройки', allc: 'Все новостройки →', p_m2: 'Цена за м²', p_area: 'Площадь', p_rooms: 'Комнат', p_inst: 'Рассрочка',
      cta: 'Получить презентацию и расчёты', cta_s: 'Получить презентацию и расчёты →',
      svc: 'Чем помогаем',
      s1h: 'Новостройки с рассрочкой', s1: 'Сравним условия всех застройщиков и рассчитаем взнос и ежемесячный платёж именно под ваш бюджет.',
      s2h: 'Покупка вторичного жилья', s2: 'Найдём квартиру, тщательно проверим документы и сопроводим сделку до получения ключей.',
      s3h: 'Продажа вашей квартиры', s3: 'Оценим, прорекламируем и покажем покупателям. Вы получаете деньги, а всю работу мы берём на себя.',
      s4h: 'Аренда', s4: 'Долгосрочная аренда в Одессе: надёжные арендаторы для собственников и проверенные квартиры для арендаторов.',
      lh: 'Получите 3–5 лучших вариантов под ваш бюджет', lp: 'Оставьте номер, и менеджер пришлёт в Telegram подборку с планировками, ценами и расчётом рассрочки. Или напишите нам сами:',
      get: 'Получить подборку', f_city: 'Одесса, Украина', f_fop: 'ФЛП Кириленко Эльвира Георгиевна', f_cont: 'Контакты', f_soc: 'Соцсети', f_docs: 'Документы', f_priv: 'Политика конфиденциальности', f_del: 'Удаление данных',
      m_call: 'Звонок', m_req: 'Заявка', cat_h: 'Новостройки Одессы с рассрочкой от застройщика', cat_s: 'Цены и наличие обновляем ежедневно, напрямую от застройщиков',
      list: 'Все новостройки', map: 'На карте', search: 'Название ЖК, застройщик или район', filters: 'Фильтры', found: 'Найдено', zk: 'ЖК', inst_from: 'Рассрочка от, мес.', any: 'любая', reset: 'Сбросить',
      nothing: 'Ничего не найдено. Измените фильтры или напишите нам, и мы подберём вариант.', home: 'Главная', why: 'Почему стоит рассмотреть', about: 'О комплексе', specs: 'Характеристики',
      spec_note: 'Планировки, точные цены и график платежей вы получите в презентации.', write_tg: 'Написать в Telegram', call: 'Позвонить: 067 109 52 22',
      m_title: 'Презентация и расчёты', m_sub: 'Пришлём в Telegram планировки, актуальные цены и расчёт рассрочки. Это бесплатно и ни к чему не обязывает.',
      fl_name: 'Имя', fl_phone: 'Телефон', send: 'Получить', sending: 'Отправляем…', thanks: 'Спасибо! Менеджер свяжется с вами в ближайшее время.', err_phone: 'Укажите, пожалуйста, номер телефона', err: 'Не удалось отправить. Напишите нам в Telegram, и мы ответим сразу.',
      m_note: 'Нажимая кнопку, вы соглашаетесь с политикой конфиденциальности.', by_req: 'по запросу', upto: 'до', mo: 'мес.', rm: 'комн.', studios: 'студии', from: 'от', general: 'Подбор квартиры' },
    en: { tag: 'real estate · Odesa', nav_all: 'All new builds', nav_map: 'Map', nav_svc: 'Services', nav_cont: 'Contacts',
      kick: 'Real estate agency in Odesa', h1: 'Your new-build flat in Odesa with up to 5 years of instalments',
      lead: 'We find flats in the best residential complexes in Odesa and negotiate favourable terms with developers. Prices and availability are updated daily, and our service is free for buyers.',
      see: 'Browse new builds', budget: 'Match my budget', qs: 'Quick search', rooms: 'Bedrooms', studio: 'Studio', district: 'District', all_d: 'All districts',
      m2max: 'Max price per m², $', inst_only: 'Instalments only', show: 'Show new builds',
      st1: 'residential complexes', st2: 'price per m²', st3: 'flat sizes', st4: 'developer instalments',
      pop: 'Popular new builds', allc: 'All new builds →', p_m2: 'Price per m²', p_area: 'Area', p_rooms: 'Bedrooms', p_inst: 'Instalments',
      cta: 'Get the brochure and payment plan', cta_s: 'Get the brochure and payment plan →',
      svc: 'How we help',
      s1h: 'New builds with instalments', s1: 'We compare every developer’s terms and work out the down payment and monthly payment for your budget.',
      s2h: 'Buying a resale flat', s2: 'We find the flat, check every document and guide the deal until you get the keys.',
      s3h: 'Selling your flat', s3: 'We value, advertise and show it to buyers. You get the money, we do the work.',
      s4h: 'Renting', s4: 'Long-term rentals in Odesa: reliable tenants for owners and vetted flats for tenants.',
      lh: 'Get the 3–5 best options for your budget', lp: 'Leave your number and a manager will send you a Telegram selection with floor plans, prices and an instalment plan. Or message us yourself:',
      get: 'Get my selection', f_city: 'Odesa, Ukraine', f_fop: 'Sole proprietor Elvira Kyrylenko', f_cont: 'Contacts', f_soc: 'Social', f_docs: 'Documents', f_priv: 'Privacy policy', f_del: 'Data deletion',
      m_call: 'Call', m_req: 'Request', cat_h: 'New builds in Odesa with developer instalments', cat_s: 'Prices and availability updated daily, straight from developers',
      list: 'All new builds', map: 'Map', search: 'Complex, developer or district', filters: 'Filters', found: 'Found', zk: 'complexes', inst_from: 'Instalments from, months', any: 'any', reset: 'Reset',
      nothing: 'Nothing found. Change the filters or message us and we will find an option.', home: 'Home', why: 'Why consider it', about: 'About the complex', specs: 'Key facts',
      spec_note: 'Floor plans, exact prices and the payment schedule come with the brochure.', write_tg: 'Message on Telegram', call: 'Call: +380 67 109 52 22',
      m_title: 'Brochure and payment plan', m_sub: 'We will send floor plans, current prices and an instalment plan on Telegram. Free and with no obligation.',
      fl_name: 'Name', fl_phone: 'Phone', send: 'Send', sending: 'Sending…', thanks: 'Thank you! A manager will contact you shortly.', err_phone: 'Please enter your phone number', err: 'Could not send. Message us on Telegram and we will reply right away.',
      m_note: 'By pressing the button you agree to our privacy policy.', by_req: 'on request', upto: 'up to', mo: 'mo.', rm: 'bed', studios: 'studios', from: 'from', general: 'Flat search' }
  };
  // ---------- типографика: неразрывный пробел после коротких слов, перед единицами ----------
  const SHORT = { uk: 'в|у|з|із|зі|до|на|по|від|за|і|й|та|а|але|не|ні|що|як|о|об|про|під|над|при|для|без|це|ми|ви|чи|ж|б|ЖК|вже|ще|усе|все', ru: 'в|во|у|с|со|к|ко|о|об|от|до|на|по|за|из|и|а|но|не|ни|что|как|для|при|без|под|над|про|это|мы|вы|ли|же|бы|ЖК|уже|ещё|всё|все', en: 'a|an|the|in|on|at|of|to|by|for|and|or|no|up|is|it|we|our|your|with|from' };
  const NB = ' ';
  function typo(s, L) {
    if (!s) return s; const re = new RegExp('(^|[\\s(«"])(' + SHORT[L] + ') ', 'gi');
    for (let i = 0; i < 2; i++) s = s.replace(re, (m, a, w) => a + w + NB);
    return s.replace(/(\d) (міс\.|мес\.|mo\.|хвилин|минут|minutes|м²|m²|км|поверх|этаж|кімн\.|комн\.|bed|місяців|месяцев|months|років|лет|years|мешканців|жителей|residents|місць|мест|spaces|кг|kg|м\b)/g, '$1' + NB + '$2')
      .replace(/(\d) (\d{3})/g, '$1' + NB + '$2').replace(/ —/g, ',').replace(/—/g, ',');
  }
  const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  // ---------- состояние ----------
  let L = (new URLSearchParams(location.search).get('lang') || localStorage.getItem('lang') || 'uk'); if (!T[L]) L = 'uk';
  const t = (k) => typo(T[L][k] ?? T.uk[k] ?? k, L);
  let DATA = [], STATS = {}, GEO = {};
  const sid = (() => { try { let s = sessionStorage.getItem('sid'); if (!s) { s = Math.random().toString(36).slice(2, 12); sessionStorage.setItem('sid', s); } return s; } catch { return ''; } })();
  const dev = () => (matchMedia('(max-width:640px)').matches ? 'phone' : matchMedia('(max-width:1024px)').matches ? 'tablet' : 'desktop');
  const utm = new URLSearchParams(location.search).get('utm_source') || '';
  let curSlug = null;
  function track(event, slug) {
    const body = JSON.stringify({ a: 'event', event, slug: slug ?? curSlug, page: location.pathname + location.search, device: dev(), lang: L, ref: document.referrer.slice(0, 200), utm, sid });
    try { if (navigator.sendBeacon) { navigator.sendBeacon(API, new Blob([body], { type: 'text/plain' })); return; } } catch {}
    fetch(API, { method: 'POST', body, keepalive: true, headers: { 'Content-Type': 'text/plain' } }).catch(() => {});
  }
  // ---------- форматирование ----------
  const fmt = (n) => Math.round(n).toLocaleString('uk-UA').replace(/\s/g, NB);
  function P(c) {
    const s = STATS[c.nb] || {}; const r = s.rooms || [];
    const rooms = (() => { const n = r.filter((x) => x > 0); const st = r.includes(0); if (!r.length) return t('by_req');
      const rng = n.length ? (n[0] === n[n.length - 1] ? n[0] : n[0] + '–' + n[n.length - 1]) + NB + T[L].rm : ''; return [st ? T[L].studios : '', rng].filter(Boolean).join(', '); })();
    return { m2: s.m2_min ? '$' + fmt(s.m2_min) + (s.m2_max && s.m2_max !== s.m2_min ? '–' + fmt(s.m2_max) : '') : t('by_req'),
      area: s.area_min ? s.area_min + (s.area_max !== s.area_min ? '–' + s.area_max : '') + NB + 'м²' : t('by_req'), rooms,
      inst: s.inst ? T[L].upto + NB + s.inst + NB + T[L].mo : t('by_req'), m2min: s.m2_min || null, instN: s.inst || 0, roomsArr: r };
  }
  const I = (c) => c.i18n[L] || c.i18n.uk;
  const dist = (c) => I(c).district;
  // ---------- иконки ----------
  const icTg = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M21 4L3 11l6 2 2 6 3-4 5 4z"/></svg>';
  const icPh = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M5 4h4l2 5-2.5 1.5a11 11 0 005 5L15 13l5 2v4a2 2 0 01-2 2A16 16 0 013 6a2 2 0 012-2"/></svg>';
  const icS = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#A1A1AA" stroke-width="2" aria-hidden="true"><circle cx="11" cy="11" r="7"/><path d="M20 20l-3.5-3.5"/></svg>';
  // ---------- карточка ЖК ----------
  function card(c) {
    const p = P(c);
    return `<a class="card zk" href="/zhk/${c.slug}" data-nav><div class="ph">${c.photo ? `<img src="${esc(c.photo)}" alt="" loading="lazy">` : ''}<b>${esc(p.inst)}</b></div><div class="zb">
      <strong>${esc(c.name)}</strong><span class="d">${esc(typo(dist(c), L))}</span>
      <div class="par"><div><span>${t('p_m2')}</span><b>${p.m2}</b></div><div><span>${t('p_area')}</span><b>${p.area}</b></div><div><span>${t('p_rooms')}</span><b>${esc(p.rooms)}</b></div><div><span>${t('p_inst')}</span><b class="y">${p.inst}</b></div></div>
      <span class="more">${t('cta_s')}</span></div></a>`;
  }
  // ---------- страницы ----------
  const app = document.getElementById('app');
  function home() {
    curSlug = null;
    const m2s = DATA.map((c) => P(c).m2min).filter(Boolean), insts = DATA.map((c) => P(c).instN);
    const areaMin = Math.min(...DATA.map((c) => (STATS[c.nb] || {}).area_min || 999));
    const dists = [...new Set(DATA.map((c) => dist(c).split(',')[0].trim()))];
    app.innerHTML = `
    <div class="wrap hero"><div style="display:flex;flex-direction:column;gap:22px">
      <span class="kick">${t('kick')}</span><h1>${t('h1')}</h1><p class="lead">${t('lead')}</p>
      <div style="display:flex;flex-wrap:wrap;gap:12px"><a class="btn" href="/novobudovy" data-nav>${t('see')}</a><button class="btn g" type="button" data-open="">${t('budget')}</button></div></div>
      <form class="card" id="qs" style="padding:28px;display:flex;flex-direction:column;gap:16px"><strong style="font-size:20px">${t('qs')}</strong>
        <div class="f">${t('rooms')}<div class="pills" id="qr">${[['0', T[L].studio], ['1', '1'], ['2', '2'], ['3', '3+']].map(([v, l]) => `<button type="button" data-v="${v}">${l}</button>`).join('')}</div></div>
        <label class="f">${t('district')}<select class="in" name="d"><option value="">${t('all_d')}</option>${dists.map((d) => `<option>${esc(d)}</option>`).join('')}</select></label>
        <label class="f">${t('m2max')}<input class="in" name="m" inputmode="numeric" placeholder="1 500"></label>
        <label class="chk"><input type="checkbox" name="i" checked>${t('inst_only')}</label>
        <button class="btn" type="submit">${t('show')}</button></form></div>
    <div class="stats"><div class="wrap">
      <div><b>${DATA.length}</b><span>${t('st1')}</span></div><div><b>${T[L].from} $${fmt(Math.min(...m2s))}/м²</b><span>${t('st2')}</span></div>
      <div><b>${T[L].from} ${areaMin}${NB}м²</b><span>${t('st3')}</span></div><div><b>${T[L].upto} ${Math.max(...insts)}${NB}${T[L].mo}</b><span>${t('st4')}</span></div></div></div>
    <section class="wrap"><div class="sec-h"><h2>${t('pop')}</h2><a href="/novobudovy" data-nav style="font-weight:700">${t('allc')}</a></div><div class="grid">${DATA.slice(0, 6).map(card).join('')}</div></section>
    <section id="services" style="background:#111113;border-top:1px solid var(--line)"><div class="wrap"><h2 style="margin-bottom:28px">${t('svc')}</h2><div class="svc">
      ${[1, 2, 3, 4].map((i) => `<div class="card"><strong>${t('s' + i + 'h')}</strong><span>${t('s' + i)}</span></div>`).join('')}</div></div></section>
    <section class="wrap" id="lead"><div class="hero" style="padding-top:0;padding-bottom:0"><div style="display:flex;flex-direction:column;gap:16px"><h2>${t('lh')}</h2><p class="lead">${t('lp')} <a href="${TG}" data-ev="telegram">@Pride_RealEstate</a></p></div>
      <div class="card" style="padding:28px;display:flex;flex-direction:column;gap:14px"><button class="btn" type="button" data-open="">${t('get')}</button><a class="btn g" href="${TG}" data-ev="telegram">${icTg}${t('write_tg')}</a><a class="btn g" href="tel:+380671095222" data-ev="phone">${icPh}${t('call')}</a></div></div></section>`;
    let room = null;
    app.querySelectorAll('#qr button').forEach((b) => b.onclick = () => { room = room === b.dataset.v ? null : b.dataset.v; app.querySelectorAll('#qr button').forEach((x) => x.classList.toggle('on', x.dataset.v === room)); });
    app.querySelector('#qs').onsubmit = (e) => { e.preventDefault(); const f = e.target; const q = new URLSearchParams();
      if (room) q.set('rooms', room); if (f.d.value) q.set('d', f.d.value); if (f.m.value) q.set('m', f.m.value.replace(/\D/g, '')); if (f.i.checked) q.set('inst', '1'); go('/novobudovy?' + q); };
  }
  let map = null;
  function catalog() {
    curSlug = null;
    const qp = new URLSearchParams(location.search); const view = qp.get('view') === 'map' ? 'map' : 'list';
    const dists = [...new Set(DATA.map((c) => dist(c).split(',')[0].trim()))];
    app.innerHTML = `<div class="wrap"><div class="crumbs"><a href="/" data-nav>${t('home')}</a> / ${t('list')}</div>
      <h1 style="font-size:clamp(30px,4vw,40px);margin-top:10px">${t('cat_h')}</h1><p style="color:var(--mut);margin:8px 0 0">${t('cat_s')}</p>
      <div class="tools"><div class="seg"><button type="button" data-v="list" class="${view === 'list' ? 'on' : ''}">${t('list')}</button><button type="button" data-v="map" class="${view === 'map' ? 'on' : ''}">${t('map')}</button></div>
        <label class="srch">${icS}<input id="q" placeholder="${esc(T[L].search)}" aria-label="${esc(T[L].search)}" value="${esc(qp.get('q') || '')}"></label>
        <button class="btn g fbtn" type="button" id="fb">${t('filters')}</button></div>
      <div class="cat"><aside class="card flt col" id="flt">
        <div class="f">${t('rooms')}<div class="pills" id="fr">${[['0', 'Ст'], ['1', '1'], ['2', '2'], ['3', '3+']].map(([v, l]) => `<button type="button" data-v="${v}" class="${qp.get('rooms') === v ? 'on' : ''}">${l}</button>`).join('')}</div></div>
        <label class="f">${t('m2max')}<input class="in" id="fm" inputmode="numeric" placeholder="1 500" value="${esc(qp.get('m') || '')}"></label>
        <label class="f">${t('inst_from')}<select class="in" id="fi"><option value="0">${t('any')}</option>${[12, 24, 36, 48].map((n) => `<option value="${n}" ${qp.get('if') == n ? 'selected' : ''}>${n}</option>`).join('')}</select></label>
        <div class="f">${t('district')}${dists.map((d) => `<label class="chk"><input type="checkbox" value="${esc(d)}" ${qp.get('d') === d ? 'checked' : ''}>${esc(d)}</label>`).join('')}</div>
        <label class="chk"><input type="checkbox" id="fo" ${qp.get('inst') ? 'checked' : ''}>${t('inst_only')}</label>
        <button class="btn g" type="button" id="fx">${t('reset')}</button></aside>
        <div class="res"><div id="cnt" style="color:var(--mut);font-size:14px;margin-bottom:14px"></div><div id="out"></div></div></div></div><div style="height:72px"></div>`;
    let room = qp.get('rooms');
    const $ = (s) => app.querySelector(s);
    $('#fb').onclick = () => $('#flt').classList.toggle('col');
    app.querySelectorAll('.seg button').forEach((b) => b.onclick = () => { const q = new URLSearchParams(location.search); b.dataset.v === 'map' ? q.set('view', 'map') : q.delete('view'); history.replaceState(null, '', '/novobudovy?' + q); catalog(); });
    app.querySelectorAll('#fr button').forEach((b) => b.onclick = () => { room = room === b.dataset.v ? null : b.dataset.v; app.querySelectorAll('#fr button').forEach((x) => x.classList.toggle('on', x.dataset.v === room)); draw(); });
    ['#q', '#fm'].forEach((s) => $(s).oninput = draw); ['#fi', '#fo'].forEach((s) => $(s).onchange = draw); app.querySelectorAll('#flt input[type=checkbox]').forEach((x) => x.onchange = draw);
    $('#fx').onclick = () => { history.replaceState(null, '', '/novobudovy' + (view === 'map' ? '?view=map' : '')); catalog(); };
    function list() {
      const q = $('#q').value.trim().toLowerCase(), m = Number($('#fm').value.replace(/\D/g, '')) || 0, fi = Number($('#fi').value), fo = $('#fo').checked;
      const ds = [...app.querySelectorAll('#flt .f input[type=checkbox]:checked')].map((x) => x.value);
      return DATA.filter((c) => { const p = P(c); const hay = (c.name + ' ' + dist(c) + ' ' + I(c).klass + ' ' + c.address).toLowerCase();
        if (q && !hay.includes(q)) return false; if (m && p.m2min && p.m2min > m) return false; if (fi && p.instN < fi) return false; if (fo && !p.instN) return false;
        if (ds.length && !ds.includes(dist(c).split(',')[0].trim())) return false;
        if (room != null) { const r = Number(room); if (p.roomsArr.length && !p.roomsArr.some((x) => (r === 3 ? x >= 3 : x === r))) return false; }
        return true; });
    }
    function draw() {
      const L2 = list(); $('#cnt').innerHTML = `${t('found')} <b style="color:var(--tx)">${L2.length} ${T[L].zk}</b>`;
      if (view === 'list') { $('#out').innerHTML = L2.length ? `<div class="grid">${L2.map(card).join('')}</div>` : `<div class="card empty">${t('nothing')}<br><br><a class="btn" href="${TG}" data-ev="telegram">${icTg}${t('write_tg')}</a></div>`; return; }
      if (!$('#map')) { $('#out').innerHTML = '<div id="map"></div>'; if (map) { map.remove(); map = null; } }
      if (!window.L) return;
      if (!map) { map = window.L.map('map', { scrollWheelZoom: false }).setView([46.45, 30.72], 12);
        window.L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19, attribution: '&copy; OpenStreetMap' }).addTo(map); map._pl = window.L.layerGroup().addTo(map); }
      map._pl.clearLayers(); const pts = [];
      L2.forEach((c) => { const g = GEO[c.slug]; if (!g || g.lat == null) return; const p = P(c);
        const icon = window.L.divIcon({ className: '', html: `<div class="pin">${p.m2min ? '$' + fmt(p.m2min) + '/м²' : esc(c.name)}</div>`, iconSize: null });
        const mk = window.L.marker([g.lat, g.lng], { icon }).addTo(map._pl); pts.push([g.lat, g.lng]);
        mk.bindPopup(`<strong style="font-size:16px">${esc(c.name)}</strong><div style="color:var(--mut);font-size:13px;margin:4px 0 8px">${esc(typo(dist(c), L))}</div>
          <div class="par" style="margin:0 0 10px"><div><span>${t('p_m2')}</span><b>${p.m2}</b></div><div><span>${t('p_area')}</span><b>${p.area}</b></div><div><span>${t('p_rooms')}</span><b>${esc(p.rooms)}</b></div><div><span>${t('p_inst')}</span><b class="y">${p.inst}</b></div></div>
          <button class="btn" type="button" data-open="${c.slug}" style="width:100%;padding:12px;font-size:14px">${t('cta')}</button>
          <a href="/zhk/${c.slug}" data-nav style="display:block;text-align:center;margin-top:10px;font-weight:700;font-size:13px">${esc(c.name)} →</a>`); });
      if (pts.length) map.fitBounds(pts, { padding: [40, 40], maxZoom: 14 });
      setTimeout(() => map && map.invalidateSize(), 50);
    }
    draw();
  }
  function zhk(slug) {
    const c = DATA.find((x) => x.slug === slug); if (!c) return go('/novobudovy', true);
    curSlug = slug; const p = P(c), i = I(c);
    document.title = c.name + ' · Pride';
    app.innerHTML = `<div class="wrap"><div class="crumbs"><a href="/" data-nav>${t('home')}</a> / <a href="/novobudovy" data-nav>${t('list')}</a> / ${esc(c.name)}</div>
      <div class="zh"><div class="gal">${c.photo ? `<img src="${esc(c.photo)}" alt="${esc(c.name)}">` : ''}</div>
      <div class="zi"><span class="kick">${esc(typo(i.klass, L))}</span><h1 style="font-size:clamp(32px,4vw,44px)">${esc(c.name)}</h1><span style="color:var(--mut)">${esc(typo(i.district, L))}</span>
        <div class="pbox"><div class="card"><span>${t('p_m2')}</span><b>${p.m2}</b></div><div class="card"><span>${t('p_area')}</span><b>${p.area}</b></div><div class="card"><span>${t('p_rooms')}</span><b>${esc(p.rooms)}</b></div><div class="card"><span>${t('p_inst')}</span><b style="color:var(--y)">${p.inst}</b></div></div>
        <button class="btn" type="button" data-open="${c.slug}">${t('cta')}</button>
        <a class="btn g" href="${TG}" data-ev="telegram">${icTg}${t('write_tg')}</a><a class="btn g" href="tel:+380671095222" data-ev="phone">${icPh}${t('call')}</a></div></div>
      <div class="about"><div class="t"><h2 style="font-size:26px">${t('about')}</h2><p>${esc(typo(i.about, L))}</p>
        ${i.plus && i.plus.length ? `<h2 style="font-size:26px;margin-top:12px">${t('why')}</h2>${i.plus.map((x) => `<div class="plus"><i>✓</i><span>${esc(typo(x, L))}</span></div>`).join('')}` : ''}</div>
        <aside class="card spec"><h3>${t('specs')}</h3>${[[T[L].p_m2, p.m2], [T[L].p_area, p.area], [T[L].p_rooms, p.rooms], [T[L].p_inst, p.inst], ...(i.specs || [])].map(([k, v]) => `<div><span>${esc(k)}</span><b>${esc(typo(String(v), L))}</b></div>`).join('')}
          <p class="note" style="margin:12px 0 0">${t('spec_note')}</p></aside></div></div>`;
    track('view', slug);
  }
  // ---------- роутинг ----------
  function route() {
    const path = location.pathname.replace(/\/+$/, '') || '/';
    if (map && !path.startsWith('/novobudovy')) { map.remove(); map = null; }
    document.title = 'Pride · ' + T[L].nav_all;
    if (path.startsWith('/zhk/')) zhk(decodeURIComponent(path.slice(5)));
    else if (path === '/novobudovy') catalog(); else home();
    statics(); window.scrollTo(0, location.hash ? document.querySelector(location.hash)?.offsetTop - 80 || 0 : 0);
  }
  function go(url, replace) { replace ? history.replaceState(null, '', url) : history.pushState(null, '', url); route(); }
  window.addEventListener('popstate', route);
  document.addEventListener('click', (e) => {
    const ev = e.target.closest('[data-ev]'); if (ev) track(ev.dataset.ev);
    const op = e.target.closest('[data-open]'); if (op) { e.preventDefault(); openForm(op.dataset.open); return; }
    const a = e.target.closest('a[data-nav]'); if (a && !e.metaKey && !e.ctrlKey) { const u = new URL(a.href); if (u.host === location.host) { e.preventDefault(); go(u.pathname + u.search + u.hash); } }
  });
  // ---------- статические подписи, язык ----------
  function statics() {
    document.documentElement.lang = L === 'uk' ? 'uk' : L;
    document.querySelectorAll('[data-t]').forEach((el) => { el.textContent = t(el.dataset.t); });
    document.getElementById('lang').innerHTML = ['uk', 'ru', 'en'].map((x) => `<button type="button" data-l="${x}" class="${x === L ? 'on' : ''}">${x === 'uk' ? 'UA' : x.toUpperCase()}</button>`).join('');
    document.querySelectorAll('#lang button').forEach((b) => b.onclick = () => { L = b.dataset.l; try { localStorage.setItem('lang', L); } catch {} route(); });
    const p = location.pathname; document.querySelectorAll('nav.m a').forEach((a) => a.classList.toggle('on', a.getAttribute('href') === p + location.search || (a.getAttribute('href') === '/novobudovy' && p === '/novobudovy' && !location.search.includes('view=map'))));
  }
  // ---------- форма ----------
  const modal = document.getElementById('modal'), lf = document.getElementById('lf');
  let formSlug = '';
  function openForm(slug) {
    formSlug = slug || ''; const c = DATA.find((x) => x.slug === formSlug);
    document.getElementById('mt').textContent = c ? t('m_title') + ': ' + c.name : t('general');
    document.getElementById('msub').textContent = t('m_sub'); document.getElementById('msend').textContent = t('send');
    document.getElementById('mnote').textContent = t('m_note'); document.getElementById('mtg').innerHTML = icTg + t('write_tg');
    document.getElementById('mok').style.display = 'none'; lf.querySelectorAll('.in,#msend').forEach((x) => x.style.display = '');
    modal.classList.add('on'); setTimeout(() => lf.elements.name.focus(), 50); track('form_open', formSlug || curSlug);
  }
  const close = () => modal.classList.remove('on');
  document.getElementById('mx').onclick = close; modal.onclick = (e) => { if (e.target === modal) close(); };
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && modal.classList.contains('on')) close(); });
  lf.onsubmit = async (e) => {
    e.preventDefault(); const ok = document.getElementById('mok'), btn = document.getElementById('msend');
    const E = lf.elements; const phone = E.phone.value.trim(); if (phone.replace(/\D/g, '').length < 9) { E.phone.focus(); E.phone.setCustomValidity(T[L].err_phone); E.phone.reportValidity(); E.phone.setCustomValidity(''); return; }
    btn.disabled = true; btn.textContent = t('sending'); const c = DATA.find((x) => x.slug === formSlug);
    const r = await fetch(API, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ a: 'lead', name: E.name.value, phone, slug: formSlug || curSlug, complex: c ? c.name : '', page: location.href.slice(0, 200), lang: L, device: dev(), sid, website: E.website.value }) }).then((x) => x.json()).catch(() => null);
    btn.disabled = false; btn.textContent = t('send');
    ok.textContent = r && r.ok ? t('thanks') : t('err'); ok.style.background = r && r.ok ? '#14532d' : '#7f1d1d'; ok.style.display = 'block';
    if (r && r.ok) { lf.reset(); lf.querySelectorAll('label.f,#msend').forEach((x) => x.style.display = 'none'); }
  };
  // ---------- старт ----------
  Promise.all([fetch('/site/content.json').then((r) => r.json()), fetch(API + '?a=stats').then((r) => r.json()).catch(() => ({ stats: {}, geo: {} }))]).then(([content, s]) => {
    STATS = s.stats || {}; GEO = s.geo || {};
    DATA = content.filter((c) => (GEO[c.slug]?.visible ?? true) && STATS[c.nb]?.has !== false).sort((a, b) => a.sort - b.sort);
    route(); if (!location.pathname.startsWith('/zhk/')) track('view', null);
  });
})();
