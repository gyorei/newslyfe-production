// src\types\index.ts
// Tab interfész - App.tsx és ResizableLayout.tsx használja
export interface Tab {
  id: string;
  title: string;
  active: boolean;
  mode?: 'news' | 'new' | 'search' | 'video' | 'home' | 'my_page'; // ✅ 'my_page' HOZZÁADVA
  filters?: {
    country?: string;
    continent?: string;
    source?: string[];
    category?: string | null; // Új: kategória szűrő hozzáadva
    searchTerm?: string; // Új: keresési kifejezés a keresési módhoz
    importanceLevel?: number; // ÚJ: fontossági szint a hírek szűréséhez
    maxAgeHours?: number; // ÚJ: Időalapú szűrés támogatása
    torzsMode?: boolean; // ÚJ: Törzs híradat mód támogatása
    /**
     * Ha `true`, a cache (memória és IndexedDB) teljes mértékben kihagyásra kerül.
     * Ez egy új API hívást kényszerít, friss adatok lekéréséhez.
     * Tipikus használat: ország vagy kontinens váltás a Side panelen.
     */
    forceRefresh?: boolean;
    // További szűrési feltételek...
  };
}

// Egyesített RSS hírelem interfész
export interface RssNewsItem {
  id: string; // Egyedi azonosító
  title: string; // Cikk címe
  description: string; // Rövid leírás
  link: string; // Eredeti cikk URL
  pubDate: string; // Publikálási dátum
  timestamp: number; // Új: timestamp a rendezéshez
  content?: string; // Teljes tartalom (opcionális)
  imageUrl?: string; // Opcionális kép URL
  categories?: string[]; // Kategória lista - új tulajdonság
  source: {
    id: string; // Forrás ID
    name: string; // Forrás neve
    url?: string; // Forrás weboldala
    country?: string; // Ország (opcionális)
    continent?: string; // Kontinens (opcionális)
  };
}

// NewsFilters interfész - cardService.ts használja
export interface NewsFilters {
  search?: string;
  category?: string;
  region?: string;
  source?: string[]; // Array típus, mivel több forrást is kiválaszthatunk
  country?: string;
  continent?: string;
  /**
   * Ha `true`, a cache (memória és IndexedDB) teljes mértékben kihagyásra kerül.
   * Ez egy új API hívást kényszerít, friss adatok lekéréséhez.
   * Tipikus használat: ország vagy kontinens váltás a Side panelen.
   */
  forceRefresh?: boolean;
}

// Kártya megjelenítéshez használt interfész
export interface NewsItem {
  id: string; // Egyedi azonosító
  title: string; // Cikk címe
  description: string; // Rövid leírás
  imageUrl?: string; // Opcionális kép URL (default vagy RSS-ből)
  source: string; // Forrás neve
  sourceId: string; // Forrás azonosító
  date: string; // Formázott dátum
  timestamp: number; // Új: timestamp a rendezéshez
  url: string; // Eredeti cikk URL
  country: string; // Ország
  // --- ÚJ, KÖTELEZŐ MEZŐ HOZZÁADÁSA ---
  countryCode?: string; // Kétbetűs kód, pl. "US"
  continent: string; // Kontinens
  category?: string; // Opcionális kategória
  categories?: string[]; // Opcionális kategóriák tömbje
  isRead?: boolean; // Olvasottsági állapot
  hasRssFeed?: boolean; // Van-e RSS feed
  sourceStatus?: 'valid' | 'invalid' | 'scraped' | 'unavailable';
  isNew?: boolean; // ÚJ: Új hír jelölése CardBadge megjelenítéséhez
  matchLanguage?: 'en' | 'hu' | string; // <<-- ÚJ: backend match_language mező támogatása
}

// DomainStats interfész - ProxyService használja
export interface DomainStats {
  domain: string;
  requests: number;
  lastAccess: Date;
  // Új mezők a ProxyService-hez
  lastRequest: string;
  nextAllowed: string;
  errorCount: number;
  successCount: number;
  hasCache: boolean;
}

// Hírforrás típusdefiníció
export interface NewsSource {
  id: string;
  url: string;
  title: string;
  continent: string;
  country: string;
  language: string;
  trusted: boolean;
  reliabilityScore: number;
  rssFeed?: string;
  imp?: number; // ÚJ: Fontossági szint (1=kritikus, 2=fontos, 3=normál, 4=opcionális)
}

// Egy kontinensre vonatkozó adat típus
export interface SingleContinentData {
  [country: string]: NewsSource[];
}

// Több kontinensre vonatkozó adat típus
export interface ContinentData {
  [continent: string]: SingleContinentData;
}

// Ország részletes adatai
export interface CountryDetails {
  name: string;
  continent: string;
  language: string;
  sourceCount?: number;
}

// DummyNewsItem interfész - a horizontális görgető komponens teszteléséhez
export interface DummyNewsItem {
  id: string;
  title: string;
  source?: string;
}

// ÚJ: Videó elem interfész
export interface VideoItem {
  id?: string;
  videoId?: string;
  title: string;
  link?: string;
  thumbnail?: string;
  channelName?: string;
  author?: string;
  views?: number;
  published?: string;
}
