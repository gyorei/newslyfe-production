// src\components\VideoPanel\VideoCard.tsx
import React, { useState, useRef, useMemo } from 'react';
import styles from './VideoCard.module.css';
import YouTube, { YouTubeEvent } from 'react-youtube';
import { useVideoProgress } from '../../hooks/useVideoProgress';
import { VideoItem } from '../../types';

// ========================================
// 🎥 VIDEO CARD KOMPONENS
// ========================================
// Ez CSAK videó kártyákat jelenít meg!
// NEM keverjük a hír kártyákkal!

// ========================================
// Segédfüggvény: relatív idő formázás
// ========================================
function formatRelativeTime(dateString: string): string {
  const now = new Date();
  const date = new Date(dateString);
  const diff = Math.floor((now.getTime() - date.getTime()) / 1000); // másodperc
  if (isNaN(diff) || diff < 0) return '';
  if (diff < 60) return `${diff} second${diff === 1 ? '' : 's'} ago`;
  const min = Math.floor(diff / 60);
  if (min < 60) return `${min} minute${min === 1 ? '' : 's'} ago`;
  const hours = Math.floor(min / 60);
  if (hours < 24) return `${hours} hour${hours === 1 ? '' : 's'} ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days} day${days === 1 ? '' : 's'} ago`;
  const weeks = Math.floor(days / 7);
  if (weeks < 4) return `${weeks} week${weeks === 1 ? '' : 's'} ago`;
  const months = Math.floor(days / 30);
  if (months < 12) return `${months} month${months === 1 ? '' : 's'} ago`;
  const years = Math.floor(days / 365);
  return `${years} year${years === 1 ? '' : 's'} ago`;
}

// Segédfüggvény a videoId kinyeréséhez, ha csak link van
function extractVideoIdFromUrl(url?: string): string | undefined {
  if (!url) return undefined;
  // Már kezeli: watch?v=, youtu.be/, embed/
  const match = url.match(/(?:v=|youtu\.be\/|embed\/)([a-zA-Z0-9_-]{11})/);
  return match?.[1];
}

export interface VideoCardProps {
  video: VideoItem;
  onToggleMenu?: (cardId: string | undefined, anchorEl: HTMLElement | null, cardEl?: HTMLElement | null) => void;
  onVideoClick?: (videoId: string, title: string) => void;
  modalMode?: boolean;
}

export const VideoCard: React.FC<VideoCardProps> = ({ video, onToggleMenu, onVideoClick, modalMode = false }) => {
  // --- Fejlesztői flag: azonnali lejátszó vagy lusta betöltés --
  // -true: mindig azonnal a YouTube lejátszó (iframe) jelenjen meg (egykattintásos, de lassabb oldal).
  // false: csak kattintásra töltődjön be az iframe (lusta betöltés, gyors oldal, két kattintás).
  const alwaysShowPlayer =false;
  const [playerActive, setPlayerActive] = useState(false);
  const videoId = video.videoId || extractVideoIdFromUrl(video.link);

  // Kattintás kezelése: modal mód vs. kártya lejátszás
  const handleCardClick = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('button')) {
      return;
    }
    console.log('[VideoCard] SINGLE CLICK HANDLER FIRED', { modalMode });
    if (modalMode && onVideoClick && videoId && video.title) {
      onVideoClick(videoId, video.title);
    } else {
      if (!playerActive) {
        setPlayerActive(true);
        console.log('[VideoCard] playerActive set TRUE');
      }
    }
  };

  // YouTube gomb kattintás kezelése
  const handleYouTubeClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (videoId) {
      window.open(`https://www.youtube.com/watch?v=${videoId}`, '_blank', 'noopener,noreferrer');
    }
  };

  // --- Memoizált relatív dátum formázás ---
  const formattedPublished = useMemo(
    () => video.published ? formatRelativeTime(video.published) : "",
    [video.published]
  );

  // --- Előnézeti lejátszás kapcsoló ---
  const limitPreviewToOneMinute = false;
  const PREVIEW_DURATION_SECONDS = 60;
  const [isPreviewFinished, setIsPreviewFinished] = useState(false);
  const previewTimerRef = useRef<NodeJS.Timeout | null>(null);
  const playerInstanceRef = useRef<any>(null);

  // DEBUG: video objektum logolása
  React.useEffect(() => {
    console.log('[VideoCard] video:', video);
  }, [video]);

  React.useEffect(() => {
    console.log('[VideoCard] render', { video, playerActive });
  });

  React.useEffect(() => {
    console.log('[VideoCard] playerActive changed:', playerActive, { video });
  }, [playerActive]);

  // Videó pozíció követés
  const {
    progress: _progress,
    hasProgress: _hasProgress,
    watchPercentage: _watchPercentage,
    handlePlayerReady,
    handleStateChange: originalHandleStateChange,
    clearProgress: _clearProgress
  } = useVideoProgress(videoId || '');

  // --- Előnézeti logika: timer indítása/leállítása ---
  const handleStateChange = (event: YouTubeEvent<number>) => {
    originalHandleStateChange(event); // pozíció mentés továbbra is működik
    const { data } = event;
    if (limitPreviewToOneMinute) {
      if (data === 1 && !isPreviewFinished) { // playing
        // Ha még nincs timer, indítjuk
        if (!previewTimerRef.current) {
          previewTimerRef.current = setTimeout(() => {
            try {
              event.target?.pauseVideo?.();
            } catch (error) {
              console.warn('[VideoCard] Video stop error:', error);
            }
            setIsPreviewFinished(true);
          }, PREVIEW_DURATION_SECONDS * 1000);
        }
      } else if (data !== 1) { // pause/ended
        // Timer leállítása
        if (previewTimerRef.current) {
          clearTimeout(previewTimerRef.current);
          previewTimerRef.current = null;
        }
      }
    }
  };

  // --- Cleanup: timer törlése unmountkor, mindig az aktuális ref értéket olvasva ---
  React.useEffect(() => {
    const timer = previewTimerRef.current;
    return () => {
      if (timer) clearTimeout(timer);
    };
  }, []);

  return (
    <div 
      className={styles.videoCard} 
      onClick={!playerActive ? handleCardClick : undefined}
      style={{ cursor: !playerActive ? 'pointer' : 'default' }}
    >
      {/* 🎥 VIDEO BADGE */}
      <div className={styles.videoBadge}>🎥</div>

      {/* 🎥 YOUTUBE PLAYER vagy THUMBNAIL - alwaysShowPlayer flag alapján */}
      {/* VIDEÓLEJÁTSZÓ RÉTEGEZÉSHEZ TARTOZÓ KÓD! TILOS TÖRÖLNI VAGY MÓDOSÍTANI! */}
      {/* Ez biztosítja, hogy a lejátszó minden gomb és overlay fölött legyen, mobilon is! */}
      <div className={`${styles.thumbnailContainer} ${playerActive ? styles.playerActive : ''}`}>
        {playerActive ? (
          videoId && !isPreviewFinished ? (
            <YouTube
              videoId={videoId}
              opts={{
                width: '100%',
                height: '220',
                playerVars: {
                  autoplay: 1,
                  controls: 1,
                },
              }}
              onReady={event => {
                event.target.unMute();
                playerInstanceRef.current = event.target;
                handlePlayerReady(event);
              }}
              onStateChange={handleStateChange}
            />
          ) : (
            // Előnézet vége: overlay/gomb
            <div className={styles.previewOverlay}>
              <div className={styles.previewMsg}>Preview ended – Watch full video on YouTube with ads</div>
              <button
                className={styles.youtubeCornerButton}
                onClick={handleYouTubeClick}
                tabIndex={0}
                aria-label="Watch on YouTube"
              >
                <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" focusable="false" style={{ marginRight: '4px' }}>
                  <g>
                    <rect fill="#FF0000" x="2" y="4" width="20" height="16" rx="4"/>
                    <polygon fill="#fff" points="10,8 16,12 10,16"/>
                  </g>
                </svg>
                Watch full video on YouTube
              </button>
            </div>
          )
        ) : (
          <>
            {videoId && (
              <img
                src={`https://img.youtube.com/vi/${videoId}/hqdefault.jpg`}
                alt={video.title || "YouTube video thumbnail"}
                className={styles.thumbnail}
              />
            )}
          </>
        )}
      </div>

      {/* 🎥 CONTENT CONTAINER - Flexbox a gomb alul tartásához */}
      <div className={styles.contentContainer}>
        {/* 🎥 VIDEO TITLE */}
        <h3 className={styles.videoTitle}>
          {video.title}
        </h3>

        {/* 🎥 VIDEO META - egysoros, ponttal elválasztva */}
        <div className={styles.videoMetaRow}>
          <span className={styles.channelName}>{video.channelName || video.author}</span>
          {video.views && (
            <span className={styles.metaSeparator}>·</span>
          )}
          {video.views && (
            <span className={styles.views}>{video.views.toLocaleString()} views</span>
          )}
          {video.published && (
            <>
              <span className={styles.metaSeparator}>·</span>
              <span className={styles.published}>{formattedPublished}</span>
            </>
          )}
        </div>

        {/* YouTube gomb a kártya bal alsó sarkában, a tartalom alatt */}
        <button
          className={styles.youtubeCornerButton}
          onClick={handleYouTubeClick}
          aria-label="Watch on YouTube"
        >
          YouTube
        </button>
      </div>

      {/* Opcionális: Menü gomb */}
      {onToggleMenu && (
        <button
          className={styles.menuButton}
          onClick={e => {
            e.stopPropagation();
            onToggleMenu(video.id || videoId, e.currentTarget, undefined);
          }}
        >
          ⋮
        </button>
      )}
    </div>
  );
};

// Memoizált VideoCard komponens
const MemoizedVideoCard = React.memo(VideoCard, (prevProps, nextProps) => {
  // Értékalapú összehasonlítás: csak akkor renderel, ha a video id vagy videoId tényleg változik
  const videoIdChanged = (prevProps.video.id || prevProps.video.videoId) !== (nextProps.video.id || nextProps.video.videoId);
  return !videoIdChanged &&
    prevProps.modalMode === nextProps.modalMode &&
    prevProps.onVideoClick === nextProps.onVideoClick &&
    prevProps.onToggleMenu === nextProps.onToggleMenu;
});

export default MemoizedVideoCard;