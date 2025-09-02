// Web Scraper - PestiSrácok, Blikk, Hetek, Al Jazeera képkinyerés
import axios from 'axios';
import * as cheerio from 'cheerio';
import { canMakeRequest } from './rateLimiter';
import { getCachedImage, setCachedImage } from './webScrapingCache';

const REQUEST_TIMEOUT = 8000;

function isScrapableUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return ['http:', 'https:'].includes(parsed.protocol);
  } catch {
    return false;
  }
}

function isGenericAlJazeeraImage(url: string): boolean {
  if (!url) return true;
  const lower = url.toLowerCase();

  if (
    lower.includes('logo_aje') ||
    lower.includes('/logos/') ||
    lower.includes('logo') ||
    lower.includes('placeholder') ||
    lower.includes('default')
  ) {
    return true;
  }

  // Valódi képek jellemzői
  const hasDate = /\/\d{4}\/\d{2}\/\d{2}\//.test(lower);
  const hasArticleSlug = /\/news\/|\/video\/|\/features\//.test(lower);

  if (hasDate || hasArticleSlug) return false;

  return false;
}

function extractAlJazeeraImageFromSelectors($: cheerio.Root): string | null {
  const selectors = [
    'article .article-featured-image img',
    '.featured-media img',
    'main article img',
    'article .main-article-image img',
    '.wysiwyg img:first-child',
    'figure.article-image img',
    '.media-image img',
    'article picture img',
    '.article-content img',
    '.article-body img:first-child',
    '.content-container img:first-child',
    '.story-image img',
    'main img:first-child',
  ];

  for (const sel of selectors) {
    const img = $(sel).first();
    const src = img.attr('src') || img.attr('data-src') || img.attr('data-lazy-src');
    if (src && !isGenericAlJazeeraImage(src)) {
      try {
        return new URL(src.trim(), 'https://www.aljazeera.com').toString();
      } catch {
        return src.trim();
      }
    }
  }
  return null;
}

function extractAlJazeeraImageFromMeta($: cheerio.Root): string | null {
  const ogImage = $('meta[property="og:image"]').attr('content');
  if (ogImage && !isGenericAlJazeeraImage(ogImage)) {
    return ogImage.trim();
  }

  const twitterImage = $('meta[name="twitter:image"]').attr('content');
  if (twitterImage && !isGenericAlJazeeraImage(twitterImage)) {
    return twitterImage.trim();
  }

  return null;
}

function extractAlJazeeraVideoImage($: cheerio.Root): string | null {
  const videoPoster =
    $('video[poster]').attr('poster') ||
    $('div[data-poster]').attr('data-poster') ||
    $('.video-player img').attr('src');
  if (videoPoster && !isGenericAlJazeeraImage(videoPoster)) {
    try {
      return new URL(videoPoster.trim(), 'https://www.aljazeera.com').toString();
    } catch {
      return videoPoster.trim();
    }
  }
  return null;
}

function extractAlJazeeraImageFromJsonLd($: cheerio.Root): string | null {
  let jsonLdImage: string | null = null;
  const jsonLdScripts = $('script[type="application/ld+json"]');

  jsonLdScripts.each((_, script) => {
    try {
      const data = JSON.parse($(script).html() || '');
      if (typeof data.image === 'string' && !isGenericAlJazeeraImage(data.image)) {
        jsonLdImage = data.image;
      } else if (data.image?.url && !isGenericAlJazeeraImage(data.image.url)) {
        jsonLdImage = data.image.url;
      }
    } catch {
      // JSON parsing error - ignore and continue
    }
  });

  return jsonLdImage;
}

function extractImageFromHtml(html: string, url: string): string | null {
  const $ = cheerio.load(html);

  // Politico - Speciális logika CSAK politico.eu domainekre
  if (url.includes('politico.eu')) {
    // 1. og:image
    const ogImage = $('meta[property="og:image"]').attr('content');
    if (ogImage?.trim()) return ogImage.trim();

    // 2. twitter:image
    const twitterImage = $('meta[name="twitter:image"]').attr('content');
    if (twitterImage?.trim()) return twitterImage.trim();

    return null;
  }

  // Al Jazeera - Továbbfejlesztett prioritási logika
  if (url.includes('aljazeera.com')) {
    // 1. ELSŐDLEGES: DOM-ból való képkinyerés (nagyobb felbontás, egyedi képek)
    const selectorImage = extractAlJazeeraImageFromSelectors($);
    if (selectorImage) return selectorImage;

    // 2. MÁSODLAGOS: Meta tagek
    const metaImage = extractAlJazeeraImageFromMeta($);
    if (metaImage) return metaImage;

    // 3. Video poster képek
    const videoImage = extractAlJazeeraVideoImage($);
    if (videoImage) return videoImage;

    // 4. JSON-LD structured data keresés
    const jsonLdImage = extractAlJazeeraImageFromJsonLd($);
    if (jsonLdImage) return jsonLdImage;

    return null;
  }

  // Univerzális meta tag-ek
  const ogImage = $('meta[property="og:image"]').attr('content');
  if (ogImage?.trim()) return ogImage.trim();

  const twitterImage = $('meta[name="twitter:image"]').attr('content');
  if (twitterImage?.trim()) return twitterImage.trim();

  // Blikk.hu
  if (url.includes('blikk.hu')) {
    const blikkSelectors = [
      '.article-image img',
      '.featured-image img',
      '.post-thumbnail img',
      '.content-image img',
      'article img',
      '.entry-content img:first-child',
      '.post-image img',
      '.hero-image img',
    ];
    for (const sel of blikkSelectors) {
      const src = $(sel).first().attr('src') || $(sel).first().attr('data-src');
      if (src?.trim()) return new URL(src.trim(), 'https://www.blikk.hu/').toString();
    }
  }

  // PestiSrácok
  if (url.includes('pestisracok.hu')) {
    const src = $('.wp-post-image, .attachment-post-thumbnail').first().attr('src');
    if (src?.trim()) return src.trim();
  }

  // Hetek.hu
  if (url.includes('hetek.hu')) {
    const hetekSelectors = [
      '.article-details-main-image-container img',
      '.article-content-inner img',
      'article .img-fluid',
      'figure.image img',
      '.img-article',
    ];
    for (const sel of hetekSelectors) {
      const src = $(sel).first().attr('src');
      if (src?.trim()) return new URL(src.trim(), 'https://www.hetek.hu/').toString();
    }
  }

  return null;
}

export async function extractImageFromWebPage(item: { link?: string }): Promise<string | null> {
  const url = item.link;
  if (!url || !isScrapableUrl(url)) return null;

  const cached = getCachedImage(url);
  if (cached !== null) return cached;

  const canRequest = await canMakeRequest(url);
  if (!canRequest) return null;

  try {
    const res = await axios.get(url, {
      timeout: REQUEST_TIMEOUT,
      headers: { 'User-Agent': 'Mozilla/5.0' },
    });
    const imageUrl = extractImageFromHtml(res.data, url);
    setCachedImage(url, imageUrl);
    return imageUrl;
  } catch {
    setCachedImage(url, null);
    return null;
  }
}
