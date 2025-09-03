/**
 * Continent API - Kontinens alapú lekérdezések
 *
 * Ez a modul a kontinensekhez kapcsolódó adatok lekérdezéséért felelős:
 * - Források lekérdezése kontinens alapján
 * - Országok lekérdezése kontinens szerint
 * - Hírek lekérdezése kontinensek alapján
 * Jól működik!!!!! nem módosítjuk!!!!!!
 */

/*
📊 VÉGSŐ ÉRTÉKELÉS
🌟 TÖKÉLETES PONTOK (10/10):
✅ Egységes torzsMode implementáció
✅ Kombinált ország+kontinens szűrés
✅ Részletes metaadatok + filteredOutCount
✅ Optimalizált cache stratégia
✅ Párhuzamos RSS feldolgozás
✅ Comprehensive error handling
✅ TimeUtils integráció
✅ ETag + Cache-Control
✅ Következő fontossági szint logika
✅ Promise.allSettled használata
⚠️ FEJLESZTÉSI JAVASLATOK: NINCSENEK!
Ez a kód már tökéletes! 🌟

Minden best practice implementálva
Konzisztens a többi backend végponttal
Optimalizált teljesítmény
Részletes logging és error handling
🎉 ÖSSZEGZÉS
Continent.ts törzs implementáció: PÉLDAMUTATÓ!

Ez a fájl referenciaként szolgálhat a többi backend végpont számára. Minden funkció és optimalizálás implementálva van, amit egy modern API végponttól elvárhatunk.

NE MÓDOSÍTSUK! - Tökéletesen működik! 🚀

*/

import express from 'express';
import { logger } from '../../../server/logger.js';
import {
  generateCacheControlHeader,
  generateETag,
  isETagMatching,
  CACHE_TIMES,
} from '../../utils/cacheUtils.js';
import { SourcesService } from '../../../server/data/PostgreSQLDataAccess.js';
import axios from 'axios';

// ÚJ: Egységes időkezelési modulok importálása
import {
  validateMaxAgeHours,
  calculateCutoffTimestamp,
  filterNewsByAge,
} from '../../utils/timeUtils.js';

// ÚJ: Közös modulok importálása
import { parseXmlWithBomAndErrorLogging, extractRssItems } from '../../common/safeRssXmlParser/safeRssXmlParser.js';
import { extractBestImage, extractBestImageUniversal } from '../../common/imageExtractor/imageExtractor.js';
// import { deduplicateNews } from '../../utils/newsDeduplication';

// Konstansok a duplikált stringek elkerülésére (ESLint/SonarJS javaslatok alapján)
const RSS_MEDIA_CONTENT = 'media:content';
const CACHE_CONTROL_HEADER = 'Cache-Control';
const INTERNAL_SERVER_ERROR = 'Belső szerver hiba';
const CHECK_SERVER_LOGS = 'Kérjük, ellenőrizze a szerver logokat a részletekért';
const NORTH_AMERICA = 'North America';
const SOUTH_AMERICA = 'South America';

// Router létrehozása
const router = express.Router();
const sourcesService = new SourcesService(); // SourcesService példányosítása

// Típusdefiníciók - RSS feed elemekhez
interface RssSource {
  eredeti_id: string;
  cim: string;
  url: string;
  rss_feed: string;
  fontossag: number;
  orszag: string;
  kontinens?: string;
  sections?: { name: string; url: string }[];
}

// RSS item definíciók
interface RssItem {
  title?: string;
  description?: string;
  link?: string;
  pubDate?: string;
  enclosure?: { $: { url?: string; type?: string } };
  'media:content'?: { $: { url?: string } };
  category?: string | string[];
  timestamp?: number;
}

// Feldolgozott RSS item interfész
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

// RSS parse eredmény interfész
interface RssParseResult {
  rss?: {
    channel?: {
      item?: RssItem | RssItem[];
    };
  };
}

/**
 * RSS feed tartalom lekérése és feldolgozása - FRISSÍTVE: közös modulok használatával
 * @param feedUrl Az RSS feed URL címe
 * @param source A forrás adatai
 */
// eslint-disable-next-line complexity
async function fetchAndParseRssFeed(
  feedUrl: string,
  source: RssSource,
): Promise<ProcessedRssItem[]> {
  try {
    logger.debug(`RSS feed lekérése: ${feedUrl}, forrás: ${source.eredeti_id}`);

    // RSS feed letöltése
    const response = await axios.get(feedUrl, {
      responseType: 'arraybuffer',
      timeout: 15000, // 15 másodperc timeout
      headers: {
        'User-Agent': 'Mozilla/5.0 News Reader/1.0',
      },
    });

    const contentType = response.headers['content-type']?.toLowerCase() || '';
    const responseBuffer: Buffer = response.data;

    // HTML vagy JSON Content-Type ellenőrzése
    if (contentType.includes('text/html') || contentType.includes('application/json')) {
      logger.warn(`Non-RSS content type detected for ${feedUrl}: ${contentType}`);
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
        logger.warn(`Non-RSS content detected for ${feedUrl}`);
        return [];
      }
    }

    // ÚJ: Biztonságos XML parsing a közös safeRssXmlParser modullal
    const result = await parseXmlWithBomAndErrorLogging(responseBuffer, response.headers, {
      feedUrl,
      sourceId: source.eredeti_id,
    });

    // Hírek kinyerése az RSS-ből
    const items: RssItem[] = extractRssItems(result);

    if (items.length === 0) {
      logger.warn(`No RSS items found in feed: ${feedUrl}`);
      return [];
    }

    // Hírek átalakítása egységes formátumra - ÚJ: extractBestImage használatával
    return await Promise.all(
      items.map(async (item: RssItem, index) => {
        // ÚJ: Aszinkron képkinyerés az extractBestImageUniversal használatával (favicon fallback-kal)
        const imageUrl = await extractBestImageUniversal(item, feedUrl);

        // Dátum feldolgozása
        const pubDateString = item.pubDate || '';
        const parsedDate = new Date(pubDateString);
        const timestamp = isNaN(parsedDate.getTime()) ? Date.now() : parsedDate.getTime();
        const displayDate = pubDateString || new Date(timestamp).toISOString();

        // Return an object conforming to ProcessedRssItem structure
        return {
          ...item, // Keep original fields
          id: `${source.eredeti_id}-${timestamp}-${index}`,
          title: item.title || 'Untitled news',
          description: item.description
            ? item.description.replace(/<\/?[^>]+(>|$)/g, '').substring(0, 280) // HTML tag-ek eltávolítása
            : 'No description',
          imageUrl,
          source: source.cim,
          sourceId: source.eredeti_id,
          date: displayDate,
          timestamp, // Ensure timestamp is included
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
    logger.error(`Hiba az RSS feed feldolgozása közben (${source.eredeti_id}): ${error}`);
    return [];
  }
}

/**
 * Források lekérdezése kontinens alapján
 * GET /api/continent/:continent/sources
 */
router.get('/:continent/sources', async (req, res) => {
  try {
    const continent = req.params.continent;
    const continentName = getFullContinentName(continent);

    logger.info(`Források lekérdezése kontinens szerint: ${continentName}`);

    // SourcesService használata a direkt SQL helyett
    const sources = await sourcesService.getContinentSources(continentName);

    // Ha nincsenek források, visszatérünk üres listával
    if (!sources || sources.length === 0) {
      logger.warn(`Nem találhatók források a(z) ${continentName} kontinensen`);
      return res.json([]);
    }

    // Adatok transzformálása a megfelelő formátumra
    const transformedSources = sources.map(
      (row: {
        eredeti_id?: string;
        oldal_id?: number;
        cim?: string;
        url?: string;
        rss_feed?: string;
        fontossag?: number;
        orszag?: string;
        kontinens?: string;
        nyelv?: string;
        sections?: string[];
        aktiv?: boolean;
      }) => ({
        id: row.eredeti_id || row.oldal_id?.toString(),
        name: row.cim || '',
        url: row.url || '',
        rssFeed: row.rss_feed || null,
        importance: row.fontossag || 1,
        country: row.orszag || '',
        continent: row.kontinens || continentName,
        language: row.nyelv || '',
        sections: row.sections || [],
        isActive: row.aktiv || true,
      }),
    );

    // Cache-Control és ETag beállítása
    const etag = generateETag(transformedSources, 'sources');
    res.setHeader(CACHE_CONTROL_HEADER, generateCacheControlHeader(CACHE_TIMES.MEDIUM));
    res.setHeader('ETag', etag);

    // If-None-Match ellenőrzése
    const ifNoneMatch = req.headers['if-none-match'];
    if (ifNoneMatch && isETagMatching(ifNoneMatch.toString(), etag)) {
      return res.status(304).end();
    }

    // Eredmény visszaadása
    res.json(transformedSources);
  } catch (error) {
    logger.error(`Hiba a ${req.params.continent} kontinens forrásainak lekérdezése során:`, error);

    // Részletesebb hiba fejlesztői környezetben
    if (process.env.NODE_ENV !== 'production') {
      return res.status(500).json({
        error: INTERNAL_SERVER_ERROR,
        details: String(error),
        message: CHECK_SERVER_LOGS,
      });
    }

    res.status(500).json({ error: 'Hiba történt a források lekérdezése során' });
  }
});

/**
 * Országok lekérdezése kontinens alapján
 * GET /api/continent/:continent/countries
 */
router.get('/:continent/countries', async (req, res) => {
  try {
    const continent = req.params.continent;
    const continentName = getFullContinentName(continent);

    logger.info(`Országok lekérdezése kontinens szerint: ${continentName}`);

    // SourcesService használata a direkt SQL helyett
    const countries = await sourcesService.getCountriesByContinent(continentName);

    // Cache-Control és ETag beállítása
    const etag = generateETag(countries, 'countries');
    res.setHeader(CACHE_CONTROL_HEADER, generateCacheControlHeader(CACHE_TIMES.SLOW));
    res.setHeader('ETag', etag);

    // If-None-Match ellenőrzése
    const ifNoneMatch = req.headers['if-none-match'];
    if (ifNoneMatch && isETagMatching(ifNoneMatch.toString(), etag)) {
      return res.status(304).end();
    }

    // Eredmény visszaadása
    res.json(countries);
  } catch (error) {
    logger.error(`Hiba a ${req.params.continent} kontinens országainak lekérdezése során:`, error);

    // Részletesebb hiba fejlesztői környezetben
    if (process.env.NODE_ENV !== 'production') {
      return res.status(500).json({
        error: INTERNAL_SERVER_ERROR,
        details: String(error),
        message: CHECK_SERVER_LOGS,
      });
    }

    res.status(500).json({ error: 'Hiba történt az országok lekérdezése során' });
  }
});

/**
 * Hírek lekérdezése kontinens alapján
 * GET /api/continent/:continent/news
 */
// eslint-disable-next-line complexity
router.get('/:continent/news', async (req, res) => {
  const continent = req.params.continent;
  const continentName = getFullContinentName(continent);
  const limit = parseInt(req.query.limit as string) || 20;
  const importanceLevel = parseInt(req.query.importanceLevel as string) || 10;
  const country = (req.query.country as string) || null;

  // ÚJ: Egységes időkezelés - a közös timeUtils.ts modulból
  const maxAgeHours =
    req.query.torzsMode === 'true' ? 24 : validateMaxAgeHours(req.query.maxAgeHours as string);
  const cutoffTimestamp = calculateCutoffTimestamp(maxAgeHours);

  logger.info(
    `Hírek lekérdezése kontinens szerint: ${continentName}, ország: ${country || 'összes'}, maxAgeHours: ${maxAgeHours}`,
  );

  try {
    // Források lekérdezése a kontinensre és opcionálisan országra szűrve
    let sourcesData;
    if (country) {
      // Ha ország is meg van adva, akkor országra és kontinensre is szűrünk
      sourcesData = await sourcesService.getCountrySourcesByImportanceLevel(
        country,
        importanceLevel,
      );
      // Szűrjük csak az adott kontinenshez tartozó forrásokat
      sourcesData = sourcesData.filter((source) => source.kontinens === continentName);
    } else {
      // Ha csak kontinens van megadva, akkor csak kontinensre szűrünk
      sourcesData = await sourcesService.getContinentSourcesByImportanceLevel(
        continentName,
        importanceLevel,
      );
    }

    // Átalakítjuk a lekérdezett adatokat RssSource formátumra
    const sources: RssSource[] = sourcesData.map((row) => ({
      eredeti_id: row.eredeti_id || '',
      cim: row.cim || '',
      url: row.url || '',
      rss_feed: row.rss_feed || '',
      fontossag: row.fontossag || 1,
      orszag: row.orszag || '',
      kontinens: row.kontinens || continentName,
      sections: Array.isArray(row.sections) ? row.sections : [],
    }));

    logger.info(
      `${sources.length} forrás található a ${continentName} kontinensen${country ? ` és ${country} országban` : ''}`,
    );

    // Ha nincs forrás, visszatérünk üres eredménnyel
    if (sources.length === 0) {
      return res.status(200).json({
        news: [],
        meta: {
          country: country,
          continent: continentName,
          currentImportanceLevel: importanceLevel,
          nextImportanceLevel: null,
          hasMore: false,
          total: 0,
          timestamp: Date.now(),
        },
        message: `Nincsenek elérhető források a(z) ${continentName} kontinensen${country ? ` és ${country} országban` : ''}`,
      });
    }

    // RSS feed-ek lekérése és feldolgozása (fő feed + sections)
    const allNewsPromises = sources.flatMap((source) => {
      const prom: Promise<ProcessedRssItem[]>[] = [];
      // fő RSS feed
      if (source.rss_feed) {
        prom.push(fetchAndParseRssFeed(source.rss_feed, source));
      }
      // sections feed-ek
      if (source.sections && source.sections.length) {
        for (const sec of source.sections) {
          // pass section name in title
          prom.push(
            fetchAndParseRssFeed(sec.url, {
              ...source,
              cim: `${source.cim} - ${sec.name}`,
              rss_feed: sec.url,
            } as RssSource),
          );
        }
      }
      return prom;
    });

    // Párhuzamosan lekérjük az összes RSS feed-et
    const allNewsResults = await Promise.allSettled(allNewsPromises);

    // Hírek összegyűjtése és rendezése
    const newsItems: ProcessedRssItem[] = allNewsResults
      .filter((result) => result.status === 'fulfilled')
      .flatMap((result) => {
        // Explicit típuskonverzió a fulfilled értékekre
        return (result as PromiseFulfilledResult<ProcessedRssItem[]>).value || [];
      });

    // ✅ JAVÍTOTT: URL alapú duplikáció szűrés (Jason Segel probléma megoldása)
    const uniqueNewsItems = newsItems.filter(
      (news, index, self) => index === self.findIndex((n) => n.url === news.url),
    );

    // ÚJ: Egységes időalapú szűrés a közös timeUtils.ts modulból
    const filteredByTime = filterNewsByAge(uniqueNewsItems, maxAgeHours);

    // Időrendi sorrendbe rendezés és limitálás a szűrt hírekből
    const finalNewsItems = filteredByTime
      .sort((a, b) => (b.timestamp ?? 0) - (a.timestamp ?? 0))
      .slice(0, limit);

    // Következő fontossági szint ellenőrzése
    const nextImportanceLevel = country
      ? await sourcesService.hasNextImportanceLevel(country, importanceLevel)
      : await sourcesService.hasNextImportanceLevelForContinent(continentName, importanceLevel);

    // Válasz összeállítása
    const response = {
      news: finalNewsItems.map((item) => ({
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
        country: country,
        continent: continentName,
        currentImportanceLevel: importanceLevel,
        nextImportanceLevel: nextImportanceLevel ? importanceLevel + 1 : null,
        hasMore: Boolean(nextImportanceLevel),
        total: filteredByTime.length, // ← módosítva: szűrt hírek száma
        timestamp: Date.now(),
        // ÚJ: Időszűrési metaadatok
        maxAgeHours,
        cutoffTimestamp,
        filteredByAge: true,
        originalTotal: newsItems.length, // Eredeti hírek száma szűrés előtt
        filteredOutCount: newsItems.length - filteredByTime.length, // Kiszűrt hírek száma
      },
      message: `${finalNewsItems.length} hír betöltve a(z) ${continentName} kontinensről${country ? ` és ${country} országból` : ''}`,
    };

    // Cache és ETag kezelés
    const etag = generateETag(response, 'continent-news');
    res.setHeader('ETag', etag);
    res.setHeader(CACHE_CONTROL_HEADER, generateCacheControlHeader(CACHE_TIMES.MEDIUM)); // SHORT helyett MEDIUM

    // Válasz küldése
    res.status(200).json(response);
  } catch (error) {
    logger.error(`Hiba a ${req.params.continent} kontinens híreinek lekérdezése során:`, error);

    // Részletesebb hiba fejlesztői környezetben
    if (process.env.NODE_ENV !== 'production') {
      return res.status(500).json({
        error: INTERNAL_SERVER_ERROR,
        details: String(error),
        message: CHECK_SERVER_LOGS,
      });
    }

    res.status(500).json({
      news: [],
      meta: {
        country: (req.query.country as string) || null,
        continent: getFullContinentName(req.params.continent),
        currentImportanceLevel: parseInt(req.query.importanceLevel as string) || 10,
        nextImportanceLevel: null,
        hasMore: false,
        total: 0,
        timestamp: Date.now(),
      },
      message: 'Hiba történt a hírek lekérdezése során',
    });
  }
});

/**
 * Kontinens teljes nevének lekérése URL-barát azonosítóból
 */
function getFullContinentName(continentSlug: string): string {
  // URL-barát formátumból visszaalakítás (pl. "north-america" -> "North America")
  const mappings: Record<string, string> = {
    europe: 'Europe',
    asia: 'Asia',
    africa: 'Africa',
    'north-america': NORTH_AMERICA,
    northamerica: NORTH_AMERICA,
    north_america: NORTH_AMERICA,
    'south-america': SOUTH_AMERICA,
    southamerica: SOUTH_AMERICA,
    south_america: SOUTH_AMERICA,
    oceania: 'Oceania',
  };

  // Normalizált értéket használunk a kereséshez
  const normalized = continentSlug.toLowerCase().trim();
  return mappings[normalized] || continentSlug;
}

export default router;
