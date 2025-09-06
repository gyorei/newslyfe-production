// src/components/Side/Search/SearchResults.tsx
import * as React from 'react';
import { useTranslation } from 'react-i18next';
import styles from './Search.module.css';
import sideStyles from '../Side.module.css';
import SearchResultItem from './SearchResultItem'; // ÚJ IMPORT
import SearchPagination from './SearchPagination'; // ÚJ IMPORT

// A SearchResult interfésznek összhangban kell lennie a useSearch hook által visszaadott objektummal
// és a SearchResultItem által elvárt objektummal.
interface SearchResultFromHook {
  id: number; // Típus javítva string-ről number-re
  title: string;
  url: string;
  created_at: string;
  language: string;
  // Egyéb mezők, amelyeket a useSearch hook visszaadhat és a SearchResultItem felhasználhat
  source?: string;
  description?: string; // SearchResultItem használhatja, ha van
  imageUrl?: string; // SearchResultItem használhatja, ha van
  country?: string;
}

interface SearchResultsProps {
  results: SearchResultFromHook[];
  total: number;
  page: number;
  limit: number;
  setPage: (page: number) => void;
  onOpenDetailedView?: () => void;
}

const SearchResults: React.FC<SearchResultsProps> = ({
  results,
  total,
  page,
  limit,
  setPage,
  onOpenDetailedView,
}) => {
  const { t } = useTranslation();
  return (
    <div>
      {/* Keresési találatok száma és Részletes nézet gomb */}
      <div className={styles.resultsHeader}>
        <span>{t('search.resultsCount', { count: total })}</span>
        {onOpenDetailedView && (
          <button
            className={styles.detailedSearchButton}
            onClick={onOpenDetailedView}
            title={t('search.openDetailedView')}
          >
            {t('search.detailedView')}
          </button>
        )}
      </div>

      {/* Keresési találatok listája - görgethető */}
      {results.length > 0 && (
        <ul className={`${styles.resultsList} ${sideStyles.scrollable}`}>
          {results.map((result) => (
            <SearchResultItem key={result.id} result={result} />
          ))}
        </ul>
      )}

      {/* Lapozó */}
      {total > 0 && (
        <SearchPagination total={total} page={page} limit={limit} onPageChange={setPage} />
      )}
    </div>
  );
};

export default SearchResults;
