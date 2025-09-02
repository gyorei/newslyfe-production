/**
 * Problémás Források Szűrő - RTL KLUB "Just now" hírek kezelése
 *
 * Ez a modul felel a problémás forrásokból érkező hibás timestamp-tel rendelkező
 * hírek kiszűréséért. Jelenleg főként RTL KLUB híreket céloz, amelyek
 * negatív timestamp-tel rendelkeznek és "Just now"-ként jelennek meg.
 *
 * Cél: Local.ts tisztán tartása és specifikus problémakezelés izolálása
 */

import { logger } from '../../../server/logger';

// ProcessedRssItem interfész - kompatibilitás a Local.ts-szel
interface ProcessedRssItem {
  id: string;
  title?: string;
  description?: string;
  imageUrl: string;
  source: string;
  sourceId: string;
  date: string;
  timestamp?: number;
  url: string;
  country: string;
  continent: string;
  categories: string[];
  hasRssFeed: boolean;
  sourceStatus: string;
  [key: string]: unknown;
}

/**
 * RTL KLUB forrás azonosítása
 * @param item Hírtétel
 * @returns true, ha RTL KLUB forrásból származik
 */
function isRTLKlubSource(item: ProcessedRssItem): boolean {
  const source = item.source?.toLowerCase() || '';
  const sourceId = item.sourceId?.toLowerCase() || '';

  // RTL KLUB variációk ellenőrzése
  return (
    source.includes('rtl klub') ||
    source.includes('rtl') ||
    sourceId.includes('rtl') ||
    source.includes('rtl.hu')
  );
}

/**
 * Negatív timestamp ellenőrzése (ami "Just now"-ot eredményez)
 * @param item Hírtétel
 * @returns true, ha a timestamp jövőbeli (negatív diff)
 */
function hasNegativeTimestamp(item: ProcessedRssItem): boolean {
  const now = Date.now();
  const itemTimestamp = item.timestamp || 0;

  // Ha a timestamp jövőbeli, akkor negatív diff lesz a formatRelativeTime-ban
  return itemTimestamp > now;
}

/**
 * Egyetlen hírtétel ellenőrzése - kiszűrésre kerül-e
 * @param item Hírtétel
 * @returns true, ha a hírt ki kell szűrni
 */
function shouldFilterOutNewsItem(item: ProcessedRssItem): boolean {
  const isRTL = isRTLKlubSource(item);
  const hasNegativeTS = hasNegativeTimestamp(item);

  // CSAK RTL KLUB ÉS negatív timestamp esetén szűrjük ki
  const shouldFilter = isRTL && hasNegativeTS;

  if (shouldFilter) {
    logger.info(
      `[ProblematicSourcesFilter] RTL KLUB hír kiszűrve (negatív timestamp): "${item.title}" - ${item.timestamp} > ${Date.now()}`,
    );
  }

  return shouldFilter;
}

/**
 * Hírek tömb szűrése - problémás hírek eltávolítása
 * @param newsItems Hírek tömbje
 * @returns Szűrt hírek tömbje (problémás hírek nélkül)
 */
export function filterProblematicSources(newsItems: ProcessedRssItem[]): ProcessedRssItem[] {
  const originalCount = newsItems.length;

  const filteredItems = newsItems.filter((item) => !shouldFilterOutNewsItem(item));

  const filteredCount = originalCount - filteredItems.length;

  if (filteredCount > 0) {
    logger.info(
      `[ProblematicSourcesFilter] ${filteredCount} problémás hír kiszűrve ${originalCount}-ból`,
    );
  }

  return filteredItems;
}

/**
 * Statisztikák generálása a szűrésről
 * @param originalItems Eredeti hírek
 * @param filteredItems Szűrt hírek
 * @returns Szűrési statisztikák
 */
export function generateFilterStats(
  originalItems: ProcessedRssItem[],
  filteredItems: ProcessedRssItem[],
) {
  const totalOriginal = originalItems.length;
  const totalFiltered = filteredItems.length;
  const removedCount = totalOriginal - totalFiltered;

  // RTL KLUB specifikus statisztikák
  const rtlItems = originalItems.filter(isRTLKlubSource);
  const rtlWithNegativeTimestamp = rtlItems.filter(hasNegativeTimestamp);

  return {
    totalOriginal,
    totalFiltered,
    removedCount,
    removalRate: totalOriginal > 0 ? ((removedCount / totalOriginal) * 100).toFixed(1) + '%' : '0%',
    rtlKlubStats: {
      total: rtlItems.length,
      withNegativeTimestamp: rtlWithNegativeTimestamp.length,
      filtered: rtlWithNegativeTimestamp.length,
    },
  };
}

/**
 * Debug információk kiírása egy hírtételről
 * @param item Hírtétel
 */
export function debugNewsItem(item: ProcessedRssItem): void {
  const isRTL = isRTLKlubSource(item);
  const hasNegativeTS = hasNegativeTimestamp(item);
  const wouldFilter = shouldFilterOutNewsItem(item);

  logger.debug(`[ProblematicSourcesFilter] DEBUG: "${item.title?.substring(0, 50)}..."`, {
    source: item.source,
    sourceId: item.sourceId,
    timestamp: item.timestamp,
    now: Date.now(),
    isRTL,
    hasNegativeTS,
    wouldFilter,
  });
}

/**
 * Konfigurálható szűrő - más források hozzáadására
 */
interface FilterConfig {
  sources: string[]; // Szűrni kívánt források listája
  checkNegativeTimestamp: boolean; // Negatív timestamp ellenőrzése
  customFilter?: (item: ProcessedRssItem) => boolean; // Egyedi szűrő függvény
}

/**
 * Általános problémás források szűrője - bővíthető konfigurációval
 * @param newsItems Hírek tömbje
 * @param config Szűrési konfiguráció
 * @returns Szűrt hírek tömbje
 */
export function filterProblematicSourcesAdvanced(
  newsItems: ProcessedRssItem[],
  config: FilterConfig,
): ProcessedRssItem[] {
  const originalCount = newsItems.length;

  const filteredItems = newsItems.filter((item) => {
    // Forrás alapú szűrés
    const sourceMatch = config.sources.some(
      (source) =>
        item.source?.toLowerCase().includes(source.toLowerCase()) ||
        item.sourceId?.toLowerCase().includes(source.toLowerCase()),
    );

    // Negatív timestamp ellenőrzés
    const hasNegativeTS = config.checkNegativeTimestamp ? hasNegativeTimestamp(item) : false;

    // Egyedi szűrő
    const customFilterResult = config.customFilter ? config.customFilter(item) : false;

    // Szűrés logika: ha bármelyik feltétel igaz, akkor kiszűrjük
    const shouldFilter = (sourceMatch && hasNegativeTS) || customFilterResult;

    if (shouldFilter) {
      logger.info(
        `[ProblematicSourcesFilter] Hír kiszűrve: "${item.title}" (forrás: ${item.source})`,
      );
    }

    return !shouldFilter;
  });

  const filteredCount = originalCount - filteredItems.length;

  if (filteredCount > 0) {
    logger.info(
      `[ProblematicSourcesFilter] Advanced szűrés: ${filteredCount} hír kiszűrve ${originalCount}-ból`,
    );
  }

  return filteredItems;
}

// Default RTL KLUB konfiguráció exportálása
export const RTL_KLUB_FILTER_CONFIG: FilterConfig = {
  sources: ['rtl klub', 'rtl', 'rtl.hu'],
  checkNegativeTimestamp: true,
};

// Típusok exportálása
export type { ProcessedRssItem, FilterConfig };
