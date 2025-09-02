# Server Modul

## A Server Modul Szerepe

A Server modul kizárólag az alkalmazás szerverének életciklusáért felel. Ez a réteg **nem** tartalmaz üzleti logikát, API végpontok megvalósítását vagy adatfeldolgozást. Ehelyett csak a következő felelősségei vannak:

1. Az Express alkalmazás indítása
2. Az adatbázis kapcsolat kezelése
3. A szerver biztonságos leállításának biztosítása
4. Környezeti beállítások kezelése

## Fő Komponensek

### 1. `server.ts` - A Szerver Életciklus Kezelése

- HTTP szerver indítása (`app.listen()`)
- Sikeres indulás naplózása
- Rendszerjelzések (SIGINT/SIGTERM) kezelése
- Adatbázis és egyéb erőforrások tiszta lezárása leállításkor

### 2. `app.ts` - Az Express Alkalmazás Konfigurálása

Ez a fájl definiálja, hogy "ez az én alkalmazásom, így működik". Fő felelősségei:

- Middleware-k hierarchikus beállítása:
  - Biztonsági middleware-k (helmet, CORS stb.)
  - Teljesítmény middleware-k (compression)
  - Kérés/válasz formázás (body-parser, json stb.)
  - Rate limiting (DoS védelem)
  - Naplózási middleware-k
- Útvonal regisztrálás:
  - API végpontok bekötése
  - Statikus fájlok kiszolgálása (ha van)
- Hibakezelés konfigurálása:
  - 404 kezelő middleware
  - Központi hibakezelő middleware

## Helyes Használat

### Mit Tegyünk a Szerver Modulban

✅ Szerver indítás és leállítás logikája
✅ A HTTP szerver paramétereinek beállítása
✅ Jelzéskezelés a tiszta leállításhoz
✅ Környezeti beállítások olvasása és beállítása
✅ Express alkalmazás alapvető konfigurálása
✅ Adatbázis kapcsolatok létrehozása és kezelése

### Mit Ne Tegyünk a Szerver Modulban

❌ API végpontok implementálása (ezek az `/api` mappába tartoznak)
❌ RSS vagy más adatforrások feldolgozása (ez az API réteg feladata)
❌ Üzleti logika (ez a services rétegbe tartozik)
❌ Adatfeldolgozás és transzformáció (ez az API/controllers és services felelőssége)
❌ Adatbázis sémák definiálása (ez külön adatréteg felelőssége)

## Példa a Szerver Indítására

```typescript
import { startServer } from './server';
import { logger } from './utils/logger';

// A szerver indítása
startServer()
  .then(() => {
    logger.info('Szerver sikeresen elindítva');
  })
  .catch((error) => {
    logger.error('Hiba a szerver indítása során:', error);
    process.exit(1);
  });
```

## Alkalmazás Architektúra
