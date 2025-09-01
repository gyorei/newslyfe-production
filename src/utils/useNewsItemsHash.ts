import { useMemo } from 'react';
import { NewsItem } from '../types';

export function useNewsItemsHash(newsItems: NewsItem[]) {
  return useMemo(() => {
    if (newsItems.length === 0) return 'empty';
    const first = newsItems[0]?.id ?? '';
    const last = newsItems[newsItems.length - 1]?.id ?? '';
    return `${newsItems.length}-${first}-${last}`;
  }, [newsItems]);
}
