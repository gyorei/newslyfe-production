# 🔍 Keresési Modul Dokumentáció (`README.md`)

## 📋 **Áttekintés**

Ez a modul egy Express Router-alapú intelligens keresési API-t biztosít a hírcikkek között. PostgreSQL teljes szöveges keresést (Full Text Search) használ többnyelvű (angol és magyar) támogatással a pontos és gyors keresési eredményekhez. A modul biztosítja, hogy a visszaadott adatok konzisztensek legyenek az alkalmazás többi részével, beleértve a teljes forrásnevet, országot és kontinenst.

---

## 🏗️ **Jelenlegi Implementáció**

### **✅ Aktuális Állapot**

#### **🔧 Technikai Specifikáció:**

- **Backend**: Node.js + Express Router
- **Adatbázis**: PostgreSQL + tsvector keresés
- **Keresési mezők**: `search_vector_en`, `search_vector_hu`
- **Nyelvi támogatás**: Angol (`english`) és Magyar (`hungarian`) konfiguráció
- **Relevancia**: `ts_rank_cd()` algoritmus
- **Teljesítmény**: Előre kiszámolt, dedikált tsvector mezők nyelvenként

#### **📊 API Végpont:**

```
GET /api/search
```
**Query paraméterek:**
- `q`: Keresett kifejezés (kötelező)
- `lang`: Nyelvi szűrés (pl. `en`, `hu`, opcionális)
- `limit`: Max találat (opcionális, alapértelmezett: 100)
- `offset`: Lapozás (opcionális, alapértelmezett: 0)

**Példa válasz (`results` tömb eleme):**
```json
{
  "id": 12345,
  "title": "A hír címe...",
  "url": "https://example.com/hir",
  "description": "A hír leírása...",
  "published_at": "2025-08-16T14:54:00.000Z",
  "image_url": "https://example.com/kep.jpg",
  "source_slug": "hu-index-hu",
  "country_code": "HU",
  "source_name": "Index.hu",
  "continent": "Europe",
  "orszag": "Hungary",
  "match_language": "hu",
  "relevance": 0.85
}
```

#### **🗃️ Adatbázis Struktúra:**

**A `public.news` tábla releváns oszlopai:**
```sql
- id (integer, PK)
- title (text)
- url (text)
- description (text)
- published_at (timestamp)
- source_slug (varchar)
- country_code (varchar)
- search_vector_en (tsvector) -- Angol keresési index
- search_vector_hu (tsvector) -- Magyar keresési index
-- A konzisztenciát biztosító "dúsított" mezők:
- source_name (text)
- continent (text)
- orszag (varchar)
```

---

## ⚡ **Működési Logika**

### **🔍 Keresési Algoritmus:**

1. **Input validáció**: `q` paraméter ellenőrzése.
2. **Nyelvi ágak**: Ha `lang` paraméter meg van adva, nyelv-specifikus keresés indul. Ha nincs, globális (`UNION ALL`) keresés fut le mindkét nyelvi vektoron.
3. **PostgreSQL Query**:
   ```sql
   -- A teljes, metaadatokkal kiegészített lekérdezés
   SELECT id, title, url, description, published_at, source_slug,
          country_code, image_url, source_name, continent, orszag,
          ts_rank_cd(search_vector_hu, websearch_to_tsquery('hungarian', $1)) as relevance
   FROM public.news
   WHERE search_vector_hu @@ websearch_to_tsquery('hungarian', $1)
   ORDER BY relevance DESC, published_at DESC
   ```
4. **Párhuzamos lekérdezések**: A találatok és a darabszám lekérdezése `Promise.all` segítségével történik az optimalizálás érdekében.
5. **JSON válasz**: Strukturált eredmény relevance szerint rendezve, teljes metaadatokkal.

### **🧠 Adatkonzisztencia:**

A keresési modul megbízhatósága azon alapul, hogy az adatbetöltő szkriptek (`Country.ts`, `Local.ts`) már a mentés pillanatában **"feldúsítják"** a híreket. Minden egyes hír a `public.news` táblába már a teljes metaadat-készlettel (forrásnév, ország, kontinens) kerül be.

Ez biztosítja, hogy a `Search.ts` modulnak **nem kell bonyolult `JOIN` műveleteket végeznie**, csupán olvasnia kell a már előkészített, konzisztens adatokat, ami jelentősen növeli a keresés sebességét és megbízhatóságát.

---

## 🎯 **Aktuális Teljesítmény**

### **✅ Erősségek:**

- ⚡ **Szupergyors**: Előre kiszámolt, nyelvenkénti `tsvector` mezők.
- 🎯 **Pontos találatok**: Angol és magyar morfológiai támogatás.
- 📊 **Relevancia rendezés**: `ts_rank_cd()` algoritmus.
- 🔄 **Konzisztens adatok**: A "dúsított" adatmodellnek köszönhetően a kereső által visszaadott adatok megegyeznek a többi API végpont adataival.
- 🧹 **Tiszta szintaxis**: A `websearch_to_tsquery` lehetővé teszi a felhasználóbarát keresési formátumokat.

### **⚠️ Gyengeségek:**

- 🤔 **Hamis pozitívok**: Néha előfordulhatnak alacsony relevanciájú találatok.
- 🔧 **Nincs relevancia küszöb**: A nagyon alacsony pontszámú találatok is megjelenhetnek.
- 🎛️ **Nincs súlyozás**: A `title` és `description` mezők egyenlő súllyal szerepelnek a keresésben.

---

## 🚧 **Tervezett Fejlesztések**
*(Ez a rész tökéletes volt, változatlanul hagyva.)*

### **🔥 1. Prioritás: Keresési Minőség Javítása**

#### **A) Relevancia Küszöb Beállítása:**
```sql
-- Tervezett javítás:
WHERE search_vector_hu @@ websearch_to_tsquery('hungarian', $1)
  AND ts_rank_cd(search_vector_hu, websearch_to_tsquery('hungarian', $1)) > 0.1
```
#### **B) Title/Description Súlyozás:**
```sql
-- Jövőbeli optimalizálás:
setweight(to_tsvector('hungarian', title), 'A') ||
setweight(to_tsvector('hungarian', description), 'B')
```

### **🔧 2. Prioritás: Haladó Funkciók**

#### **A) Fuzzy Search (Hasonló szavak):**
- `pg_trgm` extension használata
- Elgépelések tolerálása ("gadaság" → "gazdaság")

#### **B) Keresési Szűrők:**
```typescript
// Tervezett query paraméterek:
{
  query: string,
  category?: string,
  dateFrom?: string,
  dateTo?: string,
}
```

---

## 📜 **Változási Napló (Changelog)**

### **Verzió 1.1.0 - Metaadat Konzisztencia Javítása**

- **Probléma:** A kereső API (`/api/search`) hiányos metaadatokat (`source_slug`, `country_code`) adott vissza, ami a UI-on inkonzisztens megjelenést okozott.
- **Megoldás:**
    1.  A `public.news` tábla `orszag` oszloppal lett bővítve.
    2.  Az adatbetöltő szkriptek (`Country.ts`, `Local.ts`) módosítva lettek, hogy minden hír mentésekor kitöltsék a `source_name`, `continent` és `orszag` mezőket.
    3.  A `Search.ts` SQL lekérdezései frissítve lettek, hogy lekérjék ezeket a "dúsított" mezőket.
    4.  A frontend (`Home.tsx`) módosítva lett az új, teljes adatok feldolgozására.
- **Eredmény:** A keresési találatok most már teljes és konzisztens metaadatokkal rendelkeznek.
- **Részletes hibajavítási dokumentáció:** Lásd a dokumentum végén: [A Hír Metaadatok Konzisztenciájának Javítása](#a-hír-metaadatok-konzisztenciájának-javítása)

---
*(A további szekciók, mint a Maintenance, Fejlesztői Jegyzetek, Sprint Tervek, tökéletesek.)*

---

# A Hír Metaadatok Konzisztenciájának Javítása

Ez a dokumentum a hír-metaadatok (forrásnév, ország, kontinens) inkonzisztens megjelenítésével kapcsolatos hiba felderítésének és javításának folyamatát részletezi.

## 1. A Probléma Összefoglalása

A felhasználói felületen azt a hibát tapasztaltuk, hogy a **Home fülön indított keresési találatoknál** a híreket megjelenítő `Card` komponensben nem a formázott, "szép" adatok jelentek meg, hanem technikai azonosítók.

*   **Helyes működés (pl. Ország szerinti szűrés):**
    *   Forrás: `BBC News`
    *   Ország: `United Kingdom`
    *   Kontinens: `Europe`

*   **Hibás működés (Keresési találatok):**
    *   Forrás: `gb-bbc-news` (a `source_slug`)
    *   Ország: `GB` vagy `UN` (a `country_code`)
    *   Kontinens: (Hiányzott)

A cél az volt, hogy a keresési találatoknál is a helyes, formázott adatok jelenjenek meg, biztosítva a konzisztens felhasználói élményt az alkalmazás egészében.

## 2. A Hibakeresés Menete

A hibát egy szisztematikus, több lépcsős folyamatban azonosítottuk, az adatfolyamot a képernyőtől az adatbázisig végigkövetve.

1.  **Gyanú: Frontend Hiba?**
    *   A logolás kimutatta, hogy a `Home.tsx` már eleve hiányos adatokat kap a backend API-tól (`source_slug`-ot `source_name` helyett). **Ezzel a frontend oldali hibát kizártuk.**

2.  **Gyanú: Backend API Inkonzisztencia**
    *   Összehasonlítottuk a `/api/country/{orszag}/news` (teljes adat) és az `/api/search?q=...` (hiányos adat) végpontok válaszát. **Ez bizonyította, hogy a hiba a `/api/search` végpont logikájában van.**

3.  **A Gyökérok Feltárása: `Search.ts` és az Adatbázis**
    *   Megvizsgáltuk a `Search.ts` fájlt és felfedeztük, hogy az SQL `SELECT` lekérdezés **nem tartalmazta** a `source_name`, `continent` és `orszag` oszlopokat.

4.  **A Javítási Folyamat Során Felmerült Problémák:**
    *   **Hiányzó oszlop:** Az SQL lekérdezés bővítése után a szerver `column "orszag" does not exist` hibát dobott.
    *   **Adatbetöltési Hiba:** Az oszlop létrehozása után a hiba továbbra is fennállt. A célzott logolás kimutatta, hogy az adatbetöltő szkriptek (`Country.ts`, `Local.ts`) **nem írtak adatot az új `orszag` oszlopba**.
    *   **Régi, Hibás Adatok:** Miután az adatírókat is javítottuk, a hiba még mindig látható volt az `ON CONFLICT DO NOTHING` miatt, ami megakadályozta a régi, hibás sorok frissítését.

## 3. A Megoldás: Többlépcsős Javítás

A hiba teljes körű elhárításához a teljes adatfolyamot javítani kellett.

### A. Adatbázis Séma Bővítése

A `public.news` táblát kiegészítettük egy új oszloppal a teljes országnév tárolására.
```sql
ALTER TABLE public.news ADD COLUMN orszag VARCHAR(255);
```

### B. Backend Adatbetöltés Javítása

Módosítottuk az adatbetöltő szkripteket (`newsStorage.ts`, `Country.ts`, `Local.ts`), hogy a hírek mentésekor a forrás törzsadataiból kinyert teljes országnevet is elmentsék.
**Példa (`Country.ts`):**
```typescript
const itemsToSave: NewsItemForDb[] = cleanedNewsItems.map(item => {
    const sourceData = sourcesMap.get(item.sourceId);
    return {
        // ...
        orszag: sourceData?.orszag || item.country || country
    };
});
```

### C. Backend Adatlekérdezés Javítása

A `Search.ts` SQL lekérdezéseit kiegészítettük a hiányzó oszlopokkal (`source_name`, `continent`, `orszag`).

### D. Frontend Adatfeldolgozás Javítása

A `Home.tsx` `convertSearchResultToNewsItem` függvényét frissítettük, hogy a "szép" adatokat használja.
**Javított függvény:**
```typescript
function convertSearchResultToNewsItem(item: SearchResultItem): NewsItem {
  return {
    // ...
    country: (item as any).orszag || item.country_code || '',
    source: (item as any).source_name || item.source_slug,
    continent: (item as any).continent || '',
    // ...
  };
}
```

### E. Adattisztítás és Frissítés

Az utolsó lépés a régi, hibás adatok eltávolítása volt.
```sql
DELETE FROM public.news WHERE orszag IS NULL OR orszag = '';
```
Ezt követően a frontend cache törlése és egy friss adatletöltés biztosította a javítások láthatóságát.

## 4. Eredmény

A javítások eredményeképpen a keresési találatok most már **teljesen konzisztensek** a többi hírlistával. A rendszer adatfolyama robusztusabbá és hibatűrőbbé vált.
