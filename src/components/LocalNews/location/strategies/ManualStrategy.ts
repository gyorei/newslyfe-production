import { LocationData, LocationStrategy } from '../types';

/**
 * A felhasználó által expliciten beállított helyadatok kezelésére szolgáló stratégia.
 * Ez a legmagasabb prioritású stratégia, mivel egyértelmű felhasználói szándékot képvisel.
 */
export class ManualStrategy implements LocationStrategy {
  private static readonly STORAGE_KEY = 'newsx_manual_location';
  private static readonly HISTORY_KEY = 'newsx_location_history';
  private static readonly MAX_HISTORY_ITEMS = 5;

  private manualLocation: LocationData | null = null;

  getName(): string {
    return 'manual';
  }

  async initialize(): Promise<void> {
    try {
      // Lokális beállítás betöltése localStorage-ból
      const storedData = localStorage.getItem(ManualStrategy.STORAGE_KEY);
      if (storedData) {
        this.manualLocation = JSON.parse(storedData);
        console.log('[ManualStrategy] Betöltve a felhasználó által beállított hely');
      }
    } catch (error) {
      console.error('[ManualStrategy] Hiba a betöltéskor:', error);
    }
  }

  async getLocation(): Promise<LocationData | null> {
    return this.manualLocation;
  }

  /**
   * Beállítja a felhasználó által választott helyet
   * @param country Ország neve
   * @param countryCode Ország kódja
   * @param city Opcionális város név
   * @returns Sikeres volt-e a művelet
   */
  async setLocation(country: string, countryCode: string, city?: string): Promise<boolean> {
    try {
      this.manualLocation = {
        country,
        countryCode,
        city,
        confidence: 1.0, // Felhasználói választás = 100% megbízhatóság
        source: 'manual',
        timestamp: Date.now(),
      };

      // Tárolás localStorage-ban
      localStorage.setItem(ManualStrategy.STORAGE_KEY, JSON.stringify(this.manualLocation));

      // Korábbi választások mentése
      this.addToLocationHistory(country, countryCode, city);

      console.log(`[ManualStrategy] Hely beállítva: ${country} (${countryCode})`);
      return true;
    } catch (error) {
      console.error('[ManualStrategy] Hiba a beállításkor:', error);
      return false;
    }
  }

  /**
   * Törli a felhasználói helykiválasztást
   */
  async clearLocation(): Promise<boolean> {
    try {
      this.manualLocation = null;
      localStorage.removeItem(ManualStrategy.STORAGE_KEY);
      console.log('[ManualStrategy] Felhasználói helykiválasztás törölve');
      return true;
    } catch (error) {
      console.error('[ManualStrategy] Hiba a törléskor:', error);
      return false;
    }
  }

  /**
   * Lekéri a korábbi helykiválasztások listáját
   */
  getLocationHistory(): Array<{ country: string; countryCode: string; city?: string }> {
    try {
      const history = localStorage.getItem(ManualStrategy.HISTORY_KEY);
      return history ? JSON.parse(history) : [];
    } catch (error) {
      console.error('[ManualStrategy] Hiba az előzmények lekérésekor:', error);
      return [];
    }
  }

  /**
   * Előzményekhez adja az aktuális kiválasztást
   */
  private addToLocationHistory(country: string, countryCode: string, city?: string): void {
    try {
      const history = this.getLocationHistory();

      // Ellenőrizzük, hogy ez a hely már szerepel-e az előzményekben
      const existingIndex = history.findIndex((item) => item.countryCode === countryCode);

      if (existingIndex !== -1) {
        // Ha már létezik, töröljük a régi bejegyzést
        history.splice(existingIndex, 1);
      }

      // Hozzáadjuk az új elemet a lista elejéhez
      history.unshift({ country, countryCode, city });

      // Maximum MAX_HISTORY_ITEMS elemet tartunk meg
      const trimmedHistory = history.slice(0, ManualStrategy.MAX_HISTORY_ITEMS);

      // Mentjük az előzményeket
      localStorage.setItem(ManualStrategy.HISTORY_KEY, JSON.stringify(trimmedHistory));
    } catch (error) {
      console.error('[ManualStrategy] Hiba az előzmények mentésekor:', error);
    }
  }
}
