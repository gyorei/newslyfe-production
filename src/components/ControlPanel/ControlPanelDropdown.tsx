import * as React from 'react';
import { useUI } from '../../contexts/UIContext';
import { useTranslation } from 'react-i18next';
import styles from './ControlPanel.module.css'; // ✅ JAVÍTVA: létező CSS fájl használata

// Átmeneti állapot - később ezt globális UI állapotkezelésre cseréljük
interface ControlPanelDropdownProps {
  onClose: () => void;
}

export const ControlPanelDropdown: React.FC<ControlPanelDropdownProps> = ({ onClose }) => {
  // UI Context használata a valódi állapot kezeléshez
  const { uiState, toggleCategoryBar, toggleSourceIcons } = useUI();
  const { t } = useTranslation();

  return (
    <div className={styles.dropdownMenu}>
      <div className={styles.dropdownHeader}>
        <h3>{t('controlPanel.title', 'UI Beállítások')}</h3>
        <button className={styles.closeButton} onClick={onClose} aria-label={t('controlPanel.close', 'Bezárás')} title={t('controlPanel.close', 'Bezárás')}>
          ✕
        </button>
      </div>

      <div className={styles.dropdownContent}>
        <div className={styles.settingItem}>
          <label htmlFor="category-bar-toggle" className={styles.settingLabel}>
            {t('controlPanel.labels.categoryBar', 'Kategória sáv')}
          </label>
          <div className={styles.toggleWrapper}>
            <input
              id="category-bar-toggle"
              type="checkbox"
              className={styles.toggleCheckbox}
              checked={uiState.showCategoryBar}
              onChange={toggleCategoryBar}
            />
            <div className={styles.toggleSlider}></div>
          </div>
        </div>

        <div className={styles.settingItem}>
          <label htmlFor="source-icons-toggle" className={styles.settingLabel}>
            {t('controlPanel.labels.sourceIcons', 'Forrás ikonok')}
          </label>
          <div className={styles.toggleWrapper}>
            <input
              id="source-icons-toggle"
              type="checkbox"
              className={styles.toggleCheckbox}
              checked={uiState.showSourceIcons}
              onChange={toggleSourceIcons}
            />
            <div className={styles.toggleSlider}></div>
          </div>
        </div>
      </div>
    </div>
  );
};
