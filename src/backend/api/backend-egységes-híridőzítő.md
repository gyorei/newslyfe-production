## 🔍 **BACKEND STRUKTÚRA RÉSZLETES ELEMZÉSE - JAVÍTOTT TERV**

A backend áttekintése alapján **csak az időkezelést egységesítjük**, a három modul (Local, Country, Continent) **külön marad** különböző logikájuk miatt.

### **📂 JELENLEGI BACKEND STRUKTÚRA:**

```
src/backend/
├── server/                    # ✅ Infrastruktúra (jó)
│   ├── config/
│   ├── data/PostgreSQLDataAccess.ts
│   ├── logger.ts
│   └── middleware/
│
├── api/
│   ├── routes/               # ✅ KÜLÖN MARADNAK - különböző logika
│   │   ├── Local/Local.ts    # Van időszűrés ✅ + saját RSS logika
│   │   ├── Country/Country.ts # Nincs időszűrés ❌ + saját NewsService
│   │   ├── Continent/Continent.ts # Nincs időszűrés ❌ + saját RSS logika
│   │   └── index.ts
│   │
│   └── utils/               # ⚠️ Részben jó
│       └── cacheUtils.ts    # ✅ Már létezik
```

### **✅ TISZTÁZÁS - MIT NEM VÁLTOZTATUNK:**

#### **1. RSS feldolgozás marad háromszor implementálva:**

- `Local.ts`: `fetchAndParseRssFeed()` - **MARAD** (saját logika)
- `Country.ts`: `NewsService` osztály - **MARAD** (saját logika)
- `Continent.ts`: `fetchAndParseRssFeed()` - **MARAD** (saját logika)

#### **2. Különböző típusdefiníciók maradnak:**

- `Local.ts`: `ProcessedRssItem`, `RssSource` - **MARAD**
- `Country.ts`: `NewsItem`, `SourceRow` - **MARAD**
- `Continent.ts`: `ProcessedRssItem`, `RssSource` - **MARAD**

#### **3. Modulok külön fejleszthetők:**

- Minden modul saját logikáját fejleszti tovább
- Nincs kényszerű egységesítés

## 🎯 **MINIMÁLIS STRUKTÚRA TERV - CSAK IDŐKEZELÉS:**

### **Új mappák és fájlok csak az időkezeléshez:**

```
src/backend/api/
├── config/                   # ÚJ - Csak időkonfigurációk
│   └── timeConfig.ts         # Egységes időszűrés beállítások
│
├── utils/                    # KIBŐVÍTÉS - Csak időkezelés
│   ├── cacheUtils.ts         # ✅ Már létezik
│   └── timeUtils.ts          # ÚJ - Csak időszűrési függvények
│
└── routes/                   # ✅ VÁLTOZATLAN - Minden modul külön marad
    ├── Local/Local.ts        # Saját RSS + közös időkezelés
    ├── Country/Country.ts    # Saját NewsService + közös időkezelés
    ├── Continent/Continent.ts # Saját RSS + közös időkezelés
    └── index.ts
```

## 📋 **HOVA KERÜLNEK CSAK AZ IDŐKEZELŐ KÓDOK:**

### **1. `src/backend/api/config/timeConfig.ts`**

```typescript
// CSAK időkonfigurációk mindhárom API-hoz
export const TIME_CONFIG = {
  DEFAULT_MAX_AGE_HOURS: 24,
  MIN_AGE_HOURS: 1,
  MAX_AGE_HOURS: 168,
  PRESET_OPTIONS: [
    { label: 'Utolsó 1 óra', hours: 1 },
    { label: 'Utolsó 6 óra', hours: 6 },
    { label: 'Utolsó 24 óra', hours: 24 },
    { label: 'Utolsó 3 nap', hours: 72 },
    { label: 'Utolsó hét', hours: 168 },
  ],
};
```

### **2. `src/backend/api/utils/timeUtils.ts`**

```typescript
// CSAK időszűrési segédfüggvények
export function validateMaxAgeHours(maxAgeHours: string | undefined): number;
export function calculateCutoffTimestamp(maxAgeHours: number): number;
export function filterNewsByAge(newsItems: any[], maxAgeHours: number): any[];
export function addTimeMetadata(maxAgeHours: number, cutoffTimestamp: number): object;
```

### **3. Minden route modul importálja a közös időkezelést:**

```typescript
// Local.ts, Country.ts, Continent.ts mindegyikben:
import { TIME_CONFIG } from '../../config/timeConfig';
import {
  validateMaxAgeHours,
  calculateCutoffTimestamp,
  filterNewsByAge,
} from '../../utils/timeUtils';
```

## 🔄 **MINIMÁLIS REFAKTORÁLÁS:**

### **✅ Előnyök:**

1. **Minimális változtatás** - Csak időkezelés egységesítése
2. **Modulok maradnak külön** - Saját logikájuk megmarad
3. **RSS marad háromszor** - Nincs bonyolult átszervezés
4. **Egyszerű implementálás** - Csak 2 új fájl
5. **Könnyen tesztelhető** - Kis változtatás

### **🎯 Egyszerű implementálási sorrend:**

1. **`timeConfig.ts`** létrehozása - időkonfigurációk
2. **`timeUtils.ts`** létrehozása - időszűrési függvények
3. **Minden route modul** - import és használat hozzáadása

**Ez a minimális megközelítés biztosítja, hogy az időszűrés egységesen működjön mindhárom hírlekérdezési formánál, de a modulok saját logikája változatlan marad!**

=========================================
