GitHub Copilot

Rendben — összeszedtem pontos, élesindításhoz szükséges tételeket Hetznerből és a szerveren elvégzendő beállításokat. Rövid, prioritási checklist, amit végig lehet pipálni.

Mi kell Hetzner-től (infrastruktúra)
- VPS (ajánlás: CPX11; ha várható nagyobb aggregáció → CPX21) — CPU/RAM/NVMe méretezés.
- (Opció) Hetzner Managed PostgreSQL, ha nem akartok DB-admin feladatot.
- Floating IP (ha később gyors átállást akartok).
- Privát háló / network (ha több instans lesz).
- Backup / snapshot lehetőség és havi snapshot politika.
- Firewall szolgáltatás (Hetzner Cloud Firewall).
- Monitoring/alerts (Hetzner vagy külső).

Szerverhez szükséges hozzáférés
- Publikus SSH kulcs(ok) (regisztrálni a Hetzner konzolban).
- Root/egy sudo user létrehozása (ops user, key-only SSH).
- Domain már van — DNS A/AAAA rekordok Hetzner IP-re (api, www, cdn) vagy Cloudflare felé.

Architektúra — hány gép?
- Egyszerű, költséghatékony: 1 VPS (Node backend + Postgres helyi) — CPX11 lehet.
- Stabilabb/robosztus: 1 VPS backend (Node + Nginx + feeds), 1 Managed PostgreSQL vagy külön DB VPS.
- Skálázható: backend VPS-ek + külső Managed DB + CDN (Cloudflare).

Szoftver / szolgáltatások a szerveren
- OS: Ubuntu 22.04 (ajánlott)
- Node.js (LTS), npm/yarn
- PM2 (process manager) + pm2-logrotate
- Nginx (reverse proxy, statikus /feeds/ kiszolgálás)
- PostgreSQL (ha nem managed)
- Certbot (Let's Encrypt) vagy Cloudflare SSL
- git, build-tools (make, gcc) ha natív modulok vannak
- UFW/iptables + Hetzner firewall
- fail2ban, logrotate
- backup tool (pg_dump cron / rsync snapshot)

Fájl- és mappa struktúra (ajánlott)
- /var/www/news/public/feeds/  ← statikus JSON-ok (CDN felé)
- /var/www/news/dist/ ← backend build
- /home/news/.env.production  ← backend környezeti változók (engedélyezetten ketteségeket nem Git-ben)
- /opt/scripts/generate-feeds.js  (vagy repo/scripts/generate-feeds.js)

Kötelező környezeti változók (példa)
- DATABASE_URL vagy DB_HOST/DB_USER/DB_PASS/DB_NAME/DB_PORT
- PORT (backend)
- FEED_OUT_DIR=/var/www/news/public/feeds
- FEED_COUNTRIES=us,fr,de
- VITE_API_URL (frontend build-time)
- VITE_CDN_URL (frontend build-time)

Nginx / Reverse proxy + CDN
- Nginx beállítás: domain -> backend (proxy_pass localhost:3002), /feeds -> statikus mappa.
- HTTP -> HTTPS redirect, HSTS
- SSL: certbot vagy Cloudflare origin cert + Cloudflare full SSL
- CDN: Cloudflare vagy Fastly; cache a /feeds/*.json hosszú TTL-re, purge hash vagy ETag alapján.

Feed-generálás / automatizálás
- scripts/generate-feeds.js (atomikus írás, .etag mellékfájl)
- PM2 app entry vagy crontab (példa: minden 10 perc)
- PM2 config (ecosystem.config.cjs) bővítése feed-generatorral

Postgres tippek
- Indexek: CREATE INDEX ON articles (country, published_at DESC)
- Rendszeres VACUUM / autovacuum monitorozás
- Rendszeres DB backup (pg_dump vagy hetente snapshot)
- Ha nagy: használj Managed PostgreSQL

Biztonság és jogosultságok
- SSH csak kulccsal, root bejelentkezés letiltva.
- Hetzner firewall: engedélyezd 22 (key-only), 80, 443, szükség esetén 5432 privát hálón.
- Webroot olvasási jog a Nginx felhasználónak, generátor írónak külön user.
- Env fájlok ne kerüljenek Git-be.

Üzemeltetés / monitoring
- PM2 + pm2-logrotate
- Hetzner monitoring, Sentry/Prometheus+Grafana opcionális
- Backup + retention policy (DB napi, fájl heti)
- Rendszeres snapshot (előtte állj át CPU/mem növelésre)

Lépésről lépésre (gyors deploy flow)
1. Hetzner: create VPS (CPX11), add SSH key, assign floating IP (opcionális).
2. SSH bejelentkezés root-ként, create sudo user.
3. System update, install Node, Git, Nginx, Certbot, PostgreSQL (ha kell).
4. Clone repo, build frontend (vite) with VITE_API_URL / VITE_CDN_URL, build backend.
5. Configure .env.production, copy to server (kezelni titkosan).
6. PM2 indítás backend és feed-generator (ecosystem.config.cjs).
7. Nginx konfiguráció + SSL (certbot) + reload.
8. Cloudflare beállítás: CDN és cache szabályok a /feeds/ számára.
9. Teszt: feed URL-ek közvetlenül, CDN-ről, frontend fetch.
10. Enable backups, monitoring, logrotate.

Gyors checklist (pipálható)
- [ ] VPS létrehozva (CPX11 vagy CPX21)
- [ ] SSH kulcsok feltöltve
- [ ] Sudo user létrehozva
- [ ] Node/NPM/PM2 telepítve
- [ ] Nginx + SSL telepítve
- [ ] PostgreSQL telepítve vagy Managed DB beállítva
- [ ] Repo klónozva, build kész
- [ ] /var/www/news/public/feeds létrehozva + jogosultságok
- [ ] scripts/generate-feeds.js telepítve + PM2 cron
- [ ] ecosystem.config.cjs frissítve (feed-generator)
- [ ] DNS rekordok (A/AAAA/CNAME) rendben
- [ ] CDN (Cloudflare) és cache szabályok beállítva
- [ ] Backup + monitoring aktív

Mondd meg, melyik részt akarod most részletesen: szerver-telepítés parancsok, Nginx conf minta, PM2 bejegyzés készítése, vagy a generate-feeds.js teljes fájl — és létrehozom a konkrét tartalmat.
=========================================================

Rövid válasz: attól függ mire használod — frontendhez a build, backendhez a dist kell.

- Frontend (statikus): C:\news3\build legyen az, ha ott van az index.html és a static assetek. Ezt töltsd fel a webroot/CDN-be (pl. /var/www/news/public).
- Backend (Node/TS fordítás eredménye): C:\news3\dist ha ott vannak a futtatható JS fájlok (pl. dist/backend/server/index.js). Ezt indítja a pm2 / ecosystem.config.cjs.

Gyors ellenőrzés (PowerShell):
- Listázás:
  four-space code block
````powershell
Get-ChildItem C:\news3\build
Get-ChildItem C:\news3\dist
````
- Nézd meg package.json build/start scriptjeit:
  four-space code block
````powershell
Get-Content C:\news3\package.json | Select-String '"build"','"start"'
````

Feltöltés példák (Windows -> VPS):
- frontend:
  four-space code block
````bash
scp -r C:\news3\build/* ops@VPS_IP:/var/www/news/public/
````
- backend:
  four-space code block
````bash
scp -r C:\news3\dist/* ops@VPS_IP:/var/www/news/dist/
````
Ellenőrizd .env.production, jogosultságok, majd PM2 indítás:
  four-space code block
````bash
pm2 start ecosystem.config.cjs --env production
pm2 save
````

Szeretnéd, hogy megnézzem a package.json-t és megmondjam konkrétan melyik build mappa az aktív?
==================================================
