/**
 * Szinkronizáció kezelő implementáció a News alkalmazáshoz
 * FRISSÍTVE: DataManager localStorage wrapper használatával
 */
import { ApiClient } from '../../../apiclient/apiClient';
import { IndexedDBService } from '../storage/indexedDBService';
import { DataManager } from '../manager';
import {
  SyncResponse,
  SyncResult,
  SyncChanges,
  SaveQueueItem,
  Article,
  ReadArticle,
  UserPreferences,
  SyncStats,
  SyncOptions,
} from '../types/sync';
import {
  ArticleSyncRequest,
  ArticleSyncItem,
  ApiResponse,
  SyncResponseData,
  SyncPayloadChanges,
} from '../types/api';

import { ArticleData } from '../storage/indexedDBTypes';

export class SyncService {
  private syncInProgress = false;
  private static readonly DEVICE_ID_KEY = 'device-id';
  private static readonly SYNC_STATS_KEY = 'sync-stats';
  private dataManager = DataManager.getInstance();

  constructor(
    private apiClient: ApiClient,
    private indexedDBService: IndexedDBService,
    private onSyncComplete?: () => void,
  ) {}

  /**
   * Kétirányú szinkronizáció végrehajtása
   */
  async synchronize(options?: SyncOptions): Promise<SyncResult> {
    if (this.syncInProgress) {
      return {
        success: false,
        syncedItemCount: 0,
        receivedItemCount: 0,
        error: 'Szinkronizáció már folyamatban',
      };
    }

    if (!navigator.onLine) {
      return {
        success: false,
        syncedItemCount: 0,
        receivedItemCount: 0,
        error: 'Nincs internetkapcsolat',
      };
    }

    try {
      this.syncInProgress = true;

      // Beállítások kezelése
      const fullSync = options?.forceFullSync || false;

      // Opcionális cache törlés, ha kérve lett
      if (options?.clearLocalCache) {
        // TODO: Cache törlés implementálása
        console.log('Cache törlés kérve a szinkronizáció előtt');
      }

      // 1. Szinkronizálandó adatok előkészítése
      const { articlesToSync, unsyncedCount, saveQueueCount } =
        await this.prepareSyncPayload(fullSync);
      const lastSyncTimestamp = fullSync
        ? 0
        : parseInt((await this.dataManager.getItem<string>('lastSyncTimestamp')) || '0');

      // Az API-nak megfelelő kérés összeállítása
      const apiSyncRequest: ArticleSyncRequest = {
        deviceId: await this.getDeviceId(),
        lastSyncTimestamp: lastSyncTimestamp,
        items: articlesToSync,
      };

      // API hívás az átalakított kérésformátummal
      const apiResponse: ApiResponse<SyncResponseData> =
        await this.apiClient.synchronize(apiSyncRequest);

      // Részletesebb hibakezelés az API válaszra
      if (!apiResponse.success || !apiResponse.data) {
        const errorDetails = this.getDetailedErrorMessage(apiResponse);
        console.warn('Szinkronizációs hiba:', errorDetails);

        // Mentjük a részletes hibát a statisztikákba
        await this.saveSyncStats({
          lastFailure: Date.now(),
          error: errorDetails,
        });

        // Visszatérünk sikertelen eredménnyel részletes hibaüzenettel
        return {
          success: false,
          syncedItemCount: 0,
          receivedItemCount: 0,
          error: errorDetails,
        };
      }

      // Az API válaszának átalakítása a belső SyncResponse formátumra
      const syncResponse: SyncResponse = {
        timestamp: apiResponse.data.newLastSyncTimestamp,
        changes: this.convertApiChangesToSyncChanges(apiResponse.data.changes),
      };

      // 2. Szerver változások alkalmazása lokálisan
      await this.applyServerChanges(syncResponse.changes);

      // 3. Olvasott cikkek szinkronizálási jelölése (csak azok, amiket ténylegesen elküldtünk)
      const unsyncedReadArticleIds = (await this.indexedDBService.getUnsyncedReadArticles()).map(
        (item) => item.id,
      );
      await this.indexedDBService.markArticlesAsSynced(unsyncedReadArticleIds);

      // 4. Szinkronizációs időbélyeg frissítése
      await this.dataManager.setItem('lastSyncTimestamp', syncResponse.timestamp.toString());

      // 5. Szinkronizációs statisztikák mentése
      const totalSyncedItems = unsyncedCount + saveQueueCount;
      await this.saveSyncStats({
        lastSuccess: Date.now(),
        syncedItemCount: totalSyncedItems,
        receivedItemCount: this.countReceivedItems(syncResponse.changes),
      });

      // Callbackek értesítése
      if (this.onSyncComplete) {
        this.onSyncComplete();
      }

      return {
        success: true,
        syncedItemCount: totalSyncedItems,
        receivedItemCount: this.countReceivedItems(syncResponse.changes),
      };
    } catch (error) {
      console.error('Szinkronizációs hiba:', error);
      await this.saveSyncStats({
        lastFailure: Date.now(),
        error: error instanceof Error ? error.message : String(error),
      });
      return { success: false, syncedItemCount: 0, receivedItemCount: 0 };
    } finally {
      this.syncInProgress = false;
    }
  }

  /**
   * Késleltetett szinkronizáció ütemezése
   */
  scheduleSyncWithDelay(delayMs: number = 30000): void {
    setTimeout(() => this.synchronize(), delayMs);
  }

  /**
   * Szinkronizációs információk lekérése
   */
  async getSyncInfo(): Promise<{
    lastSuccess: number;
    lastFailure?: number;
    pendingCount: number;
    error?: string;
  }> {
    // Olvasás DataManager-ből
    const syncStatsString = await this.dataManager.getItem<string>(SyncService.SYNC_STATS_KEY);
    const stats = syncStatsString ? JSON.parse(syncStatsString) : { lastSuccess: 0 };

    // Aktuális szinkronizálatlan elemek száma
    const unsynced = await this.indexedDBService.getUnsyncedReadArticles();

    return {
      ...stats,
      pendingCount: unsynced.length,
    };
  }

  // Private helper metódusok
  private async prepareSyncPayload(
    _fullSync: boolean,
  ): Promise<{ articlesToSync: ArticleSyncItem[]; unsyncedCount: number; saveQueueCount: number }> {
    // Szinkronizálatlan olvasottsági adatok lekérése
    const unsyncedReadArticles = await this.indexedDBService.getUnsyncedReadArticles();

    // Mentési sor elemeinek lekérése
    const saveQueueItems = await this.processSaveQueue();

    const articlesToSync: ArticleSyncItem[] = [
      // Olvasottsági adatok konvertálása
      ...unsyncedReadArticles.map(
        (item: ReadArticle): ArticleSyncItem => ({
          id: item.id,
          type: 'read',
          timestamp: item.readAt,
          data: { readAt: item.readAt },
        }),
      ),
      // Mentési sor elemek konvertálása - egyszerűsített típuskezelés
      ...saveQueueItems.map((item: SaveQueueItem): ArticleSyncItem => {
        if (item.type === 'article') {
          return {
            id: item.id,
            type: 'save',
            timestamp: item.timestamp,
            data: { article: item.data as unknown as ArticleData },
          };
        } else {
          // preference
          return {
            id: item.id,
            type: 'preference',
            timestamp: item.timestamp,
            data: { preference: item.data as unknown as UserPreferences },
          };
        }
      }),
    ];
    return {
      articlesToSync,
      unsyncedCount: unsyncedReadArticles.length,
      saveQueueCount: saveQueueItems.length,
    };
  }

  private async applyServerChanges(changes: SyncChanges | null): Promise<void> {
    if (!changes) return;

    // Új mentett cikkek kezelése
    if (changes.savedArticles) {
      await this.processSavedArticles(changes.savedArticles);
    }

    // Távoli olvasottsági adatok kezelése
    if (changes.readArticles) {
      await this.processRemoteReadArticles(changes.readArticles);
    }

    // Felhasználói beállítások frissítése
    if (changes.userPreferences) {
      this.processUserPreferences(changes.userPreferences);
    }
  }

  // Mentési sor feldolgozása
  private async processSaveQueue(): Promise<SaveQueueItem[]> {
    // TODO: Mentési sor feldolgozás implementálása
    return [];
  }

  // Mentett cikkek szinkronizálása
  private async processSavedArticles(articles: Article[]): Promise<void> {
    // TODO: Távoli mentett cikkek integrálása
    console.log(`Feldolgozandó mentett cikkek száma: ${articles.length}`);
  }

  // Távoli olvasottsági adatok feldolgozása
  private async processRemoteReadArticles(articles: ReadArticle[]): Promise<void> {
    // TODO: Más eszközön olvasott cikkek kezelése
    console.log(`Feldolgozandó olvasottsági adatok száma: ${articles.length}`);
  }

  // Felhasználói beállítások frissítése
  private processUserPreferences(preferences: UserPreferences): void {
    // TODO: Preferenciák frissítése
    const lastUpdated = preferences.lastUpdated ?? Date.now();
    console.log(`Last updated: ${lastUpdated}`);
  }

  // Bejövő változások számolása
  private countReceivedItems(changes: SyncChanges | null): number {
    if (!changes) return 0;
    let count = 0;
    if (changes.savedArticles) count += changes.savedArticles.length;
    if (changes.readArticles) count += changes.readArticles.length;
    if (changes.userPreferences) count += 1;
    return count;
  }

  // Szinkronizációs statisztikák mentése
  private async saveSyncStats(stats: Partial<SyncStats>): Promise<void> {
    const currentStatsStr = await this.dataManager.getItem<string>(SyncService.SYNC_STATS_KEY);
    const currentStats = currentStatsStr ? JSON.parse(currentStatsStr) : {};
    await this.dataManager.setItem(
      SyncService.SYNC_STATS_KEY,
      JSON.stringify({
        ...currentStats,
        ...stats,
      }),
    );
  }

  // Eszközazonosító lekérése
  private async getDeviceId(): Promise<string> {
    let deviceId = await this.dataManager.getItem<string>(SyncService.DEVICE_ID_KEY); // Módosítva
    if (!deviceId) {
      deviceId = crypto.randomUUID();
      await this.dataManager.setItem(SyncService.DEVICE_ID_KEY, deviceId); // Módosítva
    }
    return deviceId;
  }

  // API válaszok átalakítása belső formátumra
  private convertApiChangesToSyncChanges(apiChanges: SyncPayloadChanges): SyncChanges | null {
    if (!apiChanges) return null;

    const changes: SyncChanges = {};

    // Mentett cikkek átalakítása
    this.processSavedArticlesChanges(apiChanges, changes);

    // Olvasott cikkek átalakítása
    this.processReadArticlesChanges(apiChanges, changes);

    // Felhasználói beállítások átalakítása
    this.processUserPreferencesChanges(apiChanges, changes);

    // Ha nincs egyetlen változás sem, null-t adunk vissza
    if (!changes.savedArticles && !changes.readArticles && !changes.userPreferences) {
      return null;
    }

    return changes;
  }

  // Segéd metódusok a komplex függvény egyszerűsítéséhez
  private processSavedArticlesChanges(apiChanges: SyncPayloadChanges, changes: SyncChanges): void {
    if (apiChanges.savedArticles && apiChanges.savedArticles.length > 0) {
      changes.savedArticles = apiChanges.savedArticles
        .map((item) => {
          const articleData = item.data?.article;
          if (!articleData) return null;

          return {
            ...articleData,
            savedAt: item.timestamp,
          } as Article;
        })
        .filter(Boolean) as Article[];
    }
  }

  private processReadArticlesChanges(apiChanges: SyncPayloadChanges, changes: SyncChanges): void {
    if (apiChanges.readArticles && apiChanges.readArticles.length > 0) {
      changes.readArticles = apiChanges.readArticles
        .map((item) => ({
          id: item.id,
          readAt: item.data?.readAt || item.timestamp,
          deviceId: item.data ? undefined : this.getDeviceId(),
        }))
        .filter((item) => item.readAt > 0) as ReadArticle[];
    }
  }

  private processUserPreferencesChanges(
    apiChanges: SyncPayloadChanges,
    changes: SyncChanges,
  ): void {
    if (!apiChanges.userPreferences) return;

    const prefItem = apiChanges.userPreferences;
    const prefData = prefItem.data?.preference;

    if (prefData && typeof prefData === 'object') {
      changes.userPreferences = this.createDefaultUserPreferences(prefItem.timestamp);
      this.applyPreferenceValue(prefData, changes.userPreferences);
    }
  }

  private createDefaultUserPreferences(timestamp: number): UserPreferences {
    return {
      id: 'default-preferences',
      type: 'default',
      value: {},
      updatedAt: Date.now(),
      categories: [],
      sources: [],
      fontSize: 14,
      darkMode: false,
      notificationsEnabled: true,
      lastUpdated: Date.now(),
    };
  }

  private applyPreferenceValue(
    prefData: { type: string; value: unknown },
    preferences: UserPreferences,
  ): void {
    const prefValue = prefData.value;

    switch (prefData.type) {
      case 'categories':
        if (Array.isArray(prefValue)) {
          preferences.categories = prefValue;
        }
        break;
      case 'sources':
        if (Array.isArray(prefValue)) {
          preferences.sources = prefValue;
        }
        break;
      case 'fontSize':
        if (typeof prefValue === 'number') {
          preferences.fontSize = prefValue;
        }
        break;
      case 'darkMode':
        if (typeof prefValue === 'boolean') {
          preferences.darkMode = prefValue;
        }
        break;
      case 'notificationsEnabled':
        if (typeof prefValue === 'boolean') {
          preferences.notificationsEnabled = prefValue;
        }
        break;
    }
  }

  // Részletes hibaüzenetek lekérése az API válasz alapján
  private getDetailedErrorMessage(apiResponse: ApiResponse<unknown>): string {
    console.log('[SyncService] API Response error details:', apiResponse.error);
    
    if (!apiResponse.error) {
      return 'Ismeretlen hiba történt a szinkronizáció során';
    }

    // Például: "Network Error", "Timeout", stb. kezelése
    if (typeof apiResponse.error === 'string') {
      return `Hálózati hiba: ${apiResponse.error}`;
    }

    // Objektum típusú hibaüzenet kezelése
    if (typeof apiResponse.error === 'object' && apiResponse.error !== null) {
      const errorObj = apiResponse.error as { message?: string; code?: number; status?: number };
      
      // ✅ JAVÍTÁS: Részletesebb hibaüzenet
      if (errorObj.status) {
        return `HTTP ${errorObj.status}: ${errorObj.message || 'Szerver hiba'}`;
      }
      if (errorObj.code) {
        return `Hiba (${errorObj.code}): ${errorObj.message || 'Ismeretlen hiba'}`;
      }
      if (errorObj.message) {
        return `Hiba: ${errorObj.message}`;
      }
      
      // Ha nincs specifikus mező, de van error objektum
      return `Hiba: ${JSON.stringify(errorObj)}`;
    }

    return 'Ismeretlen hiba történt a szinkronizáció során';
  }
}
