import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import styles from './ArticleViewSettings.module.css';

// ✅ Cikk megjelenítési módok típusa
type ArticleViewMode = 'window' | 'embedded' | 'tab';

// ✅ Beállítások opciók
const VIEW_MODE_OPTIONS = [
  {
    value: 'embedded' as ArticleViewMode,
    key: 'embedded',
    icon: '��',
    recommended: true
  },
  {
    value: 'tab' as ArticleViewMode,
    key: 'tab',
    icon: '��',
    recommended: false
  },
  {
    value: 'window' as ArticleViewMode,
    key: 'window',
    icon: '��',
    recommended: false
  }
];

interface ArticleViewSettingsProps {
  className?: string;
}

export function ArticleViewSettings({ className }: ArticleViewSettingsProps) {
  const { t } = useTranslation();
  const [currentMode, setCurrentMode] = useState<ArticleViewMode>('embedded');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // ✅ Beállítások betöltése az alkalmazás indításakor
  useEffect(() => {
    loadSettings();
  }, []);

  // ✅ Beállítások betöltése Electron-ból
  const loadSettings = async () => {
    try {
      setIsLoading(true);
      
      // Ellenőrizzük, hogy elérhető-e az Electron API
      if (window.electronAPI && window.electronAPI.getArticleViewMode) {
        const mode = await window.electronAPI.getArticleViewMode();
        setCurrentMode(mode);
      } else {
        // Fallback: localStorage használata fejlesztés közben
        const savedMode = localStorage.getItem('articleViewMode') as ArticleViewMode;
        if (savedMode && ['window', 'embedded', 'tab'].includes(savedMode)) {
          setCurrentMode(savedMode);
        }
      }
    } catch (error) {
      console.error(t('articleViewSettings.messages.loadError'), error);
    } finally {
      setIsLoading(false);
    }
  };

  // ✅ Beállítások mentése
  const saveSettings = async (newMode: ArticleViewMode) => {
    try {
      setIsSaving(true);
      
      // Electron API használata
      if (window.electronAPI && window.electronAPI.setArticleViewMode) {
        await window.electronAPI.setArticleViewMode(newMode);
      } else {
        // Fallback: localStorage használata fejlesztés közben
        localStorage.setItem('articleViewMode', newMode);
      }
      
      setCurrentMode(newMode);
      
      // Sikeres mentés visszajelzés
      showSuccessMessage();
      
    } catch (error) {
      console.error(t('articleViewSettings.messages.saveError'), error);
      showErrorMessage();
    } finally {
      setIsSaving(false);
    }
  };

  // ✅ Mód változtatás kezelése
  const handleModeChange = (mode: ArticleViewMode) => {
    if (mode !== currentMode && !isSaving) {
      saveSettings(mode);
    }
  };

  // ✅ Visszajelzés üzenetek (egyszerű implementáció)
  const showSuccessMessage = () => {
    // Itt lehet toast notification vagy egyéb UI feedback
    console.log(t('articleViewSettings.messages.saveSuccess'));
  };

  const showErrorMessage = () => {
    // Itt lehet toast notification vagy egyéb UI feedback
    console.log(t('articleViewSettings.messages.saveError'));
  };

  if (isLoading) {
    return (
      <div className={`${styles.container} ${className}`}>
        <div className={styles.loading}>
          <div className={styles.spinner}></div>
          <span>{t('articleViewSettings.loading')}</span>
        </div>
      </div>
    );
  }

  return (
    <div className={`${styles.container} ${className}`}>
      <div className={styles.header}>
        <h3 className={styles.title}>{t('articleViewSettings.title')}</h3>
        <p className={styles.description}>
          {t('articleViewSettings.description')}
        </p>
      </div>

      <div className={styles.options}>
        {VIEW_MODE_OPTIONS.map((option) => (
          <div
            key={option.value}
            className={`${styles.option} ${
              currentMode === option.value ? styles.active : ''
            } ${isSaving && currentMode === option.value ? styles.saving : ''}`}
            onClick={() => handleModeChange(option.value)}
          >
            <div className={styles.optionIcon}>
              <span className={styles.icon}>{t(`articleViewSettings.viewModes.${option.key}.icon`)}</span>
              {option.recommended && (
                <span className={styles.recommendedBadge}>{t('articleViewSettings.recommended')}</span>
              )}
            </div>
            
            <div className={styles.optionContent}>
              <h4 className={styles.optionTitle}>{t(`articleViewSettings.viewModes.${option.key}.label`)}</h4>
              <p className={styles.optionDescription}>{t(`articleViewSettings.viewModes.${option.key}.description`)}</p>
            </div>
            
            <div className={styles.optionIndicator}>
              {currentMode === option.value && (
                <div className={styles.checkmark}>✓</div>
              )}
            </div>
          </div>
        ))}
      </div>

      {isSaving && (
        <div className={styles.savingIndicator}>
          <div className={styles.spinner}></div>
          <span>{t('articleViewSettings.saving')}</span>
        </div>
      )}
    </div>
  );
}