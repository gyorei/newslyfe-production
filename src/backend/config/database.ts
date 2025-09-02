// Nincs szükség 'dotenv'-re, mert a betöltés a belépési ponton (index.ts) történik.

// === HIBAKERESŐ BLOKK ===
console.log('====================================================');
console.log(`[DATABASE CONFIG] Környezet (NODE_ENV): ${process.env.NODE_ENV}`);
console.log(`[DATABASE CONFIG] DB_NAME: ${process.env.DB_NAME}`);
console.log(`[DATABASE CONFIG] DB_USER: ${process.env.DB_USER}`);
console.log(`[DATABASE CONFIG] DB_HOST: ${process.env.DB_HOST}`);
console.log('====================================================');
// =========================

const environmentConfig = {
  username: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT),
  dialect: 'postgres',
  logging: process.env.NODE_ENV === 'development' ? console.log : false, // Fejlesztéskor logolhatunk
};

export default environmentConfig;