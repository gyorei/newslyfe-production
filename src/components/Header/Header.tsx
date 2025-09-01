// src\components\Header\Header.tsx
import * as React from 'react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Logo } from './Logo';
import { Toggler } from './Toggler';
import styles from './Header.module.css';
// import DebugManager from '../debug/DebugManager/DebugManager';

// Monitor komponensek importálása jelenleg ki van kommentálva!
// import { RssMonitorButton, RssMonitorPanel } from '../../data/Monitor';

interface HeaderProps {
  onThemeToggle: () => void;
  currentTheme: string;
  onToggleLeftPanel?: () => void;
  onToggleRightPanel?: () => void;
  isLeftPanelCollapsed?: boolean;
  isRightPanelCollapsed?: boolean;
  onToggleScrollbars: () => void;
  showScrollbars: boolean;
  openRightPanelWithMode?: (mode: string, payload?: any) => void;
}

export const Header: React.FC<HeaderProps> = ({
  onThemeToggle,
  currentTheme,
  onToggleLeftPanel,
  onToggleRightPanel,
  isLeftPanelCollapsed,
  isRightPanelCollapsed,
  onToggleScrollbars,
  showScrollbars,
  openRightPanelWithMode,
}) => {
  const { t, i18n } = useTranslation();
  // Normalizált nyelvkód fejléchez (pl. en-US -> EN)
  const _rawLang = i18n.resolvedLanguage || i18n.language || 'en';
  const headerLangCode = (_rawLang.split('-')[0] || 'en').toUpperCase();
  // Platform detektálás Mac gombokhoz
  const isMac = (typeof process !== 'undefined' && process.platform === 'darwin') || 
                navigator.platform.toUpperCase().indexOf('MAC') >= 0;

  // Monitor panel állapota
  const [isMonitorOpen, setIsMonitorOpen] = useState(false);
  const [errorCount, setErrorCount] = useState(0);
  // const [isDebugOpen, setIsDebugOpen] = React.useState(false);  // ← KIKOMMENTEZVE

  // Monitor panel nyitása/zárása
  const toggleMonitor = () => {
    setIsMonitorOpen((prev) => !prev);
  };

  // Hibaszám frissítése
  const handleErrorCountChange = (count: number) => {
    setErrorCount(count);
  };

  return (
    <header className={`${styles.header} ${isMac ? styles.macHeader : ''}`}>
      {/* Bal oldal - Bal panel gomb (Mac gombok után) */}
      <div className={`${styles.headerLeft} ${isMac ? styles.macOffset : ''}`}>
        {onToggleLeftPanel && (
          <button
            className={styles.iconButton}
            onClick={onToggleLeftPanel}
            title={
              isLeftPanelCollapsed
                ? t('header.leftPanel.open', 'Open search/filter panel')
                : t('header.leftPanel.close', 'Close search/filter panel')
            }
          >
            {isLeftPanelCollapsed ? '🔍' : '◀'}
          </button>
        )}
      </div>

      {/* Közép - Logo */}
      <div className={styles.headerCenter}>
        <Logo />
      </div>

      {/* Jobb oldal - Vezérlőgombok */}
      <div className={styles.headerRight}>
        {/* Nyelvi gomb közvetlenül a jobb oldali panel kapcsoló bal oldalán */}
        <button
          className={styles.iconButton}
          onClick={() => openRightPanelWithMode?.('settings', 'language')}
          title={t('settings.languageTitle', 'Language Settings')}
        >
          {/* Dinamikus nyelvkód (pl. EN, HU) */}
          <span style={{ fontSize: '13px', letterSpacing: '1px' }}>{headerLangCode}</span>
        </button>
        {/* Jobb oldali panel kapcsoló */}
        {onToggleRightPanel && (
          <button
            className={styles.iconButton}
            onClick={onToggleRightPanel}
            title={
              isRightPanelCollapsed
                ? t('header.rightPanel.open', 'Open assistant panel')
                : t('header.rightPanel.close', 'Close assistant panel')
            }
          >
            {isRightPanelCollapsed ? '📝' : '▶'}
          </button>
        )}

        <Toggler onToggle={onThemeToggle} currentTheme={currentTheme} />

        {/* Görgetősáv kapcsoló */}
        <button
          className={`${styles.iconButton} ${showScrollbars ? styles.active : styles.inactive}`}
          onClick={onToggleScrollbars}
          title={
            showScrollbars
              ? t('header.scrollbars.hide', 'Hide scrollbars')
              : t('header.scrollbars.show', 'Show scrollbars')
          }
        >
          {showScrollbars ? '🔓' : '🔒'}
        </button>

        {/* Debug toggle button - KIKOMMENTEZVE */}
        {/*
        <button
          className={styles.debugButton}
          onClick={() => setIsDebugOpen(true)}
          title="Debug Panel"
        >
          🐞
        </button>
        */}
      </div>

      {/* Csak Electronban jelenjen meg a 3 új ablakvezérlő gomb */}
      {window.electronAPI && (
        <div className={styles.windowControls}>
          <button className={styles.controlBtn} onClick={() => window.electronAPI?.minimize?.()}>_</button>
          <button className={styles.controlBtn} onClick={() => window.electronAPI?.maximize?.()}>▢</button>
          <button className={styles.controlBtn} onClick={() => window.electronAPI?.close?.()}>×</button>
        </div>
      )}

      {/* RSS Monitor Panel */}
      {/*
      <RssMonitorPanel
        visible={isMonitorOpen}
        onClose={() => setIsMonitorOpen(false)}
        onErrorCountChange={handleErrorCountChange}
      />
       */}
      {/* Debug manager overlay - KIKOMMENTEZVE */}
      {/* <DebugManager isOpen={isDebugOpen} onClose={() => setIsDebugOpen(false)} /> */}
    </header>
  );
};
