// src\components\NavigationBar\NavigationControls\NavigationControls.tsx
import * as React from 'react';
import styles from '../NavigationBar.module.css'; // ✅ JAVÍTÁS: egy szinttel feljebb
import { useTranslation } from 'react-i18next';

interface NavigationControlsProps {
  canGoBack: boolean;
  canGoForward: boolean;
  isLoading: boolean;
  onBack: () => void;
  onForward: () => void;
  onRefresh: () => void;
}

/**
 * Vivaldi-stílusú NavigationControls komponens
 *
 * Három kompakt navigációs gomb:
 * - Vissza (◄) - előző tab/oldal
 * - Előre (►) - következő tab/oldal
 * - Frissítés (🔄) - aktuális tab frissítése, animált loading állapottal
 */
export const NavigationControls: React.FC<NavigationControlsProps> = ({
  canGoBack,
  canGoForward,
  isLoading,
  onBack,
  onForward,
  onRefresh,
}) => {
  const { t } = useTranslation();
  return (
    <div className={styles.navigationControls} role="group" aria-label={t('navigation.controls')}>
      {/* Vissza gomb - Vivaldi stílusú */}
      <button
        className={styles.navButton}
        onClick={onBack}
        title={t('navigation.back')}
        aria-label={t('navigation.back')}
      >
        <svg viewBox="0 0 24 24" className={styles.navIcon} aria-hidden="true">
          <path d="M15.41 16.59L10.83 12l4.58-4.59L14 6l-6 6 6 6 1.41-1.41z" />
        </svg>
      </button>

      {/* Előre gomb */}
      <button
        className={styles.navButton}
        onClick={onForward}
        title={t('navigation.forward')}
        aria-label={t('navigation.forward')}
      >
        <svg viewBox="0 0 24 24" className={styles.navIcon} aria-hidden="true">
          <path d="M8.59 16.59L13.17 12L8.59 7.41L10 6l6 6-6 6-1.41-1.41z" />
        </svg>
      </button>

      {/* Frissítés gomb - animált loading állapottal */}
      <button
        className={`${styles.navButton} ${isLoading ? styles.loading : ''}`}
        onClick={onRefresh}
        disabled={isLoading}
        title={isLoading ? t('navigation.refreshing') : t('navigation.refresh')}
        aria-label={isLoading ? t('navigation.refreshing') : t('navigation.refresh')}
      >
        <svg viewBox="0 0 24 24" className={styles.navIcon} aria-hidden="true">
          <path d="M17.65 6.35C16.2 4.9 14.21 4 12 4c-4.42 0-7.99 3.58-7.99 8s3.57 8 7.99 8c3.73 0 6.84-2.55 7.73-6h-2.08c-.82 2.33-3.04 4-5.65 4-3.31 0-6-2.69-6-6s2.69-6 6-6c1.66 0 3.14.69 4.22 1.78L13 11h7V4l-2.35 2.35z" />
        </svg>
      </button>
    </div>
  );
};
