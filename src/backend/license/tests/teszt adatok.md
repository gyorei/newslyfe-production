PS C:\news> npx sequelize-cli db:migrate --env test

Sequelize CLI [Node: 20.18.0, CLI: 6.6.3, ORM: 6.37.7]

Loaded configuration file "config\config.json".
Using environment "test".
== 20250809-alter-licenses-recovery-code: migrating =======
== 20250809-alter-licenses-recovery-code: migrated (0.094s)

PS C:\news> npm test -- --verbose

> react-tsx-news@1.0.0 test
> cross-env NODE_ENV=test jest --detectOpenHandles --verbose

  console.log
    [dotenv@17.2.1] injecting env (7) from .env.test -- tip: 🔐 prevent committing .env to code: https://dotenvx.com/precommit

      at _log (node_modules/dotenv/lib/main.js:139:11)

  console.log
    [dotenv@17.2.1] injecting env (0) from .env.test -- tip: 🛠️  run anywhere wit 
h `dotenvx run -- yourcommand`

      at _log (node_modules/dotenv/lib/main.js:139:11)

  console.log
    ====================================================

      at Object.<anonymous> (src/backend/config/database.ts:28:9)

  console.log
    [DATABASE CONFIG] Környezet (NODE_ENV): test

      at Object.<anonymous> (src/backend/config/database.ts:29:9)

  console.log
    [DATABASE CONFIG] Használt .env fájl: .env.test

      at Object.<anonymous> (src/backend/config/database.ts:30:9)

  console.log
    [DATABASE CONFIG] DB_NAME: newsbase_test

      at Object.<anonymous> (src/backend/config/database.ts:31:9)

  console.log
    [DATABASE CONFIG] DB_USER: postgres

      at Object.<anonymous> (src/backend/config/database.ts:32:9)

  console.log
    [DATABASE CONFIG] DB_HOST: localhost

      at Object.<anonymous> (src/backend/config/database.ts:33:9)

  console.log
    ====================================================

      at Object.<anonymous> (src/backend/config/database.ts:34:9)

  console.log
    🔄 App inicializálás...

      at Object.<anonymous> (src/backend/license/tests/license.integration.test.ts:29:15)

  console.log
    🔄 Sequelize authentikáció...

      at Object.<anonymous> (src/backend/license/tests/license.integration.test.ts:33:15)

  console.log
    🔄 PostgreSQL kapcsolat ellenőrzés...

      at Object.<anonymous> (src/backend/license/tests/license.integration.test.ts:37:15)

  console.log
    🔄 Adatbázis szinkronizálás (táblák létrehozása)...

      at Object.<anonymous> (src/backend/license/tests/license.integration.test.ts:43:15)

  console.log
    🔄 Táblák tartalmának törlése...

      at Object.<anonymous> (src/backend/license/tests/license.integration.test.ts:47:15)

  console.log
    ✅ Teszt környezet sikeresen inicializálva!

      at Object.<anonymous> (src/backend/license/tests/license.integration.test.ts:54:15)

  console.log
    📝 Teszt: License kulcs generálás...

      at Object.<anonymous> (src/backend/license/tests/license.integration.test.ts:80:13)

  console.log
    ✅ License kulcs sikeresen generálva

      at Object.<anonymous> (src/backend/license/tests/license.integration.test.ts:97:13)

  console.log
    📝 Teszt: License visszavonás...

      at Object.<anonymous> (src/backend/license/tests/license.integration.test.ts:102:13)

  console.log
    ✅ License sikeresen visszavonva

      at Object.<anonymous> (src/backend/license/tests/license.integration.test.ts:117:13)

  console.log
    📝 Teszt: Visszavont kulcsok listája...

      at Object.<anonymous> (src/backend/license/tests/license.integration.test.ts:122:13)

  console.log
    ✅ Visszavont kulcs megtalálható a listában

      at Object.<anonymous> (src/backend/license/tests/license.integration.test.ts:133:13)

  console.log
    📝 Teszt: Visszavont license recovery (sikertelen)...

      at Object.<anonymous> (src/backend/license/tests/license.integration.test.ts:138:13)

  console.log
    ✅ Visszavont license recovery helyesen elutasítva

      at Object.<anonymous> (src/backend/license/tests/license.integration.test.ts:148:13)

  console.log
    📝 Teszt: Aktív license recovery (sikeres)...

      at Object.<anonymous> (src/backend/license/tests/license.integration.test.ts:153:13)

  console.log
    ✅ Aktív license sikeresen visszaállítva

      at Object.<anonymous> (src/backend/license/tests/license.integration.test.ts:173:13)

  console.log
    🔄 Adatbázis kapcsolatok lezárása...

      at Object.<anonymous> (src/backend/license/tests/license.integration.test.ts:65:15)

  console.info
    [INFO] PostgreSQL connection pool has been closed.

      at Logger.info (src/backend/server/logger.ts:54:13)

  console.log
    ✅ Cleanup befejezve

      at Object.<anonymous> (src/backend/license/tests/license.integration.test.ts:72:15)

 PASS  src/backend/license/tests/license.integration.test.ts (10.616 s)
  License API - Full Workflow Integration Test
    √ should successfully generate a new license key (1474 ms)
    √ should successfully revoke the generated license (132 ms)
    √ should include the revoked key hash in the revoked list (77 ms)
    √ should fail to recover a revoked license (276 ms)
    √ should successfully recover a non-revoked license (201 ms)

  console.log
    [dotenv@17.2.1] injecting env (7) from .env.test -- tip: ⚙️  enable debug logg
ing with { debug: true }

      at _log (node_modules/dotenv/lib/main.js:139:11)

 PASS  src/backend/license/tests/licenseApi.test.ts
  License API smoke test
    √ should run a basic test (3 ms)

Test Suites: 2 passed, 2 total
Tests:       6 passed, 6 total
Snapshots:   0 total
Time:        12.783 s
Ran all test suites.
PS C:\news> 