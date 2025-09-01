/**
 * ContentSettingsPanelBridge
 *
 * Egyszerű kommunikációs híd a ContentSettings és Panel komponensek között.
 * Lehetővé teszi a beállítások változásainak közvetlen továbbítását
 * a Panel komponensnek, újratöltés nélkül.
 */

// Callback típus a beállítások változásaihoz
type SettingsChangeCallback = (key: string, value: number) => void;

/**
 * Beállítások eseménykezelője
 * Egyszerű pub/sub implementáció a komponensek közötti kommunikációhoz
 */
class SettingsEventBridge {
  private listeners: SettingsChangeCallback[] = [];

  /**
   * Feliratkozás a beállítások változásaira
   * @param callback - A függvény, amely meghívódik a beállítás változásakor
   * @returns Függvény a leiratkozáshoz
   */
  public subscribe(callback: SettingsChangeCallback): () => void {
    this.listeners.push(callback);

    // Visszatérünk egy leiratkozó függvénnyel
    return () => {
      this.listeners = this.listeners.filter((cb) => cb !== callback);
    };
  }

  /**
   * Beállítás változás esemény kiváltása
   * @param key - A beállítás kulcsa (pl. 'user_itemsPerPage')
   * @param value - A beállítás új értéke
   */
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
