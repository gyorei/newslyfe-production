/*
import * as React from 'react';
import { useTranslation } from 'react-i18next';
import styles from './SearchModeToggles.module.css';

interface SearchModeTogglesProps {
  activeSearchMode: 'countries' | 'source' | 'channel';
  onSearchModeChange: (searchMode: 'countries' | 'source' | 'channel') => void;
}

export const SearchModeToggles: React.FC<SearchModeTogglesProps> = ({
  activeSearchMode,
  onSearchModeChange,
}) => {
  const { t } = useTranslation();

  return (
    <div className={styles.searchModeContainer}>
      <h4 className={styles.sectionTitle}>{t('searchMode.title', 'Search Mode')}</h4>
      <div className={styles.toggleGroup}>
        <button
          className={`${styles.toggleButton} ${activeSearchMode === 'countries' ? styles.active : ''}`}
          onClick={() => onSearchModeChange('countries')}
          title={t('searchMode.countryTitle', 'Search by countries')}
          type="button"
        >
          {t('searchMode.country', 'Country')}
        </button>
        <button
          className={`${styles.toggleButton} ${styles.inactive}`}
          disabled
          title={t('searchMode.sourceTitle', 'Not available yet')}
          type="button"
        >
          {t('searchMode.source', 'Source')}
        </button>
        <button
          className={`${styles.toggleButton} ${styles.inactive}`}
          disabled
          title={t('searchMode.channelTitle', 'Not available yet')}
          type="button"
        >
          {t('searchMode.channel', 'Channel')}
        </button>
      </div>
    </div>
  );
}; 
*/