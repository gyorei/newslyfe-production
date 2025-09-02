// src\backend\auth\utils\tokenService.ts
import crypto from 'crypto';

/**
 * Email verifikációs token generálása
 * - Biztonságos, random string
 * - Opcionális lejárati idő (timestamp)
 */
export function generateVerificationToken(): string {
  // 32 karakteres, URL-safe token
  return crypto.randomBytes(32).toString('hex');
}

/**
 * Token lejárati idő generálása (pl. 24 óra)
 */
export function getVerificationTokenExpiry(hours = 24): number {
  return Date.now() + hours * 60 * 60 * 1000;
}

/**
 * Ellenőrzi, hogy két token megegyezik-e, biztonságos módon.
 */
export function compareTokens(tokenFromRequest: string, tokenFromDb: string): boolean {
  // A crypto.timingSafeEqual egy biztonságos összehasonlító függvény,
  // ami véd az időzítés alapú támadások (timing attacks) ellen.
  // Ehhez azonos hosszúságú bufferekké kell alakítani a stringeket.
  try {
    const requestBuffer = Buffer.from(tokenFromRequest, 'hex');
    const dbBuffer = Buffer.from(tokenFromDb, 'hex');
    if (requestBuffer.length !== dbBuffer.length) {
      return false;
    }
    return crypto.timingSafeEqual(requestBuffer, dbBuffer);
  } catch (e) {
    // Ha a stringek nem valid hex-ek, az összehasonlítás sikertelen.
    return false;
  }
}

/**
 * Ellenőrzi, hogy egy timestamp lejárt-e.
 */
export function isExpired(expiryTimestamp: number): boolean {
  return Date.now() > expiryTimestamp;
}