import React from 'react';
import { useTranslation } from 'react-i18next';
import styles from './AlertMessage.module.css';

interface AlertMessageProps {
  message: string;
  type: 'success' | 'error' | 'warning' | 'info';
  onClose: () => void;
  duration?: number;
}

export const AlertMessage: React.FC<AlertMessageProps> = ({
  message,
  type,
  onClose,
  duration = 4000,
}) => {
  const [isClosing, setIsClosing] = React.useState(false);
  const { t } = useTranslation();

  React.useEffect(() => {
    const timer = setTimeout(() => {
      setIsClosing(true);

      setTimeout(() => {
        onClose();
      }, 300);
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, onClose]);

  const handleClose = () => {
    setIsClosing(true);
    setTimeout(() => {
      onClose();
    }, 300);
  };

  const getIcon = () => {
    switch (type) {
      case 'success':
        return '✅';
      case 'error':
        return '❌';
      case 'warning':
        return '⚠️';
      case 'info':
        return 'ℹ️';
    }
  };

  return (
    <div
      className={`${styles.alertMessage} ${styles[type]} ${isClosing ? styles.slideOut : ''}`}
      role="alert"
      aria-live="polite"
      aria-label={t(`alert.type.${type}`, type)}
    >
      <span className={styles.icon}>{getIcon()}</span>
      <span className={styles.message}>{message}</span>
      <button
        className={styles.closeButton}
        onClick={handleClose}
        aria-label={t('alert.close', 'Close')}
        title={t('alert.close', 'Close')}
      >
        ×
      </button>
    </div>
  );
};
