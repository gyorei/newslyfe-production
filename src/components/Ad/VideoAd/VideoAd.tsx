import React from 'react';
import styles from './VideoAd.module.css';

// ========================================
// 🎥 VIDEO AD KOMPONENS
// ========================================
// Videó-specifikus reklám komponens

export interface VideoAdProps {
  slotId: string;
  badgeLabel?: string;
  debug?: boolean;
  onVisible?: () => void;
  onClick?: () => void;
}

export const VideoAd: React.FC<VideoAdProps> = ({
  slotId,
  badgeLabel = '🎥 Ad',
  debug = false,
  onVisible,
  onClick,
}) => {
  return (
    <div className={styles.videoAdContainer} onClick={onClick}>
      <span className={styles.videoAdBadge}>{badgeLabel}</span>
      <div className={styles.videoAdContent}>
        <p>Video ad placement</p>
        <p>Slot ID: {slotId}</p>
        {debug && <p>Debug mode active</p>}
      </div>
    </div>
  );
};

export default VideoAd;
