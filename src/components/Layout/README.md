A mobil és webes nézetekhez tartozó panelnyitási szélességeket a ResizableLayout.tsx fájlban definiált konstansokkal tudod beállítani.

Keresd meg ezeket a sorokat a fájl elején (az importok után):

```typescript
// ... (importok) ...

// ÚJ Konstansok a panel méretekhez
const MOBILE_PANEL_EXPANDED_SIZE_PERCENT = 85; // Bal és jobb panel mobil nézetben
const DEFAULT_WEB_PANEL_LEFT_EXPANDED_SIZE_PERCENT = 20;
const DEFAULT_WEB_PANEL_RIGHT_EXPANDED_SIZE_PERCENT = 20;
// ... (többi konstans) ...
```

**Itt tudod módosítani a következő értékeket:**

1.  `MOBILE_PANEL_EXPANDED_SIZE_PERCENT = 85;`
    - **Ez határozza meg, hogy mobil nézetben (amikor a képernyő szélessége 768px vagy kevesebb) a bal és a jobb oldali panel a képernyő szélességének hány százalékára nyíljon ki.** Jelenleg 85%-ra van állítva. Ha például azt szeretnéd, hogy a képernyő 90%-át foglalja el, átírhatod `90`-re.

2.  `DEFAULT_WEB_PANEL_LEFT_EXPANDED_SIZE_PERCENT = 20;`
    - **Ez határozza meg, hogy webes/asztali nézetben a bal oldali panel alapértelmezetten a képernyő szélességének hány százalékára nyíljon ki,** amennyiben a felhasználónak még nincs elmentett preferált mérete (pl. első indításkor, vagy ha törölte a `localStorage`-t). Jelenleg 20%.

3.  `DEFAULT_WEB_PANEL_RIGHT_EXPANDED_SIZE_PERCENT = 20;`
    - **Ez határozza meg, hogy webes/asztali nézetben a jobb oldali panel alapértelmezetten a képernyő szélességének hány százalékára nyíljon ki,** amennyiben a felhasználónak még nincs elmentett preferált mérete. Jelenleg ez is 20%.

**Fontos:**

- Ezek az értékek százalékban vannak megadva.
- Webes nézetben, ha a felhasználó manuálisan átméretezi a panelt, az az új méret elmentődik a `localStorage`-ba, és a következő nyitáskor az lesz használva, felülírva a `DEFAULT_WEB_PANEL_..._EXPANDED_SIZE_PERCENT` értéket.
- A mobil nézet mindig a `MOBILE_PANEL_EXPANDED_SIZE_PERCENT` értéket fogja használni nyitáskor, nem veszi figyelembe a `localStorage`-ban tárolt webes méretet.

Ha módosítani szeretnéd ezeket az alapértelmezett nyitási szélességeket, csak írd át a számokat ezekben a konstans definíciókban a `ResizableLayout.tsx` fájlban.

## A `ResizableLayout.tsx` Működése Részletesen

A `ResizableLayout.tsx` komponens felelős az alkalmazás fő elrendezésének (bal oldali panel, központi tartalom, jobb oldali panel) megjelenítéséért és dinamikus átméretezhetőségéért. A `react-resizable-panels` könyvtárat használja az alapvető panel funkcionalitáshoz.

### Főbb Jellemzők és Logika:

1.  **Reszponzivitás (`useMediaQuery`):**
    - A `useMediaQuery('(max-width: 768px)')` hook segítségével érzékeli, hogy az alkalmazás mobil (`isMobileView = true`) vagy asztali/webes (`isMobileView = false`) nézetben fut-e. Ez az állapot alapvetően befolyásolja a panelek viselkedését.

2.  **Panel Állapotok Kezelése (Propok az `App.tsx`-ből, `useAppPanels`-en keresztül):**
    - Az `isLeftPanelCollapsed` és `isRightPanelCollapsed` boolean propokat kapja meg, amelyek meghatározzák, hogy egy panelnek összecsukva vagy kinyitva kell-e lennie. Ezeket az állapotokat az `App.tsx` (a `useAppPanels` hookon keresztül) menedzseli, amely szintén figyelembe veszi az `isMobileView`-t az alapértelmezett (kezdeti) összecsukott állapot beállításakor mobil nézetben.

3.  **Panel Nyitási/Csukási Logika (`useEffect` horgok):**
    - Külön `useEffect` horgok figyelik az `isLeftPanelCollapsed` és `isRightPanelCollapsed` propok változását.
    - **Nyitáskor** (amikor a `...Collapsed` prop `false`-ra vált):
      - **Mobil nézetben (`isMobileView === true`):** A panel a `MOBILE_PANEL_EXPANDED_SIZE_PERCENT` konstansban meghatározott százalékos szélességre nyílik ki (pl. 85%). Ezt a `panelRef.current.resize()` metódus hívásával éri el.
      - **Webes nézetben (`isMobileView === false`):** A panel a felhasználó által korábban beállított és `localStorage`-ban tárolt méretre (`leftPanelSize` vagy `rightPanelSize` állapotváltozók) nyílik ki. Ha nincs ilyen mentett méret, akkor a `DEFAULT_WEB_PANEL_LEFT_EXPANDED_SIZE_PERCENT` vagy `DEFAULT_WEB_PANEL_RIGHT_EXPANDED_SIZE_PERCENT` konstansban definiált alapértelmezett webes méretet használja. Ezt szintén a `panelRef.current.resize()` metódussal valósítja meg.
    - **Csukáskor** (amikor a `...Collapsed` prop `true`-ra vált):
      - A megfelelő panel `panelRef.current.collapse()` metódusa hívódik meg, ami a panelt 0 pixel szélesre állítja.

4.  **Felhasználói Átméretezés Kezelése (Webes Nézetben):**
    - A `Panel` komponensek `onResize` eseménykezelője (pl. `handleLeftPanelResize`) aktiválódik, amikor a felhasználó manuálisan húzza a panel szélét.
    - **Csak webes nézetben (`!isMobileView`):** Ha a panel új mérete nagyobb mint 0, az új százalékos méret elmentődik a komponens belső állapotába (`leftPanelSize`, `rightPanelSize`) és a `localStorage`-ba (`localStorage.setItem('leftPanelSize', newSize)`). Ez biztosítja, hogy a következő alkalommal, amikor a felhasználó webes nézetben kinyitja a panelt, az az általa utoljára beállított méretre nyíljon.
    - Mobil nézetben a manuális átméretezés nem menti el a méretet, hogy a fix mobil nyitási méret konzisztens maradjon.

5.  **Kezdeti Betöltés és Állapotbeállítás:**
    - Egy `initialRender` ref (kezdetben `true`) és egy `useEffect` hook biztosítja, hogy az alkalmazás első betöltődésekor a panelek a `useAppPanels`-ből kapott `isLeftPanelCollapsed` és `isRightPanelCollapsed` propoknak, valamint az aktuális `isMobileView` állapotnak megfelelően jelenjenek meg (összecsukva vagy a helyes méretre kinyitva). Ez segít elkerülni a "villanásokat" vagy a helytelen kezdeti panelméreteket.
    - Az `initialRender.current` `false`-ra állítása után ez a specifikus `useEffect` már nem fut le újra, csak a prop-változásokat figyelő többi `useEffect`.

6.  **Panel Méret Állapotváltozók (`leftPanelSize`, `rightPanelSize`):**
    - Ezek a `useState` hookkal létrehozott állapotváltozók tárolják a bal és jobb oldali panelek aktuális/preferált százalékos szélességét webes nézetben.
    - Inicializáláskor megpróbálják betölteni az értéket a `localStorage`-ból. Ha nincs érvényes mentett érték, az alapértelmezett webes méretekkel (`DEFAULT_WEB_PANEL_..._EXPANDED_SIZE_PERCENT`) inicializálódnak.

7.  **Panel Referenciák (`leftPanelRef`, `rightPanelRef`):**
    - Ezek a `useRef` hookkal létrehozott referenciák teszik lehetővé az imperatív hozzáférést a `Panel` komponensek metódusaihoz (pl. `.resize()`, `.collapse()`).

### Összefoglalva:

A `ResizableLayout` egy központi komponens, amely intelligensen kezeli a panelek méretét és láthatóságát a képernyőméret (mobil/web), a felhasználói interakciók (átméretezés) és az alkalmazás általános állapotából (panelek összecsukottsága) származó információk alapján. A `localStorage` használatával perzisztálja a felhasználó webes nézetben beállított panelméreteit, míg mobil nézetben egy konzisztens, nagy méretű panelmegjelenítést biztosít.
