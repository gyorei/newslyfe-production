/*
 * useTabCache.ts
 *
 * TAB CACHE KEZELŐ HOOK (News app)
 * --------------------------------
 * Ez a hook felelős a tab tartalom cache kezeléséért:
 *  - Memória cache kezelés (LRU stratégia)
 *  - Cache invalidálás és cleanup
 *  - Tab tartalom betöltése és mentése
 *  - Háttér frissítés (background refresh)
 *  - Késleltetett DB mentés (throttling)
 *
 * Szétválasztva a useTabStorage.ts-ből a Single Responsibility Principle alapján.
 */
import { useRef, useCallback, useEffect } from 'react';
import { useStorage } from '../useStorage';
import { TabContentData } from '../../utils/datamanager/storage/indexedDBTypes';

// Memória cache típusa
interface MemoryCacheEntry {
  content: TabContentData;
  timestamp: number;
}

// Cache érvényességi konfiguráció
const CACHE_CONFIG = {
  MAX_AGE: 2 * 60 * 60 * 1000, // 2 óra
  MAX_TABS: 20,
  REFRESH_INTERVAL: 15 * 60 * 1000, // 15 perc
};

const SAVE_DELAY = 1000; // 1000ms késleltetés

// Debug helper - csak development módban
const DEBUG_TAB_CACHE = false;

const debugLog = (message: string, ...args: unknown[]) => {
  if (DEBUG_TAB_CACHE && process.env.NODE_ENV === 'development') {
    console.log(`[useTabCache] ${message}`, ...args);
  }
};

export function useTabCache() {
  const { saveTabContent, getTabContent: getTabContentFromStorage } = useStorage();

  const memoryCache = useRef<Map<string, MemoryCacheEntry>>(new Map());
  const saveTimeouts = useRef<Map<string, number>>(new Map());

  // ✅ GLOBÁLIS REFERENCIA: clearAllTabCache függvény számára
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const windowWithCache = window as Window & { __tabMemoryCache?: Map<string, MemoryCacheEntry> };
      windowWithCache.__tabMemoryCache = memoryCache.current;
    }
  }, []);

  // Cleanup useEffect - Memory leak prevention
  useEffect(() => {
    return () => {
      // Cleanup timeouts
      saveTimeouts.current.forEach(timeoutId => {
        window.clearTimeout(timeoutId);
      });
      saveTimeouts.current.clear();
      
      // Clear cache
      memoryCache.current.clear();
      debugLog('Cache és timeouts törölve cleanup során');
    };
  }, []);

  // Cache cleanup logika
  const performCacheCleanup = useCallback(() => {
    const now = Date.now();

    // Régi elemek törlése
    for (const [tabId, entry] of memoryCache.current) {
      if (now - entry.timestamp > CACHE_CONFIG.MAX_AGE) {
        debugLog(`Lejárt cache törlése: ${tabId}`);
        memoryCache.current.delete(tabId);
      }
    }

    // LRU elv alkalmazása, ha túl sok elem van
    if (memoryCache.current.size > CACHE_CONFIG.MAX_TABS) {
      const entries = Array.from(memoryCache.current.entries()).sort(
        ([, a], [, b]) => a.timestamp - b.timestamp,
      );

      for (let i = 0; i < entries.length - CACHE_CONFIG.MAX_TABS; i++) {
        const [tabId] = entries[i];
        if (tabId) {
          debugLog(`LRU cache törlés: ${tabId}`);
          memoryCache.current.delete(tabId);
        }
      }
    }
  }, []);

  // Cache invalidálása egy adott tabra
  const invalidateCache = useCallback((tabId: string) => {
    console.log(`[useTabCache] Cache invalidálása: ${tabId}`);
    memoryCache.current.delete(tabId);
  }, []);

  // Manuális frissítés - cache invalidálással és újratöltéssel
  const refreshTabContent = useCallback(
    async (tabId: string): Promise<TabContentData | null> => {
      // Cache törlése az adott tabra
      invalidateCache(tabId);

      // IndexedDB-ből töltjük be az adatokat
      const content = await getTabContentFromStorage(tabId);

      // Ha van friss tartalom, frissítjük a memória cache-t is
      if (content) {
        memoryCache.current.set(tabId, {
          content,
          timestamp: Date.now(),
        });
      }

      return content;
    },
    [invalidateCache, getTabContentFromStorage],
  );

  // Tab tartalom betöltése (először memóriából, aztán DB-ből)
  const loadTabContent = useCallback(
    async (tabId: string, options?: { forceRefresh?: boolean; expectedCountry?: string }): Promise<TabContentData | null> => {
      // CACHE BYPASS: Ha a forceRefresh opció aktív
      if (options?.forceRefresh) {
        console.log(`[useTabCache] forceRefresh aktív, cache teljesen kihagyva: ${tabId}`);
        return null;
      }

      console.log(`[useTabCache] Tab tartalom betöltése: ${tabId}`);

      // 1. Ellenőrizzük a memória cache-t (FAST PATH)
      let cachedEntry = memoryCache.current.get(tabId);

      // ✅ Ország-meta validáció memóriában
      if (cachedEntry && options?.expectedCountry) {
        const cachedCountry = (cachedEntry.content as any)?.meta?.country;
        if (cachedCountry && cachedCountry !== options.expectedCountry) {
          console.log(`[useTabCache] ⚠️ Cache ország mismatch (${cachedCountry} ≠ ${options.expectedCountry}) – invalidáljuk: ${tabId}`);
          memoryCache.current.delete(tabId);
          cachedEntry = undefined;
        }
      }

      if (cachedEntry) {
        console.log(`[useTabCache] Tab tartalom betöltve memória cache-ből (GYORS): ${tabId}`);

        // Frissítjük az időbélyeget (LRU stratégia miatt)
        memoryCache.current.set(tabId, {
          ...cachedEntry,
          timestamp: Date.now(),
        });

        // Háttér frissítés beállítása, ha a cache már túl régi
        const now = Date.now();
        if (
          now - cachedEntry.timestamp > CACHE_CONFIG.REFRESH_INTERVAL &&
          now - cachedEntry.timestamp < CACHE_CONFIG.MAX_AGE
        ) {
          console.log(`[useTabCache] Háttérben frissítjük a régi cache-t: ${tabId}`);
          setTimeout(() => {
            refreshTabContent(tabId).catch((err) => {
              console.error(`[useTabCache] Hiba a háttér frissítéskor: ${tabId}`, err);
            });
          }, 0);
        }

        return cachedEntry.content;
      }

      // 2. Ha nincs a cache-ben, elérjük az IndexedDB-t (SLOW PATH)
      console.log(`[useTabCache] Tab tartalom betöltése IndexedDB-ből (LASSÚ): ${tabId}`);
      const content = await getTabContentFromStorage(tabId);

      // 3. Ha van tartalom, eltároljuk a memória cache-ben
      if (content) {
        console.log(`[useTabCache] Tab tartalom mentése memória cache-be: ${tabId}`);
        memoryCache.current.set(tabId, {
          content,
          timestamp: Date.now(),
        });

        // Takarítás, ha szükséges
        performCacheCleanup();
      }

      return content;
    },
    [getTabContentFromStorage, performCacheCleanup, refreshTabContent],
  );

  // Késleltetett DB mentést kezelő függvény
  const scheduleThrottledDbSave = useCallback(
    (tabId: string, content: TabContentData) => {
      // Töröljük a korábbi időzítőt, ha létezik
      if (saveTimeouts.current.has(tabId)) {
        window.clearTimeout(saveTimeouts.current.get(tabId));
        saveTimeouts.current.delete(tabId);
      }

      // Új időzítő beállítása a mentéshez
      const timeoutId = window.setTimeout(async () => {
        console.log(`[useTabCache] Késleltetett IndexedDB mentés: ${tabId}`);
        await saveTabContent(tabId, content);
        saveTimeouts.current.delete(tabId);
      }, SAVE_DELAY);

      saveTimeouts.current.set(tabId, timeoutId);
    },
    [saveTabContent],
  );

  // Tab tartalom mentése (memória cache + késleltetett DB írás)
  const saveCurrentTabContent = useCallback(
    async (content: TabContentData, tabId: string, country?: string): Promise<boolean> => {
      console.log(`[useTabCache] Tab tartalom mentése: ${tabId}`, content);

      if (tabId && tabId !== 'default') {
        try {
          // 1. Azonnali mentés a memória cache-be
          console.log(`[useTabCache] Mentés a memóriába: ${tabId}`, content);
          memoryCache.current.set(tabId, {
            content,
            timestamp: Date.now(),
          });
          console.log(`[useTabCache] Tab tartalom mentve memória cache-be: ${tabId}`);

          // 2. Késleltetett mentés az IndexedDB-be
          scheduleThrottledDbSave(tabId, content);

          // Takarítás, ha szükséges
          performCacheCleanup();

          return true;
        } catch (error) {
          console.error(`[useTabCache] Hiba a tab tartalom mentésekor: ${tabId}`, error);
          return false;
        }
      } else {
        console.warn(`[useTabCache] Nem lehet menteni a tab tartalmát érvénytelen azonosítóval: ${tabId}`);
        return false;
      }
    },
    [scheduleThrottledDbSave, performCacheCleanup],
  );

  // Cache statisztikák
  const getCacheInfo = useCallback(() => {
    return {
      size: memoryCache.current.size,
      maxSize: CACHE_CONFIG.MAX_TABS,
      entries: Array.from(memoryCache.current.keys()),
    };
  }, []);

  /**
   * ✅ ÚJ: Ellenőrzi, hogy egy tab cache friss-e
   * @param tabId A tab azonosítója
   * @param maxAgeMinutes Maximum frissességi idő percben (alapértelmezett: 1440 perc = 24 óra)
   * @returns Promise<boolean> true, ha a cache friss
   */
  const isCacheFresh = useCallback(async (tabId: string, maxAgeMinutes: number = 1440) => {
    if (!tabId) return false;
    
    // 1. Először a memória cache ellenőrzése (gyors)
    const memoryEntry = memoryCache.current.get(tabId);
    if (memoryEntry) {
      const now = Date.now();
      const isFresh = (now - memoryEntry.timestamp) < (maxAgeMinutes * 60 * 1000);
      
      if (isFresh) {
        console.log(`[useTabCache] 🟢 Friss memória cache (${Math.round((now - memoryEntry.timestamp)/1000)}s): ${tabId}`);
        return true;
      }
      
      console.log(`[useTabCache] 🟠 Lejárt memória cache (${Math.round((now - memoryEntry.timestamp)/1000)}s): ${tabId}`);
    }
    
    // 2. Ha nincs memóriában vagy nem friss, IndexedDB ellenőrzése
    try {
      const dbEntry = await getTabContentFromStorage(tabId);
      if (dbEntry && dbEntry.timestamp) {
        const now = Date.now();
        const isFresh = (now - dbEntry.timestamp) < (maxAgeMinutes * 60 * 1000);
        
        if (isFresh) {
          console.log(`[useTabCache] 🟢 Friss IndexedDB cache (${Math.round((now - dbEntry.timestamp)/1000)}s): ${tabId}`);
          return true;
        }
        
        console.log(`[useTabCache] 🟠 Lejárt IndexedDB cache (${Math.round((now - dbEntry.timestamp)/1000)}s): ${tabId}`);
      }
    } catch (error) {
      console.error(`[useTabCache] Hiba az IndexedDB cache ellenőrzése közben:`, error);
    }
    
    console.log(`[useTabCache] Nincs cache: ${tabId}`);
    return false;
  }, [getTabContentFromStorage]);

  /**
   * ÚJ: Tab tartalom lekérése bármely forrásból (memória vagy IndexedDB)
   * @param tabId A tab azonosítója
   * @param expectedCountry Elvárt ország validációhoz
   * @returns Promise<TabContentData | null>
   */
  const getTabContent = useCallback(async (tabId: string, expectedCountry?: string): Promise<TabContentData | null> => {
    if (!tabId) return null;
    
    // 1. Először a memória cache ellenőrzése (gyors)
    let memoryEntry = memoryCache.current.get(tabId);
    
    // Ország-meta validáció memóriában
    if (memoryEntry && expectedCountry) {
      const cachedCountry = (memoryEntry.content as any)?.meta?.country;
      if (cachedCountry && cachedCountry !== expectedCountry) {
        console.log(`[useTabCache] getTabContent ország mismatch (${cachedCountry} ≠ ${expectedCountry}) – invalidáljuk: ${tabId}`);
        memoryCache.current.delete(tabId);
        memoryEntry = undefined;
      }
    }
    
    if (memoryEntry) {
      console.log(`[useTabCache] Tab tartalom betöltve memória cache-ből: ${tabId}`);
      return memoryEntry.content;
    }
    
    // 2. Ha nincs memóriában, IndexedDB ellenőrzése
    try {
      const dbEntry = await getTabContentFromStorage(tabId);
      if (dbEntry) {
        // Ország validáció IndexedDB-ben is
        if (expectedCountry) {
          const cachedCountry = (dbEntry as any)?.meta?.country;
          if (cachedCountry && cachedCountry !== expectedCountry) {
            console.log(`[useTabCache] getTabContent IndexedDB ország mismatch (${cachedCountry} ≠ ${expectedCountry}) – kihagyva: ${tabId}`);
            return null;
          }
        }
        
        console.log(`[useTabCache] Tab tartalom betöltve IndexedDB-ből: ${tabId}`);
        // JAVÍTÁS: Explicit típuskonverzió a hibák elkerülése érdekében
        return dbEntry as TabContentData;
      }
    } catch (error) {
      console.error(`[useTabCache] Hiba az IndexedDB betöltésekor:`, error);
    }
    
    console.log(`[useTabCache] Nincs elérhető tartalom: ${tabId}`);
    return null;
  }, [getTabContentFromStorage]);

  return {
    // Tartalom műveletek
    loadTabContent,
    saveTabContent: saveCurrentTabContent,
    refreshTabContent,
    
    // Cache műveletek
    invalidateCache,
    getCacheInfo,
    
    // Tisztítás
    performCacheCleanup,

    // ✅ ÚJ: Frissesség és tartalom ellenőrző függvények exportálása
    isCacheFresh,
    getTabContent,
  };
}