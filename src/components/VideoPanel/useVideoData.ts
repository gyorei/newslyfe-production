// src\components\VideoPanel\useVideoData.ts
import { useState, useEffect, useCallback, useRef } from 'react';
import { apiClient } from '../../apiclient/apiClient';

// ========================================
// 🎥 VIDEO DATA HOOK
// ========================================
// Ez CSAK videó adatokat kezel!
// NEM keverjük a hír adatokkal!

export interface VideoDataState {
  videoItems: any[]; // később: YouTubeVideo[]
  loading: boolean;
  error: Error | string | null;
  lastFetched: Date | null;
}

export interface UseVideoDataOptions {
  activeTabId: string;
  isVideoMode: boolean;
  autoRefresh?: boolean;
  refreshInterval?: number; // milliszekundumokban
  country?: string | null; // ✅ JAVÍTVA: null is megengedett típus
  // maxVideos?: number; // ✅ KIKOMMENTÁLVA: maximális videó szám csatornánként
  // maxAgeDays?: number; // ✅ KIKOMMENTÁLVA: maximális videó életkor napokban
}

// ✅ ÚJ: Fejlettebb videó cache rendszer
class VideoCache {
  private static instance: VideoCache;
  private cache: Map<string, { data: any[], timestamp: number }> = new Map();
  private readonly DEFAULT_MAX_AGE_MS = 5 * 60 * 1000; // 5 perc alapértelmezetten

  private constructor() {
    console.log('[VideoCache] 🎬 Videó cache rendszer inicializálva');
  }

  public static getInstance(): VideoCache {
    if (!VideoCache.instance) {
      VideoCache.instance = new VideoCache();
    }
    return VideoCache.instance;
  }

  public set(key: string, data: any[]): void {
    this.cache.set(key, { data, timestamp: Date.now() });
    console.log(`[VideoCache] 💾 Mentve a cache-be: ${key} (${data.length} videó)`);
  }

  public get(key: string): any[] | null {
    const entry = this.cache.get(key);
    if (!entry) return null;
    return entry.data;
  }

  public isFresh(key: string, maxAgeMs: number = this.DEFAULT_MAX_AGE_MS): boolean {
    const entry = this.cache.get(key);
    if (!entry) return false;
    
    const age = Date.now() - entry.timestamp;
    const isFresh = age < maxAgeMs;
    
    if (isFresh) {
      console.log(`[VideoCache] ✅ Friss cache: ${key} (${Math.round(age/1000)}s)`);
    } else {
      console.log(`[VideoCache] ⏰ Lejárt cache: ${key} (${Math.round(age/1000)}s)`);
    }
    
    return isFresh;
  }
  
  // ✅ ÚJ: Helyi tárolóba mentés/betöltés (localStorage alapú)
  public saveToStorage(): void {
    try {
      // Csak a friss adatokat mentjük
      const freshEntries: Record<string, { data: any[], timestamp: number }> = {};
      
      this.cache.forEach((value, key) => {
        if (this.isFresh(key, 30 * 60 * 1000)) { // 30 perces cache
          freshEntries[key] = value;
        }
      });
      
      localStorage.setItem('videoCache', JSON.stringify(freshEntries));
      console.log(`[VideoCache] 📦 Mentve a helyi tárolóba (${Object.keys(freshEntries).length} elem)`);
    } catch (error) {
      console.error('[VideoCache] Hiba a helyi tárolóba mentés során:', error);
    }
  }
  
  public loadFromStorage(): void {
    try {
      const storedData = localStorage.getItem('videoCache');
      if (!storedData) return;
      
      const parsed = JSON.parse(storedData);
      
      // Betöltjük a mentett adatokat a memória cache-be
      Object.entries(parsed).forEach(([key, value]: [string, any]) => {
        this.cache.set(key, value);
      });
      
      console.log(`[VideoCache] 📥 Betöltve a helyi tárolóból (${Object.keys(parsed).length} elem)`);
    } catch (error) {
      console.error('[VideoCache] Hiba a helyi tárolóból betöltés során:', error);
    }
  }
  
  // ✅ ÚJ: Cache tisztítás (lejárt elemek eltávolítása)
  public cleanup(maxAgeMs: number = this.DEFAULT_MAX_AGE_MS): void {
    const keysToDelete: string[] = [];
    
    this.cache.forEach((value, key) => {
      if (!this.isFresh(key, maxAgeMs)) {
        keysToDelete.push(key);
      }
    });
    
    keysToDelete.forEach(key => this.cache.delete(key));
    console.log(`[VideoCache] 🧹 Cache tisztítás: ${keysToDelete.length} lejárt elem eltávolítva`);
  }
}

export const useVideoData = ({
  activeTabId,
  isVideoMode,
  autoRefresh = false,
  refreshInterval = 300000, // 5 perc alapértelmezetten
  country = undefined, // Ország szűrés
  // maxVideos = 100, // ✅ KIKOMMENTÁLVA: alapértelmezett 100 videó
  // maxAgeDays = 7, // ✅ KIKOMMENTÁLVA: alapértelmezett 7 nap
}: UseVideoDataOptions): VideoDataState & {
  refreshVideos: () => Promise<any[] | void>; // ✅ JAVÍTVA: visszatérési típus javítása, void esetét is figyelembe veszi
  clearError: () => void;
} => {
  // ========================================
  // 🎥 VIDEO STATE KEZELÉS
  // ========================================
  const [videoItems, setVideoItems] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<Error | string | null>(null);
  const [lastFetched, setLastFetched] = useState<Date | null>(null);
  const intervalRef = useRef<number | null>(null);

  // ✅ JAVÍTVA: Videó cache inicializálása és betöltése
  const videoCache = VideoCache.getInstance();
  const lastRequestTimestampRef = useRef<number>(0);
  const CACHE_THROTTLE_MS = 2000; // 2 másodperces throttle az API kérések között
  
  // ✅ ÚJ: Cache betöltése a localStorage-ból inicializáláskor
  useEffect(() => {
    videoCache.loadFromStorage();
    
    // Takarítás az alkalmazás bezárásakor
    return () => {
      videoCache.saveToStorage();
    };
  }, []);
  
  // ✅ ÚJ: Cache kulcs generálása
  const getCacheKey = useCallback((countryParam?: string | null): string => {
    return `video-${countryParam || 'all'}`;
  }, []);

  // ========================================
  // 🎥 VIDEO FETCHING LOGIKA
  // ========================================
  const fetchVideoData = useCallback(async (forceRefresh: boolean = false) => {
    if (!isVideoMode) {
      console.log('[useVideoData] Nem videó mód, adatlekérés kihagyva');
      return;
    }
    
    const cacheKey = getCacheKey(country);
    
    // ✅ JAVÍTVA: Cache ellenőrzés és használat
    if (!forceRefresh && videoCache.isFresh(cacheKey)) {
      const cachedData = videoCache.get(cacheKey);
      if (cachedData && cachedData.length > 0) {
        console.log(`[useVideoData] 🟢 Videó adatok betöltve cache-ből: ${country || 'all'} (${cachedData.length} videó)`);
        setVideoItems(cachedData);
        setLastFetched(new Date());
        return cachedData;
      }
    }
    
    // ✅ ÚJ: Throttle védelem a túl gyakori API hívások ellen
    const now = Date.now();
    if (now - lastRequestTimestampRef.current < CACHE_THROTTLE_MS && !forceRefresh) {
      console.log(`[useVideoData] 🛡️ API kérés throttle, kihagyva (${Math.round((now - lastRequestTimestampRef.current)/1000)}s)`);
      return;
    }
    
    lastRequestTimestampRef.current = now;
    
    // API adatlekérés logika
    setLoading(true);
    setError(null);
    
    try {
      console.log(`[useVideoData] 🔄 Videó adatok lekérése API-ból: ${country || 'all'}`);
      
      // ✅ JAVÍTVA: Az apiClient.getVideoNews függvény meghívása előtt konvertáljuk a country típusát
      // Csak string vagy undefined lehet, a null értéket undefined-re konvertáljuk
      const countryParam = country === null ? undefined : country;
      
      const response = await apiClient.getVideoNews({ 
        country: countryParam, // ✅ JAVÍTVA: null helyett undefined
        // maxVideos, // ✅ KIKOMMENTÁLVA
        // maxAgeDays // ✅ KIKOMMENTÁLVA
      });
      
      if (response.success && response.videos) {
        console.log(`[useVideoData] ✅ Sikeres API válasz: ${response.videos.length} videó`);
        setVideoItems(response.videos);
        setLastFetched(new Date());
        
        // ✅ JAVÍTVA: Cache mentés
        videoCache.set(cacheKey, response.videos);
        // Minden 10. lekérés után mentjük a cache-t localStorage-ba
        if (Math.random() < 0.1) {
          videoCache.saveToStorage();
        }
        
        return response.videos;
      } else {
        throw new Error('Invalid response format from video API');
      }

    } catch (err) {
      console.error('[useVideoData] 🎥 Hiba a videó adatok lekérésekor:', err);
      setError(err instanceof Error ? err : 'Failed to fetch video data');
      setVideoItems([]);
    } finally {
      setLoading(false);
    }
  }, [isVideoMode, country, getCacheKey]);

  // ========================================
  // 🎥 MANUAL REFRESH FUNKCIÓ
  // ========================================
  const refreshVideos = useCallback(async () => {
    console.log('[useVideoData] 🔄 Manuális videó frissítés kérve');
    return fetchVideoData(true); // ✅ JAVÍTVA: most már helyes a visszatérési típus
  }, [fetchVideoData]);

  // ========================================
  // 🎥 ERROR CLEAR FUNKCIÓ
  // ========================================
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // ========================================
  // 🎥 AUTO REFRESH LOGIKA
  // ========================================
  useEffect(() => {
    if (!isVideoMode) {
      // JAVÍTÁS: Csak akkor logoljuk, ha ténylegesen video módban voltunk
      return;
    }

    if (autoRefresh) {
      // console.log(`[useVideoData] 🎥 Auto refresh bekapcsolva: ${refreshInterval}ms`);
      
      const interval = setInterval(() => {
        // console.log('[useVideoData] 🎥 Auto refresh fut...');
        fetchVideoData(true); // force refresh az automatikus frissítésnél
      }, refreshInterval);

      return () => {
        // console.log('[useVideoData] 🎥 Auto refresh leállítva');
        clearInterval(interval);
      };
    }
  }, [isVideoMode, autoRefresh, refreshInterval, fetchVideoData]);

  // ========================================
  // 🎥 INITIAL FETCH LOGIKA
  // ========================================
  useEffect(() => {
    if (isVideoMode && activeTabId) {
      console.log(`[useVideoData] 🎥 Video mód aktiválva: ${activeTabId}`);
      fetchVideoData();
    } else if (!isVideoMode) {
      // ========================================
      // 🎥 CLEANUP - NEM VIDEO MÓDBAN
      // ========================================
      // JAVÍTÁS: Csak akkor logoljuk, ha ténylegesen video módban voltunk
      setVideoItems([]);
      setError(null);
      setLastFetched(null);
    }
  }, [isVideoMode, activeTabId, fetchVideoData]);

  // ========================================
  // 🎥 RETURN STATE ÉS FUNKCIÓK
  // ========================================
  return {
    videoItems,
    loading,
    error,
    lastFetched,
    refreshVideos,
    clearError,
  };
};

export default useVideoData;
