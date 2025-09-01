
/*
Apró ötlet:
A setupEventListeners csak az online eseményt figyeli,
 de ha később bővülne (pl. offline-ra is), 
 érdemes lehet egy removeEventListeners metódust is hozzáadni,
  ha a manager-t valaha “unmountolni” kell.
*/

import { ApiClient } from '../../../apiclient/apiClient';
import { SyncService } from '../sync/syncService';
import { SyncInfo, SyncOptions } from '../types/sync';
import { IndexedDBService } from '../storage/indexedDBService';

/**
 * Szinkronizációs műveletek kezelője
 * Kiszervezve a DataManager-ből a Single Responsibility elv szerint
 */
export class SyncManager {
  private syncService: SyncService | null = null;
  private apiClient: ApiClient;

  constructor(apiClient: ApiClient) {
    this.apiClient = apiClient;
  }

  /**
   * SyncService inicializálása
   *
   * @param indexedDBService - Az IndexedDB szolgáltatás példánya
   * @param onSyncComplete - Callback a szinkronizáció befejezése után
   */
  public async initialize(
    indexedDBService: IndexedDBService,
    onSyncComplete: () => void,
  ): Promise<void> {
    if (!this.syncService) {
      this.syncService = new SyncService(this.apiClient, indexedDBService, onSyncComplete);
      console.log('[SyncManager] SyncService initialized.');
    }

    // Ha online, indítsunk egy szinkronizációt
    if (navigator.onLine) {
      this.syncService?.scheduleSyncWithDelay(1000);
    }

    // Eseményfigyelők beállítása
    this.setupEventListeners();
  }

  /**
   * Eseményfigyelők beállítása
   */
  private setupEventListeners(): void {
    window.addEventListener('online', () => {
      console.log('Online állapot - szinkronizálás indítása');
      this.syncService?.synchronize();
    });
  }

  /**
   * Szinkronizáció indítása
   *
   * @param options - Opcionális szinkronizációs beállítások
   * @returns Promise<boolean> - Sikeres volt-e a szinkronizáció
   */
  public async syncNow(options?: SyncOptions): Promise<boolean> {
    if (!this.syncService) {
      console.warn('SyncService is not initialized. Call SyncManager.initialize() first.');
      return false;
    }

    const result = options
      ? await this.syncService.synchronize(options)
      : await this.syncService.synchronize();

    return result.success;
  }

  /**
   * Szinkronizációs információk lekérése
   */
  public async getSyncInfo(): Promise<SyncInfo> {
    if (!this.syncService) {
      console.warn('SyncService is not initialized. Returning default SyncInfo.');
      return {
        lastSyncTimestamp: null,
        pendingCount: 0,
        isSyncing: false,
        lastSuccess: 0,
        error: 'SyncService not initialized',
      } as SyncInfo;
    }
    return await this.syncService.getSyncInfo();
  }

  /**
   * SyncService példány lekérése (ha szükséges közvetlen hozzáférés)
   */
  public getSyncService(): SyncService | null {
    return this.syncService;
  }
}
