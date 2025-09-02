/**
 * Rate Limiter - Egyszerű domain alapú rate limiting
 * Csak PestiSrácok-ra és Blikk-re alkalmazzuk
 */

// Domain utolsó kérés időpontjának tárolása
const lastRequestTimes = new Map<string, number>();

// Rate limiting konfiguráció
const RATE_LIMIT_MS = 1000; // 1 másodperc várakozás
const SUPPORTED_DOMAINS = ['pestisracok.hu', 'blikk.hu']; // Blikk támogatás hozzáadva

/**
 * Ellenőrzi rate limiting alkalmazását
 */
function needsRateLimit(domain: string): boolean {
  return SUPPORTED_DOMAINS.some((supportedDomain) => domain.includes(supportedDomain));
}

/**
 * Ellenőrzi, hogy lehet-e kérést küldeni az adott domain-re
 * @param url - Ellenőrizendő URL
 * @returns Promise<boolean> - true ha lehet kérést küldeni
 */
export async function canMakeRequest(url: string): Promise<boolean> {
  try {
    const domain = new URL(url).hostname;

    // Támogatott domainekre alkalmazzuk a rate limiting-et
    if (!needsRateLimit(domain)) {
      return true;
    }

    const now = Date.now();
    const lastRequest = lastRequestTimes.get(domain) || 0;
    const timeSinceLastRequest = now - lastRequest;

    if (timeSinceLastRequest < RATE_LIMIT_MS) {
      // Várakozás a rate limit betartásáért
      const waitTime = RATE_LIMIT_MS - timeSinceLastRequest;
      await new Promise((resolve) => setTimeout(resolve, waitTime));
    }

    // Frissítjük az utolsó kérés időpontját
    lastRequestTimes.set(domain, Date.now());
    return true;
  } catch {
    // ✅ TÖKÉLETES: Paraméter nélküli catch - URL parsing hiba esetén engedélyezzük
    return true;
  }
}

/**
 * Rate limiter tisztítása (opcionális karbantartás)
 */
export function clearRateLimit(): void {
  lastRequestTimes.clear();
}
