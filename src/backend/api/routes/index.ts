/**
 * API Routes - API útvonalak összegyűjtése és bekötése
 *
 * Ez a fájl összekapcsolja az összes API route-ot és előkészíti a fő Express
 * alkalmazáshoz való csatlakoztatásukat. Minden új API modult itt kell
 * regisztrálni a megfelelő előtaggal.
 */

import express from 'express';
import LocalApi from './Local/Local';
import CountryApi from './Country/Country'; // Új import
import ContinentApi from './Continent/Continent'; // Kontinens API importálása
// ========================================
// 🎥 VIDEO API IMPORT - ÚJ VIDEÓ ROUTE!
// ========================================
import VideoApi from './video/videoAggregator/news'; // Video API importálása
import VideoCountriesApi from './video/videoCountries/videoCountries'; // ÚJ: videós országok route import

// További route-ok importálása a jövőben:
// import SourceApi from './Source/SourceApi';

// Fő API router létrehozása
const router = express.Router();

// API verzió és prefix beállítása
const API_VERSION = process.env.API_VERSION || 'v1';

// API egészségügyi végpont
router.get('/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    timestamp: Date.now(),
    version: API_VERSION,
  });
});

// Ping végpont a kapcsolat ellenőrzéséhez
router.get('/ping', (req, res) => {
  res.status(200).json({
    status: 'ok',
    timestamp: Date.now(),
    message: 'API server is running',
  });
});

// API modulok bekötése
router.use('/local', LocalApi);
router.use('/country', CountryApi); // Új modul bekötése
router.use('/continent', ContinentApi); // Kontinens API bekötése
// ========================================
// 🎥 VIDEO API BEKÖTÉS - ÚJ VIDEÓ ROUTE!
// ========================================
router.use('/video', VideoApi); // Video API bekötése
router.use('/video-countries', VideoCountriesApi); // ÚJ: videós országok route bekötése


// További modulok bekötése a jövőben:
// router.use('/sources', SourceApi);

// Ideiglenes végpontok a hiányzó funkciókhoz (később eltávolíthatók, ha megvalósulnak a valódi modulok)
router.get('/countries', (req, res) => {
  res.status(200).json({
    message: 'Országok listája - hamarosan elérhető',
    example: ['Hungary', 'Germany', 'France', 'United Kingdom', 'Italy', 'Spain'],
  });
});

router.post('/sync', (req, res) => {
  res.status(200).json({
    message: 'Szinkronizációs végpont - hamarosan elérhető',
    timestamp: Date.now(),
  });
});

// API dokumentációs végpont (a jövőben Swagger/OpenAPI integrációval)
router.get('/', (req, res) => {
  res.status(200).json({
    name: 'News API',
    version: API_VERSION,
    endpoints: [
      '/api/health',
      '/api/ping',
      '/api/local/news',
      '/api/local/location',
      '/api/local/preferences',
      '/api/local/has-more-sources',
      '/api/continent/:continent/sources', // Új kontinens API végpont
      '/api/continent/:continent/news', // Új kontinens API végpont
      '/api/continent/:continent/countries', // Új kontinens API végpont
      '/api/countries',
      '/api/country/:country/sources', // Most már a Country modulban
      '/api/country/:country/news', // Új végpont a Country modulban
      '/api/country/by-letter/:letter', // Új végpont a Country modulban
      '/api/video/news', // 🎥 Új video API végpont
      '/api/video/debug', // 🎥 Új video debug végpont
      '/api/video-countries', // 🎥 Video országok végpont
      '/api/sync (POST)',
    ],
    videoEndpoints: {
      news: '/api/video/news?country=Hungary',
      debug: '/api/video/debug',
      countries: '/api/video-countries',
      availableCountries: ['Hungary', 'Germany', 'United Kingdom', 'United States']
    },
    documentation: '/api/docs', // Jövőbeli végpont
  });
});

// Router exportálása
export default router;
