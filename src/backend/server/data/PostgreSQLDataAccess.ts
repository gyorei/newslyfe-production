/**
 * Adatforrások Repository
 *src\backend\server\data\PostgreSQLDataAccess.ts
 * FIGYELEM: Ez a fájl csak adatelérési műveleteket tartalmaz.
 * A server mappában található a PostgreSQLManager közelében,
 * mivel szorosan támaszkodik annak db objektumára.
 */

 import { db } from '../PostgreSQLManager.js';
 import { logger } from '../logger.js';
 
 /**
  * Adatforrás szolgáltatás
  * - Hírek és források kezelése
  * - Üzleti logika implementációja
  */
 export class SourcesService {
   /**
    * Kontinens forrásainak lekérdezése
    */
   public async getContinentSources(continent: string) {
     try {
       // Kötőjelek cseréje SZÓKÖZRE és kisbetűsítés a táblanévhez
       const tableName = continent.replace(/-/g, ' ').toLowerCase(); // Pl. "north america"
 
       logger.debug(`Kontinens lekérés: ${continent} (Tábla: "${tableName}")`);
 
       // Módosítva: fontossági szint szűrés eltávolítva, hogy minden forrást lekérjen
       const query = `
         SELECT * FROM continents."${tableName}" 
         ORDER BY fontossag
       `;
 
       const result = await db.query(query);
       logger.debug(`Kontinens lekérdezés (${continent}) eredménye: ${result.rows.length} találat`);
 
       return result.rows;
     } catch (error) {
       logger.error(`Kontinens lekérdezési hiba (${continent}):`, error);
       throw error;
     }
   }
 
   /**
    * Kontinens forrásainak lekérdezése fontossági szint szerint
    * @param continent A kontinens azonosítója (pl. europe, asia)
    * @param importanceLevel Fontossági szint (források fontossag <= importanceLevel)
    * @param limit Maximális források száma
    * @param offset Eltolás (lapozáshoz)
    */
   public async getContinentSourcesByImportanceLevel(
     continent: string,
     importanceLevel: number = 10,
     limit: number = 1000,
     offset: number = 0,
   ) {
     try {
       // Kötőjelek cseréje SZÓKÖZRE és kisbetűsítés a táblanévhez
       const tableName = continent.replace(/-/g, ' ').toLowerCase(); // Pl. "north america"
 
       logger.debug(
         `Kontinens források fontossági szint szerint (${continent}, level <= ${importanceLevel})`,
       );
 
       const query = `
         SELECT * FROM continents."${tableName}"
         WHERE fontossag <= $1
         ORDER BY fontossag, cim
         LIMIT $2 OFFSET $3
       `;
 
       const result = await db.query(query, [importanceLevel, limit, offset]);
       logger.debug(
         `Kontinens források fontossági szint szerint (${continent}, level <= ${importanceLevel}): ${result.rows.length} találat`,
       );
 
       return result.rows;
     } catch (error) {
       logger.error(
         `Kontinens források fontossági szint szerinti lekérdezési hiba (${continent}):`,
         error,
       );
       throw error;
     }
   }
 
   /**
    * Ország forrásainak lekérdezése
    */
   public async getCountrySources(country: string) {
     try {
       const query = `
         SELECT * FROM continents.europe WHERE orszag = $1
         UNION ALL SELECT * FROM continents."asia" WHERE orszag = $1
         UNION ALL SELECT * FROM continents."africa" WHERE orszag = $1
         UNION ALL SELECT * FROM continents."north america" WHERE orszag = $1
         UNION ALL SELECT * FROM continents."south america" WHERE orszag = $1
         UNION ALL SELECT * FROM continents."oceania" WHERE orszag = $1
         ORDER BY fontossag
       `;
 
       const result = await db.query(query, [country]);
       logger.debug(`Ország források lekérdezése (${country}): ${result.rows.length} találat`);
 
       return result.rows;
     } catch (error) {
       logger.error(`Ország források lekérdezési hiba (${country}):`, error);
       throw error;
     }
   }
 
   /**
    * Forrás lekérdezése azonosító alapján
    */
   public async getSourceById(id: string) {
     try {
       const query = `
         SELECT * FROM continents.europe WHERE eredeti_id = $1
         UNION ALL SELECT * FROM continents."asia" WHERE eredeti_id = $1
         UNION ALL SELECT * FROM continents."africa" WHERE eredeti_id = $1
         UNION ALL SELECT * FROM continents."north america" WHERE eredeti_id = $1
         UNION ALL SELECT * FROM continents."south america" WHERE eredeti_id = $1
         UNION ALL SELECT * FROM continents."oceania" WHERE eredeti_id = $1
       `;
 
       const result = await db.query(query, [id]);
       return result.rows[0] || null;
     } catch (error) {
       logger.error(`Forrás lekérdezési hiba (ID: ${id}):`, error);
       throw error;
     }
   }
 
   /**
    * Összes ország lekérdezése
    */
   public async getAllCountries() {
     try {
       const query = `
         SELECT DISTINCT orszag FROM (
           SELECT orszag FROM continents.europe
           UNION SELECT orszag FROM continents."asia"
           UNION SELECT orszag FROM continents."africa"
           UNION SELECT orszag FROM continents."north america"
           UNION SELECT orszag FROM continents."south america"
           UNION SELECT orszag FROM continents."oceania"
         ) AS all_countries
         ORDER BY orszag
       `;
 
       const result = await db.query(query);
       return result.rows.map((row) => row.orszag);
     } catch (error) {
       logger.error('Országok lekérdezési hiba:', error);
       throw error;
     }
   }
 
   /**
    * Egy kontinens országainak lekérdezése
    * @param continent A kontinens azonosítója (pl. europe, asia)
    */
   public async getCountriesByContinent(continent: string) {
     try {
       // Kötőjelek cseréje SZÓKÖZRE és kisbetűsítés a táblanévhez
       const tableName = continent.replace(/-/g, ' ').toLowerCase(); // Pl. "north america"
 
       logger.debug(`Kontinens országainak lekérése: ${continent} (Tábla: "${tableName}")`);
 
       const query = `
         SELECT DISTINCT orszag FROM continents."${tableName}"
         ORDER BY orszag
       `;
 
       const result = await db.query(query);
       logger.debug(`Kontinens országai (${continent}): ${result.rows.length} ország`);
 
       return result.rows.map((row) => row.orszag);
     } catch (error) {
       logger.error(`Kontinens országainak lekérdezése közben hiba (${continent}):`, error);
       throw error;
     }
   }
 
   /**
    * Országok lekérdezése kezdőbetű szerint
    */
   public async getCountriesByLetter(letter: string) {
     try {
       // Validáció: csak egy karakter lehet
       if (!letter || letter.length !== 1) {
         throw new Error('Érvénytelen betű paraméter');
       }
 
       logger.debug(`Országok lekérése '${letter}' betűvel kezdődően`);
 
       // Pattern az adott betűvel kezdődő országokra
       const pattern = `${letter}%`;
 
       const query = `
         SELECT DISTINCT orszag FROM (
           SELECT orszag FROM continents.europe
           UNION SELECT orszag FROM continents."asia"
           UNION SELECT orszag FROM continents."africa"
           UNION SELECT orszag FROM continents."north america"
           UNION SELECT orszag FROM continents."south america"
           UNION SELECT orszag FROM continents."oceania"
         ) AS all_countries
         WHERE orszag ILIKE $1
         ORDER BY orszag
       `;
 
       const result = await db.query(query, [pattern]);
       logger.debug(`'${letter}' betűvel kezdődő országok: ${result.rows.length} találat`);
 
       return result.rows.map((row) => row.orszag);
     } catch (error) {
       logger.error(`Hiba az országok lekérésekor '${letter}' betűvel:`, error);
       throw error;
     }
   }
 
   /**
    * Ország forrásainak lekérdezése fontossági szint alapján
    * Az alapértelmezéseket megnöveltük, hogy több hírt mutasson
    */
   public async getCountrySourcesByImportanceLevel(
     country: string,
     importanceLevel: number = 10, // Magas érték, hogy minden fontossági szintet visszaadjon
     limit: number = 1000, // Nagyobb limit a több forráshoz
     offset: number = 0,
   ) {
     try {
       const query = `
         SELECT * FROM (
           SELECT * FROM continents.europe WHERE orszag = $1 AND fontossag <= $2
           UNION ALL SELECT * FROM continents."asia" WHERE orszag = $1 AND fontossag <= $2
           UNION ALL SELECT * FROM continents."north america" WHERE orszag = $1 AND fontossag <= $2
           UNION ALL SELECT * FROM continents."south america" WHERE orszag = $1 AND fontossag <= $2
           UNION ALL SELECT * FROM continents."africa" WHERE orszag = $1 AND fontossag <= $2
           UNION ALL SELECT * FROM continents."oceania" WHERE orszag = $1 AND fontossag <= $2
         ) AS country_sources
         ORDER BY fontossag, cim
         LIMIT $3 OFFSET $4
       `;
 
       const result = await db.query(query, [country, importanceLevel, limit, offset]);
       logger.debug(
         `Ország források fontossági szint szerint (${country}, level <= ${importanceLevel}): ${result.rows.length} találat`,
       );
 
       return result.rows;
     } catch (error) {
       logger.error(
         `Ország források fontossági szint szerinti lekérdezési hiba (${country}):`,
         error,
       );
       throw error;
     }
   }
 
   /**
    * Ellenőrzi, hogy van-e következő fontossági szintű forrás az országhoz
    * @param country Az ország neve
    * @param currentImportanceLevel A jelenlegi fontossági szint
    * @returns true, ha van következő szintű forrás
    */
   public async hasNextImportanceLevel(
     country: string,
     currentImportanceLevel: number,
   ): Promise<boolean> {
     // Mivel minden fontossági szintet visszaadunk, ez false-t adhat vissza
     // hogy ne próbáljon több oldalt betölteni, minden forrás látható
     const nextLevel = currentImportanceLevel + 1;
     const query = `
       SELECT COUNT(*) as count FROM (
         SELECT 1 FROM continents.europe WHERE orszag = $1 AND fontossag = $2
         UNION ALL SELECT 1 FROM continents."asia" WHERE orszag = $1 AND fontossag = $2
         UNION ALL SELECT 1 FROM continents."north america" WHERE orszag = $1 AND fontossag = $2
         UNION ALL SELECT 1 FROM continents."south america" WHERE orszag = $1 AND fontossag = $2
         UNION ALL SELECT 1 FROM continents."africa" WHERE orszag = $1 AND fontossag = $2
         UNION ALL SELECT 1 FROM continents."oceania" WHERE orszag = $1 AND fontossag = $2
       ) AS has_next_level
     `;
     const result = await db.query(query, [country, nextLevel]);
     return parseInt(result.rows[0].count) > 0;
   }
 
   /**
    * Ellenőrzi, hogy van-e következő fontossági szintű forrás a kontinenshez
    * @param continent A kontinens neve
    * @param currentImportanceLevel A jelenlegi fontossági szint
    * @returns true, ha van következő szintű forrás
    */
   public async hasNextImportanceLevelForContinent(
     continent: string,
     currentImportanceLevel: number,
   ): Promise<boolean> {
     try {
       // Kötőjelek cseréje SZÓKÖZRE és kisbetűsítés a táblanévhez
       const tableName = continent.replace(/-/g, ' ').toLowerCase();
 
       const nextLevel = currentImportanceLevel + 1;
       const query = `
         SELECT COUNT(*) as count FROM continents."${tableName}" 
         WHERE fontossag = $1
       `;
 
       const result = await db.query(query, [nextLevel]);
       return parseInt(result.rows[0].count) > 0;
     } catch (error) {
       logger.error(`Hiba a következő fontossági szint ellenőrzésekor (${continent}):`, error);
       return false;
     }
   }
 }
 
 export const sourcesService = new SourcesService();
 export default sourcesService;
 