// FONTOS!!!ne törölj ki semmit csak kommentáld ami nem kell!!!!!

// KÉSZ! ✅ A HorizontalNewsScroller hibamentesen kikapcsolva!

// components/HorizontalNewsScroller.tsx
import React, { useRef, useEffect, useState, useMemo, useCallback } from 'react';
import styles from './HorizontalNewsScroller.module.css';
import { NewsItem } from '../../../../types';
import { formatRelativeTime } from '../../../../utils/dateFormatter/dateFormatter';
import {
  getFaviconUrl,
  getAlternativeFaviconUrls,
  extractDomain,
} from '../../../../utils/favicon/favicon';
import { UserHistoryService } from '../../../History/utils/UserHistoryService';

interface HorizontalNewsScrollerProps {
  news: NewsItem[];
  maxItems?: number;
  minItemsToShow?: number;
}

const HorizontalNewsScroller: React.FC<HorizontalNewsScrollerProps> = ({
  news,
  maxItems = 10, // Alapértelmezetten maximum 10 hírt jelenít meg
  minItemsToShow = 4, // Csak akkor jelenik meg, ha legalább ennyi elem van
}) => {
  // ❌ KIKAPCSOLVA: Fejlesztői kapcsoló
  const HORIZONTAL_SCROLLER_ENABLED = false;

  // ✅ HOOKOK MINDIG LEFUTNAK - hibamentes!
  const scrollerRef = useRef<HTMLDivElement>(null);
  // Görgetés-specifikus értékek useRef-ben, mivel nem befolyásolják a renderelést
  const startXRef = useRef(0);
  const scrollLeftStartRef = useRef(0);
  const isDraggingRef = useRef(false); // Minden drag állapotot ref-ben tárolunk a gyorsabb válaszidőért

  // Csak UI-hoz használjuk, hogy a kurzor stílus változzon
  const [isDragging, setIsDragging] = useState(false);
  const [showScrollIndicators, setShowScrollIndicators] = useState(false);
  const [scrollPosition, setScrollPosition] = useState({
    isAtStart: true,
    isAtEnd: false,
  });

  // Csak a maximális számú hírt jelenítjük meg, memóriába cacheelve
  const visibleNews = useMemo(() => {
    if (!news || news.length === 0) return [];
    return news.slice(0, maxItems);
  }, [news, maxItems]);

  // Scrollhelyzet figyelése - useCallback-el, hogy ne generálódjon újra minden rendereléskor
  const checkScrollPosition = useCallback(() => {
    if (!scrollerRef.current) return;

    const { scrollLeft, scrollWidth, clientWidth } = scrollerRef.current;
    const isAtStart = scrollLeft <= 10;
    const isAtEnd = scrollLeft + clientWidth >= scrollWidth - 10;

    setScrollPosition({ isAtStart, isAtEnd });
  }, []);

  // DOM eseménykezelő típusok definiálása
  const handleGlobalMouseUp = useCallback((e: MouseEvent) => {
    if (isDraggingRef.current) {
      e.preventDefault();
    }
    isDraggingRef.current = false;
    setIsDragging(false);
  }, []);

  const handleGlobalTouchEnd = useCallback(() => {
    isDraggingRef.current = false;
    setIsDragging(false);
  }, []);

  // ✅ user-select: none globálisan drag közben
  useEffect(() => {
    if (isDragging) {
      document.body.style.userSelect = 'none';
    } else {
      document.body.style.userSelect = '';
    }
    return () => {
      document.body.style.userSelect = '';
    };
  }, [isDragging]);

  // Touch és egér eseménykezelők a görgetéshez
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (!scrollerRef.current) return;

    // Csak bal egérgombra reagálunk
    if (e.button !== 0) return;

    isDraggingRef.current = true;
    setIsDragging(true);
    startXRef.current = e.pageX - scrollerRef.current.offsetLeft;
    scrollLeftStartRef.current = scrollerRef.current.scrollLeft;

    // Megakadályozzuk a szöveg kijelölését húzás közben
    e.preventDefault();
  }, []);

  // ✅ requestAnimationFrame minden mozgáshoz
  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (!isDraggingRef.current || !scrollerRef.current) return;

      e.preventDefault();
      const x = e.pageX - scrollerRef.current.offsetLeft;
      const walk = (x - startXRef.current) * 1.5; // Görgetés sebességét finomítottuk

      // requestAnimationFrame-be helyezzük a scrollLeft módosítást
      requestAnimationFrame(() => {
        if (scrollerRef.current) {
          scrollerRef.current.scrollLeft = scrollLeftStartRef.current - walk;
          checkScrollPosition();
        }
      });
    },
    [checkScrollPosition],
  );

  // KOMMENTÁLD KI: handleMouseUp függvény
  /*
  const handleMouseUp = useCallback((e: React.MouseEvent) => {
    if (isDraggingRef.current) {
      e.preventDefault(); // Megakadályozza a véletlen kattintási eseményeket görgés után
    }
    isDraggingRef.current = false;
    setIsDragging(false);
  }, []);
  */

  // Touch események kezelése (mobilra)
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (!scrollerRef.current || e.touches.length !== 1) return;

    isDraggingRef.current = true;
    setIsDragging(true);
    startXRef.current = e.touches[0].pageX - scrollerRef.current.offsetLeft;
    scrollLeftStartRef.current = scrollerRef.current.scrollLeft;
  }, []);

  // KOMMENTÁLD KI: onTouchMove React eseménykezelő
  /*
  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!isDraggingRef.current || !scrollerRef.current || e.touches.length !== 1) return;
    
    // NE használjunk preventDefault()-ot a touchmove eseményben, mivel ez passzív
    // e.preventDefault(); - Ez a sor okozza a hibát
    
    const x = e.touches[0].pageX - scrollerRef.current.offsetLeft;
    const walk = (x - startXRef.current) * 1.5;
    scrollerRef.current.scrollLeft = scrollLeftStartRef.current - walk;
    
    // Görgetés után ellenőrizzük a pozíciót
    requestAnimationFrame(checkScrollPosition);
  }, [checkScrollPosition]);
  */

  // React TouchEvent handler, nem DOM TouchEvent
  const handleTouchEnd = useCallback(() => {
    isDraggingRef.current = false;
    setIsDragging(false);
  }, []);

  // ✅ KONSTANSOK a duplikáció elkerülésére
  const SMOOTH_SCROLL_CLASS = 'smooth-scroll';
  const CARD_WIDTH = 180;
  const GAP = 12;

  // Nyilak léptetéshez - javított görgetési mennyiség
  const scrollToLeft = useCallback(() => {
    if (!scrollerRef.current) return;

    // Minden kártyányi egységet görgetünk (card width + gap)
    const scrollAmount = CARD_WIDTH + GAP;

    // Dinamikus smooth-scroll kezelés
    if (scrollerRef.current.classList) {
      // Adjuk hozzá a smooth-scroll osztályt
      scrollerRef.current.classList.add(SMOOTH_SCROLL_CLASS);

      // Görgessünk azonnal, az animációt a CSS végzi
      scrollerRef.current.scrollBy({
        left: -scrollAmount,
        behavior: 'auto', // Az animációt a CSS smooth-scroll osztály végzi
      });

      // Távolítsuk el a smooth-scroll osztályt kis késleltetéssel
      setTimeout(() => {
        if (scrollerRef.current) {
          scrollerRef.current.classList.remove(SMOOTH_SCROLL_CLASS);
        }
      }, 300);
    } else {
      // Fallback az eredeti viselkedésre, ha nem működne a classList
      scrollerRef.current.scrollBy({
        left: -scrollAmount,
        behavior: 'smooth',
      });
    }

    // A scroll event nem mindig indítja el a scrollend eseményt,
    // így manuálisan is ellenőrizzük a pozíciót
    setTimeout(checkScrollPosition, 300);
  }, [checkScrollPosition]);

  const scrollToRight = useCallback(() => {
    if (!scrollerRef.current) return;

    // Minden kártyányi egységet görgetünk (card width + gap)
    const scrollAmount = CARD_WIDTH + GAP;

    // Dinamikus smooth-scroll kezelés
    if (scrollerRef.current.classList) {
      // Adjuk hozzá a smooth-scroll osztályt
      scrollerRef.current.classList.add(SMOOTH_SCROLL_CLASS);

      // Görgessünk azonnal, az animációt a CSS végzi
      scrollerRef.current.scrollBy({
        left: scrollAmount,
        behavior: 'auto', // Az animációt a CSS smooth-scroll osztály végzi
      });

      // Távolítsuk el a smooth-scroll osztályt kis késleltetéssel
      setTimeout(() => {
        if (scrollerRef.current) {
          scrollerRef.current.classList.remove(SMOOTH_SCROLL_CLASS);
        }
      }, 300);
    } else {
      // Fallback az eredeti viselkedésre, ha nem működne a classList
      scrollerRef.current.scrollBy({
        left: scrollAmount,
        behavior: 'smooth',
      });
    }

    // A scroll event nem mindig indítja el a scrollend eseményt,
    // így manuálisan is ellenőrizzük a pozíciót
    setTimeout(checkScrollPosition, 300);
  }, [checkScrollPosition]);

  // Hír megnyitása új ablakban
  const openNewsItem = useCallback((url?: string, e?: React.MouseEvent) => {
    // Ha épp görgetünk, ne nyissuk meg a hírt
    if (isDraggingRef.current && e) {
      e.preventDefault();
      e.stopPropagation();
      return;
    }

    if (url) {
      window.open(url, '_blank', 'noopener,noreferrer');
    }
  }, []);

  // Ellenőrizzük, hogy kell-e görgetési indikátorokat megjeleníteni
  useEffect(() => {
    const checkScrollWidth = () => {
      if (scrollerRef.current) {
        const { scrollWidth, clientWidth } = scrollerRef.current;
        setShowScrollIndicators(scrollWidth > clientWidth);
        checkScrollPosition();
      }
    };

    // Kezdeti ellenőrzés
    checkScrollWidth();

    // Resize figyelése (ha a képernyőméret változik)
    window.addEventListener('resize', checkScrollWidth);

    return () => {
      window.removeEventListener('resize', checkScrollWidth);
    };
  }, [visibleNews, checkScrollPosition]);

  // Touch események passzív figyelőinek megoldása
  useEffect(() => {
    // A probléma kezelése: a touchmove eseményekhez passzív: false opció beállítása
    if (scrollerRef.current) {
      const currentScroller = scrollerRef.current;
      const nonPassiveOptions = { passive: false } as EventListenerOptions;

      // ✅ requestAnimationFrame a touchmove handler-ben is
      const handleTouchMoveNonPassive = (e: TouchEvent) => {
        if (isDraggingRef.current) {
          e.preventDefault(); // Most már működik, mert nem passzív
          e.stopPropagation();

          if (e.touches.length !== 1 || !currentScroller) return;

          const x = e.touches[0].pageX - currentScroller.offsetLeft;
          const walk = (x - startXRef.current) * 1.5;

          // requestAnimationFrame-be helyezzük a scrollLeft módosítást
          requestAnimationFrame(() => {
            if (currentScroller) {
              currentScroller.scrollLeft = scrollLeftStartRef.current - walk;
              checkScrollPosition();
            }
          });
        }
      };

      // Adjuk hozzá a nem-passzív touchmove eseményfigyelőt
      currentScroller.addEventListener('touchmove', handleTouchMoveNonPassive, nonPassiveOptions);

      return () => {
        currentScroller.removeEventListener(
          'touchmove',
          handleTouchMoveNonPassive,
          nonPassiveOptions,
        );
      };
    }
  }, [checkScrollPosition]);

  // Event listener-ek hozzáadása és eltávolítása
  useEffect(() => {
    document.addEventListener('mouseup', handleGlobalMouseUp);
    document.addEventListener('touchend', handleGlobalTouchEnd);

    // Scroll esemény figyelése
    const currentScroller = scrollerRef.current;
    if (currentScroller) {
      currentScroller.addEventListener('scroll', checkScrollPosition);

      // Már az elején ellenőrizzük a scrollhelyzetet
      checkScrollPosition();
    }

    return () => {
      document.removeEventListener('mouseup', handleGlobalMouseUp);
      document.removeEventListener('touchend', handleGlobalTouchEnd);
      if (currentScroller) {
        currentScroller.removeEventListener('scroll', checkScrollPosition);
      }
    };
  }, [handleGlobalMouseUp, handleGlobalTouchEnd, checkScrollPosition]);

  // Optimalizált getSourceInfo függvény
  const getSourceInfo = useCallback((item: NewsItem): string[] => {
    const parts = [];
    if (item.source) {
      // Domain végződés eltávolítása
      const cleanSourceName = item.source.replace(/\.(hu|com|org|net|io|co\.uk|de|pl|ro)$/, '');
      parts.push(cleanSourceName);
    }

    // Ellenőrizzük, hogy van-e érvényes dátum
    const hasValidDate = item.timestamp || (item.date && new Date(item.date).getTime() > 0);

    // Ha van érvényes dátum, formatRelativeTime-ot használunk rövidített formátummal
    if (hasValidDate) {
      const relativeTime = formatRelativeTime(item.timestamp || item.date, true); // true a rövidített formátumhoz

      // Csak akkor adjuk hozzá, ha nem negatív
      if (!relativeTime.includes('-')) {
        parts.push(relativeTime);
      }
    }

    return parts;
  }, []);

  // ✅ KIKAPCSOLÁS: Hookok után, JSX előtt
  if (!HORIZONTAL_SCROLLER_ENABLED) {
    return null;
  }

  // Hírek ellenőrzése a renderelés előtt - Ha nincs elég, null-t adunk vissza
  if (!news || news.length < minItemsToShow) {
    return null;
  }

  return (
    <div
      className={`${styles.scrollerContainer} ${scrollPosition.isAtStart ? styles.hideLeft : ''} ${scrollPosition.isAtEnd ? styles.hideRight : ''}`}
      // Megakadályozza az egész konténer húzását, amikor a görgetőnyilakat használjuk
      onMouseDown={(e) => e.stopPropagation()}
    >
      {/* Bal nyíl gomb a görgetéshez */}
      {showScrollIndicators && !scrollPosition.isAtStart && (
        <button
          className={`${styles.scrollButton} ${styles.scrollButtonLeft}`}
          onClick={scrollToLeft}
          aria-label="Görgetés balra"
        >
          <svg viewBox="0 0 24 24" width="18" height="18">
            <path d="M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z" fill="currentColor" />
          </svg>
        </button>
      )}

      <div
        ref={scrollerRef}
        className={`${styles.scrollerItems} ${isDragging ? styles.grabbing : ''}`}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        // KOMMENTÁLD KI: onMouseUp eseménykezelő
        // onMouseUp={handleMouseUp}
        // onMouseLeave={handleMouseUp}
        onMouseUp={handleGlobalMouseUp as any}
        onMouseLeave={handleGlobalMouseUp as any}
        onTouchStart={handleTouchStart}
        // KOMMENTÁLD KI: onTouchMove React eseménykezelő
        // onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {visibleNews.map((item, index) => {
          // Egyszerűsített domain és favicon lekérdezés
          const domain = extractDomain({
            url: item.url,
            sourceId: item.sourceId,
            sourceName: item.source,
          });

          const faviconUrl = getFaviconUrl({
            url: item.url,
            sourceId: item.sourceId,
            sourceName: item.source,
          });

          // Forrás információ begyűjtése a NewsGroup-pal egységes megjelenítéshez
          const sourceInfo = getSourceInfo(item);

          // Ország/régió kinyerése biztonságos módon, string ellenőrzéssel
          let location: string | undefined | null = null;
          if ('country' in item && typeof item.country === 'string' && item.country) {
            location = item.country;
          } else if ('region' in item && typeof item.region === 'string' && item.region) {
            location = item.region;
          }

          return (
            <div
              key={item.id ?? `news-${index}`}
              className={styles.scrollerCard}
              onClick={(e) => {
                UserHistoryService.logVisit({
                  timestamp: Date.now(),
                  searchTerm: item.title,
                  country: item.country,
                  source: item.source,
                  url: item.url,
                });
                openNewsItem(item.url, e);
              }}
            >
              <h4 className={styles.title}>{item.title}</h4>

              {/* Egységesített meta szekció a NewsGroup mintájára */}
              <div className={styles.resultSource}>
                {faviconUrl && (
                  <img
                    src={faviconUrl}
                    alt=""
                    className={styles.sourceFavicon}
                    onError={(e) => {
                      const currentSrc = (e.target as HTMLImageElement).src;
                      // Domain használata
                      const alternatives = getAlternativeFaviconUrls(domain);
                      const currentIndex = alternatives.findIndex((alt) => alt === currentSrc);
                      if (currentIndex >= 0 && currentIndex < alternatives.length - 1) {
                        (e.target as HTMLImageElement).src = alternatives[currentIndex + 1];
                      } else {
                        (e.target as HTMLImageElement).style.display = 'none';
                      }
                    }}
                  />
                )}
                {/* Forrás és idő egy sorban, középponttal elválasztva */}
                <span>{sourceInfo.join(' · ')}</span>

                {/* Badge-ek hozzáadása, ha szükséges */}
                {location && (
                  <span className={`badge badge-country ${styles.metaBadge}`}>{location}</span>
                )}
                {item.category && (
                  <span className={`badge badge-category ${styles.metaBadge}`}>
                    {item.category}
                  </span>
                )}
                {item.continent && (
                  <span className={`badge badge-continent ${styles.metaBadge}`}>
                    {item.continent}
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Jobb nyíl gomb a görgetéshez */}
      {showScrollIndicators && !scrollPosition.isAtEnd && (
        <button
          className={`${styles.scrollButton} ${styles.scrollButtonRight}`}
          onClick={scrollToRight}
          aria-label="Görgetés jobbra"
        >
          <svg viewBox="0 0 24 24" width="18" height="18">
            <path d="M10 6L8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6z" fill="currentColor" />
          </svg>
        </button>
      )}
    </div>
  );
};

export default HorizontalNewsScroller;
