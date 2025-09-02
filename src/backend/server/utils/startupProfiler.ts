import { isDev } from '../config/environment';

// A mérések tárolására szolgáló típus
type Measurement = {
  startTime: bigint;
  endTime?: bigint;
  duration?: number;
};

// A profilozó belső állapota
const measurements = new Map<string, Measurement>();
let isProfilerActive = false;

/**
 * A profilozó inicializálása. Csak fejlesztői módban aktiválja magát.
 */
function init(): void {
  if (isDev) {
    isProfilerActive = true;
  }
}

/**
 * Elindít egy időmérést egy adott címkével.
 * Csak akkor működik, ha a profilozó aktív.
 * @param label A mérés egyedi azonosítója.
 */
function start(label: string): void {
  if (!isProfilerActive) return;

  measurements.set(label, {
    startTime: process.hrtime.bigint(),
  });
}

/**
 * Leállít egy korábban elindított időmérést.
 * Kiszámolja és elmenti az eltelt időt.
 * @param label A leállítandó mérés azonosítója.
 */
function stop(label: string): void {
  if (!isProfilerActive) return;

  const measurement = measurements.get(label);
  if (measurement && !measurement.endTime) {
    measurement.endTime = process.hrtime.bigint();
    // Időtartam kiszámítása nanoszekundumból milliszekundumba
    measurement.duration = Number(measurement.endTime - measurement.startTime) / 1_000_000;
  }
}

/**
 * Generál egy formázott, táblázatos összefoglalót a mérésekről.
 * @returns A riport string formátumban.
 */
function getSummary(): string {
  if (!isProfilerActive || measurements.size === 0) {
    return 'Startup profiler is not active or has no measurements.';
  }

  const tableData = Array.from(measurements.entries())
    .filter(([, m]) => m.duration !== undefined)
    .sort((a, b) => (a[1].duration! > b[1].duration! ? -1 : 1)); // Csökkenő sorrend

  const totalTimeMeasurement = measurements.get('Total Startup Time');
  const totalDuration = totalTimeMeasurement?.duration?.toFixed(2) || 'N/A';

  let summary = '\n';
  summary += '┌──────────────────────────────────────────────────┐\n';
  summary += '│       Backend Startup Profiling Summary        │\n';
  summary += '├───────────────────────────────────┬──────────────┤\n';
  summary += '│ Phase                             │ Duration (ms)│\n';
  summary += '├───────────────────────────────────┼──────────────┤\n';

  for (const [label, measurement] of tableData) {
    if (label !== 'Total Startup Time') {
      const durationStr = (measurement.duration ?? 0).toFixed(2).padStart(12);
      const labelStr = label.padEnd(33);
      summary += `│ ${labelStr} │ ${durationStr} │\n`;
    }
  }

  summary += '├───────────────────────────────────┼──────────────┤\n';
  const totalLabelStr = 'Total Startup Time'.padEnd(33);
  const totalDurationStr = totalDuration.padStart(12);
  summary += `│ ${totalLabelStr} │ ${totalDurationStr} │\n`;
  summary += '└───────────────────────────────────┴──────────────┘\n';

  return summary;
}

export const startupProfiler = {
  init,
  start,
  stop,
  getSummary,
};
