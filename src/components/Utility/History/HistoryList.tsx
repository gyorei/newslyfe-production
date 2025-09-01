import * as React from 'react';
import styles from './History.module.css';
import { traceDataFlow } from '../../../utils/debugTools/debugTools';

// Üres interface helyett nem adunk meg prop típust
export const HistoryList: React.FC = () => {
  // Nyomkövetés a fejlesztés segítéséhez
  React.useEffect(() => {
    traceDataFlow('HistoryList.mount', {
      componentName: 'HistoryList',
    });
  }, []);

  return (
    <div className={styles.historyList}>
      <h2>Browsing History</h2>
      <p className={styles.emptyMessage}>
      No history yet. Viewed news and applied filters will appear here.
      </p>
    </div>
  );
};
