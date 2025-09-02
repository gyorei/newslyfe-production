import cron from 'node-cron';
import { db } from '../PostgreSQLManager'; // Helyes útvonal a DB kapcsolathoz
import { logger } from '../logger'; // Útvonal a loggerhez

// Ez a változó biztosítja, hogy a job csak egyszer induljon el
let isJobScheduled = false;

/**
 * Elindítja az időzített adatbázis-takarító feladatot.
 * A feladat minden nap hajnali 3:00-kor lefut.
 */
export function startCleanupJob(): void {
  // Ha a job már be van időzítve, ne csináljunk semmit
  if (isJobScheduled) {
    logger.warn('[CleanupScheduler] A takarító feladat már be van időzítve.');
    return;
  }

  // Időzítés: '0 3 * * *' -> minden nap hajnali 3 óra 0 perckor
  // A teszteléshez használhatsz gyakoribb időzítést is, pl. '*/2 * * * *' (minden 2. percben)
  cron.schedule('0 3 * * *', async () => {
    logger.info('[CleanupScheduler] Az időzített adatbázis-takarítás elindul...');

    const startTime = Date.now();

    try {
      // A letesztelt SQL parancs a 24 óránál régebbi hírek törlésére
      const result = await db.query(
        `DELETE FROM public.news WHERE published_at < NOW() - INTERVAL '24 hours'`
      );

      const duration = Date.now() - startTime;
      
      // A result.rowCount tartalmazza a törölt sorok számát
      const deletedRows = result.rowCount ?? 0;

      logger.info(
        `[CleanupScheduler] A takarítás sikeresen lefutott. Törölt hírek száma: ${deletedRows}. Időtartam: ${duration}ms.`
      );
    } catch (error) {
      const duration = Date.now() - startTime;
      logger.error(
        `[CleanupScheduler] Hiba történt az adatbázis-takarítás közben. Időtartam: ${duration}ms.`,
        error
      );
    }
  }, {
    timezone: "Europe/Budapest" // Opcionális, de javasolt beállítani az időzónát
  });

  isJobScheduled = true;
  logger.info('[CleanupScheduler] Az adatbázis-takarító feladat sikeresen beidőzítve (minden nap 03:00).');
}
