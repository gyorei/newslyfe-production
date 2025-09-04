import React, { useState, useEffect, useRef } from 'react';
import AdSenseUnit from './AdSenseUnit';
import { useIntersectionObserver } from './useIntersectionObserver';
import { AD_CLIENT } from '../adConfig';
import styles from './AdSenseLayout.module.css';

interface AdSenseLayoutProps {
  slotId: string;
  clientId?: string;
  format?: string;
  style?: React.CSSProperties;
  responsive?: boolean;
  showBadge?: boolean;
  badgeLabel?: string;
  debug?: boolean;
  fallback?: React.ReactNode;
  // ========================================
  // 💼 BŐVÍTETT PROPS - VIDEÓHOZ HASONLÓAN
  // ========================================
  title?: string;
  description?: string;
  imageUrl?: string;
  advertiser?: string;
  clickUrl?: string;
  // ✅ ÚJ: Tabváltási optimalizáció paraméterek
  activeTabId?: string;
  tabMode?: string;
  // ✅ ÚJ: Téma szín paraméter a vizuális azonosuláshoz
  themeColor?: string;
}

/**
 * Kontrasztos szövegszín meghatározása egy háttérszínhez
 * Sötét háttérhez világos szöveget, világos háttérhez sötét szöveget ad
 */
const getContrastColor = (hexColor: string = '#ffe066'): string => {
  try {
    // Alapértelmezett szín, ha érvénytelen a bemenet
    if (!hexColor || hexColor.length < 7) return '#222222';
    
    // Hex színkód átalakítása RGB értékekké
    const r = parseInt(hexColor.slice(1, 3), 16);
    const g = parseInt(hexColor.slice(3, 5), 16);
    const b = parseInt(hexColor.slice(5, 7), 16);
    
    // Világosság kiszámítása (W3C képlet)
    const brightness = (r * 299 + g * 587 + b * 114) / 1000;
    
    // Sötét háttéren fehér, világos háttéren fekete szöveg
    return brightness > 128 ? '#222222' : '#ffffff';
  } catch (error) {
    console.error('[AdSenseLayout] Hiba a kontrasztos szín számításakor:', error);
    return '#222222';
  }
};

/**
 * Egységes AdSense wrapper: badge, margin, debug, fallback, szabályos markup.
 * Most már csak akkor tölti be az AdSenseUnit-ot, ha látható a viewportban (IntersectionObserver).
 * ✅ Frissítve a VideoAdCard mintájára, fejlettebb megjelenítéssel.
 * ✅ ÚJ: Támogatja a villanás-mentes tabváltást és fokozatos betöltést
 * ✅ ÚJ: Támogatja a téma színnel való azonosulást
 */
export const AdSenseLayout: React.FC<AdSenseLayoutProps> = ({
  slotId,
  clientId = AD_CLIENT,
  format = 'auto',
  style,
  responsive = true,
  showBadge = true,
  badgeLabel = '💼 Hirdetés',
  debug = false,
  fallback = null,
  // ========================================
  // 💼 BŐVÍTETT PROPS HASZNÁLATA
  // ========================================
  title = "Discover the best content!",
  description = "Check out our latest offers.",
  imageUrl = "/assets/ad-placeholder.jpg",
  advertiser = "NewsReader Partner",
  clickUrl = "https://example.com/promo",
  // ✅ ÚJ: Tabváltási optimalizáció paraméterek
  activeTabId,
  tabMode = 'news',
  // ✅ ÚJ: Téma szín paraméter
  themeColor = '#ffe066', // Alapértelmezett sárga szín
}) => {
  const [containerRef, isVisible] = useIntersectionObserver<HTMLDivElement>({ threshold: 0.25 });
  
  // ========================================
  // 💼 ENVIRONMENT ELLENŐRZÉS - GOOGLE SZABÁLYOK!
  // ========================================
  const isProduction = process.env.NODE_ENV === 'production';
  const shouldShowAdSense = isProduction && slotId && clientId;

  // ✅ ÚJ: Fokozatos betöltés állapotok
  const [isContentVisible, setIsContentVisible] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const loadTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const prevTabIdRef = useRef<string | undefined>(activeTabId);

  // ✅ ÚJ: Tabváltás detektálása és átmenet kezelése
  useEffect(() => {
    // Ha változott a tab ID, reseteljük a láthatóságot
    if (activeTabId !== prevTabIdRef.current) {
      // Először elrejtjük a tartalmat
      setIsContentVisible(false);
      
      // Töröljük a korábbi időzítőt, ha volt
      if (loadTimeoutRef.current) {
        clearTimeout(loadTimeoutRef.current);
      }
      
      // Beállítunk egy új időzítőt a fokozatos megjelenítéshez
      loadTimeoutRef.current = setTimeout(() => {
        setIsContentVisible(true);
        console.log(`[AdSenseLayout] 🎭 Reklám megjelenítése tab váltás után: ${activeTabId}-${tabMode}`);
      }, 100); // Kis késleltetés a tabváltás után
      
      // Frissítjük a referenciát
      prevTabIdRef.current = activeTabId;
    }
    
    return () => {
      // Tisztítás unmount-kor
      if (loadTimeoutRef.current) {
        clearTimeout(loadTimeoutRef.current);
      }
    };
  }, [activeTabId, tabMode]);

  // ✅ ÚJ: Betöltési állapot kezelése
  useEffect(() => {
    // Első betöltéskor késleltetve megjelenítjük a tartalmat
    if (!isLoaded) {
      loadTimeoutRef.current = setTimeout(() => {
        setIsContentVisible(true);
        setIsLoaded(true);
        console.log(`[AdSenseLayout] 🎭 Reklám első betöltése kész`);
      }, 100);
    }
    
    return () => {
      if (loadTimeoutRef.current) {
        clearTimeout(loadTimeoutRef.current);
      }
    };
  }, []);

  const handleClick = () => {
    if (clickUrl && !shouldShowAdSense) {
      window.open(clickUrl, '_blank', 'noopener,noreferrer');
    }
  };

  // ✅ ÚJ: Fokozatos átmenet stílusok
  const contentStyle: React.CSSProperties = {
    opacity: isContentVisible ? 1 : 0,
    transition: 'opacity 0.2s ease-in-out',
    height: '100%',
    width: '100%',
    position: 'relative'
  };
  
  // ✅ ÚJ: Téma-alapú stílusok
  const badgeStyle: React.CSSProperties = {
    backgroundColor: themeColor,
    color: getContrastColor(themeColor),
  };
  
  const containerStyle: React.CSSProperties = {
    ...style,
    boxShadow: `0 4px 16px ${themeColor}30`, // 30% átlátszóság a témaszínnel
    borderTop: `3px solid ${themeColor}`,
  };
  
  const titleStyle: React.CSSProperties = {
    color: '#333333',
    borderLeft: `3px solid ${themeColor}`,
    paddingLeft: '8px',
  };
  
  const advertiserStyle: React.CSSProperties = {
    color: themeColor !== '#ffffff' ? themeColor : '#666666',
    fontWeight: 500,
  };

  return (
    <div
      ref={containerRef}
      className={styles.adSenseLayout}
      onClick={handleClick}
      role="region"
      aria-label={badgeLabel || 'Ad'}
      style={containerStyle}
    >
      <div style={contentStyle}>
        {showBadge && (
          <span className={styles.adBadge} style={badgeStyle}>{badgeLabel}</span>
        )}
        
        {/* ========================================
         * 💼 AD SENSE UNIT - GOOGLE SZABÁLYOK!
         * ======================================== */}
        {isVisible && shouldShowAdSense && import.meta.env.VITE_ADSENSE_ENABLED !== 'false' ? (
          <div className={styles.adSenseContainer}>
            <AdSenseUnit
              slotId={slotId}
              clientId={clientId}
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
           * 💼 FALLBACK CONTENT - FEJLESZTŐI MÓD
           * ======================================== */
          <>
            {imageUrl && (
              <img src={imageUrl} alt={title} className={styles.adImage} />
            )}
            <div className={styles.adContent}>
              <h4 className={styles.adTitle} style={titleStyle}>{title}</h4>
              <p className={styles.adDescription}>{description}</p>
              <span className={styles.adAdvertiser} style={advertiserStyle}>{advertiser}</span>
              {debug && (
                <div className={styles.adDebug}>
                  <p>Debug: Slot ID: {slotId}</p>
                  <p>Debug: Client ID: {clientId}</p>
                  <p>Debug: Theme: {themeColor}</p>
                </div>
              )}
            </div>
          </>
        )}
        {fallback}
      </div>
    </div>
  );
};

export default AdSenseLayout;