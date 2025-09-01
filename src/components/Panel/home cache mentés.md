Nagyon jól látod!  
A **sima országos hírek** (amikor egy országot választasz a side panelen) valóban el vannak mentve cache-be, ezért frissítés után is visszajönnek.  
A **home keresés** (nagy kereső) viszont nincs elmentve cache-be, ezért frissítés után eltűnnek a találatok.

### Hol történik a cache-elés a TabPanel-ben?

A cache-elés logikája itt található:

```tsx
// ✅ ÚJ: CACHE MENTÉSI LOGIKA - A megbeszélt megoldás
const newsItemsHash = useNewsItemsHash(newsItems);

useEffect(() => {
  // Csak akkor mentsünk, ha:
  // 1. A fül aktív (ne mentsünk a háttérben betöltődő, inaktív fülekről).
  // 2. Vannak hírek, amiket el lehet menteni.
  // 3. A fül 'news' módban van (videókat vagy 'new' fület nem mentünk itt).
  // 4. A betöltés már befejeződött.
  if (isActive && newsItems.length > 0 && mode === 'news' && !loading) {
    const tabContentData: TabContentData = {
      id: activeTabId,
      articles: newsItems.map(item => ({
        id: item.id || '',
        title: item.title || '',
        sourceId: item.sourceId || ''
      })),
      timestamp: Date.now(),
      meta: {
        lastFetched: Date.now(),
        originalNews: newsItems,
        country: filters?.country,
      },
    };

    saveTabContent(tabContentData, activeTabId, filters?.country)
      .then(() => { /* ... */ })
      .catch(error => { /* ... */ });
  }
}, [
  isActive, 
  newsItems,
  newsItemsHash,
  mode, 
  loading, 
  activeTabId, 
  filters?.country, 
  saveTabContent
]);
```

**Fontos:**  
Itt csak akkor menti el a híreket cache-be, ha  
`mode === 'news'`  
Tehát csak a sima országos hírek, vagy a sima tab hírek kerülnek cache-be!

---

### Miért nem menti el a home keresés találatait?

Mert a home keresésnél a `mode === 'search'`,  
és a fenti cache-elő useEffect csak `'news'` módban fut le.

---

### Mit lehet tenni, ha a home keresés találatait is cache-elni szeretnéd?

- Ki kell egészíteni a cache-elő useEffect-et, hogy `mode === 'search'` esetén is mentsen,  
  vagy külön cache-elő logikát írni a keresési találatokra.

**Példa:**
```tsx
if (
  isActive &&
  ((mode === 'news' && newsItems.length > 0) ||
   (mode === 'search' && filteredItems.length > 0)) &&
  !loading
) {
  // ...mentési logika...
}
```
De a keresési találatok cache-elése bonyolultabb lehet, mert a keresési feltételeket is el kell menteni, hogy vissza lehessen tölteni.

---

**Összefoglalva:**  
- A sima országos hírek cache-elése a TabPanel-ben a fenti useEffect-ben történik, csak `'news'` módban.
- A home keresés (mode === 'search') NINCS cache-elés alatt.
- Ha szeretnéd, hogy a home keresés is cache-elődjön, külön logikát kell írni rá, és a keresési feltételeket is el kell menteni.


==================================================
A sima hírek (ország/tab hírek) cache-be mentése a következőképpen történik:

**1. Hol történik a mentés?**
- A fő logika a TabPanel.tsx komponensben van.
- A cache mentést egy useEffect végzi, amely csak akkor fut le, ha a tab aktív, van hír, a mode 'news', és nem tölt be éppen (`!loading`).

**2. Milyen fájlok érintettek?**
- TabPanel.tsx – itt van a mentési useEffect.
- useTabCache.ts – ebben van a tényleges cache mentés (memória + IndexedDB).
- useStorage.ts – ebben van az IndexedDB művelet (saveTabContent).

**3. Mi ennek a keresésnek a neve?**
- A keresőbe ezt írd:  
  `saveTabContent`  
  vagy  
  `cache mentés`  
  vagy  
  `TabPanel news cache`  
- A mentési useEffect feltétele:  
  `if (isActive && newsItems.length > 0 && mode === 'news' && !loading) { ... }`

**4. Mit csinál pontosan?**
- A TabPanel komponensben, ha a fenti feltétel teljesül, létrejön egy `tabContentData` objektum, amit a `saveTabContent` függvény elment a cache-be (memória + IndexedDB).

**5. Meg tudjuk nézni?**
- Igen, keresd meg a `saveTabContent` hívásokat a TabPanel.tsx-ben, és nézd meg a kapcsolódó hookokat (`useTabCache`, `useStorage`).

src\hooks\useTabStorage\useTabCache.ts

src\hooks\useTabStorage\useStorage.ts
=========================================================

