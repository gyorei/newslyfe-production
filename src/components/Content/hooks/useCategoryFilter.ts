// Future Category Filtering enhancements:
// - Fetch selectedCategory from CategoryContext and useCategoryData hook
// - Filter newsItems by selectedCategory using:
//     • item.categories array
//     • item.category property
//     • full-text search on title/description
// - Memoize filtered results for performance
// - Update filter reactively when newsItems or selectedCategory changes
// - Integrate with CategoryBar UI and CategoryProvider context

import { useMemo } from 'react';
import { NewsItem } from '../../../types';
import { useCategoryContext, useCategoryData } from '../../CategoryBar';

interface UseCategoryFilterProps {
  newsItems: NewsItem[]; // A szűretlen hírek listája
  activeTabId: string; // Az aktív tab azonosítója a useCategoryData hívásához
}

/**
 * Hook a hírek kategória szerinti szűrésére
 *
 * Felelősségei:
 * 1. Lekéri a kiválasztott kategóriát a CategoryContext-ből
 * 2. Meghívja a useCategoryData hookot a kategóriák feldolgozásához
 * 3. Szűri a híreket a kiválasztott kategória alapján
 * 4. Visszaadja a szűrt hírlistát
 */

export function useCategoryFilter({ newsItems, activeTabId }: UseCategoryFilterProps) {
  // 1. Lekérjük a kiválasztott kategóriát a kontextusból
  const { selectedCategory } = useCategoryContext();

  // 2. Meghívjuk a useCategoryData hookot (feltételezve, hogy ez szükséges a kategória-feldolgozáshoz)
  useCategoryData(newsItems, activeTabId);

  // 3. Szűrjük a híreket a kiválasztott kategória alapján (áthelyezve a Content.tsx-ből)
  // Függőségek: newsItems és selectedCategory

  // 4. Visszaadjuk a szűrt hírlistát
  return useMemo(() => {
    // Ha nincs kiválasztott kategória, az összes hírt mutatjuk
    if (!selectedCategory || !newsItems.length) return newsItems;

    // Kategória szűrés a hírekre
    return newsItems.filter((item) => {
      // 1. Először ellenőrizzük a categories tömböt (ha létezik)
      if (item.categories?.includes(selectedCategory)) {
        return true;
      }

      // 2. Ha nincs categories tömb, ellenőrizzük az egyszerű category tulajdonságot
      if (item.category === selectedCategory) {
        return true;
      }

      // 3. Ha egyik sem egyezik, szöveges keresést végzünk a címben és leírásban
      const text = `${item.title || ''} ${item.description || ''}`.toLowerCase();
      return text.includes(selectedCategory.toLowerCase());
    });
  }, [newsItems, selectedCategory]);
}
