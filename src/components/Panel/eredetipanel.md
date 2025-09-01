eredeti panel


// A szoftver-fejlesztésben fontos alapelv
// a YAGNI (You Aren't Gonna Need It)
// - ne vezess be komplexitást, amíg nincs rá valódi igény.
// nem törlünk ki semmit csak kommentáljuk ki ami nem kell!!! ha van ilyen!!
// src\components\Content\TabPanel.tsx (átnevezve Panelből)
import * as React from 'react';
import { PanelHead } from './PanelHead/PanelHead';
import panelStyles from './Panel.module.css';
import { Card } from '../Card/Card';
import { NewsItem } from '../../types';
import { HorizontalNewsScroller } from '../Card/NewsGroup/HorizontalNewsScroller';
import { useMediaQuery } from 'react-responsive';
import { useStorage } from '../../hooks/useStorage'; // ✅ JAVÍTOTT: helyes import útvonal
import { useTabStorage } from '../../hooks/useTabStorage/useTabStorage';
import Pagination from '../Pagination/Pagination'; // Import a Pagination komponens
import { SourceIconBar } from '../SourceIconBar/SourceIconBar'; // ÚJ: SourceIconBar import
// ÚJ: Import a kommunikációs hídhoz
import {
  settingsBridge,
  ITEMS_PER_PAGE_PREFERENCE_KEY,
} from '../Utility/Settings/ContentSettings/ContentSettingsPanelBridge';
import {
  timeSettingsBridge,
  MAX_AGE_HOURS_PREFERENCE_KEY,
} from '../Utility/Settings/ContentSettings/TimeSettings';
import { useDebugRender } from '../../utils/debugTools/debugTools';
import { injectAdsIntoNewsItems, AdCardItem } from '../Ad/AdCard';
import AdSenseLayout from '../Ad/AdCard/AdSenseLayout';
// ✅ ÚJ: LoadingProgressOverlay import
import LoadingProgressOverlay from '../LoadingProgressOverlay/LoadingProgressOverlay';

// TabPanelProps interfész (PanelProps-ból átnevezve)
interface TabPanelProps {
  activeTabId: string; // Added to allow scroll reset on pagination
  title: string;
  newsItems?: NewsItem[];
  loading?: boolean;
  error: Error | string | null | undefined;
  onRetry?: () => void;
  onToggleMenu?: (cardId: string | undefined, anchorEl: HTMLElement | null) => void;
  // ✅ ÚJ: Keresési mód támogatás
  searchResults?: NewsItem[]; // Keresési eredmények
  searchTerm?: string; // Keresési kifejezés
  isSearchMode?: boolean; // Keresési mód aktív
  onClearSearch?: () => void; // Keresés törlése callback
  isActive: boolean;
  // ✅ ÚJ: Pagination jelzés a Content.tsx-nek
  onPaginationChange?: (shouldScrollToTop: boolean) => void;
  // ✅ ÚJ: Forrás ikon gomb callback
  onSourceClick?: (sourceId?: string, source?: string) => void;
}

// ✅ ÚJ: Helyőrző komponens a BrowserView betöltése közben
function ArticlePlaceholder() {
  return (
    <div className={panelStyles.placeholderContainer}>
      <div className={panelStyles.loadingSpinner}></div>
      {/* <p>Cikk betöltése...</p> */}
    </div>
  );
}

export const TabPanel: React.FC<TabPanelProps> = ({
  activeTabId, // Added
  title,
  newsItems = [],
  loading = false,
  error = null,
  onRetry,
  onToggleMenu,
  // ✅ ÚJ: Keresési mód paraméterek kicsomagolása
  searchResults = [],
  searchTerm,
  isSearchMode = false,
  onClearSearch,
  isActive,
  // ✅ ÚJ: Pagination jelzés callback
  onPaginationChange,
  onSourceClick,
}) => {
  console.log('[Panel] Render, activeTabId:', activeTabId, 'newsItems:', newsItems.length, 'loading:', loading, 'error:', error);
  useDebugRender('Panel'); // <-- IDE!
  // ✅ ÚJ: Renderelési számláló
  const renderCountRef = React.useRef(0);
  renderCountRef.current++;
/*
  // ✅ ÚJ: Props változás követése
  const prevPropsRef = React.useRef<Record<string, string | number | boolean>>({});
  const currentProps = {
    activeTabId,
    isSearchMode,
    newsItems: newsItems.length,
    searchResults: searchResults.length,
    title,
    loading,
    error: !!error,
  };
*/
  // ✅ ÚJ: Hírek betöltöttségének követése
  const [newsLoaded, setNewsLoaded] = React.useState(false);

  // ✅ ÚJ: Hírek betöltöttségének figyelése
  React.useEffect(() => {
    if (newsItems && newsItems.length > 0) {
      setNewsLoaded(true);
    } else {
      setNewsLoaded(false);
    }
  }, [newsItems]);

  const isMobileOrTablet = useMediaQuery({ maxWidth: 1024 });
  const { getUserPreference } = useStorage(); // ✅ MÓDOSÍTÁS: saveScrollPosition eltávolítva
  const {
    savePaginationState,
    loadPaginationState,
    // ✅ JAVÍTÁS: currentActiveTabId eltávolítva, mert nem használjuk
  } = useTabStorage(); // ✅ ÚJ: Pagination hooks hozzáadása

  // Felhasználói beállítás a horizontális hírsáv megjelenítéséhez
  const [showHorizontalScroller, setShowHorizontalScroller] = React.useState<boolean>(false);

  // ÚJ: Oldalszámozás állapotok
  const [currentPage, setCurrentPage] = React.useState(1);
  const [itemsPerPage, setItemsPerPage] = React.useState(50); // Alapértelmezett: 50 hír/oldal

  // ÚJ: Időszűrés állapot - client-side szűréshez
  const [maxAgeHours, setMaxAgeHours] = React.useState(24); // Alapértelmezett: 24 óra

  // ✅ ÚJ: Panel referencia a lapozáskor való görgetéshez (ha kell)
  // const panelRef = React.useRef<HTMLDivElement>(null); // Ez a referencia nem volt használva a scroll kezeléshez

  // ✅ ÚJ: BrowserView állapot kezelése - hírkártyák elrejtése
  const [isArticleViewActive, setArticleViewActive] = React.useState(false);

  // ✅ JAVÍTÁS: Duplikáció védelem referenciák a bridge subscribe-hoz (VISSZAÁLLÍTVA)
  const subscribedRef = React.useRef(false);
  const mountedRef = React.useRef(false);
  const preferencesLoadedRef = React.useRef(false);
  const previousFilteredCountRef = React.useRef<number>(0);

  // ✅ ÚJ: Pagination állapot betöltése tab váltáskor
  React.useEffect(() => {
    // console.log(`[Panel] 🔄 useEffect PAGINATION futott - Tab: ${activeTabId}`);
    if (activeTabId && activeTabId !== 'default') {
      const paginationState = loadPaginationState(activeTabId);
      if (paginationState) {
        console.log(`[Panel] Pagination állapot visszaállítva: ${activeTabId} -> page ${paginationState.currentPage}, ${paginationState.itemsPerPage} items/page`);
        setCurrentPage(paginationState.currentPage);
        setItemsPerPage(paginationState.itemsPerPage);
      } else {
        console.log(`[Panel] Nincs mentett pagination állapot: ${activeTabId} -> visszaállítás az 1. oldalra`);
        setCurrentPage(1);
      }
    }
  }, [activeTabId, loadPaginationState]);

  // ✅ JAVÍTÁS: Bridge feliratkozások MEGINT STABILIZÁLVA - a régi logika alapján
  React.useEffect(() => {
    // DUPLA VÉDELEM: mount ÉS subscribe check - hogy a subscribe csak egyszer fusson le a komponens életciklusa alatt.
    if (subscribedRef.current || mountedRef.current) {
      console.log('[Panel] Bridge feliratkozások már aktívak, kihagyás');
      return;
    }
    
    mountedRef.current = true;
    subscribedRef.current = true;
    
    console.log('[Panel] Bridge feliratkozások inicializálása...');
    
    // Feliratkozunk a hírek számának változására
    const unsubscribeItemsPerPage = settingsBridge.subscribe((key, value) => {
      if (key === ITEMS_PER_PAGE_PREFERENCE_KEY) {
        console.log('Panel értesült a hírek/oldal beállítás változásáról:', value); // Log visszarakva!
        
        // Ellenőrizzük, hogy a kapott érték egy érvényes szám
        if (Number.isFinite(value) && value >= 1) {
          // Frissítjük az oldalankénti hírek számát
          setItemsPerPage(value);
          // Visszaállunk az első oldalra
          setCurrentPage(1);
          
          // ✅ ÚJ: Pagination állapot mentése beállítás változásakor
          if (activeTabId && activeTabId !== 'default') {
            savePaginationState(1, value, activeTabId);
          }
        }
      }
    });
    
    // ÚJ: Feliratkozás az időbeállítások változására
    const unsubscribeTimeSettings = timeSettingsBridge.subscribe((key, value) => {
      if (key === MAX_AGE_HOURS_PREFERENCE_KEY) {
        console.log('Panel értesült az időszűrés beállítás változásáról:', value); // Log visszarakva!
        
        // Ellenőrizzük, hogy a kapott érték egy érvényes szám
        if (Number.isFinite(value) && value >= 1) {
          // ✅ FONTOS: NINCS API hívás, csak állapot változik!
          setMaxAgeHours(value);
          // Visszaállunk az első oldalra
          setCurrentPage(1);
          
          // ✅ ÚJ: Pagination állapot mentése időszűrés változásakor
          if (activeTabId && activeTabId !== 'default') {
            savePaginationState(1, itemsPerPage, activeTabId);
          }
        }
      }
    });
    
    // Leiratkozás a komponens unmountoláskor
    return () => {
      console.log('[Panel] Bridge feliratkozások törlése...');
      mountedRef.current = false;
      subscribedRef.current = false;
      unsubscribeItemsPerPage();
      unsubscribeTimeSettings();
    };
  // A dependency array-ben maradhatnak, mert ezek a state változók befolyásolják a hook működését.
  // Ha valamiért újra kell futnia a hook-nak (pl. tab váltás), akkor ezek a függőségek ezt triggerelik.
  // A dupla védelem gondoskodik arról, hogy maga a subscribe log bénítóan ne fusson többször.
  }, [activeTabId, itemsPerPage, savePaginationState]); 
  
  // ✅ JAVÍTÁS: Beállítás betöltés EGYSZER FUTÓ optimalizálás
  React.useEffect(() => {
    // console.log(`[Panel] 🔄 useEffect PREFERENCES futott - Tab: ${activeTabId}`);
    // DUPLIKÁCIÓ VÉDELEM: Ha már betöltöttük a beállításokat, ne csináljuk újra
    if (preferencesLoadedRef.current) {
      // console.log('[Panel] Beállítások már betöltve, kihagyás');
      return;
    }
    preferencesLoadedRef.current = true;

    const loadPreferences = async () => {
      try {
        // console.log('[Panel] Beállítások betöltése kezdése...');

        // ✅ JAVÍTÁS: Cognitive Complexity csökkentése - helper funkciók
        await loadScrollerPreference();
        await loadItemsPerPagePreference();
        await loadTimePreference();

        // console.log('[Panel] Beállítások betöltése befejezve');
      } catch {
        // console.error('Hiba a beállítások betöltésekor a Panelben:', error);
        setItemsPerPage(50);
        setMaxAgeHours(24);
      }
    };

    // ÚJ: HELPER FUNKCIÓK: Cognitive Complexity csökkentése
    const loadScrollerPreference = async () => {
      try {
        // Új ultra-gyors cache metódus használata
        const dataManager = (await import('../../utils/datamanager/manager')).DataManager.getInstance();
        const scrollerValue = await dataManager.getHorizontalScroller();
        setShowHorizontalScroller(scrollerValue);
        console.log(`[Panel] Horizontal scroller betöltve (cache): ${scrollerValue}`);
      } catch (error) {
        console.error('[Panel] Horizontal scroller betöltési hiba:', error);
        // Fallback: eredeti metódus
        const scrollerPref = await getUserPreference('user_showHorizontalScroller');
        if (scrollerPref?.value !== undefined) {
          setShowHorizontalScroller(Boolean(scrollerPref.value));
        }
      }
    };

    const loadItemsPerPagePreference = async () => {
      const itemsPerPagePref = await getUserPreference('user_itemsPerPage');
      // console.log('Panel betöltött hírek/oldal beállítás:', itemsPerPagePref);

      if (itemsPerPagePref && itemsPerPagePref.value !== undefined) {
        const value = Number(itemsPerPagePref.value);
        // console.log('Beállított hírek/oldal érték:', value);

        if (Number.isFinite(value) && value >= 1) {
          // console.log('Hírek/oldal érték alkalmazása:', value);
          setItemsPerPage(value);
        } else {
          // console.warn('Érvénytelen hírek/oldal érték, alapértelmezett (50) használata:', value);
          setItemsPerPage(50);
        }
      } else {
        // Fallback a localStorage-ra
        const savedLimit = localStorage.getItem('newsLimit');
        if (savedLimit) {
          const limitValue = Number(savedLimit);
          if (Number.isFinite(limitValue) && limitValue >= 1) {
            // console.log('Hírek/oldal érték betöltve localStorage-ból:', limitValue);
            setItemsPerPage(limitValue);
          } else {
            setItemsPerPage(50);
          }
        } else {
          // console.log('Nincs beállítva hírek/oldal érték, alapértelmezett (50) használata');
          setItemsPerPage(50);
        }
      }
    };

    const loadTimePreference = async () => {
      const maxAgeHoursPref = await getUserPreference('user_maxAgeHours');
      // console.log('Panel betöltött időszűrés beállítás:', maxAgeHoursPref);

      if (maxAgeHoursPref && maxAgeHoursPref.value !== undefined) {
        const value = Number(maxAgeHoursPref.value);
        // console.log('Beállított időszűrés érték:', value);

        if (Number.isFinite(value) && value >= 1) {
          // console.log('Időszűrés érték alkalmazása:', value);
          setMaxAgeHours(value);
        } else {
          // console.warn('Érvénytelen időszűrés érték, alapértelmezett (24) használata:', value);
          setMaxAgeHours(24);
        }
      } else {
        // Fallback a localStorage-ra
        const savedMaxAge = localStorage.getItem('maxAgeHours');
        if (savedMaxAge) {
          const ageValue = Number(savedMaxAge);
          if (Number.isFinite(ageValue) && ageValue >= 1) {
            // console.log('Időszűrés érték betöltve localStorage-ból:', ageValue);
            setMaxAgeHours(ageValue);
          } else {
            setMaxAgeHours(24);
          }
        } else {
          // console.log('Nincs beállítva időszűrés érték, alapértelmezett (24) használata');
          setMaxAgeHours(24);
        }
      }
    };

    loadPreferences();
  }, [getUserPreference, activeTabId]); // ✅ JAVÍTÁS: getUserPreference dependency hozzáadva

  // Betöltés kezdetéről értesítés - nincs változás
  React.useEffect(() => {
    // console.log(`[Panel] 🔄 useEffect LOADING futott - Tab: ${activeTabId}, loading: ${loading}`);
    if (loading) {
      // console.log(`"${title}" panelben adatok betöltése...`);
    }
  }, [activeTabId, loading]); // ✅ JAVÍTÁS: title eltávolítva a dependency-ből

  // ✅ useCallback a stabil referenciákért - Oldal váltás kezelése
  const handlePageChange = React.useCallback((newPage: number) => { // useCallback visszarakva
    // console.log('Panel - Oldal váltás:', newPage);
    setCurrentPage(newPage);

    // ✅ ÚJ: Pagination állapot mentése oldal váltáskor
    if (activeTabId && activeTabId !== 'default') {
      savePaginationState(newPage, itemsPerPage, activeTabId);
      // console.log(
      //   `[Panel] Pagination állapot mentve: ${activeTabId} -> page ${newPage}, ${itemsPerPage} items/page`,
      // );
    }

      // ✅ ÚJ: Pagination jelzés a Content.tsx-nek
  if (onPaginationChange) {
    // ✅ JAVÍTÁS: Logolás csak development-ben
    if (process.env.NODE_ENV === 'development') {
      console.log('✅ Panel - Pagination történt, jelzés küldése a Content.tsx-nek');
    }
    onPaginationChange(true); // true = scroll a tetejére
  }

  // ✅ JAVÍTÁS: NEM küldünk scrollToTop event-et!
  // A scroll kezelést a ScrollContainer végzi a shouldScrollToTopOnPagination prop alapján
  if (process.env.NODE_ENV === 'development') {
    console.log('✅ Panel - Pagination tartalom frissítve, scroll kezelés a ScrollContainer-re bízva');
  }

  }, [activeTabId, itemsPerPage, savePaginationState, onPaginationChange]); // ✅ ÚJ: onPaginationChange dependency

  // ✅ MÓDOSÍTOTT: Ha változnak a hírek, NE állítsuk vissza az oldalt automatikusan
  // React.useEffect(() => {
  //   setCurrentPage(1);
  // }, [newsItems]);

  // ✅ ÚJ: Csak akkor állítsuk vissza az oldalt, ha a hírek száma jelentősen változott
  React.useEffect(() => {
    // console.log(
    //   `[Panel] 🔄 useEffect NEWSITEMS futott - Tab: ${activeTabId}, newsItems: ${newsItems.length}`,
    // );
    if (newsItems.length === 0) {
      // Ha nincs hír, visszaállunk az első oldalra
      setCurrentPage(1);
      if (activeTabId && activeTabId !== 'default') {
        savePaginationState(1, itemsPerPage, activeTabId);
      }
    }
  }, [activeTabId, newsItems.length, itemsPerPage, savePaginationState]); // ✅ JAVÍTÁS: savePaginationState eltávolítva dependency-ből

  // Egyedi források kigyűjtése - nincs változás
  const extractSources = React.useMemo(() => {
    if (!newsItems || newsItems.length === 0) return [];

    const uniqueSources = new Map();

    newsItems.forEach((item) => {
      if (item.sourceId && item.source && !uniqueSources.has(item.sourceId)) {
        uniqueSources.set(item.sourceId, {
          id: item.sourceId,
          name: item.source,
          domain: item.url
            ? (() => {
                try {
                  return new URL(item.url).hostname;
                } catch {
                  return undefined;
                }
              })()
            : undefined,
        });
      }
    });

    return Array.from(uniqueSources.values());
  }, [newsItems]);
//////////////////////////////////////////////////////////////////////

  // ✅ JAVÍTÁS: useMemo console.log optimalizálása - csak értékes változásoknál
  const { filteredItems, pageItems, totalPages, calculatedValidPage } = React.useMemo(() => {
    // ✅ ÚJ: KERESÉSI MÓD - HIBRID LOGIKA KIKOMMENTÁLVA
    let sourceItems: NewsItem[] = [];

    if (isSearchMode && searchResults.length > 0) {
      // KERESÉSI MÓD: CSAK keresési eredmények (hibrid logika kikommentálva)
      // console.log(`[Panel] KERESÉSI MÓD AKTÍV: ${searchResults.length} találat`);

      // 1. ✅ Keresési eredmények elöl
      const searchResultsWithFlag = searchResults.map((item) => ({
        ...item,
        isSearchResult: true, // Flag a vizuális elkülönítéshez
      }));

      sourceItems = searchResultsWithFlag;
      // console.log(`[Panel] Tiszta keresési nézet: ${sourceItems.length} releváns hír`);
    } else if (isSearchMode && searchResults.length === 0) {
    
      sourceItems = [];
    } else {
      // NORMÁL MÓD: Csak eredeti hírek
      sourceItems = newsItems;
    }

    // 1. IDŐSZŰRÉS: Szűrjük a híreket időalapján (client-side)
    const cutoffTimestamp = Date.now() - maxAgeHours * 60 * 60 * 1000;

    const filteredByTime = sourceItems.filter((item) => {
      // timestamp mező ellenőrzése
      if (item.timestamp && typeof item.timestamp === 'number') {
        return item.timestamp > cutoffTimestamp;
      }

      // Ha nincs timestamp, próbáljuk a date mezőt
      if (item.date) {
        const itemTimestamp = new Date(item.date).getTime();
        return itemTimestamp > cutoffTimestamp;
      }

      // Ha nincs sem timestamp, sem date, megtartjuk (régi hírek)
      return true;
    });

    // 2. OLDALSZÁMOZÁS: Az időszűrt hírekből számoljuk az oldalakat
    const totalItems = filteredByTime.length;
    const totalPages = Math.max(1, Math.ceil(totalItems / itemsPerPage));

    // ✅ KRITIKUS JAVÍTÁS: Aktuális oldal nem lehet nagyobb, mint a teljes oldalak száma
    // DE NE FRISSÍTSÜK ITT A STATE-ET! Csak számoljuk ki.
    const calculatedValidPage = Math.min(currentPage, totalPages);

    // Számítsuk ki az aktuális oldal híreinek kezdő és végső indexét
    const startIndex = (calculatedValidPage - 1) * itemsPerPage;
    const endIndex = Math.min(startIndex + itemsPerPage, totalItems);

    const result = {
      filteredItems: filteredByTime,
      pageItems: filteredByTime.slice(startIndex, endIndex),
      totalPages,
      calculatedValidPage, // ✅ JAVÍTÁS: calculatedValidPage helyett validCurrentPage
    };

    // ✅ OPTIMALIZÁLT LOG: Csak ha ténylegesen változott a szűrt hírek száma az előző futáshoz képest
    if (result.filteredItems.length !== previousFilteredCountRef.current) {
    // console.log(`[Panel] KERESÉSI+IDŐSZŰRÉS (${maxAgeHours}h): ${previousFilteredCountRef.current} → ${result.filteredItems.length} hír`);
       previousFilteredCountRef.current = result.filteredItems.length;
       }

    return result;
  }, [newsItems, searchResults, isSearchMode, maxAgeHours, currentPage, itemsPerPage]);

  // Különválasztjuk a képes és kép nélküli híreket az aktuális oldal híreiből
 // const newsWithImages = pageItems.filter((item) => item.imageUrl);
 // const newsWithoutImages = pageItems.filter((item) => !item.imageUrl);

  /*
  // Kép nélküli hírek csoportosítása (3 hírenként)
  const newsGroups: NewsItem[][] = [];
  for (let i = 0; i < newsWithoutImages.length; i += 3) {
    newsGroups.push(newsWithoutImages.slice(i, i + 3));
  }
    */
/*
  // Összefűzzük a képes híreket és a kép nélküli csoportokat
  const mixedNewsItems: Array<
    { type: 'image'; item: NewsItem } | { type: 'noImage'; items: NewsItem[] }
  > = [
    ...newsWithImages.map((item) => ({
      type: 'image' as const,
      item,
    })),
    ...newsGroups.map((group) => ({
      type: 'noImage' as const,
      items: group,
    })),
  ];
*/
  // ÚJ: Reklámkártyák beszúrása a hírek közé
  const itemsWithAds = React.useMemo(() => injectAdsIntoNewsItems(pageItems, 5, 10), [pageItems]);

  // ÚJ: Valódi kép nélküli hírek kiválasztása a scrollerhez
  // (itt nem szűrjük oldalak szerint, mindig az első 5-öt mutatjuk)
  const newsForScroller: NewsItem[] = newsItems.filter((item) => !item.imageUrl).slice(0, 5);

  // Meghatározzuk, hogy a HorizontalNewsScroller látható-e
  const canShowHorizontalScroller =
    (process.env.NODE_ENV === 'development' || showHorizontalScroller) &&
    isMobileOrTablet &&
    newsForScroller &&
    newsForScroller.length >= 4;

  // ✅ ÚJ: Card kattintás esemény kezelése - 3 mód támogatás + BrowserView állapot kezelés
  const handleCardClick = React.useCallback(async (url?: string) => { // useCallback visszarakva
    if (!url) return;
    
    console.log('[Panel] Card clicked:', { url, activeTabId });
    
    // ✅ 1. LÉPÉS: Azonnal elrejtjük a kártyákat a state beállításával
    setArticleViewActive(true);
    
    // Várjunk egy render ciklust, hogy a DOM frissüljön és a placeholder megjelenjen
    await new Promise(resolve => setTimeout(resolve, 0));
    
 
    // ✅ 2. LÉPÉS: Electron API hívás a beállítások alapján
    if (window.electronAPI && window.electronAPI.openArticleByPreference) {
      window.electronAPI.openArticleByPreference(url, { x: 0, y: 0, width: window.innerWidth, height: window.innerHeight });
    } else {
      // Fallback: új ablak megnyitása
      window.open(url, '_blank', 'noopener,noreferrer');
      setArticleViewActive(false); // Visszaállítjuk az állapotot
    }
  }, [activeTabId]);

  // ✅ ÚJ: BrowserView reszponzivitás - pozíció frissítése ablakméret változásakor
  React.useEffect(() => {
    if (!isArticleViewActive) return;
    let resizeTimeout: NodeJS.Timeout;
    const handleResize = () => {
      clearTimeout(resizeTimeout);
      resizeTimeout = setTimeout(() => {
        // if (!panelRef.current || !window.electronAPI?.positionBrowserView) return;
        // const panelRect = panelRef.current.getBoundingClientRect();
        // const tabContentRect = {
        //   x: panelRect.left,
        //   y: panelRect.top,
        //   width: panelRect.width,
        //   height: panelRect.height
        // };
        // window.electronAPI.positionBrowserView(tabContentRect);
      }, 50);
    };
    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
      clearTimeout(resizeTimeout);
    };
  }, [isArticleViewActive]);

  // --- Stabil Card onClick handlerek useMemo-val ---
  const cardClickHandlers = React.useMemo(() => {
    const handlers = new Map<string, () => void>();
    itemsWithAds.forEach((item: NewsItem | AdCardItem) => {
      if ((item as AdCardItem).type !== 'ad') {
        const news = item as NewsItem;
        if (news.id) {
          handlers.set(news.id, () => handleCardClick(news.url));
        }
      }
    });
    return handlers;
  }, [itemsWithAds, handleCardClick]);

  // ✅ ÚJ: Scroll pozíció mentés a Panel-ben
 // const panelContentRef = React.useRef<HTMLDivElement>(null);
  
  if (!isActive) return null; // Ezt a sort most még meghagyjuk, de a végső refaktorban elhagyható lesz!

  // ✅ TERMINÁL OVERLAY - ugyanaz a feltétel mint a Loading news volt!
  if (loading && (!newsItems || newsItems.length === 0)) {
    return (
      <LoadingProgressOverlay 
        country={title || "Loading"}
        hideOverlay={newsLoaded}
      />
    );
  }

  /*
  // RÉGI LOADING SPINNER - KIKOMMENTÁLVA
  if (loading && (!newsItems || newsItems.length === 0)) {
    return (
      <div className={panelStyles.loadingContainer}>
        <div className={panelStyles.loadingSpinner}></div>
        <p>Loading news...</p>
      </div>
    );
  }
  */

  return (
    <div className={panelStyles.panel}>
      <PanelHead title={title} onRefresh={onRetry} sources={extractSources} />
      <div className={panelStyles.sourceIconBarContainer}>
        <SourceIconBar sources={extractSources} />
      </div>
      {canShowHorizontalScroller && (
        <div
          style={{
            border: 'none',
            padding: '2px',
            marginBottom: '4px',
            marginTop: '4px',
          }}
        >
          <HorizontalNewsScroller news={newsForScroller} minItemsToShow={4} />
        </div>
      )}
      <div className={panelStyles.panelContent}>
        {/* Kis spinner, ha loading és van cache */}
        {loading && newsItems.length > 0 && (
          <div className={panelStyles.smallSpinner} title="Frissítés folyamatban..." />
        )}
        {/* ✅ ÚJ: Feltételes renderelés az isArticleViewActive alapján */}
        {isArticleViewActive ? (
          <ArticlePlaceholder />
        ) : (
          <>
            {error ? (
              <div className={panelStyles.errorContainer}>
                <p className={panelStyles.errorMessage}>
                  {error instanceof Error ? error.message : error}
                </p>
                <button className={panelStyles.retryButton} onClick={onRetry}>
                  Retry
                </button>
              </div>
            ) : newsItems.length > 0 || (isSearchMode && searchResults.length > 0) ? (
              <>
                {isSearchMode && (
                  <div className={panelStyles.searchModeHeader}>
                    {searchResults.length > 0 ? (
                      <>
                        <div className={panelStyles.searchResultsInfo}>
                          🔍 <strong>{searchResults.length} results</strong>
                          {searchTerm && ` for "${searchTerm}"`}
                        </div>
                        {onClearSearch && (
                          <button
                            className={panelStyles.clearSearchButton}
                            onClick={onClearSearch}
                            title="Back to all news"
                          >
                            ✕ Clear search
                          </button>
                        )}
                      </>
                    ) : (
                      <>
                        <div className={panelStyles.noSearchResults}>
                          🔍 <strong>No results found</strong>
                          {searchTerm && ` for "${searchTerm}"`}
                        </div>
                        {onClearSearch && (
                          <button
                            className={panelStyles.clearSearchButton}
                            onClick={onClearSearch}
                            title="Back to all news"
                          >
                            ← Back to all news
                          </button>
                        )}
                      </>
                    )}
                  </div>
                )}
                <div className={panelStyles.cardsContainer}>
                  {itemsWithAds.map((item, index) => {
                    if ((item as AdCardItem).type === 'ad') {
                      const ad = item as AdCardItem;
                      return (
                        <AdSenseLayout
                          key={`ad-${ad.id}`}
                          slotId={ad.slotId || '1234567890'}
                          badgeLabel="Ad"
                          debug={process.env.NODE_ENV !== 'production'}
                        />
                      );
                    } else {
                      const news = item as NewsItem;
                      return (
                        <Card
                          key={news.id || index}
                          {...news}
                          onClick={news.id ? cardClickHandlers.get(news.id) : undefined}
                          onToggleMenu={onToggleMenu}
                          onSourceClick={onSourceClick}
                        />
                      );
                    }
                  })}
                </div>
                {/* Pagination és statisztika mindig jelenjen meg, ha van hír */}
                {filteredItems.length > 0 && (
                  <div className={panelStyles.paginationContainer}>
                    {/* Statisztika a pagination gombok FÖLÉ */}
                    <div className={panelStyles.pageInfo}>
                      Total {filteredItems.length} articles ({newsItems.length - filteredItems.length}{' '}
                      filtered) | {(calculatedValidPage - 1) * itemsPerPage + 1}-
                      {Math.min(calculatedValidPage * itemsPerPage, filteredItems.length)} displayed
                    </div>
                    <Pagination
                      currentPage={calculatedValidPage}
                      totalPages={totalPages}
                      onPageChange={handlePageChange}
                      displayRange={1}
                    />
                  </div>
                )}


              </>
            ) : (
              <div className={panelStyles.placeholderText}>
                Welcome to the European News Aggregator! Please select a topic or source to display
                news.
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

// A React.memo comparison function is kept as is, assuming it's optimized correctly.
export default React.memo(TabPanel, (prev, next) => {
  // Összehasonlítás a releváns propok alapján, hogy elkerüljük a felesleges újrarajzolást.
  // A newsItems és searchResults tömbök hosszának ellenőrzése jó kezdés.
  // A null-safe access (?.) és a default length (?? 0) használata fontos.
  const prevNewsLength = prev.newsItems?.length ?? 0;
  const nextNewsLength = next.newsItems?.length ?? 0;
  const prevSearchResultsLength = prev.searchResults?.length ?? 0;
  const nextSearchResultsLength = next.searchResults?.length ?? 0;

  return (
    prev.activeTabId === next.activeTabId &&
    prev.title === next.title &&
    prev.loading === next.loading &&
    prev.error === next.error &&
    prev.searchTerm === next.searchTerm &&
    prev.isSearchMode === next.isSearchMode &&
    prevNewsLength === nextNewsLength &&
    prevSearchResultsLength === nextSearchResultsLength &&
    (prevNewsLength === 0 || (prev.newsItems?.[0]?.id === next.newsItems?.[0]?.id && prev.newsItems?.[prevNewsLength - 1]?.id === next.newsItems?.[nextNewsLength - 1]?.id)) &&
    (prevSearchResultsLength === 0 || (prev.searchResults?.[0]?.id === next.searchResults?.[0]?.id && prev.searchResults?.[prevSearchResultsLength - 1]?.id === next.searchResults?.[nextSearchResultsLength - 1]?.id)) &&
    prev.onSourceClick === next.onSourceClick // ÚJ: forrás gomb callback összehasonlítás
  );
});