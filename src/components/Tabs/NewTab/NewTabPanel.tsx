/*
import * as React from 'react';
import { useState } from 'react';
import styles from './NewTab.module.css';
import { detectGeoQuery } from './geo/GeoMatcher';
import { useSimpleGeoSearch } from './geo/useSimpleGeoSearch';
import { NewsItem } from '../../../types';
import { HistoryPanel } from '../../History';

interface NewTabPanelProps {
  title: string;
  onConfigChange?: (mode: 'news' | 'browse' | 'search') => void;
  onRegionSelect?: (region: string, type: 'country' | 'continent' | 'region') => void;
  // ✅ ÚJ: Single Tab Mode callback
  onSearchComplete?: (results: NewsItem[], query: string, geoResult: any) => void; // ✅ 3. Három paraméter
}

/**
 * NewTabPanel komponens - ✅ ÚJ: Single Tab Mode támogatással
 * Keresés után ELTŰNIK, helyette Panel jelenik meg (Google-szerű UX)
 *//*
export const NewTabPanel: React.FC<NewTabPanelProps> = ({
  title: _title,
  onConfigChange: _onConfigChange,
  onRegionSelect,
  // ✅ ÚJ: Callback prop
  onSearchComplete,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeButton, setActiveButton] = useState('home');

  // Meglévő geo-keresési hook használata
  const { performGeoSearch, isSearching, lastResult } = useSimpleGeoSearch();

  // Felső gombok kezelése
  const handleTopButtonClick = (action: string) => {
    setActiveButton(action);
    console.log(`Felső gomb kattintva: ${action}`);
  };

  // ✅ MÓDOSÍTOTT: Geo-intelligens keresés + Single Tab Mode callback
  const handleSearch = async () => {
    if (!searchTerm.trim()) return;

    console.log(`[NewTabPanel] Geo-keresés indítása: "${searchTerm}"`);

    try {
      // 1. Geo-felismerés a meglévő GeoMatcher-rel
      const geoResult = detectGeoQuery(searchTerm, 'hu');

      if (geoResult.isValid && geoResult.geoMatch) {
        console.log(`[NewTabPanel] Geo találat:`, geoResult.geoMatch);

        // 2. Callback hívása a szülő komponens felé
        if (onRegionSelect) {
          onRegionSelect(geoResult.geoMatch.code, geoResult.geoMatch.type);
        }

        // 3. Hírek lekérése a meglévő hook-kal
        const results = await performGeoSearch(searchTerm);
        console.log(`[NewTabPanel] Keresési eredmények:`, results.length, 'hír');

        // ✅ 3. Single Tab Mode aktiválása (három paraméterrel)
        if (onSearchComplete && results.length > 0) {
          console.log(`[NewTabPanel] Single Tab Mode aktiválás: ${results.length} hír`);
          onSearchComplete(results, searchTerm, geoResult); // ✅ 3 paraméter
          return;
        }
      } else {
        console.log(`[NewTabPanel] "${searchTerm}" nem ismert ország/kontinens`);

        // ✅ 3. Sikertelen keresés is aktiválhatja Single Tab Mode-ot
        if (onSearchComplete) {
          onSearchComplete([], searchTerm, geoResult); // ✅ 3 paraméter
          return;
        }
      }
    } catch (error) {
      console.error('[NewTabPanel] Keresési hiba:', error);

      // ✅ 3. Hiba esetén is aktiválható Single Tab Mode
      if (onSearchComplete) {
        onSearchComplete([], searchTerm, null); // ✅ 3 paraméter
        return;
      }
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.topButtonsBar}>
        <button
          className={`${styles.topButton} ${activeButton === 'home' ? styles.active : ''}`}
          onClick={() => setActiveButton('home')}
        >
          Home
        </button>
        <button
          className={`${styles.topButton} ${activeButton === 'dashboard' ? styles.active : ''}`}
          onClick={() => setActiveButton('dashboard')}
        >
          Dashboard
        </button>
        <button
          className={`${styles.topButton} ${activeButton === 'bookmarks' ? styles.active : ''}`}
          onClick={() => setActiveButton('bookmarks')}
        >
          Bookmarks
        </button>
        <button
          className={`${styles.topButton} ${activeButton === 'history' ? styles.active : ''}`}
          onClick={() => setActiveButton('history')}
        >
          History
        </button>
      </div>

      <div className={styles.centerSection}>
        {activeButton === 'history' ? (
          <HistoryPanel />
        ) : (
          <div className={styles.searchArea}>
            <div className={styles.searchContainer}>
              <input
                type="text"
                className={styles.searchInput}
                placeholder="Search for a country or continent... (e.g. russia, europe)"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyPress={handleKeyPress}
              />
            </div>
            {isSearching && (
              <div
                style={{
                  marginTop: '20px',
                  padding: '10px',
                  background: '#2d2d30',
                  borderRadius: '8px',
                  textAlign: 'center',
                }}
              >
                <p>🔍 Searching in progress...</p>
              </div>
            )}
       
          </div>
        )}
      </div>
    </div>
  );
};

export default NewTabPanel;
*/