
/**
 * @file SearchFiltersBridge.ts
 * @description Kommunikációs híd (Bridge) a keresési szűrők állapotának és opcióinak kezelésére.
 *
 * Ez a modul egy központi eseménykezelőt (pub/sub) valósít meg, amely kétirányú
 * kommunikációt tesz lehetővé a TabPanel és a SearchFilters komponensek között, anélkül,
 * hogy közvetlen függőség alakulna ki közöttük.
 *
 * Két fő üzenettípust kezel:
 * 1. OPTIONS_INIT: A TabPanel küldi egyszer, egy új keresés után, hogy inicializálja
 *    a SearchFilters panelt a releváns ország opciókkal.
 * 2. FILTER_CHANGE: A SearchFilters küldi minden alkalommal, amikor a felhasználó
 *    módosítja a szűrőfeltételeket (pl. ki/be kapcsol egy országot). Ezt az eseményt
 *    a TabPanel hallgatja, hogy kliens oldalon, API hívás nélkül frissítse a találati listát.
 */

// Új fájl: src\components\Utility\Settings\SearchFilters\SearchFiltersBridge.ts

import { SearchFilters } from '../../../../hooks/useSearchFilters';
// ÚJ IMPORT: CountryTagOption típus
import { CountryTagOption } from './CountryFilter/CountryTagFilter';

// ÚJ: BridgeMessage típus - JAVÍTOTT VERZIÓ
export type BridgeMessage =
  | { type: 'FILTER_CHANGE'; filters: SearchFilters }
  | { type: 'OPTIONS_INIT'; countryOptions: CountryTagOption[] }; // ← JAVÍTVA: CountryTagOption[]

type BridgeCallback = (message: BridgeMessage) => void;

class SearchFiltersBridge {
  private listeners: BridgeCallback[] = [];
  // Hozzáadtam debug logging támogatását fejlesztési módban
  private debugMode: boolean = process.env.NODE_ENV === 'development';

  public subscribe(callback: BridgeCallback): () => void {
    this.listeners.push(callback);
    
    // Debug log a feliratkozásról
    if (this.debugMode) {
      console.log('[SearchFiltersBridge] New subscriber added. Total listeners:', this.listeners.length);
    }
    
    return () => {
      const initialLength = this.listeners.length;
      this.listeners = this.listeners.filter(l => l !== callback);
      
      // Debug log a leiratkozásról
      if (this.debugMode) {
        console.log('[SearchFiltersBridge] Subscriber removed. Total listeners:', this.listeners.length, 
                   `(was ${initialLength})`);
      }
    };
  }

  // Szűrőállapot változásának küldése
  public emitFilterChange(filters: SearchFilters): void {
    const message: BridgeMessage = { type: 'FILTER_CHANGE', filters };
    
    // Debug log az üzenet küldéséről
    if (this.debugMode) {
      console.log('[SearchFiltersBridge] Emitting FILTER_CHANGE:', filters);
    }
    
    // Biztonsági ellenőrzés - csak akkor küldjük el, ha van listener
    if (this.listeners.length === 0) {
      if (this.debugMode) {
        console.warn('[SearchFiltersBridge] No listeners for FILTER_CHANGE message');
      }
      return;
    }
    
    this.listeners.forEach((listener, index) => {
      try {
        listener(message);
      } catch (error) {
        // Hibakezelés a listener végrehajtási hibák esetén
        console.error(`[SearchFiltersBridge] Error in listener ${index}:`, error);
      }
    });
  }

  // ÚJ: Ország opciók egyszeri inicializálása - JAVÍTOTT típussal
  public emitOptions(countryOptions: CountryTagOption[]): void {
    const message: BridgeMessage = { type: 'OPTIONS_INIT', countryOptions };
    
    // Debug log az üzenet küldéséről
    if (this.debugMode) {
      console.log('[SearchFiltersBridge] Emitting OPTIONS_INIT:', 
                 `${countryOptions.length} country options`);
    }
    
    // Validáció - ellenőrizzük hogy van-e adat
    if (countryOptions.length === 0) {
      if (this.debugMode) {
        console.warn('[SearchFiltersBridge] Empty country options array provided');
      }
    }
    
    // Biztonsági ellenőrzés - csak akkor küldjük el, ha van listener
    if (this.listeners.length === 0) {
      if (this.debugMode) {
        console.warn('[SearchFiltersBridge] No listeners for OPTIONS_INIT message');
      }
      return;
    }
    
    this.listeners.forEach((listener, index) => {
      try {
        listener(message);
      } catch (error) {
        // Hibakezelés a listener végrehajtási hibák esetén
        console.error(`[SearchFiltersBridge] Error in listener ${index}:`, error);
      }
    });
  }

  // Új metódus: Az aktív listener-ek számának lekérdezése
  public getListenerCount(): number {
    return this.listeners.length;
  }

  // Új metódus: Az összes listener eltávolítása (cleanup céljából)
  public clearAllListeners(): void {
    const removedCount = this.listeners.length;
    this.listeners = [];
    
    if (this.debugMode) {
      console.log(`[SearchFiltersBridge] Cleared ${removedCount} listeners`);
    }
  }

  // Új metódus: Debug mód ki/bekapcsolása (teszteléshez hasznos)
  public setDebugMode(enabled: boolean): void {
    this.debugMode = enabled;
    console.log(`[SearchFiltersBridge] Debug mode ${enabled ? 'enabled' : 'disabled'}`);
  }
}

export const searchFiltersBridge = new SearchFiltersBridge();


/*
// jó működik
// Új fájl: src\components\Utility\Settings\SearchFilters\SearchFiltersBridge.ts
import { SearchFilters } from '../../../../hooks/useSearchFilters';
// ÚJ IMPORT: CountryTagOption típus
import { CountryTagOption } from './CountryFilter/CountryTagFilter';

// ÚJ: BridgeMessage típus - JAVÍTOTT VERZIÓ
export type BridgeMessage =
  | { type: 'FILTER_CHANGE'; filters: SearchFilters }
  | { type: 'OPTIONS_INIT'; countryOptions: CountryTagOption[] }; // ← JAVÍTVA: CountryTagOption[]

type BridgeCallback = (message: BridgeMessage) => void;

class SearchFiltersBridge {
  private listeners: BridgeCallback[] = [];

  public subscribe(callback: BridgeCallback): () => void {
    this.listeners.push(callback);
    return () => {
      this.listeners = this.listeners.filter(l => l !== callback);
    };
  }

  // Szűrőállapot változásának küldése
  public emitFilterChange(filters: SearchFilters): void {
    const message: BridgeMessage = { type: 'FILTER_CHANGE', filters };
    this.listeners.forEach(listener => listener(message));
  }

  // ÚJ: Ország opciók egyszeri inicializálása - JAVÍTOTT típussal
  public emitOptions(countryOptions: CountryTagOption[]): void {
    const message: BridgeMessage = { type: 'OPTIONS_INIT', countryOptions };
    this.listeners.forEach(listener => listener(message));
  }
}

export const searchFiltersBridge = new SearchFiltersBridge();
*/
/*
ez a mita !!!
/**
 * ContentSettingsPanelBridge
 *
 * Egyszerű kommunikációs híd a ContentSettings és Panel komponensek között.
 * Lehetővé teszi a beállítások változásainak közvetlen továbbítását
 * a Panel komponensnek, újratöltés nélkül.
 *//*

// Callback típus a beállítások változásaihoz
type SettingsChangeCallback = (key: string, value: number) => void;

/**
 * Beállítások eseménykezelője
 * Egyszerű pub/sub implementáció a komponensek közötti kommunikációhoz
 *//*
class SettingsEventBridge {
  private listeners: SettingsChangeCallback[] = [];
*/
  /**
   * Feliratkozás a beállítások változásaira
   * @param callback - A függvény, amely meghívódik a beállítás változásakor
   * @returns Függvény a leiratkozáshoz
   *//*
  public subscribe(callback: SettingsChangeCallback): () => void {
    this.listeners.push(callback);

    // Visszatérünk egy leiratkozó függvénnyel
    return () => {
      this.listeners = this.listeners.filter((cb) => cb !== callback);
    };
  }
*/
  /**
   * Beállítás változás esemény kiváltása
   * @param key - A beállítás kulcsa (pl. 'user_itemsPerPage')
   * @param value - A beállítás új értéke
   *//*
  public emit(key: string, value: number): void {
    console.log(`[SettingsEventBridge] Beállítás változás: ${key} = ${value}`);

    this.listeners.forEach((callback) => {
      try {
        callback(key, value);
      } catch (error) {
        console.error('Hiba a beállításváltozás kezelésekor:', error);
      }
    });
  }
}

// Singleton példány az alkalmazásban való használatra
export const settingsBridge = new SettingsEventBridge();

// Export a konstansnak a beállítások kulcsaihoz
export const ITEMS_PER_PAGE_PREFERENCE_KEY = 'user_itemsPerPage';



*/