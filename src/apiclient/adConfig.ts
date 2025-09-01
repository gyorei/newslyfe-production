export const ADSENSE_SCRIPT_URL = import.meta.env.VITE_ADSENSE_SCRIPT_URL || '';
export const AD_CLIENT = import.meta.env.VITE_AD_CLIENT || '';
export const AD_SLOT_DEFAULT = import.meta.env.VITE_AD_SLOT || '';
export const IS_AD_CONFIG_VALID = Boolean(AD_CLIENT && ADSENSE_SCRIPT_URL.includes('adsbygoogle')); 