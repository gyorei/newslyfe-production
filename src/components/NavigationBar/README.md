[◄] [►] [🔄] → NavigationControls komponens

Vissza/Előre/Frissítés gombok
Tab navigáció vezérlők
[🔍 Intelligens keresőmező] → SmartSearchBar komponens

Egyesített keresés és szűrés
Vivaldi-stílusú address bar
[⚙️] [ℹ️] → QuickActions komponens

Beállítások gomb
Információs panel gomb

src/components/NavigationBar/
├── NavigationBar.tsx ← Fő komponens
├── NavigationBar.module.css ← Stílusok
├── NavigationControls.tsx ← [◄] [►] [🔄] gombok
├── SmartSearchBar.tsx ← [🔍] keresőmező  
├── QuickActions.tsx ← [⚙️] [ℹ️] gombok
└── index.ts ← Export fájl

=============================================================

Nagyon jó kérdés — a [◄] [►] (vissza/előre) gombok egy hírolvasóban nem alapfunkciók, mint egy webböngészőben, de lehetnek hasznosak, attól függően, hogy milyen navigációs modell szerint működik az alkalmazásod.

💡 Mikor hasznos a [◄] [►] páros?

1. Oldal-történelem navigációhoz
   Ha a felhasználó különböző hírkategóriák, cikkek vagy keresések között navigál, akkor ezek a gombok visszaléphetnek egy korábbi állapotra:

[◄] vissza a főoldalra egy megnyitott cikkből

[◄] vissza egy korábbi keresésre

[►] újra előreléphet a visszalépés után

👉 Ez kvázi egy „mini-böngésző élmény” a saját appodon belül.

2. Kézi vezérlés, ha nincs klasszikus „routolás”
   Ha nincs külön URL vagy router (mint pl. egy SPA appban), ezek a gombok imitálhatják a history-t.

🔁 A [🔄] gomb szerepe
Ez mindenképp hasznos:

A hírek frissítésére (cache invalidálás, új hírek betöltése)

Kézi újratöltés, ha automatikus frissítés van, de a user nem akar várni

🔍 Intelligens keresőmező
Ez nagyon jól hangzik — kombinálható:

Autocomplete javaslatokkal

Kategória-felismeréssel („Orbán Viktor” → politika)

Időalapú szűréssel („tegnapi hírek” → időfilter)

Javasolt finomítás a UI-ra:
less
Másolás
Szerkesztés
[◄] [►] [🔄] | 🔍 [ Keresés: "intelligens keresés…" ]
Vagy külön szekcióban a navigáció:

less
Másolás
Szerkesztés
📚 Hírfolyam navigáció: [◄ Előző] [Következő ►] [Frissítés 🔄]
Alternatíva: Ne legyen [◄] [►], ha…
Csak lapozós listanézet van, és ott van [1][2][3] oldalszám

Nincs „állapot-történelem”, csak mindig az aktuális nézet számít

Összefoglalva:
✅ [🔄] gomb kell — kézi frissítés mindig jó

🔁 [◄] [►] akkor hasznos, ha:

többlépéses navigáció van (pl. cikk -> keresés -> új keresés)

nincs böngésző history (SPA)

❌ Elhagyható, ha mindig teljesen új nézet van, nincs állapot-visszatérés

# Szükség esetén szívesen segítek egy UX mockupot is csinálni rá!

====================================================
