/**
 * Local - Helyi tartalmak és felhasználói beállítások API végpontjai.
 * SESSION-MENTES VERZIÓ - Csak query paraméter alapú működés
 
A szoftver-fejlesztésben fontos alapelv 
a YAGNI (You Aren't Gonna Need It) 
- ne vezess be komplexitást
 */
import express from 'express';
import { logger } from '../../../server/logger.js';
import { AppError } from '../../../server/middleware/error-handler.js';
import { generateETag } from '../../utils/cacheUtils.js';
import { isProd } from '../../../server/config/environment.js';
import axios from 'axios';
import { SourcesService } from '../../../server/data/PostgreSQLDataAccess.js';
// Importáljuk a konfigurációs fájlt
import { RSS_CONFIG, CACHE_TIMES } from './config/localConfig.js';
// SESSION IMPORT TÖRÖLVE - már nem szükséges
import { parseXmlWithBomAndErrorLogging, extractRssItems } from '../../common/safeRssXmlParser/safeRssXmlParser.js';

// ÚJ: Egységes időkezelési modulok importálása
import {
  validateMaxAgeHours,
  calculateCutoffTimestamp,
  filterNewsByAge,
} from '../../utils/timeUtils.js';

// ÚJ: Import az imageExtractor.ts-ből
import { extractBestImageUniversal } from '../../common/imageExtractor/imageExtractor.js';

// ÚJ: Import a problémás források szűrőjéből
import { filterProblematicSources } from '../../common/problematicSourcesFilter.js';

// ÚJ: Import a hírek adatbázisba mentéséhez
import { saveNewsToDatabase, NewsItemForDb } from '../../../common/db/newsStorage.js';

// Memória cache a hírekhez
const newsCache = new Map<string, { timestamp: number, data: any }>();
const CACHE_DURATION_MS = 3 * 60 * 1000; // 3 perc
// --- ÚJ: cache lock a tülekedés elkerülésére ---
const refreshLocks = new Set<string>();

/////////////////////////////////////////////////////
// KIKOMMENTÁLVA - ÁT LETT VINVE → imageExtractor.ts
// const MEDIA_CONTENT_FIELD = 'media:content';
// const MEDIA_THUMBNAIL_FIELD = 'media:thumbnail';
////////////////////////////////////////////////////

// SESSION TÍPUS DEKLARÁCIÓ TÖRÖLVE - már nem szükséges

// Router inicializálása - ELEJÉN KELL LENNIE
const router = express.Router();
const sourcesService = new SourcesService(); // SourcesService példányosítása

// Típusdefiníciók

// UserLocation INTERFÉSZ TÖRÖLVE - session nélkül felesleges

interface RssSource {
  eredeti_id: string;
  cim: string;
  url: string;
  rss_feed: string;
  fontossag: number;
  orszag: string;
  kontinens?: string;
  // ✅ ÚJ: sections mező hozzáadása
  sections?: { name: string; url: string }[];
  nyelv?: string; // <<-- HOZZÁADVA a nyelv mező
}

// Define a type for individual RSS items
interface RssItem {
  title?: string;
  description?: string;
  link?: string;
  pubDate?: string;
  enclosure?: { $: { url?: string; type?: string } };
  image?: { url?: string | string[]; width?: string; height?: string }; // ÚJ: Magyar Hírlap <image><url> tag támogatás
  ['media:content']?: {
    $: { url?: string };
    ['media:thumbnail']?: { $: { url?: string } }; // ÚJ: media:thumbnail típus
  };
  category?: string | string[];
  timestamp?: number; // Add timestamp property
}

// New interface for processed RSS items that include all required properties
interface ProcessedRssItem extends RssItem {
  id: string;
  imageUrl: string;
  source: string;
  sourceId: string;
  date: string;
  url: string;
  country: string;
  continent: string;
  categories: string[];
  hasRssFeed: boolean;
  sourceStatus: string;
  [key: string]: unknown; // ÚJ: Index signature hozzáadása a timeUtils kompatibilitáshoz
}

/**
 * RSS feed tartalom lekérése és feldolgozása
 * @param feedUrl Az RSS feed URL címe
 * @param source A forrás adatai
 */
// eslint-disable-next-line complexity
async function fetchAndParseRssFeed(
  feedUrl: string,
  source: RssSource,
): Promise<ProcessedRssItem[]> {
  try {
    const response = await axios.get(feedUrl, {
      responseType: 'arraybuffer',
      timeout: RSS_CONFIG.FETCH_TIMEOUT,
      headers: {
        'User-Agent': 'Mozilla/5.0 News Reader/1.0',
      },
    });

    const contentType = response.headers['content-type']?.toLowerCase() || '';
    const responseBuffer: Buffer = response.data;

    // HTML vagy JSON Content-Type ellenőrzése
    if (contentType.includes('text/html') || contentType.includes('application/json')) {
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
        return [];
      }
    }

    const parsedXmlObject = await parseXmlWithBomAndErrorLogging(responseBuffer, response.headers, {
      feedUrl,
      sourceId: source.eredeti_id,
    });

    // ÚJ: Hírek kinyerése az RSS-ből - ez hiányzott!
    const items: RssItem[] = extractRssItems(parsedXmlObject);

    // Hírek átalakítása egységes formátumra
    // eslint-disable-next-line complexity
    return await Promise.all(
      items.map(async (item: RssItem, index: number) => {
        // ÚJ: Aszinkron képkinyerés az extractBestImageUniversal használatával (favicon fallback-kal)
        // Példa channel-szintű adat kinyerésére és átadására
        const channel = parsedXmlObject.rss.channel; // Feltételezve, hogy a parszolt feed tartalmazza a channel-t

        // Módosított extractBestImageUniversal hívás (favicon fallback-kal)
        const imageUrl = await extractBestImageUniversal(item, feedUrl);

        // Dátum feldolgozása és timestamp generálása
        const pubDateString = item.pubDate || '';
        const parsedDate = new Date(pubDateString);
        const timestamp = isNaN(parsedDate.getTime()) ? Date.now() : parsedDate.getTime();
        const displayDate = pubDateString || new Date(timestamp).toISOString();

        // Return ProcessedRssItem objektum
        return {
          ...item,
          id: `${source.eredeti_id}-${timestamp}-${index}`,
          title: item.title || 'Untitled news',
          description: item.description
            ? item.description.replace(/<\/?[^>]+(>|$)/g, '').substring(0, 280)
            : 'No description',
          imageUrl,
          source: source.cim,
          sourceId: source.eredeti_id,
          date: displayDate,
          timestamp,
          url: item.link || '',
          country: source.orszag,
          continent: source.kontinens || 'Europe',
          hasRssFeed: true,
          sourceStatus: 'valid',
          categories: item.category
            ? Array.isArray(item.category)
              ? item.category
              : [item.category]
            : [],
        };
      }),
    );
  } catch (error) {
    logger.error(
      `Hiba az RSS feed feldolgozása közben (${source.eredeti_id}, ${feedUrl}): ${error instanceof Error ? error.message : String(error)}`,
    );
    return [];
  }
}

///////////////////////////////////////////////////

// ÚJ: Hírgyűjtő, feldolgozó és cache-be író függvény
async function fetchProcessAndStoreNews(queryParams: any): Promise<any> {
  // IDE FOGJUK ÁTHELYEZNI A TELJES HÍRGYŰJTŐ LOGIKÁT
  // A függvény egy teljes "response" objektumot fog visszaadni
}

/**
 * Helyi hírek lekérdezése - EGYSZERŰSÍTETT, SESSION-MENTES
 * GET /api/local/news?country=HU&importanceLevel=1&limit=20&offset=0
 */
router.get(
  '/news',
  async (req: express.Request, res: express.Response, next: express.NextFunction) => {
    const countryQueryParam = req.query.country as string | undefined;
    const sourceIdQueryParam = req.query.sourceId as string | undefined;

    // Ha nincs se country, se sourceId, akkor dobunk hibát.
    if (!countryQueryParam && !sourceIdQueryParam) {
      return next(new AppError('A "country" vagy "sourceId" query paraméter megadása kötelező.', 400));
    }
    // ⭐ A LÉNYEG: A cache kulcsnak a sourceId-t kell priorizálnia! ⭐
    const cacheKey = sourceIdQueryParam 
      ? `local:source:${sourceIdQueryParam}`  // Ha van sourceId, a cache kulcs egyedi a forrásra.
      : `local:news:${countryQueryParam}`;    // Ha nincs sourceId, akkor az országra vonatkozik.

    try {
      const cachedItem = newsCache.get(cacheKey);

      // ESET 1: Van FRISS adat a cache-ben
      if (cachedItem && Date.now() - cachedItem.timestamp < CACHE_DURATION_MS) {
        logger.info(`[CACHE HIT] Friss adatok a cache-ből: ${cacheKey}`);
        return res.json(cachedItem.data);
      }

      // ESET 2: Van LEJÁRT adat a cache-ben (Stale-While-Revalidate)
      if (cachedItem) {
        logger.info(`[CACHE STALE] Lejárt adatok azonnali kiszolgálása: ${cacheKey}`);
        res.json(cachedItem.data);

        if (!refreshLocks.has(cacheKey)) {
          refreshLocks.add(cacheKey);
          logger.info(`[REVALIDATE START] Háttérfrissítés indítása: ${cacheKey}`);

          (async () => {
            try {
              // --- HÍRGYŰJTŐ LOGIKA (HÁTTÉRMUNKA) ---
              const importanceLevel = parseInt(req.query.importanceLevel as string) || RSS_CONFIG.IMPORTANCE_LEVELS.CRITICAL;
              const limit = parseInt(req.query.limit as string) || 1000;
              const offset = parseInt(req.query.offset as string) || 0;
              const sourceId = req.query.sourceId as string | undefined;
              const maxAgeHours = req.query.torzsMode === 'true' ? 24 : validateMaxAgeHours(req.query.maxAgeHours as string);
              const cutoffTimestamp = calculateCutoffTimestamp(maxAgeHours);

              let sourcesResult: RssSource[] = [];
              if (sourceId) {
                const foundSourceRaw = await sourcesService.getSourceById(sourceId);
                if (foundSourceRaw) {
                  sourcesResult = [{
                    eredeti_id: foundSourceRaw.eredeti_id,
                    cim: foundSourceRaw.cim,
                    url: foundSourceRaw.url,
                    rss_feed: foundSourceRaw.rss_feed,
                    fontossag: foundSourceRaw.fontossag,
                    orszag: foundSourceRaw.orszag,
                    kontinens: foundSourceRaw.kontinens,
                    sections: foundSourceRaw.sections,
                  }];
                }
              } else if (countryQueryParam) {
                const rawSources = await sourcesService.getCountrySourcesByImportanceLevel(
                  countryQueryParam,
                  importanceLevel,
                  limit,
                  offset
                );
                sourcesResult = (rawSources || []).map((src) => ({
                  eredeti_id: src.eredeti_id,
                  cim: src.cim,
                  url: src.url,
                  rss_feed: src.rss_feed,
                  fontossag: src.fontossag,
                  orszag: src.orszag,
                  kontinens: src.kontinens,
                  sections: src.sections,
                }));
              }

              const allNewsPromises = sourcesResult
                .filter((source): source is RssSource => Boolean(source.rss_feed))
                .flatMap((source) => {
                  const promises: Promise<ProcessedRssItem[]>[] = [];
                  if (source.rss_feed) {
                    promises.push(fetchAndParseRssFeed(source.rss_feed, source));
                  }
                  if (source.sections && source.sections.length > 0) {
                    for (const section of source.sections) {
                      promises.push(fetchAndParseRssFeed(section.url, { ...source, cim: `${source.cim} - ${section.name}` }));
                    }
                  }
                  return promises;
                });
              const allNewsResults = await Promise.allSettled(allNewsPromises);
              const allNewsItems: ProcessedRssItem[] = allNewsResults
                .filter((result) => result.status === 'fulfilled')
                .flatMap((result) => result.value as ProcessedRssItem[]);
              const uniqueNewsItems = allNewsItems.filter((news, index, self) => index === self.findIndex((n) => n.url === news.url));
              const cleanedNewsItems = filterProblematicSources(uniqueNewsItems);
              if (cleanedNewsItems.length > 0) {
                const sourcesMap = new Map(sourcesResult.map(s => [s.eredeti_id, s]));

                const itemsToSave: NewsItemForDb[] = cleanedNewsItems.map(item => {
                  const sourceData = sourcesMap.get(item.sourceId);

                  // --- IDE ILLSZD BE A LOGOLÁST ---
                  if (item.source && (item.source.includes('Star Tribune') || item.source.includes('Independent'))) {
                    console.log(`[DEBUG] Forrás adatai a DB-ből (${item.source}):`, sourceData);
                  }
                  // ------------------------------------

                  return {
                    country_code: item.country ? item.country.substring(0, 2).toUpperCase() : 'XX',
                    source_slug: item.sourceId,
                    title: item.title || 'Untitled',
                    url: item.url,
                    published_at: new Date(item.timestamp || Date.now()),
                    description: item.description || null,
                    image_url: item.imageUrl || null,
                    content: (item as any).content || null,
                    source_name: sourceData?.cim || item.source,
                    continent: sourceData?.kontinens || item.continent || '',
                    source_language: sourceData?.nyelv || 'en',
                    source_importance: sourceData?.fontossag || 99,
                    source_url: sourceData?.url || '',
                    source_rss_feed: sourceData?.rss_feed || '',
                    source_sections: sourceData?.sections || {},
                    orszag: sourceData?.orszag || item.country || '' // <-- HIÁNYZÓ SOR PÓTLÁSA
                  };
                });

                // console.log('--- ADATOK MENTÉS ELŐTT (Local) ---');
                // console.log(JSON.stringify(itemsToSave, null, 2));

                logger.info(`[DB MENTÉS INDUL] ${itemsToSave.length} hír mentése a háttérben a(z) ${countryQueryParam} országhoz.`);
                saveNewsToDatabase(itemsToSave).catch(err => {
                  logger.error('[DB MENTÉS HIBA] Hiba a háttérben futó mentés közben (Local.ts):', err);
                });
              }
              const filteredNewsItems = filterNewsByAge(cleanedNewsItems, maxAgeHours);
              let nextImportanceLevel = null;
              if (!sourceId && countryQueryParam) {
                nextImportanceLevel = await sourcesService.hasNextImportanceLevel(countryQueryParam, importanceLevel);
              }
              const response = {
                news: filteredNewsItems.map((item) => ({
                  id: item.id,
                  title: item.title,
                  description: item.description,
                  imageUrl: item.imageUrl,
                  source: item.source,
                  sourceId: item.sourceId,
                  date: item.date,
                  
                  timestamp: item.timestamp,
                  url: item.url,
                  country: item.country,
                  continent: item.continent,
                  categories: item.categories,
                  hasRssFeed: item.hasRssFeed,
                  sourceStatus: item.sourceStatus,
                })),
                meta: {
                  country: countryQueryParam || null,
                  currentImportanceLevel: importanceLevel,
                  nextImportanceLevel: nextImportanceLevel ? importanceLevel + 1 : null,
                  hasMore: Boolean(nextImportanceLevel),
                  total: filteredNewsItems.length,
                  timestamp: Date.now(),
                  maxAgeHours: maxAgeHours,
                  cutoffTimestamp: cutoffTimestamp,
                  filteredByAge: true,
                },
              };
              newsCache.set(cacheKey, { timestamp: Date.now(), data: response });
              logger.info(`[REVALIDATE SUCCESS] Cache sikeresen frissítve: ${cacheKey}`);
            } catch (error) {
              logger.error(`Hiba a háttérfrissítés során (${cacheKey}):`, error);
            } finally {
              refreshLocks.delete(cacheKey);
              logger.info(`[REVALIDATE END] Háttérfrissítés vége: ${cacheKey}`);
            }
          })();
        }
        return;
      }

      // ESET 3: NINCS SEMMI a cache-ben (hideg indítás)
      logger.info(`[CACHE MISS] Teljes lekérdezés indul (felhasználó vár): ${cacheKey}`);
      refreshLocks.add(cacheKey);
      try {
        const importanceLevel = parseInt(req.query.importanceLevel as string) || RSS_CONFIG.IMPORTANCE_LEVELS.CRITICAL;
        const limit = parseInt(req.query.limit as string) || 1000;
        const offset = parseInt(req.query.offset as string) || 0;
        const sourceId = req.query.sourceId as string | undefined;
        const maxAgeHours = req.query.torzsMode === 'true' ? 24 : validateMaxAgeHours(req.query.maxAgeHours as string);
        const cutoffTimestamp = calculateCutoffTimestamp(maxAgeHours);

        let sourcesResult: RssSource[] = [];
        if (sourceId) {
          const foundSourceRaw = await sourcesService.getSourceById(sourceId);
          if (foundSourceRaw) {
            sourcesResult = [{
              eredeti_id: foundSourceRaw.eredeti_id,
              cim: foundSourceRaw.cim,
              url: foundSourceRaw.url,
              rss_feed: foundSourceRaw.rss_feed,
              fontossag: foundSourceRaw.fontossag,
              orszag: foundSourceRaw.orszag,
              kontinens: foundSourceRaw.kontinens,
              sections: foundSourceRaw.sections,
            }];
          }
        } else if (countryQueryParam) {
          const rawSources = await sourcesService.getCountrySourcesByImportanceLevel(
            countryQueryParam,
            importanceLevel,
            limit,
            offset
          );
          sourcesResult = (rawSources || []).map((src) => ({
            eredeti_id: src.eredeti_id,
            cim: src.cim,
            url: src.url,
            rss_feed: src.rss_feed,
            fontossag: src.fontossag,
            orszag: src.orszag,
            kontinens: src.kontinens,
            sections: src.sections,
          }));
        }

        const allNewsPromises = sourcesResult
          .filter((source): source is RssSource => Boolean(source.rss_feed))
          .flatMap((source) => {
            const promises: Promise<ProcessedRssItem[]>[] = [];
            if (source.rss_feed) {
              promises.push(fetchAndParseRssFeed(source.rss_feed, source));
            }
            if (source.sections && source.sections.length > 0) {
              for (const section of source.sections) {
                promises.push(fetchAndParseRssFeed(section.url, { ...source, cim: `${source.cim} - ${section.name}` }));
              }
            }
            return promises;
          });
        const allNewsResults = await Promise.allSettled(allNewsPromises);
        const allNewsItems: ProcessedRssItem[] = allNewsResults
          .filter((result) => result.status === 'fulfilled')
          .flatMap((result) => result.value as ProcessedRssItem[]);
        const uniqueNewsItems = allNewsItems.filter((news, index, self) => index === self.findIndex((n) => n.url === news.url));
        const cleanedNewsItems = filterProblematicSources(uniqueNewsItems);
        if (cleanedNewsItems.length > 0) {
          const sourcesMap = new Map(sourcesResult.map(s => [s.eredeti_id, s]));

          const itemsToSave: NewsItemForDb[] = cleanedNewsItems.map(item => {
            const sourceData = sourcesMap.get(item.sourceId);

            // --- IDE ILLSZD BE A LOGOLÁST ---
            if (item.source && (item.source.includes('Star Tribune') || item.source.includes('Independent'))) {
              console.log(`[DEBUG] Forrás adatai a DB-ből (${item.source}):`, sourceData);
            }
            // ------------------------------------

            return {
              country_code: item.country ? item.country.substring(0, 2).toUpperCase() : 'XX',
              source_slug: item.sourceId,
              title: item.title || 'Untitled',
              url: item.url,
              published_at: new Date(item.timestamp || Date.now()),
              description: item.description || null,
              image_url: item.imageUrl || null,
              content: (item as any).content || null,
              source_name: sourceData?.cim || item.source,
              continent: sourceData?.kontinens || item.continent || '',
              source_language: sourceData?.nyelv || 'en',
              source_importance: sourceData?.fontossag || 99,
              source_url: sourceData?.url || '',
              source_rss_feed: sourceData?.rss_feed || '',
              source_sections: sourceData?.sections || {},
              orszag: sourceData?.orszag || item.country || '' // <-- HIÁNYZÓ SOR PÓTLÁSA
            };
          });

          // console.log('--- ADATOK MENTÉS ELŐTT (Local) ---');
          // console.log(JSON.stringify(itemsToSave, null, 2));

          logger.info(`[DB MENTÉS INDUL] ${itemsToSave.length} hír mentése a háttérben a(z) ${countryQueryParam} országhoz.`);
          saveNewsToDatabase(itemsToSave).catch(err => {
            logger.error('[DB MENTÉS HIBA] Hiba a háttérben futó mentés közben (Local.ts):', err);
          });
        }
        const filteredNewsItems = filterNewsByAge(cleanedNewsItems, maxAgeHours);
        let nextImportanceLevel = null;
        if (!sourceId && countryQueryParam) {
          nextImportanceLevel = await sourcesService.hasNextImportanceLevel(countryQueryParam, importanceLevel);
        }
        const response = {
          news: filteredNewsItems.map((item) => ({
            id: item.id,
            title: item.title,
            description: item.description,
            imageUrl: item.imageUrl,
            source: item.source,
            sourceId: item.sourceId,
            date: item.date,
            timestamp: item.timestamp,
            url: item.url,
            country: item.country,
            continent: item.continent,
            categories: item.categories,
            hasRssFeed: item.hasRssFeed,
            sourceStatus: item.sourceStatus,
          })),
          meta: {
            country: countryQueryParam || null,
            currentImportanceLevel: importanceLevel,
            nextImportanceLevel: nextImportanceLevel ? importanceLevel + 1 : null,
            hasMore: Boolean(nextImportanceLevel),
            total: filteredNewsItems.length,
            timestamp: Date.now(),
            maxAgeHours: maxAgeHours,
            cutoffTimestamp: cutoffTimestamp,
            filteredByAge: true,
          },
        };
        newsCache.set(cacheKey, { timestamp: Date.now(), data: response });
        const etag = generateETag(response, 'local-news');
        res.setHeader('ETag', etag);
        res.setHeader(
          'Cache-Control',
          isProd ? `public, max-age=${CACHE_TIMES.SHORT / 1000}` : 'no-cache',
        );
        res.json(response);
      } catch (error) {
        next(error);
      } finally {
        if (cacheKey && refreshLocks.has(cacheKey)) {
          refreshLocks.delete(cacheKey);
        }
      }
    } catch (error) {
      next(error);
    }
  },
);

/**
 * Helyadatok lekérdezése - SESSION-MENTES VERZIÓ
 * GET /api/local/location
 */
router.get('/location', async (req: express.Request, res: express.Response) => {
  // Session nélkül nincs tárolt hely, mindig 404
  logger.info('GET /api/local/location: Session-mentes verzió - nincs backend oldali helytárolás');
  return res.status(404).json({
    success: false,
    message:
      'Nincs backend oldalon tárolt helyadat. Használd a frontend geolocation API-t és küld country query paramétert.',
  });
});

export default router;
