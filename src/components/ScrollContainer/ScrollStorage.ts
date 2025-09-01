/**
 * src\utils\datamanager\services\ScrollStorage.ts
 * ScrollStorage service - Centralized scroll position management
 * 📦 SZABÁLYZAT: Pure data service - DOM-mentes, Node.js kompatibilis
 🎯 FELELŐSSÉG:
    Scroll pozíciók tárolása localStorage-ban
    TTL alapú cache kezelés (24 óra)
    JSON serialization/deserialization
    Error handling és logging
*/

export interface ScrollPosition {
  tabId: string;
  position: number;
  timestamp: number;
}

/**
 * Centralized scroll position storage service
 * - localStorage alapú gyors tárolás
 * - Tab-specifikus scroll pozíciók
 * - Timestamp alapú cache invalidáció
 */
export class ScrollStorage {
  private static readonly PREFIX = 'scroll_';
  private static readonly MAX_AGE = 24 * 60 * 60 * 1000; // 24 óra

  /**
   * Scroll pozíció mentése
   */
  static save(tabId: string, position: number): void {
    if (!tabId || position < 0) {
      console.warn('[ScrollStorage] Invalid parameters:', { tabId, position });
      return;
    }

    const scrollData: ScrollPosition = {
      tabId,
      position: Math.round(position),
      timestamp: Date.now(),
    };

    try {
      localStorage.setItem(`${ScrollStorage.PREFIX}${tabId}`, JSON.stringify(scrollData));
      console.log(`[ScrollStorage] 💾 Saved: ${tabId} -> ${position}px @ ${scrollData.timestamp}`);
    } catch (error) {
      console.error('[ScrollStorage] Save failed:', error);
    }
  }

  /**
   * Scroll pozíció betöltése
   */
  static load(tabId: string): number {
    if (!tabId) {
      console.log(`[ScrollStorage] ❌ load: nincs tabId, visszaadás: 0`);
      return 0;
    }

    try {
      const stored = localStorage.getItem(`${ScrollStorage.PREFIX}${tabId}`);
      if (!stored) {
        console.log(`[ScrollStorage] ❌ load: nincs mentett adat, visszaadás: 0`);
        return 0;
      }

      const scrollData: ScrollPosition = JSON.parse(stored);
      const expired = Date.now() - scrollData.timestamp > ScrollStorage.MAX_AGE;
      if (expired) {
        console.log(`[ScrollStorage] ⏰ load: lejárt adat, törlés és visszaadás: 0 (${tabId}, timestamp=${scrollData.timestamp})`);
        ScrollStorage.clear(tabId);
        return 0;
      }
      console.log(`[ScrollStorage] 📖 Loaded: ${tabId} -> ${scrollData.position}px @ ${scrollData.timestamp}`);
      return scrollData.position;
    } catch (error) {
      console.error('[ScrollStorage] Load failed:', error);
      ScrollStorage.clear(tabId);
      return 0;
    }
  }

  /**
   * Scroll pozíció törlése
   */
  static clear(tabId: string): void {
    if (!tabId) return;

    try {
      localStorage.removeItem(`${ScrollStorage.PREFIX}${tabId}`);
      console.log(`[ScrollStorage] 🗑️ Cleared: ${tabId}`);
    } catch (error) {
      console.error('[ScrollStorage] Clear failed:', error);
    }
  }

  /**
   * Összes scroll pozíció törlése
   */
  static clearAll(): void {
    try {
      const keys = Object.keys(localStorage).filter((key) => key.startsWith(ScrollStorage.PREFIX));

      keys.forEach((key) => localStorage.removeItem(key));
      console.log(`[ScrollStorage] Cleared all scroll positions (${keys.length} items)`);
    } catch (error) {
      console.error('[ScrollStorage] Clear all failed:', error);
    }
  }

  /**
   * Lejárt scroll pozíciók törlése
   */
  static cleanup(): void {
    try {
      const keys = Object.keys(localStorage).filter((key) => key.startsWith(ScrollStorage.PREFIX));

      let cleanedCount = 0;
      keys.forEach((key) => {
        try {
          const stored = localStorage.getItem(key);
          if (stored) {
            const scrollData: ScrollPosition = JSON.parse(stored);
            if (Date.now() - scrollData.timestamp > ScrollStorage.MAX_AGE) {
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
        console.log(`[ScrollStorage] Cleanup: ${cleanedCount} expired entries removed`);
      }
    } catch (error) {
      console.error('[ScrollStorage] Cleanup failed:', error);
    }
  }

  /**
   * Scroll pozíciók listázása (debug célra)
   */
  static list(): ScrollPosition[] {
    try {
      const keys = Object.keys(localStorage).filter((key) => key.startsWith(ScrollStorage.PREFIX));
      const list = keys
        .map((key) => {
          try {
            const stored = localStorage.getItem(key);
            return stored ? JSON.parse(stored) : null;
          } catch {
            return null;
          }
        })
        .filter(Boolean);
      console.log(`[ScrollStorage] List: ${list.length} pozíció`);
      return list;
    } catch (error) {
      console.error('[ScrollStorage] List failed:', error);
      return [];
    }
  }
}
