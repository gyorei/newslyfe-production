// Filepath: src/backend/api/routes/Local/safeRssXmlParser.ts

import iconv from 'iconv-lite';
import { Parser as XmlParser } from 'xml2js';
import chardet from 'chardet';
import { parse as parseContentType } from 'content-type'; // JAVÍTVA
import { Buffer } from 'buffer'; // Biztosítjuk, hogy a Node.js Buffer típusa legyen használva
// @ts-ignore // strip-bom-buffer-nek nincs hivatalos @types csomagja, de működik JS-ként
import stripBomBuffer from 'strip-bom-buffer';
import { logger } from '../../../server/logger.js'; // Ellenőrizd a logger helyes elérési útját

interface RssSourceInfo {
  feedUrl: string;
  sourceId: string;
}

/**
 * Biztonságosan feldolgoz egy RSS XML stringet, kezeli a BOM-ot és részletes hibalogolást végez.
 *
 * @param originalBuffer Az RSS feedből származó eredeti Buffer.
 * @param httpHeaders A HTTP válasz fejlécei.
 * @param sourceInfo Információk a forrásról (URL, ID) a logoláshoz.
 * @returns Promise, amely a parszolt XML objektumot adja vissza, vagy hibával utasítja el.
 */
export async function parseXmlWithBomAndErrorLogging(
  originalBuffer: Buffer,
  httpHeaders: any, // eslint-disable-line @typescript-eslint/no-explicit-any
  sourceInfo: RssSourceInfo,
): Promise<any> {
  // eslint-disable-line @typescript-eslint/no-explicit-any
  const { feedUrl, sourceId } = sourceInfo;

  // 1. BOM eltávolítása
  const bufferWithoutBom: Buffer = stripBomBuffer(originalBuffer);
  if (originalBuffer.length !== bufferWithoutBom.length) {
    logger.debug(`[safeRssXmlParser] BOM removed from feed: ${feedUrl} (Source ID: ${sourceId})`);
  }

  // 2. Karakterkódolás detektálása és dekódolás
  let detectedCharset: string | null = null;
  const contentTypeHeader = httpHeaders['content-type'];

  if (contentTypeHeader) {
    try {
      const parsedContentType = parseContentType(contentTypeHeader); // JAVÍTVA
      if (parsedContentType.parameters.charset) {
        detectedCharset = parsedContentType.parameters.charset;
        logger.debug(
          `[safeRssXmlParser] Charset from Content-Type: ${detectedCharset} for ${feedUrl} (Source ID: ${sourceId})`,
        );
      }
    } catch (e) {
      logger.warn(
        `[safeRssXmlParser] Error parsing Content-Type header (${contentTypeHeader}) for ${feedUrl} (Source ID: ${sourceId}): ${e instanceof Error ? e.message : String(e)}`,
      );
    }
  }

  if (!detectedCharset) {
    const chardetResult = chardet.detect(bufferWithoutBom);
    if (chardetResult) {
      detectedCharset = chardetResult;
      logger.debug(
        `[safeRssXmlParser] Charset detected by chardet: ${detectedCharset} for ${feedUrl} (Source ID: ${sourceId})`,
      );
    } else {
      logger.warn(
        `[safeRssXmlParser] Chardet could not detect charset for ${feedUrl} (Source ID: ${sourceId}). Defaulting to UTF-8.`,
      );
      detectedCharset = 'UTF-8';
    }
  }

  // Ellenőrizzük, hogy az iconv-lite támogatja-e a detektált karakterkódolást
  if (!iconv.encodingExists(detectedCharset)) {
    logger.warn(
      `[safeRssXmlParser] iconv-lite does not support detected charset: ${detectedCharset} for ${feedUrl} (Source ID: ${sourceId}). Defaulting to UTF-8.`,
    );
    detectedCharset = 'UTF-8';
  }

  let xmlString: string;
  try {
    xmlString = iconv.decode(bufferWithoutBom, detectedCharset);
  } catch (decodeError) {
    logger.error(
      `[safeRssXmlParser] Error decoding content for ${feedUrl} (Source ID: ${sourceId}) with charset ${detectedCharset}: ${decodeError instanceof Error ? decodeError.message : String(decodeError)}`,
    );
    // Ha a dekódolás hibás, nem tudunk továbbmenni
    return Promise.reject(decodeError);
  }

  // 3. XML Parszolás és Részletes Hibalogolás
  return new Promise((resolve, reject) => {
    const parser = new XmlParser({
      explicitArray: false,
      trim: true,
      // További xml2js opciók itt adhatók meg szükség szerint
    });

    parser.parseString(xmlString, (err, result) => {
      if (err) {
        const xmlSnippet = xmlString.substring(0, 500);
        const trimmedSnippet = xmlSnippet.trim().toLowerCase();

        const isHtml =
          trimmedSnippet.includes('<!doctype html>') || trimmedSnippet.startsWith('<html');
        const isJson = trimmedSnippet.startsWith('{') || trimmedSnippet.startsWith('[');

        if (isHtml || isJson) {
          // HTML vagy JSON tartalom esetén nem logolunk semmit, csak üres objektummal térünk vissza
          // hogy a hívó fetchAndParseRssFeed ne akadjon el, de ne is próbálja feldolgozni mint hírt.
          resolve({});
        } else {
          // Valódi XML parszolási hiba esetén error szinten logolunk és továbbdobjuk a hibát
          logger.error(
            `[safeRssXmlParser] XML parse error for feed: ${feedUrl} (Source ID: ${sourceId}). Error: ${err.message}. XML Snippet (first 500 chars): ${xmlSnippet}`,
          );
          reject(err);
        }
      } else {
        resolve(result);
      }
    });
  });
}

/**
 * Robusztus RSS item-kinyerő segédfüggvény, amely minden lehetséges szerkezetet lekezel.
 * @param parsedXmlObject A parszolt XML objektum
 * @returns Az itemek tömbje (lehet üres tömb is)
 */
export function extractRssItems(parsedXmlObject: any): any[] {
  let items = [];
  if (parsedXmlObject?.rss?.channel?.item) {
    items = parsedXmlObject.rss.channel.item;
  } else if (parsedXmlObject?.channel?.item) {
    items = parsedXmlObject.channel.item;
  }
  return Array.isArray(items) ? items : (items ? [items] : []);
}
