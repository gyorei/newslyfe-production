/*
 * useTabPagination.ts
 *
 * TAB PAGINATION ÁLLAPOT KEZELŐ HOOK (News app)
 * ---------------------------------------------
 * Ez a hook felelős a tab-ok pagination állapotának kezeléséért:
 *  - Pagination állapot mentése/betöltése minden tabhoz külön
 *  - PaginationStorage service használata
 *  - Tab-specifikus pagination kezelés
 *
 * Szétválasztva a useTabStorage.ts-ből a Single Responsibility Principle alapján.
 */
import { useCallback } from 'react';
import { PaginationStorage } from '../../utils/datamanager/services/PaginationStorage';

export function useTabPagination(activeTabId: string) {
  // Pagination állapot mentése
  const savePaginationState = useCallback(
    (currentPage: number, itemsPerPage: number, tabId?: string) => {
      const targetTabId = tabId || activeTabId;

      if (targetTabId && targetTabId !== 'default') {
        console.log(
          `[useTabPagination] Pagination állapot mentése: ${targetTabId} -> page ${currentPage}, ${itemsPerPage} items/page`,
        );
        PaginationStorage.save(targetTabId, currentPage, itemsPerPage);
      } else {
        console.warn(
          `[useTabPagination] Nem lehet menteni a pagination állapotot érvénytelen tab ID-val: ${targetTabId}`,
        );
      }
    },
    [activeTabId],
  );

  // Pagination állapot betöltése
  const loadPaginationState = useCallback(
    (tabId?: string): { currentPage: number; itemsPerPage: number } | null => {
      const targetTabId = tabId || activeTabId;

      if (targetTabId && targetTabId !== 'default') {
        const paginationState = PaginationStorage.load(targetTabId);
        if (paginationState) {
          console.log(
            `[useTabPagination] Pagination állapot betöltve: ${targetTabId} -> page ${paginationState.currentPage}, ${paginationState.itemsPerPage} items/page`,
          );
        }
        return paginationState;
      }

      return null;
    },
    [activeTabId],
  );

  // Pagination állapot törlése
  const clearPaginationState = useCallback(
    (tabId?: string) => {
      const targetTabId = tabId || activeTabId;

      if (targetTabId && targetTabId !== 'default') {
        console.log(`[useTabPagination] Pagination állapot törlése: ${targetTabId}`);
        PaginationStorage.clear(targetTabId);
      }
    },
    [activeTabId],
  );

  // Összes pagination állapot törlése
  const clearAllPaginationStates = useCallback(() => {
    console.log(`[useTabPagination] Összes pagination állapot törlése`);
    PaginationStorage.clearAll();
  }, []);

  return {
    savePaginationState,
    loadPaginationState,
    clearPaginationState,
    clearAllPaginationStates,
  };
}