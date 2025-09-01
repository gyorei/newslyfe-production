// Ez a script lefuttatja az add_verification_columns.sql migrációs SQL fájlt a PostgreSQL adatbázison.
// A script beolvassa az SQL fájlt, csatlakozik a newsbase adatbázishoz, végrehajtja a migrációt, majd lezárja a kapcsolatot.
// Használat: node run-migration.js
// Szükséges: pg csomag, helyes adatbázis elérhetőség, add_verification_columns.sql a projekt gyökerében.

// Adatbázis migráció script a verification oszlopok hozzáadásához
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// ES modules __dirname megoldás
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// PostgreSQL kliens importálása
import pkg from 'pg';
const { Client } = pkg;

async function runMigration() {
  const client = new Client({
    user: 'postgres',
    host: 'localhost',
    database: 'newsbase',
    password: 'Ps123457sP',
    port: 5432,
  });

  try {
    await client.connect();
    console.log('🔌 Adatbázis kapcsolat létesítve');

    // SQL script beolvasása
    const sqlScript = fs.readFileSync(path.join(__dirname, 'add_verification_columns.sql'), 'utf8');
    
    console.log('📝 SQL migráció futtatása...');
    const result = await client.query(sqlScript);
    
    console.log('✅ Migráció sikeresen lefutott!');
    console.log('📊 Eredmény:', result);

  } catch (error) {
    console.error('🚨 Hiba a migráció során:', error.message);
  } finally {
    await client.end();
    console.log('🔌 Adatbázis kapcsolat lezárva');
  }
}

runMigration();