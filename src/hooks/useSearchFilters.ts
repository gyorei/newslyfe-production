// src/hooks/useSearchFilters.ts
import { useSearchParams } from 'react-router-dom';
import { useMemo, useCallback, useEffect } from 'react';
import { searchFiltersBridge } from '../components/Utility/Settings/SearchFilters/SearchFiltersBridge';

// ✅ JAVÍTÁS: A countries mező lehet undefined is
export interface SearchFilters {
  lang: string;
  countries: string[] | undefined; // ← undefined érték is engedélyezve
}

export function useSearchFilters() {
  const [searchParams, setSearchParams] = useSearchParams();

  // 1. OLVASÁS: Az állapotot mindig közvetlenül az URL-ből olvassuk.
  const filters = useMemo((): SearchFilters => {
    const lang = searchParams.get('lang') || 'all';
    const countriesParam = searchParams.get('countries');
    // ✅ JAVÍTÁS: Ha nincs URL paraméter, akkor undefined, de ha explicit üres, akkor []
    const countries = countriesParam === null ? undefined : 
                     countriesParam === '' ? [] : 
                     countriesParam.split(',');
    return { lang, countries };
  }, [searchParams]);

  // --- PUB/SUB: Szűrőállapot közvetítése a bridge-en keresztül ---
  useEffect(() => {
    // Aktív országkódok logolása
    console.log('[Országszűrés] Aktív országkódok:', filters.countries);
    // ÚJ: logold ki az URL-t is
    console.log('[Országszűrés] URL:', window.location.href);
    // ✅ JAVÍTÁS: Az új API használata
    searchFiltersBridge.emitFilterChange(filters);
  }, [filters]);

  // 2. ÍRÁS: Egyetlen, intelligens függvény a szűrők frissítésére.
  const updateFilters = useCallback((newValues: Partial<SearchFilters>) => {
    const newSearchParams = new URLSearchParams(searchParams);
    Object.entries(newValues).forEach(([key, value]) => {
      if (key === 'lang') {
        if (value && value !== 'all') {
          newSearchParams.set('lang', value as string);
        } else {
          newSearchParams.delete('lang');
        }
      }
      if (key === 'countries') {
        // ✅ JAVÍTÁS: Üres tömb esetén explicit üres string tárolása
        if (Array.isArray(value)) {
          if (value.length > 0) {
            newSearchParams.set('countries', value.join(','));
          } else {
            // Deselect All esetén üres stringet tárolunk az URL-ben
            newSearchParams.set('countries', '');
          }
        } else if (value === undefined) {
          newSearchParams.delete('countries');
        }
      }
    });
    setSearchParams(newSearchParams);
  }, [searchParams, setSearchParams]);

  // 3. RESET FUNKCIÓ: Egyszerűen törli a releváns paramétereket.
  const resetFilters = useCallback(() => {
    const newSearchParams = new URLSearchParams(searchParams);
    newSearchParams.delete('lang');
    newSearchParams.delete('countries');
    setSearchParams(newSearchParams);
  }, [searchParams, setSearchParams]);

  return {
    filters,        // Az aktuális szűrők objektuma
    updateFilters,  // A szűrők frissítésére szolgáló függvény
    resetFilters,   // A szűrők törlésére szolgáló függvény
  };
}