import * as React from 'react';
import { useTranslation } from 'react-i18next';
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
  const { t } = useTranslation();
  const handleThemeChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const newTheme = event.target.value as 'light' | 'dark' | 'pro-blue';
    onThemeChange(newTheme);
  };

  return (
  <div>
    <h3>{t('appearanceSettings.title')}</h3>
      
      {/* Téma választó */}
    <div className={styles.settingGroup}>
      <label>{t('appearanceSettings.theme.label')}</label>
        <select 
          className={styles.select} 
          value={currentTheme}
          onChange={handleThemeChange}
        >
          <option value="light">{t('appearanceSettings.theme.light')}</option>
          <option value="dark">{t('appearanceSettings.theme.dark')}</option>
          <option value="pro-blue">{t('appearanceSettings.theme.proBlue')}</option>
      </select>
    </div>

      {/* Font méret */}
    <div className={styles.settingGroup}>
      <label>{t('appearanceSettings.fontSize.label')}</label>
      <select className={styles.select}>
        <option value="small">{t('appearanceSettings.fontSize.small')}</option>
        <option value="medium">{t('appearanceSettings.fontSize.medium')}</option>
        <option value="large">{t('appearanceSettings.fontSize.large')}</option>
      </select>
    </div>

      {/* Görgetősáv kapcsoló */}
    <div className={styles.settingGroup}>
      <label className={styles.switchLabel}>
        {t('appearanceSettings.scrollbars.label')}
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
          {t('appearanceSettings.themeDescriptions.light')}
        </div>
        <div className={styles.themeDescription}>
          {t('appearanceSettings.themeDescriptions.dark')}
        </div>
        <div className={styles.themeDescription}>
          {t('appearanceSettings.themeDescriptions.proBlue')}
        </div>
    </div>
  </div>
);
};
