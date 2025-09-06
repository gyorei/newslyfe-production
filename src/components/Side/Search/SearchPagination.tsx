// src/components/Side/Search/SearchPagination.tsx
import { FC } from 'react';
import { useTranslation } from 'react-i18next';
import styles from './Search.module.css';

interface SearchPaginationProps {
  total: number;
  page: number;
  limit: number;
  onPageChange: (page: number) => void;
}

const SearchPagination: FC<SearchPaginationProps> = ({ total, page, limit, onPageChange }) => {
  const { t } = useTranslation();
  const totalPages = Math.ceil(total / limit);

  if (totalPages <= 1) return null;

  const renderPageNumbers = () => {
    const pages = [];
    const maxVisiblePages = 5;

    let startPage = Math.max(1, page - Math.floor(maxVisiblePages / 2));
    const endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);

    if (endPage - startPage + 1 < maxVisiblePages) {
      startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }

    // Első oldal
    if (startPage > 1) {
      pages.push(
        <button key="1" onClick={() => onPageChange(1)}>
          1
        </button>,
      );
      if (startPage > 2) {
        pages.push(<span key="ellipsis1">...</span>);
      }
    }

    // Középső oldalak
    for (let i = startPage; i <= endPage; i++) {
      pages.push(
        <button
          key={i}
          className={i === page ? styles.activePage : ''}
          onClick={() => onPageChange(i)}
        >
          {i}
        </button>,
      );
    }

    // Utolsó oldal
    if (endPage < totalPages) {
      if (endPage < totalPages - 1) {
        pages.push(<span key="ellipsis2">...</span>);
      }
      pages.push(
        <button key={totalPages} onClick={() => onPageChange(totalPages)}>
          {totalPages}
        </button>,
      );
    }

    return pages;
  };

  return (
    <div className={styles.pagination}>
      <button
        disabled={page === 1}
        onClick={() => onPageChange(page - 1)}
        className={styles.paginationArrow}
      >
&laquo; {t('pagination.previous')}
      </button>

      <div className={styles.pageNumbers}>{renderPageNumbers()}</div>

      <button
        disabled={page === totalPages}
        onClick={() => onPageChange(page + 1)}
        className={styles.paginationArrow}
      >
{t('pagination.next')} &raquo;
      </button>
    </div>
  );
};

export default SearchPagination;
