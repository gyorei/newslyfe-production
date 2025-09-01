import { DbSourceRow, apiClient } from '../../apiclient/apiClient';
import { RssSourceStatus, RssMonitorEventType, RssMonitorEvent, RssErrorCategory } from './monitor';

/**
 * RSS Források monitorozási szolgáltatása
 * - Ellenőrzi az RSS források állapotát
 * - Kezeli a monitorozási adatok cache-elését
 * - Esemény alapú követést biztosít a monitorozási folyamatokhoz
 */
// Eseménykezelő típus pontosítása
type RssMonitorEventListener = (event: RssMonitorEvent) => void;

// Segédfüggvény: van-e status property-je az error objektumnak
function hasStatus(obj: unknown): obj is { status: number } {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    'status' in obj &&
    typeof (obj as { status: unknown }).status === 'number'
  );
}
// Segédfüggvény: van-e message property-je az error objektumnak
function hasMessage(obj: unknown): obj is { message: string } {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    'message' in obj &&
    typeof (obj as { message: unknown }).message === 'string'
  );
}

// Konstansok a duplikáció elkerülése érdekében
const DEFAULT_ERROR_CATEGORY = 'other';
const UNKNOWN_ERROR_MESSAGE = 'Ismeretlen hiba';

class RssMonitorService {
  private eventListeners: Map<RssMonitorEventType, RssMonitorEventListener[]> = new Map();
  private errorLogs: RssMonitorEvent[] = [];
  private sourceCache: Map<string, RssSourceStatus> = new Map();
  private cacheDuration: number = 60 * 60 * 1000; // 1 óra alapértelmezetten

  /**
   * Feliratkozás monitor eseményekre
   */
  subscribe(eventType: RssMonitorEventType, callback: RssMonitorEventListener): () => void {
    if (!this.eventListeners.has(eventType)) {
      this.eventListeners.set(eventType, []);
    }

    this.eventListeners.get(eventType)!.push(callback);

    // Leiratkozás függvényének visszaadása
    return () => {
      const listeners = this.eventListeners.get(eventType);

      if (listeners) {
        const index = listeners.indexOf(callback);
        if (index !== -1) {
          listeners.splice(index, 1);
        }
      }
    };
  }

  /**
   * Esemény kiváltása
   */
  private emit(event: RssMonitorEvent): void {
    const listeners = this.eventListeners.get(event.type);

    if (listeners) {
      listeners.forEach((listener) => {
        try {
          listener(event);
        } catch (error) {
          console.error('Hiba az esemény figyelő meghívásakor:', error);
        }
      });
    }

    // Hibák naplózása
    if (event.type === 'error') {
      this.errorLogs.push(event);
    }
  }

  /**
   * Összes hibanapló lekérése
   */
  getAllErrors(): RssMonitorEvent[] {
    return [...this.errorLogs];
  }

  /**
   * Hibanaplók törlése
   */
  clearErrorLogs(): void {
    this.errorLogs = [];
    this.emit({
      type: 'maintenance',
      timestamp: Date.now(),
      message: 'Hibanaplók törölve',
    });
  }

  /**
   * Cache törlése
   */
  clearCache(): void {
    this.sourceCache.clear();
    this.emit({
      type: 'maintenance',
      timestamp: Date.now(),
      message: 'Monitor cache törölve',
    });
  }

  /**
   * Monitorozási statisztikák lekérése
   */
  getMonitoringStatistics(): {
    cacheEntries: number;
    totalErrorCount: number;
    errorsByCategory: Record<string, number>;
  } {
    return {
      cacheEntries: this.sourceCache.size,
      totalErrorCount: this.errorLogs.length,
      // Hibastatisztikák kategóriánként - javított típuskezelés
      errorsByCategory: this.errorLogs.reduce(
        (acc: Record<string, number>, error) => {
          const category = (error.errorCategory as string) || DEFAULT_ERROR_CATEGORY;
          acc[category] = (acc[category] || 0) + 1;
          return acc;
        },
        {} as Record<string, number>,
      ),
    };
  }

  /**
   * Egyetlen forrás ellenőrzése
   */
  async checkSource(source: DbSourceRow): Promise<RssSourceStatus> {
    // Először ellenőrizzük, hogy van-e érvényes cache az adott forráshoz
    const cachedStatus = this.getCachedStatus(source);
    if (cachedStatus) {
      this.emit({
        type: 'cache-hit',
        timestamp: Date.now(),
        sourceId: source.id,
        sourceName: source.name,
        sourceUrl: source.rssFeed,
        message: `Cache találat: ${source.name}`,
      });
      return cachedStatus;
    }

    // Nincs érvényes cache, ellenőrizzük a forrást
    return await this.performSourceCheck(source);
  }

  /**
   * Forrás állapot lekérése a cache-ből (ha van érvényes)
   */
  private getCachedStatus(source: DbSourceRow): RssSourceStatus | null {
    if (!source.rssFeed) return null; // Nincs RSS forrás

    const cached = this.sourceCache.get(source.id);

    if (!cached) return null;

    // Ellenőrizzük, hogy a cache még érvényes-e
    const now = new Date().getTime();
    const lastChecked = cached.lastChecked.getTime();

    if (now - lastChecked < this.cacheDuration) {
      return cached;
    }

    return null;
  }

  /**
   * Egy forrás tényleges ellenőrzését végzi
   */
  private async performSourceCheck(source: DbSourceRow): Promise<RssSourceStatus> {
    // Ha nincs RSS feed URL, eleve hibás a forrás
    if (!source.rssFeed) {
      const status: RssSourceStatus = {
        source,
        active: false,
        error: 'Nincs megadva RSS feed URL',
        lastChecked: new Date(),
        itemCount: 0,
        errorCategory: RssErrorCategory.NOT_FOUND,
      };

      this.cacheSourceStatus(status);
      this.emitErrorEvent(status);

      return status;
    }

    // Esemény küldése az ellenőrzés kezdetéről
    this.emit({
      type: 'check-start',
      timestamp: Date.now(),
      sourceId: source.id,
      sourceName: source.name,
      sourceUrl: source.rssFeed,
      message: `Ellenőrzés kezdése: ${source.name}`,
    });

    try {
      // Teljesítménymérés kezdése
      const startTime = performance.now();

      // Feed adatok lekérése (valódi implementációban az apiClient.fetchRssFeed hívása)
      const response = await this.fetchRssFeed(source.rssFeed);

      // Teljesítménymérés vége
      const endTime = performance.now();
      const responseTime = endTime - startTime;

      // Sikeres ellenőrzés
      const status: RssSourceStatus = {
        source,
        active: true,
        lastChecked: new Date(),
        itemCount: response.items.length,
        responseTime,
        feedTitle: response.title,
        lastSuccessfulCheck: new Date(),
      };

      // Cache frissítése
      this.cacheSourceStatus(status);

      // Teljesítmény esemény küldése
      this.emit({
        type: 'performance',
        timestamp: Date.now(),
        sourceId: source.id,
        sourceName: source.name,
        sourceUrl: source.rssFeed,
        responseTime,
        message: `Válaszidő: ${Math.round(responseTime)}ms (${source.name})`,
      });

      // Esemény küldése az ellenőrzés végéről
      this.emit({
        type: 'check-end',
        timestamp: Date.now(),
        sourceId: source.id,
        sourceName: source.name,
        sourceUrl: source.rssFeed,
        itemCount: response.items.length,
        message: `Ellenőrzés befejezve: ${source.name} (${response.items.length} elem)`,
      });

      return status;
    } catch (error: unknown) {
      // Hiba típus meghatározása
      const errorCategory = this.categorizeError(error);

      // Hibás ellenőrzés
      const status: RssSourceStatus = {
        source,
        active: false,
        error: error instanceof Error ? error.message : UNKNOWN_ERROR_MESSAGE,
        errorCategory,
        lastChecked: new Date(),
        itemCount: 0,
      };

      // Cache frissítése
      this.cacheSourceStatus(status);

      // Hiba esemény küldése
      this.emitErrorEvent(status);

      return status;
    }
  }

  /**
   * Hiba típusának meghatározása
   */
  private categorizeError(error: unknown): RssErrorCategory {
    const errorMsg = hasMessage(error) ? error.message.toLowerCase() : '';

    if (hasStatus(error)) {
      if (error.status === 404 || errorMsg.includes('not found')) {
        return RssErrorCategory.NOT_FOUND;
      }
      if (error.status >= 500 && error.status < 600) {
        return RssErrorCategory.SERVER_ERROR;
      }
    }
    if (errorMsg.includes('parse') || errorMsg.includes('xml') || errorMsg.includes('syntax')) {
      return RssErrorCategory.PARSE_ERROR;
    }
    if (errorMsg.includes('timeout') || errorMsg.includes('timed out')) {
      return RssErrorCategory.TIMEOUT;
    }
    if (errorMsg.includes('cors') || errorMsg.includes('origin')) {
      return RssErrorCategory.CORS;
    }
    if (error instanceof Error) {
      return RssErrorCategory.EXCEPTION;
    }
    return RssErrorCategory.OTHER;
  }

  /**
   * Hibaesemény küldése
   */
  private emitErrorEvent(status: RssSourceStatus): void {
    this.emit({
      type: 'error',
      timestamp: Date.now(),
      sourceId: status.source.id,
      sourceName: status.source.name,
      sourceUrl: status.source.rssFeed,
      error: status.error,
      errorCategory: status.errorCategory,
      message: `Hiba: ${status.source.name} - ${status.error}`,
    });
  }

  /**
   * Forrás állapot cache-elése
   */
  private cacheSourceStatus(status: RssSourceStatus): void {
    this.sourceCache.set(status.source.id, status);
  }

  /**
   * Összes forrás ellenőrzése (kötegelt feldolgozással)
   */
  async checkAllSources(sources: DbSourceRow[]): Promise<RssSourceStatus[]> {
    // Ha nincs forrás, üres tömböt adunk vissza
    if (!sources.length) return [];

    // Kötegméret: egyszerre ennyi forrást ellenőrzünk
    const batchSize = 10;
    const totalBatches = Math.ceil(sources.length / batchSize);

    // Batch-kezdési esemény
    this.emit({
      type: 'batch-start',
      timestamp: Date.now(),
      totalBatches,
      sourceCount: sources.length,
      message: `${sources.length} forrás ellenőrzésének kezdése ${totalBatches} kötegben`,
    });

    const results: RssSourceStatus[] = [];

    // Források feldolgozása kötegekben
    for (let i = 0; i < sources.length; i += batchSize) {
      const batch = sources.slice(i, i + batchSize);
      const currentBatch = Math.floor(i / batchSize) + 1;

      // Batch-előrehaladási esemény
      this.emit({
        type: 'batch-progress',
        timestamp: Date.now(),
        currentBatch,
        totalBatches,
        message: `Források ellenőrzése: ${currentBatch}/${totalBatches} köteg (${i + 1}-${Math.min(i + batchSize, sources.length)}/${sources.length})`,
      });

      // Köteg párhuzamos feldolgozása
      const batchPromises = batch.map((source) => this.checkSource(source));
      const batchResults = await Promise.all(batchPromises);

      // Eredmények összegyűjtése
      results.push(...batchResults);
    }

    // Batch-befejezési esemény
    this.emit({
      type: 'batch-end',
      timestamp: Date.now(),
      successCount: results.filter((r) => r.active).length,
      errorCount: results.filter((r) => !r.active).length,
      message: `${sources.length} forrás ellenőrzése befejezve`,
    });

    return results;
  }

  /**
   * Mock függvény az RSS adat lekéréséhez
   * Valós rendszerben ez az apiClient-en keresztül történne
   */
  private async fetchRssFeed(
    url: string,
  ): Promise<{ url: string; title: string; items: { id: string; title: string; date: Date }[] }> {
    // Véletlenszerű sikeres és sikertelen hívások szimulálása tesztelés céljából
    // Egyelőre mindent jó feedként kezelünk, a tesztelés kedvéért
    // Normál működésben ez az API kliens hívását végezné
    if (Math.random() > 0.1) {
      // Sikeres hívás - 90% esély
      return {
        url,
        title: `Feed ${url.substr(-10)}`,
        items: Array.from({ length: Math.floor(Math.random() * 15) + 5 }, (_, i) => ({
          id: `item-${i}`,
          title: `Cikk ${i + 1}`,
          date: new Date(),
        })),
      };
    } else {
      // Hiba szimulálása - 10% esély
      const errorTypes = [
        { message: 'Network error', status: 0 },
        { message: 'Not found', status: 404 },
        { message: 'XML Parse error', status: 200 },
        { message: 'Server error', status: 500 },
        { message: 'Timeout', status: 0 },
        { message: 'CORS policy', status: 0 },
      ];

      const error = errorTypes[Math.floor(Math.random() * errorTypes.length)];
      const simulatedError = new Error(error.message);
      (simulatedError as Error & { status?: number }).status = error.status;

      throw simulatedError;
    }
  }

  /**
   * Forrás javítása (új URL beállítása)
   */
  async fixSource(sourceId: string, newUrl: string): Promise<boolean> {
    try {
      // Először ellenőrizzük, hogy az új URL működik-e
      await this.fetchRssFeed(newUrl);

      // Ha nem dobott hibát, akkor az URL működik, frissítsük az adatbázisban
      // Valós implementációban API hívást végeznénk
      // Mivel az updateSourceRssUrl metódus nem létezik, alternatív megközelítés:
      // Először lekérjük a forrást ID alapján
      const source = await apiClient.getSourceById(sourceId);
      if (!source) return false;

      // Majd frissítjük a forrást a teljes objektum küldésével
      // Mivel ez a metódus sincs implementálva, csak jelezzük, hogy ez történne
      console.log(`[RssMonitorService] Forrás URL frissítése (mockolt): ${sourceId}, ${newUrl}`);

      // Ideális esetben itt történne az API hívás:
      // const success = await apiClient.updateSource({
      //   ...source,
      //   rssFeed: newUrl
      // });

      // Mockolt válasz a teszt céljából
      const success = true;

      if (success) {
        // Frissítsük a cache-t is
        const cachedSource = this.sourceCache.get(sourceId)?.source;

        if (cachedSource) {
          // A forrást módosítjuk az új URL-lel
          const updatedSource = {
            ...cachedSource,
            rssFeed: newUrl,
          };

          // Új ellenőrzést végzünk
          await this.performSourceCheck(updatedSource);

          // Értesítés a sikeres javításról
          this.emit({
            type: 'maintenance',
            timestamp: Date.now(),
            sourceId,
            sourceUrl: newUrl,
            message: `Forrás javítva: ${cachedSource.name} (${sourceId})`,
          });
        }
      }

      return success;
    } catch (error) {
      // Az új URL sem működik
      console.error('Hiba a forrás javítása során:', error);

      this.emit({
        type: 'error',
        timestamp: Date.now(),
        sourceId,
        sourceUrl: newUrl,
        error: error instanceof Error ? error.message : UNKNOWN_ERROR_MESSAGE,
        message: `Nem sikerült javítani a forrást: ${sourceId} - ${newUrl}`,
      });

      return false;
    }
  }

  /**
   * Forrás törlése
   */
  async deleteSource(sourceId: string): Promise<boolean> {
    try {
      // Valós implementációban API hívást végeznénk
      // Mivel a deleteSource metódus nem létezik, mockoljuk a választ
      console.log(`[RssMonitorService] Forrás törlése (mockolt): ${sourceId}`);

      // Ideális esetben itt történne az API hívás:
      // const success = await apiClient.deleteSource(sourceId);

      // Mockolt válasz a teszt céljából
      const success = true;

      if (success) {
        // Töröljük a cache-ből
        this.sourceCache.delete(sourceId);

        // Értesítés a sikeres törlésről
        this.emit({
          type: 'maintenance',
          timestamp: Date.now(),
          sourceId,
          message: `Forrás törölve: ${sourceId}`,
        });
      }

      return success;
    } catch (error) {
      console.error('Hiba a forrás törlése során:', error);

      this.emit({
        type: 'error',
        timestamp: Date.now(),
        sourceId,
        error: error instanceof Error ? error.message : UNKNOWN_ERROR_MESSAGE,
        message: `Nem sikerült törölni a forrást: ${sourceId}`,
      });

      return false;
    }
  }
}

// Singleton példány, hogy mindenhol ugyanazt a példányt használjuk
const rssMonitorService = new RssMonitorService();
export default rssMonitorService;
