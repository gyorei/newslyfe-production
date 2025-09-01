// src\components\NavigationBar\NavigationBar.tsx
import * as React from 'react';
import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import styles from './NavigationBar.module.css';
import { NavigationControls } from './NavigationControls/NavigationControls';
import { SmartSearchBar } from './SmartSearchBar';
import { QuickActions } from './QuickActions';
import { useAlert } from '../../hooks/app';
import { NewsItem } from '../../types';

// Panel gomb komponens
interface PanelButtonProps {
  position: 'left' | 'right';
  isCollapsed: boolean;
  onClick: () => void;
  tooltip: string;
}

/**
 * Panel gomb komponens
 *
 * Vivaldi-stílusú panel kapcsoló gomb, amely vizuálisan jelzi az állapotát:
 * - Forgatott ikon az aktív/inaktív állapot jelzésére
 * - Hover effekt a felhasználói interakció jelzésére
 * - Tooltip a funkció leírására
 */
const PanelButton: React.FC<PanelButtonProps> = ({ position, isCollapsed, onClick, tooltip }) => (
  <button
    className={`${styles.panelButton} ${styles[position]} ${!isCollapsed ? styles.active : ''}`}
    onClick={onClick}
    title={tooltip}
    aria-label={tooltip}
    aria-pressed={!isCollapsed}
  >
    <span className={styles.panelIcon} aria-hidden="true">
      ◧
    </span>
  </button>
);

interface NavigationBarProps {
  activeTabId: string;
  onSearch: (tabId: string, query: string, results: NewsItem[]) => void;
  onClearSearch: (tabId: string) => void;
  
  // Navigációs vezérlők props
  canGoBack?: boolean;
  canGoForward?: boolean;
  isLoading?: boolean;
  onBack?: () => void;
  onForward?: () => void;
  onRefresh?: () => Promise<number>;

  // Keresési props
  searchPlaceholder?: string;
  newsItems?: NewsItem[];

  // Gyors műveletek props
  onSettings?: () => void;
  onInfo?: () => void;
  unreadCount?: number;

  // Panel vezérlők props
  isLeftPanelCollapsed?: boolean;
  isRightPanelCollapsed?: boolean;
  onToggleLeftPanel?: () => void;
  onToggleRightPanel?: () => void;

  // Megjelenítési props
  className?: string;
}

/**
 * Vivaldi-stílusú NavigationBar komponens
 *
 * Egyesíti a navigációs vezérlőket, az intelligens keresősávot és a gyors műveleteket
 * egy kompakt, 40px magas Vivaldi-inspirált sávban.
 *
 * Kiterjesztett elrendezés panel gombokkal:
 * [◧] [◄] [►] [🔄] | [🔍 Intelligens keresőmező] | [⚙️] [ℹ️] [◧]
 */
export const NavigationBar: React.FC<NavigationBarProps> = ({
  activeTabId,
  onSearch,
  onClearSearch,
  // Navigációs vezérlők
  canGoBack = true,
  canGoForward = true,
  isLoading = false,
  onBack = () => {},
  onForward = () => {},
  onRefresh = async () => 0,

  // Panel vezérlők
  isLeftPanelCollapsed = true,
  isRightPanelCollapsed = true,
  onToggleLeftPanel = () => {},
  onToggleRightPanel = () => {},

  // Keresés
  searchPlaceholder,
  newsItems = [],

  // Gyors műveletek
  onSettings = () => {},
  onInfo = () => {},
  unreadCount = 0,

  // Megjelenítés
  className = '',
}) => {
  const { t } = useTranslation();
  const alert = useAlert();

  // Keresési eseménykezelők SmartSearchBar-hoz
  const handleSearch = useCallback(
    (query: string, results: NewsItem[]) => {
      onSearch(activeTabId, query, results);
    },
    [onSearch, activeTabId],
  );

  const handleClearSearch = useCallback(() => {
    onClearSearch(activeTabId);
  }, [onClearSearch, activeTabId]);

  // Navigációs eseménykezelők
  const handleBack = useCallback(() => {
    if (window.electronAPI && window.electronAPI.closeArticleView) {
      window.electronAPI.closeArticleView();
    } else {
      window.history.back();
    }
  }, []);

  const handleForward = useCallback(() => {
    if (window.electronAPI && window.electronAPI.openLastClosedArticleView) {
      window.electronAPI.openLastClosedArticleView();
    } else {
      window.history.forward();
    }
  }, []);

  const handleRefresh = async () => {
    try {
      alert.info(t('navigation.refreshing'));
      
      const refreshedCount = await onRefresh();

      if (refreshedCount && refreshedCount > 0) {
        alert.success(t('navigation.updated', { count: refreshedCount }));
      } else {
        alert.warning(t('navigation.noNew'));
      }
    } catch (error) {
      console.error('[NavigationBar] Refresh error:', error);
      alert.error(t('navigation.refreshFailed'));
    }
  };

  const handleSettings = useCallback(() => {
    onSettings();
  }, [onSettings]);

  const handleInfo = useCallback(() => {
    onInfo();
  }, [onInfo]);

  return (
    <nav
      className={`${styles.navigationBar} ${className}`}
      role="navigation"
      aria-label={t('navigation.aria')}
    >
      {/* Bal oldali panel gomb */}
      <PanelButton
        position="left"
        isCollapsed={isLeftPanelCollapsed}
        onClick={onToggleLeftPanel}
        tooltip={isLeftPanelCollapsed ? t('navigation.openLeftPanel') : t('navigation.closeLeftPanel')}
      />

      {/* Navigációs vezérlők */}
      <NavigationControls
        canGoBack={canGoBack}
        canGoForward={canGoForward}
        isLoading={isLoading}
        onBack={handleBack}
        onForward={handleForward}
        onRefresh={handleRefresh}
      />

      {/* Szeparátor */}
      <div className={styles.separator} aria-hidden="true" />

      {/* Intelligens keresősáv */}
      <SmartSearchBar
        activeTabId={activeTabId}
        placeholder={searchPlaceholder || t('search.placeholder')}
        onSearch={handleSearch}
        onClear={handleClearSearch}
        newsItems={newsItems}
      />

      {/* Szeparátor */}
      <div className={styles.separator} aria-hidden="true" />

      {/* Gyors műveletek */}
      <QuickActions onSettings={handleSettings} onInfo={handleInfo} unreadCount={unreadCount} />

      {/* Jobb oldali panel gomb */}
      <PanelButton
        position="right"
        isCollapsed={isRightPanelCollapsed}
        onClick={onToggleRightPanel}
        tooltip={isRightPanelCollapsed ? t('navigation.openRightPanel') : t('navigation.closeRightPanel')}
      />
    </nav>
  );
};