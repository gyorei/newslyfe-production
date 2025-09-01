import React, { useState, useEffect } from 'react';
import styles from './WindowSettings.module.css';

type WindowStyle = 'classic' | 'modern' | 'dark' | 'compact';

const WINDOW_STYLE_OPTIONS = [
  {
    value: 'classic' as WindowStyle,
    label: 'Classic',
    description: 'Traditional window with frame and title bar',
    icon: '🪟'
  },
  {
    value: 'modern' as WindowStyle,
    label: 'Modern',
    description: 'Clean design with native close button',
    icon: '✨'
  },
  {
    value: 'dark' as WindowStyle,
    label: 'Dark Theme',
    description: 'Dark background with light frame',
    icon: '🌙'
  },
  {
    value: 'compact' as WindowStyle,
    label: 'Compact',
    description: 'Smaller window with simple design',
    icon: '📱'
  }
];

export function WindowSettings() {
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
      console.error('Error loading window style:', error);
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
      console.error('Error saving window style:', error);
    }
  };

  if (isLoading) {
    return <div className={styles.loading}>Loading...</div>;
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h3>Window Style</h3>
        <p>Choose the appearance of article windows</p>
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
            <div className={styles.optionIcon}>{option.icon}</div>
            <div className={styles.optionContent}>
              <h4>{option.label}</h4>
              <p>{option.description}</p>
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