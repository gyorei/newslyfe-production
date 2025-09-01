
// src\utils\datamanager\localStorage\localStorage.ts

import { LocalStorageData, LocalStorageOptions } from './types';

/**
 * Közvetlen localStorage elérést biztosító adapter
 * Egyszerű, könnyen használható interfész kis adatok tárolására
 */
export class LocalStorageAdapter {
  // Áthelyezve a StorageManager osztályból
  private LOCAL_STORAGE_KEY = 'news-app-state';
  // Áthelyezve a StorageManager osztályból
  private saveDebounceTimers: Record<string, NodeJS.Timeout> = {};
  // Kvóta kezelés konstansok
  private readonly STORAGE_QUOTA_SOFT_LIMIT = 5 * 1024 * 1024; // 5MB soft limit

  /**
   * Típusellenőrző segédfüggvény a LocalStorageData validálásához
   * Ellenőrzi, hogy a kapott érték megfelel-e a Partial<LocalStorageData> típusnak
   */
  private isLocalStorageData(value: unknown): value is Partial<LocalStorageData> {
    if (typeof value !== 'object' || value === null) return false;

    // Részletesebb validáció
    const obj = value as Record<string, unknown>;

    // Ellenőrizzük az alapvető mezőket
    if (obj.version !== undefined && typeof obj.version !== 'string') return false;
    if (obj.timestamp !== undefined && typeof obj.timestamp !== 'number') return false;
    if (obj.tabs !== undefined && typeof obj.tabs !== 'object') return false;
    if (obj.ui !== undefined && typeof obj.ui !== 'object') return false;
    if (obj.devicePreferences !== undefined && typeof obj.devicePreferences !== 'object')
      return false;
    if (obj.savedArticles !== undefined && !Array.isArray(obj.savedArticles)) return false;

    return true;
  }

  /**
   * localStorage használat becslése
   */
  private estimateStorageUsage(): number {
    let total = 0;
    try {
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key) {
          const value = localStorage.getItem(key) || '';
          // Pontosabb becslés UTF-16 karakterekre
          total += (key.length + value.length) * 2;
        }
      }
    } catch (error) {
      console.warn('Hiba a localStorage méret becslése során:', error);
    }
    return total;
  }

  /**
   * Lejárt elemek törlése
   */
  private cleanupExpiredItems(): void {
    const now = Date.now();
    const keysToRemove: string[] = [];

    try {
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (!key) continue;

        try {
          const item = localStorage.getItem(key);
          if (!item) continue;

          const parsed = JSON.parse(item);
          if (parsed.expiry && parsed.expiry < now) {
            keysToRemove.push(key);
          }
        } catch {
          // JSON parse hiba esetén is töröljük a hibás elemet
          keysToRemove.push(key);
        }
      }

      keysToRemove.forEach((key) => {
        localStorage.removeItem(key);
        console.debug(`Lejárt elem törölve: ${key}`);
      });
    } catch (error) {
      console.warn('Hiba a lejárt elemek törlése során:', error);
    }
  }

  /**
   * Kvóta túllépés kezelése
   */
  private handleQuotaExceeded(): void {
    console.warn('localStorage kvóta elérve, kritikus elemek törlése...');

    // 1. Lejárt elemek törlése
    this.cleanupExpiredItems();

    // 2. Nem kritikus namespace-ek törlése
    const nonCriticalNamespaces = ['temp', 'cache', 'forms'];
    for (const namespace of nonCriticalNamespaces) {
      this.clear(namespace);
    }
  }

  async get<T>(key: string, options: LocalStorageOptions = {}): Promise<T | null> {
    const fullKey = options.namespace ? `${options.namespace}:${key}` : key;
    try {
      // Ha speciális appState kulcsot használnak
      if (key === 'appState') {
        return this.loadLocalState() as unknown as T;
      }

      const item = localStorage.getItem(fullKey);

      if (!item) {
        return null;
      }

      // Adatok deszerializálása
      try {
        const { value, expiry } = JSON.parse(item);

        // Ha van lejárati idő és az már elmúlt, töröljük az elemet
        if (expiry && Date.now() > expiry) {
          console.warn(`LocalStorage: Lejárt elem törölve a '${fullKey}' kulcsnál.`);
          localStorage.removeItem(fullKey);
          return null;
        }

        return value as T;
      } catch (parseError) {
        console.error(`LocalStorage JSON.parse hiba a '${fullKey}' kulcsnál:`, parseError);
        console.error('Hibás adat string:', item);
        // Hibás elem automatikus törlése
        try {
          localStorage.removeItem(fullKey);
          console.warn(`LocalStorage: Hibás elem automatikusan törölve a '${fullKey}' kulcsnál.`);
        } catch (removeError) {
          console.error(`LocalStorage: Hiba a hibás elem törlése közben:`, removeError);
        }
        return null;
      }
    } catch (error) {
      console.error(`LocalStorage olvasási hiba a '${fullKey}' kulcsnál:`, error);
      return null;
    }
  }

  async set<T>(key: string, value: T, options: LocalStorageOptions = {}): Promise<boolean> {
    try {
      // Ha az appState-et mentjük
      if (key === 'appState') {
        // Típusellenőrzés a biztonságos konverzió előtt
        if (!this.isLocalStorageData(value)) {
          console.error('Érvénytelen adat típus a localStorage-ben:', value);
          return false;
        }
        return this.saveLocalState(value as Partial<LocalStorageData>);
      }

      const fullKey = options.namespace ? `${options.namespace}:${key}` : key;

      // Ha van lejárati idő, azt is mentsük el
      const item = {
        value,
        ...(options.expiry ? { expiry: Date.now() + options.expiry * 1000 } : {}),
      };

      const serializedData = JSON.stringify(item);

      // Kvóta ellenőrzés a mentés előtt
      if (this.estimateStorageUsage() + serializedData.length > this.STORAGE_QUOTA_SOFT_LIMIT) {
        this.cleanupExpiredItems();
      }

      try {
        localStorage.setItem(fullKey, serializedData);
        return true;
      } catch (storageError) {
        // Kvóta túllépés kezelése
        if (storageError instanceof DOMException && storageError.name === 'QuotaExceededError') {
          this.handleQuotaExceeded();
          // Újrapróbálkozás
          try {
            localStorage.setItem(fullKey, serializedData);
            return true;
          } catch (retryError) {
            console.error('LocalStorage mentés sikertelen még a tisztítás után is:', retryError);
            return false;
          }
        } else {
          throw storageError;
        }
      }
    } catch (error) {
      console.error('LocalStorage írási hiba:', error);
      return false;
    }
  }

  async delete(key: string, options: LocalStorageOptions = {}): Promise<boolean> {
    try {
      const fullKey = options.namespace ? `${options.namespace}:${key}` : key;
      localStorage.removeItem(fullKey);
      return true;
    } catch (error) {
      console.error('LocalStorage törlési hiba:', error);
      return false;
    }
  }

  async clear(namespace?: string): Promise<boolean> {
    try {
      if (namespace) {
        // Csak az adott namespace elemeit töröljük
        const prefix = `${namespace}:`;
        Object.keys(localStorage).forEach((key) => {
          if (key.startsWith(prefix)) {
            localStorage.removeItem(key);
          }
        });
      } else {
        // Mindent törlünk
        localStorage.clear();
      }
      return true;
    } catch (error) {
      console.error('LocalStorage tisztítási hiba:', error);
      return false;
    }
  }

  /**
   * Alkalmazás állapot mentése localStorage-ba
   * Áthelyezve a StorageManager osztályból
   */
  async saveLocalState(partialState: Partial<LocalStorageData>): Promise<boolean> {
    try {
      const currentState = (await this.loadLocalState()) || this.getDefaultState();
      const newState: LocalStorageData = {
        ...(currentState || this.getDefaultState()),
        ...partialState,
        timestamp: Date.now(),
        version: '2.0', // Ezt a getDefaultState-ből is vehetné, vagy konstansként
      };

      localStorage.setItem(this.LOCAL_STORAGE_KEY, JSON.stringify(newState));
      return true;
    } catch (error) {
      console.error('Helyi mentési hiba:', error);
      return false;
    }
  }

  /**
   * Alkalmazás állapot betöltése localStorage-ból
   * Áthelyezve a StorageManager osztályból
   */
  async loadLocalState(): Promise<LocalStorageData | null> {
    try {
      const data = localStorage.getItem(this.LOCAL_STORAGE_KEY);
      if (!data) {
        return null;
      }
      try {
        return JSON.parse(data);
      } catch (parseError) {
        console.error(
          `Helyi állapot (appState) JSON.parse hiba a '${this.LOCAL_STORAGE_KEY}' kulcsnál:`,
          parseError,
        );
        console.error('Hibás appState adat string:', data);
        // Hibás appState automatikus törlése:
        try {
          localStorage.removeItem(this.LOCAL_STORAGE_KEY);
          console.warn(
            `LocalStorage: Hibás appState automatikusan törölve a '${this.LOCAL_STORAGE_KEY}' kulcsnál a parse hiba miatt.`,
          );
        } catch (removeError) {
          console.error(
            `LocalStorage: Hiba történt a hibás appState ('${this.LOCAL_STORAGE_KEY}') törlése közben:`,
            removeError,
          );
        }
        return null;
      }
    } catch (error) {
      console.error(
        `Helyi állapot (appState) általános betöltési hiba a '${this.LOCAL_STORAGE_KEY}' kulcsnál:`,
        error,
      );
      return null;
    }
  }

  /**
   * Összes debounce timer törlése (cleanup)
   */
  public clearAllTimers(): void {
    Object.values(this.saveDebounceTimers).forEach((timer) => {
      clearTimeout(timer);
    });
    this.saveDebounceTimers = {};
  }

  /**
   * Alapértelmezett állapot létrehozása
   * Áthelyezve a StorageManager osztályból
   */
  private getDefaultState(): LocalStorageData {
    return {
      version: '2.0',
      timestamp: Date.now(),
      tabs: {
        activeId: 'default',
        definitions: [
          {
            id: 'default',
            title: 'Főoldal',
            mode: 'feed',
          },
        ],
      },
      ui: {
        panelStates: {
          left: true,
          right: false,
        },
        utilityMode: 'standard',
      },
      devicePreferences: {
        fontSize: 16,
        darkMode: window.matchMedia('(prefers-color-scheme: dark)').matches,
      },
    };
  }

  /**
   * Eszköz azonosító lekérése vagy generálása
   */
  async getDeviceId(): Promise<string> {
    try {
      let deviceId = localStorage.getItem('device-id');

      if (!deviceId) {
        // Új eszköz azonosító generálása
        deviceId = 'device-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
        localStorage.setItem('device-id', deviceId);
        console.log('[LocalStorageAdapter] Új eszköz azonosító generálva:', deviceId);
      }

      return deviceId;
    } catch (error) {
      console.error('Hiba az eszköz azonosító kezelésekor:', error);
      // Fallback azonosító hibák esetén
      return 'fallback-device-' + Date.now();
    }
  }
}
