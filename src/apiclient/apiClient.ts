/**
 * src\apiclient\apiClient.ts
 * API kliens a News alkalmazáshoz
 */
import { endpoints } from './endpoints';
// import { NewsSource } from '../types'; // Egyelőre nem használjuk, de később szükség lehet rá
import { ArticleData } from '../utils/datamanager/types/storage'; // Javított elérési út
// import { ArticleSyncRequest as SyncRequest, ApiResponse as SyncResponse, ArticleSyncItem as SyncChanges } from '../utils/datamanager/types/api'; // Régi import
import {
  ArticleSyncRequest as SyncRequest,
  ApiResponse, // ArticleSyncItem importálása (SyncChanges alias elhagyható, ha máshol nem kell)
  SyncResponseData, // Az új SyncResponseData importálása
  SyncPayloadChanges, // Importáljuk ezt is a countChanges metódushoz
} from '../utils/datamanager/types/api';

// ========================================
// 🎥 VIDEO TYPES - ÚJ VIDEÓ TÍPUSOK!
// ========================================
// Ez CSAK videó híreket kezel!
// NEM keverjük a sima hírekkel!

export interface YouTubeVideo {
  id: string;
  videoId: string;
  title: string;
  link: string;
  thumbnail: string;
  description: string;
  published: string;
  views?: number;
  author: string;
  type: 'youtube';
  channelId: string;
  channelName: string;
}

export interface VideoNewsResponse {
  success: boolean;
  count: number;
  videos: YouTubeVideo[];
}

// Típus definiálása az API PUT metódusához, any helyett
interface ApiRequestData {
  [key: string]: string | number | boolean | null | undefined | string[] | ApiRequestData;
}

// DbRow típus definiálása a NewsSource-ból való konverzióhoz
// Frissítve, hogy kompatibilis legyen az ApiRequestData-val
export interface DbRow {
  eredeti_id: string;
  cim: string;
  url: string;
  rss_feed: string | null;
  orszag: string;
  nyelv: string;
  fontossag: number;
  sections?: string;
  kontinens?: string; // Új mező hozzáadása
  aktiv?: boolean; // Forrás aktív állapota
  [key: string]: string | number | boolean | null | undefined; // Index szignatúra hozzáadása
}

export interface DbSourceRow {
  id: string;
  name: string;
  url: string;
  country: string;
  continent: string;
  fontossag: number;
  language: string;
  rssFeed?: string; // Új mező az RSS feed URL tárolására
  active?: boolean; // Forrás aktív állapota
}

export interface SearchResultItem {
  id: number;
  title: string;
  url: string;
  description: string;
  published_at: string;
  source_slug: string;
  country_code: string;
  image_url: string;
  relevance: number;
  // Új, szerverről érkező mezők
  source_name?: string;
  continent?: string;
  orszag?: string;
  match_language?: string;
}

export interface SearchResponse {
  query?: string;
  language?: string;
  totalResults?: number;
  limit?: number;
  offset?: number;
  results: SearchResultItem[];
  // Új meta objektum
  meta?: {
    totalResults?: number;
    languageBreakdown?: { [key: string]: number };
  };
}

// ÚJ: Keresési paraméterek típusdefiníciója
export interface SearchNewsParams {
  q: string;
  lang?: string;
  countries?: string; // ÚJ: országkódok vesszővel elválasztva
  limit?: number;
  offset?: number;
}

/**
 * API kliens osztály
 */
export class ApiClient {
  private static instance: ApiClient | null = null;
  private baseUrl: string;

  constructor(baseUrl: string = endpoints.postgres.baseUrl) {
    this.baseUrl = baseUrl;
    console.log('[ApiClient] Inicializálva:', this.baseUrl);
  }

  /**
   * Singleton pattern - egyetlen ApiClient példány biztosítása
   */
  public static getInstance(baseUrl?: string): ApiClient {
    if (!ApiClient.instance) {
      ApiClient.instance = new ApiClient(baseUrl);
    }
    return ApiClient.instance;
  }

  // Általános API hívás - bővített naplózással
  private async apiCall<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    console.log(`[ApiClient] Kérés: ${url}`);

    try {
      // 📱 MOBILE FIX: 30 másodperces timeout hozzáadása
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000);
      
      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
      });
      
      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`API hiba: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      console.log(
        `[ApiClient] Sikeres válasz: ${url}`,
        Array.isArray(data) ? `(${data.length} elem)` : 'sikeres',
      );
      return data as T;
    } catch (error) {
      // 📱 MOBILE FIX: Specifikus timeout hiba üzenet
      if (error instanceof Error && error.name === 'AbortError') {
        console.error(`[ApiClient] 📱 Timeout (30s): ${url}`);
        throw new Error('Kérés túllépi az időkorlátot. Ellenőrizd a kapcsolatot!');
      }
      console.error(`[ApiClient] Hiba: ${url}`, error);
      throw error;
    }
  }

  // PostgreSQL API hívások
  private async postgresApiCall<T>(endpoint: string): Promise<T> {
    return this.apiCall<T>(endpoint);
  }

  // PostgreSQL adatok írása PUT metódussal - any helyett ApiRequestData
  private async postgresApiPut<T>(endpoint: string, data: ApiRequestData): Promise<T> {
    return this.apiCall<T>(endpoint, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  // PostgreSQL adatok írása DELETE metódussal
  private async postgresApiDelete<T>(endpoint: string): Promise<T> {
    return this.apiCall<T>(endpoint, {
      method: 'DELETE',
    });
  }

  // ========================================
  // 🎥 VIDEO API METÓDUSOK - ÚJ VIDEÓ FUNKCIÓK!
  // ========================================
  // Ez CSAK videó híreket kér le!
  // NEM keverjük a sima hírekkel!

  /**
   * Videó hírek lekérése a YouTube aggregatorból
   */
  async getVideoNews(params?: { country?: string; maxVideos?: number; maxAgeDays?: number }): Promise<VideoNewsResponse> {
    console.log('[ApiClient] getVideoNews hívás params:', params);
    try {
      console.log('[ApiClient] 🎥 Videó hírek lekérése...');
      let url = endpoints.videoNews;
      
      // Query paraméterek összeállítása
      const queryParams = new URLSearchParams();
      if (params?.country) {
        queryParams.append('country', params.country);
      }
      if (params?.maxVideos) {
        queryParams.append('maxVideos', params.maxVideos.toString());
      }
      if (params?.maxAgeDays) {
        queryParams.append('maxAgeDays', params.maxAgeDays.toString());
      }
      
      // URL összeállítása query paraméterekkel
      if (queryParams.toString()) {
        url += `?${queryParams.toString()}`;
      }
      
      console.log('[ApiClient] 🎥 API URL:', url);
      const response = await this.apiCall<VideoNewsResponse>(url);
      console.log(`[ApiClient] 🎥 ${response.count} videó hír sikeresen lekérdezve`);
      return response;
    } catch (error) {
      console.error('[ApiClient] 🎥 Hiba a videó hírek lekérésekor:', error);
      throw error;
    }
  }

  // Ping teszt a szerverkapcsolat ellenőrzéséhez
  async ping(): Promise<{ status: string; time: Date }> {
    return this.postgresApiCall<{ status: string; time: Date }>(endpoints.postgres.ping);
  }

  /**
   * Health check a szerver állapot ellenőrzéséhez
   * Ez a metódus ellenőrzi, hogy a szerver teljesen betöltött-e
   */
  async healthCheck(): Promise<{ status: string; timestamp: string; uptime: number; environment: string }> {
    return this.apiCall<{ status: string; timestamp: string; uptime: number; environment: string }>('/api/health');
  }

  /**
   * Várakozás a szerver teljes betöltésére
   * @param maxRetries - Maximum próbálkozások száma (alapértelmezett: 30)
   * @param retryDelay - Várakozás milliszekundumokban próbálkozások között (alapértelmezett: 1000ms)
   */
  async waitForServer(maxRetries: number = 30, retryDelay: number = 1000): Promise<boolean> {
    console.log('[ApiClient] Szerver elérhetőség ellenőrzése...');
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        console.log(`[ApiClient] Próbálkozás ${attempt}/${maxRetries}...`);
        await this.healthCheck();
        console.log('[ApiClient] ✅ Szerver elérhető!');
        return true;
      } catch (error) {
        console.log(`[ApiClient] ⏳ Szerver még nem elérhető (${attempt}/${maxRetries}):`, error);
        
        if (attempt === maxRetries) {
          console.error('[ApiClient] ❌ Szerver nem elérhető a maximális próbálkozások után');
          return false;
        }
        
        // Várakozás a következő próbálkozás előtt
        await new Promise(resolve => setTimeout(resolve, retryDelay));
      }
    }
    
    return false;
  }

  // Hírforrások lekérdezése kontinens alapján
  async getSourcesByContinent(continent: string): Promise<DbRow[]> {
    // Eltávolítva a kötőjel-szóköz átalakítás, ezt a szerver fogja kezelni
    return this.postgresApiCall<DbRow[]>(endpoints.postgres.continentSources(continent));
  }

  // Válasz konvertálása a megfelelő formátumra
  private convertDbRowToSourceRow(row: DbRow): DbSourceRow {
    return {
      id: row.eredeti_id,
      name: row.cim,
      url: row.url,
      country: row.orszag,
      continent: row.kontinens || '',
      fontossag: row.fontossag,
      language: row.nyelv,
      rssFeed: row.rss_feed || undefined, // Az RSS feed URL átvitele
      active: row.aktiv || true, // Alapértelmezetten aktív
    };
  }

  // Hírforrások lekérdezése ország alapján
  async getSourcesByCountry(country: string): Promise<DbSourceRow[]> {
    const rows = await this.postgresApiCall<DbRow[]>(endpoints.postgres.countrySources(country));
    return rows.map((row) => this.convertDbRowToSourceRow(row));
  }

  // Hírforrás lekérdezése azonosító alapján
  async getSourceById(id: string): Promise<DbRow | null> {
    return this.postgresApiCall<DbRow | null>(endpoints.postgres.sourceById(id));
  }

  // ÚJ: Összes hírforrás lekérdezése
  async getAllSources(): Promise<DbSourceRow[]> {
    // Ha van végpont az összes forrás lekérdezéséhez, azt használjuk
    if (endpoints.postgres.allSources) {
      const rows = await this.postgresApiCall<DbRow[]>(endpoints.postgres.allSources);
      return rows.map((row) => this.convertDbRowToSourceRow(row));
    }

    // Egyébként kigyűjtjük az összes országot és minden országból lekérjük a forrásokat
    const countries = await this.getAllCountries();
    const allSources: DbSourceRow[] = [];

    for (const country of countries) {
      const sources = await this.getSourcesByCountry(country);
      allSources.push(...sources);
    }

    return allSources;
  }

  // ÚJ: Forrás adatainak frissítése
  async updateSource(source: DbSourceRow): Promise<boolean> {
    try {
      // A DbSourceRow formátumú objektumot DbRow formátumba konvertáljuk
      const dbRow: DbRow = {
        eredeti_id: source.id,
        cim: source.name,
        url: source.url,
        rss_feed: source.rssFeed || null,
        orszag: source.country,
        nyelv: source.language,
        fontossag: source.fontossag,
        kontinens: source.continent,
        aktiv: source.active,
      };

      // Ellenőrizzük, hogy van-e megfelelő végpont
      if (!endpoints.postgres.updateSource) {
        console.warn('[ApiClient] A updateSource végpont nincs definiálva az endpoints.ts fájlban');
        // Mockolt sikeres válasz a fejlesztés folytatásához
        return true;
      }

      // PUT kérés a szerver felé a forrás frissítéséhez
      const result = await this.postgresApiPut<{ success: boolean }>(
        endpoints.postgres.updateSource(source.id),
        dbRow as ApiRequestData, // Explicit típuskonverzió az ApiRequestData-ra
      );

      return result.success;
    } catch (error) {
      console.error('[ApiClient] Hiba a forrás frissítésekor:', error);
      return false;
    }
  }

  // ÚJ: Forrás státuszának frissítése (aktív/inaktív)
  async updateSourceStatus(id: string, status: { active: boolean }): Promise<boolean> {
    try {
      // Ellenőrizzük, hogy van-e megfelelő végpont
      if (!endpoints.postgres.updateSourceStatus) {
        console.warn(
          '[ApiClient] A updateSourceStatus végpont nincs definiálva az endpoints.ts fájlban',
        );
        // Mockolt sikeres válasz a fejlesztés folytatásához
        return true;
      }

      // PUT kérés a szerver felé a forrás státuszának frissítéséhez
      const result = await this.postgresApiPut<{ success: boolean }>(
        endpoints.postgres.updateSourceStatus(id),
        { active: status.active },
      );

      return result.success;
    } catch (error) {
      console.error('[ApiClient] Hiba a forrás státuszának frissítésekor:', error);
      return false;
    }
  }

  // ÚJ: Forrás törlése
  async deleteSource(id: string): Promise<boolean> {
    try {
      // Ellenőrizzük, hogy van-e megfelelő végpont
      if (!endpoints.postgres.deleteSource) {
        console.warn('[ApiClient] A deleteSource végpont nincs definiálva az endpoints.ts fájlban');
        // Mockolt sikeres válasz a fejlesztés folytatásához
        return true;
      }

      // DELETE kérés a szerver felé a forrás törléséhez
      const result = await this.postgresApiDelete<{ success: boolean }>(
        endpoints.postgres.deleteSource(id),
      );

      return result.success;
    } catch (error) {
      console.error('[ApiClient] Hiba a forrás törlésekor:', error);
      return false;
    }
  }

  // Összes ország lekérdezése
  async getAllCountries(): Promise<string[]> {
    return this.postgresApiCall<string[]>(endpoints.postgres.allCountries);
  }

  // Nyilvános metódus az országok betű szerinti lekérdezéséhez
  async getCountriesByLetter(letter: string): Promise<string[]> {
    return this.postgresApiCall<string[]>(endpoints.postgres.countriesByLetter(letter));
  }

  /**
   * Cikk mentése a szerverre
   * @param article A mentendő cikk adatai
   */
  async saveArticle(article: ArticleData): Promise<void> {
    try {
      console.log('[ApiClient] Cikk mentése:', article.id);
      const url = `${this.baseUrl}${endpoints.saveArticle}`;
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.getAuthToken()}`,
        },
        body: JSON.stringify(article),
      });

      if (!response.ok) {
        throw new Error(`Cikk mentési hiba: ${response.status}`);
      }

      console.log('[ApiClient] Cikk sikeresen mentve:', article.id);
    } catch (error) {
      console.error('[ApiClient] Cikk mentési hiba:', error);
      throw error;
    }
  }

  /**
   * Kétirányú szinkronizáció a szerverrel
   * @param request Szinkronizációs kérés adatai
   * @returns A szerver által visszaadott módosítások
   */
  async synchronize(request: SyncRequest): Promise<ApiResponse<SyncResponseData>> {
    try {
      console.log('[ApiClient] Szinkronizáció indítása', {
        deviceId: request.deviceId,
        lastSync: new Date(request.lastSyncTimestamp),
      });

      const url = `${this.baseUrl}${endpoints.sync}`;
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.getAuthToken()}`,
        },
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        throw new Error(`Szinkronizációs hiba: ${response.status}`);
      }

      const data: ApiResponse<SyncResponseData> = await response.json(); // <<< Módosítva
      console.log('[ApiClient] Szinkronizáció sikeres', {
        receivedChanges: this.countChanges(data.data?.changes), // <<< Módosítva: data.data?.changes
      });

      return data;
    } catch (error) {
      console.error('[ApiClient] Szinkronizációs hiba:', error);
      throw error;
    }
  }

  // Helper metódus a változások számolásához - javítva a null érték kezelése
  private countChanges(changes?: SyncPayloadChanges | null): number {
    // <<< Típus módosítva
    if (!changes) return 0;
    let count = 0;
    if (changes.readArticles) count += changes.readArticles.length;
    if (changes.savedArticles) count += changes.savedArticles.length;
    if (changes.userPreferences) count += 1;
    return count;
  }

  // Hitelesítési token lekérése
  private getAuthToken(): string {
    return localStorage.getItem('auth-token') || '';
  }

  // Videós országok betű szerinti lekérdezése
  async getVideoCountries(): Promise<{ [letter: string]: unknown[] }> {
    return this.apiCall<{ [letter: string]: unknown[] }>(endpoints.videoCountries);
  }

  /**
   * Keresés a teljes hír adatbázisban
   * @param params Keresési paraméterek
   */
  async searchNews(params: SearchNewsParams): Promise<SearchResponse> {
    // Csak az engedélyezett nyelveket engedjük át
    const allowedLangs = ['en', 'hu'];
    const safeParams = {
      ...params,
      lang: params.lang && allowedLangs.includes(params.lang) ? params.lang as 'en' | 'hu' : undefined,
    };
    // --- LOG: országkód paraméter ---
    console.log('[ApiClient] searchNews countries param:', params.countries);
    const url = endpoints.searchNews(safeParams);
    return this.apiCall<SearchResponse>(url);
  }

  // ÚJ: Helyi hírek lekérése sourceId paraméterrel
  async getLocalNews(params: { country?: string; sourceId?: string; limit?: number; offset?: number } = {}): Promise<unknown> {
    let url = '/api/local/news';
    const query: string[] = [];
    if (params.country) query.push(`country=${encodeURIComponent(params.country)}`);
    if (params.sourceId) query.push(`sourceId=${encodeURIComponent(params.sourceId)}`);
    if (params.limit) query.push(`limit=${params.limit}`);
    if (params.offset) query.push(`offset=${params.offset}`);
    if (query.length) url += '?' + query.join('&');
    return this.apiCall(url);
  }
}

// Egyesített API kliens a PostgreSQL adatok lekéréséhez
const apiClientInstance = ApiClient.getInstance(); // ✅ JAVÍTÁS: Singleton pattern használata

export const apiClient = {
  getSourcesByContinent: async (continent: string): Promise<DbRow[]> => {
    // Átadjuk az eredeti kontinens azonosítót
    return apiClientInstance.getSourcesByContinent(continent);
  },
  getSourcesByCountry: async (country: string): Promise<DbSourceRow[]> => {
    return apiClientInstance.getSourcesByCountry(country);
  },
  getSourceById: async (id: string): Promise<DbRow | null> => {
    return apiClientInstance.getSourceById(id);
  },
  getAllCountries: async (): Promise<string[]> => {
    return apiClientInstance.getAllCountries();
  },
  ping: async (): Promise<{ status: string; time: Date }> => {
    return apiClientInstance.ping();
  },
  saveArticle: async (article: ArticleData): Promise<void> => {
    return apiClientInstance.saveArticle(article);
  },
  synchronize: async (request: SyncRequest): Promise<ApiResponse<SyncResponseData>> => {
    // <<< Módosítva
    return apiClientInstance.synchronize(request);
  },
  getCountriesByLetter: async (letter: string): Promise<string[]> => {
    return apiClientInstance.getCountriesByLetter(letter);
  },
  // ÚJ: Hozzáadott metódusok
  getAllSources: async (): Promise<DbSourceRow[]> => {
    return apiClientInstance.getAllSources();
  },
  updateSource: async (source: DbSourceRow): Promise<boolean> => {
    return apiClientInstance.updateSource(source);
  },
  updateSourceStatus: async (id: string, status: { active: boolean }): Promise<boolean> => {
    return apiClientInstance.updateSourceStatus(id, status);
  },
  deleteSource: async (id: string): Promise<boolean> => {
    return apiClientInstance.deleteSource(id);
  },
  // ========================================
  // 🎥 VIDEO API METÓDUSOK - ÚJ VIDEÓ FUNKCIÓK!
  // ========================================
  // Ez CSAK videó híreket kér le!
  // NEM keverjük a sima hírekkel!
  getVideoNews: async (params?: { country?: string; maxVideos?: number; maxAgeDays?: number }): Promise<VideoNewsResponse> => {
    return apiClientInstance.getVideoNews(params);
  },
  getVideoCountries: async (): Promise<{ [letter: string]: unknown[] }> => {
    return apiClientInstance.getVideoCountries();
  },
  // ÚJ: Helyi hírek lekérése sourceId paraméterrel
  getLocalNews: async (params: { country?: string; sourceId?: string; limit?: number; offset?: number } = {}): Promise<unknown> => {
    return apiClientInstance.getLocalNews(params);
  },
  
  // ÚJ: Full-text keresés a hírek között
  searchNews: async (params: SearchNewsParams): Promise<SearchResponse> => {
    return apiClientInstance.searchNews(params);
  },
};
