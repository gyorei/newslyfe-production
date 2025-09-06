#!/bin/bash

# Backup script a NewsLyfe alkalmazáshoz
# Hetzner Cloud VPS-en való használatra

set -e

# Konfiguráció
BACKUP_DIR="/var/backups/newslyfe"
DATE=$(date +%Y%m%d_%H%M%S)
DB_NAME="newsbase"
DB_USER="newslyfe_user"
APP_DIR="/var/www/newslyfe"

# Színek
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Backup könyvtár létrehozása
mkdir -p $BACKUP_DIR

log_info "📦 NewsLyfe Backup készítése: $DATE"

# 1. PostgreSQL adatbázis backup
log_info "PostgreSQL adatbázis backup (tömörítve)..."
if sudo -u postgres pg_dump $DB_NAME | gzip > $BACKUP_DIR/db_backup_$DATE.sql.gz; then
    log_info "Adatbázis backup sikeres"
else
    log_error "Adatbázis backup sikertelen"
fi

# 2. Alkalmazás fájlok backup
log_info "Alkalmazás fájlok backup..."
if [ -d "$APP_DIR" ]; then
    tar -czf $BACKUP_DIR/app_backup_$DATE.tar.gz -C /var/www newslyfe/
    log_info "Alkalmazás backup sikeres"
else
    log_error "Alkalmazás könyvtár nem található: $APP_DIR"
fi

# 3. Nginx konfiguráció backup
log_info "Nginx konfiguráció backup..."
tar -czf $BACKUP_DIR/nginx_backup_$DATE.tar.gz \
    /etc/nginx/sites-available/newslyfe \
    /etc/nginx/ssl.conf \
    /etc/ssl/certs/dhparam.pem 2>/dev/null || log_warn "Néhány nginx fájl hiányzik"

# 4. PM2 konfiguráció backup
log_info "PM2 konfiguráció backup..."
if pm2 save > /dev/null 2>&1; then
    cp ~/.pm2/dump.pm2 $BACKUP_DIR/pm2_backup_$DATE.json 2>/dev/null || log_warn "PM2 dump másolás sikertelen"
else
    log_warn "PM2 mentés sikertelen"
fi

# 5. .env.production backup
log_info ".env.production backup..."
if [ -f "$APP_DIR/.env.production" ]; then
    cp $APP_DIR/.env.production $BACKUP_DIR/env_backup_$DATE.production
    chmod 600 $BACKUP_DIR/env_backup_$DATE.production
    log_info ".env.production backup kész (chmod 600)"
else
    log_warn ".env.production nem található"
fi

# 6. Git commit info backup
log_info "Git információk backup..."
if [ -d "$APP_DIR/.git" ]; then
    cd $APP_DIR
    git log --oneline -10 > $BACKUP_DIR/git_log_$DATE.txt
    git status > $BACKUP_DIR/git_status_$DATE.txt
    git remote -v > $BACKUP_DIR/git_remotes_$DATE.txt
    log_info "Git info backup kész"
else
    log_warn "Git repository nem található"
fi

# 7. Rendszer információk
log_info "Rendszer információk backup..."
{
    echo "=== SYSTEM INFO ==="
    uname -a
    echo ""
    echo "=== DISK USAGE ==="
    df -h
    echo ""
    echo "=== MEMORY ==="
    free -h
    echo ""
    echo "=== PM2 STATUS ==="
    pm2 status
    echo ""
    echo "=== NGINX STATUS ==="
    systemctl status nginx --no-pager
} > $BACKUP_DIR/system_info_$DATE.txt

# 8. Régi backupok törlése (30 napnál régebbiek)
log_info "Régi backupok törlése (30+ nap)..."
find $BACKUP_DIR -name "*_*.sql.gz" -mtime +30 -delete 2>/dev/null || true
find $BACKUP_DIR -name "*_*.tar.gz" -mtime +30 -delete 2>/dev/null || true
find $BACKUP_DIR -name "*_*.json" -mtime +30 -delete 2>/dev/null || true
find $BACKUP_DIR -name "*_*.production" -mtime +30 -delete 2>/dev/null || true
find $BACKUP_DIR -name "*_*.txt" -mtime +30 -delete 2>/dev/null || true

# 9. Backup méret info
log_info "✅ Backup kész: $BACKUP_DIR"
log_info "📊 Backup fájlok és méret:"
ls -lah $BACKUP_DIR/*_$DATE.* 2>/dev/null || log_warn "Backup fájlok listázása sikertelen"

# 10. Backup teszt
log_info "🔍 Backup integritás teszt..."
if [ -f "$BACKUP_DIR/db_backup_$DATE.sql.gz" ]; then
    if gunzip -t "$BACKUP_DIR/db_backup_$DATE.sql.gz" 2>/dev/null; then
        log_info "PostgreSQL backup integritás OK"
    else
        log_error "PostgreSQL backup sérült!"
    fi
fi

if [ -f "$BACKUP_DIR/app_backup_$DATE.tar.gz" ]; then
    if tar -tzf "$BACKUP_DIR/app_backup_$DATE.tar.gz" >/dev/null 2>&1; then
        log_info "Alkalmazás backup integritás OK"
    else
        log_error "Alkalmazás backup sérült!"
    fi
fi

log_info "🎯 Backup folyamat befejezve!"