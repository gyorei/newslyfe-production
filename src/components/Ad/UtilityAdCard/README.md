# 🎥 UtilityAdCard Komponens

## 📋 Áttekintés

A `UtilityAdCard` komponens a Utility panel reklám megjelenítéséért felelős. Ez a komponens különbözik a fő `AdCard` komponenstől, mivel specifikusan a Utility panel környezetéhez van optimalizálva.

## 🎯 Cél

- **Utility panel reklámok** megjelenítése
- **Egyszerű, tiszta design** a Utility környezethez
- **Kattinthatóság** és **hover effektek**
- **Responsive design** támogatás

## 📁 Fájl struktúra

```
src/components/Ad/UtilityAdCard/
├── UtilityAdCard.tsx          # Fő komponens
├── UtilityAdCard.module.css   # Stílusok
├── index.ts                   # Exportálás
└── README.md                  # Dokumentáció
```

## 🔧 Használat

### Importálás

```typescript
import { UtilityAdCard } from '@/components/Ad/UtilityAdCard';
// vagy
import { UtilityAdCard } from '@/components/Ad';
```

### Props

```typescript
interface UtilityAdCardProps {
  title: string;           // Reklám címe
  description?: string;    // Reklám leírása (opcionális)
  imageUrl?: string;       // Kép URL-je (opcionális)
  linkUrl?: string;        // Kattintásra navigáló URL (opcionális)
  sponsor?: string;        // Szponzor neve (opcionális)
  onClick?: () => void;    // Kattintás eseménykezelő (opcionális)
}
```

### Példa használat

```typescript
<UtilityAdCard
  title="Premium News Access"
  description="Get unlimited access to premium news sources with our subscription plan."
  imageUrl="/assets/images/premium-news.jpg"
  linkUrl="https://example.com/premium"
  sponsor="News Reader Pro"
  onClick={() => console.log('Premium ad clicked')}
/>
```

## 🎨 Stílusok

### Főbb CSS osztályok

- `.utilityAdCardContainer` - Fő konténer
- `.utilityAdImageContainer` - Kép konténer
- `.utilityAdContent` - Tartalom konténer
- `.utilityAdTitle` - Cím stílus
- `.utilityAdDescription` - Leírás stílus
- `.utilityAdSponsor` - Szponzor stílus

### Támogatott funkciók

- ✅ **Hover effektek** - Lift animáció
- ✅ **Dark mode** támogatás
- ✅ **Responsive design** - Mobilbarát
- ✅ **Smooth transitions** - Animációk

## 🔄 Különbségek az AdCard-tól

| Tulajdonság | UtilityAdCard | AdCard |
|-------------|---------------|--------|
| **Cél** | Utility panel | Google AdSense |
| **Props** | `linkUrl`, `sponsor` | `clickUrl`, `advertiser`, `badgeLabel` |
| **Design** | Egyszerű, tiszta | AdSense specifikus |
| **Funkció** | Utility reklámok | Hírek közötti reklámok |

## 🚀 Fejlesztés

### Új funkció hozzáadása

1. **Props bővítése** - `UtilityAdCardProps` interface módosítása
2. **Komponens frissítése** - `UtilityAdCard.tsx` módosítása
3. **Stílusok hozzáadása** - `UtilityAdCard.module.css` frissítése
4. **Dokumentáció** - README.md frissítése

### Tesztelés

```typescript
// Példa teszt
<UtilityAdCard
  title="Test Ad"
  description="This is a test advertisement"
  imageUrl="/test-image.jpg"
  linkUrl="https://test.com"
  sponsor="Test Sponsor"
  onClick={() => console.log('Test ad clicked')}
/>
```

## 📝 Megjegyzések

- **Google szabályoknak megfelelő** - AdSense policy-k betartása
- **Accessibility** - ARIA címkék és keyboard navigáció
- **Performance** - Lazy loading és optimalizált képek
- **SEO** - Alt szövegek és meta adatok

## 🔗 Kapcsolódó komponensek

- [`AdCard`](../AdCard/) - Fő reklám komponens
- [`VideoAd`](../VideoAd/) - Videó reklámok
- [`SideAd`](../SideAd/) - Oldalsáv reklámok

---

**Utolsó frissítés:** 2024
**Verzió:** 1.0.0
**Fejlesztő:** News Reader Team
