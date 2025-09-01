.sideAdCompact {
  margin: 8px 12px;
  height: 60px;
  overflow: hidden;
  border-radius: 4px;
  transition: all 0.3s ease-in-out;
  background-color: var(--color-surface);
  border: 1px solid var(--color-border);
}

.belowSearchResults {
  margin-top: 6px;
  margin-bottom: 8px;
}

.belowCountries {
  margin-top: 16px;
  margin-bottom: 12px;
}

/* Reszponzív viselkedés */
@media (max-width: 768px) {
  .sideAdCompact {
    margin: 6px 8px;
    height: 50px;
  }
  
  .belowSearchResults {
    margin-top: 4px;
    margin-bottom: 6px;
  }
  
  .belowCountries {
    margin-top: 12px;
    margin-bottom: 8px;
  }
}

/* Dark mode támogatás */
.app.dark .sideAdCompact {
  background-color: var(--color-panel-left);
  border-color: var(--color-panel-border);
} 

import React from 'react';
import styles from './SideAd.module.css';
import { AdCard } from '../AdCard';

interface SideAdProps {
  isSearchActive?: boolean;
  searchResults?: string[];
  position: 'below-countries' | 'below-search-results';
  activeLetter?: string; // ABC kereső aktív betűje
}

export const SideAd: React.FC<SideAdProps> = ({
  isSearchActive = false,
  searchResults = [],
  position,
  activeLetter,
}) => {
  const dynamicClass = position === 'below-search-results' ? styles.belowSearchResults : styles.belowCountries;
  
  // Dinamikus ad slot ABC betű alapján
  const adSlot = activeLetter 
    ? `sidebar-compact-${activeLetter.toLowerCase()}` 
    : 'sidebar-compact';

  return (
    <div className={`${styles.sideAdCompact} ${dynamicClass}`}>
      <AdCard 
     
        adSlot={adSlot}
        onVisible={() => {
          console.log(`[SideAd] Hírdetés látható: ${position}, betű: ${activeLetter || 'none'}`);
        }}
        onClick={() => {
          console.log(`[SideAd] Hírdetés kattintás: ${position}, betű: ${activeLetter || 'none'}`);
        }}
      />
    </div>
  );
}; 


.stickyWrapper {
  position: sticky;
  bottom: 0;
  width: 92%;
  margin: 0 auto 8px auto;
  padding: 6px 0;
  background-color: #fff;
  z-index: 5;
  text-align: center;
  border-top: 1px solid #e0e0e0;
  max-width: 300px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.08);
  transition: box-shadow 0.2s, height 0.3s ease-out, opacity 0.3s ease-out;
  overflow: hidden;
}

.stickyWrapper.closed {
  height: 0;
  opacity: 0;
  padding: 0;
  margin: 0;
  pointer-events: none;
  border: none;
}

.adContainer {
  position: relative;
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0 30px 0 0;
}

.closeButton {
  position: absolute;
  top: 8px;
  right: 8px;
  cursor: pointer;
  font-size: 18px;
  color: #aaa;
  padding: 2px 5px;
  line-height: 1;
  background: rgba(255, 255, 255, 0.7);
  border-radius: 4px;
  z-index: 10;
  border: none;
  transition: color 0.2s, background-color 0.2s;
}

.closeButton:hover {
  color: #000;
  background: rgba(255, 255, 255, 0.9);
}

@media (max-width: 768px) {
  .stickyWrapper {
    width: 98%;
    max-width: 100%;
    padding: 4px 0;
    border-radius: 6px;
    margin-bottom: 4px;
  }
  .stickyWrapper.closed {
    height: 0;
    opacity: 0;
    padding: 0;
    margin: 0;
    pointer-events: none;
    border: none;
  }
  .closeButton {
    top: 5px;
    right: 5px;
    font-size: 16px;
  }
  .adContainer {
    padding: 0 25px 0 0;
  }
}

.app.dark .stickyWrapper {
  background: var(--color-panel-left, #222);
  box-shadow: 0 2px 8px rgba(0,0,0,0.18);
  border-top-color: var(--color-panel-border, #444);
}

.app.dark .stickyWrapper.closed {
  background: #222;
  box-shadow: none;
  border-top-color: transparent;
}

.app.dark .closeButton {
  color: #bbb;
  background: rgba(34, 34, 34, 0.7);
}

.app.dark .closeButton:hover {
  color: #fff;
  background: rgba(34, 34, 34, 0.9);
}

.toast {
  position: fixed;
  left: 50%;
  bottom: 32px;
  transform: translateX(-50%);
  background: #222;
  color: #fff;
  padding: 12px 24px;
  border-radius: 24px;
  box-shadow: 0 2px 12px rgba(0,0,0,0.18);
  display: flex;
  align-items: center;
  gap: 16px;
  font-size: 15px;
  z-index: 9999;
  animation: toastIn 0.25s ease;
}

@keyframes toastIn {
  from { opacity: 0; transform: translateX(-50%) translateY(20px); }
  to   { opacity: 1; transform: translateX(-50%) translateY(0); }
}

.toastUndo {
  background: #fff;
  color: #222;
  border: none;
  border-radius: 16px;
  padding: 4px 16px;
  font-weight: 600;
  font-size: 15px;
  cursor: pointer;
  transition: background 0.2s, color 0.2s;
}
.toastUndo:hover {
  background: #f0f0f0;
  color: #000;
}

@media (max-width: 600px) {
  .toast {
    padding: 10px 8px;
    font-size: 14px;
    bottom: 16px;
    border-radius: 16px;
    gap: 8px;
  }
  .toastUndo {
    padding: 4px 10px;
    font-size: 14px;
  }
}

.app.dark .toast {
  background: #222;
  color: #fff;
}

.app.dark .toastUndo {
  background: #444;
  color: #fff;
}
.app.dark .toastUndo:hover {
  background: #666;
  color: #fff;
} 

.infoButton {
  position: absolute;
  top: 8px;
  left: 8px;
  background: rgba(255,255,255,0.85);
  color: #444;
  border: none;
  border-radius: 50%;
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  z-index: 12;
  transition: background 0.2s, color 0.2s;
  padding: 0;
}
.infoButton:hover {
  background: #e0e0e0;
  color: #000;
}

.infoButton svg {
  display: block;
}

.infoModal {
  position: fixed;
  left: 0;
  top: 0;
  width: 100vw;
  height: 100vh;
  background: rgba(0,0,0,0.32);
  z-index: 10000;
  display: flex;
  align-items: center;
  justify-content: center;
  animation: fadeIn 0.2s;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to   { opacity: 1; }
}

.infoModalContent {
  background: #fff;
  color: #222;
  border-radius: 14px;
  box-shadow: 0 4px 32px rgba(0,0,0,0.18);
  padding: 28px 24px 20px 24px;
  max-width: 340px;
  width: 90vw;
  position: relative;
  text-align: left;
  font-size: 15px;
}

.infoModalClose {
  position: absolute;
  top: 10px;
  right: 12px;
  background: none;
  border: none;
  color: #888;
  font-size: 22px;
  cursor: pointer;
  z-index: 2;
  padding: 0 4px;
  line-height: 1;
  transition: color 0.2s;
}
.infoModalClose:hover {
  color: #000;
}

.infoModalTitle {
  margin: 0 0 10px 0;
  font-size: 17px;
  font-weight: 700;
}

.infoModalText {
  margin: 0;
  font-size: 15px;
  color: #333;
}

.infoModalText a {
  color: #1976d2;
  text-decoration: underline;
}
.infoModalText a:hover {
  color: #0d47a1;
}

@media (max-width: 600px) {
  .infoModalContent {
    padding: 18px 8px 14px 8px;
    font-size: 14px;
    max-width: 96vw;
  }
  .infoModalTitle {
    font-size: 15px;
  }
  .infoModalText {
    font-size: 14px;
  }
}

.app.dark .infoButton {
  background: rgba(34,34,34,0.85);
  color: #fff;
}
.app.dark .infoButton:hover {
  background: #444;
  color: #fff;
}

.app.dark .infoModalContent {
  background: #232323;
  color: #fff;
}
.app.dark .infoModalClose {
  color: #bbb;
}
.app.dark .infoModalClose:hover {
  color: #fff;
}
.app.dark .infoModalText {
  color: #eee;
}
.app.dark .infoModalText a {
  color: #90caf9;
}
.app.dark .infoModalText a:hover {
  color: #42a5f5;
} 


import React, { useState, useEffect, useRef } from 'react';
import styles from './SideAdSticky.module.css';
import { AdCard } from '../AdCard';

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
    if (window.gtag) {
      window.gtag('event', 'sticky_ad_closed', { slot: 'sidebar-sticky' });
    } else {
      console.log('[Analytics] sticky_ad_closed', { slot: 'sidebar-sticky' });
    }
    if (toastTimeout.current) clearTimeout(toastTimeout.current);
    toastTimeout.current = setTimeout(() => setShowToast(false), TOAST_TIMEOUT);
  };

  const handleUndo = () => {
    setIsClosed(false);
    setShowToast(false);
    localStorage.removeItem(LOCALSTORAGE_KEY);
    if (window.gtag) {
      window.gtag('event', 'sticky_ad_undo', { slot: 'sidebar-sticky' });
    } else {
      console.log('[Analytics] sticky_ad_undo', { slot: 'sidebar-sticky' });
    }
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
            <AdCard adSlot="sidebar-sticky" />
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
              onClick={() => setShowInfo(true)}
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
                    onClick={() => setShowInfo(false)}
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