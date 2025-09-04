import { useState, useEffect, useCallback } from 'react';

// Téma típusok - könnyen bővíthető
export type Theme = 'light' | 'dark' | 'pro-blue';

// Téma konfiguráció - minden új téma csak ide kell hozzáadni
export const THEMES: Record<Theme, { name: string; icon: string; description: string }> = {
  light: {
    name: 'Light',
    icon: '☀️',
    description: 'Classic light theme'
  },
  dark: {
    name: 'Dark', 
    icon: '🌙',
    description: 'Original dark mode'
  },
  'pro-blue': {
    name: 'Pro Blue',
    icon: '🟦',
    description: 'Modern blue theme'
  }
};

// Téma hook
export const useTheme = () => {
  // Alapértelmezett téma
  const [currentTheme, setCurrentTheme] = useState<Theme>('light');
  const [isInitialized, setIsInitialized] = useState(false);

  // Téma váltás függvény (architektúrálisan helyes megoldás)
  const changeTheme = useCallback((newTheme: Theme) => {
    if (newTheme === currentTheme) return;

    // Állapot frissítése - a DOM manipulációt a komponens végzi
    setCurrentTheme(newTheme);
    
    // localStorage mentés
    localStorage.setItem('selectedTheme', newTheme);
    
    console.log(`[useTheme] Téma váltva: ${newTheme}`);
  }, [currentTheme]);

  // Téma inicializálása (localStorage-ból)
  useEffect(() => {
    if (isInitialized) return;

    const savedTheme = localStorage.getItem('selectedTheme') as Theme;
    if (savedTheme && THEMES[savedTheme]) {
      changeTheme(savedTheme);
    }
    
    setIsInitialized(true);
  }, [changeTheme, isInitialized]);

  // Téma reset (vissza az alapértelmezettre)
  const resetTheme = useCallback(() => {
    changeTheme('light');
  }, [changeTheme]);

  // Következő téma (ciklikus váltás)
  const nextTheme = useCallback(() => {
    const themeKeys = Object.keys(THEMES) as Theme[];
    const currentIndex = themeKeys.indexOf(currentTheme);
    const nextIndex = (currentIndex + 1) % themeKeys.length;
    changeTheme(themeKeys[nextIndex]);
  }, [currentTheme, changeTheme]);

  // Előző téma (ciklikus váltás)
  const previousTheme = useCallback(() => {
    const themeKeys = Object.keys(THEMES) as Theme[];
    const currentIndex = themeKeys.indexOf(currentTheme);
    const previousIndex = currentIndex === 0 ? themeKeys.length - 1 : currentIndex - 1;
    changeTheme(themeKeys[previousIndex]);
  }, [currentTheme, changeTheme]);

  // Téma információk
  const currentThemeInfo = THEMES[currentTheme];
  const availableThemes = Object.entries(THEMES).map(([key, info]) => ({
    id: key as Theme,
    ...info
  }));

  return {
    // Állapot
    currentTheme,
    currentThemeInfo,
    availableThemes,
    isInitialized,
    
    // Műveletek
    changeTheme,
    resetTheme,
    nextTheme,
    previousTheme,
    
    // Segédfüggvények
    isLight: currentTheme === 'light',
    isDark: currentTheme === 'dark',
    isProBlue: currentTheme === 'pro-blue'
  };
};
