# Alapos terv a hírek számának valós idejű frissítéséhez

Látom, hogy valós idejű kommunikációt kell létrehoznunk a beállítások változása és a Panel komponens között. Tekintsük át a jelenlegi helyzetet, és készítsünk részletes tervet a megoldásra.

## Jelenlegi helyzet

1. A `ContentSettings` komponensben lehet beállítani az oldalanként megjelenő hírek számát (20, 50, 100, 200, 300, 500, 1000 vagy egyéni)
2. A beállítás elmentődik:
   - `localStorage`-ba visszafelé kompatibilitás miatt
   - IndexedDB-be a `saveUserPreference` funkcióval
3. A `Panel` komponens betölti ezt az értéket:
   - IndexedDB-ből a `getUserPreference` segítségével
   - Fallbackként `localStorage`-ból
4. **Probléma**: A beállítás változása csak az oldal újratöltése után érvényesül

//////////////////////////////////////////////////////////

## Architektúrális megértés

Az alkalmazás állapotkezelése:

- A beállítások az IndexedDB-ben tárolódnak
- A cache az IndexedDB és memória cache kombinációját használja
- Nincs globális állapotkezelő (pl. Redux), ami azonnal értesítené a komponenseket a változásokról
  /////////////////////////////////////////////////

## Megoldási terv

Létrehozunk egy egyszerű eseménykezelő rendszert, amely lehetővé teszi, hogy a komponensek kommunikáljanak és értesüljenek a változásokról a böngésző újratöltése nélkül.

### 1. Eseménykezelő létrehozása

```tsx
/**
 * Egyszerű eseménykezelő rendszer a beállítások változásának követésére
 * Lehetővé teszi a komponensek közötti valós idejű kommunikációt
 */

// Callback típus a beállítások változásaihoz
type SettingsChangeCallback = (key: string, value: any) => void;

/**
 * Beállítások eseménykezelője
 * - Feliratkozás és leiratkozás támogatása
 * - Események kiváltása
 * - Egyszerű pub/sub mechanizmus
 */
class SettingsEventManager {
  private listeners: SettingsChangeCallback[] = [];

  /**
   * Feliratkozás a beállítások változásaira
   * @param callback - A függvény, amely meghívódik, amikor változik egy beállítás
   * @returns Leiratkozó függvény
   */
  public subscribe(callback: SettingsChangeCallback): () => void {
    this.listeners.push(callback);

    // Visszatérünk egy függvénnyel, amellyel leiratkozhatunk
    return () => {
      this.listeners = this.listeners.filter((cb) => cb !== callback);
    };
  }

  /**
   * Beállítás változás esemény kiváltása
   * @param key - A beállítás kulcsa
   * @param value - A beállítás új értéke
   */
  public emit(key: string, value: any): void {
    this.listeners.forEach((callback) => {
      try {
        callback(key, value);
      } catch (error) {
        console.error('Hiba a beállításváltozás kezelésekor:', error);
      }
    });
  }
}

// Singleton példány az alkalmazásban való használatra
export const settingsEvents = new SettingsEventManager();
```

### 2. A ContentSettings komponens módosítása

```tsx
// Korábbi importok + új import
import { settingsEvents } from '../../../../utils/events/settingsEvents';

// ... (existing code)

const handleLimitChange = async (newLimit: number) => {
  // ... (existing code)

  try {
    // Korábbi localStorage mentés megtartása a visszafelé kompatibilitásért
    localStorage.setItem('newsLimit', newLimit.toString());

    // ÚJ: Mentés a DataManager-rel
    await saveUserPreference({
      id: ITEMS_PER_PAGE_PREFERENCE_KEY,
      value: newLimit,
      updatedAt: Date.now(),
    });

    // ÚJ: Értesítés küldése a beállítás változásáról
    settingsEvents.emit(ITEMS_PER_PAGE_PREFERENCE_KEY, newLimit);

    console.log(`[ContentSettings] Oldalankénti hírek száma beállítva: ${newLimit}`);
  } catch (error) {
    console.error('Hiba a beállítások mentésekor:', error);
  }
};

// Ugyanígy módosítjuk a handleCustomValueSubmit függvényt is
const handleCustomValueSubmit = async () => {
  // ... (existing code)

  try {
    // ... (existing code)

    // ÚJ: Értesítés küldése a beállítás változásáról
    settingsEvents.emit(ITEMS_PER_PAGE_PREFERENCE_KEY, parsedValue);

    console.log(`[ContentSettings] Egyedi oldalankénti hírlimit beállítva: ${parsedValue}`);
  } catch (error) {
    console.error('Hiba a beállítások mentésekor:', error);
  }
};

// ... (rest of the code remains unchanged)
```

### 3. A Panel komponens módosítása

```tsx
// Korábbi importok + új import
import { settingsEvents } from '../../utils/events/settingsEvents';

// ... (existing code)

export const Panel: React.FC<PanelProps> = ({
  title,
  newsItems = [],
  loading = false,
  error = null,
  onRetry,
  onToggleMenu,
}) => {
  // ... (existing code and states)

  // ÚJ: Feliratkozás a beállítások változására
  React.useEffect(() => {
    // Feliratkozunk a hírek/oldal beállítás változására
    const unsubscribe = settingsEvents.subscribe((key, value) => {
      if (key === 'user_itemsPerPage') {
        console.log('Panel értesült a hírek/oldal beállítás változásáról:', value);

        // Ellenőrizzük, hogy a kapott érték egy érvényes szám
        const numValue = Number(value);
        if (Number.isFinite(numValue) && numValue >= 1) {
          // Frissítjük az oldalankénti hírek számát
          setItemsPerPage(numValue);
          // Visszaállunk az első oldalra
          setCurrentPage(1);
        }
      }
    });

    // Leiratkozás a komponens unmountoláskor
    return () => {
      unsubscribe();
    };
  }, []); // Üres függőségi tömb, csak egyszer fut le

  // ... (rest of the code remains unchanged)
};
```

## Implementáció lépései

1. **Hozzuk létre az eseménykezelő modult**:
   - Készítsük el a `src/utils/events/settingsEvents.ts` fájlt a fenti tartalommal

2. **Módosítsuk a ContentSettings komponenst**:
   - Adjuk hozzá az eseménykezelő importját
   - Egészítsük ki a beállítások mentését értesítések kiküldésével

3. **Módosítsuk a Panel komponenst**:
   - Adjuk hozzá az eseménykezelő importját
   - Implementáljuk a feliratkozást a beállítások változására
   - Frissítsük a komponens állapotát, amikor megváltozik egy releváns beállítás

## Miért működik ez a megoldás?

1. **Teljes kompatibilitás**: Megtartja a jelenlegi mentési és betöltési mechanizmusokat
2. **Alacsony függőség**: Nem igényel bonyolult külső könyvtárakat vagy nagy változtatásokat
3. **Közvetlen kommunikáció**: Azonnal értesíti a Panel komponenst a beállítások változásáról
4. **Megfelelő szeparáció**: Az eseménykezelő elválasztja a beállítások kezelését a megjelenítéstől

Ez a megoldás azonnal frissíti a hírek számát, amikor a felhasználó módosítja a beállításokat, anélkül hogy újra kellene tölteni az oldalt.

Elkezdjem az implementációt?

===========================================

## Válaszok a kérdésekre:

1. **Mit fog csinálni a src/utils/events/settingsEvents.ts fájl?**
   - Ez egy egyszerű eseménykezelő (pub/sub) rendszert implementál
   - Lehetővé teszi, hogy a komponensek kommunikáljanak egymással anélkül, hogy közvetlen referenciát tartanának egymásra
   - Segítségével a beállítások változásairól valós időben értesülhetnek a megfelelő komponensek
   - Eseménykibocsátás (emit) és feliratkozás (subscribe) funkciókat biztosít

2. **Melyik fájlhoz fog tartozni?**
   - Ez egy önálló segédmodul lesz a `/src/utils/events/` mappában
   - Nem tartozik közvetlenül egyik komponenshez sem, hanem egy közös infrastruktúra elem
   - Mind a `ContentSettings`, mind a `Panel` komponens importálni és használni fogja

3. **Mérlegelés a hírletöltéssel kapcsolatban:**
   - A 20, 50, vagy akár 100 hír gyorsan letölthető cache nélkül is
     =====///////////////FONTOS RÉSZ!!
   ##
   - Ez a módosítás nem befolyásolja a hírek letöltésének logikáját, csak a megjelenítést érinti
   - Az oldalszámozás során valószínűleg már az összes hír betöltésre került, csak annyi történik, hogy a Panel komponens újraszámolja, hogy melyik csoport jelenjen meg
   - A hírek számának változtatása csupán a paginációt befolyásolja, nem indít új hírletöltést, hanem az éppen megjelenített hírek csoportját módosítja

A fentiek alapján ez a megoldás hatékony és nem okoz teljesítményproblémát, mivel nem kezdeményez új hálózati kéréseket, csak a már betöltött adatok megjelenítési módját befolyásolja.
////////////////////// FONTOS RÉSZ VÉGE //////// 4. **Miért nem használunk Redux-ot?**

- A Redux egy erősebb állapotkezelő, de a jelenlegi alkalmazásban nem szükséges

=====================================================
