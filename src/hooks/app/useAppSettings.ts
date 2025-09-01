import { useCallback } from 'react';
import { useStorage } from '../useStorage';
import { useLocalStorage } from '../useLocalStorage'; // ✅ ÚJ: useLocalStorage hook import

interface UseAppSettingsProps {
  storageInitialized: boolean;
}

/**
 * Hook az általános alkalmazás beállítások (téma, görgetősáv) kezelésére és perzisztálására.
 * ✅ JAVÍTVA: useLocalStorage hook használata a direkt localStorage hívások helyett
 */
export function useAppSettings({ storageInitialized }: UseAppSettingsProps) {
  const { updateTabState } = useStorage();

  // ✅ ÚJ: useLocalStorage hook használata direkt localStorage helyett
  const [theme, setTheme] = useLocalStorage<'light' | 'dark'>('theme', 'light');
  const [showScrollbars, setShowScrollbars] = useLocalStorage<boolean>('showScrollbars', true);

  // ✅ EGYSZERŰSÍTETT: Téma váltó függvény
  const toggleTheme = useCallback(() => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);

    // Perzisztencia réteg frissítése, csak ha már inicializálva van
    if (storageInitialized) {
      updateTabState('tabs', {
        activeId: 'default',
        definitions: [],
      }).catch((err: Error) => console.error('Téma perzisztálás hiba:', err));
    }
  }, [theme, setTheme, storageInitialized, updateTabState]);

  // ✅ EGYSZERŰSÍTETT: Görgetősáv váltó függvény
  const toggleScrollbars = useCallback(() => {
    setShowScrollbars((prev) => !prev);
  }, [setShowScrollbars]);

  // Visszaadjuk az állapotokat és a váltó függvényeket
  return {
    theme,
    toggleTheme,
    showScrollbars,
    toggleScrollbars,
  };
}
