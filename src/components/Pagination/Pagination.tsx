// src\components\Pagination\Pagination.tsx
/*
 
---

## **1. Pagination működésének áttekintése a kódban**

### **A. PaginationStorage.ts**
- Csak az aktuális oldal és itemsPerPage értékét menti/tölti localStorage-ból.
- **NEM tartalmaz scroll logikát!**
- Ez csak az oldalváltás állapotát tárolja, nem a görgetést kezeli.

---

### **B. useAppTabs.md**
- Tabok állapotát, aktív tabot, stb. kezeli.
- Pagination-hez kapcsolódóan csak a tab zárásakor törli a PaginationStorage-t.
- **Nincs scroll vagy oldalváltás utáni scroll reset logika.**

---

### **C. useTabStorage.ts**
- Tab tartalom, cache, pagination állapot mentése/betöltése.
- Van benne:  
  - `savePaginationState`, `loadPaginationState`, `clearPaginationState` – ezek a PaginationStorage-t használják.
- **Scroll pozíció mentését nem végzi, csak a pagination állapotot.**
- **Nincs scroll reset oldalváltáskor!**

---

### **D. TabController.tsx**
- A tab tartalmat rendereli, a Panel-t vagy VideoPanel-t, vagy SearchTab-ot.
- A Panel-nek átad egy `onPaginationChange` callback-et.
- **A scroll reset logika nem itt van, hanem a Panel/Content/ScrollContainer-ben kell keresni.**

---

### **E. Panel.tsx**
- Itt van a Pagination komponens meghívása.
- A `handlePageChange` függvény:
  - Állítja a `currentPage`-t.
  - Ment a PaginationStorage-ba.
  - Meghívja az `onPaginationChange(true)` callback-et, ha van ilyen.
- **A scroll resetet NEM itt végzi, hanem csak jelez a szülőnek (Content-nek), hogy oldalváltás történt.**

---

### **F. Content.tsx**
- Itt van a `handlePaginationChange` callback, amit a Panel-nek ad át.
- Ez a callback:
  - Ha `shouldScrollToTop` igaz, akkor növeli a `paginationTrigger` state-et.
- A `ScrollContainer`-nek átadja a `resetScrollTrigger` propot, ami a `paginationTrigger` értéke.
- **A tényleges scroll reset a ScrollContainer-ben történik, amikor a `resetScrollTrigger` változik.**

---

### **G. scrollManager.ts**
- Általános scroll kezelő utility.
- Van benne `performScroll`, ami különböző DOM elemekre próbál scrollozni.
- **Ez egy utility, de a ScrollContainer-ben kell meghívni oldalváltáskor.**

---

*/




import * as React from 'react';
import styles from './Pagination.module.css';
import { useTranslation } from 'react-i18next';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  displayRange?: number;
}

/**
 * Pagination komponens
 *src\components\Pagination\Pagination.tsx
 * Az oldalszámozás megjelenítéséért felelős komponens.
 * Lehetővé teszi a felhasználónak a lapozást.
 */
export const Pagination: React.FC<PaginationProps> = ({
  currentPage,
  totalPages,
  onPageChange,
  displayRange = 1,
}) => {
  // Oldalszámok létrehozása
  const getPageNumbers = () => {
    // Ha kevés oldal van, mindent megjelenítünk
    if (totalPages <= 5) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }

    // Különben csak a kiválasztott oldal környékét mutatjuk
    const startPage = Math.max(1, currentPage - displayRange);
    const endPage = Math.min(totalPages, currentPage + displayRange);

    const pages: (number | string)[] = [];

    // Első oldal mindig látszik
    if (startPage > 1) {
      pages.push(1);
      // Három pont, ha nem folytonos az átmenet
      if (startPage > 2) {
        pages.push('...');
      }
    }

    // Oldalszámok a kiválasztott oldal környékén
    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }

    // Utolsó oldal mindig látszik
    if (endPage < totalPages) {
      // Három pont, ha nem folytonos az átmenet
      if (endPage < totalPages - 1) {
        pages.push('...');
      }
      pages.push(totalPages);
    }

    return pages;
  };

  const pageNumbers = getPageNumbers();

  const { t } = useTranslation();

  // Előző oldal kezelése
  const handlePrevClick = (e: React.MouseEvent) => {
    e.stopPropagation(); // Megállítjuk az esemény terjedését
    if (currentPage > 1) {
      onPageChange(currentPage - 1);
    }
  };

  // Következő oldal kezelése
  const handleNextClick = (e: React.MouseEvent) => {
    e.stopPropagation(); // Megállítjuk az esemény terjedését
    if (currentPage < totalPages) {
      onPageChange(currentPage + 1);
    }
  };

  return (
    <nav className={styles.pagination}>
      {/* Előző oldal gomb */}
      <button
        className={`${styles.pageButton} ${styles.navButton}`}
        onClick={handlePrevClick}
        disabled={currentPage === 1}
        aria-label={t('pagination.prev')}
      >
        &#8592;
      </button>

      {/* Oldalszámok */}
      {pageNumbers.map((page, index) => {
        if (typeof page === 'number') {
          return (
            <button
              key={`page-${page}`}
              className={`${styles.pageButton} ${page === currentPage ? styles.active : ''}`}
              onClick={(e) => {
                e.stopPropagation(); // Minden gombra alkalmazzuk a stopPropagation
                onPageChange(page);
              }}
              aria-label={t('pagination.page', { page })}
              aria-current={page === currentPage ? 'page' : undefined}
            >
              {page}
            </button>
          );
        } else {
          return (
            <span key={`ellipsis-${index}`} className={styles.ellipsisText}>
              ...
            </span>
          );
        }
      })}

      {/* Következő oldal gomb */}
      <button
        className={`${styles.pageButton} ${styles.navButton}`}
        onClick={handleNextClick}
        disabled={currentPage === totalPages}
        aria-label={t('pagination.next')}
      >
        &#8594;
      </button>
    </nav>
  );
};

export default Pagination;
