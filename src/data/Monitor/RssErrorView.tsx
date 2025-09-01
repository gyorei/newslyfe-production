import React, { useState } from 'react';
import { RssMonitorEvent, RssErrorCategory } from './monitor';
import './monitor.css';

interface RssErrorViewProps {
  errors: RssMonitorEvent[];
  onClearErrors: () => void;
  onFixSource?: (sourceId: string, sourceUrl: string) => Promise<boolean>; // Új: Forrás javítási callback
  onDeleteSource?: (sourceId: string) => Promise<boolean>; // Új: Forrás törlési callback
  isAdmin?: boolean; // Új: Admin jogosultság jelzése
}

/**
 * Hibakategória nevének felhasználóbarát megjelenítése
 */
const getCategoryDisplayName = (category: RssErrorCategory | string): string => {
  const categoryMap: Record<string, string> = {
    'not-found': 'Nem található',
    parse: 'Feldolgozási hiba',
    timeout: 'Időtúllépés',
    server: 'Szerver hiba',
    cors: 'CORS hiba',
    exception: 'Kivétel',
    other: 'Egyéb hiba',
  };

  return categoryMap[category] || category;
};

/**
 * Hibaelemzés és hibanapló megjelenítése
 */
const RssErrorView: React.FC<RssErrorViewProps> = ({
  errors,
  onClearErrors, // Ezt most már használni fogjuk
  onFixSource,
  onDeleteSource,
  isAdmin = false, // Alapértelmezetten nem admin nézet
}) => {
  const [selectedCategory, setSelectedCategory] = useState<RssErrorCategory | 'all'>('all');
  const [editingSource, setEditingSource] = useState<string | null>(null); // Új: Szerkesztés alatt álló forrás ID
  const [newSourceUrl, setNewSourceUrl] = useState<string>(''); // Új: Szerkesztett URL
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false); // Új: Művelet folyamatban jelzés
  const [actionResult, setActionResult] = useState<{ success: boolean; message: string } | null>(
    null,
  ); // Új: Művelet eredmény

  // Hibák csoportosítása kategóriánként

  const errorsByCategory = errors.reduce(
    (acc, error) => {
      const category = String(error.errorCategory || RssErrorCategory.OTHER);
      if (!acc[category]) {
        acc[category] = [];
      }
      acc[category].push(error);
      return acc;
    },
    {} as Record<string, RssMonitorEvent[]>,
  );

  // Kategóriánkénti statisztikák összeállítása
  const categoryStats = Object.entries(errorsByCategory)
    .map(([category, categoryErrors]) => ({
      category,
      count: categoryErrors.length,
      latestTimestamp: Math.max(...categoryErrors.map((e) => e.timestamp)),
    }))
    .sort((a, b) => b.count - a.count); // Rendezés előfordulás szerint

  // Szűrt hibák
  const filteredErrors =
    selectedCategory === 'all'
      ? errors
      : errors.filter((e) => e.errorCategory === selectedCategory);

  // Új: Forrás szerkesztés kezdése
  const startEditingSource = (error: RssMonitorEvent) => {
    if (!error.sourceId || !error.sourceUrl) return;

    setEditingSource(error.sourceId);
    setNewSourceUrl(error.sourceUrl);
    setActionResult(null);
  };

  // Új: Forrás szerkesztés mentése
  const saveSourceEdit = async () => {
    if (!editingSource || !newSourceUrl || !onFixSource) return;

    try {
      setIsSubmitting(true);
      const success = await onFixSource(editingSource, newSourceUrl);

      setActionResult({
        success,
        message: success
          ? `Forrás sikeresen frissítve: ${editingSource}`
          : 'Nem sikerült frissíteni a forrást.',
      });

      if (success) {
        setEditingSource(null);
      }
    } catch (error) {
      setActionResult({
        success: false,
        message: `Hiba történt: ${error instanceof Error ? error.message : 'Ismeretlen hiba'}`,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Új: Forrás törlés megerősítése és végrehajtása
  const handleDeleteSource = async (sourceId: string) => {
    if (!onDeleteSource || !sourceId) return;

    if (window.confirm(`Biztosan törölni szeretné ezt a forrást: ${sourceId}?`)) {
      try {
        setIsSubmitting(true);
        const success = await onDeleteSource(sourceId);

        setActionResult({
          success,
          message: success
            ? `Forrás sikeresen törölve: ${sourceId}`
            : 'Nem sikerült törölni a forrást.',
        });
      } catch (error) {
        setActionResult({
          success: false,
          message: `Hiba történt: ${error instanceof Error ? error.message : 'Ismeretlen hiba'}`,
        });
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  // Új: Szerkesztés mód kilépése
  const cancelEdit = () => {
    setEditingSource(null);
    setNewSourceUrl('');
    setActionResult(null);
  };

  return (
    <div className="rss-error-view">
      {/* Kategóriák most a hibalista tetején egy sorban jelennek meg */}
      <div className="error-stats-container">
        <h3>Hibatípusok</h3>
        <div className="error-category-list">
          <div
            className={`error-category-item ${selectedCategory === 'all' ? 'selected' : ''}`}
            onClick={() => setSelectedCategory('all')}
          >
            <span className="category-name">Összes hiba</span>
            <span className="category-count">{errors.length}</span>
          </div>

          {categoryStats.map((stat) => (
            <div
              key={stat.category}
              className={`error-category-item ${selectedCategory === stat.category ? 'selected' : ''}`}
              onClick={() => setSelectedCategory(stat.category as RssErrorCategory)}
            >
              <span className="category-name">
                {getCategoryDisplayName(stat.category as RssErrorCategory)}
              </span>
              <span className="category-count">{stat.count}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Művelet eredmény megjelenítése */}
      {actionResult && (
        <div className={`action-result ${actionResult.success ? 'success' : 'error'}`}>
          {actionResult.message}
          <button className="close-button" onClick={() => setActionResult(null)}>
            ×
          </button>
        </div>
      )}

      {/* Hibanapló most szélesebb, teljes magasságú */}
      <div className="error-log-container">
        <h3>
          Hibanapló{' '}
          {selectedCategory !== 'all' &&
            `- ${getCategoryDisplayName(selectedCategory as RssErrorCategory)}`}
          {isAdmin && (
            <span className="admin-badge" title="Admin jogosultság">
              👑
            </span>
          )}
          {/* Javítás: Hibák törlése gomb hozzáadása */}
          {errors.length > 0 && (
            <button
              className="clear-errors-button"
              onClick={onClearErrors} // Itt hívjuk meg az onClearErrors függvényt
              title="Az összes hiba törlése a listából"
            >
              Hibák törlése
            </button>
          )}
        </h3>

        {filteredErrors.length === 0 ? (
          <div className="no-errors">Nincsenek hibabejegyzések</div>
        ) : (
          <ul className="error-list">
            {filteredErrors.map((error, index) => (
              <li key={index} className="error-item">
                <div className="error-header">
                  <span className="error-source">{error.sourceName || 'Ismeretlen forrás'}</span>
                  <span className="error-time">
                    {new Date(error.timestamp).toLocaleTimeString()}
                  </span>
                </div>

                <div className="error-message">
                  {typeof error.message === 'string'
                    ? error.message
                    : JSON.stringify(error.message)}
                </div>

                {/* Forrás URL és szerkesztési lehetőségek */}
                {error.sourceUrl && (
                  <div className="error-details source-url-container">
                    {editingSource === error.sourceId ? (
                      // Szerkesztő mező az URL-hez
                      <div className="source-edit-form">
                        <input
                          type="text"
                          value={newSourceUrl}
                          onChange={(e) => setNewSourceUrl(e.target.value)}
                          className="source-url-input"
                          placeholder="Új URL"
                        />
                        <div className="source-edit-actions">
                          <button
                            onClick={saveSourceEdit}
                            disabled={isSubmitting}
                            className="admin-button save"
                          >
                            {isSubmitting ? 'Mentés...' : 'Mentés'}
                          </button>
                          <button onClick={cancelEdit} className="admin-button cancel">
                            Mégse
                          </button>
                        </div>
                      </div>
                    ) : (
                      // URL megjelenítése és admin műveletek
                      <>
                        URL:{' '}
                        <a href={error.sourceUrl} target="_blank" rel="noopener noreferrer">
                          {error.sourceUrl}
                        </a>
                        {/* Admin műveletek */}
                        {isAdmin && error.sourceId && (
                          <div className="admin-actions">
                            <button
                              className="admin-button edit"
                              onClick={() => startEditingSource(error)}
                              title="Forrás URL szerkesztése"
                            >
                              ✏️ Szerkesztés
                            </button>
                            <button
                              className="admin-button delete"
                              onClick={() => handleDeleteSource(error.sourceId!)}
                              disabled={isSubmitting}
                              title="Forrás törlése"
                            >
                              🗑️ Törlés
                            </button>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                )}

                {error.errorDetails && (
                  <div className="error-details">Részletek: {String(error.errorDetails)}</div>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

export default RssErrorView;
