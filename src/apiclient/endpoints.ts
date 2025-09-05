/**
 * src\apiclient\endpoints.ts
 * API végpont definíciók a News alkalmazáshoz
 */

// import { videoChannelsByLetter, type CountryVideoChannels } from '../backend/api/routes/videoData/videoData';

export const endpoints = {
  baseUrl: import.meta.env.VITE_API_URL || 'https://api.newsapp.example.com/v1',

  // Szinkronizáció - JAVÍTVA: /api prefix hozzáadása
  sync: '/api/sync',

  // Cikkek
  articles: '/api/articles',
  article: (id: string) => `/api/articles/${id}`,
  saveArticle: '/api/articles/save',

  // Felhasználói adatok
  user: '/api/user',
  preferences: '/api/user/preferences',

  // Adatforrások
  sources: '/api/sources',
  categories: '/api/categories',

  // Keresés
  search: '/api/search',

  // ========================================
  // 🎥 VIDEO ENDPOINTS - ÚJ VIDEÓ API!
  // ========================================
  // Ez CSAK videó híreket ad vissza!
  // NEM keverjük a sima hírekkel!
  videoNews: '/api/video/news',
  videoCountries: '/api/video-countries',

  // PostgreSQL API - Frissítve az új API struktúrához
  /*
  postgres: {
    baseUrl: 'http://localhost:3002',
*/

postgres: {
  baseUrl: import.meta.env.VITE_API_URL || 'https://newslyfe.com/api',

/*
postgres: {
  baseUrl: import.meta.env.VITE_API_URL || 'https://api.newsapp.example.com/v1',
*/
  // Kontinens-alapú végpontok - Új struktúra
    continentSources: (continent: string) =>
      `/api/continent/${encodeURIComponent(continent)}/sources`,

    // Új: Kontinens hírek lekérése
    continentNews: (continent: string) => `/api/continent/${encodeURIComponent(continent)}/news`,

    // Ország-alapú végpontok - Új struktúra
    countrySources: (country: string) => `/api/country/${encodeURIComponent(country)}/sources`,

    // Új: Ország hírek lekérése
    countryNews: (country: string) => `/api/country/${encodeURIComponent(country)}/news`,

    // Forrás-alapú végpontok - Új struktúra
    sourceById: (id: string) => `/api/sources/id/${encodeURIComponent(id)}`,

    // Lista végpontok
    allCountries: '/api/countries',

    // ORSZÁGBETŰ MODUL: Új végpont a betű szerinti országlekérdezéshez
    countriesByLetter: (letter: string) => `/api/countries/letter/${encodeURIComponent(letter)}`,

    // RSS ADMIN MODUL: Új végpontok a források kezeléséhez
    allSources: '/api/sources/all', // Összes forrás lekérdezése
    updateSource: (id: string) => `/api/sources/update/${encodeURIComponent(id)}`, // Forrás frissítése
    updateSourceStatus: (id: string) => `/api/sources/status/${encodeURIComponent(id)}`, // Forrás státuszának frissítése
    deleteSource: (id: string) => `/api/sources/delete/${encodeURIComponent(id)}`, // Forrás törlése

    // Alapvető API ellenőrzés
    ping: '/api/ping',
  },
  localNews: (params?: { sourceId?: string; country?: string; limit?: number; offset?: number }) => {
    let url = '/api/local/news';
    const query: string[] = [];
    if (params?.country) query.push(`country=${encodeURIComponent(params.country)}`);
    if (params?.sourceId) query.push(`sourceId=${encodeURIComponent(params.sourceId)}`);
    if (params?.limit) query.push(`limit=${params.limit}`);
    if (params?.offset) query.push(`offset=${params.offset}`);
    if (query.length) url += '?' + query.join('&');
    return url;
  },
  // ÚJ: Keresés a hírek között (full-text search)
  searchNews: (params: { q: string; lang?: 'en' | 'hu'; countries?: string; limit?: number; offset?: number }) => {
    let url = '/api/search';
    const query: string[] = [];
    query.push(`q=${encodeURIComponent(params.q)}`); // A 'q' kötelező
    if (params.lang) query.push(`lang=${params.lang}`);
    if (params.countries) query.push(`countries=${encodeURIComponent(params.countries)}`); // ÚJ
    if (params.limit) query.push(`limit=${params.limit}`);
    if (params.offset) query.push(`offset=${params.offset}`);
    url += '?' + query.join('&');
    return url;
  },
};


