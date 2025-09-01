// src/components/Tabs/TabContentRenderer.tsx
import React from 'react';
import MemoizedPanel from '../Panel/TabPanel';
import MemoizedHome from './Home/Home';
import MemoizedSearchTab from './SearchTab/SearchTab';
import MemoizedVideoPanel from '../VideoPanel/VideoPanel';
import { Tab, NewsItem } from '../../types';

interface TabContentRendererProps {
  tabs: Tab[];
  activeTabId: string;
  videoItems?: NewsItem[];
  loading?: boolean;
  error?: Error | string | null;
}

const TabContentRenderer: React.FC<TabContentRendererProps> = ({ tabs, activeTabId, videoItems = [], loading = false, error = null, ...rest }) => {
  const activeTab = tabs.find(tab => tab.id === activeTabId);
  
  console.log('[TabContentRenderer] 🔍 RENDER CALLED');
  console.log('[TabContentRenderer] 🔍 Props received:', {
    activeTabId,
    videoItemsLength: videoItems?.length,
    videoItemsReference: videoItems,
    loading,
    error,
    restProps: rest,
    activeTab: activeTab ? { id: activeTab.id, mode: activeTab.mode } : null
  });
  
  // ✅ OPTIMALIZÁLT: Debug logging csak development módban
  if (process.env.NODE_ENV === 'development') {
    console.log('[TabContentRenderer] Render, activeTabId:', activeTabId, 'activeTab:', activeTab);
  }
  
  if (!activeTab) return null;

  switch (activeTab.mode) {
    case 'home':
      return <MemoizedHome key={activeTab.id} isActive={true} title={activeTab.title} {...rest} />;
    case 'search':
      return <MemoizedSearchTab key={activeTab.id} isActive={true} searchTerm={activeTab.filters?.searchTerm || activeTab.title} {...rest} />;
    case 'video':
      return (
        <MemoizedVideoPanel 
          key={activeTab.id} 
          isActive={true} 
          videoItems={videoItems} 
          loading={loading} 
          error={error} 
        />
      );
    default:
      return <MemoizedPanel key={activeTab.id} isActive={true} tab={activeTab} />;
  }
};

export default TabContentRenderer;
