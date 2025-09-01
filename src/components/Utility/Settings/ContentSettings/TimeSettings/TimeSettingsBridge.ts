/**
 * TimeSettingsBridge
 *
 * Kommunikációs híd a TimeSettings és Panel komponensek között.
 * Lehetővé teszi az időbeállítások változásainak közvetlen továbbítását
 * a Panel komponensnek, újratöltés nélkül.
 */

// Callback típus az időbeállítások változásaihoz
type TimeSettingsChangeCallback = (key: string, value: number) => void;

/**
 * Időbeállítások eseménykezelője
 * Egyszerű pub/sub implementáció a komponensek közötti kommunikációhoz
 */
class TimeSettingsEventBridge {
  private listeners: TimeSettingsChangeCallback[] = [];

  /**
   * Feliratkozás az időbeállítások változásaira
   * @param callback - A függvény, amely meghívódik a beállítás változásakor
   * @returns Függvény a leiratkozáshoz
   */
  public subscribe(callback: TimeSettingsChangeCallback): () => void {
    this.listeners.push(callback);

    // Visszatérünk egy leiratkozó függvénnyel
    return () => {
      this.listeners = this.listeners.filter((cb) => cb !== callback);
    };
  }

  /**
   * Időbeállítás változás esemény kiváltása
   * @param key - A beállítás kulcsa (pl. 'user_maxAgeHours')
   * @param value - A beállítás új értéke
   */
  public emit(key: string, value: number): void {
    console.log(`[TimeSettingsEventBridge] Time setting change: ${key} = ${value} hours`);

    this.listeners.forEach((callback) => {
      try {
        callback(key, value);
      } catch (error) {
        console.error('Error handling time setting change:', error);
      }
    });
  }
}

// Singleton példány az alkalmazásban való használatra
export const timeSettingsBridge = new TimeSettingsEventBridge();

// Export a konstansnak az időbeállítások kulcsaihoz
export const MAX_AGE_HOURS_PREFERENCE_KEY = 'user_maxAgeHours';
