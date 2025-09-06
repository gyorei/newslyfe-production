# 🛡️ NewsLyfe Backup & Recovery Stratégia

## 📋 Áttekintés

Teljes körű backup és helyreállítási rendszer a NewsLyfe alkalmazás biztonságos üzemeltetéséhez.

## 🏗️ Backup Architektúra

### **1. Automatikus Napi Backup**
- **Ütemezés**: Minden nap 03:00-kor
- **Helye**: `/var/backups/newslyfe/`
- **Megőrzés**: 30 nap
- **Script**: `/root/backup-fixed.sh`

### **2. Heti Teljes Backup**
- **Ütemezés**: Vasárnap 04:00-kor  
- **Típus**: Teljes archív (weekly_full_backup_YYYYMMDD.tar.gz)
- **Tartalom**: Összes napi backup tömörítve

### **3. Backup Tartalom**

#### 📊 PostgreSQL Adatbázis (3.2MB)
```bash
# Fájl: db_backup_YYYYMMDD_HHMMSS.sql.gz
# Tartalom: Teljes newsbase adatbázis
# - 7000+ domain
# - RSS források
# - Hírek cache
# - Felhasználói adatok
```

#### 📁 Alkalmazás Fájlok (370MB)
```bash
# Fájl: app_backup_YYYYMMDD_HHMMSS.tar.gz  
# Tartalom: Teljes /var/www/newslyfe/
# - Forráskód
# - Node.js dependencies
# - Build fájlok
# - Konfigurációk
```

#### ⚙️ Rendszer Konfigurációk (2.7KB)
```bash
# Fájl: nginx_backup_YYYYMMDD_HHMMSS.tar.gz
# Tartalom:
# - /etc/nginx/sites-available/newslyfe
# - /etc/nginx/ssl.conf  
# - /etc/ssl/certs/dhparam.pem
```

#### 🔐 Environment Változók (825B)
```bash
# Fájl: env_backup_YYYYMMDD_HHMMSS.production
# Tartalom: .env.production (titkosított tárolás)
# Jogosultság: 600 (csak root olvasható)
```

#### 📝 Rendszer Információk
- **Git információk**: commit history, remotes, status
- **PM2 konfiguráció**: process beállítások
- **Rendszer státusz**: CPU, memória, disk használat

## 🚀 Használat

### **Kézi Backup Készítése**
```bash
ssh root@91.98.134.222
/root/backup-fixed.sh
```

### **Backup Fájlok Listázása**
```bash
/root/rollback.sh list
```

### **Teljes Rollback (Vészhelyzet)**
```bash
# 1. Backup dátum kiválasztása
/root/rollback.sh list

# 2. Rollback végrehajtása  
/root/rollback.sh rollback 20250906_031014

# ⚠️ FIGYELEM: Jelenlegi adatok elvesznek!
# ✅ Biztonsági másolat automatikusan készül
```

## 🔄 Rollback Folyamat

### **Automatikus Biztonsági Lépések**
1. **PM2 leállítása** - alkalmazás biztonságos megállítása
2. **Jelenlegi állapot mentése** - before_rollback_TIMESTAMP
3. **Adatbázis rollback** - temp DB használatával
4. **Alkalmazás visszaállítása** - fájlok cseréje
5. **Nginx konfig** - proxy beállítások
6. **Dependencies** - npm install
7. **Build** - frontend + backend  
8. **PM2 indítás** - szolgáltatás visszaállítása
9. **Automatikus teszt** - API és frontend ellenőrzés

### **Biztonsági Funkciók**
- ✅ **Megerősítés kérése** - véletlenszerű rollback ellen
- ✅ **Integrity teszt** - backup fájlok ellenőrzése
- ✅ **Temp adatbázis** - biztonságos DB rollback
- ✅ **Jelenlegi állapot mentése** - rollback előtt
- ✅ **Automatikus teszt** - működés ellenőrzése

## 📊 Monitoring & Logolás

### **Backup Logok**
```bash
# Automatikus backup logok
tail -f /var/log/newslyfe-backup.log

# Backup státusz ellenőrzése
ls -lah /var/backups/newslyfe/

# Utolsó backup eredménye
ls -lah /var/backups/newslyfe/*$(date +%Y%m%d)*
```

### **Cron Jobs Ellenőrzése**
```bash
# Aktív cron jobs
crontab -l

# Cron log
tail -f /var/log/cron.log | grep backup
```

## 🎯 Helyreállítási Forgatókönyvek

### **1. Adatbázis Korrupció**
```bash
# Csak adatbázis rollback
sudo -u postgres psql -c "DROP DATABASE newsbase;"
sudo -u postgres psql -c "CREATE DATABASE newsbase;"
gunzip -c /var/backups/newslyfe/db_backup_LATEST.sql.gz | sudo -u postgres psql newsbase
```

### **2. Konfiguráció Hiba**
```bash
# Csak nginx config visszaállítása
tar -xzf /var/backups/newslyfe/nginx_backup_LATEST.tar.gz -C /
nginx -t && systemctl reload nginx
```

### **3. Alkalmazás Crash**
```bash
# PM2 újraindítás
pm2 restart all
pm2 logs --lines 50

# Ha nem működik - teljes rollback
/root/rollback.sh rollback BACKUP_DATE
```

### **4. Teljes Szerver Újraépítés**
```bash
# Új szerveren:
# 1. Alaprendszer telepítés (Ubuntu + PostgreSQL + Node.js + Nginx)
# 2. Backup fájlok másolása új szerverre
# 3. Rollback script futtatása
# 4. DNS átállítás új IP-re
```

## 📈 Kapacitástervezés

### **Jelenlegi Backup Méretek**
- **Napi backup**: ~373MB (DB 3.2MB + App 370MB)
- **30 napos megőrzés**: ~11GB disk terület
- **Heti teljes**: +~373MB/hét
- **Teljes tárigény**: ~15GB/év

### **Disk Space Monitoring**
```bash
# Backup könyvtár mérete
du -sh /var/backups/newslyfe/

# Rendelkezésre álló hely
df -h /var/backups/

# Automatikus cleanup: 30 nap után törlés
```

## 🔒 Biztonsági Szempontok

### **Backup Biztonság**
- ✅ **Environment fájlok**: chmod 600 (csak root)
- ✅ **Adatbázis**: Jelszó védelem
- ✅ **Integrity check**: Automatikus fájl ellenőrzés
- ✅ **Offline tárolás**: Hetzner cloud isolation

### **Ajánlott Kiegészítések**
- 📦 **Offsite backup**: S3/BackBlaze tárolás
- 🔐 **Titkosítás**: GPG backup fájlok
- 📧 **Email értesítés**: Backup siker/hiba
- 📊 **Dashboard**: Backup monitoring

## 🚨 Vészhelyzeti Eljárás

### **Ha minden mással megszakad**
1. **SSH kapcsolat**: `ssh root@91.98.134.222`
2. **Backup lista**: `/root/rollback.sh list`
3. **Utolsó működő verzió**: Válaszd ki a legújabb sikeres backupot
4. **Rollback**: `/root/rollback.sh rollback BACKUP_DATE`
5. **Ellenőrzés**: `pm2 status && curl -I https://newslyfe.com`

### **Kritikus Adatok Helye**
- **Backup fájlok**: `/var/backups/newslyfe/`
- **Scripts**: `/root/backup-fixed.sh`, `/root/rollback.sh`  
- **Logok**: `/var/log/newslyfe-backup.log`
- **Cron**: `crontab -l`

---

## 📞 Támogatás

**Backup rendszer készítette**: Claude Code Assistant  
**Verzió**: 2025.09.06  
**Utolsó teszt**: ✅ Sikeres (370MB app + 3.2MB DB)

**Vészhelyzet esetén**: Kövesse a fenti rollback lépéseket pontosan!