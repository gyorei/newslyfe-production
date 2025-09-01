# Javaslat a Content komponens és hook-ok átszervezésére

A Content komponens valóban túl nagy (557 sor), ami megnehezíti a karbantarthatóságot. A hook-ok kiszervezése jó irány, de érdemes áttekinteni, hogyan oszthatnánk fel logikusabban a felelősségi köröket.

## Jelenlegi helyzet értékelése

A Content komponens túl sok felelősséggel rendelkezik:

- Tab tartalom betöltése/mentése
- Hírek betöltése
- Görgetés kezelése
- Menük kezelése
- UI megjelenítés
- Állapotkezelés több területen

Az aktuális hook-ok:

- `useTabPersistence` - Tab állapot kezelése
- `useTabPerformance` - Teljesítménymérés
- `useNewsData` - Hírek betöltése és kezelése
- `useCategoryFilter` - Hírek szűrése
- `useBasicState` - Alapvető állapotkezelés
- `NewsContext` - Hírek kontextus

## Javasolt átszervezési terv

### 1. Felület komponensek leválasztása

A UI részeket érdemes önálló komponensekbe kiszervezni:

```
src/
  components/
    Content/
      components/
        ContentHeader.tsx       # Fejléc, frissítés gomb
        ContentBody.tsx         # Fő tartalom konténer
        ContentLoadingState.tsx # Betöltési állapotok megjelenítése
        ContentMenu.tsx         # Menü kezelése
```

### 2. Az üzleti logikák jobb szétválasztása

A hook-okat logikai egységekre bonthatjuk:

```
src/
  components/
    Content/
      hooks/
        useContentLifecycle.ts  # Betöltés/mentés ciklus kezelése
        useMenuActions.ts       # Menü műveletek
        useScrollHandling.ts    # Görgetés kezelés és betöltés
        useContentVisuals.ts    # Vizuális effektek, átmenetek
```

### 3. A useNewsData hook felosztása

A useNewsData hook túl sok funkcióval rendelkezik, érdemes felosztani:

```
src/
  hooks/
    news/
      useNewsLoader.ts     # Hírek betöltése
      useNewsFiltering.ts  # Hírek szűrése
      useNewsActions.ts    # Műveletek hírekkel (mentés, megosztás)
```

### 4. Context API hatékonyabb használata

A NewsContext helyett egy átfogóbb kontextus-rendszert javaslok:

```
src/
  contexts/
    AppStateContext.tsx    # Alkalmazás állapot (tabok, aktív tab)
    NewsContext.tsx        # Hírek adatok és kezelésük
    UIContext.tsx          # UI állapotok (betöltés, hiba, stb.)
```

## Konkrét felosztási javaslat a Content.tsx komponensre

1. **ContentContainer**: A fő komponens, ami összeköti a többit (~100 sor)
   - Használja a kontextusokat és hook-okat
   - Csak a magas szintű állapot menedzsmentet végzi

2. **TabContentRenderer**: Tab típus szerinti megjelenítés (~80 sor)
   - Új tab, search tab, hír tab megjelenítése
   - A megfelelő komponens kiválasztása és megjelenítése

3. **NewsPanel**: A hírek panel komponens (~100 sor)
   - A Panel használata és a szükséges prop-ok átadása
   - Load more funkció kezelése

4. **MenuHandler**: Menü kezelés (~80 sor)
   - Menu állapot és műveletek
   - CardMoreMenu megjelenítése

5. **ContentEffects**: Az useEffect-ek külön komponensbe (~150 sor)
   - Betöltés, mentés, scrollozás effektek
   - Teljesítménymérés

## Implementációs stratégia

1. **Első fázis**: A nagy komponens felosztása logikai blokkonként
   - Készíteni kisebb komponenseket a UI részekhez
   - A jelenlegi hook-ok változatlanul hagyása

2. **Második fázis**: A hook-ok átszervezése
   - Az üzleti logika jobb felosztása
   - Az állapotkezelés egyszerűsítése

3. **Harmadik fázis**: Context API bevezetése
   - A prop drilling csökkentése
   - A globális állapotkezelés hatékonyabb megvalósítása

## Ez a megközelítés fokozatosan csökkenti a Content komponens komplexitását, miközben megőrzi a jelenlegi működést és javítja a kód karbantarthatóságát.

# Következő lépések a Content komponens refaktorálásában

Remek, hogy a CardMoreMenu kezelésének kiszervezése sikeresen megtörtént! A News Menu Handler mostantól önálló modulként kezeli a menüvel kapcsolatos funkciókat, így a Content komponens kódja tisztább és fókuszáltabb lett.

## Melyik következzen?

A következő leglogikusabb lépés olyan funkció kiszervezése lenne, ami:

1. Viszonylag önálló
2. Nem túl bonyolult
3. De jelentős kódmennyiséget eltávolítana a Content komponensből

Ezek alapján javaslataim:

### 1. LoadMoreButton komponens (Prioritás: Magas)

- **Jelenlegi hely**: Content.tsx-ben a `renderLoadMoreButton` függvény
- **Célhely**: `src\components\Panel\LoadMoreButton.tsx`
- **Előny**: Egyszerű, önálló UI komponens logikával, könnyen kiszervezhető
- **Kód mennyiség**: ~15 sor

### 2. Frissítés gomb (RefreshButton) (Prioritás: Magas)

- **Jelenlegi hely**: Content.tsx-ben a `handleManualRefresh` függvény és a JSX-ben a gomb
- **Célhely**: `src\components\UI\RefreshControl\RefreshButton.tsx`
- **Előny**: Önálló UI komponens, saját logikával
- **Kód mennyiség**: ~20 sor

### 3. Cache statisztikák komponens (Prioritás: Közepes)

- **Jelenlegi hely**: Content.tsx-ben a cache statisztikák JSX kódja
- **Célhely**: `src\components\debug\CacheStatistics.tsx`
- **Előny**: Tisztán debug célú, könnyen kiszervezhető
- **Kód mennyiség**: ~10 sor

### 4. Betöltési állapotok kezelése (Prioritás: Közepes)

- **Jelenlegi hely**: Content.tsx-ben a betöltési indikátorok JSX kódja
- **Célhely**: `src\components\UI\LoadingStates\ContentLoading.tsx`
- **Előny**: Tisztán UI elem, nem tartalmaz üzleti logikát
- **Kód mennyiség**: ~20 sor

Azt javaslom, hogy először a LoadMoreButton-t vagy a RefreshButton komponenst szervezzük ki, mivel ezek tisztán elkülönülnek a főkódtól és könnyen migrálhatók. Ezek sikeres kiszervezése után haladhatunk a bonyolultabb funkciók (adatbetöltés, görgetés kezelés) felé.

# Melyiket választod a felsoroltak közül a következő lépéshez?
