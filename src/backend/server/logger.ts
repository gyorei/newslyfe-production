/**
 * Egyszerű naplózó rendszer - átmeneti megoldás
 * Ez a rendszer csak a konzolra naplóz, nincs konfigurációs függősége
 */

// Egyszerű interfész a naplózó funkcióihoz
export interface SimpleLogger {
  debug: (message: string, ...meta: unknown[]) => void;
  info: (message: string, ...meta: unknown[]) => void;
  warn: (message: string, ...meta: unknown[]) => void;
  error: (message: string, error?: unknown, ...meta: unknown[]) => void;
  time: (label: string) => () => void;
}

/**
 * Egyszerű naplózó osztály
 */
class Logger implements SimpleLogger {
  // Kiszűrendő hibaüzenetek mintái
  private ignoredErrorPatterns: string[] = [
    'Hiba az RSS feed feldolgozása közben',
    'Request failed with status code 404',
    'GeoIP API hiba',
    'ipapi.co',
  ];

  // Kiszűrendő debug üzenetek mintái
  private ignoredDebugPatterns: string[] = [
    'RSS feed lekérése:', // Ez fogja kiszűrni az RSS feed lekérési üzeneteket
    '[safeRssXmlParser]', // HOZZÁADVA: A safeRssXmlParser debug üzeneteinek szűrése
  ];

  /**
   * Debug szintű üzenet
   */
  debug(message: string, ...meta: unknown[]): void {
    // RSS feed lekérési üzenetek szűrése
    if (this.ignoredDebugPatterns.some((pattern) => message.includes(pattern))) {
      return;
    }

    // GeoIP debug üzenetek szűrése
    if (message.includes('GeoIP') || message.includes('location')) {
      return;
    }

    console.debug('[DEBUG]', message, ...meta);
  }

  /**
   * Információs szintű üzenet
   */
  info(message: string, ...meta: unknown[]): void {
    console.info(`[INFO] ${message}`, ...meta);
  }

  /**
   * Figyelmeztető szintű üzenet
   */
  warn(message: string, ...meta: unknown[]): void {
    console.warn(`[WARN] ${message}`, ...meta);
  }

  /**
   * Hiba szintű üzenet
   */
  error(message: string, error?: unknown, ...meta: unknown[]): void {
    // Ellenőrizzük, hogy a hibaüzenet kiszűrendő-e
    const shouldIgnore = this.ignoredErrorPatterns.some(
      (pattern) =>
        message.includes(pattern) ||
        (error instanceof Error && error.message.includes(pattern)) ||
        (typeof error === 'string' && error.includes(pattern)),
    );

    // Ha a hiba kiszűrendő, akkor nem jelenítjük meg
    if (shouldIgnore) {
      return;
    }

    // A hibaüzenet és a stack trace feldolgozása
    let errorDetails = '';

    if (error instanceof Error) {
      errorDetails = error.stack || error.message;
    } else if (error !== undefined) {
      errorDetails = String(error);
    }

    console.error(`[ERROR] ${message}${errorDetails ? ': ' + errorDetails : ''}`, ...meta);
  }

  /**
   * Teljesítményméterés naplózása
   * @param label A mérés címkéje
   */
  time(label: string): () => void {
    const start = Date.now();
    return () => {
      const duration = Date.now() - start;
      this.debug(`${label}: ${duration}ms`);
    };
  }
}

// Singleton példány exportálása
export const logger = new Logger();
export default logger;
