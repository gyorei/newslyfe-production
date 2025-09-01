// 📰 New News Detector - Fő detection logika
// Utolsó frissítés: 2025.06.01

import { NewsStorage } from './NewsStorage';
import { NewsItem, LastCheckState, DetectionDebugInfo } from './types';

/**
 * Új hírek detektálása timestamp alapon
 */
export class NewNewsDetector {
  private storage: NewsStorage;

  constructor() {
    this.storage = new NewsStorage();
  }

  /**
   * Új hírek detektálása egy tab-hoz
   * MVP: Egyszerű count alapú detection
   */
  async detectNewNews(tabId: string, currentNews: NewsItem[] = []): Promise<number> {
    try {
      // 1. Utolsó állapot betöltése
      const lastCheck = await this.storage.getLastCheck(tabId);

      // 2. Első futás esetén
      if (!lastCheck) {
        this.saveCurrentState(tabId, currentNews);
        return 0;
      }

      // 3. Új hírek számítása
      const newCount = this.calculateNewNewsCount(currentNews, lastCheck);

      // 4. Debug log development módban
      if (process.env.NODE_ENV === 'development') {
        console.log('NewsDetector Debug:', this.getDebugInfo(tabId, currentNews, newCount));
      }

      // 5. Állapot frissítése
      this.saveCurrentState(tabId, currentNews);

      return newCount;
    } catch (error) {
      console.error('NewsDetector: Hiba a detection során:', error);
      return 0;
    }
  }

  /**
   * Tab megtekintettként jelölése (badge nullázás)
   */
  async markTabAsViewed(tabId: string): Promise<void> {
    const lastCheck = await this.storage.getLastCheck(tabId);
    if (lastCheck) {
      lastCheck.userLastViewed = Date.now();
      this.storage.saveLastCheck(tabId, lastCheck);
    }
  }

  /**
   * Új hírek számának kiszámítása
   * MVP: Count alapú egyszerű verzió
   */
  private calculateNewNewsCount(currentNews: NewsItem[], lastCheck: LastCheckState): number {
    const currentCount = currentNews.length;
    const lastCount = lastCheck.lastArticleCount;

    // Ha több hír van most, mint korábban → új hírek
    return currentCount > lastCount ? currentCount - lastCount : 0;
  }

  /**
   * Jelenlegi állapot mentése
   */
  private saveCurrentState(tabId: string, newsItems: NewsItem[]): void {
    const state: LastCheckState = {
      tabId,
      lastCheckTimestamp: Date.now(),
      lastArticleCount: newsItems.length,
    };

    this.storage.saveLastCheck(tabId, state);
  }

  /**
   * Debug információk gyűjtése
   */

  async getDebugInfo(
    tabId: string,
    currentNews: NewsItem[] = [],
    newCount = 0,
  ): Promise<DetectionDebugInfo> {
    const lastCheck = await this.storage.getLastCheck(tabId);

    return {
      tabId,
      lastCheck,
      currentCount: currentNews.length,
      newCount,
      method: 'count',
      timestamp: Date.now(),
    };
  }

  /**
   * Storage törlése (debug/reset célra)
   */
  clearStorage(): void {
    this.storage.clearAll();
  }
}
