import * as React from 'react';
import styles from './Favorites.module.css';
import { traceDataFlow } from '../../../utils/debugTools/debugTools';

// Üres interface helyett Record<string, never> vagy nem adunk meg prop típust
// ha egyelőre nincsenek prop-ok
export const FavoritesList: React.FC = () => {
  // Nyomkövetés a fejlesztés segítéséhez
  React.useEffect(() => {
    traceDataFlow('FavoritesList.mount', {
      componentName: 'FavoritesList',
    });
  }, []);


  return (
    <div className={styles.favoritesList}>
      <h2>Favorite News and Sources</h2>
      <p className={styles.emptyMessage}>
        No favorites yet. You can mark news as favorite by clicking the ⭐ button.
      </p>
    </div>
  );


};
