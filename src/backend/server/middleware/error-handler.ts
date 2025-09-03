import { Request, Response, NextFunction } from 'express';
import { logger } from '../logger.js';
import { isProd } from '../config/environment.js';

// Alkalmazás-specifikus hibaosztály definíciója
export class AppError extends Error {
  statusCode: number;
  isOperational: boolean;

  constructor(message: string, statusCode: number, isOperational = true) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    Error.captureStackTrace(this, this.constructor);
  }
}

// Végső hibakezelő middleware
export function errorHandler(
  err: Error | AppError,
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  // AppError típus ellenőrzése
  const statusCode = err instanceof AppError ? err.statusCode : 500;

  // Naplózás a hiba súlyosságának megfelelően
  if (statusCode >= 500) {
    logger.error(`Szerverhiba: ${req.method} ${req.path}`, err);
  } else {
    logger.warn(`Klienshiba (${statusCode}): ${req.method} ${req.path} - ${err.message}`);
  }

  // Válasz küldése
  res.status(statusCode).json({
    error: statusCode >= 500 ? 'Szerverhiba' : 'Kérés hiba',
    // Csak fejlesztési környezetben adjunk részleteket
    ...(isProd
      ? {}
      : {
          message: err.message,
          path: req.path,
          method: req.method,
          stack: err.stack,
        }),
  });

  next();
}

// 404 hiba kezelése
export function notFoundHandler(req: Request, res: Response): void {
  logger.info(`Nem található végpont: ${req.method} ${req.path}`);

  res.status(404).json({
    error: 'A kért végpont nem található',
    // Csak fejlesztési környezetben adjunk részleteket
    ...(isProd
      ? {}
      : {
          path: req.path,
          method: req.method,
        }),
  });
}

export default {
  AppError,
  errorHandler,
  notFoundHandler,
};
