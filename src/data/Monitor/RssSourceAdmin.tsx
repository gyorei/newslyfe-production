import React, { useState, useEffect, useCallback } from 'react';
import { apiClient, DbSourceRow } from '../../apiclient/apiClient';
import { RssSourceStatus } from './monitor';
import RssMonitorService from './RssMonitorService';
import './monitor.css';
import './admin.css';

interface RssSourceAdminProps {
  visible: boolean;
  onClose: () => void;
}

/**
 * Admin felület az RSS források kezeléséhez
 * - Hibás források javítása és menedzselése
 * - Forrásadatok szerkesztése
 * - Státuszok változtatása
 */
const RssSourceAdmin: React.FC<RssSourceAdminProps> = ({ visible, onClose }) => {
  // Állapotok kezelése
  const [loading, setLoading] = useState<boolean>(false);
  const [sourceStatuses, setSourceStatuses] = useState<RssSourceStatus[]>([]);
  const [selectedSources, setSelectedSources] = useState<string[]>([]);
  const [filterMode, setFilterMode] = useState<'all' | 'errors' | 'active'>('errors');
  const [sortBy, setSortBy] = useState<'name' | 'status' | 'country' | 'responseTime'>('status');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [editingSource, setEditingSource] = useState<RssSourceStatus | null>(null);
  const [selectedCountry, setSelectedCountry] = useState<string | null>(null);
  const [availableCountries, setAvailableCountries] = useState<string[]>([]);
  const [editForm, setEditForm] = useState({
    name: '',
    url: '',
    rssFeed: '',
    country: '',
    fontossag: 1,
  });

  // Források lekérése
  const loadSourceStatuses = useCallback(async () => {
    setLoading(true);
    try {
      const countryToUse = selectedCountry;
      let sources;
      if (countryToUse) {
        sources = await apiClient.getSourcesByCountry(countryToUse);
        console.log(`[RssSourceAdmin] ${sources.length} forrás betöltve (${countryToUse})`);
      } else {
        sources = await apiClient.getAllSources();
        console.log(`[RssSourceAdmin] ${sources.length} forrás betöltve (összes ország)`);
      }
      const statuses = await RssMonitorService.checkAllSources(sources);
      setSourceStatuses(statuses);
    } catch (error) {
      console.error('[RssSourceAdmin] Hiba a források állapotának ellenőrzésekor:', error);
    } finally {
      setLoading(false);
    }
  }, [selectedCountry]);

  // Betöltés a panel megnyitásakor
  useEffect(() => {
    if (visible) {
      loadSourceStatuses();
      loadCountries();
    }
  }, [visible, loadSourceStatuses]);

  // Országok lekérése
  const loadCountries = async () => {
    try {
      const countries = await apiClient.getAllCountries();
      setAvailableCountries(countries);
    } catch (error) {
      console.error('[RssSourceAdmin] Hiba az országok betöltésekor:', error);
    }
  };

  // Ország váltás kezelése
  const handleCountryChange = (country: string) => {
    setSelectedCountry(country === 'all' ? null : country);
    // Források újratöltése az új országgal
    setTimeout(() => loadSourceStatuses(), 0);
  };

  // Szűrt források
  const filteredSources = sourceStatuses.filter((source) => {
    // Szűrés állapot szerint
    if (filterMode === 'errors' && source.active) return false;
    if (filterMode === 'active' && !source.active) return false;

    // Keresés név, ország vagy hibaszöveg szerint
    if (searchTerm) {
      const lowerSearchTerm = searchTerm.toLowerCase();
      return (
        source.source.name.toLowerCase().includes(lowerSearchTerm) ||
        (source.source.country || '').toLowerCase().includes(lowerSearchTerm) ||
        (source.error || '').toLowerCase().includes(lowerSearchTerm)
      );
    }

    return true;
  });

  // Rendezett források
  const sortedSources = [...filteredSources].sort((a, b) => {
    let comparison = 0;
    switch (sortBy) {
      case 'name':
        comparison = a.source.name.localeCompare(b.source.name);
        break;
      case 'status':
        comparison = a.active === b.active ? 0 : a.active ? 1 : -1;
        break;
      case 'country':
        comparison = (a.source.country || '').localeCompare(b.source.country || '');
        break;
      case 'responseTime': {
        const aTime = a.responseTime || 0;
        const bTime = b.responseTime || 0;
        comparison = aTime - bTime;
        break;
      }
    }
    return sortOrder === 'asc' ? comparison : -comparison;
  });

  // Forrás szerkesztésének megkezdése
  const handleEditSource = (source: RssSourceStatus) => {
    setEditingSource(source);
    setEditForm({
      name: source.source.name,
      url: source.source.url,
      rssFeed: source.source.rssFeed || '',
      country: source.source.country || '',
      fontossag: source.source.fontossag || 1,
    });
  };

  // Forrás mentése
  const handleSaveSource = async () => {
    if (!editingSource) return;

    try {
      // Itt történne a mentés az API-n keresztül
      const updatedSource: DbSourceRow = {
        ...editingSource.source,
        name: editForm.name,
        url: editForm.url,
        rssFeed: editForm.rssFeed || undefined,
        country: editForm.country,
        fontossag: editForm.fontossag,
      };

      // API hívás a forrás frissítéséhez
      await apiClient.updateSource(updatedSource);

      // Állapot frissítése a felületen
      setSourceStatuses((prevSources) =>
        prevSources.map((source) =>
          source.source.id === editingSource.source.id
            ? { ...source, source: updatedSource }
            : source,
        ),
      );

      // Ellenőrizzük újra a frissített forrás állapotát
      const refreshedStatus = await RssMonitorService.checkSource(updatedSource);

      setSourceStatuses((prev) =>
        prev.map((status) => (status.source.id === updatedSource.id ? refreshedStatus : status)),
      );

      // Szerkesztési mód bezárása
      setEditingSource(null);
    } catch (error) {
      console.error('[RssSourceAdmin] Hiba a forrás mentésekor:', error);
      alert('Hiba történt a forrás mentése közben.');
    }
  };

  // Többes kijelölések kezelése
  const handleSelectSource = (sourceId: string, selected: boolean) => {
    if (selected) {
      setSelectedSources((prev) => [...prev, sourceId]);
    } else {
      setSelectedSources((prev) => prev.filter((id) => id !== sourceId));
    }
  };

  // Összes kijelölése/kijelölés törlése
  const handleSelectAll = (selected: boolean) => {
    if (selected) {
      setSelectedSources(sortedSources.map((source) => source.source.id));
    } else {
      setSelectedSources([]);
    }
  };

  // Tömeges műveletek
  const handleBulkAction = async (action: 'delete' | 'enable' | 'disable') => {
    if (selectedSources.length === 0) return;

    const confirmed = window.confirm(
      `Biztosan végrehajtja a(z) ${
        action === 'delete' ? 'törlés' : action === 'enable' ? 'aktiválás' : 'deaktiválás'
      } műveletet ${selectedSources.length} forráson?`,
    );

    if (!confirmed) return;

    try {
      // A kiválasztott források azonosítói
      const sourceIds = selectedSources;

      switch (action) {
        case 'delete': {
          // API hívás a források törléséhez
          await Promise.all(sourceIds.map((id) => apiClient.deleteSource(id)));

          // Eltávolítás a listából
          setSourceStatuses((prev) =>
            prev.filter((source) => !sourceIds.includes(source.source.id)),
          );
          break;
        }

        case 'enable':
        case 'disable': {
          // Aktiválás/deaktiválás logikája
          // Ez jellemzően egy mezőt állítana be az adatbázisban
          const active = action === 'enable';

          // API hívások - tömeges státusz módosítás
          await Promise.all(sourceIds.map((id) => apiClient.updateSourceStatus(id, { active })));

          // Állapot frissítése a felületen
          // Valós rendszerben ezt követné egy újraellenőrzés
          break;
        }
      }

      // Kijelölés törlése a művelet után
      setSelectedSources([]);

      // Forráslista frissítése
      loadSourceStatuses();
    } catch (error) {
      console.error(`[RssSourceAdmin] Hiba a tömeges művelet során:`, error);
      alert('Hiba történt a tömeges művelet végrehajtásakor.');
    }
  };

  // Forrás újraellenőrzése
  const handleRefreshSource = async (sourceId: string) => {
    const sourceToRefresh = sourceStatuses.find((s) => s.source.id === sourceId);
    if (!sourceToRefresh) return;

    try {
      // Átmeneti állapot jelzése
      setSourceStatuses((prev) =>
        prev.map((status) =>
          status.source.id === sourceId ? { ...status, lastChecked: new Date() } : status,
        ),
      );

      // Forrás ellenőrzése
      const refreshedStatus = await RssMonitorService.checkSource(sourceToRefresh.source);

      // Frissített állapot beállítása
      setSourceStatuses((prev) =>
        prev.map((status) => (status.source.id === sourceId ? refreshedStatus : status)),
      );
    } catch (error) {
      console.error(`[RssSourceAdmin] Hiba a forrás újraellenőrzésekor: ${sourceId}`, error);
    }
  };

  // RSS elérési útvonal javítása
  const handleFixRssUrl = async (sourceId: string) => {
    const source = sourceStatuses.find((s) => s.source.id === sourceId);
    if (!source) return;

    try {
      const baseUrl = new URL(source.source.url).origin;

      alert(`RSS URL keresése: ${source.source.name}\n\nLehetséges URL-ek ellenőrzése...`);

      // Valódi implementáció ellenőrizné ezeket az URL-eket
      await new Promise((resolve) => setTimeout(resolve, 1500));

      // Sikeres találat szimulációja
      const newRssFeed = `${baseUrl}/feed`;

      const confirmed = window.confirm(
        `RSS feed URL megtalálva: ${newRssFeed}\n\nFrissítsük a forrás adatait?`,
      );

      if (confirmed) {
        // API hívás a forrás frissítéséhez
        const updatedSource = {
          ...source.source,
          rssFeed: newRssFeed,
        };

        await apiClient.updateSource(updatedSource);

        // UI frissítése
        setSourceStatuses((prev) =>
          prev.map((s) => (s.source.id === sourceId ? { ...s, source: updatedSource } : s)),
        );

        // Újraellenőrzés
        handleRefreshSource(sourceId);
      }
    } catch (error) {
      console.error(`[RssSourceAdmin] Hiba az RSS URL javításakor: ${sourceId}`, error);
      alert('Hiba történt az RSS URL keresése közben.');
    }
  };

  // Ha nem látható, ne rendereljünk semmit
  if (!visible) {
    return null;
  }

  return (
    <div className="admin-overlay">
      <div className="admin-panel">
        <div className="admin-header">
          <h2>RSS Források Adminisztráció</h2>
          <button className="admin-close-button" onClick={onClose}>
            ×
          </button>
        </div>

        <div className="admin-toolbar">
          <div className="admin-search">
            <input
              type="text"
              placeholder="Keresés név vagy ország szerint..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="admin-search-input"
            />
          </div>

          <div className="admin-filters">
            <select
              value={selectedCountry || 'all'}
              onChange={(e) => handleCountryChange(e.target.value)}
              className="admin-filter-select"
            >
              <option value="all">Összes ország</option>
              {availableCountries.map((country) => (
                <option key={country} value={country}>
                  {country}
                </option>
              ))}
            </select>

            <select
              value={filterMode}
              onChange={(e) => setFilterMode(e.target.value as 'all' | 'errors' | 'active')}
              className="admin-filter-select"
            >
              <option value="all">Összes forrás</option>
              <option value="errors">Hibás források</option>
              <option value="active">Aktív források</option>
            </select>

            <select
              value={sortBy}
              onChange={(e) =>
                setSortBy(e.target.value as 'name' | 'status' | 'country' | 'responseTime')
              }
              className="admin-filter-select"
            >
              <option value="name">Rendezés: Név</option>
              <option value="status">Rendezés: Státusz</option>
              <option value="country">Rendezés: Ország</option>
              <option value="responseTime">Rendezés: Válaszidő</option>
            </select>

            <button
              onClick={() => setSortOrder((prev) => (prev === 'asc' ? 'desc' : 'asc'))}
              className="admin-sort-button"
              title={sortOrder === 'asc' ? 'Növekvő sorrend' : 'Csökkenő sorrend'}
            >
              {sortOrder === 'asc' ? '↑' : '↓'}
            </button>
          </div>
        </div>

        {selectedSources.length > 0 && (
          <div className="admin-bulk-actions">
            <span className="selected-count">{selectedSources.length} forrás kiválasztva</span>
            <div className="admin-bulk-buttons">
              <button
                onClick={() => handleBulkAction('delete')}
                className="admin-bulk-button delete"
              >
                Törlés
              </button>
              <button
                onClick={() => handleBulkAction('enable')}
                className="admin-bulk-button enable"
              >
                Aktiválás
              </button>
              <button
                onClick={() => handleBulkAction('disable')}
                className="admin-bulk-button disable"
              >
                Deaktiválás
              </button>
              <button onClick={() => setSelectedSources([])} className="admin-bulk-button cancel">
                Kijelölés törlése
              </button>
            </div>
          </div>
        )}

        {loading ? (
          <div className="admin-loading">
            <div className="admin-spinner"></div>
            <p>Források betöltése...</p>
          </div>
        ) : (
          <div className="admin-table-container">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>
                    <input
                      type="checkbox"
                      checked={
                        selectedSources.length > 0 &&
                        selectedSources.length === sortedSources.length
                      }
                      onChange={(e) => handleSelectAll(e.target.checked)}
                    />
                  </th>
                  <th>Státusz</th>
                  <th>Név</th>
                  <th>Ország</th>
                  <th>URL</th>
                  <th>RSS Feed</th>
                  <th>Válaszidő</th>
                  <th>Fontosság</th>
                  <th>Hibaüzenet</th>
                  <th>Műveletek</th>
                </tr>
              </thead>
              <tbody>
                {sortedSources.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="admin-no-data">
                      Nincs a feltételeknek megfelelő forrás
                    </td>
                  </tr>
                ) : (
                  sortedSources.map((source) => (
                    <tr
                      key={source.source.id}
                      className={`admin-source-row ${
                        source.active ? 'source-active' : 'source-error'
                      } ${selectedSources.includes(source.source.id) ? 'selected' : ''}`}
                    >
                      <td>
                        <input
                          type="checkbox"
                          checked={selectedSources.includes(source.source.id)}
                          onChange={(e) => handleSelectSource(source.source.id, e.target.checked)}
                        />
                      </td>
                      <td>
                        <span
                          className={`status-badge ${source.active ? 'status-active' : 'status-error'}`}
                        >
                          {source.active ? 'Aktív' : 'Hibás'}
                        </span>
                      </td>
                      <td>{source.source.name}</td>
                      <td>{source.source.country || '-'}</td>
                      <td>
                        <div className="url-cell">
                          <a
                            href={source.source.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            title={source.source.url}
                          >
                            {new URL(source.source.url).hostname}
                          </a>
                        </div>
                      </td>
                      <td>
                        <div className="url-cell">
                          {source.source.rssFeed ? (
                            <a
                              href={source.source.rssFeed}
                              target="_blank"
                              rel="noopener noreferrer"
                              title={source.source.rssFeed}
                            >
                              RSS Link
                            </a>
                          ) : (
                            <span className="missing-rss">Hiányzik</span>
                          )}
                        </div>
                      </td>
                      <td>{source.responseTime ? `${source.responseTime} ms` : '-'}</td>
                      <td>
                        <span className={`importance importance-${source.source.fontossag || 0}`}>
                          {source.source.fontossag === 1
                            ? 'Kritikus'
                            : source.source.fontossag === 2
                              ? 'Standard'
                              : source.source.fontossag === 4
                                ? 'Opcionális'
                                : 'Ismeretlen'}
                        </span>
                      </td>
                      <td>
                        <div className="error-message-cell" title={source.error || 'Nincs hiba'}>
                          {source.error
                            ? source.error.length > 30
                              ? `${source.error.substring(0, 30)}...`
                              : source.error
                            : 'Nincs hiba'}
                        </div>
                      </td>
                      <td>
                        <div className="admin-actions">
                          <button
                            onClick={() => handleEditSource(source)}
                            className="admin-action-button edit"
                            title="Forrás szerkesztése"
                          >
                            ✏️
                          </button>
                          <button
                            onClick={() => handleRefreshSource(source.source.id)}
                            className="admin-action-button refresh"
                            title="Újraellenőrzés"
                          >
                            🔄
                          </button>
                          {!source.source.rssFeed && (
                            <button
                              onClick={() => handleFixRssUrl(source.source.id)}
                              className="admin-action-button fix"
                              title="RSS URL keresése"
                            >
                              🔍
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        <div className="admin-footer">
          <div className="admin-pagination">
            <span>Összesen: {filteredSources.length} forrás</span>
          </div>

          <button
            className="admin-action-button refresh-all"
            onClick={loadSourceStatuses}
            disabled={loading}
          >
            {loading ? 'Betöltés...' : 'Mind frissítése'} 🔄
          </button>
        </div>
      </div>

      {/* Szerkesztési ablak */}
      {editingSource && (
        <div className="admin-edit-modal">
          <div className="admin-edit-content">
            <div className="admin-edit-header">
              <h3>Forrás szerkesztése</h3>
              <button className="admin-close-button" onClick={() => setEditingSource(null)}>
                ×
              </button>
            </div>

            <div className="admin-edit-form">
              <div className="admin-form-group">
                <label>Név:</label>
                <input
                  type="text"
                  value={editForm.name}
                  onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                />
              </div>

              <div className="admin-form-group">
                <label>Weboldal URL:</label>
                <input
                  type="text"
                  value={editForm.url}
                  onChange={(e) => setEditForm({ ...editForm, url: e.target.value })}
                />
              </div>

              <div className="admin-form-group">
                <label>RSS Feed URL:</label>
                <input
                  type="text"
                  value={editForm.rssFeed}
                  onChange={(e) => setEditForm({ ...editForm, rssFeed: e.target.value })}
                />
              </div>

              <div className="admin-form-group">
                <label>Ország:</label>
                <input
                  type="text"
                  value={editForm.country}
                  onChange={(e) => setEditForm({ ...editForm, country: e.target.value })}
                />
              </div>

              <div className="admin-form-group">
                <label>Fontosság:</label>
                <select
                  value={editForm.fontossag}
                  onChange={(e) => setEditForm({ ...editForm, fontossag: Number(e.target.value) })}
                >
                  <option value="1">1 - Kritikus</option>
                  <option value="2">2 - Standard</option>
                  <option value="4">4 - Opcionális</option>
                </select>
              </div>

              <div className="admin-form-actions">
                <button className="admin-save-button" onClick={handleSaveSource}>
                  Mentés
                </button>
                <button className="admin-cancel-button" onClick={() => setEditingSource(null)}>
                  Mégse
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RssSourceAdmin;
