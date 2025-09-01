# 🔒 SSL Tanúsítvány Útmutató - Let's Encrypt

## 📋 Tartalomjegyzék

1. [Előfeltételek](#előfeltételek)
2. [Domain Beállítása](#domain-beállítása)
3. [Certbot Telepítése](#certbot-telepítése)
4. [SSL Tanúsítvány Beszerzése](#ssl-tanúsítvány-beszerzése)
5. [Nginx Konfiguráció](#nginx-konfiguráció)
6. [Automatikus Megújítás](#automatikus-megújítás)
7. [Hibaelhárítás](#hibaelhárítás)

---

## 🔧 Előfeltételek

### Szükséges:
- ✅ **Domain név** (pl. `sajatdomain.hu`)
- ✅ **Hetzner VPS** futó szerver
- ✅ **Nginx** telepítve és konfigurálva
- ✅ **DNS rekordok** beállítva
- ✅ **Port 80 és 443** nyitva

### Ellenőrzés:
```bash
# Domain DNS ellenőrzés
nslookup sajatdomain.hu

# Portok ellenőrzése
sudo netstat -tlnp | grep :80
sudo netstat -tlnp | grep :443
```

---

## 🌍 Domain Beállítása

### 1. DNS Rekordok
A domain szolgáltatódnál állítsd be:

```
A     @     YOUR_SERVER_IP
A     www   YOUR_SERVER_IP
```

### 2. DNS Propagáció
- **Várakozási idő**: 5-30 perc
- **Ellenőrzés**: `dig sajatdomain.hu`

### 3. Domain Tesztelés
```bash
# HTTP tesztelés
curl -I http://sajatdomain.hu

# Várj, amíg a DNS propagálódik
```

---

## 📦 Certbot Telepítése

### 1. Telepítés Ubuntu/Debian
```bash
# Rendszer frissítése
sudo apt update

# Certbot telepítése
sudo apt install -y certbot python3-certbot-nginx

# Verzió ellenőrzése
certbot --version
```

### 2. Certbot Plugin Ellenőrzése
```bash
# Nginx plugin telepítése
sudo apt install -y python3-certbot-nginx

# Plugin ellenőrzése
certbot plugins
```

---

## 🔐 SSL Tanúsítvány Beszerzése

### 1. Első Tanúsítvány Beszerzése
```bash
# Automatikus SSL tanúsítvány beszerzése
sudo certbot --nginx -d sajatdomain.hu -d www.sajatdomain.hu

# Válaszolj a kérdésekre:
# - Email cím: your-email@example.com
# - ÁSZF elfogadása: Y
# - Email feliratkozás: N (ajánlott)
# - HTTP → HTTPS átirányítás: 2 (ajánlott)
```

### 2. Tanúsítvány Ellenőrzése
```bash
# Tanúsítvány listázása
sudo certbot certificates

# Tanúsítvány részletei
sudo certbot certificates --cert-name sajatdomain.hu
```

### 3. Nginx Konfiguráció Ellenőrzése
```bash
# Nginx konfiguráció tesztelése
sudo nginx -t

# Nginx újraindítása
sudo systemctl restart nginx
```

---

## ⚙️ Nginx Konfiguráció

### 1. SSL Konfiguráció Ellenőrzése
```bash
# SSL konfiguráció megtekintése
sudo cat /etc/nginx/sites-available/news
```

### 2. SSL Beállítások Optimalizálása
```bash
# SSL konfiguráció szerkesztése
sudo nano /etc/nginx/ssl.conf
```

**Ajánlott SSL beállítások:**
```nginx
# SSL protokollok
ssl_protocols TLSv1.2 TLSv1.3;

# Biztonságos cipher suite-ek
ssl_ciphers ECDHE-RSA-AES128-GCM-SHA256:ECDHE-RSA-AES256-GCM-SHA384;

# SSL session cache
ssl_session_cache shared:SSL:10m;
ssl_session_timeout 10m;

# OCSP stapling
ssl_stapling on;
ssl_stapling_verify on;

# HSTS
add_header Strict-Transport-Security "max-age=63072000" always;
```

### 3. HTTP → HTTPS Átirányítás
```nginx
# HTTP szerver blokk
server {
    listen 80;
    server_name sajatdomain.hu www.sajatdomain.hu;
    return 301 https://$server_name$request_uri;
}
```

---

## 🔄 Automatikus Megújítás

### 1. Megújítás Tesztelése
```bash
# Dry run (tesztelés)
sudo certbot renew --dry-run

# Valós megújítás
sudo certbot renew
```

### 2. Cron Job Beállítása
```bash
# Cron job hozzáadása
sudo crontab -e

# Add ezt a sort:
0 12 * * * /usr/bin/certbot renew --quiet
```

### 3. Megújítás Script
```bash
# Megújítás script létrehozása
sudo nano /usr/local/bin/ssl-renew.sh
```

**Script tartalma:**
```bash
#!/bin/bash
/usr/bin/certbot renew --quiet
if [ $? -eq 0 ]; then
    systemctl reload nginx
    echo "SSL tanúsítvány megújítva: $(date)" >> /var/log/ssl-renew.log
else
    echo "SSL tanúsítvány megújítási hiba: $(date)" >> /var/log/ssl-renew.log
fi
```

```bash
# Script futtathatóvá tétele
sudo chmod +x /usr/local/bin/ssl-renew.sh

# Cron job frissítése
sudo crontab -e
# Add: 0 12 * * * /usr/local/bin/ssl-renew.sh
```

---

## 🔧 Hibaelhárítás

### 1. Gyakori Hibák

#### Domain Validáció Hiba
```bash
# Domain elérhetőség ellenőrzése
curl -I http://sajatdomain.hu

# DNS ellenőrzés
dig sajatdomain.hu

# Nginx futás ellenőrzése
sudo systemctl status nginx
```

#### Port 80 Zárt
```bash
# Tűzfal ellenőrzése
sudo ufw status

# Port 80 nyitása
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
```

#### Certbot Plugin Hiba
```bash
# Certbot plugin újratelepítése
sudo apt remove --purge python3-certbot-nginx
sudo apt install python3-certbot-nginx

# Certbot cache törlése
sudo certbot clean
```

### 2. Tanúsítvány Megújítási Hiba
```bash
# Logok ellenőrzése
sudo tail -f /var/log/letsencrypt/letsencrypt.log

# Manuális megújítás
sudo certbot renew --force-renewal

# Nginx újraindítása
sudo systemctl restart nginx
```

### 3. SSL Konfiguráció Hiba
```bash
# Nginx konfiguráció tesztelése
sudo nginx -t

# SSL tanúsítvány ellenőrzése
sudo openssl x509 -in /etc/letsencrypt/live/sajatdomain.hu/fullchain.pem -text -noout

# Tanúsítvány lejárat ellenőrzése
sudo certbot certificates
```

---

## 📊 SSL Tanúsítvány Monitoring

### 1. Lejárat Figyelés
```bash
# Lejárat ellenőrzése
sudo certbot certificates

# Automatikus figyelés script
sudo nano /usr/local/bin/ssl-check.sh
```

**Figyelő script:**
```bash
#!/bin/bash
DAYS=$(certbot certificates | grep "VALID:" | awk '{print $2}' | cut -d' ' -f1)
if [ $DAYS -lt 30 ]; then
    echo "SSL tanúsítvány hamarosan lejár: $DAYS nap múlva" | mail -s "SSL Alert" your-email@example.com
fi
```

### 2. SSL Tesztelés Online
- **SSL Labs**: https://www.ssllabs.com/ssltest/
- **Mozilla Observatory**: https://observatory.mozilla.org/
- **Security Headers**: https://securityheaders.com/

### 3. Log Monitoring
```bash
# Certbot logok
sudo tail -f /var/log/letsencrypt/letsencrypt.log

# Nginx SSL logok
sudo tail -f /var/log/nginx/error.log | grep ssl
```

---

## 🎯 SSL Biztonsági Beállítások

### 1. Biztonsági Fejlécek
```nginx
# HSTS
add_header Strict-Transport-Security "max-age=63072000; includeSubDomains; preload" always;

# Content Security Policy
add_header Content-Security-Policy "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline';" always;

# X-Frame-Options
add_header X-Frame-Options "SAMEORIGIN" always;

# X-Content-Type-Options
add_header X-Content-Type-Options "nosniff" always;
```

### 2. SSL Protokoll Beállítások
```nginx
# Csak biztonságos protokollok
ssl_protocols TLSv1.2 TLSv1.3;

# Biztonságos cipher suite-ek
ssl_ciphers ECDHE-RSA-AES128-GCM-SHA256:ECDHE-RSA-AES256-GCM-SHA384:ECDHE-RSA-AES128-SHA256:ECDHE-RSA-AES256-SHA384;

# Perfect Forward Secrecy
ssl_prefer_server_ciphers off;
```

### 3. OCSP Stapling
```nginx
# OCSP stapling
ssl_stapling on;
ssl_stapling_verify on;
resolver 8.8.8.8 8.8.4.4 valid=300s;
resolver_timeout 5s;
```

---

## 📞 Támogatás

### Hasznos Parancsok
```bash
# Tanúsítvány információk
sudo certbot certificates

# Tanúsítvány törlése
sudo certbot delete --cert-name sajatdomain.hu

# Tanúsítvány újragenerálása
sudo certbot --nginx -d sajatdomain.hu --force-renewal

# Certbot segítség
certbot --help
```

### Dokumentáció
- [Let's Encrypt Dokumentáció](https://letsencrypt.org/docs/)
- [Certbot Dokumentáció](https://certbot.eff.org/docs/)
- [Nginx SSL Dokumentáció](https://nginx.org/en/docs/http/configuring_https_servers.html)

---

**🔒 Az SSL tanúsítványod most már biztonságos HTTPS kapcsolatot biztosít!** 