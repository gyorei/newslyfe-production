# Tartalom Beállítások Komponens (Content Settings)

## Áttekintés

A ContentSettings komponens lehetővé teszi a felhasználók számára, hogy testre szabják a hírek megjelenítésének módját az alkalmazásban. A felhasználók különböző beállításokkal személyre szabhatják a hírolvasási élményüket.

## Funkciók

> > Ez még nincs kész!!!

### Megjelenítési Mód Választása

- Rács nézet (Grid view): Hírek megjelenítése kártya alapú rács elrendezésben
- Lista nézet (List view): Hírek megjelenítése függőleges lista formátumban
- Kompakt nézet (Compact view): Minimalista megjelenítés kevesebb vizuális elemmel

### Hírek Rendezési Lehetőségei

- Legújabb elöl (Newest first): A legfrissebb hírek megjelenítése felül
- Legnépszerűbb (Most popular): Hírek rendezése népszerűségi mutatók alapján
- Relevancia szerint (By relevance): Hírek rendezése a felhasználó számára való relevancia alapján

> > ez kész van működik!!!

### Oldalankénti Hírek Számának Beállítása

- Előre definiált opciók: 20, 50, 100, 200, 300, 500, 1000 elem
- Egyéni opció: Lehetővé teszi a felhasználók számára, hogy tetszőleges számú hírt jeleníthessenek meg oldalanként
- Az értékek a localStorage-ban tárolódnak a munkamenetek közötti megőrzés érdekében

### Cikk Előnézet Kapcsoló

- Egy húzható kapcsoló a cikk előnézetek engedélyezéséhez/letiltásához
- Bekapcsolt állapotban: Képeket és leírásokat mutat a hírlistában
- Kikapcsolt állapotban: Csak alapvető információkat jelenít meg, kompaktabb nézetet biztosítva

## Technikai Implementáció

### Állapotkezelés

A komponens React useState hook-okat használ a következők kezelésére:

- `newsLimit`: Az oldalanként megjelenítendő hírek száma
- `showPreviews`: Cikk előnézetek megjelenítésének állapota
- `isCustom`: A felhasználó egyéni hírlimit értéket használ-e
- `customValue`: A felhasználó egyéni hírlimit bevitele

### Tárolás

Minden beállítás a localStorage-ban van tárolva:

- `newsLimit`: Az oldalankénti hírek számának tárolása
- `showArticlePreviews`: A cikk előnézetek kapcsoló állapotának tárolása

### UI Elemek

- Legördülő menük a megjelenítési módhoz és rendezési opciókhoz
- Gombcsoport az előre definiált hírlimit opciókhoz
- Beviteli mező az egyéni hírlimit értékekhez
- Húzókapcsoló a cikk előnézetek megjelenítéséhez

## Használat

A ContentSettings komponens általában az alkalmazás beállítások paneljén keresztül érhető el. A beállítások módosításai azonnal érvénybe lépnek, és megmaradnak a jövőbeli munkamenetek során is.

## CSS Modulok

A komponens CSS Modulokat használ a stílusozáshoz, a következő kulcsfontosságú stílusosztályokkal:

- `.settingGroup`: Tároló minden beállítási csoporthoz
- `.limitButtons`: Elrendezés a hírlimit opciók gombjaihoz
- `.customLimitContainer`: Tároló az egyéni limit beviteli mezőhöz
- `.switchLabel`: Stílus a kapcsolók címkéihez
- `.settingHint`: Információs szöveg a beállítások alatt

## Ismert problémák és korlátozások

### Select/Option elemek stílusozási problémái

A select legördülő elemek (option) megjelenítése böngészőfüggő és nehezen testreszabható. A jelenlegi implementáció inline stílusokat használ az option elemek háttér- és szövegszínének beállításához:

```jsx
// Sötét háttér és világos szöveg stílus az option elemekhez
const darkOptionStyle = {
  backgroundColor: '#333',
  color: 'white',
};

<option value="grid" style={darkOptionStyle}>
  Grid view
</option>;
```

#### Lehetséges problémák:

1. **Böngészőfüggőség**: Az option elemek megjelenítése erősen böngészőfüggő. Minden böngésző (Chrome, Firefox, Safari, Edge) a saját natív UI-ját használja.

2. **Korlátozott CSS támogatás**: Az option elemek stílusozására vonatkozó CSS szabályokat és inline stílusokat a böngészők gyakran figyelmen kívül hagyják.

#### Ha nem működne a jelenlegi megoldás, alternatívák:

1. Egyedi legördülő menü komponens implementálása div elemekkel
2. Külső könyvtár használata (pl. react-select)
3. A select elemek helyett más UI elemek használata (pl. radio gombcsoport)

---

---

# Az Oldalankénti Hírek Számának Beállítási Dokumentációja

A következő dokumentáció átfogó képet ad az oldalankénti hírek számának beállításáról és a funkció minden kapcsolódó komponenséről, moduljáról.

## 1. Komponensek és Fájlok

### Fő komponensek:

- **ContentSettings.tsx**: A beállítások kezelőfelülete, ahol a felhasználó kiválaszthatja a hírek számát
- **ContentSettingsPanelBridge.ts**: Kommunikációs híd a beállítások és a Panel komponens között
- **Panel.tsx**: A hírek megjelenítéséért felelős komponens, amely reagál a beállításokra

### CSS fájlok:

- **ContentSettings.module.css**: A beállítások UI stílusai
- **Panel.module.css**: A hírek megjelenítésének stílusai

### Dokumentáció:

- **README.md**: A ContentSettings komponens funkcióinak dokumentációja

## 2. Adatáramlás és Kommunikáció

```
ContentSettings.tsx → ContentSettingsPanelBridge.ts → Panel.tsx
       ↑                                                  ↓
localStorage/IndexedDB ← ← ← ← ← ← ← ← ← ← ← ← ← ← ← ← ← Megjelenítés
```

### Folyamat:

1. A felhasználó kiválaszt egy értéket a ContentSettings modulban
2. Az érték tárolódik:
   - localStorage-ban (visszafelé kompatibilitás miatt)
   - IndexedDB-ben (useStorage hook használatával)
3. A ContentSettingsPanelBridge eseményt küld
4. A Panel komponens feliratkozik erre az eseményre, és frissíti a megjelenítést

## 3. Adattárolás

A hírek száma két helyen is tárolódik:

### 3.1. localStorage

```javascript
localStorage.setItem('newsLimit', value.toString());
```

### 3.2. IndexedDB (DataManager)

```javascript
await saveUserPreference({
  id: ITEMS_PER_PAGE_PREFERENCE_KEY, // 'user_itemsPerPage'
  value: value,
  updatedAt: Date.now(),
});
```

## 4. A ContentSettingsPanelBridge Részletesen

Ez a modul egy egyszerű pub/sub (publish-subscribe) mintát implementál:

```typescript
// Egyszerű kommunikációs híd a ContentSettings és Panel között
class SettingsEventBridge {
  private listeners: SettingsChangeCallback[] = [];

  // Feliratkozás a beállítások változásaira
  public subscribe(callback: SettingsChangeCallback): () => void {
    // ...
  }

  // Beállításváltozás esemény kiváltása
  public emit(key: string, value: number): void {
    // ...
  }
}
```

## 5. A Panel Komponens Oldalszámozása

A Panel komponens az alábbi lépésekkel kezeli az oldalankénti hírek számát:

```typescript
// ÚJ: Az aktuális oldalhoz tartozó hírek kiszámítása
const { pageItems, totalPages, validCurrentPage } = React.useMemo(() => {
  // Teljes hírek száma
  const totalItems = newsItems.length;

  // Teljes oldalak száma
  const totalPages = Math.max(1, Math.ceil(totalItems / itemsPerPage));

  // Aktuális oldal híreinek indexei
  const startIndex = (validCurrentPage - 1) * itemsPerPage;
  const endIndex = Math.min(startIndex + itemsPerPage, totalItems);

  return {
    pageItems: newsItems.slice(startIndex, endIndex),
    totalPages,
    validCurrentPage,
  };
}, [newsItems, currentPage, itemsPerPage]);
```

### 5.1. Reszponzív viselkedés

A Panel komponens többféle képernyőméretre optimalizált:

```css
/* Panel.module.css - Reszponzív design */
@media (max-width: 768px) {
  .paginationContainer {
    padding: 0.75rem 0;
    margin-top: 0.25rem;
  }

  .pageInfo {
    font-size: 0.8rem;
  }
}
```

- **Mobil eszközökön** (≤768px): kompaktabb oldalszámozás, kisebb betűméret az oldalinformációban
- **Tablet eszközökön** (≤1024px): opcionális horizontális hírgörgetés a könnyebb navigáció érdekében
- **Asztali eszközökön**: teljes szélességű, kártyás megjelenítés optimális elrendezéssel

### 5.2. Adaptív elrendezési technikák

A Panel a következőket használja az adaptív megjelenítéshez:

1. **CSS Grid autofit**: `grid-template-columns: repeat(auto-fill, minmax(300px, 1fr))` a kártyák automatikus elrendezéséhez különböző szélességeken
2. **Media query-k**: különböző készülékméretekre optimalizált megjelenéshez
3. **Flex konténerek**: a belső elemek rugalmas elrendezéséhez különböző méretarányokon
4. **Relatív mértékegységek**: rem és százalék használata a rugalmas méretezéshez

## 6. Kapcsolódás a Tartalom Komponensekhez

A Content komponens kezeli a tartalom megjelenítését és a Panel komponens a tartalom részleteit:

- **Content.tsx**: eltárolja a hírek állapotát
- **Panel.tsx**: megjeleníti a híreket a beállított számban
- A hírek száma befolyásolja a lapozást és a görgetési élményt

## 7. Teljesítmény Megfontolások

1. **500+ hírek esetén figyelmeztetés** jelenik meg a felhasználónak a potenciális teljesítményproblémákról
2. **Validáció** biztosítja, hogy csak észszerű értékek kerüljenek beállításra (5-2000 között)
3. **Memória használat**: Nagyobb hírlimitek növelik a memóriahasználatot
4. **Lapozás optimalizálása**: A React.useMemo használata biztosítja, hogy a lapozás hatékonyan működjön

### 7.1. React.useMemo optimalizálás

```typescript
// A lapozás kiszámítása optimalizálva useMemo-val
const { pageItems, totalPages, validCurrentPage } = React.useMemo(() => {
  // Teljes hírek száma
  const totalItems = newsItems.length;
  // Teljes oldalak száma
  const totalPages = Math.max(1, Math.ceil(totalItems / itemsPerPage));
  // ...egyéb kalkulációk

  // Csak akkor számoljuk újra, ha valóban változtak a függőségek
  return { pageItems, totalPages, validCurrentPage };
}, [newsItems, currentPage, itemsPerPage]);
```

Ez a megközelítés jelentősen csökkenti az újraszámítások számát, mivel a lapozási adatokat csak akkor számítja újra, ha a hírek listája, az aktuális oldal vagy az elemek száma változik.

### 7.2. Memória használat kezelése

- **Lépcsőzetes validációs korlátok**:
  - Minimum érték: 5 hír/oldal
  - Maximum érték: 2000 hír/oldal
  - Figyelmeztetési határ: 500+ hír/oldal

- **Lapozott betöltés**: Nagy hírlimitek esetén a Panel komponens csak a látható elemeket rendereli, ami csökkenti a memória és DOM műveletek terhelését.

### 7.3. Görgetési teljesítmény

- **Simított görgetés helyreállítás**: A lapozáskor a görgetés gyors, de nem azonnali, ami jobb felhasználói élményt biztosít.
- **Görgetési pozíció megőrzése**: A rendszer menti és helyreállítja a görgetési pozíciót fülváltások között.
- **Virtuális renderelés lehetősége**: Extrém nagy hírkészletek esetén a rendszer felkészült virtuális lista renderelés bevezetésére.

## 8. Hibakezelés

1. **Érvénytelen értékek kezelése**: Ha a felhasználó érvénytelen értéket ad meg, validációs üzenetek jelennek meg
2. **Kivételkezelés**: A try-catch blokkok biztosítják, hogy a mentési hibák ne okozzanak összeomlást
3. **Adatbetöltési hibák**: A Panel komponens megfelelően kezeli az adatbetöltési hibákat
4. **Értékhatárok ellenőrzése**:
   - Minimum: 5 hír/oldal (kisebb érték nem használható)
   - Maximum: 2000 hír/oldal (nagyobb érték teljesítményproblémákat okozhat)
   - Figyelmeztetési küszöb: 500+ hír/oldal (potenciális memória/teljesítmény problémákkal jár)

## 9. Felhasználói Felület

### 9.1. Hírlimit Beállítás UI:

- Előre definiált gombok: 20, 50, 100, 200, 300, 500, 1000
- Egyéni érték mezője számszerű bevitelhez
- "Alkalmaz" gomb az egyéni értékekhez

### 9.2. Lapozás UI a Panelben:

- Oldal váltó navigáció
- Oldal információ: "Összesen X hír | Y-Z megjelenítve"

## 10. Kiterjeszthetőség

A rendszer könnyen kiterjeszthető új beállításokkal:

1. Új konstans definiálása a ContentSettingsPanelBridge.ts fájlban
2. Új adattárolási és kezelési logika a ContentSettings.tsx-ben
3. Feliratkozás az új beállításra a megfelelő komponens(ek)ben

## 11. Összefoglalás

Az oldalankénti hírek számának beállítása egy jól tervezett, moduláris rendszer, amely:

- Lehetővé teszi a felhasználók számára a hírek megjelenítésének testreszabását
- Valós időben frissül újratöltés nélkül a pub/sub mintának köszönhetően
- Megfelelően tárolja a beállításokat a jövőbeli munkamenetek számára
- Validálja a felhasználói bevitelt a konzisztencia és teljesítmény érdekében
- Optimalizált hírmegjelenítést biztosít különböző eszközökön

A rendszer tökéletes példája a komponensek közötti lazán csatolt kommunikációnak, amely lehetővé teszi a rugalmasságot és a karbantarthatóságot.
