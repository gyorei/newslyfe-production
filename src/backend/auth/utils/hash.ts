// src\backend\auth\utils\hash.ts
import bcrypt from 'bcryptjs';

/**
 * Jelszó hash-elése
 * @param password - A sima szöveges jelszó
 * @returns Promise<string> - A hash-elt jelszó
 */
export async function hashPassword(password: string): Promise<string> {
  const saltRounds = 12;
  return bcrypt.hash(password, saltRounds);
}

/**
 * Jelszó ellenőrzése
 * @param password - A sima szöveges jelszó
 * @param hash - A hash-elt jelszó az adatbázisból
 * @returns Promise<boolean> - Igaz, ha egyezik
 */
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}