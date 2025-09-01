// src\components\Card\Card.tsx
import React, { useRef, useMemo, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import styles from './Card.module.css';
import {
  getFaviconUrl,
  getAlternativeFaviconUrls,
  extractDomain,
} from '../../utils/favicon/favicon';
import { formatRelativeTime } from '../../utils/dateFormatter/dateFormatter';
import { CardBadge } from '../Badge/CardBadge';
import { UserHistoryService } from '../History/utils/UserHistoryService';

export interface CardProps {
  id?: string;
  title: string;
  description?: string;
  content?: string;
  imageUrl?: string;
  imageSrc?: string;
  source?: string;
  sourceId?: string;
  date?: string;
  url?: string;
  category?: string;
  country?: string;
  region?: string;
  continent?: string;
  isRead?: boolean;
  isNew?: boolean;
  onClick?: () => void;
  children?: React.ReactNode;
  className?: string;
  hasRssFeed?: boolean;
  sourceStatus?: 'valid' | 'invalid' | 'scraped' | 'unavailable';
  timestamp?: number;
  onToggleMenu?: (cardId: string | undefined, anchorEl: HTMLElement | null, cardEl?: HTMLElement | null) => void;
  onDismissNew?: () => void;
  // ✅ ÚJ: Keresési eredmény jelölés
  isSearchResult?: boolean; // Keresési eredmény-e
  onSourceClick?: (sourceId: string | undefined, source: string | undefined) => void;
}

export const Card: React.FC<CardProps> = ({
  id,
  title,
  description,
  content,
  imageUrl,
  imageSrc,
  source,
  sourceId,
  date,
  url,
  category,
  country,
  region,
  continent,
  isRead = false,
  onClick,
  children,
  className = '',
  hasRssFeed = false,
  sourceStatus = 'valid',
  timestamp,
  onToggleMenu,
  isNew,
  onDismissNew,
  // ✅ ÚJ: Keresési eredmény paraméter kicsomagolása
  isSearchResult = false,
  onSourceClick,
}) => {
  const moreButtonRef = useRef<HTMLButtonElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const { t } = useTranslation();

  const actualContent = useMemo(() => description || content, [description, content]);
  const actualImageUrl = useMemo(() => imageUrl || imageSrc, [imageUrl, imageSrc]);
  const actualCountry = useMemo(() => country || region, [country, region]);
  const hasNoImage = useMemo(() => !actualImageUrl, [actualImageUrl]);
  //////////////////////////////////////////////

  /*
  // ÚJ: Videó tartalom felismerése
  const isVideo = useMemo(() => {
    const text = `${title} ${actualContent || ''}`.toLowerCase();
    return text.includes('videó') || text.includes('video') || text.includes('műsor');
  }, [title, actualContent]);

  */

  // ÚJ (57-60. sor):
  const isVideo = useMemo(() => {
    const sourceText = (source || '').toLowerCase();
    return sourceText.includes('atv');
  }, [source]);

  /////////////////////////////////////
  const faviconUrl = useMemo(
    () => getFaviconUrl({ url, sourceId, sourceName: source }),
    [url, sourceId, source],
  );

  const getSourceInfo = useMemo((): string[] => {
    const parts = [];
    if (source) {
      const cleanSourceName = source.replace(/\.(hu|com|org|net|io|co\.uk|de|pl|ro)$/, '');
      parts.push(cleanSourceName);
    }
    parts.push(formatRelativeTime(timestamp || date));
    return parts;
  }, [source, timestamp, date]);

  const sourceInfo = getSourceInfo;

  // Stabilizált click handler
  const handleCardClick = useCallback(() => {
    console.log('CARD CLICK', { title, url, country, source });
    UserHistoryService.logVisit({
      timestamp: Date.now(),
      searchTerm: title,
      country,
      source,
      url,
    });
    if (onClick) {
      onClick();
    } else if (url) {
      window.open(url, '_blank', 'noopener,noreferrer');
    }
  }, [onClick, url, title, country, source]);

  return (
    <div
      className={`${styles.card} ${isRead ? styles.read : ''} ${hasNoImage ? styles.noImageCard : ''} ${isVideo ? styles.videoCard : ''} ${isSearchResult ? styles.searchResult : ''} ${className || ''}`}
      ref={cardRef}
    >
      {/* ✅ ÚJ: Keresési eredmény jelölő badge */}
      {/* {isSearchResult && <div className={styles.searchResultBadge}>🔍 {t('card.searchResult')}</div>} */}

      {/* ✅ ÚJ: Kattintható terület - kép és szöveg */}
      <div className={styles.clickableArea} onClick={handleCardClick}>
        {actualImageUrl && (
          <div className={styles.cardMedia}>
            <div className={isVideo ? styles.videoContainer : ''}>
              <img
                src={actualImageUrl}
                alt={title}
                className={styles.cardImage}
                onError={(e) => {
                  const currentSrc = (e.target as HTMLImageElement).src;
                  const domain = extractDomain({ url, sourceId, sourceName: source });
                  const alternatives = getAlternativeFaviconUrls(domain);

                  const currentIndex = alternatives.findIndex((alt) => alt === currentSrc);
                  if (currentIndex >= 0 && currentIndex < alternatives.length - 1) {
                    (e.target as HTMLImageElement).src = alternatives[currentIndex + 1];
                  } else {
                    (e.target as HTMLImageElement).style.display = 'none';
                  }
                }}
              />
              {/* ÚJ: Videó overlay */}
              {isVideo && (
                <div className={styles.videoOverlay}>
                  <div className={styles.playButton}>▶️</div>
                </div>
              )}
            </div>
          </div>
        )}
        <div className={styles.cardContent}>
          <h3 className={styles.cardTitle}>
            {/* ÚJ: Videó ikon */}
            {isVideo && <span className={styles.videoIcon}>🎥 </span>}
            {title}
            {sourceStatus === 'scraped' && (
              <span className={styles.sourceStatusIcon} title={t('card.status.scraped')}>
                🌐
              </span>
            )}
            {sourceStatus === 'invalid' && (
              <span className={styles.sourceStatusIcon} title={t('card.status.invalid')}>
                ⚠️
              </span>
            )}
            {sourceStatus === 'unavailable' && (
              <span className={styles.sourceStatusIcon} title={t('card.status.unavailable')}>
                ⛔
              </span>
            )}
            {hasRssFeed && (
              <span className={styles.rssIcon} title={t('card.rss')}>
                📶
              </span>
            )}
          </h3>

          {actualContent && (
            <p className={`${styles.cardExcerpt} ${hasNoImage ? styles.extendedExcerpt : ''}`}>
              {actualContent}
            </p>
          )}
        </div>
      </div>

      {/* ✅ ÚJ: Nem kattintható meta információk terület */}
      <div className={styles.metaArea} onClick={(e) => e.stopPropagation()}>
        <div className={styles.cardMeta}>
          {/* Favicon most gombként jelenik meg */}
          {faviconUrl && (
            <button
              className={styles.sourceIconButton}
              title={t('card.showSourceNews') || 'További hírek ettől a forrástól'}
              onClick={(e) => {
                e.stopPropagation();
                if (typeof onSourceClick === 'function') {
                  onSourceClick(sourceId, source);
                } else {
        //          console.log('Forrás ikonra kattintottak:', sourceId, source);
                }
              }}
              type="button"
            >
              <img src={faviconUrl} alt="" className={styles.sourceFavicon} />
            </button>
          )}
          {/* Forrásnév marad szövegként */}
          <span className={styles.resultSource}>{sourceInfo.join(' · ')}</span>

          {actualCountry && (
            <span className={`badge badge-country ${styles.metaBadge}`}>{actualCountry}</span>
          )}
          {category && (
            <span className={`badge badge-category ${styles.metaBadge}`}>{category}</span>
          )}
          {continent && (
            <span className={`badge badge-continent ${styles.metaBadge}`}>{continent}</span>
          )}

          <div className={styles.moreButtonContainer}>
            <button
              ref={moreButtonRef}
              className={styles.moreButton}
              title="More options"
              onClick={(e) => {
                // console.log('🔍 More button clicked:', { id, moreButtonRef: !!moreButtonRef.current, onToggleMenu: !!onToggleMenu });
                e.stopPropagation();
                e.preventDefault();
                if (onToggleMenu) {
                  onToggleMenu(id, moreButtonRef.current, cardRef.current);
                }
              }}
            >
              ⋮
            </button>
          </div>
        </div>
      </div>
      {children}
      <CardBadge isNew={isNew} onDismiss={onDismissNew} />
    </div>
  );
};

export default React.memo(Card);
