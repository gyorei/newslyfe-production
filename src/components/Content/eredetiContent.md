// src/components/Content/Content.tsx (JAVÍTOTT VERZIÓ)

import * as React from 'react';
import styles from './Content.module.css';
import { Tab, NewsItem } from '../../types';
import { TabPanel } from '../Panel/TabPanel';
import Home from '../Tabs/Home/Home'; // 1. LÉPÉS: Importáljuk a Home komponenst
import { GeoQueryResult } from '../Tabs/NewTab/geo/GeoMatcher';
import { TabSearchPanel } from '../Panel/TabSearchPanel';

// Új típus a 'any' helyett
// TabPanel és Home tab módok típusa
// Komment: csak ezek a módok engedélyezettek
// (news: normál, new: új fül, search: keresés, video: videó)
type TabMode = 'news' | 'new' | 'search' | 'video';

// A ContentProps egyszerűsödik, csak a globális dolgok maradnak
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
  // Hozzáadjuk a hiányzó propokat, amiket a Home/TabController igényelhet
  onChangeTabMode?: (tabId: string, mode: TabMode) => void;
  onOpenMyPageTab?: () => void; // ✅ My oldal prop hozzáadva
  openRightPanelWithMode?: (mode: string, category?: string) => void; // <-- ÚJ PROP
  onRenameTab?: (tabId: string, newTitle: string) => void; // <-- ÚJ PROP
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
  onChangeTabMode, // Hiányzó prop hozzáadva
  onOpenMyPageTab, // ✅ My oldal prop átvétele
  openRightPanelWithMode, // <-- ÚJ PROP FOGADÁSA
  onRenameTab, // <-- ÚJ PROP FOGADÁSA
}) => {
  // --- SINGLE TAB MODE ÁLLAPOT ÉS KEZELŐK ---
  const [singleTabModes, setSingleTabModes] = React.useState<
    Record<string, { active: boolean; results: NewsItem[]; query: string; geoResult: GeoQueryResult | null }>
  >({});

  const handleSearchComplete = React.useCallback((results: NewsItem[], query: string, geoResult: GeoQueryResult) => {
    setSingleTabModes(prev => ({
      ...prev,
      [activeTabId]: {
        active: true,
        results,
        query,
        geoResult,
      },
    }));
    // --- ÚJ: Tab átnevezése keresés után ---
    if (typeof onRenameTab === 'function') {
      onRenameTab(activeTabId, `🔍 ${query}`);
    }
  }, [activeTabId, onRenameTab]);

  const handleBackToSearch = React.useCallback(() => {
    setSingleTabModes(prev => ({
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

  // --- TAB-SPECIFIKUS KERESÉSI ÁLLAPOT ---
  const [tabSearchState, setTabSearchState] = React.useState<{
    [tabId: string]: {
      searchResults: NewsItem[];
      isSearchMode: boolean;
      searchTerm: string;
    }
  }>({});

  const handleSearch = React.useCallback((tabId: string, query: string, results: NewsItem[]) => {
    setTabSearchState(prev => ({
      ...prev,
      [tabId]: { searchResults: results, isSearchMode: true, searchTerm: query }
    }));
  }, []);

  const handleClearSearch = React.useCallback((tabId: string) => {
    setTabSearchState(prev => ({
      ...prev,
      [tabId]: { searchResults: [], isSearchMode: false, searchTerm: '' }
    }));
  }, []);

  // --- REFRESH KEZELÉS ---
  const activeRefreshFnRef = React.useRef<(() => Promise<number>) | null>(null);

  // Ez az a függvény, amit a TabPanel-nek át kell adni!
  const handleRefreshRegisterFromPanel = React.useCallback((isActive: boolean, refreshFn: () => Promise<number>) => {
    if (isActive) {
      activeRefreshFnRef.current = refreshFn;
      if (onRefreshRegister) {
        onRefreshRegister(refreshFn);
      }
    }
  }, [onRefreshRegister]);

  React.useEffect(() => {
    return () => {
      if (onRefreshRegister) {
        onRefreshRegister(null);
      }
    };
  }, [activeTabId, onRefreshRegister]);

  return (
    <div className={styles.contentArea}>
      {tabs.map(tab => {
        const isActive = tab.id === activeTabId;
        const tabState = tabSearchState[tab.id] || { searchResults: [], isSearchMode: false, searchTerm: '' };
        const renderContent = () => {
          // --- HOME TAB LOGIKA (SINGLE TAB MODE-DAL) ---
          if (tab.mode === 'home') {
            if (currentTabSingleMode.active) {
              // Single Tab Mode: keresési eredmények megjelenítése TabPanel-lel
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
                />
              );
            }
            // Normál Home kereső UI
            return (
              <Home
                title={tab.title}
                isActive={isActive}
                onConfigChange={(newMode: TabMode) => onChangeTabMode?.(tab.id, newMode)}
                onSearchComplete={handleSearchComplete}
                openMyPageTab={onOpenMyPageTab} // ✅ My oldal prop továbbadva
                openRightPanelWithMode={openRightPanelWithMode} // <-- PROP TOVÁBBADÁSA
              />
            );
          }
          // --- TAB KERESŐ VÁLTÓ LOGIKA ---
          if (isActive && tabState.isSearchMode && tabState.searchResults.length > 0) {
            return (
              <TabSearchPanel
                tabSearchResults={tabState.searchResults}
                searchTerm={tabState.searchTerm}
                onClearSearch={() => handleClearSearch(tab.id)}
              />
            );
          }
          // --- NORMÁL TAB LOGIKA ---
          return (
            <TabPanel
              tab={tab}
              isActive={isActive}
              searchResults={tabState.searchResults}
              searchTerm={tabState.searchTerm}
              isSearchMode={tabState.isSearchMode}
              onClearSearch={() => handleClearSearch(tab.id)}
              onToggleMenu={onToggleMenu}
              onSourceClick={onSourceClick}
              onRefreshRegister={handleRefreshRegisterFromPanel}
              onNewsItemsUpdate={onNewsItemsUpdate}
              onChangeTabMode={onChangeTabMode}
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