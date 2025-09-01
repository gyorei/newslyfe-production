# Content async adatkezelés és böngészőszintű race condition-védelem

Ez a mappa tartalmazza a Content komponenshez tartozó adatkezelő hookokat és logikát, különös tekintettel a **böngésző-szintű adatkonzisztencia-védelemre**.

## Fő komponensek
- **Content.tsx**: A fő tartalomkezelő React komponens, amely tab-alapú hírolvasást, cache-t, scroll pozíció mentést és aszinkron adatkezelést valósít meg.
- **useNewsData.ts**: Egyedi hook, amely a hírek lekérését, cache-elését, és a race condition elleni védelmet biztosítja.

---

## Alkalmazott módszertanok

### 1. **Tab-alapú cache és instant tartalomváltás**
- Minden tabhoz külön cache tartozik (`tabStates`), így tabváltáskor azonnal, villámgyorsan jelenik meg a tartalom.
- Új adat csak explicit frissítéskor vagy első betöltéskor töltődik le.
- Tab bezárásakor csak az adott tab cache törlődik.

### 2. **Per-tab scroll pozíció mentés/visszaállítás**
- Minden tabhoz külön scroll pozíciót tárolunk (`ScrollStorage`), így tabváltáskor pontosan oda ugrik vissza a felhasználó, ahol abbahagyta.

### 3. **Race condition védelem: requestToken + AbortController**
- **requestToken**: Minden tabváltáskor vagy új lekéréskor egyedi token generálódik (`crypto.randomUUID()`), amely végigmegy a teljes adatlekérő láncon.
- **AbortController**: Minden tabváltáskor új AbortController jön létre, a régit azonnal abortáljuk.
- Minden async fetch előtt ellenőrizzük az `abortSignal`-t, és ha megszakadt, azonnal visszatérünk.
- Minden async fetch után ellenőrizzük, hogy a válaszhoz tartozó token egyezik-e az aktuálissal. Ha nem, a választ eldobjuk, így sosem írhatja felül egy régi válasz az új tab tartalmát.
- A fetch hívásoknál a signal átadásával a hálózati kérés is azonnal megszakad, ha már nem releváns.

### 4. **Időbélyeges cache és duplikáció-védelem**
- Minden lekérés cache-elve van időbélyeggel, így 30 másodpercig ugyanaz a kérés nem fut le újra.
- A cache mérete limitált (pl. 10 bejegyzés), a legrégebbi automatikusan törlődik.
- Duplikált vagy párhuzamos lekérések elkerülése: isLoadingRef, lastRequestRef.

### 5. **UI/UX**
- Ha van cache, a tartalom azonnal megjelenik, csak egy kis spinner látszik, amíg frissül.
- Ha nincs cache, teljes loading overlay jelenik meg.
- A tabok, keresés, videó mód, minden aszinkron adatkezelés teljesen izolált.

---

## Analógia: Böngésző szintű védelem
- **Navigation Token**: Mint a Chrome/Firefox tabváltásnál, minden navigációhoz egyedi token tartozik.
- **AbortController**: Mint a böngésző fetch stackjében, minden tabváltáskor azonnal megszakadnak a régi kérések.
- **State pollution elleni védelem**: Régi válasz sosem írhatja felül az új tab tartalmát.

---

## Kódminták

**requestToken + AbortController használat:**
```ts
// Content.tsx
const tabRequestTokenRef = useRef<string>('');
const abortControllerRef = useRef<AbortController | null>(null);

useEffect(() => {
  // Tabváltáskor új token és új abort controller
  const token = crypto.randomUUID();
  tabRequestTokenRef.current = token;
  if (abortControllerRef.current) {
    abortControllerRef.current.abort();
  }
  abortControllerRef.current = new AbortController();
  return () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
  };
}, [activeTabId]);

// useNewsData.ts
const fetchNews = useCallback(async () => {
  const currentToken = requestToken;
  if (abortSignal?.aborted) return [];
  // ...
  // fetch után:
  if (requestToken && currentToken !== requestToken) {
    console.warn('[useNewsData] 🛑 Token mismatch – válasz figyelmen kívül hagyva');
    return [];
  }
  setNewsItems(fetchedItems);
  return fetchedItems;
}, [...]);
```

---

## Összefoglaló
Ez a minta garantálja, hogy:
- Minden tabváltás teljesen izolált processznek felel meg (mint a böngészőben)
- Nincs többé race condition vagy state pollution
- A fetch-ek azonnal megszakadnak, ha már nem relevánsak
- A felhasználó mindig a helyes, naprakész tartalmat látja

---

**Karbantartó:**
- Kód: `Content.tsx`, `useNewsData.ts`
- Utolsó frissítés: 2024-06 

---

## 2024-07 JAVÍTÁS: forceRefresh (API frissítés) lánc végleges megoldása

Korábban előfordult, hogy a Local gomb megnyomására a hírek nem mindig frissültek API-ból, hanem a cache-ből jöttek vissza, mert a forceRefresh flag elveszett a filterláncban vagy a React effektláncban.

**A megoldás lépései:**
- A `useAppTabs` mindig explicit beállítja a `forceRefresh: true`-t a local tab filterjeiben.
- A `Content.tsx` nagy adatbetöltő useEffect-je már nem csak az `activeTabId`, hanem az `activeTab.filters` változására is lefut, így a filterek minden változása (pl. forceRefresh) új adatbetöltést indít.
- A `useNewsData.ts`-ben a `fetchNews` callback a `prepareFilters` hívásnál már az aktuális `activeTab.filters.forceRefresh` értékét adja át, nem fixen `false`-t.
- Így a teljes filterláncban a forceRefresh flag végigmegy, a `fetchLocalNews` és a `FrontLocal.getNews` is megkapja, és ténylegesen API hívás történik, cache bypass-szal.

**Eredmény:**
- A Local gomb minden megnyomására garantáltan friss adat jön az API-ból, nincs többé beragadt cache!
- A logokban végigkövethető, hogy a forceRefresh: true végigmegy a teljes láncon.

--- 