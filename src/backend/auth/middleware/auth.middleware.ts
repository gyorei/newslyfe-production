// src\backend\auth\middleware\auth.middleware.ts
import { Request, Response, NextFunction } from 'express';
import { verifyToken, AppJwtPayload } from '../utils/token.js';

/**
 * Middleware: Ellenőrzi a JWT tokent az Authorization headerben.
 * Ha érvényes, a felhasználói adatokat hozzáadja a request-hez (req.user).
 * Ha nem, 401-es hibával válaszol.
 */
export function authMiddleware(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Hiányzó vagy hibás Authorization header' });
  }

  const token = authHeader.split(' ')[1];
  try {
    const payload: AppJwtPayload = verifyToken(token);
    req.user = payload;
    next();
  } catch (_err) {
    return res.status(401).json({ error: 'Érvénytelen vagy lejárt token' });
  }
}