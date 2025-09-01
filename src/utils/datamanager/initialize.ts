/**
 * Storage rendszer inicializálása a News alkalmazáshoz
 */

/*
import { StorageConfig } from './config';
import { storageManager } from './storageManager';
import { runMigrations } from './migrations/index';
import { logger } from './utils/logger';
*/

import { DataManager } from './manager';
import { logger } from './utils/logger';
import { StorageConfig } from './config';

/**
 * Storage rendszer inicializálása
 * @param options - Inicializációs opciók
 */
export async function initializeStorage(
  options: { runMigrations?: boolean; autoSync?: boolean } = {},
): Promise<void> {
  const { runMigrations: shouldRunMigrations = true, autoSync = false } = options;

  try {
    logger.info('Storage rendszer inicializálása...');

    // DataManager inicializálása
    await DataManager.getInstance().initialize();

    // Migrációk futtatása, ha szükséges - EGYELŐRE KOMMENTÁLVA
    if (shouldRunMigrations) {
      // await runMigrations(); // TODO: Migrációs logika felülvizsgálata és implementálása az új DataManager rendszerrel
      logger.info('Migrációk futtatása kihagyva (TODO)');
    }

    // Automatikus szinkronizáció beállítása
    if (autoSync && navigator.onLine) {
      setupAutoSync();
    }

    // Eseményfigyelők beállítása
    setupEventListeners();

    logger.info('Storage rendszer inicializálva.');
  } catch (error: unknown) {
    // error típusozása
    logger.error(
      'Hiba a storage rendszer inicializálása során:',
      error instanceof Error ? error.message : String(error),
    ); // Harmadik argumentum eltávolítva
    throw error;
  }
}

/**
 * Automatikus szinkronizáció beállítása
 */
function setupAutoSync(): void {
  // Indítunk egy azonnali szinkronizációt kis késleltetéssel
  setTimeout(() => {
    DataManager.getInstance()
      .syncNow()
      .then(() => logger.info('Kezdeti szinkronizáció sikeres'))
      .catch((err: unknown) =>
        logger.warn(
          'Kezdeti szinkronizáció sikertelen:',
          err instanceof Error ? err.message : String(err),
        ),
      ); // err típusozása
  }, 2000);

  // Periodikus szinkronizáció beállítása
  setInterval(() => {
    if (navigator.onLine) {
      DataManager.getInstance()
        .syncNow()
        .catch((err: unknown) =>
          logger.warn(
            'Periodikus szinkronizáció sikertelen:',
            err instanceof Error ? err.message : String(err),
          ),
        ); // err típusozása
    }
  }, StorageConfig.SYNC.AUTO_SYNC_INTERVAL);
}

/**
 * Eseményfigyelők beállítása
 */
function setupEventListeners(): void {
  // Online/Offline események kezelése
  window.addEventListener('online', () => {
    logger.info('Online állapot - szinkronizálás indítása');
    DataManager.getInstance()
      .syncNow()
      .catch((err: unknown) => {
        // err típusozása
        logger.warn(
          'Online szinkronizáció sikertelen:',
          err instanceof Error ? err.message : String(err),
        );
      });
  });

  window.addEventListener('offline', () => {
    logger.info('Offline állapot detektálva');
  });

  // Alkalmazás bezárása előtt
  window.addEventListener('beforeunload', () => {
    logger.info('Alkalmazás bezárása - véglegesítés');
    // Itt lehetne menteni még nem mentett adatokat
  });
}
