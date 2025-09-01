# Keresési találatok fejlesztett megjelenítése - Tervezési javaslat

A probléma és a javasolt megoldás elemzése alapján egy olyan hibrid megközelítést terveznék, amely kombinálja a jelenlegi oldalsáv kereső előnyeit egy rugalmasabb, másodlagos keresési nézettel. Ez lehetővé tenné a hosszabb találati listák kényelmes áttekintését.

## Javasolt módosítások a keresési felületen

### 1. Találati fejléc újratervezése

**Jelenlegi:**

```
Találatok (189)
```

**Javasolt új elrendezés:**

```
Találatok (189) [Részletes nézet ➔]
```

- A "Találatok (189)" szöveg kisebb betűmérettel (`font-size: var(--font-size-sm)`)
- Mellette egy "Részletes nézet" gomb, jobb oldalra igazítva, nyíl ikonnal
- A gomb stílusa harmonizál az alkalmazás többi elemével (szín, árnyékolás, stb.)

### 2. Új komponens: Kiterjesztett keresési nézet

Amikor a felhasználó a "Részletes nézet" gombra kattint:

1. A főtartalom jobb oldalra csúszik, animációval (`transform: translateX(300px); transition: transform 0.3s ease;`)
2. A sidebar és a főtartalom közti területen megjelenik a kiterjesztett keresési találati lista
3. Ez a terület alapértelmezetten 300px széles, de átméretezhető (resize handle)
4. A találatok teljes magasságban görgethetők (nem korlátozott height)

### 3. Vizuális kialakítás

- A kiterjesztett keresési nézet háttérszíne különbözzön enyhén mindkét oldali paneltől
- Felül egy fejléc "Keresési találatok" címmel és egy "×" bezárás gombbal
- Alatta a keresőmező, a jelenlegi keresés ismételt megjelenítésével
- Kibővített szűrési lehetőségek (nyelv, dátum, forrás)
- A találatok nagyobb kártyákon jelennek meg, több információt mutatva

### 4. Interakció a főtartalommal

A különálló keresési nézetben:

- A találatokra kattintva a hír a főtartalomban jelenik meg, nem új ablakban
- A kiválasztott hírt vizuálisan kiemeljük a találati listában (active state)
- A főtartalom visszacsúszik eredeti helyére, ha a felhasználó bezárja a kiterjesztett keresést

## CSS módosítási javaslatok

Új stílusokra van szükség a következő elemekhez:

```css
/* Új 'Részletes nézet' gomb a találati fejlécben */
.detailedSearchButton {
  font-size: var(--font-size-xs);
  background: transparent;
  border: 1px solid var(--color-border);
  border-radius: var(--border-radius-sm);
  padding: 2px 8px;
  color: var(--color-text-secondary);
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 4px;
}

/* Kiterjesztett keresési nézet konténer */
.expandedSearchContainer {
  width: 0;
  overflow: hidden;
  background-color: var(--color-panel-expanded-search);
  transition: width 0.3s ease;
  border-right: 1px solid var(--color-border);
  display: flex;
  flex-direction: column;
}

.expandedSearchContainer.visible {
  width: 300px; /* Alapértelmezett szélesség */
}

/* Főtartalom animálása */
.mainContent {
  transition: transform 0.3s ease;
}

.mainContent.shifted {
  transform: translateX(300px);
}
```

## Előnyök

1. **Megőrizzük a gyors keresést** az oldalsávban
2. **Kiterjesztett nézet** biztosítja a teljes találati lista áttekintését
3. **Minimális navigációváltás** - nem kell külön oldalra menni
4. **Responsive működés** - mobilon a kiterjesztett nézet teljes képernyős lehet
5. **Jobb UX** - a hírek az alkalmazáson belül jelennek meg

Ez a megoldás kiegyensúlyozottan kezeli a helyhiányt, miközben rugalmas használatot biztosít a felhasználók számára.

==========================================
