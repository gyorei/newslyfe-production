// src\components\Utility\UtilityPanel\UtilityPanel.tsx
import * as React from 'react';
import { UtilityHeader } from '../UtilityHeader/UtilityHeader';
import { Auth } from '../../Auth/Auth';
// import { Settings } from '../../Settings/Settings';
import { FavoritesList } from '../Favorites/FavoritesList';
import { HistoryList } from '../History/HistoryList';
import SavedNews from '../SavedNews/SavedNews';
import { Settings } from '../Settings';
import { Legal } from '../Legal';
// ADSENSE TEMPORARILY DISABLED
// import { UtilityAdCard } from '../../Ad';
import PremiumPanel from '../Premium/PremiumPanel';
import styles from './UtilityPanel.module.css';

interface UtilityPanelProps {
  onClose?: () => void;
  mode?: 'tools' | 'auth' | 'settings' | 'favorites' | 'history' | 'savedNews' | 'legal' | 'premium';
  category?: string; // ÚJ: Kategória prop
  onUtilityModeChange?: (
    mode: 'tools' | 'auth' | 'settings' | 'favorites' | 'history' | 'savedNews' | 'legal' | 'premium',
  ) => void;
  activeTabId?: string; // <-- ÚJ PROP az activeTabId fogadására
  // ✅ ÚJ: Téma props-ok
  currentTheme?: 'light' | 'dark' | 'pro-blue';
  onThemeChange?: (theme: 'light' | 'dark' | 'pro-blue') => void;
  showScrollbars?: boolean;
  onToggleScrollbars?: () => void;
}

export const UtilityPanel: React.FC<UtilityPanelProps> = ({
  onClose,
  mode = 'tools',
  category, // ÚJ: Kategória prop fogadása
  onUtilityModeChange,
  activeTabId, // <-- PROP FOGADÁSA
  // ✅ ÚJ: Téma props-ok átvétele
  currentTheme = 'light',
  onThemeChange = () => {},
  showScrollbars = true,
  onToggleScrollbars = () => {},
}) => {
  const handleRefresh = React.useCallback(() => {
    console.log('Refreshing utilities...');
  }, []);

  const handleLoginSuccess = React.useCallback(() => {
    console.log('Login successful');
    // onUtilityModeChange?.('tools');
  }, []);

  const handleRegisterSuccess = React.useCallback(() => {
    console.log('Registration successful');
    // onUtilityModeChange?.('tools');
  }, []);

  const handleModeChange = React.useCallback(
    (newMode: 'tools' | 'auth' | 'settings' | 'favorites' | 'history' | 'savedNews' | 'legal' | 'premium') => {
      onUtilityModeChange?.(newMode);
    },
    [onUtilityModeChange],
  );

  return (
    <div className={styles.utilityContainer}>
      <UtilityHeader
        title={
          mode === 'auth'
            ? 'My Account'
            : mode === 'settings'
              ? 'Settings'
              : mode === 'favorites'
                ? 'Favorites'
                : mode === 'history'
                  ? 'History'
                  : mode === 'savedNews'
                    ? 'Saved News'
                    : mode === 'legal'
                      ? 'Privacy Policy'
                      : mode === 'premium'
                        ? 'PLM'
                      : 'Utilities'
        }
        currentMode={mode}
        onModeChange={handleModeChange}
        onRefresh={mode === 'tools' ? handleRefresh : undefined}
        onClose={onClose}
      />
      <div className={styles.utilityContent}>
        {mode === 'premium' ? (
          <PremiumPanel />
        ) : mode === 'auth' ? (
          <Auth onLoginSuccess={handleLoginSuccess} onRegisterSuccess={handleRegisterSuccess} />
        ) : mode === 'settings' ? (
          <Settings 
            activeTabId={activeTabId}
            currentTheme={currentTheme}
            onThemeChange={onThemeChange}
            showScrollbars={showScrollbars}
            onToggleScrollbars={onToggleScrollbars}
            rightPanelMode={mode}
            rightPanelCategory={category}
          />
        ) : mode === 'favorites' ? (
          <FavoritesList />
        ) : mode === 'history' ? (
          <HistoryList />
        ) : mode === 'savedNews' ? (
          <SavedNews />
        ) : mode === 'legal' ? (
          <Legal />
        ) : (
          <>
            {/* Kikommentált eszközlista - későbbi aktiváláshoz
            <ul className={commonStyles.utilityList}>
              <li className={commonStyles.utilityItem}>💬 AI Assistant</li>
              <li className={commonStyles.utilityItem}>📝 Notes</li>
              <li 
                className={`${commonStyles.utilityItem} ${commonStyles.clickable}`}
                onClick={() => handleModeChange('settings')}
              >
                ⚙️ Settings
              </li>
              <li 
                className={`${commonStyles.utilityItem} ${commonStyles.clickable}`}
                onClick={() => handleModeChange('favorites')}
              >
                ⭐ Favorites
              </li>
              <li 
                className={`${commonStyles.utilityItem} ${commonStyles.clickable}`}
                onClick={() => handleModeChange('history')}
              >
                🕒 History
              </li>
              <li 
                className={`${commonStyles.utilityItem} ${commonStyles.clickable}`}
                onClick={() => handleModeChange('savedNews')}
              >
                📰 Saved News
              </li>
              <li className={commonStyles.utilityItem}>🔍 Advanced Search</li>
              <li className={commonStyles.utilityItem}>🌐 Translator</li>
              <li className={commonStyles.utilityItem}>📊 Statistics</li>
            </ul>
            */}

            {/* Üres felület reklámokkal */}
            <div className={styles.emptyPanel}>
              <h3>Welcome to News Reader</h3>
              <p>Select a function from the navigation above</p>

              {/* ADSENSE TEMPORARILY DISABLED
              <div className={styles.advertisementContainer}>
                <h4>Featured content</h4>
                <div className={styles.adCardsContainer}>
                  <UtilityAdCard
                    title="Premium News Access"
                    description="Get unlimited access to premium news sources with our subscription plan."
                    imageUrl="/assets/images/premium-news.jpg"
                    linkUrl="https://example.com/premium"
                    sponsor="News Reader Pro"
                    onClick={() => console.log('Premium ad clicked')}
                  />

                  <UtilityAdCard
                    title="News Reader Mobile App"
                    description="Stay updated on the go with our mobile application."
                    imageUrl="/assets/images/mobile-app.jpg"
                    linkUrl="https://example.com/mobile-app"
                    sponsor="News Reader"
                  />
                </div>
              </div>
              */}
            </div>
          </>
        )}
      </div>
    </div>
  );
};
