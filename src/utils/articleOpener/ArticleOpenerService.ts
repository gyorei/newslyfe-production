/**
 * Központi cikknyitó szolgáltatás
 * 
 * Ez a szolgáltatás felelős azért, hogy a felhasználó beállításai alapján
 * megnyissa a cikkeket a megfelelő módon:
 * - embedded: beágyazott nézet
 * - tab: új tab az alkalmazáson belül
 * - window: új Electron ablak
 */

type ArticleViewMode = 'window' | 'embedded' | 'tab';

export class ArticleOpenerService {
  /**
   * Cikk megnyitása a felhasználó beállításai alapján
   */
  static async openArticle(url: string, tabContentRect?: any): Promise<void> {
    if (!url) {
      console.warn('[ArticleOpenerService] Nincs URL megadva');
      return;
    }

    try {
      // 1. Próbáljuk meg lekérni az aktuális beállítást
      const viewMode = await this.getArticleViewMode();
      
      console.log(`[ArticleOpenerService] Cikk megnyitása: ${viewMode} módban`, { url });

      // 2. Beállítás alapján nyissuk meg a cikket
      switch (viewMode) {
        case 'embedded':
          await this.openEmbedded(url, tabContentRect);
          break;
        case 'tab':
          await this.openInNewTab(url);
          break;
        case 'window':
          await this.openInNewWindow(url);
          break;
        default:
          console.warn(`[ArticleOpenerService] Ismeretlen nézet mód: ${viewMode}, fallback új ablakra`);
          this.openFallback(url);
      }
    } catch (error) {
      console.error('[ArticleOpenerService] Hiba a cikk megnyitásakor:', error);
      this.openFallback(url);
    }
  }

  /**
   * Aktuális ArticleViewMode lekérése
   */
  private static async getArticleViewMode(): Promise<ArticleViewMode> {
    try {
      // 1. Próbáljuk meg az Electron API-ból
      if (window.electronAPI?.getArticleViewMode) {
        const mode = await window.electronAPI.getArticleViewMode();
        if (mode && ['window', 'embedded', 'tab'].includes(mode)) {
          return mode;
        }
      }

      // 2. Fallback: localStorage
      const savedMode = localStorage.getItem('articleViewMode') as ArticleViewMode;
      if (savedMode && ['window', 'embedded', 'tab'].includes(savedMode)) {
        return savedMode;
      }

      // 3. Alapértelmezett: embedded
      return 'embedded';
    } catch (error) {
      console.error('[ArticleOpenerService] Hiba a beállítás lekérésekor:', error);
      return 'embedded';
    }
  }

  /**
   * Beágyazott nézet megnyitása
   */
  private static async openEmbedded(url: string, tabContentRect?: any): Promise<void> {
    if (window.electronAPI?.openArticleView) {
      window.electronAPI.openArticleView(url, tabContentRect);
    } else {
      console.warn('[ArticleOpenerService] Embedded nézet nem elérhető, fallback új ablakra');
      this.openFallback(url);
    }
  }

  /**
   * Új tab megnyitása az alkalmazáson belül
   */
  private static async openInNewTab(url: string): Promise<void> {
    // TODO: Implementálni kell az új tab logikát
    // Egyelőre fallback új ablakra
    console.warn('[ArticleOpenerService] Új tab funkció még nincs implementálva, fallback új ablakra');
    this.openFallback(url);
  }

  /**
   * Új Electron ablak megnyitása
   */
  private static async openInNewWindow(url: string): Promise<void> {
    if (window.electronAPI?.openArticleWindow) {
      window.electronAPI.openArticleWindow(url);
    } else {
      console.warn('[ArticleOpenerService] Új ablak funkció nem elérhető, fallback böngésző ablakra');
      this.openFallback(url);
    }
  }

  /**
   * Fallback: böngésző új ablak
   */
  private static openFallback(url: string): void {
    window.open(url, '_blank', 'noopener,noreferrer');
  }

  /**
   * Kényelmi függvény: openArticleByPreference API használata (ha elérhető)
   */
  static async openArticleByPreference(url: string, tabContentRect?: any): Promise<void> {
    if (window.electronAPI?.openArticleByPreference) {
      window.electronAPI.openArticleByPreference(url, tabContentRect);
    } else {
      // Ha nincs openArticleByPreference, használjuk a saját logikánkat
      await this.openArticle(url, tabContentRect);
    }
  }
}