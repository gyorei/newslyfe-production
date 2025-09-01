import React, { useState, useEffect } from 'react';
import styles from './Settings.module.css';

export const GeneralSettings: React.FC = () => {
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
      <h3>General Settings</h3>
      <div className={styles.settingGroup}>
        <label>Startup Screen:</label>
        <select className={styles.select}>
          <option value="home">Home</option>
          <option value="favorites">Favorites</option>
          <option value="latest">Latest News</option>
        </select>
      </div>
      <div className={styles.settingGroup}>
        <label className={styles.switchLabel}>
          Notifications:
          <label className={styles.switch}>
            <input type="checkbox" defaultChecked />
            <span className={styles.slider}></span>
          </label>
        </label>
      </div>

      <div className={styles.settingGroup}>
        <h4>Notifications & Prompts</h4>

        <label className={styles.switchLabel}>
          Show location prompt for local news:
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
          Enable or disable the location prompt when clicking on Local news
        </p>
      </div>
    </div>
  );
};
