# 📰 News Detection Modul

## 🎯 Célja

Új hírek detektálása és értesítés kezelése tab-ok szerint.

## 📁 Fájlstruktúra

```
src/utils/newsDetection/
├── types.ts              ← TypeScript interface-ek
├── NewsStorage.ts        ← localStorage wrapper
├── NewNewsDetector.ts    ← Fő detection logika
├── index.ts              ← Export barrel
└── README.md             ← Ez a dokumentáció
```

## 🔧 Használat

```typescript
import { NewNewsDetector } from '@/utils/newsDetection';

const detector = new NewNewsDetector();
const newCount = await detector.detectNewNews('hungary-tab');
```

## 📊 Működési Elv

### 1. **Timestamp Alapú Detection**

- Utolsó ellenőrzés timestamp tárolása
- Új hírek timestamp > utolsó ellenőrzés
- Pontos detektálás

### 2. **localStorage Tárolás**

- Tab állapotok mentése
- Felhasználói interakciók nyomon követése
- Persistent state

### 3. **Event + Polling Hybrid**

- Elsődleges: Event alapú frissítés (azonnali)
- Másodlagos: Intelligens polling (biztonsági háló)

## 🚀 Fejlesztési Fázisok

### **FÁZIS 1** _(Jelenlegi - MVP)_

- [x] Alap fájlstruktúra
- [ ] Timestamp alapú detection
- [ ] localStorage tárolás
- [ ] Minimális API

### **FÁZIS 2** _(Következő)_

- [ ] Event alapú frissítés
- [ ] Intelligens polling
- [ ] Badge integráció

### **FÁZIS 3** _(Jövőbeli)_

- [ ] IndexedDB migráció
- [ ] Performance optimalizálás
- [ ] WebSocket támogatás

## 🎯 API Referencia

### `NewNewsDetector`

```typescript
class NewNewsDetector {
  // Új hírek detektálása
  async detectNewNews(tabId: string): Promise<number>;

  // Tab megtekintettként jelölése
  markTabAsViewed(tabId: string): void;

  // Debug információk
  getDebugInfo(tabId: string): DetectionDebugInfo;
}
```

### `NewsStorage`

```typescript
class NewsStorage {
  // Utolsó ellenőrzés mentése/betöltése
  saveLastCheck(tabId: string, state: LastCheckState): void;
  getLastCheck(tabId: string): LastCheckState | null;

  // Teljes törlés
  clearAll(): void;
}
```

## 🔍 Debug Mode

```typescript
// Development környezetben részletes logolás
if (process.env.NODE_ENV === 'development') {
  console.log('News Detection Debug:', detector.getDebugInfo('tab-id'));
}
```

---

**Verzió:** 1.0.0-MVP  
**Utolsó frissítés:** 2025.06.01  
**Állapot:** 🚧 Fejlesztés alatt
