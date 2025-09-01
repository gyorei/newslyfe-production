import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import styles from './HistoryPanel.module.css';
import { UserHistoryService } from '../utils/UserHistoryService';

const history = UserHistoryService.getAllHistory();

function formatTime(ts: number) {
  const d = new Date(ts);
  return d.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit', second: '2-digit' });
}
function formatDate(ts: number) {
  const d = new Date(ts);
  return d.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
}
function groupByDay(entries: typeof history) {
  return entries.reduce((acc, entry) => {
    const day = new Date(entry.timestamp).toISOString().split('T')[0];
    if (!acc[day]) acc[day] = [];
    acc[day].push(entry);
    return acc;
  }, {} as Record<string, typeof history>);
}

// Segédfüggvény a cím rövidítéséhez
function truncateTitle(title: string, maxLength = 70) {
  return title && title.length > maxLength ? title.slice(0, maxLength - 1) + '…' : title;
}
// Segédfüggvény a link rövidítéséhez
function shortUrl(url: string) {
  try {
    const u = new URL(url);
    return u.hostname + url.replace(u.origin, '').slice(0, 20) + (url.length > 40 ? '…' : '');
  } catch {
    return url && url.length > 30 ? url.slice(0, 30) + '…' : url;
  }
}

export const HistoryPanel: React.FC = () => {
  const { t } = useTranslation();
  const grouped = groupByDay(history);
  const [openDays, setOpenDays] = useState<Record<string, boolean>>(() => {
    const allOpen: Record<string, boolean> = {};
    Object.keys(grouped).forEach(day => { allOpen[day] = true; });
    return allOpen;
  });

  const toggleDay = (day: string) => {
    setOpenDays(prev => ({ ...prev, [day]: !prev[day] }));
  };

  if (Object.keys(grouped).length === 0) {
    return (
      <div className={styles.panel}>
        <div className={styles.topBar}></div>
        <div className={styles.empty}>{t('history.table.empty', 'Nincsenek előzmények')}</div>
      </div>
    );
  }

  return (
    <div className={styles.panel}>
      <div className={styles.topBar}></div>
      <div className={styles.tableHeader}>
        <div className={styles.colDate}>{t('history.table.time', 'Time')}</div>
        <div className={styles.headerDivider}></div>
        <div className={styles.colCenter + ' ' + styles.titleHeader}>{t('history.table.title', 'Title')}</div>
        <div className={styles.headerDivider}></div>
        <div className={styles.colRight}>{t('history.table.source', 'Source')}</div>
      </div>
      {Object.entries(grouped).map(([day, entries]) => (
        <React.Fragment key={day}>
          <div
            className={styles.dayHeader}
            onClick={() => toggleDay(day)}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') toggleDay(day); }}
            title={t('history.actions.toggle', 'Kibontás/Összecsukás')}
            aria-expanded={!!openDays[day]}
          >
            <span className={styles.dayArrow}>{openDays[day] ? '▼' : '▶'}</span>
            {formatDate(entries[0].timestamp)}
          </div>
          {openDays[day] && entries.map((entry) => (
            <div className={styles.row} key={entry.timestamp}>
              <div className={styles.colLeft}>{formatTime(entry.timestamp)}</div>
              <div className={styles.colCenter}>
                {truncateTitle(entry.searchTerm || entry.country || entry.source || '')}
              </div>
              <div className={styles.colRight}>
                {entry.source && entry.url ? (
                  <div className={styles.sourceCell}>
                    {/* Favicon, ha van: <img src={getFaviconUrl({ url: entry.url, sourceName: entry.source })} alt="" className={styles.favicon} /> */}
                    <span className={styles.sourceName}>{entry.source}</span>
                    <br />
                    <a
                      className={styles.url}
                      href={entry.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      title={entry.url}
                    >
                      {shortUrl(entry.url)}
                    </a>
                  </div>
                ) : entry.url ? (
                  <a
                    className={styles.url}
                    href={entry.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    title={entry.url}
                  >
                    {shortUrl(entry.url)}
                  </a>
                ) : (
                  entry.source && <span className={styles.sourceName}>{entry.source}</span>
                )}
              </div>
            </div>
          ))}
        </React.Fragment>
      ))}
    </div>
  );
};