régi és az új tabpanel

régi: 
// src/components/Content/TabPanel.tsx

import * as React from 'react';
import { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import { Tab, NewsItem } from '../../types';
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
import My from '../Tabs/Home/My/My'; // ✅ Importáld a My komponenst

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
}) => {
  useDebugRender(`TabPanel (${tab.title})`);
  const { id: activeTabId, title, mode, filters } = tab;

  console.log('[TabPanel] Render, activeTabId:', activeTabId, 'isActive:', isActive, 'mode:', mode);

  // --- STATE-EK ÉS REF-EK ---
  const [paginationTrigger, setPaginationTrigger] = useState(0);
  const abortControllerRef = useRef<AbortController | null>(null);
  const [requestToken, setRequestToken] = useState<string>('');
  const [newsLoaded, setNewsLoaded] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(50);
  const [maxAgeHours, setMaxAgeHours] = useState(24);
  const [showHorizontalScroller, setShowHorizontalScroller] = useState(false);
  const [isArticleViewActive, setArticleViewActive] = useState(false);

  // Utility hooks
  const isMobileOrTablet = useMediaQuery({ maxWidth: 1024 });
  const { getUserPreference } = useStorage();
  
  // ✅ JAVÍTÁS: Specifikus hook-ok használata a useTabStorage helyett
  const { savePaginationState, loadPaginationState } = useTabPagination(activeTabId);
  const { saveTabContent } = useTabCache();

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
    
    return () => {
      console.log('[TabPanel] Bridge feliratkozások törlése...');
      mountedRef.current = false;
      subscribedRef.current = false;
      unsubscribeItemsPerPage();
      unsubscribeTimeSettings();
    };
  }, [activeTabId, itemsPerPage, savePaginationState]);

  // Preferences betöltés
  useEffect(() => {
    if (preferencesLoadedRef.current) {
      return;
    }
    preferencesLoadedRef.current = true;

    const loadPreferences = async () => {
      try {
        // Horizontal scroller
        try {
          const dataManager = (await import('../../utils/datamanager/manager')).DataManager.getInstance();
          const scrollerValue = await dataManager.getHorizontalScroller();
          setShowHorizontalScroller(scrollerValue);
          console.log(`[TabPanel] Horizontal scroller betöltve (cache): ${scrollerValue}`);
        } catch (error) {
          console.error('[TabPanel] Horizontal scroller betöltési hiba:', error);
          const scrollerPref = await getUserPreference('user_showHorizontalScroller');
          if (scrollerPref?.value !== undefined) {
            setShowHorizontalScroller(Boolean(scrollerPref.value));
          }
        }

        // Items per page
        const itemsPerPagePref = await getUserPreference('user_itemsPerPage');
        if (itemsPerPagePref && itemsPerPagePref.value !== undefined) {
          const value = Number(itemsPerPagePref.value);
          if (Number.isFinite(value) && value >= 1) {
            setItemsPerPage(value);
          } else {
            setItemsPerPage(50);
          }
        } else {
          const savedLimit = localStorage.getItem('newsLimit');
          if (savedLimit) {
            const limitValue = Number(savedLimit);
            if (Number.isFinite(limitValue) && limitValue >= 1) {
              setItemsPerPage(limitValue);
            } else {
              setItemsPerPage(50);
            }
          } else {
            setItemsPerPage(50);
          }
        }

        // Max age hours
        const maxAgeHoursPref = await getUserPreference('user_maxAgeHours');
        if (maxAgeHoursPref && maxAgeHoursPref.value !== undefined) {
          const value = Number(maxAgeHoursPref.value);
          if (Number.isFinite(value) && value >= 1) {
            setMaxAgeHours(value);
          } else {
            setMaxAgeHours(24);
          }
        } else {
          const savedMaxAge = localStorage.getItem('maxAgeHours');
          if (savedMaxAge) {
            const ageValue = Number(savedMaxAge);
            if (Number.isFinite(ageValue) && ageValue >= 1) {
              setMaxAgeHours(ageValue);
            } else {
              setMaxAgeHours(24);
            }
          } else {
            setMaxAgeHours(24);
          }
        }
      } catch {
        setItemsPerPage(50);
        setMaxAgeHours(24);
      }
    };

    loadPreferences();
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
        // Articles mappa az indexedDB számára
        articles: newsItems.map(item => ({ 
            id: item.id || '', 
            title: item.title || '', 
            sourceId: item.sourceId || '' 
        })),
        timestamp: Date.now(),
        meta: {
          lastFetched: Date.now(),
          originalNews: newsItems,
          country: filters?.country,
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
    newsItemsHash, // Ez biztosítja, hogy csak tartalomváltozáskor fusson le
    mode, 
    loading, 
    activeTabId, 
    filters?.country, 
    saveTabContent
  ]);

  // --- ADATFELDOLGOZÁS ---
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
    
    if (isSearchMode && searchResults.length > 0) {
      sourceItems = searchResults.map((item) => ({
        ...item,
        isSearchResult: true,
      }));
    } else if (isSearchMode && searchResults.length === 0) {
      sourceItems = [];
    } else {
      sourceItems = newsItems;
    }

    // Időszűrés
    const cutoffTimestamp = Date.now() - maxAgeHours * 60 * 60 * 1000;
    const filteredByTime = sourceItems.filter((item) => {
      if (item.timestamp && typeof item.timestamp === 'number') {
        return item.timestamp > cutoffTimestamp;
      }
      if (item.date) {
        const itemTimestamp = new Date(item.date).getTime();
        return itemTimestamp > cutoffTimestamp;
      }
      return true;
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
  }, [newsItems, searchResults, isSearchMode, maxAgeHours, currentPage, itemsPerPage]);

  const itemsWithAds = useMemo(() => injectAdsIntoNewsItems(pageItems, 5, 10), [pageItems]);

  // --- RENDER ---
  // ✅ Feltételes renderelés: ha a tab.mode 'my_page', csak a My komponenst jelenítsük meg
  if (tab.mode === 'my_page') {
    return <My />;
  }

  // ÚJ: Kapcsoló, ami szabályozza az overlay megjelenését
  const shouldShowLoadingOverlayForMode = mode === 'news' || mode === 'search';

  return (
    <ScrollContainer
      activeTabId={activeTabId}
      isLoading={loading}
      resetScrollTrigger={paginationTrigger}
      hasMoreContent={hasMoreSources}
      onLoadMore={loadMoreSources}
      tabMode={mode}
    >
      {/* Loading overlay - csak ha a kapcsoló engedélyezi */}
      {loading && (!newsItems || newsItems.length === 0) && shouldShowLoadingOverlayForMode && (
        <LoadingProgressOverlay 
          country={title || "Loading"}
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

      {/* Normál hír fül ('news' vagy 'search' mód) */}
      {(mode === 'news' || mode === 'search') && (
        <div className={panelStyles.panel}>
          <PanelHead title={title} onRefresh={handleRefresh} sources={extractSources} />
          <div className={panelStyles.sourceIconBarContainer}>
            <SourceIconBar sources={extractSources} />
          </div>
          <div className={panelStyles.panelContent}>
            {loading && newsItems.length > 0 && (
              <div className={panelStyles.smallSpinner} title="Frissítés folyamatban..." />
            )}
            {isArticleViewActive ? (
              <ArticlePlaceholder />
            ) : (
              <>
                {error ? (
                  <div className={panelStyles.errorContainer}>
                    <p className={panelStyles.errorMessage}>
                      {error instanceof Error ? error.message : error}
                    </p>
                    <button className={panelStyles.retryButton} onClick={handleRetry}>
                      Retry
                    </button>
                  </div>
                ) : newsItems.length > 0 || (isSearchMode && searchResults && searchResults.length > 0) ? (
                  <>
                    {isSearchMode && (
                      <div className={panelStyles.searchModeHeader}>
                        {searchResults && searchResults.length > 0 ? (
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
                          Total {filteredItems.length} articles ({newsItems.length - filteredItems.length} filtered) | 
                          {(calculatedValidPage - 1) * itemsPerPage + 1}-
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
                    Welcome to the European News Aggregator! Please select a topic or source to display news.
                  </div>
                )}
              </>
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

===============================================================


======================================================