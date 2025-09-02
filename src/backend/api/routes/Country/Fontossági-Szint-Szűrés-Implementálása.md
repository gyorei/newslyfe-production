# Fontossági Szint Szűrés Implementálása Az Összes Országra

Teljesen igazad van! A fontossági szint szűrést általános megoldásként kell bevezetni, ami minden országra működik. A módosítást két fájlban kell elvégezni:

## 1. PostgreSQLDataAccess.ts - A Metódus Módosítása

```typescript
public async getCountrySources(country: string, maxImportance: number = 10) {
  try {
    const query = `
      SELECT * FROM (
        SELECT * FROM continents."europe" WHERE orszag = $1 AND fontossag <= $2
        UNION SELECT * FROM continents."asia" WHERE orszag = $1 AND fontossag <= $2
        UNION SELECT * FROM continents."north america" WHERE orszag = $1 AND fontossag <= $2
        UNION SELECT * FROM continents."south america" WHERE orszag = $1 AND fontossag <= $2
        UNION SELECT * FROM continents."africa" WHERE orszag = $1 AND fontossag <= $2
        UNION SELECT * FROM continents."oceania" WHERE orszag = $1 AND fontossag <= $2
      ) AS country_sources
      ORDER BY fontossag
    `;

    const result = await db.query(query, [country, maxImportance]);
    logger.debug(`${country} országhoz talált források száma (max. fontosság ${maxImportance}): ${result.rows.length}`);

    return result.rows;
  } catch (error) {
    logger.error(`Hiba az ország forrásainak lekérése közben (${country}):`, error);
    throw error;
  }
}
```

## 2. Country.ts - A Végpont Módosítása

```typescript
/**
 * Egy ország forrásainak lekérdezése
 * GET /api/country/:country/sources
 * Query paraméterek:
 *   - importance: 'top' | 'important' | 'all' (opcionális, alapértelmezett: 'all')
 */
router.get('/:country/sources', async (req, res) => {
  try {
    const { country } = req.params;

    // Fontossági szint beállítása query paraméterből
    let maxImportance = 10; // alapértelmezett: minden forrás

    if (req.query.importance === 'top') {
      maxImportance = 1; // csak a legfontosabb források
    } else if (req.query.importance === 'important') {
      maxImportance = 2; // fontos források
    }

    logger.info(
      `Források lekérdezése ország szerint: ${country}, fontosság: ${req.query.importance || 'all'}`,
    );

    // SourcesService használata módosított paraméterekkel
    const rawSources = await sourcesService.getCountrySources(country, maxImportance);

    // Ha nincs találat, üres tömböt adunk vissza
    if (!rawSources || rawSources.length === 0) {
      logger.warn(`Nem található forrás az alábbi országhoz: ${country}`);
      return res.json([]);
    }

    // Eredmény transzformálása az API válasz formátumára
    const sources = rawSources.map((row) => ({
      id: row.eredeti_id || '',
      name: row.cim || '',
      url: row.url || '',
      rssUrl: row.rss_feed || '',
      importance: row.fontossag || 1,
      country: row.orszag || country,
      continent: row.kontinens || 'Europe',
      isActive: true,
    }));

    res.json(sources);
  } catch (err) {
    // TypeScript hiba javítása: error típus kezelése
    const error = err as Error;
    logger.error(`Hiba a források lekérdezése során (${req.params.country}):`, error);
    res.status(500).json({
      error: 'Hiba történt a források lekérdezése közben',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
});
```

## Hogyan használható az API?

Most már minden országra használható a fontossági szint szűrés:
top híre minden országban kell kellen, hogy a legfontosabb híreket kapjuk meg, míg az "important" paraméterrel a fontosabb híreket kérhetjük le. Az "all" paraméterrel pedig minden forrást lekérdezhetünk.

1. **Top hírek (csak a legfontosabbak):** top hírek nem csak magyarban meg németben vannal. a top híre csak álltalánosítva van. a top híret majd a felhasználó a kervencedben tudja megadni az álltalános top hírek mellett. a kezdő felületnek kell egy top vagy legfontosabb hírek. ez minden ország vagy lokálos keresésnél elérhető.  
   `/api/country/France/sources?importance=top`  
   `/api/country/Italy/sources?importance=top`  
   `/api/country/Spain/sources?importance=top`  
   `/api/country/Germany/sources?importance=top`
   `/api/country/Hungary/sources?importance=top`  
   `/api/country/France/sources?importance=top`  
   `/api/country/Italy/sources?importance=top`  
   `/api/country/Spain/sources?importance=top`  
   `/api/country/Germany/sources?importance=top`  
   `/api/country/Hungary/sources?importance=top`  
   `/api/country/USA/sources?importance=top`  
   `/api/country/Canada/sources?importance=top`  
   `/api/country/UK/sources?importance=top`  
   `/api/country/Italy/sources?importance=top`  
   `/api/country/Spain/sources?importance=top`
   `/api/country/Germany/sources?importance=top`  
   `/api/country/Hungary/sources?importance=top`

2. **Fontosabb hírek (1-es és 2-es fontosság):**  
   `/api/country/France/sources?importance=important`  
   `/api/country/Italy/sources?importance=important`

3. **Minden hír (összes forrás):**  
   `/api/country/Spain/sources`  
   `/api/country/Japan/sources?importance=all`

## Előnyök

1. **Egységesség**: Minden ország esetében azonos módon működik
2. **Rugalmasság**: A felhasználó választhatja ki a fontossági szintet
3. **Teljesítmény**: Kevesebb adat átvitele, ha csak a fontos hírforrásokra van szükség
4. **Felhasználói élmény**: A felhasználók választhatnak az átfogó vagy a szűrt nézet között

Ezzel a módosítással minden ország esetében elérhetővé válik a fontossági szűrés, nem csak Németország esetében!
