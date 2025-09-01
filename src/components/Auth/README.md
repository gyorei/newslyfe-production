# Autentikációs Rendszer

Ez a dokumentáció az alkalmazás autentikációs rendszerének jelenlegi állapotát, a komponensek működését és a jövőbeli fejlesztési terveket írja le.

## Jelenlegi állapot (2025. augusztus)

### Elkészült komponensek és funkciók

1. **Auth.tsx**
   - Fül-alapú UI bejelentkezéshez és regisztrációhoz
   - Állapotkezelés és zod-alapú form validáció
   - Sikeres művelet után callback függvények hívása

2. **AuthForms.tsx**
   - Különálló LoginForm és RegisterForm komponensek
   - Zod-alapú validáció (frontend és backend validáció egységes)
   - Hibaüzenetek megjelenítése, loading overlay
   - "Jegyezz meg" funkció bejelentkezéshez
   - Accessibility: aria attribútumok, vizuális visszajelzés

3. **SocialLogin.tsx**
   - Google, Facebook és Apple bejelentkezési felület
   - Különböző UI bejelentkezéshez és regisztrációhoz
   - Betöltési állapotok kezelése
   - Jelenleg demó, a valódi OAuth2 integráció backend oldali fejlesztést igényel

4. **AuthContext.tsx**
   - Központi felhasználói állapot kezelése
   - Bejelentkezés, regisztráció és kijelentkezés
   - Token-alapú autentikáció, user mindig a backendből jön
   - Hibakezelés, loading és inicializálási állapot

5. **AuthService.ts**
   - Valódi backend API kommunikáció (axios)
   - Token kezelés localStorage/sessionStorage-ban
   - Automatikus bejelentkezés regisztráció után
   - Típusos hibakezelés

6. **AuthUtils.ts**
   - Jelszó erősség vizsgálata (ipari szabvány, zxcvbn javasolt)
   - JWT token dekódolás (jwt-decode csomaggal)
   - Biztonságos jelszó generátor (window.crypto)

7. **index.ts**
   - Központi export összefoglaló

### Működő funkciók

- ✅ UI megjelenítés és átváltás bejelentkezés/regisztráció között
- ✅ Zod-alapú űrlap validáció és hibaüzenetek
- ✅ Token-alapú felhasználó tárolás
- ✅ "Jegyezz meg" funkció
- ✅ Közösségi bejelentkezés felülete (UI, demó)
- ✅ Jelszó erősség elemzés
- ✅ JWT kezelés (ipari szabvány)

## Hiányzó funkciók / Jövőbeli fejlesztések

1. **Backend integráció**
   - Valódi API végpontok bekötése
   - JWT token alapú autentikáció implementálása
   - Refresh token mechanizmus
   - Social login (OAuth2) backend oldali végpontok (Google, Facebook, stb.)

2. **Biztonság**
   - CSRF védelem
   - Rate limiting
   - Hibás bejelentkezési kísérletek korlátozása
   - Kéttényezős autentikáció (2FA)

3. **Felhasználói élmény**
   - Jelszó visszaállítás teljes folyamata
   - Email-es megerősítés
   - Bejelentkezés állapot megőrzése frissítés után
   - Valós közösségi bejelentkezés OAuth-al

4. **Jogosultság kezelés**
   - Különböző szerepkörök (felhasználó, moderátor, admin)
   - Funkciókhoz hozzáférés korlátozása
   - Role-Based Access Control (RBAC)

5. **UI/UX finomítások**
   - Jelszó erősség vizuális visszajelzés
   - Animációk a folyamat lépések között
   - Tartalom védelme bejelentkezés nélkül

## Implementációs lehetőségek

- **Saját backend implementáció** (Express/Node.js + PostgreSQL)
- **Firebase Authentication**
- **Supabase Auth**
- **NextAuth.js**

## Hogyan használd

1. Az `AuthProvider`-t az alkalmazás gyökerében kell elhelyezni:

```tsx
import { AuthProvider } from './components/Auth';
function App() {
  return <AuthProvider>{/* Alkalmazás komponensei */}</AuthProvider>;
}
```

2. Felhasználói állapot elérése bármely komponensben:

```tsx
import { useAuth } from './components/Auth';
function UserProfile() {
  const { user, isAuthenticated, logout } = useAuth();
  if (!isAuthenticated) {
    return <div>Kérjük, jelentkezzen be!</div>;
  }
  return (
    <div>
      <p>Üdvözöljük, {user.name}!</p>
      <button onClick={logout}>Kijelentkezés</button>
    </div>
  );
}
```

3. Az `Auth` komponens beillesztése:

```tsx
import { Auth } from './components/Auth';
function LoginPage() {
  const handleSuccess = () => {
    console.log('Sikeres bejelentkezés!');
    // Átirányítás vagy egyéb művelet
  };
  return <Auth onLoginSuccess={handleSuccess} onRegisterSuccess={handleSuccess} />;
}
```

---

# Fejlesztési javaslatok és ütemterv

## 1. Biztonság fokozása
- JWT token kezelés teljeskörű implementálása (access/refresh token, HttpOnly cookie)
- Bejelentkezési kísérletek számolása és korlátozása
- Jelszó változtatási logika, audit log

## 2. Felhasználói élmény javítása
- Folyamat megszakítás és mentés
- Multi-device kezelés
- Profilkép kezelés
- Jelszó erősségmérő vizuális visszajelzés

## 3. Backend integráció
- Social login (OAuth2) backend oldali végpontok
- Adapter mintára épített AuthProvider váltás

## 4. Felhasználói profil bővítése
- Részletes profiloldal
- Preferenciák kezelése
- Fiókbiztonság (email/jelszó váltás, 2FA)

## 5. Jogosultságkezelési rendszer
- RBAC (Role-Based Access Control)
- Permission alapú hozzáférés
- Dinamikus UI jogosultságok szerint

## Implementációs ütemterv
1. **Azonnal**: AuthUtils.ts jelszó erősség vizualizáció
2. **Rövid távon**: Social login backend integráció, JWT refresh token
3. **Közép távon**: Felhasználói profil és beállítások bővítése
4. **Hosszú távon**: Teljes jogosultságkezelési rendszer

A jelenlegi architektúra moduláris, absztrakciós szintek jól elkülönítettek, így bármely backend szolgáltatás könnyen integrálható minimális front-end módosításokkal.
