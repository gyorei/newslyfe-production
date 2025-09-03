import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import styles from './LocationInfoModal.module.css';

interface LocationInfoModalProps {
  currentLocation: string;
  onContinue: () => void;
  onSetup: () => void;
  onClose: () => void;
  onDisable?: () => void; // Új prop a kikapcsoláshoz
}

const LocationInfoModal: React.FC<LocationInfoModalProps> = ({
  currentLocation,
  onContinue,
  onSetup,
  onClose,
  onDisable,
}) => {
  const { t } = useTranslation();
  const [dontShowAgain, setDontShowAgain] = useState(false);

  // Close modal on overlay click
  const handleOverlayClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  // Continue gomb kezelése, figyelembe véve a "Ne mutasd újra" beállítást
  const handleContinue = () => {
    if (dontShowAgain && onDisable) {
      onDisable(); // Értesítjük a szülő komponenst a kikapcsolásról
    }
    onContinue();
  };

  return (
    <div className={styles.modalOverlay} onClick={handleOverlayClick}>
      <div className={styles.modalContent}>
        <h2>{t('locationModal.title')}</h2>

        <p className={styles.description}>
          {t('locationModal.description')}
        </p>

        <div className={styles.locationInfo}>
          <p>
            {t('locationModal.currentLocation')}: <strong>{currentLocation}</strong>
          </p>
        </div>

        <p className={styles.optionsInfo}>{t('locationModal.optionsInfo')}</p>

        <ul className={styles.optionsList}>
          <li>{t('locationModal.option1')}</li>
          <li>{t('locationModal.option2')}</li>
          <li>{t('locationModal.option3')}</li>
        </ul>

        {/* "Ne mutasd újra" jelölőnégyzet */}
        <div className={styles.dontShowAgain}>
          <label>
            <input
              type="checkbox"
              checked={dontShowAgain}
              onChange={(e) => setDontShowAgain(e.target.checked)}
            />
            {t('locationModal.dontShowAgain')}
          </label>
        </div>

        <div className={styles.modalButtons}>
          <button className={styles.continueButton} onClick={handleContinue}>
            {t('locationModal.continueButton')}
          </button>
          <button className={styles.setupButton} onClick={onSetup}>
            {t('locationModal.setupButton')}
          </button>
        </div>

        <button className={styles.closeButton} onClick={onClose}>
          ×
        </button>
      </div>
    </div>
  );
};

export default LocationInfoModal;
