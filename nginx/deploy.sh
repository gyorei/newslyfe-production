#!/bin/bash

# News alkalmazás deployment script
# Hetzner Cloud VPS-re való telepítéshez

set -e  # Hiba esetén leáll

echo "🚀 News alkalmazás telepítése Hetzner VPS-re..."

# Színek a konzolhoz
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Függvények
log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# 0. PostgreSQL jelszó bekérése
read -sp "Add meg a PostgreSQL jelszót (nem fog látszani gépelés közben): " PG_PASSWORD
echo

# 1. Rendszer frissítése
log_info "Rendszer frissítése..."
sudo apt update && sudo apt upgrade -y

# 2. Szükséges csomagok telepítése
log_info "Szükséges csomagok telepítése..."
sudo apt install -y curl wget git build-essential

# 3. Node.js telepítése
log_info "Node.js telepítése..."
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# 4. PostgreSQL telepítése
log_info "PostgreSQL telepítése..."
sudo apt install -y postgresql postgresql-contrib

# 5. Nginx telepítése
log_info "Nginx telepítése..."
sudo apt install -y nginx

# 6. PM2 telepítése
log_info "PM2 telepítése..."
sudo npm install -g pm2

# 7. Alkalmazás könyvtár létrehozása
log_info "Alkalmazás könyvtár létrehozása..."
sudo mkdir -p /var/www/news
sudo chown $USER:$USER /var/www/news

# 8. Alkalmazás másolása
log_info "Alkalmazás másolása..."
cp -r . /var/www/news/
cd /var/www/news

# 9. .env.production kezelése
if [ ! -f /var/www/news/.env.production ]; then
    log_warn ".env.production nem található! Létrehozok egy alapértelmezett példányt."
    cat <<EOF > /var/www/news/.env.production
NODE_ENV=production
PORT=3002
DB_USER=newsuser
DB_PASSWORD=$PG_PASSWORD
DB_HOST=localhost
DB_PORT=5432
DB_NAME=newsbase
SESSION_SECRET=$(openssl rand -hex 32)
ALLOWED_ORIGINS=https://sajatdomain.hu
EOF
    log_info ".env.production létrehozva. Szükség esetén szerkeszd!"
else
    log_info ".env.production már létezik, nem írom felül."
fi

# 10. Függőségek telepítése
log_info "Függőségek telepítése..."
npm install

# 11. Frontend build
log_info "Frontend build..."
npm run build

# 12. Backend build
log_info "Backend build..."
npm run build:backend

# 13. Nginx konfiguráció másolása
log_info "Nginx konfiguráció beállítása..."
sudo cp nginx/nginx.conf /etc/nginx/sites-available/news
sudo cp nginx/ssl.conf /etc/nginx/ssl.conf

# 14. Nginx site engedélyezése
sudo ln -sf /etc/nginx/sites-available/news /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default

# 15. Nginx konfiguráció tesztelése
log_info "Nginx konfiguráció tesztelése..."
sudo nginx -t

# 16. Nginx újraindítása
log_info "Nginx újraindítása..."
sudo systemctl restart nginx
sudo systemctl enable nginx

# 17. PostgreSQL beállítása
log_info "PostgreSQL beállítása..."
sudo -u postgres psql -c "CREATE DATABASE newsbase;" || log_warn "Adatbázis már létezik."
sudo -u postgres psql -c "DO $$ BEGIN IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'newsuser') THEN CREATE ROLE newsuser LOGIN PASSWORD '$PG_PASSWORD'; END IF; END $$;"
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE newsbase TO newsuser;"

# 18. Alkalmazás indítása PM2-vel
log_info "Alkalmazás indítása PM2-vel..."
npm run build:all
npm run start:prod
pm2 save
sudo pm2 startup systemd -u $(whoami) --hp $HOME

# 19. Tűzfal beállítása
log_info "Tűzfal beállítása..."
sudo ufw allow 22/tcp
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw --force enable

# PostgreSQL port (5432) kívülről tiltása
log_info "PostgreSQL port (5432) kívülről tiltása..."
sudo ufw deny 5432/tcp

# DH paraméter generálás (SSL-hez)
if [ ! -f /etc/ssl/certs/dhparam.pem ]; then
  log_info "DH paraméter generálása (SSL-hez)..."
  sudo openssl dhparam -out /etc/ssl/certs/dhparam.pem 2048
else
  log_info "DH paraméter már létezik, nem generálom újra."
fi

log_info "✅ Telepítés kész!"
log_info "🌐 Alkalmazás elérhető: https://sajatdomain.hu"
log_info "📊 PM2 státusz: pm2 status"
log_info "📝 Nginx logok: sudo tail -f /var/log/nginx/access.log" 