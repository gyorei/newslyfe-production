// 📰 News Detection Types
// Utolsó frissítés: 2025.06.01

/**
 * Utolsó ellenőrzés állapota egy tab-hoz
 */
export interface LastCheckState {
  tabId: string;
  lastCheckTimestamp: number;
  lastArticleCount: number;
  userLastViewed?: number; // Mikor tekintette meg a user utoljára
}

/**
 * Hír elem alapvető adatai detection-höz
 */
export interface NewsItem {
  id: string;
  timestamp: number;
  title: string;
  // További mezők később...
}

/**
 * Detection eredmény
 */
export interface DetectionResult {
  newNewsCount: number;
  timestamp: number;
  method: 'timestamp' | 'count';
}

/**
 * Debug információk development módhoz
 */
export interface DetectionDebugInfo {
  tabId: string;
  lastCheck: LastCheckState | null;
  currentCount: number;
  newCount: number;
  method: string;
  timestamp: number;
}

/**
 * Storage kulcsok
 */
export const STORAGE_KEYS = {
  NEWS_DETECTION: 'newsDetection',
  LAST_CHECK_PREFIX: 'lastCheck_',
} as const;
