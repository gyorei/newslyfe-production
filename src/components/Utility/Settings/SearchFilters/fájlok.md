A logok alapján látom a problémát! 

**Mi történik jelenleg:**
1. ✅ Keresés sikeres: 70 hír találat
2. ✅ TabPanel elküldi a 3 ország opciót a SearchFiltersBridge-en: `OPTIONS_INIT: 3 country options`
3. ❌ **DE** a SearchResultsMetadataBridge **0 országot** küld: `Új metaadat fül tab-1755681829065-hez: 0 országok`
4. ❌ SearchFilters ezért nem inicializálja a szűrőt
5. ❌ TabPanel ezért "DESELECT ALL" állapotban marad: `selectedCountries: Array(0)`

**A probléma forrása:**
Két külön bridge működik egymás mellett, de **rossz sorrendben**:
- SearchFiltersBridge: OPTIONS_INIT (3 ország) ✅
- SearchResultsMetadataBridge: 0 ország ❌

**Megoldási terv:**
1. **Egyszerűsítés**: Csak 1 bridge-et használjunk (SearchFiltersBridge)
2. **SearchFilters**: Az OPTIONS_INIT üzenetre automatikusan Select All
3. **Időzítés**: Biztosítsuk, hogy az inicializálás minden esetben megtörténjen

**Kérdések a tervezéshez:**
1. Törölhetsük a SearchResultsMetadataBridge-et, és csak a SearchFiltersBridge-et használjuk?
2. Vagy javítsuk a SearchResultsMetadataBridge-et, hogy valóban küldje el a 3 országot?
3. Melyik bridge-et tartsuk meg hosszú távon?

**Javaslatom:** 
Maradjunk a SearchFiltersBridge-nél, mert az működik (3 országot küld). A SearchFilters komponensben pedig az OPTIONS_INIT üzenetre automatikusan állítsuk be a Select All-t.

Mit gondolsz, melyik utat válasszuk?
==============================================================

