import { useState, useCallback } from 'react';
import { NewsItem } from '../../types';

export interface FrontendSearchResult extends NewsItem {
  relevance_score?: number;
  content?: string;
  created_at?: string;
  language?: string;
}

export interface UseAppSearchReturn {
  searchResults: NewsItem[];
  searchTerm: string;
  isSearchMode: boolean;
  handleSearch: (tabId: string, query: string, results: NewsItem[]) => void;
  handleClearSearch: (tabId: string) => void;
  enableFrontendSearch: boolean;
  getTabSearchState: (tabId: string) => { searchResults: NewsItem[]; searchTerm: string; isSearchMode: boolean };
  tabSearchState: { [tabId: string]: { searchResults: NewsItem[]; searchTerm: string; isSearchMode: boolean } }; // ÚJ: teljes állapot exportálása
}

export const useAppSearch = (): UseAppSearchReturn => {
  const [tabSearchState, setTabSearchState] = useState<{
    [tabId: string]: {
      searchResults: NewsItem[];
      searchTerm: string;
      isSearchMode: boolean;
    }
  }>({});

  const enableFrontendSearch = true; // Frontend keresés engedélyezése

  const handleSearch = useCallback((tabId: string, query: string, results: NewsItem[] | FrontendSearchResult[]) => {
    console.log('--- 3. ÁLLAPOTKEZELŐ (useAppSearch) ---');
    if (results && results.length > 0) {
        console.log('Az első eredmény itt:', results[0]);
        console.log('Az első eredmény imageUrl-je:', results[0].imageUrl);
    }
    // --- FŐ JAVÍTÁS: minden property átadása, NE alakítsuk át a results tömböt, csak továbbítsuk ---
    setTabSearchState(prev => ({
      ...prev,
      [tabId]: {
        searchResults: results as NewsItem[], // NE alakítsuk át, csak továbbítsuk
        searchTerm: query,
        isSearchMode: true,
      }
    }));
    console.log(`[useAppSearch] Keresési mód aktiválva: "${query}" - ${(results?.length ?? 0)} találat`);
  }, []);

  const handleClearSearch = useCallback((tabId: string) => {
    setTabSearchState(prev => ({
      ...prev,
      [tabId]: {
        searchResults: [],
        searchTerm: '',
        isSearchMode: false,
      }
    }));
    console.log(`[useAppSearch] Keresési mód kikapcsolva (tabId: ${tabId})`);
  }, []);

  const getTabSearchState = useCallback((tabId: string) => {
    return tabSearchState[tabId] || {
      searchResults: [],
      searchTerm: '',
      isSearchMode: false,
    };
  }, [tabSearchState]);

  const globalState = Object.values(tabSearchState)[0] || {
    searchResults: [],
    searchTerm: '',
    isSearchMode: false,
  };

  return {
    searchResults: globalState.searchResults,
    searchTerm: globalState.searchTerm,
    isSearchMode: globalState.isSearchMode,
    handleSearch,
    handleClearSearch,
    enableFrontendSearch,
    getTabSearchState,
    tabSearchState, // <-- ÚJ: teljes állapot exportálása
  };
};