import { createContext, useContext } from 'react';

// Kategória kontextus típus definíciója
interface CategoryContextType {
  selectedCategory: string | null;
  categories: string[];
  categoryCounts: Record<string, number>;
  setSelectedCategory: (category: string | null) => void;
  setCategoryCounts: (counts: Record<string, number>) => void;
  setCategories: (categories: string[]) => void;
}

// Alapértelmezett értékek
const defaultContextValue: CategoryContextType = {
  selectedCategory: null,
  categories: [],
  categoryCounts: {},
  setSelectedCategory: () => {},
  setCategoryCounts: () => {},
  setCategories: () => {},
};

// Kontextus létrehozása
export const CategoryContext = createContext<CategoryContextType>(defaultContextValue);

// Hook a kontextus egyszerű használatához
export const useCategoryContext = () => useContext(CategoryContext);
