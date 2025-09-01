import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { GeoLocationStrategy } from './GeoLocationStrategy';
import { LocationData, LocationStrategy } from '../../types';
import styles from './GeoLocation.module.css';

interface GeoLocationPromptProps {
  onSuccess?: (location: LocationData) => void;
  onError?: (error: Error) => void;
  onCancel?: () => void;
  strategy?: LocationStrategy;
  showOnSuccess?: boolean;
  className?: string;
}

interface PromptState {
  permissionState: 'unknown' | 'prompt' | 'granted' | 'denied';
  isLoading: boolean;
  error: string | null;
  location: LocationData | null;
}

/**
 * Geolokációs engedélyt kérő és helymeghatározást kezelő komponens
 *
 * Ez a komponens a felhasználótól kér engedélyt a helymeghatározásra,
 * és megjeleníti a helymeghatározás állapotát és eredményét.
 */
export const GeoLocationPrompt: React.FC<GeoLocationPromptProps> = ({
  onSuccess,
  onError,
  onCancel,
  strategy,
  showOnSuccess = false,
  className,
}) => {
  // Állapot inicializálása
  const [state, setState] = useState<PromptState>({
    permissionState: 'unknown',
    isLoading: false,
    error: null,
    location: null,
  });

  // Referencia a permissionState-re, hogy elkerüljük a felesleges újrarenderelést
  const permissionStateRef = useRef(state.permissionState);

  // Saját stratégia létrehozása, ha nincs megadva - useMemo-ba csomagolva
  const locationStrategy = useMemo(() => strategy || new GeoLocationStrategy(), [strategy]);

  // Helymeghatározás indítása - useCallback-be csomagolva
  const startLocationDetection = useCallback(async () => {
    setState((prev) => ({ ...prev, isLoading: true, error: null }));
    try {
      const location = await locationStrategy.getLocation();
      if (location) {
        setState((prev) => ({
          ...prev,
          isLoading: false,
          location,
          permissionState: 'granted',
        }));
        onSuccess?.(location);
      } else {
        throw new Error('Nem sikerült meghatározni a helyadatokat');
      }
    } catch (error) {
      setState((prev) => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Ismeretlen hiba',
      }));
      onError?.(error instanceof Error ? error : new Error('Ismeretlen hiba'));
    }
  }, [locationStrategy, onSuccess, onError]);

  // Komponens betöltésekor ellenőrizzük az engedélyeket és inicializáljuk a stratégiát
  useEffect(() => {
    const checkPermission = async () => {
      try {
        // Ellenőrizzük az engedély állapotát, ha elérhető a Permissions API
        if (navigator.permissions && navigator.permissions.query) {
          const result = await navigator.permissions.query({
            name: 'geolocation' as PermissionName,
          });
          setState((prev) => ({
            ...prev,
            permissionState: result.state as 'prompt' | 'granted' | 'denied',
          }));

          // Frissítsük a ref értékét is
          permissionStateRef.current = result.state as 'prompt' | 'granted' | 'denied';

          // Eseménykezelő hozzáadása az engedély állapotának változásához
          result.addEventListener('change', () => {
            setState((prev) => ({
              ...prev,
              permissionState: result.state as 'prompt' | 'granted' | 'denied',
            }));
            permissionStateRef.current = result.state as 'prompt' | 'granted' | 'denied';
          });
        }

        // Inicializáljuk a stratégiát (opcionális láncolással)
        if (typeof locationStrategy.initialize === 'function') {
          await locationStrategy.initialize();
        }

        // Ha már van engedély, és a showOnSuccess true, akkor rögtön elindítjuk a helymeghatározást
        if (permissionStateRef.current === 'granted' && showOnSuccess) {
          startLocationDetection();
        }
      } catch (error) {
        console.error('Hiba az engedélyek ellenőrzésekor:', error);
      }
    };

    checkPermission();
  }, [locationStrategy, showOnSuccess, startLocationDetection]);

  // Engedély kérésének elutasítása
  const handleCancel = () => {
    onCancel?.();
  };

  // Hiba esetén újrapróbálás
  const handleRetry = () => {
    startLocationDetection();
  };

  // Különböző állapotok megjelenítése
  const renderContent = () => {
    // Betöltés állapot
    if (state.isLoading) {
      return (
        <div className={styles.loadingState}>
          <div className={styles.spinner}></div>
          <p className={styles.loadingText}>Helymeghatározás folyamatban...</p>
          <p className={styles.loadingSubtext}>Ez csak néhány másodpercet vehet igénybe</p>
        </div>
      );
    }

    // Hiba állapot
    if (state.error) {
      return (
        <div className={styles.errorState}>
          <div className={styles.errorIcon}>⚠️</div>
          <h3 className={styles.title}>Helymeghatározási hiba</h3>
          <p className={styles.errorMessage}>{state.error}</p>
          <div className={styles.buttonGroup}>
            <button className={styles.primaryButton} onClick={handleRetry}>
              Újrapróbálás
            </button>
            <button className={styles.secondaryButton} onClick={handleCancel}>
              Mégsem
            </button>
          </div>
        </div>
      );
    }

    // Sikeres helymeghatározás
    if (state.location && showOnSuccess) {
      return (
        <div className={styles.successState}>
          <div className={styles.successIcon}>✓</div>
          <h3 className={styles.title}>Helymeghatározás sikeres</h3>
          <div className={styles.locationInfo}>
            <p>
              <strong>Ország:</strong> {state.location.country}
            </p>
            {state.location.city && (
              <p>
                <strong>Város:</strong> {state.location.city}
              </p>
            )}
          </div>
          <button className={styles.secondaryButton} onClick={handleCancel}>
            Bezárás
          </button>
        </div>
      );
    }

    // Engedélykérő állapot (alapértelmezett)
    return (
      <div className={styles.promptState}>
        <h3 className={styles.title}>Pontosabb hírajánlatok</h3>
        <p className={styles.description}>
          Pontos helymeghatározás használatával relevánsabb híreket tudunk mutatni az Ön számára.
        </p>
        <div className={styles.locationIcon}>📍</div>
        <div className={styles.buttonGroup}>
          <button className={styles.primaryButton} onClick={startLocationDetection}>
            Engedélyezem
          </button>
          <button className={styles.secondaryButton} onClick={handleCancel}>
            Most nem
          </button>
        </div>
        <p className={styles.privacyNote}>
          Helyadatait kizárólag a releváns hírek megjelenítésére használjuk, és nem tároljuk a
          szervereinken.
        </p>
      </div>
    );
  };

  return <div className={`${styles.geoPrompt} ${className || ''}`}>{renderContent()}</div>;
};

export default GeoLocationPrompt;
