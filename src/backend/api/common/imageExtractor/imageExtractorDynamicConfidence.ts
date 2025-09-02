/**
 * Image Extractor Dynamic Confidence - Dinamikus konfidencia számítás
 * 
 * Ez a modul kezeli a feed-specifikus konfidencia számításokat
 * és a feed profil cache-t.
 */

// Importáljuk a szükséges típusokat
import { RssItem } from './imageExtractorStrategies';
import { SYNC_STRATEGIES } from './imageExtractorStrategies';

/**
 * Feed-specifikus profil - Dinamikus konfidencia támogatáshoz
 */
export interface FeedProfile {
  feedUrl: string;
  strategySuccessRates: Record<string, number>;
  preferredStrategies: string[];
  confidenceOverrides: Record<string, number>;
  totalProcessed: number;
  lastUpdated: number;
}

/**
 * Feed profil cache - Memória optimalizált tárolás
 */
class FeedProfileCache {
  private profiles = new Map<string, FeedProfile>();
  private readonly maxProfiles = 1000; // Maximum 1000 feed profil cache-ben
  private readonly ttl = 24 * 60 * 60 * 1000; // 24 óra TTL

  /**
   * Feed profil lekérése vagy létrehozása
   */
  getOrCreateProfile(feedUrl: string): FeedProfile {
    const existing = this.profiles.get(feedUrl);
    
    if (existing && (Date.now() - existing.lastUpdated) < this.ttl) {
      return existing;
    }

    // Új profil létrehozása
    const newProfile: FeedProfile = {
      feedUrl,
      strategySuccessRates: {},
      preferredStrategies: [],
      confidenceOverrides: {},
      totalProcessed: 0,
      lastUpdated: Date.now()
    };

    // Cache méret ellenőrzése
    if (this.profiles.size >= this.maxProfiles) {
      this.evictOldest();
    }

    this.profiles.set(feedUrl, newProfile);
    return newProfile;
  }

  /**
   * Feed profil frissítése sikeres képkinyerés után
   */
  updateProfile(feedUrl: string, strategy: string, success: boolean): void {
    const profile = this.getOrCreateProfile(feedUrl);
    
    // Sikereség arány frissítése
    if (!profile.strategySuccessRates[strategy]) {
      profile.strategySuccessRates[strategy] = 0;
    }
    
    const currentRate = profile.strategySuccessRates[strategy];
    const totalAttempts = profile.totalProcessed;
    
    if (success) {
      profile.strategySuccessRates[strategy] = (currentRate * totalAttempts + 1) / (totalAttempts + 1);
    } else {
      profile.strategySuccessRates[strategy] = (currentRate * totalAttempts) / (totalAttempts + 1);
    }
    
    profile.totalProcessed++;
    profile.lastUpdated = Date.now();
    
    // Preferált stratégiák frissítése
    this.updatePreferredStrategies(profile);
  }

  /**
   * Preferált stratégiák frissítése sikereség arány alapján
   */
  private updatePreferredStrategies(profile: FeedProfile): void {
    const strategies = Object.entries(profile.strategySuccessRates)
      .filter(([_, rate]) => rate > 0.3) // Csak azok, amik legalább 30%-ban sikeresek
      .sort(([_, a], [__, b]) => b - a)
      .slice(0, 3) // Top 3 stratégia
      .map(([strategy, _]) => strategy);
    
    profile.preferredStrategies = strategies;
  }

  /**
   * Legrégebbi profil eltávolítása cache-ből
   */
  private evictOldest(): void {
    let oldestKey: string | null = null;
    let oldestTime = Date.now();

    for (const [key, profile] of this.profiles.entries()) {
      if (profile.lastUpdated < oldestTime) {
        oldestTime = profile.lastUpdated;
        oldestKey = key;
      }
    }

    if (oldestKey) {
      this.profiles.delete(oldestKey);
    }
  }

  /**
   * Cache statisztikák
   */
  getStats(): { totalProfiles: number; averageSuccessRate: number } {
    const profiles = Array.from(this.profiles.values());
    const totalProfiles = profiles.length;
    
    let totalSuccessRate = 0;
    let strategyCount = 0;
    
    for (const profile of profiles) {
      for (const rate of Object.values(profile.strategySuccessRates)) {
        totalSuccessRate += rate;
        strategyCount++;
      }
    }
    
    return {
      totalProfiles,
      averageSuccessRate: strategyCount > 0 ? totalSuccessRate / strategyCount : 0
    };
  }
}

// Globális feed profil cache
const feedProfileCache = new FeedProfileCache();

/**
 * Dinamikus konfidencia számítás feed-specifikus adatok alapján
 */
export function calculateDynamicConfidence(
  strategy: string, 
  feedUrl: string, 
  item: RssItem
): number {
  // Alap konfidencia a stratégiából
  const baseConfidence = SYNC_STRATEGIES.find(s => s.name === strategy)?.confidence || 0.5;
  
  // Feed profil lekérése
  const profile = feedProfileCache.getOrCreateProfile(feedUrl);
  
  // Feed-specifikus szorzók
  const feedMultiplier = profile.confidenceOverrides[strategy] || 1.0;
  const successRate = profile.strategySuccessRates[strategy] || 0.5;
  
  // Preferált stratégia bónusz
  const isPreferred = profile.preferredStrategies.includes(strategy);
  const preferredMultiplier = isPreferred ? 1.2 : 1.0;
  
  // Feed tapasztalat alapú bónusz (minél több item, annál megbízhatóbb)
  const experienceMultiplier = Math.min(1.0 + (profile.totalProcessed / 1000), 1.3);
  
  // Dinamikus konfidencia számítás
  const dynamicConfidence = baseConfidence * feedMultiplier * successRate * preferredMultiplier * experienceMultiplier;
  
  return Math.min(dynamicConfidence, 1.0);
}

/**
 * Feed-specifikus konfidencia felülírások beállítása
 */
export function setFeedConfidenceOverrides(
  feedUrl: string, 
  overrides: Record<string, number>
): void {
  const profile = feedProfileCache.getOrCreateProfile(feedUrl);
  profile.confidenceOverrides = { ...profile.confidenceOverrides, ...overrides };
  profile.lastUpdated = Date.now();
}

/**
 * Feed profil statisztikák lekérése
 */
export function getFeedProfileStats(feedUrl: string): FeedProfile | null {
  return feedProfileCache.getOrCreateProfile(feedUrl);
}

/**
 * Cache statisztikák lekérése
 */
export function getCacheStats(): { totalProfiles: number; averageSuccessRate: number } {
  return feedProfileCache.getStats();
}

/**
 * Feed profil cache exportálása (a fő modul számára)
 */
export { feedProfileCache };

/**
 * DINAMIKUS KONFIDENCIA TESZT - Fejlesztés közbeni ellenőrzés
 */
export function testDynamicConfidence() {
  console.log('🧪 Dinamikus Konfidencia Teszt...');
  
  // Teszt feed URL
  const testFeedUrl = 'https://index.hu/rss';
  
  // Teszt item
  const testItem: RssItem = {
    title: 'Teszt cikk',
    description: 'Teszt leírás',
    link: 'https://index.hu/cikk/123',
    enclosure: {
      $: {
        url: 'https://example.com/image.jpg',
        type: 'image/jpeg',
        width: '600',
        height: '400'
      }
    }
  };
  
  // 1. Alap konfidencia teszt
  const baseConfidence = calculateDynamicConfidence('enclosure', testFeedUrl, testItem);
  console.log(`Alap konfidencia: ${baseConfidence.toFixed(3)}`);
  
  // 2. Feed profil beállítása
  setFeedConfidenceOverrides(testFeedUrl, {
    'enclosure': 1.2,
    'media-thumbnail': 0.8
  });
  
  // 3. Módosított konfidencia teszt
  const modifiedConfidence = calculateDynamicConfidence('enclosure', testFeedUrl, testItem);
  console.log(`Módosított konfidencia: ${modifiedConfidence.toFixed(3)}`);
  
  // 4. Sikereség szimulálása
  feedProfileCache.updateProfile(testFeedUrl, 'enclosure', true);
  feedProfileCache.updateProfile(testFeedUrl, 'enclosure', true);
  feedProfileCache.updateProfile(testFeedUrl, 'media-thumbnail', false);
  
  // 5. Tapasztalat alapú konfidencia teszt
  const experiencedConfidence = calculateDynamicConfidence('enclosure', testFeedUrl, testItem);
  console.log(`Tapasztalat alapú konfidencia: ${experiencedConfidence.toFixed(3)}`);
  
  // 6. Cache statisztikák
  const stats = getCacheStats();
  console.log('Cache statisztikák:', stats);
  
  // 7. Feed profil statisztikák
  const profile = getFeedProfileStats(testFeedUrl);
  console.log('Feed profil:', profile);
  
  return true;
} 