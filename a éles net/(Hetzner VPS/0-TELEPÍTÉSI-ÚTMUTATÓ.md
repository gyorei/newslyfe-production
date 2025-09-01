# 🚀 News Alkalmazás Telepítési Útmutató - Hetzner VPS

## 📋 Tartalomjegyzék

1. [Előfeltételek](#előfeltételek)
2. [Hetzner Cloud VPS Beállítása](#hetzner-cloud-vps-beállítása)
3. [Domain Beállítása](#domain-beállítása)
4. [Szerver Előkészítése](#szerver-előkészítése)
5. [Alkalmazás Telepítése](#alkalmazás-telepítése)
6. [SSL Tanúsítvány](#ssl-tanúsítvány)
7. [Tesztelés](#tesztelés)
8. [Hibaelhárítás](#hibaelhárítás)

---

## 🔧 Előfeltételek

### Szükséges szolgáltatások:
- ✅ **Hetzner Cloud VPS** (ajánlott: CPX11 vagy nagyobb)
- ✅ **Domain név** (pl. `sajatdomain.hu`)
- ✅ **SSH hozzáférés** a szerverhez
- ✅ **Git repository** a kóddal

### Ajánlott Hetzner csomagok:
- **CPX11**: 2 vCPU, 4 GB RAM, 40 GB SSD - **3,79 €/hó**
- **CPX21**: 3 vCPU, 8 GB RAM, 80 GB SSD - **7,58 €/hó**
- **CPX31**: 4 vCPU, 16 GB RAM, 160 GB SSD - **15,16 €/hó**

---

## 🌐 Hetzner Cloud VPS Beállítása

### 1. VPS Létrehozása
1. Jelentkezz be a [Hetzner Cloud Console](https://console.hetzner.cloud/)-ba
2. Kattints **"Add Server"**
3. Válaszd ki:
   - **Location**: Frankfurt (ajánlott)
   - **Image**: Ubuntu 22.04
   - **Type**: CPX11 vagy nagyobb
   - **SSH Key**: Add hozzá a publikus SSH kulcsod

### 2. Hálózati Beállítások
1. **Firewall** beállítása:
   - Port 22 (SSH)
   - Port 80 (HTTP)
   - Port 443 (HTTPS)

### 3. SSH Kapcsolat Tesztelése
```bash
ssh root@YOUR_SERVER_IP
```

---

## 🌍 Domain Beállítása

### 1. DNS Rekordok Beállítása
A domain szolgáltatódnál állítsd be:

```
A     @     YOUR_SERVER_IP
A     www   YOUR_SERVER_IP
```

### 2. DNS Propagáció Várakozás
- **Időtartam**: 5-30 perc
- **Ellenőrzés**: `nslookup sajatdomain.hu`

---

## 🖥️ Szerver Előkészítése

### 1. Rendszer Frissítése
```bash
sudo apt update && sudo apt upgrade -y
```

### 2. Alapvető Csomagok Telepítése
```bash
sudo apt install -y curl wget git build-essential
```

### 3. Node.js Telepítése
```bash
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs
```

### 4. PostgreSQL Telepítése
```bash
sudo apt install -y postgresql postgresql-contrib
```

### 5. Nginx Telepítése
```bash
sudo apt install -y nginx
```

### 6. PM2 Telepítése
```bash
sudo npm install -g pm2
```

---

## 📦 Alkalmazás Telepítése

### 1. Kód Letöltése
```bash
cd /var/www
sudo git clone https://github.com/YOUR_USERNAME/news.git
sudo chown -R $USER:$USER news
cd news
```

### 2. Függőségek Telepítése
```bash
npm install
```

### 3. Környezeti Változók Beállítása
```bash
# Backend környezeti változók
cp src/backend/.env.development src/backend/.env.production

# Szerkeszd a .env.production fájlt:
nano src/backend/.env.production
```

**Szükséges beállítások:**
```env
DB_USER=newsuser
DB_PASSWORD=your_secure_password
DB_HOST=localhost
DB_PORT=5432
DB_NAME=newsbase
PORT=3002
ALLOWED_ORIGINS=https://sajatdomain.hu
SESSION_SECRET=your_generated_secret
```

### 4. Frontend Build
```bash
npm run build
```

### 5. Backend Build
```bash
npm run build:backend
```

### 6. PostgreSQL Beállítása
```bash
sudo -u postgres psql -c "CREATE DATABASE newsbase;"
sudo -u postgres psql -c "CREATE USER newsuser WITH PASSWORD 'your_secure_password';"
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE newsbase TO newsuser;"
```

---

## 🔒 SSL Tanúsítvány

### 1. Certbot Telepítése
```bash
sudo apt install -y certbot python3-certbot-nginx
```

### 2. Nginx Konfiguráció Másolása
```bash
sudo cp nginx/nginx.conf /etc/nginx/sites-available/news
sudo cp nginx/ssl.conf /etc/nginx/ssl.conf
```

### 3. Domain Módosítása
```bash
# Szerkeszd a konfigurációs fájlokat:
sudo nano /etc/nginx/sites-available/news
sudo nano /etc/nginx/ssl.conf

# Cseréld le a "sajatdomain.hu"-t a valós domain nevedre
```

### 4. Nginx Site Engedélyezése
```bash
sudo ln -sf /etc/nginx/sites-available/news /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t
sudo systemctl restart nginx
```

### 5. SSL Tanúsítvány Beszerzése
```bash
sudo certbot --nginx -d sajatdomain.hu -d www.sajatdomain.hu
```

---

## 🚀 Alkalmazás Indítása

### 1. PM2 Indítás
```bash
pm2 start ecosystem.config.cjs
pm2 save
pm2 startup
```

### 2. Automatikus Indítás Beállítása
```bash
sudo env PATH=$PATH:/usr/bin /usr/lib/node_modules/pm2/bin/pm2 startup systemd -u $USER --hp $HOME
```

---

## ✅ Tesztelés

### 1. Alkalmazás Ellenőrzése
- **Frontend**: https://sajatdomain.hu
- **API**: https://sajatdomain.hu/api/ping
- **Health Check**: https://sajatdomain.hu/health

### 2. Logok Ellenőrzése
```bash
# PM2 logok
pm2 logs

# Nginx logok
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log

# Alkalmazás logok
pm2 logs news-backend
```

### 3. Teljesítmény Tesztelés
```bash
# Adatbázis kapcsolat
pm2 restart news-backend

# Statikus fájlok
curl -I https://sajatdomain.hu
```

---

## 🔧 Hibaelhárítás

### Gyakori Hibák

#### 1. Nginx 502 Bad Gateway
```bash
# Ellenőrizd a backend futását
pm2 status
pm2 logs news-backend

# Ellenőrizd a portot
sudo netstat -tlnp | grep :3002
```

#### 2. SSL Tanúsítvány Hiba
```bash
# Tanúsítvány újraigénylése
sudo certbot renew --dry-run

# Nginx újraindítása
sudo systemctl restart nginx
```

#### 3. Adatbázis Kapcsolat Hiba
```bash
# PostgreSQL státusz
sudo systemctl status postgresql

# Kapcsolat tesztelés
psql -U newsuser -h localhost -d newsbase
```

#### 4. PM2 Alkalmazás Nem Indul
```bash
# PM2 törlése és újraindítás
pm2 delete all
pm2 start ecosystem.config.cjs
pm2 save
```

---

## 📊 Monitoring és Karbantartás

### 1. Backup Script Használata
```bash
# Backup script futtatása
chmod +x nginx/backup.sh
./nginx/backup.sh

# Cron job beállítása (napi backup)
crontab -e
# Add: 0 2 * * * /var/www/news/nginx/backup.sh
```

### 2. Log Rotáció
```bash
# Nginx log rotáció
sudo nano /etc/logrotate.d/nginx

# PM2 log rotáció
pm2 install pm2-logrotate
```

### 3. Rendszer Monitoring
```bash
# Rendszer erőforrások
htop
df -h
free -h

# PM2 monitoring
pm2 monit
```

---

## 🎯 Következő Lépések

### 1. Automatizálás
- **CI/CD pipeline** beállítása
- **Automatikus deployment** scriptek
- **Monitoring** és **alerting**

### 2. Optimalizálás
- **CDN** beállítása (Cloudflare)
- **Database indexing** optimalizálás
- **Caching** stratégia

### 3. Biztonság
- **Firewall** finomhangolás
- **Fail2ban** telepítése
- **Rendszeres backup** tesztelés

---

## 📞 Támogatás

### Hasznos Parancsok
```bash
# Alkalmazás újraindítása
pm2 restart news-backend

# Nginx újraindítása
sudo systemctl restart nginx

# PostgreSQL újraindítása
sudo systemctl restart postgresql

# Rendszer újraindítása
sudo reboot
```

### Dokumentáció
- [Hetzner Cloud Dokumentáció](https://docs.hetzner.com/)
- [Nginx Dokumentáció](https://nginx.org/en/docs/)
- [PM2 Dokumentáció](https://pm2.keymetrics.io/docs/)

---

**🎉 Gratulálok! Az alkalmazásod most már fut a Hetzner Cloud VPS-en!** 