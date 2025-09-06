// src/components/Utility/Settings/SearchFilters/SearchFilters.tsx
/**
 * A keresési eredményekhez tartozó szűrőpanelt jeleníti meg.
 * Feliratkozik a keresési eredmények meta-adataira (pl. országlista),
 * és a kapott opciók alapján felépíti a szűrőgombokat.
 * Kezeli a szűrők alaphelyzetbe állítását egy új keresésnél,
 * és továbbítja a felhasználói szűrő-változtatásokat a rendszer többi részének.
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import styles from './SearchFilters.module.css';
import { useSearchFilters } from '../../../../hooks/useSearchFilters';
import { CountryTagFilter, CountryTagOption } from './CountryFilter/CountryTagFilter';
import { searchResultsMetadataBridge } from './SearchResultsMetadataBridge';

interface SearchFiltersProps {
  activeTabId: string;
}

export const SearchFilters: React.FC<SearchFiltersProps> = ({ activeTabId }) => {
  const { t } = useTranslation();
  const { filters, updateFilters } = useSearchFilters();
  const [countryOptions, setCountryOptions] = useState<CountryTagOption[]>([]);
  const [allAvailableCountries, setAllAvailableCountries] = useState<CountryTagOption[]>([]); // ÚJ: minden elérhető ország
  const [isLoading, setIsLoading] = useState(true);

  // Ref az "első betöltés" követésére fülönként
  const initialFilterSetRef = useRef<Set<string>>(new Set());
  
  // Memoizáljuk az updateOptions függvényt a felesleges újrarenderelések elkerülésére
  const updateOptions = useCallback((options: CountryTagOption[]) => {
    console.log('[SearchFilters] updateOptions hívva, opciók:', options); // Debug: nézd meg, mi érkezik

    setCountryOptions(options);
    setAllAvailableCountries(options); // Mindig frissítjük

    const alreadyInitialized = initialFilterSetRef.current.has(activeTabId);
    
    if (!alreadyInitialized && options.length > 0) {
      const allCountryCodes = options.map(opt => opt.code);
      updateFilters({ countries: allCountryCodes }); // Kényszerített Select All, ha van opció
      console.log('[SearchFilters] Automatikus Select All inicializálás:', allCountryCodes);
      initialFilterSetRef.current.add(activeTabId);
      setIsLoading(false);
    } else if (!alreadyInitialized && options.length === 0) {
      console.log('[SearchFilters] Nincs elérhető ország, üres szűrő marad');
      setIsLoading(false);
    }
  }, [activeTabId, updateFilters]);

  // Memoizáljuk az onChange handlert a CountryTagFilter komponens számára
  const handleCountryChange = useCallback((countries: string[]) => {
    updateFilters({ countries });
  }, [updateFilters]);

  useEffect(() => {
    console.log('[SearchFilters] useEffect indítás, tab:', activeTabId);

    if (!initialFilterSetRef.current.has(activeTabId)) {
      setIsLoading(true);
      setCountryOptions([]);
    }

    const existingMetadata = searchResultsMetadataBridge.getMetadataForTab(activeTabId);
    console.log('[SearchFilters] Meglévő metaadatok:', existingMetadata);

    if (existingMetadata?.countries && existingMetadata.countries.length > 0) {
      updateOptions(existingMetadata.countries);
    } else {
      console.log('[SearchFilters] Üres metaadatok, várakozás frissítésre');
    }

    const unsubscribe = searchResultsMetadataBridge.subscribe((metadata, tabId) => {
      if (tabId === activeTabId) {
        console.log('[SearchFilters] Új metaadatok érkeztek:', metadata);
        if (metadata.countries && metadata.countries.length > 0) {
          updateOptions(metadata.countries);
        } else {
          // Ha üres, de van sourceItems a TabPanel-ben, esetleg fallback
          console.warn('[SearchFilters] Metaadatok üres országokkal, inicializálás kihagyva');
        }
      }
    });

    return () => unsubscribe();
  }, [activeTabId, updateOptions]);

  // Loading állapot javítása - csak akkor loading ha tényleg új fül és nincs még adat
  const isCurrentlyLoading = isLoading && !initialFilterSetRef.current.has(activeTabId);

  return (
   
<div className={styles.container}>
  <h2>{t('searchFilters.title')}</h2>
  <div className={styles.filterButtons}>
    <button
      className={styles.filterButton}
      onClick={() => {
        updateFilters({ countries: [] });
        console.log('[SearchFilters] Deselect All kattintva, countries: []');
      }}
    >
      {t('searchFilters.deselectAll')}
    </button>
    <button
      className={styles.filterButton}
      onClick={() => {
        const allCodes = allAvailableCountries.map(opt => opt.code);
        updateFilters({ countries: allCodes });
        console.log('[SearchFilters] Select All kattintva, countries:', allCodes);
      }}
    >
      {t('searchFilters.selectAll')}
    </button>



      </div>
      
      {/* Debug információ fejlesztési módban  <--- ezt ne vedd ki!!!
      {process.env.NODE_ENV === 'development' && (
        <div style={{ fontSize: '12px', color: '#666', marginBottom: '8px' }}>
          Aktív fül: {activeTabId} | Inicializált fülök: {Array.from(initialFilterSetRef.current).join(', ')}
        </div>
      )}
      */}
      <CountryTagFilter 
        options={countryOptions} 
     //   selectedOptions={filters.countries} 
     selectedOptions={filters.countries || []}
        onChange={handleCountryChange}
        isLoading={isCurrentlyLoading}
      />
    </div>
  );
};

