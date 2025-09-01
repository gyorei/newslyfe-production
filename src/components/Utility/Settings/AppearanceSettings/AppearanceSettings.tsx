import * as React from 'react';
import styles from './AppearanceSettings.module.css';

interface AppearanceSettingsProps {
  currentTheme: 'light' | 'dark' | 'pro-blue';
  onThemeChange: (theme: 'light' | 'dark' | 'pro-blue') => void;
  showScrollbars: boolean;
  onToggleScrollbars: () => void;
}

export const AppearanceSettings: React.FC<AppearanceSettingsProps> = ({
  currentTheme,
  onThemeChange,
  showScrollbars,
  onToggleScrollbars,
}) => {
  const handleThemeChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const newTheme = event.target.value as 'light' | 'dark' | 'pro-blue';
    onThemeChange(newTheme);
  };

  return (
  <div>
    <h3>Appearance Settings</h3>
      
      {/* Téma választó */}
    <div className={styles.settingGroup}>
      <label>Theme:</label>
        <select 
          className={styles.select} 
          value={currentTheme}
          onChange={handleThemeChange}
        >
          <option value="light">☀️ Light</option>
          <option value="dark">🌙 Dark</option>
          <option value="pro-blue">🟦 Pro Blue</option>
      </select>
    </div>

      {/* Font méret */}
    <div className={styles.settingGroup}>
      <label>Font Size:</label>
      <select className={styles.select}>
        <option value="small">Small</option>
        <option value="medium">Medium</option>
        <option value="large">Large</option>
      </select>
    </div>

      {/* Görgetősáv kapcsoló */}
    <div className={styles.settingGroup}>
      <label className={styles.switchLabel}>
        Show Scrollbars:
        <label className={styles.switch}>
            <input 
              type="checkbox" 
              checked={showScrollbars}
              onChange={onToggleScrollbars}
            />
          <span className={styles.slider}></span>
        </label>
      </label>
    </div>

      {/* Téma leírások */}
      <div className={styles.themeDescriptions}>
        <div className={styles.themeDescription}>
          <strong>☀️ Light:</strong> Classic light theme
        </div>
        <div className={styles.themeDescription}>
          <strong>🌙 Dark:</strong> Original dark mode
        </div>
        <div className={styles.themeDescription}>
          <strong>🟦 Pro Blue:</strong> Modern blue theme
        </div>
    </div>
  </div>
);
};
