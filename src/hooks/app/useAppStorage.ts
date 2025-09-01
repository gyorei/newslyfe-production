import { useState, useEffect } from 'react';
// import { storageManager } from '../../storage/storageManager'; // Régi import
import { DataManager } from '../../utils/datamanager/manager'; // Új import
// import { AppState } from '../../storage/types/storage'; // Importáljuk a megfelelő típust

/**
 * Hook a perzisztencia réteg (storageManager) inicializálásának kezelésére.
 * Felelős a storage inicializálásáért és az állapot (inicializált, hiba) követéséért.
 *
 * OPTIMALIZÁLT: Csak akkor logol, ha tényleg inicializálásra kerül sor.
 */
export function useAppStorage() {
  // Állapotok áthelyezve az App.tsx-ből
  const [storageInitialized, setStorageInitialized] = useState(false);
  const [storageError, setStorageError] = useState<Error | null>(null);
  // Opcionálisan itt tárolhatnánk a betöltött kezdeti állapotot is, ha szükséges
  // const [initialState, setInitialState] = useState<AppState | null>(null);

  // Storage inicializációs hook (áthelyezve az App.tsx-ből)
  useEffect(() => {
    let isMounted = true; // Komponens mount állapotának követése

    const initializeStorage = async () => {
      try {
        // ✅ JAVÍTÁS: Csak akkor logol, ha tényleg fut az inicializálás
        // A DataManager.initialize() belül ellenőrzi az isInitialized flag-et

        // await storageManager.initialize(); // Régi hívás
        await DataManager.getInstance().initialize(); // Új hívás - ez már tartalmazza a duplikáció-védelemet

        // Opcionális: Kezdeti állapot betöltése itt, ha a hooknak kell visszaadnia
        // const storedState = await DataManager.getInstance().getLocalStorageAdapter().loadLocalState(); // Példa új hívásra
        // if (isMounted && storedState) {
        //   console.log('[useAppStorage] Perzisztált állapot betöltve:', storedState);
        //   setInitialState(storedState);
        // }

        if (isMounted) {
          setStorageInitialized(true);
          console.log('[useAppStorage] Perzisztencia réteg sikeresen inicializálva');
        }
      } catch (error) {
        console.error(
          '[useAppStorage] Hiba történt a perzisztencia réteg inicializálásakor:',
          error,
        );
        if (isMounted) {
          setStorageError(error as Error);
        }
      }
    };

    // Storage inicializálás indítása
    initializeStorage();

    // Cleanup funkció: megakadályozza az állapotfrissítést unmount után
    return () => {
      isMounted = false;
    };
  }, []); // Csak mount-kor fut le

  // Visszaadjuk az inicializálási állapotot és a hibát
  return {
    storageInitialized,
    storageError,
    // initialState, // Opcionálisan visszaadható, ha itt töltjük be
  };
}
