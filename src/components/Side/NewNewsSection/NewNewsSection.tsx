/**
 * NewNewsSection komponens
 *
 * Az új hírek megjelenítése a Side panelben
 * Badge kattintásra aktiválódik
 */

import React from 'react';
import styles from './NewNewsSection.module.css';

interface NewNewsSectionProps {
  tabId: string;
  onClose: () => void;
  newsList?: Array<{
    id: string;
    title: string;
    source?: string;
    date?: string;
  }>;
}

export const NewNewsSection: React.FC<NewNewsSectionProps> = ({
  tabId,
  onClose,
  newsList = [],
}) => {
  const handleMarkAllRead = () => {
    // TODO: Implementálni a mind olvasott logikát
    console.log('Mind olvasott:', tabId);
    onClose();
  };

  const handleNewsClick = (newsId: string) => {
    // TODO: Hír megnyitása új tabban
    console.log('Hír megnyitása:', newsId);
  };

  return (
    <div className={styles.newNewsSection}>
      <div className={styles.header}>
        <button className={styles.closeButton} onClick={onClose} aria-label="Close">
          ×
        </button>
      </div>

      <div className={styles.content}>
        {newsList.length > 0 ? (
          <>
            <div className={styles.newsList}>
              {newsList.map((news) => (
                <div
                  key={news.id}
                  className={styles.newsItem}
                  onClick={() => handleNewsClick(news.id)}
                >
                  <div className={styles.newsTitle}>{news.title}</div>
                  {news.source && <div className={styles.newsSource}>{news.source}</div>}
                </div>
              ))}
            </div>

            <div className={styles.actions}>
              <button className={styles.markAllButton} onClick={handleMarkAllRead}>
                Mark all read
              </button>
            </div>
          </>
        ) : (
          <div className={styles.emptyState}>
            <p>No new news</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default NewNewsSection;
