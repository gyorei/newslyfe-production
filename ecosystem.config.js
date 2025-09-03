module.exports = {
  apps: [{
    name: 'news-backend',
    script: './dist/backend/server/index.js',
    interpreter: 'node',
    instances: 1,
    cwd: process.cwd(),
    env: {
      NODE_ENV: 'production',
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