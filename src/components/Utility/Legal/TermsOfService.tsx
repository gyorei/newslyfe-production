import React from 'react';
import { useTranslation } from 'react-i18next';
import styles from './Legal.module.css';

// ========================================
// 🎥 TERMS OF SERVICE KOMPONENS - GOOGLE SZABÁLYOK!
// ========================================
// Szolgáltatási feltételek

export const TermsOfService: React.FC = () => {
  const { t } = useTranslation();
  
  return (
    <div className={styles.termsOfService}>
      <h2>{t('terms.title')}</h2>
      
      <section>
        <h3>{t('terms.sections.general.title')}</h3>
        <p>
          {t('terms.sections.general.description')}
        </p>
      </section>

      <section>
        <h3>{t('terms.sections.serviceDescription.title')}</h3>
        <p>{t('terms.sections.serviceDescription.description')}</p>
        <ul>
          <li><strong>{t('terms.sections.serviceDescription.services.newsAggregation.title')}</strong> {t('terms.sections.serviceDescription.services.newsAggregation.description')}</li>
          <li><strong>{t('terms.sections.serviceDescription.services.categorization.title')}</strong> {t('terms.sections.serviceDescription.services.categorization.description')}</li>
          <li><strong>{t('terms.sections.serviceDescription.services.search.title')}</strong> {t('terms.sections.serviceDescription.services.search.description')}</li>
          <li><strong>{t('terms.sections.serviceDescription.services.video.title')}</strong> {t('terms.sections.serviceDescription.services.video.description')}</li>
        </ul>
      </section>

      <section>
        <h3>{t('terms.sections.userResponsibility.title')}</h3>
        <p>{t('terms.sections.userResponsibility.description')}</p>
        <ul>
          <li>{t('terms.sections.userResponsibility.responsibilities.legalUse')}</li>
          <li>{t('terms.sections.userResponsibility.responsibilities.accountSecurity')}</li>
          <li>{t('terms.sections.userResponsibility.responsibilities.contentEvaluation')}</li>
          <li>{t('terms.sections.userResponsibility.responsibilities.noMisinformation')}</li>
        </ul>
      </section>

      <section>
        <h3>{t('terms.sections.advertising.title')}</h3>
        <p>
          <strong>{t('terms.sections.advertising.adsense.title')}</strong> {t('terms.sections.advertising.adsense.description')}
        </p>
        <p>
          <strong>{t('terms.sections.advertising.thirdPartyLinks.title')}</strong> {t('terms.sections.advertising.thirdPartyLinks.description')}
        </p>
      </section>

      <section>
        <h3>{t('terms.sections.intellectualProperty.title')}</h3>
        <p>
          {t('terms.sections.intellectualProperty.description')}
        </p>
      </section>

      <section>
        <h3>{t('terms.sections.serviceModification.title')}</h3>
        <p>
          {t('terms.sections.serviceModification.description')}
        </p>
      </section>

      <section>
        <h3>{t('terms.sections.limitationOfLiability.title')}</h3>
        <p>
          {t('terms.sections.limitationOfLiability.description')}
        </p>
        <ul>
          <li>{t('terms.sections.limitationOfLiability.limitations.newsAccuracy')}</li>
          <li>{t('terms.sections.limitationOfLiability.limitations.serviceInterruption')}</li>
          <li>{t('terms.sections.limitationOfLiability.limitations.dataLoss')}</li>
          <li>{t('terms.sections.limitationOfLiability.limitations.indirectDamages')}</li>
        </ul>
      </section>

      <section>
        <h3>{t('terms.sections.disputes.title')}</h3>
        <p>
          {t('terms.sections.disputes.description')}
        </p>
      </section>

      <section>
        <h3>{t('terms.sections.contact.title')}</h3>
        <p>
          {t('terms.sections.contact.description')}
        </p>
        <p>
          <strong>{t('terms.sections.contact.email.label')}</strong> {t('terms.sections.contact.email.address')}<br />
          <strong>{t('terms.sections.contact.lastUpdated')}</strong> {new Date().toLocaleDateString()}
        </p>
      </section>
    </div>
  );
};
