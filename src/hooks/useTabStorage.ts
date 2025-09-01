/*
 * useTabStorage.ts
 *
 * TAB TARTALOM ÉS ÁLLAPOT KEZELŐ HOOK (News app)
 * ---------------------------------------------
 * Ez a hook felelős a tabok tartalmának gyors, memóriában és IndexedDB-ben történő kezeléséért:
 *  - Tab tartalom betöltése, mentése, cache-elése (memória + IndexedDB)
 *  - Tabok létrehozása, bezárása, átrendezése, aktívvá tétele
 *  - Pagination állapot mentése/betöltése minden tabhoz külön
 *  - Memória cache statisztikák, automatikus cache cleanup, teljesítményfigyelés
 *  - NINCS duplikáció a useStorage-hoz képest: a perzisztens storage műveleteket a useStorage hook végzi, ez csak a tab-specifikus logikát és gyorsítótárat kezeli
 *
 * Főbb használati helyek:
 *  - Content, Panel, TabController komponensek (tab tartalom, scroll, pagination)
 *  - Minden tabhoz külön cache és állapot
 *
 * A hook célja: gyors, böngésző-szerű tab élmény, gyors váltás, állapotmegőrzés, memória- és storage-optimalizáció.
 *//*
import { useState, useCallback, useEffect, useRef } from 'react';
import { useStorage } from './useStorage';
import { TabDefinition } from '../utils/datamanager/types/storage';
import { TabContentData } from '../utils/datamanager/storage/indexedDBTypes';
import { PaginationStorage } from '../utils/datamanager/services/PaginationStorage'; // ✅ ÚJ: PaginationStorage import

// Memória cache típusa
interface MemoryCacheEntry {
  content: TabContentData;
  timestamp: number;
}

// Cache érvényességi konfiguráció
const CACHE_CONFIG = {
  // ✅ OPTIMALIZÁLVA: Cache érvényességi idő 30 perc → 2 óra
  MAX_AGE: 2 * 60 * 60 * 1000,
  // ✅ OPTIMALIZÁLVA: Maximum tárolt tab-ok száma 10 → 20
  MAX_TABS: 20,
  // ✅ OPTIMALIZÁLVA: Frissítési időköz 5 perc → 15 perc
  REFRESH_INTERVAL: 15 * 60 * 1000,
};

// ✅ JAVÍTÁS: Hiányzó konstansok hozzáadása
const SAVE_DELAY = 1000; // 1000ms késleltetés

// Debug helper - csak development módban
const _IS_DEVELOPMENT = process.env.NODE_ENV === 'development';
const DEBUG_TAB_STORAGE = false; // ✅ JAVÍTÁS: Explicit kikapcsolás a túlterhelés elkerülésére

const debugLog = (message: string, ...args: unknown[]) => {
  if (DEBUG_TAB_STORAGE) {
    console.log(`[useTabStorage] ${message}`, ...args);
  }
};

// ✅ JAVÍTÁS: Performance memory interface
declare global {
  interface Performance {
    memory?: {
      usedJSHeapSize: number;
      totalJSHeapSize: number;
      jsHeapSizeLimit: number;
    };
  }
}

export function useTabStorage() {
  const {
    state,
    updateTabState,
    saveTabContent,
    getTabContent,
    // ❌ ELTÁVOLÍTVA: saveScrollPosition - duplikáció megszüntetve, ScrollStorage service használata helyett
  } = useStorage();

  const [activeTabId, setActiveTabId] = useState<string>('default');
  const [tabs, setTabs] = useState<TabDefinition[]>([]);

  const memoryCache = useRef<Map<string, MemoryCacheEntry>>(new Map());

  // ✅ JAVÍTÁS: Hiányzó saveTimeouts ref hozzáadása
  const saveTimeouts = useRef<Map<string, number>>(new Map());

  // ✅ ÚJ: Fejlett cache statisztikák tracking
  const [memCacheStats, setMemCacheStats] = useState<{
    hits: number;
    misses: number;
    size: number;
    hitRate: number;
    avgAccessTime: number;
    lastCleanup: number;
  }>({
    hits: 0,
    misses: 0,
    size: 0,
    hitRate: 0,
    avgAccessTime: 0,
    lastCleanup: Date.now(),
  });

  // ✅ ÚJ: Performance tracking
  const performanceMetrics = useRef({
    accessTimes: [] as number[],
    lastMeasurement: Date.now(),
  });

  // ✅ ÚJ: Memory usage tracking
  const trackMemoryUsage = useCallback(() => {
    if (performance.memory) {
      const used = Math.round(performance.memory.usedJSHeapSize / 1024 / 1024);
      const total = Math.round(performance.memory.totalJSHeapSize / 1024 / 1024);
      const percentage = ((used / total) * 100).toFixed(1);

      if (used > 100) {
        // Warning if over 100MB
        console.warn(`[useTabStorage] Magas memóriahasználat: ${used}MB (${percentage}%)`);
      }
    }
  }, []);

  // ✅ ÚJ: Cache hit rate számítása és logging
  const _logAdvancedCacheStats = useCallback(() => {
    const total = memCacheStats.hits + memCacheStats.misses;
    const hitRate = total > 0 ? ((memCacheStats.hits / total) * 100).toFixed(1) : '0.0';
    const avgTime =
      performanceMetrics.current.accessTimes.length > 0
        ? (
            performanceMetrics.current.accessTimes.reduce((a, b) => a + b, 0) /
            performanceMetrics.current.accessTimes.length
          ).toFixed(2)
        : '0.00';

    console.log(
      `[useTabStorage] 📊 Cache Stats - Size: ${memoryCache.current.size}, Hit Rate: ${hitRate}%, Avg Access: ${avgTime}ms`,
    );

    // Critical performance warning
    if (parseFloat(hitRate) < 50 && total > 10) {
      console.warn(
        `[useTabStorage] ⚠️ ALACSONY CACHE HATÉKONYSÁG: ${hitRate}% - optimalizálás szükséges!`,
      );
    }

    // Memory leak detection
    if (memoryCache.current.size > CACHE_CONFIG.MAX_TABS * 2) {
      console.error(
        `[useTabStorage] 🚨 MEMORY LEAK GYANÚ: ${memoryCache.current.size} cache entries!`,
      );
    }
  }, [memCacheStats]);

  // ✅ ÚJ: Performance measurement wrapper - prefixeljük _-el ha nem használjuk
  const _measurePerformance = useCallback(<T>(operation: () => T, operationName: string): T => {
    const startTime = performance.now();
    const result = operation();
    const duration = performance.now() - startTime;

    // Track access times (keep last 100 measurements)
    performanceMetrics.current.accessTimes.push(duration);
    if (performanceMetrics.current.accessTimes.length > 100) {
      performanceMetrics.current.accessTimes.shift();
    }

    // Log slow operations
    if (duration > 50) {
      console.warn(`[useTabStorage] 🐌 LASSÚ MŰVELET: ${operationName} - ${duration.toFixed(2)}ms`);
    }

    return result;
  }, []);

  // Inicializálás a tárolt állapotból
  useEffect(() => {
    if (state?.tabs) {
      setActiveTabId(state.tabs.activeId);
      setTabs(state.tabs.definitions as unknown as TabDefinition[]);
    }
  }, [state?.tabs]);

  // Debug: Memória cache metrikákat kiírni
  useEffect(() => {
    if (!DEBUG_TAB_STORAGE) return;

    const logInterval = setInterval(() => {
      debugLog(
        `Memory cache stats - Size: ${memoryCache.current.size}, Hits: ${memCacheStats.hits}, Misses: ${memCacheStats.misses}`,
      );
    }, 300000); // ✅ JAVÍTÁS: 1 perc → 5 perc (300000ms)

    return () => clearInterval(logInterval);
  }, [memCacheStats]);

  // ✅ ÚJ: REFACTORED - Közös cache cleanup logika DRY elv szerint
  const performCacheCleanup = useCallback(
    (
      options: {
        withMetrics?: boolean;
        withPerformanceTracking?: boolean;
      } = {},
    ) => {
      const startTime = options.withPerformanceTracking ? performance.now() : 0;
      const initialSize = options.withMetrics ? memoryCache.current.size : 0;

      // Cache invalidálás kor alapján
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

      // ✅ Opcionális metrikák és performance tracking
      if (options.withMetrics) {
        const cleanedCount = initialSize - memoryCache.current.size;
        const duration = options.withPerformanceTracking ? performance.now() - startTime : 0;

        if (cleanedCount > 0) {
          debugLog(`Cache cleanup: ${cleanedCount} elem törölve ${duration.toFixed(2)}ms alatt`);
        }

        // Update cleanup timestamp
        setMemCacheStats((prev) => ({
          ...prev,
          size: memoryCache.current.size,
          lastCleanup: Date.now(),
        }));

        // Memory usage check after cleanup
        trackMemoryUsage();
      }
    },
    [trackMemoryUsage],
  );

  // Cache invalidálás kor alapján - REFACTORED
  const cleanupStaleCache = useCallback(() => {
    // ✅ DUPLIKÁCIÓ JAVÍTVA: Közös performCacheCleanup használata
    performCacheCleanup();
  }, [performCacheCleanup]);

  // Cache invalidálása egy adott tabra (pl. manuális frissítésnél)
  const invalidateCache = useCallback((tabId: string) => {
    console.log(`[useTabStorage] Cache invalidálása: ${tabId}`);
    memoryCache.current.delete(tabId);
  }, []);

  // Manuális frissítés - cache invalidálással és újratöltéssel
  const refreshTabContent = useCallback(
    async (tabId: string): Promise<TabContentData | null> => {
      // Cache törlése az adott tabra
      invalidateCache(tabId);

      // Itt közvetlenül az IndexedDB-ből töltjük be az adatokat a getTabContent függvénnyel
      // Ez biztosítja, hogy friss adatokat kapjunk a memória cache helyett
      const content = await getTabContent(tabId);

      // Ha van friss tartalom, frissítjük a memória cache-t is
      if (content) {
        memoryCache.current.set(tabId, {
          content,
          timestamp: Date.now(),
        });
      }

      return content;
    },
    [invalidateCache, getTabContent],
  );

  // OPTIMALIZÁLT Tab tartalom betöltése (először memóriából, aztán DB-ből)
  const loadTabContent = useCallback(
    async (tabId: string, options?: { forceRefresh?: boolean }): Promise<TabContentData | null> => {
      // CACHE BYPASS: Ha a forceRefresh opció aktív, a függvény azonnal null-t ad vissza.
      // Ezzel a teljes cache (memória és IndexedDB) ellenőrzése kihagyásra kerül,
      // és a hívó fél (pl. Content.tsx) kényszerítve lesz egy új API hívásra.
      if (options?.forceRefresh) {
        console.log(`[useTabStorage] forceRefresh aktív, cache teljesen kihagyva: ${tabId}`);
        return null; // <-- cache bypass
      }

      console.log(`🚀 [useTabStorage] LOADTABCONTENT MEGHÍVVA! tabId: ${tabId}`);
      console.log(`[useTabStorage] Tab tartalom betöltése: ${tabId}`);

      // 1. Ellenőrizzük a memória cache-t (FAST PATH)
      const cachedEntry = memoryCache.current.get(tabId);

      if (cachedEntry) {
        console.log(`[useTabStorage] Tab tartalom betöltve memória cache-ből (GYORS): ${tabId}`);

        // Frissítjük az időbélyeget (LRU stratégia miatt)
        memoryCache.current.set(tabId, {
          ...cachedEntry,
          timestamp: Date.now(),
        });

        // Cache találat statisztika növelése
        setMemCacheStats((prev) => ({ ...prev, hits: prev.hits + 1 }));

        // Háttér frissítés beállítása, ha a cache már túl régi, de még nem járt le
        const now = Date.now();
        if (
          now - cachedEntry.timestamp > CACHE_CONFIG.REFRESH_INTERVAL &&
          now - cachedEntry.timestamp < CACHE_CONFIG.MAX_AGE
        ) {
          console.log(`[useTabStorage] Háttérben frissítjük a régi cache-t: ${tabId}`);
          // Nem várjuk meg, azonnal visszatérünk a cache-el
          setTimeout(() => {
            refreshTabContent(tabId).catch((err) => {
              console.error(`[useTabStorage] Hiba a háttér frissítéskor: ${tabId}`, err);
            });
          }, 0);
        }

        return cachedEntry.content;
      }

      // Cache miss statisztika növelése
      setMemCacheStats((prev) => ({ ...prev, misses: prev.misses + 1 }));

      // 2. Ha nincs a cache-ben, elérjük az IndexedDB-t (SLOW PATH)
      console.log(`[useTabStorage] Tab tartalom betöltése IndexedDB-ből (LASSÚ): ${tabId}`);
      const content = await getTabContent(tabId);

      // 3. Ha van tartalom, eltároljuk a memória cache-ben
      if (content) {
        console.log(`[useTabStorage] Tab tartalom mentése memória cache-be: ${tabId}`);
        memoryCache.current.set(tabId, {
          content,
          timestamp: Date.now(),
        });

        // Takarítás, ha szükséges
        cleanupStaleCache();
      }

      return content;
    },
    [getTabContent, cleanupStaleCache, refreshTabContent],
  );

  // Aktív tab beállítása
  const setActiveTab = useCallback(
    async (tabId: string) => {
      if (tabId !== activeTabId) {
        setActiveTabId(tabId);
        await updateTabState(tabId, { isActive: true });

        if (state?.tabs?.definitions) {
          await updateTabState('tabs', {
            activeId: tabId,
            definitions: state.tabs.definitions,
          });
        }

        // OPTIMALIZÁCIÓ: Előre betöltjük a tartalmat, ha még nincs a memória cache-ben
        if (!memoryCache.current.has(tabId)) {
          debugLog(`Előre töltjük a tab tartalmát: ${tabId}`);
          loadTabContent(tabId) // <-- itt nem kell forceRefresh
            .then((content) => {
              debugLog(`Tab tartalom előre betöltve: ${tabId}, találat: ${!!content}`);
            })
            .catch((err) => {
              console.error(`Hiba a tab tartalom előtöltésekor: ${tabId}`, err);
            });
        }
      }
    },
    [activeTabId, updateTabState, state?.tabs?.definitions, loadTabContent],
  );

  // Új tab létrehozása
  const createTab = useCallback(
    async (tabData: Omit<TabDefinition, 'id'>) => {
      const newId = `tab-${Date.now()}`;
      const newTab = {
        id: newId,
        ...tabData,
      };

      await updateTabState(newId, newTab);
      setActiveTab(newId);

      return newId;
    },
    [updateTabState, setActiveTab],
  );

  // Tab bezárása
  const closeTab = useCallback(
    async (tabId: string) => {
      if (!state?.tabs?.definitions) return;

      const newTabs = state.tabs.definitions.filter((tab) => tab.id !== tabId);

      // Ha az aktív tabot zárjuk be, aktiváljuk az elsőt
      let newActiveId = state.tabs.activeId;
      if (newActiveId === tabId && newTabs.length > 0) {
        newActiveId = newTabs[0].id;
      }

      await updateTabState('tabs', {
        activeId: newActiveId,
        definitions: newTabs,
      });

      if (newActiveId !== activeTabId) {
        setActiveTabId(newActiveId);
      }

      // ❌ RÉGI KÓD (cache törlés - kikommentálva)
      // Cache tisztítása a bezárt tabra
      // if (memoryCache.current.has(tabId)) {
      //   console.log(`[useTabStorage] Tab cache törlése bezáráskor: ${tabId}`);
      //   memoryCache.current.delete(tabId);
      // }

      // ✅ ÚJ KÓD (cache megtartás - gyors betöltés)
      // Cache megtartása a bezárt tabra - gyors újrabetöltéshez
      console.log(`[useTabStorage] Cache megtartva bezáráskor: ${tabId} - gyors újrabetöltéshez`);

      // Törölni az esetleges mentés időzítőt
      if (saveTimeouts.current.has(tabId)) {
        window.clearTimeout(saveTimeouts.current.get(tabId));
        saveTimeouts.current.delete(tabId);
      }

      // ❌ RÉGI KÓD (pagination törlés - kikommentálva)
      // ✅ ÚJ: Pagination állapot törlése bezárt tabra
      // PaginationStorage.clear(tabId);
      // console.log(`[useTabStorage] Pagination állapot törölve bezárt tabra: ${tabId}`);
      
      // ✅ ÚJ KÓD (pagination megtartás - állapot megőrzés)
      console.log(`[useTabStorage] Pagination állapot megtartva bezárt tabra: ${tabId} - állapot megőrzés`);
    },
    [state?.tabs, updateTabState, activeTabId],
  );

  // Késleltetett DB mentést kezelő függvény - megakadályozza a túl gyakori írásokat
  const scheduleThrottledDbSave = useCallback(
    (tabId: string, content: TabContentData) => {
      // Töröljük a korábbi időzítőt, ha létezik
      if (saveTimeouts.current.has(tabId)) {
        window.clearTimeout(saveTimeouts.current.get(tabId));
        saveTimeouts.current.delete(tabId);
      }

      // Új időzítő beállítása a mentéshez
      const timeoutId = window.setTimeout(async () => {
        console.log(`[useTabStorage] Késleltetett IndexedDB mentés: ${tabId}`);
        await saveTabContent(tabId, content);
        saveTimeouts.current.delete(tabId);
      }, SAVE_DELAY);

      saveTimeouts.current.set(tabId, timeoutId);
    },
    [saveTabContent],
  );

  // Tab tartalom mentése (memória cache + késleltetett DB írás)
  const saveCurrentTabContent = useCallback(
    async (content: TabContentData, tabId?: string) => {
      // Ha kapunk explicit tabId-t, használjuk azt, különben az activeTabId-t
      const targetTabId = tabId || activeTabId;
      console.log(`[useTabStorage] Tab tartalom mentése: ${targetTabId}`, content);

      if (targetTabId && targetTabId !== 'default') {
        try {
          // 1. Azonnali mentés a memória cache-be
          console.log(`[useTabStorage] Mentés a memóriába: ${targetTabId}`, content); // Debug logging
          memoryCache.current.set(targetTabId, {
            content,
            timestamp: Date.now(),
          });
          console.log(`[useTabStorage] Tab tartalom mentve memória cache-be: ${targetTabId}`);

          // 2. Késleltetett mentés az IndexedDB-be
          scheduleThrottledDbSave(targetTabId, content);

          // Takarítás, ha szükséges
          cleanupStaleCache();

          return true;
        } catch (error) {
          console.error(`[useTabStorage] Hiba a tab tartalom mentésekor: ${targetTabId}`, error);
          return false;
        }
      } else {
        console.warn(
          `[useTabStorage] Nem lehet menteni a tab tartalmát érvénytelen azonosítóval: ${targetTabId}`,
        );
        return false;
      }
    },
    [activeTabId, scheduleThrottledDbSave, cleanupStaleCache],
  );

  // ✅ KIKOMMENTÁLVA: Tab görgetési pozíció mentése - duplikáció elkerülése
  // A scroll pozíció mentést a ScrollStorage.ts kezeli, nem itt!
  // const saveTabScrollPosition = useCallback(
  //   (position: number) => {
  //     // ✅ DIAGNÓZTIKA: Részletes logging a saveTabScrollPosition hívásakor
  //     console.log(`[useTabStorage] saveTabScrollPosition hívva: ${position}px, activeTabId: ${activeTabId}`);
      
  //     if (activeTabId) {
  //       // Ellenőrizzük, hogy van-e a tab a memória cache-ben
  //       const cachedEntry = memoryCache.current.get(activeTabId);

  //       if (cachedEntry) {
  //         // Ha igen, akkor frissítjük a scrollPosition-t a memória cache-ben
  //         const updatedContent = {
  //           ...cachedEntry.content,
  //           meta: {
  //             ...(cachedEntry.content.meta || {}), // Megtartjuk a meglévő meta adatokat
  //             scrollPosition: position,
  //           },
  //         };

  //         memoryCache.current.set(activeTabId, {
  //           content: updatedContent,
  //           timestamp: Date.now(),
  //         });

  //         // ✅ JAVÍTÁS: saveCurrentTabContent használata a saveTabContent helyett
  //         console.log(`[useTabStorage] Scroll mentve: ${position}px (Tab: ${activeTabId})`); // DEBUG
  //         saveCurrentTabContent(updatedContent, activeTabId);
  //       } else {
  //         // ✅ JAVÍTÁS: Ha nincs cache-ben, akkor is mentjük a scroll pozíciót!
  //         // Létrehozunk egy minimális TabContentData objektumot a scroll pozícióval
  //         const minimalContent: TabContentData = {
  //           id: activeTabId,
  //           articles: [], // Üres hírek listája
  //           timestamp: Date.now(),
  //           meta: {
  //             scrollPosition: position,
  //             lastFetched: Date.now(),
  //             originalNews: [], // Üres hírek listája
  //           },
  //         };

  //         // Cache-be mentés
  //         memoryCache.current.set(activeTabId, {
  //           content: minimalContent,
  //           timestamp: Date.now(),
  //         });

  //         // DB-be mentés
  //         console.log(`[useTabStorage] Scroll pozíció mentve új tabhoz: ${position}px (Tab: ${activeTabId})`);
  //         saveCurrentTabContent(minimalContent, activeTabId);
  //       }
  //     } else {
  //       console.warn(`[useTabStorage] saveTabScrollPosition: nincs activeTabId`);
  //     }
  //   },
  //   [activeTabId, saveCurrentTabContent], // ✅ JAVÍTÁS: saveCurrentTabContent függőség hozzáadva
  // );

  // Tab mód frissítése
  const updateTabMode = useCallback(
    (tabId: string, mode: 'feed' | 'article' | 'search' | 'saved') => {
      if (!state?.tabs?.definitions) return;

      const updatedTabs = state.tabs.definitions.map((tab) =>
        tab.id === tabId ? { ...tab, mode } : tab,
      );

      updateTabState('tabs', {
        activeId: state.tabs.activeId,
        definitions: updatedTabs,
      });
    },
    [state?.tabs, updateTabState],
  );

  // Tabok átrendezése
  const reorderTabs = useCallback(
    (newTabs: TabDefinition[]) => {
      if (!state?.tabs) return;

      updateTabState('tabs', {
        activeId: state.tabs.activeId,
        definitions: newTabs,
      });
    },
    [state?.tabs, updateTabState],
  );

  // Előre betöltés - más tabok tartalmát is betöltjük a háttérben
  useEffect(() => {
    const preloadOtherTabs = async () => {
      // Csak akkor előtöltünk, ha az aktív tab már betöltődött
      if (tabs.length <= 1 || !activeTabId || activeTabId === 'default') return;

      // Maximum 2-3 további tab előtöltése
      const maxPreload = 2;

      // Az aktív tab után következő tabok előtöltése
      const activeIndex = tabs.findIndex((tab) => tab.id === activeTabId);
      if (activeIndex >= 0) {
        // Előre töltsük a következő tabokat
        for (let i = 1; i <= maxPreload; i++) {
          const nextIndex = (activeIndex + i) % tabs.length;
          const nextTab = tabs[nextIndex];

          if (nextTab && !memoryCache.current.has(nextTab.id)) {
            // Háttérben töltjük, nem blokkoljuk a főszálat
            setTimeout(() => {
              console.log(`[useTabStorage] Előtöltés a háttérben: ${nextTab.id}`);
              loadTabContent(nextTab.id).catch(console.error); // <-- itt sem kell forceRefresh
            }, i * 500); // Lépcsőzetesen töltjük
          }
        }
      }
    };

    // Ha változik az aktív tab, próbáljuk előtölteni a következő tabokat
    preloadOtherTabs().catch(console.error);
  }, [activeTabId, tabs, loadTabContent]);

  // ✅ ÚJ: Cache diagnostic metódus
  const getCacheDiagnostics = useCallback(() => {
    const total = memCacheStats.hits + memCacheStats.misses;
    const hitRate = total > 0 ? (memCacheStats.hits / total) * 100 : 0;
    const avgAccessTime =
      performanceMetrics.current.accessTimes.length > 0
        ? performanceMetrics.current.accessTimes.reduce((a, b) => a + b, 0) /
          performanceMetrics.current.accessTimes.length
        : 0;

    return {
      cacheSize: memoryCache.current.size,
      maxSize: CACHE_CONFIG.MAX_TABS,
      hits: memCacheStats.hits,
      misses: memCacheStats.misses,
      hitRate: hitRate.toFixed(1) + '%',
      avgAccessTime: avgAccessTime.toFixed(2) + 'ms',
      lastCleanup: new Date(memCacheStats.lastCleanup).toLocaleTimeString(),
      healthStatus:
        hitRate > 70 ? 'KIVÁLÓ' : hitRate > 50 ? 'JÓ' : hitRate > 30 ? 'KÖZEPES' : 'GYENGE',
    };
  }, [memCacheStats]);

  // ✅ ÚJ: Pagination állapot mentése
  const savePaginationState = useCallback(
    (currentPage: number, itemsPerPage: number, tabId?: string) => {
      const targetTabId = tabId || activeTabId;

      if (targetTabId && targetTabId !== 'default') {
        console.log(
          `[useTabStorage] Pagination állapot mentése: ${targetTabId} -> page ${currentPage}, ${itemsPerPage} items/page`,
        );
        PaginationStorage.save(targetTabId, currentPage, itemsPerPage);
      } else {
        console.warn(
          `[useTabStorage] Nem lehet menteni a pagination állapotot érvénytelen tab ID-val: ${targetTabId}`,
        );
      }
    },
    [activeTabId],
  );

  // ✅ ÚJ: Pagination állapot betöltése
  const loadPaginationState = useCallback(
    (tabId?: string): { currentPage: number; itemsPerPage: number } | null => {
      const targetTabId = tabId || activeTabId;

      if (targetTabId && targetTabId !== 'default') {
        const paginationState = PaginationStorage.load(targetTabId);
        if (paginationState) {
          console.log(
            `[useTabStorage] Pagination állapot betöltve: ${targetTabId} -> page ${paginationState.currentPage}, ${paginationState.itemsPerPage} items/page`,
          );
        }
        return paginationState;
      }

      return null;
    },
    [activeTabId],
  );

  // ✅ ÚJ: Pagination állapot törlése
  const clearPaginationState = useCallback(
    (tabId?: string) => {
      const targetTabId = tabId || activeTabId;

      if (targetTabId && targetTabId !== 'default') {
        console.log(`[useTabStorage] Pagination állapot törlése: ${targetTabId}`);
        PaginationStorage.clear(targetTabId);
      }
    },
    [activeTabId],
  );

  return {
    activeTabId,
    tabs,
    setActiveTab,
    createTab,
    closeTab,
    saveTabContent: saveCurrentTabContent,
    loadTabContent,
    // ✅ KIKOMMENTÁLVA: saveScrollPosition export - duplikáció elkerülése
    // saveScrollPosition: saveTabScrollPosition, // ✅ Ezt adja át a Content.tsx
    updateTabMode,
    reorderTabs,
    refreshTabContent,
    invalidateCache,
    getCacheDiagnostics,
    getCacheStats: () => memCacheStats,
    getPerformanceMetrics: () => ({
      avgAccessTime:
        performanceMetrics.current.accessTimes.length > 0
          ? performanceMetrics.current.accessTimes.reduce((a, b) => a + b, 0) /
            performanceMetrics.current.accessTimes.length
          : 0,
      accessCount: performanceMetrics.current.accessTimes.length,
      lastMeasurement: performanceMetrics.current.lastMeasurement,
    }),
    // ✅ ÚJ: Pagination funkciók hozzáadása
    savePaginationState,
    loadPaginationState,
    clearPaginationState,
  };
}

// ✅ MÓDOSÍTOTT: Tab cache törlése ország váltáskor + pagination
export const clearAllTabCache = (): void => {
  console.log('[useTabStorage] Összes tab cache törlése ország váltás miatt...');

  // Memory cache törlése - a memoryCache referencia elérésére szükség van
  // Mivel a memoryCache a useTabStorage hook-on belül van, exportálni kell egy globális referenciát
  if (typeof window !== 'undefined') {
    const windowWithCache = window as Window & { __tabMemoryCache?: Map<string, unknown> };
    if (windowWithCache.__tabMemoryCache) {
      windowWithCache.__tabMemoryCache.clear();
      console.log('[useTabStorage] Memory cache törölve');
    }
  }

  // ✅ ÚJ: Összes pagination állapot törlése is
  PaginationStorage.clearAll();
  console.log('[useTabStorage] Összes pagination állapot törölve');

  console.log('[useTabStorage] Tab cache törlés kész');
};
*/