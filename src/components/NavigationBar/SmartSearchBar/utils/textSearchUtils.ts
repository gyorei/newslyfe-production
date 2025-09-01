/**
 * 🌍 Többnyelvű Szövegnormalizálási Modul
 *
 * Támogatott nyelvek:
 * - 🇭🇺 Magyar (áéíóöőúüű)
 * - 🇷🇺 Orosz (Cirill betűk)
 * - 🇺🇦 Ukrán (Cirill betűk)
 * - 🇵🇱 Lengyel (ąćęłńóśźż)
 * - 🇨🇿 Cseh (áčďéěíňóřšťúůýž)
 * - 🇩🇪 Német (äöüß)
 * - 🇫🇷 Francia (àâäéèêëïîôùûüÿ)
 * - 🇪🇸 Spanyol (áéíñóúü)
 *
 * Használat:
 * ```typescript
 * const normalized = normalizeText("война в України");
 * // Result: "vojna v ukrajini"
 * ```
 */

/**
 * 🌍 Többnyelvű szövegfeldolgozó és kereső segédfüggvények (frontend kereséshez)
 *
 * Fő funkciók:
 * - normalizeText: Szöveg normalizálása (ékezetek, cirill betűk eltávolítása/átírása)
 * - detectTextLanguage: Szöveg nyelvének felismerése (latin, cirill, vegyes)
 * - prepareSearchTerms: Keresési kifejezések előkészítése, normalizálása
 * - getTextStats: Szöveg statisztikák (nyelv, normalizált változat, szavak száma stb.)
 * - testNormalization: Tesztfüggvény többnyelvű normalizálás ellenőrzésére
 *
 * Ezeket a függvényeket a tabon belüli kereső (SmartSearchBar, useFrontendSearch) használja,
 * hogy a keresés nyelvfüggetlen, pontos és gyors legyen.
 */

// 🔤 LATIN ÉKEZETEK MAPPING
const LATIN_ACCENTS_MAP: Record<string, string> = {
  // Magyar ékezetek
  á: 'a',
  à: 'a',
  â: 'a',
  ä: 'a',
  ã: 'a',
  å: 'a',
  ą: 'a',
  é: 'e',
  è: 'e',
  ê: 'e',
  ë: 'e',
  ę: 'e',
  ě: 'e',
  í: 'i',
  ì: 'i',
  î: 'i',
  ï: 'i',
  ı: 'i',
  ó: 'o',
  ò: 'o',
  ô: 'o',
  ö: 'o',
  õ: 'o',
  ø: 'o',
  ő: 'o',
  ú: 'u',
  ù: 'u',
  û: 'u',
  ü: 'u',
  ű: 'u',
  ů: 'u',
  ý: 'y',
  ÿ: 'y',

  // Speciális karakterek
  ç: 'c',
  ć: 'c',
  č: 'c',
  ñ: 'n',
  ń: 'n',
  ň: 'n',
  š: 's',
  ş: 's',
  ś: 's',
  ž: 'z',
  ź: 'z',
  ż: 'z',
  ł: 'l',
  đ: 'd',
  ď: 'd',
  ř: 'r',
  ť: 't',
  ß: 'ss', // Német eszett
};

// 🔤 CIRILL BETŰK MAPPING (Orosz, Ukrán, Bolgár, Szerb)
const CYRILLIC_MAP: Record<string, string> = {
  // Alapvető cirill betűk
  а: 'a',
  б: 'b',
  в: 'v',
  г: 'g',
  д: 'd',
  е: 'e',
  ё: 'e',
  ж: 'zh',
  з: 'z',
  и: 'i',
  й: 'j',
  к: 'k',
  л: 'l',
  м: 'm',
  н: 'n',
  о: 'o',
  п: 'p',
  р: 'r',
  с: 's',
  т: 't',
  у: 'u',
  ф: 'f',
  х: 'h',
  ц: 'c',
  ч: 'ch',
  ш: 'sh',
  щ: 'sch',
  ъ: '',
  ы: 'y',
  ь: '',
  э: 'e',
  ю: 'yu',
  я: 'ya',

  // Ukrán speciális betűk
  є: 'ye',
  і: 'i',
  ї: 'yi',
  ґ: 'g',

  // Bolgár/Szerb speciális betűk
  ј: 'j',
  љ: 'lj',
  њ: 'nj',
  ћ: 'c',
  ђ: 'dj',
};

// 🌍 NYELVFELISMERÉS ENUM
export enum TextLanguage {
  LATIN = 'latin',
  CYRILLIC = 'cyrillic',
  MIXED = 'mixed',
  UNKNOWN = 'unknown',
}

/**
 * 🔍 Szöveg nyelvének felismerése
 */
export const detectTextLanguage = (text: string): TextLanguage => {
  const cleanText = text.replace(/[0-9\s\p{P}]/gu, ''); // Számok, szóközök, írásjelek eltávolítása

  const latinChars = cleanText.match(/[a-zA-ZáéíóöőúüűÁÉÍÓÖŐÚÜŰ]/g)?.length || 0;
  const cyrillicChars = cleanText.match(/[а-яё]/gi)?.length || 0;
  const totalChars = cleanText.length;

  if (totalChars === 0) return TextLanguage.UNKNOWN;

  const latinRatio = latinChars / totalChars;
  const cyrillicRatio = cyrillicChars / totalChars;

  if (latinRatio > 0.8) return TextLanguage.LATIN;
  if (cyrillicRatio > 0.8) return TextLanguage.CYRILLIC;
  if (latinRatio > 0.3 && cyrillicRatio > 0.3) return TextLanguage.MIXED;

  return TextLanguage.UNKNOWN;
};

/**
 * 🔤 Szöveg normalizálása - többnyelvű támogatással
 */
export const normalizeText = (text: string): string => {
  if (!text || typeof text !== 'string') return '';

  let normalized = text.toLowerCase();

  // 1️⃣ LATIN ÉKEZETEK ELTÁVOLÍTÁSA
  Object.entries(LATIN_ACCENTS_MAP).forEach(([accented, base]) => {
    const regex = new RegExp(accented, 'g');
    normalized = normalized.replace(regex, base);
  });

  // 2️⃣ CIRILL BETŰK ÁTÍRÁSA
  Object.entries(CYRILLIC_MAP).forEach(([cyrillic, latin]) => {
    const regex = new RegExp(cyrillic, 'g');
    normalized = normalized.replace(regex, latin);
  });

  // 3️⃣ EXTRA TISZTÍTÁS
  normalized = normalized
    .replace(/\s+/g, ' ') // Többszörös szóközök egyre
    .replace(/[^\w\s]/g, ' ') // Speciális karakterek szóközre
    .trim(); // Elejéről és végéről szóköz

  return normalized;
};

/**
 * 🔍 Keresési kifejezések előkészítése
 */
export const prepareSearchTerms = (query: string, minLength: number = 2): string[] => {
  if (!query || typeof query !== 'string') return [];

  return query
    .toLowerCase()
    .trim()
    .split(/\s+/) // Szóközök alapján szétbontás
    .filter((term) => term.length >= minLength) // Minimum hossz szűrés
    .map((term) => normalizeText(term)) // Normalizálás
    .filter((term) => term.length >= minLength); // Ismételt szűrés a normalizálás után
};

/**
 * 🧪 Teszt függvény - különböző nyelvek tesztelése
 */
export const testNormalization = (): void => {
  const testCases = [
    // Magyar
    { input: 'háború gazdaság', expected: 'haboru gazdasag' },
    { input: 'Üzleti hírek', expected: 'uzleti hirek' },

    // Orosz
    { input: 'война в России', expected: 'vojna v rossii' },
    { input: 'экономика Москва', expected: 'ekonomika moskva' },

    // Ukrán
    { input: 'війна в Україні', expected: 'vijna v ukrajini' },

    // Lengyel
    { input: 'Łódź może być', expected: 'lodz moze byc' },

    // Vegyes
    { input: 'NATO và Россия', expected: 'nato va rossiya' },
  ];

  console.log('🧪 Normalizálási tesztek:');
  testCases.forEach(({ input, expected }) => {
    const result = normalizeText(input);
    const status = result === expected ? '✅' : '❌';
    console.log(`${status} "${input}" → "${result}" (várt: "${expected}")`);
  });
};

/**
 * 📊 Szöveg statisztikák
 */
export const getTextStats = (text: string) => {
  const language = detectTextLanguage(text);
  const normalized = normalizeText(text);
  const terms = prepareSearchTerms(text);

  return {
    original: text,
    language,
    normalized,
    terms,
    termCount: terms.length,
    charCount: text.length,
    normalizedCharCount: normalized.length,
  };
};
