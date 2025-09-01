# Képnélküli hírek alternatív elrendezésének javaslata

Ez egy remek ötlet a képnélküli hírek újszerű megjelenítésére! Íme a javaslatom:

## Horizontális görgetés koncepció

A képnélküli hírek vízszintesen görgethető konténerben való elrendezése számos előnyt kínál:

1. **Helytakarékosság**: Nem vesz el értékes függőleges helyet, amely lehetővé teszi több képes hír megjelenítését
2. **Vonzó UX**: A horizontális görgetés egy modern, alkalmazás-szerű felhasználói élményt biztosít
3. **Differenciálás**: Egyértelműen elkülöníti a képes és képnélküli híreket, de mégis hozzáférhetővé teszi őket

## Megvalósítási koncepció

Az elképzelés szerint:

- **Képes hírek**: Megmaradnak a jelenlegi kártya formátumban, egymás alatt
- **Képnélküli hírek**: Horizontálisan görgethető sorokban jelennek meg
- **Elhelyezkedés**: 8-10 képes hír után egy horizontális konténer, majd újra képes hírek
- **Csoportosítás**: A felhasználó beállíthatja, hogy hány képnélküli hír lehet egy konténerben (pl. 5, 10, 15)

## Felhasználói beállítások

A ContentSettings komponensben két új beállítást vezetnénk be:

1. **Képnélküli hírek megjelenítése**:
   - Kártya formátum (jelenlegi, 3 hír/kártya)
   - Horizontális görgetés (új megoldás)

2. **Hírek száma konténerenként**:
   - Választható értékek: 5, 10, 15, 20
   - Csak akkor aktív, ha a horizontális megjelenítés van kiválasztva

## Vizuális koncepció

```
┌───────────────────────────────────────┐
│  [Képes hír kártya]                   │
├───────────────────────────────────────┤
│  [Képes hír kártya]                   │
├───────────────────────────────────────┤
│  [Képes hír kártya]                   │
├───────────────────────────────────────┤
│ ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐ >>   │
│ │Hír 1│ │Hír 2│ │Hír 3│ │Hír 4│      │
│ └─────┘ └─────┘ └─────┘ └─────┘      │
├───────────────────────────────────────┤
│  [Képes hír kártya]                   │
├───────────────────────────────────────┤
│  [Képes hír kártya]                   │
├───────────────────────────────────────┤
│ ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐ >>   │
│ │Hír 1│ │Hír 2│ │Hír 3│ │Hír 4│      │
│ └─────┘ └─────┘ └─────┘ └─────┘      │
└───────────────────────────────────────┘
```

## Előnyök

1. **Vizuális hierarchia**: A képes hírek nagyobb hangsúlyt kapnak, de a képnélküli hírek is jól elérhetőek
2. **Testre szabhatóság**: A felhasználó megválaszthatja a számára legjobb megjelenítést
3. **Hatékonyság**: Ugyanannyi helyen több hírt tud megjeleníteni
4. **Modernebb UX**: A horizontális görgetés a modern alkalmazások bevett UX eleme

## Implementálási szempontok

- A horizontális konténer CSS `overflow-x: auto` tulajdonsággal rendelkezne
- A képnélküli hírek egyszerűsített, kompakt kártyákként jelennének meg
- Görgetési indikátorok (jobbra nyilak) jelzik, hogy van még tartalom
- Érintéses eszközökön természetes swipe gesztussal használható

Ez az új elrendezés jól illeszkedne a modern hírolvasó alkalmazás koncepciójához, miközben megőrzi az olvashatóságot és felhasználói kontrollálhatóságot.
