export { DataManager, DataArea } from './manager';
export { DataType } from './types';
export type { DataOptions, CacheOptions, LegacyStorageOptions } from './types'; // LegacyStorageOptions exportálása

// Cache modul exportok - EGYSZERŰSÍTETT (törölt fájlok után)
export { CacheProfiles } from './cache';

// Storage modul exportok - egyszerűsített a névütközés eltávolítása után
export { StorageAdapter, StorageProfiles } from './storage';
export type { StorageOptions } from './storage/types'; // Aktív StorageOptions exportálása

// LocalStorage modul exportok - egyszerűsített a névütközés eltávolítása után
export { LocalStorageAdapter, LocalStorageProfiles } from './localStorage';
