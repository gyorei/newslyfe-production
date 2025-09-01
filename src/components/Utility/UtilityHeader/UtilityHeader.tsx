import * as React from 'react';
import styles from './UtilityHeader.module.css';

// Kibővített típus az új módokkal
interface UtilityHeaderProps {
  title: string;
  currentMode: 'tools' | 'auth' | 'settings' | 'favorites' | 'history' | 'savedNews' | 'legal' | 'premium'; // Bővítve a 'legal' és 'premium' értékkel
  onModeChange: (
    mode: 'tools' | 'auth' | 'settings' | 'favorites' | 'history' | 'savedNews' | 'legal' | 'premium',
  ) => void; // Bővítve a 'legal' és 'premium' értékkel
  onRefresh?: () => void;
  onClose?: () => void;
}

export const UtilityHeader: React.FC<UtilityHeaderProps> = ({
 // title,
  currentMode,
  onModeChange,
  onRefresh,
  onClose,
}) => {
  return (
    <div className={styles.utilityHeader}>
   {/*   <h3>{title}</h3> */}

      {/* Segédeszköz navigációs gombok - bővítve mentett hírek és prémium gombbal */}
      <div className={styles.utilityNavigation}>
        <button
          className={`${styles.utilityNavButton} ${currentMode === 'tools' ? styles.active : ''}`}
          onClick={() => onModeChange('tools')}
        title="Tools"
        >
          🧰
        </button>
        <button
          className={`${styles.utilityNavButton} ${currentMode === 'favorites' ? styles.active : ''}`}
          onClick={() => onModeChange('favorites')}
          title="Favorites"
        >
          ⭐
        </button>
        <button
          className={`${styles.utilityNavButton} ${currentMode === 'history' ? styles.active : ''}`}
          onClick={() => onModeChange('history')}
          title="History"
        >
          🕒
        </button>
        {/* Új gomb a Mentett Hírek funkcióhoz */}
        <button
          className={`${styles.utilityNavButton} ${currentMode === 'savedNews' ? styles.active : ''}`}
          onClick={() => onModeChange('savedNews')}
          title="Saved News"
        >
          📰
        </button>
        <button
          className={`${styles.utilityNavButton} ${currentMode === 'auth' ? styles.active : ''}`}
          onClick={() => onModeChange('auth')}
          title="My Account"
        >
          👤
        </button>
        <button
          className={`${styles.utilityNavButton} ${currentMode === 'settings' ? styles.active : ''}`}
          onClick={() => onModeChange('settings')}
         title="Settings"
        >
          ⚙️
        </button>
        {/* 🎥 LEGAL GOMB - GOOGLE SZABÁLYOK! */}
        <button
          className={`${styles.utilityNavButton} ${currentMode === 'legal' ? styles.active : ''}`}
          onClick={() => onModeChange('legal')}
          title="Privacy Policy"
        >
          📋
        </button>
        {/* ÚJ GOMB A PREMIUM PANELHEZ */}
        <button
          className={`${styles.utilityNavButton} ${currentMode === 'premium' ? styles.active : ''}`}
          onClick={() => onModeChange('premium')}
          title="Premium"
        >
          💎
        </button>
      </div>

      <div className={styles.utilityControls}>
        {onRefresh && (
        <button className={styles.utilityButton} onClick={onRefresh} title="Refresh">
            🔄
          </button>
        )}
        {onClose && (
        <button className={styles.utilityButton} onClick={onClose} title="Close panel">
            ✖
          </button>
        )}
      </div>
    </div>
  );
};
