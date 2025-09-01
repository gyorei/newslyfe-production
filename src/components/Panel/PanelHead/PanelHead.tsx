import * as React from 'react';
import styles from './PanelHead.module.css';

interface PanelHeadProps {
  title: string;
  onRefresh?: () => void; // MEGTARTVA kompatibilitás miatt, de nem használjuk
  showTitle?: boolean; // Opcionálisan elrejthetjük a címet
  sources?: Array<{
    // MEGTARTVA de már nem használjuk
    id: string;
    name: string;
    domain?: string;
  }>;
}

/**
 * Panel fejléc komponens - MINIMALIZÁLT
 * - Csak a cím (opcionálisan)
 * - A frissítés gomb és forrás ikonok eltávolítva
 * - Tiszta átmenet a kategória sáv és forrás ikon sáv között
 */
export const PanelHead: React.FC<PanelHeadProps> = ({ title, showTitle = false }) => {
  // Ha nincs megjelenítendő cím, akkor egyáltalán ne rendereljünk semmit
  if (!showTitle) {
    return null;
  }

  return (
    <div className={styles.panelHeader}>
      <h2 className={styles.panelTitle}>{title}</h2>
    </div>
  );
};
