import * as React from 'react';
import { useRef, useEffect } from 'react';
import styles from './SourceIconBar.module.css';
import { useUI } from '../../contexts/UIContext';

interface SourceIconBarProps {
  sources?: Array<{
    id: string;
    name: string;
    domain?: string;
  }>;
}

/**
 * Forrás ikonok sáv komponens
 * - Vízszintesen görgethető ikonok a hírek forrásaihoz
 * - Mobilon is működő vízszintes görgetés touch eseményekkel
 * - Be/ki kapcsolható a globális UI állapot alapján
 */
export const SourceIconBar: React.FC<SourceIconBarProps> = ({ sources = [] }) => {
  // UI állapot lekérése
  const { uiState } = useUI();

  // Referencia a görgethető konténerhez
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Touch és egérkerék eseménykezelés a vízszintes görgetéshez
  useEffect(() => {
    const scrollContainer = scrollContainerRef.current;
    if (!scrollContainer) return;

    let isDown = false;
    let startX: number;
    let scrollLeft: number;

    // Egér események
    const handleMouseDown = (e: MouseEvent) => {
      isDown = true;
      scrollContainer.classList.add(styles.grabbing);
      startX = e.pageX - scrollContainer.offsetLeft;
      scrollLeft = scrollContainer.scrollLeft;
    };

    const handleMouseUp = () => {
      isDown = false;
      scrollContainer.classList.remove(styles.grabbing);
    };

    const handleMouseLeave = () => {
      isDown = false;
      scrollContainer.classList.remove(styles.grabbing);
    };

    const handleMouseMove = (e: MouseEvent) => {
      if (!isDown) return;
      e.preventDefault();
      const x = e.pageX - scrollContainer.offsetLeft;
      const walk = (x - startX) * 2; // *2 a görgetés érzékenységének növelése
      scrollContainer.scrollLeft = scrollLeft - walk;
    };

    // Touch események
    const handleTouchStart = (e: TouchEvent) => {
      if (e.touches.length === 1) {
        isDown = true;
        startX = e.touches[0].pageX - scrollContainer.offsetLeft;
        scrollLeft = scrollContainer.scrollLeft;
      }
    };

    const handleTouchEnd = () => {
      isDown = false;
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (!isDown) return;
      const x = e.touches[0].pageX - scrollContainer.offsetLeft;
      const walk = (x - startX) * 2;
      scrollContainer.scrollLeft = scrollLeft - walk;
    };

    // Egérkerék esemény kezelése
    const handleWheel = (e: WheelEvent) => {
      e.preventDefault(); // Megakadályozzuk az oldal görgetését

      // Érzékenység állítása (nagyobb érték = gyorsabb görgetés)
      const sensitivity = 1.5;

      // Az egérkerék deltaY értéke alapján vízszintes görgetést végzünk
      // (deltaY pozitív lefelé görgetve, negatív felfelé görgetve)
      scrollContainer.scrollLeft += e.deltaY * sensitivity;
    };

    // Eseményfigyelők hozzáadása
    scrollContainer.addEventListener('mousedown', handleMouseDown);
    scrollContainer.addEventListener('mouseleave', handleMouseLeave);
    scrollContainer.addEventListener('mouseup', handleMouseUp);
    scrollContainer.addEventListener('mousemove', handleMouseMove);

    // Touch események
    scrollContainer.addEventListener('touchstart', handleTouchStart);
    scrollContainer.addEventListener('touchend', handleTouchEnd);
    scrollContainer.addEventListener('touchmove', handleTouchMove);

    // Egérkerék esemény (keresztböngésző kompatibilitás)
    scrollContainer.addEventListener('wheel', handleWheel, { passive: false });

    // Takarítás
    return () => {
      scrollContainer.removeEventListener('mousedown', handleMouseDown);
      scrollContainer.removeEventListener('mouseleave', handleMouseLeave);
      scrollContainer.removeEventListener('mouseup', handleMouseUp);
      scrollContainer.removeEventListener('mousemove', handleMouseMove);

      scrollContainer.removeEventListener('touchstart', handleTouchStart);
      scrollContainer.removeEventListener('touchend', handleTouchEnd);
      scrollContainer.removeEventListener('touchmove', handleTouchMove);

      scrollContainer.removeEventListener('wheel', handleWheel);
    };
  }, []);

  // Domain kinyerése a forrás ID-ből vagy névből
  const getDomain = (sourceId: string, name: string) => {
    // Ha van domain info a forrásban, azt használjuk
    if (sourceId.includes('-')) {
      const parts = sourceId.split('-');
      if (parts.length > 1) return parts[1];
    }

    // Ha nincs domain info a forrás ID-ben, a név alapján próbáljuk
    return name.toLowerCase().replace(/\s+/g, '');
  };

  // Favicon URL előállítása a domain alapján
  const getFaviconUrl = (domain: string) => {
    return `https://www.google.com/s2/favicons?domain=${domain}&sz=64`; // Nagyobb ikonok (64px)
  };

  // Forrás URL előállítása
  const getSourceUrl = (domain: string) => {
    if (domain.includes('.')) {
      // Ha már tartalmaz pontot, valószínűleg domain név
      return `https://${domain}`;
    }
    // Ellenkező esetben kiegészítjük
    return `https://${domain}.com`;
  };

  // Ha van megadott forrás, azt használjuk, egyébként üres tömb
  const displayedSources = sources.length > 0 ? sources : [];

  // Ha nincsenek források, nem jelenítjük meg a sávot
  if (displayedSources.length === 0) {
    return null;
  }

  return (
    <div
      className={`${styles.sourceIconBarContainer} ${!uiState.showSourceIcons ? styles.hidden : ''}`}
    >
      <div
        className={styles.sourceIconsScroll}
        ref={scrollContainerRef}
        tabIndex={0} // Fókuszálhatóvá tesszük a billentyűzettel való navigációhoz
      >
        <div className={styles.sourceIconsContainer}>
          {displayedSources.map((source: { id: string; name: string; domain?: string }) => {
            const domain = source.domain || getDomain(source.id, source.name);
            const faviconUrl = getFaviconUrl(domain);
            const sourceUrl = getSourceUrl(domain);

            return (
              <a
                key={source.id}
                href={sourceUrl}
                target="_blank"
                rel="noopener noreferrer"
                className={styles.sourceIconLink}
                title={source.name}
                onClick={(e) => {
                  // Megakadályozzuk, hogy a görgetés miatt rögtön kattintás eseményt váltson ki
                  if (scrollContainerRef.current?.classList.contains(styles.grabbing)) {
                    e.preventDefault();
                  }
                }}
              >
                <img
                  src={faviconUrl}
                  alt={source.name}
                  className={styles.sourceIcon}
                  onError={(e) => {
                    // Ha a favicon nem található, mutatunk egy fallback ikont
                    (e.target as HTMLImageElement).src =
                      'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="32" height="32"%3E%3Cpath fill="%23ccc" d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.94-.49-7-3.85-7-7.93s3.06-7.44 7-7.93v15.86zm2-15.86c3.94.49 7 3.85 7 7.93s-3.06 7.44-7 7.93V4.07z"/%3E%3C/svg%3E';
                  }}
                  draggable="false" // Megakadályozza a kép húzását
                />
              </a>
            );
          })}
        </div>
      </div>
    </div>
  );
};
