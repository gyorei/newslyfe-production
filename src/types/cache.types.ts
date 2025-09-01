export interface CacheOptions {
  maxSize: number;
  ttl: number;
  cleanupInterval: number;
  contentTypes?: Record<string, number>;
}

export interface CacheStats {
  hits: number;
  misses: number;
  size: number;
}

export interface CacheEntry<T> {
  value: T;
  expiry: number;
  createdAt: number;
  contentType?: string;
}

export interface ICache<T = unknown> {
  get(key: string): Promise<T | null>;
  set(key: string, value: T, ttl?: number, contentType?: string): Promise<void>;
  delete(key: string): Promise<void>;
  clear(): Promise<void>;
  has(key: string): Promise<boolean>;
  size(): Promise<number>;
  getStats(): CacheStats;
}

// Új típus a CacheDebugger számára
export interface CacheValue<T = unknown> {
  type: string;
  data: T;
  timestamp: number;
}

export type CacheMiddleware<T> = (key: string, value: T, store: unknown) => T;
