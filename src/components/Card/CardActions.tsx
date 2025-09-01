/*
import * as React from 'react';
import styles from './CardActions.module.css';

interface CardActionsProps {
  id: string;
  onSave?: (id: string) => void;
  onShare?: (id: string) => void;
  onHide?: (id: string) => void;
}

export const CardActions: React.FC<CardActionsProps> = ({
  id,
  onSave,
  onShare,
  onHide
}) => {
  // Handler függvények az ID használatával
  const handleSave = React.useCallback(() => onSave?.(id), [id, onSave]);
  const handleShare = React.useCallback(() => onShare?.(id), [id, onShare]);
  const handleHide = React.useCallback(() => onHide?.(id), [id, onHide]);

  return (
    <div className={styles.cardActions} data-card-id={id}>
      <button className={styles.actionButton} onClick={handleSave} title="Save for later">
        🔖
      </button>
      <button className={styles.actionButton} onClick={handleShare} title="Share">
        📤
      </button>
      <button className={styles.actionButton} onClick={handleHide} title="Hide">
        🚫
      </button>
    </div>
  );
};
*/
