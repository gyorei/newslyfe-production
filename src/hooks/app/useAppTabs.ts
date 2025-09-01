/*
src\hooks\app\useAppTabs.ts
2024-07 - forceRefresh lánc javítás:
A Local gomb minden megnyomására garantáltan friss adat jön az API-ból,
mert a filterlánc minden rétegében explicit forceRefresh: true kerül a local tab filterjeibe.
*/
// filepath: c:\news\src\hooks\app\useAppTabs.ts
/**
 * ✅ 2025-07-12 MÓDOSÍTÁS: Tab törlés javítása
 * - Régi problémás kód kikommentálva (index hiba, rossz aktiválás)
 * - Home tab prioritás implementálva (logikus navigáció)
 * - Cache megtartás (gyors betöltés)
 * - Biztonságos tab aktiválás (nincs keveredés)
 */
import { useState, useEffect, useCallback } from 'react';
import { Tab } from '../../types'; // Tab típus importálása
import { DataManager, DataArea } from '../../utils/datamanager/manager'; // Javított import: DataArea hozzáadva és a 'manager'-ből importálva
import { LocalStorageData } from '../../utils/datamanager/localStorage/types'; // Új import
import { localLocationService, localizationService } from '../../components/LocalNews/Location';
import { traceDataFlow } from '../../utils/debugTools/debugTools';
import { searchResultsMetadataBridge } from '../../components/Utility/Settings/SearchFilters/SearchResultsMetadataBridge';
import { searchFiltersBridge } from '../../components/Utility/Settings/SearchFilters/SearchFiltersBridge';

// Props interfész a hookhoz
interface UseAppTabsProps {
  storageInitialized: boolean;
  storageState: LocalStorageData | null; // A useStorage által visszaadott teljes állapot
}
// A hook által visszaadott értékek típusa
interface UseAppTabsReturn {
  tabs: Tab[];
  activeTabId: string;
  isLocationLoading: boolean;
  addTabWithPersistence: () => string;
  closeTab: (tabId: string) => void;
  activateTab: (tabId: string) => void;
  changeTabMode: (tabId: string, mode: 'news' | 'new' | 'search' | 'video' | 'home' | 'my_page') => void;
  handleReorderTabs: (newTabs: Tab[]) => void;
  handleContinentSearch: (continent: string, country?: string) => string;
  handleCategorySearch: (category: string) => string;
  handleSearchTabOpen: (searchTerm: string) => string;
  handleVideoTabOpen: () => string;
  handleFiltersChange: (filters: Partial<Tab['filters']>, contentType?: 'text' | 'video' | 'both') => void; // Szűrőkezelő callback
  loadLocalContent: () => Promise<string | null>; // Új függvény a helymeghatározáshoz
  handleSourceTabOpen: (sourceId: string, sourceName: string) => string; // ÚJ: Forrás szerinti tab nyitása
  openMyPageTab: () => void; // ✅ HOZZÁADVA
  renameTab: (tabId: string, newTitle: string) => void; // ÚJ: Tab átnevezése
}
// Segédtípus a tárolt tab definícióhoz (LocalStorageData alapján)
type StoredTabDefinition = NonNullable<LocalStorageData['tabs']>['definitions'][0];

// ÚJ: Interfész a localStorage-ben tárolt tab formátumhoz
interface StoredTabData {
  id: string;
  title: string;
  mode?: 'news' | 'new' | 'search' | 'video' | string;
  params?: Record<string, unknown>;
}

// Engedélyezett módok
const ALLOWED_MODES: Tab['mode'][] = ['news', 'new', 'search', 'video', 'home', 'my_page']; // ✅ 'my_page' HOZZÁADVA

/**
 * Hook a fülek állapotának és logikájának kezelésére.
 */
export function useAppTabs({
  storageInitialized,
  storageState,
}: UseAppTabsProps): UseAppTabsReturn {
  // ============================================================
  // ÁLLAPOTOK (áthelyezve az App.tsx-ből)
  // ============================================================

  // Kezdeti állapot közvetlen localStorage-ból olvasva a villanás elkerülése érdekében
  const getInitialTabs = (): Tab[] => {
    try {
      // Közvetlen localStorage olvasás az első renderelés előtt
      // A StorageManager osztály által használt kulcs: 'news-app-state'
      const storedStateJson = localStorage.getItem('news-app-state');
      if (storedStateJson) {
        const storedState = JSON.parse(storedStateJson);
        // Ellenőrizzük, hogy van-e tabs objektum a tárolt állapotban
        if (
          storedState?.tabs?.definitions &&
          Array.isArray(storedState.tabs.definitions) &&
          storedState.tabs.definitions.length > 0
        ) {
          console.log('[useAppTabs] Kezdeti állapot betöltése localStorage-ből:', storedState.tabs);

          // Tabok konvertálása a megfelelő formátumra
          return storedState.tabs.definitions.map((tabDef: StoredTabData): Tab => {
            let validMode: Tab['mode'] = 'news';
            if (tabDef.mode && ALLOWED_MODES.includes(tabDef.mode as Tab['mode'])) {
              validMode = tabDef.mode as Tab['mode'];
            } else if (tabDef.mode) {
              console.warn(`[useAppTabs] Invalid mode "${tabDef.mode}" found in stored tab "${tabDef.id}". Defaulting to "news".`);
            }
            return {
              id: tabDef.id,
              title: tabDef.title,
              active: tabDef.id === storedState.tabs.activeId,
              mode: validMode,
              filters: tabDef.params || {},
            };
          });
        }
      }
    } catch (error) {
      console.error('[useAppTabs] Hiba a localStorage olvasásakor:', error);
    }

    // Ha nincs mentett állapot vagy hibás a formátum, alapértelmezett tabot adunk vissza
    return [{
      id: 'default-tab',
      title: 'Home',
      active: true,
      mode: 'home', // <-- JAVÍTVA: induláskor is 'home' típus
      filters: {}
    }];
  };

  // Az useState hook LAZY INITIALIZATION-nel a localStorage-ból olvas
  const [tabs, setTabs] = useState<Tab[]>(() => getInitialTabs()); // ✅ JAVÍTÁS: Lazy initialization

  // Az aktív tab ID kinyerése a kezdeti állapotból
  const getInitialActiveId = (): string => {
    // Ha vannak tabok és van aktív közöttük, annak az ID-ját használjuk
    const activeTab = tabs.find((tab) => tab.active);
    return activeTab?.id || tabs[0]?.id || '0';
  };

  const [activeTabId, setActiveTabId] = useState(getInitialActiveId());
  const [isLocationLoading, setIsLocationLoading] = useState(false);

  // ============================================================
  // EFFEKTEK (áthelyezve az App.tsx-ből)
  // ============================================================

  // 🚀 ÚJ: AUTOMATIKUS MENTÉS - duplikáció elleni védelem
  useEffect(() => {
    if (
      storageInitialized &&
      tabs.length > 0 &&
      activeTabId &&
      tabs.some(tab => tab.id === activeTabId)
    ) {
      console.log('[useAppTabs] 🔄 Automatikus mentés:', {
        activeId: activeTabId,
        count: tabs.length,
      });

      const definitionsToSave = tabs.map((tab) => ({
        id: tab.id,
        title: tab.title,
        mode: tab.mode,
        params: tab.filters || {},
      }));

      const dataToSave = {
        tabs: {
          activeId: activeTabId,
          definitions: definitionsToSave,
        },
      };

      // Tab állapot perzisztálása a DataManager segítségével
      DataManager.getInstance()
        .set(DataArea.LOCAL_STORAGE, 'appState', dataToSave)
        .catch((err: unknown) =>
          console.error(
            '[useAppTabs] Automatikus mentés hiba:',
            err instanceof Error ? err.message : String(err),
          ),
        );

      // Közvetlen localStorage mentés eltávolítva!
      // try {
      //   localStorage.setItem('news-app-state', JSON.stringify(dataToSave));
      // } catch (error) {
      //   console.warn('[useAppTabs] Közvetlen localStorage mentés hiba:', error);
      // }
    }
  }, [tabs, activeTabId, storageInitialized]); // Automatikus mentés tabs vagy activeTabId változáskor

  // 1. Tab állapot betöltése a perzisztencia rétegből
  useEffect(() => {
    console.log('[useAppTabs] Storage state változott:', {
      storageInitialized,
      tabsState: storageState?.tabs,
      fullStorageState: storageState,
      tabsDefinitions: storageState?.tabs?.definitions,
      tabsActiveId: storageState?.tabs?.activeId,
    });
    if (
      storageInitialized &&
      storageState?.tabs &&
      Array.isArray(storageState.tabs.definitions) &&
      storageState.tabs.definitions.length > 0
    ) {
      const storedTabsData = storageState.tabs;
      // Tabok konvertálása a megfelelő formátumra
      const storedTabs = storedTabsData.definitions.map((tabDef: StoredTabDefinition): Tab => {
        let validMode: Tab['mode'] = 'news';
        if (tabDef.mode && ALLOWED_MODES.includes(tabDef.mode as Tab['mode'])) {
          validMode = tabDef.mode as Tab['mode'];
        } else if (tabDef.mode) {
          console.warn(`[useAppTabs] Invalid mode "${tabDef.mode}" found in stored tab "${tabDef.id}". Defaulting to "news".`);
        }
        return {
          id: tabDef.id,
          title: tabDef.title,
          active: tabDef.id === storedTabsData.activeId,
          mode: validMode,
          filters: tabDef.params || {},
        };
      });

      // Csak akkor állítjuk be, ha van tárolt adat
      if (storedTabs.length > 0) {
        console.log('[useAppTabs] Tárolt tabok beállítása:', storedTabs);
        setTabs(storedTabs);
        setActiveTabId(storedTabsData.activeId);
      } else {
        console.log('[useAppTabs] Tárolt tabok üresek, nem történik módosítás.');
      }
    }
  }, [storageInitialized, storageState]); // storageState dependency hozzáadva

  ///////////////////////////////////////////////////////////////////////

  // Új explicit függvény a helymeghatározáshoz és a Local tartalom betöltéséhez
  const loadLocalContent = useCallback(async () => {
    try {
      setIsLocationLoading(true);
      const location = await localLocationService.getLocation();
      const country = localizationService.normalizeCountry(location.country);
      console.log('[useAppTabs] loadLocalContent - ország:', country);
      // --- LOG: milyen filterekkel hozunk létre/frissítünk local tabot? ---
      console.log('--- useAppTabs.loadLocalContent ---', {
        country,
        filters: {
          country,
          forceRefresh: true,
          torzsMode: true,
        }
      });

      // Ellenőrizzük, hogy létezik-e az '1' azonosítójú fül
      setTabs((prevTabs) => {
        const localTabExists = prevTabs.some((tab) => tab.id === '1');

        if (localTabExists) {
          // Ha létezik, frissítjük
          return prevTabs.map((tab) =>
            tab.id === '1'
              ? {
                  ...tab,
                  title: country || 'Lokális',
                  filters: {
                    ...tab.filters,
                    country: country,
                    forceRefresh: true, // <-- CACHE BYPASS AKTIVÁLÁSA
                    torzsMode: true,    // <-- ÚJ: CACHE MENTÉS AKTIVÁLÁSA az országokhoz hasonlóan
                  },
                  active: true,
                }
              : { ...tab, active: false },
          );
        } else {
          // Ha nem létezik, létrehozzuk
          const newLocalTab: Tab = {
            id: '1',
            title: country || 'Lokális',
            active: true,
            mode: 'news' as const, // Explicit típusmeghatározás
            filters: {
              country: country,
              forceRefresh: true, // <-- CACHE BYPASS AKTIVÁLÁSA
              torzsMode: true,    // <-- ÚJ: CACHE MENTÉS AKTIVÁLÁSA az országokhoz hasonlóan
            },
          };

          // A többi fül inaktív lesz
          const updatedTabs = prevTabs.map((tab) => ({ ...tab, active: false }));
          return [...updatedTabs, newLocalTab];
        }
      });

      // Aktiváljuk a fület is
      setActiveTabId('1');

      return country;
    } catch (error) {
      console.error('[useAppTabs] Helymeghatározás hiba:', error);
      return null;
    } finally {
      setIsLocationLoading(false);
    }
  }, []); // ✅ EGYSZERŰSÍTETT: saveTabsToStorage függőség eltávolítva

  // ============================================================
  // CALLBACKEK STABILIZÁLÁSA
  // ============================================================

  const addTabWithPersistence = useCallback(() => {
    const newId = `tab-${Date.now()}`;
    const newTab: Tab = {
      id: newId,
      title: 'Home',
      active: true,
      mode: 'home', // <-- JAVÍTVA: mindig 'home' típus
      filters: {},
    };
    let finalTabs: Tab[] = [];
    setTabs((prevTabs) => {
      const updatedTabs = prevTabs.map((tab) => ({ ...tab, active: false }));
      finalTabs = [...updatedTabs, newTab];
      return finalTabs;
    });
    setActiveTabId(newId);
    // A perzisztálást az addTabWithPersistence kezeli
    return newId;
  }, []); // Nincs függősége a saveTabsToStorage-nak itt

  const closeTab = useCallback(
    (tabId: string) => {
      // --- 1. A LOGIKA KIKERÜL A setTabs-BÓL ---
      // Most már a külső, `useCallback` által figyelt `tabs` állapotot használjuk.
      const closingTab = tabs.find(tab => tab.id === tabId);

      // --- 2. Meta-adat törlése ---
      searchResultsMetadataBridge.clearTabMetadata(tabId);

      // --- 3. Szűrő resetelése, ha szükséges ---
      if (closingTab && closingTab.mode === 'search') {
        const remainingSearchTabs = tabs.filter(tab => tab.id !== tabId && tab.mode === 'search');
        if (remainingSearchTabs.length === 0) {
          console.log('[useAppTabs] Utolsó keresési fül bezárva, szűrők resetelése.');
          searchFiltersBridge.emitFilterChange({ lang: 'all', countries: [] });
        }
      }

      // --- 4. Az ÁLLAPOT FRISSÍTÉSE ---
      // A `setTabs` most már csak az állapot frissítéséért felel.
      setTabs((prevTabs) => {
        // 1. Az AKTUÁLIS aktív ID kiolvasása a legfrissebb állapotból (prevTabs)
        const currentActiveId = prevTabs.find((tab) => tab.active)?.id;

        // 2. A bezárandó fül indexének megkeresése
        const closingTabIndex = prevTabs.findIndex((tab) => tab.id === tabId);
        if (closingTabIndex === -1) {
          return prevTabs; // Nincs ilyen fül, nem csinálunk semmit
        }

        // 3. A fül eltávolítása
        const updatedTabs = prevTabs.filter((tab) => tab.id !== tabId);

        // 4. Kilépési logika, ha minden fül bezárult
        if (updatedTabs.length === 0) {
          setTimeout(() => {
            try { window.close(); } catch { /* szándékosan üres */ }
          }, 100);
          return [];
        }

        // 5. Az új aktív fül ID-jának meghatározása
        let newActiveId = currentActiveId; // Alapértelmezett marad az, ami volt

        if (tabId === currentActiveId) {
          console.log(`[useAppTabs] Az aktív fület (${tabId}) zárjuk be, új aktív fül keresése...`);
          if (closingTabIndex < updatedTabs.length) {
            newActiveId = updatedTabs[closingTabIndex].id;
            console.log(`[useAppTabs] Jobbra lévő tab aktiválva: ${updatedTabs[closingTabIndex].title}`);
          } else {
            newActiveId = updatedTabs[updatedTabs.length - 1].id;
            console.log(`[useAppTabs] Balra lévő tab aktiválva: ${updatedTabs[updatedTabs.length - 1].title}`);
          }
        } else {
           console.log(`[useAppTabs] Inaktív fület (${tabId}) zárunk be, az aktív fül (${currentActiveId}) változatlan marad.`);
        }

        // 6. A state-ek frissítése az új adatokkal
        if (newActiveId) {
          setActiveTabId(newActiveId);
        }
        
        // ✅ JAVÍTVA: Közvetlen return a 'map' kifejezéssel
        return updatedTabs.map((tab) => ({
          ...tab,
          active: tab.id === newActiveId,
        }));
      });
    },
    [tabs], // A tabs-t be kell venni a függőségi listába!
  );

  const activateTab = useCallback((tabId: string) => {
    setTabs((prevTabs) => {
      // Ellenőrizzük, hogy a tab létezik-e
      const tabExists = prevTabs.some((tab) => tab.id === tabId);
      if (!tabExists) {
        console.warn(`[useAppTabs] Tab nem található: ${tabId}`);
        return prevTabs; // Nem módosítunk semmit, ha a tab nem létezik
      }

      // Csak akkor állítjuk be az activeTabId-t, ha a tab létezik
      setActiveTabId(tabId);

      return prevTabs.map((tab) => {
        if (tab.id === tabId) {
          // --- JAVÍTÁS: forceRefresh törlése tabváltáskor ---
          const newFilters = { ...tab.filters };
          if (newFilters.forceRefresh) {
            delete newFilters.forceRefresh;
            console.log(`[useAppTabs] Tabváltáskor forceRefresh törölve: ${tabId}`);
          }
          return {
            ...tab,
            active: true,
            filters: newFilters,
          };
        } else {
          return { ...tab, active: false };
        }
      });
    });
  }, []);

  const changeTabMode = useCallback((tabId: string, mode: 'news' | 'new' | 'search' | 'video' | 'home' | 'my_page') => {
    setTabs((prevTabs) => {
      return prevTabs.map((tab) => (tab.id === tabId ? { ...tab, mode } : tab));
    });
  }, []);

  const handleReorderTabs = useCallback((newTabs: Tab[]) => {
    setTabs(newTabs);
    // ❌ ELTÁVOLÍTVA: Manuális mentés - az automatikus useEffect kezeli
  }, []); // ✅ EGYSZERŰSÍTETT: Nincs függőség

  // --- Keresési/Szűrési fül műveletek ---

  const handleContinentSearch = useCallback((continent: string, country?: string) => {
    traceDataFlow('[useAppTabs] handleContinentSearch', { continent, country });

    const newTabTitle = country ? `${country} (${continent})` : continent;

    const newTabId = `continent-tab-${Date.now()}`;
    const newContinentTab: Tab = {
      id: newTabId,
      title: newTabTitle,
      active: true,
      mode: 'news',
      filters: {
        continent: continent,
        country: country || undefined,
      },
    };

    setTabs((prevTabs) => {
      const updatedTabs = prevTabs.map((tab) => ({ ...tab, active: false }));
      return [...updatedTabs, newContinentTab];
    });
    setActiveTabId(newTabId);
    // ❌ ELTÁVOLÍTVA: Manuális mentés - az automatikus useEffect kezeli
    return newTabId;
  }, []); // ✅ EGYSZERŰSÍTETT: Nincs függőség saveTabsToStorage-ra

  const handleCategorySearch = useCallback((category: string) => {
    traceDataFlow('[useAppTabs] handleCategorySearch', { category });

    const newTabTitle = category;
    const newTabId = `category-tab-${Date.now()}`;
    const newCategoryTab: Tab = {
      id: newTabId,
      title: newTabTitle,
      active: true,
      mode: 'news',
      filters: {
        category: category,
      },
    };

    setTabs((prevTabs) => {
      const updatedTabs = prevTabs.map((tab) => ({ ...tab, active: false }));
      return [...updatedTabs, newCategoryTab];
    });
    setActiveTabId(newTabId);
    // ❌ ELTÁVOLÍTVA: Manuális mentés - az automatikus useEffect kezeli
    return newTabId;
  }, []); // ✅ EGYSZERŰSÍTETT: Nincs függőség saveTabsToStorage-ra

  const handleSearchTabOpen = useCallback((searchTerm: string) => {
    traceDataFlow('[useAppTabs] handleSearchTabOpen', { searchTerm });

    const newTabTitle = `Keresés: ${searchTerm}`;
    const newTabId = `search-tab-${Date.now()}`;
    const newSearchTab: Tab = {
      id: newTabId,
      title: newTabTitle,
      active: true,
      mode: 'search', // ✅ JAVÍTVA: csak 'search' lehet
      filters: {
        searchTerm: searchTerm,
      },
    };

    setTabs((prevTabs) => {
      const updatedTabs = prevTabs.map((tab) => ({ ...tab, active: false }));
      return [...updatedTabs, newSearchTab];
    });
    setActiveTabId(newTabId);
    return newTabId;
  }, []);

  // ✅ ÚJ: Video tab létrehozása
  const handleVideoTabOpen = useCallback(() => {
    traceDataFlow('[useAppTabs] handleVideoTabOpen', { action: 'createVideoTab' });

    const newTabTitle = 'Video News';
    const newTabId = `video-tab-${Date.now()}`;
    const newVideoTab: Tab = {
      id: newTabId,
      title: newTabTitle,
      active: true,
      mode: 'video', // Video mód
      filters: {},
    };

    setTabs((prevTabs) => {
      const updatedTabs = prevTabs.map((tab) => ({ ...tab, active: false }));
      return [...updatedTabs, newVideoTab];
    });
    setActiveTabId(newTabId);
    // ❌ ELTÁVOLÍTVA: Manuális mentés - az automatikus useEffect kezeli
    return newTabId;
  }, []); // ✅ EGYSZERŰSÍTETT: Nincs függőség saveTabsToStorage-ra

  // ============================================================
  // ÚJ: Forrás szerinti tab nyitása
  // ============================================================
  const handleSourceTabOpen = useCallback((sourceId: string, sourceName: string) => {
    // Debug log
    traceDataFlow('[useAppTabs] handleSourceTabOpen', { sourceId, sourceName });

    // ⭐ JAVÍTÁS: Országkód kinyerése a sourceId-ból ⭐
    const countryCode = sourceId.split('-')[0];

    // Új tab címe a forrás neve
    const newTabTitle = sourceName;
    // Egyedi tab id generálása
    const newTabId = `source-tab-${sourceId}-${Date.now()}`;
    // Új tab objektum
    const newSourceTab: Tab = {
      id: newTabId,
      title: newTabTitle,
      active: true,
      mode: 'news', // Hírek mód
      filters: {
        source: [sourceId],
        country: countryCode, // ⭐ Hozzáadjuk a country kulcsot! ⭐
      },
    };

    // Tabok állapotának frissítése: minden más tab inaktív lesz
    setTabs((prevTabs) => {
      const updatedTabs = prevTabs.map((tab) => ({ ...tab, active: false }));
      return [...updatedTabs, newSourceTab];
    });
    // Az új tabot aktívvá tesszük
    setActiveTabId(newTabId);
    // Az új tab id-ját visszaadjuk
    return newTabId;
}, []);
  
  const handleFiltersChange = useCallback(
    (filters: Partial<Tab['filters']>, contentType?: 'text' | 'video' | 'both') => {
      const currentTab = tabs.find((tab) => tab.id === activeTabId);
      traceDataFlow('[useAppTabs] handleFiltersChange', {
        filters,
        activeTabId,
        currentFilters: currentTab?.filters,
        contentType,
      });

      let newActiveId = activeTabId;

      // Segédfüggvény: eldönti, hogy új fül kell-e
      const shouldOpenNewTab =
        !!filters?.continent || !!filters?.category || !!filters?.country || !!filters?.searchTerm;

      if (shouldOpenNewTab) {
        const newTabTitle = filters.searchTerm
          ? `Keresés: ${filters.searchTerm}`
          : filters.continent
            ? `${filters.continent}`
            : filters.category
              ? `${filters.category}`
              : filters.country
                ? `${filters.country}`
                : 'Szűrt';

        const newTabId = `filtered-tab-${Date.now()}`;
        newActiveId = newTabId;

        const newTab: Tab = {
          id: newTabId,
          title: newTabTitle,
          active: true,
          mode: contentType === 'video'
            ? 'video'
            : filters.searchTerm
              ? 'search'
              : 'news',
          filters: {
            ...filters,
          },
        };

        setTabs((prevTabs) => {
          const updatedTabs = prevTabs.map((tab) => ({ ...tab, active: false }));
          return [...updatedTabs, newTab];
        });

        setActiveTabId(newActiveId);
      } else {
        // Meglévő fül frissítése (pl. dátum szűrés)
        setTabs((prevTabs) => {
          return prevTabs.map((tab) =>
            tab.id === activeTabId
              ? {
                  ...tab,
                  filters: {
                    ...tab.filters,
                    ...(filters || {}),
                  },
                }
              : tab,
          );
        });
        // ActiveTabId marad változatlan
      }
    },
    [tabs, activeTabId],
  );

  // ============================================================
  // ÚJ: "My" tab megnyitása
  // ============================================================

  const openMyPageTab = useCallback(() => {
    // Ellenőrizzük, hogy létezik-e már "My" tab
    const existingMyTab = tabs.find(tab => tab.mode === 'my_page');
    if (existingMyTab) {
      activateTab(existingMyTab.id);
      return;
    }
    // Új tab létrehozása
    const newTabId = `my-page-${Date.now()}`;
    const newMyTab: Tab = {
      id: newTabId,
      title: 'My',
      active: true,
      mode: 'my_page',
      filters: {},
    };
    setTabs(prevTabs => {
      const updatedTabs = prevTabs.map(tab => ({ ...tab, active: false }));
      return [...updatedTabs, newMyTab];
    });
    setActiveTabId(newTabId);
  }, [tabs, activateTab]);

  // ============================================================
  // ÚJ: Tab átnevezése (renameTab)
  // ============================================================
  const renameTab = useCallback((tabId: string, newTitle: string) => {
    setTabs((prevTabs) =>
      prevTabs.map(tab =>
        tab.id === tabId ? { ...tab, title: newTitle } : tab
      )
    );
  }, []);

  // ============================================================
  // VISSZATÉRÉSI ÉRTÉK
  // ============================================================
  return {
    tabs,
    activeTabId,
    isLocationLoading,
    addTabWithPersistence,
    closeTab,
    activateTab,
    changeTabMode,
    handleReorderTabs,
    handleContinentSearch,
    handleCategorySearch,
    handleSearchTabOpen,
    handleVideoTabOpen,
    handleFiltersChange,
    loadLocalContent, // Új függvény exportálása
    handleSourceTabOpen, // ÚJ: Forrás szerinti tab nyitása
    openMyPageTab, // ÚJ: "My" tab megnyitása
    renameTab, // ÚJ: Tab átnevezése
  };
}
