/**src\components\Auth\AuthUtils.ts
 * Autentikációs segédfunkciók
 *
 * Olyan segédfunkciókat tartalmaz, amelyek a bejelentkezéssel és
 * felhasználói jogosultságokkal kapcsolatosak.
 */

import { jwtDecode } from 'jwt-decode';

/**
 * JWT token dekódolt payload típus definíciója
 */
export interface JwtPayload {
  sub?: string; // subject (általában user ID)
  name?: string; // felhasználó neve
  email?: string; // felhasználó email címe
  roles?: string[]; // felhasználói jogosultságok/szerepkörök
  iat?: number; // token kiállítási ideje (issued at)
  exp?: number; // token lejárati ideje (expiration)
  iss?: string; // kiállító (issuer)
  aud?: string; // célközönség (audience)
  [key: string]: unknown; // egyéb tetszőleges mezők
}

/**
 * Jelszó erősségének ellenőrzése
 * @param password A vizsgálandó jelszó
 * @returns Jelszó erősség értékelése
 */
export function evaluatePasswordStrength(password: string): {
  strength: 'weak' | 'medium' | 'strong';
  score: number;
  feedback: string[];
} {
  const feedback: string[] = [];
  let score = 0;

  // Alapvető hossz ellenőrzés
  if (password.length < 8) {
    feedback.push('A jelszó túl rövid. Legalább 8 karakter ajánlott.');
  } else {
    score += 1;
  }

  // Több különböző karakter típus használata
  if (/[A-Z]/.test(password)) {
    score += 1;
  } else {
    feedback.push('Használjon legalább egy nagybetűt.');
  }

  if (/[a-z]/.test(password)) {
    score += 1;
  } else {
    feedback.push('Használjon legalább egy kisbetűt.');
  }

  if (/[0-9]/.test(password)) {
    score += 1;
  } else {
    feedback.push('Használjon legalább egy számot.');
  }

  if (/[^A-Za-z0-9]/.test(password)) {
    score += 1;
  } else {
    feedback.push('Használjon legalább egy speciális karaktert.');
  }

  // Többszörös akaraktertípusok ellenőrzése
  if (score >= 4) {
    feedback.push('Erős jelszó!');
  } else if (score >= 3) {
    feedback.push(
      'Közepes erősségű jelszó. Még erősebb lehet több különböző karakter használatával.',
    );
  } else {
    feedback.push(
      'Gyenge jelszó. Használjon több különböző típusú karaktert a biztonság növeléséhez.',
    );
  }

  // Gyakori jelszavak ellenőrzése (csak demonstráció, a valóságban sokkal több ellenőrzés lenne)
  const commonPasswords = ['password', 'password123', '123456', 'qwerty', 'admin', 'welcome'];
  if (commonPasswords.includes(password.toLowerCase())) {
    score = 1;
    feedback.push(
      'Ez egy gyakran használt jelszó, ami könnyen feltörhető. Kérjük, válasszon egyedit.',
    );
  }

  // Erősség meghatározása
  let strength: 'weak' | 'medium' | 'strong';
  if (score <= 2) {
    strength = 'weak';
  } else if (score <= 3) {
    strength = 'medium';
  } else {
    strength = 'strong';
  }

  return {
    strength,
    score,
    feedback,
  };
}

/**
 * Token információk kinyerése JWT tokenből
 * @param token JWT token
 * @returns A token payload része vagy null, ha érvénytelen
 */
export function decodeJwtToken(token: string): JwtPayload | null {
  try {
    return jwtDecode<JwtPayload>(token);
  } catch (error) {
    console.error('Hiba a token dekódolása során:', error);
    return null;
  }
}

/**
 * Ellenőrzi, hogy a token lejárt-e
 * @param token JWT token
 * @returns Igaz, ha a token lejárt, egyébként hamis
 */
export function isTokenExpired(token: string): boolean {
  const decoded = decodeJwtToken(token);
  if (!decoded || !decoded.exp) return true;

  const expirationDate = new Date(decoded.exp * 1000);
  return expirationDate <= new Date();
}

/**
 * Biztonságos jelszógenerátor
 * @param length Jelszó hossza
 * @param options Jelszó generálás opciók
 * @returns Generált biztonságos jelszó
 */
export function generateSecurePassword(
  length: number = 12,
  options: {
    includeLowercase?: boolean;
    includeUppercase?: boolean;
    includeNumbers?: boolean;
    includeSymbols?: boolean;
  } = {},
): string {
  const {
    includeLowercase = true,
    includeUppercase = true,
    includeNumbers = true,
    includeSymbols = true,
  } = options;

  const lowercase = 'abcdefghijklmnopqrstuvwxyz';
  const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const numbers = '0123456789';
  const symbols = '!@#$%^&*()_+-=[]{}|;:,.<>?';

  let charset = '';
  if (includeLowercase) charset += lowercase;
  if (includeUppercase) charset += uppercase;
  if (includeNumbers) charset += numbers;
  if (includeSymbols) charset += symbols;
  if (!charset) charset = lowercase + uppercase + numbers + symbols;

  // Kriptográfiai biztonságos véletlen generálás
  const randomValues = new Uint32Array(length);
  window.crypto.getRandomValues(randomValues);

  let password = '';
  for (let i = 0; i < length; i++) {
    password += charset[randomValues[i] % charset.length];
  }

  let valid = true;
  if (includeLowercase && !/[a-z]/.test(password)) valid = false;
  if (includeUppercase && !/[A-Z]/.test(password)) valid = false;
  if (includeNumbers && !/[0-9]/.test(password)) valid = false;
  if (includeSymbols && !/[^A-Za-z0-9]/.test(password)) valid = false;
  if (!valid) {
    return generateSecurePassword(length, options);
  }
  return password;
}

/**
 * Az auth modul exportjai
 */
export const authUtils = {
  evaluatePasswordStrength,
  decodeJwtToken,
  isTokenExpired,
  generateSecurePassword,
};

export default authUtils;
