/**
 * Favicon kezelő modul
 *
 * Ez a modul a favicon URL-ek generálásáért felel különböző forrásokból.
 * Kiszervezve a Card.tsx-ből a jobb újrafelhasználhatóság érdekében.
 */

/**
 * Domain kinyerése URL-ből, sourceId-ből vagy névből
 * @param options Objektum a domain kinyeréséhez használható különböző forrásokkal
 */
export const extractDomain = (options: {
  url?: string;
  sourceId?: string;
  sourceName?: string;
}): string | null => {
  const { url, sourceId, sourceName } = options;

  // 1. URL-ből próbáljuk kinyerni
  if (url) {
    try {
      const urlObj = new URL(url);
      return urlObj.hostname;
    } catch (e) {
      // Csendes hiba - következő módszerre lépünk
    }
  }

  // 2. sourceId-ből próbáljuk (pl. hu-nepszava formátum)
  if (sourceId) {
    // a) Először keresünk benne domain mintát (tartalmaz pontot)
    if (sourceId.includes('.')) return sourceId;

    // b) Ha nincs domain minta, akkor kötőjeles formátum (hu-nepszava)
    const parts = sourceId.split('-');
    if (parts.length > 1) return parts[1];

    // c) Ha nincs kötőjel, akkor a sourceId-t adjuk vissza
    return sourceId;
  }

  // 3. Forrás nevéből (ha nincs más)
  if (sourceName) {
    // Egyszerűsített normalizálás: kisbetűssé tesszük és eltávolítjuk a szóközöket
    return sourceName.toLowerCase().replace(/\s+/g, '');
  }

  return null;
};

/**
 * Favicon URL generálása
 * @param options Domain kinyeréshez használt adatok
 * @param size Az ikon mérete (alapértelmezetten 32)
 * @returns A favicon URL vagy null
 */
export const getFaviconUrl = (options: {
  url?: string;
  sourceId?: string;
  sourceName?: string;
  size?: 16 | 32 | 48 | 64;
}): string | null => {
  const domain = extractDomain(options);
  if (!domain) return null;

  const size = options.size || 32;
  return `https://www.google.com/s2/favicons?domain=${domain}&sz=${size}`;
};

/**
 * Alternatív favicon URL-ek lekérése, hibakezeléshez
 * @param domain A forrás domainje
 * @returns URL-ek listája, amelyeket sorban próbálhatunk
 */
export const getAlternativeFaviconUrls = (domain: string | null): string[] => {
  if (!domain) return [];

  return [
    `https://www.google.com/s2/favicons?domain=${domain}&sz=32`,
    `https://external-content.duckduckgo.com/ip3/${domain}.ico`,
    `https://${domain}/favicon.ico`,
  ];
};

// Exportáljuk az összes funkciót egy objektumban is
export default {
  extractDomain,
  getFaviconUrl,
  getAlternativeFaviconUrls,
};
