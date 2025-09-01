/* AdCard.module.css */

.adCardContainer {
  margin: 24px auto;
  max-width: 400px;
  width: 100%;
  position: relative;
  overflow: hidden;
  border-radius: 16px;
  box-shadow: 0 2px 12px rgba(0,0,0,0.08);
  background: #fff;
  transition: box-shadow 0.2s, transform 0.2s;
}
.adCardContainer:hover {
  box-shadow: 0 4px 20px rgba(0,0,0,0.13);
  transform: translateY(-2px) scale(1.01);
}

.adBadge {
  position: absolute;
  top: 10px;
  left: 12px;
  z-index: 2;
  background: #ffe066;
  color: #222;
  font-size: 13px;
  font-weight: 700;
  padding: 3px 10px;
  border-radius: 8px;
  box-shadow: 0 1px 4px rgba(0,0,0,0.07);
  letter-spacing: 0.02em;
  pointer-events: none;
  user-select: none;
}

.adCardLink {
  display: flex;
  flex-direction: column;
  color: inherit;
  text-decoration: none;
  width: 100%;
  height: 100%;
}

.adCardImage {
  width: 100%;
  height: 180px;
  object-fit: cover;
  border-top-left-radius: 16px;
  border-top-right-radius: 16px;
  background: #f3f3f3;
}

.adCardContent {
  padding: 18px 16px 14px 16px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.adCardTitle {
  margin: 0 0 4px 0;
  font-size: 1.1rem;
  font-weight: 600;
  color: #222;
}

.adCardDescription {
  margin: 0 0 4px 0;
  font-size: 0.98rem;
  color: #444;
}

.adCardAdvertiser {
  font-size: 0.85rem;
  color: #888;
  text-align: right;
  margin-top: 8px;
}

/* Mock mód */
.mockAdCard {
  border: 1.5px dashed #bbb;
  background-color: #f7f7f7;
  padding: 14px 8px 10px 8px;
  text-align: center;
  margin: 0 auto;
  max-width: 300px;
  min-height: 60px;
  height: 100%;
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
  align-items: center;
  border-radius: 8px;
  position: relative;
  box-sizing: border-box;
}

.mockAdBadge {
  position: absolute;
  top: 6px;
  left: 8px;
  z-index: 2;
  background: #ffe066;
  color: #222;
  font-size: 12px;
  font-weight: 600;
  padding: 2px 8px;
  border-radius: 8px;
  box-shadow: 0 1px 4px rgba(0,0,0,0.07);
  letter-spacing: 0.02em;
  pointer-events: none;
  user-select: none;
}

.mockAdContent {
  margin-top: 18px;
  width: 100%;
}

@media (max-width: 768px) {
  .adCardContainer, .mockAdCard {
    max-width: 100%;
    min-height: 50px;
    padding: 0;
    border-radius: 10px;
  }
  .adCardImage {
    height: 120px;
    border-top-left-radius: 10px;
    border-top-right-radius: 10px;
  }
}

.app.dark .adCardContainer {
  background: #232323;
  box-shadow: 0 2px 12px rgba(0,0,0,0.18);
}

.app.dark .adBadge, .app.dark .mockAdBadge {
  background: #ffe066;
  color: #222;
  border: 1px solid #444;
}
.........................................
/* src\components\Ad\AdCard.tsx */

import React from 'react';
import styles from './AdCard.module.css';

export interface AdCardProps {
  title: string;
  description: string;
  imageUrl?: string;
  advertiser: string;
  clickUrl: string;
  badgeLabel?: string; // "Hirdetés" vagy "Sponsored"
  onClick?: () => void;
}

export const AdCard: React.FC<AdCardProps> = ({
  title,
  description,
  imageUrl,
  advertiser,
  clickUrl,
  badgeLabel = 'Hirdetés',
  onClick,
}) => {
  // Fejlesztői mock mód
  if (process.env.NODE_ENV !== 'production') {
    return (
      <div className={styles.mockAdCard} onClick={onClick} role="region" aria-label="Fejlesztői mock hirdetés">
        <span className={styles.mockAdBadge}>{badgeLabel}</span>
        <div className={styles.mockAdContent}>
          <p>Ez egy fejlesztői mock hirdetés.</p>
          <p><b>{title}</b></p>
          <p>{description}</p>
          <div style={{width: '80%', height: 32, background: '#e0e0e0', borderRadius: 4, margin: '12px auto'}} />
        </div>
      </div>
    );
  }

  return (
    <div className={styles.adCardContainer} role="region" aria-label={badgeLabel}>
      <span className={styles.adBadge}>{badgeLabel}</span>
      <a href={clickUrl} target="_blank" rel="noopener noreferrer" className={styles.adCardLink} onClick={onClick}>
        {imageUrl && <img src={imageUrl} alt={title} className={styles.adCardImage} />}
        <div className={styles.adCardContent}>
          <h4 className={styles.adCardTitle}>{title}</h4>
          <p className={styles.adCardDescription}>{description}</p>
          <span className={styles.adCardAdvertiser}>{advertiser}</span>
        </div>
      </a>
    </div>
  );
};
...................................................
// src\components\Ad\AdCard\index.ts

export { AdCard } from './AdCard';
export { injectAdsIntoNewsItems } from './injectAdsIntoNewsItems';
export type { AdCardItem } from './injectAdsIntoNewsItems';
......................................................
// AdCardItem típus
export interface AdCardItem {
  type: 'ad';
  id: string;
  title: string;
  description: string;
  imageUrl?: string;
  advertiser: string;
  clickUrl: string;
}

// CardData típust importáld, vagy használd a NewsItem típust, ha az a hírtípus
import { NewsItem } from '../../../types';

// A visszatérési típus: (NewsItem | AdCardItem)[]
export function injectAdsIntoNewsItems(newsItems: NewsItem[], frequency = 5): (NewsItem | AdCardItem)[] {
  const result: (NewsItem | AdCardItem)[] = [];
  for (let i = 0; i < newsItems.length; i++) {
    result.push(newsItems[i]);
    if ((i + 1) % frequency === 0) {
      result.push({
        type: 'ad',
        id: `ad-${i}`,
        title: 'Fedezd fel a világ híreit!',
        description: 'Tudd meg, mi történik most – valós időben.',
        imageUrl: '/ads/default-ad.jpg',
        advertiser: 'NewsTide Partner',
        clickUrl: 'https://example.com/promo',
      });
    }
  }
  return result;
}

.........................................................

// adConfig.ts
// import { useTranslation } from 'react-i18next'; // ❌ ELTÁVOLÍTVA: Hook nem használható itt

export const ADSENSE_SCRIPT_URL = 'https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js';
// A .env fájlba írt VITE_ prefixű változókat import.meta.env-ből olvassuk (Vite)
export const AD_CLIENT = import.meta.env.VITE_AD_CLIENT ?? 'ca-pub-XXXXXXXXXXXX';
export const AD_SLOT_DEFAULT = import.meta.env.VITE_AD_SLOT ?? 'XXXXXXXXXX';

// Konfiguráció validálása
export const validateAdConfig = () => {
  // ✅ JAVÍTVA: Hook nélkül, egyszerű console.warn
  if (!AD_CLIENT) {
    console.warn(
      `[AdConfig] Missing AD_CLIENT configuration`,
    );
  }
  if (!ADSENSE_SCRIPT_URL) {
    console.warn(
      `[AdConfig] Missing ADSENSE_SCRIPT_URL configuration`,
    );
  }
};

export const IS_AD_CONFIG_VALID = Boolean(AD_CLIENT && ADSENSE_SCRIPT_URL);

................................................................................

import React, { useEffect, useState } from 'react';
import { AD_CLIENT, AD_SLOT_DEFAULT, IS_AD_CONFIG_VALID } from '../../apiclient/adConfig';

const panelStyle: React.CSSProperties = {
  position: 'fixed',
  right: 16,
  bottom: 16,
  zIndex: 99999,
  background: 'rgba(30,30,30,0.97)',
  color: '#fff',
  borderRadius: 10,
  boxShadow: '0 2px 12px rgba(0,0,0,0.18)',
  padding: '18px 22px 14px 18px',
  fontSize: 14,
  minWidth: 260,
  maxWidth: 340,
  fontFamily: 'monospace',
  lineHeight: 1.6,
  pointerEvents: 'auto',
};
const titleStyle: React.CSSProperties = {
  fontWeight: 700,
  fontSize: 15,
  marginBottom: 8,
};
const labelStyle: React.CSSProperties = {
  color: '#90caf9',
  fontWeight: 600,
};
const slotStyle: React.CSSProperties = {
  background: '#222',
  borderRadius: 4,
  padding: '2px 6px',
  margin: '2px 0',
  fontSize: 13,
  display: 'block',
};
const warningStyle: React.CSSProperties = {
  background: '#ff9800',
  color: '#222',
  borderRadius: 6,
  padding: '6px 10px',
  margin: '10px 0 0 0',
  fontWeight: 700,
  fontSize: 14,
  boxShadow: '0 1px 4px rgba(0,0,0,0.10)',
};

function detectAdBlock(): boolean {
  // Create a dummy adsbygoogle element
  const test = document.createElement('div');
  test.className = 'adsbygoogle';
  test.style.height = '1px';
  test.style.width = '1px';
  test.style.position = 'absolute';
  test.style.left = '-9999px';
  document.body.appendChild(test);
  const blocked = getComputedStyle(test).display === 'none' || test.offsetParent === null;
  document.body.removeChild(test);
  return blocked;
}

export const AdSenseDebugPanel: React.FC = () => {
  const [ads, setAds] = useState<Array<{ slot: string; visible: boolean }>>([]);
  const [scriptLoaded, setScriptLoaded] = useState(false);
  const [adBlockDetected, setAdBlockDetected] = useState(false);

  useEffect(() => {
    if (process.env.NODE_ENV === 'production') return;
    setScriptLoaded(!!window.adsbygoogle);
    const nodes = Array.from(document.querySelectorAll('.adsbygoogle')) as HTMLElement[];
    setAds(
      nodes.map((el) => ({
        slot: el.getAttribute('data-ad-slot') || '(none)',
        visible: !!(el.offsetParent !== null && el.offsetHeight > 0 && el.offsetWidth > 0),
      }))
    );
    setAdBlockDetected(detectAdBlock());
  }, []);

  if (process.env.NODE_ENV === 'production') return null;

  return (
    <div style={panelStyle}>
      <div style={titleStyle}>AdSense Debug Panel</div>
      <div><span style={labelStyle}>AD_CLIENT:</span> {AD_CLIENT || <i>empty</i>}</div>
      <div><span style={labelStyle}>AD_SLOT_DEFAULT:</span> {AD_SLOT_DEFAULT || <i>empty</i>}</div>
      <div><span style={labelStyle}>IS_AD_CONFIG_VALID:</span> {String(IS_AD_CONFIG_VALID)}</div>
      <div><span style={labelStyle}>Script loaded:</span> {String(scriptLoaded)}</div>
      <div><span style={labelStyle}>AdBlock detected:</span> {String(adBlockDetected)}</div>
      {adBlockDetected && (
        <div style={warningStyle}>
          ⚠️ AdBlocker detected! Ads may not display. Fallback or promo content recommended.
        </div>
      )}
      <div style={{marginTop: 10, marginBottom: 2, fontWeight: 600}}>adsbygoogle elements:</div>
      {ads.length === 0 && <div style={{color:'#bbb'}}>No .adsbygoogle elements found.</div>}
      {ads.map((ad, i) => (
        <div key={i} style={slotStyle}>
          slot: <b>{ad.slot}</b> | visible: <b>{String(ad.visible)}</b>
        </div>
      ))}
    </div>
  );
}; 

................................................
// src\components\Ad\adService.ts

// Singleton promise cache a betöltött script URL-ekhez
const scriptPromises: Map<string, Promise<void>> = new Map();

export function injectScript(src: string): Promise<void> {
  if (!scriptPromises.has(src)) {
    const promise = new Promise<void>((resolve, reject) => {
      const existing = document.querySelector(`script[src="${src}"]`);
      if (existing) {
        resolve();
        return;
      }
      const s = document.createElement('script');
      s.src = src;
      s.async = true;
      s.crossOrigin = 'anonymous';
      s.onload = () => resolve();
      s.onerror = () => reject(new Error(`Failed to load ${src}`));
      document.head.appendChild(s);
    });
    scriptPromises.set(src, promise);
  }
  return scriptPromises.get(src)!;
}

.............................................................
// src\components\Ad\analytics.ts

export function trackAdEvent(event: string, payload?: Record<string, any>) {
  if (typeof window !== 'undefined' && typeof window.gtag === 'function') {
    window.gtag('event', event, payload || {});
  } else {
    // Fallback: log to console in dev
    // eslint-disable-next-line no-console
    console.log('[Analytics] (dev) event:', event, payload);
  }
} 
............................................

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

...........................................................