import React, { useState, useCallback, useMemo } from 'react';
// import NewTabPanel from './NewTab/NewTabPanel'; // ✅ ÁTNEVEZVE: Home-ra
import Home from './Home/Home';
import SearchTab from './SearchTab/SearchTab';
import { Panel } from '../Panel/Panel';
import { NewsItem } from '../../types';
import { useDebugRender } from '../../utils/debugTools/debugTools';

// ========================================
// 🎥 VIDEO PANEL IMPORT - ÚJ KOMPONENS!
// ========================================
import VideoPanel from '../VideoPanel/VideoPanel';

interface TabControllerProps {
  activeTabId: string;
  isNewTab: boolean;
  tabMode?: string;
  title?: string;
  searchTerm?: string;
  newsItems: NewsItem[];
  loading: boolean;
  error: Error | string | null;
  onDismiss: () => void;
  onConfigChange: (mode: 'news' | 'browse' | 'search' | 'video') => void; // ✅ ÚJ: video mode támogatás
  onRetry: () => void;
  onToggleMenu: (cardId: string | undefined, anchorEl: HTMLElement | null, cardEl?: HTMLElement | null) => void;
  searchResults?: NewsItem[];
  isSearchMode?: boolean;
  onClearSearch?: () => void;
  // ✅ ÚJ: Pagination callback a Panel.tsx-től
  onPaginationChange?: (shouldScrollToTop: boolean) => void;
  // ========================================
  // 🎥 VIDEO PROPS - ÚJ VIDEÓ TARTALOM!
  // ========================================
  videoItems?: NewsItem[]; // Videó hírek (NewsItem típusú, de video flag-gel)
  videoLoading?: boolean; // Videó betöltési állapot
  videoError?: Error | string | null; // Videó hiba állapot
}

// Eredeti TabController komponens
const TabControllerComponent: React.FC<TabControllerProps> = ({
  activeTabId,
  isNewTab,
  tabMode = 'news',
  title = '',
  searchTerm = '',
  newsItems = [],
  loading = false,
  error = null,
  // onDismiss,
  onConfigChange,
  onRetry,
  onToggleMenu,
  searchResults = [],
  isSearchMode = false,
  onClearSearch,
  // ✅ ÚJ: Pagination callback
  onPaginationChange,
  // ========================================
  // 🎥 VIDEO PROPS KICSOMAGOLÁSA
  // ========================================
  videoItems = [],
  videoLoading = false,
  videoError = null,
}) => {
  useDebugRender('TabController'); // <-- IDE!
  // Renderelési számláló a TabController-ben
  const renderCountRef = React.useRef(0);
  renderCountRef.current++;

  // Props változás követése
  const prevPropsRef = React.useRef<Record<string, string | number | boolean>>({});
  const currentProps = {
    activeTabId,
    isNewTab,
    tabMode,
    title,
    searchTerm,
    newsItems: newsItems.length,
    loading,
    error: !!error,
    searchResults: searchResults.length,
    isSearchMode,
    // ========================================
    // 🎥 VIDEO PROPS KÖVETÉSE
    // ========================================
    videoItems: videoItems.length,
    videoLoading,
    videoError: !!videoError,
  };

  // console.log(`[TabController] 🔄 RENDER #${renderCountRef.current} - Tab: ${activeTabId}`);
  // console.log(
  //   `[TabController] Props: isNewTab: ${isNewTab}, tabMode: ${tabMode}, newsItems: ${newsItems.length}, searchResults: ${searchResults.length}`,
  // );

  // if (JSON.stringify(prevPropsRef.current) !== JSON.stringify(currentProps)) {
  //   console.log(`[TabController] 📝 Props változás:`, {
  //     prev: prevPropsRef.current,
  //     current: currentProps,
  //   });
  //   prevPropsRef.current = currentProps;
  // }

  // Fül-specifikus Single Tab Mode állapot
  const [singleTabModes, setSingleTabModes] = useState<
    Record<
      string,
      {
        active: boolean;
        results: NewsItem[];
        query: string;
      }
    >
  >({});

  // ✅ useMemo a stabil referenciákért - Aktuális fül Single Tab Mode állapotának lekérése
  const currentTabSingleMode = useMemo(() => {
    return singleTabModes[activeTabId] || {
      active: false,
      results: [],
      query: '',
    };
  }, [singleTabModes, activeTabId]);

  // ✅ useCallback a stabil referenciákért - Fül-specifikus keresés callback
  const handleSearchComplete = useCallback(
    (results: NewsItem[], query: string) => {
      // console.log(
      //   `[TabController] Single Tab Mode aktiválva fül ${activeTabId}: ${results.length} hír "${query}" kereséshez`,
      // );

      setSingleTabModes((prev) => ({
        ...prev,
        [activeTabId]: {
          active: true,
          results: results,
          query: query,
        },
      }));
    },
    [activeTabId], // ✅ Csak activeTabId függőség
  );

  // ✅ useCallback a stabil referenciákért - Fül-specifikus visszatérés keresőhöz
  const handleBackToSearch = useCallback(() => {
    // console.log(`[TabController] Visszatérés Home keresőhöz fül ${activeTabId}`);

    setSingleTabModes((prev) => ({
      ...prev,
      [activeTabId]: {
        active: false,
        results: [],
        query: '',
      },
    }));
  }, [activeTabId]); // ✅ Csak activeTabId függőség

  // ✅ useCallback a stabil referenciákért - onRetry wrapper
  const handleRetry = useCallback(() => {
    // console.log(`[TabController] Retry gomb megnyomva - Tab: ${activeTabId}`);
    onRetry();
  }, [onRetry, activeTabId]); // ✅ onRetry és activeTabId függőség

  // ✅ useMemo a render döntésekhez - Fül-specifikus Single Tab Mode ellenőrzés
  const shouldRenderSingleTabMode = useMemo(() => {
    return currentTabSingleMode.active && currentTabSingleMode.results.length > 0;
  }, [currentTabSingleMode.active, currentTabSingleMode.results.length]);

  // ✅ useMemo a render döntésekhez - Home tab ellenőrzés
  const shouldRenderNewTab = useMemo(() => {
    return isNewTab;
  }, [isNewTab]);

  // ✅ useMemo a render döntésekhez - Keresési tab ellenőrzés
  const shouldRenderSearchTab = useMemo(() => {
    return tabMode === 'search' && searchTerm;
  }, [tabMode, searchTerm]);

  // ========================================
  // 🎥 VIDEO TAB ELLENŐRZÉS - ÚJ LOGIKA!
  // ========================================
  const shouldRenderVideoTab = useMemo(() => {
    return tabMode === 'video';
  }, [tabMode]);

  // Fül-specifikus Single Tab Mode ellenőrzés
  if (shouldRenderSingleTabMode) {
    // console.log(
    //   `[TabController] Panel megjelenítés fül ${activeTabId}: ${currentTabSingleMode.results.length} hír`,
    // );

    return (
      <Panel
        activeTabId={`search-${activeTabId}`}
        title={`🔍 ${currentTabSingleMode.query}`}
        newsItems={[]}
        loading={false}
        error={null}
        onRetry={handleBackToSearch}
        onToggleMenu={onToggleMenu}
        searchResults={currentTabSingleMode.results}
        searchTerm={currentTabSingleMode.query}
        isSearchMode={true}
        onClearSearch={handleBackToSearch}
        isActive={true}
        // ✅ ÚJ: Pagination callback átadása
        onPaginationChange={onPaginationChange}
      />
    );
  }

  // Home tab megjelenítése
  if (shouldRenderNewTab) {
    return (
      <Home
        title={title}
        onConfigChange={onConfigChange}
        onSearchComplete={handleSearchComplete}
        isActive={true}
      />
    );
  }

  // ========================================
  // 🎥 VIDEO TAB MEGJELENÍTÉS - ÚJ RENDER!
  // ========================================
  if (shouldRenderVideoTab) {
    console.log(`[TabController] 🎥 Video tab render: activeTabId=`, activeTabId, 'tabMode=', tabMode, 'videoItems=', videoItems.length);
    return (
      <VideoPanel
        activeTabId={activeTabId}
        title={title || 'Video News'}
        videoItems={videoItems}
        loading={videoLoading}
        error={videoError}
        onRetry={handleRetry}
        onToggleMenu={onToggleMenu}
        isActive={true}
      />
    );
  }

  // Standard működés
  return (
    <>
      {shouldRenderSearchTab ? (
        <SearchTab searchTerm={searchTerm} isActive={true} />
      ) : (
        <Panel
          activeTabId={activeTabId}
          title={title}
          newsItems={newsItems}
          loading={loading}
          error={error}
          onRetry={handleRetry}
          onToggleMenu={onToggleMenu}
          searchResults={searchResults}
          searchTerm={searchTerm}
          isSearchMode={isSearchMode}
          onClearSearch={onClearSearch}
          isActive={true}
          // ✅ ÚJ: Pagination callback átadása
          onPaginationChange={onPaginationChange}
        />
      )}
    </>
  );
};

// Memoizált TabController teljes összehasonlítással
const MemoizedTabController = React.memo(TabControllerComponent, (prev, next) => {
  // ✅ TELJES MEMOIZÁCIÓ - minden kritikus prop összehasonlítása
  const areEqual = (
    prev.activeTabId === next.activeTabId &&
    prev.isNewTab === next.isNewTab &&
    prev.tabMode === next.tabMode &&
    prev.title === next.title &&
    prev.searchTerm === next.searchTerm &&
    prev.loading === next.loading &&
    prev.error === next.error &&
    prev.isSearchMode === next.isSearchMode &&
    prev.newsItems.length === next.newsItems.length &&
    prev.searchResults?.length === next.searchResults?.length &&
    // ✅ Hash-alapú összehasonlítás megtartása
    prev.newsItems[0]?.id === next.newsItems[0]?.id &&
    prev.newsItems[prev.newsItems.length - 1]?.id === next.newsItems[next.newsItems.length - 1]?.id &&
    // ========================================
    // 🎥 VIDEO PROPS ÖSSZEHASONLÍTÁS
    // ========================================
    prev.videoItems?.length === next.videoItems?.length &&
    prev.videoLoading === next.videoLoading &&
    prev.videoError === next.videoError
  );

  // ✅ Debug logging csak development-ben
  if (!areEqual && process.env.NODE_ENV === 'development') {
    // console.log(`[TabController] Re-render: ${next.activeTabId}`, {
    //   prev: {
    //     activeTabId: prev.activeTabId,
    //     isNewTab: prev.isNewTab,
    //     tabMode: prev.tabMode,
    //     newsItems: prev.newsItems.length,
    //     searchResults: prev.searchResults?.length
    //   },
    //   next: {
    //     activeTabId: next.activeTabId,
    //     isNewTab: next.isNewTab,
    //     tabMode: next.tabMode,
    //     newsItems: next.newsItems.length,
    //     searchResults: next.searchResults?.length
    //   }
    // });
  }

  return areEqual;
});

export default MemoizedTabController;
