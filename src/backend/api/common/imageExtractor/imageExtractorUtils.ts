/**
 * Image Extractor Utilities - DOM Parser és Segédfüggvények
 * 
 * Ez a modul tartalmazza a DOM parser és egyéb utility funkciókat
 * a képkinyerési folyamathoz.
 */

// ✅ DOM PARSER - Cheerio alapú HTML feldolgozás
import * as cheerio from 'cheerio';

// ✅ TELJESÍTMÉNY OPTIMALIZÁLÁS: Előre kompilált regex objektumok
const CDATA_REGEX = /(^\s*(\[CDATA\[|<!\[CDATA\[)\s*)|(\s*\]\]>\s*$)/g;
const IMG_SRC_DOUBLE_QUOTE_REGEX = /<img[^>]+src="([^"]+)"/i;
const IMG_SRC_SINGLE_QUOTE_REGEX = /<img[^>]+src='([^']+)'/i;
const IMG_EXTENSION_REGEX = /src=["']([^"']+\.(jpg|jpeg|png|gif|webp|svg))["']/i;
const SIZE_MATCH_REGEX = /[_\-\/](\d+)x(\d+)[_\-\/]/;

// ✅ Engedélyezett képformátumok
const ALLOWED_IMAGE_EXTENSIONS = /\.(jpg|jpeg|png|webp)$/i;

// ✅ SVG LOGO TÁMOGATÁS - Logo SVG-k elfogadása
const LOGO_SVG_PATTERNS = [
  /logo/i,
  /brand/i,
  /icon/i,
  /symbol/i,
  /emblem/i
];

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
 * HTML entitások dekódolása
 */
export function decodeHtmlEntities(text: string): string {
  return text
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, ' ')
    .replace(/&#x([0-9a-fA-F]+);/g, (_, hex) => 
      String.fromCharCode(parseInt(hex, 16))
    )
    .replace(/&#(\d+);/g, (_, dec) => 
      String.fromCharCode(parseInt(dec, 10))
    );
}

/**
 * SVG logo felismerés
 */
export function isLogoSvg(url: string): boolean {
  if (!url.toLowerCase().endsWith('.svg')) {
    return false;
  }
  
  return LOGO_SVG_PATTERNS.some(pattern => pattern.test(url));
}

/**
 * Kép méret ellenőrzése URL alapján
 */
export function isTooSmallImage(url: string): boolean {
  // Alapvető szűrők
  const lowered = url.toLowerCase();
  if (lowered.includes('1x1') || lowered.includes('pixel') || lowered.includes('blank')) {
    return true;
  }

  // ✅ TELJESÍTMÉNY OPTIMALIZÁLÁS: Előre kompilált regex használata
  const sizeMatch = SIZE_MATCH_REGEX.exec(url);
  if (sizeMatch) {
    
    const width = parseInt(sizeMatch[1]);
    const height = parseInt(sizeMatch[2]);
    return width < 50 || height < 50;
  }

  return false;
}

/**
 * URL validáció és tisztítás
 */
// ✅ DUPLIKÁLT LOG ELKERÜLÉSE - Cache a már látott hibákat
const seenValidationErrors = new Set<string>();
const seenValidationErrorsLimit = 100; // Maximum 100 egyedi hiba cache-ben

export function validateAndCleanImageUrl(url: string, baseUrl?: string): string | null {
  if (!url || url.trim().length === 0) return null;
  let cleanUrl = url.trim();

  if (isTooSmallImage(cleanUrl)) return null;

  // Csak az utolsó szegmensből próbálunk kiterjesztést keresni
  const urlWithoutQuery = cleanUrl.split('?')[0];
  const lastSegment = urlWithoutQuery.split('/').pop() || '';
  const extensionMatch = lastSegment.match(/\.[a-zA-Z0-9]{2,5}$/);

  // Csak akkor szűrjük ki, ha tényleg van klasszikus kiterjesztés, és az NEM engedélyezett
  if (extensionMatch && !ALLOWED_IMAGE_EXTENSIONS.test(extensionMatch[0])) {
    // ✅ SVG LOGO TÁMOGATÁS - Ha SVG és logo pattern, akkor elfogadjuk
    if (extensionMatch[0].toLowerCase() === '.svg') {
      const isLogoSvg = LOGO_SVG_PATTERNS.some(pattern => pattern.test(cleanUrl));
      if (isLogoSvg) {
        console.debug(`[Validator] SVG logo elfogadva: ${cleanUrl}`);
        return cleanUrl; // Logo SVG elfogadása
      }
    }
    if (!seenValidationErrors.has(cleanUrl)) {
      console.debug(`[Validator] Kiszűrve rossz kiterjesztés: ${cleanUrl}`);
      seenValidationErrors.add(cleanUrl);
      if (seenValidationErrors.size > seenValidationErrorsLimit) {
        const firstError = seenValidationErrors.values().next().value;
        if (firstError) {
          seenValidationErrors.delete(firstError);
        }
      }
    }
    return null;
  }

  try {
    // --- FINOM JAVÍTÁS: http:// → https:// csak publikus képeknél ---
    if (cleanUrl.startsWith('http://')) {
      // Ne cseréljük localhost, 127.0.0.1, belső IP, data: stb. esetén
      if (!/^(http:\/\/(localhost|127\.|10\.|192\.168\.|172\.(1[6-9]|2[0-9]|3[0-1])\.|data:|file:))/i.test(cleanUrl)) {
        cleanUrl = 'https://' + cleanUrl.substring(7);
      }
    }
    new URL(cleanUrl);
    return cleanUrl;
  } catch {
    if (baseUrl && (cleanUrl.startsWith('/') || cleanUrl.startsWith('./'))) {
      try {
        return new URL(cleanUrl, baseUrl).href;
      } catch {
        return null;
      }
    }
    return null;
  }
}

/**
 * CDATA tisztítás
 */
export function cleanCDATA(rawUrl: string): string {
  return rawUrl.replace(CDATA_REGEX, '').trim();
}



/**
 * LOG JAVÍTÁSOK TESZT - Fejlesztés közbeni ellenőrzés
 */
export function testLogImprovements() {
  console.log('🧪 Log Javítások Teszt...');
  
  const testUrls = [
    'https://assets.jungefreiheit.de/misc/img/JFplus.svg', // Logo SVG
    'https://example.com/logo.svg', // Logo SVG
    'https://example.com/image.jpg', // Normál kép
    'https://example.com/icon.svg', // Icon SVG
    'https://example.com/brand.svg', // Brand SVG
    'https://example.com/random.svg', // Random SVG (nem logo)
    'https://example.com/image.gif', // Nem támogatott formátum
  ];
  
  console.log('Teszt URL-ek validálása:');
  testUrls.forEach(url => {
    const result = validateAndCleanImageUrl(url);
    console.log(`${url} → ${result ? 'ELFOGADVA' : 'KISZŰRVE'}`);
  });
  
  console.log('\nSVG Logo felismerés teszt:');
  testUrls.forEach(url => {
    const isLogo = isLogoSvg(url);
    console.log(`${url} → ${isLogo ? 'LOGO' : 'NEM LOGO'}`);
  });
  
  return true;
}

// A calculateImageQualityMetrics függvény és ImageQualityMetrics interfész 
// mostantól az imageExtractorQuality.ts modulban található

/**
 * Logo felismerés
 */
export interface LogoDetectionResult {
  isLogo: boolean;
  confidence: number;
  reasons: string[];
  shouldUseAsFallback: boolean;
}

export function detectLogoGlobally(
  url: string, 
  source: string, 
  attributes?: { width?: string; height?: string; type?: string }
): LogoDetectionResult {
  const reasons: string[] = [];
  let confidence = 0;
  
  // 1. URL pattern alapú felismerés
  const urlPatterns = [
    { pattern: /\/logos?\//i, weight: 0.8, reason: 'URL contains logos path' },
    { pattern: /logo_/i, weight: 0.7, reason: 'URL contains logo_ prefix' },
    { pattern: /brand/i, weight: 0.6, reason: 'URL contains brand' },
    { pattern: /icon/i, weight: 0.5, reason: 'URL contains icon' },
    { pattern: /placeholder/i, weight: 0.9, reason: 'URL contains placeholder' },
    { pattern: /default/i, weight: 0.8, reason: 'URL contains default' },
    { pattern: /1x1/i, weight: 0.9, reason: 'URL contains 1x1 (tracking pixel)' },
    { pattern: /pixel/i, weight: 0.9, reason: 'URL contains pixel' }
  ];
  
  for (const { pattern, weight, reason } of urlPatterns) {
    if (pattern.test(url)) {
      confidence = Math.max(confidence, weight);
      reasons.push(reason);
    }
  }
  
  // 2. Méret alapú felismerés (ha van attribútum)
  if (attributes?.width && attributes?.height) {
    const width = parseInt(attributes.width);
    const height = parseInt(attributes.height);
    
    if (width <= 100 && height <= 100) {
      confidence = Math.max(confidence, 0.7);
      reasons.push('small size (likely logo)');
    } else if (width <= 200 && height <= 200) {
      confidence = Math.max(confidence, 0.5);
      reasons.push('medium size (possibly logo)');
    }
  }
  
  // 3. Forrás alapú felismerés
  const sourceWeights: Record<string, number> = {
    'enclosure': 0.3, // enclosure-ben ritkább a logo
    'media:thumbnail': 0.5, // thumbnail-ben gyakoribb
    'media:content': 0.4,
    'image-tag': 0.6, // image tag-ben gyakoribb
    'html-description': 0.7, // description-ben leggyakoribb
    'content:encoded': 0.6
  };
  
  const sourceWeight = sourceWeights[source] || 0.5;
  confidence *= sourceWeight;
  
  // 4. Döntési logika
  const isLogo = confidence >= 0.6;
  const shouldUseAsFallback = confidence < 0.8; // Csak akkor, ha nem túl biztos logo
  
  return {
    isLogo,
    confidence,
    reasons,
    shouldUseAsFallback
  };
}
