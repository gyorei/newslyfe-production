import React from 'react';
import styles from './PerformanceWarning.module.css';

interface PerformanceWarningProps {
  isVisible: boolean;
  onClose: () => void;
  message?: string;
  title?: string;
  buttonText?: string;
}

/**
 * Teljesítmény figyelmeztetés komponens
 *
 * Megjeleníthető figyelmeztetés nagy adatmennyiség vagy erőforrás-igényes műveleteknél
 */
const PerformanceWarning: React.FC<PerformanceWarningProps> = ({
  isVisible,
  onClose,
  message = 'Nagy mennyiségű adat betöltése teljesítményproblémákat okozhat, különösen lassabb eszközökön vagy gyengébb internet kapcsolat esetén.',
  title = 'Teljesítmény figyelmeztetés',
  buttonText = 'Értem',
}) => {
  if (!isVisible) return null;

  return (
    <div className={styles.performanceWarning}>
      <div className={styles.warningIcon}>⚠️</div>
      <div className={styles.warningContent}>
        <h4>{title}</h4>
        <p>{message}</p>
      </div>
      <button className={styles.closeWarning} onClick={onClose}>
        {buttonText}
      </button>
    </div>
  );
};

export default PerformanceWarning;
