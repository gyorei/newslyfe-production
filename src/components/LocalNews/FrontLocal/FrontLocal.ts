/**
 * Frontend Helyi Hírek Szolgáltatás
 *
 * A FrontLocal modul feladata a frontend és backend közötti híd megvalósítása
 * a helyi hírek és beállítások kezelésében. Közvetíti a kéréseket a backend API
 * felé, és előkészíti az adatokat a frontend komponensek számára.
 */

/*

📊 ÖSSZEGZETT ÉRTÉKELÉS
🌟 KIVÁLÓ PONTOK (9/10):
✅ Teljes cache implementáció - Professzionális szint
✅ Bi-directional konverzió - RssNewsItem ↔ APINewsItem
✅ Cache statisztikák - Monitoring és debugging
✅ Automatikus cleanup - Memory management
✅ torzsMode API integráció - Backend kommunikáció
✅ Részletes logging - Debug információk
✅ Cache TTL kezelés - Időalapú validáció
⚠️ JAVÍTANDÓ TERÜLETEK:
⚠️ Hungary default eltávolítása
⚠️ Cache TTL optimalizálása (4→24 óra)
⚠️ maxAgeHours duplikáció megszüntetése
⚠️ Error recovery implementálása
🎯 VÉGSŐ ÉRTÉKELÉS
FrontLocal.ts törzs implementáció: MAJDNEM TÖKÉLETES! 🌟

Ez egy professzionális szintű cache implementáció kiváló cache kezeléssel, statisztikákkal és automatikus cleanup-pal. Csak 3-4 kisebb problémát kell javítani ahhoz, hogy tökéletes legyen.

PRIORITÁS:

Hungary default eltávolítása ✋
Cache TTL 24 órára növelése ⏰
maxAgeHours logika tisztítása 🧹


*/

import { localizationService } from '../Location';
import { RssNewsItem } from '../../../types';
import { RSS_CONFIG } from '../config/localConfig';
import { apiClient } from '../../../apiclient/apiClient';
import { NewsDistributor } from '../topnews/newsDistributor';
import i18n from 'i18next';

// ÚJ: Visszaállított cache-hez kapcsolódó definíciók
const TORZS_MODE_NEWS_TTL_MS = 4 * 60 * 60 * 1000; // 4 óra

function getTorzsModeCacheKey(country: string, importanceLevel: number): string {
  return `torzs_mode_news_${country.toLowerCase()}_${importanceLevel}`;
}

interface CacheStats {
  hits: number;
  misses: number;
  saves: number;
}

const cacheStats: CacheStats = {
  hits: 0,
  misses: 0,
  saves: 0,
};


// NewsSource típus definiálása
interface NewsSource {
  id: string;
  name: string;
  url: string;
  country?: string;
  continent?: string;
  fontossag?: number;
  rssFeed?: string;
}

// DbRow interface for converting API responses
interface DbRow {
  id?: string;
  eredeti_id?: string;
  name?: string;
  forras_neve?: string;
  cim?: string;
  url?: string;
  rss_url?: string;
  rss_feed?: string | null; // Changed from string | undefined to string | null
  fontossag?: number;
  orszag?: string;
  country?: string;
  kontinens?: string;
  continent?: string;
  aktiv?: boolean;
}

/**
 * Hírek szűrését lehetővé tevő interfész
 */
interface NewsFilters {
  country?: string;
  continent?: string;
  source?: string[];
  importanceLevel?: number;
  category?: string | null;
  useGeoLocation?: boolean;
  isCleanTab?: boolean;
  maxAgeHours?: number; // ÚJ: Időalapú szűrés támogatása
  torzsMode?: boolean; // ÚJ: Törzs híradat mód támogatása
  forceRefresh?: boolean; // ✅ ÚJ: Cache bypass támogatása
}

/**
 * API által visszaadott hírtételek formátuma
 */
interface APINewsItem {
  id?: string;
  title?: string;
  description?: string;
  imageUrl?: string;
  sourceId?: string;
  source?: string;
  country?: string;
  continent?: string;
  date?: string;
  timestamp?: number;
  url?: string;
  categories?: string[];
  hasRssFeed?: boolean;
  sourceStatus?: string;
}

// ÚJ: Cache struktúra típus
interface CachedNewsData {
  news: APINewsItem[];
  timestamp: number;
  country: string;
  importanceLevel: number;
}

const frontLocalNewsCache = new Map<string, CachedNewsData>();
/**
 * Alapértelmezett szűrők hozzáadása a hiányzó adatokhoz
 */
const getDefaultFilters = (filters?: Partial<NewsFilters>): NewsFilters => {
  return {
    ...filters,
    importanceLevel:
      filters?.importanceLevel !== undefined
        ? filters.importanceLevel
        : RSS_CONFIG.IMPORTANCE_LEVELS.CRITICAL,
  };
};

/**
 * FrontLocal Szolgáltatás - Frontend Komponensek számára
 */
const FrontLocal = {
  /**
   * Hírek lekérése szűrők alapján - EGYSZERŰ CACHE LOGIKÁVAL
   */
  getNews: async (filters?: {
    country?: string;
    continent?: string;
    source?: string[];
    importanceLevel?: number;
    category?: string | null;
    useGeoLocation?: boolean;
    isCleanTab?: boolean;
    maxAgeHours?: number;
    torzsMode?: boolean;
    forceRefresh?: boolean; // ✅ ÚJ: Cache bypass támogatása
  }): Promise<RssNewsItem[]> => {
    console.log('--- FrontLocal.getNews ---', filters);
    try {
      // PRIORITÁS: Ha van source és pontosan 1 elem, mindig a backend sourceId query paraméteres ágat futtatjuk!
      if (filters?.source && Array.isArray(filters.source) && filters.source.length === 1) {
        const sourceId = filters.source[0];
        // console.log('[FRONTLOCAL-DEBUG] Egy forrás szűrés, sourceId:', sourceId);
        const params = new URLSearchParams();
        if (filters.importanceLevel) {
          params.append('importanceLevel', filters.importanceLevel.toString());
        }
        if (filters.country) {
          params.append('country', filters.country);
        }
        if (filters.maxAgeHours !== undefined) {
          params.append('maxAgeHours', filters.maxAgeHours.toString());
        }
        if (filters.torzsMode) {
          params.append('torzsMode', 'true');
        }
        params.append('limit', '3000');
        params.append('sourceId', sourceId);
        const url = `/api/local/news?${params.toString()}`;
        // console.log('[FRONTLOCAL-DEBUG] Egy forrás API kérés:', url);
        const response = await fetch(url);
        if (!response.ok) {
          let errorMsg = `API hiba: ${response.status} ${response.statusText}`;
          try {
            const errorData = await response.json();
            errorMsg = errorData.error || errorMsg;
          } catch {
            // intentionally left blank
          }
          throw new Error(errorMsg);
        }
        const data = await response.json();
        // console.log('[FRONTLOCAL-DEBUG] Egy forrás API válasz hír darabszám:', data.news?.length || 0);
        let allNewsItems: RssNewsItem[] = [];
        if (data && data.news && Array.isArray(data.news)) {
          allNewsItems = data.news.map((item: APINewsItem) =>
            apiNewsItemToRssNewsItem(item, filters?.country)
          );
        }
        // console.log('[FRONTLOCAL-DEBUG] Egy forrás visszaadott hírek száma:', allNewsItems.length);
        return allNewsItems;
      }
      const effectiveFilters = getDefaultFilters(filters);

      // ÚJ: Cache változók inicializálása
      let allNewsItems: RssNewsItem[] = [];
      let fetchedFromCache = false;

      // --- CACHE ELLENŐRZÉS TÖRZSMÓD ESETÉN ---
      if (effectiveFilters.torzsMode && !effectiveFilters.forceRefresh) {
        // Explicit validáció - nincs Hungary default!
        if (!effectiveFilters.country) {
          console.warn(
            '[FrontLocal.getNews] TÖRZS MÓD: Ország paraméter hiányzik - törzs mód letiltva',
          );
          effectiveFilters.torzsMode = false; // Fallback normál módra
        } else {
          const cacheKey = getTorzsModeCacheKey(
            effectiveFilters.country, // ← JAVÍTVA: Explicit country, nincs default!
            effectiveFilters.importanceLevel || 10,
          );

          const cachedEntry = frontLocalNewsCache.get(cacheKey);
          if (cachedEntry && Date.now() - cachedEntry.timestamp < TORZS_MODE_NEWS_TTL_MS) {
            console.log(
              `[FrontLocal.getNews] 🎯 TÖRZS CACHE HIT! ${cachedEntry.news.length} hír, kor: ${Math.round((Date.now() - cachedEntry.timestamp) / 60000)}perc`,
            );

            // Cache-ből átalakítás RssNewsItem formátumra
            allNewsItems = cachedEntry.news.map((item: APINewsItem) =>
              apiNewsItemToRssNewsItem(item, effectiveFilters.country)
            );

            fetchedFromCache = true;
            cacheStats.hits++;
          } else if (cachedEntry) {
            console.log(
              `[FrontLocal.getNews] ⏰ TÖRZS CACHE LEJÁRT. Cache kor: ${Math.round((Date.now() - cachedEntry.timestamp) / 60000)}perc`,
            );
            cacheStats.misses++;
          } else {
            console.log(`[FrontLocal.getNews] ❌ TÖRZS CACHE MISS. Első betöltés: ${cacheKey}`);
            cacheStats.misses++;
          }
        }
      } else if (effectiveFilters.forceRefresh) {
        console.log(
          `[FrontLocal.getNews] 🔄 FORCE REFRESH: Cache bypass aktiválva - közvetlen API hívás`,
        );
      }

      // FELTÉTELES API HÍVÁS - csak ha nincs cache
      if (!fetchedFromCache) {
        // Helymeghatározás használata, ha szükséges és engedélyezett
        /*
        if (
          !effectiveFilters.country &&
          !effectiveFilters.continent &&
          !effectiveFilters.source?.length &&
          effectiveFilters.useGeoLocation !== false &&
          effectiveFilters.isCleanTab !== true
        ) {
          console.log(`[FrontLocal.getNews] Helymeghatározás használata...`);
          const location = await localLocationService.getLocation();

          if (location?.country) {
            console.log(`[FrontLocal.getNews] Felhasználó országa: ${location.country}`);
            effectiveFilters.country = location.country;
          } else {
            console.warn('[FrontLocal.getNews] Nem sikerült meghatározni a felhasználó országát.');
            return [];
          }
        }
        */

        // console.log('[FRONTLOCAL-DEBUG] Nem egy forrás szűrés, végső szűrők:', effectiveFilters);

        // Források lekérése a véglegesített szűrőkkel
        const sources = await FrontLocal.getFilteredSources(effectiveFilters);
        // console.log(`[FrontLocal.getNews] getFilteredSources eredménye: ${sources.length} forrás`);

        if (sources.length === 0) {
          // console.warn('[FrontLocal.getNews] A szűrések után nem maradt feldolgozható hírforrás.');
          return [];
        }

        // A források egy részhalmazát használjuk csak
        const sourcesToProcess = sources.slice(0, RSS_CONFIG.MAX_SOURCES_PER_REQUEST);

        console.log(
          `[FrontLocal.getNews] Hírek lekérdezése ${sourcesToProcess.length} forrásból...`,
        );

        // API hívás implementálása
        const params = new URLSearchParams();
        if (effectiveFilters.importanceLevel) {
          params.append('importanceLevel', effectiveFilters.importanceLevel.toString());
        }
        if (effectiveFilters.country) {
          params.append('country', effectiveFilters.country);
        }
        if (effectiveFilters.maxAgeHours !== undefined) {
          params.append('maxAgeHours', effectiveFilters.maxAgeHours.toString());
          // console.log(
          //   `[FrontLocal.getNews] maxAgeHours paraméter: ${effectiveFilters.maxAgeHours} óra`,
          // );
        }
        if (effectiveFilters.torzsMode) {
          params.append('torzsMode', 'true');
          // console.log(`[FrontLocal.getNews] torzsMode aktív - 24 órás törzs híradat betöltése`);
        }
        params.append('limit', '3000');

        // console.log(`[FrontLocal.getNews] API kérés: /api/local/news?${params.toString()}`);

        const response = await fetch(`/api/local/news?${params.toString()}`);
        if (!response.ok) {
          let errorMsg = `API hiba: ${response.status} ${response.statusText}`;
          try {
            const errorData = await response.json();
            errorMsg = errorData.error || errorMsg;
          } catch {
            // intentionally left blank
          }
          throw new Error(errorMsg);
        }
        const data = await response.json();
        // console.log(
        //   `[FrontLocal.getNews] API válasz: ${data.news?.length || 0} hír, meta:`,
        //   data.meta,
        // );

        // Ellenőrizzük, hogy a válasz tartalmaz-e híreket
        if (data && data.news && Array.isArray(data.news)) {
          // Átalakítjuk a hírelemeket a kívánt formátumra
          allNewsItems = data.news.map((item: APINewsItem) =>
            apiNewsItemToRssNewsItem(item, effectiveFilters.country)
          );

          // --- CACHE MENTÉS sikeres API hívás után ---
          if (effectiveFilters.torzsMode && allNewsItems.length > 0 && effectiveFilters.country) {
            const cacheKey = getTorzsModeCacheKey(
              effectiveFilters.country, // ← JAVÍTVA: Explicit country, nincs default!
              effectiveFilters.importanceLevel || 10,
            );

            // RssNewsItem-eket visszaalakítjuk APINewsItem formátumra cache-hez
            const apiNewsItems: APINewsItem[] = allNewsItems.map((item) => ({
              id: item.id,
              title: item.title,
              description: item.description,
              imageUrl: item.imageUrl,
              sourceId: item.source.id,
              source: item.source.name,
              country: item.source.country,
              continent: item.source.continent,
              date: item.pubDate,
              timestamp: item.timestamp,
              url: item.link,
              categories: item.categories,
            }));

            frontLocalNewsCache.set(cacheKey, {
              news: apiNewsItems,
              timestamp: Date.now(),
              country: effectiveFilters.country,
              importanceLevel: effectiveFilters.importanceLevel || 10,
            });

            cacheStats.saves++;
            console.log(
              `[FrontLocal.getNews] 💾 TÖRZS CACHE MENTÉS: ${allNewsItems.length} hír mentve cache kulccsal: ${cacheKey}`,
            );

            // ÚJ: Egyszerű cache cleanup - max 50 bejegyzés
            if (frontLocalNewsCache.size > 50) {
              const oldestKey = Array.from(frontLocalNewsCache.entries()).sort(
                ([, a], [, b]) => a.timestamp - b.timestamp,
              )[0]?.[0];
              if (oldestKey) {
                frontLocalNewsCache.delete(oldestKey);
                console.log(`[FrontLocal.getNews] 🧹 Régi cache bejegyzés törölve: ${oldestKey}`);
              }
            }
          } else if (effectiveFilters.torzsMode && !effectiveFilters.country) {
            console.warn(
              '[FrontLocal.getNews] TÖRZS CACHE MENTÉS: Ország hiányzik - cache mentés kihagyva',
            );
          }

          // Frissítjük a fontossági szint információkat, ha van meta adat
          if (data.meta) {
            if (data.meta.hasMore !== undefined) {
              // Itt érdemes lenne egy globális állapotot frissíteni a hasMoreSources értékkel
            }
            if (data.meta.nextImportanceLevel !== undefined) {
              // Itt érdemes lenne egy globális állapotot frissíteni a nextImportanceLevel értékkel
            }
          }
        } else {
          console.warn(
            '[FrontLocal.getNews] Az API válasza nem tartalmaz híreket vagy hibás formátumú',
          );
        }
      }

      // Hírek elosztása és szűrése a korábbi kód szerint
      let newsItems = NewsDistributor.distribute(
        allNewsItems,
        effectiveFilters.country,
        effectiveFilters.importanceLevel,
        effectiveFilters.continent,
      );

      // Kategória szűrés, ha szükséges
      if (effectiveFilters.category) {


        newsItems = newsItems.filter((item) => {
          // Kategória mezők vizsgálata
          if (item.categories?.includes(effectiveFilters.category!)) {
            return true;
          }

          // Kulcsszavas szűrés a címben és leírásban
          const title = item.title.toLowerCase();
          const description = item.description.toLowerCase();
          const searchCategory = effectiveFilters.category!.toLowerCase();

          return title.includes(searchCategory) || description.includes(searchCategory);
        });

        // console.log(
        //   `[FrontLocal.getNews] Kategória szűrés után: ${newsItems.length}/${beforeFilterByCategory} hír maradt.`,
        // );
      }
      // console.log('[FRONTLOCAL-DEBUG] Nem egy forrás szűrés, visszaadott hírek száma:', newsItems.length);
      return newsItems;
    } catch (error) {
      console.error('[FRONTLOCAL-DEBUG] Hiba a hírek lekérése során:', error);
      throw error;
    }
  },

  /**
   * Szűrt források lekérése
   */
  getFilteredSources: async (filters: {
    country?: string;
    continent?: string;
    source?: string[];
    importanceLevel?: number;
  }): Promise<NewsSource[]> => {
    // console.log(`[getFilteredSources] === KEZDÉS === Szűrők:`, JSON.stringify(filters));
    try {
      let sourceRows: DbRow[] = [];

      // API hívás a megfelelő végpont kiválasztásával
      if (filters.country) {
        const normalizedCountry = localizationService.normalizeCountry(filters.country);
        // console.log(`[getFilteredSources] Normalizált ország: ${normalizedCountry}`);
        // Fix type casting to match our local DbRow interface
        sourceRows = (await apiClient.getSourcesByCountry(normalizedCountry)) as unknown as DbRow[];
        // console.log(`[getFilteredSources] API válasz: ${sourceRows?.length ?? 0} forrás`);
      } else if (filters.continent) {
        // Fix type casting to match our local DbRow interface
        sourceRows = (await apiClient.getSourcesByContinent(
          filters.continent,
        )) as unknown as DbRow[];
        // console.log(`[getFilteredSources] API válasz: ${sourceRows?.length ?? 0} forrás`);
      } else if (filters.source?.length) {
        // console.log(
        //   `[getFilteredSources] Forrás ID-k alapján lekérés: ${filters.source.join(',')}`,
        // );
        // TODO: apiClient.getSourcesByIds implementálás
        return [];
      } else {
        console.warn('[getFilteredSources] Nincs érvényes szűrő a források lekéréséhez.');
        return [];
      }

      // Eredmény ellenőrzés
      if (!sourceRows || sourceRows.length === 0) {
        return [];
      }

      // Convert DbRow to NewsSource - Fix null handling for rssFeed
      const sources: NewsSource[] = sourceRows.map((row) => ({
        id: row.eredeti_id || row.id || '',
        name: row.forras_neve || row.cim || row.name || '',
        url: row.url || '',
        country: row.orszag || row.country || '',
        continent: row.kontinens || row.continent || '',
        fontossag: row.fontossag || RSS_CONFIG.IMPORTANCE_LEVELS.OPTIONAL,
        rssFeed: row.rss_url || (row.rss_feed === null ? undefined : row.rss_feed), // Fix: Convert null to undefined
      }));

      // Fontosság szerinti szűrés
      let filteredSources = sources;
      if (filters.importanceLevel !== undefined) {
    
        filteredSources = filteredSources.filter(
          (source) =>
            (source.fontossag || RSS_CONFIG.IMPORTANCE_LEVELS.OPTIONAL) <= filters.importanceLevel!,
        );
        // console.log(
        //   `[getFilteredSources] Fontossági szűrés után: ${filteredSources.length}/${beforeFilter}`,
        // );
      }

      // Forrás ID szerinti további szűrés
      if (filters.source && filters.source.length > 0) {
     
        const sourceIdSet = new Set(filters.source);
        filteredSources = filteredSources.filter((source) => sourceIdSet.has(source.id));
        // console.log(
        //   `[getFilteredSources] Forrás ID szűrés után: ${filteredSources.length}/${beforeFilter}`,
        // );
      }

      // console.log(
      //   `[getFilteredSources] === BEFEJEZÉS === Visszaadott források száma: ${filteredSources.length}`,
      // );
      return filteredSources;
    } catch (error) {
      console.error('[getFilteredSources] Hiba a szűrt források lekérése közben:', error);
      return [];
    }
  },

  /**
   * További hírek betöltése következő fontossági szintről
   */
  loadMoreSources: async (
    currentImportanceLevel: number,
    filters?: { country?: string; continent?: string; source?: string[] },
  ): Promise<{
    sources: NewsSource[];
    hasMoreSources: boolean;
    nextImportanceLevel: number | null;
  }> => {
    // console.log(`[loadMoreSources] Kezdés, jelenlegi szint: ${currentImportanceLevel}`);

    try {
      // Következő szint lekérése
      const nextImportanceLevel = NewsDistributor.getNextImportanceLevel(currentImportanceLevel);

      if (nextImportanceLevel === null) {
        // console.log(`[loadMoreSources] Nincs több fontossági szint`);
        return {
          sources: [],
          hasMoreSources: false,
          nextImportanceLevel: null,
        };
      }

      // Új források lekérése a következő szintről
      const sources = await FrontLocal.getFilteredSources({
        ...filters,
        importanceLevel: nextImportanceLevel,
      });

      // console.log(
      //   `[loadMoreSources] ${sources.length} forrás a következő szinten (${nextImportanceLevel})`,
      // );

      // Van-e még további szint
      const hasMoreSources = NewsDistributor.getNextImportanceLevel(nextImportanceLevel) !== null;

      return {
        sources,
        hasMoreSources,
        nextImportanceLevel,
      };
    } catch (error) {
      console.error('[loadMoreSources] Hiba a további források betöltése közben:', error);
      return {
        sources: [],
        hasMoreSources: false,
        nextImportanceLevel: null,
      };
    }
  },
};

function apiNewsItemToRssNewsItem(item: APINewsItem, countryFallback?: string): RssNewsItem {
  return {
    id: item.id || `item-${Date.now()}-${Math.random()}`,
    title: item.title || i18n.t('localnews.untitled', 'Untitled news'),
    description: item.description || i18n.t('localnews.noDescription', 'No description'),
    imageUrl: item.imageUrl || '',
    source: {
      id: item.sourceId || '',
      name: item.source || i18n.t('localnews.unknownSource', 'Unknown source'),
      country: item.country || countryFallback || '',
      continent: item.continent || '',
    },
    pubDate: item.date || new Date().toISOString(),
    timestamp: item.timestamp || Date.now(),
    link: item.url || '',
    categories: item.categories || [],
  };
}

export default FrontLocal;
