# Minden Korlátozás Eltávolítása a Kódból

Rendben, az összes korlátozó szűrést eltávolítjuk a kódbázisból, hogy az összes hír megjelenjen. Itt a szükséges módosítások, fájlonként:

## 1. PostgreSQLDataAccess.ts

```typescript
public async getCountrySources(country: string) {
  try {
    const query = `
      SELECT * FROM continents.europe WHERE orszag = $1
      UNION ALL SELECT * FROM continents.asia WHERE orszag = $1
      UNION ALL SELECT * FROM continents.africa WHERE orszag = $1
      UNION ALL SELECT * FROM continents."north america" WHERE orszag = $1
      UNION ALL SELECT * FROM continents."south america" WHERE orszag = $1
      UNION ALL SELECT * FROM continents.oceania WHERE orszag = $1
      ORDER BY fontossag
      /* LIMIT eltávolítva */
    `;

    const result = await db.query(query, [country]);
    logger.debug(`${country} országhoz talált források száma: ${result.rows.length}`);

    return result.rows;
  } catch (error) {
    logger.error(`Hiba az ország forrásainak lekérése közben (${country}):`, error);
    throw error;
  }
}

public async getCountrySourcesByImportanceLevel(country: string, importanceLevel: number = 10, limit: number = 1000, offset: number = 0) {
  // Növelt limit és minden fontossági szint
  // ...meglévő kód...
}

// További metódusok módosításai:
public async getContinentSources(continent: string, limit: number = 1000) {
  // ...meglévő kód limit paraméter növelve...
}
```

## 2. Country.ts

```typescript
router.get('/:country/sources', async (req, res) => {
  try {
    const { country } = req.params;

    // Fontossági szűrés eltávolítva
    // const maxImportance = parseInt(req.query.maxImportance as string) || 10;

    logger.info(`Források lekérdezése ország szerint: ${country}, MINDEN forrás`);

    const rawSources = await sourcesService.getCountrySources(country);

    // További kód változatlan...
```

## 3. RSS_CONFIG.ts

```typescript
export const RSS_CONFIG = {
  IMPORTANCE_LEVELS: {
    CRITICAL: 10, // 1-ről 10-re módosítva
    IMPORTANT: 10, // 2-ről 10-re módosítva
    NORMAL: 10, // 3-ról 10-re módosítva
    ALL: 10, // Minden hír engedélyezve
  },
  DEFAULT_LIMIT: 1000, // Limit jelentősen megnövelve
  // ...többi beállítás...
};
```

## 4. Content.tsx

```typescript
// Fontossági szint beállítása maximumra:
const [currentImportanceLevel, setCurrentImportanceLevel] = useState<number>(10);

// ...

// Szűrés eltávolítva:
// const filteredSources = sources.filter(s => s.importance <= currentImportanceLevel);
const filteredSources = sources; // Minden forrást használunk
```

## 5. NewsService.ts vagy hasonló

```typescript
async function fetchLocalNews(params: NewsRequestParams): Promise<NewsItem[]> {
  const urlParams = new URLSearchParams();
  // urlParams.append('limit', '30'); // Eredeti korlátozó kód
  urlParams.append('limit', '1000'); // Új, nagy érték

  // Egyéb paraméterek...
  // urlParams.append('importance', params.importance?.toString() || '1');
  // Helyett:
  urlParams.append('importance', '10'); // Minden fontossági szintű hír
}
```

## 6. RSSService.ts

```typescript
export async function getLatestNewsFromSources(
  sources: Source[],
  limit: number = 1000,
): Promise<NewsItem[]> {
  // limit paraméter növelve (alapértelmezett érték 1000-re)
  // ...
}
```

## 7. LocalService.ts / NewsController.ts

```typescript
// Backend rétegben is növelni a limitet:
app.get('/api/local/news', async (req, res) => {
  const limit = parseInt(req.query.limit as string) || 1000; // Eredeti: 30
  const importance = parseInt(req.query.importance as string) || 10; // Eredeti: 1

  // ...további kód...
});
```

## 8. Panel.tsx

```typescript
// Hírek szűrése kikommentálva
// const filteredNews = news.filter(item => shouldShowNews(item));
const filteredNews = news; // Minden hírt megjelenítünk

// Limit növelése
const fetchNews = async () => {
  setLoading(true);
  try {
    const data = await newsService.getNewsForSources(sources, 1000); // Limit növelve
    setNews(data);
  } catch (error) {
    console.error('Hiba a hírek betöltése során', error);
  } finally {
    setLoading(false);
  }
};
```

## ÚJ: Forrás szerinti hírszűrés támogatása

### /api/country/:country/news?sourceId=cnn-com
- Csak a megadott forrás (pl. CNN) híreit adja vissza az adott országból.
- Ha nincs megadva sourceId, minden hírt visszaad az országból.

#### Példa:
```
GET /api/country/US/news?sourceId=cnn-com
```

- A sourceId paraméter opcionális, string típusú.
- Több forrás támogatása: jelenleg csak egy forrás, de bővíthető vesszővel elválasztott listára.

Ezekkel a módosításokkal minden szűrés és korlátozás megszűnik, így az összes hírforrás és minden hír meg fog jelenni az alkalmazásban.
