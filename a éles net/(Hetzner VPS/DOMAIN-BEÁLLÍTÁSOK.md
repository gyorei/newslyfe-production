# 🌍 Domain Beállítások Útmutató

## 📋 Tartalomjegyzék

1. [Domain Regisztrálás](#domain-regisztrálás)
2. [DNS Rekordok Beállítása](#dns-rekordok-beállítása)
3. [Hetzner Cloud DNS](#hetzner-cloud-dns)
4. [Külső DNS Szolgáltatók](#külső-dns-szolgáltatók)
5. [DNS Propagáció](#dns-propagáció)
6. [Tesztelés](#tesztelés)
7. [Hibaelhárítás](#hibaelhárítás)

---

## 🏷️ Domain Regisztrálás

### Ajánlott Domain Szolgáltatók:
- **Hetzner Domain**: https://www.hetzner.com/domain
- **Namecheap**: https://www.namecheap.com/
- **GoDaddy**: https://www.godaddy.com/
- **Google Domains**: https://domains.google/

### Domain Választás Tippek:
- **Rövid és emlékezetes** (pl. `news.hu`, `hírek.hu`)
- **Könnyen írható** (kerüld a számokat, kötőjeleket)
- **Keresőbarát** (tartalmazzon kulcsszavakat)
- **Nemzetközi** (`.com`, `.net`) vagy **helyi** (`.hu`, `.de`)

---

## 🔧 DNS Rekordok Beállítása

### Alapvető DNS Rekordok

#### 1. A Rekord (IPv4)
```
A     @     YOUR_SERVER_IP
A     www   YOUR_SERVER_IP
```

**Példa:**
```
A     @     116.203.123.456
A     www   116.203.123.456
```

#### 2. AAAA Rekord (IPv6) - Opcionális
```
AAAA  @     YOUR_IPV6_ADDRESS
AAAA  www   YOUR_IPV6_ADDRESS
```

#### 3. CNAME Rekord - Opcionális
```
CNAME api   sajatdomain.hu
CNAME mail sajatdomain.hu
```

### Speciális Rekordok

#### 4. MX Rekord (Email) - Ha van email szolgáltatás
```
MX    @     10 mail.sajatdomain.hu
```

#### 5. TXT Rekord (SPF, DKIM) - Email biztonság
```
TXT   @     "v=spf1 a mx ~all"
```

#### 6. CAA Rekord - SSL Tanúsítvány Korlátozás
```
CAA   @     0 issue "letsencrypt.org"
```

---

## ☁️ Hetzner Cloud DNS

### 1. Hetzner Cloud Console Beállítása
1. Jelentkezz be a [Hetzner Cloud Console](https://console.hetzner.cloud/)-ba
2. Menj a **"Networks"** menübe
3. Kattints **"Add Network"**
4. Válaszd ki a **"DNS"** opciót

### 2. DNS Zone Létrehozása
```bash
# DNS zone létrehozása
# Hetzner Cloud Console-ban:
# 1. Networks > DNS Zones
# 2. "Add Zone"
# 3. Domain: sajatdomain.hu
# 4. Primary Nameserver: ns1.hetzner.com
```

### 3. DNS Rekordok Beállítása Hetzneren
```bash
# A rekordok
Type: A
Name: @
Value: YOUR_SERVER_IP
TTL: 300

Type: A
Name: www
Value: YOUR_SERVER_IP
TTL: 300
```

### 4. Nameserver Beállítások
A domain regisztrálódnál állítsd be:
```
ns1.hetzner.com
ns2.hetzner.com
ns3.hetzner.com
```

---

## 🌐 Külső DNS Szolgáltatók

### Cloudflare DNS
1. **Regisztráció**: https://dash.cloudflare.com/
2. **Domain hozzáadása**
3. **DNS rekordok beállítása**:
   ```
   A     @     YOUR_SERVER_IP     Proxy: DNS only
   A     www   YOUR_SERVER_IP     Proxy: DNS only
   ```
4. **Nameserver beállítás**:
   ```
   aida.ns.cloudflare.com
   rick.ns.cloudflare.com
   ```

### Google Cloud DNS
1. **Google Cloud Console**: https://console.cloud.google.com/
2. **DNS API engedélyezése**
3. **Zone létrehozása**:
   ```bash
   gcloud dns managed-zones create news-zone \
       --dns-name="sajatdomain.hu." \
       --description="News app DNS zone"
   ```
4. **Rekordok hozzáadása**:
   ```bash
   gcloud dns record-sets transaction start --zone=news-zone
   gcloud dns record-sets transaction add YOUR_SERVER_IP \
       --name="sajatdomain.hu." --ttl=300 --type=A --zone=news-zone
   gcloud dns record-sets transaction execute --zone=news-zone
   ```

### Route53 (AWS)
1. **AWS Console**: https://console.aws.amazon.com/
2. **Route53 > Hosted zones**
3. **Create hosted zone**:
   ```
   Domain name: sajatdomain.hu
   Type: Public hosted zone
   ```
4. **Rekordok létrehozása**:
   ```
   A     @     YOUR_SERVER_IP
   A     www   YOUR_SERVER_IP
   ```

---

## ⏱️ DNS Propagáció

### Propagáció Időtartam
- **Lokális**: 5-15 perc
- **Globális**: 24-48 óra
- **Teljes**: akár 72 óra

### Propagáció Ellenőrzése

#### 1. Online Eszközök
```bash
# DNS propagáció ellenőrzése
https://www.whatsmydns.net/
https://dnschecker.org/
https://toolbox.googleapps.com/apps/dig/
```

#### 2. Parancssor Eszközök
```bash
# nslookup
nslookup sajatdomain.hu

# dig
dig sajatdomain.hu

# host
host sajatdomain.hu

# whois
whois sajatdomain.hu
```

#### 3. Több Nameserver Tesztelése
```bash
# Google DNS
dig @8.8.8.8 sajatdomain.hu

# Cloudflare DNS
dig @1.1.1.1 sajatdomain.hu

# OpenDNS
dig @208.67.222.222 sajatdomain.hu
```

### Propagáció Gyorsítása
```bash
# DNS cache törlése (Windows)
ipconfig /flushdns

# DNS cache törlése (Linux)
sudo systemctl restart systemd-resolved

# DNS cache törlése (macOS)
sudo dscacheutil -flushcache
```

---

## ✅ Tesztelés

### 1. DNS Rekordok Tesztelése
```bash
# A rekord ellenőrzése
dig A sajatdomain.hu

# CNAME rekord ellenőrzése
dig CNAME www.sajatdomain.hu

# MX rekord ellenőrzése
dig MX sajatdomain.hu

# TXT rekord ellenőrzése
dig TXT sajatdomain.hu
```

### 2. Weboldal Elérhetőség
```bash
# HTTP tesztelés
curl -I http://sajatdomain.hu

# HTTPS tesztelés (SSL tanúsítvány után)
curl -I https://sajatdomain.hu

# Ping tesztelés
ping sajatdomain.hu
```

### 3. Port Tesztelés
```bash
# Port 80 (HTTP)
telnet sajatdomain.hu 80

# Port 443 (HTTPS)
telnet sajatdomain.hu 443

# nmap port scan
nmap -p 80,443 sajatdomain.hu
```

### 4. SSL Tanúsítvány Tesztelés
```bash
# SSL tanúsítvány ellenőrzése
openssl s_client -connect sajatdomain.hu:443 -servername sajatdomain.hu

# Tanúsítvány részletek
echo | openssl s_client -servername sajatdomain.hu -connect sajatdomain.hu:443 2>/dev/null | openssl x509 -noout -dates
```

---

## 🔧 Hibaelhárítás

### Gyakori DNS Hibák

#### 1. "Domain Not Found" Hiba
```bash
# DNS rekordok ellenőrzése
dig sajatdomain.hu

# Nameserver beállítások
dig NS sajatdomain.hu

# Propagáció várakozás
# Várj 24-48 órát
```

#### 2. "Connection Refused" Hiba
```bash
# Szerver futás ellenőrzése
ssh root@YOUR_SERVER_IP

# Nginx futás ellenőrzése
sudo systemctl status nginx

# Tűzfal beállítások
sudo ufw status
```

#### 3. "SSL Certificate Error" Hiba
```bash
# SSL tanúsítvány ellenőrzése
sudo certbot certificates

# Tanúsítvány újragenerálása
sudo certbot --nginx -d sajatdomain.hu --force-renewal
```

#### 4. "502 Bad Gateway" Hiba
```bash
# Backend futás ellenőrzése
pm2 status

# PM2 logok
pm2 logs news-backend

# Port ellenőrzés
sudo netstat -tlnp | grep :3002
```

### DNS Debugging

#### 1. Részletes DNS Információk
```bash
# Teljes DNS lekérdezés
dig +trace sajatdomain.hu

# Rekord típusok listázása
dig ANY sajatdomain.hu

# DNS cache ellenőrzése
dig +short sajatdomain.hu
```

#### 2. Nameserver Tesztelés
```bash
# Elsődleges nameserver
dig @ns1.hetzner.com sajatdomain.hu

# Másodlagos nameserver
dig @ns2.hetzner.com sajatdomain.hu

# Harmadlagos nameserver
dig @ns3.hetzner.com sajatdomain.hu
```

#### 3. TTL Értékek
```bash
# TTL ellenőrzése
dig +short sajatdomain.hu

# TTL módosítása (ha szükséges)
# DNS szolgáltatódnál állítsd be: TTL = 300 (5 perc)
```

---

## 📊 DNS Monitoring

### 1. Automatikus DNS Tesztelés
```bash
# Monitoring script létrehozása
sudo nano /usr/local/bin/dns-monitor.sh
```

**Monitoring script:**
```bash
#!/bin/bash
DOMAIN="sajatdomain.hu"
SERVER_IP="YOUR_SERVER_IP"

# DNS ellenőrzés
RESOLVED_IP=$(dig +short $DOMAIN)

if [ "$RESOLVED_IP" = "$SERVER_IP" ]; then
    echo "DNS OK: $DOMAIN -> $RESOLVED_IP"
else
    echo "DNS ERROR: $DOMAIN -> $RESOLVED_IP (expected: $SERVER_IP)"
    # Email küldés vagy alert
fi
```

### 2. Cron Job Beállítása
```bash
# Cron job hozzáadása
sudo crontab -e

# Add: */30 * * * * /usr/local/bin/dns-monitor.sh
```

### 3. Online Monitoring Szolgáltatások
- **UptimeRobot**: https://uptimerobot.com/
- **Pingdom**: https://tools.pingdom.com/
- **StatusCake**: https://www.statuscake.com/

---

## 🎯 Domain Optimalizálás

### 1. SEO Optimalizálás
```bash
# robots.txt létrehozása
echo "User-agent: *
Allow: /
Sitemap: https://sajatdomain.hu/sitemap.xml" > /var/www/news/build/robots.txt
```

### 2. Sitemap Generálás
```bash
# XML sitemap létrehozása
# (ezt a backend-ben kell implementálni)
```

### 3. Meta Tag-ek
```html
<!-- index.html-ben -->
<meta name="description" content="Hírek és aktuális információk">
<meta name="keywords" content="hírek, aktuális, információk">
<meta property="og:title" content="News Alkalmazás">
<meta property="og:description" content="Hírek és aktuális információk">
```

---

## 📞 Támogatás

### Hasznos Parancsok
```bash
# DNS információk
whois sajatdomain.hu

# DNS propagáció
dig +trace sajatdomain.hu

# Weboldal tesztelés
curl -I https://sajatdomain.hu

# SSL tanúsítvány
openssl s_client -connect sajatdomain.hu:443
```

### Dokumentáció
- [Hetzner DNS Dokumentáció](https://docs.hetzner.com/general/others/dns-converter/)
- [Cloudflare DNS Dokumentáció](https://developers.cloudflare.com/dns/)
- [Google Cloud DNS Dokumentáció](https://cloud.google.com/dns/docs)

---

**🌍 A domain beállítások most már készen állnak a Hetzner VPS-re való költözésre!** 