/**
 * Migráció kezelő a News alkalmazás storage rendszeréhez
 */
import { migrateFromV1toV2 } from './v1ToV2';
import { StorageConfig } from '../config';
import { logger } from '../utils/logger';

interface MigrationFn {
  fromVersion: string;
  toVersion: string;
  migrate: () => Promise<void>;
}

// Az összes migráció regisztrálása
const migrations: MigrationFn[] = [
  {
    fromVersion: '1.0',
    toVersion: '2.0',
    migrate: migrateFromV1toV2,
  },
];

/**
 * Az aktuális verzió lekérése a localStorage-ból
 */
export function getCurrentVersion(): string {
  try {
    const stateString = localStorage.getItem(StorageConfig.KEYS.LOCAL_STATE);
    if (!stateString) return '2.0'; // Új telepítésnél már a legújabb verziót használjuk

    const state = JSON.parse(stateString);
    return state.version || '1.0'; // Ha nincs verzió megadva, feltételezzük, hogy 1.0
  } catch (error) {
    logger.error('Verzió lekérése sikertelen:', error);
    return '2.0'; // Hiba esetén feltételezzük, hogy új telepítés
  }
}

/**
 * Migrációk futtatása a jelenlegi verzióról a cél verzióra
 */
export async function runMigrations(targetVersion: string = '2.0'): Promise<void> {
  try {
    const currentVersion = getCurrentVersion();

    logger.info(`Migrációk ellenőrzése: ${currentVersion} -> ${targetVersion}`);

    if (currentVersion === targetVersion) {
      logger.info('Nincs szükség migrációra, a verzió már aktuális.');
      return;
    }

    // Megkeressük a megfelelő migrációs útvonalakat
    const migrationsToRun = findMigrationPath(currentVersion, targetVersion, migrations);

    if (!migrationsToRun.length) {
      logger.warn(`Nincs elérhető migrációs útvonal: ${currentVersion} -> ${targetVersion}`);
      return;
    }

    // Végighaladunk a migrációs útvonalon
    logger.info(
      `Migrációs útvonal: ${migrationsToRun.map((m) => `${m.fromVersion} -> ${m.toVersion}`).join(' -> ')}`,
    );

    for (const migration of migrationsToRun) {
      logger.info(`Migráció végrehajtása: ${migration.fromVersion} -> ${migration.toVersion}`);
      await migration.migrate();
      logger.info(
        `Migráció sikeresen befejezve: ${migration.fromVersion} -> ${migration.toVersion}`,
      );
    }

    logger.info('Minden migráció sikeresen végrehajtva.');
  } catch (error) {
    logger.error('Hiba a migrációk végrehajtása során:', error);
    throw error;
  }
}

/**
 * Verzió összehasonlítás szemantikus verziókezeléshez
 */
export function isVersionLessThan(versionA: string, versionB: string): boolean {
  const partsA = versionA.split('.').map(Number);
  const partsB = versionB.split('.').map(Number);

  for (let i = 0; i < Math.max(partsA.length, partsB.length); i++) {
    const valueA = i < partsA.length ? partsA[i] : 0;
    const valueB = i < partsB.length ? partsB[i] : 0;

    if (valueA < valueB) return true;
    if (valueA > valueB) return false;
  }

  return false;
}

/**
 * Komplex migrációs útvonal keresése egy kezdő és egy cél verzió között
 */
export function findMigrationPath(
  fromVersion: string,
  toVersion: string,
  availableMigrations: MigrationFn[],
): MigrationFn[] {
  // Ha már a célverziónál vagyunk, nincs szükség migrációra
  if (fromVersion === toVersion) {
    return [];
  }

  // Közvetlen migráció keresése
  const directMigration = availableMigrations.find(
    (m) => m.fromVersion === fromVersion && m.toVersion === toVersion,
  );

  if (directMigration) {
    return [directMigration];
  }

  // Rekurzív migrációs útvonal keresése
  const possibleIntermediateMigrations = availableMigrations.filter(
    (m) => m.fromVersion === fromVersion && isVersionLessThan(m.toVersion, toVersion),
  );

  // Sorrendezés: mindig a legnagyobb ugrást választjuk először
  possibleIntermediateMigrations.sort((a, b) => {
    const partsA = a.toVersion.split('.').map(Number);
    const partsB = b.toVersion.split('.').map(Number);

    for (let i = 0; i < Math.max(partsA.length, partsB.length); i++) {
      const valueA = i < partsA.length ? partsA[i] : 0;
      const valueB = i < partsB.length ? partsB[i] : 0;

      if (valueA !== valueB) {
        return valueB - valueA; // Csökkenő sorrend
      }
    }

    return 0;
  });

  // Rekurzív keresés a lehetséges közvetítő migrációkon keresztül
  for (const migration of possibleIntermediateMigrations) {
    const remainingPath = findMigrationPath(migration.toVersion, toVersion, availableMigrations);

    if (remainingPath.length > 0 || migration.toVersion === toVersion) {
      return [migration, ...remainingPath];
    }
  }

  // Nem találtunk útvonalat
  logger.warn(`Nem találtunk migrációs útvonalat: ${fromVersion} -> ${toVersion}`);
  return [];
}
