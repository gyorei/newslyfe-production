// src/backend/server/index.ts

// ===================================================================
//  PROFILOZÓ ÉS ALKALMAZÁS INDÍTÁSA
// ===================================================================
// A környezeti változókat a 'dotenv-cli' tölti be a package.json scriptben.

import { startupProfiler } from './utils/startupProfiler';
startupProfiler.init();
startupProfiler.start('Total Startup Time');

// ===================================================================
//  ALKALMAZÁS IMPORTÁLÁSA ÉS INDÍTÁSA
// ===================================================================
// Most, hogy a process.env be van állítva, az importok már helyesen fognak működni.
import app, { createApp } from './app';
import { startServer } from './server';
import { db } from './PostgreSQLManager';
import { logger } from './logger';
import * as config from './config/environment';
import { startCleanupJob } from './jobs/cleanupScheduler';

// Exportáljuk a szükséges komponenseket
export { app, createApp, startServer, db, logger, config };

// Közvetlen indítás esetén elindítjuk a szervert
// ESM-ben nincs egyszerű main module detekció, ezért mindig indítjuk
// if (import.meta.main) { // Node.js 20+ feature - még nem elérhető
{
  startServer().then(() => {
    logger.info('Szerver sikeresen elindult.');
    startCleanupJob(); // Időzített takarító feladat indítása
  }).catch((error) => {
    logger.error('Végzetes hiba a szerver indítása során:', error);
    process.exit(1);
  });
}

// Alapértelmezett export
export default {
  app,
  createApp,
  startServer,
  db,
  logger,
  config,
};