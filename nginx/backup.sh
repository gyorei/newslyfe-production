#!/bin/bash

# Backup script a News alkalmazáshoz
# Hetzner Cloud VPS-en való használatra

set -e

# Konfiguráció
BACKUP_DIR="/var/backups/news"
DATE=$(date +%Y%m%d_%H%M%S)
DB_NAME="newsbase"
DB_USER="newsuser"

# Színek
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

# Backup könyvtár létrehozása
mkdir -p $BACKUP_DIR

log_info "📦 Backup készítése: $DATE"

# 1. PostgreSQL adatbázis backup
log_info "Adatbázis backup (tömörítve)..."
pg_dump -U $DB_USER -h localhost $DB_NAME | gzip > $BACKUP_DIR/db_backup_$DATE.sql.gz || log_warn "Adatbázis mentése sikertelen"

# 2. Alkalmazás fájlok backup
log_info "Alkalmazás fájlok backup..."
tar -czf $BACKUP_DIR/app_backup_$DATE.tar.gz -C /var/www news/

# 3. Nginx konfiguráció backup
log_info "Nginx konfiguráció backup..."
tar -czf $BACKUP_DIR/nginx_backup_$DATE.tar.gz /etc/nginx/sites-available/news /etc/nginx/ssl.conf

# 4. PM2 konfiguráció backup
log_info "PM2 konfiguráció backup..."
pm2 save
cp ~/.pm2/dump.pm2 $BACKUP_DIR/pm2_backup_$DATE.json

# 4. .env.production backup
log_info ".env.production backup..."
cp /var/www/news/.env.production $BACKUP_DIR/env_backup_$DATE.production || log_warn ".env.production nem található, nem mentettem."
if [ -f $BACKUP_DIR/env_backup_$DATE.production ]; then
  chmod 600 $BACKUP_DIR/env_backup_$DATE.production
  log_info ".env.production backup jogosultság beállítva (chmod 600)."
fi

# 5. Régi backupok törlése (30 napnál régebbiek)
log_info "Régi backupok törlése..."
find $BACKUP_DIR -name "*.sql" -mtime +30 -delete
find $BACKUP_DIR -name "*.sql.gz" -mtime +30 -delete
find $BACKUP_DIR -name "*.tar.gz" -mtime +30 -delete
find $BACKUP_DIR -name "*.json" -mtime +30 -delete
find $BACKUP_DIR -name "*.production" -mtime +30 -delete

log_info "✅ Backup kész: $BACKUP_DIR"
log_info "📊 Backup méret:"
du -sh $BACKUP_DIR/*_$DATE.* 