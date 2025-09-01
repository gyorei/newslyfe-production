import { useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Tab } from '../../../types';

interface UseTabPersistenceProps {
  tabs: Tab[];
  activeTabId: string;
}

export function useTabPersistence({ tabs, activeTabId }: UseTabPersistenceProps) {
  const prevTabIdRef = useRef<string | null>(null);
  const { t } = useTranslation();

  // Aktív tab meghatározása - biztonságos fallback
  const activeTab: Tab = tabs.find((tab) => tab.id === activeTabId) || tabs[0] || {
    id: 'default',
    title: t('content.defaultTabTitle', 'Default'),
    active: false,
    mode: 'news',
    filters: {}
  };
  const isNewTab = activeTab?.mode === 'new';

  useEffect(() => {
    prevTabIdRef.current = activeTabId;
  }, [activeTabId]);

  return {
    activeTab,
    isNewTab,
  };
}
