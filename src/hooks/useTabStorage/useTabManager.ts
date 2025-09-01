/*
 * useTabManager.ts
 *
 * TAB CRUD MŰVELETEK HOOK (News app)
 * ---------------------------------
 * Ez a hook felelős a tabok létrehozásáért, bezárásáért, módosításáért:
 *  - Tab létrehozás
 *  - Tab bezárás
 *  - Tab mód váltás
 *  - Tab átrendezés
 *  - Aktív tab beállítása
 *
 * Szétválasztva a useTabStorage.ts-ből a Single Responsibility Principle alapján.
 */
import { useState, useCallback, useEffect } from 'react';
import { useStorage } from '../useStorage';
import { TabDefinition } from '../../utils/datamanager/types/storage';

export function useTabManager() {
  const { state, updateTabState } = useStorage();

  const [activeTabId, setActiveTabId] = useState<string>('default');
  const [tabs, setTabs] = useState<TabDefinition[]>([]);

  // Inicializálás a tárolt állapotból
  useEffect(() => {
    if (state?.tabs) {
      setActiveTabId(state.tabs.activeId);
      setTabs(state.tabs.definitions as unknown as TabDefinition[]);
    }
  }, [state?.tabs]);

  // Aktív tab beállítása
  const setActiveTab = useCallback(
    async (tabId: string) => {
      if (tabId !== activeTabId) {
        setActiveTabId(tabId);
        await updateTabState(tabId, { isActive: true });

        if (state?.tabs?.definitions) {
          await updateTabState('tabs', {
            activeId: tabId,
            definitions: state.tabs.definitions,
          });
        }
      }
    },
    [activeTabId, updateTabState, state?.tabs?.definitions],
  );

  // Új tab létrehozása
  const createTab = useCallback(
    async (tabData: Omit<TabDefinition, 'id'>) => {
      const newId = `tab-${Date.now()}`;
      const newTab = {
        id: newId,
        ...tabData,
      };

      await updateTabState(newId, newTab);
      setActiveTab(newId);

      return newId;
    },
    [updateTabState, setActiveTab],
  );

  // Tab bezárása
  const closeTab = useCallback(
    async (tabId: string) => {
      if (!state?.tabs?.definitions) return;

      const newTabs = state.tabs.definitions.filter((tab) => tab.id !== tabId);

      // Ha az aktív tabot zárjuk be, aktiváljuk az elsőt
      let newActiveId = state.tabs.activeId;
      if (newActiveId === tabId && newTabs.length > 0) {
        newActiveId = newTabs[0].id;
      }

      await updateTabState('tabs', {
        activeId: newActiveId,
        definitions: newTabs,
      });

      if (newActiveId !== activeTabId) {
        setActiveTabId(newActiveId);
      }
    },
    [state?.tabs, updateTabState, activeTabId],
  );

  // Tab mód frissítése
  const updateTabMode = useCallback(
    (tabId: string, mode: 'feed' | 'article' | 'search' | 'saved' | 'news' | 'video' | 'new') => {
      if (!state?.tabs?.definitions) return;

      const updatedTabs = state.tabs.definitions.map((tab) =>
        tab.id === tabId ? { ...tab, mode } : tab,
      );

      updateTabState('tabs', {
        activeId: state.tabs.activeId,
        definitions: updatedTabs,
      });
    },
    [state?.tabs, updateTabState],
  );

  // Tabok átrendezése
  const reorderTabs = useCallback(
    (newTabs: TabDefinition[]) => {
      if (!state?.tabs) return;

      updateTabState('tabs', {
        activeId: state.tabs.activeId,
        definitions: newTabs,
      });
    },
    [state?.tabs, updateTabState],
  );

  return {
    activeTabId,
    tabs,
    setActiveTab,
    createTab,
    closeTab,
    updateTabMode,
    reorderTabs,
  };
}