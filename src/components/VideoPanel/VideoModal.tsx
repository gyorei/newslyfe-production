import React from 'react';
import styles from './VideoModal.module.css';

interface VideoModalProps {
  videoId: string;
  videoTitle: string;
  onClose: () => void;
}

export const VideoModal: React.FC<VideoModalProps> = ({ videoId, videoTitle, onClose }) => {
  const modalRef = React.useRef<HTMLDivElement>(null);
  // 🎯 A TE JAVÍTÁSOD: Ref a lejátszó konténerére
  const playerRef = React.useRef<HTMLDivElement>(null); 
  
  const [isRendered, setIsRendered] = React.useState(false);
  const [isMinimized, setIsMinimized] = React.useState(false);
  const [isAnimating, setIsAnimating] = React.useState(false);
  const [isAppearing, setIsAppearing] = React.useState(true);
  const [isDragged, setIsDragged] = React.useState(false);
  const [isMobile, setIsMobile] = React.useState(false);
  const [isDragging, setIsDragging] = React.useState(false);
  const [position, setPosition] = React.useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const dragStartInfo = React.useRef<{ startX: number; startY: number; initialX: number; initialY: number }>({ startX: 0, startY: 0, initialX: 0, initialY: 0 });

  // Mobile detection - VÁLTOZATLAN
  React.useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth <= 700;
      setIsMobile(mobile);
      if (mobile) {
        setIsDragged(false);
        setIsMinimized(false);
        setPosition({ x: 0, y: 0 });
        setIsDragging(false);
      }
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Drag events - VÁLTOZATLAN
  React.useEffect(() => {
    if (!isDragging || isMobile) return;
    const handleMouseMove = (e: MouseEvent) => {
      const newX = dragStartInfo.current.initialX + (e.clientX - dragStartInfo.current.startX);
      const newY = dragStartInfo.current.initialY + (e.clientY - dragStartInfo.current.startY);
      setPosition({ x: newX, y: newY });
      if (!isDragged && (Math.abs(newX) > 5 || Math.abs(newY) > 5)) {
        setIsDragged(true);
      }
    };
    const handleMouseUp = () => setIsDragging(false);
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, isDragged, isMobile]);

  // handleDragMouseDown - VÁLTOZATLAN
  const handleDragMouseDown = (e: React.MouseEvent) => {
    if (isMobile) return;
    e.preventDefault();
    dragStartInfo.current = {
      startX: e.clientX, startY: e.clientY,
      initialX: position.x, initialY: position.y,
    };
    setIsDragging(true);
  };

  // handleMinimize - Visszaállítva és VÁLTOZATLAN
  const handleMinimize = React.useCallback(async () => {
    if (isMobile || isAnimating) return;
    setIsAnimating(true);
    await new Promise(resolve => setTimeout(resolve, 50));
    setIsMinimized(true);
    setTimeout(() => setIsAnimating(false), 400);
  }, [isAnimating, isMobile]);

  // handleRestore - Visszaállítva és VÁLTOZATLAN
  const handleRestore = React.useCallback(async () => {
    if (isMobile || isAnimating) return;
    setIsAnimating(true);
    await new Promise(resolve => setTimeout(resolve, 50));
    setIsMinimized(false);
    setTimeout(() => setIsAnimating(false), 400);
  }, [isAnimating, isMobile]);

  // handleKeyDown - VÁLTOZATLAN
  const handleKeyDown = React.useCallback((e: KeyboardEvent) => {
    if (e.key === 'Escape') onClose();
  }, [onClose]);

  // Effect hook-ok - VÁLTOZATLAN
  React.useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  React.useEffect(() => {
    if (modalRef.current) modalRef.current.focus();
    setIsRendered(true);
    setTimeout(() => setIsAppearing(false), 300);
  }, []);

  const isBackdropPassive = !isMobile && (isMinimized || isDragged);

  // 🎯 A TE JAVÍTÁSOD: Feltételes eseménykezelő a modal tartalmára
  const handleModalContentClick = (e: React.MouseEvent) => {
    // Mobilon, ha a kattintás a lejátszón belül történik, ne csináljunk semmit.
    // Így a kattintás "eljuthat" a YouTube vezérlőkhöz.
    if (isMobile && playerRef.current && playerRef.current.contains(e.target as Node)) {
      return;
    }
    
    // Minden más esetben (pl. desktopon, vagy mobilon a lejátszón kívül)
    // állítsuk le az esemény továbbterjedését, hogy ne záródjon be a modal.
    e.stopPropagation();
  };
  
  return (
    <div
      className={styles.modalBackdrop}
      onClick={isBackdropPassive ? undefined : onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="videoModalTitle"
      tabIndex={-1}
      style={{
        pointerEvents: isBackdropPassive ? 'none' : 'auto',
        cursor: isBackdropPassive ? 'default' : 'pointer'
      }}
    >
      <div
        ref={modalRef}
        className={`${styles.modalContent} ${!isMobile && isMinimized ? styles.minimized : ''} ${isAppearing ? styles.appearing : ''}`}
        // 🎯 A TE JAVÍTÁSOD ALKALMAZVA
        onClick={handleModalContentClick}
        style={{
          opacity: isRendered ? 1 : 0,
          transform: isMobile 
            ? 'translate(-50%, -50%)' 
            : `translate(calc(-50% + ${position.x}px), calc(-50% + ${position.y}px))`,
          cursor: isDragging && !isMobile ? 'grabbing' : 'default',
          pointerEvents: 'auto',
          zIndex: 1001
        }}
      >
        {/* A dragHandle-t csak desktopon rendereljük, ez továbbra is helyes! */}
        {!isMobile && (
          <div 
            className={styles.dragHandle} 
            onMouseDown={handleDragMouseDown}
          />
        )}
        
        <button className={styles.closeButton} onClick={onClose} aria-label="Bezárás">×</button>
        
        {/* A gombokat is csak desktopon rendereljük */}
        {!isMobile && (
          <>
            <button className={styles.minimizeButton} onClick={handleMinimize} aria-label="Minimalizálás" disabled={isAnimating}>_</button>
            <button className={styles.restoreButton} onClick={handleRestore} aria-label="Visszaállítás" disabled={isAnimating}>❐</button>
          </>
        )}
        
        {/* 🎯 A TE JAVÍTÁSOD: Ref hozzáadva a player konténerhez */}
        <div 
          ref={playerRef}
          className={styles.playerContainer}
        >
          <iframe
            src={`https://www.youtube.com/embed/${videoId}?rel=0&autoplay=1`}
            title={videoTitle}
            frameBorder="0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        </div>
      </div>
    </div>
  );
};

export default VideoModal;