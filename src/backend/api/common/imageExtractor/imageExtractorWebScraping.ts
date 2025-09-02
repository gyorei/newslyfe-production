/**
 * Image Extractor Web Scraping - Web scraping integráció
 * 
 * Ez a modul felelős a külső web scraping integrációért
 * és a specifikus hírforrásokhoz igazított logikáért.
 */

// ÚJ: Web scraping import - JAVÍTOTT ÚTVONAL
import { extractImageFromWebPage } from '../../routes/webScraper/webScraper';

// Importáljuk a szükséges típusokat és segédfüggvényeket
import { RssItem } from './imageExtractorStrategies';
import { validateAndCleanImageUrl } from './imageExtractorUtils';

/**
 * Al Jazeera logo felismerő függvény
 */
export function isAlJazeeraLogo(url: string): boolean {
  if (!url) return false;
  const lower = url.toLowerCase();
  return (
    lower.includes('logo_aje') ||
    lower.includes('/logos/') ||
    lower.includes('logo') ||
    lower.includes('placeholder') ||
    lower.includes('default')
  );
}

/**
 * Web scraping alapú képkinyerés Al Jazeera specifikus logikával
 */
export async function extractImageFromWebPageWithFallback(item: RssItem): Promise<string | null> {
  // Al Jazeera specifikus logika
  const isAlJazeera = item.link && item.link.includes('aljazeera.com');

  if (isAlJazeera) {
    try {
      const webScrapedImage = await extractImageFromWebPage(item);
      if (webScrapedImage) {
        const validatedUrl = validateAndCleanImageUrl(webScrapedImage);
        if (validatedUrl) {
          console.log(`[extractImageFromWebPageWithFallback] Al Jazeera képe web scrapinggel: ${validatedUrl}`);
          return validatedUrl;
        }
      }
    } catch (error) {
      console.warn('[extractImageFromWebPageWithFallback] Al Jazeera scraping hiba:', error);
    }
  }

  return null;
}

/**
 * Nemzeti Önvédelem specifikus web scraping
 */
export async function extractImageFromNemzetiOnvedelem(item: RssItem): Promise<string | null> {
  const isNemzetiOnvedelem = item.link && item.link.includes('nemzetionvedelem');
  
  if (isNemzetiOnvedelem) {
    console.log('🔍 NEMZETI ÖNVÉDELEM: RSS-ből nincs kép, web scraping próbálkozás...');
    try {
      const webScrapedImage = await extractImageFromWebPage(item);
      if (webScrapedImage) {
        const validatedUrl = validateAndCleanImageUrl(webScrapedImage);
        if (validatedUrl) {
          console.log('✅ NEMZETI ÖNVÉDELEM: Web scraping sikeres:', validatedUrl);
          return validatedUrl;
        }
      }
    } catch (error) {
      console.warn('❌ NEMZETI ÖNVÉDELEM: Web scraping hiba:', error);
    }
  }
  
  return null;
}

/**
 * Univerzális web scraping fallback
 */
export async function extractImageFromWebPageUniversal(item: RssItem): Promise<string | null> {
  try {
    const webScrapedImage = await extractImageFromWebPage(item);
    if (webScrapedImage) {
      const validatedUrl = validateAndCleanImageUrl(webScrapedImage);
      if (validatedUrl) {
        return validatedUrl;
      }
    }
  } catch (error) {
    console.warn('[extractImageFromWebPageUniversal] Web scraping hiba:', error);
  }
  
  return null;
}

/**
 * Web scraping debug információk
 */
export function getWebScrapingDebugInfo(item: RssItem): {
  isAlJazeera: boolean;
  isNemzetiOnvedelem: boolean;
  link: string | undefined;
} {
  return {
    isAlJazeera: item.link ? item.link.includes('aljazeera.com') : false,
    isNemzetiOnvedelem: item.link ? item.link.includes('nemzetionvedelem') : false,
    link: item.link
  };
}

/**
 * Web scraping teszt függvény
 */
export async function testWebScraping() {
  console.log('🧪 Web Scraping Teszt...');
  
  const testItem: RssItem = {
    title: 'Teszt cikk',
    description: 'Teszt leírás',
    link: 'https://aljazeera.com/test-article'
  };
  
  const debugInfo = getWebScrapingDebugInfo(testItem);
  console.log('Debug információk:', debugInfo);
  
  try {
    const result = await extractImageFromWebPageWithFallback(testItem);
    console.log('Web scraping eredmény:', result);
    return result !== null;
  } catch (error) {
    console.error('Web scraping hiba:', error);
    return false;
  }
} 