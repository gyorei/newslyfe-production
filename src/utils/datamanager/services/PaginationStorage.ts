/**
 * PaginationStorage service - Centralized pagination state management
 * 📦 SZABÁLYZAT: Pure data service - DOM-mentes, Node.js kompatibilis
 * 🎯 FELELŐSSÉG:
 *    Pagination állapot tárolása localStorage-ban
 *    TTL alapú cache kezelés (24 óra)
 *    JSON serialization/deserialization
 *    Error handling és logging
 */

export interface PaginationState {
  tabId: string;
  currentPage: number;
  itemsPerPage: number;
  timestamp: number;
}

/**
 * Centralized pagination state storage service
 * - localStorage alapú gyors tárolás
 * - Tab-specifikus pagination állapot
 * - Timestamp alapú cache invalidáció
 */
export class PaginationStorage {
  private static readonly PREFIX = 'pagination_';
  private static readonly MAX_AGE = 24 * 60 * 60 * 1000; // 24 óra

  /**
   * Pagination állapot mentése
   */
  static save(tabId: string, currentPage: number, itemsPerPage: number): void {
    if (!tabId || currentPage < 1 || itemsPerPage < 1) {
      console.warn('[PaginationStorage] Invalid parameters:', { tabId, currentPage, itemsPerPage });
      return;
    }

    const paginationData: PaginationState = {
      tabId,
      currentPage,
      itemsPerPage,
      timestamp: Date.now(),
    };

    try {
      localStorage.setItem(`${PaginationStorage.PREFIX}${tabId}`, JSON.stringify(paginationData));
      console.log(
        `[PaginationStorage] Saved: ${tabId} -> page ${currentPage}, ${itemsPerPage} items/page`,
      );
    } catch (error) {
      console.error('[PaginationStorage] Save failed:', error);
    }
  }

  /**
   * Pagination állapot betöltése
   */
  static load(tabId: string): { currentPage: number; itemsPerPage: number } | null {
    if (!tabId) {
      return null;
    }

    try {
      const stored = localStorage.getItem(`${PaginationStorage.PREFIX}${tabId}`);
      if (!stored) {
        return null;
      }

      const paginationData: PaginationState = JSON.parse(stored);

      // Ellenőrizzük, hogy nem túl régi-e
      if (Date.now() - paginationData.timestamp > PaginationStorage.MAX_AGE) {
        PaginationStorage.clear(tabId);
        return null;
      }

      console.log(
        `[PaginationStorage] Loaded: ${tabId} -> page ${paginationData.currentPage}, ${paginationData.itemsPerPage} items/page`,
      );
      return {
        currentPage: paginationData.currentPage,
        itemsPerPage: paginationData.itemsPerPage,
      };
    } catch (error) {
      console.error('[PaginationStorage] Load failed:', error);
      PaginationStorage.clear(tabId);
      return null;
    }
  }

  /**
   * Pagination állapot törlése
   */
  static clear(tabId: string): void {
    if (!tabId) return;

    try {
      localStorage.removeItem(`${PaginationStorage.PREFIX}${tabId}`);
      console.log(`[PaginationStorage] Cleared: ${tabId}`);
    } catch (error) {
      console.error('[PaginationStorage] Clear failed:', error);
    }
  }

  /**
   * Összes pagination állapot törlése
   */
  static clearAll(): void {
    try {
      const keys = Object.keys(localStorage).filter((key) =>
        key.startsWith(PaginationStorage.PREFIX),
      );

      keys.forEach((key) => localStorage.removeItem(key));
      console.log(`[PaginationStorage] Cleared all pagination states (${keys.length} items)`);
    } catch (error) {
      console.error('[PaginationStorage] Clear all failed:', error);
    }
  }

  /**
   * Lejárt pagination állapotok törlése
   */
  static cleanup(): void {
    try {
      const keys = Object.keys(localStorage).filter((key) =>
        key.startsWith(PaginationStorage.PREFIX),
      );

      let cleanedCount = 0;
      keys.forEach((key) => {
        try {
          const stored = localStorage.getItem(key);
          if (stored) {
            const paginationData: PaginationState = JSON.parse(stored);
            if (Date.now() - paginationData.timestamp > PaginationStorage.MAX_AGE) {
              localStorage.removeItem(key);
              cleanedCount++;
            }
          }
        } catch {
          localStorage.removeItem(key);
          cleanedCount++;
        }
      });

      if (cleanedCount > 0) {
        console.log(`[PaginationStorage] Cleanup: ${cleanedCount} expired entries removed`);
      }
    } catch (error) {
      console.error('[PaginationStorage] Cleanup failed:', error);
    }
  }

  /**
   * Pagination állapotok listázása (debug célra)
   */
  static list(): PaginationState[] {
    try {
      const keys = Object.keys(localStorage).filter((key) =>
        key.startsWith(PaginationStorage.PREFIX),
      );

      return keys
        .map((key) => {
          try {
            const stored = localStorage.getItem(key);
            return stored ? JSON.parse(stored) : null;
          } catch {
            return null;
          }
        })
        .filter(Boolean);
    } catch (error) {
      console.error('[PaginationStorage] List failed:', error);
      return [];
    }
  }
}
