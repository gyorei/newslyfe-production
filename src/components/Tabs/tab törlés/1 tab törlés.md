Tökéletes, a logok megint mindent elárulnak! A `closeTab` kód, amit beillesztettél, **teljesen helyes.**

A probléma, ahogy te is ráéreztél, **már nem a `useAppTabs.ts`-ben van.** A logokból ez egyértelműen látszik:

```
useAppTabs.ts:363 [useAppTabs] Az aktív fület (filtered-tab-1754025902461) zárjuk be...
```

Ez a sor azt jelenti, hogy amikor te a 3. fület törlöd (miközben az 5. az aktív), a `closeTab` függvény **hibásan azt hiszi, hogy az aktív fület törlöd.**

**Hogy lehet ez?**

Az egyetlen magyarázat, hogy a törlés (`onCloseTab`) és a fül aktiválása (`onActivateTab`) események valahogy **összekeverednek vagy egyszerre sülnek el** a felhasználói felületen, a `DraggableTabs` vagy a `DragTab` komponensben.

### Diagnózis: Eseménykeveredés a `DragTab` komponensben

A legvalószínűbb forgatókönyv:

1.  Van 5 füled, az 5. aktív.
2.  Rákattintasz a 3. fül "X" gombjára a törléshez.
3.  **Ami valójában történik:**
    *   A kattintás először aktiválja a 3. fület (az `onActivateTab` esemény elsül). Ezt látjuk a logok elején is, amikor rákattintasz a tabra: `[DragTab] Tab kattintás: ...`
    *   **Közvetlenül utána**, ugyanaz a kattintás elsüti a törlés eseményt is (`onCloseTab`), ami az "X" gombon van.
4.  Emiatt a `closeTab` függvény már egy olyan állapotot lát, ahol a 3. fül az aktív, ezért helyesen úgy dönt, hogy az aktív fület törli, és a tőle jobbra lévőre (a 4.-re) ugrik.

Ez egy klasszikus "event bubbling" vagy "event propagation" probléma. A belső "X" gombra kattintás "felbuborékol" a külső fül `div`-re, és annak a `onClick` eseményét is elsüti.

---

### A Javítás: Az Események Szétválasztása (`stopPropagation`)

A megoldás az, hogy megakadályozzuk, hogy a törlés gombra való kattintás továbbterjedjen a fülre magára. Ezt a `stopPropagation()` metódussal lehet elérni.

**Feladat:** Keresd meg azt a komponenst, ahol a fül és a benne lévő "X" gomb renderelődik. Ez valószínűleg a `DragTab.tsx` vagy a `DraggableTabs.tsx` lesz.

Keresd meg az "X" gombhoz tartozó `onClick` eseménykezelőt, és egészítsd ki így:

```typescript
// Valahol a DragTab.tsx vagy DraggableTabs.tsx fájlban

// ...

const handleCloseClick = (event: React.MouseEvent) => {
  // 1. MEGÁLLÍTJUK AZ ESEMÉNY TOVÁBBTERJEDÉSÉT!
  // Ez megakadályozza, hogy a külső div onClick-je (ami aktiválja a fület) is lefusson.
  event.stopPropagation();
  
  // 2. Ezután hívjuk meg a tényleges törlési funkciót.
  onCloseTab(tab.id); 
};

// ...

return (
  <div onClick={() => onActivateTab(tab.id)}> {/* Ez a külső div */}
    <span>{tab.title}</span>
    
    {/* Itt az "X" gomb, ami a fenti eseménykezelőt használja */}
    <button onClick={handleCloseClick}>X</button> 
  </div>
);
```

**Konkrét teendő:**

1.  **Nyisd meg a `DragTab.tsx` vagy `DraggableTabs.tsx` fájlt.**
2.  Keresd meg a törlésért felelős "X" ikont vagy gombot (`<button>`, `<span>`, `<div>`, stb.).
3.  Az `onClick` eseménykezelőjének adj át egy esemény objektumot (`event`).
4.  **Az eseménykezelő legelső soraként hívd meg az `event.stopPropagation()`-t.**

Ezzel a módosítással az "X"-re kattintás csak és kizárólag a `onCloseTab` függvényt fogja meghívni, az `onActivateTab`-ot nem. Így a `useAppTabs` `closeTab` logikája már a helyes állapotot fogja látni (az 5. fül az aktív), és helyesen fogja végrehajtani a törlést anélkül, hogy fület váltana.

A `useAppTabs.ts` kódod most már **tökéletes**, a hiba a felhasználói felület eseménykezelésében van.
==============================================================

Rendben, köszönöm a fájlokat! Most már mindent látok. Az elemzés megerősíti a korábbi diagnózist, és pontosan meg tudom mutatni, hol kell javítani.

**A diagnózis helyes volt: A hiba a `DragTab.tsx`-ben van, és egy eseménykezelési probléma okozza.**

---

### Elemzés: Hol van a hiba?

Nézzük meg a `DragTab.tsx` releváns részeit:

**1. A külső, fület aktiváló esemény:**

```typescript
// src/components/Tabs/DragTab/DragTab.tsx

// ...

// Kattintás kezelése
const handlePointerUp = (_e: React.PointerEvent) => {
  if (isDragging) {
    return;
  }
  console.log('[DragTab] Tab kattintás:', { id, title, mode });
  onClick(); // <-- EZ AZ `onActivateTab` HÍVÁSA
};

// ...

return (
  <div
    // ...
    onPointerUp={handlePointerUp} // <-- ITT VAN REGISZTRÁLVA
    // ...
  >
    <span>{title}</span>
    
    <button
      className={dragStyles.closeTab}
      onClick={handleCloseClick} // <-- Ez a törlés gomb
      // ...
    >
      ×
    </button>
    
    {/* ... */}
  </div>
);
```
A teljes `div` (ami a fület reprezentálja) `onPointerUp` eseményre (ami a `onClick`-hez hasonlóan a kattintás végén sül el) meghívja az `onClick` propot. Ez a `DraggableTabs.tsx`-ben az `onActivateTab`-ra van bekötve.

**2. A belső, törlő gomb eseménye:**

```typescript
// src/components/Tabs/DragTab/DragTab.tsx

// ...

// Bezárás kezelése
const handleCloseClick = (e: React.MouseEvent) => {
  e.stopPropagation(); // <-- EZ MÁR OTT VAN ÉS JÓ!
  e.preventDefault();
  setTimeout(() => {
    onClose(); // <-- EZ AZ `onCloseTab` HÍVÁSA
  }, 50);
};

// ...

<button
  className={dragStyles.closeTab}
  onClick={handleCloseClick}
  onPointerDown={(e) => e.stopPropagation()} // <-- EZ IS NAGYON JÓ VÉDELEM
  onMouseDown={(e) => e.stopPropagation()}   // <-- EZ IS NAGYON JÓ VÉDELEM
  // ...
>
  ×
</button>
```
Itt látszik, hogy te már **nagyon profin beépítetted a védelmet a `stopPropagation()`-nel!** Elméletileg ennek meg kellene akadályoznia, hogy a gombra kattintás "felbuborékoljon" a külső `div`-re.

**Akkor miért nem működik?**

A probléma az események típusában rejlik.
*   A külső `div` a **`onPointerUp`** eseményt figyeli.
*   A belső `button` az **`onClick`** eseményt kezeli.

Bár a `stopPropagation` ott van, lehetséges, hogy a `pointer` események és a `click` események közötti interakció miatt a `div` eseménykezelője mégis lefut. A `pointer` események egy modernebb, komplexebb rendszert alkotnak.

A legtisztább és legbiztosabb megoldás, ha a külső `div`-en is a hagyományos `onClick` eseményt használjuk, és a belső gomb `onClick`-jében van a `stopPropagation`.

---

### A Javítás: Eseménykezelők Egységesítése és Biztosítása

Csináljunk két apró, de kulcsfontosságú módosítást a `DragTab.tsx`-ben, hogy garantáltan szétválasszuk a két funkciót.

**Feladat:** Nyisd meg a `src/components/Tabs/DragTab/DragTab.tsx` fájlt, és módosítsd a következőket:

**1. A külső `div` eseménykezelőjének cseréje `onClick`-re:**

```typescript
// src/components/Tabs/DragTab/DragTab.tsx

// ...

// Kattintás kezelése (EZ A FÜGGVÉNY MARAD, DE AZ ESEMÉNY VÁLTOZIK)
// A 'handlePointerUp' nevet átnevezhetjük 'handleClick'-re a tisztaság kedvéért, de nem kötelező.
const handleClick = () => {
  if (isDragging) {
    return;
  }
  console.log('[DragTab] Tab kattintás:', { id, title, mode });
  onClick();
};

// ...

return (
  <div
    // ...
    // onPointerUp={handlePointerUp} // <-- EZT CSERÉLJÜK LE
    onClick={handleClick}          // <-- ERRE
    // ...
  >
    {/* ... */}
  </div>
);
```

**2. A belső `button` `onClick` kezelőjének megerősítése:**

A `handleCloseClick` függvényed már tökéletes, mert tartalmazza a `e.stopPropagation()`-t. Ellenőrizzük, hogy biztosan a `button` `onClick`-jére van-e kötve. Igen, a kódod alapján ott van.

```typescript
// ...

const handleCloseClick = (e: React.MouseEvent) => {
  e.stopPropagation(); // <-- A kulcsfontosságú sor
  e.preventDefault();
  setTimeout(() => {
    onClose();
  }, 50);
};

// ...

<button
  className={dragStyles.closeTab}
  onClick={handleCloseClick} // <-- Helyesen van bekötve
  // ...
>
  ×
</button>
```

**Miért fog ez működni?**

1.  Most már a külső `div` és a belső `button` is ugyanazt az eseménytípust (`onClick`) használja.
2.  Amikor a `button`-ra kattintasz, az `onClick` esemény elsül.
3.  A `handleCloseClick` függvény lefut, és az **első dolga, hogy meghívja a `e.stopPropagation()`-t.**
4.  Ez megakadályozza, hogy a `onClick` esemény "felbuborékoljon" a DOM-fán a szülő `div`-ig.
5.  Ennek eredményeként a `div` `onClick` eseménye (ami a `handleClick`-et hívná) **soha nem fog lefutni.**
6.  Így csak a `onClose()` hívódik meg, az `onClick()` (vagyis az `onActivateTab()`) nem.

A `useAppTabs.ts` logikád így már a helyes állapotot fogja megkapni (az 5. fül marad aktív), és a törlés a várt módon fog működni.

**Végezd el az 1. pontban leírt cserét a `DragTab.tsx`-ben (`onPointerUp` -> `onClick`), és a probléma meg fog oldódni.**

===============================================

Igen, **pontosan így gondoltam!** Tökéletes.

A log és a kód együttesen bizonyítják, hogy a javítás sikeres volt. Nézzük meg, mit látunk:

### A Logok bizonyítéka:

```
useAppTabs.ts:369 [useAppTabs] Inaktív fület (filtered-tab-1754026952455) zárunk be, az aktív fül (filtered-tab-1754026979111) változatlan marad.
```

Ez a sor a legfontosabb. A `closeTab` függvény most már helyesen ismeri fel, hogy egy **inaktív** fület törölsz, és expliciten közli, hogy az aktív fül (`...979111`, azaz "Kuwait") **változatlan marad.** Pontosan ez volt a cél. Nincs többé téves "Jobbra lévő tab aktiválva" üzenet.

```
App.tsx:123 [App] Tartalom típus változott: text Aktív tab: {id: 'filtered-tab-1754026979111', title: 'Kuwait', active: true, mode: 'news', filters: {…}}
```
És a renderelés végén az `App` komponens is megerősíti, hogy az aktív fül valóban a "Kuwait" maradt.

### A Kód bizonyítéka (`DragTab.tsx`):

```typescript
// ...

const handleClick = () => {
  // ...
  onClick(); // Ez aktiválja a fület
};

// ...

return (
  <div
    // ...
    onClick={handleClick} // <-- A külső div onClick-et használ
    // ...
  >
    <span>{title}</span>
    <button
      // ...
      onClick={handleCloseClick} // <-- A belső gomb is onClick-et használ
      // ...
    >
      ×
    </button>
  </div>
);
```

Ez a szerkezet, ahol a `handleCloseClick`-ben ott van a `e.stopPropagation()`, garantálja, hogy a gombra kattintás nem fogja aktiválni a fület.

---

## Összegzés: Cél Teljesítve! 🎉

Ezzel a módosítással a tab törlési logika most már **teljesen megegyezik a modern böngészők viselkedésével**, és a felhasználói élmény is pontosan olyan, amilyennek lennie kell:

*   **Ha az aktív fület törlöd:** A jobbra (vagy balra) lévő fül lesz az új aktív.
*   **Ha egy inaktív fület törlöd:** Az aktív fül változatlan marad.

**Kiváló munka!** Megtaláltuk a hiba valódi okát (eseménykezelés a UI-ban), és egy tiszta, megbízható megoldással javítottuk. A `useAppTabs.ts` hook logikája most már tökéletesen érvényesül.
=============================================

Tökéletes, köszönöm a fájlokat! Most már minden információ a rendelkezésemre áll. A `useTabCache.ts` a hiányzó láncszem.

Az elemzés megerősíti a korábbiakat: a logika a helyén van, de a beállítások nem a kívánt felhasználói élményt szolgálják.

---

### Elemzés: Hol van a probléma?

**1. `useTabCache.ts`: A Cache Lejárati Ideje**

```typescript
// src/hooks/useTabStorage/useTabCache.ts

// Cache érvényességi konfiguráció
const CACHE_CONFIG = {
  MAX_AGE: 2 * 60 * 60 * 1000, // 2 óra
  REFRESH_INTERVAL: 15 * 60 * 1000, // 15 perc
};

// ...

const isCacheFresh = useCallback(async (tabId: string, maxAgeMinutes: number = 30) => {
    // ...
    const isFresh = (now - entry.timestamp) < (maxAgeMinutes * 60 * 1000);
    // ...
}, [getTabContentFromStorage]);
```

*   **`MAX_AGE`:** A memória cache-ből 2 óra után törlődnek az elemek. Ez jó.
*   **`REFRESH_INTERVAL`:** A háttérfrissítés 15 perc után indul el.
*   **`isCacheFresh`:** A `useNewsData` ezt a függvényt hívja, aminek az alapértelmezett lejárati ideje **30 perc** (`maxAgeMinutes: number = 30`). **Ez a fő bűnös.** Ezért indít a rendszer API hívást, ha 30 percnél régebbi a cache.

**2. `useNewsData.ts`: A "Lejárt" Cache Kezelése**

```typescript
// src/components/Content/hooks/useNewsData.ts

// ...
const tabCacheIsFresh = await isCacheFresh(activeTabId);

if (FEATURE_USE_CACHE_FRESHNESS && tabCacheIsFresh && tabContentFromCache?.meta?.originalNews) {
    // Ha a cache friss, használjuk.
} else {
    // Ha a cache NEM friss, API hívás jön.
    console.log(`[useNewsData] ⚪ Nincs friss cache vagy lejárt, API hívás: ${activeTabId}`);
    // ... API hívás ...
}
// ...
```
Itt látszik, hogy ha az `isCacheFresh` `false`-t ad vissza (mert a 30 perces limit lejárt), a kód azonnal az API híváshoz ugrik. Ezt kell megváltoztatnunk.

---

### A Javítás: A Kívánt Viselkedés Implementálása

A célunkat két lépésben érjük el:

1.  **A "lejárat" fogalmának átdefiniálása:** A 30 perc túl rövid. Állítsuk be a felhasználói élményhez jobban illeszkedő, hosszabb időre.
2.  **Az API hívási logika módosítása:** A `useNewsData` ne hívjon API-t automatikusan, ha a cache lejárt, hanem mindig használja, ami van.

**Feladat:** Végezd el a következő módosításokat.



#### 2. LÉPÉS: A `useNewsData.ts` Adatbetöltési Logikájának Átírása

Most jön a lényeg. Átírjuk a `fetchNews` logikáját, hogy a cache-t részesítse előnyben.

```typescript
// src/components/Content/hooks/useNewsData.ts

// ...

const fetchNews = useCallback(async () => {
  // ... a függvény eleje (token, abortSignal, stb.) változatlan ...

  // ✅ ÚJ, ÁTÍRT LOGIKA KEZDETE
  const forceRefresh = activeTab?.filters?.forceRefresh || false;

  // 1. Ha NINCS kényszerített frissítés, ELŐSZÖR MINDIG a cache-ből próbálunk tölteni.
  if (!forceRefresh) {
    const tabContentFromCache = await getTabContent(activeTabId, activeTab?.filters?.country);
    
    if (tabContentFromCache?.meta?.originalNews) {
      console.log(`[useNewsData] ✅ Cache használata, API hívás kihagyva: ${activeTabId}`);
      setNewsItems(tabContentFromCache.meta.originalNews as NewsItem[]);
      if (setNewsItemsToken) setNewsItemsToken(requestToken!);
      setLoading(false); // Biztosítsuk, hogy a loading leálljon
      return tabContentFromCache.meta.originalNews as NewsItem[];
    }
  }
  
  // 2. API HÍVÁS CSAK AKKOR, HA:
  //    a) Nincs semmi a cache-ben (az előző blokk nem talált semmit)
  //    b) VAGY a frissítés kényszerítve van (`forceRefresh` igaz)
  console.log(`[useNewsData] ⚪ Nincs cache vagy frissítés kényszerítve, API hívás: ${activeTabId}`);

  // ... (az eredeti API hívó logika innentől következik)
  // A DUPLIKÁCIÓ VÉDELEM (isLoadingRef, stb.) és a setLoading(true) itt kezdődjön.
  
  if (isLoadingRef.current) return [];
  isLoadingRef.current = true;
  lastRequestRef.current = JSON.stringify({ tabId: activeTabId, filters: activeTab?.filters });
  setLoading(true);
  setError(null);

  try {
    const currentFilters = prepareFilters(
      activeTab?.filters ?? {},
      maxAgeHours,
      forceRefresh
    );
    // ... (fetchContinentNews / fetchLocalNews hívása) ...
  } catch (err) {
    // ... (hiba kezelése) ...
  } finally {
    isLoadingRef.current = false;
    setLoading(false);
  }
  // ✅ ÚJ LOGIKA VÉGE

}, [activeTabId, activeTab?.filters, ..., getTabContent]); // Fontos a getTabContent dependency!
```

### Összefoglalás

1.  **A `useTabCache.ts`-ben** növeld meg az `isCacheFresh` alapértelmezett idejét `30`-ról `1440`-re (24 óra).
2.  **A `useNewsData.ts`-ben** írd át a `fetchNews` függvény elejét a fenti séma szerint:
    *   Először `getTabContent`-tel próbálj tölteni.
    *   Ha sikeres, használd az eredményt és `return`.
    *   Az API hívó blokk csak ezután következzen.

Ezzel a két módosítással a rendszer pontosan úgy fog viselkedni, ahogy leírtad: a tabváltás gyors lesz és a cache-ből dolgozik, az API hívások pedig csak akkor történnek, ha a felhasználó expliciten kéri (új keresés, frissítés gomb), vagy ha egy fülhöz még egyáltalán nincs letöltött adat.
================================================================
