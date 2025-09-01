// src\components\ScrollContainer\ScrollContainer.tsx
import React, { useRef, useEffect, useState } from 'react';
import styles from './ScrollContainer.module.css';
import { ScrollStorage } from './ScrollStorage';

interface ScrollContainerProps {
  children: React.ReactNode;
  isLoading?: boolean;
  hasMoreContent?: boolean;
  onLoadMore?: () => void;
  activeTabId: string;
  isNewTab?: boolean;
  tabMode?: string;
  className?: string;
  resetScrollTrigger?: number;
}

// Komponensen kívül:
function debounce<F extends (...args: any[]) => any>(func: F, waitFor: number) {
  let timeout: NodeJS.Timeout | null = null;
  return (...args: Parameters<F>): void => {
    if (timeout) {
      clearTimeout(timeout);
    }
    timeout = setTimeout(() => func(...args), waitFor);
  };
}

export const ScrollContainer: React.FC<ScrollContainerProps> = ({
  children,
  isLoading = false,
  activeTabId,
  isNewTab = false,
  tabMode = 'news',
  className = '',
  resetScrollTrigger = 0,
}) => {
  // Ez a ref a külső wrapperen marad, ez lesz a kiindulópontunk.
  const containerWrapperRef = useRef<HTMLDivElement>(null);
  // Egy state, ami a VALÓDI, belső görgethető elemet tárolja.
  const [scrollableElement, setScrollableElement] = useState<HTMLElement | null>(null);
  const scrollKey = `${activeTabId}-${tabMode}`;

  // Debounced mentési függvény useMemo-val
  const debouncedSave = React.useMemo(
    () => debounce((key: string, pos: number) => {
      console.log(`[ScrollStorage] Debounced save for ${key}: ${pos}px`);
      ScrollStorage.save(key, pos);
    }, 200),
    []
  );
  
  // ✅ FINOMÍTOTT láthatósági vezérlés - kezdetben rejtett, hogy elkerüljük a scroll ugrást
  const [isContentVisible, setIsContentVisible] = useState(false);

  // Megkeressük a belső görgethető elemet, amikor a children vagy a tab változik
  useEffect(() => {
    if (containerWrapperRef.current) {
      let foundElement: HTMLElement | null = null;
      if (tabMode === 'video') {
        foundElement = containerWrapperRef.current.querySelector('[class*="videoPanel"]') as HTMLElement;
        console.log(`[ScrollContainer][${activeTabId}-${tabMode}] [VIDEO] Görgethető elem keresése:`, foundElement);
        // Csak akkor használjuk, ha tényleg görgethető!
        if (foundElement && (foundElement.scrollHeight > foundElement.clientHeight)) {
          setScrollableElement(foundElement);
          console.log(`[ScrollContainer][${activeTabId}-${tabMode}] [VIDEO] .videoPanel görgethető, ezt használjuk!`);
        } else {
          setScrollableElement(containerWrapperRef.current);
          console.log(`[ScrollContainer][${activeTabId}-${tabMode}] [VIDEO] .videoPanel NEM görgethető, fallback: wrapper div!`);
        }
      } else {
        foundElement = containerWrapperRef.current.querySelector('[class*="panelContent"]') as HTMLElement;
        console.log(`[ScrollContainer][${activeTabId}-${tabMode}] [NEWS] Görgethető elem keresése:`, foundElement);
        setScrollableElement(foundElement || containerWrapperRef.current);
        console.log(`[ScrollContainer][${activeTabId}-${tabMode}] ✅ Belső görgethető elem beállítva:`, foundElement || containerWrapperRef.current);
      }
    }
  }, [children, tabMode, activeTabId]);

  // SCROLL EVENT LISTENER
  useEffect(() => {
    const el = scrollableElement;
    if (!el) return;
    const handleScroll = () => {
      const pos = el.scrollTop;
      debouncedSave(scrollKey, pos);
    };
    el.addEventListener('scroll', handleScroll, { passive: true });
    return () => {
      el.removeEventListener('scroll', handleScroll);
    };
  }, [scrollableElement, scrollKey, debouncedSave]);

  // ✅ EGYSÉGES SCROLL VISSZAÁLLÍTÁS - mindkét módban láthatósági vezérlés a villogás elkerülésére
  useEffect(() => {
    const el = scrollableElement;
    if (!el || isLoading) return;
    
    // Betöltjük a scroll pozíciót
    const savedPosition = ScrollStorage.load(scrollKey);
    console.log(`[ScrollContainer][${activeTabId}-${tabMode}] Scroll visszaállítás próbálkozás: kulcs=${scrollKey}, mentett=${savedPosition}`);
    
    if (typeof savedPosition === 'number' && savedPosition > 0) {
      // ✅ VAN MENTETT POZÍCIÓ: Láthatósági vezérlés a villogás elkerülésére
      setIsContentVisible(false);
      el.scrollTo({ top: savedPosition, behavior: 'auto' });
      console.log(`[ScrollContainer][${activeTabId}-${tabMode}] 🔄 Scroll pozíció beállítva elrejtett állapotban: ${savedPosition}px`);
      
      // Késleltetéssel láthatóvá tesszük a tartalmat
      const delay = tabMode === 'video' ? 100 : 50;
      setTimeout(() => {
        setIsContentVisible(true);
        console.log(`[ScrollContainer][${activeTabId}-${tabMode}] 🎭 Tartalom megjelenítése, scroll pozíció: ${el.scrollTop}px`);
      }, delay);
    } else {
      // ✅ NINCS MENTETT POZÍCIÓ: Azonnal megjelenítjük a tartalmat
      setTimeout(() => {
        setIsContentVisible(true);
        console.log(`[ScrollContainer][${activeTabId}-${tabMode}] 🎭 Tartalom megjelenítése (nincs mentett pozíció)`);
      }, 20);
    }
    
  }, [isLoading, scrollableElement, scrollKey, tabMode, activeTabId]);

  // Debug: méretek logolása
  useEffect(() => {
    if (!scrollableElement) return;
    if (process.env.NODE_ENV === 'development') {
      const { scrollHeight, clientHeight, scrollTop } = scrollableElement;
      const hasScrollableContent = scrollHeight > clientHeight;
      console.log('[ScrollContainer] 📏 Scroll container méretek:', { scrollHeight, clientHeight, scrollTop, hasScrollableContent });
    }
  }, [scrollableElement, activeTabId, tabMode]);

  // OLDALVÁLTÁS UTÁNI SCROLL RESET - 🔄 JAVÍTOTT LOGIKA
  useEffect(() => {
    if (!scrollableElement || resetScrollTrigger === 0) return;
    
    // 🎯 VIDEÓ vs NEWS különbség:
    if (tabMode === 'video') {
      // VIDEÓ: Ellenőrizzük mentett pozíciót
      const savedPosition = ScrollStorage.load(scrollKey);
      if (typeof savedPosition !== 'number' || savedPosition <= 0) {
        setTimeout(() => {
          scrollableElement.scrollTo({ top: 0, behavior: 'auto' });
          console.log(`[ScrollContainer][${activeTabId}-video] 🔄 Video pagination reset: scrollTo(0)`);
        }, 200);
      } else {
        console.log(`[ScrollContainer][${activeTabId}-video] ⚠️ Video pagination reset KIHAGYVA (mentett: ${savedPosition}px)`);
      }
    } else {
      // NEWS: MINDIG reset (eredeti viselkedés)
      scrollableElement.scrollTo({ top: 0, behavior: 'auto' });
      console.log(`[ScrollContainer][${activeTabId}-news] 🔄 News pagination reset: scrollTo(0)`);
    }
  }, [resetScrollTrigger, activeTabId, tabMode, scrollableElement, scrollKey]);

  // ✅ EGYSÉGES stílus - mindkét módban opacity vezérlés a villogás elkerülésére
  const contentStyle: React.CSSProperties = {
    opacity: isContentVisible ? 1 : 0,
    transition: 'opacity 0.15s ease-in-out', // Gyorsabb átmenet
    height: '100%',
    width: '100%'
  };

  // ✅ Egységes wrapper - mindkét módban opacity vezérlés
  return (
    <div ref={containerWrapperRef} className={className || styles.scrollContainer}>
      <div style={contentStyle}>
        {children}
      </div>
    </div>
  );
};

