import { LocalStorageData } from '../localStorage/types';
import { StorageStatistics } from '../storage/indexedDBTypes';
import { SyncInfo } from './sync';
import { DetailedStorageStats } from '../services/StorageMetrics';

export interface DebugInfo {
  localState: LocalStorageData | null;
  dbStats: StorageStatistics | Record<string, unknown> | DetailedStorageStats; // Kibővített típus a DetailedStorageStats támogatásához
  syncInfo: SyncInfo;
  deviceId: string | null;
  timestamp: number;
  error?: string; // Hibakezeléshez hozzáadva
  // ÚJ: Kiegészítő debug információk
  quotaInfo?: {
    used: number;
    quota: number;
    usagePercentage: number;
  };
  cleanupStatus?: {
    isRunning: boolean;
    nextCleanup: number;
  };
}
