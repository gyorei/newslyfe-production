# 📋 TabNotifications Rendszer - Részletes Dokumentáció

**Hírolvasó alkalmazás intelligens fül értesítési rendszere**

## 🎯 **RENDSZER ÁTTEKINTÉS**

A TabNotifications rendszer egy **háromszintű értesítési mechanizmus**, amely lehetővé teszi a felhasználók számára, hogy **valós időben** értesüljenek új hírek érkezéséről anélkül, hogy manuálisan kellene frissíteniük az alkalmazást.

### **🔄 Működési Filozófia:**

- **Non-intrusive**: Nem zavarja meg a felhasználó munkafolyamatát
- **Informative**: Részletes előnézetet biztosít
- **Progressive Enhancement**: Fokozatosan építkező felhasználói élmény

---

## 🏗️ **ARCHITEKTÚRA ÉS KOMPONENSEK**

### **📁 Teljes Fájlstruktúra:**

src/components/TabNotifications/
├── 📁 Badge/
│ ├── TabNotificationBadge.tsx
│ ├── Badge.module.css
│ └── index.ts
├── 📁 HoverPanel/
│ ├── TabHoverPanel.tsx
│ ├── HoverPanel.module.css
│ └── index.ts
├── 📁 Modal/
│ ├── TabNewsModal.tsx
│ ├── Modal.module.css
│ └── index.ts
├── 📁 hooks/
│ ├── useTabNotifications.ts
│ ├── useHoverPanel.ts
│ └── useNewsModal.ts
├── 📁 shared/
│ ├── types.ts
│ └── constants.ts
├── index.ts (főexport)
└── README.md

````


---

## ✅ **ELKÉSZÍTETT ÉS MŰKÖDŐ FUNKCIÓK**

### **1. 🔴 TabNotificationBadge - Alapértesítési Rendszer**

**Fájl:** `TabNotificationBadge.tsx`

**🎯 Funkciók:**
- ✅ **Dinamikus számlálás**: Új hírek számának megjelenítése (1-99+)
- ✅ **Intelligens renderelés**: Csak akkor jelenik meg, ha van új hír
- ✅ **Animált megjelenés**: Smooth pulzáló animáció
- ✅ **Tooltip támogatás**: Hover-re részletes információ
- ✅ **Responsive design**: Minden képernyőméreten tökéletes

**📋 Props Interface:**
```typescript
interface TabNotificationBadgeProps {
  count: number;           // Új hírek száma
  visible?: boolean;       // Láthatóság vezérlése
  animated?: boolean;      // Animáció be/ki kapcsolása
}
````

**🎨 Vizuális megjelenés:**

```
[Hungary hírek ⭕3] [Belgium h. ⭕7] [Denmark...]
               ↑            ↑
           3 új hír    7 új hír
```

### **2. 🎣 useTabNotifications Hook - Adatkezelő Rendszer**

**Fájl:** `hooks/useTabNotifications.ts`

**🎯 Funkciók:**

- ✅ **Tab-specifikus adatkezelés**: Minden fül külön notification state-tel
- ✅ **Mock adatok rendszere**: Fejlett tesztelési adatok
- ✅ **Hover logika**: Mouse enter/leave események kezelése
- ✅ **Pozíció számítás**: Smart panel pozicionálás
- ✅ **Debug támogatás**: Konzol üzenetek fejlesztéshez

**📊 Mock Adatok Példa:**

```typescript
const mockNotifications = {
  'tab-1': {
    count: 3,
    previews: [
      'Új gazdasági intézkedések jelentős változásokat hoznak',
      'Politikai fordulat: koalíciós tárgyalások kezdődnek',
      'Választási eredmények: váratlan fejlemények',
    ],
  },
  'tab-2': {
    count: 7,
    previews: [
      'Belgium politikai válsága mélyül',
      'EU döntés hatása a helyi gazdaságra',
      'Brüsszeli tüntetések új szakaszba léptek',
    ],
  },
};
```

#### **2. API Integráció**

- **Mock rendszer lecserélése**
- **WebSocket kapcsolat új hírekhez**
- **Real-time notification system**
- **Error handling és retry logika**

#### **3. Performance Optimalizálás**

- **Component memoization**
- **Event listener optimalizálás**
- **Bundle size reduction**
- **Memory leak prevention**

### **🔮 HOSSZÚ TÁVÚ FEJLESZTÉSEK (1+ hónap)**

#### **1. Fejlett Notification Features**

- **Push notification támogatás**
- **Email notification integráció**
- **Custom notification rules**
- **User preference system**

#### **2. Analytics és Metrics**

- **User interaction tracking**
- **Performance metrics**
- **A/B testing framework**
- **Conversion rate optimization**

#### **3. Advanced UX Features**

- **Drag-and-drop notification management**
- **Custom notification sounds**
- **Dark/light theme support**
- **Keyboard shortcuts**

---

## 🔧 **TECHNIKAI SPECIFIKÁCIÓK**

### **Rendszerkövetelmények:**

- **React**: 18.0+
- **TypeScript**: 4.5+
- **CSS Modules**: Támogatás szükséges
- **Modern ES6+**: Arrow functions, async/await

### **Browser Support:**

- **Chrome**: 90+
- **Firefox**: 88+
- **Safari**: 14+
- **Edge**: 90+

### **Performance Targets:**

- **First Paint**: < 100ms
- **Interaction Response**: < 50ms
- **Animation FPS**: 60 FPS
- **Bundle Size**: < 50KB

---

===================================================

Rendben, megvizsgáltam a TabNotifications rendszert és megértem, hogy a következő fejlesztési lépcsőről szeretnénk tervezni: a mock rendszer lecseréléséről valós API integrációra. A kérésnek megfelelően csak tervezni fogunk, nem írunk kódot.

# 📋 TabNotifications API Integráció - Tervezési Dokumentum

## 🎯 **CÉLKITŰZÉS**

Lecserélni a jelenlegi mock adatokat valós API integrációra, hogy a felhasználók valódi, valós idejű értesítéseket kapjanak az új hírekről.

## 🏗️ **ARCHITEKTÚRA TERV**

### **1. API Kommunikációs Réteg**

#### 1.1 **WebSocket Kapcsolat Felépítése**

- A kliens csatlakozik a szerverhez WebSocket kapcsolaton keresztül
- Minden felhasználói munkamenethez egyedi kapcsolati azonosító
- Kapcsolat automatikus újraépítése hálózati problémák esetén

```typescript
// Tervezett interfész - nem implementáció
interface NotificationSocketConfig {
  endpoint: string;
  reconnectAttempts: number;
  reconnectDelay: number;
  authToken?: string;
}
```

#### 1.2 **Notification API Endpoints**

- `GET /api/notifications/status` - Globális notification státusz lekérése
- `GET /api/tabs/{tabId}/notifications` - Tab-specifikus notification adatok
- `POST /api/notifications/settings` - Felhasználói beállítások mentése
- `PUT /api/notifications/{notificationId}/read` - Olvasottnak jelölés

### **2. Adatkezelési Modell**

#### 2.1 **Notification Entitások**

```typescript
// Tervezett struktúra
interface NotificationData {
  id: string;
  tabId: string;
  timestamp: number;
  type: 'news' | 'system' | 'alert';
  title: string;
  preview: string;
  priority: 'low' | 'medium' | 'high';
  read: boolean;
  url?: string;
  metadata?: Record<string, any>;
}
```

#### 2.2 **Adattárolási Stratégia**

- Lokális React state - aktív session
- Redux/Context - alkalmazás szintű állapot
- LocalStorage - perzisztens beállítások
- IndexedDB - nagyobb mennyiségű offline adattárolás

### **3. Valós Idejű Kommunikáció**

#### 3.1 **WebSocket Eseménykezelés**

- `notification:new` - Új értesítés érkezett
- `notification:update` - Értesítés frissült
- `notification:read` - Értesítés olvasottnak jelölve
- `connection:error` - Kapcsolati probléma
- `system:maintenance` - Rendszerkarbantartás jelzése

#### 3.2 **Üzenetformátum**

```typescript
// Példa WebSocket üzenet formátum
interface WebSocketMessage {
  event: string;
  payload: any;
  timestamp: number;
  requestId?: string; // Korrelációs azonosító kétirányú kommunikációhoz
}
```

## 🔄 **IMPLEMENTÁCIÓS TERV**

### **1. API Kliensréteg Fejlesztése**

#### 1.1 **NotificationApiClient**

- Absztrakt réteget biztosít az API hívásokhoz
- Kezeli az autentikációt és hibaállapotokat
- Retry logikát implementál átmeneti hibákra

#### 1.2 **WebSocketManager**

- Singleton osztály a WebSocket kapcsolat kezelésére
- Event-alapú interfész az értesítésekhez
- Automatikus újracsatlakozás exponenciális backoff-fal

### **2. Hook Rendszer Átalakítása**

#### 2.1 **useNotificationApi Hook**

```typescript
// Tervezett hook interface
const useNotificationApi = (tabId: string) => {
  // Visszatérési értékek
  return {
    notifications: NotificationData[],
    unreadCount: number,
    isLoading: boolean,
    error: Error | null,
    markAsRead: (notificationId: string) => Promise<void>,
    refresh: () => Promise<void>,
    subscribe: (callback: (data: NotificationData) => void) => () => void
  };
}
```

#### 2.2 **Notification Provider**

- Context API alapú globális notification állapotkezelés
- Központosított helyről szolgálja ki a hook-okat
- Deduplikálja a párhuzamos API kéréseket

### **3. Hibakezelési Stratégia**

#### 3.1 **Hibatípusok**

- Hálózati hibák - átmeneti kapcsolati problémák
- Autentikációs hibák - lejárt token, hozzáférési problémák
- Szerverhibák - 5xx jellegű válaszok
- Alkalmazás hibák - üzleti logikai problémák

#### 3.2 **Retry Mechanizmus**

- Exponenciális backoff algoritmus
- Maximális újrapróbálkozások száma
- Kategóriánként eltérő retry stratégia

#### 3.3 **Fallback Mechanizmus**

- Helyi cache használata API hibák esetén
- Graceful degradation - alapfunkciók működése offline módban
- Felhasználói visszajelzés problémákról

## 🧪 **TESZTELÉSI STRATÉGIA**

### **1. Egységtesztek**

- API kliens metódusainak tesztelése mock válaszokkal
- WebSocket kezelő állapotainak és eseményeinek tesztelése
- Hook-ok izolált tesztelése

### **2. Integrációs Tesztek**

- API és WebSocket kommunikáció tesztelése valós szerver ellen
- Komponensek és API réteg együttes tesztelése
- Teljes értesítési folyamat tesztelése end-to-end

### **3. Terheléstesztek**

- Nagy mennyiségű értesítés kezelésének tesztelése
- WebSocket kapcsolat stabilitása hosszú időn keresztül
- UI teljesítmény sok értesítés esetén

## 📊 **TELJESÍTMÉNYMUTATÓK**

- **Válaszidő**: < 300ms az értesítések megjelenítésére
- **Kapcsolat újraépítése**: < 2s hálózati problémák után
- **Memóriahasználat**: < 5MB extra felhasználás a notification rendszerrel
- **CPU terhelés**: < 5% átlagos terhelés a háttérben futó WebSocket kapcsolatnál

## 🛣️ **FEJLESZTÉSI ÜTEMTERV**

### **1. Fázis: Alapok (2 hét)**

- API kliens implementáció
- WebSocket kapcsolatkezelő
- Alapvető error handling

### **2. Fázis: UI Integráció (1 hét)**

- Hook rendszer átalakítása
- Badge és HoverPanel komponensek bekötése
- Offline működés támogatása

### **3. Fázis: Finomhangolás (1 hét)**

- Teljesítményoptimalizálás
- Edge case-ek kezelése
- Dokumentáció és kód minőség

## 🌟 **VÁRHATÓ ELŐNYÖK**

- **Valós idejű értesítések**: Azonnali visszajelzés új hírekről
- **Megbízhatóság**: Robusztus hibakezelés és visszaállási stratégia
- **Alacsony erőforrásigény**: Optimalizált kommunikáció és adattárolás
- **Fejleszthetőség**: Tiszta, jól strukturált API absztrakció

# Ez a terv biztosítja, hogy a TabNotifications rendszer mock adatai gördülékenyen lecserélhetők legyenek valós API integrációra, miközben megőrizzük a felhasználói élményt és biztosítjuk a rendszer megbízhatóságát.
