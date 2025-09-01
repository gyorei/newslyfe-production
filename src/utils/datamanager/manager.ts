import { StorageAdapter } from './storage';
import { LocalStorageAdapter } from './localStorage';
import { CacheOptions } from './cache/types';
import { StorageOptions } from './storage/types';
import { LocalStorageOptions } from './localStorage/types';
import { ApiClient } from '../../apiclient/apiClient';
import { SyncService } from './sync/syncService';
import { SyncInfo, SyncOptions } from './types/sync';
import { DebugInfo } from './types/debug';
// ÚJ: Cleanup scheduler import
import { cleanupScheduler } from './jobs/CleanupScheduler';
// ÚJ: StorageMetrics import
import { StorageMetrics, DetailedStorageStats } from './services/StorageMetrics';

/**
 * Az adatterulet típusa
 */
export enum DataArea {
  CACHE = 'cache', // Gyors, rövid élettartamú cache
  STORAGE = 'storage', // Perzisztens tárolás
  LOCAL_STORAGE = 'local', // Közvetlen localStorage elérés
}

/**
 * Területspecifikus opciók típusa
 */
export type AreaSpecificOptions =
  | { area: DataArea.CACHE; options: CacheOptions }
  | { area: DataArea.STORAGE; options: StorageOptions }
  | { area: DataArea.LOCAL_STORAGE; options: LocalStorageOptions };

/**
 * ÚJ: Inicializálási állapot nyomon követése
 * ✅ JAVÍTOTT: Részletesebb inicializálási státusz
 */
let isInitialized = false;
let isInitializing = false;
let initializePromise: Promise<void> | null = null; // ✅ KRITIKUS JAVÍTÁS: Promise cache

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

/**
 * Egységes adatkezelő osztály
 *
 * Központi belépési pont minden adateléréshez:
 * - Gyorsítótár adatok (cache)
 * - Hosszú távú tárolás (storage)
 * - Közvetlen localStorage elérés
 * - Automatikus 24 órás cleanup
 */
export class DataManager {
  private static instance: DataManager;

  private storageAdapter: StorageAdapter;
  private localStorageAdapter: LocalStorageAdapter;
  private apiClient: ApiClient; // ✅ JAVÍTÁS: Már nem nullable
  private syncService: SyncService | null = null;

  // ✅ ÚJ: Memory monitoring és performance tracking
  private performanceMetrics = {
    operationCount: 0,
    totalOperationTime: 0,
    slowOperations: [] as Array<{ operation: string; duration: number; timestamp: number }>,
    memorySnapshots: [] as Array<{ timestamp: number; used: number; total: number }>,
    lastMemoryCheck: Date.now(),
  };

  // 🚀 ÚJ: Beállítások memória cache optimalizáció
  private settingsCache = new Map<string, { value: any; timestamp: number }>();
  private readonly SETTINGS_CACHE_TTL = 5 * 60 * 1000; // 5 perc
  
  // 🎯 Speciális cache a user_darkMode számára (ultra gyors hozzáférés)
  private darkModeCache: { value: boolean; timestamp: number } | null = null;
  private readonly DARK_MODE_CACHE_TTL = 10 * 60 * 1000; // 10 perc
  
  // 🎯 Speciális cache a user_showHorizontalScroller számára
  private horizontalScrollerCache: { value: boolean; timestamp: number } | null = null;
  private readonly HORIZONTAL_SCROLLER_CACHE_TTL = 15 * 60 * 1000; // 15 perc
  
  // 🎯 Kritikus beállítások előre betöltéshez
  private readonly preloadCriticalSettings = [
    'user_darkMode',
    'user_fontSize', 
    'user_language',
    'user_theme',
    'user_showHorizontalScroller', // ⚠️ Még használva - optimalizálás szükséges!
    'user_itemsPerPage',
    'user_maxAgeHours',
  ];

  private constructor() {
    // Adapterek inicializálása
    this.storageAdapter = new StorageAdapter();
    this.localStorageAdapter = new LocalStorageAdapter();

    // ✅ JAVÍTÁS: API kliens nem nullable
    this.apiClient = new ApiClient();
  }

  /**
   * DataManager singleton példány lekérése
   */
  public static getInstance(): DataManager {
    if (!DataManager.instance) {
      DataManager.instance = new DataManager();
    }
    return DataManager.instance;
  }

  /**
   * Inicializálja az adaptereket és a szinkronizációt
   * ✅ JAVÍTOTT duplikáció-mentes inicializálás + Promise cache
   */
  public async initialize(): Promise<void> {
    // ✅ KRITIKUS JAVÍTÁS: Ha már inicializálva, azonnal return
    if (isInitialized) {
      console.log('[DataManager] Már inicializálva, kihagyás');
      return;
    }

    // ✅ KRITIKUS JAVÍTÁS: Ha inicializálás folyamatban, várjuk meg ugyanazt a Promise-t
    if (isInitializing && initializePromise) {
      console.log('[DataManager] Inicializálás folyamatban, várakozás...');
      return initializePromise;
    }

    // ✅ ÚJ: Promise cache létrehozása - ez akadályozza meg a 6x duplikált hívást
    isInitializing = true;
    initializePromise = this._doInitialize();

    try {
      await initializePromise;
    } finally {
      isInitializing = false;
      initializePromise = null;
    }
  }

  /**
   * ✅ ÚJ: Tényleges inicializálási logika külön metódusban
   */
  private async _doInitialize(): Promise<void> {
    console.log('[DataManager] Egyetlen inicializálás elkezdése...');

    // ✅ ÚJ: Performance monitoring indítása
    this.startPerformanceMonitoring();
    this.trackMemoryUsage(); // Initial memory check

    // StorageAdapter inicializálása
    await this.storageAdapter.initialize();
    console.log('[DataManager] StorageAdapter initialized.');

    // ✅ JAVÍTÁS: SyncService inicializálása - apiClient már nem nullable
    if (!this.syncService) {
      this.syncService = new SyncService(
        this.apiClient, // Most már nem null
        this.storageAdapter.getIndexedDBService(),
        () => this.onSyncComplete(),
      );
      console.log('[DataManager] SyncService initialized.');
    }

    // ÚJ: Automatikus cleanup scheduler indítása
    cleanupScheduler.start();
    console.log('[DataManager] 24 órás cleanup scheduler elindítva');

    // Ha online, indítsunk egy szinkronizációt
    if (navigator.onLine) {
      this.syncService?.scheduleSyncWithDelay(1000); // Optional chaining
    }

    // Eseményfigyelők
    window.addEventListener('online', () => {
      console.log('Online állapot - szinkronizálás indítása');
      this.syncService?.synchronize(); // Optional chaining
    });

    // ÚJ: beforeunload esemény - cleanup leállítása
    window.addEventListener('beforeunload', () => {
      cleanupScheduler.stop();
    });

    isInitialized = true; // ✅ JAVÍTÁS: Itt állítjuk be, hogy befejezett
    console.log('[DataManager] Inicializálás sikeresen befejezve - SINGLETON MEGERŐSÍTVE');
  }

  /**
   * Szinkronizáció indítása
   * Áthelyezve a StorageManager osztályból
   *
   * @param options - Opcionális szinkronizációs beállítások
   * @returns Promise<boolean> - Sikeres volt-e a szinkronizáció
   */
  public async syncNow(options?: SyncOptions): Promise<boolean> {
    if (!this.syncService) {
      console.warn('SyncService is not initialized. Call DataManager.initialize() first.');
      return false;
    }
    // Ha vannak opciók, adjuk át azokat a synchronize() metódusnak
    // Ha nincsenek, egyszerűen hívjuk a synchronize() metódust paraméter nélkül
    const result = options
      ? await this.syncService.synchronize(options)
      : await this.syncService.synchronize();

    return result.success;
  }

  /**
   * Szinkronizáció után meghívott callback
   * Áthelyezve a StorageManager osztályból
   */
  private onSyncComplete(): void {
    // Értesíthetjük a hookot, hogy frissítse az állapotot
  }

  /**
   * Szinkronizációs információk lekérése
   * Áthelyezve a StorageManager osztályból
   */
  public async getSyncInfo(): Promise<SyncInfo> {
    if (!this.syncService) {
      console.warn('SyncService is not initialized. Returning default SyncInfo.');
      // Ellenőrizd a SyncInfo típust a c:\\news\\src\\utils\\datamanager\\types\\sync.ts fájlban
      // hogy ezek a mezők megfelelnek-e.
      return {
        lastSyncTimestamp: null,
        pendingCount: 0,
        isSyncing: false,
        lastSuccess: 0, // Módosítva null-ról 0-ra, hogy megfeleljen a number típusnak
        error: 'SyncService not initialized',
      } as SyncInfo;
    }
    return await this.syncService.getSyncInfo();
  }

  /**
   * Debug információk összegyűjtése
   * Áthelyezve a StorageManager osztályból
   */
  public async getDebugInfo(): Promise<DebugInfo> {
    const localState = await this.localStorageAdapter.loadLocalState();

    // ÚJ: Részletes storage statisztikák lekérése StorageMetrics segítségével
    let dbStats;
    try {
      dbStats = await StorageMetrics.getDetailedStats();
    } catch (error) {
      console.warn('Failed to get detailed storage stats:', error);
      dbStats = { error: 'Storage stats unavailable' };
    }

    let syncInfoData: SyncInfo;
    if (this.syncService) {
      syncInfoData = await this.syncService.getSyncInfo();
    } else {
      // Ellenőrizd a SyncInfo típust a c:\\news\\src\\utils\\datamanager\\types\\sync.ts fájlban
      syncInfoData = {
        lastSyncTimestamp: null,
        pendingCount: 0,
        isSyncing: false,
        lastSuccess: 0, // Módosítva null-ról 0-ra, hogy megfeleljen a number típusnak
        error: 'SyncService not initialized',
      } as SyncInfo;
    }

    // ÚJ: Storage quota és cleanup info hozzáadása
    let quotaInfo;
    let cleanupStatus;
    try {
      quotaInfo = await StorageMetrics.getStorageQuota();
      cleanupStatus = this.getCleanupStatus();
    } catch (error) {
      console.warn('Failed to get quota/cleanup info:', error);
      quotaInfo = { used: 0, quota: 0, usagePercentage: 0 };
      cleanupStatus = { isRunning: false, nextCleanup: 0 };
    }

    return {
      localState,
      dbStats,
      syncInfo: syncInfoData,
      deviceId: localStorage.getItem('device-id'),
      timestamp: Date.now(),
      // ÚJ: Kiegészítő debug információk
      quotaInfo,
      cleanupStatus,
    };
  }

  /**
   * Eltárolja, hogy melyik adapter mely területhez tartozik
   */
  private getAdapter(area: DataArea) {
    switch (area) {
      case DataArea.CACHE:
        // CACHE területhez használjuk a StorageAdapter-t (cache funkciókkal)
        return this.storageAdapter;
      case DataArea.STORAGE:
        return this.storageAdapter;
      case DataArea.LOCAL_STORAGE:
        return this.localStorageAdapter;
      default:
        throw new Error(`Ismeretlen tárolási terület: ${area}`);
    }
  }

  /**
   * ✅ JAVÍTOTT: Egyszerűsített metódusok - EGYETLEN implementáció típusonként
   */

  // Adat lekérése
  async get<T>(
    area: DataArea,
    key: string,
    options: Record<string, unknown> = {},
  ): Promise<T | null> {
    return this.trackOperation(async () => {
      // 🚀 CACHE OPTIMALIZÁCIÓ: localStorage beállítások gyors elérése
      if (area === DataArea.LOCAL_STORAGE) {
        // 1. Memória cache ellenőrzés
        const cached = this.settingsCache.get(key);
        if (cached && Date.now() - cached.timestamp < this.SETTINGS_CACHE_TTL) {
          console.log(`[DataManager] ⚡ Cache hit: ${key} (${Date.now() - cached.timestamp}ms régi)`);
          return cached.value as T;
        }
        
        // 2. Eredeti lekérés
        const result = await this.localStorageAdapter.get<T>(key, options as LocalStorageOptions);
        
        // 3. Cache mentés (csak ha van érték)
        if (result !== null) {
          this.settingsCache.set(key, { value: result, timestamp: Date.now() });
          
          // Cache méret korlátozás (LRU-szerű)
          if (this.settingsCache.size > 20) {
            const firstKey = this.settingsCache.keys().next().value;
            if (firstKey) {
              this.settingsCache.delete(firstKey);
            }
          }
        }
        
        return result;
      }
      
      // Eredeti logika más területekhez
      switch (area) {
        case DataArea.CACHE:
        case DataArea.STORAGE:
          return this.storageAdapter.get<T>(key, options as { storeName?: string });
        default:
          throw new Error(`Ismeretlen tárolási terület: ${area}`);
      }
    }, `get(${area}, ${key})`);
  }

  // Adat mentése
  async set<T>(
    area: DataArea,
    key: string,
    value: T,
    options: Record<string, unknown> = {},
  ): Promise<boolean> {
    return this.trackOperation(async () => {
      let result: boolean;
      
      switch (area) {
        case DataArea.CACHE:
        case DataArea.STORAGE:
          result = await this.storageAdapter.set<T>(key, value, options as { storeName?: string });
          break;
        case DataArea.LOCAL_STORAGE:
          result = await this.localStorageAdapter.set<T>(key, value, options as LocalStorageOptions);
          
          // 🔄 Cache frissítés localStorage mentés után
          if (result) {
            this.settingsCache.set(key, { value, timestamp: Date.now() });
            
            // Speciális cache frissítések
            if (key === 'user_darkMode') {
              this.darkModeCache = { value: value as boolean, timestamp: Date.now() };
            }
            if (key === 'user_showHorizontalScroller') {
              this.horizontalScrollerCache = { value: value as boolean, timestamp: Date.now() };
            }
          }
          break;
        default:
          throw new Error(`Ismeretlen tárolási terület: ${area}`);
      }
      
      return result;
    }, `set(${area}, ${key})`);
  }

  // Adat törlése
  async delete(
    area: DataArea,
    key: string,
    options: Record<string, unknown> = {},
  ): Promise<boolean> {
    return this.trackOperation(async () => {
      switch (area) {
        case DataArea.CACHE:
        case DataArea.STORAGE:
          // ✅ JAVÍTÁS: storageAdapter.delete csak 1 paramétert vár
          return this.storageAdapter.delete(key);
        case DataArea.LOCAL_STORAGE:
          return this.localStorageAdapter.delete(key, options as LocalStorageOptions);
        default:
          throw new Error(`Ismeretlen tárolási terület: ${area}`);
      }
    }, `delete(${area}, ${key})`);
  }

  /**
   * StorageAdapter példány lekérése
   * Ez szükséges például a tab tartalmak közvetlen kezeléséhez
   */
  public getStorageAdapter(): StorageAdapter {
    return this.storageAdapter;
  }

  // ÚJ: Gyors elérési módszerek cache-hez
  async getFromCache<T>(key: string): Promise<T | null> {
    return this.get<T>(DataArea.CACHE, key);
  }

  async saveToCache<T>(key: string, value: T, ttl?: number): Promise<boolean> {
    return this.set<T>(DataArea.CACHE, key, value, { ttl });
  }

  async removeFromCache(key: string): Promise<boolean> {
    return this.delete(DataArea.CACHE, key);
  }

  // ÚJ: Gyors elérési módszerek storage-hoz
  async getFromStorage<T>(key: string): Promise<T | null> {
    return this.get<T>(DataArea.STORAGE, key);
  }

  async saveToStorage<T>(key: string, value: T): Promise<boolean> {
    return this.set<T>(DataArea.STORAGE, key, value);
  }

  async removeFromStorage(key: string): Promise<boolean> {
    return this.delete(DataArea.STORAGE, key);
  }

  // 🌙 ÚJ: Speciális dark mode optimalizáció (ultra-gyors elérés)
  async getDarkMode(): Promise<boolean> {
    if (this.darkModeCache && Date.now() - this.darkModeCache.timestamp < this.DARK_MODE_CACHE_TTL) {
      return this.darkModeCache.value;
    }
    
    const result = await this.get<boolean>(DataArea.LOCAL_STORAGE, 'user_darkMode');
    this.darkModeCache = { value: result ?? false, timestamp: Date.now() };
    return result ?? false;
  }

  // 📜 Ultra gyors horizontal scroller lekérés (külön cache-szel)
  async getHorizontalScroller(): Promise<boolean> {
    if (this.horizontalScrollerCache && Date.now() - this.horizontalScrollerCache.timestamp < this.HORIZONTAL_SCROLLER_CACHE_TTL) {
      return this.horizontalScrollerCache.value;
    }
    
    const result = await this.get<boolean>(DataArea.LOCAL_STORAGE, 'user_showHorizontalScroller');
    this.horizontalScrollerCache = { value: result ?? false, timestamp: Date.now() };
    return result ?? false;
  }

  // 🌙 Dark mode mentés cache frissítéssel
  async setDarkMode(darkMode: boolean): Promise<boolean> {
    const success = await this.set<boolean>(DataArea.LOCAL_STORAGE, 'user_darkMode', darkMode);
    
    if (success) {
      // Cache frissítés
      this.darkModeCache = { value: darkMode, timestamp: Date.now() };
      console.log(`[DataManager] 🌙 Dark mode mentve és cache frissítve: ${darkMode}`);
    }
    
    return success;
  }

  // 🗑️ Cache invalidálás (szükség esetén)
  invalidateSettingsCache(key?: string): void {
    if (key) {
      this.settingsCache.delete(key);
      if (key === 'user_darkMode') {
        this.darkModeCache = null;
      }
      if (key === 'user_showHorizontalScroller') {
        this.horizontalScrollerCache = null;
      }
      console.log(`[DataManager] 🗑️ Cache invalidálva: ${key}`);
    } else {
      this.settingsCache.clear();
      this.darkModeCache = null;
      this.horizontalScrollerCache = null;
      console.log(`[DataManager] 🗑️ Összes beállítás cache törölve`);
    }
  }

  // ÚJ: Storage kulcsok listázása
  async getAllStorageKeys(): Promise<string[]> {
    return this.storageAdapter.getAllKeys();
  }

  /**
   * ÚJ: Manuális cleanup futtatása
   */
  public async runCleanup(): Promise<void> {
    await cleanupScheduler.runManualCleanup();
  }

  /**
   * ÚJ: Cleanup státusz lekérése
   */
  public getCleanupStatus(): { isRunning: boolean; nextCleanup: number } {
    return cleanupScheduler.getStatus();
  }

  /**
   * ÚJ: Részletes storage statisztikák lekérése
   */
  public async getDetailedStorageStats(): Promise<DetailedStorageStats> {
    return StorageMetrics.getDetailedStats();
  }

  /**
   * ÚJ: Storage kvóta információk lekérése
   */
  public async getStorageQuotaInfo(): Promise<{
    used: number;
    quota: number;
    usagePercentage: number;
  }> {
    return StorageMetrics.getStorageQuota();
  }

  /**
   * ÚJ: Storage terület elemzése
   */
  public async analyzeStorageUsage(): Promise<{
    criticalLevel: boolean;
    recommendations: string[];
    breakdown: Record<string, unknown>;
  }> {
    return StorageMetrics.analyzeUsage();
  }

  // ÚJ: Gyors elérési módszerek localStorage-hoz (wrapper)
  async getFromLocalStorage<T>(key: string): Promise<T | null> {
    return this.get<T>(DataArea.LOCAL_STORAGE, key);
  }

  async saveToLocalStorage<T>(key: string, value: T): Promise<boolean> {
    return this.set<T>(DataArea.LOCAL_STORAGE, key, value);
  }

  async removeFromLocalStorage(key: string): Promise<boolean> {
    return this.delete(DataArea.LOCAL_STORAGE, key);
  }

  // ÚJ: Kompatibilitási metódusok a régi localStorage.getItem/setItem helyettesítésére
  async getItem<T>(key: string): Promise<T | null> {
    return this.getFromLocalStorage<T>(key);
  }

  async setItem<T>(key: string, value: T): Promise<boolean> {
    return this.saveToLocalStorage<T>(key, value);
  }

  async removeItem(key: string): Promise<boolean> {
    return this.removeFromLocalStorage(key);
  }

  /**
   * ✅ ÚJ: Memory usage monitoring és leak detection
   */
  private trackMemoryUsage(): void {
    if (performance.memory) {
      const used = Math.round(performance.memory.usedJSHeapSize / 1024 / 1024);
      const total = Math.round(performance.memory.totalJSHeapSize / 1024 / 1024);
      const limit = Math.round(performance.memory.jsHeapSizeLimit / 1024 / 1024);

      // Store snapshot
      this.performanceMetrics.memorySnapshots.push({
        timestamp: Date.now(),
        used,
        total,
      });

      // Keep only last 100 snapshots
      if (this.performanceMetrics.memorySnapshots.length > 100) {
        this.performanceMetrics.memorySnapshots.shift();
      }

      // Critical memory warnings
      const usagePercentage = (used / limit) * 100;
      if (usagePercentage > 80) {
        console.error(
          `[DataManager] 🚨 KRITIKUS MEMÓRIAHASZNÁLAT: ${used}MB/${limit}MB (${usagePercentage.toFixed(1)}%)`,
        );
      } else if (usagePercentage > 60) {
        console.warn(
          `[DataManager] ⚠️ MAGAS MEMÓRIAHASZNÁLAT: ${used}MB/${limit}MB (${usagePercentage.toFixed(1)}%)`,
        );
      }

      // Memory leak detection - check for continuous growth
      if (this.performanceMetrics.memorySnapshots.length >= 10) {
        const recent = this.performanceMetrics.memorySnapshots.slice(-10);
        const growthRate = (recent[recent.length - 1].used - recent[0].used) / recent.length;

        if (growthRate > 5) {
          // More than 5MB growth per snapshot
          console.warn(
            `[DataManager] 🔍 MEMORY LEAK GYANÚ: ${growthRate.toFixed(1)}MB/snapshot növekedés`,
          );
        }
      }

      this.performanceMetrics.lastMemoryCheck = Date.now();
    }
  }

  /**
   * ✅ ÚJ: Operation performance tracking
   */
  private trackOperation<T>(operation: () => Promise<T>, operationName: string): Promise<T> {
    const startTime = performance.now();
    this.performanceMetrics.operationCount++;

    return operation()
      .then((result) => {
        const duration = performance.now() - startTime;
        this.performanceMetrics.totalOperationTime += duration;

        // Track slow operations
        if (duration > 100) {
          // Operations slower than 100ms
          this.performanceMetrics.slowOperations.push({
            operation: operationName,
            duration,
            timestamp: Date.now(),
          });

          console.warn(
            `[DataManager] 🐌 LASSÚ MŰVELET: ${operationName} - ${duration.toFixed(2)}ms`,
          );

          // Keep only last 50 slow operations
          if (this.performanceMetrics.slowOperations.length > 50) {
            this.performanceMetrics.slowOperations.shift();
          }
        }

        return result;
      })
      .catch((error) => {
        const duration = performance.now() - startTime;
        console.error(
          `[DataManager] ❌ MŰVELET HIBA: ${operationName} - ${duration.toFixed(2)}ms`,
          error,
        );
        throw error;
      });
  }

  /**
   * ✅ ÚJ: Performance monitoring timer
   */
  private startPerformanceMonitoring(): void {
    // Memory monitoring every 2 minutes
    setInterval(
      () => {
        this.trackMemoryUsage();
      },
      2 * 60 * 1000,
    );

    // Performance summary every 10 minutes
    setInterval(
      () => {
        this.logPerformanceSummary();
      },
      10 * 60 * 1000,
    );
  }

  /**
   * ✅ ÚJ: Performance summary logging
   */
  private logPerformanceSummary(): void {
    const avgOperationTime =
      this.performanceMetrics.operationCount > 0
        ? this.performanceMetrics.totalOperationTime / this.performanceMetrics.operationCount
        : 0;

    const recentSlowOps = this.performanceMetrics.slowOperations.filter(
      (op) => Date.now() - op.timestamp < 10 * 60 * 1000, // Last 10 minutes
    );

    console.log(`[DataManager] 📊 Performance Summary:
    - Operations: ${this.performanceMetrics.operationCount}
    - Avg Time: ${avgOperationTime.toFixed(2)}ms
    - Slow Ops (10min): ${recentSlowOps.length}
    - Memory Checks: ${this.performanceMetrics.memorySnapshots.length}`);

    if (recentSlowOps.length > 0) {
      console.warn(
        `[DataManager] ⚠️ Recent slow operations:`,
        recentSlowOps.slice(-5).map((op) => `${op.operation}: ${op.duration.toFixed(2)}ms`),
      );
    }
  }

  /**
   * ✅ ÚJ: Performance diagnostics lekérése
   */
  public getPerformanceDiagnostics(): {
    operationCount: number;
    avgOperationTime: number;
    slowOperationsCount: number;
    memoryUsage: { used: number; total: number; percentage: number } | null;
    recentSlowOps: Array<{ operation: string; duration: number; timestamp: number }>;
    healthStatus: 'KIVÁLÓ' | 'JÓ' | 'KÖZEPES' | 'GYENGE';
  } {
    const avgTime =
      this.performanceMetrics.operationCount > 0
        ? this.performanceMetrics.totalOperationTime / this.performanceMetrics.operationCount
        : 0;

    const recentSlowOps = this.performanceMetrics.slowOperations.filter(
      (op) => Date.now() - op.timestamp < 10 * 60 * 1000,
    );

    let memoryUsage = null;
    if (performance.memory) {
      const used = Math.round(performance.memory.usedJSHeapSize / 1024 / 1024);
      const total = Math.round(performance.memory.totalJSHeapSize / 1024 / 1024);
      memoryUsage = {
        used,
        total,
        percentage: (used / total) * 100,
      };
    }

    // Health status calculation
    let healthStatus: 'KIVÁLÓ' | 'JÓ' | 'KÖZEPES' | 'GYENGE' = 'KIVÁLÓ';
    if (avgTime > 100 || recentSlowOps.length > 5) healthStatus = 'GYENGE';
    else if (avgTime > 50 || recentSlowOps.length > 2) healthStatus = 'KÖZEPES';
    else if (avgTime > 20 || recentSlowOps.length > 0) healthStatus = 'JÓ';

    return {
      operationCount: this.performanceMetrics.operationCount,
      avgOperationTime: avgTime,
      slowOperationsCount: this.performanceMetrics.slowOperations.length,
      memoryUsage,
      recentSlowOps: recentSlowOps.slice(-5),
      healthStatus,
    };
  }
}
