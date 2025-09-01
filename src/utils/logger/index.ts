/**
 * Központi naplózó szolgáltatás (logger.ts)
 *
 * Szolgáltatás célja:
 * - Egységes naplózási felület biztosítása az alkalmazás számára
 * - Különböző részletességi szintek támogatása (debug, info, warn, error)
 * - Strukturált naplózás JSON formátumban
 * - Kategóriák szerinti szűrés és formázás
 * - Környezet-függő naplózás (fejlesztés vs. produkció)
 *
 * Kapcsolódó fájlok:
 * - src/utils/monitoring/index.ts: Hibakövetés és teljesítményfigyelés
 * - src/config/env.ts: Környezeti beállítások
 */

// Naplózási szintek meghatározása fontossági sorrendben
export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
}

// Környezet-alapú alapértelmezett naplózási szint
const DEFAULT_LOG_LEVEL =
  process.env.NODE_ENV === 'production'
    ? LogLevel.WARN // Termelési környezetben csak figyelmeztetések és hibák
    : LogLevel.DEBUG; // Fejlesztési környezetben minden

// Naplózási kategóriák engedélyezése/letiltása
const enabledCategories: Record<string, boolean> = {
  network: true,
  cache: true,
  rss: true,
  ui: true,
  location: true,
  data: true,
  local: true,
  performance: true,
  error: true,
  user: true,
  default: true,
};

// Naplózási beállítások tárolása
let currentLogLevel = DEFAULT_LOG_LEVEL;
let enableConsoleOutput = true;
let enableRemoteLogging = false;
let remoteLogEndpoint = '';

/**
 * Időbélyeggel ellátott naplóbejegyzés formázása
 */
function formatLogEntry(level: string, category: string, message: string, data?: unknown): string {
  const timestamp = new Date().toISOString();
  const dataString = data ? ` | ${JSON.stringify(data, formatErrorsInJson)}` : '';
  return `[${timestamp}] [${level.toUpperCase()}] [${category}] ${message}${dataString}`;
}

/**
 * JSON.stringify számára error objektumok helyes formázása
 */
function formatErrorsInJson(_key: string, value: unknown) {
  if (value instanceof Error) {
    return {
      name: value.name,
      message: value.message,
      stack: value.stack,
      cause: value.cause,
    };
  }
  return value;
}

/**
 * Távoli naplózó végpont beállítása (ha szükséges)
 */
async function sendToRemoteLogger(
  level: string,
  category: string,
  message: string,
  data?: unknown,
): Promise<void> {
  if (!enableRemoteLogging || !remoteLogEndpoint) return;

  try {
    await fetch(remoteLogEndpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        level,
        category,
        message,
        data,
        timestamp: new Date().toISOString(),
        app: 'news-app',
        environment: process.env.NODE_ENV || 'development',
        userAgent: navigator.userAgent,
      }),
    });
  } catch (error) {
    // Ha a távoli naplózás sikertelen, csak a konzolon jelezzük (de nem próbáljuk újra, hogy elkerüljük a végtelen ciklust)
    console.error('Hiba a távoli naplózás során:', error);
  }
}

/**
 * Naplóbejegyzés rögzítése
 */
async function logEntry(
  level: LogLevel,
  levelName: string,
  category: string,
  message: string,
  data?: unknown,
) {
  // Ellenőrizzük, hogy a naplózási szint és kategória engedélyezve van-e
  if (
    level < currentLogLevel ||
    enabledCategories[category] === false ||
    (!enabledCategories[category] && !enabledCategories.default)
  ) {
    return;
  }

  // Formázott naplóbejegyzés előállítása
  const formattedMessage = formatLogEntry(levelName, category, message, data);

  // Kiíratás a konzolra, ha engedélyezve van
  if (enableConsoleOutput) {
    switch (level) {
      case LogLevel.DEBUG:
        console.debug(formattedMessage);
        break;
      case LogLevel.INFO:
        console.info(formattedMessage);
        break;
      case LogLevel.WARN:
        console.warn(formattedMessage);
        break;
      case LogLevel.ERROR:
        console.error(formattedMessage);
        break;
    }
  }

  // Távoli naplózás, ha engedélyezve van
  await sendToRemoteLogger(levelName, category, message, data);

  // Hibák központi kezelése a monitorozás részére
  if (level === LogLevel.ERROR && typeof window !== 'undefined') {
    try {
      const event = new CustomEvent('app-error', {
        detail: { level, category, message, data, timestamp: new Date() },
      });
      window.dispatchEvent(event);
    } catch {
      // Néma hiba, ha az esemény küldés sikertelen (az 'e' változó eltávolítva, mivel nem volt használva)
    }
  }
}

/**
 * A központi naplózó szolgáltatás
 */
export const logger = {
  /**
   * Debug szintű információk naplózása (csak fejlesztéshez)
   */
  debug: (category: string, message: string, data?: unknown) =>
    logEntry(LogLevel.DEBUG, 'debug', category, message, data),

  /**
   * Informatív üzenetek naplózása
   */
  info: (category: string, message: string, data?: unknown) =>
    logEntry(LogLevel.INFO, 'info', category, message, data),

  /**
   * Figyelmeztetések naplózása
   */
  warn: (category: string, message: string, data?: unknown) =>
    logEntry(LogLevel.WARN, 'warn', category, message, data),

  /**
   * Hibák naplózása
   */
  error: (category: string, message: string, error?: Error | unknown) =>
    logEntry(LogLevel.ERROR, 'error', category, message, error),

  /**
   * Teljesítménymérés kezdete
   */
  startPerf: (category: string, id: string): number => {
    const startTime = performance.now();
    logger.debug('performance', `⏱️ Teljesítménymérés kezdete: ${id}`, { category, startTime });
    return startTime;
  },

  /**
   * Teljesítménymérés befejezése és eredmény naplózása
   */
  endPerf: (category: string, id: string, startTime: number): number => {
    const endTime = performance.now();
    const duration = endTime - startTime;
    logger.debug('performance', `⏱️ Teljesítménymérés vége: ${id}`, {
      category,
      startTime,
      endTime,
      duration: `${duration.toFixed(2)}ms`,
    });
    return duration;
  },

  /**
   * Felhasználói tevékenység naplózása
   */
  userAction: (action: string, detail?: unknown) => {
    logger.info('user', `👤 Felhasználói tevékenység: ${action}`, detail);
  },

  /**
   * Naplózási beállítások módosítása
   */
  config: {
    /**
     * Naplózási szint beállítása
     */
    setLevel: (level: LogLevel) => {
      currentLogLevel = level;
      logger.info('logger', `Naplózási szint beállítva: ${LogLevel[level]}`);
    },

    /**
     * Kategória engedélyezése/letiltása
     */
    setCategory: (category: string, enabled: boolean) => {
      enabledCategories[category] = enabled;
      logger.info('logger', `Kategória ${enabled ? 'engedélyezve' : 'letiltva'}: ${category}`);
    },

    /**
     * Konzol kimenet engedélyezése/letiltása
     */
    setConsoleOutput: (enabled: boolean) => {
      enableConsoleOutput = enabled;
      console.log(`Konzol naplózás ${enabled ? 'engedélyezve' : 'letiltva'}`);
    },

    /**
     * Távoli naplózás beállítása
     */
    setRemoteLogging: (enabled: boolean, endpoint?: string) => {
      enableRemoteLogging = enabled;
      if (endpoint) remoteLogEndpoint = endpoint;
      logger.info(
        'logger',
        `Távoli naplózás ${enabled ? 'engedélyezve' : 'letiltva'}`,
        endpoint ? { endpoint } : undefined,
      );
    },
  },
};

export default logger;
