/**
 * API kommunikációs típusok a News alkalmazáshoz
 */
import { ArticleData } from '../storage/indexedDBTypes';

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  timestamp?: number;
}

export interface ArticleSaveRequest {
  id: string;
  userId?: string;
  deviceId: string;
  saveTimestamp: number;
}

export interface ArticleSyncRequest {
  deviceId: string;
  lastSyncTimestamp: number;
  items: Array<ArticleSyncItem>;
}

export type ArticleSyncItem =
  | { id: string; type: 'read'; timestamp: number; data?: { readAt: number } }
  | { id: string; type: 'save'; timestamp: number; data?: { article: ArticleData } }
  | { id: string; type: 'preference'; timestamp: number; data?: { preference: UserPreference } };

// Szinkronizációs válasz típusok
export interface ReadArticleChange {
  id: string;
  type: 'read';
  timestamp: number;
  data?: { readAt: number };
}

export interface SavedArticleChange {
  id: string;
  type: 'save';
  timestamp: number;
  data?: { article: ArticleData };
}

export interface PreferenceChange {
  id: string;
  type: 'preference';
  timestamp: number;
  data?: { preference: UserPreference };
}

export interface SyncPayloadChanges {
  readArticles?: ReadArticleChange[];
  savedArticles?: SavedArticleChange[];
  userPreferences?: PreferenceChange; // Feltételezve, hogy ez egyetlen objektum a countChanges alapján
}

export interface SyncResponseData {
  changes: SyncPayloadChanges;
  newLastSyncTimestamp: number;
}

export interface UserPreferenceRequest {
  deviceId: string;
  preferences: {
    categories?: string[];
    sources?: string[];
    fontSize?: number;
    darkMode?: boolean;
    notificationsEnabled?: boolean;
  };
}

export interface ErrorResponse {
  code: string;
  message: string;
  details?: ErrorDetails;
}

interface ErrorDetails {
  fieldErrors?: Record<string, string[]>;
  requestId?: string;
  traceId?: string;
  serverInfo?: Record<string, unknown>;
}

export interface UserPreference {
  id: string;
  type: string;
  value: unknown;
  updatedAt: number;
}
