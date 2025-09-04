ok itt az új adat nézzük meg : root@newslyfe-prod:~# cd /var/www/newslyfe
root@newslyfe-prod:/var/www/newslyfe#   git pull
ild:backend
  pm2 restart news-backend
  pm2 logs --lines 5Already up to date.
root@newslyfe-prod:/var/www/newslyfe#   rm -rf dist/
root@newslyfe-prod:/var/www/newslyfe#   npm run build:backend

> react-tsx-news@1.0.0 build:backend
> cross-env NODE_ENV=production tsc -p tsconfig.server.json && npm run copy:backend-assets


> react-tsx-news@1.0.0 copy:backend-assets
> npx fs-extra copy src/backend dist/backend --filter='*.jsonc' --filter='*.json'

npm error could not determine executable to run
npm error A complete log of this run can be found in: /root/.npm/_logs/2025-09-04T01_29_24_930Z-debug-0.log
root@newslyfe-prod:/var/www/newslyfe#   pm2 restart news-backend
Use --update-env to update environment variables
[PM2] Applying action restartProcessId on app [news-backend](ids: [ 0 ])
[PM2] [news-backend](0) ✓
┌────┬────────────────────┬──────────┬──────┬───────────┬──────────┬──────────┐
│ id │ name               │ mode     │ ↺    │ status    │ cpu      │ memory   │
├────┼────────────────────┼──────────┼──────┼───────────┼──────────┼──────────┤
│ 0  │ news-backend       │ cluster  │ 3    │ online    │ 0%       │ 39.9mb   │
└────┴────────────────────┴──────────┴──────┴───────────┴──────────┴──────────┘
root@newslyfe-prod:/var/www/newslyfe#   pm2 logs --lines 5
[TAILING] Tailing last 5 lines for [all] processes (change the value with --lines option)
/root/.pm2/pm2.log last 5 lines:
PM2        | 2025-09-04T01:29:26: PM2 log: App name:news-backend id:0 disconnected
PM2        | 2025-09-04T01:29:26: PM2 log: App [news-backend:0] exited with code [0] via signal [SIGINT]
PM2        | 2025-09-04T01:29:26: PM2 log: pid=63846 msg=process killed
PM2        | 2025-09-04T01:29:26: PM2 log: App [news-backend:0] starting in -cluster mode-
PM2        | 2025-09-04T01:29:26: PM2 log: App [news-backend:0] online

/var/www/newslyfe/logs/out-0.log last 5 lines:
/var/www/newslyfe/logs/err-0.log last 5 lines:
0|news-bac | Error: ENOENT: no such file or directory, open '/var/www/newslyfe/dist/backend/api/routes/videoData/videoData.jsonc'
0|news-bac |     at Object.readFileSync (node:fs:449:20)
0|news-bac |     at file:///var/www/newslyfe/src/backend/api/routes/videoData/videoData.ts:30:25
0|news-bac |     at ModuleJob.run (node:internal/modules/esm/module_job:263:25)
0|news-bac |     at ModuleLoader.import (node:internal/modules/esm/loader:540:24)

