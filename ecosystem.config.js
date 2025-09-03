export default {
  apps: [{
    name: 'news-backend',
    script: 'dist/backend/server/index.js',
    interpreter: 'node',
    instances: 1,
    cwd: process.cwd(),
    env: {
      NODE_ENV: 'production',
      // Minden más env-t a dotenv tölt be az .env.production-ból
    },
    max_memory_restart: '300M'
  }]
};