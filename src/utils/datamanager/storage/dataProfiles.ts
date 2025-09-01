import { StorageOptions } from './types';

/**
 * Előre definiált storage profilok
 */
export const StorageProfiles = {
  // Perzisztens tárolás (localStorage)
  PERSIST: {
    persistent: false, // Alapértelmezett localStorage
  } as StorageOptions,

  // Perzisztens tárolás (IndexedDB, ha elérhető)
  PERSIST_INDEXED: {
    persistent: true, // IndexedDB használata
  } as StorageOptions,

  // Felhasználói beállítások
  USER_SETTINGS: {
    namespace: 'settings',
    persistent: true,
  } as StorageOptions,

  // Mentett hírek
  SAVED_NEWS: {
    namespace: 'news',
    persistent: true,
  } as StorageOptions,
};
