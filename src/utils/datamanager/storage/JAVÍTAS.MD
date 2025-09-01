## 🎯 **CACHE-FIRST STRATÉGIA IMPLEMENTÁLÁSI TERV** 🚀

Most **PONT ERRE KONCENTRÁLUNK** - a törzsmód cache optimalizálásra!

## 📋 **IMPLEMENTÁLÁSI ROADMAP**

### **1. FÁZIS - FRONTLOCAL.TS CACHE IMPLEMENTÁLÁS** ⚡

```typescript
// HOZZÁADANDÓ: Modul szintű cache (fájl tetején)

interface CachedNewsData {
  news: APINewsItem[];
  timestamp: number;
  country: string;
  importanceLevel: number;
}

const frontLocalNewsCache = new Map<string, CachedNewsData>();
const TORZS_MODE_NEWS_TTL_MS = 4 * 60 * 60 * 1000; // 4 óra

function getTorzsModeCacheKey(country: string, importanceLevel: number): string {
  return `torzs-${country.toLowerCase()}-${importanceLevel}`;
}
```

### **2. FÁZIS - GETNEWS FÜGGVÉNY CACHE LOGIKA** 🔧

```typescript
// MÓDOSÍTANDÓ: getNews függvény eleje
static async getNews(filters: NewsFilters = {}): Promise<APINewsItem[]> {
  let allNewsItems: APINewsItem[] = [];
  let fetchedFromCache = false;

  // ÚJ: Cache ellenőrzés törzsmód esetén
  if (effectiveFilters.torzsMode) {
    const cacheKey = getTorzsModeCacheKey(
      effectiveFilters.country || 'Hungary',
      effectiveFilters.importanceLevel || 10
    );

    const cachedEntry = frontLocalNewsCache.get(cacheKey);
    if (cachedEntry && Date.now() - cachedEntry.timestamp < TORZS_MODE_NEWS_TTL_MS) {
      console.log(`[FrontLocal.getNews] 🎯 TÖRZS CACHE HIT! ${cachedEntry.news.length} hír, kor: ${Math.round((Date.now() - cachedEntry.timestamp)/60000)}perc`);
      allNewsItems = cachedEntry.news;
      fetchedFromCache = true;
    }
  }

  // Feltételes API hívás
  if (!fetchedFromCache) {
    // ...meglévő API hívás logika...
  }

  // Cache mentés sikeres API után
  if (effectiveFilters.torzsMode && !fetchedFromCache && allNewsItems.length > 0) {
    const cacheKey = getTorzsModeCacheKey(
      effectiveFilters.country || 'Hungary',
      effectiveFilters.importanceLevel || 10
    );

    frontLocalNewsCache.set(cacheKey, {
      news: allNewsItems,
      timestamp: Date.now(),
      country: effectiveFilters.country || 'Hungary',
      importanceLevel: effectiveFilters.importanceLevel || 10
    });

    console.log(`[FrontLocal.getNews] 💾 TÖRZS CACHE MENTÉS: ${allNewsItems.length} hír mentve`);
  }
}
```

### **3. FÁZIS - CACHE METRIKÁK ÉS MONITORING** 📊

```typescript
// HOZZÁADANDÓ: Cache statisztikák
interface CacheStats {
  hits: number;
  misses: number;
  saves: number;
  size: number;
  totalItems: number;
}

const cacheStats: CacheStats = {
  hits: 0,
  misses: 0,
  saves: 0,
  size: 0,
  totalItems: 0
};

// Statisztikák lekérdezése
static getCacheStats(): CacheStats {
  return {
    ...cacheStats,
    size: frontLocalNewsCache.size,
    totalItems: Array.from(frontLocalNewsCache.values())
      .reduce((sum, cache) => sum + cache.news.length, 0)
  };
}

// Cache tisztítás
static clearCache(country?: string): void {
  if (country) {
    const keysToDelete = Array.from(frontLocalNewsCache.keys())
      .filter(key => key.includes(country.toLowerCase()));
    keysToDelete.forEach(key => frontLocalNewsCache.delete(key));
  } else {
    frontLocalNewsCache.clear();
  }
  console.log(`[FrontLocal] Cache törölve: ${country || 'összes'}`);
}
```

### **4. FÁZIS - HIBAKEZELÉS ÉS STALE CACHE** 🛡️

```typescript
// HOZZÁADANDÓ: Hibakezelés cache fallback-kel
try {
  // API hívás...
} catch (apiError) {
  console.error('[FrontLocal.getNews] API hiba:', apiError);

  // Stale cache próbálkozás törzsmód esetén
  if (effectiveFilters.torzsMode) {
    const cacheKey = getTorzsModeCacheKey(
      effectiveFilters.country || 'Hungary',
      effectiveFilters.importanceLevel || 10,
    );

    const staleCache = frontLocalNewsCache.get(cacheKey);
    if (staleCache) {
      console.warn(
        `[FrontLocal.getNews] ⚠️ STALE CACHE használata API hiba miatt: ${staleCache.news.length} hír`,
      );
      return staleCache.news;
    }
  }

  throw apiError;
}
```

## 📊 **IMPLEMENTÁLÁSI PRIORITÁSOK**

### **SÜRGŐS (1 nap)** 🔥

1. **Cache Map létrehozás** - Alapstruktúra
2. **Cache ellenőrzés** - getNews módosítás
3. **Cache mentés** - Sikeres API után
4. **Alapvető logolás** - Debug információk

### **FONTOS (3 nap)** ⚡

1. **Cache metrikák** - Teljesítménymérés
2. **Stale cache fallback** - Hibakezelés
3. **Cache清除** - Manual refresh opciók
4. **TTL konfiguráció** - Rugalmas időbeállítások

### **HASZNOS (1 hét)** 📈

1. **useTabStorage integráció** - Perzisztens cache
2. **Background refresh** - Proaktív frissítés
3. **Cache warming** - Előtöltés
4. **Teljesítmény dashboard** - Monitoring UI

## 🎯 **TESZTELÉSI TERV**

### **A. FUNKCIONÁLIS TESZTEK** ✅

- Törzsmód első betöltés (cache miss)
- Törzsmód második betöltés (cache hit)
- Cache TTL lejárat tesztelése
- API hiba esetén stale cache használat

### **B. TELJESÍTMÉNY TESZTEK** ⚡

- Betöltési idő mérése cache nélkül vs cache-szel
- Memóriahasználat monitoring
- API hívások számának csökkentése
- Felhasználói élmény (UX) javulás

### **C. EDGE CASE TESZTEK** 🧪

- Üres cache kezelése
- Nagy hírtömegek (10k+ hírek)
- Több ország párhuzamos cache-elése
- Browser memória korlátok

## 🚀 **VÁRT EREDMÉNYEK 30 NAP UTÁN**

| Metrika                       | Baseline | Cél    | Mérés             |
| ----------------------------- | -------- | ------ | ----------------- |
| **Törzsmód betöltés**         | 8-15s    | <500ms | **95% javulás**   |
| **Cache hit arány**           | 0%       | 70%+   | **Új metrika**    |
| **API hívások**               | 100%     | 30%    | **70% csökkenés** |
| **Felhasználói elégedettség** | Lassú    | Kiváló | **UX survey**     |

## 🎉 **SIKERKRITÉRIUMOK**

### **MINIMUM VIABLE CACHE (MVC)** ✅

- ✅ Törzsmód cache hit >50%
- ✅ Betöltési idő <2s törzsmódban
- ✅ Zero breaking changes
- ✅ Megbízható cache metrikák

### **OPTIMALIZED CACHE** 🏆

- 🎯 Cache hit >80%
- 🎯 Betöltési idő <500ms
- 🎯 useTabStorage integráció
- 🎯 Background refresh

**Ez a terv KÖZVETLENÜL a törzsmód optimalizálására fókuszál és azonnali eredményeket fog hozni!** 🚀
