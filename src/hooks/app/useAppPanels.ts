// src\hooks\app\useAppPanels.ts
import { useState, useCallback, useEffect } from 'react';
import { useMediaQuery } from '../useMediaQuery'; // ÚJ: useMediaQuery importálása

// Típus a jobb oldali panel módjához (kiegészítve az összes használt móddal)
export type UtilityMode =
  | 'tools'
  | 'auth'
  | 'settings'
  | 'favorites'
  | 'history'
  | 'savedNews'
  | 'legal'
  | 'premium';

/**
 * Hook a bal és jobb oldali panelek állapotának és a jobb oldali panel módjának kezelésére.
 */
export function useAppPanels() {
  const isMobile = useMediaQuery('(max-width: 768px)'); // ÚJ: Mobil nézet detektálása

  // Állapotok áthelyezve az App.tsx-ből, localStorage-ből inicializálva
  const [isLeftPanelCollapsed, setIsLeftPanelCollapsed] = useState(() => {
    if (isMobile) {
      return true; // Mobilon alapértelmezetten csukva
    }
    // Ha nincs localStorage érték, alapértelmezetten legyen CSUKVA (true)
    const storedValue = localStorage.getItem('leftPanelCollapsed');
    return storedValue === null ? true : storedValue === 'true';
  });

  const [isRightPanelCollapsed, setIsRightPanelCollapsed] = useState(() => {
    if (isMobile) {
      return true; // Mobilon alapértelmezetten csukva
    }
    // Ha nincs localStorage érték, alapértelmezetten legyen CSUKVA (true)
    const storedValue = localStorage.getItem('rightPanelCollapsed');
    return storedValue === null ? true : storedValue === 'true';
  });

  const [utilityMode, setUtilityMode] = useState<UtilityMode>(() => {
    // Ha van mentett érték, használjuk azt, különben 'tools'
    const storedValue = localStorage.getItem('utilityMode') as UtilityMode | null;
    return storedValue || 'tools';
  });

  // ÚJ: Kategória állapot a Settings komponens számára
  const [utilityCategory, setUtilityCategory] = useState<string | undefined>(undefined);

  // Állapotváltozások mentése localStorage-be
  useEffect(() => {
    localStorage.setItem('leftPanelCollapsed', isLeftPanelCollapsed.toString());
  }, [isLeftPanelCollapsed]);

  useEffect(() => {
    localStorage.setItem('rightPanelCollapsed', isRightPanelCollapsed.toString());
  }, [isRightPanelCollapsed]);

  useEffect(() => {
    localStorage.setItem('utilityMode', utilityMode);
  }, [utilityMode]);

  // Panel összecsukás/kinyitás kezelése
  const toggleLeftPanel = useCallback(() => {
    setIsLeftPanelCollapsed((prev) => !prev);
  }, []);

  const toggleRightPanel = useCallback(() => {
    setIsRightPanelCollapsed((prev) => {
      // Ha nyitva volt (most zárjuk), azonnal tisztítjuk a kategóriát és késleltetve a módot
      if (!prev) {
        setUtilityCategory(undefined); // ✅ Azonnali kategória tisztítás
        setTimeout(() => {
          setUtilityMode('tools');
        }, 300); // Időzítés az animációhoz igazítva
      }
      return !prev;
    });
  }, []);

  // A többi függvény változatlan marad...
  const openRightPanelWithMode = useCallback(
    (mode: string, category?: string) => {
      if (isRightPanelCollapsed) {
        setIsRightPanelCollapsed(false);
      }
      setUtilityMode(mode as UtilityMode);
      setUtilityCategory(category);
    },
    [isRightPanelCollapsed],
  );

  const closeRightPanel = useCallback(() => {
    setIsRightPanelCollapsed(true);
    setUtilityCategory(undefined); // ✅ Azonnali kategória tisztítás
    setTimeout(() => {
      setUtilityMode('tools');
    }, 300);
  }, []);

  return {
    isLeftPanelCollapsed,
    isRightPanelCollapsed,
    utilityMode,
    utilityCategory,
    setUtilityMode,
    toggleLeftPanel,
    toggleRightPanel,
    openRightPanelWithMode,
    closeRightPanel,
  };
}
