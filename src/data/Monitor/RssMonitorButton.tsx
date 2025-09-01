import React from 'react';
import './monitor.css';

interface RssMonitorButtonProps {
  onClick: () => void;
  errorCount: number;
  isMonitorOpen: boolean;
}

/**
 * RSS Monitor gomb a headerben - egyszerűsített verzió külső függőségek nélkül
 */
const RssMonitorButton: React.FC<RssMonitorButtonProps> = ({
  onClick,
  errorCount,
  isMonitorOpen,
}) => {
  // A gomb stílusát a CSS-ben állítjuk be és az állapottól függően módosítjuk
  const buttonClass = `monitor-button ${isMonitorOpen ? 'active' : ''} ${errorCount > 0 ? 'has-error' : ''}`;

  return (
    <button
      className={buttonClass}
      onClick={onClick}
      title={errorCount > 0 ? `RSS Monitor - ${errorCount} hibás forrás` : 'RSS Monitor'}
    >
      <span className="monitor-icon">🔔</span>
      {errorCount > 0 && <span className="monitor-badge">{errorCount}</span>}
    </button>
  );
};

export default RssMonitorButton;
