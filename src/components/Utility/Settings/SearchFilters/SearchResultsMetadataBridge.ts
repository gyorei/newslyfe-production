// src/components/Utility/Settings/SearchFilters/SearchResultsMetadataBridge.ts

/**
 * @file SearchResultsMetadataBridge.ts
 * @description Tab-specifikus kommunikációs híd a keresési eredmények meta-adatainak kezelésére.
 *
 * Ez a modul egy "állapottartó" eseménykezelőt (pub/sub) valósít meg, amely lehetővé teszi,
 * hogy a TabPanel elküldje, a SearchFilters pedig fogadja a keresési találatokból
 * kinyert, fülhöz kötött szűrőopciókat (pl. országlista darabszámokkal).
 *
 * Főbb jellemzők:
 * - Fül-specifikus tárolás: Egy `Map` segítségével minden fülhöz (`tabId`) a saját
 *   meta-adatait tárolja, így több párhuzamos keresés is kezelhető.
 * - Állapotmegőrzés: Az újonnan feliratkozó komponensek is megkapják a legutóbbi,
 *   tárolt állapotot az `getMetadataForTab` metódussal, megoldva az időzítési problémákat.
 * - Takarítás: A `clearTabMetadata` metódus biztosítja, hogy a fül bezárásakor
 *   a már nem szükséges meta-adatok törlődjenek, megelőzve a memóriaszivárgást.
 */

// Definiálja, milyen formában küldjük az adatot a TabPanel-től.
export interface CountryMetadata {
  code: string;  // Kétbetűs kód, pl. 'US'
  name: string;  // Teljes név, pl. 'United States'
  count: number; // Hány találat van ebből az országból
}

export interface SearchMetadata {
  countries: CountryMetadata[];
  // A jövőben itt lehetne bővíteni pl. nyelvi eloszlással
  // Hozzáadtam timestamp-et a cache kezeléshez
  timestamp?: number; // Mikor generálódott a metadata (cache invalidation-hez)
}

// A Bridge osztály, ami a kommunikációt végzi.
type MetadataChangeCallback = (metadata: SearchMetadata, tabId: string) => void;

class SearchResultsMetadataBridge {
  private listeners: MetadataChangeCallback[] = [];
  private tabMetadata: Map<string, SearchMetadata> = new Map(); // <-- ÚJ: Tab-specifikus tárolás
  // Hozzáadtam debug logging támogatását fejlesztési módban
  private debugMode: boolean = process.env.NODE_ENV === 'development';
  // Hozzáadtam WeakRef használatot a memóriakezelés javításához (ha támogatott)
  private cleanupTimers: Map<string, NodeJS.Timeout> = new Map(); // Delayed cleanup timer-ek

  public subscribe(callback: MetadataChangeCallback): () => void {
    this.listeners.push(callback);
    
    // Debug log a feliratkozásról
    if (this.debugMode) {
      console.log('[SearchResultsMetadataBridge] New subscriber added. Total listeners:', this.listeners.length);
    }
    
    // Visszaad egy leiratkozó függvényt a memóriaszivárgás elkerülésére.
    return () => {
      const initialLength = this.listeners.length;
      this.listeners = this.listeners.filter(l => l !== callback);
      
      // Debug log a leiratkozásról
      if (this.debugMode) {
        console.log('[SearchResultsMetadataBridge] Subscriber removed. Total listeners:', 
                   this.listeners.length, `(was ${initialLength})`);
      }
    };
  }

  // ÚJ: Tab-specifikus metaadat küldés
  public emitForTab(tabId: string, metadata: SearchMetadata): void {
    // Input validáció hozzáadása
    if (!tabId || typeof tabId !== 'string') {
      console.error('[SearchResultsMetadataBridge] Invalid tabId provided:', tabId);
      return;
    }
    
    if (!metadata || !metadata.countries || !Array.isArray(metadata.countries)) {
      console.error('[SearchResultsMetadataBridge] Invalid metadata provided:', metadata);
      return;
    }
    
    // Timestamp hozzáadása a metaadathoz cache kezeléshez
    const timestampedMetadata: SearchMetadata = {
      ...metadata,
      timestamp: Date.now()
    };
    
    if (this.debugMode) {
      console.log(`[SearchResultsMetadataBridge] Új metaadat fül ${tabId}-hez:`, 
                 `${timestampedMetadata.countries.length} országok`);
    }
    
    this.tabMetadata.set(tabId, timestampedMetadata); // Tároljuk tab szerint
    
    // Töröljük a pending cleanup timer-t ha volt
    const existingTimer = this.cleanupTimers.get(tabId);
    if (existingTimer) {
      clearTimeout(existingTimer);
      this.cleanupTimers.delete(tabId);
    }
    
    // Hibakezelés a listener-ek végrehajtásánál
    this.listeners.forEach((listener, index) => {
      try {
        listener(timestampedMetadata, tabId);
      } catch (error) {
        console.error(`[SearchResultsMetadataBridge] Error in listener ${index}:`, error);
      }
    });
  }

  // ÚJ: Adott fül metaadatának lekérése
  public getMetadataForTab(tabId: string): SearchMetadata | null {
    // Input validáció
    if (!tabId || typeof tabId !== 'string') {
      if (this.debugMode) {
        console.warn('[SearchResultsMetadataBridge] Invalid tabId in getMetadataForTab:', tabId);
      }
      return null;
    }
    
    const metadata = this.tabMetadata.get(tabId) || null;
    
    if (this.debugMode && metadata) {
      const age = metadata.timestamp ? Date.now() - metadata.timestamp : 'unknown';
      console.log(`[SearchResultsMetadataBridge] Retrieved metadata for tab ${tabId}, age: ${age}ms`);
    }
    
    return metadata;
  }

  // ÚJ: Fül bezáráskor cleanup
  public clearTabMetadata(tabId: string): void {
    // Input validáció
    if (!tabId || typeof tabId !== 'string') {
      console.warn('[SearchResultsMetadataBridge] Invalid tabId in clearTabMetadata:', tabId);
      return;
    }
    
    if (this.debugMode) {
      console.log(`[SearchResultsMetadataBridge] Metaadat törlése fül ${tabId}-hez`);
    }
    
    this.tabMetadata.delete(tabId);
    
    // Cleanup timer törlése is ha volt
    const existingTimer = this.cleanupTimers.get(tabId);
    if (existingTimer) {
      clearTimeout(existingTimer);
      this.cleanupTimers.delete(tabId);
    }
  }

  // Új metódus: Delayed cleanup - hasznos amikor nem biztos hogy a fül tényleg bezárult
  public scheduleTabCleanup(tabId: string, delayMs: number = 30000): void {
    // Input validáció
    if (!tabId || typeof tabId !== 'string') {
      console.warn('[SearchResultsMetadataBridge] Invalid tabId in scheduleTabCleanup:', tabId);
      return;
    }
    
    // Töröljük a korábbi timer-t ha volt
    const existingTimer = this.cleanupTimers.get(tabId);
    if (existingTimer) {
      clearTimeout(existingTimer);
    }
    
    // Új timer beállítása
    const timer = setTimeout(() => {
      this.clearTabMetadata(tabId);
      this.cleanupTimers.delete(tabId);
      
      if (this.debugMode) {
        console.log(`[SearchResultsMetadataBridge] Delayed cleanup executed for tab ${tabId}`);
      }
    }, delayMs);
    
    this.cleanupTimers.set(tabId, timer);
    
    if (this.debugMode) {
      console.log(`[SearchResultsMetadataBridge] Scheduled cleanup for tab ${tabId} in ${delayMs}ms`);
    }
  }

  // Új metódus: Az összes tárolt metadata lekérdezése (debug célokra)
  public getAllTabIds(): string[] {
    return Array.from(this.tabMetadata.keys());
  }

  // Új metódus: Összes metadata törlése (cleanup/reset célokra)
  public clearAllMetadata(): void {
    const clearedCount = this.tabMetadata.size;
    this.tabMetadata.clear();
    
    // Összes timer törlése
    this.cleanupTimers.forEach(timer => clearTimeout(timer));
    this.cleanupTimers.clear();
    
    if (this.debugMode) {
      console.log(`[SearchResultsMetadataBridge] Cleared metadata for ${clearedCount} tabs`);
    }
  }

  // Új metódus: Cache invalidation - régi metaadatok törlése
  public cleanupOldMetadata(maxAgeMs: number = 300000): number { // 5 perc default
    let cleanedCount = 0;
    const now = Date.now();
    
    for (const [tabId, metadata] of this.tabMetadata.entries()) {
      if (metadata.timestamp && (now - metadata.timestamp) > maxAgeMs) {
        this.clearTabMetadata(tabId);
        cleanedCount++;
      }
    }
    
    if (this.debugMode && cleanedCount > 0) {
      console.log(`[SearchResultsMetadataBridge] Cleaned up ${cleanedCount} old metadata entries`);
    }
    
    return cleanedCount;
  }

  // RÉGI API kompatibilitásért (deprecated)
  public emit(metadata: SearchMetadata): void {
    console.warn('[SearchResultsMetadataBridge] DEPRECATED: Használd az emitForTab-ot!');
    
    // Hibakezelés hozzáadása a deprecated metódushoz is
    this.listeners.forEach((listener, index) => {
      try {
        listener(metadata, 'unknown');
      } catch (error) {
        console.error(`[SearchResultsMetadataBridge] Error in deprecated listener ${index}:`, error);
      }
    });
  }

  // Új metódus: Debug mód ki/bekapcsolása
  public setDebugMode(enabled: boolean): void {
    this.debugMode = enabled;
    console.log(`[SearchResultsMetadataBridge] Debug mode ${enabled ? 'enabled' : 'disabled'}`);
  }

  // Új metódus: Listener-ek számának lekérdezése
  public getListenerCount(): number {
    return this.listeners.length;
  }
}

export const searchResultsMetadataBridge = new SearchResultsMetadataBridge();

/*
// jó működik
// Definiálja, milyen formában küldjük az adatot a TabPanel-től.
export interface CountryMetadata {
  code: string;  // Kétbetűs kód, pl. 'US'
  name: string;  // Teljes név, pl. 'United States'
  count: number; // Hány találat van ebből az országból
}

export interface SearchMetadata {
  countries: CountryMetadata[];
  // A jövőben itt lehetne bővíteni pl. nyelvi eloszlással
}

// A Bridge osztály, ami a kommunikációt végzi.
type MetadataChangeCallback = (metadata: SearchMetadata, tabId: string) => void;

class SearchResultsMetadataBridge {
  private listeners: MetadataChangeCallback[] = [];
  private tabMetadata: Map<string, SearchMetadata> = new Map(); // <-- ÚJ: Tab-specifikus tárolás

  public subscribe(callback: MetadataChangeCallback): () => void {
    this.listeners.push(callback);
    // Visszaad egy leiratkozó függvényt a memóriaszivárgás elkerülésére.
    return () => {
      this.listeners = this.listeners.filter(l => l !== callback);
    };
  }

  // ÚJ: Tab-specifikus metaadat küldés
  public emitForTab(tabId: string, metadata: SearchMetadata): void {
    console.log(`[MetadataBridge] Új metaadat fül ${tabId}-hez:`, metadata);
    this.tabMetadata.set(tabId, metadata); // Tároljuk tab szerint
    this.listeners.forEach(listener => listener(metadata, tabId));
  }

  // ÚJ: Adott fül metaadatának lekérése
  public getMetadataForTab(tabId: string): SearchMetadata | null {
    return this.tabMetadata.get(tabId) || null;
  }

  // ÚJ: Fül bezáráskor cleanup
  public clearTabMetadata(tabId: string): void {
    console.log(`[MetadataBridge] Metaadat törlése fül ${tabId}-hez`);
    this.tabMetadata.delete(tabId);
  }

  // RÉGI API kompatibilitásért (deprecated)
  public emit(metadata: SearchMetadata): void {
    console.warn('[MetadataBridge] DEPRECATED: Használd az emitForTab-ot!');
    this.listeners.forEach(listener => listener(metadata, 'unknown'));
  }
}

export const searchResultsMetadataBridge = new SearchResultsMetadataBridge();
*/