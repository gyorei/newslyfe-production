/**
 * 🔗 EGYSZERŰ GEO-KERESÉSI REACT HOOK (MVP VERZIÓ)
 *
 * A NewTabPanel geo-keresési rendszerének React hook-ja.
 * Összeköti a GeoMatcher intelligenciáját a PostgreSQL API-val.
 *
 * Használat:
 * ```typescript
 * const { performGeoSearch, isSearching, lastResult } = useSimpleGeoSearch();
 *
 * const handleSearch = async (query: string) => {
 *   const results = await performGeoSearch(query);
 *   onSearch(query, results);
 * };
 * ```
 */

import { useState, useCallback, useRef, useMemo } from 'react';
import { NewsItem } from '../../../../types';
import { detectGeoQuery, type GeoQueryResult } from './GeoMatcher';

// 🎯 HOOK RETURN INTERFACE
export interface UseSimpleGeoSearchReturn {
  performGeoSearch: (query: string) => Promise<NewsItem[]>;
  isSearching: boolean;
  error: string | null;
  lastResult: GeoQueryResult | null;
  lastQuery: string;
  searchCount: number;
  lastSearchTime: number;
  clearResults: () => void;
  abortSearch: () => void;
}

// 🎯 HOOK BEÁLLÍTÁSOK
interface GeoSearchOptions {
  maxResults?: number;
  timeout?: number;
  enableLogging?: boolean;
}

const DEFAULT_OPTIONS: Required<GeoSearchOptions> = {
  maxResults: 1000,
  timeout: 10000,
  enableLogging: true,
};

/**
 * 🔍 EGYSZERŰ GEO-KERESÉSI HOOK
 */
export const useSimpleGeoSearch = (options: GeoSearchOptions = {}): UseSimpleGeoSearchReturn => {
  const config = useMemo(() => ({ ...DEFAULT_OPTIONS, ...options }), [options]);
  const logPrefix = '[useSimpleGeoSearch]';

  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastResult, setLastResult] = useState<GeoQueryResult | null>(null);
  const [lastQuery, setLastQuery] = useState('');
  const [searchCount, setSearchCount] = useState(0);
  const [lastSearchTime, setLastSearchTime] = useState(0);

  const abortControllerRef = useRef<AbortController | null>(null);

  // 🔍 FŐ KERESÉSI FÜGGVÉNY
  const performGeoSearch = useCallback(
    async (query: string): Promise<NewsItem[]> => {
      if (config.enableLogging) {
        console.log(`${logPrefix} Geo-keresés indítása: "${query}"`);
      }

      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      abortControllerRef.current = new AbortController();

      try {
        setIsSearching(true);
        setError(null);
        setLastQuery(query);

        const searchStartTime = performance.now();

        const geoResult = detectGeoQuery(query, 'hu');
        setLastResult(geoResult);

        if (!geoResult.isValid) {
          throw new Error(geoResult.errorMessage || 'Érvénytelen keresési kifejezés');
        }

        if (config.enableLogging) {
          console.log(`${logPrefix} Geo-elemzés:`, {
            type: geoResult.type,
            strategy: geoResult.strategy,
            confidence: geoResult.confidence,
          });
        }

        let searchResults: NewsItem[] = [];
        switch (geoResult.strategy) {
          case 'country_only':
            searchResults = await executeCountrySearch(geoResult, config, logPrefix);
            break;
          case 'continent_only':
            searchResults = await executeContinentSearch(geoResult, config, logPrefix);
            break;
          default:
            if (config.enableLogging) {
              console.warn(`${logPrefix} Nem támogatott keresési stratégia: ${geoResult.strategy}`);
            }
            searchResults = [];
        }
        const limitedResults = searchResults.slice(0, config.maxResults);

        const searchEndTime = performance.now();
        const searchTime = Math.round(searchEndTime - searchStartTime);
        setLastSearchTime(searchTime);
        setSearchCount((prev) => prev + 1);

        if (config.enableLogging) {
          console.log(
            `${logPrefix} Keresés befejezve: ${limitedResults.length} eredmény ${searchTime}ms alatt`,
          );
        }

        return limitedResults;
      } catch (error: unknown) {
        if (error instanceof Error && error.name === 'AbortError') {
          if (config.enableLogging) {
            console.log(`${logPrefix} Keresés megszakítva`);
          }
          return [];
        }

        const errorMessage = error instanceof Error ? error.message : 'Keresési hiba történt';
        setError(errorMessage);
        console.error(`${logPrefix} Keresési hiba:`, error);

        return [];
      } finally {
        setIsSearching(false);
      }
    },
    [config],
  );

  const clearResults = useCallback(() => {
    setError(null);
    setLastResult(null);
    setLastQuery('');

    if (config.enableLogging) {
      console.log(`${logPrefix} Eredmények törölve`);
    }
  }, [config.enableLogging]);

  const abortSearch = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      setIsSearching(false);

      if (config.enableLogging) {
        console.log(`${logPrefix} Keresés megszakítva`);
      }
    }
  }, [config.enableLogging]);

  return {
    performGeoSearch,
    isSearching,
    error,
    lastResult,
    lastQuery,
    searchCount,
    lastSearchTime,
    clearResults,
    abortSearch,
  };
};

// --- HELPER FÜGGVÉNYEK ---
///////////////////////////////////////////////////

// ...existing code...

async function executeCountrySearch(
  geoResult: GeoQueryResult,
  config: Required<GeoSearchOptions>,
  logPrefix: string,
): Promise<NewsItem[]> {
  const countryCode = geoResult.geoMatch!.code;

  if (config.enableLogging) {
    console.log(`${logPrefix} Ország hírek lekérése: ${countryCode}`);
  }

  const apiUrl = `http://localhost:3002/api/country/${countryCode}/news?limit=${config.maxResults}&importanceLevel=10&maxAgeHours=24`;
  const response = await fetch(apiUrl);

  if (!response.ok) {
    throw new Error(`API hiba: ${response.status} - ${response.statusText}`);
  }

  const data = await response.json();
  const newsItems: NewsItem[] = data.news || data;

  if (config.enableLogging) {
    console.log(
      `${logPrefix} ${newsItems.length} hír érkezett ${countryCode} országból (API: ${apiUrl})`,
    );
  }

  return newsItems;
}

// Ugyanígy módosítsd a continent search-et is!
async function executeContinentSearch(
  geoResult: GeoQueryResult,
  config: Required<GeoSearchOptions>,
  logPrefix: string,
): Promise<NewsItem[]> {
  const continentCode = geoResult.geoMatch!.code;

  if (config.enableLogging) {
    console.log(`${logPrefix} Kontinens hírek lekérése: ${continentCode}`);
  }

  const apiUrl = `http://localhost:3002/api/continent/${continentCode}/news?limit=${config.maxResults}&importanceLevel=10&maxAgeHours=24`;
  const response = await fetch(apiUrl);

  if (!response.ok) {
    throw new Error(`API hiba: ${response.status} - ${response.statusText}`);
  }

  const data = await response.json();
  const newsItems: NewsItem[] = data.news || data;

  if (config.enableLogging) {
    console.log(
      `${logPrefix} ${newsItems.length} hír érkezett ${continentCode} kontinensről (API: ${apiUrl})`,
    );
  }

  return newsItems;
}

////////////////////////////////////////////////