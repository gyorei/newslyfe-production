// src/backend/api/utils/newsDeduplication.ts
/*
export interface DedupableNews {
    title?: string;
    description?: string;
    url?: string;
    publishDate?: string;
    date?: string;
    [key: string]: any;
  }
  
  function normalizeTitle(title: string): string {
    return (title || '')
      .replace(/<\/?[^>]+(>|$)/g, '') // HTML tag-ek eltávolítása
      .replace(/\s+/g, ' ')           // Többszörös whitespace egy szóközre
      .trim()
      .toLowerCase();
  }
  
  /**
   * Duplikált hírek szűrése: ha a normalizált title vagy az url már szerepelt, kihagyja.
   *//*
  export function deduplicateNews<T extends DedupableNews>(news: T[]): T[] {
    const seenTitles = new Set<string>();
    const seenUrls = new Set<string>();
    return news.filter(item => {
      const normTitle = normalizeTitle(item.title || '');
      const url = item.url || '';
      if (seenTitles.has(normTitle)) return false;
      if (seenUrls.has(url)) return false;
      seenTitles.add(normTitle);
      seenUrls.add(url);
      return true;
    });
  }
  */