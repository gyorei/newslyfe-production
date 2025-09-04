// src/components/Tabs/TabController.tsx
/**
 * @TODO (Refactor) - Technikai Adósság
 * src\components\Tabs\TabController\TabController fejlesztése.md
 * Jelenleg a TabController rendereli a TabPanel-t, és egy "ál" tab objektumot
 * hoz létre a kompatibilitás érdekében.
 * 
 * A hosszú távú cél az, hogy ezt a logikát megfordítsuk:
 * 1. A TabPanel legyen a "döntéshozó", ami a saját `tab.mode` alapján dönt.
 * 2. A TabController-ből származó nézeteket (Home, VideoPanel, SearchTab)
 *    a TabPanel renderelje közvetlenül.
 * 3. A TabController jelenlegi szerepe ezzel megszűnne vagy átalakulna.
 * 
 * Ez a refaktorálás a jövőben esedékes, miután a kritikusabb feladatok
 * (pl. javítások, auth) elkészültek.
 */


import React, { useState, useMemo, useCallback, useRef } from 'react';
import SearchTab from './SearchTab/SearchTab';
import { TabPanel } from '../Panel/TabPanel';
import { Tab, NewsItem } from '../../types'; // A 'Tab' típus importálása
import { useDebugRender } from '../../utils/debugTools/debugTools';
import MemoizedVideoPanel from '../VideoPanel/VideoPanel';

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
  onConfigChange: (mode: 'news' | 'browse' | 'search' | 'video') => void;
  onRetry: () => void;
  onToggleMenu: (cardId: string | undefined, anchorEl: HTMLElement | null, cardEl?: HTMLElement | null) => void;
  searchResults?: NewsItem[];
  isSearchMode?: boolean;
  onClearSearch?: () => void;
  onPaginationChange?: (shouldScrollToTop: boolean) => void;
  videoItems?: NewsItem[];
  videoLoading?: boolean;
  videoError?: Error | string | null;
  newsItemsHash?: string;
  onSourceClick?: (sourceId?: string, source?: string) => void;
}

const TabControllerComponent: React.FC<TabControllerProps> = ({
  activeTabId,
  isNewTab,
  tabMode = 'news',
  title = '',
  searchTerm = '',
  newsItems = [],
  loading = false,
  error = null,
  onConfigChange,
  onRetry,
  onToggleMenu,
  searchResults = [],
  isSearchMode = false,
  onClearSearch,
  onPaginationChange,
  videoItems = [],
  videoLoading = false,
  videoError = null,
  onSourceClick,
}) => {
  useDebugRender('TabController');

  const activeTabIdRef = useRef(activeTabId);
  activeTabIdRef.current = activeTabId;

  const [singleTabModes, setSingleTabModes] = useState<
    Record<string, { active: boolean; results: NewsItem[]; query: string }>
  >({});

  const handleSearchComplete = useCallback((results: NewsItem[], query: string) => {
    setSingleTabModes(prev => ({
      ...prev,
      [activeTabIdRef.current]: {
        active: true,
        results,
        query,
      },
    }));
  }, []);

  const handleBackToSearch = useCallback(() => {
    setSingleTabModes(prev => ({
      ...prev,
      [activeTabIdRef.current]: {
        active: false,
        results: [],
        query: '',
      },
    }));
  }, []);

  const stableOnRetry = useCallback(() => {
    onRetry();
  }, [onRetry]);

  const stableOnToggleMenu = useCallback((cardId: string | undefined, anchorEl: HTMLElement | null, cardEl?: HTMLElement | null) => {
    onToggleMenu(cardId, anchorEl, cardEl);
  }, [onToggleMenu]);

  const currentTabSingleMode = useMemo(() => {
    return singleTabModes[activeTabId] || {
      active: false,
      results: [],
      query: '',
    };
  }, [singleTabModes, activeTabId]);
//////////////////////////////////////////////////////////
  const renderDecisions = useMemo(() => {
    // console.log('[TabController] renderDecisions:', decisions, 'tabMode:', tabMode, 'activeTabId:', activeTabId);
    return {
      shouldRenderSingleTabMode: currentTabSingleMode.active && currentTabSingleMode.results.length > 0,
      shouldRenderNewTab: isNewTab,
      shouldRenderSearchTab: tabMode === 'search' && !!searchTerm,
      shouldRenderVideoTab: tabMode === 'video',
    };
  }, [
    currentTabSingleMode.active,
    currentTabSingleMode.results.length,
    isNewTab,
    tabMode,
    searchTerm
  ]); // activeTabId dependency eltávolítva

  // ✅ JAVÍTÁS: A 'tab' objektum létrehozása a TabPanel számára
  const panelProps = useMemo(() => ({
    tab: {
      id: activeTabId,
      title: title,
      active: true,
      mode: tabMode, // <-- dinamikusan átadjuk a mode-ot!
      filters: {},
    } as Tab,
    isActive: true, // A TabControlleren belül renderelt panel mindig aktív
    
    // Az eredeti, egyedi props-ok, amiket a TabPanel továbbra is használhat
    newsItems, // Bár a TabPanel maga tölti, itt átadhatjuk a fallback adatot
    loading,
    error,
    onRetry: stableOnRetry,
    onToggleMenu,
    searchResults,
    searchTerm,
    isSearchMode,
    onClearSearch,
    onSourceClick,
  }), [
    activeTabId, title, newsItems, loading, error, stableOnRetry,
    onToggleMenu, searchResults, searchTerm, isSearchMode, onClearSearch, onSourceClick, tabMode
  ]);
  
  // ✅ JAVÍTÁS: A 'tab' objektum létrehozása a SingleTabPanel számára
  const singleTabPanelProps = useMemo(() => ({
    tab: {
      id: `search-${activeTabId}`,
      title: `🔍 ${currentTabSingleMode.query}`,
      active: true,
      mode: 'search',
      filters: { searchTerm: currentTabSingleMode.query },
    } as Tab,
    isActive: true,

    searchResults: currentTabSingleMode.results,
    searchTerm: currentTabSingleMode.query,
    isSearchMode: true,
    onClearSearch: handleBackToSearch,
    onToggleMenu,
  }), [
    activeTabId, currentTabSingleMode.query, currentTabSingleMode.results,
    handleBackToSearch, onToggleMenu
  ]);

  const videoPanelProps = useMemo(() => ({
    videoItems,
    loading: videoLoading,
    error: videoError,
    onRetry: stableOnRetry,
    onToggleMenu: stableOnToggleMenu,
    isActive: true,
  }), [
    videoItems,
    videoLoading,
    videoError,
    stableOnRetry,
    stableOnToggleMenu,
  ]);

  if (renderDecisions.shouldRenderSingleTabMode) {
    // console.log('[TabController] TabPanel render (singleTabMode):', { tabMode, activeTabId });
    return <TabPanel {...singleTabPanelProps} />;
  }

  if (renderDecisions.shouldRenderVideoTab) {
    // console.log('[TabController] VideoPanel render:', { tabMode, activeTabId });
    return <MemoizedVideoPanel {...videoPanelProps} />;
  }

  // console.log('[TabController] TabPanel render (default):', { tabMode, activeTabId });
  return (
    <>
      {renderDecisions.shouldRenderSearchTab ? (
        <SearchTab searchTerm={searchTerm} isActive={true} />
      ) : (
        <TabPanel {...panelProps} />
      )}
    </>
  );
};

const MemoizedTabController = React.memo(TabControllerComponent, (prev, next) => {
  const primitiveEqual = (
    prev.activeTabId === next.activeTabId &&
    prev.isNewTab === next.isNewTab &&
    prev.tabMode === next.tabMode &&
    prev.title === next.title &&
    prev.searchTerm === next.searchTerm &&
    prev.loading === next.loading &&
    prev.isSearchMode === next.isSearchMode &&
    prev.videoLoading === next.videoLoading &&
    prev.newsItemsHash === next.newsItemsHash
  );

  const arrayLengthEqual = (
    prev.newsItems.length === next.newsItems.length &&
    prev.searchResults?.length === next.searchResults?.length &&
    prev.videoItems?.length === next.videoItems?.length
  );

  const errorEqual = (
    prev.error === next.error &&
    prev.videoError === next.videoError
  );

  const callbackEqual = (
    prev.onConfigChange === next.onConfigChange &&
    prev.onRetry === next.onRetry &&
    prev.onToggleMenu === next.onToggleMenu &&
    prev.onClearSearch === next.onClearSearch &&
    prev.onPaginationChange === next.onPaginationChange &&
    prev.onSourceClick === next.onSourceClick
  );

  const areEqual = primitiveEqual && arrayLengthEqual && errorEqual && callbackEqual;

  if (!areEqual && process.env.NODE_ENV === 'development') {
    const changes = [];
    if (!primitiveEqual) changes.push('primitives');
    if (!arrayLengthEqual) changes.push('arrays');
    if (!errorEqual) changes.push('errors');
    if (!callbackEqual) changes.push('callbacks');
    
    // console.log(`[TabController] 🔄 Re-render reason: [${changes.join(', ')}] - Tab: ${next.activeTabId}`);
  }

  return areEqual;
});

MemoizedTabController.displayName = 'TabController';

export default MemoizedTabController;