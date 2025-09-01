Oké, nézzük a Utility mappát! Ez a jobb oldali segédpanel komponenseit tartalmazza.

## Utility Komponensek Áttekintése és Javaslatok

### Jelenlegi Struktúra és Funkciók

```
📁 Utility/
├── index.ts            - Exportálja a fő komponenseket
├── Utility.module.css  - Stílusok a panelhez és a fejléchez
├── UtilityHeader.tsx   - A segédpanel fejléce (cím, módváltó gombok, bezárás)
├── UtilityPanel.md     - Dokumentáció (Figyelem: jelenleg React kódot tartalmaz!)
└── UtilityPanel.tsx    - Fő konténer komponens, amely a tartalmat kezeli
```

A UtilityPanel.tsx a központi elem, amely képes különböző "módok" között váltani:

- **'tools'**: Megjelenít egy listát a tervezett segédeszközökről (AI Asszisztens, Jegyzetek, stb.).
- **'auth'**: Megjeleníti az `Auth` komponenst a bejelentkezéshez/regisztrációhoz.
- **'settings'**: Megjeleníti a `Settings` komponenst.

A UtilityHeader.tsx biztosítja a navigációt ezen módok között (ikonos gombokkal), megjeleníti az aktuális módnak megfelelő címet, és tartalmaz egy (feltételesen megjelenő) frissítés és egy bezárás gombot. Az állapotkezelés (az aktuális `mode`) valószínűleg a szülő komponensből (pl. `ResizableLayout`) érkezik prop-okon keresztül (`mode`, `onUtilityModeChange`).

### Fejlesztési Javaslatok

1.  **`UtilityPanel.md` Javítása:**
    - Ez a fájl jelenleg React kódot tartalmaz (#). Cseréld le a tartalmát valódi Markdown dokumentációra, amely leírja a `UtilityPanel` és `UtilityHeader` komponensek célját, prop-jait és használatát.

2.  **Eszközök Listájának Kiszervezése (`UtilityPanel.tsx`):**
    - A 'tools' módban megjelenő lista jelenleg fixen be van égetve a UtilityPanel.tsx-be (#). Hozz létre egy új komponenst, pl. `ToolsList.tsx`, amely felelős ennek a listának a megjelenítéséért. Ez tisztábbá teszi a `UtilityPanel`-t.
    - Tedd a listaelemeket interaktívvá (pl. kattintásra megnyitják a megfelelő eszközt, vagy ha még nincsenek implementálva, egy "Hamarosan" üzenetet jelenítenek meg).

    ```typescript
    // filepath: c:\newsx\src\components\Utility\ToolsList.tsx
    import React from 'react';
    import styles from './Utility.module.css';

    interface ToolsListProps {
      onSelectTool: (toolKey: string) => void; // Callback a szülőnek, ha egy eszközre kattintanak
    }

    // Definiálhatod az eszközöket egy tömbben a könnyebb kezelhetőségért
    const availableTools = [
      { key: 'ai', icon: '💬', name: 'AI Asszisztens', implemented: false },
      { key: 'notes', icon: '📝', name: 'Jegyzetek', implemented: false },
      { key: 'settings', icon: '⚙️', name: 'Beállítások', implemented: true }, // Ezt átirányíthatod a settings módra
      { key: 'search', icon: '🔍', name: 'Részletes keresés', implemented: false },
      { key: 'translate', icon: '🌐', name: 'Fordító', implemented: false },
      { key: 'stats', icon: '📊', name: 'Statisztikák', implemented: false },
    ];

    export const ToolsList: React.FC<ToolsListProps> = ({ onSelectTool }) => {
      return (
        <>
          <p>Ez a panel különféle segédeszközöket tartalmaz:</p>
          <ul className={styles.utilityList}>
            {availableTools.map(tool => (
              <li
                key={tool.key}
                className={`${styles.utilityItem} ${tool.implemented ? styles.clickable : styles.disabled}`} // Stílus az implementált/nem implementált eszközökhöz
                onClick={() => tool.implemented && onSelectTool(tool.key)}
                title={!tool.implemented ? "Hamarosan elérhető" : ""}
              >
                {tool.icon} {tool.name} {!tool.implemented && <span className={styles.soonBadge}>Hamarosan</span>}
              </li>
            ))}
          </ul>
        </>
      );
    };

    // filepath: c:\newsx\src\components\Utility\UtilityPanel.tsx
    import { ToolsList } from './ToolsList'; // Importáld az új komponenst
    // ...

    export const UtilityPanel: React.FC<UtilityPanelProps> = ({ /* ...props... */ }) => {
      // ... other handlers ...

      const handleSelectTool = (toolKey: string) => {
        console.log('Selected tool:', toolKey);
        if (toolKey === 'settings') {
          handleModeChange('settings'); // Válts át settings módra
        }
        // TODO: Implement other tool actions
      };

      return (
        <div className={styles.utilityContainer}>
          <UtilityHeader /* ...props... */ />
          <div className={styles.utilityContent}>
            {mode === 'auth' ? (
              <Auth /* ...props... */ />
            ) : mode === 'settings' ? (
              <Settings />
            ) : (
              // Használd az új komponenst
              <ToolsList onSelectTool={handleSelectTool} />
            )}
          </div>
        </div>
      );
    };
    ```
    - Adj hozzá megfelelő stílusokat a Utility.module.css-hez (`.disabled`, `.soonBadge`, `.clickable`).

3.  **Eszközök Implementálása:**
    - Kezdd el az egyes eszközök (AI Asszisztens, Jegyzetek, stb.) tényleges implementálását külön komponensekként. Ezeket a `UtilityPanel` jelenítheti meg a 'tools' módon belül, vagy akár saját dedikált módokat is kaphatnak, ha komplexebbek.

4.  **Teljesítmény (Lazy Loading):**
    - Ha az `Auth` vagy `Settings` komponensek (vagy a jövőbeli eszközök) nagyok vagy sok függőséggel rendelkeznek, fontold meg a `React.lazy` és `Suspense` használatát a betöltésük késleltetésére, amíg ténylegesen szükség nincs rájuk.

    ```typescript
    // filepath: c:\newsx\src\components\Utility\UtilityPanel.tsx
    import React, { Suspense, lazy } from 'react';
    // ... other imports ...
    import { ToolsList } from './ToolsList'; // A ToolsList valószínűleg nem igényel lazy loadingot

    // Lazy load Auth and Settings
    const Auth = lazy(() => import('../Auth/Auth').then(module => ({ default: module.Auth })));
    const Settings = lazy(() => import('../Settings/Settings').then(module => ({ default: module.Settings })));

    // Egy egyszerű fallback komponens
    const LoadingFallback = () => <div className={styles.loading}>Betöltés...</div>;

    export const UtilityPanel: React.FC<UtilityPanelProps> = ({ /* ...props... */ }) => {
      // ... handlers ...

      return (
        <div className={styles.utilityContainer}>
          <UtilityHeader /* ...props... */ />
          <div className={styles.utilityContent}>
            <Suspense fallback={<LoadingFallback />}>
              {mode === 'auth' ? (
                <Auth /* ...props... */ />
              ) : mode === 'settings' ? (
                <Settings />
              ) : (
                <ToolsList onSelectTool={handleSelectTool} />
              )}
            </Suspense>
          </div>
        </div>
      );
    };
    ```
    - Adj hozzá egy `.loading` stílust a Utility.module.css-hez.

5.  **Akadálymentesség:**
    - Ellenőrizd, hogy a UtilityHeader.tsx navigációs gombjai (#) és a (javasolt) `ToolsList` elemei megfelelően használhatók-e billentyűzettel, és rendelkeznek-e a szükséges ARIA attribútumokkal (pl. `aria-label`, `aria-current` a módváltó gombokhoz).

Melyik javaslattal szeretnél kezdeni?
