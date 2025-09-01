// src\components\LocalNews\location\LocationStore.ts
import { LocationData } from './types';

/**
 * Helyinformációk tárolása és kezelése
 * Ez az osztály felelős a helyadatok cache-eléséért és perzisztálásáért.
 */
class LocationStore {
  private static readonly STORAGE_KEY = 'newsx_location_data';
  private static readonly TTL = 24 * 60 * 60 * 1000; // 24 óra

  private currentLocation: LocationData | null = null;
  private timestamp = 0;

  /**
   * Az aktuális helyinformációk lekérése
   * Először a memória cache-t ellenőrzi, majd a localStorage-t
   * @returns A tárolt helyadatok vagy null, ha nincs vagy lejárt
   */
  public getLocation(): LocationData | null {
    const now = Date.now();

    // Memória cache ellenőrzése
    if (this.currentLocation && now - this.timestamp < LocationStore.TTL) {
      console.log('[LocationStore] Memória cache találat');
      return this.currentLocation;
    }

    // LocalStorage ellenőrzése
    try {
      const storedData = localStorage.getItem(LocationStore.STORAGE_KEY);
      if (storedData) {
        const parsedData = JSON.parse(storedData);
        if (parsedData && parsedData.timestamp && now - parsedData.timestamp < LocationStore.TTL) {
          this.currentLocation = parsedData.location;
          this.timestamp = parsedData.timestamp;
          console.log('[LocationStore] LocalStorage cache találat');
          return this.currentLocation;
        } else {
          console.log('[LocationStore] Lejárt cache találat, törlés');
          this.clearCache();
        }
      }
    } catch (error) {
      console.error('[LocationStore] Hiba a tárolt helyadatok kezelésekor:', error);
    }

    return null;
  }

  /**
   * Helyinformációk tárolása memóriában és localStorage-ben
   * @param location A tárolandó helyadatok
   */
  public setLocation(location: LocationData): void {
    if (!location) return;

    // Időbélyeg hozzáadása, ha még nincs
    if (!location.timestamp) {
      location.timestamp = Date.now();
    }

    this.currentLocation = location;
    this.timestamp = location.timestamp;

    try {
      localStorage.setItem(
        LocationStore.STORAGE_KEY,
        JSON.stringify({
          location: this.currentLocation,
          timestamp: this.timestamp,
        }),
      );
      console.log(
        `[LocationStore] Helyadatok tárolva: ${location.country} (${location.countryCode})`,
      );
    } catch (error) {
      console.error('[LocationStore] Hiba a helyadatok tárolása közben:', error);
    }
  }

  /**
   * Az összes tárolt helyadat törlése
   */
  public clearCache(): void {
    this.currentLocation = null;
    this.timestamp = 0;

    try {
      localStorage.removeItem(LocationStore.STORAGE_KEY);
      console.log('[LocationStore] Helyadatok cache törölve');
    } catch (error) {
      console.error('[LocationStore] Hiba a helyadatok törlése közben:', error);
    }
  }

  /**
   * Ellenőrzi, hogy van-e érvényes cache
   */
  public hasValidCache(): boolean {
    const now = Date.now();

    if (this.currentLocation && now - this.timestamp < LocationStore.TTL) {
      return true;
    }

    try {
      const storedData = localStorage.getItem(LocationStore.STORAGE_KEY);
      if (storedData) {
        const parsedData = JSON.parse(storedData);
        return !!(
          parsedData &&
          parsedData.timestamp &&
          now - parsedData.timestamp < LocationStore.TTL
        );
      }
    } catch (error) {
      // Hiba esetén nincs érvényes cache
    }

    return false;
  }

  /**
   * Az aktuális cache frissítési idejének lekérése
   * @returns A cache utolsó frissítésének időbélyege vagy 0, ha nincs cache
   */
  public getLastUpdateTimestamp(): number {
    return this.timestamp;
  }
}

// Singleton példány exportálása
export const locationStore = new LocationStore();
