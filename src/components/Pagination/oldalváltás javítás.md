Nagyon jó, hogy összegyűjtötted a releváns fájlokat!  
**Áttekintem, hogyan működik jelenleg a Pagination, és miért nem ugrik a lap tetejére oldalváltáskor.**  
Ezután pontosan megmondom, mit és hol kell javítani, hogy minden oldalváltás után a scroll a tetejére kerüljön.

---

## **1. Pagination működésének áttekintése a kódban**

### **A. PaginationStorage.ts**
- Csak az aktuális oldal és itemsPerPage értékét menti/tölti localStorage-ból.
- **NEM tartalmaz scroll logikát!**
- Ez csak az oldalváltás állapotát tárolja, nem a görgetést kezeli.

---

### **B. useAppTabs.md**
- Tabok állapotát, aktív tabot, stb. kezeli.
- Pagination-hez kapcsolódóan csak a tab zárásakor törli a PaginationStorage-t.
- **Nincs scroll vagy oldalváltás utáni scroll reset logika.**

---

### **C. useTabStorage.ts**
- Tab tartalom, cache, pagination állapot mentése/betöltése.
- Van benne:  
  - `savePaginationState`, `loadPaginationState`, `clearPaginationState` – ezek a PaginationStorage-t használják.
- **Scroll pozíció mentését nem végzi, csak a pagination állapotot.**
- **Nincs scroll reset oldalváltáskor!**

---

### **D. TabController.tsx**
- A tab tartalmat rendereli, a Panel-t vagy VideoPanel-t, vagy SearchTab-ot.
- A Panel-nek átad egy `onPaginationChange` callback-et.
- **A scroll reset logika nem itt van, hanem a Panel/Content/ScrollContainer-ben kell keresni.**

---

### **E. Panel.tsx**
- Itt van a Pagination komponens meghívása.
- A `handlePageChange` függvény:
  - Állítja a `currentPage`-t.
  - Ment a PaginationStorage-ba.
  - Meghívja az `onPaginationChange(true)` callback-et, ha van ilyen.
- **A scroll resetet NEM itt végzi, hanem csak jelez a szülőnek (Content-nek), hogy oldalváltás történt.**

---

### **F. Content.tsx**
- Itt van a `handlePaginationChange` callback, amit a Panel-nek ad át.
- Ez a callback:
  - Ha `shouldScrollToTop` igaz, akkor növeli a `paginationTrigger` state-et.
- A `ScrollContainer`-nek átadja a `resetScrollTrigger` propot, ami a `paginationTrigger` értéke.
- **A tényleges scroll reset a ScrollContainer-ben történik, amikor a `resetScrollTrigger` változik.**

---

### **G. scrollManager.ts**
- Általános scroll kezelő utility.
- Van benne `performScroll`, ami különböző DOM elemekre próbál scrollozni.
- **Ez egy utility, de a ScrollContainer-ben kell meghívni oldalváltáskor.**

---

## **2. Hol van a hiba?**

- **A scroll reset logika a ScrollContainer-ben van, de a ScrollContainer csak akkor scrolloz a tetejére, ha a `resetScrollTrigger` prop változik.**
- A Panel → Content → ScrollContainer útvonalon a callback lánc helyes, de:
  - **Ha a ScrollContainer nem jól detektálja a scrollable elemet, vagy nem hívja meg a scrollTo-t, akkor nem lesz scroll reset.**
- A Pagination komponens NEM tudja magától visszaállítani a scrollt, csak jelez a szülőnek.

---

## **3. Mit kell javítani?**

### **A. Ellenőrizd, hogy a ScrollContainer-ben van-e ilyen logika:**
```tsx
useEffect(() => {
  if (resetScrollTrigger) {
    // Itt kell scrollTo(0) a megfelelő elemre!
  }
}, [resetScrollTrigger]);
```
- **Ha nincs, vagy nem a megfelelő elemre hívja, akkor nem lesz scroll reset.**
- Ha a ScrollContainer nem találja meg a scrollable elemet (pl. `.panelContent` vagy maga a wrapper), akkor a scroll reset nem működik.

### **B. A Panel → Content → ScrollContainer lánc helyes, csak a ScrollContainer-ben kell biztosítani, hogy:**
- A `resetScrollTrigger` változásakor mindig a megfelelő scrollable elemre hívja a `.scrollTo({top: 0})`-t.

---

## **4. Javasolt javítási lépések**

1. **ScrollContainer-ben:**
   - Ellenőrizd, hogy a `resetScrollTrigger` változásakor tényleg meghívja-e a scrollTo-t a scrollable elemre.
   - Ha többféle scrollable elem lehet (pl. `.panelContent`, `.videoPanel`, vagy maga a wrapper), akkor próbálja végig őket, és az első scrollable-re hívja meg a scrollTo-t.
   - Használhatod a `ScrollManager.performScroll({reason: 'pagination'})` utility-t is, hogy biztosan a jó elemre scrollozzon.

2. **Panel/Content/TabController-ben NEM kell változtatni, mert a callback lánc helyes.**

---

## **5. Példa ScrollContainer javításra**

```tsx
// ScrollContainer.tsx
import { ScrollManager } from './scrollManager';

useEffect(() => {
  if (resetScrollTrigger) {
    // Próbáljunk minden lehetséges scrollable elemre scrollozni
    ScrollManager.performScroll({ reason: 'pagination', behavior: 'auto' });
    // VAGY: ha van scrollableRef:
    // scrollableRef.current?.scrollTo({ top: 0, behavior: 'auto' });
  }
}, [resetScrollTrigger]);
```

---

## **6. Összefoglalás**

- **A Pagination komponens csak jelez, a scroll resetet a ScrollContainer végzi.**
- **A ScrollContainer-ben kell biztosítani, hogy oldalváltáskor (resetScrollTrigger változásakor) mindig a megfelelő scrollable elemre scrollTo(0) hívás történjen.**
- **A többi fájlban a callback lánc helyes, nem kell módosítani.**

---

**Ha kéred, megírom a konkrét ScrollContainer patch-et is!**  
Szólj, ha szeretnéd, hogy pontosan hogyan nézzen ki a scroll reset logika!
=================================================

