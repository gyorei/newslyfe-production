// src/components/Tabs/TabNavigation.tsx
import React from 'react';
import { useTranslation } from 'react-i18next';
import { Tab } from './types';

const TabNavigation: React.FC<{
  tabs: Tab[];
  activeTabId: string;
  onTabSelect: (tabId: string) => void;
  onTabClose: (tabId: string) => void;
}> = ({ tabs, activeTabId, onTabSelect, onTabClose }) => {
  const { t } = useTranslation();
  
  return (
    <div>
      {tabs.map(tab => (
        <span key={tab.id} style={{ fontWeight: tab.id === activeTabId ? 'bold' : 'normal' }}>
          <button 
            onClick={() => onTabSelect(tab.id)}
            aria-label={t('tabs.selectTab', { title: tab.title })}
            title={t('tabs.selectTab', { title: tab.title })}
          >
            {tab.title}
          </button>
          <button 
            onClick={() => onTabClose(tab.id)}
            aria-label={t('tabs.closeTab', { title: tab.title })}
            title={t('tabs.closeTab', { title: tab.title })}
          >
            {t('tabs.closeSymbol')}
          </button>
        </span>
      ))}
    </div>
  );
};

export default TabNavigation;