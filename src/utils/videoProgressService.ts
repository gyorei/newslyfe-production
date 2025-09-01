export interface VideoProgress {
  videoId: string;
  position: number;        // másodpercben
  duration: number;        // teljes hossz
  lastWatched: Date;      // utolsó nézés időpontja
  completed: boolean;      // teljesen megnézett-e
  watchPercentage: number; // százalékban (0-100)
}

class VideoProgressService {
  private readonly STORAGE_KEY = 'videoProgress';

  /**
   * Videó lejátszási pozíció mentése
   */
  saveProgress(videoId: string, position: number, duration: number): void {
    try {
      const progress = this.getAllProgress();
      const watchPercentage = duration > 0 ? (position / duration) * 100 : 0;
      
      progress[videoId] = {
        videoId,
        position,
        duration,
        lastWatched: new Date(),
        completed: watchPercentage >= 90, // 90% felett teljesnek tekintjük
        watchPercentage
      };

      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(progress));
      console.log(`[VideoProgress] Pozíció mentve: ${videoId} - ${position}s/${duration}s (${watchPercentage.toFixed(1)}%)`);
    } catch (error) {
      console.error('[VideoProgress] Hiba a pozíció mentésekor:', error);
    }
  }

  /**
   * Videó lejátszási pozíció betöltése
   */
  getProgress(videoId: string): VideoProgress | null {
    try {
      const progress = this.getAllProgress();
      return progress[videoId] || null;
    } catch (error) {
      console.error('[VideoProgress] Hiba a pozíció betöltésekor:', error);
      return null;
    }
  }

  /**
   * Összes videó pozíció betöltése
   */
  getAllProgress(): Record<string, VideoProgress> {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      return stored ? JSON.parse(stored) : {};
    } catch (error) {
      console.error('[VideoProgress] Hiba az összes pozíció betöltésekor:', error);
      return {};
    }
  }

  /**
   * Videó pozíció törlése
   */
  clearProgress(videoId: string): void {
    try {
      const progress = this.getAllProgress();
      delete progress[videoId];
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(progress));
      console.log(`[VideoProgress] Pozíció törölve: ${videoId}`);
    } catch (error) {
      console.error('[VideoProgress] Hiba a pozíció törlésekor:', error);
    }
  }

  /**
   * Összes pozíció törlése
   */
  clearAllProgress(): void {
    try {
      localStorage.removeItem(this.STORAGE_KEY);
      console.log('[VideoProgress] Összes pozíció törölve');
    } catch (error) {
      console.error('[VideoProgress] Hiba az összes pozíció törlésekor:', error);
    }
  }

  /**
   * Régi pozíciók tisztítása (30 napnál régebbiek)
   */
  cleanupOldProgress(): void {
    try {
      const progress = this.getAllProgress();
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      let cleanedCount = 0;
      Object.keys(progress).forEach(videoId => {
        const lastWatched = new Date(progress[videoId].lastWatched);
        if (lastWatched < thirtyDaysAgo) {
          delete progress[videoId];
          cleanedCount++;
        }
      });

      if (cleanedCount > 0) {
        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(progress));
        console.log(`[VideoProgress] ${cleanedCount} régi pozíció törölve`);
      }
    } catch (error) {
      console.error('[VideoProgress] Hiba a régi pozíciók tisztításakor:', error);
    }
  }
}

// Singleton instance
export const videoProgressService = new VideoProgressService(); 