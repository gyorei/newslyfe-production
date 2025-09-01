// src\components\Auth\AuthForms.tsx
import * as React from 'react';
import { useTranslation } from 'react-i18next';
import styles from './Auth.module.css';
import { useAuth } from './AuthContext';
import { AuthErrorType } from './AuthService';
import { z } from 'zod';

// Backend validációs séma (zod)
const loginSchema = z.object({
  email: z.string().email({ message: 'auth.validation.email' as any }),
  password: z.string().min(8, { message: 'auth.validation.passwordMin' as any }),
});

const registerSchema = z.object({
  name: z.string().min(3, { message: 'auth.validation.nameMin' as any }),
  email: z.string().email({ message: 'auth.validation.email' as any }),
  password: z.string().min(8, { message: 'auth.validation.passwordMin' as any }),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'auth.validation.passwordsMismatch' as any,
  path: ['confirmPassword'],
});

// ✅ ÚJ: AuthFormField komponens a duplikáció megszüntetésére
interface AuthFormFieldProps {
  type: 'text' | 'email' | 'password';
  name: string;
  label: string;
  value: string;
  error?: string;
  required?: boolean;
  placeholder?: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  id?: string;
}

const AuthFormField: React.FC<AuthFormFieldProps> = ({
  type,
  name,
  label,
  value,
  error,
  required,
  onChange,
  placeholder,
  id,
}) => (
  <div className={styles.formGroup}>
    <label htmlFor={id || name}>{label}</label>
    <input
      type={type}
      id={id || name}
      name={name}
      value={value}
      onChange={onChange}
      required={required}
      placeholder={placeholder}
      className={error ? styles.inputError : ''}
    />
    {error && <div className={styles.fieldError}>{error}</div>}
  </div>
);

// ✅ ÚJ: Közös error handling logika
const useAuthErrorHandling = () => {
  const { t } = useTranslation();
  const handleAuthError = (error: unknown, defaultMessage: string) => {
    let errorMessage = defaultMessage;

    if (typeof error === 'object' && error !== null && 'type' in error) {
      const typedError = error as { type: AuthErrorType; message?: string };
      if (typedError.type === AuthErrorType.INVALID_CREDENTIALS) {
        errorMessage = t('auth.error.invalidCredentials', 'Invalid email or password');
      } else if (typedError.type === AuthErrorType.USER_NOT_FOUND) {
        errorMessage = t('auth.error.userNotFound', 'No user found with this email address');
      } else if (typedError.type === AuthErrorType.EMAIL_ALREADY_EXISTS) {
        errorMessage = t('auth.error.emailExists', 'This email address is already registered');
      } else if (typedError.type === AuthErrorType.WEAK_PASSWORD) {
        errorMessage = typedError.message || t('auth.error.weakPassword', 'The provided password is too weak');
      }
    } else if (error instanceof Error) {
      errorMessage = error.message;
    }

    return errorMessage;
  };

  return { handleAuthError };
};

interface LoginFormProps {
  onSuccess?: () => void;
}

export const LoginForm: React.FC<LoginFormProps> = ({ onSuccess }) => {
  const auth = useAuth();
  const { handleAuthError } = useAuthErrorHandling();
  const { t } = useTranslation();

  const [formData, setFormData] = React.useState({
    email: localStorage.getItem('rememberedEmail') || '',
    password: '',
    rememberMe: Boolean(localStorage.getItem('rememberedEmail')),
  });

  const [formState, setFormState] = React.useState({
    isSubmitting: false,
    isSuccess: false,
    errors: {
      email: '',
      password: '',
      general: '',
    },
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
    if (formState.errors[name as keyof typeof formState.errors]) {
      setFormState((prev) => ({
        ...prev,
        errors: { ...prev.errors, [name]: '' },
      }));
    }
  };

  const validateForm = () => {
    const result = loginSchema.safeParse({
      email: formData.email,
      password: formData.password,
    });
    const errors = { email: '', password: '', general: '' };
    if (!result.success) {
      const fieldErrors = result.error.flatten().fieldErrors;
      errors.email = fieldErrors.email?.[0] || '';
      errors.password = fieldErrors.password?.[0] || '';
    }
    return errors;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errors = validateForm();
    if (errors.email || errors.password) {
      setFormState((prev) => ({ ...prev, errors }));
      return;
    }
    setFormState((prev) => ({
      ...prev,
      isSubmitting: true,
      errors: { email: '', password: '', general: '' },
    }));
    try {
      await auth.login(formData.email, formData.password);
      if (formData.rememberMe) {
        localStorage.setItem('rememberedEmail', formData.email);
      } else {
        localStorage.removeItem('rememberedEmail');
      }
      setFormState({
        isSubmitting: false,
        isSuccess: true,
        errors: { email: '', password: '', general: '' },
      });
      if (onSuccess) {
        setTimeout(() => { onSuccess(); }, 1000);
      }
    } catch (error: unknown) {
      const errorMessage = handleAuthError(error, t('auth.error.loginFailed', 'An error occurred during login'));
      setFormState({
        isSubmitting: false,
        isSuccess: false,
        errors: { email: '', password: '', general: errorMessage },
      });
    }
  };

  return (
    <form className={styles.authForm} onSubmit={handleSubmit} aria-busy={formState.isSubmitting}>
      {formState.errors.general && <div className={styles.error}>{formState.errors.general}</div>}
      <AuthFormField
        type="email"
        name="email"
        label={t('auth.field.email', 'Email address')}
        value={formData.email}
        onChange={handleChange}
        required
        error={formState.errors.email}
      />
      <AuthFormField
        type="password"
        name="password"
        label={t('auth.field.password', 'Password')}
        value={formData.password}
        onChange={handleChange}
        required
        error={formState.errors.password}
      />
      <div className={styles.checkboxGroup}>
        <input
          type="checkbox"
          id="rememberMe"
          name="rememberMe"
          checked={formData.rememberMe}
          onChange={handleChange}
        />
        <label htmlFor="rememberMe">{t('auth.field.rememberMe', 'Remember me')}</label>
      </div>
      <div className={styles.formActions}>
        <button type="submit" className={styles.submitButton} disabled={formState.isSubmitting} aria-disabled={formState.isSubmitting}>
          {formState.isSubmitting ? t('auth.action.loggingIn', 'Logging in...') : t('auth.action.login', 'Login')}
        </button>
        <button type="button" onClick={() => console.log('Forgot password')} className={styles.forgotPassword}>
          {t('auth.action.forgotPassword', 'Forgot password?')}
        </button>
      </div>
      {formState.isSubmitting && <div className={styles.loadingOverlay}>{t('auth.status.loading', 'Loading...')}</div>}
    </form>
  );
};

interface RegisterFormProps {
  onSuccess?: () => void;
}

export const RegisterForm: React.FC<RegisterFormProps> = ({ onSuccess }) => {
  const auth = useAuth();
  const { handleAuthError } = useAuthErrorHandling();
  const { t } = useTranslation();

  const [formData, setFormData] = React.useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
  });

  const [formState, setFormState] = React.useState({
    isSubmitting: false,
    isSuccess: false,
    errors: {
      name: '',
      email: '',
      password: '',
      confirmPassword: '',
      general: '',
    },
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (formState.errors[name as keyof typeof formState.errors]) {
      setFormState((prev) => ({
        ...prev,
        errors: { ...prev.errors, [name]: '' },
      }));
    }
  };

  const validateForm = () => {
    const result = registerSchema.safeParse(formData);
    const errors = { name: '', email: '', password: '', confirmPassword: '', general: '' };
    if (!result.success) {
      const fieldErrors = result.error.flatten().fieldErrors;
      errors.name = fieldErrors.name?.[0] || '';
      errors.email = fieldErrors.email?.[0] || '';
      errors.password = fieldErrors.password?.[0] || '';
      errors.confirmPassword = fieldErrors.confirmPassword?.[0] || '';
    }
    return errors;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errors = validateForm();
    if (errors.name || errors.email || errors.password || errors.confirmPassword) {
      setFormState((prev) => ({ ...prev, errors }));
      return;
    }
    setFormState((prev) => ({
      ...prev,
      isSubmitting: true,
      errors: { name: '', email: '', password: '', confirmPassword: '', general: '' },
    }));
    try {
      await auth.register(formData.name, formData.email, formData.password);
      setFormState({
        isSubmitting: false,
        isSuccess: true,
        errors: { name: '', email: '', password: '', confirmPassword: '', general: '' },
      });
      if (onSuccess) {
        setTimeout(() => { onSuccess(); }, 1000);
      }
    } catch (error: unknown) {
      const errorMessage = handleAuthError(error, t('auth.error.registerFailed', 'An error occurred during registration'));
      setFormState({
        isSubmitting: false,
        isSuccess: false,
        errors: { name: '', email: '', password: '', confirmPassword: '', general: errorMessage },
      });
    }
  };

  return (
    <form className={styles.authForm} onSubmit={handleSubmit} aria-busy={formState.isSubmitting}>
      {formState.errors.general && <div className={styles.error}>{formState.errors.general}</div>}
      <AuthFormField
        type="text"
        name="name"
        label={t('auth.field.name', 'Name')}
        value={formData.name}
        onChange={handleChange}
        required
        error={formState.errors.name}
      />
      <AuthFormField
        type="email"
        name="email"
        label={t('auth.field.email', 'Email address')}
        value={formData.email}
        onChange={handleChange}
        required
        error={formState.errors.email}
      />
      <AuthFormField
        type="password"
        name="password"
        label={t('auth.field.password', 'Password')}
        value={formData.password}
        onChange={handleChange}
        required
        error={formState.errors.password}
      />
      <AuthFormField
        type="password"
        name="confirmPassword"
        label={t('auth.field.confirmPassword', 'Confirm Password')}
        value={formData.confirmPassword}
        onChange={handleChange}
        required
        error={formState.errors.confirmPassword}
      />
      <div className={styles.formGroup}>
        <button type="submit" className={styles.submitButton} disabled={formState.isSubmitting} aria-disabled={formState.isSubmitting}>
          {formState.isSubmitting ? t('auth.action.registering', 'Registering...') : t('auth.action.register', 'Register')}
        </button>
      </div>
      {formState.isSubmitting && <div className={styles.loadingOverlay}>{t('auth.status.loading', 'Loading...')}</div>}
    </form>
  );
};
