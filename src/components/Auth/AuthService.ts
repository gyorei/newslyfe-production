import axios from 'axios';

/**
 * Autentikációs Szolgáltatás
 *
 * Kezeli a bejelentkezés, regisztráció és kijelentkezés műveleteit.
 * Jelenleg helyi tárolót használ, később API-val lesz helyettesítve.
 */

// Felhasználó interfész
export interface User {
  id: string;
  email: string;
  name: string | null;
  role: string;
  status: string;
  created_at: string;
}

// Autentikációs hibák típusa
export enum AuthErrorType {
  INVALID_CREDENTIALS = 'INVALID_CREDENTIALS',
  USER_NOT_FOUND = 'USER_NOT_FOUND',
  EMAIL_ALREADY_EXISTS = 'EMAIL_ALREADY_EXISTS',
  WEAK_PASSWORD = 'WEAK_PASSWORD',
  NETWORK_ERROR = 'NETWORK_ERROR',
  UNKNOWN_ERROR = 'UNKNOWN_ERROR',
}

// Autentikációs hiba osztály
export class AuthError extends Error {
  type: AuthErrorType;

  constructor(message: string, type: AuthErrorType) {
    super(message);
    this.type = type;
    this.name = 'AuthError';
  }
}

/**
 * AuthService osztály
 *
 * Autentikációval kapcsolatos műveleteket végez és kezeli a felhasználói
 * munkamenetet. Jelenleg localStorage-t használ, de később könnyen
 * kicserélhető API-alapú implementációra.
 */
class AuthService {
  private readonly STORAGE_KEY = 'auth_user';

  /**
   * Felhasználó bejelentkezése (API hívás)
   */
  async login(email: string, password: string, rememberMe: boolean = false): Promise<User> {
    try {
      const res = await axios.post('/api/auth/login', { email, password });
      const { token, user } = res.data;
      const storage = rememberMe ? localStorage : sessionStorage;
      storage.setItem('auth_token', token);
      return user;
    } catch (error) {
      if (axios.isAxiosError(error) && error.response && error.response.data && error.response.data.error) {
        throw new AuthError(error.response.data.error, AuthErrorType.INVALID_CREDENTIALS);
      }
      throw new AuthError('Váratlan hiba történt a bejelentkezés során.', AuthErrorType.UNKNOWN_ERROR);
    }
  }

  /**
   * Felhasználó regisztrációja (API hívás)
   */
  async register(name: string, email: string, password: string): Promise<User> {
    try {
      const res = await axios.post('/api/auth/register', { email, password, name });
      const { user, token } = res.data;
      localStorage.setItem('auth_token', token);
      return user;
    } catch (error) {
      if (axios.isAxiosError(error) && error.response && error.response.data && error.response.data.error) {
        throw new AuthError(error.response.data.error, AuthErrorType.EMAIL_ALREADY_EXISTS);
      }
      throw new AuthError('Váratlan hiba történt a regisztráció során.', AuthErrorType.UNKNOWN_ERROR);
    }
  }

  /**
   * Felhasználó kijelentkeztetése
   */
  logout(): void {
    localStorage.removeItem('auth_token');
    sessionStorage.removeItem('auth_token');
  }

  /**
   * Aktuális felhasználó lekérése (API token alapján)
   */
  async getCurrentUser(): Promise<User | null> {
    const token = this.getToken();
    if (!token) return null;
    try {
      const res = await axios.get('/api/auth/me', {
        headers: { Authorization: `Bearer ${token}` },
      });
      return res.data;
    } catch {
      return null;
    }
  }

  // Gyors, szinkron ellenőrzés a token meglétére
  hasToken(): boolean {
    return !!(localStorage.getItem('auth_token') || sessionStorage.getItem('auth_token'));
  }

  // Lekéri a tokent a storage-ból
  getToken(): string | null {
    return localStorage.getItem('auth_token') || sessionStorage.getItem('auth_token');
  }

  // Segédfunkciók =================
}

// Singleton példány exportálása
export const authService = new AuthService();
export default authService;
