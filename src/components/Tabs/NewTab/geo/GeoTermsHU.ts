/**
 * 🇭🇺 MAGYAR NYELVŰ GEO-KERESÉSI SZÓTÁR (MVP VERZIÓ)
 *
 * A NewTabPanel geo-keresési rendszerének magyar nyelvű alapja.
 *
 * Használat:
 * ```typescript
 * import { HU_GEO_TERMS, detectGeoTermHU } from './GeoTermsHU';
 *
 * const result = detectGeoTermHU("oroszország");
 * // { type: "country", code: "Russia", matches: ["oroszország"] }
 * ```
 */

// 🎯 GEO KERESÉSI TÍPUSOK
export type GeoType = 'country' | 'continent' | 'region';

// 🎯 FELISMERÉSI EREDMÉNY INTERFACE
export interface GeoMatchResult {
  type: GeoType;
  code: string; // PostgreSQL kompatibilis kód (pl. "Russia", "Europe")
  matches: string[]; // Illeszkedő magyar kifejezések
  confidence: number; // 0-1 közötti biztonság
}

// ✅ JAVÍTÁS: Konstansok a duplikált literálok helyett
const UNITED_STATES = 'United States';
const UNITED_KINGDOM = 'United Kingdom';

// 🇭🇺 MAGYAR ORSZÁGOK SZÓTÁRA (15 legfontosabb)
export const HU_COUNTRIES = {
  // 🇷🇺 Oroszország
  oroszország: 'Russia',
  orosz: 'Russia',
  oroszországi: 'Russia',

  // 🇺🇦 Ukrajna
  ukrajna: 'Ukraine',
  ukrán: 'Ukraine',
  ukrajnai: 'Ukraine',

  // 🇩🇪 Németország
  németország: 'Germany',
  német: 'Germany',
  németországi: 'Germany',

  // 🇺🇸 Amerika - ✅ JAVÍTVA: konstans használata
  amerika: UNITED_STATES,
  amerikai: UNITED_STATES,
  'egyesült államok': UNITED_STATES,
  usa: UNITED_STATES,

  // 🇨🇳 Kína
  kína: 'China',
  kínai: 'China',

  // 🇬🇧 Nagy-Britannia - ✅ JAVÍTVA: konstans használata
  anglia: UNITED_KINGDOM,
  angol: UNITED_KINGDOM,
  'nagy-britannia': UNITED_KINGDOM,
  'egyesült királyság': UNITED_KINGDOM,

  // 🇫🇷 Franciaország
  franciaország: 'France',
  francia: 'France',

  // 🇮🇹 Olaszország
  olaszország: 'Italy',
  olasz: 'Italy',

  // 🇪🇸 Spanyolország
  spanyolország: 'Spain',
  spanyol: 'Spain',

  // 🇵🇱 Lengyelország
  lengyelország: 'Poland',
  lengyel: 'Poland',

  // 🇭🇺 Magyarország
  magyarország: 'Hungary',
  magyar: 'Hungary',

  // 🇹🇷 Törökország
  törökország: 'Turkey',
  török: 'Turkey',

  // 🇮🇷 Irán
  irán: 'Iran',
  iráni: 'Iran',

  // 🇮🇱 Izrael
  izrael: 'Israel',
  izraeli: 'Israel',

  // 🇸🇦 Szaúd-Arábia
  'szaúd-arábia': 'Saudi Arabia',
  szaúdi: 'Saudi Arabia',
} as const;

// 🌍 MAGYAR KONTINENSEK SZÓTÁRA
export const HU_CONTINENTS = {
  // Európa
  európa: 'Europe',
  európai: 'Europe',

  // Ázsia
  ázsia: 'Asia',
  ázsiai: 'Asia',

  // Afrika
  afrika: 'Africa',
  afrikai: 'Africa',

  // Amerika (Észak-Amerika)
  'észak-amerika': 'North America',
  'észak-amerikai': 'North America',

  // Dél-Amerika
  'dél-amerika': 'South America',
  'dél-amerikai': 'South America',
} as const;

// 🗺️ MAGYAR RÉGIÓK SZÓTÁRA (4 legfontosabb) - ✅ JAVÍTVA: string[] típus
export const HU_REGIONS: Record<string, string[]> = {
  // Közel-Kelet
  'közel-kelet': ['Israel', 'Palestine', 'Syria', 'Lebanon', 'Jordan', 'Iraq', 'Iran'],
  közelkelet: ['Israel', 'Palestine', 'Syria', 'Lebanon', 'Jordan', 'Iraq', 'Iran'],
  'közel-keleti': ['Israel', 'Palestine', 'Syria', 'Lebanon', 'Jordan', 'Iraq', 'Iran'],
  közelkeleti: ['Israel', 'Palestine', 'Syria', 'Lebanon', 'Jordan', 'Iraq', 'Iran'],

  // Balkán
  balkán: [
    'Serbia',
    'Croatia',
    'Bosnia and Herzegovina',
    'Montenegro',
    'North Macedonia',
    'Albania',
  ],
  balkáni: [
    'Serbia',
    'Croatia',
    'Bosnia and Herzegovina',
    'Montenegro',
    'North Macedonia',
    'Albania',
  ],

  // Skandinávia
  skandinávia: ['Sweden', 'Norway', 'Denmark', 'Finland'],
  skandináv: ['Sweden', 'Norway', 'Denmark', 'Finland'],

  // Kelet-Európa
  'kelet-európa': ['Poland', 'Czech Republic', 'Slovakia', 'Hungary', 'Romania', 'Bulgaria'],
  'kelet-európai': ['Poland', 'Czech Republic', 'Slovakia', 'Hungary', 'Romania', 'Bulgaria'],
};

// 🎯 ÖSSZES MAGYAR GEO KIFEJEZÉS (EGYESÍTETT)
export const HU_GEO_TERMS = {
  countries: HU_COUNTRIES,
  continents: HU_CONTINENTS,
  regions: HU_REGIONS,
} as const;

/**
 * 🔍 MAGYAR GEO-KIFEJEZÉS FELISMERÉSE
 *
 * @param searchTerm - Keresési kifejezés magyarul
 * @returns GeoMatchResult vagy null ha nincs találat
 */
export const detectGeoTermHU = (searchTerm: string): GeoMatchResult | null => {
  if (!searchTerm || typeof searchTerm !== 'string') {
    return null;
  }

  const normalizedTerm = searchTerm.toLowerCase().trim();

  // 1️⃣ ORSZÁG KERESÉS
  if (normalizedTerm in HU_COUNTRIES) {
    const countryCode = HU_COUNTRIES[normalizedTerm as keyof typeof HU_COUNTRIES];
    return {
      type: 'country',
      code: countryCode,
      matches: [normalizedTerm],
      confidence: 1.0,
    };
  }

  // 2️⃣ KONTINENS KERESÉS
  if (normalizedTerm in HU_CONTINENTS) {
    const continentCode = HU_CONTINENTS[normalizedTerm as keyof typeof HU_CONTINENTS];
    return {
      type: 'continent',
      code: continentCode,
      matches: [normalizedTerm],
      confidence: 1.0,
    };
  }

  // 3️⃣ RÉGIÓ KERESÉS - ✅ JAVÍTVA: nem használt változó eltávolítása
  if (normalizedTerm in HU_REGIONS) {
    return {
      type: 'region',
      code: normalizedTerm, // Régió esetén a magyar név a kód
      matches: [normalizedTerm],
      confidence: 1.0,
    };
  }

  // 4️⃣ NINCS TALÁLAT
  return null;
};

/**
 * 🔍 RÉGIÓ ORSZÁGAINAK LEKÉRÉSE
 *
 * @param regionKey - Régió kulcs magyarul (pl. "közel-kelet")
 * @returns Országkódok tömbje vagy üres tömb
 */
export const getRegionCountries = (regionKey: string): string[] => {
  const normalizedKey = regionKey.toLowerCase().trim();

  // ✅ JAVÍTVA: közvetlen return, nem használt változó nélkül
  return HU_REGIONS[normalizedKey] || [];
};

/**
 * 🧪 TESZT FÜGGVÉNY - Magyar geo-felismerés tesztelése
 */
export const testHUGeoRecognition = (): void => {
  const testCases = [
    'oroszország',
    'ukrajna',
    'németország',
    'amerika',
    'európa',
    'közel-kelet',
    'balkán',
    'skandinávia',
    'xyz', // Negatív teszt
  ];

  console.log('🧪 Magyar geo-felismerés tesztje:');
  console.log('=====================================');

  testCases.forEach((testCase) => {
    const result = detectGeoTermHU(testCase);

    if (result) {
      console.log(`✅ "${testCase}" → ${result.type}: ${result.code}`);
      if (result.type === 'region') {
        const countries = getRegionCountries(testCase);
        console.log(`   📍 Országok: ${countries.join(', ')}`);
      }
    } else {
      console.log(`❌ "${testCase}" → Nincs találat`);
    }
  });

  console.log('=====================================');
};

// 🎯 MAGYAR GEO TÍPUSOK EXPORTÁLÁSA
export type HUCountryKey = keyof typeof HU_COUNTRIES;
export type HUContinentKey = keyof typeof HU_CONTINENTS;
export type HURegionKey = keyof typeof HU_REGIONS;
