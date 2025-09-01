import * as React from 'react';
import styles from './Auth.module.css';
import { SocialLogin } from './SocialLogin';

interface AuthProps {
  onLoginSuccess?: () => void;
  onRegisterSuccess?: () => void;
}

interface LoginData {
  email: string;
  password: string;
  rememberMe: boolean;
}

interface RegisterData {
  username: string;
  email: string;
  password: string;
  confirmPassword: string;
}

export const Auth: React.FC<AuthProps> = ({ onLoginSuccess, onRegisterSuccess }) => {
  const [activeTab, setActiveTab] = React.useState<'login' | 'register'>('login');
  const [message, setMessage] = React.useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);

  // Login állapot
  const [loginData, setLoginData] = React.useState<LoginData>({
    email: localStorage.getItem('rememberedEmail') || '',
    password: '',
    rememberMe: Boolean(localStorage.getItem('rememberedEmail')),
  });

  // Regisztráció állapot
  const [registerData, setRegisterData] = React.useState<RegisterData>({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
  });

  // Jelszó láthatóság állapotok
  const [showPassword, setShowPassword] = React.useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = React.useState(false);
  const [showLoginPassword, setShowLoginPassword] = React.useState(false);

  // Login űrlap kezelése
  const handleLoginChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setLoginData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  // Regisztráció űrlap kezelése
  const handleRegisterChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setRegisterData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // Login feldolgozás
  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Egyszerű validáció
    if (!loginData.email || !loginData.password) {
      setMessage({
        type: 'error',
        text: 'Please fill in all fields!',
      });
      return;
    }

    // TODO: Tényleges API hívás itt lesz

    // Demo: sikeres bejelentkezés szimulálása
    setMessage({
      type: 'success',
      text: 'Login successful!',
    });

    // Remeber me kezelése
    if (loginData.rememberMe) {
      localStorage.setItem('rememberedEmail', loginData.email);
    } else {
      localStorage.removeItem('rememberedEmail');
    }

    // Sikeres bejelentkezés után callback
    setTimeout(() => {
      onLoginSuccess?.();
    }, 1500);
  };

  // Regisztráció feldolgozás
  const handleRegisterSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Validáció
    if (!registerData.username || !registerData.email || !registerData.password) {
      setMessage({
        type: 'error',
        text: 'Please fill in all fields!',
      });
      return;
    }
    if (registerData.password !== registerData.confirmPassword) {
      setMessage({
        type: 'error',
        text: 'Passwords do not match!',
      });
      return;
    }

    // TODO: Tényleges API hívás itt lesz

    // Demo: sikeres regisztráció szimulálása
    setMessage({
      type: 'success',
      text: 'Registration successful!',
    });

    // Sikeres regisztráció után callback
    setTimeout(() => {
      onRegisterSuccess?.();
    }, 1500);
  };

  return (
    <div className={styles.authContent}>
      <div className={styles.authTabs}>
        <button
          className={`${styles.authTab} ${activeTab === 'login' ? styles.active : ''}`}
          onClick={() => setActiveTab('login')}
        >
          Login
        </button>
        <button
          className={`${styles.authTab} ${activeTab === 'register' ? styles.active : ''}`}
          onClick={() => setActiveTab('register')}
        >
          Register
        </button>
      </div>

      {/* Üzenet megjelenítése */}
      {message && <div className={`${styles.message} ${styles[message.type]}`}>{message.text}</div>}

      {activeTab === 'login' ? (
        <>
          <form className={styles.authForm} onSubmit={handleLoginSubmit}>
            <div className={styles.formGroup}>
              <label htmlFor="email">Email address</label>
              <input
                type="email"
                id="email"
                name="email"
                value={loginData.email}
                onChange={handleLoginChange}
                required
              />
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="password">Password</label>
              <div className={styles.passwordInputWrapper}>
                <input
                  type={showLoginPassword ? "text" : "password"}
                  id="password"
                  name="password"
                  value={loginData.password}
                  onChange={handleLoginChange}
                  required
                />
                <button
                  type="button"
                  className={styles.showPasswordButton}
                  onClick={() => setShowLoginPassword((prev) => !prev)}
                  tabIndex={-1}
                  aria-label={showLoginPassword ? "Hide password" : "Show password"}
                >
                  {showLoginPassword ? "Hide" : "Show"}
                </button>
              </div>
            </div>

            <div className={styles.checkboxGroup}>
              <input
                type="checkbox"
                id="rememberMe"
                name="rememberMe"
                checked={loginData.rememberMe}
                onChange={handleLoginChange}
              />
              <label htmlFor="rememberMe">Remember me</label>
            </div>

            <button type="submit" className={styles.submitButton}>
              Login
            </button>
          </form>

          <SocialLogin mode="login" />
        </>
      ) : (
        <>
          <form className={styles.authForm} onSubmit={handleRegisterSubmit}>
            <div className={styles.formGroup}>
              <label htmlFor="username">Username</label>
              <input
                type="text"
                id="username"
                name="username"
                value={registerData.username}
                onChange={handleRegisterChange}
                required
              />
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="regEmail">Email address</label>
              <input
                type="email"
                id="regEmail"
                name="email"
                value={registerData.email}
                onChange={handleRegisterChange}
                required
              />
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="regPassword">Password</label>
              <div className={styles.passwordInputWrapper}>
                <input
                  type={showPassword ? "text" : "password"}
                  id="regPassword"
                  name="password"
                  value={registerData.password}
                  onChange={handleRegisterChange}
                  required
                />
                <button
                  type="button"
                  className={styles.showPasswordButton}
                  onClick={() => setShowPassword((prev) => !prev)}
                  tabIndex={-1}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? "Hide" : "Show"}
                </button>
              </div>
            </div>
            <div className={styles.formGroup}>
              <label htmlFor="confirmPassword">Confirm password</label>
              <div className={styles.passwordInputWrapper}>
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  id="confirmPassword"
                  name="confirmPassword"
                  value={registerData.confirmPassword}
                  onChange={handleRegisterChange}
                  required
                />
                <button
                  type="button"
                  className={styles.showPasswordButton}
                  onClick={() => setShowConfirmPassword((prev) => !prev)}
                  tabIndex={-1}
                  aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                >
                  {showConfirmPassword ? "Hide" : "Show"}
                </button>
              </div>
            </div>

            <button type="submit" className={styles.submitButton}>
              Register
            </button>
          </form>

          <SocialLogin mode="register" />
        </>
      )}
    </div>
  );
};
