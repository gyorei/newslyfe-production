// --- useFrontendSearch.ts ---
// Ez a hook kizárólag a TABBAN lévő hírek között keres (frontend szűrés),
// nem indít új API keresést, nem szinkronizál a globális (Home) kereséssel.
// A keresés gyors, csak a kapott newsItems tömbben szűr, relevancia pontozással.
// A NavigationBar keresője ezt használja: csak vizuális szűrés, nem változtatja a fő keresési állapotot.

import { useState, useCallback } from 'react';
import { NewsItem } from '../../../../types';
import {
  normalizeText,
  prepareSearchTerms,
  detectTextLanguage,
  TextLanguage,
} from '../utils/textSearchUtils';
// ✅ JAVÍTOTT IMPORTOK: validateSearchConfig eltávolítva (nem használt)
import { SearchConfig, DEFAULT_STRICT_CONFIG, mergeSearchConfig } from '../config/searchConfig';

// 🎯 KERESÉSI EREDMÉNY TÍPUS
interface FrontendSearchResult extends NewsItem {
  relevance_score: number;
  content: string;
  created_at: string;
  language: string;
}

// 🔍 KERESÉSI HOOK INTERFACE - KONFIGURÁLHATÓ
interface UseFrontendSearchReturn {
  searchResults: FrontendSearchResult[];
  isSearching: boolean;
  performSearch: (query: string, newsItems: NewsItem[]) => FrontendSearchResult[];
  clearSearch: () => void;
  currentConfig: SearchConfig;
}

/**
 * Frontend keresési hook - KONFIGURÁLHATÓ RENDSZER v3.0
 *
 * Előnyök:
 * - ⚡ Szupergyors (5-50ms) - OPTIMALIZÁLT
 * - 🔧 RUGALMASAN KONFIGURÁLHATÓ (Strict/Relaxed/Egyéni)
 * - 🎯 SMART MODE: Konfiguráció alapán választ keresési stratégiát
 * - 🌍 TÖBBNYELVŰ KERESÉS (Magyar, Orosz, Ukrán, stb.)
 * - 🚀 TELJESÍTMÉNY OPTIMALIZÁLT (reduce alapú)
 * - 📊 RÉSZLETES ANALYTICS és LOGGING
 */
export const useFrontendSearch = (
  customConfig?: Partial<SearchConfig>,
): UseFrontendSearchReturn => {
  // 🔧 KONFIGURÁCIÓ ÖSSZEÁLLÍTÁSA
  const config = customConfig
    ? mergeSearchConfig(DEFAULT_STRICT_CONFIG, customConfig)
    : DEFAULT_STRICT_CONFIG;

  const [searchResults, setSearchResults] = useState<FrontendSearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  // ✅ HELPER FUNKCIÓ: STRICT MODE pontozás - Cognitive Complexity csökkentése
  const calculateStrictScore = useCallback(
    (
      searchTerms: string[],
      titleNormalized: string,
      descriptionNormalized: string,
      sourceNormalized: string,
      config: SearchConfig,
      logPrefix: string,
      item: NewsItem,
    ): { score: number; hasMatch: boolean } => {
      let relevanceScore = 0;

      const allTermsFoundInTitle = searchTerms.every((term) => titleNormalized.includes(term));
      const allTermsFoundInDescription = searchTerms.every((term) =>
        descriptionNormalized.includes(term),
      );
      const allTermsFoundInSource = searchTerms.every((term) => sourceNormalized.includes(term));

      const hasMatch = allTermsFoundInTitle || allTermsFoundInDescription || allTermsFoundInSource;

      if (allTermsFoundInTitle) {
        relevanceScore += config.scoreWeights.title * searchTerms.length;

        // Pontos egyezés bonus
        const fullQuery = searchTerms.join(' ');
        if (titleNormalized.startsWith(fullQuery)) {
          relevanceScore += config.bonuses.exactStart;
          if (config.enableDebugLogging) {
            console.log(`${logPrefix} PONTOS EGYEZÉS BONUS: "${item.title}"`);
          }
        }

        // Közelségi bonus
        relevanceScore += calculateProximityBonus(titleNormalized, searchTerms, config, logPrefix);
      }

      if (allTermsFoundInDescription) {
        relevanceScore += config.scoreWeights.description * searchTerms.length;
      }

      if (allTermsFoundInSource) {
        relevanceScore += config.scoreWeights.source * searchTerms.length;
      }

      return { score: relevanceScore, hasMatch };
    },
    [],
  );

  // ✅ HELPER FUNKCIÓ: Közelségi bonus számítás
  const calculateProximityBonus = useCallback(
    (text: string, searchTerms: string[], config: SearchConfig, logPrefix: string): number => {
      const words = text.split(/\s+/).filter(Boolean);
      const queryWords = searchTerms;

      for (let i = 0; i <= words.length - queryWords.length; i++) {
        const slice = words.slice(i, i + queryWords.length);
        if (queryWords.every((word, idx) => slice[idx] === word)) {
          if (config.enableDebugLogging) {
            console.log(`${logPrefix} KÖZELSÉGI BONUS: "${queryWords.join(' ')}" egymás mellett`);
          }
          return config.bonuses.proximity;
        }
      }
      return 0;
    },
    [],
  );

  // ✅ HELPER FUNKCIÓ: RELAXED MODE pontozás
  const calculateRelaxedScore = useCallback(
    (
      searchTerms: string[],
      titleNormalized: string,
      descriptionNormalized: string,
      sourceNormalized: string,
      config: SearchConfig,
    ): number => {
      let relevanceScore = 0;

      searchTerms.forEach((term) => {
        if (titleNormalized.includes(term)) {
          relevanceScore += config.scoreWeights.title;
          if (titleNormalized.startsWith(term)) {
            relevanceScore += Math.floor(config.bonuses.exactStart / 2);
          }
        }

        if (descriptionNormalized.includes(term)) {
          relevanceScore += config.scoreWeights.description;
        }

        if (sourceNormalized.includes(term)) {
          relevanceScore += config.scoreWeights.source;
        }
      });

      return relevanceScore;
    },
    [],
  );

  // ✅ HELPER FUNKCIÓ: Eredmény objektum létrehozása
  const createSearchResult = useCallback(
    (
      item: NewsItem,
      relevanceScore: number,
      detectedLanguage: TextLanguage,
    ): FrontendSearchResult => {
      return {
        ...item,
        imageUrl: item.imageUrl || (item as any).image_url || (item as any).image || undefined, // <-- Mindig legyen imageUrl, akkor is ha máshogy hívják
        content: item.description || '',
        created_at: item.date || new Date(item.timestamp).toISOString(),
        language:
          detectedLanguage === TextLanguage.CYRILLIC
            ? 'ru'
            : detectedLanguage === TextLanguage.MIXED
              ? 'mixed'
              : 'hu',
        relevance_score: relevanceScore,
      };
    },
    [],
  );

  // ✅ HELPER FUNKCIÓ: Debug logging
  const logSearchResults = useCallback(
    (
      results: FrontendSearchResult[],
      newsItemsCount: number,
      searchTime: number,
      logPrefix: string,
      config: SearchConfig,
    ): void => {
      if (!config.enableDebugLogging) return;

      console.log(
        `${logPrefix} Keresés befejezve: ${results.length} találat ${searchTime}ms alatt`,
      );
      console.log(
        `${logPrefix} Szűrés: ${newsItemsCount} → ${results.length} (${((results.length / newsItemsCount) * 100).toFixed(1)}%)`,
      );

      if (results.length > 0) {
        const maxScore = Math.max(...results.map((r) => r.relevance_score));
        const avgScore = results.reduce((sum, r) => sum + r.relevance_score, 0) / results.length;
        console.log(`${logPrefix} Relevancia - Max: ${maxScore}, Átlag: ${avgScore.toFixed(1)}`);

        console.log(`${logPrefix} TOP 3 TALÁLAT:`);
        results.slice(0, 3).forEach((result, index) => {
          console.log(`${index + 1}. [${result.relevance_score}pt] "${result.title}"`);
        });
      } else {
        console.log(`${logPrefix} ❌ NINCS TALÁLAT - Próbálj más keresési kifejezést`);
      }
    },
    [],
  );

  // 🎯 FŐKERESÉSI LOGIKA - EGYSZERŰSÍTETT ÉS OPTIMALIZÁLT
  const performSearch = useCallback(
    (query: string, newsItems: NewsItem[]): FrontendSearchResult[] => {
      const searchMode = config.strictMode ? 'STRICT' : 'RELAXED';
      const logPrefix = `[useFrontendSearch-${searchMode}]`;

      if (config.enableDebugLogging) {
        console.log(`${logPrefix} Keresés indítása: "${query}" - ${newsItems.length} cikkben`);
        console.log(`${logPrefix} Konfiguráció:`, {
          strictMode: config.strictMode,
          maxResults: config.maxResults,
          scoreWeights: config.scoreWeights,
          bonuses: config.bonuses,
        });
      }

      if (!query || query.trim().length === 0) {
        if (config.enableDebugLogging) console.log(`${logPrefix} Üres keresési kifejezés`);
        return [];
      }

      if (!newsItems || newsItems.length === 0) {
        if (config.enableDebugLogging) console.log(`${logPrefix} Nincs keresési adat`);
        return [];
      }

      setIsSearching(true);

      try {
        const startTime = performance.now();

        // 🌍 AUTOMATIKUS NYELVFELISMERÉS
        const detectedLanguage = detectTextLanguage(query);
        if (config.enableDebugLogging) {
          console.log(`${logPrefix} Felismert nyelv: ${detectedLanguage}`);
        }

        // 🔍 TÖBBNYELVŰ KERESÉSI KIFEJEZÉSEK ELŐKÉSZÍTÉSE
        const searchTerms = prepareSearchTerms(query, config.minSearchLength);

        if (config.enableDebugLogging) {
          console.log(`${logPrefix} Keresési kifejezések:`, searchTerms);
          console.log(`${logPrefix} Keresési mód: ${config.strictMode ? 'STRICT' : 'RELAXED'}`);
        }

        if (searchTerms.length === 0) {
          if (config.enableDebugLogging)
            console.log(`${logPrefix} Nincs érvényes keresési kifejezés`);
          return [];
        }

        // 🚀 OPTIMALIZÁLT KERESÉSI LOGIKA - CSÖKKENTETT KOMPLEXITÁS
        const results: FrontendSearchResult[] = newsItems
          .reduce<FrontendSearchResult[]>((acc, item) => {
            // Szöveg normalizálás
            const titleNormalized = normalizeText(item.title);
            const descriptionNormalized = normalizeText(item.description || '');
            const sourceNormalized = normalizeText(item.source || '');

            // Keresési stratégia választása
            let relevanceScore = 0;
            let hasMatch = false;

            if (config.strictMode) {
              const result = calculateStrictScore(
                searchTerms,
                titleNormalized,
                descriptionNormalized,
                sourceNormalized,
                config,
                logPrefix,
                item,
              );
              relevanceScore = result.score;
              hasMatch = result.hasMatch;
            } else {
              relevanceScore = calculateRelaxedScore(
                searchTerms,
                titleNormalized,
                descriptionNormalized,
                sourceNormalized,
                config,
              );
              hasMatch = relevanceScore > 0;
            }

            // 🎯 EREDMÉNY HOZZÁADÁSA
            if (hasMatch && relevanceScore > 0) {
              acc.push(createSearchResult(item, relevanceScore, detectedLanguage));
            }

            return acc;
          }, [])
          .sort((a, b) => {
            if (b.relevance_score !== a.relevance_score) {
              return b.relevance_score - a.relevance_score;
            }
            return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
          })
          .slice(0, config.maxResults || 100);

        const endTime = performance.now();
        const searchTime = Math.round(endTime - startTime);

        // 📊 LOGGING
        logSearchResults(results, newsItems.length, searchTime, logPrefix, config);

        // --- 2. KERESÉS UTÁN (useFrontendSearch) ---
        console.log('--- 2. KERESÉS UTÁN (useFrontendSearch) ---');
        if (results && results.length > 0) {
            console.log('Az első találat itt:', results[0]);
            console.log('Az első találat imageUrl-je:', results[0].imageUrl);
        }

        // ⚠️ TIMEOUT ELLENŐRZÉS
        if (searchTime > (config.searchTimeout || 5000)) {
          console.warn(
            `${logPrefix} LASSÚ KERESÉS: ${searchTime}ms (limit: ${config.searchTimeout}ms)`,
          );
        }

        setSearchResults(results);
        return results;
      } catch (error) {
        console.error(`[useFrontendSearch] Keresési hiba:`, error);
        return [];
      } finally {
        setIsSearching(false);
      }
    },
    [
      config,
      calculateStrictScore,
      calculateRelaxedScore,
      createSearchResult,
      logSearchResults,
      calculateProximityBonus,
    ],
  );

  // 🧹 KERESÉS TÖRÖLÉSE
  const clearSearch = useCallback(() => {
    if (config.enableDebugLogging) {
      console.log('[useFrontendSearch] Keresés törölve');
    }
    setSearchResults([]);
    setIsSearching(false);
  }, [config.enableDebugLogging]);

  return {
    searchResults,
    isSearching,
    performSearch,
    clearSearch,
    currentConfig: config,
  };
};
