/**
 * useTabOperations - Tab műveletek centralizált kezelése
 *
 * FUNKCIÓK:
 * - Callback-ek memoizálása
 * - Egységes tab művelet interfész
 * - Teljesítmény optimalizáció
 */

import React from 'react';

interface UseTabOperationsProps {
  onAddTab: () => void;
  onCloseTab: (tabId: string) => void;
  onActivateTab: (tabId: string) => void;
  onShowNewNews?: (tabId: string) => void;
}

export const useTabOperations = ({
  onAddTab,
  onCloseTab,
  onActivateTab,
  onShowNewNews,
}: UseTabOperationsProps) => {
  // Memoizált callback-ek a felesleges re-render-ek elkerülésére
  const handleAddTab = React.useCallback(() => {
    onAddTab();
  }, [onAddTab]);

  const handleCloseTab = React.useCallback(
    (tabId: string) => {
      onCloseTab(tabId);
    },
    [onCloseTab],
  );

  const handleActivateTab = React.useCallback(
    (tabId: string) => {
      onActivateTab(tabId);
    },
    [onActivateTab],
  );

  const handleShowNewNews = React.useCallback(
    (tabId: string) => {
      onShowNewNews?.(tabId);
    },
    [onShowNewNews],
  );

  return {
    handleAddTab,
    handleCloseTab,
    handleActivateTab,
    handleShowNewNews,
  };
};
