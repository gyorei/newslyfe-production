/**
 * IndexedDB kezelő implementáció az új DataManager architektúrához
 */
// import { StorageOptions } from './types'; // Eltávolítva, mivel nincs használva
import {
  TabContentData,
  ArticleData,
  UserPreference,
  StorageStatistics,
  IndexedDBOptions,
} from './indexedDBTypes';

/**
 * IndexedDB adatbáziskezelő szolgáltatás a perzisztens tároláshoz
 */
export class IndexedDBService {
  private DB_NAME: string;
  private DB_VERSION: number;
  private db: IDBDatabase | null = null;

  constructor(options?: IndexedDBOptions) {
    this.DB_NAME = options?.dbName || 'news-app-db';
    // Növeljük az adatbázis verziószámát, hogy az onupgradeneeded lefusson
    // és létrehozza a hiányzó 'userPreferences' object store-t.
    // Ha az előző verzió pl. 1 volt, most legyen 2.
    this.DB_VERSION = options?.dbVersion || 2;
  }

  /**
   * IndexedDB inicializálása
   */
  async initialize(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.DB_NAME, this.DB_VERSION);

      request.onupgradeneeded = (evt) => {
        const db = (evt.target as IDBOpenDBRequest).result;

        // Olvasott cikkek tároló
        if (!db.objectStoreNames.contains('readArticles')) {
          const readStore = db.createObjectStore('readArticles', { keyPath: 'id' });
          // Szinkronizációs státusz - 0 = nem szinkronizált, 1 = szinkronizált
          readStore.createIndex('syncStatus', 'synced', { unique: false });
        }

        // Tab tartalmak tároló
        if (!db.objectStoreNames.contains('tabContents')) {
          db.createObjectStore('tabContents', { keyPath: 'tabId' });
        }

        // Mentési sor tároló (fallback)
        if (!db.objectStoreNames.contains('saveQueue')) {
          const queueStore = db.createObjectStore('saveQueue', { keyPath: 'timestamp' });
          queueStore.createIndex('type', 'type', { unique: false });
        }

        // Általános kulcs-érték adattároló
        if (!db.objectStoreNames.contains('keyValueStore')) {
          db.createObjectStore('keyValueStore', { keyPath: 'key' });
        }

        // Felhasználói beállítások tároló - HIÁNYZOTT!
        if (!db.objectStoreNames.contains('userPreferences')) {
          db.createObjectStore('userPreferences', { keyPath: 'id' });
        }
      };

      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };

      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Cikk megjelölése olvasottként
   */
  async markArticleAsRead(articleId: string, deviceId: string): Promise<void> {
    if (!this.db) await this.initialize();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['readArticles'], 'readwrite');
      const store = transaction.objectStore('readArticles');

      const request = store.put({
        id: articleId,
        readAt: Date.now(),
        deviceId: deviceId, // Paraméterként kapjuk
        synced: 0, // 0 = nincs szinkronizálva
      });

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Cikkek olvasottsági állapotának lekérdezése
   */
  async getReadStatus(articleIds: string[]): Promise<Record<string, boolean>> {
    if (!this.db) await this.initialize();

    const result: Record<string, boolean> = {};
    const promises = articleIds.map(
      (id) =>
        new Promise<void>((resolve) => {
          const transaction = this.db!.transaction(['readArticles'], 'readonly');
          const store = transaction.objectStore('readArticles');
          const request = store.get(id);

          request.onsuccess = () => {
            result[id] = !!request.result;
            resolve();
          };

          request.onerror = () => {
            result[id] = false;
            resolve();
          };
        }),
    );

    await Promise.all(promises);
    return result;
  }

  /**
   * Nem szinkronizált olvasott cikkek lekérdezése
   */
  async getUnsyncedReadArticles(): Promise<
    Array<{ id: string; readAt: number; deviceId: string }>
  > {
    if (!this.db) await this.initialize();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['readArticles'], 'readonly');
      const store = transaction.objectStore('readArticles');
      const index = store.index('syncStatus');
      // Módosítva: boolean helyett 0 értékre szűrünk
      const request = index.getAll(IDBKeyRange.only(0));

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Cikkek megjelölése szinkronizáltként
   */
  async markArticlesAsSynced(articleIds: string[]): Promise<void> {
    if (!this.db) await this.initialize();

    const transaction = this.db!.transaction(['readArticles'], 'readwrite');
    const store = transaction.objectStore('readArticles');

    const promises = articleIds.map(
      (id) =>
        new Promise<void>((resolve, reject) => {
          const getRequest = store.get(id);

          getRequest.onsuccess = () => {
            if (getRequest.result) {
              const article = getRequest.result;
              article.synced = 1; // 1 = szinkronizálva (boolean true helyett)
              const putRequest = store.put(article);

              putRequest.onsuccess = () => resolve();
              putRequest.onerror = () => reject(putRequest.error);
            } else {
              resolve();
            }
          };

          getRequest.onerror = () => reject(getRequest.error);
        }),
    );

    await Promise.all(promises);
  }

  /**
   * Tab tartalom mentése
   */
  async saveTabContent(tabId: string, content: TabContentData): Promise<void> {
    if (!this.db) await this.initialize();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['tabContents'], 'readwrite');
      const store = transaction.objectStore('tabContents');

      // Ne csomagoljuk be a content-et egy újabb objektumba
      // Helyette közvetlenül használjuk a tabId-t mint kulcsot és a content-et mint értéket
      console.log(`[IndexedDBService] Tab tartalom mentése: ${tabId}, tartalom:`, content);

      const request = store.put({
        tabId,
        ...content, // Kibontjuk a content mezőit, hogy közvetlenül a gyökérszinten legyenek
        timestamp: Date.now(),
      });

      request.onsuccess = () => {
        console.log(`[IndexedDBService] Tab tartalom sikeresen elmentve: ${tabId}`);
        resolve();
      };
      request.onerror = () => {
        console.error(`[IndexedDBService] Hiba a tab tartalom mentésekor: ${tabId}`, request.error);
        reject(request.error);
      };
    });
  }

  /**
   * Tab tartalom lekérése
   */
  async getTabContent(tabId: string): Promise<TabContentData | null> {
    // Guard: early return if tabId is falsy, avoid IndexedDB DataError
    if (!tabId) {
      console.warn(`[IndexedDBService] getTabContent called without tabId – skipping`);
      return null;
    }
    if (!this.db) await this.initialize();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['tabContents'], 'readonly');
      const store = transaction.objectStore('tabContents');
      const request = store.get(tabId);

      request.onsuccess = () => {
        console.log(`[IndexedDBService] Tab tartalom betöltése: ${tabId}`, request.result);

        // Nem a request.result?.content-et adjuk vissza, hanem a teljes objektumot
        // Eltávolítjuk a tabId mezőt, hogy csak a tartalom maradjon
        if (request.result) {
          const { tabId: _tabId, ...contentWithoutTabId } = request.result;
          resolve(contentWithoutTabId as TabContentData);
        } else {
          resolve(null);
        }
      };
      request.onerror = () => {
        console.error(
          `[IndexedDBService] Hiba a tab tartalom lekérésekor: ${tabId}`,
          request.error,
        );
        reject(request.error);
      };
    });
  }

  /**
   * Elem hozzáadása a mentési sorhoz (fallback online műveleteknél)
   */
  async addToSaveQueue(
    type: 'article' | 'preference',
    data: ArticleData | UserPreference,
  ): Promise<void> {
    if (!this.db) await this.initialize();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['saveQueue'], 'readwrite');
      const store = transaction.objectStore('saveQueue');

      const request = store.put({
        timestamp: Date.now(),
        type,
        data,
        attempts: 0,
      });

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Általános értékek mentése és lekérése
   */
  async setValue(key: string, value: unknown): Promise<void> {
    if (!this.db) await this.initialize();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['keyValueStore'], 'readwrite');
      const store = transaction.objectStore('keyValueStore');

      const request = store.put({
        key,
        value,
        timestamp: Date.now(),
      });

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Érték lekérdezése kulcs alapján
   */
  async getValue(key: string): Promise<unknown | null> {
    if (!this.db) await this.initialize();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['keyValueStore'], 'readonly');
      const store = transaction.objectStore('keyValueStore');
      const request = store.get(key);

      request.onsuccess = () => resolve(request.result?.value || null);
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Érték törlése kulcs alapján a keyValueStore-ból
   */
  async removeValue(key: string): Promise<void> {
    if (!this.db) await this.initialize();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['keyValueStore'], 'readwrite');
      const store = transaction.objectStore('keyValueStore');
      const request = store.delete(key);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Statisztikák lekérése az adatbázisról
   */
  async getStatistics(): Promise<StorageStatistics> {
    if (!this.db) await this.initialize();

    // JAVÍTOTT SZÁMOLÁS:
    const readArticleCount = await this.countObjects('readArticles'); // Elolvasott hírek
    const tabContentCount = await this.countObjects('tabContents'); // Tab tartalmak (valódi hírek!)
    const userPreferenceCount = await this.countObjects('userPreferences'); // Valódi beállítások
    const keyValueCount = await this.countObjects('keyValueStore'); // Általános kulcsok

    // TAB TARTALMAKBÓL hírek számának kiszámítása
    let totalArticleCount = 0;
    try {
      const transaction = this.db!.transaction(['tabContents'], 'readonly');
      const store = transaction.objectStore('tabContents');
      const getAllRequest = store.getAll();

      await new Promise<void>((resolve, reject) => {
        getAllRequest.onsuccess = () => {
          const tabContents = getAllRequest.result;
          tabContents.forEach((tab: { articles?: unknown[] }) => {
            if (tab.articles && Array.isArray(tab.articles)) {
              totalArticleCount += tab.articles.length;
            }
          });
          resolve();
        };
        getAllRequest.onerror = () => reject(getAllRequest.error);
      });
    } catch (error) {
      console.error('Hiba a hírek számolásánál:', error);
    }

    return {
      // KOMPATIBILITÁSI MEZŐK (régi kód számára):
      totalItems: totalArticleCount + tabContentCount + readArticleCount + userPreferenceCount,
      articles: totalArticleCount, // Régi: most valódi hírek száma
      tabs: tabContentCount, // Régi: tab tartalmak száma
      preferences: userPreferenceCount, // Régi: felhasználói beállítások
      lastUpdated: Date.now(),

      // ÚJ RÉSZLETES MEZŐK:
      articleCount: totalArticleCount, // Összes hír a tab tartalmakból
      tabContentCount: tabContentCount, // Tab tartalmak száma
      readArticleCount: readArticleCount, // Elolvasott hírek száma
      userPreferenceCount: userPreferenceCount, // Felhasználói beállítások
      keyValueCount: keyValueCount, // Általános kulcs-érték párok
      totalSize: 0, // Ezt majd ki kell számolni
    };
  }

  /**
   * Objektumok számának lekérése egy tárolóból
   */
  private async countObjects(storeName: string): Promise<number> {
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([storeName], 'readonly');
      const store = transaction.objectStore(storeName);
      const countRequest = store.count();

      countRequest.onsuccess = () => resolve(countRequest.result);
      countRequest.onerror = () => reject(countRequest.error);
    });
  }

  /**
   * IndexedDB adatbázispéldány lekérése
   * @returns Az IndexedDB adatbázis objektum
   */
  getDatabase(): IDBDatabase | null {
    return this.db;
  }

  /**
   * ÚJ: Összes kulcs lekérése a keyValueStore-ból (cleanup-hoz szükséges)
   */
  async getAllKeys(): Promise<string[]> {
    if (!this.db) await this.initialize();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['keyValueStore'], 'readonly');
      const store = transaction.objectStore('keyValueStore');
      const request = store.getAllKeys();

      request.onsuccess = () => {
        const keys = request.result as string[];
        resolve(keys);
      };
      request.onerror = () => {
        console.error('Error getting all keys from IndexedDB:', request.error);
        reject(request.error);
      };
    });
  }

  /**
   * DEBUG: Összes tab tartalom kulcsainak listázása
   */
  async debugListAllTabContents(): Promise<void> {
    if (!this.db) await this.initialize();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['tabContents'], 'readonly');
      const store = transaction.objectStore('tabContents');
      const request = store.getAllKeys();

      request.onsuccess = () => {
        console.log('🔍 [DEBUG] Összes tárolt tab kulcs:', request.result);

        // Összes adat lekérése részletes vizsgálathoz
        const getAllRequest = store.getAll();
        getAllRequest.onsuccess = () => {
          console.log('🔍 [DEBUG] Összes tab tartalom:', getAllRequest.result);
          console.log('🔍 [DEBUG] Tab tartalmak száma:', getAllRequest.result?.length || 0);

          // Első néhány elem részletes kiírása
          if (getAllRequest.result && getAllRequest.result.length > 0) {
            console.log('🔍 [DEBUG] Első tab tartalom mintája:', {
              tabId: getAllRequest.result[0].tabId,
              hasArticles: !!getAllRequest.result[0].articles,
              articleCount: getAllRequest.result[0].articles?.length || 0,
              timestamp: getAllRequest.result[0].timestamp,
            });
          }

          resolve();
        };
        getAllRequest.onerror = () => reject(getAllRequest.error);
      };
      request.onerror = () => reject(request.error);
    });
  }
}
