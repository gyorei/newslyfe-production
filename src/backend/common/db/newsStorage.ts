// src\backend\common\db\newsStorage.ts
import { db } from '../../server/PostgreSQLManager.js';
import { logger } from '../../server/logger.js';
import format from 'pg-format'; // ÚJ IMPORT

export interface NewsItemForDb {
  country_code: string;
  source_slug: string;
  title: string;
  url: string;
  published_at: Date;
  description: string | null;
  image_url: string | null;
  content?: string | null;
  // --- ÚJ MEZŐK ---
  source_name: string;
  continent: string;
  source_language: string;
  source_importance: number;
  source_url: string;
  source_rss_feed: string;
  source_sections: object;
  orszag: string; // <-- ÚJ MEZŐ
}

export async function saveNewsToDatabase(newsItems: NewsItemForDb[]): Promise<void> {
  if (!newsItems || newsItems.length === 0) return;

  try {
    const columns = [
      'country_code', 'source_slug', 'title', 'url', 'published_at',
      'description', 'image_url', 'content',
      'source_name', 'continent', 'source_language', 'source_importance',
      'source_url', 'source_rss_feed', 'source_sections',
      'orszag' // <-- ÚJ MEZŐ
    ];

    const values = newsItems.map(item => [
      item.country_code,
      item.source_slug,
      item.title,
      item.url,
      item.published_at,
      item.description,
      item.image_url,
      item.content || null,
      item.source_name,
      item.continent,
      item.source_language,
      item.source_importance,
      item.source_url,
      item.source_rss_feed,
      JSON.stringify(item.source_sections),
      item.orszag // <-- ÚJ MEZŐ
    ]);

    const query = format(
      'INSERT INTO public.news (%I) VALUES %L ON CONFLICT (country_code, url_hash) DO NOTHING',
      columns,
      values
    );

    const result = await db.query(query);
    if (result && typeof result.rowCount === 'number' && result.rowCount > 0) {
      const countryCodes = [...new Set(newsItems.map(item => item.country_code))].join(', ');
      logger.info(`[DB WRITER] ${result.rowCount} db új hír mentve a következő országo(k)hoz: ${countryCodes}.`);
    }
  } catch (error) {
    logger.error('[DB WRITER] Hiba a hírek mentésekor:', error);
  }
}