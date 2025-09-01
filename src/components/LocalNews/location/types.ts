/**
 * Helymeghatározási adatok alapvető struktúrája
 * Minden helyadatot ezzel a formátummal kezelünk a rendszerben
 * src\components\LocalNews\location\types.ts
 */
export interface LocationData {
  /** Az ország teljes neve (pl. "Hungary") */
  country: string;

  /** Az ország ISO kódja (pl. "HU") */
  countryCode: string;

  /** Város neve, ha elérhető */
  city?: string;

  /** Megbízhatósági érték 0-1 között, ahol 1 a legmegbízhatóbb */
  confidence: number;

  /** Az adat forrása (pl. 'browser', 'gps', 'manual') */
  source: string;

  /** A helymeghatározás időbélyege */
  timestamp?: number;

  /** Földrajzi szélesség (GPS koordináta) */
  latitude?: number;

  /** Földrajzi hosszúság (GPS koordináta) */
  longitude?: number;
}

/**
 * Közös interfész a különböző helymeghatározási stratégiákhoz
 */
export interface LocationStrategy {
  /** A stratégia egyedi azonosítója */
  getName(): string;

  /** Inicializálja a stratégiát, amennyiben szükséges */
  initialize?(): Promise<void>;

  /**
   * Helymeghatározást végez a stratégia saját módszerével
   * @returns Az észlelt hely vagy null, ha nem sikerült a meghatározás
   */
  getLocation(): Promise<LocationData | null>;
}

/**
 * Az összes helymeghatározási teljesítményméréshez használt adatok
 */
export interface LocationMetrics {
  /** Milyen gyorsan sikerült meghatározni a helyet (ms) */
  responseTime?: number;

  /** Milyen arányban sikeres a meghatározás (0-1) */
  successRate?: number;

  /** Felhasználói interakciók a helyválasztóval */
  userInteractions?: number;
}
