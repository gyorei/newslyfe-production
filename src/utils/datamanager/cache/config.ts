/**
 * Cache Konfiguráció (config.ts)
 *
 * Szolgáltatás célja:
 * - Cache beállítások központi kezelése
 * - TTL (Time To Live) idők definiálása
 * - Cache típusok és szabályok meghatározása
 * - Alapértelmezett értékek biztosítása
 * - Előre definiált cache profilok
 *
 * Kapcsolódó fájlok:
 * - src/utils/cache/index.ts: Fő cache kezelő
 * - src/utils/cache/adaptiveTTL.ts: Dinamikus TTL kezelés
 * - src/data/services/rssService.ts: RSS cache beállítások
 * - src/data/services/newsSourceService.ts: Forrás cache
 *
 * Használat helye:
 * - Cache szolgáltatás konfigurálása
 * - RSS és hírek cache időzítése
 * - Adaptív TTL kalkuláció alapértékei
 *
 * Főbb funkciók:
 * 1. Időzítések
 *    - Gyors frissítésű cache (breaking news)
 *    - Közepes frissítésű cache (általános hírek)
 *    - Lassú frissítésű cache (statikus tartalmak)
 *
 * 2. Cache típusok
 *    - Hírek cache szabályai
 *    - Források cache szabályai
 *    - Metaadat cache szabályai
 *
 * 3. Alapértelmezett beállítások
 *    - Maximális cache méret
 *    - Tisztítási szabályok
 *    - Hibakezelési beállítások
 *
 * 4. Előre definiált profilok
 *    - Különböző tartalmakra optimalizált beállítások
 *    - Gyakran használt konfigurációk
 */

// Cache időtartamok milliszekundumban (közvetlen definíció az optimalizált teljesítményért)
export const CACHE_TIMES = {
  FAST: 5 * 60 * 1000, // 5 perc
  MEDIUM: 15 * 60 * 1000, // 15 perc
  SLOW: 60 * 60 * 1000, // 1 óra
  STATIC: 4 * 60 * 60 * 1000, // 4 óra
  SEARCH: 2 * 60 * 1000, // 2 perc
  ERROR: 5 * 60 * 1000, // 5 perc (hibás feed esetén)
  BACKUP: 60 * 60 * 1000, // 1 óra
} as const;

export const DEFAULT_CACHE_OPTIONS = {
  maxSize: 100,
  ttl: CACHE_TIMES.FAST, // Alapértelmezett TTL
  cleanupInterval: 60 * 1000,
  contentTypes: {
    news: CACHE_TIMES.FAST,
    'news-fast': CACHE_TIMES.FAST,
    'news-medium': CACHE_TIMES.MEDIUM,
    'news-slow': CACHE_TIMES.SLOW,
    'news-backup': CACHE_TIMES.BACKUP,
    'news-error': CACHE_TIMES.ERROR, // Új: hibás feed cache idő
    ui: CACHE_TIMES.MEDIUM,
    settings: CACHE_TIMES.BACKUP,
  },
} as const;

// dataProfiles.ts-ből áthozott előre definiált cache profilok
// Az időket most már milliszekundumban definiáljuk közvetlenül
import { CacheOptions } from './types';

/**
 * Előre definiált cache profilok
 */
export const CacheProfiles = {
  // Gyors cache rövid TTL-lel (5 perc)
  FAST_CACHE: {
    ttl: CACHE_TIMES.FAST, // 5 perc milliszekundumban
  } as CacheOptions,

  // Közepes élettartamú cache (15 perc)
  MEDIUM_CACHE: {
    ttl: CACHE_TIMES.MEDIUM, // 15 perc milliszekundumban
  } as CacheOptions,

  // Hosszú élettartamú cache (1 óra)
  LONG_CACHE: {
    ttl: CACHE_TIMES.SLOW, // 1 óra milliszekundumban
  } as CacheOptions,

  // Ritkán változó tartalom cache (4 óra)
  STATIC_CACHE: {
    ttl: CACHE_TIMES.STATIC, // 4 óra milliszekundumban
  } as CacheOptions,

  // Keresési eredmények gyorsítótára (2 perc)
  SEARCH_RESULTS: {
    namespace: 'search',
    ttl: CACHE_TIMES.SEARCH, // 2 perc milliszekundumban
  } as CacheOptions,
};

type CacheContentTypes = typeof DEFAULT_CACHE_OPTIONS.contentTypes;
type ContentType = keyof CacheContentTypes;

/**
 * Cache Invalidációs Stratégia
 */
export class CacheInvalidationStrategy {
  private static readonly MAX_RETRY_COUNT = 3;
  private retryCounters = new Map<string, number>();

  shouldCache(key: string, error?: Error): boolean {
    const retryCount = this.retryCounters.get(key) || 0;

    if (error) {
      this.retryCounters.set(key, retryCount + 1);
      return retryCount < CacheInvalidationStrategy.MAX_RETRY_COUNT;
    }

    this.retryCounters.delete(key);
    return true;
  }

  getCacheDuration(contentType: string, hasError: boolean): number {
    // Ellenőrizzük, hogy a contentType érvényes-e
    const validContentType = contentType as ContentType;
    const baseDuration =
      DEFAULT_CACHE_OPTIONS.contentTypes[validContentType] || DEFAULT_CACHE_OPTIONS.ttl;

    return hasError ? Math.min(baseDuration, CACHE_TIMES.ERROR) : baseDuration;
  }
}

export const invalidationStrategy = new CacheInvalidationStrategy();
