// src\components\Tabs\TabContainer.tsx
import * as React from 'react';
import { useState, useRef, useCallback, useMemo, useEffect } from 'react';
import { DraggableTabs } from './DraggableTabs';
import { NewsItem } from '../../types';
import { useUI } from '../../contexts/UIContext';
import { NavigationBar } from '../NavigationBar';
import { Content } from '../Content/Content';
import styles from '../Layout/Layout.module.css';
import { Tab } from '../../types';
import TabCategoryBar from '../CategoryBar/TabCategoryBar';
import { useDebugRender } from '../../utils/debugTools/debugTools';
import ErrorBoundary from '../ErrorBoundary/ErrorBoundary';
import useNewsMenuHandler from '../CardMoreMenu/NewsMenuHandler';
import { useAppSearch } from '../../hooks/app/useAppSearch';
import { compareImageData } from '../../utils/imageDebugUtils';

interface TabContainerProps {
  activeTabId: string;
  tabs: Tab[];
  onAddTab: () => void;
  onCloseTab: (tabId: string) => void;
  onActivateTab: (tabId: string) => void;
  onReorderTabs?: (newTabs: Tab[]) => void;
  onChangeTabMode?: (tabId: string, mode: 'news' | 'new' | 'search' | 'video') => void;
  onShowNewNews?: (tabId: string) => void;
  isLeftPanelCollapsed?: boolean;
  isRightPanelCollapsed?: boolean;
  onToggleLeftPanel?: () => void;
  onToggleRightPanel?: () => void;
  enableFrontendSearch?: boolean;
  onBack?: () => void;
  onForward?: () => void;
  onRefresh?: () => void;
  onCategorySelect?: (category: string | null) => void;
  onRefreshTab?: (tabId: string) => Promise<void>;
  onSourceClick?: (sourceId?: string, source?: string) => void;
  onOpenMyPageTab?: () => void;
  openRightPanelWithMode?: (mode: string, category?: string) => void;
  onRenameTab?: (tabId: string, newTitle: string) => void;

  // Hiányzó keresési props hozzáadása:
  isSearchMode?: boolean;
  searchTerm?: string;
  searchResults?: NewsItem[];
  onSearch?: (query: string, results: NewsItem[]) => void;
  onClearSearch?: () => void;

}

const areTabsEqual = (a: Tab[], b: Tab[]): boolean => {
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) {
    if (a[i].id !== b[i].id || a[i].title !== b[i].title || a[i].mode !== b[i].mode) {
      return false;
    }
  }
  return true;
};

const AVAILABLE_CATEGORIES = [
  'Politics',
  'Economy', 
  'Business',
  'Sports',
  'World',
  'Education',
  'Environment',
];

const TabContainerComponent: React.FC<TabContainerProps> = ({
  activeTabId,
  tabs,
  onAddTab,
  onCloseTab,
  onActivateTab,
  onReorderTabs = () => {},
  onChangeTabMode,
  onShowNewNews,
  isLeftPanelCollapsed,
  isRightPanelCollapsed,
  onToggleLeftPanel,
  onToggleRightPanel,
  enableFrontendSearch: _enableFrontendSearch = false,
  onBack,
  onForward,
 // onRefresh,
  onCategorySelect,
 // onRefreshTab,
  onSourceClick,
  onOpenMyPageTab,
  openRightPanelWithMode,
  onRenameTab,
}) => {
  useDebugRender('TabContainer');
  
  const { handleSearch, handleClearSearch, getTabSearchState, tabSearchState } = useAppSearch();
  
  const { uiState } = useUI();
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [categoryCounts, setCategoryCounts] = useState<Record<string, number>>({});
  const [currentNewsForFrontendSearch, setCurrentNewsForFrontendSearch] = useState<NewsItem[]>([]);

  const { handleToggleMenu, renderMenu } = useNewsMenuHandler(currentNewsForFrontendSearch);

  const contentRefreshRef = React.useRef<(() => Promise<number>) | null>(null);
  
  const activeTabIdRef = useRef(activeTabId);
  React.useEffect(() => {
    activeTabIdRef.current = activeTabId;
  }, [activeTabId]);

  const handleNewsItemsUpdateFromContent = useCallback((items: NewsItem[]) => {
    console.log('--- 1. FORRÁS (TabContainer) ---');
    if (items && items.length > 0) {
        console.log('Az első cikk itt:', items[0]);
        console.log('Az első cikk imageUrl-je:', items[0].imageUrl);
    }
    setCurrentNewsForFrontendSearch(items);
  }, []);

  const handleCategorySelect = useCallback((category: string | null) => {
    setSelectedCategory(category);
    if (onCategorySelect) {
      onCategorySelect(category);
    }
  }, [onCategorySelect]);

  const handleNavigationBack = useCallback(() => {
    if (onBack) {
      onBack();
    }
  }, [onBack]);

  const handleNavigationForward = useCallback(() => {
    if (onForward) {
      onForward();
    }
  }, [onForward]);

  const handleNavigationRefresh = useCallback(async (): Promise<number> => {
    try {
      return contentRefreshRef.current ? await contentRefreshRef.current() : 0;
    } catch {
      return 0;
    }
  }, []);

  const handleNavigationSettings = useCallback(() => {}, []);

  const handleNavigationInfo = useCallback(() => {}, []);

  const handleContentRefreshRegister = useCallback(
    (refreshFn: (() => Promise<number>) | null) => {
      contentRefreshRef.current = refreshFn;
    },
    [],
  );

  const navigationBarProps = useMemo(() => ({
    activeTabId,
    canGoBack: true,
    canGoForward: true,
    onBack: handleNavigationBack,
    onForward: handleNavigationForward,
    onRefresh: handleNavigationRefresh,
    newsItems: currentNewsForFrontendSearch,
    onSettings: handleNavigationSettings,
    onInfo: handleNavigationInfo,
    isLeftPanelCollapsed,
    isRightPanelCollapsed,
    onToggleLeftPanel,
    onToggleRightPanel,
    onSearch: (tabId: string, query: string, results: NewsItem[]) => handleSearch(tabId, query, results),
    onClearSearch: (tabId: string) => handleClearSearch(tabId),
  }), [
    activeTabId,
    handleNavigationBack,
    handleNavigationForward,
    handleNavigationRefresh,
    currentNewsForFrontendSearch,
    handleNavigationSettings,
    handleNavigationInfo,
    isLeftPanelCollapsed,
    isRightPanelCollapsed,
    onToggleLeftPanel,
    onToggleRightPanel,
    handleSearch,
    handleClearSearch,
  ]);

  const contentProps = useMemo(() => {
    // EZ A FONTOS LOG:
    console.log(`[TabContainer] contentProps újraszámolása. Aktív fül: ${activeTabId}`);
    const activeTabSearchState = getTabSearchState(activeTabId);
    console.log(`[TabContainer] Az aktív fül keresési állapota:`, activeTabSearchState);
    return {
      activeTabId,
      tabs,
      onChangeTabMode,
      onRefreshRegister: handleContentRefreshRegister,
      searchResults: activeTabSearchState.searchResults,
      searchTerm: activeTabSearchState.searchTerm,
      isSearchMode: activeTabSearchState.isSearchMode,
      onClearSearch: () => handleClearSearch(activeTabId),
      onNewsItemsUpdate: handleNewsItemsUpdateFromContent,
      onSourceClick,
      onOpenMyPageTab,
      onToggleMenu: handleToggleMenu,
      openRightPanelWithMode,
      onRenameTab,
    };
  }, [
    activeTabId,
    tabs,
    onChangeTabMode,
    handleContentRefreshRegister,
    tabSearchState, // helyes: a keresési állapot változására is újraszámol
    handleClearSearch,
    handleNewsItemsUpdateFromContent,
    onSourceClick,
    onOpenMyPageTab,
    handleToggleMenu,
    openRightPanelWithMode,
    onRenameTab,
  ]);

  const categoryBarProps = useMemo(() => ({
    categories: AVAILABLE_CATEGORIES,
    selectedCategory,
    onCategorySelect: handleCategorySelect,
    categoryCounts,
  }), [selectedCategory, handleCategorySelect, categoryCounts]);

  useEffect(() => {
    const mockCounts: Record<string, number> = {
      Politics: 12,
      Economy: 8,
      Business: 5,
      Sports: 15,
      World: 20,
      Education: 3,
      Environment: 7,
    };
    setCategoryCounts(mockCounts);
  }, [activeTabId]);

  useEffect(() => {}, [activeTabId, tabs]);

  // --- DIAGNOSZTIKAI HOOK: Képmezők összehasonlítása keresés és normál lista között ---
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
        const activeSearchState = getTabSearchState(activeTabId);
        if (
            activeSearchState.isSearchMode &&
            activeSearchState.searchResults &&
            activeSearchState.searchResults.length > 0 &&
            currentNewsForFrontendSearch.length > 0
        ) {
            compareImageData(
                activeSearchState.searchResults,
                currentNewsForFrontendSearch,
                `Navbar Search vs. Tab Content (Tab ID: ${activeTabId})`
            );
        }
    }
}, [
    tabSearchState,
    activeTabId,
    currentNewsForFrontendSearch,
    getTabSearchState
]);

  return (
    <div className={styles.contentWithTabs}>
      <div role="tablist" aria-label="Fülek">
        <DraggableTabs
          tabs={tabs}
          onAddTab={onAddTab}
          onCloseTab={onCloseTab}
          onActivateTab={onActivateTab}
          onReorderTabs={onReorderTabs}
          onShowNewNews={onShowNewNews}
        />
      </div>

      <NavigationBar {...navigationBarProps} />

      {uiState.showCategoryBar && (
        <TabCategoryBar {...categoryBarProps} />
      )}

      <ErrorBoundary>
        <Content {...contentProps} />
      </ErrorBoundary>
      {renderMenu()}
    </div>
  );
};

export const TabContainer = React.memo(TabContainerComponent, (prevProps, nextProps) => {
  const primitiveEqual = (
    prevProps.activeTabId === nextProps.activeTabId &&
    prevProps.isLeftPanelCollapsed === nextProps.isLeftPanelCollapsed &&
    prevProps.isRightPanelCollapsed === nextProps.isRightPanelCollapsed &&
    prevProps.enableFrontendSearch === nextProps.enableFrontendSearch
  );

  const arrayEqual = (
    areTabsEqual(prevProps.tabs, nextProps.tabs)
  );

  const callbackEqual = (
    prevProps.onAddTab === nextProps.onAddTab &&
    prevProps.onCloseTab === nextProps.onCloseTab &&
    prevProps.onActivateTab === nextProps.onActivateTab &&
    prevProps.onReorderTabs === nextProps.onReorderTabs &&
    prevProps.onChangeTabMode === nextProps.onChangeTabMode &&
    prevProps.onShowNewNews === nextProps.onShowNewNews &&
    prevProps.onToggleLeftPanel === nextProps.onToggleLeftPanel &&
    prevProps.onToggleRightPanel === nextProps.onToggleRightPanel &&
    prevProps.onSourceClick === nextProps.onSourceClick &&
    prevProps.onOpenMyPageTab === nextProps.onOpenMyPageTab &&
    prevProps.openRightPanelWithMode === nextProps.openRightPanelWithMode &&
    prevProps.onRenameTab === nextProps.onRenameTab
  );

  return primitiveEqual && arrayEqual && callbackEqual;
});