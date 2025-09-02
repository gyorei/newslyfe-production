PS C:\news3> npm start

> react-tsx-news@1.0.0 start
> concurrently --kill-others "npm run dev:backend" "npm run dev"

[1] 
[1] > react-tsx-news@1.0.0 dev
[1] > vite
[1] 
[0] 
[0] > react-tsx-news@1.0.0 dev:backend
[0] > dotenv -e .env.development -- cross-env NODE_ENV=development tsx watch src/backend/server/index.ts
[0]
[1] The CJS build of Vite's Node API is deprecated. See https://vite.dev/guide/troubleshooting.html#vite-cjs-node-api-deprecated for more details.
[1] Forced re-optimization of dependencies
[1] 
[1]   VITE v5.4.19  ready in 4846 ms
[1]
[1]   ➜  Local:   http://localhost:3000/
[1]   ➜  Network: use --host to expose
[0] ====================================================
[0] [DATABASE CONFIG] Környezet (NODE_ENV): development
[0] [DATABASE CONFIG] DB_NAME: newsbase
[0] [DATABASE CONFIG] DB_USER: postgres
[0] [DATABASE CONFIG] DB_HOST: localhost
[0] ====================================================
[0] [WARN] Express session middleware nincs telepítve, a session funkcionalitás nem lesz elérhető
[0] [INFO] License admin module routes registered.
[0] [INFO] License recovery module routes registered.
[0] [INFO] API Documentation is available at http://localhost:3002/api-docs
[0] [DEBUG] Express alkalmazás konfigurálva
[0] [INFO] Helmet security middleware betöltve
[0] [INFO] Compression middleware betöltve
[0] [INFO] Rate limit middleware betöltve
[0] [INFO] Express session middleware betöltve
[0] [INFO] Adatbázis kapcsolat ellenőrizve
[0] [INFO] Szerver sikeresen elindult.
[0] [INFO] [CleanupScheduler] Az adatbázis-takarító feladat sikeresen beidőzítve 
(minden nap 03:00).
[0] [INFO] API szerver fut: http://localhost:3002
[0] [INFO]
[0] ┌──────────────────────────────────────────────────┐
[0] │       Backend Startup Profiling Summary        │
[0] ├───────────────────────────────────┬──────────────┤
[0] │ Phase                             │ Duration (ms)│
[0] ├───────────────────────────────────┼──────────────┤
[0] │ Database Connection Check         │      2378.39 │
[0] │ Express Listen & Ready            │       218.15 │
[0] ├───────────────────────────────────┼──────────────┤
[0] │ Total Startup Time                │      2598.15 │
[0] └───────────────────────────────────┴──────────────┘
[0]
[0] [DEBUG] GET /api/health
[0] [DEBUG] GET /api/health
[0] [DEBUG] GET /api/health
[0] [DEBUG] GET /api/video-countries
[0] [DEBUG] GET /api/health
[0] [DEBUG] GET /api/video-countries
[0] [DEBUG] GET /api/health
[0] [DEBUG] GET /api/health
[0] [DEBUG] GET /api/video-countries
[0] [DEBUG] GET /api/country/Belgium/sources
[0] [INFO] Források lekérdezése ország szerint: Belgium, MINDEN forrás
[0] [DEBUG] Ország források lekérdezése (Belgium): 35 találat
