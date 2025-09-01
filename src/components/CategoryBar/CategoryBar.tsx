/**
 * CategoryBar komponens
 *
 * A Side panelben használható kategóriaválasztó komponens
 * - Kategóriák listázása
 * - Kategória kiválasztása
 * - Teljes szinkronizáció a TabCategoryBar komponenssel
 */

import * as React from 'react';
// useEffect import eltávolítva, mivel nincs használatban
import styles from './CategoryBar.module.css';
import { useCategoryContext } from './CategoryContext';

export interface CategoryBarProps {
  // Legacy compatibility props
  selectedCategory?: string | null;
  onCategorySelect?: (category: string | null) => void;
  categoryCounts?: Record<string, number>;
}

export const CategoryBar: React.FC<CategoryBarProps> = ({
  selectedCategory: propSelectedCategory,
  onCategorySelect,
  categoryCounts: propCategoryCounts,
}) => {
  // Kategória kontextus használata
  const {
    selectedCategory: contextSelectedCategory,
    categories,
    setSelectedCategory,
    categoryCounts: contextCategoryCounts,
  } = useCategoryContext();

  // Használandó értékek - elsőbbséget adunk a prop értékeknek a visszafele kompatibilitás miatt
  const selectedCategory =
    propSelectedCategory !== undefined ? propSelectedCategory : contextSelectedCategory;
  const categoryCounts = propCategoryCounts || contextCategoryCounts;

  // Kategória kiválasztása
  const handleCategorySelect = (category: string) => {
    const newCategory = category === selectedCategory ? null : category;

    // Context frissítés
    setSelectedCategory(newCategory);

    // Legacy callback hívása, ha van
    if (onCategorySelect) {
      onCategorySelect(newCategory);
    }
  };

  // Összes találat számítása
  const totalCount = Object.values(categoryCounts || {}).reduce((sum, count) => sum + count, 0);

  return (
    <div className={styles.categoryBar}>
      <h3 className={styles.categoryTitle}>Kategóriák</h3>
      <ul className={styles.categoryList}>
        {/* "All" opció */}
        <li
          className={`${styles.categoryItem} ${selectedCategory === null ? styles.active : ''}`}
          onClick={() => handleCategorySelect('')}
        >
          Összes
          {totalCount > 0 && <span className={styles.categoryCount}>{totalCount}</span>}
        </li>

        {/* Kategória lista */}
        {categories.map((category) => (
          <li
            key={category}
            className={`${styles.categoryItem} ${selectedCategory === category ? styles.active : ''}`}
            onClick={() => handleCategorySelect(category)}
          >
            {category}
            {categoryCounts && categoryCounts[category] > 0 && (
              <span className={styles.categoryCount}>{categoryCounts[category]}</span>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
};
