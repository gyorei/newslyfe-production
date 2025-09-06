import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import styles from './WindowSettings.module.css';

type WindowStyle = 'classic' | 'modern' | 'dark' | 'compact';

const WINDOW_STYLE_OPTIONS = [
  {
    value: 'classic' as WindowStyle,
    key: 'classic'
  },
  {
    value: 'modern' as WindowStyle,
    key: 'modern'
  },
  {
    value: 'dark' as WindowStyle,
    key: 'dark'
  },
  {
    value: 'compact' as WindowStyle,
    key: 'compact'
  }
];

export function WindowSettings() {
  const { t } = useTranslation();
  const [currentStyle, setCurrentStyle] = useState<WindowStyle>('modern');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadWindowStyle();
  }, []);

  const loadWindowStyle = async () => {
    try {
      if (window.electronAPI?.getArticleWindowStyle) {
        const style = await window.electronAPI.getArticleWindowStyle();
        setCurrentStyle(style);
      }
    } catch (error) {
      console.error(t('windowSettings.errors.loadError'), error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleStyleChange = async (style: WindowStyle) => {
    try {
      if (window.electronAPI?.setArticleWindowStyle) {
        await window.electronAPI.setArticleWindowStyle(style);
        setCurrentStyle(style);
      }
    } catch (error) {
      console.error(t('windowSettings.errors.saveError'), error);
    }
  };

  if (isLoading) {
    return <div className={styles.loading}>{t('windowSettings.loading')}</div>;
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h3>{t('windowSettings.title')}</h3>
        <p>{t('windowSettings.description')}</p>
      </div>

      <div className={styles.options}>
        {WINDOW_STYLE_OPTIONS.map((option) => (
          <div
            key={option.value}
            className={`${styles.option} ${
              currentStyle === option.value ? styles.active : ''
            }`}
            onClick={() => handleStyleChange(option.value)}
          >
            <div className={styles.optionIcon}>{t(`windowSettings.styles.${option.key}.icon`)}</div>
            <div className={styles.optionContent}>
              <h4>{t(`windowSettings.styles.${option.key}.label`)}</h4>
              <p>{t(`windowSettings.styles.${option.key}.description`)}</p>
            </div>
            {currentStyle === option.value && (
              <div className={styles.checkmark}>✓</div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}