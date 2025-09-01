import { LocalStorageOptions } from './types';

/**
 * Előre definiált localStorage profilok
 */
export const LocalStorageProfiles = {
  // Alapértelmezett localStorage profil
  DEFAULT: {
    // Nincs külön beállítás szükséges
  } as LocalStorageOptions,

  // Időkorlátos localStorage (1 nap)
  SHORT_TERM: {
    expiry: 86400, // 1 nap másodpercekben (24 * 60 * 60)
  } as LocalStorageOptions,

  // Hosszú távú localStorage (30 nap)
  LONG_TERM: {
    expiry: 2592000, // 30 nap másodpercekben (30 * 24 * 60 * 60)
  } as LocalStorageOptions,

  // Felhasználói beállítások
  USER_PREFERENCES: {
    namespace: 'prefs',
  } as LocalStorageOptions,

  // Űrlap ideiglenes mentés
  FORM_STATE: {
    namespace: 'forms',
    expiry: 3600, // 1 óra másodpercekben
  } as LocalStorageOptions,
};
