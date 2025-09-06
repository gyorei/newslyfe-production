// src/components/Side/Search/useSearch.ts
import { useState, useEffect, useCallback } from 'react'; // useCallback importálva
import { useTranslation } from 'react-i18next';

// API-tól kapott nyers adat típusa
interface ApiSearchResult {
  id: string | number; // Az API string-ként vagy number-ként is küldheti
  title: string;
  url: string;
  created_at: string;
  language: string;
  source?: string;
  description?: string;
  imageUrl?: string;
  country?: string;
}

// A hook és a komponensek által használt végleges típus
interface SearchResult {
  id: number;
  title: string;
  url: string;
  created_at: string;
  language: string;
  source?: string;
  description?: string;
  imageUrl?: string;
  country?: string;
}

interface SearchResponse {
  results: ApiSearchResult[]; // API válasz már ApiSearchResult[]
  total: number;
  query: string;
  limit: number;
  offset: number;
}

export function useSearch() {
  const { t } = useTranslation();
  const [searchTerm, setSearchTerm] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const limit = 50; // ✅ JAVÍTÁS: 10 helyett 50 találat

  const performSearch = useCallback(
    async (query: string, pageNum = 1) => {
      console.log(`[useSearch] Keresés indítva: "${query}", limit: ${limit}, page: ${pageNum}`);

      if (!query.trim()) {
        setResults([]);
        setTotal(0);
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const offset = (pageNum - 1) * limit;
        const apiUrl = `/api/search?query=${encodeURIComponent(query)}&limit=${limit}&offset=${offset}`;
        console.log(`[useSearch] API URL: ${apiUrl}`);

        const response = await fetch(apiUrl);
        console.log(`[useSearch] Response status: ${response.status}`);
        console.log(`[useSearch] Response headers:`, response.headers);

        if (!response.ok) {
          const errorText = await response.text();
          console.error(`[useSearch] API hiba: ${response.status} ${response.statusText}`);
          console.error(`[useSearch] Error details: ${errorText}`);
          throw new Error(t('search.error.general'));
        }

        const data: SearchResponse = await response.json();
        console.log(`[useSearch] API válasz:`, data);
        console.log(`[useSearch] Találatok száma: ${data.results?.length || 0}`);
        console.log(`[useSearch] Összes találat: ${data.total || 0}`);

        // Az API válaszból származó eredményeket átalakítjuk, hogy az ID biztosan szám legyen
        const transformedResults: SearchResult[] = data.results.map((item) => ({
          ...item,
          id: typeof item.id === 'string' ? parseInt(item.id, 10) : item.id,
        }));

        console.log(`[useSearch] Feldolgozott eredmények: ${transformedResults.length} db`);
        console.log(`[useSearch] Első 3 találat:`, transformedResults.slice(0, 3));

        setResults(transformedResults);
        setTotal(data.total);
        setPage(pageNum); // Frissítjük az oldalszámot a hook állapotában
      } catch (err) {
        console.error('[useSearch] Keresési hiba:', err);
        setError(err instanceof Error ? err.message : t('search.error.unknown'));
        setResults([]);
        setTotal(0);
      } finally {
        setLoading(false);
      }
    },
    [limit, t],
  ); // limit és t a függőség, a set... függvények stabilak

  // Effekt az URL paraméterek alapján történő kezdeti searchTerm beállításához
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const queryParam = params.get('q');

    if (queryParam) {
      setSearchTerm(queryParam);
      // A page-et itt 1-re állítjuk, hogy az URL-ből jövő keresés mindig az első oldallal induljon
      setPage(1);
    }
  }, []); // Csak mount-kor fut le

  // Effekt a keresés végrehajtásához, amikor a searchTerm vagy a page megváltozik
  useEffect(() => {
    if (searchTerm.trim()) {
      // Csak akkor keressen, ha van valós keresőszó
      performSearch(searchTerm, page);
    } else {
      // Ha a searchTerm üres (pl. törlés után), ürítsük az eredményeket
      setResults([]);
      setTotal(0);
    }
  }, [searchTerm, page, performSearch]); // performSearch most már stabil referencia

  return {
    searchTerm,
    setSearchTerm,
    results,
    total,
    loading,
    error,
    page,
    setPage,
    performSearch, // Memoizált függvény
    limit,
  };
}
