// File: src/components/Content/hooks/useNewsData.ts
import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Tab as AppTab, NewsItem } from '../../../types';
import FrontLocal from '../../LocalNews/FrontLocal/FrontLocal';
// ÚJ: useStorage import a maxAgeHours beállítás olvasásához
import { useStorage } from '../../../hooks/useStorage';
// ÚJ: Csak a konstans importálása, a bridge-et nem használjuk itt (Panel komponensben van)
import { MAX_AGE_HOURS_PREFERENCE_KEY } from '../../Utility/Settings/ContentSettings/TimeSettings';
import { UserHistoryService } from '../../History/utils/UserHistoryService';
// ✅ ÚJ: useTabCache import a cache állapot ellenőrzéséhez
import { useTabCache } from '../../../hooks/useTabStorage/useTabCache';

/**
 * API válasz item típusdefiníció a térképesítéshez
 */
interface NewsApiItem {
  id: string;
  title: string;
  description: string;
  url: string;
  imageUrl?: string;
  source: string;
  sourceId: string;
  date: string;
  timestamp: number;
  country?: string;
  continent?: string;
  category?: string | null;
  categories?: string[];
}

/**
 * API válasz formátum
 */
interface NewsApiResponse {
  news: NewsApiItem[];
  meta?: {
    hasMore?: boolean;
    total?: number;
    page?: number;
  };
}

/**
 * Szűrő típusa a hírek lekéréséhez
 */
interface NewsFilters {
  country?: string;
  continent?: string;
  importanceLevel?: number;
  category?: string | null;
  source?: string[];
  searchTerm?: string;
  limit?: number;
  maxAgeHours?: number; // ÚJ: Időalapú szűrés támogatása
  torzsMode?: boolean; // ÚJ: Törzs híradat mód támogatása
  forceRefresh?: boolean; // ✅ ÚJ: Cache bypass támogatása
}

/**
 * Hook a hírek adatainak lekérésére, kezelésére és a kapcsolódó állapotok menedzselésére.
 */
interface UseNewsDataProps {
  activeTab: AppTab;
  isNewTab: boolean;
  activeTabId: string;
  initialNewsItems?: NewsItem[];
  requestToken?: string;
  abortSignal?: AbortSignal;
  // --- ÚJ: setNewsItemsToken callback ---
  setNewsItemsToken?: (token: string) => void;
}

// --- ÚJ: Egységes filter előkészítő segédfüggvény ---
function prepareFilters(base: NewsFilters, maxAgeHours: number, forceRefresh = false): NewsFilters {
  const torzsMode = base.torzsMode || false;
  return {
    ...base,
    torzsMode,
    forceRefresh,
    maxAgeHours: torzsMode ? 24 : maxAgeHours,
  };
}

// --- ÚJ: CacheEntry típus az időbélyeges cache-hez ---
type CacheEntry = { timestamp: number; items: NewsItem[] };

export function useNewsData({
  activeTab,
  isNewTab,
  activeTabId,
  initialNewsItems,
  requestToken,
  abortSignal,
  setNewsItemsToken, // --- ÚJ: callback paraméter ---
}: UseNewsDataProps) {
  const [newsItems, setNewsItems] = useState<NewsItem[]>(initialNewsItems || []);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [hasMoreSources, setHasMoreSources] = useState(true);
  const { t } = useTranslation();

  // ✅ JAVÍTÁS: Duplikált API hívások megelőzése
  const isLoadingRef = useRef(false);
  const lastRequestRef = useRef<string>('');
  // --- requestCacheRef most már időbélyeges cache-t tárol ---
  const requestCacheRef = useRef<Map<string, CacheEntry>>(new Map());

  // ÚJ: maxAgeHours állapot kezelése
  const [maxAgeHours, setMaxAgeHours] = useState<number>(24); // Alapértelmezett: 24 óra

  // ÚJ: useStorage hook az időbeállítások olvasásához
  const { getUserPreference } = useStorage();
  
  // ✅ ÚJ: Tab cache integrálása a frissesség ellenőrzéséhez
  const { getTabContent, isCacheFresh, invalidateCache } = useTabCache();
  
  // ✅ ÚJ: Cache-frissesség ellenőrző konstans - Feature flag a biztonságos bevezetéshez
  const FEATURE_USE_CACHE_FRESHNESS = true;

  // ✅ STABILIZÁLT: maxAgeHours betöltése és figyelése
  useEffect(() => {
    const loadMaxAgeHours = async () => {
      try {
        // Betöltés IndexedDB-ből
        const maxAgePref = await getUserPreference(MAX_AGE_HOURS_PREFERENCE_KEY);
        if (maxAgePref && maxAgePref.value !== undefined) {
          const ageValue = Number(maxAgePref.value);
          setMaxAgeHours(ageValue);
     //     console.log(`[useNewsData] maxAgeHours betöltve: ${ageValue} óra`);
        } else {
          // Fallback localStorage-ból
          const savedMaxAge = localStorage.getItem('maxAgeHours');
          if (savedMaxAge) {
            const ageValue = Number(savedMaxAge);
            setMaxAgeHours(ageValue);
     //       console.log(`[useNewsData] maxAgeHours betöltve localStorage-ból: ${ageValue} óra`);
          }
        }
      } catch (error) {
   //     console.error('[useNewsData] Hiba a maxAgeHours betöltésekor:', error);
      }
    };

    loadMaxAgeHours();
  }, [getUserPreference]); // ✅ STABILIZÁLT: Csak betöltésre használjuk

  // ✅ OPTIMALIZÁLT: Lokális hírek lekérése cache-sel és duplikáció-védelemmel, időbélyeges cache
  const fetchLocalNews = useCallback(
    async (filters: NewsFilters = {}) => {
      console.log('[DEBUG] fetchLocalNews kapott szűrői:', filters);
      console.log('--- useNewsData.fetchLocalNews ---', filters);
      if (abortSignal?.aborted) {
   //     console.log('[USENEWSDATA-DEBUG] fetchLocalNews megszakítva, filter:', filters);
        return [];
      }
      const currentToken = requestToken;
      try {
    //    console.log('[USENEWSDATA-DEBUG] fetchLocalNews hívás, filter:', filters);
        // ✅ CACHE KULCS: Egyedi azonosító a kéréshez
        const cacheKey = JSON.stringify({
          country: filters.country,
          importanceLevel: filters.importanceLevel || 10,
          category: filters.category,
          maxAgeHours: filters.maxAgeHours || maxAgeHours,
          torzsMode: filters.torzsMode,
          forceRefresh: filters.forceRefresh, // ✅ ÚJ: forceRefresh cache kulcsban
        });

        // --- PATCH: forceRefresh esetén memóriacache törlése és kihagyása ---
        if (filters.forceRefresh) {
          requestCacheRef.current.delete(cacheKey); // Memóriacache törlése
        } else if (requestCacheRef.current.has(cacheKey)) {
          // --- KOMMENTEZVE: forceRefresh esetén ne adjon vissza cache-t ---
          // const cacheEntry = requestCacheRef.current.get(cacheKey);
          // if (cacheEntry && Date.now() - cacheEntry.timestamp < 5 * 60 * 1000) {
          //   setNewsItems(cacheEntry.items);
          //   setHasMoreSources(cacheEntry.items.length >= 30);
          //   if (setNewsItemsToken) setNewsItemsToken(currentToken!);
          //   return cacheEntry.items;
          // }
        }

  //      console.log(`[useNewsData] FrontLocal.getNews hívása maxAgeHours: ${maxAgeHours}`, filters);

        // ÚJ: Ha pontosan egy forrás van a filterben, akkor a filtert változatlanul átadjuk a FrontLocal.getNews-nek,
        // így a backend sourceId query paraméterrel hívódik meg (forrás tab esetén)
        let rssNewsItems: any[] = [];
        if (filters.source && Array.isArray(filters.source) && filters.source.length === 1) {
     //     console.log('[USENEWSDATA-DEBUG] Egy forrásos fetchLocalNews, filter:', filters);
          rssNewsItems = await FrontLocal.getNews({
            ...filters,
            useGeoLocation: true,
            isCleanTab: false,
            maxAgeHours: filters.maxAgeHours || maxAgeHours,
            torzsMode: filters.torzsMode,
            forceRefresh: filters.forceRefresh,
          });
     //     console.log('[USENEWSDATA-DEBUG] Egy forrásos fetchLocalNews, visszakapott hírek:', rssNewsItems.length);
        } else {
     //     console.log('[USENEWSDATA-DEBUG] Normál fetchLocalNews, filter:', filters);
          rssNewsItems = await FrontLocal.getNews({
            country: filters.country,
            importanceLevel: filters.importanceLevel || 10,
            category: filters.category,
            source: filters.source,
            useGeoLocation: true,
            isCleanTab: false,
            maxAgeHours: filters.maxAgeHours || maxAgeHours,
            torzsMode: filters.torzsMode,
            forceRefresh: filters.forceRefresh,
          });
    //      console.log('[USENEWSDATA-DEBUG] Normál fetchLocalNews, visszakapott hírek:', rssNewsItems.length);
        }

        // Token check
        if (requestToken && currentToken !== requestToken) {
     //     console.warn('[useNewsData] 🛑 Token mismatch – fetchLocalNews válasz figyelmen kívül hagyva');
          return [];
        }
/*
       console.log(
          `[useNewsData] ${rssNewsItems.length} hír érkezett a FrontLocal-ból (${filters.forceRefresh ? 'FORCE REFRESH' : `${maxAgeHours}h szűréssel`})`,
        );
*/
        // Konvertálás RssNewsItem[] → NewsItem[] formátumra
        const newsItems = rssNewsItems.map(
          (item) =>
            ({
              id: item.id,
              title: item.title,
              description: item.description,
              imageUrl: item.imageUrl || '',
              source: item.source.name,
              sourceId: item.source.id,
              date: item.pubDate,
              timestamp: item.timestamp,
              url: item.link,
              country: item.source.country || filters.country || 'unknown',
              continent: item.source.continent || 'unknown',
              categories: item.categories || [],
            }) as NewsItem,
        );

        // ✅ CACHE MENTÉS: Eredmény tárolása időbélyeggel
        // requestCacheRef.current.set(cacheKey, { timestamp: Date.now(), items: newsItems });

        // ✅ CACHE TISZTÍTÁS: Max 10 bejegyzés tárolása
        // if (requestCacheRef.current.size > 10) {
        //   const oldestKey = requestCacheRef.current.keys().next().value;
        //   if (oldestKey) {
        //     requestCacheRef.current.delete(oldestKey);
        //   }
        // }

        setHasMoreSources(newsItems.length >= 30);
        setNewsItems(newsItems);
        if (setNewsItemsToken) setNewsItemsToken(currentToken!);
        return newsItems;
      } catch (err) {
        if ((err as Error).name === 'AbortError') {
   //       console.log('[useNewsData] Fetch megszakítva (abort)');
          return [];
        }
    //    console.error(`[useNewsData] FrontLocal hiba:`, err);
        throw err;
      }
    },
    [maxAgeHours, abortSignal, requestToken, setNewsItemsToken],
  );

  // 2. MÓDOSÍTOTT: Kontinens hírek lekérése maxAgeHours paraméterrel és TÖRZS MÓD TÁMOGATÁSSAL
  const fetchContinentNews = useCallback(
    async (continent: string, country?: string, filters: NewsFilters = {}) => {
      if (abortSignal?.aborted) {
   //     console.log('[useNewsData] ⛔ Kérés megszakítva még a fetchContinentNews előtt');
        return [];
      }
      const currentToken = requestToken;
      try {
        const params = new URLSearchParams();
        if (country) params.append('country', country);
        params.append('limit', '1000');
        params.append('importanceLevel', '10');

        // 🎯 ÚJ: TÖRZS MÓD TÁMOGATÁS KONTINENS HÍREKHEZ
        if (filters.torzsMode) {
          params.append('torzsMode', 'true');
          params.append('maxAgeHours', '24'); // 24 óra törzs módban
    //      console.log(`[useNewsData] 🎯 KONTINENS TÖRZS MÓD: ${continent} - 24 órás hírek`);
        } else {
          // ÚJ: maxAgeHours paraméter hozzáadása
          params.append('maxAgeHours', (filters.maxAgeHours || maxAgeHours).toString());
          console.log(
            `[useNewsData] KONTINENS NORMÁL MÓD: ${continent} - ${filters.maxAgeHours || maxAgeHours}h hírek`,
          );
        }

        // Ha fetch-et használsz:
        // const response = await fetch(url, { signal: abortSignal });
        // const data = await response.json();
        // Jelenleg fallback: sima fetch abortSignal nélkül
        const url = `/api/continent/${continent}/news?${params.toString()}`;
   //     console.log(`[useNewsData] Kontinens hírek lekérdezése - ${url}`);

        // VÉGLEGES: fetch signal átadása
        const response = await fetch(url, { signal: abortSignal });
        if (!response.ok) throw new Error(`API hiba: ${response.status} ${response.statusText}`);

        const data = (await response.json()) as NewsApiResponse;
        // Token check
        if (requestToken && currentToken !== requestToken) {
    //      console.warn('[useNewsData] 🛑 Token mismatch – fetchContinentNews válasz figyelmen kívül hagyva');
          return [];
        }
        /*
        console.log(
          `[useNewsData] ${data.news?.length || 0} kontinens hír betöltve (${continent}, ${filters.torzsMode ? '24h TÖRZS' : `${filters.maxAgeHours || maxAgeHours}h`}).`,
        );*/
        setHasMoreSources(data.meta?.hasMore || false);
        const items = (data.news || []).map(
          (item: NewsApiItem) =>
            ({
              ...item,
              imageUrl: item.imageUrl || '',
              continent: item.continent || continent,
              country: item.country || country || 'unknown',
            }) as NewsItem,
        );
        setNewsItems(items);
        if (setNewsItemsToken) setNewsItemsToken(currentToken!);
        return items;
      } catch (err) {
        if ((err as Error).name === 'AbortError') {
    //      console.warn('[fetchContinentNews] ⛔ Fetch megszakítva AbortController-rel');
          return [];
        }
   //     console.error(`[useNewsData] Kontinens hír API hiba:`, err);
        throw err;
      }
    },
    [maxAgeHours, abortSignal, requestToken, setNewsItemsToken],
  );

  // ✅ OPTIMALIZÁLT: Egységes törzs logika duplikáció-védelemmel - STABILIZÁLT DEPENDENCIES
  const fetchNews = useCallback(async () => {
    const currentToken = requestToken;
    if (abortSignal?.aborted) {
      return [];
    }
    if (isNewTab || activeTab?.mode === 'search') {
      setNewsItems([]);
      if (setNewsItemsToken) setNewsItemsToken(currentToken!);
      return [];
    }

    // ✅ ÚJ: Ellenőrizzük a cache frissességét a tabId alapján
    const tabCacheIsFresh = await isCacheFresh(activeTabId);
    
    // ✅ JAVÍTÁS: Ország validáció a cache betöltéskor
    const expectedCountry = activeTab?.filters?.country;
    const tabContentFromCache = tabCacheIsFresh ? await getTabContent(activeTabId, expectedCountry) : null;
    
    // ✅ JAVÍTÁS: Ország validáció a cache-ben tárolt adatokra
    if (tabContentFromCache && expectedCountry) {
      const cachedCountry = tabContentFromCache.meta?.country;
      if (cachedCountry && cachedCountry !== expectedCountry) {
        console.log(`[useNewsData] ⚠️ Cache ország mismatch (${cachedCountry} ≠ ${expectedCountry}) – cache invalidálás: ${activeTabId}`);
        // Cache invalidálás és újratöltés kényszerítése
        await invalidateCache(activeTabId);
        // Folytatjuk az API hívással
      } else if (FEATURE_USE_CACHE_FRESHNESS && tabCacheIsFresh && tabContentFromCache?.meta?.originalNews) {
        console.log(`[useNewsData] 🟢 Friss cache használata (${expectedCountry}), API hívás kihagyva: ${activeTabId}`);
        
        // Ha van friss cache és az ország egyezik, beállítjuk az adatokat
        const cachedNewsItems = tabContentFromCache.meta.originalNews;
        // ✅ JAVÍTÁS: Explicit típuskonverzió a hibák elkerülése érdekében
        setNewsItems(cachedNewsItems as NewsItem[]);
        if (setNewsItemsToken) setNewsItemsToken(currentToken!);
        return cachedNewsItems as NewsItem[];
      }
    } else if (FEATURE_USE_CACHE_FRESHNESS && tabCacheIsFresh && tabContentFromCache?.meta?.originalNews && !expectedCountry) {
      // Ha nincs ország megadva, akkor használjuk a cache-t
      console.log(`[useNewsData] 🟢 Friss cache használata (nincs ország szűrő), API hívás kihagyva: ${activeTabId}`);
      
      const cachedNewsItems = tabContentFromCache.meta.originalNews;
      setNewsItems(cachedNewsItems as NewsItem[]);
      if (setNewsItemsToken) setNewsItemsToken(currentToken!);
      return cachedNewsItems as NewsItem[];
    }
    
    // Ha a cache nem elég friss vagy force refresh van, akkor folytatjuk az API hívással
    if (tabCacheIsFresh) {
      console.log(`[useNewsData] 🟠 Cache friss, de API hívás kérve (force refresh): ${activeTabId}`);
    } else {
      console.log(`[useNewsData] ⚪ Nincs friss cache vagy lejárt, API hívás: ${activeTabId}`);
    }

    // ✅ DUPLIKÁCIÓ VÉDELEM: Ha már fut egy kérés
    if (isLoadingRef.current) {
      return [];
    }

    // ✅ KÉRÉS KULCS: Egyedi azonosító - STABILIZÁLT
    const requestKey = JSON.stringify({
      tabId: activeTabId,
      filters: activeTab?.filters,
      maxAgeHours,
      torzsMode: activeTab?.filters?.torzsMode || false,
    });

    // ✅ ISMÉTLŐDŐ KÉRÉS VÉDELEM
    if (lastRequestRef.current === requestKey) {
 //     console.log('[USENEWSDATA-DEBUG] fetchNews azonos kérés, tabId:', activeTabId);
      return [];
    }

    isLoadingRef.current = true;
    lastRequestRef.current = requestKey;
    setLoading(true);
    setError(null);

    try {
      const currentFilters = prepareFilters(
        activeTab?.filters ?? {},
        maxAgeHours,
        activeTab?.filters?.forceRefresh || false
      );
  //    console.log('[USENEWSDATA-DEBUG] fetchNews indítás, tabId:', activeTabId, 'filter:', currentFilters);
/*
      console.log(
        `[useNewsData] ${currentFilters.torzsMode ? '🎯 TÖRZS MÓD' : 'NORMÁL MÓD'}: ${currentFilters.maxAgeHours}h hírek`,
      );
*/
      let fetchedItems: NewsItem[] = [];
      if (currentFilters.continent && typeof currentFilters.continent === 'string') {
        fetchedItems = await fetchContinentNews(
          currentFilters.continent,
          currentFilters.country,
          currentFilters,
        );
      } else {
        fetchedItems = await fetchLocalNews(currentFilters);
      }
      // Token check
      if (requestToken && currentToken !== requestToken) {
  //      console.warn('[useNewsData] 🛑 Token mismatch – fetchNews válasz figyelmen kívül hagyva');
        return [];
      }
      setNewsItems(fetchedItems);
      if (setNewsItemsToken) setNewsItemsToken(currentToken!);
      return fetchedItems;
    } catch (err) {
      if ((err as Error).name === 'AbortError') {
   //     console.log('[useNewsData] Fetch megszakítva (abort)');
        return [];
      }
      setError(t('content.error.generic', 'An error occurred: {{message}}', { message: err instanceof Error ? err.message : 'Unknown error' }));
      return [];
    } finally {
      isLoadingRef.current = false;
      setLoading(false);
    }
  }, [activeTabId, activeTab?.filters, activeTab?.mode, isNewTab, maxAgeHours, abortSignal, requestToken, setNewsItemsToken, isCacheFresh, getTabContent]); // ✅ ÚJ: isCacheFresh és getTabContent hozzáadva

  // --- ÚJ: Memoizált filter hash a dependency array-hez ---
  const filterHash = useMemo(() => JSON.stringify(activeTab?.filters || {}), [activeTab?.filters]);

  // 4. Betöltés indítása vagy kezdeti adatok használata
  useEffect(() => {
    // 1. Ha vannak initial adatok, használd őket és lépj ki.
    if (initialNewsItems && initialNewsItems.length > 0) {
      setNewsItems(initialNewsItems);
      return;
    }

    // 2. Ha új tab vagy keresés módban vagyunk:
    if ((isNewTab || activeTab?.mode === 'search')) {
      if (newsItems.length > 0) setNewsItems([]);
      return;
    }

    // 3. Ha normál tab, nincs initial adat, mindig fetch-eljen, ha tabId vagy filterHash változik!
    if (!isNewTab && activeTab?.mode === 'news' && !initialNewsItems) {
      fetchNews();
    }
  }, [
    initialNewsItems,
    isNewTab,
    activeTabId,
    activeTab?.mode,
    filterHash,
    fetchNews,
    refreshKey,
  ]);

  // 5. "Load more" funkció - egyszerűsített implementáció
  const loadMoreItems = useCallback(async () => {
    if (!hasMoreSources || loading) return;

 //   console.log('[useNewsData] További hírek betöltése próbálása...');

    // Valós alkalmazásban itt egy paginált API hívás lenne
    // Jelenleg csak figyelmeztetünk, hogy valódi implementáció szükséges
 //   console.warn('[useNewsData] loadMoreItems: Valós pagináció implementálása szükséges.');
  }, [hasMoreSources, loading]);

  // 6. ÚJ: Hírek manuális frissítése (a Content.tsx-ben használt refreshNewsData)
  const refreshNewsData = useCallback(
    async (background: boolean = false) => {
 //     console.log(`[useNewsData] Hírek frissítése${background ? ' háttérben' : ''}...`);

      // Ha háttérben frissítünk, nem mutatunk betöltési állapotot
      if (!background) {
        setLoading(true);
      }

      try {
        const currentFilters = prepareFilters(activeTab?.filters ?? {}, maxAgeHours, true);
/*
        console.log(
          `[useNewsData] 🔄 FORCE REFRESH: Cache bypass - ${currentFilters.torzsMode ? '🎯 TÖRZS MÓD' : 'NORMÁL MÓD'}: ${currentFilters.maxAgeHours}h hírek`,
        );
*/
        if (currentFilters.continent && typeof currentFilters.continent === 'string') {
          const freshData = await fetchContinentNews(
            currentFilters.continent,
            currentFilters.country,
            currentFilters,
          );
          setNewsItems(freshData);
          if (setNewsItemsToken) setNewsItemsToken(requestToken!);
   //       console.log(`[useNewsData] ${freshData.length} frissített hír betöltve (FORCE REFRESH)`);
          return freshData;
        } else {
          const freshData = await fetchLocalNews(currentFilters);
          setNewsItems(freshData);
          if (setNewsItemsToken) setNewsItemsToken(requestToken!);
  //        console.log(`[useNewsData] ${freshData.length} frissített hír betöltve (FORCE REFRESH)`);
          return freshData;
        }
      } catch (err) {
   //     console.error('[useNewsData] Hiba a hírek frissítésekor:', err);
        if (!background) {
          setError(t('content.error.refresh', 'Refresh error: {{message}}', { message: err instanceof Error ? err.message : 'Unknown error' }));
        }
        return [];
      } finally {
        if (!background) {
          setLoading(false);
        }
      }
    },
    [activeTab?.filters, maxAgeHours, fetchContinentNews, fetchLocalNews, requestToken, setNewsItemsToken]);

  // ✅ NAPLÓZÁS: minden sikeres hírek-lekérés után
  const lastLoggedFilters = useRef<string>('');
  useEffect(() => {
    if (newsItems.length > 0) {
      const currentFilters = JSON.stringify({
        searchTerm: activeTab?.filters?.searchTerm,
        country: activeTab?.filters?.country,
        continent: activeTab?.filters?.continent,
        source: activeTab?.filters?.source,
      });

      if (lastLoggedFilters.current !== currentFilters) {
        UserHistoryService.logVisit({
          timestamp: Date.now(),
          searchTerm: activeTab?.filters?.searchTerm || activeTab?.filters?.country || activeTab?.filters?.continent || 'unknown',
          country: activeTab?.filters?.country,
          source: activeTab?.filters?.source ? activeTab?.filters?.source.join(',') : undefined,
        });
        lastLoggedFilters.current = currentFilters;
      }
    }
  }, [newsItems, activeTab?.filters]);

  return {
    newsItems,
    loading,
    error,
    handleRetry: () => {
      setError(null);
      setRefreshKey((prev) => prev + 1);
    },
    loadMoreSources: loadMoreItems,
    hasMoreSources,
    setNewsItems,
    refreshNewsData, // ÚJ: Az újonnan implementált metódus exportálása
  };
}
