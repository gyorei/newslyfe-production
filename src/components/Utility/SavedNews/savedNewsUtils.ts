import { NewsItem } from '../../../types';

// A localStorage kulcs a mentett hírekhez
const SAVED_NEWS_KEY = 'savedNews';

// A mentett hír típusa
export interface SavedNewsItem {
  id: string; // A hír egyedi azonosítója
  title: string; // A hír címe
  description?: string; // A hír rövid leírása
  imageUrl?: string; // Képek URL-je
  source?: string; // A forrás neve
  sourceId?: string; // A forrás azonosítója
  url?: string; // Az eredeti cikk URL-je
  date?: string; // Dátum string
  timestamp: number; // A mentés időbélyege
  category?: string; // Kategória
  country?: string; // Ország
  continent?: string; // Kontinens
}

/**
 * Összes mentett hír lekérése
 * @returns A mentett hírek tömbje
 */
export const getSavedNews = (): SavedNewsItem[] => {
  try {
    const savedNewsJson = localStorage.getItem(SAVED_NEWS_KEY);
    if (!savedNewsJson) return [];

    const parsedNews = JSON.parse(savedNewsJson);
    return Array.isArray(parsedNews) ? parsedNews : [];
  } catch (error) {
    console.error('Hiba a mentett hírek lekérésekor:', error);
    return [];
  }
};

/**
 * Hír mentése a localStorage-ba
 * @param newsItem A mentendő hír
 * @returns A mentett hír objektum vagy null hiba esetén
 */
export const saveNews = (newsItem: NewsItem): SavedNewsItem | null => {
  try {
    // Ellenőrizzük a kötelező mezőket
    if (!newsItem.id || !newsItem.title) {
      console.error('Hiányzó kötelező mező (id vagy title) a mentéshez');
      return null;
    }

    const savedNews = getSavedNews();

    // Ellenőrizzük, hogy már mentve van-e
    const existingIndex = savedNews.findIndex((item) => item.id === newsItem.id);
    if (existingIndex >= 0) {
      // Ha már mentve van, frissítjük az időpontot
      savedNews[existingIndex].timestamp = Date.now();
      localStorage.setItem(SAVED_NEWS_KEY, JSON.stringify(savedNews));
      return savedNews[existingIndex];
    }

    // Új mentett elem létrehozása
    const savedItem: SavedNewsItem = {
      id: newsItem.id,
      title: newsItem.title,
      description: newsItem.description,
      imageUrl: newsItem.imageUrl,
      source: newsItem.source,
      sourceId: newsItem.sourceId,
      url: newsItem.url,
      date: newsItem.date,
      timestamp: Date.now(), // Az aktuális időpont
      category: newsItem.category,
      country: newsItem.country,
      continent: newsItem.continent,
    };

    // Mentés a listához
    savedNews.push(savedItem);
    localStorage.setItem(SAVED_NEWS_KEY, JSON.stringify(savedNews));
    // --- ÚJ: esemény küldése mentés után ---
    window.dispatchEvent(new Event('savedNewsUpdated'));

    return savedItem;
  } catch (error) {
    console.error('Hiba a mentéskor:', error);
    return null;
  }
};

/**
 * Hír törlése a mentettek közül
 * @param id A törlendő hír azonosítója
 * @returns true ha a törlés sikeres, false ha nem
 */
export const removeSavedNews = (id: string): boolean => {
  try {
    const savedNews = getSavedNews();
    const filteredNews = savedNews.filter((item) => item.id !== id);

    if (filteredNews.length === savedNews.length) {
      // Nem változott semmi, nem volt mit törölni
      return false;
    }

    localStorage.setItem(SAVED_NEWS_KEY, JSON.stringify(filteredNews));
    // --- ÚJ: esemény küldése törlés után ---
    window.dispatchEvent(new Event('savedNewsUpdated'));
    return true;
  } catch (error) {
    console.error('Hiba a törléskor:', error);
    return false;
  }
};

/**
 * Ellenőrzi, hogy a hír mentve van-e már
 * @param id A hír azonosítója
 * @returns true ha mentve van, false ha nem
 */
export const isNewsSaved = (id: string): boolean => {
  try {
    const savedNews = getSavedNews();
    return savedNews.some((item) => item.id === id);
  } catch (error) {
    console.error('Hiba a mentettség ellenőrzésekor:', error);
    return false;
  }
};
