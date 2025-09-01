import React from 'react';
import { useSearch } from '../../Side/Search/useSearch';
import SearchResults from '../../Side/Search/SearchResults';
import styles from './SearchTab.module.css';

export interface SearchTabProps {
  isActive: boolean;
  searchTerm: string;
}

const SearchTab: React.FC<SearchTabProps> = ({ isActive, searchTerm, ...rest }) => {
  if (!isActive) return null;
  const { results, total, loading, error, page, setPage, performSearch } = useSearch();

  React.useEffect(() => {
    if (searchTerm) {
      performSearch(searchTerm);
    }
  }, [searchTerm, performSearch]);

  return (
    <div className={styles.searchTab}>
      <div className={styles.searchHeader}>
        <h2>
          Keresési eredmények: <span className={styles.searchQuery}>&quot;{searchTerm}&quot;</span>
        </h2>
        <div className={styles.searchInfo}>Összesen: {total} találat</div>
      </div>

      {loading && <div className={styles.loading}>Keresés folyamatban...</div>}
      {error && <div className={styles.error}>{error}</div>}

      {!loading && !error && results.length > 0 ? (
        <div className={styles.resultsContainer}>
          <SearchResults
            results={results}
            total={total}
            page={page}
            limit={10}
            setPage={setPage}
            onOpenDetailedView={() => console.log('Részletes nézet megnyitása')}
          />
        </div>
      ) : !loading && !error ? (
        <div className={styles.noResults}>Nincs találat a keresésre.</div>
      ) : null}
    </div>
  );
};

const MemoizedSearchTab = React.memo(SearchTab);
export default MemoizedSearchTab;
