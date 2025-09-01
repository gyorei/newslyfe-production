# 🎥 SideAd Komponens

## 📋 Áttekintés

A `SideAd` komponens család az oldalsáv (sidebar) reklámok megjelenítéséért felelős. Két fő komponensből áll: `SideAd` (kompakt reklámok) és `SideAdSticky` (ragadós reklámok).

## 🎯 Cél

- **Oldalsáv reklámok** megjelenítése
- **Dinamikus pozicionálás** keresési eredmények és országok alatt
- **Sticky reklámok** az oldal alján
- **Google AdSense integráció** és analytics

## 📁 Fájl struktúra

```
src/components/Ad/SideAd/
├── SideAd.tsx                    # Kompakt oldalsáv reklám
├── SideAdSticky.tsx              # Ragadós reklám (sticky)
├── SideAd.module.css             # Kompakt reklám stílusok
├── SideAdSticky.module.css       # Sticky reklám stílusok
├── index.ts                      # Exportálás
├── kódok.md                      # Fejlesztési dokumentáció
└── README.md                     # Dokumentáció
```

## 🔧 Komponensek

### SideAd (Kompakt Reklám)

**Cél:** Kompakt reklámok az oldalsávban, keresési eredmények vagy országok alatt.

#### Props

```typescript
interface SideAdProps {
  isSearchActive?: boolean;        // Keresés aktív-e
  searchResults?: string[];        // Keresési eredmények
  position: 'below-countries' | 'below-search-results';  // Pozíció
  activeLetter?: string;           // ABC kereső aktív betűje
}
```

#### Használat

```typescript
import { SideAd } from '@/components/Ad/SideAd';

<SideAd
  position="below-countries"
  activeLetter="H"
  isSearchActive={false}
  searchResults={[]}
/>
```

### SideAdSticky (Ragadós Reklám)

**Cél:** Ragadós reklám az oldal alján, bezárható és visszavonható.

#### Funkciók

- ✅ **Sticky pozicionálás** - Oldal alján ragad
- ✅ **Bezárható** - Felhasználó bezárhatja
- ✅ **Visszavonható** - Toast üzenet "Undo" gombbal
- ✅ **Info modal** - "Why am I seeing this ad?"
- ✅ **LocalStorage** - Bezárási állapot mentése
- ✅ **Analytics** - Kattintások és események követése

#### Használat

```typescript
import { SideAdSticky } from '@/components/Ad/SideAd';

<SideAdSticky />
```

## 🎨 Stílusok

### SideAd (Kompakt)

```css
.sideAdCompact {
  margin: 8px 12px;
  height: 60px;
  border-radius: 4px;
  background-color: var(--color-surface);
  border: 1px solid var(--color-border);
}

.belowSearchResults {
  margin-top: 6px;
  margin-bottom: 8px;
}

.belowCountries {
  margin-top: 16px;
  margin-bottom: 12px;
}
```

### SideAdSticky (Ragadós)

```css
.stickyWrapper {
  position: sticky;
  bottom: 0;
  width: 92%;
  max-width: 300px;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.08);
}

.closeButton {
  position: absolute;
  top: 8px;
  right: 8px;
  font-size: 18px;
  color: #aaa;
}
```

## 🔄 Dinamikus Ad Slots

### ABC Kereső Integráció

```typescript
// Dinamikus ad slot ABC betű alapján
const adSlot = activeLetter 
  ? `sidebar-compact-${activeLetter.toLowerCase()}` 
  : 'sidebar-compact';
```

### Pozíció Alapú Slots

- `sidebar-compact` - Alapértelmezett
- `sidebar-compact-a` - A betű aktív
- `sidebar-compact-h` - H betű aktív
- `sidebar-sticky` - Ragadós reklám

## 📊 Analytics és Események

### Követett események

```typescript
// SideAdSticky események
trackAdEvent('sticky_ad_closed', { slot: 'sidebar-sticky' });
trackAdEvent('sticky_ad_undo', { slot: 'sidebar-sticky' });
trackAdEvent('sticky_ad_info_open', { slot: 'sidebar-sticky' });
trackAdEvent('sticky_ad_info_close', { slot: 'sidebar-sticky' });
```

### Console logok

```typescript
// SideAd események
console.log(`[SideAd] Hírdetés látható: ${position}, betű: ${activeLetter || 'none'}`);
console.log(`[SideAd] Hírdetés kattintás: ${position}, betű: ${activeLetter || 'none'}`);
```

## 🚀 Fejlesztés

### Új pozíció hozzáadása

1. **Props bővítése** - `SideAdProps.position` enum módosítása
2. **CSS osztály** - Új pozíció stílus hozzáadása
3. **Ad slot** - Új slot név definiálása
4. **Tesztelés** - Pozíció specifikus teszt

### Új sticky funkció

1. **State kezelés** - Új useState hook
2. **Event handler** - Új onClick/onChange
3. **Analytics** - Új trackAdEvent hívás
4. **LocalStorage** - Új kulcs definiálása

## 📱 Responsive Design

### Mobil optimalizáció

```css
@media (max-width: 768px) {
  .sideAdCompact {
    margin: 6px 8px;
    height: 50px;
  }
  
  .stickyWrapper {
    width: 98%;
    max-width: 100%;
    padding: 4px 0;
  }
}
```

### Dark Mode

```css
.app.dark .sideAdCompact {
  background-color: var(--color-panel-left);
  border-color: var(--color-panel-border);
}

.app.dark .stickyWrapper {
  background: var(--color-panel-left, #222);
  box-shadow: 0 2px 8px rgba(0,0,0,0.18);
}
```

## 🔗 Kapcsolódó komponensek

- [`AdCard`](../AdCard/) - Alap reklám komponens
- [`UtilityAdCard`](../UtilityAdCard/) - Utility panel reklámok
- [`VideoAd`](../VideoAd/) - Videó reklámok

## 📝 Megjegyzések

- **Google AdSense szabályoknak megfelelő** - Policy-k betartása
- **Accessibility** - ARIA címkék és keyboard navigáció
- **Performance** - Lazy loading és optimalizált render
- **UX** - Bezárható reklámok és visszavonás
- **Analytics** - Részletes eseménykövetés

## 🧪 Tesztelés

### SideAd teszt

```typescript
<SideAd
  position="below-countries"
  activeLetter="H"
  isSearchActive={false}
  searchResults={[]}
/>
```

### SideAdSticky teszt

```typescript
<SideAdSticky />
// Tesztelendő funkciók:
// - Bezárás és visszavonás
// - Info modal megnyitása
// - LocalStorage mentés
// - Analytics események
```

---

**Utolsó frissítés:** 2024
**Verzió:** 1.0.0
**Fejlesztő:** News Reader Team
