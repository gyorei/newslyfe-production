
>> migrations\20250809-create-licenses-table.cjs
>> src\backend\license\utils\db.ts
# License Model – Projekt dokumentáció

Ez a mappa tartalmazza a prémium licenckezelő rendszer adatbázis modelljeit.

## Fő cél
A License modell a digitálisan aláírt licenckulcsok, recovery kódok, lejárati dátumok, revokációs adatok és metaadatok biztonságos tárolását végzi PostgreSQL adatbázisban, Sequelize ORM-mel.

## Fő fájlok
- **licenseModel.ts**: A License entitás ipari szintű, jövőálló modellje. Minden kulcsfontosságú mezőt tartalmaz: kulcs, hash, recovery kód, lejárat, revokációs adatok, metaadat (JSONB).
- **README.md**: Ez a dokumentáció, amely összefoglalja a modell szerepét, a kapcsolódó migrációkat és a rendszer architektúráját.

## Kapcsolatok
- A License modell kapcsolódik a kulcsgeneráló service-hez (`keyService.ts`), amely minden új kulcsot ment az adatbázisba.
- A revokációs logika a License modell `isRevoked`, `revocationReason`, `revokedAt` mezőit használja.
- A recovery kód alapján a backend vissza tudja keresni a licenckulcsot.

## Migráció
A tábla szerkezetét a `migrations/create-licenses-table.js` migrációs fájl hozza létre, amely verziókövetetten, biztonságosan módosítja az adatbázist.

## Használat
- Új licenckulcs generálásakor a kulcs, hash, recovery kód, metaadat mentésre kerül.
- Revokációkor a kulcs státusza és okai frissülnek.
- A rendszer auditálható, bővíthető, minden kulcs és művelet visszakereshető.

## További fejlesztés
- Kapcsolat más modellekkel (pl. felhasználók, tranzakciók) később bővíthető.
- A metaadat mező rugalmasan bővíthető új funkciókhoz.

---
Ez a mappa a prémium licenckezelő rendszer adatbázis alapja, minden kulcs, recovery kód és revokációs adat itt kerül biztonságosan tárolásra és verziókövetésre.