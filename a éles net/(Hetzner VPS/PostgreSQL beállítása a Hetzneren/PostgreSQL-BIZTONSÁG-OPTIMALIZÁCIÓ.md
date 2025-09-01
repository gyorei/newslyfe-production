# 🔒 PostgreSQL Biztonság és Optimalizáció

## 📋 Tartalomjegyzék

1. [Biztonsági Beállítások](#biztonsági-beállítások)
2. [Hálózati Biztonság](#hálózati-biztonság)
3. [Felhasználói Jogosultságok](#felhasználói-jogosultságok)
4. [Adatbázis Titkosítás](#adatbázis-titkosítás)
5. [Audit és Logolás](#audit-és-logolás)
6. [Teljesítmény Optimalizálás](#teljesítmény-optimalizálás)
7. [Monitoring és Alerting](#monitoring-és-alerting)

---

## 1. Biztonsági Beállítások

### PostgreSQL konfiguráció biztonságosítása:
```bash
sudo nano /etc/postgresql/*/main/postgresql.conf
```

**Biztonsági beállítások:**
```conf
# Kapcsolatok korlátozása
max_connections = 100

# Időtúllépések
statement_timeout = 300000  # 5 perc
idle_in_transaction_session_timeout = 600000  # 10 perc

# SSL beállítások
ssl = on
ssl_cert_file = '/etc/ssl/certs/ssl-cert-snakeoil.pem'
ssl_key_file = '/etc/ssl/private/ssl-cert-snakeoil.key'

# Jelszó titkosítás
password_encryption = scram-sha-256

# Logolás
log_connections = on
log_disconnections = on
log_statement = 'all'
log_min_duration_statement = 1000  # 1 másodperc
```

### Hozzáférési szabályok (pg_hba.conf):
```bash
sudo nano /etc/postgresql/*/main/pg_hba.conf
```

**Biztonságos konfiguráció:**
```conf
# PostgreSQL felhasználó (csak peer auth)
local   all             postgres                                peer

# Lokális kapcsolatok (csak md5)
local   all             all                                     md5

# IPv4 kapcsolatok (csak localhost)
host    all             all             127.0.0.1/32            md5

# IPv6 kapcsolatok (csak localhost)
host    all             all             ::1/128                 md5

# Külső kapcsolatok (ha szükséges)
# host    all             all             YOUR_IP/32              md5
```

---

## 2. Hálózati Biztonság

### Tűzfal beállítások:
```bash
# PostgreSQL port blokkolása (csak lokális hozzáférés)
sudo ufw deny 5432

# Vagy specifikus IP engedélyezése
sudo ufw allow from YOUR_IP to any port 5432

# Tűzfal állapot ellenőrzése
sudo ufw status
```

### PostgreSQL hálózati beállítások:
```bash
sudo nano /etc/postgresql/*/main/postgresql.conf
```

**Hálózati beállítások:**
```conf
# Csak lokális kapcsolatok
listen_addresses = 'localhost'

# Port beállítás
port = 5432
```

---

## 3. Felhasználói Jogosultságok

### Biztonságos felhasználó létrehozása:
```sql
-- PostgreSQL admin felhasználóra váltás
sudo -u postgres psql

-- Felhasználó létrehozása erős jelszóval
CREATE USER newsuser WITH PASSWORD 'your_very_secure_password_123!';

-- Adatbázis létrehozása
CREATE DATABASE newsbase OWNER newsuser;

-- Minimális jogosultságok megadása
GRANT CONNECT ON DATABASE newsbase TO newsuser;
GRANT USAGE ON SCHEMA public TO newsuser;
GRANT CREATE ON SCHEMA public TO newsuser;

-- Tábla jogosultságok (a táblák létrehozása után)
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO newsuser;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO newsuser;

-- Jövőbeli táblák jogosultságai
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO newsuser;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT USAGE, SELECT ON SEQUENCES TO newsuser;
```

### Jogosultságok ellenőrzése:
```sql
-- Felhasználók listázása
\du

-- Adatbázis jogosultságok
\l newsbase

-- Séma jogosultságok
\dn+
```

---

## 4. Adatbázis Titkosítás

### Transzparens adattitkosítás (TDE):
```sql
-- Titkosítás engedélyezése
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Titkosított oszlop létrehozása
CREATE TABLE sensitive_data (
    id SERIAL PRIMARY KEY,
    encrypted_field BYTEA
);

-- Adat titkosítása
INSERT INTO sensitive_data (encrypted_field) 
VALUES (pgp_sym_encrypt('sensitive data', 'encryption_key'));
```

### Jelszó titkosítás:
```sql
-- Jelszó hash létrehozása
SELECT crypt('user_password', gen_salt('bf'));

-- Jelszó ellenőrzése
SELECT crypt('user_password', stored_hash) = stored_hash;
```

---

## 5. Audit és Logolás

### Részletes logolás beállítása:
```bash
sudo nano /etc/postgresql/*/main/postgresql.conf
```

**Logolási beállítások:**
```conf
# Logolás engedélyezése
logging_collector = on
log_destination = 'stderr'
log_directory = 'log'
log_filename = 'postgresql-%Y-%m-%d_%H%M%S.log'

# Kapcsolatok logolása
log_connections = on
log_disconnections = on

# Lekérdezések logolása
log_statement = 'all'
log_min_duration_statement = 1000

# Hibák logolása
log_error_verbosity = verbose
log_line_prefix = '%t [%p]: [%l-1] user=%u,db=%d,app=%a,client=%h '
```

### Log rotáció beállítása:
```bash
sudo nano /etc/logrotate.d/postgresql-common
```

**Log rotáció konfiguráció:**
```
/var/log/postgresql/*.log {
    daily
    missingok
    rotate 52
    compress
    delaycompress
    notifempty
    create 644 postgres postgres
    postrotate
        /usr/bin/pg_ctl reload -D /etc/postgresql/*/main
    endscript
}
```

---

## 6. Teljesítmény Optimalizálás

### Memória beállítások:
```bash
sudo nano /etc/postgresql/*/main/postgresql.conf
```

**Memória optimalizálás:**
```conf
# Alap memória beállítások
shared_buffers = 256MB          # RAM 25%-a
effective_cache_size = 1GB      # RAM 75%-a
work_mem = 4MB                  # Lekérdezésenként
maintenance_work_mem = 64MB     # Karbantartási műveletek

# WAL beállítások
wal_buffers = 16MB
checkpoint_completion_target = 0.9
checkpoint_timeout = 5min

# Query planner beállítások
random_page_cost = 1.1          # SSD esetén
effective_io_concurrency = 200  # SSD esetén
seq_page_cost = 1.0

# Autovacuum beállítások
autovacuum = on
autovacuum_max_workers = 3
autovacuum_naptime = 1min
autovacuum_vacuum_threshold = 50
autovacuum_analyze_threshold = 50
```

### Indexek optimalizálása:
```sql
-- Gyakran használt oszlopok indexelése
CREATE INDEX CONCURRENTLY idx_news_published_at ON news(published_at);
CREATE INDEX CONCURRENTLY idx_news_source_id ON news(source_id);
CREATE INDEX CONCURRENTLY idx_news_country ON news(country);

-- Kompozit indexek
CREATE INDEX CONCURRENTLY idx_news_country_published ON news(country, published_at);
CREATE INDEX CONCURRENTLY idx_news_source_published ON news(source_id, published_at);

-- Partial indexek (csak aktív hírek)
CREATE INDEX CONCURRENTLY idx_news_active ON news(published_at) WHERE active = true;
```

### Lekérdezés optimalizálás:
```sql
-- Lassú lekérdezések azonosítása
SELECT query, mean_time, calls, total_time
FROM pg_stat_statements 
ORDER BY mean_time DESC 
LIMIT 10;

-- Tábla statisztikák frissítése
ANALYZE news;
ANALYZE sources;
ANALYZE countries;
```

---

## 7. Monitoring és Alerting

### Teljesítmény monitoring script:
```bash
sudo nano /usr/local/bin/postgres-monitor.sh
```

**Monitoring script:**
```bash
#!/bin/bash

# PostgreSQL monitoring script
DB_NAME="newsbase"
DB_USER="newsuser"

# Kapcsolatok ellenőrzése
CONNECTIONS=$(psql -U $DB_USER -d $DB_NAME -t -c "SELECT count(*) FROM pg_stat_activity;")

# Aktív lekérdezések
ACTIVE_QUERIES=$(psql -U $DB_USER -d $DB_NAME -t -c "SELECT count(*) FROM pg_stat_activity WHERE state = 'active';")

# Adatbázis méret
DB_SIZE=$(psql -U $DB_USER -d $DB_NAME -t -c "SELECT pg_size_pretty(pg_database_size('$DB_NAME'));")

# Cache hit ratio
CACHE_HIT=$(psql -U $DB_USER -d $DB_NAME -t -c "
SELECT round(100.0 * sum(heap_blks_hit) / (sum(heap_blks_hit) + sum(heap_blks_read)), 2) 
FROM pg_statio_user_tables;")

echo "=== PostgreSQL Monitoring ==="
echo "Kapcsolatok: $CONNECTIONS"
echo "Aktív lekérdezések: $ACTIVE_QUERIES"
echo "Adatbázis méret: $DB_SIZE"
echo "Cache hit ratio: $CACHE_HIT%"

# Alerting (ha szükséges)
if [ $CONNECTIONS -gt 80 ]; then
    echo "WARNING: Túl sok kapcsolat!"
fi

if [ ${CACHE_HIT%.*} -lt 90 ]; then
    echo "WARNING: Alacsony cache hit ratio!"
fi
```

### Cron job beállítása:
```bash
sudo chmod +x /usr/local/bin/postgres-monitor.sh

# 5 percenként monitoring
sudo crontab -e
# Add: */5 * * * * /usr/local/bin/postgres-monitor.sh >> /var/log/postgres-monitor.log
```

---

## 📊 Teljesítmény Metrikák

### Rendszeres ellenőrzések:
```sql
-- Kapcsolatok
SELECT count(*) as total_connections FROM pg_stat_activity;

-- Aktív lekérdezések
SELECT count(*) as active_queries FROM pg_stat_activity WHERE state = 'active';

-- Tábla méretek
SELECT 
    schemaname,
    tablename,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size
FROM pg_tables 
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;

-- Index használat
SELECT 
    schemaname,
    tablename,
    indexname,
    idx_scan,
    idx_tup_read,
    idx_tup_fetch
FROM pg_stat_user_indexes
ORDER BY idx_scan DESC;
```

---

## 🔧 Hibaelhárítás

### Gyakori problémák:

#### 1. Memória túlcsordulás
```bash
# PostgreSQL memória használat
ps aux | grep postgres

# Shared buffers ellenőrzése
psql -U newsuser -d newsbase -c "SHOW shared_buffers;"
```

#### 2. Lassú lekérdezések
```sql
-- Lassú lekérdezések azonosítása
SELECT query, mean_time, calls 
FROM pg_stat_statements 
ORDER BY mean_time DESC 
LIMIT 5;

-- Query plan elemzése
EXPLAIN ANALYZE SELECT * FROM news WHERE country = 'US' ORDER BY published_at DESC LIMIT 100;
```

#### 3. Kapcsolat problémák
```bash
# PostgreSQL logok
sudo tail -f /var/log/postgresql/postgresql-*.log

# Kapcsolatok listázása
psql -U newsuser -d newsbase -c "SELECT * FROM pg_stat_activity;"
```

---

## 📞 Támogatás

### Hasznos parancsok:
```bash
# PostgreSQL admin
sudo -u postgres psql

# Adatbázis kapcsolat
psql -U newsuser -h localhost -d newsbase

# Konfiguráció újratöltése
sudo systemctl reload postgresql

# Teljes újraindítás
sudo systemctl restart postgresql
```

### Dokumentáció:
- [PostgreSQL Security](https://www.postgresql.org/docs/current/security.html)
- [PostgreSQL Performance Tuning](https://wiki.postgresql.org/wiki/Performance_Optimization)

---

**🔒 A PostgreSQL most már biztonságosan és optimalizáltan fut!** 