import React from 'react';
// Card import removed since continent/country lists are no longer used directly
// import { Card } from '../../Card/Card';
import styles from './StartPage.module.css';
import { useLanguage } from '../../../contexts/LanguageContext';
import { languages } from '../../../locales';

// Constants removed if not rendered directly anymore
// const CONTINENTS = ['Europe', 'America', 'Asia', 'Africa', 'Oceania'];
// const COUNTRIES = [ ... ];

interface StartPageProps {
  onDismiss: () => void; // Passed from App.tsx to hide this page
}

function StartPage({ onDismiss }: StartPageProps) {
  const { language } = useLanguage();
  const t = languages[language].startPage;

  // Called when the user interacts with any main navigation option
  // or chooses to hide the welcome screen.
  const handleDismissAndPotentiallyNavigate = () => {
    // TODO: If specific panel activation is needed from StartPage,
    // navigationHint should be forwarded via onDismiss to App.tsx,
    // which can route it to the Side panel.
    // For now, we simply hide the StartPage.
    onDismiss();
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.welcomeTitle}>{t.welcomeTitle}</h1>
        <p className={styles.welcomeText}>{t.welcomeText}</p>
      </div>

      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>{t.mainFeatures}</h2>
        <div className={styles.cardGrid}>
          <div
            className={styles.localNewsCard}
            onClick={handleDismissAndPotentiallyNavigate}
          >
            <h3>{t.localNews.title}</h3>
            <p>{t.localNews.desc}</p>
          </div>
          <div
            className={styles.continentCard}
            onClick={handleDismissAndPotentiallyNavigate}
          >
            <h3>{t.continent.title}</h3>
            <p>{t.continent.desc}</p>
          </div>
          <div
            className={styles.categoryCard}
            onClick={handleDismissAndPotentiallyNavigate}
          >
            <h3>{t.search.title}</h3>
            <p>{t.search.desc}</p>
          </div>
        </div>
      </div>

      {/* Removed continent and country sections since StartPage now acts as a guide.
          Actual browsing is handled by the Side panel.
      */}

      <div className={styles.startPageFooter}>
        <button
          className={styles.hideStartPageButton}
          onClick={handleDismissAndPotentiallyNavigate}
        >
          {t.hideButton}
        </button>
      </div>
    </div>
  );
}

export default StartPage;
