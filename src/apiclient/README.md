# API Kliens Fejlesztési Javaslatok Összefoglalása

## 1. Egységes Hibakezelés

- Központi `ApiError` osztály létrehozása
- Hibakódok és üzenetek egységesítése
- Strukturált hibajelentések
- Hibakezelő middleware beépítése

## 2. Token Kezelés Biztonságossá Tétele

- `localStorage` helyett `HttpOnly cookie` használata
- Token lejárati idő kezelése
- Refresh token mechanizmus bevezetése
- Token rotáció implementálása

## 3. Retry (Újrapróbálkozási) Logika

- Automatikus újrapróbálkozás hibák esetén
- Exponenciális visszalépés (exponential backoff)
- Maximális próbálkozások számának beállítása
- Csak meghatározott hibakódok esetén újrapróbálkozás

## 4. Rate Limiting

- Kérések számának korlátozása
- Időablak alapú korlátozás
- Különböző limitek különböző végpontokra
- Token bucket algoritmus implementálása

## ========================================
## 🎥 VIDEO API DOKUMENTÁCIÓ - ÚJ VIDEÓ API!
## ========================================
## Ez CSAK videó híreket ad vissza!
## NEM keverjük a sima hírekkel!

### Video News Endpoint
- **URL**: `GET /api/video/news`
- **Leírás**: YouTube videó hírek lekérése a backend aggregatorból
- **Válasz formátum**:
```json
{
  "success": true,
  "count": 25,
  "videos": [
    {
      "id": "yt:ABC123",
      "videoId": "ABC123",
      "title": "Breaking News: Latest Updates",
      "link": "https://www.youtube.com/watch?v=ABC123",
      "thumbnail": "https://img.youtube.com/vi/ABC123/hqdefault.jpg",
      "description": "Latest news updates from around the world...",
      "published": "2024-01-15T10:30:00Z",
      "views": 15000,
      "author": "BBC News",
      "type": "youtube",
      "channelId": "UC16niRr50-MSBwiO3YDb3RA",
      "channelName": "BBC News"
    }
  ]
}
```

### Video API Kliens Metódus
- **Metódus**: `apiClient.getVideoNews()`
- **Típus**: `Promise<VideoNewsResponse>`
- **Használat**: Frontend videó komponensekben a videó hírek lekéréséhez

### Video Típusok
```typescript
interface YouTubeVideo {
  id: string;
  videoId: string;
  title: string;
  link: string;
  thumbnail: string;
  description: string;
  published: string;
  views?: number;
  author: string;
  type: 'youtube';
  channelId: string;
  channelName: string;
}

interface VideoNewsResponse {
  success: boolean;
  count: number;
  videos: YouTubeVideo[];
}
```

### Video API Hibakezelés
- **500**: Szerver hiba a videó aggregatorban
- **Timeout**: 10 másodperc a YouTube RSS feed lekérésére
- **Fallback**: Üres tömb hiba esetén

## Szerver Indítási Módok

- `npm run api` - Hagyományos JavaScript szerver indítása (server.cjs)
- `npm run api:ts` - TypeScript szerver indítása (server.ts)
- `npm run build:api` - TypeScript szerver kompilálása a `dist` mappába
- `npm run start` - Teljes stack indítása a JavaScript szerverrel
- `npm run start:ts` - Teljes stack indítása a TypeScript szerverrel

## További Fejlesztési Lehetőségek

- Telemetria bevezetése
- API verziókezelés
- Request/Response interceptorok
- Circuit breaker minta implementálása

## ÚJ: Forrás szerinti hírszűrés támogatása

### /api/local/news?sourceId=cnn-com
- Csak a megadott forrás (pl. CNN) híreit adja vissza.
- Ha nincs megadva sourceId, minden hírt visszaad.

### /api/country/:country/news?sourceId=cnn-com
- Csak a megadott forrás (pl. CNN) híreit adja vissza az adott országból.
- Ha nincs megadva sourceId, minden hírt visszaad az országból.

#### Példa:
```
GET /api/local/news?sourceId=cnn-com
GET /api/country/US/news?sourceId=cnn-com
```

- A sourceId paraméter opcionális, string típusú.
- Több forrás támogatása: jelenleg csak egy forrás, de bővíthető vesszővel elválasztott listára.
