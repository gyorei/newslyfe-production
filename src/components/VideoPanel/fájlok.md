import React from 'react';
import { VideoCard } from './VideoCard';
import styles from './VideoPanel.module.css';
// ========================================
// 🎥 VIDEO PANEL KOMPONENS
// ========================================
// Ez CSAK videókat jelenít meg!
// NEM keverjük a hírekkel!

export interface VideoPanelProps {
  activeTabId: string;
  title?: string;
  videoItems: any[]; // később: YouTubeVideo[] vagy VideoNewsItem[]
  loading?: boolean;
  error?: Error | string | null;
  onRetry?: () => void;
  onToggleMenu?: (cardId: string | undefined, anchorEl: HTMLElement | null, cardEl?: HTMLElement | null) => void;
}

export const VideoPanel: React.FC<VideoPanelProps> = ({
  activeTabId,
  title = 'Video News',
  videoItems = [],
  loading = false,
  error = null,
  onRetry,
  onToggleMenu,
}) => {
  React.useEffect(() => {
    console.log('[VideoPanel] Render, videoItems:', videoItems.length, 'loading:', loading, 'error:', error);
    console.log('[VideoPanel] ✅ Panel mérethez igazodó grid - auto-fit + minmax');
    console.log('[VideoPanel] 📏 Grid layout: repeat(auto-fit, minmax(280px, 1fr)) - panel húzáshoz igazodva');
    
    // ✅ DEBUG: Képernyő méret és CSS ellenőrzés
    const checkGridLayout = () => {
      const videoGrid = document.querySelector('.videoGrid');
      if (videoGrid) {
        const computedStyle = getComputedStyle(videoGrid);
        const windowWidth = window.innerWidth;
        const gridTemplateColumns = computedStyle.gridTemplateColumns;
        
        console.log('[VideoPanel] 🔍 Debug info:', {
          windowWidth,
          gridTemplateColumns,
          className: videoGrid.className,
          mobileQuery: window.matchMedia('(max-width: 768px)').matches,
          tabletQuery: window.matchMedia('(min-width: 769px) and (max-width: 1024px)').matches,
          desktopQuery: window.matchMedia('(min-width: 1025px)').matches
        });
      }
    };
    
    // Ellenőrzés render után
    setTimeout(checkGridLayout, 100);
    
    // Resize listener
    window.addEventListener('resize', checkGridLayout);
    
    return () => {
      window.removeEventListener('resize', checkGridLayout);
    };
  }, [videoItems, loading, error]);
  
  // ========================================
  // 🎥 VIDEO RENDER LOGIKA
  // ========================================
  // Teljesen eltávolítjuk a címet, mivel a videókártyák már a helyükön vannak
  return (
    <div className={styles.videoPanel}>
      {/* Cím eltávolítva - a videókártyák már a helyükön vannak */}
      
      {loading && (
        <div className={styles.loadingContainer}>
          Loading videos...
        </div>
      )}
      
      {error && (
        <div className={styles.errorContainer}>
          <p className={styles.errorMessage}>
            {error instanceof Error ? error.message : error}
          </p>
          {onRetry && (
            <button 
              onClick={onRetry}
              className={styles.retryButton}
            >
              Retry
            </button>
          )}
        </div>
      )}
      
      {!loading && !error && videoItems.length === 0 && (
        <div className={styles.emptyContainer}>
          No videos found.
        </div>
      )}
      
      <div className={styles.videoGrid}>
        {videoItems.map((video, idx) => (
          <VideoCard 
            key={video.id || video.videoId || idx} 
            video={video} 
            onToggleMenu={onToggleMenu} 
          />
        ))}
      </div>
    </div>
  );
};

export default VideoPanel;

/* ========================================
 * 🎥 VIDEO PANEL CSS MODULE
 * ========================================
 * Ez CSAK videó panel stílusokat tartalmaz!
 * NEM keverjük a hír panel stílusokkal!
 */

.videoPanel {
  padding: 0px;
  padding-bottom: 100px; /* ✅ ÚJ: Hogy az utolsó kártyák is láthatóak legyenek */
  width: 100%;
  margin: 0 auto;
}

.videoPanelTitle {
  margin-bottom: 20px;
  color: #333;
}

.loadingContainer {
  text-align: center;
  padding: 20px;
}

.errorContainer {
  color: red;
  padding: 20px;
  text-align: center;
}

.errorMessage {
  margin-bottom: 10px;
}

.retryButton {
  margin-top: 10px;
  padding: 8px 16px;
  backgroundColor: #007bff;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

.emptyContainer {
  text-align: center;
  padding: 20px;
  color: #666;
}

.videoGrid {
  display: grid;
  /* ✅ DINAMIKUS GRID - Panel mérethez igazodva */
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 20px;
  padding: 16px 0;
  width: 100%;
  /* ✅ Overflow kezelés - szélek védelme */
  overflow: hidden;
}

/* ========================================
 * 🎥 COMPLETE DARK MODE (OPTION A)
 * ========================================
 * Minden elem sötét - teljes dark mode
 */

:global(.app.dark) .videoPanel {
  background-color: #121212 !important;
}

:global(.app.dark) .videoPanelTitle {
  color: #e4e4e4 !important;
}

:global(.app.dark) .loadingContainer {
  color: #e4e4e4 !important;
}

:global(.app.dark) .errorContainer {
  color: #ff6b6b !important;
}

:global(.app.dark) .errorMessage {
  color: #ff6b6b !important;
}

:global(.app.dark) .retryButton {
  background-color: #0d6efd !important;
  color: #ffffff !important;
}

:global(.app.dark) .retryButton:hover {
  background-color: #0b5ed7 !important;
}

:global(.app.dark) .emptyContainer {
  color: #a7a7a7 !important;
}

/* ========================================
 * �� RESPONZÍV DESIGN - Panel mérethez igazodva
 * ========================================
 */

/* Mobile: 1 oszlop (teljes szélesség, overflow javítás) */
@media (max-width: 768px) {
  .videoGrid {
    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); /* ✅ Kisebb minimum mobilon */
    gap: 12px;
    padding: 12px 10px; /* ✅ Oldalsó padding a szélek védelmére */
  }
  
  .videoPanel {
    padding: 12px;
    /* ✅ Overflow kezelés */
    overflow: hidden;
  }
}

/* Tablet: Dinamikus oszlop (közepes képernyő, gap csökkentés) */
@media (min-width: 769px) and (max-width: 1024px) {
  .videoGrid {
    grid-template-columns: repeat(auto-fit, minmax(260px, 1fr)); /* ✅ Tablet minimum */
    gap: 16px; /* ✅ Gap csökkentés a jobb illeszkedéshez */
    padding: 16px 10px; /* ✅ Oldalsó padding */
  }
}

/* Desktop: Dinamikus oszlop (nagy képernyő, eredeti) */
@media (min-width: 1025px) {
  .videoGrid {
    grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); /* ✅ Desktop minimum */
    gap: 20px;
    padding: 16px 0;
  }
}

----------------------------------------------------------

import React, { useState, useEffect, useRef } from 'react';
import styles from './VideoCard.module.css';
import { useVideoProgress } from '../../hooks/useVideoProgress';

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

export interface VideoCardProps {
  video: any; // később: YouTubeVideo típus
  onToggleMenu?: (cardId: string | undefined, anchorEl: HTMLElement | null, cardEl?: HTMLElement | null) => void;
}

export const VideoCard: React.FC<VideoCardProps> = ({ video, onToggleMenu }) => {
  const [playerActive, setPlayerActive] = useState(false);
  const playerRef = useRef<HTMLDivElement>(null);
  const playerInstanceRef = useRef<any>(null);

  // DEBUG: video objektum logolása
  console.log('[VideoCard] video:', video);

  // YouTube videoId kinyerése (pl. video.videoId vagy video.link-ből)
  const videoId = video.videoId || extractVideoIdFromUrl(video.link);

  // Videó pozíció követés
  const {
    progress,
    hasProgress,
    watchPercentage,
    handlePlayerReady,
    handleStateChange,
    clearProgress
  } = useVideoProgress(videoId);

  const handleWatch = () => {
    setPlayerActive(true);
  };

  // Segédfüggvény a videoId kinyeréséhez, ha csak link van
  function extractVideoIdFromUrl(url?: string): string | undefined {
    if (!url) return undefined;
    // Támogatja a https://www.youtube.com/watch?v=... és https://youtu.be/... formátumokat is
    const match = url.match(/(?:v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
    return match ? match[1] : undefined;
  }

  return (
    <div className={styles.videoCard}>
      
      {/* 🎥 VIDEO BADGE */}
      <div className={styles.videoBadge}>🎥</div>

      {/* 🎥 VIDEO THUMBNAIL vagy YOUTUBE PLAYER */}
      <div className={styles.thumbnailContainer}>
        {playerActive && videoId ? (
          <div 
            ref={playerRef}
            className={styles.youtubePlayerContainer}
          >
            <iframe
              src={`https://www.youtube.com/embed/${videoId}?autoplay=0&enablejsapi=1&origin=${encodeURIComponent(window.location.origin)}&rel=0&modestbranding=0`}
              width="100%"
              height="100%"
              frameBorder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              onLoad={() => {
                console.log('[YouTube Debug] ✅ Reszponzív iframe betöltve - YouTube brand safety javítva');
                console.log('[YouTube Debug] Video ID:', videoId);
                console.log('[YouTube Debug] Felhasználói interakció: ✅');
              }}
            />
          </div>
        ) : (
          <>
            <img 
              src={video.thumbnail} 
              alt={video.title} 
              className={styles.thumbnail}
            />
            
            {/* Progress bar overlay */}
            {hasProgress && (
              <div className={styles.progressOverlay}>
                <div 
                  className={styles.progressBar} 
                  style={{ width: `${watchPercentage}%` }}
                />
                <div className={styles.progressText}>
                  {Math.round(watchPercentage)}% megnézve
                </div>
              </div>
            )}
            
            {/* 🎯 DEDIKÁLT PLAY GOMB - Click-to-Play Stratégia */}
            <div className={styles.playOverlay}>
              <button 
                className={styles.playButton}
                onClick={handleWatch}
                aria-label="Lejátszás"
              >
                <svg className={styles.playButtonIcon} viewBox="0 0 60 60" width="60" height="60" aria-hidden="true" focusable="false">
                  <circle cx="30" cy="30" r="28" fill="rgba(0,0,0,0.45)" />
                  <polygon points="25,20 45,30 25,40" fill="#fff" />
                </svg>
              </button>
            </div>
          </>
        )}
      </div>

      {/* 🎥 CONTENT CONTAINER - Flexbox a gomb alul tartásához */}
      <div className={styles.contentContainer}>
        {/* 🎥 VIDEO TITLE */}
        <h3 className={styles.videoTitle} onClick={handleWatch}>
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
              <span className={styles.published}>{formatRelativeTime(video.published)}</span>
            </>
          )}
        </div>

        {/* YouTube platform link - Reklám garantálás */}
        <button
          className={styles.youtubeCornerButton}
          onClick={e => { 
            e.stopPropagation(); 
            window.open(`https://www.youtube.com/watch?v=${videoId}`, '_blank');
          }}
          tabIndex={0}
          aria-label="Megtekintés YouTube-on"
        >
          <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" focusable="false" style={{marginRight: '4px'}}>
            <g>
              <rect fill="#FF0000" x="2" y="4" width="20" height="16" rx="4"/>
              <polygon fill="#fff" points="10,8 16,12 10,16"/>
            </g>
          </svg>
          YouTube
        </button>
      </div>

      {/* Opcionális: Menü gomb */}
      {onToggleMenu && (
        <button
          className={styles.menuButton}
          onClick={e => {
            e.stopPropagation();
            onToggleMenu(video.id || video.videoId, e.currentTarget, undefined);
          }}
        >
          ⋮
        </button>
      )}
    </div>
  );
};

export default VideoCard;

