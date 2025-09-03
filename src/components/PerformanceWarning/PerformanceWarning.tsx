import React from 'react';
import { useTranslation } from 'react-i18next';
import styles from './PerformanceWarning.module.css';

interface PerformanceWarningProps {
  isVisible: boolean;
  onClose: () => void;
  message?: string;
  title?: string;
  buttonText?: string;
}

/**
 * Performance warning component
 *
 * Displayable warning for large data amounts or resource-intensive operations
 */
const PerformanceWarning: React.FC<PerformanceWarningProps> = ({
  isVisible,
  onClose,
  message,
  title,
  buttonText,
}) => {
  const { t } = useTranslation();
  if (!isVisible) return null;

  return (
    <div className={styles.performanceWarning}>
      <div className={styles.warningIcon}>⚠️</div>
      <div className={styles.warningContent}>
        <h4>{title || t('performanceWarning.title')}</h4>
        <p>{message || t('performanceWarning.message')}</p>
      </div>
      <button className={styles.closeWarning} onClick={onClose}>
        {buttonText || t('performanceWarning.buttonText')}
      </button>
    </div>
  );
};

export default PerformanceWarning;
