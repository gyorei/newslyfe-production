import React from 'react';
import { useTranslation } from 'react-i18next';
import styles from './Legal.module.css';

// ========================================
// 🎥 PRIVACY POLICY KOMPONENS - GOOGLE SZABÁLYOK!
// ========================================
// Adatvédelmi tájékoztató Google AdSense szabályoknak megfelelően

export const PrivacyPolicy: React.FC = () => {
  const { t } = useTranslation();
  
  return (
    <div className={styles.privacyPolicy}>
      <h2>{t('privacy.title')}</h2>
      
      <section>
        <h3>{t('privacy.sections.introduction.title')}</h3>
        <p>
          {t('privacy.sections.introduction.description')}
        </p>
      </section>

      <section>
        <h3>{t('privacy.sections.dataCollection.title')}</h3>
        <p>{t('privacy.sections.dataCollection.description')}</p>
        <ul>
          <li><strong>{t('privacy.sections.dataCollection.types.usage.title')}</strong> {t('privacy.sections.dataCollection.types.usage.description')}</li>
          <li><strong>{t('privacy.sections.dataCollection.types.technical.title')}</strong> {t('privacy.sections.dataCollection.types.technical.description')}</li>
          <li><strong>{t('privacy.sections.dataCollection.types.preferences.title')}</strong> {t('privacy.sections.dataCollection.types.preferences.description')}</li>
        </ul>
      </section>

      <section>
        <h3>{t('privacy.sections.googleAdsense.title')}</h3>
        <p>
          <strong>{t('privacy.sections.googleAdsense.ads.title')}</strong> {t('privacy.sections.googleAdsense.ads.description')}
        </p>
        <p>
          <strong>{t('privacy.sections.googleAdsense.dataSharing.title')}</strong> {t('privacy.sections.googleAdsense.dataSharing.description')}
        </p>
      </section>

      <section>
        <h3>{t('privacy.sections.cookies.title')}</h3>
        <p>
          {t('privacy.sections.cookies.description')}
        </p>
        <ul>
          <li><strong>{t('privacy.sections.cookies.types.necessary.title')}</strong> {t('privacy.sections.cookies.types.necessary.description')}</li>
          <li><strong>{t('privacy.sections.cookies.types.analytics.title')}</strong> {t('privacy.sections.cookies.types.analytics.description')}</li>
          <li><strong>{t('privacy.sections.cookies.types.advertising.title')}</strong> {t('privacy.sections.cookies.types.advertising.description')}</li>
        </ul>
      </section>

      <section>
        <h3>{t('privacy.sections.dataRetention.title')}</h3>
        <p>
          {t('privacy.sections.dataRetention.description')}
        </p>
      </section>

      <section>
        <h3>{t('privacy.sections.rights.title')}</h3>
        <p>{t('privacy.sections.rights.description')}</p>
        <ul>
          <li>{t('privacy.sections.rights.list.access')}</li>
          <li>{t('privacy.sections.rights.list.rectification')}</li>
          <li>{t('privacy.sections.rights.list.erasure')}</li>
          <li>{t('privacy.sections.rights.list.restriction')}</li>
          <li>{t('privacy.sections.rights.list.portability')}</li>
        </ul>
      </section>

      <section>
        <h3>{t('privacy.sections.contact.title')}</h3>
        <p>
          {t('privacy.sections.contact.description')}
        </p>
        <p>
          <strong>{t('privacy.sections.contact.email.label')}</strong> {t('privacy.sections.contact.email.address')}<br />
          <strong>{t('privacy.sections.contact.lastUpdated')}</strong> {new Date().toLocaleDateString()}
        </p>
      </section>
    </div>
  );
};
