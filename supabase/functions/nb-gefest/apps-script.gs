// CRM: наличие и цены Гефест (Еллада-6, Еллада-7, Платон) из таблицы «Prices.Gefest» → раздел «Новострой».
// Таблица открыта только вашему Google-аккаунту, поэтому её раз в час отправляет этот скрипт (он работает от вашего имени).
//
// Установка (один раз, ~3 минуты):
// 1. Откройте https://script.google.com → «Новый проект».
// 2. Удалите всё в редакторе и вставьте этот файл целиком. Сохраните (значок дискеты).
// 3. Сверху выберите функцию «setup» → «Выполнить». Google попросит разрешения — разрешите
//    (может показать «Приложение не проверено» → «Дополнительно» → «Перейти к проекту»).
// Готово: скрипт сразу отправит данные в CRM и дальше будет делать это сам каждый час.
// Проверить: «Выполнения» слева — там видно каждый запуск и ответ CRM.

const CRM_URL = 'https://stvinrjyfuskqddcxzjv.supabase.co/functions/v1/nb-gefest';
const TOKEN = 'adb50b40b4b8cae6fe5d4fb3e7314205091c599035771aca'; // ключ доступа к CRM — никому не пересылайте
const FILE_ID = '1wj7bQ6lUnZ7bUVXiuGO6NnquleS6T-6gECZqjSGB7Wg';   // Prices.Gefest
const SHEETS = ['Еллада-6', 'Еллада-7', 'Платон', 'Итака'];       // листы, которые подключены в CRM (лишние CRM пропустит)

function syncGefest() {
  const ss = SpreadsheetApp.openById(FILE_ID);
  const sheets = {};
  SHEETS.forEach(function (name) {
    const sh = ss.getSheetByName(name);
    if (!sh) return;
    sheets[name] = sh.getDataRange().getValues().map(function (row) {
      return row.slice(0, 16).map(function (v) { return v instanceof Date ? v.toISOString() : v; });
    });
  });
  const res = UrlFetchApp.fetch(CRM_URL, {
    method: 'post', contentType: 'application/json', muteHttpExceptions: true,
    headers: { 'x-import-token': TOKEN },
    payload: JSON.stringify({ action: 'import', sheets: sheets }),
  });
  Logger.log(res.getResponseCode() + ' ' + res.getContentText());
}

// Запустить один раз: ставит запуск каждый час и сразу отправляет данные
function setup() {
  ScriptApp.getProjectTriggers().forEach(function (t) { ScriptApp.deleteTrigger(t); });
  ScriptApp.newTrigger('syncGefest').timeBased().everyHours(1).create();
  syncGefest();
}
