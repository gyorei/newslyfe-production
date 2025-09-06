import React from 'react';
import { useTranslation } from 'react-i18next';
import { useSearch } from '../../Side/Search/useSearch';
import SearchResults from '../../Side/Search/SearchResults';
import styles from './SearchTab.module.css';

export interface SearchTabProps {
  isActive: boolean;
  searchTerm: string;
}

const SearchTab: React.FC<SearchTabProps> = ({ isActive, searchTerm, ...rest }) => {
  // ✅ HOOK-OK MINDIG A TETEJÉN!
  const { t } = useTranslation();
  const { results, total, loading, error, page, setPage, performSearch } = useSearch();

  React.useEffect(() => {
    if (searchTerm && isActive) {
      performSearch(searchTerm);
    }
  }, [searchTerm, performSearch, isActive]);

  // ✅ CONDITIONAL RENDERING A HOOK-OK UTÁN
  if (!isActive) return null;

  return (
    <div className={styles.searchTab}>
      <div className={styles.searchHeader}>
        <h2>
          {t('searchTab.resultsTitle')}: <span className={styles.searchQuery}>&quot;{searchTerm}&quot;</span>
        </h2>
        <div className={styles.searchInfo}>{t('searchTab.totalResults', { count: total })}</div>
      </div>

      {loading && <div className={styles.loading}>{t('searchTab.searching')}</div>}
      {error && <div className={styles.error}>{error}</div>}

      {!loading && !error && results.length > 0 ? (
        <div className={styles.resultsContainer}>
          <SearchResults
            results={results}
            total={total}
            page={page}
            limit={10}
            setPage={setPage}
            onOpenDetailedView={() => console.log(t('searchTab.openDetailedView'))}
          />
        </div>
      ) : !loading && !error ? (
        <div className={styles.noResults}>{t('searchTab.noResults')}</div>
      ) : null}
    </div>
  );
};

const MemoizedSearchTab = React.memo(SearchTab);
export default MemoizedSearchTab;
