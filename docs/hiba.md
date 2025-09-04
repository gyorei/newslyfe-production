# =ñ Mobil Loading Probléma Diagnosztika

## Probléma
Mobilon a www.newslyfe.com betöltésekor a loading spinner végtelenül forog, nem jön be az alkalmazás.

## Lehetséges okok

### 1. = Mixed Content Hiba
- **Probléma**: HTTPS (newslyfe.com) ’ HTTP API (91.98.134.222:3002) 
- **BöngészQ blokkolja**: Mixed Content Policy miatt
- **Megoldás**: HTTPS backend vagy proxy beállítás

### 2. < CORS Probléma
- **ALLOWED_ORIGINS**: `https://newslyfe.com,https://www.newslyfe.com`
- **Mobilon más User-Agent**: Lehet hogy nem engedi át

### 3. =ö Network Timeout
- **useServerHealth**: `waitForServer(30, 1000)` - 30 sec timeout
- **Mobilon lassabb**: Lehet hogy nem elég az 1 sec intervallum

### 4. =' Environment Variable
- **VITE_API_URL**: `http://91.98.134.222:3002`
- **Build-time**: Lehet hogy nem érvényesül mobilon

## Javasolt megoldások

### Azonnali javítás: Timeout növelése
```typescript
// useServerHealth.ts
const isAvailable = await apiClient.waitForServer(60, 2000); // 60s, 2s interval
```

### Hosszú távú: HTTPS backend
```nginx
# nginx SSL proxy a 3002-es portra
location /api/ {
  proxy_pass http://localhost:3002/api/;
}
```

### Debug mód
```typescript
// localStorage teszteléshez
localStorage.setItem('debug-api', 'true');
```

## TesztelendQ lépések

1.  SplashScreen mobil optimalizálás - KÉSZ
2. = Timeout növelése useServerHealth-ben  
3. = Console hibaüzenetek ellenQrzése mobilon
4. < Network tab vizsgálata (DevTools)
5. = HTTPS API proxy beállítása

## Státusz
- [x] Mobil splash optimalizálva
- [ ] Loading timeout javítás
- [ ] Mixed content megoldás
- [ ] Nginx API proxy