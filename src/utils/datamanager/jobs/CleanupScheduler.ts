/**
 * Automatikus 24 órás hírtörlés ütemező
 *
 * Ez a modul felelős a régi hírek automatikus törléséért:
 * - 24 óránál régebbi hírek eltávolítása
 * - Cache és storage cleanup
 * - Teljesítmény optimalizálás
 */

// ✅ JAVÍTVA: Típusdefiníciók importálása és definiálása
import type { DataManager } from '../manager';

interface CleanupConfig {
  MAX_AGE_HOURS: number;
  CLEANUP_INTERVAL_MS: number;
  BATCH_SIZE: number;
}

// ✅ JAVÍTVA: DataManager példány típusának definiálása
type DataManagerInstance = DataManager;

// ✅ ÚJ: Típusdefiníciók a hibák javításához
interface NewsItem {
  id?: string;
  title?: string;
  publishedAt?: number;
  timestamp?: number;
  [key: string]: unknown;
}

interface TabData {
  newsItems?: NewsItem[];
  lastCleanup?: number;
  [key: string]: unknown;
}

interface CachedData {
  timestamp?: number;
  lastUpdated?: number;
  publishedAt?: number;
  createdAt?: number;
  [key: string]: unknown;
}

export class CleanupScheduler {
  private cleanupInterval: NodeJS.Timeout | null = null;
  private isRunning: boolean = false;

  private readonly config: CleanupConfig = {
    // 168 órás beállítások (kommentálva - későbbi használatra)
    // MAX_AGE_HOURS: 168,        // 1 hét
    // CLEANUP_INTERVAL_MS: 4 * 60 * 60 * 1000,  // 4 óránként

    // 24 órás beállítások (AKTÍV)
    MAX_AGE_HOURS: 24, // Ultra-friss hírek
    CLEANUP_INTERVAL_MS: 4 * 60 * 60 * 1000, // 4 óránként (változatlan)

    BATCH_SIZE: 500, // 500 híres csoportokban
  };

  /**
   * Cleanup ütemező indítása
   */
  start(): void {
    if (this.cleanupInterval) {
      console.log('[CleanupScheduler] Már fut az ütemező');
      return;
    }

    console.log('[CleanupScheduler] Automatikus cleanup indítása');

    // Azonnali cleanup futtatása induláskor
    setTimeout(() => {
      this.runCleanup();
    }, 30000); // 30 másodperc késleltetés

    // Periodikus cleanup beállítása
    this.cleanupInterval = setInterval(() => {
      this.runCleanup();
    }, this.config.CLEANUP_INTERVAL_MS);
  }

  /**
   * Cleanup ütemező leállítása
   */
  stop(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
      console.log('[CleanupScheduler] Cleanup ütemező leállítva');
    }
  }

  /**
   * Cleanup folyamat futtatása
   */
  private async runCleanup(): Promise<void> {
    if (this.isRunning) {
      console.log('[CleanupScheduler] Cleanup már fut, kihagyás');
      return;
    }

    this.isRunning = true;
    const startTime = Date.now();

    try {
      console.log('[CleanupScheduler] 24 órás cleanup indítása...');

      const cutoffTimestamp = Date.now() - this.config.MAX_AGE_HOURS * 60 * 60 * 1000;

      // ❌ TÖRÖLVE: Memory cache cleanup - duplikáció useTabStorage-zel
      // await this.cleanupMemoryCache(cutoffTimestamp);

      // ✅ MEGTARTÁS: Storage cleanup (IndexedDB)
      await this.cleanupStorage(cutoffTimestamp);

      // ✅ MEGTARTÁS: Tab content cleanup
      await this.cleanupTabContent(cutoffTimestamp);

      const duration = Date.now() - startTime;
      console.log(`[CleanupScheduler] Cleanup befejezve ${duration}ms alatt`);
    } catch (error) {
      console.error('[CleanupScheduler] Cleanup hiba:', error);
    } finally {
      this.isRunning = false;
    }
  }

  /**
   * Storage (IndexedDB) tisztítása
   */
  private async cleanupStorage(cutoffTimestamp: number): Promise<void> {
    try {
      const { DataManager } = await import('../manager');
      const dataManager = DataManager.getInstance();

      // Régi hírek törlése storage-ból
      const storageKeys = await dataManager.getAllStorageKeys();
      let cleanedCount = 0;

      for (const key of storageKeys) {
        const shouldCleanup = await this.shouldCleanupStorageItem(
          key,
          dataManager,
          cutoffTimestamp,
        );
        if (shouldCleanup) {
          await dataManager.removeFromStorage(key);
          cleanedCount++;

          // Batch processing
          if (cleanedCount % this.config.BATCH_SIZE === 0) {
            await new Promise((resolve) => setTimeout(resolve, 100));
          }
        }
      }

      console.log(`[CleanupScheduler] ${cleanedCount} lejárt storage elem törölve`);
    } catch (error) {
      console.error('[CleanupScheduler] Storage cleanup hiba:', error);
    }
  }

  /**
   * ✅ JAVÍTVA: Storage elem cleanup ellenőrzése - típusok javítva
   */
  private async shouldCleanupStorageItem(
    key: string,
    dataManager: DataManagerInstance,
    cutoffTimestamp: number,
  ): Promise<boolean> {
    if (!key.includes('news_') && !key.includes('hírek_')) {
      return false;
    }

    const data = (await dataManager.getFromStorage(key)) as CachedData | null;
    // ✅ JAVÍTVA: Null check explicit kezelése
    return data !== null && this.isDataExpired(data, cutoffTimestamp);
  }

  /**
   * Tab tartalmak tisztítása
   */
  private async cleanupTabContent(cutoffTimestamp: number): Promise<void> {
    try {
      const { DataManager } = await import('../manager');
      const dataManager = DataManager.getInstance();

      // Tab tartalmak ellenőrzése
      const tabKeys = await dataManager.getAllStorageKeys();
      let cleanedTabs = 0;

      for (const key of tabKeys) {
        if (key.startsWith('tab_content_')) {
          const shouldClean = await this.processTabContent(key, dataManager, cutoffTimestamp);
          if (shouldClean) {
            cleanedTabs++;
          }
        }
      }

      console.log(`[CleanupScheduler] ${cleanedTabs} tab tartalom megtisztítva`);
    } catch (error) {
      console.error('[CleanupScheduler] Tab cleanup hiba:', error);
    }
  }

  /**
   * ✅ JAVÍTVA: Tab tartalom feldolgozása - típusok és beágyazás javítva
   */
  private async processTabContent(
    key: string,
    dataManager: DataManagerInstance,
    cutoffTimestamp: number,
  ): Promise<boolean> {
    const tabData = (await dataManager.getFromStorage(key)) as TabData | null;

    // ✅ JAVÍTVA: Null check és newsItems típus ellenőrzése
    if (!tabData || !tabData.newsItems || !Array.isArray(tabData.newsItems)) {
      return false;
    }

    // Hírek szűrése időhatár alapján
    const filteredNews = tabData.newsItems.filter((item: NewsItem) => {
      const itemTimestamp = item.publishedAt || item.timestamp || 0;
      return itemTimestamp > cutoffTimestamp;
    });

    // Ha jelentősen csökkent a hírek száma, frissítjük
    const originalCount = tabData.newsItems.length;
    const shouldUpdate = filteredNews.length < originalCount * 0.8;

    if (shouldUpdate) {
      await this.updateTabContent(key, dataManager, tabData, filteredNews);
      return true;
    }

    return false;
  }

  /**
   * ✅ JAVÍTVA: Tab tartalom frissítése - típusok javítva
   */
  private async updateTabContent(
    key: string,
    dataManager: DataManagerInstance,
    tabData: TabData,
    filteredNews: NewsItem[],
  ): Promise<void> {
    if (filteredNews.length > 0) {
      await dataManager.saveToStorage(key, {
        ...tabData,
        newsItems: filteredNews,
        lastCleanup: Date.now(),
      });
    } else {
      // Ha nincs friss hír, töröljük a tab-ot
      await dataManager.removeFromStorage(key);
    }
  }

  /**
   * Adat lejáratának ellenőrzése
   */
  private isDataExpired(data: CachedData, cutoffTimestamp: number): boolean {
    // Timestamp ellenőrzése többféle formátumban
    const timestamps = [data.timestamp, data.lastUpdated, data.publishedAt, data.createdAt].filter(
      Boolean,
    );

    if (timestamps.length === 0) {
      // Ha nincs timestamp, 24 óránál régebbinek tekintjük
      return true;
    }

    return timestamps.every((ts) => ts && ts < cutoffTimestamp);
  }

  /**
   * Manuális cleanup futtatása
   */
  async runManualCleanup(): Promise<void> {
    console.log('[CleanupScheduler] Manuális cleanup indítása...');
    await this.runCleanup();
  }

  /**
   * Státusz információ
   */
  getStatus(): { isRunning: boolean; nextCleanup: number } {
    return {
      isRunning: this.isRunning,
      nextCleanup: this.cleanupInterval ? Date.now() + this.config.CLEANUP_INTERVAL_MS : 0,
    };
  }
}

// Singleton instance
export const cleanupScheduler = new CleanupScheduler();
