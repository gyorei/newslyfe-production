/**
 * Cache Modul Központi Exportálása (index.ts)
 *
 * EGYSZERŰSÍTETT - Csak a szükséges cache konfiguráció és típusok
 * A DataManager kezeli a cache funkcionalitást
 */

// Csak konfiguráció és típusok exportálása
export { CacheProfiles, DEFAULT_CACHE_OPTIONS, CACHE_TIMES } from './config';

// Típusok exportálása
export type { CacheOptions, CacheStats, CacheMetricsReport, ICache } from './types';
