// A szoftver-fejlesztésben fontos alapelv
// a YAGNI (You Aren't Gonna Need It)
//  - ne vezess be komplexitást
//  , amíg nincs rá valódi igény.

// src\components\LocalNews\location\LocationProvider.ts

// Fő helymeghatározási szolgáltatás
import { LocationData, LocationStrategy } from './types';
import { BrowserStrategy, GeoLocationStrategy, ManualStrategy } from './strategies';
import { locationStore } from './LocationStore';
//import { clearAllTabCache } from '../../../hooks/useTabStorage';

import { clearAllTabCache } from '../../../hooks/useTabStorage/useTabStorage';
/**
 * Kiterjesztett interfész az inicializálható stratégiákhoz
 */
interface InitializableStrategy extends LocationStrategy {
  initialize(): Promise<void>;
}

/**
 * Típusellenőrző függvény annak eldöntésére, hogy egy stratégia inicializálható-e
 */
function isInitializable(strategy: LocationStrategy): strategy is InitializableStrategy {
  return 'initialize' in strategy && typeof strategy['initialize'] === 'function';
}

/**
 * A helymeghatározási rendszer központi szolgáltatása.
 * Különböző stratégiák segítségével határozza meg a felhasználó helyét.
 */
class LocationProvider {
  private strategies: LocationStrategy[] = [];
  private initialized = false;

  constructor() {
    // Stratégiák prioritási sorrendben
    this.strategies = [
      new ManualStrategy(), // 1. Felhasználói beállítás (legmegbízhatóbb)
      new GeoLocationStrategy(), // 2. GPS/geolokáció
      new BrowserStrategy(), // 3. Böngészőnyelv (legkevésbé megbízható)
    ];
  }

  /**
   * Inicializálja az összes stratégiát
   */
  async initialize(): Promise<void> {
    if (this.initialized) return;

    // Első a ManualStrategy inicializálása - típusbiztos megközelítés
    const manualStrategy = this.strategies.find((s) => s instanceof ManualStrategy);
    if (manualStrategy && 'initialize' in manualStrategy) {
      await (manualStrategy as InitializableStrategy).initialize();
    } else {
      console.warn('[LocationProvider] Nem található ManualStrategy a stratégiák között!');
    }

    // Ha nincs URL paraméter, inicializáljuk a többi stratégiát is
    for (const strategy of this.strategies) {
      // JAVÍTVA: Típusbiztos ellenőrzés az any használata helyett
      if (!(strategy instanceof ManualStrategy) && isInitializable(strategy)) {
        try {
          await strategy.initialize();
        } catch (error) {
          console.error(
            `[LocationProvider] Hiba a(z) ${strategy.getName()} stratégia inicializálásakor:`,
            error,
          );
        }
      }
    }

    this.initialized = true;
    console.log('[LocationProvider] Inicializálás kész');
  }

  /**
   * Helymeghatározás a beállított stratégiák alapján
   * @returns A meghatározott hely adatai
   */
  public async getLocation(): Promise<LocationData> {
    await this.initialize();

    // Csak az aktív módot próbáljuk
    const mode = localStorage.getItem('newsx_location_mode') || 'manual';
    let location: LocationData | null = null;
    if (mode === 'manual') {
      const manualStrategy = this.strategies.find(s => s.getName && s.getName() === 'manual');
      if (manualStrategy) location = await manualStrategy.getLocation();
    } else if (mode === 'geo') {
      const geoStrategy = this.strategies.find(s => s.getName && s.getName() === 'gps');
      if (geoStrategy) location = await geoStrategy.getLocation();
    } else if (mode === 'browser') {
      const browserStrategy = this.strategies.find(s => s.getName && s.getName() === 'browser');
      if (browserStrategy) location = await browserStrategy.getLocation();
    }
    if (location) {
      locationStore.setLocation(location);
      return location;
    }
    // Fallback, ha semmi nem sikerült
    console.warn('[LocationProvider] Nem sikerült helyet meghatározni az aktív móddal, fallback...');
    const fallbackLocation: LocationData = {
      country: 'International',
      countryCode: 'INT',
      city: undefined,
      confidence: 0.1,
      source: 'fallback',
      timestamp: Date.now(),
    };
    locationStore.setLocation(fallbackLocation);
    return fallbackLocation;
  }

  /**
   * GPS alapú helymeghatározás beállítása
   * @param highAccuracy Magas pontosságú helymeghatározás használata
   * @returns Sikeres volt-e a beállítás
   */
  public async setGeoLocation(highAccuracy: boolean = true): Promise<boolean> {
    // Inicializálás, ha még nem történt meg
    await this.initialize();

    console.log(`[LocationProvider] GPS helymeghatározás indítása (highAccuracy: ${highAccuracy})`);

    try {
      // 1. GPS koordináták lekérése
      const coords = await this.requestGeolocation(highAccuracy);
      if (!coords) {
        console.error('[LocationProvider] GPS koordináták lekérése sikertelen');
        return false;
      }

      // 2. Koordináták konvertálása ország/város adatokká
      const locationData = await this.reverseGeocode(coords.latitude, coords.longitude);
      if (!locationData) {
        console.error('[LocationProvider] Reverse geocoding sikertelen');
        return false;
      }

      // 3. Helyadatok mentése
      const location: LocationData = {
        ...locationData,
        source: 'gps',
        confidence: 0.9,
        timestamp: Date.now(),
        latitude: coords.latitude,
        longitude: coords.longitude,
      };

      // 4. Cache frissítése
      locationStore.setLocation(location);
      console.log(
        `[LocationProvider] GPS helymeghatározás sikeres: ${location.country} ${location.city || ''}`,
      );

      // 5. A higAccuracy beállítás mentése
      localStorage.setItem('newsx_geo_high_accuracy', highAccuracy.toString());

      return true;
    } catch (error) {
      console.error('[LocationProvider] GPS helymeghatározási hiba:', error);
      return false;
    }
  }

  /**
   * Böngésző nyelve alapján történő helymeghatározás beállítása
   */
  public async setBrowserLanguageLocation(): Promise<boolean> {
    try {
      // BrowserStrategy azonosítása és használata
      const browserStrategy = this.strategies.find((s) => s instanceof BrowserStrategy);

      if (!browserStrategy) {
        console.error('[LocationProvider] Nem található BrowserStrategy');
        return false;
      }

      // Helyadatok lekérése a böngésző nyelvéből
      const location = await browserStrategy.getLocation();

      if (!location) {
        console.error('[LocationProvider] Nem sikerült helyet meghatározni a böngésző nyelvéből');
        return false;
      }

      // Helyadatok tárolása
      locationStore.setLocation(location);
      console.log(`[LocationProvider] Böngésző nyelv alapú helymeghatározás: ${location.country}`);

      return true;
    } catch (error) {
      console.error(
        '[LocationProvider] Hiba a böngésző nyelv alapú helymeghatározás során:',
        error,
      );
      return false;
    }
  }

  /**
   * GPS koordináták lekérése a böngésző Geolocation API-jával
   * @param highAccuracy Magas pontosság használata
   * @returns A koordináták objektum vagy null hiba esetén
   * @private
   */
  private async requestGeolocation(
    highAccuracy: boolean,
  ): Promise<{ latitude: number; longitude: number } | null> {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        console.error('[LocationProvider] Geolocation API nem támogatott ebben a böngészőben');
        reject(new Error('Geolocation not supported'));
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          resolve({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          });
        },
        (error) => {
          console.error('[LocationProvider] Geolocation hiba:', error.message);
          reject(error);
        },
        {
          enableHighAccuracy: highAccuracy,
          timeout: 10000,
          maximumAge: 0,
        },
      );
    });
  }

  /**
   * Koordináták konvertálása ország és város adatokká
   * @param latitude Szélesség
   * @param longitude Hosszúság
   * @returns Helyadatok objektum vagy null hiba esetén
   * @private
   */
  private async reverseGeocode(
    latitude: number,
    longitude: number,
  ): Promise<{ country: string; countryCode: string; city?: string } | null> {
    try {
      // Reverse Geocoding API hívás
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=10`,
      );

      if (!response.ok) {
        throw new Error(`API hiba: ${response.status}`);
      }

      const data = await response.json();

      // Ha nincs érvényes helyadat, visszatérés null-lal
      if (!data.address || !data.address.country || !data.address.country_code) {
        console.error('[LocationProvider] Hiányos geocoding válasz:', data);
        return null;
      }

      return {
        country: data.address.country,
        countryCode: data.address.country_code.toUpperCase(),
        city: data.address.city || data.address.town || data.address.village,
      };
    } catch (error) {
      console.error('[LocationProvider] Reverse geocoding hiba:', error);
      return null;
    }
  }

  // A többi metódus változatlanul marad...
  /**
   * Helyadatok frissítése
   */
  public async refreshLocation(): Promise<LocationData> {
    console.log('[LocationProvider] Helyadatok frissítése...');

    // Cache törlése
    locationStore.clearCache();

    return this.getLocation();
  }

  /**
   * Felhasználói helybeállítás
   */
  public async setManualLocation(
    country: string,
    countryCode: string,
    city?: string,
  ): Promise<boolean> {
    // Inicializálás, ha még nem történt meg
    await this.initialize();

    console.log(`[LocationProvider] Manuális helymeghatározás: ${country} (${countryCode})`);

    // Először próbáljuk a szervert értesíteni
    try {
      const response = await fetch('/api/local/location', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ country, countryCode, city }),
      });

      if (response.ok) {
        console.log('[LocationProvider] Helyadatok beállítva a szerveren is');
      }
    } catch (error) {
      console.warn('[LocationProvider] Nem sikerült a szervert értesíteni:', error);
    }

    // Manuális stratégia keresése
    const manualStrategy = this.strategies.find((s) => s instanceof ManualStrategy) as
      | ManualStrategy
      | undefined;

    if (manualStrategy) {
      const success = await manualStrategy.setLocation(country, countryCode, city);

      if (success) {
        console.log('[LocationProvider] Manuális helymeghatározás sikeres');

        // ✅ ÚJ: Tab cache törlése ország váltáskor
        clearAllTabCache();

        // Cache frissítése
        const location = await manualStrategy.getLocation();
        if (location) {
          locationStore.setLocation(location);
        }
      }

      return success;
    }

    console.error('[LocationProvider] Nem található ManualStrategy');
    return false;
  }

  /**
   * Felhasználói helybeállítás törlése
   */
  public async clearManualLocation(): Promise<boolean> {
    // Szerver értesítése
    try {
      await fetch('/api/local/location', {
        method: 'DELETE',
      });
      console.log('[LocationProvider] Helybeállítás törölve a szerveren');
    } catch (error) {
      console.warn('[LocationProvider] Nem sikerült a szervert értesíteni a törlésről:', error);
    }

    const manualStrategy = this.strategies.find((s) => s instanceof ManualStrategy) as
      | ManualStrategy
      | undefined;

    if (manualStrategy) {
      const success = await manualStrategy.clearLocation();

      if (success) {
        // Cache törlése és új hely meghatározása a többi stratégia alapján
        locationStore.clearCache();
        await this.getLocation();
      }

      return success;
    }

    return false;
  }

  /**
   * Korábbi helykiválasztások lekérése
   */
  public getLocationHistory(): Array<{ country: string; countryCode: string; city?: string }> {
    const manualStrategy = this.strategies.find((s) => s instanceof ManualStrategy) as
      | ManualStrategy
      | undefined;

    if (manualStrategy) {
      return manualStrategy.getLocationHistory();
    }

    return [];
  }
}

// Exportáljuk a singleton példányt
export const locationProvider = new LocationProvider();
