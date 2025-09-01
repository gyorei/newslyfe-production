/*
A szoftver-fejlesztésben fontos alapelv 
a YAGNI (You Aren't Gonna Need It) 
- ne vezess be komplexitást
, amíg nincs rá valódi igény.
src\components\Side\Search\Search.tsx
*/

import * as React from 'react';
import { useState, useCallback } from 'react';
import styles from './Search.module.css';
import { useSearch } from './useSearch';
import SearchResults from './SearchResults';

interface SearchProps {
  onSearchTabOpen?: (searchTerm: string) => void;
  onVideoTabOpen?: () => void;
}

export const Search: React.FC<SearchProps> = ({ onSearchTabOpen, onVideoTabOpen = () => {} }) => {
  const { searchTerm, setSearchTerm, results, total, loading, error, page, setPage, limit } =
    useSearch();

  const [isExpanded, setExpanded] = useState(false);

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newSearchTerm = event.target.value;
    setSearchTerm(newSearchTerm);
    if (newSearchTerm.trim() !== '') {
      setExpanded(true);
    } else {
      setExpanded(false);
    }
  };

  const handleSearchSubmit = (event?: React.FormEvent<HTMLFormElement>) => {
    if (event) {
      event.preventDefault();
    }
    if (searchTerm.trim()) {
      setExpanded(true);
    }
  };

  const handleClearSearch = () => {
    setSearchTerm('');
    setExpanded(false);
  };

  const handleOpenDetailedView = useCallback(() => {
    if (searchTerm.trim() && onSearchTabOpen) {
      onSearchTabOpen(searchTerm.trim());
      setExpanded(false);
    }
  }, [searchTerm, onSearchTabOpen]);

  return (
    <div className={styles.searchContainer}>
      <form onSubmit={handleSearchSubmit} className={styles.searchForm}>
       
    
        <input
          type="text"
          placeholder="Search..."
          value={searchTerm}
          onChange={handleSearchChange}
          className={styles.searchInput}
          onFocus={() => {
            if (searchTerm.trim() || results.length > 0) {
              setExpanded(true);
            }
          }}
        />
        {searchTerm && (
          <button
            type="button"
            onClick={handleClearSearch}
            className={styles.clearSearch}
            title="Clear search"
          >
            ✕
          </button>
        )}
        <button type="submit" className={styles.searchButton} title="Search">
          🔍
        </button>
      </form>

      {/*
      <button
        type="button"
        onClick={onVideoTabOpen}
        className={styles.videoTabButton}
        title="Open Video News"
        style={{
          marginTop: '8px',
          width: '100%',
          padding: '8px 12px',
          backgroundColor: '#ff0000',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          cursor: 'pointer',
          fontSize: '14px',
          fontWeight: 'bold',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '8px'
        }}
      >
        🎥 Video News
      </button>
*/}

      {isExpanded && (
        <div className={styles.searchResultsDropdown}>
          {loading && <div className={styles.loading}>Searching...</div>}
          {error && <div className={styles.error}>Error: {error}</div>}
          {!loading && !error && results.length > 0 && (
            <SearchResults
              results={results}
              total={total}
              page={page}
              setPage={setPage}
              limit={limit}
              onOpenDetailedView={handleOpenDetailedView}
            />
          )}
          {!loading && !error && results.length === 0 && searchTerm.trim() !== '' && (
            <div className={styles.noResults}>No results found.</div>
          )}
        </div>
      )}

      


    </div>
  );
};
