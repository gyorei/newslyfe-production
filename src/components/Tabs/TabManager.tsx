// src\components\Tabs\TabManager.tsx
import React, { useState, useCallback } from 'react'; // useEffect törölve, mert React.useEffect-ként van használva
import { TabContainer } from './TabContainer';
import { Tab } from '../../types';
import { NewsItem } from '../../types'; // Helyes útvonal
// TabState típus
interface TabState {
  newsItems: NewsItem[];
  loading: boolean;
  error: Error | string | null;
  videoItems?: unknown[];
  videoLoading?: boolean;
  videoError?: Error | string | null;
}

// Define TabManagerProps if needed (empty for now, can be extended)
interface TabManagerProps {
  activeTabId: string;
  tabs: Tab[];
  onAddTab: () => void;
  onCloseTab: (tabId: string) => void;
  onActivateTab: (tabId: string) => void;
  onReorderTabs?: (newTabs: Tab[]) => void;
  onChangeTabMode?: (tabId: string, mode: 'news' | 'new' | 'search' | 'video' | 'my_page') => void; // 'my_page' hozzáadva
  onShowNewNews?: (tabId: string) => void;
  isLeftPanelCollapsed?: boolean;
  isRightPanelCollapsed?: boolean;
  onToggleLeftPanel?: () => void;
  onToggleRightPanel?: () => void;
  isSearchMode?: boolean;
  searchTerm?: string;
  searchResults?: NewsItem[];
  onSearch?: (query: string, results: NewsItem[]) => void;
  onClearSearch?: () => void;
  enableFrontendSearch?: boolean;
  onBack?: () => void;
  onForward?: () => void;
  onRefresh?: () => void;
  onCategorySelect?: (category: string | null) => void;
  loadTabContent: (tabId: string) => Promise<{ articles: NewsItem[] } | null>; // pontosabb típus
}

// Végleges cache-first fetchTabData implementáció
async function fetchTabData(tabId: string, tabType: string, loadTabContent: (tabId: string) => Promise<{ articles: NewsItem[] } | null>): Promise<Partial<TabState>> {
  // 'my_page' tab: soha ne töltsön híreket, csak üres adat
  if (
    tabType === 'home' ||
    tabType === 'new' ||
    tabType === 'panel' ||
    tabType === 'my_page' ||
    tabId === 'default-tab' ||
    tabId === 'tab-0'
  ) {
    return { newsItems: [], loading: false, error: null };
  }

  // 1. Memóriacache (tabStates) - ezt a TabManager state kezeli, így a hívó oldalon már ellenőrizve van
  // 2. IndexedDB (loadTabContent)
  try {
    const dbContent = await loadTabContent(tabId);
    if (dbContent && dbContent.articles && dbContent.articles.length > 0) {
      return { newsItems: dbContent.articles, loading: false, error: null };
    }
  } catch (err) {
    console.warn('[fetchTabData] IndexedDB hiba:', err);
  }

  // 3. API hívás (TODO: ide jön a valódi API call)
  try {
    await new Promise(resolve => setTimeout(resolve, 500));
    // const fakeData = Array.from({ length: Math.floor(Math.random() * 500) + 100 }, (_, i) => ({
    //   id: String(i),
    //   title: `Hír ${i} a ${tabId}-hez`,
    //   description: 'Teszt leírás',
    //   imageUrl: '',
    //   source: 'Teszt forrás',
    //   sourceId: 'test-source',
    //   date: new Date().toISOString(),
    //   timestamp: Date.now(),
    //   url: 'https://example.com',
    //   country: 'HU',
    //   continent: 'Europe',
    //   category: 'teszt',
    //   categories: ['teszt'],
    //   isRead: false,
    //   hasRssFeed: false,
    //   sourceStatus: "valid" as const,
    //   isNew: true
    // }));
    // return { newsItems: fakeData, loading: false, error: null };
    // --- NINCS TÖBBÉ BEÉGETETT HÍR ---
    return { newsItems: [], loading: false, error: null };
  } catch (error) {
    console.error(`[fetchTabData] Error fetching data for ${tabId}:`, error);
    const safeError: Error | string = error instanceof Error ? error : String(error);
    return { error: safeError, loading: false };
  }
}

const TabManager: React.FC<TabManagerProps> = (props) => {
  const [tabStates, setTabStates] = useState<Record<string, TabState>>({});

  // Automatikus adatbetöltés aktív tab váltásakor
  React.useEffect(() => {
    const activeTab = props.tabs.find(tab => tab.id === props.activeTabId);
    if (!activeTab) return;
    const currentTabState = tabStates[props.activeTabId];
    const tabType = (activeTab.mode as string) || 'panel';
    if (
      !currentTabState ||
      (currentTabState.newsItems?.length === 0 && !currentTabState.loading && !currentTabState.error)
    ) {
      setTabStates(prev => ({
        ...prev,
        [props.activeTabId]: {
          ...(prev[props.activeTabId] || {}),
          loading: true,
          error: null,
        }
      }));
      fetchTabData(props.activeTabId, tabType, props.loadTabContent)
        .then(data => {
          setTabStates(prev => ({
            ...prev,
            [props.activeTabId]: {
              ...(prev[props.activeTabId] || {}),
              ...data,
              loading: false,
            }
          }));
        })
        .catch(error => {
          const safeError: Error | string = error instanceof Error ? error : String(error);
          setTabStates(prev => ({
            ...prev,
            [props.activeTabId]: {
              ...(prev[props.activeTabId] || {}),
              error: safeError,
              loading: false,
            }
          }));
        });
    }
  }, [props.activeTabId, props.tabs, props.loadTabContent, tabStates]); // tabStates hozzáadva

  // Frissítsd a cache-t, ha explicit refresh történik
  const handleRefreshTab = useCallback(async (tabId: string) => {
    const activeTab = props.tabs.find(tab => tab.id === tabId);
    const tabType = (activeTab?.mode as string) || 'panel';
    setTabStates(prev => ({
      ...prev,
      [tabId]: { ...prev[tabId], loading: true }
    }));
    try {
      const data = await fetchTabData(tabId, tabType, props.loadTabContent);
      setTabStates(prev => ({
        ...prev,
        [tabId]: { ...prev[tabId], ...data, loading: false }
      }));
    } catch (error) {
      const safeError: Error | string = error instanceof Error ? error : String(error);
      setTabStates(prev => ({
        ...prev,
        [tabId]: { ...prev[tabId], error: safeError, loading: false }
      }));
    }
  }, [props.tabs, props.loadTabContent]);

  return (
    <TabContainer
      {...props}
      onRefreshTab={handleRefreshTab}
    />
  );
};

export default TabManager;
export { fetchTabData };
