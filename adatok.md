PS C:\news3> ssh root@91.98.134.222
root@91.98.134.222's password: 
Welcome to Ubuntu 24.04.3 LTS (GNU/Linux 6.8.0-71-generic x86_64)

 * Documentation:  https://help.ubuntu.com
 * Management:     https://landscape.canonical.com
 * Support:        https://ubuntu.com/pro

 System information as of Wed Sep  3 11:54:05 PM UTC 2025

  System load:  0.0               Processes:             149
  Usage of /:   5.4% of 74.79GB   Users logged in:       1
  Memory usage: 13%               IPv4 address for eth0: 91.98.134.222        
  Swap usage:   0%                IPv6 address for eth0: 2a01:4f8:1c1a:ebfa::1


Expanded Security Maintenance for Applications is not enabled.

0 updates can be applied immediately.

Enable ESM Apps to receive additional future security updates.
See https://ubuntu.com/esm or run: sudo pro status


*** System restart required ***
Last login: Wed Sep  3 23:21:26 2025 from 31.46.244.100
root@newslyfe-prod:~# cd /var/www/newslyfe
root@newslyfe-prod:/var/www/newslyfe#
root@newslyfe-prod:/var/www/newslyfe# # Letölti a legfrissebb állapotot
root@newslyfe-prod:/var/www/newslyfe# git fetch origin
 helyi változást és a szerveren lévő mappát
# PONTOSAN olyanná teszi, mint ami a GitHubon van.
git reset --hard origin/master

# Tiszta lappal indulunk
pm2 delete all
rm -rf dist/ node_modules/

# Telepítés és build a HELYES kóddal
npm install
npm run build:backend

# Indítás
pm2 start ecosystem.config.cjsremote: Enumerating objects: 43, done.
remote: Counting objects: 100% (43/43), done.
remote: Compressing objects: 100% (3/3), done.
remote: Total 22 (delta 18), reused 22 (delta 18), pack-reused 0 (from 0)
Unpacking objects: 100% (22/22), 2.22 KiB | 126.00 KiB/s, done.
From https://github.com/gyorei/newslyfe-production
   d600f51..c059b1d  master     -> origin/master
root@newslyfe-prod:/var/www/newslyfe# 
root@newslyfe-prod:/var/www/newslyfe# # Eldobja az ÖSSZES helyi változást és a szerveren lévő mappát
root@newslyfe-prod:/var/www/newslyfe# # PONTOSAN olyanná teszi, mint ami a GitHubon van.
root@newslyfe-prod:/var/www/newslyfe# git reset --hard origin/master
HEAD is now at c059b1d CHORE: Final verification of all ESM imports
root@newslyfe-prod:/var/www/newslyfe# 
root@newslyfe-prod:/var/www/newslyfe# # Tiszta lappal indulunk
root@newslyfe-prod:/var/www/newslyfe# pm2 delete all
[PM2] Applying action deleteProcessId on app [all](ids: [ 0 ])
[PM2] [news-backend](0) ✓
┌────┬────────────────────┬──────────┬──────┬───────────┬──────────┬──────────┐
│ id │ name               │ mode     │ ↺    │ status    │ cpu      │ memory   │
└────┴────────────────────┴──────────┴──────┴───────────┴──────────┴──────────┘
root@newslyfe-prod:/var/www/newslyfe# rm -rf dist/ node_modules/
root@newslyfe-prod:/var/www/newslyfe# 
root@newslyfe-prod:/var/www/newslyfe# # Telepítés és build a HELYES kóddal
root@newslyfe-prod:/var/www/newslyfe# npm install
npm warn deprecated @types/helmet@4.0.0: This is a stub types definition. helmet provides its own type definitions, so you do not need this installed.
npm warn deprecated inflight@1.0.6: This module is not supported, and leaks memory. Do not use it. Check out lru-cache if you want a good and tested way to coalesce async requests by a key value, which is much more comprehensive and powerful.
npm warn deprecated @types/iconv-lite@0.0.1: This is a stub types definition for iconv-lite (https://github.com/ashtuchkin/iconv-lite). iconv-lite provides its own type definitions, so you don\'t need @types/iconv-lite installed!
npm warn deprecated @npmcli/move-file@1.1.2: This functionality has been moved to @npmcli/fs
npm warn deprecated lodash.get@4.4.2: This package is deprecated. Use the optional chaining (?.) operator instead.
npm warn deprecated flatten@1.0.3: flatten is deprecated in favor of utility frameworks such as lodash.
npm warn deprecated npmlog@6.0.2: This package is no longer supported.
npm warn deprecated lodash.isequal@4.5.0: This package is deprecated. Use require('node:util').isDeepStrictEqual instead.
npm warn deprecated @humanwhocodes/config-array@0.13.0: Use @eslint/config-array instead
npm warn deprecated rimraf@3.0.2: Rimraf versions prior to v4 are no longer supported
npm warn deprecated are-we-there-yet@3.0.1: This package is no longer supported.
npm warn deprecated glob@7.2.3: Glob versions prior to v9 are no longer supported
npm warn deprecated @humanwhocodes/object-schema@2.0.3: Use @eslint/object-schema instead
npm warn deprecated glob@7.1.6: Glob versions prior to v9 are no longer supported
npm warn deprecated boolean@3.2.0: Package no longer supported. Contact Support at https://www.npmjs.com/support for more info.     
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

root@newslyfe-prod:/var/www/newslyfe#
root@newslyfe-prod:/var/www/newslyfe# # Indítás
root@newslyfe-prod:/var/www/newslyfe# pm2 start ecosystem.config.cjs
[PM2][WARN] Applications news-backend not running, starting...
[PM2] App [news-backend] launched (1 instances)
┌────┬────────────────────┬──────────┬──────┬───────────┬──────────┬──────────┐
│ id │ name               │ mode     │ ↺    │ status    │ cpu      │ memory   │
├────┼────────────────────┼──────────┼──────┼───────────┼──────────┼──────────┤
│ 0  │ news-backend       │ cluster  │ 0    │ online    │ 0%       │ 39.8mb   │
└────┴────────────────────┴──────────┴──────┴───────────┴──────────┴──────────┘
root@newslyfe-prod:/var/www/newslyfe# pm2 status
alth┌────┬────────────────────┬──────────┬──────┬───────────┬──────────┬──────────┐
│ id │ name               │ mode     │ ↺    │ status    │ cpu      │ memory   │
├────┼────────────────────┼──────────┼──────┼───────────┼──────────┼──────────┤
│ 0  │ news-backend       │ cluster  │ 0    │ online    │ 0%       │ 81.5mb   │
└────┴────────────────────┴──────────┴──────┴───────────┴──────────┴──────────┘
root@newslyfe-prod:/var/www/newslyfe# curl http://localhost:3002/api/health
curl: (7) Failed to connect to localhost port 3002 after 0 ms: Couldn't connect to server
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
0|news-bac | You have triggered an unhandledRejection, you may have forgotten to catch a Promise rejection:
0|news-bac | Error: ENOENT: no such file or directory, open '/var/www/newslyfe/dist/backend/api/routes/videoData/videoData.jsonc'   
0|news-bac |     at Object.readFileSync (node:fs:449:20)
0|news-bac |     at file:///var/www/newslyfe/src/backend/api/routes/videoData/videoData.ts:30:25
0|news-bac |     at ModuleJob.run (node:internal/modules/esm/module_job:263:25)
0|news-bac |     at ModuleLoader.import (node:internal/modules/esm/loader:540:24)
0|news-bac | 2025-09-03T23:54:45: [ERROR] Nem sikerült kapcsolódni az adatbázishoz indításkor: Error: SASL: SCRAM-SERVER-FIRST-MESSAGE: client password must be a string
0|news-bac |     at /var/www/newslyfe/node_modules/pg-pool/index.js:45:11
0|news-bac |     at processTicksAndRejections (node:internal/process/task_queues:95:5)
0|news-bac |     at Database.checkConnection (file:///var/www/newslyfe/src/backend/server/PostgreSQLManager.ts:46:22)

