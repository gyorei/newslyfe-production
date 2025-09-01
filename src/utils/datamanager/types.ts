/**
 * Deprecated típusok tisztítva - a backward compatibility érdekében csak a szükséges típusok maradnak
 * Az aktív típusokat használd az egyes modulokból:
 * - CacheOptions: cache/types.ts
 * - StorageOptions: storage/types.ts
 * - LocalStorageOptions: localStorage/types.ts
 * - DataArea: manager.ts
 */

/**
 * @deprecated Használd helyette a DataArea enum-ot a manager.ts-ből
 * Megtartva csak backward compatibility miatt - fokozatosan eltávolítandó
 */
export enum DataType {
  CACHE = 'cache',
  STORAGE = 'storage',
}

/**
 * @deprecated Csak kritikus backward compatibility esetén
 * Használd helyette a DataArea alapú megoldást a manager.ts-ből
 */
export interface BaseDataOptions {
  type: DataType;
  namespace?: string;
}

/**
 * @deprecated Használd helyette a CacheOptions-t a cache/types.ts-ből
 * Megtartva csak backward compatibility miatt
 */
export interface CacheOptions extends BaseDataOptions {
  type: DataType.CACHE;
  ttl?: number;
  priority?: number;
}

/**
 * @deprecated Használd helyette a StorageOptions-t a storage/types.ts-ből
 * Átnevezve LegacyStorageOptions-ra a névütközés elkerülése érdekében
 */
export interface LegacyStorageOptions extends BaseDataOptions {
  type: DataType.STORAGE;
  persistent?: boolean;
}

/**
 * @deprecated Használd helyette a DataArea alapú megoldást a manager.ts-ből
 * Csak kritikus backward compatibility esetén használd
 */
export type DataOptions = CacheOptions | LegacyStorageOptions;
