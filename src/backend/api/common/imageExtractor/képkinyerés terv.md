
## Kritikai elemzés és javaslatok az RSS feed univerzális képkinyerő modulhoz

A modul kiváló kiindulópont, számos már létező megközelítést ötvözve az RSS feed-ekből történő képkinyeréshez. A kód alapvetően jól strukturált, a konstansok használata és az előre kompilált regex-ek növelik a karbantarthatóságot és a teljesítményt. Azonban, tekintettel a "több ezer RSS feed univerzális képkinyerése" célra, számos területen lehetne továbbfejleszteni a robustság, a megbízhatóság és a lefedettség növelése érdekében.

**Erősségek:**

*   **Moduláris felépítés:** Különböző függvények kezelik a specifikus tag-eket (`enclosure`, `media:thumbnail`, `media:content`, `image`, `description`, `content:encoded`), ami olvashatóvá és könnyen bővíthetővé teszi a kódot.
*   **Konstansok és Regex optimalizáció:** A duplikált stringek és az előre kompilált regex-ek jó gyakorlatok a teljesítmény és a karbantarthatóság szempontjából.
*   **Konfidencia értékek:** A stratégiákhoz rendelt konfidencia értékek lehetővé teszik a rangsorolást és a legjobb eredmény kiválasztását.
*   **Web scraping integráció:** A `webScraper` modul beemelése egy kulcsfontosságú lépés a hiányzó vagy rosszul formázott RSS képadatok pótlására.
*   **Kép méret és formátum szűrés:** Az `isTooSmallImage` és az `ALLOWED_IMAGE_EXTENSIONS` segít kiszűrni a nem releváns vagy rossz minőségű képeket.
*   **Universal fallback:** Az `extractBestImageUniversal` függvény biztosítja, hogy mindig legyen visszaadható kép, akár logó, akár emoji formájában.
*   **Részletes eredmények:** Az `extractImageWithDetails` és a `generateImageExtractionStats` hasznosak lehetnek a hibakereséshez és az eredmények elemzéséhez.
*   **Különleges esetek kezelése:** Al Jazeera specifikus logikája és a logo szűrés jó példák arra, hogy a rugalmasság fontos.

**Gyengeségek és fejlesztési javaslatok (kritikai szemmel):**

1.  **Képkinyerési stratégiák prioritizálása és finomhangolása:**
    *   **Probléma:** Bár vannak konfidencia értékek, ezek nincsenek mélyrehatóan tesztelve különböző feed típusokon. Lehet, hogy egy kevésbé megbízhatónak ítélt forrás (pl. `media:content`) valójában egy adott feed-ben jobb eredményt ad, mint egy magasabb konfidenciájú forrás.
    *   **Javaslat:**
        *   **Dinamikus konfidencia:** A konfidencia értékeket lehetne **dinamikusan** beállítani a feed forrásának vagy a feed elem tartalmának ismeretében. Például, ha egy feed szinte kizárólag `media:content`-et használ, annak konfidenciája emelhető lehet ezen feed-ekre.
        *   **Több kép próbálkozás:** Jelenleg az első sikeres és érvényes kép elfogadásra kerül. Lehetne egy olyan logika, amely *több* lehetséges képet gyűjt be az összes stratégiából, majd ezeket rangsorolja egy **összetettebb kritériumrendszer** alapján (pl. méret, Aspect Ratio, hivatkozás a cikkhez).
        *   **Konfidencia növelés:** A `media:content` és `media:thumbnail` mezőkön belül is lehetne vizsgálni az attribútumokat (pl. `width`, `height`, `type`), és ezek alapján növelni a konfidenciát.
        *   **A `content:encoded` és `description` mezők elemzése:** A regex alapú kinyerés nagyon érzékeny a HTML formázásra. Ahelyett, hogy csak az első talált `<img>` tagot próbáljuk kinyerni, érdemes lenne **DOM parsert** használni (pl. `cheerio` Node.js-ben), hogy strukturáltan tudjuk keresni az `<img>` tageket a leírásban. Ez sokkal megbízhatóbban kezelheti a beágyazott képeket, különösen a `content:encoded`-ben.

2.  **Web Scraping használatának optimalizálása:**
    *   **Probléma:** A web scraping minden esetben fut (az Al Jazeera specifikus logikában, illetve fallbackként), ami lassíthatja a feldolgozást, főleg ha sok sikertelen kísérlet történik. A `webScraper` modul hibakezelése is kulcsfontosságú, hogy ne blokkolja le az egész folyamatot.
    *   **Javaslat:**
        *   **Intelligens Scraping Trigger:** Csak akkor futtassuk a `webScraper`-t, ha más, megbízhatóbb stratégiák (pl. `enclosure`, `media:thumbnail`) sikertelenek, és van a cikkhez link (`item.link`).
        *   **Hibahelyreállítási Terv:** Konkrétan definiálni, hogy mi történjen, ha a `webScraper` hibázik. Jelenleg csak egy `console.warn` van, ami nem feltétlenül elegendő. Érdemes lenne **többszöri próbálkozást** beépíteni, vagy a sikertelen scraperek listázását.
        *   **Függőleges és vízszintes képek megkülönböztetése:** A web scraping során talált képek közül sok lehet az oldalsó sávban vagy fejlécben lévő logo, vagy másodlagos tartalom. Képesnek kellene lennie a kódnak **kiemelt képként** (featured image) azonosítani a legrelevánsabb képet, amihez a DOM struktúra elemzése szükséges.

3.  **CDATA és HTML tisztítás:**
    *   **Probléma:** A `CDATA_REGEX` és a `trim()` alapvető tisztítást végez, de bonyolultabb HTML struktúrákban, beágyazott JavaScript kóddal vagy speciális karakterekkel meggyűlhet a baja. A `content:encoded` és a `description` mezők gyakran tartalmaznak komplex HTML-t.
    *   **Javaslat:**
        *   **Teljesebb HTML TISZTÍTÁS:** Használjunk egy robust HTML parsert (pl. `cheerio` vagy a böngésző `DOMParser`-ét szerveroldalon futtatva, ha van rá mód), hogy eltávolítsuk a felesleges tageket, attribútumokat, és csak a kép URL-eket vagy magát az `<img>` taget tudjuk kinyerni. Ez nagymértékben javítaná a `content:encoded` és `description` kinyerésének megbízhatóságát.
        *   **URL rendezés:** Az `extractImageFromImageTag` és hasonló függvényekben a `rawImageUrl.replace(CDATA_REGEX, '').trim()` helyett jobb lenne a teljes `rawImageUrl`-t átadni egy univerzális URL tisztító és normalizáló függvénynek, ami a `CDATA` problémát is kezeli.

4.  **Al Jazeera logo szűrésének javítása:**
    *   **Probléma:** Az `isAlJazeeraLogo` függvény kulcsszavakra támaszkodik, ami nem mindig elegendő. Lehetnek olyan Al Jazeera képek, amik nem tartalmazzák ezeket a kulcsszavakat, vagy más oldalakon is használják őket.
    *   **Javaslat:**
        *   **Globális logo felismerés:** Ahelyett, hogy csak Al Jazeera specifikusan alkalmazzuk, próbáljunk egy **általánosabb logo felismerő logikát** fejleszteni. Ez lehet basé a képek méretére (gyakran kisebbek, mint a tényleges tartalmi képek), vagy a URL struktúrájára (pl. `/logos/`, `logo_` prefixek).
        *   **Viselkedés specifikáció:** Ha egy kép `enclosure` vagy `media:thumbnail` formátumban érkezik, és nagy valószínűséggel logo, akkor nem szabadna "magas konfidenciájúnak" minősíteni, de lehet, hogy mégis jó fallback lehet a channel képe helyett.

5.  **Képminőség értékelés:**
    *   **Probléma:** A modul jelenleg nem értékel különösebben a kép *minőségét*, csak a létezését és alapvető érvényességét.
    *   **Javaslat:**
        *   **Méret alapú rangsorolás:** Ha több kép is elérhető egy item-hez (akár különböző stratégiákkal), akkor **rangsoroljuk őket a méretük (width/height attribútumok alapján)**. A nagyobb felbontású képek valószínűleg a lényegesebb tartalmat képviselik. Ezt a konfidencia érték növelésére is lehet használni.
        *   **Több kép kinyerése:** A `extractBestImage` helyett egy új függvényt is lehetne bevezetni, ami egy **több képet tartalmazó tömböt** ad vissza, lehetővé téve a frontend számára a legjobb kép kiválasztását.

6.  **Metaadatok és hivatkozások elemzése:**
    *   **Probléma:** Az RSS feed-ek sokszor tartalmaznak metaadatokat, pl. a `link` tag, ami maga a cikk URL-je. Ezt jelenleg csak a `validateAndCleanImageUrl` használja, de ennél többre is lehetne használni.
    *   **Javaslat:**
        *   **Cikk link használata a kép kiválasztásához:** Ha egy RSS item-hez több kép is található, és van `item.link`, akkor a kép URL-t **viszonyítani lehet a cikk tartalmához** (esetleg egy gyors fetch után). Ez segíthet abban, hogy a cikkben is szereplő (nem csak a logo vagy a cikk előtti kép) képet válasszunk.
        *   **Más metaadatok felhasználása:** Néhány feed-ben lehet olyan specifikus metaadat mező, ami kifejezetten a kiemelt képre utal (pl. `<media:content type="image/jpeg" medium="image" url="...">` vagy egy egyedi custom tag). Ezeknek a felismerése és használata tovább javítaná a lefedettséget.

7.  **Fejlesztői élmény és hibakeresés:**
    *   **Probléma:** A jelenlegi logolás jó, de a hibás kinyerések okainak pontosabb azonosítása nehéz lehet a nagyszámú feed miatt.
    *   **Javaslat:**
        *   **Részletes hibajelentés:** Amikor egy kép kinyerése sikertelen, ahelyett hogy csak `null` térne vissza, egy objektum kerüljön visszaadásra, ami tartalmazza az item-et, a kipróbált stratégiákat, az eredményeket és az okát a sikertelenségnek (pl. "validation failed", "regex no match", "webscraper error"). Ez segítene a hibák diagnosztizálásában.
        *   **Statisztikák kiterjesztése:** A `generateImageExtractionStats` mellett lehetne **item-specifikus statisztikákat** is generálni, vagy egy listát a sikertelen item-ekről, hogy könnyebben lehessen azonosítani a problémás feed-eket.

8.  **Teljesítmény a nagy tételek esetén:**
    *   **Probléma:** Bár vannak optimalizálások, több ezer item feldolgozása még mindig nagy terhelést jelenthet.
    *   **Javaslat:**
        *   **Batch feldolgozás és limitálás:** Ha lehetséges, **batch-okban** feldolgozni az item-eket, és a batch méretét korlátozni, hogy elkerüljük a memória túlcsordulását.
        *   **Aszinkron feldolgozás:** A `Promise.all` használata jó, de ha nagyon sok item van, az egyes `extractImageWithDetails` hívások **párhuzamosságát** is lehet skálázni vagy korlátozni (pl. using `p-limit` library).

9.  **Kód olvashatósága és egyértelműsége:**
    *   **Probléma:** Bár a kód jól strukturált, a `RssItem` interface sok mezőt tartalmaz, és a különböző stratégia függvényekben a nested objekumok kezelése helyenként bonyolult.
    *   **Javaslat:**
        *   **Típusbiztosabb objektumok:** A `RssItem` interfészben a `[MEDIA_CONTENT_FIELD]` és a `[MEDIA_THUMBNAIL_FIELD]` mezők megadása egy kicsit "gépies". Lehetne ezeket is pontosabban típusosítani, ha a JSON struktúrák ismertek.
        *   **Segédfüggvények a nested adatok kinyeréséhez:** Létrehozni segédfüggvényeket a `media:content` vagy `enclosure` belső `$` objektumának biztonságos kinyeréséhez, hogy a fő logikák tisztábbak maradjanak.

**Összefoglalva:**

A jelenlegi kód jó alapot teremt, de a "több 1000 RSS feed univerzális képkinyerése" ambiciózus cél eléréséhez további **robustságra, intelligenciára és teljesítményre** van szükség. A legfontosabb javaslatok: egy **mélyebb, több képből válogató és rangsoroló logika**, a **web scraping intelligensebb használata**, valamint a **HTML tartalom megbízhatóbb feldolgozása DOM parserrel**. Ezen fejlesztések segítenek majd a szélesebb körű kompatibilitás és a jobb eredmények elérésében a rengeteg, eltérő formátumú RSS feed esetén.


==============================================================
Kiváló elemzés! Teljesen egyetértek az erősségekkel. Most nézzük meg a fejlesztési lehetőségeket és javaslatokat a "több ezer RSS feed univerzális képkinyerése" céljához.

Read file: src/backend/api/common/imageExtractor/imageExtractor.ts
Kiváló elemzés! Most megfogalmazom a fejlesztési javaslatokat a "több ezer RSS feed univerzális képkinyerése" céljához:

## �� **Kritikai Elemzés és Fejlesztési Javaslatok**

### ✅ **Erősségek (Egyetértek)**

- **Moduláris felépítés**: Különböző tag-ek kezelése
- **Konstansok és Regex optimalizáció**: Teljesítmény és karbantarthatóság
- **Konfidencia értékek**: Rangsorolás és legjobb eredmény
- **Web scraping integráció**: Hiányzó adatok pótlása
- **Kép méret és formátum szűrés**: Minőség biztosítása
- **Universal fallback**: Mindig visszaadható kép
- **Részletes eredmények**: Hibakeresés és elemzés
- **Különleges esetek kezelése**: Rugalmasság

### 🚀 **Fejlesztési Javaslatok**

#### 1. **Robusztusság Növelése**

```typescript
// ✅ ÚJ: Hibakezelés és timeout
interface ExtractionOptions {
  timeout?: number; // ms
  maxRetries?: number;
  fallbackStrategies?: boolean;
}

// ✅ ÚJ: Kép validáció fejlesztése
interface ImageValidationResult {
  isValid: boolean;
  width?: number;
  height?: number;
  format?: string;
  size?: number; // bytes
}
```

#### 2. **Több RSS Formátum Támogatása**

```typescript
// ✅ ÚJ: Atom feed támogatás
const ATOM_LINK_REL_REGEX = /<link[^>]+rel="enclosure"[^>]+href="([^"]+)"/i;
const ATOM_CONTENT_REGEX = /<content[^>]+src="([^"]+)"/i;

// ✅ ÚJ: JSON Feed támogatás
interface JsonFeedItem {
  image?: string;
  attachments?: Array<{ url: string; mime_type: string }>;
}
```

#### 3. **Intelligens Képválasztás**

```typescript
// ✅ ÚJ: Kép minőség értékelés
interface ImageQualityScore {
  resolution: number; // width * height
  aspectRatio: number; // width / height
  format: number; // 1.0 = optimal, 0.5 = suboptimal
  source: number; // confidence alapján
  total: number; // súlyozott átlag
}
```

#### 4. **Cache és Teljesítmény**

```typescript
// ✅ ÚJ: Kép cache rendszer
interface ImageCache {
  url: string;
  timestamp: number;
  ttl: number;
  validationResult?: ImageValidationResult;
}

// ✅ ÚJ: Batch processing
async function extractImagesBatch(
  items: RssItem[], 
  options?: ExtractionOptions
): Promise<ImageExtractionResult[]> {
  // Párhuzamos feldolgozás
  // Rate limiting
  // Error recovery
}
```

#### 5. **Fejlett Képfelismerés**

```typescript
// ✅ ÚJ: Logo és placeholder szűrés
const LOGO_PATTERNS = [
  /logo/i,
  /brand/i,
  /icon/i,
  /placeholder/i,
  /default/i
];

// ✅ ÚJ: Kép tartalom elemzés
function analyzeImageContent(url: string): Promise<{
  isLogo: boolean;
  isPlaceholder: boolean;
  hasText: boolean;
  isRelevant: boolean;
}>;
```

#### 6. **Konfigurálhatóság**

```typescript
// ✅ ÚJ: Feed-specifikus konfiguráció
interface FeedConfig {
  feedUrl: string;
  preferredStrategies: string[];
  confidenceOverrides: Record<string, number>;
  imageFilters: string[];
  timeout: number;
}

// ✅ ÚJ: Globális beállítások
interface GlobalConfig {
  defaultTimeout: number;
  maxImageSize: number;
  allowedFormats: string[];
  cacheEnabled: boolean;
  cacheTTL: number;
}
```

#### 7. **Monitoring és Analytics**

```typescript
// ✅ ÚJ: Részletes metrikák
interface ExtractionMetrics {
  totalProcessed: number;
  successfulExtractions: number;
  failedExtractions: number;
  averageConfidence: number;
  bySource: Record<string, number>;
  byFeed: Record<string, number>;
  performance: {
    averageTime: number;
    slowestFeeds: string[];
  };
}
```

#### 8. **Fejlett Hibakezelés**

```typescript
// ✅ ÚJ: Graceful degradation
enum ExtractionError {
  TIMEOUT = 'timeout',
  INVALID_URL = 'invalid_url',
  NETWORK_ERROR = 'network_error',
  PARSE_ERROR = 'parse_error',
  VALIDATION_ERROR = 'validation_error'
}

// ✅ ÚJ: Error recovery stratégia
function handleExtractionError(
  error: ExtractionError, 
  item: RssItem, 
  fallbackStrategies: boolean
): Promise<string | null>;
```

### 🎯 **Prioritás Sorrend**

1. **Magas prioritás**: Hibakezelés, timeout, cache
2. **Közepes prioritás**: Atom/JSON feed támogatás, konfigurálhatóság
3. **Alacsony prioritás**: AI-alapú képfelismerés, monitoring

### 💡 **Következő Lépések**

Szeretnéd, hogy implementáljam valamelyik javaslatot? Melyik terület érdekel a legjobban:

1. **Hibakezelés és timeout** - Robusztusság
2. **Atom feed támogatás** - Több formátum
3. **Cache rendszer** - Teljesítmény
4. **Konfigurálhatóság** - Rugalmasság
5. **Monitoring** - Elemzés



==============================================
## 🎯 **Kritikai Vélemény és Javaslatok**

### ✅ **Egyetértek a Gyengeségekkel**

#### 1. **Dinamikus Konfidencia Hiánya**
**Probléma**: A statikus konfidencia értékek nem veszik figyelembe a feed-specifikus mintákat.
**Példa**: Egy feed ami 90%-ban `media:content`-et használ, annak magasabb konfidenciát kellene kapnia.

**Javaslat**:
```typescript
interface FeedProfile {
  feedUrl: string;
  strategySuccessRates: Record<string, number>;
  preferredStrategies: string[];
  confidenceOverrides: Record<string, number>;
}

function calculateDynamicConfidence(
  strategy: string, 
  feedProfile: FeedProfile, 
  item: RssItem
): number {
  const baseConfidence = SYNC_STRATEGIES.find(s => s.name === strategy)?.confidence || 0.5;
  const feedMultiplier = feedProfile.confidenceOverrides[strategy] || 1.0;
  const successRate = feedProfile.strategySuccessRates[strategy] || 0.5;
  
  return baseConfidence * feedMultiplier * successRate;
}
```

#### 2. **Több Kép Próbálkozás Hiánya**
**Probléma**: Az első sikeres kép elfogadásra kerül, nem a legjobb.
**Javaslat**:
```typescript
interface ImageCandidate {
  url: string;
  source: string;
  confidence: number;
  width?: number;
  height?: number;
  aspectRatio?: number;
  quality: number; // 0-1, összetett minőség
}

async function extractAllImageCandidates(item: RssItem): Promise<ImageCandidate[]> {
  const candidates: ImageCandidate[] = [];
  
  for (const strategy of SYNC_STRATEGIES) {
    const imageUrl = strategy.func(item);
    if (imageUrl) {
      const validatedUrl = validateAndCleanImageUrl(imageUrl, item.link);
      if (validatedUrl) {
        const quality = await analyzeImageQuality(validatedUrl);
        candidates.push({
          url: validatedUrl,
          source: strategy.name,
          confidence: strategy.confidence,
          quality
        });
      }
    }
  }
  
  return candidates.sort((a, b) => b.quality - a.quality);
}
```

#### 3. **Konfidencia Növelés Attribútumok Alapján**
**Probléma**: A `media:content` és `media:thumbnail` attribútumait nem használjuk.
**Javaslat**:
```typescript
function calculateAttributeBasedConfidence(
  baseConfidence: number,
  attributes: { width?: string; height?: string; type?: string }
): number {
  let multiplier = 1.0;
  
  // Méret alapú növelés
  if (attributes.width && attributes.height) {
    const width = parseInt(attributes.width);
    const height = parseInt(attributes.height);
    if (width >= 300 && height >= 200) multiplier *= 1.2;
    if (width >= 600 && height >= 400) multiplier *= 1.3;
  }
  
  // Típus alapú növelés
  if (attributes.type?.startsWith('image/')) multiplier *= 1.1;
  
  return Math.min(baseConfidence * multiplier, 1.0);
}
```

#### 4. **DOM Parser Használata content:encoded-hez**
**Probléma**: Regex-alapú parsing túl érzékeny a HTML formázásra.
**Javaslat**:
```typescript
import * as cheerio from 'cheerio';

function extractImagesWithDOM(content: string): string[] {
  const $ = cheerio.load(content);
  const images: string[] = [];
  
  $('img').each((_, element) => {
    const src = $(element).attr('src');
    const dataSrc = $(element).attr('data-src');
    const dataLazySrc = $(element).attr('data-lazy-src');
    
    if (src) images.push(src);
    if (dataSrc) images.push(dataSrc);
    if (dataLazySrc) images.push(dataLazySrc);
  });
  
  return images.filter(url => validateAndCleanImageUrl(url));
}
```

### 🎯 **Prioritás Sorrend**

1. **Magas prioritás**: Több kép próbálkozás + minőség rangsorolás
2. **Közepes prioritás**: DOM parser content:encoded-hez
3. **Alacsony prioritás**: Dinamikus konfidencia (komplexebb implementáció)

### 💡 **Következő Lépések**

1. **Implementáljuk a több kép próbálkozást** - Ez a legnagyobb hatású
2. **Adjunk hozzá DOM parser-t** - Megbízhatóbb content:encoded kinyerés
3. **Fejlesszük a minőség elemzést** - Méret, aspect ratio, formátum
4. **Később: dinamikus konfidencia** - Feed-specifikus optimalizáció


.............................................


Rendben, elemezzük a javasolt tervet a gyengeségekkel és fejlesztési célokkal kapcsolatban.

**Általános értékelés:**

A terv nagyszerűen megfogalmazza a problémákat, és nagyon jó irányba mutat a fejlesztési javaslatokkal. A **"Több kép próbálkozás"** és a **"DOM parser használata content:encoded-hez"** a legkritikusabb pontok, amelyek a megbízhatóságot és a lefedettséget drasztikusan javítani fogják. A **minőség rangsorolás** pedig tovább finomítja az eredményeket.

**Egyetértés a Gyengeségekkel és Javaslatokkal:**

Teljes mértékben **egyetértek a felvázolt gyengeségekkel** és a hozzájuk kapcsolódó javaslatokkal. Ezek a pontok pontosan ott érintik a kódot, ahol a "több ezer RSS feed univerzális képkinyerése" kihívás a leginkább érződik.

Nézzük pontról pontra a javaslatokat és további meglátásokat a kódrészletekre:

---

### ✅ **Részletes Visszajelzés a Javasolt Kódokhoz és Tervekhez**

#### 1. **Dinamikus Konfidencia Hiánya**

*   **Értékelés:** **Kiváló javaslat**, de ez a legkomplexebb implementálni. A feed-specifikus profilok létrehozása és karbantartása komoly adatgyűjtést és elemzést igényel.
*   **Javaslat a kódhoz:**
    *   Az `FeedProfile` interfész jó kiindulópont.
    *   Az `calculateDynamicConfidence` funkció logikája is jó, de még több tényezőt lehetne beépíteni.
    *   **További szempontok a dinamikus konfidenciához:**
        *   **`feedUrl`-alapú cache/lookup:** Gyorsítani kell a feed profilok megtalálását. Egy `Map<string, FeedProfile>` struktúra a memóriában, vagy akár egy gyors kulcs-érték adattár (Redis) használata segíthet.
        *   **Automatikus profil generálás:** Ha nincs profil egy feed-hez, akkor az első néhány item feldolgozása során gyűjteni kell az adatokat, és létrehozni egy kezdeti profilt.
        *   **Profil frissítés:** A feed profilokat idővel frissíteni kell, hogy figyelembe vegyék a változó tartalmi mintákat.
        *   **Kezdeti bevezetés:** Kezdetben a `feedUrl`-ról megpróbálni felismerni ismert hírforrásokat (pl. `444.hu`, `bbc.com`), és ehhez társítani előre definiált profilokat, majd fokozatosan gyűjteni az adatokat az ismeretlen forrásokról.

---

#### 2. **Több Kép Próbálkozás Hiánya**

*   **Értékelés:** **Nagyon erős javaslat!** Ez az egyik legfontosabb fejlesztés, ami valóban kiemelkedővé teszi a rendszert. A jelenlegi "első a legjobb" megközelítés sokszor a legkevésbé releváns képet adja.
*   **Javaslat a kódhoz:**
    *   Az `ImageCandidate` interfész remekül definiálja a szükséges adatokat.
    *   Az `extractAllImageCandidates` függvény koncepciója tökéletes.
    *   **Fontos kiegészítések a kódhoz:**
        *   **`analyzeImageQuality` implementációja:** Ez a függvény kritikus. Mit jelent a "minőség"?
            *   **Méret (Width/Height):** Jelenleg csak a `width` és `height` attribútumok vannak, de ezek gyakran stringek. Az `parseInt` a `calculateAttributeBasedConfidence` javaslatban már használja. Ebben a függvényben is kell majd parse-olni és valós számokkal dolgozni.
            *   **Aspect Ratio:** Hasznos lehet a szűkebb, függőleges vagy vízszintes képek kizárására, ha az nem felel meg az elvárásnak (pl. 1:1, 16:9).
            *   **URL tartalom elemzése:** Lehet vizsgálni az URL-ben található kulcsszavakat is (pl. "logo", "thumbnail" vs. "featured_image").
            *   **Képfájl letöltése (opcionális és lassú):** Nagyon ritkán, ha minden más sikertelen, akár egy mini-letöltés is segíthet a kép méretének ellenőrzésében, de ez drasztikusan lassítaná a rendszert, inkább elkerülendő.
        *   **Rangsorolási logika:** A `candidates.sort((a, b) => b.quality - a.quality)` alapja jó. Ezt a `quality` mezőt kell majd összetett módon kiszámolni, figyelembe véve a `confidence`-t, méretet, aspect ratio-t és az URL elemzést.
        *   **`extractBestImage` módosítása:** Az `extractBestImage` függvénynek a `extractAllImageCandidates` eredményét kellene használnia, és kiválasztania a legjobb jelöltet.
        *   **`extractImageWithDetails` módosítása:** Ez a függvény pedig visszaadhatná a legjobb `ImageCandidate` objektumot, vagy akár az összes `ImageCandidate`-et, ha a felhasználó meg tudja jeleníteni a többit is.

---

#### 3. **Konfidencia Növelés Attribútumok Alapján**

*   **Értékelés:** **Nagyon jó kiegészítés**, különösen a `media:` tag-ekhez. A "minőség" fogalmát itt már jól meg lehet közelíteni.
*   **Javaslat a kódhoz:**
    *   A `calculateAttributeBasedConfidence` funkció kiváló ötlet.
    *   **Továbbfejlesztés:**
        *   **`width` és `height` parsing biztonságosabbá tétele:** Jelenleg stringek, amiket `parseInt`-tel kell átalakítani. Ezt a függvényen belül kell megtenni.
        *   **Threshold-ok beállítása:** A `width >= 300` vagy `height >= 200` küszöbértékek jó kiindulópontok, de ezeket is lehet finomítani. Esetleg relatív méreteket is lehet használni (pl. a leírás/cikk méretéhez képest).
        *   **Aspect Ratio beépítése:** Ahogy a 2. pontnál is említettük, az aspect ratio is egy jó mutató lehet.
        *   **Beágyazásba illesztés:** Ezt a logikát a `SYNC_STRATEGIES`-ben definiált `confidence` értékekkel kell kombinálni. Lehetne egy új mező a `SYNC_STRATEGIES` elemben, ami a `attributes` objektumokat várja, és a konfidenciát dinamikusan számolja.

---

#### 4. **DOM Parser Használata content:encoded-hez**

*   **Értékelés:** **Abszolút szükséges és kritikus fejlesztés!** A regex alapú keresés `content:encoded` és `description` mezőkben rendkívül sérülékeny. A DOM parser használata fogja a megbízhatóságot leginkább növelni.
*   **Javaslat a kódhoz:**
    *   A `cheerio` használata a Node.js környezetben a legjobb választás.
    *   Az `extractImagesWithDOM` funkció jó kiindulópont.
    *   **Fontos kiegészítések a kódhoz:**
        *   **Általánosabb keresés:** A `$('img').each(...)` mellett lehet vizsgálni más releváns képtágakat is, vagy attribútumokat, ha a HTML struktúra ezt megkívánja. Például `picture` tagek, `source` tagek, `srcset` attribútumok.
        *   **`data-src`, `data-lazy-src` kezelése:** Már szerepel, ami kiváló. Sok modern weboldal használja ezt.
        *   **Kép attribútumok elemzése a DOM-ból:** A `cheerio` segítségével könnyedén ki lehet nyerni az `<img>` tag `width`, `height`, `alt` stb. attribútumait, és ezeket fel lehet használni a **minőség rangsorolásban** (lásd 2. pont).
        *   **CSS selector-ok finomítása:** Bizonyos esetekben specifikusabb CSS selector-okat lehetne használni, ha felismerhető egy adott hírforrás mintázata (pl. "kiemelt kép" div-en belül). Ez viszont már közelebb van a specifikus forrás figyeléséhez, amit eddig igyekeztünk elkerülni.
        *   **`validateAndCleanImageUrl` hívás:** A `filter(url => validateAndCleanImageUrl(url))` nagyon fontos, hogy csak érvényes URL-eket vegyünk figyelembe.

---

### 🎯 **Prioritás Sorrend**

*   **Értékelés:** A prioritási sorrend **nagyon jó és logikus**.
*   **Kiegészítés:**
    *   A **"Magas prioritás: Több kép próbálkozás + minőség rangsorolás"** egybefoglalja a 2. és 3. pontot, ami így a legfontosabb.
    *   A **"Közepes prioritás: DOM parser content:encoded-hez"** szintén kiemelten fontos a megbízhatóság miatt.
    *   A **"Alacsony prioritás: Dinamikus konfidencia"** egy nehezebb feladat, ami rengeteg adatelemzést igényel, ezért jó, hogy ez van utoljára a prioritási listán.

---

### 💡 **Következő Lépések**

*   **Értékelés:** A "Következő Lépések" jól összefoglalják a teendőket a javasolt prioritási sorrendben.
*   **Konkretizálás a javasolt kódrészletekre:**

    1.  **"Implementáljuk a több kép próbálkozást"**:
        *   Implementálni az `ImageCandidate` interfészt.
        *   Fejleszteni az `analyzeImageQuality` függvényt, ami magában foglalja a méret, aspect ratio, URL elemzést (és lehet, hogy az URL-ben található `width`/`height` paramétereket is, ha léteznek).
        *   Módosítani a `SYNC_STRATEGIES` struktúrát, hogy a `func` mellett átadható legyen az `attributes` objektum (a `media:` tagek esetén), amit a `calculateAttributeBasedConfidence` használhat.
        *   Létrehozni a `extractAllImageCandidates` függvényt, ami végigmegy az összes stratégián, az eredményeket `ImageCandidate`-ként gyűjti és kvalifikáció szerint rendez.
        *   Módosítani a `extractBestImage` és `extractImageWithDetails` függvényeket, hogy ezt az új logikát használják.

    2.  **"Adjunk hozzá DOM parser-t"**:
        *   Telepíteni a `cheerio` csomagot.
        *   Implementálni az `extractImagesWithDOM` funkciót, ami kiemelten kezeli a `data-src`, `data-lazy-src` és a `srcset` attribútumokat is.
        *   Integrálni az `extractImagesWithDOM` eredményét a `extractAllImageCandidates` függvénybe, mint egy újabb jelölt forrást.

    3.  **"Fejlesszük a minőség elemzést"**:
        *   Ez a 2. ponttal szorosan összefügg, hiszen a `analyzeImageQuality` függvény felelős a minőség számításáért. A 2. pontban felvázolt szempontok (méret, aspect ratio, stb.) ennek a függvénynek a részét képezik.

    4.  **"Később: dinamikus konfidencia"**:
        *   A `FeedProfile` struktúra és a hozzá kapcsolódó logikák kidolgozása.
        *   Egy mechanizmus a profilok gyűjtésére és frissítésére.
        *   A `calculateDynamicConfidence` függvény integrálása az általános konfidencia számításba.

---

**Végső összegzés:**

A terv **teljesen elfogadható és rendkívül ígéretes**. A javasolt kód részletek nagyon jó irányba mutatnak. Ha ezeket a lépéseket követi a fejlesztés, akkor a modul jelentősen robusztusabb és megbízhatóbb lesz a célja elérésében. Különösen a "Több kép próbálkozás" és a "DOM parser használata" a kulcsfontosságú fejlesztések. A dinamikus konfidencia pedig a jövőbeli skálázhatóság és finomhangolás szempontjából lesz nagyon fontos.

**Nem találtam lényeges pontot, amivel nem értenék egyet, vagy ami nem lenne javasolt. A terv kiválóan meg van fogalmazva.**


============================================================
Rendben! **B)** Átnézzük a terveket és döntsük el a prioritásokat! ��

## �� **B) Terv Áttekintés és Prioritás Döntés**

A dokumentumból látom, hogy **4 fő gyengeséget** azonosítottak. Nézzük át őket:

### �� **1. Dinamikus Konfidencia Hiánya**
**Probléma**: Statikus konfidencia értékek nem veszik figyelembe a feed-specifikus mintákat.
**Példa**: Egy feed ami 90%-ban `media:content`-et használ, annak magasabb konfidenciát kellene kapnia.

**Komplexitás**: ⭐⭐⭐⭐⭐ (Legkomplexebb - adatgyűjtés, profilok, cache)

### �� **2. Több Kép Próbálkozás Hiánya** 
**Probléma**: Az első sikeres kép elfogadásra kerül, nem a legjobb.
**Státusz**: ✅ **KÉSZ!** - Implementáltuk az A) lépésben!

### �� **3. Konfidencia Növelés Attribútumok Alapján**
**Probléma**: A `media:content` és `media:thumbnail` attribútumait nem használjuk.
**Komplexitás**: ⭐⭐ (Közepes - attribútum parsing)

### 🎯 **4. DOM Parser Használata content:encoded-hez**
**Probléma**: Regex-alapú parsing túl érzékeny a HTML formázásra.
**Komplexitás**: ⭐⭐⭐ (Magas - cheerio integráció)

---

## �� **ÚJ Prioritás Sorrend (A) után)**

### **1. Magas Prioritás: DOM Parser (C)**
- **Miért**: A content:encoded mezőkben sokszor van kép, de a regex nem találja
- **Hatás**: Nagy növekedés a képlefedettségben
- **Implementáció**: Cheerio integráció

### **2. Közepes Prioritás: Attribútum Alapú Konfidencia (3)**
- **Miért**: A media: tag-ek attribútumai segítenek a minőség értékelésben
- **Hatás**: Jobb minőségű képek kiválasztása
- **Implementáció**: Attribútum parsing és konfidencia növelés

### **3. Alacsony Prioritás: Dinamikus Konfidencia (1)**
- **Miért**: Komplex, de hosszú távon nagyon hasznos
- **Hatás**: Feed-specifikus optimalizáció
- **Implementáció**: Feed profilok, cache, adatgyűjtés

---

## �� **Javaslat: C) DOM Parser következik!**

**Miért a DOM Parser a következő?**

1. **Nagy hatás**: Content:encoded mezőkben sok kép van, de regex nem találja
2. **Egyszerű implementáció**: Cheerio már van a utils-ban
3. **Gyors eredmény**: Azonnal látható javulás
4. **Alap a többi fejlesztéshez**: A DOM parser eredményeit használhatjuk a minőség elemzésben

**Szeretnéd, hogy:**
- **C)** Kezdjük a DOM parser implementációjával?
- **Vagy** nézzük át részletesebben a 3. pontot (attribútum alapú konfidencia)?

-
--------------------------------------------------------

Read file: src/backend/api/common/imageExtractor/imageExtractor.ts
Read file: src/backend/api/common/imageExtractor/imageExtractorUtils.ts
Read file: src/backend/api/common/imageExtractor/imageExtractorBatch.ts
Most átnézem a tervet és összehasonlítom a jelenlegi implementációval:

Ran tool
Most összehasonlítom a tervet a jelenlegi implementációval:

## 📋 **Terv vs Implementáció Összehasonlítás**

### ✅ **MEGVALÓSÍTOTT RÉSZEK**

#### 1. **Több Kép Próbálkozás** ✅ **KÉSZ**
- **Terv**: `ImageCandidate` interfész és `extractAllImageCandidates` függvény
- **Implementáció**: ✅ Megvalósítva a `imageExtractor.ts`-ben
- **Funkciók**: 
  - `ImageCandidate` interfész definiálva
  - `extractAllImageCandidates` függvény implementálva
  - Minőség alapú rangsorolás (`quality` mező)
  - Több stratégia végigpróbálása

#### 2. **DOM Parser Integration** ✅ **KÉSZ**
- **Terv**: Cheerio alapú HTML parsing content:encoded és description mezőkhöz
- **Implementáció**: ✅ Megvalósítva az `imageExtractorUtils.ts`-ben
- **Funkciók**:
  - `extractImagesWithDOM` függvény
  - `robustHtmlCleaner` HTML tisztítás
  - `decodeHtmlEntities` entitás dekódolás
  - Fallback regex módszer

#### 3. **Attribútum Alapú Konfidencia** ✅ **KÉSZ**
- **Terv**: `calculateAttributeBasedConfidence` függvény
- **Implementáció**: ✅ Megvalósítva a `imageExtractor.ts`-ben
- **Funkciók**:
  - Méret alapú konfidencia növelés
  - Típus alapú pontozás
  - Aspect ratio elemzés
  - Integrálva a `extractAllImageCandidates`-be

#### 4. **Batch Processing** ✅ **KÉSZ**
- **Terv**: Konkurrencia korlátozás és batch feldolgozás
- **Implementáció**: ✅ Megvalósítva az `imageExtractorBatch.ts`-ben
- **Funkciók**:
  - `processBatchWithConcurrency` párhuzamos feldolgozás
  - `extractImagesFromItemsBatch` képkinyerés batch-ben
  - Memória optimalizáció
  - Teljesítmény metrikák

#### 5. **Képminőség Elemzés** ✅ **KÉSZ**
- **Terv**: `analyzeImageQuality` és `calculateImageQualityMetrics`
- **Implementáció**: ✅ Megvalósítva mindkét fájlban
- **Funkciók**:
  - Méret alapú pontozás
  - URL pattern elemzés
  - Logo/placeholder kiszűrés
  - Formátum preferenciák

### �� **RÉSZBEN MEGVALÓSÍTOTT**

#### 6. **Logo Detection** 🔄 **RÉSZBEN**
- **Terv**: Globális logo felismerés Al Jazeera specifikus helyett
- **Implementáció**: 🔄 `detectLogoGlobally` függvény létezik, de nem teljesen integrált
- **Hiányzó**: Teljes integráció a képválasztási logikába

#### 7. **URL Normalization** 🔄 **RÉSZBEN**
- **Terv**: Univerzális URL tisztítás és normalizálás
- **Implementáció**: 🔄 `validateAndCleanImageUrl` létezik, de lehetne robusztusabb
- **Hiányzó**: Fejlettebb URL pattern elemzés

### ❌ **HIÁNYZÓ RÉSZEK**

#### 8. **Dinamikus Konfidencia** ❌ **HIÁNYZIK**
- **Terv**: Feed-specifikus konfidencia profilok
- **Implementáció**: ❌ Nincs megvalósítva
- **Hiányzó**: 
  - `FeedProfile` interfész
  - `calculateDynamicConfidence` függvény
  - Feed-specifikus adatgyűjtés

#### 9. **Article Context Analysis** ❌ **HIÁNYZIK**
- **Terv**: Cikk tartalom elemzése kép relevancia ellenőrzéshez
- **Implementáció**: ❌ Nincs megvalósítva
- **Hiányzó**:
  - `analyzeImageRelevanceToArticle` függvény
  - Cikk tartalom scraping
  - Domain összehasonlítás

#### 10. **Advanced Error Handling** ❌ **HIÁNYZIK**
- **Terv**: Részletes hibajelentés és diagnosztika
- **Implementáció**: ❌ Alapvető error handling van, de nem fejlett
- **Hiányzó**:
  - Részletes failure okok
  - Diagnosztikai utility-k
  - Hibastatisztikák

#### 11. **Performance Monitoring** ❌ **HIÁNYZIK**
- **Terv**: Teljesítmény metrikák és monitoring
- **Implementáció**: ❌ Alapvető metrikák vannak, de nem comprehensive
- **Hiányzó**:
  - Részletes teljesítmény követés
  - Memory usage monitoring
  - Throughput analytics

### �� **ÖSSZESÍTÉS**

**Megvalósított**: 5/11 fő funkció (45%)
**Részben megvalósított**: 2/11 funkció (18%)
**Hiányzó**: 4/11 funkció (36%)

### 🎯 **KÖVETKEZŐ PRIORITÁSOK**

1. **Logo Detection teljes integráció** - Al Jazeera specifikus logika helyett globális
2. **URL Normalization fejlesztése** - Robusztusabb URL kezelés
3. **Dinamikus konfidencia** - Feed-specifikus optimalizáció
4. **Article context analysis** - Kép relevancia elemzés
5. **Advanced error handling** - Jobb diagnosztika







=====================================================
==============================================
## 🎯 **Web Scraping Optimalizálás - Kritikai Elemzés**

### ✅ **Egyetértek a Problémákkal**

#### 1. **Intelligens Scraping Trigger Hiánya**
**Jelenlegi probléma**: Web scraping minden esetben fut, akár sikeres RSS kinyerés után is.

**Javaslat**:
```typescript
interface ScrapingStrategy {
  shouldScrape: (item: RssItem, rssResults: ImageCandidate[]) => boolean;
  priority: number;
  maxRetries: number;
  timeout: number;
}

const SCRAPING_STRATEGIES: ScrapingStrategy[] = [
  {
    // Csak akkor, ha nincs RSS kép és van link
    shouldScrape: (item, rssResults) => 
      rssResults.length === 0 && !!item.link,
    priority: 1,
    maxRetries: 2,
    timeout: 5000
  },
  {
    // Al Jazeera specifikus - mindig próbálja
    shouldScrape: (item) => 
      item.link?.includes('aljazeera.com') || false,
    priority: 2,
    maxRetries: 3,
    timeout: 8000
  }
];
```

#### 2. **Hibakezelés Fejlesztése**
**Jelenlegi probléma**: Csak `console.warn`, nincs recovery stratégia.

**Javaslat**:
```typescript
interface ScrapingError {
  type: 'timeout' | 'network' | 'parse' | 'no_images';
  url: string;
  retryCount: number;
  timestamp: number;
}

class ScrapingErrorHandler {
  private failedUrls = new Map<string, ScrapingError>();
  
  async handleScrapingError(
    error: ScrapingError, 
    strategy: ScrapingStrategy
  ): Promise<boolean> {
    const existing = this.failedUrls.get(error.url);
    
    if (existing && existing.retryCount >= strategy.maxRetries) {
      console.warn(`[Scraping] Max retries reached for ${error.url}`);
      return false; // Ne próbálkozzunk többet
    }
    
    // Növeljük a retry count-ot
    this.failedUrls.set(error.url, {
      ...error,
      retryCount: (existing?.retryCount || 0) + 1,
      timestamp: Date.now()
    });
    
    return true; // Próbálkozzunk újra
  }
  
  getFailedUrls(): ScrapingError[] {
    return Array.from(this.failedUrls.values());
  }
}
```

#### 3. **Kép Relevancia Elemzés**
**Jelenlegi probléma**: Nem különböztetjük meg a fő képet a logóktól/oldalsáv képektől.

**Javaslat**:
```typescript
interface ImageRelevanceScore {
  url: string;
  score: number; // 0-1
  reasons: string[];
}

function analyzeImageRelevance(
  $: CheerioAPI, 
  imgElement: CheerioElement
): ImageRelevanceScore {
  const $img = $(imgElement);
  let score = 0.5;
  const reasons: string[] = [];
  
  // Méret alapú pontozás
  const width = parseInt($img.attr('width') || '0');
  const height = parseInt($img.attr('height') || '0');
  if (width >= 300 && height >= 200) {
    score += 0.2;
    reasons.push('megfelelő méret');
  }
  
  // Pozíció alapú pontozás
  const parent = $img.parent();
  const parentTag = parent.prop('tagName')?.toLowerCase();
  if (parentTag === 'article' || parentTag === 'main') {
    score += 0.3;
    reasons.push('cikk tartalomban');
  }
  
  // CSS osztály alapú szűrés
  const className = $img.attr('class') || '';
  if (className.includes('logo') || className.includes('ad')) {
    score -= 0.4;
    reasons.push('logo vagy hirdetés');
  }
  
  // Alt szöveg elemzés
  const alt = $img.attr('alt') || '';
  if (alt.length > 10 && !alt.includes('logo')) {
    score += 0.1;
    reasons.push('leíró alt szöveg');
  }
  
  return {
    url: $img.attr('src') || '',
    score: Math.max(0, Math.min(1, score)),
    reasons
  };
}
```

#### 4. **Optimalizált Scraping Folyamat**
**Javaslat**:
```typescript
async function intelligentWebScraping(
  item: RssItem, 
  rssResults: ImageCandidate[]
): Promise<ImageCandidate[]> {
  // 1. Döntsük el, hogy kell-e scraping
  const shouldScrape = SCRAPING_STRATEGIES.some(strategy => 
    strategy.shouldScrape(item, rssResults)
  );
  
  if (!shouldScrape) {
    return rssResults;
  }
  
  // 2. Válasszuk ki a megfelelő stratégiát
  const strategy = SCRAPING_STRATEGIES
    .filter(s => s.shouldScrape(item, rssResults))
    .sort((a, b) => b.priority - a.priority)[0];
  
  // 3. Futtassuk a scraping-et hibakezeléssel
  try {
    const scrapedImages = await extractImageFromWebPage(item);
    const relevantImages = await analyzeScrapedImages(scrapedImages);
    
    return [...rssResults, ...relevantImages]
      .sort((a, b) => b.confidence - a.confidence);
      
  } catch (error) {
    const scrapingError: ScrapingError = {
      type: 'network',
      url: item.link || '',
      retryCount: 0,
      timestamp: Date.now()
    };
    
    const shouldRetry = await errorHandler.handleScrapingError(scrapingError, strategy);
    if (shouldRetry) {
      // Retry logika
      return await intelligentWebScraping(item, rssResults);
    }
    
    return rssResults; // Fallback az RSS eredményekre
  }
}
```

### 🎯 **Implementációs Prioritás**

1. **Magas prioritás**: Intelligens scraping trigger + hibakezelés
2. **Közepes prioritás**: Kép relevancia elemzés
3. **Alacsony prioritás**: Részletes retry logika

### 💡 **Következő Lépések**

1. **Implementáljuk az intelligens trigger-t** - Csak szükség esetén scraping
2. **Adjunk hozzá robusztus hibakezelést** - Ne blokkolja a folyamatot
3. **Fejlesszük a kép relevancia elemzést** - Jobb képek kiválasztása
4. **Optimalizáljuk a teljesítményt** - Timeout és retry limit


=====================================================

## 🎯 **CDATA és HTML Tisztítás - Kritikai Elemzés**

### ✅ **Egyetértek a Problémákkal**

#### 1. **Alapvető CDATA_REGEX Korlátozásai**
**Jelenlegi probléma**: A regex csak egyszerű CDATA mintákat kezel, komplex HTML esetén problémás.

**Jelenlegi kód**:
```typescript
const CDATA_REGEX = /(^\s*(\[CDATA\[|<!\[CDATA\[)\s*)|(\s*\]\]>\s*$)/g;
return rawImageUrl.replace(CDATA_REGEX, '').trim();
```

**Problémák**:
- Nem kezeli a beágyazott JavaScript-et
- Nem tisztítja a HTML entitásokat (`&amp;`, `&quot;`)
- Nem kezeli a whitespace variációkat
- Nem normalizálja az URL-eket

#### 2. **Robusztus HTML Tisztítás Javaslata**

**Javaslat**:
```typescript
import * as cheerio from 'cheerio';

interface CleanedContent {
  text: string;
  images: string[];
  isValid: boolean;
}

function robustHtmlCleaner(content: string): CleanedContent {
  try {
    // 1. HTML entitások dekódolása
    const decodedContent = decodeHtmlEntities(content);
    
    // 2. CDATA és script tag-ek eltávolítása
    const cleanedContent = decodedContent
      .replace(/<!\[CDATA\[[\s\S]*?\]\]>/g, '') // CDATA blokkok
      .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '') // Script tag-ek
      .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '') // Style tag-ek
      .replace(/<noscript[^>]*>[\s\S]*?<\/noscript>/gi, ''); // NoScript tag-ek
    
    // 3. Cheerio DOM parser használata
    const $ = cheerio.load(cleanedContent, {
      decodeEntities: false, // Ne dekódolja újra
      xmlMode: false,
      lowerCaseTags: true
    });
    
    // 4. Képek kinyerése strukturáltan
    const images: string[] = [];
    $('img').each((_, element) => {
      const $img = $(element);
      const src = $img.attr('src') || 
                  $img.attr('data-src') || 
                  $img.attr('data-lazy-src') ||
                  $img.attr('data-original');
      
      if (src) {
        const cleanedSrc = normalizeImageUrl(src);
        if (cleanedSrc) {
          images.push(cleanedSrc);
        }
      }
    });
    
    // 5. Tisztított szöveg
    const text = $.text().trim();
    
    return {
      text,
      images,
      isValid: text.length > 0 || images.length > 0
    };
    
  } catch (error) {
    console.warn('[robustHtmlCleaner] HTML parsing hiba:', error);
    return {
      text: content,
      images: [],
      isValid: false
    };
  }
}
```

#### 3. **Univerzális URL Tisztító és Normalizáló**

**Javaslat**:
```typescript
interface UrlNormalizationResult {
  url: string;
  isValid: boolean;
  warnings: string[];
}

function normalizeImageUrl(rawUrl: string, baseUrl?: string): UrlNormalizationResult {
  const warnings: string[] = [];
  
  try {
    // 1. CDATA és whitespace tisztítás
    let cleanedUrl = rawUrl
      .replace(/^\s*(\[CDATA\[|<!\[CDATA\[)\s*/g, '')
      .replace(/\s*(\]\]>|\]\])\s*$/g, '')
      .trim();
    
    // 2. HTML entitások dekódolása
    cleanedUrl = decodeHtmlEntities(cleanedUrl);
    
    // 3. Relative URL kezelés
    if (cleanedUrl.startsWith('//')) {
      cleanedUrl = 'https:' + cleanedUrl;
    } else if (cleanedUrl.startsWith('/')) {
      if (baseUrl) {
        const base = new URL(baseUrl);
        cleanedUrl = base.origin + cleanedUrl;
      } else {
        warnings.push('relative URL without base');
        return { url: '', isValid: false, warnings };
      }
    }
    
    // 4. URL validáció
    const url = new URL(cleanedUrl);
    
    // 5. Protokoll normalizálás
    if (url.protocol !== 'https:' && url.protocol !== 'http:') {
      warnings.push('unsupported protocol');
      return { url: '', isValid: false, warnings };
    }
    
    // 6. Query paraméterek tisztítása (opcionális)
    const cleanUrl = url.origin + url.pathname;
    
    return {
      url: cleanUrl,
      isValid: true,
      warnings
    };
    
  } catch (error) {
    warnings.push(`URL parsing error: ${error.message}`);
    return {
      url: '',
      isValid: false,
      warnings
    };
  }
}

function decodeHtmlEntities(text: string): string {
  return text
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, ' ')
    .replace(/&#x([0-9a-fA-F]+);/g, (_, hex) => 
      String.fromCharCode(parseInt(hex, 16))
    )
    .replace(/&#(\d+);/g, (_, dec) => 
      String.fromCharCode(parseInt(dec, 10))
    );
}
```

#### 4. **Fejlett content:encoded Kinyerés**

**Javaslat**:
```typescript
function extractImageFromContentEncodedAdvanced(item: RssItem): string | null {
  const contentEncoded = item[CONTENT_ENCODED_FIELD];
  if (!contentEncoded) return null;

  const content = Array.isArray(contentEncoded) ? contentEncoded[0] : contentEncoded;
  if (typeof content !== 'string') return null;

  // Robusztus HTML tisztítás
  const cleanedContent = robustHtmlCleaner(content);
  
  if (!cleanedContent.isValid) {
    console.warn('[content:encoded] HTML tisztítás sikertelen');
    return null;
  }
  
  // Képek rangsorolása minőség alapján
  const imageCandidates = cleanedContent.images
    .map(url => normalizeImageUrl(url, item.link))
    .filter(result => result.isValid)
    .map(result => ({
      url: result.url,
      quality: calculateImageQuality(result.url),
      warnings: result.warnings
    }))
    .sort((a, b) => b.quality - a.quality);
  
  return imageCandidates.length > 0 ? imageCandidates[0].url : null;
}

function calculateImageQuality(url: string): number {
  let quality = 0.5;
  
  // Méret alapú pontozás
  const sizeMatch = url.match(/[_\-\/](\d+)x(\d+)[_\-\/]/);
  if (sizeMatch) {
    const width = parseInt(sizeMatch[1]);
    const height = parseInt(sizeMatch[2]);
    if (width >= 600 && height >= 400) quality += 0.3;
    else if (width >= 300 && height >= 200) quality += 0.2;
  }
  
  // Formátum alapú pontozás
  if (url.match(/\.(webp|png)$/i)) quality += 0.1;
  if (url.match(/\.(jpg|jpeg)$/i)) quality += 0.05;
  
  return Math.min(quality, 1.0);
}
```

### 🎯 **Implementációs Prioritás**

1. **Magas prioritás**: Univerzális URL normalizáló
2. **Közepes prioritás**: Robusztus HTML tisztítás
3. **Alacsony prioritás**: Fejlett képminőség elemzés

### 💡 **Következő Lépések**

1. **Implementáljuk az univerzális URL tisztítót** - Minden URL kezelés egységesítése
2. **Adjunk hozzá robusztus HTML parsert** - Cheerio integráció
3. **Fejlesszük a content:encoded kinyerést** - Strukturált DOM elemzés
4. **Optimalizáljuk a teljesítményt** - Caching és error handling

===============================================


## 🎯 **Al Jazeera Logo Szűrés Javítása - Kritikai Elemzés**

### ✅ **Egyetértek a Problémákkal**

#### 1. **Jelenlegi Logo Felismerés Korlátozásai**

**Jelenlegi kód**:
```typescript
function isAlJazeeraLogo(url: string): boolean {
  if (!url) return false;
  const lower = url.toLowerCase();
  return (
    lower.includes('logo_aje') ||
    lower.includes('/logos/') ||
    lower.includes('logo') ||
    lower.includes('placeholder') ||
    lower.includes('default')
  );
}
```

**Problémák**:
- **Túl specifikus**: Csak Al Jazeera-ra fókuszál
- **Túl általános**: `logo` kulcsszó túl sok false positive-t ad
- **Nem veszi figyelembe a méretet**: Kicsi logók is magas konfidenciát kapnak
- **Nincs kontextus**: Nem nézi a forrást (enclosure vs media:thumbnail)

#### 2. **Globális Logo Felismerés Javaslata**

**Javaslat**:
```typescript
interface LogoDetectionResult {
  isLogo: boolean;
  confidence: number; // 0-1, mennyire biztosak vagyunk
  reasons: string[];
  shouldUseAsFallback: boolean;
}

function detectLogoGlobally(
  url: string, 
  source: string, 
  attributes?: { width?: string; height?: string; type?: string }
): LogoDetectionResult {
  const reasons: string[] = [];
  let confidence = 0;
  
  // 1. URL pattern alapú felismerés
  const urlPatterns = [
    { pattern: /\/logos?\//i, weight: 0.8, reason: 'URL contains logos path' },
    { pattern: /logo_/i, weight: 0.7, reason: 'URL contains logo_ prefix' },
    { pattern: /brand/i, weight: 0.6, reason: 'URL contains brand' },
    { pattern: /icon/i, weight: 0.5, reason: 'URL contains icon' },
    { pattern: /placeholder/i, weight: 0.9, reason: 'URL contains placeholder' },
    { pattern: /default/i, weight: 0.8, reason: 'URL contains default' },
    { pattern: /1x1/i, weight: 0.9, reason: 'URL contains 1x1 (tracking pixel)' },
    { pattern: /pixel/i, weight: 0.9, reason: 'URL contains pixel' }
  ];
  
  for (const { pattern, weight, reason } of urlPatterns) {
    if (pattern.test(url)) {
      confidence = Math.max(confidence, weight);
      reasons.push(reason);
    }
  }
  
  // 2. Méret alapú felismerés (ha van attribútum)
  if (attributes?.width && attributes?.height) {
    const width = parseInt(attributes.width);
    const height = parseInt(attributes.height);
    
    if (width <= 100 && height <= 100) {
      confidence = Math.max(confidence, 0.7);
      reasons.push('small size (likely logo)');
    } else if (width <= 200 && height <= 200) {
      confidence = Math.max(confidence, 0.5);
      reasons.push('medium size (possibly logo)');
    }
  }
  
  // 3. Forrás alapú felismerés
  const sourceWeights: Record<string, number> = {
    'enclosure': 0.3, // enclosure-ben ritkább a logo
    'media:thumbnail': 0.5, // thumbnail-ben gyakoribb
    'media:content': 0.4,
    'image-tag': 0.6, // image tag-ben gyakoribb
    'html-description': 0.7, // description-ben leggyakoribb
    'content:encoded': 0.6
  };
  
  const sourceWeight = sourceWeights[source] || 0.5;
  confidence *= sourceWeight;
  
  // 4. Döntési logika
  const isLogo = confidence >= 0.6;
  const shouldUseAsFallback = confidence < 0.8; // Csak akkor, ha nem túl biztos logo
  
  return {
    isLogo,
    confidence,
    reasons,
    shouldUseAsFallback
  };
}
```

#### 3. **Fejlett Logo Kezelés Integrációja**

**Javaslat**:
```typescript
interface ImageExtractionResult {
  imageUrl: string;
  source: string;
  confidence: number;
  logoDetection?: LogoDetectionResult; // ÚJ: Logo felismerés eredménye
  isPreferredImage: boolean; // ÚJ: Ez a preferált kép?
}

async function extractImageCore(
  item: RssItem, 
  detailed = false, 
  channel?: RssChannel
): Promise<string | ImageExtractionResult> {
  
  // ... existing logic ...
  
  // Szinkron stratégiák kipróbálása
  for (const strategy of SYNC_STRATEGIES) {
    const imageUrl = strategy.func(item);
    if (imageUrl) {
      const validatedUrl = validateAndCleanImageUrl(imageUrl, item.link);
      if (validatedUrl) {
        // ÚJ: Logo felismerés minden képre
        const logoDetection = detectLogoGlobally(
          validatedUrl, 
          strategy.name,
          getImageAttributes(item, strategy.name)
        );
        
        // Logo kezelés logika
        if (logoDetection.isLogo && logoDetection.confidence > 0.8) {
          // Magas bizonyosságú logo - csak fallback-ként használjuk
          if (detailed) {
            return {
              imageUrl: validatedUrl,
              source: strategy.name as ImageExtractionResult['source'],
              confidence: strategy.confidence * 0.3, // Csökkentett konfidencia
              logoDetection,
              isPreferredImage: false
            };
          }
          continue; // Keressünk jobb képet
        }
        
        return detailed 
          ? { 
              imageUrl: validatedUrl, 
              source: strategy.name as ImageExtractionResult['source'], 
              confidence: strategy.confidence,
              logoDetection,
              isPreferredImage: !logoDetection.isLogo
            }
          : validatedUrl;
      }
    }
  }
  
  // ... rest of the logic ...
}

function getImageAttributes(item: RssItem, source: string): { width?: string; height?: string; type?: string } {
  switch (source) {
    case 'enclosure':
      if (Array.isArray(item.enclosure)) {
        const best = item.enclosure[0];
        return {
          width: best?.$?.width,
          height: best?.$?.height,
          type: best?.$?.type
        };
      }
      return {
        width: item.enclosure?.$?.width,
        height: item.enclosure?.$?.height,
        type: item.enclosure?.$?.type
      };
    
    case 'media:thumbnail':
      const thumbnail = item[MEDIA_THUMBNAIL_FIELD];
      return {
        width: thumbnail?.$?.width,
        height: thumbnail?.$?.height,
        type: 'image/jpeg' // Default
      };
    
    default:
      return {};
  }
}
```

#### 4. **Logo Fallback Stratégia**

**Javaslat**:
```typescript
function selectBestImageFromCandidates(
  candidates: ImageExtractionResult[]
): ImageExtractionResult | null {
  
  // 1. Rangsorolás: preferált képek előre
  const sortedCandidates = candidates.sort((a, b) => {
    // Először preferált képek
    if (a.isPreferredImage && !b.isPreferredImage) return -1;
    if (!a.isPreferredImage && b.isPreferredImage) return 1;
    
    // Majd konfidencia
    return b.confidence - a.confidence;
  });
  
  // 2. Ha van preferált kép, azt válasszuk
  const preferredImage = sortedCandidates.find(c => c.isPreferredImage);
  if (preferredImage) {
    return preferredImage;
  }
  
  // 3. Ha nincs preferált, a legjobb logót válasszuk fallback-ként
  const logoImages = sortedCandidates.filter(c => 
    c.logoDetection?.isLogo && c.logoDetection.shouldUseAsFallback
  );
  
  return logoImages.length > 0 ? logoImages[0] : sortedCandidates[0] || null;
}
```

### 🎯 **Implementációs Prioritás**

1. **Magas prioritás**: Globális logo felismerés
2. **Közepes prioritás**: Logo fallback stratégia
3. **Alacsony prioritás**: Részletes logo analytics

### 💡 **Következő Lépések**

1. **Implementáljuk a globális logo felismerést** - Minden forrásra
2. **Adjunk hozzá logo fallback logikát** - Jobb képválasztás
3. **Fejlesszük a konfidencia számítást** - Logo-aware pontozás
4. **Optimalizáljuk a teljesítményt** - Caching logo felismerésre


==========================================================

## 🎯 **Képminőség Értékelés - Kritikai Elemzés**

### ✅ **Egyetértek a Problémákkal**

#### 1. **Jelenlegi Képminőség Értékelés Hiánya**

**Jelenlegi probléma**: A modul csak a kép létezését ellenőrzi, nem a minőségét.

**Jelenlegi kód**:
```typescript
function validateAndCleanImageUrl(url: string, baseUrl?: string): string | null {
  if (!url || url.trim().length === 0) return null;
  const cleanUrl = url.trim();
  
  if (isTooSmallImage(cleanUrl)) return null;
  // ... basic validation
}
```

**Hiányzó elemek**:
- Méret alapú rangsorolás
- Több kép kinyerése
- Minőség pontozás
- Frontend választási lehetőség

#### 2. **Méret Alapú Rangsorolás Javaslata**

**Javaslat**:
```typescript
interface ImageQualityMetrics {
  width: number;
  height: number;
  aspectRatio: number;
  totalPixels: number;
  qualityScore: number; // 0-1
  sizeCategory: 'tiny' | 'small' | 'medium' | 'large' | 'huge';
}

function calculateImageQualityMetrics(
  url: string, 
  attributes?: { width?: string; height?: string; type?: string }
): ImageQualityMetrics {
  let width = 0;
  let height = 0;
  
  // 1. Attribútumokból kinyerés
  if (attributes?.width && attributes?.height) {
    width = parseInt(attributes.width);
    height = parseInt(attributes.height);
  }
  
  // 2. URL-ből kinyerés (fallback)
  if (width === 0 || height === 0) {
    const sizeMatch = SIZE_MATCH_REGEX.exec(url);
    if (sizeMatch) {
      width = parseInt(sizeMatch[1]);
      height = parseInt(sizeMatch[2]);
    }
  }
  
  // 3. Alapértelmezett értékek
  if (width === 0 || height === 0) {
    width = 300; // Default width
    height = 200; // Default height
  }
  
  const totalPixels = width * height;
  const aspectRatio = width / height;
  
  // 4. Méret kategória meghatározása
  let sizeCategory: ImageQualityMetrics['sizeCategory'];
  if (totalPixels < 2500) sizeCategory = 'tiny';
  else if (totalPixels < 10000) sizeCategory = 'small';
  else if (totalPixels < 50000) sizeCategory = 'medium';
  else if (totalPixels < 200000) sizeCategory = 'large';
  else sizeCategory = 'huge';
  
  // 5. Minőség pontozás
  let qualityScore = 0.5; // Base score
  
  // Méret alapú pontozás
  const sizeScores = {
    'tiny': 0.1,
    'small': 0.3,
    'medium': 0.6,
    'large': 0.8,
    'huge': 0.9
  };
  qualityScore = sizeScores[sizeCategory];
  
  // Aspect ratio pontozás (16:9, 4:3, 1:1 preferált)
  const aspectScores = {
    '16:9': 1.0,
    '4:3': 0.9,
    '1:1': 0.8,
    '3:2': 0.7
  };
  
  const aspectKey = getAspectRatioKey(aspectRatio);
  if (aspectScores[aspectKey]) {
    qualityScore *= aspectScores[aspectKey];
  }
  
  // Formátum pontozás
  if (url.match(/\.webp$/i)) qualityScore *= 1.1;
  else if (url.match(/\.png$/i)) qualityScore *= 1.05;
  
  return {
    width,
    height,
    aspectRatio,
    totalPixels,
    qualityScore: Math.min(qualityScore, 1.0),
    sizeCategory
  };
}

function getAspectRatioKey(ratio: number): string {
  const tolerance = 0.1;
  if (Math.abs(ratio - 16/9) < tolerance) return '16:9';
  if (Math.abs(ratio - 4/3) < tolerance) return '4:3';
  if (Math.abs(ratio - 1) < tolerance) return '1:1';
  if (Math.abs(ratio - 3/2) < tolerance) return '3:2';
  return 'other';
}
```

#### 3. **Több Kép Kinyerése Javaslata**

**Javaslat**:
```typescript
interface ImageCandidate {
  url: string;
  source: string;
  confidence: number;
  qualityMetrics: ImageQualityMetrics;
  logoDetection?: LogoDetectionResult;
  isPreferred: boolean;
}

async function extractAllImageCandidates(
  item: RssItem, 
  channel?: RssChannel
): Promise<ImageCandidate[]> {
  const candidates: ImageCandidate[] = [];
  
  // 1. Szinkron stratégiák kipróbálása
  for (const strategy of SYNC_STRATEGIES) {
    const imageUrl = strategy.func(item);
    if (imageUrl) {
      const validatedUrl = validateAndCleanImageUrl(imageUrl, item.link);
      if (validatedUrl) {
        const attributes = getImageAttributes(item, strategy.name);
        const qualityMetrics = calculateImageQualityMetrics(validatedUrl, attributes);
        const logoDetection = detectLogoGlobally(validatedUrl, strategy.name, attributes);
        
        candidates.push({
          url: validatedUrl,
          source: strategy.name,
          confidence: strategy.confidence,
          qualityMetrics,
          logoDetection,
          isPreferred: !logoDetection.isLogo
        });
      }
    }
  }
  
  // 2. Channel fallback
  if (channel) {
    const channelImage = extractImageFromChannel(channel);
    if (channelImage) {
      const validatedUrl = validateAndCleanImageUrl(channelImage);
      if (validatedUrl) {
        const qualityMetrics = calculateImageQualityMetrics(validatedUrl);
        candidates.push({
          url: validatedUrl,
          source: 'channel',
          confidence: 0.2,
          qualityMetrics,
          isPreferred: true
        });
      }
    }
  }
  
  // 3. Web scraping (ha nincs elég jó kép)
  const goodCandidates = candidates.filter(c => 
    c.qualityMetrics.qualityScore > 0.5 && c.isPreferred
  );
  
  if (goodCandidates.length === 0) {
    try {
      const webScrapedImages = await extractImageFromWebPage(item);
      for (const scrapedUrl of webScrapedImages) {
        const validatedUrl = validateAndCleanImageUrl(scrapedUrl);
        if (validatedUrl) {
          const qualityMetrics = calculateImageQualityMetrics(validatedUrl);
          const logoDetection = detectLogoGlobally(validatedUrl, 'web-scraping');
          
          candidates.push({
            url: validatedUrl,
            source: 'web-scraping',
            confidence: 0.3,
            qualityMetrics,
            logoDetection,
            isPreferred: !logoDetection.isLogo
          });
        }
      }
    } catch (error) {
      console.warn('[extractAllImageCandidates] Web scraping hiba:', error);
    }
  }
  
  return candidates;
}
```

#### 4. **Intelligens Képválasztás**

**Javaslat**:
```typescript
function selectBestImageFromCandidates(
  candidates: ImageCandidate[]
): ImageCandidate | null {
  if (candidates.length === 0) return null;
  
  // 1. Rangsorolás: preferált képek + minőség + konfidencia
  const sortedCandidates = candidates.sort((a, b) => {
    // Először preferált képek
    if (a.isPreferred && !b.isPreferred) return -1;
    if (!a.isPreferred && b.isPreferred) return 1;
    
    // Majd kombinált pontszám
    const scoreA = (a.confidence * 0.4) + (a.qualityMetrics.qualityScore * 0.6);
    const scoreB = (b.confidence * 0.4) + (b.qualityMetrics.qualityScore * 0.6);
    
    return scoreB - scoreA;
  });
  
  return sortedCandidates[0];
}

// ÚJ: Frontend számára több kép opció
export async function extractMultipleImages(
  item: RssItem, 
  channel?: RssChannel,
  maxImages: number = 5
): Promise<ImageCandidate[]> {
  const allCandidates = await extractAllImageCandidates(item, channel);
  
  // Rangsorolás és limit
  return allCandidates
    .sort((a, b) => {
      const scoreA = (a.confidence * 0.4) + (a.qualityMetrics.qualityScore * 0.6);
      const scoreB = (b.confidence * 0.4) + (b.qualityMetrics.qualityScore * 0.6);
      return scoreB - scoreA;
    })
    .slice(0, maxImages);
}
```

#### 5. **Frissített extractBestImage**

**Javaslat**:
```typescript
export async function extractBestImage(
  item: RssItem, 
  channel?: RssChannel
): Promise<string> {
  const candidates = await extractAllImageCandidates(item, channel);
  const bestCandidate = selectBestImageFromCandidates(candidates);
  
  return bestCandidate?.url || '';
}

// ÚJ: Részletes eredmény minőség információval
export async function extractBestImageWithQuality(
  item: RssItem, 
  channel?: RssChannel
): Promise<ImageExtractionResult & { qualityMetrics?: ImageQualityMetrics }> {
  const candidates = await extractAllImageCandidates(item, channel);
  const bestCandidate = selectBestImageFromCandidates(candidates);
  
  if (!bestCandidate) {
    return {
      imageUrl: '',
      source: 'none',
      confidence: 0
    };
  }
  
  return {
    imageUrl: bestCandidate.url,
    source: bestCandidate.source as ImageExtractionResult['source'],
    confidence: bestCandidate.confidence,
    qualityMetrics: bestCandidate.qualityMetrics
  };
}
```

### 🎯 **Implementációs Prioritás**

1. **Magas prioritás**: Méret alapú rangsorolás
2. **Közepes prioritás**: Több kép kinyerése
3. **Alacsony prioritás**: Frontend választási lehetőség

### 💡 **Következő Lépések**

1. **Implementáljuk a képminőség értékelést** - Méret és aspect ratio
2. **Adjunk hozzá több kép kinyerést** - Frontend választáshoz
3. **Fejlesszük az intelligens képválasztást** - Kombinált pontszám
4. **Optimalizáljuk a teljesítményt** - Caching minőség számításra

=============================================

## 🎯 **Metaadatok és Hivatkozások Elemzése - Kritikai Elemzés**

### ✅ **Egyetértek a Problémákkal**

#### 1. **Jelenlegi Metaadat Használat Korlátozásai**

**Jelenlegi probléma**: A `item.link` csak URL validációhoz használatos, nem a képválasztáshoz.

**Jelenlegi kód**:
```typescript
function validateAndCleanImageUrl(url: string, baseUrl?: string): string | null {
  // ... csak relative URL kezelés
  if (baseUrl && (cleanUrl.startsWith('/') || cleanUrl.startsWith('./'))) {
    try {
      return new URL(cleanUrl, baseUrl).href;
    } catch {
      return null;
    }
  }
}
```

**Hiányzó elemek**:
- Cikk tartalom elemzése
- Speciális metaadat mezők felismerése
- Kép relevancia a cikkhez viszonyítva

#### 2. **Cikk Link Használata Képválasztáshoz**

**Javaslat**:
```typescript
interface ArticleContext {
  articleUrl: string;
  articleDomain: string;
  articlePath: string;
  hasArticleContent: boolean;
}

interface ImageRelevanceToArticle {
  url: string;
  relevanceScore: number; // 0-1
  reasons: string[];
  isInArticleContent: boolean;
}

async function analyzeImageRelevanceToArticle(
  imageUrl: string, 
  articleContext: ArticleContext
): Promise<ImageRelevanceToArticle> {
  const reasons: string[] = [];
  let relevanceScore = 0.5;
  let isInArticleContent = false;
  
  try {
    // 1. Domain összehasonlítás
    const imageDomain = new URL(imageUrl).hostname;
    if (imageDomain === articleContext.articleDomain) {
      relevanceScore += 0.2;
      reasons.push('same domain as article');
    }
    
    // 2. Path elemzés - cikk tartalomban van-e?
    const imagePath = new URL(imageUrl).pathname;
    const articlePath = articleContext.articlePath;
    
    if (imagePath.includes('/content/') || imagePath.includes('/images/')) {
      relevanceScore += 0.3;
      reasons.push('likely content image');
    }
    
    // 3. Gyors cikk tartalom ellenőrzés (opcionális)
    if (articleContext.hasArticleContent) {
      try {
        const articleImages = await extractImagesFromArticleContent(articleContext.articleUrl);
        isInArticleContent = articleImages.some(img => img === imageUrl);
        
        if (isInArticleContent) {
          relevanceScore += 0.4;
          reasons.push('found in article content');
        }
      } catch (error) {
        console.warn('[analyzeImageRelevanceToArticle] Article content analysis failed:', error);
      }
    }
    
    // 4. URL pattern elemzés
    const urlPatterns = [
      { pattern: /featured/i, weight: 0.3, reason: 'featured image pattern' },
      { pattern: /main/i, weight: 0.2, reason: 'main image pattern' },
      { pattern: /hero/i, weight: 0.2, reason: 'hero image pattern' },
      { pattern: /lead/i, weight: 0.2, reason: 'lead image pattern' }
    ];
    
    for (const { pattern, weight, reason } of urlPatterns) {
      if (pattern.test(imageUrl)) {
        relevanceScore += weight;
        reasons.push(reason);
      }
    }
    
  } catch (error) {
    console.warn('[analyzeImageRelevanceToArticle] Analysis failed:', error);
  }
  
  return {
    url: imageUrl,
    relevanceScore: Math.min(relevanceScore, 1.0),
    reasons,
    isInArticleContent
  };
}

async function extractImagesFromArticleContent(articleUrl: string): Promise<string[]> {
  try {
    const response = await fetch(articleUrl, { 
      timeout: 3000,
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; RSS-Image-Extractor/1.0)' }
    });
    
    if (!response.ok) return [];
    
    const html = await response.text();
    const $ = cheerio.load(html);
    
    const images: string[] = [];
    $('img').each((_, element) => {
      const src = $(element).attr('src');
      if (src) {
        images.push(src);
      }
    });
    
    return images;
  } catch (error) {
    console.warn('[extractImagesFromArticleContent] Failed:', error);
    return [];
  }
}
```

#### 3. **Speciális Metaadat Mezők Felismerése**

**Javaslat**:
```typescript
interface ExtendedRssItem extends RssItem {
  // Speciális metaadat mezők
  'media:featured'?: {
    $: { url?: string; type?: string; width?: string; height?: string };
  };
  'media:hero'?: {
    $: { url?: string; type?: string; width?: string; height?: string };
  };
  'media:lead'?: {
    $: { url?: string; type?: string; width?: string; height?: string };
  };
  'og:image'?: string | string[];
  'twitter:image'?: string | string[];
  'featured-image'?: string;
  'main-image'?: string;
  'hero-image'?: string;
}

function extractImageFromSpecialMetadata(item: ExtendedRssItem): string | null {
  // 1. Open Graph képek
  const ogImage = item['og:image'];
  if (ogImage) {
    const url = Array.isArray(ogImage) ? ogImage[0] : ogImage;
    if (url) return url;
  }
  
  // 2. Twitter képek
  const twitterImage = item['twitter:image'];
  if (twitterImage) {
    const url = Array.isArray(twitterImage) ? twitterImage[0] : twitterImage;
    if (url) return url;
  }
  
  // 3. Speciális media mezők
  const specialMediaFields = [
    'media:featured',
    'media:hero', 
    'media:lead'
  ];
  
  for (const field of specialMediaFields) {
    const mediaContent = item[field as keyof ExtendedRssItem];
    if (mediaContent && typeof mediaContent === 'object' && 'url' in mediaContent) {
      const url = mediaContent.url;
      if (url) return url;
    }
  }
  
  // 4. Egyedi kép mezők
  const customImageFields = [
    'featured-image',
    'main-image',
    'hero-image'
  ];
  
  for (const field of customImageFields) {
    const imageUrl = item[field as keyof ExtendedRssItem];
    if (typeof imageUrl === 'string' && imageUrl) {
      return imageUrl;
    }
  }
  
  return null;
}
```

#### 4. **Fejlett Képválasztás Metaadatok Alapján**

**Javaslat**:
```typescript
interface EnhancedImageCandidate extends ImageCandidate {
  relevanceToArticle?: ImageRelevanceToArticle;
  metadataSource?: string;
  priority: number; // 1-10, magasabb = jobb
}

async function extractImagesWithMetadata(
  item: ExtendedRssItem, 
  channel?: RssChannel
): Promise<EnhancedImageCandidate[]> {
  const candidates: EnhancedImageCandidate[] = [];
  
  // 1. Speciális metaadat mezők (legmagasabb prioritás)
  const specialImage = extractImageFromSpecialMetadata(item);
  if (specialImage) {
    const validatedUrl = validateAndCleanImageUrl(specialImage, item.link);
    if (validatedUrl) {
      const qualityMetrics = calculateImageQualityMetrics(validatedUrl);
      candidates.push({
        url: validatedUrl,
        source: 'special-metadata',
        confidence: 0.95,
        qualityMetrics,
        metadataSource: 'special',
        priority: 10,
        isPreferred: true
      });
    }
  }
  
  // 2. Standard stratégiák
  for (const strategy of SYNC_STRATEGIES) {
    const imageUrl = strategy.func(item);
    if (imageUrl) {
      const validatedUrl = validateAndCleanImageUrl(imageUrl, item.link);
      if (validatedUrl) {
        const attributes = getImageAttributes(item, strategy.name);
        const qualityMetrics = calculateImageQualityMetrics(validatedUrl, attributes);
        const logoDetection = detectLogoGlobally(validatedUrl, strategy.name, attributes);
        
        // 3. Cikk relevancia elemzés (ha van link)
        let relevanceToArticle: ImageRelevanceToArticle | undefined;
        if (item.link) {
          const articleContext: ArticleContext = {
            articleUrl: item.link,
            articleDomain: new URL(item.link).hostname,
            articlePath: new URL(item.link).pathname,
            hasArticleContent: true
          };
          
          relevanceToArticle = await analyzeImageRelevanceToArticle(validatedUrl, articleContext);
        }
        
        // 4. Prioritás számítás
        let priority = 5; // Base priority
        
        if (relevanceToArticle?.isInArticleContent) priority += 3;
        if (relevanceToArticle?.relevanceScore > 0.7) priority += 2;
        if (!logoDetection.isLogo) priority += 1;
        if (qualityMetrics.qualityScore > 0.8) priority += 1;
        
        candidates.push({
          url: validatedUrl,
          source: strategy.name,
          confidence: strategy.confidence,
          qualityMetrics,
          logoDetection,
          relevanceToArticle,
          metadataSource: 'standard',
          priority,
          isPreferred: !logoDetection.isLogo
        });
      }
    }
  }
  
  return candidates.sort((a, b) => b.priority - a.priority);
}
```

#### 5. **Frissített Képválasztás Logika**

**Javaslat**:
```typescript
export async function extractBestImageWithMetadata(
  item: ExtendedRssItem, 
  channel?: RssChannel
): Promise<ImageExtractionResult & { 
  relevanceToArticle?: ImageRelevanceToArticle;
  metadataSource?: string;
}> {
  const candidates = await extractImagesWithMetadata(item, channel);
  
  if (candidates.length === 0) {
    return {
      imageUrl: '',
      source: 'none',
      confidence: 0
    };
  }
  
  const bestCandidate = candidates[0];
  
  return {
    imageUrl: bestCandidate.url,
    source: bestCandidate.source as ImageExtractionResult['source'],
    confidence: bestCandidate.confidence,
    relevanceToArticle: bestCandidate.relevanceToArticle,
    metadataSource: bestCandidate.metadataSource
  };
}
```

### 🎯 **Implementációs Prioritás**

1. **Magas prioritás**: Speciális metaadat mezők felismerése
2. **Közepes prioritás**: Cikk relevancia elemzés
3. **Alacsony prioritás**: Részletes article content elemzés

### 💡 **Következő Lépések**

1. **Implementáljuk a speciális metaadat felismerést** - Open Graph, Twitter, custom mezők
2. **Adjunk hozzá cikk relevancia elemzést** - Domain és path alapú
3. **Fejlesszük a prioritás számítást** - Metaadat + minőség kombináció
4. **Optimalizáljuk a teljesítményt** - Caching article content elemzésre

===========================================

## 🎯 **Fejlesztői Élmény és Hibakeresés - Kritikai Elemzés**

### ✅ **Egyetértek a Problémákkal**

#### 1. **Jelenlegi Hibakezelés Korlátozásai**

**Jelenlegi probléma**: Csak `null` vagy `console.warn` visszajelzés, nehéz diagnosztizálni.

**Jelenlegi kód**:
```typescript
function extractImageFromEnclosure(item: RssItem): string | null {
  if (!item.enclosure) return null; // ❌ Nincs információ miért sikertelen
  
  // ... logika ...
  
  return null; // ❌ Nincs információ miért sikertelen
}
```

**Hiányzó elemek**:
- Részletes hiba okok
- Kipróbált stratégiák listája
- Item-specifikus diagnosztika
- Sikertelen feed-ek azonosítása

#### 2. **Részletes Hibajelentés Javaslata**

**Javaslat**:
```typescript
interface ExtractionError {
  type: 'validation_failed' | 'regex_no_match' | 'webscraper_error' | 'no_images_found' | 'timeout' | 'network_error';
  message: string;
  details?: any;
  strategy?: string;
  itemId?: string; // item.link vagy item.title hash
}

interface ExtractionAttempt {
  strategy: string;
  success: boolean;
  result?: string;
  error?: ExtractionError;
  duration: number; // ms
  confidence?: number;
}

interface DetailedExtractionResult {
  success: boolean;
  imageUrl?: string;
  source?: string;
  confidence?: number;
  attempts: ExtractionAttempt[];
  totalDuration: number;
  errors: ExtractionError[];
  warnings: string[];
  itemInfo: {
    title?: string;
    link?: string;
    feedUrl?: string;
  };
}

async function extractImageWithDetailedDebugging(
  item: RssItem, 
  feedUrl?: string
): Promise<DetailedExtractionResult> {
  const startTime = Date.now();
  const attempts: ExtractionAttempt[] = [];
  const errors: ExtractionError[] = [];
  const warnings: string[] = [];
  
  // Item információ
  const itemInfo = {
    title: item.title,
    link: item.link,
    feedUrl
  };
  
  // 1. Szinkron stratégiák kipróbálása
  for (const strategy of SYNC_STRATEGIES) {
    const attemptStart = Date.now();
    
    try {
      const imageUrl = strategy.func(item);
      const duration = Date.now() - attemptStart;
      
      if (imageUrl) {
        const validatedUrl = validateAndCleanImageUrl(imageUrl, item.link);
        
        if (validatedUrl) {
          attempts.push({
            strategy: strategy.name,
            success: true,
            result: validatedUrl,
            duration,
            confidence: strategy.confidence
          });
          
          return {
            success: true,
            imageUrl: validatedUrl,
            source: strategy.name,
            confidence: strategy.confidence,
            attempts,
            totalDuration: Date.now() - startTime,
            errors,
            warnings,
            itemInfo
          };
        } else {
          attempts.push({
            strategy: strategy.name,
            success: false,
            error: {
              type: 'validation_failed',
              message: `URL validation failed for: ${imageUrl}`,
              strategy: strategy.name
            },
            duration
          });
          
          errors.push({
            type: 'validation_failed',
            message: `URL validation failed for: ${imageUrl}`,
            strategy: strategy.name
          });
        }
      } else {
        attempts.push({
          strategy: strategy.name,
          success: false,
          error: {
            type: 'no_images_found',
            message: `No images found in ${strategy.name}`,
            strategy: strategy.name
          },
          duration
        });
      }
    } catch (error) {
      const duration = Date.now() - attemptStart;
      const extractionError: ExtractionError = {
        type: 'regex_no_match',
        message: `Strategy ${strategy.name} failed: ${error.message}`,
        strategy: strategy.name,
        details: error
      };
      
      attempts.push({
        strategy: strategy.name,
        success: false,
        error: extractionError,
        duration
      });
      
      errors.push(extractionError);
    }
  }
  
  // 2. Web scraping (ha minden szinkron stratégia sikertelen)
  try {
    const scrapingStart = Date.now();
    const webScrapedImage = await extractImageFromWebPage(item);
    const duration = Date.now() - scrapingStart;
    
    if (webScrapedImage) {
      const validatedUrl = validateAndCleanImageUrl(webScrapedImage);
      
      if (validatedUrl) {
        attempts.push({
          strategy: 'web-scraping',
          success: true,
          result: validatedUrl,
          duration,
          confidence: 0.3
        });
        
        return {
          success: true,
          imageUrl: validatedUrl,
          source: 'web-scraping',
          confidence: 0.3,
          attempts,
          totalDuration: Date.now() - startTime,
          errors,
          warnings,
          itemInfo
        };
      } else {
        attempts.push({
          strategy: 'web-scraping',
          success: false,
          error: {
            type: 'validation_failed',
            message: 'Web scraped image validation failed',
            strategy: 'web-scraping'
          },
          duration
        });
      }
    } else {
      attempts.push({
        strategy: 'web-scraping',
        success: false,
        error: {
          type: 'no_images_found',
          message: 'No images found via web scraping',
          strategy: 'web-scraping'
        },
        duration
      });
    }
  } catch (error) {
    const duration = Date.now() - scrapingStart;
    const extractionError: ExtractionError = {
      type: 'webscraper_error',
      message: `Web scraping failed: ${error.message}`,
      strategy: 'web-scraping',
      details: error
    };
    
    attempts.push({
      strategy: 'web-scraping',
      success: false,
      error: extractionError,
      duration
    });
    
    errors.push(extractionError);
  }
  
  // Sikertelen kinyerés
  return {
    success: false,
    attempts,
    totalDuration: Date.now() - startTime,
    errors,
    warnings,
    itemInfo
  };
}
```

#### 3. **Statisztikák Kiterjesztése**

**Javaslat**:
```typescript
interface DetailedExtractionStats {
  // Alapvető statisztikák
  total: number;
  successful: number;
  failed: number;
  successRate: number;
  
  // Stratégia statisztikák
  byStrategy: Record<string, {
    attempts: number;
    successes: number;
    failures: number;
    successRate: number;
    averageConfidence: number;
    averageDuration: number;
  }>;
  
  // Hiba statisztikák
  byErrorType: Record<string, number>;
  
  // Feed statisztikák
  byFeed: Record<string, {
    total: number;
    successful: number;
    failed: number;
    successRate: number;
    problematicItems: string[]; // item.link vagy title
  }>;
  
  // Teljesítmény statisztikák
  performance: {
    averageExtractionTime: number;
    slowestStrategies: Array<{ strategy: string; averageTime: number }>;
    fastestStrategies: Array<{ strategy: string; averageTime: number }>;
  };
  
  // Sikertelen item-ek listája
  failedItems: Array<{
    itemInfo: { title?: string; link?: string; feedUrl?: string };
    errors: ExtractionError[];
    attempts: ExtractionAttempt[];
  }>;
  
  // Figyelmeztetések
  warnings: string[];
}

function generateDetailedExtractionStats(
  results: DetailedExtractionResult[]
): DetailedExtractionStats {
  const stats: DetailedExtractionStats = {
    total: results.length,
    successful: results.filter(r => r.success).length,
    failed: results.filter(r => !r.success).length,
    successRate: 0,
    
    byStrategy: {},
    byErrorType: {},
    byFeed: {},
    
    performance: {
      averageExtractionTime: 0,
      slowestStrategies: [],
      fastestStrategies: []
    },
    
    failedItems: [],
    warnings: []
  };
  
  // Sikertelenségi ráta
  stats.successRate = stats.total > 0 ? (stats.successful / stats.total) * 100 : 0;
  
  // Stratégia statisztikák
  const strategyStats: Record<string, any> = {};
  
  for (const result of results) {
    for (const attempt of result.attempts) {
      if (!strategyStats[attempt.strategy]) {
        strategyStats[attempt.strategy] = {
          attempts: 0,
          successes: 0,
          failures: 0,
          totalConfidence: 0,
          totalDuration: 0
        };
      }
      
      strategyStats[attempt.strategy].attempts++;
      strategyStats[attempt.strategy].totalDuration += attempt.duration;
      
      if (attempt.success) {
        strategyStats[attempt.strategy].successes++;
        if (attempt.confidence) {
          strategyStats[attempt.strategy].totalConfidence += attempt.confidence;
        }
      } else {
        strategyStats[attempt.strategy].failures++;
      }
    }
  }
  
  // Stratégia statisztikák számítása
  for (const [strategy, data] of Object.entries(strategyStats)) {
    stats.byStrategy[strategy] = {
      attempts: data.attempts,
      successes: data.successes,
      failures: data.failures,
      successRate: data.attempts > 0 ? (data.successes / data.attempts) * 100 : 0,
      averageConfidence: data.successes > 0 ? data.totalConfidence / data.successes : 0,
      averageDuration: data.attempts > 0 ? data.totalDuration / data.attempts : 0
    };
  }
  
  // Hiba statisztikák
  for (const result of results) {
    for (const error of result.errors) {
      stats.byErrorType[error.type] = (stats.byErrorType[error.type] || 0) + 1;
    }
  }
  
  // Feed statisztikák
  for (const result of results) {
    const feedUrl = result.itemInfo.feedUrl || 'unknown';
    
    if (!stats.byFeed[feedUrl]) {
      stats.byFeed[feedUrl] = {
        total: 0,
        successful: 0,
        failed: 0,
        successRate: 0,
        problematicItems: []
      };
    }
    
    stats.byFeed[feedUrl].total++;
    
    if (result.success) {
      stats.byFeed[feedUrl].successful++;
    } else {
      stats.byFeed[feedUrl].failed++;
      if (result.itemInfo.link) {
        stats.byFeed[feedUrl].problematicItems.push(result.itemInfo.link);
      }
    }
  }
  
  // Feed sikertelenségi ráták
  for (const feedStats of Object.values(stats.byFeed)) {
    feedStats.successRate = feedStats.total > 0 ? 
      (feedStats.successful / feedStats.total) * 100 : 0;
  }
  
  // Teljesítmény statisztikák
  const totalTime = results.reduce((sum, r) => sum + r.totalDuration, 0);
  stats.performance.averageExtractionTime = stats.total > 0 ? totalTime / stats.total : 0;
  
  // Leglassabb/leggyorsabb stratégiák
  const strategyTimes = Object.entries(stats.byStrategy)
    .map(([strategy, data]) => ({ strategy, averageTime: data.averageDuration }))
    .sort((a, b) => b.averageTime - a.averageTime);
  
  stats.performance.slowestStrategies = strategyTimes.slice(0, 3);
  stats.performance.fastestStrategies = strategyTimes.slice(-3).reverse();
  
  // Sikertelen item-ek
  stats.failedItems = results
    .filter(r => !r.success)
    .map(r => ({
      itemInfo: r.itemInfo,
      errors: r.errors,
      attempts: r.attempts
    }));
  
  return stats;
}
```

#### 4. **Fejlesztői Segédeszközök**

**Javaslat**:
```typescript
// Hibakeresés segédeszközök
export function debugExtractionForItem(
  item: RssItem, 
  feedUrl?: string
): Promise<DetailedExtractionResult> {
  return extractImageWithDetailedDebugging(item, feedUrl);
}

// Sikertelen feed-ek azonosítása
export function identifyProblematicFeeds(
  results: DetailedExtractionResult[],
  threshold: number = 0.5 // 50% sikertelenségi ráta
): Array<{ feedUrl: string; successRate: number; problematicItems: string[] }> {
  const feedStats = new Map<string, { successful: number; total: number; items: string[] }>();
  
  for (const result of results) {
    const feedUrl = result.itemInfo.feedUrl || 'unknown';
    const current = feedStats.get(feedUrl) || { successful: 0, total: 0, items: [] };
    
    current.total++;
    if (result.success) {
      current.successful++;
    } else if (result.itemInfo.link) {
      current.items.push(result.itemInfo.link);
    }
    
    feedStats.set(feedUrl, current);
  }
  
  return Array.from(feedStats.entries())
    .map(([feedUrl, stats]) => ({
      feedUrl,
      successRate: stats.total > 0 ? stats.successful / stats.total : 0,
      problematicItems: stats.items
    }))
    .filter(feed => feed.successRate < threshold)
    .sort((a, b) => a.successRate - b.successRate);
}

// Részletes hibajelentés generálása
export function generateErrorReport(
  results: DetailedExtractionResult[]
): string {
  const stats = generateDetailedExtractionStats(results);
  const problematicFeeds = identifyProblematicFeeds(results);
  
  let report = `# Képkinyerési Hibajelentés\n\n`;
  
  report += `## Összefoglaló\n`;
  report += `- Összes item: ${stats.total}\n`;
  report += `- Sikeres kinyerés: ${stats.successful}\n`;
  report += `- Sikertelen kinyerés: ${stats.failed}\n`;
  report += `- Sikertelenségi ráta: ${stats.successRate.toFixed(1)}%\n\n`;
  
  report += `## Stratégia Statisztikák\n`;
  for (const [strategy, data] of Object.entries(stats.byStrategy)) {
    report += `- ${strategy}: ${data.successRate.toFixed(1)}% (${data.successes}/${data.attempts})\n`;
  }
  report += `\n`;
  
  report += `## Problémás Feed-ek\n`;
  for (const feed of problematicFeeds) {
    report += `- ${feed.feedUrl}: ${(feed.successRate * 100).toFixed(1)}% sikertelenség\n`;
  }
  report += `\n`;
  
  report += `## Hiba Típusok\n`;
  for (const [errorType, count] of Object.entries(stats.byErrorType)) {
    report += `- ${errorType}: ${count} alkalommal\n`;
  }
  
  return report;
}
```

### 🎯 **Implementációs Prioritás**

1. **Magas prioritás**: Részletes hibajelentés
2. **Közepes prioritás**: Statisztikák kiterjesztése
3. **Alacsony prioritás**: Fejlesztői segédeszközök

### 💡 **Következő Lépések**

1. **Implementáljuk a részletes hibajelentést** - `DetailedExtractionResult`
2. **Adjunk hozzá statisztikák kiterjesztést** - Feed és stratégia szintű
3. **Fejlesszük a hibakeresési eszközöket** - Debug és report funkciók
4. **Optimalizáljuk a teljesítményt** - Logging és monitoring

=============================================

## 🎯 **Teljesítmény Nagy Tételek Esetén - Kritikai Elemzés**

### ✅ **Egyetértek a Problémákkal**

#### 1. **Jelenlegi Teljesítmény Korlátozások**

**Jelenlegi probléma**: Nagy mennyiségű item feldolgozásakor memória és CPU túlterhelés.

**Jelenlegi kód**:
```typescript
export async function extractImagesFromItems(items: RssItem[]): Promise<ImageExtractionResult[]> {
  return Promise.all(items.map((item) => extractImageWithDetails(item)));
}
```

**Problémák**:
- **Memória túlcsordulás**: Minden item egyszerre memóriában
- **CPU túlterhelés**: Túl sok párhuzamos feldolgozás
- **Hálózati túlterhelés**: Web scraping párhuzamosan
- **Nincs rate limiting**: Túl sok kérés egyszerre

#### 2. **Batch Feldolgozás és Limitálás Javaslata**

**Javaslat**:
```typescript
interface BatchProcessingOptions {
  batchSize: number; // Hány item feldolgozása egyszerre
  maxConcurrency: number; // Párhuzamos feldolgozások száma
  timeout: number; // ms, egy item feldolgozási időkorlát
  memoryLimit: number; // MB, memória limit
  rateLimit: number; // ms, kérések között várakozás
}

interface BatchProcessingResult {
  results: ImageExtractionResult[];
  stats: {
    totalProcessed: number;
    successful: number;
    failed: number;
    totalTime: number;
    averageTimePerItem: number;
    memoryUsage: number;
  };
  errors: Array<{ itemIndex: number; error: Error }>;
}

async function extractImagesInBatches(
  items: RssItem[],
  options: BatchProcessingOptions = {
    batchSize: 50,
    maxConcurrency: 10,
    timeout: 10000,
    memoryLimit: 512, // 512 MB
    rateLimit: 100 // 100ms kérések között
  }
): Promise<BatchProcessingResult> {
  const startTime = Date.now();
  const results: ImageExtractionResult[] = [];
  const errors: Array<{ itemIndex: number; error: Error }> = [];
  
  // 1. Batch-ok létrehozása
  const batches: RssItem[][] = [];
  for (let i = 0; i < items.length; i += options.batchSize) {
    batches.push(items.slice(i, i + options.batchSize));
  }
  
  console.log(`[Batch Processing] ${items.length} items split into ${batches.length} batches`);
  
  // 2. Batch-ok feldolgozása
  for (let batchIndex = 0; batchIndex < batches.length; batchIndex++) {
    const batch = batches[batchIndex];
    console.log(`[Batch ${batchIndex + 1}/${batches.length}] Processing ${batch.length} items`);
    
    // Memória ellenőrzés
    const memoryUsage = process.memoryUsage().heapUsed / 1024 / 1024; // MB
    if (memoryUsage > options.memoryLimit) {
      console.warn(`[Batch Processing] Memory usage high: ${memoryUsage.toFixed(2)} MB`);
      // Garbage collection kényszerítése
      if (global.gc) {
        global.gc();
      }
    }
    
    // Batch feldolgozása párhuzamosan, de limitáltan
    const batchResults = await processBatchWithConcurrencyLimit(
      batch, 
      options.maxConcurrency,
      options.timeout,
      options.rateLimit
    );
    
    results.push(...batchResults.results);
    errors.push(...batchResults.errors);
    
    // Rate limiting batch-ok között
    if (batchIndex < batches.length - 1) {
      await new Promise(resolve => setTimeout(resolve, options.rateLimit));
    }
  }
  
  const totalTime = Date.now() - startTime;
  const successful = results.filter(r => r.imageUrl).length;
  const failed = results.length - successful;
  
  return {
    results,
    stats: {
      totalProcessed: items.length,
      successful,
      failed,
      totalTime,
      averageTimePerItem: totalTime / items.length,
      memoryUsage: process.memoryUsage().heapUsed / 1024 / 1024
    },
    errors
  };
}

async function processBatchWithConcurrencyLimit(
  items: RssItem[],
  maxConcurrency: number,
  timeout: number,
  rateLimit: number
): Promise<{ results: ImageExtractionResult[]; errors: Array<{ itemIndex: number; error: Error }> }> {
  const results: ImageExtractionResult[] = [];
  const errors: Array<{ itemIndex: number; error: Error }> = [];
  
  // Párhuzamos feldolgozás limitálással
  const chunks: RssItem[][] = [];
  for (let i = 0; i < items.length; i += maxConcurrency) {
    chunks.push(items.slice(i, i + maxConcurrency));
  }
  
  for (const chunk of chunks) {
    const chunkPromises = chunk.map(async (item, index) => {
      const itemIndex = items.indexOf(item);
      
      try {
        // Timeout beállítása
        const result = await Promise.race([
          extractImageWithDetails(item),
          new Promise<ImageExtractionResult>((_, reject) => 
            setTimeout(() => reject(new Error('Timeout')), timeout)
          )
        ]);
        
        return { result, itemIndex };
      } catch (error) {
        return { error: error as Error, itemIndex };
      }
    });
    
    const chunkResults = await Promise.all(chunkPromises);
    
    for (const { result, error, itemIndex } of chunkResults) {
      if (error) {
        errors.push({ itemIndex, error });
        results.push({
          imageUrl: '',
          source: 'none',
          confidence: 0
        });
      } else {
        results.push(result);
      }
    }
    
    // Rate limiting chunk-ok között
    if (chunks.indexOf(chunk) < chunks.length - 1) {
      await new Promise(resolve => setTimeout(resolve, rateLimit));
    }
  }
  
  return { results, errors };
}
```

#### 3. **Aszinkron Feldolgozás Optimalizálása**

**Javaslat**:
```typescript
import pLimit from 'p-limit';

interface AsyncProcessingOptions {
  concurrency: number;
  timeout: number;
  retries: number;
  backoff: number; // ms, exponenciális backoff
}

async function extractImagesWithConcurrencyControl(
  items: RssItem[],
  options: AsyncProcessingOptions = {
    concurrency: 5,
    timeout: 8000,
    retries: 2,
    backoff: 1000
  }
): Promise<ImageExtractionResult[]> {
  const limit = pLimit(options.concurrency);
  const results: ImageExtractionResult[] = [];
  
  const promises = items.map((item, index) => 
    limit(async () => {
      let lastError: Error;
      
      for (let attempt = 0; attempt <= options.retries; attempt++) {
        try {
          const result = await Promise.race([
            extractImageWithDetails(item),
            new Promise<ImageExtractionResult>((_, reject) => 
              setTimeout(() => reject(new Error('Timeout')), options.timeout)
            )
          ]);
          
          return result;
        } catch (error) {
          lastError = error as Error;
          
          if (attempt < options.retries) {
            // Exponenciális backoff
            const delay = options.backoff * Math.pow(2, attempt);
            await new Promise(resolve => setTimeout(resolve, delay));
          }
        }
      }
      
      // Minden próbálkozás sikertelen
      console.warn(`[Concurrency Control] Item ${index} failed after ${options.retries} retries:`, lastError?.message);
      
      return {
        imageUrl: '',
        source: 'none',
        confidence: 0
      };
    })
  );
  
  return Promise.all(promises);
}
```

#### 4. **Memória Optimalizálás**

**Javaslat**:
```typescript
class MemoryOptimizedProcessor {
  private memoryThreshold: number;
  private gcInterval: number;
  private lastGc: number = 0;
  
  constructor(memoryThreshold: number = 512, gcInterval: number = 30000) {
    this.memoryThreshold = memoryThreshold;
    this.gcInterval = gcInterval;
  }
  
  private checkMemoryUsage(): void {
    const memoryUsage = process.memoryUsage().heapUsed / 1024 / 1024; // MB
    const timeSinceLastGc = Date.now() - this.lastGc;
    
    if (memoryUsage > this.memoryThreshold && timeSinceLastGc > this.gcInterval) {
      console.log(`[Memory Optimizer] High memory usage: ${memoryUsage.toFixed(2)} MB, forcing GC`);
      
      if (global.gc) {
        global.gc();
        this.lastGc = Date.now();
      }
    }
  }
  
  async processWithMemoryOptimization<T>(
    items: any[],
    processor: (item: any) => Promise<T>,
    batchSize: number = 100
  ): Promise<T[]> {
    const results: T[] = [];
    
    for (let i = 0; i < items.length; i += batchSize) {
      const batch = items.slice(i, i + batchSize);
      
      // Memória ellenőrzés minden batch előtt
      this.checkMemoryUsage();
      
      const batchResults = await Promise.all(
        batch.map(item => processor(item))
      );
      
      results.push(...batchResults);
      
      // Batch eredmények felszabadítása
      batch.length = 0;
    }
    
    return results;
  }
}

// Használat
const memoryOptimizer = new MemoryOptimizedProcessor();
const results = await memoryOptimizer.processWithMemoryOptimization(
  items,
  item => extractImageWithDetails(item),
  50 // batch size
);
```

#### 5. **Teljesítmény Monitoring**

**Javaslat**:
```typescript
interface PerformanceMetrics {
  startTime: number;
  endTime: number;
  totalTime: number;
  itemsProcessed: number;
  itemsPerSecond: number;
  memoryUsage: {
    start: number;
    peak: number;
    end: number;
  };
  concurrency: {
    average: number;
    peak: number;
  };
}

class PerformanceMonitor {
  private startTime: number;
  private peakMemory: number = 0;
  private concurrencyCount: number = 0;
  private peakConcurrency: number = 0;
  
  start(): void {
    this.startTime = Date.now();
    this.peakMemory = process.memoryUsage().heapUsed / 1024 / 1024;
  }
  
  updateConcurrency(count: number): void {
    this.concurrencyCount = count;
    this.peakConcurrency = Math.max(this.peakConcurrency, count);
  }
  
  updateMemory(): void {
    const currentMemory = process.memoryUsage().heapUsed / 1024 / 1024;
    this.peakMemory = Math.max(this.peakMemory, currentMemory);
  }
  
  end(itemsProcessed: number): PerformanceMetrics {
    const endTime = Date.now();
    const totalTime = endTime - this.startTime;
    
    return {
      startTime: this.startTime,
      endTime,
      totalTime,
      itemsProcessed,
      itemsPerSecond: itemsProcessed / (totalTime / 1000),
      memoryUsage: {
        start: process.memoryUsage().heapUsed / 1024 / 1024,
        peak: this.peakMemory,
        end: process.memoryUsage().heapUsed / 1024 / 1024
      },
      concurrency: {
        average: this.concurrencyCount,
        peak: this.peakConcurrency
      }
    };
  }
}
```

### 🎯 **Implementációs Prioritás**

1. **Magas prioritás**: Batch feldolgozás és concurrency limit
2. **Közepes prioritás**: Memória optimalizálás
3. **Alacsony prioritás**: Teljesítmény monitoring

### 💡 **Következő Lépések**

1. **Implementáljuk a batch feldolgozást** - Memória és CPU optimalizálás
2. **Adjunk hozzá concurrency kontrollt** - p-limit vagy saját megoldás
3. **Fejlesszük a memória kezelést** - GC és monitoring
4. **Optimalizáljuk a teljesítményt** - Monitoring és tuning

=======================================

## 🎯 **Kód Olvashatósága és Egyértelműség - Kritikai Elemzés**

### ✅ **Egyetértek a Problémákkal**

#### 1. **Jelenlegi RssItem Interface Problémái**

**Jelenlegi probléma**: A `RssItem` interface túl bonyolult és "gépies".

**Jelenlegi kód**:
```typescript
interface RssItem {
  // ... alapvető mezők ...
  
  // KÉPHEZ KAPCSOLÓDÓ MEZŐK
  enclosure?:
    | { $: { url?: string; type?: string; width?: string; height?: string } }
    | Array<{ $: { url?: string; type?: string; width?: string; height?: string } }>;
  image?:
    | { url?: string | string[]; width?: string; height?: string }
    | string
    | Array<{ url?: string | string[] }>;
  [MEDIA_CONTENT_FIELD]?: {
    $: { url?: string };
    [MEDIA_THUMBNAIL_FIELD]?: { $: { url?: string } };
  };
  // ... további mezők ...
}
```

**Problémák**:
- **Túl bonyolult típusok**: Union típusok és nested objektumok
- **Ismétlődő struktúrák**: `$` objektumok mindenhol
- **Nehéz olvashatóság**: A logika elrejtett a típusokban
- **Nehéz karbantarthatóság**: Módosítások bonyolultak

#### 2. **Típusbiztosabb Objektumok Javaslata**

**Javaslat**:
```typescript
// ✅ ÚJ: Alapvető típusok
interface ImageAttributes {
  url?: string;
  type?: string;
  width?: string;
  height?: string;
}

interface EnclosureItem {
  $: ImageAttributes;
}

interface MediaContentItem {
  $: { url?: string };
  [MEDIA_THUMBNAIL_FIELD]?: { $: { url?: string } };
}

interface MediaThumbnailItem {
  $: ImageAttributes;
}

interface ImageTagItem {
  url?: string | string[];
  width?: string;
  height?: string;
}

// ✅ ÚJ: Egyszerűsített RssItem interface
interface RssItem {
  title?: string;
  description?: string;
  link?: string;
  pubDate?: string;
  category?: string | string[];
  timestamp?: number;

  // Képmezők - egyszerűsített típusok
  enclosure?: EnclosureItem | EnclosureItem[];
  image?: ImageTagItem | string | Array<{ url?: string | string[] }>;
  [MEDIA_CONTENT_FIELD]?: MediaContentItem | MediaContentItem[];
  [MEDIA_THUMBNAIL_FIELD]?: MediaThumbnailItem | MediaThumbnailItem[];
  [CONTENT_ENCODED_FIELD]?: string | string[];
}
```

#### 3. **Segédfüggvények Nested Adatok Kinyeréséhez**

**Javaslat**:
```typescript
// ✅ ÚJ: Biztonságos nested adat kinyerés
class SafeDataExtractor {
  /**
   * Biztonságos URL kinyerés enclosure-ből
   */
  static extractEnclosureUrl(enclosure: EnclosureItem | EnclosureItem[] | undefined): string | null {
    if (!enclosure) return null;
    
    if (Array.isArray(enclosure)) {
      // Több enclosure - válasszuk a legjobbat
      const imageEnclosures = enclosure.filter(
        enc => enc.$?.type?.startsWith('image/') && enc.$?.url
      );
      
      if (imageEnclosures.length === 0) return null;
      
      // Válasszuk a legnagyobb méretűt
      return imageEnclosures.reduce((best, current) => {
        const bestWidth = parseInt(best.$.width || '0');
        const currentWidth = parseInt(current.$.width || '0');
        return currentWidth > bestWidth ? current : best;
      }).$.url || null;
    } else {
      // Egy enclosure
      return enclosure.$?.type?.startsWith('image/') && enclosure.$?.url 
        ? enclosure.$.url 
        : null;
    }
  }
  
  /**
   * Biztonságos URL kinyerés image tag-ből
   */
  static extractImageTagUrl(image: ImageTagItem | string | Array<{ url?: string | string[] }> | undefined): string | null {
    if (!image) return null;
    
    if (typeof image === 'string') {
      return image;
    }
    
    if (Array.isArray(image)) {
      // Array of image objects
      const firstImage = image[0];
      if (!firstImage) return null;
      
      const url = firstImage.url;
      return Array.isArray(url) ? url[0] || null : url || null;
    }
    
    if (typeof image === 'object' && 'url' in image) {
      const url = image.url;
      return Array.isArray(url) ? url[0] || null : url || null;
    }
    
    return null;
  }
  
  /**
   * Biztonságos URL kinyerés media:thumbnail-ből
   */
  static extractMediaThumbnailUrl(
    thumbnail: MediaThumbnailItem | MediaThumbnailItem[] | undefined
  ): string | null {
    if (!thumbnail) return null;
    
    if (Array.isArray(thumbnail)) {
      // Több thumbnail - válasszuk az elsőt
      for (const thumb of thumbnail) {
        if (thumb.$?.url) {
          return thumb.$.url;
        }
      }
      return null;
    } else {
      // Egy thumbnail
      return thumbnail.$?.url || null;
    }
  }
  
  /**
   * Biztonságos URL kinyerés media:content-ből
   */
  static extractMediaContentUrl(
    content: MediaContentItem | MediaContentItem[] | undefined
  ): string | null {
    if (!content) return null;
    
    if (Array.isArray(content)) {
      // Több media content - keressük a képet
      for (const mc of content) {
        if (mc.$?.url && !mc.$?.url.includes('youtube.com')) {
          return mc.$.url;
        }
      }
      return null;
    } else {
      // Egy media content
      return content.$?.url && !content.$?.url.includes('youtube.com') 
        ? content.$.url 
        : null;
    }
  }
  
  /**
   * Biztonságos attribútum kinyerés
   */
  static extractImageAttributes(
    item: RssItem, 
    source: string
  ): ImageAttributes | null {
    switch (source) {
      case 'enclosure':
        const enclosure = item.enclosure;
        if (Array.isArray(enclosure)) {
          return enclosure[0]?.$ || null;
        }
        return enclosure?.$ || null;
        
      case 'media:thumbnail':
        const thumbnail = item[MEDIA_THUMBNAIL_FIELD];
        if (Array.isArray(thumbnail)) {
          return thumbnail[0]?.$ || null;
        }
        return thumbnail?.$ || null;
        
      case 'media:content':
        const content = item[MEDIA_CONTENT_FIELD];
        if (Array.isArray(content)) {
          return content[0]?.$ || null;
        }
        return content?.$ || null;
        
      case 'image-tag':
        const image = item.image;
        if (typeof image === 'object' && 'url' in image) {
          return {
            url: Array.isArray(image.url) ? image.url[0] : image.url,
            width: image.width,
            height: image.height
          };
        }
        return null;
        
      default:
        return null;
    }
  }
}
```

#### 4. **Egyszerűsített Stratégia Függvények**

**Javaslat**:
```typescript
// ✅ ÚJ: Egyszerűsített képkinyerési függvények
function extractImageFromEnclosure(item: RssItem): string | null {
  return SafeDataExtractor.extractEnclosureUrl(item.enclosure);
}

function extractImageFromImageTag(item: RssItem): string | null {
  const rawUrl = SafeDataExtractor.extractImageTagUrl(item.image);
  if (!rawUrl) return null;
  
  // CDATA tisztítás
  return rawUrl.replace(CDATA_REGEX, '').trim();
}

function extractImageFromMediaThumbnail(item: RssItem): string | null {
  // 1. Közvetlen media:thumbnail
  const directUrl = SafeDataExtractor.extractMediaThumbnailUrl(
    item[MEDIA_THUMBNAIL_FIELD]
  );
  if (directUrl) return directUrl;
  
  // 2. Beágyazott media:content > media:thumbnail
  const mediaContent = item[MEDIA_CONTENT_FIELD];
  if (Array.isArray(mediaContent)) {
    for (const mc of mediaContent) {
      const thumbnail = mc[MEDIA_THUMBNAIL_FIELD];
      const url = SafeDataExtractor.extractMediaThumbnailUrl(thumbnail);
      if (url) return url;
    }
  } else if (mediaContent) {
    const thumbnail = mediaContent[MEDIA_THUMBNAIL_FIELD];
    const url = SafeDataExtractor.extractMediaThumbnailUrl(thumbnail);
    if (url) return url;
  }
  
  return null;
}

function extractImageFromMediaContent(item: RssItem): string | null {
  return SafeDataExtractor.extractMediaContentUrl(item[MEDIA_CONTENT_FIELD]);
}
```

#### 5. **Típus Biztonság Javítása**

**Javaslat**:
```typescript
// ✅ ÚJ: Típus biztonságos konstansok
const RSS_FIELDS = {
  MEDIA_CONTENT: 'media:content' as const,
  MEDIA_THUMBNAIL: 'media:thumbnail' as const,
  CONTENT_ENCODED: 'content:encoded' as const
} as const;

// ✅ ÚJ: Típus biztonságos interfész
interface TypedRssItem {
  title?: string;
  description?: string;
  link?: string;
  pubDate?: string;
  category?: string | string[];
  timestamp?: number;
  
  // Típus biztonságos képmezők
  enclosure?: EnclosureItem | EnclosureItem[];
  image?: ImageTagItem | string | Array<{ url?: string | string[] }>;
  [RSS_FIELDS.MEDIA_CONTENT]?: MediaContentItem | MediaContentItem[];
  [RSS_FIELDS.MEDIA_THUMBNAIL]?: MediaThumbnailItem | MediaThumbnailItem[];
  [RSS_FIELDS.CONTENT_ENCODED]?: string | string[];
}

// ✅ ÚJ: Típus biztonságos segédfüggvények
function getTypedField<T extends keyof TypedRssItem>(
  item: TypedRssItem, 
  field: T
): TypedRssItem[T] {
  return item[field];
}

// Használat
const mediaContent = getTypedField(item, RSS_FIELDS.MEDIA_CONTENT);
const contentEncoded = getTypedField(item, RSS_FIELDS.CONTENT_ENCODED);
```

#### 6. **Kód Dokumentáció Javítása**

**Javaslat**:
```typescript
/**
 * Biztonságos képkinyerés RSS item-ből
 * 
 * @param item - RSS feed item
 * @param strategy - Képkinyerési stratégia neve
 * @returns Kép URL vagy null
 * 
 * @example
 * ```typescript
 * const url = extractImageSafely(item, 'enclosure');
 * if (url) {
 *   console.log('Kép találva:', url);
 * }
 * ```
 */
function extractImageSafely(item: RssItem, strategy: string): string | null {
  switch (strategy) {
    case 'enclosure':
      return SafeDataExtractor.extractEnclosureUrl(item.enclosure);
    case 'image-tag':
      return SafeDataExtractor.extractImageTagUrl(item.image);
    case 'media-thumbnail':
      return extractImageFromMediaThumbnail(item);
    case 'media-content':
      return SafeDataExtractor.extractMediaContentUrl(item[MEDIA_CONTENT_FIELD]);
    default:
      console.warn(`[extractImageSafely] Ismeretlen stratégia: ${strategy}`);
      return null;
  }
}
```

### 🎯 **Implementációs Prioritás**

1. **Magas prioritás**: Segédfüggvények létrehozása
2. **Közepes prioritás**: Típusbiztosabb interfészek
3. **Alacsony prioritás**: Kód dokumentáció javítása

### 💡 **Következő Lépések**

1. **Implementáljuk a SafeDataExtractor osztályt** - Biztonságos nested adat kinyerés
2. **Egyszerűsítsük a RssItem interfészt** - Típusbiztosabb mezők
3. **Refaktoráljuk a stratégia függvényeket** - Olvashatóbb kód
4. **Adjunk hozzá típus biztonságot** - Const assertions és generics

==============================================

## 🎯 **Összefoglaló - Kritikai Elemzés és Fejlesztési Terv**

### ✅ **Jelenlegi Kód Erősségei**

- **Moduláris felépítés**: Különböző stratégiák jól szeparáltak
- **Konfidencia rendszer**: Rangsorolás alapú képválasztás
- **Web scraping integráció**: Hiányzó adatok pótlása
- **Optimalizált regex**: Előre kompilált objektumok
- **Közös magfüggvény**: Kód duplikáció minimalizálása

### 🚀 **Kritikus Fejlesztési Területek**

#### 1. **Intelligens Képválasztás és Rangsorolás**
```typescript
// ✅ PRIORITÁS 1: Több kép kinyerése és rangsorolás
interface ImageCandidate {
  url: string;
  source: string;
  confidence: number;
  qualityMetrics: ImageQualityMetrics;
  relevanceToArticle: ImageRelevanceToArticle;
  logoDetection: LogoDetectionResult;
  priority: number; // 1-10, magasabb = jobb
}

async function extractAllImageCandidates(item: RssItem): Promise<ImageCandidate[]> {
  // 1. Minden stratégia kipróbálása
  // 2. Képminőség elemzés
  // 3. Cikk relevancia elemzés
  // 4. Logo felismerés
  // 5. Prioritás számítás
  // 6. Rangsorolás
}
```

#### 2. **Intelligens Web Scraping**
```typescript
// ✅ PRIORITÁS 2: Web scraping optimalizálás
interface ScrapingStrategy {
  shouldScrape: (item: RssItem, rssResults: ImageCandidate[]) => boolean;
  priority: number;
  maxRetries: number;
  timeout: number;
}

async function intelligentWebScraping(
  item: RssItem, 
  rssResults: ImageCandidate[]
): Promise<ImageCandidate[]> {
  // 1. Csak akkor scraping, ha nincs jó RSS kép
  // 2. Kép relevancia elemzés DOM alapján
  // 3. Logo és oldalsáv kép szűrés
  // 4. Hibakezelés és retry logika
}
```

#### 3. **Robusztus HTML Feldolgozás**
```typescript
// ✅ PRIORITÁS 3: DOM parser integráció
import * as cheerio from 'cheerio';

function robustHtmlCleaner(content: string): CleanedContent {
  // 1. HTML entitások dekódolása
  // 2. CDATA és script tag-ek eltávolítása
  // 3. Cheerio DOM parser használata
  // 4. Strukturált képkinyerés
  // 5. Minőség elemzés
}

function extractImagesWithDOM(content: string): string[] {
  const $ = cheerio.load(content);
  const images: string[] = [];
  
  $('img').each((_, element) => {
    const src = $(element).attr('src');
    const dataSrc = $(element).attr('data-src');
    const dataLazySrc = $(element).attr('data-lazy-src');
    
    if (src) images.push(src);
    if (dataSrc) images.push(dataSrc);
    if (dataLazySrc) images.push(dataLazySrc);
  });
  
  return images.filter(url => validateAndCleanImageUrl(url));
}
```

#### 4. **Teljesítmény Optimalizálás**
```typescript
// ✅ PRIORITÁS 4: Batch feldolgozás és concurrency
async function extractImagesInBatches(
  items: RssItem[],
  options: BatchProcessingOptions
): Promise<BatchProcessingResult> {
  // 1. Batch-ok létrehozása
  // 2. Concurrency limit
  // 3. Memória monitoring
  // 4. Rate limiting
  // 5. Hibakezelés
}
```

#### 5. **Fejlett Hibakezelés**
```typescript
// ✅ PRIORITÁS 5: Részletes diagnosztika
interface DetailedExtractionResult {
  success: boolean;
  imageUrl?: string;
  source?: string;
  confidence?: number;
  attempts: ExtractionAttempt[];
  errors: ExtractionError[];
  warnings: string[];
  itemInfo: { title?: string; link?: string; feedUrl?: string };
}
```

### �� **Implementációs Terv**

#### **1. Fázis - Alapvető Robustness (1-2 hét)**
1. **SafeDataExtractor osztály** - Biztonságos nested adat kinyerés
2. **Több kép kinyerése** - `extractAllImageCandidates`
3. **Intelligens képválasztás** - `selectBestImageFromCandidates`
4. **Részletes hibajelentés** - `DetailedExtractionResult`

#### **2. Fázis - Intelligencia (2-3 hét)**
1. **DOM parser integráció** - Cheerio alapú HTML feldolgozás
2. **Képminőség elemzés** - Méret, aspect ratio, formátum
3. **Logo felismerés** - Globális logo detektálás
4. **Cikk relevancia elemzés** - Domain és path alapú

#### **3. Fázis - Teljesítmény (1-2 hét)**
1. **Batch feldolgozás** - Memória és CPU optimalizálás
2. **Concurrency kontroll** - p-limit vagy saját megoldás
3. **Web scraping optimalizálás** - Intelligens trigger és retry
4. **Cache rendszer** - Kép validáció eredmények

#### **4. Fázis - Monitoring (1 hét)**
1. **Statisztikák kiterjesztése** - Feed és stratégia szintű
2. **Teljesítmény monitoring** - Memory és CPU tracking
3. **Hibakeresési eszközök** - Debug és report funkciók
4. **Fejlesztői dokumentáció** - API és használati példák

### �� **Várható Eredmények**

#### **Robustness Növelése**
- **90%+ sikertelenségi ráta** - Több stratégia kombinációja
- **Hibakezelés** - Graceful degradation
- **Típusbiztonság** - TypeScript optimalizálás

#### **Intelligencia Fejlesztése**
- **Jobb képminőség** - Méret és relevancia alapú választás
- **Logo szűrés** - Automatikus logo felismerés
- **Cikk relevancia** - Tartalomhoz kapcsolódó képek

#### **Teljesítmény Optimalizálás**
- **10x gyorsabb feldolgozás** - Batch és concurrency
- **Memória optimalizálás** - GC és monitoring
- **Skálázhatóság** - 1000+ feed kezelése

### 🚀 **Következő Lépések**

1. **Kezdjük az 1. fázissal** - SafeDataExtractor implementálása
2. **Implementáljuk a több kép kinyerést** - `extractAllImageCandidates`
3. **Adjunk hozzá intelligens képválasztást** - Minőség és relevancia
4. **Fejlesszük a teljesítményt** - Batch feldolgozás

========================================================

