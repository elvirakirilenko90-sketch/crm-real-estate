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
function tr(lang, text){ return (translations[lang] && translations[lang][text]) || text; }
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
    background: `linear-gradient(135deg, ${found.vars["--soft"] || "#f5f2ea"}, #ffffff)`
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
    .top,.bottom{background:color-mix(in srgb, ${card} 92%, transparent)!important;border-color:color-mix(in srgb, ${accent} 24%, #e5e7eb)!important;}
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
    @media(max-width:700px){.leadInfoGrid{grid-template-columns:1fr}.calendarCardHeader{display:block}.dealsKanban .kanbanCol{min-width:290px;flex-basis:300px}}
  `;
}

function translateInterfaceText(lang, root=document.body){
  if (!lang || lang === "ru" || typeof document === "undefined") return;
  const dict = uiPhraseTranslations[lang] || {};
  const keys = Object.keys(dict).sort((a,b)=>b.length-a.length);
  const translateString = (value) => {
    if (!value || typeof value !== "string") return value;
    let out = value;
    for (const key of keys){
      if (out === key) return dict[key];
    }
    for (const key of keys){
      if (key.length > 2 && out.includes(key)) out = out.split(key).join(dict[key]);
    }
    return out;
  };
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
    acceptNode(node){
      const p = node.parentElement;
      if (!p || ["SCRIPT","STYLE","TEXTAREA","INPUT"].includes(p.tagName)) return NodeFilter.FILTER_REJECT;
      if (!node.nodeValue || !node.nodeValue.trim()) return NodeFilter.FILTER_REJECT;
      return NodeFilter.FILTER_ACCEPT;
    }
  });
  const nodes = [];
  while(walker.nextNode()) nodes.push(walker.currentNode);
  nodes.forEach(n => {
    const next = translateString(n.nodeValue);
    if (next !== n.nodeValue) n.nodeValue = next;
  });
  root.querySelectorAll("input[placeholder],textarea[placeholder]").forEach(el=>{
    const next = translateString(el.getAttribute("placeholder"));
    if (next) el.setAttribute("placeholder", next);
  });
  root.querySelectorAll("option,button,label,span,p,h1,h2,h3,b,a").forEach(el=>{
    if (el.childNodes.length === 1 && el.childNodes[0].nodeType === Node.TEXT_NODE){
      const next = translateString(el.textContent);
      if (next !== el.textContent) el.textContent = next;
    }
  });
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
  const items = [["feed","Лента","⌂"],["clients","Канбан и клиенты","👥"],["calendar","Календарь","📅"],["properties","Вторичка","🏢"],["deals","Сделки","💼"],["analytics","Статистика/Отчетность","📊"],["tools","Аналитика","⌁"],...(canSeeHelp ? [["help","Помощь менеджерам","🔔"]] : []),...(role === "Администратор тех отдел" ? [["access","Доступы","🔐"]] : []),["more","Ещё","☰"]];
  return <aside className="sidebar"><div className="logo"><div>♛</div><section><b>CRM Real Estate</b><span>Premium SaaS</span></section></div><div className="roleBox">{role}</div>{items.map(([id,label,icon])=><button key={id} onClick={()=>setPage(id)} className={cn("sideBtn", page===id && "active")}><span>{icon}</span>{tr(lang,label)}</button>)}</aside>;
}

function Top({page,setPage,agencyName,lang}) {
  const titles = {feed:"Лента новостей",clients:"Клиенты",calendar:"Календарь",properties:"Вторичка",deals:"Сделки",analytics:"Статистика/Отчетность",tools:"Аналитика",help:"Помощь менеджерам",access:"Доступы",more:"Еще"};
  return <div className="top"><div className="topLine"><div><p>♛ CRM Real Estate</p><h1>{tr(lang,titles[page])}</h1></div><button className="agencyTop" onClick={()=>setPage("more")}>{agencyName || tr(lang,"Моё агентство")}</button></div><div className="search">🔎 <input placeholder={tr(lang,"Поиск по CRM...")} /></div></div>;
}

function Bottom({page,setPage,lang}) {
  const items = [["feed","Лента","⌂"],["clients","Клиенты","👥"],["calendar","Календарь","📅"],["properties","Объекты","🏢"],["deals","Сделки","💼"],["more","Ещё","☰"]];
  return <nav className="bottom">{items.map(([id,label,icon])=><button key={id} className={page===id ? "active" : ""} onClick={()=>setPage(id)}><span>{icon}</span>{tr(lang,label)}</button>)}</nav>;
}

function Feed({posts,setPosts,role,currentProfile,lang}) {
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

  return <main className="screen"><div className="feedList">
    <div className="card dark hero">
      <div><h2>Лента новостей</h2><p>Внутренняя соцсеть агентства: фото, видео, файлы, ссылки, лайки и комментарии.</p></div>
      {isTech && <Button onClick={()=>setOpen(true)}>+ Новая публикация</Button>}
    </div>

    <div className="card dateFilterCard">
      <div className="row"><h3>{tr(lang,"Фильтр по датам")}</h3><span className="muted">{tr(lang,"Выбери период просмотра ленты")}</span></div>
      <div className="grid4">
        {[["all","Все"],["day","День"],["week","Неделя"],["month","Месяц"]].map(([id,label])=><Button key={id} variant={dateMode===id?"primary":"soft"} onClick={()=>setDateMode(id)}>{tr(lang,label)}</Button>)}
        <Button variant={dateMode==="custom"?"primary":"soft"} onClick={()=>setDateMode("custom")}>{tr(lang,"Период")}</Button>
      </div>
      {dateMode==="custom"&&<div className="grid2" style={{marginTop:10}}><Field label={tr(lang,"Дата от")}><input className="input" type="date" value={dateFrom} onChange={e=>setDateFrom(e.target.value)}/></Field><Field label={tr(lang,"Дата до")}><input className="input" type="date" value={dateTo} onChange={e=>setDateTo(e.target.value)}/></Field></div>}
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

    {visiblePosts.map(post=><article className="card post" key={post.id}>
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
          <div className="kanbanHead"><b>{s}</b>{badge(list.length,"gold")}</div>
          {list.map(l=><div className="lead expressiveLead" key={l.id} draggable onDragStart={e=>e.dataTransfer.setData("leadId", l.id)}>
            <div className="leadTop"><section><b>{l.name || tr(lang,"Без имени")}</b><span>{l.id}</span></section>{badge(tr(lang,l.status),"dark")}</div>
            <div className="leadInfoGrid">
              <div className="leadInfoCell"><span>{tr(lang,"Телефон")}</span><b>☎ {l.phone||"—"}</b></div>
              <div className="leadInfoCell"><span>{tr(lang,"Источник")}</span><b>{tr(lang,l.source||"—")}</b></div>
              <div className="leadInfoCell"><span>{tr(lang,"Следующий контакт")}</span><b>{l.nextContact||"—"}</b></div>
              <div className="leadInfoCell"><span>{tr(lang,"Ответственный")}</span><b>{l.manager||tr(lang,"не назначен")}</b></div>
            </div>
            <div className="leadNotesBox"><span>{tr(lang,"Заметки")}</span><p>{l.notes || tr(lang,"Без заметки")}</p></div>
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

function Calendar({events,setEvents,leads,setLeads,onOpenLead,currentProfile,role,lang}) {
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
function loadAgencyBrand(agencyId){
  try { return JSON.parse(localStorage.getItem(agencyBrandKey(agencyId)) || "{}"); } catch { return {}; }
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

async function addLuxuryGalleryPage(pages,{photos,title,agencyName,themeId,visualId,lang}){
  if(!photos?.length) return;
  const pal=presentationPalette(visualId,themeId), txt=vipPresentationText(lang);
  for(let start=0; start<photos.length; start+=4){
    const chunk=photos.slice(start,start+4),c=document.createElement("canvas");c.width=1240;c.height=1754;const ctx=c.getContext("2d");
    ctx.fillStyle=pal.paper;ctx.fillRect(0,0,1240,1754);
    ctx.fillStyle=pal.ink;ctx.font='bold 44px Georgia, "Times New Roman", serif';ctx.fillText(txt.photos,80,105);
    ctx.fillStyle=pal.accent;ctx.fillRect(80,135,1080,3);ctx.fillStyle=pal.muted;ctx.font='21px Arial';ctx.fillText(`${title||""} · ${start+1}-${Math.min(start+4,photos.length)} / ${photos.length}`,80,178);
    const boxes=[[80,240,700,650],[805,240,355,310],[805,580,355,310],[80,920,1080,650]];
    for(let i=0;i<chunk.length;i++){
      const ok=await drawRemoteImage(ctx,chunk[i].url,...boxes[i],"cover");
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
      c.fillStyle=pal.bg;c.fillRect(0,0,1240,1754);
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

    <div className="grid2">
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


function Deals({leads,properties,currentProfile,role,lang}) {
  const [deals,setDeals] = useStorage("crm_deals",[]);
  const [viewMode,setViewMode] = useStorage("deals_view_mode","kanban");
  const [statusFilter,setStatusFilter] = useState("Все");
  const [search,setSearch] = useState("");
  const isTech = role === "Администратор тех отдел";
  const isDirector = role === "Администратор директор";
  const myEmail = String(currentProfile?.email || "").toLowerCase();
  const dealStages=["Новая сделка","Документы","Расчёт","Закрыта"];

  useEffect(()=>{
    const dealLeads=(leads||[]).filter(l=>l.status==="Сделка");
    setDeals(prev=>{
      const next=[...prev];
      dealLeads.forEach(l=>{
        if(!next.some(d=>String(d.leadId)===String(l.id))){
          next.unshift({id:"D-"+Date.now()+"-"+l.id,leadId:l.id,client:l.name||"",phone:l.phone||"",manager:l.manager||"",manager_email:l.manager_email||"",propertyId:"",amount:"",commission:"",date:new Date().toISOString().slice(0,10),comment:"",status:"Новая сделка"});
        }
      });
      return next;
    });
  },[leads]);

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
  {country:"Украина",name:"DIM.RIA",aliases:["DOM.RIA","DIM.RIA","dom.ria.com"],method:"WEB",url:"https://dom.ria.com/uk/prodazha-kvartir/"},
  {country:"Украина",name:"OLX",aliases:["OLX","OLX.ua","olx.ua"],method:"WEB",url:"https://www.olx.ua/uk/nedvizhimost/kvartiry/prodazha-kvartir/"},
  {country:"Украина",name:"RIELTOR.UA",aliases:["RIELTOR.UA","Rieltor.ua","RIELTOR","rieltor.ua"],method:"WEB",url:"https://rieltor.ua/flats-sale/"},
  {country:"Украина",name:"ЛУН",aliases:["ЛУН","LUN","lun.ua"],method:"WEB",url:"https://lun.ua/"},
  {country:"Украина",name:"REM.ua",aliases:["REM","REM.ua","rem.ua"],method:"WEB",url:"https://rem.ua/ua"},
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
      "Днепропетровская область":["Днепр","Кривой Рог","Каменское","Никополь","Павлоград","Новомосковск"],
      "Донецкая область":["Краматорск","Славянск","Дружковка","Константиновка","Покровск"],
      "Житомирская область":["Житомир","Бердичев","Коростень","Звягель"],
      "Закарпатская область":["Ужгород","Мукачево","Хуст","Берегово","Виноградов"],
      "Запорожская область":["Запорожье"],
      "Ивано-Франковская область":["Ивано-Франковск","Калуш","Коломыя","Яремче","Надворная"],
      "Киевская область":["Бровары","Буча","Ирпень","Белая Церковь","Борисполь","Вышгород","Вишневое","Боярка","Обухов","Фастов","Украинка"],
      "Кировоградская область":["Кропивницкий","Александрия","Светловодск"],
      "Львовская область":["Львов","Дрогобыч","Стрый","Трускавец","Самбор","Червоноград","Борислав"],
      "Николаевская область":["Николаев","Первомайск","Вознесенск"],
      "Одесская область":["Одесса","Черноморск","Пивденное","Измаил","Белгород-Днестровский","Подольск","Балта","Рени","Килия","Болград","Раздельная","Арциз"],
      "Полтавская область":["Полтава","Кременчуг","Лубны","Миргород","Горишние Плавни"],
      "Ровненская область":["Ровно","Дубно","Вараш","Острог"],
      "Сумская область":["Сумы","Конотоп","Шостка","Ромны","Ахтырка"],
      "Тернопольская область":["Тернополь","Чортков","Кременец"],
      "Харьковская область":["Харьков","Лозовая","Изюм","Чугуев","Златополь"],
      "Херсонская область":["Херсон"],
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

const officialCityDistricts = {
  // Только официальные административные районы города. Микрорайоны и ЖК сюда не смешиваем.
  "Украина|Одесса":["Приморский","Киевский","Хаджибейский","Пересыпский"],
  "Україна|Одеса":["Приморський","Київський","Хаджибейський","Пересипський"],
  "Украина|Киев":["Голосеевский","Дарницкий","Деснянский","Днепровский","Оболонский","Печерский","Подольский","Святошинский","Соломенский","Шевченковский"],
  "Україна|Київ":["Голосіївський","Дарницький","Деснянський","Дніпровський","Оболонський","Печерський","Подільський","Святошинський","Солом’янський","Шевченківський"],
  "Украина|Харьков":["Основянский","Немышлянский","Индустриальный","Новобаварский","Салтовский","Холодногорский","Слободской","Киевский","Шевченковский"],
  "Україна|Харків":["Основ’янський","Немишлянський","Індустріальний","Новобаварський","Салтівський","Холодногірський","Слобідський","Київський","Шевченківський"],
  "Украина|Днепр":["Амур-Нижнеднепровский","Индустриальный","Новокодакский","Самарский","Соборный","Центральный","Чечеловский","Шевченковский"],
  "Україна|Дніпро":["Амур-Нижньодніпровський","Індустріальний","Новокодацький","Самарський","Соборний","Центральний","Чечелівський","Шевченківський"],
  "Грузия|Тбилиси":["Ваке","Сабуртало","Старый Тбилиси","Чугурети","Дидубе","Исани","Самгори","Глдани","Надзаладеви","Крцаниси"],
  "Грузия|Батуми":["Старый Батуми","Новый Бульвар","Химшиашвили","Аэропорт","Багратиони","Ангиса","Гонио","Квариати"],
  "ОАЭ|Дубай":["Dubai Marina","Downtown Dubai","Business Bay","Jumeirah Village Circle","Palm Jumeirah","Dubai Hills Estate","Jumeirah Lake Towers","Dubai Creek Harbour","Dubai South","Arjan","Al Furjan"],
  "Испания|Мадрид":["Centro","Salamanca","Chamberí","Chamartín","Retiro","Moncloa-Aravaca"],
  "Испания|Барселона":["Eixample","Ciutat Vella","Gràcia","Sarrià-Sant Gervasi","Les Corts","Sant Martí"],
  "Таиланд|Пхукет":["Bang Tao","Kamala","Patong","Karon","Kata","Rawai","Nai Harn","Mai Khao"],
  "Индонезия / Бали|Денпасар":["Sanur","Denpasar Barat","Denpasar Selatan","Denpasar Timur","Denpasar Utara"]
};

function StatisticsReporting({leads,properties,events,role,users,activities,currentProfile}) {
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
  </main>;
}


function MarketAnalyticsV2({leads,properties,currentProfile,onOpenProperty,agencyName,theme,lang="ru"}) {
  const [marketListings,setMarketListings]=useState([]);
  const [loadingMarket,setLoadingMarket]=useState(false);
  const [syncingMarket,setSyncingMarket]=useState(false);
  const [marketError,setMarketError]=useState("");
  const [period,setPeriod]=useState("30");
  const [dateFrom,setDateFrom]=useState("");
  const [dateTo,setDateTo]=useState("");
  const [country,setCountry]=useState("Все");
  const [region,setRegion]=useState("Все");
  const [city,setCity]=useState("Все");
  const [districtFilter,setDistrictFilter]=useState("Все");
  const [complexFilter,setComplexFilter]=useState("Все");
  const [dealFilter,setDealFilter]=useState("Все");
  const [selectedSources,setSelectedSources]=useState([]);
  const [sourceCountry,setSourceCountry]=useState("Все");
  const [roomsFilter,setRoomsFilter]=useState("Все");
  const [priceFrom,setPriceFrom]=useState("");
  const [priceTo,setPriceTo]=useState("");
  const [areaFrom,setAreaFrom]=useState("");
  const [areaTo,setAreaTo]=useState("");
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
  const [favorites,setFavorites]=useStorage("analytics_market_favorites",[]);
  const [aiOpenId,setAiOpenId]=useState("");
  const [addedCrm,setAddedCrm]=useState({});

  const agencyId=currentProfile?.agency_id;

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
    const hasUseful=Number(row?.price||0)>0||Number(row?.area||0)>0||Number(row?.rooms||0)>0||
      !!firstNumber(raw,["price","amount","cost","area","total_area","rooms","bedrooms"])||
      !!firstText(raw,["title","headline","address"]);
    const ext=String(row?.external_id||"").trim();
    const genericExt=/^https?:\/\//i.test(ext)&&!isConcreteListingUrl(ext);
    return !url&&!hasUseful||genericExt&&!hasUseful;
  };

  const loadMarket=async()=>{
    if(!agencyId)return;
    setLoadingMarket(true);setMarketError("");
    const {data,error}=await supabase.from("market_listings").select("*").eq("agency_id",agencyId).order("last_seen_at",{ascending:false}).limit(2000);
    if(error){console.error(error);setMarketError(error.message||"Не удалось загрузить объявления рынка.");}
    else setMarketListings(data||[]);
    setLoadingMarket(false);
  };

  useEffect(()=>{loadMarket();},[agencyId]);

  const syncMarket=async()=>{
    if(!agencyId)return;
    setSyncingMarket(true);setMarketError("");
    try{
      const {data,error}=await supabase.functions.invoke("market-sync",{
        body:{
          agency_id:Number(agencyId),
          sync_all:true,
          market_filters:{
            country,
            region,
            city,
            district:districtFilter,
            complex:complexFilter,
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
      const {data:afterRows,error:afterError}=await supabase.from("market_listings").select("*").eq("agency_id",agencyId).order("last_seen_at",{ascending:false}).limit(2000);
      if(afterError)throw afterError;
      setMarketListings(afterRows||[]);
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

  const getListingDate=x=>x.last_seen_at||x.updated_at||x.first_seen_at||x.published_at||x.created_at||"";
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
  const internalMarketListings=properties.map(p=>({
    id:`crm-${p.id}`, _key:`crm-${p.id}`, origin:"crm", crm_property_id:p.id,
    title:p.title||"Объект CRM", property_type:p.type||p.property_type||"Недвижимость",
    country:p.country||"", region:p.region||p.oblast||"", city:p.city||"", district:p.district||"", complex_name:p.complex_name||p.complex||"",
    deal_type:p.deal_type||p.operation_type||"Продажа", rooms:p.rooms||String(p.type||"").match(/\d+/)?.[0]||"",
    price:Number(p.price||0), area:Number(p.area||0), floor:p.floor||"", total_floors:p.total_floors||"", currency:p.currency||"USD",
    description:p.description||"", source_name:"CRM", source_url:p.source_url||p.url||p.listing_url||"",
    main_photo_url:(p.media||[]).find(m=>String(m.kind||m.media_type||"").toLowerCase().includes("фото"))?.url||(p.media||[])[0]?.url||"",
    photo_urls:(p.media||[]).map(m=>m.url).filter(Boolean), published_at:p.created_at||null, first_seen_at:p.created_at||null, last_seen_at:p.updated_at||p.created_at||null,
    is_active:p.status!=="Неактуален", raw_data:{crm:true}
  }));
  const normalizedAllMarketListings=marketListings.map(x=>normalizeMarketRow({...x,_key:`market-${x.id}`,origin:"market"}));
  const placeholderMarketListings=normalizedAllMarketListings.filter(isSourcePlaceholder);
  const normalizedMarketListings=normalizedAllMarketListings.filter(x=>!isSourcePlaceholder(x));
  const combinedListings=[...normalizedMarketListings,...internalMarketListings];
  const values=(items,key)=>Array.from(new Set(items.map(x=>String(x?.[key]||"").trim()).filter(Boolean))).sort((a,b)=>a.localeCompare(b,"ru"));
  const geoKey=v=>String(v||"").trim().toLowerCase()
    .normalize("NFKD").replace(/[\u0300-\u036f]/g,"")
    .replace(/[’'`]/g,"")
    .replace(/[‐‑‒–—-]/g," ")
    .replace(/\b(область|обл\.?|region|oblast|province|місто|город|city)\b/g," ")
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
    иванофранковск:"ivanofrankivsk","іванофранківськ":"ivanofrankivsk",ivanofrankivsk:"ivanofrankivsk"
  };
  const geoCanon=v=>{
    const raw=geoKey(v),latin=latinGeoKey(v);
    return geoAlias[raw]||geoAlias[latin]||latin||raw;
  };
  const geoEq=(a,b)=>{
    const aa=geoCanon(a),bb=geoCanon(b);
    return !!aa&&!!bb&&aa===bb;
  };

  const catalogCountries=Object.keys(analyticsGeoCatalog);
  const countries=["Все",...Array.from(new Set([...catalogCountries,...values(combinedListings,"country")])).sort((a,b)=>a.localeCompare(b,"ru"))];

  const countryMatches=x=>country==="Все"||geoEq(x.country,country);

  const geoCountry=country==="Все"
    ? combinedListings
    : combinedListings.filter(countryMatches);

  const selectedCountryKey=country!=="Все"
    ? catalogCountries.find(k=>geoEq(k,country))||country
    : "Все";

  const catalogRegions=selectedCountryKey!=="Все"
    ? Object.keys(analyticsGeoCatalog[selectedCountryKey]?.regions||{})
    : [];

  const regions=["Все",...Array.from(new Set([...catalogRegions,...values(geoCountry,"region")])).sort((a,b)=>a.localeCompare(b,"ru"))];

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

  const cities=["Все",...Array.from(new Set([...catalogCities,...values(geoRegion,"city")])).sort((a,b)=>a.localeCompare(b,"ru"))];

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

  const districtsMarket=["Все",...(officialDistricts.length?officialDistricts:values(geoCity,"district"))];
  const complexes=["Все",...values(geoCity,"complex_name")];

  const sourceCountryOptions=["Все",...Array.from(new Set(analyticsSourceCatalog.map(x=>x.country))).sort((a,b)=>a.localeCompare(b,"ru"))];
  const catalogForCountry=analyticsSourceCatalog.filter(x=>sourceCountry==="Все"||geoEq(x.country,sourceCountry));
  const liveSourceNames=values(sourceCountry==="Все"?combinedListings:combinedListings.filter(x=>geoEq(x.country,sourceCountry)),"source_name");
  const sourceOptions=Array.from(new Set([...catalogForCountry.map(x=>x.name),...liveSourceNames,"CRM"])).sort((a,b)=>a.localeCompare(b,"ru"));

  const sourceMatches=(x,name)=>{
    const raw=String(x.source_name||"").trim().toLowerCase();
    const entry=analyticsSourceCatalog.find(s=>s.name===name);
    return raw===String(name||"").toLowerCase()||(entry?.aliases||[]).some(a=>raw.includes(String(a).toLowerCase()));
  };

  const dealCanon=v=>{
    const s=String(v||"").toLowerCase();
    if(/аренд|оренд|rent|lease/.test(s))return "Аренда";
    if(/продаж|sale|sell/.test(s))return "Продажа";
    return String(v||"").trim();
  };

  const filtered=combinedListings.filter(x=>{
    const num=v=>Number(v||0);
    const p=num(x.price),a=num(x.area);
    const priceFilterActive=!!priceFrom||!!priceTo;
    const areaFilterActive=!!areaFrom||!!areaTo;

    return inMarketPeriod(x)
      &&countryMatches(x)
      &&regionMatches(x)
      &&cityMatches(x)
      &&(districtFilter==="Все"||geoEq(x.district,districtFilter))
      &&(complexFilter==="Все"||geoEq(x.complex_name,complexFilter))
      &&(dealFilter==="Все"||dealCanon(x.deal_type)===dealCanon(dealFilter))
      &&(!selectedSources.length||selectedSources.some(name=>sourceMatches(x,name)))
      &&(roomsFilter==="Все"||(roomsFilter==="4+"?num(x.rooms)>=4:String(num(x.rooms))===roomsFilter))
      &&(!priceFilterActive||(p>0&&(!priceFrom||p>=num(priceFrom))&&(!priceTo||p<=num(priceTo))))
      &&(!areaFilterActive||(a>0&&(!areaFrom||a>=num(areaFrom))&&(!areaTo||a<=num(areaTo))));
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

  const normalizeUrl=v=>String(v||"").trim();
  const crmMatch=x=>{
    if(x.origin==="crm"||x.crm_property_id){return properties.find(p=>String(p.id)===String(x.crm_property_id||String(x.id).replace(/^crm-/,"")))||null;}
    if(addedCrm[x._key]) return addedCrm[x._key];
    const raw=x.raw_data||{};
    const crmId=x.crm_property_id||raw.crm_property_id||raw.property_id;
    if(crmId){const exact=properties.find(p=>String(p.id)===String(crmId));if(exact)return exact;}
    const url=normalizeUrl(x.source_url);
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
      source_url:x.source_url||"",source_name:x.source_name||"",rooms:x.rooms||"",complex_name:x.complex_name||""
    };
  });

  const contactPhone=x=>String(x.contact_phone||x.phone||x.raw_data?.phone||x.raw_data?.contact_phone||"").trim();
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

  const createSelection=async()=>{
    if(!selectionItems.length)return alert("Выбери хотя бы один объект.");
    setCreatingSelection(true);
    try{
      const pal=presentationPalette(selectionVisual,theme),pages=[];
      const canvas=document.createElement("canvas");canvas.width=1240;canvas.height=1754;const ctx=canvas.getContext("2d");
      ctx.fillStyle=pal.bg;ctx.fillRect(0,0,1240,1754);
      ctx.fillStyle=pal.accent;ctx.fillRect(0,0,1240,18);
      ctx.fillStyle=pal.ink;ctx.font='bold 54px Georgia, "Times New Roman", serif';ctx.fillText("ПЕРСОНАЛЬНАЯ ПОДБОРКА",80,150);
      ctx.fillStyle=pal.muted;ctx.font='24px Arial';ctx.fillText(agencyName||"Агентство недвижимости",80,210);
      if(selectionClient){ctx.font='bold 31px Arial';ctx.fillStyle=pal.ink;ctx.fillText(`Для: ${selectionClient}`,80,300);}
      ctx.fillStyle=pal.muted;ctx.font='22px Arial';ctx.fillText(`Объектов: ${selectionItems.length} · ${new Date().toLocaleDateString()}`,80,360);
      pages.push({bytes:pdfDataUrlToBytes(canvas.toDataURL("image/jpeg",.97)),width:1240,height:1754});
      for(let index=0;index<selectionItems.length;index++){
        const p=selectionItems[index],photos=extractPropertyPhotos(p),photo=photos[0];
        ctx.fillStyle=pal.bg;ctx.fillRect(0,0,1240,1754);ctx.fillStyle=pal.accent;ctx.fillRect(0,0,1240,14);
        ctx.fillStyle=pal.ink;ctx.font='bold 44px Georgia, "Times New Roman", serif';pdfDrawWrapped(ctx,p.title||`Объект ${index+1}`,80,90,1080,50);
        ctx.fillStyle=pal.muted;ctx.font='20px Arial';ctx.fillText(`${p.source_name||"CRM"} · ${index+1}/${selectionItems.length}`,80,190);
        if(photo)await drawRemoteImage(ctx,photo.url,80,235,1080,650,"cover");
        const boxes=[["Цена",money(p.price)],["Площадь",`${p.area||0} м²`],["Комнаты",p.rooms||"—"],["Район",p.district||"—"]];
        boxes.forEach(([a,b],i)=>{const xx=80+i*270;ctx.strokeStyle=pal.line;ctx.strokeRect(xx,930,250,120);ctx.fillStyle=pal.muted;ctx.font='17px Arial';ctx.fillText(a,xx+14,966);ctx.fillStyle=pal.ink;ctx.font='bold 23px Arial';pdfDrawWrapped(ctx,String(b),xx+14,1006,220,27);});
        ctx.fillStyle=pal.ink;ctx.font='bold 30px Georgia, "Times New Roman", serif';ctx.fillText("ОБ ОБЪЕКТЕ",80,1140);
        ctx.fillStyle=pal.muted;ctx.font='21px Georgia, "Times New Roman", serif';let yy=1195;
        canvasTextLines(ctx,String(p.description||"Описание отсутствует."),1080).slice(0,8).forEach(line=>{ctx.fillText(line,80,yy);yy+=32;});
        if(p.source_url){ctx.fillStyle=pal.accent;ctx.font='bold 18px Arial';ctx.fillText("Ссылка на оригинальное объявление сохранена в CRM",80,1590);}
        pages.push({bytes:pdfDataUrlToBytes(canvas.toDataURL("image/jpeg",.97)),width:1240,height:1754});
        await addLuxuryGalleryPage(pages,{photos,title:p.title,agencyName,themeId:theme,visualId:selectionVisual,lang:selectionLang});
      }
      if(selectionComparison&&selectionItems.length>1)addSelectionComparisonPages(pages,{items:selectionItems,themeId:theme,visualId:selectionVisual,lang:selectionLang,agencyName});
      const blob=buildPdfFromCanvasPages(pages),localUrl=URL.createObjectURL(blob);setSelectionDownloadUrl(localUrl);
      const uploaded=await uploadToFirstAvailableBucket(["presentations"],`selections/${Date.now()}-analytics-selection.pdf`,blob,{upsert:false,contentType:"application/pdf",cacheControl:"3600"});
      setSelectionUrl(uploaded?.publicUrl||localUrl);
      alert(uploaded?.publicUrl?"VIP PDF-подборка создана.":"VIP PDF-подборка создана локально.");
    }catch(e){console.error(e);alert("Не удалось создать подборку: "+(e?.message||e));}
    finally{setCreatingSelection(false);}
  };

  const resetFilters=()=>{setPeriod("30");setDateFrom("");setDateTo("");setCountry("Все");setRegion("Все");setCity("Все");setDistrictFilter("Все");setComplexFilter("Все");setDealFilter("Все");setSelectedSources([]);setSourceCountry("Все");setRoomsFilter("Все");setPriceFrom("");setPriceTo("");setAreaFrom("");setAreaTo("");};

  const filterBox={padding:16,border:"1px solid rgba(148,163,184,.24)",borderRadius:18,background:"rgba(255,255,255,.72)"};
  const actionStyle={minHeight:46,fontWeight:800,borderRadius:14};
  return <main className="screen">
    <div className="card dark" style={{padding:26,borderRadius:24}}>
      <div className="row" style={{alignItems:"center",gap:18}}>
        <section><div style={{fontSize:13,fontWeight:900,letterSpacing:1.8,opacity:.7}}>MARKET INTELLIGENCE</div><h2 style={{fontSize:32,margin:"7px 0"}}>📊 Аналитика рынка</h2><p style={{margin:0}}>DIM.RIA • OLX • RIELTOR.UA • ЛУН • REM • MyHome.ge • SS.ge • Korter.ge • международные порталы • CRM</p></section>
        <Button onClick={syncMarket} disabled={syncingMarket} style={{...actionStyle,minWidth:190}}>{syncingMarket?"Обновляем…":"↻ Обновить рынок"}</Button>
      </div>
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
      <h3 style={{marginTop:0}}>Фильтры рынка</h3>
      <div className="grid4">
        <div style={filterBox}><Field label="Страна"><select className="input" value={country} onChange={e=>{setCountry(e.target.value);setRegion("Все");setCity("Все");setDistrictFilter("Все");setComplexFilter("Все");setSelectedSources([]);}}>{countries.map(x=><option key={x}>{x}</option>)}</select></Field></div>
        <div style={filterBox}><Field label="Область / регион"><select className="input" value={region} onChange={e=>{setRegion(e.target.value);setCity("Все");setDistrictFilter("Все");setComplexFilter("Все");setSelectedSources([]);}}>{regions.map(x=><option key={x}>{x}</option>)}</select></Field></div>
        <div style={filterBox}><Field label="Город"><select className="input" value={city} onChange={e=>{setCity(e.target.value);setDistrictFilter("Все");setComplexFilter("Все");}}>{cities.map(x=><option key={x}>{x}</option>)}</select></Field></div>
        <div style={filterBox}><Field label={officialDistricts.length?"Официальный район города":"Район / локация источника"}><select className="input" value={districtFilter} onChange={e=>setDistrictFilter(e.target.value)}>{districtsMarket.map(x=><option key={x}>{x}</option>)}</select></Field></div>
        <div style={filterBox}><Field label="ЖК"><select className="input" value={complexFilter} onChange={e=>setComplexFilter(e.target.value)}>{complexes.map(x=><option key={x}>{x}</option>)}</select></Field></div>
        <div style={filterBox}><Field label="Тип сделки"><select className="input" value={dealFilter} onChange={e=>setDealFilter(e.target.value)}><option>Все</option><option>Продажа</option><option>Аренда</option></select></Field></div>
        <div style={{...filterBox,gridColumn:"span 2"}}><Field label="Источники · можно выбрать несколько"><div style={{display:"flex",gap:8,marginBottom:10,flexWrap:"wrap"}}><select className="input" style={{maxWidth:260}} value={sourceCountry} onChange={e=>{setSourceCountry(e.target.value);setSelectedSources([]);}}>{sourceCountryOptions.map(x=><option key={x}>{x}</option>)}</select>{selectedSources.length>0&&<button className="chip" onClick={()=>setSelectedSources([])}>Очистить ({selectedSources.length})</button>}</div><div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(155px,1fr))",gap:8,maxHeight:190,overflow:"auto",padding:8,border:"1px solid rgba(148,163,184,.2)",borderRadius:14}}>{sourceOptions.map(name=><label key={name} style={{cursor:"pointer",display:"flex",alignItems:"center",gap:9,minHeight:44,padding:"10px 12px",borderRadius:12,border:selectedSources.includes(name)?"2px solid var(--accent)":"1px solid color-mix(in srgb,var(--accent) 28%,#d1d5db)",background:selectedSources.includes(name)?"color-mix(in srgb,var(--accent) 18%,var(--card))":"var(--card)",color:"var(--text)",fontWeight:850,lineHeight:1.2,whiteSpace:"normal"}}><input type="checkbox" style={{width:18,height:18,accentColor:"var(--accent)",flex:"0 0 auto"}} checked={selectedSources.includes(name)} onChange={()=>setSelectedSources(v=>v.includes(name)?v.filter(x=>x!==name):[...v,name])}/><span style={{display:"block",color:"var(--text)",fontWeight:850}}>{name}</span></label>)}</div></Field></div>
        <div style={filterBox}><Field label="Комнаты"><select className="input" value={roomsFilter} onChange={e=>setRoomsFilter(e.target.value)}><option>Все</option><option>1</option><option>2</option><option>3</option><option>4+</option></select></Field></div>
      </div>
      <div className="grid4" style={{marginTop:12}}>
        <Field label="Цена от"><input className="input" type="number" value={priceFrom} onChange={e=>setPriceFrom(e.target.value)} placeholder="0"/></Field>
        <Field label="Цена до"><input className="input" type="number" value={priceTo} onChange={e=>setPriceTo(e.target.value)} placeholder="без лимита"/></Field>
        <Field label="Площадь от, м²"><input className="input" type="number" value={areaFrom} onChange={e=>setAreaFrom(e.target.value)} placeholder="0"/></Field>
        <Field label="Площадь до, м²"><input className="input" type="number" value={areaTo} onChange={e=>setAreaTo(e.target.value)} placeholder="без лимита"/></Field>
      </div>
    </div>

    <div className="stats" style={{marginBottom:16}}>
      <div className="stat" style={{minHeight:110}}><span>НАЙДЕНО</span><b style={{fontSize:34}}>{filtered.length}</b></div>
      <div className="stat" style={{minHeight:110}}><span>СРЕДНЯЯ ЦЕНА</span><b style={{fontSize:28}}>{avgPrice?marketMoney(avgPrice,statsCurrency):priceCurrencies.length>1?"Смешанные валюты":"—"}</b></div>
      <div className="stat" style={{minHeight:110}}><span>СРЕДНЯЯ ЦЕНА / М²</span><b style={{fontSize:28}}>{avgM2?`${marketMoney(avgM2,statsCurrency)} / м²`:priceCurrencies.length>1?"Смешанные валюты":"—"}</b></div>
      <div className="stat" style={{minHeight:110}}><span>НОВЫХ ЗА 7 ДНЕЙ</span><b style={{fontSize:34}}>{newCount}</b></div>
      <div className="stat" style={{minHeight:110}}><span>ИСЧЕЗЛО / НЕАКТИВНО</span><b style={{fontSize:34}}>{inactiveCount}</b></div>
      {Object.entries(sourceCounts).sort((a,b)=>b[1]-a[1]).slice(0,3).map(([name,count])=><div className="stat" key={name} style={{minHeight:110}}><span>{name}</span><b style={{fontSize:34}}>{count}</b></div>)}
    </div>

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
      <Button className="full" style={{...actionStyle,marginTop:14}} disabled={creatingSelection} onClick={createSelection}>{creatingSelection?"Формируем презентацию…":`Создать красивую PDF-подборку (${selected.length})`}</Button>
    </div>}

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

    <div className="row" style={{margin:"20px 0 10px"}}><section><h3 style={{margin:0}}>Объявления рынка</h3><p className="muted">{loadingMarket?"Загрузка…":`Показано ${filtered.length} из ${combinedListings.length}`}</p></section></div>
    {!loadingMarket&&filtered.length===0&&<div className="card"><h3>По выбранным фильтрам объявлений нет</h3><p className="muted">Попробуй выбрать «Всё время» или сбросить часть фильтров.</p></div>}
    <div className="grid2">
      {filtered.map(x=>{
        const crm=crmMatch(x),checked=selected.includes(String(x._key)),fav=favorites.includes(String(x._key)),photo=x.main_photo_url||(Array.isArray(x.photo_urls)?x.photo_urls[0]:"");
        const ai=aiFor(x);
        return <article className="card" key={x._key} style={{padding:0,overflow:"hidden",borderRadius:24}}>
          <div style={{height:240,background:"var(--soft)",position:"relative",overflow:"hidden"}}>
            {photo?<img src={photo} alt="" style={{width:"100%",height:"100%",objectFit:"cover"}}/>:<div style={{height:"100%",display:"grid",placeItems:"center",fontSize:54}}>🏠</div>}
            <div style={{position:"absolute",left:14,top:14,display:"flex",gap:8,flexWrap:"wrap"}}><span className="badge">{x.source_name||"Источник"}</span>{crm&&<span className="badge" style={{background:"#dcfce7",color:"#166534"}}>✓ В CRM</span>}</div>
          </div>
          <div style={{padding:20}}>
            <div className="row" style={{alignItems:"flex-start"}}><section><h3 style={{margin:"0 0 7px",fontSize:21}}>{x.title||x.complex_name||"Объект недвижимости"}</h3><p className="muted" style={{margin:0}}>📍 {[x.country,x.region,x.city,x.district,x.complex_name].filter(Boolean).join(" · ")||"Локация не указана"}</p></section><b style={{fontSize:24,whiteSpace:"nowrap"}}>{marketMoney(x.price,marketCurrency(x))}</b></div>
            <div className="chips" style={{margin:"14px 0"}}>{x.rooms&&<span className="chip">{x.rooms} комн.</span>}{x.area&&<span className="chip">{x.area} м²</span>}{x.floor&&<span className="chip">{x.floor} этаж</span>}{x.deal_type&&<span className="chip">{x.deal_type}</span>}</div>
            <p className="muted" style={{fontSize:13}}>Обновлено: {getListingDate(x)?new Date(getListingDate(x)).toLocaleString():"—"}</p>
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
    </div>
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



function More({role,setRole,setPage,theme,setTheme,lang,setLang,leads,setLeads,users,currentProfile,onLogout,agencyName}) {
  const isTech = role === "Администратор тех отдел";
  const [agencyBrand,setAgencyBrand] = useState(()=>loadAgencyBrand(currentProfile?.agency_id));
  const updateBrand=(patch)=>{const next={...agencyBrand,...patch};setAgencyBrand(next);saveAgencyBrand(currentProfile?.agency_id,next);};
  const uploadAgencyLogo=async(file)=>{if(!file)return;const path=`agency-brand/${currentProfile?.agency_id||"default"}/${Date.now()}-${file.name.replace(/[^a-zA-Z0-9._-]/g,"_")}`;const up=await uploadToFirstAvailableBucket(["agency-assets","presentations","property_media"],path,file,{upsert:true});if(up?.publicUrl)updateBrand({logo_url:up.publicUrl});else{const r=new FileReader();r.onload=()=>updateBrand({logo_url:r.result});r.readAsDataURL(file);}};

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

  function saveLocalMarketFallback(nextSources,nextChannels,nextListings){
    try{
      localStorage.setItem(marketStorageKey,JSON.stringify({
        sources:nextSources??sourcesX,
        channels:nextChannels??channels,
        listings:nextListings??externalListings
      }));
    }catch{}
  }

  function loadLocalMarketFallback(){
    try{
      const x=JSON.parse(localStorage.getItem(marketStorageKey)||"{}");
      if(Array.isArray(x.sources)) setSourcesX(x.sources);
      if(Array.isArray(x.channels)) setChannels(x.channels);
      if(Array.isArray(x.listings)) setExternalListings(x.listings);
    }catch{}
  }

  async function loadMarketData(){
    setLoadingMarket(true);
    try{
      const [srcRes,listRes]=await Promise.all([
        supabase.from("market_sources").select("*").eq("agency_id",agencyId).order("created_at",{ascending:false}),
        supabase.from("market_listings").select("*").eq("agency_id",agencyId).order("updated_at",{ascending:false}).limit(3000)
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
      console.warn("Market tools Supabase fallback:",e);
      setMarketDbReady(false);
      loadLocalMarketFallback();
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

  useEffect(() => {
    const id = setTimeout(() => translateInterfaceText(lang), 0);
    return () => clearTimeout(id);
  }, [lang, page, theme, leads, posts, properties, events, help, users, lead, property]);

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
      created_at: row.created_at || null,
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
    const activitiesRes = await supabase.from("activities").select("*").order("created_at", { ascending: false });

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
    if (!activitiesRes.error) setActivities(activitiesRes.data || []);
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
      .on("postgres_changes", {event:"*", schema:"public", table:"activities"}, () => loadFromSupabase(currentProfile))
      .subscribe();
    return () => { supabase.removeChannel(channel); };
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
  const currentAgency = agencies.find(a => String(a.id) === String(currentProfile?.agency_id));
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
    return visibleLeads.some(l => String(l.id) === String(e.leadId));
  });

  return <div className="layout" data-theme={theme} style={themeStyle(theme)}><style>{globalThemeCss(theme)}</style>
    <Sidebar page={page} setPage={setPage} role={role} lang={lang}/>
    <div className="mainWrap">
      <main className="main">
        <Top page={page} setPage={setPage} agencyName={agencyName} lang={lang}/>
        {page==="feed"&&<Feed posts={posts} setPosts={setPosts} role={role} currentProfile={currentProfile} lang={lang}/>} 
        {page==="clients"&&<Clients leads={visibleLeads} setLeads={setLeads} onOpen={setLead} currentProfile={currentProfile} role={role} users={users} lang={lang}/>} 
        {page==="calendar"&&<Calendar events={visibleEvents} setEvents={setEvents} leads={visibleLeads} setLeads={setLeads} onOpenLead={setLead} currentProfile={currentProfile} role={role} lang={lang}/>} 
        {page==="properties"&&<Properties properties={properties} setProperties={setProperties} onOpen={setProperty} users={users} currentProfile={currentProfile} lang={lang} agencyName={agencyName} theme={theme} leads={visibleLeads} recordActivity={recordManagerActivity}/>}   
        {page==="deals"&&<Deals leads={visibleLeads} properties={properties} currentProfile={currentProfile} role={role} lang={lang}/>} 
        {page==="analytics"&&<StatisticsReporting leads={visibleLeads} properties={properties} events={visibleEvents} role={role} users={users} activities={activities} currentProfile={currentProfile}/>} 
        {page==="tools"&&<AnalyticsWorkspace lang={lang} currentProfile={currentProfile} properties={properties} leads={visibleLeads} onOpenProperty={setProperty} agencyName={agencyName} theme={theme}/>} 
        {page==="help"&&(role==="Администратор директор"||role==="Администратор тех отдел")&&<Help help={help} setHelp={setHelp} setLeads={setLeads} leads={visibleLeads} onOpen={setLead} currentProfile={currentProfile} role={role}/>} 
        {page==="access"&&role==="Администратор тех отдел"&&<Access agencies={agencies} setAgencies={setAgencies} users={users} setUsers={setUsers}/>} 
        {page==="more"&&<More role={role} setRole={setRole} setPage={setPage} theme={theme} setTheme={setTheme} lang={lang} setLang={setLang} leads={leads} setLeads={setLeads} users={users} currentProfile={currentProfile} onLogout={signOut} agencyName={agencyName}/>} 
        <Bottom page={page} setPage={setPage} lang={lang}/>
        {lead&&<LeadModal lead={lead} setLeads={setLeads} setEvents={setEvents} setHelp={setHelp} help={help} onClose={()=>setLead(null)} role={role} users={users} currentProfile={currentProfile}/>} 
        {property&&<PropertyModal property={property} setProperties={setProperties} onClose={()=>setProperty(null)} users={users} currentProfile={currentProfile} role={role} lang={lang} agencyName={agencyName} theme={theme} leads={visibleLeads} recordActivity={recordManagerActivity}/>}  
      </main>
    </div>
  </div>;
}
