/**
 * Lokális RSS és Lokalizációs Konfiguráció
 *
 * Ez a fájl csak azokat a konfigurációs értékeket tartalmazza,
 * amelyeket rendszeresen állítani kell a teljesítmény vagy
 * működés optimalizálásához.
 */

/**
 * Cache időbeállítások
 *
 * Ezek módosításával finomhangolható a rendszer teljesítménye és a frissítések gyakorisága.
 * A MEDIUM értéket már jelenleg is használja a getNewsSourcesByCountry függvény.
 */
export const CACHE_TIMES = {
  SHORT: 5 * 60 * 1000, // 5 perc - gyakran változó adatok
  MEDIUM: 30 * 60 * 1000, // 30 perc - hírek és források (növelve 20 percről)
  LONG: 60 * 60 * 1000, // 1 óra - ritkábban változó elemek
  VERY_LONG: 24 * 60 * 60 * 1000, // 1 nap - statikus adatok
};

/**
 * RSS lekérés és parse optimalizációs beállítások
 *
 * Ezek a beállítások befolyásolják az RSS feldolgozás sebességét és a
 * felhasználói élményt. Ezeket gyakran kell állítani a terhelés és
 * teljesítmény függvényében.
 */
export const RSS_CONFIG = {
  // Egyszerre lekérendő forrás limitek
  MAX_SOURCES_PER_REQUEST: 3000, // Csökkentve 100-ról 50-re a gyorsabb betöltés érdekében

  // Időbeli beállítások
  RSS_CACHE_TTL: 60 * 60 * 1000, // 60 perc cache élettartam RSS híreknek (növelve 15-ről)

  // Újrapróbálkozási beállítások
  MAX_RETRIES: 2, // Csökkentve a hibás kérések újrapróbálkozásainak számát
  RETRY_DELAY: 1500, // Növelt késleltetés újrapróbálkozásnál (ms)

  // API timeout értékek
  FETCH_TIMEOUT: 8000, // Csökkentve 10-ről 8 másodpercre a timeout értéke

  // Explicit fontossági szintek definiálása
  IMPORTANCE_LEVELS: {
    CRITICAL: 1, // Kritikus fontosságú hírek
    STANDARD: 2, // Átlagos fontosságú hírek
    OPTIONAL: 4, // Opcionális hírek
  },

  // ✅ ÚJ: Szűrési beállítások - Központi kapcsolók
  FILTERING: {
    // 🔧 GLOBÁLIS KAPCSOLÓ - Ha false, minden szűrés kikapcsolva
    ENABLED: false, // MÓDOSÍTSD ezt false-ra az összes szűrés kikapcsolásához

    // 📊 Részletes kapcsolók - finomhangoláshoz
    IMPORTANCE_FILTER_ENABLED: true, // Fontosság szerinti szűrés (fontossag mező)
    COUNTRY_FILTER_ENABLED: true, // Ország szerinti szűrés
    CONTINENT_FILTER_ENABLED: true, // Kontinens szerinti szűrés
    TOP_SITES_PRIORITY_ENABLED: true, // TOP források priorizálása
    TOP_SITES_FILTER_ENABLED: true, // ✅ ÚJ: TOP források szűrése (csak TOP források megjelenítése)

    // 🛠️ Fejlesztői módok
    DEBUG_MODE: false, // Részletes console logok (true = több log)
    BYPASS_ALL_FILTERS: false, // Vészhelyzeti bypass (true = minden átmegy)
  },

  // Betöltési limitek szintenként - MEGNÖVELVE
  MAX_SOURCES_BY_IMPORTANCE: {
    1: 1000, // ← JAVÍTVA: 10-ről 1000-re (kritikus hírek)
    2: 1000, // ← JAVÍTVA: 25-ről 1000-re (standard hírek)
    4: 1000, // ← JAVÍTVA: 50-ről 1000-re (opcionális hírek)
  },

  // ÚJ: Földrajzi alapú szűrési beállítások
  LOCATION_BASED_FILTERING: {
    ENABLED: false, // Módosítva: kikapcsolva
    ONLY_USER_COUNTRY: false, // Módosítva: ne csak a felhasználó országát töltse be
    LOAD_INTERNATIONAL: true, // Módosítva: engedélyezzük a nemzetközi forrásokat
    RESPECT_URL_PARAMS: false, // Módosítva: URL paraméterek figyelmen kívül hagyása
  },

  // Scroll figyelő küszöbértékek
  SCROLL_THRESHOLD: 0.8, // Ha a felhasználó a tartalom 80%-áig görget, betöltjük a következő szintet

  // Előtöltési konfiguráció
  PRELOAD_THRESHOLD: 0.6, // Ennél a görgetési százaléknál kezdjük az előtöltést
  PRELOAD_TIMEOUT: 2000, // Előtöltés minimális késleltetése (ms), hogy elkerüljük a túl gyakori lekérést

  // ÚJ: Intelligens Fallback Mechanizmus konfigurációja
  FALLBACK: {
    ENABLED: true, // Fallback funkciók engedélyezése
    USE_ALTERNATIVE_URLS: true, // Alternatív RSS URL-ek kipróbálása
    USE_HTML_SCRAPING: true, // HTML scraping használata RSS hiba esetén
    RETRY_FAILED_SOURCES: true, // Időszakos újrapróbálkozás
  },

  // ÚJ: Újrapróbálkozási időintervallumok hibatípusonként
  RETRY_INTERVALS: {
    NOT_FOUND: 24 * 60 * 60 * 1000, // 24 óra a 404-es hibák után
    SERVER_ERROR: 30 * 60 * 1000, // 30 perc szerver hibák után
    CONNECTION_ERROR: 5 * 60 * 1000, // 5 perc kapcsolati hibák után
  },

  // ÚJ: Maximum újrapróbálkozások hibatípusonként
  MAX_RETRY_ATTEMPTS: {
    NOT_FOUND: 3, // 3 próba 404-es hibáknál
    SERVER_ERROR: 5, // 5 próba 5xx hibáknál
    CONNECTION_ERROR: 10, // 10 próba hálózati hibáknál
  },

  // ÚJ: HTML scraping beállítások
  HTML_SCRAPING: {
    ENABLED: true, // HTML scraping engedélyezése
    MAX_ITEMS: 5, // Maximum elemek száma HTML scrapingből
    MIN_TITLE_LENGTH: 10, // Minimum címhossz (spam szűrés)
    SELECTORS: [
      // CSS szelektorok tartalom kereséséhez
      'article',
      '.news-item',
      '.post',
      '.entry',
      '.story',
      '.cikk', // Magyar oldalakhoz
      '.hir', // Magyar oldalakhoz
    ],
  },

  // ÚJ: Forrás prioritások - progresszív hibatűrés
  SOURCE_PRIORITY: {
    HIGH: {
      // Fontos, gyakran frissülő források
      NOT_FOUND: 12 * 60 * 60 * 1000, // 12 óra
      SERVER_ERROR: 15 * 60 * 1000, // 15 perc
      CONNECTION_ERROR: 2 * 60 * 1000, // 2 perc
    },
    // Normál források a default értékeket használják
  },

  // ÚJ: Teljesítmény monitoring
  FALLBACK_STATS: {
    totalAttempts: 0,
    successfulFallbacks: 0,
    alternativeUrlHits: 0,
    htmlScrapingHits: 0,
    recoveredSources: {}, // Objektum, ahol a kulcsok a forrás ID-k
  },

  // ÚJ: Cache méret korlátozás
  MAX_CACHE_ENTRIES: 100, // Maximum cache bejegyzések száma
};

/**
 * API végpontok
 *
 * Külső API címek, amelyeket esetleg módosítani kell,
 * ha változik a szolgáltató vagy új lehetőséget használunk
 */
export const API_ENDPOINTS = {
  // IP alapú helymeghatározás API - frissítve a saját proxy használatára
  LOCATION_API: 'https://localhost:3002/api/rss/ipapi',
};

/**
 * ÚJ: RSS URL minták
 * Gyakori RSS URL minták, amelyeket használunk alternatív URL-ek generálásához
 */
export const RSS_URL_PATTERNS = [
  'feed',
  'feed.xml',
  'rss',
  'rss.xml',
  'atom.xml',
  'index.xml',
  'feeds/posts/default',
  '?feed=rss',
  '?feed=rss2',
  'blog/feed',
  'news/feed',
  'blog/atom',
  'feed/atom',
  'rss/latest',
];

// Nevesített objektum exportálása a lint hiba elkerülése érdekében
export const localRssConfig = {
  CACHE_TIMES,
  RSS_CONFIG,
  API_ENDPOINTS,
  RSS_URL_PATTERNS,
};

export default localRssConfig;
