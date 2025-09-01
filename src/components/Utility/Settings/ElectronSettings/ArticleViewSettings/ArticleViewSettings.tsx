import React, { useState, useEffect } from 'react';
import styles from './ArticleViewSettings.module.css';

// ✅ Cikk megjelenítési módok típusa
type ArticleViewMode = 'window' | 'embedded' | 'tab';

// ✅ Beállítások opciók
const VIEW_MODE_OPTIONS = [
  {
    value: 'embedded' as ArticleViewMode,
    label: 'Embedded View',
    description: 'The article appears in place of the news cards',
    icon: '��',
    recommended: true
  },
  {
    value: 'tab' as ArticleViewMode,
    label: 'New Tab',
    description: 'The article opens in a new tab within the application',
    icon: '��',
    recommended: false
  },
  {
    value: 'window' as ArticleViewMode,
    label: 'Separate Window',
    description: 'The article opens in a new Electron window',
    icon: '��',
    recommended: false
  }
];

interface ArticleViewSettingsProps {
  className?: string;
}

export function ArticleViewSettings({ className }: ArticleViewSettingsProps) {
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
      console.error('Hiba a beállítások betöltésekor:', error);
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
      console.error('Hiba a beállítások mentésekor:', error);
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
    console.log('Beállítások sikeresen mentve!');
  };

  const showErrorMessage = () => {
    // Itt lehet toast notification vagy egyéb UI feedback
    console.log('Hiba a beállítások mentésekor!');
  };

  if (isLoading) {
    return (
      <div className={`${styles.container} ${className}`}>
        <div className={styles.loading}>
          <div className={styles.spinner}></div>
          <span>Loading settings...</span>
        </div>
      </div>
    );
  }

  return (
    <div className={`${styles.container} ${className}`}>
      <div className={styles.header}>
        <h3 className={styles.title}>Article Display Mode</h3>
        <p className={styles.description}>
          Choose how you want to display articles when clicking on news cards.
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
              <span className={styles.icon}>{option.icon}</span>
              {option.recommended && (
                <span className={styles.recommendedBadge}>Recommended</span>
              )}
            </div>
            
            <div className={styles.optionContent}>
              <h4 className={styles.optionTitle}>{option.label}</h4>
              <p className={styles.optionDescription}>{option.description}</p>
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
          <span>Saving...</span>
        </div>
      )}
    </div>
  );
}