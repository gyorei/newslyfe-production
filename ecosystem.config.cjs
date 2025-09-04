require('dotenv').config({ path: './.env.production' });

module.exports = {
  apps: [{
    name: 'news-backend',
    script: './dist/backend/server/index.js',
    interpreter: 'node',
    instances: 1,
    cwd: process.cwd(),
    env: {
      NODE_ENV: 'production',
      DB_HOST: process.env.DB_HOST,
      DB_PORT: process.env.DB_PORT,
      DB_NAME: process.env.DB_NAME,
      DB_USER: process.env.DB_USER,
      DB_PASSWORD: process.env.DB_PASSWORD,
      ALLOWED_ORIGINS: process.env.ALLOWED_ORIGINS,
      JWT_SECRET: process.env.JWT_SECRET,
      LICENSE_DISABLED: process.env.LICENSE_DISABLED,
      VITE_LICENSE_PUBLIC_KEY: process.env.VITE_LICENSE_PUBLIC_KEY,
    },
    max_memory_restart: '300M',
    // Stabilítási beállítások:
    restart_delay: 5000,        // 5 másodperc várakozás újraindítás előtt
    max_restarts: 10,           // Max 10 újraindítás
    min_uptime: '10s',          // Legalább 10 másodpercig fusson
    autorestart: true,
    watch: false,
    error_file: './logs/err.log',
    out_file: './logs/out.log',
    log_file: './logs/combined.log',
    time: true
  }]
};