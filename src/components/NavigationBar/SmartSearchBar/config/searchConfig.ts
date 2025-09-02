/**
 * 🔧 KERESÉSI KONFIGURÁCIÓ RENDSZER
 *
 * Különböző keresési módok és beállítások egy helyen.
 * A useFrontendSearch hook rugalmasan konfigurálható ezen beállítások alapján.
 *
 * Használat:
 * ```typescript
 * const { performSearch } = useFrontendSearch(RELAXED_SEARCH_CONFIG);
 * ```
 */

// 🎯 KERESÉSI KONFIGURÁCIÓ TÍPUS DEFINÍCIÓ
export interface SearchConfig {
  /** Szigorú keresési mód - minden kifejezésnek jelen kell lennie ugyanabban a mezőben */
  strictMode: boolean;

  /** Mezők súlyozása a relevancia számításnál */
  scoreWeights: {
    /** Cím találat súlya (alapértelmezett: 5) */
    title: number;
    /** Leírás találat súlya (alapértelmezett: 2) */
    description: number;
    /** Forrás találat súlya (alapértelmezett: 3) */
    source: number;
  };

  /** Bónusz pontok speciális esetekre */
  bonuses: {
    /** Pontos egyezés bonus - ha a cím a keresett kifejezéssel kezdődik */
    exactStart: number;
    /** Közelségi bonus - ha a keresett szavak egymás mellett vannak */
    proximity: number;
  };

  /** Minimum keresési kifejezés hossz karakterben */
  minSearchLength: number;

  /** Maximum találatok száma (teljesítmény optimalizálás) */
  maxResults?: number;

  /** Debug logging engedélyezése */
  enableDebugLogging?: boolean;

  /** Keresési timeout milliszekundumban */
  searchTimeout?: number;

  /** Cache engedélyezése (jövőbeli funkció) */
  enableCache?: boolean;
}

// 🎯 ALAPÉRTELMEZETT STRICT KONFIGURÁCIÓ
export const DEFAULT_STRICT_CONFIG: SearchConfig = {
  strictMode: true,
  scoreWeights: {
    title: 5, // Cím a legfontosabb
    description: 2, // Leírás közepes súly
    source: 3, // Forrás fontos
  },
  bonuses: {
    exactStart: 10, // Nagy bonus pontos egyezésért
    proximity: 8, // Közepes bonus közelségért
  },
  minSearchLength: 2,
  maxResults: 100,
  enableDebugLogging: true,
  searchTimeout: 5000,
  enableCache: false,
};

// 🎯 LAZA KERESÉSI KONFIGURÁCIÓ
export const RELAXED_SEARCH_CONFIG: SearchConfig = {
  strictMode: false,
  scoreWeights: {
    title: 2, // Cím kevésbé domináns
    description: 3, // Leírás fontosabb
    source: 1, // Forrás kevésbé fontos
  },
  bonuses: {
    exactStart: 5, // Kisebb bonus pontos egyezésért
    proximity: 3, // Kisebb bonus közelségért
  },
  minSearchLength: 1, // Rövidebb keresési kifejezések is megengedettek
  maxResults: 200,
  enableDebugLogging: false,
  searchTimeout: 3000,
  enableCache: true,
};

// 🎯 CÍM-KÖZPONTÚ KERESÉSI KONFIGURÁCIÓ
export const TITLE_FOCUSED_CONFIG: SearchConfig = {
  strictMode: true,
  scoreWeights: {
    title: 10, // Cím dominál
    description: 0, // Leírás nem számít
    source: 1, // Forrás minimális súly
  },
  bonuses: {
    exactStart: 15, // Extra nagy bonus pontos címegyezésért
    proximity: 10, // Nagy bonus közelségért címben
  },
  minSearchLength: 2,
  maxResults: 50,
  enableDebugLogging: true,
  searchTimeout: 2000,
  enableCache: false,
};

// 🎯 GYORS KERESÉSI KONFIGURÁCIÓ (ELŐNÉZET MÓDHOZ)
export const QUICK_SEARCH_CONFIG: SearchConfig = {
  strictMode: false,
  scoreWeights: {
    title: 3,
    description: 1,
    source: 1,
  },
  bonuses: {
    exactStart: 3,
    proximity: 2,
  },
  minSearchLength: 1,
  maxResults: 20, // Kevés eredmény gyors betöltéshez
  enableDebugLogging: false,
  searchTimeout: 1000, // Gyors timeout
  enableCache: true,
};

// 🎯 TELJES SZÖVEGES KERESÉSI KONFIGURÁCIÓ
export const FULL_TEXT_CONFIG: SearchConfig = {
  strictMode: false,
  scoreWeights: {
    title: 3,
    description: 5, // Leírás a legfontosabb
    source: 2,
  },
  bonuses: {
    exactStart: 7,
    proximity: 5,
  },
  minSearchLength: 3, // Hosszabb kifejezések teljes szöveges kereséshez
  maxResults: 150,
  enableDebugLogging: true,
  searchTimeout: 4000,
  enableCache: true,
};

// 🎯 KONFIGURÁCIÓ VALIDÁLÓ FÜGGVÉNY
export const validateSearchConfig = (config: Partial<SearchConfig>): boolean => {
  try {
    // Alapvető ellenőrzések
    if (config.minSearchLength && config.minSearchLength < 1) {
      console.warn('[searchConfig] minSearchLength nem lehet 1-nél kisebb');
      return false;
    }

    if (config.maxResults && config.maxResults < 1) {
      console.warn('[searchConfig] maxResults nem lehet 1-nél kisebb');
      return false;
    }

    if (config.searchTimeout && config.searchTimeout < 100) {
      console.warn('[searchConfig] searchTimeout nem lehet 100ms-nél kisebb');
      return false;
    }

    // Súlyozás ellenőrzés
    if (config.scoreWeights) {
      const { title, description, source } = config.scoreWeights;
      if (title < 0 || description < 0 || source < 0) {
        console.warn('[searchConfig] Súlyozások nem lehetnek negatívak');
        return false;
      }
    }

    // Bónusz ellenőrzés
    if (config.bonuses) {
      const { exactStart, proximity } = config.bonuses;
      if (exactStart < 0 || proximity < 0) {
        console.warn('[searchConfig] Bónuszok nem lehetnek negatívak');
        return false;
      }
    }

    return true;
  } catch (error) {
    console.error('[searchConfig] Konfiguráció validálási hiba:', error);
    return false;
  }
};

// 🎯 KONFIGURÁCIÓ ÖSSZEFÉSÜLŐ FÜGGVÉNY
export const mergeSearchConfig = (
  baseConfig: SearchConfig,
  customConfig: Partial<SearchConfig>,
): SearchConfig => {
  // Validálás
  if (!validateSearchConfig(customConfig)) {
    console.warn('[searchConfig] Érvénytelen konfiguráció, alapértelmezett használata');
    return baseConfig;
  }

  return {
    ...baseConfig,
    ...customConfig,
    // Nested objektumok mély összefésülése
    scoreWeights: {
      ...baseConfig.scoreWeights,
      ...(customConfig.scoreWeights || {}),
    },
    bonuses: {
      ...baseConfig.bonuses,
      ...(customConfig.bonuses || {}),
    },
  };
};

// 🎯 KONFIGURÁCIÓ TÍPUS EXPORT (TypeScript segítséghez)
export type SearchConfigKey = keyof SearchConfig;
export type ScoreWeights = SearchConfig['scoreWeights'];
export type SearchBonuses = SearchConfig['bonuses'];

// 🎯 ELŐRE DEFINIÁLT KONFIGURÁCIÓK GYŰJTEMÉNYE
export const PREDEFINED_CONFIGS = {
  STRICT: DEFAULT_STRICT_CONFIG,
  RELAXED: RELAXED_SEARCH_CONFIG,
  TITLE_FOCUSED: TITLE_FOCUSED_CONFIG,
  QUICK: QUICK_SEARCH_CONFIG,
  FULL_TEXT: FULL_TEXT_CONFIG,
} as const;

// 🎯 KONFIGURÁCIÓ NEVEK TÍPUSA
export type PredefinedConfigName = keyof typeof PREDEFINED_CONFIGS;

// 🧪 FEJLESZTŐI SEGÉDLET - KONFIGURÁCIÓ ÖSSZEHASONLÍTÁS
export const compareConfigs = (config1: SearchConfig, config2: SearchConfig): void => {
  console.log('🔧 Konfiguráció összehasonlítás:');
  console.table({
    'Strict Mode': { Config1: config1.strictMode, Config2: config2.strictMode },
    'Title Weight': { Config1: config1.scoreWeights.title, Config2: config2.scoreWeights.title },
    'Description Weight': {
      Config1: config1.scoreWeights.description,
      Config2: config2.scoreWeights.description,
    },
    'Source Weight': { Config1: config1.scoreWeights.source, Config2: config2.scoreWeights.source },
    'Exact Start Bonus': {
      Config1: config1.bonuses.exactStart,
      Config2: config2.bonuses.exactStart,
    },
    'Proximity Bonus': { Config1: config1.bonuses.proximity, Config2: config2.bonuses.proximity },
    'Min Search Length': { Config1: config1.minSearchLength, Config2: config2.minSearchLength },
    'Max Results': { Config1: config1.maxResults, Config2: config2.maxResults },
  });
};
