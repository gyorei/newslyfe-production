# Adatbázis-takarító időzített feladat (CleanupScheduler)

Ez a modul (`cleanupScheduler.ts`) felelős a hírek adatbázisának automatikus karbantartásáért.

## Funkció
- **Minden nap hajnali 3:00-kor** automatikusan törli a 24 óránál régebbi híreket a `public.news` táblából.
- A törléshez a következő SQL parancsot használja:
  ```sql
  DELETE FROM public.news WHERE published_at < NOW() - INTERVAL '24 hours';
  ```
- A feladat futását és eredményét részletes logokban követheted nyomon.

## Integráció
- A `startCleanupJob()` függvény a szerver indításakor automatikusan meghívódik az `index.ts`-ben.
- A logban az alábbi üzenet jelzi a sikeres időzítést:
  `[CleanupScheduler] Az adatbázis-takarító feladat sikeresen beidőzítve (minden nap 03:00).`

## Tesztelés
- Az időzítés teszteléséhez a cron kifejezést ideiglenesen módosíthatod (pl. minden percben futás: `* * * * *`).
- A logokban láthatod, mikor fut le a feladat, és hány sort törölt.

## Előnyök
- Az adatbázis automatikusan karbantartott, nem telik fel felesleges régi hírekkel.
- Nincs szükség manuális beavatkozásra.

---

**Fő fájl:** `src/backend/server/jobs/cleanupScheduler.ts`

**Indítás helye:** `src/backend/server/index.ts`

---

Ha módosítani szeretnéd az időzítést vagy a törlési logikát, szerkeszd a `cleanupScheduler.ts`-t.
