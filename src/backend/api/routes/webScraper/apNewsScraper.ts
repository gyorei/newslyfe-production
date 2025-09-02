import axios from 'axios';
import * as cheerio from 'cheerio';
import { getCachedApNewsMedia, setCachedApNewsMedia } from './webScrapingCache'; // Feltételezve, hogy a cache fájl ugyanabban a könyvtárban van

// --- Konstansok ---
const APNEWS_DOMAIN = 'apnews.com';
const APNEWS_RATE_LIMIT_MS = 2000; // 2 másodperc várakozás az AP News kérések között
const REQUEST_TIMEOUT = 8000; // 8 másodperc timeout, mint a többi scrapernél
const USER_AGENT =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36';

// --- AP News Specifikus Rate Limiter ---
const lastRequestTimeApNews = new Map<string, number>();

/**
 * Ellenőrzi, hogy lehet-e kérést küldeni az AP News domainre a rate limit alapján.
 * @param url Az ellenőrizendő URL (az apnews.com domainre kell mutatnia)
 * @returns Promise<boolean> - true, ha lehet kérést küldeni, false egyébként.
 */
async function canMakeRequestApNews(url: string): Promise<boolean> {
  try {
    const domain = new URL(url).hostname;
    if (!domain.includes(APNEWS_DOMAIN)) {
      // Csak az AP News domainre érvényes ez a rate limiter
      return true;
    }

    const now = Date.now();
    const lastRequest = lastRequestTimeApNews.get(APNEWS_DOMAIN) || 0; // Domain szintű rate limit
    const timeSinceLastRequest = now - lastRequest;

    if (timeSinceLastRequest < APNEWS_RATE_LIMIT_MS) {
      const waitTime = APNEWS_RATE_LIMIT_MS - timeSinceLastRequest;
      await new Promise((resolve) => setTimeout(resolve, waitTime));
    }

    lastRequestTimeApNews.set(APNEWS_DOMAIN, Date.now());
    return true;
  } catch (error) {
    // URL parsing hiba esetén engedélyezzük a kérést (bár ide elvileg csak valid URL juthat)
    console.error('AP News Rate Limiter URL parsing error:', error);
    return true;
  }
}

// --- HTML Elemző Függvény ---
/**
 * Kinyeri a videó URL-t és a bélyegkép URL-t az AP News cikk HTML tartalmából.
 * @param html A cikk HTML tartalma.
 * @param articleUrl A cikk eredeti URL-je (hibakereséshez).
 * @returns Objektum { thumbnailUrl: string | null, videoUrl: string | null } vagy null.
 */
function parseApNewsMedia(
  html: string,
  articleUrl: string,
): { thumbnailUrl: string | null; videoUrl: string | null } | null {
  try {
    const $ = cheerio.load(html);
    let videoId: string | null = null;
    let thumbnailUrl: string | null = null;
    let videoUrl: string | null = null;

    // 1. Videóazonosító és beágyazási URL kinyerése
    const youtubePlayer = $('bsp-youtube-player').first();
    if (youtubePlayer.length) {
      videoId = youtubePlayer.attr('data-video-id') || null;
      if (videoId) {
        videoUrl = `https://www.youtube.com/embed/${videoId}`;
      }
    }

    // 2. Bélyegkép URL kinyerése
    // Elsődleges módszer: a div.ytp-cued-thumbnail-overlay-image style attribútumából
    const thumbnailDiv = $('div.ytp-cued-thumbnail-overlay-image').first();
    if (thumbnailDiv.length) {
      const style = thumbnailDiv.attr('style');
      if (style) {
        const match = style.match(/url\("([^"]+)"\)/);
        if (match && match[1]) {
          thumbnailUrl = match[1];
        }
      }
    }

    // Másodlagos módszer (fallback): ha van videoId, de nincs explicit thumbnail, generálunk egyet
    if (!thumbnailUrl && videoId) {
      thumbnailUrl = `https://i.ytimg.com/vi/${videoId}/maxresdefault.jpg`;
    }

    // Csak akkor adjunk vissza eredményt, ha legalább az egyik URL megvan
    if (thumbnailUrl || videoUrl) {
      return { thumbnailUrl, videoUrl };
    }

    return null;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error(`Error parsing AP News HTML for media (${articleUrl}):`, errorMessage);
    return null;
  }
}

// --- Fő Exportált Függvény ---
/**
 * Kinyeri a videó és bélyegkép URL-eket egy AP News cikkből.
 * @param item Objektum, ami tartalmaz egy 'link' tulajdonságot a cikk URL-jével.
 * @returns Promise, ami egy objektumot ad vissza { thumbnailUrl: string | null, videoUrl: string | null } formában, vagy null-t.
 */
export async function extractMediaFromApNewsPage(item: {
  link?: string;
}): Promise<{ thumbnailUrl: string | null; videoUrl: string | null } | null> {
  const url = item.link;

  if (!url || !url.includes(APNEWS_DOMAIN)) {
    // console.log('Not an AP News URL or no URL provided:', url);
    return null;
  }

  // 1. Cache ellenőrzés
  const cachedMedia = getCachedApNewsMedia(url);
  if (cachedMedia !== null) {
    // Explicit null ellenőrzés, mert a cache-elt érték is lehet null
    // console.log('AP News media found in cache:', url);
    return cachedMedia;
  }
  // console.log('AP News media not in cache, attempting to fetch:', url);

  // 2. Rate limiting
  const canRequest = await canMakeRequestApNews(url);
  if (!canRequest) {
    // console.log('AP News rate limit hit, skipping:', url);
    // Ebben az esetben a rate limiter már várt, de a biztonság kedvéért itt is kiléphetünk
    return null;
  }

  try {
    // 3. HTTP kérés
    // console.log('Fetching AP News page:', url);
    const response = await axios.get(url, {
      timeout: REQUEST_TIMEOUT,
      headers: { 'User-Agent': USER_AGENT },
    });

    // 4. HTML elemzés
    const mediaData = parseApNewsMedia(response.data, url);
    // console.log('Parsed AP News media data:', mediaData, 'for URL:', url);

    // 5. Eredmény cache-elése (akkor is, ha null, hogy ne próbálkozzunk újra egy ideig)
    setCachedApNewsMedia(url, mediaData);

    return mediaData;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error(`Error scraping AP News page (${url}):`, errorMessage);
    // Hiba esetén is cache-elünk null-t, hogy ne terheljük feleslegesen az oldalt
    setCachedApNewsMedia(url, null);
    return null;
  }
}
