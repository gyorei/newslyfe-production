/**
 * Migráció segédfüggvények a News alkalmazás storage rendszeréhez
 */
import { logger } from '../utils/logger';

// Típusdefiníciók a migrációs segédfüggvényekhez
type DeepRecord = Record<string, unknown> | { [key: string]: DeepRecord };
type StorageData = DeepRecord;

/**
 * Segédfüggvények a storage migrációkhoz
 */
export const migrateHelpers = {
  /**
   * Tömböket egyesít, duplikációk nélkül
   */
  mergeArrays<T>(arr1: T[], arr2: T[]): T[] {
    return [...new Set([...arr1, ...arr2])];
  },

  /**
   * Objektumokat egyesít rekurzívan
   */
  deepMergeObjects(target: DeepRecord, source: DeepRecord): DeepRecord {
    // Ha a forrás vagy cél nem objektum, a forrás értékét adjuk vissza
    if (typeof source !== 'object' || source === null) {
      return source as DeepRecord;
    }
    if (typeof target !== 'object' || target === null) {
      return { ...source };
    }

    // Mindkettő objektum, egyesítés
    const result = { ...target };
    Object.keys(source).forEach((key) => {
      if (key in target) {
        result[key] = this.deepMergeObjects(target[key] as DeepRecord, source[key] as DeepRecord);
      } else {
        result[key] = source[key];
      }
    });
    return result;
  },

  /**
   * Ellenőrzi, hogy egy tömb minden eleme megfelel-e egy sémának
   */
  validateArrayItems<T>(arr: T[], validator: (item: T) => boolean): boolean {
    if (!Array.isArray(arr)) return false;
    return arr.every(validator);
  },

  /**
   * Dark mode detektálása régi adatokból vagy rendszer preferenciából
   */
  detectDarkMode(oldState: StorageData | null): boolean {
    // Először ellenőrizzük a régi beállításokat
    if (oldState && typeof oldState.darkMode === 'boolean') {
      return oldState.darkMode as boolean;
    }
    if (oldState && oldState.theme === 'dark') {
      return true;
    }

    // Ha nem volt explicit beállítás, akkor a rendszer preferenciákat használjuk
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  },

  /**
   * Biztonságos JSON parse
   */
  safeJsonParse<T = unknown>(jsonString: string | null, fallback: T | null = null): T | null {
    if (!jsonString) return fallback;

    try {
      return JSON.parse(jsonString) as T;
    } catch (error) {
      logger.warn('JSON parse sikertelen:', error);
      return fallback;
    }
  },

  /**
   * Indexeddb objektumtároló létezésének ellenőrzése
   */
  async checkObjectStoreExists(db: IDBDatabase, storeName: string): Promise<boolean> {
    return db.objectStoreNames.contains(storeName);
  },

  /**
   * Index létezésének ellenőrzése egy objektumtárolóban
   */
  async checkIndexExists(db: IDBDatabase, storeName: string, indexName: string): Promise<boolean> {
    const transaction = db.transaction(storeName, 'readonly');
    const objectStore = transaction.objectStore(storeName);
    return objectStore.indexNames.contains(indexName);
  },
};

/**
 * Régi LocalStorage kulcsok törlése
 */
export async function cleanupOldLocalStorageKeys(keyPatterns: (RegExp | string)[]): Promise<void> {
  try {
    // Az összes localStorage kulcs összegyűjtése
    const allKeys: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key) allKeys.push(key);
    }

    // A mintáknak megfelelő kulcsok szűrése
    const keysToRemove = allKeys.filter((key) => {
      return keyPatterns.some((pattern) => {
        if (pattern instanceof RegExp) {
          return pattern.test(key);
        }
        return key === pattern || key.startsWith(pattern);
      });
    });

    // Kulcsok törlése
    keysToRemove.forEach((key) => {
      localStorage.removeItem(key);
      logger.debug(`Régi LocalStorage kulcs törölve: ${key}`);
    });

    logger.info(`${keysToRemove.length} régi LocalStorage kulcs törölve`);
  } catch (error) {
    logger.warn('LocalStorage tisztítási hiba:', error);
  }
}

/**
 * Adatok konvertálása egyik objektum tárolóból a másikba
 */
export async function migrateObjectStore<
  T extends Record<string, unknown>,
  U extends Record<string, unknown>,
>(
  db: IDBDatabase,
  sourceStore: string,
  targetStore: string,
  transformFn: (oldItem: T) => U,
): Promise<number> {
  return new Promise((resolve, reject) => {
    if (!db.objectStoreNames.contains(sourceStore) || !db.objectStoreNames.contains(targetStore)) {
      return resolve(0);
    }

    const transaction = db.transaction([sourceStore, targetStore], 'readwrite');
    const source = transaction.objectStore(sourceStore);
    const target = transaction.objectStore(targetStore);
    let count = 0;

    const sourceRequest = source.openCursor();

    sourceRequest.onsuccess = (event) => {
      const cursor = (event.target as IDBRequest<IDBCursorWithValue | null>).result;

      if (cursor) {
        try {
          // Átalakítás és mentés az új tárolóba
          const transformedItem = transformFn(cursor.value as T);
          target.put(transformedItem);
          count++;
        } catch (err) {
          logger.warn(`Hiba az ${cursor.key} konvertálása során:`, err);
        }

        cursor.continue();
      } else {
        resolve(count);
      }
    };

    sourceRequest.onerror = () => reject(sourceRequest.error);
  });
}
