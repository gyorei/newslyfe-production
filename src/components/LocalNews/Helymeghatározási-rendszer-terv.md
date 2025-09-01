# Helymeghatározási rendszer terv

## A felhasználói élmény folyamata

### 1. Kezdeti interakció

- A felhasználó a "Helyi hírek" / "Lokális" gombra kattint
- Felugrik egy **tájékoztató modális ablak**, amely bemutatja a helymeghatározás előnyeit

### 2. Tájékoztató modális ablak

- **Cím**: "Helyi hírekhez helymeghatározás szükséges"
- **Leírás**: Rövid tájékoztató arról, miért fontos a helymeghatározás a helyi hírek személyre szabásához
- **Tartalom**:
  - Az aktuálisan beállított hely megjelenítése (pl. "Jelenleg beállított ország: Magyarország")
  - Tájékoztatás a beállítási lehetőségekről (3 módszer felsorolása)
- **Gombok**:
  - "Beállítások megnyitása" - A beállítások oldalra navigál
  - "Helyi hírek megtekintése a jelenlegi beállítással" - Bezárja az ablakot és betölti a helyi híreket
  - "Bezárás" - Egyszerűen bezárja az ablakot

### 3. Beállítások oldal/szekció

Ez egy külön oldal vagy a beállítások menüpont egy szekciója lenne:

- **Helymeghatározási beállítások cím**
- **Helymódszer választó** (rádiógombok vagy kapcsolók):
  1. **Automatikus (böngésző alapján)** - A böngésző nyelve alapján határozza meg az országot
  2. **Pontos helymeghatározás (GPS)** - GPS alapú, pontos helymeghatározás
  3. **Kézi kiválasztás** - Az országlistából való választás
- **Országválasztó legördülő menü** (csak ha a kézi kiválasztás aktív)
- **Mentés gomb** - A beállítások mentése
- **Adatvédelmi tájékoztató** - Rövid szöveg arról, hogyan használjuk a helyadatokat

## Előnyök

1. **Nem zavaró**: A felhasználó eldöntheti, mikor szeretne foglalkozni a helymeghatározással
2. **Informatív**: Tájékoztatja a felhasználót a lehetőségeiről anélkül, hogy döntésre kényszerítené
3. **Következetes**: A beállítások egy központi helyen történnek
4. **Átlátható**: A felhasználó tudja, hogyan és miért használjuk a helyadatait

## Jövőbeli fejlesztési lehetőségek

- **Emlékeztető funkció**: Ha a felhasználó nem állít be helyet, emlékeztethetjük később
- **Fokozatos folyamat**: A felhasználó először látja a helyi híreket, majd felajánljuk a pontosítást
- **Helytörténet**: Lehetőség több helyszín elmentésére (pl. otthon/munka)
- **Ideiglenes helyváltoztatás**: Utazáskor ideiglenes hely beállítása egy adott időtartamra

# Ez a megközelítés tiszteletben tartja a felhasználó döntési szabadságát, miközben informatív és átlátható módon kínálja a különböző helymeghatározási lehetőségeket.
