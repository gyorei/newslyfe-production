/*
 * useLocalStorage.ts
 *
 * REACT HOOK LOCALSTORAGE SZINKRONIZÁLÁSHOZ
 * ----------------------------------------
 * Ez a hook lehetővé teszi, hogy egy komponens vagy hook egyszerűen és biztonságosan olvasson/írjon értékeket a böngésző localStorage-ába,
 * miközben a React state-tel is szinkronban tartja az adatot.
 *
 * Főbb funkciók:
 *  - [érték, setter] API, mint a useState-nél
 *  - Automatikus szinkronizáció a localStorage és a React state között
 *  - Cross-tab frissítés: ha másik böngészőfülben változik az érték, itt is frissül
 *  - Hibakezelés: sérült/érvénytelen adat automatikus törlése, fallback az alapértelmezettre
 *
 * Főbb használati helyek:
 *  - Settings.tsx (aktív beállítási kategória megőrzése)
 *  - StartupSettings.tsx (indítási mód és oldalak tárolása)
 *  - useAppSettings.ts (téma, görgetősáv beállítás)
 *
 * Hasznos minden tartós, felhasználóhoz kötött beállítás mentéséhez.
 */
import { useState, useEffect } from 'react';

/**
 * Hook a localStorage értékek kezeléséhez
 * @param key A localStorage kulcs
 * @param initialValue Az alapértelmezett érték, ha nincs mentett adat vagy hiba van
 * @returns [érték, setter]
 */
export function useLocalStorage<T>(
  key: string,
  initialValue: T,
): [T, (value: T | ((val: T) => T)) => void] {
  const [storedValue, setStoredValue] = useState<T>(() => {
    if (typeof window === 'undefined') {
      return initialValue;
    }
    try {
      const item = window.localStorage.getItem(key);
      if (!item) return initialValue;
      return JSON.parse(item) as T;
    } catch (error) {
      console.error(`Hiba a localStorage olvasásakor (${key}):`, error);
      // Ha invalid JSON-t találtunk, töröljük a hibás bejegyzést
      try {
        window.localStorage.removeItem(key);
      } catch (removeError) {
        console.warn(`localStorage kulcs törlése sikertelen (${key}):`, removeError);
      }
      return initialValue;
    }
  });

  const setValue = (value: T | ((val: T) => T)) => {
    try {
      const valueToStore = value instanceof Function ? value(storedValue) : value;
      setStoredValue(valueToStore);
      if (typeof window !== 'undefined') {
        window.localStorage.setItem(key, JSON.stringify(valueToStore));
      }
    } catch (error) {
      console.error(`Hiba a localStorage írásakor (${key}):`, error);
    }
  };

  useEffect(() => {
    const handleStorageChange = (event: StorageEvent) => {
      if (event.key !== key) return;
      const { newValue } = event;
      if (newValue == null) {
        setStoredValue(initialValue);
        return;
      }
      try {
        setStoredValue(JSON.parse(newValue));
      } catch (error) {
        console.error(`Hiba a localStorage változás feldolgozásakor (${key}):`, error);
        // érvénytelen adat esetén töröljük és reseteljük
        try {
          window.localStorage.removeItem(key);
        } catch (removeError) {
          console.warn(`localStorage kulcs törlése sikertelen (${key}):`, removeError);
        }
        setStoredValue(initialValue);
      }
    };
    window.addEventListener('storage', handleStorageChange);
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [key, initialValue]);

  return [storedValue, setValue];
}
