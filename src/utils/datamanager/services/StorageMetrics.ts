import { DataManager } from '../manager';
import { StorageStatistics } from '../storage/indexedDBTypes';

export interface DetailedStorageStats {
  indexedDB: {
    size: number;
    estimatedSize: string;
    itemCounts: {
      tabs: number;
      articles: number;
      readArticles: number;
      userPreferences: number;
    };
  };
  localStorage: {
    size: number;
    estimatedSize: string;
    itemCount: number;
    keys: string[];
  };
  sessionStorage: {
    size: number;
    estimatedSize: string;
    itemCount: number;
  };
  total: {
    estimatedSize: string;
    breakdown: string;
  };
}

export class StorageMetrics {
  private static instance: StorageMetrics;

  public static getInstance(): StorageMetrics {
    if (!StorageMetrics.instance) {
      StorageMetrics.instance = new StorageMetrics();
    }
    return StorageMetrics.instance;
  }

  /**
   * Összes tárolási statisztika összegyűjtése
   */
  public async getDetailedStorageStats(): Promise<DetailedStorageStats> {
    const [indexedDBStats, localStorageStats, sessionStorageStats] = await Promise.all([
      this.getIndexedDBStats(),
      this.getLocalStorageStats(),
      this.getSessionStorageStats(),
    ]);

    const totalSizeBytes = indexedDBStats.size + localStorageStats.size + sessionStorageStats.size;

    return {
      indexedDB: indexedDBStats,
      localStorage: localStorageStats,
      sessionStorage: sessionStorageStats,
      total: {
        estimatedSize: this.formatBytes(totalSizeBytes),
        breakdown: `IndexedDB: ${this.formatBytes(indexedDBStats.size)}, LocalStorage: ${this.formatBytes(localStorageStats.size)}, SessionStorage: ${this.formatBytes(sessionStorageStats.size)}`,
      },
    };
  }

  /**
   * IndexedDB statisztikák
   */
  private async getIndexedDBStats() {
    try {
      const dataManager = DataManager.getInstance();
      const dbStats: StorageStatistics = await dataManager
        .getStorageAdapter()
        .getIndexedDBService()
        .getStatistics();

      return {
        size: dbStats.totalSize || 0,
        estimatedSize: this.formatBytes(dbStats.totalSize || 0),
        itemCounts: {
          tabs: dbStats.tabContentCount || 0,
          articles: dbStats.articleCount || 0,
          readArticles: dbStats.readArticleCount || 0,
          userPreferences: dbStats.userPreferenceCount || 0,
        },
      };
    } catch (error) {
      console.error('IndexedDB stats hiba:', error);
      return {
        size: 0,
        estimatedSize: '0 B',
        itemCounts: {
          tabs: 0,
          articles: 0,
          readArticles: 0,
          userPreferences: 0,
        },
      };
    }
  }

  /**
   * LocalStorage statisztikák
   */
  private getLocalStorageStats() {
    try {
      const keys = Object.keys(localStorage);
      let totalSize = 0;

      keys.forEach((key) => {
        const value = localStorage.getItem(key) || '';
        totalSize += key.length + value.length;
      });

      return {
        size: totalSize * 2, // UTF-16 karakterenként 2 byte
        estimatedSize: this.formatBytes(totalSize * 2),
        itemCount: keys.length,
        keys: keys,
      };
    } catch (error) {
      console.error('LocalStorage stats hiba:', error);
      return {
        size: 0,
        estimatedSize: '0 B',
        itemCount: 0,
        keys: [],
      };
    }
  }

  /**
   * SessionStorage statisztikák
   */
  private getSessionStorageStats() {
    try {
      const keys = Object.keys(sessionStorage);
      let totalSize = 0;

      keys.forEach((key) => {
        const value = sessionStorage.getItem(key) || '';
        totalSize += key.length + value.length;
      });

      return {
        size: totalSize * 2, // UTF-16 karakterenként 2 byte
        estimatedSize: this.formatBytes(totalSize * 2),
        itemCount: keys.length,
      };
    } catch (error) {
      console.error('SessionStorage stats hiba:', error);
      return {
        size: 0,
        estimatedSize: '0 B',
        itemCount: 0,
      };
    }
  }

  /**
   * Byte-ok emberi olvasható formátumba konvertálása
   */
  private formatBytes(bytes: number): string {
    if (bytes === 0) return '0 B';

    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  /**
   * Storage quota információk (ha támogatott)
   */
  public async getStorageQuota(): Promise<{
    used: string;
    total: string;
    percentage: number;
  } | null> {
    if ('storage' in navigator && 'estimate' in navigator.storage) {
      try {
        const estimate = await navigator.storage.estimate();
        const used = estimate.usage || 0;
        const total = estimate.quota || 0;
        const percentage = total > 0 ? Math.round((used / total) * 100) : 0;

        return {
          used: this.formatBytes(used),
          total: this.formatBytes(total),
          percentage,
        };
      } catch (error) {
        console.error('Storage quota lekérés hiba:', error);
      }
    }
    return null;
  }

  // ÚJ: Static metódusok a DataManager kompatibilitáshoz
  /**
   * Static metódus a részletes statisztikák lekéréséhez
   */
  public static async getDetailedStats(): Promise<DetailedStorageStats> {
    const instance = StorageMetrics.getInstance();
    return instance.getDetailedStorageStats();
  }

  /**
   * Static metódus a storage kvóta információkhoz - DataManager kompatibilis formátumban
   */
  public static async getStorageQuota(): Promise<{
    used: number;
    quota: number;
    usagePercentage: number;
  }> {
    const instance = StorageMetrics.getInstance();
    const quotaInfo = await instance.getStorageQuota();

    if (!quotaInfo) {
      return { used: 0, quota: 0, usagePercentage: 0 };
    }

    // Konvertálás a DataManager által várt formátumba
    if ('storage' in navigator && 'estimate' in navigator.storage) {
      try {
        const estimate = await navigator.storage.estimate();
        const used = estimate.usage || 0;
        const quota = estimate.quota || 0;
        const usagePercentage = quota > 0 ? Math.round((used / quota) * 100) : 0;

        return { used, quota, usagePercentage };
      } catch (error) {
        console.error('Storage quota lekérés hiba:', error);
      }
    }

    return { used: 0, quota: 0, usagePercentage: 0 };
  }

  /**
   * Static metódus a storage használat elemzéséhez
   */
  public static async analyzeUsage(): Promise<{
    criticalLevel: boolean;
    recommendations: string[];
    breakdown: Record<string, unknown>;
  }> {
    const instance = StorageMetrics.getInstance();
    const stats = await instance.getDetailedStorageStats();
    const quota = await StorageMetrics.getStorageQuota();

    const criticalLevel = quota.usagePercentage > 80;
    const recommendations: string[] = [];

    if (criticalLevel) {
      recommendations.push('Tárolási hely 80% felett - tisztítás javasolt');
    }

    if (stats.indexedDB.itemCounts.tabs > 100) {
      recommendations.push('Túl sok tab tartalom - régi tab-ok törlése javasolt');
    }

    if (stats.localStorage.itemCount > 500) {
      recommendations.push('LocalStorage sok elemet tartalmaz - cleanup javasolt');
    }

    return {
      criticalLevel,
      recommendations,
      breakdown: {
        indexedDB: stats.indexedDB,
        localStorage: stats.localStorage,
        total: stats.total,
      },
    };
  }
}

export const storageMetrics = StorageMetrics.getInstance();
export default storageMetrics;
