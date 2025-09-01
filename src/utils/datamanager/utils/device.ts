/**
 * Eszközazonosító kezelés a News alkalmazás perzisztencia rétegéhez
 * FRISSÍTVE: DataManager localStorage wrapper használatával
 */
import { StorageConfig } from '../config';
import { logger } from './logger';
import { DataManager } from '../manager';

// Típusdefiníciók a böngésző-specifikus API-khoz
interface NavigatorWithMemory extends Navigator {
  deviceMemory?: number;
}

interface NetworkInformation {
  type?: string;
  effectiveType?: string;
  downlinkMax?: number;
  downlink?: number;
  rtt?: number;
  saveData?: boolean;
}

interface NavigatorWithConnection extends Navigator {
  connection?: NetworkInformation;
  mozConnection?: NetworkInformation;
  webkitConnection?: NetworkInformation;
}

interface StorageEstimate {
  quota?: number;
  usage?: number;
  usageDetails?: Record<string, number>;
}

// Támogatott eszköz tulajdonságok lekérdezése
const deviceCapabilities = {
  localStorage: typeof localStorage !== 'undefined',
  indexedDB: typeof indexedDB !== 'undefined',
  serviceWorker: 'serviceWorker' in navigator,
  onlineStatus: typeof navigator.onLine === 'boolean',
  crypto: typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function',
};

/**
 * Generál vagy visszaad egy egyedi eszközazonosítót
 */
export async function getDeviceId(): Promise<string> {
  try {
    const dataManager = DataManager.getInstance();
    let deviceId = await dataManager.getItem<string>(StorageConfig.KEYS.DEVICE_ID);

    if (!deviceId) {
      if (deviceCapabilities.crypto) {
        deviceId = crypto.randomUUID();
      } else {
        // Fallback, ha nincs crypto API
        deviceId = `device-${Date.now()}-${Math.random().toString(36).substring(2, 10)}`;
      }

      await dataManager.setItem(StorageConfig.KEYS.DEVICE_ID, deviceId);
      logger.info(`Új eszközazonosító generálva: ${deviceId}`);
    }

    return deviceId;
  } catch (error) {
    // Fallback, ha localStorage nem elérhető
    logger.error('Eszközazonosító lekérése sikertelen:', error);
    return `temp-device-${Math.random().toString(36).substring(2, 10)}`;
  }
}

/**
 * Eszköz információk lekérdezése
 */
export async function getDeviceInfo(): Promise<{
  id: string;
  userAgent: string;
  platform: string;
  capabilities: typeof deviceCapabilities;
  isOnline: boolean;
}> {
  return {
    id: await getDeviceId(),
    userAgent: navigator.userAgent,
    platform: navigator.platform,
    capabilities: deviceCapabilities,
    isOnline: navigator.onLine,
  };
}

/**
 * Eszközazonosító visszaállítása (pl. kijelentkezéskor)
 */
export async function resetDeviceId(): Promise<void> {
  try {
    const dataManager = DataManager.getInstance();
    await dataManager.removeItem(StorageConfig.KEYS.DEVICE_ID);
    logger.info('Eszközazonosító törölve');
  } catch (error) {
    logger.error('Eszközazonosító törlése sikertelen:', error);
  }
}

/**
 * Ellenőrzi, hogy az eszköz támogatja-e az alkalmazás futtatásához szükséges funkciókat
 */
export function isDeviceSupported(): boolean {
  const requiredCapabilities = ['localStorage', 'indexedDB', 'onlineStatus'];

  return requiredCapabilities.every(
    (capability) => (deviceCapabilities as Record<string, boolean>)[capability],
  );
}

/**
 * Új eszközazonosító generálása
 */
export function generateDeviceId(): string {
  // Ha elérhető a crypto.randomUUID()
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }

  // Fallback: egyszerű random ID generálás
  return 'device-' + Date.now() + '-' + Math.random().toString(36).substring(2, 15);
}

/**
 * Részletes eszközinformációk lekérése
 */
export async function getDetailedDeviceInfo(): Promise<Record<string, unknown>> {
  return {
    deviceId: await getDeviceId(),
    userAgent: navigator.userAgent,
    platform: navigator.platform,
    language: navigator.language,
    online: navigator.onLine,
    timestamp: Date.now(),
    screenSize: {
      width: window.screen.width,
      height: window.screen.height,
    },
    viewport: {
      width: window.innerWidth,
      height: window.innerHeight,
    },
    memory: (navigator as NavigatorWithMemory).deviceMemory,
    connection: getConnectionInfo(),
    storage: await getStorageEstimate(),
  };
}

/**
 * Hálózati kapcsolat információk lekérése
 */
function getConnectionInfo(): NetworkInformation | null {
  const nav = navigator as NavigatorWithConnection;
  const connection = nav.connection || nav.mozConnection || nav.webkitConnection;

  if (!connection) return null;

  return {
    type: connection.type,
    effectiveType: connection.effectiveType,
    downlinkMax: connection.downlinkMax,
    downlink: connection.downlink,
    rtt: connection.rtt,
    saveData: connection.saveData,
  };
}

/**
 * Tárhely becslés lekérése
 */
async function getStorageEstimate(): Promise<StorageEstimate | null> {
  if (navigator.storage && navigator.storage.estimate) {
    try {
      return await navigator.storage.estimate();
    } catch (error) {
      logger.warn('Tárhely becslés lekérése sikertelen:', error);
    }
  }
  return null;
}
