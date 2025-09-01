// src\components\Ad\useAd.ts
import { useEffect, useRef, RefObject } from 'react';

// Lehetőségek a hook számára: láthatóság, kattintás, küszöbérték beállítása
export interface UseAdOptions {
  onVisible?: () => void;
  onClick?: () => void;
  onDoubleClick?: () => void;
  onHover?: () => void;
  threshold?: number;
}

export function useAd({
  onVisible,
  onClick,
  onDoubleClick,
  onHover,
  threshold = 0,
}: UseAdOptions = {}): RefObject<HTMLDivElement> {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el || !('IntersectionObserver' in window)) return;
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          onVisible?.();
          obs.disconnect();
        }
      },
      { threshold },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [onVisible, threshold]);
  useEffect(() => {
    const el = ref.current;
    if (!el || !onClick) return;
    const handleClick = () => onClick();
    el.addEventListener('click', handleClick);
    return () => el.removeEventListener('click', handleClick);
  }, [onClick]);

  // Double click esemény kezelése
  useEffect(() => {
    const el = ref.current;
    if (!el || !onDoubleClick) return;
    const handleDblClick = () => onDoubleClick();
    el.addEventListener('dblclick', handleDblClick);
    return () => el.removeEventListener('dblclick', handleDblClick);
  }, [onDoubleClick]);

  // Hover esemény kezelése (mouseenter)
  useEffect(() => {
    const el = ref.current;
    if (!el || !onHover) return;
    const handleMouseEnter = () => onHover();
    el.addEventListener('mouseenter', handleMouseEnter);
    return () => el.removeEventListener('mouseenter', handleMouseEnter);
  }, [onHover]);

  return ref;
}
