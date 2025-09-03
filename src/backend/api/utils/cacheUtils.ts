/**
 * Cache segédeszközök az API végpontokhoz
 *
 * Ez a modul különböző cache kulcs generálási és validációs funkciókat biztosít,
 * hogy támogassa a cache-elés hatékony használatát a backend API végpontjain.
 */

import crypto from 'crypto';
import { isProd } from '../../server/config/environment.js';

// Cache idő alapértékek különböző tartalomtípusokhoz (másodpercben)
export const CACHE_TIMES = {
  FAST: 30 * 60, // 30 perc - gyakran változó tartalmak
  MEDIUM: 30 * 60, // 30 perc - általános tartalmak
  SLOW: 30 * 60, // 30 perc - ritkán változó tartalmak
  ERROR: 5 * 60, // 5 perc - hibás válaszok
};

/**
 * Objektumból vagy bármilyen értékből hash generálása cache kulcsokhoz
 * @param params Az objektum vagy érték, amiből hash-t készítünk
 * @returns Hash string a paraméterek alapján
 */
export function generateHashFromParams(params: unknown): string {
  try {
    // Null vagy undefined esetén speciális értéket adunk vissza
    if (params === null || params === undefined) {
      return 'null-undefined';
    }

    // Egyszerű értékek kezelése (string, number, boolean)
    if (typeof params !== 'object') {
      return String(params);
    }

    // Arrays and objects: konvertáljuk JSON stringgé és képezzünk belőle hash-t
    const jsonStr = JSON.stringify(sortObjectDeep(params));

    // SHA-256 hash képzése
    const hash = crypto.createHash('sha256');
    hash.update(jsonStr);

    return hash.digest('hex').substring(0, 16); // Első 16 karakter elég a megkülönböztetéshez
  } catch (error) {
    console.error('Hiba a hash generálása során:', error);
    return 'error-' + Date.now().toString();
  }
}

/**
 * Objektum mély rendezése kulcsok szerint, hogy a JSON.stringify konzisztens eredményt adjon
 * @param obj A rendezendő objektum
 * @returns A rendezett objektum
 */
function sortObjectDeep(obj: unknown): unknown {
  if (obj === null || typeof obj !== 'object') {
    return obj;
  }

  // Tömb elemek rekurzív rendezése
  if (Array.isArray(obj)) {
    return obj.map(sortObjectDeep);
  }

  // Objektum kulcsok rendezése és értékek rekurzív feldolgozása
  const sortedKeys = Object.keys(obj).sort();
  const result: Record<string, unknown> = {};

  for (const key of sortedKeys) {
    result[key] = sortObjectDeep((obj as Record<string, unknown>)[key]);
  }

  return result;
}

/**
 * Cache-Control header érték generálása környezet és tartalomtípus szerint
 * @param maxAge Maximális cache idő másodpercekben
 * @param isPublic Public vagy private directive használata
 * @returns Cache-Control header érték
 */
export function generateCacheControlHeader(maxAge: number, isPublic = true): string {
  // Fejlesztési környezetben kikapcsoljuk a cache-t könnyebb teszteléshez
  if (!isProd) {
    return 'no-cache';
  }

  const visibility = isPublic ? 'public' : 'private';
  return `${visibility}, max-age=${maxAge}`;
}

/**
 * ETag generálása válasz adatokból
 * @param data Válasz adat
 * @param prefix ETag prefix azonosításhoz (pl. 'news', 'sources')
 * @returns ETag érték W/ prefixszel (weak validator)
 */
export function generateETag(data: unknown, prefix: string = ''): string {
  try {
    const hash = generateHashFromParams(data);
    const timestamp = Math.floor(Date.now() / 1000); // Másodperces időbélyeg (kevésbé változékony)

    // Weak ETag használata ('W/' prefix) az RFC szabvány szerint
    return `W/"${prefix ? prefix + '-' : ''}${hash}-${timestamp}"`;
  } catch (error) {
    console.error('Hiba az ETag generálása során:', error);
    return `W/"error-${Date.now()}"`;
  }
}

/**
 * Ellenőrzi, hogy a request If-None-Match header értéke megegyezik-e az ETag értékkel
 * @param reqEtag A kérés If-None-Match header értéke
 * @param currentEtag A jelenlegi ETag érték
 * @returns true, ha az ETag-ek megegyeznek (304 Not Modified válasz küldendő)
 */
export function isETagMatching(reqEtag: string | undefined, currentEtag: string): boolean {
  if (!reqEtag || !currentEtag) {
    return false;
  }

  // Az idézőjelek és W/ prefix nélküli összehasonlítás (RFC szabvány szerint)
  const cleanRequestEtag = reqEtag.replace(/^W\//, '').replace(/"/g, '');
  const cleanCurrentEtag = currentEtag.replace(/^W\//, '').replace(/"/g, '');

  return cleanRequestEtag === cleanCurrentEtag;
}

/**
 * Kiszámítja a cache TTL értékét a jelenlegi idő alapján
 * @param cacheSeconds Cache idő másodpercekben
 * @returns Timestamp, amikor a cache érvényessége lejár
 */
export function calculateCacheExpiry(cacheSeconds: number): number {
  return Date.now() + cacheSeconds * 1000;
}
