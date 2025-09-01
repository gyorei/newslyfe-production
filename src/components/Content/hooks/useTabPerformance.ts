/*
ÁTSZERVEZÉSI LEHETŐSÉGEK:

1. Teljesítménymérés kiszervezése önálló szolgáltatásba
   - Áthelyezhető: src\utils\performance könyvtárba
   - Új fájl: TabPerformanceTracker.ts
   - Indoklás: A teljesítménymérő logika újrahasznosítható más komponenseknél is

2. Browser Performance API kezelés korszerűsítése
   - Javaslat: Web Vitals könyvtár integrálása
   - Előnyök: Standardizált metrikák, jobb kompatibilitás

3. UI visszajelzések különválasztása
   - Áthelyezhető: Új könyvtárba: src\components\UI\Performance
   - Új komponens: PerformanceIndicator.tsx
   - Indoklás: A mérés és az adatok megjelenítésének szétválasztása
*/

import { useCallback, useEffect, useRef } from 'react';

// Konstans prefix a markerekhez, hogy elkerüljük a névütközést
const PREFIX = 'tabPerf_';

export interface PerformanceData {
  tabSwitchTotal: number; // Teljes tabváltás ideje (ms)
  dbLoadTime: number; // IndexedDB betöltési idő (ms)
  renderTime: number; // React render idő (ms)
  scrollRestoreTime: number; // Görgetési pozíció visszaállítási ideje (ms)
  initialRender: boolean; // Első renderelés-e vagy már volt betöltve
  timestamp: string; // Időbélyeg a méréshez
}

export type PerformancePhase = 'dbLoad' | 'render' | 'scrollRestore' | 'tabSwitch';

export function useTabPerformance() {
  // Performance API elérhetőségének ellenőrzése
  const isSupported = useRef<boolean>(
    typeof performance !== 'undefined' &&
      typeof performance.mark === 'function' &&
      typeof performance.measure === 'function',
  );

  // Performance markerek tárolása
  const performanceData = useRef<PerformanceData>({
    tabSwitchTotal: 0,
    dbLoadTime: 0,
    renderTime: 0,
    scrollRestoreTime: 0,
    initialRender: true,
    timestamp: new Date().toISOString(),
  });

  // Az utolsó 10 mérés eredményeinek tárolása trendek megfigyeléséhez
  // Fix hosszúságú tömb a körkörös buffer megvalósításához
  const historySize = 10;
  const performanceHistory = useRef<PerformanceData[]>(
    Array(historySize)
      .fill(null)
      .map(() => ({
        tabSwitchTotal: 0,
        dbLoadTime: 0,
        renderTime: 0,
        scrollRestoreTime: 0,
        initialRender: true,
        timestamp: new Date().toISOString(),
      })),
  );
  const historyIndex = useRef<number>(0);

  // Debug segítő: konzolba írja a mérési adatokat
  const logPerformanceData = useCallback(() => {
    if (!isSupported.current) {
      console.warn(
        'A Performance API nem elérhető a böngészőben! A teljesítménymérés nem működik.',
      );
      return;
    }

    const now = new Date().toISOString();
    console.group(`⚡️ Tab Performance Metrics (${now})`);
    console.table([
      {
        ...performanceData.current,
        timestamp: now,
      },
    ]);

    // Csak az érvényes méréseket vesszük figyelembe az átlag számításánál
    const validMeasurements = performanceHistory.current.filter(
      (data) => data !== null && data.tabSwitchTotal > 0,
    );

    if (validMeasurements.length > 0) {
      const avgData = validMeasurements.reduce(
        (acc, curr) => {
          return {
            tabSwitchTotal: acc.tabSwitchTotal + curr.tabSwitchTotal,
            dbLoadTime: acc.dbLoadTime + curr.dbLoadTime,
            renderTime: acc.renderTime + curr.renderTime,
            scrollRestoreTime: acc.scrollRestoreTime + curr.scrollRestoreTime,
            initialRender: false,
            timestamp: now,
          };
        },
        {
          tabSwitchTotal: 0,
          dbLoadTime: 0,
          renderTime: 0,
          scrollRestoreTime: 0,
          initialRender: false,
          timestamp: now,
        },
      );

      const count = validMeasurements.length;
      console.log(`📊 Átlagos teljesítmény adatok (utolsó ${count} mérés alapján):`);
      console.table([
        {
          tabSwitchTotal: (avgData.tabSwitchTotal / count).toFixed(2),
          dbLoadTime: (avgData.dbLoadTime / count).toFixed(2),
          renderTime: (avgData.renderTime / count).toFixed(2),
          scrollRestoreTime: (avgData.scrollRestoreTime / count).toFixed(2),
          timestamp: now,
        },
      ]);
    }
    console.groupEnd();
  }, []);

  // Markerek és mérések tisztítása
  const clearMarkers = useCallback((phase: PerformancePhase) => {
    if (!isSupported.current) return;

    performance.clearMarks(`${PREFIX}${phase}-start`);
    performance.clearMarks(`${PREFIX}${phase}-end`);
    performance.clearMeasures(`${PREFIX}${phase}`);
  }, []);

  // Általános teljesítménymérés
  const measurePhase = useCallback(
    (phase: PerformancePhase, workFn: () => void) => {
      if (!isSupported.current) {
        workFn();
        return;
      }

      // Kezdő marker
      performance.mark(`${PREFIX}${phase}-start`);

      // Végrehajtandó munka
      workFn();

      // Befejező marker
      performance.mark(`${PREFIX}${phase}-end`);

      // Mérés
      performance.measure(`${PREFIX}${phase}`, `${PREFIX}${phase}-start`, `${PREFIX}${phase}-end`);

      // Eredmény kinyerése
      const measure = performance.getEntriesByName(`${PREFIX}${phase}`).pop();
      if (measure) {
        switch (phase) {
          case 'dbLoad':
            performanceData.current.dbLoadTime = measure.duration;
            break;
          case 'render':
            performanceData.current.renderTime = measure.duration;
            break;
          case 'scrollRestore':
            performanceData.current.scrollRestoreTime = measure.duration;
            break;
          case 'tabSwitch':
            performanceData.current.tabSwitchTotal = measure.duration;

            // Az eredmények tárolása a történeti adatokban (körkörös buffer)
            performanceData.current.timestamp = new Date().toISOString();
            performanceHistory.current[historyIndex.current] = { ...performanceData.current };
            historyIndex.current = (historyIndex.current + 1) % historySize;

            // Eredmények kiírása a konzolba
            logPerformanceData();

            // Következő méréshez beállítjuk, hogy már nem első renderelés
            performanceData.current.initialRender = false;
            break;
        }
      }

      // Markerek és mérések tisztítása
      clearMarkers(phase);

      // Erőforrás-idővonalak tisztítása is
      if (phase === 'tabSwitch') {
        performance.clearResourceTimings();
      }
    },
    [clearMarkers, logPerformanceData],
  );

  // Teljesítménymérés kezdése tabváltáskor
  const startTabSwitchMeasurement = useCallback(() => {
    if (!isSupported.current) return;
    performance.mark(`${PREFIX}tabSwitch-start`);
  }, []);

  // Teljesítménymérés befejezése és eredmények összegzése
  const endTabSwitchMeasurement = useCallback(() => {
    if (!isSupported.current) return;

    try {
      // Ellenőrizzük, hogy létezik-e a kezdőpont
      const startMarkers = performance.getEntriesByName(`${PREFIX}tabSwitch-start`, 'mark');
      if (startMarkers.length === 0) {
        console.warn('A tabSwitch kezdőpont nem található, mérés kihagyva');
        return;
      }

      performance.mark(`${PREFIX}tabSwitch-end`);

      // Mérés végrehajtása
      performance.measure(
        `${PREFIX}tabSwitch`,
        `${PREFIX}tabSwitch-start`,
        `${PREFIX}tabSwitch-end`,
      );

      const tabSwitchMeasure = performance.getEntriesByName(`${PREFIX}tabSwitch`).pop();
      if (tabSwitchMeasure) {
        performanceData.current.tabSwitchTotal = tabSwitchMeasure.duration;

        // Az eredmények tárolása a történeti adatokban (körkörös buffer)
        performanceData.current.timestamp = new Date().toISOString();
        performanceHistory.current[historyIndex.current] = { ...performanceData.current };
        historyIndex.current = (historyIndex.current + 1) % historySize;

        // Eredmények kiírása a konzolba
        logPerformanceData();

        // Következő méréshez beállítjuk, hogy már nem első renderelés
        performanceData.current.initialRender = false;
      }
    } catch (error) {
      console.error('Hiba a teljesítménymérés során:', error);
    } finally {
      // Mindenképp takarítsunk
      clearMarkers('tabSwitch');
      performance.clearResourceTimings();
    }
  }, [clearMarkers, logPerformanceData]);

  // Async scroll helyreállítás mérése
  const measureScrollRestoration = useCallback(
    (scrollFn: () => void) => {
      if (!isSupported.current) {
        scrollFn();
        return;
      }

      // Kezdő marker
      performance.mark(`${PREFIX}scrollRestore-start`);

      // Végrehajtandó görgetés
      scrollFn();

      // A tényleges frame renderelés mérése requestAnimationFrame segítségével
      requestAnimationFrame(() => {
        // A második rAF biztosítja, hogy a DOM frissítése megtörtént
        requestAnimationFrame(() => {
          try {
            // Ellenőrizzük, hogy a kezdő marker létezik-e még
            const startMarkers = performance.getEntriesByName(
              `${PREFIX}scrollRestore-start`,
              'mark',
            );
            if (startMarkers.length === 0) {
              console.warn('A scrollRestore kezdőpont nem található, mérés kihagyva');
              return;
            }

            performance.mark(`${PREFIX}scrollRestore-end`);

            // Mérés végrehajtása
            performance.measure(
              `${PREFIX}scrollRestore`,
              `${PREFIX}scrollRestore-start`,
              `${PREFIX}scrollRestore-end`,
            );

            const scrollRestoreMeasure = performance
              .getEntriesByName(`${PREFIX}scrollRestore`)
              .pop();
            if (scrollRestoreMeasure) {
              performanceData.current.scrollRestoreTime = scrollRestoreMeasure.duration;
            }
          } catch (error) {
            console.error('Hiba a görgetés teljesítménymérése során:', error);
          } finally {
            // Mindenképp takarítsunk
            clearMarkers('scrollRestore');
          }
        });
      });
    },
    [clearMarkers],
  );

  // Browser Performance API elérhetőségének ellenőrzése
  useEffect(() => {
    if (!isSupported.current) {
      console.warn(
        '⚠️ A Performance API nem elérhető a böngészőben! A teljesítménymérés nem fog működni.',
      );
    }
  }, []);

  return {
    measurePhase, // Egyesített mérési függvény
    measureScrollRestoration, // Speciális függvény a görgetés méréséhez
    startTabSwitchMeasurement, // Tab váltás mérés kezdete
    endTabSwitchMeasurement, // Tab váltás mérés vége
    performanceData: performanceData.current,
    performanceHistory: performanceHistory.current.filter(
      (data) => data !== null && data.tabSwitchTotal > 0,
    ),
    isSupported: isSupported.current,
  };
}
