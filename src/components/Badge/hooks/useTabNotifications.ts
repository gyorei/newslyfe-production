/**
 * useTabNotifications - Továbbfejlesztett hook valós hír adatokkal
 *
 * VÁLTOZÁSOK:
 * - Környezet-specifikus debug logging
 * - Valós API integráció készítése
 * - Teljesítmény optimalizáció
 */

import { useState, useEffect, useCallback, useMemo } from 'react';

// Debug helper - csak development módban
const IS_DEVELOPMENT = process.env.NODE_ENV === 'development';
const DEBUG_NOTIFICATIONS = IS_DEVELOPMENT;

const debugLog = (message: string, ...args: unknown[]) => {
  if (DEBUG_NOTIFICATIONS) {
    console.log(`[useTabNotifications] ${message}`, ...args);
  }
};

interface MockNewsData {
  count: number;
  previews?: string[];
}

// Optimalizált mock adatok generátor
const generateMockData = (tabId: string): MockNewsData => {
  // Determinisztikus mock adatok a tab ID alapján
  const hash = tabId.split('').reduce((a, b) => {
    a = (a << 5) - a + b.charCodeAt(0);
    return a & a;
  }, 0);

  const randomSeed = Math.abs(hash) % 100;

  if (randomSeed > 80) {
    return { count: 3 };
  } else if (randomSeed > 60) {
    return { count: 7 };
  } else if (randomSeed > 40) {
    return { count: 5 };
  } else if (randomSeed > 20) {
    return { count: 1 };
  } else {
    return { count: 0 };
  }
};

export const useTabNotifications = (tabId: string) => {
  const [newNewsCount, setNewNewsCount] = useState(0);

  // Optimalizált mock adatok - memoizálva a tab ID alapján
  const mockData = useMemo(() => generateMockData(tabId), [tabId]);

  // Frissítési logika
  const updateNotifications = useCallback(() => {
    debugLog(`Notification frissítés: ${tabId}`);
    setNewNewsCount(mockData.count);
  }, [tabId, mockData.count]);

  // Effect csak a szükséges esetekben fut le
  useEffect(() => {
    updateNotifications();
  }, [updateNotifications]);

  // Jövőbeli API integráció helyőrzője
  const refreshNotifications = useCallback(async () => {
    debugLog(`Notification API frissítés: ${tabId}`);

    // TODO: Valós API hívás implementálása
    // try {
    //   const response = await newsAPI.getNewCount(tabId);
    //   setNewNewsCount(response.count);
    // } catch (error) {
    //   console.error('Notification API hiba:', error);
    // }

    // Egyelőre mock adatokat használunk
    updateNotifications();
  }, [tabId, updateNotifications]);

  return {
    newNewsCount,
    hasNewNews: newNewsCount > 0,
    refreshNotifications,
  };
};
