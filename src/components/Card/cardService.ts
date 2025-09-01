import { NewsItem, RssNewsItem } from '../../types';
// Kikommentezve, hogy ne zavarjon a fejlesztés során
// import { traceDataFlow } from '../../utils/debugTools';

// Új import a központosított dátumformázási függvényekhez
// import { formatDate } from '../../utils/dateFormatter/dateFormatter';
import { formatRelativeTime } from '../../utils/dateFormatter/dateFormatter';
/**
 * Alapértelmezett kép URL generálása, ha a hírnek nincs képe
 * @param sourceId A forrás azonosítója
 * @returns Kép URL
 */
function getDefaultImage(sourceId: string): string {
  // Ha nincs kép, használjunk alapértelmezettet az újság logójával
  return `/images/sources/${sourceId}.png`;
}

/**
 * Szöveg okos levágása mondatvégnél
 * @param text Eredeti szöveg
 * @param maxLength Maximum karakter
 * @returns Levágott szöveg teljes mondattal
 */
function truncateAtSentence(text: string | undefined, maxLength: number = 120): string {
  if (!text) return '';

  // Tisztítjuk a bemenetet
  const cleanText = text
    .replace(/The post [^.]+\./g, '')
    .replace(/&hellip;/g, '...')
    .trim();

  // Ha eleve rövidebb, nem kell vágni
  if (cleanText.length <= maxLength) return cleanText;

  // Karakterlimitig vágjuk először
  const slice = cleanText.slice(0, maxLength);

  // Megkeressük az utolsó mondatzáró írásjelet (.!?)
  const lastSentenceEnd = Math.max(
    slice.lastIndexOf('.'),
    slice.lastIndexOf('!'),
    slice.lastIndexOf('?'),
  );

  if (lastSentenceEnd > 0) {
    // Ha találtunk mondatvéget, ott vágjuk
    return slice.slice(0, lastSentenceEnd + 1);
  }

  // Ha nincs mondatvég, keressük az utolsó szóközt
  const lastSpace = slice.lastIndexOf(' ');
  if (lastSpace > maxLength * 0.7) {
    // Csak ha elég messze van (legalább 70%)
    return slice.slice(0, lastSpace) + '...';
  }

  // Ha sehol sincs jó vágási pont, egyszerűen vágjuk le
  return slice.trimEnd() + '...';
}

/**
 * RSS hírek átalakítása a kártya komponenshez használható formátumra
 * @param newsItems RSS hírek tömbje
 * @returns Átalakított hírek tömbje a Card komponens számára
 */
export function transformNewsToCardData(newsItems: RssNewsItem[]): NewsItem[] {
  return newsItems.map((item) => {
    // Biztonságos timestamp kezelés: mindig számot adjon vissza
    const timestamp =
      item.timestamp || (item.pubDate ? new Date(item.pubDate).getTime() : Date.now());

    // Forrás állapot meghatározása
    const sourceStatus = item.id.includes('-html-')
      ? 'scraped'
      : item.id.includes('-no-rss-')
        ? 'unavailable'
        : 'valid';

    return {
      id: item.id,
      title: item.title,
      description: truncateAtSentence(item.description, 120), // Itt használjuk az okos vágást
      imageUrl: item.imageUrl || getDefaultImage(item.source.id),
      source: item.source.name,
      sourceId: item.source.id,
      date: formatRelativeTime(timestamp, true), // Relatív időt használunk
      timestamp: timestamp, // Most már garantáltan szám
      url: item.link,
      country: item.source.country || 'unknown', // Hozzáadva
      continent: item.source.continent || 'unknown', // Hozzáadva
      hasRssFeed: !item.id.includes('-html-') && !item.id.includes('-no-rss-'),
      sourceStatus: sourceStatus,
    };
  });
}

// Kikommentezve a nem használt loadCards függvény
/* 
export const loadCards = async (filters: any) => {
  // ÚJ: Nyomkövetés a kártyák betöltésekor - kikommentezve
  // traceDataFlow('cardService.loadCards', { filters });
  
  // ... további kód ...
};
*/
