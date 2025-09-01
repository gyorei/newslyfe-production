/**
 * Top News Sites adatok
 *
 * Ez a fájl a legnépszerűbb és legmegbízhatóbb hírforrások listáját tartalmazza
 * országonként. Ezek a források prioritást kapnak a megjelenítésben.
 */

import { RSS_CONFIG } from '../config/localConfig';

export interface TopNewsSource {
  domain: string;
  name: string;
  priority: number; // 1 = legmagasabb prioritás
}

export interface CountryTopSources {
  [countryCode: string]: TopNewsSource[];
}

// Országonkénti TOP hírforrások - a scripts/categorizeNewsSources.ts alapján
const topNewsSites: CountryTopSources = {
  // Magyarország
  HU: [
    { domain: 'origo.hu', name: 'Origo', priority: 1 },
    { domain: 'index.hu', name: 'Index', priority: 1 },
    { domain: '444.hu', name: '444', priority: 1 },
    { domain: 'telex.hu', name: 'Telex', priority: 1 },
    { domain: 'hvg.hu', name: 'HVG', priority: 1 },
    { domain: '24.hu', name: '24.hu', priority: 2 },
    { domain: 'portfolio.hu', name: 'Portfolio', priority: 2 },
    { domain: 'magyarnemzet.hu', name: 'Magyar Nemzet', priority: 2 },
  ],

  // Németország
  DE: [
    { domain: 'spiegel.de', name: 'Der Spiegel', priority: 1 },
    { domain: 'faz.net', name: 'FAZ', priority: 1 },
    { domain: 'sueddeutsche.de', name: 'Süddeutsche Zeitung', priority: 1 },
    { domain: 'bild.de', name: 'Bild', priority: 1 },
    { domain: 'welt.de', name: 'Die Welt', priority: 1 },
    { domain: 'zeit.de', name: 'Die Zeit', priority: 2 },
  ],

  // Franciaország
  FR: [
    { domain: 'lemonde.fr', name: 'Le Monde', priority: 1 },
    { domain: 'lefigaro.fr', name: 'Le Figaro', priority: 1 },
    { domain: 'liberation.fr', name: 'Libération', priority: 1 },
    { domain: 'leparisien.fr', name: 'Le Parisien', priority: 2 },
    { domain: '20minutes.fr', name: '20 Minutes', priority: 2 },
  ],

  // Egyesült Királyság
  GB: [
    { domain: 'bbc.co.uk', name: 'BBC', priority: 1 },
    { domain: 'theguardian.com', name: 'The Guardian', priority: 1 },
    { domain: 'telegraph.co.uk', name: 'The Telegraph', priority: 1 },
    { domain: 'independent.co.uk', name: 'The Independent', priority: 1 },
    { domain: 'thetimes.co.uk', name: 'The Times', priority: 1 },
    { domain: 'dailymail.co.uk', name: 'Daily Mail', priority: 2 },
  ],

  // Egyesült Államok
  US: [
    { domain: 'cnn.com', name: 'CNN', priority: 1 },
    { domain: 'nytimes.com', name: 'New York Times', priority: 1 },
    { domain: 'foxnews.com', name: 'Fox News', priority: 1 },
    { domain: 'usatoday.com', name: 'USA Today', priority: 1 },
    { domain: 'washingtonpost.com', name: 'Washington Post', priority: 1 },
    { domain: 'wsj.com', name: 'Wall Street Journal', priority: 1 },
    { domain: 'npr.org', name: 'NPR', priority: 2 },
  ],

  // Olaszország
  IT: [
    { domain: 'corriere.it', name: 'Corriere della Sera', priority: 1 },
    { domain: 'repubblica.it', name: 'La Repubblica', priority: 1 },
    { domain: 'lastampa.it', name: 'La Stampa', priority: 1 },
    { domain: 'ilsole24ore.com', name: 'Il Sole 24 ORE', priority: 2 },
  ],

  // Spanyolország
  ES: [
    { domain: 'elpais.com', name: 'El País', priority: 1 },
    { domain: 'elmundo.es', name: 'El Mundo', priority: 1 },
    { domain: 'abc.es', name: 'ABC', priority: 1 },
    { domain: 'lavanguardia.com', name: 'La Vanguardia', priority: 2 },
  ],

  // Ausztria
  AT: [
    { domain: 'orf.at', name: 'ORF', priority: 1 },
    { domain: 'derstandard.at', name: 'Der Standard', priority: 1 },
    { domain: 'diepresse.com', name: 'Die Presse', priority: 1 },
    { domain: 'krone.at', name: 'Kronen Zeitung', priority: 2 },
  ],

  // Kanada
  CA: [
    { domain: 'cbc.ca', name: 'CBC', priority: 1 },
    { domain: 'globalnews.ca', name: 'Global News', priority: 1 },
    { domain: 'ctv.ca', name: 'CTV News', priority: 1 },
    { domain: 'thestar.com', name: 'Toronto Star', priority: 2 },
  ],

  // Ausztrália
  AU: [
    { domain: 'abc.net.au', name: 'ABC News', priority: 1 },
    { domain: 'news.com.au', name: 'News.com.au', priority: 1 },
    { domain: 'smh.com.au', name: 'Sydney Morning Herald', priority: 1 },
    { domain: 'theage.com.au', name: 'The Age', priority: 2 },
  ],
};

/**
 * Meghatározza, hogy egy hírforrás TOP forrás-e az adott országban
 */
export function isTopNewsSource(url: string, countryCode: string): boolean {
  const countrySources = topNewsSites[countryCode];
  if (!countrySources) return false;

  return countrySources.some((source) => url.toLowerCase().includes(source.domain.toLowerCase()));
}

/**
 * Visszaadja egy hírforrás prioritását (ha TOP forrás)
 */
export function getSourcePriority(url: string, countryCode: string): number | null {
  const countrySources = topNewsSites[countryCode];
  if (!countrySources) return null;

  const source = countrySources.find((source) =>
    url.toLowerCase().includes(source.domain.toLowerCase()),
  );

  return source ? source.priority : null;
}

/**
 * Visszaadja az összes TOP forrást egy országhoz
 */
export function getTopSourcesByCountry(countryCode: string): TopNewsSource[] {
  return topNewsSites[countryCode] || [];
}

/**
 * ✅ ÚJ: Ellenőrzi, hogy engedélyezett-e a TOP források szűrése
 */
export function isTopSourceFilterEnabled(): boolean {
  return RSS_CONFIG.FILTERING.ENABLED && RSS_CONFIG.FILTERING.TOP_SITES_FILTER_ENABLED;
}

/**
 * ✅ ÚJ: Szűri a hírforrásokat TOP források alapján (ha engedélyezett)
 * @param sources Az összes hírforrás
 * @param countryCode Az ország kódja
 * @returns Szűrt hírforrások listája
 */
export function filterByTopSources<T extends { url?: string; link?: string }>(
  sources: T[],
  countryCode: string,
): T[] {
  // Ha a szűrés ki van kapcsolva, visszaadjuk az összes forrást
  if (!isTopSourceFilterEnabled()) {
    if (RSS_CONFIG.FILTERING.DEBUG_MODE) {
      console.log('[topNewsSites] TOP források szűrése kikapcsolva - minden forrás megjelenik');
    }
    return sources;
  }

  // Szűrés TOP források alapján
  const filtered = sources.filter((source) =>
    isTopNewsSource(source.url || source.link || '', countryCode),
  );

  if (RSS_CONFIG.FILTERING.DEBUG_MODE) {
    console.log(
      `[topNewsSites] TOP szűrés eredménye: ${filtered.length}/${sources.length} forrás (${countryCode})`,
    );
  }

  return filtered;
}

export default topNewsSites;
