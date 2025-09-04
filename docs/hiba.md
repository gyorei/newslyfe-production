# =� Mobil Loading Probl�ma Diagnosztika

## Probl�ma
Mobilon a www.newslyfe.com bet�lt�sekor a loading spinner v�gtelen�l forog, nem j�n be az alkalmaz�s.

## Lehets�ges okok

### 1. = Mixed Content Hiba
- **Probl�ma**: HTTPS (newslyfe.com) � HTTP API (91.98.134.222:3002) 
- **B�ng�szQ blokkolja**: Mixed Content Policy miatt
- **Megold�s**: HTTPS backend vagy proxy be�ll�t�s

### 2. < CORS Probl�ma
- **ALLOWED_ORIGINS**: `https://newslyfe.com,https://www.newslyfe.com`
- **Mobilon m�s User-Agent**: Lehet hogy nem engedi �t

### 3. =� Network Timeout
- **useServerHealth**: `waitForServer(30, 1000)` - 30 sec timeout
- **Mobilon lassabb**: Lehet hogy nem el�g az 1 sec intervallum

### 4. =' Environment Variable
- **VITE_API_URL**: `http://91.98.134.222:3002`
- **Build-time**: Lehet hogy nem �rv�nyes�l mobilon

## Javasolt megold�sok

### Azonnali jav�t�s: Timeout n�vel�se
```typescript
// useServerHealth.ts
const isAvailable = await apiClient.waitForServer(60, 2000); // 60s, 2s interval
```

### Hossz� t�v�: HTTPS backend
```nginx
# nginx SSL proxy a 3002-es portra
location /api/ {
  proxy_pass http://localhost:3002/api/;
}
```

### Debug m�d
```typescript
// localStorage tesztel�shez
localStorage.setItem('debug-api', 'true');
```

## TesztelendQ l�p�sek

1.  SplashScreen mobil optimaliz�l�s - K�SZ
2. = Timeout n�vel�se useServerHealth-ben  
3. = Console hiba�zenetek ellenQrz�se mobilon
4. < Network tab vizsg�lata (DevTools)
5. = HTTPS API proxy be�ll�t�sa

## St�tusz
- [x] Mobil splash optimaliz�lva
- [ ] Loading timeout jav�t�s
- [ ] Mixed content megold�s
- [ ] Nginx API proxy