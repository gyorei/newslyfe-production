# SearchModeToggles

Ez a komponens a bal oldali szűrőpanel keresési mód-választó gombjait jeleníti meg.

## Funkció
- A felhasználó kiválaszthatja, hogy ország, forrás (hírportál), vagy YouTube-csatorna szerint szeretne szűrni.
- Jelenleg csak az ország (Country) gomb aktív, a többi szürke, nem kattintható.
- A kiválasztott keresési mód vizuálisan kiemelt (zöld keret).
- A választás eseményt vált ki, amit a szülő komponens kezel.

## Props
- `activeSearchMode`: `'country' | 'source' | 'channel'` – az aktuálisan kiválasztott keresési mód
- `onSearchModeChange`: `(mode: 'country' | 'source' | 'channel') => void` – callback a módváltásra

## Használat
```tsx
<SearchModeToggles
  activeSearchMode="country"
  onSearchModeChange={handleSearchModeChange}
/>
```