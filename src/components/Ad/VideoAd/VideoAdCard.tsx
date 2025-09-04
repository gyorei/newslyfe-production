import React from 'react';
import styles from './VideoAdCard.module.css';
// ========================================
// 🎥 AD SENSE INTEGRATION - GOOGLE SZABÁLYOK!
// ========================================
import { AdSenseUnit } from '../AdCard/AdSenseUnit';
import { AD_CLIENT } from '../adConfig';

// ========================================
// 🎥 VIDEO AD CARD KOMPONENS
// ========================================
// Videó-specifikus reklám kártya

export interface VideoAdCardProps {
  title: string;
  description: string;
  imageUrl?: string;
  advertiser: string;
  clickUrl: string;
  badgeLabel?: string;
  onClick?: () => void;
  // ========================================
  // 🎥 AD SENSE PROPS - GOOGLE SZABÁLYOK!
  // ========================================
  slotId?: string;
  clientId?: string;
  format?: string;
  responsive?: boolean;
  debug?: boolean;
}

export const VideoAdCard: React.FC<VideoAdCardProps> = ({
  title,
  description,
  imageUrl,
  advertiser,
  clickUrl,
  badgeLabel = '🎥 Ad',
  onClick,
  // ========================================
  // 🎥 AD SENSE PROPS - GOOGLE SZABÁLYOK!
  // ========================================
  slotId = 'video-ad-slot',
  clientId,
  format = 'auto',
  responsive = true,
  debug = false,
}) => {
  // ========================================
  // 🎥 AD SENSE INTEGRATION - GOOGLE SZABÁLYOK!
  // ========================================
  const isProduction = process.env.NODE_ENV === 'production';
  const shouldShowAdSense = isProduction && slotId && clientId;

  return (
    <div className={styles.videoAdCard} onClick={onClick}>
      <span className={styles.videoAdBadge}>{badgeLabel}</span>
      
      {/* ========================================
       * 🎥 AD SENSE UNIT - GOOGLE SZABÁLYOK!
       * ======================================== */}
      {shouldShowAdSense ? (
        <div className={styles.videoAdSenseContainer}>
          <AdSenseUnit
            slotId={slotId}
            clientId={clientId || AD_CLIENT}
            format={format}
            responsive={responsive}
            style={{ 
              minHeight: 250, 
              border: 'none', 
              background: 'transparent',
              width: '100%'
            }}
          />
        </div>
      ) : (
        /* ========================================
         * 🎥 FALLBACK CONTENT - FEJLESZTŐI MÓD
         * ======================================== */
        <>
          {imageUrl && (
            <img src={imageUrl} alt={title} className={styles.videoAdImage} />
          )}
          <div className={styles.videoAdContent}>
            <h4 className={styles.videoAdTitle}>{title}</h4>
            <p className={styles.videoAdDescription}>{description}</p>
            <span className={styles.videoAdAdvertiser}>{advertiser}</span>
            {debug && (
              <div className={styles.videoAdDebug}>
                <p>Debug: Slot ID: {slotId}</p>
                <p>Debug: Client ID: {clientId || AD_CLIENT}</p>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default VideoAdCard;
