// src\backend\server\PostgreSQLManager.ts
import { Pool, QueryResult, QueryResultRow } from 'pg';
import { DB_CONFIG, isProd } from './config/environment.js';
import { logger } from './logger.js';

/**
 * Adatbázis szolgáltatás
 * - Központi kapcsolatkezelés
 * - Egyszerűsített lekérdezési interfész
 * 
 * Alacsony szintű kapcsolatkezelés
Pool létrehozása és kezelése
Általános lekérdezési interfész (db.query())
Kapcsolatok lezárása, újracsatlakozás, állapotkezelés
Ez a fájl nem tartalmaz konkrét SQL lekérdezéseket
 */
class Database {
  private pool: Pool;
  private isConnected: boolean = false;

  constructor() {
    // Pool létrehozása a konfigurációs adatokkal
    this.pool = new Pool(DB_CONFIG);

    // Eseménykezelők csatolása
    this.pool.on('error', (err) => {
      logger.error('Váratlan hiba az adatbázis poolban', err);

      if (isProd) {
        // Production környezetben megpróbáljuk helyreállítani a kapcsolatot
        this.reconnect();
      }
    });

    // Kezdeti kapcsolat ellenőrzése
    this.checkConnection().catch((err) => {
      logger.error('Nem sikerült kapcsolódni az adatbázishoz indításkor', err);
    });
  }

  /**
   * Kapcsolat ellenőrzése
   */
  public async checkConnection(): Promise<boolean> {
    try {
      const result = await this.pool.query('SELECT NOW()');
      this.isConnected = !!result;
      return this.isConnected;
    } catch (error) {
      this.isConnected = false;
      throw error;
    }
  }

  /**
   * Újrakapcsolódás hiba esetén
   * @private
   */
  private async reconnect(): Promise<void> {
    try {
      logger.info('Adatbázis újrakapcsolódás próbálása...');
      await this.pool.end();
      this.pool = new Pool(DB_CONFIG);
      await this.checkConnection();
      logger.info('Adatbázis újrakapcsolódás sikeres');
    } catch (error) {
      logger.error('Adatbázis újrakapcsolódás sikertelen', error);
    }
  }

  /**
   * Lekérdezés futtatása
   * @param text SQL lekérdezés szövege
   * @param params Lekérdezés paraméterei
   */
  public async query<T extends QueryResultRow = QueryResultRow>(
    text: string,
    params?: unknown[],
  ): Promise<QueryResult<T>> {
    return this.pool.query<T>(text, params);
  }

  /**
   * Kapcsolat lezárása
   */
  public async close(): Promise<void> {
    return this.pool.end();
  }

  /**
   * Biztonságosan lezárja az adatbázis kapcsolat pool-t.
   * Ezt a metódust kell hívni az alkalmazás leállításakor vagy a tesztek végén.
   */
  public async closePool(): Promise<void> {
    if (this.pool) {
      await this.pool.end();
      this.isConnected = false;
      logger.info('PostgreSQL connection pool has been closed.');
    }
  }

  /**
   * Kapcsolat állapotának lekérdezése
   */
  public getStatus(): { isConnected: boolean; poolSize: number } {
    return {
      isConnected: this.isConnected,
      poolSize: this.pool.totalCount,
    };
  }
}

// Adatbázis singleton
export const db = new Database();
export default db;
