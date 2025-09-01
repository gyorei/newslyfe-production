
// jó verzió
import React, { useState, useEffect, useRef } from 'react';
import styles from './SearchFilters.module.css';
import { useSearchFilters } from '../../../../hooks/useSearchFilters';
import { CountryTagFilter, CountryTagOption } from './CountryFilter/CountryTagFilter';
import { searchResultsMetadataBridge } from './SearchResultsMetadataBridge';

interface SearchFiltersProps {
  activeTabId: string;
}

export const SearchFilters: React.FC<SearchFiltersProps> = ({ activeTabId }) => {
  const { filters, updateFilters } = useSearchFilters();
  const [countryOptions, setCountryOptions] = useState<CountryTagOption[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Ref az "első betöltés" követésére fülönként
const initialFilterSetRef = useRef<Set<string>>(new Set());

useEffect(() => {
  // Csak egyszer inicializáljuk a countryOptions-t tabonként!
  let alreadyInitialized = initialFilterSetRef.current.has(activeTabId);

  const updateOptions = (options: CountryTagOption[]) => {
    if (!alreadyInitialized && options.length > 0) {
      setCountryOptions(options);
      // Alaphelyzetbe állítás: csak egyszer tabonként
      const allCountryCodes = options.map(opt => opt.code);
      updateFilters({ countries: allCountryCodes });
      initialFilterSetRef.current.add(activeTabId);
      setIsLoading(false);
      alreadyInitialized = true;
    }
  };

  // 1. Meglévő metaadat betöltése
  const existingMetadata = searchResultsMetadataBridge.getMetadataForTab(activeTabId);
  if (existingMetadata?.countries) {
    updateOptions(existingMetadata.countries);
  } else if (!alreadyInitialized) {
    setCountryOptions([]);
    setIsLoading(true);
  }

  // 2. Feliratkozás a friss metaadatokra
  const unsubscribe = searchResultsMetadataBridge.subscribe((metadata, tabId) => {
    if (tabId === activeTabId && metadata.countries) {
      updateOptions(metadata.countries);
    }
  });

  return () => {
    unsubscribe();
  };
}, [activeTabId, updateFilters]);

 return (
    <div className={styles.container}>
      <h2>Filter by country</h2>
      {/*
      {process.env.NODE_ENV === 'development' && (
        <div style={{ fontSize: '12px', color: '#666', marginBottom: '8px' }}>
          Aktív fül: {activeTabId}
        </div>
      )}
      */}
      <CountryTagFilter
        options={countryOptions}
        selectedOptions={filters.countries}
        onChange={(countries) => updateFilters({ countries })}
        isLoading={isLoading}
      />
    </div>
  );
};
