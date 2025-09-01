// src\components\Auth\SocialLogin.tsx
import * as React from 'react';
import { useTranslation } from 'react-i18next';
import styles from './SocialLogin.module.css';

interface SocialLoginProps {
  mode?: 'login' | 'register'; // Új prop a mód meghatározásához
}

export const SocialLogin: React.FC<SocialLoginProps> = ({
  mode = 'login', // Alapértelmezett érték
}) => {
  const [loading, setLoading] = React.useState<string | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const { t } = useTranslation();

  const handleSocialLogin = (provider: 'google' | 'facebook' | 'apple') => {
    setLoading(provider);
    setError(null);

    // Valódi social login: átirányítás a backend végpontra
    // A backend oldalon kell kezelni az OAuth2 folyamatot (pl. Passport.js)
    const backendAuthUrl = `/api/auth/${provider}`;
    window.location.href = backendAuthUrl;
  };

  // Szöveg a mód alapján
  const buttonText = (provider: string, isLoading: boolean) => {
    if (isLoading) return t('auth.status.processing', 'Processing...');
    return mode === 'register'
      ? t('auth.social.registerWith', `Register with ${provider}`, { provider })
      : t(`auth.social.provider.${provider.toLowerCase()}` as const, provider);
  };

  return (
    <div className={styles.socialLoginContainer}>
      {error && <div className={styles.error}>{error}</div>}

      {/* Social login szöveg eltávolítva, csak a gombok maradnak */}
      <div className={`${styles.socialButtons} ${mode === 'register' ? styles.registerMode : ''}`}>
        <button
          className={`${styles.socialButton} ${styles.google}`}
          onClick={() => handleSocialLogin('google')}
          disabled={loading !== null}
        >
          <span className={styles.socialIcon}>G</span>
          {buttonText('Google', loading === 'google')}
        </button>

        <button
          className={`${styles.socialButton} ${styles.facebook}`}
          onClick={() => handleSocialLogin('facebook')}
          disabled={loading !== null}
        >
          <span className={styles.socialIcon}>f</span>
          {buttonText('Facebook', loading === 'facebook')}
        </button>

        <button
          className={`${styles.socialButton} ${styles.apple}`}
          onClick={() => handleSocialLogin('apple')}
          disabled={loading !== null}
        >
          <span className={styles.socialIcon}>🍎</span>
          {buttonText('Apple', loading === 'apple')}
        </button>
      </div>
    </div>
  );
};
