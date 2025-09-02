# 🖥️ NGINX Telepítés és Konfiguráció Hetzner VPS-en

## 📋 Tartalomjegyzék

1. [Nginx Telepítése](#nginx-telepítése)
2. [Alap Konfiguráció](#alap-konfiguráció)
3. [Statikus Fájlok Kiszolgálása](#statikus-fájlok-kiszolgálása)
4. [Reverse Proxy Node.js Backendhez](#reverse-proxy-nodejs-backendhez)
5. [SSL/HTTPS Beállítások](#sslhttps-beállítások)
6. [Optimalizálás és Biztonság](#optimalizálás-és-biztonság)
7. [Nginx Parancsok és Logok](#nginx-parancsok-és-logok)
8. [Hibaelhárítás](#hibaelhárítás)

---

## 1. Nginx Telepítése

### Ubuntu/Debian rendszeren:
```bash
sudo apt update
sudo apt install -y nginx
```

### Indítás és státusz:
```bash
sudo systemctl start nginx
sudo systemctl enable nginx
sudo systemctl status nginx
```

---

## 2. Alap Konfiguráció

### Fő konfigurációs fájlok:
- `/etc/nginx/nginx.conf` (globális)
- `/etc/nginx/sites-available/` (virtuális hostok)
- `/etc/nginx/sites-enabled/` (symlinkek az aktív hostokhoz)

### Új site konfiguráció létrehozása:
```bash
sudo nano /etc/nginx/sites-available/news
```

**Példa tartalom:**
```nginx
server {
    listen 80;
    server_name sajatdomain.hu www.sajatdomain.hu;
    root /var/www/news/build;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }
}
```

### Engedélyezés:
```bash
sudo ln -sf /etc/nginx/sites-available/news /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t
sudo systemctl reload nginx
```

---

## 3. Statikus Fájlok Kiszolgálása

- A React buildelt fájljait a `root /var/www/news/build;` sor szolgálja ki.
- A `/feeds/` mappát külön is kiszolgálhatod:
```nginx
location /feeds/ {
    alias /var/www/news/public/feeds/;
    expires 10m;
    add_header Cache-Control "public";
    add_header Content-Type "application/json";
}
```

---

## 4. Reverse Proxy Node.js Backendhez

- Az API végpontokat továbbítsd a Node.js szerver felé:
```nginx
upstream backend {
    server 127.0.0.1:3002;
    keepalive 32;
}

server {
    listen 443 ssl http2;
    server_name sajatdomain.hu www.sajatdomain.hu;
    ...
    location /api/ {
        proxy_pass http://backend;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_read_timeout 86400;
    }
}
```

---

## 5. SSL/HTTPS Beállítások

- Let's Encrypt tanúsítvány beszerzése:
```bash
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d sajatdomain.hu -d www.sajatdomain.hu
```

- SSL konfiguráció beillesztése:
```nginx
include /etc/nginx/ssl.conf;
```

- SSL tanúsítványok helye:
```
/etc/letsencrypt/live/sajatdomain.hu/fullchain.pem
/etc/letsencrypt/live/sajatdomain.hu/privkey.pem
```

---

## 6. Optimalizálás és Biztonság

### Gzip tömörítés:
```nginx
gzip on;
gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript;
```

### Cache beállítások:
```nginx
location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
    expires 1y;
    add_header Cache-Control "public, immutable";
    access_log off;
}
```

### Biztonsági fejlécek:
```nginx
add_header X-Frame-Options "SAMEORIGIN" always;
add_header X-XSS-Protection "1; mode=block" always;
add_header X-Content-Type-Options "nosniff" always;
add_header Referrer-Policy "no-referrer-when-downgrade" always;
add_header Content-Security-Policy "default-src 'self' http: https: data: blob: 'unsafe-inline'" always;
```

### Rate limiting:
```nginx
limit_req_zone $binary_remote_addr zone=api:10m rate=10r/s;
limit_req zone=api burst=20 nodelay;
```

---

## 7. Nginx Parancsok és Logok

### Alap parancsok:
```bash
sudo systemctl start nginx
sudo systemctl stop nginx
sudo systemctl restart nginx
sudo systemctl reload nginx
sudo systemctl status nginx
```

### Konfiguráció tesztelése:
```bash
sudo nginx -t
```

### Logok:
```bash
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log
```

---

## 8. Hibaelhárítás

### Gyakori hibák:
- **502 Bad Gateway**: A backend nem fut vagy rossz porton van
- **403 Forbidden**: Jogosultsági hiba, root könyvtár vagy fájl jogosultságok
- **404 Not Found**: Hibás útvonal vagy alias
- **SSL hibák**: Tanúsítvány hiányzik vagy hibás

### Ellenőrző parancsok:
```bash
sudo systemctl status nginx
sudo nginx -t
sudo tail -f /var/log/nginx/error.log
```

### Portok ellenőrzése:
```bash
sudo netstat -tlnp | grep :80
sudo netstat -tlnp | grep :443
```

---

## 📞 Támogatás és Dokumentáció
- [Nginx hivatalos dokumentáció](https://nginx.org/en/docs/)
- [Let's Encrypt](https://letsencrypt.org/)
- [PM2 dokumentáció](https://pm2.keymetrics.io/docs/)

---

**🎉 Az Nginx most már készen áll a News alkalmazás kiszolgálására a Hetzner VPS-en!** 