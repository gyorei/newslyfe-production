# LocationSettings

## Áttekintés

A LocationSettings komponens felelős az alkalmazás helymeghatározási beállításainak kezeléséért. Lehetővé teszi a felhasználó számára, hogy kiválassza, hogyan szeretné meghatározni a tartózkodási helyét az alkalmazás számára. Ez a beállítás közvetlenül befolyásolja a "Local" fül alatt megjelenő hírtartalmat.

## Komponens struktúra

A LocationSettings mappában található fájlok:

- **LocationSettings.tsx**: A fő komponens, amely kezeli a helyadatok beállítását és mentését
- **ManualLocationSelector.tsx**: A manuális helyválasztáshoz szükséges felhasználói felület
- **GpsLocationSelector.tsx**: GPS alapú helymeghatározást beállító komponens
- **BrowserLanguageSelector.tsx**: Böngésző nyelve alapján történő helymeghatározás beállítása
- **continents.ts**: Kontinensek és országok adatbázisa, segédfüggvényekkel a kereséshez
- **LocationSettings.module.css**: A komponens stílusai

## Funkciók

### 1. Helymeghatározás módszerek

A komponens három módszert kínál a hely meghatározására:

- **Manual Selection**: A felhasználó manuálisan választ kontinenst és országot
- **GPS Based Location**: Pontos GPS koordináták alapján határozza meg a helyet
- **Browser Language**: A böngésző nyelvi beállításait használja a hely meghatározásához

### 2. Beállítások tárolása

- A komponens a `locationProvider` szolgáltatáson keresztül tárolja és kezeli a helyadatokat
- Lehetőséget biztosít a helyadatok böngésző bezárása utáni megőrzésére
- Előzmények tárolása (legutóbb használt helyek)

### 3. Folyamat

A helymeghatározás folyamata:

1. Felhasználó kiválaszt egy helymeghatározási módot
2. Mód-specifikus adatokat ad meg (pl. ország)
3. "Save Settings" gombbal elmenti a beállításokat
4. A helyadat tárolásra kerül a locationProvider segítségével
5. Az alkalmazás "Local" tartalma frissül az új helyadat alapján

## Rendszerintegráció

A LocationSettings a következő rendszerkomponensekkel áll kapcsolatban:

### 1. LocationProvider

A `locationProvider` egy szolgáltatás, amely a helyadatok kezelését végzi:

- A helyadat mentését különböző stratégiák alapján (ManualStrategy, GeoLocationStrategy, BrowserStrategy)
- A helyadatok tárolását localStorage-ban
- A helyelőzmények kezelését
- Eseményeken keresztüli kommunikációt más komponensekkel

### 2. API kapcsolatok

A helyadatok alapján az alkalmazás API kéréseket indít:

- `/api/country/{countryName}/sources` - Az adott országhoz tartozó hírforrások lekérése
- `/api/country/{countryName}/news` - Az adott országhoz tartozó hírek lekérése

### 3. LocalButton

A "Local" gomb kapcsolatban áll a LocationSettings komponenssel:

- A "Helyadatok beállítása" gomb a LocationSettings fülre navigál
- A beállított ország megjelenik a Local gomb alatt

## Adatáramlás

A teljes adatáramlási folyamat:

1. **LocationSettings** - Felhasználó beállítja és elmenti a helyadatokat
2. **LocationProvider** - Tárolja a helyinformációt és értesíti a feliratkozókat a változásról
3. **API kérés** - A Local hírek lekérése az adott ország alapján
4. **Country.ts** - Backend API végpont a kérés kezelésére
5. **CountryService.ts** - Az országhoz tartozó hírek lekérése
6. **API válasz** - Az adatok visszaküldése a frontendre
7. **useLocalNews.ts** - A kapott adatok feldolgozása és állapotba mentése
8. **UI komponensek** - A hírek megjelenítése a felhasználói felületen

## Technológiák

- **React** - Komponens alapú felhasználói felület
- **TypeScript** - Típusos kód a megbízhatóbb működésért
- **React Select** - Fejlett legördülő választó komponens
- **CSS Modules** - Komponens-szintű stílusok
- **Stratégia tervezési minta** - A különböző helymeghatározási módszerek kezelésére

## Fejlesztői irányelvek

1. Új kontinens vagy ország hozzáadása a `continents.ts` fájl módosításával lehetséges
2. Új helymeghatározási stratégia létrehozásához implementálni kell a `LocationStrategy` interfészt
3. A komponens állapotát a React `useState` és `useCallback` hook-ok kezelik

============================================

# LocationSettings

## Áttekintés

A LocationSettings komponens felelős az alkalmazás helymeghatározási beállításainak kezeléséért. Lehetővé teszi a felhasználó számára, hogy kiválassza, hogyan szeretné meghatározni a tartózkodási helyét az alkalmazás számára. Ez a beállítás közvetlenül befolyásolja a "Local" fül alatt megjelenő hírtartalmat.

## Komponens struktúra

A LocationSettings mappában található fájlok:

- **LocationSettings.tsx**: A fő komponens, amely kezeli a helyadatok beállítását és mentését
- **ManualLocationSelector.tsx**: A manuális helyválasztáshoz szükséges felhasználói felület
- **GpsLocationSelector.tsx**: GPS alapú helymeghatározást beállító komponens
- **BrowserLanguageSelector.tsx**: Böngésző nyelve alapján történő helymeghatározás beállítása
- **continents.ts**: Kontinensek és országok adatbázisa, segédfüggvényekkel a kereséshez
- **LocationSettings.module.css**: A komponens stílusai

## Funkciók

### 1. Helymeghatározás módszerek

A komponens három módszert kínál a hely meghatározására:

- **Manual Selection**: A felhasználó manuálisan választ kontinenst és országot
- **GPS Based Location**: Pontos GPS koordináták alapján határozza meg a helyet
- **Browser Language**: A böngésző nyelvi beállításait használja a hely meghatározásához

### 2. Beállítások tárolása

- A komponens a `locationProvider` szolgáltatáson keresztül tárolja és kezeli a helyadatokat
- Lehetőséget biztosít a helyadatok böngésző bezárása utáni megőrzésére
- Előzmények tárolása (legutóbb használt helyek)

### 3. Folyamat

A helymeghatározás folyamata:

1. Felhasználó kiválaszt egy helymeghatározási módot
2. Mód-specifikus adatokat ad meg (pl. ország)
3. "Save Settings" gombbal elmenti a beállításokat
4. A helyadat tárolásra kerül a locationProvider segítségével
5. Az alkalmazás "Local" tartalma frissül az új helyadat alapján

## Rendszerintegráció

A LocationSettings a következő rendszerkomponensekkel áll kapcsolatban:

### 1. LocationProvider

A `locationProvider` egy szolgáltatás, amely a helyadatok kezelését végzi:

- A helyadat mentését különböző stratégiák alapján (ManualStrategy, GeoLocationStrategy, BrowserStrategy)
- A helyadatok tárolását localStorage-ban
- A helyelőzmények kezelését
- Eseményeken keresztüli kommunikációt más komponensekkel

### 2. API kapcsolatok

A helyadatok alapján az alkalmazás API kéréseket indít:

- `/api/country/{countryName}/sources` - Az adott országhoz tartozó hírforrások lekérése
- `/api/country/{countryName}/news` - Az adott országhoz tartozó hírek lekérése

### 3. LocalButton

A "Local" gomb kapcsolatban áll a LocationSettings komponenssel:

- A "Helyadatok beállítása" gomb a LocationSettings fülre navigál
- A beállított ország megjelenik a Local gomb alatt

## Adatáramlás

A teljes adatáramlási folyamat:

1. **LocationSettings** - Felhasználó beállítja és elmenti a helyadatokat
2. **LocationProvider** - Tárolja a helyinformációt és értesíti a feliratkozókat a változásról
3. **API kérés** - A Local hírek lekérése az adott ország alapján
4. **Country.ts** - Backend API végpont a kérés kezelésére
5. **CountryService.ts** - Az országhoz tartozó hírek lekérése
6. **API válasz** - Az adatok visszaküldése a frontendre
7. **useLocalNews.ts** - A kapott adatok feldolgozása és állapotba mentése
8. **UI komponensek** - A hírek megjelenítése a felhasználói felületen

## Technológiák

- **React** - Komponens alapú felhasználói felület
- **TypeScript** - Típusos kód a megbízhatóbb működésért
- **React Select** - Fejlett legördülő választó komponens
- **CSS Modules** - Komponens-szintű stílusok
- **Stratégia tervezési minta** - A különböző helymeghatározási módszerek kezelésére

## Fejlesztői irányelvek

1. Új kontinens vagy ország hozzáadása a `continents.ts` fájl módosításával lehetséges
2. Új helymeghatározási stratégia létrehozásához implementálni kell a `LocationStrategy` interfészt
3. A komponens állapotát a React `useState` és `useCallback` hook-ok kezelik

## GPS alapú helymeghatározás implementációja

A GPS alapú helymeghatározás lehetővé teszi a felhasználó pontos földrajzi helyének meghatározását a böngésző Geolocation API-ján keresztül.

### Implementált komponensek:

1. **LocationProvider.ts kiegészítése**:
   - Új `setGeoLocation(highAccuracy: boolean)` metódus a GPS koordináták lekéréséhez
   - `requestGeolocation` privát metódus a böngésző Geolocation API-jának használatához
   - `reverseGeocode` privát metódus a koordináták országra és városra fordításához OpenStreetMap API segítségével

2. **types.ts módosítása**:
   - A `LocationData` interfész kiegészítése `latitude` és `longitude` mezőkkel a GPS koordináták tárolásához

3. **Location.ts kiegészítése**:
   - `localLocationService` kibővítése új `setGeoLocation` metódussal, ami a LocationProvider megfelelő metódusát hívja

4. **LocationSettings.tsx módosítása**:
   - `handleSave` függvény `case 'geo'` ágának implementálása
   - GPS specifikus beállítások megjelenítése és kezelése
   - Előzmények elrejtése GPS módban (mivel ott nincs relevancia)

5. **LocationSettings.module.css módosítása**:
   - Minden gomb stílusának javítása a jobb felhasználói élmény érdekében
   - Új gombstílusok hozzáadása (button, saveButton osztályok)
   - Állapotjelző üzenetek (saveSuccess, saveError) stílusainak definiálása

### Működési folyamat:

1. A felhasználó kiválasztja a "GPS Based Location" opciót
2. Beállíthatja a "High accuracy" kapcsolót a pontosabb helymeghatározáshoz
3. A "Save Settings" gombra kattintva:
   - A rendszer engedélyt kér a helymeghatározáshoz (ha még nem adta meg a felhasználó)
   - Lekéri a GPS koordinátákat a böngészőtől
   - Átalakítja a koordinátákat országra és városra
   - Elmenti a helyadatokat
   - A felhasználó visszajelzést kap a művelet sikerességéről

### Stratégiák kezelése:

Az alkalmazás egyszerre csak egy helymeghatározási stratégiát használ, de mindegyik stratégia megőrzi saját állapotát:

- Ha a felhasználó a GPS mód után visszatér a manuális módra, a korábban beállított ország jelenik meg
- Ha újra a GPS módra vált, a legutóbbi GPS helyadat válik aktívvá

Ez rugalmas felhasználói élményt biztosít, mivel bármikor módosíthatja a helymeghatározás módját anélkül, hogy elveszítené a korábbi beállításait.

### Hibakezelés:

- Engedély megtagadása esetén: Felhasználóbarát hibaüzenet
- Időtúllépés esetén: Értesítés és alternatív módok javaslata
- Sikertelen helymeghatározás esetén: Fallback a manuális vagy böngésző alapú módra

===================================================

# Browser Language implementáció

A GPS alapú helymeghatározás után most a Browser Language (böngésző nyelvén alapuló) helymeghatározási módszert kell megvalósítanunk. Ez egyszerűbb, mint a GPS megoldás, mivel csak a böngésző nyelvbeállításait kell kiértékelnie.

## Browser Language működése

Ez a helymeghatározási módszer:

1. Leolvassa a böngésző nyelvi beállítását (`navigator.language`)
2. A nyelvi kódból következtet a felhasználó valószínű országára
3. Nem igényel extra engedélyeket vagy interakciót a felhasználótól

## Szükséges módosítások

### 1. LocationSettings.tsx módosítása

```tsx
case 'browser': {
  try {
    // Browser alapú helymeghatározás aktiválása
    const success = await locationProvider.setBrowserLanguageLocation();

    if (!success) {
      throw new Error('Failed to set browser language based location');
    }

    // Helyadatok tárolási beállításainak mentése
    localStorage.setItem('newsx_save_location', saveHistory.toString());

    setSaveStatus('success');
  } catch (error) {
    console.error('Hiba a böngésző nyelv alapú helymeghatározás során:', error);
    setSaveStatus('error');
  }
  break;
}
```

### 2. LocationProvider.ts kiegészítése

```typescript
/**
 * Böngésző nyelve alapján történő helymeghatározás beállítása
 */
public async setBrowserLanguageLocation(): Promise<boolean> {
  try {
    // BrowserStrategy azonosítása és használata
    const browserStrategy = this.strategies.find(s => s instanceof BrowserStrategy);

    if (!browserStrategy) {
      console.error('[LocationProvider] Nem található BrowserStrategy');
      return false;
    }

    // Helyadatok lekérése a böngésző nyelvéből
    const location = await browserStrategy.getLocation();

    if (!location) {
      console.error('[LocationProvider] Nem sikerült helyet meghatározni a böngésző nyelvéből');
      return false;
    }

    // Helyadatok tárolása
    locationStore.setLocation(location);
    console.log(`[LocationProvider] Böngésző nyelv alapú helymeghatározás: ${location.country}`);

    return true;
  } catch (error) {
    console.error('[LocationProvider] Hiba a böngésző nyelv alapú helymeghatározás során:', error);
    return false;
  }
}
```

### 3. Location.ts kiegészítése

```typescript
// Böngésző nyelve alapján történő helymeghatározás
async setBrowserLanguageLocation(): Promise<boolean> {
  try {
    // Az új LocationProvider metódusát használjuk
    const success = await locationProvider.setBrowserLanguageLocation();

    if (success) {
      console.log('[Location] Böngésző nyelv alapú helymeghatározás sikeres');
    } else {
      console.error('[Location] Böngésző nyelv alapú helymeghatározás sikertelen');
    }

    return success;
  } catch (error) {
    console.error('Hiba a böngésző nyelv alapú helymeghatározás során:', error);
    return false;
  }
}
```

## Az előzmények megjelenítése

A Browser Language esetében hasonló megfontolás érvényes, mint a GPS módnál:

```tsx
{
  locationHistory.length > 0 && locationType === 'manual' && (
    <div className={styles.settingGroup}>
      <h4>Previous Locations</h4>
      {/* Előzmények listája... */}
    </div>
  );
}
```

Ez a kód csak a manuális módban jelenítené meg az előzményeket, míg a GPS és Browser Language módokban nem. Ez logikus, mivel:

1. A manuális módban hasznos gyorsan váltani korábbi országok között
2. A GPS és böngésző nyelvén alapuló módok automatikusak, nincs értelme korábbi választásokat megjeleníteni

## Összefoglalás

A Browser Language helymeghatározási mód a legegyszerűbb a három közül, mivel:

- Nem igényel felhasználói bemenetet
- Nem szükséges hozzá külön engedély vagy API hívás
- Egyszerűen csak feldolgozza a böngésző beépített nyelvi beállításait

A javasolt módosításokkal a Browser Language mód is teljesen működőképes lesz.
