// src/backend/api/routes/Search/Search.ts

import { Router } from 'express';
import { db } from '../server/PostgreSQLManager';
import { logger } from '../server/logger';

import { SUPPORTED_LANGUAGES, isValidLanguage } from './searchConfig';

const searchRouter = Router();
const BACKEND_SEARCH_ENABLED = true;

function getQueryParamAsString(param: unknown): string | undefined {
  if (Array.isArray(param)) return String(param[0]);
  if (param !== undefined) return String(param);
  return undefined;
}

searchRouter.get('/', async (req, res) => {
  if (!BACKEND_SEARCH_ENABLED) {
    return res.status(503).json({ error: 'Backend search is currently disabled.' });
  }

  try {
    const { q, lang } = req.query;

    const searchQuery = getQueryParamAsString(q);
    if (!searchQuery || searchQuery.trim() === '') {
      return res.status(400).json({ error: 'A "q" (query) paraméter megadása kötelező.' });
    }

    const langStr = getQueryParamAsString(lang);

    // ESET 1: Nyelv-specifikus keresés
    if (langStr && isValidLanguage(langStr)) {
      const { config, vector } = SUPPORTED_LANGUAGES[langStr];
      logger.info(`[Search] Nyelv-specifikus keresés: "${searchQuery}", Nyelv: ${config}`);
      
      const queryParams = [config, searchQuery];
      const sqlQuery = `
        SELECT n.id, n.title, n.url, n.description, n.published_at, n.source_slug, n.country_code, n.image_url,
               n.source_name, n.continent, n.orszag,  -- ÚJ MEZŐK
               '${langStr}' as match_language,
               ts_rank_cd(n.${vector}, websearch_to_tsquery($1, $2)) as relevance
        FROM public.news n
        WHERE n.${vector} @@ websearch_to_tsquery($1, $2)
          AND n.published_at >= NOW() - INTERVAL '24 hours'
        ORDER BY relevance DESC, published_at DESC
      `;
      
      const countParams = [config, searchQuery];
      const countQuery = `SELECT COUNT(*) as total FROM public.news WHERE ${vector} @@ websearch_to_tsquery($1, $2) AND published_at >= NOW() - INTERVAL '24 hours'`;
      
      const [result, countResult] = await Promise.all([
        db.query(sqlQuery, queryParams),
        db.query(countQuery, countParams),
      ]);

      const totalResults = parseInt(countResult.rows[0].total, 10);
      logger.info(`[Search] Keresés sikeres: "${searchQuery}". Találatok: ${result.rowCount} (összesen: ${totalResults})`);

      res.json({
        query: searchQuery,
        totalResults,
        results: result.rows,
      });

    } 
    // ESET 2: Globális keresés
    else {
      logger.info(`[Search] Globális keresés indul: "${searchQuery}"`);
      const queryParams = [searchQuery];
      
      const searchBlocks = Object.entries(SUPPORTED_LANGUAGES).map(([key, { config, vector }]) => `
        (SELECT n.id, n.title, n.url, n.description, n.published_at, n.source_slug, n.country_code, n.image_url,
                n.source_name, n.continent, n.orszag,  -- ÚJ MEZŐK
                '${key}' as match_language,
                ts_rank_cd(n.${vector}, websearch_to_tsquery('${config}', $1)) as relevance
         FROM public.news n
         WHERE n.${vector} @@ websearch_to_tsquery('${config}', $1)
           AND n.published_at >= NOW() - INTERVAL '24 hours')
      `).join(' UNION ALL ');
      
      const countQuery = `
        WITH language_counts AS (
          SELECT
            ${Object.entries(SUPPORTED_LANGUAGES).map(([key, { config, vector }]) => 
              `COUNT(*) FILTER (WHERE ${vector} @@ websearch_to_tsquery('${config}', $1) AND published_at >= NOW() - INTERVAL '24 hours') AS ${key}_count`
            ).join(',\n            ')}
          FROM public.news
        )
        SELECT 
          json_build_object(${Object.keys(SUPPORTED_LANGUAGES).map(key => `'${key}', ${key}_count`).join(', ')}) AS breakdown,
          ${Object.keys(SUPPORTED_LANGUAGES).map(key => `${key}_count`).join(' + ')} AS total
        FROM language_counts
      `;
      
      const sqlQuery = `
        SELECT * FROM (${searchBlocks}) as combined_results
        ORDER BY relevance DESC, published_at DESC
      `;

      // --- DEBUG: GENERATED GLOBAL SQL ---
      console.log("--- DEBUG: GENERATED GLOBAL SQL ---");
      console.log("Main Query:", sqlQuery);
      console.log("Count Query:", countQuery);
      console.log("Params:", queryParams);
      console.log("------------------------------------");

      // --- LEKÉRDEZÉSEK FUTTATÁSA ---
      const [result, countResult] = await Promise.all([
        db.query(sqlQuery, queryParams),
        db.query(countQuery, [searchQuery]),
      ]);

      const totalResults = parseInt(countResult.rows[0].total, 10);
      const languageBreakdown = countResult.rows[0].breakdown;
      
      res.json({
        query: searchQuery,
        totalResults,
        languageBreakdown,
        results: result.rows,
      });
    }
  } catch (err: unknown) {
    // JAVÍTÁS: A bevált, részletes hibakezelő logika beillesztése
    if (typeof err === 'object' && err !== null && 'code' in err && typeof (err as { code: unknown }).code === 'string') {
      const dbError = err as { code: string; message: string; stack?: string };
      logger.error(`[Search] Adatbázis hiba történt! Kód: ${dbError.code}`, dbError);
      res.status(500).json({ error: 'Hiba történt a keresési lekérdezés során.' });
    } else {
      const error = err as Error;
      logger.error('[Search] Ismeretlen típusú hiba a keresés során:', error.stack || error);
      res.status(500).json({ error: 'Szerverhiba történt a keresés közben.' });
    }
  }
});

export default searchRouter;