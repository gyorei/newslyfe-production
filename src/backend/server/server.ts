// src\backend\server\server.ts
import { db } from './PostgreSQLManager.js';
import { logger } from './logger.js';
import { PORT, isProd } from './config/environment.js';
import appPromise from './app.js';
import { Server } from 'http';
import { startupProfiler } from './utils/startupProfiler.js';

/**
 * A HTTP szerver indítása és erőforrások kezelése
 * - Adatbázis kapcsolódás
 * - Express alkalmazás indítása
 * - Tiszta leállítás kezelése
 */
export async function startServer(): Promise<void> {
  try {
    // Adatbázis kapcsolat ellenőrzése induláskor
    startupProfiler.start('Database Connection Check'); // MÉRÉS INDÍTÁSA
    await db.checkConnection();
    startupProfiler.stop('Database Connection Check'); // MÉRÉS LEÁLLÍTÁSA
    logger.info('Adatbázis kapcsolat ellenőrizve');

    // Express szerver indítása
    startupProfiler.start('Express Listen & Ready'); // MÉRÉS INDÍTÁSA
    const app = await appPromise;
    const server = app.listen(PORT, () => {
      startupProfiler.stop('Express Listen & Ready');
      logger.info(`API szerver fut: http://localhost:${PORT}`);
      // A HIÁNYZÓ HÍVÁS BEILLESZTÉSE
      startupProfiler.stop('Total Startup Time');
      // A VÉGSŐ RIPORT MEGJELENÍTÉSE
      logger.info(startupProfiler.getSummary());
    });

    // Tiszta leállítás kezelése
    setupGracefulShutdown(server);
  } catch (error) {
    logger.error('Hiba a szerver indítása közben:', error);
    process.exit(1);
  }
}

/**
 * Rendezett leállás beállítása
 */
function setupGracefulShutdown(server: Server): void {
  const signals = ['SIGINT', 'SIGTERM'] as const;

  for (const signal of signals) {
    process.on(signal, async () => {
      logger.info(`${signal} jelzés érkezett, szerver leállítása megkezdve...`);

      // HTTP szerver leállítása először - ne fogadjon új kéréseket
      server.close(() => {
        logger.info('HTTP szerver leállítva, kapcsolatok lezárása...');

        // Adatbázis kapcsolatok lezárása Promise-alapon
        db.close()
          .then(() => {
            logger.info('Adatbázis kapcsolatok lezárva, tiszta leállítás kész');

            // Csak az összes művelet befejezése után történik kilépés
            if (isProd) {
              // Production módban egyszerűen hagyjuk befejezni a Node folyamatot
              logger.info('Kilépés a szerver folyamatból');
            } else {
              // Fejlesztés során explicit kilépés a gyorsabb újraindításhoz
              process.exit(0);
            }
          })
          .catch((err) => {
            logger.error('Hiba az adatbázis kapcsolatok lezárásakor:', err);

            // Hiba esetén kilépés kóddal (csak fejlesztéskor)
            if (!isProd) {
              process.exit(1);
            }
          });
      });

      // Biztonsági időkorlát a tiszta leálláshoz
      // De ez csak fejlesztés során állítja le a folyamatot kényszerítetten
      if (!isProd) {
        setTimeout(() => {
          logger.error('Időtúllépés a szerver leállítás során, kényszerített leállítás');
          process.exit(1);
        }, 10000); // 10 másodperces időkorlát
      }
    });
  }
}

// Csak akkor indítsuk a szervert, ha közvetlenül ezt a fájlt hívják meg
// ESM megfelelője a régi "require.main === module" trükknek
const isMainModule = import.meta.url.startsWith('file:') && process.argv[1] && import.meta.url.endsWith(process.argv[1]);

if (isMainModule) {
  startServer().catch((error) => {
    logger.error('Végzetes hiba a szerver indítása során:', error);
    process.exit(1);
  });
}


/*
// Csak akkor indítsuk a szervert, ha közvetlenül ezt a fájlt hívják meg
if (require.main === module) {
  startServer().catch((error) => {
    logger.error('Végzetes hiba a szerver indítása során:', error);
    process.exit(1);
  });
}
*/
export default { startServer };

