// src\components\Tabs\Home\Home.tsx
import * as React from 'react';
import { useState } from 'react';
import { apiClient } from '../../../apiclient/apiClient';

import styles from './Home.module.css';
import { detectGeoQuery, type GeoQueryResult } from '../NewTab/geo/GeoMatcher';
import { useSimpleGeoSearch } from './geo/useSimpleGeoSearch';
import { NewsItem } from '../../../types';
import { HistoryPanel } from '../../History';

export interface HomeProps {
  isActive: boolean;
  title: string;
  onConfigChange?: (mode: 'news' | 'browse' | 'search') => void;
  onRegionSelect?: (region: string, type: 'country' | 'continent' | 'region') => void;
  onSearchComplete?: (results: NewsItem[], query: string, geoResult: GeoQueryResult) => void;
  openMyPageTab?: () => void; // ✅ ÚJ: My tab megnyitó callback
}

/**
 * Home komponens - ✅ ÚJ: Single Tab Mode támogatással
 * Keresés után ELTŰNIK, helyette Panel jelenik meg (Google-szerű UX)
 */
const Home: React.FC<HomeProps> = ({ isActive, title: _title, onConfigChange: _onConfigChange, onRegionSelect, onSearchComplete, openMyPageTab }) => {
  // React hookokat mindig a komponens legelején kell hívni!
  const [searchTerm, setSearchTerm] = useState('');
  const [activeButton, setActiveButton] = useState('home');
  const [isSearching, setIsSearching] = useState(false); // << SAJÁT LOADING ÁLLAPOT
  const { performGeoSearch, lastResult: _lastResult } = useSimpleGeoSearch(); // << AZ "isSearching" KIVÉVE

  if (!isActive) return null;

  // ✅ MÓDOSÍTOTT: Geo-intelligens keresés + Single Tab Mode callback
  const handleSearch = async () => {
    const query = searchTerm.trim();
    if (!query) return;

    console.log(`[Home] Keresés indítása: "${query}"`);
    setIsSearching(true); // << EZ MOST MÁR MŰKÖDIK

    try {
      // 1. Geo-felismerés: eldöntjük, hogy geo- vagy kulcsszavas keresés-e
      const geoResult = detectGeoQuery(query, 'hu');

      // ESET 1: A felhasználó egyértelműen egy ORSZÁGOT/KONTINENST/RÉGIÓT írt be
      if (geoResult.isValid && geoResult.geoMatch && geoResult.type === 'geo_only') {
        console.log(`[Home] GEO-KERESÉS: Találat - ${geoResult.geoMatch.code}`);
        
        // Lefuttatjuk a régi, jól bevált geo-keresést, ami az ország/kontinens híreit kéri le
        const results = await performGeoSearch(query);
        console.log(`[Home] Geo-keresés eredménye: ${results.length} hír`);
        
        if (onSearchComplete) {
          onSearchComplete(results, query, geoResult);
        }
      } 
      // ESET 2: A felhasználó KULCSSZAVAKAT írt be (vagy hibrid keresést indított)
      else {
        console.log(`[Home] KULCSSZAVAS KERESÉS: "${query}"`);
        
        // Meghívjuk az ÚJ, backendet használó keresőnket!
        const searchResponse = await apiClient.searchNews({ q: query, lang: 'hu', limit: 100 });
        
        // Az eredményt átalakítjuk a frontend által várt NewsItem formátumra
        const results: NewsItem[] = searchResponse.results.map(item => ({
          id: String(item.id),
          title: item.title,
          description: item.description,
          url: item.url,
          imageUrl: item.image_url,
          sourceId: item.source_slug,
          country: item.country_code,
          date: item.published_at,
          timestamp: new Date(item.published_at).getTime(),
          // Ezeket az adatokat a backend nem adja vissza, de a típushoz kellenek
          source: item.source_slug, 
          continent: '',
        }));

        console.log(`[Home] Kulcsszavas keresés eredménye: ${results.length} hír`);

        if (onSearchComplete) {
          onSearchComplete(results, query, geoResult);
        }
      }
    } catch (error) {
      console.error('[Home] Keresési hiba:', error);
      if (onSearchComplete) {
        // Hiba esetén is adjunk vissza egy üres eredményt
        const errorGeoResult = detectGeoQuery(query, 'hu');
        onSearchComplete([], query, errorGeoResult);
      }
    } finally {
      setIsSearching(false); // A keresés végén elrejtjük a "Searching..." üzenetet
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
        <button
          className={`${styles.topButton} ${activeButton === 'my' ? styles.active : ''}`}
          onClick={() => {
            setActiveButton('my');
            if (openMyPageTab) openMyPageTab(); // ✅ My tab megnyitása
          }}
        >
          My
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
            {/* Geo-info megjelenítés kikommentelve */}
          </div>
        )}
      </div>
    </div>
  );
};

const MemoizedHome = React.memo(Home);
export default MemoizedHome;
