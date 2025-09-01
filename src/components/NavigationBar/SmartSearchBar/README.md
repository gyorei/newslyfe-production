# 🔍 SmartSearchBar Komponens

Dehogyis, ezt közösen hoztuk össze!

Itt van a teljesen átdolgozott, frissített `README.md` a `SmartSearchBar`-hoz, ami már a mostani, fül-specifikus frontend keresés működését dokumentálja.

---

# 🔍 SmartSearchBar Rendszer Dokumentáció

## 📋 Áttekintés

A `SmartSearchBar` egy intelligens, **fül-specifikus frontend keresési megoldás**. A `NavigationBar`-ben elhelyezkedő kereső lehetővé teszi a felhasználóknak, hogy gyorsan és hatékonyan szűrjék az **éppen aktív fülön megjelenő** hírek tartalmát.

Az architektúra biztosítja, hogy a keresések elkülönüljenek: egy adott fülön indított keresés eredménye **nem befolyásolja** a többi fül tartalmát, és a találatok megmaradnak fülváltás után is. A rendszer jelenleg kliensoldalon működik, de fel van készítve a jövőbeli backend-integrációra.

### ⚡ Teljesítmény és Jellemzők:

- **Frontend keresés**: 50-300ms (500-800 cikk között)
- **Fül-specifikus**: Minden fül saját, független keresési állapottal rendelkezik.
- **Intelligens Pontozás**: Relevancia-alapú rangsorolás, figyelembe véve a cím-, leírás- és forrásegyezéseket, valamint a szavak közelségét.
- **Többnyelvű Támogatás**: Kezeli az ékezetes és cirill karaktereket a `normalizeText` segédfüggvény segítségével.

---

## 🏗️ Architektúra és Adatfolyam

A `Navbar` kereső működése több, jól elkülönített komponens és hook együttműködésén alapul. A `TabContainer` komponens szolgál központi vezérlőként ("karmesterként").

1.  **Indítás (`SmartSearchBar.tsx`):**
    *   A felhasználói interakciót (gépelés, Enter) kezeli.
    *   Meghívja a `useFrontendSearch` hookot, amely az átadott cikklistán (`newsItems`) elvégzi a szűrést.
    *   Az `onSearch` eseményen keresztül továbbítja a találatokat a `NavigationBar`-nek.

2.  **Közvetítés (`NavigationBar.tsx`):**
    *   Megkapja a keresési eseményt a `SmartSearchBar`-tól.
    *   Hozzáadja a kontextust: az **aktív fül azonosítóját (`activeTabId`)**.
    *   Meghívja a szülő (`TabContainer`) által adott `onSearch` függvényt, immár a `tabId`-val kiegészítve.

3.  **Vezérlés és Állapotkezelés (`TabContainer.tsx`):**
    *   Ez a komponens a rendszer agya. Itt található az `useAppSearch` hook, ami egy **fül-specifikus állapotot (`tabSearchState`)** menedzsel.
    *   Amikor a `NavigationBar`-től megkapja a keresési eseményt a `tabId`-val, frissíti a `tabSearchState`-et, és az adott fülhöz rendeli a keresési eredményeket és a keresési módot.
    *   Az állapotváltozás újrarendereli a `TabContainer`-t.

4.  **Megjelenítés (`Content.tsx` és `TabSearchPanel.tsx`):**
    *   A `TabContainer` a frissített, fül-specifikus keresési állapotot továbbadja a `Content` komponensnek.
    *   A `Content` egy "váltóként" működik: ha az aktív fülön van aktív keresés, a normál `TabPanel` helyett a dedikált **`TabSearchPanel`** komponenst rendereli, amely a szűrt találatokat jeleníti meg.

---

## 📁 Fájlstruktúra

```
src/
├── components/
│   ├── NavigationBar/
│   │   ├── SmartSearchBar/
│   │   │   ├── SmartSearchBar.tsx     # 🎯 Fő kereső komponens
│   │   │   └── hooks/
│   │   │       └── useFrontendSearch.ts # 🧠 Keresési logika
│   │   └── NavigationBar.tsx            #  pośrednik
│   ├── Tabs/
│   │   └── TabContainer.tsx           #  orchestrator
│   ├── Content/
│   │   └── Content.tsx                # 🚦 A "váltó"
│   └── Panel/
│       ├── TabPanel.tsx               # Normál nézet
│       └── TabSearchPanel.tsx         # Keresési nézet
└── hooks/
    └── app/
        └── useAppSearch.ts            # 📦 Fül-specifikus állapotkezelés
```

---

## 🔧 Technikai Specifikáció

### `useAppSearch.ts` (Állapotkezelő)
```typescript
// A hook egy objektumot kezel, ahol a kulcs a tabId.
const [tabSearchState, setTabSearchState] = useState<{
  [tabId: string]: {
    searchResults: NewsItem[];
    searchTerm: string;
    isSearchMode: boolean;
  }
}>({});
```

### `Content.tsx` (A "Váltó")
```typescript
// A renderelési logika a Content komponensben
if (isActive && isSearchMode) {
    return <TabSearchPanel searchResults={searchResults} ... />;
}
return <TabPanel ... />;
```

---

## 🔮 Jövőbeli Fejlesztések

- **Backend Integráció:** A `TabContainer` komponensben a `handleSearch` függvény könnyen átalakítható, hogy a `useFrontendSearch` helyett egy backend API hívást indítson, a `TabSearchPanel` és a többi komponens módosítása nélkül.
- **Debouncing:** A gépelés közbeni keresés optimalizálása a keresési esemény késleltetésével.
- **Mentett Keresések:** A `tabSearchState` perzisztálása a `localStorage`-ba, hogy a keresések az alkalmazás újraindítása után is megmaradjanak.

---

## 📝 Changelog

### **v2.1.0 (Dátum)**
- ✅ **Fül-specifikus Keresés:** A `Navbar` kereső mostantól csak az aktív fül tartalmát szűri.
- ✅ **Állapot Megőrzése:** A keresési eredmények megmaradnak fülváltás után is.
- ✅ **Dedikált UI:** A találatok egy új `TabSearchPanel` komponensen jelennek meg, ami vizuálisan konzisztens a `Home` keresővel.
- ✅ **Architektúra Refaktor:** Az állapotkezelés a `TabContainer`-be került, a `Content` komponens "váltóként" funkcionál, a `useAppSearch` hook pedig fül-specifikus állapotot kezel.

===================================================================
régi adatok

### **⚡ Teljesítmény:**

- **Backend keresés**: 100-500ms (teljes adatbázis)
- **Magyar ékezetek**: Automatikus kezelés a backend oldalon
- **Relevancia alapú**: Intelligens rangsorolás (PostgreSQL Full-Text Search)

---

## 🎯 **Főbb Funkciók**

### **🔍 Keresési Mód**

- **Backend keresés**: PostgreSQL Full-Text Search, minden keresés API-n keresztül
- **Frontend-only keresés**: Jelenleg nem aktív, de a kódban megtalálható, fejlesztői célokra visszakapcsolható (lásd: `FRONTEND_SEARCH_ENABLED` kapcsoló)

### **🎨 Felhasználói Élmény**

- **Valós idejű javaslatok**: Forrás és címek alapján (a backend által visszaadott adatokból)
- **Vivaldi-stílusú design**: Modern, responsive UI
- **Billentyűzet navigáció**: Arrow keys, Enter, Escape
- **Loading állapotok**: Vizuális visszajelzés

### **🧠 Intelligens Keresés**

- **Ékezet-toleráns**: Backend oldalon támogatott
- **Több kifejezés**: Szóközökkel elválasztva
- **Relevancia súlyozás**: PostgreSQL keresőmotor
- **Fallback mechanizmus**: Backend hiba esetén UX-barát üzenet

---



---

## 🔧 **Technikai Specifikáció**




### **2️⃣ Keresési Módok Váltása:**

```typescript
// SmartSearchBar.tsx-ben:
const FRONTEND_SEARCH_ENABLED = false; // ← Csak backend keresés aktív
```

---


### **Adatok Útja:**

```
Content.tsx (newsItems)
  ↓ onNewsItemsUpdate()
TabContainer.tsx (currentNewsForFrontendSearch)
  ↓ newsItems prop
NavigationBar.tsx
  ↓ newsItems prop
SmartSearchBar.tsx ✅
```


---

## 🎯 **Keresési Algoritmus**

### **Backend Keresés Logika:**

1. **Keresési lekérdezés**: A felhasználó beírja a keresett kifejezést
2. **API hívás**: A SmartSearchBar a backend `/api/search` végpontot hívja
3. **Backend feldolgozás**: PostgreSQL Full-Text Search, relevancia számítás
4. **Eredmények visszaadása**: A backend visszaküldi a találatokat (forrás, ország, cím, dátum, relevancia)
5. **Megjelenítés**: A találatok a felületen jelennek meg

---

## 🧪 **Debug és Monitoring**

### **Console Logok:**

```javascript
[SmartSearchBar] Keresés indítása: "háború"
[SmartSearchBar] API válasz: 33 találat
```

### **Teljesítmény Mérés:**

```javascript
// Keresési idő mérése automatikus
const startTime = performance.now();
// ... keresés ...
const searchTime = Math.round(endTime - startTime);
```

---

## 🎨 **Styling**

### **CSS Modulok:**

- `NavigationBar.module.css` - Főstílusok
- Vivaldi-inspirált design
- Dark/Light téma támogatás
- Responsive layout

### **Kulcs Stílusok:**

- `.searchContainer` - Keresőmező wrapper
- `.searchInput` - Input mező
- `.suggestionsDropdown` - Javaslatok lista
- `.clearButton` - Törlés gomb

-
