/**
 * StorageAdapter osztály amely összeköti a DataManager rendszert az IndexedDB szolgáltatással
 */
import { StorageOptions } from './types';
import { IndexedDBService } from './indexedDBService';
import { IndexedDBOptions, TabContentData } from './indexedDBTypes'; // TabContentData importálása

/**
 * Storage adapter osztály a perzisztens adattároláshoz
 * Ez az osztály használja az IndexedDBService-t a tényleges adattároláshoz
 */
export class StorageAdapter {
  private indexedDB: IndexedDBService;
  private initialized: boolean = false;
  private namespace: string = '';

  /**
   * StorageAdapter konstruktor
   * @param options Tárolási beállítások
   */
  constructor(options?: StorageOptions) {
    const indexedDBOptions: IndexedDBOptions = {
      dbName: options?.namespace ? `news-${options.namespace}` : 'news-app-db',
    };

    this.indexedDB = new IndexedDBService(indexedDBOptions);

    if (options?.namespace) {
      this.namespace = options.namespace;
    }
  }

  /**
   * Inicializálja a tároló adaptert
   */
  async initialize(): Promise<void> {
    if (!this.initialized) {
      await this.indexedDB.initialize();
      this.initialized = true;
    }
  }

  /**
   * Érték mentése a tárolóba
   * @param key Kulcs
   * @param value Érték
   * @param options Opcionális beállítások, mint pl. storeName
   */
  async set<T>(key: string, value: T, options?: { storeName?: string }): Promise<boolean> {
    await this.initialize();

    const namespaceKey = this.getNamespacedKey(key);

    // Ha van megadva storeName, akkor használjuk azt a megfelelő adattároló eléréséhez
    if (options?.storeName) {
      try {
        // Először ellenőrizzük, hogy az adatbázis elérhető-e
        const database = this.indexedDB.getDatabase();
        if (!database) {
          console.error(
            `Database not available for store: ${options.storeName}. Falling back to keyValueStore.`,
          );
          await this.indexedDB.setValue(namespaceKey, value);
          return true;
        }

        // Próbáljuk létrehozni a tranzakciót
        const transaction = database.transaction([options.storeName], 'readwrite');
        if (!transaction) {
          console.error(
            `Transaction could not be created for store: ${options.storeName}. Falling back to keyValueStore.`,
          );
          await this.indexedDB.setValue(namespaceKey, value);
          return true;
        }

        const store = transaction.objectStore(options.storeName);
        return new Promise<boolean>((resolve, reject) => {
          const request = store.put(value, key); // put használata az add helyett (overwrite engedélyezése)

          request.onsuccess = () => resolve(true);
          request.onerror = () => {
            console.error(`Error writing to store ${options.storeName}:`, request.error);
            reject(request.error);
          };
        });
      } catch (error) {
        console.error(`Error accessing store ${options.storeName}:`, error);
        // Fallback to default keyValueStore
        try {
          await this.indexedDB.setValue(namespaceKey, value);
          return true;
        } catch (fallbackError) {
          console.error(
            `Fallback to keyValueStore also failed for key ${namespaceKey}:`,
            fallbackError,
          );
          return false;
        }
      }
    }

    // Alapértelmezett eset: kulcs-érték tárolót használunk
    try {
      await this.indexedDB.setValue(namespaceKey, value);
      return true;
    } catch (error) {
      console.error(`Error setting value for key ${namespaceKey} in StorageAdapter:`, error);
      return false;
    }
  }

  /**
   * Érték lekérdezése a tárolóból
   * @param key Kulcs
   * @param options Opcionális beállítások, mint pl. storeName
   * @returns Az érték vagy null, ha nem található
   */
  async get<T>(key: string, options?: { storeName?: string }): Promise<T | null> {
    await this.initialize();

    const namespaceKey = this.getNamespacedKey(key);

    // Ha van megadva storeName, akkor használjuk azt a megfelelő adattároló eléréséhez
    if (options?.storeName) {
      try {
        // Először ellenőrizzük, hogy az adatbázis elérhető-e
        const database = this.indexedDB.getDatabase();
        if (!database) {
          console.error(
            `Database not available for store: ${options.storeName}. Falling back to keyValueStore.`,
          );
          return this.indexedDB.getValue(namespaceKey) as Promise<T | null>;
        }

        // Próbáljuk létrehozni a tranzakciót
        const transaction = database.transaction([options.storeName], 'readonly');
        if (!transaction) {
          console.error(
            `Transaction could not be created for store: ${options.storeName}. Falling back to keyValueStore.`,
          );
          return this.indexedDB.getValue(namespaceKey) as Promise<T | null>;
        }

        const store = transaction.objectStore(options.storeName);
        return new Promise<T | null>((resolve, reject) => {
          const request = store.get(key);

          request.onsuccess = () => resolve(request.result || null);
          request.onerror = () => {
            console.error(`Error reading from store ${options.storeName}:`, request.error);
            reject(request.error);
          };
        });
      } catch (error) {
        console.error(`Error accessing store ${options.storeName}:`, error);
        // Fallback to default keyValueStore
        try {
          return this.indexedDB.getValue(namespaceKey) as Promise<T | null>;
        } catch (fallbackError) {
          console.error(
            `Fallback to keyValueStore also failed for key ${namespaceKey}:`,
            fallbackError,
          );
          return null;
        }
      }
    }

    // Alapértelmezett eset: kulcs-érték tárolót használunk
    try {
      return this.indexedDB.getValue(namespaceKey) as Promise<T | null>;
    } catch (error) {
      console.error(`Error getting value for key ${namespaceKey}:`, error);
      return null;
    }
  }

  /**
   * Érték eltávolítása a tárolóból
   * @param key Kulcs
   */
  async delete(key: string): Promise<boolean> {
    await this.initialize();

    const namespaceKey = this.getNamespacedKey(key);
    try {
      await this.indexedDB.removeValue(namespaceKey);
      return true;
    } catch (error) {
      console.error(`Error removing value for key ${namespaceKey} in StorageAdapter:`, error);
      return false;
    }
  }

  /**
   * Összes érték lekérdezése egy előtaggal
   * @param prefix Előtag
   * @returns Kulcs-érték párok
   */
  async getAll<T>(_prefix: string): Promise<Record<string, T>> {
    // prefix átnevezve _prefix-re
    throw new Error('Not implemented yet. Need to enhance IndexedDBService to support this.');
  }

  /**
   * ÚJ: Összes tároló kulcs lekérése (cleanup-hoz szükséges)
   */
  async getAllKeys(): Promise<string[]> {
    await this.initialize();
    try {
      return await this.indexedDB.getAllKeys();
    } catch (error) {
      console.error('Error getting all keys from StorageAdapter:', error);
      return [];
    }
  }

  /**
   * Ellenőrzi, hogy egy kulcs létezik-e a tárolóban
   * @param key Kulcs
   * @returns Igaz, ha létezik
   */
  async has(key: string): Promise<boolean> {
    const value = await this.get(key);
    return value !== null;
  }

  /**
   * Cikk megjelölése olvasottként
   * @param articleId Cikk azonosító
   * @param deviceId Eszköz azonosító
   */
  async markArticleAsRead(articleId: string, deviceId: string): Promise<void> {
    await this.initialize();
    return this.indexedDB.markArticleAsRead(articleId, deviceId);
  }

  /**
   * Cikkek olvasottsági állapotának lekérdezése
   * @param articleIds Cikk azonosítók
   * @returns Olvasottsági állapot kulcs-érték párok
   */
  async getReadStatus(articleIds: string[]): Promise<Record<string, boolean>> {
    await this.initialize();
    return this.indexedDB.getReadStatus(articleIds);
  }

  /**
   * Tab tartalom mentése
   * @param tabId Tab azonosító
   * @param content Tab tartalom
   */
  async saveTabContent(tabId: string, content: TabContentData): Promise<void> {
    // any helyett TabContentData
    await this.initialize();
    return this.indexedDB.saveTabContent(tabId, content);
  }

  /**
   * Tab tartalom lekérdezése
   * @param tabId Tab azonosító
   * @returns Tab tartalom vagy null
   */
  async getTabContent(tabId: string): Promise<TabContentData | null> {
    // any helyett TabContentData
    await this.initialize();
    return this.indexedDB.getTabContent(tabId);
  }

  /**
   * Névtérrel ellátott kulcs előállítása
   * @param key Eredeti kulcs
   * @returns Névtérrel ellátott kulcs
   */
  private getNamespacedKey(key: string): string {
    if (!this.namespace) {
      return key;
    }
    return `${this.namespace}:${key}`;
  }

  public getIndexedDBService(): IndexedDBService {
    if (!this.initialized) {
      // Fontos lehet itt hibát dobni, vagy biztosítani, hogy az initialize() lefutott
      // Egyelőre feltételezzük, hogy az initialize() a DataManager.initialize()-ban hívódik meg előtte.
      console.warn(
        'StorageAdapter not fully initialized when getIndexedDBService was called. Ensure DataManager.initialize() has run.',
      );
    }
    return this.indexedDB;
  }
}
