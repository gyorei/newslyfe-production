import { DbSourceRow } from '../../apiclient/apiClient';

/**
 * Egy RSS forrás ellenőrzési eredménye
 */
export interface RssSourceStatus {
  source: DbSourceRow; // Az eredeti forrás objektum
  active: boolean; // Aktív-e (sikeresen betöltődik)
  error?: string; // Hibaüzenet, ha van
  lastChecked: Date; // Utolsó ellenőrzés ideje
  itemCount: number; // Betöltött elemek száma
  responseTime?: number; // Válaszidő milliszekundumban
  feedTitle?: string; // A feed címe, ha sikerült lekérni
  lastSuccessfulCheck?: Date; // Utolsó sikeres ellenőrzés ideje
  errorCategory?: RssErrorCategory; // Hiba kategóriája, ha van
}

/**
 * A monitorozó panel állapota
 */
export enum MonitorTab {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  ALL = 'all',
  ERRORS = 'errors', // Új: Hibaelemzési nézet
  PERFORMANCE = 'performance', // Új: Teljesítmény nézet
}

/**
 * RSS-hibakategóriák
 */
export enum RssErrorCategory {
  NOT_FOUND = 'not-found', // Feed nem található
  PARSE_ERROR = 'parse', // XML feldolgozási hiba
  TIMEOUT = 'timeout', // Időtúllépés
  SERVER_ERROR = 'server', // Szerver hiba
  CORS = 'cors', // CORS hiba
  EXCEPTION = 'exception', // Kezeletlen kivételek
  OTHER = 'other', // Egyéb hibák
}

/**
 * Monitor esemény típusok
 */
export type RssMonitorEventType =
  | 'check-start' // Ellenőrzés kezdete
  | 'check-end' // Ellenőrzés vége
  | 'batch-start' // Batch feldolgozás kezdete
  | 'batch-progress' // Batch feldolgozás állapota
  | 'batch-end' // Batch feldolgozás vége
  | 'error' // Hibaesemény
  | 'warning' // Figyelmeztetés
  | 'performance' // Teljesítmény mérés
  | 'cache-hit' // Cache találat
  | 'maintenance'; // Karbantartási esemény

/**
 * Monitor esemény alap interfész
 */
export interface RssMonitorEvent {
  type: RssMonitorEventType; // Az esemény típusa
  timestamp: number; // Időbélyeg (milliszekundumban)
  message: string; // Az esemény üzenete
  sourceId?: string; // Forrás azonosító (ha van)
  sourceName?: string; // Forrás neve (ha van)
  sourceUrl?: string; // Forrás URL (ha van)

  // Hiba kapcsolatos mezők
  error?: string; // Hibaüzenet
  errorCategory?: RssErrorCategory; // Hiba kategóriája
  errorDetails?: string; // Részletes hiba információk

  // Teljesítmény kapcsolatos mezők
  responseTime?: number; // Válaszidő milliszekundumban
  itemCount?: number; // Elemek száma

  // Egyéb mezők
  operation?: string; // Művelet neve
  durationMs?: number; // Művelet időtartama
  currentBatch?: number;
  totalBatches?: number;
  
  // Batch kapcsolatos mezők
  sourceCount?: number; // Források száma
  successCount?: number; // Sikeres ellenőrzések száma
  errorCount?: number; // Hibás ellenőrzések száma
}
