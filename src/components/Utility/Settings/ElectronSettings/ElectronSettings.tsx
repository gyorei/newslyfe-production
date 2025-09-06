import React from 'react';
import { useTranslation } from 'react-i18next';
import styles from './ElectronSettings.module.css';
import { ArticleViewSettings } from './ArticleViewSettings/ArticleViewSettings';
import { WindowSettings } from './WindowSettings';

export function ElectronSettings() {
  const { t } = useTranslation();
  
  return (
    <div className={styles.container}>
      {/* ✅ Electron-specifikus figyelmeztetés */}
      <div className={styles.electronNotice}>
        <div className={styles.noticeIcon}>{t('electronSettings.notice.icon')}</div>
        <div className={styles.noticeContent}>
          <h4>{t('electronSettings.notice.title')}</h4>
          <p>{t('electronSettings.notice.description')}</p>
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