/* src\components\Ad\AdCard.tsx */

import React from 'react';
import styles from './AdCard.module.css';

export interface AdCardProps {
  title: string;
  description: string;
  imageUrl?: string;
  advertiser: string;
  clickUrl: string;
  badgeLabel?: string; // "Ad" vagy "Sponsored"
  onClick?: () => void;
}

export const AdCard: React.FC<AdCardProps> = ({
  title,
  description,
  imageUrl,
  advertiser,
  clickUrl,
  badgeLabel = 'Ad',
  onClick,
}) => {
  // Fejlesztői mock mód
  if (process.env.NODE_ENV !== 'production') {
    return (
      <div className={styles.mockAdCard} onClick={onClick} role="region" aria-label="Developer mock ad">
        <span className={styles.mockAdBadge}>{badgeLabel}</span>
        <div className={styles.mockAdContent}>
          <p>This is a developer mock ad.</p>
          <p><b>{title}</b></p>
          <p>{description}</p>
          <div style={{width: '80%', height: 32, background: '#e0e0e0', borderRadius: 4, margin: '12px auto'}} />
        </div>
      </div>
    );
  }

  return (
    <div className={styles.adCardContainer} role="region" aria-label={badgeLabel || 'Ad'}>
      <span className={styles.adBadge}>{badgeLabel}</span>
      <a href={clickUrl} target="_blank" rel="noopener noreferrer" className={styles.adCardLink} onClick={onClick}>
        {imageUrl && <img src={imageUrl} alt={title} className={styles.adCardImage} />}
        <div className={styles.adCardContent}>
          <h4 className={styles.adCardTitle}>{title}</h4>
          <p className={styles.adCardDescription}>{description}</p>
          <span className={styles.adCardAdvertiser}>{advertiser}</span>
        </div>
      </a>
    </div>
  );
};