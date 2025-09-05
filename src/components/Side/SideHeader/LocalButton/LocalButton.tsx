import React, { useState, useEffect } from 'react';
import styles from './LocalButton.module.css';
import LocationInfoModal from './LocationInfoModal/LocationInfoModal';
import { useLocation } from '../../../../components/LocalNews/location/useLocation';
import { useTranslation } from 'react-i18next';

interface LocalButtonProps {
  onActivateTab?: (tabId: string) => void;
  loadLocalContent?: () => Promise<string | null>;
  openRightPanelWithMode?: (mode: 'tools' | 'auth' | 'settings' | 'favorites' | 'history', category?: string) => void;
  isLocationLoading?: boolean;
}

export const LocalButton: React.FC<LocalButtonProps> = ({
  onActivateTab = () => {},
  loadLocalContent,
  openRightPanelWithMode,
  isLocationLoading,
}) => {
  const { t } = useTranslation();
  const { location, loading, fetchLocation } = useLocation(false); // autoFetch = false

  // Állapot a modális ablak megjelenítéséhez
  const [showLocationInfoModal, setShowLocationInfoModal] = useState(false);
  // Aktuális helyadatok
  const [currentLocation, setCurrentLocation] = useState<string>('Ismeretlen');

  useEffect(() => {
    if (location) {
      setCurrentLocation(location.country || 'Ismeretlen');
    }
  }, [location]);

  // Local gomb kattintás kezelése - modális ablak megjelenítése
  const handleLocalClick = async () => {
    // A useLocation hookkal kérdezzük le a helyadatokat, ami a cache-t részesíti előnyben
    await fetchLocation();

    const isModalDisabled = window.localStorage.getItem('newsx_location_modal_disabled') === 'true';

    if (!isModalDisabled) {
      setShowLocationInfoModal(true);
    } else {
      if (loadLocalContent) {
        console.log('--- GOMB KATTINTÁS --- loadLocalContent hívás (handleLocalClick)');
        await loadLocalContent();
        onActivateTab('1');
      } else {
        onActivateTab('1');
      }
    }
  };

  // Modál kikapcsolásának kezelése
  const handleDisableModal = () => {
    window.localStorage.setItem('newsx_location_modal_disabled', 'true');
    console.log('Location modal disabled successfully');
  };

  // Tovább gomb kezelése - helyesen hozza létre a lokális hírek fülét
  const handleContinue = () => {
    setShowLocationInfoModal(false);
    if (loadLocalContent) {
      console.log('--- GOMB KATTINTÁS --- loadLocalContent hívás (handleContinue)');
      const result = loadLocalContent(); // <-- NINCS paraméter!
      if (result && typeof result.then === 'function') {
        result.then(() => {
          console.log('[LocalButton] Lokális hírek betöltve, aktiválás...');
          onActivateTab('1');
        }).catch((error) => {
          console.error('[LocalButton] Hiba a lokális hírek betöltésekor:', error);
          onActivateTab('1');
        });
      } else {
        onActivateTab('1');
      }
    } else {
      console.log('[LocalButton] loadLocalContent nem elérhető, csak aktiválás...');
      onActivateTab('1');
    }
  };

  // Beállítás gomb kezelése - navigálás a beállításokhoz
  const handleSetup = () => {
    setShowLocationInfoModal(false);
    if (openRightPanelWithMode) {
      openRightPanelWithMode('settings', 'location');
    } else {
      console.log('Navigálás a helyadatok beállításához');
      onActivateTab('settings');
    }
  };

  return (
    <>
      <button
        className={styles.localButton}
        onClick={handleLocalClick}
        disabled={loading || isLocationLoading}
      >
        {t('sideHeader.local', 'Local')}
      </button>

      {showLocationInfoModal && (
        <LocationInfoModal
          currentLocation={currentLocation}
          onContinue={handleContinue}
          onSetup={handleSetup}
          onClose={() => setShowLocationInfoModal(false)}
          onDisable={handleDisableModal}
        />
      )}
    </>
  );
};

export default LocalButton;
