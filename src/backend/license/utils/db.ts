// src\backend\license\utils\db.ts
import { Sequelize } from 'sequelize';
import dbConfig from '../../config/database'; // <-- A KÖZPONTI KONFIG IMPORTÁLÁSA

// A Sequelize-t a központi konfigurációs objektummal hozzuk létre
export const sequelize = new Sequelize({
  ...dbConfig,
  dialect: 'postgres', // A dialektust expliciten meg kell adni
});

export async function testDbConnection() {
  try {
    await sequelize.authenticate();
    console.log('Database connection has been established successfully.');
  } catch (error) {
    console.error('Unable to connect to the database:', error);
    process.exit(1);
  }
}