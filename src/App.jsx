import React, { useMemo, useState, useEffect, useRef } from "react";
import { uiExtra, uiTemplates } from "./i18n-extra.js";
import { supabase } from "./supabaseClient";
const stages = ["Новый Лид","Первый контакт","В работе","Назначена встреча","Проведена встреча","Думает","Задаток","Сделка","Отказ","Отложили"];
// Этапы, сохранённые раньше на украинском/английском, показываем в общих колонках воронки
const LEGACY_STAGE = {"Новий лід":"Новый Лид","New Lead":"Новый Лид","Перший контакт":"Первый контакт","У роботі":"В работе","В роботі":"В работе","Призначено зустріч":"Назначена встреча","Зустріч проведено":"Проведена встреча","Думає":"Думает","Завдаток":"Задаток","Угода":"Сделка","Відмова":"Отказ","Відклали":"Отложили"};
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
  {id:"nightGold", name:"Чёрная с жёлтым", dark:true, vars:{"--accent":"#F5C518","--accent2":"#FFD84D","--dark":"#0B0B0C","--soft":"#0E0E10","--card":"#18181B","--text":"#F4F2EC"}},
  {id:"classic", name:"Белая с жёлтым", vars:{"--accent":"#d6a500","--accent2":"#f3c21b","--dark":"#070707","--soft":"#f5f2ea","--card":"#ffffff","--text":"#111827"}},
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
    "Инструменты":"Інструменти", "Лента":"Стрічка", "Лента новостей":"Стрічка новин", "Канбан и клиенты":"Канбан і клієнти", "Клиенты":"Клієнти", "Календарь":"Календар", "Вторичка":"Вторинна нерухомість", "Объекты":"Об'єкти", "Аналитика":"Аналітика", "Помощь менеджерам":"Допомога менеджерам", "Доступы":"Доступи", "Ещё":"Ще", "Еще":"Ще", "Поиск по CRM...":"Пошук по CRM...", "Моё агентство":"Моє агентство",
    "Создать клиента":"Створити клієнта", "Сохранить клиента":"Зберегти клієнта", "Имя клиента":"Ім'я клієнта", "Телефон":"Телефон", "Источник":"Джерело", "Статус":"Статус", "Следующий контакт":"Наступний контакт", "Ответственный менеджер":"Відповідальний менеджер", "Заметки менеджера":"Нотатки менеджера", "История работы с клиентом":"Історія роботи з клієнтом", "Добавить комментарий в историю":"Додати коментар в історію", "Помощь директора":"Допомога директора", "Вопрос директору...":"Питання директору...", "Помощь менеджеру":"Допомога менеджеру", "Сохранены изменения":"Зміни збережено", "Задать вопрос директору":"Поставити питання директору", "Ответ директора":"Відповідь директора",
    "Новый Лид":"Новий лід", "Первый контакт":"Перший контакт", "В работе":"У роботі", "Назначена встреча":"Призначена зустріч", "Проведена встреча":"Зустріч проведено", "Думает":"Думає", "Задаток":"Завдаток", "Сделка":"Угода", "Отказ":"Відмова", "Отложили":"Відклали",
    "Звонок":"Дзвінок", "Встреча":"Зустріч", "Показ":"Показ", "Задача":"Завдання", "Дата следующего касания":"Дата наступного контакту", "Время":"Час", "Название":"Назва", "Напомнить за":"Нагадати за", "Звук":"Звук", "Сохранить событие":"Зберегти подію", "Редактировать":"Редагувати", "Удалить":"Видалити", "Открыть":"Відкрити", "Закрыть":"Закрити", "Сохранить":"Зберегти", "Отправить":"Надіслати", "Добавить":"Додати",
    "Добавить объект":"Додати об'єкт", "Название объекта":"Назва об'єкта", "Тип":"Тип", "Район":"Район", "Цена":"Ціна", "Площадь":"Площа", "Этаж":"Поверх", "Собственник":"Власник", "Телефон собственника":"Телефон власника", "Описание":"Опис", "Сохранить объект":"Зберегти об'єкт", "Фото / видео объекта":"Фото / відео об'єкта", "Добавить фото/видео":"Додати фото/відео", "Юридические параметры":"Юридичні параметри", "Право собственности":"Право власності", "Переуступка":"Переуступка", "Госпрограммы":"Держпрограми", "Отправить презентацию клиенту":"Надіслати презентацію клієнту", "Скачать PDF-презентацию":"Завантажити PDF-презентацію",
    "Язык интерфейса":"Мова інтерфейсу", "Цветовая гамма CRM":"Кольорова гама CRM", "Каждый пользователь может выбрать оформление под себя.":"Кожен користувач може обрати оформлення під себе.", "Роль для проверки CRM":"Роль для перевірки CRM", "Открыть":"Відкрити", "Выйти":"Вийти", "Русский":"Російська", "Українська":"Українська", "English":"English"
  },
  en: {
    "Инструменты":"Tools", "Лента":"Feed", "Лента новостей":"News Feed", "Канбан и клиенты":"Kanban and Clients", "Клиенты":"Clients", "Календарь":"Calendar", "Вторичка":"Resale", "Объекты":"Properties", "Аналитика":"Analytics", "Помощь менеджерам":"Manager Help", "Доступы":"Access", "Ещё":"More", "Еще":"More", "Поиск по CRM...":"Search CRM...", "Моё агентство":"My agency",
    "Создать клиента":"Create client", "Сохранить клиента":"Save client", "Имя клиента":"Client name", "Телефон":"Phone", "Источник":"Source", "Статус":"Status", "Следующий контакт":"Next contact", "Ответственный менеджер":"Responsible manager", "Заметки менеджера":"Manager notes", "История работы с клиентом":"Client history", "Добавить комментарий в историю":"Add comment to history", "Помощь директора":"Director help", "Вопрос директору...":"Question to director...", "Помощь менеджеру":"Ask director", "Задать вопрос директору":"Ask director", "Ответ директора":"Director reply",
    "Новый Лид":"New Lead", "Первый контакт":"First Contact", "В работе":"In Progress", "Назначена встреча":"Meeting Set", "Проведена встреча":"Meeting Done", "Думает":"Thinking", "Задаток":"Deposit", "Сделка":"Deal", "Отказ":"Refusal", "Отложили":"Postponed",
    "Звонок":"Call", "Встреча":"Meeting", "Показ":"Showing", "Задача":"Task", "Дата следующего касания":"Next touch date", "Время":"Time", "Название":"Title", "Напомнить за":"Remind before", "Звук":"Sound", "Сохранить событие":"Save event", "Редактировать":"Edit", "Удалить":"Delete", "Открыть":"Open", "Закрыть":"Close", "Сохранить":"Save", "Отправить":"Send", "Добавить":"Add",
    "Добавить объект":"Add property", "Название объекта":"Property title", "Тип":"Type", "Район":"District", "Цена":"Price", "Площадь":"Area", "Этаж":"Floor", "Собственник":"Owner", "Телефон собственника":"Owner phone", "Описание":"Description", "Сохранить объект":"Save property", "Фото / видео объекта":"Property photo/video", "Добавить фото/видео":"Add photo/video", "Юридические параметры":"Legal parameters", "Право собственности":"Ownership right", "Переуступка":"Assignment", "Госпрограммы":"Government programs", "Отправить презентацию клиенту":"Send presentation to client", "Скачать PDF-презентацию":"Download PDF presentation",
    "Язык интерфейса":"Interface language", "Цветовая гамма CRM":"CRM color theme", "Каждый пользователь может выбрать оформление под себя.":"Each user can choose their own interface style.", "Роль для проверки CRM":"Role for CRM testing", "Выйти":"Sign out", "Русский":"Russian", "Українська":"Ukrainian", "English":"English"
  }
};
function tr(lang, text){ if (!lang || lang === "ru") return text; return (translations[lang] && translations[lang][text]) || (uiExtra[lang] && uiExtra[lang][text]) || (typeof uiCalendar !== "undefined" && uiCalendar[lang] && uiCalendar[lang][text]) || text; }
const extraUk = {

    "Повторный клиент":"Повторний клієнт","Рекомендации":"Рекомендації","ОЛХ":"OLX","Лид руководство":"Лід керівництво","Инстаграм личный":"Особистий Instagram","Тик-Ток личный":"Особистий TikTok","Фейсбук личный":"Особистий Facebook","Тик-Ток рабочий":"Робочий TikTok","Инстаграм рабочий":"Робочий Instagram","Фейсбук рабочий":"Робочий Facebook","Телеграмм-канал рабочий":"Робочий Telegram-канал","Рекомендации клиентов":"Рекомендації клієнтів",
    "Сделки":"Угоди","Сумма сделки":"Сума угоди","Комиссия":"Комісія","Дата сделки":"Дата угоди","Объект сделки":"Об'єкт угоди","Комментарий по сделке":"Коментар до угоди","Сохранить сделку":"Зберегти угоду","Нет сделок":"Немає угод","Избранные":"Обрані","Только избранные":"Лише обрані","Добавить в подборку":"Додати до добірки","Создать подборку для клиента":"Створити добірку для клієнта","Открыть подборку":"Відкрити добірку","Скопировать ссылку подборки":"Скопіювати посилання на добірку","Клиент":"Клієнт","Действия":"Дії","Заметки":"Нотатки",
    "Режим просмотра.":"Режим перегляду.","Редактировать этот объект может только менеджер, который его создал, или администратор тех отдела. Ты можешь смотреть объект, связаться с ответственным менеджером и отправить презентацию клиенту.":"Редагувати цей об'єкт може лише відповідальний менеджер або адміністратор техвідділу. Ти можеш переглядати об'єкт, зв'язатися з відповідальним менеджером та надіслати презентацію клієнту.",
    "Украинская версия описания":"Українська версія опису","Перевести описание на украинский":"Перекласти опис українською","Переводим...":"Перекладаємо...","Русская презентация":"Російська презентація","Українська презентація":"Українська презентація","Ссылка скопирована":"Посилання скопійовано",
    "Фильтр по датам":"Фільтр за датами", "Вид отображения":"Вид відображення", "Канбан":"Канбан", "Список":"Список", "Список клиентов":"Список клієнтів", "Открыть карточку":"Відкрити картку", "Нет клиентов по выбранному фильтру":"Немає клієнтів за вибраним фільтром", "Выбери период просмотра ленты":"Обери період перегляду стрічки", "Период":"Період", "Обновились клиенты":"Оновилися клієнти", "Обновилась лента новостей":"Оновилася стрічка новин", "Обновились медиа в ленте":"Оновилися медіа у стрічці", "Новый комментарий":"Новий коментар", "Обновилась вторичка":"Оновилася вторинна нерухомість", "Обновились фото объекта":"Оновилися фото об'єкта", "Новое сообщение директору":"Нове повідомлення директору", "Уведомление":"Сповіщення",
    "Пн":"Пн","Вт":"Вт","Ср":"Ср","Чт":"Чт","Пт":"Пт","Сб":"Сб","Вс":"Нд","Январь":"Січень", "Февраль":"Лютий", "Март":"Березень", "Апрель":"Квітень", "Май":"Травень", "Июнь":"Червень", "Июль":"Липень", "Август":"Серпень", "Сентябрь":"Вересень", "Октябрь":"Жовтень", "Ноябрь":"Листопад", "Декабрь":"Грудень",
  "Новая публикация":"Нова публікація", "Опубликовать":"Опублікувати", "Текст публикации...":"Текст публікації...", "Фото":"Фото", "Видео":"Відео", "Файл":"Файл", "Ссылка":"Посилання", "Вставьте ссылку":"Вставте посилання", "Открыть ссылку":"Відкрити посилання", "Редактировать публикацию":"Редагувати публікацію", "Сохранить изменения":"Зберегти зміни", "Написать комментарий...":"Написати коментар...", "Комментарий":"Коментар", "Связь с клиентом":"Зв'язок з клієнтом", "Позвонить":"Подзвонити", "Следующий этап":"Наступний етап", "Все":"Усі", "Все менеджеры":"Усі менеджери", "Фильтр по менеджеру":"Фільтр за менеджером", "Лиды":"Ліди", "Сделки":"Угоди", "События":"Події", "Звонки":"Дзвінки", "Встречи":"Зустрічі", "Показы":"Покази", "Задачи":"Завдання", "Конверсия":"Конверсія", "Воронка клиентов":"Воронка клієнтів", "Загрузка доступа...":"Завантаження доступу...", "Войти":"Увійти", "Пароль":"Пароль", "Вход в CRM Real Estate":"Вхід у CRM Real Estate", "Доступ закрыт администратором.":"Доступ закрито адміністратором.", "Открыть PDF-презентацию":"Відкрити PDF-презентацію", "Скопировать ссылку клиенту":"Скопіювати посилання клієнту", "Презентация для клиента":"Презентація для клієнта", "Создать агентство":"Створити агентство", "Открыть доступ пользователю":"Відкрити доступ користувачу", "Создать доступ":"Створити доступ", "Удалить пользователя":"Видалити користувача", "Удалить агентство":"Видалити агентство"
};
const extraEn = {

    "Повторный клиент":"Repeat client","Рекомендации":"Referrals","ОЛХ":"OLX","Лид руководство":"Management lead","Инстаграм личный":"Personal Instagram","Тик-Ток личный":"Personal TikTok","Фейсбук личный":"Personal Facebook","Тик-Ток рабочий":"Work TikTok","Инстаграм рабочий":"Work Instagram","Фейсбук рабочий":"Work Facebook","Телеграмм-канал рабочий":"Work Telegram channel","Рекомендации клиентов":"Client referrals",
    "Сделки":"Deals","Сумма сделки":"Deal amount","Комиссия":"Commission","Дата сделки":"Deal date","Объект сделки":"Deal property","Комментарий по сделке":"Deal comment","Сохранить сделку":"Save deal","Нет сделок":"No deals","Избранные":"Favorites","Только избранные":"Favorites only","Добавить в подборку":"Add to selection","Создать подборку для клиента":"Create client selection","Открыть подборку":"Open selection","Скопировать ссылку подборки":"Copy selection link","Клиент":"Client","Действия":"Actions","Заметки":"Notes",
    "Режим просмотра.":"View mode.","Редактировать этот объект может только менеджер, который его создал, или администратор тех отдела. Ты можешь смотреть объект, связаться с ответственным менеджером и отправить презентацию клиенту.":"Only the responsible manager or tech admin can edit this property. You can view it, contact the responsible manager and send a presentation to the client.",
    "Украинская версия описания":"Ukrainian description","Перевести описание на украинский":"Translate description to Ukrainian","Переводим...":"Translating...","Русская презентация":"Russian presentation","Українська презентація":"Ukrainian presentation","Ссылка скопирована":"Link copied",
    "Фильтр по датам":"Date filter", "Вид отображения":"View mode", "Канбан":"Kanban", "Список":"List", "Список клиентов":"Client list", "Открыть карточку":"Open card", "Нет клиентов по выбранному фильтру":"No clients for the selected filter", "Выбери период просмотра ленты":"Choose feed period", "Период":"Custom period", "Обновились клиенты":"Clients updated", "Обновилась лента новостей":"News feed updated", "Обновились медиа в ленте":"Feed media updated", "Новый комментарий":"New comment", "Обновилась вторичка":"Resale updated", "Обновились фото объекта":"Property photos updated", "Новое сообщение директору":"New message to director", "Уведомление":"Notification",
    "Пн":"Mon","Вт":"Tue","Ср":"Wed","Чт":"Thu","Пт":"Fri","Сб":"Sat","Вс":"Sun","Январь":"January", "Февраль":"February", "Март":"March", "Апрель":"April", "Май":"May", "Июнь":"June", "Июль":"July", "Август":"August", "Сентябрь":"September", "Октябрь":"October", "Ноябрь":"November", "Декабрь":"December",
  "Новая публикация":"New post", "Опубликовать":"Publish", "Текст публикации...":"Post text...", "Фото":"Photo", "Видео":"Video", "Файл":"File", "Ссылка":"Link", "Вставьте ссылку":"Paste link", "Открыть ссылку":"Open link", "Редактировать публикацию":"Edit post", "Сохранить изменения":"Save changes", "Написать комментарий...":"Write a comment...", "Комментарий":"Comment", "Связь с клиентом":"Contact client", "Позвонить":"Call", "Следующий этап":"Next stage", "Все":"All", "Все менеджеры":"All managers", "Фильтр по менеджеру":"Manager filter", "Лиды":"Leads", "Сделки":"Deals", "События":"Events", "Звонки":"Calls", "Встречи":"Meetings", "Показы":"Showings", "Задачи":"Tasks", "Конверсия":"Conversion", "Воронка клиентов":"Client funnel", "Загрузка доступа...":"Loading access...", "Войти":"Sign in", "Пароль":"Password", "Вход в CRM Real Estate":"CRM Real Estate Login", "Доступ закрыт администратором.":"Access closed by administrator.", "Открыть PDF-презентацию":"Open PDF presentation", "Скопировать ссылку клиенту":"Copy client link", "Презентация для клиента":"Client presentation", "Создать агентство":"Create agency", "Открыть доступ пользователю":"Open user access", "Создать доступ":"Create access", "Удалить пользователя":"Delete user", "Удалить агентство":"Delete agency"
};
translations.uk = {...translations.uk, "Статистика/Отчетность":"Статистика/Звітність", "Аналитика · Рынок недвижимости":"Аналітика · Ринок нерухомості", ...extraUk};
translations.en = {...translations.en, "Статистика/Отчетность":"Statistics/Reporting", "Аналитика · Рынок недвижимости":"Analytics · Real Estate Market", ...extraEn};
translations.uk = {...translations.uk,
  "Дата от":"Дата від","Дата до":"Дата до","Скачать подборку":"Завантажити добірку","Поиск клиента по имени или телефону...":"Пошук клієнта за ім’ям або телефоном...","Поиск сделки по клиенту или телефону...":"Пошук угоди за клієнтом або телефоном...","Статус сделки":"Статус угоди","Новая сделка":"Нова угода","Документы":"Документи","Расчёт":"Розрахунок","Закрыта":"Закрита","Сделка сохранена":"Угоду збережено","Все сделки агентства":"Усі угоди агентства","Только твои сделки":"Тільки твої угоди"};
translations.en = {...translations.en,
  "Дата от":"Date from","Дата до":"Date to","Скачать подборку":"Download selection","Поиск клиента по имени или телефону...":"Search client by name or phone...","Поиск сделки по клиенту или телефону...":"Search deal by client or phone...","Статус сделки":"Deal status","Новая сделка":"New deal","Документы":"Documents","Расчёт":"Settlement","Закрыта":"Closed","Сделка сохранена":"Deal saved","Все сделки агентства":"All agency deals","Только твои сделки":"Only your deals"};

function themeStyle(themeId){
  const found = themeOptions.find(t => t.id === themeId) || themeOptions[0];
  return {
    ...found.vars,
    background: found.dark ? found.vars["--soft"] : `linear-gradient(135deg, ${found.vars["--soft"] || "#f5f2ea"}, #ffffff)`
  };
}


const uiPhraseTranslations = {
  uk: {
    ...translations.uk,
    "CRM Real Estate":"CRM Real Estate",
    "Premium SaaS":"Premium SaaS",
    "Вход в CRM Real Estate":"Вхід у CRM Real Estate",
    "Войди по email и паролю, который выдал администратор тех отдела.":"Увійди за email і паролем, який видав адміністратор техвідділу.",
    "Введи email и пароль":"Введи email і пароль",
    "Ошибка входа":"Помилка входу",
    "Входим...":"Входимо...",
    "Если доступ закрыт или email не найден в таблице users — CRM не откроется.":"Якщо доступ закрито або email не знайдено в таблиці users — CRM не відкриється.",
    "Загрузка доступа...":"Завантаження доступу...",
    "Внутренняя соцсеть агентства: фото, видео, файлы, ссылки, лайки и комментарии.":"Внутрішня соцмережа агентства: фото, відео, файли, посилання, лайки та коментарі.",
    "+ Новая публикация":"+ Нова публікація",
    "Новая публикация":"Нова публікація",
    "Текст публикации...":"Текст публікації...",
    "Вставьте ссылку":"Вставте посилання",
    "Опубликовать":"Опублікувати",
    "Ошибка сохранения публикации":"Помилка збереження публікації",
    "Ошибка сохранения ссылки":"Помилка збереження посилання",
    "Ошибка загрузки файла":"Помилка завантаження файлу",
    "Файл загрузился, но не записался в таблицу":"Файл завантажився, але не записався в таблицю",
    "Ошибка редактирования публикации":"Помилка редагування публікації",
    "Удалить публикацию?":"Видалити публікацію?",
    "Ошибка удаления публикации":"Помилка видалення публікації",
    "Написать комментарий...":"Написати коментар...",
    "Отправить":"Надіслати",
    "Комментарий":"Коментар",
    "Редактировать публикацию":"Редагувати публікацію",
    "Сохранить изменения":"Зберегти зміни",
    "Открыть ссылку":"Відкрити посилання",
    "Открыть файл":"Відкрити файл",
    "Нажми, чтобы открыть видео":"Натисни, щоб відкрити відео",
    "предпросмотр":"попередній перегляд",
    "+ Создать клиента":"+ Створити клієнта",
    "Все менеджеры":"Усі менеджери",
    "Без имени":"Без імені",
    "Без заметки":"Без нотатки",
    "Ответственный":"Відповідальний",
    "не назначен":"не призначено",
    "Следующий этап":"Наступний етап",
    "Связь с клиентом":"Зв'язок із клієнтом",
    "Позвонить":"Подзвонити",
    "Viber чат":"Viber чат",
    "Viber открыть контакт":"Відкрити контакт у Viber",
    "Если Viber на компьютере не открылся, проверь Viber Desktop. На телефоне ссылка откроет приложение.":"Якщо Viber на комп'ютері не відкрився, перевір Viber Desktop. На телефоні посилання відкриє застосунок.",
    "Выбери менеджера":"Обери менеджера",
    "Написать комментарий себе по клиенту...":"Написати собі коментар щодо клієнта...",
    "По этому клиенту пока нет вопросов директору.":"За цим клієнтом ще немає питань директору.",
    "Вопрос":"Питання",
    "Ожидает ответа":"Очікує відповіді",
    "Отвечено":"Відповідь надано",
    "Ответ директора ещё не добавлен.":"Відповідь директора ще не додана.",
    "Календарь клиента":"Календар клієнта",
    "Сначала выбери фото или видео":"Спочатку обери фото або відео",
    "Объект сохранён":"Об'єкт збережено",
    "Ошибка создания объекта":"Помилка створення об'єкта",
    "Ошибка сохранения объекта":"Помилка збереження об'єкта",
    "Фото/видео сохранено":"Фото/відео збережено",
    "Фото/видео сохранены":"Фото/відео збережено",
    "Новый объект":"Новий об'єкт",
    "Без названия":"Без назви",
    "Актуален":"Актуальний",
    "Собственник":"Власник",
    "Телефон собственника":"Телефон власника",
    "Ответственный менеджер по объекту":"Відповідальний менеджер за об'єкт",
    "Связь с ответственным менеджером":"Зв'язок із відповідальним менеджером",
    "Опубликовать в OLX":"Опублікувати в OLX",
    "Заявка на публикацию в OLX отправлена тех отделу":"Заявку на публікацію в OLX надіслано техвідділу",
    "Подтвердить публикацию OLX":"Підтвердити публікацію OLX",
    "Тех отдел подтвердил публикацию. Для реальной публикации нужен OLX API токен.":"Техвідділ підтвердив публікацію. Для реальної публікації потрібен OLX API токен.",
    "Презентация для клиента":"Презентація для клієнта",
    "Открыть PDF-презентацию":"Відкрити PDF-презентацію",
    "Скопировать ссылку клиенту":"Скопіювати посилання клієнту",
    "PDF ссылка скопирована":"PDF-посилання скопійовано",
    "Удалить объект":"Видалити об'єкт",
    "Удалить объект?":"Видалити об'єкт?",
    "Доступно только тех отделу":"Доступно тільки техвідділу",
    "Встречи, звонки, показы и задачи по клиентам. Визуально приближено к календарю iPhone.":"Зустрічі, дзвінки, покази та завдання по клієнтах. Візуально наближено до календаря iPhone.",
    "Проверить звук":"Перевірити звук",
    "Год":"Рік", "Месяц":"Місяць", "Неделя":"Тиждень", "День":"День", "событий":"подій", "добавить событие":"додати подію",
    "Событие":"Подія", "Клиент":"Клієнт", "ОТКРЫТЬ ПОЛНУЮ КАРТОЧКУ КЛИЕНТА":"ВІДКРИТИ ПОВНУ КАРТКУ КЛІЄНТА",
    "Нет заметок":"Немає нотаток", "Звук напоминания":"Звук нагадування", "Удалить событие":"Видалити подію", "Удалить событие?":"Видалити подію?",
    "Аналитика CRM":"Аналітика CRM", "Доступна общая аналитика и фильтры.":"Доступна загальна аналітика та фільтри.", "Доступна только личная аналитика.":"Доступна тільки особиста аналітика.", "Воронка клиентов":"Воронка клієнтів", "Лиды":"Ліди", "Сделки":"Угоди", "В работе":"У роботі", "События":"Події", "Конверсия":"Конверсія",
    "Вопросы из карточек клиентов":"Питання з карток клієнтів", "Ответить менеджеру...":"Відповісти менеджеру...", "Ответить":"Відповісти", "Открыть клиента":"Відкрити клієнта", "Вопрос менеджера":"Питання менеджера", "Ожидает":"Очікує",
    "Доступ агентствам недвижимости":"Доступ агентствам нерухомості", "Сначала создай главное агентство, потом открывай доступ пользователям этого агентства.":"Спочатку створи головне агентство, потім відкривай доступ користувачам цього агентства.", "Создать агентство недвижимости":"Створити агентство нерухомості", "Название агентства":"Назва агентства", "Телефон агентства":"Телефон агентства", "Email агентства":"Email агентства", "Создать агентство":"Створити агентство", "Открыть доступ пользователю":"Відкрити доступ користувачу", "Выбери агентство":"Обери агентство", "ФИО пользователя":"ПІБ користувача", "Email пользователя":"Email користувача", "Создать доступ":"Створити доступ", "Закрыть доступ":"Закрити доступ", "Открыть доступ":"Відкрити доступ", "Удалить пользователя":"Видалити користувача", "Удалить агентство":"Видалити агентство",
    "Менеджер по продажам":"Менеджер з продажу", "Администратор директор":"Адміністратор директор", "Администратор тех отдел":"Адміністратор техвідділ",
    "Добавить клиентов":"Додати клієнтів", "Загрузить файл":"Завантажити файл", "Назначить ответственного":"Призначити відповідального", "Импортировать клиентов":"Імпортувати клієнтів", "Каждая строка: имя, телефон, источник, заметки":"Кожен рядок: ім'я, телефон, джерело, нотатки",
    "Русский":"Російська", "Українська":"Українська", "English":"English"
  },
  en: {
    ...translations.en,
    "CRM Real Estate":"CRM Real Estate", "Premium SaaS":"Premium SaaS",
    "Вход в CRM Real Estate":"CRM Real Estate Login", "Войди по email и паролю, который выдал администратор тех отдела.":"Sign in using the email and password issued by the tech admin.", "Введи email и пароль":"Enter email and password", "Ошибка входа":"Login error", "Входим...":"Signing in...", "Если доступ закрыт или email не найден в таблице users — CRM не откроется.":"If access is closed or email is not found in users, CRM will not open.", "Загрузка доступа...":"Loading access...",
    "Внутренняя соцсеть агентства: фото, видео, файлы, ссылки, лайки и комментарии.":"Agency internal feed: photos, videos, files, links, likes and comments.", "+ Новая публикация":"+ New post", "Новая публикация":"New post", "Текст публикации...":"Post text...", "Вставьте ссылку":"Paste link", "Опубликовать":"Publish", "Ошибка сохранения публикации":"Post save error", "Ошибка сохранения ссылки":"Link save error", "Ошибка загрузки файла":"File upload error", "Файл загрузился, но не записался в таблицу":"File uploaded but was not saved to the table", "Ошибка редактирования публикации":"Post edit error", "Удалить публикацию?":"Delete post?", "Ошибка удаления публикации":"Post delete error", "Написать комментарий...":"Write a comment...", "Комментарий":"Comment", "Открыть ссылку":"Open link", "Открыть файл":"Open file", "Нажми, чтобы открыть видео":"Tap to open video", "предпросмотр":"preview",
    "+ Создать клиента":"+ Create client", "Все менеджеры":"All managers", "Без имени":"No name", "Без заметки":"No note", "Ответственный":"Responsible", "не назначен":"not assigned", "Следующий этап":"Next stage", "Связь с клиентом":"Contact client", "Позвонить":"Call", "Viber чат":"Viber chat", "Viber открыть контакт":"Open Viber contact", "Если Viber на компьютере не открылся, проверь Viber Desktop. На телефоне ссылка откроет приложение.":"If Viber did not open on desktop, check Viber Desktop. On phone, the link will open the app.", "Выбери менеджера":"Choose manager", "Написать комментарий себе по клиенту...":"Write an internal client comment...", "По этому клиенту пока нет вопросов директору.":"No director questions for this client yet.", "Вопрос":"Question", "Ожидает ответа":"Waiting for reply", "Отвечено":"Answered", "Ответ директора ещё не добавлен.":"Director reply has not been added yet.", "Календарь клиента":"Client calendar",
    "Сначала выбери фото или видео":"Choose photo or video first", "Объект сохранён":"Property saved", "Ошибка создания объекта":"Property creation error", "Ошибка сохранения объекта":"Property save error", "Фото/видео сохранено":"Photo/video saved", "Фото/видео сохранены":"Photo/video saved", "Новый объект":"New property", "Без названия":"Untitled", "Актуален":"Active", "Ответственный менеджер по объекту":"Property responsible manager", "Связь с ответственным менеджером":"Contact responsible manager", "Опубликовать в OLX":"Publish to OLX", "Заявка на публикацию в OLX отправлена тех отделу":"OLX publication request sent to tech department", "Подтвердить публикацию OLX":"Confirm OLX publication", "Тех отдел подтвердил публикацию. Для реальной публикации нужен OLX API токен.":"Tech department confirmed publication. OLX API token is required for real publishing.", "Презентация для клиента":"Client presentation", "Открыть PDF-презентацию":"Open PDF presentation", "Скопировать ссылку клиенту":"Copy client link", "PDF ссылка скопирована":"PDF link copied", "Удалить объект":"Delete property", "Удалить объект?":"Delete property?", "Доступно только тех отделу":"Tech department only",
    "Встречи, звонки, показы и задачи по клиентам. Визуально приближено к календарю iPhone.":"Meetings, calls, showings and tasks by clients. Visually close to iPhone Calendar.", "Проверить звук":"Test sound", "Год":"Year", "Месяц":"Month", "Неделя":"Week", "День":"Day", "событий":"events", "добавить событие":"add event", "Событие":"Event", "Клиент":"Client", "ОТКРЫТЬ ПОЛНУЮ КАРТОЧКУ КЛИЕНТА":"OPEN FULL CLIENT CARD", "Нет заметок":"No notes", "Звук напоминания":"Reminder sound", "Удалить событие":"Delete event", "Удалить событие?":"Delete event?",
    "Аналитика CRM":"CRM Analytics", "Доступна общая аналитика и фильтры.":"General analytics and filters are available.", "Доступна только личная аналитика.":"Only personal analytics are available.", "Воронка клиентов":"Client funnel", "Лиды":"Leads", "Сделки":"Deals", "В работе":"In progress", "События":"Events", "Конверсия":"Conversion",
    "Вопросы из карточек клиентов":"Questions from client cards", "Ответить менеджеру...":"Reply to manager...", "Ответить":"Reply", "Открыть клиента":"Open client", "Вопрос менеджера":"Manager question", "Ожидает":"Waiting",
    "Доступ агентствам недвижимости":"Real estate agency access", "Сначала создай главное агентство, потом открывай доступ пользователям этого агентства.":"Create the main agency first, then open access to this agency's users.", "Создать агентство недвижимости":"Create real estate agency", "Название агентства":"Agency name", "Телефон агентства":"Agency phone", "Email агентства":"Agency email", "Создать агентство":"Create agency", "Открыть доступ пользователю":"Open user access", "Выбери агентство":"Choose agency", "ФИО пользователя":"User full name", "Email пользователя":"User email", "Создать доступ":"Create access", "Закрыть доступ":"Close access", "Открыть доступ":"Open access", "Удалить пользователя":"Delete user", "Удалить агентство":"Delete agency",
    "Менеджер по продажам":"Sales manager", "Администратор директор":"Director admin", "Администратор тех отдел":"Tech admin",
    "Добавить клиентов":"Add clients", "Загрузить файл":"Upload file", "Назначить ответственного":"Assign responsible", "Импортировать клиентов":"Import clients", "Каждая строка: имя, телефон, источник, заметки":"Each row: name, phone, source, notes", "Русский":"Russian", "Українська":"Ukrainian", "English":"English"
  }
};

function globalThemeCss(themeId){
  const found = themeOptions.find(t => t.id === themeId) || themeOptions[0];
  const v = found.vars || {};
  const accent = v["--accent"] || "#d6a500";
  const accent2 = v["--accent2"] || accent;
  const dark = v["--dark"] || "#070707";
  const soft = v["--soft"] || "#f5f2ea";
  const card = v["--card"] || "#ffffff";
  const text = v["--text"] || "#111827";
  return `
    :root{--accent:${accent};--accent2:${accent2};--dark:${dark};--soft:${soft};--card:${card};--text:${text};}
    body{background:linear-gradient(135deg, ${soft}, #fff)!important;color:${text}!important;}
    .layout{background:linear-gradient(135deg, ${soft}, #fff)!important;color:${text}!important;}
    .sidebar,.card.dark,.propHero{background:${dark}!important;color:#fff!important;}
    .logo>div,.sideBtn.active,.bottom .active,.btn.primary,.badge.gold,.chip.active{background:linear-gradient(135deg, ${accent}, ${accent2})!important;color:#111!important;border-color:${accent}!important;}
    .btn:not(.danger), .agencyTop{border-color:${accent}!important;}
    .btn.soft,.chip,.input, input, textarea, select{background:${card}!important;color:${text}!important;border-color:color-mix(in srgb, ${accent} 35%, #d1d5db)!important;}
    .card,.sheet,.kanbanCol,.modal .sheet,.event{background:${card}!important;color:${text}!important;border-color:color-mix(in srgb, ${accent} 24%, #e5e7eb)!important;box-shadow:0 18px 50px rgba(0,0,0,.08)!important;}
    .lead,.post,.propertyCard{background:linear-gradient(135deg, color-mix(in srgb, ${soft} 68%, ${card}), ${card})!important;color:${text}!important;border-color:color-mix(in srgb, ${accent} 32%, #e5e7eb)!important;box-shadow:0 18px 50px rgba(0,0,0,.08)!important;}
    .igPost,.igPad,.gcalViews button.active{background:${card}!important;}
    .bottom{background:color-mix(in srgb, ${card} 94%, transparent)!important;border-color:color-mix(in srgb, ${accent} 24%, #e5e7eb)!important;}
    .top{background:${dark}!important;color:#fff!important;border-color:transparent!important;}
    .top h1{color:#fff!important;}
    .sideBtn,.roleBox{color:#fff!important;border-color:rgba(255,255,255,.14)!important;}
    .sideBtn:hover{background:rgba(255,255,255,.10)!important;}
    h1,h2,h3,b,.kanbanHead{color:inherit;}
    .link{color:${accent}!important;font-weight:800!important;}
    .media{background:linear-gradient(135deg, ${soft}, #fff)!important;border-color:color-mix(in srgb, ${accent} 24%, #e5e7eb)!important;}
    .day,.weekRow,.monthBox{background:${card}!important;color:${text}!important;border-color:color-mix(in srgb, ${accent} 20%, #e5e7eb)!important;}
    .mini{background:color-mix(in srgb, ${accent} 18%, #fff)!important;color:${text}!important;}
    .card.amber,.amber{background:linear-gradient(135deg, color-mix(in srgb, ${accent} 16%, ${card}), ${card})!important;color:${text}!important;border-color:color-mix(in srgb, ${accent} 45%, #e5e7eb)!important;}
    .clientTable th{background:color-mix(in srgb, ${accent} 14%, ${card})!important;color:${text}!important;}
    .clientTable td,.clientTable th{border-color:color-mix(in srgb, ${accent} 22%, #e5e7eb)!important;}
    .dealRow,.selectionBar{background:${card}!important;border-color:color-mix(in srgb, ${accent} 28%, #e5e7eb)!important;}
    .clientSearchBar,.calendarSearchCard,.dealsToolbar{border:1px solid color-mix(in srgb, ${accent} 28%, #e5e7eb)!important;}
    .expressiveLead{padding:16px!important;border-width:1.5px!important;}
    .leadInfoGrid{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin:12px 0;}
    .leadInfoCell,.leadNotesBox,.clientDetailsGrid .field,.calendarFormPanel,.calendarReminderPanel{border:1px solid color-mix(in srgb, ${accent} 30%, #d1d5db)!important;background:color-mix(in srgb, ${soft} 55%, ${card})!important;border-radius:14px;padding:10px!important;}
    .leadInfoCell span,.leadNotesBox span{display:block;font-size:11px;text-transform:uppercase;letter-spacing:.06em;opacity:.65;margin-bottom:4px;}
    .leadNotesBox{margin-bottom:12px;}.leadNotesBox p{margin:4px 0 0;}
    .clientDetailsGrid{gap:12px!important;}.clientDetailsGrid .field span{font-weight:800!important;}
    .clientCalendarCard{border:1.5px solid color-mix(in srgb, ${accent} 35%, #d1d5db)!important;background:linear-gradient(135deg,color-mix(in srgb, ${soft} 70%, ${card}),${card})!important;}
    .calendarCardHeader{display:flex;justify-content:space-between;align-items:flex-start;gap:10px;margin-bottom:14px;}.calendarCardHeader h3{margin:0;}.calendarCardHeader span{font-size:12px;opacity:.65;}
    .eventTypeChooser{margin-bottom:12px;}.calendarFormPanel,.calendarReminderPanel{margin-top:10px;}.calendarSaveButton{margin-top:12px!important;}
    .clientTable th,.clientTable td,.dealTable th,.dealTable td{padding:11px 12px!important;border:1px solid color-mix(in srgb, ${accent} 20%, #e5e7eb)!important;text-align:left;vertical-align:top;}
    .clientTable tbody tr:hover,.dealTable tbody tr:hover{background:color-mix(in srgb, ${accent} 8%, ${card})!important;}
    .dealsKanban{overflow-x:auto;align-items:flex-start;padding-bottom:12px;}.dealsKanban .kanbanCol{min-width:330px;flex:0 0 350px;}.dealsKanban .dealRow{margin:0 0 12px;}

    .presentationSendPanel{
      padding:18px!important;
      border-radius:22px!important;
      background:linear-gradient(145deg,color-mix(in srgb, ${soft} 72%, ${card}),${card})!important;
      border:1px solid color-mix(in srgb, ${accent} 24%, #e5e7eb)!important;
      box-shadow:0 18px 46px rgba(15,23,42,.10)!important;
    }
    .presentationSendPanel .sendIntro{margin:5px 0 14px!important;line-height:1.45!important;opacity:.72!important;}
    .btn.sendWhatsApp{
      background:linear-gradient(135deg,#16a34a,#22c55e)!important;
      color:#fff!important;border:none!important;
      box-shadow:0 10px 24px rgba(34,197,94,.28)!important;
      min-height:52px!important;border-radius:16px!important;font-weight:900!important;
    }
    .btn.sendViber{
      background:linear-gradient(135deg,#665cac,#8b5cf6)!important;
      color:#fff!important;border:none!important;
      box-shadow:0 10px 24px rgba(102,92,172,.28)!important;
      min-height:52px!important;border-radius:16px!important;font-weight:900!important;
    }
    .btn.sendEmail{
      background:linear-gradient(135deg,#1e3a8a,#2563eb)!important;
      color:#fff!important;border:none!important;
      box-shadow:0 10px 24px rgba(37,99,235,.22)!important;
      min-height:52px!important;border-radius:16px!important;font-weight:900!important;
    }
    .btn.sendShare{
      background:linear-gradient(135deg,#111827,#374151)!important;
      color:#fff!important;border:none!important;
      box-shadow:0 10px 24px rgba(17,24,39,.20)!important;
      min-height:52px!important;border-radius:16px!important;font-weight:900!important;
    }
    .btn.sendWhatsApp:hover,.btn.sendViber:hover,.btn.sendEmail:hover,.btn.sendShare:hover{
      transform:translateY(-1px);filter:brightness(1.03);
    }
    @media(max-width:700px){.leadInfoGrid{grid-template-columns:1fr}.calendarCardHeader{display:block}.dealsKanban .kanbanCol{min-width:290px;flex-basis:300px}.bottom{overflow-x:auto;justify-content:flex-start}.bottom button{min-width:74px;flex:0 0 74px}.analyticsMobileTable{min-width:980px}}
  ` + (found.dark ? darkThemeCss(v) : "");
}

// Тёмная тема «Night Gold»: чёрный графит + наш жёлтый. Перекрывает светлые цвета базовых стилей.
function darkThemeCss(v){
  const accent = v["--accent"], bg = v["--soft"], card = v["--card"], text = v["--text"];
  const card2 = "#222226", line = "#303036", muted = "#B6B6BF";
  return `
    body,.layout,.mainWrap{background:${bg}!important;color:${text}!important;font-family:Manrope,Inter,system-ui,sans-serif!important;}
    .main{background:${bg}!important;box-shadow:none!important;}
    .top{background:${bg}!important;border-color:${line}!important;}
    .top h1,.top p{color:${text}!important;}
    .search{background:${card}!important;border:1px solid ${line}!important;}
    .search input{color:${text}!important;background:transparent!important;}
    .card,.sheet,.modal .sheet,.event,.stat,.mediaTile,.kanbanHead,.dealRow,.selectionBar,.igPost,.igPad{background:${card}!important;color:${text}!important;border-color:${line}!important;box-shadow:none!important;}
    .card.dark,.sidebar,.propHero{background:#0B0B0C!important;color:${text}!important;border-color:${line}!important;}
    .lead,.post,.propertyCard{background:${card}!important;color:${text}!important;border-color:${line}!important;box-shadow:none!important;}
    .kanbanCol{background:#141417!important;border-color:${line}!important;box-shadow:none!important;}
    .btn.soft,.soft,.chip,.badge,.icon,.day,.weekRow,.monthBox,.inner,.comments,.media,.phone{background:${card2}!important;color:${text}!important;border-color:${line}!important;}
    .icon{color:${text}!important;}
    .input,input,textarea,select,.field input,.field textarea,.field select,.roleSelect select{background:#121214!important;color:${text}!important;border:1px solid ${line}!important;}
    input::placeholder,textarea::placeholder{color:#7C7C85!important;}
    option{background:${card};color:${text};}
    .btn.primary,.primary,.chip.active,.badge.gold,.logo>div,.sideBtn.active{background:${accent}!important;color:#0B0B0C!important;border-color:${accent}!important;}
    .muted,.postHead span,p.muted,.card p.muted{color:${muted}!important;}
    .link{background:${card2}!important;color:${accent}!important;}
    .bottom{background:rgba(14,14,16,.94)!important;border-top:1px solid ${line}!important;}
    .bottom button{color:#8E8E96!important;background:transparent!important;}
    .bottom button.active{background:transparent!important;color:${accent}!important;}
    .bottom button.active span{filter:none;}
    .agencyTop{background:${card}!important;color:${text}!important;border:1px solid ${line}!important;}
    .clientTable th,.dealTable th{background:${card2}!important;color:${text}!important;}
    .clientTable td,.clientTable th,.dealTable td,.dealTable th{border-color:${line}!important;}
    .clientTable tbody tr:hover,.dealTable tbody tr:hover{background:${card2}!important;}
    .leadInfoCell,.leadNotesBox,.clientDetailsGrid .field,.calendarFormPanel,.calendarReminderPanel,.clientCalendarCard,.presentationSendPanel{background:${card2}!important;border-color:${line}!important;color:${text}!important;}
    .card.amber,.amber{background:#211D10!important;border-color:#4A3E12!important;color:${text}!important;}
    .mini{background:#2A2410!important;color:${text}!important;}
    .modal{background:rgba(0,0,0,.6)!important;}
    .gcalViews{background:${card2}!important;}
    .gcalViews button.active{background:${accent}!important;color:#0B0B0C!important;}
    .gcalToday,.gcalChip,.gcalTypeRow button,.gcalStatusRow button,.gcalAttBtns button,.gcalExtra a,.gcalExtra button,.gcalNotify a,.gcalNotify button,.igFilters button{border-color:${line}!important;color:${text}!important;}
    .gcalStatusRow button.on,.igFilters button.on{background:${accent}!important;color:#0B0B0C!important;border-color:${accent}!important;}
    .gcalHeadDay.today b,.gcalMCell.today .gcalMNum,.gcalAgDate.today b{background:${accent}!important;color:#0B0B0C!important;}
    .gcalHeadDay.today span,.gcalAgDate.today small{color:${accent}!important;}
    .gcalCol.today{background-color:rgba(245,197,24,.05)!important;}
    .gcalFab{background:${accent}!important;color:#0B0B0C!important;}
    .gcalAgendaEv{background:color-mix(in srgb,var(--ev) 18%,${card})!important;color:${text}!important;}
    .gcalEv.touch{background:color-mix(in srgb,var(--ev) 20%,${card})!important;color:${text}!important;}
    .gcalNotify{background:${card2}!important;}
    .gcalWarn{background:#2A2410!important;color:#FDE68A!important;}
    .igMenu{background:${card2}!important;color:${text}!important;}
    .igMenu button{color:${text}!important;}
    .igAvatar span{border-color:${card}!important;}
    .igNewBtn{background:${accent}!important;color:#0B0B0C!important;box-shadow:none!important;}
    .igCommentBox button{color:${accent}!important;}
    .igTextCard{background:linear-gradient(135deg,#0B0B0C 0%,#2A2410 60%,#5C4A0E 130%)!important;}
    .homeTile{background:${card}!important;border-color:${line}!important;}
    /* Читаемость в тёмной теме: подписи, вторичный текст, полупрозрачные счётчики */
    .field span,.sheet label,.postHead span,.phone p,.week,.monthBox span,.weekRow span,.stat span,.logo span,.leadInfoCell span,.leadNotesBox span{color:${muted}!important;opacity:1!important;}
    .field span,.sheet label{font-size:12px!important;font-weight:700!important;letter-spacing:.03em!important;}
    .screen [style*="opacity: 0.6"],.screen [style*="opacity: 0.5"],.screen [style*="opacity: 0.4"]{opacity:.85!important;}
    small,.muted,p.muted{color:${muted}!important;}
    .badge.dark{background:#2E2E34!important;color:${text}!important;}
    .kanbanCol{background:#131316!important;border:1px solid ${line}!important;}
    .lead.bkLead{background:${card}!important;border:1px solid ${line}!important;}
    .lead.bkLead:hover{border-color:#45454d!important;}
    .bkChip{background:#26262B!important;color:#D9D9DF!important;}
    .bkChip.warn{background:rgba(239,68,68,.16)!important;color:#FCA5A5!important;}
    .bkNotes{color:#C9C9D1!important;opacity:1!important;}
    h1,h2,h3,h4{color:${text};letter-spacing:-.01em;}
    .card h3{font-weight:800;}
    table th{color:#D4D4DA!important;}
    .screen [style*="rgba(255, 255, 255, 0.72)"],.screen [style*="background: rgb(255, 255, 255)"],.screen [style*="background: white"],.screen [style*="background-color: rgb(255, 255, 255)"]{background:#1C1C20!important;color:${text}!important;border-color:${line}!important;}
    table td{color:${text}!important;}
    .leadTop{color:#0B0B0C!important;}.leadTop b,.leadTop span,.leadTop p,.leadTop h3,.leadTop small,.leadTop div{color:#0B0B0C!important;}
  `;
}

// Перевод интерфейса. Переводится только фраза целиком (без замены кусков слов), поэтому
// данные клиентов не портятся и не получается смесь языков. Исходный русский текст
// запоминается у каждого элемента — переключаться можно между любыми языками.
const I18N_EDGE = /^([\s·•\-—–+*✓✎↗↻⏳▦☷✦✨⭐＋‹«▶☎🏠📄📅📊🔄🔌🔗🗑]*)(.*?)([\s:.…!?›»→]*)$/u;
let i18nCache = {lang:null, dict:null, templates:null};
// Переводы для новых разделов: дни рождения, загрузка лидов, Новобудови, аналитика руководителя
const uiNewSections = {uk:{"+ Добавить ЖК": "+ Додати ЖК", "Новобудови": "Новобудови", "Отказ": "Відмова", "Отложили": "Відклали", "Переуступка": "Переуступка", "Сдача": "Здача", "Фиксация клиента": "Фіксація клієнта", "CRM берёт бюджет, комнаты и район из заметки клиента и показывает подходящие ЖК.": "CRM бере бюджет, кімнати та район із нотатки клієнта й показує відповідні ЖК.", "Адрес": "Адреса", "Аналитика руководителя": "Аналітика керівника", "Без движения": "Без руху", "Без движения больше 7 дней": "Без руху понад 7 днів", "Без следующего контакта": "Без наступного контакту", "В подборке": "У добірці", "В подборку": "У добірку", "В работе сейчас": "Зараз у роботі", "Воронка лидов за период": "Воронка лідів за період", "Воронка, источники, менеджеры и лиды, которые теряются. Видят только директор и тех. администратор.": "Воронка, джерела, менеджери та ліди, що губляться. Бачать лише директор і тех. адміністратор.", "Вставьте список или выберите файл.": "Вставте список або оберіть файл.", "Встречи/показы": "Зустрічі/покази", "Выберите клиента": "Оберіть клієнта", "Выберите скриншоты или вставьте текст переписки.": "Оберіть скриншоти або вставте текст листування.", "Выбрать скриншоты переписки": "Обрати скриншоти листування", "Выбрать файл Excel или CSV": "Обрати файл Excel або CSV", "Дата лида": "Дата ліда", "До 10 скриншотов одной переписки. Подходят Telegram, Viber, WhatsApp, Instagram.": "До 10 скриншотів одного листування. Підходять Telegram, Viber, WhatsApp, Instagram.", "Дом сдан": "Будинок зданий", "Дубль отклонён": "Дубль відхилено", "ЖК, застройщик или адрес": "ЖК, забудовник або адреса", "За период лидов нет.": "За період лідів немає.", "Завтра ваш день рождения": "Завтра ваш день народження", "Загрузка лидов": "Завантаження лідів", "Заметка": "Нотатка", "Застройщик": "Забудовник", "Или вставьте текст переписки": "Або вставте текст листування", "Источник (если не указан в списке)": "Джерело (якщо не вказане у списку)", "Источники лидов": "Джерела лідів", "Какие площадки приводят клиентов, которые доходят до встречи и сделки.": "Які майданчики приводять клієнтів, що доходять до зустрічі та угоди.", "Клиент отдан в работу": "Клієнта передано в роботу", "Клиенты будут закреплены за вами": "Клієнти будуть закріплені за вами", "Комиссия агентства": "Комісія агентства", "Кому отдать": "Кому передати", "Конверсия лид → сделка": "Конверсія лід → угода", "Курс грн за $ (необязательно)": "Курс грн за $ (необов'язково)", "Лидов всего": "Лідів усього", "Материалы Drive": "Матеріали Drive", "Материалы застройщиков для агентств": "Матеріали забудовників для агентств", "Менеджер": "Менеджер", "Менеджеры загрузили клиентов, которые уже есть в CRM. Менеджеры этого не видят — решение за вами.": "Менеджери завантажили клієнтів, які вже є в CRM. Менеджери цього не бачать — рішення за вами.", "Не назначен": "Не призначено", "Не сохранять": "Не зберігати", "Не удалось найти клиентов. Проверьте текст или скриншот.": "Не вдалося знайти клієнтів. Перевірте текст або скриншот.", "Не указан": "Не вказано", "Новые лиды и сделки по неделям": "Нові ліди та угоди по тижнях", "Новый ЖК": "Новий ЖК", "Новых за период": "Нових за період", "Новых лидов за период": "Нових лідів за період", "Общее": "Загальне", "Определить автоматически": "Визначити автоматично", "Отдать в работу": "Передати в роботу", "Отдать дубль в работу новым лидом": "Передати дубль у роботу новим лідом", "Отказы": "Відмови", "Отклонить": "Відхилити", "Открыть карточку и историю работы": "Відкрити картку та історію роботи", "Отметьте хотя бы одного клиента.": "Позначте хоча б одного клієнта.", "Очистить": "Очистити", "Ошибка сохранения:": "Помилка збереження:", "Папки застройщиков": "Папки забудовників", "Первый взнос": "Перший внесок", "Первый взнос, %": "Перший внесок, %", "Пишите — подберу планировки и рассчитаю рассрочку.": "Пишіть — підберу планування та розрахую розстрочку.", "Платёж в месяц": "Платіж на місяць", "Площадь, м²": "Площа, м²", "По названию": "За назвою", "Подбор под клиента": "Підбір під клієнта", "Подборка новостроек от": "Добірка новобудов від", "Подборка скопирована": "Добірку скопійовано", "Подобрать ЖК": "Підібрати ЖК", "Подходящих ЖК не найдено — уточните бюджет или район в заметке клиента.": "Відповідних ЖК не знайдено — уточніть бюджет або район у нотатці клієнта.", "Поздравить": "Привітати", "Презентации": "Презентації", "Проверить список": "Перевірити список", "Проверяем список…": "Перевіряємо список…", "Пропустить дубль": "Пропустити дубль", "Просрочен следующий контакт": "Прострочено наступний контакт", "Просроченных и забытых лидов нет.": "Прострочених і забутих лідів немає.", "Просрочено": "Прострочено", "Распознать клиента": "Розпізнати клієнта", "Рассрочка": "Розстрочка", "Расчёт без удорожания. Точные условия рассрочки — в папке застройщика на Drive.": "Розрахунок без подорожчання. Точні умови розстрочки — у папці забудовника на Drive.", "Редактировать ЖК": "Редагувати ЖК", "Рейтинг менеджеров": "Рейтинг менеджерів", "С днём рождения!": "З днем народження!", "Сдан": "Зданий", "Сделки, активность и дисциплина по каждому менеджеру. «Просрочено» и «Без движения» — лиды, которые могут потеряться.": "Угоди, активність і дисципліна по кожному менеджеру. «Прострочено» та «Без руху» — ліди, які можуть загубитися.", "Сколько лидов, пришедших за период, дошли до каждого этапа, и конверсия от первого этапа.": "Скільки лідів, що прийшли за період, дійшли до кожного етапу, і конверсія від першого етапу.", "Скопировать": "Скопіювати", "Скопируйте текст": "Скопіюйте текст", "Скриншот переписки": "Скриншот листування", "Скрыть": "Приховати", "Скрыть материалы": "Приховати матеріали", "Сначала дешевле": "Спочатку дешевші", "Сортировка": "Сортування", "Сохраняем…": "Зберігаємо…", "Список / Excel": "Список / Excel", "Срок сдачи": "Термін здачі", "Срок, месяцев": "Термін, місяців", "Ссылка на DIM.RIA": "Посилання на DIM.RIA", "Ссылка на Drive": "Посилання на Drive", "Стоимость": "Вартість", "Строится": "Будується", "Требуют внимания": "Потребують уваги", "Убрать": "Прибрати", "Условия рассрочки": "Умови розстрочки", "Цена м² до, $": "Ціна м² до, $", "Цена м² от, $": "Ціна м² від, $", "Цена м², $": "Ціна м², $", "Читаем переписку…": "Читаємо листування…", "Читаем файл…": "Читаємо файл…", "Этап: Новый Лид": "Етап: Новий лід", "вашего менеджера": "вашого менеджера", "цена по запросу": "ціна за запитом", "Площадки без результатов по этому запросу:": "Майданчики без результатів за цим запитом:", "Открыть поиск на площадке": "Відкрити пошук на майданчику", "На площадке нет отдельной выдачи по этому городу": "На майданчику немає окремої видачі по цьому місту"},en:{"+ Добавить ЖК": "+ Add complex", "Новобудови": "New builds", "Отказ": "Rejected", "Отложили": "Postponed", "Переуступка": "Assignment", "Сдача": "Completion", "Фиксация клиента": "Client registration", "CRM берёт бюджет, комнаты и район из заметки клиента и показывает подходящие ЖК.": "CRM takes the budget, rooms and district from the client's note and shows matching complexes.", "Адрес": "Address", "Аналитика руководителя": "Manager dashboard", "Без движения": "Stalled", "Без движения больше 7 дней": "Stalled over 7 days", "Без следующего контакта": "No next contact", "В подборке": "In selection", "В подборку": "Add to selection", "В работе сейчас": "Active now", "Воронка лидов за период": "Lead funnel for the period", "Воронка, источники, менеджеры и лиды, которые теряются. Видят только директор и тех. администратор.": "Funnel, sources, managers and leads at risk. Visible only to the director and tech admin.", "Вставьте список или выберите файл.": "Paste a list or choose a file.", "Встречи/показы": "Meetings/viewings", "Выберите клиента": "Choose a client", "Выберите скриншоты или вставьте текст переписки.": "Choose screenshots or paste the chat text.", "Выбрать скриншоты переписки": "Choose chat screenshots", "Выбрать файл Excel или CSV": "Choose Excel or CSV file", "Дата лида": "Lead date", "До 10 скриншотов одной переписки. Подходят Telegram, Viber, WhatsApp, Instagram.": "Up to 10 screenshots of one chat. Telegram, Viber, WhatsApp, Instagram are supported.", "Дом сдан": "Completed", "Дубль отклонён": "Duplicate rejected", "ЖК, застройщик или адрес": "Complex, developer or address", "За период лидов нет.": "No leads for the period.", "Завтра ваш день рождения": "Tomorrow is your birthday", "Загрузка лидов": "Lead import", "Заметка": "Note", "Застройщик": "Developer", "Или вставьте текст переписки": "Or paste the chat text", "Источник (если не указан в списке)": "Source (if not in the list)", "Источники лидов": "Lead sources", "Какие площадки приводят клиентов, которые доходят до встречи и сделки.": "Which channels bring clients who reach a meeting and a deal.", "Клиент отдан в работу": "Client assigned", "Клиенты будут закреплены за вами": "Clients will be assigned to you", "Комиссия агентства": "Agency commission", "Кому отдать": "Assign to", "Конверсия лид → сделка": "Lead → deal conversion", "Курс грн за $ (необязательно)": "UAH per $ rate (optional)", "Лидов всего": "Total leads", "Материалы Drive": "Drive materials", "Материалы застройщиков для агентств": "Developer materials for agencies", "Менеджер": "Manager", "Менеджеры загрузили клиентов, которые уже есть в CRM. Менеджеры этого не видят — решение за вами.": "Managers uploaded clients that are already in the CRM. Managers don't see this — the decision is yours.", "Не назначен": "Unassigned", "Не сохранять": "Don't save", "Не удалось найти клиентов. Проверьте текст или скриншот.": "No clients found. Check the text or screenshot.", "Не указан": "Not set", "Новые лиды и сделки по неделям": "New leads and deals by week", "Новый ЖК": "New complex", "Новых за период": "New in period", "Новых лидов за период": "New leads in period", "Общее": "General", "Определить автоматически": "Detect automatically", "Отдать в работу": "Assign", "Отдать дубль в работу новым лидом": "Assign duplicate as a new lead", "Отказы": "Rejections", "Отклонить": "Reject", "Открыть карточку и историю работы": "Open card and history", "Отметьте хотя бы одного клиента.": "Select at least one client.", "Очистить": "Clear", "Ошибка сохранения:": "Save error:", "Папки застройщиков": "Developer folders", "Первый взнос": "Down payment", "Первый взнос, %": "Down payment, %", "Пишите — подберу планировки и рассчитаю рассрочку.": "Message me — I'll pick layouts and calculate the installment plan.", "Платёж в месяц": "Monthly payment", "Площадь, м²": "Area, m²", "По названию": "By name", "Подбор под клиента": "Match for a client", "Подборка новостроек от": "New-build selection from", "Подборка скопирована": "Selection copied", "Подобрать ЖК": "Find complexes", "Подходящих ЖК не найдено — уточните бюджет или район в заметке клиента.": "No matching complexes — refine the budget or district in the client's note.", "Поздравить": "Congratulate", "Презентации": "Presentations", "Проверить список": "Check list", "Проверяем список…": "Checking list…", "Пропустить дубль": "Skip duplicate", "Просрочен следующий контакт": "Next contact overdue", "Просроченных и забытых лидов нет.": "No overdue or forgotten leads.", "Просрочено": "Overdue", "Распознать клиента": "Recognize client", "Рассрочка": "Installment", "Расчёт без удорожания. Точные условия рассрочки — в папке застройщика на Drive.": "Calculated without markup. Exact terms are in the developer's Drive folder.", "Редактировать ЖК": "Edit complex", "Рейтинг менеджеров": "Manager leaderboard", "С днём рождения!": "Happy birthday!", "Сдан": "Completed", "Сделки, активность и дисциплина по каждому менеджеру. «Просрочено» и «Без движения» — лиды, которые могут потеряться.": "Deals, activity and discipline per manager. “Overdue” and “Stalled” are leads at risk of being lost.", "Сколько лидов, пришедших за период, дошли до каждого этапа, и конверсия от первого этапа.": "How many leads from the period reached each stage, and conversion from the first stage.", "Скопировать": "Copy", "Скопируйте текст": "Copy the text", "Скриншот переписки": "Chat screenshot", "Скрыть": "Hide", "Скрыть материалы": "Hide materials", "Сначала дешевле": "Cheapest first", "Сортировка": "Sort", "Сохраняем…": "Saving…", "Список / Excel": "List / Excel", "Срок сдачи": "Completion date", "Срок, месяцев": "Term, months", "Ссылка на DIM.RIA": "DIM.RIA link", "Ссылка на Drive": "Drive link", "Стоимость": "Price", "Строится": "Under construction", "Требуют внимания": "Need attention", "Убрать": "Remove", "Условия рассрочки": "Installment terms", "Цена м² до, $": "Price per m² to, $", "Цена м² от, $": "Price per m² from, $", "Цена м², $": "Price per m², $", "Читаем переписку…": "Reading the chat…", "Читаем файл…": "Reading file…", "Этап: Новый Лид": "Stage: New lead", "вашего менеджера": "your manager", "цена по запросу": "price on request", "Площадки без результатов по этому запросу:": "Platforms with no results for this search:", "Открыть поиск на площадке": "Open search on the platform", "На площадке нет отдельной выдачи по этому городу": "This platform has no separate listing for this city"}};
// Переводы нового календаря
const uiCalendar = {"uk": {"Расписание": "Розклад", "3 дня": "3 дні", "Сегодня": "Сьогодні", "Подписание": "Підписання", "Касания из карточек": "Дотики з карток", "Поиск: клиент, телефон, адрес...": "Пошук: клієнт, телефон, адреса...", "Только мои": "Лише мої", "Как прошло? Отметьте итог": "Як пройшло? Позначте підсумок", "Проведено": "Проведено", "Не пришёл": "Не прийшов", "Клиент не пришёл": "Клієнт не прийшов", "Просроченные касания": "Прострочені дотики", "Маршрут показов на день": "Маршрут показів на день", "Маршрут показов": "Маршрут показів", "Загрузка за период": "Завантаження за період", "Новое событие": "Нова подія", "Добавьте название": "Додайте назву", "В это время уже есть": "На цей час уже є", "Карточка": "Картка", "Клиент: имя или телефон (необязательно)": "Клієнт: ім'я або телефон (необов'язково)", "Объект из вторички (необязательно)": "Об'єкт із вторинки (необов'язково)", "Адрес или место встречи": "Адреса або місце зустрічі", "За 5 минут": "За 5 хвилин", "За 15 минут": "За 15 хвилин", "За 30 минут": "За 30 хвилин", "За 1 час": "За 1 годину", "За 2 часа": "За 2 години", "За 1 день": "За 1 день", "Заметка к событию": "Нотатка до події", "Итог": "Підсумок", "Запланировано": "Заплановано", "Перенесено": "Перенесено", "Отменено": "Скасовано", "Что сказал клиент, следующий шаг...": "Що сказав клієнт, наступний крок...", "Сохранить": "Зберегти", "В Google Календарь": "У Google Календар", "В календарь телефона": "У календар телефону", "Напомнить клиенту": "Нагадати клієнту", "Для Viber и Telegram текст копируется — вставьте его в чат.": "Для Viber і Telegram текст копіюється — вставте його в чат.", "На эти две недели событий нет. Нажмите «+», чтобы добавить.": "На ці два тижні подій немає. Натисніть «+», щоб додати.", "Свободный день — добавить событие": "Вільний день — додати подію", "Следующие 2 недели": "Наступні 2 тижні", "касание": "дотик", "мин": "хв", "ч": "год", "адр.": "адр.", "Напоминание": "Нагадування", "Добрый день": "Добрий день", "Напоминаю о встрече": "Нагадую про зустріч", "в": "о", "Раздел в разработке. Скоро здесь появятся новостройки.": "Розділ у розробці. Незабаром тут з'являться новобудови.", "Лента": "Стрічка", "Публикация": "Публікація", "За выбранный период публикаций нет.": "За вибраний період публікацій немає.", "Нравится": "Подобається", "ещё": "ще", "Посмотреть все комментарии": "Переглянути всі коментарі", "Добавьте комментарий...": "Додайте коментар...", "Опубликовать": "Опублікувати", "Редактировать": "Редагувати", "Удалить": "Видалити", "Комментарий": "Коментар", "Главная": "Головна", "Доброе утро": "Доброго ранку", "Добрый вечер": "Добрий вечір", "Новые лиды сегодня": "Нові ліди сьогодні", "Показы сегодня": "Покази сьогодні", "Просрочены касания": "Прострочені дотики", "Сделки в этом месяце": "Угоди цього місяця", "Просрочено касаний": "Прострочено дотиків", "Открыть": "Відкрити", "Статистика": "Статистика", "Аналитика": "Аналітика", "Логотип агентства": "Логотип агенції", "Добавьте логотип агентства": "Додайте логотип агенції", "Загрузить логотип": "Завантажити логотип", "Убрать логотип": "Прибрати логотип", "Убрать логотип агентства?": "Прибрати логотип агенції?", "Логотип должен быть меньше 3 МБ": "Логотип має бути меншим за 3 МБ", "Не удалось загрузить логотип": "Не вдалося завантажити логотип", "На сегодня событий нет — запланируйте звонок или показ": "На сьогодні подій немає — заплануйте дзвінок або показ", "Менеджер ушёл — база осталась": "Менеджер пішов — база лишилась", "От кого": "Від кого", "Кому": "Кому", "Выберите менеджера": "Оберіть менеджера", "Передать базу": "Передати базу", "Передаём…": "Передаємо…", "Передано": "Передано", "клиентов": "клієнтів", "объектов": "об'єктів", "событий": "подій", "сделок": "угод", "Выгрузить базу клиентов (Excel)": "Вивантажити базу клієнтів (Excel)", "Журнал действий": "Журнал дій", "Скрыть журнал": "Сховати журнал", "Все разделы": "Усі розділи", "Все сотрудники": "Усі співробітники", "Поиск в журнале": "Пошук у журналі", "Подбор объектов": "Підбір об'єктів", "Наша вторичка": "Наша вторинка", "На площадках": "На майданчиках", "Найти на площадках": "Знайти на майданчиках", "Ищем на площадках…": "Шукаємо на майданчиках…", "Открыть объявление": "Відкрити оголошення", "Актуально": "Актуально", "Не актуально": "Неактуально", "Не дозвонился": "Не додзвонився", "Подборка": "Добірка", "Комнат": "Кімнат", "Любое": "Будь-яка", "Бюджет до, $": "Бюджет до, $", "Район": "Район", "Город": "Місто", "Сделка": "Угода", "Показать все": "Показати всі", "Обновить": "Оновити", "Повторить": "Повторити", "Площадки не ответили": "Майданчики не відповіли", "Нет объявлений по этому запросу": "Немає оголошень за цим запитом", "все на площадке": "усі на майданчику", "Подобрал(а) для вас варианты": "Підібрав(ла) для вас варіанти", "Когда удобно посмотреть?": "Коли зручно подивитися?", "Объявления с площадок сначала прозвоните: отметьте «Актуально» — только тогда объект можно добавить в подборку.": "Оголошення з майданчиків спочатку прозвоніть: позначте «Актуально» — лише тоді об'єкт можна додати в добірку.", "В нашей базе подходящих объектов нет — посмотрите площадки ниже.": "У нашій базі відповідних об'єктів немає — подивіться майданчики нижче.", "Для Viber и Telegram текст копируется — вставьте его в чат. Контакты и ссылки площадок клиенту не отправляются.": "Для Viber і Telegram текст копіюється — вставте його в чат. Контакти й посилання майданчиків клієнту не надсилаються."}, "en": {"Расписание": "Schedule", "3 дня": "3 days", "Сегодня": "Today", "Подписание": "Signing", "Касания из карточек": "Follow-ups from cards", "Поиск: клиент, телефон, адрес...": "Search: client, phone, address...", "Только мои": "Only mine", "Как прошло? Отметьте итог": "How did it go? Mark the result", "Проведено": "Done", "Не пришёл": "No-show", "Клиент не пришёл": "Client didn't come", "Просроченные касания": "Overdue follow-ups", "Маршрут показов на день": "Today's viewing route", "Маршрут показов": "Viewing route", "Загрузка за период": "Workload for the period", "Новое событие": "New event", "Добавьте название": "Add title", "В это время уже есть": "Already booked at this time", "Карточка": "Card", "Клиент: имя или телефон (необязательно)": "Client: name or phone (optional)", "Объект из вторички (необязательно)": "Resale property (optional)", "Адрес или место встречи": "Address or meeting place", "За 5 минут": "5 minutes before", "За 15 минут": "15 minutes before", "За 30 минут": "30 minutes before", "За 1 час": "1 hour before", "За 2 часа": "2 hours before", "За 1 день": "1 day before", "Заметка к событию": "Event note", "Итог": "Result", "Запланировано": "Planned", "Перенесено": "Rescheduled", "Отменено": "Canceled", "Что сказал клиент, следующий шаг...": "What the client said, next step...", "Сохранить": "Save", "В Google Календарь": "To Google Calendar", "В календарь телефона": "To phone calendar", "Напомнить клиенту": "Remind client", "Для Viber и Telegram текст копируется — вставьте его в чат.": "For Viber and Telegram the text is copied — paste it into the chat.", "На эти две недели событий нет. Нажмите «+», чтобы добавить.": "No events for these two weeks. Tap “+” to add one.", "Свободный день — добавить событие": "Free day — add event", "Следующие 2 недели": "Next 2 weeks", "касание": "follow-up", "мин": "min", "ч": "h", "адр.": "addr.", "Напоминание": "Reminder", "Добрый день": "Good afternoon", "Напоминаю о встрече": "A reminder about our meeting", "в": "at", "Раздел в разработке. Скоро здесь появятся новостройки.": "Section in progress. New builds will appear here soon.", "Лента": "Feed", "Публикация": "Post", "За выбранный период публикаций нет.": "No posts for the selected period.", "Нравится": "Likes", "ещё": "more", "Посмотреть все комментарии": "View all comments", "Добавьте комментарий...": "Add a comment...", "Опубликовать": "Post", "Редактировать": "Edit", "Удалить": "Delete", "Комментарий": "Comment", "Главная": "Home", "Доброе утро": "Good morning", "Добрый вечер": "Good evening", "Новые лиды сегодня": "New leads today", "Показы сегодня": "Viewings today", "Просрочены касания": "Overdue follow-ups", "Сделки в этом месяце": "Deals this month", "Просрочено касаний": "Overdue follow-ups", "Открыть": "Open", "Статистика": "Statistics", "Аналитика": "Analytics", "Логотип агентства": "Agency logo", "Добавьте логотип агентства": "Add the agency logo", "Загрузить логотип": "Upload logo", "Убрать логотип": "Remove logo", "Убрать логотип агентства?": "Remove the agency logo?", "Логотип должен быть меньше 3 МБ": "Logo must be under 3 MB", "Не удалось загрузить логотип": "Could not upload logo", "На сегодня событий нет — запланируйте звонок или показ": "No events today — schedule a call or viewing", "Менеджер ушёл — база осталась": "Agent left — the base stays", "От кого": "From", "Кому": "To", "Выберите менеджера": "Choose a manager", "Передать базу": "Transfer base", "Передаём…": "Transferring…", "Передано": "Transferred", "клиентов": "clients", "объектов": "properties", "событий": "events", "сделок": "deals", "Выгрузить базу клиентов (Excel)": "Export client base (Excel)", "Журнал действий": "Activity log", "Скрыть журнал": "Hide log", "Все разделы": "All sections", "Все сотрудники": "All staff", "Поиск в журнале": "Search the log", "Подбор объектов": "Property matching", "Наша вторичка": "Our resale", "На площадках": "On listing sites", "Найти на площадках": "Search listing sites", "Ищем на площадках…": "Searching listing sites…", "Открыть объявление": "Open listing", "Актуально": "Available", "Не актуально": "Not available", "Не дозвонился": "No answer", "Подборка": "Selection", "Комнат": "Rooms", "Любое": "Any", "Бюджет до, $": "Budget up to, $", "Район": "District", "Город": "City", "Сделка": "Deal", "Показать все": "Show all", "Обновить": "Refresh", "Повторить": "Retry", "Площадки не ответили": "Listing sites did not respond", "Нет объявлений по этому запросу": "No listings for this request", "все на площадке": "all on the site", "Подобрал(а) для вас варианты": "I've selected some options for you", "Когда удобно посмотреть?": "When would you like to view them?", "Объявления с площадок сначала прозвоните: отметьте «Актуально» — только тогда объект можно добавить в подборку.": "Call listing-site ads first: mark “Available” — only then can the property be added to the selection.", "В нашей базе подходящих объектов нет — посмотрите площадки ниже.": "No matching properties in our base — check the listing sites below.", "Для Viber и Telegram текст копируется — вставьте его в чат. Контакты и ссылки площадок клиенту не отправляются.": "For Viber and Telegram the text is copied — paste it into the chat. Listing-site contacts and links are not sent to the client."}};
function i18nDict(lang){
  if (i18nCache.lang !== lang){
    i18nCache = {
      lang,
      dict: {...(uiPhraseTranslations[lang] || {}), ...((uiExtra && uiExtra[lang]) || {}), ...(uiNewSections[lang] || {}), ...(uiCalendar[lang] || {})},
      templates: (uiTemplates || []).map(t => [new RegExp(t[0]), lang === "uk" ? t[1] : t[2]])
    };
  }
  return i18nCache;
}
function translatePhrase(lang, value){
  if (!value || typeof value !== "string" || !/[А-Яа-яЁёІіЇїЄєҐґ]/.test(value)) return value;
  const {dict, templates} = i18nDict(lang);
  if (dict[value] !== undefined) return dict[value];
  const trimmed = value.trim();
  const lead = value.slice(0, value.indexOf(trimmed));
  const tail = value.slice(value.indexOf(trimmed) + trimmed.length);
  if (dict[trimmed] !== undefined) return lead + dict[trimmed] + tail;
  for (const [re, out] of templates){ if (re.test(trimmed)) return lead + trimmed.replace(re, out) + tail; }
  const m = trimmed.match(I18N_EDGE);
  if (m && m[2] && dict[m[2]] !== undefined) return lead + m[1] + dict[m[2]] + m[3] + tail;
  return value;
}
const I18N_ATTRS = ["placeholder","title","aria-label"];
function i18nSkip(el){
  return !el || ["SCRIPT","STYLE","TEXTAREA","CODE","PRE"].includes(el.tagName) || el.isContentEditable || !!el.closest?.("[data-no-translate]");
}
function translateNode(lang, node){
  if (node.nodeType === 3){
    if (i18nSkip(node.parentElement)) return;
    // если React поменял текст после нашего перевода — новый текст становится исходным
    if (node.__i18nOut !== node.nodeValue) node.__i18nSrc = node.nodeValue;
    const src = node.__i18nSrc;
    const next = (!lang || lang === "ru") ? src : translatePhrase(lang, src);
    node.__i18nOut = next;
    if (node.nodeValue !== next) node.nodeValue = next;
    node.__i18nOut = node.nodeValue;
    return;
  }
  if (node.nodeType !== 1 || i18nSkip(node)) return;
  for (const a of I18N_ATTRS){
    if (!node.hasAttribute(a)) continue;
    const cur = node.getAttribute(a);
    node.__i18nAttr = node.__i18nAttr || {};
    const rec = node.__i18nAttr[a] || (node.__i18nAttr[a] = {});
    if (rec.out !== cur) rec.src = cur;
    const next = (!lang || lang === "ru") ? rec.src : translatePhrase(lang, rec.src);
    rec.out = next;
    if (cur !== next) node.setAttribute(a, next);
  }
}
function translateInterfaceText(lang, root=document.body){
  if (typeof document === "undefined" || !root) return;
  if (root.nodeType === 3){ translateNode(lang, root); return; }
  translateNode(lang, root);
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT | NodeFilter.SHOW_ELEMENT);
  while (walker.nextNode()) translateNode(lang, walker.currentNode);
}
// Всплывающие окна alert/confirm: переводим фразу целиком или её начало до двоеточия («Ошибка …: текст ошибки»)
let i18nLang = "ru";
function translateMessage(msg){
  const text = String(msg ?? "");
  if (i18nLang === "ru") return text;
  const whole = translatePhrase(i18nLang, text);
  if (whole !== text) return whole;
  const i = text.indexOf(":");
  if (i > 0){
    const head = text.slice(0, i + 1);
    const out = translatePhrase(i18nLang, head);
    if (out !== head) return out + text.slice(i + 1);
  }
  return text;
}
if (typeof window !== "undefined" && !window.__i18nDialogs){
  window.__i18nDialogs = true;
  const nativeAlert = window.alert.bind(window), nativeConfirm = window.confirm.bind(window);
  window.alert = (m) => nativeAlert(translateMessage(m));
  window.confirm = (m) => nativeConfirm(translateMessage(m));
}

// Следит за экраном и переводит всё новое: окна, карточки, сообщения, выпадающие списки
let i18nObserver = null;
function watchInterfaceLanguage(lang){
  i18nLang = lang || "ru";
  if (typeof document === "undefined" || typeof MutationObserver === "undefined") return;
  i18nObserver?.disconnect();
  translateInterfaceText(lang);
  if (!lang || lang === "ru"){ i18nObserver = null; return; }
  let pending = new Set(), scheduled = false;
  const flush = () => {
    scheduled = false;
    const batch = pending; pending = new Set();
    i18nObserver?.disconnect();
    batch.forEach(n => { if (n.isConnected) translateInterfaceText(lang, n); });
    i18nObserver?.observe(document.body, {subtree:true, childList:true, characterData:true, attributes:true, attributeFilter:I18N_ATTRS});
  };
  i18nObserver = new MutationObserver(list => {
    for (const m of list){
      if (m.type === "childList") m.addedNodes.forEach(n => pending.add(n));
      else pending.add(m.target);
    }
    if (!scheduled){ scheduled = true; requestAnimationFrame(flush); }
  });
  i18nObserver.observe(document.body, {subtree:true, childList:true, characterData:true, attributes:true, attributeFilter:I18N_ATTRS});
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

function clearAnalyticsMarketCache(){
  try{
    Object.keys(localStorage||{}).filter(k=>k.startsWith("crm_market_tools_")||k.startsWith("analytics_market_")).forEach(k=>localStorage.removeItem(k));
  }catch{}
}

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

function messengerPhoneDigits(phone="") {
  return String(phone || "").replace(/\D/g, "");
}

async function ensurePublicPresentationUrl(url, prefix="presentation"){
  if (/^https?:\/\//i.test(String(url || ""))) return String(url);

  if (!String(url || "").startsWith("blob:")) {
    throw new Error("Презентация ещё не создана.");
  }

  let blob;
  try {
    const response = await fetch(url);
    if (!response.ok) throw new Error(`Не удалось прочитать локальный PDF (${response.status})`);
    blob = await response.blob();
  } catch (e) {
    throw new Error("Не удалось подготовить PDF для отправки: " + (e?.message || e));
  }

  // Supabase Storage object keys должны быть максимально безопасными:
  // только ASCII-символы. Не используем название объекта в ключе, чтобы кириллица,
  // кавычки, слэши и спецсимволы никогда не ломали загрузку.
  const safePrefix = String(prefix || "presentation")
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9_-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40) || "presentation";

  // Дополнительно добавляем уникальный ASCII id, поэтому конфликтов имён не будет.
  const uniqueId = (typeof crypto !== "undefined" && crypto.randomUUID)
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).slice(2,10)}`;

  const path = `messenger/${uniqueId}-${safePrefix}.pdf`;

  const upload = await supabase.storage.from("presentations").upload(path, blob, {
    contentType: "application/pdf",
    cacheControl: "3600",
    upsert: false
  });

  if (upload.error) {
    throw new Error(
      "Supabase не дал загрузить PDF в bucket presentations: " +
      (upload.error.message || String(upload.error))
    );
  }

  const publicUrl = supabase.storage.from("presentations").getPublicUrl(path)?.data?.publicUrl || "";
  if (!/^https?:\/\//i.test(publicUrl)) {
    throw new Error("PDF загрузился, но Supabase не вернул публичную ссылку.");
  }

  return publicUrl;
}

function presentationSendText(lang="ru", {agencyName="", clientName="", title="", isSelection=false, url=""}={}) {
  const senderAgency = String(agencyName || (lang === "en" ? "Real Estate Agency" : lang === "uk" ? "Агентство нерухомості" : "Агентство недвижимости")).trim();
  const hello = clientName ? (lang === "en" ? `Hello, ${clientName}!` : lang === "uk" ? `Вітаю, ${clientName}!` : `Здравствуйте, ${clientName}!`) : (lang === "en" ? "Hello!" : lang === "uk" ? "Вітаю!" : "Здравствуйте!");
  const body = isSelection
    ? (lang === "en" ? "We prepared a personal property selection for you." : lang === "uk" ? "Ми підготували для вас персональну добірку нерухомості." : "Мы подготовили для вас персональную подборку недвижимости.")
    : (lang === "en" ? `We prepared a property presentation${title ? `: ${title}` : ""}.` : lang === "uk" ? `Ми підготували презентацію об'єкта${title ? `: ${title}` : ""}.` : `Мы подготовили презентацию объекта${title ? `: ${title}` : ""}.`);
  const footer = lang === "en" ? `Best regards, ${senderAgency}` : lang === "uk" ? `З повагою, ${senderAgency}` : `С уважением, ${senderAgency}`;
  return `${hello}\n\n${body}\n${url || ""}\n\n${footer}`.trim();
}

async function openWhatsAppPresentation({phone,url,lang,agencyName,clientName,title,isSelection=false}) {
  const digits = messengerPhoneDigits(phone);
  if (!digits) {
    alert("У выбранного клиента не указан номер телефона.");
    return false;
  }

  try {
    const publicUrl = await ensurePublicPresentationUrl(
      url,
      isSelection ? "vip-selection" : (title || "vip-presentation")
    );
    const message = presentationSendText(lang,{
      agencyName,
      clientName,
      title,
      isSelection,
      url: publicUrl
    });
    const whatsappUrl = `https://wa.me/${digits}?text=${encodeURIComponent(message)}`;

    const opened = window.open(whatsappUrl, "_blank", "noopener,noreferrer");
    if (!opened) window.location.href = whatsappUrl;
    return true;
  } catch (e) {
    console.error("WhatsApp presentation send error:", e);
    alert("Не удалось подготовить презентацию для WhatsApp.\n\n" + (e?.message || e));
    return false;
  }
}

async function openViberPresentation({phone,url,lang,agencyName,clientName,title,isSelection=false}) {
  const digits = messengerPhoneDigits(phone);
  if (!digits) {
    alert("У выбранного клиента не указан номер телефона.");
    return false;
  }

  try {
    const publicUrl = await ensurePublicPresentationUrl(
      url,
      isSelection ? "vip-selection" : (title || "vip-presentation")
    );

    const plusPhone = "+" + digits;
    const message = presentationSendText(lang,{
      agencyName,
      clientName,
      title,
      isSelection,
      url: publicUrl
    });

    // Viber не поддерживает публичный deep-link формата WhatsApp,
    // который одновременно открывает КОНКРЕТНЫЙ номер и уже вставляет произвольный текст.
    // Поэтому делаем максимально близкую механику:
    // 1) готовое сообщение с PDF-ссылкой копируется;
    // 2) сразу открывается переписка именно с выбранным клиентом.
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(message);
      } else {
        const textarea = document.createElement("textarea");
        textarea.value = message;
        textarea.style.position = "fixed";
        textarea.style.opacity = "0";
        document.body.appendChild(textarea);
        textarea.focus();
        textarea.select();
        document.execCommand("copy");
        textarea.remove();
      }
    } catch (copyError) {
      console.warn("Viber clipboard copy failed:", copyError);
    }

    const chatUrl = `viber://chat?number=${encodeURIComponent(plusPhone)}`;

    // Сохраняем пользовательский жест максимально близко к клику:
    // сначала пробуем открыть scheme в новой навигации, затем fallback в текущем окне.
    const a = document.createElement("a");
    a.href = chatUrl;
    a.style.display = "none";
    document.body.appendChild(a);
    a.click();
    a.remove();

    // Небольшая подсказка, потому что Viber не умеет сам подставить текст в конкретный чат.
    setTimeout(() => {
      try {
        alert("Viber открыт на выбранном клиенте. Готовое сообщение с ссылкой на презентацию уже скопировано — вставь его в чат и нажми «Отправить».");
      } catch {}
    }, 700);

    return true;
  } catch (e) {
    console.error("Viber presentation send error:", e);
    alert("Не удалось подготовить презентацию для Viber.\n\n" + (e?.message || e));
    return false;
  }
}

function openEmailPresentation({email,url,lang,agencyName,clientName,title,isSelection=false}) {
  if (!email) { alert("У клиента не указан email."); return; }
  if (!url || !/^https?:\/\//i.test(url)) { alert("Для отправки по email нужна публичная ссылка на PDF."); return; }
  const subject = isSelection
    ? (lang === "en" ? `Personal property selection — ${agencyName || "Real Estate Agency"}` : lang === "uk" ? `Персональна добірка нерухомості — ${agencyName || "Агентство нерухомості"}` : `Персональная подборка недвижимости — ${agencyName || "Агентство недвижимости"}`)
    : (lang === "en" ? `Property presentation — ${title || agencyName}` : lang === "uk" ? `Презентація об'єкта — ${title || agencyName}` : `Презентация объекта — ${title || agencyName}`);
  const body = presentationSendText(lang,{agencyName,clientName,title,isSelection,url});
  window.location.href = `mailto:${encodeURIComponent(email)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}

async function nativeSharePresentation({url,downloadUrl,lang,agencyName,clientName,title,isSelection=false}) {
  const shareTitle = isSelection ? (lang === "en" ? "Personal property selection" : lang === "uk" ? "Персональна добірка нерухомості" : "Персональная подборка недвижимости") : (title || (lang === "en" ? "Property presentation" : lang === "uk" ? "Презентація об'єкта" : "Презентация объекта"));
  const text = presentationSendText(lang,{agencyName,clientName,title,isSelection,url: /^https?:\/\//i.test(url||"") ? url : ""});
  try {
    if (navigator.share) {
      let files;
      const local = downloadUrl || url;
      if (local && local.startsWith("blob:") && navigator.canShare) {
        try { const blob = await fetch(local).then(r=>r.blob()); const file = new File([blob], `${isSelection ? "property-selection" : "property-presentation"}.pdf`, {type:"application/pdf"}); if (navigator.canShare({files:[file]})) files=[file]; } catch {}
      }
      await navigator.share({title:shareTitle,text, ...(files ? {files} : (/^https?:\/\//i.test(url||"") ? {url} : {}))});
      return;
    }
    alert("На этом устройстве системная отправка не поддерживается. Используй WhatsApp или Email.");
  } catch (e) { if (e?.name !== "AbortError") alert("Не удалось открыть системное меню отправки."); }
}

function getPostTimestamp(post){
  const raw = post?.created_at || post?.createdAt || post?.date || "";
  if (!raw) return 0;
  const direct = Date.parse(raw);
  if (!Number.isNaN(direct)) return direct;
  const m = String(raw).match(/(\d{1,2})[.\/-](\d{1,2})[.\/-](\d{4})(?:[,\s]+(\d{1,2}):(\d{2}))?/);
  if (!m) return 0;
  const [,dd,mm,yyyy,hh="0",mi="0"] = m;
  return new Date(Number(yyyy),Number(mm)-1,Number(dd),Number(hh),Number(mi)).getTime();
}

function inDateRange(post, mode, from, to){
  if (!mode || mode === "all") return true;
  const ts = getPostTimestamp(post);
  if (!ts) return true;
  const now = new Date();
  const startOfDay = d => new Date(d.getFullYear(),d.getMonth(),d.getDate()).getTime();
  const endOfDay = d => new Date(d.getFullYear(),d.getMonth(),d.getDate(),23,59,59,999).getTime();
  if (mode === "day") return ts >= startOfDay(now) && ts <= endOfDay(now);
  if (mode === "week") return ts >= startOfDay(new Date(now.getFullYear(),now.getMonth(),now.getDate()-6)) && ts <= endOfDay(now);
  if (mode === "month") return ts >= new Date(now.getFullYear(),now.getMonth(),1).getTime() && ts <= endOfDay(now);
  if (mode === "custom") {
    const a = from ? new Date(from+"T00:00:00").getTime() : 0;
    const b = to ? new Date(to+"T23:59:59").getTime() : Date.now();
    return ts >= a && ts <= b;
  }
  return true;
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
  const items = [["home","Главная","⌂"],["feed","Лента","▤"],["clients","Канбан и клиенты","👥"],["calendar","Календарь","📅"],["properties","Вторичка","🏢"],["newbuilds","Новобудови","🏗"],["deals","Сделки","💼"],["analytics","Статистика/Отчетность","📊"],["tools","Аналитика","⌁"],...(canSeeHelp ? [["help","Помощь менеджерам","🔔"]] : []),...(role === "Администратор тех отдел" ? [["access","Доступы","🔐"]] : []),["more","Ещё","☰"]];
  return <aside className="sidebar"><div className="logo"><div>♛</div><section><b>CRM Real Estate</b><span>Premium SaaS</span></section></div><div className="roleBox">{role}</div>{items.map(([id,label,icon])=><button key={id} onClick={()=>setPage(id)} className={cn("sideBtn", page===id && "active")}><span>{icon}</span>{tr(lang,label)}</button>)}</aside>;
}

function Top({page,setPage,agencyName,lang,agencyId}) {
  const titles = {home:"Главная",feed:"Лента новостей",clients:"Клиенты",calendar:"Календарь",properties:"Вторичка",deals:"Сделки",analytics:"Статистика/Отчетность",tools:"Аналитика",newbuilds:"Новобудови",help:"Помощь менеджерам",access:"Доступы",more:"Еще"};
  const logo = typeof loadAgencyBrand === "function" ? loadAgencyBrand(agencyId).logo_url : "";
  return <div className="top"><div className="topLine"><div style={{minWidth:0}}><p>♛ {agencyName || "CRM Real Estate"}</p><h1>{tr(lang,titles[page])}</h1></div><button className="agencyTop" aria-label={tr(lang,"Ещё")} onClick={()=>setPage("more")}>{logo ? <img src={logo} alt="" style={{width:"100%",height:"100%",objectFit:"contain",borderRadius:12,background:"#fff"}}/> : String(agencyName || "CRM").trim().charAt(0).toUpperCase()}</button></div><div className="search">🔎 <input placeholder={tr(lang,"Поиск по CRM...")} /></div></div>;
}

function Bottom({page,setPage,lang}) {
  const items = [["home","Главная","⌂"],["feed","Лента","▤"],["clients","Клиенты","👥"],["calendar","Календарь","📅"],["properties","Объекты","🏢"],["newbuilds","Новобудови","🏗"],["deals","Сделки","💼"],["tools","Аналитика","📊"],["more","Ещё","☰"]];
  return <nav className="bottom">{items.map(([id,label,icon])=><button key={id} className={page===id ? "active" : ""} onClick={()=>setPage(id)}><span>{icon}</span>{tr(lang,label)}</button>)}</nav>;
}

// «Дни рождения» как в Telegram: сверху ленты — у кого сегодня (и завтра) день рождения.
// Каждый сотрудник может скрыть плашку крестиком только для себя (birthday_dismissals, на текущий год).
function birthdayInfo(birthDate, now = new Date()){
  if(!birthDate) return null;
  const [y,m,d] = String(birthDate).slice(0,10).split("-").map(Number);
  if(!m || !d) return null;
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  let next = new Date(now.getFullYear(), m-1, d);
  if(next < today) next = new Date(now.getFullYear()+1, m-1, d);
  const days = Math.round((next - today) / 86400000);
  return {days, year: next.getFullYear(), age: y ? next.getFullYear() - y : null, date: next};
}
function BirthdayBanner({users, currentProfile, onCongratulate}){
  const [hidden,setHidden] = useState(null);
  const year = new Date().getFullYear();
  useEffect(()=>{
    if(!currentProfile?.id){ setHidden([]); return; }
    supabase.from("birthday_dismissals").select("celebrant_id,year").eq("user_id", currentProfile.id)
      .then(({data})=>setHidden((data||[]).map(x=>`${x.celebrant_id}:${x.year}`)));
  },[currentProfile?.id]);
  if(hidden === null) return null;
  const sameAgency = u => !currentProfile?.agency_id || String(u.agency_id) === String(currentProfile.agency_id);
  const list = (users||[])
    .filter(u => u.birth_date && u.access !== false && sameAgency(u))
    .map(u => ({u, info: birthdayInfo(u.birth_date)}))
    .filter(x => x.info && x.info.days <= 1 && !hidden.includes(`${x.u.id}:${x.info.year}`))
    .sort((a,b) => a.info.days - b.info.days);
  if(!list.length) return null;
  const dismiss = async (x) => {
    setHidden(h => [...h, `${x.u.id}:${x.info.year}`]);
    if(currentProfile?.id) await supabase.from("birthday_dismissals").insert({user_id: currentProfile.id, celebrant_id: x.u.id, year: x.info.year});
  };
  return <div className="card" style={{display:"grid",gap:8,marginBottom:12}}>
    {list.map(x => {
      const me = String(x.u.id) === String(currentProfile?.id);
      const name = x.u.full_name || x.u.email;
      return <div key={x.u.id} style={{display:"flex",alignItems:"center",gap:10}}>
        <span style={{fontSize:28,lineHeight:1}} aria-hidden="true">🎂</span>
        <div style={{flex:1,minWidth:0}}>
          <b>{me ? (x.info.days === 0 ? "С днём рождения!" : "Завтра ваш день рождения") : (x.info.days === 0 ? `Сегодня день рождения: ${name}` : `Завтра день рождения: ${name}`)}</b>
          <div className="muted">{x.info.date.toLocaleDateString(undefined,{day:"numeric",month:"long"})}{x.info.age && x.info.age > 0 && x.info.age < 120 ? ` · ${x.info.age}` : ""}</div>
        </div>
        {!me && x.info.days === 0 && onCongratulate && <Button variant="soft" onClick={()=>onCongratulate?.(name)}>Поздравить</Button>}
        <button type="button" className="icon" aria-label="Скрыть" title="Скрыть" onClick={()=>dismiss(x)}>×</button>
      </div>;
    })}
  </div>;
}

// ===== Главная: «сегодня» менеджера + логотип агентства (по макету, стиль Night Gold) =====
function HomeIcon({name, size=22}){
  const p = {
    feed:<><rect x="4" y="4" width="16" height="16" rx="3"></rect><path d="M8 9h8M8 13h8M8 17h5"></path></>,
    deals:<><path d="M3 12l4-4 4 3 5-5 5 5"></path><path d="M3 20h18"></path></>,
    analytics:<><path d="M4 20V10M10 20V4M16 20v-7M22 20H2"></path></>,
    stats:<><circle cx="12" cy="12" r="9"></circle><path d="M12 3v9l6 4"></path></>,
    clock:<><circle cx="12" cy="12" r="9"></circle><path d="M12 7v5l3 2"></path></>,
    crown:<><path d="M3 18h18l-2-10-5 4-2-7-2 7-5-4z"></path></>,
    upload:<><path d="M12 16V4M7 9l5-5 5 5"></path><path d="M4 20h16"></path></>,
    users:<><circle cx="9" cy="8" r="4"></circle><path d="M2 21c0-4 3-6 7-6s7 2 7 6"></path></>,
  }[name];
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{p}</svg>;
}

function Home({leads=[], events=[], deals=[], currentProfile, role, lang, setPage, onOpenLead, agency, agencyName, onAgencyLogo, theme, setTheme}){
  const isAdmin = role === "Администратор директор" || role === "Администратор тех отдел";
  const now = new Date();
  const todayIso = calIso(now);
  const myEmail = String(currentProfile?.email || "").toLowerCase();
  const firstName = String(currentProfile?.full_name || currentProfile?.name || "").trim().split(/\s+/)[0];
  const hour = now.getHours();
  const greet = hour < 12 ? "Доброе утро" : hour < 18 ? "Добрый день" : "Добрый вечер";
  const loc = calLocale(lang);
  const dateLine = now.toLocaleDateString(loc, {weekday:"long", day:"numeric", month:"long"});
  const [uploading,setUploading] = useState(false);
  const fileRef = useRef(null);

  const active = leads.filter(l => !["Сделка","Отказ"].includes(l.status));
  const newToday = leads.filter(l => String(l.created_at || "").slice(0,10) === todayIso).length;
  const overdue = active.filter(l => { const d = calParseLeadNext(l.nextContact); return d && d < now; });
  const todayEvents = (events || []).filter(e => e.date === todayIso && (e.status || "planned") !== "canceled")
    .filter(e => isAdmin || String(e.manager_email || "").toLowerCase() === myEmail || !e.manager_email)
    .sort((a,b) => calMin(a) - calMin(b));
  const showingsToday = todayEvents.filter(e => e.type === "Показ").length;
  const monthKey = todayIso.slice(0,7);
  const dealsMonth = (deals || []).filter(d => String(d.date || "").startsWith(monthKey)).length;

  const uploadLogo = async (file) => {
    if(!file) return;
    if(file.size > 3 * 1024 * 1024){ alert(tr(lang,"Логотип должен быть меньше 3 МБ")); return; }
    setUploading(true);
    try {
      const ext = (file.name.split(".").pop() || "png").toLowerCase().replace(/[^a-z0-9]/g,"") || "png";
      const path = `agency-logos/${currentProfile?.agency_id || "agency"}-${Date.now()}.${ext}`;
      const up = await supabase.storage.from("property-media").upload(path, file, {upsert:true, contentType:file.type || undefined});
      if(up.error) throw up.error;
      const url = supabase.storage.from("property-media").getPublicUrl(path).data.publicUrl;
      const {error} = await supabase.rpc("crm_set_agency_logo", {p_url:url});
      if(error) throw error;
      onAgencyLogo && onAgencyLogo(url);
    } catch(e){ alert(tr(lang,"Не удалось загрузить логотип") + ": " + (e.message || e)); }
    setUploading(false);
  };
  const removeLogo = async () => {
    if(!window.confirm(tr(lang,"Убрать логотип агентства?"))) return;
    const {error} = await supabase.rpc("crm_set_agency_logo", {p_url:""});
    if(error){ alert(error.message); return; }
    onAgencyLogo && onAgencyLogo(null);
  };

  const tiles = [
    {label:"Новые лиды сегодня", value:newToday, go:"clients"},
    {label:"Показы сегодня", value:showingsToday, go:"calendar"},
    {label:"Просрочены касания", value:overdue.length, go:"calendar", alert:overdue.length > 0},
    {label:"Сделки в этом месяце", value:dealsMonth, go:"deals"},
  ];
  const shortcuts = [
    ["feed","Лента","feed"], ["deals","Сделки","deals"], ["tools","Аналитика","analytics"],
    ...(isAdmin ? [["analytics","Статистика","stats"]] : []),
  ];

  return <main className="screen homeScreen">
    <div className="homeHead">
      {(agency?.logo_url || loadAgencyBrand(currentProfile?.agency_id).logo_url)
        ? <img className="homeLogo" src={agency?.logo_url || loadAgencyBrand(currentProfile?.agency_id).logo_url} alt={agencyName || "Логотип агентства"}/>
        : <div className="homeLogo empty"><HomeIcon name="crown" size={22}/></div>}
      <div className="homeAgency"><b>{agencyName || "CRM Real Estate"}</b>{isAdmin && <span>{agency?.logo_url ? tr(lang,"Логотип агентства") : tr(lang,"Добавьте логотип агентства")}</span>}</div>
      {setTheme && <button className="homeIconBtn" aria-label={theme === "nightGold" ? tr(lang,"Светлая тема") : tr(lang,"Тёмная тема")} onClick={() => { const next = theme === "nightGold" ? "classic" : "nightGold"; setTheme(next); if(currentProfile?.id) supabase.from("users").update({theme:next}).eq("id", currentProfile.id); }}>
        {theme === "nightGold"
          ? <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true"><circle cx="12" cy="12" r="4"></circle><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"></path></svg>
          : <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z"></path></svg>}
      </button>}
      {isAdmin && <>
        <input ref={fileRef} type="file" accept="image/png,image/jpeg,image/webp,image/svg+xml" style={{display:"none"}} onChange={e => { uploadLogo(e.target.files?.[0]); e.target.value = ""; }}/>
        <button className="homeIconBtn" onClick={() => fileRef.current?.click()} disabled={uploading} aria-label={tr(lang,"Загрузить логотип")}>{uploading ? "…" : <HomeIcon name="upload" size={20}/>}</button>
        {agency?.logo_url && <button className="homeIconBtn" onClick={removeLogo} aria-label={tr(lang,"Убрать логотип")}>×</button>}
      </>}
    </div>

    <div className="homeHello">
      <small>{dateLine}</small>
      <h1>{tr(lang,greet)}{firstName ? `, ${firstName}` : ""}</h1>
    </div>

    <div className="homeTiles">
      {tiles.map(t => <button key={t.label} className={cn("homeTile", t.alert && "alert")} onClick={() => setPage(t.go)}>
        <span>{tr(lang,t.label)}</span><b>{t.value}</b>
      </button>)}
    </div>

    <div className="homeSection">
      <h2>{tr(lang,"Сегодня")}</h2>
      <button className="homeLink" onClick={() => setPage("calendar")}>{tr(lang,"Календарь")} ›</button>
    </div>
    <div className="homeList">
      {todayEvents.length === 0 && <button className="homeEmpty" onClick={() => setPage("calendar")}>{tr(lang,"На сегодня событий нет — запланируйте звонок или показ")}</button>}
      {todayEvents.slice(0,6).map(e => <button key={e.id} className="homeEvent" style={{"--ev":calColor(e)}} onClick={() => { const l = leads.find(x => String(x.id) === String(e.leadId)); if(l && onOpenLead) onOpenLead(l); else setPage("calendar"); }}>
        <b className="homeEvTime">{e.time}</b><i/>
        <span className="homeEvBody"><b>{tr(lang,e.type)} · {e.client || e.title}</b><small>{[e.location, isAdmin && e.manager].filter(Boolean).join(" · ") || e.title}</small></span>
      </button>)}
    </div>

    {overdue.length > 0 && <button className="homeAlert" onClick={() => setPage("calendar")}>
      <HomeIcon name="clock" size={22}/>
      <span><b>{tr(lang,"Просрочено касаний")}: {overdue.length}</b><small>{overdue.slice(0,3).map(l => l.name).join(", ")}{overdue.length > 3 ? "…" : ""}</small></span>
      <em>{tr(lang,"Открыть")}</em>
    </button>}

    <div className="homeShortcuts">
      {shortcuts.map(([id,label,icon]) => <button key={id} onClick={() => setPage(id)}><HomeIcon name={icon}/><span>{tr(lang,label)}</span></button>)}
    </div>
  </main>;
}

// ===== Пост ленты в стиле Instagram (только внешний вид; логика — в Feed) =====
function FeedPostMedia({post, onOpen, onDoubleTap}){
  const file = post.file || "";
  const kind = String(post.kind || "").toLowerCase();
  const isUrl = /^https?:\/\//i.test(file);
  const videoRef = useRef(null);
  const lastTap = useRef(0);
  const [muted,setMuted] = useState(true);
  const isVideo = kind.includes("видео") && isUrl;
  const isPhoto = kind.includes("фото") && isUrl;

  useEffect(() => {
    if(!isVideo || !videoRef.current || typeof IntersectionObserver === "undefined") return;
    const v = videoRef.current;
    const io = new IntersectionObserver(([en]) => { if(en.isIntersecting && en.intersectionRatio > 0.6) v.play().catch(()=>{}); else v.pause(); }, {threshold:[0,0.6,1]});
    io.observe(v);
    return () => io.disconnect();
  }, [isVideo, file]);

  if(!file) return null;
  const tap = () => { const t = Date.now(); if(t - lastTap.current < 320){ onDoubleTap && onDoubleTap(); lastTap.current = 0; } else lastTap.current = t; };

  if(kind.includes("ссылка") || (isUrl && !kind.includes("фото") && !kind.includes("видео") && !kind.includes("файл"))){
    const url = normalizeUrl(file);
    let host = url; try { host = new URL(url).hostname.replace(/^www\./,""); } catch {}
    return <a className="igLink" href={url} target="_blank" rel="noopener noreferrer"><span>🔗</span><section><b>{host}</b><small>{url}</small></section><i>›</i></a>;
  }
  if(isPhoto) return <div className="igMedia" onClick={tap}>
    <img src={file} alt="" loading="lazy"/>
    <button className="igExpand" onClick={e => { e.stopPropagation(); onOpen && onOpen({kind:"Фото", name:file}); }} aria-label="open">⤢</button>
  </div>;
  if(isVideo) return <div className="igMedia video" onClick={tap}>
    <video ref={videoRef} src={file} muted={muted} loop playsInline preload="metadata"/>
    <button className="igSound" onClick={e => { e.stopPropagation(); setMuted(m => !m); }} aria-label="sound">{muted ? "🔇" : "🔊"}</button>
    <button className="igExpand" onClick={e => { e.stopPropagation(); onOpen && onOpen({kind:"Видео", name:file}); }} aria-label="open">⤢</button>
  </div>;
  if(kind.includes("файл") && isUrl) return <a className="igLink" href={file} target="_blank" rel="noopener noreferrer"><span>📄</span><section><b>{decodeURIComponent(file.split("/").pop() || "Файл").replace(/^\d+-[a-z0-9]+\./,"файл.")}</b><small>Открыть файл</small></section><i>›</i></a>;
  return <div className="igPad"><Media kind={post.kind} name={file} onOpen={onOpen}/></div>;
}

function FeedPost({post, isTech, lang, onLike, onEdit, onDelete, onOpenMedia, commentValue, onCommentChange, onComment}){
  const [heart,setHeart] = useState(false);
  const [pulse,setPulse] = useState(false);
  const [moreText,setMoreText] = useState(false);
  const [allComments,setAllComments] = useState(false);
  const [menu,setMenu] = useState(false);
  const like = () => { onLike(post); setPulse(true); setTimeout(() => setPulse(false), 350); };
  const doubleTap = () => { like(); setHeart(true); setTimeout(() => setHeart(false), 800); };
  const share = async () => {
    const text = [post.text, post.file].filter(Boolean).join("\n");
    try { if(navigator.share){ await navigator.share({text}); return; } await navigator.clipboard.writeText(text); alert(tr(lang,"Ссылка скопирована")); } catch {}
  };
  const comments = post.comments || [];
  const shownComments = allComments ? comments : comments.slice(-2);
  const commentAuthor = c => typeof c === "string" ? tr(lang,"Комментарий") : (c.author_name || c.author || tr(lang,"Комментарий"));
  const commentBody = c => typeof c === "string" ? c : (c.text || c.content || c.comment || "");
  const longText = (post.text || "").length > 160;
  const hasMedia = !!post.file;
  const initial = String(post.author || "A").trim().charAt(0).toUpperCase() || "A";

  return <article className={cn("igPost", !hasMedia && "textOnly")}>
    <header className="igHead">
      <div className="igAvatar"><span>{initial}</span></div>
      <section><b>{post.author}</b><small>{post.date}</small></section>
      {isTech && <div className="igMenuWrap">
        <button className="igIconBtn" onClick={() => setMenu(m => !m)} aria-label="menu">⋯</button>
        {menu && <div className="igMenu" onMouseLeave={() => setMenu(false)}>
          <button onClick={() => { setMenu(false); onEdit(post); }}>✎ {tr(lang,"Редактировать")}</button>
          <button className="danger" onClick={() => { setMenu(false); onDelete(post); }}>🗑 {tr(lang,"Удалить")}</button>
        </div>}
      </div>}
    </header>

    {hasMedia ? <div className="igMediaWrap">
      <FeedPostMedia post={post} onOpen={onOpenMedia} onDoubleTap={doubleTap}/>
      {heart && <div className="igBigHeart">♥</div>}
    </div> : post.text && <div className="igTextCard" onDoubleClick={doubleTap}><p>{post.text}</p>{heart && <div className="igBigHeart">♥</div>}</div>}

    <div className="igActions">
      <button className={cn("igIconBtn", pulse && "pulse")} onClick={like} aria-label="like"><span className="igHeart">♥</span></button>
      <button className="igIconBtn" onClick={() => setAllComments(true)} aria-label="comments">💬</button>
      <button className="igIconBtn" onClick={share} aria-label="share">➤</button>
    </div>
    <div className="igBody">
      <b className="igLikes">{tr(lang,"Нравится")}: {post.likes || 0}</b>
      {hasMedia && post.text && <p className={cn("igCaption", !moreText && longText && "clamp")}><b>{post.author}</b> {post.text}</p>}
      {hasMedia && longText && !moreText && <button className="igMore" onClick={() => setMoreText(true)}>{tr(lang,"ещё")}</button>}
      {comments.length > 2 && !allComments && <button className="igMore" onClick={() => setAllComments(true)}>{tr(lang,"Посмотреть все комментарии")} ({comments.length})</button>}
      {shownComments.map((c,i) => <p className="igComment" key={i}><b>{commentAuthor(c)}</b> {commentBody(c)}{typeof c !== "string" && c.created_at ? <small> · {new Date(c.created_at).toLocaleDateString()}</small> : null}</p>)}
      <div className="igCommentBox">
        <input placeholder={tr(lang,"Добавьте комментарий...")} value={commentValue || ""} onChange={e => onCommentChange(e.target.value)} onKeyDown={e => { if(e.key === "Enter") onComment(post); }}/>
        {(commentValue || "").trim() && <button onClick={() => onComment(post)}>{tr(lang,"Опубликовать")}</button>}
      </div>
    </div>
  </article>;
}

function Feed({posts,setPosts,role,currentProfile,lang,users}) {
  const isTech = role === "Администратор тех отдел";
  const [open,setOpen] = useState(false);
  const [draft,setDraft] = useState({text:"",kind:"Фото",file:""});
  const [fileObj,setFileObj] = useState(null);
  const [viewer,setViewer] = useState(null);
  const [editPost,setEditPost] = useState(null);
  const [commentText,setCommentText] = useState({});
  const [dateMode,setDateMode] = useState("all");
  const [dateFrom,setDateFrom] = useState("");
  const [dateTo,setDateTo] = useState("");
  const visiblePosts = posts.filter(p=>inDateRange(p,dateMode,dateFrom,dateTo));

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

  return <main className="screen"><BirthdayBanner users={users} currentProfile={currentProfile} onCongratulate={!isTech ? null : name=>{setDraft(d=>({...d,text:`С днём рождения, ${name}! 🎉`,kind:"Текст"}));setOpen(true);}}/><div className="feedList igFeed">
    <div className="igTopBar">
      <h2>{tr(lang,"Лента")}</h2>
      {isTech && <button className="igNewBtn" onClick={()=>setOpen(true)}>＋ {tr(lang,"Публикация")}</button>}
    </div>
    <div className="igFilters">
      {[["all","Все"],["day","День"],["week","Неделя"],["month","Месяц"],["custom","Период"]].map(([id,label])=><button key={id} className={cn(dateMode===id&&"on")} onClick={()=>setDateMode(id)}>{tr(lang,label)}</button>)}
    </div>
    {dateMode==="custom"&&<div className="card igPeriod"><div className="grid2"><Field label={tr(lang,"Дата от")}><input className="input" type="date" value={dateFrom} onChange={e=>setDateFrom(e.target.value)}/></Field><Field label={tr(lang,"Дата до")}><input className="input" type="date" value={dateTo} onChange={e=>setDateTo(e.target.value)}/></Field></div></div>}

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

    {visiblePosts.length===0 && <div className="card igEmpty">{tr(lang,"За выбранный период публикаций нет.")}</div>}
    {visiblePosts.map(post=><FeedPost key={post.id} post={post} isTech={isTech} lang={lang}
      onLike={toggleLike} onEdit={setEditPost} onDelete={deletePost} onOpenMedia={setViewer}
      commentValue={commentText[post.id]} onCommentChange={v=>setCommentText(prev=>({...prev,[post.id]:v}))} onComment={addComment}/>)}

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



function Clients({leads,setLeads,onOpen,currentProfile,role,users,lang}) {
  const [stage,setStage] = useState("Все");
  const [phone,setPhone] = useState(null);
  const [managerFilter,setManagerFilter] = useState("Все");
  const [search,setSearch] = useState("");
  const [viewMode,setViewMode] = useStorage("clients_view_mode","kanban");
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
      created_at:new Date().toISOString(),
      history:[`Новый клиент. Ответственный: ${managerName}`]
    };
    onOpen(lead);
  };

  const filteredLeads = leads.filter(l => {
    const stageOk = stage === "Все" || l.status === stage;
    const managerOk = !canFilterManagers || managerFilter === "Все" || String(l.manager_email || "") === String(managerFilter) || String(l.manager || "") === String(managerFilter);
    const q = search.trim().toLowerCase().replace(/\s+/g,"");
    const searchable = `${l.name||""} ${l.phone||""}`.toLowerCase().replace(/\s+/g,"");
    const searchOk = !q || searchable.includes(q);
    return stageOk && managerOk && searchOk;
  });

  const groups = stage === "Все" ? stages : [stage];

  const move = (lead, targetStage=null) => {
    const next = targetStage || stages[Math.min(stages.indexOf(lead.status)+1, stages.length-1)];
    setLeads(prev => prev.map(l => l.id===lead.id ? {...l,status:next,history:[...(l.history || []),`Перемещен в стадию: ${next}`]} : l));
  };

  return <main className="screen">
    <div className="card clientSearchBar">
      <div className="search" style={{margin:0}}>🔎 <input value={search} onChange={e=>setSearch(e.target.value)} placeholder={tr(lang,"Поиск клиента по имени или телефону...")} /></div>
    </div>
    <div className="row">
      <Button onClick={create}>+ {tr(lang,"Создать клиента")}</Button>
      <div className="grid2" style={{maxWidth:280, minWidth:240}}>
        <Button variant={viewMode==="kanban"?"primary":"soft"} onClick={()=>setViewMode("kanban")}>{tr(lang,"Канбан")}</Button>
        <Button variant={viewMode==="list"?"primary":"soft"} onClick={()=>setViewMode("list")}>{tr(lang,"Список")}</Button>
      </div>
      <select className="input" style={{maxWidth:280}} value={stage} onChange={e=>setStage(e.target.value)}>
        <option>Все</option>
        {stages.map(s=><option key={s}>{s}</option>)}
      </select>
      {canFilterManagers && <select className="input" style={{maxWidth:320}} value={managerFilter} onChange={e=>setManagerFilter(e.target.value)}>
        <option value="Все">Все менеджеры</option>
        {managerOptions.map(m=><option key={m.email || m.name} value={m.email || m.name}>{m.name}{m.email ? ` — ${m.email}` : ""}</option>)}
      </select>}
    </div>

    {viewMode === "list" && <div className="card" style={{overflowX:"auto"}}>
      <div className="row"><h3>{tr(lang,"Список клиентов")}</h3>{badge(filteredLeads.length,"gold")}</div>
      {filteredLeads.length === 0 && <p className="muted">{tr(lang,"Нет клиентов по выбранному фильтру")}</p>}
      {filteredLeads.length > 0 && <table className="clientTable" style={{width:"100%",borderCollapse:"collapse",minWidth:1050}}>
        <thead><tr>
          {[tr(lang,"Имя клиента"),tr(lang,"Телефон"),tr(lang,"Статус"),tr(lang,"Источник"),tr(lang,"Следующий контакт"),tr(lang,"Ответственный"),tr(lang,"Заметки"),tr(lang,"Действия")].map(h=><th key={h} style={{textAlign:"left",padding:"12px",borderBottom:"1px solid"}}>{h}</th>)}
        </tr></thead>
        <tbody>{filteredLeads.map(l=><tr key={l.id} style={{cursor:"pointer"}} onDoubleClick={()=>onOpen(l)}>
          <td style={{padding:"10px",borderBottom:"1px solid"}}><b>{l.name || tr(lang,"Без имени")}</b><div className="muted">{l.id}</div></td>
          <td style={{padding:"10px",borderBottom:"1px solid"}}>{l.phone || ""}</td>
          <td style={{padding:"10px",borderBottom:"1px solid"}}>{tr(lang,l.status || "")}</td>
          <td style={{padding:"10px",borderBottom:"1px solid"}}>{tr(lang,l.source || "")}</td>
          <td style={{padding:"10px",borderBottom:"1px solid"}}>{l.nextContact || "—"}</td>
          <td style={{padding:"10px",borderBottom:"1px solid"}}>{l.manager || tr(lang,"не назначен")}</td>
          <td style={{padding:"10px",borderBottom:"1px solid",maxWidth:260,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{l.notes || tr(lang,"Без заметки")}</td>
          <td style={{padding:"10px",borderBottom:"1px solid"}}><div style={{display:"flex",gap:6}}>
            <Button variant="soft" onClick={()=>setPhone(l.phone)}>☎</Button>
            <Button variant="green" onClick={()=>setPhone(l.phone)}>W</Button>
            <Button onClick={()=>onOpen(l)}>{tr(lang,"Открыть")}</Button>
          </div></td>
        </tr>)}</tbody>
      </table>}
    </div>}

    {viewMode === "kanban" && <div className="kanban" style={{overflowX:"auto", alignItems:"flex-start", paddingBottom:12}}>
      {groups.map(s=>{
        const list = filteredLeads.filter(l => l.status === s);
        return <section className="kanbanCol" key={s} style={{minWidth:300, maxWidth:360, flex:"0 0 330px"}}
          onDragOver={e=>e.preventDefault()}
          onDrop={e=>{
            const id = e.dataTransfer.getData("leadId");
            const lead = leads.find(l=>String(l.id)===String(id));
            if (lead) move(lead, s);
          }}>
          <div className="kanbanHead bkColHead"><b>{tr(lang,s)}</b><span className="bkCount">{list.length}</span></div>
          {list.map(l=>{
            // Карточка клиента в стиле Briky: имя, телефон, следующий контакт, менеджер, заметка, действия
            const nd = calParseLeadNext(l.nextContact);
            const overdue = nd && nd < new Date();
            const ndText = nd ? nd.toLocaleString(lang==="en"?"en-GB":lang==="uk"?"uk-UA":"ru-RU",{day:"numeric",month:"short",hour:"2-digit",minute:"2-digit"}) : tr(lang,"не назначен");
            const initial = String(l.name || "?").trim().charAt(0).toUpperCase();
            return <div className="lead bkLead" key={l.id} draggable onDragStart={e=>e.dataTransfer.setData("leadId", l.id)}>
            <button className="bkLeadHead" onClick={()=>onOpen(l)}>
              <span className="bkAva">{initial}</span>
              <span className="bkLeadName"><b>{l.name || tr(lang,"Без имени")}</b><small>№{l.id} · {tr(lang,l.source||"—")}</small></span>
            </button>
            {l.phone && <a className="bkPhone" href={`tel:${String(l.phone).replace(/[^\d+]/g,"")}`}>{l.phone}</a>}
            <div className="bkMeta">
              <span className={cn("bkChip", overdue && "warn")} title={tr(lang,"Следующий контакт")}>{overdue ? "⚠ " : "⏰ "}{ndText}</span>
              <span className="bkChip" title={tr(lang,"Ответственный")}>{l.manager || tr(lang,"не назначен")}</span>
            </div>
            {l.notes && <p className="bkNotes">{l.notes}</p>}
            <div className="bkActions">
              <button className="bkIcon" aria-label={tr(lang,"Позвонить")} onClick={()=>setPhone(l.phone)}>☎</button>
              <button className="bkIcon viber" aria-label="Viber" onClick={()=>setPhone(l.phone)}>V</button>
              <button className="bkIcon wa" aria-label="WhatsApp" onClick={()=>setPhone(l.phone)}>W</button>
              <button className="bkIcon" aria-label={tr(lang,"Открыть карточку")} onClick={()=>onOpen(l)}>✎</button>
              <button className="bkNext" onClick={()=>move(l)}>{tr(lang,"Дальше")} →</button>
            </div>
          </div>;})}
        </section>
      })}
    </div>}

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
    <a className="btn full" style={{background:"#229ED9",color:"#fff",border:0}} href={`https://t.me/+${digits}`} target="_blank" rel="noopener noreferrer">Telegram</a>
    <div className="card amber">Если Viber на компьютере не открылся, проверь Viber Desktop. На телефоне ссылка откроет приложение.</div>
  </Modal>;
}



// ===== Подбор объектов под клиента: наша вторичка + объявления с площадок (Аналитика). Объявление с площадки — сначала прозвонить =====
const MATCH_SOURCES = ["OLX","DIM.RIA Украина","RIELTOR.UA"];
const CHECK_LABELS = {actual:"Актуально", not_actual:"Не актуально", no_answer:"Не дозвонился"};
const matchRooms = p => { const m = String(p.type || p.property_type || "").match(/^(\d)/); return m ? Number(m[1]) : (Number(p.rooms) || 0); };
const matchMoney = n => n ? `$${Math.round(Number(n)).toLocaleString("ru-RU")}` : "цена по запросу";

function ClientMatch({lead, properties=[], currentProfile, agencyName, lang, onClose}){
  const parsed = nbParseRequest(`${lead.notes || ""}`);
  const [rooms,setRooms] = useState(parsed.rooms || "");
  const [budget,setBudget] = useState(parsed.budget || "");
  const [district,setDistrict] = useState("");
  const [city,setCity] = useState("Одесса");
  const [deal,setDeal] = useState(/аренд|оренд|снять|зняти/i.test(lead.notes || "") ? "Аренда" : "Продажа");
  const [picked,setPicked] = useState({}); // key -> item
  const [market,setMarket] = useState(null); // {bySource:[{source,total,items}], loading, error}
  const [checks,setChecks] = useState({}); // source_url -> status
  const [showAllOwn,setShowAllOwn] = useState(false);
  const leadDbId = /^\d+$/.test(String(lead.id)) ? Number(lead.id) : null;
  const myName = currentProfile?.full_name || currentProfile?.name || "";

  useEffect(() => {
    if(!leadDbId) return;
    supabase.from("listing_checks").select("source_url,status,created_at").eq("lead_id", leadDbId).order("created_at",{ascending:true})
      .then(({data}) => { const m = {}; (data || []).forEach(r => { m[r.source_url] = r.status; }); setChecks(m); });
  }, [leadDbId]);

  const b = Number(String(budget).replace(/[^\d]/g,"")) || 0;
  const r = Number(rooms) || 0;
  const d = district.trim().toLowerCase();
  const own = (properties || []).filter(p => String(p.status || "").toLowerCase() !== "продан")
    .map(p => {
      let score = 0;
      if(b){ if(Number(p.price) > b * 1.07) return null; score += 1 - Math.abs(b - Number(p.price || 0)) / b; }
      if(r){ const pr = matchRooms(p); if(pr && pr !== r) return null; if(pr === r) score += 1; }
      if(d){ if(!String(p.district || "").toLowerCase().includes(d) && !String(p.title || "").toLowerCase().includes(d)) return null; score += 1; }
      return {p, score};
    }).filter(Boolean).sort((a,b2) => b2.score - a.score);
  const ownShown = showAllOwn ? own : own.slice(0,8);

  const searchMarket = async () => {
    setMarket({loading:true, bySource:[]});
    const {data,error} = await supabase.functions.invoke("analytics-live-search-v3", {body:{
      country:"Украина", region:"", city, district:district.trim(), property_type:"", deal_type:deal,
      rooms:r || null, price_from:null, price_to:b || null, area_from:null, area_to:null, floor_from:null, floor_to:null,
      complex:"", programs:false, page:1, pages:1, sources:MATCH_SOURCES
    }});
    if(error){ setMarket({loading:false, bySource:[], error:error.message || String(error)}); return; }
    const results = Array.isArray(data?.results) ? data.results : [];
    setMarket({loading:false, bySource:results.map(x => ({source:x.source, total:x.total, ok:x.ok !== false, url:x.url || "", items:(x.items || []).filter(it => it.source_url).slice(0,12)}))});
  };

  const setCheck = async (item, status) => {
    setChecks(prev => ({...prev, [item.source_url]:status}));
    if(status !== "actual") setPicked(prev => { const n = {...prev}; delete n["m:" + item.source_url]; return n; });
    if(!leadDbId) return;
    const {error} = await supabase.from("listing_checks").insert({lead_id:leadDbId, source_name:item.source_name, source_url:item.source_url, title:item.title || null,
      price:Number(item.price) || null, status, checked_by_email:currentProfile?.email || null, checked_by_name:myName || null});
    if(error) console.warn("listing_checks:", error.message);
  };
  const togglePick = (key, item) => setPicked(prev => { const n = {...prev}; if(n[key]) delete n[key]; else n[key] = item; return n; });

  const pickedList = Object.values(picked);
  const lineFor = (it) => {
    const parts = [it.rooms ? `${it.rooms}-к` : "", it.area ? `${Math.round(it.area)} м²` : "", it.district || ""].filter(Boolean).join(", ");
    return `${it.title && !parts ? it.title : parts}${it.floor ? ` · ${it.floor} эт.` : ""} — ${matchMoney(it.price)}`;
  };
  const messageText = () => {
    const first = String(lead.name || "").split(" ")[0];
    const lines = pickedList.map((it,i) => `${i+1}. ${lineFor(it)}`);
    return `${tr(lang,"Добрый день")}${first ? ", " + first : ""}! ${tr(lang,"Подобрал(а) для вас варианты")}:\n${lines.join("\n")}\n\n${tr(lang,"Когда удобно посмотреть?")}${myName ? `\n${myName}` : ""}${agencyName ? `, ${agencyName}` : ""}`;
  };
  const digits = String(lead.phone || "").replace(/[^\d]/g,"");
  const copyText = async () => { try { await navigator.clipboard.writeText(messageText()); } catch {} };

  return <Modal onClose={onClose} wide>
    <div className="row"><h2>{tr(lang,"Подбор объектов")}</h2><button className="icon" onClick={onClose}>×</button></div>
    <p className="muted" style={{marginTop:0}}>{lead.name} · {tr(lang,"запрос из заметки клиента — можно поправить")}</p>
    <div className="matchCriteria">
      <Field label={tr(lang,"Комнат")}><select className="input" value={rooms} onChange={e => setRooms(e.target.value)}><option value="">{tr(lang,"Любое")}</option>{[1,2,3,4,5].map(n => <option key={n} value={n}>{n}</option>)}</select></Field>
      <Field label={tr(lang,"Бюджет до, $")}><input className="input" inputMode="numeric" value={budget} onChange={e => setBudget(e.target.value)} placeholder="80000"/></Field>
      <Field label={tr(lang,"Район")}><input className="input" value={district} onChange={e => setDistrict(e.target.value)} placeholder={tr(lang,"Аркадия, Центр…")}/></Field>
      <Field label={tr(lang,"Город")}><input className="input" value={city} onChange={e => setCity(e.target.value)}/></Field>
      <Field label={tr(lang,"Сделка")}><select className="input" value={deal} onChange={e => setDeal(e.target.value)}><option>Продажа</option><option>Аренда</option></select></Field>
    </div>

    <div className="matchBlock">
      <div className="matchBlockHead"><h3>{tr(lang,"Наша вторичка")}</h3><span className="badge gold">{own.length}</span></div>
      {own.length === 0 && <p className="muted">{tr(lang,"В нашей базе подходящих объектов нет — посмотрите площадки ниже.")}</p>}
      {ownShown.map(({p}) => { const key = "o:" + p.id; return <label key={key} className={cn("matchItem", picked[key] && "on")}>
        <input type="checkbox" checked={!!picked[key]} onChange={() => togglePick(key, {title:p.title, rooms:matchRooms(p), area:p.area, district:p.district, floor:p.floor, price:p.price, own:true})}/>
        <span><b>{p.title}</b><small>{[p.type, p.area ? `${p.area} м²` : "", p.district, p.floor ? `${p.floor} эт.` : ""].filter(Boolean).join(" · ")}</small></span>
        <em>{matchMoney(p.price)}</em>
      </label>; })}
      {own.length > 8 && !showAllOwn && <Button variant="soft" onClick={() => setShowAllOwn(true)}>{tr(lang,"Показать все")} ({own.length})</Button>}
    </div>

    <div className="matchBlock">
      <div className="matchBlockHead"><h3>{tr(lang,"На площадках")}</h3><span className="muted">OLX · DIM.RIA · RIELTOR</span></div>
      <div className="matchNotice">☎ {tr(lang,"Объявления с площадок сначала прозвоните: отметьте «Актуально» — только тогда объект можно добавить в подборку.")}</div>
      {!market && <Button className="full" onClick={searchMarket}>{tr(lang,"Найти на площадках")}</Button>}
      {market?.loading && <p className="muted">{tr(lang,"Ищем на площадках…")}</p>}
      {market?.error && <p className="muted">{tr(lang,"Площадки не ответили")}: {market.error} · <button className="linkBtn" onClick={searchMarket}>{tr(lang,"Повторить")}</button></p>}
      {market && !market.loading && !market.error && <>
        <div className="matchSummary">{market.bySource.map(s => <span key={s.source}>{s.source}: <b>{s.ok ? (s.total ?? s.items.length) : "—"}</b></span>)}</div>
        {market.bySource.map(s => <div key={s.source} className="matchSource">
          <h4>{s.source}{s.url && <a href={s.url} target="_blank" rel="noopener noreferrer"> · {tr(lang,"все на площадке")} ›</a>}</h4>
          {s.items.length === 0 && <p className="muted">{tr(lang,"Нет объявлений по этому запросу")}</p>}
          {s.items.map(it => { const key = "m:" + it.source_url; const st = checks[it.source_url]; return <div key={key} className={cn("matchItem","market", st && "st-"+st, picked[key] && "on")}>
            <input type="checkbox" disabled={st !== "actual"} checked={!!picked[key]} onChange={() => togglePick(key, it)} aria-label={tr(lang,"В подборку")}/>
            <span>
              <b>{lineFor(it)}</b>
              <small>{it.title}</small>
              <span className="matchActions">
                <a href={it.source_url} target="_blank" rel="noopener noreferrer">{tr(lang,"Открыть объявление")} ›</a>
                {["actual","not_actual","no_answer"].map(k => <button key={k} className={cn(st === k && "on")} onClick={() => setCheck(it, k)}>{tr(lang,CHECK_LABELS[k])}</button>)}
              </span>
            </span>
          </div>; })}
        </div>)}
        <Button variant="soft" onClick={searchMarket}>↻ {tr(lang,"Обновить")}</Button>
      </>}
    </div>

    <div className="matchSend">
      <h3>{tr(lang,"Подборка")}: {pickedList.length}</h3>
      {pickedList.length > 0 && <pre className="matchPreview">{messageText()}</pre>}
      <div className="matchSendBtns">
        <a className={cn("btn sendViber", !pickedList.length && "disabled")} href={pickedList.length ? `viber://chat?number=%2B${digits}` : undefined} onClick={copyText}>Viber</a>
        <a className={cn("btn", !pickedList.length && "disabled")} style={{background:"#229ED9",color:"#fff",border:0}} href={pickedList.length ? `https://t.me/+${digits}` : undefined} target="_blank" rel="noopener noreferrer" onClick={copyText}>Telegram</a>
        <a className={cn("btn sendWhatsApp", !pickedList.length && "disabled")} href={pickedList.length ? `https://wa.me/${digits}?text=${encodeURIComponent(messageText())}` : undefined} target="_blank" rel="noopener noreferrer">WhatsApp</a>
        <Button variant="soft" onClick={copyText} disabled={!pickedList.length}>{tr(lang,"Скопировать")}</Button>
      </div>
      <p className="muted" style={{fontSize:12}}>{tr(lang,"Для Viber и Telegram текст копируется — вставьте его в чат. Контакты и ссылки площадок клиенту не отправляются.")}</p>
    </div>
  </Modal>;
}

function LeadModal({lead,setLeads,setEvents,setHelp,help,onClose,role,users,currentProfile,onOpenLead,properties=[],agencyName="",lang="ru"}) {
  const [local,setLocal] = useState(lead);
  const [showMatch,setShowMatch] = useState(false);
  // Связи «дубль ↔ исходный клиент» — только для администраторов (менеджеру таблица недоступна)
  const isAdminRole = role === "Администратор директор" || role === "Администратор тех отдел";
  const [dupLinks,setDupLinks] = useState([]);
  useEffect(()=>{
    if(!isAdminRole || String(lead.id).startsWith("L-")) return;
    supabase.from("lead_duplicates").select("id,lead_id,duplicate_of,status,created_at").or(`lead_id.eq.${lead.id},duplicate_of.eq.${lead.id}`).neq("status","rejected")
      .then(({data})=>setDupLinks(data||[]));
  },[lead.id,isAdminRole]);
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

  const dupOf = dupLinks.filter(d=>String(d.lead_id)===String(lead.id));
  const dupCopies = dupLinks.filter(d=>String(d.duplicate_of)===String(lead.id) && d.lead_id);
  const dupPending = dupLinks.filter(d=>String(d.duplicate_of)===String(lead.id) && d.status==="pending");
  return <Modal onClose={onClose} wide>
    {isAdminRole && (dupOf.length>0 || dupCopies.length>0 || dupPending.length>0) && <div className="card" style={{margin:"0 0 10px",display:"grid",gap:6}}>
      <b>Дубль (видит только администратор)</b>
      {dupOf.map(d=><div key={d.id} className="row"><span>{`Этот клиент — дубль клиента №${d.duplicate_of}`}</span><Button variant="soft" onClick={()=>onOpenLead?.(d.duplicate_of)}>{`Открыть №${d.duplicate_of}`}</Button></div>)}
      {dupCopies.map(d=><div key={d.id} className="row"><span>{`Повторный лид по этому клиенту: №${d.lead_id}`}</span><Button variant="soft" onClick={()=>onOpenLead?.(d.lead_id)}>{`Открыть №${d.lead_id}`}</Button></div>)}
      {dupPending.length>0 && <span className="muted">{`Повторных заявок на проверке: ${dupPending.length}`}</span>}
    </div>}
    <div className="row"><section><label>Имя клиента</label><input className="titleInput" value={local.name} onChange={e=>setLocal({...local,name:e.target.value})}/><p className="muted">{local.id}</p></section><button className="icon" onClick={onClose}>×</button></div>

    <div className="formGrid clientDetailsGrid">
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
    <Button className="full matchOpenBtn" onClick={()=>setShowMatch(true)}>🔎 Подобрать объекты</Button>
    {showMatch && <ClientMatch lead={local} properties={properties} currentProfile={currentProfile} agencyName={agencyName} lang={lang} onClose={()=>setShowMatch(false)}/>}

    <div className="card">
      <h3>История работы с клиентом</h3>
      <textarea className="input" placeholder="Написать комментарий себе по клиенту..." value={workComment} onChange={e=>setWorkComment(e.target.value)}/>
      <Button className="full" onClick={addWorkComment}>Добавить комментарий в историю</Button>
      {(local.history || []).map((h,i)=><p className="muted" key={i}>• {h}</p>)}
    </div>

    <div className="card inner clientCalendarCard">
      <div className="calendarCardHeader"><h3>📅 Календарь клиента</h3><span>Звонок · встреча · показ · задача</span></div>
      <div className="grid4 eventTypeChooser">{eventTypes.map(t=><Button key={t} variant={event.type===t?"primary":"soft"} onClick={()=>setEvent({...event,type:t})}>{t}</Button>)}</div>
      <div className="calendarFormPanel"><div className="grid3"><Field label="Дата следующего касания"><input className="input" type="date" value={event.date} onChange={e=>setEvent({...event,date:e.target.value})}/></Field><Field label="Время"><input className="input" type="time" value={event.time} onChange={e=>setEvent({...event,time:e.target.value})}/></Field><Field label="Название"><input className="input" placeholder="Название" value={event.title} onChange={e=>setEvent({...event,title:e.target.value})}/></Field></div>
      </div><div className="calendarReminderPanel"><div className="grid2"><Field label="Напомнить за"><select className="input" value={event.reminder} onChange={e=>setEvent({...event,reminder:e.target.value})}><option value="5">5 минут</option><option value="15">15 минут</option><option value="30">30 минут</option><option value="60">1 час</option><option value="120">2 часа</option><option value="1440">1 день</option></select></Field><Field label="Звук"><select className="input" value={event.sound} onChange={e=>setEvent({...event,sound:e.target.value})}>{soundOptions.map(o=><option key={o.id} value={o.id}>{o.label}</option>)}</select></Field></div></div>
      <Button className="full calendarSaveButton" onClick={addEvent}>Сохранить событие</Button>
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

// ===== Календарь в стиле Google Calendar (события хранятся в Supabase, таблица calendar) =====
const CAL_TYPES = {
  "Звонок":{c:"#2563eb",i:"📞"},
  "Встреча":{c:"#7c3aed",i:"🤝"},
  "Показ":{c:"#15803d",i:"🏠"},
  "Задача":{c:"#b45309",i:"✅"},
  "Подписание":{c:"#b91c1c",i:"✍️"},
  "Касание":{c:"#475569",i:"⏰"}
};
const CAL_EVENT_TYPES = ["Звонок","Встреча","Показ","Задача","Подписание"];
const CAL_STATUSES = [["planned","Запланировано"],["done","Проведено"],["moved","Перенесено"],["noshow","Клиент не пришёл"],["canceled","Отменено"]];
const CAL_DURATIONS = [15,30,45,60,90,120,180];
const CAL_START_H = 7, CAL_END_H = 23, CAL_HOUR_PX = 52;
const calPad = n => String(n).padStart(2,"0");
const calIso = d => `${d.getFullYear()}-${calPad(d.getMonth()+1)}-${calPad(d.getDate())}`;
const calAddDays = (d,n) => { const x = new Date(d); x.setDate(x.getDate()+n); return x; };
const calDayStart = d => new Date(d.getFullYear(), d.getMonth(), d.getDate());
const calWeekStart = d => calAddDays(calDayStart(d), -((d.getDay()+6)%7));
const calStart = e => new Date(`${e.date}T${e.time || "09:00"}:00`);
const calMin = e => { const [h,m] = String(e.time || "09:00").split(":").map(Number); return (h||0)*60 + (m||0); };
const calColor = e => (CAL_TYPES[e.type] || CAL_TYPES["Задача"]).c;
const calIcon = e => (CAL_TYPES[e.type] || CAL_TYPES["Задача"]).i;
const calLocale = lang => lang === "uk" ? "uk-UA" : lang === "en" ? "en-GB" : "ru-RU";
function calParseLeadNext(s){ if(!s) return null; const d = new Date(String(s).trim().replace(" ","T")); return isNaN(d) ? null : d; }

function calDbToEvent(r){
  const s = r.start_at ? new Date(r.start_at) : new Date();
  const en = r.end_at ? new Date(r.end_at) : null;
  return {
    id:String(r.id), dbId:r.id,
    leadId:r.lead_id ? String(r.lead_id) : "", propertyId:r.property_id ? String(r.property_id) : "",
    client:r.client_name || "", type:r.event_type || "Задача", title:r.title || "",
    date:calIso(s), time:`${calPad(s.getHours())}:${calPad(s.getMinutes())}`,
    duration:en ? Math.max(15, Math.round((en - s)/60000)) : 60,
    reminder:r.reminder_before ?? 60, sound:r.sound || "classic",
    manager:r.manager_name || "", manager_email:r.manager_email || "",
    status:r.status || "planned", location:r.location || "", result:r.result || "",
    description:r.description || "", created_by:r.created_by ?? null
  };
}
function calEventToDb(e, profile){
  const s = calStart(e);
  const dur = Number(e.duration) || 60;
  const num = v => /^\d+$/.test(String(v || "")) ? Number(v) : null;
  const row = {
    title:e.title || e.type, event_type:e.type,
    lead_id:num(e.leadId), property_id:num(e.propertyId),
    start_at:s.toISOString(), end_at:new Date(s.getTime() + dur*60000).toISOString(),
    reminder_before:Number(e.reminder) || 60, description:e.description || null,
    manager_name:e.manager || null, manager_email:e.manager_email || null,
    status:e.status || "planned", location:e.location || null, result:e.result || null,
    sound:e.sound || "classic", client_name:e.client || null, updated_at:new Date().toISOString()
  };
  if(!e.dbId) row.created_by = num(profile?.id);
  return row;
}
const calComparable = e => JSON.stringify({...e, notified:undefined});

// Хранилище событий: Supabase вместо localStorage, чтобы календарь был общим для всех устройств и руководителя.
// API такой же, как у прежнего useStorage("events"): [events, setEvents], поэтому остальной код не меняется.
function useCalendarEvents(profile){
  const [events,setRaw] = useState([]);
  const ref = useRef([]);
  const pending = useRef(new Set());
  const readNotified = () => { try { return new Set(JSON.parse(localStorage.getItem("events_notified") || "[]")); } catch { return new Set(); } };

  const load = async () => {
    if(!profile) return;
    const {data,error} = await supabase.from("calendar").select("*").order("start_at", {ascending:true});
    if(error){ console.warn("calendar load:", error.message); return; }
    const nt = readNotified();
    const loaded = (data || []).map(r => ({...calDbToEvent(r), notified:nt.has(String(r.id))}));
    const unsaved = ref.current.filter(e => !e.dbId); // ещё сохраняются — не теряем
    ref.current = [...unsaved, ...loaded];
    setRaw(ref.current);
  };

  // Разовый перенос событий, которые раньше хранились только в браузере этого телефона. Старая копия не удаляется.
  const migrate = async () => {
    try {
      if(localStorage.getItem("events_migrated_v1")) return;
      const old = JSON.parse(localStorage.getItem("events") || "[]");
      const real = (Array.isArray(old) ? old : []).filter(e => e && e.date && !["EV-1","EV-2"].includes(e.id));
      if(real.length){
        const {error} = await supabase.from("calendar").insert(real.map(e => calEventToDb(e, profile)));
        if(error){ console.warn("calendar migrate:", error.message); return; }
      }
      localStorage.setItem("events_migrated_v1", "1");
    } catch(err){ console.warn(err); }
  };

  useEffect(() => {
    if(!profile?.id) return;
    (async () => { await migrate(); await load(); })();
    const onVis = () => { if(document.visibilityState === "visible") load(); };
    document.addEventListener("visibilitychange", onVis);
    const t = setInterval(load, 180000); // запасной вариант, основное — живое обновление ниже
    let rt = null;
    const channel = supabase.channel("crm-calendar-live")
      .on("postgres_changes", {event:"*", schema:"public", table:"calendar"}, () => {
        if (rt) return;
        rt = setTimeout(() => { rt = null; if (document.visibilityState === "visible") load(); }, 1000);
      })
      .subscribe();
    return () => { document.removeEventListener("visibilitychange", onVis); clearInterval(t); if (rt) clearTimeout(rt); supabase.removeChannel(channel); };
  }, [profile?.id]);

  const setEvents = (next) => {
    const prev = ref.current;
    const arr = typeof next === "function" ? next(prev) : next;
    ref.current = arr; setRaw(arr);
    try { const nt = readNotified(); arr.forEach(e => { if(e.notified) nt.add(String(e.id)); }); localStorage.setItem("events_notified", JSON.stringify([...nt].slice(-500))); } catch {}
    const prevById = new Map(prev.map(e => [String(e.id), e]));
    const nextIds = new Set(arr.map(e => String(e.id)));
    prev.forEach(e => {
      if(!nextIds.has(String(e.id)) && e.dbId) supabase.from("calendar").delete().eq("id", e.dbId).then(({error}) => { if(error) alert("Ошибка удаления события: " + error.message); });
    });
    arr.forEach(e => {
      const key = String(e.id);
      if(!e.dbId){
        if(pending.current.has(key)) return;
        pending.current.add(key);
        supabase.from("calendar").insert(calEventToDb(e, profile)).select().single().then(({data,error}) => {
          pending.current.delete(key);
          if(error){ alert("Ошибка сохранения события: " + error.message); ref.current = ref.current.filter(x => String(x.id) !== key); setRaw(ref.current); return; }
          const latest = ref.current.find(x => String(x.id) === key) || e;
          const saved = {...latest, ...calDbToEvent(data), notified:!!latest.notified};
          ref.current = ref.current.map(x => String(x.id) === key ? saved : x); setRaw(ref.current);
        });
        return;
      }
      const old = prevById.get(key);
      if(old && calComparable(old) !== calComparable(e)) supabase.from("calendar").update(calEventToDb(e, profile)).eq("id", e.dbId).then(({error}) => { if(error) alert("Ошибка сохранения события: " + error.message); });
    });
  };
  return [events, setEvents, load];
}

// Раскладка пересекающихся событий по колонкам, как в Google Calendar
function calLayout(list){
  const items = [...list].sort((a,b) => calMin(a) - calMin(b));
  const out = []; let cluster = []; let lanesEnd = []; let clusterEnd = -1;
  const flush = () => { const n = Math.max(1, lanesEnd.length); cluster.forEach(c => { c.lanes = n; out.push(c); }); cluster = []; lanesEnd = []; clusterEnd = -1; };
  items.forEach(e => {
    const s = calMin(e), en = s + Math.max(20, Number(e.duration) || 60);
    if(cluster.length && s >= clusterEnd) flush();
    let lane = lanesEnd.findIndex(x => x <= s);
    if(lane < 0){ lane = lanesEnd.length; lanesEnd.push(en); } else lanesEnd[lane] = en;
    cluster.push({e, lane}); clusterEnd = Math.max(clusterEnd, en);
  });
  if(cluster.length) flush();
  return out;
}
const calUtc = d => d.toISOString().replace(/[-:]/g,"").replace(/\.\d{3}/,"");
function calGoogleLink(e, phone){
  const s = calStart(e), en = new Date(s.getTime() + (Number(e.duration)||60)*60000);
  const details = [e.client && `Клиент: ${e.client}`, phone && `Телефон: ${phone}`, e.description].filter(Boolean).join("\n");
  return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(e.title || e.type)}&dates=${calUtc(s)}/${calUtc(en)}&details=${encodeURIComponent(details)}&location=${encodeURIComponent(e.location || "")}`;
}
function calDownloadIcs(e, phone){
  const s = calStart(e), en = new Date(s.getTime() + (Number(e.duration)||60)*60000);
  const esc = v => String(v || "").replace(/\\/g,"\\\\").replace(/\n/g,"\\n").replace(/[,;]/g, m => "\\" + m);
  const body = ["BEGIN:VCALENDAR","VERSION:2.0","PRODID:-//CRM Real Estate//RU","BEGIN:VEVENT",`UID:${e.id}@crm-real-estate`,`DTSTAMP:${calUtc(new Date())}`,`DTSTART:${calUtc(s)}`,`DTEND:${calUtc(en)}`,`SUMMARY:${esc(e.title || e.type)}`,`LOCATION:${esc(e.location)}`,`DESCRIPTION:${esc([e.client && "Клиент: " + e.client, phone && "Телефон: " + phone, e.description].filter(Boolean).join("\n"))}`,"BEGIN:VALARM",`TRIGGER:-PT${Number(e.reminder)||30}M`,"ACTION:DISPLAY","DESCRIPTION:Напоминание","END:VALARM","END:VEVENT","END:VCALENDAR"].join("\r\n");
  const a = document.createElement("a");
  a.href = URL.createObjectURL(new Blob([body], {type:"text/calendar;charset=utf-8"}));
  a.download = `${(e.title || "event").replace(/[^\wА-Яа-яЁёІіЇїЄєҐґ -]/g,"").slice(0,40) || "event"}.ics`;
  document.body.appendChild(a); a.click(); a.remove();
}
const calMapsLink = loc => `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(loc)}`;
function calRouteLink(locs){
  if(locs.length === 1) return calMapsLink(locs[0]);
  const last = locs[locs.length-1], mid = locs.slice(0,-1);
  return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(last)}&waypoints=${encodeURIComponent(mid.join("|"))}&travelmode=driving`;
}

function Calendar({events,setEvents,leads,setLeads,onOpenLead,currentProfile,role,lang,properties=[],users=[]}) {
  const isAdmin = role === "Администратор тех отдел" || role === "Администратор директор";
  const narrow = typeof window !== "undefined" && window.innerWidth < 700;
  const [view,setView] = useState(() => { try { return localStorage.getItem("cal_view") || (narrow ? "agenda" : "week"); } catch { return narrow ? "agenda" : "week"; } });
  useEffect(() => { try { localStorage.setItem("cal_view", view); } catch {} }, [view]);
  const [cursor,setCursor] = useState(() => new Date());
  const [open,setOpen] = useState(null);
  const [search,setSearch] = useState("");
  const [typeFilter,setTypeFilter] = useState([]);
  const [managerFilter,setManagerFilter] = useState("all");
  const [showTouches,setShowTouches] = useState(true);
  const [leadQuery,setLeadQuery] = useState("");
  const [showNotify,setShowNotify] = useState(false);
  const [, setTick] = useState(0);
  useEffect(() => { const t = setInterval(() => setTick(x => x+1), 60000); return () => clearInterval(t); }, []);
  const gridRef = useRef(null);
  const touchRef = useRef(null);

  const loc = calLocale(lang);
  const now = new Date();
  const todayIso = calIso(now);
  const myEmail = String(currentProfile?.email || "").toLowerCase();
  const myName = currentProfile?.full_name || currentProfile?.name || "";
  const leadById = useMemo(() => new Map((leads||[]).map(l => [String(l.id), l])), [leads]);
  const propById = useMemo(() => new Map((properties||[]).map(p => [String(p.id), p])), [properties]);

  // «Касания» — дата следующего контакта из карточек клиентов, автоматически видна в календаре
  const touches = useMemo(() => (leads||[]).filter(l => !["Сделка","Отказ"].includes(l.status)).map(l => {
    const d = calParseLeadNext(l.nextContact); if(!d) return null;
    return {id:"T-"+l.id, virtual:true, leadId:String(l.id), client:l.name, type:"Касание", title:l.name, date:calIso(d), time:`${calPad(d.getHours())}:${calPad(d.getMinutes())}`, duration:30, manager:l.manager, manager_email:l.manager_email, status:"planned"};
  }).filter(Boolean), [leads]);

  const isMine = e => (e.manager_email && String(e.manager_email).toLowerCase() === myEmail) || (!e.manager_email && e.manager === myName);
  const matchesManager = e => managerFilter === "all" ? true : managerFilter === "me" ? isMine(e) : e.manager === managerFilter;
  const q = search.trim().toLowerCase();
  const real = (events||[]).map(e => ({...e, status:e.status || "planned", duration:Number(e.duration) || 60}));
  const all = [...real, ...(showTouches ? touches.filter(t => !real.some(e => String(e.leadId) === t.leadId && e.date === t.date && e.time === t.time)) : [])];
  const shown = all.filter(e =>
    (typeFilter.length === 0 || typeFilter.includes(e.type)) && matchesManager(e) &&
    (!q || `${e.title} ${e.client} ${leadById.get(String(e.leadId))?.phone || ""} ${e.location || ""}`.toLowerCase().includes(q))
  );
  const byDay = {};
  shown.forEach(e => { (byDay[e.date] = byDay[e.date] || []).push(e); });
  Object.values(byDay).forEach(list => list.sort((a,b) => calMin(a) - calMin(b)));

  const managerNames = isAdmin ? [...new Set([...(users||[]).map(u => u.full_name).filter(Boolean), ...real.map(e => e.manager).filter(Boolean)])].sort() : [];
  const endOf = e => calStart(e).getTime() + (Number(e.duration)||60)*60000;
  const waitingResult = real.filter(e => e.status === "planned" && endOf(e) < now.getTime() && (isAdmin ? matchesManager(e) : true)).sort((a,b) => endOf(b) - endOf(a));
  const overdueTouches = touches.filter(t => calStart(t) < now && matchesManager(t)).sort((a,b) => calStart(a) - calStart(b));

  const step = dir => {
    const d = new Date(cursor);
    if(view === "month") d.setMonth(d.getMonth()+dir, 1);
    else if(view === "week") d.setDate(d.getDate()+7*dir);
    else if(view === "3day") d.setDate(d.getDate()+3*dir);
    else if(view === "agenda") d.setDate(d.getDate()+14*dir);
    else d.setDate(d.getDate()+dir);
    setCursor(d);
  };
  const gridDays = view === "day" ? [calDayStart(cursor)] : view === "3day" ? [0,1,2].map(i => calAddDays(calDayStart(cursor), i)) : Array.from({length:7}, (_,i) => calAddDays(calWeekStart(cursor), i));
  const fmt = (d, o) => d.toLocaleDateString(loc, o);
  const cap = s => s ? s[0].toUpperCase() + s.slice(1) : s;
  const title = view === "month" ? cap(fmt(cursor, {month:"long", year:"numeric"}))
    : view === "day" ? cap(fmt(cursor, {weekday:"short", day:"numeric", month:"long"}))
    : view === "agenda" ? cap(fmt(cursor, {month:"long", year:"numeric"}))
    : `${fmt(gridDays[0], {day:"numeric", month:"short"})} – ${fmt(gridDays[gridDays.length-1], {day:"numeric", month:"short"})}`;

  useEffect(() => {
    if(!gridRef.current) return;
    const h = Math.max(CAL_START_H, Math.min(now.getHours() - 1, 18));
    gridRef.current.scrollTop = (h - CAL_START_H) * CAL_HOUR_PX;
  }, [view]);

  const onTouchStart = ev => { const t = ev.touches[0]; touchRef.current = {x:t.clientX, y:t.clientY}; };
  const onTouchEnd = ev => {
    const s = touchRef.current; touchRef.current = null; if(!s) return;
    const t = ev.changedTouches[0]; const dx = t.clientX - s.x, dy = t.clientY - s.y;
    if(Math.abs(dx) > 70 && Math.abs(dy) < 45) step(dx < 0 ? 1 : -1);
  };

  const create = (date, time, extra={}) => {
    const t = time || `${calPad(Math.min(21, Math.max(8, now.getHours()+1)))}:00`;
    setLeadQuery(""); setShowNotify(false);
    setOpen({leadId:"", propertyId:"", type:"Звонок", title:"", date:date || calIso(cursor), time:t, duration:30, reminder:30, sound:"classic", status:"planned", location:"", result:"", description:"", manager:myName, manager_email:currentProfile?.email || "", notified:false, ...extra});
  };
  const openEvent = e => {
    if(e.virtual){ const l = leadById.get(String(e.leadId)); if(l && onOpenLead) onOpenLead(l); return; }
    setLeadQuery(""); setShowNotify(false); setOpen({...e});
  };

  const canEditOpenEvent = open && (!open.id || isAdmin || String(open.manager_email || "").toLowerCase() === myEmail);
  const selectedLead = open ? leadById.get(String(open.leadId)) : null;
  const selectedProp = open ? propById.get(String(open.propertyId)) : null;
  const saveEvent = () => {
    const lead = leadById.get(String(open.leadId));
    const ev = {...open, id:open.id || "EV-"+Date.now(), client:lead?.name || "", title:(open.title || "").trim() || `${open.type}${lead ? ` — ${lead.name}` : ""}`, manager:open.manager || myName, manager_email:open.manager_email || currentProfile?.email || ""};
    setEvents(prev => open.id ? prev.map(e => e.id === open.id ? ev : e) : [ev, ...prev]);
    setOpen(null);
  };
  const deleteOpenEvent = () => { if(!open || !canEditOpenEvent) return; if(!window.confirm(tr(lang,"Удалить событие?"))) return; setEvents(prev => prev.filter(e => String(e.id) !== String(open.id))); setOpen(null); };
  const setQuickStatus = (e, status) => setEvents(prev => prev.map(x => String(x.id) === String(e.id) ? {...x, status} : x));
  const conflicts = open ? real.filter(e => String(e.id) !== String(open.id) && e.date === open.date && e.status !== "canceled" && String(e.manager_email || e.manager) === String(open.manager_email || open.manager) && calMin(e) < calMin(open) + (Number(open.duration)||60) && calMin(open) < calMin(e) + (Number(e.duration)||60)) : [];
  const leadMatches = (() => {
    const qq = leadQuery.trim().toLowerCase().replace(/\s+/g,"");
    if(!qq) return [];
    return (leads||[]).filter(l => `${l.name||""}${l.phone||""}`.toLowerCase().replace(/\s+/g,"").includes(qq)).slice(0,8);
  })();
  const clientText = e => {
    const d = calStart(e);
    const when = `${fmt(d, {weekday:"long", day:"numeric", month:"long"})} ${tr(lang,"в")} ${e.time}`;
    const first = (e.client || "").split(" ")[0];
    return `${tr(lang,"Добрый день")}${first ? ", " + first : ""}! ${tr(lang,"Напоминаю о встрече")}: ${when}.${e.location ? ` ${tr(lang,"Адрес")}: ${e.location}.` : ""}${myName ? ` ${myName}` : ""}`;
  };
  const phoneDigits = p => String(p || "").replace(/[^\d]/g,"");
  const copy = async text => { try { await navigator.clipboard.writeText(text); } catch {} };

  // Напоминания: только по своим запланированным событиям
  useEffect(() => {
    const timer = setInterval(() => {
      const current = Date.now();
      (events||[]).forEach(ev => {
        if(!ev.date || !ev.time || ev.notified || (ev.status && ev.status !== "planned") || !isMine(ev)) return;
        const start = calStart(ev).getTime();
        const remindMs = (Number(ev.reminder) || 60) * 60 * 1000;
        if(current >= start - remindMs && current <= start + 60 * 1000){
          playReminderSound(ev.sound || "classic");
          alert(`${tr(lang,"Напоминание")}: ${ev.title || ev.type}\n${ev.date} ${ev.time}${ev.location ? "\n" + ev.location : ""}`);
          setEvents(prev => prev.map(x => x.id === ev.id ? {...x, notified:true} : x));
        }
      });
    }, 30000);
    return () => clearInterval(timer);
  }, [events]);

  const EvLine = ({e}) => {
    const lead = leadById.get(String(e.leadId));
    const st = CAL_STATUSES.find(s => s[0] === e.status);
    return <button className={cn("gcalAgendaEv", e.virtual && "touch", e.status !== "planned" && "st-"+e.status)} style={{"--ev":calColor(e)}} onClick={() => openEvent(e)}>
      <div className="gcalAgTime"><b>{e.time}</b><small>{e.virtual ? tr(lang,"касание") : `${e.duration} ${tr(lang,"мин")}`}</small></div>
      <div className="gcalAgBody">
        <b>{calIcon(e)} {e.title}</b>
        <span>{[e.virtual ? lead?.status : (e.client && e.client !== e.title ? e.client : ""), e.location, isAdmin && e.manager].filter(Boolean).join(" · ")}</span>
      </div>
      {!e.virtual && e.status !== "planned" && st && <span className="gcalStatus">{tr(lang, st[1])}</span>}
    </button>;
  };

  const renderGrid = () => {
    const hours = Array.from({length:CAL_END_H - CAL_START_H}, (_,i) => CAL_START_H + i);
    const height = hours.length * CAL_HOUR_PX;
    const cols = `46px repeat(${gridDays.length}, minmax(0,1fr))`;
    const nowTop = (now.getHours()*60 + now.getMinutes() - CAL_START_H*60) / 60 * CAL_HOUR_PX;
    return <div className="card gcalGridCard">
      <div className="gcalGridHead" style={{gridTemplateColumns:cols}}>
        <div/>
        {gridDays.map(d => { const iso = calIso(d); const cnt = (byDay[iso]||[]).length; return <button key={iso} className={cn("gcalHeadDay", iso === todayIso && "today")} onClick={() => { setCursor(d); setView("day"); }}>
          <span>{fmt(d, {weekday:"short"})}</span><b>{d.getDate()}</b>{view !== "day" && cnt > 0 && <i>{cnt}</i>}
        </button>; })}
      </div>
      <div className="gcalGridBody" ref={gridRef} onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}>
        <div className="gcalGridInner" style={{gridTemplateColumns:cols, height}}>
          <div className="gcalHours">{hours.map(h => <div key={h} style={{height:CAL_HOUR_PX}}><span>{calPad(h)}:00</span></div>)}</div>
          {gridDays.map(d => {
            const iso = calIso(d);
            return <div key={iso} className={cn("gcalCol", iso === todayIso && "today")} style={{height, backgroundSize:`100% ${CAL_HOUR_PX}px`}} onClick={ev => {
              if(ev.target !== ev.currentTarget) return;
              const y = ev.clientY - ev.currentTarget.getBoundingClientRect().top;
              const mins = CAL_START_H*60 + Math.max(0, Math.floor(y / CAL_HOUR_PX * 2)) * 30;
              create(iso, `${calPad(Math.floor(mins/60))}:${calPad(mins%60)}`);
            }}>
              {iso === todayIso && nowTop >= 0 && nowTop <= height && <div className="gcalNow" style={{top:nowTop}}/>}
              {calLayout(byDay[iso] || []).map(({e,lane,lanes}) => {
                const top = Math.min(height - 22, Math.max(0, (calMin(e) - CAL_START_H*60) / 60 * CAL_HOUR_PX));
                const h = Math.max(22, (Number(e.duration)||60) / 60 * CAL_HOUR_PX - 2);
                return <button key={e.id} className={cn("gcalEv", e.virtual && "touch", e.status !== "planned" && "st-"+e.status)} style={{top, height:h, left:`calc(${lane/lanes*100}% + 2px)`, width:`calc(${100/lanes}% - 4px)`, "--ev":calColor(e)}} onClick={() => openEvent(e)}>
                  <b>{e.status === "done" ? "✓ " : ""}{e.title}</b>
                  {h > 36 && <span>{e.time}{e.location ? ` · ${e.location}` : e.client && e.client !== e.title ? ` · ${e.client}` : ""}</span>}
                </button>;
              })}
            </div>;
          })}
        </div>
      </div>
    </div>;
  };

  const renderMonth = () => {
    const days = monthGrid(cursor.getFullYear(), cursor.getMonth());
    return <div className="card gcalMonth" onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}>
      <div className="gcalMonthHead">{week.map(w => <b key={w}>{tr(lang,w)}</b>)}</div>
      <div className="gcalMonthGrid">{days.map(d => {
        const evs = byDay[d.iso] || [];
        return <div key={d.iso} className={cn("gcalMCell", !d.current && "other", d.iso === todayIso && "today")} onClick={() => { setCursor(new Date(d.iso + "T12:00:00")); setView("day"); }}>
          <span className="gcalMNum">{d.day}</span>
          {evs.slice(0, narrow ? 2 : 3).map(e => <span key={e.id} className={cn("gcalMEv", e.virtual && "touch")} style={{"--ev":calColor(e)}}>{narrow ? "" : e.time + " "}{e.title}</span>)}
          {evs.length > (narrow ? 2 : 3) && <span className="gcalMore">+{evs.length - (narrow ? 2 : 3)}</span>}
        </div>;
      })}</div>
    </div>;
  };

  const renderAgenda = () => {
    const start = calDayStart(cursor);
    const days = Array.from({length:14}, (_,i) => calAddDays(start, i));
    const withEvents = days.filter(d => (byDay[calIso(d)] || []).length || calIso(d) === todayIso);
    return <div onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}>
      {withEvents.length === 0 && <div className="card gcalEmpty">{tr(lang,"На эти две недели событий нет. Нажмите «+», чтобы добавить.")}</div>}
      {withEvents.map(d => {
        const iso = calIso(d); const evs = byDay[iso] || [];
        const showings = evs.filter(e => e.type === "Показ" && e.location && e.status !== "canceled");
        return <div key={iso} className="gcalAgDay">
          <button className={cn("gcalAgDate", iso === todayIso && "today")} onClick={() => { setCursor(d); setView("day"); }}>
            <small>{fmt(d, {weekday:"short"})}</small><b>{d.getDate()}</b>
          </button>
          <div className="gcalAgList">
            {evs.length === 0 && <button className="gcalAgEmpty" onClick={() => create(iso)}>{tr(lang,"Свободный день — добавить событие")}</button>}
            {evs.map(e => <EvLine key={e.id} e={e}/>)}
            {showings.length > 1 && <a className="gcalRoute" href={calRouteLink(showings.map(e => e.location))} target="_blank" rel="noreferrer">🗺 {tr(lang,"Маршрут показов")} ({showings.length})</a>}
          </div>
        </div>;
      })}
      <Button className="full" variant="soft" onClick={() => step(1)}>{tr(lang,"Следующие 2 недели")} ›</Button>
    </div>;
  };

  const dayShowings = view === "day" ? (byDay[calIso(cursor)] || []).filter(e => e.type === "Показ" && e.location && e.status !== "canceled") : [];
  const rangeEvents = (view === "week" || view === "3day") ? gridDays.flatMap(d => (byDay[calIso(d)] || []).filter(e => !e.virtual)) : [];
  const load = {};
  rangeEvents.forEach(e => { const k = e.manager || tr(lang,"Не назначен"); load[k] = (load[k] || 0) + 1; });

  return <main className="screen gcal" style={{maxWidth:"100%"}}>
    <div className="card gcalTop">
      <div className="gcalBar">
        <button className="gcalToday" onClick={() => setCursor(new Date())}>{tr(lang,"Сегодня")}</button>
        <button className="gcalNav" aria-label="prev" onClick={() => step(-1)}>‹</button>
        <button className="gcalNav" aria-label="next" onClick={() => step(1)}>›</button>
        <h2 className="gcalTitle">{title}</h2>
      </div>
      <div className="gcalViews">{[["agenda","Расписание"],["day","День"],["3day","3 дня"],["week","Неделя"],["month","Месяц"]].map(([id,label]) => <button key={id} className={cn(view === id && "active")} onClick={() => setView(id)}>{tr(lang,label)}</button>)}</div>
      <div className="gcalChips">
        {CAL_EVENT_TYPES.map(t => <button key={t} className={cn("gcalChip", typeFilter.includes(t) && "on")} style={{"--ev":CAL_TYPES[t].c}} onClick={() => setTypeFilter(f => f.includes(t) ? f.filter(x => x !== t) : [...f, t])}><i/>{tr(lang,t)}</button>)}
        <button className={cn("gcalChip", showTouches && "on")} style={{"--ev":CAL_TYPES["Касание"].c}} onClick={() => setShowTouches(v => !v)}><i/>{tr(lang,"Касания из карточек")}</button>
      </div>
      <div className="gcalFilters">
        <div className="search" style={{margin:0, flex:1}}>🔎 <input value={search} onChange={e => setSearch(e.target.value)} placeholder={tr(lang,"Поиск: клиент, телефон, адрес...")}/></div>
        {isAdmin && <select className="input gcalMgr" value={managerFilter} onChange={e => setManagerFilter(e.target.value)}>
          <option value="all">{tr(lang,"Все менеджеры")}</option><option value="me">{tr(lang,"Только мои")}</option>
          {managerNames.map(m => <option key={m} value={m}>{m}</option>)}
        </select>}
      </div>
    </div>

    {(waitingResult.length > 0 || overdueTouches.length > 0) && (view === "agenda" || view === "day") && calIso(cursor) === todayIso && <div className="card gcalAttention">
      {waitingResult.length > 0 && <>
        <h3>📝 {tr(lang,"Как прошло? Отметьте итог")} <span className="badge gold">{waitingResult.length}</span></h3>
        {waitingResult.slice(0,4).map(e => <div key={e.id} className="gcalAttRow">
          <button className="gcalAttMain" onClick={() => openEvent(e)}><b>{calIcon(e)} {e.title}</b><span>{e.date} · {e.time}</span></button>
          <div className="gcalAttBtns"><button onClick={() => setQuickStatus(e,"done")}>✓ {tr(lang,"Проведено")}</button><button onClick={() => setQuickStatus(e,"noshow")}>✗ {tr(lang,"Не пришёл")}</button><button onClick={() => openEvent(e)}>↻</button></div>
        </div>)}
      </>}
      {overdueTouches.length > 0 && <>
        <h3>⏰ {tr(lang,"Просроченные касания")} <span className="badge">{overdueTouches.length}</span></h3>
        {overdueTouches.slice(0,5).map(t => <div key={t.id} className="gcalAttRow">
          <button className="gcalAttMain" onClick={() => openEvent(t)}><b>{t.client}</b><span>{t.date} · {t.time}{isAdmin && t.manager ? ` · ${t.manager}` : ""}</span></button>
          <div className="gcalAttBtns"><button onClick={() => create(todayIso, null, {leadId:t.leadId, type:"Звонок"})}>+ {tr(lang,"Звонок")}</button></div>
        </div>)}
      </>}
    </div>}

    {view === "day" && dayShowings.length > 0 && <a className="card gcalRouteCard" href={calRouteLink(dayShowings.map(e => e.location))} target="_blank" rel="noreferrer">🗺 <b>{tr(lang,"Маршрут показов на день")}</b><span>{dayShowings.length} {tr(lang,"адр.")} · Google Maps</span></a>}
    {isAdmin && Object.keys(load).length > 0 && <div className="gcalLoad">{tr(lang,"Загрузка за период")}: {Object.entries(load).sort((a,b) => b[1]-a[1]).map(([m,c]) => <span key={m}>{m} · <b>{c}</b></span>)}</div>}

    {view === "agenda" && renderAgenda()}
    {(view === "day" || view === "3day" || view === "week") && renderGrid()}
    {view === "month" && renderMonth()}

    <button className="gcalFab" onClick={() => create(calIso(cursor) < todayIso ? todayIso : calIso(cursor))} aria-label={tr(lang,"Новое событие")}>+</button>

    {open && <Modal onClose={() => setOpen(null)} wide>
      <div className="gcalSheetHead" style={{"--ev":calColor(open)}}>
        <i/><h2>{open.id ? tr(lang,"Событие") : tr(lang,"Новое событие")}</h2>
        <button className="icon" onClick={() => setOpen(null)}>×</button>
      </div>
      <input className="gcalTitleInput" placeholder={tr(lang,"Добавьте название")} value={open.title} onChange={e => setOpen({...open, title:e.target.value})} disabled={!canEditOpenEvent}/>
      <div className="gcalTypeRow">{CAL_EVENT_TYPES.map(t => <button key={t} className={cn(open.type === t && "on")} style={{"--ev":CAL_TYPES[t].c}} onClick={() => setOpen({...open, type:t, duration:open.id ? open.duration : (t === "Звонок" ? 15 : t === "Задача" ? 30 : 60)})} disabled={!canEditOpenEvent}>{CAL_TYPES[t].i} {tr(lang,t)}</button>)}</div>

      <div className="gcalFormRow">
        <span className="gcalIco">🕒</span>
        <div className="gcalWhen">
          <input className="input" type="date" value={open.date} onChange={e => setOpen({...open, date:e.target.value})} disabled={!canEditOpenEvent}/>
          <input className="input" type="time" step="300" value={open.time} onChange={e => setOpen({...open, time:e.target.value})} disabled={!canEditOpenEvent}/>
          <select className="input" value={open.duration || 60} onChange={e => setOpen({...open, duration:Number(e.target.value)})} disabled={!canEditOpenEvent}>{CAL_DURATIONS.map(m => <option key={m} value={m}>{m < 60 ? `${m} ${tr(lang,"мин")}` : `${m/60} ${tr(lang,"ч")}`}</option>)}</select>
        </div>
      </div>
      {conflicts.length > 0 && <div className="gcalWarn">⚠️ {tr(lang,"В это время уже есть")}: {conflicts.map(c => `${c.time} ${c.title}`).join(", ")}</div>}

      <div className="gcalFormRow">
        <span className="gcalIco">👤</span>
        <div style={{flex:1}}>
          {selectedLead ? <div className="gcalLeadPicked">
            <section><b>{selectedLead.name}</b><span>{selectedLead.phone} · {tr(lang, selectedLead.status)}</span></section>
            <button className="btn soft" onClick={() => onOpenLead && onOpenLead(selectedLead)}>{tr(lang,"Карточка")}</button>
            {canEditOpenEvent && <button className="icon" onClick={() => setOpen({...open, leadId:""})}>×</button>}
          </div> : <>
            <input className="input" placeholder={tr(lang,"Клиент: имя или телефон (необязательно)")} value={leadQuery} onChange={e => setLeadQuery(e.target.value)} disabled={!canEditOpenEvent}/>
            {leadMatches.length > 0 && <div className="gcalLeadList">{leadMatches.map(l => <button key={l.id} onClick={() => { setOpen({...open, leadId:String(l.id)}); setLeadQuery(""); }}><b>{l.name}</b><span>{l.phone} · {tr(lang,l.status)}</span></button>)}</div>}
          </>}
        </div>
      </div>

      {(open.type === "Показ" || open.propertyId) && <div className="gcalFormRow">
        <span className="gcalIco">🏢</span>
        <select className="input" style={{flex:1}} value={open.propertyId || ""} onChange={e => { const p = propById.get(e.target.value); setOpen({...open, propertyId:e.target.value, location:(!open.location || open.location === open._autoLoc) && p ? `${p.title}, ${p.district}` : open.location, _autoLoc:p ? `${p.title}, ${p.district}` : ""}); }} disabled={!canEditOpenEvent}>
          <option value="">{tr(lang,"Объект из вторички (необязательно)")}</option>
          {[...(properties||[])].sort((a,b) => String(a.title).localeCompare(String(b.title))).map(p => <option key={p.id} value={p.id}>{p.title} · {p.district}{p.price ? ` · $${Number(p.price).toLocaleString()}` : ""}</option>)}
        </select>
      </div>}

      <div className="gcalFormRow">
        <span className="gcalIco">📍</span>
        <input className="input" style={{flex:1}} placeholder={tr(lang,"Адрес или место встречи")} value={open.location || ""} onChange={e => setOpen({...open, location:e.target.value})} disabled={!canEditOpenEvent}/>
        {open.location && <a className="btn soft" href={calMapsLink(open.location)} target="_blank" rel="noreferrer">🗺</a>}
      </div>

      <div className="gcalFormRow">
        <span className="gcalIco">🔔</span>
        <div className="gcalWhen">
          <select className="input" value={open.reminder || 60} onChange={e => setOpen({...open, reminder:Number(e.target.value)})}>{[[5,"За 5 минут"],[15,"За 15 минут"],[30,"За 30 минут"],[60,"За 1 час"],[120,"За 2 часа"],[1440,"За 1 день"]].map(([v,l]) => <option key={v} value={v}>{tr(lang,l)}</option>)}</select>
          <select className="input" value={open.sound || "classic"} onChange={e => setOpen({...open, sound:e.target.value})}>{soundOptions.map(o => <option key={o.id} value={o.id}>{o.label}</option>)}</select>
          <button className="btn soft" onClick={() => playReminderSound(open.sound || "classic")}>▶</button>
        </div>
      </div>

      {isAdmin && <div className="gcalFormRow">
        <span className="gcalIco">🧑‍💼</span>
        <select className="input" style={{flex:1}} value={open.manager_email || ""} onChange={e => { const u = (users||[]).find(x => x.email === e.target.value); setOpen({...open, manager_email:e.target.value, manager:u?.full_name || open.manager}); }}>
          {!((users||[]).some(u => u.email === open.manager_email)) && <option value={open.manager_email || ""}>{open.manager || tr(lang,"Не назначен")}</option>}
          {(users||[]).filter(u => u.email).map(u => <option key={u.id} value={u.email}>{u.full_name || u.email}</option>)}
        </select>
      </div>}

      <div className="gcalFormRow">
        <span className="gcalIco">≡</span>
        <textarea className="input" style={{flex:1, minHeight:60}} placeholder={tr(lang,"Заметка к событию")} value={open.description || ""} onChange={e => setOpen({...open, description:e.target.value})} disabled={!canEditOpenEvent}/>
      </div>

      {open.id && <div className="gcalResult">
        <b>{tr(lang,"Итог")}</b>
        <div className="gcalStatusRow">{CAL_STATUSES.map(([id,label]) => <button key={id} className={cn(open.status === id && "on")} onClick={() => setOpen({...open, status:id})} disabled={!canEditOpenEvent}>{tr(lang,label)}</button>)}</div>
        <textarea className="input" placeholder={tr(lang,"Что сказал клиент, следующий шаг...")} value={open.result || ""} onChange={e => setOpen({...open, result:e.target.value})} disabled={!canEditOpenEvent}/>
      </div>}

      <div className="gcalActions">
        {canEditOpenEvent && <Button className="full" onClick={saveEvent}>{tr(lang,"Сохранить")}</Button>}
        {canEditOpenEvent && open.id && <Button className="full" variant="danger" onClick={deleteOpenEvent}>{tr(lang,"Удалить событие")}</Button>}
      </div>
      <div className="gcalExtra">
        <a href={calGoogleLink(open, selectedLead?.phone)} target="_blank" rel="noreferrer">📅 {tr(lang,"В Google Календарь")}</a>
        <button onClick={() => calDownloadIcs({...open, id:open.id || "new"}, selectedLead?.phone)}>📲 {tr(lang,"В календарь телефона")}</button>
        {selectedLead?.phone && <button onClick={() => setShowNotify(v => !v)}>💬 {tr(lang,"Напомнить клиенту")}</button>}
      </div>
      {showNotify && selectedLead?.phone && <div className="gcalNotify">
        <p>{clientText({...open, client:selectedLead.name})}</p>
        <div>
          <a href={`https://wa.me/${phoneDigits(selectedLead.phone)}?text=${encodeURIComponent(clientText({...open, client:selectedLead.name}))}`} target="_blank" rel="noreferrer">WhatsApp</a>
          <a href={`viber://chat?number=%2B${phoneDigits(selectedLead.phone)}`} onClick={() => copy(clientText({...open, client:selectedLead.name}))}>Viber</a>
          <a href={`https://t.me/+${phoneDigits(selectedLead.phone)}`} target="_blank" rel="noreferrer" onClick={() => copy(clientText({...open, client:selectedLead.name}))}>Telegram</a>
          <button onClick={() => copy(clientText({...open, client:selectedLead.name}))}>{tr(lang,"Скопировать")}</button>
        </div>
        <small>{tr(lang,"Для Viber и Telegram текст копируется — вставьте его в чат.")}</small>
      </div>}
    </Modal>}
  </main>;
}


// Прежний календарь — оставлен для отката, не используется.
function CalendarLegacy({events,setEvents,leads,setLeads,onOpenLead,currentProfile,role,lang}) {
  const [view,setView] = useState("month");
  const now = new Date();
  const [year,setYear] = useState(now.getFullYear());
  const [month,setMonth] = useState(now.getMonth());
  const [open,setOpen] = useState(null);
  const [selectedLead,setSelectedLead] = useState(null);
  const [clientSearch,setClientSearch] = useState("");
  const days = monthGrid(year,month);
  const monthKey = `${year}-${String(month+1).padStart(2,"0")}`;
  const calendarLeadIds = new Set((leads||[]).filter(l=>{
    const q=clientSearch.trim().toLowerCase().replace(/\s+/g,"");
    if(!q) return true;
    return `${l.name||""} ${l.phone||""}`.toLowerCase().replace(/\s+/g,"").includes(q);
  }).map(l=>String(l.id)));
  const filteredEvents = (events||[]).filter(e=>!clientSearch.trim() || calendarLeadIds.has(String(e.leadId)) || `${e.client||""}`.toLowerCase().includes(clientSearch.trim().toLowerCase()));

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
    <div className="card calendarSearchCard">
      <div className="search" style={{margin:0}}>🔎 <input value={clientSearch} onChange={e=>setClientSearch(e.target.value)} placeholder={tr(lang,"Поиск клиента по имени или телефону...")} /></div>
    </div>
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
          <select className="input" value={month} onChange={e=>setMonth(Number(e.target.value))}>{months.map((m,i)=><option key={m} value={i}>{tr(lang,m)}</option>)}</select>
        </div>
        <div className="grid4" style={{maxWidth:560}}>{[["year","Год"],["month","Месяц"],["week","Неделя"],["day","День"]].map(([id,label])=><Button key={id} variant={view===id?"primary":"soft"} onClick={()=>setView(id)}>{label}</Button>)}</div>
      </div>
    </div>

    {view==="year" && <div className="card">
      <h3>{year} год</h3>
      <div className="yearGrid">{months.map((m,i)=><button className="monthBox" key={m} onClick={()=>{setMonth(i);setView("month")}}><b>{tr(lang,m)}</b><span>{filteredEvents.filter(e=>String(e.date || "").startsWith(`${year}-${String(i+1).padStart(2,"0")}`)).length} событий</span></button>)}</div>
    </div>}

    {view==="month" && <div className="card">
      <div className="row"><h3>{tr(lang,months[month])} {year}</h3>{badge(filteredEvents.filter(e=>String(e.date || "").startsWith(monthKey)).length+" событий","gold")}</div>
      <div className="week">{week.map(w=><b key={w}>{tr(lang,w)}</b>)}</div>
      <div className="calgrid">{days.map(d=>{
        const evs=filteredEvents.filter(e=>e.date===d.iso);
        return <button key={d.iso} className={cn("day",!d.current&&"mutedDay")} onClick={()=>create(d.iso)}>
          <b>{d.day}</b>
          {evs.slice(0,3).map(e=><span className="mini" key={e.id}>{e.time} {e.title}</span>)}
        </button>
      })}</div>
    </div>}

    {view==="week" && <div className="card">
      <h3>Неделя</h3>
      <div className="grid2">{weekDays.map(d=><button className="weekRow" key={d.iso} onClick={()=>create(d.iso)}><b>{d.iso}</b><span>{filteredEvents.filter(e=>e.date===d.iso).length} событий</span></button>)}</div>
    </div>}

    {view==="day" && <div className="card">
      <h3>День · {dayIso}</h3>
      {["09:00","10:00","11:00","12:00","13:00","14:00","15:00","16:00","17:00","18:00"].map(t=>{
        const evs = filteredEvents.filter(e=>e.date===dayIso && e.time===t);
        return <button className="weekRow" key={t} onClick={()=>create(dayIso,t)}><b>{t}</b><span>{evs.length ? evs.map(e=>e.title).join(", ") : "добавить событие"}</span></button>
      })}
    </div>}

    <div className="grid2">
      {filteredEvents.filter(e=>!monthKey || String(e.date || "").startsWith(monthKey)).map(e=><div className="card event" key={e.id} onClick={()=>setOpen(e)}>
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



function pdfDrawWrapped(ctx, text, x, y, maxWidth, lineHeight){
  const words = String(text || "").replace(/\n/g," \n ").split(" ");
  let line = "";
  let yy = y;
  for (const word of words){
    if (word === "\n"){
      if (line) ctx.fillText(line, x, yy);
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

function pdfDataUrlToBytes(dataUrl){
  const base64 = dataUrl.split(",")[1];
  const bin = atob(base64);
  const bytes = new Uint8Array(bin.length);
  for(let i=0;i<bin.length;i++) bytes[i] = bin.charCodeAt(i);
  return bytes;
}

function buildPdfFromCanvasPages(pages){
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

  add("%PDF-1.4\n%CRM Selection\n");
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

async function imageToPdfPage(url, title){
  const c = document.createElement("canvas");
  c.width = 1240;
  c.height = 1754;
  const ctx = c.getContext("2d");
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0,0,c.width,c.height);
  ctx.fillStyle = "#070707";
  ctx.fillRect(0,0,c.width,130);
  ctx.fillStyle = "#ffffff";
  ctx.font = "bold 42px Arial";
  pdfDrawWrapped(ctx, title || "Объект", 90, 82, 1060, 48);

  const img = new Image();
  img.crossOrigin = "anonymous";
  const loaded = await new Promise(resolve => {
    img.onload = () => resolve(true);
    img.onerror = () => resolve(false);
    img.src = url;
  });
  if (loaded){
    const maxW = 1060, maxH = 1350;
    const scale = Math.min(maxW/img.width, maxH/img.height);
    const dw = img.width * scale;
    const dh = img.height * scale;
    ctx.drawImage(img, (c.width-dw)/2, 220, dw, dh);
  } else {
    ctx.fillStyle = "#374151";
    ctx.font = "28px Arial";
    pdfDrawWrapped(ctx, "Фото не удалось встроить в PDF, но оно доступно в карточке объекта.", 90, 300, 1060, 40);
  }
  return {bytes:pdfDataUrlToBytes(c.toDataURL("image/jpeg",0.92)), width:c.width, height:c.height};
}


function agencyBrandKey(agencyId){ return `crm_agency_brand_${agencyId || "default"}`; }
// Логотип агентства хранится в базе (agencies.logo_url) и общий для всех устройств; локальная копия — запасной вариант.
const sharedAgencyLogos = {};
function loadAgencyBrand(agencyId){
  let local = {};
  try { local = JSON.parse(localStorage.getItem(agencyBrandKey(agencyId)) || "{}"); } catch {}
  const shared = sharedAgencyLogos[String(agencyId || "")];
  return shared ? {...local, logo_url: shared} : local;
}
function saveAgencyBrand(agencyId, value){
  localStorage.setItem(agencyBrandKey(agencyId), JSON.stringify(value || {}));
  window.dispatchEvent(new CustomEvent("crm-brand-updated", {detail:{agencyId}}));
}
function currentThemeVars(themeId){ return (themeOptions.find(x=>x.id===themeId) || themeOptions[0]).vars || {}; }
function formatPresentationDate(lang="ru"){
  const locale = lang === "uk" ? "uk-UA" : lang === "en" ? "en-GB" : "ru-RU";
  return new Intl.DateTimeFormat(locale,{day:"2-digit",month:"long",year:"numeric"}).format(new Date());
}
async function drawRemoteImage(ctx,url,x,y,w,h,fit="cover"){
  if(!url) return false;
  const img=new Image(); img.crossOrigin="anonymous";
  const ok=await new Promise(r=>{img.onload=()=>r(true);img.onerror=()=>r(false);img.src=url;});
  if(!ok) return false;
  const scale=fit==="contain"?Math.min(w/img.width,h/img.height):Math.max(w/img.width,h/img.height);
  const dw=img.width*scale, dh=img.height*scale;
  ctx.save();ctx.beginPath();ctx.rect(x,y,w,h);ctx.clip();ctx.drawImage(img,x+(w-dw)/2,y+(h-dh)/2,dw,dh);ctx.restore();
  return true;
}
function vipPresentationText(lang="ru"){
  if(lang==="uk") return {personal:"ПЕРСОНАЛЬНА ПРЕЗЕНТАЦІЯ НЕРУХОМОСТІ",prepared:"Підготовлено спеціально для",date:"Дата формування",property:"ОБ'ЄКТ",about:"ПРО ОБ'ЄКТ",type:"Тип",district:"Район",status:"Статус",price:"Ціна",area:"Площа",floor:"Поверх",description:"Опис",photos:"ФОТОГРАФІЇ ОБ'ЄКТА",contact:"ЗВ'ЯЖІТЬСЯ З ВАШИМ МЕНЕДЖЕРОМ",thanks:"Дякуємо за довіру",selection:"ПЕРСОНАЛЬНА ДОБІРКА НЕРУХОМОСТІ",comparison:"ОБ'ЄКТИ У ДОБІРЦІ",noDescription:"Опис об'єкта не додано."};
  if(lang==="en") return {personal:"PERSONAL PROPERTY PRESENTATION",prepared:"Prepared especially for",date:"Presentation date",property:"PROPERTY",about:"ABOUT THE PROPERTY",type:"Type",district:"District",status:"Status",price:"Price",area:"Area",floor:"Floor",description:"Description",photos:"PROPERTY PHOTOS",contact:"CONTACT YOUR MANAGER",thanks:"Thank you for your trust",selection:"PERSONAL PROPERTY SELECTION",comparison:"PROPERTIES IN YOUR SELECTION",noDescription:"Property description has not been added."};
  return {personal:"ПЕРСОНАЛЬНАЯ ПРЕЗЕНТАЦИЯ НЕДВИЖИМОСТИ",prepared:"Подготовлено специально для",date:"Дата формирования",property:"ОБЪЕКТ",about:"ОБ ОБЪЕКТЕ",type:"Тип",district:"Район",status:"Статус",price:"Цена",area:"Площадь",floor:"Этаж",description:"Описание",photos:"ФОТОГРАФИИ ОБЪЕКТА",contact:"СВЯЖИТЕСЬ С ВАШИМ МЕНЕДЖЕРОМ",thanks:"Благодарим за доверие",selection:"ПЕРСОНАЛЬНАЯ ПОДБОРКА НЕДВИЖИМОСТИ",comparison:"ОБЪЕКТЫ В ПОДБОРКЕ",noDescription:"Описание объекта не добавлено."};
}
function drawVipHeader(ctx,{agencyName,brand,themeId,title,subtitle}){
  const v=currentThemeVars(themeId); const dark=v["--dark"]||"#0f172a", accent=v["--accent"]||"#d4af37";
  ctx.fillStyle=dark;ctx.fillRect(0,0,1240,210);ctx.fillStyle=accent;ctx.fillRect(0,205,1240,5);
  if(brand?.logo_url){ /* logo is drawn asynchronously by caller when needed */ }
  ctx.fillStyle="#fff";ctx.font="bold 34px Arial";ctx.fillText(agencyName||"CRM Real Estate",90,75);
  ctx.font="bold 42px Arial";pdfDrawWrapped(ctx,title,90,138,1060,48);ctx.font="20px Arial";ctx.fillStyle="#d1d5db";ctx.fillText(subtitle||"",90,180);
}

const presentationVisualOptions = [
  {id:"luxuryDark", label:"Luxury Dark"},
  {id:"editorialLight", label:"Editorial Light"},
  {id:"ivoryGold", label:"Ivory Gold"}
];
function presentationPalette(styleId, themeId){
  const v=currentThemeVars(themeId);
  const accent=v["--accent"]||"#caa24a", dark=v["--dark"]||"#111827", soft=v["--soft"]||"#f5f2ea";
  if(styleId==="editorialLight") return {bg:"#f8f7f3",paper:"#ffffff",ink:"#171717",muted:"#6b6b67",accent,dark:"#252525",line:"#ddd8ce"};
  if(styleId==="ivoryGold") return {bg:"#f1eadc",paper:"#fffdf8",ink:"#201d18",muted:"#756b5f",accent,dark:"#2c2721",line:"#d8cbb8"};
  return {bg:dark,paper:"#f8f5ef",ink:"#151515",muted:"#6c675f",accent,dark,line:accent};
}
function canvasTextLines(ctx,text,maxWidth){
  const paragraphs=String(text||"").replace(/\r/g,"").split("\n");
  const out=[];
  for(const para of paragraphs){
    if(!para.trim()){out.push("");continue;}
    const words=para.trim().split(/\s+/);let line="";
    for(const word of words){
      const test=line?line+" "+word:word;
      if(ctx.measureText(test).width<=maxWidth || !line) line=test; else {out.push(line);line=word;}
    }
    if(line) out.push(line);
  }
  return out;
}
function extractPropertyPhotos(property){
  const seen=new Set();
  return (property?.media||[]).filter(m=>{
    const url=String(m?.url||m?.media_url||"").trim();
    if(!url || seen.has(url)) return false;
    const kind=String(m?.kind||m?.media_type||"").toLowerCase();
    const name=String(m?.name||m?.file_name||url).toLowerCase();
    const looksImage=kind.includes("фото")||kind.includes("photo")||kind.includes("image")||/\.(jpe?g|png|webp|gif|heic)(\?|#|$)/i.test(name);
    if(looksImage){seen.add(url);return true;}
    return false;
  }).map(m=>({...m,url:m.url||m.media_url}));
}

function addFullDescriptionPages(pages,{text,title,agencyName,brand,themeId,visualId,lang}){
  const pal=presentationPalette(visualId,themeId), txt=vipPresentationText(lang);
  const body=String(text||txt.noDescription).trim()||txt.noDescription;
  const probe=document.createElement("canvas");probe.width=1240;probe.height=1754;const px=probe.getContext("2d");
  px.font='25px Georgia, "Times New Roman", serif';
  const lines=canvasTextLines(px,body,1010);
  // Safe amount per page: leaves generous luxury margins and guarantees no clipping.
  const perPage=27;
  const total=Math.max(1,Math.ceil(lines.length/perPage));
  for(let pageNo=0; pageNo<total; pageNo++){
    const offset=pageNo*perPage;
    const c=document.createElement("canvas");c.width=1240;c.height=1754;const ctx=c.getContext("2d");
    ctx.fillStyle=pal.paper;ctx.fillRect(0,0,1240,1754);
    ctx.fillStyle=pal.dark;ctx.fillRect(0,0,1240,185);
    ctx.fillStyle=pal.accent;ctx.fillRect(80,180,1080,3);
    ctx.fillStyle="#fff";ctx.font='600 25px Arial';ctx.fillText(agencyName||"CRM Real Estate",90,62);
    ctx.font='bold 40px Georgia, "Times New Roman", serif';ctx.fillText(txt.description,90,132);
    ctx.fillStyle=pal.ink;ctx.font='bold 34px Georgia, "Times New Roman", serif';
    const titleBottom=pdfDrawWrapped(ctx,title||txt.property,90,255,1020,44);
    let y=Math.max(370,titleBottom+55);
    ctx.fillStyle=pal.ink;ctx.font='25px Georgia, "Times New Roman", serif';
    for(const line of lines.slice(offset,offset+perPage)){
      if(line===""){y+=22;continue;}
      ctx.fillText(line,90,y);y+=42;
    }
    ctx.strokeStyle=pal.line;ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(90,1618);ctx.lineTo(1150,1618);ctx.stroke();
    ctx.fillStyle=pal.muted;ctx.font='18px Arial';ctx.fillText(`${formatPresentationDate(lang)}  ·  ${pageNo+1}/${total}`,90,1665);
    pages.push({bytes:pdfDataUrlToBytes(c.toDataURL("image/jpeg",.97)),width:1240,height:1754});
  }
}

async function addLuxuryGalleryPage(pages,{photos,title,agencyName,themeId,visualId,lang,drawImage=drawRemoteImage,compact=false}){
  if(!photos?.length) return;
  const pal=presentationPalette(visualId,themeId), txt=vipPresentationText(lang);
  for(let start=0; start<photos.length; start+=4){
    const chunk=photos.slice(start,start+4),c=document.createElement("canvas");c.width=1240;c.height=1754;const ctx=c.getContext("2d");
    ctx.fillStyle=pal.paper;ctx.fillRect(0,0,1240,1754);
    ctx.fillStyle=pal.ink;ctx.font='bold 44px Georgia, "Times New Roman", serif';ctx.fillText(txt.photos,80,105);
    ctx.fillStyle=pal.accent;ctx.fillRect(80,135,1080,3);ctx.fillStyle=pal.muted;ctx.font='21px Arial';ctx.fillText(`${title||""} · ${start+1}-${Math.min(start+4,photos.length)} / ${photos.length}`,80,178);
    const standardBoxes=[[80,240,700,650],[805,240,355,310],[805,580,355,310],[80,920,1080,650]];
    const compactBoxes=chunk.length===1
      ?[[80,240,1080,1330]]
      :chunk.length===2
        ?[[80,240,1080,640],[80,910,1080,660]]
        :chunk.length===3
          ?[[80,240,700,1330],[805,240,355,645],[805,925,355,645]]
          :standardBoxes;
    const boxes=compact?compactBoxes:standardBoxes;
    for(let i=0;i<chunk.length;i++){
      const ok=await drawImage(ctx,chunk[i].url,...boxes[i],"cover");
      if(!ok){
        const [x,y,w,h]=boxes[i];ctx.fillStyle="#eeeae3";ctx.fillRect(x,y,w,h);ctx.fillStyle=pal.muted;ctx.font='20px Arial';ctx.fillText(`Фото ${start+i+1}`,x+24,y+48);
      }
    }
    pages.push({bytes:pdfDataUrlToBytes(c.toDataURL("image/jpeg",.97)),width:1240,height:1754});
  }
}

function addSelectionComparisonPages(pages,{items,themeId,visualId,lang,agencyName}){
  if(!items?.length || items.length<2) return;
  const pal=presentationPalette(visualId,themeId), txt=vipPresentationText(lang);
  const headers=lang==="en"?["#","Property","Price","Area","Price/m²","District","Floor"]:lang==="uk"?["#","Об'єкт","Ціна","Площа","Ціна/м²","Район","Поверх"]:["#","Объект","Цена","Площадь","Цена/м²","Район","Этаж"];
  const title=lang==="en"?"COMPARISON OF OFFERS":lang==="uk"?"ПОРІВНЯННЯ ПРОПОЗИЦІЙ":"СРАВНЕНИЕ ПРЕДЛОЖЕНИЙ";
  const chunks=[];for(let i=0;i<items.length;i+=12) chunks.push(items.slice(i,i+12));
  chunks.forEach((chunk,pageIndex)=>{
    const cmp=document.createElement("canvas");cmp.width=1240;cmp.height=1754;const ctx=cmp.getContext("2d");ctx.fillStyle=pal.paper;ctx.fillRect(0,0,1240,1754);
    ctx.fillStyle=pal.ink;ctx.font='bold 48px Georgia, "Times New Roman", serif';ctx.fillText(title,80,120);ctx.fillStyle=pal.accent;ctx.fillRect(80,150,1080,3);
    ctx.fillStyle=pal.muted;ctx.font='18px Arial';ctx.fillText(`${agencyName||"CRM Real Estate"} · ${formatPresentationDate(lang)} · ${pageIndex+1}/${chunks.length}`,80,190);
    const xs=[80,135,480,650,790,930,1080];ctx.font='bold 17px Arial';ctx.fillStyle=pal.muted;headers.forEach((h,i)=>ctx.fillText(h,xs[i],250));
    let y=310;chunk.forEach((p,idx)=>{const i=pageIndex*12+idx,ppm=Number(p.area)?Math.round(Number(p.price||0)/Number(p.area)):0;ctx.strokeStyle=pal.line;ctx.beginPath();ctx.moveTo(80,y-28);ctx.lineTo(1160,y-28);ctx.stroke();ctx.fillStyle=pal.accent;ctx.font='bold 20px Georgia';ctx.fillText(String(i+1).padStart(2,"0"),80,y);ctx.fillStyle=pal.ink;ctx.font='18px Arial';pdfDrawWrapped(ctx,p.title||"—",135,y,320,22);ctx.fillText(money(p.price),480,y);ctx.fillText(`${p.area||0} м²`,650,y);ctx.fillText(ppm?money(ppm):"—",790,y);ctx.fillText(p.district||"—",930,y);ctx.fillText(p.floor||"—",1080,y);y+=105;});
    pages.push({bytes:pdfDataUrlToBytes(cmp.toDataURL("image/jpeg",.97)),width:1240,height:1754});
  });

}

function Properties({properties,setProperties,onOpen,users,currentProfile,lang,agencyName,theme,leads,recordActivity}) {
  const [type,setType] = useState("Все");
  const [district,setDistrict] = useState("Все");
  const [favorites,setFavorites] = useStorage("property_favorites",[]);
  const [selected,setSelected] = useState([]);
  const [favoritesOnly,setFavoritesOnly] = useState(false);
  const [selectionUrl,setSelectionUrl] = useState("");
  const [selectionDownloadUrl,setSelectionDownloadUrl] = useState("");
  const [selectionLang,setSelectionLang] = useState(lang || "ru");
  const [selectionClient,setSelectionClient] = useState("");
  const [selectionClientId,setSelectionClientId] = useState("");
  const [selectionClientPhone,setSelectionClientPhone] = useState("");
  const [selectionClientEmail,setSelectionClientEmail] = useState("");
  const [selectionVisual,setSelectionVisual] = useState("luxuryDark");
  const [selectionComparison,setSelectionComparison] = useState(true);
  const logPresentationSend = (channel) => recordActivity?.({action_type:"presentation_sent", entity_type:"selection", entity_id:selected.join(","), channel, client_id:selectionClientId, client_name:selectionClient});

  const filtered = properties.filter(p =>
    (type === "Все" || p.type === type) &&
    (district === "Все" || p.district === district) &&
    (!favoritesOnly || favorites.includes(String(p.id)))
  );

  const create = () => {
    const p = {
      id: "P-" + Date.now(), _isNew: true, title: "",
      property_manager_name: currentProfile?.full_name || currentProfile?.name || "",
      property_manager_email: currentProfile?.email || "",
      property_manager_phone: currentProfile?.phone || "",
      created_by_email: currentProfile?.email || "",
      type: types[0], district: districts[0], status: "Актуален", price: "", area: "", floor: "",
      owner: "", ownerPhone: "+380", description: "", media: [], history: [],
      ownership_right:false, assignment:false, government_programs:false, created_at:new Date().toISOString()
    };
    onOpen(p);
  };

  const toggleFavorite = (id) => setFavorites(prev => prev.includes(String(id)) ? prev.filter(x=>x!==String(id)) : [...prev,String(id)]);
  const toggleSelected = (id) => setSelected(prev => prev.includes(String(id)) ? prev.filter(x=>x!==String(id)) : [...prev,String(id)]);

  async function createSelection(){
    const items = properties.filter(p=>selected.includes(String(p.id)));
    if (!items.length){ alert("Выбери хотя бы один объект"); return; }
    try {
      if (selectionUrl?.startsWith("blob:")) URL.revokeObjectURL(selectionUrl);
      if (selectionDownloadUrl?.startsWith("blob:")) URL.revokeObjectURL(selectionDownloadUrl);
      const brand=loadAgencyBrand(currentProfile?.agency_id),txt=vipPresentationText(selectionLang),pages=[];
      const pal=presentationPalette(selectionVisual,theme);

      const cover=document.createElement("canvas");cover.width=1240;cover.height=1754;let c=cover.getContext("2d");
      c.fillStyle="#0b1428";c.fillRect(0,0,1240,1754);
      const firstHero=extractPropertyPhotos(items[0])[0];
      if(firstHero){c.globalAlpha=selectionVisual==="luxuryDark"?.34:.20;await drawRemoteImage(c,firstHero.url,380,0,860,1754,"cover");c.globalAlpha=1;}
      c.fillStyle=pal.accent;c.fillRect(72,150,4,1300);
      if(brand.logo_url) await drawRemoteImage(c,brand.logo_url,95,75,180,100,"contain");
      c.fillStyle=selectionVisual==="luxuryDark"?"#fff":pal.ink;c.font='600 30px Arial';c.fillText(agencyName||"CRM Real Estate",95,245);
      c.font='bold 68px Georgia, "Times New Roman", serif';pdfDrawWrapped(c,txt.selection,95,430,980,78);
      c.fillStyle=pal.accent;c.font='bold 25px Arial';c.fillText(`${txt.date}: ${formatPresentationDate(selectionLang)}`,95,700);
      if(selectionClient.trim()){c.fillStyle=selectionVisual==="luxuryDark"?"#eee":pal.muted;c.font='24px Arial';c.fillText(txt.prepared,95,805);c.fillStyle=selectionVisual==="luxuryDark"?"#fff":pal.ink;c.font='bold 46px Georgia, "Times New Roman", serif';pdfDrawWrapped(c,selectionClient.trim(),95,875,920,55);}
      c.fillStyle=selectionVisual==="luxuryDark"?"#ddd":pal.muted;c.font='22px Arial';c.fillText(`${items.length} ${selectionLang==="en"?"properties":selectionLang==="uk"?"об'єктів":"объектов"}`,95,1110);
      pages.push({bytes:pdfDataUrlToBytes(cover.toDataURL("image/jpeg",.96)),width:1240,height:1754});

      for(let index=0;index<items.length;index++){
        const p=items[index],photo=extractPropertyPhotos(p)[0];
        const canvas=document.createElement("canvas");canvas.width=1240;canvas.height=1754;const ctx=canvas.getContext("2d");ctx.fillStyle=pal.paper;ctx.fillRect(0,0,1240,1754);
        ctx.fillStyle=pal.accent;ctx.font='bold 78px Georgia, "Times New Roman", serif';ctx.fillText(String(index+1).padStart(2,"0"),80,115);
        ctx.fillStyle=pal.ink;ctx.font='bold 45px Georgia, "Times New Roman", serif';pdfDrawWrapped(ctx,p.title||`${txt.property} ${index+1}`,220,75,900,50);
        ctx.fillStyle=pal.muted;ctx.font='20px Arial';ctx.fillText(`${formatPresentationDate(selectionLang)} · ${index+1}/${items.length}`,220,165);
        if(photo) await drawRemoteImage(ctx,photo.url,80,225,1080,690,"cover");
        const boxes=[[txt.price,money(p.price)],[txt.area,`${p.area||0} м²`],[txt.floor,p.floor||"—"],[txt.district,p.district||"—"],[txt.type,p.type||"—"]];
        boxes.forEach(([a,b],i)=>{const x=80+i*216;ctx.strokeStyle=pal.line;ctx.lineWidth=1;ctx.strokeRect(x,965,196,130);ctx.fillStyle=pal.muted;ctx.font='17px Arial';ctx.fillText(a,x+16,1002);ctx.fillStyle=pal.ink;ctx.font='bold 24px Arial';pdfDrawWrapped(ctx,String(b),x+16,1043,165,28);});
        ctx.fillStyle=pal.ink;ctx.font='bold 31px Georgia, "Times New Roman", serif';ctx.fillText(txt.about,80,1185);
        const preview=String((selectionLang==="uk"?(p.description_uk||p.description):p.description)||txt.noDescription);
        ctx.fillStyle=pal.muted;ctx.font='22px Georgia, "Times New Roman", serif';
        const teaserLines=canvasTextLines(ctx,preview,1080).slice(0,7);let ty=1240;teaserLines.forEach(line=>{ctx.fillText(line,80,ty);ty+=34;});
        ctx.fillStyle=pal.accent;ctx.font='bold 18px Arial';ctx.fillText(selectionLang==="en"?"FULL DESCRIPTION ON THE FOLLOWING PAGE(S)":selectionLang==="uk"?"ПОВНИЙ ОПИС — НА НАСТУПНІЙ СТОРІНЦІ/СТОРІНКАХ":"ПОЛНОЕ ОПИСАНИЕ — НА СЛЕДУЮЩЕЙ СТРАНИЦЕ/СТРАНИЦАХ",80,1575);
        pages.push({bytes:pdfDataUrlToBytes(canvas.toDataURL("image/jpeg",.97)),width:1240,height:1754});
        addFullDescriptionPages(pages,{text:preview,title:p.title,agencyName,brand,themeId:theme,visualId:selectionVisual,lang:selectionLang});
        const photos=extractPropertyPhotos(p);
        await addLuxuryGalleryPage(pages,{photos,title:p.title,agencyName,themeId:theme,visualId:selectionVisual,lang:selectionLang});
      }

      if(selectionComparison && items.length>1) addSelectionComparisonPages(pages,{items,themeId:theme,visualId:selectionVisual,lang:selectionLang,agencyName});

      const blob=buildPdfFromCanvasPages(pages),localUrl=URL.createObjectURL(blob);setSelectionDownloadUrl(localUrl);
      const path=`selections/${Date.now()}-vip-selection.pdf`;const uploaded=await uploadToFirstAvailableBucket(["presentations"],path,blob,{upsert:false,contentType:"application/pdf",cacheControl:"3600"});
      setSelectionUrl(uploaded?.publicUrl||localUrl);alert(uploaded?.publicUrl?"VIP PDF-подборка создана.":"VIP PDF-подборка создана локально.");
    }catch(e){console.error(e);alert("Не удалось создать VIP PDF-подборку: "+(e?.message||e));}
  }

  return <main className="screen">
    <div className="row">
      <Button onClick={create}>+ {tr(lang,"Добавить объект")}</Button>
      <Button variant={favoritesOnly?"primary":"soft"} onClick={()=>setFavoritesOnly(v=>!v)}>⭐ {tr(lang,"Только избранные")}</Button>
      {selected.length>0 && <div className="card" style={{width:"100%",marginTop:10}}>
        <b>VIP-подборка для клиента</b>
        <div className="grid4" style={{marginTop:10}}>
          <Field label="Клиент из CRM"><select className="input" value={selectionClientId} onChange={e=>{const id=e.target.value;setSelectionClientId(id);const c=(leads||[]).find(x=>String(x.id)===String(id));if(c){setSelectionClient(c.name||"");setSelectionClientPhone(c.phone||"");setSelectionClientEmail(c.email||"");}}}><option value="">Выбрать клиента...</option>{(leads||[]).map(c=><option key={c.id} value={c.id}>{c.name||"Без имени"} · {c.phone||"без телефона"}</option>)}</select></Field>
          <Field label="Персональное имя клиента"><input className="input" placeholder="Например: Александр" value={selectionClient} onChange={e=>setSelectionClient(e.target.value)}/></Field>
          <Field label="Язык презентации"><select className="input" value={selectionLang} onChange={e=>setSelectionLang(e.target.value)}><option value="ru">Русский</option><option value="uk">Українська</option><option value="en">English</option></select></Field>
          <Field label="Визуал презентации"><select className="input" value={selectionVisual} onChange={e=>setSelectionVisual(e.target.value)}>{presentationVisualOptions.map(x=><option key={x.id} value={x.id}>{x.label}</option>)}</select></Field>
        </div>
        <div className="grid3" style={{marginTop:10}}>
          <Field label="Телефон клиента"><input className="input" placeholder="+380..." value={selectionClientPhone} onChange={e=>setSelectionClientPhone(e.target.value)}/></Field>
          <Field label="Email клиента"><input className="input" placeholder="client@email.com" value={selectionClientEmail} onChange={e=>setSelectionClientEmail(e.target.value)}/></Field>
          <label className="chip" style={{alignSelf:"end",minHeight:48}}><input type="checkbox" checked={selectionComparison} onChange={e=>setSelectionComparison(e.target.checked)}/> Сравнительная таблица объектов подборки</label>
        </div>
        <Button className="full" onClick={createSelection}>{tr(lang,"Создать подборку для клиента")} ({selected.length})</Button>
      </div>}
    </div>
    {selectionUrl && <div className="card selectionBar presentationSendPanel">
      <h3 style={{marginTop:0,marginBottom:4}}>Отправить подборку клиенту</h3>
      <p className="muted sendIntro">Выбери канал отправки. WhatsApp откроется с готовым сообщением и ссылкой. Viber откроет переписку именно с выбранным клиентом, а готовое сообщение с ссылкой на PDF автоматически скопируется — останется вставить и отправить.</p>
      <div className="grid4">
        <Button className="full sendWhatsApp" onClick={async()=>{if(await openWhatsAppPresentation({phone:selectionClientPhone,url:selectionUrl,lang:selectionLang,agencyName,clientName:selectionClient,isSelection:true})) logPresentationSend("whatsapp");}}>WhatsApp · отправить</Button>
        <Button className="full sendViber" onClick={async()=>{if(await openViberPresentation({phone:selectionClientPhone,url:selectionUrl,lang:selectionLang,agencyName,clientName:selectionClient,isSelection:true})) logPresentationSend("viber");}}>Viber · клиент</Button>
        <Button className="full sendEmail" onClick={()=>{openEmailPresentation({email:selectionClientEmail,url:selectionUrl,lang:selectionLang,agencyName,clientName:selectionClient,isSelection:true});logPresentationSend("email");}}>Email</Button>
        <Button className="full sendShare" onClick={()=>{nativeSharePresentation({url:selectionUrl,downloadUrl:selectionDownloadUrl,lang:selectionLang,agencyName,clientName:selectionClient,isSelection:true});logPresentationSend("share");}}>Поделиться</Button>
      </div>
      <div className="grid2" style={{marginTop:10}}>
        <a className="btn primary full" href={selectionDownloadUrl||selectionUrl} download={`CRM-selection-${new Date().toISOString().slice(0,10)}.pdf`}>{tr(lang,"Скачать подборку")}</a>
        <Button variant="soft" onClick={async()=>{await navigator.clipboard.writeText(selectionUrl);alert(tr(lang,"Ссылка скопирована"));}}>{tr(lang,"Скопировать ссылку подборки")}</Button>
      </div>
    </div>}

    <div className="chips">{["Все", ...types].map(t=><button key={t} className={cn("chip", type===t && "active")} onClick={()=>setType(t)}>{tr(lang,t)}</button>)}</div>
    <div className="chips">{["Все", ...districts].map(d=><button key={d} className={cn("chip", district===d && "active")} onClick={()=>setDistrict(d)}>{tr(lang,d)}</button>)}</div>

    <div className="grid2 propsList">
      {filtered.map(p => {
        const firstMedia = (p.media || [])[0];
        const fav=favorites.includes(String(p.id));
        const checked=selected.includes(String(p.id));
        return <div className="card propertyCard" key={p.id}>
          <div className="row">
            <label className="chip"><input type="checkbox" checked={checked} onChange={()=>toggleSelected(p.id)}/> {tr(lang,"Добавить в подборку")}</label>
            <button className="icon" onClick={()=>toggleFavorite(p.id)} title={tr(lang,"Избранные")}>{fav?"★":"☆"}</button>
          </div>
          <div onClick={()=>onOpen(p)} style={{cursor:"pointer"}}>
            {firstMedia ? <Media kind={firstMedia.kind} name={firstMedia.url} small /> : <Media kind="Фото" name="" small />}
            <h3>{p.title || tr(lang,"Без названия")}</h3>
            <p>{tr(lang,p.type)} · {tr(lang,p.district)}</p>
            <p><b>{money(p.price)}</b> · {p.area || 0} м²</p>
            <span className="badge">{(p.media || []).length} медиа</span>
            <p className="muted">{tr(lang,"Ответственный")}: {p.property_manager_name || p.manager || tr(lang,"не назначен")}</p>
          </div>
        </div>;
      })}
    </div>
  </main>;
}

function PropertyModal({property,setProperties,onClose,users,currentProfile,role,lang,agencyName,theme,leads,recordActivity}) {
  const [local,setLocal] = useState(property);
  const [mediaKind,setMediaKind] = useState("Фото");
  const [mediaFile,setMediaFile] = useState(null);
  const [mediaFiles,setMediaFiles] = useState([]);
  const [viewer,setViewer] = useState(null);
  const [presentationUrl,setPresentationUrl] = useState("");
  const [presentationLang,setPresentationLang] = useState("ru");
  const [presentationClient,setPresentationClient] = useState("");
  const [presentationClientId,setPresentationClientId] = useState("");
  const [presentationClientPhone,setPresentationClientPhone] = useState("");
  const [presentationClientEmail,setPresentationClientEmail] = useState("");
  const [presentationVisual,setPresentationVisual] = useState("luxuryDark");
  const [translating,setTranslating] = useState(false);
  const [savingProperty,setSavingProperty] = useState(false);
  const [draggedMediaIndex,setDraggedMediaIndex] = useState(null);
  const logPropertyPresentationSend = (channel) => recordActivity?.({action_type:"presentation_sent", entity_type:"property", entity_id:String(local.id||""), channel, client_id:presentationClientId, client_name:presentationClient});
  const isTech = role === "Администратор тех отдел";
  const managerUsers = (users || []).filter(u => String(u.role || "").includes("Менеджер"));
  const propertyManager = managerUsers.find(u => String(u.email || "") === String(local.property_manager_email || "")) || null;
  const responsiblePhoneDigits = String(local.property_manager_phone || propertyManager?.phone || "").replace(/\D/g,"");
  const responsibleWhatsAppUrl = responsiblePhoneDigits ? `https://wa.me/${responsiblePhoneDigits}?text=${encodeURIComponent(`Здравствуйте! Пишу по объекту: ${local.title || "объект"}`)}` : "";
  const isNewProperty = Boolean(local._isNew) || (!Number(local.id) && String(local.id || "").startsWith("P-"));
  const currentManagerName = currentProfile?.full_name || currentProfile?.name || currentProfile?.email || "Ответственный менеджер";
  const currentManagerEmail = currentProfile?.email || "";
  const currentManagerPhone = currentProfile?.phone || "";
  const responsibleEmail = local.property_manager_email || (isNewProperty ? currentManagerEmail : "");
  const creatorEmail = local.created_by_email || responsibleEmail || "";
  const normalizedCurrentEmail = String(currentManagerEmail || "").trim().toLowerCase();
  const isPropertyCreator = Boolean(normalizedCurrentEmail) &&
    String(creatorEmail).trim().toLowerCase() === normalizedCurrentEmail;
  const isResponsibleManager = Boolean(normalizedCurrentEmail) &&
    String(responsibleEmail || "").trim().toLowerCase() === normalizedCurrentEmail;
  const canEditProperty = isTech || isNewProperty || isPropertyCreator;
  const canEditLegal = isTech || isPropertyCreator || isNewProperty;
  const canManagePropertyMedia = isTech || isNewProperty || isResponsibleManager;
  const canDeleteProperty = isTech;
  const changePropertyManager = (email) => {
    const selected = managerUsers.find(u => String(u.email || "") === String(email || ""));
    if (!selected) return;
    setLocal(prev => ({
      ...prev,
      property_manager_name: managerDisplayName(selected),
      property_manager_email: selected.email || "",
      property_manager_phone: selected.phone || ""
    }));
  };

  useEffect(() => {
    if (isNewProperty && !local.property_manager_email && currentManagerEmail) {
      setLocal(prev => ({
        ...prev,
        property_manager_name: prev.property_manager_name || currentManagerName,
        property_manager_email: prev.property_manager_email || currentManagerEmail,
        property_manager_phone: prev.property_manager_phone || currentManagerPhone
      }));
    }
  }, [isNewProperty, currentManagerEmail]);

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
    description_uk: local.description_uk || "",
    property_manager_name: local.property_manager_name || local.manager || currentManagerName || "",
    property_manager_email: local.property_manager_email || currentManagerEmail || "",
    property_manager_phone: local.property_manager_phone || currentManagerPhone || "",
    created_by_email: local.created_by_email || (isNewProperty ? currentManagerEmail : creatorEmail) || "",
    olx_status: local.olx_status || null,
    ownership_right: !!local.ownership_right,
    assignment: !!local.assignment,
    government_programs: !!local.government_programs
  });

  const stripMissingColumnFromPayload = (payload, message = "") => {
    const next = {...payload};
    if (String(message).includes("'assignment'")) delete next.assignment;
    if (String(message).includes("'ownership_right'")) delete next.ownership_right;
    if (String(message).includes("'government_programs'")) delete next.government_programs;
    if (String(message).includes("'description_uk'")) delete next.description_uk;
    if (String(message).includes("'created_by_email'")) delete next.created_by_email;
    return next;
  };

  async function saveObject(closeAfter = false) {
    const payload = payloadFromLocal();
    const isNew = String(local.id || "").startsWith("P-") || !Number(local.id);
    let savedId = Number(local.id);

    if (isNew) {
      let result = await supabase
        .from("properties")
        .insert(payload)
        .select()
        .single();

      if (result.error && String(result.error.message || "").includes("schema cache")) {
        const safePayload = stripMissingColumnFromPayload(payload, result.error.message);
        result = await supabase
          .from("properties")
          .insert(safePayload)
          .select()
          .single();
      }

      if (result.error) {
        alert("Ошибка создания объекта: " + result.error.message);
        return null;
      }

      savedId = result.data.id;
    } else {
      let result = await supabase
        .from("properties")
        .update(payload)
        .eq("id", savedId);

      if (result.error && String(result.error.message || "").includes("schema cache")) {
        const safePayload = stripMissingColumnFromPayload(payload, result.error.message);
        result = await supabase
          .from("properties")
          .update(safePayload)
          .eq("id", savedId);
      }

      if (result.error) {
        alert("Ошибка сохранения объекта: " + result.error.message);
        return null;
      }
    }

    const saved = {
      ...local,
      _isNew: false,
      id: String(savedId),
      media: local.media || [],
      description_uk: local.description_uk || "",
      property_manager_name: local.property_manager_name || local.manager || currentManagerName || "",
      property_manager_email: local.property_manager_email || currentManagerEmail || "",
      property_manager_phone: local.property_manager_phone || currentManagerPhone || "",
      created_by_email: local.created_by_email || creatorEmail || currentManagerEmail || "",
      olx_status: local.olx_status || null,
      ownership_right: !!local.ownership_right,
      assignment: !!local.assignment,
      government_programs: !!local.government_programs
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
    if (savingProperty) return;
    setSavingProperty(true);
    const wasNewProperty = isNewProperty;
    try {
      const id = await saveObject(false);
      if (!id) return;

      // Сначала гарантированно закрываем карточку, затем показываем подтверждение.
      onClose();
      window.setTimeout(() => {
        alert(wasNewProperty ? "Объект успешно создан" : "Изменения объекта сохранены");
      }, 80);
    } finally {
      setSavingProperty(false);
    }
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

    let mediaInsert = await supabase
      .from("property_media")
      .insert({
        property_id: propertyId,
        media_type: detectedKind,
        media_url: publicUrl,
        file_name: originalName,
        sort_order: (local.media || []).length
      })
      .select()
      .single();

    if (mediaInsert.error && String(mediaInsert.error.message || "").includes("sort_order")) {
      mediaInsert = await supabase
        .from("property_media")
        .insert({
          property_id: propertyId,
          media_type: detectedKind,
          media_url: publicUrl,
          file_name: originalName
        })
        .select()
        .single();
    }

    const { data, error } = mediaInsert;
    if (error) {
      alert("Файл загрузился, но не записался в таблицу: " + error.message);
      return;
    }

    const item = {
      id: data.id,
      kind: data.media_type || detectedKind,
      url: data.media_url || publicUrl,
      name: data.file_name || originalName,
      storage_path: path
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

    // ВАЖНО: создаём/сохраняем объект только один раз, затем все файлы привязываем к одному property_id.
    const propertyId = await saveObject(false);
    if (!propertyId) return;

    const uploadedItems = [];
    for (const f of files) {
      const detectedKind = f.type?.startsWith("video") ? "Видео" : "Фото";
      const originalName = f.name || "upload";
      const rawExt = originalName.includes(".") ? originalName.split(".").pop() : "file";
      const ext = rawExt.toLowerCase().replace(/[^a-z0-9]/g, "") || "file";
      const safeName = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
      const path = `${propertyId}/${safeName}`;

      const { error: uploadError } = await supabase.storage.from("property-media").upload(path, f, {upsert:true, contentType:f.type || undefined});
      if (uploadError) { alert("Ошибка загрузки файла: " + uploadError.message); return; }

      const publicUrl = supabase.storage.from("property-media").getPublicUrl(path).data.publicUrl;
      const nextSortOrder = (local.media || []).length + uploadedItems.length;
      let mediaInsert = await supabase.from("property_media").insert({
        property_id: Number(propertyId),
        media_type: detectedKind,
        media_url: publicUrl,
        file_name: originalName,
        sort_order: nextSortOrder
      }).select().single();

      if (mediaInsert.error && String(mediaInsert.error.message || "").includes("sort_order")) {
        mediaInsert = await supabase.from("property_media").insert({
          property_id: Number(propertyId),
          media_type: detectedKind,
          media_url: publicUrl,
          file_name: originalName
        }).select().single();
      }

      const { data, error } = mediaInsert;
      if (error) { alert("Файл загрузился, но не записался в таблицу: " + error.message); return; }

      uploadedItems.push({id:data.id, kind:data.media_type || detectedKind, url:data.media_url || publicUrl, name:data.file_name || originalName, storage_path:path, sort_order:nextSortOrder});
    }

    setLocal(prev => ({...prev, _isNew:false, id:String(propertyId), media:[...(prev.media || []), ...uploadedItems]}));
    setProperties(prev => {
      const exists = prev.some(p => String(p.id) === String(propertyId));
      if (!exists) return [{...local,_isNew:false,id:String(propertyId),media:[...(local.media || []),...uploadedItems]},...prev];
      return prev.map(p => String(p.id) === String(propertyId) ? {...p,_isNew:false,id:String(propertyId),media:[...(p.media || []),...uploadedItems]} : p);
    });
    setMediaFile(null);
    setMediaFiles([]);
    alert("Фото/видео сохранены");
  }

  async function persistPropertyMediaOrder(nextMedia) {
    const ordered = nextMedia.map((item, index) => ({...item, sort_order:index}));

    // Обновляем интерфейс сразу.
    setLocal(prev => ({...prev, media: ordered}));
    setProperties(prev => prev.map(p =>
      String(p.id) === String(local.id) ? {...p, media: ordered} : p
    ));

    // Если в таблице уже есть sort_order — порядок сохранится после перезагрузки.
    // Для старой схемы CRM интерфейс продолжит работать без падения.
    const rowsWithIds = ordered.filter(item => item?.id);
    if (!rowsWithIds.length) return ordered;

    const results = await Promise.all(
      rowsWithIds.map(item =>
        supabase.from("property_media").update({sort_order:item.sort_order}).eq("id", item.id)
      )
    );
    const meaningfulError = results.find(result =>
      result.error && !String(result.error.message || "").includes("sort_order")
    );
    if (meaningfulError?.error) throw meaningfulError.error;

    return ordered;
  }

  async function movePropertyMedia(fromIndex, toIndex) {
    if (!canManagePropertyMedia) return;
    const media = [...(local.media || [])];
    if (
      fromIndex < 0 || toIndex < 0 ||
      fromIndex >= media.length || toIndex >= media.length ||
      fromIndex === toIndex
    ) return;

    const [moved] = media.splice(fromIndex, 1);
    media.splice(toIndex, 0, moved);

    try {
      await persistPropertyMediaOrder(media);
      setViewer(current => current === null ? null : toIndex);
    } catch (e) {
      alert("Не удалось изменить порядок фото: " + (e?.message || e));
    }
  }

  async function makePropertyMediaMain(index) {
    if (!canManagePropertyMedia || index <= 0) return;
    await movePropertyMedia(index, 0);
    setViewer(0);
  }

  async function deletePropertyMedia(media, index) {
    if (!canManagePropertyMedia) return;
    if (!window.confirm(`Удалить ${media?.kind === "Видео" ? "видео" : "фото"}?`)) return;

    try {
      if (media?.id) {
        const { error } = await supabase.from("property_media").delete().eq("id", media.id);
        if (error) throw error;
      } else if (Number(local.id) && media?.url) {
        const { error } = await supabase
          .from("property_media")
          .delete()
          .eq("property_id", Number(local.id))
          .eq("media_url", media.url);
        if (error) throw error;
      }

      let storagePath = media?.storage_path || "";
      if (!storagePath && media?.url) {
        const marker = "/property-media/";
        const pos = String(media.url).indexOf(marker);
        if (pos >= 0) storagePath = decodeURIComponent(String(media.url).slice(pos + marker.length).split("?")[0]);
      }
      if (storagePath) {
        const storageResult = await supabase.storage.from("property-media").remove([storagePath]);
        if (storageResult.error) console.warn("Storage media delete:", storageResult.error);
      }

      const nextMedia = (local.media || []).filter((_, i) => i !== index);
      await persistPropertyMediaOrder(nextMedia);

      // В открытом просмотрщике остаёмся на следующем доступном фото.
      if (!nextMedia.length) {
        setViewer(null);
      } else {
        setViewer(Math.min(index, nextMedia.length - 1));
      }

      alert("Фото/видео удалено");
    } catch (e) {
      alert("Ошибка удаления фото/видео: " + (e?.message || e));
    }
  }

  const mediaList = local.media || [];
  const currentMedia = viewer !== null ? mediaList[viewer] : null;

  const nextMedia = () => {
    if (!mediaList.length) return;
    setViewer(i => ((i ?? 0) + 1) % mediaList.length);
  };

  const prevMedia = () => {
    if (!mediaList.length) return;
    setViewer(i => ((i ?? 0) - 1 + mediaList.length) % mediaList.length);
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

  async function translateDescriptionToUk(){
    const text = String(local.description || "").trim();
    if (!text) { alert("Сначала заполни описание объекта"); return; }
    setTranslating(true);
    try {
      const res = await fetch("/api/translate", {
        method: "POST",
        headers: {"Content-Type":"application/json"},
        body: JSON.stringify({text, target:"uk"})
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.translation) {
        throw new Error(data.error || "Сервис перевода не вернул перевод");
      }
      setLocal(prev => ({...prev, description_uk: data.translation}));
      alert("Описание переведено на украинский. Нажми «Сохранить объект», чтобы записать перевод в CRM.");
    } catch (e) {
      alert("Ошибка перевода: " + (e?.message || e));
    } finally {
      setTranslating(false);
    }
  }

  async function generateClientPresentation(){
    try{
      const txt=vipPresentationText(presentationLang),brand=loadAgencyBrand(currentProfile?.agency_id),pal=presentationPalette(presentationVisual,theme);
      if(presentationUrl?.startsWith("blob:")) URL.revokeObjectURL(presentationUrl);
      const pages=[],hero=extractPropertyPhotos(local)[0];
      const cover=document.createElement("canvas");cover.width=1240;cover.height=1754;let ctx=cover.getContext("2d");ctx.fillStyle=pal.bg;ctx.fillRect(0,0,1240,1754);
      if(hero){ctx.globalAlpha=presentationVisual==="luxuryDark"?.38:.22;await drawRemoteImage(ctx,hero.url,365,0,875,1754,"cover");ctx.globalAlpha=1;}
      ctx.fillStyle=pal.accent;ctx.fillRect(72,150,4,1300);if(brand.logo_url) await drawRemoteImage(ctx,brand.logo_url,92,72,190,105,"contain");
      ctx.fillStyle=presentationVisual==="luxuryDark"?"#fff":pal.ink;ctx.font='600 30px Arial';ctx.fillText(agencyName||"CRM Real Estate",92,245);ctx.font='bold 66px Georgia, "Times New Roman", serif';pdfDrawWrapped(ctx,txt.personal,92,430,980,76);
      ctx.fillStyle=pal.accent;ctx.font='bold 25px Arial';ctx.fillText(`${txt.date}: ${formatPresentationDate(presentationLang)}`,92,700);
      if(presentationClient.trim()){ctx.fillStyle=presentationVisual==="luxuryDark"?"#eee":pal.muted;ctx.font='24px Arial';ctx.fillText(txt.prepared,92,805);ctx.fillStyle=presentationVisual==="luxuryDark"?"#fff":pal.ink;ctx.font='bold 46px Georgia, "Times New Roman", serif';pdfDrawWrapped(ctx,presentationClient.trim(),92,875,930,55);}
      ctx.fillStyle=presentationVisual==="luxuryDark"?"#ddd":pal.muted;ctx.font='25px Georgia, "Times New Roman", serif';pdfDrawWrapped(ctx,local.title||txt.property,92,1120,860,38);pages.push({bytes:dataUrlToBytes(cover.toDataURL("image/jpeg",.96)),width:1240,height:1754});

      const info=document.createElement("canvas");info.width=1240;info.height=1754;ctx=info.getContext("2d");ctx.fillStyle=pal.paper;ctx.fillRect(0,0,1240,1754);
      ctx.fillStyle=pal.accent;ctx.font='bold 72px Georgia, "Times New Roman", serif';ctx.fillText("01",80,115);ctx.fillStyle=pal.ink;ctx.font='bold 46px Georgia, "Times New Roman", serif';pdfDrawWrapped(ctx,local.title||txt.property,220,78,900,52);ctx.fillStyle=pal.muted;ctx.font='20px Arial';ctx.fillText(formatPresentationDate(presentationLang),220,170);
      if(hero) await drawRemoteImage(ctx,hero.url,80,225,1080,690,"cover");
      const boxes=[[txt.price,money(local.price)],[txt.area,`${local.area||0} м²`],[txt.floor,local.floor||"—"],[txt.district,local.district||"—"],[txt.type,local.type||"—"]];boxes.forEach(([a,b],i)=>{const x=80+i*216;ctx.strokeStyle=pal.line;ctx.strokeRect(x,965,196,130);ctx.fillStyle=pal.muted;ctx.font='17px Arial';ctx.fillText(a,x+16,1002);ctx.fillStyle=pal.ink;ctx.font='bold 24px Arial';pdfDrawWrapped(ctx,String(b),x+16,1043,165,28);});
      ctx.fillStyle=pal.ink;ctx.font='bold 31px Georgia, "Times New Roman", serif';ctx.fillText(txt.about,80,1185);const desc=(presentationLang==="uk"?(local.description_uk||local.description):local.description)||txt.noDescription;ctx.fillStyle=pal.muted;ctx.font='22px Georgia, "Times New Roman", serif';const teaserLines=canvasTextLines(ctx,desc,1080).slice(0,7);let ty=1240;teaserLines.forEach(line=>{ctx.fillText(line,80,ty);ty+=34;});ctx.fillStyle=pal.accent;ctx.font='bold 18px Arial';ctx.fillText(presentationLang==="en"?"FULL DESCRIPTION ON THE FOLLOWING PAGE(S)":presentationLang==="uk"?"ПОВНИЙ ОПИС — НА НАСТУПНІЙ СТОРІНЦІ/СТОРІНКАХ":"ПОЛНОЕ ОПИСАНИЕ — НА СЛЕДУЮЩЕЙ СТРАНИЦЕ/СТРАНИЦАХ",80,1575);pages.push({bytes:dataUrlToBytes(info.toDataURL("image/jpeg",.97)),width:1240,height:1754});
      addFullDescriptionPages(pages,{text:desc,title:local.title,agencyName,brand,themeId:theme,visualId:presentationVisual,lang:presentationLang});
      const photos=extractPropertyPhotos(local);await addLuxuryGalleryPage(pages,{photos,title:local.title,agencyName,themeId:theme,visualId:presentationVisual,lang:presentationLang});

      const endp=document.createElement("canvas");endp.width=1240;endp.height=1754;ctx=endp.getContext("2d");ctx.fillStyle=pal.bg;ctx.fillRect(0,0,1240,1754);ctx.fillStyle=pal.accent;ctx.fillRect(72,150,4,1300);if(brand.logo_url) await drawRemoteImage(ctx,brand.logo_url,92,80,210,115,"contain");ctx.fillStyle=presentationVisual==="luxuryDark"?"#fff":pal.ink;ctx.font='bold 55px Georgia, "Times New Roman", serif';pdfDrawWrapped(ctx,txt.contact,92,470,1000,64);ctx.fillStyle=pal.accent;ctx.font='bold 36px Georgia, "Times New Roman", serif';ctx.fillText(managerDisplayName(currentProfile),92,720);ctx.fillStyle=presentationVisual==="luxuryDark"?"#fff":pal.ink;ctx.font='25px Arial';ctx.fillText(currentProfile?.phone||currentProfile?.email||"",92,780);ctx.font='30px Georgia, "Times New Roman", serif';ctx.fillText(txt.thanks,92,1080);pages.push({bytes:dataUrlToBytes(endp.toDataURL("image/jpeg",.96)),width:1240,height:1754});
      const blob=buildPdfFromJpegs(pages),propertyId=Number(local.id)||Date.now(),safeTitle=(local.title||"object").replace(/[^a-zA-Zа-яА-Я0-9_-]+/g,"_").slice(0,60),path=`${propertyId}/${Date.now()}-${safeTitle}-vip-presentation.pdf`;const uploaded=await uploadToFirstAvailableBucket(["presentations"],path,blob,{upsert:false,contentType:"application/pdf",cacheControl:"3600"});setPresentationUrl(uploaded?.publicUrl||URL.createObjectURL(blob));alert(uploaded?.publicUrl?"VIP PDF-презентация создана.":"VIP PDF создан локально.");
    }catch(e){console.error(e);alert("Ошибка создания VIP-презентации: "+(e?.message||e));}
  }


  return <Modal onClose={onClose} wide>
    <div className="propHero">
      <button className="icon heroClose" onClick={onClose}>×</button>
      <h2>{local.title || "Новый объект"}</h2>
      <p>{local.type} · {local.district} · {money(local.price)}</p>
    </div>

    {!canEditProperty && <div className="card amber"><b>Режим просмотра.</b><p className="muted">Редактировать этот объект может только менеджер, который его создал, или администратор тех отдела. Ты можешь смотреть объект, связаться с ответственным менеджером и отправить презентацию клиенту.</p></div>}

    <div className="grid2">
      <Field label="Название объекта"><input className="input" disabled={!canEditProperty} value={local.title || ""} onChange={e=>setLocal({...local,title:e.target.value})}/></Field>
      <Field label="Тип"><select className="input" disabled={!canEditProperty} value={local.type || types[0]} onChange={e=>setLocal({...local,type:e.target.value})}>{types.map(t=><option key={t}>{t}</option>)}</select></Field>
      <Field label="Район"><select className="input" disabled={!canEditProperty} value={local.district || districts[0]} onChange={e=>setLocal({...local,district:e.target.value})}>{districts.map(d=><option key={d}>{d}</option>)}</select></Field>
      <Field label="Цена"><input className="input" disabled={!canEditProperty} value={local.price || ""} onChange={e=>setLocal({...local,price:e.target.value})}/></Field>
      <Field label="Площадь"><input className="input" disabled={!canEditProperty} value={local.area || ""} onChange={e=>setLocal({...local,area:e.target.value})}/></Field>
      <Field label="Этаж"><input className="input" disabled={!canEditProperty} value={local.floor || ""} onChange={e=>setLocal({...local,floor:e.target.value})}/></Field>
      <Field label="Собственник"><input className="input" disabled={!canEditProperty} value={local.owner || ""} onChange={e=>setLocal({...local,owner:e.target.value})}/></Field>
      <Field label="Телефон собственника"><input className="input" disabled={!canEditProperty} value={local.ownerPhone || ""} onChange={e=>setLocal({...local,ownerPhone:e.target.value})}/></Field>
      <Field label="Ответственный менеджер по объекту">
        {isTech ? <select className="input" value={local.property_manager_email || ""} onChange={e=>changePropertyManager(e.target.value)}>
          <option value="">Выбери менеджера</option>
          {managerUsers.map(u => <option key={u.email || u.id} value={u.email || ""}>{managerDisplayName(u)}{u.email ? ` — ${u.email}` : ""}</option>)}
        </select> : <input className="input" value={local.property_manager_name || currentManagerName || "не назначен"} disabled />}
      </Field>
    </div>
    {(local.property_manager_phone || propertyManager?.phone) && <div className="card amber"><b>Связь с ответственным менеджером:</b><div className="grid3"><a className="btn primary" href={`tel:${local.property_manager_phone || propertyManager?.phone}`}>Позвонить</a><a className="btn purple" href={`viber://chat?number=${encodeURIComponent(local.property_manager_phone || propertyManager?.phone)}`}>Viber</a><a className="btn green" href={responsibleWhatsAppUrl || "#"} onClick={(e)=>{if(!responsibleWhatsAppUrl){e.preventDefault();alert("У ответственного менеджера не указан номер телефона");}}} target="_blank" rel="noopener noreferrer">WhatsApp</a></div></div>}

    <Field label="Описание"><textarea className="input" disabled={!canEditProperty} value={local.description || ""} onChange={e=>setLocal({...local,description:e.target.value})}/></Field>

    <div className="card">
      <h3>Украинская версия описания</h3>
      <p className="muted">Нажми кнопку, чтобы перевести описание через серверный переводчик. Перевод сохранится в карточке объекта после нажатия «Сохранить объект».</p>
      <Button variant="soft" className="full" onClick={translateDescriptionToUk} disabled={translating || !canEditProperty}>{translating ? "Переводим..." : "Перевести описание на украинский"}</Button>
      <textarea className="input" placeholder="Опис українською" value={local.description_uk || ""} onChange={e=>setLocal({...local,description_uk:e.target.value})} disabled={!canEditProperty} />
    </div>

    <div className="card"><h3>{tr(lang,"Юридические параметры")}</h3><p className="muted">Редактировать может только ответственный менеджер объекта или тех отдел.</p><div className="grid3"><label className="chip"><input type="checkbox" disabled={!canEditLegal} checked={!!local.ownership_right} onChange={e=>setLocal({...local,ownership_right:e.target.checked})}/> {tr(lang,"Право собственности")}</label><label className="chip"><input type="checkbox" disabled={!canEditLegal} checked={!!local.assignment} onChange={e=>setLocal({...local,assignment:e.target.checked})}/> {tr(lang,"Переуступка")}</label><label className="chip"><input type="checkbox" disabled={!canEditLegal} checked={!!local.government_programs} onChange={e=>setLocal({...local,government_programs:e.target.checked})}/> {tr(lang,"Госпрограммы")}</label></div></div>

    <div className="grid2">
      <Button
        className="full propertySaveButton"
        onClick={save}
        disabled={!canEditProperty || savingProperty}
        style={{
          background: isNewProperty
            ? "linear-gradient(135deg,#16a34a,#22c55e)"
            : "linear-gradient(135deg,#d97706,#f59e0b)",
          color:"#fff",
          border:"none",
          minHeight:54,
          fontWeight:900,
          boxShadow: isNewProperty
            ? "0 12px 28px rgba(34,197,94,.28)"
            : "0 12px 28px rgba(245,158,11,.28)"
        }}
      >
        {savingProperty
          ? "⏳ Сохраняем объект..."
          : isNewProperty
            ? "Создать объект"
            : "Сохранить изменения"}
      </Button>
      <Button className="full" variant="soft" disabled={!canEditProperty} onClick={()=>{setLocal({...local,olx_status:"pending"}); alert("Заявка на публикацию в OLX отправлена тех отделу");}}>Опубликовать в OLX</Button>
    </div>{local.olx_status === "pending" && isTech && <Button className="full" onClick={()=>{setLocal({...local,olx_status:"approved"}); alert("Тех отдел подтвердил публикацию. Для реальной публикации нужен OLX API токен.");}}>Подтвердить публикацию OLX</Button>}
    {canDeleteProperty && <Button className="full" variant="danger" onClick={async()=>{ if(!window.confirm("Удалить объект?")) return; if(Number(local.id)){ await supabase.from("property_media").delete().eq("property_id", Number(local.id)); const {error}=await supabase.from("properties").delete().eq("id", Number(local.id)); if(error){alert("Ошибка удаления объекта: "+error.message);return;} } setProperties(prev=>prev.filter(p=>String(p.id)!==String(local.id))); onClose(); }}>Удалить объект</Button>}

    <div className="card amber">
      <h3>Презентация для клиента</h3>
      <p className="muted">PDF создаётся без персональных данных: без собственника, телефона собственника и ответственного менеджера.</p>
      <div className="grid3" style={{marginBottom:12}}>
        <Button variant={presentationLang === "ru" ? "primary" : "soft"} onClick={()=>setPresentationLang("ru")}>Русская</Button>
        <Button variant={presentationLang === "uk" ? "primary" : "soft"} onClick={()=>setPresentationLang("uk")}>Українська</Button>
        <Button variant={presentationLang === "en" ? "primary" : "soft"} onClick={()=>setPresentationLang("en")}>English</Button>
      </div>
      <div className="grid2" style={{marginBottom:12}}>
        <Field label="Клиент из CRM"><select className="input" value={presentationClientId} onChange={e=>{const id=e.target.value;setPresentationClientId(id);const c=(leads||[]).find(x=>String(x.id)===String(id));if(c){setPresentationClient(c.name||"");setPresentationClientPhone(c.phone||"");setPresentationClientEmail(c.email||"");}}}><option value="">Выбрать клиента...</option>{(leads||[]).map(c=><option key={c.id} value={c.id}>{c.name||"Без имени"} · {c.phone||"без телефона"}</option>)}</select></Field>
        <Field label="Персональное имя клиента"><input className="input" placeholder="Например: Александр" value={presentationClient} onChange={e=>setPresentationClient(e.target.value)}/></Field>
        <Field label="Телефон клиента"><input className="input" placeholder="+380..." value={presentationClientPhone} onChange={e=>setPresentationClientPhone(e.target.value)}/></Field>
        <Field label="Email клиента"><input className="input" placeholder="client@email.com" value={presentationClientEmail} onChange={e=>setPresentationClientEmail(e.target.value)}/></Field>
        <Field label="Визуал презентации"><select className="input" value={presentationVisual} onChange={e=>setPresentationVisual(e.target.value)}>{presentationVisualOptions.map(x=><option key={x.id} value={x.id}>{x.label}</option>)}</select></Field>
      </div>
      <p className="muted">Описание объекта переносится в PDF полностью. Если текст длинный, CRM автоматически создаст дополнительные страницы без обрезания.</p>
      <Button className="full" onClick={generateClientPresentation}>Создать VIP-презентацию для клиента</Button>
      {presentationUrl && <div style={{marginTop:12}}>
        <div className="card presentationSendPanel" style={{marginBottom:10}}>
          <b style={{fontSize:18}}>Отправить клиенту прямо из CRM</b>
          <p className="muted sendIntro">CRM подставит имя клиента и название текущего агентства. WhatsApp получит готовое сообщение со ссылкой. Viber откроет переписку именно с выбранным клиентом, а готовое сообщение с ссылкой на PDF автоматически скопируется — останется вставить и отправить.</p>
          <div className="grid4">
            <Button className="full sendWhatsApp" onClick={async()=>{if(await openWhatsAppPresentation({phone:presentationClientPhone,url:presentationUrl,lang:presentationLang,agencyName,clientName:presentationClient,title:local.title,isSelection:false})) logPropertyPresentationSend("whatsapp");}}>WhatsApp · отправить</Button>
            <Button className="full sendViber" onClick={async()=>{if(await openViberPresentation({phone:presentationClientPhone,url:presentationUrl,lang:presentationLang,agencyName,clientName:presentationClient,title:local.title,isSelection:false})) logPropertyPresentationSend("viber");}}>Viber · клиент</Button>
            <Button className="full sendEmail" onClick={()=>{openEmailPresentation({email:presentationClientEmail,url:presentationUrl,lang:presentationLang,agencyName,clientName:presentationClient,title:local.title,isSelection:false});logPropertyPresentationSend("email");}}>Email</Button>
            <Button className="full sendShare" onClick={()=>{nativeSharePresentation({url:presentationUrl,downloadUrl:presentationUrl,lang:presentationLang,agencyName,clientName:presentationClient,title:local.title,isSelection:false});logPropertyPresentationSend("share");}}>Поделиться</Button>
            <a className="btn green full" href={presentationUrl} target="_blank" rel="noopener noreferrer">Открыть PDF</a>
          </div>
        </div>
        <div className="grid2">
          <a className="btn green full" href={presentationUrl} target="_blank" rel="noopener noreferrer">Открыть PDF-презентацию</a>
          <Button variant="soft" onClick={async()=>{try{await navigator.clipboard.writeText(presentationUrl); alert("Ссылка скопирована");}catch{alert("Ссылка создана, но браузер не дал скопировать автоматически");}}}>Скопировать ссылку клиенту</Button>
        </div>
      </div>}
    </div>

    <div className="card">
      <h3>Фото / видео объекта</h3>

      <div className="grid4">
        <Button variant={mediaKind==="Фото" ? "primary" : "soft"} onClick={()=>setMediaKind("Фото")}>Фото</Button>
        <Button variant={mediaKind==="Видео" ? "primary" : "soft"} onClick={()=>setMediaKind("Видео")}>Видео</Button>
      </div>

      <input className="input" type="file" multiple disabled={!canEditProperty} accept="image/*,video/*" onChange={e=>{const files=Array.from(e.target.files || []); setMediaFiles(files); setMediaFile(files[0] || null);}}/>
      <Button className="full" onClick={addMediaBatch} disabled={!canEditProperty}>Добавить фото/видео</Button>

      <div className="grid2">
        {mediaList.map((m,i)=>
          <div
            key={m.id || m.url || i}
            draggable={canManagePropertyMedia}
            onDragStart={()=>setDraggedMediaIndex(i)}
            onDragOver={e=>{if(canManagePropertyMedia)e.preventDefault();}}
            onDrop={e=>{
              e.preventDefault();
              if (draggedMediaIndex !== null) movePropertyMedia(draggedMediaIndex,i);
              setDraggedMediaIndex(null);
            }}
            onDragEnd={()=>setDraggedMediaIndex(null)}
            style={{
              position:"relative",
              padding:8,
              borderRadius:18,
              border:i===0 ? "2px solid #f59e0b" : "1px solid rgba(148,163,184,.35)",
              opacity:draggedMediaIndex===i ? .55 : 1,
              cursor:canManagePropertyMedia ? "grab" : "default"
            }}
          >
            {i===0 && <span style={{position:"absolute",top:12,left:12,zIndex:3,background:"#f59e0b",color:"#111",padding:"5px 9px",borderRadius:999,fontSize:11,fontWeight:900}}>⭐ Главное</span>}
            <div onClick={()=>setViewer(i)} style={{cursor:"pointer"}}>
              <Media kind={m.kind} name={m.url} small />
            </div>

            {canManagePropertyMedia && <div className="row" style={{marginTop:8,gap:6,flexWrap:"wrap"}}>
              <Button variant="soft" disabled={i===0} onClick={()=>movePropertyMedia(i,i-1)}>←</Button>
              <Button variant="soft" disabled={i===mediaList.length-1} onClick={()=>movePropertyMedia(i,i+1)}>→</Button>
              {i!==0 && <Button variant="soft" onClick={()=>makePropertyMediaMain(i)}>⭐ Главная</Button>}
              <Button variant="danger" onClick={()=>deletePropertyMedia(m,i)}>Удалить</Button>
            </div>}
          </div>
        )}
      </div>
    </div>

    {currentMedia && <Modal onClose={()=>setViewer(null)} wide>
      <div className="row" style={{justifyContent:"space-between"}}>
        <button className="icon" onClick={prevMedia}>‹</button>
        <h2>{currentMedia.kind} {viewer + 1}/{mediaList.length}{viewer===0 ? " · Главное" : ""}</h2>
        <button className="icon" onClick={nextMedia}>›</button>
        <button className="icon" onClick={()=>setViewer(null)}>×</button>
      </div>

      {currentMedia.kind === "Видео"
        ? <video src={currentMedia.url} controls autoPlay style={{width:"100%",borderRadius:20}} />
        : <img src={currentMedia.url} alt="Фото" style={{width:"100%",borderRadius:20,maxHeight:"72vh",objectFit:"contain",background:"#111"}} />
      }

      {canManagePropertyMedia && <div className="card" style={{marginTop:14}}>
        <div className="grid4">
          <Button variant="soft" disabled={viewer===0} onClick={()=>movePropertyMedia(viewer,viewer-1)}>← Сдвинуть</Button>
          <Button variant="soft" disabled={viewer===mediaList.length-1} onClick={()=>movePropertyMedia(viewer,viewer+1)}>Сдвинуть →</Button>
          <Button variant="soft" disabled={viewer===0} onClick={()=>makePropertyMediaMain(viewer)}>⭐ Сделать главной</Button>
          <Button variant="danger" onClick={()=>deletePropertyMedia(currentMedia,viewer)}>🗑 Удалить фото</Button>
        </div>
        <p className="muted" style={{marginBottom:0}}>Порядок фотографий можно также менять перетаскиванием миниатюр.</p>
      </div>}
    </Modal>}
  </Modal>;
}


// ===== Сделки в Supabase (раньше — только в браузере одного телефона). API как у useStorage: [deals, setDeals] =====
function dealFromDb(r){
  return {id:r.local_id || ("DB-"+r.id), dbId:r.id, leadId:r.lead_id ? String(r.lead_id) : "", client:r.client || "", phone:r.phone || "",
    manager:r.manager_name || "", manager_email:r.manager_email || "", propertyId:r.property_id ? String(r.property_id) : "",
    amount:r.amount ?? "", commission:r.commission ?? "", date:r.deal_date || (r.created_at || "").slice(0,10), comment:r.comment || "", status:r.status || ""};
}
function dealToDb(d){
  const num = v => { const n = Number(String(v ?? "").replace(/[^\d.]/g,"")); return String(v ?? "").trim() && Number.isFinite(n) ? n : null; };
  return {local_id:String(d.id), lead_id:/^\d+$/.test(String(d.leadId||"")) ? Number(d.leadId) : null, client:d.client || null, phone:d.phone || null,
    manager_name:d.manager || null, manager_email:d.manager_email || null, property_id:/^\d+$/.test(String(d.propertyId||"")) ? Number(d.propertyId) : null,
    amount:num(d.amount), commission:num(d.commission), deal_date:/^\d{4}-\d{2}-\d{2}$/.test(String(d.date||"")) ? d.date : null, comment:d.comment || null,
    status:d.status || null, title:d.client || "Сделка", updated_at:new Date().toISOString()};
}
function useDealsStore(profile){
  const [deals,setRaw] = useState([]);
  const [loaded,setLoaded] = useState(false);
  const ref = useRef([]);
  const timers = useRef({});
  const load = async () => {
    const {data,error} = await supabase.from("deals").select("*").order("created_at",{ascending:false});
    if(error){ console.warn("deals load:", error.message); return; }
    const pendingLocal = ref.current.filter(d => !d.dbId);
    const loaded = (data||[]).map(dealFromDb);
    ref.current = [...pendingLocal.filter(p => !loaded.some(x => x.id === p.id)), ...loaded];
    setRaw(ref.current); setLoaded(true);
  };
  const migrate = async () => {
    try {
      if(localStorage.getItem("deals_migrated_v1")) return;
      const old = JSON.parse(localStorage.getItem("crm_deals") || "[]");
      const rows = (Array.isArray(old) ? old : []).map(dealToDb).filter(r => r.lead_id);
      if(rows.length){ const {error} = await supabase.from("deals").upsert(rows,{onConflict:"local_id",ignoreDuplicates:true}); if(error){ console.warn("deals migrate:", error.message); return; } }
      localStorage.setItem("deals_migrated_v1","1");
    } catch(e){ console.warn(e); }
  };
  useEffect(() => {
    if(!profile?.id) return;
    (async () => { await migrate(); await load(); })();
    let rt = null;
    const ch = supabase.channel("crm-deals-live").on("postgres_changes",{event:"*",schema:"public",table:"deals"},() => {
      if(rt) return; rt = setTimeout(() => { rt = null; if(document.visibilityState === "visible") load(); }, 1500);
    }).subscribe();
    return () => { if(rt) clearTimeout(rt); supabase.removeChannel(ch); };
  }, [profile?.id]);
  const setDeals = (next) => {
    const prev = ref.current;
    const arr = typeof next === "function" ? next(prev) : next;
    ref.current = arr; setRaw(arr);
    const prevById = new Map(prev.map(d => [String(d.id), d]));
    arr.forEach(d => {
      const old = prevById.get(String(d.id));
      if(old && JSON.stringify(old) === JSON.stringify(d)) return;
      const row = dealToDb(d);
      if(!row.lead_id) return; // демо-клиенты без записи в базе не сохраняются
      // Поля вводятся с клавиатуры — сохраняем через 0.8 сек после последнего изменения
      clearTimeout(timers.current[d.id]);
      timers.current[d.id] = setTimeout(async () => {
        const {data,error} = await supabase.from("deals").upsert(row,{onConflict:"local_id"}).select().single();
        if(error){ alert("Ошибка сохранения сделки: " + error.message); return; }
        ref.current = ref.current.map(x => String(x.id) === String(d.id) ? {...x, dbId:data.id} : x); setRaw(ref.current);
      }, old ? 800 : 0);
    });
  };
  return [deals, setDeals, loaded];
}

function Deals({leads,properties,currentProfile,role,lang,dealsState}) {
  const ownDeals = useDealsStore(dealsState ? null : currentProfile);
  const [deals,setDeals,dealsLoaded] = dealsState || ownDeals; // раньше: useStorage("crm_deals") — только в браузере
  const [viewMode,setViewMode] = useStorage("deals_view_mode","kanban");
  const [statusFilter,setStatusFilter] = useState("Все");
  const [search,setSearch] = useState("");
  const isTech = role === "Администратор тех отдел";
  const isDirector = role === "Администратор директор";
  const myEmail = String(currentProfile?.email || "").toLowerCase();
  const dealStages=["Новая сделка","Документы","Расчёт","Закрыта"];

  useEffect(()=>{
    if(!dealsLoaded) return; // ждём загрузки из базы, иначе создадутся дубли
    const dealLeads=(leads||[]).filter(l=>l.status==="Сделка");
    setDeals(prev=>{
      const next=[...prev];
      dealLeads.forEach(l=>{
        if(!next.some(d=>String(d.leadId)===String(l.id))){
          next.unshift({id:"D-lead-"+l.id,leadId:l.id,client:l.name||"",phone:l.phone||"",manager:l.manager||"",manager_email:l.manager_email||"",propertyId:"",amount:"",commission:"",date:new Date().toISOString().slice(0,10),comment:"",status:"Новая сделка"});
        }
      });
      return next;
    });
  },[leads,dealsLoaded]);

  const scoped=deals.filter(d=>isTech||isDirector||String(d.manager_email||"").toLowerCase()===myEmail);
  const visible=scoped.filter(d=>{
    const statusOk=statusFilter==="Все"||d.status===statusFilter;
    const q=search.trim().toLowerCase().replace(/\s+/g,"");
    const searchOk=!q||`${d.client||""} ${d.phone||""} ${d.manager||""}`.toLowerCase().replace(/\s+/g,"").includes(q);
    return statusOk&&searchOk;
  });
  const update=(id,patch)=>setDeals(prev=>prev.map(d=>d.id===id?{...d,...patch}:d));

  const dealEditor=d=><div className="card dealRow" key={d.id}>
    <div className="row"><div><h3>{d.client||tr(lang,"Клиент")}</h3><p className="muted">{d.phone||""} · {d.manager}</p></div>{badge(d.id,"gold")}</div>
    <div className="grid3">
      <Field label={tr(lang,"Статус сделки")}><select className="input" value={d.status||dealStages[0]} onChange={e=>update(d.id,{status:e.target.value})}>{dealStages.map(x=><option key={x}>{tr(lang,x)}</option>)}</select></Field>
      <Field label={tr(lang,"Объект сделки")}><select className="input" value={d.propertyId||""} onChange={e=>update(d.id,{propertyId:e.target.value})}><option value="">—</option>{properties.map(p=><option key={p.id} value={p.id}>{p.title||p.id}</option>)}</select></Field>
      <Field label={tr(lang,"Сумма сделки")}><input className="input" value={d.amount||""} onChange={e=>update(d.id,{amount:e.target.value})}/></Field>
      <Field label={tr(lang,"Комиссия")}><input className="input" value={d.commission||""} onChange={e=>update(d.id,{commission:e.target.value})}/></Field>
      <Field label={tr(lang,"Дата сделки")}><input className="input" type="date" value={d.date||""} onChange={e=>update(d.id,{date:e.target.value})}/></Field>
    </div>
    <Field label={tr(lang,"Комментарий по сделке")}><textarea className="input" value={d.comment||""} onChange={e=>update(d.id,{comment:e.target.value})}/></Field>
    <Button className="full" onClick={()=>alert(tr(lang,"Сделка сохранена"))}>{tr(lang,"Сохранить сделку")}</Button>
  </div>;

  return <main className="screen">
    <div className="card dark"><h2>{tr(lang,"Сделки")}</h2><p>{isTech||isDirector?tr(lang,"Все сделки агентства"):tr(lang,"Только твои сделки")}</p></div>
    <div className="card dealsToolbar">
      <div className="search" style={{margin:0}}>🔎 <input value={search} onChange={e=>setSearch(e.target.value)} placeholder={tr(lang,"Поиск сделки по клиенту или телефону...")} /></div>
      <div className="row" style={{marginTop:10}}>
        <div className="grid2" style={{maxWidth:280}}><Button variant={viewMode==="kanban"?"primary":"soft"} onClick={()=>setViewMode("kanban")}>{tr(lang,"Канбан")}</Button><Button variant={viewMode==="list"?"primary":"soft"} onClick={()=>setViewMode("list")}>{tr(lang,"Список")}</Button></div>
        <select className="input" style={{maxWidth:280}} value={statusFilter} onChange={e=>setStatusFilter(e.target.value)}><option>Все</option>{dealStages.map(x=><option key={x}>{tr(lang,x)}</option>)}</select>
      </div>
    </div>
    {visible.length===0&&<div className="card"><p className="muted">{tr(lang,"Нет сделок")}</p></div>}
    {viewMode==="list"&&visible.length>0&&<div className="card" style={{overflowX:"auto"}}><table className="clientTable dealTable" style={{width:"100%",borderCollapse:"collapse",minWidth:1000}}><thead><tr>{["Клиент","Телефон","Статус сделки","Объект сделки","Сумма сделки","Комиссия","Дата сделки","Ответственный"].map(h=><th key={h}>{tr(lang,h)}</th>)}</tr></thead><tbody>{visible.map(d=><tr key={d.id} onDoubleClick={()=>setViewMode("kanban")}><td><b>{d.client||"—"}</b></td><td>{d.phone||"—"}</td><td>{tr(lang,d.status||dealStages[0])}</td><td>{properties.find(p=>String(p.id)===String(d.propertyId))?.title||"—"}</td><td>{d.amount||"—"}</td><td>{d.commission||"—"}</td><td>{d.date||"—"}</td><td>{d.manager||"—"}</td></tr>)}</tbody></table></div>}
    {viewMode==="kanban"&&<div className="kanban dealsKanban">{dealStages.map(stage=><section className="kanbanCol" key={stage} onDragOver={e=>e.preventDefault()} onDrop={e=>{const id=e.dataTransfer.getData("dealId");if(id)update(id,{status:stage});}}><div className="kanbanHead"><b>{tr(lang,stage)}</b>{badge(visible.filter(d=>(d.status||dealStages[0])===stage).length,"gold")}</div>{visible.filter(d=>(d.status||dealStages[0])===stage).map(d=><div draggable onDragStart={e=>e.dataTransfer.setData("dealId",d.id)} key={d.id}>{dealEditor(d)}</div>)}</section>)}</div>}
  </main>;
}

const analyticsSourceCatalog = [
  // Украина — актуальные площадки поиска и рекламы недвижимости
  {country:"Украина",name:"DIM.RIA",aliases:["DOM.RIA","DIM.RIA","dom.ria.com","domria"],method:"WEB",url:"https://dom.ria.com/uk/prodazha-nedvizhimosti/"},
  {country:"Украина",name:"OLX",aliases:["OLX","OLX.ua","olx.ua"],method:"WEB",url:"https://www.olx.ua/uk/nedvizhimost/"},
  {country:"Украина",name:"RIELTOR.UA",aliases:["RIELTOR.UA","Rieltor.ua","RIELTOR","rieltor.ua"],method:"WEB",url:"https://rieltor.ua/flats-sale/"},
  {country:"Украина",name:"REM.ua",aliases:["REM","REM.ua","rem.ua"],method:"WEB",url:"https://rem.ua/ua"},
  {country:"Украина",name:"ЛУН",aliases:["ЛУН","LUN","lun.ua"],method:"WEB",url:"https://lun.ua/"},
  {country:"Украина",name:"M2bomber",aliases:["M2bomber","m2bomber","ua.m2bomber.com"],method:"WEB",url:"https://ua.m2bomber.com/"},
  {country:"Украина",name:"Telegram",aliases:["Telegram","Телеграм","Телеграмм"],method:"TELEGRAM",url:""},
  {country:"Украина",name:"Facebook Marketplace",aliases:["Facebook","Facebook Marketplace"],method:"WEB",url:"https://www.facebook.com/marketplace/category/propertyforsale"},

  // Кавказ / Восточная Европа
  {country:"Грузия",name:"MyHome.ge",aliases:["MyHome.ge","myhome.ge"],method:"WEB",url:"https://www.myhome.ge/en/"},
  {country:"Грузия",name:"SS.ge",aliases:["SS.ge","ss.ge","home.ss.ge"],method:"WEB",url:"https://home.ss.ge/en/real-estate/"},
  {country:"Грузия",name:"Korter.ge",aliases:["Korter.ge","korter.ge","Korter"],method:"WEB",url:"https://korter.ge/en"},
  {country:"Польша",name:"Otodom",aliases:["Otodom","otodom.pl"],method:"WEB",url:"https://www.otodom.pl/pl/wyniki/sprzedaz/mieszkanie/cala-polska"},
  {country:"Польша",name:"OLX Nieruchomości",aliases:["OLX.pl","OLX Nieruchomości"],method:"WEB",url:"https://www.olx.pl/nieruchomosci/mieszkania/sprzedaz/"},
  {country:"Чехия",name:"Sreality.cz",aliases:["Sreality","sreality.cz"],method:"WEB",url:"https://www.sreality.cz/hledani/prodej/byty"},
  {country:"Австрия",name:"willhaben Immobilien",aliases:["willhaben","willhaben.at"],method:"WEB",url:"https://www.willhaben.at/iad/immobilien/immobilien/angebote"},
  {country:"Швеция",name:"Hemnet",aliases:["Hemnet","hemnet.se"],method:"WEB",url:"https://www.hemnet.se/bostader"},
  {country:"Ирландия",name:"Daft.ie",aliases:["Daft","Daft.ie","daft.ie"],method:"WEB",url:"https://www.daft.ie/property-for-sale/ireland"},
  {country:"Бельгия",name:"Immoweb",aliases:["Immoweb","immoweb.be"],method:"WEB",url:"https://www.immoweb.be/en/search/house-and-apartment/for-sale"},
  {country:"Швейцария",name:"Homegate",aliases:["Homegate","homegate.ch"],method:"WEB",url:"https://www.homegate.ch/buy/real-estate/country-switzerland/matching-list"},

  // ОАЭ / Ближний Восток
  {country:"ОАЭ",name:"Property Finder",aliases:["Property Finder","propertyfinder.ae"],method:"WEB",url:"https://www.propertyfinder.ae/en/buy/properties-for-sale.html"},
  {country:"ОАЭ",name:"Bayut",aliases:["Bayut","bayut.com"],method:"WEB",url:"https://www.bayut.com/for-sale/property/uae/"},
  {country:"ОАЭ",name:"Dubizzle",aliases:["Dubizzle","dubizzle"],method:"WEB",url:"https://dubai.dubizzle.com/en/property-for-sale/"},

  // Западная Европа
  {country:"Испания",name:"idealista",aliases:["idealista","idealista.com"],method:"WEB",url:"https://www.idealista.com/venta-viviendas/"},
  {country:"Испания",name:"Fotocasa",aliases:["Fotocasa","fotocasa.es"],method:"WEB",url:"https://www.fotocasa.es/es/comprar/viviendas/espana/todas-las-zonas/l"},
  {country:"Португалия",name:"idealista",aliases:["idealista","idealista.pt"],method:"WEB",url:"https://www.idealista.pt/comprar-casas/"},
  {country:"Португалия",name:"Imovirtual",aliases:["Imovirtual","imovirtual.com"],method:"WEB",url:"https://www.imovirtual.com/pt/resultados/comprar/imoveis/todo-o-pais"},
  {country:"Италия",name:"Immobiliare.it",aliases:["Immobiliare.it","Immobiliare"],method:"WEB",url:"https://www.immobiliare.it/vendita-case/"},
  {country:"Италия",name:"idealista",aliases:["idealista","idealista.it"],method:"WEB",url:"https://www.idealista.it/vendita-case/"},
  {country:"Германия",name:"ImmoScout24",aliases:["ImmoScout24","ImmobilienScout24","immobilienscout24.de"],method:"WEB",url:"https://www.immobilienscout24.de/Suche/de/wohnung-kaufen"},
  {country:"Германия",name:"Immowelt",aliases:["Immowelt","immowelt.de"],method:"WEB",url:"https://www.immowelt.de/suche/deutschland/wohnungen/kaufen"},
  {country:"Франция",name:"SeLoger",aliases:["SeLoger","seloger.com"],method:"WEB",url:"https://www.seloger.com/list.htm?projects=2"},
  {country:"Великобритания",name:"Rightmove",aliases:["Rightmove","rightmove.co.uk"],method:"WEB",url:"https://www.rightmove.co.uk/property-for-sale.html"},
  {country:"Великобритания",name:"Zoopla",aliases:["Zoopla","zoopla.co.uk"],method:"WEB",url:"https://www.zoopla.co.uk/for-sale/property/uk/"},
  {country:"Нидерланды",name:"Funda",aliases:["Funda","funda.nl"],method:"WEB",url:"https://www.funda.nl/zoeken/koop/"},
  {country:"Греция",name:"Spitogatos",aliases:["Spitogatos","spitogatos.gr"],method:"WEB",url:"https://www.spitogatos.gr/en/property-for-sale"},
  {country:"Кипр",name:"Bazaraki",aliases:["Bazaraki","bazaraki.com"],method:"WEB",url:"https://www.bazaraki.com/real-estate-for-sale/"},
  {country:"Турция",name:"sahibinden",aliases:["sahibinden","sahibinden.com"],method:"WEB",url:"https://www.sahibinden.com/satilik"},

  // Азия
  {country:"Таиланд",name:"FazWaz",aliases:["FazWaz","fazwaz.com"],method:"WEB",url:"https://www.fazwaz.com/property-for-sale/thailand"},
  {country:"Таиланд",name:"DDproperty",aliases:["DDproperty","ddproperty.com"],method:"WEB",url:"https://www.ddproperty.com/en/property-for-sale"},
  {country:"Индонезия / Бали",name:"Rumah123",aliases:["Rumah123","rumah123.com"],method:"WEB",url:"https://www.rumah123.com/jual/"},
  {country:"Индонезия / Бали",name:"Rumah.com",aliases:["Rumah.com","rumah.com"],method:"WEB",url:"https://www.rumah.com/properti-dijual"},
  {country:"Сингапур",name:"PropertyGuru",aliases:["PropertyGuru","propertyguru.com.sg"],method:"WEB",url:"https://www.propertyguru.com.sg/property-for-sale"},
  {country:"Сингапур",name:"99.co",aliases:["99.co"],method:"WEB",url:"https://www.99.co/singapore/sale"},
  {country:"Малайзия",name:"PropertyGuru",aliases:["PropertyGuru","propertyguru.com.my"],method:"WEB",url:"https://www.propertyguru.com.my/property-for-sale"},

  // Северная Америка / Австралия
  {country:"США",name:"Zillow",aliases:["Zillow","zillow.com"],method:"WEB",url:"https://www.zillow.com/homes/for_sale/"},
  {country:"США",name:"Realtor.com",aliases:["Realtor.com","realtor.com"],method:"WEB",url:"https://www.realtor.com/realestateandhomes-search"},
  {country:"США",name:"Redfin",aliases:["Redfin","redfin.com"],method:"WEB",url:"https://www.redfin.com/"},
  {country:"Канада",name:"REALTOR.ca",aliases:["REALTOR.ca","realtor.ca"],method:"WEB",url:"https://www.realtor.ca/map"},
  {country:"Австралия",name:"realestate.com.au",aliases:["realestate.com.au","REA"],method:"WEB",url:"https://www.realestate.com.au/buy/"},
  {country:"Австралия",name:"Domain",aliases:["Domain","domain.com.au"],method:"WEB",url:"https://www.domain.com.au/sale/"}
];

const analyticsGeoCatalog = {
  "Украина":{
    regions:{
      "г. Киев":["Киев"],
      "Винницкая область":["Винница","Жмеринка","Казатин","Хмельник","Могилев-Подольский","Гайсин","Ладыжин"],
      "Волынская область":["Луцк","Ковель","Нововолынск","Владимир"],
      "Днепропетровская область":["Днепр","Кривой Рог","Каменское","Никополь","Павлоград","Самар"],
      "Донецкая область":["Донецк","Мариуполь","Краматорск","Славянск","Дружковка","Константиновка","Покровск"],
      "Житомирская область":["Житомир","Бердичев","Коростень","Звягель"],
      "Закарпатская область":["Ужгород","Мукачево","Хуст","Берегово","Виноградов"],
      "Запорожская область":["Запорожье","Бердянск","Мелитополь"],
      "Ивано-Франковская область":["Ивано-Франковск","Калуш","Коломыя","Яремче","Надворная"],
      "Киевская область":["Белая Церковь","Борисполь","Бровары","Буча","Васильков","Вышгород","Вишневое","Ирпень","Боярка","Обухов","Фастов","Украинка"],
      "Кировоградская область":["Кропивницкий","Александрия","Светловодск"],
      "Луганская область":["Луганск","Северодонецк","Лисичанск"],
      "Львовская область":["Львов","Дрогобыч","Стрый","Трускавец","Самбор","Шептицкий","Борислав"],
      "Николаевская область":["Николаев","Первомайск","Вознесенск"],
      "Одесская область":["Одесса","Черноморск","Пивденное","Измаил","Белгород-Днестровский","Подольск","Балта","Рени","Килия","Болград","Раздельная","Арциз"],
      "Полтавская область":["Полтава","Кременчуг","Лубны","Миргород","Горишние Плавни"],
      "Ровненская область":["Ровно","Дубно","Вараш","Острог"],
      "Сумская область":["Сумы","Конотоп","Шостка","Ромны","Ахтырка"],
      "Тернопольская область":["Тернополь","Чортков","Кременец"],
      "Харьковская область":["Харьков","Лозовая","Изюм","Чугуев","Златополь"],
      "Херсонская область":["Херсон","Новая Каховка"],
      "Хмельницкая область":["Хмельницкий","Каменец-Подольский","Шепетовка","Нетешин","Староконстантинов"],
      "Черкасская область":["Черкассы","Умань","Смела","Золотоноша"],
      "Черновицкая область":["Черновцы","Новоднестровск"],
      "Черниговская область":["Чернигов","Нежин","Прилуки"]
    }
  },
  "Грузия":{regions:{"Тбилиси":["Тбилиси"],"Аджария":["Батуми","Кобулети","Гонио","Квариати"],"Имерети":["Кутаиси"],"Квемо-Картли":["Рустави"],"Самцхе-Джавахети":["Бакуриани","Боржоми"],"Мцхета-Мтианети":["Гудаури","Мцхета"]}},
  "ОАЭ":{regions:{"Дубай":["Дубай"],"Абу-Даби":["Абу-Даби","Аль-Айн"],"Шарджа":["Шарджа"],"Аджман":["Аджман"],"Рас-эль-Хайма":["Рас-эль-Хайма"]}},
  "Испания":{regions:{"Мадрид":["Мадрид"],"Каталония":["Барселона"],"Валенсия":["Валенсия","Аликанте"],"Андалусия":["Малага","Марбелья","Севилья"],"Балеарские острова":["Пальма-де-Майорка","Ибица"],"Канарские острова":["Лас-Пальмас","Санта-Крус-де-Тенерифе"]}},
  "Португалия":{regions:{"Лиссабон":["Лиссабон","Кашкайш"],"Порту":["Порту"],"Алгарве":["Фару","Албуфейра","Лагуш"]}},
  "Италия":{regions:{"Лацио":["Рим"],"Ломбардия":["Милан"],"Тоскана":["Флоренция"],"Пьемонт":["Турин"],"Венето":["Венеция"],"Кампания":["Неаполь"],"Сицилия":["Палермо"]}},
  "Германия":{regions:{"Берлин":["Берлин"],"Бавария":["Мюнхен"],"Гамбург":["Гамбург"],"Гессен":["Франкфурт-на-Майне"],"Северный Рейн-Вестфалия":["Дюссельдорф","Кёльн"]}},
  "Франция":{regions:{"Иль-де-Франс":["Париж"],"Прованс — Альпы — Лазурный Берег":["Ницца","Канны","Марсель"],"Овернь — Рона — Альпы":["Лион"],"Новая Аквитания":["Бордо"]}},
  "Великобритания":{regions:{"Англия":["Лондон","Манчестер","Бирмингем","Ливерпуль"],"Шотландия":["Эдинбург","Глазго"],"Уэльс":["Кардифф"]}},
  "Польша":{regions:{"Мазовецкое":["Варшава"],"Малопольское":["Краков"],"Поморское":["Гданьск"],"Нижнесилезское":["Вроцлав"],"Великопольское":["Познань"]}},
  "Нидерланды":{regions:{"Северная Голландия":["Амстердам"],"Южная Голландия":["Роттердам","Гаага"],"Утрехт":["Утрехт"]}},
  "Греция":{regions:{"Аттика":["Афины"],"Центральная Македония":["Салоники"],"Крит":["Ираклион","Ханья"]}},
  "Кипр":{regions:{"Лимасол":["Лимасол"],"Пафос":["Пафос"],"Ларнака":["Ларнака"],"Никосия":["Никосия"]}},
  "Турция":{regions:{"Стамбул":["Стамбул"],"Анталья":["Анталья","Аланья"],"Мугла":["Бодрум","Фетхие"],"Измир":["Измир"]}},
  "Таиланд":{regions:{"Бангкок":["Бангкок"],"Пхукет":["Пхукет"],"Чонбури":["Паттайя"],"Чиангмай":["Чиангмай"],"Сураттхани":["Самуи"]}},
  "Индонезия / Бали":{regions:{"Бали":["Денпасар","Чангу","Семиньяк","Убуд","Санур","Нуса-Дуа","Улувату"],"Джакарта":["Джакарта"]}},
  "Сингапур":{regions:{"Сингапур":["Сингапур"]}},"Малайзия":{regions:{"Куала-Лумпур":["Куала-Лумпур"],"Пенанг":["Джорджтаун"],"Джохор":["Джохор-Бару"]}},
  "США":{regions:{"Нью-Йорк":["Нью-Йорк"],"Флорида":["Майами","Орландо"],"Калифорния":["Лос-Анджелес","Сан-Диего","Сан-Франциско"],"Техас":["Остин","Даллас","Хьюстон"]}},
  "Канада":{regions:{"Онтарио":["Торонто","Оттава"],"Британская Колумбия":["Ванкувер"],"Квебек":["Монреаль"]}},
  "Австралия":{regions:{"Новый Южный Уэльс":["Сидней"],"Виктория":["Мельбурн"],"Квинсленд":["Брисбен","Голд-Кост"],"Западная Австралия":["Перт"]}}
};

const analyticsGeoI18n = {
  "Украина":{uk:"Україна",en:"Ukraine"},
  "г. Киев":{uk:"м. Київ",en:"Kyiv"},
  "Винницкая область":{uk:"Вінницька область",en:"Vinnytsia region"},"Волынская область":{uk:"Волинська область",en:"Volyn region"},
  "Днепропетровская область":{uk:"Дніпропетровська область",en:"Dnipropetrovsk region"},"Донецкая область":{uk:"Донецька область",en:"Donetsk region"},
  "Житомирская область":{uk:"Житомирська область",en:"Zhytomyr region"},"Закарпатская область":{uk:"Закарпатська область",en:"Zakarpattia region"},
  "Запорожская область":{uk:"Запорізька область",en:"Zaporizhzhia region"},"Ивано-Франковская область":{uk:"Івано-Франківська область",en:"Ivano-Frankivsk region"},
  "Киевская область":{uk:"Київська область",en:"Kyiv region"},"Кировоградская область":{uk:"Кіровоградська область",en:"Kirovohrad region"},
  "Луганская область":{uk:"Луганська область",en:"Luhansk region"},"Львовская область":{uk:"Львівська область",en:"Lviv region"},
  "Николаевская область":{uk:"Миколаївська область",en:"Mykolaiv region"},"Одесская область":{uk:"Одеська область",en:"Odesa region"},
  "Полтавская область":{uk:"Полтавська область",en:"Poltava region"},"Ровненская область":{uk:"Рівненська область",en:"Rivne region"},
  "Сумская область":{uk:"Сумська область",en:"Sumy region"},"Тернопольская область":{uk:"Тернопільська область",en:"Ternopil region"},
  "Харьковская область":{uk:"Харківська область",en:"Kharkiv region"},"Херсонская область":{uk:"Херсонська область",en:"Kherson region"},
  "Хмельницкая область":{uk:"Хмельницька область",en:"Khmelnytskyi region"},"Черкасская область":{uk:"Черкаська область",en:"Cherkasy region"},
  "Черновицкая область":{uk:"Чернівецька область",en:"Chernivtsi region"},"Черниговская область":{uk:"Чернігівська область",en:"Chernihiv region"},
  "Киев":{uk:"Київ",en:"Kyiv"},"Одесса":{uk:"Одеса",en:"Odesa"},"Харьков":{uk:"Харків",en:"Kharkiv"},"Днепр":{uk:"Дніпро",en:"Dnipro"},
  "Львов":{uk:"Львів",en:"Lviv"},"Николаев":{uk:"Миколаїв",en:"Mykolaiv"},"Запорожье":{uk:"Запоріжжя",en:"Zaporizhzhia"},"Ровно":{uk:"Рівне",en:"Rivne"},
  "Черновцы":{uk:"Чернівці",en:"Chernivtsi"},"Ужгород":{uk:"Ужгород",en:"Uzhhorod"},"Ивано-Франковск":{uk:"Івано-Франківськ",en:"Ivano-Frankivsk"},
  "Винница":{uk:"Вінниця",en:"Vinnytsia"},"Луцк":{uk:"Луцьк",en:"Lutsk"},"Житомир":{uk:"Житомир",en:"Zhytomyr"},"Кропивницкий":{uk:"Кропивницький",en:"Kropyvnytskyi"},
  "Полтава":{uk:"Полтава",en:"Poltava"},"Сумы":{uk:"Суми",en:"Sumy"},"Тернополь":{uk:"Тернопіль",en:"Ternopil"},"Херсон":{uk:"Херсон",en:"Kherson"},
  "Хмельницкий":{uk:"Хмельницький",en:"Khmelnytskyi"},"Черкассы":{uk:"Черкаси",en:"Cherkasy"},"Чернигов":{uk:"Чернігів",en:"Chernihiv"},
  "Белая Церковь":{uk:"Біла Церква",en:"Bila Tserkva"},"Борисполь":{uk:"Бориспіль",en:"Boryspil"},"Бровары":{uk:"Бровари",en:"Brovary"},"Буча":{uk:"Буча",en:"Bucha"},
  "Васильков":{uk:"Васильків",en:"Vasylkiv"},"Ирпень":{uk:"Ірпінь",en:"Irpin"},"Черноморск":{uk:"Чорноморськ",en:"Chornomorsk"},"Пивденное":{uk:"Південне",en:"Pivdenne"},
  "Измаил":{uk:"Ізмаїл",en:"Izmail"},"Белгород-Днестровский":{uk:"Білгород-Дністровський",en:"Bilhorod-Dnistrovskyi"},"Подольск":{uk:"Подільськ",en:"Podilsk"},
  "Самар":{uk:"Самар",en:"Samar"},"Шептицкий":{uk:"Шептицький",en:"Sheptytskyi"},"Звягель":{uk:"Звягель",en:"Zviahel"},
  "Приморский":{uk:"Приморський",en:"Prymorskyi"},"Киевский":{uk:"Київський",en:"Kyivskyi"},"Хаджибейский":{uk:"Хаджибейський",en:"Khadzhybeiskyi"},"Пересыпский":{uk:"Пересипський",en:"Peresypskyi"},
  "Голосеевский":{uk:"Голосіївський",en:"Holosiivskyi"},"Дарницкий":{uk:"Дарницький",en:"Darnytskyi"},"Деснянский":{uk:"Деснянський",en:"Desnianskyi"},"Днепровский":{uk:"Дніпровський",en:"Dniprovskyi"},
  "Оболонский":{uk:"Оболонський",en:"Obolonskyi"},"Печерский":{uk:"Печерський",en:"Pecherskyi"},"Подольский":{uk:"Подільський",en:"Podilskyi"},"Святошинский":{uk:"Святошинський",en:"Sviatoshynskyi"},
  "Соломенский":{uk:"Солом'янський",en:"Solomianskyi"},"Шевченковский":{uk:"Шевченківський",en:"Shevchenkivskyi"},"Соборный":{uk:"Соборний",en:"Sobornyi"},"Центральный":{uk:"Центральний",en:"Tsentralnyi"}
};

const officialCityDistricts = {
  // DIM.RIA: официальные административные районы, без микрорайонов/ЖК.
  "Украина|Одесса":["Приморский","Киевский","Хаджибейский","Пересыпский"],
  "Украина|Киев":["Голосеевский","Дарницкий","Деснянский","Днепровский","Оболонский","Печерский","Подольский","Святошинский","Соломенский","Шевченковский"],
  "Украина|Харьков":["Основянский","Немышлянский","Индустриальный","Новобаварский","Салтовский","Холодногорский","Слободской","Киевский","Шевченковский"],
  "Украина|Днепр":["Амур-Нижнеднепровский","Индустриальный","Новокодакский","Самарский","Соборный","Центральный","Чечеловский","Шевченковский"],
  "Украина|Львов":["Галицкий","Железнодорожный","Лычаковский","Сиховский","Франковский","Шевченковский"],
  "Украина|Запорожье":["Александровский","Вознесеновский","Днепровский","Заводской","Коммунарский","Хортицкий","Шевченковский"],
  "Украина|Николаев":["Заводской","Ингульский","Корабельный","Центральный"],
  "Грузия|Тбилиси":["Ваке","Сабуртало","Старый Тбилиси","Чугурети","Дидубе","Исани","Самгори","Глдани","Надзаладеви","Крцаниси"],
  "Грузия|Батуми":["Старый Батуми","Новый Бульвар","Химшиашвили","Аэропорт","Багратиони","Ангиса","Гонио","Квариати"],
  "ОАЭ|Дубай":["Dubai Marina","Downtown Dubai","Business Bay","Jumeirah Village Circle","Palm Jumeirah","Dubai Hills Estate","Jumeirah Lake Towers","Dubai Creek Harbour","Dubai South","Arjan","Al Furjan"],
  "Испания|Мадрид":["Centro","Salamanca","Chamberí","Chamartín","Retiro","Moncloa-Aravaca"],
  "Испания|Барселона":["Eixample","Ciutat Vella","Gràcia","Sarrià-Sant Gervasi","Les Corts","Sant Martí"],
  "Таиланд|Пхукет":["Bang Tao","Kamala","Patong","Karon","Kata","Rawai","Nai Harn","Mai Khao"],
  "Индонезия / Бали|Денпасар":["Sanur","Denpasar Barat","Denpasar Selatan","Denpasar Timur","Denpasar Utara"]
};
// ===== Аналитика руководителя (директор и тех. админ) — по образцу Follow Up Boss / kvCORE / Lofty =====
// Воронка с конверсией, источники лидов, рейтинг менеджеров, теряющиеся лиды, динамика по неделям.
// Всё считается по уже загруженным данным CRM с учётом выбранного менеджера и периода.
function AdminInsights({ leads = [], periodLeads = [], events = [], activities = [], onOpenLead }) {
  const DAY = 86400000, now = Date.now();
  const closed = s => s === "Сделка" || s === "Отказ";
  const order = stages.filter(s => s !== "Отказ" && s !== "Отложили");
  const reached = (l, st) => { const i = order.indexOf(l.status), j = order.indexOf(st); return i >= 0 && i >= j; };
  const pct = (a, b) => b ? `${Math.round(a / b * 100)}%` : "—";
  const updatedAt = l => new Date(l.updated_at || l.created_at || 0).getTime();
  const nextAt = l => l.nextContact ? new Date(l.nextContact).getTime() : NaN;
  const active = leads.filter(l => !closed(l.status));
  const overdue = active.filter(l => Number.isFinite(nextAt(l)) && nextAt(l) < now);
  const noNext = active.filter(l => !l.nextContact);
  const stalled = active.filter(l => now - updatedAt(l) > 7 * DAY);
  const dealsInPeriod = periodLeads.filter(l => l.status === "Сделка").length;
  const eventsByLead = events.reduce((m, e) => { const k = String(e.leadId); (m[k] = m[k] || []).push(e); return m; }, {});
  const hasMeeting = l => (eventsByLead[String(l.id)] || []).some(e => e.type === "Встреча" || e.type === "Показ");

  // Источники
  const bySource = Object.values(periodLeads.reduce((m, l) => {
    const k = l.source || "Не указан"; const r = (m[k] = m[k] || { source: k, leads: 0, work: 0, meet: 0, deals: 0, refused: 0 });
    r.leads++; if (!["Новый Лид", "Отказ"].includes(l.status)) r.work++; if (hasMeeting(l) || reached(l, "Назначена встреча")) r.meet++;
    if (l.status === "Сделка") r.deals++; if (l.status === "Отказ") r.refused++; return m;
  }, {})).sort((a, b) => b.leads - a.leads);

  // Менеджеры
  const sent = activities.filter(a => String(a.action_type || a.type || "") === "presentation_sent");
  const byManager = Object.values(leads.reduce((m, l) => {
    const k = l.manager || l.manager_email || "Не назначен"; const r = (m[k] = m[k] || { name: k, email: l.manager_email || "", leads: 0, period: 0, active: 0, deals: 0, overdue: 0, stalled: 0, meetings: 0, calls: 0, sent: 0 });
    r.leads++; if (periodLeads.includes(l)) r.period++; if (!closed(l.status)) r.active++; if (l.status === "Сделка") r.deals++;
    if (!closed(l.status) && Number.isFinite(nextAt(l)) && nextAt(l) < now) r.overdue++;
    if (!closed(l.status) && now - updatedAt(l) > 7 * DAY) r.stalled++;
    (eventsByLead[String(l.id)] || []).forEach(e => { if (e.type === "Встреча" || e.type === "Показ") r.meetings++; if (e.type === "Звонок") r.calls++; });
    return m;
  }, {}));
  byManager.forEach(r => { r.sent = sent.filter(a => (r.email && String(a.user_email || a.manager_email || "") === r.email) || String(a.user_name || a.manager_name || "") === r.name).length; });
  byManager.sort((a, b) => b.deals - a.deals || b.period - a.period);

  // Динамика по неделям: новые лиды и сделки за 12 недель
  const weekStart = t => { const d = new Date(t); d.setHours(0, 0, 0, 0); d.setDate(d.getDate() - ((d.getDay() + 6) % 7)); return d.getTime(); };
  const weeks = Array.from({ length: 12 }, (_, i) => weekStart(now) - (11 - i) * 7 * DAY);
  const weekly = weeks.map(w => ({ w, leads: leads.filter(l => { const t = new Date(l.created_at || 0).getTime(); return t >= w && t < w + 7 * DAY; }).length,
    deals: leads.filter(l => l.status === "Сделка" && updatedAt(l) >= w && updatedAt(l) < w + 7 * DAY).length }));
  const maxW = Math.max(1, ...weekly.map(x => x.leads));

  const attention = [...overdue.map(l => ({ l, why: `Просрочен контакт: ${new Date(l.nextContact).toLocaleDateString()}` })),
    ...stalled.filter(l => !overdue.includes(l)).map(l => ({ l, why: `Без изменений ${Math.floor((now - updatedAt(l)) / DAY)} дн.` }))].slice(0, 12);

  const th = { textAlign: "left", padding: "8px", borderBottom: "1px solid", whiteSpace: "nowrap" }, td = { padding: "8px", borderBottom: "1px solid" };
  return <>
    <div className="card dark"><h2>Аналитика руководителя</h2><p>Воронка, источники, менеджеры и лиды, которые теряются. Видят только директор и тех. администратор.</p></div>
    <div className="stats">{[
      ["Новых лидов за период", periodLeads.length],
      ["Конверсия лид → сделка", pct(dealsInPeriod, periodLeads.length)],
      ["В работе сейчас", active.length],
      ["Просрочен следующий контакт", overdue.length],
      ["Без следующего контакта", noNext.length],
      ["Без движения больше 7 дней", stalled.length],
    ].map(([a, b]) => <div className="stat" key={a}><span>{a}</span><b>{b}</b></div>)}</div>

    <div className="card"><h3>Воронка лидов за период</h3>
      <p className="muted">Сколько лидов, пришедших за период, дошли до каждого этапа, и конверсия от первого этапа.</p>
      {order.map(st => { const n = periodLeads.filter(l => reached(l, st)).length; return <div key={st} style={{ display: "grid", gridTemplateColumns: "minmax(120px,1fr) 2fr auto", gap: 8, alignItems: "center", margin: "6px 0" }}>
        <span>{st}</span><div style={{ height: 10, borderRadius: 6, background: "rgba(127,127,127,.18)" }}><div style={{ height: 10, borderRadius: 6, width: `${periodLeads.length ? Math.max(2, n / periodLeads.length * 100) : 0}%`, background: "currentColor", opacity: .55 }} /></div><b>{`${n} · ${pct(n, periodLeads.length)}`}</b></div>; })}
      <div className="stageRow"><span>Отказ</span><b>{periodLeads.filter(l => l.status === "Отказ").length}</b></div>
      <div className="stageRow"><span>Отложили</span><b>{periodLeads.filter(l => l.status === "Отложили").length}</b></div>
    </div>

    <div className="card" style={{ overflowX: "auto" }}><h3>Источники лидов</h3>
      <p className="muted">Какие площадки приводят клиентов, которые доходят до встречи и сделки.</p>
      <table className="clientTable" style={{ width: "100%", borderCollapse: "collapse", minWidth: 640 }}><thead><tr>{["Источник", "Лиды", "В работе", "Встречи", "Сделки", "Конверсия", "Отказы"].map(h => <th key={h} style={th}>{h}</th>)}</tr></thead>
        <tbody>{bySource.map(r => <tr key={r.source}><td style={td}>{r.source}</td><td style={td}>{r.leads}</td><td style={td}>{r.work}</td><td style={td}>{r.meet}</td><td style={td}>{r.deals}</td><td style={td}>{pct(r.deals, r.leads)}</td><td style={td}>{r.refused}</td></tr>)}</tbody></table>
      {bySource.length === 0 && <p className="muted">За период лидов нет.</p>}
    </div>

    <div className="card" style={{ overflowX: "auto" }}><h3>Рейтинг менеджеров</h3>
      <p className="muted">Сделки, активность и дисциплина по каждому менеджеру. «Просрочено» и «Без движения» — лиды, которые могут потеряться.</p>
      <table className="clientTable" style={{ width: "100%", borderCollapse: "collapse", minWidth: 820 }}><thead><tr>{["Менеджер", "Лидов всего", "Новых за период", "В работе", "Сделки", "Конверсия", "Встречи/показы", "Звонки", "Презентации", "Просрочено", "Без движения"].map(h => <th key={h} style={th}>{h}</th>)}</tr></thead>
        <tbody>{byManager.map(r => <tr key={r.name}><td style={td}><b>{r.name}</b></td><td style={td}>{r.leads}</td><td style={td}>{r.period}</td><td style={td}>{r.active}</td><td style={td}>{r.deals}</td><td style={td}>{pct(r.deals, r.leads)}</td><td style={td}>{r.meetings}</td><td style={td}>{r.calls}</td><td style={td}>{r.sent}</td><td style={td}>{r.overdue ? badge(r.overdue, "red") : 0}</td><td style={td}>{r.stalled ? badge(r.stalled, "gold") : 0}</td></tr>)}</tbody></table>
    </div>

    <div className="card"><h3>Новые лиды и сделки по неделям</h3>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(12,1fr)", gap: 4, alignItems: "end", height: 140, marginTop: 8 }}>
        {weekly.map(x => <div key={x.w} title={`${new Date(x.w).toLocaleDateString()}: лидов ${x.leads}, сделок ${x.deals}`} style={{ display: "flex", flexDirection: "column", justifyContent: "flex-end", alignItems: "center", height: "100%" }}>
          <span className="muted" style={{ fontSize: 11 }}>{x.leads || ""}</span>
          <div style={{ width: "70%", height: `${x.leads / maxW * 100}%`, minHeight: x.leads ? 3 : 0, background: "currentColor", opacity: .45, borderRadius: "4px 4px 0 0" }} />
        </div>)}
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(12,1fr)", gap: 4 }}>{weekly.map(x => <span key={x.w} className="muted" style={{ fontSize: 10, textAlign: "center" }}>{new Date(x.w).toLocaleDateString(undefined, { day: "numeric", month: "numeric" })}</span>)}</div>
      <p className="muted">{`Сделок за 12 недель: ${weekly.reduce((s, x) => s + x.deals, 0)}`}</p>
    </div>

    <div className="card"><h3>Требуют внимания</h3>
      {attention.length === 0 && <p className="muted">Просроченных и забытых лидов нет.</p>}
      {attention.map(({ l, why }) => <div key={l.id} className="row" style={{ borderBottom: "1px solid rgba(127,127,127,.2)", padding: "6px 0" }}>
        <section><b>{l.name || "Без имени"}</b><p className="muted" style={{ margin: 0 }}>{`${l.manager || "—"} · ${l.status} · ${why}`}</p></section>
        {onOpenLead && <Button variant="soft" onClick={() => onOpenLead(l.id)}>Открыть</Button>}
      </div>)}
    </div>
  </>;
}

// ===== Статистика менеджеров (только директор и тех. администратор) =====
function ManagerStats({users=[], leads=[], events=[], deals=[], properties=[]}){
  const [period,setPeriod] = useState("month");
  const now = new Date();
  const from = period === "week" ? new Date(now.getTime() - 7*864e5) : period === "month" ? new Date(now.getFullYear(), now.getMonth(), 1) : period === "quarter" ? new Date(now.getFullYear(), now.getMonth() - 2, 1) : null;
  const inPeriod = v => { if(!from) return true; const d = new Date(String(v || "").length === 10 ? v + "T12:00:00" : v); return !isNaN(d) && d >= from && d <= now; };
  const low = v => String(v || "").trim().toLowerCase();
  const num = v => Number(String(v ?? "").replace(/[^\d.]/g,"")) || 0;
  const money = n => `$${Math.round(n).toLocaleString("ru-RU")}`;

  const people = new Map();
  const person = (email, name) => {
    const key = low(email) || low(name); if(!key) return null;
    if(!people.has(key)){
      const u = (users || []).find(x => low(x.email) === low(email)) || (users || []).find(x => name && low(x.full_name) === low(name));
      people.set(key, {key, name:u?.full_name || name || email, blocked:u && (u.access === false || u.status === "blocked"), active:0, overdue:0, showsDone:0, showsPlanned:0, deals:0, amount:0, commission:0, objects:0});
    }
    return people.get(key);
  };
  (users || []).filter(u => String(u.role || "").includes("Менеджер")).forEach(u => person(u.email, u.full_name));
  (leads || []).forEach(l => { if(["Сделка","Отказ"].includes(l.status)) return; const p = person(l.manager_email, l.manager); if(!p) return; p.active++; const d = calParseLeadNext(l.nextContact); if(d && d < now) p.overdue++; });
  (events || []).filter(e => e.type === "Показ" && inPeriod(e.date)).forEach(e => { const p = person(e.manager_email, e.manager); if(!p) return; if(e.status === "done") p.showsDone++; else if((e.status || "planned") === "planned") p.showsPlanned++; });
  (deals || []).filter(d => inPeriod(d.date)).forEach(d => { const p = person(d.manager_email, d.manager); if(!p) return; p.deals++; p.amount += num(d.amount); p.commission += num(d.commission); });
  (properties || []).filter(o => inPeriod(o.created_at)).forEach(o => { const p = person(o.property_manager_email || o.created_by_email, o.property_manager_name); if(p) p.objects++; });

  const rows = [...people.values()].filter(p => p.active || p.showsDone || p.showsPlanned || p.deals || p.objects).sort((a,b) => b.commission - a.commission || b.deals - a.deals || b.showsDone - a.showsDone);
  const total = rows.reduce((t,p) => ({showsDone:t.showsDone + p.showsDone, deals:t.deals + p.deals, commission:t.commission + p.commission, objects:t.objects + p.objects}), {showsDone:0, deals:0, commission:0, objects:0});

  return <div className="card mstats">
    <div className="row"><section><h3>Кто из менеджеров реально продаёт</h3><p className="muted">Видят только директор и тех. администратор.</p></section></div>
    <div className="mstatsPeriods">{[["week","Неделя"],["month","Месяц"],["quarter","3 месяца"],["all","Всё время"]].map(([id,l]) => <button key={id} className={cn(period === id && "on")} onClick={() => setPeriod(id)}>{l}</button>)}</div>
    <div className="mstatsKpi">
      <div><span>Показы проведены</span><b>{total.showsDone}</b></div>
      <div><span>Объекты привлечены</span><b>{total.objects}</b></div>
      <div><span>Сделки</span><b>{total.deals}</b></div>
      <div className="hl"><span>Комиссия</span><b>{money(total.commission)}</b></div>
    </div>
    <div className="mstatsConv">Конверсия: показы <b>{total.showsDone}</b> → сделки <b>{total.deals}</b>{total.showsDone ? <> · <b>{Math.round(total.deals / total.showsDone * 100)}%</b></> : null}</div>
    {rows.length === 0 && <p className="muted">За выбранный период данных нет.</p>}
    <div className="mstatsList">{rows.map((p,i) => <div key={p.key} className="mstatsRow">
      <span className="mstatsAva">{String(p.name || "?").trim().charAt(0).toUpperCase()}</span>
      <div className="mstatsBody">
        <b>{i === 0 && p.commission > 0 ? "🏆 " : ""}{p.name}{p.blocked ? " · доступ закрыт" : ""}</b>
        <small>Клиентов в работе {p.active}{p.overdue ? ` · просрочено ${p.overdue}` : ""} · показов {p.showsDone}{p.showsPlanned ? ` (+${p.showsPlanned} впереди)` : ""} · объектов {p.objects} · сделок {p.deals}</small>
      </div>
      <em>{money(p.commission)}</em>
    </div>)}</div>
    <p className="muted" style={{fontSize:12}}>Показы — из календаря (отметка «Проведено»), сделки и комиссия — из раздела «Сделки», объекты — кто внёс объект во вторичку.</p>
  </div>;
}

function StatisticsReporting({leads,properties,events,role,users,activities,currentProfile,onOpenLead,dealRecords=[]}) {
  const canFilter = role === "Администратор тех отдел" || role === "Администратор директор";
  const managerUsers = (users || []).filter(u => String(u.role || "").includes("Менеджер"));
  const [managerFilter,setManagerFilter] = useState(canFilter ? "Все" : (currentProfile?.email || "Все"));
  const [dateFrom,setDateFrom] = useState("");
  const [dateTo,setDateTo] = useState("");
  const [quickPeriod,setQuickPeriod] = useState("month");
  const selectedEmail = !canFilter ? String(currentProfile?.email||"") : managerFilter;
  const selectedUser = managerUsers.find(u=>String(u.email||"")===String(selectedEmail||""));
  const selectedName = selectedUser ? managerDisplayName(selectedUser) : (selectedEmail==="Все" ? "" : "");

  const inRange = (raw) => {
    if (!raw) return true;
    const ts = new Date(raw).getTime(); if (!Number.isFinite(ts)) return true;
    const now = new Date(); let from=0,to=Date.now()+86400000;
    if (dateFrom) from=new Date(dateFrom+"T00:00:00").getTime();
    else if (quickPeriod==="day") from=new Date(now.getFullYear(),now.getMonth(),now.getDate()).getTime();
    else if (quickPeriod==="week") from=new Date(now.getFullYear(),now.getMonth(),now.getDate()-6).getTime();
    else if (quickPeriod==="month") from=new Date(now.getFullYear(),now.getMonth(),1).getTime();
    else if (quickPeriod==="year") from=new Date(now.getFullYear(),0,1).getTime();
    if (dateTo) to=new Date(dateTo+"T23:59:59").getTime();
    return ts>=from && ts<=to;
  };
  const ownedLead = l => selectedEmail==="Все" || String(l.manager_email||"")===String(selectedEmail) || (!!selectedName && String(l.manager||"")===selectedName);
  const scopedAll = leads.filter(ownedLead);
  const scopedIds = new Set(scopedAll.map(l=>String(l.id)));
  const scopedEvents = events.filter(e=>scopedIds.has(String(e.leadId)) && inRange(e.date ? `${e.date}T${e.time||"00:00"}` : e.created_at));
  const createdClients = scopedAll.filter(l=>inRange(l.created_at));
  const createdProperties = properties.filter(p => (selectedEmail==="Все" || String(p.property_manager_email||"")===String(selectedEmail)) && inRange(p.created_at));
  const scopedActivities = (activities||[]).filter(a => (selectedEmail==="Все" || String(a.user_email||a.manager_email||"")===String(selectedEmail)) && inRange(a.created_at));
  const presentationSends = scopedActivities.filter(a=>String(a.action_type||a.type||"")==="presentation_sent");
  const meetings = scopedEvents.filter(e=>e.type==="Встреча");
  const calls = scopedEvents.filter(e=>e.type==="Звонок");
  const completedMeetings = meetings.filter(e=>e.completed===true || new Date(`${e.date}T${e.time||"00:00"}`).getTime() < Date.now());
  const deals = scopedAll.filter(l=>l.status==="Сделка").length;
  const countType = (t) => scopedEvents.filter(e=>e.type===t).length;
  const dailyCounts = presentationSends.reduce((m,a)=>{const d=String(a.created_at||"").slice(0,10)||"—";m[d]=(m[d]||0)+1;return m;},{});

  return <main className="screen">
    <div className="card dark"><h2>Аналитика CRM</h2><p>{role==="Менеджер по продажам"?"Личная аналитика по твоим клиентам и действиям.":"Аналитика по менеджерам, клиентам, объектам, календарю и отправленным презентациям."}</p></div>
    <div className="card">
      <div className="grid4">
        {canFilter && <Field label="Менеджер"><select className="input" value={managerFilter} onChange={e=>setManagerFilter(e.target.value)}><option value="Все">Все менеджеры</option>{managerUsers.map(u=><option key={u.email||u.id} value={u.email||managerDisplayName(u)}>{managerDisplayName(u)}</option>)}</select></Field>}
        <Field label="Период"><select className="input" value={quickPeriod} onChange={e=>{setQuickPeriod(e.target.value);setDateFrom("");setDateTo("");}}><option value="day">День</option><option value="week">Неделя</option><option value="month">Месяц</option><option value="year">Год</option><option value="all">Всё время</option></select></Field>
        <Field label="Дата от"><input className="input" type="date" value={dateFrom} onChange={e=>setDateFrom(e.target.value)}/></Field>
        <Field label="Дата до"><input className="input" type="date" value={dateTo} onChange={e=>setDateTo(e.target.value)}/></Field>
      </div>
    </div>
    <div className="stats">{[["Создано клиентов",createdClients.length],["Создано объектов",createdProperties.length],["Отправлено презентаций",presentationSends.length],["Назначено встреч",meetings.length],["Проведено встреч",completedMeetings.length],["Назначено созвонов",calls.length],["Показы",countType("Показ")],["Задачи",countType("Задача")],["Сделки",deals]].map(([a,b])=><div className="stat" key={a}><span>{a}</span><b>{b}</b></div>)}</div>
    <div className="card"><h3>История работы менеджеров</h3>{presentationSends.length===0?<p className="muted">За выбранный период отправленных презентаций нет.</p>:<div style={{overflowX:"auto"}}><table className="clientTable" style={{width:"100%",borderCollapse:"collapse",minWidth:850}}><thead><tr><th>Дата</th><th>Менеджер</th><th>Клиент</th><th>Канал</th><th>Тип</th></tr></thead><tbody>{presentationSends.slice().sort((a,b)=>String(b.created_at).localeCompare(String(a.created_at))).map((a,i)=><tr key={a.id||i}><td>{a.created_at?new Date(a.created_at).toLocaleString():"—"}</td><td>{a.user_name||a.manager_name||"—"}</td><td>{a.client_name||"—"}</td><td>{a.channel||"—"}</td><td>{a.entity_type==="selection"?"Подборка":"Презентация объекта"}</td></tr>)}</tbody></table></div>}</div>
    <div className="card"><h3>Отправленные презентации по дням</h3>{Object.entries(dailyCounts).sort().map(([d,n])=><div className="stageRow" key={d}><span>{d}</span><b>{n}</b></div>)}</div>
    <div className="card"><h3>Воронка клиентов</h3>{stages.map(st=><div className="stageRow" key={st}><span>{st}</span><b>{scopedAll.filter(l=>l.status===st).length}</b></div>)}</div>
    {canFilter && <AdminInsights leads={scopedAll} periodLeads={createdClients} events={events.filter(e=>scopedIds.has(String(e.leadId)))} activities={scopedActivities} onOpenLead={onOpenLead}/>}
    {canFilter && <ManagerStats users={users} leads={leads} events={events} deals={dealRecords} properties={properties}/>}
  </main>;
}


function MarketAnalyticsV2({leads,properties,currentProfile,onOpenProperty,agencyName,theme,lang="ru"}) {
  const [marketListings,setMarketListings]=useState([]);
  const [marketSources,setMarketSources]=useState([]);
  const [loadingMarket,setLoadingMarket]=useState(false);
  const [syncingMarket,setSyncingMarket]=useState(false);
  const [marketError,setMarketError]=useState("");
  const [liveSourceMeta,setLiveSourceMeta]=useState([]);
  const [period,setPeriod]=useState("30");
  const [dateFrom,setDateFrom]=useState("");
  const [dateTo,setDateTo]=useState("");
  const [country,setCountry]=useState("Все");
  const [region,setRegion]=useState("Все");
  const [city,setCity]=useState("Все");
  const [districtFilter,setDistrictFilter]=useState("Все");
  const [complexFilter,setComplexFilter]=useState("Все");
  const [propertyKindFilter,setPropertyKindFilter]=useState("Все");
  const [sellerFilter,setSellerFilter]=useState("Все");
  const [conditionFilter,setConditionFilter]=useState("Все");
  const [floorFrom,setFloorFrom]=useState("");
  const [floorTo,setFloorTo]=useState("");
  const [landAreaFrom,setLandAreaFrom]=useState("");
  const [landAreaTo,setLandAreaTo]=useState("");
  const [verifiedOnly,setVerifiedOnly]=useState(false);
  // Дубли нужны менеджеру: по умолчанию показываем каждое объявление каждого источника.
  const [noDuplicates,setNoDuplicates]=useState(false);
  const [groupDuplicates,setGroupDuplicates]=useState(true);
  const [constructionYearFrom,setConstructionYearFrom]=useState("");
  const [constructionYearTo,setConstructionYearTo]=useState("");
  const [governmentPrograms,setGovernmentPrograms]=useState([]);
  const [dealFilter,setDealFilter]=useState("Все");
  const [selectedSources,setSelectedSources]=useState([]);
  const [sourceCountry,setSourceCountry]=useState("Все");
  // Главный переключатель Аналитики: каждый крупный источник загружается отдельно.
  // Это уменьшает нагрузку и не позволяет одному источнику вытеснять другой.
  const [activeSourceTab,setActiveSourceTab]=useState("ALL");
  const [searchQuery,setSearchQuery]=useState("");
  const [roomsFilter,setRoomsFilter]=useState("Все");
  const [priceFrom,setPriceFrom]=useState("");
  const [priceTo,setPriceTo]=useState("");
  const [areaFrom,setAreaFrom]=useState("");
  const [areaTo,setAreaTo]=useState("");
  const [marketView,setMarketView]=useState("cards");
  const [complexDirectory,setComplexDirectory]=useState([]);
  const [priceSort,setPriceSort]=useState("none");
  const [selected,setSelected]=useState([]);
  const [selectionClientId,setSelectionClientId]=useState("");
  const [selectionClient,setSelectionClient]=useState("");
  const [selectionClientPhone,setSelectionClientPhone]=useState("");
  const [selectionClientEmail,setSelectionClientEmail]=useState("");
  const [selectionLang,setSelectionLang]=useState("ru");
  const [selectionVisual,setSelectionVisual]=useState("editorial");
  const [selectionComparison,setSelectionComparison]=useState(true);
  const [selectionUrl,setSelectionUrl]=useState("");
  const [selectionDownloadUrl,setSelectionDownloadUrl]=useState("");
  const [creatingSelection,setCreatingSelection]=useState(false);
  const [preparingSelection,setPreparingSelection]=useState(false);
  const [selectionEditorOpen,setSelectionEditorOpen]=useState(false);
  const [selectionDraftItems,setSelectionDraftItems]=useState([]);
  const [favorites,setFavorites]=useStorage("analytics_market_favorites",[]);
  const [aiOpenId,setAiOpenId]=useState("");
  const [addedCrm,setAddedCrm]=useState({});
  // Ограничиваем только количество одновременно отрисованных DOM-элементов.
  // В базе, статистике и результатах поиска общего лимита нет.
  const [resultPage,setResultPage]=useState(1);
  // Номер страницы непосредственно на рекламных сайтах. При переходе старые
  // карточки заменяются следующей порцией и не накапливаются в Supabase.
  const [livePage,setLivePage]=useState(1);
  const marketLoadSeq=useRef(0);

  const agencyId=currentProfile?.agency_id;

  // Верхние вкладки больше не зафиксированы только на Украине.
  // При смене страны показываем её рекламные площадки из общего каталога.
  const tabsCountry=country!=="Все"?country:(sourceCountry!=="Все"?sourceCountry:"Украина");
  const sameTabCountry=(a,b)=>String(a||"").trim().toLocaleLowerCase("ru")===String(b||"").trim().toLocaleLowerCase("ru");
  const countrySourceTabs=analyticsSourceCatalog
    .filter(source=>sameTabCountry(source.country,tabsCountry))
    .filter((source,index,list)=>list.findIndex(item=>String(item.name).toLowerCase()===String(source.name).toLowerCase())===index)
    .map(source=>({
      id:`SOURCE:${source.country}:${source.name}`,
      label:source.name,
      db:Array.from(new Set([source.name,...(source.aliases||[])].map(value=>String(value||"").trim()).filter(Boolean)))
    }));
  const analyticsSourceTabs=[
    {id:"ALL",label:"Все источники",db:null},
    ...countrySourceTabs,
    {id:"CRM",label:"CRM",db:[]}
  ];
  const activeSourceMeta=analyticsSourceTabs.find(x=>x.id===activeSourceTab)||analyticsSourceTabs[0];
  const activeServerSources=activeSourceMeta.db;

  const deepValues=(obj,keyNames,max=80)=>{
    const wanted=new Set(keyNames.map(x=>String(x).toLowerCase()));
    const out=[];const seen=new Set();
    const walk=(v,depth=0)=>{
      if(v==null||depth>6||out.length>=max)return;
      if(typeof v!=="object")return;
      if(seen.has(v))return;seen.add(v);
      if(Array.isArray(v)){v.slice(0,60).forEach(x=>walk(x,depth+1));return;}
      Object.entries(v).forEach(([k,val])=>{
        if(wanted.has(String(k).toLowerCase())&&val!=null)out.push(val);
        if(typeof val==="object")walk(val,depth+1);
      });
    };walk(obj);return out;
  };
  const firstText=(obj,keys)=>deepValues(obj,keys).map(v=>typeof v==="string"||typeof v==="number"?String(v).trim():"").find(Boolean)||"";
  const parseNumber=v=>{
    if(v==null)return 0;
    if(typeof v==="number")return Number.isFinite(v)?v:0;
    if(typeof v==="object")return parseNumber(v.value??v.amount??v.price??v.usd??v.uah??0);
    const raw=String(v).replace(/\u00a0/g," ").trim();
    const m=raw.match(/-?\d[\d\s.,]*/);if(!m)return 0;
    let n=m[0].replace(/\s/g,"");
    if(n.includes(",")&&n.includes(".")){if(n.lastIndexOf(",")>n.lastIndexOf("."))n=n.replace(/\./g,"").replace(",",".");else n=n.replace(/,/g,"");}
    else if(n.includes(","))n=n.replace(",",".");
    const num=Number(n);return Number.isFinite(num)?num:0;
  };
  const firstNumber=(obj,keys)=>{for(const v of deepValues(obj,keys)){const n=parseNumber(v);if(n>0)return n;}return 0;};
  const detectCurrency=(...vals)=>{
    const t=vals.map(v=>JSON.stringify(v??"")).join(" ").toLowerCase();
    if(/\b(?:usd|дол|\$)\b/.test(t)||t.includes("$"))return "USD";
    if(/\b(?:eur|євро|евро)\b/.test(t)||t.includes("€"))return "EUR";
    if(/\b(?:uah|грн|₴)\b/.test(t))return "UAH";
    if(/\b(?:aed)\b/.test(t))return "AED";
    if(/\b(?:gel)\b/.test(t))return "GEL";
    return "";
  };
  const allUrlCandidates=row=>{
    const raw=row?.raw_data||{};
    const vals=[row?.source_url,row?.listing_url,row?.url,row?.external_url,row?.external_id,
      ...deepValues(raw,["source_url","listing_url","url","link","href","canonical","canonical_url","detail_url","object_url","ad_url"],120)];
    return vals.flatMap(v=>Array.isArray(v)?v:[v]).map(v=>String(v||"").trim()).filter(v=>/^https?:\/\//i.test(v));
  };
  const isConcreteListingUrl=url=>{
    const u=String(url||"").toLowerCase();
    if(!u)return false;
    if(/dom\.ria\.com/.test(u))return /\/realty-|\/realty\//.test(u);
    if(/olx\./.test(u))return /\/d\/|\/obyavlenie\//.test(u);
    if(/rieltor\.ua/.test(u))return /\/view\/|\/\d{5,}/.test(u);
    if(/rem\.ua/.test(u))return /\/object\/|\/objects\/|\/property\/|\/\d{5,}/.test(u);
    if(/lun\.ua/.test(u))return !/^https?:\/\/(www\.)?lun\.ua\/?(?:[?#].*)?$/.test(u);
    try{const x=new URL(u);return x.pathname.split("/").filter(Boolean).length>=2;}catch{return false;}
  };
  const pickListingUrl=row=>{
    const urls=allUrlCandidates(row);
    return urls.find(isConcreteListingUrl)||urls.find(u=>{
      try{return new URL(u).pathname.split("/").filter(Boolean).length>=2;}catch{return false;}
    })||"";
  };
  const normalizeMarketRow=row=>{
    const raw=row?.raw_data||{};
    const url=pickListingUrl(row);
    const title=String(row?.title||firstText(raw,["title","name","headline","caption","address"])||"").trim();
    const price=Number(row?.price||0)>0?Number(row.price):firstNumber(raw,["price","price_value","amount","cost","value","priceusd","price_usd"]);
    const area=Number(row?.area||0)>0?Number(row.area):firstNumber(raw,["area","total_area","square","square_meters","area_total","size"]);
    const rooms=Number(row?.rooms||0)>0?Number(row.rooms):firstNumber(raw,["rooms","room_count","bedrooms","beds"]);
    const city=String(row?.city||firstText(raw,["city","locality","town","settlement"])||"").trim();
    const region=String(row?.region||firstText(raw,["region","oblast","province","state"])||"").trim();
    const district=String(row?.district||firstText(raw,["district","raion","area_name","neighborhood","neighbourhood"])||"").trim();
    const complex=String(row?.complex_name||firstText(raw,["complex_name","complex","residential_complex","building_name"])||"").trim();
    const photoCandidates=[row?.main_photo_url,...(Array.isArray(row?.photo_urls)?row.photo_urls:[]),...deepValues(raw,["image","image_url","photo","photo_url","photos","images"],80)].flat(Infinity).map(v=>typeof v==="string"?v:typeof v?.url==="string"?v.url:"").filter(v=>/^https?:\/\//i.test(v));
    const sourceName=String(row?.source_name||firstText(raw,["source_name","source","portal"])||"").trim();
    const currency=String(row?.currency||detectCurrency(row?.price,raw)||"").toUpperCase();
    return {...row,title,price,area,rooms,city,region,district,complex_name:complex,source_name:sourceName,
      source_home_url:String(row?.source_url||""),source_url:url,currency,main_photo_url:row?.main_photo_url||photoCandidates[0]||"",
      photo_urls:Array.from(new Set([...(Array.isArray(row?.photo_urls)?row.photo_urls:[]),...photoCandidates].filter(Boolean)))};
  };
  const isSourcePlaceholder=row=>{
    if(row?.origin==="crm")return false;
    const url=pickListingUrl(row);const raw=row?.raw_data||{};
    // REM v26 склеивал поля соседних карточек: такие строки нельзя показывать
    // и нельзя учитывать в фильтрах. После повторной проверки rem-public v27
    // запись получает detail_verified=true и снова становится доступной.
    const isRem=String(row?.source_name||"").trim().toUpperCase()==="REM";
    if(isRem&&raw?.detail_verified!==true)return true;
    const hasUseful=Number(row?.price||0)>0||Number(row?.area||0)>0||Number(row?.rooms||0)>0||
      !!firstNumber(raw,["price","amount","cost","area","total_area","rooms","bedrooms"])||
      !!firstText(raw,["title","headline","address"]);
    const ext=String(row?.external_id||"").trim();
    const genericExt=/^https?:\/\//i.test(ext)&&!isConcreteListingUrl(ext);
    return !url&&!hasUseful||genericExt&&!hasUseful;
  };

  // Публичные площадки читаются в момент запроса и не сохраняются в market_listings.
  // Supabase здесь работает только как защищённый прокси: при смене фильтра старый
  // ответ заменяется, а при выходе из раздела исчезает вместе с состоянием компонента.
  const marketSeenAfter=()=>{
    if(period==="all")return null;
    if(period==="custom"){
      return dateFrom?new Date(dateFrom+"T00:00:00").toISOString():null;
    }
    const days=Number(period||30);
    if(days===1){
      const n=new Date();
      return new Date(n.getFullYear(),n.getMonth(),n.getDate()).toISOString();
    }
    return new Date(Date.now()-days*86400000).toISOString();
  };
  const marketServerParams=()=>{
    let roomsMin=null,roomsMax=null;
    if(roomsFilter!=="Все"){
      if(roomsFilter==="4+")roomsMin=4;
      else {roomsMin=Number(roomsFilter)||null;roomsMax=Number(roomsFilter)||null;}
    }
    return {
      p_agency_id:Number(agencyId),
      p_country:country==="Все"?null:country,
      p_region:region==="Все"?null:region,
      p_city:city==="Все"?null:city,
      p_district:districtFilter==="Все"?null:districtFilter,
      p_deal_type:dealFilter==="Все"?null:dealFilter,
      p_rooms_min:roomsMin,
      p_rooms_max:roomsMax,
      p_price_from:priceFrom?Number(priceFrom):null,
      p_price_to:priceTo?Number(priceTo):null,
      p_area_from:areaFrom?Number(areaFrom):null,
      p_area_to:areaTo?Number(areaTo):null,
      // Для вкладок источников фильтруем уже в Supabase.
      // "Все источники" = null, CRM вообще не читает market_listings.
      p_sources:activeSourceTab==="ALL"?null:(activeSourceTab==="CRM"?[]:activeServerSources),
      p_seen_after:marketSeenAfter()
    };
  };
  const fetchAllMarketListings=async()=>{
    if(activeSourceTab==="CRM")return [];
    const isForeign=country!=="Все"&&!/^(украина|україна|ukraine)$/i.test(country);
    // Зарубежная страна: площадки этой страны из каталога (все или выбранная вкладка)
    const supported=isForeign
      ? countrySourceTabs.map(t=>t.label)
      : ["OLX","DIM.RIA Украина","REM","RIELTOR.UA"];
    const wanted=isForeign
      ? (activeSourceTab==="ALL"?supported:[activeSourceMeta.label].filter(Boolean))
      : activeSourceTab==="ALL"
      ? supported
      : supported.filter(name=>(activeServerSources||[]).some(alias=>String(alias).toLowerCase()===name.toLowerCase()||String(alias).toLowerCase().includes(name.split(" ")[0].toLowerCase())));
    const wantsStored=name=>activeSourceTab==="ALL"||(activeServerSources||[]).some(x=>{
      const v=String(x||"").toLowerCase();
      return name==="REM"?v.includes("rem"):v.includes("telegram")||v.includes("пбн");
    });
    const storedSources=isForeign?[]:[wantsStored("REM")&&"REM",wantsStored("Telegram")&&"ПБН"].filter(Boolean);
    const edgePromise=wanted.length?supabase.functions.invoke("analytics-live-search-v3",{body:{
      country:country==="Все"?"Украина":country,
      region:region==="Все"?"":region,
      city:city==="Все"?"":city,
      district:districtFilter==="Все"?"":districtFilter,
      property_type:propertyKindFilter==="Все"?"":propertyKindFilter,
      deal_type:dealFilter==="Все"?"Продажа":dealFilter,
      rooms:roomsFilter==="Все"?null:roomsFilter,
      price_from:priceFrom?Number(priceFrom):null,
      price_to:priceTo?Number(priceTo):null,
      area_from:areaFrom?Number(areaFrom):null,
      area_to:areaTo?Number(areaTo):null,
      floor_from:floorFrom?Number(floorFrom):null,
      floor_to:floorTo?Number(floorTo):null,
      complex:complexFilter==="Все"?"":complexFilter,
      programs:governmentPrograms,
      page:livePage,pages:1,sources:wanted
    }}):Promise.resolve({data:{results:[]},error:null});
    const storedPromise=Promise.all(storedSources.map(async source=>{
      let q=supabase.from("market_listings").select("*",{count:"exact"})
        .eq("agency_id",agencyId).eq("source_name",source)
        .order("id",{ascending:false}).range((livePage-1)*100,livePage*100-1);
      if(country!=="Все")q=q.eq("country",country);
      if(region!=="Все")q=q.eq("region",region);
      if(city!=="Все")q=q.ilike("city",`%${String(city).replace(/сса$/i,"с")}%`);
      if(districtFilter!=="Все")q=q.eq("district",districtFilter);
      if(dealFilter!=="Все")q=q.eq("deal_type",dealFilter);
      if(priceFrom)q=q.gte("price",Number(priceFrom));
      if(priceTo)q=q.lte("price",Number(priceTo));
      if(areaFrom)q=q.gte("area",Number(areaFrom));
      if(areaTo)q=q.lte("area",Number(areaTo));
      const {data,error,count}=await q;
      if(error)return{source:source==="ПБН"?"Telegram":source,ok:false,error:error.message,items:[]};
      const label=source==="ПБН"?"Telegram":source,total=Number(count||0);
      return{source:label,ok:true,total,count_is_exact:true,page:livePage,page_item_count:(data||[]).length,total_pages:Math.max(1,Math.ceil(total/100)),has_more:livePage*100<total,stored_readonly:true,items:(data||[]).map(row=>({...row,source_name:label,origin:"stored-readonly"}))};
    }));
    const [{data,error},storedResults]=await Promise.all([edgePromise,storedPromise]);
    if(error)throw error;
    const results=Array.isArray(data?.results)?data.results:[];
    const mergedResults=[...results.filter(x=>!(x.source==="REM"&&storedResults.some(s=>s.source==="REM"&&s.ok))),...storedResults];
    setLiveSourceMeta(mergedResults.map(x=>({source:x.source,total:x.total,exact:x.count_is_exact!==false,ok:x.ok!==false,error:x.error||"",url:x.url||"",pageItemCount:Number(x.page_item_count||(x.items||[]).length||0),totalPages:Number(x.total_pages||0),hasMore:x.has_more!==false,storedReadonly:!!x.stored_readonly})));
    return mergedResults.flatMap(x=>(x.items||[]).map((row,index)=>({...row,
      id:`live-${x.source}-${row.external_id||row.id||index}`,origin:row.origin||"live",live_total:x.total,
      last_seen_at:row.last_seen_at||new Date().toISOString(),
      country:country==="Все"?(row.country||"Украина"):country,
      region:region==="Все"?(row.region||""):region,
      city:city==="Все"?(row.city||""):city,
      district:districtFilter==="Все"?(row.district||""):districtFilter
    })));
  };

  const loadMarket=async()=>{
    if(!agencyId)return;
    const seq=++marketLoadSeq.current;
    setLoadingMarket(true);setMarketError("");
    try{
      const [rows,sourceRes,complexRes]=await Promise.all([
        fetchAllMarketListings(),
        supabase.from("market_sources").select("*").eq("agency_id",agencyId).order("created_at",{ascending:false}),
        supabase.from("analytics_residential_complexes").select("official_name,country,region,city,district,developer,address,source_url,completion_status,completion_year").eq("is_active",true).order("official_name",{ascending:true}).limit(10000)
      ]);
      // Старый ответ не должен перерисовывать интерфейс после изменения фильтров.
      if(seq!==marketLoadSeq.current)return;
      setMarketListings(rows);
      if(!sourceRes.error)setMarketSources(sourceRes.data||[]);
      else console.warn("Analytics market_sources:",sourceRes.error);
      if(!complexRes.error)setComplexDirectory(complexRes.data||[]);
      else console.warn("Analytics complexes:",complexRes.error);
    }catch(e){
      if(seq!==marketLoadSeq.current)return;
      console.error(e);
      setMarketError(e?.message||"Не удалось загрузить объявления рынка.");
    }finally{
      if(seq===marketLoadSeq.current)setLoadingMarket(false);
    }
  };

  useEffect(()=>{
    if(!agencyId)return;
    setResultPage(1);
    // Не спамим Supabase новым запросом на каждую введённую цифру.
    const t=setTimeout(()=>{loadMarket();},650);
    return()=>clearTimeout(t);
  },[agencyId,activeSourceTab,country,region,city,districtFilter,dealFilter,roomsFilter,priceFrom,priceTo,areaFrom,areaTo,period,dateFrom,dateTo,complexFilter,propertyKindFilter,constructionYearFrom,constructionYearTo,governmentPrograms.join("|"),livePage]);

  const syncMarket=async()=>{
    if(!agencyId)return;
    setSyncingMarket(true);setMarketError("");
    try{
      // Живое обновление: повторно читаем выбранные публичные страницы.
      // Никаких записей/накопления объявлений в Supabase не происходит.
      await loadMarket();
      alert("Актуальная выдача сайтов обновлена. Данные аналитики временные и не сохраняются в Supabase.");
      return;
      const exactSource=activeSourceTab==="ALL"||activeSourceTab==="CRM"
        ? null
        : (marketSources||[]).find(s=>(activeServerSources||[]).some(n=>String(s.name||"").trim().toLowerCase()===String(n).trim().toLowerCase()));
      if(activeSourceTab==="CRM"){
        await loadMarket();
        alert("CRM-объекты уже читаются напрямую из раздела Вторичка.");
        return;
      }
      const {data,error}=await supabase.functions.invoke("market-sync",{
        body:{
          agency_id:Number(agencyId),
          ...(exactSource?{source_id:Number(exactSource.id)}:{sync_all:true}),
          market_filters:{
            country,
            region,
            city,
            district:districtFilter,
            complex:complexFilter,
            property_type:propertyKindFilter,
            seller:sellerFilter,
            condition:conditionFilter,
            floor_from:floorFrom,
            floor_to:floorTo,
            land_area_from:landAreaFrom,
            land_area_to:landAreaTo,
            verified_only:verifiedOnly,
            no_duplicates:noDuplicates,
            deal_type:dealFilter,
            rooms:roomsFilter,
            price_from:priceFrom,
            price_to:priceTo,
            area_from:areaFrom,
            area_to:areaTo,
            lang:lang||"ru"
          }
        }
      });
      if(error)throw error;
      await new Promise(resolve=>setTimeout(resolve,450));
      const [afterRows,afterSourceRes]=await Promise.all([
        fetchAllMarketListings(),
        supabase.from("market_sources").select("*").eq("agency_id",agencyId).order("created_at",{ascending:false})
      ]);
      setMarketListings(afterRows);
      if(!afterSourceRes.error)setMarketSources(afterSourceRes.data||[]);
      const results=Array.isArray(data?.results)?data.results:[];
      const found=results.reduce((n,x)=>n+Number(x?.listings_found||x?.found||0),0);
      const importedByFunction=results.reduce((n,x)=>n+Number(x?.listings_imported??x?.imported_count??x?.added_count??x?.inserted_count??x?.upserted_count??x?.last_imported_count??0),0);
      const concrete=(afterRows||[]).map(x=>normalizeMarketRow({...x,origin:"market"})).filter(x=>!isSourcePlaceholder(x));
      const concreteCount=concrete.length;
      const message=found>0&&importedByFunction===0
        ? `Источник сообщил о ${found} найденных кандидатах, но в базу не записал ни одной полноценной карточки. В аналитике показаны только реально сохранённые объявления: ${concreteCount}.`
        : `Обновление завершено. Реально сохранённых объявлений: ${concreteCount}${found?`. Источники обнаружили: ${found}`:""}${importedByFunction?`. Добавлено/обновлено: ${importedByFunction}`:""}.`;
      alert(message);
    }catch(e){console.error(e);setMarketError(e?.message||String(e));alert("Не удалось обновить рынок: "+(e?.message||e));}
    finally{setSyncingMarket(false);}
  };

  const getListingDate=x=>x.last_seen_at||x.first_seen_at||x.published_at||x.created_at||x.updated_at||"";
  const inMarketPeriod=x=>{
    const raw=getListingDate(x);if(!raw)return period==="all";
    const ts=new Date(raw).getTime();if(!Number.isFinite(ts))return true;
    let from=0,to=Date.now()+86400000;
    if(period==="custom"){
      if(dateFrom)from=new Date(dateFrom+"T00:00:00").getTime();
      if(dateTo)to=new Date(dateTo+"T23:59:59").getTime();
    }else if(period!=="all"){
      const days=Number(period||30);from=Date.now()-(days*86400000);
      if(days===1){const n=new Date();from=new Date(n.getFullYear(),n.getMonth(),n.getDate()).getTime();}
    }
    return ts>=from&&ts<=to;
  };
  const internalMarketListings=properties.map(p=>{
    const crmDistrict=String(p.district||"").trim();
    const odessaDistrict=/^(киевский|київський|приморский|приморський|пересыпский|пересипський|хаджибейский|хаджибейський|аркадия|аркадія)$/i.test(crmDistrict);
    return {
    id:`crm-${p.id}`, _key:`crm-${p.id}`, origin:"crm", crm_property_id:p.id,
    title:p.title||"Объект CRM", property_type:p.type||p.property_type||"Недвижимость",
    country:p.country||p.country_name||(odessaDistrict?"Украина":""), region:p.region||p.oblast||p.region_name||(odessaDistrict?"Одесская область":""), city:p.city||p.locality||(odessaDistrict?"Одесса":""), district:crmDistrict, complex_name:p.complex_name||p.complex||"",
    deal_type:p.deal_type||p.operation_type||"Продажа", rooms:p.rooms||String(p.type||"").match(/\d+/)?.[0]||"",
    price:Number(p.price||0), area:Number(p.area||0), floor:p.floor||"", total_floors:p.total_floors||"", currency:p.currency||"USD",
    description:p.description||"", source_name:"CRM", source_url:p.source_url||p.url||p.listing_url||"",
    main_photo_url:(p.media||[]).find(m=>String(m.kind||m.media_type||"").toLowerCase().includes("фото"))?.url||(p.media||[])[0]?.url||"",
    photo_urls:(p.media||[]).map(m=>m.url).filter(Boolean), published_at:p.created_at||null, first_seen_at:p.created_at||null, last_seen_at:p.updated_at||p.created_at||null,
    is_active:p.status!=="Неактуален", raw_data:{crm:true}
    };
  });
  const normalizedAllMarketListings=marketListings.map(x=>normalizeMarketRow({...x,_key:`market-${x.id}`,origin:x.origin||"market"}));
  const placeholderMarketListings=normalizedAllMarketListings.filter(isSourcePlaceholder);
  const normalizedMarketListings=normalizedAllMarketListings.filter(x=>!isSourcePlaceholder(x));
  const combinedListings=[...normalizedMarketListings,...internalMarketListings];
  const values=(items,key)=>Array.from(new Set(items.map(x=>String(x?.[key]||"").trim()).filter(Boolean))).sort((a,b)=>a.localeCompare(b,"ru"));
  const geoKey=v=>String(v||"").trim().toLowerCase()
    .normalize("NFKD").replace(/[\u0300-\u036f]/g,"")
    .replace(/[’'`]/g,"")
    .replace(/[‐‑‒–—-]/g," ")
    .replace(/\b(область|обл\.?|region|oblast|province|місто|город|city|район|р-н|district)\b/g," ")
    .replace(/ё/g,"е").replace(/є/g,"е").replace(/ї/g,"и").replace(/і/g,"и")
    .replace(/ы/g,"и").replace(/[ъь]/g,"")
    .replace(/\s+/g," ").trim();

  const latinGeoKey=v=>{
    const s=geoKey(v);
    const multi={щ:"shch",ш:"sh",ч:"ch",ж:"zh",х:"kh",ц:"ts",ю:"yu",я:"ya"};
    const one={а:"a",б:"b",в:"v",г:"h",ґ:"g",д:"d",е:"e",з:"z",и:"i",й:"y",к:"k",л:"l",м:"m",н:"n",о:"o",п:"p",р:"r",с:"s",т:"t",у:"u",ф:"f",э:"e"};
    let out="";
    for(const ch of s)out+=multi[ch]||one[ch]||ch;
    return out.replace(/[^a-z0-9]+/g,"");
  };

  const geoAlias={
    украина:"ukraine","україна":"ukraine",ukraine:"ukraine",
    киев:"kyiv","київ":"kyiv",kiev:"kyiv",kyiv:"kyiv",
    одесса:"odesa","одеса":"odesa",odessa:"odesa",odesa:"odesa",
    харьков:"kharkiv","харків":"kharkiv",kharkov:"kharkiv",kharkiv:"kharkiv",
    днепр:"dnipro","дніпро":"dnipro",dnepr:"dnipro",dnipro:"dnipro",
    львов:"lviv","львів":"lviv",lvov:"lviv",lviv:"lviv",
    николаев:"mykolaiv","миколаїв":"mykolaiv",nikolaev:"mykolaiv",mykolaiv:"mykolaiv",
    запорожье:"zaporizhzhia","запоріжжя":"zaporizhzhia",zaporozhye:"zaporizhzhia",zaporizhzhia:"zaporizhzhia",
    ровно:"rivne","рівне":"rivne",rovno:"rivne",rivne:"rivne",
    черновцы:"chernivtsi","чернівці":"chernivtsi",chernovtsy:"chernivtsi",chernivtsi:"chernivtsi",
    ужгород:"uzhhorod",uzhgorod:"uzhhorod",uzhhorod:"uzhhorod",
    иванофранковск:"ivanofrankivsk","іванофранківськ":"ivanofrankivsk",ivanofrankivsk:"ivanofrankivsk",
    // Области: русское/украинское написание — один и тот же фильтр.
    одесская:"odesa_region",одеська:"odesa_region",киевская:"kyiv_region",київська:"kyiv_region",
    винницкая:"vinnytsia_region",вінницька:"vinnytsia_region",волынская:"volyn_region",волинська:"volyn_region",
    днепропетровская:"dnipro_region",дніпропетровська:"dnipro_region",донецкая:"donetsk_region",донецька:"donetsk_region",
    житомирская:"zhytomyr_region",житомирська:"zhytomyr_region",закарпатская:"zakarpattia_region",закарпатська:"zakarpattia_region",
    запорожская:"zaporizhzhia_region",запорізька:"zaporizhzhia_region",иванофранковская:"ivano_frankivsk_region",іванофранківська:"ivano_frankivsk_region",
    кировоградская:"kirovohrad_region",кіровоградська:"kirovohrad_region",луганская:"luhansk_region",луганська:"luhansk_region",
    львовская:"lviv_region",львівська:"lviv_region",николаевская:"mykolaiv_region",миколаївська:"mykolaiv_region",
    полтавская:"poltava_region",полтавська:"poltava_region",ровненская:"rivne_region",рівненська:"rivne_region",
    сумская:"sumy_region",сумська:"sumy_region",тернопольская:"ternopil_region",тернопільська:"ternopil_region",
    харьковская:"kharkiv_region",харківська:"kharkiv_region",херсонская:"kherson_region",херсонська:"kherson_region",
    хмельницкая:"khmelnytskyi_region",хмельницька:"khmelnytskyi_region",черкасская:"cherkasy_region",черкаська:"cherkasy_region",
    черновицкая:"chernivtsi_region",чернівецька:"chernivtsi_region",черниговская:"chernihiv_region",чернігівська:"chernihiv_region",
  };
  const geoCanon=v=>{
    const raw=geoKey(v),latin=latinGeoKey(v);
    return geoAlias[raw]||geoAlias[latin]||latin||raw;
  };
  const geoEq=(a,b)=>{
    const aa=geoCanon(a),bb=geoCanon(b);
    return !!aa&&!!bb&&aa===bb;
  };
  const dedupeGeoOptions=(arr,preferred=[])=>{
    const out=[];const seen=new Set();
    [...preferred,...arr].forEach(v=>{const val=String(v||"").trim();if(!val)return;const key=geoCanon(val)||geoKey(val);if(!key||seen.has(key))return;seen.add(key);out.push(val);});
    return out;
  };
  const geoDisplay=value=>{
    if(value==="Все")return lang==="uk"?"Усі":lang==="en"?"All":"Все";
    const direct=analyticsGeoI18n[value];
    if(direct?.[lang])return direct[lang];
    const canonical=Object.keys(analyticsGeoI18n).find(k=>geoEq(k,value));
    if(canonical&&analyticsGeoI18n[canonical]?.[lang])return analyticsGeoI18n[canonical][lang];
    if(lang==="en")return value;
    return value;
  };

  // Нормализация географии специально для Аналитики.
  // Старые импортированные строки часто имеют пустые country/region/city, хотя локация есть
  // в raw_data, заголовке, описании или понятна по самому источнику.
  const searchableText=row=>{
    const raw=(()=>{try{return JSON.stringify(row?.raw_data||{});}catch{return "";}})();
    return [row?.title,row?.description,row?.address,row?.country,row?.region,row?.city,row?.district,row?.complex_name,row?.source_name,row?.source_url,raw]
      .filter(Boolean).join(" \ ").toLowerCase();
  };
  const sourceCatalogEntry=row=>{
    const raw=[row?.source_name,row?.source_url,row?.source_home_url,row?.external_id].filter(Boolean).join(" \ ").toLowerCase();
    if(!raw)return null;
    return analyticsSourceCatalog.find(entry=>
      raw.includes(String(entry.name||"").toLowerCase()) ||
      (entry.aliases||[]).some(alias=>raw.includes(String(alias||"").toLowerCase())) ||
      (entry.url&&(()=>{try{return raw.includes(new URL(entry.url).hostname.replace(/^www\./,""));}catch{return false;}})())
    )||null;
  };
  const allCatalogCities=Object.entries(analyticsGeoCatalog).flatMap(([catalogCountry,data])=>
    Object.entries(data?.regions||{}).flatMap(([catalogRegion,cities])=>
      (cities||[]).map(catalogCity=>({country:catalogCountry,region:catalogRegion,city:catalogCity}))
    )
  );
  const inferCatalogCity=(text,preferredCountry="")=>{
    const pool=allCatalogCities
      .filter(x=>!preferredCountry||geoEq(x.country,preferredCountry))
      .sort((a,b)=>String(b.city).length-String(a.city).length);
    return pool.find(x=>{
      const variants=[geoKey(x.city),latinGeoKey(x.city),String(x.city).toLowerCase()].filter(Boolean);
      return variants.some(v=>v.length>2&&text.includes(v));
    })||null;
  };
  const inferOfficialDistrict=(text,countryValue,cityValue)=>{
    if(!countryValue||!cityValue)return "";
    const key=Object.keys(officialCityDistricts).find(k=>{const [c,ct]=k.split("|");return geoEq(c,countryValue)&&geoEq(ct,cityValue);});
    if(!key)return "";
    return (officialCityDistricts[key]||[]).find(d=>{
      const variants=[geoKey(d),latinGeoKey(d),String(d).toLowerCase()].filter(Boolean);
      return variants.some(v=>v.length>2&&text.includes(v));
    })||"";
  };
  const enrichListingGeo=row=>{
    const sourceEntry=sourceCatalogEntry(row);
    let countryValue=String(row?.country||"").trim() || String(sourceEntry?.country||"").trim();
    const text=searchableText(row);
    let regionValue=String(row?.region||"").trim();
    let cityValue=String(row?.city||"").trim();

    let cityMeta=null;
    if(cityValue){
      cityMeta=allCatalogCities.find(x=>geoEq(x.city,cityValue)&&(!countryValue||geoEq(x.country,countryValue)))||null;
    } else {
      cityMeta=inferCatalogCity(text,countryValue);
      if(cityMeta)cityValue=cityMeta.city;
    }
    if(!countryValue&&cityMeta)countryValue=cityMeta.country;
    if(!regionValue&&cityMeta)regionValue=cityMeta.region;

    if(countryValue&&!regionValue){
      const countryKey=Object.keys(analyticsGeoCatalog).find(k=>geoEq(k,countryValue));
      if(countryKey){
        const regionNames=Object.keys(analyticsGeoCatalog[countryKey]?.regions||{}).sort((a,b)=>b.length-a.length);
        const foundRegion=regionNames.find(r=>{const variants=[geoKey(r),latinGeoKey(r),String(r).toLowerCase()].filter(Boolean);return variants.some(v=>v.length>2&&text.includes(v));});
        if(foundRegion)regionValue=foundRegion;
      }
    }

    let districtValue=String(row?.district||"").trim();
    if(!districtValue)districtValue=inferOfficialDistrict(text,countryValue,cityValue);
    return {...row,country:countryValue,region:regionValue,city:cityValue,district:districtValue};
  };

  const inferComplexName=row=>{
    const current=String(row?.complex_name||"").trim();
    if(current)return current;
    const raw=(()=>{try{return JSON.stringify(row?.raw_data||{});}catch{return "";}})();
    const text=[row?.title,row?.description,row?.address,raw].filter(Boolean).join(" ");
    const match=text.match(/(?:\bЖК\b|житлов(?:ий|ого)\s+комплекс|жил(?:ой|ого)\s+комплекс)\s*[«\"']?([^\n,;|()]{2,70})/i);
    if(!match)return "";
    return String(match[1]||"").replace(/[»\"'].*$/," ").replace(/\s+/g," ").trim();
  };
  const listingKind=row=>{
    const raw=(()=>{try{return JSON.stringify(row?.raw_data||{});}catch{return "";}})();
    const text=[row?.property_type,row?.type,row?.category,row?.title,row?.description,raw].filter(Boolean).join(" ").toLowerCase();
    if(/земел|ділян|участ|land|plot/.test(text))return "Участок";
    if(/таунхаус|townhouse/.test(text))return "Таунхаус";
    if(/дуплекс|duplex/.test(text))return "Дуплекс";
    if(/коттедж|котедж|cottage/.test(text))return "Коттедж";
    if(/дом|будинок|house|особняк|дач/.test(text))return "Дом";
    if(/коммер|комерц|офис|офіс|магазин|склад|commercial/.test(text))return "Коммерция";
    if(/гараж|паркомест|паркоміс/.test(text))return "Гараж / паркоместо";
    if(/комнат|кімнат|room/.test(text)&&!/кварт|апартамент|flat|apartment/.test(text))return "Комната";
    if(/кварт|апартамент|flat|apartment|студи|студі|смарт/.test(text))return "Квартира";
    return "Другое";
  };
  const listingCondition=row=>{
    const text=searchableText(row);
    if(/після будівель|после строител|без ремонт|чернов|чорнов|від забудовник|от застройщик/.test(text))return "Без ремонта";
    if(/дизайнер|євроремонт|евроремонт|капитальн|капітальн|с ремонт|з ремонтом|готов[а-яіїє]* до прожив/.test(text))return "С ремонтом";
    return "Не указано";
  };
  const listingVerified=row=>{
    const raw=row?.raw_data||{};
    const text=searchableText(row);
    return raw?.verified===true||raw?.is_verified===true||row?.verified===true||/перевірен|проверен|verified/.test(text);
  };
  const listingSellerKind=row=>{
    const raw=row?.raw_data||{};
    const explicit=firstText(raw,["seller_type","user_type","advertiser_type","account_type","author_type","owner_type","person_type"]).toLowerCase();
    const text=[row?.title,row?.description,(()=>{try{return JSON.stringify(raw);}catch{return "";}})()].filter(Boolean).join(" ").toLowerCase();
    if(/owner|собствен|власник|власниц|без комисс|без коміс|від власник|от собствен/.test(`${explicit} ${text}`))return "owner";
    if(/realtor|agent|broker|agency|риелтор|ріелтор|агент|маклер/.test(`${explicit} ${text}`))return "realtor";
    return "unknown";
  };
  const listingLandArea=row=>{
    const raw=row?.raw_data||{};
    const direct=Number(row?.land_area||raw?.land_area||raw?.plot_area||raw?.land_size||0);
    if(direct>0)return direct;
    const text=searchableText(row),match=text.match(/(\d+(?:[.,]\d+)?)\s*(?:сот(?:ок|ки|ка)?|сот\.)/i);
    return match?Number(String(match[1]).replace(",",".")):0;
  };

  const analyticsListings=combinedListings.map(row=>{
    const enriched=enrichListingGeo(row);
    return {...enriched,complex_name:inferComplexName(enriched),analytics_property_kind:listingKind(enriched)};
  });

  const catalogCountries=Object.keys(analyticsGeoCatalog);
  const countries=["Все",...dedupeGeoOptions([...catalogCountries,...values(analyticsListings,"country")],catalogCountries).sort((a,b)=>a.localeCompare(b,"ru"))];

  const countryMatches=x=>{
    if(country==="Все")return true;
    if(x.origin==="crm"&&!String(x.country||"").trim())return true;
    return geoEq(x.country,country);
  };

  const geoCountry=country==="Все"
    ? analyticsListings
    : analyticsListings.filter(countryMatches);

  const selectedCountryKey=country!=="Все"
    ? catalogCountries.find(k=>geoEq(k,country))||country
    : "Все";

  const catalogRegions=selectedCountryKey!=="Все"
    ? Object.keys(analyticsGeoCatalog[selectedCountryKey]?.regions||{})
    : [];

  const regions=["Все",...dedupeGeoOptions([...catalogRegions,...values(geoCountry,"region")],catalogRegions).sort((a,b)=>a.localeCompare(b,"ru"))];

  const selectedRegionKey=region!=="Все"
    ? catalogRegions.find(k=>geoEq(k,region))||region
    : "Все";

  const regionCities=selectedCountryKey!=="Все"&&selectedRegionKey!=="Все"
    ? (analyticsGeoCatalog[selectedCountryKey]?.regions?.[selectedRegionKey]||[])
    : [];

  const cityBelongsToSelectedRegion=cityValue=>{
    if(region==="Все")return true;
    if(!cityValue)return false;
    return regionCities.some(c=>geoEq(c,cityValue));
  };

  const regionMatches=x=>{
    if(region==="Все")return true;
    if(x.region&&geoEq(x.region,region))return true;
    // У старых DIM.RIA/Telegram строк region часто пустой.
    // Если город однозначно относится к выбранной области, объект не должен пропадать.
    return !String(x.region||"").trim()&&cityBelongsToSelectedRegion(x.city);
  };

  const geoRegion=region==="Все"
    ? geoCountry
    : geoCountry.filter(regionMatches);

  const catalogCities=selectedCountryKey!=="Все"
    ? (selectedRegionKey!=="Все"
        ? (analyticsGeoCatalog[selectedCountryKey]?.regions?.[selectedRegionKey]||[])
        : Object.values(analyticsGeoCatalog[selectedCountryKey]?.regions||{}).flat())
    : [];

  const cities=["Все",...dedupeGeoOptions([...catalogCities,...values(geoRegion,"city")],catalogCities).sort((a,b)=>a.localeCompare(b,"ru"))];

  const cityMatches=x=>city==="Все"||geoEq(x.city,city);
  const geoCity=city==="Все"?geoRegion:geoRegion.filter(cityMatches);

  const officialCountryKey=Object.keys(officialCityDistricts)
    .map(k=>k.split("|")[0])
    .find(k=>geoEq(k,country))||country;
  const officialCityKey=Object.keys(officialCityDistricts)
    .map(k=>k.split("|")[1])
    .find(k=>geoEq(k,city))||city;
  const officialKey=`${officialCountryKey}|${officialCityKey}`;
  const officialDistricts=officialCityDistricts[officialKey]||[];

  const districtsMarket=["Все",...Array.from(new Set((officialDistricts.length?officialDistricts:values(geoCity,"district")).filter(Boolean)))];
  // В фильтр попадает только официальный справочник ЖК DIM.RIA.
  // Заголовки и описания объявлений сюда намеренно не примешиваются.
  const directoryComplexNames=(complexDirectory||[])
    .filter(item=>country==="Все"||geoEq(item.country,country))
    .filter(item=>region==="Все"||!item.region||geoEq(item.region,region))
    .filter(item=>city==="Все"||!item.city||geoEq(item.city,city))
    .map(item=>String(item.official_name||"").trim()).filter(Boolean);
  const complexes=["Все",...Array.from(new Set(directoryComplexNames)).sort((a,b)=>a.localeCompare(b,"uk"))];
  const propertyKinds=["Все","Квартира","Дом","Таунхаус","Дуплекс","Коттедж","Участок","Коммерция","Комната","Гараж / паркоместо","Другое"];

  const enabledMarketSources=(marketSources||[]).filter(x=>x.enabled!==false&&x.paused!==true);
  const connectedSourceCountries=enabledMarketSources.map(x=>String(x.country||"").trim()).filter(Boolean);
  const sourceCountryOptions=["Все",...Array.from(new Set([...analyticsSourceCatalog.map(x=>x.country),...connectedSourceCountries,...values(analyticsListings.filter(x=>x.origin!=="crm"),"country")])).sort((a,b)=>a.localeCompare(b,"ru"))];
  const catalogForCountry=analyticsSourceCatalog.filter(x=>sourceCountry==="Все"||geoEq(x.country,sourceCountry));
  const connectedForCountry=enabledMarketSources.filter(x=>sourceCountry==="Все"||geoEq(x.country,sourceCountry));
  const liveSourceNames=values(sourceCountry==="Все"?analyticsListings.filter(x=>x.origin!=="crm"):analyticsListings.filter(x=>x.origin!=="crm"&&geoEq(x.country,sourceCountry)),"source_name");
  const sourceOptions=Array.from(new Set([
    "CRM",
    ...connectedForCountry.map(x=>String(x.name||"").trim()).filter(Boolean),
    ...catalogForCountry.map(x=>x.name),
    ...liveSourceNames
  ])).sort((a,b)=>a.localeCompare(b,"ru"));

  const sourceMatches=(x,name)=>{
    const wanted=String(name||"").trim().toLowerCase();
    if(wanted==="crm")return x.origin==="crm"||String(x.source_name||"").trim().toLowerCase()==="crm";
    const raw=[x.source_name,x.source_url,x.source_home_url,x.external_id].filter(Boolean).join(" ").toLowerCase();
    const entry=analyticsSourceCatalog.find(s=>String(s.name||"").toLowerCase()===wanted);
    const connected=enabledMarketSources.find(s=>String(s.name||"").trim().toLowerCase()===wanted);
    const aliases=[entry?.name,...(entry?.aliases||[]),connected?.name].filter(Boolean).map(v=>String(v).toLowerCase());
    return raw===wanted||raw.includes(wanted)||aliases.some(a=>raw.includes(a));
  };

  const sourceLiveCount=name=>analyticsListings.filter(x=>sourceMatches(x,name)).length;
  const sourceConnected=name=>name==="CRM"||enabledMarketSources.some(s=>String(s.name||"").trim().toLowerCase()===String(name||"").trim().toLowerCase());

  const dealCanon=v=>{
    const s=String(v||"").toLowerCase();
    if(/аренд|оренд|rent|lease/.test(s))return "Аренда";
    if(/продаж|sale|sell/.test(s))return "Продажа";
    return String(v||"").trim();
  };
  const sourceCountryMatches=x=>{
    if(x.origin==="crm"||String(x.source_name||"").toUpperCase()==="CRM")return true;
    return sourceCountry==="Все"||geoEq(x.country,sourceCountry)||geoEq(sourceCatalogEntry(x)?.country,sourceCountry);
  };
  const searchMatches=x=>{
    const q=String(searchQuery||"").trim().toLowerCase();
    if(!q)return true;
    const hay=[x.title,x.description,x.country,x.region,x.city,x.district,x.complex_name,x.source_name,x.source_url,x.external_id,x.rooms,x.area,x.price]
      .filter(v=>v!==null&&v!==undefined).join(" ").toLowerCase();
    return q.split(/\s+/).filter(Boolean).every(token=>hay.includes(token));
  };

  const constructionYear=x=>{
    const raw=x?.raw_data||{};
    const direct=Number(x?.construction_year||raw?.construction_year||raw?.building_year||raw?.year_built||0);
    if(direct>=1800&&direct<=2100)return direct;
    const text=searchableText(x);
    return Number(text.match(/(?:год|рік)\s*(?:постройки|будівництва|здачі|сдачи)?\s*[:—-]?\s*((?:18|19|20)\d{2})/i)?.[1]||0);
  };
  const listingPrograms=x=>{
    const text=searchableText(x).toLowerCase();
    const flags=[];
    if(/єосел|еосел|є-осел|eoselia/.test(text))flags.push("єОселя");
    if(/євіднов|евіднов|є-віднов|житлов(?:ий|ой)\s+сертифікат|сертификат\s+на\s+жиль/.test(text))flags.push("єВідновлення / сертификат");
    if(/постанова|постановление/.test(text)&&/\b280\b/.test(text))flags.push("Постановление №280");
    if(/постанова|постановление/.test(text)&&/\b719\b/.test(text))flags.push("Постановление №719");
    if(/постанова|постановление/.test(text)&&/\b1176\b/.test(text))flags.push("Постановление №1176");
    if(/державн(?:а|і|ой|ые)\s+програм|гос(?:ударственн)?\.?\s*програм|ваучер/.test(text))flags.push("Другие госпрограммы");
    return Array.from(new Set(flags));
  };

  const activeTabMatches=x=>{
    if(activeSourceTab==="ALL")return true;
    if(activeSourceTab==="CRM")return x.origin==="crm"||String(x.source_name||"").toUpperCase()==="CRM";
    return (activeServerSources||[]).some(name=>sourceMatches(x,name));
  };

  const filteredBase=analyticsListings.filter(x=>{
    const num=v=>Number(v||0);
    const p=num(x.price),a=num(x.area);
    const priceFilterActive=!!priceFrom||!!priceTo;
    const areaFilterActive=!!areaFrom||!!areaTo;

    // В аналитике не показываем объявления без цены: они портят сравнение и не дают пользы менеджеру.
    return p>0
      &&activeTabMatches(x)
      &&inMarketPeriod(x)
      &&searchMatches(x)
      &&sourceCountryMatches(x)
      &&countryMatches(x)
      &&regionMatches(x)
      &&cityMatches(x)
      &&(districtFilter==="Все"||geoEq(x.district,districtFilter)||(!String(x.district||"").trim()&&inferOfficialDistrict(searchableText(x),x.country,x.city)&&geoEq(inferOfficialDistrict(searchableText(x),x.country,x.city),districtFilter)))
      &&(complexFilter==="Все"||geoEq(x.complex_name,complexFilter))
      &&(propertyKindFilter==="Все"||x.analytics_property_kind===propertyKindFilter)
      &&(sellerFilter==="Все"||(sellerFilter==="Собственник"&&listingSellerKind(x)==="owner")||(sellerFilter==="Риэлтор"&&listingSellerKind(x)==="realtor"))
      &&(conditionFilter==="Все"||listingCondition(x)===conditionFilter)
      &&(!floorFrom||num(x.floor)>=num(floorFrom))
      &&(!floorTo||num(x.floor)<=num(floorTo))
      &&(!landAreaFrom||listingLandArea(x)>=num(landAreaFrom))
      &&(!landAreaTo||listingLandArea(x)<=num(landAreaTo))
      &&(!verifiedOnly||listingVerified(x))
      &&(!constructionYearFrom||constructionYear(x)>=Number(constructionYearFrom))
      &&(!constructionYearTo||constructionYear(x)<=Number(constructionYearTo))
      &&(!governmentPrograms.length||governmentPrograms.some(program=>listingPrograms(x).includes(program)))
      &&(dealFilter==="Все"||dealCanon(x.deal_type)===dealCanon(dealFilter))
      &&(!selectedSources.length||selectedSources.some(name=>sourceMatches(x,name)))
      &&(roomsFilter==="Все"||(roomsFilter==="4+"?num(x.rooms)>=4:String(num(x.rooms))===roomsFilter))
      &&(!priceFilterActive||(p>0&&(!priceFrom||p>=num(priceFrom))&&(!priceTo||p<=num(priceTo))))
      &&(!areaFilterActive||(a>0&&(!areaFrom||a>=num(areaFrom))&&(!areaTo||a<=num(areaTo))));
  });
  const duplicateKey=x=>{
    const text=`${x.title||""} ${x.description||""} ${JSON.stringify(x.raw_data||{})}`.toLowerCase();
    const phone=(text.match(/(?:\+?38)?0\d{9}/)||[])[0]?.replace(/\D/g,"");
    if(phone)return `phone:${phone.slice(-10)}`;
    const address=String(x.address||x.complex_name||"").toLowerCase().replace(/[^a-zа-яіїє0-9]+/gi," ").trim();
    const cityKey=String(x.city||"").toLowerCase().replace(/[^a-zа-яіїє0-9]+/gi,"");
    const districtKey=String(x.district||"").toLowerCase().replace(/[^a-zа-яіїє0-9]+/gi,"");
    return [cityKey,districtKey,address,Number(x.rooms||0),Math.round(Number(x.area||0)),Math.round(Number(x.price||0)/1000)].join("|");
  };
  const duplicateSizes=filteredBase.reduce((m,x)=>{const key=duplicateKey(x);m[key]=(m[key]||0)+1;return m;},{});
  const markedBase=filteredBase.map(x=>({...x,_duplicate_key:duplicateKey(x),_duplicate_count:duplicateSizes[duplicateKey(x)]||1}));
  const deduplicatedBase=noDuplicates?markedBase.filter((x,index,arr)=>arr.findIndex(item=>item._duplicate_key===x._duplicate_key)===index):markedBase;
  const filtered=[...deduplicatedBase].sort((a,b)=>{
    if(priceSort==="asc") return Number(a.price||0)-Number(b.price||0);
    if(priceSort==="desc") return Number(b.price||0)-Number(a.price||0);
    if(priceSort==="areaAsc") return (Number(a.area||0)||Number.MAX_SAFE_INTEGER)-(Number(b.area||0)||Number.MAX_SAFE_INTEGER);
    if(priceSort==="areaDesc") return Number(b.area||0)-Number(a.area||0);
    if(groupDuplicates&&a._duplicate_key!==b._duplicate_key)return String(a._duplicate_key).localeCompare(String(b._duplicate_key));
    return new Date(getListingDate(b)||0).getTime()-new Date(getListingDate(a)||0).getTime();
  });

  const marketCurrency=x=>String(x?.currency||detectCurrency(x?.price,x?.raw_data)||"USD").toUpperCase();
  const currencySymbol=c=>({USD:"$",EUR:"€",UAH:"₴",AED:"AED ",GEL:"₾",GBP:"£",PLN:"zł ",THB:"฿",IDR:"Rp "}[String(c||"").toUpperCase()]||`${c||""} `);
  const marketMoney=(value,currency)=>Number(value||0)>0?`${currencySymbol(currency)}${Number(value).toLocaleString()}`:"Цена не указана";
  const priceCurrencies=Array.from(new Set(filtered.filter(x=>Number(x.price||0)>0).map(marketCurrency)));
  const statsCurrency=priceCurrencies.length===1?priceCurrencies[0]:"";
  const activePrices=statsCurrency?filtered.filter(x=>marketCurrency(x)===statsCurrency).map(x=>Number(x.price||0)).filter(x=>x>0):[];
  const avgPrice=activePrices.length?Math.round(activePrices.reduce((a,b)=>a+b,0)/activePrices.length):0;
  const m2=statsCurrency?filtered.filter(x=>marketCurrency(x)===statsCurrency).map(x=>Number(x.price||0)>0&&Number(x.area||0)>0?Number(x.price)/Number(x.area):0).filter(Boolean):[];
  const avgM2=m2.length?Math.round(m2.reduce((a,b)=>a+b,0)/m2.length):0;
  const sourceCounts=filtered.reduce((m,x)=>{const k=x.source_name||"Без источника";m[k]=(m[k]||0)+1;return m;},{});
  const liveTotals=liveSourceMeta.filter(x=>x.ok&&Number(x.total)>0);
  const liveTotal=liveTotals.reduce((sum,x)=>sum+Number(x.total||0),0);
  const maxLivePages=Math.max(1,...liveSourceMeta.filter(x=>x.ok).map(x=>Number(x.totalPages||0)).filter(Boolean));
  const sourceSummary=(()=>{const m=new Map();liveSourceMeta.filter(x=>x.ok).forEach(x=>m.set(x.source,[x.source,Number(x.total||x.pageItemCount||0),x.exact]));Object.entries(sourceCounts).forEach(([name,count])=>{if(!m.has(name))m.set(name,[name,count,true]);});return [...m.values()].filter(x=>x[1]>0).sort((a,b)=>b[1]-a[1]);})();

  const normalizeUrl=v=>String(v||"").trim();
  const sourceUrlInUsd=(value,source="")=>{
    const raw=normalizeUrl(value);
    if(!raw)return "";
    try{
      const u=new URL(raw);
      const host=u.hostname.toLowerCase(),name=String(source||"").toLowerCase();
      if(host.includes("olx.ua")||host.includes("dom.ria.com")||name.includes("olx")||name.includes("dim.ria"))u.searchParams.set("currency","USD");
      return u.toString();
    }catch{return raw;}
  };
  const crmMatch=x=>{
    if(x.origin==="crm"||x.crm_property_id){return properties.find(p=>String(p.id)===String(x.crm_property_id||String(x.id).replace(/^crm-/,"")))||null;}
    if(addedCrm[x._key]) return addedCrm[x._key];
    const raw=x.raw_data||{};
    const crmId=x.crm_property_id||raw.crm_property_id||raw.property_id;
    if(crmId){const exact=properties.find(p=>String(p.id)===String(crmId));if(exact)return exact;}
    const url=sourceUrlInUsd(x.source_url,x.source_name);
    if(url){const byUrl=properties.find(p=>[p.source_url,p.url,p.listing_url,p.external_url].some(v=>normalizeUrl(v)===url));if(byUrl)return byUrl;}
    const title=String(x.title||"").trim().toLowerCase();
    if(title){const byTitle=properties.find(p=>String(p.title||"").trim().toLowerCase()===title);if(byTitle)return byTitle;}
    return null;
  };
  const openListing=x=>{
    const crm=crmMatch(x);
    if(crm&&onOpenProperty){onOpenProperty(crm);return;}
    const url=normalizeUrl(x.source_url);
    if(url)window.open(url,"_blank","noopener,noreferrer");
    else alert("У этого объявления пока нет ссылки.");
  };
  const toggleSelected=id=>setSelected(v=>v.includes(String(id))?v.filter(x=>x!==String(id)):[...v,String(id)]);
  const toggleFavorite=id=>setFavorites(v=>v.includes(String(id))?v.filter(x=>x!==String(id)):[...v,String(id)]);
  const selectionItems=combinedListings.filter(x=>selected.includes(String(x._key))).map(x=>{
    const crm=crmMatch(x);
    if(crm)return crm;
    const photos=Array.isArray(x.photo_urls)?x.photo_urls.filter(Boolean):[];
    const main=x.main_photo_url||photos[0]||"";
    return {
      id:`market-${x.id}`,title:x.title||x.complex_name||"Объект недвижимости",type:x.property_type||"Недвижимость",
      district:x.district||x.city||x.region||"",price:Number(x.price||0),area:Number(x.area||0),floor:x.floor||"",
      description:x.description||"",description_uk:x.description||"",media:main?[{kind:"Фото",url:main},...photos.slice(1).map(url=>({kind:"Фото",url}))]:[],
      source_url:x.source_url||"",source_name:x.source_name||"",rooms:x.rooms||"",complex_name:x.complex_name||"",total_floors:x.total_floors||x.raw_data?.total_floors||"",condition:x.condition||"",raw_data:x.raw_data||{}
    };
  });
  const decodePresentationText=value=>{const node=document.createElement("textarea");node.innerHTML=String(value||"");return node.value;};
  const cleanPresentationDescription=value=>decodePresentationText(value)
    .replace(/\b(?:id|style|role|aria-[\w-]+|data-[\w-]+|class)\s*=\s*(?:"[^"]*"|'[^']*')/gi," ")
    .replace(/data-[a-z-]+=(?:"[^"]*"|'[^']*')/gi," ")
    .replace(/class=(?:"[^"]*"|'[^']*')/gi," ")
    .replace(/<[^>]+>/g," ").replace(/(?:^|\s)>\s*/g," ")
    .replace(/(?:^|[\s·|,;()])(?:ID|Код\s+(?:объекта|об'єкта))\s*[:#№-]?\s*[A-Za-zА-Яа-яІіЇїЄє0-9_-]*\d[A-Za-zА-Яа-яІіЇїЄє0-9_-]*/giu," ")
    .replace(/\bhttps?:\/\/[^\s<>"']+/gi," ")
    .replace(/\bwww\.[^\s<>"']+/gi," ")
    .replace(/\b(?:Оригинал|Посилання|Link)\s*:\s*/gi," ")
    .replace(/\s+/g," ").trim();
  const withoutPresentationSource=(value,sourceName="")=>{
    let text=cleanPresentationDescription(value);
    const source=String(sourceName||"").trim();
    if(source){
      const escaped=source.replace(/[.*+?^${}()|[\]\\]/g,"\\$&");
      text=text.replace(new RegExp(`\\b(?:Источник|Джерело|Source)\\s*[:—-]?\\s*${escaped}\\b`,`gi`)," ");
    }
    return text
      .replace(/\b(?:Источник|Джерело|Source)\s*[:—-]?\s*(?:DIM\.?RIA|DOM\.?RIA|OLX|RIELTOR(?:\.UA)?|REM|Telegram|CRM|ЛУН|LUN|MyHome\.ge|SS\.ge|Korter\.ge)\b/gi," ")
      .replace(/\s+/g," ").trim();
  };
  const cleanPresentationTitle=value=>cleanPresentationDescription(value)
    .replace(/[‼❗🔥⭐🌟💥✅🔑🏠🏡]+/gu," ").replace(/!{2,}/g,"!").replace(/\s+/g," ").trim().slice(0,260);
  const presentationPhotoIdentity=value=>{
    try{
      const u=new URL(String(value||""));
      const olx=u.pathname.match(/\/files\/([^/]+)/i)?.[1];if(olx)return `olx:${olx}`;
      const ria=u.pathname.match(/(?:realty__|\/)(\d{7,})(?:[-_.]|$)/i)?.[1];if(ria)return `ria:${ria}`;
      return `${u.hostname}${u.pathname}`.toLowerCase().replace(/;s=\d+x\d+$/i,"").replace(/[-_]\d+x\d+(?:x\d+)?(?=\.[a-z0-9]+$)/i,"");
    }catch{return String(value||"").split("?")[0].toLowerCase();}
  };
  const uniquePresentationPhotos=values=>{const seen=new Set();return (values||[]).filter(Boolean).filter(url=>{const key=presentationPhotoIdentity(url);if(!key||seen.has(key))return false;seen.add(key);return true;});};
  const enrichAnalyticsPresentationItem=async item=>{
    const currentPhotos=extractPropertyPhotos(item);
    if(!item.source_url)return item;
    try{
      const {data,error}=await supabase.functions.invoke("analytics-live-search",{body:{action:"presentation_detail",url:item.source_url}});
      if(error||!data?.success)return item;
      const remotePhotos=uniquePresentationPhotos(Array.isArray(data.images)?data.images:[]);
      const all=remotePhotos.length?remotePhotos:uniquePresentationPhotos(currentPhotos.map(x=>x.url));
      const media=all.map(url=>({kind:"Фото",url}));
      const detailDescription=withoutPresentationSource(data.description||"",item.source_name);
      const currentDescription=withoutPresentationSource(item.description_uk||item.description||"",item.source_name);
      const fullDescription=detailDescription.length>=currentDescription.length?detailDescription:currentDescription;
      const remoteTitle=cleanPresentationTitle(data.title||""),currentTitle=cleanPresentationTitle(item.title||"");
      const fullTitle=remoteTitle.length>currentTitle.length?remoteTitle:currentTitle;
      const d=data.details||{};
      const floorFromText=fullDescription.match(/(?:на\s+|расположен[а-яё]*\s+на\s+|розташован[а-яіїє]*\s+на\s+)(\d{1,3})\s+(?:этаже|поверсі|поверху)/iu)?.[1]||"";
      const floorValue=d.floor||item.floor||floorFromText||"";
      return {...item,title:fullTitle||"Объект недвижимости",description:fullDescription,description_uk:fullDescription,media,
        floor:floorValue,total_floors:d.total_floors||item.total_floors||"",area:d.area||item.area||0,rooms:d.rooms||item.rooms||"",
        complex_name:d.complex_name||item.complex_name||"",type:d.property_type||item.type||"",condition:d.condition||item.condition||"",layout:d.layout||"",kitchen_area:d.kitchen_area||"",wall_type:d.wall_type||"",deal_type:d.deal_type||""};
    }catch(e){console.warn("Analytics presentation detail fallback:",e);const description=withoutPresentationSource(item.description,item.source_name);return {...item,title:cleanPresentationTitle(item.title),description,description_uk:description};}
  };
  const drawAnalyticsPresentationImage=async(ctx,url,x,y,w,h,fit="cover")=>{
    if(!url)return false;
    let objectUrl="";
    try{
      const {data,error}=await supabase.functions.invoke("analytics-live-search",{body:{action:"presentation_image",url}});
      if(error)throw error;
      const blob=data instanceof Blob?data:data instanceof ArrayBuffer?new Blob([data]):null;
      if(!blob)throw new Error("image proxy returned no image");
      objectUrl=URL.createObjectURL(blob);
      return await drawRemoteImage(ctx,objectUrl,x,y,w,h,fit);
    }catch(e){
      console.warn("Analytics presentation image fallback:",e);
      return await drawRemoteImage(ctx,url,x,y,w,h,fit);
    }finally{if(objectUrl)URL.revokeObjectURL(objectUrl);}
  };
  const filterRenderableAnalyticsPhotos=async photos=>{
    const valid=[],list=photos||[];
    for(let start=0;start<list.length;start+=4){
      const batch=await Promise.all(list.slice(start,start+4).map(async photo=>{
        const probe=document.createElement("canvas");probe.width=8;probe.height=8;
        return (await drawAnalyticsPresentationImage(probe.getContext("2d"),photo.url,0,0,8,8,"cover"))?photo:null;
      }));
      valid.push(...batch.filter(Boolean));
    }
    return valid;
  };

  const contactPhone=x=>{
    const direct=[x?.contact_phone,x?.phone,x?.owner_phone,x?.realtor_phone,x?.agent_phone,x?.raw_data?.phone,x?.raw_data?.contact_phone,x?.raw_data?.telephone,x?.raw_data?.mobile].find(Boolean);
    if(direct)return String(direct).trim();
    const vals=deepValues(x?.raw_data||{},["phone","telephone","mobile","contact_phone","owner_phone","realtor_phone","agent_phone","phones"],120).flat(Infinity);
    for(const v of vals){const m=String(v||"").match(/\+?\d[\d\s()\-]{7,}\d/);if(m)return m[0].trim();}
    const m=searchableText(x).match(/\+?\d[\d\s()\-]{7,}\d/);return m?m[0].trim():"";
  };
  const sellerKind=x=>{
    const raw=x?.raw_data||{};
    const explicit=firstText(raw,["seller_type","user_type","advertiser_type","account_type","author_type","owner_type","person_type"]).toLowerCase();
    const flags={owner:deepValues(raw,["is_owner","owner","private_person","is_private"],20),agent:deepValues(raw,["is_realtor","is_agent","realtor","agent","broker","agency"],30)};
    const truthy=arr=>arr.some(v=>v===true||v===1||String(v).toLowerCase()==="true");
    if(truthy(flags.owner)||/owner|собствен|власник|власниц/.test(explicit))return "owner";
    if(truthy(flags.agent)||/realtor|agent|broker|agency|риелтор|ріелтор|агент|маклер/.test(explicit))return "realtor";
    const text=[x?.title,x?.description,JSON.stringify(raw)].filter(Boolean).join(" ").toLowerCase();
    if(/без комисс|без коміс|от собствен|від власник|власник кварт|собственник/.test(text))return "owner";
    if(/риелтор|ріелтор|агентств|агент з нерух|broker|realtor/.test(text))return "realtor";
    return "unknown";
  };
  const sellerLabel=x=>sellerKind(x)==="owner"?(lang==="uk"?"Власник":lang==="en"?"Owner":"Собственник"):sellerKind(x)==="realtor"?(lang==="uk"?"Ріелтор":lang==="en"?"Realtor":"Риэлтор"):(lang==="uk"?"Не визначено":lang==="en"?"Not specified":"Не определено");
  const addToCrm=async x=>{
    if(x.origin==="crm"||crmMatch(x)){const current=crmMatch(x);if(current&&onOpenProperty)onOpenProperty(current);return;}
    const phone=contactPhone(x);
    const payload={
      agency_id:agencyId,title:x.title||x.complex_name||"Объект из аналитики",property_type:x.property_type||types[0],district:x.district||districts[0],status:"Актуален",
      price:Number(x.price||0),area:Number(x.area||0),floor:parseInt(x.floor)||null,owner_name:x.owner_name||"",owner_phone:phone,
      description:[x.description||"",x.source_name?`Источник: ${x.source_name}`:"",x.source_url?`Оригинал: ${x.source_url}`:""].filter(Boolean).join("\n\n"),
      property_manager_name:currentProfile?.full_name||currentProfile?.name||"",property_manager_email:currentProfile?.email||"",property_manager_phone:currentProfile?.phone||"",created_by_email:currentProfile?.email||""
    };
    let {data,error}=await supabase.from("properties").insert(payload).select().single();
    if(error&&/schema cache|column .* does not exist/i.test(error.message||"")){
      const safe={...payload};delete safe.agency_id;delete safe.created_by_email;({data,error}=await supabase.from("properties").insert(safe).select().single());
    }
    if(error){alert("Не удалось добавить объект в CRM: "+error.message);return;}
    const created={id:String(data.id),title:data.title||payload.title,type:data.property_type||payload.property_type,district:data.district||payload.district,status:data.status||"Актуален",price:data.price||payload.price,area:data.area||payload.area,floor:data.floor?String(data.floor):"",owner:data.owner_name||"",ownerPhone:data.owner_phone||"",description:data.description||payload.description,property_manager_name:data.property_manager_name||payload.property_manager_name,property_manager_email:data.property_manager_email||payload.property_manager_email,property_manager_phone:data.property_manager_phone||payload.property_manager_phone,created_by_email:data.created_by_email||payload.created_by_email,created_at:data.created_at||new Date().toISOString(),media:(x.photo_urls||[]).map(url=>({kind:"Фото",url}))};
    setAddedCrm(v=>({...v,[x._key]:created}));alert("Объект добавлен в CRM.");if(onOpenProperty)onOpenProperty(created);
  };
  const copyListing=async x=>{const text=[x.title,x.price?marketMoney(x.price,marketCurrency(x)):"",x.source_url].filter(Boolean).join(" · ");try{await navigator.clipboard.writeText(text);alert("Данные объявления скопированы.");}catch{alert(text);}};
  const shareListing=async x=>{const data={title:x.title||"Объект недвижимости",text:`${x.title||"Объект"}${x.price?` · ${marketMoney(x.price,marketCurrency(x))}`:""}`,url:x.source_url||undefined};if(navigator.share){try{await navigator.share(data);return;}catch{}}await copyListing(x);};
  const callListing=x=>{const phone=contactPhone(x);if(!phone)return alert("В источнике объявления номер телефона не передан.");window.location.href=`tel:${phone.replace(/[^+\d]/g,"")}`;};

  const districtCounts=filtered.reduce((m,x)=>{const k=x.district||x.city||"Без района";m[k]=(m[k]||0)+1;return m;},{});
  const topDistrict=Object.entries(districtCounts).sort((a,b)=>b[1]-a[1])[0]?.[0]||"—";
  const dayGroups=(statsCurrency?filtered.filter(x=>marketCurrency(x)===statsCurrency):[]).reduce((m,x)=>{const raw=getListingDate(x);const d=raw?String(raw).slice(0,10):"";if(!d)return m;(m[d]||(m[d]=[])).push(Number(x.price||0));return m;},{});
  const trend=Object.entries(dayGroups).sort((a,b)=>a[0].localeCompare(b[0])).slice(-14).map(([date,prices])=>{const valid=prices.filter(v=>v>0);return {date,avg:valid.length?Math.round(valid.reduce((a,b)=>a+b,0)/valid.length):0,count:prices.length};});
  const trendValues=trend.map(x=>x.avg).filter(Boolean),trendMax=Math.max(...trendValues,1);
  const districtTop=Object.entries(districtCounts).sort((a,b)=>b[1]-a[1]).slice(0,8),districtMax=Math.max(...districtTop.map(x=>x[1]),1);
  const newCount=filtered.filter(x=>{const raw=x.first_seen_at||x.published_at||x.created_at;if(!raw)return false;const ts=new Date(raw).getTime();return ts>=Date.now()-7*86400000;}).length;
  const inactiveCount=filtered.filter(x=>x.is_active===false||String(x.status||"").toLowerCase().includes("неактив")).length;
  const changePct=trend.length>1&&trend[0].avg>0?Math.round(((trend[trend.length-1].avg-trend[0].avg)/trend[0].avg)*1000)/10:0;
  const bargainCount=filtered.filter(x=>Number(x.price||0)>0&&avgPrice>0&&Number(x.price)<=avgPrice*.9).length;
  const aiFor=x=>{
    const reasons=[];const price=Number(x.price||0),area=Number(x.area||0),ppm=price>0&&area>0?price/area:0;
    if(avgPrice&&price&&price<=avgPrice*.9)reasons.push("Цена минимум на 10% ниже средней по выборке");
    if(avgM2&&ppm&&ppm<=avgM2*.9)reasons.push("Цена за м² ниже средней по выборке");
    if((x.district||x.city)===topDistrict)reasons.push("Объект находится в самом активном районе текущей выборки");
    const fl=parseInt(x.floor),tf=parseInt(x.total_floors);if(fl>1&&(!tf||fl<tf))reasons.push("Комфортный не первый этаж");
    if(x.origin==="crm")reasons.push("Объект уже находится во внутренней базе CRM");
    if(!reasons.length)reasons.push("Параметры близки к средним значениям текущей выборки");
    return {reasons,score:Math.min(96,48+reasons.length*12)};
  };

  const prepareSelectionEditor=async()=>{
    if(!selectionItems.length)return alert("Выбери хотя бы один объект.");
    setPreparingSelection(true);
    try{
      const items=[];
      for(const item of selectionItems){
        const enriched=await enrichAnalyticsPresentationItem(item);
        const validPhotos=await filterRenderableAnalyticsPhotos(extractPropertyPhotos(enriched));
        const description=withoutPresentationSource(enriched.description_uk||enriched.description||"",enriched.source_name);
        items.push({...enriched,title:cleanPresentationTitle(enriched.title)||"Объект недвижимости",description,description_uk:description,media:validPhotos,source_name:"",source_url:""});
      }
      setSelectionDraftItems(items);
      setSelectionEditorOpen(true);
    }catch(e){console.error(e);alert("Не удалось подготовить тексты презентации: "+(e?.message||e));}
    finally{setPreparingSelection(false);}
  };
  const updateSelectionDraft=(index,field,value)=>setSelectionDraftItems(items=>items.map((item,i)=>i===index?{...item,[field]:value,...(field==="description"?{description_uk:value}:{})}:item));

  const createSelection=async()=>{
    if(!selectionDraftItems.length)return alert("Сначала подготовь тексты презентации.");
    setCreatingSelection(true);
    try{
      if(selectionUrl?.startsWith("blob:"))URL.revokeObjectURL(selectionUrl);
      if(selectionDownloadUrl?.startsWith("blob:"))URL.revokeObjectURL(selectionDownloadUrl);
      const brand=loadAgencyBrand(currentProfile?.agency_id),txt=vipPresentationText(selectionLang),pages=[];
      const pal=presentationPalette(selectionVisual,theme);
      const items=selectionDraftItems.map(item=>({...item,title:cleanPresentationTitle(item.title)||"Объект недвижимости",description:withoutPresentationSource(item.description,""),description_uk:withoutPresentationSource(item.description_uk||item.description,"")}));

      // Обложка — тот же стиль, что в разделе «Вторичка».
      const cover=document.createElement("canvas");cover.width=1240;cover.height=1754;let c=cover.getContext("2d");
      c.fillStyle=pal.bg;c.fillRect(0,0,1240,1754);
      const firstHero=extractPropertyPhotos(items[0])[0];
      if(firstHero){c.globalAlpha=selectionVisual==="luxuryDark"?.34:.20;await drawAnalyticsPresentationImage(c,firstHero.url,380,0,860,1754,"cover");c.globalAlpha=1;}
      c.fillStyle=pal.accent;c.fillRect(72,150,4,1300);
      if(brand.logo_url)await drawRemoteImage(c,brand.logo_url,95,75,180,100,"contain");
      c.fillStyle=selectionVisual==="luxuryDark"?"#fff":pal.ink;c.font='600 30px Arial';c.fillText(agencyName||"CRM Real Estate",95,245);
      c.font='bold 68px Georgia, "Times New Roman", serif';pdfDrawWrapped(c,txt.selection,95,430,980,78);
      c.fillStyle=pal.accent;c.font='bold 25px Arial';c.fillText(`${txt.date}: ${formatPresentationDate(selectionLang)}`,95,700);
      if(selectionClient.trim()){c.fillStyle=selectionVisual==="luxuryDark"?"#eee":pal.muted;c.font='24px Arial';c.fillText(txt.prepared,95,805);c.fillStyle=selectionVisual==="luxuryDark"?"#fff":pal.ink;c.font='bold 46px Georgia, "Times New Roman", serif';pdfDrawWrapped(c,selectionClient.trim(),95,875,920,55);}
      c.fillStyle=selectionVisual==="luxuryDark"?"#ddd":pal.muted;c.font='22px Arial';c.fillText(`${items.length} ${selectionLang==="en"?"properties":selectionLang==="uk"?"об'єктів":"объектов"}`,95,1110);
      pages.push({bytes:pdfDataUrlToBytes(cover.toDataURL("image/jpeg",.96)),width:1240,height:1754});

      for(let index=0;index<items.length;index++){
        const p=items[index],photo=extractPropertyPhotos(p)[0];
        const canvas=document.createElement("canvas");canvas.width=1240;canvas.height=1754;const ctx=canvas.getContext("2d");ctx.fillStyle=pal.paper;ctx.fillRect(0,0,1240,1754);
        ctx.fillStyle=pal.accent;ctx.font='bold 78px Georgia, "Times New Roman", serif';ctx.fillText(String(index+1).padStart(2,"0"),80,115);
        const cleanTitle=cleanPresentationTitle(p.title)||`${txt.property} ${index+1}`;
        ctx.fillStyle=pal.ink;ctx.font='bold 36px Georgia, "Times New Roman", serif';const titleBottom=pdfDrawWrapped(ctx,cleanTitle,220,65,900,40);
        const heroY=Math.max(225,titleBottom+70),heroH=Math.max(420,915-heroY);
        ctx.fillStyle=pal.muted;ctx.font='20px Arial';ctx.fillText(`${formatPresentationDate(selectionLang)} · ${index+1}/${items.length}`,220,heroY-25);
        if(photo)await drawAnalyticsPresentationImage(ctx,photo.url,80,heroY,1080,heroH,"cover");
        else{ctx.fillStyle="#eee8dc";ctx.fillRect(80,heroY,1080,heroH);ctx.fillStyle=pal.muted;ctx.font='bold 28px Arial';ctx.textAlign="center";ctx.fillText("Фото не передано рекламной площадкой",620,heroY+heroH/2);ctx.textAlign="left";}
        const roomLabel=selectionLang==="uk"?"Кімнати":selectionLang==="en"?"Rooms":"Комнаты";
        const complexLabel=selectionLang==="uk"?"Житловий комплекс":selectionLang==="en"?"Residential complex":"Жилой комплекс";
        const floorsLabel=selectionLang==="uk"?"Поверховість":selectionLang==="en"?"Total floors":"Этажность";
        const conditionLabel=selectionLang==="uk"?"Ремонт":selectionLang==="en"?"Condition":"Ремонт";
        const specs=[[txt.price,money(p.price)],[txt.area,p.area?`${p.area} м²`:"—"],[roomLabel,p.rooms||"—"],[txt.floor,p.floor||"—"],[floorsLabel,p.total_floors||"—"],[txt.district,p.district||"—"],[txt.type,p.type||"—"],[complexLabel,p.complex_name||"—"],[conditionLabel,p.condition||"—"]];
        specs.forEach(([a,b],i)=>{const col=i%5,row=Math.floor(i/5),x=80+col*216,y=955+row*118;ctx.strokeStyle=pal.line;ctx.lineWidth=1;ctx.strokeRect(x,y,196,100);ctx.fillStyle=pal.muted;ctx.font='14px Arial';ctx.fillText(a,x+13,y+27);ctx.fillStyle=pal.ink;ctx.font='bold 18px Arial';pdfDrawWrapped(ctx,String(b),x+13,y+58,168,22);});
        ctx.fillStyle=pal.ink;ctx.font='bold 31px Georgia, "Times New Roman", serif';ctx.fillText(txt.about,80,1235);
        const preview=cleanPresentationDescription((selectionLang==="uk"?(p.description_uk||p.description):p.description)||txt.noDescription);
        ctx.fillStyle=pal.muted;ctx.font='21px Georgia, "Times New Roman", serif';const allDescriptionLines=canvasTextLines(ctx,preview,1080);const teaserLines=allDescriptionLines.length>8?[]:allDescriptionLines.slice(0,7);let ty=1290;teaserLines.forEach(line=>{ctx.fillText(line,80,ty);ty+=33;});
        pages.push({bytes:pdfDataUrlToBytes(canvas.toDataURL("image/jpeg",.97)),width:1240,height:1754});
        const previewLineCount=allDescriptionLines.length;
        if(previewLineCount>8)addFullDescriptionPages(pages,{text:preview,title:cleanTitle,agencyName,brand,themeId:theme,visualId:selectionVisual,lang:selectionLang});
        await addLuxuryGalleryPage(pages,{photos:extractPropertyPhotos(p),title:cleanTitle,agencyName,themeId:theme,visualId:selectionVisual,lang:selectionLang,drawImage:drawAnalyticsPresentationImage,compact:true});
      }

      if(items.length>1)addSelectionComparisonPages(pages,{items,themeId:theme,visualId:selectionVisual,lang:selectionLang,agencyName});

      // Финальная страница — без внешних ссылок и служебных фраз.
      const endp=document.createElement("canvas");endp.width=1240;endp.height=1754;const ec=endp.getContext("2d");ec.fillStyle=pal.bg;ec.fillRect(0,0,1240,1754);ec.fillStyle=pal.accent;ec.fillRect(72,150,4,1300);
      if(brand.logo_url)await drawRemoteImage(ec,brand.logo_url,92,80,210,115,"contain");
      ec.fillStyle=selectionVisual==="luxuryDark"?"#fff":pal.ink;ec.font='bold 55px Georgia, "Times New Roman", serif';pdfDrawWrapped(ec,txt.contact,92,470,1000,64);
      ec.fillStyle=pal.accent;ec.font='bold 36px Georgia, "Times New Roman", serif';pdfDrawWrapped(ec,managerDisplayName(currentProfile),92,720,1000,44);
      ec.fillStyle=selectionVisual==="luxuryDark"?"#fff":pal.ink;ec.font='25px Arial';pdfDrawWrapped(ec,currentProfile?.phone||currentProfile?.email||"",92,800,1000,34);ec.font='30px Georgia, "Times New Roman", serif';pdfDrawWrapped(ec,txt.thanks,92,1080,1000,40);
      pages.push({bytes:pdfDataUrlToBytes(endp.toDataURL("image/jpeg",.96)),width:1240,height:1754});

      const blob=buildPdfFromCanvasPages(pages),localUrl=URL.createObjectURL(blob);setSelectionDownloadUrl(localUrl);
      const uploaded=await uploadToFirstAvailableBucket(["presentations"],`selections/${Date.now()}-analytics-vip-selection.pdf`,blob,{upsert:false,contentType:"application/pdf",cacheControl:"3600"});
      setSelectionUrl(uploaded?.publicUrl||localUrl);setSelectionEditorOpen(false);alert(uploaded?.publicUrl?"VIP PDF-подборка создана.":"VIP PDF-подборка создана локально.");
    }catch(e){console.error(e);alert("Не удалось создать подборку: "+(e?.message||e));}
    finally{setCreatingSelection(false);}
  };

  const resetFilters=()=>{setLivePage(1);setActiveSourceTab("ALL");setPeriod("30");setDateFrom("");setDateTo("");setCountry("Все");setRegion("Все");setCity("Все");setDistrictFilter("Все");setComplexFilter("Все");setPropertyKindFilter("Все");setSellerFilter("Все");setConditionFilter("Все");setFloorFrom("");setFloorTo("");setLandAreaFrom("");setLandAreaTo("");setVerifiedOnly(false);setNoDuplicates(false);setGroupDuplicates(true);setConstructionYearFrom("");setConstructionYearTo("");setGovernmentPrograms([]);setDealFilter("Все");setSelectedSources([]);setSourceCountry("Все");setSearchQuery("");setRoomsFilter("Все");setPriceFrom("");setPriceTo("");setAreaFrom("");setAreaTo("");setPriceSort("none");setSelected([]);clearAnalyticsMarketCache();};

  const filterBox={padding:16,border:"1px solid rgba(148,163,184,.24)",borderRadius:18,background:"rgba(255,255,255,.72)"};
  const actionStyle={minHeight:46,fontWeight:800,borderRadius:14};
  const resultPageSize=marketView==="list"?100:40;
  const resultPages=Math.max(1,Math.ceil(filtered.length/resultPageSize));
  const safeResultPage=Math.min(resultPage,resultPages);
  const renderedFiltered=filtered.slice((safeResultPage-1)*resultPageSize,safeResultPage*resultPageSize);
  const pageFrom=filtered.length?((safeResultPage-1)*resultPageSize+1):0;
  const pageTo=Math.min(safeResultPage*resultPageSize,filtered.length);

  useEffect(()=>{setResultPage(1);},[marketView,priceSort]);

  return <main className="screen">
    <div className="card dark" style={{padding:26,borderRadius:24}}>
      <div className="row" style={{alignItems:"center",gap:18}}>
        <section><div style={{fontSize:13,fontWeight:900,letterSpacing:1.8,opacity:.7}}>MARKET INTELLIGENCE</div><h2 style={{fontSize:32,margin:"7px 0"}}>📊 Аналитика рынка</h2><p style={{margin:0}}>DIM.RIA • OLX • RIELTOR.UA • ЛУН • REM • MyHome.ge • SS.ge • Korter.ge • международные порталы • CRM</p></section>
        <Button onClick={syncMarket} disabled={syncingMarket} style={{...actionStyle,minWidth:190}}>{syncingMarket?"Обновляем…":activeSourceTab==="ALL"?"↻ Обновить весь рынок":activeSourceTab==="CRM"?"↻ Обновить CRM":`↻ Обновить ${activeSourceMeta.label}`}</Button>
      </div>
    </div>

    <div className="card" style={{padding:14,borderRadius:20}}>
      <div className="row" style={{margin:"0 2px 10px",gap:10,flexWrap:"wrap"}}>
        <section><b>Рекламные площадки: {tabsCountry}</b><div className="muted" style={{fontSize:12,marginTop:3}}>При смене страны вкладки автоматически показывают её источники.</div></section>
        <span className="badge gold">{countrySourceTabs.length} площадок</span>
      </div>
      <div style={{display:"flex",gap:9,overflowX:"auto",paddingBottom:2}}>
        {analyticsSourceTabs.map(tab=>{
          const active=activeSourceTab===tab.id;
          return <button key={tab.id}
            onClick={()=>{setActiveSourceTab(tab.id);setSelectedSources([]);setResultPage(1);}}
            style={{
              flex:"0 0 auto",minHeight:44,padding:"10px 16px",borderRadius:14,
              border:active?"2px solid var(--accent)":"1px solid rgba(148,163,184,.28)",
              background:active?"var(--accent)":"var(--card)",
              color:active?"#111827":"var(--text)",fontWeight:900,cursor:"pointer"
            }}>
            {tab.label}
          </button>
        })}
      </div>
      <p className="muted" style={{margin:"9px 2px 0"}}>
        {activeSourceTab==="ALL"
          ?"Сводная аналитика по всем подключённым источникам."
          :activeSourceTab==="CRM"
            ?"Показываются только внутренние объекты CRM."
            :`Показываются только объявления ${activeSourceMeta.label}. Запрос к Supabase не загружает остальные площадки.`}
      </p>
    </div>

    {marketError&&<div className="card" style={{border:"1px solid #ef4444"}}><b>Ошибка загрузки рынка</b><p>{marketError}</p></div>}
    {placeholderMarketListings.length>0&&<div className="card amber" style={{borderRadius:18}}><b>Контроль качества импорта</b><p className="muted" style={{marginBottom:0}}>Скрыто служебных строк источников: <b>{placeholderMarketListings.length}</b>. Они больше не считаются объявлениями, потому что в них нет конкретной карточки объекта, цены/параметров или прямой ссылки. Это устраняет ложное «найдено», которое раньше показывало общий URL DIM.RIA как объект.</p></div>}

    <div className="card" style={{padding:22,borderRadius:24}}>
      <div className="row"><section><h3 style={{margin:0}}>Период анализа</h3><p className="muted" style={{margin:"5px 0 0"}}>Все показатели и объявления ниже пересчитываются по выбранному периоду.</p></section><Button variant="soft" onClick={resetFilters}>Сбросить фильтры</Button></div>
      <div className="chips" style={{marginTop:16}}>
        {[["1","Сегодня"],["7","7 дней"],["30","30 дней"],["90","90 дней"],["all","Всё время"],["custom","Свой период"]].map(([v,l])=><button key={v} className={cn("chip",period===v&&"active")} style={{padding:"11px 18px",fontWeight:800}} onClick={()=>setPeriod(v)}>{l}</button>)}
      </div>
      {period==="custom"&&<div className="grid2" style={{marginTop:14}}><Field label="Дата от"><input className="input" type="date" value={dateFrom} onChange={e=>setDateFrom(e.target.value)}/></Field><Field label="Дата до"><input className="input" type="date" value={dateTo} onChange={e=>setDateTo(e.target.value)}/></Field></div>}
    </div>

    <div className="card" style={{padding:22,borderRadius:24}}>
      <div className="row" style={{alignItems:"end",gap:14,marginBottom:16}}><section style={{flex:1}}><h3 style={{margin:"0 0 5px"}}>Фильтры рынка</h3><p className="muted" style={{margin:0}}>Поиск работает по названию, ЖК, городу, району, источнику, цене и описанию.</p></section><div style={{minWidth:"min(100%,420px)",flex:"0 1 520px"}}><Field label="Быстрый поиск по объявлениям"><input className="input" value={searchQuery} onChange={e=>setSearchQuery(e.target.value)} placeholder="Например: Аркадия 2 комнаты DIM.RIA"/></Field></div></div>
      <div className="grid4">
        <div style={filterBox}><Field label="Страна"><select className="input" value={country} onChange={e=>{const next=e.target.value;setCountry(next);setRegion("Все");setCity("Все");setDistrictFilter("Все");setComplexFilter("Все");setSelectedSources([]);setSourceCountry(next==="Все"?"Все":next);setActiveSourceTab("ALL");setResultPage(1);}}>{countries.map(x=><option key={x} value={x}>{geoDisplay(x)}</option>)}</select></Field></div>
        <div style={filterBox}><Field label="Область / регион"><select className="input" value={region} onChange={e=>{setRegion(e.target.value);setCity("Все");setDistrictFilter("Все");setComplexFilter("Все");}}>{regions.map(x=><option key={x} value={x}>{geoDisplay(x)}</option>)}</select></Field></div>
        <div style={filterBox}><Field label="Город"><select className="input" value={city} onChange={e=>{setCity(e.target.value);setDistrictFilter("Все");setComplexFilter("Все");}}>{cities.map(x=><option key={x} value={x}>{geoDisplay(x)}</option>)}</select></Field></div>
        <div style={filterBox}><Field label={officialDistricts.length?"Официальный район города":"Район / локация источника"}><select className="input" value={districtFilter} onChange={e=>setDistrictFilter(e.target.value)}>{districtsMarket.map(x=><option key={x} value={x}>{geoDisplay(x)}</option>)}</select></Field></div>
        <div style={filterBox}><Field label={`ЖК выбранного города · ${Math.max(0,complexes.length-1)}`}><input className="input" list="analytics-complexes" value={complexFilter==="Все"?"":complexFilter} onChange={e=>setComplexFilter(e.target.value.trim()||"Все")} placeholder="Все ЖК или начните вводить название"/><datalist id="analytics-complexes">{complexes.filter(x=>x!=="Все").map(x=><option key={x} value={x}/>)}</datalist></Field></div>
        <div style={filterBox}><Field label="Тип недвижимости"><select className="input" value={propertyKindFilter} onChange={e=>{setPropertyKindFilter(e.target.value);setResultPage(1);}}>{propertyKinds.map(x=><option key={x}>{x}</option>)}</select></Field></div>
        <div style={filterBox}><Field label="Тип сделки"><select className="input" value={dealFilter} onChange={e=>setDealFilter(e.target.value)}><option>Все</option><option>Продажа</option><option>Аренда</option></select></Field></div>
        <div style={{...filterBox,gridColumn:"span 2"}}><Field label="Источники · страна источника + несколько площадок"><div style={{display:"flex",gap:8,marginBottom:10,flexWrap:"wrap"}}><select className="input" style={{maxWidth:260}} value={sourceCountry} onChange={e=>{setSourceCountry(e.target.value);setSelectedSources([]);setActiveSourceTab("ALL");setResultPage(1);}}>{sourceCountryOptions.map(x=><option key={x}>{x}</option>)}</select>{selectedSources.length>0&&<button className="chip" onClick={()=>setSelectedSources([])}>Очистить ({selectedSources.length})</button>}</div><div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(155px,1fr))",gap:8,maxHeight:190,overflow:"auto",padding:8,border:"1px solid rgba(148,163,184,.2)",borderRadius:14}}>{sourceOptions.map(name=>{const cnt=sourceLiveCount(name),connected=sourceConnected(name);return <label key={name} title={connected?"Источник подключён":"Источник есть в каталоге, но ещё не подключён"} style={{cursor:"pointer",display:"flex",alignItems:"center",gap:9,minHeight:44,padding:"10px 12px",borderRadius:12,border:selectedSources.includes(name)?"2px solid var(--accent)":"1px solid color-mix(in srgb,var(--accent) 28%,#d1d5db)",background:selectedSources.includes(name)?"color-mix(in srgb,var(--accent) 18%,var(--card))":"var(--card)",color:"var(--text)",fontWeight:850,lineHeight:1.2,whiteSpace:"normal",opacity:connected||cnt?1:.7}}><input type="checkbox" style={{width:18,height:18,accentColor:"var(--accent)",flex:"0 0 auto"}} checked={selectedSources.includes(name)} onChange={()=>setSelectedSources(v=>v.includes(name)?v.filter(x=>x!==name):[...v,name])}/><span style={{display:"block",color:"var(--text)",fontWeight:850}}>{name} <span style={{opacity:.6,fontWeight:700}}>({cnt})</span>{connected&&<span style={{marginLeft:5,color:"var(--accent)"}}>●</span>}</span></label>})}</div></Field></div>
        <div style={filterBox}><Field label="Комнаты"><select className="input" value={roomsFilter} onChange={e=>setRoomsFilter(e.target.value)}><option>Все</option><option>1</option><option>2</option><option>3</option><option>4+</option></select></Field></div>
        <div style={filterBox}><Field label="Продавец"><select className="input" value={sellerFilter} onChange={e=>setSellerFilter(e.target.value)}><option>Все</option><option>Собственник</option><option>Риэлтор</option></select></Field></div>
        <div style={filterBox}><Field label="Состояние / ремонт"><select className="input" value={conditionFilter} onChange={e=>setConditionFilter(e.target.value)}><option>Все</option><option>С ремонтом</option><option>Без ремонта</option><option>Не указано</option></select></Field></div>
      </div>
      <div className="grid4" style={{marginTop:12}}>
        <Field label="Цена от"><input className="input" type="number" value={priceFrom} onChange={e=>setPriceFrom(e.target.value)} placeholder="0"/></Field>
        <Field label="Цена до"><input className="input" type="number" value={priceTo} onChange={e=>setPriceTo(e.target.value)} placeholder="без лимита"/></Field>
        <Field label="Площадь от, м²"><input className="input" type="number" value={areaFrom} onChange={e=>setAreaFrom(e.target.value)} placeholder="0"/></Field>
        <Field label="Площадь до, м²"><input className="input" type="number" value={areaTo} onChange={e=>setAreaTo(e.target.value)} placeholder="без лимита"/></Field>
      </div>
      <div className="grid4" style={{marginTop:12}}>
        <Field label="Этаж от"><input className="input" type="number" min="0" value={floorFrom} onChange={e=>setFloorFrom(e.target.value)} placeholder="любой"/></Field>
        <Field label="Этаж до"><input className="input" type="number" min="0" value={floorTo} onChange={e=>setFloorTo(e.target.value)} placeholder="любой"/></Field>
        <Field label="Участок от, соток"><input className="input" type="number" min="0" step="0.1" value={landAreaFrom} onChange={e=>setLandAreaFrom(e.target.value)} placeholder="0"/></Field>
        <Field label="Участок до, соток"><input className="input" type="number" min="0" step="0.1" value={landAreaTo} onChange={e=>setLandAreaTo(e.target.value)} placeholder="без лимита"/></Field>
      </div>
      <div className="grid4" style={{marginTop:12}}>
        <Field label="Год постройки от"><input className="input" type="number" min="1800" max="2100" value={constructionYearFrom} onChange={e=>setConstructionYearFrom(e.target.value)} placeholder="любой"/></Field>
        <Field label="Год постройки до"><input className="input" type="number" min="1800" max="2100" value={constructionYearTo} onChange={e=>setConstructionYearTo(e.target.value)} placeholder="любой"/></Field>
        <div style={{...filterBox,gridColumn:"span 2"}}><Field label="Государственные программы · можно выбрать несколько"><div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(190px,1fr))",gap:8}}>{["єОселя","єВідновлення / сертификат","Постановление №280","Постановление №719","Постановление №1176","Другие госпрограммы"].map(program=><label key={program} className={cn("chip","govChip",governmentPrograms.includes(program)&&"active")} style={{justifyContent:"flex-start"}}><input type="checkbox" checked={governmentPrograms.includes(program)} onChange={()=>setGovernmentPrograms(current=>current.includes(program)?current.filter(x=>x!==program):[...current,program])}/>{program}</label>)}</div></Field></div>
      </div>
      <div className="chips" style={{marginTop:14}}>
        <label className={cn("chip",verifiedOnly&&"active")}><input type="checkbox" checked={verifiedOnly} onChange={e=>setVerifiedOnly(e.target.checked)}/> Только проверенные объявления</label>
        <label className={cn("chip",groupDuplicates&&"active")}><input type="checkbox" checked={groupDuplicates} onChange={e=>setGroupDuplicates(e.target.checked)}/> Сгруппировать дубли</label>
        <label className={cn("chip",noDuplicates&&"active")}><input type="checkbox" checked={noDuplicates} onChange={e=>setNoDuplicates(e.target.checked)}/> Скрыть дубли</label>
      </div>
    </div>

    <div className="card" style={{padding:"14px 18px",borderRadius:18,display:"flex",gap:8,alignItems:"center",flexWrap:"wrap"}}>
      <b>Активная выборка:</b>
      {activeSourceTab!=="ALL"&&<span className="badge gold">Источник: {activeSourceMeta.label}</span>}
      {searchQuery&&<span className="badge">🔎 {searchQuery}</span>}
      {country!=="Все"&&<span className="badge">🌍 {country}</span>}
      {region!=="Все"&&<span className="badge">Регион: {region}</span>}
      {city!=="Все"&&<span className="badge">Город: {city}</span>}
      {districtFilter!=="Все"&&<span className="badge">Район: {districtFilter}</span>}
      {complexFilter!=="Все"&&<span className="badge gold">ЖК: {complexFilter}</span>}
      {propertyKindFilter!=="Все"&&<span className="badge gold">Тип: {propertyKindFilter}</span>}
      {sellerFilter!=="Все"&&<span className="badge">Продавец: {sellerFilter}</span>}
      {conditionFilter!=="Все"&&<span className="badge">Состояние: {conditionFilter}</span>}
      {verifiedOnly&&<span className="badge">✓ Проверенные</span>}
      {constructionYearFrom&&<span className="badge">Дом от {constructionYearFrom} г.</span>}
      {constructionYearTo&&<span className="badge">Дом до {constructionYearTo} г.</span>}
      {governmentPrograms.map(program=><span className="badge gold" key={program}>{program}</span>)}
      {groupDuplicates&&!noDuplicates&&<span className="badge">Дубли сгруппированы</span>}
      {noDuplicates&&<span className="badge">Без дублей</span>}
      {sourceCountry!=="Все"&&<span className="badge">Источники: {sourceCountry}</span>}
      {selectedSources.map(x=><span className="badge gold" key={x}>{x}</span>)}
      {!searchQuery&&country==="Все"&&region==="Все"&&city==="Все"&&districtFilter==="Все"&&sourceCountry==="Все"&&!selectedSources.length&&activeSourceTab==="ALL"&&<span className="muted">без географических ограничений</span>}
    </div>

    <div className="stats" style={{marginBottom:16}}>
      <div className="stat" style={{minHeight:110}}><span>НАЙДЕНО НА САЙТАХ</span><b style={{fontSize:34}}>{liveTotal||filtered.length}</b><small className="muted">Карточек загружено сейчас: {filtered.length}</small></div>
      <div className="stat" style={{minHeight:110}}><span>СРЕДНЯЯ ЦЕНА</span><b style={{fontSize:28}}>{avgPrice?marketMoney(avgPrice,statsCurrency):priceCurrencies.length>1?"Смешанные валюты":"—"}</b></div>
      <div className="stat" style={{minHeight:110}}><span>СРЕДНЯЯ ЦЕНА / М²</span><b style={{fontSize:28}}>{avgM2?`${marketMoney(avgM2,statsCurrency)} / м²`:priceCurrencies.length>1?"Смешанные валюты":"—"}</b></div>
      <div className="stat" style={{minHeight:110}}><span>НОВЫХ ЗА 7 ДНЕЙ</span><b style={{fontSize:34}}>{newCount}</b></div>
      <div className="stat" style={{minHeight:110}}><span>ИСЧЕЗЛО / НЕАКТИВНО</span><b style={{fontSize:34}}>{inactiveCount}</b></div>
      {sourceSummary.map(([name,count,exact])=><div className="stat" key={name} style={{minHeight:110}}><span>{name}</span><b style={{fontSize:34}}>{exact?count:`≈ ${count}`}</b></div>)}
    </div>
    {liveSourceMeta.some(x=>x.error)&&<div className="card" style={{padding:"12px 16px",borderRadius:18,marginBottom:16}}>
      <small className="muted">Площадки без результатов по этому запросу:</small>
      {liveSourceMeta.filter(x=>x.error).map(x=><div key={x.source} style={{display:"flex",gap:8,flexWrap:"wrap",alignItems:"baseline",marginTop:6}}>
        <b style={{fontSize:13}}>{x.source}</b><small className="muted">{x.error}</small>
        {x.url&&<a href={x.url} target="_blank" rel="noreferrer" style={{fontSize:13}}>Открыть поиск на площадке</a>}
      </div>)}
    </div>}

    <div className="grid2" style={{marginBottom:16}}>
      <div className="card" style={{padding:22,borderRadius:24}}><div className="row"><section><h3 style={{margin:0}}>Динамика средней цены</h3><p className="muted">Последние доступные дни в выбранном периоде</p></section><span className={cn("badge",changePct<=0?"gold":"")}>{changePct>0?"+":""}{changePct}%</span></div>
        {trend.length?<div style={{height:220,display:"flex",alignItems:"end",gap:8,paddingTop:20}}>{trend.map(x=><div key={x.date} title={`${x.date}: ${marketMoney(x.avg,statsCurrency)}`} style={{flex:1,minWidth:8,height:`${Math.max(8,(x.avg/trendMax)*180)}px`,borderRadius:"8px 8px 3px 3px",background:"linear-gradient(180deg,var(--accent2),var(--accent))",position:"relative"}}><span style={{position:"absolute",bottom:-24,left:"50%",transform:"translateX(-50%)",fontSize:9,opacity:.65,whiteSpace:"nowrap"}}>{x.date.slice(5)}</span></div>)}</div>:<p className="muted">Недостаточно данных для графика.</p>}
      </div>
      <div className="card" style={{padding:22,borderRadius:24}}><h3 style={{marginTop:0}}>Предложения по районам</h3>{districtTop.length?districtTop.map(([name,count])=><div key={name} style={{margin:"13px 0"}}><div className="row" style={{fontSize:13}}><b>{name}</b><span>{count}</span></div><div style={{height:9,borderRadius:99,background:"var(--soft)",overflow:"hidden"}}><div style={{height:"100%",width:`${Math.max(5,(count/districtMax)*100)}%`,background:"linear-gradient(90deg,var(--accent),var(--accent2))",borderRadius:99}}/></div></div>):<p className="muted">Нет данных по районам.</p>}</div>
    </div>

    <div className="card amber" style={{padding:24,borderRadius:24,marginBottom:16}}><div className="row"><section><div style={{fontSize:12,fontWeight:900,letterSpacing:1.5,opacity:.65}}>AI MARKET SUMMARY</div><h3 style={{margin:"6px 0"}}>✦ Автоматический обзор рынка</h3></section><span className="badge gold">{filtered.length} объектов</span></div><p style={{fontSize:16,lineHeight:1.65,marginBottom:0}}>За выбранный период в выборке <b>{filtered.length}</b> объектов. Средняя цена — <b>{avgPrice?marketMoney(avgPrice,statsCurrency):priceCurrencies.length>1?"смешанные валюты":"не рассчитана"}</b>, средняя цена за м² — <b>{avgM2?`${marketMoney(avgM2,statsCurrency)} / м²`:priceCurrencies.length>1?"смешанные валюты":"не рассчитана"}</b>. {trend.length>1?<>Средняя цена изменилась на <b>{changePct>0?"+":""}{changePct}%</b>. </>:null}Больше всего предложений сейчас в локации <b>{topDistrict}</b>. Объектов минимум на 10% дешевле средней цены: <b>{bargainCount}</b>.</p></div>

    {selected.length>0&&<div className="card" style={{padding:22,borderRadius:24,border:"2px solid var(--accent)"}}>
      <div className="row"><section><h3 style={{margin:0}}>✨ VIP-подборка из аналитики</h3><p className="muted">{selected.length} объект(ов) выбрано. Можно смешивать внешние объявления и объекты из CRM.</p></section><Button variant="soft" onClick={()=>setSelected([])}>Очистить</Button></div>
      <div className="grid4">
        <Field label="Клиент из CRM"><select className="input" value={selectionClientId} onChange={e=>{const id=e.target.value;setSelectionClientId(id);const c=(leads||[]).find(x=>String(x.id)===String(id));if(c){setSelectionClient(c.name||"");setSelectionClientPhone(c.phone||"");setSelectionClientEmail(c.email||"");}}}><option value="">Выбрать клиента...</option>{(leads||[]).map(c=><option key={c.id} value={c.id}>{c.name||"Без имени"} · {c.phone||"без телефона"}</option>)}</select></Field>
        <Field label="Имя клиента"><input className="input" value={selectionClient} onChange={e=>setSelectionClient(e.target.value)} placeholder="Имя для презентации"/></Field>
        <Field label="Язык"><select className="input" value={selectionLang} onChange={e=>setSelectionLang(e.target.value)}><option value="ru">Русский</option><option value="uk">Українська</option><option value="en">English</option></select></Field>
        <Field label="Визуал"><select className="input" value={selectionVisual} onChange={e=>setSelectionVisual(e.target.value)}>{presentationVisualOptions.map(x=><option key={x.id} value={x.id}>{x.label}</option>)}</select></Field>
      </div>
      <div className="grid3" style={{marginTop:10}}>
        <Field label="Телефон"><input className="input" value={selectionClientPhone} onChange={e=>setSelectionClientPhone(e.target.value)}/></Field>
        <Field label="Email"><input className="input" value={selectionClientEmail} onChange={e=>setSelectionClientEmail(e.target.value)}/></Field>
        <label className="chip" style={{alignSelf:"end",minHeight:48}}><input type="checkbox" checked={selectionComparison} onChange={e=>setSelectionComparison(e.target.checked)}/> Сравнительная таблица</label>
      </div>
      <Button className="full" style={{...actionStyle,marginTop:14}} disabled={preparingSelection||creatingSelection} onClick={prepareSelectionEditor}>{preparingSelection?"Подготавливаем тексты и фото…":`Подготовить и отредактировать презентацию (${selected.length})`}</Button>
    </div>}

    {selectionEditorOpen&&<Modal wide onClose={()=>!creatingSelection&&setSelectionEditorOpen(false)}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",gap:16,marginBottom:14}}>
        <section><h2 style={{margin:"0 0 6px"}}>Редактирование презентации</h2><p className="muted" style={{margin:0}}>Проверьте название и описание каждого объекта. Эти изменения попадут только в PDF и не изменят объявления или CRM.</p></section>
        <Button variant="soft" disabled={creatingSelection} onClick={()=>setSelectionEditorOpen(false)}>Закрыть</Button>
      </div>
      <div style={{display:"grid",gap:14,maxHeight:"62vh",overflowY:"auto",paddingRight:6}}>
        {selectionDraftItems.map((item,index)=><div className="card" key={`presentation-draft-${index}`} style={{padding:18,borderRadius:18}}>
          <div style={{fontWeight:900,marginBottom:10}}>Объект {index+1}</div>
          <Field label="Название в презентации"><input className="input" value={item.title||""} onChange={e=>updateSelectionDraft(index,"title",e.target.value)} /></Field>
          <div style={{height:10}}/>
          <Field label="Описание в презентации"><textarea className="input" style={{minHeight:170,resize:"vertical",lineHeight:1.5}} value={item.description||""} onChange={e=>updateSelectionDraft(index,"description",e.target.value)} placeholder="Введите описание объекта для клиента"/></Field>
        </div>)}
      </div>
      <div style={{display:"flex",gap:10,justifyContent:"flex-end",marginTop:16,flexWrap:"wrap"}}>
        <Button variant="soft" disabled={creatingSelection} onClick={()=>setSelectionEditorOpen(false)}>Отмена</Button>
        <Button disabled={creatingSelection} onClick={createSelection}>{creatingSelection?"Формируем PDF…":"Сформировать презентацию"}</Button>
      </div>
    </Modal>}

    {selectionUrl&&<div className="card presentationSendPanel" style={{padding:22,borderRadius:24}}>
      <h3 style={{marginTop:0}}>Подборка готова</h3>
      <div className="grid4">
        <Button className="full sendWhatsApp" onClick={()=>openWhatsAppPresentation({phone:selectionClientPhone,url:selectionUrl,lang:selectionLang,agencyName,clientName:selectionClient,isSelection:true})}>WhatsApp</Button>
        <Button className="full sendViber" onClick={()=>openViberPresentation({phone:selectionClientPhone,url:selectionUrl,lang:selectionLang,agencyName,clientName:selectionClient,isSelection:true})}>Viber</Button>
        <Button className="full sendEmail" onClick={()=>openEmailPresentation({email:selectionClientEmail,url:selectionUrl,lang:selectionLang,agencyName,clientName:selectionClient,isSelection:true})}>Email</Button>
        <Button className="full sendShare" onClick={()=>nativeSharePresentation({url:selectionUrl,downloadUrl:selectionDownloadUrl,lang:selectionLang,agencyName,clientName:selectionClient,isSelection:true})}>Поделиться</Button>
      </div>
      <a className="btn primary full" style={{marginTop:10}} href={selectionDownloadUrl||selectionUrl} download={`CRM-analytics-selection-${new Date().toISOString().slice(0,10)}.pdf`}>Скачать PDF-подборку</a>
    </div>}

    <div className="row" style={{margin:"20px 0 10px",gap:12,flexWrap:"wrap"}}><section><h3 style={{margin:0}}>Объявления рынка</h3><p className="muted">{loadingMarket?"Загрузка…":`${filtered.length} карточек · страница сайтов ${livePage} из ${maxLivePages} · на экране ${pageFrom}–${pageTo}`}</p></section><div style={{display:"flex",gap:8,flexWrap:"wrap",alignItems:"center"}}><Button variant="soft" disabled={loadingMarket||livePage<=1} onClick={()=>{setResultPage(1);setLivePage(p=>Math.max(1,p-1));}}>‹ Предыдущая страница сайтов</Button><span className="chip" style={{minHeight:42,display:"inline-flex",alignItems:"center",fontWeight:900}}>Страница сайтов {livePage} из {maxLivePages}</span><Button variant="soft" disabled={loadingMarket||livePage>=maxLivePages} onClick={()=>{setResultPage(1);setLivePage(p=>Math.min(maxLivePages,p+1));}}>Следующая страница сайтов ›</Button><select className="input" style={{minWidth:250}} value={priceSort} onChange={e=>setPriceSort(e.target.value)}><option value="none">От самых новых</option><option value="asc">От самого дешевого</option><option value="desc">От самого дорогого</option><option value="areaAsc">От наименьшей площади</option><option value="areaDesc">От наибольшей площади</option></select><Button variant={marketView==="cards"?"primary":"soft"} onClick={()=>setMarketView("cards")}>▦ Карточки</Button><Button variant={marketView==="list"?"primary":"soft"} onClick={()=>setMarketView("list")}>☷ Список</Button></div></div>
    {!loadingMarket&&filtered.length===0&&<div className="card"><h3>По выбранным фильтрам объявлений нет</h3><p className="muted">Показываются только полноценные объявления с указанной ценой. Попробуй изменить фильтры.</p></div>}
    {marketView==="list"&&filtered.length>0&&<div className="card" style={{padding:0,overflowX:"auto",borderRadius:20}}><table className="clientTable analyticsMobileTable" style={{width:"100%",borderCollapse:"collapse",minWidth:1240}}><thead><tr><th>Фото</th><th>Объект</th><th>Источник</th><th>Продавец</th><th>Телефон</th><th>Локация</th><th>Комнаты</th><th>Площадь</th><th>Цена</th><th>Действия</th></tr></thead><tbody>{renderedFiltered.map(x=>{const crm=crmMatch(x),checked=selected.includes(String(x._key)),photo=x.main_photo_url||(Array.isArray(x.photo_urls)?x.photo_urls[0]:"");return <tr key={`list-${x._key}`}><td style={{width:90}}>{photo?<img src={photo} alt="" loading="lazy" decoding="async" style={{width:72,height:54,objectFit:"cover",borderRadius:10}}/>:<div style={{width:72,height:54,display:"grid",placeItems:"center",background:"var(--soft)",borderRadius:10}}>🏠</div>}</td><td><b>{x.title||x.complex_name||"Объект недвижимости"}</b><div className="muted" style={{fontSize:12}}>{x.complex_name||""}</div></td><td>{x.source_name||"—"}</td><td><span className="badge">{sellerLabel(x)}</span></td><td>{sellerKind(x)==="realtor"?(contactPhone(x)||"—"):"—"}</td><td>{[geoDisplay(x.city),geoDisplay(x.district)].filter(Boolean).join(" · ")||"—"}</td><td>{x.rooms||"—"}</td><td>{Number(x.area||0)>0?`${x.area} м²`:"—"}</td><td><b style={{whiteSpace:"nowrap"}}>{marketMoney(x.price,marketCurrency(x))}</b></td><td><div style={{display:"grid",gap:7,minWidth:190}}><Button style={{minHeight:38}} onClick={()=>openListing(x)}>{crm?"Открыть CRM":"Открыть"}</Button><Button variant={checked?"primary":"soft"} style={{minHeight:38}} onClick={()=>toggleSelected(x._key)}>{checked?"✓ В подборке":"＋ Добавить в подборку"}</Button></div></td></tr>})}</tbody></table></div>}
    {marketView==="cards"&&<div className="grid2">
      {renderedFiltered.map(x=>{
        const crm=crmMatch(x),checked=selected.includes(String(x._key)),fav=favorites.includes(String(x._key)),photo=x.main_photo_url||(Array.isArray(x.photo_urls)?x.photo_urls[0]:"");
        const ai=aiFor(x);
        return <article className="card" key={x._key} style={{padding:0,overflow:"hidden",borderRadius:24}}>
          <div style={{height:240,background:"var(--soft)",position:"relative",overflow:"hidden"}}>
            {photo?<img src={photo} alt="" loading="lazy" decoding="async" style={{width:"100%",height:"100%",objectFit:"cover"}}/>:<div style={{height:"100%",display:"grid",placeItems:"center",fontSize:54}}>🏠</div>}
            <div style={{position:"absolute",left:14,top:14,display:"flex",gap:8,flexWrap:"wrap"}}><span className="badge">{x.source_name||"Источник"}</span><span className="badge" style={sellerKind(x)==="owner"?{background:"#dcfce7",color:"#166534"}:sellerKind(x)==="realtor"?{background:"#dbeafe",color:"#1d4ed8"}:{}}>{sellerKind(x)==="owner"?"👤 ":sellerKind(x)==="realtor"?"🏢 ":""}{sellerLabel(x)}</span>{crm&&<span className="badge" style={{background:"#dcfce7",color:"#166534"}}>✓ В CRM</span>}</div>
          </div>
          <div style={{padding:20}}>
            <div className="row" style={{alignItems:"flex-start"}}><section><h3 style={{margin:"0 0 7px",fontSize:21}}>{x.title||x.complex_name||"Объект недвижимости"}</h3><p className="muted" style={{margin:0}}>📍 {[x.country,x.region,x.city,x.district,x.complex_name].filter(Boolean).join(" · ")||"Локация не указана"}</p></section><b style={{fontSize:24,whiteSpace:"nowrap"}}>{marketMoney(x.price,marketCurrency(x))}</b></div>
            <div className="chips" style={{margin:"14px 0"}}>{x.rooms&&<span className="chip">{x.rooms} комн.</span>}{x.area&&<span className="chip">{x.area} м²</span>}{x.floor&&<span className="chip">{x.floor} этаж</span>}{x.deal_type&&<span className="chip">{x.deal_type}</span>}</div>
            <p className="muted" style={{fontSize:13}}>Обновлено: {getListingDate(x)?new Date(getListingDate(x)).toLocaleString():"—"}</p>{sellerKind(x)==="realtor"&&contactPhone(x)&&<div style={{margin:"-2px 0 12px",padding:"9px 12px",borderRadius:12,background:"color-mix(in srgb,#3b82f6 8%,var(--card))",fontWeight:800}}>☎ Риэлтор: <a href={`tel:${contactPhone(x).replace(/[^+\d]/g,"")}`} style={{color:"inherit"}}>{contactPhone(x)}</a></div>}
            <div className="grid2">
              <Button style={actionStyle} onClick={()=>openListing(x)}>{crm?"🏠 Открыть объект CRM":"↗ Открыть объявление"}</Button>
              <Button variant={checked?"primary":"soft"} style={actionStyle} onClick={()=>toggleSelected(x._key)}>{checked?"✓ В подборке":"＋ Добавить в подборку"}</Button>
            </div>
            {x.origin!=="crm"&&!crm&&<Button className="full" style={{...actionStyle,marginTop:10}} onClick={()=>addToCrm(x)}>＋ Добавить в CRM</Button>}
            {crm&&x.source_url&&<Button variant="soft" className="full" style={{...actionStyle,marginTop:10}} onClick={()=>window.open(x.source_url,"_blank","noopener,noreferrer")}>↗ Открыть исходное объявление</Button>}
            <div style={{display:"grid",gridTemplateColumns:"repeat(5,1fr)",gap:8,marginTop:10}}>
              <button className="icon" title="Избранное" onClick={()=>toggleFavorite(x._key)} style={{minHeight:42,fontSize:20}}>{fav?"♥":"♡"}</button>
              <button className="icon" title="Копировать" onClick={()=>copyListing(x)} style={{minHeight:42,fontSize:18}}>📋</button>
              <button className="icon" title="Поделиться / сообщение" onClick={()=>shareListing(x)} style={{minHeight:42,fontSize:18}}>💬</button>
              <button className="icon" title="Позвонить" onClick={()=>callListing(x)} style={{minHeight:42,fontSize:18}}>☎</button>
              <button className="icon" title="AI-анализ" onClick={()=>setAiOpenId(aiOpenId===x._key?"":x._key)} style={{minHeight:42,fontSize:18}}>⭐</button>
            </div>
            {aiOpenId===x._key&&<div style={{marginTop:12,padding:15,borderRadius:16,background:"color-mix(in srgb,var(--accent) 10%,var(--card))",border:"1px solid color-mix(in srgb,var(--accent) 28%,#e5e7eb)"}}><div className="row"><b>⭐ Анализ AI</b><span className="badge gold">Потенциал {ai.score}%</span></div><p className="muted" style={{margin:"8px 0 6px"}}>Почему объект интересен:</p>{ai.reasons.map((r,i)=><div key={i} style={{margin:"6px 0"}}>✓ {r}</div>)}</div>}
          </div>
        </article>;
      })}
    </div>}

    {filtered.length>resultPageSize&&<div className="card" style={{marginTop:14,padding:14,borderRadius:18}}>
      <div className="row" style={{gap:10,flexWrap:"wrap",justifyContent:"center"}}>
        <Button variant="soft" disabled={safeResultPage<=1} onClick={()=>setResultPage(1)}>« Первая</Button>
        <Button variant="soft" disabled={safeResultPage<=1} onClick={()=>setResultPage(p=>Math.max(1,p-1))}>‹ Назад</Button>
        <span className="chip" style={{minHeight:42,display:"inline-flex",alignItems:"center",fontWeight:900}}>Страница {safeResultPage} из {resultPages}</span>
        <Button variant="soft" disabled={safeResultPage>=resultPages} onClick={()=>setResultPage(p=>Math.min(resultPages,p+1))}>Вперёд ›</Button>
        <Button variant="soft" disabled={safeResultPage>=resultPages} onClick={()=>setResultPage(resultPages)}>Последняя »</Button>
      </div>
      <p className="muted" style={{textAlign:"center",margin:"8px 0 0"}}>Статистика считает все {filtered.length} объектов. Порциями выводятся только карточки на экран — это не лимит Аналитики.</p>
    </div>}
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
  const [user,setUser] = useState({agency_id:"",full_name:"",phone:"",email:"",role:"Менеджер по продажам",birth_date:""});
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
      birth_date: user.birth_date || null,
      avatar_url: null
    };

    const { data, error } = await supabase.from("users").insert(payload).select().single();
    if (error) { alert("Ошибка создания пользователя: " + error.message); return; }
    setUsers(prev => [data, ...prev]);
    setUser({agency_id: agencyId || "", full_name:"", phone:"", email:"", role:"Менеджер по продажам", birth_date:""});
  };

  const saveUser = async () => {
    if (!editingUser) return;
    const payload = {
      agency_id: Number(editingUser.agency_id),
      full_name: editingUser.full_name || "",
      phone: editingUser.phone || "",
      email: editingUser.email || "",
      role: editingUser.role || "Менеджер по продажам",
      birth_date: editingUser.birth_date || null
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
        <label className="muted">Дата рождения<input className="input" type="date" value={user.birth_date || ""} onChange={e=>setUser({...user,birth_date:e.target.value})}/></label>
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
          <div className="row"><section><b>{userName(u)}</b><p className="muted">{u.phone || "Без телефона"}<br/>{u.email}<br/>{u.role}{u.birth_date ? <><br/>{`Дата рождения: ${new Date(u.birth_date + "T00:00:00").toLocaleDateString()}`}</> : null}</p></section>{badge("Доступ создан","green")}</div>
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
      <label className="muted">Дата рождения<input className="input" type="date" value={editingUser.birth_date || ""} onChange={e=>setEditingUser({...editingUser,birth_date:e.target.value})}/></label>
      <input className="input" placeholder="Email" value={editingUser.email || ""} onChange={e=>setEditingUser({...editingUser,email:e.target.value})}/>
      <select className="input" value={editingUser.role || "Менеджер по продажам"} onChange={e=>setEditingUser({...editingUser,role:e.target.value})}><option>Менеджер по продажам</option><option>Администратор директор</option><option>Администратор тех отдел</option></select>
      <Button className="full" onClick={saveUser}>Сохранить пользователя</Button>
    </Modal>}
  </main>;
}



// Сжимаем скриншот перед отправкой: по длинной стороне до 1600px, JPEG — быстрее на мобильном интернете
async function imageToBase64(file, maxSide = 1600) {
  const url = URL.createObjectURL(file);
  try {
    const img = await new Promise((resolve, reject) => { const i = new Image(); i.onload = () => resolve(i); i.onerror = reject; i.src = url; });
    const scale = Math.min(1, maxSide / Math.max(img.width, img.height));
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(img.width * scale);
    canvas.height = Math.round(img.height * scale);
    canvas.getContext("2d").drawImage(img, 0, 0, canvas.width, canvas.height);
    return { base64: canvas.toDataURL("image/jpeg", 0.85).split(",")[1], mime: "image/jpeg" };
  } finally {
    URL.revokeObjectURL(url);
  }
}

// Вызов функции lead-import с понятной ошибкой
async function callLeadImport(body) {
  const { data, error } = await supabase.functions.invoke("lead-import", { body });
  if (error) {
    let message = error.message;
    try { const j = await error.context?.json?.(); if (j?.error) message = j.error; } catch {}
    throw new Error(message);
  }
  if (!data?.success) throw new Error(data?.error || "Не удалось обработать данные");
  return data;
}

// Загрузка лидов: список (вставка или Excel/CSV) и скриншоты переписки. Сначала предпросмотр, потом сохранение.
// Все загруженные клиенты попадают менеджерам этапом «Новый Лид». Старые карточки не меняются.
// Дубли видит только администратор: может пропустить или всё равно отдать в работу. Дубль от менеджера уходит админу на решение.
function LeadImport({role, users, currentProfile, leads, onImported, onOpenLead}) {
  const isAdmin = role === "Администратор директор" || role === "Администратор тех отдел";
  const [tab, setTab] = useState("list");
  const [text, setText] = useState("");
  const [chatText, setChatText] = useState("");
  const [files, setFiles] = useState([]);
  const [source, setSource] = useState("");
  const [managerEmail, setManagerEmail] = useState(currentProfile?.email || "");
  const [rows, setRows] = useState([]);
  const [busy, setBusy] = useState("");
  const [message, setMessage] = useState(null);
  const [rowStaff, setRowStaff] = useState([]);
  const [pendingDups, setPendingDups] = useState([]);
  const [dupManager, setDupManager] = useState({});

  const staff = (users || []).filter(u => u.email && u.access !== false && (!currentProfile?.agency_id || String(u.agency_id) === String(currentProfile.agency_id)));
  const staffOptions = rowStaff.length ? rowStaff : staff.map(u => ({name: u.full_name || u.email, email: u.email}));
  const selected = rows.filter(r => r.include);
  const findLead = (id) => (leads || []).find(l => String(l.id) === String(id));

  // Дубли, которые загрузили менеджеры, ждут решения администратора
  const loadPending = async () => {
    if (!isAdmin) return;
    const { data } = await supabase.from("lead_duplicates").select("*").eq("status", "pending").order("created_at", {ascending: false});
    setPendingDups(data || []);
  };
  useEffect(() => { loadPending(); }, [isAdmin]);

  const showResult = (data) => {
    setRowStaff(data.staff || []);
    // дубль по умолчанию не сохраняем — администратор решает сам
    setRows((data.leads || []).map((l, i) => ({...l, lead_date: l.lead_date || "", key: Date.now() + "-" + i, include: !!(l.name || l.phone) && !l.duplicate_of})));
    if (!data.leads?.length) setMessage({type: "red", text: "Не удалось найти клиентов. Проверьте текст или скриншот."});
  };

  const run = async (label, fn) => {
    setBusy(label); setMessage(null);
    try { await fn(); } catch (e) { setMessage({type: "red", text: e.message}); }
    finally { setBusy(""); }
  };

  const readSpreadsheet = (file) => run("Читаем файл…", async () => {
    if (!file) return;
    const ext = (file.name.split(".").pop() || "").toLowerCase();
    if (["xlsx", "xls"].includes(ext)) {
      const XLSX = await import(/* @vite-ignore */ "https://cdn.sheetjs.com/xlsx-0.20.3/package/xlsx.mjs");
      const book = XLSX.read(await file.arrayBuffer());
      // raw:false — телефоны берём так, как они видны в Excel, без превращения в 3,80E+11
      const data = XLSX.utils.sheet_to_json(book.Sheets[book.SheetNames[0]], {header: 1, defval: "", raw: false});
      setText(data.filter(r => r.some(c => String(c).trim())).map(r => r.join(";")).join("\n"));
    } else {
      setText(await file.text());
    }
  });

  const checkList = () => run("Проверяем список…", async () => {
    if (!text.trim()) throw new Error("Вставьте список или выберите файл.");
    showResult(await callLeadImport({mode: "preview", text, source, manager_email: managerEmail}));
  });

  const recognize = () => run("Читаем переписку…", async () => {
    if (!files.length && !chatText.trim()) throw new Error("Выберите скриншоты или вставьте текст переписки.");
    const images = [];
    for (const f of files.slice(0, 10)) images.push(await imageToBase64(f));
    showResult(await callLeadImport({mode: "preview", images, text: chatText.trim() || undefined, ai_text: !!chatText.trim(), source, manager_email: managerEmail}));
  });

  const save = () => run("Сохраняем…", async () => {
    if (!selected.length) throw new Error("Отметьте хотя бы одного клиента.");
    const data = await callLeadImport({mode: "commit", leads: selected.map(r => ({...r, allow_duplicate: !!r.duplicate_of})), source, manager_email: managerEmail});
    setRows([]); setText(""); setChatText(""); setFiles([]);
    const parts = [`Сохранено новых клиентов: ${data.inserted}`];
    if (data.duplicates_added) parts.push(`Дубли отданы в работу: ${data.duplicates_added}`);
    if (data.pending) parts.push(`Отправлено администратору на проверку: ${data.pending}`);
    setMessage({type: "green", text: parts.join(". ")});
    onImported?.();
    loadPending();
  });

  const decide = (d, action) => run("Сохраняем…", async () => {
    await callLeadImport({mode: "decide", id: d.id, action, manager_email: dupManager[d.id] || d.payload?.manager_email});
    setMessage({type: "green", text: action === "approve" ? "Клиент отдан в работу" : "Дубль отклонён"});
    onImported?.();
    loadPending();
  });

  const update = (key, patch) => setRows(prev => prev.map(r => r.key === key ? {...r, ...patch} : r));

  return <div className="card">
    <h3>Загрузка лидов</h3>
    <p className="muted">Список из заметок, Excel или скриншот переписки — CRM найдёт имя, телефон и запрос клиента. Все клиенты попадают менеджерам этапом «Новый Лид», перед сохранением всё можно проверить и исправить.</p>

    {isAdmin && pendingDups.length > 0 && <div className="card" style={{margin: "10px 0", display: "grid", gap: 10}}>
      <b>{`Дубли на проверке: ${pendingDups.length}`}</b>
      <p className="muted" style={{margin: 0}}>Менеджеры загрузили клиентов, которые уже есть в CRM. Менеджеры этого не видят — решение за вами.</p>
      {pendingDups.map(d => { const orig = findLead(d.duplicate_of); const p = d.payload || {}; return <div key={d.id} className="card" style={{margin: 0}}>
        <b>{`${p.name || "Без имени"} · ${p.phone || "—"}`}</b>
        <p className="muted" style={{margin: "4px 0"}}>{`Загрузил: ${p.manager_name || d.uploaded_by}`}{p.source ? ` · ${p.source}` : ""}</p>
        {p.notes && <p style={{margin: "4px 0", whiteSpace: "pre-line"}}>{p.notes}</p>}
        <p className="badge dark" style={{whiteSpace: "normal"}}>{`Уже в CRM: клиент №${d.duplicate_of}`}{orig ? ` «${orig.name}»` : ""}</p>{orig && <p className="muted" style={{margin: "4px 0"}}>{`Ведёт: ${orig.manager || "—"}`}{` · `}{`Этап: ${orig.status}`}</p>}
        <div className="grid2" style={{marginTop: 8}}>
          <Button variant="soft" onClick={() => onOpenLead?.(d.duplicate_of)}>{`Открыть карточку №${d.duplicate_of}`}</Button>
          <label>Кому отдать<select className="input" value={dupManager[d.id] || p.manager_email || ""} onChange={e => setDupManager(m => ({...m, [d.id]: e.target.value}))}>{staffOptions.map(u => <option key={u.email} value={u.email}>{u.name || u.email}</option>)}</select></label>
          <Button disabled={!!busy} onClick={() => decide(d, "approve")}>Отдать в работу</Button>
          <Button variant="soft" disabled={!!busy} onClick={() => decide(d, "reject")}>Отклонить</Button>
        </div>
      </div>; })}
    </div>}

    <div className="chips" style={{margin: "10px 0"}}>
      <button type="button" className={cn("chip", tab === "list" && "active")} onClick={() => { setTab("list"); setRows([]); setMessage(null); }}>Список / Excel</button>
      <button type="button" className={cn("chip", tab === "screenshot" && "active")} onClick={() => { setTab("screenshot"); setRows([]); setMessage(null); }}>Скриншот переписки</button>
    </div>

    <div className="grid2">
      {isAdmin
        ? <label>Ответственный менеджер
            <select className="input" value={managerEmail} onChange={e => setManagerEmail(e.target.value)}>
              {staff.map(u => <option key={u.email} value={u.email}>{u.full_name || u.email}</option>)}
            </select>
          </label>
        : <p className="muted" style={{alignSelf: "center"}}>Клиенты будут закреплены за вами</p>}
      <label>Источник (если не указан в списке)
        <select className="input" value={source} onChange={e => setSource(e.target.value)}>
          <option value="">Определить автоматически</option>
          {sources.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
      </label>
    </div>

    {tab === "screenshot" && <>
      <label className="btn soft full" style={{marginTop: 10, textAlign: "center", cursor: "pointer"}}>
        {files.length ? `Выбрано скриншотов: ${files.length} · заменить` : "Выбрать скриншоты переписки"}
        <input type="file" accept="image/*" multiple style={{display: "none"}} onChange={e => setFiles(Array.from(e.target.files || []).slice(0, 10))}/>
      </label>
      <p className="muted">До 10 скриншотов одной переписки. Подходят Telegram, Viber, WhatsApp, Instagram.</p>
      <textarea className="input" style={{minHeight: 80}} placeholder="Или вставьте текст переписки" value={chatText} onChange={e => setChatText(e.target.value)}/>
      <Button className="full" disabled={!!busy} onClick={recognize}>{busy || "Распознать клиента"}</Button>
    </>}

    {tab === "list" && <>
      <label className="btn soft full" style={{marginTop: 10, textAlign: "center", cursor: "pointer"}}>
        Выбрать файл Excel или CSV
        <input type="file" accept=".xlsx,.xls,.csv,.txt,.tsv" style={{display: "none"}} onChange={e => readSpreadsheet(e.target.files?.[0])}/>
      </label>
      <textarea className="input" style={{minHeight: 120}} placeholder={"Или вставьте список, по клиенту в строке. Подходят списки из заметок:\nТик-ток\n1. 0671234567 - Иван - 2к Аркадия до 60к - 12.05 - Русаков - задаток\n2. @nick - Ольга - студия центр - 15.05 - Архипова"} value={text} onChange={e => setText(e.target.value)}/>
      <Button className="full" disabled={!!busy} onClick={checkList}>{busy || "Проверить список"}</Button>
    </>}

    {message && <p className={cn("badge", message.type)} style={{whiteSpace: "normal", marginTop: 10}}>{message.text}</p>}

    {rows.length > 0 && <div style={{marginTop: 14, display: "grid", gap: 10}}>
      <b>Найдено: {rows.length} · к сохранению: {selected.length}</b>
      <datalist id="lead-import-sources">{sources.map(x => <option key={x} value={x}/>)}</datalist>
      {rows.map(r => <div key={r.key} className="card" style={{margin: 0, opacity: r.include ? 1 : 0.6}}>
        <label style={{display: "flex", gap: 8, alignItems: "center", fontWeight: 900}}>
          <input type="checkbox" checked={r.include} onChange={e => update(r.key, {include: e.target.checked})}/>
          {r.duplicate_of ? (r.include ? "Отдать дубль в работу новым лидом" : "Пропустить дубль") : (r.include ? "Сохранить" : "Не сохранять")}
        </label>
        {r.duplicate_of && <div className="card" style={{margin: "8px 0 0", display: "grid", gap: 6}}>
          <b>{`Дубль · уже в CRM: клиент №${r.duplicate_of}`}{` «${r.duplicate?.name || ""}»`}</b>
          <span className="muted">{`Ведёт: ${r.duplicate?.manager_name || "—"}`}{` · `}{`Этап: ${r.duplicate?.stage || "—"}`}{r.duplicate?.created_at ? ` · ${new Date(r.duplicate.created_at).toLocaleDateString()}` : ""}</span>
          <Button variant="soft" onClick={() => onOpenLead?.(r.duplicate_of)}>Открыть карточку и историю работы</Button>
        </div>}
        <div className="grid2" style={{marginTop: 8}}>
          <input className="input" placeholder="Имя клиента" value={r.name} onChange={e => update(r.key, {name: e.target.value})}/>
          <input className="input" type="tel" placeholder="Телефон" value={r.phone} onChange={e => update(r.key, {phone: e.target.value})}/>
          <input className="input" list="lead-import-sources" placeholder="Источник" value={r.source || ""} onChange={e => update(r.key, {source: e.target.value})}/>
          <label>Дата лида<input className="input" type="date" value={r.lead_date || ""} onChange={e => update(r.key, {lead_date: e.target.value})}/></label>
          {isAdmin && staffOptions.length > 0 && <label>Ответственный<select className="input" value={r.manager_email || managerEmail} onChange={e => update(r.key, {manager_email: e.target.value})}>{staffOptions.map(u => <option key={u.email} value={u.email}>{u.name || u.email}</option>)}</select></label>}
          <p className="muted" style={{alignSelf: "center", margin: 0}}>Этап: Новый Лид</p>
        </div>
        <textarea className="input" style={{minHeight: 60}} placeholder="Заметка" value={r.notes || ""} onChange={e => update(r.key, {notes: e.target.value})}/>
        {r.warnings?.length > 0 && <div style={{display: "flex", flexWrap: "wrap", gap: 6}}>
          {r.warnings.map(w => <span key={w} className={cn("badge", r.duplicate_of ? "dark" : "gold")} style={{whiteSpace: "normal"}}>{w}</span>)}
        </div>}
      </div>)}
      <Button className="full" disabled={!!busy || !selected.length} onClick={save}>{busy || `Одобрить и сохранить: ${selected.length}`}</Button>
    </div>}
  </div>;
}

// ===== Новобудови: ЖК агентства из Google Drive («Новострой» → «ПОИСКОВИК НОВОСТРОЙКИ») =====
// Подбор под клиента, калькулятор рассрочки, подборка для отправки клиенту (без контактов застройщика),
// ссылки на папки Drive, связь с DIM.RIA. Редактировать карточки ЖК могут директор и тех. администратор.
const nbMoney = (n) => n ? `$${Math.round(Number(n)).toLocaleString("ru-RU")}` : "—";
const nbRange = (c) => c.price_m2_min ? (c.price_m2_max && c.price_m2_max !== c.price_m2_min ? `$${Math.round(c.price_m2_min)}–${Math.round(c.price_m2_max)} / м²` : `$${Math.round(c.price_m2_min)} / м²`) : (c.price_note || "цена по запросу");
// Бюджет и комнаты из текста запроса клиента: «2к Аркадия до 60к», «бюджет 80 000$», «студия до 45 тыс»
function nbParseRequest(text = ""){
  const t = String(text).toLowerCase().replace(/ /g, " ");
  let budget = 0;
  const k = t.match(/(\d{2,4}(?:[.,]\d)?)\s*(?:к|k|тыс|тис)(?![а-яёіїєґa-z])/);
  const full = t.match(/(\d{2,3}[\s.]?\d{3})\s*(?:\$|usd|дол|у\.?е)/) || t.match(/\$\s*(\d{2,3}[\s.]?\d{3})/);
  if (k) budget = Number(k[1].replace(",", ".")) * 1000; else if (full) budget = Number(full[1].replace(/[\s.]/g, ""));
  let rooms = 0;
  const r = t.match(/(?:^|[^\d])(\d)\s*[-–]?\s*(?:кк|комн|кімн|room|к(?![а-яёіїєґa-z]))/) || t.match(/(одно|двух|трех|трёх|чотири|четырех)\s*комн/);
  if (r) rooms = /^\d$/.test(r[1]) ? Number(r[1]) : ({одно:1,двух:2,трех:3,трёх:3,четырех:4,чотири:4}[r[1]] || 0);
  if (/студи|smart|смарт/.test(t)) rooms = rooms || 1;
  const districts = [["Приморский", /примор|аркади|фонтан|французск|центр|генуэзск|гагарин/], ["Киевский", /киевск|таиров|черемушк|вильямс|глушко|сахарова|жемчужн|лиманк/], ["Суворовский", /суворов|пересып|котовск|лески|крыжановк|фонтанк/], ["Малиновский", /малинов|хаджибей|молдаванк|краснова/]];
  const district = (districts.find(([, re]) => re.test(t)) || [])[0] || "";
  return { budget, rooms, district };
}
const nbArea = (rooms) => rooms >= 3 ? 80 : rooms === 2 ? 60 : 40;

function NewBuilds({ role, leads = [], currentProfile }) {
  const isAdmin = role === "Администратор директор" || role === "Администратор тех отдел";
  const [items, setItems] = useState([]);
  const [links, setLinks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [q, setQ] = useState("");
  const [district, setDistrict] = useState("Все");
  const [developer, setDeveloper] = useState("Все");
  const [status, setStatus] = useState("Все");
  const [priceFrom, setPriceFrom] = useState("");
  const [priceTo, setPriceTo] = useState("");
  const [sort, setSort] = useState("price");
  const [picked, setPicked] = useState([]);
  const [calc, setCalc] = useState(null);
  const [edit, setEdit] = useState(null);
  const [leadId, setLeadId] = useState("");
  const [match, setMatch] = useState(null);
  const [showLinks, setShowLinks] = useState(false);
  const [limit, setLimit] = useState(40);

  const load = async () => {
    setLoading(true); setError("");
    const [c, l] = await Promise.all([
      supabase.from("nb_complexes").select("*").eq("is_active", true).order("name"),
      supabase.from("nb_links").select("*").order("sort"),
    ]);
    if (c.error) setError(c.error.message);
    setItems(c.data || []); setLinks(l.data || []); setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const districts = ["Все", ...Array.from(new Set(items.map(x => (x.district || "").trim()).filter(Boolean))).sort((a, b) => a.localeCompare(b, "ru"))];
  const developers = ["Все", ...Array.from(new Set(items.map(x => (x.developer || "").trim()).filter(Boolean))).sort((a, b) => a.localeCompare(b, "ru"))];
  const text = q.trim().toLowerCase();
  const filtered = items.filter(x =>
    (!text || `${x.name} ${x.developer || ""} ${x.address || ""}`.toLowerCase().includes(text)) &&
    (district === "Все" || (x.district || "").trim() === district) &&
    (developer === "Все" || (x.developer || "").trim() === developer) &&
    (status === "Все" || (status === "Сдан" ? x.is_completed : !x.is_completed)) &&
    (!priceFrom || Number(x.price_m2_max || x.price_m2_min || 0) >= Number(priceFrom)) &&
    (!priceTo || (Number(x.price_m2_min || 0) > 0 && Number(x.price_m2_min) <= Number(priceTo)))
  ).sort((a, b) => sort === "name" ? a.name.localeCompare(b.name, "ru") : (Number(a.price_m2_min || 1e9) - Number(b.price_m2_min || 1e9)));

  // Подбор под клиента из CRM: бюджет / комнаты / район берутся из имени и заметок карточки
  const runMatch = () => {
    const lead = leads.find(l => String(l.id) === String(leadId));
    if (!lead) return;
    const req = nbParseRequest(`${lead.notes || ""}`);
    const area = nbArea(req.rooms);
    const list = items.filter(x => Number(x.price_m2_min) > 0)
      .filter(x => !req.district || (x.district || "").includes(req.district))
      .filter(x => !req.budget || Number(x.price_m2_min) * area <= req.budget * 1.05)
      .sort((a, b) => Number(a.price_m2_min) - Number(b.price_m2_min)).slice(0, 15);
    setMatch({ lead, req, area, list });
  };

  const togglePick = (x) => setPicked(p => p.some(y => y.id === x.id) ? p.filter(y => y.id !== x.id) : [...p, x]);
  // Текст подборки для клиента — без контактов застройщика, правил брони и комиссий
  const selectionText = () => [
    "Подборка новостроек от " + (currentProfile?.full_name || "вашего менеджера") + ":",
    ...picked.map((x, i) => `${i + 1}. ${x.name}${x.address ? ` — ${x.address}` : ""}${x.district ? `, ${x.district} р-н` : ""}\n   Цена: ${nbRange(x)}${x.completion ? ` · сдача: ${x.completion}` : ""}`),
    "Пишите — подберу планировки и рассчитаю рассрочку.",
  ].join("\n");
  const copySelection = async () => { try { await navigator.clipboard.writeText(selectionText()); alert("Подборка скопирована"); } catch { prompt("Скопируйте текст", selectionText()); } };

  const saveEdit = async () => {
    const payload = { name: edit.name, developer: edit.developer || null, address: edit.address || null, district: edit.district || null,
      price_m2_min: edit.price_m2_min ? Number(edit.price_m2_min) : null, price_m2_max: edit.price_m2_max ? Number(edit.price_m2_max) : null,
      completion: edit.completion || null, is_completed: !!edit.is_completed, booking_rule: edit.booking_rule || null, resale_fee: edit.resale_fee || null,
      commission: edit.commission || null, installment: edit.installment || null, drive_url: edit.drive_url || null, dimria_url: edit.dimria_url || null,
      notes: edit.notes || null, updated_at: new Date().toISOString() };
    const res = edit.id ? await supabase.from("nb_complexes").update(payload).eq("id", edit.id).select().single()
      : await supabase.from("nb_complexes").insert({ ...payload, agency_id: currentProfile?.agency_id || null, source: "CRM" }).select().single();
    if (res.error) { alert("Ошибка сохранения: " + res.error.message); return; }
    setItems(prev => edit.id ? prev.map(x => x.id === res.data.id ? res.data : x) : [...prev, res.data]);
    setEdit(null);
  };

  const leadsWithNotes = leads.filter(l => String(l.notes || "").trim());

  return <main className="screen">
    <div className="card">
      <div className="row"><section><h3>Новобудови</h3><p className="muted">{`ЖК в базе: ${items.length}. Источник — ваша папка «Новострой» на Google Drive.`}</p></section>
        <div className="grid2" style={{ maxWidth: 360 }}>
          <Button variant="soft" onClick={() => setShowLinks(v => !v)}>{showLinks ? "Скрыть материалы" : "Материалы Drive"}</Button>
          {isAdmin && <Button onClick={() => setEdit({ name: "", is_completed: false })}>+ Добавить ЖК</Button>}
        </div>
      </div>
      {showLinks && <div style={{ display: "grid", gap: 6, marginTop: 8 }}>
        {[["common", "Общее"], ["partner", "Материалы застройщиков для агентств"], ["developer", "Папки застройщиков"]].map(([kind, title]) => {
          const list = links.filter(l => l.kind === kind); if (!list.length) return null;
          return <div key={kind}><b>{title}</b><div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 6 }}>{list.map(l => <a key={l.id} className="btn soft" href={l.url} target="_blank" rel="noreferrer">{l.title}</a>)}</div></div>;
        })}
      </div>}
    </div>

    <div className="card">
      <h3>Подбор под клиента</h3>
      <p className="muted">CRM берёт бюджет, комнаты и район из заметки клиента и показывает подходящие ЖК.</p>
      <div className="grid2">
        <select className="input" value={leadId} onChange={e => { setLeadId(e.target.value); setMatch(null); }}>
          <option value="">Выберите клиента</option>
          {leadsWithNotes.slice(0, 500).map(l => <option key={l.id} value={l.id}>{`${l.name || "Без имени"} · ${l.phone || ""}`}</option>)}
        </select>
        <Button disabled={!leadId} onClick={runMatch}>Подобрать ЖК</Button>
      </div>
      {match && <div style={{ marginTop: 10, display: "grid", gap: 6 }}>
        <p className="muted" style={{ margin: 0 }}>{`Бюджет: ${match.req.budget ? nbMoney(match.req.budget) : "не указан"} · комнат: ${match.req.rooms || "—"} · район: ${match.req.district || "любой"} · расчётная площадь ${match.area} м²`}</p>
        {match.list.length === 0 && <p className="muted">Подходящих ЖК не найдено — уточните бюджет или район в заметке клиента.</p>}
        {match.list.map(x => <div key={x.id} className="row"><span>{`${x.name} · ${nbRange(x)} · от ${nbMoney(Number(x.price_m2_min) * match.area)}`}</span><Button variant="soft" onClick={() => togglePick(x)}>{picked.some(y => y.id === x.id) ? "Убрать" : "В подборку"}</Button></div>)}
      </div>}
    </div>

    {picked.length > 0 && <div className="card">
      <div className="row"><h3>{`Подборка для клиента: ${picked.length}`}</h3><Button variant="soft" onClick={() => setPicked([])}>Очистить</Button></div>
      <textarea className="input" style={{ minHeight: 120 }} readOnly value={selectionText()} />
      <div className="grid3">
        <Button onClick={copySelection}>Скопировать</Button>
        <a className="btn soft" href={`https://t.me/share/url?url=${encodeURIComponent(" ")}&text=${encodeURIComponent(selectionText())}`} target="_blank" rel="noreferrer">Telegram</a>
        <a className="btn soft" href={`viber://forward?text=${encodeURIComponent(selectionText())}`}>Viber</a>
      </div>
    </div>}

    <div className="card">
      <div className="search" style={{ margin: 0 }}>🔎 <input value={q} onChange={e => { setQ(e.target.value); setLimit(40); }} placeholder="ЖК, застройщик или адрес" /></div>
      <div className="grid3" style={{ marginTop: 8 }}>
        <Field label="Район"><select className="input" value={district} onChange={e => setDistrict(e.target.value)}>{districts.map(d => <option key={d}>{d}</option>)}</select></Field>
        <Field label="Застройщик"><select className="input" value={developer} onChange={e => setDeveloper(e.target.value)}>{developers.map(d => <option key={d}>{d}</option>)}</select></Field>
        <Field label="Статус"><select className="input" value={status} onChange={e => setStatus(e.target.value)}><option>Все</option><option>Строится</option><option>Сдан</option></select></Field>
        <Field label="Цена м² от, $"><input className="input" inputMode="numeric" value={priceFrom} onChange={e => setPriceFrom(e.target.value.replace(/\D/g, ""))} /></Field>
        <Field label="Цена м² до, $"><input className="input" inputMode="numeric" value={priceTo} onChange={e => setPriceTo(e.target.value.replace(/\D/g, ""))} /></Field>
        <Field label="Сортировка"><select className="input" value={sort} onChange={e => setSort(e.target.value)}><option value="price">Сначала дешевле</option><option value="name">По названию</option></select></Field>
      </div>
      <p className="muted">{`Найдено: ${filtered.length}`}</p>
    </div>

    {loading && <div className="card">Загрузка…</div>}
    {error && <div className="card"><p className="badge red">{error}</p></div>}
    {filtered.slice(0, limit).map(x => <div key={x.id} className="lead">
      <div className="row"><section><b>{x.name}</b><p className="muted" style={{ margin: 0 }}>{[x.developer, x.district && `${x.district} р-н`, x.address].filter(Boolean).join(" · ")}</p></section>{badge(x.is_completed ? "Сдан" : "Строится", x.is_completed ? "green" : "gold")}</div>
      <div className="leadInfoGrid">
        <div className="leadInfoCell"><span>Цена</span><b>{nbRange(x)}</b></div>
        <div className="leadInfoCell"><span>Сдача</span><b>{x.completion || "—"}</b></div>
        <div className="leadInfoCell"><span>Фиксация клиента</span><b>{x.booking_rule || "—"}</b></div>
        <div className="leadInfoCell"><span>Переуступка</span><b>{x.resale_fee || "—"}</b></div>
        {x.commission && <div className="leadInfoCell"><span>Комиссия</span><b>{x.commission}</b></div>}
        {x.installment && <div className="leadInfoCell"><span>Рассрочка</span><b>{x.installment}</b></div>}
      </div>
      {x.notes && <p className="muted">{x.notes}</p>}
      <div className="grid4">
        {x.drive_url ? <a className="btn soft" href={x.drive_url} target="_blank" rel="noreferrer">Drive</a> : <span />}
        {x.dimria_url ? <a className="btn soft" href={x.dimria_url} target="_blank" rel="noreferrer">DIM.RIA</a> : <span />}
        <Button variant="soft" onClick={() => setCalc({ c: x, area: 50, price: Number(x.price_m2_min || 0), first: 30, months: 24, rate: "" })}>Рассрочка</Button>
        <Button variant={picked.some(y => y.id === x.id) ? "primary" : "soft"} onClick={() => togglePick(x)}>{picked.some(y => y.id === x.id) ? "В подборке" : "В подборку"}</Button>
      </div>
      {isAdmin && <Button className="full" variant="soft" onClick={() => setEdit({ ...x })}>Редактировать</Button>}
    </div>)}
    {filtered.length > limit && <Button className="full" variant="soft" onClick={() => setLimit(l => l + 40)}>{`Показать ещё (${filtered.length - limit})`}</Button>}

    {calc && <Modal onClose={() => setCalc(null)}>
      <div className="row"><h2>{`Рассрочка · ${calc.c.name}`}</h2><button className="icon" onClick={() => setCalc(null)}>×</button></div>
      <div className="grid2">
        <Field label="Площадь, м²"><input className="input" inputMode="decimal" value={calc.area} onChange={e => setCalc({ ...calc, area: e.target.value })} /></Field>
        <Field label="Цена м², $"><input className="input" inputMode="decimal" value={calc.price} onChange={e => setCalc({ ...calc, price: e.target.value })} /></Field>
        <Field label="Первый взнос, %"><input className="input" inputMode="decimal" value={calc.first} onChange={e => setCalc({ ...calc, first: e.target.value })} /></Field>
        <Field label="Срок, месяцев"><input className="input" inputMode="numeric" value={calc.months} onChange={e => setCalc({ ...calc, months: e.target.value })} /></Field>
        <Field label="Курс грн за $ (необязательно)"><input className="input" inputMode="decimal" value={calc.rate} onChange={e => setCalc({ ...calc, rate: e.target.value })} /></Field>
      </div>
      {(() => {
        const total = Number(calc.area) * Number(calc.price); const first = total * Number(calc.first) / 100; const rest = total - first;
        const monthly = Number(calc.months) > 0 ? rest / Number(calc.months) : 0; const rate = Number(String(calc.rate).replace(",", "."));
        const uah = v => rate > 0 ? ` · ${Math.round(v * rate).toLocaleString("ru-RU")} грн` : "";
        return <div className="stats">
          <div className="stat"><span>Стоимость</span><b>{nbMoney(total)}{uah(total)}</b></div>
          <div className="stat"><span>Первый взнос</span><b>{nbMoney(first)}{uah(first)}</b></div>
          <div className="stat"><span>Платёж в месяц</span><b>{nbMoney(monthly)}{uah(monthly)}</b></div>
        </div>;
      })()}
      <p className="muted">Расчёт без удорожания. Точные условия рассрочки — в папке застройщика на Drive.</p>
    </Modal>}

    {edit && <Modal onClose={() => setEdit(null)} wide>
      <div className="row"><h2>{edit.id ? "Редактировать ЖК" : "Новый ЖК"}</h2><button className="icon" onClick={() => setEdit(null)}>×</button></div>
      <div className="grid2">
        {[["name", "Название"], ["developer", "Застройщик"], ["address", "Адрес"], ["district", "Район"], ["price_m2_min", "Цена м² от, $"], ["price_m2_max", "Цена м² до, $"], ["completion", "Срок сдачи"], ["booking_rule", "Фиксация клиента"], ["resale_fee", "Переуступка"], ["commission", "Комиссия агентства"], ["installment", "Условия рассрочки"], ["drive_url", "Ссылка на Drive"], ["dimria_url", "Ссылка на DIM.RIA"]].map(([key, label]) =>
          <Field key={key} label={label}><input className="input" value={edit[key] ?? ""} onChange={e => setEdit({ ...edit, [key]: e.target.value })} /></Field>)}
        <label style={{ display: "flex", gap: 8, alignItems: "center" }}><input type="checkbox" checked={!!edit.is_completed} onChange={e => setEdit({ ...edit, is_completed: e.target.checked })} />Дом сдан</label>
      </div>
      <Field label="Заметка"><textarea className="input" value={edit.notes || ""} onChange={e => setEdit({ ...edit, notes: e.target.value })} /></Field>
      <Button className="full" disabled={!String(edit.name || "").trim()} onClick={saveEdit}>Сохранить</Button>
    </Modal>}
  </main>;
}

// ===== «Менеджер ушёл — база осталась»: передача базы, выгрузка базы и журнал действий (только администраторы) =====
const AUDIT_TABLES = {leads:"Клиент", properties:"Объект", deals:"Сделка", calendar:"Событие", users:"Сотрудник"};
const AUDIT_ACTIONS = {insert:"создал(а)", update:"изменил(а)", delete:"удалил(а)"};
const AUDIT_FIELDS = {stage:"Этап", name:"Имя", phone:"Телефон", notes:"Заметка", source:"Источник", manager_name:"Менеджер", manager_email:"Email менеджера",
  next_contact_at:"След. контакт", price:"Цена", status:"Статус", title:"Название", district:"Район", owner_name:"Собственник", owner_phone:"Тел. собственника",
  property_manager_name:"Менеджер объекта", start_at:"Начало", end_at:"Конец", event_type:"Тип", location:"Адрес", result:"Итог", amount:"Сумма", commission:"Комиссия",
  access:"Доступ", role:"Роль", full_name:"Имя", email:"Email", birth_date:"Дата рождения", director_comment:"Комментарий директора"};
function auditValue(v){
  if(v === null || v === undefined || v === "") return "—";
  if(typeof v === "boolean") return v ? "да" : "нет";
  const s = typeof v === "object" ? JSON.stringify(v) : String(v);
  if(/^\d{4}-\d{2}-\d{2}T/.test(s)){ const d = new Date(s); if(!isNaN(d)) return d.toLocaleString("ru-RU",{day:"2-digit",month:"2-digit",hour:"2-digit",minute:"2-digit"}); }
  return s.length > 60 ? s.slice(0,60) + "…" : s;
}

function AgencyBaseAdmin({users=[], leads=[], currentProfile, role, lang, onChanged}){
  const isTech = role === "Администратор тех отдел";
  const myAgency = String(currentProfile?.agency_id || "");
  const staff = (users || []).filter(u => u.email && (isTech || String(u.agency_id || "") === myAgency));
  const [fromEmail,setFromEmail] = useState("");
  const [toEmail,setToEmail] = useState("");
  const [busy,setBusy] = useState(false);
  const [result,setResult] = useState(null);
  const [log,setLog] = useState([]);
  const [logOpen,setLogOpen] = useState(false);
  const [logLoading,setLogLoading] = useState(false);
  const [logTable,setLogTable] = useState("all");
  const [logWho,setLogWho] = useState("all");
  const [logSearch,setLogSearch] = useState("");

  const fromUser = staff.find(u => u.email === fromEmail);
  const toUser = staff.find(u => u.email === toEmail);
  const fromLeads = fromUser ? (leads || []).filter(l => String(l.manager_email || "").toLowerCase() === fromUser.email.toLowerCase() || (fromUser.full_name && String(l.manager || "").trim().toLowerCase() === fromUser.full_name.trim().toLowerCase())).length : 0;

  const transfer = async () => {
    if(!fromUser || !toUser || fromUser.email === toUser.email) return;
    if(!window.confirm(`${tr(lang,"Передать всю базу")} ${fromUser.full_name || fromUser.email} → ${toUser.full_name || toUser.email}?\n${tr(lang,"Клиенты, объекты, запланированные события и сделки перейдут новому менеджеру. История сохранится.")}`)) return;
    setBusy(true); setResult(null);
    const {data,error} = await supabase.rpc("crm_transfer_manager_base", {p_from_email:fromUser.email, p_to_email:toUser.email});
    setBusy(false);
    if(error){ alert(tr(lang,"Не удалось передать базу") + ": " + error.message); return; }
    setResult(data); onChanged && onChanged();
  };

  const exportBase = async () => {
    try {
      const XLSX = await import(/* @vite-ignore */ "https://cdn.sheetjs.com/xlsx-0.20.3/package/xlsx.mjs");
      const rows = (leads || []).map(l => ({"Имя":l.name, "Телефон":l.phone, "Источник":l.source, "Этап":l.status, "Менеджер":l.manager, "Email менеджера":l.manager_email,
        "Следующий контакт":l.nextContact, "Заметки":l.notes, "Создан":String(l.created_at || "").slice(0,10)}));
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(rows), "Клиенты");
      XLSX.writeFile(wb, `CRM-klienty-${new Date().toISOString().slice(0,10)}.xlsx`);
    } catch(e){ alert(tr(lang,"Не удалось выгрузить базу") + ": " + (e.message || e)); }
  };

  const loadLog = async () => {
    setLogLoading(true);
    const {data,error} = await supabase.from("audit_log").select("*").order("created_at",{ascending:false}).limit(300);
    setLogLoading(false);
    if(error){ alert(tr(lang,"Журнал недоступен") + ": " + error.message); return; }
    setLog(data || []);
  };
  useEffect(() => { if(logOpen && !log.length) loadLog(); }, [logOpen]);

  const actors = [...new Set(log.map(r => r.actor_name || r.actor_email).filter(Boolean))].sort();
  const q = logSearch.trim().toLowerCase();
  const shownLog = log.filter(r => (logTable === "all" || r.table_name === logTable) && (logWho === "all" || (r.actor_name || r.actor_email) === logWho)
    && (!q || `${r.row_label || ""} ${r.actor_name || ""} ${JSON.stringify(r.changes || {})}`.toLowerCase().includes(q)));

  return <div className="card adminBase">
    <h3>{tr(lang,"Менеджер ушёл — база осталась")}</h3>
    <p className="muted">{tr(lang,"Клиенты, объекты и сделки принадлежат агентству. Передайте базу уволенного менеджера другому в один клик, затем закройте ему доступ в разделе «Доступы».")}</p>
    <div className="grid2">
      <Field label={tr(lang,"От кого")}><select className="input" value={fromEmail} onChange={e => { setFromEmail(e.target.value); setResult(null); }}>
        <option value="">{tr(lang,"Выберите менеджера")}</option>
        {staff.map(u => <option key={u.id} value={u.email}>{u.full_name || u.email}{(u.access === false || u.status === "blocked") ? ` · ${tr(lang,"доступ закрыт")}` : ""}</option>)}
      </select></Field>
      <Field label={tr(lang,"Кому")}><select className="input" value={toEmail} onChange={e => { setToEmail(e.target.value); setResult(null); }}>
        <option value="">{tr(lang,"Выберите менеджера")}</option>
        {staff.filter(u => u.email !== fromEmail && u.access !== false && u.status !== "blocked").map(u => <option key={u.id} value={u.email}>{u.full_name || u.email}</option>)}
      </select></Field>
    </div>
    {fromUser && <p className="muted">{tr(lang,"Клиентов у менеджера")}: <b>{fromLeads}</b> · {tr(lang,"также перейдут его объекты, запланированные события и сделки")}</p>}
    <Button className="full" onClick={transfer} disabled={busy || !fromUser || !toUser}>{busy ? tr(lang,"Передаём…") : tr(lang,"Передать базу")}</Button>
    {result && <div className="card amber" style={{marginTop:10}}>
      ✓ {tr(lang,"Передано")} {result.to}: {tr(lang,"клиентов")} {result.leads}, {tr(lang,"объектов")} {result.properties}, {tr(lang,"событий")} {result.events}, {tr(lang,"сделок")} {result.deals}.
    </div>}

    <div className="adminBaseRow">
      <Button variant="soft" onClick={exportBase}>{tr(lang,"Выгрузить базу клиентов (Excel)")}</Button>
      <Button variant="soft" onClick={() => setLogOpen(v => !v)}>{logOpen ? tr(lang,"Скрыть журнал") : tr(lang,"Журнал действий")}</Button>
    </div>
    <p className="muted" style={{fontSize:12}}>{tr(lang,"Выгрузка базы и журнал доступны только директору и тех. администратору. Записи журнала нельзя изменить или удалить.")}</p>

    {logOpen && <div className="auditBox">
      <div className="auditFilters">
        <select className="input" value={logTable} onChange={e => setLogTable(e.target.value)}><option value="all">{tr(lang,"Все разделы")}</option>{Object.entries(AUDIT_TABLES).map(([k,v]) => <option key={k} value={k}>{tr(lang,v)}</option>)}</select>
        <select className="input" value={logWho} onChange={e => setLogWho(e.target.value)}><option value="all">{tr(lang,"Все сотрудники")}</option>{actors.map(a => <option key={a} value={a}>{a}</option>)}</select>
        <input className="input" placeholder={tr(lang,"Поиск в журнале")} value={logSearch} onChange={e => setLogSearch(e.target.value)}/>
        <Button variant="soft" onClick={loadLog}>{logLoading ? "…" : "↻"}</Button>
      </div>
      {!logLoading && shownLog.length === 0 && <p className="muted">{tr(lang,"Записей пока нет. Журнал ведётся с момента включения.")}</p>}
      {shownLog.map(r => {
        const ch = r.changes || {};
        const fields = r.action === "update" ? Object.entries(ch).filter(([k]) => AUDIT_FIELDS[k]).slice(0,4) : [];
        return <div key={r.id} className="auditRow">
          <div className="auditHead"><b>{r.actor_name || r.actor_email || tr(lang,"Система")}</b> {tr(lang, AUDIT_ACTIONS[r.action] || r.action)} {tr(lang, (AUDIT_TABLES[r.table_name] || r.table_name).toLowerCase())} <b>«{r.row_label || "#" + r.row_id}»</b></div>
          {fields.map(([k,[a,b]]) => <div key={k} className="auditChange">{tr(lang,AUDIT_FIELDS[k])}: <s>{auditValue(a)}</s> → {auditValue(b)}</div>)}
          {r.action === "update" && !fields.length && <div className="auditChange">{Object.keys(ch).slice(0,4).join(", ")}</div>}
          <small>{new Date(r.created_at).toLocaleString("ru-RU")}</small>
        </div>;
      })}
    </div>}
  </div>;
}

function More({role,setRole,setPage,theme,setTheme,lang,setLang,leads,setLeads,users,currentProfile,onLogout,agencyName,onLeadsImported,onOpenLead}) {
  const isTech = role === "Администратор тех отдел";
  const [agencyBrand,setAgencyBrand] = useState(()=>loadAgencyBrand(currentProfile?.agency_id));
  const updateBrand=(patch)=>{const next={...agencyBrand,...patch};setAgencyBrand(next);saveAgencyBrand(currentProfile?.agency_id,next);};
  const uploadAgencyLogo=async(file)=>{if(!file)return;const path=`agency-brand/${currentProfile?.agency_id||"default"}/${Date.now()}-${file.name.replace(/[^a-zA-Z0-9._-]/g,"_")}`;const up=await uploadToFirstAvailableBucket(["agency-assets","presentations","property_media"],path,file,{upsert:true});if(up?.publicUrl){updateBrand({logo_url:up.publicUrl});supabase.rpc("crm_set_agency_logo",{p_url:up.publicUrl}).then(({error})=>{if(error)console.warn(error.message);else{sharedAgencyLogos[String(currentProfile?.agency_id||"")]=up.publicUrl;}});}else{const r=new FileReader();r.onload=()=>updateBrand({logo_url:r.result});r.readAsDataURL(file);}};

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
      <div className="themeMain">
        {[["nightGold","Чёрная с жёлтым","#0E0E10","#F5C518"],["classic","Белая с жёлтым","#FFFFFF","#d6a500"]].map(([id,label,bg,ac])=><button key={id} className={cn("themeMainBtn", theme===id && "on")} onClick={()=>{setTheme(id); if(currentProfile?.id) supabase.from("users").update({theme:id}).eq("id", currentProfile.id);}}>
          <span className="themeSwatch" style={{background:bg}}><i style={{background:ac}}></i></span><b>{tr(lang,label)}</b>{theme===id && <em>✓</em>}
        </button>)}
      </div>
      <p className="muted" style={{margin:"14px 0 8px",fontWeight:800}}>{tr(lang,"Другие цвета")}</p>
      <div className="grid3">
        {themeOptions.filter(t=>!["nightGold","classic"].includes(t.id)).map(t=><Button key={t.id} variant={theme===t.id ? "primary" : "soft"} onClick={()=>{setTheme(t.id); if(currentProfile?.id) supabase.from("users").update({theme:t.id}).eq("id", currentProfile.id);}}>{t.name}</Button>)}
      </div>
    </div>

    {(isTech || role === "Администратор директор") && <AgencyBaseAdmin users={users} leads={leads} currentProfile={currentProfile} role={role} lang={lang} onChanged={onLeadsImported}/>}

    {isTech && <div className="card">
      <h3>Брендинг и названия агентства</h3>
      <p className="muted">Настройки действуют только для агентства: <b>{agencyName || currentProfile?.agency_name || "CRM Real Estate"}</b>. Они используются в VIP-презентациях и позволяют адаптировать CRM под другое агентство.</p>
      <div className="grid2"><label className="field"><span>Логотип агентства</span><input className="input" type="file" accept="image/*" onChange={e=>uploadAgencyLogo(e.target.files?.[0])}/></label>{agencyBrand.logo_url&&<div><img src={agencyBrand.logo_url} alt="Логотип" style={{maxWidth:180,maxHeight:90,objectFit:"contain"}}/><Button variant="soft" onClick={()=>updateBrand({logo_url:""})}>Убрать логотип</Button></div>}</div>
      <h3 style={{marginTop:20}}>Свои названия CRM</h3><p className="muted">Можно переименовать разделы, кнопки и районы. Формат: исходное название → своё название.</p>
      <textarea className="input" style={{minHeight:150}} placeholder={'Вторичка=Объекты агентства\nДобавить объект=Новый объект\nАркадия=Аркадия / море'} value={agencyBrand.rename_text||""} onChange={e=>updateBrand({rename_text:e.target.value})}/>
      <p className="muted">Изменения применяются после сохранения автоматически и не меняют структуру базы данных.</p>
    </div>}

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

    <LeadImport role={role} users={users} currentProfile={currentProfile} leads={leads} onImported={onLeadsImported} onOpenLead={onOpenLead}/>

    {role==="Менеджер по продажам"&&<div className="card amber">Менеджеру доступны рабочие разделы, язык, цветовая гамма и личная аналитика.</div>}
  </main>;
}



const MARKET_DEAL_TYPES=["Продажа","Долгосрочная аренда","Посуточная аренда"];
const MARKET_SOURCE_TYPES=["API","XML","RSS","WEB","CSV"];
function marketMoney(v,c="USD"){const n=Number(v);if(!Number.isFinite(n))return"—";try{return new Intl.NumberFormat("ru-RU",{style:"currency",currency:c,maximumFractionDigits:0}).format(n)}catch{return`${n.toLocaleString("ru-RU")} ${c}`}}


function AnalyticsWorkspace({lang,currentProfile,properties=[],leads=[],onOpenProperty,agencyName,theme}){
  const [section,setSection]=useState("market");

  return <main className="screen">
    <div className="card dark" style={{padding:24,borderRadius:24}}>
      <div className="row" style={{alignItems:"center",gap:16,flexWrap:"wrap"}}>
        <section>
          <div style={{fontSize:12,fontWeight:900,letterSpacing:1.6,opacity:.7}}>REAL ESTATE MARKET INTELLIGENCE</div>
          <h2 style={{margin:"6px 0 4px"}}>Аналитика</h2>
          <p style={{margin:0}}>Быстрый анализ рынка, подбор вариантов клиенту и управление источниками.</p>
        </section>
        <div className="row" style={{justifyContent:"flex-start",gap:10,flexWrap:"wrap"}}>
          <Button variant={section==="market"?"primary":"soft"} onClick={()=>setSection("market")}>📊 Аналитика рынка</Button>
          <Button variant={section==="sources"?"primary":"soft"} onClick={()=>setSection("sources")}>🔌 Источники и подключения</Button>
        </div>
      </div>
    </div>

    {section==="market"&&
      <MarketAnalyticsV2
        leads={leads}
        properties={properties}
        currentProfile={currentProfile}
        onOpenProperty={onOpenProperty}
        agencyName={agencyName}
        theme={theme}
        lang={lang}
      />
    }

    {section==="sources"&&
      <MarketTools
        lang={lang}
        currentProfile={currentProfile}
        properties={properties}
        initialTab="sources"
        hideMarketTab={true}
      />
    }
  </main>;
}

function MarketTools({lang,currentProfile,properties=[],initialTab="market",hideMarketTab=false}){
  const role=currentProfile?.role||"";
  const isTech=role==="Администратор тех отдел"||/тех|tech/i.test(role);
  const agencyId=currentProfile?.agency_id||"default";

  const [tab,setTab]=useState(initialTab);
  const [deal,setDeal]=useState("Продажа");
  const [filters,setFilters]=useState({
    country:"Украина",city:"Одесса",district:"",rooms:"",
    priceFrom:"",priceTo:"",areaFrom:"",areaTo:"",currency:"USD"
  });

  const [sourcesX,setSourcesX]=useState([]);
  const [channels,setChannels]=useState([]);
  const [externalListings,setExternalListings]=useState([]);
  const [loadingMarket,setLoadingMarket]=useState(false);
  const [marketDbReady,setMarketDbReady]=useState(true);
  const [syncingMarket,setSyncingMarket]=useState(false);
  const [marketSyncResult,setMarketSyncResult]=useState(null);
  const [marketSyncLogs,setMarketSyncLogs]=useState([]);
  const [lastMarketSyncAt,setLastMarketSyncAt]=useState(null);

  const [sf,setSf]=useState({
    name:"",country:"Украина",type:"API",url:"",enabled:true
  });
  const [catalogCountry,setCatalogCountry]=useState("Украина");
  const [catalogSearch,setCatalogSearch]=useState("");
  const [cf,setCf]=useState({
    name:"",url:"",country:"Украина",city:"",enabled:true
  });

  const [listingForm,setListingForm]=useState({
    title:"",deal_type:"Продажа",country:"Украина",city:"Одесса",district:"",
    rooms:"",price:"",area:"",currency:"USD",source_name:"",source_url:"",
    description:""
  });

  const marketStorageKey=`crm_market_tools_${agencyId}`;

  function saveLocalMarketFallback(nextSources,nextChannels){
    // Не кэшируем объявления рынка в браузере: десятки тысяч карточек больше не забивают память/localStorage.
    try{
      localStorage.setItem(marketStorageKey,JSON.stringify({
        sources:nextSources??sourcesX,
        channels:nextChannels??channels
      }));
    }catch{}
  }

  function loadLocalMarketFallback(){
    try{
      const x=JSON.parse(localStorage.getItem(marketStorageKey)||"{}");
      if(Array.isArray(x.sources)) setSourcesX(x.sources);
      if(Array.isArray(x.channels)) setChannels(x.channels);
      setExternalListings([]);
    }catch{ setExternalListings([]); }
  }

  useEffect(()=>{
    // При новом открытии/обновлении страницы старый рыночный кэш удаляется. Источник истины — Supabase.
    clearAnalyticsMarketCache();
  },[agencyId]);

  async function loadMarketData(){
    setLoadingMarket(true);
    try{
      const allRowsPromise=(async()=>{
        // В разделе подключений тоже не собираем всю базу в один JSON на стороне Postgres:
        // читаем последовательно страницами, чтобы не блокировать БД на 20–80 секунд.
        const rows=[];let lastId=null;const pageSize=1000;
        while(true){
          let q=supabase.from("market_listings").select("*").eq("agency_id",agencyId).order("id",{ascending:true}).limit(pageSize);
          if(lastId!==null)q=q.gt("id",lastId);
          const {data,error}=await q;
          if(error)return {data:null,error};
          const batch=data||[];
          if(!batch.length)break;
          rows.push(...batch);
          const nextId=batch[batch.length-1]?.id;
          if(nextId===null||nextId===undefined||String(nextId)===String(lastId))break;
          lastId=nextId;
          if(batch.length<pageSize)break;
        }
        return {data:[...new Map(rows.map(x=>[String(x.id),x])).values()],error:null};
      })();
      const [srcRes,listRes]=await Promise.all([
        supabase.from("market_sources").select("*").eq("agency_id",agencyId).order("created_at",{ascending:false}),
        allRowsPromise
      ]);

      const missingTable = [srcRes.error,listRes.error].some(e => e && /does not exist|relation .* does not exist|42P01/i.test(e.message||""));
      if(missingTable){
        setMarketDbReady(false);
        loadLocalMarketFallback();
        return;
      }

      if(srcRes.error) throw srcRes.error;
      if(listRes.error) throw listRes.error;

      setMarketDbReady(true);
      const allSources=(srcRes.data||[]);
      setSourcesX(allSources.filter(s=>s.source_type!=="TELEGRAM"));
      setChannels(allSources.filter(s=>s.source_type==="TELEGRAM"));
      setExternalListings(listRes.data||[]);
    }catch(e){
      console.warn("Market tools Supabase load error:",e);
      setMarketDbReady(false);
      setExternalListings([]);
    }finally{
      setLoadingMarket(false);
    }
  }

  async function loadMarketSyncHistory(){
    if(!agencyId || agencyId==="default") return;
    try{
      const {data,error}=await supabase
        .from("market_sync_log")
        .select("*")
        .eq("agency_id",agencyId)
        .order("created_at",{ascending:false})
        .limit(20);

      if(error){
        if(!/does not exist|relation .* does not exist|42P01/i.test(error.message||"")){
          console.warn("Market sync log:",error);
        }
        return;
      }

      const rows=data||[];
      setMarketSyncLogs(rows);
      const latest=rows.find(x=>x.finished_at||x.created_at);
      setLastMarketSyncAt(latest?.finished_at||latest?.created_at||null);
    }catch(e){
      console.warn("Market sync history:",e);
    }
  }

  useEffect(()=>{
    loadMarketData();
    loadMarketSyncHistory();
  },[agencyId]);

  function normalizeListing(x, origin="external"){
    return {
      id:String(x.id||`${origin}-${Date.now()}-${Math.random()}`),
      title:x.title||"Объект",
      deal_type:x.deal_type||"Продажа",
      country:x.country||"",
      city:x.city||"",
      district:x.district||"",
      rooms:x.rooms??"",
      price:Number(x.price)||0,
      area:Number(x.area)||0,
      currency:x.currency||"USD",
      description:x.description||"",
      source_name:x.source_name||x.name||"Источник",
      source_url:x.source_url||x.url||"",
      published_at:x.published_at||x.created_at||null,
      updated_at:x.updated_at||x.created_at||null,
      origin
    };
  }

  const internalListings=useMemo(()=>properties.map(p=>normalizeListing({
    id:`crm-${p.id}`,
    title:p.title,
    deal_type:p.deal_type||p.operation_type||"Продажа",
    country:p.country||filters.country||"",
    city:p.city||filters.city||"",
    district:p.district||"",
    rooms:p.rooms||String(p.type||"").match(/\d+/)?.[0]||"",
    price:p.price,
    area:p.area,
    currency:p.currency||"USD",
    description:p.description||"",
    source_name:"CRM",
    source_url:"",
    updated_at:p.updated_at||p.created_at||null
  },"crm")),[properties]);

  const allListings=useMemo(
    ()=>[...internalListings,...externalListings.map(x=>normalizeListing(x,"external"))],
    [internalListings,externalListings]
  );

  const filteredListings=useMemo(()=>{
    const minP=Number(filters.priceFrom)||0;
    const maxP=Number(filters.priceTo)||Infinity;
    const minA=Number(filters.areaFrom)||0;
    const maxA=Number(filters.areaTo)||Infinity;

    return allListings.filter(p=>{
      const hay=`${p.title} ${p.country} ${p.city} ${p.district} ${p.description}`.toLowerCase();
      return (
        (!deal || p.deal_type===deal) &&
        (!filters.country || String(p.country||"").toLowerCase().includes(filters.country.toLowerCase())) &&
        (!filters.city || String(p.city||"").toLowerCase().includes(filters.city.toLowerCase())) &&
        (!filters.district || hay.includes(filters.district.toLowerCase())) &&
        (!filters.rooms || String(p.rooms||"")===String(filters.rooms)) &&
        p.price>=minP && p.price<=maxP &&
        p.area>=minA && p.area<=maxA
      );
    });
  },[allListings,filters,deal]);

  const stats=useMemo(()=>{
    const prices=filteredListings.map(x=>Number(x.price)).filter(x=>x>0).sort((a,b)=>a-b);
    const sqm=filteredListings.map(x=>x.area>0?x.price/x.area:0).filter(x=>x>0).sort((a,b)=>a-b);
    const avg=a=>a.length?Math.round(a.reduce((s,x)=>s+x,0)/a.length):0;
    const median=a=>a.length?a[Math.floor((a.length-1)/2)]:0;

    const districtMap={};
    filteredListings.forEach(x=>{
      const k=x.district||"Без района";
      districtMap[k]=(districtMap[k]||0)+1;
    });
    const topDistrict=Object.entries(districtMap).sort((a,b)=>b[1]-a[1])[0]?.[0]||"—";
    const averagePrice=avg(prices);
    const belowMarket=filteredListings.filter(x=>averagePrice>0 && x.price>0 && x.price<=averagePrice*0.9);

    return {
      count:filteredListings.length,
      avg:averagePrice,
      median:median(prices),
      sqm:avg(sqm),
      topDistrict,
      belowMarket
    };
  },[filteredListings]);

  async function persistSource(row){
    if(!marketDbReady){
      const next=row.source_type==="TELEGRAM"
        ? [row,...channels]
        : [row,...sourcesX];
      if(row.source_type==="TELEGRAM"){setChannels(next);saveLocalMarketFallback(sourcesX,next,externalListings);}
      else {setSourcesX(next);saveLocalMarketFallback(next,channels,externalListings);}
      return true;
    }
    const sourceType=String(row.source_type||"MANUAL").toUpperCase();
    const connectionMethod=sourceType==="TELEGRAM"
      ? "TELEGRAM"
      : ["API","XML","RSS","CSV","WEB","HTML"].includes(sourceType)
        ? sourceType
        : "MANUAL";

    const payload={
      agency_id:agencyId,
      name:row.name,
      country:row.country||"",
      city:row.city||"",
      source_type:sourceType,
      endpoint_url:row.endpoint_url||"",
      enabled:row.enabled!==false,
      config:row.config||{},
      connector_key:sourceType==="TELEGRAM"?"telegram":`generic_${connectionMethod.toLowerCase()}`,
      source_category:sourceType==="TELEGRAM"?"telegram":"real_estate_portal",
      connection_method:connectionMethod,
      sync_mode:sourceType==="CSV"||connectionMethod==="MANUAL"?"manual":"scheduled",
      auth_type:sourceType==="TELEGRAM"?"telegram_session":"none",
      connection_status:"not_checked",
      paused:false
    };
    const {data,error}=await supabase.from("market_sources").insert(payload).select().single();
    if(error){alert("Не удалось сохранить источник: "+error.message);return false;}
    if(data.source_type==="TELEGRAM") setChannels(x=>[data,...x]);
    else setSourcesX(x=>[data,...x]);
    return true;
  }

  async function addSource(){
    if(!sf.name.trim()||!sf.url.trim()) return alert("Укажи название и адрес источника.");
    const ok=await persistSource({
      id:`SRC-${Date.now()}`,name:sf.name.trim(),country:sf.country.trim(),
      source_type:sf.type,endpoint_url:sf.url.trim(),enabled:true
    });
    if(ok) setSf({...sf,name:"",url:""});
  }

  async function connectCatalogSource(entry){
    if(!entry?.url) return alert("Для этого источника нужна индивидуальная ссылка или авторизация. Добавь её вручную ниже.");
    const already=[...sourcesX,...channels].some(x=>String(x.name||"").toLowerCase()===String(entry.name||"").toLowerCase()&&String(x.country||"")===String(entry.country||""));
    if(already) return alert(`Источник «${entry.name}» для страны «${entry.country}» уже подключён.`);
    const ok=await persistSource({id:`CAT-${Date.now()}`,name:entry.name,country:entry.country,source_type:entry.method||"WEB",endpoint_url:entry.url,enabled:true,config:{catalog:true}});
    if(ok) alert(`Источник «${entry.name}» добавлен. Теперь запусти «Обновить рынок».`);
  }

  async function addChannel(){
    if(!cf.name.trim()||!cf.url.trim()) return alert("Укажи название и ссылку Telegram-канала.");
    const ok=await persistSource({
      id:`TG-${Date.now()}`,name:cf.name.trim(),country:cf.country.trim(),city:cf.city.trim(),
      source_type:"TELEGRAM",endpoint_url:cf.url.trim(),enabled:true
    });
    if(ok) setCf({...cf,name:"",url:""});
  }

  async function toggleSource(item){
    if(!marketDbReady){
      if(item.source_type==="TELEGRAM"){
        const next=channels.map(x=>x.id===item.id?{...x,enabled:!x.enabled}:x);
        setChannels(next);saveLocalMarketFallback(sourcesX,next,externalListings);
      }else{
        const next=sourcesX.map(x=>x.id===item.id?{...x,enabled:!x.enabled}:x);
        setSourcesX(next);saveLocalMarketFallback(next,channels,externalListings);
      }
      return;
    }
    const {error}=await supabase.from("market_sources").update({enabled:!item.enabled}).eq("id",item.id).eq("agency_id",agencyId);
    if(error) return alert(error.message);
    loadMarketData();
  }

  async function removeSource(item){
    if(!confirm(`Удалить источник «${item.name}»?`)) return;
    if(!marketDbReady){
      if(item.source_type==="TELEGRAM"){
        const next=channels.filter(x=>x.id!==item.id);setChannels(next);saveLocalMarketFallback(sourcesX,next,externalListings);
      }else{
        const next=sourcesX.filter(x=>x.id!==item.id);setSourcesX(next);saveLocalMarketFallback(next,channels,externalListings);
      }
      return;
    }
    const {error}=await supabase.from("market_sources").delete().eq("id",item.id).eq("agency_id",agencyId);
    if(error) return alert(error.message);
    loadMarketData();
  }

  async function addExternalListing(){
    if(!listingForm.title.trim()) return alert("Укажи название объекта.");
    if(!listingForm.source_url.trim()) return alert("Добавь ссылку на исходное объявление.");

    const row={
      id:`LOCAL-${Date.now()}`,
      agency_id:agencyId,
      ...listingForm,
      rooms:listingForm.rooms?Number(listingForm.rooms):null,
      price:Number(listingForm.price)||0,
      area:Number(listingForm.area)||0,
      updated_at:new Date().toISOString()
    };

    if(!marketDbReady){
      const next=[row,...externalListings];
      setExternalListings(next);saveLocalMarketFallback(sourcesX,channels,next);
    }else{
      const {error}=await supabase.from("market_listings").insert({
        agency_id:agencyId,
        external_id:null,
        source_name:row.source_name||"Ручной источник",
        source_url:row.source_url,
        deal_type:row.deal_type,
        title:row.title,
        country:row.country,
        city:row.city,
        district:row.district,
        rooms:row.rooms,
        price:row.price,
        area:row.area,
        currency:row.currency,
        description:row.description,
        raw_data:{manual:true}
      });
      if(error) return alert("Ошибка добавления объекта: "+error.message);
      await loadMarketData();
    }

    setListingForm({
      title:"",deal_type:deal,country:filters.country||"",city:filters.city||"",
      district:"",rooms:"",price:"",area:"",currency:filters.currency||"USD",
      source_name:"",source_url:"",description:""
    });
  }

  async function importMarketCsv(file){
    if(!file) return;
    const raw=await file.text();
    const lines=raw.split(/\r?\n/).filter(Boolean);
    if(lines.length<2) return alert("Файл пустой.");

    const delimiter=(lines[0].split(";").length>lines[0].split(",").length)?";":",";
    const headers=lines[0].split(delimiter).map(x=>x.trim().toLowerCase());
    const get=(cols,names)=>{
      for(const n of names){const i=headers.indexOf(n);if(i>=0)return cols[i]?.trim()||"";}
      return "";
    };

    const parsed=lines.slice(1).map(line=>{
      const c=line.split(delimiter);
      return {
        agency_id:agencyId,
        external_id:get(c,["external_id","id"]),
        source_name:get(c,["source_name","source","источник"])||"CSV",
        source_url:get(c,["source_url","url","link","ссылка"]),
        deal_type:get(c,["deal_type","operation","тип сделки"])||deal,
        title:get(c,["title","name","название"])||"Объект",
        country:get(c,["country","страна"])||filters.country,
        city:get(c,["city","город"])||filters.city,
        district:get(c,["district","район"]),
        rooms:Number(get(c,["rooms","комнаты"]))||null,
        price:Number(String(get(c,["price","цена"])).replace(/[^\d.]/g,""))||0,
        area:Number(String(get(c,["area","площадь"])).replace(/[^\d.]/g,""))||0,
        currency:get(c,["currency","валюта"])||filters.currency,
        description:get(c,["description","описание"]),
        raw_data:{imported_from_csv:true}
      };
    }).filter(x=>x.source_url||x.title);

    if(!parsed.length) return alert("Не удалось распознать строки.");

    if(!marketDbReady){
      const next=[...parsed.map((x,i)=>({...x,id:`CSV-${Date.now()}-${i}`,updated_at:new Date().toISOString()})),...externalListings];
      setExternalListings(next);saveLocalMarketFallback(sourcesX,channels,next);
      alert(`Импортировано локально: ${parsed.length}`);
      return;
    }

    const {error}=await supabase.from("market_listings").insert(parsed);
    if(error) return alert("Ошибка импорта: "+error.message);
    alert(`Импортировано: ${parsed.length}`);
    await loadMarketData();
  }

  async function syncMarketSources(){
    if(!marketDbReady) return alert("Сначала подключи таблицы аналитики в Supabase.");
    if(!agencyId || agencyId==="default") return alert("Не удалось определить агентство.");

    setSyncingMarket(true);
    setMarketSyncResult(null);

    try{
      const {data,error}=await supabase.functions.invoke("market-sync",{
        body:{
          agency_id:Number(agencyId),
          sync_all:true
        }
      });

      if(error) throw error;
      if(!data) throw new Error("Функция не вернула результат.");

      setMarketSyncResult(data);
      await Promise.all([
        loadMarketData(),
        loadMarketSyncHistory()
      ]);

      if(data.success===false){
        alert(data.error||data.message||"Обновление рынка завершилось с ошибкой.");
      }
    }catch(e){
      const message=e?.message||String(e);
      setMarketSyncResult({success:false,error:message,processed:0,failed:1,results:[]});
      alert("Не удалось обновить рынок: "+message);
    }finally{
      setSyncingMarket(false);
    }
  }

  function syncStatusLabel(status){
    const labels={
      completed:"Готово",
      failed:"Ошибка",
      cancelled:"Отменено",
      connector_not_configured:"Коннектор ожидает подключения",
      manual_source:"Ручной источник",
      manual_import:"Ручной импорт",
      connected:"Подключен",
      warning:"Требует настройки",
      error:"Ошибка",
      never:"Ещё не запускался",
      not_checked:"Не проверен"
    };
    return labels[status]||status||"—";
  }

  function formatSyncDate(value){
    if(!value) return "Ещё не обновлялось";
    const date=new Date(value);
    return Number.isNaN(date.getTime())?"Ещё не обновлялось":date.toLocaleString("ru-RU");
  }

  const sourceCount=sourcesX.filter(x=>x.enabled).length+channels.filter(x=>x.enabled).length;
  const syncResults=Array.isArray(marketSyncResult?.results)?marketSyncResult.results:[];

  return <div>
    <div className="card amber">
      <div className="row">
        <div>
          <h2>Аналитика · Рынок недвижимости</h2>
          <p className="muted">Продажа и аренда · любые страны · внешние объявления со ссылками · Telegram · аналитика.</p>
        </div>
        <span className="badge gold">{sourceCount} активно</span>
      </div>
      {!marketDbReady&&<div className="card" style={{marginTop:10}}>
        <b>Режим настройки</b>
        <p className="muted" style={{marginBottom:0}}>
          Таблицы рыночной аналитики в Supabase ещё не созданы. Интерфейс работает через локальное сохранение.
          После запуска подготовленного SQL все источники и объекты будут храниться централизованно для конкретного агентства.
        </p>
      </div>}
      <div className="row" style={{justifyContent:"flex-start",flexWrap:"wrap"}}>
        {(hideMarketTab
          ? [["sources","Источники"],["telegram","Telegram-каналы"],["import","Объекты рынка"],["ai","AI Аналитик"]]
          : [["market","Аналитика рынка"],["sources","Источники"],["telegram","Telegram-каналы"],["import","Объекты рынка"],["ai","AI Аналитик"]])
          .map(([k,n])=><Button key={k} variant={tab===k?"primary":"soft"} onClick={()=>setTab(k)}>{n}</Button>)}
      </div>
    </div>

    <div className="card" style={{
      border:"1.5px solid color-mix(in srgb, var(--accent) 38%, #d1d5db)",
      background:"linear-gradient(135deg,color-mix(in srgb,var(--soft) 72%,var(--card)),var(--card))"
    }}>
      <div className="row" style={{alignItems:"center",gap:14,flexWrap:"wrap"}}>
        <div style={{flex:"1 1 360px"}}>
          <h3 style={{margin:"0 0 5px"}}>Обновление рынка</h3>
          <p className="muted" style={{margin:0}}>
            Запускает все активные источники агентства через облачную функцию Supabase.
            Последнее обновление: <b>{formatSyncDate(lastMarketSyncAt)}</b>
          </p>
        </div>
        <Button
          onClick={syncMarketSources}
          disabled={syncingMarket||!marketDbReady||sourceCount===0}
          style={{
            minHeight:52,
            minWidth:220,
            fontWeight:900,
            boxShadow:"0 12px 28px color-mix(in srgb,var(--accent) 30%,transparent)"
          }}
        >
          {syncingMarket?"⏳ Обновляем рынок...":"🔄 Обновить рынок"}
        </Button>
      </div>

      {sourceCount===0&&<p className="muted" style={{marginBottom:0}}>
        Сначала добавь хотя бы один активный источник.
      </p>}

      {marketSyncResult&&<div className="card" style={{marginTop:14}}>
        <div className="row" style={{flexWrap:"wrap"}}>
          <div>
            <b>{marketSyncResult.success!==false?"Запуск завершён":"Запуск завершён с ошибкой"}</b>
            <div className="muted">{marketSyncResult.message||marketSyncResult.error||"Результат получен."}</div>
          </div>
          <span className={cn("badge",marketSyncResult.success!==false?"gold":"")}>
            Обработано: {Number(marketSyncResult.processed||0)}
          </span>
          <span className="badge">Ошибок: {Number(marketSyncResult.failed||0)}</span>
          {marketSyncResult.job_id&&<span className="badge">Задание № {marketSyncResult.job_id}</span>}
        </div>

        {!!syncResults.length&&<div style={{marginTop:10}}>
          {syncResults.map((item,index)=><div className="dealRow" key={`${item.source_id||index}-${index}`}>
            <div style={{minWidth:0}}>
              <b>{item.source_name||"Источник"}</b>
              <div className="muted">{item.message||"Без дополнительного сообщения"}</div>
            </div>
            <span className="badge">{item.connector||"—"}</span>
            <span className={cn("badge",item.success!==false?"gold":"")}>
              {syncStatusLabel(item.status)}
            </span>
          </div>)}
        </div>}
      </div>}

      {!!marketSyncLogs.length&&<details style={{marginTop:14}}>
        <summary style={{cursor:"pointer",fontWeight:900}}>
          История обновлений ({marketSyncLogs.length})
        </summary>
        <div style={{marginTop:10}}>
          {marketSyncLogs.slice(0,10).map(log=><div className="dealRow" key={log.id}>
            <div>
              <b>{log.source_name||"Источник"}</b>
              <div className="muted">{formatSyncDate(log.finished_at||log.created_at)}</div>
            </div>
            <span className="badge">{log.source_type||"—"}</span>
            <span className={cn("badge",log.status==="completed"?"gold":"")}>
              {syncStatusLabel(log.status)}
            </span>
            <span>Найдено: {Number(log.listings_found||0)}</span>
            <span>Добавлено: {Number(log.listings_created||0)}</span>
            {log.error_message?<span style={{color:"#b91c1c"}}>{log.error_message}</span>:<span/>}
          </div>)}
        </div>
      </details>}
    </div>

    {tab==="market"&&<>
      <div className="card">
        <div className="row" style={{justifyContent:"flex-start",flexWrap:"wrap"}}>
          {MARKET_DEAL_TYPES.map(x=><Button key={x} variant={deal===x?"primary":"soft"} onClick={()=>setDeal(x)}>{x}</Button>)}
        </div>
        <div className="grid2">
          <Field label="Страна"><input value={filters.country} onChange={e=>setFilters({...filters,country:e.target.value})}/></Field>
          <Field label="Город"><input value={filters.city} onChange={e=>setFilters({...filters,city:e.target.value})}/></Field>
          <Field label="Район / ЖК / улица"><input value={filters.district} onChange={e=>setFilters({...filters,district:e.target.value})}/></Field>
          <Field label="Комнат"><input type="number" value={filters.rooms} onChange={e=>setFilters({...filters,rooms:e.target.value})}/></Field>
          <Field label="Цена от"><input type="number" value={filters.priceFrom} onChange={e=>setFilters({...filters,priceFrom:e.target.value})}/></Field>
          <Field label="Цена до"><input type="number" value={filters.priceTo} onChange={e=>setFilters({...filters,priceTo:e.target.value})}/></Field>
          <Field label="Площадь от, м²"><input type="number" value={filters.areaFrom} onChange={e=>setFilters({...filters,areaFrom:e.target.value})}/></Field>
          <Field label="Площадь до, м²"><input type="number" value={filters.areaTo} onChange={e=>setFilters({...filters,areaTo:e.target.value})}/></Field>
        </div>
      </div>

      <div className="grid3">
        <div className="card"><span className="muted">Найдено</span><h2>{stats.count}</h2></div>
        <div className="card"><span className="muted">Средняя цена</span><h2>{marketMoney(stats.avg,filters.currency)}</h2></div>
        <div className="card"><span className="muted">Медиана</span><h2>{marketMoney(stats.median,filters.currency)}</h2></div>
        <div className="card"><span className="muted">Средняя цена м²</span><h2>{marketMoney(stats.sqm,filters.currency)}</h2></div>
        <div className="card"><span className="muted">Самый активный район</span><h2>{stats.topDistrict}</h2></div>
        <div className="card"><span className="muted">Ниже средней на 10%+</span><h2>{stats.belowMarket.length}</h2></div>
      </div>

      <div className="card">
        <div className="row"><h3>Конкретные объекты · {deal}</h3><span className="badge">{filteredListings.length}</span></div>
        {filteredListings.length?filteredListings.slice(0,300).map(p=><div className="dealRow" key={`${p.origin}-${p.id}`}>
          <div style={{minWidth:0}}>
            <b>{p.title}</b>
            <div className="muted">{[p.city,p.district].filter(Boolean).join(" · ")||"—"}</div>
            <div className="muted">{p.source_name}{p.updated_at?` · обновлено ${new Date(p.updated_at).toLocaleDateString("ru-RU")}`:""}</div>
          </div>
          <b>{marketMoney(p.price,p.currency||filters.currency)}</b>
          <span>{p.area||"—"} м²</span>
          <span>{p.rooms||"—"} комн.</span>
          <span className="badge gold">{p.origin==="crm"?"CRM":"Внешний источник"}</span>
          {p.source_url
            ? <a className="btn soft" href={p.source_url} target="_blank" rel="noopener noreferrer">Открыть оригинал</a>
            : <Button variant="soft" onClick={()=>alert("Объект находится внутри CRM.")}>Открыть</Button>}
        </div>):<p className="muted">По выбранным параметрам объектов пока нет.</p>}
      </div>
    </>}

    {tab==="sources"&&<div className="card">
      <h3>Источники данных</h3>
      <p className="muted">Техотдел добавляет источники отдельно для каждого агентства и любой страны. Здесь хранится конфигурация; реальный автоматический сбор подключается адаптером конкретной площадки.</p>
      <div style={{margin:"14px 0 20px",padding:18,borderRadius:18,border:"1px solid color-mix(in srgb,var(--accent) 28%,#d1d5db)",background:"color-mix(in srgb,var(--soft) 58%,var(--card))"}}>
        <div className="row" style={{alignItems:"flex-end",gap:12,flexWrap:"wrap"}}>
          <section><h3 style={{margin:"0 0 4px"}}>Каталог рекламных площадок</h3><p className="muted" style={{margin:0}}>Выбери страну и подключи площадку. Названия, страна и базовый URL заполнятся автоматически.</p></section>
          <select className="input" style={{maxWidth:250}} value={catalogCountry} onChange={e=>setCatalogCountry(e.target.value)}>{Array.from(new Set(analyticsSourceCatalog.map(x=>x.country))).sort((a,b)=>a.localeCompare(b,"ru")).map(x=><option key={x}>{x}</option>)}</select>
        </div>
        <input className="input" style={{marginTop:12}} value={catalogSearch} onChange={e=>setCatalogSearch(e.target.value)} placeholder="Поиск площадки: DIM.RIA, MyHome.ge, idealista, Bayut..."/>
        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(220px,1fr))",gap:10,marginTop:12}}>
          {analyticsSourceCatalog.filter(x=>x.country===catalogCountry&&(!catalogSearch.trim()||`${x.name} ${x.aliases?.join(" ")||""}`.toLowerCase().includes(catalogSearch.trim().toLowerCase()))).map(entry=>{const connected=[...sourcesX,...channels].some(x=>String(x.name||"").toLowerCase()===entry.name.toLowerCase()&&String(x.country||"")===entry.country);return <div key={`${entry.country}-${entry.name}`} style={{padding:14,borderRadius:14,border:"1px solid color-mix(in srgb,var(--accent) 25%,#d1d5db)",background:"var(--card)"}}><b style={{display:"block",fontSize:16,color:"var(--text)"}}>{entry.name}</b><span className="muted" style={{fontSize:12}}>{entry.country} · {entry.method}</span><Button variant={connected?"soft":"primary"} className="full" style={{marginTop:10}} disabled={connected||!isTech} onClick={()=>connectCatalogSource(entry)}>{connected?"✓ Подключен":"＋ Подключить"}</Button></div>})}
        </div>
      </div>
      {isTech&&<>
        <div className="grid2">
          <Field label="Название"><input value={sf.name} onChange={e=>setSf({...sf,name:e.target.value})}/></Field>
          <Field label="Страна"><input value={sf.country} onChange={e=>setSf({...sf,country:e.target.value})}/></Field>
          <Field label="Тип"><select value={sf.type} onChange={e=>setSf({...sf,type:e.target.value})}>{MARKET_SOURCE_TYPES.map(x=><option key={x}>{x}</option>)}</select></Field>
          <Field label="API / XML / RSS / URL"><input value={sf.url} onChange={e=>setSf({...sf,url:e.target.value})}/></Field>
        </div>
        <Button className="full" onClick={addSource}>+ Подключить источник</Button>
      </>}
      {sourcesX.map(s=><div className="dealRow" key={s.id}>
        <div>
          <b>{s.name}</b>
          <div className="muted">
            Последняя синхронизация: {formatSyncDate(s.last_sync_at)}
          </div>
        </div>
        <span>{s.country}</span>
        <span className="badge">{s.connection_method||s.source_type||s.type}</span>
        <span className="badge">{syncStatusLabel(s.connection_status)}</span>
        <span className="badge gold">{s.enabled&&!s.paused?"Активен":"Отключен"}</span>
        {isTech&&<><Button variant="soft" onClick={()=>toggleSource(s)}>{s.enabled?"Отключить":"Включить"}</Button><Button variant="danger" onClick={()=>removeSource(s)}>Удалить</Button></>}
      </div>)}
      {!sourcesX.length&&<p className="muted">Площадок пока нет.</p>}
    </div>}

    {tab==="telegram"&&<div className="card">
      <h3>Telegram-каналы</h3>
      <p className="muted">Общегородские, партнёрские и тематические каналы — без мониторинга конкурентов. Реальное чтение канала будет подключаться отдельным Telegram-коннектором.</p>
      {isTech&&<>
        <div className="grid2">
          <Field label="Название"><input value={cf.name} onChange={e=>setCf({...cf,name:e.target.value})}/></Field>
          <Field label="Ссылка / @username"><input value={cf.url} onChange={e=>setCf({...cf,url:e.target.value})}/></Field>
          <Field label="Страна"><input value={cf.country} onChange={e=>setCf({...cf,country:e.target.value})}/></Field>
          <Field label="Город"><input value={cf.city} onChange={e=>setCf({...cf,city:e.target.value})}/></Field>
        </div>
        <Button className="full" onClick={addChannel}>+ Добавить Telegram-канал</Button>
      </>}
      {channels.map(c=><div className="dealRow" key={c.id}>
        <div>
          <b>{c.name}</b>
          <div className="muted">
            Последняя синхронизация: {formatSyncDate(c.last_sync_at)}
          </div>
        </div>
        <span>{c.city||"—"} · {c.country}</span>
        <span className="badge">Telegram</span>
        <span className="badge">{syncStatusLabel(c.connection_status)}</span>
        <span className="badge gold">{c.enabled&&!c.paused?"Активен":"Отключен"}</span>
        {isTech&&<><Button variant="soft" onClick={()=>toggleSource(c)}>{c.enabled?"Отключить":"Включить"}</Button><Button variant="danger" onClick={()=>removeSource(c)}>Удалить</Button></>}
      </div>)}
      {!channels.length&&<p className="muted">Telegram-каналы пока не добавлены.</p>}
    </div>}

    {tab==="import"&&<div className="card">
      <h3>Объекты рынка</h3>
      <p className="muted">Можно уже сейчас наполнять аналитику реальными объявлениями вручную или через CSV. Каждый внешний объект хранит прямую ссылку на оригинальный источник.</p>

      {isTech&&<>
        <div className="grid2">
          <Field label="Название объекта"><input value={listingForm.title} onChange={e=>setListingForm({...listingForm,title:e.target.value})}/></Field>
          <Field label="Тип сделки"><select value={listingForm.deal_type} onChange={e=>setListingForm({...listingForm,deal_type:e.target.value})}>{MARKET_DEAL_TYPES.map(x=><option key={x}>{x}</option>)}</select></Field>
          <Field label="Страна"><input value={listingForm.country} onChange={e=>setListingForm({...listingForm,country:e.target.value})}/></Field>
          <Field label="Город"><input value={listingForm.city} onChange={e=>setListingForm({...listingForm,city:e.target.value})}/></Field>
          <Field label="Район / ЖК"><input value={listingForm.district} onChange={e=>setListingForm({...listingForm,district:e.target.value})}/></Field>
          <Field label="Комнат"><input type="number" value={listingForm.rooms} onChange={e=>setListingForm({...listingForm,rooms:e.target.value})}/></Field>
          <Field label="Цена"><input type="number" value={listingForm.price} onChange={e=>setListingForm({...listingForm,price:e.target.value})}/></Field>
          <Field label="Площадь, м²"><input type="number" value={listingForm.area} onChange={e=>setListingForm({...listingForm,area:e.target.value})}/></Field>
          <Field label="Источник"><input placeholder="OLX / DIM.RIA / канал..." value={listingForm.source_name} onChange={e=>setListingForm({...listingForm,source_name:e.target.value})}/></Field>
          <Field label="Ссылка на оригинал"><input placeholder="https://..." value={listingForm.source_url} onChange={e=>setListingForm({...listingForm,source_url:e.target.value})}/></Field>
        </div>
        <Field label="Описание"><textarea value={listingForm.description} onChange={e=>setListingForm({...listingForm,description:e.target.value})}/></Field>
        <Button className="full" onClick={addExternalListing}>+ Добавить объект в аналитику</Button>

        <div className="card" style={{marginTop:14}}>
          <h3>Массовый импорт CSV</h3>
          <p className="muted">Поддерживаемые заголовки: title, deal_type, country, city, district, rooms, price, area, currency, source_name, source_url, description.</p>
          <input className="input" type="file" accept=".csv,.txt" onChange={e=>importMarketCsv(e.target.files?.[0])}/>
        </div>
      </>}

      <p className="muted">Внешних объектов загружено: {externalListings.length}</p>
    </div>}

    {tab==="ai"&&<div className="card">
      <h3>AI Аналитик рынка</h3>
      <p className="muted">Пока этот блок делает расчётный обзор на основании уже загруженных данных. Позже сюда подключим генерацию текстового AI-отчёта.</p>
      <div className="grid3">
        <div className="card"><span className="muted">Объектов в выборке</span><h2>{stats.count}</h2></div>
        <div className="card"><span className="muted">Активный район</span><h2>{stats.topDistrict}</h2></div>
        <div className="card"><span className="muted">Ниже рынка</span><h2>{stats.belowMarket.length}</h2></div>
      </div>
      <div className="card amber">
        <b>Автоматический вывод</b>
        <p>
          В текущей выборке {stats.count} объектов. Средняя цена — {marketMoney(stats.avg,filters.currency)},
          медианная — {marketMoney(stats.median,filters.currency)}.
          Наиболее часто встречающийся район — {stats.topDistrict}.
          Найдено {stats.belowMarket.length} объектов с ценой минимум на 10% ниже средней по текущей выборке.
        </p>
      </div>
      {stats.belowMarket.slice(0,15).map(p=><div className="dealRow" key={`below-${p.id}`}>
        <div><b>{p.title}</b><div className="muted">{p.source_name}</div></div>
        <b>{marketMoney(p.price,p.currency)}</b>
        <span>{p.area||"—"} м²</span>
        {p.source_url?<a className="btn soft" href={p.source_url} target="_blank" rel="noopener noreferrer">Оригинал</a>:<span/>}
      </div>)}
    </div>}
  </div>
}

export default function App(){
  const [page,setPage] = useStorage("page","home");
  const [role,setRole] = useStorage("role","Администратор директор");
  const [theme,setTheme] = useStorage("crm_theme","nightGold");
  const [lang,setLang] = useStorage("crm_lang","ru");

  const [session,setSession] = useState(null);
  const [currentProfile,setCurrentProfile] = useState(null);
  const [authLoading,setAuthLoading] = useState(true);

  const [leads,setLeadsRaw] = useState([]);
  const [posts,setPostsRaw] = useState([]);
  const [properties,setPropertiesRaw] = useState([]);

  const [events,setEvents] = useCalendarEvents(currentProfile);
  const [deals,setDeals,dealsLoaded] = useDealsStore(currentProfile); // раньше: useStorage("events") — только в браузере
  const [help,setHelp] = useState([]);
  const [agencies,setAgencies] = useState([]);
  const [users,setUsers] = useState([]);
  const [activities,setActivities] = useState([]);

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
    if (data.theme) {
      // Разово переводим всех со старой темы по умолчанию (classic) на новую Night Gold; выбор других тем не трогаем.
      let migrated = false; try { migrated = !!localStorage.getItem("theme_night_v2"); localStorage.setItem("theme_night_v2","1"); } catch {}
      if (data.theme !== "nightGold" && !migrated) { setTheme("nightGold"); supabase.from("users").update({theme:"nightGold"}).eq("id", data.id).then(()=>{}); }
      else setTheme(data.theme);
    }
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

  // Язык интерфейса: переводим экран и следим за всем, что появляется на нём позже
  useEffect(() => {
    watchInterfaceLanguage(lang);
    document.documentElement.lang = lang === "en" ? "en" : lang === "uk" ? "uk" : "ru";
    return () => i18nObserver?.disconnect();
  }, [lang]);

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
      status: LEGACY_STAGE[row.stage] || row.stage || "Новый Лид",
      notes: row.notes || "",
      nextContact: row.next_contact_at || "",
      manager: row.manager_name || row.manager || extractManager(row.notes),
      manager_email: row.manager_email || "",
      created_at: row.created_at || null,
      updated_at: row.updated_at || null,
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
      description_uk: row.description_uk || "",
      property_manager_name: row.property_manager_name || row.manager_name || "",
      property_manager_email: row.property_manager_email || "",
      property_manager_phone: row.property_manager_phone || "",
      created_by_email: row.created_by_email || row.property_manager_email || "",
      olx_status: row.olx_status || null,
      ownership_right: !!(row.ownership_right ?? row.ownership_available),
      assignment: !!(row.assignment ?? row.assignment_available),
      government_programs: !!(row.government_programs ?? row.government_programs_available),
      created_at: row.created_at || null,
      media: mediaRows
        .filter(m => String(m.property_id) === String(row.id))
        .sort((a,b) => {
          const aOrder = Number.isFinite(Number(a.sort_order)) ? Number(a.sort_order) : Number.MAX_SAFE_INTEGER;
          const bOrder = Number.isFinite(Number(b.sort_order)) ? Number(b.sort_order) : Number.MAX_SAFE_INTEGER;
          if (aOrder !== bOrder) return aOrder - bOrder;
          return String(a.created_at || a.id || "").localeCompare(String(b.created_at || b.id || ""));
        })
        .map(m => ({
          id:m.id,
          kind:m.media_type,
          url:m.media_url,
          name:m.file_name,
          storage_path:m.storage_path || "",
          sort_order:Number.isFinite(Number(m.sort_order)) ? Number(m.sort_order) : null
        })),
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

  async function loadFromSupabase(profile = currentProfile, only = null){
    // only — набор разделов для частичной перезагрузки при живом обновлении (null = всё)
    const want = g => !only || only.has(g);
    const SKIP = {skip:true, data:null, error:null};
    const fail = (msg) => { if (only) console.warn(msg); else alert(msg); };
    const agencyId = profile?.agency_id ? String(profile.agency_id) : profileAgencyId;
    const roleForLoad = profile?.role || role;

    const leadsRes = want("leads") ? await supabase.from("leads").select("*").order("id", { ascending: false }) : SKIP; // последние добавленные — сверху (у загруженных из заметок дата лида может быть старой)
    const postsRes = want("posts") ? await supabase.from("news").select("*").order("created_at", { ascending: false }) : SKIP;
    const newsMediaRes = want("posts") ? await supabase.from("news_media").select("*").order("created_at", { ascending: false }) : SKIP;
    const propsRes = want("props") ? await supabase.from("properties").select("*").order("created_at", { ascending: false }) : SKIP;
    const propertyMediaRes = want("props") ? await supabase.from("property_media").select("*") : SKIP;
    const commentsRes = want("posts") ? await supabase.from("comments").select("*") : SKIP;
    const agenciesRes = want("users") ? await supabase.from("agencies").select("*").order("created_at", { ascending: false }) : SKIP;
    const usersRes = want("users") ? await supabase.from("users").select("*").order("created_at", { ascending: false }) : SKIP;
    const helpRes = want("help") ? await supabase.from("manager_help_requests").select("*").order("created_at", { ascending: false }) : SKIP;
    const activitiesRes = want("activities") ? await supabase.from("activities").select("*").order("created_at", { ascending: false }) : SKIP;

    if (leadsRes.skip) {} else if (leadsRes.error) {
      fail("Ошибка загрузки клиентов: " + leadsRes.error.message);
    } else {
      const mapped = (leadsRes.data || []).map(leadFromDb);
      setLeadsRaw(mapped);
    }

    if (postsRes.skip) {} else if (postsRes.error) {
      fail("Ошибка загрузки ленты: " + postsRes.error.message);
    } else {
      const mediaRows = newsMediaRes.error ? [] : (newsMediaRes.data || []);
      const commentRows = commentsRes.error ? [] : (commentsRes.data || []);
      const mappedPosts = (postsRes.data || []).map(row => postFromDb(row, mediaRows, commentRows));
      setPostsRaw(roleForLoad === "Администратор тех отдел" ? mappedPosts : mappedPosts.filter(p => !agencyId || !p.agency_id || String(p.agency_id) === String(agencyId)));
    }

    if (propsRes.skip) {} else if (propsRes.error) {
      fail("Ошибка загрузки вторички: " + propsRes.error.message);
    } else {
      const propertyMediaRows = propertyMediaRes.error ? [] : (propertyMediaRes.data || []);
      const mappedProps = (propsRes.data || []).map(row => propertyFromDb(row, propertyMediaRows));
      setPropertiesRaw(roleForLoad === "Администратор тех отдел" ? mappedProps : mappedProps.filter(p => !agencyId || !p.agency_id || String(p.agency_id) === String(agencyId)));
    }

    if (!agenciesRes.skip && !agenciesRes.error) setAgencies(agenciesRes.data || []);
    if (!usersRes.skip && !usersRes.error) setUsers(usersRes.data || []);
    if (!helpRes.skip && !helpRes.error) setHelp((helpRes.data || []).map(h => ({...h, id:String(h.id), leadId:h.lead_id, text:h.question || h.text || ""})));
    if (!activitiesRes.skip && !activitiesRes.error) setActivities(activitiesRes.data || []);
  }

  useEffect(() => {
    if (currentProfile) loadFromSupabase(currentProfile);
  }, [currentProfile?.id]);

  useEffect(() => {
    if (!currentProfile) return;
    // Живое обновление: перезагружаем только изменившийся раздел, изменения собираем в пачку (не чаще раза в ~2 сек),
    // пока приложение свёрнуто — копим и обновляем при возврате. Так массовая загрузка лидов не «кладёт» телефоны.
    const groupOf = {leads:"leads", news:"posts", news_media:"posts", comments:"posts", properties:"props", property_media:"props", manager_help_requests:"help", activities:"activities", users:"users", agencies:"users"};
    const pending = new Set(); let timer = null; let last = 0;
    const flush = () => {
      timer = null;
      if (!pending.size) return;
      if (document.visibilityState !== "visible") return;
      const only = new Set(pending); pending.clear(); last = Date.now();
      loadFromSupabase(currentProfile, only);
    };
    const schedule = (table) => {
      pending.add(groupOf[table] || "leads");
      if (timer) return;
      timer = setTimeout(flush, Math.max(1200, 2500 - (Date.now() - last)));
    };
    const onVisible = () => { if (document.visibilityState === "visible" && pending.size && !timer) timer = setTimeout(flush, 300); };
    document.addEventListener("visibilitychange", onVisible);
    let channel = supabase.channel("crm-realtime-refresh");
    Object.keys(groupOf).forEach(table => { channel = channel.on("postgres_changes", {event:"*", schema:"public", table}, () => schedule(table)); });
    channel.subscribe();
    return () => { if (timer) clearTimeout(timer); document.removeEventListener("visibilitychange", onVisible); supabase.removeChannel(channel); };
  }, [currentProfile?.id]);

  async function recordManagerActivity(activity={}){
    const base={
      agency_id: currentProfile?.agency_id || null,
      user_id: currentProfile?.id || null,
      user_email: profileEmail || null,
      user_name: profileName || profileEmail || "Менеджер",
      action_type: activity.action_type || "activity",
      entity_type: activity.entity_type || null,
      entity_id: activity.entity_id || null,
      channel: activity.channel || null,
      client_id: activity.client_id || null,
      client_name: activity.client_name || null,
      created_at: new Date().toISOString()
    };
    const variants=[base,{agency_id:base.agency_id,user_email:base.user_email,user_name:base.user_name,type:base.action_type,details:JSON.stringify(activity),created_at:base.created_at}];
    for(const payload of variants){
      const {data,error}=await supabase.from("activities").insert(payload).select().single();
      if(!error){setActivities(prev=>[data||payload,...prev]);return;}
    }
    setActivities(prev=>[{id:`local-${Date.now()}`,...base},...prev]);
  }

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

  useEffect(() => {
    if (page === "help" && !(role === "Администратор директор" || role === "Администратор тех отдел")) {
      setPage("clients");
    }
  }, [page, role, setPage]);

  useEffect(()=>{
    if(typeof document==="undefined"||!currentProfile?.agency_id)return;
    const apply=()=>{const b=loadAgencyBrand(currentProfile.agency_id);const map={};String(b.rename_text||"").split(/\r?\n/).forEach(line=>{const i=line.indexOf("=");if(i>0)map[line.slice(0,i).trim()]=line.slice(i+1).trim();});if(!Object.keys(map).length)return;const keys=Object.keys(map).sort((a,b)=>b.length-a.length);document.querySelectorAll("button,label,span,p,h1,h2,h3,b,a,option").forEach(el=>{if(el.children.length)return;let t=el.textContent;keys.forEach(k=>{if(t===k)t=map[k];});if(t!==el.textContent)el.textContent=t;});};
    apply();const timer=setInterval(apply,700);const handler=()=>apply();window.addEventListener("crm-brand-updated",handler);return()=>{clearInterval(timer);window.removeEventListener("crm-brand-updated",handler);};
  },[currentProfile?.agency_id,page,lang]);

  if (authLoading) {
    return <main className="screen" style={{minHeight:"100vh",display:"grid",placeItems:"center"}}><div className="card">Загрузка доступа...</div></main>;
  }

  if (!session || !currentProfile) {
    return <LoginScreen onLogin={()=>{}} />;
  }

  const visibleLeads = leads.filter(isMyLead);
  // открыть карточку клиента по номеру (из загрузки лидов и из пометки «дубль»)
  const openLeadById = (id) => { const l = leads.find(x => String(x.id) === String(id)); if (l) setLead(l); else alert("Карточка клиента не найдена"); };
  const currentAgency = agencies.find(a => String(a.id) === String(currentProfile?.agency_id));
  (agencies || []).forEach(a => { if (a?.logo_url) sharedAgencyLogos[String(a.id)] = a.logo_url; else delete sharedAgencyLogos[String(a.id)]; });
  // SaaS: название агентства всегда определяется по agency_id текущего входа.
  // Оно используется в шапке CRM, VIP-презентациях, email/WhatsApp и системном Share.
  const agencyName = String(
    currentAgency?.name ||
    currentAgency?.agency_name ||
    currentProfile?.agency_name ||
    currentProfile?.agency?.name ||
    "Агентство недвижимости"
  ).trim();
  const visibleEvents = events.filter(e => {
    if (isTech) return true;
    if (String(e.manager_email || "").toLowerCase() === String(currentProfile?.email || "").toLowerCase() && e.manager_email) return true;
    return visibleLeads.some(l => String(l.id) === String(e.leadId));
  });

  return <div className="layout" data-theme={theme} style={themeStyle(theme)}><style>{globalThemeCss(theme)}</style>
    <Sidebar page={page} setPage={setPage} role={role} lang={lang}/>
    <div className="mainWrap">
      <main className="main">
        {page!=="home"&&<Top page={page} setPage={setPage} agencyName={agencyName} lang={lang} agencyId={currentProfile?.agency_id}/>}
        {page==="home"&&<Home leads={visibleLeads} events={visibleEvents} deals={deals} currentProfile={currentProfile} role={role} lang={lang} setPage={setPage} onOpenLead={setLead} agency={currentAgency} agencyName={agencyName} onAgencyLogo={url=>setAgencies(prev=>prev.map(a=>String(a.id)===String(currentProfile?.agency_id)?{...a,logo_url:url}:a))} theme={theme} setTheme={setTheme}/>}
        {page==="feed"&&<Feed posts={posts} setPosts={setPosts} role={role} currentProfile={currentProfile} lang={lang} users={users}/>} 
        {page==="clients"&&<Clients leads={visibleLeads} setLeads={setLeads} onOpen={setLead} currentProfile={currentProfile} role={role} users={users} lang={lang}/>} 
        {page==="calendar"&&<Calendar events={visibleEvents} setEvents={setEvents} leads={visibleLeads} setLeads={setLeads} onOpenLead={setLead} currentProfile={currentProfile} role={role} lang={lang} properties={properties} users={users}/>} 
        {page==="properties"&&<Properties properties={properties} setProperties={setProperties} onOpen={setProperty} users={users} currentProfile={currentProfile} lang={lang} agencyName={agencyName} theme={theme} leads={visibleLeads} recordActivity={recordManagerActivity}/>}   
        {page==="deals"&&<Deals leads={visibleLeads} properties={properties} currentProfile={currentProfile} role={role} lang={lang} dealsState={[deals,setDeals,dealsLoaded]}/>} 
        {page==="analytics"&&<StatisticsReporting onOpenLead={openLeadById} leads={visibleLeads} properties={properties} events={visibleEvents} role={role} users={users} activities={activities} currentProfile={currentProfile} dealRecords={deals}/>} 
        {page==="tools"&&<AnalyticsWorkspace lang={lang} currentProfile={currentProfile} properties={properties} leads={visibleLeads} onOpenProperty={setProperty} agencyName={agencyName} theme={theme}/>} 
        {page==="help"&&(role==="Администратор директор"||role==="Администратор тех отдел")&&<Help help={help} setHelp={setHelp} setLeads={setLeads} leads={visibleLeads} onOpen={setLead} currentProfile={currentProfile} role={role}/>} 
        {page==="access"&&role==="Администратор тех отдел"&&<Access agencies={agencies} setAgencies={setAgencies} users={users} setUsers={setUsers}/>} 
        {/* Новобудови временно пустой раздел; компонент NewBuilds и данные ЖК сохранены, вернуть: <NewBuilds role={role} leads={visibleLeads} currentProfile={currentProfile}/> */}
        {page==="newbuilds"&&<div className="screen"><div className="card" style={{textAlign:"center",padding:"40px 18px"}}><div style={{fontSize:42}}>🏗</div><h3>{tr(lang,"Новобудови")}</h3><p className="muted">{tr(lang,"Раздел в разработке. Скоро здесь появятся новостройки.")}</p></div></div>}
        {page==="more"&&<More onLeadsImported={()=>loadFromSupabase(currentProfile)} onOpenLead={openLeadById} role={role} setRole={setRole} setPage={setPage} theme={theme} setTheme={setTheme} lang={lang} setLang={setLang} leads={leads} setLeads={setLeads} users={users} currentProfile={currentProfile} onLogout={signOut} agencyName={agencyName}/>} 
        <Bottom page={page} setPage={setPage} lang={lang}/>
        {lead&&<LeadModal key={lead.id} onOpenLead={openLeadById} lead={lead} setLeads={setLeads} setEvents={setEvents} setHelp={setHelp} help={help} onClose={()=>setLead(null)} role={role} users={users} currentProfile={currentProfile} properties={properties} agencyName={agencyName} lang={lang}/>} 
        {property&&<PropertyModal property={property} setProperties={setProperties} onClose={()=>setProperty(null)} users={users} currentProfile={currentProfile} role={role} lang={lang} agencyName={agencyName} theme={theme} leads={visibleLeads} recordActivity={recordManagerActivity}/>}  
      </main>
    </div>
  </div>;
}
