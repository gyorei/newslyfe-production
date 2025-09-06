#!/bin/bash

# NewsLyfe Rollback Script
# Gyors helyreállítás backup-ból

set -e

# Konfiguráció
BACKUP_DIR="/var/backups/newslyfe"
APP_DIR="/var/www/newslyfe"
DB_NAME="newsbase"
DB_USER="newslyfe_user"

# Színek
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
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

log_step() {
    echo -e "${BLUE}[STEP]${NC} $1"
}

# Backup fájlok listázása
list_backups() {
    log_info "📋 Elérhető backup-ok:"
    ls -lah $BACKUP_DIR/*backup*.tar.gz $BACKUP_DIR/*backup*.sql.gz 2>/dev/null | head -20 || log_error "Nincs backup fájl!"
}

# Rollback függvény
rollback_from_backup() {
    local BACKUP_DATE="$1"
    
    if [ -z "$BACKUP_DATE" ]; then
        log_error "❌ Használat: $0 rollback YYYYMMDD_HHMMSS"
        log_info "Példa: $0 rollback 20250906_031014"
        list_backups
        exit 1
    fi

    log_step "🔄 NewsLyfe Rollback indítása: $BACKUP_DATE"
    
    # Ellenőrizzük, hogy léteznek-e a szükséges backup fájlok
    local DB_BACKUP="$BACKUP_DIR/db_backup_$BACKUP_DATE.sql.gz"
    local APP_BACKUP="$BACKUP_DIR/app_backup_$BACKUP_DATE.tar.gz"
    local NGINX_BACKUP="$BACKUP_DIR/nginx_backup_$BACKUP_DATE.tar.gz"
    local ENV_BACKUP="$BACKUP_DIR/env_backup_$BACKUP_DATE.production"
    
    # Backup fájlok ellenőrzése
    log_step "🔍 Backup fájlok ellenőrzése..."
    
    if [ ! -f "$DB_BACKUP" ]; then
        log_error "❌ Adatbázis backup nem található: $DB_BACKUP"
        list_backups
        exit 1
    fi
    
    if [ ! -f "$APP_BACKUP" ]; then
        log_error "❌ Alkalmazás backup nem található: $APP_BACKUP"
        list_backups
        exit 1
    fi
    
    log_info "✅ Backup fájlok ellenőrizve"
    
    # Biztonsági kérdés
    log_warn "⚠️  FIGYELEM: Ez felülírja a jelenlegi alkalmazást!"
    log_warn "⚠️  Jelenlegi adatok elveszhetnek!"
    echo -n "Folytatja a rollback-et? (igen/nem): "
    read -r CONFIRM
    
    if [ "$CONFIRM" != "igen" ]; then
        log_info "❌ Rollback megszakítva"
        exit 0
    fi

    # 1. PM2 leállítása
    log_step "🛑 PM2 alkalmazás leállítása..."
    pm2 stop all || log_warn "PM2 leállítás sikertelen"
    
    # 2. Jelenlegi állapot mentése (biztonsági másolat)
    log_step "💾 Jelenlegi állapot biztonsági mentése..."
    local CURRENT_BACKUP="$BACKUP_DIR/before_rollback_$(date +%Y%m%d_%H%M%S)"
    mkdir -p "$CURRENT_BACKUP"
    
    # Jelenlegi alkalmazás mentése
    if [ -d "$APP_DIR" ]; then
        tar -czf "$CURRENT_BACKUP/current_app.tar.gz" -C /var/www newslyfe/
        log_info "Jelenlegi alkalmazás elmentve"
    fi
    
    # Jelenlegi adatbázis mentése
    if sudo -u postgres pg_dump $DB_NAME | gzip > "$CURRENT_BACKUP/current_db.sql.gz"; then
        log_info "Jelenlegi adatbázis elmentve"
    else
        log_warn "Jelenlegi adatbázis mentése sikertelen"
    fi
    
    # 3. Adatbázis visszaállítása
    log_step "🗄️ PostgreSQL adatbázis visszaállítása..."
    
    # Adatbázis ledobása és újralétrehozása
    sudo -u postgres psql -c "DROP DATABASE IF EXISTS ${DB_NAME}_temp;" 2>/dev/null || true
    sudo -u postgres psql -c "CREATE DATABASE ${DB_NAME}_temp;"
    
    # Backup importálása temp adatbázisba
    if gunzip -c "$DB_BACKUP" | sudo -u postgres psql ${DB_NAME}_temp; then
        log_info "Backup importálása sikeres a temp adatbázisba"
        
        # Ha sikeres, cseréljük ki a főt
        sudo -u postgres psql -c "DROP DATABASE IF EXISTS ${DB_NAME}_old;" 2>/dev/null || true
        sudo -u postgres psql -c "ALTER DATABASE $DB_NAME RENAME TO ${DB_NAME}_old;" 2>/dev/null || true
        sudo -u postgres psql -c "ALTER DATABASE ${DB_NAME}_temp RENAME TO $DB_NAME;"
        log_info "✅ Adatbázis rollback sikeres"
    else
        log_error "❌ Adatbázis rollback sikertelen!"
        sudo -u postgres psql -c "DROP DATABASE IF EXISTS ${DB_NAME}_temp;" 2>/dev/null || true
        exit 1
    fi
    
    # 4. Alkalmazás visszaállítása
    log_step "📁 Alkalmazás fájlok visszaállítása..."
    
    # Jelenlegi alkalmazás átnevezése
    if [ -d "$APP_DIR" ]; then
        mv "$APP_DIR" "${APP_DIR}_old_$(date +%Y%m%d_%H%M%S)" || log_warn "Alkalmazás átnevezése sikertelen"
    fi
    
    # Backup kicsomagolása
    mkdir -p /var/www
    if tar -xzf "$APP_BACKUP" -C /var/www; then
        log_info "✅ Alkalmazás fájlok visszaállítva"
        chown -R www-data:www-data "$APP_DIR" 2>/dev/null || log_warn "Jogosultságok beállítása sikertelen"
    else
        log_error "❌ Alkalmazás visszaállítás sikertelen!"
        exit 1
    fi
    
    # 5. Nginx konfiguráció visszaállítása
    log_step "🌐 Nginx konfiguráció visszaállítása..."
    if [ -f "$NGINX_BACKUP" ]; then
        # Jelenlegi nginx config mentése
        cp /etc/nginx/sites-available/newslyfe /etc/nginx/sites-available/newslyfe.backup.$(date +%Y%m%d_%H%M%S) 2>/dev/null || true
        
        # Backup visszaállítása
        if tar -xzf "$NGINX_BACKUP" -C /; then
            log_info "✅ Nginx konfiguráció visszaállítva"
            
            # Nginx teszt
            if nginx -t; then
                systemctl reload nginx
                log_info "✅ Nginx újraindítva"
            else
                log_error "❌ Nginx konfiguráció hibás!"
            fi
        else
            log_warn "Nginx konfiguráció visszaállítás sikertelen"
        fi
    else
        log_warn "Nginx backup nem található"
    fi
    
    # 6. Environment változók visszaállítása
    log_step "⚙️ Environment fájl visszaállítása..."
    if [ -f "$ENV_BACKUP" ]; then
        cp "$ENV_BACKUP" "$APP_DIR/.env.production"
        chmod 600 "$APP_DIR/.env.production"
        log_info "✅ .env.production visszaállítva"
    else
        log_warn ".env.production backup nem található"
    fi
    
    # 7. Dependencies telepítése
    log_step "📦 Dependencies telepítése..."
    cd "$APP_DIR"
    if npm install --production; then
        log_info "✅ Dependencies telepítve"
    else
        log_warn "Dependencies telepítése sikertelen"
    fi
    
    # 8. Build folyamat
    log_step "🔨 Alkalmazás build..."
    if npm run build:backend && npm run build; then
        log_info "✅ Build sikeres"
    else
        log_error "❌ Build sikertelen!"
        exit 1
    fi
    
    # 9. PM2 indítása
    log_step "🚀 PM2 alkalmazás indítása..."
    if pm2 start ecosystem.config.cjs; then
        log_info "✅ PM2 indítva"
        pm2 status
    else
        log_error "❌ PM2 indítás sikertelen!"
        exit 1
    fi
    
    # 10. Teszt
    log_step "🧪 Alkalmazás teszt..."
    sleep 5
    
    if curl -f http://localhost:3002/api/local/news?limit=1 >/dev/null 2>&1; then
        log_info "✅ Backend API teszt sikeres"
    else
        log_warn "⚠️ Backend API teszt sikertelen"
    fi
    
    if curl -f http://localhost >/dev/null 2>&1; then
        log_info "✅ Frontend teszt sikeres"
    else
        log_warn "⚠️ Frontend teszt sikertelen"
    fi
    
    log_info "🎯 Rollback folyamat befejezve!"
    log_info "📊 PM2 status:"
    pm2 status
    
    log_info "💡 Hasznos parancsok:"
    log_info "   pm2 logs --lines 50"
    log_info "   tail -f /var/log/nginx/error.log"
    log_info "   systemctl status nginx"
}

# Script indítás
case "$1" in
    "list")
        list_backups
        ;;
    "rollback")
        rollback_from_backup "$2"
        ;;
    *)
        echo "Usage: $0 {list|rollback BACKUP_DATE}"
        echo ""
        echo "Példák:"
        echo "  $0 list                    # Backup fájlok listázása"
        echo "  $0 rollback 20250906_031014 # Rollback adott backup-ból"
        echo ""
        list_backups
        exit 1
        ;;
esac