Pontosan jól gondolod:  
**A keresési találatok szűrőjén (SearchFilters.tsx) csak azokat az országokat kell megjeleníteni, amelyek a jelenlegi találati listában ténylegesen előfordulnak.**  
Nincs értelme a teljes, 200+ országos listát mutatni, ha például a "war" keresésre csak USA, Izrael és Németország hírei vannak.

**A legjobb UX:**
- A szűrőpanel csak azokat az országokat mutatja, amelyek a találatokban szerepelnek.
- A felhasználó ezek közül választhat, és a lista dinamikusan frissül, ha új keresés történik.

**Megvalósítás:**
- A SearchFilters.tsx-nek nem kell külön ország API-t hívnia.
- A szülő komponens (pl. a TabPanel vagy Home) átadja prop-ként a találatokból kigyűjtött országokat.
- A szűrőpanel ezekből generálja a választható országokat.

**Összefoglalva:**  
A keresési szűrőben csak a találatokban előforduló országokat jelenítsd meg – ez a leglogikusabb, legfelhasználóbarátabb megoldás!  
Nem kell a teljes országlistát API-ból lekérni, csak a találatokból kigyűjteni az országokat, és azt átadni a szűrőpanelnek.

===============================================================
// src\components\Utility\Settings\SearchFilters\SearchFilters.tsx
import React from 'react';
import styles from './SearchFilters.module.css';
import LanguageFilter from '../../../LanguageFilter/LanguageFilter';
import { useSearchFilters } from '../../../../hooks/useSearchFilters';
import { CountryFilter, GroupedCountryOption } from './CountryFilter/CountryFilter';

// Egyszerű AccordionSection komponens (ha nincs külön)
const AccordionSection: React.FC<{ title: string; defaultOpen?: boolean; children: React.ReactNode }> = ({ title, defaultOpen = false, children }) => {
  const [open, setOpen] = React.useState(defaultOpen);
  return (
    <div className={styles.accordionSection}>
      <div className={styles.accordionHeader} onClick={() => setOpen((v) => !v)}>
        <span>{title}</span>
        <span>{open ? '▼' : '▶'}</span>
      </div>
      {open && <div className={styles.accordionContent}>{children}</div>}
    </div>
  );
};

// --- MOCK ORSZÁG ADATOK ---
const mockCountryOptions: GroupedCountryOption[] = [
  {
    label: 'Europe',
    options: [
      { value: 'HU', label: '🇭🇺 Hungary' },
      { value: 'DE', label: '🇩🇪 Germany' },
      { value: 'GB', label: '🇬🇧 United Kingdom' },
      { value: 'FR', label: '🇫🇷 France' },
    ],
  },
  {
    label: 'North America',
    options: [
      { value: 'US', label: '🇺🇸 United States' },
      { value: 'CA', label: '🇨🇦 Canada' },
    ],
  },
  {
    label: 'Asia',
    options: [
      { value: 'JP', label: '🇯🇵 Japan' },
      { value: 'CN', label: '🇨🇳 China' },
    ],
  },
];

export const SearchFilters: React.FC = () => {
  const { filters, updateFilters, resetFilters } = useSearchFilters();

  // Mock adatok a nyelvekhez
  const languageBreakdown = { en: 120, hu: 85 };
  const supportedLanguages = {
    all: 'Minden nyelv',
    en: 'Angol',
    hu: 'Magyar'
  };
  
  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h2>Search Filters</h2>
        <button onClick={resetFilters} className={styles.resetButton}>
          Reset Filters
        </button>
      </div>
      
      <AccordionSection title="Language" defaultOpen={true}>
        <LanguageFilter
          supportedLanguages={supportedLanguages}
          activeLanguage={filters.lang}
          languageBreakdown={languageBreakdown}
          onLanguageChange={(lang) => updateFilters({ lang })}
        />
      </AccordionSection>

      <AccordionSection title="Country" defaultOpen={true}>
        <CountryFilter
          options={mockCountryOptions}
          selectedCountries={filters.countries}
          onChange={(countries) => updateFilters({ countries })}
        />
      </AccordionSection>
      
      <AccordionSection title="Advanced Filters">
        <p style={{ color: '#888', fontStyle: 'italic' }}>
          TODO: Ide jönnek majd a forrás, kategória és egyéb szűrők.
        </p>
      </AccordionSection>
    </div>
  );
};


 SearchFilters.tsx
Feladat: A mockCountryOptions helyett API-ból töltse be az országokat.
Érintett:
SearchFilters.tsx
======================================================

// src/components/Utility/Settings/SearchFilters/CountryFilter/CountryFilter.tsx
import React from 'react';
import Select, { GroupBase, StylesConfig } from 'react-select';
import styles from './CountryFilter.module.css';

export interface CountryOption {
  value: string;
  label: string;
}

export interface GroupedCountryOption {
  label: string;
  options: CountryOption[];
}

interface CountryFilterProps {
  options: GroupedCountryOption[];
  selectedCountries: string[];
  onChange: (selected: string[]) => void;
  isLoading?: boolean;
}

const customStyles: StylesConfig<CountryOption, true, GroupBase<CountryOption>> = {
  control: (provided) => ({
    ...provided,
    borderColor: '#ccc',
    boxShadow: 'none',
    '&:hover': {
      borderColor: '#888',
    },
  }),
  multiValue: (provided) => ({
    ...provided,
    backgroundColor: '#e0e0e0',
    borderRadius: '4px',
  }),
  multiValueLabel: (provided) => ({
    ...provided,
    color: '#333',
    fontWeight: 500,
  }),
  multiValueRemove: (provided) => ({
    ...provided,
    color: '#555',
    ':hover': {
      backgroundColor: '#c0c0c0',
      color: 'white',
    },
  }),
};

export const CountryFilter: React.FC<CountryFilterProps> = ({
  options,
  selectedCountries,
  onChange,
  isLoading = false,
}) => {
  const selectedValues = options
    .flatMap(group => group.options)
    .filter(option => selectedCountries.includes(option.value));

  return (
    <div className={styles.filterWrapper}>
      <Select<CountryOption, true, GroupBase<CountryOption>>
        isMulti
        options={options}
        value={selectedValues}
        onChange={(selectedOptions) => {
          const newSelectedCountries = selectedOptions.map(option => option.value);
          onChange(newSelectedCountries);
        }}
        isLoading={isLoading}
        placeholder="Válassz egy vagy több országot..."
        styles={customStyles}
        closeMenuOnSelect={false}
      />
    </div>
  );
};

Feladat: Nem kell módosítani, csak az options propot mostantól dinamikusan kapja.
Érintett:
CountryFilter.tsx
===========================================================
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
      const response = await fetch(url, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
      });

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
Feladat: Már tartalmaz metódust: getAllCountries() (és akár getCountriesByLetter()), ezt kell használni a SearchFilters-ben.
Érintett:
apiClient.ts
======================================================
/**
 * src\apiclient\endpoints.ts
 * API végpont definíciók a News alkalmazáshoz
 */

import type { YouTubeFeedConfig } from '../backend/api/routes/video/videoAggregator/videoAggregator';
// import { videoChannelsByLetter, type CountryVideoChannels } from '../backend/api/routes/videoData/videoData';

export const endpoints = {
  baseUrl: import.meta.env.VITE_API_URL || 'https://api.newsapp.example.com/v1',

  // Szinkronizáció - JAVÍTVA: /api prefix hozzáadása
  sync: '/api/sync',

  // Cikkek
  articles: '/api/articles',
  article: (id: string) => `/api/articles/${id}`,
  saveArticle: '/api/articles/save',

  // Felhasználói adatok
  user: '/api/user',
  preferences: '/api/user/preferences',

  // Adatforrások
  sources: '/api/sources',
  categories: '/api/categories',

  // Keresés
  search: '/api/search',

  // ========================================
  // 🎥 VIDEO ENDPOINTS - ÚJ VIDEÓ API!
  // ========================================
  // Ez CSAK videó híreket ad vissza!
  // NEM keverjük a sima hírekkel!
  videoNews: '/api/video/news',
  videoCountries: '/api/video-countries',

  // PostgreSQL API - Frissítve az új API struktúrához
  postgres: {
    baseUrl: 'http://localhost:3002',

    // Kontinens-alapú végpontok - Új struktúra
    continentSources: (continent: string) =>
      `/api/continent/${encodeURIComponent(continent)}/sources`,

    // Új: Kontinens hírek lekérése
    continentNews: (continent: string) => `/api/continent/${encodeURIComponent(continent)}/news`,

    // Ország-alapú végpontok - Új struktúra
    countrySources: (country: string) => `/api/country/${encodeURIComponent(country)}/sources`,

    // Új: Ország hírek lekérése
    countryNews: (country: string) => `/api/country/${encodeURIComponent(country)}/news`,

    // Forrás-alapú végpontok - Új struktúra
    sourceById: (id: string) => `/api/sources/id/${encodeURIComponent(id)}`,

    // Lista végpontok
    allCountries: '/api/countries',

    // ORSZÁGBETŰ MODUL: Új végpont a betű szerinti országlekérdezéshez
    countriesByLetter: (letter: string) => `/api/countries/letter/${encodeURIComponent(letter)}`,

    // RSS ADMIN MODUL: Új végpontok a források kezeléséhez
    allSources: '/api/sources/all', // Összes forrás lekérdezése
    updateSource: (id: string) => `/api/sources/update/${encodeURIComponent(id)}`, // Forrás frissítése
    updateSourceStatus: (id: string) => `/api/sources/status/${encodeURIComponent(id)}`, // Forrás státuszának frissítése
    deleteSource: (id: string) => `/api/sources/delete/${encodeURIComponent(id)}`, // Forrás törlése

    // Alapvető API ellenőrzés
    ping: '/api/ping',
  },
  localNews: (params?: { sourceId?: string; country?: string; limit?: number; offset?: number }) => {
    let url = '/api/local/news';
    const query: string[] = [];
    if (params?.country) query.push(`country=${encodeURIComponent(params.country)}`);
    if (params?.sourceId) query.push(`sourceId=${encodeURIComponent(params.sourceId)}`);
    if (params?.limit) query.push(`limit=${params.limit}`);
    if (params?.offset) query.push(`offset=${params.offset}`);
    if (query.length) url += '?' + query.join('&');
    return url;
  },
  // ÚJ: Keresés a hírek között (full-text search)
  searchNews: (params: { q: string; lang?: 'en' | 'hu'; countries?: string; limit?: number; offset?: number }) => {
    let url = '/api/search';
    const query: string[] = [];
    query.push(`q=${encodeURIComponent(params.q)}`); // A 'q' kötelező
    if (params.lang) query.push(`lang=${params.lang}`);
    if (params.countries) query.push(`countries=${encodeURIComponent(params.countries)}`); // ÚJ
    if (params.limit) query.push(`limit=${params.limit}`);
    if (params.offset) query.push(`offset=${params.offset}`);
    url += '?' + query.join('&');
    return url;
  },
};


Feladat: Már tartalmazza az országlistát adó végpontokat (allCountries, countriesByLetter), nem kell módosítani.
Érintett:
endpoints.ts
========================================================
// src/hooks/useSearchFilters.ts
import { useSearchParams } from 'react-router-dom';
import { useMemo, useCallback, useEffect } from 'react';
import { searchFiltersBridge } from '../components/Utility/Settings/SearchFilters/SearchFiltersBridge'; // ÚJ: Bridge import

export interface SearchFilters {
  lang: string;
  countries: string[];
}

export function useSearchFilters() {
  const [searchParams, setSearchParams] = useSearchParams();

  // 1. OLVASÁS: Az állapotot mindig közvetlenül az URL-ből olvassuk.
  const filters = useMemo((): SearchFilters => {
    const lang = searchParams.get('lang') || 'all';
    const countriesParam = searchParams.get('countries');
    const countries = countriesParam ? countriesParam.split(',') : [];
    return { lang, countries };
  }, [searchParams]);

  // --- PUB/SUB: Szűrőállapot közvetítése a bridge-en keresztül ---
  useEffect(() => {
    searchFiltersBridge.emit(filters);
  }, [filters]);

  // 2. ÍRÁS: Egyetlen, intelligens függvény a szűrők frissítésére.
  const updateFilters = useCallback((newValues: Partial<SearchFilters>) => {
    const newSearchParams = new URLSearchParams(searchParams);
    Object.entries(newValues).forEach(([key, value]) => {
      if (key === 'lang') {
        if (value && value !== 'all') {
          newSearchParams.set('lang', value as string);
        } else {
          newSearchParams.delete('lang');
        }
      }
      if (key === 'countries') {
        if (Array.isArray(value) && value.length > 0) {
          newSearchParams.set('countries', value.join(','));
        } else {
          newSearchParams.delete('countries');
        }
      }
    });
    setSearchParams(newSearchParams);
  }, [searchParams, setSearchParams]);

  // 3. RESET FUNKCIÓ: Egyszerűen törli a releváns paramétereket.
  const resetFilters = useCallback(() => {
    const newSearchParams = new URLSearchParams(searchParams);
    newSearchParams.delete('lang');
    newSearchParams.delete('countries');
    setSearchParams(newSearchParams);
  }, [searchParams, setSearchParams]);

  return {
    filters,        // Az aktuális szűrők objektuma
    updateFilters,  // A szűrők frissítésére szolgáló függvény
    resetFilters,   // A szűrők törlésére szolgáló függvény
  };
}
Feladat: Nem kell módosítani, a szűrőállapotot már helyesen kezeli, és a Bridge-en keresztül továbbítja.
Érintett:
useSearchFilters.ts
==========================================================
// src/components/Content/TabPanel.tsx

import * as React from 'react';
import { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import { Tab, NewsItem } from '../../types';
import { debounce } from 'lodash';
// --- ÚJ IMPORTOK A SZŰRÉSHEZ ---
import { apiClient } from '../../apiclient/apiClient';
import { convertSearchResultToNewsItem } from '../../utils/transformers';
import type { SearchFilters } from '../../hooks/useSearchFilters';
import { useNewsData } from '../Content/hooks/useNewsData';
import { useVideoData } from '../VideoPanel/useVideoData';
import { useStorage } from '../../hooks/useStorage';
import { useTabCache } from '../../hooks/useTabStorage/useTabCache';
import { useNewsItemsHash } from '../../utils/useNewsItemsHash';
import { TabContentData } from '../../utils/datamanager/storage/indexedDBTypes';
import { PanelHead } from '../Panel/PanelHead/PanelHead';
import { Card } from '../Card/Card';
import Pagination from '../Pagination/Pagination';
import { SourceIconBar } from '../SourceIconBar/SourceIconBar';
import LoadingProgressOverlay from '../LoadingProgressOverlay/LoadingProgressOverlay';
import AdSenseLayout from '../Ad/AdCard/AdSenseLayout';
import panelStyles from '../Panel/Panel.module.css';
import { useMediaQuery } from 'react-responsive';
import { settingsBridge, ITEMS_PER_PAGE_PREFERENCE_KEY } from '../Utility/Settings/ContentSettings/ContentSettingsPanelBridge';
import { timeSettingsBridge, MAX_AGE_HOURS_PREFERENCE_KEY } from '../Utility/Settings/ContentSettings/TimeSettings';
import { useDebugRender } from '../../utils/debugTools/debugTools';
import { injectAdsIntoNewsItems, AdCardItem } from '../Ad/AdCard';
import { ScrollContainer } from '../ScrollContainer/ScrollContainer';
import TabController from '../Tabs/TabController';
import { useTabPagination } from '../../hooks/useTabStorage/useTabPagination';
import My from '../Tabs/Home/My/My';
import { searchFiltersBridge } from '../Utility/Settings/SearchFilters/SearchFiltersBridge';

interface TabPanelProps {
  tab: Tab;
  isActive: boolean;
  searchResults?: NewsItem[];
  searchTerm?: string;
  isSearchMode?: boolean;
  onClearSearch?: () => void;
  onToggleMenu?: (cardId: string | undefined, anchorEl: HTMLElement | null, cardEl?: HTMLElement | null) => void;
  onSourceClick?: (sourceId?: string, source?: string) => void;
  onRefreshRegister?: (isActive: boolean, refreshFn: () => Promise<number>) => void;
  onNewsItemsUpdate?: (newsItems: NewsItem[]) => void;
  onChangeTabMode?: (tabId: string, mode: 'news' | 'new' | 'video') => void;
}

// ✅ ÚJ: Helyőrző komponens a BrowserView betöltése közben
function ArticlePlaceholder() {
  return (
    <div className={panelStyles.placeholderContainer}>
      <div className={panelStyles.loadingSpinner}></div>
      {/* <p>Cikk betöltése...</p> */}
    </div>
  );
}

const TabPanelComponent: React.FC<TabPanelProps> = ({
  tab,
  isActive,
  searchResults = [],
  searchTerm,
  isSearchMode,
  onClearSearch,
  onToggleMenu,
  onSourceClick,
  onRefreshRegister,
  onNewsItemsUpdate,
  onChangeTabMode,
}) => {
  useDebugRender(`TabPanel (${tab.title})`);
  const { id: activeTabId, title, mode, filters } = tab;

  console.log('[TabPanel] Render, activeTabId:', activeTabId, 'isActive:', isActive, 'mode:', mode);

  // --- STATE-EK ÉS REF-EK ---
  const [paginationTrigger, setPaginationTrigger] = useState(0);
  const abortControllerRef = useRef<AbortController | null>(null);
  const [requestToken, setRequestToken] = useState<string>('');
  const [newsLoaded, setNewsLoaded] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(50);
  const [maxAgeHours, setMaxAgeHours] = useState(24);
  const [showHorizontalScroller, setShowHorizontalScroller] = useState(false);
  const [isArticleViewActive, setArticleViewActive] = useState(false);

  // --- ÚJ ÁLLAPOTOK A DINAMIKUS SZŰRÉSHEZ ---
  const [dynamicResults, setDynamicResults] = useState<NewsItem[] | null>(null);
  const [isFilteredSearch, setIsFilteredSearch] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);
  const [isFiltering, setIsFiltering] = useState(false);

  // Utility hooks
  const isMobileOrTablet = useMediaQuery({ maxWidth: 1024 });
  const { getUserPreference } = useStorage();
  
  // ✅ JAVÍTÁS: Specifikus hook-ok használata a useTabStorage helyett
  const { savePaginationState, loadPaginationState } = useTabPagination(activeTabId);
  const { saveTabContent } = useTabCache();

  // Bridge védő referenciák
  const subscribedRef = useRef(false);
  const mountedRef = useRef(false);
  const preferencesLoadedRef = useRef(false);
  const previousFilteredCountRef = useRef<number>(0);

  // Token management
  useEffect(() => {
    const controller = new AbortController();
    abortControllerRef.current = controller;
    const newToken = Math.random().toString(36).substring(2, 15);
    setRequestToken(newToken);
    console.log('[TabPanel] Token frissítve:', activeTabId, '->', newToken);
    return () => controller.abort();
  }, [activeTabId]);

  // --- ADATBETÖLTŐ HOOK-OK ---
  const {
    newsItems,
    loading: newsDataLoading,
    error: newsError,
    handleRetry,
    refreshNewsData,
    loadMoreSources,
    hasMoreSources,
  } = useNewsData({
    activeTab: tab,
    isNewTab: mode === 'new',
    activeTabId,
    requestToken,
    abortSignal: abortControllerRef.current?.signal,
    setNewsItemsToken: setRequestToken,
  });

  const {
    videoItems,
    loading: videoLoading,
    error: videoError,
    refreshVideos,
  } = useVideoData({
    activeTabId,
    isVideoMode: mode === 'video',
    country: (filters?.country as string) || null,
  });

  const loading = useMemo(() => mode === 'video' ? videoLoading : newsDataLoading, [mode, videoLoading, newsDataLoading]);
  const error = useMemo(() => mode === 'video' ? videoError : newsError, [mode, videoError, newsError]);

  // --- ÚJ, ÖSSZEVONT LOADING ÁLLAPOT ---
  const overallLoading = useMemo(() => {
    return loading || searchLoading;
  }, [loading, searchLoading]);

  // --- CALLBACK-EK ---
  const handleConfigChange = useCallback((newMode: 'news' | 'browse' | 'search' | 'video') => {
    if (!onChangeTabMode) return;
    if (newMode === 'news' || newMode === 'video') {
      onChangeTabMode(activeTabId, newMode);
    } else if (newMode === 'browse') {
      onChangeTabMode(activeTabId, 'new');
    }
  }, [onChangeTabMode, activeTabId]);

  const handlePageChange = useCallback((newPage: number) => {
    setCurrentPage(newPage);
    if (activeTabId && activeTabId !== 'default') {
      savePaginationState(newPage, itemsPerPage, activeTabId);
    }
    setPaginationTrigger(prev => prev + 1);
  }, [activeTabId, itemsPerPage, savePaginationState]);

  const handleRefresh = useCallback(async (): Promise<number> => {
    setPaginationTrigger(p => p + 1);
    if (mode === 'video') {
      await refreshVideos();
      if (typeof window !== 'undefined') {
        try {
          const { ScrollStorage } = await import('../ScrollContainer/ScrollStorage');
          ScrollStorage.clear(`${activeTabId}-video`);
          setPaginationTrigger(p => p + 1);
        } catch (err) {
          console.warn('[TabPanel] ScrollStorage törlés hiba:', err);
        }
      }
      return videoItems?.length || 0;
    } else {
      const refreshed = await refreshNewsData(false);
      // Oldalszám visszaállítása az első oldalra frissítés után
      setCurrentPage(1);
      return refreshed?.length || 0;
    }
  }, [mode, refreshVideos, refreshNewsData, videoItems, activeTabId]);

  const handleCardClick = useCallback(async (url?: string) => {
    if (!url) return;
    
    console.log('[TabPanel] Card clicked:', { url, activeTabId });
    
    setArticleViewActive(true);
    await new Promise(resolve => setTimeout(resolve, 0));
    
    if (window.electronAPI && window.electronAPI.openArticleByPreference) {
      window.electronAPI.openArticleByPreference(url, { x: 0, y: 0, width: window.innerWidth, height: window.innerHeight });
    } else {
      window.open(url, '_blank', 'noopener,noreferrer');
      setArticleViewActive(false);
    }
  }, [activeTabId]);

  // --- API HÍVÓ FÜGGVÉNY A DINAMIKUS SZŰRÉSHEZ ---
  const fetchFilteredNews = useCallback(
    debounce(async (query: string, filters: SearchFilters) => {
      // Csak akkor fusson, ha van keresőszó
      if (!query?.trim()) return;
      
      console.log(`[TabPanel] Debounced search triggered for query: "${query}"`, filters);
      setSearchLoading(true);
      setIsFilteredSearch(true); // Fontos: jelezzük, hogy a szűrt állapot aktív

      try {
        const response = await apiClient.searchNews({
          q: query.trim(),
          lang: filters.lang !== 'all' ? filters.lang : undefined,
          countries: filters.countries.length > 0 ? filters.countries.join(',') : undefined,
          limit: 100,
        });
        
        const transformedResults = response.results.map(convertSearchResultToNewsItem);
        setDynamicResults(transformedResults);
        
        console.log('[TabPanel] Szűrt keresés kész:', {
          query: query.trim(),
          filters,
          resultCount: transformedResults.length
        });
      } catch (error) {
        console.error('[TabPanel] Szűrt keresés hiba:', error);
        // Hiba esetén is frissítjük az állapotot, hogy a UI reagáljon
        setDynamicResults([]);
      } finally {
        setSearchLoading(false);
      }
    }, 500), // 500ms debounce
    [] // A függőségek üresek, mert a paramétereket mindig híváskor kapja meg
  );

  // --- LIFECYCLE HOOK-OK ---
  useEffect(() => {
    if (newsItems && newsItems.length > 0) {
      setNewsLoaded(true);
    } else {
      setNewsLoaded(false);
    }
  }, [newsItems]);

  useEffect(() => {
    if (onRefreshRegister) {
      onRefreshRegister(isActive, handleRefresh);
    }
  }, [isActive, handleRefresh, onRefreshRegister]);

  useEffect(() => {
    if (isActive && onNewsItemsUpdate && newsItems.length > 0) {
      onNewsItemsUpdate(newsItems);
    }
  }, [isActive, newsItems, onNewsItemsUpdate]);

  useEffect(() => {
    if (activeTabId && activeTabId !== 'default') {
      const paginationState = loadPaginationState(activeTabId);
      if (paginationState) {
        console.log(`[TabPanel] Pagination állapot visszaállítva: ${activeTabId} -> page ${paginationState.currentPage}, ${paginationState.itemsPerPage} items/page`);
        setCurrentPage(paginationState.currentPage);
        setItemsPerPage(paginationState.itemsPerPage);
      } else {
        console.log(`[TabPanel] Nincs mentett pagination állapot: ${activeTabId} -> visszaállítás az 1. oldalra`);
        setCurrentPage(1);
      }
    }
  }, [activeTabId, loadPaginationState]);

  // Bridge feliratkozások
  useEffect(() => {
    if (subscribedRef.current || mountedRef.current) {
      console.log('[TabPanel] Bridge feliratkozások már aktívak, kihagyás');
      return;
    }
    
    mountedRef.current = true;
    subscribedRef.current = true;
    
    console.log('[TabPanel] Bridge feliratkozások inicializálása...');
    
    const unsubscribeItemsPerPage = settingsBridge.subscribe((key, value) => {
      if (key === ITEMS_PER_PAGE_PREFERENCE_KEY) {
        console.log('TabPanel értesült a hírek/oldal beállítás változásáról:', value);
        
        if (Number.isFinite(value) && value >= 1) {
          setItemsPerPage(value);
          setCurrentPage(1);
          
          if (activeTabId && activeTabId !== 'default') {
            savePaginationState(1, value, activeTabId);
          }
        }
      }
    });
    
    const unsubscribeTimeSettings = timeSettingsBridge.subscribe((key, value) => {
      if (key === MAX_AGE_HOURS_PREFERENCE_KEY) {
        console.log('TabPanel értesült az időszűrés beállítás változásáról:', value);
        
        if (Number.isFinite(value) && value >= 1) {
          setMaxAgeHours(value);
          setCurrentPage(1);
          
          if (activeTabId && activeTabId !== 'default') {
            savePaginationState(1, itemsPerPage, activeTabId);
          }
        }
      }
    });
    
    // --- EZ A KRITIKUS, ÚJ RÉSZ ---
    const unsubscribeSearchFilters = searchFiltersBridge.subscribe((filters: SearchFilters) => {
      // Csak akkor reagálunk, ha ez az aktív keresési fül.
      // A `searchTerm` prop a Home-tól jövő eredeti keresőszót jelenti.
      if (isActive && mode === 'search' && searchTerm) {
        console.log('[TabPanel] Szűrők változtak, API hívás indul:', filters);
        const currentQuery = searchTerm.trim();
        if (currentQuery) {
          fetchFilteredNews(currentQuery, filters);
        }
      }
    });
    
    return () => {
      console.log('[TabPanel] Bridge feliratkozások törlése...');
      mountedRef.current = false;
      subscribedRef.current = false;
      unsubscribeItemsPerPage();
      unsubscribeTimeSettings();
      unsubscribeSearchFilters(); // Leiratkozás
    };
  }, [activeTabId, itemsPerPage, savePaginationState, isActive, mode, searchTerm, fetchFilteredNews]);

  // Preferences betöltés
  useEffect(() => {
    if (preferencesLoadedRef.current) {
      return;
    }
    preferencesLoadedRef.current = true;

    const loadPreferences = async () => {
      try {
        // Horizontal scroller
        try {
          const dataManager = (await import('../../utils/datamanager/manager')).DataManager.getInstance();
          const scrollerValue = await dataManager.getHorizontalScroller();
          setShowHorizontalScroller(scrollerValue);
          console.log(`[TabPanel] Horizontal scroller betöltve (cache): ${scrollerValue}`);
        } catch (error) {
          console.error('[TabPanel] Horizontal scroller betöltési hiba:', error);
          const scrollerPref = await getUserPreference('user_showHorizontalScroller');
          if (scrollerPref?.value !== undefined) {
            setShowHorizontalScroller(Boolean(scrollerPref.value));
          }
        }

        // Items per page
        const itemsPerPagePref = await getUserPreference('user_itemsPerPage');
        if (itemsPerPagePref && itemsPerPagePref.value !== undefined) {
          const value = Number(itemsPerPagePref.value);
          if (Number.isFinite(value) && value >= 1) {
            setItemsPerPage(value);
          } else {
            setItemsPerPage(50);
          }
        } else {
          const savedLimit = localStorage.getItem('newsLimit');
          if (savedLimit) {
            const limitValue = Number(savedLimit);
            if (Number.isFinite(limitValue) && limitValue >= 1) {
              setItemsPerPage(limitValue);
            } else {
              setItemsPerPage(50);
            }
          } else {
            setItemsPerPage(50);
          }
        }

        // Max age hours
        const maxAgeHoursPref = await getUserPreference('user_maxAgeHours');
        if (maxAgeHoursPref && maxAgeHoursPref.value !== undefined) {
          const value = Number(maxAgeHoursPref.value);
          if (Number.isFinite(value) && value >= 1) {
            setMaxAgeHours(value);
          } else {
            setMaxAgeHours(24);
          }
        } else {
          const savedMaxAge = localStorage.getItem('maxAgeHours');
          if (savedMaxAge) {
            const ageValue = Number(savedMaxAge);
            if (Number.isFinite(ageValue) && ageValue >= 1) {
              setMaxAgeHours(ageValue);
            } else {
              setMaxAgeHours(24);
            }
          } else {
            setMaxAgeHours(24);
          }
        }
      } catch {
        setItemsPerPage(50);
        setMaxAgeHours(24);
      }
    };

    loadPreferences();
  }, [getUserPreference, activeTabId]);

  // News items változás kezelése
  useEffect(() => {
    if (newsItems.length === 0) {
      setCurrentPage(1);
      if (activeTabId && activeTabId !== 'default') {
        savePaginationState(1, itemsPerPage, activeTabId);
      }
    }
  }, [activeTabId, newsItems.length, itemsPerPage, savePaginationState]);

  // ✅ ÚJ: CACHE MENTÉSI LOGIKA - A megbeszélt megoldás
  const newsItemsHash = useNewsItemsHash(newsItems);
  
  useEffect(() => {
    // Csak akkor mentsünk, ha:
    // 1. A fül aktív (ne mentsünk a háttérben betöltődő, inaktív fülekről).
    // 2. Vannak hírek, amiket el lehet menteni.
    // 3. A fül 'news' módban van (videókat vagy 'new' fület nem mentünk itt).
    // 4. A betöltés már befejeződött.
    if (isActive && newsItems.length > 0 && mode === 'news' && !loading) {
      
      const tabContentData: TabContentData = {
        id: activeTabId,
        // Articles mappa az indexedDB számára
        articles: newsItems.map(item => ({ 
            id: item.id || '', 
            title: item.title || '', 
            sourceId: item.sourceId || '' 
        })),
        timestamp: Date.now(),
        meta: {
          lastFetched: Date.now(),
          originalNews: newsItems,
          country: filters?.country,
        },
      };
      
      console.log(`[TabPanel] ✅ Adatok mentése a cache-be: ${activeTabId}`);
      
      // ✅ JAVÍTOTT hívás - paraméterek helyes sorrendben
      saveTabContent(tabContentData, activeTabId, filters?.country)
        .then(() => {
          console.log(`[TabPanel] Cache mentés sikeres: ${activeTabId}`);
        })
        .catch(error => {
          console.warn(`[TabPanel] Cache mentési hiba:`, error);
        });
    }
  }, [
    isActive, 
    newsItemsHash, // Ez biztosítja, hogy csak tartalomváltozáskor fusson le
    mode, 
    loading, 
    activeTabId, 
    filters?.country, 
    saveTabContent
  ]);

  // --- ADATFELDOLGOZÁS ---
  const extractSources = useMemo(() => {
    if (!newsItems || newsItems.length === 0) return [];
    const uniqueSources = new Map();
    newsItems.forEach((item: NewsItem) => {
      if (item.sourceId && item.source && !uniqueSources.has(item.sourceId)) {
        uniqueSources.set(item.sourceId, {
          id: item.sourceId,
          name: item.source,
          domain: item.url ? (() => {
            try { return new URL(item.url).hostname; } catch { return undefined; }
          })() : undefined,
        });
      }
    });
    return Array.from(uniqueSources.values());
  }, [newsItems]);

  const { filteredItems, pageItems, totalPages, calculatedValidPage } = useMemo(() => {
    let sourceItems: NewsItem[] = [];
    // --- PRIORITÁSOS LOGIKA ---
    if (mode === 'search') {
      if (dynamicResults !== null) {
        sourceItems = dynamicResults;
      } else if (searchResults.length > 0) {
        sourceItems = searchResults.map((item) => ({ ...item, isSearchResult: true }));
      }
    } else {
      sourceItems = newsItems;
    }

    // Időszűrés
    const cutoffTimestamp = Date.now() - maxAgeHours * 60 * 60 * 1000;
    const filteredByTime = sourceItems.filter((item) => {
      if (item.timestamp && typeof item.timestamp === 'number') {
        return item.timestamp > cutoffTimestamp;
      }
      if (item.date) {
        const itemTimestamp = new Date(item.date).getTime();
        return itemTimestamp > cutoffTimestamp;
      }
      return true;
    });

    // Oldalszámozás
    const totalItems = filteredByTime.length;
    const totalPages = Math.max(1, Math.ceil(totalItems / itemsPerPage));
    const calculatedValidPage = Math.min(currentPage, totalPages);
    const startIndex = (calculatedValidPage - 1) * itemsPerPage;
    const endIndex = Math.min(startIndex + itemsPerPage, totalItems);

    const result = {
      filteredItems: filteredByTime,
      pageItems: filteredByTime.slice(startIndex, endIndex),
      totalPages,
      calculatedValidPage,
    };

    if (result.filteredItems.length !== previousFilteredCountRef.current) {
      previousFilteredCountRef.current = result.filteredItems.length;
    }

    return result;
  }, [newsItems, searchResults, isSearchMode, maxAgeHours, currentPage, itemsPerPage, mode, dynamicResults]);

  const itemsWithAds = useMemo(() => injectAdsIntoNewsItems(pageItems, 5, 10), [pageItems]);

  // --- RENDER ---
  // ✅ Feltételes renderelés: ha a tab.mode 'my_page', csak a My komponenst jelenítsük meg
  if (tab.mode === 'my_page') {
    return <My />;
  }

  // ÚJ: Kapcsoló, ami szabályozza az overlay megjelenését
  const shouldShowLoadingOverlayForMode = mode === 'news' || mode === 'search';

  return (
    <ScrollContainer
      activeTabId={activeTabId}
      isLoading={overallLoading}
      resetScrollTrigger={paginationTrigger}
      hasMoreContent={hasMoreSources}
      onLoadMore={loadMoreSources}
      tabMode={mode}
    >
      {/* Loading overlay - csak ha a kapcsoló engedélyezi */}
      {loading && (!newsItems || newsItems.length === 0) && shouldShowLoadingOverlayForMode && (
        <LoadingProgressOverlay 
          country={title || "Loading"}
          hideOverlay={newsLoaded}
        />
      )}

      {/* Új fül ('new' mód) */}
      {mode === 'new' && (
        <TabController
          activeTabId={activeTabId}
          isNewTab={true}
          tabMode={mode}
          title={title}
          newsItems={newsItems}
          loading={loading}
          error={error}
          onDismiss={() => {}}
          onConfigChange={handleConfigChange}
          onRetry={handleRetry}
          onToggleMenu={onToggleMenu || (() => {})}
          searchResults={searchResults}
          searchTerm={searchTerm}
          isSearchMode={isSearchMode}
          onClearSearch={onClearSearch}
          onSourceClick={onSourceClick}
        />
      )}

      {/* Videó fül ('video' mód) */}
      {mode === 'video' && (
        <TabController
          activeTabId={activeTabId}
          isNewTab={false}
          tabMode={mode}
          title={title}
          videoItems={videoItems}
          videoLoading={loading}
          videoError={error}
          newsItems={[]}
          loading={loading}
          error={error}
          onDismiss={() => {}}
          onConfigChange={handleConfigChange}
          onRetry={handleRefresh}
          onToggleMenu={onToggleMenu || (() => {})}
          onSourceClick={onSourceClick}
        />
      )}

      {/* Normál hír fül ('news' vagy 'search' mód) */}
      {(mode === 'news' || mode === 'search') && (
        <div className={panelStyles.panel}>
          <PanelHead title={title} onRefresh={handleRefresh} sources={extractSources} />
          <div className={panelStyles.sourceIconBarContainer}>
            <SourceIconBar sources={extractSources} />
          </div>
          <div className={panelStyles.panelContent}>
            {(loading || searchLoading) && <div className={panelStyles.smallSpinner} title="Frissítés folyamatban..." />}
            {isArticleViewActive ? (
              <ArticlePlaceholder />
            ) : error ? (
              <div className={panelStyles.errorContainer}>
                {/* ... hibaüzenet ... */}
                <p className={panelStyles.errorMessage}>
                  {error instanceof Error ? error.message : error}
                </p>
                <button className={panelStyles.retryButton} onClick={handleRetry}>
                  Retry
                </button>
              </div>
            ) : pageItems.length > 0 ? (
              <>
                {mode === 'search' && (
                  <div className={panelStyles.searchModeHeader}>
                    <div className={panelStyles.searchResultsInfo}>
                      🔍 <strong>{filteredItems.length} results</strong>
                      {searchTerm && ` for "${searchTerm}"`}
                    </div>
                    {onClearSearch && (
                      <button className={panelStyles.clearSearchButton} onClick={onClearSearch}>
                        ✕ Clear search
                      </button>
                    )}
                  </div>
                )}
                <div className={panelStyles.cardsContainer}>
                  {itemsWithAds.map((item, index) => {
                    // ... (a Card renderelési logika változatlan)
                    if ((item as AdCardItem).type === 'ad') {
                      const ad = item as AdCardItem;
                      return (
                        <AdSenseLayout
                          key={`ad-${ad.id}`}
                          slotId={ad.slotId || '1234567890'}
                          badgeLabel="Ad"
                          debug={process.env.NODE_ENV !== 'production'}
                        />
                      );
                    } else {
                      const news = item as NewsItem;
                      return (
                        <Card
                          key={news.id || index}
                          {...news}
                          onClick={() => handleCardClick(news.url)}
                          onToggleMenu={onToggleMenu}
                          onSourceClick={onSourceClick}
                        />
                      );
                    }
                  })}
                </div>
                {filteredItems.length > 0 && (
                  <div className={panelStyles.paginationContainer}>
                    <div className={panelStyles.pageInfo}>
                      Total {filteredItems.length} articles ({newsItems.length - filteredItems.length} filtered) | 
                      {(calculatedValidPage - 1) * itemsPerPage + 1}-
                      {Math.min(calculatedValidPage * itemsPerPage, filteredItems.length)} displayed
                    </div>
                    <Pagination
                      currentPage={calculatedValidPage}
                      totalPages={totalPages}
                      onPageChange={handlePageChange}
                      displayRange={1}
                    />
                  </div>
                )}
              </>
            ) : (
              <div className={panelStyles.placeholderText}>
                {mode === 'search' ? "No results found for your search criteria." : "No news to display."}
              </div>
            )}
          </div>
        </div>
      )}
    </ScrollContainer>
  );
};

export const TabPanel = React.memo(TabPanelComponent, (prev, next) => {
  return (
    prev.tab.id === next.tab.id &&
    prev.isActive === next.isActive &&
    prev.isSearchMode === next.isSearchMode &&
    prev.searchTerm === next.searchTerm &&
    prev.searchResults?.length === next.searchResults?.length
  );
});

export default TabPanel;

Feladat: Nem kell módosítani, a dinamikus szűrési lánc már működik, ha a SearchFilters-ből valós országkódok jönnek.
Érintett:
TabPanel.tsx

=================================================================
// Új fájl: src\components\Utility\Settings\SearchFilters\SearchFiltersBridge.ts
import { SearchFilters } from '../../../../hooks/useSearchFilters'; // Helyes importútvonal

type FilterChangeCallback = (filters: SearchFilters) => void;

class SearchFiltersBridge {
  private listeners: FilterChangeCallback[] = [];

  public subscribe(callback: FilterChangeCallback): () => void {
    this.listeners.push(callback);
    return () => {
      this.listeners = this.listeners.filter(l => l !== callback);
    };
  }

  public emit(filters: SearchFilters): void {
    this.listeners.forEach(listener => listener(filters));
  }
}

export const searchFiltersBridge = new SearchFiltersBridge();
=======================================================
