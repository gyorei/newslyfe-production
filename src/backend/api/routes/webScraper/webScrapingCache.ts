/**
 * Web Scraping Cache - Egyszerű memória alapú cache
 * 24 órás TTL képek cache-elésére
 */

interface CacheEntry {
  imageUrl: string | null;
  timestamp: number;
}

// Memória cache
const cache = new Map<string, CacheEntry>();

// Cache konfiguráció
const CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24 óra
const CACHE_TTL_NULL_MS = 1 * 60 * 60 * 1000; // ÚJ: 1 óra a sikertelen keresésekre
const MAX_CACHE_SIZE = 1000; // Maximális cache méret

/**
 * Kép URL lekérése cache-ből
 * @param url - Cikk URL
 * @returns string | null - Cached kép URL vagy null
 */
export function getCachedImage(url: string): string | null {
  const entry = cache.get(url);

  if (!entry) {
    return null;
  }

  // Dinamikus TTL ellenőrzés
  const isMiss = entry.imageUrl === null;
  const ttl = isMiss ? CACHE_TTL_NULL_MS : CACHE_TTL_MS;
  const now = Date.now();

  if (now - entry.timestamp > ttl) {
    cache.delete(url);
    return null;
  }

  return entry.imageUrl;
}

/**
 * Kép URL cache-elése
 * @param url - Cikk URL
 * @param imageUrl - Kép URL (vagy null ha nincs)
 */
export function setCachedImage(url: string, imageUrl: string | null): void {
  // Cache méret korlátozása
  if (cache.size >= MAX_CACHE_SIZE) {
    // Legrégebbi bejegyzés törlése
    const oldestKey = cache.keys().next().value;
    if (oldestKey) {
      cache.delete(oldestKey);
    }
  }

  cache.set(url, {
    imageUrl,
    timestamp: Date.now(),
  });
}

/**
 * Cache tisztítása (opcionális karbantartás)
 */
export function clearCache(): void {
  cache.clear();
}

/**
 * Cache statisztikák (debug célokra)
 */
export function getCacheStats() {
  return {
    size: cache.size,
    maxSize: MAX_CACHE_SIZE,
    ttlHours: CACHE_TTL_MS / (60 * 60 * 1000),
  };
}

// AP NEWS MEDIA CACHE - ÚJ RÉSZEK

/**
 * Cache bejegyzés AP News média adatokhoz (thumbnail és videó URL)
 */
interface CacheEntryApNews {
  media: {
    thumbnailUrl: string | null;
    videoUrl: string | null;
  } | null;
  timestamp: number;
}

// Memória cache AP News média adatokhoz
const cacheApNews = new Map<string, CacheEntryApNews>();

// AP News cache konfiguráció (a meglévő CACHE_TTL_MS és MAX_CACHE_SIZE konstansokat használhatjuk,
// vagy definiálhatunk újakat, ha eltérő viselkedést szeretnénk)

/**
 * AP News média adatok lekérése cache-ből
 * @param url - Cikk URL
 * @returns { thumbnailUrl: string | null, videoUrl: string | null } | null - Cached média adatok vagy null
 */
export function getCachedApNewsMedia(
  url: string,
): { thumbnailUrl: string | null; videoUrl: string | null } | null {
  const entry = cacheApNews.get(url);

  if (!entry) {
    return null;
  }

  // TTL ellenőrzés (a globális CACHE_TTL_MS-t használva)
  const now = Date.now();
  if (now - entry.timestamp > CACHE_TTL_MS) {
    cacheApNews.delete(url);
    return null;
  }

  return entry.media;
}

/**
 * AP News média adatok cache-elése
 * @param url - Cikk URL
 * @param media - Média adatok ({ thumbnailUrl, videoUrl }) vagy null, ha nincs
 */
export function setCachedApNewsMedia(
  url: string,
  media: { thumbnailUrl: string | null; videoUrl: string | null } | null,
): void {
  // Cache méret korlátozása (a globális MAX_CACHE_SIZE-t használva az AP News cache-re is)
  // Megfontolandó lehet külön MAX_CACHE_SIZE_APNEWS bevezetése, ha szükséges.
  if (cacheApNews.size >= MAX_CACHE_SIZE) {
    // Legrégebbi bejegyzés törlése az AP News cache-ből
    const oldestKey = cacheApNews.keys().next().value;
    if (oldestKey) {
      cacheApNews.delete(oldestKey);
    }
  }

  cacheApNews.set(url, {
    media,
    timestamp: Date.now(),
  });
}

/**
 * AP News cache tisztítása (opcionális karbantartás)
 */
export function clearApNewsCache(): void {
  cacheApNews.clear();
}

/**
 * AP News cache statisztikák (debug célokra)
 */
export function getApNewsCacheStats() {
  return {
    size: cacheApNews.size,
    // Ha külön MAX_CACHE_SIZE_APNEWS lenne, itt azt használnánk
    maxSize: MAX_CACHE_SIZE,
    ttlHours: CACHE_TTL_MS / (60 * 60 * 1000),
  };
}
