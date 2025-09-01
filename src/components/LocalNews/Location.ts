/**
 * Lokalizációs Szolgáltatás (localizationService.ts)
 *
 * 🔧 REFAKTORÁLÁSI JAVASLATOK - TISZTÍTÁS UTÁN:
 * ✅ MEGTARTVA: Country mappingek, utility funkciók, cache kezelés
 * 🗑️ TÖRÖLVE: IP funkciók, üres objektumok, duplikált interfészek, wrapper metódusok
 * 📦 KÖLTÖZTETENDŐ: Country mappingek → config/countryMappings.ts
 */

// Importok javítása - relatív útvonalak a src mappához képest
import { NewsSource } from '../../types';
import { locationProvider } from './location/LocationProvider';
import { LocationData } from './location/types'; // ✅ JAVÍTÁS: Helyes típus importálása
import {
  countryMapping,
  countryNormalizers,
  countryCodeNameMap,
  continentCountryCodes,
} from './config/countryMappings';

// ❌ TÖRÖLVE: Felesleges importok és konstansok

// ❌ KOMMENTÁLVA: IPLocation interfész - csak egyszer használt
/*
interface IPLocation {
  country: string;
  countryCode: string;
  city?: string;
  ip: string;
}
*/

// ✅ MEGTARTANDÓ - hasznos helper funkciók
export function getCountryNameByCode(code: string): string {
  return countryCodeNameMap[code.toLowerCase()] || code.toUpperCase();
}

export function getContinentByCountryCode(code: string): string | null {
  const lowerCode = code.toLowerCase();
  if (continentCountryCodes.asia.includes(lowerCode)) return 'Asia';
  if (continentCountryCodes.africa.includes(lowerCode)) return 'Africa';
  if (continentCountryCodes.northAmerica.includes(lowerCode)) return 'North America';
  if (continentCountryCodes.southAmerica.includes(lowerCode)) return 'South America';
  if (continentCountryCodes.oceania.includes(lowerCode)) return 'Oceania';
  return continentCountryCodes.europe.includes(lowerCode) ? 'Europe' : null;
}

export function normalizeCountry(country: string): string {
  for (const [normalized, alternatives] of Object.entries(countryNormalizers)) {
    if (alternatives.includes(country)) {
      return normalized;
    }
  }
  return country;
}

export function prioritizeSourcesByCountry<T extends { country?: string }>(
  sources: T[],
  countryFilter?: string,
): T[] {
  if (!countryFilter) return sources;

  return [...sources].sort((a, b) => {
    const aIsFromCountry = a.country === countryFilter;
    const bIsFromCountry = b.country === countryFilter;

    if (aIsFromCountry && !bIsFromCountry) return -1;
    if (!aIsFromCountry && bIsFromCountry) return 1;
    return 0;
  });
}

export function findCountryByAlternativeName(
  country: string,
  _continentsData?: Record<string, unknown>,
): string | null {
  for (const [normalizedName, alternativeNames] of Object.entries(countryNormalizers)) {
    if (alternativeNames.includes(country)) {
      return normalizedName;
    }
  }
  return null;
}

// DataService interfész definiálása
interface DataServiceSources {
  sources: {
    getNewsSourcesByCountry: (name: string) => Promise<NewsSource[]>;
  };
}

export async function getLocalSourcesByCountryName(
  countryName: string,
  dataService: DataServiceSources,
): Promise<NewsSource[]> {
  try {
    const resolvedCountryName = countryMapping[countryName] || countryName;
    const sources = await dataService.sources.getNewsSourcesByCountry(resolvedCountryName);
    return sources || [];
  } catch (error) {
    console.error(`Hiba a lokális források lekérésénél: ${countryName}`, error);
    return [];
  }
}

export const ContentLocalization = {
  handleLocationBasedFiltering: async (
    location: LocationData | null,
    filters: { country?: string },
    sources: NewsSource[],
    dataService: DataServiceSources,
  ) => {
    let filteredSources = sources;

    if (location?.country && !filters.country) {
      const countryName = countryMapping[location.country] || location.country;

      const localSources = await dataService.sources.getNewsSourcesByCountry(countryName);

      if (localSources && localSources.length > 0) {
        console.log(`Lokáció alapú szűrés: ${countryName}, ${localSources.length} forrás`);
        filteredSources = localSources;
      }
    }

    return filteredSources;
  },
};

// Egyszerűsített lokációs szolgáltatás
// ✅ ÁTIRÁNYÍTÁS: localLocationService helyett használd a locationProvider-t közvetlenül
export const localLocationService = {
  // ⚠️ DEPRECATED: Használd helyette: locationProvider.getLocation()
  getLocation: () => locationProvider.getLocation(),
  // ⚠️ DEPRECATED: Használd helyette: locationProvider.setManualLocation()
  setSelectedLocation: (country: string, countryCode: string, _continent?: string) =>
    locationProvider.setManualLocation(country, countryCode),
  // ⚠️ DEPRECATED: Használd helyette: locationProvider.clearManualLocation()
  clearSelectedLocation: () => locationProvider.clearManualLocation(),

  getBrowserPreferences: () => ({
    language: navigator.language,
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
  }),
};

// JAVÍTÁS: getLocalizedSources helyesen definiálva
export function getLocalizedSources(sources: NewsSource[], filters: { country?: string | null }) {
  if (!filters.country) return sources;

  return [...sources].sort((a, b) => {
    const aIsFromCountry = a.country === filters.country;
    const bIsFromCountry = b.country === filters.country;

    if (aIsFromCountry && !bIsFromCountry) return -1;
    if (!aIsFromCountry && bIsFromCountry) return 1;
    return 0;
  });
}

// Cache implementáció
// ❌ KOMMENTÁLVA: DUPLIKÁLT CACHE RENDSZER - newsSourceCache
// Van már egy cache utility, ez felesleges Map cache
/*
const newsSourceCache = new Map<string, {
  sources: NewsSource[];
  timestamp: number;
}>();
*/

// ❌ KOMMENTÁLVA: HASZNÁLATON KÍVÜLI FUNKCIÓ - getNewsSourcesByCountry
/*
export const getNewsSourcesByCountry = async (
  country: string, 
  dataService?: DataServiceSources
): Promise<NewsSource[]> => {
  try {
    const normalizedCountry = normalizeCountry(country);
    const cacheKey = cache.generateKey(CACHE_PREFIX, normalizedCountry);

    // Cache ellenőrzés
    const cachedSources = await cache.get<NewsSource[]>(cacheKey);
    if (cachedSources) {
      return cachedSources;
    }

    let sources: NewsSource[] = [];

    // DataService használata
    if (dataService) {
      sources = await dataService.sources.getNewsSourcesByCountry(normalizedCountry);
    }

    // Cache-elés
    if (sources.length > 0) {
      await cache.set(
        cacheKey, 
        sources,
        CACHE_TIMES.MEDIUM,
        CACHE_PREFIX
      );
    }

    return sources;
  } catch (error) {
    console.error(`Hiba a(z) ${country} hírforrásainak lekérése közben:`, error);
    return [];
  }
};
*/

// ❌ KOMMENTÁLVA: HASZNÁLATON KÍVÜLI FUNKCIÓ - clearNewsSourceCache
/*
export const clearNewsSourceCache = (country?: string) => {
  if (country) {
    newsSourceCache.delete(normalizeCountry(country));
  } else {
    newsSourceCache.clear();
  }
};
*/

// Kiterjesztett interfész
interface ExtendedDataServiceSources extends DataServiceSources {
  sources: {
    getNewsSourcesByCountry: (name: string) => Promise<NewsSource[]>;
    getNewsSourcesByContinent: (continent: string) => Promise<Record<string, NewsSource[]>>;
    getAllNewsSources: () => Promise<NewsSource[]>;
    getNewsSourceById: (id: string) => Promise<NewsSource | null>;
  };
}

export const getFilteredSourcesByLocation = async (
  filters: { country?: string; continent?: string; source?: string[] },
  dataService: ExtendedDataServiceSources,
): Promise<NewsSource[]> => {
  try {
    const location = await localLocationService.getLocation();

    let sources;
    if (filters.country) {
      sources = await dataService.sources.getNewsSourcesByCountry(filters.country);
    } else if (filters.continent) {
      const countriesByContinent = await dataService.sources.getNewsSourcesByContinent(
        filters.continent,
      );
      sources = Object.values(countriesByContinent).flat();
    } else {
      sources = await dataService.sources.getAllNewsSources();
    }

    // Lokáció alapú szűrés
    if (location?.country && !filters.country) {
      const normalizedCountry = normalizeCountry(location.country);
      const localSources = await getLocalSourcesByCountryName(normalizedCountry, dataService);

      if (localSources.length > 0) {
        console.log(`Lokáció alapú szűrés: ${normalizedCountry}, ${localSources.length} forrás`);
        sources = localSources;
      }
    }

    // Szűrés forrás azonosító szerint
    if (filters.source?.length) {
      const sourceObjects = await Promise.all(
        filters.source.map((id) => dataService.sources.getNewsSourceById(id)),
      );
      sources = sourceObjects.filter(Boolean) as NewsSource[];
    }

    return sources || [];
  } catch (error) {
    console.error('Hiba a források szűrésénél:', error);
    return [];
  }
};

// Központi szolgáltatás export - TISZTÍTOTT VERZIÓ
export const localizationService = {
  countryMapping,
  countryNormalizers,
  countryCodeNameMap,
  continentCountryCodes,
  getCountryNameByCode,
  getContinentByCountryCode,
  normalizeCountry,
  prioritizeSourcesByCountry,
  findCountryByAlternativeName,
  getLocalSourcesByCountryName,
  ContentLocalization,
  getFilteredSourcesByLocation,
};

export default localizationService;
