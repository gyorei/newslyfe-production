import \* as React from 'react';
import { useState, useCallback, useEffect, useRef } from 'react';
// import { Panel } from '../Panel/Panel';
import styles from './Content.module.css';
import { Tab, NewsItem } from '../../types';
// import NewTabPanel from '../Tabs/NewTab/NewTabPanel';
// import SearchTab from '../Tabs/SearchTab/SearchTab';
// import StartPage from '../Tabs/StartPage/StartPage';
// import CardMoreMenu from '../CardMoreMenu/CardMoreMenu';
// Új import a TabController komponenshez
import TabController from '../Tabs/TabController';
// Új import a menü kezelő hook-hoz
import { useNewsMenuHandler } from '../CardMoreMenu/NewsMenuHandler';
// Új import a RefreshButton komponenshez
import RefreshButton from '../RefreshControl/RefreshButton';
// Új import a LoadMoreButton komponenshez
import LoadMoreButton from '../Panel/LoadMoreButton/LoadMoreButton';
// Új import a CacheStatistics komponenshez
import CacheStatistics from '../debug/CacheStatistics';
// Új import a ContentLoading komponenshez
import ContentLoading from '../LoadingStates/ContentLoading';
// Új import a ScrollContainer komponenshez
import ScrollContainer from '../ScrollContainer/ScrollContainer';

import { useTabPersistence } from './hooks/useTabPersistence';
import { useNewsData } from './hooks/useNewsData';
import { useCategoryFilter } from './hooks/useCategoryFilter';
// import { saveNews, isNewsSaved, removeSavedNews } from '../Utility/SavedNews/savedNewsUtils';
import { useTabStorage } from '../../utils/datamanager/hooks/useTabStorage';
import { useTabPerformance } from './hooks/useTabPerformance';
import { TabContentData } from '../../utils/datamanager/storage/indexedDBTypes';

// Segédfüggvény a NewsItem tömböt ArticleReference tömbbé alakításához
const newsItemsToArticleReferences = (newsItems: NewsItem[]) => {
return newsItems.map(item => ({
id: item.id || '',
title: item.title || '',
sourceId: item.sourceId || ''
}));
};

interface ContentProps {
activeTabId: string;
tabs: Tab[];
onChangeTabMode?: (tabId: string, mode: 'news' | 'new') => void;
}

export const Content: React.FC<ContentProps> = ({
activeTabId,
tabs,
onChangeTabMode,
}) => {
// ⬇️ ÁTHELYEZHETŐ: src\components\Utility\SavedNews\useSavedNews.ts (új fájl)
// const [savedNewsIds, setSavedNewsIds] = useState<Record<string, boolean>>({});

// ⬇️ ÁTHELYEZHETŐ: src\utils\datamanager\hooks\useContentLoader.ts (új fájl)
const [initialDataForNewsHook, setInitialDataForNewsHook] = useState<NewsItem[] | undefined>(undefined);
const [isLoadingSavedData, setIsLoadingSavedData] = useState(true);

// ⬇️ ÁTHELYEZHETŐ: src\components\UI\ScrollContainer\useScrollHandler.ts (új könyvtár és fájl)
// Fő content div ref
const contentRef = useRef<HTMLDivElement>(null);
// Görgetési kontérer ref
const scrollContainerRef = useRef<HTMLDivElement>(null);

// ⬇️ ÁTHELYEZHETŐ: src\utils\cache\useCacheState.ts (új könyvtár és fájl)
// Új state a cache találatok nyomon követéséhez
const [isCacheHit, setIsCacheHit] = useState(false);

// ⬇️ ÁTHELYEZHETŐ: src\utils\datamanager\hooks\useContentLoader.ts (új fájl)
// HOZZÁADOTT: Betöltési állapot követése
const isInitialLoadDoneRef = useRef(false);
const isLoadingRef = useRef(false);
const lastSavedContentRef = useRef<string>(''); // Az utolsó mentett tartalom hash-e

// ⬇️ ÁTHELYEZHETŐ: src\components\Tabs\StartPage\useStartPage.ts (új fájl)
const handleStartPageDismiss = useCallback(() => {
// TODO: Implement the actual logic for dismissing the start page.
// This might involve changing the active tab or communicating with a parent component (App.tsx)
// to hide the start page permanently.
console.warn('StartPage onDismiss triggered in Content.tsx. Actual dismissal logic needs to be implemented.');
}, []);

// ⬇️ ÁTHELYEZHETŐ: src\utils\performance\usePerformanceTracking.ts (új fájl)
// Teljesítménymérő hook használata
const {
measurePhase,
measureScrollRestoration,
startTabSwitchMeasurement,
endTabSwitchMeasurement,
isSupported: isPerfSupported
} = useTabPerformance();

// ⬇️ ÁTHELYEZHETŐ: src\components\Tabs\useTabState.ts (új fájl)
const { activeTab, isNewTab } = useTabPersistence({
tabs,
activeTabId,
});

// ⬇️ ÁTHELYEZHETŐ: src\utils\datamanager\hooks\useTabStorageWrapper.ts (új fájl)
// useTabStorage hook használata - most már optimalizált in-memory cache-el
const {
loadTabContent,
saveTabContent,
saveScrollPosition,
cacheStats // Új: cache statisztikák
} = useTabStorage();

// ⬇️ ÁTHELYEZHETŐ: src\services\news\useNewsService.ts (új fájl)
const {
newsItems,
loading: newsDataLoading,
error,
handleRetry,
loadMoreSources,
hasMoreSources,
setNewsItems,
refreshNewsData // Új metódus a hírek frissítéséhez
} = useNewsData({
activeTab,
isNewTab,
activeTabId,
initialNewsItems: initialDataForNewsHook,
});

// ⬇️ ÁTHELYEZHETŐ: src\services\news\useCategoryFiltering.ts (új fájl)
const filteredNewsItems = useCategoryFilter({
newsItems,
activeTabId,
});

// ⬇️ ÁTHELYEZVE: src\components\CardMoreMenu\NewsMenuHandler.tsx
// useEffect(() => {
// const savedIds: Record<string, boolean> = {};
// filteredNewsItems.forEach(item => {
// if (item.id && isNewsSaved(item.id)) {
// savedIds[item.id] = true;
// }
// });
// setSavedNewsIds(savedIds);
// }, [filteredNewsItems]);

// A CardMoreMenu funkcionalitás használata
const { handleToggleMenu, renderMenu } = useNewsMenuHandler(filteredNewsItems);

// ⬇️ ÁTHELYEZVE: src\components\CardMoreMenu\NewsMenuHandler.tsx
// const handleToggleMenu = useCallback((cardId: string | undefined, anchorEl: HTMLElement | null) => {
// if (cardId && cardId === openMenuCardId) {
// setOpenMenuCardId(null);
// setMenuAnchorEl(null);
// setCurrentMenuItem(null);
// } else if (cardId && anchorEl) {
// setOpenMenuCardId(cardId);
// setMenuAnchorEl(anchorEl);
// const selectedItem = filteredNewsItems.find(item => item.id === cardId);
// setCurrentMenuItem(selectedItem || null);
// } else {
// setOpenMenuCardId(null);
// setMenuAnchorEl(null);
// setCurrentMenuItem(null);
// }
// }, [openMenuCardId, filteredNewsItems]);

// ⬇️ ÁTHELYEZVE: src\components\CardMoreMenu\NewsMenuHandler.tsx
// const handleCloseMenu = useCallback(() => {
// setOpenMenuCardId(null);
// setMenuAnchorEl(null);
// setCurrentMenuItem(null);
// }, []);

// ⬇️ ÁTHELYEZVE: src\components\CardMoreMenu\NewsMenuHandler.tsx
// const handleSave = useCallback(() => {
// if (!currentMenuItem?.id) return;
//
// const newsId = currentMenuItem.id;
//
// if (savedNewsIds[newsId]) {
// if (removeSavedNews(newsId)) {
// setSavedNewsIds(prev => {
// const updated = { ...prev };
// delete updated[newsId];
// return updated;
// });
// }
// } else {
// const savedItem = saveNews(currentMenuItem);
// if (savedItem) {
// setSavedNewsIds(prev => ({
// ...prev,
// [newsId]: true
// }));
// }
// }
//
// handleCloseMenu();
// }, [currentMenuItem, savedNewsIds, handleCloseMenu]);

// ⬇️ ÁTHELYEZVE: src\components\CardMoreMenu\NewsMenuHandler.tsx
// const handleShare = useCallback(() => {
// if (currentMenuItem?.url && navigator.share) {
// navigator.share({
// title: currentMenuItem.title,
// text: currentMenuItem.description || '',
// url: currentMenuItem.url
// }).catch(err => console.error('Megosztás sikertelen:', err));
// }
// handleCloseMenu();
// }, [currentMenuItem, handleCloseMenu]);

// ⬇️ ÁTHELYEZVE: src\components\CardMoreMenu\NewsMenuHandler.tsx
// const handleAnalyze = useCallback(() => {
// console.log('Analizálás:', currentMenuItem?.id);
// handleCloseMenu();
// }, [currentMenuItem, handleCloseMenu]);

// ⬇️ ÁTHELYEZVE: src\components\CardMoreMenu\NewsMenuHandler.tsx
// const handleHideSource = useCallback(() => {
// console.log('Forrás elrejtése:', currentMenuItem?.sourceId);
// handleCloseMenu();
// }, [currentMenuItem, handleCloseMenu]);

// ⬇️ ÁTHELYEZHETŐ: src\utils\datamanager\hooks\useContentLoader.ts (új fájl)
// Effekt a mentett tartalom és görgetési pozíció betöltésére tabváltáskor
useEffect(() => {
// Ha már betöltés alatt van, ne indítsunk újat
if (isLoadingRef.current) {
console.log(`[Content] Már folyamatban van betöltés (${activeTabId}), kihagyás`);
return;
}

    // ⬇️ ÁTHELYEZHETŐ: src\components\Tabs\useTabStateManager.ts (új fájl)
    // Új tab vagy search mód esetén gyors kezelés
    if (isNewTab || activeTab.mode === 'search') {
      setNewsItems([]);
      setInitialDataForNewsHook(undefined);
      setIsLoadingSavedData(false);
      if (scrollContainerRef.current) {
        scrollContainerRef.current.scrollTop = 0;
      }
      return;
    }

    // ⬇️ ÁTHELYEZHETŐ: src\utils\datamanager\hooks\useContentLoader.ts (új fájl)
    // Jelöljük, hogy betöltés van folyamatban
    isLoadingRef.current = true;
    setIsLoadingSavedData(true);

    // ⬇️ ÁTHELYEZHETŐ: src\components\UI\Transitions\useContentTransitions.ts (új könyvtár és fájl)
    // Átmenet kezdete
    if (scrollContainerRef.current) {
      scrollContainerRef.current.classList.add(styles.tabTransition);
    }

    // Mérés kezdés
    startTabSwitchMeasurement();
    setIsCacheHit(false);

    // ⬇️ ÁTHELYEZHETŐ: src\utils\datamanager\hooks\useContentLoader.ts (új fájl)
    // A mentett adatok és görgetési pozíció betöltése

    const loadSavedData = async () => {
      try {
        console.log(`[Content] Mentett adatok betöltése a(z) ${activeTabId} azonosítójú fülhöz...`);

        const loadStartTime = performance.now();
        let tabContent: TabContentData | null = null;

        // IndexedDB vagy in-memory cache betöltés
        await measurePhase('dbLoad', async () => {
          tabContent = await loadTabContent(activeTabId);
        });

        const loadTime = performance.now() - loadStartTime;
        if (loadTime < 50) {
          console.log(`[Content] In-memory cache találat (${loadTime.toFixed(2)} ms)`);
          setIsCacheHit(true);
        }

        // React render fázis
        measurePhase('render', () => {
          if (tabContent && tabContent.meta && 'originalNews' in tabContent.meta) {
            const originalNews = (tabContent.meta.originalNews as unknown) as NewsItem[];
            console.log(`[Content] ${originalNews.length} hír betöltve a mentett adatokból`);
            setInitialDataForNewsHook(originalNews);

            if (loadTime < 50 && scrollContainerRef.current) {
              setTimeout(() => {
                scrollContainerRef.current?.classList.remove(styles.tabTransition);
              }, 50);
            }
          } else {
            console.log('[Content] Nincs mentett adat vagy üres a hírlista, API hívás szükséges');
            setInitialDataForNewsHook(undefined);
          }
        });

        // ⬇️ ÁTHELYEZHETŐ: src\components\UI\ScrollContainer\useScrollRestoration.ts (új könyvtár és fájl)
        // Görgetési pozíció visszaállítása
        let scrollPosition = undefined;

        if (tabContent && typeof tabContent === 'object' && tabContent !== null) {
          const metaObj = (tabContent as Record<string, unknown>).meta;
          if (metaObj && typeof metaObj === 'object') {
            scrollPosition = typeof (metaObj as Record<string, unknown>).scrollPosition === 'number'
              ? (metaObj as Record<string, number>).scrollPosition
              : undefined;
          }
        }

        console.log(`[Content] Görgetési pozíció helyreállítása: ${scrollPosition || 0}px, fül: ${activeTabId}`);

        measureScrollRestoration(() => {
          setTimeout(() => {
            // Ellenőrizzük, hogy még mindig ez az aktív fül
            if (activeTabId === tabs.find(t => t.active)?.id && scrollContainerRef.current) {
              if (typeof scrollPosition === 'number') {
                scrollContainerRef.current.scrollTo({
                  top: scrollPosition,
                  behavior: 'auto'
                });
              } else {
                scrollContainerRef.current.scrollTo({ top: 0, behavior: 'auto' });
              }
            }

            // Tartalom megjelenítése
            if (scrollContainerRef.current) {
              scrollContainerRef.current.classList.remove(styles.tabTransition);
            }

            setIsLoadingSavedData(false);
            endTabSwitchMeasurement();

            // Jelöljük, hogy a kezdeti betöltés megtörtént
            isInitialLoadDoneRef.current = true;

            // Háttérben frissítés, ha szükséges
            if (loadTime >= 50 && tabContent && !newsDataLoading) {
              setTimeout(() => {
                refreshNewsData(true);
              }, 2000);
            }

            // Betöltés befejezve, feloldjuk a zárat
            isLoadingRef.current = false;
          }, 150);
        });
      } catch (error) {
        console.error('Hiba a tab tartalom betöltése közben:', error);
        setIsLoadingSavedData(false);

        // Hiba esetén is feloldjuk a betöltési zárat
        isLoadingRef.current = false;
        isInitialLoadDoneRef.current = true;
      }
    };

    // Indítsuk a betöltést
    loadSavedData();

// Egyszerűsített függőségi tömb - csak a legszükségesebb elemek
// eslint-disable-next-line react-hooks/exhaustive-deps
}, [activeTabId, isNewTab, activeTab.mode, loadTabContent, setNewsItems, tabs]);

// ⬇️ ÁTHELYEZHETŐ: src\utils\datamanager\hooks\useNewsPersistence.ts (új fájl)
// Effekt a hírek és görgetési pozíció mentésére
useEffect(() => {
// Csak akkor mentsünk, ha:
// - vannak hírek
// - nem új/kereső fül
// - nem a kezdeti mentett adat betöltése zajlik
// - a kezdeti betöltés már befejeződött
if (newsItems.length > 0 && !isNewTab && activeTab.mode !== 'search' &&
!isLoadingSavedData && isInitialLoadDoneRef.current) {

      // Generáljunk egy egyszerű hash-t a tartalomról
      const contentHash = `${activeTabId}-${newsItems.length}-${newsItems[0]?.id ?? ''}-${newsItems[newsItems.length - 1]?.id ?? ''}`;

      // Csak akkor mentsünk, ha változott a tartalom
      if (contentHash !== lastSavedContentRef.current) {
        console.log(`[Content] Hírek mentése a(z) ${activeTabId} azonosítójú fülhöz`, {
          hírDb: newsItems.length,
          hash: contentHash,
          prevHash: lastSavedContentRef.current
        });

        lastSavedContentRef.current = contentHash;

        // Az új TabContentData interfésznek megfelelő objektum létrehozása
        const tabContentData: TabContentData = {
          id: activeTabId,
          articles: newsItemsToArticleReferences(newsItems),
          timestamp: Date.now(),
          meta: {
            scrollPosition: scrollContainerRef.current?.scrollTop || 0,
            lastFetched: Date.now(),
            originalNews: newsItems
          }
        };

        saveTabContent(tabContentData, activeTabId);
      } else {
        console.log(`[Content] Tartalom nem változott (${activeTabId}), mentés kihagyva`);
      }
    }

}, [newsItems, activeTabId, isNewTab, activeTab.mode, saveTabContent, isLoadingSavedData]);

// ⬇️ ÁTHELYEZHETŐ: src\components\UI\ScrollContainer\useInfiniteScroll.ts (új könyvtár és fájl)
// Scroll eseménykezelő a görgetési pozíció mentéséhez
// useEffect(() => {
// // Ne mentsünk görgetést új vagy kereső tabon, vagy ha nincs scroll konténer
// if (isNewTab || activeTab.mode === 'search' || !scrollContainerRef.current) return;
//  
 // const scrollElement = scrollContainerRef.current;
// let scrollTimeout: number | null = null;
//  
 // const handleScroll = () => {
// if (scrollTimeout) clearTimeout(scrollTimeout);
// scrollTimeout = window.setTimeout(() => {
// if (!scrollElement) return;
//  
 // const currentScrollPosition = scrollElement.scrollTop;
// saveScrollPosition(currentScrollPosition);
//
// // "Load more" logika módosítva a konténerre
// const containerHeight = scrollElement.clientHeight;
// const scrollHeight = scrollElement.scrollHeight;
//  
 // if (currentScrollPosition + containerHeight > scrollHeight \* 0.8 &&
// hasMoreSources && !newsDataLoading) {
// loadMoreSources();
// }
// }, 200); // Throttle-ing
// };
//
// scrollElement.addEventListener('scroll', handleScroll, { passive: true });
// return () => {
// if (scrollTimeout) clearTimeout(scrollTimeout);
// scrollElement.removeEventListener('scroll', handleScroll);
// };
// }, [
// activeTabId,
// isNewTab,
// activeTab.mode,
// saveScrollPosition,
// hasMoreSources,
// newsDataLoading,
// loadMoreSources
// ]);

const overallLoading = isLoadingSavedData || newsDataLoading;

// ⬇️ ÁTHELYEZVE: src\components\Panel\LoadMoreButton\LoadMoreButton.tsx (új fájl)
// const renderLoadMoreButton = () => {
// if (!hasMoreSources || activeTab.filters?.continent || overallLoading || isNewTab || activeTab.mode === 'search') return null;
//
// return (
// <div className={styles.loadMoreContainer}>
// <button
// onClick={loadMoreSources}
// className={styles.loadMoreButton}
// >
// További hírek betöltése
// </button>
// </div>
// );
// };

// ⬇️ ÁTHELYEZHETŐ: src\components\Tabs\useTabConfiguration.ts (új fájl)
const handleConfigChange = useCallback((mode: 'news' | 'browse' | 'search') => {
if (onChangeTabMode && mode === 'news') {
onChangeTabMode(activeTabId, 'news');
}
}, [activeTabId, onChangeTabMode]);

return (
<div
ref={contentRef}
className={`${styles.contentArea}`}
id={`tab-panel-${activeTabId}`}
role="tabpanel"
aria-labelledby={activeTabId}
data-perf-supported={isPerfSupported}
data-cache-hit={isCacheHit} >
{/_ ⬇️ ÁTHELYEZVE: src\components\debug\CacheStatistics.tsx (új fájl) _/}
{/_ Cache statisztikák megjelenítése fejlesztői módban _/}
{/_ {process.env.NODE_ENV === 'development' && (
<div className={styles.cacheStats}>
Cache: {cacheStats?.hits || 0} találat / {cacheStats?.misses || 0} nincs találat
</div>
)} _/}

      {/* Az új CacheStatistics komponens használata */}
      <CacheStatistics
        hits={cacheStats?.hits || 0}
        misses={cacheStats?.misses || 0}
      />

      {/* ⬇️ ÁTHELYEZHETŐ: src\components\UI\RefreshControl\RefreshButton.tsx (új könyvtár és fájl) */}
      {/* Manuális frissítés gomb */}
      {!isNewTab && activeTab.mode !== 'search' && newsItems.length > 0 && (
        <RefreshButton
          isLoading={overallLoading}
        />
      )}

      {/* ⬇️ ÁTHELYEZVE: src\components\ScrollContainer\ScrollContainer.tsx (új könyvtár és fájl) */}
      {/* Scroll konténer - ÚJ */}
      <ScrollContainer
        activeTabId={activeTabId}
        isNewTab={isNewTab}
        tabMode={activeTab.mode}
        isLoading={isLoadingSavedData}
        hasMoreContent={hasMoreSources}
        onLoadMore={loadMoreSources}
        onSaveScrollPosition={saveScrollPosition}
        initialScrollPosition={0}
      >
        {/* Az új TabController komponens használata a különböző tab típusok megjelenítéséhez */}
        <TabController
          activeTabId={activeTabId}
          isNewTab={isNewTab}
          tabMode={activeTab.mode}
          title={activeTab.title}
          searchTerm={activeTab.filters?.searchTerm}
          newsItems={filteredNewsItems}
          loading={overallLoading}
          error={error}
          onDismiss={handleStartPageDismiss}
          onConfigChange={handleConfigChange}
          onRetry={handleRetry}
          onToggleMenu={handleToggleMenu}
        />

        {/* Az új ContentLoading komponens használata */}
        <ContentLoading
          isLoadingSavedData={isLoadingSavedData}
          newsDataLoading={newsDataLoading}
          overallLoading={overallLoading}
          newsItemsCount={newsItems.length}
          isCacheHit={isCacheHit}
        />

        <LoadMoreButton
          onLoadMore={loadMoreSources}
          hasMoreSources={hasMoreSources}
          isLoading={overallLoading}
          isDisabled={!!activeTab.filters?.continent || isNewTab || activeTab.mode === 'search'}
        />
      </ScrollContainer>

      {/* ⬇️ ÁTHELYEZVE: src\components\CardMoreMenu\NewsMenuHandler.tsx */}
      {/* <CardMoreMenu
        open={!!openMenuCardId && !!menuAnchorEl}
        anchorEl={menuAnchorEl}
        onClose={handleCloseMenu}
        onSave={handleSave}
        onShare={handleShare}
        onAnalyze={handleAnalyze}
        onHideSource={handleHideSource}
        url={currentMenuItem?.url}
        saveText={getSaveText(currentMenuItem?.id)}
      /> */}

      {/* Az új renderMenu függvényt használjuk a NewsMenuHandler-ből */}
      {renderMenu()}
    </div>

);
};

export default Content;
