/**
 * Storage-specifikus típusok és interfészek
 */

/**
 * Storage opciók
 */
export interface StorageOptions {
  namespace?: string; // Névtér a storage kulcsokhoz
  persistent?: boolean; // Tartós tárolás (pl. IndexedDB) használata
  storeName?: string; // Hozzáadva az IndexedDB store nevének megadásához
}
