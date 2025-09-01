// src/utils/transformers.ts
import { SearchResultItem } from '../apiclient/apiClient';
import { NewsItem } from '../types';

// Az "Igazság Forrása": Egyetlen, megbízható helyen definiáljuk a kódokat és neveket.
// Ez a mi belső, tiszta adatmodellünk.
const COUNTRY_DATA: { [key: string]: { code: string; name: string } } = {
  US: { code: 'US', name: 'United States' },
  GB: { code: 'GB', name: 'United Kingdom' },
  CA: { code: 'CA', name: 'Canada' },
  UA: { code: 'UA', name: 'Ukraine' },
  DE: { code: 'DE', name: 'Germany' },
  IL: { code: 'IL', name: 'Israel' },
  // ... ide jöhet a többi ország, ha bővül a lista
};

// Aliasok és gyakori hibák leképezése a helyes, tiszta kódra.
// Itt kezeljük a backendről érkező "szemetet".
const ALIAS_MAP: { [key: string]: string } = {
  // Hibás kódok -> Helyes kód
  UK: 'GB', // A "UK" mindig "GB"-t jelent
  UN: 'US', // A logok alapján az "UN" az "US"-t jelenti a te rendszeredben

  // Hibás nevek -> Helyes kód
  "UNITED KINGDOM": 'GB',
  "UNITED STATES": 'US',
  "CANADA": 'CA',
  "UKRAINE": 'UA',
};

/**
 * Átalakítja és TISZTÍTJA a backendről érkező nyers találatot
 * a frontend által használt, garantáltan konzisztens NewsItem formátumra.
 */
export function convertSearchResultToNewsItem(item: SearchResultItem): NewsItem {
  let finalCode: string = '';
  let finalName: string = item.orszag || 'Unknown'; // Alapértelmezetten a név az, amit a backend ad

  // 1. Kísérlet: A bejövő kód tisztítása
  const rawCode = item.country_code?.toUpperCase();
  if (rawCode) {
    // Ha a nyers kód egy ismert alias (pl. UK, UN), használjuk a helyes kódot.
    if (ALIAS_MAP[rawCode]) {
      finalCode = ALIAS_MAP[rawCode];
    } 
    // Ha a nyers kód már eleve egy helyes, ismert kód (pl. US, GB), használjuk azt.
    else if (COUNTRY_DATA[rawCode]) {
      finalCode = rawCode;
    }
  }

  // 2. Kísérlet (ha a kód még mindig ismeretlen): A bejövő név alapján próbálunk kódot találni
  if (!finalCode) {
    const rawName = item.orszag?.toUpperCase();
    if (rawName && ALIAS_MAP[rawName]) {
      finalCode = ALIAS_MAP[rawName];
    }
  }

  // 3. Végső név beállítása a TISZTA kód alapján
  // Ez biztosítja, hogy a "GB" kódhoz mindig a "United Kingdom" név társuljon.
  if (finalCode && COUNTRY_DATA[finalCode]) {
    finalName = COUNTRY_DATA[finalCode].name;
  }

  // Robusztus képmező feloldás: ellenőrizzük a gyakori mezőneveket és struktúrákat
  type ExtendedSearchResult = Partial<{
    image_url: string;
    image: string;
    thumbnail: string;
    imageUrl: string;
    og_image: string;
    media: Array<Partial<{ url: string; thumbnail: string }>>;
  }>;

  const ext = item as ExtendedSearchResult;
  const resolvedImage = (() => {
    if (ext.image_url) return ext.image_url;
    if (ext.image) return ext.image;
    if (ext.thumbnail) return ext.thumbnail;
    if (ext.imageUrl) return ext.imageUrl;
    if (ext.og_image) return ext.og_image;
    const media = ext.media;
    if (Array.isArray(media) && media.length > 0) {
      const m0 = media[0];
      if (m0) {
        if (m0.url) return m0.url;
        if (m0.thumbnail) return m0.thumbnail;
      }
    }
    return '';
  })();

  return {
    id: String(item.id),
    title: item.title,
    description: item.description,
    url: item.url,
    imageUrl: resolvedImage,
    sourceId: item.source_slug,
    
    // Garantáltan a lehető legtisztább adatot adjuk tovább a rendszer többi részének
    country: finalName,
    countryCode: finalCode, // Lehet üres string, ha sehogy sem tudtuk kitalálni

    source: item.source_name || item.source_slug,
    continent: item.continent || '',
    date: item.published_at,
    timestamp: new Date(item.published_at).getTime(),
    matchLanguage: item.match_language,
  };
}

