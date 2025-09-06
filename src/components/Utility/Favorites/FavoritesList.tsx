import * as React from 'react';
import { useTranslation } from 'react-i18next';
import styles from './Favorites.module.css';
import { traceDataFlow } from '../../../utils/debugTools/debugTools';

// Üres interface helyett Record<string, never> vagy nem adunk meg prop típust
// ha egyelőre nincsenek prop-ok
export const FavoritesList: React.FC = () => {
  const { t } = useTranslation();
  
  // Nyomkövetés a fejlesztés segítéséhez
  React.useEffect(() => {
    traceDataFlow('FavoritesList.mount', {
      componentName: 'FavoritesList',
    });
  }, []);


  return (
    <div className={styles.favoritesList}>
      <h2>{t('favorites.title')}</h2>
      <p className={styles.emptyMessage}>
        {t('favorites.emptyMessage')}
      </p>
    </div>
  );


};
