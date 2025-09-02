# LocalProxy Modul Tervezése és Frontend-Backend Integrációs Stratégia

## 1. Modul Áttekintés

A `LocalProxy` modul a felhasználó helyével kapcsolatos hybrid API végpontokat implementálja. Ez a réteg két fő komponensből áll:

1. **LocalProxy**: Express router, amely kezeli az API végpontokat
2. **LocalService**: Üzleti logikát tartalmazó szolgáltatásosztály

### Felelősségi kör

- Felhasználó helyzetének azonosítása (GeoIP alapján)
- Helyi hírek lekérése fontossági szintek szerint
- Felhasználói preferenciák kezelése
- Hatékony cache-elés implementálása

## 2. Adatfolyam és Kapcsolatok

```
┌─────────────┐     ┌──────────────┐     ┌─────────────┐
│  Frontend   │◄────┤  LocalProxy  │◄────┤ LocalService│
│ Components  │     │   (Router)   │     │  (Service)  │
└─────────────┘     └──────────────┘     └──────┬──────┘
                                               │
                                         ┌─────▼──────┐
                                         │PostgreSQL  │
                                         │  Manager   │
                                         └────────────┘
```

## 3. Végpontok Specifikációja

### Megvalósítandó Végpontok

1. **GET /api/local/news**
   - **Leírás**: Helyi hírek lekérése a felhasználó helyére vonatkozóan
   - **Paraméterek**:
     - `importanceLevel`: Fontossági szint (1-3), alapértelmezett: 1
     - `limit`: Válasz elemszám korlátozása, alapértelmezett: 20
     - `offset`: Eltolás lapozáshoz, alapértelmezett: 0
     - `country`: Opcionális országkód felülbíráláshoz
   - **Válasz**: Hírek fontossági szint szerint rendezve, metaadatokkal
   - **Cache**: ETag-gel és 5 perces Cache-Control headerekkel

2. **GET /api/local/location**
   - **Leírás**: Felhasználó helyinformációinak lekérése
   - **Paraméterek**: -
   - **Válasz**: Geolokációs adatok (ország, kontinens, koordináták)
   - **Cache**: 30 perces Cache-Control

3. **GET /api/local/preferences**
   - **Leírás**: Felhasználói beállítások lekérése
   - **Paraméterek**: Opcionális `deviceId`
   - **Válasz**: Felhasználó-specifikus beállítások
   - **Cache**: 15 perces Cache-Control, egyedi ETag per eszköz

4. **GET /api/local/has-more-sources**
   - **Leírás**: Ellenőrzi, van-e több forrás a következő fontossági szinten
   - **Paraméterek**:
     - `importanceLevel`: Jelenlegi fontossági szint
     - `country`: Ország, amelyre vonatkozik a lekérdezés
   - **Válasz**: Van-e további adat, következő fontossági szint
   - **Cache**: 5 perces Cache-Control

## ÚJ: Forrás szerinti hírszűrés támogatása

### /api/local/news?sourceId=cnn-com
- Csak a megadott forrás (pl. CNN) híreit adja vissza.
- Ha nincs megadva sourceId, minden hírt visszaad.

#### Példa:
```
GET /api/local/news?sourceId=cnn-com
```

- A sourceId paraméter opcionális, string típusú.
- Több forrás támogatása: jelenleg csak egy forrás, de bővíthető vesszővel elválasztott listára.

## 4. LocalService és LocalProxy közti munkamegosztás

### LocalProxy felelőssége

- HTTP kérések fogadása és validálása
- Felhasználói input feldolgozása
- Jogosultság ellenőrzés (ha lesz ilyen)
- Cache headerek beállítása
- HTTP státuszkódok kezelése
- Válaszformátum kialakítása

### LocalService felelőssége

- Üzleti logika implementálása
- Adatbázis lekérdezések
- GeoIP pozíció meghatározás
- Cache stratégia meghatározása
- Fontossági szintek kezelése
- Hibaállapotok definiálása

## 5. Cache stratégia

A modul három szintű cache stratégiát használ:

1. **HTTP szintű cache** - ETag és Cache-Control headerekkel
   - `FAST`: 30 perc (hírek, gyorsan változó tartalmak)
   - `MEDIUM`: 30 perc (preferenciák, változó tartalmak)
   - `SLOW`: 30 perc (ország listák, ritkán változó tartalmak)

2. **Szerver oldali cache**
   - Hash-alapú cache kulcsok
   - Idő alapú invalidáció
   - Szűrési paramétereket figyelembe vevő kulcsok

3. **Adatbázis query optimalizáció**
   - Prepared statement-ek használata
   - Indexek a gyakran használt mezőkön
   - EXPLAIN analízis a komplex lekérdezéseken

## 6. Hibakezelés

Minden hibát következetesen a központi `AppError` osztállyal kezelünk:

```typescript
// Példa hibadobásra
throw new AppError('Hiba üzenet', 404, true);
```

Hibakódok:

- `400`: Érvénytelen felhasználói input
- `404`: Nem található erőforrás
- `500`: Szerver oldali hiba

Minden hibánál naplózunk:

- Hibakategória
- Részletes hibaüzenet
- Stack trace (csak fejlesztési környezetben)

## 7. Implementációs terv

1. **Fázis: Alapstruktúra**
   - ✅ LocalProxy router létrehozása
   - ✅ LocalService osztály létrehozása
   - ✅ Végpontok alapvető implementációja

2. **Fázis: Cache rendszer**
   - ⬜️ ETag generálás implementálása
   - ⬜️ Feltételes GET kérések kezelése
   - ⬜️ Szerver oldali memória cache hozzáadása

3. **Fázis: Teljesítmény**
   - ⬜️ Query optimalizációk
   - ⬜️ Batch feldolgozás nagy adatmennyiségekre
   - ⬜️ Rate limiting védelem

4. **Fázis: GeoIP integráció**
   - ⬜️ Külső GeoIP szolgáltatás integrációja
   - ⬜️ IP alapú helyfelismerés
   - ⬜️ Fallback mechanizmusok implementálása

5. **Fázis: RSS integráció**
   - ⬜️ RSS feldolgozó szolgáltatás integrálása
   - ⬜️ Hibatűrő feed feldolgozás
   - ⬜️ Képek és multimédia elemek feldolgozása

## 8. Frontendből Áthozható Fájlok és Adaptációs Stratégia

### Áthozható Típus Definíciók

1. **Lokáció típusok**:
   - **Forrás**: `src/data/local/location/types.ts`
   - **Backend cél**: `src/backend/api/models/Location.ts`
   - **Adaptációs igény**: A browser-specifikus részeket (pl. geolocation API) el kell távolítani

2. **Hírek adatstruktúrák**:
   - **Forrás**: `src/types/index.ts` (NewsItem interfész)
   - **Backend cél**: `src/backend/api/models/NewsItem.ts`
   - **Adaptációs igény**: Minimális, a típus definíciók kompatibilisek Node.js környezetben is

### Részlegesen Áthozható Függvények

1. **Dátum formázás**:
   - **Forrás**: `src/components/Card/cardService.ts` (formatRelativeTime, formatDate)
   - **Backend cél**: `src/backend/api/utils/dateUtils.ts`
   - **Adaptációs igény**: A függvények logikája újrahasználható, de az implementációt Node.js környezethez kell igazítani

2. **Cache kulcs generálás**:
   - **Forrás**: `src/utils/cache/cacheUtils.ts`
   - **Backend cél**: `src/backend/api/utils/cacheUtils.ts`
   - **Adaptációs igény**: Minimális, a hash generáló függvények kompatibilisek Node.js-sel

### Konfigurációs Értékek

1. **RSS fontossági szintek**:
   - **Forrás**: `src/data/local/config/localRssConfig.ts`
   - **Backend cél**: `src/backend/api/config/rssConfig.ts`
   - **Adaptációs igény**: A konstansok áthozhatók, de a környezet-specifikus beállításokat módosítani kell

### NEM Áthozható Frontend-specifikus elemek

1. ❌ React komponensek (Card.tsx, Panel.tsx, stb.)
2. ❌ React hook-ok (useLocation.ts, stb.)
3. ❌ Browser API-t használó kód (navigator.geolocation)
4. ❌ Frontend state management (localStorage, IndexedDB)



## 10. Implementációs Stratégia

### 1. Backend Interface Egyezés a Frontend Elvárásokkal

A News és Source objektumok szerkezetét a backend API-nak a frontend által elvárt formában kell biztosítania:

```typescript
// A backend által visszaadandó News objektum struktúra
interface NewsItemResponse {
  id: string; // Egyedi azonosító
  title: string; // Cím
  description: string; // Leírás
  imageUrl?: string; // Kép URL (ha van)
  source: string; // Forrás neve
  sourceId: string; // Forrás azonosító
  date: string; // Formázott dátum (vagy timestamp)
  url: string; // Eredeti hírcikk URL
  country?: string; // Ország
  continent?: string; // Kontinens
  sourceStatus: 'valid' | 'scraped' | 'unavailable'; // Forrás állapot
  hasRssFeed: boolean; // Van-e eredeti RSS feed
}
```

### 2. Integrációs Lépések

1. **Típus definíciók átvitele**:
   - Másoljuk át és adaptáljuk a típus definíciókat
   - Kiegészítjük a backend-specifikus mezőkkel

2. **Utility függvények adaptálása**:
   - Hozzunk létre utility modulokat a backend számára
   - Másoljuk át a kompatibilis függvényeket
   - Node.js környezetre optimalizáljuk

3. **Proxy implementációk létrehozása**:
   - Minden API route kategóriához készítsünk Express router modult
   - Szolgáltatási réteg implementálása (Service osztályok)
   - Adatbázis lekérdezések kidolgozása

4. **RSS és Scrape funkciók fejlesztése**:
   - Node.js kompatibilis RSS parser implementálása
   - Cheerio vagy hasonló könyvtárral HTML scraping funkciók
   - Hibakezelési stratégia az elérhetetlenség esetére

## 11. LocalProxy Implementáció Feladatai

1. ✅ LocalProxy router fájl létrehozása
2. ✅ LocalService osztály elkészítése
3. ⬜ GeoIP funkció implementálása
4. ⬜ Frontend kompabilitis validálása
5. ⬜ Unit tesztek írása
