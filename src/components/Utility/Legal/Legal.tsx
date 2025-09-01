import React, { useState } from 'react';
import styles from './Legal.module.css';
import { PrivacyPolicy } from './PrivacyPolicy';
import { TermsOfService } from './TermsOfService';

// ========================================
// 🎥 LEGAL KOMPONENS - GOOGLE SZABÁLYOK!
// ========================================
// Adatvédelmi tájékoztató és szolgáltatási feltételek

export const Legal: React.FC = () => {
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
          aria-label="Adatvédelmi Tájékoztató"
        >
          📋 Adatvédelmi Tájékoztató
        </button>
        <button 
          className={`${styles.tab} ${activeTab === 'terms' ? styles.active : ''}`}
          onClick={() => setActiveTab('terms')}
          aria-label="Szolgáltatási Feltételek"
        >
          📄 Szolgáltatási Feltételek
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
