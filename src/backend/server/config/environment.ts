/**
 * Környezeti konfiguráció a szerverhez
 * src\backend\server\config\environment.ts
 */

// Környezeti mód meghatározása
export const NODE_ENV = process.env.NODE_ENV || 'development';
export const isProd = NODE_ENV === 'production';
export const isDev = NODE_ENV !== 'production';

// Szerver beállítások
export const PORT = parseInt(process.env.PORT || '3002', 10);

// Adatbázis beállítások
export const DB_CONFIG = {
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'newsbase',
  password: process.env.DB_PASSWORD || '',
  port: parseInt(process.env.DB_PORT || '5432', 10),
};

// CORS beállítások
export const CORS_CONFIG = {
  // Fejlesztői módban minden origin engedélyezett
  // Éles környezetben konkrét domaineket kell megadni
  origin: isProd ? (process.env.ALLOWED_ORIGINS || 'https://news-app.example.com').split(',') : '*',

  // Csak a ténylegesen használt metódusok
  methods: ['GET', 'OPTIONS'],

  // Minimális szükséges headerek
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],

  // Csak a szükséges fejlécek kiküldése
  exposedHeaders: ['Content-Type'],

  credentials: true,
  maxAge: 3600,
};

export const API_VERSION = process.env.API_VERSION || '1.0';

// Naplózási beállítások
export const LOG_CONFIG = {
  level: isProd ? 'info' : 'debug',
  // Fejlesztés során konzol, éles környezetben lehet file vagy külső rendszer
  target: isProd ? 'file' : 'console',
  // Naplófájl útvonala
  logPath: process.env.LOG_PATH || './logs',
  // Csak fejlesztés során engedélyezett részletes hibainformációk
  detailedErrors: !isProd,
};

export default {
  NODE_ENV,
  isProd,
  isDev,
  PORT,
  DB_CONFIG,
  CORS_CONFIG,
  API_VERSION,
  LOG_CONFIG,
};
