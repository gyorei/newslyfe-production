/*
 * useStorage.ts
 *
 * FŐ STORAGE HOOK A NEWS ALKALMAZÁSHOZ
 * -----------------------------------
 * Ez a hook biztosítja a teljes perzisztencia réteget a News app számára:
 *  - Tabok, cikkek, beállítások, cache, szinkronizáció kezelése
 *  - LocalStorage és IndexedDB támogatás
 *  - Memória cache a felhasználói beállításokhoz (UserPreference)
 *  - Tab tartalom mentése/betöltése, cikkek olvasottsága, mentése
 *  - Globális szinkronizációs állapot (SyncInfo) kezelése
 *  - Cache statisztikák, diagnosztika, cache invalidálás
 *
 * Főbb használati helyek:
 *  - App.tsx (globális storage state, sync, beállítások)
 *  - useTabStorage (tab tartalom, cache)
 *  - useArticleStorage (cikkek mentése, olvasottság)
 *  - Panel, egyéb komponensek (beállítások, cache, tab state)
 *
 * A hook minden fontosabb perzisztens adatfolyamot és cache-t ezen keresztül kezel a projektben.
 */
// A szoftver-fejlesztésben fontos alapelv
// a YAGNI (You Aren't Gonna Need It)
// - ne vezess be komplexitást, amíg nincs rá valódi igény.

/**
 * Fő storage hook a News alkalmazáshoz
 * ⚡ TELJESÍTMÉNY OPTIMALIZÁLÁS: Memória cache a UserPreference-ek számára
 */
import { useState, useEffect, useCallback, useMemo } from 'react';
import { DataManager, DataArea } from '../utils/datamanager/manager';
import { StorageConfig } from '../utils/datamanager/config';
import {
  LocalStorageData,
  TabDefinition,
  ReadArticle,
  SaveQueueItem,
} from '../utils/datamanager/types/storage';

import { SyncInfo, SyncOptions } from '../utils/datamanager/types/sync'; // SyncInfo-t innen importáljuk

import {
  ArticleData,
  UserPreference,
  TabContentData, // TabContentData importálása a helyes fájlból
} from '../utils/datamanager/storage/indexedDBTypes';

// import { v4 as uuidv4 } from 'uuid';

// Konstansok
const STORAGE_ADAPTER_NOT_FOUND_ERROR =
  '[useStorage] Nem található storageAdapter a DataManager-ben';

// ⚡ ÚJ: Memória cache UserPreference-ekhez
interface PreferenceCache {
  value: UserPreference;
  timestamp: number;
  ttl: number; // Cache élettartam milliszekundumban
}

// ⚡ Cache beállítások
const PREFERENCE_CACHE_TTL = 5 * 60 * 1000; // 5 perc cache élettartam
const PREFERENCE_CACHE_MAX_SIZE = 50; // Maximum 50 beállítás cache-elése

// ⚡ Globális memória cache Map
const preferenceCache = new Map<string, PreferenceCache>();

// ⚡ Cache statisztikák
const cacheStats = {
  hits: 0,
  misses: 0,
  saves: 0,
  evictions: 0,
};

// ✅ ÚJ: DataManager inicializálás singleton
let globalDataManagerInitialized = false;

// ✅ TELJESEN ÚJ: GLOBÁLIS SINGLETON MANAGER
class GlobalStorageManager {
  private static instance: GlobalStorageManager | null = null;
  private syncInfo: SyncInfo | null = null;
  private _isLoaded: boolean = false; // ✅ JAVÍTÁS: Átnevezve _isLoaded-ra
  private dataManager: DataManager | null = null; // ✅ JAVÍTÁS: DataManager típus
  private loadPromise: Promise<SyncInfo | null> | null = null;

  public static getInstance(): GlobalStorageManager {
    if (!GlobalStorageManager.instance) {
      GlobalStorageManager.instance = new GlobalStorageManager();
    }
    return GlobalStorageManager.instance;
  }

  public async getSyncInfo(dataManager: DataManager): Promise<SyncInfo | null> {
    // ✅ JAVÍTÁS: DataManager típus
    // ✅ Ha már betöltöttük, azonnal visszaadjuk
    if (this._isLoaded) {
      console.log('[GlobalStorageManager] Sync info már betöltve, cache visszaadása');
      return this.syncInfo;
    }

    // ✅ Ha már folyamatban van betöltés, várjuk meg
    if (this.loadPromise) {
      console.log('[GlobalStorageManager] Betöltés már folyamatban, várakozás...');
      return await this.loadPromise;
    }

    // ✅ Első betöltés
    console.log('[GlobalStorageManager] Sync info betöltése...');
    this.loadPromise = this._loadSyncInfo(dataManager);

    try {
      this.syncInfo = await this.loadPromise;
      this._isLoaded = true;
      console.log('[GlobalStorageManager] Sync info sikeresen betöltve:', this.syncInfo);
      return this.syncInfo;
    } catch (error) {
      console.error('[GlobalStorageManager] Sync info betöltési hiba:', error);
      this.loadPromise = null;
      throw error;
    }
  }

  private async _loadSyncInfo(dataManager: DataManager): Promise<SyncInfo | null> {
    // ✅ JAVÍTÁS: DataManager típus
    return await dataManager.getSyncInfo();
  }

  public updateSyncInfo(syncInfo: SyncInfo): void {
    this.syncInfo = syncInfo;
    console.log('[GlobalStorageManager] Sync info frissítve:', syncInfo);
  }

  // ✅ JAVÍTÁS: Public getter hozzáadása
  public get isLoaded(): boolean {
    return this._isLoaded;
  }

  // ✅ JAVÍTÁS: Public getter a syncInfo-hoz
  public get currentSyncInfo(): SyncInfo | null {
    return this.syncInfo;
  }
}

// ✅ GLOBÁLIS SINGLETON INSTANCE
const globalStorageManager = GlobalStorageManager.getInstance();

// ⚡ Cache helper függvények
const getCacheKey = (preferenceId: string) => `pref_${preferenceId}`;

const isCacheValid = (entry: PreferenceCache): boolean => {
  return Date.now() - entry.timestamp < entry.ttl;
};

// ⚡ Típusok pontosítása a cache helper függvényeknél
const getCachedPreference = (preferenceId: string): UserPreference | null => {
  const cacheKey = getCacheKey(preferenceId);
  const cached = preferenceCache.get(cacheKey);

  if (cached && isCacheValid(cached)) {
    cacheStats.hits++;
    console.log(
      `[useStorage] 🎯 CACHE HIT: ${preferenceId} (${Math.round((Date.now() - cached.timestamp) / 1000)}s kor)`,
    );
    return cached.value;
  }

  if (cached) {
    // Lejárt cache bejegyzés törlése
    preferenceCache.delete(cacheKey);
    console.log(`[useStorage] ⏰ Cache lejárt és törölve: ${preferenceId}`);
  }

  cacheStats.misses++;
  return null;
};

const setCachedPreference = (preferenceId: string, preference: UserPreference): void => {
  const cacheKey = getCacheKey(preferenceId);

  // Cache méret korlátozás
  if (preferenceCache.size >= PREFERENCE_CACHE_MAX_SIZE) {
    // Legrégebbi bejegyzés eltávolítása
    const oldestKey = Array.from(preferenceCache.entries()).sort(
      ([, a], [, b]) => a.timestamp - b.timestamp,
    )[0]?.[0];
    if (oldestKey) {
      preferenceCache.delete(oldestKey);
      cacheStats.evictions++;
      console.log(`[useStorage] 🧹 Cache eviction: ${oldestKey}`);
    }
  }

  preferenceCache.set(cacheKey, {
    value: preference,
    timestamp: Date.now(),
    ttl: PREFERENCE_CACHE_TTL,
  });

  cacheStats.saves++;
  console.log(`[useStorage] 💾 Cache mentés: ${preferenceId}`);
};

const invalidateCache = (preferenceId?: string): void => {
  if (preferenceId) {
    const cacheKey = getCacheKey(preferenceId);
    if (preferenceCache.delete(cacheKey)) {
      console.log(`[useStorage] 🗑️ Cache invalidálva: ${preferenceId}`);
    }
  } else {
    const size = preferenceCache.size;
    preferenceCache.clear();
    console.log(`[useStorage] 🗑️ Teljes cache törölve (${size} bejegyzés)`);
  }
};

// ⚡ Típusok pontosítása az error kezelésnél
export function useStorage() {
  const dataManager = useMemo(() => DataManager.getInstance(), []);
  const [state, setState] = useState<LocalStorageData | null>(() => {
    // ✅ JAVÍTÁS: Default state azonnal F5 race condition elkerülésére
    const defaultState: LocalStorageData = {
      version: '1.0',
      timestamp: Date.now(),
      tabs: {
        activeId: '',
        definitions: [],
      },
      ui: {
        panelStates: { left: true, right: false },
        utilityMode: 'default',
      },
      savedArticles: [],
    };
    return defaultState;
  });
  const [deviceId, setDeviceId] = useState<string | null>(null);
  const [syncInfo, setSyncInfo] = useState<SyncInfo | null>(globalStorageManager.currentSyncInfo); // ✅ JAVÍTÁS: Public getter használata
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadInitialData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      // ✅ JAVÍTÁS: DataManager inicializálás CSAK EGYSZER
      if (!globalDataManagerInitialized) {
        await dataManager.initialize();
        console.log('[useStorage] DataManager initialized via useStorage.');
        globalDataManagerInitialized = true;
      } else {
        console.log('[useStorage] DataManager már inicializálva, kihagyás');
      }

      const storedState = await dataManager.get<LocalStorageData>(
        DataArea.LOCAL_STORAGE,
        StorageConfig.KEYS.LOCAL_STATE,
      );

      if (storedState) {
        setState(storedState);
      } else {
        const initialState: LocalStorageData = {
          version: '1.0',
          timestamp: Date.now(),
          tabs: {
            activeId: '', // Üres string, ha a típus string
            definitions: [],
          },
          ui: {
            panelStates: { left: true, right: false },
            utilityMode: 'default',
          },
          savedArticles: [],
        };
        setState(initialState);
        await dataManager.set<LocalStorageData>(
          DataArea.LOCAL_STORAGE,
          StorageConfig.KEYS.LOCAL_STATE,
          initialState,
        );
        console.log('[useStorage] Default state initialized and saved.');
      }

      // Device ID betöltése vagy generálása
      let currentDeviceId = await dataManager.get<string>(
        DataArea.LOCAL_STORAGE,
        StorageConfig.KEYS.DEVICE_ID,
      );
      if (!currentDeviceId) {
        // currentDeviceId = uuidv4(); // Helyettesítsd a saját UUID generáló logikáddal, ha van
        currentDeviceId = 'generated-device-id-' + Date.now(); // Egyszerű placeholder
        await dataManager.set<string>(
          DataArea.LOCAL_STORAGE,
          StorageConfig.KEYS.DEVICE_ID,
          currentDeviceId,
        );
        console.log('[useStorage] New device ID generated and saved:', currentDeviceId);
      }
      setDeviceId(currentDeviceId);

      // ✅ GLOBÁLIS SINGLETON SYNC INFO
      const currentSyncInfo = await globalStorageManager.getSyncInfo(dataManager);
      setSyncInfo(currentSyncInfo);
    } catch (err) {
      console.error('Hiba a kezdeti adatok betöltésekor:', err);
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setIsLoading(false);
    }
  }, [dataManager]); // ✅ JAVÍTÁS: syncInfoLoaded dependency eltávolítva

  useEffect(() => {
    loadInitialData();
  }, [loadInitialData]);

  // Általános állapotfrissítő függvény
  const updateState = useCallback(
    async (updater: (prevState: LocalStorageData) => LocalStorageData) => {
      setState((prevState) => {
        const newState = updater(prevState!); // Feltételezzük, hogy prevState nem null
        dataManager.set<LocalStorageData>(
          DataArea.LOCAL_STORAGE,
          StorageConfig.KEYS.LOCAL_STATE,
          newState,
        );
        return newState;
      });
    },
    [dataManager],
  );

  // Tab állapot frissítése
  const updateTabState = useCallback(
    async (
      tabIdOrData: string | 'tabs',
      data?: Partial<TabDefinition> | { activeId: string; definitions: TabDefinition[] },
    ) => {
      await updateState((prevState) => {
        const newTabs = { ...(prevState.tabs || { activeId: 'default', definitions: [] }) }; // Alapértelmezett érték, ha prevState.tabs null
        if (typeof tabIdOrData === 'string' && tabIdOrData !== 'tabs' && data) {
          const tabIndex = newTabs.definitions.findIndex((t) => t.id === tabIdOrData);
          const tabDefinitionData = data as Partial<TabDefinition>;
          if (tabIndex > -1) {
            newTabs.definitions[tabIndex] = {
              ...newTabs.definitions[tabIndex],
              ...tabDefinitionData,
            };
          } else {
            const { id: _dataId, ...restOfData } = tabDefinitionData;
            newTabs.definitions.push({ id: tabIdOrData, ...restOfData } as TabDefinition);
          }
        } else if (tabIdOrData === 'tabs' && data && 'activeId' in data && 'definitions' in data) {
          const tabsData = data as { activeId: string; definitions: TabDefinition[] };
          newTabs.activeId = tabsData.activeId;
          newTabs.definitions = tabsData.definitions;
        }
        return { ...prevState, tabs: newTabs } as LocalStorageData; // Biztosítjuk a LocalStorageData típust
      });
    },
    [updateState],
  );

  // Tab tartalom mentése IndexedDB-be
  const saveTabContent = useCallback(
    async (tabId: string, content: TabContentData) => {
      try {
        console.log(`[useStorage] Tab tartalom mentése (${tabId}):`, content);

        // A dataManager.getStorageAdapter() metódussal érjük el a storageAdapter példányt
        const storageAdapter = dataManager.getStorageAdapter();

        if (storageAdapter) {
          // Type assertion helyett a StorageAdapter saját típusát használjuk
          await storageAdapter.saveTabContent(tabId, content);
          console.log(`[useStorage] Tab tartalom mentése sikeres (${tabId})`);
          return true;
        } else {
          console.error(STORAGE_ADAPTER_NOT_FOUND_ERROR);
          return false;
        }
      } catch (error) {
        console.error('[useStorage] Hiba a tab tartalom mentésekor:', error);
        return false;
      }
    },
    [dataManager],
  );

  // Tab tartalom lekérése IndexedDB-ből
  const getTabContent = useCallback(
    async (tabId: string): Promise<TabContentData | null> => {
      // Guard: do not call IndexedDB without a valid tabId
      if (!tabId) {
        console.warn('[useStorage] getTabContent hívás tabId nélkül – kihagyjuk');
        return null;
      }
      try {
        console.log(`[useStorage] Tab tartalom lekérése (${tabId})...`);

        // Közvetlen storageAdapter használata a dataManager.get helyett
        const storageAdapter = dataManager.getStorageAdapter();

        if (storageAdapter) {
          const content = await storageAdapter.getTabContent(tabId);
          console.log(`[useStorage] Tab tartalom betöltve (${tabId}):`, content);
          return content;
        } else {
          console.error(STORAGE_ADAPTER_NOT_FOUND_ERROR);
          return null;
        }
      } catch (error) {
        console.error('[useStorage] Hiba a tab tartalom lekérésekor:', error);
        return null;
      }
    },
    [dataManager],
  );

  // Cikk olvasottként jelölése
  const markArticleAsRead = useCallback(
    async (articleId: string) => {
      if (!deviceId) {
        console.warn('Nincs eszközazonosító, az olvasottként jelölés nem szinkronizálódik.');
      }

      try {
        // A StorageAdapter markArticleAsRead metódusának közvetlen hívása deviceId-vel
        const storageAdapter = dataManager.getStorageAdapter();
        if (storageAdapter) {
          await storageAdapter.markArticleAsRead(articleId, deviceId || 'unknown-device');
          return true;
        } else {
          console.error(STORAGE_ADAPTER_NOT_FOUND_ERROR);
          return false;
        }
      } catch (error) {
        console.error('Hiba a cikk olvasottként jelölésekor:', error);
        return false;
      }
    },
    [dataManager, deviceId],
  );

  // Cikk olvasottsági állapotának lekérdezése
  const getReadStatus = useCallback(
    async (articleIds: string[]): Promise<Record<string, boolean>> => {
      const statuses: Record<string, boolean> = {};
      for (const id of articleIds) {
        try {
          const entry = await dataManager.get<ReadArticle>(DataArea.STORAGE, id, {
            storeName: StorageConfig.DB.STORES.READ_ARTICLES,
          });
          statuses[id] = !!entry;
        } catch (error) {
          console.error(`Hiba az olvasottság lekérdezésekor (${id}):`, error);
          statuses[id] = false;
        }
      }
      return statuses;
    },
    [dataManager],
  );

  // Cikk mentése
  const saveArticle = useCallback(
    async (article: ArticleData) => {
      // ArticleData az indexedDBTypes-ből
      try {
        await dataManager.set<ArticleData>(DataArea.STORAGE, article.id, article, {
          storeName: StorageConfig.DB.STORES.SAVED_ARTICLES,
        });

        await updateState((prevState) => {
          const newSavedArticles = [...(prevState.savedArticles || [])];
          if (!newSavedArticles.find((id) => id === article.id)) {
            newSavedArticles.push(article.id);
          }
          return { ...prevState, savedArticles: newSavedArticles } as LocalStorageData; // Biztosítjuk a típust
        });
        return true;
      } catch (error) {
        console.error('Hiba a cikk mentésekor:', error);
        return false;
      }
    },
    [dataManager, updateState],
  );

  // Felhasználói beállítások mentése
  const saveUserPreference = useCallback(
    async (preference: UserPreference) => {
      // UserPreference az indexedDBTypes-ből
      try {
        // ⚡ Cache invalidálás MENTÉS ELŐTT
        invalidateCache(preference.id);

        // Először próbáljuk meg a USER_PREFERENCES adattárolóba menteni
        try {
          await dataManager.set<UserPreference>(DataArea.STORAGE, preference.id, preference, {
            storeName: StorageConfig.DB.STORES.USER_PREFERENCES,
          });
          console.log(
            `[useStorage] Beállítás sikeresen mentve a userPreferences adattárolóba: ${preference.id}`,
          );

          // ⚡ Sikeres mentés után friss cache bejegyzés
          setCachedPreference(preference.id, preference);
          return true;
        } catch (err) {
          // Specifikusabban kezeljük a NotFoundError-t, hogy a log kevésbé legyen "hibajellegű"
          if (err instanceof DOMException && err.name === 'NotFoundError') {
            console.info(
              `[useStorage] A 'USER_PREFERENCES' adattároló nem található mentéshez. Fallback a keyValueStore-ra a '${preference.id}' beállításhoz.`,
            );
          } else {
            console.warn(
              `[useStorage] Hiba történt a USER_PREFERENCES adattárolóba mentéskor (fallback a keyValueStore-ra): ${preference.id}`,
              err,
            );
          }
          // Ha hiba történt, folytatjuk a fallback megoldással
        }

        // FALLBACK megoldás: keyValueStore használata egyszerű kulcs-érték alapon
        await dataManager.set(
          DataArea.STORAGE,
          `preference_${preference.id}`,
          {
            value: preference.value,
            timestamp: preference.updatedAt || Date.now(), // updatedAt használata timestamp helyett
          },
          {}, // Üres options objektum - alapértelmezett keyValueStore-t fog használni
        );
        console.log(`[useStorage] Beállítás mentve a fallback keyValueStore-ba: ${preference.id}`);

        // ⚡ Fallback mentés után is cache frissítés
        setCachedPreference(preference.id, preference);
        return true;
      } catch (error) {
        console.error('Hiba a felhasználói beállítás mentésekor:', error);
        return false;
      }
    },
    [dataManager],
  );

  // Felhasználói beállítások lekérése
  const getUserPreference = useCallback(
    async (preferenceId: string) => {
      // ⚡ 1. CACHE ELLENŐRZÉS ELŐSZÖR
      const cached = getCachedPreference(preferenceId);
      if (cached) {
        return cached;
      }

      try {
        // 2. Ha nincs cache, akkor API hívás
        console.log(`[useStorage] 🔍 Cache miss, DB lekérés: ${preferenceId}`);

        // Először próbáljuk meg a normal USER_PREFERENCES adattárolóból
        try {
          const preference = await dataManager.get<UserPreference>(DataArea.STORAGE, preferenceId, {
            storeName: StorageConfig.DB.STORES.USER_PREFERENCES,
          });

          if (preference) {
            // ⚡ Cache-be mentés sikeres lekérés után
            setCachedPreference(preferenceId, preference);
            return preference;
          }
        } catch (err) {
          // Specifikusabban kezeljük a NotFoundError-t, hogy a log kevésbé legyen "hibajellegű"
          if (err instanceof DOMException && err.name === 'NotFoundError') {
            console.info(
              `[useStorage] A 'USER_PREFERENCES' adattároló nem található. Fallback a keyValueStore-ra a '${preferenceId}' beállításhoz.`,
            );
          } else {
            console.warn(
              `[useStorage] Hiba történt a USER_PREFERENCES adattároló elérésekor (fallback a keyValueStore-ra): ${preferenceId}`,
              err,
            );
          }
          // Ha hiba történt, folytatjuk a fallback megoldással
        }

        // FALLBACK megoldás: keyValueStore használata egyszerű kulcs-érték alapon
        const keyValuePreference = await dataManager.get<{ value: unknown; timestamp: number }>(
          DataArea.STORAGE,
          `preference_${preferenceId}`,
          {}, // Üres options objektum - alapértelmezett keyValueStore-t fog használni
        );

        if (keyValuePreference) {
          // Konvertálás a UserPreference formátumra
          const preference = {
            id: preferenceId,
            type: 'userPreference',
            value: keyValuePreference.value,
            updatedAt: keyValuePreference.timestamp || Date.now(), // timestamp helyett updatedAt
          } as UserPreference;

          // ⚡ Cache-be mentés fallback eredmény után is
          setCachedPreference(preferenceId, preference);
          return preference;
        }

        return null;
      } catch (error) {
        console.error('Hiba a felhasználói beállítás lekérésekor:', error);
        return null;
      }
    },
    [dataManager],
  );

  // Mentési várólista elem hozzáadása
  const addToSaveQueue = useCallback(
    async (item: Omit<SaveQueueItem, 'attempts'>) => {
      // SaveQueueItem a types/storage-ból
      const queueItem: SaveQueueItem = { ...item, attempts: 0 };
      try {
        await dataManager.set<SaveQueueItem>(
          DataArea.STORAGE,
          queueItem.timestamp.toString(),
          queueItem,
          { storeName: StorageConfig.DB.STORES.SAVE_QUEUE },
        );
        return true;
      } catch (error) {
        console.error('Hiba a mentési várólistához adáskor:', error);
        return false;
      }
    },
    [dataManager],
  );

  // Szinkronizáció indítása
  const syncNow = useCallback(
    async (options?: SyncOptions) => {
      // A DataManager.syncNow már tartalmazza a null ellenőrzést a syncService-re.
      setIsLoading(true);
      setError(null);
      try {
        const success = await dataManager.syncNow(options);
        const updatedSyncInfo = await dataManager.getSyncInfo();
        setSyncInfo(updatedSyncInfo);
        setIsLoading(false);
        return success;
      } catch (err) {
        console.error('[useStorage] Sync error:', err);
        setError(err instanceof Error ? err.message : String(err));
        // Hiba esetén is próbáljuk frissíteni a syncInfo-t, hátha tartalmaz hibaüzenetet
        try {
          const updatedSyncInfoOnError = await dataManager.getSyncInfo();
          setSyncInfo(updatedSyncInfoOnError);
        } catch (syncInfoError) {
          console.error('[useStorage] Error fetching sync info after sync error:', syncInfoError);
        }
        setIsLoading(false);
        return false;
      }
    },
    [dataManager],
  );

  // Periodikus SyncInfo frissítés (opcionális, de hasznos lehet)
  useEffect(() => {
    // ✅ Csak akkor indítjuk a periodikus frissítést, ha már be van töltve
    if (!globalStorageManager.isLoaded) return;

    // ✅ JAVÍTÁS: Ha van sync hiba, ne indítsuk a periodikus frissítést
    if (error && error.includes('szinkronizáció')) {
      console.log('[useStorage] Sync hiba miatt periodikus frissítés kikapcsolva');
      return;
    }

    const intervalId = setInterval(async () => {
      if (dataManager && !isLoading && !error) {
        try {
          console.log('[useStorage] Periodikus sync info frissítés...');
          const currentSyncInfo = await dataManager.getSyncInfo();

          // ✅ GLOBÁLIS változók frissítése
          globalStorageManager.updateSyncInfo(currentSyncInfo);
          
          // ✅ JAVÍTÁS: Csak akkor frissítjük a state-et, ha változott
          setSyncInfo(prevSyncInfo => {
            if (JSON.stringify(prevSyncInfo) !== JSON.stringify(currentSyncInfo)) {
              console.log('[useStorage] Sync info változott, state frissítés');
              return currentSyncInfo;
            }
            return prevSyncInfo; // Nincs változás, nem renderelünk újra
          });
        } catch (err) {
          console.error('[useStorage] Error during periodic sync info update:', err);
        }
      }
    }, 1800000); // 30 percenként (optimális teljesítmény)

    return () => clearInterval(intervalId);
  }, [dataManager, isLoading, error]); // ✅ globalSyncInfoLoaded eltávolítva

  return {
    state,
    deviceId,
    syncInfo,
    isLoading,
    error,
    storageInitialized: !isLoading && !error,
    syncNow,
    refreshData: loadInitialData,
    // A nem használt függvényeket egyelőre itt hagyjuk, a figyelmeztetésekkel később foglalkozunk
    updateTabState,
    saveTabContent,
    getTabContent,
    // ❌ TÖRLÉS: saveScrollPosition - duplikáció megszüntetve, ScrollStorage service használata helyett
    markArticleAsRead,
    getReadStatus,
    saveArticle,
    saveUserPreference,
    getUserPreference,
    addToSaveQueue,

    // ⚡ ÚJ: Cache diagnosztika és kezelés
    getCacheStats: () => ({
      ...cacheStats,
      size: preferenceCache.size,
      maxSize: PREFERENCE_CACHE_MAX_SIZE,
      ttlMinutes: PREFERENCE_CACHE_TTL / (60 * 1000),
    }),
    clearPreferenceCache: () => invalidateCache(),
    invalidatePreferenceCache: invalidateCache,
  };
}
