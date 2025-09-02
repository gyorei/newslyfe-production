# NewsTide-backend

## Backend Architektúra

### Dual Package Megoldás

A projektben a backend könyvtár saját `package.json` fájlt tartalmaz. Ez a konfiguráció szükséges a **modultípus-konfliktus** feloldására:

- A főprojekt (`"type": "module"`) - ES modulokat használ (frontend React kód)
- A backend (`"type": "commonjs"`) - CommonJS modulokat használ (Node.js backend)

#### Miért van erre szükség?

A Node.js különbözőképpen kezeli a JavaScript fájlokat attól függően, hogy milyen típusú modulként vannak definiálva:

1. **ES modulok**:
   - Modern `import`/`export` szintaxis
   - A frontend (React, Vite) ezt használja
   - Statikus import/export

2. **CommonJS modulok**:
   - Hagyományos `require()`/`module.exports` szintaxis
   - A backend kód erre támaszkodik
   - `require.main === module` ellenőrzések

A projekt struktúrája miatt külön `package.json` szükséges a `backend` mappában, hogy megőrizzük a CommonJS funkcionalitást.

---

## Backend indítása

### Fejlesztési környezet

```bash
# Frontend és backend együttes indítása fejlesztési módban
npm start
# vagy
npm run dev:all

# Csak backend indítása
npm run dev:backend
```

### Produkciós környezet

```bash
# Fordítás és indítás
npm run build:all    # Frontend és backend fordítása
npm run start:prod   # Fordított backend indítása

# Csak backend fordítása és indítása
npm run build:backend
npm run start:backend
```

## Architektúra áttekintése

A backend két fő részből áll:

### 1. Szerver Modul (`server/`)

- **Felelősségi kör**: Infrastruktúra
- Szerver indítás és leállítás
- Adatbázis kapcsolat kezelése
- Middleware konfigurálás
- Környezeti beállítások

### 2. API Modul (`api/`)

- **Felelősségi kör**: Üzleti logika
- API végpontok implementációja
- Adatmanipuláció és adatszolgáltatás
- Hibakezelés

### Adatbázis kezelés

- Az adatbázis kapcsolatot a **szerver modul** kezeli (`server/db/database.ts`)
- Az API modul importálja és használja a `db` objektumot
- Kapcsolat:
  ```typescript
  import { db } from '../server/db/database';
  ```

## Használat

1. Telepítsd a függőségeket: `npm install`
2. Indítsd el fejlesztési módban: `npm run dev:all`
3. Érd el a szervert: http://localhost:3002
4. API végpontok: http://localhost:3002/api