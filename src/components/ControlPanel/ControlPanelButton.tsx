import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import styles from './ControlPanel.module.css';
import { useUI } from '../../contexts/UIContext';

// Temporary state - we are now using global UI state management
interface ControlPanelDropdownProps {
  onClose: () => void;
}

export const ControlPanelButton: React.FC<ControlPanelButtonProps> = ({ onClick }) => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const [buttonPosition, setButtonPosition] = useState({ top: 0, right: 0 });
  const { t } = useTranslation();

  // The ControlPanelDropdown component (defined within here) uses useUI(),
  // so the useUI() call is still necessary and correct there.
  const ControlPanelDropdown: React.FC<ControlPanelDropdownProps> = ({ onClose }) => {
    const { uiState, toggleCategoryBar, toggleSourceIcons } = useUI();
    const { t } = useTranslation();

    return (
      <div className={styles.dropdownMenu}>
        <div className={styles.dropdownHeader}>
          <h3>{t('controlPanel.title', 'UI Settings')}</h3>
          <button className={styles.closeButton} onClick={onClose} aria-label={t('controlPanel.close', 'Close')} title={t('controlPanel.close', 'Close')}>
            ✕
          </button>
        </div>

        <div className={styles.dropdownContent}>
          <div className={styles.settingItem}>
            <label htmlFor="category-bar-toggle" className={styles.settingLabel}>
              {t('controlPanel.labels.categoryBar', 'Category Bar')}
            </label>
            <div className={styles.toggleWrapper}>
              <input
                id="category-bar-toggle"
                type="checkbox"
                className={styles.toggleCheckbox}
                checked={uiState.showCategoryBar}
                onChange={toggleCategoryBar}
              />
              <div
                className={styles.toggleSlider}
                onClick={toggleCategoryBar}
                style={{ cursor: 'pointer' }}
              >
                <div className={styles.toggleSliderBefore}></div>
              </div>
            </div>
          </div>

          <div className={styles.settingItem}>
            <label htmlFor="source-icons-toggle" className={styles.settingLabel}>
              {t('controlPanel.labels.sourceIcons', 'Source Icons')}
            </label>
            <div className={styles.toggleWrapper}>
              <input
                id="source-icons-toggle"
                type="checkbox"
                className={styles.toggleCheckbox}
                checked={uiState.showSourceIcons}
                onChange={toggleSourceIcons}
              />
              <div
                className={styles.toggleSlider}
                onClick={toggleSourceIcons}
                style={{ cursor: 'pointer' }}
              >
                <div className={styles.toggleSliderBefore}></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Handling click on the button - opening/closing the dropdown
  const handleClick = () => {
    console.log('ControlPanel button clicked');

    // Calculating button position
    if (buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      setButtonPosition({
        top: rect.bottom + 8, // 8px space below the button
        right: window.innerWidth - rect.right,
      });
    }

    setIsDropdownOpen((prev) => !prev);
    console.log('Dropdown state changed:', !isDropdownOpen);

    if (onClick) onClick();
  };

  // Listening for clicks on the document - to close the dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        buttonRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        !buttonRef.current.contains(event.target as Node)
      ) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Listening for window resize
  useEffect(() => {
    const handleResize = () => {
      if (isDropdownOpen && buttonRef.current) {
        const rect = buttonRef.current.getBoundingClientRect();
        setButtonPosition({
          top: rect.bottom + 8,
          right: window.innerWidth - rect.right,
        });
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [isDropdownOpen]);

  useEffect(() => {
    const portalDiv = dropdownRef.current;
    if (isDropdownOpen && portalDiv) {
      const isDarkMode = document.documentElement.classList.contains('dark');
      // Távolítjuk az 'app' osztály hozzáadását
      if (isDarkMode) {
        portalDiv.classList.add('dark');
        portalDiv.classList.remove('light');
      } else {
        portalDiv.classList.add('light');
        portalDiv.classList.remove('dark');
      }
    } else if (portalDiv) {
      portalDiv.classList.remove('dark', 'light');
    }
  }, [isDropdownOpen]);

  return (
    <>
      <div className={styles.controlPanelContainer}>
        <button
          ref={buttonRef}
          className={styles.controlPanelButton}
          onClick={handleClick}
          title={t('controlPanel.button.title', 'UI settings')}
          aria-label={t('controlPanel.button.aria', 'Open interface settings')}
          aria-expanded={isDropdownOpen}
          aria-controls="control-panel-dropdown"
        >
          <span className={styles.line}></span>
          <span className={styles.line}></span>
          <span className={styles.line}></span>
        </button>
      </div>

      {isDropdownOpen &&
        createPortal(
          <div
            id="control-panel-dropdown"
            ref={dropdownRef}
            className={styles.dropdownContainer}
            style={{
              position: 'fixed',
              top: `${buttonPosition.top}px`,
              right: `${buttonPosition.right}px`,
              zIndex: 9999,
              backgroundColor: 'var(--color-surface)',
              // maxHeight és overflowY eltávolítva
            }}
          >
            <ControlPanelDropdown onClose={() => setIsDropdownOpen(false)} />
          </div>,
          document.getElementById('app-container') || document.body,
        )}
    </>
  );
};

interface ControlPanelButtonProps {
  onClick?: () => void;
}
