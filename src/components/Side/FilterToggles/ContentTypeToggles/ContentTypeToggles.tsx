// src\components\Side\FilterToggles\ContentTypeToggles\ContentTypeToggles.tsx
import * as React from 'react';
import { useTranslation } from 'react-i18next';
import toggleStyles from '../SideToggleButtons.module.css';
import styles from './ContentTypeToggles.module.css';

interface ContentTypeTogglesProps {
  activeContentType: 'text' | 'video' | 'both';
  onContentTypeChange: (contentType: 'text' | 'video' | 'both') => void;
}

export const ContentTypeToggles: React.FC<ContentTypeTogglesProps> = ({
  activeContentType,
  onContentTypeChange,
}) => {
  const { t } = useTranslation();
  
  const handleBothClick = () => {
    console.log('[ContentTypeToggles] Both gomb kattintva - Coming Soon');
    // TODO: Implementálás később
    alert(t('contentType.comingSoon'));
  };
  
  return (
    <div className={toggleStyles.toggleContainer}>
      <h4 className={styles.sectionTitle}>{t('contentType.title')}</h4>
      <div className={toggleStyles.toggleGroup}>
        <button
          className={`${toggleStyles.toggleButton} ${activeContentType === 'text' ? toggleStyles.active : ''}`}
          onClick={() => {
            console.log('[ContentTypeToggles] Text gomb kattintva');
            onContentTypeChange('text');
          }}
          title={t('contentType.textTitle', 'Text news only')}
          type="button"
        >
          {t('contentType.text', 'Text')}
        </button>
        <button
          className={`${toggleStyles.toggleButton} ${activeContentType === 'video' ? toggleStyles.active : ''}`}
          onClick={() => {
            console.log('[ContentTypeToggles] Video gomb kattintva');
            onContentTypeChange('video');
          }}
          title={t('contentType.videoTitle', 'Video content only')}
          type="button"
        >
          {t('contentType.video', 'Video')}
        </button>
        <button
          className={`${toggleStyles.toggleButton} ${toggleStyles['coming-soon']}`}
          onClick={handleBothClick}
          title={t('contentType.comingSoonTitle')}
          type="button"
        >
          {t('contentType.both', 'Both')}
        </button>
      </div>
    </div>
  );
};