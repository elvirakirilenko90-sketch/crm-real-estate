import React, { useMemo, useState, useEffect } from "react";
import { supabase } from "./supabaseClient";
const stages = ["Новый Лид","Первый контакт","В работе","Назначена встреча","Проведена встреча","Думает","Задаток","Сделка","Отказ","Отложили"];
const sources = ["Повторный клиент","Рекомендации","ОЛХ","Лид руководство","Инстаграм личный","Тик-Ток личный","Фейсбук личный","Тик-Ток рабочий","Инстаграм рабочий","Фейсбук рабочий","Телеграмм-канал рабочий","Рекомендации клиентов"];
const types = ["1-комнатные","2-комнатные","3-комнатные","Таунхаус","Дом","Участок","Коммерция"];
const districts = ["Киевский","Приморский","Пересыпский","Хаджибейский","Аркадия"];
const months = ["Январь","Февраль","Март","Апрель","Май","Июнь","Июль","Август","Сентябрь","Октябрь","Ноябрь","Декабрь"];
const week = ["Пн","Вт","Ср","Чт","Пт","Сб","Вс"];
const eventTypes = ["Звонок","Встреча","Показ","Задача"];
const soundOptions = [
  {id:"classic", label:"Classic"},
  {id:"soft", label:"Soft"},
  {id:"double", label:"Double"},
  {id:"bell", label:"Bell"},
  {id:"glass", label:"Glass"},
  {id:"crystal", label:"Crystal"},
  {id:"digital", label:"Digital"},
  {id:"alarm", label:"Alarm"},
  {id:"iphone", label:"iPhone"},
  {id:"marimba", label:"Marimba"},
  {id:"none", label:"Без звука"}
];


const themeOptions = [
  {id:"classic", name:"Gold Black", vars:{"--accent":"#d6a500","--accent2":"#f3c21b","--dark":"#070707","--soft":"#f5f2ea","--card":"#ffffff","--text":"#111827"}},
  {id:"whiteGold", name:"White Gold", vars:{"--accent":"#d8a800","--accent2":"#f2d15b","--dark":"#111827","--soft":"#fff8df","--card":"#ffffff","--text":"#111827"}},
  {id:"graphite", name:"Graphite Amber", vars:{"--accent":"#f59e0b","--accent2":"#fbbf24","--dark":"#111827","--soft":"#f3f4f6","--card":"#ffffff","--text":"#111827"}},
  {id:"navy", name:"Navy Gold", vars:{"--accent":"#d4af37","--accent2":"#facc15","--dark":"#0f172a","--soft":"#eef2ff","--card":"#ffffff","--text":"#0f172a"}},
  {id:"green", name:"Emerald Beige", vars:{"--accent":"#10b981","--accent2":"#34d399","--dark":"#052e2b","--soft":"#ecfdf5","--card":"#ffffff","--text":"#064e3b"}},
  {id:"ocean", name:"Ocean Blue", vars:{"--accent":"#0284c7","--accent2":"#38bdf8","--dark":"#082f49","--soft":"#e0f2fe","--card":"#ffffff","--text":"#0c4a6e"}},
  {id:"tiffany", name:"Tiffany", vars:{"--accent":"#14b8a6","--accent2":"#5eead4","--dark":"#134e4a","--soft":"#ccfbf1","--card":"#ffffff","--text":"#134e4a"}},
  {id:"burgundy", name:"Burgundy", vars:{"--accent":"#be123c","--accent2":"#fb7185","--dark":"#4c0519","--soft":"#fff1f2","--card":"#ffffff","--text":"#4c0519"}},
  {id:"purple", name:"Royal Purple", vars:{"--accent":"#7c3aed","--accent2":"#a78bfa","--dark":"#2e1065","--soft":"#f3e8ff","--card":"#ffffff","--text":"#3b0764"}},
  {id:"coffee", name:"Coffee Cream", vars:{"--accent":"#92400e","--accent2":"#f59e0b","--dark":"#451a03","--soft":"#fef3c7","--card":"#ffffff","--text":"#451a03"}},
  {id:"rose", name:"Rose Quartz", vars:{"--accent":"#e11d48","--accent2":"#fb7185","--dark":"#881337","--soft":"#ffe4e6","--card":"#ffffff","--text":"#881337"}},
  {id:"mint", name:"Mint Fresh", vars:{"--accent":"#059669","--accent2":"#6ee7b7","--dark":"#064e3b","--soft":"#d1fae5","--card":"#ffffff","--text":"#065f46"}},
  {id:"slate", name:"Slate Minimal", vars:{"--accent":"#475569","--accent2":"#94a3b8","--dark":"#0f172a","--soft":"#f1f5f9","--card":"#ffffff","--text":"#0f172a"}},
  {id:"blackRed", name:"Black Red", vars:{"--accent":"#dc2626","--accent2":"#f87171","--dark":"#09090b","--soft":"#fee2e2","--card":"#ffffff","--text":"#111827"}},
  {id:"olive", name:"Olive Gold", vars:{"--accent":"#84cc16","--accent2":"#bef264","--dark":"#1a2e05","--soft":"#f7fee7","--card":"#ffffff","--text":"#365314"}},
  {id:"sky", name:"Sky Light", vars:{"--accent":"#2563eb","--accent2":"#93c5fd","--dark":"#1e3a8a","--soft":"#dbeafe","--card":"#ffffff","--text":"#1e40af"}}
];

const translations = {
  uk: {
    "Лента":"Стрічка", "Лента новостей":"Стрічка новин", "Канбан и клиенты":"Канбан і клієнти", "Клиенты":"Клієнти", "Календарь":"Календар", "Вторичка":"Вторинна нерухомість", "Объекты":"Об'єкти", "Аналитика":"Аналітика", "Помощь менеджерам":"Допомога менеджерам", "Доступы":"Доступи", "Ещё":"Ще", "Еще":"Ще", "Поиск по CRM...":"Пошук по CRM...", "Моё агентство":"Моє агентство",
    "Создать клиента":"Створити клієнта", "Сохранить клиента":"Зберегти клієнта", "Имя клиента":"Ім'я клієнта", "Телефон":"Телефон", "Источник":"Джерело", "Статус":"Статус", "Следующий контакт":"Наступний контакт", "Ответственный менеджер":"Відповідальний менеджер", "Заметки менеджера":"Нотатки менеджера", "История работы с клиентом":"Історія роботи з клієнтом", "Добавить комментарий в историю":"Додати коментар в історію", "Помощь директора":"Допомога директора", "Вопрос директору...":"Питання директору...", "Помощь менеджеру":"Допомога менеджеру", "Сохранены изменения":"Зміни збережено", "Задать вопрос директору":"Поставити питання директору", "Ответ директора":"Відповідь директора",
    "Новый Лид":"Новий лід", "Первый контакт":"Перший контакт", "В работе":"У роботі", "Назначена встреча":"Призначена зустріч", "Проведена встреча":"Зустріч проведено", "Думает":"Думає", "Задаток":"Завдаток", "Сделка":"Угода", "Отказ":"Відмова", "Отложили":"Відклали",
    "Звонок":"Дзвінок", "Встреча":"Зустріч", "Показ":"Показ", "Задача":"Завдання", "Дата следующего касания":"Дата наступного контакту", "Время":"Час", "Название":"Назва", "Напомнить за":"Нагадати за", "Звук":"Звук", "Сохранить событие":"Зберегти подію", "Редактировать":"Редагувати", "Удалить":"Видалити", "Открыть":"Відкрити", "Закрыть":"Закрити", "Сохранить":"Зберегти", "Отправить":"Надіслати", "Добавить":"Додати",
    "Добавить объект":"Додати об'єкт", "Название объекта":"Назва об'єкта", "Тип":"Тип", "Район":"Район", "Цена":"Ціна", "Площадь":"Площа", "Этаж":"Поверх", "Собственник":"Власник", "Телефон собственника":"Телефон власника", "Описание":"Опис", "Сохранить объект":"Зберегти об'єкт", "Фото / видео объекта":"Фото / відео об'єкта", "Добавить фото/видео":"Додати фото/відео", "Юридические параметры":"Юридичні параметри", "Право собственности":"Право власності", "Переуступка":"Переуступка", "Госпрограммы":"Держпрограми", "Отправить презентацию клиенту":"Надіслати презентацію клієнту", "Скачать PDF-презентацию":"Завантажити PDF-презентацію",
    "Язык интерфейса":"Мова інтерфейсу", "Цветовая гамма CRM":"Кольорова гама CRM", "Каждый пользователь может выбрать оформление под себя.":"Кожен користувач може обрати оформлення під себе.", "Роль для проверки CRM":"Роль для перевірки CRM", "Открыть":"Відкрити", "Выйти":"Вийти", "Русский":"Російська", "Українська":"Українська", "English":"English"
  },
  en: {
    "Лента":"Feed", "Лента новостей":"News Feed", "Канбан и клиенты":"Kanban and Clients", "Клиенты":"Clients", "Календарь":"Calendar", "Вторичка":"Resale", "Объекты":"Properties", "Аналитика":"Analytics", "Помощь менеджерам":"Manager Help", "Доступы":"Access", "Ещё":"More", "Еще":"More", "Поиск по CRM...":"Search CRM...", "Моё агентство":"My agency",
    "Создать клиента":"Create client", "Сохранить клиента":"Save client", "Имя клиента":"Client name", "Телефон":"Phone", "Источник":"Source", "Статус":"Status", "Следующий контакт":"Next contact", "Ответственный менеджер":"Responsible manager", "Заметки менеджера":"Manager notes", "История работы с клиентом":"Client history", "Добавить комментарий в историю":"Add comment to history", "Помощь директора":"Director help", "Вопрос директору...":"Question to director...", "Помощь менеджеру":"Ask director", "Задать вопрос директору":"Ask director", "Ответ директора":"Director reply",
    "Новый Лид":"New Lead", "Первый контакт":"First Contact", "В работе":"In Progress", "Назначена встреча":"Meeting Set", "Проведена встреча":"Meeting Done", "Думает":"Thinking", "Задаток":"Deposit", "Сделка":"Deal", "Отказ":"Refusal", "Отложили":"Postponed",
    "Звонок":"Call", "Встреча":"Meeting", "Показ":"Showing", "Задача":"Task", "Дата следующего касания":"Next touch date", "Время":"Time", "Название":"Title", "Напомнить за":"Remind before", "Звук":"Sound", "Сохранить событие":"Save event", "Редактировать":"Edit", "Удалить":"Delete", "Открыть":"Open", "Закрыть":"Close", "Сохранить":"Save", "Отправить":"Send", "Добавить":"Add",
    "Добавить объект":"Add property", "Название объекта":"Property title", "Тип":"Type", "Район":"District", "Цена":"Price", "Площадь":"Area", "Этаж":"Floor", "Собственник":"Owner", "Телефон собственника":"Owner phone", "Описание":"Description", "Сохранить объект":"Save property", "Фото / видео объекта":"Property photo/video", "Добавить фото/видео":"Add photo/video", "Юридические параметры":"Legal parameters", "Право собственности":"Ownership right", "Переуступка":"Assignment", "Госпрограммы":"Government programs", "Отправить презентацию клиенту":"Send presentation to client", "Скачать PDF-презентацию":"Download PDF presentation",
    "Язык интерфейса":"Interface language", "Цветовая гамма CRM":"CRM color theme", "Каждый пользователь может выбрать оформление под себя.":"Each user can choose their own interface style.", "Роль для проверки CRM":"Role for CRM testing", "Выйти":"Sign out", "Русский":"Russian", "Українська":"Ukrainian", "English":"English"
  }
};
function tr(lang, text){ return (translations[lang] && translations[lang][text]) || text; }
const extraUk = {
  "Новая публикация":"Нова публікація", "Опубликовать":"Опублікувати", "Текст публикации...":"Текст публікації...", "Фото":"Фото", "Видео":"Відео", "Файл":"Файл", "Ссылка":"Посилання", "Вставьте ссылку":"Вставте посилання", "Открыть ссылку":"Відкрити посилання", "Редактировать публикацию":"Редагувати публікацію", "Сохранить изменения":"Зберегти зміни", "Написать комментарий...":"Написати коментар...", "Комментарий":"Коментар", "Связь с клиентом":"Зв'язок з клієнтом", "Позвонить":"Подзвонити", "Следующий этап":"Наступний етап", "Все":"Усі", "Все менеджеры":"Усі менеджери", "Фильтр по менеджеру":"Фільтр за менеджером", "Лиды":"Ліди", "Сделки":"Угоди", "События":"Події", "Звонки":"Дзвінки", "Встречи":"Зустрічі", "Показы":"Покази", "Задачи":"Завдання", "Конверсия":"Конверсія", "Воронка клиентов":"Воронка клієнтів", "Загрузка доступа...":"Завантаження доступу...", "Войти":"Увійти", "Пароль":"Пароль", "Вход в CRM Real Estate":"Вхід у CRM Real Estate", "Доступ закрыт администратором.":"Доступ закрито адміністратором.", "Открыть PDF-презентацию":"Відкрити PDF-презентацію", "Скопировать ссылку клиенту":"Скопіювати посилання клієнту", "Презентация для клиента":"Презентація для клієнта", "Создать агентство":"Створити агентство", "Открыть доступ пользователю":"Відкрити доступ користувачу", "Создать доступ":"Створити доступ", "Удалить пользователя":"Видалити користувача", "Удалить агентство":"Видалити агентство"
};
const extraEn = {
  "Новая публикация":"New post", "Опубликовать":"Publish", "Текст публикации...":"Post text...", "Фото":"Photo", "Видео":"Video", "Файл":"File", "Ссылка":"Link", "Вставьте ссылку":"Paste link", "Открыть ссылку":"Open link", "Редактировать публикацию":"Edit post", "Сохранить изменения":"Save changes", "Написать комментарий...":"Write a comment...", "Комментарий":"Comment", "Связь с клиентом":"Contact client", "Позвонить":"Call", "Следующий этап":"Next stage", "Все":"All", "Все менеджеры":"All managers", "Фильтр по менеджеру":"Manager filter", "Лиды":"Leads", "Сделки":"Deals", "События":"Events", "Звонки":"Calls", "Встречи":"Meetings", "Показы":"Showings", "Задачи":"Tasks", "Конверсия":"Conversion", "Воронка клиентов":"Client funnel", "Загрузка доступа...":"Loading access...", "Войти":"Sign in", "Пароль":"Password", "Вход в CRM Real Estate":"CRM Real Estate Login", "Доступ закрыт администратором.":"Access closed by administrator.", "Открыть PDF-презентацию":"Open PDF presentation", "Скопировать ссылку клиенту":"Copy client link", "Презентация для клиента":"Client presentation", "Создать агентство":"Create agency", "Открыть доступ пользователю":"Open user access", "Создать доступ":"Create access", "Удалить пользователя":"Delete user", "Удалить агентство":"Delete agency"
};
translations.uk = {...translations.uk, ...extraUk};
translations.en = {...translations.en, ...extraEn};

function themeStyle(themeId){
  const found = themeOptions.find(t => t.id === themeId) || themeOptions[0];
  return {
    ...found.vars,
    background: `linear-gradient(135deg, ${found.vars["--soft"] || "#f5f2ea"}, #ffffff)`
  };
}


const initialLeads = [
  {id:"L-1024", name:"Анна Коваленко", phone:"+380671234567", source:"Тик-Ток рабочий", status:"Новый Лид", notes:"Хочет видовую квартиру, рассрочку и реальные фото дома.", nextContact:"2026-05-24 19:30", manager:"Елена", history:["Клиент создан","Уточнен бюджет","Назначен звонок"]},
  {id:"L-1025", name:"Игорь Мельник", phone:"+48500111222", source:"Инстаграм личный", status:"Первый контакт", notes:"Сравнивает Одессу и Киев. Нужны цифры по аренде.", nextContact:"2026-05-25 11:00", manager:"Андрей", history:["Лид пришел из Instagram","Добавлена заметка"]},
  {id:"L-1026", name:"Марина Соколова", phone:"+971501112233", source:"Рекомендации клиентов", status:"Назначена встреча", notes:"VIP клиент. Только сильные объекты.", nextContact:"2026-05-27 12:00", manager:"Елена", history:["Клиент создан","Назначена встреча"]},
  {id:"L-1027", name:"Дмитрий Орлов", phone:"+380931234567", source:"Фейсбук рабочий", status:"В работе", notes:"Ищет офис в Аркадии до 90 000$.", nextContact:"2026-05-28 16:30", manager:"Андрей", history:["Клиент создан","Отправлена подборка"]}
];

const initialPosts = [
  {id:"N-1", author:"Администратор", date:"24.05.2026 10:30", text:"Обновили подборку по объектам у моря", kind:"Фото", file:"sea-view.jpg", likes:24, comments:["Принято","Добавила клиентам"]},
  {id:"N-2", author:"CRM", date:"24.05.2026 09:00", text:"Чек-лист по вторичке обновлен", kind:"Файл", file:"checklist.pdf", likes:12, comments:["Скачали"]}
];

const initialProperties = [
  {id:"P-301", title:"Видовая квартира у моря", type:"2-комнатные", district:"Аркадия", status:"Актуален", price:118000, area:72, floor:"12/24", owner:"Собственник Анна", ownerPhone:"+380671010101", description:"Новый ремонт, вид на море, паркинг, охрана.", media:["Фото: Вид на море"], hot:true, history:["Объект добавлен","Обновлена цена"]},
  {id:"P-302", title:"Таунхаус для семьи", type:"Таунхаус", district:"Киевский", status:"В работе", price:185000, area:145, floor:"2 этажа", owner:"Собственник Сергей", ownerPhone:"+380672020202", description:"Закрытая территория, 2 этажа, место под авто.", media:[], hot:false, history:["Объект добавлен"]}
];

const initialEvents = [
  {id:"EV-1", leadId:"L-1024", client:"Анна Коваленко", type:"Звонок", title:"Первичный звонок", date:"2026-05-24", time:"19:30", reminder:60},
  {id:"EV-2", leadId:"L-1026", client:"Марина Соколова", type:"Встреча", title:"VIP встреча", date:"2026-05-27", time:"12:00", reminder:120}
];

const initialHelp = [
  {id:"H-1", leadId:"L-1024", client:"Анна Коваленко", manager:"Елена", text:"Нужна помощь директора по цене и аргументации.", reply:"", status:"open"},
  {id:"H-2", leadId:"L-1026", client:"Марина Соколова", manager:"Елена", text:"Клиент VIP, нужен комментарий директора перед встречей.", reply:"Подключусь перед показом.", status:"answered"}
];

const initialManagers = [
  {id:"AG-1", name:"Елена", email:"manager1@agency.com", role:"Менеджер по продажам", access:true},
  {id:"AG-2", name:"Андрей", email:"manager2@agency.com", role:"Менеджер по продажам", access:true},
  {id:"DIR-1", name:"Директор", email:"director@agency.com", role:"Администратор директор", access:true}
];

function useStorage(key, fallback) {
  const [value, setValue] = useState(() => {
    try {
      const saved = localStorage.getItem(key);
      return saved ? JSON.parse(saved) : fallback;
    } catch {
      return fallback;
    }
  });
  const update = (next) => {
    setValue((prev) => {
      const value = typeof next === "function" ? next(prev) : next;
      localStorage.setItem(key, JSON.stringify(value));
      return value;
    });
  };
  return [value, update];
}

function money(value){ return "$" + Number(value || 0).toLocaleString(); }
function cn(...items){ return items.filter(Boolean).join(" "); }
function badge(text, tone=""){ return <span className={cn("badge", tone)}>{text}</span>; }

function playBeep(){
  try{
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.frequency.value = 980;
    gain.gain.value = 0.06;
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    setTimeout(()=>{osc.stop();ctx.close();}, 350);
  }catch{}
}

function playReminderSound(type="classic"){
  if (type === "none") return;
  try{
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const gain = ctx.createGain();
    gain.gain.value = 0.075;
    gain.connect(ctx.destination);
    const patterns = {
      classic:[980], soft:[660,880], double:[880,880,1040], bell:[1046,1318,1568], glass:[784,1174,1568],
      crystal:[1200,1600,2000], digital:[740,740,988,988], alarm:[880,660,880,660,880], iphone:[1046,1318], marimba:[523,659,784,1046]
    };
    const tones = patterns[type] || patterns.classic;
    tones.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      osc.type = type === "alarm" ? "square" : "sine";
      osc.frequency.value = freq;
      osc.connect(gain);
      const start = ctx.currentTime + i * 0.20;
      osc.start(start);
      osc.stop(start + 0.16);
    });
    setTimeout(()=>ctx.close(), Math.max(900, tones.length * 240));
  }catch{}
}

async function uploadToFirstAvailableBucket(bucketNames, path, file, options={}){
  let lastError = null;
  for (const bucket of bucketNames){
    const upload = await supabase.storage.from(bucket).upload(path, file, options);
    if (!upload.error) {
      const publicUrl = supabase.storage.from(bucket).getPublicUrl(path).data.publicUrl;
      return { bucket, publicUrl };
    }
    lastError = upload.error;
  }
  return { error: lastError };
}

function managerDisplayName(u){
  return u?.full_name || u?.name || u?.email || "Без имени";
}

function parseClientLineSmart(line){
  const raw = String(line || "").trim();
  if (!raw) return null;
  const parts = raw.includes(";") ? raw.split(";") : raw.includes("	") ? raw.split("	") : raw.includes(",") ? raw.split(",") : [raw];
  if (parts.length >= 2) {
    const first = String(parts[0] || "").trim();
    const second = String(parts[1] || "").trim();
    const firstHasPhone = /\+?\d[\d\s()\-]{6,}/.test(first);
    const secondHasPhone = /\+?\d[\d\s()\-]{6,}/.test(second);
    let name = firstHasPhone && !secondHasPhone ? second : first;
    let phone = secondHasPhone ? second : firstHasPhone ? first : second;
    return { name: name || "Без имени", phone: phone || "+380", source: String(parts[2] || sources[0]).trim(), notes: parts.slice(3).join(" ").trim() };
  }
  const phoneMatch = raw.match(/(\+?\d[\d\s()\-]{7,}\d)/);
  const phone = phoneMatch ? phoneMatch[1].replace(/\s+/g," ").trim() : "+380";
  const namePart = phoneMatch ? raw.slice(0, phoneMatch.index).trim() : raw.split(/\s+/).slice(0,3).join(" ");
  const notesPart = phoneMatch ? (raw.slice(phoneMatch.index + phoneMatch[0].length).trim()) : raw.split(/\s+/).slice(3).join(" ");
  return { name: namePart || "Без имени", phone, source: sources[0], notes: notesPart || raw };
}

function monthGrid(year, month) {
  const first = new Date(year, month, 1);
  const offset = (first.getDay() + 6) % 7;
  const start = new Date(year, month, 1 - offset);
  return Array.from({length:42}, (_,i) => {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    return {
      day:d.getDate(),
      current:d.getMonth() === month,
      iso:`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`
    };
  });
}

function Button({children, variant="primary", className="", ...props}) {
  return <button className={cn("btn", variant, className)} {...props}>{children}</button>;
}

function normalizeUrl(url="") {
  if (!url) return "";
  if (url.startsWith("http://") || url.startsWith("https://")) return url;
  return "https://" + url;
}

function Media({kind="Фото", name="", small=false, onOpen=null}) {
  const lowerKind = String(kind || "").toLowerCase();
  const hasFile = Boolean(name);
  const isUrl = typeof name === "string" && /^https?:\/\//i.test(name);

  if (!hasFile) {
    if (lowerKind.includes("текст")) return null;
    return <div className={cn("media", small && "small")}><div>{lowerKind.includes("видео") ? "▶" : lowerKind.includes("файл") ? "📄" : lowerKind.includes("ссылка") ? "🔗" : "📷"}</div><b>{kind}</b><span>предпросмотр</span></div>;
  }

  if (lowerKind.includes("ссылка") || (isUrl && !lowerKind.includes("фото") && !lowerKind.includes("видео") && !lowerKind.includes("файл"))) {
    const url = normalizeUrl(name);
    return <a className="link" href={url} target="_blank" rel="noopener noreferrer" onClick={(e)=>e.stopPropagation()}>
      🔗 Открыть ссылку
    </a>;
  }

  if (lowerKind.includes("фото") && isUrl) {
    return <div className={cn("media", small && "small")} onClick={()=>onOpen&&onOpen({kind:"Фото",name})} style={{cursor:"pointer"}}><img src={name} alt="Фото" style={{width:"100%",borderRadius:16}} /></div>;
  }

  if (lowerKind.includes("видео") && isUrl) {
    return <div className={cn("media", small && "small")} onClick={()=>onOpen&&onOpen({kind:"Видео",name})} style={{cursor:"pointer"}}>
      <video src={name} muted playsInline preload="metadata" style={{width:"100%",borderRadius:16,display:"block"}} />
      <div className="muted" style={{marginTop:8}}>▶ Нажми, чтобы открыть видео</div>
    </div>;
  }

  if (lowerKind.includes("файл") && isUrl) {
    return <a className="link" href={name} target="_blank" rel="noopener noreferrer" onClick={(e)=>e.stopPropagation()}>📄 Открыть файл</a>;
  }

  return <div className={cn("media", small && "small")}><div>{lowerKind.includes("видео") ? "▶" : lowerKind.includes("файл") ? "📄" : lowerKind.includes("ссылка") ? "🔗" : "📷"}</div><b>{name || kind}</b><span>предпросмотр</span></div>;
}


function Modal({children, onClose, wide=false}) {
  return <div className="modal" onMouseDown={onClose}><div className={cn("sheet", wide && "wide")} onMouseDown={(e)=>e.stopPropagation()}>{children}</div></div>;
}

function Field({label, children}) {
  return <label className="field"><span>{label}</span>{children}</label>;
}


function LoginScreen({onLogin}) {
  const [email,setEmail] = useState("");
  const [password,setPassword] = useState("");
  const [loading,setLoading] = useState(false);

  const signIn = async () => {
    if (!email.trim() || !password) {
      alert("Введи email и пароль");
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({email: email.trim(), password});
    setLoading(false);
    if (error) {
      alert("Ошибка входа: " + error.message);
      return;
    }
    onLogin && onLogin();
  };

  return <main className="screen" style={{minHeight:"100vh",display:"grid",placeItems:"center"}}>
    <div className="card" style={{maxWidth:460,width:"100%"}}>
      <div className="card dark"><h2>Вход в CRM Real Estate</h2><p>Войди по email и паролю, который выдал администратор тех отдела.</p></div>
      <input className="input" placeholder="Email" value={email} onChange={e=>setEmail(e.target.value)} />
      <input className="input" placeholder="Пароль" type="password" value={password} onChange={e=>setPassword(e.target.value)} onKeyDown={e=>{if(e.key==='Enter')signIn();}} />
      <Button className="full" onClick={signIn}>{loading ? "Входим..." : "Войти"}</Button>
      <p className="muted">Если доступ закрыт или email не найден в таблице users — CRM не откроется.</p>
    </div>
  </main>;
}

function Sidebar({page,setPage,role,lang}) {
  const canSeeHelp = role === "Администратор директор" || role === "Администратор тех отдел";
  const items = [["feed","Лента","⌂"],["clients","Канбан и клиенты","👥"],["calendar","Календарь","📅"],["properties","Вторичка","🏢"],["analytics","Аналитика","📊"],...(canSeeHelp ? [["help","Помощь менеджерам","🔔"]] : []),...(role === "Администратор тех отдел" ? [["access","Доступы","🔐"]] : []),["more","Ещё","☰"]];
  return <aside className="sidebar"><div className="logo"><div>♛</div><section><b>CRM Real Estate</b><span>Premium SaaS</span></section></div><div className="roleBox">{role}</div>{items.map(([id,label,icon])=><button key={id} onClick={()=>setPage(id)} className={cn("sideBtn", page===id && "active")}><span>{icon}</span>{tr(lang,label)}</button>)}</aside>;
}

function Top({page,setPage,agencyName,lang}) {
  const titles = {feed:"Лента новостей",clients:"Клиенты",calendar:"Календарь",properties:"Вторичка",analytics:"Аналитика",help:"Помощь менеджерам",access:"Доступы",more:"Еще"};
  return <div className="top"><div className="topLine"><div><p>♛ CRM Real Estate</p><h1>{tr(lang,titles[page])}</h1></div><button className="agencyTop" onClick={()=>setPage("more")}>{agencyName || tr(lang,"Моё агентство")}</button></div><div className="search">🔎 <input placeholder={tr(lang,"Поиск по CRM...")} /></div></div>;
}

function Bottom({page,setPage,lang}) {
  const items = [["feed","Лента","⌂"],["clients","Клиенты","👥"],["calendar","Календарь","📅"],["properties","Объекты","🏢"],["more","Ещё","☰"]];
  return <nav className="bottom">{items.map(([id,label,icon])=><button key={id} className={page===id ? "active" : ""} onClick={()=>setPage(id)}><span>{icon}</span>{tr(lang,label)}</button>)}</nav>;
}

function Feed({posts,setPosts,role,currentProfile}) {
  const isTech = role === "Администратор тех отдел";
  const [open,setOpen] = useState(false);
  const [draft,setDraft] = useState({text:"",kind:"Фото",file:""});
  const [fileObj,setFileObj] = useState(null);
  const [viewer,setViewer] = useState(null);
  const [editPost,setEditPost] = useState(null);
  const [commentText,setCommentText] = useState({});

  async function uploadToNewsMedia(newsId) {
    if (draft.kind === "Ссылка") {
      if (!draft.file.trim()) return null;
      const { data, error } = await supabase
        .from("news_media")
        .insert({news_id: Number(newsId), media_type: "Ссылка", media_url: null, file_name: null, link_url: normalizeUrl(draft.file.trim())})
        .select()
        .single();
      if (error) { alert("Ошибка сохранения ссылки: " + error.message); return null; }
      return data;
    }

    if (!fileObj) return null;
    const originalName = fileObj.name || "upload";
    const rawExt = originalName.includes(".") ? originalName.split(".").pop() : "file";
    const ext = rawExt.toLowerCase().replace(/[^a-z0-9]/g, "") || "file";
    const safeName = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
    const path = `${newsId}/${safeName}`;
    const detectedKind = fileObj.type?.startsWith("video") ? "Видео" : fileObj.type?.startsWith("image") ? "Фото" : draft.kind;

    const upload = await uploadToFirstAvailableBucket(["news-media","news_media","news-media-bucket"], path, fileObj, {
      upsert: true,
      contentType: fileObj.type || undefined
    });
    if (upload.error) { alert("Ошибка загрузки файла: " + upload.error.message); return null; }

    const publicUrl = upload.publicUrl;
    const { data, error } = await supabase
      .from("news_media")
      .insert({news_id: Number(newsId), media_type: detectedKind, media_url: publicUrl, file_name: originalName, link_url: null})
      .select()
      .single();

    if (error) { alert("Файл загрузился, но не записался в таблицу: " + error.message); return null; }
    return data;
  }

  const publish = async () => {
    if (!draft.text.trim() && !draft.file.trim() && !fileObj) return;

    const { data: news, error } = await supabase
      .from("news")
      .insert({
        title: draft.text ? draft.text.slice(0,80) : "Публикация",
        content: draft.text || "",
        likes_count: 0,
        comments_count: 0
      })
      .select()
      .single();

    if (error) { alert("Ошибка сохранения публикации: " + error.message); return; }

    const media = await uploadToNewsMedia(news.id);
    const mediaUrl = media?.link_url || media?.media_url || "";
    const kind = media?.media_type || (mediaUrl ? (fileObj?.type?.startsWith("video") ? "Видео" : draft.kind) : "Текст");

    setPosts(prev => [{
      id: String(news.id),
      author: "Администратор",
      date: news.created_at ? new Date(news.created_at).toLocaleString() : new Date().toLocaleString(),
      text: news.content || "",
      kind,
      file: mediaUrl,
      likes: 0,
      comments: []
    }, ...prev]);

    setDraft({text:"",kind:"Фото",file:""});
    setFileObj(null);
    setOpen(false);
  };

  const saveEdit = async () => {
    if (!editPost) return;
    const { error } = await supabase
      .from("news")
      .update({title: editPost.text ? editPost.text.slice(0,80) : "Публикация", content: editPost.text || ""})
      .eq("id", Number(editPost.id));
    if (error) { alert("Ошибка редактирования публикации: " + error.message); return; }
    setPosts(prev => prev.map(p => String(p.id) === String(editPost.id) ? {...p, text: editPost.text || ""} : p));
    setEditPost(null);
  };

  const deletePost = async (post) => {
    if (!isTech) return;
    if (!window.confirm("Удалить публикацию?")) return;
    await supabase.from("news_media").delete().eq("news_id", Number(post.id));
    await supabase.from("comments").delete().eq("news_id", Number(post.id));
    await supabase.from("comments").delete().eq("post_id", Number(post.id));
    await supabase.from("comments").delete().eq("entity_id", String(post.id));
    const { error } = await supabase.from("news").delete().eq("id", Number(post.id));
    if (error) { alert("Ошибка удаления публикации: " + error.message); return; }
    setPosts(prev => prev.filter(p => String(p.id) !== String(post.id)));
  };

  const toggleLike = async (post) => {
    const likes = Number(post.likes || 0) + 1;
    setPosts(prev => prev.map(p => String(p.id) === String(post.id) ? {...p, likes} : p));
    await supabase.from("news").update({likes_count: likes}).eq("id", Number(post.id));
  };

  async function insertComment(postId, text) {
    const variants = [
      {news_id: Number(postId), content: text, author_name: currentProfile?.full_name || currentProfile?.name || role || "CRM"},
      {news_id: Number(postId), text, author: currentProfile?.full_name || currentProfile?.name || role || "CRM"},
      {post_id: Number(postId), text, author: currentProfile?.full_name || currentProfile?.name || role || "CRM"},
      {entity_type: "news", entity_id: String(postId), content: text, author_name: currentProfile?.full_name || currentProfile?.name || role || "CRM"},
      {entity_type: "news", entity_id: String(postId), text, author: currentProfile?.full_name || currentProfile?.name || role || "CRM"}
    ];

    for (const payload of variants) {
      const { data, error } = await supabase.from("comments").insert(payload).select().single();
      if (!error) return data;
    }
    return null;
  }

  const addComment = async (post) => {
    const text = (commentText[post.id] || "").trim();
    if (!text) return;
    const saved = await insertComment(post.id, text);
    if (!saved) {
      alert("Комментарий не записался. В таблице comments нужны колонки news_id + content или news_id + text.");
      return;
    }
    setPosts(prev => prev.map(p => String(p.id) === String(post.id) ? {...p, comments:[...(p.comments || []), text]} : p));
    setCommentText(prev => ({...prev, [post.id]: ""}));
    await supabase.from("news").update({comments_count: (post.comments || []).length + 1}).eq("id", Number(post.id));
  };

  const renderPostMedia = (post) => {
    const file = post.file || "";
    if (!file) return null;

    const lowerKind = String(post.kind || "").toLowerCase();
    const looksLikeLink = /^https?:\/\//i.test(file) && !lowerKind.includes("фото") && !lowerKind.includes("видео") && !lowerKind.includes("файл");
    if (lowerKind.includes("ссылка") || looksLikeLink) {
      return <a
        className="link"
        href={normalizeUrl(file)}
        target="_blank"
        rel="noopener noreferrer"
        onClick={(e)=>e.stopPropagation()}
        style={{display:"inline-flex",marginTop:10}}
      >
        🔗 Открыть ссылку
      </a>;
    }

    return <Media kind={post.kind} name={file} onOpen={setViewer}/>;
  };

  return <main className="screen"><div className="feedList">
    <div className="card dark hero">
      <div><h2>Лента новостей</h2><p>Внутренняя соцсеть агентства: фото, видео, файлы, ссылки, лайки и комментарии.</p></div>
      {isTech && <Button onClick={()=>setOpen(true)}>+ Новая публикация</Button>}
    </div>

    {open && isTech && <div className="card composer">
      <div className="row"><h2>Новая публикация</h2><button className="icon" onClick={()=>setOpen(false)}>×</button></div>
      <textarea className="input" placeholder="Текст публикации..." value={draft.text} onChange={e=>setDraft({...draft,text:e.target.value})}/>
      <div className="grid4">{["Фото","Видео","Файл","Ссылка"].map(k=><Button key={k} variant={draft.kind===k ? "primary" : "soft"} onClick={()=>{setDraft({...draft,kind:k,file:""});setFileObj(null);}}>{k}</Button>)}</div>
      {draft.kind === "Ссылка" ? (
        <input className="input" placeholder="Вставьте ссылку" value={draft.file} onChange={e=>setDraft({...draft,file:e.target.value})}/>
      ) : (
        <input className="input" type="file" accept="image/*,video/*,.pdf,.doc,.docx,.xls,.xlsx" onChange={e=>setFileObj(e.target.files?.[0] || null)}/>
      )}
      {(draft.kind === "Ссылка" ? draft.file : fileObj?.name) && <Media kind={draft.kind} name={draft.kind === "Ссылка" ? draft.file : fileObj?.name || ""}/>}
      <Button className="full" onClick={publish}>Опубликовать</Button>
    </div>}

    {posts.map(post=><article className="card post" key={post.id}>
      <div className="postHead"><div>A</div><section><b>{post.author}</b><span>{post.date}</span></section></div>
      {post.text && <p>{post.text}</p>}
      {renderPostMedia(post)}

      <div className="actions">
        <button className="chip" onClick={()=>toggleLike(post)}>♡ {post.likes}</button>
        <span>💬 {(post.comments || []).length}</span>
        {isTech && <button className="chip" onClick={()=>setEditPost(post)}>✎ Редактировать</button>}
        {isTech && <button className="chip" onClick={()=>deletePost(post)}>🗑 Удалить</button>}
      </div>

      <div className="comments">
        {(post.comments || []).map((c,i)=><p key={i}><b>{typeof c === "string" ? "Комментарий" : (c.author_name || c.author || "Комментарий")}:</b> {typeof c === "string" ? c : (c.text || c.content || c.comment || "")} {typeof c !== "string" && c.created_at ? <span className="muted"> · {new Date(c.created_at).toLocaleString()}</span> : null}</p>)}
        <div className="row">
          <input className="input" placeholder="Написать комментарий..." value={commentText[post.id] || ""} onChange={e=>setCommentText({...commentText,[post.id]:e.target.value})}/>
          <Button variant="soft" onClick={()=>addComment(post)}>Отправить</Button>
        </div>
      </div>
    </article>)}

    {editPost && isTech && <Modal onClose={()=>setEditPost(null)} wide>
      <div className="row"><h2>Редактировать публикацию</h2><button className="icon" onClick={()=>setEditPost(null)}>×</button></div>
      <textarea className="input" value={editPost.text || ""} onChange={e=>setEditPost({...editPost,text:e.target.value})}/>
      <Button className="full" onClick={saveEdit}>Сохранить изменения</Button>
    </Modal>}

    {viewer && <Modal onClose={()=>setViewer(null)} wide>
      <div className="row"><h2>{viewer.kind}</h2><button className="icon" onClick={()=>setViewer(null)}>×</button></div>
      {String(viewer.kind).toLowerCase().includes("фото") && <img src={viewer.name} alt="Фото" style={{width:"100%",borderRadius:20}} />}
      {String(viewer.kind).toLowerCase().includes("видео") && <video src={viewer.name} controls autoPlay style={{width:"100%",borderRadius:20}} />}
    </Modal>}
  </div></main>;
}



function Clients({leads,setLeads,onOpen,currentProfile,role,users}) {
  const [stage,setStage] = useState("Все");
  const [phone,setPhone] = useState(null);
  const [managerFilter,setManagerFilter] = useState("Все");
  const isManager = role === "Менеджер по продажам";
  const canFilterManagers = role === "Администратор тех отдел" || role === "Администратор директор";
  const managerUsers = (users || []).filter(u => String(u.role || "").includes("Менеджер"));
  const managerOptions = managerUsers.map(u => ({name: managerDisplayName(u), email: u.email || ""}));

  const create = () => {
    const managerName = currentProfile?.full_name || currentProfile?.name || "Ответственный менеджер";
    const managerEmail = currentProfile?.email || "";
    const lead = {
      id:"L-"+Date.now().toString().slice(-6),
      agency_id: currentProfile?.agency_id ? String(currentProfile.agency_id) : "",
      name:"",
      phone:"+380",
      source:sources[0],
      status:stages[0],
      notes:"",
      nextContact:"",
      manager: managerName,
      manager_email: managerEmail,
      history:[`Новый клиент. Ответственный: ${managerName}`]
    };
    onOpen(lead);
  };

  const filteredLeads = leads.filter(l => {
    const stageOk = stage === "Все" || l.status === stage;
    const managerOk = !canFilterManagers || managerFilter === "Все" || String(l.manager_email || "") === String(managerFilter) || String(l.manager || "") === String(managerFilter);
    return stageOk && managerOk;
  });

  const groups = stage === "Все" ? stages : [stage];

  const move = (lead, targetStage=null) => {
    const next = targetStage || stages[Math.min(stages.indexOf(lead.status)+1, stages.length-1)];
    setLeads(prev => prev.map(l => l.id===lead.id ? {...l,status:next,history:[...(l.history || []),`Перемещен в стадию: ${next}`]} : l));
  };

  return <main className="screen">
    <div className="row">
      <Button onClick={create}>+ Создать клиента</Button>
      <select className="input" style={{maxWidth:280}} value={stage} onChange={e=>setStage(e.target.value)}>
        <option>Все</option>
        {stages.map(s=><option key={s}>{s}</option>)}
      </select>
      {canFilterManagers && <select className="input" style={{maxWidth:320}} value={managerFilter} onChange={e=>setManagerFilter(e.target.value)}>
        <option value="Все">Все менеджеры</option>
        {managerOptions.map(m=><option key={m.email || m.name} value={m.email || m.name}>{m.name}{m.email ? ` — ${m.email}` : ""}</option>)}
      </select>}
    </div>

    <div className="kanban" style={{overflowX:"auto", alignItems:"flex-start", paddingBottom:12}}>
      {groups.map(s=>{
        const list = filteredLeads.filter(l => l.status === s);
        return <section className="kanbanCol" key={s} style={{minWidth:300, maxWidth:360, flex:"0 0 330px"}}
          onDragOver={e=>e.preventDefault()}
          onDrop={e=>{
            const id = e.dataTransfer.getData("leadId");
            const lead = leads.find(l=>String(l.id)===String(id));
            if (lead) move(lead, s);
          }}>
          <div className="kanbanHead"><b>{s}</b>{badge(list.length,"gold")}</div>
          {list.map(l=><div className="lead" key={l.id} draggable onDragStart={e=>e.dataTransfer.setData("leadId", l.id)}>
            <div className="leadTop"><section><b>{l.name || "Без имени"}</b><span>{l.id} · {l.source}</span></section>{badge(l.status,"dark")}</div>
            <div className="phone"><b>☎ {l.phone}</b><p>{l.notes || "Без заметки"}</p><p className="muted">Ответственный: {l.manager || "не назначен"}</p></div>
            <div className="grid4">
              <Button variant="soft" onClick={()=>setPhone(l.phone)}>☎</Button>
              <Button variant="purple" onClick={()=>setPhone(l.phone)}>V</Button>
              <Button variant="green" onClick={()=>setPhone(l.phone)}>W</Button>
              <Button onClick={()=>onOpen(l)}>✎</Button>
            </div>
            <Button className="full" onClick={()=>move(l)}>Следующий этап →</Button>
          </div>)}
        </section>
      })}
    </div>

    {phone && <Contact phone={phone} onClose={()=>setPhone(null)}/>} 
  </main>;
}


function Contact({phone,onClose}) {
  const digits = String(phone || "").replace(/[^0-9]/g,"");
  const plusPhone = "+" + digits;
  const viberEncoded = encodeURIComponent(plusPhone);
  return <Modal onClose={onClose}>
    <div className="row"><h2>Связь с клиентом</h2><button className="icon" onClick={onClose}>×</button></div>
    <a className="btn primary full" href={`tel:${plusPhone}`}>Позвонить</a>
    <a className="btn soft full" href={`sms:${plusPhone}`}>SMS</a>
    <a className="btn purple full" href={`viber://chat?number=${viberEncoded}`}>Viber чат</a>
    <a className="btn purple full" href={`viber://add?number=${digits}`}>Viber открыть контакт</a>
    <a className="btn green full" href={`https://wa.me/${digits}`} target="_blank" rel="noopener noreferrer">WhatsApp</a>
    <div className="card amber">Если Viber на компьютере не открылся, проверь Viber Desktop. На телефоне ссылка откроет приложение.</div>
  </Modal>;
}



function LeadModal({lead,setLeads,setEvents,setHelp,help,onClose,role,users,currentProfile}) {
  const [local,setLocal] = useState(lead);
  const [event,setEvent] = useState({type:"Звонок", date:"2026-05-24", time:"12:00", title:"", reminder:60, sound:"classic"});
  const [question,setQuestion] = useState("");
  const [workComment,setWorkComment] = useState("");
  const isTech = role === "Администратор тех отдел";
  const managerUsers = (users || []).filter(u => String(u.role || "").includes("Менеджер"));
  const managerOptions = managerUsers.length
    ? managerUsers.map(u => ({name: u.full_name || u.name || u.email, email: u.email || ""}))
    : [{name: local.manager || currentProfile?.full_name || "Ответственный менеджер", email: local.manager_email || currentProfile?.email || ""}];
  const changeManager = (email) => {
    const selected = managerOptions.find(m => m.email === email) || managerOptions[0];
    setLocal(prev => ({
      ...prev,
      manager: selected?.name || "",
      manager_email: selected?.email || "",
      history:[...(prev.history || []), `Ответственный менеджер изменён: ${selected?.name || ""}`]
    }));
  };

  const save = () => {
    const savedLocal = {...local, history:[...(local.history || []), `Сохранены изменения: ${new Date().toLocaleString()}`]};
    setLeads(prev=>{
      const exists = prev.some(l=>String(l.id)===String(local.id));
      return exists ? prev.map(l=>String(l.id)===String(local.id)?savedLocal:l) : [savedLocal, ...prev];
    });
    onClose();
  };

  const addWorkComment = () => {
    const text = workComment.trim();
    if (!text) return;

    const record = `Комментарий менеджера ${new Date().toLocaleString()}: ${text}`;
    setLocal(prev => ({...prev, history:[...(prev.history || []), record]}));
    setLeads(prev => prev.map(l => l.id === local.id ? {...l, history:[...(l.history || []), record]} : l));
    setWorkComment("");
  };

  const addEvent = () => {
    setEvents(prev=>[{id:"EV-"+Date.now(),leadId:local.id,client:local.name,type:event.type,title:event.title || `${event.type} — ${local.name}`,date:event.date,time:event.time,reminder:Number(event.reminder)||60,sound:event.sound||"classic",manager: currentProfile?.full_name || currentProfile?.name || local.manager || "",manager_email: currentProfile?.email || local.manager_email || "",notified:false},...prev]);
    setLocal({...local,nextContact:`${event.date} ${event.time}`,history:[...(local.history || []),`Добавлено событие: ${event.type}`]});
  };

  const ask = async () => {
    const q = question.trim();
    if(!q) return;
    const request = {
      id:"H-"+Date.now(),
      agency_id: currentProfile?.agency_id || local.agency_id || null,
      leadId:local.id,
      lead_id:String(local.id),
      client:local.name,
      manager:local.manager || currentProfile?.full_name || currentProfile?.name || "Менеджер",
      manager_email: currentProfile?.email || local.manager_email || "",
      question:q,
      text:q,
      reply:"",
      status:"open",
      created_at:new Date().toISOString()
    };
    const { data, error } = await supabase.from("manager_help_requests").insert({
      agency_id: request.agency_id,
      lead_id: request.lead_id,
      client: request.client,
      manager: request.manager,
      manager_email: request.manager_email,
      question: q,
      reply: "",
      status: "open"
    }).select().single();
    if (error) {
      alert("Вопрос добавлен локально, но не записался в Supabase: " + error.message);
      setHelp(prev=>[request,...prev]);
    } else {
      setHelp(prev=>[{...request, id:String(data.id), created_at:data.created_at},...prev]);
    }
    setLocal(prev => ({...prev, history:[...(prev.history || []), `Вопрос директору: ${q}`]}));
    setLeads(prev => prev.map(l => l.id === local.id ? {...l, history:[...(l.history || []), `Вопрос директору: ${q}`]} : l));
    playBeep();
    setQuestion("");
  };

  return <Modal onClose={onClose} wide>
    <div className="row"><section><label>Имя клиента</label><input className="titleInput" value={local.name} onChange={e=>setLocal({...local,name:e.target.value})}/><p className="muted">{local.id}</p></section><button className="icon" onClick={onClose}>×</button></div>

    <div className="formGrid">
      <Field label="Телефон"><input value={local.phone} onChange={e=>setLocal({...local,phone:e.target.value})}/></Field>
      <Field label="Источник"><select value={local.source} onChange={e=>setLocal({...local,source:e.target.value})}>{sources.map(s=><option key={s}>{s}</option>)}</select></Field>
      <Field label="Статус"><select value={local.status} onChange={e=>setLocal({...local,status:e.target.value})}>{stages.map(s=><option key={s}>{s}</option>)}</select></Field>
      <Field label="Следующий контакт"><input value={local.nextContact} onChange={e=>setLocal({...local,nextContact:e.target.value})}/></Field>
      <Field label="Ответственный менеджер">
        {isTech ? <select value={local.manager_email || ""} onChange={e=>changeManager(e.target.value)}>
          <option value="">Выбери менеджера</option>
          {managerOptions.map(m=><option key={m.email || m.name} value={m.email}>{m.name} {m.email ? `— ${m.email}` : ""}</option>)}
        </select> : <input value={local.manager || ""} disabled />}
      </Field>
    </div>

    <Field label="Заметки менеджера"><textarea value={local.notes} onChange={e=>setLocal({...local,notes:e.target.value})}/></Field>

    <div className="card">
      <h3>История работы с клиентом</h3>
      <textarea className="input" placeholder="Написать комментарий себе по клиенту..." value={workComment} onChange={e=>setWorkComment(e.target.value)}/>
      <Button className="full" onClick={addWorkComment}>Добавить комментарий в историю</Button>
      {(local.history || []).map((h,i)=><p className="muted" key={i}>• {h}</p>)}
    </div>

    <div className="card inner">
      <h3>Календарь клиента</h3>
      <div className="grid4">{eventTypes.map(t=><Button key={t} variant={event.type===t?"primary":"soft"} onClick={()=>setEvent({...event,type:t})}>{t}</Button>)}</div>
      <div className="grid3"><Field label="Дата следующего касания"><input className="input" type="date" value={event.date} onChange={e=>setEvent({...event,date:e.target.value})}/></Field><Field label="Время"><input className="input" type="time" value={event.time} onChange={e=>setEvent({...event,time:e.target.value})}/></Field><Field label="Название"><input className="input" placeholder="Название" value={event.title} onChange={e=>setEvent({...event,title:e.target.value})}/></Field></div>
      <div className="grid2"><Field label="Напомнить за"><select className="input" value={event.reminder} onChange={e=>setEvent({...event,reminder:e.target.value})}><option value="5">5 минут</option><option value="15">15 минут</option><option value="30">30 минут</option><option value="60">1 час</option><option value="120">2 часа</option><option value="1440">1 день</option></select></Field><Field label="Звук"><select className="input" value={event.sound} onChange={e=>setEvent({...event,sound:e.target.value})}>{soundOptions.map(o=><option key={o.id} value={o.id}>{o.label}</option>)}</select></Field></div>
      <Button className="full" onClick={addEvent}>Сохранить событие</Button>
    </div>

    <div className="card amber">
      <h3>Вопрос директору</h3>
      <textarea className="input" placeholder="Напиши вопрос директору по этому клиенту..." value={question} onChange={e=>setQuestion(e.target.value)}/>
      <Button className="full" onClick={ask}>Задать вопрос директору</Button>
      <div style={{marginTop:12}}>
        {(help || []).filter(h => String(h.leadId || h.lead_id) === String(local.id)).length === 0 && <p className="muted">По этому клиенту пока нет вопросов директору.</p>}
        {(help || []).filter(h => String(h.leadId || h.lead_id) === String(local.id)).map(h => <div className="card" key={h.id} style={{marginTop:10}}>
          <p><b>Вопрос:</b> {h.question || h.text}</p>
          <p className="muted">Статус: {h.status === "answered" ? "Отвечено" : "Ожидает ответа"}</p>
          {h.reply ? <p><b>Ответ директора:</b> {h.reply}</p> : <p className="muted">Ответ директора ещё не добавлен.</p>}
        </div>)}
      </div>
    </div>

    <Button className="full sticky" onClick={save}>Сохранить клиента</Button>
  </Modal>;
}

function Calendar({events,setEvents,leads,setLeads,onOpenLead,currentProfile,role}) {
  const [view,setView] = useState("month");
  const now = new Date();
  const [year,setYear] = useState(now.getFullYear());
  const [month,setMonth] = useState(now.getMonth());
  const [open,setOpen] = useState(null);
  const [selectedLead,setSelectedLead] = useState(null);
  const days = monthGrid(year,month);
  const monthKey = `${year}-${String(month+1).padStart(2,"0")}`;

  const saveEvent = () => {
    const lead = leads.find(l=>String(l.id)===String(open.leadId)) || leads[0];
    const ev = {
      ...open,
      id: open.id || "EV-"+Date.now(),
      client: lead?.name || "",
      title: open.title || `${open.type} — ${lead?.name || "клиент"}`,
      manager: open.manager || currentProfile?.full_name || currentProfile?.name || lead?.manager || "",
      manager_email: open.manager_email || currentProfile?.email || lead?.manager_email || ""
    };
    setEvents(prev => open.id ? prev.map(e=>e.id===open.id?ev:e) : [ev,...prev]);
    setOpen(null);
  };

  const create = (date, time="12:00") => setOpen({leadId:leads[0]?.id || "",type:"Звонок",title:"",date,time,reminder:60,sound:"classic",manager: currentProfile?.full_name || currentProfile?.name || "",manager_email: currentProfile?.email || "",notified:false});

  const selectedEventLead = open ? leads.find(l=>String(l.id)===String(open.leadId)) : null;
  const canEditOpenEvent = open && (role === "Администратор тех отдел" || role === "Администратор директор" || String(open.manager_email || "") === String(currentProfile?.email || ""));
  const deleteOpenEvent = () => { if (!open || !canEditOpenEvent) return; if (!window.confirm("Удалить событие?")) return; setEvents(prev => prev.filter(e => String(e.id) !== String(open.id))); setOpen(null); };

  const weekDays = days.slice(0,7);
  const dayIso = `${year}-${String(month+1).padStart(2,"0")}-${String(now.getDate()).padStart(2,"0")}`;

  useEffect(() => {
    const timer = setInterval(() => {
      const current = Date.now();
      events.forEach(ev => {
        if (!ev.date || !ev.time || ev.notified) return;
        const start = new Date(`${ev.date}T${ev.time}:00`).getTime();
        const remindMs = (Number(ev.reminder) || 60) * 60 * 1000;
        if (current >= start - remindMs && current <= start + 60 * 1000) {
          playReminderSound(ev.sound || "classic");
          alert(`Напоминание: ${ev.title || ev.type}
Дата следующего касания: ${ev.date} ${ev.time}`);
          setEvents(prev => prev.map(x => x.id === ev.id ? {...x, notified:true} : x));
        }
      });
    }, 30000);
    return () => clearInterval(timer);
  }, [events]);

  return <main className="screen" style={{maxWidth:"100%"}}>
    <div className="card dark">
      <div className="row">
        <section>
          <h2>Календарь</h2>
          <p>Встречи, звонки, показы и задачи по клиентам. Визуально приближено к календарю iPhone.</p>
        </section>
        <Button variant="soft" onClick={()=>playReminderSound("classic")}>Проверить звук</Button>
      </div>
    </div>

    <div className="card">
      <div className="row">
        <div className="grid2" style={{maxWidth:520}}>
          <select className="input" value={year} onChange={e=>setYear(Number(e.target.value))}>{Array.from({length:10},(_,i)=>new Date().getFullYear()-1+i).map(y=><option key={y}>{y}</option>)}</select>
          <select className="input" value={month} onChange={e=>setMonth(Number(e.target.value))}>{months.map((m,i)=><option key={m} value={i}>{m}</option>)}</select>
        </div>
        <div className="grid4" style={{maxWidth:560}}>{[["year","Год"],["month","Месяц"],["week","Неделя"],["day","День"]].map(([id,label])=><Button key={id} variant={view===id?"primary":"soft"} onClick={()=>setView(id)}>{label}</Button>)}</div>
      </div>
    </div>

    {view==="year" && <div className="card">
      <h3>{year} год</h3>
      <div className="yearGrid">{months.map((m,i)=><button className="monthBox" key={m} onClick={()=>{setMonth(i);setView("month")}}><b>{m}</b><span>{events.filter(e=>String(e.date || "").startsWith(`${year}-${String(i+1).padStart(2,"0")}`)).length} событий</span></button>)}</div>
    </div>}

    {view==="month" && <div className="card">
      <div className="row"><h3>{months[month]} {year}</h3>{badge(events.filter(e=>String(e.date || "").startsWith(monthKey)).length+" событий","gold")}</div>
      <div className="week">{week.map(w=><b key={w}>{w}</b>)}</div>
      <div className="calgrid">{days.map(d=>{
        const evs=events.filter(e=>e.date===d.iso);
        return <button key={d.iso} className={cn("day",!d.current&&"mutedDay")} onClick={()=>create(d.iso)}>
          <b>{d.day}</b>
          {evs.slice(0,3).map(e=><span className="mini" key={e.id}>{e.time} {e.title}</span>)}
        </button>
      })}</div>
    </div>}

    {view==="week" && <div className="card">
      <h3>Неделя</h3>
      <div className="grid2">{weekDays.map(d=><button className="weekRow" key={d.iso} onClick={()=>create(d.iso)}><b>{d.iso}</b><span>{events.filter(e=>e.date===d.iso).length} событий</span></button>)}</div>
    </div>}

    {view==="day" && <div className="card">
      <h3>День · {dayIso}</h3>
      {["09:00","10:00","11:00","12:00","13:00","14:00","15:00","16:00","17:00","18:00"].map(t=>{
        const evs = events.filter(e=>e.date===dayIso && e.time===t);
        return <button className="weekRow" key={t} onClick={()=>create(dayIso,t)}><b>{t}</b><span>{evs.length ? evs.map(e=>e.title).join(", ") : "добавить событие"}</span></button>
      })}
    </div>}

    <div className="grid2">
      {events.filter(e=>!monthKey || String(e.date || "").startsWith(monthKey)).map(e=><div className="card event" key={e.id} onClick={()=>setOpen(e)}>
        <div className="row"><section><b>{e.title}</b><p className="muted"><b>Дата следующего касания:</b> {e.date} · {e.time}<br/>{e.type}</p></section>{badge(e.reminder+" мин","gold")}</div>
        <p className="muted">{e.client}</p>
      </div>)}
    </div>

    {open && <Modal onClose={()=>setOpen(null)} wide>
      <div className="row"><h2>Событие</h2><button className="icon" onClick={()=>setOpen(null)}>×</button></div>
      <input className="input" placeholder="Название" value={open.title} onChange={e=>setOpen({...open,title:e.target.value})}/>
      <div className="grid4">{eventTypes.map(t=><Button key={t} variant={open.type===t?"primary":"soft"} onClick={()=>setOpen({...open,type:t})}>{t}</Button>)}</div>
      <Field label="Клиент">
        <select className="input" value={open.leadId} onChange={e=>setOpen({...open,leadId:e.target.value})}>
          {leads.map(l=><option key={l.id} value={l.id}>{l.name} · {l.phone} · {l.status}</option>)}
        </select>
      </Field>
      {selectedEventLead && <div className="card">
        <h3>{selectedEventLead.name}</h3>
        <p><b>Телефон:</b> {selectedEventLead.phone}</p>
        <p><b>Статус:</b> {selectedEventLead.status}</p>
        <p><b>Источник:</b> {selectedEventLead.source}</p>
        <p><b>Заметки:</b> {selectedEventLead.notes || "Нет заметок"}</p>
        <Button className="full" variant="primary" onClick={()=>onOpenLead && onOpenLead(selectedEventLead)}>ОТКРЫТЬ ПОЛНУЮ КАРТОЧКУ КЛИЕНТА</Button>
        {(selectedEventLead.history || []).slice(-5).map((h,i)=><p className="muted" key={i}>• {h}</p>)}
      </div>}
      <div className="grid2"><Field label="Дата следующего касания"><input className="input" type="date" value={open.date} onChange={e=>setOpen({...open,date:e.target.value})}/></Field><Field label="Время"><input className="input" type="time" value={open.time} onChange={e=>setOpen({...open,time:e.target.value})}/></Field></div>
      <div className="grid2"><Field label="Напомнить за"><select className="input" value={open.reminder || 60} onChange={e=>setOpen({...open,reminder:Number(e.target.value)})}><option value="5">5 минут</option><option value="15">15 минут</option><option value="30">30 минут</option><option value="60">1 час</option><option value="120">2 часа</option><option value="1440">1 день</option></select></Field><Field label="Звук напоминания"><select className="input" value={open.sound || "classic"} onChange={e=>setOpen({...open,sound:e.target.value})}>{soundOptions.map(o=><option key={o.id} value={o.id}>{o.label}</option>)}</select></Field></div>
      <div className="grid2"><Button className="full" onClick={saveEvent} disabled={!canEditOpenEvent}>Сохранить событие</Button>{canEditOpenEvent && open.id && <Button className="full" variant="danger" onClick={deleteOpenEvent}>Удалить событие</Button>}</div>
    </Modal>}
  </main>;
}


function Properties({properties,setProperties,onOpen,users,currentProfile}) {
  const [type,setType] = useState("Все");
  const [district,setDistrict] = useState("Все");

  const filtered = properties.filter(p =>
    (type === "Все" || p.type === type) &&
    (district === "Все" || p.district === district)
  );

  const create = () => {
    const p = {
      id: "P-" + Date.now(),
      title: "",
      property_manager_name: currentProfile?.full_name || currentProfile?.name || "",
      property_manager_email: currentProfile?.email || "",
      property_manager_phone: currentProfile?.phone || "",
      type: types[0],
      district: districts[0],
      status: "Актуален",
      price: "",
      area: "",
      floor: "",
      owner: "",
      ownerPhone: "+380",
      description: "",
      media: [],
      history: [],
      ownership_right:false,
      assignment:false,
      government_programs:false
    };

    onOpen(p);
  };

  return <main className="screen">
    <Button onClick={create}>+ Добавить объект</Button>

    <div className="chips">
      {["Все", ...types].map(t =>
        <button key={t} className={cn("chip", type===t && "active")} onClick={()=>setType(t)}>{t}</button>
      )}
    </div>

    <div className="chips">
      {["Все", ...districts].map(d =>
        <button key={d} className={cn("chip", district===d && "active")} onClick={()=>setDistrict(d)}>{d}</button>
      )}
    </div>

    <div className="grid2">
      {filtered.map(p => {
        const firstMedia = (p.media || [])[0];

        return <div className="card" key={p.id} onClick={()=>onOpen(p)}>
          {firstMedia ? <Media kind={firstMedia.kind} name={firstMedia.url} small /> : <Media kind="Фото" name="" small />}
          <h3>{p.title || "Без названия"}</h3>
          <p>{p.type} · {p.district}</p>
          <p><b>{money(p.price)}</b> · {p.area || 0} м²</p>
          <span className="badge">{(p.media || []).length} медиа</span><p className="muted">Ответственный: {p.property_manager_name || p.manager || "не назначен"}</p>
        </div>;
      })}
    </div>
  </main>;
}

function PropertyModal({property,setProperties,onClose,users,currentProfile,role,lang}) {
  const [local,setLocal] = useState(property);
  const [mediaKind,setMediaKind] = useState("Фото");
  const [mediaFile,setMediaFile] = useState(null);
  const [mediaFiles,setMediaFiles] = useState([]);
  const [viewer,setViewer] = useState(null);
  const [presentationUrl,setPresentationUrl] = useState("");
  const isTech = role === "Администратор тех отдел";
  const managerUsers = (users || []).filter(u => String(u.role || "").includes("Менеджер"));
  const propertyManager = managerUsers.find(u => String(u.email || "") === String(local.property_manager_email || "")) || null;
  const canEditProperty = role === "Администратор тех отдел" || role === "Администратор директор" || role === "Менеджер по продажам";
  const canDeleteProperty = isTech;

  const payloadFromLocal = () => ({
    title: local.title || "Новый объект",
    property_type: local.type || types[0],
    district: local.district || districts[0],
    status: local.status || "Актуален",
    price: Number(local.price) || 0,
    area: Number(local.area) || 0,
    floor: parseInt(local.floor) || null,
    owner_name: local.owner || "",
    owner_phone: local.ownerPhone || "",
    description: local.description || "",
    property_manager_name: local.property_manager_name || local.manager || "",
    property_manager_email: local.property_manager_email || "",
    property_manager_phone: local.property_manager_phone || "",
    olx_status: local.olx_status || null,
    ownership_right: !!local.ownership_right,
    assignment: !!local.assignment,
    government_programs: !!local.government_programs
  });

  async function saveObject(closeAfter = false) {
    const payload = payloadFromLocal();
    const isNew = String(local.id || "").startsWith("P-") || !Number(local.id);
    let savedId = Number(local.id);

    if (isNew) {
      const { data, error } = await supabase
        .from("properties")
        .insert(payload)
        .select()
        .single();

      if (error) {
        alert("Ошибка создания объекта: " + error.message);
        return null;
      }

      savedId = data.id;
    } else {
      const { error } = await supabase
        .from("properties")
        .update(payload)
        .eq("id", savedId);

      if (error) {
        alert("Ошибка сохранения объекта: " + error.message);
        return null;
      }
    }

    const saved = {
      ...local,
      id: String(savedId),
      media: local.media || [],
      property_manager_name: local.property_manager_name || local.manager || "",
      property_manager_email: local.property_manager_email || "",
      property_manager_phone: local.property_manager_phone || "",
      olx_status: local.olx_status || null
    };

    setLocal(saved);

    setProperties(prev => {
      const exists = prev.some(p => String(p.id) === String(local.id) || String(p.id) === String(savedId));
      if (!exists) return [saved, ...prev];

      return prev.map(p =>
        String(p.id) === String(local.id) || String(p.id) === String(savedId)
          ? saved
          : p
      );
    });

    if (closeAfter) onClose();
    return savedId;
  }

  const save = async () => {
    const id = await saveObject(false);
    if (id) alert("Объект сохранён");
  };

  async function addMedia() {
    if (!mediaFile) {
      alert("Сначала выбери фото или видео");
      return;
    }

    const propertyId = await saveObject(false);
    if (!propertyId) return;

    const detectedKind = mediaFile.type?.startsWith("video") ? "Видео" : mediaKind;

    const originalName = mediaFile.name || "upload";
    const rawExt = originalName.includes(".") ? originalName.split(".").pop() : "file";
    const ext = rawExt.toLowerCase().replace(/[^a-z0-9]/g, "") || "file";
    const safeName = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
    const path = `${propertyId}/${safeName}`;

    const { error: uploadError } = await supabase
      .storage
      .from("property-media")
      .upload(path, mediaFile, {
        upsert: true,
        contentType: mediaFile.type || undefined
      });

    if (uploadError) {
      alert("Ошибка загрузки файла: " + uploadError.message);
      return;
    }

    const publicUrl = supabase
      .storage
      .from("property-media")
      .getPublicUrl(path).data.publicUrl;

    const { data, error } = await supabase
      .from("property_media")
      .insert({
        property_id: propertyId,
        media_type: detectedKind,
        media_url: publicUrl,
        file_name: originalName
      })
      .select()
      .single();

    if (error) {
      alert("Файл загрузился, но не записался в таблицу: " + error.message);
      return;
    }

    const item = {
      kind: data.media_type || detectedKind,
      url: data.media_url || publicUrl,
      name: data.file_name || originalName
    };

    const updated = {
      ...local,
      id: String(propertyId),
      media: [...(local.media || []), item]
    };

    setLocal(updated);

    setProperties(prev => {
      const exists = prev.some(p => String(p.id) === String(propertyId));
      if (!exists) return [updated, ...prev];

      return prev.map(p =>
        String(p.id) === String(propertyId)
          ? { ...p, ...updated }
          : p
      );
    });

    setMediaFile(null);
    alert("Фото/видео сохранено");
  }

  async function addMediaBatch() {
    const files = mediaFiles.length ? mediaFiles : (mediaFile ? [mediaFile] : []);
    if (!files.length) { alert("Сначала выбери фото или видео"); return; }
    for (const f of files) {
      setMediaFile(f);
      // inline upload per file
      const propertyId = await saveObject(false);
      if (!propertyId) return;
      const detectedKind = f.type?.startsWith("video") ? "Видео" : mediaKind;
      const originalName = f.name || "upload";
      const rawExt = originalName.includes(".") ? originalName.split(".").pop() : "file";
      const ext = rawExt.toLowerCase().replace(/[^a-z0-9]/g, "") || "file";
      const safeName = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
      const path = `${propertyId}/${safeName}`;
      const { error: uploadError } = await supabase.storage.from("property-media").upload(path, f, {upsert:true, contentType:f.type || undefined});
      if (uploadError) { alert("Ошибка загрузки файла: " + uploadError.message); return; }
      const publicUrl = supabase.storage.from("property-media").getPublicUrl(path).data.publicUrl;
      const { data, error } = await supabase.from("property_media").insert({property_id: propertyId, media_type: detectedKind, media_url: publicUrl, file_name: originalName}).select().single();
      if (error) { alert("Файл загрузился, но не записался в таблицу: " + error.message); return; }
      const item = {kind:data.media_type || detectedKind, url:data.media_url || publicUrl, name:data.file_name || originalName};
      setLocal(prev => ({...prev, id:String(propertyId), media:[...(prev.media || []), item]}));
      setProperties(prev => prev.map(p => String(p.id) === String(propertyId) ? {...p, media:[...(p.media || []), item]} : p));
    }
    setMediaFile(null); setMediaFiles([]); alert("Фото/видео сохранены");
  }

  const mediaList = local.media || [];
  const currentMedia = viewer !== null ? mediaList[viewer] : null;

  const nextMedia = () => {
    setViewer(i => (i + 1) % mediaList.length);
  };

  const prevMedia = () => {
    setViewer(i => (i - 1 + mediaList.length) % mediaList.length);
  };

  function drawWrapped(ctx, text, x, y, maxWidth, lineHeight){
    const words = String(text || "").replace(/\n/g," \n ").split(" ");
    let line = "";
    let yy = y;
    for (const word of words){
      if (word === "\n"){
        ctx.fillText(line, x, yy);
        line = "";
        yy += lineHeight;
        continue;
      }
      const test = line ? line + " " + word : word;
      if (ctx.measureText(test).width > maxWidth && line){
        ctx.fillText(line, x, yy);
        line = word;
        yy += lineHeight;
      } else {
        line = test;
      }
    }
    if (line) ctx.fillText(line, x, yy);
    return yy + lineHeight;
  }

  function dataUrlToBytes(dataUrl){
    const base64 = dataUrl.split(",")[1];
    const bin = atob(base64);
    const bytes = new Uint8Array(bin.length);
    for(let i=0;i<bin.length;i++) bytes[i] = bin.charCodeAt(i);
    return bytes;
  }

  function buildPdfFromJpegs(pages){
    const enc = new TextEncoder();
    const chunks = [];
    const offsets = [0];
    let length = 0;
    const add = part => {
      const bytes = typeof part === "string" ? enc.encode(part) : part;
      chunks.push(bytes);
      length += bytes.length;
    };
    const obj = (id, body) => {
      offsets[id] = length;
      add(`${id} 0 obj\n`);
      add(body);
      add(`\nendobj\n`);
    };

    add("%PDF-1.4\n%CRM Presentation\n");
    const pageCount = pages.length;
    const pageIds = pages.map((_,i)=>3 + i*3);
    obj(1, "<< /Type /Catalog /Pages 2 0 R >>");
    obj(2, `<< /Type /Pages /Kids [${pageIds.map(id=>`${id} 0 R`).join(" ")}] /Count ${pageCount} >>`);

    pages.forEach((page, i) => {
      const pageId = 3 + i*3;
      const contentId = pageId + 1;
      const imageId = pageId + 2;
      const w = 595;
      const h = 842;
      const content = `q\n${w} 0 0 ${h} 0 0 cm\n/Im${i} Do\nQ`;
      obj(pageId, `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${w} ${h}] /Resources << /XObject << /Im${i} ${imageId} 0 R >> >> /Contents ${contentId} 0 R >>`);
      obj(contentId, `<< /Length ${content.length} >>\nstream\n${content}\nendstream`);
      offsets[imageId] = length;
      add(`${imageId} 0 obj\n`);
      add(`<< /Type /XObject /Subtype /Image /Width ${page.width} /Height ${page.height} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${page.bytes.length} >>\nstream\n`);
      add(page.bytes);
      add("\nendstream\nendobj\n");
    });

    const xrefAt = length;
    const maxObj = 2 + pageCount*3;
    add(`xref\n0 ${maxObj + 1}\n`);
    add("0000000000 65535 f \n");
    for(let i=1;i<=maxObj;i++) add(`${String(offsets[i] || 0).padStart(10,"0")} 00000 n \n`);
    add(`trailer\n<< /Size ${maxObj + 1} /Root 1 0 R >>\nstartxref\n${xrefAt}\n%%EOF`);
    return new Blob(chunks, {type:"application/pdf"});
  }

  async function generateClientPresentation(){
    if (presentationUrl) URL.revokeObjectURL(presentationUrl);
    const canvas = document.createElement("canvas");
    canvas.width = 1240;
    canvas.height = 1754;
    const ctx = canvas.getContext("2d");
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0,0,canvas.width,canvas.height);

    ctx.fillStyle = "#070707";
    ctx.fillRect(0,0,canvas.width,190);
    ctx.fillStyle = "#e1aa12";
    ctx.font = "bold 30px Arial";
    ctx.fillText("CRM Real Estate", 90, 70);
    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 54px Arial";
    drawWrapped(ctx, local.title || "Презентация объекта", 90, 145, 1060, 58);

    let y = 270;
    ctx.fillStyle = "#111827";
    ctx.font = "bold 38px Arial";
    ctx.fillText("Информация об объекте", 90, y);
    y += 60;

    const rows = [
      ["Тип", local.type || "—"],
      ["Район", local.district || "—"],
      ["Статус", local.status || "—"],
      ["Цена", money(local.price)],
      ["Площадь", `${local.area || 0} м²`],
      ["Этаж", local.floor || "—"]
    ];

    ctx.font = "28px Arial";
    rows.forEach(([label,value]) => {
      ctx.fillStyle = "#6b7280";
      ctx.fillText(label + ":", 90, y);
      ctx.fillStyle = "#111827";
      ctx.font = "bold 28px Arial";
      ctx.fillText(String(value), 350, y);
      ctx.font = "28px Arial";
      y += 48;
    });

    y += 35;
    ctx.fillStyle = "#111827";
    ctx.font = "bold 34px Arial";
    ctx.fillText("Описание", 90, y);
    y += 45;
    ctx.font = "26px Arial";
    ctx.fillStyle = "#374151";
    y = drawWrapped(ctx, local.description || "Описание объекта не добавлено.", 90, y, 1060, 38);

    y += 30;
    ctx.fillStyle = "#b45309";
    ctx.font = "bold 24px Arial";
    drawWrapped(ctx, "Документ сформирован без персональных данных: собственник, телефон собственника и ответственный менеджер не указаны.", 90, y, 1060, 34);

    const pages = [{bytes:dataUrlToBytes(canvas.toDataURL("image/jpeg", 0.92)), width:canvas.width, height:canvas.height}];

    const imageMedia = (local.media || []).filter(m => String(m.kind || "").includes("Фото") && m.url).slice(0, 4);
    for (const m of imageMedia){
      const img = new Image();
      img.crossOrigin = "anonymous";
      const loaded = await new Promise(resolve => {
        img.onload = () => resolve(true);
        img.onerror = () => resolve(false);
        img.src = m.url;
      });
      const c = document.createElement("canvas");
      c.width = 1240;
      c.height = 1754;
      const x = c.getContext("2d");
      x.fillStyle = "#ffffff";
      x.fillRect(0,0,c.width,c.height);
      x.fillStyle = "#070707";
      x.fillRect(0,0,c.width,130);
      x.fillStyle = "#ffffff";
      x.font = "bold 42px Arial";
      x.fillText(local.title || "Фото объекта", 90, 82);
      if (loaded){
        const maxW = 1060, maxH = 1300;
        const scale = Math.min(maxW/img.width, maxH/img.height);
        const dw = img.width * scale;
        const dh = img.height * scale;
        x.drawImage(img, (c.width-dw)/2, 250, dw, dh);
      } else {
        x.fillStyle = "#374151";
        x.font = "28px Arial";
        drawWrapped(x, "Фото не удалось встроить в PDF, но оно доступно в карточке объекта.", 90, 300, 1060, 40);
      }
      pages.push({bytes:dataUrlToBytes(c.toDataURL("image/jpeg", 0.92)), width:c.width, height:c.height});
    }

    const blob = buildPdfFromJpegs(pages);
    const propertyId = Number(local.id) || Date.now();
    const safeTitle = (local.title || "object").replace(/[^a-zA-Zа-яА-Я0-9_-]+/g,"_").slice(0,60);
    const path = `${propertyId}/${Date.now()}-${safeTitle}-presentation.pdf`;
    const uploaded = await uploadToFirstAvailableBucket(["presentations","property-presentations","property_media","property-media"], path, blob, {upsert:true, contentType:"application/pdf"});
    if (uploaded?.publicUrl) {
      setPresentationUrl(uploaded.publicUrl);
      alert("PDF-презентация создана. Рабочая ссылка появилась под кнопкой.");
    } else {
      const url = URL.createObjectURL(blob);
      setPresentationUrl(url);
      alert("PDF создан локально. Для ссылки клиенту создай в Supabase Storage bucket presentations и сделай его public. Сейчас доступно только скачивание на этом устройстве.");
    }
  }

  return <Modal onClose={onClose} wide>
    <div className="propHero">
      <button className="icon heroClose" onClick={onClose}>×</button>
      <h2>{local.title || "Новый объект"}</h2>
      <p>{local.type} · {local.district} · {money(local.price)}</p>
    </div>

    <div className="grid2">
      <Field label="Название объекта"><input className="input" value={local.title || ""} onChange={e=>setLocal({...local,title:e.target.value})}/></Field>
      <Field label="Тип"><select className="input" value={local.type || types[0]} onChange={e=>setLocal({...local,type:e.target.value})}>{types.map(t=><option key={t}>{t}</option>)}</select></Field>
      <Field label="Район"><select className="input" value={local.district || districts[0]} onChange={e=>setLocal({...local,district:e.target.value})}>{districts.map(d=><option key={d}>{d}</option>)}</select></Field>
      <Field label="Цена"><input className="input" value={local.price || ""} onChange={e=>setLocal({...local,price:e.target.value})}/></Field>
      <Field label="Площадь"><input className="input" value={local.area || ""} onChange={e=>setLocal({...local,area:e.target.value})}/></Field>
      <Field label="Этаж"><input className="input" value={local.floor || ""} onChange={e=>setLocal({...local,floor:e.target.value})}/></Field>
      <Field label="Собственник"><input className="input" value={local.owner || ""} onChange={e=>setLocal({...local,owner:e.target.value})}/></Field>
      <Field label="Телефон собственника"><input className="input" value={local.ownerPhone || ""} onChange={e=>setLocal({...local,ownerPhone:e.target.value})}/></Field>
      <Field label="Ответственный менеджер по объекту">{isTech ? <select className="input" value={local.property_manager_email || ""} onChange={e=>{const u=(users||[]).find(x=>String(x.email)===String(e.target.value)); setLocal({...local,property_manager_email:e.target.value,property_manager_name:managerDisplayName(u),property_manager_phone:u?.phone || ""})}}><option value="">Выбери менеджера</option>{managerUsers.map(u=><option key={u.email || u.id} value={u.email}>{managerDisplayName(u)} {u.phone ? `— ${u.phone}` : ""}</option>)}</select> : <input className="input" value={local.property_manager_name || "не назначен"} disabled />}</Field>
    </div>
    {(local.property_manager_phone || propertyManager?.phone) && <div className="card amber"><b>Связь с ответственным менеджером:</b><div className="grid3"><a className="btn primary" href={`tel:${local.property_manager_phone || propertyManager?.phone}`}>Позвонить</a><a className="btn purple" href={`viber://chat?number=${encodeURIComponent(local.property_manager_phone || propertyManager?.phone)}`}>Viber</a><a className="btn green" href={`https://wa.me/${String(local.property_manager_phone || propertyManager?.phone).replace(/[^0-9]/g,"")}`} target="_blank" rel="noopener noreferrer">WhatsApp</a></div></div>}

    <Field label="Описание"><textarea className="input" value={local.description || ""} onChange={e=>setLocal({...local,description:e.target.value})}/></Field>

    <div className="card"><h3>{tr(lang,"Юридические параметры")}</h3><div className="grid3"><label className="chip"><input type="checkbox" checked={!!local.ownership_right} onChange={e=>setLocal({...local,ownership_right:e.target.checked})}/> {tr(lang,"Право собственности")}</label><label className="chip"><input type="checkbox" checked={!!local.assignment} onChange={e=>setLocal({...local,assignment:e.target.checked})}/> {tr(lang,"Переуступка")}</label><label className="chip"><input type="checkbox" checked={!!local.government_programs} onChange={e=>setLocal({...local,government_programs:e.target.checked})}/> {tr(lang,"Госпрограммы")}</label></div></div>

    <div className="grid2"><Button className="full" onClick={save} disabled={!canEditProperty}>Сохранить объект</Button><Button className="full" variant="soft" onClick={()=>{setLocal({...local,olx_status:"pending"}); alert("Заявка на публикацию в OLX отправлена тех отделу");}}>Опубликовать в OLX</Button></div>{local.olx_status === "pending" && isTech && <Button className="full" onClick={()=>{setLocal({...local,olx_status:"approved"}); alert("Тех отдел подтвердил публикацию. Для реальной публикации нужен OLX API токен.");}}>Подтвердить публикацию OLX</Button>}
    {canDeleteProperty && <Button className="full" variant="danger" onClick={async()=>{ if(!window.confirm("Удалить объект?")) return; if(Number(local.id)){ await supabase.from("property_media").delete().eq("property_id", Number(local.id)); const {error}=await supabase.from("properties").delete().eq("id", Number(local.id)); if(error){alert("Ошибка удаления объекта: "+error.message);return;} } setProperties(prev=>prev.filter(p=>String(p.id)!==String(local.id))); onClose(); }}>Удалить объект</Button>}

    <div className="card amber">
      <h3>Презентация для клиента</h3>
      <p className="muted">PDF создаётся без персональных данных: без собственника, телефона собственника и ответственного менеджера.</p>
      <Button className="full" onClick={generateClientPresentation}>Отправить презентацию клиенту</Button>
      {presentationUrl && <div className="grid2" style={{marginTop:12}}>
        <a className="btn green full" href={presentationUrl} target="_blank" rel="noopener noreferrer">Открыть PDF-презентацию</a>
        <Button variant="soft" onClick={async()=>{try{await navigator.clipboard.writeText(presentationUrl); alert("Ссылка скопирована");}catch{alert("Ссылка создана, но браузер не дал скопировать автоматически");}}}>Скопировать ссылку клиенту</Button>
      </div>}
    </div>

    <div className="card">
      <h3>Фото / видео объекта</h3>

      <div className="grid4">
        <Button variant={mediaKind==="Фото" ? "primary" : "soft"} onClick={()=>setMediaKind("Фото")}>Фото</Button>
        <Button variant={mediaKind==="Видео" ? "primary" : "soft"} onClick={()=>setMediaKind("Видео")}>Видео</Button>
      </div>

      <input className="input" type="file" multiple accept="image/*,video/*" onChange={e=>{const files=Array.from(e.target.files || []); setMediaFiles(files); setMediaFile(files[0] || null);}}/>
      <Button className="full" onClick={addMediaBatch} disabled={!canEditProperty}>Добавить фото/видео</Button>

      <div className="grid2">
        {mediaList.map((m,i)=>
          <div key={i} onClick={()=>setViewer(i)} style={{cursor:"pointer"}}>
            <Media kind={m.kind} name={m.url} small />
          </div>
        )}
      </div>
    </div>

    {currentMedia && <Modal onClose={()=>setViewer(null)} wide>
      <div className="row">
        <button className="icon" onClick={prevMedia}>‹</button>
        <h2>{currentMedia.kind} {viewer + 1}/{mediaList.length}</h2>
        <button className="icon" onClick={nextMedia}>›</button>
        <button className="icon" onClick={()=>setViewer(null)}>×</button>
      </div>

      {currentMedia.kind === "Видео"
        ? <video src={currentMedia.url} controls autoPlay style={{width:"100%",borderRadius:20}} />
        : <img src={currentMedia.url} alt="Фото" style={{width:"100%",borderRadius:20}} />
      }
    </Modal>}
  </Modal>;
}

function Analytics({leads,properties,events,role,users}) {
  const canFilter = role === "Администратор тех отдел" || role === "Администратор директор";
  const managerUsers = (users || []).filter(u => String(u.role || "").includes("Менеджер"));
  const [managerFilter,setManagerFilter] = useState("Все");
  const scoped = canFilter && managerFilter !== "Все"
    ? leads.filter(l => String(l.manager_email || "") === String(managerFilter) || String(l.manager || "") === String(managerFilter))
    : leads;
  const scopedIds = new Set(scoped.map(l=>String(l.id)));
  const scopedEvents = events.filter(e => scopedIds.has(String(e.leadId)));
  const deals = scoped.filter(l=>l.status==="Сделка").length;
  const countType = (t) => scopedEvents.filter(e=>e.type===t).length;
  return <main className="screen">
    <div className="card dark"><h2>Аналитика CRM</h2><p>{role==="Менеджер по продажам"?"Личная аналитика по твоим клиентам и твоей воронке.":"Аналитика по менеджерам, стадиям и событиям."}</p></div>
    {canFilter && <div className="card"><h3>Фильтр по менеджеру</h3><select className="input" value={managerFilter} onChange={e=>setManagerFilter(e.target.value)}><option value="Все">Все менеджеры</option>{managerUsers.map(u=><option key={u.email || u.id} value={u.email || managerDisplayName(u)}>{managerDisplayName(u)} {u.email ? `— ${u.email}` : ""}</option>)}</select></div>}
    <div className="stats">{[["Лиды",scoped.length],["Сделки",deals],["В работе",scoped.filter(l=>!["Сделка","Отказ"].includes(l.status)).length],["События",scopedEvents.length],["Звонки",countType("Звонок")],["Встречи",countType("Встреча")],["Показы",countType("Показ")],["Задачи",countType("Задача")],["Конверсия",scoped.length?Math.round(deals/scoped.length*100)+"%":"0%"]].map(([a,b])=><div className="stat" key={a}><span>{a}</span><b>{b}</b></div>)}</div>
    <div className="card"><h3>Воронка клиентов</h3>{stages.map(s=><div className="stageRow" key={s}><span>{s}</span><b>{scoped.filter(l=>l.status===s).length}</b></div>)}</div>
  </main>;
}

function Help({help,setHelp,leads,setLeads,onOpen,currentProfile,role}) {
  const [reply,setReply] = useState({});
  const canSeeHelp = role === "Администратор директор" || role === "Администратор тех отдел";

  const answer = async id => {
    const text = (reply[id] || "").trim();
    if(!text) return;
    const item = help.find(h => String(h.id) === String(id));

    const { error } = await supabase
      .from("manager_help_requests")
      .update({reply:text,status:"answered",updated_at:new Date().toISOString()})
      .eq("id", Number(id));

    if (error) {
      alert("Ответ сохранён локально, но не записался в Supabase: " + error.message);
    }

    setHelp(prev=>prev.map(h=>String(h.id)===String(id)?{...h,reply:text,status:"answered",updated_at:new Date().toISOString()}:h));

    if (item) {
      const historyText = `Ответ директора ${new Date().toLocaleString()}: ${text}`;
      setLeads(prev => prev.map(l =>
        String(l.id) === String(item.leadId || item.lead_id)
          ? {...l, history:[...(l.history || []), historyText]}
          : l
      ));
    }

    playBeep();
    setReply({...reply,[id]:""});
  };

  if (!canSeeHelp) {
    return <main className="screen"><div className="card amber"><h2>Раздел доступен только директору и тех отделу</h2><p>Менеджер задаёт вопрос директору из карточки клиента и видит ответ там же.</p></div></main>;
  }

  return <main className="screen">
    <div className="card dark"><div className="row"><section><h2>Помощь менеджерам</h2><p>Вопросы менеджеров из карточек клиентов</p></section><Button onClick={playBeep}>Звук</Button></div></div>
    {help.length === 0 && <div className="card"><p className="muted">Пока нет вопросов от менеджеров.</p></div>}
    {help.map(h=>{const lead=leads.find(l=>String(l.id)===String(h.leadId || h.lead_id));return <div className="card" key={h.id}>
      <div className="row"><section><h3>{h.client || lead?.name || "Клиент"}</h3><p className="muted">{h.manager || "Менеджер"}{h.manager_email ? ` · ${h.manager_email}` : ""}</p></section>{badge(h.status==="open"?"Ожидает":"Отвечено",h.status==="open"?"red":"green")}</div>
      <div className="question"><b>Вопрос менеджера</b><p>{h.question || h.text}</p></div>
      {h.reply&&<div className="reply"><b>Директор:</b> {h.reply}</div>}
      <textarea className="input" placeholder="Ответить менеджеру..." value={reply[h.id]||""} onChange={e=>setReply({...reply,[h.id]:e.target.value})}/>
      <div className="grid2"><Button onClick={()=>answer(h.id)}>Ответить</Button><Button variant="soft" onClick={()=>lead&&onOpen(lead)}>Открыть клиента</Button></div>
    </div>})}
  </main>;
}

function Access({agencies,setAgencies,users,setUsers}) {
  const [agency,setAgency] = useState({name:""});
  const [editingAgency,setEditingAgency] = useState(null);
  const [user,setUser] = useState({agency_id:"",full_name:"",phone:"",email:"",role:"Менеджер по продажам"});
  const [editingUser,setEditingUser] = useState(null);

  const createAgency = async () => {
    if (!agency.name.trim()) return;
    const payload = {name: agency.name.trim(), status:"active"};
    const { data, error } = await supabase.from("agencies").insert(payload).select().single();
    if (error) { alert("Ошибка создания агентства: " + error.message); return; }
    setAgencies(prev => [data, ...prev]);
    setAgency({name:""});
  };

  const saveAgency = async () => {
    if (!editingAgency?.name?.trim()) return;
    const { data, error } = await supabase.from("agencies").update({name: editingAgency.name.trim(), status: editingAgency.status || "active"}).eq("id", editingAgency.id).select().single();
    if (error) { alert("Ошибка редактирования агентства: " + error.message); return; }
    setAgencies(prev => prev.map(a => String(a.id) === String(data.id) ? data : a));
    setEditingAgency(null);
  };

  const deleteAgency = async (id) => {
    if (!window.confirm("Удалить агентство и всех пользователей внутри него?")) return;
    await supabase.from("users").delete().eq("agency_id", id);
    const { error } = await supabase.from("agencies").delete().eq("id", id);
    if (error) { alert("Ошибка удаления агентства: " + error.message); return; }
    setAgencies(prev => prev.filter(a => String(a.id) !== String(id)));
    setUsers(prev => prev.filter(u => String(u.agency_id) !== String(id)));
  };

  const createUser = async () => {
    if (!user.full_name.trim() || !user.email.trim()) return;
    const agencyId = user.agency_id || agencies[0]?.id || null;
    if (!agencyId) { alert("Сначала создай агентство"); return; }

    const payload = {
      agency_id: Number(agencyId),
      full_name: user.full_name.trim(),
      phone: user.phone || "",
      email: user.email.trim(),
      role: user.role,
      avatar_url: null
    };

    const { data, error } = await supabase.from("users").insert(payload).select().single();
    if (error) { alert("Ошибка создания пользователя: " + error.message); return; }
    setUsers(prev => [data, ...prev]);
    setUser({agency_id: agencyId || "", full_name:"", phone:"", email:"", role:"Менеджер по продажам"});
  };

  const saveUser = async () => {
    if (!editingUser) return;
    const payload = {
      agency_id: Number(editingUser.agency_id),
      full_name: editingUser.full_name || "",
      phone: editingUser.phone || "",
      email: editingUser.email || "",
      role: editingUser.role || "Менеджер по продажам"
    };
    const { data, error } = await supabase.from("users").update(payload).eq("id", editingUser.id).select().single();
    if (error) { alert("Ошибка редактирования пользователя: " + error.message); return; }
    setUsers(prev => prev.map(u => String(u.id) === String(data.id) ? data : u));
    setEditingUser(null);
  };

  const deleteUser = async (u) => {
    if (!window.confirm("Удалить доступ пользователя?")) return;
    const { error } = await supabase.from("users").delete().eq("id", u.id);
    if (error) { alert("Ошибка удаления пользователя: " + error.message); return; }
    setUsers(prev => prev.filter(x => String(x.id) !== String(u.id)));
  };

  const userName = (u) => u.full_name || u.name || "Без имени";

  return <main className="screen">
    <div className="card dark"><h2>Доступ агентствам недвижимости</h2><p>Создавай агентства, открывай доступ пользователям и назначай роли внутри каждого агентства.</p></div>

    <div className="grid2">
      <div className="card">
        <h3>Создать агентство недвижимости</h3>
        <input className="input" placeholder="Название агентства" value={agency.name} onChange={e=>setAgency({...agency,name:e.target.value})}/>
        <Button className="full" onClick={createAgency}>Создать агентство</Button>
      </div>

      <div className="card">
        <h3>Открыть доступ пользователю</h3>
        <select className="input" value={user.agency_id} onChange={e=>setUser({...user,agency_id:e.target.value})}>
          <option value="">Выбери агентство</option>
          {agencies.map(a=><option key={a.id} value={a.id}>{a.name}</option>)}
        </select>
        <input className="input" placeholder="ФИО пользователя" value={user.full_name} onChange={e=>setUser({...user,full_name:e.target.value})}/>
        <input className="input" placeholder="Телефон" value={user.phone} onChange={e=>setUser({...user,phone:e.target.value})}/>
        <input className="input" placeholder="Email пользователя" value={user.email} onChange={e=>setUser({...user,email:e.target.value})}/>
        <select className="input" value={user.role} onChange={e=>setUser({...user,role:e.target.value})}><option>Менеджер по продажам</option><option>Администратор директор</option><option>Администратор тех отдел</option></select>
        <Button className="full" onClick={createUser}>Создать доступ</Button>
      </div>
    </div>

    {agencies.map(a=>{
      const list = users.filter(u => String(u.agency_id) === String(a.id));
      return <div className="card" key={a.id}>
        <div className="row">
          <section><h3>{a.name}</h3><p className="muted">ID агентства: {a.id} · {a.status || "active"}</p></section>
          <div className="grid2" style={{maxWidth:360}}>
            <Button variant="soft" onClick={()=>setEditingAgency(a)}>Редактировать</Button>
            <Button variant="danger" onClick={()=>deleteAgency(a.id)}>Удалить агентство</Button>
          </div>
        </div>
        {list.length === 0 && <p className="muted">Пока нет пользователей.</p>}
        {list.map(u=><div className="lead" key={u.id}>
          <div className="row"><section><b>{userName(u)}</b><p className="muted">{u.phone || "Без телефона"}<br/>{u.email}<br/>{u.role}</p></section>{badge("Доступ создан","green")}</div>
          <div className="grid2"><Button variant="soft" onClick={()=>setEditingUser(u)}>Редактировать доступ</Button><Button variant="danger" onClick={()=>deleteUser(u)}>Удалить пользователя</Button></div>
        </div>)}
      </div>;
    })}

    {editingAgency && <Modal onClose={()=>setEditingAgency(null)}>
      <div className="row"><h2>Редактировать агентство</h2><button className="icon" onClick={()=>setEditingAgency(null)}>×</button></div>
      <input className="input" value={editingAgency.name || ""} onChange={e=>setEditingAgency({...editingAgency,name:e.target.value})}/>
      <select className="input" value={editingAgency.status || "active"} onChange={e=>setEditingAgency({...editingAgency,status:e.target.value})}><option value="active">active</option><option value="blocked">blocked</option></select>
      <Button className="full" onClick={saveAgency}>Сохранить агентство</Button>
    </Modal>}

    {editingUser && <Modal onClose={()=>setEditingUser(null)} wide>
      <div className="row"><h2>Редактировать пользователя</h2><button className="icon" onClick={()=>setEditingUser(null)}>×</button></div>
      <select className="input" value={editingUser.agency_id || ""} onChange={e=>setEditingUser({...editingUser,agency_id:e.target.value})}>{agencies.map(a=><option key={a.id} value={a.id}>{a.name}</option>)}</select>
      <input className="input" placeholder="ФИО" value={editingUser.full_name || editingUser.name || ""} onChange={e=>setEditingUser({...editingUser,full_name:e.target.value})}/>
      <input className="input" placeholder="Телефон" value={editingUser.phone || ""} onChange={e=>setEditingUser({...editingUser,phone:e.target.value})}/>
      <input className="input" placeholder="Email" value={editingUser.email || ""} onChange={e=>setEditingUser({...editingUser,email:e.target.value})}/>
      <select className="input" value={editingUser.role || "Менеджер по продажам"} onChange={e=>setEditingUser({...editingUser,role:e.target.value})}><option>Менеджер по продажам</option><option>Администратор директор</option><option>Администратор тех отдел</option></select>
      <Button className="full" onClick={saveUser}>Сохранить пользователя</Button>
    </Modal>}
  </main>;
}



function More({role,setRole,setPage,theme,setTheme,lang,setLang,leads,setLeads,users,currentProfile,onLogout}) {
  const isTech = role === "Администратор тех отдел";
  const [manualLead,setManualLead] = useState({name:"",phone:"+380",source:sources[0],status:stages[0],manager:"",manager_email:"",notes:""});
  const [importText,setImportText] = useState("");
  const [importPreview,setImportPreview] = useState([]);
  const managerUsers = (users || []).filter(u => String(u.role || "").includes("Менеджер"));
  const managerOptions = managerUsers.length
    ? managerUsers.map(u => ({name: u.full_name || u.name || u.email, email: u.email || ""}))
    : [{name:"Елена",email:""},{name:"Андрей",email:""}];
  const activeManager = managerOptions.find(m => m.email === manualLead.manager_email) || managerOptions.find(m => m.name === manualLead.manager) || managerOptions[0];
  const setManagerByEmail = (email) => {
    const m = managerOptions.find(x => x.email === email) || managerOptions[0];
    setManualLead(prev => ({...prev, manager:m?.name || "", manager_email:m?.email || ""}));
  };

  const createManualLead = () => {
    if (!manualLead.name.trim()) return;
    const manager = activeManager?.name || manualLead.manager || "Ответственный менеджер";
    const managerEmail = activeManager?.email || manualLead.manager_email || "";
    const record = {
      id:"L-"+Date.now().toString().slice(-6),
      agency_id: currentProfile?.agency_id ? String(currentProfile.agency_id) : "",
      name:manualLead.name.trim(),
      phone:manualLead.phone || "+380",
      source:manualLead.source,
      status:manualLead.status,
      notes:manualLead.notes || "",
      nextContact:"",
      manager,
      manager_email:managerEmail,
      history:[`Клиент создан тех отделом и назначен: ${manager}`]
    };
    setLeads(prev=>[record,...prev]);
    setManualLead({name:"",phone:"+380",source:sources[0],status:stages[0],manager:activeManager?.name || "",manager_email:activeManager?.email || "",notes:""});
  };

  const parseRows = (raw) => {
    const lines = String(raw || "").split(/\r?\n/).map(x=>x.trim()).filter(Boolean);
    return lines.map(line => {
      const parts = line.includes(";") ? line.split(";") : line.includes("\t") ? line.split("\t") : line.split(",");
      return {
        name:(parts[0] || "").trim(),
        phone:(parts[1] || "+380").trim(),
        source:(parts[2] || sources[0]).trim(),
        notes:(parts.slice(3).join(" ") || "").trim()
      };
    }).filter(x=>x.name || x.phone);
  };

  const rowsToLeads = (rows) => {
    const manager = activeManager?.name || manualLead.manager || "Ответственный менеджер";
    const managerEmail = activeManager?.email || manualLead.manager_email || "";
    return rows.map((r,i)=>({
      id:"L-"+Date.now().toString().slice(-6)+"-"+i,
      agency_id: currentProfile?.agency_id ? String(currentProfile.agency_id) : "",
      name:r.name || "Без имени",
      phone:r.phone || "+380",
      source:r.source || sources[0],
      status:stages[0],
      notes:r.notes || "",
      nextContact:"",
      manager,
      manager_email:managerEmail,
      history:[`Импортирован тех отделом и назначен: ${manager}`]
    }));
  };

  const importClients = () => {
    const rows = importPreview.length ? importPreview : parseRows(importText);
    if (!rows.length) return alert("Нет клиентов для загрузки. Проверь файл или вставленный список.");
    const created = rowsToLeads(rows);
    setLeads(prev=>[...created,...prev]);
    setImportText("");
    setImportPreview([]);
  };

  const readFile = async (file) => {
    if (!file) return;
    const ext = (file.name.split(".").pop() || "").toLowerCase();

    if (["xlsx","xls"].includes(ext)) {
      try {
        const XLSX = await import(/* @vite-ignore */ "https://cdn.sheetjs.com/xlsx-0.20.3/package/xlsx.mjs");
        const buffer = await file.arrayBuffer();
        const workbook = XLSX.read(buffer);
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        const data = XLSX.utils.sheet_to_json(sheet, {header:1, defval:""});
        const rows = data
          .filter(row => row.some(cell => String(cell).trim()))
          .map(row => ({
            ...parseClientLineSmart(row.join(";"))
          }))
          .filter(x=>x.name || x.phone);
        setImportPreview(rows);
        setImportText(rows.map(r=>[r.name,r.phone,r.source,r.notes].join(";")).join("\n"));
      } catch (e) {
        alert("Не удалось прочитать Excel. Сохрани файл как CSV или проверь интернет для загрузки XLSX-модуля. " + e.message);
      }
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const text = String(reader.result || "");
      setImportText(text);
      setImportPreview(parseRows(text));
    };
    reader.readAsText(file);
  };

  return <main className="screen">
    <div className="card">
      <h3>{tr(lang,"Язык интерфейса")}</h3>
      <div className="grid3"><Button variant={lang==="ru"?"primary":"soft"} onClick={()=>{setLang("ru"); if(currentProfile?.id) supabase.from("users").update({language:"ru"}).eq("id", currentProfile.id);}}>Русский</Button><Button variant={lang==="uk"?"primary":"soft"} onClick={()=>{setLang("uk"); if(currentProfile?.id) supabase.from("users").update({language:"uk"}).eq("id", currentProfile.id);}}>Українська</Button><Button variant={lang==="en"?"primary":"soft"} onClick={()=>{setLang("en"); if(currentProfile?.id) supabase.from("users").update({language:"en"}).eq("id", currentProfile.id);}}>English</Button></div><p className="muted">Выбор сохраняется индивидуально. Полный перевод всех экранов включим следующим этапом, сейчас фиксируется язык пользователя.</p>
    </div>

    <div className="card">
      <h3>{tr(lang,"Цветовая гамма CRM")}</h3>
      <p className="muted">{tr(lang,"Каждый пользователь может выбрать оформление под себя.")}</p>
      <div className="grid3">
        {themeOptions.map(t=><Button key={t.id} variant={theme===t.id ? "primary" : "soft"} onClick={()=>{setTheme(t.id); if(currentProfile?.id) supabase.from("users").update({theme:t.id}).eq("id", currentProfile.id);}}>{t.name}</Button>)}
      </div>
    </div>

    {isTech && <div className="card">
      <h3>{tr(lang,"Роль для проверки CRM")}</h3>
      <p className="muted">Переключатель ролей доступен только администратору тех отдела.</p>
      <select className="input" value={role} onChange={e=>setRole(e.target.value)}>
        <option>Менеджер по продажам</option>
        <option>Администратор директор</option>
        <option>Администратор тех отдел</option>
      </select>
    </div>}

    <div className="card row">
      <section><h3>Аналитика</h3><p className="muted">{role==="Менеджер по продажам"?"Только моя аналитика":"Доступ по роли"}</p></section>
      <Button onClick={()=>setPage("analytics")}>Открыть</Button>
    </div>

    {(role==="Администратор директор"||role==="Администратор тех отдел")&&<div className="card row"><section><h3>Помощь менеджерам</h3><p className="muted">Вопросы из карточек клиентов</p></section><Button onClick={()=>setPage("help")}>Открыть</Button></div>}

    {isTech&&<div className="card row"><section><h3>Доступ агентствам недвижимости</h3><p className="muted">Агентства, пользователи, роли и доступы</p></section><Button onClick={()=>setPage("access")}>Открыть</Button></div>}

    <div className="card row">
      <section><h3>Мой вход</h3><p className="muted">{currentProfile?.email || "Без email"}<br/>{currentProfile?.full_name || currentProfile?.name || "Пользователь"} · {role}</p></section>
      <Button variant="danger" onClick={onLogout}>Выйти</Button>
    </div>

    {isTech && <div className="card">
      <h3>Добавить клиента вручную и назначить менеджера</h3>
      <div className="grid2">
        <input className="input" placeholder="Имя клиента" value={manualLead.name} onChange={e=>setManualLead({...manualLead,name:e.target.value})}/>
        <input className="input" placeholder="Телефон" value={manualLead.phone} onChange={e=>setManualLead({...manualLead,phone:e.target.value})}/>
        <select className="input" value={manualLead.source} onChange={e=>setManualLead({...manualLead,source:e.target.value})}>{sources.map(s=><option key={s}>{s}</option>)}</select>
        <select className="input" value={manualLead.manager_email || activeManager?.email || ""} onChange={e=>setManagerByEmail(e.target.value)}>{managerOptions.map(m=><option key={m.email || m.name} value={m.email}>{m.name} {m.email ? `— ${m.email}` : ""}</option>)}</select>
      </div>
      <textarea className="input" placeholder="Заметки" value={manualLead.notes} onChange={e=>setManualLead({...manualLead,notes:e.target.value})}/>
      <Button className="full" onClick={createManualLead}>Создать и назначить клиента</Button>
    </div>}

    {isTech && <div className="card">
      <h3>Загрузка клиентов из файла</h3>
      <p className="muted">Поддерживаются Excel XLSX/XLS, CSV/TXT/TSV. Колонки: имя; телефон; источник; заметка.</p>
      <input className="input" type="file" accept=".xlsx,.xls,.csv,.txt,.tsv" onChange={e=>readFile(e.target.files?.[0])}/>
      <select className="input" value={manualLead.manager_email || activeManager?.email || ""} onChange={e=>setManagerByEmail(e.target.value)}>{managerOptions.map(m=><option key={m.email || m.name} value={m.email}>{m.name} {m.email ? `— ${m.email}` : ""}</option>)}</select>
      <textarea className="input" style={{minHeight:120}} placeholder="Или вставь список клиентов сюда: Имя;Телефон;Источник;Заметка" value={importText} onChange={e=>{setImportText(e.target.value);setImportPreview(parseRows(e.target.value));}}/>
      <p className="muted">Готово к загрузке: {(importPreview.length ? importPreview : parseRows(importText)).length} клиентов</p>
      <Button className="full" onClick={importClients}>Загрузить клиентов и назначить менеджера</Button>
    </div>}

    {role==="Менеджер по продажам"&&<div className="card amber">Менеджеру доступны рабочие разделы, язык, цветовая гамма и личная аналитика.</div>}
  </main>;
}



export default function App(){
  const [page,setPage] = useStorage("page","feed");
  const [role,setRole] = useStorage("role","Администратор директор");
  const [theme,setTheme] = useStorage("crm_theme","classic");
  const [lang,setLang] = useStorage("crm_lang","ru");

  const [session,setSession] = useState(null);
  const [currentProfile,setCurrentProfile] = useState(null);
  const [authLoading,setAuthLoading] = useState(true);

  const [leads,setLeadsRaw] = useState([]);
  const [posts,setPostsRaw] = useState([]);
  const [properties,setPropertiesRaw] = useState([]);

  const [events,setEvents] = useStorage("events",initialEvents);
  const [help,setHelp] = useState([]);
  const [agencies,setAgencies] = useState([]);
  const [users,setUsers] = useState([]);

  const [lead,setLead] = useState(null);
  const [property,setProperty] = useState(null);

  const profileName = currentProfile?.full_name || currentProfile?.name || "";
  const profileEmail = currentProfile?.email || session?.user?.email || "";
  const profileAgencyId = currentProfile?.agency_id ? String(currentProfile.agency_id) : "";
  const isTech = role === "Администратор тех отдел";

  async function loadUserProfile(email){
    if (!email) return null;
    const { data, error } = await supabase
      .from("users")
      .select("*")
      .ilike("email", email)
      .maybeSingle();

    if (error) {
      alert("Ошибка проверки пользователя: " + error.message);
      return null;
    }

    if (!data) {
      alert("Этот email не найден в таблице users. Сначала создай доступ пользователю в разделе Доступы.");
      return null;
    }

    if (data.access === false || data.status === "blocked") {
      alert("Доступ закрыт администратором.");
      await supabase.auth.signOut();
      return null;
    }

    setCurrentProfile(data);
    setRole(data.role || "Менеджер по продажам");
    if (data.theme) setTheme(data.theme);
    if (data.language) setLang(data.language);
    return data;
  }

  useEffect(() => {
    let mounted = true;

    supabase.auth.getSession().then(async ({ data }) => {
      if (!mounted) return;
      const sess = data?.session || null;
      setSession(sess);
      if (sess?.user?.email) await loadUserProfile(sess.user.email);
      setAuthLoading(false);
    });

    const { data: sub } = supabase.auth.onAuthStateChange(async (_event, sess) => {
      if (!mounted) return;
      setSession(sess);
      if (sess?.user?.email) {
        await loadUserProfile(sess.user.email);
      } else {
        setCurrentProfile(null);
      }
      setAuthLoading(false);
    });

    return () => {
      mounted = false;
      sub?.subscription?.unsubscribe?.();
    };
  }, []);

  function extractManager(notes=""){
    const match = String(notes || "").match(/Ответственный менеджер:\s*([^\n]+)/i);
    return match ? match[1].trim() : "Елена";
  }

  function leadFromDb(row){
    return {
      id: String(row.id),
      agency_id: row.agency_id ? String(row.agency_id) : "",
      name: row.name || "Без имени",
      phone: row.phone || "",
      source: row.source || sources[0],
      status: row.stage || "Новый Лид",
      notes: row.notes || "",
      nextContact: row.next_contact_at || "",
      manager: row.manager_name || row.manager || extractManager(row.notes),
      manager_email: row.manager_email || "",
      history: ["Загружено из Supabase"]
    };
  }

  function propertyFromDb(row, mediaRows = []){
    return {
      id: String(row.id),
      agency_id: row.agency_id ? String(row.agency_id) : "",
      title: row.title || "Без названия",
      type: row.property_type || types[0],
      district: row.district || districts[0],
      status: row.status || "Актуален",
      price: row.price || 0,
      area: row.area || 0,
      floor: row.floor ? String(row.floor) : "",
      owner: row.owner_name || "",
      ownerPhone: row.owner_phone || "",
      description: row.description || "",
      property_manager_name: row.property_manager_name || row.manager_name || "",
      property_manager_email: row.property_manager_email || "",
      property_manager_phone: row.property_manager_phone || "",
      olx_status: row.olx_status || null,
      ownership_right: !!row.ownership_right,
      assignment: !!row.assignment,
      government_programs: !!row.government_programs,
      media: mediaRows
        .filter(m => String(m.property_id) === String(row.id))
        .map(m => ({kind: m.media_type, url: m.media_url, name: m.file_name})),
      hot: false,
      history: ["Загружено из Supabase"]
    };
  }

  function postFromDb(row, mediaRows = [], commentRows = []){
    const media = mediaRows.find(m => String(m.news_id) === String(row.id));
    const comments = (commentRows || [])
      .filter(c =>
        String(c.news_id || "") === String(row.id) ||
        String(c.post_id || "") === String(row.id) ||
        (c.entity_type === "news" && String(c.entity_id) === String(row.id))
      )
      .map(c => ({text:c.content || c.text || c.comment || "", author_name:c.author_name || c.author || "Комментарий", created_at:c.created_at}));

    const mediaUrl = media?.link_url || media?.media_url || "";
    const mediaType = media?.media_type || (mediaUrl ? "Фото" : "Текст");

    return {
      id: String(row.id),
      agency_id: row.agency_id ? String(row.agency_id) : "",
      author: "Администратор",
      date: row.created_at ? new Date(row.created_at).toLocaleString() : new Date().toLocaleString(),
      text: row.content || row.title || "",
      kind: mediaType,
      file: mediaUrl,
      likes: row.likes_count || 0,
      comments
    };
  }

  function belongsToMyAgency(item){
    if (isTech) return true;
    if (!profileAgencyId) return true;
    if (!item.agency_id) return true;
    return String(item.agency_id) === profileAgencyId;
  }

  function isMyLead(item){
    if (isTech) return true;
    if (!belongsToMyAgency(item)) return false;

    const manager = String(item.manager || "").trim().toLowerCase();
    const managerEmail = String(item.manager_email || "").trim().toLowerCase();
    const myName = String(profileName || "").trim().toLowerCase();
    const myEmail = String(profileEmail || "").trim().toLowerCase();

    if (role === "Администратор директор") return true;
    return (!!myEmail && managerEmail === myEmail) || (!!myName && manager === myName);
  }

  async function loadFromSupabase(profile = currentProfile){
    const agencyId = profile?.agency_id ? String(profile.agency_id) : profileAgencyId;
    const roleForLoad = profile?.role || role;

    const leadsRes = await supabase.from("leads").select("*").order("created_at", { ascending: false });
    const postsRes = await supabase.from("news").select("*").order("created_at", { ascending: false });
    const newsMediaRes = await supabase.from("news_media").select("*").order("created_at", { ascending: false });
    const propsRes = await supabase.from("properties").select("*").order("created_at", { ascending: false });
    const propertyMediaRes = await supabase.from("property_media").select("*");
    const commentsRes = await supabase.from("comments").select("*");
    const agenciesRes = await supabase.from("agencies").select("*").order("created_at", { ascending: false });
    const usersRes = await supabase.from("users").select("*").order("created_at", { ascending: false });
    const helpRes = await supabase.from("manager_help_requests").select("*").order("created_at", { ascending: false });

    if (leadsRes.error) {
      alert("Ошибка загрузки клиентов: " + leadsRes.error.message);
    } else {
      const mapped = (leadsRes.data || []).map(leadFromDb);
      setLeadsRaw(mapped);
    }

    if (postsRes.error) {
      alert("Ошибка загрузки ленты: " + postsRes.error.message);
    } else {
      const mediaRows = newsMediaRes.error ? [] : (newsMediaRes.data || []);
      const commentRows = commentsRes.error ? [] : (commentsRes.data || []);
      const mappedPosts = (postsRes.data || []).map(row => postFromDb(row, mediaRows, commentRows));
      setPostsRaw(roleForLoad === "Администратор тех отдел" ? mappedPosts : mappedPosts.filter(p => !agencyId || !p.agency_id || String(p.agency_id) === String(agencyId)));
    }

    if (propsRes.error) {
      alert("Ошибка загрузки вторички: " + propsRes.error.message);
    } else {
      const propertyMediaRows = propertyMediaRes.error ? [] : (propertyMediaRes.data || []);
      const mappedProps = (propsRes.data || []).map(row => propertyFromDb(row, propertyMediaRows));
      setPropertiesRaw(roleForLoad === "Администратор тех отдел" ? mappedProps : mappedProps.filter(p => !agencyId || !p.agency_id || String(p.agency_id) === String(agencyId)));
    }

    if (!agenciesRes.error) setAgencies(agenciesRes.data || []);
    if (!usersRes.error) setUsers(usersRes.data || []);
    if (!helpRes.error) setHelp((helpRes.data || []).map(h => ({...h, id:String(h.id), leadId:h.lead_id, text:h.question || h.text || ""})));
  }

  useEffect(() => {
    if (currentProfile) loadFromSupabase(currentProfile);
  }, [currentProfile?.id]);

  useEffect(() => {
    if (!currentProfile) return;
    const channel = supabase.channel("crm-realtime-refresh")
      .on("postgres_changes", {event:"*", schema:"public", table:"leads"}, () => loadFromSupabase(currentProfile))
      .on("postgres_changes", {event:"*", schema:"public", table:"news"}, () => loadFromSupabase(currentProfile))
      .on("postgres_changes", {event:"*", schema:"public", table:"news_media"}, () => loadFromSupabase(currentProfile))
      .on("postgres_changes", {event:"*", schema:"public", table:"comments"}, () => loadFromSupabase(currentProfile))
      .on("postgres_changes", {event:"*", schema:"public", table:"properties"}, () => loadFromSupabase(currentProfile))
      .on("postgres_changes", {event:"*", schema:"public", table:"property_media"}, () => loadFromSupabase(currentProfile))
      .on("postgres_changes", {event:"*", schema:"public", table:"manager_help_requests"}, () => loadFromSupabase(currentProfile))
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [currentProfile?.id]);

  async function signOut(){
    await supabase.auth.signOut();
    setCurrentProfile(null);
    setSession(null);
  }

  async function syncLeadToSupabase(item){
    const manager = item.manager || profileName || extractManager(item.notes);
    const notes = String(item.notes || "").includes("Ответственный менеджер:")
      ? item.notes
      : `Ответственный менеджер: ${manager}\n${item.notes || ""}`.trim();

    const payload = {
      agency_id: currentProfile?.agency_id || item.agency_id || null,
      name: item.name,
      phone: item.phone,
      source: item.source,
      stage: item.status,
      notes,
      manager_name: manager,
      manager_email: item.manager_email || profileEmail || null,
      next_contact_at: item.nextContact || null
    };

    if (!String(item.id).startsWith("L-")) {
      const { error } = await supabase.from("leads").update(payload).eq("id", item.id);
      if (error) alert("Ошибка сохранения клиента: " + error.message);
    } else {
      const { data, error } = await supabase.from("leads").insert(payload).select().single();
      if (error) { alert("Ошибка создания клиента: " + error.message); return; }
      if (data) setLeadsRaw(prev => prev.map(x => x.id === item.id ? leadFromDb(data) : x));
    }
  }

  function setLeads(next){
    setLeadsRaw(prev => {
      const value = typeof next === "function" ? next(prev) : next;

      const changed = value.filter(v => {
        const old = prev.find(p => p.id === v.id);
        return !old || JSON.stringify(old) !== JSON.stringify(v);
      });

      changed.forEach(syncLeadToSupabase);
      return value;
    });
  }

  function setProperties(next){
    setPropertiesRaw(prev => {
      const value = typeof next === "function" ? next(prev) : next;
      return value;
    });
  }

  function setPosts(next){
    setPostsRaw(prev => {
      const value = typeof next === "function" ? next(prev) : next;
      return value;
    });
  }

  if (authLoading) {
    return <main className="screen" style={{minHeight:"100vh",display:"grid",placeItems:"center"}}><div className="card">Загрузка доступа...</div></main>;
  }

  if (!session || !currentProfile) {
    return <LoginScreen onLogin={()=>{}} />;
  }

  const visibleLeads = leads.filter(isMyLead);
  const currentAgency = agencies.find(a => String(a.id) === String(currentProfile?.agency_id));
  const agencyName = currentAgency?.name || currentProfile?.agency_name || "CRM Real Estate";
  const visibleEvents = events.filter(e => {
    if (isTech) return true;
    return visibleLeads.some(l => String(l.id) === String(e.leadId));
  });

  useEffect(() => {
    if (page === "help" && !(role === "Администратор директор" || role === "Администратор тех отдел")) {
      setPage("clients");
    }
  }, [page, role]);

  return <div className="layout" style={themeStyle(theme)}>
    <Sidebar page={page} setPage={setPage} role={role} lang={lang}/>
    <div className="mainWrap">
      <main className="main">
        <Top page={page} setPage={setPage} agencyName={agencyName} lang={lang}/>
        {page==="feed"&&<Feed posts={posts} setPosts={setPosts} role={role} currentProfile={currentProfile}/>} 
        {page==="clients"&&<Clients leads={visibleLeads} setLeads={setLeads} onOpen={setLead} currentProfile={currentProfile} role={role} users={users}/>} 
        {page==="calendar"&&<Calendar events={visibleEvents} setEvents={setEvents} leads={visibleLeads} setLeads={setLeads} onOpenLead={setLead} currentProfile={currentProfile} role={role}/>} 
        {page==="properties"&&<Properties properties={properties} setProperties={setProperties} onOpen={setProperty} users={users} currentProfile={currentProfile}/>} 
        {page==="analytics"&&<Analytics leads={visibleLeads} properties={properties} events={visibleEvents} role={role} users={users}/>} 
        {page==="help"&&(role==="Администратор директор"||role==="Администратор тех отдел")&&<Help help={help} setHelp={setHelp} setLeads={setLeads} leads={visibleLeads} onOpen={setLead} currentProfile={currentProfile} role={role}/>} 
        {page==="access"&&role==="Администратор тех отдел"&&<Access agencies={agencies} setAgencies={setAgencies} users={users} setUsers={setUsers}/>} 
        {page==="more"&&<More role={role} setRole={setRole} setPage={setPage} theme={theme} setTheme={setTheme} lang={lang} setLang={setLang} leads={leads} setLeads={setLeads} users={users} currentProfile={currentProfile} onLogout={signOut}/>} 
        <Bottom page={page} setPage={setPage} lang={lang}/>
        {lead&&<LeadModal lead={lead} setLeads={setLeads} setEvents={setEvents} setHelp={setHelp} help={help} onClose={()=>setLead(null)} role={role} users={users} currentProfile={currentProfile}/>} 
        {property&&<PropertyModal property={property} setProperties={setProperties} onClose={()=>setProperty(null)} users={users} currentProfile={currentProfile} role={role} lang={lang}/>} 
      </main>
    </div>
  </div>;
}
