/**
 * Típusdefiníciók a tabon belüli (frontend) kereséshez.
 * 
 * - SearchOptions: Meghatározza, hogy a keresés mely mezőkben történjen (cím, leírás, forrás).
 * - SearchResult: Egy keresés eredménye (találatok, találatszám, keresett kifejezés, futási idő).
 * - UseFrontendSearchReturn: A kereső hook visszatérési értékei és akciói (eredmények, állapot, keresés/clear metódusok).
 * 
 * Ezeket a típusokat a useFrontendSearch hook és a SmartSearchBar komponens használja.
 */



import { NewsItem } from '../../../../types';

// ✅ KERESÉSI BEÁLLÍTÁSOK
export interface SearchOptions {
  searchInTitle?: boolean;        // Cím keresés (default: true)
  searchInDescription?: boolean;  // Leírás keresés (default: true)
  searchInSource?: boolean;       // Forrás keresés (default: true)
}

// ✅ KERESÉSI EREDMÉNY
export interface SearchResult {
  items: NewsItem[];              // Szűrt hírek
  totalCount: number;             // Találatok száma
  query: string;                  // Keresési kifejezés
  executionTime?: number;         // Keresési idő (ms)
}

// ✅ HOOK RETURN INTERFACE
export interface UseFrontendSearchReturn {
  results: NewsItem[];            // Szűrt eredmények
  isSearching: boolean;           // Loading állapot
  totalCount: number;             // Találatok száma
  lastQuery: string;              // Utolsó keresés
  
  // ACTIONS:
  search: (query: string) => void;        // Keresés indítása
  clearSearch: () => void;                // Keresés törlése
}
  
