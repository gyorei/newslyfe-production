// Web Scraper - PestiSrácok, Blikk, Hetek, Al Jazeera képkinyerés
import axios from 'axios';
import \* as cheerio from 'cheerio';
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
return (
lower.includes('logo_aje') ||
lower.includes('/logos/') ||
(lower.includes('/images/') && lower.includes('logo'))
);
}

function extractImageFromHtml(html: string, url: string): string | null {
const $ = cheerio.load(html);

// Al Jazeera
if (url.includes('aljazeera.com')) {
const ogImage = $('meta[property="og:image"]').attr('content');
if (ogImage && !isGenericAlJazeeraImage(ogImage)) return ogImage.trim();

    const twitterImage = $('meta[name="twitter:image"]').attr('content');
    if (twitterImage && !isGenericAlJazeeraImage(twitterImage)) return twitterImage.trim();

    const articleImg = $('article img, figure img, .main-article img').first().attr('src');
    if (articleImg && !isGenericAlJazeeraImage(articleImg)) return articleImg.trim();

    const videoPoster = $('video[poster]').attr('poster') || $('div[data-poster]').attr('data-poster');
    if (videoPoster) return videoPoster.trim();

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
'.hero-image img'
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
'.img-article'
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
headers: { 'User-Agent': 'Mozilla/5.0' }
});
const imageUrl = extractImageFromHtml(res.data, url);
setCachedImage(url, imageUrl);
return imageUrl;
} catch {
setCachedImage(url, null);
return null;
}
}
