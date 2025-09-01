/**
 * Dátumformázási segédfüggvények
 * Központosítja az alkalmazás dátumkezelési logikáját
 */

/**
 * Relatív időformázás angolul (pl. "2 days ago")
 * @param timestamp Időbélyeg (vagy dátum string)
 * @param useShortFormat Rövid formátumot használjon (pl. "2d" a "2 days ago" helyett)
 * @returns Formázott relatív idő
 */
export function formatRelativeTime(
  timestamp?: number | string,
  useShortFormat: boolean = false,
): string {
  if (!timestamp) return '';

  try {
    const date = typeof timestamp === 'number' ? new Date(timestamp) : new Date(timestamp);

    if (isNaN(date.getTime())) {
      return typeof timestamp === 'string' ? timestamp : 'Unknown date';
    }

    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffSec = Math.floor(diffMs / 1000);

    // ÚJ: Negatív értékek kezelése (FŐPROBLÉMA JAVÍTÁS!)
    if (diffSec < 0) {
      return 'Just now';
    }

    // ÚJ: Egyszerűsített logika - Cognitive Complexity csökkentés
    return useShortFormat ? formatShortRelativeTime(diffSec) : formatLongRelativeTime(diffSec);
  } catch {
    return typeof timestamp === 'string' ? timestamp : 'Unknown date';
  }
}

// ÚJ: Rövid formátum - külön függvény
function formatShortRelativeTime(diffSec: number): string {
  if (diffSec < 60) return `${diffSec}s`;

  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m`;

  const diffHour = Math.floor(diffMin / 60);
  if (diffHour < 24) return `${diffHour}h`;

  const diffDay = Math.floor(diffHour / 24);
  if (diffDay < 30) return `${diffDay}d`;

  const diffMonth = Math.floor(diffDay / 30);
  if (diffMonth < 12) return `${diffMonth}mo`;

  const diffYear = Math.floor(diffMonth / 12);
  return `${diffYear}y`;
}

// ÚJ: Hosszú formátum - külön függvény
function formatLongRelativeTime(diffSec: number): string {
  if (diffSec < 60) return `${diffSec} second${diffSec !== 1 ? 's' : ''} ago`;

  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin} minute${diffMin !== 1 ? 's' : ''} ago`;

  const diffHour = Math.floor(diffMin / 60);
  if (diffHour < 24) return `${diffHour} hour${diffHour !== 1 ? 's' : ''} ago`;

  const diffDay = Math.floor(diffHour / 24);
  if (diffDay < 30) return `${diffDay} day${diffDay !== 1 ? 's' : ''} ago`;

  const diffMonth = Math.floor(diffDay / 30);
  if (diffMonth < 12) return `${diffMonth} month${diffMonth !== 1 ? 's' : ''} ago`;

  const diffYear = Math.floor(diffMonth / 12);
  return `${diffYear} year${diffYear !== 1 ? 's' : ''} ago`;
}
