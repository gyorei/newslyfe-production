import React, { useState, useEffect, useCallback } from 'react';
import { apiClient } from '../../apiclient/apiClient';
import { RssSourceStatus, MonitorTab, RssMonitorEvent } from './monitor';
import RssMonitorTable from './RssMonitorTable';
import RssMonitorService from './RssMonitorService';
import RssErrorView from './RssErrorView';
import RssPerformanceView from './RssPerformanceView';
import { localLocationService } from '../../components/LocalNews/Location';
import './monitor.css';

interface RssMonitorPanelProps {
  visible: boolean;
  onClose: () => void;
  onErrorCountChange?: (count: number) => void;
}

// Típus definíció a monitoring statisztikákhoz
interface MonitoringStats {
  cacheEntries: number;
  totalErrorCount: number;
  errorsByCategory: Record<string, number>;
}

/**
 * Fejlett monitor panel, amely különböző nézeteket biztosít a monitorozási adatok megjelenítéséhez
 */
const RssMonitorPanel: React.FC<RssMonitorPanelProps> = ({
  visible,
  onClose,
  onErrorCountChange,
}) => {
  const [loading, setLoading] = useState<boolean>(false);
  const [sourceStatuses, setSourceStatuses] = useState<RssSourceStatus[]>([]);
  const [activeTab, setActiveTab] = useState<MonitorTab>(MonitorTab.ACTIVE);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);
  const [monitoringStats, setMonitoringStats] = useState<MonitoringStats | null>(null);
  const [errors, setErrors] = useState<RssMonitorEvent[]>([]);
  const [events, setEvents] = useState<RssMonitorEvent[]>([]);
  const [progress, setProgress] = useState<{
    current: number;
    total: number;
    message: string;
  } | null>(null);
  const [selectedCountry, setSelectedCountry] = useState<string | null>(null);
  const [availableCountries, setAvailableCountries] = useState<string[]>([]);

  // Monitorozási statisztikák frissítése - useCallback használatával
  const updateMonitoringStats = useCallback(() => {
    const stats = RssMonitorService.getMonitoringStatistics();
    setMonitoringStats(stats);
  }, []);

  // Országok lekérése
  const loadCountries = useCallback(async () => {
    try {
      const countries = await apiClient.getAllCountries();
      setAvailableCountries(countries);
    } catch (error) {
      console.error('[RssMonitorPanel] Hiba az országok betöltésekor:', error);
    }
  }, []);

  // Források lekérése és ellenőrzése a RssMonitorService-szel
  const loadSourceStatuses = useCallback(async () => {
    setLoading(true);
    setProgress({ current: 0, total: 1, message: 'Helymeghatározás...' });

    try {
      let countryToUse = selectedCountry;

      // Ha nincs kiválasztott ország, akkor használjuk a felhasználó helyét
      if (!countryToUse) {
        const location = await localLocationService.getLocation();
        countryToUse = location.country;
        console.log(`[RssMonitorPanel] Felhasználó országa: ${countryToUse}`);
      }

      setProgress({ current: 0, total: 1, message: `Források betöltése (${countryToUse})...` });

      // Csak a kiválasztott ország forrásait töltjük be
      const countrySources = await apiClient.getSourcesByCountry(countryToUse);
      console.log(
        `[RssMonitorPanel] ${countrySources.length} forrás betöltve, ellenőrzés kezdése...`,
      );

      // RssMonitorService használata az országspecifikus források ellenőrzésére
      const statuses = await RssMonitorService.checkAllSources(countrySources);
      setSourceStatuses(statuses);
      setLastRefresh(new Date());
    } catch (error) {
      console.error('[RssMonitorPanel] Hiba a források állapotának ellenőrzésekor:', error);
    } finally {
      setLoading(false);
      setProgress(null);
    }
  }, [selectedCountry]);

  // Betöltés a panel megnyitásakor
  useEffect(() => {
    if (visible) {
      loadSourceStatuses();
      updateMonitoringStats();
      loadCountries();
    }
  }, [visible, loadSourceStatuses, updateMonitoringStats, loadCountries]);

  // Feliratkozás a monitoring eseményekre
  useEffect(() => {
    if (!visible) return;
    // Feliratkozások létrehozása
    const errorUnsubscribe = RssMonitorService.subscribe('error', (event: RssMonitorEvent) => {
      setErrors((prev) => [event, ...prev.slice(0, 99)]); // Max 100 hibát tároljunk
    });
    const batchProgressUnsubscribe = RssMonitorService.subscribe(
      'batch-progress',
      (event: RssMonitorEvent) => {
        setProgress({
          current: typeof event.currentBatch === 'number' ? event.currentBatch : 0,
          total: typeof event.totalBatches === 'number' ? event.totalBatches : 1,
          message: event.message || 'Feldolgozás...',
        });
      },
    );
    const batchEndUnsubscribe = RssMonitorService.subscribe(
      'batch-end',
      (_event: RssMonitorEvent) => {
        setProgress(null);
        updateMonitoringStats();
      },
    );
    const eventTypesToCapture: RssMonitorEvent['type'][] = [
      'check-start',
      'check-end',
      'error',
      'warning',
      'performance',
    ];
    // Általános eseménynaplóhoz feliratkozások
    const eventUnsubscribes = eventTypesToCapture.map((eventType) =>
      RssMonitorService.subscribe(eventType, (event: RssMonitorEvent) => {
        setEvents((prev) => [event, ...prev.slice(0, 49)]); // Max 50 eseményt tároljunk
      }),
    );
    // Leiratkozás komponens unmount esetén
    return () => {
      errorUnsubscribe();
      batchProgressUnsubscribe();
      batchEndUnsubscribe();
      eventUnsubscribes.forEach((unsubscribe) => unsubscribe());
    };
  }, [visible, updateMonitoringStats]); // updateMonitoringStats dependency hozzáadva

  // Hibás források számának átadása a szülő komponensnek
  useEffect(() => {
    const errorCount = sourceStatuses.filter((s) => !s.active).length;
    if (onErrorCountChange) {
      onErrorCountChange(errorCount);
    }
  }, [sourceStatuses, onErrorCountChange]);

  // Egyetlen forrás újraellenőrzése
  const handleRefreshSource = async (sourceId: string) => {
    const sourceToRefresh = sourceStatuses.find((s) => s.source.id === sourceId);
    if (!sourceToRefresh) return;

    try {
      // Átmeneti állapot jelzése a felhasználónak
      setSourceStatuses((prev) =>
        prev.map((status) =>
          status.source.id === sourceId ? { ...status, lastChecked: new Date() } : status,
        ),
      );

      // Forrás ellenőrzése a RssMonitorService-szel
      const refreshedStatus = await RssMonitorService.checkSource(sourceToRefresh.source);

      // Frissített állapot beállítása
      setSourceStatuses((prev) =>
        prev.map((status) => (status.source.id === sourceId ? refreshedStatus : status)),
      );

      updateMonitoringStats();
    } catch (error) {
      console.error(`[RssMonitorPanel] Hiba a forrás újraellenőrzésekor: ${sourceId}`, error);
    }
  };

  // Tab váltás kezelése
  const handleTabChange = (newTab: MonitorTab) => {
    setActiveTab(newTab);

    // Ha hibafülre váltunk, frissítsük a hibalistát
    if (newTab === MonitorTab.ERRORS) {
      setErrors(RssMonitorService.getAllErrors());
    }
  };

  // Ország váltás kezelése
  const handleCountryChange = (country: string) => {
    setSelectedCountry(country);
    // Források újratöltése az új országgal
    setTimeout(() => loadSourceStatuses(), 0);
  };

  // Cache törlése
  const handleClearCache = () => {
    RssMonitorService.clearCache();
    updateMonitoringStats();
  };

  // Hibanaplók törlése
  const handleClearErrorLogs = () => {
    RssMonitorService.clearErrorLogs();
    setErrors([]);
    updateMonitoringStats();
  };

  // Számoljuk ki a statisztikákat
  const activeSources = sourceStatuses.filter((s) => s.active).length;
  const inactiveSources = sourceStatuses.filter((s) => !s.active).length;
  const totalSources = sourceStatuses.length;

  // Panel bezárása
  const handleClose = () => {
    onClose();
  };

  // Ha nem látható, ne rendereljünk semmit
  if (!visible) {
    return null;
  }

  return (
    <div className="monitor-overlay">
      <div className="monitor-panel">
        <div className="monitor-header">
          <h2>RSS Források Monitor</h2>
          <button className="monitor-close-button" onClick={handleClose}>
            ×
          </button>
        </div>

        <div className="monitor-content">
          {/* Bal oldali vezérlőpanel */}
          <div className="monitor-control-panel">
            {/* Országválasztó hozzáadása */}
            <div className="country-selector">
              <label>Ország:</label>
              <select
                value={selectedCountry || ''}
                onChange={(e) => handleCountryChange(e.target.value)}
                className="country-select"
              >
                <option value="">-- Automatikus (helymeghatározás) --</option>
                {availableCountries.map((country) => (
                  <option key={country} value={country}>
                    {country}
                  </option>
                ))}
              </select>
            </div>

            {/* Statisztikák */}
            <div className="monitor-stats">
              <div className="stat-item">
                <span className="stat-value">{totalSources}</span>
                <span className="stat-label">Összes</span>
              </div>
              <div className="stat-item stat-active">
                <span className="stat-value">{activeSources}</span>
                <span className="stat-label">Aktív</span>
              </div>
              <div className="stat-item stat-error">
                <span className="stat-value">{inactiveSources}</span>
                <span className="stat-label">Hibás</span>
              </div>

              {/* Extra statisztikák */}
              {monitoringStats && (
                <>
                  <div className="stat-item stat-cache">
                    <span className="stat-value">{monitoringStats.cacheEntries}</span>
                    <span className="stat-label">Cache</span>
                  </div>
                  <div className="stat-item stat-events">
                    <span className="stat-value">{monitoringStats.totalErrorCount}</span>
                    <span className="stat-label">Hibák</span>
                  </div>
                </>
              )}
            </div>

            {/* Folyamatjelző */}
            {progress && (
              <div className="monitor-progress">
                <div className="progress-bar">
                  <div
                    className="progress-fill"
                    style={{ width: `${(progress.current / progress.total) * 100}%` }}
                  ></div>
                </div>
                <span className="progress-text">{progress.message}</span>
              </div>
            )}

            {/* Utolsó frissítés */}
            {lastRefresh && (
              <div className="monitor-last-refresh">
                Utolsó frissítés: {lastRefresh.toLocaleTimeString()}
              </div>
            )}

            {/* Tab panelek */}
            <div className="monitor-tabs">
              <button
                className={`tab-button ${activeTab === MonitorTab.ACTIVE ? 'active' : ''}`}
                onClick={() => handleTabChange(MonitorTab.ACTIVE)}
              >
                Aktív források
              </button>
              <button
                className={`tab-button ${activeTab === MonitorTab.INACTIVE ? 'active' : ''}`}
                onClick={() => handleTabChange(MonitorTab.INACTIVE)}
              >
                Hibás források
                {inactiveSources > 0 && <span className="tab-badge">{inactiveSources}</span>}
              </button>
              <button
                className={`tab-button ${activeTab === MonitorTab.ALL ? 'active' : ''}`}
                onClick={() => handleTabChange(MonitorTab.ALL)}
              >
                Összes forrás
              </button>
              <button
                className={`tab-button ${activeTab === MonitorTab.ERRORS ? 'active' : ''}`}
                onClick={() => handleTabChange(MonitorTab.ERRORS)}
              >
                Hibanapló
                {errors.length > 0 && <span className="tab-badge">{errors.length}</span>}
              </button>
              <button
                className={`tab-button ${activeTab === MonitorTab.PERFORMANCE ? 'active' : ''}`}
                onClick={() => handleTabChange(MonitorTab.PERFORMANCE)}
              >
                Teljesítmény
              </button>
            </div>

            {/* Műveleti gombok */}
            <div className="monitor-actions">
              <button
                className="action-button refresh-all-button"
                onClick={loadSourceStatuses}
                disabled={loading}
              >
                {loading ? 'Betöltés...' : 'Összes frissítése'} 🔄
              </button>

              <button
                className="action-button clear-cache-button"
                onClick={handleClearCache}
                title="Cache törlése"
              >
                Cache törlése 🗑️
              </button>

              <button
                className="action-button clear-errors-button"
                onClick={handleClearErrorLogs}
                title="Hibanaplók törlése"
              >
                Hibanaplók törlése 🗑️
              </button>
            </div>
          </div>

          {/* Jobb oldali adatpanel */}
          <div className="monitor-data-panel">
            {/* Aktív nézet megjelenítése */}
            {(activeTab === MonitorTab.ACTIVE ||
              activeTab === MonitorTab.INACTIVE ||
              activeTab === MonitorTab.ALL) && (
              <RssMonitorTable
                sourceStatuses={sourceStatuses}
                loading={loading}
                activeTab={activeTab}
                onRefreshSource={handleRefreshSource}
              />
            )}

            {/* Hiba nézet */}
            {activeTab === MonitorTab.ERRORS && (
              <RssErrorView errors={errors} onClearErrors={handleClearErrorLogs} />
            )}

            {/* Teljesítmény nézet */}
            {activeTab === MonitorTab.PERFORMANCE && (
              <RssPerformanceView
                sourceStatuses={sourceStatuses}
                events={events.filter((e) => e.type === 'performance')}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default RssMonitorPanel;
