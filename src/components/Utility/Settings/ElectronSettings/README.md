# ElectronSettings Component

## Overview
The ElectronSettings component provides desktop application-specific settings that are only available in the Electron desktop app, not in web browsers.

## Structure
```
ElectronSettings/
├── ElectronSettings.tsx          # Main container component
├── ElectronSettings.module.css   # Styling for the container
├── WindowSettings.tsx            # Window style settings
├── WindowSettings.module.css     # Styling for window settings
├── ArticleViewSettings/          # Article view mode settings
│   ├── ArticleViewSettings.tsx
│   └── ArticleViewSettings.module.css
└── README.md                     # This file
```

## Features

### Desktop App Notice
- Shows a prominent notice that these settings are desktop-only
- Uses gradient background and icon to distinguish from web settings

### Article View Settings
- Embedded View: Articles appear in place of news cards
- New Tab: Articles open in new tabs (future feature)
- Separate Window: Articles open in new Electron windows

### Window Style Settings
- Classic: Traditional window with frame and title bar
- Modern: Clean design with native close button
- Dark Theme: Dark background with light frame
- Compact: Smaller window with simple design

## Usage
This component is automatically loaded when the "Desktop App" category is selected in the main Settings component.

## Electron API Integration
All settings communicate with the Electron main process through the `window.electronAPI` interface:
- `getArticleViewMode()` / `setArticleViewMode()`
- `getArticleWindowStyle()` / `setArticleWindowStyle()`

Nagyszerű! Most nézzük át az ElectronSettings mappát, hogy minden rendben van-e:

Read file: src/components/Utility/Settings/ElectronSettings/ElectronSettings.tsx
Read file: src/components/Utility/Settings/ElectronSettings/WindowSettings.tsx
Ran tool
Read file: src/components/Utility/Settings/ElectronSettings/ArticleViewSettings/ArticleViewSettings.tsx
Read file: src/components/Utility/Settings/ElectronSettings/README.md
Tökéletes! Az ElectronSettings mappa teljesen rendben van! ��

## ✅ **Áttekintés - Minden rendben van:**

### **📁 Struktúra:**
- ✅ **ElectronSettings.tsx** - Fő konténer komponens
- ✅ **ElectronSettings.module.css** - Témához igazodó CSS
- ✅ **WindowSettings.tsx** - Ablakstílus beállítások
- ✅ **WindowSettings.module.css** - Görgetősáv elrejtve
- ✅ **ArticleViewSettings/** - Cikkmegjelenítési módok
- ✅ **README.md** - Dokumentáció

### **🎨 CSS Témarendszer:**
- ✅ **Minden CSS fájl** használja a CSS változókat
- ✅ **Görgetősáv elrejtve** minden komponensben
- ✅ **Sötét téma támogatás** teljes
- ✅ **Reszponzív design** megfelelő

### **⚙️ Funkciók:**
- ✅ **Desktop App figyelmeztetés** - világosan jelzi, hogy csak asztali alkalmazásban működik
- ✅ **Article View Settings** - 3 mód: Embedded, New Tab, Separate Window
- ✅ **Window Style Settings** - 4 stílus: Classic, Modern, Dark Theme, Compact
- ✅ **Electron API integráció** - `window.electronAPI` használata
- ✅ **Loading states** - betöltés és mentés állapotok
- ✅ **Error handling** - hibakezelés

### **�� Technikai részletek:**
- ✅ **TypeScript** típusok definiálva
- ✅ **React hooks** használata (useState, useEffect)
- ✅ **LocalStorage fallback** fejlesztés közben
- ✅ **Moduláris CSS** (CSS Modules)
- ✅ **Accessibility** - megfelelő ARIA attribútumok

### **🎯 Felhasználói élmény:**
- ✅ **Intuitív UI** - egyértelmű opciók ikonokkal
- ✅ **Visszajelzés** - checkmark-ok és loading állapotok
- ✅ **Ajánlott opciók** - "Recommended" badge
- ✅ **Témához igazodás** - világos/sötét mód támogatás

Az ElectronSettings komponens teljesen kész és használatra kész! 🚀