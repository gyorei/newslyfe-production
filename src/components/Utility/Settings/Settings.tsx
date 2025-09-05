// src\components\Utility\Settings\Settings.tsx
import * as React from 'react';
import styles from './Settings.module.css';
import { GeneralSettings } from './GeneralSettings';
import { AppearanceSettings } from './AppearanceSettings/AppearanceSettings';
import { ContentSettings } from './ContentSettings/ContentSettings';
import { StartupSettings } from './StartupSettings/StartupSettings';
import { LocationSettings } from './LocationSettings';
import { LanguageSettings } from './LanguageSettings';
import { ElectronSettings } from './ElectronSettings/ElectronSettings';
import { SearchFilters } from './SearchFilters/SearchFilters'; // ÚJ IMPORT
import { useLocalStorage } from '../../../hooks/useLocalStorage';
import { useRef } from 'react';

// ÚJ: Settings komponens props interface
interface SettingsProps {
  activeTabId?: string; // <-- ÚJ PROP az activeTabId fogadására
  // ✅ ÚJ: Téma props-ok
  currentTheme?: 'light' | 'dark' | 'pro-blue';
  onThemeChange?: (theme: 'light' | 'dark' | 'pro-blue') => void;
  showScrollbars?: boolean;
  onToggleScrollbars?: () => void;
  // ÚJ: Jobb panel mód/kategória a SearchFilters megjelenítés vezérléséhez
  rightPanelMode?: string;
  rightPanelCategory?: string;
}

// Fő Settings komponens
export const Settings: React.FC<SettingsProps> = ({ 
  activeTabId,
  currentTheme = 'light',
  onThemeChange = () => {},
  showScrollbars = true,
  onToggleScrollbars = () => {},
  // fogadjuk az új propokat
  rightPanelMode,
  rightPanelCategory,
}) => { // <-- PROP FOGADÁSA
  const [activeCategory, setActiveCategory] = useLocalStorage<
    'startup' | 'general' | 'appearance' | 'content' | 'location' | 'language' | 'electron' | 'search' // 'search' hozzáadva
  >('settings_activeCategory', 'general');

  const categoryRef = useRef<HTMLDivElement>(null);

  // ÚJ: Intelligens kategória kezelés
  React.useEffect(() => {
    // Ha explicit kategóriát kapunk, váltunk rá
    if (rightPanelMode === 'settings' && rightPanelCategory && rightPanelCategory !== 'search') {
      const validCategories = ['startup', 'general', 'appearance', 'content', 'location', 'language', 'electron', 'search'] as const;
      if (validCategories.includes(rightPanelCategory as any)) {
        setActiveCategory(rightPanelCategory as any);
      }
    }
    
    // GYORS FIX: Ha Settings panel nyílik és localStorage-ban 'location' van, váltunk rá
    if (rightPanelMode === 'settings' && !rightPanelCategory) {
      const storedCategory = localStorage.getItem('settings_activeCategory');
      if (storedCategory === 'location') {
        setActiveCategory('location');
      }
    }
  }, [rightPanelMode, rightPanelCategory, setActiveCategory]);

  // Debug log a prop-ok ellenőrzéséhez
  React.useEffect(() => {
    console.log('[Settings] Props:', {
      rightPanelMode,
      rightPanelCategory,
      activeTabId,
      activeCategory,
      shouldShowSearchFilters: rightPanelMode === 'settings' && rightPanelCategory === 'search'
    });
  }, [rightPanelMode, rightPanelCategory, activeTabId, activeCategory]);

  // Görgetés átirányítása vízszintesre
  React.useEffect(() => {
    const el = categoryRef.current;
    if (!el) return;
    const onWheel = (e: WheelEvent) => {
      if (e.deltaY !== 0) {
        el.scrollLeft += e.deltaY;
        e.preventDefault();
      }
    };
    el.addEventListener('wheel', onWheel, { passive: false });
    return () => el.removeEventListener('wheel', onWheel);
  }, []);

  return (
    <div className={styles.settingsContainer}>
      <div className={styles.categorySelector} ref={categoryRef}>
        <button
          className={`${styles.categoryButton} ${activeCategory === 'startup' ? styles.active : ''}`}
          onClick={() => setActiveCategory('startup')}
        >
          On startup
        </button>
        <button
          className={`${styles.categoryButton} ${activeCategory === 'general' ? styles.active : ''}`}
          onClick={() => setActiveCategory('general')}
        >
          General
        </button>
        <button
          className={`${styles.categoryButton} ${activeCategory === 'appearance' ? styles.active : ''}`}
          onClick={() => setActiveCategory('appearance')}
        >
          Appearance
        </button>
        <button
          className={`${styles.categoryButton} ${activeCategory === 'content' ? styles.active : ''}`}
          onClick={() => setActiveCategory('content')}
        >
          Content
        </button>
        <button
          className={`${styles.categoryButton} ${activeCategory === 'location' ? styles.active : ''}`}
          onClick={() => setActiveCategory('location')}
        >
          Location
        </button>
        <button
          className={`${styles.categoryButton} ${activeCategory === 'language' ? styles.active : ''}`}
          onClick={() => setActiveCategory('language')}
        >
          Language
        </button>
        <button
          className={`${styles.categoryButton} ${activeCategory === 'electron' ? styles.active : ''}`}
          onClick={() => setActiveCategory('electron')}
        >
          Desktop App
        </button>
        {/* ÚJ: Search kategória gomb */}
        <button
          className={`${styles.categoryButton} ${activeCategory === 'search' ? styles.active : ''}`}
          onClick={() => setActiveCategory('search')}
        >
          Search
        </button>
      </div>

      <div className={styles.settingsContent}>
        {/* Ha a jobb panel explicit módon kéri a SearchFilters-t, mutassuk azt a normál settings helyett */}
        {rightPanelMode === 'settings' && rightPanelCategory === 'search' ? (
          <div className={styles.searchFiltersSection}>
            <SearchFilters activeTabId={activeTabId || ''} />
          </div>
        ) : (
          <>
            {activeCategory === 'startup' && <StartupSettings />}
            {activeCategory === 'general' && <GeneralSettings />}
            {activeCategory === 'appearance' && (
              <AppearanceSettings
                currentTheme={currentTheme}
                onThemeChange={onThemeChange}
                showScrollbars={showScrollbars}
                onToggleScrollbars={onToggleScrollbars}
              />
            )}
            {activeCategory === 'content' && <ContentSettings />}
            {activeCategory === 'location' && <LocationSettings />}
            {activeCategory === 'language' && <LanguageSettings />}
            {activeCategory === 'electron' && <ElectronSettings />}
            {/* ÚJ: SearchFilters renderelése activeTabId prop-pal */}
            {activeCategory === 'search' && <SearchFilters activeTabId={activeTabId || ''} />}
          </>
        )}
      </div>
    </div>
  );
};
