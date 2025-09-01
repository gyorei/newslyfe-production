import * as React from 'react';
import { useState } from 'react';
import { CategoryContext } from './CategoryContext';
import { defaultCategories } from './categoryMapping'; // ← Új import

// Props típus a provider számára
interface CategoryProviderProps {
  children: React.ReactNode;
}

// CategoryProvider komponens implementációja
export const CategoryProvider: React.FC<CategoryProviderProps> = ({ children }) => {
  // Állapotok a kategóriákhoz
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  // Az alapértelmezett kategóriák importálása a categoryMapping-ből
  const [categories, setCategories] = useState<string[]>(defaultCategories);
  const [categoryCounts, setCategoryCounts] = useState<Record<string, number>>({});

  // Context érték összeállítása
  const contextValue = {
    selectedCategory,
    categories,
    categoryCounts,
    setSelectedCategory,
    setCategoryCounts,
    setCategories,
  };

  return <CategoryContext.Provider value={contextValue}>{children}</CategoryContext.Provider>;
};
