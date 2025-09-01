# Content komponens és useNewsData hook – Böngészőszintű async védelem

Ez a mappa tartalmazza a Content fő React komponensét és a hozzá tartozó adatkezelő hookokat, amelyek a modern böngészők szintjén biztosítanak adatkonzisztenciát, cache-t és race condition elleni védelmet.

## Főbb megoldások

- **Tab-alapú cache**: Minden tabhoz külön cache tartozik, így tabváltáskor azonnal jelenik meg a tartalom, csak explicit frissítéskor tölt újra adatot.
- **Scroll pozíció mentés**: Minden tabhoz külön scroll pozíciót tárolunk, így tabváltáskor pontosan visszaáll a pozíció.
- **requestToken + AbortController**: Minden tabváltáskor egyedi token és új AbortController jön létre. Minden async fetch előtt ellenőrizzük az abortSignal-t, utána pedig a requestToken-t. Ha nem egyezik, a választ eldobjuk, így nincs race condition.
- **Időbélyeges cache**: 30 másodpercig ugyanaz a kérés nem fut le újra, a cache mérete limitált.
- **UI/UX**: Ha van cache, a tartalom azonnal látszik, csak egy kis spinner jelenik meg. Ha nincs cache, teljes loading overlay.

## Analógia
- **Navigation Token**: Mint a böngésző tabváltásnál, minden navigációhoz egyedi token tartozik.
- **AbortController**: Mint a böngésző fetch stackjében, minden tabváltáskor azonnal megszakadnak a régi kérések.

## Kódhelyek
- `Content.tsx`: Tabváltás, requestToken/AbortController generálás, prop chain.
- `hooks/useNewsData.ts`: Async fetch, cache, token/abort védelem, state update csak valid token esetén.



Tökéletesen összefoglaltad, és teljesen igazad van:  
- Az **AbortSignal** átadása a fetch-nek mindig hasznos, ha a frontend fetch API-t használ, függetlenül attól, hogy a backend „tud-e” róla – a lényeg, hogy a kliens oldalon a fetch megszakad, és nem fut le feleslegesen a válaszfeldolgozás.
- A backendnek csak annyi a dolga, hogy ne tartson örökké egy kérés, és jól kezelje a kapcsolat lezárását (de ez már szerver oldali best practice).

---

## **fetchContinentNews véglegesítése: signal átadás**

A fetchContinentNews-ban mostantól így nézzen ki a fetch hívás:

```ts
try {
  const response = await fetch(url, { signal: abortSignal });
  if (!response.ok) throw new Error(`API hiba: ${response.status} ${response.statusText}`);
  const data = await response.json();
  // ... token check, feldolgozás
} catch (error: any) {
  if (error.name === 'AbortError') {
    console.warn('[fetchContinentNews] ⛔ Fetch megszakítva AbortController-rel');
    return [];
  }
  throw error;
}
```

- **Előny:**  
  - Ha tabváltás vagy bezárás történik, a fetch azonnal megszakad, nem terheli a hálózatot, nem fut le a felesleges feldolgozás.
  - A React komponensben a state sem frissülhet már, mert a catch blokkból rögtön visszatérünk.

---

## **Mit jelent ez a gyakorlatban?**
- **Minden tabváltás = izolált processz** (mint a Chrome tabok)
- **Nincs többé race condition vagy state pollution**
- **A fetch-ek azonnal megszakadnak, ha már nem relevánsak**
- **A logokban minden ütközés, megszakítás jól látható**

---

**Ha szeretnéd, be is építem ezt a végső fetch signal átadást a fetchContinentNews függvénybe! Szólj, ha kéred a konkrét módosítást.** 🚀

## Karbantartó
- Utolsó frissítés: 2024-06

---

## 2024-07 JAVÍTÁS: forceRefresh (API frissítés) lánc végleges megoldása

- A Local gomb minden megnyomására garantáltan friss adat jön az API-ból, nincs többé beragadt cache!
- A filterláncban a forceRefresh flag végigmegy, a Content, useNewsData, és FrontLocal minden rétegében helyesen átadódik.
- A useNewsData.ts-ben a prepareFilters hívás már az aktuális forceRefresh értéket adja át, nem fixen false-t.
- A Content.tsx useEffect-je már az activeTab.filters változására is lefut, így minden filterváltás új adatbetöltést indít.

---
