# 🎥 VideoPanel Komponensek

Ez a mappa a videó hírek megjelenítéséért felelős komponenseket tartalmazza. A komponensek **elkülönülnek a sima hírektől** és csak YouTube videó híreket jelenítenek meg.

## 📁 Fájlstruktúra

```
VideoPanel/
├── README.md                    # Ez a dokumentáció
├── VideoPanel.tsx               # Fő videó panel komponens
├── VideoCard.tsx                # Egyedi videó kártya komponens
├── VideoCard.module.css         # VideoCard CSS stílusok
├── useVideoData.ts              # Videó adatok kezelő hook
└── TestYouTube.tsx              # Teszt YouTube lejátszó komponens
```



**Kapcsolódó fájlok:**
```
utils/
├── videoProgressService.ts       # Videó pozíció tárolási szolgáltatás

hooks/
├── useVideoProgress.ts           # Videó pozíció követés hook
```

## 🎯 Komponensek Leírása

### VideoPanel.tsx
**Fő videó panel komponens**, amely:
- ✅ Csak videókat jelenít meg (nem keveri a hírekkel)
- ✅ Grid layout-ban rendezi a videó kártyákat
- ✅ Kezeli a betöltési, hiba és üres állapotokat
- ✅ Reszponzív design (auto-fill grid)

**Props:**
```typescript
interface VideoPanelProps {
  activeTabId: string;
  title?: string;
  videoItems: any[]; // YouTubeVideo[]
  loading?: boolean;
  error?: Error | string | null;
  onRetry?: () => void;
  onToggleMenu?: (cardId: string | undefined, anchorEl: HTMLElement | null, cardEl?: HTMLElement | null) => void;
}
```

### VideoCard.tsx
**Egyedi videó kártya komponens**, amely:
- ✅ YouTube videó kártyát jelenít meg
- ✅ **Beágyazott YouTube lejátszó** (kattintásra)
- ✅ **Videó pozíció követés** és automatikus folytatás
- ✅ **Progress bar overlay** a thumbnail-en
- ✅ Thumbnail, cím, metaadatok, "Watch on YouTube" gomb
- ✅ Hover effektek és videó badge
- ✅ Kattintható thumbnail és cím

**Új funkciók:**
- 🎯 **Pozíció mentés**: Automatikusan menti a lejátszási pozíciót
- 🔄 **Automatikus folytatás**: Onnan folytatja, ahol abbahagyta
- 📊 **Progress bar**: Vizuális visszajelzés a nézési folyamatról
- 🧠 **Intelligens logika**: 90% felett elejéről, 10% alatt elejéről

**Props:**
```typescript
interface VideoCardProps {
  video: any; // YouTubeVideo típus
  onToggleMenu?: (cardId: string | undefined, anchorEl: HTMLElement | null, cardEl?: HTMLElement | null) => void;
}
```

### useVideoData.ts
**Videó adatok kezelő hook**, amely:
- ✅ API-n keresztül lekéri a videó híreket
- ✅ Kezeli a betöltési és hiba állapotokat
- ✅ Auto refresh funkció (opcionális)
- ✅ Intelligens cleanup nem video módban

**Használat:**
```typescript
const {
  videoItems,
  loading,
  error,
  lastFetched,
  refreshVideos,
  clearError,
} = useVideoData({
  activeTabId,
  isVideoMode,
  autoRefresh: true,
  refreshInterval: 300000, // 5 perc
});
```

## 🆕 Új Funkciók: Videó Pozíció Követés

### VideoProgressService
**LocalStorage alapú pozíció tárolási szolgáltatás:**
- ✅ **Pozíció mentés/betöltés** LocalStorage-ban
- ✅ **Intelligens mentési logika** (90% felett teljes, 10% alatt elejéről)
- ✅ **Automatikus cleanup** (30 napnál régebbi pozíciók)
- ✅ **Hibakezelés** és részletes logging

**Használat:**
```typescript
import { videoProgressService } from '../utils/videoProgressService';

// Pozíció mentése
videoProgressService.saveProgress(videoId, position, duration);

// Pozíció betöltése
const progress = videoProgressService.getProgress(videoId);

// Pozíció törlése
videoProgressService.clearProgress(videoId);
```

### useVideoProgress Hook
**React hook a videó pozíció kezeléshez:**
- ✅ **YouTube player eseménykezelés** (onReady, onStateChange)
- ✅ **Automatikus folytatás** intelligens logikával
- ✅ **Debounced mentés** (5 másodpercenként)
- ✅ **Progress állapot** kezelés

**Használat:**
```typescript
import { useVideoProgress } from '../hooks/useVideoProgress';

const {
  progress,
  hasProgress,
  watchPercentage,
  handlePlayerReady,
  handleStateChange,
  clearProgress
} = useVideoProgress(videoId, {
  autoResume: true,
  saveInterval: 5000, // 5 másodpercenként mentés
  minSaveThreshold: 10 // 10 másodperc után kezdjük menteni
});
```

## 🎨 Stílusok

A komponensek **CSS modulokat** használnak:

### VideoPanel
- Grid layout: `repeat(auto-fill, minmax(300px, 1fr))`
- Padding: `20px`
- Max width: `1200px`

### VideoCard
- Card design: border, shadow, hover effects
- YouTube red button: `#ff0000`
- Thumbnail: `180px` height, `object-fit: cover`
- Play overlay: centered ▶️ ikon
- **Progress overlay**: Alul lévő progress bar
- **Progress bar**: Gradient piros szín, animált
- **Progress text**: Százalék megjelenítés

## 🔄 Adatfolyam

```
1. TabController → video mode felismerés
2. Content → useVideoData hook
3. useVideoData → apiClient.getVideoNews()
4. API → /api/video/news endpoint
5. Backend → videoAggregator.fetchMultipleChannels()
6. YouTube RSS → feldolgozás
7. Válasz → VideoPanel → VideoCard
8. VideoCard → useVideoProgress hook
9. YouTube Player → pozíció mentés/betöltés
```

## 🚀 Használat Példa

```typescript
// 1. Video tab hozzáadása
const videoTab = {
  id: 'video-news',
  title: 'Video News',
  mode: 'video',
  active: false,
};

// 2. Video data hook
const { videoItems, loading, error } = useVideoData({
  activeTabId: 'video-news',
  isVideoMode: true,
});

// 3. VideoPanel render
<VideoPanel
  activeTabId="video-news"
  title="Video News"
  videoItems={videoItems}
  loading={loading}
  error={error}
  onRetry={() => refreshVideos()}
/>
```

## 🎯 Videó Pozíció Követés Használata

### Automatikus működés:
1. **Videó megnyitása** → Automatikus folytatás (ha van mentett pozíció)
2. **Videó nézése** → 5 másodpercenként automatikus mentés
3. **Videó bezárása** → Pozíció megmarad LocalStorage-ban
4. **Újranyitás** → Onnan folytatja, ahol abbahagyta

### Intelligens logika:
- **< 10% nézve**: Elejéről kezdés
- **10-90% nézve**: Folytatás pozícióból
- **> 90% nézve**: Elejéről kezdés (újranézés)

### Adatstruktúra:
```json
{
  "videoProgress": {
    "4t1J_iD0C-E": {
      "position": 245.6,
      "duration": 1200.0,
      "lastWatched": "2025-01-09T10:30:00Z",
      "completed": false,
      "watchPercentage": 20.5
    }
  }
}
```

## ⚠️ Fontos Megjegyzések

- **Elkülönül a hírektől**: A videó komponensek NEM keverik a sima híreket
- **Csak video módban fut**: A useVideoData hook csak video módban működik
- **Auto cleanup**: Nem video módban automatikusan törli az adatokat
- **Reszponzív**: Grid layout automatikusan alkalmazkodik a képernyőmérethez
- **Pozíció követés**: LocalStorage-ban tárolódnak a pozíciók
- **Automatikus folytatás**: Intelligens logika alapján folytatja a videókat

## 🔗 Kapcsolódó Fájlok

- `src/apiclient/apiClient.ts` - Video API kliens metódusok
- `src/apiclient/endpoints.ts` - Video endpoint definíciók
- `src/backend/api/routes/video/` - Video backend route-ok
- `src/backend/api/routes/video/videoAggregator/` - Video aggregator
- `src/utils/videoProgressService.ts` - Videó pozíció tárolási szolgáltatás
- `src/hooks/useVideoProgress.ts` - Videó pozíció követés hook

## 📝 Fejlesztési Jegyzetek

- **Típusok**: Jelenleg `any[]` típusokat használunk, később `YouTubeVideo[]`-ra cseréljük
- **CSS**: CSS modulokat használunk a stílusokhoz
- **Tesztelés**: Unit tesztek a komponensekhez
- **Optimalizáció**: Memoization és lazy loading
- **Pozíció követés**: LocalStorage alapú, később IndexedDB vagy backend sync
- **Progress UI**: Vizuális visszajelzés a nézési folyamatról 

## 🛠️ Fejlesztési lehetőség: azonnali YouTube lejátszó

- **Jelenleg:** A VideoCard komponens lusta betöltést használ: először csak a YouTube thumbnail látszik, és csak kattintásra töltődik be az iframe (YouTube lejátszó).
- **Alternatíva:** A "mindig iframe" logika (azonnal megjelenő YouTube lejátszó, első kattintásra induló videó) ki van kommentelve a VideoCard-ban. Ha fejleszteni akarjuk, csak ki kell venni a kommentből.
- **Javaslat:** Fejlesztői teszteléshez érdemes lehet egy boolean flag-et (pl. `const alwaysShowPlayer = false;`) használni, és ennek alapján feltételesen renderelni a két logikát. Így könnyen váltható, hogy melyik működjön (lusta betöltés vagy azonnali lejátszó). 

=====================================================

Cél: ahelyett, hogy először csak egy statikus képre kattint a felhasználó (ami után betölt a YouTube iframe), egyből a YouTube lejátszó jelenjen meg, és egyetlen kattintással elinduljon a videó.

🔄 Mostani működésed (lazy loading):
Kattintás a képre (YouTube thumbnail) → betöltődik az iframe

Még egy kattintás az iframe-en belül → elindul a videó

Ez jó UX szempontból (gyorsabb első betöltés, nincs iframe mindenhova), de két kattintást igényel.

✅ Amit szeretnél:
Már első kattintásra valós YouTube lejátszó jelenjen meg, és azonnal induljon a videó.

🔧 Megoldás: iframe autoplay a kattintás után
Amikor a felhasználó rákattint a thumbnailre, ne csak sima YouTube iframe-et tölts be, hanem olyat, ami:

azonnal autoplay-el (autoplay=1),

mutatja a videót, nem csak egy állóképet.

✨ Kódminta (React példa)
tsx
Másolás
Szerkesztés
{showPlayer ? (
  <iframe
    width="100%"
    height="100%"
    src={`https://www.youtube.com/embed/${videoId}?autoplay=1&mute=1&rel=0`}
    title="YouTube video player"
    frameBorder="0"
    allow="autoplay; encrypted-media"
    allowFullScreen
  />
) : (
  <img
    src={`https://img.youtube.com/vi/${videoId}/hqdefault.jpg`}
    alt={video.title}
    onClick={() => setShowPlayer(true)}
    className={styles.thumbnail}
  />
)}
🔍 Részletek:
autoplay=1: azonnal elindítja a videót

mute=1: néma mód (Chrome csak így engedi automatikus indítást!)

rel=0: ne ajánljon más videókat a végén

allow="autoplay": kell, különben nem indul el automatikusan

🟡 Fontos tudni
Autoplay csak némán működik elsőre, mert a legtöbb böngésző tiltja a hangos autoplay-t (felhasználói élmény védelme miatt).

Ha a felhasználó másodszor nézi meg, már engedélyezhet hangot is.

Teljes képernyőhöz allowFullScreen is kell.

✅ Eredmény:
Egyetlen kattintásra azonnal bejön a YouTube lejátszó

A videó azonnal elindul (némán)

A felhasználónak nem kell kétszer kattintani


===================================================================

🎯 Célod:
Ahelyett, hogy először egy képre kattintva megjelenik a YouTube lejátszó állóképpel és egy play gombbal,
már alapból a YouTube beágyazott lejátszó jelenjen meg — a benne lévő preview képpel és play gombbal együtt.

🤔 Miért nem ez történik most?
Jelenleg az a logika, hogy:

először csak egy statikus képet mutatsz (img.youtube.com/vi/...)

majd kattintásra betöltődik az <iframe> a YouTube lejátszóval

Ezt hívják „lusta betöltésnek” (lazy embed), mert így gyorsabb az oldal.

✅ Amit szeretnél: YouTube iframe azonnal
Ehhez nem kell saját preview, csak rögtön meg kell jeleníteni az iframe-et így:

tsx
Másolás
Szerkesztés
<iframe
  width="100%"
  height="315"
  src={`https://www.youtube.com/embed/${videoId}`}
  title={video.title}
  frameBorder="0"
  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
  allowFullScreen
/>
Ez már magában tartalmazza a videó borítóképét és a piros play gombot.

🔄 Így változik a viselkedés
Megoldás	Előny	Hátrány
Mostani (kép + katt)	Gyorsabb betöltés	Két kattintás
Iframe alapból	Egy kattintás azonnali lejátszáshoz	Lassabb oldal, több adatforgalom

🛠 Javaslat
Ha szeretnéd ezt globálisan átállítani, módosítsd a kódot úgy, hogy az iframe már a komponens betöltésekor megjelenjen, például:

tsx
Másolás
Szerkesztés
export default function VideoEmbed({ videoId, title }: { videoId: string; title: string }) {
  return (
    <iframe
      width="100%"
      height="315"
      src={`https://www.youtube.com/embed/${videoId}`}
      title={title}
      frameBorder="0"
      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
      allowFullScreen
    />
  );
}
Ezt hívhatod a Card vagy VideoCard komponensedből közvetlenül, ha nem akarsz előnézeti képet.

💡 Tipp:
Ha csak az első videóknál vagy mobilon akarod ezt így csinálni, feltételesen is meg lehet oldani.

Szükséged van ehhez React komponens-példára? Szívesen adok egy konkrét átalakítást is.
===================================================
Ez pontosan az oka, hogy lassabban töltődnek be a videók állóképpel szemben, amikor mindig azonnal beágyazod a YouTube lejátszót (react-youtube komponens) minden kártyán:

Miért lassabb így a betöltés?
YouTube iframe beágyazó (react-youtube):
Ez egy teljes funkcionalitású iframe-et jelent, ami nemcsak a statikus thumbnail képet tölti be, hanem az egész YouTube player környezetet (JavaScript, UI elemek, API-k, stb). Ez komolyabb adatforgalmat és erőforrás-felhasználást igényel.

Thumbnail kép (https://img.youtube.com/vi/${videoId}/hqdefault.jpg):
Ez egy egyszerű, statikus JPEG kép, ami gyorsan betöltődik, kis méretű, nem igényel bonyolult renderelést.

Összefoglalva:
Megközelítés	Betöltési sebesség	CPU / memória igény	Felhasználói élmény
Csak thumbnail kép	Nagyon gyors	Minimális	2 kattintás a lejátszáshoz
Azonnal YouTube player	Lassabb, több erőforrást igényel	Magasabb	Egy kattintás, azonnal lejátszható

Mit lehet tenni?
Lazy load iframe
Pl. betöltöd először a thumbnail képet, majd csak kattintásra töltöd be a YouTube player iframe-et. Ez a legjobb UX / teljesítmény kompromisszum.
(Ezt korábban használhattad.)

"Placeholder" komponens
Használhatsz egy egyszerűbb "preview" elemet vagy külső könyvtárat, ami a YouTube iframe-et csak akkor tölti be, amikor a videó a viewport-ban van, vagy kattintanak rá.

Optimize iframe betöltést
Pl. csak a látható videókhoz rendereld a YouTube komponenst, a többihez thumbnail-t vagy semmit.

Használj loading="lazy" attribútumot az iframe-en, ha natív iframe-et használsz (ez a react-youtube komponensnél nem alapértelmezett), hogy ne töltse be az összes iframe-et azonnal.

Összegzés:
Az, hogy mindig megjelenik a YouTube player, drasztikusan megnöveli az oldal betöltési idejét és erőforrásigényét, ezért lassabbak a videók, mint ha csak sima képet töltesz be.

Ha a sebesség fontos, érdemes visszatérni a "kép + kattintás" megoldáshoz, vagy valamilyen "lusta betöltéshez" (lazy loading), mert így csak amikor tényleg kell, akkor töltődik be a YouTube iframe.

Ha szeretnéd, segítek egy ilyen lazy load vagy placeholder megoldást megvalósítani React-ben.
Kívánod?
==================================================

## 🖼️ Lejátszás módok és modal logika

### Modal lejátszás (modalEnabled flag)
- A VideoPanel komponensben található egy `modalEnabled` flag (alapértelmezés: `false`).
- Ha `modalEnabled = false`, a videók a kiskártyákban (VideoCard) játszódnak le, közvetlenül a gridben.
- Ha `modalEnabled = true`, a videók egy modal ablakban (VideoModal) jelennek meg, amikor a kártyára kattintasz.
- A modal ablak reszponzív, 16:9 arányú, van bezáró gomb, ESC-re is zárható.
- A modalban is működik a pozíció követés.

### Gombok működése
- **YouTube gomb**: Új ablakban nyitja meg a videót a YouTube-on.
- **Menü gomb**: Csak akkor jelenik meg, ha van `onToggleMenu` prop.
- **Play gomb**: Kártyán vagy modalban indítja a lejátszást, a `modalEnabled` flag-től függően.
- **Kártyára kattintás**: Ha modal mód aktív, akkor a VideoModal nyílik meg, egyébként a kártyán belül indul a lejátszó.

### VideoCard és VideoModal kapcsolat
- A VideoCard komponens a `modalMode` prop alapján dönti el, hogy a kattintás a modalt nyissa-e meg, vagy a kártyán belül indítsa a lejátszót.
- A VideoPanel kezeli a modal állapotot és a kiválasztott videót.
- A VideoModal csak overlay, nem módosítja a gridet.

### Fejlesztői flag: alwaysShowPlayer
- A VideoCard-ban található egy `alwaysShowPlayer` fejlesztői flag.
- Ha `true`, minden kártyán azonnal a YouTube lejátszó jelenik meg (egykattintásos, de lassabb oldal).
- Ha `false` (alapértelmezett), csak kattintásra töltődik be az iframe (gyorsabb oldal, két kattintás).

---

Ezek a működési módok és gombok minden fejlesztő számára egyértelművé teszik a videós panel UX-ét és a fejlesztői flag-ek használatát.

