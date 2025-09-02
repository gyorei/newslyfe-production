import { logger } from '../../server/logger';

// ProcessedRssItem interfész - kompatibilitás a Local.ts-szel és Country.ts-szel
export interface ProcessedRssItem {
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

function isRTLKlubSource(item: ProcessedRssItem): boolean {
  const source = item.source?.toLowerCase() || '';
  const sourceId = item.sourceId?.toLowerCase() || '';
  return (
    source.includes('rtl klub') ||
    source.includes('rtl') ||
    sourceId.includes('rtl') ||
    source.includes('rtl.hu')
  );
}

function hasNegativeTimestamp(item: ProcessedRssItem): boolean {
  const now = Date.now();
  const itemTimestamp = item.timestamp || 0;
  return itemTimestamp > now;
}

function shouldFilterOutNewsItem(item: ProcessedRssItem): boolean {
  const isRTL = isRTLKlubSource(item);
  const hasNegativeTS = hasNegativeTimestamp(item);
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
