// src\backend\auth\utils\token.ts
import jwt from 'jsonwebtoken';
const { JsonWebTokenError } = jwt;

// Kritikus: JWT_SECRET csak fejlesztésben legyen default!
if (!process.env.JWT_SECRET) {
  if (process.env.NODE_ENV === 'production') {
    console.error('FATAL ERROR: JWT_SECRET is not defined in environment variables.');
    process.exit(1);
  }
}
const JWT_SECRET = process.env.JWT_SECRET || 'a_very_strong_and_long_random_string_for_dev';
const JWT_EXPIRES_IN = '1d'; // 1 nap

export interface AppJwtPayload {
  id: string;
  role: string;
}

/**
 * JWT token generálása
 * @param payload - Felhasználói adatok (id, role)
 * @returns string - Aláírt JWT token
 */
export function generateToken(payload: AppJwtPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
}

/**
 * JWT token ellenőrzése és dekódolása
 * @param token - A kapott JWT token
 * @returns AppJwtPayload - A dekódolt payload
 * @throws JsonWebTokenError, ha a token érvénytelen vagy a payload nem megfelelő
 */
export function verifyToken(token: string): AppJwtPayload {
  const decoded = jwt.verify(token, JWT_SECRET);
  if (typeof decoded === 'object' && decoded !== null && 'id' in decoded && 'role' in decoded) {
    return {
      id: (decoded as { id: string }).id,
      role: (decoded as { role: string }).role,
    };
  }
  throw new JsonWebTokenError('Invalid token payload');
}
