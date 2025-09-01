/**
 * Logger segédosztály a News alkalmazáshoz
 */
// A nem használt import eltávolítva
// import { StorageConfig } from '../config';

// Naplózási szintek meghatározása
export enum LogLevel {
  TRACE = 0,
  DEBUG = 1,
  INFO = 2,
  WARN = 3,
  ERROR = 4,
  NONE = 5,
}

// Logolási beállítások
interface LoggerOptions {
  minLevel: LogLevel;
  timestampFormat: 'none' | 'short' | 'full';
  useColors: boolean;
  logToConsole: boolean;
  logToStorage: boolean;
  maxStoredLogs: number;
}

// LogEvent típus definiálása a pontos paraméterezéshez
interface LogEvent {
  message: string;
  details?: unknown;
  level: LogLevel;
  timestamp: number;
  source?: string;
}

/**
 * Logger osztály
 */
class Logger {
  private options: LoggerOptions = {
    minLevel: LogLevel.DEBUG,
    timestampFormat: 'short',
    useColors: true,
    logToConsole: true,
    logToStorage: true,
    maxStoredLogs: 1000,
  };

  private logs: LogEvent[] = [];

  // Naplózási metódusok
  trace(message: string, details?: unknown): void {
    this.log(message, LogLevel.TRACE, details);
  }

  debug(message: string, details?: unknown): void {
    this.log(message, LogLevel.DEBUG, details);
  }

  info(message: string, details?: unknown): void {
    this.log(message, LogLevel.INFO, details);
  }

  warn(message: string, details?: unknown): void {
    this.log(message, LogLevel.WARN, details);
  }

  error(message: string, details?: unknown): void {
    this.log(message, LogLevel.ERROR, details);
  }

  // Fő naplózási függvény
  private log(message: string, level: LogLevel, details?: unknown): void {
    // Ha a naplózási szint nem elég magas, ne csináljunk semmit
    if (level < this.options.minLevel) return;

    const timestamp = Date.now();

    // LogEvent objektum létrehozása
    const logEvent: LogEvent = {
      message,
      level,
      timestamp,
      details,
    };

    // Naplóüzenet szövegének formázása
    const logText = this.formatLogText(logEvent);

    // Konzol kimenet, ha engedélyezve van
    if (this.options.logToConsole) {
      this.writeToConsole(logEvent, logText);
    }

    // Storage mentés, ha engedélyezve van
    if (this.options.logToStorage) {
      this.logs.push(logEvent);

      // Ha a tároló túl nagy, töröljünk régi logokat
      if (this.logs.length > this.options.maxStoredLogs) {
        this.logs = this.logs.slice(-this.options.maxStoredLogs);
      }
    }
  }

  private formatLogText(logEvent: LogEvent): string {
    const { message, level, timestamp } = logEvent;

    // Időbélyeg formázása
    let timeStr = '';
    if (this.options.timestampFormat === 'short') {
      const date = new Date(timestamp);
      timeStr = `${date.getHours()}:${date.getMinutes()}:${date.getSeconds()} `;
    } else if (this.options.timestampFormat === 'full') {
      timeStr = `${new Date(timestamp).toISOString()} `;
    }

    // Szint formázása
    const levelStr = LogLevel[level].padEnd(5, ' ');

    return `${timeStr}[${levelStr}] ${message}`;
  }

  private writeToConsole(logEvent: LogEvent, logText: string): void {
    // Különböző szintek különböző színnel
    switch (logEvent.level) {
      case LogLevel.TRACE:
        console.trace(logText, logEvent.details || '');
        break;
      case LogLevel.DEBUG:
        console.debug(logText, logEvent.details || '');
        break;
      case LogLevel.INFO:
        console.info(logText, logEvent.details || '');
        break;
      case LogLevel.WARN:
        console.warn(logText, logEvent.details || '');
        break;
      case LogLevel.ERROR:
        console.error(logText, logEvent.details || '');
        break;
    }
  }

  // Konfigurációs metódusok
  configure(options: Partial<LoggerOptions>): void {
    this.options = { ...this.options, ...options };
  }

  // Log history kezelése
  getLogHistory(): LogEvent[] {
    return [...this.logs];
  }

  exportLogs(): string {
    return JSON.stringify(this.logs);
  }

  clearLogs(): void {
    this.logs = [];
  }
}

// Singleton példány
export const logger = new Logger();
