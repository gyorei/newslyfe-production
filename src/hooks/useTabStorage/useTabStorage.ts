/*
 * useTabStorage.ts - REFAKTORÁLT VERZIÓ
 *
 * TAB TARTALOM ÉS ÁLLAPOT KEZELŐ KOMPOZIT HOOK (News app)
 * -------------------------------------------------------
 * Ez a hook most már kompozit pattern szerint működik, összefogva a specializált hook-okat:
 *  - useTabManager: Tab CRUD műveletek
 *  - useTabCache: Cache kezelés
 *  - useTabPerformance: Performance monitoring
 *  - useTabPagination: Pagination állapot kezelés
 *
 * Előnyök:
 *  - Single Responsibility Principle betartása
 *  - Könnyebb tesztelhetőség
 *  - Jobb karbantarthatóság
 *  - Moduláris felépítés
 *
 * A hook továbbra is ugyanazt az API-t biztosítja, mint korábban.
 */
import { useEffect, useCallback } from 'react';
// Fix: A relatív importálás explicit ts kiterjesztéssel (ha a normál import nem működik)
import { useTabManager } from './useTabManager.js'; 
import { useTabCache } from './useTabCache';
import { useTabPerformance } from './useTabPerformance';
import { useTabPagination } from './useTabPagination';
import { TabContentData } from '../../utils/datamanager/storage/indexedDBTypes';
import { PaginationStorage } from '../../utils/datamanager/services/PaginationStorage';

export function useTabStorage() {
  // Specializált hook-ok használata
  const tabManager = useTabManager();
  const tabCache = useTabCache();
  const tabPerformance = useTabPerformance();
  const tabPagination = useTabPagination(tabManager.activeTabId);

  // Integrált funkciók - összekapcsoljuk a cache-t és performance-t
  const loadTabContentWithMetrics = useCallback(
    async (tabId: string, options?: { forceRefresh?: boolean }): Promise<TabContentData | null> => {
      // Performance mérés wrapper
      return tabPerformance.measurePerformance(
        async () => {
          const result = await tabCache.loadTabContent(tabId, options);
          
          // Statisztikák frissítése
          if (result) {
            tabPerformance.recordCacheHit();
          } else {
            tabPerformance.recordCacheMiss();
          }
          
          return result;
        },
        `loadTabContent-${tabId}`,
      );
    },
    [tabCache, tabPerformance],
  );

  // Aktív tab beállítása előre töltéssel
  const setActiveTabWithPreload = useCallback(
    async (tabId: string) => {
      await tabManager.setActiveTab(tabId);
      
      // Előre betöltjük a tartalmat, ha még nincs a cache-ben
      const cacheInfo = tabCache.getCacheInfo();
      if (!cacheInfo.entries.includes(tabId)) {
        console.log(`[useTabStorage] Előre töltjük a tab tartalmát: ${tabId}`);
        loadTabContentWithMetrics(tabId)
          .then((content) => {
            console.log(`[useTabStorage] Tab tartalom előre betöltve: ${tabId}, találat: ${!!content}`);
          })
          .catch((err) => {
            console.error(`[useTabStorage] Hiba a tab tartalom előtöltésekor: ${tabId}`, err);
          });
      }
    },
    [tabManager, tabCache, loadTabContentWithMetrics],
  );

  // Tab bezárása cache és pagination cleanup-pal
  const closeTabWithCleanup = useCallback(
    async (tabId: string) => {
      // Tab bezárása
      await tabManager.closeTab(tabId);

      // Cache és pagination törlése a bezárt fülhöz
      tabCache.invalidateCache(tabId);
      tabPagination.clearPaginationState(tabId);
      console.log(`[useTabStorage] Cache és pagination törölve bezárt tabra: ${tabId}`);
    },
    [tabManager, tabCache, tabPagination],
  );

  // Előre betöltés - más tabok tartalmát is betöltjük a háttérben
  useEffect(() => {
    const preloadOtherTabs = async () => {
      const { tabs, activeTabId } = tabManager;
      
      // Csak akkor előtöltünk, ha az aktív tab már betöltődött
      if (tabs.length <= 1 || !activeTabId || activeTabId === 'default') return;

      // Maximum 2-3 további tab előtöltése
      const maxPreload = 2;
      const cacheInfo = tabCache.getCacheInfo();

      // Az aktív tab után következő tabok előtöltése
      const activeIndex = tabs.findIndex((tab: { id: string }) => tab.id === activeTabId);
      if (activeIndex >= 0) {
        // Előre töltsük a következő tabokat
        for (let i = 1; i <= maxPreload; i++) {
          const nextIndex = (activeIndex + i) % tabs.length;
          const nextTab = tabs[nextIndex];

          if (nextTab && !cacheInfo.entries.includes(nextTab.id)) {
            // Háttérben töltjük, nem blokkoljuk a főszálat
            setTimeout(() => {
              console.log(`[useTabStorage] Előtöltés a háttérben: ${nextTab.id}`);
              loadTabContentWithMetrics(nextTab.id).catch(console.error);
            }, i * 500); // Lépcsőzetesen töltjük
          }
        }
      }
    };

    // Ha változik az aktív tab, próbáljuk előtölteni a következő tabokat
    preloadOtherTabs().catch(console.error);
  }, [tabManager, tabCache, loadTabContentWithMetrics]);

  // Periodikus cache cleanup
  useEffect(() => {
    const cleanupInterval = setInterval(() => {
      tabCache.performCacheCleanup();
      tabPerformance.trackMemoryUsage();
    }, 15 * 60 * 1000); // 15 perc

    return () => clearInterval(cleanupInterval);
  }, [tabCache, tabPerformance]);

  return {
    // Tab Manager funkciók
    activeTabId: tabManager.activeTabId,
    tabs: tabManager.tabs,
    setActiveTab: setActiveTabWithPreload, // Enhanced verzió
    createTab: tabManager.createTab,
    closeTab: closeTabWithCleanup, // Enhanced verzió
    updateTabMode: tabManager.updateTabMode,
    reorderTabs: tabManager.reorderTabs,

    // Cache funkciók
    loadTabContent: loadTabContentWithMetrics, // Enhanced verzió metrics-kel
    saveTabContent: tabCache.saveTabContent,
    refreshTabContent: tabCache.refreshTabContent,
    invalidateCache: tabCache.invalidateCache,

    // Performance funkciók
    getCacheDiagnostics: tabPerformance.getCacheDiagnostics,
    getCacheStats: () => tabPerformance.memCacheStats,
    getPerformanceMetrics: tabPerformance.getPerformanceMetrics,

    // Pagination funkciók
    savePaginationState: tabPagination.savePaginationState,
    loadPaginationState: tabPagination.loadPaginationState,
    clearPaginationState: tabPagination.clearPaginationState,
  };
}

// Tab cache törlése ország váltáskor + pagination
export const clearAllTabCache = (): void => {
  console.log('[useTabStorage] Összes tab cache törlése ország váltás miatt...');

  // Memory cache törlése - globális referencia használata
  if (typeof window !== 'undefined') {
    const windowWithCache = window as Window & { __tabMemoryCache?: Map<string, unknown> };
    if (windowWithCache.__tabMemoryCache) {
      windowWithCache.__tabMemoryCache.clear();
      console.log('[useTabStorage] Memory cache törölve');
    }
  }

  // Összes pagination állapot törlése
  PaginationStorage.clearAll();
  console.log('[useTabStorage] Összes pagination állapot törölve');

  console.log('[useTabStorage] Tab cache törlés kész');
};