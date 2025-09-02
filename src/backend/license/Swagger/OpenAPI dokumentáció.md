# Swagger / OpenAPI dokumentáció összefoglaló

Ez a dokumentáció bemutatja, hogyan működik a NewsBase License modul ipari szintű Swagger/OpenAPI integrációja.

## Mit csinál?
- Automatikusan generált, interaktív API dokumentációt biztosít a backend összes license végpontjához.
- Minden admin (kulcsgenerálás, visszavonás, feketelista) és recovery (helyreállítás) végpont részletesen dokumentált.
- A dokumentáció tartalmazza a kérések és válaszok sémáit, példákat, hibakódokat, leírásokat.
- A fejlesztők, tesztelők, integrátorok egy böngészőből kipróbálhatják az API-t, láthatják a pontos adatstruktúrákat.

## Hogyan működik?
- A Swagger kommentek a controller fájlokban (adminController.ts, recoveryController.ts) találhatók.
- A szerver (app.ts) a swagger-jsdoc és swagger-ui-express csomagokkal generálja és szolgálja ki a dokumentációt a /api-docs végponton.
- A dokumentáció automatikusan frissül, ha a kódban változik egy végpont vagy séma.
- A sémák (pl. GenerateLicenseRequest, ErrorResponse) újrahasznosíthatók, minden végpontnál egységesek.

## Hogyan kell üzembe helyezni?
1. Telepítsd a szükséges csomagokat:
   ```bash
   npm install swagger-jsdoc swagger-ui-express
   npm install --save-dev @types/swagger-jsdoc @types/swagger-ui-express
   ```
2. Győződj meg róla, hogy az app.ts-ben benne van:
   ```typescript
   import swaggerJsDoc from 'swagger-jsdoc';
   import swaggerUi from 'swagger-ui-express';
   // ...
   const swaggerOptions = { ... };
   const swaggerDocs = swaggerJsDoc(swaggerOptions);
   app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocs));
   ```
3. A swaggerOptions apis mezője tartalmazza az összes controller és route fájlt:
   ```typescript
   apis: ['./src/backend/**/*.ts'],
   ```
4. Indítsd újra a szervert:
   ```bash
   npm start
   # vagy
   npm run dev:backend
   ```
5. Nyisd meg böngészőben:
   ```
   http://localhost:3002/api-docs
   ```

## Előnyök
- Ipari szintű fejlesztői élmény, automatizált tesztelés, könnyű integráció.
- Minden végpont, adatstruktúra, hibakód, példa egy helyen, interaktívan elérhető.
- A dokumentáció mindig naprakész, a kódból generált.

===========================================================

# Audit Log (Naplózás) – Tervezési összefoglaló

## Mi az Audit Log?
Az Audit Log egy ipari szintű naplózási rendszer, amely minden kritikus licensz műveletet (generálás, visszavonás, helyreállítás) rögzít, visszakövethetően, megdönthetetlenül.

## Miért szükséges?
- **Biztonság:** Gyanús vagy tömeges műveletek azonnal észlelhetők.
- **Felelősségre vonhatóság:** Minden admin vagy folyamat tevékenysége visszakereshető.
- **Hibakeresés:** Ügyfélpanaszok, hibák gyorsan kivizsgálhatók.
- **Riportolás:** Statisztikák, trendek, audit jelentések készíthetők.

## Fő lépések és komponensek
1. **Adatbázis séma:**
   - Új `audit_logs` tábla (pl. PostgreSQL):
     - id (auto)
     - timestamp (TIMESTAMPTZ)
     - action (TEXT, pl. 'generate', 'revoke', 'recover')
     - key_hash (TEXT, opcionális)
     - admin_id vagy admin_token (TEXT, opcionális)
     - reason (TEXT, opcionális)
     - client_ip (TEXT)
     - result (TEXT, pl. 'success', 'error')
     - error_message (TEXT, opcionális)
     - metadata (JSONB, opcionális)
2. **Service réteg:**
   - AuditLogService: függvények naplóbejegyzés mentésére (pl. logGenerate, logRevoke, logRecover).
   - Minden controller művelet végén hívni kell a megfelelő logolást.
3. **Integráció a controller-ekbe:**
   - AdminController és RecoveryController minden kritikus műveletében audit log mentés.
   - Hiba esetén is logolni (error_message mező).
4. **API végpontok (opcionális):**
   - GET /api/admin/audit-logs – csak adminoknak, paginációval, szűréssel.
5. **Biztonság:**
   - Logok csak adminok számára elérhetők.
   - GDPR: érzékeny adatokat (pl. IP, admin azonosító) csak indokolt esetben tárolj.
6. **Tesztelés:**
   - Minden művelet után ellenőrizd, hogy a log bejegyzés létrejött.
   - Hibás műveletek is generáljanak logot.
7. **Dokumentáció:**
   - Swagger/OpenAPI: audit log végpontok, log sémák dokumentálása.
8. **Üzembe helyezés:**
   - Migráció: audit_logs tábla létrehozása.
   - .env: audit log kapcsoló (pl. AUDIT_LOG_ENABLED=true).
   - CI/CD: tesztek, backup, monitoring.
9. **Monitoring és riport:**
   - Opcionális: logok exportja, statisztikák, riasztások (pl. tömeges visszavonás).

## Menete
1. Audit log tábla migráció elkészítése.
2. AuditLogService implementálása.
3. Controller-ekben logolás hozzáadása minden kritikus művelethez.
4. Swagger dokumentáció bővítése.
5. Tesztelés, üzembe helyezés, monitoring.

---
Ez a tervezés biztosítja, hogy a licensz modul minden kritikus művelete ipari szinten, biztonságosan, visszakövethetően és bővíthetően legyen naplózva.
