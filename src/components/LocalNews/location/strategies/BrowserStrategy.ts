// Böngészőnyelv alapú helymeghatározási stratégia
import { LocationData, LocationStrategy } from '../types';

export class BrowserStrategy implements LocationStrategy {
  getName(): string {
    return 'browser';
  }

  async getLocation(): Promise<LocationData | null> {
    try {
      const language = navigator.language || '';
      const fullLangCode = language.toLowerCase();
      const langParts = fullLangCode.split('-');
      const langCode = langParts[0];

      // Teljes nyelv-ország kombinációk
      const languageRegionMap: Record<string, { name: string; code: string }> = {
        'en-us': { name: 'United States', code: 'US' },
        'en-gb': { name: 'United Kingdom', code: 'GB' },
        'en-ca': { name: 'Canada', code: 'CA' },
        'en-au': { name: 'Australia', code: 'AU' },
        'en-in': { name: 'India', code: 'IN' },
        'en-nz': { name: 'New Zealand', code: 'NZ' },
        'en-ie': { name: 'Ireland', code: 'IE' },
        'en-za': { name: 'South Africa', code: 'ZA' },
        'en-sg': { name: 'Singapore', code: 'SG' },
        'fr-fr': { name: 'France', code: 'FR' },
        'fr-be': { name: 'Belgium', code: 'BE' },
        'fr-ca': { name: 'Canada', code: 'CA' },
        'fr-ch': { name: 'Switzerland', code: 'CH' },
        'fr-lu': { name: 'Luxembourg', code: 'LU' },
        'de-de': { name: 'Germany', code: 'DE' },
        'de-at': { name: 'Austria', code: 'AT' },
        'de-ch': { name: 'Switzerland', code: 'CH' },
        'de-be': { name: 'Belgium', code: 'BE' },
        'es-es': { name: 'Spain', code: 'ES' },
        'es-mx': { name: 'Mexico', code: 'MX' },
        'es-ar': { name: 'Argentina', code: 'AR' },
        'es-co': { name: 'Colombia', code: 'CO' },
        'es-cl': { name: 'Chile', code: 'CL' },
        'es-pe': { name: 'Peru', code: 'PE' },
        'it-it': { name: 'Italy', code: 'IT' },
        'it-ch': { name: 'Switzerland', code: 'CH' },
        'pt-pt': { name: 'Portugal', code: 'PT' },
        'pt-br': { name: 'Brazil', code: 'BR' },
        'nl-nl': { name: 'Netherlands', code: 'NL' },
        'nl-be': { name: 'Belgium', code: 'BE' },
        'pl-pl': { name: 'Poland', code: 'PL' },
        'ru-ru': { name: 'Russia', code: 'RU' },
        'sv-se': { name: 'Sweden', code: 'SE' },
        'no-no': { name: 'Norway', code: 'NO' },
        'fi-fi': { name: 'Finland', code: 'FI' },
        'da-dk': { name: 'Denmark', code: 'DK' },
        'cs-cz': { name: 'Czech Republic', code: 'CZ' },
        'sk-sk': { name: 'Slovakia', code: 'SK' },
        'hu-hu': { name: 'Hungary', code: 'HU' },
        'tr-tr': { name: 'Turkey', code: 'TR' },
        'el-gr': { name: 'Greece', code: 'GR' },
        'ro-ro': { name: 'Romania', code: 'RO' },
        'bg-bg': { name: 'Bulgaria', code: 'BG' },
        'hr-hr': { name: 'Croatia', code: 'HR' },
        'sl-si': { name: 'Slovenia', code: 'SI' },
        'sr-rs': { name: 'Serbia', code: 'RS' },
        'uk-ua': { name: 'Ukraine', code: 'UA' },
        'he-il': { name: 'Israel', code: 'IL' },
        'ar-sa': { name: 'Saudi Arabia', code: 'SA' },
        'ar-eg': { name: 'Egypt', code: 'EG' },
        'ja-jp': { name: 'Japan', code: 'JP' },
        'zh-cn': { name: 'China', code: 'CN' },
        'zh-tw': { name: 'Taiwan', code: 'TW' },
        'ko-kr': { name: 'South Korea', code: 'KR' },
      };

      // Bővített nyelvtámogatás
      const languageMap: Record<string, { name: string; code: string }> = {
        hu: { name: 'Hungary', code: 'HU' },
        en: { name: 'United Kingdom', code: 'GB' },
        de: { name: 'Germany', code: 'DE' },
        fr: { name: 'France', code: 'FR' },
        it: { name: 'Italy', code: 'IT' },
        es: { name: 'Spain', code: 'ES' },
        nl: { name: 'Netherlands', code: 'NL' },
        pl: { name: 'Poland', code: 'PL' },
        ru: { name: 'Russia', code: 'RU' },
        ja: { name: 'Japan', code: 'JP' },
        pt: { name: 'Portugal', code: 'PT' },
        sv: { name: 'Sweden', code: 'SE' },
        no: { name: 'Norway', code: 'NO' },
        fi: { name: 'Finland', code: 'FI' },
        da: { name: 'Denmark', code: 'DK' },
        cs: { name: 'Czech Republic', code: 'CZ' },
        sk: { name: 'Slovakia', code: 'SK' },
        tr: { name: 'Turkey', code: 'TR' },
        el: { name: 'Greece', code: 'GR' },
        ro: { name: 'Romania', code: 'RO' },
        bg: { name: 'Bulgaria', code: 'BG' },
        hr: { name: 'Croatia', code: 'HR' },
        sl: { name: 'Slovenia', code: 'SI' },
        sr: { name: 'Serbia', code: 'RS' },
        uk: { name: 'Ukraine', code: 'UA' },
        he: { name: 'Israel', code: 'IL' },
        ar: { name: 'Saudi Arabia', code: 'SA' },
        zh: { name: 'China', code: 'CN' },
        ko: { name: 'South Korea', code: 'KR' },
      };

      // Először próbáljuk a teljes nyelv-régió kombinációt
      let countryInfo = languageRegionMap[fullLangCode];

      // Ha nem található, próbáljuk csak a nyelvet
      if (!countryInfo) {
        countryInfo = languageMap[langCode];
      }

      // MÓDOSÍTVA: Ha még mindig nincs találat, NE állítsunk be alapértéket
      if (!countryInfo) {
        console.log(
          '[BrowserStrategy] Nem sikerült országot meghatározni a böngésző nyelve alapján',
        );
        return null; // Visszatérünk null-lal, hogy a következő stratégiára kerüljön a sor
      }

      return {
        country: countryInfo.name,
        countryCode: countryInfo.code,
        confidence: languageRegionMap[fullLangCode] ? 0.8 : 0.5, // Magasabb megbízhatóság pontos egyezésnél
        source: 'browser',
        timestamp: Date.now(), // Hozzáadva hiányzó timestamp mező
      };
    } catch (error) {
      console.error('Böngészőnyelv alapú helymeghatározás hiba:', error);
      return null;
    }
  }

  async initialize(): Promise<void> {
    // Nincs különösebb inicializációs logika
    return;
  }
}
