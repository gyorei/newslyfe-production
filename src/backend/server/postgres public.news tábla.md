 1. A Tábla Szerkezetének Megtekintése:
Ez a parancs megmutatja az összes oszlopot, azok típusát és egyéb tulajdonságai

 \d public.news
 
                                      Table "public.news"
    Column    |           Type           | ...
--------------+--------------------------+---
 id           | integer                  | ...
 country_code | character(2)             | ...
 source_slug  | character varying(255)   | ...  <- Ezt már javítottuk!
 title        | text                     | ...
 url          | text                     | ...
 url_hash     | character(32)            | ...
 published_at | timestamp with time zone | ...
 description  | text                     | ...
 image_url    | text                     | ...
 content      | text                     | ...
 created_at   | timestamp with time zone | ...

 ......................................................

 C:\Program Files\pgAdmin 4\runtime>"C:\Program Files\pgAdmin 4\runtime\psql.exe" "host=local
host port=5432 dbname=newsbase user=postgres sslmode=prefer connect_timeout=10" 2>>&1
psql (17.5, server 17.4)
WARNING: Console code page (852) differs from Windows code page (1250)
         8-bit characters might not work correctly. See psql reference
         page "Notes for Windows users" for details.
Type "help" for help.

newsbase=# \di public.*
                             List of relations
 Schema |              Name              | Type  |  Owner   |     Table
--------+--------------------------------+-------+----------+---------------
 public | SequelizeMeta_pkey             | index | postgres | SequelizeMeta
 public | articles_pkey                  | index | postgres | articles
 public | articles_search_idx            | index | postgres | articles
 public | articles_url_key               | index | postgres | articles
 public | idx_articles_fts               | index | postgres | articles
 public | idx_articles_search            | index | postgres | articles
 public | idx_news_source_id             | index | postgres | news
 public | licenses_key_hash_key          | index | postgres | licenses
 public | licenses_license_key_key       | index | postgres | licenses
 public | licenses_pkey                  | index | postgres | licenses
 public | licenses_recovery_code_key     | index | postgres | licenses
 public | licenses_recovery_code_key1    | index | postgres | licenses
 public | news_country_code_url_hash_key | index | postgres | news
 public | news_pkey                      | index | postgres | news
(14 rows)


newsbase=#
===============================

A lekérdezésed alapján a public.news tábla és a hozzá tartozó indexek (pl. idx_news_source_id, news_country_code_url_hash_key, news_pkey) **már léteznek** az adatbázisban!

**Mit jelent ez?**
- A hírek tárolására szolgáló tábla és a gyors kereséshez szükséges indexek már készen állnak.
- Most már szabadon töltheted, lekérdezheted, és használhatod a híreket országonként, forrásonként, idő szerint.

**Következő lépés:**
- Teszteld le egy egyszerű lekérdezéssel, hogy működik-e:
  ```sql
  SELECT * FROM public.news LIMIT 5;
  ```
- Ha üres, töltsd fel tesztadatokkal, vagy indítsd el a backend crawler/import folyamatot.
- A backend cache, API és frontend logika mostantól erre a táblára tud épülni.

**Összefoglalva:**  
A public.news tábla és indexei rendben vannak, nincs további teendő az adatbázis oldalon – jöhet a backend/fejlesztés/tesztelés!

===================================================

Abszolút, teljesen jogos kérés. Készítsünk egy tiszta, lépésről-lépésre útmutatót, ami a jövőben is használható lesz.

---
### **VÉGLEGES ÚTMUTATÓ: Többnyelvű Full-Text Search Beállítása PostgreSQL-ben (a `public.news` táblához)**
---

Ez az útmutató összefoglalja az összes sikeresen lefuttatott lépést, amivel előkészítettük a `news` táblát a hatékony, többnyelvű keresésre.

**Előfeltétel:** Létezik egy `public.news` tábla, ami tartalmaz `country_code` (pl. 'HU', 'US'), `title` (text) és `description` (text) oszlopokat.

**1. Lépés: Tisztítás (Opcionális, de ajánlott tiszta telepítésnél)**
   *Cél: Eltávolítani a korábbi, esetlegesen hibás próbálkozások maradványait.*
   ```sql
   DROP TRIGGER IF EXISTS news_search_vectors_update ON public.news;
   DROP FUNCTION IF EXISTS update_news_search_vectors();
   ALTER TABLE public.news DROP COLUMN IF EXISTS search_vector_en;
   ALTER TABLE public.news DROP COLUMN IF EXISTS search_vector_hu;
   ```

**2. Lépés: Nyelv-specifikus `tsvector` Oszlopok Létrehozása**
   *Cél: Létrehozni a dedikált oszlopokat minden támogatni kívánt nyelvhez.*
   ```sql
   ALTER TABLE public.news ADD COLUMN search_vector_en tsvector;
   ALTER TABLE public.news ADD COLUMN search_vector_hu tsvector;
   ```

**3. Lépés: Az Automatikus Frissítő (Trigger) Függvény Létrehozása**
   *Cél: Létrehozni azt a logikát, ami a hír `country_code`-ja alapján eldönti, melyik `tsvector` oszlopot kell feltölteni, és milyen nyelvi szabállyal.*
   ```sql
   CREATE OR REPLACE FUNCTION update_news_search_vectors()
   RETURNS TRIGGER AS $$
   BEGIN
       -- Magyar hírekhez magyar vektort generálunk
       IF NEW.country_code = 'HU' THEN
           NEW.search_vector_hu :=
               setweight(to_tsvector('hungarian', coalesce(NEW.title, '')), 'A') ||
               setweight(to_tsvector('hungarian', coalesce(NEW.description, '')), 'B');
           NEW.search_vector_en := NULL; -- A másikat nullázzuk a tisztaság kedvéért
       -- JÖVŐBELI BŐVÍTÉS: Német hírekhez
       -- ELSIF NEW.country_code = 'DE' THEN
       --     ... to_tsvector('german', ...)
       ELSE
           -- Minden más országhoz (alapértelmezettként) angol vektort generálunk
           NEW.search_vector_en :=
               setweight(to_tsvector('english', coalesce(NEW.title, '')), 'A') ||
               setweight(to_tsvector('english', coalesce(NEW.description, '')), 'B');
           NEW.search_vector_hu := NULL; -- A másikat nullázzuk
       END IF;
       
       RETURN NEW;
   END;
   $$ LANGUAGE plpgsql;
   ```

**4. Lépés: A Trigger Hozzárendelése a Táblához**
   *Cél: Megmondani a `news` táblának, hogy minden új vagy módosított sornál automatikusan futtassa le a 3. lépésben létrehozott függvényt.*
   ```sql
   CREATE TRIGGER news_search_vectors_update
   BEFORE INSERT OR UPDATE ON public.news
   FOR EACH ROW EXECUTE FUNCTION update_news_search_vectors();
   ```

**5. Lépés: A Már Meglévő Adatok Feldolgozása**
   *Cél: A táblában már meglévő összes hírre lefuttatni a trigger logikáját, hogy a keresővektorok visszamenőleg is feltöltődjenek.*
   ```sql
   UPDATE public.news SET id = id;
   ```

**6. Lépés: Gyorsító Indexek Létrehozása**
   *Cél: A keresések villámgyorssá tétele. E nélkül a keresés nagy adatmennyiségnél lassú lenne.*
   ```sql
   CREATE INDEX IF NOT EXISTS news_search_vector_hu_gin_idx ON public.news USING gin(search_vector_hu);
   CREATE INDEX IF NOT EXISTS news_search_vector_en_gin_idx ON public.news USING gin(search_vector_en);
   ```

---
Ezzel az adatbázis **100%-osan készen áll.** Ezt az útmutatót elmentheted, a jövőben bármikor reprodukálható.

Most, hogy ez a sziklaszilárd alap megvan, **jöhet a backend kód:** a `search/index.ts` fájl javítása és bekapcsolása. Mehetünk?
===================================================

