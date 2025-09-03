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
