/**
 * Központi monitorozási szolgáltatás (monitoring.ts)
 *
 * Szolgáltatás célja:
 * - Az alkalmazás általános állapotának figyelése
 * - Teljesítményadatok gyűjtése és elemzése
 * - Hibajelentések készítése és küldése
 * - Felhasználói interakciók követése
 * - Az alkalmazás egészségének figyelése
 *
 * Kapcsolódó fájlok:
 * - src/utils/logger/index.ts: Részletes naplózás
 * - src/config/env.ts: Környezeti beállítások
 */

import { logger } from '../logger';

// Figyelendő események típusai
type EventType = 'error' | 'navigation' | 'api' | 'render' | 'interaction' | 'load' | 'resource';

// Monitorozási adatok gyűjtésére szolgáló interfész
interface MonitoringData {
  errors: ErrorEvent[];
  performance: {
    navigation: PerformanceNavigationTiming[];
    resources: PerformanceResourceTiming[];
    customMeasures: Record<string, PerformanceMeasure[]>;
  };
  interactions: {
    clicks: number;
    scrolls: number;
    keypresses: number;
    lastActivity: Date | null;
  };
  api: {
    requests: number;
    failures: number;
    totalTime: number;
  };
  resources: {
    loaded: number;
    failed: number;
  };
}

// Monitorozási beállítások
const config = {
  enabled: true,
  sampleRate: 1.0, // 1.0 = minden esemény, 0.1 = 10% az eseményeknek
  reportingEndpoint: '',
  reportingInterval: 60000, // 1 perc alapértelmezettként
  errorReporting: true,
  performanceMonitoring: true,
  interactionTracking: true,
  apiMonitoring: true,
  resourceMonitoring: true,
  maxEventsStored: 100, // Maximum tárolt események száma
  sentryDsn: process.env.REACT_APP_SENTRY_DSN,
};

// Monitorozási adatok gyűjtése
let monitoringData: MonitoringData = {
  errors: [],
  performance: {
    navigation: [],
    resources: [],
    customMeasures: {},
  },
  interactions: {
    clicks: 0,
    scrolls: 0,
    keypresses: 0,
    lastActivity: null,
  },
  api: {
    requests: 0,
    failures: 0,
    totalTime: 0,
  },
  resources: {
    loaded: 0,
    failed: 0,
  },
};

// Időszakos jelentések időzítő azonosítója
let reportingInterval: number | null = null;

/**
 * Új esemény rögzítése
 */
function trackEvent(type: EventType, name: string, data?: unknown): void {
  if (!config.enabled) return;

  // Mintavételezés alkalmazása - véletlenszerűen eldobjuk az események egy részét
  if (Math.random() > config.sampleRate) return;

  const timestamp = new Date();

  switch (type) {
    case 'error':
      if (config.errorReporting) {
        if (monitoringData.errors.length >= config.maxEventsStored) {
          monitoringData.errors.shift(); // Régi hibák eltávolítása
        }
        monitoringData.errors.push(data as ErrorEvent);
        logger.error('monitoring', `Hiba rögzítve: ${name}`, data);
      }
      break;

    case 'navigation':
      if (config.performanceMonitoring && data) {
        monitoringData.performance.navigation.push(data as PerformanceNavigationTiming);
        logger.debug('monitoring', `Navigáció rögzítve: ${name}`, {
          duration: (data as PerformanceNavigationTiming).duration,
          type: (data as PerformanceNavigationTiming).type,
        });
      }
      break;

    case 'api':
      if (config.apiMonitoring) {
        monitoringData.api.requests++;
        if (!(data as { success: boolean }).success) monitoringData.api.failures++;
        monitoringData.api.totalTime += (data as { duration: number }).duration || 0;
        logger.debug('monitoring', `API kérés rögzítve: ${name}`, {
          success: (data as { success: boolean }).success,
          duration: (data as { duration: number }).duration,
          status: (data as { status: number }).status,
        });
      }
      break;

    case 'interaction':
      if (config.interactionTracking) {
        monitoringData.interactions.lastActivity = timestamp;
        switch ((data as { subtype: string }).subtype) {
          case 'click':
            monitoringData.interactions.clicks++;
            break;
          case 'scroll':
            monitoringData.interactions.scrolls++;
            break;
          case 'keypress':
            monitoringData.interactions.keypresses++;
            break;
        }
        logger.debug(
          'monitoring',
          `Interakció rögzítve: ${(data as { subtype: string }).subtype}`,
          {
            target: (data as { target: string }).target,
            timestamp,
          },
        );
      }
      break;

    case 'resource':
      if (config.resourceMonitoring) {
        if ((data as { success: boolean }).success) {
          monitoringData.resources.loaded++;
        } else {
          monitoringData.resources.failed++;
        }
        logger.debug('monitoring', `Erőforrás betöltés rögzítve: ${name}`, {
          success: (data as { success: boolean }).success,
          type: (data as { type: string }).type,
          size: (data as { size: number }).size,
        });
      }
      break;

    case 'load':
      if (config.performanceMonitoring) {
        logger.info('monitoring', `Betöltési esemény: ${name}`, data);
      }
      break;
  }
}

/**
 * Teljesítményadatok gyűjtése
 */
function collectPerformanceData(): void {
  if (!config.performanceMonitoring || typeof performance === 'undefined') return;

  try {
    // Navigációs teljesítmény
    const navigationEntries = performance.getEntriesByType('navigation');
    if (navigationEntries && navigationEntries.length > 0) {
      monitoringData.performance.navigation = navigationEntries as PerformanceNavigationTiming[];
    }

    // Erőforrás teljesítmény
    const resourceEntries = performance.getEntriesByType('resource');
    if (resourceEntries && resourceEntries.length > 0) {
      monitoringData.performance.resources = resourceEntries as PerformanceResourceTiming[];
    }

    // Egyedi mérések
    const measures = performance.getEntriesByType('measure');
    if (measures && measures.length > 0) {
      measures.forEach((measure) => {
        const name = measure.name;
        if (!monitoringData.performance.customMeasures[name]) {
          monitoringData.performance.customMeasures[name] = [];
        }
        monitoringData.performance.customMeasures[name].push(measure as PerformanceMeasure);
      });
    }

    // Tisztítás a memória kímélése érdekében
    performance.clearResourceTimings();
  } catch (error) {
    logger.error('monitoring', 'Hiba a teljesítményadatok gyűjtése közben', error);
  }
}

/**
 * Hibaesemények figyelése
 */
function setupErrorListeners(): void {
  if (!config.errorReporting || typeof window === 'undefined') return;

  // Kezeletlen hibák figyelése
  window.addEventListener('error', (event) => {
    trackEvent('error', 'unhandled_error', {
      message: event.message,
      filename: event.filename,
      lineno: event.lineno,
      colno: event.colno,
      error: event.error,
    });
  });

  // Kezeletlen promise elutasítások figyelése
  window.addEventListener('unhandledrejection', (event) => {
    trackEvent('error', 'unhandled_rejection', {
      reason: event.reason,
      promise: event.promise,
    });
  });

  // Alkalmazás-specifikus hibák figyelése - javítva a típuskonverziós hibát
  window.addEventListener('app-error', ((event: CustomEvent<unknown>) => {
    if (event.detail) {
      trackEvent('error', 'app_error', event.detail);
    }
  }) as EventListener); // Típuskonverzió EventListener-re
}

/**
 * Felhasználói interakciók figyelése
 */
function setupInteractionListeners(): void {
  if (!config.interactionTracking || typeof window === 'undefined') return;

  // Kattintások
  document.addEventListener('click', (event) => {
    const target = event.target as HTMLElement;
    trackEvent('interaction', 'user_click', {
      subtype: 'click',
      target: target.tagName,
      id: target.id,
      class: target.className,
      timestamp: new Date(),
    });
  });

  // Görgetés, de limitált gyakorisággal
  let scrollTimeout: number | null = null;
  document.addEventListener('scroll', () => {
    if (scrollTimeout) return;
    scrollTimeout = window.setTimeout(() => {
      trackEvent('interaction', 'user_scroll', {
        subtype: 'scroll',
        scrollY: window.scrollY,
        timestamp: new Date(),
      });
      scrollTimeout = null;
    }, 500); // 500ms késleltetés, hogy ne generáljunk túl sok eseményt
  });

  // Billentyűleütések (csak a számot követjük, nem a konkrét billentyűket)
  document.addEventListener('keydown', () => {
    trackEvent('interaction', 'user_keypress', {
      subtype: 'keypress',
      timestamp: new Date(),
    });
  });
}

/**
 * Fetch API kérések monitorozása
 */
function setupApiMonitoring(): void {
  if (!config.apiMonitoring || typeof window === 'undefined') return;

  // A natív fetch felülírása, hogy monitorozhassuk a kéréseket
  const originalFetch = window.fetch;
  window.fetch = async function (...args) {
    // URL kinyerése biztonságosan
    const urlStr =
      typeof args[0] === 'string' ? args[0] : 'url' in args[0] ? args[0].url : args[0].toString();

    const start = performance.now();

    try {
      const response = await originalFetch.apply(this, args);
      const duration = performance.now() - start;

      trackEvent('api', urlStr, {
        success: response.ok,
        status: response.status,
        duration,
        method: args[1]?.method || 'GET',
      });

      return response;
    } catch (error) {
      const duration = performance.now() - start;

      trackEvent('api', urlStr, {
        success: false,
        error,
        duration,
        method: args[1]?.method || 'GET',
      });

      throw error;
    }
  };
}

/**
 * Rendszeres jelentések küldése
 */
function setupReporting(): void {
  if (!config.reportingEndpoint || typeof window === 'undefined') return;

  // Időszakos jelentések beállítása
  reportingInterval = window.setInterval(() => {
    sendReport();
  }, config.reportingInterval);

  // Oldal bezárásakor jelentés küldése
  window.addEventListener('beforeunload', () => {
    sendReport();
  });
}

/**
 * Jelentés küldése a remote szerverre
 */
async function sendReport(): Promise<void> {
  if (!config.reportingEndpoint) return;

  try {
    // Adatok gyűjtése a jelentéshez
    collectPerformanceData();

    // Csak akkor küldjük el, ha vannak adatok
    if (
      monitoringData.errors.length > 0 ||
      monitoringData.api.requests > 0 ||
      monitoringData.resources.loaded > 0
    ) {
      const report = {
        timestamp: new Date().toISOString(),
        sessionId: getSessionId(),
        userAgent: navigator.userAgent,
        url: window.location.href,
        referrer: document.referrer,
        data: { ...monitoringData },
      };

      // Adatok elküldése
      await fetch(config.reportingEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(report),
        // Garantáljuk, hogy a jelentés elküldésre kerül
        keepalive: true,
      });

      // Sikeres küldés után töröljük az adatokat
      resetMonitoringData();
    }
  } catch (error) {
    logger.error('monitoring', 'Hiba a monitorozási jelentés küldésekor', error);
  }
}

/**
 * Monitorozási adatok visszaállítása
 */
function resetMonitoringData(): void {
  monitoringData = {
    errors: [],
    performance: {
      navigation: [],
      resources: [],
      customMeasures: {},
    },
    interactions: {
      clicks: 0,
      scrolls: 0,
      keypresses: 0,
      lastActivity: monitoringData.interactions.lastActivity,
    },
    api: {
      requests: 0,
      failures: 0,
      totalTime: 0,
    },
    resources: {
      loaded: 0,
      failed: 0,
    },
  };
}

/**
 * Egyedi munkamenet azonosító generálása vagy visszaadása
 */
function getSessionId(): string {
  if (!sessionStorage.getItem('monitoring_session_id')) {
    const randomId = Math.random().toString(36).substring(2, 15);
    const timestamp = Date.now().toString(36);
    sessionStorage.setItem('monitoring_session_id', `${timestamp}-${randomId}`);
  }
  return sessionStorage.getItem('monitoring_session_id') || 'unknown';
}

/**
 * Publikus monitoring API
 */
export const monitoring = {
  /**
   * Monitorozás inicializálása
   */
  init: (customConfig = {}) => {
    // Konfiguráció felülírása egyéni beállításokkal
    Object.assign(config, customConfig);

    if (!config.enabled) return;

    logger.info('monitoring', 'Monitorozási szolgáltatás inicializálva', config);

    // Eseményfigyelők beállítása
    setupErrorListeners();
    setupInteractionListeners();
    setupApiMonitoring();
    setupReporting();

    // Kezdeti teljesítményadatok gyűjtése
    collectPerformanceData();

    // Oldal betöltési idő mérése
    if (typeof performance !== 'undefined') {
      window.addEventListener('load', () => {
        const loadTime = performance.now();
        trackEvent('load', 'page_load', {
          loadTime,
          url: window.location.href,
        });
      });
    }
  },

  /**
   * Konfiguráció módosítása futásidőben
   */
  configure: (newConfig: Partial<typeof config>) => {
    Object.assign(config, newConfig);
    logger.info('monitoring', 'Monitorozási konfiguráció frissítve', config);

    // Időzítők újraindítása, ha szükséges
    if (reportingInterval) {
      window.clearInterval(reportingInterval);
      reportingInterval = null;
    }

    if (config.enabled && config.reportingEndpoint) {
      setupReporting();
    }
  },

  /**
   * Teljesítménymérés kezdése
   */
  startMeasure: (name: string) => {
    if (!config.enabled || !config.performanceMonitoring || typeof performance === 'undefined')
      return;

    try {
      performance.mark(`${name}_start`);
      logger.debug('performance', `Teljesítménymérés kezdete: ${name}`);
    } catch (error) {
      logger.error('monitoring', `Hiba a teljesítménymérés kezdetekor: ${name}`, error);
    }
  },

  /**
   * Teljesítménymérés befejezése
   */
  endMeasure: (name: string, data?: unknown) => {
    if (!config.enabled || !config.performanceMonitoring || typeof performance === 'undefined')
      return;

    try {
      performance.mark(`${name}_end`);
      performance.measure(name, `${name}_start`, `${name}_end`);

      // Mérési adatok lekérése
      const measures = performance.getEntriesByName(name, 'measure');
      if (measures.length > 0) {
        const duration = measures[0].duration;
        const logData = {
          duration: `${duration.toFixed(2)}ms`,
        };
        // Csak akkor adjuk hozzá a data-t, ha objektum
        if (data && typeof data === 'object') {
          Object.assign(logData, data);
        }
        logger.debug('performance', `Teljesítménymérés vége: ${name}`, logData);
      }

      // Jelek törlése a memória kímélése érdekében
      performance.clearMarks(`${name}_start`);
      performance.clearMarks(`${name}_end`);
      performance.clearMeasures(name);
    } catch (error) {
      logger.error('monitoring', `Hiba a teljesítménymérés befejezésekor: ${name}`, error);
    }
  },

  /**
   * Egyedi esemény rögzítése
   */
  trackEvent: (category: string, action: string, data?: unknown) => {
    if (!config.enabled) return;

    logger.info('event', `${category}: ${action}`, data);

    // Analitikai események továbbítása a monitorozási rendszernek
    trackEvent('interaction', `${category}_${action}`, {
      subtype: 'custom',
      category,
      action,
      data,
    });
  },

  /**
   * Manuális hibajelentés
   */
  reportError: (error: Error | string, context?: unknown) => {
    if (!config.enabled || !config.errorReporting) return;

    const errorObject = typeof error === 'string' ? new Error(error) : error;
    trackEvent('error', 'manual_report', {
      message: errorObject.message,
      stack: errorObject.stack,
      context,
    });
  },

  /**
   * Manuális teljesítmény jelentés
   */
  reportPerformance: (name: string, duration: number, data?: unknown) => {
    if (!config.enabled || !config.performanceMonitoring) return;

    const eventData: Record<string, unknown> = { duration };

    // Csak akkor adjuk hozzá a data-t, ha objektum
    if (data && typeof data === 'object') {
      Object.assign(eventData, data);
    }

    trackEvent('load', name, eventData);
  },

  /**
   * Összefoglaló adatok lekérdezése a jelenlegi monitorozási állapotról
   */
  getSummary: () => {
    return {
      errorsCount: monitoringData.errors.length,
      apiRequests: monitoringData.api.requests,
      apiFailures: monitoringData.api.failures,
      avgApiTime:
        monitoringData.api.requests > 0
          ? monitoringData.api.totalTime / monitoringData.api.requests
          : 0,
      interactions: {
        clicks: monitoringData.interactions.clicks,
        scrolls: monitoringData.interactions.scrolls,
        keypresses: monitoringData.interactions.keypresses,
        lastActivity: monitoringData.interactions.lastActivity,
      },
      resources: {
        loaded: monitoringData.resources.loaded,
        failed: monitoringData.resources.failed,
      },
    };
  },

  /**
   * Teljes monitorozási adatok lekérdezése
   */
  getData: () => ({ ...monitoringData }),

  /**
   * Kézi jelentés küldése
   */
  sendReport: () => sendReport(),

  /**
   * Monitorozási adatok törlése
   */
  clearData: () => resetMonitoringData(),
};

export default monitoring;
