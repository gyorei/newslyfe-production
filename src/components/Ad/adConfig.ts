// adConfig.ts
// import { useTranslation } from 'react-i18next'; // ❌ ELTÁVOLÍTVA: Hook nem használható itt

export const ADSENSE_SCRIPT_URL = 'https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js';
// A .env fájlba írt VITE_ prefixű változókat import.meta.env-ből olvassuk (Vite)
export const AD_CLIENT = import.meta.env.VITE_AD_CLIENT ?? 'ca-pub-XXXXXXXXXXXX';
export const AD_SLOT_DEFAULT = import.meta.env.VITE_AD_SLOT ?? 'XXXXXXXXXX';

// ========================================
// 🎥 AD SENSE SCRIPT LOADING - GOOGLE SZABÁLYOK!
// ========================================
export const loadAdSenseScript = (): Promise<void> => {
  return new Promise((resolve, reject) => {
    // Ellenőrizzük, hogy a script már betöltve van-e
    if (typeof window !== 'undefined' && window.adsbygoogle) {
      resolve();
      return;
    }

    // Script betöltése
    const script = document.createElement('script');
    script.src = ADSENSE_SCRIPT_URL;
    script.async = true;
    script.crossOrigin = 'anonymous';
    
    script.onload = () => {
      console.log('[AdConfig] ✅ AdSense script betöltve');
      resolve();
    };
    
    script.onerror = () => {
      console.error('[AdConfig] ❌ AdSense script betöltés sikertelen');
      reject(new Error('AdSense script betöltés sikertelen'));
    };
    
    document.head.appendChild(script);
  });
};

// ========================================
// 🎥 VIDEO AD CONFIGURATION - GOOGLE SZABÁLYOK!
// ========================================
export const VIDEO_AD_SLOT_DEFAULT = 'video-ad-slot';
export const VIDEO_AD_FREQUENCY_MIN = 3;
export const VIDEO_AD_FREQUENCY_MAX = 6;

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