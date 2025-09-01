src\components\Tabs\NewTab\NewTabPanel.tsx  nézzük át !!! keresés után megjelennek a hírek . a kártyában a hir megjelenési ideje pl 54 seconds ago vagy 1 minute ago vagy 
hvg · 17 hours ago  így kellene megjelenni ez jó!!!!! de a NewTabPanel.tsx-ban így jelennek meg. 
Origo · 2025. jún. 26. 14:36 , 
Magyar Nemzet · 2025. jún. 26. 14:23  megnézzük hogy mért másképpen jelenik meg az idő? 

=====================================================

Nagyon jó a kérdés! Összefoglalom, miért jelenik meg máshogy az idő a kártyákon a NewTabPanel keresés után, és hol kell módosítani, hogy mindenhol egységesen (pl. "17 hours ago") jelenjen meg.
1. Hol formázódik az idő?
a) Card komponens (Card.tsx)



A kártyán az idő a következő sorban formázódik:
  parts.push(formatRelativeTime(timestamp || date));

Apply to idő-hiba.md
A formatRelativeTime a dateFormatter.ts-ből jön, ami relatív időt ad vissza (pl. "17 hours ago").
b) cardService.ts
Az RSS hírekből kártyaadatot készítő függvény:

  date: formatRelativeTime(timestamp, true), // Relatív időt használunk
  timestamp: timestamp, // Most már garantáltan szám

Apply to idő-hiba.md
Itt a date mező már formázott szöveg lesz (pl. "17h"), NEM nyers dátum!
c) NewTabPanel.tsx
A keresési eredményeknél a hírek valószínűleg nem mennek át a cardService.ts-en, vagy a date mezőjük nem relatív, hanem formázott dátum (pl. "2025. jún. 26. 14:36").
Emiatt a Card komponensben a formatRelativeTime(timestamp || date) hívás, ha a date már szöveg, azt változtatás nélkül jeleníti meg.
2. Mi a különbség?
Jó: Ha a Card komponens timestamp-ot kap, akkor mindig relatív idő lesz ("17 hours ago").
Nem jó: Ha csak date van, és az már egy formázott szöveg (pl. "2025. jún. 26. 14:36"), akkor azt jeleníti meg, nem relatív időt.
3. Mit kell módosítani?
A megoldás:
Mindenhol legyen timestamp mező a Card komponensnek átadott adatokban!
Ahol csak date van, ott a Card komponensben vagy a kártyaadat előállításakor alakítsuk át timestamp-ra (pl. new Date(date).getTime()).
A Card komponensben a formatRelativeTime(timestamp)-ot használd, ne a date szöveget!
4. Hol kell módosítani?
a) cardService.ts
Már jól csinálja: mindig számot ad a timestamp-nak, és azt adja át a Card-nak.
b) NewTabPanel.tsx (vagy a keresési eredmény feldolgozásánál)
Itt kell módosítani!
Amikor a keresési eredményekből Card adatot készítesz, gondoskodj róla, hogy legyen timestamp mező (szám), ne csak szöveges date.
Példa:

  // amikor NewsItem-et készítesz:
  timestamp: item.timestamp || (item.date ? new Date(item.date).getTime() : Date.now())

Apply to idő-hiba.md
c) Card.tsx
A formatRelativeTime(timestamp)-ot használd, ne a date-et, vagy ha mindkettő van, a timestamp legyen az elsődleges.
5. Összefoglalva:
A Card komponens mindig szám típusú timestamp-ot kapjon!
Ahol csak szöveges date van, ott alakítsd át timestamp-re!
A Card komponensben a formatRelativeTime(timestamp)-ot használd!

=======================================================