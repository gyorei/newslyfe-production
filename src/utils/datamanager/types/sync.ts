/**
 * Szinkronizációs típusdefiníciók
 */

import { ArticleData, UserPreference } from '../storage/indexedDBTypes';

export interface SyncRequest {
  lastSyncTimestamp: number;
  deviceId: string;
  readArticles: ReadArticleRequest[];
  saveQueue: SaveQueueItem[];
}

export interface ReadArticleRequest {
  id: string;
  readAt: number;
}

export interface SyncResponse {
  timestamp: number;
  changes: SyncChanges | null;
}

export interface SyncChanges {
  savedArticles?: Article[];
  readArticles?: ReadArticle[];
  userPreferences?: UserPreferences;
}

export interface SyncResult {
  success: boolean;
  syncedItemCount: number;
  receivedItemCount: number;
  error?: string;
}

export interface Article extends ArticleData {
  savedAt: number;
}

export interface ReadArticle {
  id: string;
  readAt: number;
  deviceId?: string;
}
/*
export interface UserPreferences {
  categories: string[];
  sources: string[];
  fontSize: number;
  darkMode: boolean;
  notificationsEnabled: boolean;
  lastUpdated: number;
}
*/
export interface UserPreferences {
  id: string;
  type: string;
  value: unknown;
  updatedAt: number;
  categories?: string[];
  sources?: string[];
  fontSize?: number;
  darkMode?: boolean;
  notificationsEnabled?: boolean;
  lastUpdated?: number;
}

// Example usage with default values
const userPreferences: UserPreferences = {
  id: 'default-preferences',
  type: 'default',
  value: {},
  updatedAt: Date.now(),
  categories: [],
  sources: [],
  fontSize: 14,
  darkMode: false,
  notificationsEnabled: true,
  lastUpdated: Date.now(),
};

export interface SaveQueueItem {
  id: string;
  type: 'article' | 'preference';
  data: ArticleData | UserPreference;
  timestamp: number;
}

export interface SyncStats {
  lastSuccess: number;
  lastFailure?: number;
  syncedItemCount: number;
  receivedItemCount: number;
  error?: string;
}

export interface SyncInfo {
  lastSuccess: number;
  lastFailure?: number;
  pendingCount: number;
  error?: string;
}

/**
 * Szinkronizációs opciók interfész
 * A synchronize függvény számára paraméterként átadható opciók
 */
export interface SyncOptions {
  /**
   * Teljes szinkronizálás kikényszerítése
   * Ha true, akkor minden adatot szinkronizál, nem csak a módosítottakat
   */
  forceFullSync?: boolean;

  /**
   * Helyi cache törlése szinkronizáció előtt
   * Figyelem: Adatvesztést okozhat, ha vannak még nem szinkronizált adatok
   */
  clearLocalCache?: boolean;

  /**
   * Maximális újrapróbálkozások száma hiba esetén
   */
  maxRetries?: number;

  /**
   * Egyéb szinkronizációs beállítások
   */
  [key: string]: unknown;
}
