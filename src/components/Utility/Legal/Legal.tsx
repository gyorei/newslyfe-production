import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import styles from './Legal.module.css';
import { PrivacyPolicy } from './PrivacyPolicy';
import { TermsOfService } from './TermsOfService';

// ========================================
// 🎥 LEGAL KOMPONENS - GOOGLE SZABÁLYOK!
// ========================================
// Adatvédelmi tájékoztató és szolgáltatási feltételek

export const Legal: React.FC = () => {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<'privacy' | 'terms'>('privacy');

  return (
    <div className={styles.legalContainer}>
      {/* ========================================
       * 🎥 LEGAL TABS - NAVIGÁCIÓ
       * ======================================== */}
      <div className={styles.legalTabs}>
        <button 
          className={`${styles.tab} ${activeTab === 'privacy' ? styles.active : ''}`}
          onClick={() => setActiveTab('privacy')}
          aria-label={t('legal.privacyPolicy')}
        >
          📋 {t('legal.privacyPolicy')}
        </button>
        <button 
          className={`${styles.tab} ${activeTab === 'terms' ? styles.active : ''}`}
          onClick={() => setActiveTab('terms')}
          aria-label={t('legal.termsOfService')}
        >
          📄 {t('legal.termsOfService')}
        </button>
      </div>
      
      {/* ========================================
       * 🎥 LEGAL CONTENT - TARTALOM
       * ======================================== */}
      <div className={styles.legalContent}>
        {activeTab === 'privacy' ? (
          <PrivacyPolicy />
        ) : (
          <TermsOfService />
        )}
      </div>
    </div>
  );
};

export default Legal;
