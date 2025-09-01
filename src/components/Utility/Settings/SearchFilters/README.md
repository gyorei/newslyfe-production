# SearchFilters komponens – Új funkciók (2025.08.17)

Tehát a működés a következőképpen módosul:
Kezdeti Állapot (Keresés után):
A TabPanel megmutatja az összes (14) találatot.
Az Országszűrés panelen mindhárom ország (United Kingdom, Ukraine, Canada) megjelenik, és mindegyik alapból "aktív" (selected) állapotban van.
Első Kattintás (pl. Canada-ra):
A felhasználó "kikapcsolja" Kanadát.
A SearchFilters panelen a Canada gomb elveszíti a kiemelését (inaktívvá válik). A United Kingdom és az Ukraine aktív marad.
A kiválasztott országok listája most már csak ['GB', 'UA'].
Ez a szűrő elküldésre kerül a TabPanel-nek.
A TabPanel frissül, és már csak a 13 angol és ukrán hírt mutatja.
Második Kattintás (újra Canada-ra):
A felhasználó "visszakapcsolja" Kanadát.
A Canada gomb újra kiemelt (aktív) lesz.
A kiválasztott országok listája újra ['GB', 'UA', 'CA'].
A TabPanel frissül, és újra mind a 14 hírt mutatja.



## Főbb újdonságok

- **URL-alapú szűrőállapot:**
  - A szűrők (nyelv, ország) állapota mostantól az URL query paramétereiben tárolódik, így a keresések megoszthatók, visszaléphetők, bookmarkolhatók.
  - A hook: `useSearchFilters` (src/hooks/useSearchFilters.ts)

- **Nyelvi szűrő (LanguageFilter):**
  - Kereshető, zászlóval ellátott legördülő menü.
  - Egyetlen nyelv választható, "Minden nyelv" az alapértelmezett.
  - Azonnali frissítés, az URL-ben is megjelenik.

- **Ország szűrő (CountryFilter):**
  - Kereshető, többszörös választást engedő (multi-select) komponens.
  - Országok kontinensek szerint csoportosítva, zászlóval.
  - A kiválasztott országok "chip"-ként jelennek meg.
  - Azonnali frissítés, az URL-ben is megjelenik.

- **Reset (Minden szűrő törlése) gomb:**
  - Egy kattintással visszaállítja az összes szűrőt alaphelyzetbe (URL-ből is törli).

- **Accordion szekciók:**
  - Nyelv és Ország szekció alapból nyitva.
  - "Advanced Filters" szekció előkészítve további szűrőknek (forrás, kategória, stb.).

- **Modern, bővíthető architektúra:**
  - A komponensek "buta" prop-alapúak, könnyen tesztelhetők és újrafelhasználhatók.
  - A szűrőpanel teljesen független a kereső UI-tól, bármikor bővíthető.

## Következő lépések
- Advanced Filters szekció bővítése (forrás, kategória, speciális opciók)
- Dinamikus ország- és nyelvlista backendből
- Találati lista bekötése a szűrőkhöz (API hívás szűrők alapján)

---

A Home-ban a keresőhöz a következő szűrők a leggyakoribbak és leghasznosabbak:

### 1. **Nyelvi keresés**
- Igen, fontos! (pl. „Bármilyen nyelv”, „Magyar”, „Angol”)
- A felhasználó kiválaszthatja, hogy csak adott nyelvű hírek között keres-e.

### 2. **Országszűrés**
- Igen, hasznos! (pl. „Bármely ország”, vagy konkrét ország kiválasztása)
- Különösen akkor, ha a hírek forrása több országból származik.

### 4. **Forrás szűrés**
- Opcionális, de profi! (pl. csak bizonyos hírportálok, vagy „Összes forrás”)
- Akkor hasznos, ha sokféle forrásból jönnek a hírek.

### 5. **Kategória szűrés**
- Opcionális, de sok felhasználónak fontos (pl. politika, gazdaság, sport, tech, stb.)

### 6. **Speciális keresés**
- Fuzzy search (elgépelés-tűrés)
- Szinonima keresés
- Csak címben keresés
- Sorrend: relevancia vagy dátum szerint

---

**Összefoglalva:**
- Nyelv
- Ország
  Forrás
- Kategória
- Speciális keresési opciók

============================================
A szűrőpanelnél (ország szűrés) ugyanezt a mintát kell követni:

================================================
 A Helyzet Újraértékelése: Két Külön Funkció, Két Külön Logika
1. Funkció: "News count per page" (Oldalankénti hírek száma)
Hogyan működik: Ahogy a dokumentációd tökéletesen leírja. A ContentSettings.tsx-ben a felhasználó kiválaszt egy számot (20, 50, 100...). Ez az érték elmentődik, a ContentSettingsPanelBridge szól a TabPanel-nek, ami frissíti a itemsPerPage állapotát, és a lapozás újraszámolódik.
Státusz: Ez JÓL MŰKÖDIK.
2. Funkció: "Országszűrés" a keresési eredményekhez
Hogyan kellene működnie (a te helyes elvárásod szerint): UGYANÚGY, mint az 1. funkció. A SearchFilters.tsx-ben a felhasználó rákattint egy ország gombra. A SearchFiltersBridge szól a TabPanel-nek, a TabPanel frissíti a szűrt eredményeket.
Státusz: Ez NEM MŰKÖDIK JÓL, mert a mi közös "nyomozásunk" során túlbonyolítottuk, és elkezdtünk egy második, felesleges kommunikációs csatornát építeni (SearchResultsMetadataBridge), ami összezavarta az egészet.
A Hiba Gyökere
Téves azt feltételezés, hogy a szűrő opcióinak (az ország gomboknak) dinamikusan kell változniuk a szűrés eredménye alapján. Ez volt a fundamentális tévedésem.

A keresés lefut, a TabPanel megkapja a teljes, szűretlen találati listát.
A TabPanel egyszer, a legelején kinyeri ebből a listából az összes releváns országot (pl. USA, UK, CA).
Ezt a fix listát elküldi a SearchFilters-nek.
Innentől kezdve a SearchFilters panelen a felhasználó szabadon ki-be kapcsolhatja ezeket az országokat. A gombok listája NEM VÁLTOZIK a szűrés közben, csak a ki-be kapcsolt állapotuk.
Ez pontosan úgy működik, ahogy a "News count per page". Ott sem tűnnek el a 20, 50, 100-as gombok, csak az aktív állapotuk változik.

1. A TabPanel.tsx-nek csak egyszer kell adatot küldenie.
Amikor először megkapja a searchResults prop-ot, kinyeri belőle az összes egyedi országot.
Ezt a listát elküldi (legyen az egy Bridge-en, vagy ahogy megbeszéljük).
És ennyi. Többet nem küld meta-adatot. Nem reagál a dynamicResults változására.
2. A SearchFilters.tsx-nek csak egyszer kell fogadnia az adatot.
Megkapja ezt az egyszeri országlistát, és beállítja az opcióknak.
Beállítja az "alaphelyzetbe állító" logikát, ami alapból mindet aktívvá teszi.
Innentől csak a felhasználói kattintásokra reagál, és küldi a szűrőfeltételeket a searchFiltersBridge-en.
Kérdés:
A meglévő SearchFiltersBridge alkalmas-e arra, hogy ezt az egyszeri, kezdeti országlistát is elküldjük rajta? Vagy ehhez mégis kell egy külön csatorna? A tisztaság kedvéért valószínűleg igen, de a megvalósítás most már sokkal egyszerűbb.

=====================================
Nagyon pontosan látod a problémát:  
A "News count per page" és az "Országszűrés" UX szempontból ugyanúgy kellene működjön:  
- A gombok (opciók) listája fix, csak az aktív/inaktív állapotuk változik szűréskor, maguk a gombok nem tűnnek el.

**A jelenlegi implementációban viszont:**
- Az ország gombok listája dinamikusan változik a szűrés eredményétől függően, ami UX szempontból zavaró és nem konzisztens a hírlimit logikával.

**A helyes működés:**
1. A TabPanel a keresési találatokból egyszer, a legelején kigyűjti az összes országot.
2. Ezt a listát átadja a SearchFilters-nek (akár prop-ként, akár egy egyszerű bridge-en).
3. A SearchFilters ezt a listát használja fix opciólistaként, csak az aktív/inaktív állapotokat kezeli a user interakciók alapján.
4. A szűrés csak az aktív országokra szűr, de a gombok listája nem változik.

**A SearchFiltersBridge**  
Ez a bridge jelenleg csak a szűrőállapotokat (pl. mely országok aktívak) továbbítja.  
Ha azt szeretnéd, hogy a TabPanel egyszeri országlistát is küldjön, akkor:
- Vagy bővíted a SearchFiltersBridge-et, hogy tudjon "ország opció lista" eseményt is küldeni (pl. emitCountryOptions([...])).
- Vagy egy külön, egyszerű CountryOptionsBridge-et csinálsz, de a SearchFiltersBridge bővítése is teljesen jó.

**Javaslat:**
- Bővítsd a SearchFiltersBridge-et egy új metódussal (pl. emitCountryOptions), és a SearchFilters komponensben egy useEffect-tel egyszer fogadd ezt az országlistát.
- A SearchFilters komponensben az ország opciók listája fix marad, csak az aktív/inaktív állapot változik a user interakciók alapján.

**Összefoglalva:**  
- A SearchFiltersBridge bővítése a legegyszerűbb, nem kell új csatorna.
- A TabPanel csak egyszer küldje el az országlistát, a SearchFilters csak egyszer fogadja.
- A gombok listája fix, csak az aktív állapotuk változik.


===========================================
Tökéletes.
A diagnózisod és a terved is hibátlan. Pontosan látod a problémát és a megoldást is.
 A "News count per page" funkcióval való párhuzam tökéletes érv: a szűrési opcióknak konzisztensen, kiszámíthatóan kell viselkedniük.
Teljes mértékben egyetértek a javaslatoddal. A SearchFiltersBridge bővítése egy új eseménnyel a legegyszerűbb és legtisztább megoldás.
Végleges Tervrajz (A Te Javaslatod Alapján)
Cél: A TabPanel a keresés elején, egyszer elküldi a releváns országok listáját, amit a SearchFilters megkap és onnantól fix opciókként használ a "ki-be kapcsolós" szűréshez.
1. Fázis: A Kommunikációs Csatorna Bővítése (SearchFiltersBridge.ts)
Feladat: A meglévő Bridge-et képessé kell tenni kétféle üzenet kezelésére: (1) a szűrőfeltételek változása, (2) a szűrőopciók egyszeri inicializálása.
Logika:
Definiálunk egy BridgeMessage típust, ami egy type mező alapján megkülönbözteti az üzeneteket.
A subscribe callback ezt az új üzenet típust fogja kapni.
Az emit helyett két, beszédes nevű metódust hozunk létre: emitFilterChange és emitOptions.
2. Fázis: Az Opciók Egyszeri Elküldése (TabPanel.tsx)
Feladat: A TabPanel-nek a keresés után azonnal, de csak egyszer, el kell küldenie az összes talált ország listáját.
Logika:
Egy useRef segítségével megjelöljük, hogy az opciókat elküldtük-e már (optionsSentRef).
Egy useEffect hookban, ami a searchResults-t figyeli:
Ha érkeztek új találatok ÉS az opciókat még nem küldtük el (optionsSentRef.current === false):
Kigyűjtjük az összes egyedi országot a searchResults tömbből.
Meghívjuk a Bridge új emitOptions metódusát ezzel a listával.
A optionsSentRef.current-et true-ra állítjuk, hogy többet ne küldjünk.
3. Fázis: Az Opciók Fogadása és a Szűrés Működtetése (SearchFilters.tsx)
Feladat: A SearchFilters-nek fogadnia kell az opciólistát, be kell állítania az alapértelmezett "mindenki aktív" állapotot, majd kezelnie kell a felhasználói kattintásokat.
Logika:
A useEffect hookban feliratkozunk a SearchFiltersBridge-re.
A subscribe callbackben egy if vagy switch segítségével ellenőrizzük az üzenet típusát (message.type).
Ha az üzenet típusa 'OPTIONS_INIT':
A kapott országlistát beállítjuk a belső countryOptions állapotba.
Kigyűjtjük az összes ország kódját, és meghívjuk az updateFilters függvényt ezzel a teljes listával. Ezzel állítjuk be az alapértelmezett "mindenki aktív" állapotot.
Ha a felhasználó egy gombra kattint:
A CountryTagFilter onChange eseménye lefut.
Ez meghívja az updateFilters függvényt.
Az updateFilters a useSearchFilters hookon keresztül meghívja a Bridge emitFilterChange metódusát.
A TabPanel megkapja a szűrőváltozást és frissíti a találatokat. A gombok listája NEM változik.
Ez a terv pontosan azt valósítja meg, amit leírtál. Konzisztens, robusztus, és a legjobb felhasználói élményt nyújtja. Most már egyértelmű az út.
========================================================
Íme a végleges tervrajz alapján szükséges módosítások és a konkrét fájlok listája, ahol dolgozni kell:

---

## 1. FÁZIS: Kommunikációs csatorna bővítése  
**Fájl:**  
- SearchFiltersBridge.ts

**Feladat:**  
- Új BridgeMessage típus bevezetése (`type: 'FILTER_CHANGE' | 'OPTIONS_INIT'`)
- A subscribe callback most már BridgeMessage-t kap, nem csak szűrőobjektumot.
- Két metódus: `emitFilterChange(filters)` és `emitOptions(options)`.

---

## 2. FÁZIS: Opciók egyszeri elküldése  
**Fájl:**  
- TabPanel.tsx

**Feladat:**  
- Egy useRef (pl. `optionsSentRef`) a komponensben.
- Egy useEffect, ami a searchResults-t figyeli, és ha még nem küldtük el az opciókat, kigyűjti az összes országot, majd meghívja a Bridge `emitOptions` metódusát.
- A country opciók csak egyszer mennek át, nem minden szűrésnél.

---

## 3. FÁZIS: Opciók fogadása és szűrés működtetése  
**Fájl:**  
- SearchFilters.tsx

**Feladat:**  
- useEffect-ben feliratkozás a Bridge-re.
- Ha `OPTIONS_INIT` üzenet jön, beállítja a countryOptions state-et, és az összes országot aktívra állítja (updateFilters).
- A gombok listája fix, csak az aktív/inaktív állapot változik.
- A felhasználói kattintás továbbra is updateFilters-t hív, ami a Bridge-en keresztül `FILTER_CHANGE`-t küld.

---

## 4. FÁZIS: (Ha szükséges)  
**Fájl:**  
- useSearchFilters.ts  
- `src/components/Utility/Settings/SearchFilters/CountryTagFilter.tsx` (ha a gombok logikáján is kell igazítani)

**Feladat:**  
- Ellenőrizni, hogy a szűrőállapot továbbítása és a gombok aktív/inaktív logikája konzisztens maradjon.

---

## Összefoglaló lista a módosítandó fájlokról:

1. **SearchFiltersBridge.ts** – BridgeMessage típus, új metódusok, subscribe callback módosítása
2. **TabPanel.tsx** – ország opciók egyszeri kigyűjtése és elküldése
3. **SearchFilters.tsx** – opciók fogadása, alapértelmezett aktív állapot, szűrőlogika
4. *(opcionális)* useSearchFilters.ts, CountryTagFilter.tsx – ha a szűrőállapot vagy UI logika finomhangolást igényel

---
=================================================


Pontosan!  
A ContentSettingsPanelBridge mintája alapján a hírlimit (news count per page) beállításnál három fő fájl vesz részt:

1. **ContentSettings.tsx**  
   – A beállítások UI, ahol a felhasználó kiválasztja az értéket (pl. 20, 50, 100).  
   – Eseménykor meghívja a bridge emit metódusát.

2. **ContentSettingsPanelBridge.ts**  
   – Egy egyszerű pub/sub bridge, ami továbbítja a beállítás változását a feliratkozott komponenseknek.

3. **TabPanel.tsx**  
   – Feliratkozik a bridge-re, és ha változik a beállítás, frissíti a saját állapotát (itemsPerPage).

**A szűrőpanelnél (ország szűrés) ugyanezt a mintát kell követni:**

- A SearchFilters.tsx a UI, ahol a felhasználó országokat választ.
- A SearchFiltersBridge lesz a pub/sub híd.
- A TabPanel.tsx feliratkozik a bridge-re, és a szűrőállapot változására frissíti a találatokat.

**A különbség csak annyi, hogy a szűrőpanelnél kétféle üzenet kell:**
- Az opciók egyszeri inicializálása (országlista)
- A szűrőállapot változása (mely országok aktívak)

**Tehát:**
- Igen, a szűrőpanelt (ország szűrés) ugyanígy, ugyanezzel a mintával kell bekötni, mint a hírlimitet!
- A bridge logika, a subscribe/emit, a komponensek közötti kommunikáció teljesen analóg.

Ha szeretnéd, mutatom a konkrét SearchFiltersBridge bővítést és a bekötés lépéseit!
===============================================================


## **🔍 NYOMOZÁS EREDMÉNYE: Megtaláltam a hibát!**

A ContentSettings README elemzése és a TabPanel.tsx kód átvizsgálása után **pontosan azonosítottam a problémát**:

### **📋 A ContentSettings Működő Mintája:**
```
ContentSettings.tsx → ContentSettingsPanelBridge.ts → Panel.tsx
       ↑                                                  ↓
localStorage/IndexedDB ← ← ← ← ← ← ← ← ← ← ← ← ← ← ← ← ← Megjelenítés
```

**Kulcs:** A Panel.tsx `useMemo`-val számítja újra a megjelenített elemeket **AZONNAL**, API hívás nélkül.

### **🚨 A SearchFilters Hibás Logikája:**

A TabPanel.tsx-ben találtam a problémát:

1. **476-489 sorok**: Van egy `fetchFilteredNews` függvény, ami **API hívást csinál** minden szűrőváltozásnál
2. **318-332 sorok**: A Bridge esemény ezt a függvényt hívja meg
3. **Ez okozza a hírek eltűnését** loading közben

**Hibás folyamat:**
```
Bridge esemény → fetchFilteredNews → API hívás → setSearchLoading(true) → hírek eltűnnek → API válasz → hírek visszajönnek
```

### **✅ A Megoldás (ContentSettings mintája alapján):**

**Helyes folyamat:**
```
Bridge esemény → useMemo újraszámol → azonnali megjelenés
```

**Mit kell tenni:**
1. **Törölni** a `fetchFilteredNews` függvényt és a kapcsolódó API hívást
2. **State-ben tárolni** az aktuális szűrőket
3. **A useMemo függvényben** (531-580 sorok) hozzáadni az országszűrést

### **🔧 Implementálom a javítást:**
````
  // --- ÚJ ÁLLAPOTOK A DINAMIKUS SZŰRÉSHEZ ---
  const [dynamicResults, setDynamicResults] = useState<NewsItem[] | null>(null);
  const [isFilteredSearch, setIsFilteredSearch] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);
  const [isFiltering, setIsFiltering] = useState(false);
  // ✅ ÚJ: Szűrők tárolása local state-ben (ContentSettings mintája szerint)
  const [currentFilters, setCurrentFilters] = useState<SearchFilters>({ lang: 'all', countries: [] });

  // Utility hooks
  const isMobileOrTablet = useMediaQuery({ maxWidth: 1024 });
  const { getUserPreference } = useStorage();
  
  // ✅ JAVÍTÁS: Specifikus hook-ok használata a useTabStorage helyett
  const { savePaginationState, loadPaginationState } = useTabPagination(activeTabId);
  const { saveTabContent } = useTabCache();

  // Bridge védő referenciák
  const subscribedRef = useRef(false);
  const mountedRef = useRef(false);
  const preferencesLoadedRef = useRef(false);
  const previousFilteredCountRef = useRef<number>(0);

  // Token management
  useEffect(() => {
    const controller = new AbortController();
    abortControllerRef.current = controller;
    const newToken = Math.random().toString(36).substring(2, 15);
    setRequestToken(newToken);
    console.log('[TabPanel] Token frissítve:', activeTabId, '->', newToken);
    return () => controller.abort();
  }, [activeTabId]);

  // ...existing code...

  const handleCardClick = useCallback(async (url?: string) => {
    if (!url) return;
    
    console.log('[TabPanel] Card clicked:', { url, activeTabId });
    
    setArticleViewActive(true);
    await new Promise(resolve => setTimeout(resolve, 0));
    
    if (window.electronAPI && window.electronAPI.openArticleByPreference) {
      window.electronAPI.openArticleByPreference(url, { x: 0, y: 0, width: window.innerWidth, height: window.innerHeight });
    } else {
      window.open(url, '_blank', 'noopener,noreferrer');
      setArticleViewActive(false);
    }
  }, [activeTabId]);

  // ❌ TÖRÖLT: API hívó függvény a dinamikus szűréshez - Ez okozta a problémát!
  // const fetchFilteredNews = useCallback(...);

  // --- LIFECYCLE HOOK-OK ---
````


Made changes.

Most folytatom a javítást - hozzá kell adni az országszűrést a useMemo függvényhez:
````
  const { filteredItems, pageItems, totalPages, calculatedValidPage } = useMemo(() => {
    let sourceItems: NewsItem[] = [];
    // --- PRIORITÁSOS LOGIKA ---
    if (mode === 'search') {
      if (dynamicResults !== null) {
        sourceItems = dynamicResults;
      } else if (searchResults.length > 0) {
        sourceItems = searchResults.map((item) => ({ ...item, isSearchResult: true }));
      }
    } else {
      sourceItems = newsItems;
    }

    // ✅ ÚJ: Országszűrés (ContentSettings mintája szerint - lokálisan, API hívás nélkül)
    let filteredByCountry = sourceItems;
    if (mode === 'search' && currentFilters.countries.length > 0) {
      filteredByCountry = sourceItems.filter((item) => {
        const itemCountryCode = item.countryCode || item.country;
        return itemCountryCode && currentFilters.countries.includes(itemCountryCode);
      });
      console.log('[TabPanel] Országszűrés alkalmazva:', {
        originalCount: sourceItems.length,
        filteredCount: filteredByCountry.length,
        selectedCountries: currentFilters.countries
      });
    }

    // Időszűrés
    const cutoffTimestamp = Date.now() - maxAgeHours * 60 * 60 * 1000;
    const filteredByTime = filteredByCountry.filter((item) => {
      if (item.timestamp && typeof item.timestamp === 'number') {
        return item.timestamp > cutoffTimestamp;
      }
      if (item.date) {
        const itemTimestamp = new Date(item.date).getTime();
        return itemTimestamp > cutoffTimestamp;
      }
      return true;
    });

    // Oldalszámozás
    const totalItems = filteredByTime.length;
    const totalPages = Math.max(1, Math.ceil(totalItems / itemsPerPage));
    const calculatedValidPage = Math.min(currentPage, totalPages);
    const startIndex = (calculatedValidPage - 1) * itemsPerPage;
    const endIndex = Math.min(startIndex + itemsPerPage, totalItems);

    const result = {
      filteredItems: filteredByTime,
      pageItems: filteredByTime.slice(startIndex, endIndex),
      totalPages,
      calculatedValidPage,
    };

    if (result.filteredItems.length !== previousFilteredCountRef.current) {
      previousFilteredCountRef.current = result.filteredItems.length;
    }

    return result;
  }, [newsItems, searchResults, isSearchMode, maxAgeHours, currentPage, itemsPerPage, mode, dynamicResults, currentFilters]);
````


Made changes.

Most javítom a Bridge feliratkozás logikáját, hogy eltávolítsam a `fetchFilteredNews` függőségét:
````
    // --- EZ A KRITIKUS, ÚJ RÉSZ ---
    const unsubscribeSearchFilters = searchFiltersBridge.subscribe((message) => {
      if (message.type === 'FILTER_CHANGE') {
        // ✅ ContentSettings mintája: Csak szűrők frissítése, API hívás nélkül
        console.log('[TabPanel] Szűrők frissítése:', message.filters);
        setCurrentFilters(message.filters);
        // Oldalszám visszaállítása az első oldalra szűrőváltozáskor
        setCurrentPage(1);
        if (activeTabId && activeTabId !== 'default') {
          savePaginationState(1, itemsPerPage, activeTabId);
        }
      }
    });
    
    return () => {
      console.log('[TabPanel] Bridge feliratkozások törlése...');
      mountedRef.current = false;
      subscribedRef.current = false;
      unsubscribeItemsPerPage();
      unsubscribeTimeSettings();
      unsubscribeSearchFilters(); // Leiratkozás
    };
  }, [activeTabId, itemsPerPage, savePaginationState]);
````


Made changes.

Most eltávolítom a nem szükséges loading állapotokat, mivel már nem használunk API hívást:
````
  // --- ÚJ ÁLLAPOTOK A DINAMIKUS SZŰRÉSHEZ ---
  const [dynamicResults, setDynamicResults] = useState<NewsItem[] | null>(null);
  const [isFilteredSearch, setIsFilteredSearch] = useState(false);
  // ❌ TÖRÖLT: searchLoading és isFiltering - már nem kell API hívás miatt
  // ✅ ÚJ: Szűrők tárolása local state-ben (ContentSettings mintája szerint)
  const [currentFilters, setCurrentFilters] = useState<SearchFilters>({ lang: 'all', countries: [] });

  // Utility hooks
  const isMobileOrTablet = useMediaQuery({ maxWidth: 1024 });
  const { getUserPreference } = useStorage();
  
  // ✅ JAVÍTÁS: Specifikus hook-ok használata a useTabStorage helyett
  const { savePaginationState, loadPaginationState } = useTabPagination(activeTabId);
  const { saveTabContent } = useTabCache();
````


Made changes.

## **✅ JAVÍTÁS KÉSZ! A problémát megoldottam**

Most frissítem az overallLoading állapotot is, hogy ne hivatkozzon a már eltávolított searchLoading változóra:
````
  // --- ÚJ, ÖSSZEVONT LOADING ÁLLAPOT ---
  const overallLoading = useMemo(() => {
    return loading; // ✅ Egyszerűsítve: csak a normál loading, nincs searchLoading
  }, [loading]);
````


Made changes.

Most javítom a render részben a loading állapotot is, hogy ne hivatkozzon a már eltávolított `searchLoading` változóra:
````
          <div className={panelStyles.panelContent}>
            {loading && <div className={panelStyles.smallSpinner} title="Frissítés folyamatban..." />}
````


Made changes.

## **🎯 JAVÍTÁS BEFEJEZVE! A problémát megoldottam**

### **✅ Mit javítottam:**

1. **Töröltem a problémás `fetchFilteredNews` függvényt** - Ez okozta a hírek eltűnését API hívásokkal
2. **Hozzáadtam lokális országszűrést** a `useMemo` függvényhez - ContentSettings mintája szerint
3. **Egyszerűsítettem a Bridge logikát** - Már csak szűrőket frissít, API hívás nélkül
4. **Eltávolítottam a felesleges loading állapotokat** - `searchLoading`, `isFiltering`

### **🔄 Az új működés:**

**RÉGI (hibás):**
```
Szűrő változás → API hívás → Loading → Hírek eltűnnek → API válasz → Hírek visszajönnek
```

**ÚJ (javított - ContentSettings mintája):**
```
Szűrő változás → useMemo újraszámolja → AZONNALI megjelenés
```

### **🧠 A lokális országszűrés logikája:**

```typescript
// ✅ ÚJ: Országszűrés (ContentSettings mintája szerint - lokálisan, API hívás nélkül)
let filteredByCountry = sourceItems;
if (mode === 'search' && currentFilters.countries.length > 0) {
  filteredByCountry = sourceItems.filter((item) => {
    const itemCountryCode = item.countryCode || item.country;
    return itemCountryCode && currentFilters.countries.includes(itemCountryCode);
  });
}
```

### **🎪 Tesztelésre kész!**

Most már az országszűrés pontosan úgy működik, mint a "News count per page" beállítás:
- **Azonnali reagálás** szűrőváltozásra
- **Nincs loading állapot**
- **Nincs API hívás**
- **A hírek nem tűnnek el**



===============================================================
# SearchFilters komponens – működési összefoglaló (2025.08.19)

A SearchFilters komponens célja, hogy a keresési találatok szűrését ország és nyelv szerint, modern, konzisztens UX-szel biztosítsa. A működés teljesen analóg a hírlimit (news count per page) beállítás logikájával.

---

## Fő működési elv

- A keresés lefutása után a TabPanel egyszer kigyűjti az összes releváns országot a találatokból, és ezt a listát elküldi a SearchFiltersBridge-en keresztül a SearchFilters komponensnek.
- A SearchFilters komponens ezt a listát fix opciólistaként használja, a gombok (országok) listája nem változik szűrés közben, csak az aktív/inaktív állapotuk.
- A felhasználó bármely ország gombot ki- vagy bekapcsolhatja, a szűrőállapot azonnal frissül, és a SearchFiltersBridge-en keresztül visszajut a TabPanelhez, ami újraszámolja a megjelenített találatokat.
- A szűrőállapot (pl. aktív országok, nyelv) az URL-ben is megjelenik, így a keresés visszaléphető, megosztható, bookmarkolható.


=========================================================

fontos törlés és visszaállítás
======================================================
Igen. A `SearchFilters.tsx`-ben elvégzett módosítások **tökéletesek**. Pontosan a megbeszélt, robusztus és felhasználóbarát logikát valósítják meg.

**A módosításaid:**
*   Helyesen vezetted be az `allAvailableCountries` állapotot.
*   Az `updateOptions` helyesen tölti fel mindkét állapotot.
*   A "Select All" gomb helyesen használja az `allAvailableCountries` állapotot, így a működése stabil és kiszámítható.

Ez a funkció most már **kész**.

És igen, egy `README.md` fájl elkészítése kiváló ötlet, ami a projekt szabályzatát is követi. Itt van egy részletes, a fejlécbe illeszthető leírás.

---

### `src/components/Utility/Settings/SearchFilters/README.md`

```md
# SearchFilters Komponens Család

## 1. Áttekintés

Ez a mappa tartalmazza a keresési eredményekhez tartozó, dinamikus szűrőpanel komponenseit. A cél egy gyors, kliens oldali szűrési élmény biztosítása, amely konzisztens a többi beállítási panellel (pl. "News count per page").

A rendszer fül-specifikusan működik, tehát minden keresési fülnek saját, független szűrő opciói és állapota van.

## 2. Komponensek és Felelősségi Körök

-   **`SearchFilters.tsx` (Fő Komponens):**
    -   **Felelőssége:** A szűrőpanel fő konténere. Összeköti az adatlogikát (Bridge, Hooks) a megjelenítési komponensekkel.
    -   **Működése:**
        1.  Figyeli az aktív fül `id`-ját (`activeTabId` prop).
        2.  Feliratkozik a `SearchResultsMetadataBridge`-re, hogy megkapja az aktív fülhöz tartozó szűrő opciókat (az országlistát).
        3.  Egy `useRef` (`initializedTabsRef`) segítségével biztosítja, hogy egy új keresésnél, az opciók első megérkezésekor, minden ország alapértelmezetten "aktív" (bekapcsolt) legyen. Ezt az állapotot az `updateFilters` hívásával állítja be.
        4.  Tárolja az összes elérhető opciót egy külön állapotban (`allAvailableCountries`), hogy a "Select All" gomb mindig a teljes listával tudjon dolgozni.
        5.  Rendereli a "Select All" / "Deselect All" gombokat és a `CountryTagFilter` komponenst, átadva nekik a szükséges adatokat és eseménykezelőket.

-   **`CountryTagFilter.tsx` (UI Komponens):**
    -   **Felelőssége:** A kattintható ország-gombok ("tagek") megjelenítése.
    -   **Működése:**
        1.  Megkapja az `options` listát (minden megjelenítendő ország neve, kódja, darabszáma).
        2.  Megkapja a `selectedOptions` listát (az aktuálisan aktív országok kódjai).
        3.  A két lista alapján rendereli a gombokat, és a `.selected` CSS osztály segítségével vizuálisan jelzi, melyik van bekapcsolva.
        4.  Kattintáskor meghívja az `onChange` propot a kiválasztott országok új, frissített listájával.

## 3. Adatfolyam és Kommunikáció

A rendszer két, egymást kiegészítő kommunikációs láncon alapul:

### A) Opciók Inicializálása (Egyszeri, Egyirányú)

```
TabPanel.tsx (Új keresés)
     ↓
SearchResultsMetadataBridge.emitForTab(tabId, options)
     ↓
SearchFilters.tsx (subscribe, OPTIONS_INIT)
     ↓
1. `setCountryOptions` (gombok megjelennek)
2. `updateFilters` (minden gomb alapból aktív)
```

### B) Szűrés Működtetése (Folyamatos, Kétirányú)

```
SearchFilters.tsx (Felhasználó kattint)
     ↓
updateFilters({ countries: [...] })
     ↓
useSearchFilters.ts (URL frissül)
     ↓
SearchFiltersBridge.emitFilterChange(filters)
     ↓
TabPanel.tsx (subscribe, FILTER_CHANGE)
     ↓
`setCurrentFilters` (belső állapot frissül)
     ↓
`useMemo` (hírlista újraszámolása)
     ↓
UI frissül
```

## 4. Főbb Funkciók és Logikai Döntések

-   **Kliens oldali szűrés:** A teljesítmény és a "villogásmentes" UX érdekében a szűrés teljesen a kliens oldalon, a `TabPanel` `useMemo` hookjában történik, API hívás nélkül.
-   **Fix Opciók:** A szűrőpanelen a gombok listája a keresés után fix. A szűrés során a gombok nem tűnnek el, csak a ki-be kapcsolt állapotuk változik.
-   **Fül-specifikus Működés:** A `SearchResultsMetadataBridge` és a `SearchFilters` is az `activeTabId` alapján kezeli az adatokat, így több párhuzamos keresési fül is hibátlanul működik.
-   **"Mindenki Aktív" Alaphelyzet:** Egy új keresésnél a felhasználóbarát működés érdekében minden talált ország alapértelmezetten aktív szűrőként indul.
-   **"Select All / Deselect All":** Gyorsgombok a szűrők tömeges kezelésére.

Ez a rendszer egy robusztus, karbantartható és a projekt meglévő mintáival (pl. `ContentSettings`) konzisztens megoldást biztosít a keresési eredmények szűrésére.

................................................................
src\components\Utility\Settings\SearchFilters\SearchFilters.tsx

Megoldás 1: State alapú országok tárolása
Módosítsd a SearchFilters.tsx-ben ezt a részt:
typescript// A SearchFilters.tsx-ben ADD HOZZÁ ezt:
const [allAvailableCountries, setAllAvailableCountries] = useState<CountryTagOption[]>([]);

// Az updateOptions függvényben:
const updateOptions = useCallback((options: CountryTagOption[]) => {
  const alreadyInitialized = initialFilterSetRef.current.has(activeTabId);
  
  if (!alreadyInitialized && options.length > 0) {
    setCountryOptions(options);
    setAllAvailableCountries(options); // ÚJ: Mentjük az összes elérhető országot
    
    // Alaphelyzetbe állítás: minden ország kiválasztva
    const allCountryCodes = options.map(opt => opt.code);
    updateFilters({ countries: allCountryCodes });
    
    initialFilterSetRef.current.add(activeTabId);
    setIsLoading(false);
  }
}, [activeTabId, updateFilters]);

// A gombok módosítása:
<button
  onClick={() => updateFilters({ countries: [] })}
  style={{ marginRight: '0.5rem' }}
>
  Deselect All
</button>
<button
  onClick={() => updateFilters({ countries: allAvailableCountries.map(opt => opt.code) })}
>
  Select All
</button>

==================================================================
 tabpanelbe
 =============================================================

// ✅ INTELLIGENS országszűrő logika
let filteredByCountry = sourceItems;

if (mode === 'search') {
  // Lekérjük az elérhető országokat a keresési eredményekből
  const availableCountries = [...new Set(sourceItems.map(item => 
    item.countryCode || item.country
  ).filter(Boolean))];
  
  // Ha nincs egy ország sem kiválasztva → ELREJTÉS (Deselect All)
  if (currentFilters.countries.length === 0) {
    filteredByCountry = [];
    console.log('[TabPanel] Országszűrés alkalmazva - DESELECT ALL (ELREJTÉS):', {
      originalCount: sourceItems.length,
      filteredCount: 0,
      selectedCountries: currentFilters.countries
    });
  }
  // Ha MINDEN elérhető ország ki van választva → minden hírt mutat (Select All)
  else if (availableCountries.every(country => currentFilters.countries.includes(country))) {
    console.log('[TabPanel] Országszűrés kihagyva - SELECT ALL (MINDEN ORSZÁG):', {
      originalCount: sourceItems.length,
      filteredCount: sourceItems.length,
      selectedCountries: currentFilters.countries,
      availableCountries
    });
  }
  // Ha csak NÉHÁNY ország van kiválasztva → szűrés
  else {
    filteredByCountry = sourceItems.filter((item) => {
      const itemCountryCode = item.countryCode || item.country;
      return itemCountryCode && currentFilters.countries.includes(itemCountryCode);
    });
    
    console.log('[TabPanel] Országszűrés alkalmazva - RÉSZLEGES SZŰRÉS:', {
      originalCount: sourceItems.length,
      filteredCount: filteredByCountry.length,
      selectedCountries: currentFilters.countries,
      availableCountries
    });
  }
}


```.............................................................
A kulcs elemek ami sikerre vitték:

State-based országok tárolása - Az allAvailableCountries biztosítja hogy a "Select All" gomb mindig tudja milyen országok voltak elérhetőek
Intelligens szűrő logika - A TabPanel felismeri a különbséget:

countries = [] → teljes elrejtés
countries = minden elérhető → minden mutatása
countries = részleges → szelektív szűrés


Proper inicializálás - Az első betöltéskor minden ország kiválasztva, így természetes a felhasználói élmény

Most így működik:

Keresés → minden hír látható alapértelmezetten
"Deselect All" → hírek eltűnnek
"Select All" → hírek visszajönnek
Egyedi országok → csak azok hírei
Fülváltásnál → minden fülnek saját szűrői

A logika robusztus és intuitív. Ha később más szűrőket is akarsz hozzáadni (dátum, kategória, stb.), ugyanezt a mintát követheted.

=======================================


## 4. Főbb Funkciók és Logikai Döntések

-   **Kliens oldali szűrés:** A teljesítmény és a "villogásmentes" UX érdekében a szűrés teljesen a kliens oldalon, a `TabPanel` `useMemo` hookjában történik, API hívás nélkül.
-   **Fix Opciók:** A szűrőpanelen a gombok listája a keresés után fix. A szűrés során a gombok nem tűnnek el, csak a ki-be kapcsolt állapotuk változik.
-   **Fül-specifikus Működés:** A `SearchResultsMetadataBridge` és a `SearchFilters` is az `activeTabId` alapján kezeli az adatokat, így több párhuzamos keresési fül is hibátlanul működik.
-   **"Mindenki Aktív" Alaphelyzet:** Egy új keresésnél a felhasználóbarát működés érdekében minden talált ország alapértelmezetten aktív szűrőként indul.
-   **"Select All / Deselect All":** Gyorsgombok a szűrők tömeges kezelésére.

Ez a rendszer egy robusztus, karbantartható és a projekt meglévő mintáival (pl. `ContentSettings`) konzisztens megoldást biztosít a keresési eredmények szűrésére.