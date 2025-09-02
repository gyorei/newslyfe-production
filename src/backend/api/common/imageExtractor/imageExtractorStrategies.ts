/**
 * Image Extractor Strategies - RSS mezőkből való képkinyerési stratégiák
 * 
 * Ez a modul tartalmazza az összes alapvető képkinyerési stratégiát,
 * amelyek közvetlenül az RSS mezőkből nyernek ki képeket.
 */

// Konstansok a duplikált stringek elkerülésére
const MEDIA_CONTENT_FIELD = 'media:content';
const MEDIA_THUMBNAIL_FIELD = 'media:thumbnail';
const CONTENT_ENCODED_FIELD = 'content:encoded';

// ✅ TELJESÍTMÉNY OPTIMALIZÁLÁS: Előre kompilált regex objektumok
const CDATA_REGEX = /(^\s*(\[CDATA\[|<!\[CDATA\[)\s*)|(\s*\]\]>\s*$)/g;

// RSS Item interfész - EGYSÉGESÍTVE
export interface RssItem {
  title?: string;
  description?: string;
  link?: string;
  pubDate?: string;

  // ✅ ÚJ: content:encoded mező hozzáadása 444.hu támogatáshoz
  [CONTENT_ENCODED_FIELD]?: string | string[];

  // KÉPHEZ KAPCSOLÓDÓ MEZŐK
  enclosure?:
    | { $: { url?: string; type?: string; width?: string; height?: string } }
    | Array<{ $: { url?: string; type?: string; width?: string; height?: string } }>;
  image?:
    | { url?: string | string[]; width?: string; height?: string }
    | string
    | Array<{ url?: string | string[] }>;
  [MEDIA_CONTENT_FIELD]?: {
    $: { url?: string };
    [MEDIA_THUMBNAIL_FIELD]?: { $: { url?: string } };
  };
  category?: string | string[];
  timestamp?: number;

  // ÚJ: A BBC-stílusú, közvetlen media:thumbnail támogatásához
  [MEDIA_THUMBNAIL_FIELD]?: {
    $: {
      url?: string;
      width?: string;
      height?: string;
    };
  };
}

/**
 * Képkinyerési eredmény típus
 */
export interface ImageExtractionResult {
  imageUrl: string;
  source:
    | 'enclosure'
    | 'image-tag'
    | 'media-thumbnail'
    | 'media-content'
    | 'html-description'
    | 'content:encoded'
    | 'content:encoded-dom'
    | 'html-description-dom'
    | 'web-scraping'
    | 'channel'
    | 'none';
  confidence: number; // 0-1 között, mennyire megbízható a kép
}

/**
 * Kép jelölt - Több kép próbálkozás támogatásához
 */
export interface ImageCandidate {
  url: string;
  source: string;
  confidence: number;
  width?: number;
  height?: number;
  aspectRatio?: number;
  quality: number; // 0-1, összetett minőség pontszám
  attributes?: {
    width?: string;
    height?: string;
    type?: string;
  };
}

/**
 * Segédfüggvény - kép kinyerése enclosure tag-ből (Index többszörös enclosure kezelés)
 */
export function extractImageFromEnclosure(item: RssItem): string | null {
  if (!item.enclosure) return null;

  if (Array.isArray(item.enclosure)) {
    const imageEnclosures = item.enclosure.filter(
      (enc) => enc.$ && enc.$.type?.startsWith('image/') && enc.$.url,
    );

    if (imageEnclosures.length > 0) {
      const bestEnclosure = imageEnclosures.reduce((best, current) => {
        const bestWidth = parseInt(best.$.width || '0');
        const currentWidth = parseInt(current.$.width || '0');
        return currentWidth > bestWidth ? current : best;
      });

      return bestEnclosure.$.url || null;
    }
  } else {
    if (item.enclosure.$ && item.enclosure.$.type?.startsWith('image/') && item.enclosure.$.url) {
      return item.enclosure.$.url;
    }
  }

  return null;
}

/**
 * Magyar Hírlap <image><url> tag kezelése
 */
export function extractImageFromImageTag(item: RssItem): string | null {
  if (!item.image) return null;

  let rawImageUrl = '';

  // Különböző XML struktúrák kezelése
  if (typeof item.image === 'object' && 'url' in item.image) {
    rawImageUrl = Array.isArray(item.image.url) ? item.image.url[0] || '' : item.image.url || '';
  } else if (typeof item.image === 'string') {
    rawImageUrl = item.image;
  } else if (Array.isArray(item.image) && item.image[0] && item.image[0].url) {
    rawImageUrl = Array.isArray(item.image[0].url)
      ? item.image[0].url[0] || ''
      : item.image[0].url || '';
  }

  if (rawImageUrl) {
    return rawImageUrl.replace(CDATA_REGEX, '').trim();
  }

  return null;
}

/**
 * Kép kinyerése a <media:thumbnail> tag-ből – UNIVERZÁLIS VERZIÓ.
 * Kezeli a közvetlen (BBC-stílusú) és a beágyazott (ATV-stílusú) thumbnail-eket is.
 */
export function extractImageFromMediaThumbnail(item: RssItem): string | null {
  // 1. Elsődleges próba: Közvetlen <media:thumbnail> (pl. BBC)
  const directThumbnail = item[MEDIA_THUMBNAIL_FIELD];
  if (Array.isArray(directThumbnail)) {
    for (const thumb of directThumbnail) {
      // Explicit típusvizsgálat URL attribútumhoz
      if (thumb && typeof thumb === 'object' && 'url' in thumb && typeof thumb.url === 'string') {
        return thumb.url;
      }
      
      // $ objektum biztonságos kezelése
      if (thumb && thumb.$ && typeof thumb.$.url === 'string') {
        return thumb.$.url;
      }
    }
  } else if (directThumbnail && typeof directThumbnail === 'object') {
    // Explicit típusvizsgálat URL attribútumhoz
    if ('url' in directThumbnail && typeof directThumbnail.url === 'string') {
      return directThumbnail.url;
    }
    
    // $ objektum biztonságos kezelése
    if (directThumbnail.$ && typeof directThumbnail.$.url === 'string') {
      return directThumbnail.$.url;
    }
  }

  // 2. Másodlagos próba: Beágyazott <media:content><media:thumbnail/></media:content> (pl. ATV)
  const mediaContent = item[MEDIA_CONTENT_FIELD];
  if (Array.isArray(mediaContent)) {
    for (const mc of mediaContent) {
      const thumbnail = mc[MEDIA_THUMBNAIL_FIELD];
      
      // Explicit típusvizsgálat URL attribútumhoz
      if (thumbnail && typeof thumbnail === 'object' && 'url' in thumbnail && typeof thumbnail.url === 'string') {
        return thumbnail.url;
      }
      
      // $ objektum biztonságos kezelése
      if (thumbnail && thumbnail.$ && typeof thumbnail.$.url === 'string') {
        return thumbnail.$.url;
      }
    }
  } else if (mediaContent && typeof mediaContent === 'object' && !Array.isArray(mediaContent)) {
    const thumbnail = mediaContent[MEDIA_THUMBNAIL_FIELD];
    
    // Explicit típusvizsgálat URL attribútumhoz
    if (thumbnail && typeof thumbnail === 'object' && 'url' in thumbnail && typeof thumbnail.url === 'string') {
      return thumbnail.url;
    }
    
    // $ objektum biztonságos kezelése
    if (thumbnail && thumbnail.$ && typeof thumbnail.$.url === 'string') {
      return thumbnail.$.url;
    }
  }

  return null;
}

/**
 * Media:content kinyerése (YouTube embed kizárásával)
 */
export function extractImageFromMediaContent(item: RssItem): string | null {
  const mediaContent = item[MEDIA_CONTENT_FIELD];
  if (!mediaContent) return null;

  if (Array.isArray(mediaContent)) {
    for (const mc of mediaContent) {
      // Explicit típusvizsgálat URL attribútumhoz
      if (mc && typeof mc === 'object' && 'url' in mc && typeof mc.url === 'string' && !mc.url.includes('youtube.com')) {
        return mc.url;
      }
      
      // $ objektum biztonságos kezelése
      if (mc.$ && mc.$.url && !mc.$.url.includes('youtube.com')) {
        return mc.$.url;
      }
    }
  } else if (mediaContent && typeof mediaContent === 'object' && !Array.isArray(mediaContent)) {
    // Explicit típusvizsgálat URL attribútumhoz
    if ('url' in mediaContent && typeof mediaContent.url === 'string' && !mediaContent.url.includes('youtube.com')) {
      return mediaContent.url;
    }
    
    // $ objektum biztonságos kezelése
    if (mediaContent.$ && mediaContent.$.url && !mediaContent.$.url.includes('youtube.com')) {
      return mediaContent.$.url;
    }
  }

  return null;
}

/**
 * HTML img tag keresése a leírásban - REGEX MÓDSZER (DOM parser előtt)
 */
export function extractImageFromDescription(item: RssItem): string | null {
  if (!item.description) return null;

  // ✅ REGEX MÓDSZER - DOM parser előtti fallback
  const IMG_SRC_DOUBLE_QUOTE_REGEX = /<img[^>]+src="([^"]+)"/i;
  const imgMatch = IMG_SRC_DOUBLE_QUOTE_REGEX.exec(item.description);
  if (imgMatch && imgMatch[1]) {
    return imgMatch[1];
  }

  return null;
}

/**
 * 444.HU ÉS HASONLÓ OLDALAK TÁMOGATÁSA
 * content:encoded mezőből való képkinyerés - REGEX MÓDSZER
 */
export function extractImageFromContentEncoded(item: RssItem): string | null {
  const contentEncoded = item[CONTENT_ENCODED_FIELD];
  if (!contentEncoded) return null;

  // Különböző típusok kezelése (string vagy string tömb)
  const content = Array.isArray(contentEncoded) ? contentEncoded[0] : contentEncoded;
  if (typeof content !== 'string') return null;

  // ✅ REGEX MÓDSZER - DOM parser előtti fallback
  const IMG_SRC_DOUBLE_QUOTE_REGEX = /<img[^>]+src="([^"]+)"/i;
  const IMG_SRC_SINGLE_QUOTE_REGEX = /<img[^>]+src='([^']+)'/i;
  const IMG_EXTENSION_REGEX = /src=["']([^"']+\.(jpg|jpeg|png|gif|webp|svg))["']/i;

  const imgPatterns = [
    // Teljes img tag parsing - leggyakoribb
    IMG_SRC_DOUBLE_QUOTE_REGEX,
    IMG_SRC_SINGLE_QUOTE_REGEX,
    // Egyszerűbb pattern - csak kép URL-ek
    IMG_EXTENSION_REGEX,
  ];

  for (const pattern of imgPatterns) {
    const match = pattern.exec(content);
    if (match && match[1]) {
      return match[1];
    }
  }

  return null;
}

// ✅ KONFIDENCIA ÉRTÉKEK FINOMHANGOLÁSA - Valós használat alapján
export const SYNC_STRATEGIES = [
  // enclosure: legmagasabb, mert dedikált képmező
  { name: 'enclosure', func: extractImageFromEnclosure, confidence: 0.95 },
  
  // content:encoded: magas, mert elsődleges tartalom
  { name: 'content:encoded', func: extractImageFromContentEncoded, confidence: 0.85 },
  
  // media:thumbnail: közepes-magas, mert dedikált thumbnail
  { name: 'media-thumbnail', func: extractImageFromMediaThumbnail, confidence: 0.80 },
  
  // image-tag: közepes, magyar hírlapok (pl. Magyar Hírlap)
  { name: 'image-tag', func: extractImageFromImageTag, confidence: 0.75 },
  
  // media:content: közepes
  { name: 'media-content', func: extractImageFromMediaContent, confidence: 0.70 },
  
  // html-description: alacsonyabb, mert HTML parsing
  { name: 'html-description', func: extractImageFromDescription, confidence: 0.50 },
] as const;

// Exportálás - kompatibilitás a Local.ts-szel
export {
  MEDIA_CONTENT_FIELD,
  MEDIA_THUMBNAIL_FIELD,
  CONTENT_ENCODED_FIELD,
}; 