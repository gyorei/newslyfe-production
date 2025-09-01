így jó a scroll 

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

  // Megkeressük a belső görgethető elemet, amikor a children vagy a tab változik
  useEffect(() => {
    if (containerWrapperRef.current) {
      let foundElement: HTMLElement | null = null;
      if (tabMode === 'video') {
        foundElement = containerWrapperRef.current.querySelector('[class*="videoPanel"]') as HTMLElement;
        if (process.env.NODE_ENV === 'development') {
          console.log(`[ScrollContainer] [VIDEO] Görgethető elem keresése:`, foundElement);
        }
        // Csak akkor használjuk, ha tényleg görgethető!
        if (foundElement && (foundElement.scrollHeight > foundElement.clientHeight)) {
          setScrollableElement(foundElement);
          if (process.env.NODE_ENV === 'development') {
            console.log(`[ScrollContainer] [VIDEO] .videoPanel görgethető, ezt használjuk!`);
          }
        } else {
          setScrollableElement(containerWrapperRef.current);
          if (process.env.NODE_ENV === 'development') {
            console.log(`[ScrollContainer] [VIDEO] .videoPanel NEM görgethető, fallback: wrapper div!`);
          }
        }
      } else {
        foundElement = containerWrapperRef.current.querySelector('[class*="panelContent"]') as HTMLElement;
        if (process.env.NODE_ENV === 'development') {
          console.log(`[ScrollContainer] [NEWS] Görgethető elem keresése:`, foundElement);
        }
        setScrollableElement(foundElement || containerWrapperRef.current);
        if (process.env.NODE_ENV === 'development') {
          console.log(`[ScrollContainer] ✅ Belső görgethető elem beállítva:`, foundElement || containerWrapperRef.current);
        }
      }
    }
  }, [children, tabMode]);

  // SCROLL EVENT LISTENER
  useEffect(() => {
    const el = scrollableElement;
    if (!el) return;
    if (process.env.NODE_ENV === 'development') {
      console.log(`[ScrollContainer] [${tabMode}] Scroll event listener hozzáadva:`, el);
    }
    const handleScroll = () => {
      const pos = el.scrollTop;
      if (process.env.NODE_ENV === 'development') {
        console.log(`[ScrollContainer] [${tabMode}] SCROLL esemény! scrollTop=`, pos);
      }
      ScrollStorage.save(scrollKey, pos);
      if (process.env.NODE_ENV === 'development') {
        console.log(`[ScrollContainer] [${tabMode}] Scroll pozíció mentve: kulcs=${scrollKey}, pozíció=${pos}`);
      }
    };
    el.addEventListener('scroll', handleScroll, { passive: true });
    return () => {
      el.removeEventListener('scroll', handleScroll);
      if (process.env.NODE_ENV === 'development') {
        console.log(`[ScrollContainer] [${tabMode}] Scroll event listener eltávolítva:`, el);
      }
    };
  }, [scrollableElement, scrollKey, tabMode]);

  // SCROLL VISSZAÁLLÍTÁS
  useEffect(() => {
    const el = scrollableElement;
    if (!el || isLoading) return;
    const savedPosition = ScrollStorage.load(scrollKey);
    if (process.env.NODE_ENV === 'development') {
      console.log(`[ScrollContainer] [${tabMode}] Scroll visszaállítás próbálkozás: kulcs=${scrollKey}, mentett=${savedPosition}`);
    }
    if (typeof savedPosition === 'number' && savedPosition >= 0) {
      setTimeout(() => {
        el.scrollTo({ top: savedPosition, behavior: 'auto' });
        if (process.env.NODE_ENV === 'development') {
          console.log(`[ScrollContainer] [${tabMode}] Mentett pozíció visszaállítva: ${savedPosition}px, tab: ${scrollKey}`);
        }
      }, 50);
    }
  }, [isLoading, scrollableElement, scrollKey, tabMode]);

  // Debug: méretek logolása
  useEffect(() => {
    if (!scrollableElement) return;
    if (process.env.NODE_ENV === 'development') {
      const { scrollHeight, clientHeight, scrollTop } = scrollableElement;
      const hasScrollableContent = scrollHeight > clientHeight;
      console.log('[ScrollContainer] 📏 Scroll container méretek:', { scrollHeight, clientHeight, scrollTop, hasScrollableContent });
    }
  }, [scrollableElement, activeTabId, tabMode]);

  // OLDALVÁLTÁS UTÁNI SCROLL RESET
  useEffect(() => {
    if (!scrollableElement) return;
    // Csak akkor fut, ha a resetScrollTrigger változik (pagination)
    scrollableElement.scrollTo({ top: 0, behavior: 'auto' });
    if (process.env.NODE_ENV === 'development') {
      console.log(`[ScrollContainer] [${tabMode}] Pagination utáni scrollTo(0) meghívva!`);
    }
  }, [resetScrollTrigger]);

  return (
    <div ref={containerWrapperRef} className={className || styles.scrollContainer}>
      {children}
    </div>
  );
};

így meg nem jó!!!!!!

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
  wasApiRefreshed?: boolean; // ✅ ÚJ: API frissítést jelző prop
}

export const ScrollContainer: React.FC<ScrollContainerProps> = ({
  children,
  isLoading = false,
  activeTabId,
  isNewTab = false,
  tabMode = 'news',
  className = '',
  resetScrollTrigger = 0,
  wasApiRefreshed = false, // ✅ ÚJ: API frissítést jelző prop alapértelmezett értéke
}) => {
  // Ez a ref a külső wrapperen marad, ez lesz a kiindulópontunk.
  const containerWrapperRef = useRef<HTMLDivElement>(null);
  // Egy state, ami a VALÓDI, belső görgethető elemet tárolja.
  const [scrollableElement, setScrollableElement] = useState<HTMLElement | null>(null);
  const scrollKey = `${activeTabId}-${tabMode}`;

  // Megkeressük a belső görgethető elemet, amikor a children vagy a tab változik
  useEffect(() => {
    if (containerWrapperRef.current) {
      let foundElement: HTMLElement | null = null;
      if (tabMode === 'video') {
        foundElement = containerWrapperRef.current.querySelector('[class*="videoPanel"]') as HTMLElement;
        if (process.env.NODE_ENV === 'development') {
          console.log(`[ScrollContainer] [VIDEO] Görgethető elem keresése:`, foundElement);
        }
        // Csak akkor használjuk, ha tényleg görgethető!
        if (foundElement && (foundElement.scrollHeight > foundElement.clientHeight)) {
          setScrollableElement(foundElement);
          if (process.env.NODE_ENV === 'development') {
            console.log(`[ScrollContainer] [VIDEO] .videoPanel görgethető, ezt használjuk!`);
          }
        } else {
          setScrollableElement(containerWrapperRef.current);
          if (process.env.NODE_ENV === 'development') {
            console.log(`[ScrollContainer] [VIDEO] .videoPanel NEM görgethető, fallback: wrapper div!`);
          }
        }
      } else {
        foundElement = containerWrapperRef.current.querySelector('[class*="panelContent"]') as HTMLElement;
        if (process.env.NODE_ENV === 'development') {
          console.log(`[ScrollContainer] [NEWS] Görgethető elem keresése:`, foundElement);
        }
        setScrollableElement(foundElement || containerWrapperRef.current);
        if (process.env.NODE_ENV === 'development') {
          console.log(`[ScrollContainer] ✅ Belső görgethető elem beállítva:`, foundElement || containerWrapperRef.current);
        }
      }
    }
  }, [children, tabMode]);

  // SCROLL EVENT LISTENER
  useEffect(() => {
    const el = scrollableElement;
    if (!el) return;
    if (process.env.NODE_ENV === 'development') {
      console.log(`[ScrollContainer] [${tabMode}] Scroll event listener hozzáadva:`, el);
    }
    const handleScroll = () => {
      const pos = el.scrollTop;
      if (process.env.NODE_ENV === 'development') {
        console.log(`[ScrollContainer] [${tabMode}] SCROLL esemény! scrollTop=`, pos);
      }
      ScrollStorage.save(scrollKey, pos);
      if (process.env.NODE_ENV === 'development') {
        console.log(`[ScrollContainer] [${tabMode}] Scroll pozíció mentve: kulcs=${scrollKey}, pozíció=${pos}`);
      }
    };
    el.addEventListener('scroll', handleScroll, { passive: true });
    return () => {
      el.removeEventListener('scroll', handleScroll);
      if (process.env.NODE_ENV === 'development') {
        console.log(`[ScrollContainer] [${tabMode}] Scroll event listener eltávolítva:`, el);
      }
    };
  }, [scrollableElement, scrollKey, tabMode]);

  // SCROLL VISSZAÁLLÍTÁS
  useEffect(() => {
    const el = scrollableElement;
    if (!el || isLoading) return;
    
    // ✅ ÚJ: API frissítés után nincs scroll visszaállítás, helyette a tetejére ugrunk
    if (wasApiRefreshed) {
      setTimeout(() => {
        el.scrollTo({ top: 0, behavior: 'auto' });
        if (process.env.NODE_ENV === 'development') {
          console.log(`[ScrollContainer] [${tabMode}] API frissítés történt, scroll a tetejére!`);
        }
      }, 50);
      return;
    }
    
    // Csak akkor állítjuk vissza a mentett pozíciót, ha NEM történt API frissítés
    const savedPosition = ScrollStorage.load(scrollKey);
    if (process.env.NODE_ENV === 'development') {
      console.log(`[ScrollContainer] [${tabMode}] Scroll visszaállítás próbálkozás: kulcs=${scrollKey}, mentett=${savedPosition}`);
    }
    if (typeof savedPosition === 'number' && savedPosition >= 0) {
      setTimeout(() => {
        el.scrollTo({ top: savedPosition, behavior: 'auto' });
        if (process.env.NODE_ENV === 'development') {
          console.log(`[ScrollContainer] [${tabMode}] Mentett pozíció visszaállítva: ${savedPosition}px, tab: ${scrollKey}`);
        }
      }, 50);
    }
  }, [isLoading, scrollableElement, scrollKey, tabMode, wasApiRefreshed]); // ✅ ÚJ: wasApiRefreshed függőség hozzáadva

  // Debug: méretek logolása
  useEffect(() => {
    if (!scrollableElement) return;
    if (process.env.NODE_ENV === 'development') {
      const { scrollHeight, clientHeight, scrollTop } = scrollableElement;
      const hasScrollableContent = scrollHeight > clientHeight;
      console.log('[ScrollContainer] 📏 Scroll container méretek:', { scrollHeight, clientHeight, scrollTop, hasScrollableContent });
    }
  }, [scrollableElement, activeTabId, tabMode]);

  // OLDALVÁLTÁS UTÁNI SCROLL RESET
  useEffect(() => {
    if (!scrollableElement) return;
    // Csak akkor fut, ha a resetScrollTrigger változik (pagination)
    scrollableElement.scrollTo({ top: 0, behavior: 'auto' });
    if (process.env.NODE_ENV === 'development') {
      console.log(`[ScrollContainer] [${tabMode}] Pagination utáni scrollTo(0) meghívva!`);
    }
  }, [resetScrollTrigger]);

  return (
    <div ref={containerWrapperRef} className={className || styles.scrollContainer}>
      {children}
    </div>
  );
};

