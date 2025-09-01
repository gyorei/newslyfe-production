import { DebugInfo } from '../types/debug';
import { SyncInfo } from '../types/sync';
import { LocalStorageAdapter } from '../localStorage';
import { StorageAdapter } from '../storage';
import { SyncService } from '../sync/syncService';

/**
 * Debug információk kezelője
 * Kiszervezve a DataManager-ből a Single Responsibility elv szerint
 */
export class DebugManager {
  private localStorageAdapter: LocalStorageAdapter;
  private storageAdapter: StorageAdapter;
  private syncService: SyncService | null;

  constructor(
    localStorageAdapter: LocalStorageAdapter,
    storageAdapter: StorageAdapter,
    syncService: SyncService | null = null,
  ) {
    this.localStorageAdapter = localStorageAdapter;
    this.storageAdapter = storageAdapter;
    this.syncService = syncService;
  }

  /**
   * SyncService frissítése (inicializálás után)
   */
  public setSyncService(syncService: SyncService): void {
    this.syncService = syncService;
  }

  /**
   * Debug információk összegyűjtése
   */
  public async getDebugInfo(): Promise<DebugInfo> {
    const localState = await this.localStorageAdapter.loadLocalState();

    // Adatbázis statisztikák lekérése
    let dbStats = {};
    try {
      const indexedDBService = this.storageAdapter.getIndexedDBService();
      if (indexedDBService && typeof indexedDBService.getStatistics === 'function') {
        dbStats = await indexedDBService.getStatistics();
      }
    } catch (error) {
      console.warn('Nem sikerült lekérni az adatbázis statisztikákat:', error);
    }

    // Szinkronizációs információk lekérése
    let syncInfoData: SyncInfo;
    if (this.syncService) {
      try {
        syncInfoData = await this.syncService.getSyncInfo();
      } catch (error) {
        console.warn('Nem sikerült lekérni a szinkronizációs információkat:', error);
        syncInfoData = this.getDefaultSyncInfo('Hiba a szinkronizációs információk lekérése során');
      }
    } else {
      syncInfoData = this.getDefaultSyncInfo('SyncService not initialized');
    }

    return {
      localState,
      dbStats,
      syncInfo: syncInfoData,
      deviceId: localStorage.getItem('device-id'),
      timestamp: Date.now(),
    };
  }

  /**
   * Alapértelmezett szinkronizációs információk létrehozása
   */
  private getDefaultSyncInfo(error: string): SyncInfo {
    return {
      lastSyncTimestamp: null,
      pendingCount: 0,
      isSyncing: false,
      lastSuccess: 0,
      error,
    } as SyncInfo;
  }

  /**
   * Rendszer állapot összefoglaló lekérése
   */
  public async getSystemStatus(): Promise<{
    isOnline: boolean;
    storageAvailable: boolean;
    syncAvailable: boolean;
    lastActivity: number;
  }> {
    return {
      isOnline: navigator.onLine,
      storageAvailable: await this.checkStorageAvailability(),
      syncAvailable: this.syncService !== null,
      lastActivity: Date.now(),
    };
  }

  /**
   * Storage elérhetőség ellenőrzése
   */
  private async checkStorageAvailability(): Promise<boolean> {
    try {
      await this.storageAdapter.get('test-key');
      return true;
    } catch (error) {
      console.warn('Storage nem érhető el:', error);
      return false;
    }
  }
}
