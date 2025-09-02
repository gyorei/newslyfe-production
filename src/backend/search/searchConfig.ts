// src/backend/api/routes/Search/searchConfig.ts

export interface LanguageConfig {
    config: string; // A PostgreSQL text search konfiguráció neve
    vector: string; // A 'news' táblában lévő tsvector oszlop neve
  }
  
  // A rendszer által támogatott nyelvek központi definíciója
  export const SUPPORTED_LANGUAGES: Record<string, LanguageConfig> = {
    en: { config: 'english', vector: 'search_vector_en' },
    hu: { config: 'hungarian', vector: 'search_vector_hu' },
 //   de: { config: 'german', vector: 'search_vector_de' },
 //   fr: { config: 'french', vector: 'search_vector_fr' },
 //   es: { config: 'spanish', vector: 'search_vector_es' },
 //   it: { config: 'italian', vector: 'search_vector_it' },
 //   pt: { config: 'portuguese', vector: 'search_vector_pt' },
 //   ro: { config: 'romanian', vector: 'search_vector_ro' },
 //   ru: { config: 'russian', vector: 'search_vector_ru' },
 //   tr: { config: 'turkish', vector: 'search_vector_tr' },
    // Új nyelvet ide kell hozzáadni.
  };
  
  // Segédfüggvény a validációhoz
  export function isValidLanguage(lang: string | undefined): lang is keyof typeof SUPPORTED_LANGUAGES {
    return typeof lang === 'string' && lang in SUPPORTED_LANGUAGES;
  }