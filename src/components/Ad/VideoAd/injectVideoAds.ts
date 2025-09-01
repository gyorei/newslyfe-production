// ========================================
// 🎥 VIDEO AD INJECTION LOGIKA
// ========================================
// Videó reklámok beszúrása a videó listába

export interface VideoAdItem {
  type: 'videoAd';
  id: string;
  title: string;
  description: string;
  imageUrl?: string;
  advertiser: string;
  clickUrl: string;
  // ========================================
  // 🎥 AD SENSE CONFIGURATION - GOOGLE SZABÁLYOK!
  // ========================================
  slotId?: string;
  clientId?: string;
  format?: string;
  responsive?: boolean;
  badgeLabel?: string;
}

export function injectVideoAdsIntoVideoItems(
  videoItems: any[],
  minFrequency = 3,
  maxFrequency = 6
): (any | VideoAdItem)[] {
  const result: (any | VideoAdItem)[] = [];
  let nextAdIndex = Math.floor(Math.random() * (maxFrequency - minFrequency + 1)) + minFrequency;

  for (let i = 0; i < videoItems.length; i++) {
    result.push(videoItems[i]);
    if (i + 1 === nextAdIndex) {
      result.push({
        type: 'videoAd',
        id: `videoAd-${i}`,
        title: 'Discover the best videos!',
        description: 'Check out the latest content.',
        imageUrl: '/ads/video-ad.jpg',
        advertiser: 'VideoTide Partner',
        clickUrl: 'https://example.com/video-promo',
        // ========================================
        // 🎥 AD SENSE CONFIGURATION - GOOGLE SZABÁLYOK!
        // ========================================
        slotId: `video-ad-slot-${i + 1}`, // Egyedi slot ID minden reklámhoz
        clientId: 'ca-pub-XXXXXXXXXXXX', // Google AdSense Client ID
        format: 'auto', // Automatikus formátum
        responsive: true, // Reszponzív reklám
        badgeLabel: '🎥 Ad',
      });
      nextAdIndex += Math.floor(Math.random() * (maxFrequency - minFrequency + 1)) + minFrequency;
    }
  }
  return result;
}
