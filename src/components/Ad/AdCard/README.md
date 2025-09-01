# 🎥 AdCard Komponens

## 📋 Áttekintés

Az `AdCard` komponens család a Google AdSense integráció és reklám megjelenítés központi komponense. Több speciális komponensből áll: alap `AdCard`, `AdSenseUnit`, `AdSenseLayout` és segédfüggvények.

## 🎯 Cél

- **Google AdSense integráció** - Hivatalos AdSense Unit-ok
- **Reklám beszúrás** - Hírek közé automatikus reklámok
- **Performance optimalizáció** - Lazy loading és IntersectionObserver
- **Fejlesztői mock mód** - Development környezetben
- **Accessibility** - ARIA címkék és screen reader támogatás

## 📁 Fájl struktúra

```
src/components/Ad/AdCard/
├── AdCard.tsx                    # Alap reklám komponens
├── AdSenseUnit.tsx               # Google AdSense Unit
├── AdSenseLayout.tsx             # AdSense wrapper + badge
├── injectAdsIntoNewsItems.ts     # Reklám beszúrás logika
├── useIntersectionObserver.ts    # Lazy loading hook
├── AdCard.module.css             # Stílusok
├── index.ts                      # Exportálás
├── kódok.md                      # Fejlesztési dokumentáció
└── README.md                     # Dokumentáció
```

## 🔧 Komponensek

### AdCard (Alap Reklám)

**Cél:** Alap reklám komponens, fejlesztői mock mód támogatással.

#### Props

```typescript
interface AdCardProps {
  title: string;           // Reklám címe
  description: string;     // Reklám leírása
  imageUrl?: string;       // Kép URL-je (opcionális)
  advertiser: string;      // Hirdető neve
  clickUrl: string;        // Kattintásra navigáló URL
  badgeLabel?: string;     // Badge szöveg (alapértelmezett: "Hirdetés")
  onClick?: () => void;    // Kattintás eseménykezelő
}
```

#### Használat

```typescript
import { AdCard } from '@/components/Ad/AdCard';

<AdCard
  title="Premium News Access"
  description="Get unlimited access to premium news sources"
  imageUrl="/assets/images/premium-news.jpg"
  advertiser="News Reader Pro"
  clickUrl="https://example.com/premium"
  badgeLabel="Hirdetés"
  onClick={() => console.log('Ad clicked')}
/>
```

### AdSenseUnit (Google AdSense)

**Cél:** Hivatalos Google AdSense Unit komponens.

#### Props

```typescript
interface AdSenseUnitProps {
  slotId: string;                    // AdSense slot ID
  clientId?: string;                 // AdSense client ID
  format?: string;                   // Reklám formátum (alapértelmezett: 'auto')
  style?: React.CSSProperties;       // CSS stílusok
  responsive?: boolean;              // Reszponzív mód (alapértelmezett: true)
}
```

#### Használat

```typescript
import { AdSenseUnit } from '@/components/Ad/AdCard';

<AdSenseUnit
  slotId="1234567890"
  clientId="ca-pub-1234567890123456"
  format="auto"
  responsive={true}
  style={{ minHeight: 90 }}
/>
```

### AdSenseLayout (AdSense Wrapper)

**Cél:** AdSense Unit wrapper badge-gel, debug és fallback támogatással.

#### Props

```typescript
interface AdSenseLayoutProps {
  slotId: string;                    // AdSense slot ID
  clientId?: string;                 // AdSense client ID
  format?: string;                   // Reklám formátum
  style?: React.CSSProperties;       // CSS stílusok
  responsive?: boolean;              // Reszponzív mód
  showBadge?: boolean;              // Badge megjelenítése
  badgeLabel?: string;              // Badge szöveg
  debug?: boolean;                  // Debug mód
  fallback?: React.ReactNode;       // Fallback tartalom
}
```

#### Használat

```typescript
import { AdSenseLayout } from '@/components/Ad/AdCard';

<AdSenseLayout
  slotId="1234567890"
  showBadge={true}
  badgeLabel="Hirdetés"
  debug={process.env.NODE_ENV === 'development'}
  fallback={<div>Loading...</div>}
/>
```

## 🔄 Reklám Beszúrás

### injectAdsIntoNewsItems

**Cél:** Automatikus reklám beszúrás hírek közé.

#### Típusok

```typescript
type AdProvider = 'adsense' | 'custom' | 'promo' | 'mock';

interface AdCardItem {
  type: 'ad';
  adProvider: AdProvider;
  id: string;
  title: string;
  description: string;
  imageUrl?: string;
  advertiser: string;
  clickUrl: string;
  slotId?: string; // csak AdSense-hez
}
```

#### Használat

```typescript
import { injectAdsIntoNewsItems } from '@/components/Ad/AdCard';

const newsWithAds = injectAdsIntoNewsItems(
  newsItems,
  4,  // minFrequency - minimum hírek reklámok között
  7   // maxFrequency - maximum hírek reklámok között
);
```

## 🎨 Stílusok

### AdCard CSS osztályok

```css
.adCardContainer {
  /* Fő konténer */
}

.adBadge {
  /* Badge stílus */
}

.adCardLink {
  /* Link stílus */
}

.adCardImage {
  /* Kép stílus */
}

.adCardContent {
  /* Tartalom konténer */
}

.adCardTitle {
  /* Cím stílus */
}

.adCardDescription {
  /* Leírás stílus */
}

.adCardAdvertiser {
  /* Hirdető stílus */
}
```

### Mock mód stílusok

```css
.mockAdCard {
  /* Fejlesztői mock reklám */
}

.mockAdBadge {
  /* Mock badge */
}

.mockAdContent {
  /* Mock tartalom */
}
```

## 🚀 Performance Optimalizáció

### IntersectionObserver Hook

```typescript
import { useIntersectionObserver } from '@/components/Ad/AdCard';

const [containerRef, isVisible] = useIntersectionObserver<HTMLDivElement>({ 
  threshold: 0.25 
});
```

### Lazy Loading

- **AdSense Unit-ok** csak akkor töltődnek be, ha láthatóak
- **Skeleton placeholder** - Layout ugrálás megelőzése
- **IntersectionObserver** - Viewport alapú betöltés

## 🔧 Fejlesztői Mód

### Mock Reklámok

```typescript
// Development környezetben
if (process.env.NODE_ENV !== 'production') {
  return (
    <div className={styles.mockAdCard}>
      <span className={styles.mockAdBadge}>{badgeLabel}</span>
      <div className={styles.mockAdContent}>
        <p>Ez egy fejlesztői mock hirdetés.</p>
        <p><b>{title}</b></p>
        <p>{description}</p>
      </div>
    </div>
  );
}
```

### Debug Mód

```typescript
<AdSenseLayout
  slotId="1234567890"
  debug={true}
  // Debug információ megjelenik
/>
```

## 📊 AdSense Integráció

### Teszt Client ID

```typescript
// Google hivatalos teszt AdSense client ID
const TEST_AD_CLIENT = 'ca-pub-3940256099942544';
```

### AdSense Script Betöltés

```typescript
// App.tsx-ben vagy index.html-ben
<script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-1234567890123456"></script>
```

### Slot ID-k

```typescript
// Példa slot ID-k
const SLOTS = {
  NEWS_INLINE: '1234567890',
  SIDEBAR_COMPACT: '2345678901',
  VIDEO_INLINE: '3456789012',
  STICKY_BOTTOM: '4567890123'
};
```

## 🔗 Kapcsolódó komponensek

- [`SideAd`](../SideAd/) - Oldalsáv reklámok
- [`UtilityAdCard`](../UtilityAdCard/) - Utility panel reklámok
- [`VideoAd`](../VideoAd/) - Videó reklámok

## 📝 Megjegyzések

- **Google AdSense szabályoknak megfelelő** - Policy-k betartása
- **Accessibility** - ARIA címkék és screen reader támogatás
- **Performance** - Lazy loading és IntersectionObserver
- **SEO** - Alt szövegek és meta adatok
- **Debug** - Fejlesztői mock és debug módok

## 🧪 Tesztelés

### AdCard teszt

```typescript
<AdCard
  title="Test Advertisement"
  description="This is a test advertisement"
  advertiser="Test Advertiser"
  clickUrl="https://test.com"
  badgeLabel="Test"
  onClick={() => console.log('Test ad clicked')}
/>
```

### AdSenseLayout teszt

```typescript
<AdSenseLayout
  slotId="1234567890"
  showBadge={true}
  badgeLabel="Hirdetés"
  debug={true}
  fallback={<div>Loading advertisement...</div>}
/>
```

### Reklám beszúrás teszt

```typescript
const testNews = [
  { id: '1', title: 'News 1' },
  { id: '2', title: 'News 2' },
  { id: '3', title: 'News 3' },
  { id: '4', title: 'News 4' },
  { id: '5', title: 'News 5' },
];

const newsWithAds = injectAdsIntoNewsItems(testNews, 2, 3);
console.log(newsWithAds);
// Eredmény: [News1, News2, Ad, News3, News4, Ad, News5]
```

---

**Utolsó frissítés:** 2024
**Verzió:** 1.0.0
**Fejlesztő:** News Reader Team
