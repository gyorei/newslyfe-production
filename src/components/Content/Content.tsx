import * as React from 'react';
import styles from './Content.module.css';
import { Tab, NewsItem } from '../../types';
import { TabPanel } from '../Panel/TabPanel';
import Home from '../Tabs/Home/Home';
import { GeoQueryResult } from '../Tabs/NewTab/geo/GeoMatcher';
import { TabSearchPanel } from '../Panel/TabSearchPanel';
import { useTabCache } from '../../hooks/useTabStorage/useTabCache'; // ÚJ: Cache hook importálása

type TabMode = 'news' | 'new' | 'search' | 'video';

interface ContentProps {
  activeTabId: string;
  tabs: Tab[];
  searchResults?: NewsItem[];
  searchTerm?: string;
  isSearchMode?: boolean;
  onClearSearch?: () => void;
  onToggleMenu?: (cardId: string | undefined, anchorEl: HTMLElement | null, cardEl?: HTMLElement | null) => void;
  onSourceClick?: (sourceId?: string, source?: string) => void;
  onRefreshRegister?: (refreshFn: (() => Promise<number>) | null) => void;
  onNewsItemsUpdate?: (newsItems: NewsItem[]) => void;
  onChangeTabMode?: (tabId: string, mode: TabMode) => void;
  onOpenMyPageTab?: () => void;
  openRightPanelWithMode?: (mode: string, category?: string) => void;
  onRenameTab?: (tabId: string, newTitle: string) => void;
}

export const Content: React.FC<ContentProps> = ({
  activeTabId,
  tabs,
  onToggleMenu,
  onSourceClick,
  onRefreshRegister,
  onNewsItemsUpdate,
  searchResults,
  searchTerm,
  isSearchMode,
  onClearSearch,
  onChangeTabMode,
  onOpenMyPageTab,
  openRightPanelWithMode,
  onRenameTab,
}) => {
  const { getTabContent } = useTabCache(); // ÚJ: Cache hook használata
  const [singleTabModes, setSingleTabModes] = React.useState<
    Record<string, { active: boolean; results: NewsItem[]; query: string; geoResult: GeoQueryResult | null }>
  >({});

  // ÚJ: Keresési kifejezés kinyerése a fül címéből
  const extractSearchTermFromTitle = React.useCallback((title: string): string => {
    const match = title.match(/🔍\s+(.+)/);
    return match ? match[1].trim() : '';
  }, []);

  // ÚJ: Cache ellenőrzése home tabhoz
  const checkHomeTabCache = React.useCallback(
    async (tab: Tab) => {
      if (tab.mode === 'home' && tab.title.includes('🔍')) {
        const cached = await getTabContent(tab.id);
        if (cached && cached.meta && typeof cached.meta.searchTerm === 'string') {
          setSingleTabModes((prev) => ({
            ...prev,
            [tab.id]: {
              active: true,
              results: (cached.articles as Partial<NewsItem>[]).map((a) => ({
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
              })),
              query: cached.meta ? String(cached.meta.searchTerm) : '',
              geoResult: null,
            },
          }));
          console.log(`[Content] Cache visszatöltve home tabhoz: ${tab.id}, keresés: ${cached.meta ? cached.meta.searchTerm : ''}`);
        }
      }
    },
    [getTabContent],
  );

  // ÚJ: Cache ellenőrzés minden tabhoz induláskor
  React.useEffect(() => {
    tabs.forEach((tab) => {
      if (tab.mode === 'home') {
        checkHomeTabCache(tab);
      }
    });
  }, [tabs, checkHomeTabCache]);

  const handleSearchComplete = React.useCallback(
    (results: NewsItem[], query: string, geoResult: GeoQueryResult) => {
      setSingleTabModes((prev) => ({
        ...prev,
        [activeTabId]: {
          active: true,
          results,
          query,
          geoResult,
        },
      }));
      if (typeof onRenameTab === 'function') {
        onRenameTab(activeTabId, `🔍 ${query}`);
      }
    },
    [activeTabId, onRenameTab],
  );

  const handleBackToSearch = React.useCallback(() => {
    setSingleTabModes((prev) => ({
      ...prev,
      [activeTabId]: {
        active: false,
        results: [],
        query: '',
        geoResult: null,
      },
    }));
  }, [activeTabId]);

  const currentTabSingleMode = React.useMemo(() => {
    return singleTabModes[activeTabId] || {
      active: false,
      results: [],
      query: '',
      geoResult: null,
    };
  }, [singleTabModes, activeTabId]);

  const activeRefreshFnRef = React.useRef<(() => Promise<number>) | null>(null);

  const handleRefreshRegisterFromPanel = React.useCallback(
    (isActive: boolean, refreshFn: () => Promise<number>) => {
      if (isActive) {
        activeRefreshFnRef.current = refreshFn;
        if (onRefreshRegister) {
          onRefreshRegister(refreshFn);
        }
      }
    },
    [onRefreshRegister],
  );

  React.useEffect(() => {
    return () => {
      if (onRefreshRegister) {
        onRefreshRegister(null);
      }
    };
  }, [activeTabId, onRefreshRegister]);

  return (
    <div className={styles.contentArea}>
      {tabs.map((tab) => {
        const isActive = tab.id === activeTabId;
        const tabState = {
          searchResults: isActive ? (searchResults || []) : [],
          isSearchMode: isActive ? isSearchMode : false,
          searchTerm: isActive ? (searchTerm || extractSearchTermFromTitle(tab.title)) : '', // ÚJ: searchTerm fallback
        };
        const renderContent = () => {
          if (tab.mode === 'home') {
            if (currentTabSingleMode.active) {
              return (
                <TabPanel
                  tab={{ ...tab, mode: 'search', title: `🔍 ${currentTabSingleMode.query}` }}
                  isActive={isActive}
                  searchResults={currentTabSingleMode.results}
                  searchTerm={currentTabSingleMode.query}
                  isSearchMode={true}
                  onClearSearch={handleBackToSearch}
                  onToggleMenu={onToggleMenu}
                  onSourceClick={onSourceClick}
                  onRefreshRegister={handleRefreshRegisterFromPanel}
                  onNewsItemsUpdate={onNewsItemsUpdate}
                  onChangeTabMode={onChangeTabMode}
                  openRightPanelWithMode={openRightPanelWithMode}
                />
              );
            }
            return (
              <Home
                title={tab.title}
                isActive={isActive}
                onConfigChange={(newMode: TabMode) => onChangeTabMode?.(tab.id, newMode)}
                onSearchComplete={handleSearchComplete}
                openMyPageTab={onOpenMyPageTab}
                openRightPanelWithMode={openRightPanelWithMode}
              />
            );
          }
          if (isActive && tabState.isSearchMode && tabState.searchResults.length > 0) {
            return (
              <TabSearchPanel
                tabSearchResults={tabState.searchResults}
                searchTerm={tabState.searchTerm}
                onClearSearch={onClearSearch}
                activeTabId={tab.id} 
                tabTitle={tab.title} 
                openRightPanelWithMode={openRightPanelWithMode}
              />
            );
          }
          return (
            <TabPanel
              tab={tab}
              isActive={isActive}
              searchResults={tabState.searchResults}
              searchTerm={tabState.searchTerm}
              isSearchMode={tabState.isSearchMode}
              onClearSearch={onClearSearch}
              onToggleMenu={onToggleMenu}
              onSourceClick={onSourceClick}
              onRefreshRegister={handleRefreshRegisterFromPanel}
              onNewsItemsUpdate={onNewsItemsUpdate}
              onChangeTabMode={onChangeTabMode}
              openRightPanelWithMode={openRightPanelWithMode}
            />
          );
        };
        return (
          <div
            key={tab.id}
            style={{ display: isActive ? 'block' : 'none', height: '100%' }}
            role="tabpanel"
            hidden={!isActive}
            aria-labelledby={`tab-${tab.id}`}
          >
            {renderContent()}
          </div>
        );
      })}
    </div>
  );
};

export default Content;