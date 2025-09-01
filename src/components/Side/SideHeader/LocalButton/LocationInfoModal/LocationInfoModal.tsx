import React, { useState } from 'react';
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
        <h2>Location Detection Required for Local News</h2>

        <p className={styles.description}>
          To personalize local news content, we need your location information.
        </p>

        <div className={styles.locationInfo}>
          <p>
            Currently set location: <strong>{currentLocation}</strong>
          </p>
        </div>

        <p className={styles.optionsInfo}>You can choose from the following options:</p>

        <ul className={styles.optionsList}>
          <li>Manual country selection</li>
          <li>GPS-based precise location</li>
          <li>Browser language detection</li>
        </ul>

        {/* "Ne mutasd újra" jelölőnégyzet */}
        <div className={styles.dontShowAgain}>
          <label>
            <input
              type="checkbox"
              checked={dontShowAgain}
              onChange={(e) => setDontShowAgain(e.target.checked)}
            />
            Don&apos;t show this message again
          </label>
        </div>

        <div className={styles.modalButtons}>
          <button className={styles.continueButton} onClick={handleContinue}>
            Continue with current settings
          </button>
          <button className={styles.setupButton} onClick={onSetup}>
            Configure location settings
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
