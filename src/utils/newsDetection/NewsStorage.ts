// 📰 News Storage - DataManager wrapper (FRISSÍTVE)
// Utolsó frissítés: 2025.06.03

import { LastCheckState, STORAGE_KEYS } from './types';
import { DataManager } from '../datamanager';

/**
 * DataManager alapú news detection storage
 * localStorage helyett DataManager LOCAL_STORAGE területet használ
 */
export class NewsStorage {
  private dataManager = DataManager.getInstance();

  /**
   * Utolsó ellenőrzés állapot mentése
   */
  async saveLastCheck(tabId: string, state: LastCheckState): Promise<void> {
    try {
      const key = `${STORAGE_KEYS.LAST_CHECK_PREFIX}${tabId}`;
      await this.dataManager.setItem(key, state);
    } catch (error) {
      console.warn('NewsStorage: Nem sikerült menteni:', error);
    }
  }

  /**
   * Utolsó ellenőrzés állapot betöltése
   */
  async getLastCheck(tabId: string): Promise<LastCheckState | null> {
    try {
      const key = `${STORAGE_KEYS.LAST_CHECK_PREFIX}${tabId}`;
      return await this.dataManager.getItem<LastCheckState>(key);
    } catch (error) {
      console.warn('NewsStorage: Nem sikerült betölteni:', error);
      return null;
    }
  }

  /**
   * Tab állapot törlése
   */
  async clearTab(tabId: string): Promise<void> {
    try {
      const key = `${STORAGE_KEYS.LAST_CHECK_PREFIX}${tabId}`;
      await this.dataManager.removeItem(key);
    } catch (error) {
      console.warn('NewsStorage: Nem sikerült törölni:', error);
    }
  }

  /**
   * Összes news detection adat törlése
   */
  async clearAll(): Promise<void> {
    try {
      // DataManager localStorage kulcsok lekérése és szűrése
      const allKeys = await this.dataManager.getAllStorageKeys();
      const newsKeys = allKeys.filter((key) => key.startsWith(STORAGE_KEYS.LAST_CHECK_PREFIX));

      for (const key of newsKeys) {
        await this.dataManager.removeItem(key);
      }
    } catch (error) {
      console.warn('NewsStorage: Nem sikerült mindent törölni:', error);
    }
  }

  /**
   * Debug: összes tárolt tab listázása
   */
  async getAllStoredTabs(): Promise<string[]> {
    try {
      const allKeys = await this.dataManager.getAllStorageKeys();
      return allKeys
        .filter((key) => key.startsWith(STORAGE_KEYS.LAST_CHECK_PREFIX))
        .map((key) => key.replace(STORAGE_KEYS.LAST_CHECK_PREFIX, ''));
    } catch (error) {
      console.warn('NewsStorage: Nem sikerült listázni:', error);
      return [];
    }
  }
}
