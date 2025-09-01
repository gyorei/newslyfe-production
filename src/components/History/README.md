# History komponens

Rövid összefoglaló:
- A History mappa a felhasználói előzmények megjelenítéséért és tárolásáért felel.
- Fő fájlok:
  - HistoryPanel/HistoryPanel.tsx — a napokra rendezett előzmények listáját jeleníti meg.
  - HistoryItem/HistoryItem.tsx — egyetlen előzmény sor megjelenítése.
  - utils/history.types.ts — HistoryEntry típus-definíció.
  - utils/historyStorage.ts — localStorage alapú mentés és betöltés.
  - utils/UserHistoryService.ts — egyszerű service logoláshoz és lekéréshez.

Használat:
- Új bejegyzés mentése: UserHistoryService.logVisit(entry: HistoryEntry)
- Megjelenítés: HistoryPanel a UserHistoryService.getAllHistory() alapján épül fel.

I18n / fordítások:
- A magyar fordítási kulcsok hozzáadásra kerültek a src/locales/hu.ts fájlban: "history" gyökér alatt találhatók (pl. history.title, history.table.time, history.table.title, history.table.source, history.table.empty, history.actions.toggle).
- A komponensek a useTranslation hookkal (react-i18next) használhatják ezeket a kulcsokat: pl. t('history.table.time').

Megjegyzés:
- Ha további mezőket vagy feliratokat szeretnél fordítani, bővítsd a src/locales/hu.ts fájlt és a komponensekben használd a megfelelő kulcsokat.
