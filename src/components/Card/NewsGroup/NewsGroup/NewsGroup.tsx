import * as React from 'react';
import { useTranslation } from 'react-i18next';
import styles from './NewsGroup.module.css';
import { NewsItem } from '../../../../types';
import {
  getFaviconUrl,
  getAlternativeFaviconUrls,
  extractDomain,
} from '../../../../utils/favicon/favicon';
// Új import a relatív idő formázásához
import { formatRelativeTime } from '../../../../utils/dateFormatter/dateFormatter';
import { UserHistoryService } from '../../../History/utils/UserHistoryService';

export interface NewsGroupProps {
  news: NewsItem[];
  maxItems?: number;
  onToggleMenu?: (cardId: string | undefined, anchorEl: HTMLElement | null, cardEl?: HTMLElement | null) => void;
}

export const NewsGroup: React.FC<NewsGroupProps> = ({ news, maxItems = 3, onToggleMenu }) => {
  const visibleNews = news.slice(0, maxItems);
  const { t } = useTranslation();

  return (
    <div className={styles.newsGroup}>
      <div className={styles.newsGroupItems}>
        {visibleNews.map((newsItem) => {
          const buttonRef = React.createRef<HTMLButtonElement>();

          // Ország/régió kinyerése biztonságos módon, string ellenőrzéssel
          let location: string | undefined | null = null;
          if ('country' in newsItem && typeof newsItem.country === 'string' && newsItem.country) {
            location = newsItem.country;
          } else if (
            'region' in newsItem &&
            typeof newsItem.region === 'string' &&
            newsItem.region
          ) {
            location = newsItem.region;
          }

          // Favicon URL lekérése
          const faviconUrl = getFaviconUrl({
            url: newsItem.url,
            sourceId: newsItem.sourceId,
            sourceName: newsItem.source,
          });

          // Forrás információ összeállítása (a Card komponens logikája alapján)
          const getSourceInfo = (): string[] => {
            const parts = [];
            if (newsItem.source) {
              // Domain végződés eltávolítása (opcionális, mint a Card-ban)
              const cleanSourceName = newsItem.source.replace(
                /\.(hu|com|org|net|io|co\.uk|de|pl|ro)$/,
                '',
              );
              parts.push(cleanSourceName);
            }
            // Relatív idő használata
            parts.push(formatRelativeTime(newsItem.timestamp || newsItem.date));
            return parts;
          };
          const sourceInfo = getSourceInfo();

          return (
            <div key={newsItem.id || `news-${Math.random()}`} className={styles.newsGroupItem}>
              {/* Tartalom konténer */}
              <div
                className={styles.newsItemContent}
                onClick={() => {
                  console.log('NEWSGROUP CLICK', { title: newsItem.title, url: newsItem.url, country: newsItem.country, source: newsItem.source });
                  UserHistoryService.logVisit({
                    timestamp: Date.now(),
                    searchTerm: newsItem.title,
                    country: newsItem.country,
                    source: newsItem.source,
                    url: newsItem.url,
                  });
                  if (newsItem.url) {
                    window.open(newsItem.url, '_blank', 'noopener,noreferrer');
                  }
                }}
              >
                <h4 className={styles.newsItemTitle}>
                  {newsItem.title}
                  {newsItem.sourceStatus === 'scraped' && (
                    <span
                      className={styles.sourceStatusIcon}
                      title={t('card.status.scraped', 'Content extracted from HTML source')}
                    >
                      🌐
                    </span>
                  )}
                  {newsItem.sourceStatus === 'invalid' && (
                    <span className={styles.sourceStatusIcon} title={t('card.status.invalid', 'Problematic source')}>
                      ⚠️
                    </span>
                  )}
                  {newsItem.sourceStatus === 'unavailable' && (
                    <span className={styles.sourceStatusIcon} title={t('card.status.unavailable', 'Unavailable source')}>
                      ⛔
                    </span>
                  )}
                  {newsItem.hasRssFeed && (
                    <span className={styles.rssIcon} title={t('card.rss', 'RSS available')}>
                      📶
                    </span>
                  )}
                </h4>

                {/* === MÓDOSÍTOTT META RÉSZ === */}
                <div className={styles.newsItemMeta}>
                  {/* Favicon (mint a Card-ban) */}
                  {faviconUrl && (
                    <img
                      src={faviconUrl}
                      alt=""
                      className={styles.sourceFavicon}
                      onError={(e) => {
                        const currentSrc = (e.target as HTMLImageElement).src;
                        const domain = extractDomain({
                          url: newsItem.url,
                          sourceId: newsItem.sourceId,
                          sourceName: newsItem.source,
                        });
                        const alternatives = getAlternativeFaviconUrls(domain);
                        const currentIndex = alternatives.findIndex((alt) => alt === currentSrc);
                        if (currentIndex >= 0 && currentIndex < alternatives.length - 1) {
                          (e.target as HTMLImageElement).src = alternatives[currentIndex + 1];
                        } else {
                          (e.target as HTMLImageElement).style.display = 'none';
                        }
                      }}
                    />
                  )}

                  {/* Forrás és idő (mint a Card-ban) */}
                  <span className={styles.resultSource}>{sourceInfo.join(' · ')}</span>

                  {/* Badge-ek (mint a Card-ban) */}
                  {location && (
                    <span className={`badge badge-country ${styles.metaBadge}`}>{location}</span>
                  )}
                  {newsItem.category && (
                    <span className={`badge badge-category ${styles.metaBadge}`}>
                      {newsItem.category}
                    </span>
                  )}
                  {newsItem.continent && (
                    <span className={`badge badge-continent ${styles.metaBadge}`}>
                      {newsItem.continent}
                    </span>
                  )}
                </div>
                {/* === MÓDOSÍTOTT META RÉSZ VÉGE === */}
              </div>

              {/* Menü Gomb */}
              {onToggleMenu && (
                <div className={styles.moreButtonContainer}>
                  <button
                    ref={buttonRef}
                    className={styles.moreButton}
                    title={t('card.moreOptions', 'More options')}
                    onClick={(e) => {
                      e.stopPropagation();
                      e.preventDefault();
                      onToggleMenu(newsItem.id, buttonRef.current, null);
                    }}
                  >
                    ⋮
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
