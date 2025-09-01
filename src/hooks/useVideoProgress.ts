// src\hooks\useVideoProgress.ts
import { useState, useEffect, useCallback, useRef } from 'react';
import { videoProgressService, VideoProgress } from '../utils/videoProgressService';

interface UseVideoProgressOptions {
  autoResume?: boolean;     // Automatikus folytatás
  saveInterval?: number;     // Mentési gyakoriság (ms)
  minSaveThreshold?: number; // Minimális nézési idő a mentéshez (mp)
}

export const useVideoProgress = (
  videoId: string, 
  options: UseVideoProgressOptions = {}
) => {
  const {
    autoResume = true,
    saveInterval = 5000, // 5 másodpercenként mentés
    minSaveThreshold = 10 // 10 másodperc után kezdjük menteni
  } = options;

  const [progress, setProgress] = useState<VideoProgress | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastSaveTimeRef = useRef<number>(0);

  // Pozíció betöltése komponens mount-kor
  useEffect(() => {
    const loadProgress = () => {
      try {
        const savedProgress = videoProgressService.getProgress(videoId);
        setProgress(savedProgress);
        // console.log(`[useVideoProgress] Pozíció betöltve: ${videoId}`, savedProgress);
      } catch (error) {
        // console.error('[useVideoProgress] Hiba a pozíció betöltésekor:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadProgress();
  }, [videoId]);

  // Pozíció mentése késleltetéssel
  const saveProgress = useCallback((position: number, duration: number) => {
    const now = Date.now();
    
    // Csak akkor mentünk, ha eltelt a minimális idő
    if (position < minSaveThreshold) {
      return;
    }

    // Csak akkor mentünk, ha eltelt a mentési intervallum
    if (now - lastSaveTimeRef.current < saveInterval) {
      return;
    }

    // Töröljük a korábbi timeout-ot
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    // --- FIX: A lastSaveTimeRef-et a timeout ELŐTT frissítjük, hogy a throttling mindig pontos legyen ---
    lastSaveTimeRef.current = now;
    saveTimeoutRef.current = setTimeout(() => {
      videoProgressService.saveProgress(videoId, position, duration);
    }, 1000); // 1 másodperc késleltetés
  }, [videoId, saveInterval, minSaveThreshold]);

  // Pozíció törlése
  const clearProgress = useCallback(() => {
    videoProgressService.clearProgress(videoId);
    setProgress(null);
    // console.log(`[useVideoProgress] Pozíció törölve: ${videoId}`);
  }, [videoId]);

  // YouTube player eseménykezelők
  const handlePlayerReady = useCallback((event: any) => {
    if (!autoResume || !progress) {
      return;
    }

    // --- Globális single player mód ---
    if (typeof window !== 'undefined' && (window as any).__YT_SINGLE_PLAYER_MODE && typeof (window as any).__stopAllYouTubePlayers === 'function') {
      (window as any).__stopAllYouTubePlayers();
    }

    const { position, watchPercentage } = progress;
    
    // Intelligens folytatási logika
    let resumePosition = 0;
    
    if (watchPercentage >= 90) {
      // Ha 90% felett nézte meg, elejéről kezdjük
      // console.log(`[useVideoProgress] Videó 90%+ megnézve, elejéről kezdés: ${videoId}`);
    } else if (watchPercentage < 10) {
      // Ha 10% alatt nézte meg, elejéről kezdjük
      // console.log(`[useVideoProgress] Videó 10% alatt nézve, elejéről kezdés: ${videoId}`);
    } else {
      // Egyébként folytatjuk onnan, ahol abbahagyta
      resumePosition = position;
      // console.log(`[useVideoProgress] Folytatás pozícióból: ${videoId} - ${position}s`);
    }

// átugorja a reklámokat
  /*
    if (resumePosition > 0) {
      event.
      target.seekTo(resumePosition);
    }
  */
 
// Reklám támogatás - YouTube API-ra bízva
if (resumePosition > 0) {
  // console.log(`[useVideoProgress] Folytatás pozícióból (reklámkezelést a YouTube-ra bízva): ${videoId} - ${resumePosition}s`);
  event.target.seekTo(resumePosition);
  // --- YouTube IFrame API workaround ---
  // A playVideo() és pauseVideo() között várunk 400ms-ot, hogy a lejátszó ténylegesen betöltse a képkockát.
  // Ez segít elkerülni a "beragadó" spinner problémát.
  event.target.playVideo();
  setTimeout(() => {
    try {
      event.target.pauseVideo();
    } catch (err) {
      // console.warn('[useVideoProgress] pauseVideo sikertelen:', err);
    }
  }, 400);
}

  }, [videoId, progress, autoResume]);

  const handleStateChange = useCallback((event: any) => {
    const { data } = event;
    
    // Csak akkor mentünk, ha a videó lejátszásban van
    if (data === 1) { // 1 = playing
      const currentTime = event.target.getCurrentTime();
      const duration = event.target.getDuration();
      
      if (currentTime > 0 && duration > 0) {
        saveProgress(currentTime, duration);
      }
    }
  }, [saveProgress]);

  // Cleanup timeout-ok komponens unmount-kor
  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, []);

  return {
    progress,
    isLoading,
    clearProgress,
    handlePlayerReady,
    handleStateChange,
    hasProgress: progress !== null,
    watchPercentage: progress?.watchPercentage || 0
  };
};