/**
 * Konfigurációs konstansok a News alkalmazás perzisztencia rétegéhez
 */

export const StorageConfig = {
  // Adatbázis verzió - frissítve a DB_VERSION a fix miatt
  DB_VERSION: 2, // 1-ről 2-re emelve, hogy triggerelődjön az onupgradeneeded

  // IndexedDB nevek és kapcsolódó beállítások
  DB: {
    NAME: 'news-app-db',
    STORES: {
      READ_ARTICLES: 'readArticles',
      TAB_CONTENTS: 'tabContents',
      SAVED_ARTICLES: 'savedArticles',
      SAVE_QUEUE: 'saveQueue',
      KEY_VALUE_STORE: 'keyValueStore',
      USER_PREFERENCES: 'userPreferences', // Helyesen beállítva, egyezik az újonnan létrehozott store nevével
    },
  },

  // LocalStorage kulcsok
  KEYS: {
    LOCAL_STATE: 'news-app-state',
    DEVICE_ID: 'device-id',
    SYNC_INFO: 'sync-info',
    LAST_UPDATE: 'last-update',
    SESSION_ID: 'session-id',
  },

  // Szinkronizációs beállítások
  SYNC: {
    AUTO_SYNC_INTERVAL: 300000, // 5 perc (300,000 ms)
    RETRY_INTERVAL: 60000, // 1 perc (60,000 ms)
    MAX_RETRY_COUNT: 3, // Maximum 3 újrapróbálkozás
    BATCH_SIZE: 50, // Egyszerre ennyi elemet szinkronizálunk
  },
};
