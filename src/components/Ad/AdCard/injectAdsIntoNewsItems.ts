// AdProvider típus
export type AdProvider = 'adsense' | 'custom' | 'promo' | 'mock';

// AdCardItem típus
export interface AdCardItem {
  type: 'ad';
  adProvider: AdProvider; // új mező
  id: string;
  title: string;
  description: string;
  imageUrl?: string;
  advertiser: string;
  clickUrl: string;
  slotId?: string; // csak AdSense-hez
}

// CardData típust importáld, vagy használd a NewsItem típust, ha az a hírtípus
import { NewsItem } from '../../../types';

// A visszatérési típus: (NewsItem | AdCardItem)[]
// ÚJ: minFrequency és maxFrequency paraméterek, alapértelmezett: 5 és 10
export function injectAdsIntoNewsItems(
  newsItems: NewsItem[],
  minFrequency = 4,
  maxFrequency = 7
): (NewsItem | AdCardItem)[] {
  const result: (NewsItem | AdCardItem)[] = [];
  // Az első reklám pozíciója random 5-10 között
  let nextAdIndex = Math.floor(Math.random() * (maxFrequency - minFrequency + 1)) + minFrequency;

  for (let i = 0; i < newsItems.length; i++) {
    result.push(newsItems[i]);
    if (i + 1 === nextAdIndex) {
      result.push({
        type: 'ad',
        adProvider: 'adsense', // vagy 'custom' ha saját reklám
        id: `ad-${i}`,
        title: 'Fedezd fel a világ híreit!',
        description: 'Tudd meg, mi történik most – valós időben.',
        imageUrl: '/ads/default-ad.jpg',
        advertiser: 'NewsTide Partner',
        clickUrl: 'https://example.com/promo',
        slotId: '1234567890', // példa slotId
      });
      // Következő reklám pozíció random 5-10 hírral később
      nextAdIndex += Math.floor(Math.random() * (maxFrequency - minFrequency + 1)) + minFrequency;
    }
  }
  return result;
}
