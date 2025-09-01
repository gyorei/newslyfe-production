import * as React from 'react';
import styles from './Footer.module.css';

export const Footer: React.FC = () => {
  return (
    <footer className={styles.footer}>
      <p>© {new Date().getFullYear()} Európai Hírgyűjtő | Minden jog fenntartva</p>
      <p>Verzió: 1.0.0</p>
      {/* ========================================
       * 🎥 PRIVACY POLICY LINK - GOOGLE SZABÁLYOK!
       * ======================================== */}
      <div className={styles.privacyLinks}>
        <a 
          href="/privacy-policy" 
          target="_blank" 
          rel="noopener noreferrer"
          className={styles.privacyLink}
        >
          Adatvédelmi Tájékoztató
        </a>
        <span className={styles.separator}>|</span>
        <a 
          href="/terms-of-service" 
          target="_blank" 
          rel="noopener noreferrer"
          className={styles.privacyLink}
        >
          Szolgáltatási Feltételek
        </a>
      </div>
    </footer>
  );
};
