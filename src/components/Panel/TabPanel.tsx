// src\components\Panel\TabPanel.tsx
import * as React from 'react';
import { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Tab, NewsItem } from '../../types';
import type { SearchFilters } from '../../hooks/useSearchFilters';
import { useNewsData } from '../Content/hooks/useNewsData';
import { useVideoData } from '../VideoPanel/useVideoData';
import { useStorage } from '../../hooks/useStorage';
import { useTabCache } from '../../hooks/useTabStorage/useTabCache';
import { useNewsItemsHash } from '../../utils/useNewsItemsHash';
import { TabContentData } from '../../utils/datamanager/storage/indexedDBTypes';
import { PanelHead } from '../Panel/PanelHead/PanelHead';
import { Card } from '../Card/Card';
import Pagination from '../Pagination/Pagination';
import { SourceIconBar } from '../SourceIconBar/SourceIconBar';
import LoadingProgressOverlay from '../LoadingProgressOverlay/LoadingProgressOverlay';
import AdSenseLayout from '../Ad/AdCard/AdSenseLayout';
import panelStyles from '../Panel/Panel.module.css';
import { useMediaQuery } from 'react-responsive';
import { settingsBridge, ITEMS_PER_PAGE_PREFERENCE_KEY } from '../Utility/Settings/ContentSettings/ContentSettingsPanelBridge';
import { timeSettingsBridge, MAX_AGE_HOURS_PREFERENCE_KEY } from '../Utility/Settings/ContentSettings/TimeSettings';
import { useDebugRender } from '../../utils/debugTools/debugTools';
import { injectAdsIntoNewsItems, AdCardItem } from '../Ad/AdCard';
import { ScrollContainer } from '../ScrollContainer/ScrollContainer';
import TabController from '../Tabs/TabController';
import { useTabPagination } from '../../hooks/useTabStorage/useTabPagination';
import My from '../Tabs/Home/My/My';
import { searchFiltersBridge } from '../Utility/Settings/SearchFilters/SearchFiltersBridge';
import { searchResultsMetadataBridge, CountryMetadata } from '../Utility/Settings/SearchFilters/SearchResultsMetadataBridge';

interface TabPanelProps {
  tab: Tab;
  isActive: boolean;
  searchResults?: NewsItem[];
  searchTerm?: string;
  isSearchMode?: boolean;
  onClearSearch?: () => void;
  onToggleMenu?: (cardId: string | undefined, anchorEl: HTMLElement | null, cardEl?: HTMLElement | null) => void;
  onSourceClick?: (sourceId?: string, source?: string) => void;
  onRefreshRegister?: (isActive: boolean, refreshFn: () => Promise<number>) => void;
  onNewsItemsUpdate?: (newsItems: NewsItem[]) => void;
  onChangeTabMode?: (tabId: string, mode: 'news' | 'new' | 'video') => void;
  // ✅ ÚJ: jobb oldali panel megnyitása (SearchFilters számára)
  openRightPanelWithMode?: (mode: string, category?: string) => void;
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

const TabPanelComponent: React.FC<TabPanelProps> = ({
  tab,
  isActive,
  searchResults = [],
  searchTerm,
  isSearchMode,
  onClearSearch,
  onToggleMenu,
  onSourceClick,
  onRefreshRegister,
  onNewsItemsUpdate,
  onChangeTabMode,
  // ✅ ÚJ prop destrukturálása
  openRightPanelWithMode,
}) => {
  useDebugRender(`TabPanel (${tab.title})`);
  const { t } = useTranslation();
  const { id: activeTabId, title, mode, filters } = tab;

  // console.log('[TabPanel] Render, activeTabId:', activeTabId, 'isActive:', isActive, 'mode:', mode);

  // --- STATE-EK ÉS REF-EK ---
  const [paginationTrigger, setPaginationTrigger] = useState(0);
  const abortControllerRef = useRef<AbortController | null>(null);
  const [requestToken, setRequestToken] = useState<string>('');
  const [newsLoaded, setNewsLoaded] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(50);
  const [maxAgeHours, setMaxAgeHours] = useState(24);
  const [_showHorizontalScroller, setShowHorizontalScroller] = useState(false);
  const [isArticleViewActive, setArticleViewActive] = useState(false);

  // --- ÚJ ÁLLAPOTOK A DINAMIKUS SZŰRÉSHEZ ---
  const [dynamicResults, setDynamicResults] = useState<NewsItem[] | null>(null);
  const [_isFilteredSearch, _setIsFilteredSearch] = useState(false);
  // ✅ ÚJ: Szűrők tárolása local state-ben (ContentSettings mintája szerint)
  // countries: undefined = nincs szűrés; [] = explicit Deselect All
  const [currentFilters, setCurrentFilters] = useState<SearchFilters>({ lang: 'all', countries: undefined });

  // Utility hooks
  const _isMobileOrTablet = useMediaQuery({ maxWidth: 1024 });
  const { getUserPreference } = useStorage();
  
  // ✅ JAVÍTÁS: Specifikus hook-ok használata a useTabStorage helyett
  const { savePaginationState, loadPaginationState } = useTabPagination(activeTabId);
  const { saveTabContent } = useTabCache();
  const tabCache = useTabCache();

  // Bridge védő referenciák
  const subscribedRef = useRef(false);
  const mountedRef = useRef(false);
  const preferencesLoadedRef = useRef(false);
  const previousFilteredCountRef = useRef<number>(0);

  // Token management
  useEffect(() => {
    const controller = new AbortController();
    abortControllerRef.current = controller;
    const newToken = Math.random().toString(36).substring(2, 15);
    setRequestToken(newToken);
    console.log('[TabPanel] Token frissítve:', activeTabId, '->', newToken);
    return () => controller.abort();
  }, [activeTabId]);

  // --- ADATBETÖLTŐ HOOK-OK ---
  const {
    newsItems,
    loading: newsDataLoading,
    error: newsError,
    handleRetry,
    refreshNewsData,
    loadMoreSources,
    hasMoreSources,
  } = useNewsData({
    activeTab: tab,
    isNewTab: mode === 'new',
    activeTabId,
    requestToken,
    abortSignal: abortControllerRef.current?.signal,
    setNewsItemsToken: setRequestToken,
  });

  const {
    videoItems,
    loading: videoLoading,
    error: videoError,
    refreshVideos,
  } = useVideoData({
    activeTabId,
    isVideoMode: mode === 'video',
    country: (filters?.country as string) || null,
  });

  const loading = useMemo(() => mode === 'video' ? videoLoading : newsDataLoading, [mode, videoLoading, newsDataLoading]);
  const error = useMemo(() => mode === 'video' ? videoError : newsError, [mode, videoError, newsError]);

  // --- ÚJ, ÖSSZEVONT LOADING ÁLLAPOT ---
  const overallLoading = useMemo(() => {
    return loading; // ✅ Egyszerűsítve: csak a normál loading, nincs searchLoading
  }, [loading]);

  // --- CALLBACK-EK ---
  const handleConfigChange = useCallback((newMode: 'news' | 'browse' | 'search' | 'video') => {
    if (!onChangeTabMode) return;
    if (newMode === 'news' || newMode === 'video') {
      onChangeTabMode(activeTabId, newMode);
    } else if (newMode === 'browse') {
      onChangeTabMode(activeTabId, 'new');
    }
  }, [onChangeTabMode, activeTabId]);

  const handlePageChange = useCallback((newPage: number) => {
    setCurrentPage(newPage);
    if (activeTabId && activeTabId !== 'default') {
      savePaginationState(newPage, itemsPerPage, activeTabId);
    }
    setPaginationTrigger(prev => prev + 1);
  }, [activeTabId, itemsPerPage, savePaginationState]);

  const handleRefresh = useCallback(async (): Promise<number> => {
    setPaginationTrigger(p => p + 1);
    if (mode === 'video') {
      await refreshVideos();
      if (typeof window !== 'undefined') {
        try {
          const { ScrollStorage } = await import('../ScrollContainer/ScrollStorage');
          ScrollStorage.clear(`${activeTabId}-video`);
          setPaginationTrigger(p => p + 1);
        } catch (err) {
          console.warn('[TabPanel] ScrollStorage törlés hiba:', err);
        }
      }
      return videoItems?.length || 0;
    } else {
      const refreshed = await refreshNewsData(false);
      // Oldalszám visszaállítása az első oldalra frissítés után
      setCurrentPage(1);
      return refreshed?.length || 0;
    }
  }, [mode, refreshVideos, refreshNewsData, videoItems, activeTabId]);

  const handleCardClick = useCallback(async (url?: string) => {
    if (!url) return;
    
    console.log('[TabPanel] Card clicked:', { url, activeTabId });
    
    setArticleViewActive(true);
    await new Promise(resolve => setTimeout(resolve, 0));
    
    if (window.electronAPI && window.electronAPI.openArticleByPreference) {
      window.electronAPI.openArticleByPreference(url, { x: 0, y: 0, width: window.innerWidth, height: window.innerHeight });
    } else {
      window.open(url, '_blank', 'noopener,noreferrer');
      setArticleViewActive(false);
    }
  }, [activeTabId]);

  // --- LIFECYCLE HOOK-OK ---
  useEffect(() => {
    if (newsItems && newsItems.length > 0) {
      setNewsLoaded(true);
    } else {
      setNewsLoaded(false);
    }
  }, [newsItems]);

  useEffect(() => {
    if (onRefreshRegister) {
      onRefreshRegister(isActive, handleRefresh);
    }
  }, [isActive, handleRefresh, onRefreshRegister]);

  useEffect(() => {
    if (isActive && onNewsItemsUpdate && newsItems.length > 0) {
      onNewsItemsUpdate(newsItems);
    }
  }, [isActive, newsItems, onNewsItemsUpdate]);

  useEffect(() => {
    if (activeTabId && activeTabId !== 'default') {
      const paginationState = loadPaginationState(activeTabId);
      if (paginationState) {
        console.log(`[TabPanel] Pagination állapot visszaállítva: ${activeTabId} -> page ${paginationState.currentPage}, ${paginationState.itemsPerPage} items/page`);
        setCurrentPage(paginationState.currentPage);
        setItemsPerPage(paginationState.itemsPerPage);
      } else {
        console.log(`[TabPanel] Nincs mentett pagination állapot: ${activeTabId} -> visszaállítás az 1. oldalra`);
        setCurrentPage(1);
      }
    }
  }, [activeTabId, loadPaginationState]);

  // Bridge feliratkozások
  useEffect(() => {
    if (subscribedRef.current || mountedRef.current) {
      console.log('[TabPanel] Bridge feliratkozások már aktívak, kihagyás');
      return;
    }
    
    mountedRef.current = true;
    subscribedRef.current = true;
    
    console.log('[TabPanel] Bridge feliratkozások inicializálása...');
    
    const unsubscribeItemsPerPage = settingsBridge.subscribe((key, value) => {
      if (key === ITEMS_PER_PAGE_PREFERENCE_KEY) {
        console.log('TabPanel értesült a hírek/oldal beállítás változásáról:', value);
        
        if (Number.isFinite(value) && value >= 1) {
          setItemsPerPage(value);
          setCurrentPage(1);
          
          if (activeTabId && activeTabId !== 'default') {
            savePaginationState(1, value, activeTabId);
          }
        }
      }
    });
    
    const unsubscribeTimeSettings = timeSettingsBridge.subscribe((key, value) => {
      if (key === MAX_AGE_HOURS_PREFERENCE_KEY) {
        console.log('TabPanel értesült az időszűrés beállítás változásáról:', value);
        
        if (Number.isFinite(value) && value >= 1) {
          setMaxAgeHours(value);
          setCurrentPage(1);
          
          if (activeTabId && activeTabId !== 'default') {
            savePaginationState(1, itemsPerPage, activeTabId);
          }
        }
      }
    });
    
    // --- EZ A KRITIKUS, ÚJ RÉSZ ---
    const unsubscribeSearchFilters = searchFiltersBridge.subscribe((message) => {
      if (message.type === 'FILTER_CHANGE') {
        // ✅ ContentSettings mintája: Csak szűrők frissítése, API hívás nélkül
        console.log('[TabPanel] Szűrők frissítése:', message.filters);
        setCurrentFilters(message.filters);
        // Oldalszám visszaállítása az első oldalra szűrőváltozáskor
        setCurrentPage(1);
        if (activeTabId && activeTabId !== 'default') {
          savePaginationState(1, itemsPerPage, activeTabId);
        }
      }
    });
    
    return () => {
      console.log('[TabPanel] Bridge feliratkozások törlése...');
      mountedRef.current = false;
      subscribedRef.current = false;
      unsubscribeItemsPerPage();
      unsubscribeTimeSettings();
      unsubscribeSearchFilters(); // Leiratkozás
    };
  }, [activeTabId, itemsPerPage, savePaginationState]);

  // Preferences betöltése
  useEffect(() => {
    if (preferencesLoadedRef.current) {
      return;
    }
    preferencesLoadedRef.current = true;

    const loadScrollerPref = async () => {
      try {
        const dataManager = (await import('../../utils/datamanager/manager')).DataManager.getInstance();
        const scrollerValue = await dataManager.getHorizontalScroller();
        setShowHorizontalScroller(scrollerValue);
        console.log(`[TabPanel] Horizontal scroller betöltve (cache): ${scrollerValue}`);
        return;
      } catch (error) {
        console.error('[TabPanel] Horizontal scroller betöltési hiba:', error);
      }
      try {
        const scrollerPref = await getUserPreference('user_showHorizontalScroller');
        if (scrollerPref?.value !== undefined) {
          setShowHorizontalScroller(Boolean(scrollerPref.value));
        }
      } catch (err) {
        // ignore
      }
    };

    const loadItemsPerPagePref = async () => {
      try {
        const itemsPerPagePref = await getUserPreference('user_itemsPerPage');
        if (itemsPerPagePref && itemsPerPagePref.value !== undefined) {
          const value = Number(itemsPerPagePref.value);
          if (Number.isFinite(value) && value >= 1) {
            setItemsPerPage(value);
            return;
          }
        }
        const savedLimit = localStorage.getItem('newsLimit');
        if (savedLimit) {
          const limitValue = Number(savedLimit);
          if (Number.isFinite(limitValue) && limitValue >= 1) {
            setItemsPerPage(limitValue);
            return;
          }
        }
        setItemsPerPage(50);
      } catch (err) {
        setItemsPerPage(50);
      }
    };

    const loadMaxAgePref = async () => {
      try {
        const maxAgeHoursPref = await getUserPreference('user_maxAgeHours');
        if (maxAgeHoursPref && maxAgeHoursPref.value !== undefined) {
          const value = Number(maxAgeHoursPref.value);
          if (Number.isFinite(value) && value >= 1) {
            setMaxAgeHours(value);
            return;
          }
        }
        const savedMaxAge = localStorage.getItem('maxAgeHours');
        if (savedMaxAge) {
          const ageValue = Number(savedMaxAge);
          if (Number.isFinite(ageValue) && ageValue >= 1) {
            setMaxAgeHours(ageValue);
            return;
          }
        }
        setMaxAgeHours(24);
      } catch (err) {
        setMaxAgeHours(24);
      }
    };

    (async () => {
      await loadScrollerPref();
      await loadItemsPerPagePref();
      await loadMaxAgePref();
    })();
  }, [getUserPreference, activeTabId]);

  // News items változás kezelése
  useEffect(() => {
    if (newsItems.length === 0) {
      setCurrentPage(1);
      if (activeTabId && activeTabId !== 'default') {
        savePaginationState(1, itemsPerPage, activeTabId);
      }
    }
  }, [activeTabId, newsItems.length, itemsPerPage, savePaginationState]);

  // ✅ ÚJ: CACHE MENTÉSI LOGIKA - A megbeszélt megoldás
  const newsItemsHash = useNewsItemsHash(newsItems);
  
  useEffect(() => {
    // Csak akkor mentsünk, ha:
    // 1. A fül aktív (ne mentsünk a háttérben betöltődő, inaktív fülekről).
    // 2. Vannak hírek, amiket el lehet menteni.
    // 3. A fül 'news' módban van (videókat vagy 'new' fület nem mentünk itt).
    // 4. A betöltés már befejeződött.
    if (isActive && newsItems.length > 0 && mode === 'news' && !loading) {
      
      const tabContentData: TabContentData = {
        id: activeTabId,
        // Teljes NewsItem mentése minden mezővel!
        articles: (mode === 'news' ? newsItems : filteredItems).map(item => ({ ...item })),
        timestamp: Date.now(),
        meta: {
          lastFetched: Date.now(),
          originalNews: mode === 'news' ? newsItems : filteredItems,
          country: filters?.country,
          searchTerm: undefined, // csak news módban, így mindig undefined
          mode,
        },
      };
      
      console.log(`[TabPanel] ✅ Adatok mentése a cache-be: ${activeTabId}`);
      
      // ✅ JAVÍTOTT hívás - paraméterek helyes sorrendben
      saveTabContent(tabContentData, activeTabId, filters?.country)
        .then(() => {
          console.log(`[TabPanel] Cache mentés sikeres: ${activeTabId}`);
        })
        .catch(error => {
          console.warn(`[TabPanel] Cache mentési hiba:`, error);
        });
    }
  }, [
    isActive, 
    newsItems,
    
    newsItemsHash, // Ez biztosítja, hogy csak tartalomváltozáskor fusson le
    mode, 
    loading, 
    activeTabId, 
    filters?.country, 
    saveTabContent
  ]);

  // --- ORSZÁG OPCIÓK EGYSZERI KÜLDÉSE A SZŰRŐPANELNEK ---
  const optionsSentRef = useRef(false);
  useEffect(() => {
    if ((mode === 'search' || mode === 'home') && searchResults && searchResults.length > 0 && !optionsSentRef.current) {
      // ÚJ: TELJES CountryTagOption objektumok létrehozása string[] helyett
      const countryOptionsMap = new Map<string, { name: string; count: number }>();
      
      searchResults.forEach(item => {
        const code = item.countryCode || item.country;
        const name = item.country || item.countryCode;
        
        if (code && name) {
          if (!countryOptionsMap.has(code)) {
            countryOptionsMap.set(code, { name, count: 0 });
          }
          countryOptionsMap.get(code)!.count++;
        }
      });
      
      // CountryTagOption[] objektumok létrehozása
      const countryTagOptions = Array.from(countryOptionsMap.entries()).map(([code, data]) => ({
        code,
        name: data.name,
        count: data.count
      }));
      
      if (countryTagOptions.length > 0) {
        searchFiltersBridge.emitOptions(countryTagOptions); // ← JAVÍTVA: teljes objektumok
        optionsSentRef.current = true;
        console.log('[TabPanel] Ország opciók elküldve a SearchFilters-nek:', countryTagOptions);
      }
    }
    // Ha új keresés indul (új searchResults), reseteljük a flaget
    if ((mode === 'search' || mode === 'home') && (!searchResults || searchResults.length === 0)) {
      optionsSentRef.current = false;
    }
  }, [mode, searchResults]);

  // --- ADATFELDOLgoZÁS ---
  const extractSources = useMemo(() => {
    if (!newsItems || newsItems.length === 0) return [];
    const uniqueSources = new Map();
    newsItems.forEach((item: NewsItem) => {
      if (item.sourceId && item.source && !uniqueSources.has(item.sourceId)) {
        uniqueSources.set(item.sourceId, {
          id: item.sourceId,
          name: item.source,
          domain: item.url ? (() => {
            try { return new URL(item.url).hostname; } catch { return undefined; }
          })() : undefined,
        });
      }
    });
    return Array.from(uniqueSources.values());
  }, [newsItems]);

  const { filteredItems, pageItems, totalPages, calculatedValidPage } = useMemo(() => {
    let sourceItems: NewsItem[] = [];
    // --- PRIORITÁSOS LOGIKA ---
    if (mode === 'search' || mode === 'home') {
      if (dynamicResults !== null) {
        sourceItems = dynamicResults;
      } else if (searchResults.length > 0) {
        sourceItems = searchResults.map((item) => ({ ...item, isSearchResult: true }));
      }
    } else {
      sourceItems = newsItems;
    }

    // JAVÍTOTT SZŰRÉSI LOGIKA
    let filteredByCountry = sourceItems;

    if (mode === 'search' || mode === 'home') {
      
      // KULCS: Ha countries === [] (Deselect All), akkor ÜRES eredmény
      if (Array.isArray(currentFilters.countries) && currentFilters.countries.length === 0) {
        // Deselect All -> nincs találat látható
        filteredByCountry = [];
        console.log('[TabPanel] Országszűrés: DESELECT ALL - találatok elrejtve:', {
          originalCount: sourceItems.length,
          filteredCount: 0,
          selectedCountries: currentFilters.countries,
        });
      } 
      // Ha countries === undefined/null, akkor minden látszik (alapállapot)
      else if (!currentFilters.countries) {
        filteredByCountry = sourceItems;
        console.log('[TabPanel] Országszűrés: alapállapot - minden találat látszik:', {
          originalCount: sourceItems.length,
          filteredCount: sourceItems.length,
          selectedCountries: currentFilters.countries,
        });
      } 
      // Ha van kiválasztott ország(ok), akkor normál szűrés
      else {
        filteredByCountry = sourceItems.filter((item) => {
          const itemCountryCode = item.countryCode || item.country;
          return itemCountryCode && currentFilters.countries && currentFilters.countries.includes(itemCountryCode);
        });
        console.log('[TabPanel] Országszűrés alkalmazva keresésnél:', {
          originalCount: sourceItems.length,
          filteredCount: filteredByCountry.length,
          selectedCountries: currentFilters.countries,
        });
      }
    } else {
      // ...existing code for non-search/home modes...
    }

    // Időszűrés
    const cutoffTimestamp = Date.now() - maxAgeHours * 60 * 60 * 1000;
    const filteredByTime = filteredByCountry.filter((item) => {
      if (item.timestamp && typeof item.timestamp === 'number') {
        return item.timestamp > cutoffTimestamp;
      }
      if (item.date) {
        const itemTimestamp = new Date(item.date).getTime();
        return itemTimestamp > cutoffTimestamp;
      }
      return true;
    });

    // Idő szerinti rendezés (legújabb elöl)
    filteredByTime.sort((a, b) => {
      const aTime = a.timestamp ?? (a.date ? new Date(a.date).getTime() : 0);
      const bTime = b.timestamp ?? (b.date ? new Date(b.date).getTime() : 0);
      return bTime - aTime;
    });

    // Oldalszámozás
    const totalItems = filteredByTime.length;
    const totalPages = Math.max(1, Math.ceil(totalItems / itemsPerPage));
    const calculatedValidPage = Math.min(currentPage, totalPages);
    const startIndex = (calculatedValidPage - 1) * itemsPerPage;
    const endIndex = Math.min(startIndex + itemsPerPage, totalItems);

    const result = {
      filteredItems: filteredByTime,
      pageItems: filteredByTime.slice(startIndex, endIndex),
      totalPages,
      calculatedValidPage,
    };

    if (result.filteredItems.length !== previousFilteredCountRef.current) {
      previousFilteredCountRef.current = result.filteredItems.length;
    }

    return result;
  }, [newsItems, searchResults, maxAgeHours, currentPage, itemsPerPage, mode, dynamicResults, currentFilters]);

  const itemsWithAds = useMemo(() => injectAdsIntoNewsItems(pageItems, 5, 10), [pageItems]);

  // --- ÚJ: METAADATOK KISZÁMOLÁSA ÉS KÜLDÉSE A BRIDGE-EN ---
  useEffect(() => {
    if (isActive && (mode === 'search' || mode === 'home')) {
      let sourceItems: NewsItem[] = [];
      if (dynamicResults !== null) {
        sourceItems = dynamicResults;
      } else if (searchResults.length > 0) {
        sourceItems = searchResults; // ✅ JAVÍTVA: searchResults-ből dolgozunk, nem filteredItems-ből
      }

      if (sourceItems.length === 0) {
        searchResultsMetadataBridge.emitForTab(activeTabId, { countries: [] });
        return;
      }
      
      // ✅ JAVÍTVA: sourceItems-ből számolunk, nem filteredItems-ből
      const statItems = sourceItems; // A TELJES keresési eredményből
      
      const countryCounts: Record<string, { name: string; count: number }> = {};

      statItems.forEach((item) => {
        let code = item.countryCode || item.country;
        let name = item.country || item.countryCode;

        if (!code && !name) {
          return; 
        }
        // code = code || name || '';
        code = (code ?? name) ?? '';
        name = name || code;

        if (!countryCounts[code]) {
          countryCounts[code] = { name: name, count: 0 };
        }
        countryCounts[code].count++;
      });

      const countriesForFilter: CountryMetadata[] = Object.entries(countryCounts)
        .map(([code, data]) => ({
          code,
          name: data.name,
          count: data.count,
        }))
        .sort((a, b) => b.count - a.count);

      searchResultsMetadataBridge.emitForTab(activeTabId, {
        countries: countriesForFilter,
      });
    }
  }, [isActive, mode, searchResults, activeTabId, dynamicResults]); // ✅ JAVÍTVA: searchResults függőség, nem filteredItems

  // 1. Keresési kifejezés kinyerése a fül címéből
  const extractSearchTermFromTitle = useCallback((title: string): string => {
    // '🔍 war' -> 'war'
    const match = title.match(/🔍\s+(.+)/);
    return match ? match[1].trim() : '';
  }, []);

  // 2. Derived search term logika
  const derivedSearchTerm = useMemo(() => {
    if (searchTerm) return searchTerm;
    if (mode === 'home' || mode === 'search') {
      return extractSearchTermFromTitle(title);
    }
    return '';
  }, [searchTerm, mode, title, extractSearchTermFromTitle]);

  // 3. Módosított cache betöltési useEffect
  useEffect(() => {
    let cancelled = false;
    const isHomeSearch = mode === 'home' || mode === 'search';
    if (isActive && isHomeSearch && derivedSearchTerm && dynamicResults === null) {
      console.log('[TabPanel] Cache visszatöltési kísérlet:', {
        activeTabId,
        derivedSearchTerm,
        originalSearchTerm: searchTerm,
        title
      });
      (async () => {
        try {
          const cached = await tabCache.getTabContent(activeTabId);
          if (
            cached &&
            cached.meta &&
            cached.meta.searchTerm === derivedSearchTerm &&
            Array.isArray(cached.articles) &&
            cached.articles.length > 0
          ) {
            const newsItems: NewsItem[] = cached.articles.map((a: Partial<NewsItem>) => ({
              id: a.id || '',
              title: a.title || '',
              description: a.description || '',
              source: a.source || '',
              sourceId: a.sourceId || '',
              url: a.url || '',
              date: a.date || '',
              country: a.country || '',
              countryCode: a.countryCode || '',
              imageUrl: a.imageUrl || '',
              timestamp: a.timestamp || Date.now(),
              continent: a.continent || '',
            }));
            if (!cancelled) {
              setDynamicResults(newsItems);
              console.log('[TabPanel] 🔄 Home/search keresés cache visszatöltve:', {
                találatok: newsItems.length,
                searchTerm: derivedSearchTerm,
                activeTabId
              });
            }
          } else {
            console.log('[TabPanel] ❌ Cache nem található vagy nem egyezik:', {
              cachedExists: !!cached,
              cachedSearchTerm: cached?.meta?.searchTerm,
              expectedSearchTerm: derivedSearchTerm,
              articlesLength: cached?.articles?.length || 0
            });
            // Nincs szükség API hívásra - a hírek már be vannak töltve a cache-be
            console.log('[TabPanel] Cache nem található a keresett kifejezésre:', derivedSearchTerm);
          }
        } catch (err) {
          console.warn('[TabPanel] Hiba a keresési cache visszatöltésekor:', err);
        }
      })();
    }
    return () => { cancelled = true; };
  }, [isActive, mode, derivedSearchTerm, activeTabId, dynamicResults, tabCache, title, searchTerm]);

  // 4. Cache mentésnél is a derivedSearchTerm használata
  useEffect(() => {
    if (
      isActive &&
      !loading &&
      (
        (mode === 'news' && newsItems.length > 0) ||
        ((mode === 'search' || mode === 'home') && filteredItems.length > 0 && derivedSearchTerm)
      )
    ) {
      const tabContentData: TabContentData = {
        id: activeTabId,
        articles: (mode === 'news' ? newsItems : filteredItems).map(item => ({ ...item })),
        timestamp: Date.now(),
        meta: {
          lastFetched: Date.now(),
          originalNews: mode === 'news' ? newsItems : filteredItems,
          country: filters?.country,
          searchTerm: (mode === 'search' || mode === 'home') ? derivedSearchTerm : undefined,
          mode,
        },
      };
      console.log('[TabPanel] Cache mentése:', {
        activeTabId,
        searchTerm: derivedSearchTerm,
        articlesCount: tabContentData.articles.length,
        mode
      });
      saveTabContent(tabContentData, activeTabId, filters?.country)
        .then(() => {
          console.log(`[TabPanel] ✅ Cache mentés sikeres: ${activeTabId} (${derivedSearchTerm})`);
        })
        .catch(error => {
          console.warn(`[TabPanel] ❌ Cache mentési hiba:`, error);
        });
    }
  }, [
    isActive,
    newsItemsHash, // Csak a hash marad, így csak tartalomváltozáskor fut le
    mode,
    loading,
    activeTabId,
    filters?.country,
    saveTabContent,
    derivedSearchTerm
  ]);

  // --- HOME KERESÉS CACHE VISSZATÖLTÉS ---
  useEffect(() => {
    let cancelled = false;
    // A home keresés cache visszatöltése akkor is fusson le, ha a tab.mode 'home' vagy 'search'!
    const isHomeSearch = mode === 'home' || mode === 'search';
    if (isActive && isHomeSearch && searchTerm && dynamicResults === null) {
      (async () => {
        try {
          const cached = await tabCache.getTabContent(activeTabId);
          if (
            cached &&
            cached.meta &&
            cached.meta.searchTerm === searchTerm &&
            Array.isArray(cached.articles) &&
            cached.articles.length > 0
          ) {
            const newsItems: NewsItem[] = cached.articles.map((a: Partial<NewsItem>) => ({
              id: a.id || '',
              title: a.title || '',
              description: a.description || '',
              source: a.source || '',
              sourceId: a.sourceId || '',
              url: a.url || '',
              date: a.date || '',
              country: a.country || '',
              countryCode: a.countryCode || '',
              imageUrl: a.imageUrl || '',
              timestamp: a.timestamp || Date.now(),
              continent: a.continent || '',
            }));
            if (!cancelled) {
              setDynamicResults(newsItems);
              console.log('[TabPanel] 🔄 Home/search keresés cache visszatöltve:', newsItems.length, 'találat');
            }
          }
        } catch (err) {
          console.warn('[TabPanel] Hiba a keresési cache visszatöltésekor:', err);
        }
      })();
    }
    return () => { cancelled = true; };
  }, [isActive, mode, searchTerm, activeTabId, dynamicResults, tabCache]);

  // --- RENDER ---
  // ✅ Feltételes renderelés: ha a tab.mode 'my_page', csak a My komponenst jelenítsük meg
  if (tab.mode === 'my_page') {
    return <My />;
  }

  // Új: Kapcsoló, ami szabályozza az overlay megjelenését
  const shouldShowLoadingOverlayForMode = mode === 'news' || mode === 'search' || mode === 'home';

  return (
    <ScrollContainer
      activeTabId={activeTabId}
      isLoading={overallLoading}
      resetScrollTrigger={paginationTrigger}
      hasMoreContent={hasMoreSources}
      onLoadMore={loadMoreSources}
      tabMode={mode}
    >
      {/* Loading overlay - csak ha a kapcsoló engedélyezi */}
      {loading && (!newsItems || newsItems.length === 0) && shouldShowLoadingOverlayForMode && (
        <LoadingProgressOverlay 
          country={title || t('loading', 'Loading')}
          hideOverlay={newsLoaded}
        />
      )}

      {/* Új fül ('new' mód) */}
      {mode === 'new' && (
        <TabController
          activeTabId={activeTabId}
          isNewTab={true}
          tabMode={mode}
          title={title}
          newsItems={newsItems}
          loading={loading}
          error={error}
          onDismiss={() => {}}
          onConfigChange={handleConfigChange}
          onRetry={handleRetry}
          onToggleMenu={onToggleMenu || (() => {})}
          searchResults={searchResults}
          searchTerm={searchTerm}
          isSearchMode={isSearchMode}
          onClearSearch={onClearSearch}
          onSourceClick={onSourceClick}
        />
      )}

      {/* Videó fül ('video' mód) */}
      {mode === 'video' && (
        <TabController
          activeTabId={activeTabId}
          isNewTab={false}
          tabMode={mode}
          title={title}
          videoItems={videoItems}
          videoLoading={loading}
          videoError={error}
          newsItems={[]}
          loading={loading}
          error={error}
          onDismiss={() => {}}
          onConfigChange={handleConfigChange}
          onRetry={handleRefresh}
          onToggleMenu={onToggleMenu || (() => {})}
          onSourceClick={onSourceClick}
        />
      )}

      {/* Normál hír fül ('news', 'search' vagy 'home' mód) */}
      {(mode === 'news' || mode === 'search' || mode === 'home') && (
        <div className={panelStyles.panel}>
          <PanelHead title={title} onRefresh={handleRefresh} sources={extractSources} />
          <div className={panelStyles.sourceIconBarContainer}>
            <SourceIconBar sources={extractSources} />
          </div>
          <div className={panelStyles.panelContent}>
            {loading && <div className={panelStyles.smallSpinner} title={t('spinner.refreshing', 'Frissítés folyamatban...')} />}
            {isArticleViewActive ? (
              <ArticlePlaceholder />
            ) : error ? (
              <div className={panelStyles.errorContainer}>
                {/* ... hibaüzenet ... */}
                <p className={panelStyles.errorMessage}>
                  {error instanceof Error ? error.message : error}
                </p>
                <button className={panelStyles.retryButton} onClick={handleRetry}>
                  {t('retry', 'Újrapróbálkozás')}
                </button>
              </div>
            ) : pageItems.length > 0 ? (
              <>
                {(mode === 'search' || mode === 'home') && (
                  <div className={panelStyles.searchModeHeader}>
                    <div className={panelStyles.searchResultsInfo}>
                      <strong>{t('search.results', '{{count}} results', { count: filteredItems.length })}</strong>
                      {searchTerm && <span> {t('search.resultsFor', 'for "{{term}}"', { term: searchTerm })}</span>}
                    </div>
                    <div className={panelStyles.searchModeActions || ''}>
                      {/* ✅ Szűrő gomb - jobb oldali panel megnyitásához */}
                      <button
                        className={panelStyles.filterSettingsButton}
                        onClick={() => openRightPanelWithMode?.('settings', 'search')}
                        title="Filter Settings"
                        aria-label="Open filter settings"
                      >
                        🔧 Filter
                      </button>

                      {onClearSearch && (
                        <button 
                          className={panelStyles.clearSearchButton} 
                          onClick={onClearSearch} 
                          title={t('search.clear', 'Keresés törlése')} 
                          aria-label={t('search.clear', 'Keresés törlése')}
                        >
                          ✕
                        </button>
                      )}
                    </div>
                  </div>
                )}
                <div className={panelStyles.cardsContainer}>
                  {itemsWithAds.map((item, index) => {
                    // ... (a Card renderelési logika változatlan)
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
                          onClick={() => handleCardClick(news.url)}
                          onToggleMenu={onToggleMenu}
                          onSourceClick={onSourceClick}
                        />
                      );
                    }
                  })}
                </div>
                {filteredItems.length > 0 && (
                  <div className={panelStyles.paginationContainer}>
                    <div className={panelStyles.pageInfo}>
                      {t('pagination.detailedSummary', 'Total {{total}} articles ({{filtered}} filtered) | {{start}}-{{end}} displayed', {
                        total: filteredItems.length,
                        filtered: newsItems.length - filteredItems.length,
                        start: (calculatedValidPage - 1) * itemsPerPage + 1,
                        end: Math.min(calculatedValidPage * itemsPerPage, filteredItems.length)
                      })}
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
            {mode === 'search' || mode === 'home' ? t('search.noResults', 'A keresés nem adott találatot a megadott feltételekre.') : t('news.noItems', 'Nincs megjeleníthető hír.')}
          </div>
        )}

          </div>
        </div>
      )}
    </ScrollContainer>
  );
};

export const TabPanel = React.memo(TabPanelComponent, (prev, next) => {
  return (
    prev.tab.id === next.tab.id &&
    prev.isActive === next.isActive &&
    prev.isSearchMode === next.isSearchMode &&
    prev.searchTerm === next.searchTerm &&
    prev.searchResults?.length === next.searchResults?.length
  );
});

export default TabPanel;