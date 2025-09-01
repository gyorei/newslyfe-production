// src\components\Header\Logo.tsx
// src/components/Header/Logo.tsx (HELYES, JAVÍTOTT VERZIÓ)

import * as React from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import styles from './Header.module.css';

export const Logo: React.FC = () => {
  const { t } = useTranslation();
  return (
    <Link
      to="/"
      className={styles.logoContainer} // Ez a külső konténer
      aria-label={t('header.logo.aria', 'Go to homepage - NewsLyfe')}
      tabIndex={0}
    >
      {/* Az 'N' betű a már meglévő, stílusozott körben */}
      <div className={styles.logoIcon}>N</div>
      
      {/* A név maradék része, sima szövegként */}
      <span className={styles.logoText}>ewsLyfe</span>
    </Link>
  );
};