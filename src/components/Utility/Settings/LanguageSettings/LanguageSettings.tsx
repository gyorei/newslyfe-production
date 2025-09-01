// src/components/Header/LanguageSettings/LanguageSettings.tsx
import React from 'react';
import { useTranslation } from 'react-i18next';
import styles from './LanguageSettings.module.css';

const languageNames: { [key: string]: string } = {
  hu: 'Hungarian',
  en: 'English',
};

interface LanguageSettingsProps {
  // onClose?: () => void;
}

export const LanguageSettings: React.FC<LanguageSettingsProps> = (/* { onClose } */) => {
  const { i18n, t } = useTranslation();
  const current = i18n.language;

  const handleLanguageSelect = (lang: string) => {
    if (lang !== current) {
      i18n.changeLanguage(lang);
    }
    // onClose?.();
  };

  return (
    <div className={styles.languageSettingsContainer}>
      
      {/* EZ A SZÖVEG KERÜLT FELÜLRE */}
      <div className={styles.infoText}>
        {t('settings.languageInfo', 'The app interface will use the selected language.')}
      </div>

      {/* A GOMBOK PEDIG EZ ALATT KÖVETKEZNEK */}
      <div className={styles.languageList}>
        {Object.keys(languageNames).map((lang) => (
          <button
            key={lang}
            className={`${styles.languageButton} ${lang === current ? styles.active : ''}`}
            onClick={() => handleLanguageSelect(lang)}
          >
            {lang === current && <span className={styles.checkmark}>✓</span>}
            {languageNames[lang]}
          </button>
        ))}
      </div>

    </div>
  );
};