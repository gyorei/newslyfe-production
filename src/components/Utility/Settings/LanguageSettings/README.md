Összefoglaló — LanguageSettings fejlesztések

Röviden
--------
A LanguageSettings panelt integráltuk a rendszer jobb oldali Settings paneljébe, a headerből megnyithatóvá tettük, a nyelvkód dinamikusan jelenik meg a fejlécben (EN/HU), és az i18n nyelvváltás helyesen működik.

Fontos módosított fájlok és változtatások
----------------------------------------
- LanguageSettings/LanguageSettings.tsx
  - Eredeti inline stílusokat CSS modulra cseréltük és a nyelvválasztás select/részben gomb alapú UI-ra alakult.
  - Normalizáljuk az i18n nyelvkódot (pl. "en-US" → "en") és a languageNames térképet használjuk az olvasható nyelvnevekhez.
  - useTranslation használata, i18n.changeLanguage hívás biztosítva.

- LanguageSettings.module.css (javasolt/stílus)
  - Javasolt modern, letisztult CSS (doboz, select, gombok, fókusz). (Ha szeretnéd, beillesztem a fájlba.)

- Settings.tsx
  - A komponens megtartja a Language kategóriát és rendereli a <LanguageSettings />-t.
  - Hozzáadtunk egy opcionális propot (activeTabId), amivel külső hívásra átállítható az aktív kategória (useEffect-al).

- Header/Header.tsx
  - A header nyelvgomb most dinamikusan mutatja a nyelvkódot (headerLangCode), useTranslation(i18n)-t használ.
  - A gomb onClick-je meghívja openRightPanelWithMode?.('settings') (korábban payloadot adtunk át, ez el lett távolítva).

- App.tsx
  - A stableHeaderProps most tartalmazza az openRightPanelWithMode függvényt, így a Header megkapja azt.

- hooks/app/useAppPanels.ts
  - UtilityMode típus kibővítve ('savedNews','legal','premium').
  - (Opcionálisan) a hookot kiterjesztettük payload kezelésre (rightPanelPayload), de a Header jelenleg nem használ payloadot — így visszafelé kompatibilis marad.

- locales / i18n
  - i18n inicializáció és nyelvdetektálás ellenőrizve (localStorage 'lang' kulcs kezelése, document.documentElement.lang beállítása).

Tesztelési lépések (gyors)
--------------------------
1. Indítsd az alkalmazást.
2. A header jobb oldalán lévő nyelvgombon ellenőrizd a kódot (EN vagy HU).  
3. Kattints a nyelvgombra → jobb panel megnyílik settings módban.  
4. A Settings felületen válaszd a "Language" kategóriát.  
5. A LanguageSettings-ben válaszd a Magyar-t.  
6. Ellenőrizd: localStorage.getItem('lang') === 'hu' és document.documentElement.lang === 'hu'.  
7. A UI fordításai (useTranslation-t használó komponensek) frissülnek, és a headeren megjelenik "HU".

Megjegyzések
------------
- Jelenleg a Header nem ad át payloadot a megnyitott panelnek (szándékosan egyszerűsítettük). Ha később automatikus kategóriaváltást szeretnél (pl. közvetlenül a Language fülre ugrás), vissza lehet vezetni a payload-ot és továbbítani a rightPanelPayload-ot a Settings-nek.
- ESLint figyelmeztések (pl. üres interface) javítva vagy kommentelve lett, ahol szükséges.

Ha szeretnéd, beillesztem a javasolt LanguageSettings.module.css tartalmát, illetve összekötöm a rightPanelPayload továbbítást (automatikus Language fülre ugrás) — mondd, melyiket csináljam.
