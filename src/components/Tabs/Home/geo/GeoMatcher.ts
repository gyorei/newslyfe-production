/**
 * 🧠 KÖZPONTI GEO-FELISMERŐ MOTOR (MVP VERZIÓ)
 *
 * A Home geo-keresési rendszerének központi logikája.
 * Koordinálja a különböző nyelvi szótárakat és keresési stratégiákat.
 *
 * Használat:
 * ```typescript
 * import { detectGeoQuery } from './GeoMatcher';
 *
 * const result = detectGeoQuery("közel-keleti válság", "hu");
 * // {
 * //   type: "hybrid",
 * //   geoMatch: { type: "region", code: "közel-kelet" },
 * //   topicKeywords: ["válság"],
 * //   strategy: "region_with_keywords"
 * // }
 * ```
 */

import { detectGeoTermHU, getRegionCountries, type GeoMatchResult } from './GeoTermsHU';

// 🎯 TÁMOGATOTT NYELVEK (MVP)
export type SupportedLanguage = 'hu'; // Később: 'en' | 'de' | 'fr' | 'ru'

// 🎯 KERESÉSI QUERY TÍPUSOK
export type QueryType = 'geo_only' | 'topic_only' | 'hybrid' | 'unknown';

// 🎯 KERESÉSI STRATÉGIA
export type SearchStrategy =
  | 'country_only' // Csak ország: "oroszország"
  | 'continent_only' // Csak kontinens: "európa"
  | 'region_only' // Csak régió: "közel-kelet"
  | 'topic_only' // Csak kulcsszó: "válság"
  | 'country_with_keywords' // Ország + kulcsszó: "orosz gazdaság"
  | 'region_with_keywords' // Régió + kulcsszó: "közel-keleti válság"
  | 'unknown'; // Nem azonosítható

// 🎯 KERESÉSI EREDMÉNY INTERFACE
export interface GeoQueryResult {
  // Alapvető kategorizálás
  type: QueryType;
  strategy: SearchStrategy;
  language: SupportedLanguage;

  // Geo-felismerés
  geoMatch: GeoMatchResult | null;
  regionCountries?: string[]; // Ha régió, akkor az országok listája

  // Kulcsszó felismerés
  topicKeywords: string[];
  remainingText: string; // Geo-kifejezések eltávolítása után maradt szöveg

  // Meta információ
  originalQuery: string;
  confidence: number; // 0-1 közötti összesített biztonság

  // Hibakezelés
  isValid: boolean;
  errorMessage?: string;
}

// 🔍 MAGYAR TÉMA KULCSSZAVAK (EGYSZERŰ LISTA MVP-HEZ)
const HU_TOPIC_KEYWORDS = [
  // Gazdaság
  'gazdaság',
  'gazdasági',
  'infláció',
  'tőzsde',
  'pénz',
  'pénzügy',

  // Politika
  'politika',
  'politikai',
  'választás',
  'választások',
  'kormány',
  'parlament',

  // Háború/Konfliktus
  'háború',
  'háborús',
  'konfliktus',
  'katonai',
  'hadsereg',
  'békét',

  // Válság
  'válság',
  'krízis',
  'vészhelyzet',
  'katasztrófa',
  'probléma',

  // Általános hírek
  'hírek',
  'hír',
  'újság',
  'sajtó',
  'média',
];

/**
 * 🔍 FŐ GEO-QUERY FELISMERŐ FÜGGVÉNY
 *
 * @param query - Keresési kifejezés (pl. "közel-keleti válság")
 * @param language - Keresési nyelv (jelenleg csak 'hu')
 * @returns GeoQueryResult - Teljes elemzési eredmény
 */
export const detectGeoQuery = (
  query: string,
  language: SupportedLanguage = 'hu',
): GeoQueryResult => {
  const logPrefix = '[GeoMatcher]';
  console.log(`${logPrefix} Geo-query elemzése: "${query}" (${language})`);

  // 🔒 ALAPVETŐ VALIDÁCIÓ
  if (!query || typeof query !== 'string' || query.trim().length === 0) {
    return createErrorResult(query, language, 'Üres keresési kifejezés');
  }

  if (language !== 'hu') {
    return createErrorResult(query, language, `Nem támogatott nyelv: ${language}`);
  }

  try {
    const startTime = performance.now();

    // 1️⃣ SZÖVEG ELŐKÉSZÍTÉSE
    const normalizedQuery = query.toLowerCase().trim();
    const queryTokens = normalizedQuery.split(/\s+/).filter((token) => token.length > 0);

    console.log(`${logPrefix} Tokenek:`, queryTokens);

    // 2️⃣ GEO-FELISMERÉS (leghosszabb egyezés keresése)
    const geoMatch = findLongestGeoMatch(queryTokens, language);
    console.log(`${logPrefix} Geo találat:`, geoMatch);

    // 3️⃣ KULCSSZÓ FELISMERÉS
    const { topicKeywords, remainingText } = extractTopicKeywords(
      queryTokens,
      geoMatch?.matches || [],
    );
    console.log(`${logPrefix} Kulcsszavak:`, topicKeywords);
    console.log(`${logPrefix} Maradék szöveg: "${remainingText}"`);

    // 4️⃣ STRATÉGIA MEGHATÁROZÁSA
    const { type, strategy } = determineQueryStrategy(geoMatch, topicKeywords);
    console.log(`${logPrefix} Stratégia: ${type} → ${strategy}`);

    // 5️⃣ RÉGIÓ ORSZÁGOK LEKÉRÉSE (ha szükséges)
    let regionCountries: string[] | undefined;
    if (geoMatch?.type === 'region') {
      regionCountries = getRegionCountries(geoMatch.code);
      console.log(`${logPrefix} Régió országok:`, regionCountries);
    }

    // 6️⃣ BIZTONSÁG SZÁMÍTÁSA
    const confidence = calculateQueryConfidence(geoMatch, topicKeywords, remainingText);

    const endTime = performance.now();
    const processingTime = Math.round(endTime - startTime);

    console.log(
      `${logPrefix} Elemzés befejezve ${processingTime}ms alatt (confidence: ${confidence})`,
    );

    // 7️⃣ EREDMÉNY ÖSSZEÁLLÍTÁSA
    const result: GeoQueryResult = {
      type,
      strategy,
      language,
      geoMatch,
      regionCountries,
      topicKeywords,
      remainingText,
      originalQuery: query,
      confidence,
      isValid: true,
    };

    return result;
  } catch (error) {
    console.error(`${logPrefix} Hiba a geo-query elemzésében:`, error);
    return createErrorResult(query, language, `Elemzési hiba: ${error}`);
  }
};

/**
 * 🔍 LEGHOSSZABB GEO-EGYEZÉS KERESÉSE
 * Többszavas geo-kifejezéseket is felismer (pl. "közel-kelet", "egyesült államok")
 */
const findLongestGeoMatch = (
  tokens: string[],
  language: SupportedLanguage,
): GeoMatchResult | null => {
  // Próbáljuk a leghosszabb kombinációkat először
  for (let length = Math.min(tokens.length, 3); length >= 1; length--) {
    for (let start = 0; start <= tokens.length - length; start++) {
      const candidatePhrase = tokens.slice(start, start + length).join(' ');

      if (language === 'hu') {
        const match = detectGeoTermHU(candidatePhrase);
        if (match) {
          return match;
        }
      }
      // További nyelvek itt jönnek majd...
    }
  }

  return null;
};

/**
 * 🎯 KULCSSZÓ KINYERÉSE ÉS TISZTÍTÁSA
 */
const extractTopicKeywords = (
  tokens: string[],
  geoMatches: string[],
): { topicKeywords: string[]; remainingText: string } => {
  // Geo-kifejezések eltávolítása
  const filteredTokens = tokens.filter((token) => {
    return !geoMatches.some(
      (geoMatch) =>
        geoMatch.toLowerCase().includes(token) || token.includes(geoMatch.toLowerCase()),
    );
  });

  // Kulcsszavak azonosítása
  const topicKeywords = filteredTokens.filter((token) => HU_TOPIC_KEYWORDS.includes(token));

  // Maradék szöveg (geo + kulcsszavak nélkül)
  const remainingTokens = filteredTokens.filter((token) => !topicKeywords.includes(token));

  return {
    topicKeywords,
    remainingText: remainingTokens.join(' '),
  };
};

/**
 * 🎯 KERESÉSI STRATÉGIA MEGHATÁROZÁSA
 */
const determineQueryStrategy = (
  geoMatch: GeoMatchResult | null,
  topicKeywords: string[],
): { type: QueryType; strategy: SearchStrategy } => {
  const hasGeo = geoMatch !== null;
  const hasTopic = topicKeywords.length > 0;

  if (!hasGeo && !hasTopic) {
    return { type: 'unknown', strategy: 'unknown' };
  }

  if (hasGeo && !hasTopic) {
    // Csak geo-keresés
    switch (geoMatch!.type) {
      case 'country':
        return { type: 'geo_only', strategy: 'country_only' };
      case 'continent':
        return { type: 'geo_only', strategy: 'continent_only' };
      case 'region':
        return { type: 'geo_only', strategy: 'region_only' };
    }
  }

  if (!hasGeo && hasTopic) {
    // Csak kulcsszó-keresés
    return { type: 'topic_only', strategy: 'topic_only' };
  }

  if (hasGeo && hasTopic) {
    // Hibrid keresés
    switch (geoMatch!.type) {
      case 'country':
        return { type: 'hybrid', strategy: 'country_with_keywords' };
      case 'continent':
        return { type: 'hybrid', strategy: 'country_with_keywords' }; // Kontinens is hasonló
      case 'region':
        return { type: 'hybrid', strategy: 'region_with_keywords' };
    }
  }

  return { type: 'unknown', strategy: 'unknown' };
};

/**
 * 📊 BIZTONSÁG SZÁMÍTÁSA
 */
const calculateQueryConfidence = (
  geoMatch: GeoMatchResult | null,
  topicKeywords: string[],
  remainingText: string,
): number => {
  let confidence = 0;

  // Geo-találat súlyozása
  if (geoMatch) {
    confidence += geoMatch.confidence * 0.6; // 60% súly
  }

  // Kulcsszavak súlyozása
  if (topicKeywords.length > 0) {
    confidence += Math.min(topicKeywords.length * 0.2, 0.3); // Max 30% súly
  }

  // Maradék szöveg levonása (ismeretlen elemek)
  if (remainingText.trim().length > 0) {
    confidence -= 0.1; // 10% levonás ismeretlen szövegért
  }

  return Math.max(0, Math.min(1, confidence));
};

/**
 * ❌ HIBA EREDMÉNY LÉTREHOZÁSA
 */
const createErrorResult = (
  query: string,
  language: SupportedLanguage,
  errorMessage: string,
): GeoQueryResult => {
  return {
    type: 'unknown',
    strategy: 'unknown',
    language,
    geoMatch: null,
    topicKeywords: [],
    remainingText: query,
    originalQuery: query,
    confidence: 0,
    isValid: false,
    errorMessage,
  };
};

/**
 * 🧪 TESZT FÜGGVÉNY - Geo-query felismerés tesztelése
 */
export const testGeoQueryDetection = (): void => {
  const testCases = [
    // Csak geo
    'oroszország',
    'európa',
    'közel-kelet',

    // Csak kulcsszó
    'gazdasági válság',
    'választások',

    // Hibrid
    'orosz gazdaság',
    'közel-keleti válság',
    'európai politika',
    'német háború',

    // Komplex
    'közel-keleti gazdasági válság',

    // Negatív tesztek
    'xyz abc',
    '',
  ];

  console.log('🧪 Geo-query felismerés tesztje:');
  console.log('=========================================');

  testCases.forEach((testCase) => {
    console.log(`\n🔍 Teszt: "${testCase}"`);
    const result = detectGeoQuery(testCase, 'hu');

    console.log(`   Típus: ${result.type}`);
    console.log(`   Stratégia: ${result.strategy}`);
    console.log(`   Biztonság: ${(result.confidence * 100).toFixed(1)}%`);

    if (result.geoMatch) {
      console.log(`   Geo: ${result.geoMatch.type} → ${result.geoMatch.code}`);
    }

    if (result.topicKeywords.length > 0) {
      console.log(`   Kulcsszavak: ${result.topicKeywords.join(', ')}`);
    }

    if (result.regionCountries && result.regionCountries.length > 0) {
      console.log(`   Régió országok: ${result.regionCountries.slice(0, 3).join(', ')}...`);
    }

    if (!result.isValid) {
      console.log(`   ❌ Hiba: ${result.errorMessage}`);
    }
  });

  console.log('\n=========================================');
};
