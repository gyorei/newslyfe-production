// src/backend/server/app.ts
/*
A app.ts fájl a backend egyik legkritikusabb része, mert itt történik az egész Express szerver konfigurációja, a middleware-ek, biztonsági beállítások, API útvonalak, session kezelés, rate limiting, CORS, statikus fájlok, hibakezelés stb.

### Kritikus biztonsági pontok ebben a fájlban:

1. **Biztonsági middleware-ek (helmet, rateLimit, session)**
   - Ha ezek nincsenek telepítve vagy helyesen konfigurálva, a szerver sebezhető lehet XSS, brute force, session hijacking, stb. ellen.
   - A kód dinamikusan próbálja betölteni őket, de ha hiányoznak, csak figyelmeztetést ír ki, nem áll le!  
     **Javaslat:** Ezeket mindig telepítsd és ellenőrizd, hogy tényleg aktívak!

2. **CORS beállítás**
   - A CORS_CONFIG helyes beállítása fontos, hogy csak a kívánt domainekről lehessen elérni az API-t.

3. **Session kezelés**
   - A session titkos kulcsot (SESSION_SECRET) környezeti változóban kell tartani, ne legyen hardcode-olva!
   - A cookie secure opciója csak production módban aktív, fejlesztéskor nem.

4. **Rate limiting**
   - Csak az `/api` útvonalakra van beállítva, de a többi útvonal (pl. `/api-docs`, `/feeds`) nincs védve.

5. **Statikus fájlok**
   - A build és a public/feeds mappákból bármi elérhető, ügyelj rá, hogy ne kerüljön oda érzékeny adat!

6. **API útvonalak**
   - Az összes API route itt van regisztrálva, a valódi jogosultság-ellenőrzés és input validáció ezekben a route-okban történik.

7. **Swagger dokumentáció**
   - A `/api-docs` mindenki számára elérhető, így a teljes API dokumentáció nyilvános.

8. **Hibakezelés**
   - A végén globális hibakezelő middleware van, ami jó, de figyelj rá, hogy ne szivárogjon ki érzékeny információ a hibaválaszokban.

---

**Összefoglalva:**  
Ez a fájl a backend biztonságának egyik legfontosabb központja.  
A legkritikusabb pontok:  
- Biztonsági middleware-ek megléte és helyes konfigurációja  
- Session titkosítás  
- Rate limiting  
- CORS helyes beállítása  
- Statikus fájlok védelme  
- Hibakezelés

A tényleges sebezhetőségek a route-okban és a middleware-ekben lehetnek, de ha ezek a védelmek hiányoznak vagy hibásak, az egész rendszer sérülékeny!

*/

import express, { Request, Response, NextFunction, RequestHandler } from 'express';
import cors from 'cors';
import { errorHandler, notFoundHandler } from './middleware/error-handler.js';
import { CORS_CONFIG } from './config/environment.js';
import { logger } from './logger.js';
import { startupProfiler } from './utils/startupProfiler.js';
// Import SessionOptions for proper typing
import { SessionOptions } from 'express-session';
import path from 'path';
import fs from 'fs';

// Swagger/OpenAPI integráció
import swaggerUi from 'swagger-ui-express';
import swaggerJsDoc from 'swagger-jsdoc';
import { fileURLToPath } from 'url';

// Az API útvonalak importálása
import apiRoutes from '../api/routes/index.js';
// ==========================================
// Keresési modul importálása (különálló modul)
// ==========================================
import searchRouter from '../search/Search.js';
import authRouter from '../auth/routes/auth.routes.js';
import { createAdminRoutes } from '../license/routes/adminRoutes.js';
import { createRecoveryRoutes } from '../license/routes/recoveryRoutes.js';
import { KeyService } from '../license/services/keyService.js';
import { RecoveryController } from '../license/controllers/recoveryController.js';
// Middleware típusok definiálása a biztonságosabb típusozás érdekében
type HelmetMiddleware = (options?: Record<string, unknown>) => RequestHandler;
type CompressionMiddleware = (options?: Record<string, unknown>) => RequestHandler;
type RateLimitMiddleware = (options?: Record<string, unknown>) => RequestHandler;
type SessionMiddleware = (options: SessionOptions) => RequestHandler;

// Opcionális modulok importálása típusokkal
let helmet: HelmetMiddleware | null = null;
let compression: CompressionMiddleware | null = null;
let rateLimit: RateLimitMiddleware | null = null;
let expressSession: SessionMiddleware | null = null;

// Próbáljuk meg betölteni a modulokat, de ne álljunk le, ha nincsenek telepítve
(async () => {
  startupProfiler.start('Middleware Dynamic Imports');
  try {
    const results = await Promise.all([
      import('helmet').then(m => m.default as HelmetMiddleware).catch(() => null),
      import('compression').then(m => m.default as CompressionMiddleware).catch(() => null),
      import('express-rate-limit').then(m => m.default as RateLimitMiddleware).catch(() => null),
      import('express-session').then(m => m.default as unknown as SessionMiddleware).catch(() => null),
    ]);
    [helmet, compression, rateLimit, expressSession] = results;

    // HIBATŰRŐ MÓDOSÍTÁS: Helmet middleware nélkül is fut (csökkentett biztonsággal)
    // if (!helmet) {
    //   logger.error('FATAL: Helmet security middleware nem található, az alkalmazás nem indul el!');
    //   process.exit(1);
    // } else {
    //   logger.info('Helmet security middleware betöltve');
    // }
    if (!helmet) {
      logger.warn('WARNING: Helmet security middleware nem található! Alkalmazás csökkentett biztonsággal fut. Telepítsd: npm install helmet');
    } else {
      logger.info('Helmet security middleware betöltve');
    }

    if (compression) logger.info('Compression middleware betöltve');
    else logger.warn('Compression middleware nem található, kérlek telepítsd: npm install compression');

    if (rateLimit) logger.info('Rate limit middleware betöltve');
    else logger.warn('Rate limit middleware nem található, kérlek telepítsd: npm install express-rate-limit');

    if (expressSession) logger.info('Express session middleware betöltve');
    else logger.warn('Express session middleware nem található, kérlek telepítsd: npm install express-session');
  } catch (error) {
    // HIBATŰRŐ MÓDOSÍTÁS: Middleware import hiba esetén alapértelmezett biztonsággal fut
    // logger.error('FATAL: Hiba a middleware-ek dinamikus importálása során, az alkalmazás leáll:', error);
    // process.exit(1);
    logger.warn('WARNING: Hiba a middleware-ek importálása során, alapértelmezett biztonsággal fut:', error);
  } finally {
    startupProfiler.stop('Middleware Dynamic Imports');
  }
})();

// --- LICENC MODUL INICIALIZÁLÁSA ÉS BEKÖTÉSE ---
// TODO: License service temporarily disabled for deployment
// const privateKeyPathEnv = process.env.LICENSE_PRIVATE_KEY_PATH;
// if (!privateKeyPathEnv) {
//   logger.error('FATAL ERROR: LICENSE_PRIVATE_KEY_PATH is not defined. Cannot start license service.');
//   process.exit(1); // Azonnali leállás, ha hiányzik a kritikus környezeti változó!
// }
// const privateKeyPath: string = privateKeyPathEnv;

async function initLicenseModules(app: express.Application, rateLimit: RateLimitMiddleware | null) {
  try {
    startupProfiler.start('File IO: License Key Read');
    const privateKey = await fs.promises.readFile(path.resolve(process.cwd(), privateKeyPath), 'utf-8');
    startupProfiler.stop('File IO: License Key Read');
    const keyService = new KeyService(privateKey);
    const adminLicenseRoutes = createAdminRoutes(keyService);
    app.use('/api/admin/license', adminLicenseRoutes);
    logger.info('License admin module routes registered.');

    const recoveryController = new RecoveryController(keyService);
    const recoveryLicenseRoutes = createRecoveryRoutes(recoveryController);
    const recoveryLimiter = rateLimit ? rateLimit({
      windowMs: 15 * 60 * 1000,
      max: 10,
      message: 'Túl sok visszaállítási kísérlet. Kérem várjon 15 percet.',
      standardHeaders: true,
      legacyHeaders: false,
    }) : (req: Request, res: Response, next: NextFunction) => next();
    app.use('/api/recover/license', recoveryLimiter, recoveryLicenseRoutes);
    logger.info('License recovery module routes registered.');
  } catch (error) {
    // HIBATŰRŐ MÓDOSÍTÁS: License service hiba esetén alkalmazás license nélkül fut
    // logger.error('Failed to read private key or initialize license service:', error);
    // process.exit(1); // Ha a kulcs betöltése sikertelen, álljon le a szerver!
    logger.warn('WARNING: License service inicializálási hiba, alkalmazás license nélkül fut:', error);
  }
}

// --- Ideiglenes auth middleware (productionban 401-et dob, fejlesztéskor átengedi) ---
const authMiddleware = (req: Request, res: Response, _next: NextFunction) => {
  // Itt fejleszthető: pl. token ellenőrzés, user check, stb.
  res.status(401).send('API dokumentáció nem elérhető.');
};

/**
 * Express alkalmazás létrehozása és konfigurálása
 * Ez a fájl definiálja az alkalmazás viselkedését, middleware-eit és útvonalait.
 */
export async function createApp(): Promise<express.Application> {
  // ==========================================
  // Profiling hozzáadása az app.ts fájlhoz
  // ==========================================
  startupProfiler.start('App Creation Start');
  const app = express();
  startupProfiler.stop('App Creation Start');

  // ==========================================
  // Middleware-ek regisztrációja
  // ==========================================
  startupProfiler.start('Middleware Registration');

  // ==========================================
  // Biztonsági middleware-k beállítása
  // ==========================================
  // Helmet hozzáadása a biztonsági fejlécek beállításához, ha elérhető
  if (helmet) {
    app.use(
      helmet({
        contentSecurityPolicy: {
          directives: {
            defaultSrc: ["'self'"],
            scriptSrc: ["'self'", "'unsafe-inline'"],
            styleSrc: ["'self'", "'unsafe-inline'"],
            imgSrc: ["'self'", 'data:', 'https:'],
          },
        },
        // Régebbi böngészőkkel való kompatibilitás
        xssFilter: true,
        noSniff: true,
        referrerPolicy: { policy: 'same-origin' },
      }),
    );
  }

  // ==========================================
  // CORS beállítása
  // ==========================================
  app.use(cors(CORS_CONFIG));

  // ==========================================
  // Session middleware beállítása
  // ==========================================
  // HIBATŰRŐ MÓDOSÍTÁS: SESSION_SECRET fallback default értékkel
  // if (!process.env.SESSION_SECRET) {
  //   logger.error('FATAL: SESSION_SECRET environment variable is not defined');
  //   process.exit(1);
  // }
  if (!process.env.SESSION_SECRET) {
    logger.warn('WARNING: SESSION_SECRET missing, using secure fallback for session management');
    process.env.SESSION_SECRET = 'newslyfe-session-fallback-' + Date.now() + '-' + Math.random().toString(36);
  }
  if (expressSession) {
    app.use(
      expressSession({
        secret: process.env.SESSION_SECRET,
        resave: false,
        saveUninitialized: false,
        cookie: {
          secure: process.env.NODE_ENV === 'production',
          maxAge: 24 * 60 * 60 * 1000, // 24 óra
        },
      }),
    );
    logger.info('Express session middleware beállítva');
  } else {
    logger.warn(
      'Express session middleware nincs telepítve, a session funkcionalitás nem lesz elérhető',
    );
  }

  // ==========================================
  // Teljesítménnyel kapcsolatos middleware-k
  // ==========================================
  // Válaszok tömörítése gzip/deflate segítségével, ha elérhető
  if (compression) {
    app.use(compression());
  }

  // ==========================================
  // Kérés/válasz middleware-k
  // ==========================================
  // JSON kérések feldolgozása
  app.use(express.json({ limit: '3mb' })); // Limitált méret a JSON kérésekre

  // URL-kódolt kérések feldolgozása
  app.use(express.urlencoded({ extended: true, limit: '1mb' }));

  // ==========================================
  // Rate limiting (DoS védelem), ha elérhető
  // ==========================================
  if (rateLimit) {
    // API kérések számának korlátozása
    const apiLimiter = rateLimit({
      windowMs: 15 * 60 * 1000, // 15 perc
      max: 100, // maximális kérésszám a windowMs időablakban
      standardHeaders: true, // X-RateLimit fejlécek küldése
      legacyHeaders: false, // X-RateLimit-* fejlécek kikapcsolása
      message: 'Túl sok kérés érkezett, kérem várjon 15 percet',
    });
    // Rate limiting csak az API útvonalakra
    app.use('/api', apiLimiter);
  }

  // ==========================================
  // Naplózási middleware
  // ==========================================
  // Egyszerű kérés naplózó
  app.use((req, res, next) => {
    logger.debug(`${req.method} ${req.path}`);
    next();
  });

  // ==========================================
  // Statikus fájlok kiszolgálása (React build + JSON feedek)
  // ==========================================
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);
  app.use(express.static(path.join(__dirname, '../../../../build')));
  app.use('/feeds', express.static(path.join(__dirname, '../../../../public/feeds')));

  startupProfiler.stop('Middleware Registration');

  // ==========================================
  // Route-ok regisztrációja
  // ==========================================
  startupProfiler.start('Routes Registration');

  // ==========================================
  // API útvonalak regisztrálása
  // ==========================================
  app.use('/api', apiRoutes);

  // ==========================================
  // Health Check Endpoint - Szerver állapot ellenőrzése
  // ==========================================
  app.get('/api/health', (req, res) => {
    res.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV || 'development'
    });
  });

  // ==========================================
  // Ping Endpoint - Egyszerű kapcsolat teszt
  // ==========================================
  app.get('/api/ping', (req, res) => {
    res.send('pong');
  });

  // ==========================================
  // Keresési útvonal regisztrálása (különálló modul)
  // Elkülönítve a többi API-tól a könnyebb fejlesztés/karbantartás érdekében
  // ==========================================
  app.use('/api/search', searchRouter);

  // ==========================================
  // Auth útvonalak
  // ==========================================
  app.use('/api/auth', authRouter);

  // --- LICENC MODUL ASZINKRON INICIALIZÁLÁSA ---
  // TODO: License service temporarily disabled for deployment
  // await initLicenseModules(app, rateLimit);

  // ==========================================
  // SWAGGER / OPENAPI DOKUMENTÁCIÓ BEÁLLÍTÁSA
  // ==========================================
  const swaggerOptions = {
    swaggerDefinition: {
      openapi: '3.0.0',
      info: {
        title: 'NewsBase API',
        version: '1.0.0',
        description: 'Teljes API dokumentáció a NewsBase rendszerhez, beleértve a licenszkezelést is.',
      },
      servers: [
        {
          url: `http://localhost:${process.env.PORT || 3002}`,
          description: 'Fejlesztői szerver',
        },
      ],
    },
    apis: ['./src/backend/**/*.ts'],
  };
  const swaggerDocs = swaggerJsDoc(swaggerOptions);
  app.use(
    '/api-docs',
    process.env.NODE_ENV === 'production'
      ? authMiddleware
      : (req: Request, res: Response, next: NextFunction) => next(),
    swaggerUi.serve,
    swaggerUi.setup(swaggerDocs)
  );
  logger.info(`API Documentation is available at http://localhost:${process.env.PORT || 3002}/api-docs`);

  startupProfiler.stop('Routes Registration');

  // ==========================================
  // Hibakezelő middleware-k
  // ==========================================
  app.use(notFoundHandler);
  app.use(errorHandler);

  logger.debug('Express alkalmazás konfigurálva');

  return app;
}

// Alapértelmezett exportálás
const appPromise = createApp();
export default appPromise;
