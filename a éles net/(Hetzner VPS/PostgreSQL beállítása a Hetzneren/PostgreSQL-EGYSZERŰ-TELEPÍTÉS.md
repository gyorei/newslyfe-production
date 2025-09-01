# 🐘 PostgreSQL Egyszerű Telepítés - News Alkalmazás

## 📋 Tartalomjegyzék

1. [PostgreSQL Telepítése](#postgresql-telepítése)
2. [Adatbázis és Felhasználó Létrehozása](#adatbázis-és-felhasználó-létrehozása)
3. [Node.js Kapcsolat Beállítása](#nodejs-kapcsolat-beállítása)
4. [Biztonsági Beállítások](#biztonsági-beállítások)
5. [Backup és Karbantartás](#backup-és-karbantartás)
6. [Teljesítmény Optimalizálás](#teljesítmény-optimalizálás)
7. [Hibaelhárítás](#hibaelhárítás)

---

## 1. PostgreSQL Telepítése

### Ubuntu/Debian rendszeren:
```bash
# Rendszer frissítése
sudo apt update

# PostgreSQL telepítése
sudo apt install -y postgresql postgresql-contrib

# PostgreSQL indítása és engedélyezése
sudo systemctl start postgresql
sudo systemctl enable postgresql

# Státusz ellenőrzése
sudo systemctl status postgresql
```

### Verzió ellenőrzése:
```bash
psql --version
```

---

## 2. Adatbázis és Felhasználó Létrehozása

### PostgreSQL admin felhasználóra váltás:
```bash
sudo -u postgres psql
```

### Adatbázis és felhasználó létrehozása:
```sql
-- Adatbázis létrehozása
CREATE DATABASE newsbase;

-- Felhasználó létrehozása
CREATE USER newsuser WITH PASSWORD 'your_secure_password';

-- Jogosultságok megadása
GRANT ALL PRIVILEGES ON DATABASE newsbase TO newsuser;

-- Kapcsolat tesztelése
\c newsbase

-- Táblák létrehozásának jogosultsága
GRANT CREATE ON SCHEMA public TO newsuser;
GRANT ALL ON ALL TABLES IN SCHEMA public TO newsuser;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO newsuser;

-- Kilépés
\q
```

### Kapcsolat tesztelése:
```bash
# Új felhasználóval való kapcsolat tesztelése
psql -U newsuser -h localhost -d newsbase
```

---

## 3. Node.js Kapcsolat Beállítása

### Környezeti változók beállítása:
```bash
# Backend .env fájl szerkesztése
nano src/backend/.env.production
```

**Szükséges beállítások:**
```env
DB_USER=newsuser
DB_PASSWORD=your_secure_password
DB_HOST=localhost
DB_PORT=5432
DB_NAME=newsbase
```

### Kapcsolat tesztelése Node.js-ből:
```bash
# Backend indítása
npm run start:prod

# Logok ellenőrzése
pm2 logs news-backend
```

---

## 4. Biztonsági Beállítások

### PostgreSQL konfiguráció:
```bash
# PostgreSQL konfigurációs fájl szerkesztése
sudo nano /etc/postgresql/*/main/postgresql.conf
```

**Ajánlott beállítások:**
```conf
# Kapcsolatok
max_connections = 100

# Memória beállítások
shared_buffers = 256MB
effective_cache_size = 1GB

# Logolás
log_statement = 'all'
log_destination = 'stderr'
logging_collector = on
log_directory = 'log'
log_filename = 'postgresql-%Y-%m-%d_%H%M%S.log'
log_rotation_age = 1d
log_rotation_size = 100MB
```

### Hozzáférési szabályok (pg_hba.conf):
```bash
sudo nano /etc/postgresql/*/main/pg_hba.conf
```

**Biztonságos beállítások:**
```conf
# Lokális kapcsolatok
local   all             postgres                                peer
local   all             all                                     md5

# IPv4 kapcsolatok (csak localhost)
host    all             all             127.0.0.1/32            md5
host    all             all             ::1/128                 md5

# IPv6 kapcsolatok (csak localhost)
host    all             all             ::1/128                 md5
```

### Tűzfal beállítások:
```bash
# PostgreSQL port (csak lokális hozzáférés)
sudo ufw deny 5432

# Vagy ha külső hozzáférés kell (nem ajánlott)
sudo ufw allow from YOUR_IP to any port 5432
```

---

## 5. Backup és Karbantartás

### Automatikus backup script:
```bash
# Backup script létrehozása
sudo nano /usr/local/bin/postgres-backup.sh
```

**Backup script tartalma:**
```bash
#!/bin/bash

# Konfiguráció
BACKUP_DIR="/var/backups/postgresql"
DATE=$(date +%Y%m%d_%H%M%S)
DB_NAME="newsbase"
DB_USER="newsuser"

# Backup könyvtár létrehozása
mkdir -p $BACKUP_DIR

# Backup készítése
pg_dump -U $DB_USER -h localhost $DB_NAME > $BACKUP_DIR/newsbase_$DATE.sql

# Tömörítés
gzip $BACKUP_DIR/newsbase_$DATE.sql

# Régi backupok törlése (7 napnál régebbiek)
find $BACKUP_DIR -name "*.sql.gz" -mtime +7 -delete

echo "Backup kész: $BACKUP_DIR/newsbase_$DATE.sql.gz"
```

### Script futtathatóvá tétele:
```bash
sudo chmod +x /usr/local/bin/postgres-backup.sh

# Cron job beállítása (napi backup 2:00-kor)
sudo crontab -e
# Add: 0 2 * * * /usr/local/bin/postgres-backup.sh
```

### Backup visszaállítása:
```bash
# Backup visszaállítása
gunzip -c /var/backups/postgresql/newsbase_20241201_020000.sql.gz | psql -U newsuser -h localhost -d newsbase
```

---

## 6. Teljesítmény Optimalizálás

### PostgreSQL konfiguráció finomhangolása:
```bash
sudo nano /etc/postgresql/*/main/postgresql.conf
```

**Teljesítmény beállítások:**
```conf
# Memória beállítások
shared_buffers = 256MB          # RAM 25%-a
effective_cache_size = 1GB      # RAM 75%-a
work_mem = 4MB                  # Lekérdezésenként
maintenance_work_mem = 64MB     # Karbantartási műveletek

# WAL beállítások
wal_buffers = 16MB
checkpoint_completion_target = 0.9

# Query planner
random_page_cost = 1.1          # SSD esetén
effective_io_concurrency = 200  # SSD esetén

# Autovacuum beállítások
autovacuum = on
autovacuum_max_workers = 3
autovacuum_naptime = 1min
```

### Indexek létrehozása:
```sql
-- Gyakran használt oszlopok indexelése
CREATE INDEX idx_news_published_at ON news(published_at);
CREATE INDEX idx_news_source_id ON news(source_id);
CREATE INDEX idx_news_country ON news(country);

-- Kompozit indexek
CREATE INDEX idx_news_country_published ON news(country, published_at);
```

---

## 7. Hibaelhárítás

### Gyakori hibák:

#### 1. Kapcsolat hiba
```bash
# PostgreSQL futás ellenőrzése
sudo systemctl status postgresql

# Port ellenőrzése
sudo netstat -tlnp | grep :5432

# Logok ellenőrzése
sudo tail -f /var/log/postgresql/postgresql-*.log
```

#### 2. Jogosultsági hiba
```sql
-- Felhasználó jogosultságok ellenőrzése
\du newsuser

-- Adatbázis jogosultságok
\l newsbase
```

#### 3. Memória hiba
```bash
# PostgreSQL memória használat
psql -U newsuser -d newsbase -c "SELECT * FROM pg_stat_bgwriter;"

# Aktív kapcsolatok
psql -U newsuser -d newsbase -c "SELECT * FROM pg_stat_activity;"
```

### Teljesítmény monitoring:
```sql
-- Lassú lekérdezések
SELECT query, mean_time, calls 
FROM pg_stat_statements 
ORDER BY mean_time DESC 
LIMIT 10;

-- Tábla méretek
SELECT 
    schemaname,
    tablename,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size
FROM pg_tables 
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
```

---

## 📊 Monitoring és Karbantartás

### Rendszeres karbantartás:
```bash
# PostgreSQL újraindítása
sudo systemctl restart postgresql

# Konfiguráció újratöltése
sudo systemctl reload postgresql

# Log rotáció
sudo logrotate -f /etc/logrotate.d/postgresql-common
```

### Teljesítmény figyelés:
```bash
# Rendszer erőforrások
htop
free -h
df -h

# PostgreSQL folyamatok
ps aux | grep postgres
```

---

## 📞 Támogatás

### Hasznos parancsok:
```bash
# PostgreSQL admin
sudo -u postgres psql

# Adatbázis kapcsolat
psql -U newsuser -h localhost -d newsbase

# Backup
pg_dump -U newsuser -h localhost newsbase > backup.sql

# Restore
psql -U newsuser -h localhost -d newsbase < backup.sql
```

### Dokumentáció:
- [PostgreSQL hivatalos dokumentáció](https://www.postgresql.org/docs/)
- [PostgreSQL teljesítmény tuning](https://wiki.postgresql.org/wiki/Performance_Optimization)

---

**🎉 A PostgreSQL most már készen áll a News alkalmazás adatbázisaként!** 