/**
 * Hírdisztribútor Szolgáltatás - Egyszerűsített verzió
 *
 * Felelős a hírek intelligens elosztásáért, rendezéséért a PostgreSQL-ben
 * tárolt fontossági szint (fontossag mező) alapján.
 */

import { RssNewsItem } from '../../../types';
import { localRssConfig } from '../config/localConfig';
import { normalizeCountry } from '../Location';
import { filterByTopSources, isTopSourceFilterEnabled } from './topNewsSites';

// Source objektum típusának bővítése a fontossag mezővel
export interface NewsSource {
  id: string;
  name: string;
  url: string;
  country?: string;
  continent?: string;
  fontossag?: number; // PostgreSQL-ben így szerepel - csak ezt használjuk
}

// Az RssNewsItem source mezőjének típusa
interface RssNewsItemSource {
  id?: string;
  name?: string;
  country?: string;
  continent?: string;
  fontossag?: number;
}

// Típus a TOP források szűréséhez
interface SourceForFilter {
  url: string;
  link: string;
  title: string;
  originalItem: RssNewsItem;
}

export class NewsDistributor {
  /**
   * Hírek szűrése fontosság szerint és elosztása
   *
   * @param newsItems A hírek listája
   * @param countryName Ország neve (opcionális)
   * @param importanceLevel Fontossági szint (1: kritikus, 2: standard, 4: opcionális)
   * @param continentName Kontinens neve (opcionális)
   * @param countryCode Ország kódja (TOP források szűréséhez)
   * @returns Szűrt és rendezett hírek listája
   */
  public static distribute(
    newsItems: RssNewsItem[],
    countryName?: string,
    importanceLevel?: number,
    continentName?: string,
    countryCode?: string,
  ): RssNewsItem[] {
    const { FILTERING } = localRssConfig.RSS_CONFIG;

    console.log(
      `[NewsDistributor.distribute] Kezdés: ${newsItems.length} hír, szűrés beállítások:`,
      {
        enabled: FILTERING.ENABLED,
        bypassAll: FILTERING.BYPASS_ALL_FILTERS,
        importanceFilter: FILTERING.IMPORTANCE_FILTER_ENABLED,
        countryFilter: FILTERING.COUNTRY_FILTER_ENABLED,
        topSourcesFilter: FILTERING.TOP_SITES_FILTER_ENABLED,
      },
    );

    // 🚨 GLOBÁLIS KIKAPCSOLÓ - Ha szűrés teljesen ki van kapcsolva
    if (!FILTERING.ENABLED || FILTERING.BYPASS_ALL_FILTERS) {
      console.log(
        `[NewsDistributor.distribute] 🔓 MINDEN SZŰRÉS KIKAPCSOLVA - ${newsItems.length} hír visszaadva szűrés nélkül`,
      );

      // Csak időbélyeg szerinti rendezés marad
      return [...newsItems].sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
    }

    if (newsItems.length <= 1) {
      console.log(`[NewsDistributor.distribute] Túl kevés hír, szűrés kihagyása`);
      return newsItems;
    }

    let filteredItems = [...newsItems];

    // ✅ ÚJ: TOP FORRÁSOK SZŰRÉSE - ELSŐ LÉPÉSKÉNT (ha engedélyezett és van ország kód)
    if (countryCode && isTopSourceFilterEnabled()) {
      console.log(`[NewsDistributor.distribute] ⭐ TOP források szűrése: ${countryCode}`);
      const beforeFilter = filteredItems.length;

      // Átalakítjuk a hírek formátumát a filterByTopSources számára
      const sourcesForFilter: SourceForFilter[] = filteredItems.map((item) => ({
        url: item.link || '',
        link: item.link || '',
        title: item.title,
        originalItem: item,
      }));

      const filteredSources = filterByTopSources(sourcesForFilter, countryCode);
      filteredItems = filteredSources.map((source: SourceForFilter) => source.originalItem);

      console.log(
        `[NewsDistributor.distribute] TOP források szűrés eredménye: ${filteredItems.length}/${beforeFilter} hír maradt`,
      );
    } else if (countryCode) {
      console.log(`[NewsDistributor.distribute] ⏭️ TOP források szűrése KIKAPCSOLVA - átugrás`);
    }

    // ✅ FONTOSSÁGI SZŰRÉS - csak ha engedélyezett
    if (importanceLevel !== undefined && FILTERING.IMPORTANCE_FILTER_ENABLED) {
      console.log(
        `[NewsDistributor.distribute] 📊 Fontosság szerinti szűrés: ${importanceLevel} szintre`,
      );

      if (FILTERING.DEBUG_MODE && newsItems.length > 0) {
        const sample = newsItems[0];
        console.log(`[NewsDistributor.distribute] Példa hírforrás:`, sample.source);
      }

      filteredItems = filteredItems.filter((item, idx) => {
        try {
          const source = item.source as RssNewsItemSource;
          const sourceImportance = source?.fontossag;
          const effectiveImportance = typeof sourceImportance === 'number' ? sourceImportance : 1;
          const shouldKeep = effectiveImportance <= importanceLevel;

          if (FILTERING.DEBUG_MODE && idx < 10) {
            console.log(
              `[NewsDistributor.distribute] Szűrés elem (${idx}): ID=${item.id.substring(0, 10)}..., ForrásFontosság=${sourceImportance}(${effectiveImportance}), Elvárt=${importanceLevel}, Megtartva=${shouldKeep}`,
            );
          }

          return shouldKeep;
        } catch (error) {
          console.warn(`[NewsDistributor.distribute] Hiba a hír szűrése közben:`, error);
          return false;
        }
      });

      console.log(
        `[NewsDistributor.distribute] Fontossági szűrés eredménye: ${filteredItems.length}/${newsItems.length} hír maradt`,
      );
    } else if (importanceLevel !== undefined) {
      console.log(`[NewsDistributor.distribute] ⏭️ Fontossági szűrés KIKAPCSOLVA - átugrás`);
    }

    // ✅ ORSZÁG SZERINTI SZŰRÉS - csak ha engedélyezett
    if (countryName && countryName.trim() !== '' && FILTERING.COUNTRY_FILTER_ENABLED) {
      console.log(`[NewsDistributor.distribute] 🌍 Ország szerinti szűrés: ${countryName}`);
      const beforeFilter = filteredItems.length;

      filteredItems = filteredItems.filter((item) => {
        const source = item.source as RssNewsItemSource;
        const country = source?.country;

        return (
          country &&
          (country.toLowerCase() === countryName.toLowerCase() ||
            normalizeCountry(country) === normalizeCountry(countryName))
        );
      });

      console.log(
        `[NewsDistributor.distribute] Ország szerinti szűrés eredménye: ${filteredItems.length}/${beforeFilter} hír maradt`,
      );
    } else if (countryName && countryName.trim() !== '') {
      console.log(`[NewsDistributor.distribute] ⏭️ Ország szerinti szűrés KIKAPCSOLVA - átugrás`);
    }

    // ✅ KONTINENS SZERINTI SZŰRÉS - csak ha engedélyezett
    if (continentName && continentName.trim() !== '' && FILTERING.CONTINENT_FILTER_ENABLED) {
      console.log(`[NewsDistributor.distribute] 🌎 Kontinens szerinti szűrés: ${continentName}`);
      const beforeFilter = filteredItems.length;

      filteredItems = filteredItems.filter((item) => {
        const source = item.source as RssNewsItemSource;
        const continent = source?.continent;

        return continent && continent.toLowerCase() === continentName.toLowerCase();
      });

      console.log(
        `[NewsDistributor.distribute] Kontinens szerinti szűrés eredménye: ${filteredItems.length}/${beforeFilter} hír maradt`,
      );
    } else if (continentName && continentName.trim() !== '') {
      console.log(
        `[NewsDistributor.distribute] ⏭️ Kontinens szerinti szűrés KIKAPCSOLVA - átugrás`,
      );
    }

    // Hírek rendezése időbélyeg alapján
    console.log(`[NewsDistributor.distribute] 📅 Hírek rendezése időbélyeg alapján`);
    const sortedItems = [...filteredItems].sort((a, b) => {
      return (b.timestamp || 0) - (a.timestamp || 0);
    });

    console.log(
      `[NewsDistributor.distribute] ✅ Elosztás befejezve: ${sortedItems.length} hír visszaadva`,
    );
    return sortedItems;
  }

  /**
   * A megadott fontossági szint alapján visszaadja a következő szintet
   * @param currentLevel A jelenlegi fontossági szint
   * @returns A következő fontossági szint, vagy null ha nincs több
   */
  public static getNextImportanceLevel(currentLevel: number): number | null {
    const { IMPORTANCE_LEVELS } = localRssConfig.RSS_CONFIG;
    console.log(
      `[NewsDistributor.getNextImportanceLevel] Jelenlegi szint: ${currentLevel}, elérhető szintek:`,
      IMPORTANCE_LEVELS,
    );

    if (currentLevel === IMPORTANCE_LEVELS.CRITICAL) {
      // 1
      console.log(
        `[NewsDistributor.getNextImportanceLevel] Következő szint: STANDARD (${IMPORTANCE_LEVELS.STANDARD})`,
      ); // 2
      return IMPORTANCE_LEVELS.STANDARD;
    } else if (currentLevel === IMPORTANCE_LEVELS.STANDARD) {
      // 2
      console.log(
        `[NewsDistributor.getNextImportanceLevel] Következő szint: OPTIONAL (${IMPORTANCE_LEVELS.OPTIONAL})`,
      ); // 4
      return IMPORTANCE_LEVELS.OPTIONAL;
    } else {
      console.log(`[NewsDistributor.getNextImportanceLevel] Nincs több szint`);
      return null; // Nincs több szint
    }
  }
}

export default NewsDistributor;
