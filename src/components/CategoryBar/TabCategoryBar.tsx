/**
 * TabCategoryBar komponens
 */

import * as React from 'react';
import { useRef, useEffect } from 'react';
import styles from './TabCategoryBar.module.css';
import { useCategoryContext } from './CategoryContext';
import { useUI } from '../../contexts/UIContext'; // ÚJ: UI Context importálása

// A Side panel kategória komponensével megegyező interface
interface TabCategoryBarProps {
  categories?: string[]; // Opcionális, mivel a kontextusból is jöhet
  categoryCounts?: Record<string, number>; // Kategóriánkénti hírek száma
  onCategorySelect?: (category: string | null) => void; // Kategória kiválasztás callback
  selectedCategory?: string | null; // Aktuálisan kiválasztott kategória
}

const TabCategoryBar: React.FC<TabCategoryBarProps> = ({
  categories: propCategories,
  categoryCounts: propCategoryCounts,
  onCategorySelect,
  selectedCategory: propSelectedCategory,
}) => {
  const { uiState } = useUI(); // ÚJ: UI állapot használata

  // Kategória kontextus használata
  const {
    categories: contextCategories,
    selectedCategory,
    setSelectedCategory,
    categoryCounts: contextCategoryCounts,
  } = useCategoryContext();

  // Használandó kategóriák (props vagy kontextus)
  const categories = propCategories || contextCategories;
  const categoryCounts = propCategoryCounts || contextCategoryCounts;

  // 🔍 DEBUG: Kategória adatok logolása
  useEffect(() => {
    console.log('📊 [TabCategoryBar] Kategória adatok frissültek:', {
      propCategories,
      contextCategories,
      finalCategories: categories,
      propCategoryCounts,
      contextCategoryCounts,
      finalCategoryCounts: categoryCounts,
      selectedCategory,
    });
  }, [
    categories,
    categoryCounts,
    selectedCategory,
    propCategories,
    contextCategories,
    propCategoryCounts,
    contextCategoryCounts,
  ]);

  // ELTÁVOLÍTVA: Láthatóság kezelése (összecsukás/kinyitás)
  // const [isVisible, setIsVisible] = useState<boolean>(true);

  // Görgetés referenciák és állapot - MEGTARTVA A REFERENCIÁKAT, DE A GOMBOKAT ELTÁVOLÍTJUK
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const categoryListRef = useRef<HTMLDivElement>(null);

  // ELTÁVOLÍTVA: Görgetőgombok állapotváltozói
  // const [showLeftScroll, setShowLeftScroll] = useState<boolean>(false);
  // const [showRightScroll, setShowRightScroll] = useState<boolean>(false);

  // Props-ból jövő kiválasztott kategória szinkronizálása a kontextussal
  useEffect(() => {
    if (propSelectedCategory !== undefined && propSelectedCategory !== selectedCategory) {
      console.log('🔄 [TabCategoryBar] Kategória szinkronizáció:', {
        propSelectedCategory,
        currentSelectedCategory: selectedCategory,
      });
      setSelectedCategory(propSelectedCategory);
    }
  }, [propSelectedCategory, selectedCategory, setSelectedCategory]);

  // ELTÁVOLÍTVA: Görgetési állapot figyelése
  // useEffect(() => {
  //   const checkScroll = () => {...};
  //   ...
  // }, [categories]);

  // Helyi állapot megszüntetése, helyette a kontextus használata
  const handleCategoryClick = (category: string) => {
    // Toggle: ha már aktív, akkor kikapcsol
    const newCategory = category === selectedCategory ? null : category;

    console.log('🎯 [TabCategoryBar] Kategória kattintás:', {
      clickedCategory: category,
      previousCategory: selectedCategory,
      newCategory,
    });

    setSelectedCategory(newCategory);

    // Callback a szülő komponens felé (ha van)
    if (onCategorySelect) {
      onCategorySelect(newCategory);
    }
  };

  // ELTÁVOLÍTVA: Görgetés kezelése
  // const scrollLeft = () => {...};
  // const scrollRight = () => {...};

  // ÚJ: Ha a kategória sáv ki van kapcsolva, ne jelenjen meg
  if (!uiState.showCategoryBar) {
    return null;
  }

  return (
    <div
      className={styles.categoryBarContainer}
      style={{
        display: 'flex',
        maxHeight: '100px',
        opacity: 1,
        visibility: 'visible',
        overflow: 'visible',
        border: '1px solid red', // Ideiglenesen egy piros keret a könnyebb azonosításhoz
      }}
    >
      <div className={styles.categoryScrollContainer} ref={scrollContainerRef}>
        {/* ELTÁVOLÍTVA: Bal görgetőgomb */}
        {/* {showLeftScroll && (
          <button
            className={`${styles.scrollButton} ${styles.scrollLeft}`}
            onClick={scrollLeft}
            aria-label="Bal görgetés"
          >
            <span>&lt;</span>
          </button>
        )} */}

        <div className={styles.categoryList} ref={categoryListRef}>
          {categories.map((category) => (
            <button
              key={category}
              className={`${styles.categoryChip} ${selectedCategory === category ? styles.active : ''}`}
              onClick={() => handleCategoryClick(category)}
            >
              {category}
              {categoryCounts[category] !== undefined && (
                <span className={styles.categoryCount}>{categoryCounts[category]}</span>
              )}
            </button>
          ))}
        </div>

        {/* ELTÁVOLÍTVA: Jobb görgetőgomb */}
        {/* {showRightScroll && (
          <button
            className={`${styles.scrollButton} ${styles.scrollRight}`}
            onClick={scrollRight}
            aria-label="Jobb görgetés"
          >
            <span>&gt;</span>
          </button>
        )} */}
      </div>
    </div>
  );
};

export default TabCategoryBar;
