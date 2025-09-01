import React from 'react';
import styles from './ElectronSettings.module.css';
import { ArticleViewSettings } from './ArticleViewSettings/ArticleViewSettings';
import { WindowSettings } from './WindowSettings';

export function ElectronSettings() {
  return (
    <div className={styles.container}>
      {/* ✅ Electron-specifikus figyelmeztetés */}
      <div className={styles.electronNotice}>
        <div className={styles.noticeIcon}>⚡</div>
        <div className={styles.noticeContent}>
          <h4>Desktop Application Settings</h4>
          <p>These settings are only available in the desktop application and may not work in web browsers.</p>
        </div>
      </div>

      {/* ✅ Electron beállítások */}
      <div className={styles.settingsSection}>
        <ArticleViewSettings />
      </div>
      
      <div className={styles.settingsSection}>
        <WindowSettings />
      </div>
    </div>
  );
}