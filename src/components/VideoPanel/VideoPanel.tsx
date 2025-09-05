// src\components\VideoPanel\VideoPanel.tsx
import React from 'react';
import MemoizedVideoCard from './VideoCard';
import styles from './VideoPanel.module.css';
// ADSENSE TEMPORARILY DISABLED
// import { VideoAdCard, injectVideoAdsIntoVideoItems, VideoAdItem } from '../Ad/VideoAd';
// import { AD_CLIENT } from '../Ad/adConfig';
import { VideoItem } from '../../types';
import { VideoModal } from './VideoModal';
import { useMediaQuery } from '../../hooks/useMediaQuery';

// ========================================
// 🎥 VIDEO PANEL KOMPONENS
// ========================================
// Ez CSAK videókat jelenít meg!
// NEM keverjük a hírekkel!

export interface VideoPanelProps {
  videoItems: VideoItem[];
  loading?: boolean;
  error?: Error | string | null;
  onRetry?: () => void;
  onToggleMenu?: (cardId: string | undefined, anchorEl: HTMLElement | null, cardEl?: HTMLElement | null) => void;
  isActive: boolean;
}

export const VideoPanel: React.FC<VideoPanelProps> = ({
  videoItems = [],
  loading = false,
  error = null,
  onRetry,
  onToggleMenu,
  isActive,
}) => {
  console.log('[VideoPanel] 🎯 VideoPanel FUNCTION CALLED with props:', {
    videoItemsLength: videoItems?.length,
    loading,
    error,
    isActive,
    onRetry: !!onRetry,
    onToggleMenu: !!onToggleMenu
  });

  // === HOOKOK MINDIG A KOMPONENS ELEJÉN! ===
  // ADSENSE TEMPORARILY DISABLED
  // const itemsWithVideoAds = React.useMemo(() =>
  //   injectVideoAdsIntoVideoItems(videoItems, 3, 6),
  //   [videoItems]
  // );
  const itemsWithVideoAds = videoItems; // No ads injected

  // Modal lejátszás mód kapcsoló
  const [modalEnabled] = React.useState(true);
  const [selectedVideo, setSelectedVideo] = React.useState<{ id: string; title: string } | null>(null);
  const isMobile = useMediaQuery('(max-width: 768px)');

  // Stabil callback funkcióók a re-render elkerülésére
  const handleVideoClick = React.useCallback((videoId: string, title: string) => {
    setSelectedVideo({ id: videoId, title });
  }, []);

  const handleModalClose = React.useCallback(() => {
    setSelectedVideo(null);
  }, []);

  // ========================================
  // 🎥 MODAL DEBUG LOGGING
  // ========================================
  React.useEffect(() => {
    console.log('[VideoPanel] 🎥 Modal state changed:', {
      modalEnabled,
      selectedVideo,
      hasSelectedVideo: !!selectedVideo,
      shouldShowModal: modalEnabled && !!selectedVideo
    });
  }, [modalEnabled, selectedVideo]);

  React.useEffect(() => {
    if (selectedVideo) {
      console.log('[VideoPanel] 🎥 Modal SHOULD appear:', selectedVideo);
    } else {
      console.log('[VideoPanel] 🎥 Modal SHOULD disappear - selectedVideo is null');
    }
  }, [selectedVideo]);

  // ========================================
  // 🎥 COMPONENT LIFECYCLE DEBUG
  // ========================================
  React.useEffect(() => {
    console.log('[VideoPanel] 🔄 VideoPanel MOUNTED');
    return () => {
      console.log('[VideoPanel] 🔄 VideoPanel UNMOUNTED');
    };
  }, []);

  React.useEffect(() => {
    console.log('[VideoPanel] 🔄 VideoPanel RE-RENDERED');
  });

  if (!isActive) {
    return null;
  }

  // ✅ DEBUG: Ellenőrizzük, hogy a ScrollContainer-en belül vagyunk-e
  if (process.env.NODE_ENV === 'development') {
  //  console.log('[VideoPanel] ✅ VideoPanel renderelődik a ScrollContainer-en belül');
  }

  // NAGY LOADING overlay CSAK ha nincs cache (üres a videoItems) ÉS loading
  if (loading && (!videoItems || videoItems.length === 0)) {
    return (
      <div className={styles.loadingContainer}>
        Loading videos...
      </div>
    );
  }

  // Tartalom mindig megjelenik, ha van videoItems (cache)
  try {
    return (
      <div className={styles.videoPanel}>
        {loading && videoItems.length > 0 && (
          <div className={styles.smallSpinner} title="Frissítés folyamatban..." />
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
        {/* Modal kapcsoló UI (példa: fejlesztői gomb) */}
        {/* Ez bárhol elhelyezhető a panelen, pl. a fejlécben */}
        {/* <button onClick={() => setModalEnabled(v => !v)}>
          Modal lejátszás: {modalEnabled ? 'BE' : 'KI'}
        </button> */}
        <div className={styles.videoGrid}>
          {itemsWithVideoAds.map((item, index) => {
            if (isVideoAdItem(item)) {
              return (
                <VideoAdCard
                  key={getStableKey(item, index)}
                  title={item.title}
                  description={item.description}
                  imageUrl={item.imageUrl}
                  advertiser={item.advertiser}
                  clickUrl={item.clickUrl}
                  badgeLabel={item.badgeLabel}
                  slotId={item.slotId}
                  clientId={item.clientId || AD_CLIENT}
                  format={item.format}
                  responsive={item.responsive}
                  debug={process.env.NODE_ENV !== 'production'}
                />
              );
            } else {
              const video = item as VideoItem;
              return (
                <MemoizedVideoCard 
                  key={getStableKey(item, index)}
                  video={video} 
                  onToggleMenu={onToggleMenu} 
                  modalMode={modalEnabled && !isMobile}
                  onVideoClick={handleVideoClick}
                />
              );
            }
          })}
        </div>
        {/* Modal csak overlayként, nem módosít semmit mást! */}
        {modalEnabled && !isMobile && selectedVideo && (
          <VideoModal
            videoId={selectedVideo.id}
            videoTitle={selectedVideo.title}
            onClose={handleModalClose}
          />
        )}
      </div>
    );
  } catch (error) {
    console.error('VideoPanel render error:', error);
    return (
      <div className={styles.errorContainer}>
        Component rendering failed. Please try again.
      </div>
    );
  }
};

// Memoizált VideoPanel komponens, hogy elkerülje a felesleges újrarenderelést
const areEqual = (prevProps: VideoPanelProps, nextProps: VideoPanelProps) => {
  console.log('[VideoPanel] 🔍 MEMO CHECK - areEqual called');
  console.log('[VideoPanel] 🔍 prevProps:', {
    isActive: prevProps.isActive,
    loading: prevProps.loading,
    error: prevProps.error,
    videoItemsLength: prevProps.videoItems?.length,
    videoItemsReference: prevProps.videoItems,
    onToggleMenu: prevProps.onToggleMenu,
    onRetry: prevProps.onRetry
  });
  console.log('[VideoPanel] 🔍 nextProps:', {
    isActive: nextProps.isActive,
    loading: nextProps.loading,
    error: nextProps.error,
    videoItemsLength: nextProps.videoItems?.length,
    videoItemsReference: nextProps.videoItems,
    onToggleMenu: nextProps.onToggleMenu,
    onRetry: nextProps.onRetry
  });

  const isActiveEqual = prevProps.isActive === nextProps.isActive;
  const isLoadingEqual = prevProps.loading === nextProps.loading;
  const isErrorEqual = prevProps.error === nextProps.error;
  const isVideoItemsEqual = prevProps.videoItems === nextProps.videoItems;
  const isOnToggleMenuEqual = prevProps.onToggleMenu === nextProps.onToggleMenu;
  const isOnRetryEqual = prevProps.onRetry === nextProps.onRetry;

  console.log('[VideoPanel] 🔍 Comparison results:', {
    isActiveEqual,
    isLoadingEqual,
    isErrorEqual,
    isVideoItemsEqual,
    isOnToggleMenuEqual,
    isOnRetryEqual
  });

  const shouldSkipRender = isActiveEqual && isLoadingEqual && isErrorEqual && isVideoItemsEqual && isOnToggleMenuEqual && isOnRetryEqual;
  
  console.log('[VideoPanel] 🔍 shouldSkipRender (areEqual result):', shouldSkipRender);
  
  return shouldSkipRender;
};

const MemoizedVideoPanel = React.memo(VideoPanel, areEqual);
export default MemoizedVideoPanel;

// ADSENSE TEMPORARILY DISABLED
// Segédfüggvény: VideoAdItem típusguard
// function isVideoAdItem(item: unknown): item is VideoAdItem {
//   return typeof item === 'object' && item !== null && (item as VideoAdItem).type === 'videoAd';
// }

// Stabil key generálás segédfüggvény
function getStableKey(item: VideoItem | any, index: number) {
  // ADSENSE TEMPORARILY DISABLED - always treat as video
  // if (isVideoAdItem(item)) return `ad-${item.id}-${index}`;
  return `video-${item.id || item.videoId || item.title}-${index}`;
}