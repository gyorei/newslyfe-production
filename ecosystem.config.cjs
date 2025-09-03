module.exports = {
  apps: [{
    name: 'news-backend',
    script: 'dist/backend/server/index.js',
    interpreter: 'node',
    // EZ AZ ÚJ SOR, AMI MEGOLDJA A PROBLÉMÁT:
    node_args: '--input-type=commonjs', 
    instances: 1,
    cwd: process.cwd(),
    env: {
      NODE_ENV: 'production',
      // Minden más env-t a dotenv tölt be az .env.production-ból
    },
    max_memory_restart: '300M'
  }]
};