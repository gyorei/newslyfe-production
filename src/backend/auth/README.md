# Auth Modul

Ez a mappa az alkalmazás teljes felhasználói authentikációs és autorizációs logikáját tartalmazza.

---

## Faszerkezet

```
src/backend/auth/
├── controllers/
│   └── auth.controller.ts         # Regisztráció, login, profil, email verifikáció
├── middleware/
│   └── auth.middleware.ts         # JWT alapú védett végpont middleware
├── models/
│   └── user.model.ts              # User interfész, adatbázis műveletek
├── routes/
│   └── auth.routes.ts             # Auth API útvonalak
├── utils/
│   ├── emailService.ts            # Email küldés Nodemailer-rel
│   ├── emailTemplates.ts          # Email sablonok (HTML, plain text)
│   ├── hash.ts                    # Jelszó hash-elés és ellenőrzés (bcrypt)
│   ├── token.ts                   # JWT token generálás/ellenőrzés
│   └── tokenService.ts            # Email verifikációs token generálás/ellenőrzés
├── passport-setup.ts              # Google OAuth2 Passport konfiguráció
├── index.ts                       # Modul fő export (authRouter)
└── README.md                      # Dokumentáció
```

---

## Fő funkciók

- Jelszó alapú regisztráció és bejelentkezés (JWT)
- Email cím megerősítése regisztráció után (verifikációs link)
- Közösségi bejelentkezés Google-lel (OAuth2)
- Védett végpontok kezelése JWT middleware segítségével
- Biztonságos jelszókezelés (bcrypt)
- Email küldés Nodemailer-rel, sablonokkal

---

## API végpontok

Az összes végpont az `/api/auth` prefix alatt érhető el.

- `POST /register` – Új felhasználó regisztrációja
- `POST /login` – Bejelentkezés, JWT token visszaadása
- `GET /me` – Bejelentkezett felhasználó adatainak lekérése (védett)
- `GET /verify-email` – Email cím megerősítése a token alapján
- `GET /google` – Google social login folyamat indítása
- `GET /google/callback` – A Google által hívott callback végpont

---

## Környezeti változók (`.env`)

- `JWT_SECRET` – JWT token titkos kulcs
- `GOOGLE_CLIENT_ID` – Google OAuth2 kliens azonosító
- `GOOGLE_CLIENT_SECRET` – Google OAuth2 kliens titok
- `FRONTEND_URL` – Frontend alkalmazás URL-je (verifikációs linkhez)
- `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `EMAIL_FROM` – Email küldéshez

---

## Fő komponensek

### 1. Controller (`controllers/auth.controller.ts`)
- Regisztráció, login, profil lekérés, email verifikáció
- Validáció (zod), adatbázis műveletek, email küldés

### 2. Middleware (`middleware/auth.middleware.ts`)
- JWT token ellenőrzés, védett végpontok

### 3. Model (`models/user.model.ts`)
- User interfész, CRUD műveletek, email verifikációs token kezelés

### 4. Utils
- `emailService.ts`: Email küldés Nodemailer-rel
- `emailTemplates.ts`: Reszponzív email sablonok
- `hash.ts`: Jelszó hash-elés/ellenőrzés (bcrypt)
- `token.ts`: JWT token generálás/ellenőrzés
- `tokenService.ts`: Email verifikációs token generálás/ellenőrzés

### 5. Passport (`passport-setup.ts`)
- Google OAuth2 bejelentkezés, user keresés/létrehozás

### 6. Routes (`routes/auth.routes.ts`)
- Auth API útvonalak regisztrációja

---

## Használat

1. Környezeti változók beállítása (`.env`)
2. Backend indítása: `npm run dev:backend`
3. API végpontok elérése: `http://localhost:3002/api/auth`

---

## További információ

- A modul teljesen TypeScript alapú, mindenhol típusbiztos
- Az email verifikációs logika idempotens, többször is futtatható
- A kód ipari szabványokat követ, biztonságos és jól tesztelhető

---

Ha kérdésed van, nézd meg a kódot vagy keresd a fejlesztőt!
