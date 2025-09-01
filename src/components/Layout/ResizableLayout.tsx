// filepath: c:\news\src\components\Layout\ResizableLayout.tsx
/*
A szoftver-fejlesztésben fontos alapelv 
a YAGNI (You Aren't Gonna Need It) 
- ne vezess be komplexitást
, amíg nincs rá valódi igény.
*/

import * as React from 'react';
import { useState, useEffect, useRef } from 'react';
import {
  Panel,
  PanelGroup,
  PanelResizeHandle,
  ImperativePanelHandle,
} from 'react-resizable-panels';
import { Side } from '../Side/Side';
import { TabContainer } from '../Tabs/TabContainer';
import { UtilityPanel } from '../Utility/UtilityPanel/UtilityPanel';
import { Tab } from '../../types';
import { NewsItem } from '../../types'; // ✅ ÚJ: NewsItem import hozzáadása
import styles from './Layout.module.css';
import { useMediaQuery } from '../../hooks/useMediaQuery'; // ÚJ: useMediaQuery importálása
import { useTranslation } from 'react-i18next';

// A lehetséges módok a jobb panelhez, ahogy az UtilityPanel definiálja
type UtilityPanelMode = "tools" | "auth" | "settings" | "favorites" | "history" | "savedNews" | "legal" | "premium";

// A lehetséges szűrők, ahogy a Side komponens elvárja
interface SidePanelFilters {
  continent?: string | null;
  country?: string | null;
  category?: string | null;
  forceRefresh?: boolean;
}

interface ResizableLayoutProps {
  activeTabId: string;
  tabs: Tab[];
  onAddTab: () => void;
  onCloseTab: (tabId: string) => void;
  onActivateTab: (tabId: string) => void;
  isLeftPanelCollapsed: boolean;
  isRightPanelCollapsed: boolean;
  onToggleLeftPanel: () => void;
  onToggleRightPanel: () => void;
  openRightPanelWithMode: (mode: string, category?: string) => void;
  closeRightPanel: () => void;
  utilityMode: UtilityPanelMode;
  utilityCategory?: string;
  onUtilityModeChange: (mode: UtilityPanelMode) => void;
  onFiltersChange: (filters: SidePanelFilters, contentType?: 'text' | 'video' | 'both') => void;
  onReorderTabs?: (newTabs: Tab[]) => void;
  isLoading?: boolean;
  onChangeTabMode?: (tabId: string, mode: 'news' | 'new' | 'search' | 'video') => void;
  onSearchTabOpen?: (searchTerm: string) => void;
  onVideoTabOpen?: () => void;
  loadLocalContent?: () => Promise<string | null>;
  // ÚJ: Új hírek kezeléshez szükséges props
  onShowNewNews?: (tabId: string) => void;
  // ✅ ÚJ: SmartSearchBar keresési props
  isSearchMode?: boolean;
  searchTerm?: string;
  searchResults?: NewsItem[];
  onSearch?: (query: string, results: NewsItem[]) => void;
  onClearSearch?: () => void;
  enableFrontendSearch?: boolean; // <<< HOZZÁADVA
  // ÚJ: Tartalom típus és keresési mód kezelése
  onContentTypeChange?: (contentType: 'text' | 'video' | 'both') => void;
  onSearchModeChange?: (searchMode: 'countries' | 'source' | 'channel') => void;
  activeContentType?: 'text' | 'video' | 'both';
  activeSearchMode?: 'countries' | 'source' | 'channel';
  // ✅ ÚJ: Forrás gomb callback
  onSourceClick?: (sourceId?: string, source?: string) => void;
  onOpenMyPageTab?: () => void; // ✅ My tab prop hozzáadva
  onRenameTab?: (tabId: string, newTitle: string) => void; // <-- HIÁNYZÓ PROP PÓTLÁSA
  // ✅ ÚJ: Téma props-ok
  currentTheme?: 'light' | 'dark' | 'pro-blue';
  onThemeChange?: (theme: 'light' | 'dark' | 'pro-blue') => void;
  showScrollbars?: boolean;
  onToggleScrollbars?: () => void;
}

// ÚJ Konstansok a panel méretekhez
const MOBILE_PANEL_EXPANDED_SIZE_PERCENT = 100; // Bal és jobb panel mobil nézetben
const DEFAULT_WEB_PANEL_LEFT_EXPANDED_SIZE_PERCENT = 25;
const DEFAULT_WEB_PANEL_RIGHT_EXPANDED_SIZE_PERCENT = 25;
const MIN_PANEL_SIZE_MOBILE = 15; // Minimális panelméret mobilon
const MIN_PANEL_SIZE_WEB = 5; // Minimális panelméret weben

export const ResizableLayout: React.FC<ResizableLayoutProps> = ({
  activeTabId,
  tabs,
  onAddTab,
  onCloseTab,
  onActivateTab,
  isLeftPanelCollapsed,
  isRightPanelCollapsed,
  onToggleLeftPanel = () => {},
  onToggleRightPanel = () => {},
  openRightPanelWithMode = () => {},
  closeRightPanel = () => {},
  utilityMode,
  utilityCategory,
  onUtilityModeChange,
  onFiltersChange,
  onReorderTabs,
  isLoading,
  onChangeTabMode,
  onSearchTabOpen,
  onVideoTabOpen = () => {},
  loadLocalContent,
  // ÚJ: Új hírek props (prefixszel jelöljük, hogy nem használjuk közvetlenül)
  onShowNewNews: _onShowNewNews,
  // ✅ ÚJ: Keresési props paraméterek
  isSearchMode = false,
  searchTerm = '',
  searchResults = [],
  onSearch = () => {},
  onClearSearch = () => {},
  enableFrontendSearch = false, // <<< HOZZÁADVA ÉS FOGADVA
  // ÚJ: Tartalom típus és keresési mód props
  onContentTypeChange = () => {},
  onSearchModeChange = () => {},
  activeContentType = 'both',
  activeSearchMode = 'countries',
  onSourceClick,
  onOpenMyPageTab, // ✅ My tab prop átvétele
  onRenameTab, // <-- HIÁNYZÓ PROP PÓTLÁSA
  // ✅ ÚJ: Téma props-ok átvétele
  currentTheme = 'light',
  onThemeChange = () => {},
  showScrollbars = true,
  onToggleScrollbars = () => {},
}) => {
  const leftPanelRef = React.useRef<ImperativePanelHandle>(null);
  const rightPanelRef = React.useRef<ImperativePanelHandle>(null);
  const initialRender = useRef(true);

  const isMobileView = useMediaQuery('(max-width: 768px)');
  const { t } = useTranslation();

  const [leftPanelSize, setLeftPanelSize] = useState(() => {
    const savedSize = localStorage.getItem('leftPanelSize');
    const numSize = Number(savedSize);
    if (savedSize && numSize >= MIN_PANEL_SIZE_WEB && numSize <= 90) {
      return numSize;
    }
    return DEFAULT_WEB_PANEL_LEFT_EXPANDED_SIZE_PERCENT;
  });

  const [rightPanelSize, setRightPanelSize] = useState(() => {
    const savedSize = localStorage.getItem('rightPanelSize');
    const numSize = Number(savedSize);
    if (savedSize && numSize >= MIN_PANEL_SIZE_WEB && numSize <= 90) {
      return numSize;
    }
    return DEFAULT_WEB_PANEL_RIGHT_EXPANDED_SIZE_PERCENT;
  });

  // ÚJ: Új hírek state kezelése
  const [showNewNewsSection, setShowNewNewsSection] = useState(false);
  const [activeNewNewsTab, setActiveNewNewsTab] = useState<string | null>(null);

  const handleLeftPanelResize = (size: number) => {
    if (!isMobileView && size > 0) {
      setLeftPanelSize(size);
      localStorage.setItem('leftPanelSize', String(size));
    }
  };

  const handleRightPanelResize = (size: number) => {
    if (!isMobileView && size > 0) {
      setRightPanelSize(size);
      localStorage.setItem('rightPanelSize', String(size));
    }
  };

  // ÚJ: Badge kattintás kezelése
  const handleShowNewNews = (tabId: string) => {
    setActiveNewNewsTab(tabId);
    setShowNewNewsSection(true);

    // Ha a bal panel össze van csukva, nyissuk ki
    if (leftPanelRef.current && leftPanelRef.current.getSize() === 0) {
      leftPanelRef.current.resize(leftPanelSize);
    }
  };

  // ÚJ: Új hírek panel bezárása
  const handleCloseNewNews = () => {
    setShowNewNewsSection(false);
    setActiveNewNewsTab(null);
  };

  useEffect(() => {
    if (initialRender.current) return;
    const panel = leftPanelRef.current;
    if (!panel) return;

    if (isLeftPanelCollapsed) {
      panel.collapse();
    } else {
      if (isMobileView) {
        panel.resize(MOBILE_PANEL_EXPANDED_SIZE_PERCENT);
      } else {
        panel.resize(leftPanelSize);
      }
    }
  }, [isLeftPanelCollapsed, isMobileView, leftPanelSize]);

  useEffect(() => {
    if (initialRender.current) return;
    const panel = rightPanelRef.current;
    if (!panel) return;

    if (isRightPanelCollapsed) {
      panel.collapse();
    } else {
      if (isMobileView) {
        panel.resize(MOBILE_PANEL_EXPANDED_SIZE_PERCENT);
      } else {
        panel.resize(rightPanelSize);
      }
    }
  }, [isRightPanelCollapsed, isMobileView, rightPanelSize]);

  useEffect(() => {
    if (!initialRender.current) return;

    const leftP = leftPanelRef.current;
    const rightP = rightPanelRef.current;

    if (leftP) {
      if (isLeftPanelCollapsed) leftP.collapse();
      else {
        if (isMobileView) leftP.resize(MOBILE_PANEL_EXPANDED_SIZE_PERCENT);
        else leftP.resize(leftPanelSize);
      }
    }
    if (rightP) {
      if (isRightPanelCollapsed) rightP.collapse();
      else {
        if (isMobileView) rightP.resize(MOBILE_PANEL_EXPANDED_SIZE_PERCENT);
        else rightP.resize(rightPanelSize);
      }
    }
    initialRender.current = false;
  }, [isLeftPanelCollapsed, isRightPanelCollapsed, isMobileView, leftPanelSize, rightPanelSize]);

  if (
    initialRender.current &&
    typeof window !== 'undefined' &&
    window.document.readyState !== 'complete'
  ) {
    return <div className={styles.layoutContainer} />;
  }

  return (
    <div className={styles.layoutContainer}>
      <PanelGroup direction="horizontal" className={styles.panelGroup}>
        <Panel
          ref={leftPanelRef}
          defaultSize={leftPanelSize}
          collapsedSize={0}
          collapsible
          minSize={isMobileView ? MIN_PANEL_SIZE_MOBILE : MIN_PANEL_SIZE_WEB}
          className={`${styles.panel} ${styles.leftPanel}`}
          onResize={handleLeftPanelResize}
          order={1}
        >
          <Side
            onFiltersChange={onFiltersChange}
            onUtilityModeChange={onUtilityModeChange}
            openRightPanelWithMode={openRightPanelWithMode}
            onSearchTabOpen={onSearchTabOpen}
            onVideoTabOpen={onVideoTabOpen}
            onActivateTab={onActivateTab}
            loadLocalContent={loadLocalContent}
            isLocationLoading={isLoading}
            // ÚJ: Új hírek props
            showNewNewsSection={showNewNewsSection}
            activeNewNewsTab={activeNewNewsTab}
            onCloseNewNews={handleCloseNewNews}
            // --- ÚJ: Mobil panel zárás callback és mobil nézet átadása ---
            onCollapseSidePanel={onToggleLeftPanel}
            isMobileView={isMobileView}
            // ÚJ: Tartalom típus és keresési mód props
            onContentTypeChange={onContentTypeChange}
            onSearchModeChange={onSearchModeChange}
            activeContentType={activeContentType}
            activeSearchMode={activeSearchMode}
          />
        </Panel>

        <PanelResizeHandle className={styles.resizeHandle}>
          <div className={styles.handleTrack} />
          <div className={styles.handleIndicator} />
        </PanelResizeHandle>

        <Panel className={`${styles.panel} ${styles.contentPanel}`} order={2}>
          {isLoading && (
            <div className={styles.loadingOverlay}>
              <div className={styles.loadingSpinner}></div>
              <span>{t('layout.loading', 'Betöltés...')}</span>
            </div>
          )}
          <TabContainer
            activeTabId={activeTabId}
            tabs={tabs}
            onAddTab={onAddTab}
            onCloseTab={onCloseTab}
            onActivateTab={onActivateTab}
            onReorderTabs={onReorderTabs}
            onChangeTabMode={onChangeTabMode}
            onShowNewNews={handleShowNewNews}
            isLeftPanelCollapsed={isLeftPanelCollapsed}
            isRightPanelCollapsed={isRightPanelCollapsed}
            onToggleLeftPanel={onToggleLeftPanel}
            onToggleRightPanel={onToggleRightPanel}
            isSearchMode={isSearchMode}
            searchTerm={searchTerm}
            searchResults={searchResults}
            onSearch={onSearch}
            onClearSearch={onClearSearch}
            enableFrontendSearch={enableFrontendSearch}
            onSourceClick={onSourceClick}
            onOpenMyPageTab={onOpenMyPageTab}
            openRightPanelWithMode={openRightPanelWithMode} 
            onRenameTab={onRenameTab} // <-- ÚJ: Tab átnevezés prop továbbadása
          />
        </Panel>

        <PanelResizeHandle className={styles.resizeHandle}>
          <div className={styles.handleTrack} />
          <div className={styles.handleIndicator} />
        </PanelResizeHandle>

        <Panel
          ref={rightPanelRef}
          defaultSize={rightPanelSize}
          collapsedSize={0}
          collapsible
          minSize={isMobileView ? MIN_PANEL_SIZE_MOBILE : MIN_PANEL_SIZE_WEB}
          className={`${styles.panel} ${styles.rightPanel}`}
          onResize={handleRightPanelResize}
          order={3}
        >
          <UtilityPanel
            onClose={closeRightPanel}
            mode={utilityMode}
            category={utilityCategory}
            onUtilityModeChange={onUtilityModeChange}
            activeTabId={activeTabId} // <-- ÚJ: activeTabId prop továbbadása
            // ✅ ÚJ: Téma props-ok átadása
            currentTheme={currentTheme}
            onThemeChange={onThemeChange}
            showScrollbars={showScrollbars}
            onToggleScrollbars={onToggleScrollbars}
          />
        </Panel>
      </PanelGroup>
    </div>
  );
};
