import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Card } from '../../Card/Card';
import { getSavedNews, removeSavedNews, SavedNewsItem } from './savedNewsUtils';
import styles from './SavedNews.module.css';
import CardMoreMenu from '../../CardMoreMenu/CardMoreMenu';

/**
 * A mentett hírek megjelenítéséért felelős komponens
 */
const SavedNews: React.FC = () => {
  const { t } = useTranslation();
  // Állapotok
  const [savedNews, setSavedNews] = useState<SavedNewsItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [openMenuCardId, setOpenMenuCardId] = useState<string | null>(null);
  const [menuAnchorEl, setMenuAnchorEl] = useState<HTMLElement | null>(null);

  // Mentett hírek betöltése
  const loadSavedNews = () => {
    try {
      const news = getSavedNews();
      // Rendezés a mentés időpontja szerint (legújabbak elöl)
      news.sort((a, b) => b.timestamp - a.timestamp);
      setSavedNews(news);
    } catch (error) {
      console.error('Hiba a mentett hírek betöltésekor:', error);
    } finally {
      setLoading(false);
    }
  };

  // Első betöltéskor
  useEffect(() => {
    loadSavedNews();
  }, []);

  // --- ÚJ: savedNewsUpdated esemény figyelése, automatikus frissítés ---
  useEffect(() => {
    const handler = () => {
      loadSavedNews();
    };
    window.addEventListener('savedNewsUpdated', handler);
    return () => window.removeEventListener('savedNewsUpdated', handler);
  }, []);
  // --- VÉGE ---

  // Menü kezelése
  const handleToggleMenu = (cardId: string | undefined, anchorEl: HTMLElement | null, cardEl?: HTMLElement | null) => {
    if (cardId && cardId === openMenuCardId) {
      // Ha ugyanarra a kártyára kattintunk, bezárjuk a menüt
      setOpenMenuCardId(null);
      setMenuAnchorEl(null);
    } else if (cardId && anchorEl) {
      // Új kártya menü megnyitása
      setOpenMenuCardId(cardId);
      setMenuAnchorEl(anchorEl);
    } else {
      // Menü bezárása
      setOpenMenuCardId(null);
      setMenuAnchorEl(null);
    }
  };

  // Menü bezárása
  const handleCloseMenu = () => {
    setOpenMenuCardId(null);
    setMenuAnchorEl(null);
  };

  // Hír törlése a mentettek közül
  const handleRemoveSaved = (id: string | undefined) => {
    if (id && removeSavedNews(id)) {
      loadSavedNews(); // Újratöltjük a listát
      handleCloseMenu(); // Bezárjuk a menüt
    }
  };

  // Dátum formázása a megjelenítéshez
  const formatSavedDate = (timestamp: number): string => {
    return new Date(timestamp).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className={styles.savedNewsContainer}>
      {loading ? (
        <div className={styles.loadingIndicator}>{t('savedNews.loading')}</div>
      ) : savedNews.length === 0 ? (
        <div className={styles.emptyState}>
          <p>{t('savedNews.emptyState.noSaved')}</p>
          <p>
            {t('savedNews.emptyState.instruction')}
          </p>
        </div>
      ) : (
        <div className={styles.newsGrid}>
          {savedNews.map((newsItem) => (
            <div key={newsItem.id} className={styles.savedCardWrapper}>
              <Card {...newsItem} onToggleMenu={handleToggleMenu} />
              <div className={styles.savedMeta}>
                <span className={styles.savedDate}>
                  {t('savedNews.savedLabel')} {formatSavedDate(newsItem.timestamp)}
                </span>
                <button
                  className={styles.removeButton}
                  onClick={() => handleRemoveSaved(newsItem.id)}
                  title={t('savedNews.removeButton')}
                >
                  {t('savedNews.removeIcon')}
                </button>
              </div>

              {/* Menü az aktuális kártyához */}
              {openMenuCardId === newsItem.id && (
                <CardMoreMenu
                  open={true}
                  anchorEl={menuAnchorEl}
                  onClose={handleCloseMenu}
                  url={newsItem.url}
                  onSave={() => handleRemoveSaved(newsItem.id)}
                  saveText={t('savedNews.removeMenuText')}
                />
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default SavedNews;
