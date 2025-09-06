import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import styles from './Settings.module.css';

export const GeneralSettings: React.FC = () => {
  const { t } = useTranslation();
  // Location Modal állapota
  const [locationModalEnabled, setLocationModalEnabled] = useState(() => {
    return localStorage.getItem('newsx_location_modal_disabled') !== 'true';
  });

  // Helymeghatározási modál beállításának kezelése
  const handleLocationModalChange = (enabled: boolean) => {
    if (enabled) {
      // Modál újra engedélyezése
      localStorage.removeItem('newsx_location_modal_disabled');
    } else {
      // Modál letiltása
      localStorage.setItem('newsx_location_modal_disabled', 'true');
    }
    setLocationModalEnabled(enabled);
  };

  // Követjük a localStorage változásait más taboktól/ablakoktól
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'newsx_location_modal_disabled') {
        setLocationModalEnabled(e.newValue !== 'true');
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  return (
    <div>
      <h3>{t('generalSettings.title')}</h3>
      <div className={styles.settingGroup}>
        <label>{t('generalSettings.startupScreen')}</label>
        <select className={styles.select}>
          <option value="home">{t('generalSettings.home')}</option>
          <option value="favorites">{t('generalSettings.favorites')}</option>
          <option value="latest">{t('generalSettings.latestNews')}</option>
        </select>
      </div>
      <div className={styles.settingGroup}>
        <label className={styles.switchLabel}>
          {t('generalSettings.notifications')}:
          <label className={styles.switch}>
            <input type="checkbox" defaultChecked />
            <span className={styles.slider}></span>
          </label>
        </label>
      </div>

      <div className={styles.settingGroup}>
        <h4>{t('generalSettings.notificationsPrompts')}</h4>

        <label className={styles.switchLabel}>
          {t('generalSettings.locationPrompt')}:
          <label className={styles.switch}>
            <input
              type="checkbox"
              checked={locationModalEnabled}
              onChange={(e) => handleLocationModalChange(e.target.checked)}
            />
            <span className={styles.slider}></span>
          </label>
        </label>
        <p className={styles.settingDescription}>
          {t('generalSettings.locationPromptDesc')}
        </p>
      </div>
    </div>
  );
};
