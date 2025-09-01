📁 Panel/
├── 📄 Panel.tsx (Fő komponens)
├── 📄 Panel.module.css (Panel stílusok)
├── 📁 LoadMoreButton/ (További hírek betöltése gomb)
└── 📁 PanelHead/ (Panel fejléc)
├── 📄 index.ts
├── 📄 PanelHead.tsx
└── 📄 PanelHead.module.css

✅ MIT TARTALMAZ JELENLEG:
🎯 FORRÁS IKONOK - ✅ MEGVAN!
PanelHead.tsx-ban implementálva
Vízszintesen görgethető ikonsor
Google Favicon API használatával
Touch és egérkerék támogatás
Demo források beépítve (Origo, Index, BBC, CNN, stb.) ezt ellenőrizni kell mért vannak bent!!!!
🔄 FRISSÍTÉS GOMB - ✅ MEGVAN! ezt át kell majd helyezni.
Jobb felső sarokban elhelyezve
Forgó animáció hover-nél
Panel újratöltés funkcionalitás

========================================================
src\components\Panel\TabSearchPanel.tsx
src\components\Panel\TabSearchPanel.module.css

Összefoglalva a teendők, ha készen állsz:
1) Navbar/kereső felület görgetősávját sötétre állítani — CSS módosítás a megfelelő modulban (pl. Panel.module.css vagy a kereső komponens CSS-e), dark scrollbar szelektorokkal.
2) Alsó oldalszámok megjelenítése — a TabPanel/TabSearchPanel komponensben fallback pager vagy a Pagination komponens markupjára célzott CSS/JS megoldással.

