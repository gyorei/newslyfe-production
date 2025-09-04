/**
 * Country - Országokhoz kapcsolódó API végpontok.
 * Kezeli az ország-specifikus hírek, források és ország-lista
 * lekérdezéseit, valamint továbbítja a kéréseket a megfelelő szolgáltatásoknak.
 */
/*
A három backend fájl (Local/Continent/Country) tökéletesen konzisztens törzs kezelést implementál. A Country.ts még batch feldolgozással is ki van egészítve, ami extra optimalizálást ad.

*/
import { Router } from 'express';
import { SourcesService } from '../../../server/data/PostgreSQLDataAccess.js';
import { logger } from '../../../server/logger.js';

// Egységes időkezelési modulok importálása
import {
  validateMaxAgeHours,
  calculateCutoffTimestamp,
  filterNewsByAge,
} from '../../utils/timeUtils.js';

// Import az imageExtractor.ts-ből
import { extractBestImageUniversal } from '../../common/imageExtractor/imageExtractor.js';

// Import a safeRssXmlParser.ts-ből
import { parseXmlWithBomAndErrorLogging, extractRssItems } from '../../common/safeRssXmlParser/safeRssXmlParser.js';

// Axios import az RSS lekéréshez
import axios from 'axios';

// ÚJ IMPORTOK
import { saveNewsToDatabase, NewsItemForDb } from '../../../common/db/newsStorage.js';
import { filterProblematicSources } from '../../common/problematicSourcesFilter.js';

// ÁTHELYEZETT INTERFÉSZEK A COUNTRYSERVICE.TS-BŐL
export interface SourceRow {
  eredeti_id: string;
  cim: string;
  url: string;
  rss_feed?: string;
  orszag: string;
  kontinens?: string;
  fontossag?: number;
  sections?: { name: string; url: string }[];
}

export interface NewsItem {
  id: string;
  title: string;
  description: string;
  url: string;
  imageUrl?: string;
  publishDate: string;
  sourceName: string;
  sourceId: string;
  country: string;
  continent?: string;
  [key: string]: unknown;
}

// ÁTHELYEZETT NEWSSERVICE OSZTÁLY A COUNTRYSERVICE.TS-BŐL
class NewsService {
  /**
   * Hírek lekérése egy forrásból
   * @param source Forrás objektum az adatbázisból
   * @returns Hírek listája
   */
  async getNewsFromSource(source: SourceRow): Promise<NewsItem[]> {
    try {
      const allNews: NewsItem[] = [];

      // Fő RSS feed feldolgozása
      if (source.rss_feed) {
        const mainNews = await this.fetchRssFromUrl(source.rss_feed, source);
        allNews.push(...mainNews);
      }

      // Sections feed-ek feldolgozása
      if (source.sections && source.sections.length > 0) {
        for (const section of source.sections) {
          const sectionNews = await this.fetchRssFromUrl(section.url, {
            ...source,
            cim: `${source.cim} - ${section.name}`,
          });
          allNews.push(...sectionNews);
        }
      }

      return this.removeDuplicateNews(allNews);
    } catch (error) {
      logger.error(`Hiba a hírek lekérése közben (${source.cim}):`, error);
      return [];
    }
  }

  /**
   * RSS feed letöltése és feldolgozása - VALÓDI IMPLEMENTÁCIÓ
   * @param rssUrl RSS feed URL
   * @param source Forrás objektum
   * @returns Hírek listája
   */
  private async fetchRssFromUrl(rssUrl: string, source: SourceRow): Promise<NewsItem[]> {
    try {
      // Valódi RSS lekérés
      const response = await axios.get(rssUrl, {
        responseType: 'arraybuffer',
        timeout: 15000,
        headers: {
          'User-Agent': 'Mozilla/5.0 News Reader/1.0',
        },
      });

      const contentType = response.headers['content-type']?.toLowerCase() || '';
      const responseBuffer: Buffer = response.data;

      // HTML vagy JSON Content-Type ellenőrzése
      if (contentType.includes('text/html') || contentType.includes('application/json')) {
        logger.warn(`Non-RSS content type detected for ${rssUrl}: ${contentType}`);
        return [];
      }

      // Buffer elejének ellenőrzése HTML-re vagy JSON-ra
      if (!contentType.includes('xml')) {
        const bufferStart = responseBuffer.slice(0, 100).toString().toLowerCase().trim();
        if (
          bufferStart.includes('<!doctype html>') ||
          bufferStart.startsWith('<html') ||
          bufferStart.startsWith('{') ||
          bufferStart.startsWith('[')
        ) {
          logger.warn(`Non-RSS content detected for ${rssUrl}`);
          return [];
        }
      }

      // Biztonságos XML parsing a közös modullal
      const parsedXmlObject = await parseXmlWithBomAndErrorLogging(
        responseBuffer,
        response.headers,
        { feedUrl: rssUrl, sourceId: source.eredeti_id },
      );

      // Hírek kinyerése az RSS-ből
      const items = extractRssItems(parsedXmlObject);

      if (items.length === 0) {
        logger.warn(`No RSS items found in feed: ${rssUrl}`);
        return [];
      }

      // Hírek átalakítása egységes formátumra
      return await Promise.all(
        items.map(async (item: any, index: number) => {
          // Aszinkron képkinyerés az extractBestImageUniversal használatával (favicon fallback-kal)
          // Példa channel-szintű adat kinyerésére és átadására
          const channel = parsedXmlObject.rss.channel; // Feltételezve, hogy a parszolt feed tartalmazza a channel-t

          // Módosított extractBestImageUniversal hívás (favicon fallback-kal)
          const imageUrl = await extractBestImageUniversal(item, rssUrl);

          // Dátum feldolgozása és timestamp generálása
          const pubDateString = item.pubDate || '';
          const parsedDate = new Date(pubDateString);
          const timestamp = isNaN(parsedDate.getTime()) ? Date.now() : parsedDate.getTime();
          const displayDate = pubDateString || new Date(timestamp).toISOString();

          return {
            id: `${source.eredeti_id}-${timestamp}-${index}`,
            title: item.title || 'Untitled newsr',
            description: item.description
              ? item.description.replace(/<\/?[^>]+(>|$)/g, '').substring(0, 280)
              : 'No description',
            url: item.link || '',
            imageUrl,
            publishDate: displayDate,
            sourceName: source.cim,
            sourceId: source.eredeti_id,
            country: source.orszag,
            continent: source.kontinens || 'Europe',
          };
        }),
      );
    } catch (error) {
      logger.error(`Hiba az RSS feed feldolgozása közben (${rssUrl}):`, error);
      return [];
    }
  }

  /**
   * URL alapú duplikáció szűrés hírek listájában
   * @param newsItems Hírek tömbje
   * @returns Deduplikált hírek tömbje (csak URL alapján)
   */
  private removeDuplicateNews(newsItems: NewsItem[]): NewsItem[] {
    return newsItems.filter(
      (news, index, self) => index === self.findIndex((n) => n.url === news.url),
    );
  }
}

// Router létrehozása
const router = Router();

// SourcesService példányosítása - ezt használjuk a duplikált SQL helyett
const sourcesService = new SourcesService();

// NewsService példányosítása - most már helyben definiált osztály
const newsService = new NewsService();

/**
 * Segédfüggvények
 */

// Dátum formázás
function formatPubDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString('hu-HU', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

// Egyedi azonosító generálása
function generateUniqueId(): string {
  return `news-${Date.now()}-${Math.random().toString(36).substring(2, 10)}`;
}

// Adapter: NewsItem → ProcessedRssItem
function newsItemToProcessedRssItem(item: NewsItem): import('../../common/problematicSourcesFilter.js').ProcessedRssItem {
  return {
    ...item,
    source: item.sourceName || '',
    sourceId: item.sourceId || '',
    date: item.publishDate || '',
    categories: [],
    hasRssFeed: true,
    sourceStatus: 'valid',
    imageUrl: item.imageUrl || '',
    timestamp: item.publishDate ? new Date(item.publishDate).getTime() : Date.now(),
    continent: item.continent || '',
  };
}

// Memória cache a hírekhez
const newsCache = new Map<string, { timestamp: number, data: any }>();
const CACHE_DURATION_MS = 3 * 60 * 1000; // 3 perc
// --- ÚJ: cache lock a tülekedés elkerülésére ---
const refreshLocks = new Set<string>();

/**
 * Egy ország forrásainak lekérdezése
 * GET /api/country/:country/sources
 */
router.get('/:country/sources', async (req, res) => {
  try {
    const { country } = req.params;

    logger.info(`Források lekérdezése ország szerint: ${country}, MINDEN forrás`);

    const rawSources = await sourcesService.getCountrySources(country);

    // Ha nincs találat, üres tömböt adunk vissza
    if (!rawSources || rawSources.length === 0) {
      logger.warn(`Nem található forrás az alábbi országhoz: ${country}`);
      return res.json([]);
    }

    // Eredmény transzformálása az API válasz formátumára
    const sources = rawSources.map((row) => ({
      id: row.eredeti_id || '',
      name: row.cim || '',
      url: row.url || '',
      rssUrl: row.rss_feed || '',
      importance: row.fontossag || 1,
      country: row.orszag || country,
      continent: row.kontinens || 'Europe',
      isActive: true,
    }));

    res.json(sources);
  } catch (err) {
    // TypeScript hiba javítása: error típus kezelése
    const error = err as Error;
    logger.error(`Hiba a források lekérdezése során (${req.params.country}):`, error);
    res.status(500).json({
      error: 'Hiba történt a források lekérdezése közben',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
});

/**
 * Egy ország híreinek lekérdezése - batch feldolgozással kiegészítve
 * GET /api/country/:country/news
 */
router.get('/:country/news', async (req, res) => {
  try {
    const { country } = req.params;
    const limit = parseInt(req.query.limit as string) || 20;
    const offset = parseInt(req.query.offset as string) || 0;
    // ÚJ: sourceId query paraméter támogatása
    const sourceId = req.query.sourceId as string | undefined;

    // ÚJ: Törzs mód támogatása - ha torzsMode=true, akkor automatikusan 24 órás adatokat tölt le
    const maxAgeHours =
      req.query.torzsMode === 'true' ? 24 : validateMaxAgeHours(req.query.maxAgeHours as string);
    const cutoffTimestamp = calculateCutoffTimestamp(maxAgeHours);

    logger.info(
      `Hírek lekérdezése ország szerint: ${country}, limit: ${limit}, offset: ${offset}, maxAgeHours: ${maxAgeHours}`,
    );

    const cacheKey = `country:news:${country}`;
    const cachedItem = newsCache.get(cacheKey);

    // ESET 1: Van FRISS adat a cache-ben
    if (cachedItem && Date.now() - cachedItem.timestamp < CACHE_DURATION_MS) {
        logger.info(`[CACHE HIT] Friss adatok a cache-ből: ${cacheKey}`);
        return res.json(cachedItem.data);
    }

    // ESET 2: Van LEJÁRT adat a cache-ben (Stale-While-Revalidate)
    if (cachedItem) {
        logger.info(`[CACHE STALE] Lejárt adatok azonnali kiszolgálása: ${cacheKey}`);
        res.json(cachedItem.data); // Azonnali válasz

        if (!refreshLocks.has(cacheKey)) {
            refreshLocks.add(cacheKey);
            logger.info(`[REVALIDATE START] Háttérfrissítés indítása: ${cacheKey}`);

            (async () => {
                try {
                  // 1. Először lekérjük az ország forrásait
                  const sources = await sourcesService.getCountrySources(country);

                  let filteredSources = sources;
                  // ÚJ: Ha van sourceId, csak az adott forrást dolgozzuk fel
                  if (sourceId) {
                    filteredSources = sources.filter((src) => src.eredeti_id === sourceId);
                  }

                  if (!filteredSources || filteredSources.length === 0) {
                    logger.warn(`Nem található forrás az alábbi országhoz: ${country}`);
                    return;
                  }

                  // 2. Batch feldolgozás implementáció
                  const batchSize = 5; // Egyszerre 5 forrást dolgozunk fel
                  const allNewsItems: NewsItem[] = [];
                  for (let i = 0; i < filteredSources.length; i += batchSize) {
                    const batch = filteredSources.slice(i, i + batchSize);
                    const batchPromises = batch.map((source) => {
                      const sourceRow: SourceRow = {
                        eredeti_id: source.eredeti_id || '',
                        cim: source.cim || '',
                        url: source.url || '',
                        rss_feed: source.rss_feed,
                        orszag: source.orszag || '',
                        kontinens: source.kontinens,
                        fontossag: source.fontossag,
                      };
                      return newsService.getNewsFromSource(sourceRow).catch((err) => {
                        logger.warn(`Hiba a ${source.cim} hírforrás lekérdezésekor:`, err);
                        return [] as NewsItem[];
                      });
                    });
                    const batchResults = await Promise.all(batchPromises);
                    batchResults.forEach((items) => {
                      if (Array.isArray(items)) {
                        allNewsItems.push(...items);
                      }
                    });
                    if (i + batchSize < filteredSources.length) {
                      await new Promise((resolve) => setTimeout(resolve, 10));
                    }
                  }

                  const filteredByTime = filterNewsByAge(allNewsItems, maxAgeHours);
                  const uniqueFilteredItems = filteredByTime.filter(
                    (news, index, self) => index === self.findIndex((n) => n.url === news.url),
                  );
                  const processedItems = uniqueFilteredItems.map(newsItemToProcessedRssItem);
                  const cleanedNewsItems = filterProblematicSources(processedItems);
                  if (cleanedNewsItems.length > 0) {
                    // Kikeressük az eredeti forrásadatokat a könnyebb hozzáférésért
                    const sourcesMap = new Map(sources.map(s => [s.eredeti_id, s]));

                    const itemsToSave: NewsItemForDb[] = cleanedNewsItems.map(item => {
                        // Megkeressük a hírhez tartozó teljes forrás objektumot
                        const sourceData = sourcesMap.get(item.sourceId);

                        // --- IDE ILLSZD BE A LOGOLÁST ---
                        // if (item.source && (item.source.includes('Star Tribune') || item.source.includes('Independent'))) {
                        //   console.log(`[DEBUG] Forrás adatai a DB-ből (${item.source}):`, sourceData);
                        // }
                        // ------------------------------------

                        return {
                            // Meglévő adatok
                            country_code: item.country ? item.country.substring(0, 2).toUpperCase() : 'XX',
                            source_slug: item.sourceId,
                            title: item.title || 'Untitled',
                            url: item.url,
                            published_at: item.timestamp ? new Date(item.timestamp) : new Date(),
                            description: item.description || null,
                            image_url: item.imageUrl || null,
                            content: (item as any).content || null,

                            // --- ÚJ, BŐVÍTETT ADATOK A FORRÁSBÓL ---
                            source_name: sourceData?.cim || item.source,
                            continent: sourceData?.kontinens || item.continent || '',
                            source_language: sourceData?.nyelv || 'en', // 'en' mint fallback
                            source_importance: sourceData?.fontossag || 99, // 99 mint 'ismeretlen'
                            source_url: sourceData?.url || '',
                            source_rss_feed: sourceData?.rss_feed || '',
                            source_sections: sourceData?.sections || {},
                            orszag: sourceData?.orszag || item.country || ''
                        };
                    });

                    // console.log('--- ADATOK MENTÉS ELŐTT ---');
                    // console.log(JSON.stringify(itemsToSave, null, 2));
                    // ------------------------------------

                    logger.info(`[DB MENTÉS INDUL] ${itemsToSave.length} hír mentése a háttérben a(z) ${country} országhoz.`);
                    saveNewsToDatabase(itemsToSave).catch((err: unknown) => {
                        logger.error('[DB MENTÉS] A háttérben futó mentés hibára futott (Country.ts):', err);
                    });
                  }
                  const sortedItems = cleanedNewsItems
                    .sort((a, b) => {
                      const dateA = a.date ? new Date(a.date).getTime() : 0;
                      const dateB = b.date ? new Date(a.date).getTime() : 0;
                      return dateB - dateA;
                    })
                    .slice(offset, offset + limit);
                  const news = sortedItems.map((item) => ({
                    id: item.id || generateUniqueId(),
                    title: item.title || 'Cím nélküli hír',
                    description: item.description || '',
                    url: item.url || '',
                    imageUrl: item.imageUrl || '',
                    source: item.source || '',
                    sourceId: item.sourceId || '',
                    date: item.date || '',
                    timestamp: item.timestamp || Date.now(),
                    country: item.country || country,
                    continent: item.continent || '',
                  }));
                  const response = {
                    news,
                    meta: {
                      total: filteredByTime.length,
                      limit,
                      offset,
                      hasMore: offset + limit < filteredByTime.length,
                      maxAgeHours,
                      cutoffTimestamp,
                      filteredByAge: true,
                      originalTotal: allNewsItems.length,
                      filteredOutCount: allNewsItems.length - filteredByTime.length,
                    },
                  };
                  newsCache.set(cacheKey, { timestamp: Date.now(), data: response });
                  logger.info(`[REVALIDATE SUCCESS] Cache sikeresen frissítve: ${cacheKey}`);
                } catch(err) {
                    const error = err as Error;
                    logger.error(`Hiba a háttérfrissítés során (${cacheKey}):`, error);
                } finally {
                  refreshLocks.delete(cacheKey);
                  logger.info(`[REVALIDATE END] Háttérfrissítés vége: ${cacheKey}`);
                }
            })();
            return; // KILÉPÜNK, MERT A VÁLASZT MÁR ELKÜLDTÜK
        } else {
            logger.info(`[REVALIDATE SKIP] Háttérfrissítés már fut, kihagyva: ${cacheKey}`);
        }
        return; // KILÉPÜNK, MERT A VÁLASZT MÁR ELKÜLDTÜK
    }

    // --- SZEKCIÓ 2: CACHE MISS (HIDEG INDÍTÁS) ---
    // Ez a kód csak akkor fut le, ha a cache teljesen üres volt.
    logger.info(`[CACHE MISS] Teljes lekérdezés indul (felhasználó vár): ${cacheKey}`);
    refreshLocks.add(cacheKey);

    try {
      // 1. Először lekérjük az ország forrásait
      const sources = await sourcesService.getCountrySources(country);

      let filteredSources = sources;
      // ÚJ: Ha van sourceId, csak az adott forrást dolgozzuk fel
      if (sourceId) {
        filteredSources = sources.filter((src) => src.eredeti_id === sourceId);
      }

      if (!filteredSources || filteredSources.length === 0) {
        logger.warn(`Nem található forrás az alábbi országhoz: ${country}`);
        return res.json({
          news: [],
          meta: {
            total: 0,
            limit,
            offset,
            hasMore: false,
          },
        });
      }

      // 2. Batch feldolgozás implementáció
      const batchSize = 5; // Egyszerre 5 forrást dolgozunk fel
      // Hírek összegyűjtése
      const allNewsItems: NewsItem[] = []; // Changed from any[] to NewsItem[]

      // Források feldolgozása kötegekben
      for (let i = 0; i < filteredSources.length; i += batchSize) {
        const batch = filteredSources.slice(i, i + batchSize);

        // Párhuzamos kérések indítása a NewsService segítségével
        const batchPromises = batch.map((source) => {
          // Convert database source to SourceRow type
          const sourceRow: SourceRow = {
            eredeti_id: source.eredeti_id || '',
            cim: source.cim || '',
            url: source.url || '',
            rss_feed: source.rss_feed,
            orszag: source.orszag || '',
            kontinens: source.kontinens,
            fontossag: source.fontossag,
          };

          // Valós adatok lekérése a NewsService-en keresztül
          return newsService.getNewsFromSource(sourceRow).catch((err) => {
            logger.warn(`Hiba a ${source.cim} hírforrás lekérdezésekor:`, err);
            return [] as NewsItem[]; // Explicitly typed empty array
          });
        });

        // Várjuk meg az összes kérés befejezését
        const batchResults = await Promise.all(batchPromises);

        // Eredmények összegyűjtése
        batchResults.forEach((items) => {
          if (Array.isArray(items)) {
            allNewsItems.push(...items);
          }
        });

        // CPU terhelés csökkentése
        if (i + batchSize < filteredSources.length) {
          await new Promise((resolve) => setTimeout(resolve, 10));
        }
      }

      // ÚJ: Egységes időalapú szűrés a közös timeUtils.ts modulból
      const filteredByTime = filterNewsByAge(allNewsItems, maxAgeHours);

      // ✅ JAVÍTOTT: URL alapú duplikáció szűrés (Jason Segel probléma megoldása)
      const uniqueFilteredItems = filteredByTime.filter(
        (news, index, self) => index === self.findIndex((n) => n.url === news.url),
      );

      // Adapter: NewsItem → ProcessedRssItem
      const processedItems = uniqueFilteredItems.map(newsItemToProcessedRssItem);
      // Problémás források szűrése
      const cleanedNewsItems = filterProblematicSources(processedItems);

      // --- LOGOLÁSI PONT #2: DB MENTÉS INDÍTÁSA ---
      if (cleanedNewsItems.length > 0) {
        // Kikeressük az eredeti forrásadatokat a könnyebb hozzáférésért
        const sourcesMap = new Map(sources.map(s => [s.eredeti_id, s]));

        const itemsToSave: NewsItemForDb[] = cleanedNewsItems.map(item => {
            // Megkeressük a hírhez tartozó teljes forrás objektumot
            const sourceData = sourcesMap.get(item.sourceId);

            // --- IDE ILLSZD BE A LOGOLÁST ---
            // if (item.source && (item.source.includes('Star Tribune') || item.source.includes('Independent'))) {
            //   console.log(`[DEBUG] Forrás adatai a DB-ből (${item.source}):`, sourceData);
            // }
            // ------------------------------------

            return {
                // Meglévő adatok
                country_code: item.country ? item.country.substring(0, 2).toUpperCase() : 'XX',
                source_slug: item.sourceId,
                title: item.title || 'Untitled',
                url: item.url,
                published_at: item.timestamp ? new Date(item.timestamp) : new Date(),
                description: item.description || null,
                image_url: item.imageUrl || null,
                content: (item as any).content || null,

                // --- ÚJ, BŐVÍTETT ADATOK A FORRÁSBÓL ---
                source_name: sourceData?.cim || item.source,
                continent: sourceData?.kontinens || item.continent || '',
                source_language: sourceData?.nyelv || 'en', // 'en' mint fallback
                source_importance: sourceData?.fontossag || 99, // 99 mint 'ismeretlen'
                source_url: sourceData?.url || '',
                source_rss_feed: sourceData?.rss_feed || '',
                source_sections: sourceData?.sections || {},
                orszag: sourceData?.orszag || item.country || ''
            };
        });

        // console.log('--- ADATOK MENTÉS ELŐTT ---');
        // console.log(JSON.stringify(itemsToSave, null, 2));
        // ------------------------------------

        logger.info(`[DB MENTÉS INDUL] ${itemsToSave.length} hír mentése a háttérben a(z) ${country} országhoz.`);
        saveNewsToDatabase(itemsToSave).catch((err: unknown) => {
            logger.error('[DB MENTÉS] A háttérben futó mentés hibára futott (Country.ts):', err);
        });
      }

      // 3. Rendezés és lapozás a szűrt hírekből
      const sortedItems = cleanedNewsItems
        .sort((a, b) => {
          // Biztonságos date parsing - undefined ellenőrzéssel
          const dateA = a.date ? new Date(a.date).getTime() : 0;
          const dateB = b.date ? new Date(a.date).getTime() : 0;
          return dateB - dateA; // Legújabbak elöl
        })
        .slice(offset, offset + limit);

      // 4. Adatok formázása a válaszhoz
      const news = sortedItems.map((item) => ({
        id: item.id || generateUniqueId(),
        title: item.title || 'Cím nélküli hír',
        description: item.description || '',
        url: item.url || '',
        imageUrl: item.imageUrl || '',
        source: item.source || '',
        sourceId: item.sourceId || '',
        date: item.date || '',
        timestamp: item.timestamp || Date.now(),
        country: item.country || country,
        continent: item.continent || '',
      }));

      const response = {
        news,
        meta: {
          total: filteredByTime.length, // ← módosítva: szűrt hírek száma
          limit,
          offset,
          hasMore: offset + limit < filteredByTime.length, // ← módosítva: szűrt hírek alapján
          // ÚJ: Időszűrési metaadatok
          maxAgeHours,
          cutoffTimestamp,
          filteredByAge: true,
          originalTotal: allNewsItems.length, // Eredeti hírek száma szűrés előtt
          filteredOutCount: allNewsItems.length - filteredByTime.length, // Kiszűrt hírek száma
        },
      };

      // --- LOGOLÁSI PONT #3: CACHE ÍRÁS ---
      newsCache.set(cacheKey, { timestamp: Date.now(), data: response });
      logger.info(`[CACHE SET] Adatok a cache-be írva: ${cacheKey}`);

      res.json(response);
    } finally {
      refreshLocks.delete(cacheKey);
      logger.info(`[LOCK RELEASE] Frissítés vége: ${cacheKey}`);
    }
  } catch (err) {
    // TypeScript hiba javítása
    const error = err as Error;
    logger.error(
      `Hiba az országhoz tartozó hírek lekérdezése során (${req.params.country}):`,
      error,
    );
    res.status(500).json({
      error: 'Hiba történt a hírek lekérdezése közben',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
});

/**
 * Országok lekérdezése betű szerint
 * GET /api/country/by-letter/:letter
 */
router.get('/by-letter/:letter', async (req, res) => {
  try {
    const { letter } = req.params;
    logger.info(`Országok lekérdezése betű szerint: ${letter}`);

    // SourcesService használata - megszünteti a SQL duplikációt
    const countries = await sourcesService.getCountriesByLetter(letter);

    res.json(countries);
  } catch (err) {
    // TypeScript hiba javítása
    const error = err as Error;
    logger.error(`Hiba az országok betű szerinti lekérdezése során (${req.params.letter}):`, error);
    res.status(500).json({
      error: 'Hiba történt az országok lekérdezése közben',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
});

export default router;
