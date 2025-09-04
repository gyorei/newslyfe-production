// src/components/Tabs/Home/Home.tsx
import * as React from 'react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { apiClient } from '../../../apiclient/apiClient';
import { NewsItem } from '../../../types';
import styles from './Home.module.css';
import { HistoryPanel } from '../../History';
import { detectGeoQuery, type GeoQueryResult } from '../NewTab/geo/GeoMatcher'; // VISSZATETTÜK!
import { convertSearchResultToNewsItem } from '../../../utils/transformers'; // Helyette importáld a központi, típusos transzformert

// ÚJ, HELYES INTERFÉSZ, AMI TÁMOGATJA A GEO EREDMÉNYT IS
export interface HomeProps {
  isActive: boolean;
  title: string;
  onSearchComplete?: (results: NewsItem[], query: string, geoResult: GeoQueryResult) => void;
  onConfigChange?: (mode: 'news' | 'new' | 'search' | 'video') => void;
  openMyPageTab?: () => void;
  openRightPanelWithMode?: (mode: string, category?: string) => void; // <-- ÚJ PROP
}

/**
 * Home komponens - A "Nagy Kereső" központja.
 * Intelligensen eldönti, hogy geo- vagy kulcsszavas keresést indítson.
 */
const Home: React.FC<HomeProps> = ({ isActive, onSearchComplete, openMyPageTab, openRightPanelWithMode }) => { // <-- PROP FOGADÁSA
  const { t } = useTranslation();
  const [searchTerm, setSearchTerm] = useState('');
  const [activeButton, setActiveButton] = useState('home');
  const [isSearching, setIsSearching] = useState(false);

  // 🛡️ Biztonságos input kezelés
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value
      .replace(/<[^>]*>/g, '') // HTML tagek eltávolítása
      .replace(/[<>"'&]/g, '') // XSS karakterek
      .replace(/(javascript|data|vbscript):/gi, '') // Veszélyes URL protokollok
      .replace(/[;'--]/g, '') // SQL injection karakterek
      // eslint-disable-next-line no-control-regex
      .replace(/[\u0000-\u001F\u007F-\u009F]/g, '') // Kontroll karakterek
      .trim();
    
    // DoS védelem - hossz korlát
    if (value.length > 100) {
      value = value.substring(0, 100);
    }
    
    setSearchTerm(value);
  };

  if (!isActive) return null;

  // A HELYREÁLLÍTOTT, VÉGLEGES handleSearch FÜGGVÉNY
  const handleSearch = async () => {
    const query = searchTerm.trim();
    if (!query) return;

    console.log(`[Home] Keresés indítása: "${query}"`);
    setIsSearching(true);

    try {
      // 1. ÉRTELMEZÉS: Mindig lefuttatjuk a geo-felismerőt
      const geoResult = detectGeoQuery(query, 'hu');
      let results: NewsItem[] = [];

      // 2. DÖNTÉS: Az értelmezés eredménye alapján választunk utat
      
      // ESET 1: A felhasználó egyértelműen egy ORSZÁGOT/KONTINENST/RÉGIÓT írt be
      if (geoResult.isValid && geoResult.geoMatch && geoResult.type === 'geo_only') {
        console.log(`[Home] GEO-KERESÉS indul: Találat - ${geoResult.geoMatch.code}`);
        
        // Közvetlen API hívás a megfelelő végpontra
        const response = await apiClient.getLocalNews({ country: geoResult.geoMatch.code });
        results = (response as { news: NewsItem[] }).news;
        console.log(`[Home] Geo-keresés eredménye: ${results.length} hír`);
      } 
      // ESET 2: A felhasználó KULCSSZAVAKAT írt be
      else {
        console.log(`[Home] GLOBÁLIS KULCSSZAVAS KERESÉS indul: "${query}"`);
        
        const searchParams: { q: string; limit: number } = { q: query, limit: 2000 };
        const searchResponse = await apiClient.searchNews(searchParams); // 4. Módosított API hívás
        results = searchResponse.results.map(convertSearchResultToNewsItem);
        console.log(`[Home] Kulcsszavas keresés eredménye: ${results.length} hír`);
      }

      // 3. EREDMÉNY ÁTADÁSA
      if (onSearchComplete) {
        onSearchComplete(results, query, geoResult); // Visszaadjuk a geoResult-ot is
      }
    } catch (error) {
      console.error('[Home] Keresési hiba:', error);
      if (onSearchComplete) {
        const errorGeoResult = detectGeoQuery(query, 'hu');
        onSearchComplete([], query, errorGeoResult);
      }
    } finally {
      setIsSearching(false);
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
          {t('home.nav.home')}
        </button>
        <button
          className={`${styles.topButton} ${activeButton === 'dashboard' ? styles.active : ''}`}
          onClick={() => setActiveButton('dashboard')}
        >
          {t('home.nav.dashboard')}
        </button>
        <button
          className={`${styles.topButton} ${activeButton === 'bookmarks' ? styles.active : ''}`}
          onClick={() => setActiveButton('bookmarks')}
        >
          {t('home.nav.bookmarks')}
        </button>
        <button
          className={`${styles.topButton} ${activeButton === 'history' ? styles.active : ''}`}
          onClick={() => setActiveButton('history')}
        >
          {t('home.nav.history')}
        </button>
        <button
          className={`${styles.topButton} ${activeButton === 'my' ? styles.active : ''}`}
          onClick={() => {
            setActiveButton('my');
            if (openMyPageTab) openMyPageTab();
          }}
        >
          {t('home.nav.my')}
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
                placeholder={t('home.search.placeholder')}
                value={searchTerm}
                onChange={handleInputChange}
                onKeyPress={handleKeyPress}
              />
              {/* Settings gomb - kikommentezve */}
              {/* 
              <button
                className={styles.searchOptionsButton}
                onClick={() => openRightPanelWithMode?.('settings', 'search')}
                title={t('home.search.settingsTitle')}
                style={{ fontSize: 20, background: 'none', border: 'none', cursor: 'pointer', marginLeft: 8 }}
              >
                ⚙️
              </button>
              */}
              
              {/* Keresés gomb */}
              <button
                className={styles.searchButton}
                onClick={handleSearch}
                disabled={isSearching || !searchTerm.trim()}
                title={t('home.search.searchButton', 'Search')}
                style={{ 
                  fontSize: 20, 
                  background: 'none', 
                  border: 'none', 
                  marginLeft: 8,
                  opacity: isSearching || !searchTerm.trim() ? 0.5 : 1
                }}
              >
                {'>'}
              </button>
            </div>
            {isSearching && (
              <div className={styles.searchingIndicator}>
                <p>{t('home.search.searching')}</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

const MemoizedHome = React.memo(Home);
export default MemoizedHome;