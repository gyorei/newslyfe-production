import * as React from 'react';
import { useTranslation } from 'react-i18next';
import styles from './History.module.css';
import { traceDataFlow } from '../../../utils/debugTools/debugTools';

// Üres interface helyett nem adunk meg prop típust
export const HistoryList: React.FC = () => {
  const { t } = useTranslation();
  
  // Nyomkövetés a fejlesztés segítéséhez
  React.useEffect(() => {
    traceDataFlow('HistoryList.mount', {
      componentName: 'HistoryList',
    });
  }, []);

  return (
    <div className={styles.historyList}>
      <h2>{t('historyList.title')}</h2>
      <p className={styles.emptyMessage}>
        {t('historyList.emptyMessage')}
      </p>
    </div>
  );
};
