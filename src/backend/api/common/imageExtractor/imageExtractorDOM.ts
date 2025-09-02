/**
 * Image Extractor DOM Parser - DOM parser alapú képkinyerés
 * 
 * Ez a modul felelős a DOM parser alapú képkinyerésért,
 * amely megbízhatóbb mint a regex módszerek.
 */

// ✅ DOM PARSER - Cheerio alapú HTML feldolgozás
import * as cheerio from 'cheerio';

// Importáljuk a szükséges típusokat és segédfüggvényeket
import { RssItem } from './imageExtractorStrategies';
import { validateAndCleanImageUrl, decodeHtmlEntities } from './imageExtractorUtils';

/**
 * Robusztus HTML tisztítás és DOM parser
 */
export function robustHtmlCleaner(content: string): {
  text: string;
  images: string[];
  isValid: boolean;
} {
  try {
    // 1. HTML entitások dekódolása
    const decodedContent = decodeHtmlEntities(content);
    
    // 2. CDATA és script tag-ek eltávolítása
    const cleanedContent = decodedContent
      .replace(/<!\[CDATA\[[\s\S]*?\]\]>/g, '') // CDATA blokkok
      .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '') // Script tag-ek
      .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '') // Style tag-ek
      .replace(/<noscript[^>]*>[\s\S]*?<\/noscript>/gi, ''); // NoScript tag-ek
    
    // 3. Cheerio DOM parser használata
    const $ = cheerio.load(cleanedContent, {
      decodeEntities: false, // Ne dekódolja újra
      xmlMode: false,
      lowerCaseTags: true
    });
    
    // 4. Képek kinyerése strukturáltan
    const images: string[] = [];
    $('img').each((_, element) => {
      const $img = $(element);
      const src = $img.attr('src');
      const dataSrc = $img.attr('data-src');
      const dataLazySrc = $img.attr('data-lazy-src');
      const dataOriginal = $img.attr('data-original');
      
      if (src) images.push(src);
      if (dataSrc) images.push(dataSrc);
      if (dataLazySrc) images.push(dataLazySrc);
      if (dataOriginal) images.push(dataOriginal);
    });
    
    // 5. Tisztított szöveg
    const text = $.root().text().trim();
    
    return {
      text,
      images,
      isValid: text.length > 0 || images.length > 0
    };
    
  } catch (error) {
    console.warn('[robustHtmlCleaner] HTML parsing hiba:', error);
    return {
      text: content,
      images: [],
      isValid: false
    };
  }
}

/**
 * DOM parser alapú képkinyerés
 */
export function extractImagesWithDOM(content: string): string[] {
  try {
    const $ = cheerio.load(content);
    const images: string[] = [];
    
    $('img').each((_, element) => {
      const $img = $(element);
      const src = $img.attr('src');
      const dataSrc = $img.attr('data-src');
      const dataLazySrc = $img.attr('data-lazy-src');
      const dataOriginal = $img.attr('data-original');
      
      if (src) images.push(src);
      if (dataSrc) images.push(dataSrc);
      if (dataLazySrc) images.push(dataLazySrc);
      if (dataOriginal) images.push(dataOriginal);
    });
    
    return images.filter(url => validateAndCleanImageUrl(url));
  } catch (error) {
    console.warn('[extractImagesWithDOM] DOM parsing hiba:', error);
    return [];
  }
}

/**
 * Content:encoded mezőből való képkinyerés - DOM PARSER
 */
export function extractImageFromContentEncodedDOM(item: RssItem): string | null {
  const contentEncoded = item['content:encoded'];
  if (!contentEncoded) return null;

  // Különböző típusok kezelése (string vagy string tömb)
  const content = Array.isArray(contentEncoded) ? contentEncoded[0] : contentEncoded;
  if (typeof content !== 'string') return null;

  // ✅ DOM PARSER HASZNÁLATA - Megbízhatóbb mint a regex
  try {
    const images = extractImagesWithDOM(content);
    if (images.length > 0) {
      // Visszaadjuk az első érvényes képet
      return images[0];
    }
  } catch (error) {
    console.warn('[extractImageFromContentEncodedDOM] DOM parsing hiba:', error);
  }

  return null;
}

/**
 * Description mezőből való képkinyerés - DOM PARSER
 */
export function extractImageFromDescriptionDOM(item: RssItem): string | null {
  if (!item.description) return null;

  // ✅ DOM PARSER HASZNÁLATA - Megbízhatóbb mint a regex
  try {
    const images = extractImagesWithDOM(item.description);
    if (images.length > 0) {
      // Visszaadjuk az első érvényes képet
      return images[0];
    }
  } catch (error) {
    console.warn('[extractImageFromDescriptionDOM] DOM parsing hiba:', error);
  }

  return null;
}

/**
 * DOM PARSER TESZT - Fejlesztés közbeni ellenőrzés
 */
export function testDOMParser() {
  console.log('🧪 DOM Parser Teszt...');
  
  // Teszt adatok
  const testContent = `
    <div>
      <img src="https://example.com/image1.jpg" width="300" height="200" />
      <img data-src="https://example.com/image2.jpg" />
      <img data-lazy-src="https://example.com/image3.jpg" />
      <p>Some text</p>
    </div>
  `;
  
  try {
    const images = extractImagesWithDOM(testContent);
    console.log('✅ DOM Parser talált képek:', images);
    return images.length > 0;
  } catch (error) {
    console.error('❌ DOM Parser hiba:', error);
    return false;
  }
} 