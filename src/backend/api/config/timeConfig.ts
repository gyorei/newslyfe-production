/**
 * Egységes időkezelési konfiguráció
 *
 * Ez a konfiguráció mindhárom hírlekérdezési API modulhoz tartozik:
 * - Local (helyi hírek)
 * - Country (országos hírek)
 * - Continent (kontinens hírek)
 */

/**
 * Időszűrés alapértelmezett és határértékek (órában)
 */
export const TIME_CONFIG = {
  // Alapértelmezett értékek
  DEFAULT_MAX_AGE_HOURS: 24, // Alapértelmezett: 24 óra

  // Minimum és maximum határértékek
  MIN_AGE_HOURS: 1, // Minimum: 1 óra
  MAX_AGE_HOURS: 168, // Maximum: 1 hét (7*24 óra)

  // Előre definiált időintervallum opciók a frontend számára
  PRESET_OPTIONS: [
    { label: 'Utolsó 1 óra', hours: 1 },
    { label: 'Utolsó 6 óra', hours: 6 },
    { label: 'Utolsó 24 óra', hours: 24 }, // ← alapértelmezett
    { label: 'Utolsó 3 nap', hours: 72 },
    { label: 'Utolsó hét', hours: 168 },
  ],
};

/**
 * Paraméter nevek az API végpontokhoz
 */
export const TIME_PARAM_NAMES = {
  MAX_AGE_HOURS: 'maxAgeHours',
  CUTOFF_TIMESTAMP: 'cutoffTimestamp',
};

/**
 * Hibaüzenetek az idővalidáláshoz
 */
export const TIME_ERROR_MESSAGES = {
  INVALID_FORMAT: 'Az időintervallum formátuma érvénytelen',
  TOO_SHORT: `Az időintervallum túl rövid. Minimum ${TIME_CONFIG.MIN_AGE_HOURS} óra szükséges`,
  TOO_LONG: `Az időintervallum túl hosszú. Maximum ${TIME_CONFIG.MAX_AGE_HOURS} óra megengedett`,
  NEGATIVE_VALUE: 'Az időintervallum nem lehet negatív érték',
};
