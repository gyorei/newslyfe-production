import * as React from 'react';
import styles from './SideHeader.module.css';
import LocalButton from './LocalButton/LocalButton';
import { useTranslation } from 'react-i18next';

interface SideHeaderProps {
  onActivateTab?: (tabId: string) => void;
  loadLocalContent?: () => Promise<string | null>;
  isLocationLoading?: boolean;
  openRightPanelWithMode?: (mode: 'tools' | 'auth' | 'settings' | 'favorites' | 'history') => void;
  // ÚJ: Side panel navigáció
  activeView?: 'filter' | 'newNews';
  onViewChange?: (view: 'filter' | 'newNews') => void;
}

export const SideHeader: React.FC<SideHeaderProps> = ({
  onActivateTab = () => {},
  loadLocalContent,
  isLocationLoading = false,
  openRightPanelWithMode,
  // ÚJ: Side panel navigáció props
  activeView = 'filter',
  onViewChange = () => {},
}) => {
  const { t } = useTranslation();
  return (
    <div className={styles.sidebarHeader}>
      <div className={styles.headerTop}>
        {/* ÚJ: Navigációs gombok */}
        <div className={styles.navigationButtons}>
          <button
            className={`${styles.navButton} ${activeView === 'filter' ? styles.active : ''}`}
            onClick={() => onViewChange('filter')}
            title={t('sideHeader.filterTitle', 'Filters and search')}
          >
            {t('sideHeader.filter', 'Filter')}
          </button>
  
               {/*
               <button
               className={`${styles.navButton} ${activeView === 'newNews' ? styles.active : ''}`}
               onClick={() => onViewChange('newNews')}
               title={t('sideHeader.newNewsTitle', 'New news')}
           >
               {t('sideHeader.newNews', 'New News')}
          </button>
          */}
          </div>

        {/* Meglévő LocalButton - jobb szélre */}
        <LocalButton
          onActivateTab={onActivateTab}
          loadLocalContent={loadLocalContent}
          isLocationLoading={isLocationLoading}
          openRightPanelWithMode={openRightPanelWithMode}
        />
      </div>
    </div>
  );
};

export default SideHeader;
