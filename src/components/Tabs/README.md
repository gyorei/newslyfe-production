# 🎯 Tabs Komponensek

Ez a mappa a fülek (tabs) kezeléséért felelős komponenseket tartalmazza. A komponensek támogatják a **hírek**, **keresés** és **videó** tab-okat.

---

## 🆕 Modern "Keep-Alive" Tab Architektúra (2024 refaktor)

### Fő komponensek:
- **TabManager.tsx**: A tabok állapotát, az aktív tabot és a callback-eket kezeli. Ez a fő belépési pont.
- **TabNavigation.tsx**: A tabfül sáv, amely a tabok címét, bezáró gombját, aktiválását kezeli.
- **TabContentRenderer.tsx**: Minden tabhoz memoizált tartalom komponenst renderel, és csak az aktív tab látszik (isActive prop).
- **Panel.tsx, Home.tsx, SearchTab.tsx, VideoPanel.tsx**: Mindegyik fogadja az isActive propot, és csak akkor renderel, ha aktív. Minden komponens React.memo-val van ellátva.
- **types.ts**: A Tab interface, amely tartalmazza a type mezőt is (pl. 'panel', 'home', 'search', 'video').

### Fő elvek:
- **Keep-alive minta**: Minden tab tartalom komponens a DOM-ban marad, csak az aktív látszik. A belső állapotuk nem nullázódik tabváltáskor.
- **React.memo + isActive**: A tartalom komponensek csak akkor renderelnek újra, ha a saját adatuk változik, vagy az isActive prop változik.
- **Callback-ek stabilizálása**: Minden callback (onTabSelect, onTabClose, onRetry, stb.) useCallback-kal van memoizálva a TabManager-ben.
- **TabContentRenderer**: A tabs tömb alapján minden tabhoz a megfelelő memoizált tartalom komponenst rendereli, és átadja az isActive propot.

### Példa szerkezet:
```
Tabs/
├── TabManager.tsx           # Tabok állapota, logika, callback-ek
├── TabNavigation.tsx        # Tabfül sáv, navigáció
├── TabContentRenderer.tsx   # Tartalom komponensek keep-alive renderelése
├── types.ts                 # Tab interface
├── Panel/Panel.tsx          # Panel tartalom komponens (isActive prop)
├── Home/Home.tsx            # Home tartalom komponens (isActive prop)
├── SearchTab/SearchTab.tsx  # Keresés tartalom komponens (isActive prop)
├── VideoPanel/VideoPanel.tsx# Videó tartalom komponens (isActive prop)
```

### Új Tab interface (types.ts):
```typescript
export interface Tab {
  id: string;
  type: 'panel' | 'home' | 'search' | 'video';
  title: string;
  // ...egyéb tab-specifikus adatok
}
```

### TabContentRenderer példa:
```tsx
<TabContentRenderer
  tabs={tabs}
  activeTabId={activeTabId}
  // ...egyéb propok
/>
```

### Tartalom komponens példa:
```tsx
const Panel: React.FC<PanelProps> = ({ isActive, ... }) => {
  if (!isActive) return null;
  // ...
};
export default React.memo(Panel);
```

### TabManager callback-ek:
```tsx
const handleTabSelect = useCallback((tabId: string) => setActiveTabId(tabId), []);
const handleTabClose = useCallback((tabId: string) => { /* ... */ }, [tabs]);
// ...
```

---

## 📁 Fájlstruktúra

(A régi szerkezet is érvényes, de a fenti keep-alive architektúra az ajánlott!)

```
Tabs/
├── README.md              # Ez a dokumentáció
├── TabController.tsx      # (Régi) Fő tab tartalom kezelő
├── TabContainer.tsx       # Tab konténer és navigáció
├── DraggableTabs.tsx      # Drag-and-drop tab fejlécek
├── Home/
│   └── Home.tsx          # Kezdő oldal komponens
├── SearchTab/
│   └── SearchTab.tsx     # Keresési tab komponens
└── utils/
    └── TabDebug.ts       # Tab debug eszközök
```

## 🎯 Komponensek Leírása

### TabManager.tsx (ÚJ)
**A tabok állapotát, az aktív tabot és a callback-eket kezeli.**
- Tabok tömbje, activeTabId state
- Tabváltás, tabtörlés, tabhozzáadás logika
- useCallback minden callback-re
- Rendereli a TabNavigation-t és a TabContentRenderer-t

### TabContentRenderer.tsx (ÚJ)
**Minden tabhoz memoizált tartalom komponenst renderel, csak az aktív látszik.**
- tabs tömb alapján switch-el a tartalom komponensek között
- isActive prop minden tartalom komponensnek
- ...rest propok átadása

### TabNavigation.tsx (ÚJ)
**Tabfül sáv, navigáció, bezárás**
- Tabok címe, aktiválás, bezárás

### Panel.tsx, Home.tsx, SearchTab.tsx, VideoPanel.tsx
**Tartalom komponensek, mind React.memo-val, isActive prop-pal**
- Csak akkor renderelnek, ha aktívak
- Belső állapotuk megmarad tabváltáskor

### types.ts (ÚJ)
**Tab interface, type mezővel**

---

(A régi TabController, TabContainer, DraggableTabs, stb. leírásokat csak akkor töröld, ha már nem használod őket a projektben!)

---

## 📝 Fejlesztési Jegyzetek
- **Keep-alive**: A tartalom komponensek nem unmountolódnak tabváltáskor
- **Memoization**: Csak a saját adatuk változására renderelnek újra
- **Callback stabilizálás**: useCallback minden callback-re
- **Típusbiztonság**: Tab interface mindenhol
- **Egységes prop átadás**: ...rest propok

---

(A régi Video tab, TabController, TabContainer, DraggableTabs, stb. szekciók csak akkor törlendők, ha már nem érvényesek a projektben!)

## ⚡️ 2025.07.31. - ErrorBoundary bevezetése

- Az alkalmazás mostantól React Error Boundary-t használ a TabContainer-ben (a Content komponens körül).
- Ennek köszönhetően, ha egy Panel vagy annak tartalma (pl. Card) hibára fut, csak az adott tab helyén jelenik meg hibaüzenet, a többi tab és az alkalmazás többi része zavartalanul működik.
- Szükség esetén további ErrorBoundary komponensek is elhelyezhetők (pl. Panel vagy Card szinten), de a TabContainer szintű védelem a legtöbb esetben elegendő.

**Példa:**
```tsx
<ErrorBoundary>
  <Content {...contentProps} />
</ErrorBoundary>
```

Lásd: src/components/ErrorBoundary/ErrorBoundary.tsx
