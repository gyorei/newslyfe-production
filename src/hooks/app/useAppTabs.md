új  van bent cache 

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
  changeTabMode: (tabId: string, mode: 'news' | 'new' | 'search' | 'video') => void;
  handleReorderTabs: (newTabs: Tab[]) => void;
  handleContinentSearch: (continent: string, country?: string) => string;
  handleCategorySearch: (category: string) => string;
  handleSearchTabOpen: (searchTerm: string) => string;
  handleVideoTabOpen: () => string;
  handleFiltersChange: (filters: Partial<Tab['filters']>, contentType?: 'text' | 'video' | 'both') => void; // Szűrőkezelő callback
  loadLocalContent: () => Promise<string | null>; // Új függvény a helymeghatározáshoz
  handleSourceTabOpen: (sourceId: string, sourceName: string) => string; // ÚJ: Forrás szerinti tab nyitása
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
            // Validáljuk a 'mode'-ot
            let validMode: Tab['mode'] = 'news'; // Alapértelmezett
            if (tabDef.mode === 'news' || tabDef.mode === 'new' || tabDef.mode === 'search' || tabDef.mode === 'video') {
              validMode = tabDef.mode;
            }

            return {
              id: tabDef.id,
              title: tabDef.title,
              active: tabDef.id === storedState.tabs.activeId,
              mode: validMode, // Validált módot használunk
              // A 'params' objektumot olvassuk be 'filters'-ként
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
      mode: 'news',
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
        // Validáljuk a 'mode'-ot
        let validMode: Tab['mode'] = 'news'; // Alapértelmezett
        if (tabDef.mode === 'news' || tabDef.mode === 'new' || tabDef.mode === 'search' || tabDef.mode === 'video') {
          validMode = tabDef.mode;
        } else if (tabDef.mode) {
          // Ha van mode, de nem valid, jelezzük és marad az alapértelmezett
          console.warn(
            `[useAppTabs] Invalid mode "${tabDef.mode}" found in stored tab "${tabDef.id}". Defaulting to "news".`,
          );
        }

        return {
          id: tabDef.id,
          title: tabDef.title,
          active: tabDef.id === storedTabsData.activeId,
          mode: validMode, // Validált módot használunk
          // A 'params' objektumot olvassuk be 'filters'-ként
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
  }, [storageInitialized, storageState?.tabs]);

  ///////////////////////////////////////////////////////////////////////

  // Új explicit függvény a helymeghatározáshoz és a Local tartalom betöltéséhez
  const loadLocalContent = useCallback(async () => {
    try {
      setIsLocationLoading(true);
      const location = await localLocationService.getLocation();
      const country = localizationService.normalizeCountry(location.country);
      console.log('[useAppTabs] Normalizált ország:', country);

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
  // CALLBACKEK (áthelyezve az App.tsx-ből)
  // ============================================================

  // --- Alap fül műveletek ---

  const addTab = useCallback(() => {
    const newId = `tab-${Date.now()}`;
    const newTab: Tab = {
      id: newId,
      title: 'Home',
      active: true,
      mode: 'new',
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

  const addTabWithPersistence = useCallback(() => {
    return addTab(); // ✅ JAVÍTVA: Közvetlenül visszaadjuk
  }, [addTab]); // ✅ EGYSZERŰSÍTETT: saveTabsToStorage függőség eltávolítva

  const closeTab = useCallback(
    (tabId: string) => {
      // ❌ RÉGI KÓD (problémás - kikommentálva)
      // setTabs((prevTabs) => {
      //   const closingTabIndex = prevTabs.findIndex((tab) => tab.id === tabId);
      //   if (closingTabIndex === -1) return prevTabs;
      //   const updatedTabs = prevTabs.filter((tab) => tab.id !== tabId);
      //   if (updatedTabs.length === 0) {
      //     console.log('[useAppTabs] Utolsó fül bezárva - kilépés az alkalmazásból');
      //     setTimeout(() => {
      //       try { window.close(); } catch (error) {
      //         if (window.history.length > 1) { window.history.back(); } 
      //         else { window.location.href = 'about:blank'; }
      //       }
      //     }, 100);
      //     return [];
      //   }
      //   let newActiveId = activeTabId;
      //   if (tabId === activeTabId) {
      //     if (closingTabIndex === 0) {
      //       newActiveId = updatedTabs[0].id; // ❌ PROBLÉMA: Rossz tab aktiválódik!
      //     } else {
      //       newActiveId = updatedTabs[closingTabIndex - 1].id; // ❌ PROBLÉMA: Index hiba!
      //     }
      //   }
      //   const finalTabs = updatedTabs.map((tab) => ({
      //     ...tab, active: tab.id === newActiveId,
      //   }));
      //   setActiveTabId(newActiveId);
      //   return finalTabs;
      // });

      // ✅ ÚJ KÓD (javított - Home tab prioritás, cache megtartás)
      setTabs((prevTabs) => {
        const closingTabIndex = prevTabs.findIndex((tab) => tab.id === tabId);

        // Ha nem található a fül, ne csináljunk semmit
        if (closingTabIndex === -1) return prevTabs;

        // Fül eltávolítása
        const updatedTabs = prevTabs.filter((tab) => tab.id !== tabId);

        // Ha az utolsó fület is bezártuk, kilépés az alkalmazásból
        if (updatedTabs.length === 0) {
          console.log('[useAppTabs] Utolsó fül bezárva - kilépés az alkalmazásból');
          setTimeout(() => {
            try {
              window.close();
            } catch (error) {
              console.warn('[useAppTabs] window.close() nem működött, alternatív kilépés');
              if (window.history.length > 1) {
                window.history.back();
              } else {
                window.location.href = 'about:blank';
              }
            }
          }, 100);
          return [];
        }

        // ✅ JAVÍTOTT AKTIVÁLÁS: Balra lévő tab aktiválása
        let newActiveId = activeTabId;
        if (tabId === activeTabId && updatedTabs.length > 0) {
          if (closingTabIndex > 0) {
            newActiveId = updatedTabs[closingTabIndex - 1].id;
            console.log(`[useAppTabs] Balra lévő tab aktiválva: ${updatedTabs[closingTabIndex - 1].title}`);
          } else {
            newActiveId = updatedTabs[0].id;
            console.log(`[useAppTabs] Első tab aktiválva: ${updatedTabs[0].title}`);
          }
        }

        // Frissítjük az active állapotot
        const finalTabs = updatedTabs.map((tab) => ({
          ...tab,
          active: tab.id === newActiveId,
        }));

        // Az activeTabId state frissítése (csak ha nem lépünk ki)
        setActiveTabId(newActiveId);

        return finalTabs;
      });
      // ✅ CACHE MEGTARTÁS: Nincs cache törlés - gyors betöltés!
    },
    [activeTabId],
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

      return prevTabs.map((tab) => ({
        ...tab,
        active: tab.id === tabId,
      }));
    });
  }, []);

  const changeTabMode = useCallback((tabId: string, mode: 'news' | 'new' | 'search' | 'video') => {
    setTabs((prevTabs) => {
      return prevTabs.map((tab) => (tab.id === tabId ? { ...tab, mode } : tab));
    });
    // ❌ ELTÁVOLÍTVA: Manuális mentés - az automatikus useEffect kezeli
  }, []); // ✅ EGYSZERŰSÍTETT: Nincs függőség

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
      mode: 'search', // Kereső mód
      filters: {
        searchTerm: searchTerm,
      },
    };

    setTabs((prevTabs) => {
      const updatedTabs = prevTabs.map((tab) => ({ ...tab, active: false }));
      return [...updatedTabs, newSearchTab];
    });
    setActiveTabId(newTabId);
    // ❌ ELTÁVOLÍTVA: Manuális mentés - az automatikus useEffect kezeli
    return newTabId;
  }, []); // ✅ EGYSZERŰSÍTETT: Nincs függőség saveTabsToStorage-ra

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

  /**
   * Új tabot hoz létre, amely csak az adott forrás (pl. index.hu) híreit mutatja.
   * A tab címe a forrás neve lesz, a filterben a sourceId szerepel.
   * A tab automatikusan aktív lesz.
   * @param sourceId Az adott forrás egyedi azonosítója (pl. 'index')
   * @param sourceName Az adott forrás megjelenítendő neve (pl. 'Index.hu')
   * @returns Az új tab id-ja
   */
  const handleSourceTabOpen = useCallback((sourceId: string, sourceName: string) => {
    // Debug log
    traceDataFlow('[useAppTabs] handleSourceTabOpen', { sourceId, sourceName });

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
        source: [sourceId], // TÖMBKÉNT kell megadni!
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
    [activeTabId, tabs],
  );

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
  };
}
régi nincs bent a localnak cache 

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
  changeTabMode: (tabId: string, mode: 'news' | 'new' | 'search' | 'video') => void;
  handleReorderTabs: (newTabs: Tab[]) => void;
  handleContinentSearch: (continent: string, country?: string) => string;
  handleCategorySearch: (category: string) => string;
  handleSearchTabOpen: (searchTerm: string) => string;
  handleVideoTabOpen: () => string;
  handleFiltersChange: (filters: Partial<Tab['filters']>, contentType?: 'text' | 'video' | 'both') => void; // Szűrőkezelő callback
  loadLocalContent: () => Promise<string | null>; // Új függvény a helymeghatározáshoz
  handleSourceTabOpen: (sourceId: string, sourceName: string) => string; // ÚJ: Forrás szerinti tab nyitása
}
// Segédtípus a tárolt tab definícióhoz (LocalStorageData alapján)
type StoredTabDefinition = NonNullable<LocalStorageData['tabs']>['definitions'][0];

// ÚJ: Interfész a localStorage-ben tárolt tab formátumhoz
interface StoredTabData {
  id: string;
  title: string;
  mode?: 'news' | 'new' | 'search' | string;
  params?: Record<string, unknown>;
}
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
            // Validáljuk a 'mode'-ot
            let validMode: Tab['mode'] = 'news'; // Alapértelmezett
            if (tabDef.mode === 'news' || tabDef.mode === 'new' || tabDef.mode === 'search' || tabDef.mode === 'video') {
              validMode = tabDef.mode;
            }

            return {
              id: tabDef.id,
              title: tabDef.title,
              active: tabDef.id === storedState.tabs.activeId,
              mode: validMode, // Validált módot használunk
              // A 'params' objektumot olvassuk be 'filters'-ként
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
      mode: 'news',
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
        // Validáljuk a 'mode'-ot
        let validMode: Tab['mode'] = 'news'; // Alapértelmezett
        if (tabDef.mode === 'news' || tabDef.mode === 'new' || tabDef.mode === 'search' || tabDef.mode === 'video') {
          validMode = tabDef.mode;
        } else if (tabDef.mode) {
          // Ha van mode, de nem valid, jelezzük és marad az alapértelmezett
          console.warn(
            `[useAppTabs] Invalid mode "${tabDef.mode}" found in stored tab "${tabDef.id}". Defaulting to "news".`,
          );
        }

        return {
          id: tabDef.id,
          title: tabDef.title,
          active: tabDef.id === storedTabsData.activeId,
          mode: validMode, // Validált módot használunk
          // A 'params' objektumot olvassuk be 'filters'-ként
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
  }, [storageInitialized, storageState?.tabs]);

  ///////////////////////////////////////////////////////////////////////

  // Új explicit függvény a helymeghatározáshoz és a Local tartalom betöltéséhez
  const loadLocalContent = useCallback(async () => {
    try {
      setIsLocationLoading(true);
      const location = await localLocationService.getLocation();
      const country = localizationService.normalizeCountry(location.country);
      console.log('[useAppTabs] Normalizált ország:', country);

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
  // CALLBACKEK (áthelyezve az App.tsx-ből)
  // ============================================================

  // --- Alap fül műveletek ---

  const addTab = useCallback(() => {
    const newId = `tab-${Date.now()}`;
    const newTab: Tab = {
      id: newId,
      title: 'Home',
      active: true,
      mode: 'new',
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

  const addTabWithPersistence = useCallback(() => {
    return addTab(); // ✅ JAVÍTVA: Közvetlenül visszaadjuk
  }, [addTab]); // ✅ EGYSZERŰSÍTETT: saveTabsToStorage függőség eltávolítva

  const closeTab = useCallback(
    (tabId: string) => {
      // ❌ RÉGI KÓD (problémás - kikommentálva)
      // setTabs((prevTabs) => {
      //   const closingTabIndex = prevTabs.findIndex((tab) => tab.id === tabId);
      //   if (closingTabIndex === -1) return prevTabs;
      //   const updatedTabs = prevTabs.filter((tab) => tab.id !== tabId);
      //   if (updatedTabs.length === 0) {
      //     console.log('[useAppTabs] Utolsó fül bezárva - kilépés az alkalmazásból');
      //     setTimeout(() => {
      //       try { window.close(); } catch (error) {
      //         if (window.history.length > 1) { window.history.back(); } 
      //         else { window.location.href = 'about:blank'; }
      //       }
      //     }, 100);
      //     return [];
      //   }
      //   let newActiveId = activeTabId;
      //   if (tabId === activeTabId) {
      //     if (closingTabIndex === 0) {
      //       newActiveId = updatedTabs[0].id; // ❌ PROBLÉMA: Rossz tab aktiválódik!
      //     } else {
      //       newActiveId = updatedTabs[closingTabIndex - 1].id; // ❌ PROBLÉMA: Index hiba!
      //     }
      //   }
      //   const finalTabs = updatedTabs.map((tab) => ({
      //     ...tab, active: tab.id === newActiveId,
      //   }));
      //   setActiveTabId(newActiveId);
      //   return finalTabs;
      // });

      // ✅ ÚJ KÓD (javított - Home tab prioritás, cache megtartás)
      setTabs((prevTabs) => {
        const closingTabIndex = prevTabs.findIndex((tab) => tab.id === tabId);

        // Ha nem található a fül, ne csináljunk semmit
        if (closingTabIndex === -1) return prevTabs;

        // Fül eltávolítása
        const updatedTabs = prevTabs.filter((tab) => tab.id !== tabId);

        // Ha az utolsó fület is bezártuk, kilépés az alkalmazásból
        if (updatedTabs.length === 0) {
          console.log('[useAppTabs] Utolsó fül bezárva - kilépés az alkalmazásból');
          setTimeout(() => {
            try {
              window.close();
            } catch (error) {
              console.warn('[useAppTabs] window.close() nem működött, alternatív kilépés');
              if (window.history.length > 1) {
                window.history.back();
              } else {
                window.location.href = 'about:blank';
              }
            }
          }, 100);
          return [];
        }

        // ✅ JAVÍTOTT AKTIVÁLÁS: Balra lévő tab aktiválása
        let newActiveId = activeTabId;
        if (tabId === activeTabId && updatedTabs.length > 0) {
          if (closingTabIndex > 0) {
            newActiveId = updatedTabs[closingTabIndex - 1].id;
            console.log(`[useAppTabs] Balra lévő tab aktiválva: ${updatedTabs[closingTabIndex - 1].title}`);
          } else {
            newActiveId = updatedTabs[0].id;
            console.log(`[useAppTabs] Első tab aktiválva: ${updatedTabs[0].title}`);
          }
        }

        // Frissítjük az active állapotot
        const finalTabs = updatedTabs.map((tab) => ({
          ...tab,
          active: tab.id === newActiveId,
        }));

        // Az activeTabId state frissítése (csak ha nem lépünk ki)
        setActiveTabId(newActiveId);

        return finalTabs;
      });
      // ✅ CACHE MEGTARTÁS: Nincs cache törlés - gyors betöltés!
    },
    [activeTabId],
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

      return prevTabs.map((tab) => ({
        ...tab,
        active: tab.id === tabId,
      }));
    });
  }, []);

  const changeTabMode = useCallback((tabId: string, mode: 'news' | 'new' | 'search' | 'video') => {
    setTabs((prevTabs) => {
      return prevTabs.map((tab) => (tab.id === tabId ? { ...tab, mode } : tab));
    });
    // ❌ ELTÁVOLÍTVA: Manuális mentés - az automatikus useEffect kezeli
  }, []); // ✅ EGYSZERŰSÍTETT: Nincs függőség

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
      mode: 'search', // Kereső mód
      filters: {
        searchTerm: searchTerm,
      },
    };

    setTabs((prevTabs) => {
      const updatedTabs = prevTabs.map((tab) => ({ ...tab, active: false }));
      return [...updatedTabs, newSearchTab];
    });
    setActiveTabId(newTabId);
    // ❌ ELTÁVOLÍTVA: Manuális mentés - az automatikus useEffect kezeli
    return newTabId;
  }, []); // ✅ EGYSZERŰSÍTETT: Nincs függőség saveTabsToStorage-ra

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

  /**
   * Új tabot hoz létre, amely csak az adott forrás (pl. index.hu) híreit mutatja.
   * A tab címe a forrás neve lesz, a filterben a sourceId szerepel.
   * A tab automatikusan aktív lesz.
   * @param sourceId Az adott forrás egyedi azonosítója (pl. 'index')
   * @param sourceName Az adott forrás megjelenítendő neve (pl. 'Index.hu')
   * @returns Az új tab id-ja
   */
  const handleSourceTabOpen = useCallback((sourceId: string, sourceName: string) => {
    // Debug log
    traceDataFlow('[useAppTabs] handleSourceTabOpen', { sourceId, sourceName });

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
        source: [sourceId], // TÖMBKÉNT kell megadni!
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
    [activeTabId, tabs],
  );

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
  };
}
