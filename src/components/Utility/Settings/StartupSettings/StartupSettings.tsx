import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import styles from './StartupSettings.module.css'; // ✅ Saját CSS modul használata
import { useLocalStorage } from '../../../../hooks/useLocalStorage';

export const StartupSettings: React.FC = () => {
  const { t } = useTranslation();
  type Mode = 'newTab' | 'continue' | 'specific';
  const [mode, setMode] = useLocalStorage<Mode>('startup_mode', 'newTab');
  const [pages, setPages] = useLocalStorage<string[]>('startup_pages', []);
  const [input, setInput] = useState('');

  const addPage = () => {
    if (input.trim()) {
      setPages([...pages, input.trim()]);
      setInput('');
    }
  };

  const removePage = (idx: number) => {
    const updated = pages.filter((_, i) => i !== idx);
    setPages(updated);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      addPage();
    }
  };

  return (
    <div className={styles.startupSettings}>
      <h3>{t('startupSettings.title')}</h3>

      <div className={styles.settingGroup}>
        <div className={styles.radioGroup}>
          <label>
            <input
              id="startup-new-tab"
              name="startupMode"
              type="radio"
              checked={mode === 'newTab'}
              onChange={() => setMode('newTab')}
            />
            <span>{t('startupSettings.openNewTab')}</span>
          </label>

          <label>
            <input
              id="startup-continue"
              name="startupMode"
              type="radio"
              checked={mode === 'continue'}
              onChange={() => setMode('continue')}
            />
            <span>{t('startupSettings.continueSession')}</span>
          </label>

          <label>
            <input
              type="radio"
              checked={mode === 'specific'}
              onChange={() => setMode('specific')}
            />
            <span>{t('startupSettings.openSpecificPages')}</span>
          </label>
        </div>
      </div>

      {mode === 'specific' && (
        <div className={styles.settingGroup}>
          <div className={styles.pagesSection}>
            <label className={styles.pagesLabel}>{t('startupSettings.pagesLabel')}</label>

            {pages.length === 0 ? (
              <div className={styles.emptyState}>{t('startupSettings.emptyState')}</div>
            ) : (
              <ul className={styles.pagesList}>
                {pages.map((url, i) => (
                  <li key={i} className={styles.pageItem}>
                    <span className={styles.pageUrl}>{url}</span>
                    <button
                      type="button"
                      onClick={() => removePage(i)}
                      className={styles.removeButton}
                      title={t('startupSettings.removePageTitle')}
                    >
                      {t('startupSettings.removeButton')}
                    </button>
                  </li>
                ))}
              </ul>
            )}

            <div className={styles.inputGroup}>
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="https://example.com"
                className={styles.urlInput}
              />
              <button
                type="button"
                onClick={addPage}
                disabled={!input.trim()}
                className={styles.addButton}
              >
                {t('startupSettings.addButton')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
