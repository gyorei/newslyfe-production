News3 Backend Konfiguráció
Ez a dokumentáció a src/backend/server/config/environment.ts fájl tartalmát és funkcionalitását ismerteti. A fájl a Node.js alapú backend alkalmazás környezetfüggő konfigurációját biztosítja, különös figyelmet fordítva a biztonságra, robusztusságra és fenntarthatóságra.
Tartalom
A konfigurációs fájl a következő főbb elemeket tartalmazza:
1. Környezeti változók validálása

Használt eszköz: envalid a típusbiztos környezeti változók kezelésére.
Főbb változók:
NODE_ENV: Környezet (development, test, production).
PORT: Szerver port (alapértelmezett: 3002).
DB_*: Adatbázis konfiguráció (pl. DB_USER, DB_HOST, DB_NAME, DB_PASSWORD, DB_PORT).
DB_POOL_MIN/DB_POOL_MAX: Adatbázis kapcsolat pool mérete (1-100 között).
DB_SSL_CA/DB_SSL_CERT/DB_SSL_KEY: SSL tanúsítványok PostgreSQL-hez.
ALLOWED_ORIGINS: Engedélyezett CORS origin-ek (pl. http://localhost:3000, vagy * fejlesztői környezetben).
API_VERSION: Szemantikus verziószám (pl. 1.0.0).
LOG_PATH: Naplófájlok elérési útja.
ENCRYPTION_KEY/SESSION_SECRET: Titkosítási és session kulcsok (minimum 32 karakter éles környezetben).
RATE_LIMIT_*: Rate limiting beállítások (pl. RATE_LIMIT_WINDOW_MS, RATE_LIMIT_MAX_REQUESTS).


Validációk:
Egyedi validátorok (multipleUrls, sslCertValidator, poolSizeValidator, semverValidator) biztosítják a helyes formátumot.
Éles környezetben szigorú ellenőrzések (pl. tiltott alapértelmezett kulcsok, érvényes URL-ek).



2. Adatbázis konfiguráció

Cél: Biztonságos PostgreSQL kapcsolatkezelés.
Főbb jellemzők:
SSL támogatás éles környezetben, részletes figyelmeztetésekkel hiányzó tanúsítványok esetén.
Kapcsolat pool méret konfigurálása (DB_POOL_MIN, DB_POOL_MAX).
Időzítések (DB_CONNECTION_TIMEOUT, DB_IDLE_TIMEOUT) és keepAlive opció a stabilitásért.
Tesztkörnyezetben memóriabeli adatbázis (testdb) használata.



3. CORS konfiguráció

Cél: Biztonságos cross-origin kérések kezelése.
Főbb jellemzők:
Fejlesztői környezetben rugalmas: támogatja a * értéket és helyi origin-eket (localhost, 127.0.0.1).
Éles környezetben szigorú: kötelező origin header, csak az ALLOWED_ORIGINS-ban megadott URL-ek engedélyezettek.
Támogatott fejlécek: Content-Type, Authorization, Accept, X-Requested-With.
Kitett fejlécek: X-RateLimit-Limit, X-RateLimit-Remaining, X-RateLimit-Reset.



4. Naplózási konfiguráció

Cél: Biztonságos és strukturált naplózás.
Főbb jellemzők:
Érzékeny adatok redakciója (pl. jelszavak, tokenek, e-mail címek, hitelkártya adatok).
Éles környezetben JSON formátumú naplózás, fejlesztői környezetben olvashatóbb formátum.
Automatikus naplókönyvtár-létrehozás és írási jogosultság ellenőrzése éles környezetben.
Fájl rotáció: maximum 10 MB/fájl, 7 nap megőrzés, napi rotáció, tömörítés.
Fájl jogosultságok: 0o600 éles környezetben.



5. Rate limiting

Cél: Védelem a túlterheléses támadások ellen.
Főbb jellemzők:
Testreszabható időablak (RATE_LIMIT_WINDOW_MS) és kéréslimit (RATE_LIMIT_MAX_REQUESTS).
IP-alapú whitelist (RATE_LIMIT_WHITELIST) érvényes IP-címekkel.
Egyedi kulcsgenerálás IP és user agent alapján.
trustProxy engedélyezése éles környezetben proxyzott kérésekhez.
Válaszüzenet tartalmazza a retryAfter időt.



6. Session kezelés

Cél: Biztonságos session kezelés.
Főbb jellemzők:
Session ID megújítása minden kérésnél (rolling: true).
Éles környezetben __Secure-sessionId név és szigorú cookie beállítások (secure, httpOnly, sameSite: strict).
Támogatja a COOKIE_DOMAIN környezeti változót éles környezetben.
Session időtartam: 24 óra.



7. Biztonsági fejlécek

Cél: Böngészőalapú támadások elleni védelem.
Főbb jellemzők:
Content Security Policy (CSP): Szigorú szabályok (defaultSrc, scriptSrc, styleSrc, stb.), frameAncestors: 'none' a clickjacking ellen.
HSTS: HTTPS kényszerítése 1 évig, aldomainekkel és preload támogatással.
Permissions Policy: Kamera, mikrofon és geolokáció tiltása.
Egyéb fejlécek: X-XSS-Protection, X-Content-Type-Options, X-Download-Options, Referrer-Policy.



8. Titkosítási kulcsok

Cél: Biztonságos titkosítás és authentikáció.
Főbb jellemzők:
Külön ENCRYPTION_KEY és SESSION_SECRET kulcsok, minimum 32 karakter éles környezetben.
Alapértelmezett kulcsok tiltása éles környezetben.



Telepítési útmutató

Függőségek telepítése:
npm i --save-dev @types/semver @types/express
npm i express envalid dotenv semver


Környezeti fájlok beállítása:

Hozz létre egy .env.development fájlt a következő tartalommal:NODE_ENV=development
PORT=3002
DB_USER=postgres
DB_HOST=localhost
DB_NAME=newsbase
DB_PASSWORD=your_secure_password
DB_PORT=5432
ALLOWED_ORIGINS=*
API_VERSION=1.0.0
LOG_PATH=./logs
ENCRYPTION_KEY=dev-only-insecure-key-change-in-production-1234567890123456
SESSION_SECRET=dev-session-secret-12345678901234567890123456789012
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=1000
RATE_LIMIT_WHITELIST=127.0.0.1


Éles környezetben használd az .env.production fájlt, például:NODE_ENV=production
PORT=3002
DB_USER=your_prod_user
DB_HOST=your_prod_host
DB_NAME=your_prod_db
DB_PASSWORD=your_secure_password
DB_PORT=5432
ALLOWED_ORIGINS=https://your-app.example.com
API_VERSION=1.0.0
LOG_PATH=/var/log/news3
ENCRYPTION_KEY=your_secure_encryption_key_32_chars_minimum
SESSION_SECRET=your_secure_session_secret_32_chars_minimum
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
RATE_LIMIT_WHITELIST=203.0.113.1
COOKIE_DOMAIN=.example.com




Naplózási jogosultságok:

Éles környezetben állítsd be a naplófájlok jogosultságait:chmod 600 /var/log/news3/*




Indítás:

Fejlesztői környezetben:npm run dev


Éles környezetben:npm start





Javaslatok további fejlesztésekre
Bár a konfiguráció jelenleg magas színvonalú és éles használatra kész, a következő elemek hozzáadása később hasznos lehet:

Környezeti változók titkosítása:

Miért?: Az .env fájlok érzékeny adatokat tartalmaznak (pl. DB_PASSWORD, ENCRYPTION_KEY). Egy titkosítási megoldás, például dotenv-vault, növelheti a biztonságot.
Hogyan?: Integráld a dotenv-vault-ot, és használd titkosított .env.vault fájlokat.


Több adatbázis támogatása:

Miért?: Ha a jövőben más adatbázisokat (pl. MySQL, SQLite) is támogatni szeretnél, a DB_CONFIG absztraktabbá tehető.
Hogyan?: Implementálj egy adatbázis adaptert, amely dinamikusan kezeli a különböző adatbázis típusokat.


Monitorozás és metrikák:

Miért?: A teljesítmény és a hibák nyomon követése (pl. rate limiting statisztikák, adatbázis kapcsolatok állapota) hasznos lehet nagy forgalmú rendszereknél.
Hogyan?: Integrálj Prometheus-t vagy más monitorozó eszközt, és adj hozzá metrikagyűjtést a RATE_LIMIT és DB_CONFIG részekhez.


Tesztlefedettség:

Miért?: Unit tesztek a validátorokhoz és konfigurációs logikához növelnék a megbízhatóságot.
Hogyan?: Használj Jest vagy Mocha keretrendszert a validátorok és a konfiguráció logikájának tesztelésére.


Automatikus tanúsítványkezelés:

Miért?: Az SSL tanúsítványok manuális kezelése helyett automatikus megújítás (pl. Let's Encrypt) egyszerűsítheti az üzemeltetést.
Hogyan?: Integrálj egy tanúsítványkezelő eszközt, például certbot-ot, és automatizáld a tanúsítványok betöltését.


Környezetfüggő naplózási szintek:

Miért?: Finomhangolható naplózási szintek (pl. warn, error) különböző környezetekben javíthatják a hibakeresést.
Hogyan?: Adj hozzá egy LOG_LEVEL környezeti változót, és dinamikusan állítsd be a LOG_CONFIG.level értékét.



Összegzés
Ez a konfiguráció egy biztonságos, robusztus és fenntartható alapot nyújt a News3 backend alkalmazáshoz. A szigorú validációk, átfogó biztonsági intézkedések és rugalmas környezetkezelés biztosítják, hogy a rendszer alkalmas legyen mind fejlesztői, mind éles környezetben való használatra. A javasolt további fejlesztések opcionálisak, és csak speciális használati esetekben szükségesek.
Ha kérdéseid vannak, vagy további funkciókat szeretnél hozzáadni, vedd fel a kapcsolatot a fejlesztői csapattal!