/*
import * as React from 'react';
import styles from './Header.module.css';

interface UserProps {
  onAuthClick?: () => void; // Átnevezve onOpenAuthPanel -> onAuthClick
}

export const User: React.FC<UserProps> = ({ onAuthClick }) => {
  const handleClick = () => {
    console.log('Felhasználó gomb megnyomva');
    if (onAuthClick) {
      console.log('onAuthClick függvény meghívva');
      onAuthClick();
    } else {
      console.log('onAuthClick függvény nem található!');
    }
  };

  return (
    <div className={styles.userSettings}>
      <button className={styles.userButton} onClick={handleClick} title="Fiókom">
        <span role="img" aria-label="Felhasználó">
          👤
        </span>
      </button>
    </div>
  );
};
*/