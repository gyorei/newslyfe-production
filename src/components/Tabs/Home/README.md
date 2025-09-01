# Home tab működése és javítás összefoglaló

## src\backend\search\README.md TOVÁBBI ADATOK a home keresésnél!

## Működés
- A Home tab az alkalmazás fő kezdőfüle, amely mindig elérhető.
- Induláskor, illetve F5 után a tabok és az aktív tab állapota a localStorage-ből töltődik vissza.
- A Home tab speciális: csak akkor jelenik meg, ha tényleg aktív, és a mode értéke 'home'.
- A Home tab keresője országra, kontinensre, vagy szabad szövegre keres, geo-intelligens módon.
- Sikeres keresés után a Home tab eltűnik, és egy új tab jelenik meg a találatokkal (Single Tab Mode).

---

## 🔄 Home kereső teljes folyamata

1. **Felhasználói input:**
   - A felhasználó beír egy keresési kifejezést a Home tab keresőmezőjébe.
2. **Geo-felismerés:**
   - A handleSearch függvény lefut, és a detectGeoQuery meghatározza, hogy a keresés országra, régióra, kontinensre vagy kulcsszóra vonatkozik-e.
3. **Keresési út kiválasztása:**
   - Ha geo találat van (pl. ország), akkor a getLocalNews API hívás történik.
   - Ha nincs geo találat, akkor kulcsszavas keresés indul: apiClient.searchNews.
4. **Backend kapcsolat:**
   - Kulcsszavas keresésnél a frontend meghívja a backend kereső API-t: `/api/search` (lásd: src/backend/search/README.md).
   - A backend (Search.ts) PostgreSQL teljes szöveges keresést futtat, csak 24 órán belüli híreket ad vissza, relevancia szerint rendezve.
5. **Eredmények feldolgozása:**
   - A backend válasza NewsItem tömb, amelyet a frontend a convertSearchResultToNewsItem függvénnyel dolgoz fel.
6. **Találatok átadása:**
   - Az onSearchComplete callback átadja a találatokat, keresési kifejezést és geoResult-ot a szülő komponensnek.
7. **Új tab nyitása:**
   - A szülő komponens egy új tabot nyit a találatokkal (Single Tab Mode), a Home tab eltűnik.
8. **Találatok megjelenítése:**
   - A találatok az új tabban jelennek meg, a Home tab üres marad.
9. **F5 viselkedés:**
   - F5 után a Home tab újraindul, a keresési eredmények elvesznek, mert nem kerülnek cache-be (csak a tab metaadatok töltődnek vissza).

---

## Backend kapcsolat részletezése
- A Home kereső kulcsszavas keresés esetén a backend kereső API-t (`/api/search`) hívja meg, amely a `src/backend/search/Search.ts` fájlban van implementálva.
- Ez a backend modul PostgreSQL teljes szöveges keresést használ, magyar nyelvi támogatással, és csak a legfrissebb (24 órán belüli) híreket adja vissza.
- A keresési eredmények metaadatai (forrásnév, ország, kontinens) is teljesek, így a Home tabon egységesen jelennek meg a találatok.
- Részletes technikai leírás: lásd `src/backend/search/README.md`.

---

## Most javított probléma
- Korábban a Home tab visszatöltésekor a mode értéke hibásan 'news' lett, emiatt a Home kereső logika nem működött stabilan, vagy a Home tab nem jelent meg helyesen.
- A javítás után a visszatöltött taboknál a mode validáció már a 'home' értéket is elfogadja, így a Home tab mindig helyesen 'home' móddal jön létre.
- Ez biztosítja, hogy F5 után, vagy app újraindításkor a Home tab keresője és viselkedése mindig stabil, nem lesz "elugró" vagy hibás Home tab.

## Ellenőrzés
- F5 után a Home tab mindig a megfelelő módot kapja, és a tabok visszatöltése is helyes.
- A Home kereső logika, tabváltás, és Single Tab Mode működése stabil.


