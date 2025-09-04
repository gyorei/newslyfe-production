// src\components\Ad\AdCard\AdSenseUnit.tsx
import React, { useEffect, useRef } from 'react';

interface AdSenseUnitProps {
  slotId: string;
  clientId?: string;
  format?: string;
  style?: React.CSSProperties;
  responsive?: boolean;
}

// Google hivatalos teszt AdSense client ID (fejlesztéshez)
const TEST_AD_CLIENT = 'ca-pub-3940256099942544';

export const AdSenseUnit: React.FC<AdSenseUnitProps> = ({
  slotId,
  clientId,
  format = 'auto',
  style,
  responsive = true,
}) => {
  const insRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    // 🚨 TEMPORARILY DISABLED: AdSense causing scroll interference
    console.warn('⚠️ AdSense temporarily disabled due to scroll blocking issue');
    return;
    
    /* ORIGINAL CODE - RE-ENABLE AFTER FIX:
    if (typeof window === 'undefined') return;
    if (!window.adsbygoogle) window.adsbygoogle = [];

    // Ellenőrizzük, hogy az elem már inicializálva van-e
    if (insRef.current && !insRef.current.getAttribute('data-adsbygoogle-status')) {
      try {
        window.adsbygoogle.push({});
      } catch (e) {
        // eslint-disable-next-line no-console
        console.warn('AdSense load failed', e);
      }
    }
    */
  }, [slotId, clientId, format, responsive]);

  return (
    <ins
      ref={insRef as any}
      className="adsbygoogle"
      style={{ display: 'block', minHeight: style?.minHeight ?? 90, ...style }}
      data-ad-client={clientId || TEST_AD_CLIENT}
      data-ad-slot={slotId}
      data-ad-format={format}
      data-full-width-responsive={responsive ? 'true' : 'false'}
    />
  );
};

export default AdSenseUnit; 