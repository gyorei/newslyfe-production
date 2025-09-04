/**
 * Univerzális Képkinyerő Modul - Fő Orchestrator
 *
 * A modul célja, hogy egy központi helyen orchestrálja az összes képkinyerési logikát.
 * A stratégiák különálló modulokban vannak, ez a fő modul csak a workflow-t koordinálja.
 * Ez biztosítja a maximális kompatibilitást és a könnyű bővíthetőséget új források esetén.
 */

// Importáljuk az új modulokat
import { 
  RssItem, 
  ImageExtractionResult, 
  ImageCandidate,
  SYNC_STRATEGIES,
  extractImageFromEnclosure,
  extractImageFromImageTag,
  extractImageFromMediaThumbnail,
  extractImageFromMediaContent,
  extractImageFromDescription,
  extractImageFromContentEncoded
} from './imageExtractorStrategies.js';

import { 
  extractImagesWithDOM
} from './imageExtractorDOM.js';

import { 
  analyzeImageQuality,
  calculateAttributeBasedConfidence
} from './imageExtractorQuality.js';

import { 
  calculateDynamicConfidence,
  feedProfileCache,
  setFeedConfidenceOverrides,
  getFeedProfileStats,
  getCacheStats
} from './imageExtractorDynamicConfidence.js';

import { 
  extractImageFromWebPageWithFallback,
  extractImageFromNemzetiOnvedelem,
  extractImageFromWebPageUniversal,
  isAlJazeeraLogo
} from './imageExtractorWebScraping.js';

import { 
  validateAndCleanImageUrl
} from './imageExtractorUtils.js';

// Batch feldolgozás importálása
import { 
  extractImagesFromItemsBatch, 
  generateImageExtractionStats,
  extractImagesFromItems 
} from './imageExtractorBatch.js';

/**
 * ✅ KÖZÖS MAGFÜGGVÉNY - Képkinyerési logika egyszerűsítése
 * 
 * @param item RSS feed elem
 * @param detailed Részletes eredmény kell-e
 * @param channel Channel objektum (fallback-hoz)
 * @returns Kép URL vagy részletes eredmény
 */
async function extractImageCore(
  item: RssItem, 
  detailed = false, 
  channel?: RssChannel
): Promise<string | ImageExtractionResult> {
  // Al Jazeera specifikus logika
  const isAlJazeera = item.link && item.link.includes('aljazeera.com');

  if (isAlJazeera) {
    try {
      const webScrapedImage = await extractImageFromWebPageWithFallback(item);
      if (webScrapedImage) {
        const validatedUrl = validateAndCleanImageUrl(webScrapedImage);
        if (validatedUrl) {
          console.log(`[extractImageCore] Al Jazeera képe web scrapinggel: ${validatedUrl}`);
          return detailed 
            ? { imageUrl: validatedUrl, source: 'web-scraping', confidence: 0.3 }
            : validatedUrl;
        }
      }
    } catch (error) {
      console.warn('[extractImageCore] Al Jazeera scraping hiba:', error);
    }
  }

  // Szinkron stratégiák kipróbálása
  for (const strategy of SYNC_STRATEGIES) {
    const imageUrl = strategy.func(item);
    if (imageUrl) {
      const validatedUrl = validateAndCleanImageUrl(imageUrl, item.link);
      if (validatedUrl) {
        // Al Jazeera esetén csak akkor fogadjuk el az RSS képet, ha nem logo
        if (isAlJazeera && isAlJazeeraLogo(validatedUrl)) {
          continue;
        }
        
        return detailed 
          ? { 
              imageUrl: validatedUrl, 
              source: strategy.name as ImageExtractionResult['source'], 
              confidence: strategy.confidence 
            }
          : validatedUrl;
      }
    }
  }

  // Channel-szintű fallback
  if (channel) {
    const channelImage = extractImageFromChannel(channel);
    if (channelImage) {
      const validatedUrl = validateAndCleanImageUrl(channelImage);
      if (validatedUrl) {
        return detailed 
          ? { imageUrl: validatedUrl, source: 'channel', confidence: 0.2 }
          : validatedUrl;
      }
    }
  }

  // Web scraping fallback (csak detailed módban)
  if (detailed) {
    try {
      const webScrapedImage = await extractImageFromWebPageUniversal(item);
      if (webScrapedImage) {
        const validatedUrl = validateAndCleanImageUrl(webScrapedImage);
        if (validatedUrl) {
          return {
            imageUrl: validatedUrl,
            source: 'web-scraping',
            confidence: 0.3,
          };
        }
      }
    } catch (error) {
      console.warn('[extractImageCore] Web scraping hiba:', error);
    }
  }

  // Nincs kép találva
  return detailed 
    ? { imageUrl: '', source: 'none', confidence: 0 }
    : '';
}

/**
 * FŐ KÉPKINYERÉSI FÜGGVÉNY - TÖBB KÉP PRÓBÁLKOZÁS
 *
 * @param item RSS feed elem
 * @param channel Channel objektum (fallback-hoz)
 * @param feedUrl Feed URL-je (dinamikus konfidencia-hoz)
 * @returns Legmegfelelőbb kép URL-je vagy üres string
 */
export async function extractBestImage(
  item: RssItem, 
  channel?: RssChannel, 
  feedUrl?: string
): Promise<string> {
  // ✅ NEMZETI ÖNVÉDELEM WEB SCRAPING FALLBACK - Ha RSS-ből nincs kép
  const isNemzetiOnvedelem = item.link && item.link.includes('nemzetionvedelem');
  
  // 1. Minden kép jelölt kinyerése
  const candidates = extractAllImageCandidates(item, feedUrl);
  
  // 2. Ha van jelölt, visszaadjuk a legjobbat
  if (candidates.length > 0) {
    // ✅ DINAMIKUS KONFIDENCIA - Feed profil frissítése sikeres képkinyerés után
    if (feedUrl) {
      feedProfileCache.updateProfile(feedUrl, candidates[0].source, true);
    }
    return candidates[0].url;
  }
  
  // ✅ NEMZETI ÖNVÉDELEM WEB SCRAPING - Ha nincs RSS kép
  if (isNemzetiOnvedelem) {
    console.log('🔍 NEMZETI ÖNVÉDELEM: RSS-ből nincs kép, web scraping próbálkozás...');
    try {
      const webScrapedImage = await extractImageFromNemzetiOnvedelem(item);
      if (webScrapedImage) {
        console.log('✅ NEMZETI ÖNVÉDELEM: Web scraping sikeres:', webScrapedImage);
        return webScrapedImage;
      }
    } catch (error) {
      console.warn('❌ NEMZETI ÖNVÉDELEM: Web scraping hiba:', error);
    }
  }
  
  // 3. Channel fallback
  if (channel) {
    const channelImage = extractImageFromChannel(channel);
    if (channelImage) {
      const validatedUrl = validateAndCleanImageUrl(channelImage);
      if (validatedUrl) {
        return validatedUrl;
      }
    }
  }
  
  // 4. Web scraping fallback (csak ha nincs más)
  try {
    const webScrapedImage = await extractImageFromWebPageUniversal(item);
    if (webScrapedImage) {
      const validatedUrl = validateAndCleanImageUrl(webScrapedImage);
      if (validatedUrl) {
        return validatedUrl;
      }
    }
  } catch (error) {
    console.warn('[extractBestImage] Web scraping hiba:', error);
  }
  
  return '';
}

/**
 * RÉSZLETES KÉPKINYERÉSI EREDMÉNY - TÖBB KÉP PRÓBÁLKOZÁS
 *
 * @param item RSS feed elem
 * @param feedUrl Feed URL-je (dinamikus konfidencia-hoz)
 * @returns Részletes képkinyerési eredmény
 */
export async function extractImageWithDetails(
  item: RssItem, 
  feedUrl?: string
): Promise<ImageExtractionResult> {
  // 1. Minden kép jelölt kinyerése
  const candidates = extractAllImageCandidates(item, feedUrl);
  
  // 2. Ha van jelölt, visszaadjuk a legjobbat részletesen
  if (candidates.length > 0) {
    const bestCandidate = candidates[0];
    
    // ✅ DINAMIKUS KONFIDENCIA - Feed profil frissítése sikeres képkinyerés után
    if (feedUrl) {
      feedProfileCache.updateProfile(feedUrl, bestCandidate.source, true);
    }
    
    return {
      imageUrl: bestCandidate.url,
      source: bestCandidate.source as ImageExtractionResult['source'],
      confidence: bestCandidate.confidence
    };
  }
  
  // 3. Channel fallback
  const channelImage = extractImageFromChannel();
  if (channelImage) {
    const validatedUrl = validateAndCleanImageUrl(channelImage);
    if (validatedUrl) {
      return {
        imageUrl: validatedUrl,
        source: 'channel',
        confidence: 0.2
      };
    }
  }
  
  // 4. Web scraping fallback
  try {
    const webScrapedImage = await extractImageFromWebPageUniversal(item);
    if (webScrapedImage) {
      const validatedUrl = validateAndCleanImageUrl(webScrapedImage);
      if (validatedUrl) {
        return {
          imageUrl: validatedUrl,
          source: 'web-scraping',
          confidence: 0.3
        };
      }
    }
  } catch (error) {
    console.warn('[extractImageWithDetails] Web scraping hiba:', error);
  }
  
  // 5. Nincs kép találva
  return {
    imageUrl: '',
    source: 'none',
    confidence: 0
  };
}

/**
 * Minden kép jelölt kinyerése - Több stratégia végigpróbálása
 */
function extractAllImageCandidates(item: RssItem, feedUrl?: string): ImageCandidate[] {
  const candidates: ImageCandidate[] = [];
  
  // ✅ NEMZETI ÖNVÉDELEM DEBUG - Speciális debug logok
  const isNemzetiOnvedelem = item.link && item.link.includes('nemzetionvedelem');
  if (isNemzetiOnvedelem) {
    console.log('🔍 NEMZETI ÖNVÉDELEM DEBUG:');
    console.log('Title:', item.title);
    console.log('Link:', item.link);
    console.log('Enclosure:', JSON.stringify(item.enclosure, null, 2));
    console.log('Content encoded length:', item['content:encoded']?.length || 0);
    console.log('Description length:', item.description?.length || 0);
    console.log('Media thumbnail:', JSON.stringify(item['media:thumbnail'], null, 2));
    console.log('Media content:', JSON.stringify(item['media:content'], null, 2));
  }
  
  // 1. Enclosure stratégiák
  if (item.enclosure) {
    if (Array.isArray(item.enclosure)) {
      item.enclosure.forEach((enc, index) => {
        if (enc.$ && enc.$.type?.startsWith('image/') && enc.$.url) {
          const validatedUrl = validateAndCleanImageUrl(enc.$.url, item.link);
          if (validatedUrl) {
            const attributes = {
              width: enc.$.width,
              height: enc.$.height,
              type: enc.$.type
            };
            
            const baseConfidence = 0.9;
            const adjustedConfidence = calculateAttributeBasedConfidence(baseConfidence, attributes);
            
            // ✅ DINAMIKUS KONFIDENCIA - Feed-specifikus optimalizáció
            const dynamicConfidence = feedUrl 
              ? calculateDynamicConfidence('enclosure', feedUrl, item)
              : adjustedConfidence;
            
            const quality = analyzeImageQuality(validatedUrl, attributes);
            
            candidates.push({
              url: validatedUrl,
              source: 'enclosure',
              confidence: dynamicConfidence,
              quality,
              attributes
            });
          }
        }
      });
    } else {
      if (item.enclosure.$ && item.enclosure.$.type?.startsWith('image/') && item.enclosure.$.url) {
        const validatedUrl = validateAndCleanImageUrl(item.enclosure.$.url, item.link);
        if (validatedUrl) {
          const attributes = {
            width: item.enclosure.$.width,
            height: item.enclosure.$.height,
            type: item.enclosure.$.type
          };
          
          const baseConfidence = 0.9;
          const adjustedConfidence = calculateAttributeBasedConfidence(baseConfidence, attributes);
          
          // ✅ DINAMIKUS KONFIDENCIA - Feed-specifikus optimalizáció
          const dynamicConfidence = feedUrl 
            ? calculateDynamicConfidence('enclosure', feedUrl, item)
            : adjustedConfidence;
          
          const quality = analyzeImageQuality(validatedUrl, attributes);
          
          candidates.push({
            url: validatedUrl,
            source: 'enclosure',
            confidence: dynamicConfidence,
            quality,
            attributes
          });
        }
      }
    }
  }
  
  // 2. Media thumbnail stratégiák
  const mediaThumbnail = extractImageFromMediaThumbnail(item);
  if (mediaThumbnail) {
    const validatedUrl = validateAndCleanImageUrl(mediaThumbnail, item.link);
    if (validatedUrl) {
      const quality = analyzeImageQuality(validatedUrl);
      const dynamicConfidence = feedUrl 
        ? calculateDynamicConfidence('media-thumbnail', feedUrl, item)
        : 0.8;
      
      candidates.push({
        url: validatedUrl,
        source: 'media-thumbnail',
        confidence: dynamicConfidence,
        quality
      });
    }
  }
  
  // 3. Media content stratégiák
  const mediaContent = extractImageFromMediaContent(item);
  if (mediaContent) {
    const validatedUrl = validateAndCleanImageUrl(mediaContent, item.link);
    if (validatedUrl) {
      const quality = analyzeImageQuality(validatedUrl);
      const dynamicConfidence = feedUrl 
        ? calculateDynamicConfidence('media-content', feedUrl, item)
        : 0.7;
      
      candidates.push({
        url: validatedUrl,
        source: 'media-content',
        confidence: dynamicConfidence,
        quality
      });
    }
  }
  
  // 4. Image tag stratégiák
  const imageTag = extractImageFromImageTag(item);
  if (imageTag) {
    const validatedUrl = validateAndCleanImageUrl(imageTag, item.link);
    if (validatedUrl) {
      const quality = analyzeImageQuality(validatedUrl);
      const dynamicConfidence = feedUrl 
        ? calculateDynamicConfidence('image-tag', feedUrl, item)
        : 0.6;
      
      candidates.push({
        url: validatedUrl,
        source: 'image-tag',
        confidence: dynamicConfidence,
        quality
      });
    }
  }
  
  // 5. Description HTML stratégiák
  const descriptionImage = extractImageFromDescription(item);
  if (descriptionImage) {
    const validatedUrl = validateAndCleanImageUrl(descriptionImage, item.link);
    if (validatedUrl) {
      const quality = analyzeImageQuality(validatedUrl);
      const dynamicConfidence = feedUrl 
        ? calculateDynamicConfidence('html-description', feedUrl, item)
        : 0.5;
      
      candidates.push({
        url: validatedUrl,
        source: 'html-description',
        confidence: dynamicConfidence,
        quality
      });
    }
  }
  
  // 6. Content encoded stratégiák
  const contentEncodedImage = extractImageFromContentEncoded(item);
  if (contentEncodedImage) {
    const validatedUrl = validateAndCleanImageUrl(contentEncodedImage, item.link);
    if (validatedUrl) {
      const quality = analyzeImageQuality(validatedUrl);
      const dynamicConfidence = feedUrl 
        ? calculateDynamicConfidence('content:encoded', feedUrl, item)
        : 0.4;
      
      candidates.push({
        url: validatedUrl,
        source: 'content:encoded',
        confidence: dynamicConfidence,
        quality
      });
    }
  }
  
  // 7. DOM PARSER STRATÉGIÁK - Új, megbízhatóbb módszer
  // Content:encoded DOM parser eredmények
  if (item['content:encoded']) {
    const content = Array.isArray(item['content:encoded']) 
      ? item['content:encoded'][0] 
      : item['content:encoded'];
    
    if (typeof content === 'string') {
      try {
        const domImages = extractImagesWithDOM(content);
        domImages.forEach((imageUrl, index) => {
          const validatedUrl = validateAndCleanImageUrl(imageUrl, item.link);
          if (validatedUrl) {
            const quality = analyzeImageQuality(validatedUrl);
            const dynamicConfidence = feedUrl 
              ? calculateDynamicConfidence('content:encoded-dom', feedUrl, item)
              : 0.6; // Magasabb mint a regex, mert megbízhatóbb
            
            candidates.push({
              url: validatedUrl,
              source: 'content:encoded-dom',
              confidence: dynamicConfidence,
              quality
            });
          }
        });
      } catch (error) {
        console.warn('[extractAllImageCandidates] Content DOM parsing hiba:', error);
      }
    }
  }
  
  // Description DOM parser eredmények
  if (item.description) {
    try {
      const domImages = extractImagesWithDOM(item.description);
      domImages.forEach((imageUrl, index) => {
        const validatedUrl = validateAndCleanImageUrl(imageUrl, item.link);
        if (validatedUrl) {
          const quality = analyzeImageQuality(validatedUrl);
          const dynamicConfidence = feedUrl 
            ? calculateDynamicConfidence('html-description-dom', feedUrl, item)
            : 0.55; // Magasabb mint a regex, mert megbízhatóbb
          
          candidates.push({
            url: validatedUrl,
            source: 'html-description-dom',
            confidence: dynamicConfidence,
            quality
          });
        }
      });
    } catch (error) {
      console.warn('[extractAllImageCandidates] Description DOM parsing hiba:', error);
    }
  }
  
  // Rangsorolás minőség szerint (legjobb elől)
  return candidates.sort((a, b) => b.quality - a.quality);
}

// Exportálás - kompatibilitás a Local.ts-szel
export {
  extractImageFromEnclosure,
  extractImageFromImageTag,
  extractImageFromMediaThumbnail,
  extractImageFromMediaContent,
  extractImageFromDescription,
  // Batch feldolgozás exportálása
  extractImagesFromItems,
  generateImageExtractionStats,
  extractImagesFromItemsBatch,
};

// Típusok exportálása - EGYSÉGESÍTETT NÉVVEL
export type { RssItem, ImageExtractionResult, ImageCandidate };

// Új függvények exportálása
export { 
  extractAllImageCandidates, 
  analyzeImageQuality, 
  calculateAttributeBasedConfidence,
};

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

/**
 * ATTRIBÚTUM KONFIDENCIA TESZT - Attribútum alapú konfidencia ellenőrzése
 */
export function testAttributeConfidence() {
  console.log('🧪 Attribútum Konfidencia Teszt...');
  
  const testCases = [
    {
      name: 'Nagy kép (600x400)',
      attributes: { width: '600', height: '400', type: 'image/jpeg' },
      baseConfidence: 0.8
    },
    {
      name: 'Közepes kép (300x200)',
      attributes: { width: '300', height: '200', type: 'image/png' },
      baseConfidence: 0.7
    },
    {
      name: 'Kicsi kép (50x50)',
      attributes: { width: '50', height: '50', type: 'image/gif' },
      baseConfidence: 0.6
    },
    {
      name: 'WebP formátum',
      attributes: { width: '800', height: '600', type: 'image/webp' },
      baseConfidence: 0.8
    },
    {
      name: 'Nincs attribútum',
      attributes: undefined,
      baseConfidence: 0.5
    }
  ];
  
  testCases.forEach(testCase => {
    const adjustedConfidence = calculateAttributeBasedConfidence(
      testCase.baseConfidence, 
      testCase.attributes
    );
    
    console.log(`${testCase.name}:`);
    console.log(`  Alap konfidencia: ${testCase.baseConfidence}`);
    console.log(`  Attribútumok: ${JSON.stringify(testCase.attributes)}`);
    console.log(`  Módosított konfidencia: ${adjustedConfidence.toFixed(3)}`);
    console.log(`  Növekedés: ${((adjustedConfidence - testCase.baseConfidence) * 100).toFixed(1)}%`);
    console.log('');
  });
  
  return true;
}

/**
 * DINAMIKUS KONFIDENCIA TESZT - Fejlesztés közbeni ellenőrzés
 */
export function testDynamicConfidence() {
  console.log('🧪 Dinamikus Konfidencia Teszt...');
  
  // Teszt feed URL
  const testFeedUrl = 'https://index.hu/rss';
  
  // Teszt item
  const testItem: RssItem = {
    title: 'Teszt cikk',
    description: 'Teszt leírás',
    link: 'https://index.hu/cikk/123',
    enclosure: {
      $: {
        url: 'https://example.com/image.jpg',
        type: 'image/jpeg',
        width: '600',
        height: '400'
      }
    }
  };
  
  // 1. Alap konfidencia teszt
  const baseConfidence = calculateDynamicConfidence('enclosure', testFeedUrl, testItem);
  console.log(`Alap konfidencia: ${baseConfidence.toFixed(3)}`);
  
  // 2. Feed profil beállítása
  setFeedConfidenceOverrides(testFeedUrl, {
    'enclosure': 1.2,
    'media-thumbnail': 0.8
  });
  
  // 3. Módosított konfidencia teszt
  const modifiedConfidence = calculateDynamicConfidence('enclosure', testFeedUrl, testItem);
  console.log(`Módosított konfidencia: ${modifiedConfidence.toFixed(3)}`);
  
  // 4. Sikereség szimulálása
  feedProfileCache.updateProfile(testFeedUrl, 'enclosure', true);
  feedProfileCache.updateProfile(testFeedUrl, 'enclosure', true);
  feedProfileCache.updateProfile(testFeedUrl, 'media-thumbnail', false);
  
  // 5. Tapasztalat alapú konfidencia teszt
  const experiencedConfidence = calculateDynamicConfidence('enclosure', testFeedUrl, testItem);
  console.log(`Tapasztalat alapú konfidencia: ${experiencedConfidence.toFixed(3)}`);
  
  // 6. Cache statisztikák
  const stats = getCacheStats();
  console.log('Cache statisztikák:', stats);
  
  // 7. Feed profil statisztikák
  const profile = getFeedProfileStats(testFeedUrl);
  console.log('Feed profil:', profile);
  
  return true;
}

/**
 * EGYSZERŰ UNIVERZÁLIS KÉPKINYERÉS - LOGO FALLBACK HA NINCS KÉP
 *
 * Logika:
 * 1. Van kép az RSS-ben? → használjuk azt
 * 2. Nincs kép? → Google Favicon Service (64x64 minőség)
 * 3. Nincs domain? → újság emoji fallback
 *
 * @param item RSS feed elem
 * @param sourceUrl RSS forrás URL-je (favicon meghatározásához)
 * @returns Mindig visszaad egy kép URL-t (soha nem üres string)
 */
export async function extractBestImageUniversal(
  item: RssItem,
  sourceUrl?: string,
): Promise<string> {
  // DEBUG: Index.hu item teljes tartalom logolása - KIKOMMENTÁLVA
  // console.log('[INDEX DEBUG] ITEM:', JSON.stringify(item, null, 2));

  // 1. PRÓBÁLJUK MEG A STANDARD KÉPKINYERÉST
  const image = await extractBestImage(item);

  if (image && image.trim() !== '') {
    return image; // ✅ VAN KÉP - használjuk
  }

  // 2. KÜLÖNLEGES LOGO CSAK KURUC.INFO-RA
  if (sourceUrl) {
    try {
      const domain = new URL(sourceUrl).hostname;

      if (domain.includes('kuruc.info')) {
        return 'https://kuruc.info/img/logo3.png';
      }

      // // Minden más forrás - Google Favicon Service (64x64 minőség)
      // return `https://www.google.com/s2/favicons?domain=${domain}&sz=64`;
    } catch (error) {
      // URL parsing hiba
      console.warn('[extractBestImageUniversal] URL parsing hiba:', error);
    }
  }

  // 3. VÉGSŐ FALLBACK - ÚJSÁG EMOJI SVG (letisztult, semleges)
  return 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 64 64"><text y="50" font-size="48">📰</text></svg>';
}

// ÚJ: Channel-szintű kép interfész hozzáadása
interface RssChannel {
  image?: {
    url?: string | string[];
    title?: string;
    link?: string;
    width?: string;
    height?: string;
  };
}

// ÚJ: Channel-szintű kép kinyerő stratégia
function extractImageFromChannel(channel?: RssChannel): string | null {
  if (!channel?.image) return null;

  // Channel image URL kinyerése
  if (typeof channel.image.url === 'string') {
    return channel.image.url;
  } else if (Array.isArray(channel.image.url) && channel.image.url[0]) {
    return channel.image.url[0];
  }

  return null;
}
