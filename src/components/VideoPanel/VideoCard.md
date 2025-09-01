// src\components\VideoPanel\VideoCard.tsx
import React, { useState, useEffect, useRef } from 'react';
import styles from './VideoCard.module.css';
import YouTube from 'react-youtube';
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
  const [showClearMsg, setShowClearMsg] = useState(false);

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
      <div className={styles.thumbnailContainer} onClick={!playerActive ? handleWatch : undefined} style={{ cursor: !playerActive ? 'pointer' : 'default' }}>
        {playerActive && videoId ? (
          <YouTube
            videoId={videoId}
            opts={{ width: '100%', height: '220' }}
            onReady={event => {
              playerInstanceRef.current = event.target;
              handlePlayerReady(event);
            }}
            onStateChange={handleStateChange}
          />
        ) : (
          <>
            {videoId && (
              <img
                src={`https://img.youtube.com/vi/${videoId}/hqdefault.jpg`}
                alt={video.title}
                className={styles.thumbnail}
              />
            )}
            {/*
            // Saját progress bar overlay - KIKOMMENTELVE, hogy a YouTube szabályzatnak megfeleljen
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
            // Saját play gomb overlay - KIKOMMENTELVE
            <div className={styles.playButton}>
              <svg className={styles.playButtonIcon} viewBox="0 0 60 60" width="60" height="60" aria-hidden="true" focusable="false">
                <circle cx="30" cy="30" r="28" fill="rgba(0,0,0,0.45)" />
                <polygon points="25,20 45,30 25,40" fill="#fff" />
              </svg>
            </div>
            */}
          </>
        )}
      </div>

      {/* Később aktiválható: progress törlés gomb */}
      {/*
      {hasProgress && (
        <button
          className={styles.clearProgressButton}
          onClick={() => {
            clearProgress();
            setShowClearMsg(true);
            setTimeout(() => setShowClearMsg(false), 1500);
          }}
          style={{ marginTop: 8 }}
        >
          Progress törlése
        </button>
      )}
      {showClearMsg && (
        <div style={{ color: '#4caf50', marginTop: 4, fontSize: 13 }}>Progress törölve!</div>
      )}
      */}

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

        {/* YouTube gomb a kártya bal alsó sarkában, a tartalom alatt */}
        <button
          className={styles.youtubeCornerButton}
          onClick={e => {
            e.stopPropagation();
            if (videoId) {
              window.open(`https://www.youtube.com/watch?v=${videoId}`, '_blank', 'noopener,noreferrer');
            }
          }}
          tabIndex={0}
          aria-label="Watch on YouTube"
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
