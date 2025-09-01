import { LocationData, LocationStrategy } from '../../types';

/**
 * GPS koordináták alapján történő helymeghatározási stratégia.
 * A böngésző Geolocation API-ját használja, és reverse geocoding
 * segítségével határozza meg az országot.
 */
export class GeoLocationStrategy implements LocationStrategy {
  private static readonly CACHE_KEY = 'newsx_gps_location';
  private static readonly CACHE_TTL = 30 * 60 * 1000; // 30 perc
  private hasPermission: boolean | null = null;

  getName(): string {
    return 'gps';
  }

  async initialize(): Promise<void> {
    // Ellenőrizzük, hogy elérhető-e a geolokáció API
    if (!navigator.geolocation) {
      this.hasPermission = false;
      console.log('[GeoLocationStrategy] Geolocation API nem támogatott');
      return;
    }

    // Próbáljuk ellenőrizni az engedély állapotát
    try {
      const permission = await navigator.permissions.query({
        name: 'geolocation' as PermissionName,
      });
      this.hasPermission = permission.state === 'granted';

      console.log(`[GeoLocationStrategy] Geolocation engedély: ${permission.state}`);

      // Feliratkozás az engedély változásaira
      permission.addEventListener('change', () => {
        this.hasPermission = permission.state === 'granted';
        console.log(`[GeoLocationStrategy] Engedély változott: ${permission.state}`);
      });
    } catch (error) {
      // Régebbi böngészők nem támogatják a permissions API-t
      console.warn('[GeoLocationStrategy] Permissions API nem támogatott:', error);
      this.hasPermission = null;
    }
  }

  async getLocation(): Promise<LocationData | null> {
    // Ha tudjuk, hogy nincs engedély, nem is próbálkozunk
    if (this.hasPermission === false) {
      console.log('[GeoLocationStrategy] Nincs engedély a helymeghatározáshoz');
      return null;
    }

    // Ha nincs Geolocation API, nem tudunk helyet meghatározni
    if (!navigator.geolocation) {
      console.log('[GeoLocationStrategy] Geolocation API nem támogatott');
      return null;
    }

    try {
      // Először ellenőrizzük a cache-t
      const cachedLocation = this.getCachedLocation();
      if (cachedLocation) {
        console.log(`[GeoLocationStrategy] Cache találat: ${cachedLocation.country}`);
        return cachedLocation;
      }

      // Lekérjük a pozíciót
      console.log('[GeoLocationStrategy] Pozíció lekérése...');
      const position = await this.getCurrentPosition();
      if (!position) {
        console.log('[GeoLocationStrategy] Nem sikerült lekérni a pozíciót');
        return null;
      }

      const { latitude, longitude } = position.coords;
      console.log(`[GeoLocationStrategy] Pozíció: ${latitude}, ${longitude}`);

      // Reverse geocoding a koordinátákhoz
      const geocodeResult = await this.reverseGeocode(latitude, longitude);
      if (!geocodeResult) {
        console.log('[GeoLocationStrategy] A reverse geocoding sikertelen');
        return null;
      }

      // Létrehozzuk a LocationData objektumot
      const locationData: LocationData = {
        country: geocodeResult.country || 'Ismeretlen ország',
        countryCode: geocodeResult.countryCode || 'UN',
        city: geocodeResult.city,
        confidence: 0.85, // GPS alapú helymeghatározás magas megbízhatóságú
        source: 'gps',
        timestamp: Date.now(),
      };

      // Cache-eljük az eredményt
      this.cacheLocation(locationData);

      return locationData;
    } catch (error) {
      console.error('[GeoLocationStrategy] Hiba:', error);
      return null;
    }
  }

  /**
   * A böngésző geolocation API-jának Promise alapú wrappere
   */
  private getCurrentPosition(): Promise<GeolocationPosition | null> {
    return new Promise((resolve) => {
      navigator.geolocation.getCurrentPosition(
        (position) => resolve(position),
        (error) => {
          console.warn(`[GeoLocationStrategy] Geolocation hiba (${error.code}): ${error.message}`);
          resolve(null);
        },
        {
          enableHighAccuracy: false, // Akku kímélés
          timeout: 5000, // 5mp után feladjuk
          maximumAge: 600000, // 10 perc cache
        },
      );
    });
  }

  /**
   * Koordinátákból ország/város információ lekérése
   * Egyszerű, ingyenes API használatával
   */
  private async reverseGeocode(
    lat: number,
    lon: number,
  ): Promise<{
    country?: string;
    countryCode?: string;
    city?: string;
  } | null> {
    try {
      // Nominatim OpenStreetMap API - szabad felhasználású geocoding szolgáltatás
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json&accept-language=hu`,
        { headers: { 'User-Agent': 'NewsX/1.0' } }, // API követelmény
      );

      if (!response.ok) {
        throw new Error(`Hálózati hiba: ${response.status}`);
      }

      const data = await response.json();

      if (!data || !data.address) {
        return null;
      }

      return {
        country: data.address.country,
        countryCode: data.address.country_code?.toUpperCase(),
        city: data.address.city || data.address.town || data.address.village,
      };
    } catch (error) {
      console.error('[GeoLocationStrategy] Reverse geocoding hiba:', error);
      return null;
    }
  }

  /**
   * Helyadatok gyorsítótárazása localStorage-ban
   */
  private cacheLocation(location: LocationData): void {
    try {
      const cacheData = {
        location,
        timestamp: Date.now(),
      };
      localStorage.setItem(GeoLocationStrategy.CACHE_KEY, JSON.stringify(cacheData));
    } catch (error) {
      console.error('[GeoLocationStrategy] Cache hiba:', error);
    }
  }

  /**
   * Gyorsítótárazott helyadatok lekérése
   */
  private getCachedLocation(): LocationData | null {
    try {
      const cacheData = localStorage.getItem(GeoLocationStrategy.CACHE_KEY);
      if (!cacheData) return null;

      const parsedData = JSON.parse(cacheData);
      const now = Date.now();

      // Ellenőrizzük, hogy az adat nem túl régi-e
      if (now - parsedData.timestamp <= GeoLocationStrategy.CACHE_TTL) {
        return parsedData.location;
      }

      // Ha túl régi, töröljük a cache-t
      localStorage.removeItem(GeoLocationStrategy.CACHE_KEY);
      return null;
    } catch (error) {
      console.error('[GeoLocationStrategy] Cache olvasási hiba:', error);
      return null;
    }
  }
}
