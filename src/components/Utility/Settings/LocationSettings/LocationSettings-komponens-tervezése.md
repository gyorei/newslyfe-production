# Helymeghatározási funkció következő lépései - Tervezési dokumentum

## 1. A "Folytatás a jelenlegi beállítással" funkció értelmezése

Ez a gomb azt jelenti, hogy a felhasználó elfogadja a jelenleg beállított helyet (példánkban "Hungary"), és folytatja a helyi hírek megtekintését e helyadat alapján. A funkciónak:

- Be kell zárnia a modális ablakot
- Azonnal be kell töltenie a helyi híreket a már meglévő helyadat használatával
- Nem szabad újra megjelennie a felugró ablaknak, amíg a felhasználó nem változtatja meg a helyadatot vagy nem törli a böngésző tárolóját

## 2. A "Helyadatok beállítása" funkció tervezése

Ez a gomb a felhasználót a beállítások oldalra navigálja, ahol részletesen beállíthatja a helymeghatározási preferenciáit. Ennek megvalósításához:

### 2.1. Új Settings kategória létrehozása

Létre kell hoznunk egy új kategóriát a meglévő beállítások között:

```
Kategóriák:
- On startup (már létezik)
- General (már létezik)
- Appearance (már létezik)
- Content (már létezik)
- Location (új kategória)
```

### 2.2. LocationSettings komponens tervezése

A LocationSettings komponens a következő elemeket fogja tartalmazni:

1. **Helymeghatározási módszer választása** (rádiógombok):
   - Automatikus (böngésző alapján)
   - GPS alapú pontos helymeghatározás
   - Kézi kiválasztás

2. **Országválasztó legördülő menü** (csak ha a "Kézi kiválasztás" aktív):
   - A támogatott országok listája a LocationSelector.tsx-ből
   - Az aktuálisan kiválasztott ország előre kijelölve

3. **Városválasztó mező** (opcionális):
   - Szöveges beviteli mező a város megadásához
   - Csak akkor aktív, ha van kiválasztott ország

4. **Pontosság beállítása** kapcsoló:
   - "Pontos helymeghatározás engedélyezése"
   - Kapcsoló (toggle), amely engedélyezi vagy letiltja a GPS használatát

5. **Helyadatok tárolása** kapcsoló:
   - "Helyadatok megjegyzése"
   - Kapcsoló, amely beállítja, hogy az alkalmazás megjegyezze-e a helyadatokat

6. **Helyelőzmények kezelése**:
   - A korábban használt helyek listája
   - Gomb az előzmények törléséhez

### 2.3. A Settings.tsx fájl módosítása

A meglévő Settings komponenst ki kell egészíteni az új LocationSettings kategóriával:

- Új gomb hozzáadása a kategória választókhoz
- LocationSettings komponens importálása és feltételes megjelenítése

### 2.4. Navigáció a beállításokhoz

A "Helyadatok beállítása" gomb megnyomásakor:

1. Be kell zárni a modális ablakot
2. Navigálni kell a beállítások oldalra
3. Automatikusan kiválasztani a "Location" kategóriát

## 3. Adatfolyam tervezése

1. A felhasználó a "Local" gombra kattint
2. Megjelenik a helymeghatározási modális ablak
3. A felhasználó a "Helyadatok beállítása" gombra kattint
4. A rendszer bezárja a modális ablakot és navigál a beállításokhoz
5. A beállításokban a LocationSettings kategória aktív
6. A felhasználó módosítja a beállításokat és elmenti
7. A rendszer frissíti a helyadatokat a locationProvider segítségével
8. A felhasználó visszatér a főoldalra
9. A helyi hírek már az új beállítások szerint jelennek meg

# Ez a terv lehetővé teszi a helymeghatározási funkció teljes integrációját a meglévő beállítások rendszerébe, miközben a felhasználói élményt is javítja a személyre szabott beállítási lehetőségekkel.

# Az ország kiválasztás és hírmegjelenítés összekapcsolása

A LocationSettings komponensben kiválasztott ország és a helyi hírek megjelenítése közötti összeköttetést úgy tudjuk biztosítani, hogy a teljes adatáramlási folyamatot átlátjuk és optimalizáljuk.

## 1. Az adatáramlás folyamata

```
[LocationSettings] → [LocationProvider] → [Local hírmegjelenítő komponensek]
```

## 2. Főbb összekapcsolási pontok

### A. Helybeállítások mentése (már implementált)

```typescript
// LocationSettings.tsx - handleSave function
case 'manual': {
  // Országkód validálása
  if (!country) {
    alert('Please select a country!');
    setIsSaving(false);
    return;
  }

  const countryObj = findCountryByCode(country);

  // Helyadat mentése a lokációkezelőben
  const success = await locationProvider.setManualLocation(
    countryObj.name,   // "Hungary"
    country,           // "HU"
    undefined          // Nincs szükség városra
  );

  if (!success) {
    throw new Error('Failed to set location');
  }
  break;
}
```

### B. A hírek lekérése a kiválasztott országhoz

A `useNewsData.ts` hook-ban történik a hírek lekérése, amely a [`locationProvider`](src/components/LocalNews/local/location/LocationProvider.ts) által tárolt lokációt használja:

```typescript
// components/Content/hooks/useNewsData.ts
export const useNewsData = (tabId: string) => {
  const [newsData, setNewsData] = useState<News[]>([]);

  useEffect(() => {
    const fetchLocalNews = async () => {
      // Aktuális lokáció lekérése a LocationProvider-ból
      const location = await locationProvider.getLocation();

      if (location) {
        let endpoint = '';

        // Ország alapú híreket kér le
        if (location.countryCode) {
          endpoint = `/api/country/${location.countryCode}/news`;
          const localNews = await apiClient.get(endpoint);
          setNewsData(localNews);
        }
      }
    };

    fetchLocalNews();
  }, [tabId]);

  return { newsData };
};
```

### C. A "Local" gomb frissítése a SideHeader komponensben

A [`SideHeader`](src/components/Side/SideHeader/SideHeader.tsx) komponensben van a "Local" gomb, amelynek meg kell jelenítenie az aktuális országot:

```typescript
// components/Side/SideHeader/SideHeader.tsx
const SideHeader: React.FC = () => {
  const [currentLocation, setCurrentLocation] = useState<string>("");

  // Lokáció lekérése a komponens betöltésekor
  useEffect(() => {
    const getLocationInfo = async () => {
      const location = await locationProvider.getLocation();
      if (location && location.country) {
        setCurrentLocation(location.country);
      }
    };

    getLocationInfo();

    // Feliratkozás a lokáció változásaira
    const unsubscribe = locationProvider.subscribeToLocationChanges(() => {
      getLocationInfo();
    });

    return () => unsubscribe();
  }, []);

  return (
    <div className={styles.sideHeader}>
      <button className={`${styles.button} ${styles.localButton}`}>
        <span>Local</span>
        {currentLocation && <span className={styles.location}>{currentLocation}</span>}
      </button>
      {/* többi tartalom */}
    </div>
  );
};
```

## 3. Az összekapcsolás ki van már építve:

1. A [`LocationProvider`](src/components/LocalNews/local/location/LocationProvider.ts) az a központi szolgáltatás, amely összekapcsolja a komponenseket
2. A `LocationSettings`-ben mentett helyadatok a `locationProvider.setManualLocation()` függvénnyel kerülnek tárolásra
3. A hírmegjelenítő komponensek a `locationProvider.getLocation()` függvénnyel lekérik a beállított országot
4. Az API hívások az országkód és országnév alapján történnek

## 4. Javaslat az optimalizálásra:

1. **Esemény alapú frissítés** bevezetése - a lokációváltozás esemény legyen:

```typescript
// LocationProvider.ts kiegészítése
type LocationChangeListener = () => void;

class LocationProvider {
  private listeners: LocationChangeListener[] = [];

  // Feliratkozás lokáció változásra
  public subscribeToLocationChanges(listener: LocationChangeListener): () => void {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }

  // Esemény kiváltása
  private notifyLocationChanged() {
    this.listeners.forEach((listener) => listener());
  }

  // A setManualLocation módosítása
  public async setManualLocation(
    country: string,
    countryCode: string,
    city?: string,
  ): Promise<boolean> {
    // Eredeti implementáció...

    // Értesítjük a feliratkozókat
    this.notifyLocationChanged();
    return true;
  }
}
```

2. **Közvetlen navigáció** a Local hírekhez mentés után:

```typescript
// LocationSettings.tsx - handleSave után
if (success) {
  // Sikeres mentés után átnavigálunk a Local hírekhez
  const localNewsTab = document.querySelector('.localNewsTab');
  if (localNewsTab) {
    (localNewsTab as HTMLElement).click();
  }
}
```

Ezekkel a módosításokkal egy teljes, eseményvezérelt rendszer jön létre, ahol a helybeállítások azonnal érvényre jutnak a hírmegjelenítésben.

================================

# Az ország kiválasztása és a Local hírek megjelenítése közötti folyamat

A folyamatot a következőképpen tudjuk feltérképezni, hogy lássuk, hogyan kapcsolódik össze a helybeállítás a megjelenő hírekkel:

## 1. Frontend beállítás - LocationSettings komponens

```
Felhasználó kiválaszt egy országot (pl. Hungary) a Manual Selection módban
↓
LocationSettings.tsx - handleSave() függvény
↓
locationProvider.setManualLocation("Hungary", "HU", undefined)
↓
A LocationProvider elmenti az országot localStorage-ba
```

## 2. Backend API - Hírek lekérése

```
Felhasználó a "Local" gombra kattint
↓
Frontend API kérés: GET /api/country/Hungary/news
↓
src/backend/api/routes/Country/Country.ts kezeli a kérést
↓
Country.ts meghívja a sourcesService.getCountrySources("Hungary") függvényt
↓
A függvény lekéri az adatbázisból az országhoz tartozó forrásokat
↓
Minden forráshoz: newsService.getNewsFromSource() (CountryService.ts)
↓
A végpont visszaadja a JSON választ a frontend-nek
```

## 3. Következő lépés a folyamatban

A következő lépés az API válasz feldolgozása a frontend oldalon:

```
Frontend API válasz feldolgozása: useLocalNews.ts hook
↓
A hook frissíti a lokális state-et az új hírekkel
↓
React komponensek (Panel.tsx, NewsCard.tsx stb.) újrarenderelődnek az adatokkal
```

A `useLocalNews.ts` hook pontosan ez a hiányzó láncszem az API válasz és a megjelenő hírek között. Ez kezeli a LocalNews komponensek state-jeit és a szükséges API hívásokat.

A teljes folyamat tehát:
**LocationSettings** → **LocationProvider** → **API kérés** → **Country.ts** → **CountryService.ts** → **API válasz** → **useLocalNews.ts** → **UI komponensek**

=================================
