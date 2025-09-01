// src/components/Tabs/TabNavigation.tsx
import React from 'react';
import { Tab } from './types';

const TabNavigation: React.FC<{
  tabs: Tab[];
  activeTabId: string;
  onTabSelect: (tabId: string) => void;
  onTabClose: (tabId: string) => void;
}> = ({ tabs, activeTabId, onTabSelect, onTabClose }) => (
  <div>
    {tabs.map(tab => (
      <span key={tab.id} style={{ fontWeight: tab.id === activeTabId ? 'bold' : 'normal' }}>
        <button onClick={() => onTabSelect(tab.id)}>{tab.title}</button>
        <button onClick={() => onTabClose(tab.id)}>×</button>
      </span>
    ))}
  </div>
);

export default TabNavigation;