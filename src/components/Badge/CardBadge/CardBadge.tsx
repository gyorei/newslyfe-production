import React from 'react';
import styles from './CardBadge.module.css';

interface CardBadgeProps {
  isNew?: boolean;
  onDismiss?: () => void;
}

/**
 * CardBadge - Hírkártya "NEW" badge komponens
 * Minimális implementáció - fejlesztés alatt
 */
export const CardBadge: React.FC<CardBadgeProps> = ({ isNew = false, onDismiss }) => {
  if (!isNew) return null;

  return (
    <div className={styles.cardBadge} onClick={onDismiss} title="New article - click to dismiss">
      NEW
    </div>
  );
};
