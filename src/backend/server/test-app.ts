// src/backend/server/test-app.ts
import express from 'express';
import cors from 'cors';
import { errorHandler, notFoundHandler } from './middleware/error-handler';
import { CORS_CONFIG } from './config/environment';
import fs from 'fs'; // Node.js fájlrendszer modul
import path from 'path';

// Middleware-ek szinkron importálása a tesztekhez
import helmet from 'helmet';
import compression from 'compression';
import rateLimit from 'express-rate-limit';

// Licenc modul komponenseinek importálása
import { createAdminRoutes } from '../license/routes/adminRoutes';
import { createRecoveryRoutes } from '../license/routes/recoveryRoutes';
import { KeyService } from '../license/services/keyService';
import { RecoveryController } from '../license/controllers/recoveryController';
import { logger } from './logger';

/**
 * Létrehoz egy Express alkalmazást KIFEJEZETTEN a tesztelési környezethez.
 * Nem tartalmaz dinamikus, aszinkron importokat, így determinisztikusan működik.
 */
export function createTestApp(): express.Application {
  const app = express();

  // Alapvető middleware-ek
  app.use(helmet());
  app.use(cors(CORS_CONFIG));
  app.use(compression());
  app.use(express.json({ limit: '1mb' }));
  app.use(express.urlencoded({ extended: true, limit: '1mb' }));

  // Statikus fájlok (ha szükséges a teszthez)
  app.use(express.static(path.join(__dirname, '../../../../build')));

  // --- LICENC MODUL INICIALIZÁLÁSA ÉS BEKÖTÉSE ---
  const privateKeyPath = process.env.LICENSE_PRIVATE_KEY_PATH;
  if (!privateKeyPath) {
    throw new Error('FATAL ERROR: LICENSE_PRIVATE_KEY_PATH is not defined in your .env.test file.');
  }
  let privateKey: string;
  try {
    // A kulcsot közvetlenül a .pem fájlból olvassuk be, ami garantálja a helyes formátumot.
    privateKey = fs.readFileSync(path.resolve(process.cwd(), privateKeyPath), 'utf-8');
  } catch (error) {
    logger.error('Failed to read private key or initialize license service:', error);
    throw error;
  }
  const keyService = new KeyService(privateKey);
  const recoveryController = new RecoveryController(keyService);

  // Útvonalak létrehozása és bekötése
  const adminLicenseRoutes = createAdminRoutes(keyService); // Helyes: KeyService-t adunk át
  const recoveryLicenseRoutes = createRecoveryRoutes(recoveryController);

  // Rate Limiter a recovery végpontra
  const recoveryLimiter = rateLimit({
      windowMs: 15 * 60 * 1000,
      max: 10,
  });

  app.use('/api/admin/license', adminLicenseRoutes);
  app.use('/api/recover/license', recoveryLimiter, recoveryLicenseRoutes);
  
  // Hibakezelők
  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
