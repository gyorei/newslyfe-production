# Országnézet tervezése a hírolvasó alkalmazáshoz

A terv, hogy létrehozzunk egy új országnézet funkciót a meglévő lokális és kontinens-alapú hírek mellé. Elemeztem az adatbázis szerkezetét és a jelenlegi alkalmazásstruktúrát, és most részletes tervet készítek az országnézet megvalósításához.

## 1. Adatbázis architektúra

A PostgreSQL adatbázisban már rendelkezésünkre áll minden szükséges adat, mivel:

- Minden kontinens táblában (`europe`, `asia`, `africa` stb.) van `orszag` mező
- Minden tábla azonos szerkezetű (oldal_id, fontossag, orszag, cim, url, rss_feed, nyelv, eredeti_id, sections, kontinens)

### Adatbázis megközelítés

Két lehetséges megoldás az országnézet adatainak kezelésére:

#### A) Meglévő kontinens táblák használata (ajánlott)

- Előnyök: Nincs adatduplikáció, egyszerűbb karbantartás
- Működés: UNION ALL lekérdezésekkel kombinálunk adatokat több táblából

```sql
-- Koncepcióterv: Egy konkrét ország híroldalainak lekérése
SELECT * FROM continents.europe WHERE orszag = 'Magyarország'
UNION ALL
SELECT * FROM continents.asia WHERE orszag = 'Magyarország'
UNION ALL
-- többi kontinens tábla
```

#### B) Materialized View létrehozása (opcionális jövőbeli bővítés)

- Előnyök: Gyorsabb lekérdezés nagy adatmennyiség esetén
- Hátrányok: Frissíteni kell, extra tárhely

## 2. Backend API kialakítás

### Szükséges API végpontok

1. **Országok listázása**
   - Végpont: `/api/countries`
   - Funkció: Az összes elérhető ország lekérése kontinensektől függetlenül
   - Kezelés: SQL lekérdezés DISTINCT orszag mezővel minden kontinens táblából

2. **Országspecifikus hírforrások lekérése**
   - Végpont: `/api/sources/country/:countryName`
   - Funkció: Egy adott ország összes hírforrásának lekérése
   - Kezelés: UNION ALL lekérdezés a kontinens táblákból

3. **Hírek lekérése ország szerint**
   - Végpont: Ez történhet meglévő végpontok bővítésével
   - Funkció: Hírek lekérdezése országgal mint szűrővel
   - Kezelés: Az RSS service bővítése ország-alapú szűréssel

## 3. Frontend architektúra

### Komponensek

1. **Country komponens** - (`src/components/Side/Country/Country.tsx`)
   - Elhelyezés: A Side panelen belül, a Region komponens mellett
   - Funkció: Országok listázása, kiválasztás kezelése
   - Állapot: Kiválasztott ország, láthatóság (összecsukható)

2. **Side komponens módosítása**
   - Elhelyezés: Meglévő Side komponens
   - Változtatás: A Country komponens beillesztése, országválasztás állapot kezelése
   - Logika: Ha országot választunk, a kontinens választás törlődik (és fordítva)

3. **App.tsx módosítás**
   - Nézetkezelés: Új 'country' nézet létrehozása a 'local' és 'continent' mellett
   - Szűrőkezelés: ország szűrő hozzáadása a többi szűrőhöz (kategória, kontinens)

4. **Content komponens módosítása**
   - Hírbetöltési logika: Ha az aktív nézet 'country', akkor ország szerint szűrünk
   - Progresszív betöltés: Fontosság szerinti fokozatos betöltés, hasonlóan a kontinens nézethez

### Adatáramlás

```
Country komponens (ország kiválasztás)
        ↓
Side komponens (szűrők koordinálása)
        ↓
App komponens (nézet meghatározása)
        ↓
Content komponens (adatok lekérése és megjelenítése)
        ↓
dataService (API hívások és adatfeldolgozás)
        ↓
API (adatbázis lekérdezések)
        ↓
PostgreSQL (adattárolás)
```

## 5. Felhasználói élmény tervezése

### Country komponens felhasználói felülete

- Összecsukható panel a Side komponensben
- Keresőmező a sok ország könnyebb navigálásához (opcionális)
- Országok listázása ABC szerint vagy kontinensek szerint csoportosítva
- Aktív ország kiemelése vizuális jelzéssel
- Találati számok megjelenítése minden ország mellett (hány hír található)

### Integráció a meglévő UI-jal

- A Country komponens a Region komponens alatt vagy mellett jelenik meg
- Stílus és viselkedés konzisztens a többi oldalsáv komponenssel
- Reszponzív megjelenés: kis képernyőn is jól használható

## 6. Állapotkezelés

### Szűrők kezelése

1. **Kölcsönös kizárás**:
   - Ha országot választunk ki, a kontinens kiválasztása törlődik
   - Ha kontinenst választunk ki, az ország kiválasztása törlődik

2. **Több szűrő kombinálása**:
   - Ország + Kategória: adott ország híreinek szűrése kategória szerint
   - (De ország + kontinens kombináció nem lehetséges)

### Állapot perzisztencia

- A kiválasztott ország mentése localStorage-ba
- Oldalbetöltéskor az utoljára kiválasztott állapot visszaállítása

## 7. Teljesítmény szempontok

### Optimalizálási lehetőségek

1. **PostgreSQL indexek**:
   - Indexek létrehozása az `orszag` mezőre minden kontinens táblában:

   ```sql
   CREATE INDEX idx_europe_orszag ON continents.europe(orszag);
   CREATE INDEX idx_asia_orszag ON continents.asia(orszag);
   -- stb. a többi kontinensre
   ```

2. **Lekérdezés optimalizáció**:
   - Korlátozzuk a visszaadott rekordok számát (LIMIT)
   - Fontosság-alapú progressive loading: először csak a legfontosabb hírek

3. **Frontend optimalizáció**:
   - Virtualizált lista a sok ország esetén
   - Lapozás nagy mennyiségű hír esetén
   - Képek lusta betöltése (lazy loading)

## 8. Implementációs ütemterv

1. **Backend API végpontok létrehozása**
   - Országok listázása API
   - Országspecifikus hírforrások API

2. **Adatszolgáltatás réteg bővítése**
   - countryView szolgáltatás implementálása

3. **UI komponensek fejlesztése**
   - Country komponens létrehozása
   - Side komponens bővítése

4. **App logika módosítása**
   - Nézet kezelés bővítése
   - Szűrő logika kiterjesztése

5. **Tesztelés és finomhangolás**
   - Teljesítmény tesztelés különböző méretű adatkészletekkel
   - UX tesztelés és visszajelzések alapján optimalizálás

## Összegzés

Az országnézet megvalósítása a meglévő adatbázis szerkezetet használja, és a jelenlegi alkalmazás architektúrát bővíti egy új nézettel. A terv minimalizálja a szükséges adatbázis változtatásokat, és újrahasznosítja a meglévő komponensek logikáját, miközben új funkcionalitást ad az alkalmazáshoz.

A terv lehetővé teszi a fokozatos bevezetést: először egyszerűbb megvalósítással lehet kezdeni (kontinens táblák közvetlen lekérdezése), majd később teljesítmény optimalizációkkal bővíteni (pl. materialized view-k bevezetése).
////////////////////////////////

# Országkereső tervezése nagy adatmennyiséghez

## Kihívás

200 ország megjelenítése és kezelése korlátozott képernyőterületen jelentős UX kihívást jelent. Az alábbi lehetőségek állnak rendelkezésre:

## Lehetséges megoldások

### 1. Keresőmező alapú megközelítés

- **Leírás**: Az országokat nem jelenítjük meg azonnal, hanem a felhasználó gépelése szűri a listát.
- **Előnyök**: Gyors találat, kis helyigény, jó teljesítmény
- **Hátrányok**: Nem látható az összes választási lehetőség első ránézésre
- **Megvalósítás**: Keresőmező, amely szűri a listát gépelés közben

### 2. Virtuális görgetés (Virtual Scrolling)

- **Leírás**: Csak a látható országokat rendereljük a DOM-ba, a többit virtuálisan kezeljük
- **Előnyök**: Támogatja a teljes lista megtekintését teljesítményben skálázható módon
- **Hátrányok**: Implementáció komplexebb, könyvtárat igényelhet
- **Könyvtárak**: `react-window` vagy `react-virtualized`

### 3. Csoportosított megjelenítés

- **Leírás**: Az országok csoportosítása kontinensek vagy kezdőbetű szerint
- **Előnyök**: Rendszerezett, logikus struktúra, könnyebb navigáció
- **Hátrányok**: Több kattintás szükséges a végleges kiválasztáshoz
- **Megvalósítás**: Accordion/expander komponensek használata

### 4. Betű szerinti index

- **Leírás**: A-Z betűk megjelenítése, amikre kattintva az adott betűvel kezdődő országokhoz ugorhatunk
- **Előnyök**: Gyors navigáció, ismerős UX (telefonkönyv elv)
- **Hátrányok**: Plusz helyet foglal, egyes betűknél kevés vagy sok elem lehet

### 5. Vegyes megközelítés (ajánlott)

- **Leírás**: Virtuális görgetés + keresés + betű szerinti ugrás kombinációja
- **Előnyök**: Rugalmas használat, több interakciós mintát támogat
- **Hátrányok**: Komplexebb implementáció
- **Megvalósítás**:
  - Virtuális lista az alapértelmezett görgetéshez
  - Keresőmező a gyors szűréshez
  - Betűindexek a gyors navigációhoz

## Teljesítmény szempontok

1. **Adatbetöltés optimalizálása**:
   - Országlista cachelése
   - Csak a kontinens változás triggerel új betöltést

2. **Renderelés optimalizálása**:
   - Virtuális lista csak a látható elemeket rendereli
   - Memoizáció a listaelemekre

3. **Interakció optimalizálása**:
   - Debounced keresés (nem minden karakternél fut le az új szűrés)
   - Throttled görgetéseseménykezelés

## Ajánlott megoldás a Side panelhez

Mivel a Side panel korlátozott szélességű, a következő kombinált megoldást javaslom:

1. **Virtuális görgetés alapvető megközelítésként**
   - Biztosítja a teljes lista böngészhetőségét
   - A `react-window` könyvtár könnyen integrálható és kis méretű

2. **A Search komponens újrahasznosítása**
   - A meglévő keresőmező szűrhet globálisan és országnév szerint is
   - Ne legyen külön kereső a Side panelen

3. **Vizuális segítség**
   - Betűjelzés a listában (A, B, C... szekciók)
   - Esetleg kontinens szerint színkódolt országok

4. **Lapozás opció nagy képernyőre**
   - Opcionálisan: Nagyobb képernyőn váltható nézet listáról grid/táblázat nézetre

Ez a megoldás egyensúlyt teremt a teljesítmény, a használhatóság és a fejlesztési erőfeszítés között, miközben rugalmas és bővíthető marad.
