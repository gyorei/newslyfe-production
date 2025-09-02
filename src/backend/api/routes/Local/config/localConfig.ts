/**
 * Lokális RSS és Lokalizációs Konfiguráció
 *
 * Áthelyezve: src/data/local/config/ -> src/backend/api/routes/Local/
 * Módosítva: Minden szűrés eltávolítva, limitek maximalizálva
 */

/**
 * Cache időbeállítások
 */
export const CACHE_TIMES = {
  SHORT: 5 * 60 * 1000, // 5 perc - gyakran változó adatok
  MEDIUM: 30 * 60 * 1000, // 30 perc - hírek és források
  LONG: 60 * 60 * 1000, // 1 óra - ritkábban változó elemek
  VERY_LONG: 24 * 60 * 60 * 1000, // 1 nap - statikus adatok
};

/**
 * RSS lekérés és parse beállítások - MINDEN KORLÁTOZÁS MEGSZÜNTETVE
 */
export const RSS_CONFIG = {
  // Egyszerre lekérendő forrás limitek - MAXIMALIZÁLVA
  MAX_SOURCES_PER_REQUEST: 10000, // 150-ről 10000-re emelve

  // Kezdetben letöltendő hírek maximális száma
  INITIAL_NEWS_LIMIT_LOCAL: 20,
  INITIAL_NEWS_LIMIT_COUNTRY: 20,
  INITIAL_NEWS_LIMIT_CONTINENT: 20,

  // Időbeli beállítások
  RSS_CACHE_TTL: 60 * 60 * 1000,

  // Újrapróbálkozási beállítások
  MAX_RETRIES: 5, // Növelve
  RETRY_DELAY: 1000, // Csökkentve gyorsabb próbálkozásokhoz

  // API timeout értékek
  FETCH_TIMEOUT: 15000, // Növelve 8-ról 15 másodpercre

  // Explicit fontossági szintek definiálása - MIND A MAXIMUM ÉRTÉKRE
  IMPORTANCE_LEVELS: {
    CRITICAL: 10, // 1-ről 10-re növelve
    STANDARD: 10, // 2-ről 10-re növelve
    OPTIONAL: 10, // 4-ről 10-re növelve
  },

  // Betöltési limitek szintenként - MAXIMALIZÁLVA
  MAX_SOURCES_BY_IMPORTANCE: {
    1: 10000, // 10-ről 10000-re növelve
    2: 10000, // 25-ről 10000-re növelve
    4: 10000, // 50-ről 10000-re növelve
  },

  // Földrajzi alapú szűrési beállítások - KIKAPCSOLVA
  LOCATION_BASED_FILTERING: {
    ENABLED: false, // Kikapcsolva
    ONLY_USER_COUNTRY: false, // Kikapcsolva
    LOAD_INTERNATIONAL: true, // Bekapcsolva
    RESPECT_URL_PARAMS: true,
  },

  // Scroll figyelő küszöbértékek - CSÖKKENTVE
  SCROLL_THRESHOLD: 0.2, // 0.8-ról 0.2-re csökkentve - korai betöltés

  // Előtöltési konfiguráció - GYORSÍTVA
  PRELOAD_THRESHOLD: 0.2, // 0.6-ról 0.2-re csökkentve
  PRELOAD_TIMEOUT: 500, // 2000-ről 500-ra csökkentve

  // Intelligens Fallback Mechanizmus - MIND BEKAPCSOLVA
  FALLBACK: {
    ENABLED: true,
    USE_ALTERNATIVE_URLS: true,
    USE_HTML_SCRAPING: true,
    RETRY_FAILED_SOURCES: true,
  },

  // HTML scraping beállítások - MAXIMALIZÁLVA
  HTML_SCRAPING: {
    ENABLED: true,
    MAX_ITEMS: 100, // 5-ről 100-ra növelve
    MIN_TITLE_LENGTH: 1, // 10-ről 1-re csökkentve
    SELECTORS: [
      // Bővített szelektorok
      'article',
      '.news-item',
      '.post',
      '.entry',
      '.story',
      '.cikk',
      '.hir',
      '.content',
      'main',
      '.news',
      '.article',
      '.headline',
      'h1',
      'h2',
      '.title',
      '.body',
      '.text',
    ],
  },

  // Cache méret korlátozás - MAXIMALIZÁLVA
  MAX_CACHE_ENTRIES: 10000, // 100-ról 10000-re növelve
};

export const localRssConfig = {
  CACHE_TIMES,
  RSS_CONFIG,
};

export default localRssConfig;
