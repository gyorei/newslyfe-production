/**
 * V1-ről V2-re migrációs szkript a News alkalmazás storage rendszeréhez
 */
import { logger } from '../utils/logger';
import { LocalStorageData, TabDefinition } from '../types/storage';
import { migrateHelpers, cleanupOldLocalStorageKeys } from './helpers';

// Opcionálisan definiálunk egy típust a régi tab formátumhoz
interface OldTabV1 {
  id?: string;
  title?: string;
  type?: string;
  params?: Record<string, unknown>;
  [key: string]: unknown;
}

/**
 * Legfőbb migrációs függvény
 */
export async function migrateFromV1toV2(): Promise<void> {
  logger.info('V1 -> V2 migráció indítása...');

  // Régi lokális tárolt adatok beolvasása
  const oldStorageData = localStorage.getItem('news-app-v1');
  if (!oldStorageData) {
    logger.info('Nincs V1 adat a migráláshoz');
    return;
  }

  try {
    // Régi adatok konvertálása
    const v1State = JSON.parse(oldStorageData);
    logger.debug('V1 adatok betöltve', v1State);

    // Migrációs lépések
    const migratedData: LocalStorageData = {
      version: '2.0',
      timestamp: Date.now(),

      // Tab adatok migrálása
      tabs: migrateTabsData(v1State),

      // UI állapot migrálása
      ui: {
        panelStates: {
          left: v1State.leftPanelOpen || true,
          right: v1State.rightPanelOpen || false,
        },
        utilityMode: v1State.viewMode || 'standard',
      },

      // Eszköz beállítások migrálása
      devicePreferences: {
        fontSize: v1State.fontSize || 16,
        darkMode: migrateHelpers.detectDarkMode(v1State),
      },
    };

    // Új adatok mentése
    localStorage.setItem('news-app-state', JSON.stringify(migratedData));
    logger.info('V2 adatok mentve', migratedData);

    // Régi kulcsok törlése
    await cleanupOldLocalStorageKeys(['news-app-v1', 'news-settings-v1']);

    logger.info('V1 -> V2 migráció befejezve');
  } catch (error) {
    logger.error('Hiba történt a V1 -> V2 migrációban:', error);
    throw new Error('Migráció sikertelen');
  }
}

/**
 * Tabok migrálása V1 formátumból V2-be
 */
function migrateTabsData(v1State: Record<string, unknown>): NonNullable<LocalStorageData['tabs']> {
  // V1-ben az aktív tab azonosító
  const activeTabId = (v1State.activeTabId as string) || 'default';

  // V1-ben a mentett tabok
  const oldTabs = v1State.tabs || [];
  let definitions: TabDefinition[] = [];

  // Ha vannak régi tabok, azokat migráljuk
  if (Array.isArray(oldTabs) && oldTabs.length > 0) {
    definitions = oldTabs.map((tab: OldTabV1) => {
      // A régi mode/type értéket konvertáljuk az új format szerint
      let validMode: 'feed' | 'article' | 'search' | 'saved' = 'feed';

      // Ellenőrizzük a mode értékét és megfelelő literálra konvertáljuk
      if (tab.type === 'article' || tab.type === 'search' || tab.type === 'saved') {
        validMode = tab.type;
      }

      return {
        id: tab.id || crypto.randomUUID(),
        title: tab.title || 'Migrated Tab',
        mode: validMode,
        params: convertParamsToStrings(tab.params || {}),
      };
    });
  } else {
    // Ha nincs tab, létrehozunk egy alapértelmezettet
    definitions.push({
      id: 'default',
      title: 'Főoldal',
      mode: 'feed',
    });
  }

  // Aktív tab létezésének ellenőrzése
  const finalActiveId = definitions.some((tab) => tab.id === activeTabId)
    ? activeTabId
    : definitions[0]?.id || 'default';

  return {
    activeId: finalActiveId,
    definitions: definitions,
  };
}

/**
 * Segédfüggvény a paraméter konvertáláshoz
 * Minden értéket string-gé konvertál a típuskompatibilitás biztosításához
 */
function convertParamsToStrings(params: Record<string, unknown>): Record<string, string> {
  const result: Record<string, string> = {};
  for (const key in params) {
    const value = params[key];
    result[key] = String(value); // minden értéket string-gé konvertálunk
  }
  return result;
}

/**
 * IndexedDB migráció
 * (Ez az IndexedDB adatok migrálását is elvégzi, pl. olvasott cikkek, stb.)
 */
export async function migrateIndexedDBV1toV2(): Promise<void> {
  logger.info('IndexedDB V1 -> V2 migráció indítása...');
  // TODO: implementáljuk az IndexedDB migrációt
  logger.info('IndexedDB V1 -> V2 migráció befejezve.');
}
