/**
 * Cache-specifikus típusok és interfészek
 */

/**
 * Cache opciók
 */
export interface CacheOptions {
  namespace?: string; // Névtér a cache kulcsokhoz
  ttl?: number; // Time-to-live milliszekundumban (Date.now() kompatibilis)
  priority?: number; // Prioritás (opcionális)
  maxSize?: number; // Maximum cache méret elemszámban
  cleanupInterval?: number; // Tisztítási időköz milliszekundumban
  contentTypes?: Record<string, number>; // Különböző tartalmak TTL idejei milliszekundumban
}

/**
 * Cache bejegyzés interfész
 */
export interface CacheEntry<T> {
  value: T;
  expiry: number;
  createdAt: number;
  contentType?: string;
}

/**
 * Cache interfész - az összes cache típus alapja
 */
export interface ICache<T = unknown> {
  get(key: string): Promise<T | null>;
  set(key: string, value: T, ttl?: number, contentType?: string): Promise<void>;
  delete(key: string): Promise<void>;
  clear(): Promise<void>;
  has?(key: string): Promise<boolean>;
  size?(): Promise<number>;
}

/**
 * Cache statisztikák
 */
export interface CacheStats {
  hits: number;
  misses: number;
  size: number;
}

/**
 * Cache metrikák jelentés
 */
export interface CacheMetricsReport {
  totalHits: number;
  totalMisses: number;
  avgLatency: number;
  hitRate: number;
  keySpecific?: Map<
    string,
    {
      hits: number;
      misses: number;
      avgLatency: number;
    }
  >;
}
