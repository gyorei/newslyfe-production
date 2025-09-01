// src\components\Auth\AuthContext.tsx

import * as React from 'react';
import authService, { User, AuthError } from './AuthService';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isInitialized: boolean;
  error: AuthError | null;
  login: (email: string, password: string, rememberMe?: boolean) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => void;
}

export const AuthContext = React.createContext<AuthContextType | undefined>(undefined);
export const useAuth = () => {
  const context = React.useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = React.useState<User | null>(null);
  const [isLoading, setIsLoading] = React.useState(false);
  const [isInitialized, setIsInitialized] = React.useState(false);
  const [error, setError] = React.useState<AuthError | null>(null);

  React.useEffect(() => {
    const initializeAuth = async () => {
      if (authService.hasToken()) {
        try {
          const currentUser = await authService.getCurrentUser();
          setUser(currentUser);
        } catch (err) {
          // Token érvénytelen vagy hiba történt
          setUser(null);
        }
      }
      setIsInitialized(true);
    };
    initializeAuth();
  }, []);

  const handleApiCall = async (apiCall: () => Promise<User>) => {
    setIsLoading(true);
    setError(null);
    try {
      const resultUser = await apiCall();
      setUser(resultUser);
    } catch (err) {
      if (err instanceof AuthError) {
        setError(err);
      }
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (email: string, password: string, rememberMe: boolean = false) => {
    await handleApiCall(() => authService.login(email, password, rememberMe));
  };

  const register = async (name: string, email: string, password: string) => {
    await handleApiCall(() => authService.register(name, email, password));
  };

  const logout = () => {
    authService.logout();
    setUser(null);
    setError(null);
  };

  const value: AuthContextType = {
    user,
    isAuthenticated: !!user,
    isLoading,
    isInitialized,
    error,
    login,
    register,
    logout,
  };

  if (!isInitialized) {
    return <div>Application Loading...</div>;
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};