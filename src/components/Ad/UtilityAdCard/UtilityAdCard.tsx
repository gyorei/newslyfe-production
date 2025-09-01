import * as React from 'react';
import styles from './UtilityAdCard.module.css';

// ========================================
// 🎥 UTILITY AD CARD - GOOGLE SZABÁLYOK!
// ========================================
// Utility panel reklám komponens

interface UtilityAdCardProps {
  title: string;
  description?: string;
  imageUrl?: string;
  linkUrl?: string;
  sponsor?: string;
  onClick?: () => void;
}

export const UtilityAdCard: React.FC<UtilityAdCardProps> = ({
  title,
  description,
  imageUrl,
  linkUrl,
  sponsor,
  onClick,
}) => {
  const handleClick = React.useCallback(() => {
    if (linkUrl) {
      window.open(linkUrl, '_blank', 'noopener,noreferrer');
    }
    if (onClick) {
      onClick();
    }
  }, [linkUrl, onClick]);

  return (
    <div className={styles.utilityAdCardContainer} onClick={handleClick}>
      {imageUrl && (
        <div className={styles.utilityAdImageContainer}>
          <img src={imageUrl} alt={title} className={styles.utilityAdImage} />
        </div>
      )}
      <div className={styles.utilityAdContent}>
        <h3 className={styles.utilityAdTitle}>{title}</h3>
        {description && <p className={styles.utilityAdDescription}>{description}</p>}
        {sponsor && <p className={styles.utilityAdSponsor}>Provided by: {sponsor}</p>}
      </div>
    </div>
  );
};

export default UtilityAdCard; 