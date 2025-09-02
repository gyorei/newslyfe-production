# SWR Cache Tesztek – Összefoglaló

Ez a mappa tartalmazza a backend cache logika (SWR – stale-while-revalidate) automatizált tesztjeit.

## Fő cél

Bizonyítani, hogy az `/api/local/news` és `/api/country/:country/news` végpontok cache rendszere helyesen működik:
- **Első kérés (CACHE MISS):** Friss adat, lassabb válasz.
- **Második kérés (CACHE HIT):** Cache-ből, gyors válasz.
- **Cache lejárat után (STALE):** Azonnali válasz a régi cache-ből, háttérben revalidálás.

## Fő tesztfájl
- `caching.test.ts`: Végponttól végpontig teszteli a cache logikát, valódi adatbázison, valós adatokkal.

## Tesztelési stratégia
- **beforeAll:** Tesztadat beszúrása (ha szükséges).
- **Teszt:**
  - Lekérdezés (MISS) – ellenőrzés: van hír, válaszidő lassabb.
  - Lekérdezés (HIT) – ellenőrzés: ugyanaz a hír, válaszidő gyors.
  - Cache lejárat után újra lekérdezés (STALE) – gyors válasz, háttérben revalidálás.
- **afterAll:** Tesztadat törlése (ha beszúrtunk).

## Függőségek
- **supertest** – HTTP kérések a végpontokhoz
- **jest** – Teszt futtató
- **Valós adatbázis** – A teszt nem mockolt, hanem integrációs

## Fontos tudnivalók
- A teszt csak akkor fut le sikeresen, ha a tesztadatbázisban minden szükséges tábla és index létezik.
- A cache időzítését a teszt idejére érdemes rövidre állítani (pl. 3 másodperc).
- A tesztkód példaként szolgálhat bármilyen cache logika validálására.

## Eredmény
- A tesztek igazolják, hogy a cache rendszer gyorsítja a válaszokat, és mindig van adat a válaszban.
- A performance benchmark is kimutatja a cache gyorsító hatását.

---

Ha új végpontot vagy cache logikát vezetsz be, ide készíts hozzá tesztet!
