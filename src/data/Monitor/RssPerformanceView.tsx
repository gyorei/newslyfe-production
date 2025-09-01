import React, { useMemo, useState } from 'react';
import { RssSourceStatus, RssMonitorEvent } from './monitor';
import './monitor.css';

// Konstansok a duplikált string literálok elkerülésére
const CSS_CLASSES = {
  SORTABLE_HEADER: 'sortable-header',
  FILTER_BTN: 'filter-btn',
} as const;

interface RssPerformanceViewProps {
  sourceStatuses: RssSourceStatus[];
  events: RssMonitorEvent[];
}

/**
 * RSS források teljesítményének elemzése és megjelenítése
 */
const RssPerformanceView: React.FC<RssPerformanceViewProps> = ({ sourceStatuses, events }) => {
  const [sortBy, setSortBy] = useState<'name' | 'responseTime' | 'itemCount'>('responseTime');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  // ÚJ: szűrő állapot
  const [filterMode, setFilterMode] = useState<'all' | 'slow' | 'errors'>('all');

  // Szűrt források a filterMode alapján
  const filteredSources = useMemo(() => {
    if (filterMode === 'slow') {
      return sourceStatuses.filter((s) => (s.responseTime || 0) > 1000);
    }
    if (filterMode === 'errors') {
      return sourceStatuses.filter((s) => !s.active);
    }
    return sourceStatuses;
  }, [sourceStatuses, filterMode]);

  // Teljesítményadatok összesítése
  const performanceStats = useMemo(() => {
    if (filteredSources.length === 0) return null;
    const responseTimes = filteredSources
      .filter((s) => s.responseTime !== undefined)
      .map((s) => s.responseTime as number);
    if (responseTimes.length === 0) return null;
    const avgResponseTime = Math.round(
      responseTimes.reduce((sum, time) => sum + time, 0) / responseTimes.length,
    );
    const maxResponseTime = Math.max(...responseTimes);
    const minResponseTime = Math.min(...responseTimes);
    const totalItems = filteredSources.reduce((sum, s) => sum + s.itemCount, 0);
    return {
      avgResponseTime,
      maxResponseTime,
      minResponseTime,
      totalItems,
      sourcesWithTiming: responseTimes.length,
    };
  }, [filteredSources]);

  // Rendezett források
  const sortedSources = useMemo(() => {
    return [...filteredSources].sort((a, b) => {
      let comparison = 0;
      if (sortBy === 'responseTime') {
        const aTime = a.responseTime || 0;
        const bTime = b.responseTime || 0;
        comparison = aTime - bTime;
      } else if (sortBy === 'itemCount') {
        comparison = a.itemCount - b.itemCount;
      } else if (sortBy === 'name') {
        comparison = a.source.name.localeCompare(b.source.name);
      }
      return sortOrder === 'asc' ? comparison : -comparison;
    });
  }, [filteredSources, sortBy, sortOrder]);

  // Oszlop fejléc kattintás kezelése
  const handleHeaderClick = (column: 'name' | 'responseTime' | 'itemCount') => {
    if (sortBy === column) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(column);
      setSortOrder(column === 'name' ? 'asc' : 'desc');
    }
  };

  // ÚJ: szűrő UI
  const renderFilterButtons = () => (
    <div className="performance-filter-bar">
      <button
        className={
          filterMode === 'all' ? `${CSS_CLASSES.FILTER_BTN} active` : CSS_CLASSES.FILTER_BTN
        }
        onClick={() => setFilterMode('all')}
      >
        Összes
      </button>
      <button
        className={
          filterMode === 'slow' ? `${CSS_CLASSES.FILTER_BTN} active` : CSS_CLASSES.FILTER_BTN
        }
        onClick={() => setFilterMode('slow')}
      >
        Lassú (&gt; 1000 ms)
      </button>
      <button
        className={
          filterMode === 'errors' ? `${CSS_CLASSES.FILTER_BTN} active` : CSS_CLASSES.FILTER_BTN
        }
        onClick={() => setFilterMode('errors')}
      >
        Hibás
      </button>
    </div>
  );

  return (
    <div className="rss-performance-view">
      {renderFilterButtons()}
      {performanceStats && (
        <div className="performance-stats">
          <div className="perf-stat-item">
            <span className="perf-stat-value">{performanceStats.avgResponseTime} ms</span>
            <span className="perf-stat-label">Átlagos válaszidő</span>
          </div>
          <div className="perf-stat-item">
            <span className="perf-stat-value">{performanceStats.minResponseTime} ms</span>
            <span className="perf-stat-label">Min. válaszidő</span>
          </div>
          <div className="perf-stat-item">
            <span className="perf-stat-value">{performanceStats.maxResponseTime} ms</span>
            <span className="perf-stat-label">Max. válaszidő</span>
          </div>
          <div className="perf-stat-item">
            <span className="perf-stat-value">{performanceStats.totalItems}</span>
            <span className="perf-stat-label">Összes elem</span>
          </div>
        </div>
      )}
      <div className="performance-table-container">
        <table className="performance-table">
          <thead>
            <tr>
              <th onClick={() => handleHeaderClick('name')} className={CSS_CLASSES.SORTABLE_HEADER}>
                Forrás neve
                {sortBy === 'name' && (
                  <span className="sort-indicator">{sortOrder === 'asc' ? '▲' : '▼'}</span>
                )}
              </th>
              <th
                onClick={() => handleHeaderClick('responseTime')}
                className={CSS_CLASSES.SORTABLE_HEADER}
              >
                Válaszidő
                {sortBy === 'responseTime' && (
                  <span className="sort-indicator">{sortOrder === 'asc' ? '▲' : '▼'}</span>
                )}
              </th>
              <th
                onClick={() => handleHeaderClick('itemCount')}
                className={CSS_CLASSES.SORTABLE_HEADER}
              >
                Elemek száma
                {sortBy === 'itemCount' && (
                  <span className="sort-indicator">{sortOrder === 'asc' ? '▲' : '▼'}</span>
                )}
              </th>
              <th>Állapot</th>
            </tr>
          </thead>
          <tbody>
            {sortedSources.map((source) => (
              <tr
                key={source.source.id}
                className={source.responseTime && source.responseTime > 1000 ? 'slow-response' : ''}
              >
                <td>
                  <a href={source.source.url} target="_blank" rel="noopener noreferrer">
                    {source.source.name}
                  </a>
                </td>
                <td className="response-time-cell">
                  {source.responseTime ? (
                    <>
                      <span
                        className={`response-time ${getResponseTimeClass(source.responseTime)}`}
                        style={{ fontWeight: 'bold', fontSize: '1.1em' }}
                      >
                        {source.responseTime} ms
                      </span>
                      <div className="response-time-bar-container">
                        <div
                          className={`response-time-bar ${getResponseTimeClass(source.responseTime)}`}
                          style={{ width: `${Math.min(100, source.responseTime / 20)}%` }}
                        ></div>
                      </div>
                    </>
                  ) : (
                    'N/A'
                  )}
                </td>
                <td>{source.itemCount}</td>
                <td>
                  <span
                    className={`status-badge ${source.active ? 'status-active' : 'status-error'}`}
                  >
                    {source.active ? 'OK' : 'Hiba'}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="performance-events">
        <h3>Teljesítménymérési események</h3>
        {events.length === 0 ? (
          <p className="no-events">Nincsenek teljesítménymérési események</p>
        ) : (
          <ul className="performance-event-list">
            {events.map((event, index) => (
              <li key={index} className="performance-event-item">
                <span className="event-time">{new Date(event.timestamp).toLocaleTimeString()}</span>
                <span className="event-source">{event.sourceName || 'Rendszer'}</span>
                <span className="event-operation">
                  {(event as RssMonitorEvent & { operation?: string }).operation || 'Művelet'}
                </span>
                {(event as RssMonitorEvent & { durationMs?: number }).durationMs !== undefined && (
                  <span
                    className={`event-duration ${getResponseTimeClass((event as RssMonitorEvent & { durationMs: number }).durationMs)}`}
                    style={{ fontWeight: 'bold' }}
                  >
                    {(event as RssMonitorEvent & { durationMs: number }).durationMs} ms
                  </span>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

// Válaszidő színkódolása
function getResponseTimeClass(responseTime: number): string {
  if (responseTime < 500) return 'fast';
  if (responseTime < 1000) return 'medium';
  return 'slow';
}

export default RssPerformanceView;
