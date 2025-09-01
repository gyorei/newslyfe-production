/* eslint-disable @typescript-eslint/no-require-imports */
// config/config.js

// A ts-node/register importálása biztosítja, hogy a CLI megértse a
// TypeScript importokat a betöltött fájlokban.
require('ts-node/register');

// A központi TS konfigurációs fájl betöltése. A .default kell,
// mert az ES Modul export default-ját importáljuk.
const dbConfig = require('../src/backend/config/database').default;

// A Sequelize-CLI számára exportáljuk a megfelelő formátumban.
// Ez a fájl CommonJS modul marad (module.exports).
module.exports = {
  development: dbConfig,
  test: dbConfig,
  production: dbConfig,
};