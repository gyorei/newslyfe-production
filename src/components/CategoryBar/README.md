# CategoryBar Komponens Dokumentáció

## Áttekintés

A CategoryBar komponensrendszer célja, hogy egységes kategóriaszűrési megoldást nyújtson az alkalmazás különböző részein. Két fő megjelenési formája van:

1. **TabCategoryBar** - A tab fülek alatt megjelenő horizontális, görgethető kategóriasáv
2. **Side Category** - Az oldalsó panelben megjelenő vertikális kategórialista

Mindkét komponens ugyanabból a központi adatforrásból dolgozik a CategoryContext révén, így biztosítva a konzisztens felhasználói élményt.

## Kategória funkció architektúra elemzés

### Kapcsolódások a dependencies.json alapján

A kategóriarendszer elemzése feltárta a következő kapcsolatokat:

1. **Már létező kategória struktúra**:
   - `CategoryContext.tsx` - Központi kontextus a kategória adatok kezelésére
   - `TabCategoryBar.tsx` - A tabokban használt kategória komponens
   - `Side/Category/Category.tsx` - Az oldalpanelben használt kategória komponens

2. **Kapcsolódási pontok**:
   - A `Side/Category/Category.tsx` már importálja a `CategoryContext.tsx`-t
   - A `TabContainer.tsx` importálja a `TabCategoryBar.tsx`-t
   - Az `App.tsx` importálja a `CategoryProvider`-t

3. **Hierarchia**:
   ```
   App.tsx
     ├── CategoryProvider (context biztosító)
     └── ResizableLayout.tsx
          ├── Side.tsx
          │    └── Category.tsx (használja a CategoryContext-et)
          └── TabContainer.tsx
               ├── TabCategoryBar.tsx
               └── Content.tsx (híreket kezeli)
   ```

## Működési elv

A kategória szűrés a **kontextus-függő** működési elvet követi:

### Kontextus-függő kategóriák és számok

- Ha a felhasználó a "Magyarország" tabban van, a kategóriaszámok csak a magyar hírek eloszlását mutatják
- Ha átváltanak "Dél-Amerika" tabra, akkor a számok automatikusan a dél-amerikai hírek kategória-eloszlását mutatják
- Egy kontinens vagy ország tab megnyitásakor a kategória-számok ehhez a specifikus szűrőhöz igazodnak

### Egymásra épülő szűrés

- A kategóriaszűrés mindig az aktuális tab szűrését finomítja, nem pedig lecseréli azt
- Például: "Magyarország" tab + "Politics" kategória = magyar politikai hírek
- Példa: "Dél-Amerika" tab + "Sports" kategória = dél-amerikai sporthírek

### Kategóriaszámok frissítése

- A kategóriaszámlálóknak mindig az aktuális kontextusban elérhető híreket kell tükrözniük
- Az "Összes" chip minden esetben az adott tab összes hírét összesíti

## Fő komponensek

### 1. CategoryContext.tsx

Központi állapotkezelő kontextus, amely biztosítja:

```typescript
interface CategoryContextType {
  selectedCategory: string | null; // Jelenleg kiválasztott kategória
  categories: string[]; // Elérhető kategóriák
  categoryCounts: Record<string, number>; // Kategóriák találati száma
  setSelectedCategory: (category: string | null) => void;
  setCategoryCounts: (counts: Record<string, number>) => void;
  setCategories: (categories: string[]) => void;
}
```

### 2. CategoryProvider.tsx

A kontextus szolgáltató, amely biztosítja a kategóriaadatokat az alkalmazás minden része számára:

```typescript
const CategoryProvider: React.FC<{children: React.ReactNode}> = ({children}) => {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [categories, setCategories] = useState<string[]>([/* alapkategóriák */]);
  const [categoryCounts, setCategoryCounts] = useState<Record<string, number>>({});

  // ...kontextus logika

  return (
    <CategoryContext.Provider value={{
      selectedCategory, categories, categoryCounts,
      setSelectedCategory, setCategories, setCategoryCounts
    }}>
      {children}
    </CategoryContext.Provider>
  );
};
```

### 3. TabCategoryBar.tsx

Horizontális, görgethető kategóriasáv a tabok alatt:

- Kategóriák megjelenítése chip formájában
- Kategóriánkénti találatszámok jelzése
- Görgetési lehetőség nagy kategória-listák esetén
- Összecsukható/kinyitható megjelenés

### 4. Side/Category/Category.tsx

Vertikális kategórialista az oldalpanelben:

- Strukturált kategórialista
- Kategóriánkénti találatszámok
- Kiemelt vizuális jelzés az aktív kategóriára

### 5. useCategoryData.tsx

Hook a híradatok kategória-információinak kinyerésére:

```typescript
function useCategoryData(newsItems: NewsItem[], activeTabId: string) {
  // ...logika a kategóriák kiszámolásához a hírekből
}
```

## Adatáramlás

![Kategória adatáramlás diagram](../diagrams/category-flow.png)

1. **Hírek betöltése**:
   - Content komponens betölti a híreket az aktív tab alapján
   - A `localDataService` vagy `continentView` szolgáltatja az adatokat

2. **Kategóriák kinyerése**:
   - A `useCategoryData` hook elemzi a híreket és kinyeri a kategóriákat
   - Kategóriánkénti találatszámokat számol

3. **Kontextus frissítése**:
   - A kontextus frissül a kategóriákkal és találatszámokkal
   - Mind a TabCategoryBar, mind a Side Category ezt az információt használja

4. **Kategória kiválasztása**:
   - A felhasználó kiválaszt egy kategóriát valamelyik komponensben
   - A kontextus frissül az új kiválasztással

5. **Hírek újraszűrése**:
   - A Content észleli a kategória változást a kontextusban
   - Újraszűri a megjelenített híreket

## Implementációs részletek

### CategoryContext státusz

A kontextus már működőképes, de továbbfejlesztésre szorul:

- ✅ Alapvető kategória állapotkezelés
- ✅ Kategória kiválasztás tárolása
- ✅ Kategóriák listájának kezelése
- ❓ Tab-specifikus kategória állapot
- ❓ Kategóriaszámok hatékony frissítése

### TabCategoryBar státusz

A TabCategoryBar komponens alapjai már rendelkezésre állnak:

- ✅ Vizuális megjelenés
- ✅ Kategória kiválasztás kezelése
- ✅ Görgetési logika
- ✅ Összecsukási/kinyitási lehetőség
- ❓ CategoryContext integráció
- ❓ Dinamikus kategória találatszámok
- ❓ Vizuális visszajelzés finomítása

### Side Category státusz

A Side Category komponens is már részben implementált:

- ✅ Vizuális megjelenés
- ✅ Kategória kiválasztás kezelése
- ❓ CategoryContext teljes integráció
- ❓ Vizuális visszajelzés finomítása

## Használati példák

### TabCategoryBar használata

```tsx
// TabContainer.tsx részlet
import TabCategoryBar from '../CategoryBar/TabCategoryBar';

const TabContainer = ({ activeTabId }) => {
  // Az aktuális tab hírei alapján számolt kategóriák
  const categories = ['Politics', 'Economy', 'Sports', 'Culture'];
  const categoryCounts = { Politics: 5, Economy: 3, Sports: 10, Culture: 2 };

  return (
    <div>
      <DraggableTabs activeTabId={activeTabId} />

      {/* Kategóriasáv beépítése */}
      <TabCategoryBar
        categories={categories}
        categoryCounts={categoryCounts}
        onCategorySelect={(category) => console.log(`Kategória választva: ${category}`)}
      />

      <Content activeTabId={activeTabId} />
    </div>
  );
};
```

### Side Category használata

```tsx
// Side.tsx részlet
import { Category } from './Category/Category';

const Side = ({ onFiltersChange }) => {
  const handleCategorySelect = (category) => {
    // Szűrők frissítése a kategória alapján
    onFiltersChange({ category });
  };

  return (
    <aside className={styles.sidebar}>
      <Search />
      <Category onCategorySelect={handleCategorySelect} />
      <Region />
      <Source />
    </aside>
  );
};
```

### CategoryContext használata komponensekben

```tsx
// Bármely komponensben
import { useCategoryContext } from '../CategoryBar/CategoryContext';

const MyComponent = () => {
  const { selectedCategory, categories, categoryCounts, setSelectedCategory } =
    useCategoryContext();

  return (
    <div>
      <h3>Kiválasztott kategória: {selectedCategory || 'Nincs'}</h3>
      <button onClick={() => setSelectedCategory('Sports')}>Váltás Sports kategóriára</button>
    </div>
  );
};
```

## Továbbfejlesztési tervek

1. **Tab-specifikus kategória állapot** - Minden tabnak saját kategória állapot
2. **Teljesítmény optimalizálás** - Kategóriák újraszámolásának minimalizálása
3. **Több kategória támogatása** - Több egyidejűleg kiválasztott kategória
4. **Perzisztencia** - Kategória választások mentése
5. **AI alapú kategorizálás** - Automatikus tartalomelemzés

## Kapcsolódó fájlok

- `src/components/CategoryBar/CategoryContext.tsx`
- `src/components/CategoryBar/CategoryProvider.tsx`
- `src/components/CategoryBar/TabCategoryBar.tsx`
- `src/components/CategoryBar/TabCategoryBar.module.css`
- `src/components/Side/Category/Category.tsx`
- `src/components/Side/Category/Category.module.css`
- `src/components/Tabs/TabContainer.tsx`
- `src/components/Content/Content.tsx`
- `src/App.tsx`

## Konklúzió

A kategória szűrés rendszere alapvetően már létezik, csak finomításra és további integrációra van szükség. A fő feladat a kategóriák dinamikus kinyerése a hírekből, a felhasználói felületkomponensek összehangolása a CategoryContext-en keresztül, valamint a szűrés összehangolása a Content komponens hírmegjelenítésével.

A rendszer YAGNI alapelvét követve csak a valóban szükséges funkciókat és kapcsolatokat implementáljuk, elkerülve a felesleges komplexitást, ugyanakkor biztosítva a rugalmasságot a jövőbeli továbbfejlesztésekhez.
