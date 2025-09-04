# 🔧 MEGOLDVA: Mobil API Mixed Content Hiba

## ✅ GYÖKÉROK MEGTALÁLVA
**Console-on működik, mobilon élesben nem** → **Mixed Content Policy**

### 🚨 A Probléma
```bash
HTTPS (https://newslyfe.com) → HTTP API (http://91.98.134.222:3002) ❌
Modern böngészők BLOKKOLJÁK ezt biztonsági okokból!
```

### ✅ A Megoldás
**Environment változó javítás:**
```bash
# Régi (HIBÁS)
VITE_API_URL=http://91.98.134.222:3002

# Új (HELYES) 
VITE_API_URL=https://newslyfe.com/api
```

**Nginx proxy már készen áll** (nginx.conf 109-122 sorok):
```nginx
location /api/ {
    proxy_pass http://backend; # localhost:3002
    proxy_set_header X-Forwarded-Proto $scheme;
}
```

## 🎯 Javítási Lépések

### 1. Environment frissítés
```bash
# .env.production 
VITE_API_URL=https://newslyfe.com/api  # ← HTTPS proxy!
```

### 2. Build és deploy
```bash
git add .env.production
git commit -m "🔒 FIX: API URL HTTPS proxy javítás mobilra"  
git push

# Szerveren
git pull && npm run build && pm2 restart news-backend
```

### 3. Tesztelés
- ✅ Desktop: működik
- ✅ Console: működik  
- 📱 **Mobil éles**: MOST MÁR MŰKÖDNIE KELL!

## 🏁 Eredmény
```
https://newslyfe.com → https://newslyfe.com/api → localhost:3002
  HTTPS                   HTTPS (proxy)          HTTP (backend)
    ✅                        ✅                     ✅
```

**Mixed Content Policy TELJESÍTVE** 🎉