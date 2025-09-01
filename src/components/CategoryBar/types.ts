// Kategória kezeléshez szükséges típusdefiníciók

export interface CategoryData {
  categories: string[];
  categoryCounts: Record<string, number>;
}

export interface TabCategoryState {
  selectedCategory: string | null;
  categoryCounts: Record<string, number>;
}

// Tab-specifikus kategória állapot tároló
export type TabCategoryMap = Record<string, TabCategoryState>;
