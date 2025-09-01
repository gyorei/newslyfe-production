Összefoglalom a helyzetet és a célokat:

---

## Mit akarunk elérni?

- **Cél:**  
  A keresési találatok (pl. navbar keresővel indított keresés, pl. "trump") is ugyanúgy cache-be kerüljenek, mint az országos hírek, és oldalfrissítés (F5) után is visszatölthetők legyenek – vagyis a keresési tabon a találatok jelenjenek meg, ne a főhírek.

---

## Hol tartunk most?

- **Országos hírek cache:**  
  A TabPanel.tsx-ben a sima hírek (mode: 'news') cache-elése tökéletesen működik.  
  A cache mentés csak akkor fut le, ha a tab aktív, van hír, a mode 'news', és nem tölt be éppen.

- **Keresési találatok cache:**  
  Már beépítettük a cache mentést és visszatöltést a TabSearchPanel-be is,  
  - a keresési találatok mentésekor a meta.searchTerm most már derivedSearchTerm (tehát a keresési kifejezés, akár a tabTitle-ből is).
  - A visszatöltésnél is derivedSearchTerm alapján keresünk a cache-ben.

- **Prop átadás:**  
  A Content.tsx-ben a TabSearchPanel minden szükséges propot megkap (activeTabId, tabTitle).

---

## Mit módosítottunk eddig?

- A TabPanel-ben és TabSearchPanel-ben a cache mentési és visszatöltési logikát úgy módosítottuk, hogy:
  - A keresési találatok is cache-be kerülnek (nem csak a sima hírek).
  - A cache metaadataiban a keresési kifejezés (searchTerm) derivedSearchTerm, így F5 után is visszakereshető.
  - A cache visszatöltés derivedSearchTerm alapján történik, így a tabTitle-ből is ki tudjuk nyerni a keresési szót, ha a searchTerm üres.
- A Content.tsx-ben minden keresési tabnál átadjuk a tabTitle-t és activeTabId-t a TabSearchPanel-nek.

---

## Mi a jelenlegi probléma?

- A logok alapján a főhírek cache-elése és visszatöltése működik,  
  de a keresési tabnál (navbar kereső) a cache mentés/visszatöltés még nem minden esetben tökéletes.
- Lehetséges okok:
  - A keresési tabId vagy tabTitle nem stabil F5 után.
  - A cache mentés/visszatöltés derivedSearchTerm-je nem egyezik a cache meta.searchTerm-mel.
  - A cache mentési useEffect nem fut le minden keresésnél.

---

## Következő lépések

1. **Ellenőrizni kell, hogy a keresési tabId és tabTitle F5 után is stabil-e.**
2. **A cache mentésnél derivedSearchTerm-et kell használni minden keresési tabnál.**
3. **A cache visszatöltés derivedSearchTerm alapján történjen.**
4. **A logokban ellenőrizni kell, hogy a keresési találatok mentése és visszatöltése is megtörténik-e (pl. trump keresésnél).**

---

**Ha ezek teljesülnek, a keresési találatok is cache-ből visszatölthetők lesznek, nem csak a főhírek!**


===========================================================
