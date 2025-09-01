// src\utils\datamanager\types\storage.ts

import { NewsItem } from '../../../types'; // ÚJ IMPORT
// Importáljuk a központosított típusokat a duplikáció elkerülésére
import { UserPreference, StorageStatistics } from '../storage/indexedDBTypes';
import { SyncInfo } from './sync';

/**
 * Alapvető tárolási típusdefiníciók a News alkalmazáshoz
 */

export interface LocalStorageData {
  version: string;
  timestamp: number;
  tabs?: {
    activeId: string;
    definitions: {
      id: string;
      title: string;
      mode: string;
      [key: string]: unknown;
    }[];
  };
  ui?: {
    panelStates: {
      left: boolean;
      right: boolean;
    };
    utilityMode: string;
  };
  devicePreferences?: {
    fontSize: number;
    darkMode: boolean;
  };
  savedArticles?: string[]; // Hozzáadva a mentett cikkek azonosítóihoz
}

export interface TabDefinition {
  id: string;
  title: string;
  mode: 'feed' | 'article' | 'search' | 'saved';
  params?: Record<string, string>;
  [key: string]: unknown; // Index signature hozzáadása a típuskompatibilitásért
}

export interface ArticleData {
  id: string;
  title: string;
  content: string;
  url: string;
  publishedAt: number;
  source: {
    id: string;
    name: string;
    savedAt: number; // Új tulajdonság hozzáadása
  };
}

export interface ServerStorageData {
  lastSync: number;
  articles: ArticleData[];
  preferences: UserPreference[];
}

export interface UserPreferences {
  id: string;
  type: string;
  value: unknown;
  updatedAt: number;
  categories: string[];
  sources: string[];
  fontSize: number;
  darkMode: boolean;
  notificationsEnabled: boolean;
  lastUpdated: number;
}

// StorageStatistics és SyncInfo típusokat importáljuk, nem definiáljuk újra

export interface SyncStats {
  lastSuccess?: number;
  lastFailure?: number;
  syncedItemCount?: number;
  receivedItemCount?: number;
  error?: string;
}

export interface TabContent {
  tabId: string;
  content: TabContentData;
  timestamp: number;
}

export interface TabContentData {
  news?: NewsItem[]; // Megváltoztatva: NewsItem[] a TabNewsItem[] helyett, hogy konzisztens legyen
  lastFetched?: number;
  [key: string]: unknown;
}

export interface ArticleItem {
  id: string;
  title: string;
  summary: string;
  imageUrl?: string;
  publishedAt: number;
  sourceId: string;
}

// UserPreference típust már importáltuk - nem definiáljuk újra

export interface SaveQueueItem {
  timestamp: number;
  type: 'article' | 'preference';
  data: ArticleData | UserPreference;
  attempts: number;
}

export interface ReadArticle {
  id: string;
  readAt: number;
  deviceId: string;
  synced: number; // Módosítva: boolean helyett number (0 = nem szinkronizált, 1 = szinkronizált)
}

// SyncInfo típust már importáltuk - nem definiáljuk újra

export interface DebugInfo {
  localState: LocalStorageData | null;
  dbStats: StorageStatistics;
  syncInfo: SyncInfo;
  deviceId: string | null;
  timestamp: number;
}
