root@newslyfe-prod:/var/www/newslyfe# rm -rf dist/
root@newslyfe-prod:/var/www/newslyfe# npm run build:backend

> react-tsx-news@1.0.0 build:backend
> cross-env NODE_ENV=production tsc -p tsconfig.server.json

root@newslyfe-prod:/var/www/newslyfe# pm2 start ecosystem.config.cjs
[PM2] Applying action restartProcessId on app [news-backend](ids: [ 0 ])
[PM2] [news-backend](0) ✓
┌────┬────────────────────┬──────────┬──────┬───────────┬──────────┬──────────┐
│ id │ name               │ mode     │ ↺    │ status    │ cpu      │ memory   │
├────┼────────────────────┼──────────┼──────┼───────────┼──────────┼──────────┤
│ 0  │ news-backend       │ cluster  │ 47   │ online    │ 0%       │ 41.4mb   │
└────┴────────────────────┴──────────┴──────┴───────────┴──────────┴──────────┘
root@newslyfe-prod:/var/www/newslyfe# pm2 logs --lines 5
[TAILING] Tailing last 5 lines for [all] processes (change the value with --lines option)
/root/.pm2/pm2.log last 5 lines:
PM2        | 2025-09-02T18:01:17: PM2 log: App [news-backend:0] online
PM2        | 2025-09-02T18:01:18: PM2 log: App name:news-backend id:0 disconnected
PM2        | 2025-09-02T18:01:18: PM2 log: App [news-backend:0] exited with code [0] via signal [SIGINT] 
PM2        | 2025-09-02T18:01:18: PM2 log: App [news-backend:0] starting in -cluster mode-
PM2        | 2025-09-02T18:01:18: PM2 log: App [news-backend:0] online

/root/.pm2/logs/news-backend-out-0.log last 5 lines:
/root/.pm2/logs/news-backend-error-0.log last 5 lines:
0|news-bac | This file is being treated as an ES module because it has a '.js' file extension and '/var/www/newslyfe/package.json' contains "type": "module". To treat it as a CommonJS script, rename it to use the '.cjs' file extension.
0|news-bac |     at file:///var/www/newslyfe/dist/backend/server/index.js:36:23
0|news-bac |     at ModuleJob.run (node:internal/modules/esm/module_job:195:25)
0|news-bac |     at ModuleLoader.import (node:internal/modules/esm/loader:337:24)
0|news-bac |     at importModuleDynamicallyWrapper (node:internal/vm/module:432:15)

0|news-backend  | ReferenceError: File is not defined
0|news-backend  |     at Object.<anonymous> (/var/www/newslyfe/node_modules/undici/lib/web/webidl/index.js:512:48)
0|news-backend  |     at Module._compile (node:internal/modules/cjs/loader:1364:14)
0|news-backend  |     at Object.Module._extensions..js (node:internal/modules/cjs/loader:1422:10)        
0|news-backend  |     at Module.load (node:internal/modules/cjs/loader:1203:32)
0|news-backend  |     at Function.Module._load (node:internal/modules/cjs/loader:1019:12)
0|news-backend  |     at Module.require (node:internal/modules/cjs/loader:1231:19)
0|news-backend  |     at Module.Hook._require.Module.require (/usr/lib/node_modules/pm2/node_modules/require-in-the-middle/index.js:101:39)
0|news-backend  |     at require (node:internal/modules/helpers:177:18)
0|news-backend  |     at Object.<anonymous> (/var/www/newslyfe/node_modules/undici/lib/web/fetch/util.js:12:20)
0|news-backend  |     at Module._compile (node:internal/modules/cjs/loader:1364:14)
PM2             | App name:news-backend id:0 disconnected
PM2             | App [news-backend:0] exited with code [0] via signal [SIGINT]
PM2             | App [news-backend:0] starting in -cluster mode-
PM2             | App [news-backend:0] online
0|news-backend  | ReferenceError: File is not defined
0|news-backend  |     at Object.<anonymous> (/var/www/newslyfe/node_modules/undici/lib/web/webidl/index.js:512:48)
0|news-backend  |     at Module._compile (node:internal/modules/cjs/loader:1364:14)
0|news-backend  |     at Object.Module._extensions..js (node:internal/modules/cjs/loader:1422:10)        
0|news-backend  |     at Module.load (node:internal/modules/cjs/loader:1203:32)
0|news-backend  |     at Function.Module._load (node:internal/modules/cjs/loader:1019:12)
0|news-backend  |     at Module.require (node:internal/modules/cjs/loader:1231:19)
0|news-backend  |     at Module.Hook._require.Module.require (/usr/lib/node_modules/pm2/node_modules/require-in-the-middle/index.js:101:39)
0|news-backend  |     at require (node:internal/modules/helpers:177:18)
0|news-backend  |     at Object.<anonymous> (/var/www/newslyfe/node_modules/undici/lib/web/fetch/util.js:12:20)
0|news-backend  |     at Module._compile (node:internal/modules/cjs/loader:1364:14)
PM2             | App name:news-backend id:0 disconnected
PM2             | App [news-backend:0] exited with code [0] via signal [SIGINT]
PM2             | App [news-backend:0] starting in -cluster mode-
PM2             | App [news-backend:0] online
0|news-backend  | ReferenceError: File is not defined
0|news-backend  |     at Object.<anonymous> (/var/www/newslyfe/node_modules/undici/lib/web/webidl/index.js:512:48)
0|news-backend  |     at Module._compile (node:internal/modules/cjs/loader:1364:14)
0|news-backend  |     at Object.Module._extensions..js (node:internal/modules/cjs/loader:1422:10)        
0|news-backend  |     at Module.load (node:internal/modules/cjs/loader:1203:32)
0|news-backend  |     at Function.Module._load (node:internal/modules/cjs/loader:1019:12)
0|news-backend  |     at Module.require (node:internal/modules/cjs/loader:1231:19)
0|news-backend  |     at Module.Hook._require.Module.require (/usr/lib/node_modules/pm2/node_modules/require-in-the-middle/index.js:101:39)
0|news-backend  |     at require (node:internal/modules/helpers:177:18)
0|news-backend  |     at Object.<anonymous> (/var/www/newslyfe/node_modules/undici/lib/web/fetch/util.js:12:20)
0|news-backend  |     at Module._compile (node:internal/modules/cjs/loader:1364:14)
PM2             | App name:news-backend id:0 disconnected
PM2             | App [news-backend:0] exited with code [0] via signal [SIGINT]
PM2             | App [news-backend:0] starting in -cluster mode-
PM2             | App [news-backend:0] online
0|news-backend  | ReferenceError: File is not defined
0|news-backend  |     at Object.<anonymous> (/var/www/newslyfe/node_modules/undici/lib/web/webidl/index.js:512:48)
0|news-backend  |     at Module._compile (node:internal/modules/cjs/loader:1364:14)
0|news-backend  |     at Object.Module._extensions..js (node:internal/modules/cjs/loader:1422:10)        
0|news-backend  |     at Module.load (node:internal/modules/cjs/loader:1203:32)
0|news-backend  |     at Function.Module._load (node:internal/modules/cjs/loader:1019:12)
0|news-backend  |     at Module.require (node:internal/modules/cjs/loader:1231:19)
0|news-backend  |     at Module.Hook._require.Module.require (/usr/lib/node_modules/pm2/node_modules/require-in-the-middle/index.js:101:39)
0|news-backend  |     at require (node:internal/modules/helpers:177:18)
0|news-backend  |     at Object.<anonymous> (/var/www/newslyfe/node_modules/undici/lib/web/fetch/util.js:12:20)
0|news-backend  |     at Module._compile (node:internal/modules/cjs/loader:1364:14)
PM2             | App name:news-backend id:0 disconnected
PM2             | App [news-backend:0] exited with code [0] via signal [SIGINT]
PM2             | App [news-backend:0] starting in -cluster mode-
PM2             | App [news-backend:0] online
0|news-backend  | ReferenceError: File is not defined
0|news-backend  |     at Object.<anonymous> (/var/www/newslyfe/node_modules/undici/lib/web/webidl/index.js:512:48)
0|news-backend  |     at Module._compile (node:internal/modules/cjs/loader:1364:14)
0|news-backend  |     at Object.Module._extensions..js (node:internal/modules/cjs/loader:1422:10)        
0|news-backend  |     at Module.load (node:internal/modules/cjs/loader:1203:32)
0|news-backend  |     at Function.Module._load (node:internal/modules/cjs/loader:1019:12)
0|news-backend  |     at Module.require (node:internal/modules/cjs/loader:1231:19)
0|news-backend  |     at Module.Hook._require.Module.require (/usr/lib/node_modules/pm2/node_modules/require-in-the-middle/index.js:101:39)
0|news-backend  |     at require (node:internal/modules/helpers:177:18)
0|news-backend  |     at Object.<anonymous> (/var/www/newslyfe/node_modules/undici/lib/web/fetch/util.js:12:20)
0|news-backend  |     at Module._compile (node:internal/modules/cjs/loader:1364:14)
PM2             | App name:news-backend id:0 disconnected
PM2             | App [news-backend:0] exited with code [0] via signal [SIGINT]
PM2             | App [news-backend:0] starting in -cluster mode-
PM2             | App [news-backend:0] online
0|news-backend  | ReferenceError: File is not defined
0|news-backend  |     at Object.<anonymous> (/var/www/newslyfe/node_modules/undici/lib/web/webidl/index.js:512:48)
0|news-backend  |     at Module._compile (node:internal/modules/cjs/loader:1364:14)
0|news-backend  |     at Object.Module._extensions..js (node:internal/modules/cjs/loader:1422:10)        
0|news-backend  |     at Module.load (node:internal/modules/cjs/loader:1203:32)
0|news-backend  |     at Function.Module._load (node:internal/modules/cjs/loader:1019:12)
0|news-backend  |     at Module.require (node:internal/modules/cjs/loader:1231:19)
0|news-backend  |     at Module.Hook._require.Module.require (/usr/lib/node_modules/pm2/node_modules/require-in-the-middle/index.js:101:39)
0|news-backend  |     at require (node:internal/modules/helpers:177:18)
0|news-backend  |     at Object.<anonymous> (/var/www/newslyfe/node_modules/undici/lib/web/fetch/util.js:12:20)
0|news-backend  |     at Module._compile (node:internal/modules/cjs/loader:1364:14)
PM2             | App name:news-backend id:0 disconnected
PM2             | App [news-backend:0] exited with code [0] via signal [SIGINT]
PM2             | App [news-backend:0] starting in -cluster mode-
PM2             | App [news-backend:0] online
0|news-backend  | ReferenceError: File is not defined
0|news-backend  |     at Object.<anonymous> (/var/www/newslyfe/node_modules/undici/lib/web/webidl/index.js:512:48)
0|news-backend  |     at Module._compile (node:internal/modules/cjs/loader:1364:14)
0|news-backend  |     at Object.Module._extensions..js (node:internal/modules/cjs/loader:1422:10)        
0|news-backend  |     at Module.load (node:internal/modules/cjs/loader:1203:32)
0|news-backend  |     at Function.Module._load (node:internal/modules/cjs/loader:1019:12)
0|news-backend  |     at Module.require (node:internal/modules/cjs/loader:1231:19)
0|news-backend  |     at Module.Hook._require.Module.require (/usr/lib/node_modules/pm2/node_modules/require-in-the-middle/index.js:101:39)
0|news-backend  |     at require (node:internal/modules/helpers:177:18)
0|news-backend  |     at Object.<anonymous> (/var/www/newslyfe/node_modules/undici/lib/web/fetch/util.js:12:20)
0|news-backend  |     at Module._compile (node:internal/modules/cjs/loader:1364:14)
PM2             | App name:news-backend id:0 disconnected
PM2             | App [news-backend:0] exited with code [0] via signal [SIGINT]
PM2             | App [news-backend:0] starting in -cluster mode-
PM2             | App [news-backend:0] online
0|news-backend  | ReferenceError: File is not defined
0|news-backend  |     at Object.<anonymous> (/var/www/newslyfe/node_modules/undici/lib/web/webidl/index.js:512:48)
0|news-backend  |     at Module._compile (node:internal/modules/cjs/loader:1364:14)
0|news-backend  |     at Object.Module._extensions..js (node:internal/modules/cjs/loader:1422:10)        
0|news-backend  |     at Module.load (node:internal/modules/cjs/loader:1203:32)
0|news-backend  |     at Function.Module._load (node:internal/modules/cjs/loader:1019:12)
0|news-backend  |     at Module.require (node:internal/modules/cjs/loader:1231:19)
0|news-backend  |     at Module.Hook._require.Module.require (/usr/lib/node_modules/pm2/node_modules/require-in-the-middle/index.js:101:39)
0|news-backend  |     at require (node:internal/modules/helpers:177:18)
0|news-backend  |     at Object.<anonymous> (/var/www/newslyfe/node_modules/undici/lib/web/fetch/util.js:12:20)
0|news-backend  |     at Module._compile (node:internal/modules/cjs/loader:1364:14)
PM2             | App name:news-backend id:0 disconnected
PM2             | App [news-backend:0] exited with code [0] via signal [SIGINT]
PM2             | App [news-backend:0] starting in -cluster mode-
PM2             | App [news-backend:0] online
0|news-backend  | ReferenceError: File is not defined
0|news-backend  |     at Object.<anonymous> (/var/www/newslyfe/node_modules/undici/lib/web/webidl/index.js:512:48)
0|news-backend  |     at Module._compile (node:internal/modules/cjs/loader:1364:14)
0|news-backend  |     at Object.Module._extensions..js (node:internal/modules/cjs/loader:1422:10)        
0|news-backend  |     at Module.load (node:internal/modules/cjs/loader:1203:32)
0|news-backend  |     at Function.Module._load (node:internal/modules/cjs/loader:1019:12)
0|news-backend  |     at Module.require (node:internal/modules/cjs/loader:1231:19)
0|news-backend  |     at Module.Hook._require.Module.require (/usr/lib/node_modules/pm2/node_modules/require-in-the-middle/index.js:101:39)
0|news-backend  |     at require (node:internal/modules/helpers:177:18)
0|news-backend  |     at Object.<anonymous> (/var/www/newslyfe/node_modules/undici/lib/web/fetch/util.js:12:20)
0|news-backend  |     at Module._compile (node:internal/modules/cjs/loader:1364:14)
PM2             | App name:news-backend id:0 disconnected
PM2             | App [news-backend:0] exited with code [0] via signal [SIGINT]
PM2             | App [news-backend:0] starting in -cluster mode-
PM2             | App [news-backend:0] online
0|news-backend  | ReferenceError: File is not defined
0|news-backend  |     at Object.<anonymous> (/var/www/newslyfe/node_modules/undici/lib/web/webidl/index.js:512:48)
0|news-backend  |     at Module._compile (node:internal/modules/cjs/loader:1364:14)
0|news-backend  |     at Object.Module._extensions..js (node:internal/modules/cjs/loader:1422:10)        
0|news-backend  |     at Module.load (node:internal/modules/cjs/loader:1203:32)
0|news-backend  |     at Function.Module._load (node:internal/modules/cjs/loader:1019:12)
0|news-backend  |     at Module.require (node:internal/modules/cjs/loader:1231:19)
0|news-backend  |     at Module.Hook._require.Module.require (/usr/lib/node_modules/pm2/node_modules/requ0|news-backend  |     at require (node:internal/modules/helpers:177:18)
0|news-backend  |     at Object.<anonymous> (/var/www/newslyfe/node_modules/undici/lib/web/fetch/util.js:12:20)                                                   i/lib/web/fetch/util.js:
0|news-backend  |     at Module._compile (node:internal/modules/cjs/loader:1364:14)                                                                               4)
PM2             | App name:news-backend id:0 disconnected
PM2             | App [news-backend:0] exited with code [0] via signal [SIGINT]  
PM2             | Script /var/www/newslyfe/dist/backend/server/index.js had too many unstable restarts (1any unstable restarts (16). Stopped. "errored"
========================================================
A hibaelemzés alapján két fő problémát látok:

## 1. **ESM/CommonJS Konfliktus**
A hibaüzenet azt mondja: *"This file is being treated as an ES module because it has a '.js' file extension and '/var/www/newslyfe/package.json' contains "type": "module".*

**Mi történik:**
- A package.json-ban van `"type": "module"` beállítás
- Ez azt jelenti, hogy a Node.js minden `.js` fájlt ES module-ként próbál futtatni
- De a backend build (TypeScript → JavaScript) CommonJS formátumot generál (`require`, `module.exports`)
- A Node.js nem tudja értelmezni a CommonJS kódot ES module környezetben

## 2. **Undici Könyvtár Hiba**
*"ReferenceError: File is not defined"* - ez általában Node.js verzió inkompatibilitást jelez.

## **Megoldási Javaslatok:**

### **A. Gyors megoldás (ajánlott):**
1. **Távolítsd el a `"type": "module"` sort a package.json-ból:**
   ```bash
   # Szerveren:
   sed -i '/"type":/d' package.json
   ```

2. **Rebuild és restart:**
   ```bash
   pm2 stop news-backend
   rm -rf dist/
   npm run build:backend
   pm2 start ecosystem.config.cjs
   ```

### **B. Alternatív megoldás:**
Ha a frontend ESM-et igényel, akkor a backend buildet `.cjs` kiterjesztéssel kell generálni:

1. **Módosítsd a tsconfig.server.json-t:**
   ```json
   {
     "compilerOptions": {
       "module": "CommonJS",
       "outDir": "./dist"
     }
   }
   ```

2. **Vagy nevezd át a build output fájlt `.cjs`-re és frissítsd az ecosystem.config.cjs-t.**

### **C. Node.js verzió ellenőrzés:**
```bash
node -v
```
Ha 16-os vagy régebbi, frissítsd Node.js 18+ verzióra.

**Mit javaslok most:**
Kezdd az **A. megoldással** (type module eltávolítása), mert ez a legegyszerűbb és leggyorsabb!
=========================================================
