// src/backend/license/tests/license.integration.test.ts
import request from 'supertest';
import { createTestApp } from '../../server/test-app';
import { sequelize } from '../../license/utils/db';
import { License } from '../models/licenseModel';
import crypto from 'crypto';
import { db } from '../../server/PostgreSQLManager';
import express from 'express';

// === KONSTANSOK a duplikált stringek elkerülésére ===
const ADMIN_API_BASE = '/api/admin/license';
const RECOVERY_API_BASE = '/api/recover/license';
const ADMIN_TOKEN = process.env.TEST_ADMIN_TOKEN || 'your-secret-test-token';
const X_ADMIN_TOKEN_HEADER = 'X-Admin-Token';

// Az app változót csak deklaráljuk, inicializálás a beforeAll-ban
let app: express.Application;
let generatedLicenseKey = '';
let generatedRecoveryCode = '';
let licenseKeyHash = '';

describe('License API - Full Workflow Integration Test', () => {
  // Növeljük meg a Jest időkorlátját erre a teszt-suite-ra.
  jest.setTimeout(30000); // 30,000 ms = 30 seconds

  // Minden teszt előtt töröljük a táblát, hogy tiszta lappal induljunk
  beforeAll(async () => {
    try {
      console.log('🔄 App inicializálás...');
      // 1. LÉPÉS: Hozzuk létre az alkalmazás példányt.
      app = createTestApp();
      
      console.log('🔄 Sequelize authentikáció...');
      // 2. LÉPÉS: Várjuk meg, amíg MINDEN adatbázis-kapcsolat garantáltan él.
      await sequelize.authenticate();
      
      console.log('🔄 PostgreSQL kapcsolat ellenőrzés...');
      // Csak akkor hívjuk meg, ha létezik a metódus
      if (db && typeof db.checkConnection === 'function') {
        await db.checkConnection();
      }
      
      console.log('🔄 Adatbázis szinkronizálás (táblák létrehozása)...');
      // Automatikus tábla létrehozás, ha nem létezik
      await sequelize.sync({ force: false });
      
      console.log('🔄 Táblák tartalmának törlése...');
      // 3. LÉPÉS: Most már biztosan létezik a tábla, törölhetjük a tartalmát
      await License.destroy({ 
        where: {},
        truncate: true // Opcionális: gyorsabb törlés
      });
      
      console.log('✅ Teszt környezet sikeresen inicializálva!');
    } catch (error) {
      console.error("❌ Végzetes hiba a teszt-környezet inicializálása során:", error);
      if (error instanceof Error) {
        console.error("Stack trace:", error.stack);
      } else {
        console.error("Stack trace:", error);
      }
      throw error;
    }
  });

  // Minden teszt után zárjuk le MINDEN adatbázis kapcsolatot
  afterAll(async () => {
    try {
      console.log('🔄 Adatbázis kapcsolatok lezárása...');
      await sequelize.close();
      
      // Csak akkor hívjuk meg, ha létezik a metódus
      if (db && typeof db.closePool === 'function') {
        await db.closePool();
      }
      console.log('✅ Cleanup befejezve');
    } catch (error) {
      console.error('⚠️ Hiba a cleanup során:', error);
    }
  });

  // === 1. LÉPÉS: Kulcsgenerálás ===
  it('should successfully generate a new license key', async () => {
    console.log('📝 Teszt: License kulcs generálás...');
    
    const response = await request(app)
      .post(`${ADMIN_API_BASE}/generate`)
      .set(X_ADMIN_TOKEN_HEADER, ADMIN_TOKEN) // Authentikáció
      .send({ validityMonths: 12 });

    expect(response.status).toBe(201);
    expect(response.body.success).toBe(true);
    expect(response.body.license).toHaveProperty('licenseKey');
    expect(response.body.license).toHaveProperty('recoveryCode');

    // Mentsük el a kapott adatokat a további tesztekhez
    generatedLicenseKey = response.body.license.licenseKey;
    generatedRecoveryCode = response.body.license.recoveryCode;
    licenseKeyHash = crypto.createHash('sha256').update(generatedLicenseKey).digest('hex');
    
    console.log('✅ License kulcs sikeresen generálva');
  });

  // === 2. LÉPÉS: Visszavonás ===
  it('should successfully revoke the generated license', async () => {
    console.log('📝 Teszt: License visszavonás...');
    expect(licenseKeyHash).not.toBe(''); // Biztosítjuk, hogy az előző teszt lefutott

    const response = await request(app)
      .post(`${ADMIN_API_BASE}/revoke`)
      .set(X_ADMIN_TOKEN_HEADER, ADMIN_TOKEN)
      .send({
        keyHash: licenseKeyHash,
        reason: 'Integration test revocation'
      });

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.license.isRevoked).toBe(true);
    
    console.log('✅ License sikeresen visszavonva');
  });

  // === 3. LÉPÉS: Feketelista Lekérdezése ===
  it('should include the revoked key hash in the revoked list', async () => {
    console.log('📝 Teszt: Visszavont kulcsok listája...');
    
    const response = await request(app)
      .get(`${ADMIN_API_BASE}/revoked-list`)
      .set(X_ADMIN_TOKEN_HEADER, ADMIN_TOKEN);

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.revokedKeyHashes).toBeInstanceOf(Array);
    expect(response.body.revokedKeyHashes).toContain(licenseKeyHash);
    
    console.log('✅ Visszavont kulcs megtalálható a listában');
  });
  
  // === 4. LÉPÉS: Sikertelen Recovery Teszt (mivel a kulcs már vissza van vonva) ===
  it('should fail to recover a revoked license', async () => {
    console.log('📝 Teszt: Visszavont license recovery (sikertelen)...');
    
    const response = await request(app)
      .post(RECOVERY_API_BASE) // Ez a nyilvános végpont
      .send({ recoveryCode: generatedRecoveryCode });

    expect(response.status).toBe(403); // 403 Forbidden
    expect(response.body.success).toBe(false);
    expect(response.body.error).toBe('This license has been revoked.');
    
    console.log('✅ Visszavont license recovery helyesen elutasítva');
  });
  
  // === 5. LÉPÉS: Sikeres Recovery Teszt (egy új, nem visszavont kulccsal) ===
  it('should successfully recover a non-revoked license', async () => {
    console.log('📝 Teszt: Aktív license recovery (sikeres)...');
    
    // Generálunk egy teljesen új kulcsot ehhez a teszthez
    const genRes = await request(app)
      .post(`${ADMIN_API_BASE}/generate`)
      .set(X_ADMIN_TOKEN_HEADER, ADMIN_TOKEN)
      .send({});
    
    const newRecoveryCode = genRes.body.license.recoveryCode;
    const newLicenseKey = genRes.body.license.licenseKey;

    // Most megpróbáljuk visszaállítani
    const recoverRes = await request(app)
      .post(RECOVERY_API_BASE)
      .send({ recoveryCode: newRecoveryCode });

    expect(recoverRes.status).toBe(200);
    expect(recoverRes.body.success).toBe(true);
    expect(recoverRes.body.licenseKey).toBe(newLicenseKey);
    
    console.log('✅ Aktív license sikeresen visszaállítva');
  });
});