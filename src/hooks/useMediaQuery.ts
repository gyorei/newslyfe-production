import { useState, useEffect, useCallback } from 'react';

/*
 * useMediaQuery.ts
 *
 * REACT HOOK CSS MEDIA QUERY FIGYELÉSHEZ
 * --------------------------------------
 * Ez a hook lehetővé teszi, hogy egy komponens figyelje, teljesül-e egy adott CSS media query (pl. '(max-width: 768px)').
 * Automatikusan frissíti a state-et, ha a media query állapota változik (pl. ablakméret, dark mode, stb.).
 *
 * Főbb használati helyek:
 *  - ResizableLayout.tsx (reszponzív panelek, mobil nézet detektálás)
 *  - useAppPanels.ts (panel állapotok mobil nézethez)
 *  - Panel.tsx (közvetve, pl. reszponzív UI)
 *
 * Hasznos minden reszponzív, adaptív React UI-hoz.
 */
/**
 * Hook a CSS média lekérdezések állapotának figyelésére.
 * @param query A média lekérdezés string (pl. '(max-width: 768px)').
 * @returns `true`, ha a lekérdezés megfelel, egyébként `false`.
 */
export function useMediaQuery(query: string): boolean {
  const getMatches = useCallback((query: string): boolean => {
    // Biztosítja, hogy csak kliens oldalon fusson
    if (typeof window !== 'undefined') {
      return window.matchMedia(query).matches;
    }
    return false;
  }, []);

  const [matches, setMatches] = useState<boolean>(() => getMatches(query));

  useEffect(() => {
    const matchMedia = window.matchMedia(query);

    const handleChange = () => {
      setMatches(getMatches(query));
    };

    // Kezdeti állapot beállítása kliens oldalon
    handleChange();

    // Figyeljük a változásokat
    matchMedia.addEventListener('change', handleChange);

    return () => {
      matchMedia.removeEventListener('change', handleChange);
    };
  }, [query, getMatches]);

  return matches;
}
