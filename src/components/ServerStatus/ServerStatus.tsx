import React from 'react';
import { useServerHealth } from '../../hooks/useServerHealth';
import './ServerStatus.css';

export const ServerStatus: React.FC = () => {
  const { isReady, isChecking, error, retry } = useServerHealth();

  // Teszt gomb kezelése
  // const toggleTestMode = () => {
  //   const currentTestMode = localStorage.getItem('test-slow-server') === 'true';
  //   localStorage.setItem('test-slow-server', (!currentTestMode).toString());
  //   window.location.reload(); // Oldal újratöltése a teszt mód alkalmazásához
  // };

  // Ha a szerver kész, csak a teszt gomb jelenjen meg (fejlesztés során)
  // if (isReady) {
  //   return (
  //     <div className="server-status-test">
  //       <button onClick={toggleTestMode} className="server-status-test-button">
  //         {localStorage.getItem('test-slow-server') === 'true' ? 'Kikapcsolás' : 'Lassú szerver teszt'}
  //       </button>
  //     </div>
  //   );
  // }

  return (
    <div className="server-status">
      {isChecking ? (
        <div className="server-status-loading">
          <div className="server-status-spinner"></div>
          <span>Szerver indítása...</span>
        </div>
      ) : error ? (
        <div className="server-status-error">
          <span>⚠️ {error}</span>
          <button onClick={retry} className="server-status-retry">
            Újrapróbálkozás
          </button>
        </div>
      ) : null}
    </div>
  );
};