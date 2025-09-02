// src\backend\license\index.ts
/*
import express from 'express';
import dotenv from 'dotenv';
import { createAdminRoutes } from '../license/routes/adminRoutes';
import { KeyService } from '../license/services/keyService';

// --- ÚJ IMPORT-OK A SWAGGER-HEZ ---
import swaggerJsDoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';

dotenv.config(); // Meghívjuk a legelején!

const app = express();
app.use(express.json());

const privateKey = process.env.LICENSE_PRIVATE_KEY;
if (!privateKey) {
  console.error('FATAL ERROR: LICENSE_PRIVATE_KEY is not defined in your .env file.');
  process.exit(1);
}

const keyService = new KeyService(privateKey);
const adminLicenseRoutes = createAdminRoutes(keyService);

// License admin API
app.use('/api/admin/license', adminLicenseRoutes);

// --- SWAGGER/OPENAPI INTEGRÁCIÓ ---
const PORT = process.env.PORT || 3001;

// Swagger konfigurációs opciók
const swaggerOptions = {
  swaggerDefinition: {
    openapi: '3.0.0',
    info: {
      title: 'NewsBase License API',
      version: '1.0.0',
      description: 'API dokumentáció a NewsBase licenszkezelő rendszerhez. Ez a felület lehetővé teszi a végpontok megismerését és tesztelését.',
    },
    servers: [
      {
        url: `http://localhost:${PORT}`,
        description: 'Fejlesztői szerver',
      },
    ],
  },
  // Fontos: Add meg a fájlokat, ahol a dokumentációs kommentjeid vannak!
  // Ez a beállítás megkeresi a .ts fájlokat a routes és controllers mappákban.
  apis: ['./src/backend/license/routes/*.ts', './src/backend/license/controllers/*.ts'],
};

// Dokumentáció generálása
const swaggerDocs = swaggerJsDoc(swaggerOptions);

// Dokumentáció elérhetővé tétele a /api-docs végponton
// Ennek a sornak a listen() hívás előtt kell lennie!
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocs));

// --- SZERVER INDÍTÁSA ---
app.listen(PORT, () => {
  console.log(`✅ Backend server is running and listening on http://localhost:${PORT}`);
  // Adtunk egy extra logot, hogy lásd a doksi URL-jét is:
  console.log(`📄 API Documentation is available at http://localhost:${PORT}/api-docs`);
});
*/