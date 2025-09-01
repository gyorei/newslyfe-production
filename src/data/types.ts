/**
 * Közös típusdefiníciók az adatkezelő modulok számára
 */

// Egységesített hírmegjelenítő formátum
export interface NewsItem {
  id: string;
  title: string;
  description: string;
  url: string;
  imageUrl: string;
  source: string;
  sourceId: string;
  date: string;
  timestamp: number;
  country: string;
  continent?: string;
  category?: string;
}

// Geolokációs adattípus
export interface Location {
  country: string;
  city?: string;
  region?: string;
  continent?: string;
  latitude?: number;
  longitude?: number;
}

// Forrás típusdefiníció
export interface NewsSource {
  id: string;
  name: string;
  url: string;
  rssFeed?: string;
  country?: string;
  continent?: string;
  category?: string;
  language?: string;
  importance?: number;
}
