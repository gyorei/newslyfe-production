import React, { useState } from 'react';
import styles from './StartupSettings.module.css'; // ✅ Saját CSS modul használata
import { useLocalStorage } from '../../../../hooks/useLocalStorage';

export const StartupSettings: React.FC = () => {
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
      <h3>On Startup</h3>

      <div className={styles.settingGroup}>
        <div className={styles.radioGroup}>
          <label>
            <input type="radio" checked={mode === 'newTab'} onChange={() => setMode('newTab')} />
            <span>Open a new tab</span>
          </label>

          <label>
            <input
              type="radio"
              checked={mode === 'continue'}
              onChange={() => setMode('continue')}
            />
            <span>Continue where you left off</span>
          </label>

          <label>
            <input
              type="radio"
              checked={mode === 'specific'}
              onChange={() => setMode('specific')}
            />
            <span>Open specific pages</span>
          </label>
        </div>
      </div>

      {mode === 'specific' && (
        <div className={styles.settingGroup}>
          <div className={styles.pagesSection}>
            <label className={styles.pagesLabel}>Pages (URL):</label>

            {pages.length === 0 ? (
              <div className={styles.emptyState}>No pages added yet. Add some URLs below.</div>
            ) : (
              <ul className={styles.pagesList}>
                {pages.map((url, i) => (
                  <li key={i} className={styles.pageItem}>
                    <span className={styles.pageUrl}>{url}</span>
                    <button
                      type="button"
                      onClick={() => removePage(i)}
                      className={styles.removeButton}
                      title="Remove this page"
                    >
                      Remove
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
                Add Page
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
