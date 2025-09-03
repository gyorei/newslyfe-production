import { CountrySourceData, ProcessedSourceData, TerminalAnimationData, TerminalLine } from './sourceData';

// Importáljuk az európai adatokat (build időben beépül)
// Megjegyzés: Mostantól sima JSON-t importálunk!
import europeDataRaw from './europe.json';
const europeData: CountrySourceData = (europeDataRaw as any).Europe;

/**
 * Ország nevének normalizálása kulcs kereséshez
 * Példa: "Finland" -> "Finland (FI)" keresés
 */
function normalizeCountryKey(countryName: string): string | null {
  if (!countryName) return null;
  
  // Keresés a JSONC kulcsokban
  const keys = Object.keys(europeData);
  
  // Pontos egyezés keresése (case-insensitive)
  const exactMatch = keys.find(key => 
    key.toLowerCase().includes(countryName.toLowerCase())
  );
  
  return exactMatch || null;
}

/**
 * Domain név kinyerése URL-ből
 * Példa: "https://www.yle.fi/" -> "yle.fi"
 */
function extractDomain(url: string): string {
  try {
    const urlObj = new URL(url);
    return urlObj.hostname.replace('www.', '');
  } catch {
    return url;
  }
}

/**
 * Random latency generálás (reális értékek)
 */
function generateLatency(): number {
  return Math.floor(Math.random() * (200 - 80 + 1)) + 80; // 80-200ms
}

/**
 * Ország forrásainak betöltése és feldolgozása
 */
export function getCountrySourceData(countryName: string): ProcessedSourceData | null {
  const countryKey = normalizeCountryKey(countryName);
  
  if (!countryKey || !europeData[countryKey]) {
    return null;
  }
  
  const sources = europeData[countryKey];
  const domains = sources.map(source => extractDomain(source.url));
  
  return {
    countryName: countryName.toUpperCase(),
    sourceCount: sources.length,
    domains,
    sources
  };
}

/**
 * Terminál animációhoz optimalizált adatok előkészítése
 */
export function prepareTerminalAnimationData(countryName: string): TerminalAnimationData | null {
  const sourceData = getCountrySourceData(countryName);
  
  if (!sourceData) {
    return null;
  }
  
  // Első 20-30 forrás kiválasztása animációhoz (nem mind a 155!)
  const maxSources = Math.min(sourceData.sources.length, 25);
  const selectedSources = sourceData.sources.slice(0, maxSources);
  
  const sampleSources = selectedSources.map(source => ({
    domain: extractDomain(source.url),
    title: source.title,
    latency: generateLatency()
  }));
  
  return {
    countryName: sourceData.countryName,
    sourceCount: sourceData.sourceCount, // Teljes szám megjelenítéshez
    domains: sourceData.domains.slice(0, maxSources),
    sampleSources
  };
}

/**
 * Ellenőrzés: van-e adat az adott országhoz
 */
export function hasCountryData(countryName: string): boolean {
  return normalizeCountryKey(countryName) !== null;
}

/**
 * Összes elérhető ország listája
 */
export function getAvailableCountries(): string[] {
  return Object.keys(europeData).map(key => {
    const match = key.match(/^(.+?)\s*\(/);
    return match ? match[1] : key;
  });
}

// Kikapcsolható domain megjelenítés a terminálban
export const SHOW_DOMAINS_IN_TERMINAL = false; // Állítsd false-ra, ha csak az alap szöveg kell

// Minta log-generáló függvény az új architektúrához
export function generateSampleTerminalLines(country: string): TerminalLine[] {
  const timestamp = () => new Date().toLocaleTimeString('en-GB', { hour12: false });
  const countryUpper = country.toUpperCase();
  const countryLower = country.toLowerCase();
  let id = 0;
  return [
    { id: `l${id++}`, text: "$ whoami", type: "command", status: "pending" },
    { id: `l${id++}`, text: "newsbot", type: "default", status: "pending" },
    { id: `l${id++}`, text: "", type: "default", status: "pending" },
    { id: `l${id++}`, text: "$ cd /opt/news-aggregator", type: "command", status: "pending" },
    { id: `l${id++}`, text: "", type: "default", status: "pending" },
    { id: `l${id++}`, text: `$ ./fetch-news.sh --country=${countryLower}`, type: "command", status: "pending" },
    { id: `l${id++}`, text: `[${timestamp()}] INFO: Starting news aggregation for ${countryUpper}`, type: "info", status: "pending" },
    { id: `l${id++}`, text: `[${timestamp()}] INFO: Loading configurations...`, type: "process", status: "pending", duration: 1200 },
    { id: `l${id++}`, text: `[${timestamp()}] INFO: Found active sources for ${countryUpper} region`, type: "info", status: "pending" },
    { id: `l${id++}`, text: `[${timestamp()}] INFO: Connecting to API endpoints...`, type: "process", status: "pending", duration: 900 },
    { id: `l${id++}`, text: `[${timestamp()}] INFO: Authenticating...`, type: "process", status: "pending", duration: 700 },
    { id: `l${id++}`, text: `[${timestamp()}] INFO: Token valid ✓`, type: "success", status: "pending" },
    { id: `l${id++}`, text: `[${timestamp()}] INFO: Fetching articles from sources...`, type: "process", status: "pending", duration: 1800 },
    { id: `l${id++}`, text: `[${timestamp()}] INFO: Processing articles...`, type: "process", status: "pending", duration: 1500 },
    { id: `l${id++}`, text: `[${timestamp()}] INFO: Filtering duplicates and sorting...`, type: "process", status: "pending", duration: 1000 },
    { id: `l${id++}`, text: `[${timestamp()}] INFO: Saving to database...`, type: "process", status: "pending", duration: 1200 },
    { id: `l${id++}`, text: `[${timestamp()}] INFO: Database update complete. ✓`, type: "success", status: "pending" },
    { id: `l${id++}`, text: `[${timestamp()}] DONE: Aggregation complete!`, type: "success", status: "pending" },
    { id: `l${id++}`, text: `[${timestamp()}] INFO: Launching news feed...`, type: "info", status: "pending" },
    { id: `l${id++}`, text: "$ _", type: "command", status: "pending" },
  ];
}