import * as React from 'react';
import { useTranslation } from 'react-i18next';
import styles from './Header.module.css';

interface TogglerProps {
  onToggle: () => void;
  currentTheme: string;
}

export const Toggler: React.FC<TogglerProps> = ({ onToggle, currentTheme }) => {
  const { t } = useTranslation();
  return (
    <button
      className={styles.themeToggler}
      onClick={onToggle}
      title={
        currentTheme === 'light'
          ? t('header.theme.switchToDark', 'Switch to dark theme')
          : t('header.theme.switchToLight', 'Switch to light theme')
      }
    >
      {currentTheme === 'light' ? '🌙' : '☀️'}
    </button>
  );
};
