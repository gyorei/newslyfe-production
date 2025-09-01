# Kereső Komponens (`src/components/Side/Search`)

Ez a mappa tartalmazza a keresési funkcióhoz kapcsolódó React komponenseket. A kereső lehetővé teszi a felhasználók számára, hogy kulcsszavak alapján tartalmakat keressenek az alkalmazásban.

## Komponensek

### 1. `Search.tsx`

Ez a fő komponens, amely magába foglalja a keresési beviteli mezőt és a keresési eredmények legördülő listáját.

**Működés:**

- **Állapotkezelés:** A `useSearch` hookot használja a keresési logika (keresési kifejezés, eredmények, betöltési állapot, hibaüzenetek, lapozás) kezelésére.
- **Beviteli Mező:**
  - A felhasználó gépelésekor a `handleSearchChange` függvény frissíti a `searchTerm` állapotot a `useSearch` hookon keresztül.
  - Ha a keresési kifejezés nem üres, a keresési eredmények legördülő listája (`searchResultsDropdown`) megjelenik (`isExpanded` állapot).
  - Fókusz esetén (`onFocus`), ha van már keresőszó vagy eredmény, a legördülő szintén megjelenik.
  - A keresési kifejezés törölhető a "✕" gombbal (`handleClearSearch`).
- **Keresés Indítása:**
  - A keresés automatikusan elindul, amint a `searchTerm` megváltozik (a `useSearch` hook `useEffect`-je által).
  - A `Submit` gombra (🔍) vagy Enter leütésére a `handleSearchSubmit` függvény hívódik meg, ami alapvetően csak biztosítja, hogy a legördülő nyitva legyen, ha van keresőszó.
- **Eredmények Megjelenítése:**
  - Ha a `isExpanded` igaz, a `searchResultsDropdown` div jelenik meg.
  - Betöltés közben (`loading` állapot) egy "Keresés..." üzenet látható.
  - Hiba esetén (`error` állapot) hibaüzenet jelenik meg.
  - Sikeres keresés esetén a `SearchResults` komponenst jeleníti meg az eredményekkel.
  - Ha nincs találat, "Nincs találat." üzenet jelenik meg.
- **Részletes Keresés:**
  - A `handleOpenDetailedView` (memoizált `useCallback`-kel) felelős a "Részletes keresés" fül megnyitásáért. Ezt a függvényt a `SearchResults` komponens kapja meg propként.

### 2. `useSearch.ts`

Ez egy egyéni React hook, amely a keresési logika nagy részét tartalmazza.

**Működés:**

- **Állapotok:**
  - `searchTerm`: Az aktuális keresési kifejezés.
  - `results`: A keresési találatok listája.
  - `total`: Az összes találat száma (lapozáshoz).
  - `loading`: Logikai érték, ami jelzi, hogy a keresés folyamatban van-e.
  - `error`: Hibaüzenet string, ha a keresés során hiba történt.
  - `page`: Az aktuális oldalszám.
  - `limit`: Egy oldalon megjelenítendő találatok száma (konstans, jelenleg 10).
- **`performSearch` Függvény:**
  - `useCallback`-be csomagolt aszinkron függvény, amely végrehajtja az API hívást a `/api/search` végpontra.
  - Paraméterként megkapja a keresési kifejezést (`query`) és az oldalszámot (`pageNum`).
  - Beállítja a `loading` állapotot, kezeli a választ, és frissíti a `results`, `total`, `page` állapotokat, vagy beállítja az `error` állapotot hiba esetén.
  - Ha a `query` üres, törli az eredményeket és a `total`-t.
- **`useEffect` Hookok:**
  - **Első `useEffect` (üres függőségi tömbbel):**
    - Komponens csatolásakor (mount) lefut.
    - Ellenőrzi, hogy van-e `q` paraméter az URL-ben.
    - Ha van, beállítja a `searchTerm`-et és a `page`-et 1-re, hogy a kezdeti keresés az első oldallal induljon.
  - **Második `useEffect` (`[searchTerm, page, performSearch]` függőségekkel):**
    - Akkor fut le, ha a `searchTerm`, `page` vagy a `performSearch` (stabil referencia a `useCallback` miatt) megváltozik.
    - Ha a `searchTerm` nem üres, meghívja a `performSearch` függvényt az aktuális `searchTerm`-mel és `page`-dzsel.
    - Ha a `searchTerm` üres, törli az eredményeket.
- **Visszatérési Értékek:** Visszaadja az állapotokat és a `setSearchTerm`, `setPage`, `performSearch` (memoizált) és `limit` értékeket.

### 3. `SearchResults.tsx`

Ez a komponens felelős a keresési eredmények listájának és a lapozásnak a megjelenítéséért.

**Működés:**

- **Propek:** Megkapja a `results`, `total`, `page`, `limit`, `setPage` (az oldalszám beállításához) és `onOpenDetailedView` (a részletes nézet megnyitásához) propokat.
- **Találatok Száma és "Részletes nézet" Gomb:** Megjeleníti az összes találat számát és a "Részletes nézet" gombot (ha az `onOpenDetailedView` prop meg van adva).
- **Találati Lista:**
  - Ha vannak eredmények (`results.length > 0`), akkor egy `ul` listában jeleníti meg őket.
  - Minden egyes találatot a `SearchResultItem` komponens renderel.
- **Lapozás:**
  - Ha több oldalnyi találat van (`total > 0`), akkor a `SearchPagination` komponenst jeleníti meg.

### 4. `SearchResultItem.tsx`

Ez a komponens egyetlen keresési találat megjelenítéséért felelős.

**Működés:**

- **Prop:** `result` objektumot kap, ami egy keresési találatot reprezentál (`id`, `title`, `url`, `created_at`, `language`, `source`, `sourceIcon`, `country`).
- **Megjelenítés:**
  - Megjeleníti a találat címét (linkként az eredeti URL-re).
  - Megjeleníti a forrás faviconját (`getDeterministicFaviconUrl` és fallback logika segítségével).
  - Megjeleníti a forrás nevét és a találat relatív idejét (`getSourceInfo` és `formatRelativeTime` segítségével).
  - Tartalmaz egy "További lehetőségek" (három pont) gombot, amelynek funkcionalitása később implementálható.

### 5. `SearchPagination.tsx`

Ez a komponens a lapozó vezérlők (oldalszámok, "Előző", "Következő" gombok) megjelenítéséért felelős.

**Működés:**

- **Propek:** `total` (összes találat), `page` (aktuális oldal), `limit` (elem/oldal), `onPageChange` (függvény az oldalváltás kezelésére).
- **Logika:**
  - Kiszámolja a `totalPages`-t.
  - Ha csak egy oldal van vagy nincs találat, nem jelenít meg semmit.
  - `renderPageNumbers` függvény:
    - Logikát tartalmaz arra, hogy mely oldalszámokat jelenítse meg (maximum `maxVisiblePages`, jelenleg 5).
    - Kezeli az "első oldal", "utolsó oldal" és az ellipsis (...) megjelenítését, ha túl sok oldal van.
  - Megjeleníti az "Előző" és "Következő" gombokat, amelyek az `onPageChange` függvényt hívják meg a megfelelő új oldalszámmal.

## Adatfolyam és Interakciók

1.  **Keresés Indítása:**
    - Felhasználó gépel a `Search.tsx` input mezőjébe.
    - `Search.tsx` -> `setSearchTerm` (a `useSearch` hookból).
    - `useSearch` hook: `searchTerm` változik -> `useEffect` lefut -> `performSearch` meghívódik.
    - `performSearch`: API hívás -> `results`, `total`, `page` állapotok frissülnek.
2.  **Lapozás:**
    - Felhasználó kattint egy oldalszámra vagy a "Következő"/"Előző" gombra a `SearchPagination.tsx`-ben.
    - `SearchPagination.tsx` -> `onPageChange(newPage)` (ami a `SearchResults.tsx`-en keresztül a `useSearch` `setPage` függvénye).
    - `useSearch` hook: `page` állapot változik -> `useEffect` lefut -> `performSearch` meghívódik az új oldalszámmal.
3.  **Részletes Keresés Megnyitása:**
    - Felhasználó kattint a "Részletes nézet" gombra a `SearchResults.tsx`-ben.
    - `SearchResults.tsx` -> `onOpenDetailedView()` (ami a `Search.tsx`-ből átadott `handleOpenDetailedView` függvény).
    - `Search.tsx` -> `handleOpenDetailedView` -> `onSearchTabOpen(searchTerm)` (ha van ilyen prop, pl. az `App.tsx`-ből).

## CSS Modulok

- `Search.module.css`: Specifikus stílusok a kereső komponensekhez.
- `Side.module.css`: Általánosabb stílusok az oldalsáv komponenseihez (pl. görgethetőség).

Ez a struktúra lehetővé teszi a keresési funkció áttekinthető és karbantartható implementációját, a felelősségi körök logikus szétválasztásával a komponensek és a hook között.
