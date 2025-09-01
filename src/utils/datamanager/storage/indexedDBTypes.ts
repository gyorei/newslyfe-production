/**
 * IndexedDB-specifikus típusok és interfészek
 */

/**
 * IndexedDB opciók
 */
export interface IndexedDBOptions {
  dbName?: string; // Adatbázis neve
  dbVersion?: number; // Adatbázis verziója
}

/**
 * Tab tartalom metaadatainak interfész
 */
export interface TabContentMeta {
  lastFetched?: number; // Utolsó lekérés időbélyege
  originalNews?: unknown[]; // Eredeti hírek objektumok
  [key: string]: unknown; // Egyéb dinamikus mezők
}

/**
 * Tab tartalom adatszerkezet
 */
export interface TabContentData {
  id: string;
  articles: ArticleReference[]; // Konkrét típus az any[] helyett
  timestamp: number;
  meta?: TabContentMeta; // Frissítve specifikusabb típusra
  [key: string]: unknown; // Egyéb dinamikus mezők
}

/**
 * Cikk hivatkozás (könnyű referencia a tab tartalomban)
 */
export interface ArticleReference {
  id: string;
  url?: string;
  position?: number;
  isRead?: boolean;
  [key: string]: unknown; // Egyéb dinamikus mezők
}

/**
 * Cikk adatszerkezet
 */
export interface ArticleData {
  id: string;
  title: string;
  url: string;
  source: string;
  savedAt: number;
  readAt?: number;
  meta?: Record<string, unknown>; // unknown az any helyett
}

/**
 * Felhasználói beállítás adatszerkezet
 */
export interface UserPreference {
  id: string;
  type: string;
  value: unknown;
  updatedAt: number;
}

/**
 * Tároló statisztikák
 */
export interface StorageStatistics {
  // Régi mezők (kompatibilitás miatt)
  totalItems: number;
  articles: number;
  tabs: number;
  preferences: number;
  lastUpdated: number;
  dbSize?: number;

  // Részletes statisztikák (opcionális)
  readArticlesCount?: number;
  tabContentsCount?: number;
  saveQueueCount?: number;
  unsyncedCount?: number;

  // ÚJ JAVÍTOTT MEZŐK:
  totalSize?: number;
  articleCount?: number; // Összes hír száma
  tabContentCount?: number; // Tab tartalmak száma
  readArticleCount?: number; // Elolvasott hírek száma
  userPreferenceCount?: number; // Felhasználói beállítások
  keyValueCount?: number; // Kulcs-érték párok

  estimatedSizeByStore?: {
    articles: number;
    tabs: number;
    readArticles: number;
    preferences: number;
  };
}
