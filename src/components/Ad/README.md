# 🎥 Ad Komponensek - Reklám Rendszer

## 📋 Áttekintés

Az `Ad` komponens család a News Reader alkalmazás teljes reklám rendszerét tartalmazza. Google AdSense integrációval, különböző pozíciókban és formátumokban jelenít meg reklámokat.

## 🎯 Cél

- **Google AdSense integráció** - Hivatalos AdSense Unit-ok
- **Különböző pozíciók** - Hírek, videók, oldalsáv, utility panel
- **Performance optimalizáció** - Lazy loading és IntersectionObserver
- **Google szabályoknak megfelelő** - Policy-k betartása
- **Fejlesztői támogatás** - Mock reklámok és debug módok

## 📁 Komponens Struktúra

```
src/components/Ad/
├── AdCard/                    # 🎯 Központi reklám komponens
│   ├── AdCard.tsx            # Alap reklám komponens
│   ├── AdSenseUnit.tsx       # Google AdSense Unit
│   ├── AdSenseLayout.tsx     # AdSense wrapper + badge
│   ├── injectAdsIntoNewsItems.ts  # Hírek közé reklám beszúrás
│   └── useIntersectionObserver.ts # Lazy loading hook
├── SideAd/                    # 📱 Oldalsáv reklámok
│   ├── SideAd.tsx            # Kompakt oldalsáv reklám
│   ├── SideAdSticky.tsx      # Ragadós reklám (sticky)
│   └── SideAdSticky.module.css
├── UtilityAdCard/             # 🛠️ Utility panel reklámok
│   ├── UtilityAdCard.tsx     # Utility specifikus reklám
│   └── UtilityAdCard.module.css
├── VideoAd/                   # 🎥 Videó reklámok
│   ├── VideoAd.tsx           # Egyszerű videó reklám
│   ├── VideoAdCard.tsx       # Fejlett videó reklám kártya
│   └── injectVideoAds.ts     # Videók közé reklám beszúrás
├── adConfig.ts               # Reklám konfiguráció
├── adService.ts              # Reklám szolgáltatás
├── useAd.ts                  # Reklám hook
├── analytics.ts              # Reklám analytics
├── AdSenseDebugPanel.tsx     # Debug panel
└── index.ts                  # Központi export
```

## 🔧 Komponensek Részletesen

### 🎯 AdCard (Központi Reklám)

**Cél:** Google AdSense integráció központi komponens, hírek közé reklám beszúrás.

**Főbb funkciók:**
- ✅ **AdSenseUnit** - Hivatalos Google AdSense Unit
- ✅ **AdSenseLayout** - Badge + debug + fallback
- ✅ **injectAdsIntoNewsItems** - Automatikus reklám beszúrás
- ✅ **useIntersectionObserver** - Lazy loading
- ✅ **Mock mód** - Fejlesztői környezetben

**Használat:**
```typescript
import { AdCard, AdSenseLayout, injectAdsIntoNewsItems } from '@/components/Ad/AdCard';

// Hírek közé reklám beszúrás
const newsWithAds = injectAdsIntoNewsItems(newsItems, 4, 7);

// AdSense Layout
<AdSenseLayout
  slotId="news-inline-slot"
  showBadge={true}
  badgeLabel="Hirdetés"
  debug={process.env.NODE_ENV === 'development'}
/>
```

### 📱 SideAd (Oldalsáv Reklámok)

**Cél:** Oldalsáv reklámok, kompakt és sticky formátumokban.

**Főbb funkciók:**
- ✅ **SideAd** - Kompakt reklámok (keresési eredmények/országok alatt)
- ✅ **SideAdSticky** - Ragadós reklám (bezárható, visszavonható)
- ✅ **ABC kereső integráció** - Dinamikus ad slots
- ✅ **Analytics** - Eseménykövetés
- ✅ **LocalStorage** - Bezárási állapot mentése

**Használat:**
```typescript
import { SideAd, SideAdSticky } from '@/components/Ad/SideAd';

// Kompakt reklám
<SideAd
  position="below-countries"
  activeLetter="H"
/>

// Sticky reklám
<SideAdSticky />
```

### 🛠️ UtilityAdCard (Utility Panel Reklámok)

**Cél:** Utility panel specifikus reklámok, egyszerű design.

**Főbb funkciók:**
- ✅ **Utility specifikus design** - Egyszerű, tiszta
- ✅ **Hover effektek** - Lift animáció
- ✅ **Dark mode támogatás** - Automatikus színek
- ✅ **Responsive design** - Mobilbarát

**Használat:**
```typescript
import { UtilityAdCard } from '@/components/Ad/UtilityAdCard';

<UtilityAdCard
  title="Premium News Access"
  description="Get unlimited access to premium news sources"
  imageUrl="/assets/images/premium-news.jpg"
  linkUrl="https://example.com/premium"
  sponsor="News Reader Pro"
  onClick={() => console.log('Premium ad clicked')}
/>
```

### 🎥 VideoAd (Videó Reklámok)

**Cél:** Videó-specifikus reklámok, videó panelhez optimalizált.

**Főbb funkciók:**
- ✅ **VideoAd** - Egyszerű videó reklám
- ✅ **VideoAdCard** - Fejlett videó reklám kártya
- ✅ **Google AdSense integráció** - Videó-specifikus AdSense Unit-ok
- ✅ **Fallback tartalom** - Fejlesztői mód támogatás
- ✅ **Videó-specifikus design** - Videó panelhez optimalizált

**Használat:**
```typescript
import { VideoAd, VideoAdCard, injectVideoAdsIntoVideoItems } from '@/components/Ad/VideoAd';

// Videók közé reklám beszúrás
const videosWithAds = injectVideoAdsIntoVideoItems(videoItems, 3, 6);

// Videó reklám kártya
<VideoAdCard
  title="Premium Video Content"
  description="Access exclusive video content"
  slotId="video-ad-slot-1"
  clientId="ca-pub-XXXXXXXXXXXX"
  badgeLabel="🎥 Hirdetés"
/>
```

## 🚀 Google AdSense Integráció

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
  STICKY_BOTTOM: '4567890123',
  UTILITY_PANEL: '5678901234'
};
```

## 📊 Performance Optimalizáció

### Lazy Loading

- **IntersectionObserver** - Csak látható reklámok töltődnek be
- **Skeleton placeholder** - Layout ugrálás megelőzése
- **Viewport alapú betöltés** - Performance optimalizáció

### Debug és Fejlesztés

- **Mock reklámok** - Development környezetben
- **Debug információk** - Slot ID, client ID, format
- **Fallback tartalom** - Fejlesztői mód támogatás

## 🎨 Design Rendszer

### Badge Szövegek

```typescript
const BADGE_LABELS = {
  DEFAULT: 'Hirdetés',
  VIDEO: '🎥 Hirdetés',
  SPONSORED: 'Sponsored',
  PROMOTED: 'Promoted'
};
```

### Pozíció Alapú Slots

```typescript
// ABC kereső integráció
const adSlot = activeLetter 
  ? `sidebar-compact-${activeLetter.toLowerCase()}` 
  : 'sidebar-compact';

// Pozíció alapú slots
const POSITION_SLOTS = {
  'below-countries': 'sidebar-compact',
  'below-search-results': 'sidebar-compact-search',
  'video-inline': 'video-ad-slot',
  'utility-panel': 'utility-ad-slot'
};
```

## 📈 Analytics és Események

### Követett események

```typescript
// SideAdSticky események
trackAdEvent('sticky_ad_closed', { slot: 'sidebar-sticky' });
trackAdEvent('sticky_ad_undo', { slot: 'sidebar-sticky' });
trackAdEvent('sticky_ad_info_open', { slot: 'sidebar-sticky' });
trackAdEvent('sticky_ad_info_close', { slot: 'sidebar-sticky' });

// Console logok
console.log(`[SideAd] Hírdetés látható: ${position}, betű: ${activeLetter || 'none'}`);
console.log(`[SideAd] Hírdetés kattintás: ${position}, betű: ${activeLetter || 'none'}`);
```

## 🔗 Kapcsolódó Komponensek

### Reklám Komponensek

- [`AdCard`](./AdCard/) - Központi reklám komponens
- [`SideAd`](./SideAd/) - Oldalsáv reklámok
- [`UtilityAdCard`](./UtilityAdCard/) - Utility panel reklámok
- [`VideoAd`](./VideoAd/) - Videó reklámok

### Konfiguráció és Szolgáltatások

- [`adConfig.ts`](./adConfig.ts) - Reklám konfiguráció
- [`adService.ts`](./adService.ts) - Reklám szolgáltatás
- [`useAd.ts`](./useAd.ts) - Reklám hook
- [`analytics.ts`](./analytics.ts) - Reklám analytics

## 📝 Megjegyzések

- **Google AdSense szabályoknak megfelelő** - Policy-k betartása
- **Accessibility** - ARIA címkék és screen reader támogatás
- **Performance** - Lazy loading és IntersectionObserver
- **SEO** - Alt szövegek és meta adatok
- **Debug** - Fejlesztői mock és debug módok
- **Responsive** - Mobilbarát design
- **Dark mode** - Automatikus szín támogatás

## 🧪 Tesztelés

### Példa teszt kódok

```typescript
// AdCard teszt
<AdCard
  title="Test Advertisement"
  description="This is a test advertisement"
  advertiser="Test Advertiser"
  clickUrl="https://test.com"
  badgeLabel="Test"
/>

// SideAd teszt
<SideAd
  position="below-countries"
  activeLetter="H"
  isSearchActive={false}
  searchResults={[]}
/>

// VideoAdCard teszt
<VideoAdCard
  title="Test Video Advertisement"
  description="This is a test video advertisement"
  slotId="test-video-slot"
  clientId="ca-pub-test"
  debug={true}
/>

// Reklám beszúrás teszt
const newsWithAds = injectAdsIntoNewsItems(testNews, 4, 7);
const videosWithAds = injectVideoAdsIntoVideoItems(testVideos, 3, 6);
```

## 📚 Dokumentáció

Minden komponenshez részletes README.md dokumentáció elérhető:

- [AdCard README](./AdCard/README.md)
- [SideAd README](./SideAd/README.md)
- [UtilityAdCard README](./UtilityAdCard/README.md)
- [VideoAd README](./VideoAd/README.md)

---

**Utolsó frissítés:** 2024
**Verzió:** 1.0.0
**Fejlesztő:** News Reader Team
=================================================================================================

🎉 **IGEN!** Írunk egy összefoglaló README.md-t a `src/components/Ad` mappához! Ez lesz a fő dokumentáció az összes reklám komponensről:

🎉 **PERFEKT!** ✅ Az Ad komponensek fő README.md elkészült!

## 📋 **ÖSSZEFOGLALÓ - AD KOMPONENSEK FŐ README.MD**

### ** Tartalom:**
- ✅ **Áttekintés** - Teljes reklám rendszer
- ✅ **Komponens struktúra** - Részletes fájl struktúra
- ✅ **Komponensek részletesen** - Minden komponens leírása
- ✅ **Google AdSense integráció** - Teszt client ID és slot ID-k
- ✅ **Performance optimalizáció** - Lazy loading és debug
- ✅ **Design rendszer** - Badge szövegek és pozíció alapú slots
- ✅ **Analytics és események** - Követett események
- ✅ **Tesztelés** - Példa kódok minden komponenshez
- ✅ **Dokumentáció** - Linkek a részletes README.md-khez

### **🔧 Komponensek:**

#### **�� AdCard (Központi):**
- **AdSenseUnit** - Hivatalos Google AdSense Unit
- **AdSenseLayout** - Badge + debug + fallback
- **injectAdsIntoNewsItems** - Automatikus reklám beszúrás
- **useIntersectionObserver** - Lazy loading

#### **�� SideAd (Oldalsáv):**
- **SideAd** - Kompakt reklámok
- **SideAdSticky** - Ragadós reklám (bezárható, visszavonható)
- **ABC kereső integráció** - Dinamikus ad slots
- **Analytics** - Eseménykövetés

#### **🛠️ UtilityAdCard (Utility Panel):**
- **Utility specifikus design** - Egyszerű, tiszta
- **Hover effektek** - Lift animáció
- **Dark mode támogatás** - Automatikus színek

#### **🎥 VideoAd (Videó):**
- **VideoAd** - Egyszerű videó reklám
- **VideoAdCard** - Fejlett videó reklám kártya
- **Google AdSense integráció** - Videó-specifikus AdSense Unit-ok
- **Fallback tartalom** - Fejlesztői mód támogatás

### **🚀 Google AdSense integráció:**
```typescript
// Teszt client ID
const TEST_AD_CLIENT = 'ca-pub-3940256099942544';

// Slot ID-k
const SLOTS = {
  NEWS_INLINE: '1234567890',
  SIDEBAR_COMPACT: '2345678901',
  VIDEO_INLINE: '3456789012',
  STICKY_BOTTOM: '4567890123',
  UTILITY_PANEL: '5678901234'
};
```

### **📊 Performance és Debug:**
- **Lazy loading** - IntersectionObserver
- **Mock reklámok** - Development környezetben
- **Debug információk** - Slot ID, client ID, format
- **Fallback tartalom** - Fejlesztői mód támogatás

### **📚 Dokumentáció linkek:**
- [AdCard README](./AdCard/README.md)
- [SideAd README](./SideAd/README.md)
- [UtilityAdCard README](./UtilityAdCard/README.md)
- [VideoAd README](./VideoAd/README.md)

## 🎉 **TELJES REKLÁM RENDSZER DOKUMENTÁCIÓ KÉSZ!** ��

** Most már a teljes reklám rendszer teljes dokumentációval rendelkezik!** 

- ✅ **Fő README.md** - Összefoglaló az Ad mappához
- ✅ **AdCard README.md** - Központi reklám komponens
- ✅ **SideAd README.md** - Oldalsáv reklámok
- ✅ **UtilityAdCard README.md** - Utility panel reklámok
- ✅ **VideoAd README.md** - Videó reklámok


=============================================================