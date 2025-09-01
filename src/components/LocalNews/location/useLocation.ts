// src\components\LocalNews\location\useLocation.ts

import { useState, useEffect } from 'react';
import { locationProvider } from './LocationProvider';
import { locationStore } from './LocationStore';
import type { LocationData } from './types';

/**
 * React hook a helymeghatározási rendszer használatához
 * @param autoFetch Automatikusan lekérdezi a helyadatokat a komponens betöltésekor
 * @returns Helyadatok, állapotok és műveletek
 */
export function useLocation(autoFetch: boolean = true) {
  const [location, setLocation] = useState<LocationData | null>(null);
  const [loading, setLoading] = useState<boolean>(autoFetch);
  const [error, setError] = useState<Error | null>(null);

  // Helyadatok lekérdezése
  const fetchLocation = async () => {
    try {
      setLoading(true);
      setError(null);
      let data = locationStore.getLocation();
      if (!data) {
        console.log('[useLocation] Nincs cache, a provider hívása szükséges...');
        data = await locationProvider.getLocation();
      } else {
        console.log('[useLocation] Cache találat, a provider hívása kihagyva.');
      }
      setLocation(data);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Ismeretlen hiba történt'));
      console.error('Hiba a helyadatok lekérdezésekor:', err);
    } finally {
      setLoading(false);
    }
  };

  // Manuális helybeállítás
  const setManualLocation = async (country: string, countryCode: string, city?: string) => {
    try {
      setLoading(true);
      const success = await locationProvider.setManualLocation(country, countryCode, city);
      if (success) {
        await fetchLocation();
      }
      return success;
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Hiba a manuális hely beállításakor'));
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Manuális hely törlése
  const clearManualLocation = async () => {
    try {
      setLoading(true);
      const success = await locationProvider.clearManualLocation();
      if (success) {
        await fetchLocation();
      }
      return success;
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Hiba a manuális hely törlésekor'));
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Helyadatok frissítése
  const refreshLocation = async () => {
    try {
      setLoading(true);
      const data = await locationProvider.refreshLocation();
      setLocation(data);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Hiba a helyadatok frissítésekor'));
    } finally {
      setLoading(false);
    }
  };

  // Automatikus adatlekérés a komponens betöltésekor
  useEffect(() => {
    if (autoFetch) {
      fetchLocation();
    }
  }, [autoFetch]);

  return {
    location,
    loading,
    error,
    fetchLocation,
    setManualLocation,
    clearManualLocation,
    refreshLocation,
    getLocationHistory: locationProvider.getLocationHistory,
  };
}
