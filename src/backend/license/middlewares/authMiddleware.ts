// src\backend\license\middlewares\authMiddleware.ts
import { Request, Response, NextFunction } from 'express';

export function adminAuthMiddleware(req: Request, res: Response, next: NextFunction) {
  const adminToken = req.headers['x-admin-token'];
  const validToken = process.env.ADMIN_TOKEN;

  if (!validToken) {
    // Ez egy szerver konfigurációs hiba, nem a kliensé.
    console.error('FATAL: ADMIN_TOKEN is not defined in the environment variables.');
    return res.status(500).json({ error: 'Server configuration error: Admin token not set.' });
  }
  if (!adminToken || adminToken !== validToken) {
    return res.status(401).json({ error: 'Unauthorized: Invalid or missing admin token.' });
  }
  next();
}