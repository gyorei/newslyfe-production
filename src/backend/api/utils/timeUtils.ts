/**
 * Egységes időkezelési segédfüggvények
 *
 * Ez a modul tartalmazza az időszűréshez szükséges közös függvényeket,
 * amelyeket mindhárom hírlekérdezési API modul használ:
 * - Local (helyi hírek)
 * - Country (országos hírek)
 * - Continent (kontinens hírek)
 */

import { TIME_CONFIG } from '../config/timeConfig';

/**
 * Alapvető hírobjektum interfész időszűréshez
 * Kompatibilis mind a három API modul hírobjektumaival
 */
interface NewsItemWithTime {
  timestamp?: number;
  publishDate?: string;
  [key: string]: unknown; // További mezők megengedése
}

/**
 * Validálja és normalizálja a maxAgeHours paramétert
 * @param maxAgeHours Az API kérésből származó maxAgeHours paraméter (string | undefined)
 * @returns Validált és normalizált óraszám (number)
 */
export function validateMaxAgeHours(maxAgeHours: string | undefined): number {
  // Ha nincs megadva paraméter, az alapértelmezett értéket használjuk
  if (!maxAgeHours) {
    return TIME_CONFIG.DEFAULT_MAX_AGE_HOURS;
  }

  // String to number konverzió
  const hours = parseInt(maxAgeHours, 10);

  // Érvénytelen szám ellenőrzése
  if (isNaN(hours)) {
    return TIME_CONFIG.DEFAULT_MAX_AGE_HOURS;
  }

  // Negatív érték ellenőrzése
  if (hours < 0) {
    return TIME_CONFIG.DEFAULT_MAX_AGE_HOURS;
  }

  // Minimum és maximum határértékek alkalmazása
  return Math.min(Math.max(hours, TIME_CONFIG.MIN_AGE_HOURS), TIME_CONFIG.MAX_AGE_HOURS);
}

/**
 * Kiszámítja a cutoff timestamp értékét az óraszám alapján
 * @param maxAgeHours Maximális kor órában
 * @returns Cutoff timestamp (milliszekundum)
 */
export function calculateCutoffTimestamp(maxAgeHours: number): number {
  return Date.now() - maxAgeHours * 60 * 60 * 1000;
}

/**
 * Eldönti, hogy egy hír "Just now"-ként jelenne-e meg (azaz nincs értelmes időbélyeg, vagy 60 másodpercen belüli)
 */
function wouldBeJustNow(item: any): boolean {
  const now = Date.now();
  let ts: number | undefined = undefined;

  if (item.timestamp && typeof item.timestamp === 'number') {
    ts = item.timestamp;
  } else if (item.publishDate && !isNaN(new Date(item.publishDate).getTime())) {
    ts = new Date(item.publishDate).getTime();
  } else if (item.date && !isNaN(new Date(item.date).getTime())) {
    ts = new Date(item.date).getTime();
  }

  // Ha nincs értelmes idő, vagy az időbélyeg nagyon közel van a mostanihoz (pl. 60 másodpercen belül), akkor "Just now"
  if (!ts) return true;
  const diff = now - ts;
  return diff < 60 * 1000; // 60 másodperc
}

/**
 * Szűri a híreket az időintervallum alapján
 * @param newsItems Hírek tömbje
 * @param maxAgeHours Maximális kor órában
 * @returns Szűrt hírek tömbje
 */
export function filterNewsByAge<T extends NewsItemWithTime>(
  newsItems: T[],
  maxAgeHours: number,
): T[] {
  const cutoffTimestamp = calculateCutoffTimestamp(maxAgeHours);

  return newsItems.filter((item) => {
    // Szűrés: ha "Just now"-ként jelenne meg, szűrjük ki
    if (wouldBeJustNow(item)) {
      return false;
    }

    // timestamp mező ellenőrzése
    if (item.timestamp && typeof item.timestamp === 'number') {
      return item.timestamp > cutoffTimestamp;
    }

    // Ha nincs timestamp, próbáljuk a publishDate mezőt
    if (item.publishDate) {
      const publishTimestamp = new Date(item.publishDate).getTime();
      return publishTimestamp > cutoffTimestamp;
    }

    // Ha nincs időbélyeg, megtartjuk a hírt (nem szűrjük ki)
    return true;
  });
}

/**
 * Generálja az időszűréshez kapcsolódó metaadatokat
 * @param maxAgeHours Használt maximális kor órában
 * @param totalItemsBeforeFilter Szűrés előtti hírek száma
 * @param totalItemsAfterFilter Szűrés utáni hírek száma
 * @returns Metaadat objektum
 */
export function generateTimeMetadata(
  maxAgeHours: number,
  totalItemsBeforeFilter: number,
  totalItemsAfterFilter: number,
): object {
  const cutoffTimestamp = calculateCutoffTimestamp(maxAgeHours);

  return {
    timeFilter: {
      maxAgeHours,
      cutoffTimestamp,
      cutoffDate: new Date(cutoffTimestamp).toISOString(),
      itemsBeforeFilter: totalItemsBeforeFilter,
      itemsAfterFilter: totalItemsAfterFilter,
      filteredOutCount: totalItemsBeforeFilter - totalItemsAfterFilter,
    },
  };
}

/**
 * Ellenőrzi, hogy egy timestamp a megadott időintervallumon belül van-e
 * @param timestamp Ellenőrizendő timestamp
 * @param maxAgeHours Maximális kor órában
 * @returns true, ha a timestamp a megadott intervallumon belül van
 */
export function isTimestampWithinRange(timestamp: number, maxAgeHours: number): boolean {
  const cutoffTimestamp = calculateCutoffTimestamp(maxAgeHours);
  return timestamp > cutoffTimestamp;
}

/**
 * Formázza az időintervallumot emberi olvashatóságra
 * @param hours Órák száma
 * @returns Formázott string (pl. "2 nap", "6 óra")
 */
export function formatTimeInterval(hours: number): string {
  if (hours < 24) {
    return `${hours} óra`;
  }

  const days = Math.floor(hours / 24);
  const remainingHours = hours % 24;

  if (remainingHours === 0) {
    return `${days} nap`;
  }

  return `${days} nap ${remainingHours} óra`;
}
