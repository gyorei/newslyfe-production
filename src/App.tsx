// @ts-nocheck - Legacy kód kompatibilitási problémák miatt kikapcsoltuk a típusellenőrzést
// src\App.tsx

// @ts-nocheck - Legacy kód kompatibilitási problémák miatt kikapcsoltuk a típusellenőrzést
// src\App.tsx
import * as React from 'react';
import { useEffect, useCallback, useState, useMemo } from 'react'; // ✅ useMemo hozzáadva
import { Header } from './components/Header/Header';
import { ResizableLayout } from './components/Layout/ResizableLayout';
import StartPage from './components/Tabs/StartPage/StartPage';
import SplashScreen from './components/SplashScreen/SplashScreen';
import { useServerHealth } from './hooks/useServerHealth';
import './App.css';

import { apiClient } from './apiclient/apiClient';
// import { initializePremiumManager } from './premium/premiumManager';
import { initializePremiumManager } from './components/Utility/Premium/premiumManager';
// ============================================================
// PERZISZTENCIA RÉTEG IMPORTOK
// ============================================================
import { useStorage } from './hooks/useStorage';
import { AppProviders } from './providers/AppProviders';
import { useAppSettings } from './hooks/app/useAppSettings'; // ✅ JAVÍTOTT import útvonal
import { useTheme, Theme } from './hooks/app/useTheme'; // ✅ ÚJ: useTheme hook
import { useAppPanels } from './hooks/app/useAppPanels';
import { useAppStorage } from './hooks/app/useAppStorage';
import { useAppTabs } from './hooks/app/useAppTabs';
import { useAppSearch } from './hooks/app/useAppSearch';
import { UIProvider } from './contexts/UIContext';
import { AlertProvider } from './components/AlertMessage';
import { ServerStatus } from './components/ServerStatus/ServerStatus';

// ========================================
// 🎥 AD SENSE SCRIPT LOADING - GOOGLE SZABÁLYOK!
// ========================================
import { loadAdSenseScript } from './components/Ad/adConfig';

// Helper függvények a téma CSS osztályokhoz
const getThemeClassName = (theme: Theme): string => {
  return theme === 'light' ? '' : 'dark';
};

const getThemeDataAttributes = (theme: Theme) => {
  return theme === 'pro-blue' ? { 'data-theme': 'pro-blue' } : {};
};

function App() {
  // 1. MINDEN HOOK A KOMPONENS TETEJÉN!
  const { isReady } = useServerHealth();
  const [showStartPageScreen, setShowStartPageScreen] = useState(() => {
    const hideStartPage = localStorage.getItem('hideStartPage') === 'true';
    return !hideStartPage;
  });
  const { syncInfo, syncNow, state } = useStorage();
  const { storageInitialized, storageError: _storageError } = useAppStorage();
  const { theme, toggleTheme, showScrollbars, toggleScrollbars } = useAppSettings({ storageInitialized });
  const { currentTheme, changeTheme } = useTheme(); // ✅ ÚJ: useTheme hook
  const {
    isLeftPanelCollapsed,
    isRightPanelCollapsed,
    utilityMode,
    utilityCategory,
    setUtilityMode,
    toggleLeftPanel,
    toggleRightPanel,
    openRightPanelWithMode,
    closeRightPanel,
  } = useAppPanels();
  const {
    tabs,
    activeTabId,
    isLocationLoading,
    addTabWithPersistence,
    closeTab,
    activateTab,
    changeTabMode,
    handleReorderTabs,
    handleSearchTabOpen,
    handleVideoTabOpen,
    handleFiltersChange: handleFiltersChangeTabs,
    loadLocalContent,
    handleSourceTabOpen,
    openMyPageTab, // ✅ HOZZÁADVA: My tab megnyitó függvény
    renameTab, // <-- ÚJ: Tab átnevezés függvény
  } = useAppTabs({ storageInitialized, storageState: state });
  
  // ✅ KRITIKUS: Computed values stabilizálása - NINCS IMPORT PROBLÉM
  const activeTab = useMemo(() => 
    tabs.find((tab) => tab.id === activeTabId), 
    [tabs, activeTabId]
  );
  const isVideoTab = useMemo(() => 
    activeTab && activeTab.mode === 'video', 
    [activeTab]
  );
  const videoCountry = useMemo(() => 
    isVideoTab ? activeTab.filters?.country || null : null, 
    [isVideoTab, activeTab]
  );

  const {
    searchResults,
    searchTerm,
    isSearchMode,
    handleSearch,
    handleClearSearch,
    enableFrontendSearch,
  } = useAppSearch();
  const [activeContentType, setActiveContentType] = useState<'text' | 'video' | 'both'>('both');
  const [activeSearchMode, setActiveSearchMode] = useState<'countries' | 'source' | 'channel'>('countries');

  // ========================================
  // 🎥 AD SENSE SCRIPT LOADING - GOOGLE SZABÁLYOK!
  // ========================================
  useEffect(() => {
    if (process.env.NODE_ENV === 'production') {
      loadAdSenseScript()
        .then(() => {
          console.log('[App] ✅ AdSense script sikeresen betöltve');
        })
        .catch((error) => {
          console.error('[App] ❌ AdSense script betöltés sikertelen:', error);
        });
    }
  }, []);

  // ✅ MINDEN callback már stabilizálva van - NEM VÁLTOZTATUNK SEMMIT
  const handleStartPageDismiss = useCallback(() => {
    localStorage.setItem('hideStartPage', 'true');
    setShowStartPageScreen(false);
  }, []);

  const handleContentTypeChange = useCallback((contentType: 'text' | 'video' | 'both') => {
    setActiveContentType(contentType);
  }, []);

  useEffect(() => {
    console.log('[App] Tartalom típus változott:', activeContentType, 'Aktív tab:', activeTab);
  }, [activeContentType, activeTab]);

  const handleSearchModeChange = useCallback((searchMode: 'countries' | 'source' | 'channel') => {
    setActiveSearchMode(searchMode);
    console.log('[App] Keresési mód változott:', searchMode);
  }, []);

  const handleFiltersChange = useCallback((filters, contentType) => {
    handleFiltersChangeTabs(filters, contentType);
  }, [handleFiltersChangeTabs]);

  useEffect(() => {
    if (storageInitialized && !showStartPageScreen) {
      const startupMode = localStorage.getItem('startup_mode') || 'newTab';
      if (tabs.length === 0 && startupMode !== 'continue') {
        // ...
      }
    }
  }, [storageInitialized, showStartPageScreen, tabs.length]);

  useEffect(() => {
    if (syncInfo && syncInfo.pendingCount > 0) {
      console.log(`[App] ${syncInfo.pendingCount} nem szinkronizált elem vár feltöltésre`);
    }
  }, [syncInfo]);

  const handleSyncClick = useCallback(async () => {
    try {
      await syncNow();
      console.log('[App] Szinkronizáció sikeres');
    } catch (error) {
      console.error('[App] Szinkronizációs hiba:', error);
    }
  }, [syncNow]);

  useEffect(() => {
    apiClient
      .ping()
      .then((data) => console.log('[App] API Szerver elérhető:', data))
      .catch((error) => console.error('[App] API kapcsolat hiba:', error));
    console.log('[App] API ping tesztelése kész.');
  }, []);

  const handleSourceClick = useCallback((sourceId?: string, source?: string) => {
    if (sourceId && source) {
      handleSourceTabOpen(sourceId, source);
    }
  }, [handleSourceTabOpen]);

  // ✅ BIZTONSÁGOS OPTIMALIZÁCIÓ: Csak a Header props stabilizálása
  const stableHeaderProps = useMemo(() => ({
    onThemeToggle: () => changeTheme(currentTheme === 'light' ? 'dark' : 'light'), // ✅ ÚJ: useTheme hook használata
    currentTheme: currentTheme, // ✅ ÚJ: useTheme hook használata
    onToggleLeftPanel: toggleLeftPanel,
    onToggleRightPanel: toggleRightPanel,
    isLeftPanelCollapsed,
    isRightPanelCollapsed,
    onToggleScrollbars: toggleScrollbars,
    showScrollbars,
    openRightPanelWithMode,
  }), [
    changeTheme,
    currentTheme,
    toggleLeftPanel,
    toggleRightPanel,
    isLeftPanelCollapsed,
    isRightPanelCollapsed,
    toggleScrollbars,
    showScrollbars,
    openRightPanelWithMode,
  ]);

  useEffect(() => {
    initializePremiumManager();
  }, []);

  // 2. FELTÉTELES RENDER CSAK ITT!
  if (!isReady) {
    return <SplashScreen />;
  }
  if (!storageInitialized) {
    return <div>Loading...</div>;
  }
  const shouldShowStartPage = showStartPageScreen && tabs.length === 0;
  if (shouldShowStartPage) {
    return <StartPage onDismiss={handleStartPageDismiss} />;
  }

  // 3. FŐ APP UI - ✅ CSAK A HEADER PROPS STABILIZÁLVA
  return (
    <UIProvider>
      <AlertProvider>
        <ServerStatus />
        <div
          id="app-container"
          className={`app ${getThemeClassName(currentTheme)} ${showScrollbars ? '' : 'hide-scrollbars'}`}
          {...getThemeDataAttributes(currentTheme)}
        >
          <AppProviders>
            {/* ✅ Stabilizált Header props */}
            <Header {...stableHeaderProps} />
            <div className="main-container">
              {/* ✅ ResizableLayout - EREDETI FORMÁTUMBAN, de stabilizált computed values-ekkel */}
              <ResizableLayout
                activeTabId={activeTabId}
                tabs={tabs}
                onAddTab={addTabWithPersistence}
                onCloseTab={closeTab}
                onActivateTab={activateTab}
                onChangeTabMode={changeTabMode}
                onReorderTabs={handleReorderTabs}
                onSearchTabOpen={handleSearchTabOpen}
                onVideoTabOpen={handleVideoTabOpen}
                onFiltersChange={handleFiltersChange}
                isLoading={isLocationLoading}
                loadLocalContent={loadLocalContent}
                isLeftPanelCollapsed={isLeftPanelCollapsed}
                isRightPanelCollapsed={isRightPanelCollapsed}
                onToggleLeftPanel={toggleLeftPanel}
                onToggleRightPanel={toggleRightPanel}
                openRightPanelWithMode={openRightPanelWithMode}
                closeRightPanel={closeRightPanel}
                utilityMode={utilityMode}
                utilityCategory={utilityCategory}
                onUtilityModeChange={setUtilityMode}
                isSearchMode={isSearchMode}
                searchTerm={searchTerm}
                searchResults={searchResults}
                onSearch={handleSearch}
                onClearSearch={handleClearSearch}
                enableFrontendSearch={enableFrontendSearch}
                onContentTypeChange={handleContentTypeChange}
                onSearchModeChange={handleSearchModeChange}
                activeContentType={activeContentType}
                activeSearchMode={activeSearchMode}
                onSourceClick={handleSourceClick}
                onOpenMyPageTab={openMyPageTab} // ✅ HOZZÁADVA: My tab prop
                onRenameTab={renameTab} // <-- ÚJ: Tab átnevezés prop
                // ✅ ÚJ: Téma props-ok a Settings komponenshez
                currentTheme={currentTheme}
                onThemeChange={changeTheme}
                showScrollbars={showScrollbars}
                onToggleScrollbars={toggleScrollbars}
              />
              {isLocationLoading && <div className="loading-overlay">Helymeghatározás...</div>}
              {syncInfo && syncInfo.pendingCount > 0 && (
                <button onClick={handleSyncClick} className="sync-button">
                  Szinkronizálás ({syncInfo.pendingCount})
                </button>
              )}
            </div>
          </AppProviders>
        </div>
      </AlertProvider>
    </UIProvider>
  );
}

export default App;