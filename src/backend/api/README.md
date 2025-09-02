# Projekt áttekintése a dependencies.json alapján

Látom a dependencies.json tartalmat, amely bemutatja a projekt komponensei közötti függőségeket. Az alábbiakban elemzem a rendszer működését és architektúráját.

## Alkalmazás felépítése

Ez egy hírolvasó alkalmazás, amely több kulcsfontosságú komponensből áll:

1. **Frontend komponensek** (`components/` mappa):
   - Kártya nézetek hírek megjelenítéséhez
   - Kategória kezelők
   - Oldalsáv kontinensek, országok szerint
   - Füles (tab) rendszer

2. **Adatkezelés** (`data/` mappa):
   - RSS feedek kezelése és feldolgozása
   - Kontinens/ország adatok kezelése
   - Lokációs szolgáltatások

3. **API kommunikáció** (`apiclient/` mappa):
   - apiClient.ts - API hívások kezelése
   - endpoints.ts - végpontok definíciója

4. **Tárolás** (`storage/` mappa):
   - IndexedDB szolgáltatás
   - Szinkronizáció
   - Storage típusdefiníciók

5. **Segédeszközök** (`utils/` mappa):
   - Cache kezelés
   - Naplózás
   - Hibakeresés

## Backend kapcsolati pontok

Az API rétegnek támogatnia kell:

1. **Hírek kezelése**:
   - Hírek lekérése kontinens/ország/forrás szerint
   - Legfrissebb hírek lekérése
   - RSS feedek feldolgozása

2. **Források kezelése**:
   - Híroldalak lekérése kontinens/ország szerint
   - Egyedi híroldal adatainak kezelése

3. **Lokációs adatok**:
   - Országok és kontinensek listája
   - Felhasználó helyének kezelése

4. **Monitoring**:
   - RSS feedek teljesítményfigyelése
   - Hibajelentések

## Következő lépések

Ahhoz, hogy teljesen megértsük a rendszert és létrehozzuk az API modult, a következő fájlokat kellene részletesebben átnéznünk:

1. `apiclient/apiClient.ts` - API kérések kezelése
2. `apiclient/endpoints.ts` - Végpontok definíciói
3. `data/continent/rssService.ts` - RSS feldolgozás az rss feldolgozás a itt van: src\backend\api\routes // frontendben nem lesz rss feldolgozás.
4. `types/index.ts` - Fő típusdefiníciók
5. `data/local/localDataService.ts` - Helyi adatok kezelése

Kérem, küldjön további fájlokat, különösen az API kliens részéből és a típusdefiníciókból, hogy pontosabb képet kapjak a rendszer működéséről és a szükséges API implementációról.

src\backend\api\routes kell létrehozni de még nem tudjuk hogy müködik a többi kód.
................................

# Card komponensek elemzése

A beküldött Card komponensekkel kapcsolatos fájlok átvizsgálása után a következő megállapításokat tehetjük:

## Adatstruktúrák

A hírek frontend megjelenítéséhez a következő adatokat használja a rendszer:

```typescript
// Card.tsx - CardProps interface
interface CardProps {
  id?: string; // Egyedi azonosító
  title: string; // Hírcím
  description?: string; // Leírás/tartalom
  imageUrl?: string; // Kép URL
  source?: string; // Hírforrás neve (pl. "CNN")
  sourceId?: string; // Forrás azonosító (pl. "us-cnn")
  date?: string; // Dátum, formázott
  url?: string; // Eredeti hír URL-je
  category?: string; // Kategória
  country?: string; // Ország
  continent?: string; // Kontinens
  sourceStatus?: 'valid' | 'invalid' | 'scraped' | 'unavailable';
}
```

## RSS feldolgozás és adattranszformáció

A cardService.ts fájlból látható, hogy az alkalmazás:

1. RSS feedekből nyeri a híreket
2. Transzformációt alkalmaz rajtuk a megjelenítéshez
3. Különböző típusú forrásokkal dolgozik (valid RSS, scraped HTML, unavailable)
4. Ország és kontinens információkat társít a hírekhez

## API igények

Az API modulnak a következőket kell biztosítania:

1. **RSS feldolgozás**:
   - Különböző forrásokból RSS adatok lekérése
   - HTML scraping alternatív módszerként
   - Hibakezelés és státuszkövetés

2. **Hírek szolgáltatása**:
   - Kontinens, ország vagy forrás szerinti szűrési lehetőség
   - Rendezés dátum szerint
   - Metaadatok gazdagítása (ország, kontinens információk)

3. **Forráskezelés**:
   - Források listázása
   - Forrás érvényességének ellenőrzése
   - Favicon és egyéb metaadatok szolgáltatása

Az API modul tervezésénél figyelembe kell venni a frontend különböző megjelenítési igényeit (kártya, lista, csoportosított nézet) és a szükséges adatformátumot ezekhez.

Következő lépésként jó lenne megvizsgálni az `apiClient.ts`, `endpoints.ts`, és a index.ts fájlokat, hogy pontos képet kapjunk a jelenlegi API használati mintákról és adatstruktúrákról.
......................

# Content komponensek elemzése

A Content könyvtárban található fájlok (különösen a Panel.tsx és List.tsx) átvizsgálása után pontosabb képet kaptam az API végpontokkal kapcsolatos igényekről.

## Adatfolyam és megjelenítés

A Panel.tsx komponens a hírek fő megjelenítési területe, amely:

1. Betöltési állapotot kezel (`loading` prop)
2. Hibaállapotokat kezel (`error` prop és `onRetry` callback)
3. Adatokat csoportosít és rendez (képes és kép nélküli hírek különválasztása)
4. Forrás-metaadatokat gyűjt és továbbít

```typescript
// Hírek adatstruktúrája a Panel-ben
interface PanelProps {
  title: string;
  newsItems?: NewsItem[]; // Ez a NewsItem típus kulcsfontosságú
  loading?: boolean;
  error?: string | null;
  onRetry?: () => void;
}

// Forrás-metaadatok struktúrája
const extractSources = React.useMemo(() => {
  // ...
  uniqueSources.set(item.sourceId, {
    id: item.sourceId,
    name: item.source,
    domain: item.url ? new URL(item.url).hostname : undefined,
  });
  // ...
}, [newsItems]);
```

## Megfigyelt API igények

Az API végpontok tervezéséhez a következő konkrét igényeket azonosítottam:

1. **Hírek lekérése egyedi azonosítókkal**:
   - Minden hírnek van egy egyedi `id` mezője
   - A frontend az azonosítók segítségével különbözteti meg a híreket

2. **Különböző formátumok támogatása**:
   - Képes hírek (imageUrl)
   - Kép nélküli hírek külön csoportosítva
   - Kiemelt (featured) hírek

3. **Metaadatok dinamikus kezelése**:
   - Források (`source`, `sourceId`)
   - Hírforrás URL-ből domain kinyerése
   - Olvasottsági állapot (`isRead`)

4. **Hibakezelési igények**:
   - Betöltési hibák kezelése
   - Újrapróbálkozási mechanizmus

## Szükséges API végpontok

A frontend komponensek alapján az alábbi API végpontok szükségesek a routes mappában:

1. **Hírek végpontok**:

   ```
   GET /api/news/latest      - Legfrissebb hírek lekérdezése
   GET /api/news/featured    - Kiemelt hírek lekérdezése
   GET /api/news/country/:country - Országkód alapján hírek lekérdezése
   GET /api/news/source/:sourceId - Forrás ID alapján hírek lekérdezése
   GET /api/news/category/:category - Kategória alapján hírek lekérdezése
   ```

2. **Forrás végpontok**:

   ```
   GET /api/sources          - Összes forrás lekérdezése
   GET /api/sources/:id      - Egy konkrét forrás részletes adatai
   GET /api/sources/country/:country - Országkód alapján források lekérdezése
   GET /api/sources/continent/:continent - Kontinens alapján források lekérdezése
   ```

3. **Lokáció végpontok**:

   ```
   GET /api/locations/countries - Országok listája
   GET /api/locations/continents - Kontinensek listája
   ```

4. **Felhasználói interakciók végpontjai**:
   ```
   POST /api/user/read/:newsId - Hír olvasottnak jelölése
   ```

További vizsgálatra van szükség az `apiClient.ts` és `endpoints.ts` fájlokban, hogy megértsük a jelenlegi API kommunikációs mintákat, valamint a `types/index.ts` fájlban, hogy pontosan ismerjük a NewsItem definícióját.

# Content Komponensek API Követelményei

A frontend Content komponensek részletes vizsgálata alapján a következő API követelményeket azonosítottam a proxy rendszerhez:

## 1. Forrás Metaadatok

A PanelHead komponensben látható, hogy a források metaadataihoz automatikusan generálódnak favicont és domain adatok:

```typescript
interface SourceMetadata {
  id: string; // Forrás azonosító
  name: string; // Forrás megjelenítendő neve
  domain?: string; // Domain név (kinyerve URL-ből vagy forrás azonosítóból)
}
```

Az API-nak támogatnia kell a források ilyen formátumban való visszaadását, illetve a Google Favicon API-val való kompatibilitást.

## 2. Betöltési Folyamatok

A Content komponensben látható, hogy komplex betöltési folyamatokat valósít meg:

- **Fontossági szint alapú betöltés**: Az importanceLevel paraméterrel fokozatosan tölti be a különböző fontosságú forrásokból származó híreket
- **Inkrementális betöltés**: A görgetési pozíció figyelésével további hírek betöltése
- **Forrásszintű hibakezelés**: Egyes források hibája esetén sem áll le a teljes betöltés

Az API végpontoknak támogatniuk kell:

- Limit és offset paramétereket
- Fontossági szint szerinti szűrést
- Részleges válaszok kezelését

## 3. Panel és Adat Újrahasznosítás

A Content komponens:

- Tárolja a tabulátorok tartalmát (tabContents)
- Nyilvántartja a görgetési pozíciókat (scrollPositions)
- Megőrzi az állapotot váltások között

Ez azt jelenti, hogy az API-nak támogatnia kell a hatékony cache-elést:

- Megfelelő Cache-Control headerek
- ETag/If-None-Match támogatása
- Timestamp alapú módosítást jelző mezők

## 4. Hibakezelési Elvárások

A Panel komponensben látható hibakezelési minta alapján:

```typescript
// Hibakezelés a Content komponensben
interface ErrorState {
  message: string;
  code?: string;
  retry?: boolean;
}
```

Az API hibái esetén:

- Konzisztens hibaformátum
- Újrapróbálkozási információk
- Informatív hibakódok és üzenetek

## 5. Forrás Browsing Támogatás

A PanelHead komponensben implementált forrás böngésző funkció alapján:

- Források csoportosítására/szűrésére alkalmas végpontok
- Forrás metaadatok hatékony lekérdezése
- Domain-alapú szűrés és csoportosítás

## 6. Teljesítmény Optimalizációk

A Content.css és egyéb UI elemek alapján:

- Képlisták optimalizált betöltése (lazy loading támogatása)
- Különböző képméretek támogatása (thumbnail vs. full)
- Méretezett/optimalizált képek szolgáltatása

Ezeket a követelményeket figyelembe kell venni az API proxy komponenseinek és szolgáltatásainak implementációjakor, különösen a betöltési folyamatok, cache-elés és hibaállapotok kezelésénél.

# Storage és Perzisztencia Követelmények a Backend API-hoz

A frontend storage és perzisztencia rendszer vizsgálata alapján a következő API követelményeket azonosítottam a proxy rendszerhez:

## 1. Szinkronizációs Mechanizmus

A SyncService implementációjából látható, hogy a kliens-szerver szinkronizációt kétirányú adatáramlással kell támogatni:

```typescript
interface SyncRequest {
  lastSyncTimestamp: number;
  deviceId: string;
  readArticles: ReadArticleRequest[];
  saveQueue: SaveQueueItem[];
}

interface SyncResponse {
  timestamp: number;
  changes: SyncChanges | null;
}
```

Az API-nak támogatnia kell:

- Klienstől érkező módosítások fogadását (olvasott cikkek, mentések)
- Szerver oldali változások továbbítását a kliensek felé
- Időbélyeg alapú szinkronizálást a részleges frissítésekhez

## 2. Eszközazonosítás és Felhasználói Környezet

A device.ts alapján az API-nak képesnek kell lennie:

- Eszközspecifikus adattárolásra (`deviceId` használata)
- Kapcsolati minőség figyelembevételére (lassú vagy korlátozott kapcsolat esetén optimalizáció)
- Különböző eszköztámogatási szintekhez való alkalmazkodásra

## 3. Hibakezelési Stratégiák

A logger.ts és az API típusok alapján:

```typescript
interface ErrorResponse {
  code: string;
  message: string;
  details?: ErrorDetails;
}
```

Az API implementációnak biztosítania kell:

- Strukturált hibaüzenetek szabványos formátumban
- Részletes hibainformációk a hibakereséshez
- Környezetfüggő hibakezelést (pl. fejlesztési vs. produkciós környezet)

## 4. Teljesítmény Optimalizáció

A debounce.ts és IndexedDB implementáció alapján:

```typescript
// Szerver oldali megfelelő: kérés korlátozás és batch feldolgozás
export function throttle<T extends AnyFunction>(
  func: T,
  limit: number,
): (...args: Parameters<T>) => void {
  // ...implementation...
}
```

Szükséges API optimalizációk:

- Rate limiting és kérésszabályozás
- Batch műveletek támogatása (több elem egyszerre módosítása)
- Adatok oldalakra bontása és lapozott lekérdezések

## 5. Cache Mechanizmusok

A storageManager.ts és tabContent kezelés alapján:

- Válaszok cache-elése ETag/If-None-Match támogatással
- Idő alapú cache érvénytelenítés
- Tartalom-specifikus cache stratégiák különböző adattípusokhoz

## 6. Felhasználói Beállítások Szinkronizálása

A UserPreferences és lokális tárhely használata alapján:

- Felhasználói preferenciák tárolása és szinkronizálása
- Téma beállítások (sötét/világos mód)
- Megjelenítési beállítások

## 7. Migráció és Verziókezelés

A migrations/helpers.ts alapján:

- API végpontok verziókezelése (v1, v2, stb.)
- Kompatibilitási réteg a régebbi kliensekhez
- Adatstruktúra migrációk támogatása API oldalon is

Ezeket a követelményeket figyelembe kell venni az API implementáció során, hogy a frontend perzisztencia réteggel hatékonyan együttműködhessen, és optimális felhasználói élményt biztosíthasson különböző eszközökön, hálózati körülmények között is.

# Monitoring és Cache Rendszer Követelmények

A frontend monitoring és cache rendszerből a következő API követelményeket azonosítottam a backend implementációhoz:

## 1. Teljesítménymonitorozás

A monitoring.ts alapján látható, hogy a frontend részletesen monitorozza az API hívásokat:

```typescript
// API kérések monitorozása
monitoringData.api = {
  requests: number;   // Összes kérés száma
  failures: number;   // Hibás kérések száma
  totalTime: number;  // Kérések összes ideje
};
```

Az API implementációnak támogatnia kell:

- Részletes teljesítményadatok szolgáltatását minden végponthoz
- Válaszidők mérését és jelentését
- Hibaarányok követését végpontonként
- Erőforrás-felhasználási statisztikákat

## 2. Többszintű Cache Stratégia

A cache rendszer elemzése alapján a következő cache stratégiákat kellene implementálni a backendb:

```typescript
// Cache időzítések típusonként
const CACHE_TIMES = {
  FAST: 5 * 60 * 1000, // 5 perc - gyakran változó tartalmak
  MEDIUM: 15 * 60 * 1000, // 15 perc - általános tartalmak
  SLOW: 30 * 60 * 1000, // 30 perc - ritkán változó tartalmak
  ERROR: 5 * 60 * 1000, // 5 perc - hibás válaszok
  BACKUP: 60 * 60 * 1000, // 1 óra - offline backup
};
```

Az API-nak támogatnia kell:

- Tartalom-típus szerinti cache időzítéseket
- Megfelelő cache header-ek beállítását (ETag, Cache-Control)
- Invalidálási stratégiát a frissített tartalmaknál
- Cache kulcsok generálását paraméterek alapján
- HTTP 304 Not Modified válaszokat ETag alapján

## 3. Strukturált Hibajelentés

A logger rendszer alapján a következő hibakezelési struktúra szükséges:

```typescript
interface ErrorResponse {
  level: string; // ERROR, WARN
  category: string; // API, RSS, NETWORK, stb.
  message: string; // Felhasználóbarát hibaüzenet
  data?: any; // Részletes hibainformációk
  timestamp: string; // ISO formátumú időbélyeg
  code?: string; // Egyedi hibakód
  retryable?: boolean; // Újrapróbálható-e a művelet
}
```

A rendszernek képesnek kell lennie:

- Részletes hibainformációk visszaadására, de csak a szükséges adatokkal
- Hibakategóriák szerinti szűrésre és csoportosításra
- Újrapróbálkozási javaslatok biztosítására
- Naplózásra és monitorozásra minden végponton

## 4. Adaptív Erőforrás-kezelés

Az adaptiveTTL.ts alapján látható, hogy az erőforrás-használat optimalizált:

```typescript
// Adaptív TTL működése
getSuggestedTTL(key: string, baseType: ContentType): number {
  // Használati minták alapján javasol TTL-t
  const avgInterval = this.calculateAverageInterval(patterns);
  return Math.min(
    avgInterval * 1.5,
    DEFAULT_CACHE_OPTIONS.contentTypes[baseType] * 2
  );
}
```

Az API-nak implementálnia kell:

- Erőforrás-használat szabályozását magas terhelés esetén
- Prioritás alapú kiszolgálást
- Rate-limiting stratégiát a túlzott használat ellen
- Batch műveletek támogatását több elem egyidejű lekérdezéséhez

## 5. Teljesítmény-optimalizálási Technikák

A debounce.ts és a monitoring rendszer alapján:

```typescript
// Frontend példa a throttling-ra
export function throttle<T extends AnyFunction>(
  func: T,
  limit: number,
): (...args: Parameters<T>) => void {
  // ...throttling implementáció...
}
```

A backend API-nak alkalmaznia kell:

- Válaszok tömörítését (gzip/brotli)
- Párhuzamos lekérdezések kezelését
- Connection pooling technikákat
- Külső API-k hívásainál circuit breaker mintát

## 6. Esemény Alapú Jelentések

A monitoring rendszer használ egy időszakos jelentési mechanizmust:

```typescript
// Időszakos jelentések
function setupReporting(): void {
  reportingInterval = window.setInterval(() => {
    sendReport();
  }, config.reportingInterval);
}
```

Ez alapján a backend API-nak támogatnia kell:

- Aggregált teljesítményadatok időszakos jelentését
- Riasztási rendszert a küszöbértékek túllépésekor
- Hosszú távú teljesítménytrendek elemzését
- Abnormális viselkedés detektálását

Ezeket a szempontokat figyelembe véve kell megtervezni az API proxy komponensek implementációját, hogy biztosíthassuk a robusztus, hatékony és könnyen monitorozható backend rendszert.

# Content és Card Komponensek Elemzése az API Implementációhoz

A frontend Content és Card komponensek részletes elemzése alapján a következő specifikus követelményeket és funkciókat azonosítottam, amelyek közvetlenül befolyásolják a backend API routes implementációját:

## 1. Hírek Adatstruktúrája és Státuszkezelés

A Card.tsx komponensben a következő fontos státusz információk jelennek meg:

```typescript
sourceStatus?: 'valid' | 'invalid' | 'scraped' | 'unavailable';
hasRssFeed?: boolean;
```

Az API-nak támogatnia kell:

- Forrás állapot információk kezelését és továbbítását
- Különböző eredetű tartalmak (eredeti RSS, scraped HTML) megfelelő megjelölését
- Forrástípus információk megőrzését az adatfolyamatokon keresztül

## 2. Tartalom Csoportosítási Követelmények

A Panel.tsx komponens speciális csoportosítási logikát alkalmaz:

```typescript
// Különválasztjuk a képes és kép nélküli híreket
const newsWithImages = newsItems.filter((item) => item.imageUrl);
const newsWithoutImages = newsItems.filter((item) => !item.imageUrl);

// Kép nélküli hírek csoportosítása (3 hírenként)
const newsGroups: NewsItem[][] = [];
for (let i = 0; i < newsWithoutImages.length; i += 3) {
  newsGroups.push(newsWithoutImages.slice(i, i + 3));
}
```

Ezért az API-nak képesnek kell lennie:

- Megfelelő mennyiségű adatot szolgáltatni a különböző típusú csoportokhoz
- Biztosítani, hogy legyen elegendő képes és kép nélküli hír az optimális megjelenítéshez
- Metaadatokat szolgáltatni a tartalom típusáról, hogy a frontend csoportosítani tudja őket

## 3. Fokozatos Tartalombetöltési Mechanizmus

A Content.tsx komponens progresszív adatbetöltési mechanizmust használ fontossági szintek alapján:

```typescript
// További hírek betöltése az alsóbb fontossági szintekről
const loadMoreSources = useCallback(async () => {
  if (!currentImportanceLevel || !hasMoreSources) return;

  // További források lekérése
  const result = await localDataService.loadMoreSources(currentImportanceLevel, filters);

  // Következő fontossági szint betöltése
  if (result.sources.length > 0 && result.nextImportanceLevel !== null) {
    const nextLevelNews = await localDataService.getNews({
      ...filters,
      importanceLevel: result.nextImportanceLevel,
    });
    // ... további feldolgozás
  }
}, [currentImportanceLevel, hasMoreSources, activeTab.filters]);
```

Az API-nak támogatnia kell:

- Fontossági szintek szerinti lekérdezési paramétereket
- Next-page token vagy hasonló mechanizmust a további hírek betöltéséhez
- Metaadatokat a rendelkezésre álló további tartalmakról (hasMoreSources)
- Források csoportosítását fontossági szint szerint
- Görgető esemény alapú inkrementális betöltést

## 4. Időformázás és Relatív Időkezelés

A cardService.ts fájl saját implementációt tartalmaz a relatív időkezelésre:

```typescript
function formatRelativeTime(timestamp: number | string): string {
  // ... idő formázási logika
  if (diffSec < 60) {
    return `${diffSec} second${diffSec !== 1 ? 's' : ''} ago`;
  } else if (diffMin < 60) {
    return `${diffMin} minute${diffMin !== 1 ? 's' : ''} ago`;
  }
  // ... további formázás
}
```

Az API implementációnak:

- Pontos időbélyegeket kell szolgáltatnia minden hírhez
- Opcionálisan támogatnia kell a kliens oldali formázást vagy
- Előre formázott dátumokat is szolgáltathat különböző formátumokban (ISO, relatív)

## 5. Lokáció-alapú Tartalom és Többszintű Szűrés

Az App.tsx és Content.tsx komponensekben komplex szűrési rendszer látható:

```typescript
// Egyesítjük a szűrőket és a helyet, kiegészítve fontossági szinttel
const enhancedFilters = {
  ...filters,
  country: filters.country || userLocation.country,
  importanceLevel: filters.importanceLevel || RSS_CONFIG.IMPORTANCE_LEVELS.CRITICAL,
};

// Több fül kezelése különböző szűrőkkel
const newTab: Tab = {
  id: newTabId,
  title: newTabTitle,
  active: true,
  mode: 'news',
  filters: {
    ...filters,
    useGeoLocation: false,
    isCleanTab: false,
    mode: filters.continent ? 'continent' : filters.country ? 'country' : 'category',
  },
};
```

Az API-nak támogatnia kell:

- Többszintű szűrés kombinálását (kontinens, ország, kategória)
- Lokáció-alapú tartalmak kezelését geoIP vagy explicit paraméter alapján
- Különböző nézettípusok (continent, country, category) megfelelő adat-visszaadási módjait
- Paraméterek alapján optimalizált lekérdezéseket

## 6. Favicon és Domain Kezelés

A Card.tsx komponensben automatikus favicon lekérés és domain kinyerés történik:

```typescript
// Domain kinyerése az URL-ből vagy a sourceId-ből
const getDomain = () => {
  if (!sourceId) return null;

  // Ha van benne URL, abból próbáljuk kinyerni a domain-t
  if (url) {
    try {
      const urlObj = new URL(url);
      return urlObj.hostname;
    } catch (e) {
      console.log('Invalid URL:', url);
    }
  }

  // Ha nincs URL vagy hibás, akkor sourceId-ből próbáljuk
  const parts = sourceId.split('-');
  return parts.length > 1 ? parts[1] : sourceId;
};

// Favicon URL előállítása a domain alapján
const getFaviconUrl = () => {
  const domain = getDomain();
  if (!domain) return null;

  // Google favicon szolgáltatás használata - 32 méretű ikon kérése
  return `https://www.google.com/s2/favicons?domain=${domain}&sz=32`;
};
```

Az API-nak képesnek kell lennie:

- Domain információk és favicon URL-ek tárolására vagy generálására
- A források domain információinak következetes biztosítására
- Google favicon szolgáltatással való integrációra vagy saját favicon szolgáltatásra
- Hiányzó domain adatok esetén fallback mechanizmusokra

## 7. Tab-alapú Tartalom Cache-elés

A Content.tsx komponensben látható az állapot-megőrző működés a tabok között:

```typescript
// Tab-specifikus tartalmak tárolása
const tabContents = useRef<Record<string, NewsItem[]>>({});
// Görgetési pozíciók tárolása tab ID szerint
const scrollPositions = useRef<Record<string, number>>({});

// Tartalom mentése külön effect-ben
useEffect(() => {
  // Ha nincs előző tab, vagy épp tartalomváltás zajlik, nem tárolunk
  if (!prevTabIdRef.current || isChangingContent.current || newsItems.length === 0) return;

  // Előző tab tartalmának mentése
  console.log(`Tartalom mentése: ${prevTabIdRef.current}, hírek száma: ${newsItems.length}`);
  tabContents.current[prevTabIdRef.current] = [...newsItems];
}, [newsItems]);
```

A backend API architektúrának támogatnia kell:

- Hatékony HTTP caching mechanizmusokat a tab-szintű tartalom-cache támogatásához
- ETag-eket vagy más validáló mechanizmusokat a tartalomfrissítések ellenőrzéséhez
- Session-alapú vagy kliens-alapú állapottárolást
- Megfelelő cache header-eket a kliens cache-elés támogatásához

Ezek a részletes megfigyelések segítenek a backend API végpontok és szolgáltatások megtervezésében, hogy azok zökkenőmentes integrációt biztosítsanak a frontend komponensekkel, és optimális adatszolgáltatási stratégiákat lehessen implementálni.

# Backend Szerver Architektúra Tanulságok API Implementációhoz

A backend szerver komponenseinek elemzése alapján a következő fontos mintákat és API végpont implementációs követelményeket azonosítottam:

## 1. PostgreSQL Adatbázis Integráció

A PostgreSQLManager.ts alapján látható, hogy az API-nak egy központi adatbázis kapcsolatkezelőt kell használnia:

```typescript
// Adatbáziskapcsolat használata az API végpontokon
import { db } from '../../server/PostgreSQLManager';

// Egyszerű lekérdezések esetén
const results = await db.query('SELECT * FROM table WHERE condition = $1', [value]);

// Hibakezelés
try {
  // Lekérdezés
} catch (error) {
  logger.error('Kategória: Hiba leírása', error);
  throw error; // vagy megfelelő hibaválasz küldése
}
```

Az API végpontoknak a fenti minta szerint kell az adatbázist használniuk, a központi hibakezelés előnyeit kihasználva.

## 2. Rétegzett Hibakezelési Mechanizmus

Az error-handler.ts alapján a végpontoknak a következő hibakezelési mintát kell követniük:

```typescript
// AppError használata specifikus státuszkódokkal
throw new AppError('Nem található a kért erőforrás', 404, true);

// Alternatív használat (try-catch blokkban)
try {
  // API művelet
} catch (error) {
  if (error instanceof AppError) {
    // Már kezelt hiba továbbítása
    throw error;
  } else {
    // Nem kezelt hiba csomagolása
    logger.error('Hibakategória', 'Részletes hibaüzenet', error);
    throw new AppError('Általános hibaüzenet a kliensnek', 500);
  }
}
```

## 3. Specifikus Folyamatok PostgreSQL Adatbázissal

A PostgreSQLcontact.ts fájl elemzése alapján az API modulnak az alábbi mintákat kell követnie:

```typescript
// Kontinens-specifikus lekérdezések - idézőjelek használata táblaneveknél
const query = `
  SELECT * FROM continents."${tableName}" 
  WHERE fontossag = 1 
  ORDER BY fontossag
`;

// Több táblás lekérdezések esetén
const query = `
  SELECT * FROM continents.europe WHERE orszag = $1
  UNION SELECT * FROM continents."asia" WHERE orszag = $1
  UNION SELECT * FROM continents."north america" WHERE orszag = $1
  // ... további kontinens táblák
`;
```

Az adatstruktúra alapján látható, hogy kontinensenként külön táblák vannak, és a táblákban fontossági szintek szerint vannak rendezve a források.

## 4. Környezetfüggő Konfiguráció

Az environment.ts alapján az API-nak a következő környezetfüggő beállításokat kell használnia:

```typescript
// API verziókezelés
const API_VERSION = process.env.API_VERSION || '1.0';

// Környezettől függő részletes hibák
const DETAILED_ERRORS = !isProd;

// Cache vezérlés
const CACHE_CONTROL = isProd
  ? 'public, max-age=300' // Termelési környezetben
  : 'no-cache'; // Fejlesztési környezetben
```

## 5. CORS és Biztonsági Konfiguráció

Az app.ts fájlban látható CORS és biztonsági beállítások, amelyeket az API-nak figyelembe kell vennie:

```typescript
// Helmet biztonsági fejlécek támogatása
// CORS beállítások különböző környezetekhez
// Rate limiting az API végpontokon
```

Az API végpontoknak kompatibilisnek kell lenniük ezekkel a biztonsági beállításokkal.

## 6. Adatbázis Struktúra a Proxy Rendszerhez

A PostgreSQLcontact.ts fájlból látható lekérdezés minták alapján a következő adatbázis struktúrát kell követni:

```
continents.{continent_name} (pl. continents.europe, continents."north america")
  - eredeti_id: forrás azonosító
  - orszag: ország név
  - fontossag: fontossági szint szám (1, 2, 3, stb.)
```

Az API routes-oknak figyelembe kell venniük ezt a struktúrát a lekérdezések tervezésekor, különösen:

- A kontinens táblák szóközöket tartalmazhatnak, ezért idézőjelekbe kell tenni
- A források fontossági szint alapján vannak rendezve
- Az országok szűrhetők és listázhatók kontinensektől függetlenül

## 7. API Útvonalkategóriák

Az app.ts és a végponti elemzés alapján a következő fő API útvonalkategóriákat kell implementálni:

```
/api/
  ├─ /news/           # Hírek lekérdezése különböző szűrőkkel
  ├─ /sources/        # Források kezelése
  ├─ /countries/      # Ország adatok és hírek
  ├─ /continents/     # Kontinens adatok és hírek
  └─ /sync/           # Szinkronizációs végpontok
```

## 8. Teljesítménynövelő Technikák

Az app.ts kódjában látható middleware-ek azt mutatják, hogy az API-nak támogatnia kell:

```typescript
// Válaszok tömörítését (compression middleware)
// Rate limiting (DoS védelem)
// Kérés naplózást a teljesítmény és hibák figyeléséhez
```

A proxy API végpontoknak ezekkel összhangban kell működniük, és biztosítaniuk kell a megfelelő teljesítményt nagy mennyiségű adatok esetén is.

Ezeket az architektúrális megfigyeléseket figyelembe véve érdemes megtervezni és implementálni a backend API routes-okat, hogy integrálható legyen a meglévő szerver infrastruktúrába, és kiszolgálja a frontend komponensek igényeit.
