ok nézzük át !! PS C:\news3> ssh root@91.98.134.222
root@91.98.134.222's password: 
Welcome to Ubuntu 24.04.3 LTS (GNU/Linux 6.8.0-71-generic x86_64)

 * Documentation:  https://help.ubuntu.com
 * Management:     https://landscape.canonical.com
 * Support:        https://ubuntu.com/pro

 System information as of Wed Sep  3 10:54:58 PM UTC 2025

  System load:  0.0               Processes:             146
  Usage of /:   5.4% of 74.79GB   Users logged in:       1
  Memory usage: 12%               IPv4 address for eth0: 91.98.134.222        
  Swap usage:   0%                IPv6 address for eth0: 2a01:4f8:1c1a:ebfa::1


Expanded Security Maintenance for Applications is not enabled.

0 updates can be applied immediately.

Enable ESM Apps to receive additional future security updates.
See https://ubuntu.com/esm or run: sudo pro status


*** System restart required ***
Last login: Wed Sep  3 21:09:20 2025 from 31.46.244.100
root@newslyfe-prod:~# cd /var/www/newslyfe
root@newslyfe-prod:/var/www/newslyfe# git pull
npm install
npm run build:backend
pm2 start ecosystem.config.cjsremote: Enumerating objects: 163, done.
remote: Counting objects: 100% (163/163), done.
remote: Compressing objects: 100% (21/21), done.
remote: Total 83 (delta 52), reused 83 (delta 52), pack-reused 0 (from 0)       
Unpacking objects: 100% (83/83), 11.12 KiB | 258.00 KiB/s, done.
From https://github.com/gyorei/newslyfe-production
   288ee4c..d822554  master     -> origin/master
Updating 288ee4c..d822554
Fast-forward
 adatok.md                                          | 123 +++++
 .../api/common/ErrorHandler/ErrorHandler.ts        |   0
 .../api/common/imageExtractor/imageExtractor.ts    |   4 +-
 .../imageExtractorDynamicConfidence.ts             |   6 +-
 .../common/imageExtractor/imageExtractorQuality.ts |   4 +-
 .../imageExtractor/imageExtractorWebScraping.ts    |   8 +-
 src/backend/api/common/imageExtractor/index.ts     |  28 +-
 src/backend/api/common/problematicSourcesFilter.ts |   2 +-
 .../r\303\251gisafeRssXmlParser.ts"                |   9 +-
 .../common/safeRssXmlParser/safeRssXmlParser.ts    |   2 +-
 src/backend/api/routes/Continent/Continent.ts      |  10 +-
 src/backend/api/routes/Country/Country.ts          |  14 +-
 ...\261r\303\251s-Implement\303\241l\303\241sa.md" | 132 -----
 src/backend/api/routes/Local/ETag.MD               | 155 ------
 src/backend/api/routes/Local/Local.ts              |  23 +-
 .../backend/api/routes/Local/fejleszt\303\251s.md" | 462 ------------------    
 .../routes/Local/local-jav\303\255t\303\241s.md"   | 440 -----------------     
 .../api/routes/Local/problematicSourcesFilter.ts   |   2 +-
 src/backend/api/routes/index.ts                    |  12 +-
 .../api/routes/video/videoAggregator/news.ts       |   5 +-
 .../api/routes/video/videoAggregator/test.ts       |   2 +-
 .../video/videoAggregator/videoAggregator.ts       |   2 +-
 .../routes/video/videoCountries/videoCountries.ts  |   2 +-
 src/backend/api/routes/webScraper/Jazeera-RSS.md   | 221 ---------
 .../api/routes/webScraper/alJazeeraScraper.ts      |   0
 src/backend/api/routes/webScraper/apNewsScraper.ts |   2 +-
 src/backend/api/routes/webScraper/consol-log.md    | 543 --------------------- 
 src/backend/api/routes/webScraper/html.md          |   7 -
 src/backend/api/routes/webScraper/webScraper.ts    |   4 +-
 .../routes/webScraper/\303\272j-kapar\303\263.md"  | 120 -----
 src/backend/api/terv.md                            |   0
 src/backend/api/utils/cacheUtils.ts                |   2 +-
 src/backend/api/utils/newsDeduplication.ts         |  36 --
 src/backend/api/utils/timeUtils.ts                 |   2 +-
 src/backend/auth/controllers/auth.controller.ts    |  11 +-
 src/backend/auth/index.ts                          |   2 +-
 src/backend/auth/middleware/auth.middleware.ts     |   2 +-
 src/backend/auth/models/user.model.ts              |   2 +-
 src/backend/auth/passport-setup.ts                 |   6 +-
 src/backend/auth/routes/auth.routes.ts             |   8 +-
 src/backend/common/db/newsStorage.ts               |   4 +-
 src/backend/license/controllers/adminController.ts |   2 +-
 .../license/controllers/recoveryController.ts      |   4 +-
 src/backend/license/index.ts                       |  66 ---
 src/backend/license/models/licenseModel.ts         |   2 +-
 src/backend/license/routes/adminRoutes.ts          |   6 +-
 src/backend/license/routes/recoveryRoutes.ts       |   2 +-
 src/backend/license/services/keyService.ts         |   4 +-
 .../license/tests/license.integration.test.ts      |   8 +-
 src/backend/license/utils/db.ts                    |   2 +-
 src/backend/search/Search.ts                       |   4 +-
 src/backend/server/PostgreSQLManager.ts            |   4 +-
 src/backend/server/app.ts                          |  23 +-
 src/backend/server/data/PostgreSQLDataAccess.ts    |   4 +-
 src/backend/server/jobs/cleanupScheduler.ts        |   4 +-
 src/backend/server/middleware/error-handler.ts     |   4 +-
 src/backend/server/test-app.ts                     |  16 +-
 src/backend/server/utils/startupProfiler.ts        |   2 +-
 .../tests/EGYSZER\305\260 MOCK VERZI\303\223.md"   |  98 ----
 59 files changed, 255 insertions(+), 2419 deletions(-)
 delete mode 100644 src/backend/api/common/ErrorHandler/ErrorHandler.ts
 delete mode 100644 "src/backend/api/routes/Country/Fontoss\303\241gi-Szint-Sz\305\261r\303\251s-Implement\303\241l\303\241sa.md"
 delete mode 100644 src/backend/api/routes/Local/ETag.MD
 delete mode 100644 "src/backend/api/routes/Local/fejleszt\303\251s.md"
 delete mode 100644 "src/backend/api/routes/Local/local-jav\303\255t\303\241s.md"
 delete mode 100644 src/backend/api/routes/webScraper/Jazeera-RSS.md
 delete mode 100644 src/backend/api/routes/webScraper/alJazeeraScraper.ts       
 delete mode 100644 src/backend/api/routes/webScraper/consol-log.md
 delete mode 100644 src/backend/api/routes/webScraper/html.md
 delete mode 100644 "src/backend/api/routes/webScraper/\303\272j-kapar\303\263.md"
 delete mode 100644 src/backend/api/terv.md
 delete mode 100644 src/backend/api/utils/newsDeduplication.ts
 delete mode 100644 src/backend/license/index.ts
 delete mode 100644 "src/backend/tests/EGYSZER\305\260 MOCK VERZI\303\223.md"   
root@newslyfe-prod:/var/www/newslyfe# pm2 delete all
[PM2] Applying action deleteProcessId on app [all](ids: [ 0 ])
[PM2] [news-backend](0) ✓
┌────┬────────────────────┬──────────┬──────┬───────────┬──────────┬──────────┐
│ id │ name               │ mode     │ ↺    │ status    │ cpu      │ memory   │ 
└────┴────────────────────┴──────────┴──────┴───────────┴──────────┴──────────┘ 
root@newslyfe-prod:/var/www/newslyfe# rm -rf dist/ node_modules/
root@newslyfe-prod:/var/www/newslyfe# npm install
npm warn deprecated @types/helmet@4.0.0: This is a stub types definition. helmet provides its own type definitions, so you do not need this installed.
npm warn deprecated inflight@1.0.6: This module is not supported, and leaks memory. Do not use it. Check out lru-cache if you want a good and tested way to coalesce async requests by a key value, which is much more comprehensive and powerful.
npm warn deprecated @types/iconv-lite@0.0.1: This is a stub types definition for iconv-lite (https://github.com/ashtuchkin/iconv-lite). iconv-lite provides its 
own type definitions, so you don\'t need @types/iconv-lite installed!
npm warn deprecated @npmcli/move-file@1.1.2: This functionality has been moved to @npmcli/fs
npm warn deprecated lodash.get@4.4.2: This package is deprecated. Use the optional chaining (?.) operator instead.
npm warn deprecated flatten@1.0.3: flatten is deprecated in favor of utility frameworks such as lodash.
npm warn deprecated npmlog@6.0.2: This package is no longer supported.
npm warn deprecated lodash.isequal@4.5.0: This package is deprecated. Use require('node:util').isDeepStrictEqual instead.
npm warn deprecated @humanwhocodes/config-array@0.13.0: Use @eslint/config-array instead
npm warn deprecated rimraf@3.0.2: Rimraf versions prior to v4 are no longer supported
npm warn deprecated are-we-there-yet@3.0.1: This package is no longer supported.npm warn deprecated glob@7.2.3: Glob versions prior to v9 are no longer supported
npm warn deprecated @humanwhocodes/object-schema@2.0.3: Use @eslint/object-schema instead
npm warn deprecated glob@7.1.6: Glob versions prior to v9 are no longer supported
npm warn deprecated boolean@3.2.0: Package no longer supported. Contact Support 
at https://www.npmjs.com/support for more info.
npm warn deprecated gauge@4.0.4: This package is no longer supported.
npm warn deprecated eslint@8.57.1: This version is no longer supported. Please see https://eslint.org/version-support for other options.

> react-tsx-news@1.0.0 prepare
> husky


added 1948 packages, and audited 1949 packages in 24s

315 packages are looking for funding
  run `npm fund` for details

14 vulnerabilities (8 moderate, 6 high)

To address all issues (including breaking changes), run:
  npm audit fix --force

Run `npm audit` for details.
root@newslyfe-prod:/var/www/newslyfe# npm run build:backend

> react-tsx-news@1.0.0 build:backend
> cross-env NODE_ENV=production tsc -p tsconfig.server.json

root@newslyfe-prod:/var/www/newslyfe# pm2 start ecosystem.config.cjs
[PM2][WARN] Applications news-backend not running, starting...
[PM2] App [news-backend] launched (1 instances)
┌────┬────────────────────┬──────────┬──────┬───────────┬──────────┬──────────┐
│ id │ name               │ mode     │ ↺    │ status    │ cpu      │ memory   │ 
├────┼────────────────────┼──────────┼──────┼───────────┼──────────┼──────────┤ 
│ 0  │ news-backend       │ cluster  │ 0    │ online    │ 0%       │ 39.9mb   │ 
└────┴────────────────────┴──────────┴──────┴───────────┴──────────┴──────────┘ 
root@newslyfe-prod:/var/www/newslyfe# # A szerveren, a pm2 start után várj pár másodpercet:
root@newslyfe-prod:/var/www/newslyfe# pm2 status
┌────┬────────────────────┬──────────┬──────┬───────────┬──────────┬──────────┐
│ id │ name               │ mode     │ ↺    │ status    │ cpu      │ memory   │ 
├────┼────────────────────┼──────────┼──────┼───────────┼──────────┼──────────┤ 
│ 0  │ news-backend       │ cluster  │ 0    │ online    │ 0%       │ 61.7mb   │ 
└────┴────────────────────┴──────────┴──────┴───────────┴──────────┴──────────┘ 
root@newslyfe-prod:/var/www/newslyfe# curl http://localhost:3002/api/health
curl: (7) Failed to connect to localhost port 3002 after 0 ms: Couldn't connect 
to server
root@newslyfe-prod:/var/www/newslyfe# pm2 logs news-backend --lines 100
[TAILING] Tailing last 100 lines for [news-backend] process (change the value with --lines option)
/var/www/newslyfe/logs/out-0.log last 100 lines:
/var/www/newslyfe/logs/err-0.log last 100 lines:
0|news-bac | You have triggered an unhandledRejection, you may have forgotten to catch a Promise rejection:
0|news-bac | Error: Cannot find module '/var/www/newslyfe/dist/backend/server/utils/startupProfiler' imported from /var/www/newslyfe/dist/backend/server/index.js
0|news-bac |     at finalizeResolution (node:internal/modules/esm/resolve:283:11)
0|news-bac |     at moduleResolve (node:internal/modules/esm/resolve:952:10)    
0|news-bac |     at defaultResolve (node:internal/modules/esm/resolve:1188:11)  
0|news-bac |     at ModuleLoader.defaultResolve (node:internal/modules/esm/loader:642:12)
0|news-bac |     at ModuleLoader.#cachedDefaultResolve (node:internal/modules/esm/loader:591:25)
0|news-bac |     at ModuleLoader.resolve (node:internal/modules/esm/loader:574:38)
0|news-bac |     at ModuleLoader.getModuleJobForImport (node:internal/modules/esm/loader:236:38)
0|news-bac |     at ModuleJob._link (node:internal/modules/esm/module_job:130:49)
0|news-bac | You have triggered an unhandledRejection, you may have forgotten to catch a Promise rejection:
0|news-bac | Error: Cannot find module '/var/www/newslyfe/dist/backend/server/utils/startupProfiler' imported from /var/www/newslyfe/dist/backend/server/index.js
0|news-bac |     at finalizeResolution (node:internal/modules/esm/resolve:283:11)
0|news-bac |     at moduleResolve (node:internal/modules/esm/resolve:952:10)    
0|news-bac |     at defaultResolve (node:internal/modules/esm/resolve:1188:11)  
0|news-bac |     at ModuleLoader.defaultResolve (node:internal/modules/esm/loader:642:12)
0|news-bac |     at ModuleLoader.#cachedDefaultResolve (node:internal/modules/esm/loader:591:25)
0|news-bac |     at ModuleLoader.resolve (node:internal/modules/esm/loader:574:38)
0|news-bac |     at ModuleLoader.getModuleJobForImport (node:internal/modules/esm/loader:236:38)
0|news-bac |     at ModuleJob._link (node:internal/modules/esm/module_job:130:49)
0|news-bac | You have triggered an unhandledRejection, you may have forgotten to catch a Promise rejection:
0|news-bac | Error: Cannot find module '/var/www/newslyfe/dist/backend/server/config/environment' imported from /var/www/newslyfe/dist/backend/server/utils/startupProfiler.js
0|news-bac |     at finalizeResolution (node:internal/modules/esm/resolve:283:11)
0|news-bac |     at moduleResolve (node:internal/modules/esm/resolve:952:10)    
0|news-bac |     at defaultResolve (node:internal/modules/esm/resolve:1188:11)
0|news-bac |     at ModuleLoader.defaultResolve (node:internal/modules/esm/loader:642:12)
0|news-bac |     at ModuleLoader.#cachedDefaultResolve (node:internal/modules/esm/loader:591:25)
0|news-bac |     at ModuleLoader.resolve (node:internal/modules/esm/loader:574:38)
0|news-bac |     at ModuleLoader.getModuleJobForImport (node:internal/modules/esm/loader:236:38)
0|news-bac |     at ModuleJob._link (node:internal/modules/esm/module_job:130:49)
0|news-bac | You have triggered an unhandledRejection, you may have forgotten to catch a Promise rejection:
0|news-bac | Error: Cannot find module '/var/www/newslyfe/dist/backend/search/searchConfig' imported from /var/www/newslyfe/dist/backend/search/Search.js       
0|news-bac |     at finalizeResolution (node:internal/modules/esm/resolve:283:11)
0|news-bac |     at moduleResolve (node:internal/modules/esm/resolve:952:10)    
0|news-bac |     at defaultResolve (node:internal/modules/esm/resolve:1188:11)  
0|news-bac |     at ModuleLoader.defaultResolve (node:internal/modules/esm/loader:642:12)
0|news-bac |     at ModuleLoader.#cachedDefaultResolve (node:internal/modules/esm/loader:591:25)
0|news-bac |     at ModuleLoader.resolve (node:internal/modules/esm/loader:574:38)
0|news-bac |     at ModuleLoader.getModuleJobForImport (node:internal/modules/esm/loader:236:38)
0|news-bac |     at ModuleJob._link (node:internal/modules/esm/module_job:130:49)

