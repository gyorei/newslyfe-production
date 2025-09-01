// src\components\CardMoreMenu\CardMoreMenu.tsx
import React, { useEffect, useRef, useLayoutEffect } from 'react';
import styles from './CardMoreMenu.module.css';

// Propok definíciója a menühöz
export interface CardMoreMenuProps {
  open: boolean; // Megmondja, hogy a menü nyitva van-e
  anchorEl: HTMLElement | null; // A gomb DOM eleme, amihez igazítjuk a menüt
  onClose: () => void; // Callback a menü bezárásához
  // Callback propok az akciókhoz
  onAnalyze?: () => void;
  onSave?: () => void;
  onShare?: () => void;
  onHideSource?: () => void;
  url?: string; // Az eredeti cikk URL-je
  saveText?: string; // Új prop: a mentés gomb egyedi szövege
  // ✅ ÚJ: Kártya DOM eleme a pozicionáláshoz
  cardEl?: HTMLElement | null; // A kártya DOM eleme
}

const CardMoreMenu: React.FC<CardMoreMenuProps> = ({
  open,
  anchorEl,
  onClose,
  onAnalyze,
  onSave,
  onShare,
  onHideSource,
  url,
  saveText = '⭐ Save', // Alapértelmezett mentés szöveg - angolra fordítva
  cardEl,
}) => {
  const menuRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = React.useState<{ top: number; left: number } | null>(null);

  // ✅ JAVÍTOTT: Intelligens pozicionálás függvény - kártya határain belül
  const calculateOptimalPosition = (anchorRect: DOMRect, menuWidth: number, menuHeight: number) => {
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    const padding = 8; // Minimális térköz a képernyő szélétől

    // ✅ ÚJ: Kártya határainak kiszámítása
    let cardRect: DOMRect | null = null;
    if (cardEl) {
      cardRect = cardEl.getBoundingClientRect();
    }

    let left: number;
    let top: number;

    // ✅ 1. Horizontális pozicionálás - prioritás a jobb oldal, de ha nem fér ki, akkor balra
    const canFitRight = anchorRect.right + menuWidth + padding <= viewportWidth;
    const canFitLeft = anchorRect.left - menuWidth - padding >= 0;

    // ✅ ÚJ: Kártya határain belül pozicionálás
    if (cardRect) {
      const canFitRightInCard = anchorRect.right + menuWidth + padding <= cardRect.right;
      const canFitLeftInCard = anchorRect.left - menuWidth - padding >= cardRect.left;

      if (canFitRightInCard) {
        // Jobbra tudunk pozicionálni a kártyán belül
        left = anchorRect.right + 5;
      } else if (canFitLeftInCard) {
        // Balra tudunk pozicionálni a kártyán belül
        left = anchorRect.left - menuWidth - 5;
      } else {
        // Fallback: kártya közepén
        left = cardRect.left + (cardRect.width - menuWidth) / 2;
      }
    } else {
      // Fallback: viewport alapú pozicionálás
      if (canFitRight) {
        left = anchorRect.right + 5;
      } else if (canFitLeft) {
        left = anchorRect.left - menuWidth - 5;
      } else {
        left = Math.max(padding, viewportWidth - menuWidth - padding);
      }
    }

    // ✅ 2. Vertikális pozicionálás - prioritás alul, de ha nem fér ki, akkor felül
    const canFitBelow = anchorRect.bottom + menuHeight + padding <= viewportHeight;
    const canFitAbove = anchorRect.top - menuHeight - padding >= 0;

    // ✅ ÚJ: Kártya határain belül pozicionálás
    if (cardRect) {
      const canFitBelowInCard = anchorRect.bottom + menuHeight + padding <= cardRect.bottom;
      const canFitAboveInCard = anchorRect.top - menuHeight - padding >= cardRect.top;

      if (canFitBelowInCard) {
        // Alul tudunk pozicionálni a kártyán belül
        top = anchorRect.bottom + 5;
      } else if (canFitAboveInCard) {
        // Felül tudunk pozicionálni a kártyán belül
        top = anchorRect.top - menuHeight - 5;
      } else {
        // Fallback: kártya közepén
        top = cardRect.top + (cardRect.height - menuHeight) / 2;
      }
    } else {
      // Fallback: viewport alapú pozicionálás
      if (canFitBelow) {
        top = anchorRect.bottom + 5;
      } else if (canFitAbove) {
        top = anchorRect.top - menuHeight - 5;
      } else {
        top = Math.max(padding, viewportHeight - menuHeight - padding);
      }
    }

    // ✅ DEBUG: Konzolra írjuk ki a pozicionálási információkat
    // console.log('🔍 Menu Positioning Debug:', {
    //   viewport: { width: viewportWidth, height: viewportHeight },
    //   card: cardRect ? { 
    //     left: cardRect.left, 
    //     right: cardRect.right, 
    //     top: cardRect.top, 
    //     bottom: cardRect.bottom,
    //     width: cardRect.width,
    //     height: cardRect.height
    //   } : null,
    //   anchor: { 
    //     left: anchorRect.left, 
    //     right: anchorRect.right, 
    //     top: anchorRect.top, 
    //     bottom: anchorRect.bottom 
    //   },
    //   menu: { width: menuWidth, height: menuHeight },
    //   canFit: { right: canFitRight, left: canFitLeft, below: canFitBelow, above: canFitAbove },
    //   finalPosition: { left, top }
    // });

    return { left, top };
  };

  // ✅ JAVÍTOTT: Pozícionálás useLayoutEffect-tel
  useLayoutEffect(() => {
    // console.log('🔍 CardMoreMenu useLayoutEffect:', { open, anchorEl: !!anchorEl });
    
    if (!open || !anchorEl) {
      setPosition(null);
      return;
    }

    const anchorRect = anchorEl.getBoundingClientRect();
    // console.log('🔍 Anchor rect:', anchorRect);
    
    // Első alkalommal ideiglenes pozíció a gomb közelében
    if (!menuRef.current) {
      // console.log('🔍 Setting initial position');
      
      // ✅ JAVÍTOTT: Az első pozíció is intelligens legyen - kártya határain belül
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;
      const padding = 8;
      
      // Becsült menü méretek (alapértelmezett)
      const estimatedMenuWidth = 180;
      const estimatedMenuHeight = 200;
      
      // ✅ ÚJ: Kártya határainak kiszámítása
      let cardRect: DOMRect | null = null;
      if (cardEl) {
        cardRect = cardEl.getBoundingClientRect();
      }
      
      let left: number;
      let top: number;
      
      // ✅ ÚJ: Kártya határain belül pozicionálás
      if (cardRect) {
        const canFitRightInCard = anchorRect.right + estimatedMenuWidth + padding <= cardRect.right;
        const canFitLeftInCard = anchorRect.left - estimatedMenuWidth - padding >= cardRect.left;

        if (canFitRightInCard) {
          left = anchorRect.right + 5;
        } else if (canFitLeftInCard) {
          left = anchorRect.left - estimatedMenuWidth - 5;
        } else {
          left = cardRect.left + (cardRect.width - estimatedMenuWidth) / 2;
        }
        
        const canFitBelowInCard = anchorRect.bottom + estimatedMenuHeight + padding <= cardRect.bottom;
        const canFitAboveInCard = anchorRect.top - estimatedMenuHeight - padding >= cardRect.top;

        if (canFitBelowInCard) {
          top = anchorRect.bottom + 5;
        } else if (canFitAboveInCard) {
          top = anchorRect.top - estimatedMenuHeight - 5;
        } else {
          top = cardRect.top + (cardRect.height - estimatedMenuHeight) / 2;
        }
      } else {
        // Fallback: viewport alapú pozicionálás
        if (anchorRect.right + estimatedMenuWidth + padding <= viewportWidth) {
          left = anchorRect.right + 5;
        } else if (anchorRect.left - estimatedMenuWidth - padding >= 0) {
          left = anchorRect.left - estimatedMenuWidth - 5;
        } else {
          left = Math.max(padding, viewportWidth - estimatedMenuWidth - padding);
        }
        
        if (anchorRect.bottom + estimatedMenuHeight + padding <= viewportHeight) {
          top = anchorRect.bottom + 5;
        } else if (anchorRect.top - estimatedMenuHeight - padding >= 0) {
          top = anchorRect.top - estimatedMenuHeight - 5;
        } else {
          top = Math.max(padding, viewportHeight - estimatedMenuHeight - padding);
        }
      }
      
      setPosition({ top, left });
      return;
    }

    // Miután a menü megjelent, kiszámoljuk az optimális pozíciót
    const menuRect = menuRef.current.getBoundingClientRect();
    // console.log('🔍 Menu rect:', menuRect);
    
    const optimalPosition = calculateOptimalPosition(
      anchorRect,
      menuRect.width,
      menuRect.height
    );

    setPosition(optimalPosition);
  }, [open, anchorEl]);

  // Külső kattintás figyelése a bezáráshoz
  useEffect(() => {
    if (!open) return;

    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      
      // console.log('🔍 Click outside detected:', {
      //   menuRef: !!menuRef.current,
      //   anchorEl: !!anchorEl,
      //   cardEl: !!cardEl,
      //   target: target,
      //   targetClass: target.className,
      //   menuContains: menuRef.current?.contains(target),
      //   anchorContains: anchorEl?.contains(target),
      //   cardContains: cardEl?.contains(target),
      //   isMoreButton: target.classList.contains('_moreButton_') || target.closest('._moreButton_') || target.className.includes('moreButton') ||
      //                     target.classList.contains('moreButton') ||
      //                     target.closest('.moreButton')
      // });
      
      // ✅ JAVÍTOTT: Ne zárjuk be, ha a kattintás egy 3 pontos gombra történik
      const isMoreButton = target.classList.contains('_moreButton_') || 
                          target.closest('._moreButton_') || 
                          target.className.includes('moreButton') ||
                          target.classList.contains('moreButton') ||
                          target.closest('.moreButton');
      if (isMoreButton) {
        // console.log('🔍 Click on more button - not closing menu');
        return;
      }
      
      // ✅ JAVÍTOTT: Ne zárjuk be, ha a kattintás a kártyán belül történik
      if (cardEl && cardEl.contains(target)) {
        // console.log('🔍 Click inside card - not closing menu');
        return;
      }
      
      // Csak akkor zárjuk be, ha a menün és a kártyán kívülre kattintottunk
      if (
        menuRef.current &&
        !menuRef.current.contains(target) &&
        cardEl &&
        !cardEl.contains(target)
      ) {
        // console.log('🔍 Closing menu due to outside click');
        onClose();
      }
    };

    // ✅ JAVÍTOTT: Nagyobb késleltetés, hogy a menü megjelenjen
    const timerId = setTimeout(() => {
      document.addEventListener('mousedown', handleClickOutside);
    }, 100); // 100ms késleltetés a 0ms helyett

    // Billentyűzet figyelés (ESC)
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        // console.log('🔍 Closing menu due to ESC key');
        onClose();
      }
    };
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      clearTimeout(timerId);
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [open, onClose, anchorEl]);

  // Ha nincs nyitva vagy nincs pozíció, ne rendereljünk semmit
  if (!open || !position) {
    return null;
  }

  // Menüpontok végrehajtása és bezárása
  const handleAction = (action?: () => void) => {
    console.log('[CardMoreMenu] Menü gomb kattintás:', action?.name);
    if (action) {
      action();
      console.log('[CardMoreMenu] Menü gomb művelet lefutott:', action?.name);
    }
    onClose(); // Minden akció után bezárjuk a menüt
    console.log('[CardMoreMenu] Menü bezárva');
  };

  return (
    <div
      ref={menuRef}
      className={styles.menu} // CSS modul használata
      style={{
        position: 'fixed', // Fix pozíció a viewport-hoz képest
        top: `${position.top}px`,
        left: `${position.left}px`,
        zIndex: 1050, // Magas z-index, hogy minden fölött legyen
      }}
      // Megakadályozza, hogy a menüre kattintás bezárja azt
      onClick={(e) => e.stopPropagation()}
    >
      {/* Tényleges menüpontok */}
      {onSave && (
        <button className={styles.menuItem} onClick={() => handleAction(onSave)}>
          {saveText}
        </button>
      )}
      {onShare && (
        <button className={styles.menuItem} onClick={() => handleAction(onShare)}>
          🔗 Share
        </button>
      )}
      {onAnalyze && (
        <button className={styles.menuItem} onClick={() => handleAction(onAnalyze)}>
          📊 Analyze News
        </button>
      )}
      {onHideSource && (
        <button className={styles.menuItem} onClick={() => handleAction(onHideSource)}>
          🚫 Hide Source
        </button>
      )}
      {url && (
        <button
          className={styles.menuItem}
          onClick={() => {
            window.open(url, '_blank', 'noopener,noreferrer');
            handleAction(); // Csak bezárás
          }}
        >
          🌐 Open Original in New Tab
        </button>
      )}
      {/* Ide jöhetnek további menüpontok később */}
    </div>
  );
};

export default CardMoreMenu;
