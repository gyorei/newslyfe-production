# HorizontalNewsScroller Komponens

Ez a komponens egy horizontálisan görgethető sávot valósít meg, elsődlegesen a kép nélküli hírek alternatív megjelenítésére.

## Jelenlegi Funkcionalitás (2025. május 21.)

### Elvégzett Lépések:

1.  **Koncepció és Alapok:**
    - A komponens ötlete a kép nélküli hírek helytakarékos és modern megjelenítésére született.
    - Létrejött a komponens (`HorizontalNewsScroller.tsx`), a hozzá tartozó CSS modul (`HorizontalNewsScroller.module.css`) és az exportálást végző `index.ts`.
    - Kezdetben egy `DummyNewsItem` interfész szolgált a tesztadatok típusaként.

2.  **Integráció és Tesztelés:**
    - A komponens be lett integrálva a `Panel.tsx`-be.
    - A kezdeti tesztelés dummy adatokkal történt, és a megjelenítés csak fejlesztői környezetben (`process.env.NODE_ENV === 'development'`) volt aktív, egy vizuális kerettel kiemelve.

3.  **Reszponzivitás:**
    - A `react-responsive` csomag segítségével (`useMediaQuery({ maxWidth: 1024 })`) megoldottuk, hogy a komponens (fejlesztői környezetben) csak mobil és tablet képernyőméreteken jelenjen meg.

4.  **Valódi Adatkapcsolat:**
    - A komponenst átállítottuk `NewsItem[]` típusú adatok fogadására.
    - A `Panel.tsx`-ben a dummy adatokat lecseréltük a valós, kép nélküli hírek egy részhalmazára.

5.  **Felhasználói Beállítások:**
    - A felhasználók a `ContentSettings` komponensben ki- és bekapcsolhatják a horizontális hírsáv megjelenítését.
    - Az állapot a DataManager segítségével az IndexedDB-be kerül mentésre.

6.  **Dinamikus Megjelenítés:**
    - A horizontális hírsávok nem csak a panel elején, hanem periodikusan a képes hírek között is megjelennek.
    - A felhasználók beállíthatják, hogy hány képes hír után jelenjen meg egy horizontális hírsáv.

### Jelenlegi Működés:

- A `HorizontalNewsScroller` a `Panel.tsx`-ben kerül renderelésre, több helyen a tartalom között.
- Megjelenik a panel elején és minden X képes hír után (ahol X a felhasználó által beállított érték).
- **Csak akkor jelenik meg, ha a képernyő szélessége legfeljebb 1024px (mobil/tablet nézet).**
- **Csak akkor jelenik meg, ha van legalább 4 kép nélküli hír.**
- **A megjelenítés a felhasználói beállításoktól függ (ki-/bekapcsolható a Settings menüben).**

## Tervezett Fejlesztések:

1.  **Intelligens Hírkiválasztási Logika:**
    - Az "első X hír" logika helyett intelligensebb kiválasztási mechanizmus implementálása (pl. legfrissebbek, véletlenszerű, prioritás alapú).

2.  **Teljesítmény Optimalizálás:**
    - Nagy mennyiségű hírnél virtualizált lista implementálása a jobb teljesítmény érdekében.
