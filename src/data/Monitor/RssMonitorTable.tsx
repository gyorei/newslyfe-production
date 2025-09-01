import React from 'react';
import { RssSourceStatus, MonitorTab } from './monitor';
import './monitor.css';

interface RssMonitorTableProps {
  sourceStatuses: RssSourceStatus[];
  loading: boolean;
  activeTab: MonitorTab;
  onRefreshSource: (sourceId: string) => void;
}

/**
 * Egyszerű komponens az RSS források megjelenítésére külső függőségek nélkül
 */
const RssMonitorTable: React.FC<RssMonitorTableProps> = ({
  sourceStatuses,
  loading,
  activeTab,
  onRefreshSource,
}) => {
  // Szűrés a kiválasztott tab alapján
  const filteredSources = sourceStatuses.filter((status) => {
    if (activeTab === MonitorTab.ACTIVE) return status.active;
    if (activeTab === MonitorTab.INACTIVE) return !status.active;
    return true; // MonitorTab.ALL esetén
  });

  if (loading) {
    return <div className="monitor-loading">Források betöltése...</div>;
  }

  return (
    <div className="monitor-table-container">
      <table className="monitor-table">
        <thead>
          <tr>
            <th>Állapot</th>
            <th>Név</th>
            <th>Ország</th>
            <th>Fontosság</th>
            <th>Elemek</th>
            <th>Válaszidő</th>
            <th>Hiba</th>
            <th>Művelet</th>
          </tr>
        </thead>
        <tbody>
          {filteredSources.length === 0 ? (
            <tr>
              <td colSpan={8} className="monitor-no-data">
                Nincs megjeleníthető forrás
              </td>
            </tr>
          ) : (
            filteredSources.map((source) => (
              <tr
                key={source.source.id}
                className={source.active ? 'source-active' : 'source-error'}
              >
                <td>
                  <span
                    className={`status-badge ${source.active ? 'status-active' : 'status-error'}`}
                  >
                    {source.active ? 'Aktív' : 'Hibás'}
                  </span>
                </td>
                <td>
                  <a
                    href={source.source.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    title="Forrás megnyitása"
                  >
                    {source.source.name}
                  </a>
                </td>
                <td>{source.source.country || '-'}</td>
                <td>
                  <span className={`importance importance-${source.source.fontossag || 0}`}>
                    {source.source.fontossag === 1
                      ? 'Kritikus'
                      : source.source.fontossag === 2
                        ? 'Standard'
                        : source.source.fontossag === 4
                          ? 'Opcionális'
                          : 'Ismeretlen'}
                    {source.source.fontossag ? ` (${source.source.fontossag})` : ''}
                  </span>
                </td>
                <td>{source.itemCount}</td>
                <td>{source.responseTime ? `${source.responseTime} ms` : '-'}</td>
                <td>
                  <div className="error-message" title={source.error || 'Nincs hiba'}>
                    {source.error ? `${source.error.substring(0, 30)}...` : 'Nincs hiba'}
                  </div>
                </td>
                <td>
                  <button
                    className="refresh-button"
                    onClick={() => onRefreshSource(source.source.id)}
                    title="Forrás újraellenőrzése"
                  >
                    🔄
                  </button>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
      <div className="monitor-pagination">
        <span>Összesen: {filteredSources.length} forrás</span>
      </div>
    </div>
  );
};

export default RssMonitorTable;
