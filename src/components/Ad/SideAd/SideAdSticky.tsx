import React, { useState, useEffect, useRef } from 'react';
import styles from './SideAdSticky.module.css';
import { AdCard } from '../AdCard/AdCard';
import { trackAdEvent } from '../analytics';

const LOCALSTORAGE_KEY = 'sidebarStickyClosed';
const TOAST_TIMEOUT = 4000;

export const SideAdSticky: React.FC = () => {
  const [isClosed, setIsClosed] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [showInfo, setShowInfo] = useState(false);
  const toastTimeout = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (localStorage.getItem(LOCALSTORAGE_KEY) === 'true') {
      setIsClosed(true);
    }
  }, []);

  const handleClose = () => {
    setIsClosed(true);
    localStorage.setItem(LOCALSTORAGE_KEY, 'true');
    setShowToast(true);
    trackAdEvent('sticky_ad_closed', { slot: 'sidebar-sticky' });
    if (toastTimeout.current) clearTimeout(toastTimeout.current);
    toastTimeout.current = setTimeout(() => setShowToast(false), TOAST_TIMEOUT);
  };

  const handleUndo = () => {
    setIsClosed(false);
    setShowToast(false);
    localStorage.removeItem(LOCALSTORAGE_KEY);
    trackAdEvent('sticky_ad_undo', { slot: 'sidebar-sticky' });
  };

  const handleInfoOpen = () => {
    setShowInfo(true);
    trackAdEvent('sticky_ad_info_open', { slot: 'sidebar-sticky' });
  };

  const handleInfoClose = () => {
    setShowInfo(false);
    trackAdEvent('sticky_ad_info_close', { slot: 'sidebar-sticky' });
  };

  useEffect(() => {
    return () => {
      if (toastTimeout.current) clearTimeout(toastTimeout.current);
    };
  }, []);

  return (
    <>
      <div className={`${styles.stickyWrapper} ${isClosed ? styles.closed : ''}`}>
        {!isClosed && (
          <div className={styles.adContainer}>
            <AdCard 
              title="Sticky Sidebar Advertisement"
              description="Premium content and exclusive offers"
              advertiser="Premium Partner"
              clickUrl="#"
              badgeLabel="Ad"
              onClick={() => {
                console.log('[SideAdSticky] Sticky ad clicked');
              }}
            />
            <button
              className={styles.closeButton}
              onClick={handleClose}
              aria-label="Close ad"
              type="button"
            >
              &times;
            </button>
            <button
              className={styles.infoButton}
              onClick={handleInfoOpen}
              aria-label="Why am I seeing this ad?"
              type="button"
              title="Why am I seeing this ad?"
            >
              <svg width="18" height="18" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="10" cy="10" r="9" stroke="currentColor" strokeWidth="2" fill="none" />
                <text x="10" y="15" textAnchor="middle" fontSize="12" fill="currentColor" fontFamily="Arial" fontWeight="bold">i</text>
              </svg>
            </button>
            {showInfo && (
              <div className={styles.infoModal} role="dialog" aria-modal="true">
                <div className={styles.infoModalContent}>
                  <button
                    className={styles.infoModalClose}
                    onClick={handleInfoClose}
                    aria-label="Close info"
                    type="button"
                  >
                    &times;
                  </button>
                  <h4 className={styles.infoModalTitle}>Why am I seeing this ad?</h4>
                  <p className={styles.infoModalText}>
                    This ad is shown based on your interests or browsing activity. You can manage your ad preferences via <a href="https://adssettings.google.com/" target="_blank" rel="noopener noreferrer">Google Ad Settings</a>.
                  </p>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
      {showToast && (
        <div className={styles.toast} role="status" aria-live="polite">
          <span>Ad hidden.</span>
          <button className={styles.toastUndo} onClick={handleUndo} type="button">Undo</button>
        </div>
      )}
    </>
  );
};

export default SideAdSticky; 