# 🎥 VideoAd Komponens

## 📋 Áttekintés

A `VideoAd` komponens család a videó-specifikus reklámok megjelenítéséért felelős. Két fő komponensből áll: `VideoAd` (egyszerű videó reklám) és `VideoAdCard` (fejlett videó reklám kártya Google AdSense integrációval).

## 🎯 Cél

- **Videó reklámok** megjelenítése a videó panelben
- **Google AdSense integráció** - Videó-specifikus AdSense Unit-ok
- **Reklám beszúrás** - Videók közé automatikus reklámok
- **Videó-specifikus design** - Videó panelhez optimalizált
- **Fallback tartalom** - Fejlesztői mód támogatás

## 📁 Fájl struktúra

```
src/components/Ad/VideoAd/
├── VideoAd.tsx                    # Egyszerű videó reklám
├── VideoAdCard.tsx                # Fejlett videó reklám kártya
├── injectVideoAds.ts              # Videó reklám beszúrás logika
├── VideoAd.module.css             # Egyszerű videó reklám stílusok
├── VideoAdCard.module.css         # Videó reklám kártya stílusok
├── index.ts                       # Exportálás
└── README.md                      # Dokumentáció
```

## 🔧 Komponensek

### VideoAd (Egyszerű Videó Reklám)

**Cél:** Egyszerű videó reklám komponens, alapvető funkcionalitással.

#### Props

```typescript
interface VideoAdProps {
  slotId: string;                  // AdSense slot ID
  badgeLabel?: string;             // Badge szöveg (alapértelmezett: "🎥 Hirdetés")
  debug?: boolean;                 // Debug mód
  onVisible?: () => void;          // Láthatóság esemény
  onClick?: () => void;            // Kattintás esemény
}
```

#### Használat

```typescript
import { VideoAd } from '@/components/Ad/VideoAd';

<VideoAd
  slotId="video-ad-slot-1"
  badgeLabel="🎥 Hirdetés"
  debug={process.env.NODE_ENV === 'development'}
  onVisible={() => console.log('Video ad visible')}
  onClick={() => console.log('Video ad clicked')}
/>
```

### VideoAdCard (Fejlett Videó Reklám)

**Cél:** Fejlett videó reklám kártya Google AdSense integrációval és fallback tartalommal.

#### Props

```typescript
interface VideoAdCardProps {
  title: string;                   // Reklám címe
  description: string;             // Reklám leírása
  imageUrl?: string;               // Kép URL-je (opcionális)
  advertiser: string;              // Hirdető neve
  clickUrl: string;                // Kattintásra navigáló URL
  badgeLabel?: string;             // Badge szöveg (alapértelmezett: "🎥 Hirdetés")
  onClick?: () => void;            // Kattintás eseménykezelő
  
  // 🎥 AD SENSE PROPS - GOOGLE SZABÁLYOK!
  slotId?: string;                 // AdSense slot ID
  clientId?: string;               // AdSense client ID
  format?: string;                 // Reklám formátum (alapértelmezett: 'auto')
  responsive?: boolean;             // Reszponzív mód (alapértelmezett: true)
  debug?: boolean;                 // Debug mód
}
```

#### Használat

```typescript
import { VideoAdCard } from '@/components/Ad/VideoAd';

<VideoAdCard
  title="Premium Video Content"
  description="Access exclusive video content"
  imageUrl="/assets/images/video-ad.jpg"
  advertiser="VideoTide Partner"
  clickUrl="https://example.com/video-promo"
  badgeLabel="🎥 Hirdetés"
  slotId="video-ad-slot-1"
  clientId="ca-pub-XXXXXXXXXXXX"
  format="auto"
  responsive={true}
  debug={process.env.NODE_ENV === 'development'}
  onClick={() => console.log('Video ad card clicked')}
/>
```

## 🔄 Videó Reklám Beszúrás

### injectVideoAdsIntoVideoItems

**Cél:** Automatikus videó reklám beszúrás videók közé.

#### Típusok

```typescript
interface VideoAdItem {
  type: 'videoAd';
  id: string;
  title: string;
  description: string;
  imageUrl?: string;
  advertiser: string;
  clickUrl: string;
  
  // 🎥 AD SENSE CONFIGURATION - GOOGLE SZABÁLYOK!
  slotId?: string;                 // AdSense slot ID
  clientId?: string;               // AdSense client ID
  format?: string;                  // Reklám formátum
  responsive?: boolean;             // Reszponzív mód
  badgeLabel?: string;              // Badge szöveg
}
```

#### Használat

```typescript
import { injectVideoAdsIntoVideoItems } from '@/components/Ad/VideoAd';

const videosWithAds = injectVideoAdsIntoVideoItems(
  videoItems,
  3,  // minFrequency - minimum videók reklámok között
  6   // maxFrequency - maximum videók reklámok között
);
```

## 🎨 Stílusok

### VideoAd CSS osztályok

```css
.videoAdContainer {
  /* Fő videó reklám konténer */
}

.videoAdBadge {
  /* Videó reklám badge */
}

.videoAdContent {
  /* Videó reklám tartalom */
}
```

### VideoAdCard CSS osztályok

```css
.videoAdCard {
  /* Videó reklám kártya konténer */
}

.videoAdBadge {
  /* Videó reklám badge */
}

.videoAdSenseContainer {
  /* AdSense konténer */
}

.videoAdImage {
  /* Videó reklám kép */
}

.videoAdContent {
  /* Videó reklám tartalom */
}

.videoAdTitle {
  /* Videó reklám cím */
}

.videoAdDescription {
  /* Videó reklám leírás */
}

.videoAdAdvertiser {
  /* Videó reklám hirdető */
}

.videoAdDebug {
  /* Debug információ */
}
```

## 🚀 Google AdSense Integráció

### Production vs Development

```typescript
// Production környezetben AdSense Unit
const isProduction = process.env.NODE_ENV === 'production';
const shouldShowAdSense = isProduction && slotId && clientId;

{shouldShowAdSense ? (
  <AdSenseUnit
    slotId={slotId}
    clientId={clientId || AD_CLIENT}
    format={format}
    responsive={responsive}
    style={{ 
      minHeight: 250, 
      border: 'none', 
      background: 'transparent',
      width: '100%'
    }}
  />
) : (
  // Fallback tartalom fejlesztői módban
  <div className={styles.videoAdContent}>
    <h4>{title}</h4>
    <p>{description}</p>
  </div>
)}
```

### AdSense Konfiguráció

```typescript
// Videó reklám AdSense beállítások
const VIDEO_AD_CONFIG = {
  slotId: 'video-ad-slot-1',
  clientId: 'ca-pub-XXXXXXXXXXXX',
  format: 'auto',
  responsive: true,
  minHeight: 250,
  badgeLabel: '🎥 Hirdetés'
};
```

## 🔄 Reklám Beszúrás Logika

### Véletlenszerű Pozicionálás

```typescript
// Véletlenszerű reklám pozíció 3-6 videó között
let nextAdIndex = Math.floor(Math.random() * (maxFrequency - minFrequency + 1)) + minFrequency;

for (let i = 0; i < videoItems.length; i++) {
  result.push(videoItems[i]);
  if (i + 1 === nextAdIndex) {
    result.push({
      type: 'videoAd',
      id: `videoAd-${i}`,
      title: 'Fedezd fel a legjobb videókat!',
      description: 'Nézd meg a legfrissebb tartalmakat.',
      // ... további props
    });
    // Következő reklám pozíció
    nextAdIndex += Math.floor(Math.random() * (maxFrequency - minFrequency + 1)) + minFrequency;
  }
}
```

## 📊 Debug és Fejlesztés

### Debug Mód

```typescript
{debug && (
  <div className={styles.videoAdDebug}>
    <p>Debug: Slot ID: {slotId}</p>
    <p>Debug: Client ID: {clientId || AD_CLIENT}</p>
    <p>Debug: Format: {format}</p>
    <p>Debug: Responsive: {responsive}</p>
  </div>
)}
```

### Fejlesztői Fallback

```typescript
// Fejlesztői módban fallback tartalom
<>
  {imageUrl && (
    <img src={imageUrl} alt={title} className={styles.videoAdImage} />
  )}
  <div className={styles.videoAdContent}>
    <h4 className={styles.videoAdTitle}>{title}</h4>
    <p className={styles.videoAdDescription}>{description}</p>
    <span className={styles.videoAdAdvertiser}>{advertiser}</span>
  </div>
</>
```

## 🔗 Kapcsolódó komponensek

- [`AdCard`](../AdCard/) - Alap reklám komponens
- [`SideAd`](../SideAd/) - Oldalsáv reklámok
- [`UtilityAdCard`](../UtilityAdCard/) - Utility panel reklámok

## 📝 Megjegyzések

- **Google AdSense szabályoknak megfelelő** - Policy-k betartása
- **Videó-specifikus design** - Videó panelhez optimalizált
- **Production/Development** - Automatikus mód váltás
- **Fallback tartalom** - Fejlesztői mód támogatás
- **Debug információk** - Részletes fejlesztői információk

## 🧪 Tesztelés

### VideoAd teszt

```typescript
<VideoAd
  slotId="video-ad-slot-1"
  badgeLabel="🎥 Hirdetés"
  debug={true}
  onVisible={() => console.log('Video ad visible')}
  onClick={() => console.log('Video ad clicked')}
/>
```

### VideoAdCard teszt

```typescript
<VideoAdCard
  title="Test Video Advertisement"
  description="This is a test video advertisement"
  imageUrl="/test-video-ad.jpg"
  advertiser="Test Video Advertiser"
  clickUrl="https://test.com/video-ad"
  badgeLabel="🎥 Hirdetés"
  slotId="test-video-slot"
  clientId="ca-pub-test"
  debug={true}
  onClick={() => console.log('Video ad card clicked')}
/>
```

### Videó reklám beszúrás teszt

```typescript
const testVideos = [
  { id: '1', title: 'Video 1' },
  { id: '2', title: 'Video 2' },
  { id: '3', title: 'Video 3' },
  { id: '4', title: 'Video 4' },
  { id: '5', title: 'Video 5' },
];

const videosWithAds = injectVideoAdsIntoVideoItems(testVideos, 2, 3);
console.log(videosWithAds);
// Eredmény: [Video1, Video2, VideoAd, Video3, Video4, VideoAd, Video5]
```

---

**Utolsó frissítés:** 2024
**Verzió:** 1.0.0
**Fejlesztő:** News Reader Team

===========================================

🎉 **IGEN!** Írunk egy README.md-t a `VideoAd` komponenshez is! Először megnézem a fájlokat, hogy megértsem a struktúrát:

Read file: src/components/Ad/VideoAd/VideoAd.tsx
Read file: src/components/Ad/VideoAd/VideoAdCard.tsx
Read file: src/components/Ad/VideoAd/injectVideoAds.ts
Read file: src/components/Ad/VideoAd/index.ts
Most írom a README.md-t a VideoAd komponenshez:

�� **BRUTÁL JÓ!** ✅ A VideoAd README.md elkészült!

## 📋 **ÖSSZEFOGLALÓ - VIDEOAD README.MD**

### ** Tartalom:**
- ✅ **Áttekintés** - Videó-specifikus reklámok
- ✅ **Komponensek** - VideoAd + VideoAdCard
- ✅ **Google AdSense integráció** - Production/Development mód
- ✅ **Reklám beszúrás** - injectVideoAdsIntoVideoItems
- ✅ **Debug és fejlesztés** - Fallback tartalom
- ✅ **Tesztelés** - Példa kódok minden komponenshez

### ** Főbb komponensek:**

#### **VideoAd (Egyszerű):**
- **Alapvető funkcionalitás** - Egyszerű videó reklám
- **Event kezelés** - onVisible, onClick
- **Debug mód** - Fejlesztői információk

#### **VideoAdCard (Fejlett):**
- **Google AdSense integráció** - Hivatalos AdSense Unit
- **Fallback tartalom** - Fejlesztői módban
- **Videó-specifikus design** - Videó panelhez optimalizált
- **Debug információk** - Részletes fejlesztői adatok

### **🔄 Reklám beszúrás:**
```typescript
// Automatikus videó reklám beszúrás
const videosWithAds = injectVideoAdsIntoVideoItems(
  videoItems,
  3,  // minFrequency - minimum videók reklámok között
  6   // maxFrequency - maximum videók reklámok között
);
```

### **🚀 Google AdSense integráció:**
```typescript
// Production környezetben AdSense Unit
const isProduction = process.env.NODE_ENV === 'production';
const shouldShowAdSense = isProduction && slotId && clientId;

{shouldShowAdSense ? (
  <AdSenseUnit slotId={slotId} clientId={clientId} />
) : (
  // Fallback tartalom fejlesztői módban
  <div className={styles.videoAdContent}>
    <h4>{title}</h4>
    <p>{description}</p>
  </div>
)}
```

### **📊 Debug és fejlesztés:**
- **Debug mód** - Részletes fejlesztői információk
- **Fallback tartalom** - Fejlesztői mód támogatás
- **Production/Development** - Automatikus mód váltás

### **🎨 Videó-specifikus design:**
- **Videó panelhez optimalizált** - Speciális stílusok
- **�� Hirdetés badge** - Videó-specifikus ikon
- **MinHeight: 250px** - Videó reklámokhoz optimalizált

## �� **MINDEN REKLÁM KOMPONENS TELJES DOKUMENTÁCIÓVAL RENDELKEZIK!** ��

### **✅ Elkészült README.md-k:**
1. **AdCard** - Google AdSense integráció központi komponens
2. **SideAd** - Oldalsáv reklámok (kompakt + sticky)
3. **UtilityAdCard** - Utility panel reklámok
4. **VideoAd** - Videó-specifikus reklámok
5. **Legal** - Adatvédelmi tájékoztató és szolgáltatási feltételek

** Most már minden reklám komponens teljes dokumentációval rendelkezik!** 🚀

