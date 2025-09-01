/*
 * useTabPerformance.ts
 *
 * TAB PERFORMANCE MONITORING HOOK (News app)
 * ------------------------------------------
 * Ez a hook felelős a tab-ok teljesítménymonitorozásáért:
 *  - Cache hit/miss statisztikák
 *  - Memória használat figyelése
 *  - Access time mérése
 *  - Performance metrikák gyűjtése
 *  - Fejlett cache diagnosztika
 *
 * Szétválasztva a useTabStorage.ts-ből a Single Responsibility Principle alapján.
 */
import { useState, useRef, useCallback, useEffect } from 'react';

// Performance memory interface
declare global {
  interface Performance {
    memory?: {
      usedJSHeapSize: number;
      totalJSHeapSize: number;
      jsHeapSizeLimit: number;
    };
  }
}

export function useTabPerformance() {
  // Cache statisztikák
  const [memCacheStats, setMemCacheStats] = useState<{
    hits: number;
    misses: number;
    size: number;
    hitRate: number;
    avgAccessTime: number;
    lastCleanup: number;
  }>({
    hits: 0,
    misses: 0,
    size: 0,
    hitRate: 0,
    avgAccessTime: 0,
    lastCleanup: Date.now(),
  });

  // Performance tracking
  const performanceMetrics = useRef({
    accessTimes: [] as number[],
    lastMeasurement: Date.now(),
  });

  // Memory usage tracking
  const trackMemoryUsage = useCallback(() => {
    if (performance.memory) {
      const used = Math.round(performance.memory.usedJSHeapSize / 1024 / 1024);
      const total = Math.round(performance.memory.totalJSHeapSize / 1024 / 1024);
      const percentage = ((used / total) * 100).toFixed(1);

      if (used > 100) {
        // Warning if over 100MB
        console.warn(`[useTabPerformance] Magas memóriahasználat: ${used}MB (${percentage}%)`);
      }

      return { used, total, percentage: parseFloat(percentage) };
    }
    return null;
  }, []);

  // Cache hit rate számítása és logging
  const logAdvancedCacheStats = useCallback(() => {
    const total = memCacheStats.hits + memCacheStats.misses;
    const hitRate = total > 0 ? ((memCacheStats.hits / total) * 100).toFixed(1) : '0.0';
    const avgTime =
      performanceMetrics.current.accessTimes.length > 0
        ? (
            performanceMetrics.current.accessTimes.reduce((a, b) => a + b, 0) /
            performanceMetrics.current.accessTimes.length
          ).toFixed(2)
        : '0.00';

    console.log(
      `[useTabPerformance] 📊 Cache Stats - Size: ${memCacheStats.size}, Hit Rate: ${hitRate}%, Avg Access: ${avgTime}ms`,
    );

    // Critical performance warning
    if (parseFloat(hitRate) < 50 && total > 10) {
      console.warn(
        `[useTabPerformance] ⚠️ ALACSONY CACHE HATÉKONYSÁG: ${hitRate}% - optimalizálás szükséges!`,
      );
    }

    // Memory leak detection
    if (memCacheStats.size > 20 * 2) { // MAX_TABS * 2
      console.error(
        `[useTabPerformance] 🚨 MEMORY LEAK GYANÚ: ${memCacheStats.size} cache entries!`,
      );
    }
  }, [memCacheStats]);

  // Performance measurement wrapper
  const measurePerformance = useCallback(<T>(operation: () => T, operationName: string): T => {
    const startTime = performance.now();
    const result = operation();
    const duration = performance.now() - startTime;

    // Track access times (keep last 100 measurements)
    performanceMetrics.current.accessTimes.push(duration);
    if (performanceMetrics.current.accessTimes.length > 100) {
      performanceMetrics.current.accessTimes.shift();
    }

    // Log slow operations
    if (duration > 50) {
      console.warn(`[useTabPerformance] 🐌 LASSÚ MŰVELET: ${operationName} - ${duration.toFixed(2)}ms`);
    }

    return result;
  }, []);

  // Cache diagnostic metódus
  const getCacheDiagnostics = useCallback(() => {
    const total = memCacheStats.hits + memCacheStats.misses;
    const hitRate = total > 0 ? (memCacheStats.hits / total) * 100 : 0;
    const avgAccessTime =
      performanceMetrics.current.accessTimes.length > 0
        ? performanceMetrics.current.accessTimes.reduce((a, b) => a + b, 0) /
          performanceMetrics.current.accessTimes.length
        : 0;

    return {
      cacheSize: memCacheStats.size,
      maxSize: 20, // CACHE_CONFIG.MAX_TABS
      hits: memCacheStats.hits,
      misses: memCacheStats.misses,
      hitRate: hitRate.toFixed(1) + '%',
      avgAccessTime: avgAccessTime.toFixed(2) + 'ms',
      lastCleanup: new Date(memCacheStats.lastCleanup).toLocaleTimeString(),
      healthStatus:
        hitRate > 70 ? 'KIVÁLÓ' : hitRate > 50 ? 'JÓ' : hitRate > 30 ? 'KÖZEPES' : 'GYENGE',
      memoryUsage: trackMemoryUsage(),
    };
  }, [memCacheStats, trackMemoryUsage]);

  // Performance metrikák lekérése
  const getPerformanceMetrics = useCallback(() => {
    return {
      avgAccessTime:
        performanceMetrics.current.accessTimes.length > 0
          ? performanceMetrics.current.accessTimes.reduce((a, b) => a + b, 0) /
            performanceMetrics.current.accessTimes.length
          : 0,
      accessCount: performanceMetrics.current.accessTimes.length,
      lastMeasurement: performanceMetrics.current.lastMeasurement,
      recentAccessTimes: performanceMetrics.current.accessTimes.slice(-10), // Last 10 measurements
    };
  }, []);

  // Cache statisztikák frissítése
  const updateCacheStats = useCallback((update: Partial<typeof memCacheStats>) => {
    setMemCacheStats(prev => ({ ...prev, ...update }));
  }, []);

  // Cache hit regisztrálása
  const recordCacheHit = useCallback(() => {
    setMemCacheStats(prev => ({ 
      ...prev, 
      hits: prev.hits + 1,
      hitRate: prev.hits + prev.misses > 0 ? ((prev.hits + 1) / (prev.hits + prev.misses + 1)) * 100 : 0
    }));
  }, []);

  // Cache miss regisztrálása
  const recordCacheMiss = useCallback(() => {
    setMemCacheStats(prev => ({ 
      ...prev, 
      misses: prev.misses + 1,
      hitRate: prev.hits + prev.misses > 0 ? (prev.hits / (prev.hits + prev.misses + 1)) * 100 : 0
    }));
  }, []);

  // Debug logging effect
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      const logInterval = setInterval(() => {
        const diagnostics = getCacheDiagnostics();
        console.log(`[useTabPerformance] Performance Stats:`, diagnostics);
      }, 300000); // 5 perc

      return () => clearInterval(logInterval);
    }
  }, [getCacheDiagnostics]);

  // Periodic cache stats logging
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      const statsInterval = setInterval(() => {
        logAdvancedCacheStats();
      }, 600000); // 10 perc

      return () => clearInterval(statsInterval);
    }
  }, [logAdvancedCacheStats]);

  return {
    // Statisztikák
    memCacheStats,
    getCacheDiagnostics,
    getPerformanceMetrics,
    
    // Metrikák frissítése
    updateCacheStats,
    recordCacheHit,
    recordCacheMiss,
    
    // Performance mérés
    measurePerformance,
    trackMemoryUsage,
    logAdvancedCacheStats,
  };
}