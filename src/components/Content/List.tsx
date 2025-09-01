/**
 * List.tsx
 *
 * A hírek megjelenítéséért felelős komponens, amely propsként kapott
 * híradatokat különböző formátumokban jeleníti meg a felhasználói felületen.
 *
 * Funkciók:
 * - Kiemelt hírek megjelenítése képekkel (max 2 hír nagy formátumban)
 * - További hírek megjelenítése képekkel standard kártyákon
 * - Kép nélküli hírek csoportosítása és megjelenítése 3-as csoportokban
 * - Üres állapot kezelése, ha nincs megjeleníthető hír
 *
 * A komponens különböző alkategóriákra bontja a híreket (képes/kép nélküli),
 * és más-más komponenst használ az egyes típusok megjelenítésére:
 * - CardLarge: kiemelt hírek
 * - Card: normál hírek képpel
 * - NewsGroup: csoportosított hírek kép nélkül
 */

import * as React from 'react';
import { Card } from '../Card/Card';
// import { CardLarge } from '../Card/CardLarge';
import { NewsGroup } from '../Card/NewsGroup/NewsGroup/NewsGroup';
import styles from './Content.module.css';
import { NewsItem } from '../../types';

interface ListProps {
  news: NewsItem[];
}

export const List: React.FC<ListProps> = ({ news }) => {
  // Ha nincs hír adat, egy üres komponenst adunk vissza
  if (!news || news.length === 0) {
    return <div className={styles.noNews}>Nincsenek megjeleníthető hírek</div>;
  }

  // Képes és kép nélküli hírek szétválasztása (only imageUrl)
  const newsWithImages = news.filter((item: NewsItem) => Boolean(item.imageUrl));
  const newsWithoutImages = news.filter((item: NewsItem) => !item.imageUrl);

  // Kép nélküli hírek csoportosítása (3 hírenként)
  const newsGroups = [];
  for (let i = 0; i < newsWithoutImages.length; i += 3) {
    newsGroups.push(newsWithoutImages.slice(i, i + 3));
  }

  return (
    <div className={styles.newsList}>
      {/* Kiemelt hírek egymás mellett */}
      {/* <div className={styles.featuredNewsContainer}>
        {newsWithImages.slice(0, 2).map((news: NewsItem) => (
          <CardLarge key={news.id} {...news} />
        ))}
      </div> */}

      {/* További hírek képekkel */}
      <div className={styles.regularNews}>
        {newsWithImages.slice(2).map((item: NewsItem) => {
          // Default sourceStatus to 'valid' if undefined
          const cardProps = {
            id: item.id,
            title: item.title,
            description: item.description,
            imageUrl: item.imageUrl,
            source: item.source,
            sourceId: item.sourceId,
            date: item.date,
            timestamp: item.timestamp,
            url: item.url,
            country: item.country,
            continent: item.continent,
            category: item.category,
            sourceStatus: item.sourceStatus ?? 'valid',
          };
          return <Card key={item.id} {...cardProps} />;
        })}

        {/* Kép nélküli hírek csoportosítva */}
        {newsGroups.map((group, index) => (
          <NewsGroup key={`group-${index}`} news={group} />
        ))}
      </div>
    </div>
  );
};
